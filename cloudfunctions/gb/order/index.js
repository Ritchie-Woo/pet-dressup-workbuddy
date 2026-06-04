// 云函数: gb/order - 团购订单
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { action } = event;
  const { OPENID } = cloud.getWXContext();
  
  try {
    switch (action) {
      default:
        return { code: 0, data: { message: '团购订单 - 待实现' } };
    }
  } catch (err) {
    console.error('[gb/order] Error:', err);
    return { code: -1, msg: err.message };
  }
};
