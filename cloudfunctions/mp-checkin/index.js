// 云函数: mp-checkin — 打卡管理
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { action } = event;
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  const users = db.collection('common_user');
  const u = await users.where({ openid }).get();
  if (u.data.length === 0) return { code: -1, msg: '用户未注册' };
  const userId = u.data[0]._id;

  try {
    switch (action) {
      case 'checkin': {
        const { placeId, petId } = event;
        if (!placeId || !petId) return { code: -1, msg: '缺少 placeId 或 petId' };

        // 同日去重
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const exist = await db.collection('mp_checkin')
          .where({
            user_id: userId, pet_id: petId, place_id: placeId,
            created_at: db.command.gte(today)
          }).get();
        if (exist.data.length > 0) return { code: -1, msg: '今日已打卡' };

        // 尝试获取2D形象快照
        let avatarSnapshot = '';
        try {
          const avatarRes = await cloud.callFunction({
            name: 'wp-avatar',
            data: { action: 'getByPet', petId }
          });
          if (avatarRes.result && avatarRes.result.code === 1) {
            avatarSnapshot = avatarRes.result.data.baseAppearance?.resource || '';
          }
        } catch (e) { /* 穿搭不可用，使用默认头像 */ }

        await db.collection('mp_checkin').add({
          data: {
            user_id: userId, pet_id: petId, place_id: placeId,
            avatar_snapshot: avatarSnapshot,
            created_at: new Date()
          }
        });
        return { code: 1, data: { success: true } };
      }

      case 'listByPlace': {
        const { placeId } = event;
        if (!placeId) return { code: -1, msg: '缺少 placeId' };
        const result = await db.collection('mp_checkin')
          .where({ place_id: placeId })
          .orderBy('created_at', 'desc')
          .limit(20).get();
        const list = result.data.map(c => ({
          userId: c.user_id, petId: c.pet_id,
          avatarSnapshot: c.avatar_snapshot, createdAt: c.created_at
        }));
        return { code: 1, data: { checkins: list, total: list.length } };
      }

      case 'myCheckins': {
        const result = await db.collection('mp_checkin')
          .where({ user_id: userId })
          .orderBy('created_at', 'desc')
          .limit(50).get();
        const placeIds = [...new Set(result.data.map(c => c.place_id))];
        const placeMap = {};
        if (placeIds.length > 0) {
          const places = await db.collection('mp_place')
            .where({ _id: db.command.in(placeIds) }).get();
          places.data.forEach(p => { placeMap[p._id] = { name: p.name, category: p.category }; });
        }
        const list = result.data.map(c => ({
          placeId: c.place_id, placeName: (placeMap[c.place_id] || {}).name || '未知地点',
          petId: c.pet_id, avatarSnapshot: c.avatar_snapshot, createdAt: c.created_at
        }));
        return { code: 1, data: { checkins: list } };
      }

      default:
        return { code: 0, data: { message: 'mp-checkin — action 不支持' } };
    }
  } catch (err) {
    console.error('[mp-checkin] Error:', err);
    return { code: -1, msg: err.message };
  }
};
