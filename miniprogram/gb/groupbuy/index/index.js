// gb/groupbuy/index — 开团首页
const { sellerGetProducts } = require('../../../utils/request');

Page({
  data: {
    myProducts: [],
    hasProducts: false,
    loading: true
  },

  onShow() {
    this._loadMyProducts();
  },

  async _loadMyProducts() {
    this.setData({ loading: true });
    try {
      const res = await sellerGetProducts({ pageSize: 5 });
      if (res.code === 1 && res.data.products) {
        this.setData({
          myProducts: res.data.products,
          hasProducts: res.data.products.length > 0,
          loading: false
        });
      } else {
        this.setData({ hasProducts: false, loading: false });
      }
    } catch (e) {
      this.setData({ loading: false });
    }
  },

  // 普通团购 → 新建商品
  goCreate() {
    wx.navigateTo({ url: '/gb/groupbuy/product/edit/index' });
  },

  // 点击我已开团的商品 → 进商品管理列表
  goProductList() {
    wx.navigateTo({ url: '/gb/groupbuy/product/list/index' });
  },

  // 预售/自提 → 提示即将上线
  onLocked(e) {
    const type = e.currentTarget.dataset.type;
    wx.showToast({ title: type + '即将上线，敬请期待', icon: 'none' });
  },

  goOrders() {
    wx.navigateTo({ url: '/gb/groupbuy/order/list/index' });
  }
});
