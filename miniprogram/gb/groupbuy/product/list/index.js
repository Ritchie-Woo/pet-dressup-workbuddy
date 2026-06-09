// gb/groupbuy/product/list — 我的商品列表
const { sellerGetProducts, sellerToggleProduct } = require('../../../../utils/request');

Page({
  data: {
    products: [],
    loading: true,
    loadingMore: false,
    hasMore: true,
    page: 1,
    pageSize: 20
  },

  onShow() {
    this.setData({ page: 1, hasMore: true });
    this._loadProducts();
  },

  goBack() {
    wx.navigateBack({ delta: 1 });
  },

  onPullDownRefresh() {
    this.setData({ page: 1, hasMore: true });
    this._loadProducts().then(() => wx.stopPullDownRefresh());
  },

  onReachBottom() {
    if (!this.data.hasMore || this.data.loadingMore) return;
    this._appendProducts();
  },

  async _loadProducts() {
    this.setData({ loading: true });
    try {
      const res = await sellerGetProducts({ page: 1, pageSize: this.data.pageSize });
      if (res.code === 1) {
        const products = res.data.products || [];
        this.setData({
          products,
          hasMore: products.length >= this.data.pageSize,
          page: 1,
          loading: false
        });
        this._cache = products;
      }
    } catch (e) {
      this.setData({ loading: false });
      console.error('加载商品失败', e);
    }
  },

  async _appendProducts() {
    const { page, pageSize, products } = this.data;
    this.setData({ loadingMore: true });
    try {
      const nextPage = page + 1;
      const res = await sellerGetProducts({ page: nextPage, pageSize });
      if (res.code === 1) {
        const newData = res.data.products || [];
        this.setData({
          products: [...products, ...newData],
          hasMore: newData.length >= pageSize,
          page: nextPage,
          loadingMore: false
        });
      }
    } catch (e) {
      this.setData({ loadingMore: false });
    }
  },

  async onToggle(e) {
    const productId = e.currentTarget.dataset.id;
    try {
      await sellerToggleProduct(productId);
      const products = this.data.products.map(p => {
        if (p.productId === productId) {
          return { ...p, isActive: !p.isActive };
        }
        return p;
      });
      this.setData({ products });
    } catch (e) {
      wx.showToast({ title: '操作失败', icon: 'none' });
    }
  },

  goEdit(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/gb/groupbuy/product/edit/index?id=${id}` });
  },

  goCreate() {
    wx.navigateTo({ url: '/gb/groupbuy/product/edit/index' });
  }
});
