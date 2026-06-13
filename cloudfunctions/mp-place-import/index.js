// 云函数: mp-place-import — 批量导入宠物友好场所到 mp_place 集合
// 用法：手动触发（云开发控制台），action=import, items=[...]
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { action, items, dryRun } = event;

  if (action !== 'import') {
    return { code: -1, msg: '未知 action' };
  }

  if (!Array.isArray(items) || items.length === 0) {
    return { code: -1, msg: 'items 为空或格式错误' };
  }

  // dryRun 模式：只校验不写入
  if (dryRun) {
    return {
      code: 1,
      data: {
        total: items.length,
        sample: items.slice(0, 2),
        message: `dry run ok, 将写入 ${items.length} 条`,
      }
    };
  }

  // 1. 拉取已有数据用于去重
  const existSet = new Set();
  const existing = await db.collection('mp_place')
    .where({ source: 'user_collected' })
    .field({ name: true, address: true })
    .limit(1000)
    .get();
  for (const doc of existing.data) {
    existSet.add(`${doc.name}|||${doc.address}`);
  }
  console.log(`[import] 已有 ${existSet.size} 条 source=user_collected 数据`);

  // 2. 逐条写入
  let inserted = 0, duped = 0, failed = 0;
  const errors = [];
  const insertIds = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    // 必填校验
    if (!item.name || !item.category || !item.address) {
      failed++;
      errors.push({ index: i, name: item.name, reason: 'missing required field' });
      continue;
    }

    // 去重
    const key = `${item.name}|||${item.address}`;
    if (existSet.has(key)) {
      duped++;
      continue;
    }

    // 写入
    try {
      const doc = {
        name: String(item.name),
        category: String(item.category),
        address: String(item.address),
        city: String(item.city || ''),
        latitude: Number(item.latitude) || 0,
        longitude: Number(item.longitude) || 0,
        phone: String(item.phone || ''),
        business_hours: String(item.business_hours || ''),
        pet_policy: String(item.pet_policy || ''),
        images: Array.isArray(item.images) ? item.images : [],
        rating: Number(item.rating) || 0,
        review_count: 0,
        source: 'user_collected',
        source_url: String(item.source_url || ''),
        source_date: item.source_date || null,
        status: 'approved',  // 手动录入直接通过
        amap_id: '',         // POI 搜索结果没有 amap_id
        created_at: new Date(),
        updated_at: new Date(),
      };
      const res = await db.collection('mp_place').add({ data: doc });
      insertIds.push(res._id);
      existSet.add(key);
      inserted++;
    } catch (e) {
      failed++;
      errors.push({ index: i, name: item.name, reason: e.message });
    }
  }

  console.log(`[import] 完成: 新增 ${inserted}, 重复 ${duped}, 失败 ${failed}`);

  return {
    code: 1,
    data: {
      total: items.length,
      inserted,
      duped,
      failed,
      insertIds: insertIds.slice(0, 20),  // 只回前 20 个 id
      errors: errors.slice(0, 10),
    }
  };
};
