// mp/map/index.js
Page({
  data: {
    loading: false,
    pageTitle: '宠物地图'
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
      title: '宠物地图 - pet-wb',
      path: '/mp/map/index'
    };
  }
});
