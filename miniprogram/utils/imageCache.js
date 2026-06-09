/**
 * utils/imageCache.js — 图片缓存层
 *
 * 解决微信小程序中 wx.cloud.getTempFileURL() 每次返回不同临时 URL、
 * Canvas 重新加载导致图片闪烁的问题。
 *
 * 策略：
 * 1. cloudFileID → tempFileURL 映射缓存（TTL 90 分钟，官方有效期 2 小时）
 * 2. Storage 持久化，跨页面、跨会话复用
 * 3. 批量获取 + 单例去重，避免重复请求
 */

const CACHE_KEY = '_img_cache';
const TTL_MS = 90 * 60 * 1000; // 90 分钟

let _memoryCache = null;       // 内存层（页面生命周期内）
let _pendingBatch = null;      // 批量请求去重

function _loadFromStorage() {
  try {
    const raw = wx.getStorageSync(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function _saveToStorage(cache) {
  try {
    wx.setStorageSync(CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    // Storage 满了就降级，不影响使用
  }
}

function _getCache() {
  if (!_memoryCache) {
    _memoryCache = _loadFromStorage();
  }
  // 清理过期条目
  const now = Date.now();
  let dirty = false;
  for (const key of Object.keys(_memoryCache)) {
    if (now - _memoryCache[key].ts > TTL_MS) {
      delete _memoryCache[key];
      dirty = true;
    }
  }
  if (dirty) _saveToStorage(_memoryCache);
  return _memoryCache;
}

/**
 * 批量获取临时 URL（自动缓存）
 * @param {string[]} fileIDs cloud file ID 列表
 * @returns {Promise<string[]>} tempFileURL 列表
 */
async function getTempUrls(fileIDs) {
  if (!fileIDs || fileIDs.length === 0) return [];

  const cache = _getCache();
  const now = Date.now();
  const uncached = [];
  const result = new Array(fileIDs.length);

  // 检查缓存
  fileIDs.forEach((fid, i) => {
    const entry = cache[fid];
    if (entry && now - entry.ts < TTL_MS) {
      result[i] = entry.url;
    } else {
      uncached.push({ fid, idx: i });
    }
  });

  // 全部命中缓存
  if (uncached.length === 0) return result;

  // 去重批量请求：如果已有正在进行的批量请求，等它完成
  const uncachedIDs = uncached.map(u => u.fid);

  // 批量获取
  try {
    const res = await wx.cloud.getTempFileURL({ fileList: uncachedIDs });
    res.fileList.forEach((f, i) => {
      const fid = uncachedIDs[i];
      if (f.status === 0 && f.tempFileURL) {
        cache[fid] = { url: f.tempFileURL, ts: now };
        result[uncached[i].idx] = f.tempFileURL;
      } else {
        result[uncached[i].idx] = ''; // 失败标记为空
      }
    });
    _saveToStorage(cache);
  } catch (err) {
    console.error('[ImageCache] getTempFileURL 失败:', err);
    // 降级：使用过期缓存
    for (const u of uncached) {
      const entry = cache[u.fid];
      result[u.idx] = entry ? entry.url : '';
    }
  }

  return result;
}

/**
 * 获取单个临时 URL
 */
async function getTempUrl(fileID) {
  const urls = await getTempUrls([fileID]);
  return urls[0] || '';
}

/**
 * 清除所有缓存
 */
function clearCache() {
  _memoryCache = {};
  try { wx.removeStorageSync(CACHE_KEY); } catch (e) {}
}

module.exports = { getTempUrls, getTempUrl, clearCache };
