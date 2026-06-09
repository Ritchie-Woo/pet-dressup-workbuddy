// 云函数: gb-product — 团购商品管理
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { action } = event;

  try {
    switch (action) {
      case 'list': {
        const { category, keyword, page = 1, pageSize = 20 } = event;
        let query = db.collection('gb_product').where({ is_active: 1 });

        if (category && category !== 'all') {
          query = query.where({ category });
        }
        if (keyword) {
          query = query.where({
            name: db.RegExp({ regexp: keyword, options: 'i' })
          });
        }

        const totalResult = await query.count();
        const result = await query
          .orderBy('sold_count', 'desc')
          .skip((page - 1) * pageSize)
          .limit(pageSize)
          .get();

        const products = result.data.map(p => ({
          productId: p._id,
          name: p.name,
          category: p.category,
          priceOriginal: p.price_original,
          priceGroup: p.price_group,
          thumbnail: p.images && p.images.length > 0 ? p.images[0] : '',
          soldCount: p.sold_count,
          minGroupSize: p.min_group_size,
          stock: p.stock,
          isSoldOut: p.stock <= 0
        }));

        return { code: 1, data: { products, total: totalResult.total } };
      }

      case 'detail': {
        const { productId } = event;
        if (!productId) return { code: -1, msg: '缺少 productId' };
        const result = await db.collection('gb_product').doc(productId).get();
        if (!result.data || !result.data._id) return { code: -1, msg: '商品不存在' };

        const p = result.data;
        return {
          code: 1,
          data: {
            productId: p._id,
            name: p.name,
            description: p.description,
            category: p.category,
            priceOriginal: p.price_original,
            priceGroup: p.price_group,
            images: p.images || [],
            specs: p.specs || [],
            stock: p.stock,
            minGroupSize: p.min_group_size,
            soldCount: p.sold_count,
            wpItemId: p.wp_item_id || null,
            isSoldOut: p.stock <= 0
          }
        };
      }

      case 'getWpItem': {
        const { productId } = event;
        if (!productId) return { code: -1, msg: '缺少 productId' };
        const result = await db.collection('gb_product').doc(productId).get();
        if (!result.data || !result.data._id || !result.data.wp_item_id) {
          return { code: -1, msg: '该商品无关联服饰' };
        }

        const itemResult = await db.collection('wp_item').doc(result.data.wp_item_id).get();
        if (!itemResult.data || !itemResult.data._id) return { code: -1, msg: '关联服饰不存在' };

        return {
          code: 1,
          data: {
            wpItemId: itemResult.data._id,
            name: itemResult.data.name,
            category: itemResult.data.category,
            thumbnailUrl: itemResult.data.thumbnail_url
          }
        };
      }

      // ─── 卖家端 actions ───

      case 'myProductList': {
        const wxContext = cloud.getWXContext();
        const userResult = await db.collection('common_user').where({ openid: wxContext.OPENID }).get();
        if (userResult.data.length === 0) return { code: -1, msg: '用户未注册' };
        const userId = userResult.data[0]._id;
        const { page = 1, pageSize = 20 } = event;

        const totalResult = await db.collection('gb_product').where({ creator_id: userId }).count();
        const result = await db.collection('gb_product')
          .where({ creator_id: userId })
          .orderBy('created_at', 'desc')
          .skip((page - 1) * pageSize)
          .limit(pageSize)
          .get();

        const products = result.data.map(p => ({
          productId: p._id,
          name: p.name,
          category: p.category,
          priceOriginal: p.price_original,
          priceGroup: p.price_group,
          thumbnail: p.images && p.images.length > 0 ? p.images[0] : '',
          stock: p.stock,
          soldCount: p.sold_count,
          isActive: !!p.is_active
        }));

        return { code: 1, data: { products, total: totalResult.total } };
      }

      case 'createProduct': {
        const wxContext = cloud.getWXContext();
        const userResult = await db.collection('common_user').where({ openid: wxContext.OPENID }).get();
        if (userResult.data.length === 0) return { code: -1, msg: '用户未注册' };
        const userId = userResult.data[0]._id;
        const { name, description, category, priceOriginal, priceGroup, images, specs, stock, minGroupSize, groupType } = event;
        if (!name || !priceGroup) return { code: -1, msg: '缺少商品名称或团购价' };

        const result = await db.collection('gb_product').add({
          data: {
            name,
            description: description || '',
            category: category || 'other',
            price_original: priceOriginal || priceGroup,
            price_group: priceGroup,
            images: images || [],
            specs: specs || [],
            stock: stock || 0,
            min_group_size: minGroupSize || 2,
            sold_count: 0,
            wp_item_id: null,
            creator_id: userId,
            group_type: groupType || 'normal',
            is_active: 0,
            created_at: new Date(),
            updated_at: new Date()
          }
        });

        return { code: 1, data: { productId: result._id } };
      }

      case 'updateProduct': {
        const wxContext = cloud.getWXContext();
        const userResult = await db.collection('common_user').where({ openid: wxContext.OPENID }).get();
        if (userResult.data.length === 0) return { code: -1, msg: '用户未注册' };
        const userId = userResult.data[0]._id;
        const { productId } = event;
        if (!productId) return { code: -1, msg: '缺少 productId' };

        const existing = await db.collection('gb_product').doc(productId).get();
        if (!existing.data || existing.data.creator_id !== userId) {
          return { code: -2, msg: '无权编辑该商品' };
        }

        const updateData = { updated_at: new Date() };
        const fields = ['name', 'description', 'category', 'priceOriginal', 'priceGroup', 'images', 'specs', 'stock', 'minGroupSize'];
        const fieldMap = { priceOriginal: 'price_original', priceGroup: 'price_group', minGroupSize: 'min_group_size' };

        fields.forEach(f => {
          if (event[f] !== undefined) {
            const key = fieldMap[f] || f;
            updateData[key] = event[f];
          }
        });

        await db.collection('gb_product').doc(productId).update({ data: updateData });
        return { code: 1, data: { success: true } };
      }

      case 'toggleProductStatus': {
        const wxContext = cloud.getWXContext();
        const userResult = await db.collection('common_user').where({ openid: wxContext.OPENID }).get();
        if (userResult.data.length === 0) return { code: -1, msg: '用户未注册' };
        const userId = userResult.data[0]._id;
        const { productId } = event;
        if (!productId) return { code: -1, msg: '缺少 productId' };

        const existing = await db.collection('gb_product').doc(productId).get();
        if (!existing.data || existing.data.creator_id !== userId) {
          return { code: -2, msg: '无权操作该商品' };
        }

        const newActive = existing.data.is_active ? 0 : 1;
        await db.collection('gb_product').doc(productId).update({
          data: { is_active: newActive, updated_at: new Date() }
        });

        return { code: 1, data: { isActive: !!newActive } };
      }

      default:
        return { code: 0, data: { message: 'gb-product — action 不支持' } };
    }
  } catch (err) {
    console.error('[gb-product] Error:', err);
    return { code: -1, msg: err.message };
  }
};
