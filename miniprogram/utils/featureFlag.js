/**
 * Feature Flag 系统
 *
 * 启动时从云端拉取全量 flag 配置，本地缓存 + 有效期机制。
 * Flag key 定义参考 PRD 4.3 节。
 */

const STORAGE_KEY = 'feature_flags';
const STORAGE_KEY_UPDATED = 'feature_flags_updated';
const CACHE_TTL = 30 * 60 * 1000; // 30 分钟

// 默认值（云端不可用时降级使用）
const DEFAULTS = {
  // 模块开关
  module_wp_enabled: true,
  module_gb_enabled: true,
  module_mp_enabled: false,
  module_mbti_enabled: false,

  // 子功能开关
  mbti_social_mode: false,
  wp_share_enabled: true,
  gb_checkout_enabled: true,
  mp_checkin_enabled: false
};

/**
 * 从云端拉取 feature flags
 * 优先使用缓存，缓存过期后异步刷新
 */
function loadFlags() {
  const cached = _getFromCache();
  if (cached && !_isExpired()) {
    return Promise.resolve(cached);
  }

  // 先从正式接口拉取，失败后用云函数
  return _fetchFromCloud()
    .then((flags) => {
      _saveToCache(flags);
      return flags;
    })
    .catch(() => {
      // 降级：缓存过期但拉取失败时，继续使用过期缓存
      if (cached) {
        console.warn('[FeatureFlag] 拉取失败，使用过期缓存');
        return cached;
      }
      // 无缓存，使用默认值
      console.warn('[FeatureFlag] 使用默认 flag 配置');
      _saveToCache(DEFAULTS);
      return DEFAULTS;
    });
}

/**
 * 判定某个 flag 是否启用
 */
function isEnabled(key, defaultValue) {
  const app = getApp();
  if (app && app.globalData && app.globalData.featureFlags) {
    const val = app.globalData.featureFlags[key];
    if (typeof val !== 'undefined') {
      return !!val;
    }
  }
  // 降级：从本地存储获取
  const cached = _getFromCache();
  if (cached && typeof cached[key] !== 'undefined') {
    return !!cached[key];
  }
  return defaultValue !== undefined ? defaultValue : !!DEFAULTS[key];
}

/**
 * 获取所有 flags（同步，从 App.globalData 读取）
 */
function getAllFlags() {
  const app = getApp();
  if (app && app.globalData && app.globalData.featureFlags) {
    return app.globalData.featureFlags;
  }
  return _getFromCache() || DEFAULTS;
}

/**
 * 手动刷新 flags（用于管理后台修改后）
 */
function refreshFlags() {
  return _fetchFromCloud()
    .then((flags) => {
      _saveToCache(flags);
      const app = getApp();
      if (app) {
        app.globalData.featureFlags = flags;
      }
      return flags;
    });
}

// ===== 私有函数 =====

function _fetchFromCloud() {
  return new Promise((resolve, reject) => {
    if (!wx.cloud) {
      reject(new Error('云开发不可用'));
      return;
    }
    wx.cloud.callFunction({
      name: 'common_featureFlag',
      data: { action: 'getAll' }
    }).then((res) => {
      if (res.result && res.result.data) {
        resolve(res.result.data);
      } else {
        reject(new Error('返回数据格式错误'));
      }
    }).catch(reject);
  });
}

function _getFromCache() {
  try {
    const raw = wx.getStorageSync(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function _saveToCache(flags) {
  try {
    wx.setStorageSync(STORAGE_KEY, JSON.stringify(flags));
    wx.setStorageSync(STORAGE_KEY_UPDATED, Date.now());
    // 同步到 App.globalData
    const app = getApp();
    if (app) {
      app.globalData.featureFlags = flags;
    }
  } catch (err) {
    console.error('[FeatureFlag] 缓存写入失败', err);
  }
}

function _isExpired() {
  try {
    const updated = wx.getStorageSync(STORAGE_KEY_UPDATED);
    if (!updated) return true;
    return Date.now() - updated > CACHE_TTL;
  } catch {
    return true;
  }
}

module.exports = {
  loadFlags,
  isEnabled,
  getAllFlags,
  refreshFlags,
  DEFAULTS
};
