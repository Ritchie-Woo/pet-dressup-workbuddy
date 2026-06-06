// 云函数: common-user — 用户登录/注册/信息管理
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { action } = event;
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  try {
    switch (action) {
      case 'login': {
        // 微信登录 — 返回用户信息（不存在则注册）
        const { nickname, avatarUrl } = event;
        const users = db.collection('common_user');
        const exist = await users.where({ openid }).get();

        if (exist.data.length > 0) {
          // 已有用户 — 更新信息
          const user = exist.data[0];
          if (nickname || avatarUrl) {
            await users.doc(user._id).update({
              data: {
                nickname: nickname || user.nickname,
                avatar_url: avatarUrl || user.avatar_url,
                updated_at: new Date()
              }
            });
            user.nickname = nickname || user.nickname;
            user.avatar_url = avatarUrl || user.avatar_url;
          }
          return { code: 1, data: user };
        }

        // 新用户 — 注册
        const result = await users.add({
          data: {
            openid,
            nickname: nickname || '宠友',
            avatar_url: avatarUrl || '',
            created_at: new Date(),
            updated_at: new Date()
          }
        });
        const newUser = { _id: result._id, openid, nickname: nickname || '宠友', avatar_url: avatarUrl || '' };
        return { code: 1, data: newUser };
      }

      case 'getUserInfo': {
        const { userId } = event;
        if (!userId) return { code: -1, msg: '缺少 userId' };
        const user = await db.collection('common_user').doc(userId).get();
        if (!user.data || !user.data._id) return { code: -1, msg: '用户不存在' };
        return {
          code: 1,
          data: {
            nickname: user.data.nickname,
            avatarUrl: user.data.avatar_url
          }
        };
      }

      case 'getOpenid':
        return { code: 1, data: { openid } };

      default:
        return { code: 0, data: { message: 'common-user — action 不支持' } };
    }
  } catch (err) {
    console.error('[common-user] Error:', err);
    return { code: -1, msg: err.message };
  }
};
