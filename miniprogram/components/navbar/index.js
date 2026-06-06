// components/navbar/index.js — 自定义导航栏（兼容 Skyline + TDesign navbar）
Component({
  properties: {
    title: { type: String, value: '' },
    showBack: { type: Boolean, value: true },
    bgColor: { type: String, value: '#ffffff' }
  },
  data: {
    statusBarHeight: 20,
    navBarHeight: 44
  },
  lifetimes: {
    attached() {
      const app = getApp();
      this.setData({
        statusBarHeight: app.globalData.statusBarHeight || 20,
        navBarHeight: app.globalData.navBarHeight || 44
      });
    }
  },
  methods: {
    goBack() {
      // 如果页面栈只有 1 层则跳转到穿搭主页
      const pages = getCurrentPages();
      if (pages.length > 1) {
        wx.navigateBack();
      } else {
        wx.switchTab({ url: '/wp/dressup/index' });
      }
    }
  }
});
