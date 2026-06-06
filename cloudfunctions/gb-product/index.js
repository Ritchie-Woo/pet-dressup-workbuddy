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

      default:
        return { code: 0, data: { message: 'gb-product — action 不支持' } };
    }
  } catch (err) {
    console.error('[gb-product] Error:', err);
    return { code: -1, msg: err.message };
  }
};
