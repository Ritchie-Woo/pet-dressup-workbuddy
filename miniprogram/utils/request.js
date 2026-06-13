// 云函数请求封装 — 统一处理 error/retry/log
const app = getApp();

/**
 * 调用云函数
 * @param {string} name 云函数名称
 * @param {object} data 参数
 * @returns {Promise} res.result = { code, data, msg }
 */
function callCloudFunc(name, data = {}, timeout = 20000) {
  return new Promise((resolve, reject) => {
    if (!wx.cloud) {
      reject(new Error('云开发未初始化'));
      return;
    }

    let settled = false;
    const done = (fn, val) => {
      if (settled) return;
      settled = true;
      fn(val);
    };

    // timeout for long-running AI calls
    const timer = setTimeout(() => {
      done(reject, new Error('请求超时'));
    }, timeout);

    wx.cloud.callFunction({ name, data })
      .then(res => {
        clearTimeout(timer);
        if (res.result && res.result.code >= 0) {
          done(resolve, res.result);
        } else {
          done(reject, new Error(res.result?.msg || '请求失败'));
        }
      })
      .catch(err => {
        clearTimeout(timer);
        done(reject, err);
      });
  });
}

/**
 * 调用云函数（带 loading + 重试）
 * @param {string} name 云函数名称
 * @param {object} data 参数
 * @param {object} opts { retry, showLoading, loadingText }
 */
async function request(name, data = {}, opts = {}) {
  const { retry = 1, showLoading = false, loadingText = '', silent = false, timeout = 20000 } = opts;
  if (showLoading) wx.showLoading({ title: loadingText || '加载中…', mask: true });

  let lastErr;
  for (let i = 0; i <= retry; i++) {
    try {
      const result = await callCloudFunc(name, data, timeout);
      if (showLoading) wx.hideLoading();
      return result;
    } catch (err) {
      lastErr = err;
      if (i < retry) {
        await new Promise(r => setTimeout(r, 1000 * (i + 1)));
      }
    }
  }

  if (showLoading) wx.hideLoading();
  if (!silent) {
    wx.showToast({ title: lastErr?.message || '网络异常', icon: 'none' });
  }
  throw lastErr;
}

// ===== 便捷方法 =====

// 用户登录
function login(nickname, avatarUrl) {
  return request('common-user', { action: 'login', nickname, avatarUrl });
}

// 宠物 CRUD
function getPetList() {
  return request('common-pet', { action: 'list' }, { showLoading: true, loadingText: '加载中…' });
}

function getPetDetail(petId) {
  return request('common-pet', { action: 'detail', petId });
}

function createPet(pet) {
  return request('common-pet', { action: 'create', ...pet }, { showLoading: true, loadingText: '创建中…' });
}

function updatePet(petId, updates) {
  return request('common-pet', { action: 'update', petId, ...updates }, { showLoading: true });
}

function deletePet(petId) {
  return request('common-pet', { action: 'delete', petId }, { showLoading: true });
}

// ===== #2 穿搭 API =====
function createAvatar(petId, species, breed) {
  return request('wp-avatar', { action: 'createOrGet', petId, species, breed });
}
function getAvatar(petId) {
  return request('wp-avatar', { action: 'getByPet', petId });
}
function getAllItems() {
  return request('wp-items', { action: 'listAll' });
}
function getUserItems() {
  return request('wp-items', { action: 'getUserItems' });
}
function addUserItem(userId, itemId) {
  return request('wp-items', { action: 'addItem', userId, itemId });
}
function saveOutfit(avatarId, name, slots) {
  return request('wp-outfits', { action: 'save', avatarId, name, slots });
}
function getOutfits(avatarId) {
  return request('wp-outfits', { action: 'list', avatarId });
}
function setCurrentOutfit(outfitId) {
  return request('wp-outfits', { action: 'setCurrent', outfitId });
}

// ===== #5 团购 API =====
function getProducts(params) {
  return request('gb-product', { action: 'list', ...params });
}
function getProductDetail(productId) {
  return request('gb-product', { action: 'detail', productId });
}
function createOrder(params) {
  return request('gb-order', { action: 'create', ...params });
}
function paySuccess(orderId) {
  return request('gb-order', { action: 'paySuccess', orderId });
}
function getOrders(params) {
  return request('gb-order', { action: 'list', ...params });
}
function getOrderDetail(orderId) {
  return request('gb-order', { action: 'detail', orderId });
}

// ===== 卖家端（开团） API =====
function sellerGetProducts(params) {
  return request('gb-product', { action: 'myProductList', ...params });
}
function sellerCreateProduct(params) {
  return request('gb-product', { action: 'createProduct', ...params }, { showLoading: true, loadingText: '创建中…' });
}
function sellerUpdateProduct(params) {
  return request('gb-product', { action: 'updateProduct', ...params }, { showLoading: true, loadingText: '保存中…' });
}
function sellerToggleProduct(productId) {
  return request('gb-product', { action: 'toggleProductStatus', productId });
}
function sellerGetOrders(params) {
  return request('gb-order', { action: 'myProductOrders', ...params });
}
function sellerGetOrderDetail(orderId) {
  return request('gb-order', { action: 'sellerOrderDetail', orderId });
}
function sellerShip(orderId, shipMethod, carrierCode, carrierName, trackingNo) {
  return request('gb-order', { action: 'ship', orderId, shipMethod, carrierCode, carrierName, trackingNo }, { showLoading: true, loadingText: '发货中…' });
}
function sellerGetStats() {
  return request('gb-order', { action: 'mySalesStats' });
}
function sellerGetProgress() {
  return request('gb-progress', { action: 'myProgress' });
}

// ===== #3 地图 API =====
function getNearbyPlaces(lat, lng, category) {
  return request('mp-place', { action: 'list', lat, lng, category });
}
function searchPlaces(keyword) {
  return request('mp-place', { action: 'search', keyword });
}
function getPlaceDetail(placeId) {
  return request('mp-place', { action: 'detail', placeId });
}
function doCheckin(placeId, petId) {
  return request('mp-checkin', { action: 'checkin', placeId, petId });
}

// ===== 遛狗 API =====
function startWalk(petId) {
  return request('mp-walk', { action: 'start', petId });
}
function stopWalk(sessionId) {
  return request('mp-walk', { action: 'stop', sessionId });
}
function heartbeatWalk(sessionId, latitude, longitude) {
  return request('mp-walk', { action: 'heartbeat', sessionId, latitude, longitude }, { silent: true });
}
function queryWalkers(params = {}) {
  return request('mp-walk', { action: 'query', ...params }, { silent: true });
}

module.exports = {
  request,
  callCloudFunc,
  login,
  getPetList,
  getPetDetail,
  createPet,
  updatePet,
  deletePet,
  createAvatar,
  getAvatar,
  getAllItems,
  getUserItems,
  addUserItem,
  saveOutfit,
  getOutfits,
  setCurrentOutfit,
  getProducts,
  getProductDetail,
  createOrder,
  paySuccess,
  getOrders,
  getOrderDetail,
  sellerGetProducts,
  sellerCreateProduct,
  sellerUpdateProduct,
  sellerToggleProduct,
  sellerGetOrders,
  sellerGetOrderDetail,
  sellerShip,
  sellerGetStats,
  sellerGetProgress,
  getNearbyPlaces,
  searchPlaces,
  getPlaceDetail,
  doCheckin,
  startWalk,
  stopWalk,
  heartbeatWalk,
  queryWalkers
};
