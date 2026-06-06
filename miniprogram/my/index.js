// my/index.js — 个人中心
Page({
  data: {
    userInfo: {}
  },

  onShow() {
    const app = getApp();
    if (!app.globalData.token) {
      wx.redirectTo({ url: '/common/login/index' });
      return;
    }
    const storage = require('../utils/storage');
    const userInfo = app.globalData.userInfo || storage.getSync('userInfo');
    this.setData({ userInfo: userInfo || {} });
  },

  goPetList() {
    wx.navigateTo({ url: '/common/pet/list/index' });
  },

  goAddress() {
    wx.navigateTo({ url: '/common/address/list/index' });
  },

  goOrders() {
    wx.navigateTo({ url: '/gb/order/list/index' });
  },

  switchAccount() {
    wx.showModal({
      title: '切换账号',
      content: '确定要退出当前账号吗？',
      confirmColor: '#FF5A5F',
      success: (res) => {
        if (res.confirm) {
          // 清除登录态
          const app = getApp();
          app.globalData.token = null;
          app.globalData.userInfo = null;
          const storage = require('../utils/storage');
          storage.remove('token');
          storage.remove('userInfo');
          storage.remove('currentDressPet');
          wx.reLaunch({ url: '/common/login/index' });
        }
      }
    });
  }
});
