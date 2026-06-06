// gb/order/detail/index.js — 订单详情
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

const STATUS_DESCS = {
  pending: '订单待支付，请在30分钟内完成支付',
  paid: '已支付，等待商家发货',
  shipped: '商品已发出，请注意查收',
  completed: '订单已完成，感谢您的购买',
  refunded: '订单已退款'
};

Page({
  data: {
    order: {},
    loading: true,
    isNewOrder: false
  },

  onLoad(options) {
    if (options.orderId) {
      this.loadDetail(options.orderId);
    }
    if (options.newOrder === '1') {
      this.setData({ isNewOrder: true });
    }
    if (options.doPay === '1') {
      this.doPay(options.orderId);
    }
  },

  async loadDetail(orderId) {
    try {
      const res = await request('gb-order', { action: 'detail', orderId });
      if (res.code !== 1) throw new Error(res.msg);
      this.setData({ order: res.data });
    } catch (err) {
      wx.showToast({ title: err.message || '加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  async doPay(orderId) {
    wx.showLoading({ title: '支付中…' });
    try {
      await request('gb-order', { action: 'paySuccess', orderId });
      this.setData({ isNewOrder: true });
      this.loadDetail(orderId);
    } catch (err) {
      wx.showToast({ title: '支付失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  statusLabel(status) {
    return STATUS_LABELS[status] || status;
  },

  statusTheme(status) {
    return STATUS_THEMES[status] || 'default';
  },

  statusDesc(status) {
    return STATUS_DESCS[status] || '';
  },

  goDressup() {
    wx.switchTab({ url: '/wp/dressup/index' });
  },

  goOrders() {
    wx.navigateTo({ url: '/gb/order/list/index' });
  }
});
