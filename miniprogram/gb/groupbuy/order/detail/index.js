// gb/groupbuy/order/detail — 卖家订单详情 + 发货
const { sellerGetOrderDetail, sellerShip } = require('../../../../utils/request');

const STATUS_LABEL = { pending: '待付款', paid: '待发货', shipped: '已发货', completed: '已完成', refunded: '已退款' };
const STATUS_DESC = { pending: '买家尚未完成支付', paid: '买家已付款，请尽快发货', shipped: '商品已发出，等待买家确认收货', completed: '订单已完成', refunded: '订单已退款' };

const CARRIERS = [
  { name: '顺丰速运', code: 'SF' },
  { name: '中通快递', code: 'ZTO' },
  { name: '圆通速递', code: 'YTO' },
  { name: '申通快递', code: 'STO' },
  { name: '韵达快递', code: 'YD' },
  { name: '极兔速递', code: 'JTSD' },
  { name: '邮政包裹', code: 'YZPY' },
  { name: '京东物流', code: 'JD' },
  { name: '德邦快递', code: 'DBL' }
];

Page({
  data: {
    order: {},
    specText: '',
    trackingNo: '',
    carrierIndex: 0,
    carriers: CARRIERS,
    carrierNames: CARRIERS.map(c => c.name),
    shipping: false,
    showShipPopup: false,
    shipMethod: 'manual',
    statusLabel: STATUS_LABEL,
    statusDesc: STATUS_DESC
  },

  onLoad(options) {
    if (options.id) this._loadOrder(options.id);
  },

  goBack() {
    wx.navigateBack({ delta: 1 });
  },

  async _loadOrder(orderId) {
    try {
      const res = await sellerGetOrderDetail(orderId);
      if (res.code === 1) {
        const order = res.data;
        let specText = '';
        if (order.specChoice && typeof order.specChoice === 'object') {
          specText = Object.entries(order.specChoice).map(([k, v]) => `${k}:${v}`).join(' ');
        }
        this.setData({ order, specText });
      }
    } catch (e) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  // 打开发货弹窗
  openShipPopup() {
    this.setData({ showShipPopup: true });
  },

  // 选择发货方式
  onShipMethod(e) {
    this.setData({ shipMethod: e.currentTarget.dataset.method });
  },

  // 选择快递公司
  onCarrierChange(e) {
    this.setData({ carrierIndex: e.detail.value });
  },

  onTrackingInput(e) {
    this.setData({ trackingNo: e.detail.value });
  },

  // 确认发货
  async onShip() {
    const { order, shipMethod, carrierIndex, carriers, trackingNo, shipping } = this.data;
    if (shipping) return;

    if (shipMethod === 'manual' && !trackingNo.trim()) {
      return wx.showToast({ title: '请填写快递单号', icon: 'none' });
    }

    this.setData({ shipping: true });
    try {
      const carrier = carriers[carrierIndex];
      const res = await sellerShip(
        order.orderId,
        shipMethod === 'manual' ? 'manual' : 'none',
        shipMethod === 'manual' ? carrier.code : '',
        shipMethod === 'manual' ? carrier.name : '',
        shipMethod === 'manual' ? trackingNo.trim() : ''
      );
      if (res.code === 1) {
        wx.showToast({ title: '发货成功', icon: 'success' });
        this.setData({ showShipPopup: false });
        this._loadOrder(order.orderId);
      }
    } catch (e) {
      wx.showToast({ title: e.message || '发货失败', icon: 'none' });
    } finally {
      this.setData({ shipping: false });
    }
  },

  closeShipPopup() {
    this.setData({ showShipPopup: false });
  },

  // 复制单号
  copyTracking() {
    const { order } = this.data;
    if (order.trackingNo) {
      wx.setClipboardData({ data: order.trackingNo });
      wx.showToast({ title: '已复制', icon: 'success' });
    }
  }
});
