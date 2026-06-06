// gb/detail/index.js — 商品详情 & 拼团
const { request } = require('../../utils/request');
const storage = require('../../utils/storage');

Page({
  data: {
    product: {},
    selectedSpecs: {},
    swiperList: [],
    petAvatar: null,
    dressPetName: '',
    discountText: '',
    loading: true,
    groupProgress: 0,
    remainCount: 0,
    activeGroups: []  // 进行中的拼团列表
  },

  onLoad(options) {
    if (options.id) {
      this.loadDetail(options.id);
    }
  },

  async loadDetail(productId) {
    try {
      const res = await request('gb-product', { action: 'detail', productId });
      if (res.code !== 1) throw new Error(res.msg);

      const product = res.data;
      const swiperList = (product.images || []).map(url => ({ url }));

      // 计算拼团进度
      const minGroupSize = product.minGroupSize || 2;
      const currentGroupSize = product.currentGroupSize || 0;
      const groupProgress = Math.min(Math.round((currentGroupSize / minGroupSize) * 100), 100);
      const remainCount = Math.max(minGroupSize - currentGroupSize, 0);

      // 计算折扣文案（WXML不支持.toFixed）
      const pg = product.priceGroup || product.groupPrice || 0;
      const po = product.priceOriginal || product.originalPrice || 0;
      const discountText = (po > pg && pg > 0)
        ? Math.round((1 - pg / po) * 100) + '% OFF' : '';

      this.setData({
        product,
        swiperList,
        groupProgress,
        remainCount,
        discountText,
        activeGroups: this.simulateActiveGroups(product)
      });

      // 加载试穿预览
      if (product.wpItemId) {
        this.loadTryOn();
      }
    } catch (err) {
      wx.showToast({ title: err.message || '加载失败', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1000);
    } finally {
      this.setData({ loading: false });
    }
  },

  async loadTryOn() {
    try {
      const petInfo = storage.getSync('currentDressPet');
      if (!petInfo) return;

      const avatarRes = await request('wp-avatar', { action: 'getByPet', petId: petInfo.petId });
      if (avatarRes.code === 1) {
        this.setData({ petAvatar: avatarRes.data, dressPetName: petInfo.petName });
      }
    } catch (e) { /* 试穿预览非必须 */ }
  },

  // 模拟进行中的拼团（MVP 阶段用，后续接入真实数据）
  simulateActiveGroups(product) {
    const minGroupSize = product.minGroupSize || 3;
    const sampleAvatars = [
      'https://img.yzcdn.cn/vant/cat.jpeg',
      'https://img.yzcdn.cn/vant/cat.jpeg'
    ];

    // 模拟 1~2 个进行中的团
    const count = Math.min(2, Math.floor(Math.random() * 3));
    const groups = [];
    for (let i = 0; i < count; i++) {
      const joinedCount = Math.floor(Math.random() * (minGroupSize - 1)) + 1;
      const remainCount = minGroupSize - joinedCount;
      // 模拟随机倒计时 2~12 小时
      const totalSeconds = Math.floor(Math.random() * 36000) + 7200;
      const h = Math.floor(totalSeconds / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);
      const s = totalSeconds % 60;
      groups.push({
        groupId: 'group_' + Date.now() + '_' + i,
        members: sampleAvatars.slice(0, joinedCount),
        remainCount,
        countdownText: `剩余 ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      });
    }
    return groups;
  },

  selectSpec(e) {
    const { name, value } = e.currentTarget.dataset;
    const specs = { ...this.data.selectedSpecs };

    if (specs[name] === value) {
      delete specs[name];
    } else {
      specs[name] = value;
    }
    this.setData({ selectedSpecs: specs });
  },

  /** 发起拼团（创建新团） */
  startGroup() {
    if (this._submitting) return;
    this._submitting = true;
    this.goCheckout('group');
  },

  /** 参与已有拼团 */
  joinGroup(e) {
    if (this._submitting) return;
    this._submitting = true;

    const groupId = e.currentTarget.dataset.id;
    const { product, selectedSpecs } = this.data;

    if (product.specs && product.specs.length > 0) {
      for (const spec of product.specs) {
        if (!selectedSpecs[spec.name]) {
          wx.showToast({ title: '请选择' + spec.name, icon: 'none' });
          this._submitting = false;
          return;
        }
      }
    }

    this.doCreateOrder(
      product.priceGroup || product.groupPrice,
      'group',
      groupId
    );
  },

  /** 单独购买 */
  buySolo() {
    if (this._submitting) return;
    this._submitting = true;
    this.goCheckout('solo');
  },

  goCheckout(mode) {
    const { product, selectedSpecs } = this.data;

    // 规格校验
    if (product.specs && product.specs.length > 0) {
      for (const spec of product.specs) {
        if (!selectedSpecs[spec.name]) {
          wx.showToast({ title: '请选择' + spec.name, icon: 'none' });
          this._submitting = false;
          return;
        }
      }
    }

    const price = mode === 'group'
      ? (product.groupPrice || product.priceGroup)
      : (product.originalPrice || product.priceOriginal);

    // 检查是否登录
    const app = getApp();
    if (!app.globalData.token) {
      this._submitting = false;
      wx.redirectTo({ url: '/common/login/index' });
      return;
    }

    // 弹出支付确认
    const label = mode === 'group' ? '发起拼团' : '单独购买';
    const specText = Object.values(selectedSpecs || {}).join(' / ') || '默认';

    wx.showModal({
      title: '确认订单',
      content: product.name + '\n' + specText + '\n' + label + '：¥' + price,
      confirmText: '确认支付 ¥' + price,
      cancelText: '取消',
      confirmColor: '#FF5A5F',
      success: (res) => {
        if (res.confirm) {
          this.doCreateOrder(price, mode);
        } else {
          this._submitting = false;
        }
      },
      fail: () => {
        this._submitting = false;
      }
    });
  },

  // 统一下单（校验地址 + 创建订单）
  doCreateOrder(price, mode, groupId) {
    const addresses = wx.getStorageSync('addresses');
    const addressList = addresses ? JSON.parse(addresses) : [];
    if (addressList.length === 0) {
      wx.showModal({
        title: '需要收货地址',
        content: '请先添加收货地址',
        confirmText: '去添加',
        success: (res) => {
          if (res.confirm) wx.navigateTo({ url: '/common/address/edit/index' });
        }
      });
      return;
    }

    this.createOrder(addressList[0], price, mode, groupId);
  },

  async createOrder(address, price, mode, groupId) {
    if (!address) return;
    wx.showLoading({ title: mode === 'group' ? '创建拼团…' : '创建订单…' });

    try {
      // 生成订单数据（纯本地，不依赖云函数）
      const orderId = 'ord_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
      const product = this.data.product;
      const now = new Date().toISOString();

      const order = {
        orderId,
        name: product.name,
        thumbnail: product.thumbnail,
        amount: price,
        quantity: 1,
        specText: Object.values(this.data.selectedSpecs || {}).join(' / ') || '',
        status: mode === 'group' ? 'grouping' : 'paid',
        createdAt: now,
        paidAt: now
      };

      // 保存到本地订单列表
      const existing = storage.getSync('orders') || [];
      storage.setSync('orders', [order, ...existing]);

      // 模拟支付延迟
      setTimeout(() => {
        wx.hideLoading();
        this._submitting = false;
        wx.showToast({ title: '支付成功', icon: 'success' });

        setTimeout(() => {
          wx.redirectTo({
            url: '/gb/order/detail/index?orderId=' + orderId + '&newOrder=1'
          });
        }, 800);
      }, 600);
    } catch (err) {
      wx.hideLoading();
      this._submitting = false;
      wx.showToast({ title: err.message || '下单失败', icon: 'none' });
    }
  },

  goHome() {
    wx.switchTab({ url: '/gb/list/index' });
  },

  goCart() {
    wx.navigateTo({ url: '/gb/cart/index' });
  },

  // 加入购物车
  addToCart() {
    const product = this.data.product;
    if (!product || !product.productId) return;

    const cartKey = 'cart';
    let cart = storage.getSync(cartKey) || [];

    const existIndex = cart.findIndex(item => item.productId === product.productId);
    if (existIndex > -1) {
      cart[existIndex].quantity += 1;
    } else {
      cart.push({
        productId: product.productId,
        name: product.name,
        thumbnail: product.thumbnail,
        priceGroup: product.priceGroup,
        quantity: 1,
        selected: true
      });
    }

    storage.setSync(cartKey, cart);
    wx.showToast({ title: '已加入购物车', icon: 'success', duration: 1200 });
  },

  goBack() {
    wx.navigateBack();
  }
});
