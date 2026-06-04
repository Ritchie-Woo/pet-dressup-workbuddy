// mbti/test/index.js
Page({
  data: {
    loading: false,
    pageTitle: '性格测试'
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
      title: '性格测试 - pet-wb',
      path: '/mbti/test/index'
    };
  }
});
