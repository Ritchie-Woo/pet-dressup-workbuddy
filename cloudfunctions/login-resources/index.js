// 云函数: login-resources — 登录页粒子动效素材
// 无需鉴权，返回最近用户上传的宠物头像云文件 ID
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { count = 10 } = event;

  try {
    // 查询最近创建的宠物，avatar_url 非空
    const result = await db.collection('common_pet')
      .where({
        is_active: 1,
        avatar_url: db.command.neq('')
      })
      .orderBy('created_at', 'desc')
      .limit(count)
      .field({ avatar_url: true })
      .get();

    const fileIDs = result.data.map(p => p.avatar_url).filter(Boolean);

    if (fileIDs.length === 0) {
      return { code: 1, data: { urls: [] } };
    }

    // 批量获取临时 HTTPS URL
    const urlResult = await cloud.getTempFileURL({ fileList: fileIDs });
    const urls = urlResult.fileList
      .filter(f => f.status === 0 && f.tempFileURL)
      .map(f => f.tempFileURL);

    return { code: 1, data: { urls, fileIDs } };
  } catch (err) {
    console.error('[login-resources]', err);
    return { code: -1, msg: err.message };
  }
};
