// 云函数: gb-order — 团购订单管理（含支付处理 + 服饰解锁联动）
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { action } = event;
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  // 鉴权
  const users = db.collection('common_user');
  const userResult = await users.where({ openid }).get();
  if (userResult.data.length === 0) return { code: -1, msg: '用户未注册' };
  const userId = userResult.data[0]._id;

  try {
    switch (action) {
      case 'create': {
        const { productId, quantity = 1, amountTotal, addressId, specChoice } = event;
        if (!productId || !amountTotal) return { code: -1, msg: '缺少 productId 或 amountTotal' };

        // 检查商品是否存在且有库存
        const productResult = await db.collection('gb_product').doc(productId).get();
        if (!productResult.data || !productResult.data._id) return { code: -1, msg: '商品不存在' };
        if (productResult.data.stock <= 0) return { code: -1, msg: '已售罄' };

        const result = await db.collection('gb_order').add({
          data: {
            user_id: userId,
            product_id: productId,
            spec_choice: specChoice || {},
            quantity,
            amount_total: amountTotal,
            status: 'pending',
            address_id: addressId || null,
            wp_item_added: 0,
            created_at: new Date(),
            updated_at: new Date()
          }
        });

        // 初始化团购进度
        await db.collection('gb_progress').add({
          data: {
            product_id: productId,
            batch_no: 'GB' + Date.now(),
            current_count: 1,
            target_count: productResult.data.min_group_size || 2,
            status: 'ongoing',
            created_at: new Date()
          }
        });

        return { code: 1, data: { orderId: result._id } };
      }

      case 'paySuccess': {
        // 支付成功回调 — 更新状态 + 解锁服饰 + 销量+1
        const { orderId } = event;
        if (!orderId) return { code: -1, msg: '缺少 orderId' };

        const orderResult = await db.collection('gb_order').doc(orderId).get();
        if (!orderResult.data || !orderResult.data._id) return { code: -1, msg: '订单不存在' };
        const order = orderResult.data;
        if (order.status !== 'pending') return { code: 1, data: { msg: '订单状态非待支付' } };

        // 扣库存 + 增销量
        try {
          await db.collection('gb_product').doc(order.product_id).update({
            data: {
              stock: db.command.inc(-order.quantity),
              sold_count: db.command.inc(order.quantity)
            }
          });
        } catch (e) {
          console.warn('[gb-order] 库存更新失败', e);
        }

        // 更新订单状态
        await db.collection('gb_order').doc(orderId).update({
          data: {
            status: 'paid',
            paid_at: new Date(),
            updated_at: new Date()
          }
        });

        // 解锁 2D 服饰（联动 #2）
        if (order.wp_item_added === 0) {
          const productResult = await db.collection('gb_product').doc(order.product_id).get();
          if (productResult.data && productResult.data.wp_item_id) {
            try {
              await cloud.callFunction({
                name: 'wp-items',
                data: {
                  action: 'addItem',
                  userId: order.user_id,
                  itemId: productResult.data.wp_item_id
                }
              });
            } catch (e) {
              console.error('[gb-order] 服饰解锁失败', e);
              // 失败不阻塞订单状态更新，后续由定时任务补发
            }
            await db.collection('gb_order').doc(orderId).update({
              data: { wp_item_added: 1 }
            });
          }
        }

        // 更新团购进度
        try {
          await db.collection('gb_progress')
            .where({ product_id: order.product_id, status: 'ongoing' })
            .update({ data: { current_count: db.command.inc(1) } });
        } catch (e) {
          console.warn('[gb-order] 团购进度更新失败', e);
        }

        return { code: 1, data: { success: true } };
      }

      case 'list': {
        const { status, page = 1, pageSize = 20 } = event;
        let query = db.collection('gb_order').where({ user_id: userId });

        if (status && status !== 'all') {
          query = query.where({ status });
        }

        const totalResult = await query.count();
        const result = await query
          .orderBy('created_at', 'desc')
          .skip((page - 1) * pageSize)
          .limit(pageSize)
          .get();

        // 关联商品名称
        const productIds = [...new Set(result.data.map(o => o.product_id))];
        const productMap = {};
        if (productIds.length > 0) {
          const products = await db.collection('gb_product')
            .where({ _id: db.command.in(productIds) }).get();
          products.data.forEach(p => {
            productMap[p._id] = { name: p.name, thumbnail: (p.images || [])[0] || '' };
          });
        }

        const orders = result.data.map(o => ({
          orderId: o._id,
          productId: o.product_id,
          productName: (productMap[o.product_id] || {}).name || '商品',
          productThumbnail: (productMap[o.product_id] || {}).thumbnail || '',
          specChoice: o.spec_choice,
          quantity: o.quantity,
          amountTotal: o.amount_total,
          status: o.status,
          trackingNo: o.tracking_no,
          wpItemAdded: !!o.wp_item_added,
          paidAt: o.paid_at,
          shippedAt: o.shipped_at,
          completedAt: o.completed_at,
          createdAt: o.created_at
        }));

        return { code: 1, data: { orders, total: totalResult.total } };
      }

      case 'detail': {
        const { orderId } = event;
        if (!orderId) return { code: -1, msg: '缺少 orderId' };
        const result = await db.collection('gb_order').doc(orderId).get();
        if (!result.data || !result.data._id) return { code: -1, msg: '订单不存在' };
        if (result.data.user_id !== userId && userId !== 'admin') return { code: -2, msg: '无权访问' };

        const o = result.data;

        // 获取商品信息
        let productName = '', productThumbnail = '';
        try {
          const p = await db.collection('gb_product').doc(o.product_id).get();
          if (p.data && p.data._id) {
            productName = p.data.name;
            productThumbnail = (p.data.images || [])[0] || '';
          }
        } catch (e) { /* 忽略 */ }

        return {
          code: 1,
          data: {
            orderId: o._id,
            productId: o.product_id,
            productName,
            productThumbnail,
            specChoice: o.spec_choice,
            quantity: o.quantity,
            amountTotal: o.amount_total,
            status: o.status,
            trackingNo: o.tracking_no,
            wpItemAdded: !!o.wp_item_added,
            addressId: o.address_id,
            paidAt: o.paid_at,
            shippedAt: o.shipped_at,
            completedAt: o.completed_at,
            createdAt: o.created_at
          }
        };
      }

      default:
        return { code: 0, data: { message: 'gb-order — action 不支持' } };
    }
  } catch (err) {
    console.error('[gb-order] Error:', err);
    return { code: -1, msg: err.message };
  }
};
