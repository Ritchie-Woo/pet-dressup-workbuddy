// 云函数: gb-progress — 团购进度管理
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { action } = event;
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  try {
    switch (action) {
      case 'myProgress': {
        const userResult = await db.collection('common_user').where({ openid }).get();
        if (userResult.data.length === 0) return { code: -1, msg: '用户未注册' };
        const userId = userResult.data[0]._id;

        // 查出用户的商品
        const myProducts = await db.collection('gb_product')
          .where({ creator_id: userId })
          .field({ _id: true, name: true, min_group_size: true })
          .get();

        if (myProducts.data.length === 0) {
          return { code: 1, data: { progressList: [] } };
        }

        const myProductIds = myProducts.data.map(p => p._id);
        const productMap = {};
        myProducts.data.forEach(p => { productMap[p._id] = p; });

        // 查询这些商品的团购进度
        const progressResult = await db.collection('gb_progress')
          .where({ product_id: _.in(myProductIds) })
          .orderBy('created_at', 'desc')
          .get();

        const progressList = progressResult.data.map(pg => {
          const product = productMap[pg.product_id];
          return {
            progressId: pg._id,
            productId: pg.product_id,
            productName: product ? product.name : '商品',
            batchNo: pg.batch_no,
            currentCount: pg.current_count,
            targetCount: pg.target_count,
            status: pg.status,
            percent: pg.target_count > 0 ? Math.min(100, Math.round(pg.current_count / pg.target_count * 100)) : 0,
            createdAt: pg.created_at
          };
        });

        return { code: 1, data: { progressList } };
      }

      default:
        return { code: 0, data: { message: 'gb-progress — action 不支持' } };
    }
  } catch (err) {
    console.error('[gb-progress] Error:', err);
    return { code: -1, msg: err.message };
  }
};
