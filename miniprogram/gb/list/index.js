// gb/list/index.js
Page({
  data: {
    loading: false,
    pageTitle: '团购好物'
  },

  onLoad(options) {
    this.setData({ loading: true });
    // TODO: 初始化页面数据
    this.setData({ loading: false });
  },

  onShow() {
    // TODO: 页面显示时刷新数据
  },

  onReachBottom() {
    // TODO: 加载更多
  },

  onShareAppMessage() {
    return {
      title: '团购好物 - pet-wb',
      path: '/gb/list/index'
    };
  }
});
