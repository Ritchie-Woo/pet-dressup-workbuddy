// 云函数: mp-place-seed — 从高德地图批量拉取宠物友好POI，写入 mp_place 集合
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const https = require('https');

// === 配置 ===
const AMAP_KEY = 'cf68ea9ece103737372aa138f1163444';
const AMAP_HOST = 'restapi.amap.com';
const AMAP_BASE_PATH = '/v3/place/text';

// 区划数据
const DISTRICTS = {
  南京: ['玄武区', '秦淮区', '建邺区', '鼓楼区', '浦口区', '栖霞区', '雨花台区', '江宁区', '六合区', '溧水区', '高淳区'],
  上海: ['黄浦区', '徐汇区', '长宁区', '静安区', '普陀区', '虹口区', '杨浦区', '闵行区', '宝山区', '嘉定区', '浦东新区', '金山区', '松江区', '青浦区', '奉贤区', '崇明区'],
};

// 分批配置：南京 2 批，上海 3 批，餐厅酒店 1 批
const BATCHES = [
  { city: '南京', districts: ['玄武区', '秦淮区', '建邺区', '鼓楼区', '浦口区', '栖霞区'] },
  { city: '南京', districts: ['雨花台区', '江宁区', '六合区', '溧水区', '高淳区'] },
  { city: '上海', districts: ['黄浦区', '徐汇区', '长宁区', '静安区', '普陀区', '虹口区'] },
  { city: '上海', districts: ['杨浦区', '闵行区', '宝山区', '嘉定区', '浦东新区'] },
  { city: '上海', districts: ['金山区', '松江区', '青浦区', '奉贤区', '崇明区'] },
  { city: '南京', districts: ['玄武区', '秦淮区', '建邺区', '鼓楼区', '浦口区', '栖霞区', '雨花台区', '江宁区'], extra: true },
  { city: '上海', districts: ['黄浦区', '徐汇区', '长宁区', '静安区', '普陀区', '虹口区', '杨浦区', '闵行区'], extra: true },
];

// 搜索配置：关键词 → 分类映射（区级搜索 5 页够了）
const SEARCH_TASKS = [
  { keywords: '宠物医院', category: 'hospital', maxPages: 5 },
  { keywords: '宠物店', category: 'pet_store', maxPages: 5 },
  { keywords: '宠物美容', category: 'pet_store', maxPages: 5 },
  { keywords: '宠物公园', category: 'park', maxPages: 3 },
  { keywords: '宠物友好|宠物咖啡|猫咖|狗咖', category: 'cafe', maxPages: 5 },
];

// 餐厅 & 酒店搜索（batch 5，单独跑一次）
const EXTRA_TASKS = [
  { keywords: '宠物友好餐厅|带狗餐厅|可带宠物餐厅', category: 'restaurant', maxPages: 5 },
  { keywords: '宠物友好酒店|允许宠物酒店|可带狗酒店', category: 'hotel', maxPages: 5 },
];

const PAGE_SIZE = 25;
const API_DELAY_MS = 250; // 调用间隔 250ms，稳一点

// === 工具函数 ===

function httpGet(urlPath) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: AMAP_HOST,
      path: urlPath,
      method: 'GET',
      timeout: 15000,
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('JSON parse error: ' + data.substring(0, 200))); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    req.end();
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** 高德POI → mp_place 格式 */
function transformPoi(poi, category, city) {
  const [lng, lat] = (poi.location || '0,0').split(',').map(Number);

  const policyMap = {
    hospital: '宠物医院，建议提前电话预约',
    pet_store: '欢迎带宠物进店',
    park: '可遛宠，请牵绳并清理便便',
    cafe: '宠物友好，具体政策请咨询店家',
  };

  const images = (poi.photos || []).map(p => (p && p.url) || '').filter(Boolean).slice(0, 5);
  const rating = poi.biz_ext && poi.biz_ext.rating ? parseFloat(poi.biz_ext.rating) : 0;

  return {
    name: String(poi.name || ''),
    category,
    address: String(poi.address || ''),
    city: String(city),
    latitude: lat || 0,
    longitude: lng || 0,
    phone: String(poi.tel || '').replace(/;+/g, ' / ').substring(0, 200),
    business_hours: '',
    pet_policy: String(policyMap[category] || ''),
    images,
    rating: isNaN(rating) ? 0 : rating,
    review_count: 0,
    status: 'approved',
    source: 'amap_seed',
    amap_id: String(poi.id || ''),
    created_at: new Date(),
    updated_at: new Date(),
  };
}

/** 搜索单页 */
async function searchPage(keywords, city, page) {
  const params = new URLSearchParams({
    key: AMAP_KEY,
    keywords,
    city,
    offset: String(PAGE_SIZE),
    page: String(page),
    extensions: 'all',
  });
  const path = `${AMAP_BASE_PATH}?${params.toString()}`;
  return httpGet(path);
}

