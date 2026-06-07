// gb/list/index.js — 团购商品列表
const storage = require('../../utils/storage');
const { request } = require('../../utils/request');
const LOCAL_PRODUCTS = require('../../data/products');

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
      { value: 'clothing', label: '服饰' },
      { value: 'accessory', label: '项圈' },
      { value: 'food', label: '食品' },
      { value: 'toy', label: '玩具' },
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
    this.setData({ loading: true, page: 1, hasMore: true });
    try {
      const { activeCategory, keyword } = this.data;
      let all = [];

      // 优先从云函数加载
      try {
        const params = { pageSize: 50 };
        if (activeCategory !== 'all') params.category = activeCategory;
        if (keyword) params.keyword = keyword;
        const res = await request('gb-product', { action: 'list', ...params });
        if (res.code === 1 && res.data.products) {
          console.log('☁️ 云端数据 ' + res.data.products.length + ' 条');
          all = res.data.products.map(p => ({
            ...p,
            thumbnail: p.thumbnail || '',
            priceOriginal: p.priceOriginal || p.price_original,
            priceGroup: p.priceGroup || p.price_group,
            soldCount: p.soldCount || p.sold_count || 0,
            minGroupSize: p.minGroupSize || p.min_group_size || 3,
            isSoldOut: p.isSoldOut !== undefined ? p.isSoldOut : (p.stock <= 0)
          }));
        }
      } catch (e) {
        console.warn('云函数加载失败，使用本地数据:', e.message);
      }

      // 云函数无数据时降级到本地
      if (all.length === 0) {
        console.log('📦 使用本地数据');
        all = LOCAL_PRODUCTS;
        if (activeCategory !== 'all') {
          all = all.filter(p => p.category === activeCategory);
        }
        if (keyword) {
          const kw = keyword.toLowerCase();
          all = all.filter(p => p.name.toLowerCase().includes(kw));
        }
        // 本地数据做加权随机排序
        all = this.shuffleWithWeight(all);
      }

      // 缓存全量结果
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

  // Fisher-Yates 加权洗牌：热门商品靠前 + 随机打散
  shuffleWithWeight(arr) {
    const list = [...arr];

    // 1. 按销量降序（热门优先）
    list.sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0));

    // 2. 前 70% 保持有序（热门），后 30% Fisher-Yates 随机打散
    const splitIdx = Math.floor(list.length * 0.7);
    const top = list.slice(0, splitIdx);
    const rest = list.slice(splitIdx);

    for (let i = rest.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rest[i], rest[j]] = [rest[j], rest[i]];
    }

    return [...top, ...rest];
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
