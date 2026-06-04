/**
 * 云函数调用封装
 * 统一处理错误、超时、重试
 */

const REQUEST_TIMEOUT = 15000;
const MAX_RETRIES = 2;

/**
 * 调用云函数
 * @param {string} name - 云函数名称（格式：模块_函数名，如 common_user/getInfo）
 * @param {object} data - 请求参数
 * @param {object} options - 额外选项
 * @returns {Promise<any>}
 */
function callCloudFunction(name, data = {}, options = {}) {
  const { retries = MAX_RETRIES, timeout = REQUEST_TIMEOUT } = options;

  return new Promise((resolve, reject) => {
    function attempt(remaining) {
      wx.cloud.callFunction({
        name,
        data
      }).then((res) => {
        if (res.result && res.result.code === 0) {
          resolve(res.result.data);
        } else {
          const errMsg = (res.result && res.result.msg) || '请求失败';
          reject(new Error(errMsg));
        }
      }).catch((err) => {
        if (remaining > 0 && _isRetryable(err)) {
          console.warn(`[Request] ${name} 重试，剩余 ${remaining} 次`, err);
          setTimeout(() => attempt(remaining - 1), 1000);
          return;
        }
        reject(err);
      });
    }
    attempt(retries);
  });
}

/**
 * 自定义 HTTP 请求封装（非云函数场景）
 */
function httpGet(url, data = {}, options = {}) {
  return _request('GET', url, data, options);
}

function httpPost(url, data = {}, options = {}) {
  return _request('POST', url, data, options);
}

function _request(method, url, data, options = {}) {
  const { timeout = REQUEST_TIMEOUT } = options;

  return new Promise((resolve, reject) => {
    wx.request({
      url,
      method,
      data,
      timeout,
      header: {
        'Content-Type': 'application/json',
        ..._getAuthHeader()
      },
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${res.data}`));
        }
      },
      fail(err) {
        reject(err);
      }
    });
  });
}

/**
 * 上传文件
 */
function uploadFile(filePath, options = {}) {
  return new Promise((resolve, reject) => {
    wx.cloud.uploadFile({
      cloudPath: options.cloudPath || `uploads/${Date.now()}-${Math.random().toString(36).slice(2)}.png`,
      filePath,
      success(res) {
        resolve({ fileID: res.fileID, url: res.fileID });
      },
      fail: reject
    });
  });
}

// ===== 私有工具函数 =====

function _getAuthHeader() {
  const app = getApp();
  const token = app && app.globalData && app.globalData.token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function _isRetryable(err) {
  const msg = (err.message || err.errMsg || '').toLowerCase();
  return (
    msg.includes('timeout') ||
    msg.includes('network') ||
    msg.includes('temporary')
  );
}

module.exports = {
  callCloudFunction,
  httpGet,
  httpPost,
  uploadFile
};
