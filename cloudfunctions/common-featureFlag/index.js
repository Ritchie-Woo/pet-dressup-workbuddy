// 云函数: common-featureFlag — Feature Flag 配置查询
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

// 硬编码默认值 — 云端数据库不可用时降级使用
const DEFAULTS = {
  module_wp_enabled: true,
  module_gb_enabled: true,
  module_mp_enabled: false,
  module_mbti_enabled: false,
  mbti_social_mode: false,
  wp_share_enabled: true,
  gb_checkout_enabled: true,
  mp_checkin_enabled: false
};

exports.main = async (event, context) => {
  const { action } = event;

  try {
    switch (action) {
      case 'getAll': {
        // 从数据库读取全量 flag，失败则降级到硬编码默认值
        try {
          const result = await db.collection('sys_feature_flag').get();
          if (result.data && result.data.length > 0) {
            const flags = {};
            result.data.forEach(row => {
              flags[row.flag_key] = !!row.flag_value;
            });
            return { code: 1, data: flags };
          }
        } catch (dbErr) {
          console.warn('[featureFlag] DB 读取失败，使用默认值', dbErr);
        }
        return { code: 1, data: DEFAULTS };
      }

      case 'getFlag': {
        const { key } = event;
        if (!key) return { code: -1, msg: '缺少 flag_key' };
        try {
          const result = await db.collection('sys_feature_flag')
            .where({ flag_key: key }).get();
          if (result.data && result.data.length > 0) {
            return { code: 1, data: { [key]: !!result.data[0].flag_value } };
          }
        } catch (dbErr) {
          console.warn('[featureFlag] DB 读取失败', dbErr);
        }
        // 降级
        return {
          code: 1,
          data: { [key]: DEFAULTS[key] !== undefined ? DEFAULTS[key] : false }
        };
      }

      default:
        return { code: 0, data: { message: 'common-featureFlag — action 不支持' } };
    }
  } catch (err) {
    console.error('[common-featureFlag] Error:', err);
    return { code: -1, msg: err.message, data: DEFAULTS };
  }
};
