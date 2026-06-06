// gb/list/index.js — 团购商品列表
const { request } = require('../../utils/request');
const storage = require('../../utils/storage');

Page({
  data: {
    products: [],
    loading: true,
    loadingMore: false,
    hasMore: true,
    page: 1,
    pageSize: 6,
    cartCount: 0,
    activeCategory: 'all',
    keyword: '',
    refresherTriggered: false,
    fly: { show: false, x: 0, y: 0, w: 60, h: 60, src: '', moving: false },
    categories: [
      { value: 'all', label: '全部' },
      { value: 'food', label: '食品' },
      { value: 'toy', label: '玩具' },
      { value: 'clothing', label: '服饰' },
      { value: 'accessory', label: '用品' },
      { value: 'grooming', label: '洗护' }
    ]
  },

  onShow() {
    const app = getApp();
    if (!app.globalData.token) {
      wx.redirectTo({ url: '/common/login/index' });
      return;
    }
    this.loadCartCount();
    this.loadProducts();
  },

  // TabBar 点击刷新（已在当前页时再次点击才刷新）
  onTabItemTap(item) {
    if (item.pagePath === 'gb/list/index') {
      this.loadProducts();
    }
  },

  // 加载购物车数量（用于浮动按钮角标）
  loadCartCount() {
    const cart = storage.getSync('cart') || [];
    const count = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    this.setData({ cartCount: count });
  },

  async loadProducts() {
    // 首次加载或刷新：全量拉取并缓存，分页展示首页
    this.setData({ loading: true, page: 1, hasMore: true });
    try {
      const params = {};
      if (this.data.activeCategory !== 'all') params.category = this.data.activeCategory;
      if (this.data.keyword) params.keyword = this.data.keyword;

      const res = await request('gb-product', { action: 'list', ...params });
      const all = (res.data.products || []).map(p => ({
        ...p,
        thumbnail: p.thumbnail || ''
      }));

      // 缓存全量数据
      this._cache = all;
      const { pageSize } = this.data;
      const products = all.slice(0, pageSize);

      this.setData({
        products,
        hasMore: all.length > pageSize,
        page: 1
      });

      // 预加载首页图片
      const thumbs = products.map(p => p.thumbnail).filter(Boolean);
      if (thumbs.length > 0) {
        try {
          if (typeof wx.preloadImage === 'function') {
            wx.preloadImage({ urls: thumbs });
          }
        } catch (e) { /* ignore */ }
      }
    } catch (err) {
      console.error('加载商品列表失败', err);
    } finally {
      this.setData({ loading: false });
    }
  },

  // 追加加载下一页
  appendProducts() {
    if (!this._cache || !this.data.hasMore || this.data.loadingMore) return;

    this.setData({ loadingMore: true });
    const { page, pageSize } = this.data;
    const start = page * pageSize;
    const nextPage = this._cache.slice(start, start + pageSize);

    if (nextPage.length === 0) {
      this.setData({ hasMore: false, loadingMore: false });
      return;
    }

    const products = [...this.data.products, ...nextPage];
    const newPage = page + 1;
    const hasMore = start + pageSize < this._cache.length;

    this.setData({
      products,
      page: newPage,
      hasMore,
      loadingMore: false
    });
  },

  switchCategory(e) {
    const val = e.currentTarget.dataset.val;
    this.setData({ activeCategory: val }, () => this.loadProducts());
  },

  onSearch(e) {
    this.setData({ keyword: e.detail.value }, () => this.loadProducts());
  },

  onSearchClear() {
    this.setData({ keyword: '' }, () => this.loadProducts());
  },

  onPullDownRefresh() {
    this.loadProducts().then(() => wx.stopPullDownRefresh());
  },

  onReachBottom() {
    if (!this.data.hasMore || this.data.loadingMore) return;
    this.appendProducts();
  },

  // Skyline scroll-view 下拉刷新
  onRefresh() {
    this.setData({ refresherTriggered: true });
    this.loadProducts().then(() => {
      this.setData({ refresherTriggered: false });
    });
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    const product = this.data.products.find(p => p.productId === id);
    if (product && product.isSoldOut) {
      wx.showToast({ title: '已售罄', icon: 'none' });
      return;
    }
    wx.navigateTo({ url: '/gb/detail/index?id=' + id });
  },

  // 跳转购物车
  goCart() {
    wx.navigateTo({ url: '/gb/cart/index' });
  },

  // 加入购物车（含飞入动画）
  addToCart(e) {
    const productId = e.currentTarget.dataset.id;
    const product = this.data.products.find(p => p.productId === productId);
    if (!product || product.isSoldOut) return;

    // 先更新购物车数据
    const cartKey = 'cart';
    let cart = storage.getSync(cartKey) || [];

    const existIndex = cart.findIndex(item => item.productId === product.productId);
    if (existIndex > -1) {
      cart[existIndex].quantity += 1;
    } else {
      cart.push({
        productId: product.productId,
        name: product.name,
        thumbnail: product.thumbnail,
        priceGroup: product.priceGroup,
        quantity: 1,
        selected: true
      });
    }

    storage.setSync(cartKey, cart);
    this.loadCartCount();

    // 获取按钮位置作为飞入起点
    wx.createSelectorQuery()
      .select('#addBtn-' + productId)
      .boundingClientRect()
      .exec((res) => {
        if (res && res[0]) {
          this.flyBall(product.thumbnail, res[0]);
        }
      });
  },

  // 飞入动画
  flyBall(thumbnail, btnRect) {
    const ballSize = 40; // px
    const startX = btnRect.left + btnRect.width / 2 - ballSize / 2;
    const startY = btnRect.top + btnRect.height / 2 - ballSize / 2;

    this.setData({
      'fly.show': true,
      'fly.x': startX,
      'fly.y': startY,
      'fly.w': ballSize,
      'fly.h': ballSize,
      'fly.src': thumbnail,
      'fly.moving': false
    });

    // 获取终点位置（浮动购物车）
    wx.createSelectorQuery()
      .select('.float-cart')
      .boundingClientRect()
      .exec((res) => {
        if (!res || !res[0]) return;
        const target = res[0];
        const endX = target.left + target.width / 2 - ballSize / 2;
        const endY = target.top + target.height / 2 - ballSize / 2;

        // 稍微延迟再触发移动，让 first-frame 渲染
        setTimeout(() => {
          this.setData({
            'fly.moving': true,
            'fly.x': endX,
            'fly.y': endY,
            'fly.w': 40,
            'fly.h': 40
          });
        }, 50);

        // 动画结束后隐藏小球
        setTimeout(() => {
          this.setData({ 'fly.show': false });
        }, 600);
      });
  }
});
