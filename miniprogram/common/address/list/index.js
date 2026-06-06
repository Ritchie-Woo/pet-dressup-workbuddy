// common/address/list/index.js — 收货地址列表
const { request } = require('../../../utils/request');

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
      // 从本地存储读取地址（common-address 云函数待 Phase 2 实现）
      const raw = wx.getStorageSync('addresses');
      this.setData({ addresses: raw ? JSON.parse(raw) : [] });
    } catch (err) {
      this.setData({ addresses: [] });
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

  setDefault(e) {
    const id = e.currentTarget.dataset.id;
    const addresses = this.data.addresses.map(a => ({
      ...a,
      isDefault: a.id === id
    }));
    this.setData({ addresses });
    wx.setStorageSync('addresses', JSON.stringify(addresses));
    wx.showToast({ title: '已设为默认', icon: 'success' });
  },

  confirmDelete(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '删除后不可恢复',
      confirmColor: '#FF4D4F',
      success: res => {
        if (res.confirm) {
          const addresses = this.data.addresses.filter(a => a.id !== id);
          this.setData({ addresses });
          wx.setStorageSync('addresses', JSON.stringify(addresses));
        }
      }
    });
  }
});
