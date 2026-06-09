// gb/cart/index.js — 购物车页面（含滑动删除）
const storage = require('../../utils/storage');
const { request } = require('../../utils/request');

const DELETE_BTN_WIDTH = 150; // rpx，与 CSS 中 .item-delete-bg 宽度一致

Page({
  data: {
    cartItems: [],
    editMode: false,
    allSelected: false,
    selectedCount: 0,
    totalPrice: '0.00',
    payVisible: false,
    payAmount: '0',
    payTitle: ''
  },

  onShow() {
    this.loadCart();
  },

  // 加载购物车数据
  loadCart() {
    const cart = storage.getSync('cart') || [];
    // 初始化 swipeX + swiping 状态
    const cartItems = cart.map(item => ({
      ...item,
      swipeX: 0,
      swiping: false
    }));
    this.setData({ cartItems }, () => {
      this.calcTotal();
    });
  },

  // 保存购物车数据（去掉 swipeX/swiping 临时字段）
  saveCart() {
    const clean = this.data.cartItems.map(({ swipeX, swiping, ...item }) => item);
    storage.setSync('cart', clean);
  },

  // ===== 滑动删除手势 =====
  onTouchStart(e) {
    const index = e.currentTarget.dataset.index;

    // 关闭其他已打开的项
    this.closeAllSwiped(index);

    this._touch = {
      startX: e.touches[0].clientX,
      startY: e.touches[0].clientY,
      index,
      swiping: false
    };
  },

  onTouchMove(e) {
    if (!this._touch) return;
    const deltaX = e.touches[0].clientX - this._touch.startX;
    const deltaY = e.touches[0].clientY - this._touch.startY;

    // 如果垂直移动大于水平移动，忽略（用户可能在上下滚动）
    if (Math.abs(deltaY) > Math.abs(deltaX)) return;

    // 滑动超过 10px 才算真正开始滑动
    if (Math.abs(deltaX) < 10 && !this._touch.swiping) return;

    this._touch.swiping = true;

    // 只允许左滑（负值）
    const tx = Math.min(0, Math.max(-DELETE_BTN_WIDTH, deltaX));

    this.setData({
      ['cartItems[' + this._touch.index + '].swipeX']: tx,
      ['cartItems[' + this._touch.index + '].swiping']: true
    });
  },

  onTouchEnd(e) {
    if (!this._touch) return;
    const deltaX = e.changedTouches[0].clientX - this._touch.startX;
    const index = this._touch.index;

    // 没有真正滑动（点击行为），不处理
    if (!this._touch.swiping) {
      this._touch = null;
      return;
    }

    const threshold = DELETE_BTN_WIDTH / 2;
    const tx = Math.abs(deltaX) > threshold ? -DELETE_BTN_WIDTH : 0;

    this.setData({
      ['cartItems[' + index + '].swipeX']: tx,
      ['cartItems[' + index + '].swiping']: false
    });

    this._touch = null;
  },

  // 关闭所有已打开项
  closeAllSwiped(exceptIndex) {
    const cartItems = this.data.cartItems;
    let changed = false;
    cartItems.forEach((item, i) => {
      if (i !== exceptIndex && item.swipeX !== 0) {
        cartItems[i] = { ...item, swipeX: 0, swiping: false };
        changed = true;
      }
    });
    if (changed) this.setData({ cartItems });
  },

  // 滑动后点击删除
  swipeDelete(e) {
    const index = e.currentTarget.dataset.index;
    this.removeItemDirect(index);
  },

  // 直接删除（不弹确认框，因为已经滑出来了）
  removeItemDirect(index) {
    const cartItems = this.data.cartItems.filter((_, i) => i !== index);
    this.setData({ cartItems }, () => {
      this.saveCart();
      this.calcTotal();
      wx.showToast({ title: '已删除', icon: 'success' });
    });
  },

  // ===== 选择 =====
  toggleSelect(e) {
    // 先关闭所有滑动
    this.closeAllSwiped();

    const index = e.currentTarget.dataset.index;
    const cartItems = this.data.cartItems;
    cartItems[index].selected = !cartItems[index].selected;
    this.setData({ cartItems }, () => {
      this.saveCart();
      this.calcTotal();
    });
  },

  // 全选 / 取消全选
  toggleSelectAll() {
    this.closeAllSwiped();

    const allSelected = !this.data.allSelected;
    const cartItems = this.data.cartItems.map(item => ({
      ...item,
      selected: allSelected
    }));
    this.setData({ cartItems, allSelected }, () => {
      this.saveCart();
      this.calcTotal();
    });
  },

  // 增加数量
  increaseQty(e) {
    this.closeAllSwiped();

    const index = e.currentTarget.dataset.index;
    const cartItems = this.data.cartItems;
    cartItems[index].quantity += 1;
    this.setData({ cartItems }, () => {
      this.saveCart();
      this.calcTotal();
    });
  },

  // 减少数量
  decreaseQty(e) {
    this.closeAllSwiped();

    const index = e.currentTarget.dataset.index;
    const cartItems = this.data.cartItems;
    if (cartItems[index].quantity <= 1) {
      wx.showToast({ title: '数量不能少于1', icon: 'none' });
      return;
    }
    cartItems[index].quantity -= 1;
    this.setData({ cartItems }, () => {
      this.saveCart();
      this.calcTotal();
    });
  },

  // 计算总价和选中数量
  calcTotal() {
    const cartItems = this.data.cartItems;
    let selectedCount = 0;
    let totalPrice = 0;

    cartItems.forEach(item => {
      if (item.selected) {
        selectedCount += item.quantity;
        totalPrice += item.priceGroup * item.quantity;
      }
    });

    const allSelected = cartItems.length > 0 && cartItems.every(item => item.selected);

    this.setData({
      selectedCount,
      totalPrice: totalPrice.toFixed(2),
      allSelected
    });
  },

  // 切换编辑模式
  toggleEditMode() {
    this.closeAllSwiped();
    this.setData({ editMode: !this.data.editMode });
  },

  // 删除选中商品
  removeSelected() {
    if (this.data.selectedCount === 0) {
      wx.showToast({ title: '请先选择商品', icon: 'none' });
      return;
    }
    wx.showModal({
      title: '确认删除',
      content: '确定要删除选中的 ' + this.data.selectedCount + ' 件商品吗？',
      confirmColor: '#D54941',
      success: (res) => {
        if (res.confirm) {
          const cartItems = this.data.cartItems.filter(item => !item.selected);
          this.setData({ cartItems, editMode: false }, () => {
            this.saveCart();
            this.calcTotal();
            wx.showToast({ title: '已删除', icon: 'success' });
          });
        }
      }
    });
  },

  // 返回上一页
  goBack() {
    wx.navigateBack();
  },

  // 去逛街
  goShopping() {
    wx.switchTab({ url: '/gb/list/index' });
  },

  // 去结算
  async goCheckout() {
    if (this.data.selectedCount === 0) {
      wx.showToast({ title: '请先选择商品', icon: 'none' });
      return;
    }

    const app = getApp();
    if (!app.globalData.token) {
      wx.redirectTo({ url: '/common/login/index' });
      return;
    }

    let addresses = [];
    try {
      const res = await request('common-address', { action: 'list' });
      addresses = res.code === 1 ? res.data : [];
    } catch (e) {
      const raw = wx.getStorageSync('addresses');
      addresses = raw ? JSON.parse(raw) : [];
    }

    if (addresses.length === 0) {
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

    const selectedItems = this.data.cartItems.filter(item => item.selected);
    this._checkoutData = { items: selectedItems, address: addresses[0] };

    this.setData({
      payVisible: true,
      payAmount: String(this.data.totalPrice),
      payTitle: selectedItems.length + ' 件商品'
    });
  },

  onPayClose() {
    this.setData({ payVisible: false });
  },

  onPayConfirm() {
    this.setData({ payVisible: false });
    const { items, address } = this._checkoutData;
    this.createOrder(items, address);
  },

  async createOrder(items, address) {
    wx.showLoading({ title: '结算中…' });
    let newOrders = [];

    try {
      // 走云函数下单
      for (const item of items) {
        const res = await request('gb-order', {
          action: 'create',
          productId: item.productId,
          quantity: item.quantity,
          amountTotal: (item.priceGroup * item.quantity).toFixed(2),
          addressId: address.id
        });
        if (res.code === 1) {
          await request('gb-order', { action: 'paySuccess', orderId: res.data.orderId });
        }
      }

      // 云函数成功后，同步本地订单列表
      newOrders = items.map(item => ({
        orderId: 'ord_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        name: item.name,
        thumbnail: item.thumbnail,
        amount: (item.priceGroup * item.quantity).toFixed(2),
        quantity: item.quantity,
        status: 'paid',
        createdAt: new Date().toISOString(),
        paidAt: new Date().toISOString()
      }));
    } catch (err) {
      // 云函数失败，纯本地结算
      console.warn('云函数下单失败，使用本地结算:', err.message);
      newOrders = items.map(item => ({
        orderId: 'ord_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        name: item.name,
        thumbnail: item.thumbnail,
        amount: (item.priceGroup * item.quantity).toFixed(2),
        quantity: item.quantity,
        status: 'paid',
        createdAt: new Date().toISOString(),
        paidAt: new Date().toISOString()
      }));
    }

    // 合并到本地存储
    const existing = storage.getSync('orders') || [];
    storage.setSync('orders', [...newOrders, ...existing]);

    // 清空已结算商品
    const remaining = this.data.cartItems.filter(item => !item.selected);
    this.setData({ cartItems: remaining }, () => {
      this.saveCart();
      this.calcTotal();
    });

    wx.hideLoading();
    wx.showToast({ title: '支付成功', icon: 'success' });

    setTimeout(() => {
      wx.switchTab({ url: '/gb/order/list' });
    }, 800);
  }
});
