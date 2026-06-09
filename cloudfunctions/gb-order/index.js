// 云函数: gb-order — 团购订单管理（含支付处理 + 服饰解锁联动）
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

// 确保集合存在
async function ensureCollection(name) {
  try { await db.collection(name).count(); } catch (e) {
    const res = await db.collection(name).add({ data: { _init: true, created_at: new Date() } });
    await db.collection(name).doc(res._id).remove();
  }
}

exports.main = async (event, context) => {
  await ensureCollection('gb_order');
  await ensureCollection('gb_progress');
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

        // 更新团购进度：复用已有 ongoing 记录，无则新建
        const existingProgress = await db.collection('gb_progress')
          .where({ product_id: productId, status: 'ongoing' })
          .limit(1)
          .get();

        if (existingProgress.data.length > 0) {
          await db.collection('gb_progress').doc(existingProgress.data[0]._id).update({
            data: { current_count: db.command.inc(1) }
          });
        } else {
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
        }

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

        // 团购进度已在 create 中统计（下单即付款），此处不再重复累加

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

      // ─── 卖家端 actions ───

      case 'sellerOrderDetail': {
        const { orderId } = event;
        if (!orderId) return { code: -1, msg: '缺少 orderId' };

        const orderResult = await db.collection('gb_order').doc(orderId).get();
        if (!orderResult.data || !orderResult.data._id) return { code: -1, msg: '订单不存在' };
        const o = orderResult.data;

        // 校验商品归属
        const prodResult = await db.collection('gb_product').doc(o.product_id).get();
        if (!prodResult.data || prodResult.data.creator_id !== userId) {
          return { code: -2, msg: '无权查看该订单' };
        }

        let productName = '', productThumbnail = '';
        if (prodResult.data) {
          productName = prodResult.data.name;
          productThumbnail = (prodResult.data.images || [])[0] || '';
        }

        // 获取买家信息
        let buyerNickname = '';
        try {
          const buyer = await db.collection('common_user').doc(o.user_id).get();
          if (buyer.data) buyerNickname = buyer.data.nickname || '';
        } catch (e) { /* ignore */ }

        // 获取收货地址
        let address = null;
        if (o.address_id) {
          try {
            const addrResult = await db.collection('common_address').doc(o.address_id).get();
            if (addrResult.data) {
              const a = addrResult.data;
              address = {
                receiverName: a.receiver_name,
                phone: a.phone,
                fullAddress: [a.province, a.city, a.district, a.detail].filter(Boolean).join(' ')
              };
            }
          } catch (e) { /* ignore */ }
        }

        return {
          code: 1,
          data: {
            orderId: o._id,
            productId: o.product_id,
            productName,
            productThumbnail,
            buyerNickname,
            specChoice: o.spec_choice,
            quantity: o.quantity,
            amountTotal: o.amount_total,
            status: o.status,
            trackingNo: o.tracking_no,
            address,
            paidAt: o.paid_at,
            shippedAt: o.shipped_at,
            completedAt: o.completed_at,
            createdAt: o.created_at
          }
        };
      }

      case 'myProductOrders': {
        // 查出用户的所有商品 ID
        const myProducts = await db.collection('gb_product')
          .where({ creator_id: userId })
          .field({ _id: true })
          .get();
        const myProductIds = myProducts.data.map(p => p._id);
        if (myProductIds.length === 0) return { code: 1, data: { orders: [], total: 0 } };

        const { status, page = 1, pageSize = 20 } = event;
        let query = db.collection('gb_order').where({ product_id: _.in(myProductIds) });
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
        const productMap = {};
        myProducts.data.forEach(p => { productMap[p._id] = p.name; });
        // 补充非团长商品（理论上不会有，防御性处理）
        const extraIds = [...new Set(result.data.map(o => o.product_id).filter(id => !productMap[id]))];
        if (extraIds.length > 0) {
          const extras = await db.collection('gb_product').where({ _id: _.in(extraIds) }).get();
          extras.data.forEach(p => { productMap[p._id] = p.name; });
        }

        // 关联买家昵称
        const buyerIds = [...new Set(result.data.map(o => o.user_id))];
        const buyerMap = {};
        if (buyerIds.length > 0) {
          const buyers = await db.collection('common_user').where({ _id: _.in(buyerIds) }).get();
          buyers.data.forEach(u => { buyerMap[u._id] = u.nickname || '用户'; });
        }

        const orders = result.data.map(o => ({
          orderId: o._id,
          productId: o.product_id,
          productName: productMap[o.product_id] || '商品',
          buyerNickname: buyerMap[o.user_id] || '用户',
          specChoice: o.spec_choice,
          quantity: o.quantity,
          amountTotal: o.amount_total,
          status: o.status,
          trackingNo: o.tracking_no,
          createdAt: o.created_at,
          paidAt: o.paid_at,
          shippedAt: o.shipped_at
        }));

        return { code: 1, data: { orders, total: totalResult.total } };
      }

      case 'ship': {
        const { orderId, shipMethod, carrierCode, carrierName, trackingNo } = event;
        if (!orderId) return { code: -1, msg: '缺少 orderId' };

        // 自行寄出需传快递信息
        if (shipMethod === 'manual' && (!trackingNo || !carrierCode)) {
          return { code: -1, msg: '自行寄出需要填写快递公司和单号' };
        }

        const orderResult = await db.collection('gb_order').doc(orderId).get();
        if (!orderResult.data || orderResult.data.status !== 'paid') {
          return { code: -1, msg: '订单状态异常' };
        }

        // 校验商品归属
        const productResult = await db.collection('gb_product').doc(orderResult.data.product_id).get();
        if (!productResult.data || productResult.data.creator_id !== userId) {
          return { code: -2, msg: '无权操作该订单' };
        }

        const shipData = {
          status: 'shipped',
          ship_method: shipMethod || 'manual',
          shipped_at: new Date(),
          updated_at: new Date()
        };
        if (carrierCode) shipData.carrier_code = carrierCode;
        if (carrierName) shipData.carrier_name = carrierName;
        if (trackingNo) shipData.tracking_no = trackingNo;

        await db.collection('gb_order').doc(orderId).update({ data: shipData });

        return { code: 1, data: { success: true } };
      }

      case 'mySalesStats': {
        const myProducts = await db.collection('gb_product')
          .where({ creator_id: userId })
          .get();
        const myProductIds = myProducts.data.map(p => p._id);

        if (myProductIds.length === 0) {
          return { code: 1, data: { totalSales: 0, totalOrders: 0, pendingShip: 0, topProducts: [] } };
        }

        // 全部订单
        const allOrders = await db.collection('gb_order')
          .where({ product_id: _.in(myProductIds) })
          .get();

        const totalSales = allOrders.data
          .filter(o => o.status !== 'pending' && o.status !== 'refunded')
          .reduce((sum, o) => sum + (o.amount_total || 0), 0);

        const pendingShip = allOrders.data.filter(o => o.status === 'paid').length;

        // 热销 Top10
        const salesByProduct = {};
        allOrders.data.forEach(o => {
          if (o.status !== 'pending' && o.status !== 'refunded') {
            salesByProduct[o.product_id] = (salesByProduct[o.product_id] || 0) + (o.quantity || 1);
          }
        });
        const topProducts = Object.entries(salesByProduct)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([pid, qty]) => {
            const p = myProducts.data.find(x => x._id === pid);
            return {
              productId: pid,
              name: p ? p.name : '商品',
              soldCount: qty
            };
          });

        return {
          code: 1,
          data: {
            totalSales: Math.round(totalSales * 100) / 100,
            totalOrders: allOrders.data.length,
            pendingShip,
            topProducts
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
