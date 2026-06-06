// mp/map/index.js — 宠物友好地图
const { request } = require('../../utils/request');

const CAT_LABELS = { restaurant: '餐厅', cafe: '咖啡馆', park: '公园', pet_store: '宠物店', hospital: '医院', hotel: '宠物酒店', other: '其他' };

Page({
  data: {
    latitude: 22.5431, longitude: 113.9347, // 深圳默认
    markers: [], places: [],
    activeCategory: 'all',
    categories: [
      { value: 'all', icon: '📍', label: '全部' },
      { value: 'restaurant', icon: '🍽️', label: '餐厅' },
      { value: 'cafe', icon: '☕', label: '咖啡馆' },
      { value: 'park', icon: '🌳', label: '公园' },
      { value: 'pet_store', icon: '🐾', label: '宠物店' },
      { value: 'hospital', icon: '🏥', label: '医院' },
      { value: 'hotel', icon: '🏨', label: '酒店' }
    ],
    keyword: ''
  },

  onLoad() {
    const app = getApp();
    if (!app.globalData.token) {
      wx.redirectTo({ url: '/common/login/index' });
      return;
    }
    // 检查 feature flag
    if (!app.isFeatureEnabled('module_mp_enabled')) {
      wx.showToast({ title: '功能开发中', icon: 'none' });
      return;
    }
    this.getLocation();
  },

  getLocation() {
    wx.getLocation({ type: 'gcj02', success: (res) => {
      this.setData({ latitude: res.latitude, longitude: res.longitude });
      this.loadPlaces(res.latitude, res.longitude);
    }, fail: () => {
      // 使用默认位置
      wx.showToast({ title: '无法获取位置', icon: 'none' });
      this.loadPlaces(this.data.latitude, this.data.longitude);
    }});
  },

  async loadPlaces(lat, lng) {
    try {
      const params = { lat, lng };
      if (this.data.activeCategory !== 'all') params.category = this.data.activeCategory;
      if (this.data.keyword) {
        const res = await request('mp-place', { action: 'search', keyword: this.data.keyword });
        const places = res.data.places || [];
        this.setData({ places });
        this.updateMarkers(places);
        return;
      }
      const res = await request('mp-place', { action: 'list', ...params });
      const places = res.data.places || [];
      this.setData({ places });
      this.updateMarkers(places);
    } catch (err) {
      console.error('加载地图数据失败', err);
    }
  },

  updateMarkers(places) {
    const markers = places.map(p => ({
      id: p.placeId,
      latitude: p.latitude,
      longitude: p.longitude,
      title: p.name,
      iconPath: '/images/marker-place.png',
      width: 32, height: 32,
      callout: { content: p.name + '\n' + (CAT_LABELS[p.category] || p.category) + ' · ' + p.distance + 'm', display: 'BYCLICK', padding: 8, borderRadius: 8 }
    }));
    this.setData({ markers });
  },

  switchCategory(e) {
    const val = e.currentTarget.dataset.val;
    this.setData({ activeCategory: val }, () => {
      this.loadPlaces(this.data.latitude, this.data.longitude);
    });
  },

  onSearch(e) { this.setData({ keyword: e.detail.value }, () => this.loadPlaces(this.data.latitude, this.data.longitude)); },
  onSearchClear() { this.setData({ keyword: '' }, () => this.loadPlaces(this.data.latitude, this.data.longitude)); },

  onMarkerTap(e) {
    const id = e.detail.markerId;
    this.goDetail({ currentTarget: { dataset: { id } } });
  },

  goDetail(e) {
    wx.navigateTo({ url: '/mp/place/index?id=' + e.currentTarget.dataset.id });
  },

  onRegionChange(e) {
    if (e.type === 'end') {
      const mapCtx = wx.createMapContext('myMap');
      mapCtx.getCenterLocation({
        success: (res) => {
          this.setData({ latitude: res.latitude, longitude: res.longitude });
          if (!this.data.keyword) this.loadPlaces(res.latitude, res.longitude);
        }
      });
    }
  },

  goSubmit() {
    wx.navigateTo({ url: '/mp/place/index?mode=submit' });
  },

  categoryLabel(cat) { return CAT_LABELS[cat] || cat; }
});
