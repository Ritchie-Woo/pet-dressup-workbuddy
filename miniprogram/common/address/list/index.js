// common/address/list/index.js — 收货地址列表（滑动删除）
const { request } = require('../../../utils/request');

const DELETE_BTN_WIDTH = 150;

Page({
  data: {
    addresses: [],
    loading: true
  },

  onShow() {
    this.loadAddresses();
  },

  async loadAddresses() {
    this.setData({ loading: true });
    try {
      const res = await request('common-address', { action: 'list' });
      const addrs = (res.code === 1 ? res.data : []).map(a => ({
        ...a, swipeX: 0, swiping: false
      }));
      this.setData({ addresses: addrs });
    } catch (err) {
      const raw = wx.getStorageSync('addresses');
      const addrs = (raw ? JSON.parse(raw) : []).map(a => ({
        ...a, swipeX: 0, swiping: false
      }));
      this.setData({ addresses: addrs });
    } finally {
      this.setData({ loading: false });
    }
  },

  goAdd() {
    wx.navigateTo({ url: '/common/address/edit/index' });
  },

  goEdit(e) {
    wx.navigateTo({ url: '/common/address/edit/index?id=' + e.currentTarget.dataset.id });
  },

  // ===== 滑动删除手势 =====
  onTouchStart(e) {
    const index = e.currentTarget.dataset.index;
    this._closeAllExcept(index);
    this._touch = {
      startX: e.touches[0].clientX,
      index,
      swiping: false
    };
  },

  onTouchMove(e) {
    if (!this._touch) return;
    const deltaX = e.touches[0].clientX - this._touch.startX;
    if (Math.abs(deltaX) < 10 && !this._touch.swiping) return;
    this._touch.swiping = true;
    const tx = Math.min(0, Math.max(-DELETE_BTN_WIDTH, deltaX));
    this.setData({
      ['addresses[' + this._touch.index + '].swipeX']: tx,
      ['addresses[' + this._touch.index + '].swiping']: true
    });
  },

  onTouchEnd(e) {
    if (!this._touch) return;
    const deltaX = e.changedTouches[0].clientX - this._touch.startX;
    const index = this._touch.index;
    if (!this._touch.swiping) { this._touch = null; return; }
    const tx = Math.abs(deltaX) > DELETE_BTN_WIDTH / 2 ? -DELETE_BTN_WIDTH : 0;
    this.setData({
      ['addresses[' + index + '].swipeX']: tx,
      ['addresses[' + index + '].swiping']: false
    });
    this._touch = null;
  },

  _closeAllExcept(exceptIndex) {
    const { addresses } = this.data;
    let changed = false;
    for (let i = 0; i < addresses.length; i++) {
      if (i !== exceptIndex && addresses[i].swipeX !== 0) {
        addresses[i] = { ...addresses[i], swipeX: 0, swiping: false };
        changed = true;
      }
    }
    if (changed) this.setData({ addresses });
  },

  // 滑动后点击删除
  swipeDelete(e) {
    const index = e.currentTarget.dataset.index;
    const addr = this.data.addresses[index];
    if (!addr) return;
    this._closeAllExcept(index);
    wx.showModal({
      title: '确认删除',
      content: '删除后不可恢复',
      confirmColor: '#FF4D4F',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          await request('common-address', { action: 'delete', id: addr.id });
        } catch (e) { /* ignore */ }
        wx.showToast({ title: '已删除', icon: 'success' });
        this.loadAddresses();
      }
    });
  }
});
