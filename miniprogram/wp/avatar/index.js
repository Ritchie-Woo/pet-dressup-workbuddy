// wp/avatar/index.js
Page({
  data: {
    loading: false,
    pageTitle: '2D形象'
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
      title: '2D形象 - pet-wb',
      path: '/wp/avatar/index'
    };
  }
});
