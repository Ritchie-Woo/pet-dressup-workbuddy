// mp/place/index.js — 地点详情 + 投稿表单
const { request } = require('../../utils/request');
const storage = require('../../utils/storage');
const CAT_LABELS = { restaurant: '餐厅', cafe: '咖啡馆', park: '公园', pet_store: '宠物店', hospital: '宠物医院', hotel: '宠物酒店', other: '其他' };

Page({
  data: {
    mode: 'detail', // detail | submit
    place: {}, isFavorited: false, loading: true, placeId: '',
    // 投稿表单
    form: { name: '', category: '', address: '', phone: '', businessHours: '', petPolicy: '' },
    submitting: false,
    categories: [
      { value: 'restaurant', label: '餐厅' }, { value: 'cafe', label: '咖啡馆' },
      { value: 'park', label: '公园' }, { value: 'pet_store', label: '宠物店' },
      { value: 'hospital', label: '宠物医院' }, { value: 'hotel', label: '宠物酒店' },
      { value: 'other', label: '其他' }
    ]
  },

  onLoad(options) {
    if (options.mode === 'submit') {
      this.setData({ mode: 'submit', loading: false });
      return;
    }
    if (options.id) {
      this.setData({ placeId: options.id });
      this.loadDetail(options.id);
    }
  },

  async loadDetail(placeId) {
    try {
      const res = await request('mp-place', { action: 'detail', placeId });
      if (res.code !== 1) throw new Error(res.msg);
      this.setData({ place: res.data, swiperList: (res.data.images || []).map(url => ({ url })) });
      this.checkFavorite();
    } catch (err) {
      wx.showToast({ title: err.message || '加载失败', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1000);
    } finally {
      this.setData({ loading: false });
    }
  },

  async checkFavorite() {
    try {
      const res = await request('mp-place', { action: 'favorite', placeId: this.data.placeId });
      this.setData({ isFavorited: res.data?.favorited });
    } catch (e) { /* */ }
  },

  async toggleFavorite() {
    try {
      const res = await request('mp-place', { action: 'favorite', placeId: this.data.placeId, toggle: true });
      this.setData({ isFavorited: res.data.favorited });
      wx.showToast({ title: res.data.favorited ? '已收藏' : '已取消收藏', icon: 'success' });
    } catch (err) { wx.showToast({ title: '操作失败', icon: 'none' }); }
  },

  async doCheckin() {
    const petInfo = storage.getSync('currentDressPet');
    if (!petInfo) {
      wx.showToast({ title: '请先创建宠物', icon: 'none' });
      return;
    }
    try {
      await request('mp-checkin', { action: 'checkin', placeId: this.data.placeId, petId: petInfo.petId });
      wx.showToast({ title: '打卡成功', icon: 'success' });
      this.loadDetail(this.data.placeId);
    } catch (err) {
      wx.showToast({ title: err.message || '打卡失败', icon: 'none' });
    }
  },

  openNavigation() {
    const p = this.data.place;
    if (!p.latitude || !p.longitude) return;
    wx.openLocation({ latitude: p.latitude, longitude: p.longitude, name: p.name, address: p.address, scale: 16 });
  },

  callPhone() {
    const phone = this.data.place.phone;
    if (!phone) return;
    wx.makePhoneCall({ phoneNumber: phone });
  },

  // ===== 投稿表单 =====
  onFormChange(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ ['form.' + field]: e.detail.value });
  },
  selectCat(e) { this.setData({ 'form.category': e.currentTarget.dataset.val }); },

  async handleSubmit() {
    const { name, category, address } = this.data.form;
    if (!name || !category || !address) {
      wx.showToast({ title: '请填写必填信息', icon: 'none' });
      return;
    }
    this.setData({ submitting: true });
    try {
      await request('mp-place', { action: 'submit', ...this.data.form });
      wx.showToast({ title: '已提交审核', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 1000);
    } catch (err) {
      wx.showToast({ title: err.message || '提交失败', icon: 'none' });
    } finally {
      this.setData({ submitting: false });
    }
  },

  categoryLabel(cat) { return CAT_LABELS[cat] || cat; }
});
