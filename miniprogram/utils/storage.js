/**
 * 本地存储封装
 * 统一管理 Storage key，避免冲突
 */

const PREFIX = 'petwb_';

/**
 * 同步设置
 */
function setSync(key, value) {
  try {
    wx.setStorageSync(PREFIX + key, value);
    return true;
  } catch (err) {
    console.error('[Storage] setSync 失败', key, err);
    return false;
  }
}

/**
 * 同步获取
 */
function getSync(key) {
  try {
    return wx.getStorageSync(PREFIX + key);
  } catch (err) {
    console.error('[Storage] getSync 失败', key, err);
    return null;
  }
}

/**
 * 异步设置
 */
function setAsync(key, value) {
  return new Promise((resolve, reject) => {
    wx.setStorage({
      key: PREFIX + key,
      data: value,
      success: () => resolve(true),
      fail: reject
    });
  });
}

/**
 * 异步获取
 */
function getAsync(key) {
  return new Promise((resolve, reject) => {
    wx.getStorage({
      key: PREFIX + key,
      success: (res) => resolve(res.data),
      fail: (err) => {
        // errMsg 包含 "not found" 时返回 null
        if (err.errMsg && err.errMsg.includes('not found')) {
          resolve(null);
        } else {
          reject(err);
        }
      }
    });
  });
}

/**
 * 删除
 */
function remove(key) {
  try {
    wx.removeStorageSync(PREFIX + key);
    return true;
  } catch (err) {
    console.error('[Storage] remove 失败', key, err);
    return false;
  }
}

/**
 * 清除所有 pet-wb 相关存储
 */
function clearAll() {
  try {
    const info = wx.getStorageInfoSync();
    (info.keys || []).forEach((key) => {
      if (key.startsWith(PREFIX)) {
        wx.removeStorageSync(key);
      }
    });
    return true;
  } catch (err) {
    console.error('[Storage] clearAll 失败', err);
    return false;
  }
}

module.exports = {
  setSync,
  getSync,
  setAsync,
  getAsync,
  remove,
  clearAll
};
