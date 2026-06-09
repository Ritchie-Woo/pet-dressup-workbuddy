// gb/groupbuy/order/list — 我卖出的订单
const { sellerGetOrders } = require('../../../../utils/request');

const STATUS_TABS = [
  { value: 'all', label: '全部' },
  { value: 'paid', label: '待发货' },
  { value: 'shipped', label: '已发货' },
  { value: 'completed', label: '已完成' }
];

const STATUS_LABEL = { pending: '待付款', paid: '待发货', shipped: '已发货', completed: '已完成', refunded: '已退款' };

Page({
  data: {
    orders: [],
    loading: true,
    loadingMore: false,
    hasMore: true,
    activeTab: 'all',
    page: 1,
    pageSize: 20,
    statusTabs: STATUS_TABS,
    statusLabel: STATUS_LABEL
  },

  onShow() {
    this.setData({ page: 1, hasMore: true });
    this._loadOrders();
  },

  goBack() {
    wx.navigateBack({ delta: 1 });
  },

  onPullDownRefresh() {
    this.setData({ page: 1, hasMore: true });
    this._loadOrders().then(() => wx.stopPullDownRefresh());
  },

  onReachBottom() {
    if (!this.data.hasMore || this.data.loadingMore) return;
    this._appendOrders();
  },

  switchTab(e) {
    this.setData({ activeTab: e.detail.value, page: 1, hasMore: true });
    this._loadOrders();
  },

  formatSpec(specChoice) {
    if (!specChoice || typeof specChoice !== 'object') return '';
    return Object.entries(specChoice).map(([k, v]) => `${k}:${v}`).join(' ');
  },

  async _loadOrders() {
    this.setData({ loading: true });
    try {
      const { activeTab, pageSize } = this.data;
      const params = { page: 1, pageSize };
      if (activeTab !== 'all') params.status = activeTab;
      const res = await sellerGetOrders(params);
      if (res.code === 1) {
        const orders = (res.data.orders || []).map(o => ({
          ...o,
          specText: this.formatSpec(o.specChoice)
        }));
        this.setData({ orders, hasMore: orders.length >= pageSize, page: 1, loading: false });
      }
    } catch (e) {
      this.setData({ loading: false });
    }
  },

  async _appendOrders() {
    const { page, pageSize, orders, activeTab } = this.data;
    this.setData({ loadingMore: true });
    try {
      const nextPage = page + 1;
      const params = { page: nextPage, pageSize };
      if (activeTab !== 'all') params.status = activeTab;
      const res = await sellerGetOrders(params);
      if (res.code === 1) {
        const newOrders = (res.data.orders || []).map(o => ({
          ...o,
          specText: this.formatSpec(o.specChoice)
        }));
        this.setData({
          orders: [...orders, ...newOrders],
          hasMore: newOrders.length >= pageSize,
          page: nextPage,
          loadingMore: false
        });
      }
    } catch (e) {
      this.setData({ loadingMore: false });
    }
  },

  goDetail(e) {
    wx.navigateTo({ url: `/gb/groupbuy/order/detail/index?id=${e.currentTarget.dataset.id}` });
  },

  goShip(e) {
    wx.navigateTo({ url: `/gb/groupbuy/order/detail/index?id=${e.currentTarget.dataset.id}&ship=1` });
  }
});
