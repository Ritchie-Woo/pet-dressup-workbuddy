// 云函数: common-address — 收货地址 CURD
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

// 确保集合存在（首次调用自动创建）
async function ensureCollection() {
  try {
    await db.collection('user_address').count();
  } catch (e) {
    // 集合不存在，创建第一条空记录后删除
    const res = await db.collection('user_address').add({
      data: { _placeholder: true, created_at: new Date() }
    });
    await db.collection('user_address').doc(res._id).remove();
  }
}

exports.main = async (event, context) => {
  await ensureCollection();
  const { action } = event;
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  const users = db.collection('common_user');
  const userResult = await users.where({ openid }).get();
  if (userResult.data.length === 0) return { code: -1, msg: '用户未注册' };
  const userId = userResult.data[0]._id;

  try {
    switch (action) {

      case 'list': {
        const result = await db.collection('user_address')
          .where({ user_id: userId })
          .orderBy('is_default', 'desc')
          .get();
        return {
          code: 1,
          data: result.data.map(a => ({
            id: a._id,
            receiverName: a.receiver_name,
            phone: a.phone,
            province: a.province,
            city: a.city,
            district: a.district,
            detail: a.detail,
            isDefault: a.is_default
          }))
        };
      }

      case 'save': {
        const { id, receiverName, phone, province, city, district, detail, isDefault } = event;
        if (!receiverName || !phone || !detail) return { code: -1, msg: '信息不完整' };

        // 设为默认时，取消其他默认
        if (isDefault) {
          await db.collection('user_address')
            .where({ user_id: userId, is_default: true })
            .update({ data: { is_default: false } });
        }

        if (id) {
          // 编辑
          await db.collection('user_address').doc(id).update({
            data: {
              receiver_name: receiverName,
              phone, province, city, district, detail,
              is_default: isDefault || false,
              updated_at: new Date()
            }
          });
          return { code: 1, data: { id } };
        } else {
          // 新增
          const result = await db.collection('user_address').add({
            data: {
              user_id: userId,
              receiver_name: receiverName,
              phone, province, city, district, detail,
              is_default: isDefault || false,
              created_at: new Date(),
              updated_at: new Date()
            }
          });
          return { code: 1, data: { id: result._id } };
        }
      }

      case 'delete': {
        const { id } = event;
        if (!id) return { code: -1, msg: '缺少 id' };
        await db.collection('user_address').doc(id).remove();
        return { code: 1, data: {} };
      }

      default:
        return { code: 0, data: { message: 'common-address — action 不支持' } };
    }
  } catch (err) {
    console.error('[common-address] Error:', err);
    return { code: -1, msg: err.message };
  }
};
