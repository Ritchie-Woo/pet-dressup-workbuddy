// mp/place/index.js — 地点详情 + 投稿表单（P0 v2.0 + P1 信任增强）
const { request } = require('../../utils/request');
const storage = require('../../utils/storage');
const TAGS = require('./tags');
const CAT_LABELS = { mall: '商场', restaurant: '餐厅', park: '公园', hotel: '酒店', adoption: '领养', other: '其他' };
const SOURCE_LABELS = {
  douyin: '抖音',
  xiaohongshu: '小红书',
  official_account: '公众号',
  wechat_official: '公众号',
  manual: '人工确认',
  manual_confirmed: '人工确认',
  user_submitted: '用户投稿',
  user_collected: '用户采集',
  dev_seed: '开发种子',
  test_seed: '测试种子',
  seed: '种子数据',
  unknown: '未标注'
};

function relativeTime(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}天前`;
  return new Date(dateStr).toLocaleDateString('zh-CN');
}

function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('zh-CN');
}

Page({
  data: {
    mode: 'detail',
    place: {}, isFavorited: false, loading: true, placeId: '',
    checkinStatus: 'idle', checkedInToday: false,
    checkinCount: 0, lastCheckinTime: '', recentCheckins: [], swiperList: [],
    // P1: 标签投票
    showTagVote: false,
    tags: TAGS,
    voteTags: [],
    tagCache: {}, // 当前地点已投过的标签 { TAG_001: 1/-1 }
    // P1: 聚合统计
    tagStats: {},
    breedDistribution: {},
    hourlyHeatmap: {},
    lastCheckinId: null,
    // 投稿表单
    form: { name: '', category: '', address: '', detailAddress: '', latitude: null, longitude: null, geoAddress: '', phone: '', businessHours: '', petPolicy: '' },
    submitting: false,
    initLat: null, initLng: null,   // 从外面地图透传过来的初始位置
    categories: [
      { value: 'mall', label: '商场' }, { value: 'restaurant', label: '餐厅' },
      { value: 'park', label: '公园' }, { value: 'hotel', label: '酒店' },
      { value: 'adoption', label: '领养' },
      { value: 'other', label: '其他' }
    ]
  },

  onLoad(options) {
    if (options.mode === 'submit') {
      // 从外面大地图跳转时带的初始位置
      const initLat = options.lat ? Number(options.lat) : null;
      const initLng = options.lng ? Number(options.lng) : null;
      this.setData({
        mode: 'submit',
        loading: false,
        initLat, initLng
      });
      return;
    }
    if (options.id) {
      this.setData({ placeId: options.id });
      this.loadDetail(options.id);
      this.checkTodayStatus(options.id);
    }
  },

  async loadDetail(placeId) {
    try {
      const res = await request('mp-place', { action: 'detail', placeId });
      if (res.code !== 1) throw new Error(res.msg);
      const data = res.data;
      const recentCheckins = (data.recentCheckins || []).filter(c => c.avatarSnapshot);
      this.setData({
        place: data,
        swiperList: (data.images || []).map(image => ({ image })),
        checkinCount: data.checkinCount || 0,
        recentCheckins,
        lastCheckinTime: recentCheckins.length > 0 ? relativeTime(recentCheckins[0].createdAt) : '',
        placeSourceLabel: this.sourceLabel(data.source),
        placeRecordedTime: this.formatPlaceTime(data.createdAt),
        placeUpdatedTime: this.formatPlaceTime(data.updatedAt),
        tagStats: data.tagStats || {},
        tagListWithStats: this._buildTagListWithStats(data.tagList || []),
        breedDistribution: data.breedDistribution || {},
        hourlyHeatmap: data.hourlyHeatmap || {}
      });
      this.checkFavorite();
      this.loadMyTagVotes(placeId);
    } catch (err) {
      wx.showToast({ title: err.message || '加载失败', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1000);
    } finally {
      this.setData({ loading: false });
    }
  },

  async checkTodayStatus(placeId) {
    try {
      const res = await request('mp-checkin', { action: 'todayStatus', placeId });
      if (res.code === 1 && res.data.checkedInToday) {
        this.setData({ checkedInToday: true, checkinStatus: 'checked' });
      }
    } catch (e) {}
  },

  async checkFavorite() {
    try {
      const res = await request('mp-place', { action: 'favorite', placeId: this.data.placeId });
      this.setData({ isFavorited: res.data?.favorited });
    } catch (e) {}
  },

  async toggleFavorite() {
    try {
      const res = await request('mp-place', { action: 'favorite', placeId: this.data.placeId, toggle: true });
      this.setData({ isFavorited: res.data.favorited });
      wx.showToast({ title: res.data.favorited ? '已收藏' : '已取消收藏', icon: 'success' });
    } catch (err) { wx.showToast({ title: '操作失败', icon: 'none' }); }
  },

  async doCheckin() {
    if (this.data.checkedInToday || this.data.checkinStatus === 'loading') return;
    const petInfo = storage.getSync('currentDressPet');
    const petId = petInfo?.petId || '';
    this.setData({ checkinStatus: 'loading' });
    try {
      const params = { action: 'checkin', placeId: this.data.placeId };
      if (petId) params.petId = petId;
      await request('mp-checkin', params);
      this.setData({ checkedInToday: true, checkinStatus: 'checked' });
      wx.showToast({ title: '已踩点，今天来过啦～', icon: 'success' });
      this.loadDetail(this.data.placeId);
      // P1: 弹出标签投票半屏
      const pool = TAGS.sort(() => Math.random() - 0.5).slice(0, 3);
      setTimeout(() => this.setData({ showTagVote: true, voteTags: pool }), 500);
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('已踩点') || msg.includes('今天来过啦')) {
        this.setData({ checkedInToday: true, checkinStatus: 'checked' });
        wx.showToast({ title: '已踩点，今天来过啦～', icon: 'success' });
        this.loadDetail(this.data.placeId);
        return;
      }
      this.setData({ checkinStatus: 'failed' });
      wx.showToast({ title: msg || '踩点失败，请重试', icon: 'none' });
      setTimeout(() => { if (this.data.checkinStatus === 'failed') this.setData({ checkinStatus: 'idle' }); }, 1500);
    }
  },

  // ── P1: 标签投票 ──
  closeTagVote() { this.setData({ showTagVote: false }); },

  // 加载当前用户对该地点的历史投票
  async loadMyTagVotes(placeId) {
    try {
      const res = await request('mp-checkin', { action: 'myTagVotes', placeId });
      if (res.code === 1 && res.data && res.data.cache) {
        this.setData({ tagCache: res.data.cache });
      }
    } catch (e) { /* 静默失败 */ }
  },

  async voteTag(e) {
    const tagId = e.currentTarget.dataset.tagId;
    const vote = Number(e.currentTarget.dataset.vote);
    if (vote !== 1 && vote !== -1) return;

    const cache = { ...this.data.tagCache };

    try {
      await request('mp-checkin', {
        action: 'tagVote',
        placeId: this.data.placeId,
        tagId,
        vote
      });
      cache[tagId] = vote;
      // A 方案：必须全部标签都投过才自动关闭
      const total = this.data.voteTags.length;
      const voted = this.data.voteTags.filter(t => cache[t.id] !== undefined).length;
      this.setData({ tagCache: cache });
      if (voted >= total) {
        this.setData({ showTagVote: false });
        wx.showToast({ title: '感谢您的反馈！', icon: 'none' });
      } else {
        wx.showToast({ title: '投票成功', icon: 'success' });
      }
    } catch (err) {
      wx.showToast({ title: err.message || '投票失败', icon: 'none' });
    }
  },

  // 全量 tag 合并：TAGS.js 全量 + 后端 tagList（pos/neg/total）
  _buildTagListWithStats(backendTagList) {
    // 把后端数组转成 { id: {pos, neg, total} }
    const statMap = {};
    backendTagList.forEach(t => { statMap[t.id] = t; });
    return TAGS.map(t => {
      const stat = statMap[t.id] || { pos: 0, neg: 0, total: 0 };
      const pos = stat.pos || 0;
      const neg = stat.neg || 0;
      const total = stat.total || 0;
      let color = 'gray';
      if (total >= 3) {
        const posRate = pos / total;
        if (posRate > 0.7) color = 'green';
        else if (posRate < 0.3) color = 'red';
      }
      return {
        id: t.id,
        name: t.name,
        pos, neg, total,
        color
      };
    });
  },

  // ── P1: 品种分布展示判定 ──
  get shouldShowBreed() {
    const bd = this.data.breedDistribution || {};
    return bd.top && bd.unknown_ratio !== undefined && bd.unknown_ratio <= 0.3;
  },
  get breedList() {
    const bd = this.data.breedDistribution || {};
    if (!bd.top) return [];
    return Object.entries(bd.top).map(([k, v]) => ({ name: k, count: v }));
  },

  // ── P1: 时段热度渲染 ──
  getHeatValue(weekday, hour) {
    const hm = this.data.hourlyHeatmap || {};
    return hm[`${weekday}-${hour}`] || 0;
  },
  getHeatColor(weekday, hour) {
    const val = this.getHeatValue(weekday, hour);
    const maxVal = Math.max(1, ...Object.values(this.data.hourlyHeatmap || {}).map(Number));
    const ratio = Math.min(val / maxVal, 1);
    // 从浅灰 #F5F5F5 到品牌色 #FF6B35
    const r = Math.round(245 - (245 - 255) * ratio);
    const g = Math.round(245 - (245 - 107) * ratio);
    const b = Math.round(245 - (245 - 53) * ratio);
    return `rgb(${r},${g},${b})`;
  },

  // HOUR_SLOTS and WEEKDAYS for WXML iteration
  get hourSlots() { return [6, 9, 12, 14, 17, 20]; },
  get hourLabels() { return ['早晨', '上午', '中午', '下午', '傍晚', '夜间']; },
  get weekdays() { return ['一','二','三','四','五','六','日']; },

  // ── 照片上传 ──
  async uploadPhoto() {
    // 1. 检查位置权限
    try {
      const authResult = await new Promise((resolve, reject) => {
        wx.getSetting({ success: resolve, fail: reject });
      });
      if (!authResult.authSetting['scope.userLocation']) {
        wx.showModal({
          title: '需要位置权限',
          content: '需要获取您的位置信息来确认您在附近',
          success: (res) => {
            if (res.confirm) wx.openSetting();
          }
        });
        return;
      }
    } catch (e) { wx.showToast({ title: '需要位置权限', icon: 'none' }); return; }

    // 2. 获取当前位置
    wx.getLocation({
      type: 'gcj02',
      success: async (res) => {
        const dist = this.calcDistance(
          res.latitude, res.longitude,
          this.data.place.latitude, this.data.place.longitude
        );
        if (dist > 500) {
          wx.showToast({ title: '请到附近后再上传照片', icon: 'none' });
          return;
        }

        // 3. 选择照片
        wx.chooseImage({
          count: 1,
          sizeType: ['compressed'],
          success: async (imgRes) => {
            wx.showLoading({ title: '上传中…' });
            try {
              const cloudRes = await wx.cloud.uploadFile({
                cloudPath: `mp-place/${this.data.placeId}/${Date.now()}.jpg`,
                filePath: imgRes.tempFilePaths[0]
              });
              // 写入 mp_place.images
              await request('mp-place', {
                action: 'addImage',
                placeId: this.data.placeId,
                imageFileId: cloudRes.fileID
              });
              wx.hideLoading();
              wx.showToast({ title: '上传成功', icon: 'success' });
              this.loadDetail(this.data.placeId);
            } catch (e) {
              wx.hideLoading();
              wx.showToast({ title: '上传失败', icon: 'none' });
            }
          }
        });
      }
    });
  },

  calcDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
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

  onFormChange(e) { const field = e.currentTarget.dataset.field; this.setData({ ['form.' + field]: e.detail.value }); },
  selectCat(e) { this.setData({ 'form.category': e.currentTarget.dataset.val }); },

  // 地图选点：wx.chooseLocation 原生体验最好（自带搜索 + 移动 marker）
  openMapPicker() {
    const { initLat, initLng } = this.data;
    wx.chooseLocation({
      // 优先用外面对应地图的位置，否则用上次选的，否则南京默认
      latitude: this.data.form.latitude || initLat || 32.06,
      longitude: this.data.form.longitude || initLng || 118.79,
      success: (res) => {
        if (!res.latitude || !res.longitude) return;
        this.setData({
          'form.latitude': res.latitude,
          'form.longitude': res.longitude,
          'form.geoAddress': res.address || res.name || ''
        });
      },
      fail: (err) => {
        // 打印原始错误，便于排查
        console.warn('[chooseLocation] fail:', err);
        if (!err || !err.errMsg) {
          wx.showToast({ title: '选点失败', icon: 'none' });
          return;
        }
        if (err.errMsg.includes('cancel')) return;   // 用户取消
        if (err.errMsg.includes('auth deny') || err.errMsg.includes('authorize')) {
          wx.showModal({
            title: '需要位置权限',
            content: '请在设置中允许使用位置，再选点',
            confirmText: '去设置',
            success: (r) => { if (r.confirm) wx.openSetting(); }
          });
          return;
        }
        if (err.errMsg.includes('map')) {
          wx.showToast({ title: '地图组件未就绪，请稍后再试', icon: 'none' });
          return;
        }
        wx.showToast({ title: '选点失败：' + err.errMsg, icon: 'none' });
      }
    });
  },

  async handleSubmit() {
    const { name, category, detailAddress, latitude, longitude } = this.data.form;
    if (!name || !category) { wx.showToast({ title: '请填写名称和分类', icon: 'none' }); return; }
    if (latitude == null || longitude == null) { wx.showToast({ title: '请在地图上选择位置', icon: 'none' }); return; }
    if (!detailAddress) { wx.showToast({ title: '请填写详细地址说明', icon: 'none' }); return; }

    // 拼装完整 address：地图反查地址 + 用户描述
    const { geoAddress } = this.data.form;
    const fullAddress = geoAddress ? `${geoAddress}（${detailAddress}）` : detailAddress;

    this.setData({ submitting: true });
    try {
      await request('mp-place', {
        action: 'submit',
        name, category,
        address: fullAddress,
        latitude, longitude,
        phone: this.data.form.phone,
        businessHours: this.data.form.businessHours,
        petPolicy: this.data.form.petPolicy
      });
      wx.showToast({ title: '已提交审核', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 1000);
    } catch (err) { wx.showToast({ title: err.message || '提交失败', icon: 'none' }); }
    finally { this.setData({ submitting: false }); }
  },

  categoryLabel(cat) { return CAT_LABELS[cat] || cat; },
  sourceLabel(source) { return SOURCE_LABELS[source || 'unknown'] || SOURCE_LABELS.unknown; },
  formatPlaceTime(value) { return formatDate(value); }
});
