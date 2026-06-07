// gb/order/list.js — 订单列表
const storage = require('../../utils/storage');
const { request } = require('../../utils/request');

const STATUS_MAP = {
  grouping: '拼团中',
  paid: '待发货',
  shipped: '待收货',
  completed: '已完成'
};

Page({
  data: {
    orders: [],
    filteredOrders: [],
    activeTab: 'all',
    tabs: [
      { key: 'all', label: '全部' },
      { key: 'grouping', label: '拼团中' },
      { key: 'paid', label: '待发货' },
      { key: 'shipped', label: '待收货' },
      { key: 'completed', label: '已完成' }
    ]
  },

  onShow() {
    this.loadOrders();
  },

  // TabBar 点击刷新（已在当前页时再次点击才刷新）
  onTabItemTap(item) {
    if (item.pagePath === 'gb/order/list') {
      this.loadOrders();
    }
  },

  // 加载订单数据
  async loadOrders() {
    let orders = [];
    try {
      const res = await request('gb-order', { action: 'list' });
      if (res.code === 1 && res.data) {
        orders = res.data.map(o => ({
          orderId: o.orderId || o._id,
          name: o.productName || o.name || '',
          thumbnail: o.productThumbnail || o.thumbnail || '',
          amount: o.amountTotal || o.amount || 0,
          quantity: o.quantity || 1,
          status: o.status || 'paid',
          createdAt: o.createdAt || o.created_at || '',
          paidAt: o.paidAt || o.paid_at || ''
        }));
        console.log('☁️ 云端订单 ' + orders.length + ' 条');
      }
    } catch (e) {
      console.warn('云函数订单加载失败，使用本地:', e.message);
    }

    // 降级到本地
    if (orders.length === 0) {
      const raw = storage.getSync('orders') || [];
      orders = raw;
      console.log('📦 本地订单 ' + orders.length + ' 条');
    }

    orders.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    this.setData({ orders }, () => {
      this.filterOrders();
    });
  },

  // Tab 切换
  switchTab(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({ activeTab: key }, () => {
      this.filterOrders();
    });
  },

  // 按状态筛选
  filterOrders() {
    const { orders, activeTab } = this.data;
    const filtered = activeTab === 'all'
      ? orders
      : orders.filter(o => o.status === activeTab);
    this.setData({ filteredOrders: filtered });
  },

  // 状态文字
  statusLabel(status) {
    return STATUS_MAP[status] || status;
  },

  // 跳转订单详情
  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/gb/order/detail/index?orderId=' + id });
  },

  // 确认收货
  confirmReceive(e) {
    const orderId = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认收货',
      content: '确定已收到商品吗？',
      confirmText: '确认收货',
      success: (res) => {
        if (!res.confirm) return;
        const orders = this.data.orders;
        const idx = orders.findIndex(o => o.orderId === orderId);
        if (idx < 0) return;
        orders[idx].status = 'completed';
        orders[idx].completedAt = new Date().toISOString();
        storage.setSync('orders', orders);
        wx.showToast({ title: '已确认收货', icon: 'success' });
        this.loadOrders();
      }
    });
  },

  // 去逛街
  goShopping() {
    wx.switchTab({ url: '/gb/list/index' });
  }
});
