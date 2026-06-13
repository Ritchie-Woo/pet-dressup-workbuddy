// 云函数: mp-place-geocode — 批量坐标反查（高德 Web API）
// 两个 action：
//   1. geocodeBatch - 用 address 字段反查（精度一般）
//   2. geocodeByName - 用 name + city 调 POI 搜索（精度高，门址级）
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const https = require('https');

const AMAP_KEY = 'cf68ea9ece103737372aa138f1163444';
const AMAP_HOST = 'restapi.amap.com';

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('JSON parse: ' + data.substring(0, 200))); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => req.destroy());
    req.setTimeout(15000);
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// 方式 1：地址反查
async function geocodeByAddress(address, city) {
  const cityName = city.replace('市', '');
  const params = new URLSearchParams({
    key: AMAP_KEY,
    address,
    city: cityName,
    output: 'JSON',
    extensions: 'base',
  });
  const url = `https://${AMAP_HOST}/v3/geocode/geo?${params.toString()}`;
  const result = await httpGet(url);
  if (result.status !== '1') return { ok: false, error: result.info || 'API error' };
  if (!result.geocodes || result.geocodes.length === 0) return { ok: false, error: 'no result' };
  const [lng, lat] = result.geocodes[0].location.split(',').map(Number);
  return {
    ok: true,
    latitude: lat,
    longitude: lng,
    formatted: result.geocodes[0].formatted_address,
    level: result.geocodes[0].level,
  };
}

// 方式 2：POI 关键词搜索（精度高）
// 优先匹配 city 范围内的同名 POI
async function geocodeByName(name, city) {
  const cityName = city.replace('市', '');
  const params = new URLSearchParams({
    key: AMAP_KEY,
    keywords: name,
    city: cityName,
    citylimit: 'true',       // 严格限制在指定城市
    offset: '5',             // 多取几个候选
    page: '1',
    extensions: 'base',
    output: 'JSON',
  });
  const url = `https://${AMAP_HOST}/v3/place/text?${params.toString()}`;
  const result = await httpGet(url);
  if (result.status !== '1') return { ok: false, error: result.info || 'API error' };
  if (!result.pois || result.pois.length === 0) return { ok: false, error: 'no POI' };

  // 选第一个（高德按相关度排序，最匹配的排第一）
  const poi = result.pois[0];
  const [lng, lat] = poi.location.split(',').map(Number);
  return {
    ok: true,
    latitude: lat,
    longitude: lng,
    formatted: poi.address || '',
    name_actual: poi.name,
    type: poi.type,
    level: poi.type.split(';')[0] || '未知',  // 第一个分类作为 level
    distance: poi.distance || null,
  };
}

exports.main = async (event, context) => {
  const { action, items } = event;

  // === 方式 1：地址反查 ===
  if (action === 'geocodeBatch') {
    const results = [];
    const batchSize = 20;
    const delay = 300;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      try {
        const r = await geocodeByAddress(item.address, item.city);
        results.push({ name: item.name, ...r });
      } catch (e) {
        results.push({ name: item.name, ok: false, error: e.message });
      }
      if ((i + 1) % 10 === 0) console.log(`[geocode] ${i + 1} / ${items.length}`);
      if ((i + 1) % batchSize === 0) await sleep(1000);
      else await sleep(delay);
    }

    const ok = results.filter(r => r.ok).length;
    return { code: 1, data: { total: results.length, ok, fail: results.length - ok, results } };
  }

  // === 方式 2：POI 关键词搜索（推荐）===
  if (action === 'geocodeByName') {
    const results = [];
    const batchSize = 20;
    const delay = 400;  // POI 搜索稍慢一点，给宽一点间隔

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      try {
        const r = await geocodeByName(item.name, item.city);
        results.push({
          name: item.name,
          address_input: item.address,  // 保留原始输入方便对比
          ...r,
        });
      } catch (e) {
        results.push({ name: item.name, ok: false, error: e.message });
      }
      if ((i + 1) % 10 === 0) console.log(`[geocode-by-name] ${i + 1} / ${items.length}`);
      if ((i + 1) % batchSize === 0) await sleep(1500);
      else await sleep(delay);
    }

    const ok = results.filter(r => r.ok).length;
    return { code: 1, data: { total: results.length, ok, fail: results.length - ok, results } };
  }

  return { code: -1, msg: '未知 action' };
};
