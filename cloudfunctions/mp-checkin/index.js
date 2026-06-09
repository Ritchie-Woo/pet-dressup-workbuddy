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
        if (!placeId) return { code: -1, msg: '缺少 placeId' };

        const now = new Date();
        const checkinDate = [
          now.getFullYear(),
          String(now.getMonth() + 1).padStart(2, '0'),
          String(now.getDate()).padStart(2, '0')
        ].join('-');

        let avatarSnapshot = '';
        if (petId) {
          try {
            const avatarRes = await cloud.callFunction({
              name: 'wp-avatar',
              data: { action: 'getByPet', petId }
            });
            if (avatarRes.result && avatarRes.result.code === 1) {
              avatarSnapshot = avatarRes.result.data.baseAppearance?.resource || '';
            }
          } catch (e) { /* 穿搭不可用 */ }
        }

        // 直接写入，唯一索引做去重保障
        try {
          await db.collection('mp_checkin').add({
            data: {
              user_id: userId,
              pet_id: petId || '',
              place_id: placeId,
              avatar_snapshot: avatarSnapshot,
              checkin_date: checkinDate,
              created_at: now
            }
          });
          return { code: 1, data: { success: true } };
        } catch (e) {
          return { code: -1, msg: '已踩点，今天来过啦～' };
        }
        // 异步刷新统计缓存（不阻塞踩点响应）
        cloud.callFunction({
          name: 'mp-place-stats',
          data: { action: 'refresh', placeId }
        }).catch(e => console.error('[mp-checkin] stats refresh failed:', e.message));
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

      // 查询当前用户今日是否已在指定地点踩点（用于前端渲染按钮状态）
      case 'todayStatus': {
        const { placeId } = event;
        if (!placeId) return { code: -1, msg: '缺少 placeId' };

        const now = new Date();
        const checkinDate = [
          now.getFullYear(),
          String(now.getMonth() + 1).padStart(2, '0'),
          String(now.getDate()).padStart(2, '0')
        ].join('-');

        try {
          const exist = await db.collection('mp_checkin')
            .where({ user_id: userId, place_id: placeId, checkin_date: checkinDate })
            .get();
          return { code: 1, data: { checkedInToday: exist.data.length > 0 } };
        } catch (e) {
          // 集合不存在时视为未踩点（首次踩点会自动创建集合）
          return { code: 1, data: { checkedInToday: false } };
        }
      }

      // P1: 标签投票（§5.6）
      case 'tagVote': {
        const { placeId, tagId, vote } = event;
        if (!placeId || !tagId) return { code: -1, msg: '缺少参数' };
        if (vote !== 1 && vote !== -1) return { code: -1, msg: 'vote 必须为 1 或 -1' };

        // 唯一索引 (user_id, place_id, tag_id) 保证一人一地点一标签仅一票
        try {
          await db.collection('mp_place_tag_vote').add({
            data: {
              user_id: userId,
              place_id: placeId,
              tag_id: tagId,
              vote,
              checkin_id: '', // 本期不关联具体打卡记录
              timestamp: Date.now()
            }
          });
        } catch (e) {
          return { code: -1, msg: '已投票，不可修改' };
        }

        // 异步刷新统计
        cloud.callFunction({
          name: 'mp-place-stats',
          data: { action: 'refresh', placeId }
        }).catch(e => console.error('[mp-checkin] stats refresh failed:', e.message));

        return { code: 1, data: { success: true } };
      }

      // 查询当前用户对该地点的所有历史投票
      case 'myTagVotes': {
        const { placeId } = event;
        if (!placeId) return { code: -1, msg: '缺少 placeId' };
        const result = await db.collection('mp_place_tag_vote')
          .where({ user_id: userId, place_id: placeId })
          .get();
        const cache = {};
        result.data.forEach(v => { cache[v.tag_id] = v.vote; });
        return { code: 1, data: { cache } };
      }

      default:
        return { code: 0, data: { message: 'mp-checkin — action 不支持' } };
    }
  } catch (err) {
    console.error('[mp-checkin] Error:', err);
    return { code: -1, msg: err.message };
  }
};
