// mp/map/index.js — 宠物友好地图
const { request } = require('../../utils/request');

const CAT_LABELS = { restaurant: '餐厅', cafe: '咖啡馆', park: '公园', pet_store: '宠物店', hospital: '医院', hotel: '宠物酒店', other: '其他' };

// 服务区域：南京 + 上海（矩形范围，用于快速判断）
const SERVICE_AREAS = [
  { name: '南京', latMin: 31.14, latMax: 32.62, lngMin: 118.22, lngMax: 119.25 },
  { name: '上海', latMin: 30.66, latMax: 31.83, lngMin: 120.84, lngMax: 122.12 },
];
const DEFAULT_CENTER = { lat: 32.06, lng: 118.79 }; // 南京市中心

function isInServiceArea(lat, lng) {
  return SERVICE_AREAS.some(a =>
    lat >= a.latMin && lat <= a.latMax && lng >= a.lngMin && lng <= a.lngMax
  );
}

function formatDistance(d) {
  if (d == null) return '';
  const m = Number(d);
  if (m >= 1000) return (m / 1000).toFixed(1) + 'km';
  return m + 'm';
}

Page({
  data: {
    latitude: DEFAULT_CENTER.lat,
    longitude: DEFAULT_CENTER.lng,
    markers: [], places: [],
    activeCategory: 'all',
    categoryActive: true,   // "全部"按钮的开关状态：true=显示所有/分类筛选中，false=已取消（清空 markers）
    truncated: false,   // 是否被截断（≥50 条时为 true）
    listSnap: 1,        // 列表三段：0=0vh 收起 / 1=30vh 默认折叠 / 2=50vh 中段 / 3=80vh 全展开
    _dragVh: null,      // 拖动中临时高度（vh）
    _dragging: false,   // 是否正在拖动（控制过渡）
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

  // 防抖：避免 onRegionChange 频繁触发云函数请求
  _loading: false,
  _regionTimer: null,  // regionChange end 的 debounce 定时器
  _lastCenter: null,   // 上次加载的中心点
  _placeMap: {},       // marker 索引 → placeId 映射
  _viewport: null,     // 上次查询的可视范围 {latMin,latMax,lngMin,lngMax}

  onLoad() {
    const app = getApp();
    if (!app.globalData.token) {
      wx.redirectTo({ url: '/common/login/index' });
      return;
    }
    // DEV: 开发阶段跳过 feature flag 检查，正式上线前恢复
    // if (!app.isFeatureEnabled('module_mp_enabled')) {
    //   wx.showToast({ title: '功能开发中', icon: 'none' });
    //   return;
    // }
    this.getLocation();
  },

  // 直接获取位置，失败再判断授权状态
  getLocation() {
    const mapCtx = wx.createMapContext('myMap');
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        if (isInServiceArea(res.latitude, res.longitude)) {
          this.setData({ latitude: res.latitude, longitude: res.longitude });
          this._lastCenter = { lat: res.latitude, lng: res.longitude };
          mapCtx.moveToLocation();
          // 移动到定位点后取可视区域
          setTimeout(() => this.fetchViewportAndLoad(), 200);
        } else {
          wx.showToast({ title: '当前区域暂无服务', icon: 'none', duration: 2500 });
          this.fallbackToDefault();
        }
      },
      fail: () => {
        wx.getSetting({
          success: (s) => {
            if (s.authSetting['scope.userLocation'] === false) {
              wx.showModal({
                title: '需要位置权限',
                content: '请在设置中允许使用位置信息，以查看附近宠物友好地点',
                confirmText: '去设置',
                success: (r) => { if (r.confirm) wx.openSetting(); }
              });
            }
            this.fallbackToDefault();
          }
        });
      }
    });
  },

  fallbackToDefault() {
    wx.showToast({ title: '使用默认位置', icon: 'none' });
    this.setData({ latitude: DEFAULT_CENTER.lat, longitude: DEFAULT_CENTER.lng });
    this._lastCenter = { lat: DEFAULT_CENTER.lat, lng: DEFAULT_CENTER.lng };
    // 默认位置直接用当前可视区域
    setTimeout(() => this.fetchViewportAndLoad(), 200);
  },

  locateMe() {
    const mapCtx = wx.createMapContext('myMap');
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        this.setData({ latitude: res.latitude, longitude: res.longitude });
        this._lastCenter = { lat: res.latitude, lng: res.longitude };
        mapCtx.moveToLocation();
        if (isInServiceArea(res.latitude, res.longitude)) {
          setTimeout(() => this.fetchViewportAndLoad(), 200);
        } else {
          wx.showToast({ title: '当前区域暂无服务', icon: 'none', duration: 2500 });
        }
      },
      fail: () => {
        wx.getSetting({
          success: (s) => {
            if (s.authSetting['scope.userLocation'] === false) {
              wx.showModal({
                title: '需要位置权限',
                content: '请在设置中允许使用位置信息',
                confirmText: '去设置',
                success: (r) => { if (r.confirm) wx.openSetting(); }
              });
            } else {
              wx.showToast({ title: '获取位置失败', icon: 'none' });
            }
          }
        });
      }
    });
  },

  async loadPlaces(lat, lng, viewport) {
    // 防抖：正在加载中则跳过
    if (this._loading) return;
    this._loading = true;
    const t0 = Date.now();

    try {
      const params = { lat, lng };
      // 优先用矩形范围（与地图可视区域对应）
      if (viewport) {
        Object.assign(params, viewport);
      }
      if (this.data.activeCategory !== 'all') params.category = this.data.activeCategory;
      // 拿到地图当前缩放，用于 marker label 显示
      const scale = await this._getCurrentScale();
      this._currentScale = scale;
      // A2：缩得很近（≥15）且区域内地点 ≤ 10 时才显示名称
      const showLabel = scale >= 15;

      if (this.data.keyword) {
        const res = await request('mp-place', { action: 'search', keyword: this.data.keyword });
        const places = res.data.places || [];
        places.forEach(p => { p.distanceText = formatDistance(p.distance); });
        this.setData({ places, truncated: false });
        this.updateMarkers(places, showLabel && places.length <= 10);
        console.log('[perf] load done (search)', { count: places.length, ms: Date.now() - t0 });
        return;
      }
      const res = await request('mp-place', { action: 'list', ...params });
      const places = res.data.places || [];
      places.forEach(p => { p.distanceText = formatDistance(p.distance); });
      this.setData({
        places,
        truncated: !!res.data.truncated
      });
      this.updateMarkers(places, showLabel && places.length <= 10);
      console.log('[perf] load done (list)', { count: places.length, ms: Date.now() - t0 });
    } catch (err) {
      console.error('加载地图数据失败', err);
    } finally {
      this._loading = false;
    }
  },

  // 异步获取地图当前缩放
  _getCurrentScale() {
    return new Promise((resolve) => {
      try {
        const mapCtx = wx.createMapContext('myMap');
        mapCtx.getScale({
          success: (res) => resolve(res.scale || 14),
          fail: () => resolve(14)
        });
      } catch (e) {
        resolve(14);
      }
    });
  },

  updateMarkers(places, showLabel) {
    const placeMap = {};
    // A 方案：数量分段缩放
    let size = 36;
    if (places.length <= 10) size = 42;
    else if (places.length <= 30) size = 32;
    else size = 24;

    const markers = places.map((p, i) => {
      placeMap[i] = p.placeId;
      return {
        id: i,                             // marker id 必须为数字
        latitude: p.latitude,
        longitude: p.longitude,
        title: p.name,
        iconPath: `/images/markers/${p.category || 'other'}.png`,
        width: size, height: size,
        // 缩得很近时：把 callout 从 BYCLICK 改为 ALWAYS 常显
        callout: showLabel ? {
          content: p.name,
          display: 'ALWAYS',
          padding: 6,
          borderRadius: 6,
          fontSize: 14,
          color: '#222',
          bgColor: '#ffffff',
          borderWidth: 1,
          borderColor: '#eeeeee',
          boxShadow: '0 2rpx 6rpx rgba(0,0,0,0.08)'
        } : {
          content: p.name + '\n' + (CAT_LABELS[p.category] || p.category) + ' · ' + formatDistance(p.distance),
          display: 'BYCLICK', padding: 8, borderRadius: 8
        }
      };
    });
    this._placeMap = placeMap;
    this.setData({ markers });
  },

  switchCategory(e) {
    const val = e.currentTarget.dataset.val;
    // "全部"按钮：开关态切换
    if (val === 'all') {
      if (this.data.categoryActive) {
        // 已激活 → 取消：清空 markers，列表维持当前段位
        this.setData({
          categoryActive: false,
          activeCategory: 'all',
          markers: [], places: [], truncated: false
        });
        return;
      }
      // 未激活 → 激活：加载全部
      this.setData({ categoryActive: true, activeCategory: 'all' }, () => {
        this.loadPlaces(this.data.latitude, this.data.longitude, this._viewport);
      });
      return;
    }
    // 其他分类：自动激活 + 切换（保持当前段位）
    this.setData({ categoryActive: true, activeCategory: val }, () => {
      this.loadPlaces(this.data.latitude, this.data.longitude, this._viewport);
    });
  },

  // 列表拖动（仅标题行 / 列表空白区有效，卡片上点击不触发拖动）
  onDragStart(e) {
    // 排除点击在卡片上：target.id 以 "card-" 开头说明点到卡片
    if (e.target && e.target.id && String(e.target.id).startsWith('card-')) {
      return;
    }
    this._dragStartY = e.touches[0].clientY;
    this._dragStartVh = this._getCurrentListVh();
    this._dragCurrentVh = this._dragStartVh;
    this._lastThrottleTime = 0;
    this.setData({ _dragging: true });
  },

  onDragMove(e) {
    // 60ms 节流
    const now = Date.now();
    if (now - this._lastThrottleTime < 60) return;
    this._lastThrottleTime = now;

    const deltaY = e.touches[0].clientY - this._dragStartY; // 向上滑为负
    const deltaVh = this._pxToVh(-deltaY);
    let newVh = this._dragStartVh + deltaVh;
    if (newVh < 0) newVh = 0;
    if (newVh > 80) newVh = 80;
    this._dragCurrentVh = newVh;
    this.setData({ _dragVh: newVh });
  },

  onDragEnd() {
    // 找最近的段
    const snaps = [0, 30, 50, 80];
    let target = snaps[0];
    let minDiff = Math.abs(this._dragCurrentVh - snaps[0]);
    for (let i = 1; i < snaps.length; i++) {
      const diff = Math.abs(this._dragCurrentVh - snaps[i]);
      if (diff < minDiff) {
        minDiff = diff;
        target = snaps[i];
      }
    }
    const snapIndex = snaps.indexOf(target);
    this.setData({
      listSnap: snapIndex,
      _dragVh: null,
      _dragging: false
    });
  },

  // 把手拖动（从完全收起 → 展开到 30vh）
  onHandleDragStart(e) {
    this._dragStartY = e.touches[0].clientY;
    this._dragStartVh = 0;
    this._dragCurrentVh = 0;
    this._lastThrottleTime = 0;
    this.setData({ _dragging: true, _dragVh: 0 });
  },

  onHandleDragMove(e) {
    const now = Date.now();
    if (now - this._lastThrottleTime < 60) return;
    this._lastThrottleTime = now;

    const deltaY = e.touches[0].clientY - this._dragStartY; // 向上滑为负
    const deltaVh = this._pxToVh(-deltaY);
    let newVh = deltaVh;  // 从 0 开始
    if (newVh < 0) newVh = 0;
    if (newVh > 80) newVh = 80;
    this._dragCurrentVh = newVh;
    this.setData({ _dragVh: newVh });
  },

  onHandleDragEnd() {
    // 从把手拉起来：吸附到 30 / 50 / 80
    const snaps = [0, 30, 50, 80];
    let target = 30;
    if (this._dragCurrentVh > 20) target = 30;
    if (this._dragCurrentVh > 40) target = 50;
    if (this._dragCurrentVh > 65) target = 80;
    const snapIndex = snaps.indexOf(target);
    this.setData({
      listSnap: snapIndex,
      _dragVh: null,
      _dragging: false
    });
  },

  // 卡片点击：先平滑移动到该店位置（ease-out 600ms），再跳详情
  onCardTap(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    const place = this.data.places.find(p => p.placeId === id);
    if (!place) {
      wx.navigateTo({ url: '/mp/place/index?id=' + id });
      return;
    }
    this._animateTo(place.latitude, place.longitude, 600, () => {
      wx.navigateTo({ url: '/mp/place/index?id=' + id });
    });
  },

  // marker 点击：map 组件会自动瞬移到 marker（系统行为），无需额外平滑
  onMarkerTap(e) {
    const id = this._placeMap[e.detail.markerId];
    if (!id) return;
    wx.navigateTo({ url: '/mp/place/index?id=' + id });
  },

  // 段位变化回调（来自 worklet 调用，暂未启用）
  onSnapChange(vh) {},

  // 平滑移动地图视野到目标经纬度（ease-out 缓动）
  _animateTo(endLat, endLng, duration, onDone) {
    const startLat = this.data.latitude;
    const startLng = this.data.longitude;
    const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      this.setData({
        latitude: startLat + (endLat - startLat) * ease,
        longitude: startLng + (endLng - startLng) * ease
      });
      if (t < 1) {
        setTimeout(tick, 16);
      } else if (onDone) {
        onDone();
      }
    };
    tick();
  },

  _getCurrentListVh() {
    const snaps = [0, 30, 50, 80];
    return snaps[this.data.listSnap] || 0;
  },

  _pxToVh(px) {
    try {
      const sysInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
      return (px / sysInfo.windowHeight) * 100;
    } catch (e) {
      return px / 8;
    }
  },

  onSearch(e) { this.setData({ keyword: e.detail.value }, () => this.loadPlaces(this.data.latitude, this.data.longitude)); },
  onSearchClear() { this.setData({ keyword: '' }, () => this.loadPlaces(this.data.latitude, this.data.longitude)); },

  onMarkerTap(e) {
    const id = this._placeMap[e.detail.markerId];
    if (!id) return;
    const place = this.data.places.find(p => p.placeId === id);
    if (place) {
      this.setData({ latitude: place.latitude, longitude: place.longitude });
    }
    setTimeout(() => {
      wx.navigateTo({ url: '/mp/place/index?id=' + id });
    }, 600);
  },

  goDetail(e) {
    wx.navigateTo({ url: '/mp/place/index?id=' + e.currentTarget.dataset.id });
  },

  onRegionChange(e) {
    // B1：只在拖动/缩放结束后触发 + 地图停止 700ms 后再加载
    if (e.type !== 'end') return;
    // 跳过 map 组件内部 update（moveToLocation / 视野重置时也会触发，不该刷新）
    if (e.causedBy !== 'drag' && e.causedBy !== 'scale') return;
    // 取消态下不触发刷新
    if (!this.data.categoryActive) return;

    // 清除上一次的定时器（用户继续操作时）
    if (this._regionTimer) clearTimeout(this._regionTimer);
    this._regionTimer = setTimeout(() => {
      this.fetchViewportAndLoad();
    }, 700);
  },

  // 主动拉取可视区域 + 中心点，再请求云函数
  fetchViewportAndLoad() {
    const mapCtx = wx.createMapContext('myMap');
    const t0 = Date.now();
    console.log('[perf] fetch start');
    // 同步拿可视区域 + 中心点
    mapCtx.getRegion({
      success: (region) => {
        // region = { southwest: {latitude,longitude}, northeast: {latitude,longitude}, errMsg }
        const sw = region.southwest || {};
        const ne = region.northeast || {};
        const viewport = {
          latMin: sw.latitude,
          latMax: ne.latitude,
          lngMin: sw.longitude,
          lngMax: ne.longitude
        };
        // 拿中心点用于距离计算
        mapCtx.getCenterLocation({
          success: (res) => {
            const { latitude, longitude } = res;
            console.log('[map] viewport:', viewport, 'center:', latitude, longitude);
            this._viewport = viewport;
            this._lastCenter = { lat: latitude, lng: longitude };
            this.setData({ latitude, longitude });
            if (!this.data.keyword) this.loadPlaces(latitude, longitude, viewport);
          }
        });
      },
      fail: (err) => {
        console.warn('[map] getRegion fail:', err);
        // 拿不到可视区域时降级用中心点（不判断距离，必触发）
        mapCtx.getCenterLocation({
          success: (res) => {
            const { latitude, longitude } = res;
            this._lastCenter = { lat: latitude, lng: longitude };
            this.setData({ latitude, longitude });
            if (!this.data.keyword) this.loadPlaces(latitude, longitude);
          }
        });
      }
    });
  },

  goSubmit() {
    // 把外面对应地图的中心点透传给投稿页，作为 chooseLocation 初始位置
    const { latitude, longitude } = this.data;
    wx.navigateTo({
      url: `/mp/place/index?mode=submit&lat=${latitude}&lng=${longitude}`
    });
  },

  categoryLabel(cat) { return CAT_LABELS[cat] || cat; }
});
