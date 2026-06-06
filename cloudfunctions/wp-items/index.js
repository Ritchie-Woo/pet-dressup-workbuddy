// 云函数: wp-items — 服饰道具管理
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

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
      case 'listAll': {
        // 全量服饰列表（用于换装编辑器选择）
        const result = await db.collection('wp_item')
          .where({ is_active: 1 })
          .orderBy('category', 'asc')
          .orderBy('rarity', 'desc')
          .get();
        const items = result.data.map(i => ({
          itemId: i._id,
          name: i.name,
          category: i.category,
          thumbnailUrl: i.thumbnail_url,
          resourceUrl: i.resource_url,
          rarity: i.rarity,
          source: i.source,
          groupBuyId: i.group_buy_id || null
        }));
        return { code: 1, data: { items } };
      }

      case 'getUserItems': {
        // 用户拥有的服饰
        const owned = db.collection('wp_user_item')
          .where({ user_id: userId });
        const ownedResult = await owned.get();
        const ownedIds = ownedResult.data.map(o => o.item_id);

        if (ownedIds.length === 0) {
          return { code: 1, data: { items: [] } };
        }

        // 批量获取服饰详情
        const itemsResult = await db.collection('wp_item')
          .where({ _id: _.in(ownedIds), is_active: 1 }).get();

        const items = itemsResult.data.map(i => ({
          itemId: i._id,
          name: i.name,
          category: i.category,
          thumbnailUrl: i.thumbnail_url,
          resourceUrl: i.resource_url,
          rarity: i.rarity,
          source: i.source,
          groupBuyId: i.group_buy_id || null,
          obtainedAt: ownedResult.data.find(o => o.item_id === i._id)?.obtained_at
        }));
        return { code: 1, data: { items } };
      }

      case 'addItem': {
        // 幂等添加服饰（由团购模块调用）
        const { userId: targetUserId, itemId } = event;
        if (!targetUserId || !itemId) return { code: -1, msg: '缺少 userId 或 itemId' };

        // 幂等检查
        const exist = await db.collection('wp_user_item')
          .where({ user_id: targetUserId, item_id: itemId }).get();
        if (exist.data.length > 0) {
          return { code: 1, data: { success: true, msg: '已拥有' } };
        }

        await db.collection('wp_user_item').add({
          data: {
            user_id: targetUserId,
            item_id: itemId,
            obtained_at: new Date()
          }
        });
        return { code: 1, data: { success: true } };
      }

      case 'getByCategory': {
        const { category } = event;
        if (!category) return { code: -1, msg: '缺少 category' };
        const result = await db.collection('wp_item')
          .where({ category, is_active: 1 }).get();
        const items = result.data.map(i => ({
          itemId: i._id,
          name: i.name,
          category: i.category,
          thumbnailUrl: i.thumbnail_url,
          resourceUrl: i.resource_url,
          rarity: i.rarity,
          source: i.source
        }));
        return { code: 1, data: { items } };
      }

      default:
        return { code: 0, data: { message: 'wp-items — action 不支持' } };
    }
  } catch (err) {
    console.error('[wp-items] Error:', err);
    return { code: -1, msg: err.message };
  }
};
