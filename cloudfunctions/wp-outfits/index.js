// 云函数: wp-outfits — 穿搭方案管理
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { action } = event;
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  const users = db.collection('common_user');
  const userResult = await users.where({ openid }).get();
  if (userResult.data.length === 0) return { code: -1, msg: '用户未注册' };
  const userId = userResult.data[0]._id;

  try {
    switch (action) {
      case 'save': {
        const { avatarId, name, slots } = event;
        if (!avatarId || !slots) return { code: -1, msg: '缺少 avatarId 或 slots' };

        // 检查数量上限
        const countResult = await db.collection('wp_outfit')
          .where({ user_id: userId, avatar_id: avatarId }).count();
        if (countResult.total >= 5) {
          return { code: -1, msg: '最多保存 5 套方案' };
        }

        const result = await db.collection('wp_outfit').add({
          data: {
            user_id: userId,
            avatar_id: avatarId,
            name: name || '我的穿搭',
            slots,
            is_current: 0,
            like_count: 0,
            created_at: new Date(),
            updated_at: new Date()
          }
        });
        return { code: 1, data: { outfitId: result._id } };
      }

      case 'list': {
        const { avatarId } = event;
        if (!avatarId) return { code: -1, msg: '缺少 avatarId' };
        const result = await db.collection('wp_outfit')
          .where({ user_id: userId, avatar_id: avatarId })
          .orderBy('created_at', 'desc')
          .get();
        const outfits = result.data.map(o => ({
          outfitId: o._id,
          avatarId: o.avatar_id,
          name: o.name,
          slots: o.slots,
          isCurrent: !!o.is_current,
          likeCount: o.like_count,
          createdAt: o.created_at
        }));
        return { code: 1, data: { outfits } };
      }

      case 'setCurrent': {
        const { outfitId } = event;
        if (!outfitId) return { code: -1, msg: '缺少 outfitId' };

        const outfitResult = await db.collection('wp_outfit').doc(outfitId).get();
        if (!outfitResult.data || !outfitResult.data._id) return { code: -1, msg: '方案不存在' };
        if (outfitResult.data.user_id !== userId) return { code: -2, msg: '无权操作' };

        // 取消该 avatar 下其他方案的 is_current
        const avatarId = outfitResult.data.avatar_id;
        await db.collection('wp_outfit')
          .where({ user_id: userId, avatar_id: avatarId, is_current: 1 })
          .update({ data: { is_current: 0 } });

        // 设置当前方案
        await db.collection('wp_outfit').doc(outfitId)
          .update({ data: { is_current: 1, updated_at: new Date() } });

        // 同步更新 wp_avatar 的 current_outfit
        await db.collection('wp_avatar').doc(avatarId).update({
          data: { current_outfit: outfitResult.data.slots, updated_at: new Date() }
        });

        return { code: 1, data: { success: true, slots: outfitResult.data.slots } };
      }

      case 'delete': {
        const { outfitId } = event;
        if (!outfitId) return { code: -1, msg: '缺少 outfitId' };

        const result = await db.collection('wp_outfit').doc(outfitId).get();
        if (!result.data || !result.data._id) return { code: -1, msg: '方案不存在' };
        if (result.data.user_id !== userId) return { code: -2, msg: '无权操作' };

        await db.collection('wp_outfit').doc(outfitId).remove();
        return { code: 1, data: { success: true } };
      }

      default:
        return { code: 0, data: { message: 'wp-outfits — action 不支持' } };
    }
  } catch (err) {
    console.error('[wp-outfits] Error:', err);
    return { code: -1, msg: err.message };
  }
};
