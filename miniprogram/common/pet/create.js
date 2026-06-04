// common/pet/create.js
Page({
  data: {
    loading: false,
    pageTitle: '创建档案'
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
      title: '创建档案 - pet-wb',
      path: '/common/pet/create'
    };
  }
});
