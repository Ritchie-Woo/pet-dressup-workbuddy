// gb/order/list/index.js — 订单列表
const { request } = require('../../../utils/request');

const STATUS_LABELS = {
  pending: '待付款',
  paid: '已付款',
  shipped: '已发货',
  completed: '已完成',
  refunded: '已退款'
};

const STATUS_THEMES = {
  pending: 'warning',
  paid: 'primary',
  shipped: 'success',
  completed: 'default',
  refunded: 'danger'
};

Page({
  data: {
    orders: [],
    loading: true,
    activeTab: 'all',
    statusTabs: [
      { value: 'all', label: '全部' },
      { value: 'pending', label: '待付款' },
      { value: 'paid', label: '已付款' },
      { value: 'shipped', label: '已发货' },
      { value: 'completed', label: '已完成' }
    ]
  },

  onShow() {
    this.loadOrders();
  },

  goBack() {
    wx.navigateBack({ delta: 1 });
  },

  async loadOrders() {
    this.setData({ loading: true });
    try {
      const params = {};
      if (this.data.activeTab !== 'all') params.status = this.data.activeTab;
      const res = await request('gb-order', { action: 'list', ...params });
      this.setData({ orders: res.data.orders || [] });
    } catch (err) {
      console.error('加载订单失败', err);
    } finally {
      this.setData({ loading: false });
    }
  },

  switchTab(e) {
    this.setData({ activeTab: e.detail.value }, () => this.loadOrders());
  },

  statusLabel(status) {
    return STATUS_LABELS[status] || status;
  },

  statusTheme(status) {
    return STATUS_THEMES[status] || 'default';
  },

  goDetail(e) {
    wx.navigateTo({ url: '/gb/order/detail/index?orderId=' + e.currentTarget.dataset.id });
  },

  goPay(e) {
    wx.navigateTo({ url: '/gb/order/detail/index?orderId=' + e.currentTarget.dataset.id + '&doPay=1' });
  },

  goShop() {
    wx.switchTab({ url: '/gb/list/index' });
  }
});