/** 搜索关键词全部分页 */
async function searchAllPages(keywords, city, maxPages) {
  const allPois = [];
  let total = 0;

  for (let page = 1; page <= maxPages; page++) {
    const result = await searchPage(keywords, city, page);

    if (result.status !== '1') {
      console.log(`  [${city}][${keywords}] API异常: ${JSON.stringify(result)}`);
      break;
    }

    if (page === 1) {
      total = parseInt(result.count) || 0;
      console.log(`  [${city}][${keywords}] 总 ${total} 条，预计 ${Math.ceil(total / PAGE_SIZE)} 页`);
    }

    const pois = result.pois || [];
    if (pois.length === 0) break;

    allPois.push(...pois);
    if (pois.length < PAGE_SIZE) break;

    await sleep(API_DELAY_MS);
  }

  return { pois: allPois, total };
}

// === 主函数 ===

exports.main = async (event, context) => {
  const { action = 'seed', batch } = event;

  // 解析搜索范围
  let scope; // [{ city, area, label, extra }]
  let isExtra = false;
  if (batch !== undefined) {
    const cfg = BATCHES[parseInt(batch)];
    if (!cfg) return { code: -1, msg: `无效批次: ${batch}，有效范围 0-${BATCHES.length - 1}` };
    isExtra = cfg.extra || false;
    scope = cfg.districts.map(d => ({ city: cfg.city, area: d, label: `${cfg.city}${d}`, extra: isExtra }));
  } else {
    scope = [{ city: '南京', area: '南京', label: '南京' }, { city: '上海', area: '上海', label: '上海' }];
  }

  const tasks = isExtra ? EXTRA_TASKS : SEARCH_TASKS;
  const estimateCalls = scope.length * tasks.reduce((s, t) => s + t.maxPages, 0);
  console.log(`[mp-place-seed] action=${action} batch=${batch} extra=${isExtra} 区域数=${scope.length} API预估=${estimateCalls}`);

  try {
    // ======== action: preview ========
    if (action === 'preview') {
      const preview = [];
      for (const { city, area, label } of scope) {
        for (const task of tasks) {
          console.log(`[预览] ${label}: ${task.keywords}`);
          const { pois, total } = await searchAllPages(task.keywords, area, 2);
          preview.push({
            label, city, keywords: task.keywords, category: task.category,
            total, previewCount: pois.length,
            samples: pois.slice(0, 3).map(p => ({ name: p.name, address: p.address, rating: p.biz_ext?.rating })),
          });
          await sleep(API_DELAY_MS);
        }
      }
      const existing = await db.collection('mp_place').where({ source: 'amap_seed' }).count();
      return { code: 1, data: { preview, existingAmapCount: existing.total, note: '确认后用 action=seed batch=N 写入' } };
    }

    // ======== action: seed ========
    if (action === 'seed') {
      const now = new Date();
      let totalInserted = 0, totalDuped = 0;
      const stats = [];

      // 一次拉取所有已有数据到内存
      const existSet = new Set();
      const existing = await db.collection('mp_place')
        .where({ source: 'amap_seed' }).field({ name: true, address: true }).limit(1000).get();
      for (const doc of existing.data) existSet.add(`${doc.name}|||${doc.address}`);
      console.log(`[种子] 已有 ${existSet.size} 条，用于全局去重`);

      for (const { city, area, label } of scope) {
        for (const task of tasks) {
          const fullLabel = `[${label}][${task.keywords}]`;
          console.log(`${fullLabel} 开始搜索...`);
          const { pois } = await searchAllPages(task.keywords, area, task.maxPages);
          console.log(`${fullLabel} 共获取 ${pois.length} 条`);

          let inserted = 0, duped = 0;
          for (const poi of pois) {
            if (!poi.name) { duped++; continue; }
            const key = `${poi.name}|||${poi.address || ''}`;
            if (existSet.has(key)) { duped++; continue; }

            try {
              const place = transformPoi(poi, task.category, city);
              await db.collection('mp_place').add({ data: place });
              existSet.add(key);
              inserted++;
            } catch (addErr) {
              console.log(`  [跳过] ${poi.name}: ${addErr.message}`);
              duped++;
            }
          }

          console.log(`${fullLabel}: 新增 ${inserted}，去重 ${duped}`);
          stats.push({ label, city, keywords: task.keywords, category: task.category, total: pois.length, inserted, duped });
          totalInserted += inserted;
          totalDuped += duped;
          await sleep(API_DELAY_MS);
        }
      }

      console.log(`[mp-place-seed] 完成！总计新增 ${totalInserted}，去重 ${totalDuped}`);
      return {
        code: 1,
        data: { batch, scope: scope.map(s => s.label), totalInserted, totalDuped, apiCalls: estimateCalls, stats, timestamp: now.toISOString() },
      };
    }

    // ======== action: clear ========
    if (action === 'clear') {
      const existing = await db.collection('mp_place').where({ source: 'amap_seed' }).count();
      if (existing.total === 0) return { code: 1, data: { cleared: 0, msg: '无 amap_seed 数据' } };
      let deleted = 0;
      while (deleted < existing.total) {
        const batch = await db.collection('mp_place').where({ source: 'amap_seed' }).limit(20).get();
        if (batch.data.length === 0) break;
        for (const doc of batch.data) await db.collection('mp_place').doc(doc._id).remove();
        deleted += batch.data.length;
      }
      return { code: 1, data: { cleared: deleted } };
    }

    return { code: -1, msg: '未知 action: ' + action };

  } catch (err) {
    console.error('[mp-place-seed] 异常:', err);
    return { code: -1, msg: err.message || String(err) };
  }
};
