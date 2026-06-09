// wp/dressup/index.js — Airbnb 4:6 布局（带图片缓存）
const storage = require('../../utils/storage');
const { request } = require('../../utils/request');
const imageCache = require('../../utils/imageCache');

Page({
  data: {
    pets: [],
    selectedPetId: '',
    selectedPetName: '',
    avatarCreated: false,
    canvasSize: 350,
    loading: true,
    generating: false,
    recommendLoading: false,
    recommendPets: [],
    expandedCard: null,
    expandPhase: ''
  },

  _loading: false,
  _lastRenderedAvatarId: '',   // 避免重复渲染
  _cachedAvatarUrl: '',        // 缓存的云端形象 URL

  onLoad() {
    const app = getApp();
    if (!app.globalData.token) {
      wx.redirectTo({ url: '/common/login/index' });
    }
  },

  onShow() {
    if (this._loading) return;
    this.loadPets();
    this.loadRecommendPets();
  },

  async loadPets() {
    this._loading = true;
    this.setData({ loading: true });
    try {
      const res = await request('common-pet', { action: 'list' }, { silent: true });
      const pets = (res.data.pets || []).map(p => ({ ...p }));
      this.setData({ pets, loading: false });
      this._loading = false;

      const lastId = storage.getSync('selectedPetId');
      if (lastId && pets.some(p => p.petId === lastId)) {
        this.selectPetChip({ currentTarget: { dataset: { id: lastId } } });
      } else if (pets.length > 0) {
        this.selectPetChip({ currentTarget: { dataset: { id: pets[0].petId } } });
      }
    } catch (err) {
      console.error('加载宠物列表失败', err);
      this.setData({ loading: false });
      this._loading = false;
    }
  },

  async selectPetChip(e) {
    const petId = e.currentTarget.dataset.id;
    const pet = this.data.pets.find(p => p.petId === petId);
    if (!pet) return;

    storage.setSync('selectedPetId', petId);
    this.setData({ selectedPetId: petId, selectedPetName: pet.name });

    try {
      const avatarRes = await request('wp-avatar', { action: 'getByPet', petId }, { silent: true });
      if (avatarRes && avatarRes.code === 1) {
        const avatarId = avatarRes.data.avatarId;
        const base = avatarRes.data.baseAppearance;
        const outfit = avatarRes.data.currentOutfit;

        // 检查是否需要重新渲染
        const needRerender = this._lastRenderedAvatarId !== avatarId;

        this.setData({ avatarCreated: true });
        storage.setSync('currentDressPet', {
          petId, petName: pet.name,
          avatarId, baseAppearance: base, currentOutfit: outfit
        });

        if (needRerender) {
          // 预取形象 URL 并缓存
          if (base.generated && base.resource) {
            const urls = await imageCache.getTempUrls([base.resource]);
            this._cachedAvatarUrl = urls[0] || '';
          }
          this._lastRenderedAvatarId = avatarId;
          setTimeout(() => this.renderCanvas(), 300);
        }
      } else {
        this._lastRenderedAvatarId = '';
        this._cachedAvatarUrl = '';
        this.setData({ avatarCreated: false });
      }
    } catch (err) {
      this._lastRenderedAvatarId = '';
      this._cachedAvatarUrl = '';
      this.setData({ avatarCreated: false });
    }
  },

  async deleteAvatar() {
    const pet = this.data.pets.find(p => p.petId === this.data.selectedPetId);
    if (!pet) return;

    const res = await new Promise(resolve => {
      wx.showModal({
        title: '删除形象',
        content: '确定要删除 ' + pet.name + ' 的 2D 形象吗？',
        success: r => resolve(r.confirm)
      });
    });
    if (!res) return;

    wx.showLoading({ title: '删除中…' });
    try {
      const result = await request('wp-avatar', { action: 'deleteByPet', petId: pet.petId }, { silent: true });
      if (result.code === 1) {
        storage.remove('currentDressPet');
        this._lastRenderedAvatarId = '';
        this._cachedAvatarUrl = '';
        imageCache.clearCache();
        this.setData({ avatarCreated: false });
        wx.showToast({ title: '已删除', icon: 'success' });
      } else {
        wx.showToast({ title: result.msg || '删除失败', icon: 'none' });
      }
    } catch (err) {
      wx.showToast({ title: err.message || '删除失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  async createAvatar() {
    const pet = this.data.pets.find(p => p.petId === this.data.selectedPetId);
    if (!pet) return;

    wx.showLoading({ title: '生成中…' });
    try {
      const res = await request('wp-avatar', {
        action: 'createOrGet',
        petId: pet.petId, species: pet.species, breed: pet.breed,
        force: true
      });
      if (res.code === 1) {
        const base = res.data.baseAppearance;
        storage.setSync('currentDressPet', {
          petId: pet.petId, petName: pet.name,
          avatarId: res.data.avatarId,
          baseAppearance: base, currentOutfit: res.data.currentOutfit
        });
        // 预取 URL
        if (base.generated && base.resource) {
          const urls = await imageCache.getTempUrls([base.resource]);
          this._cachedAvatarUrl = urls[0] || '';
        }
        this._lastRenderedAvatarId = res.data.avatarId;
        this.setData({ avatarCreated: true });
        setTimeout(() => this.renderCanvas(), 300);
      }
    } catch (err) {
      wx.showToast({ title: err.message || '生成失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  async photo2Avatar() {
    const pet = this.data.pets.find(p => p.petId === this.data.selectedPetId);
    if (!pet) return;

    const chooseRes = await new Promise((resolve, reject) => {
      wx.chooseImage({
        count: 1, sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: resolve, fail: reject
      });
    }).catch(() => null);
    if (!chooseRes) return;

    this.setData({ generating: true });
    wx.showLoading({ title: '上传并生成中…' });

    try {
      const cloudPath = 'photos/pet_' + Date.now() + '_' + Math.random().toString(36).slice(2) + '.jpg';
      const uploadRes = await wx.cloud.uploadFile({
        cloudPath,
        filePath: chooseRes.tempFilePaths[0]
      });

      const res = await request('wp-avatar', {
        action: 'photo2avatar',
        petId: pet.petId, photoFileID: uploadRes.fileID,
        species: pet.species, breed: pet.breed
      }, { timeout: 120000, silent: true });

      if (res.code === 1) {
        const base = res.data.baseAppearance;
        storage.setSync('currentDressPet', {
          petId: pet.petId, petName: pet.name,
          avatarId: res.data.avatarId,
          baseAppearance: base, currentOutfit: res.data.currentOutfit
        });
        if (base.generated && base.resource) {
          const urls = await imageCache.getTempUrls([base.resource]);
          this._cachedAvatarUrl = urls[0] || '';
        }
        this._lastRenderedAvatarId = res.data.avatarId;
        this.setData({ avatarCreated: true });
        setTimeout(() => this.renderCanvas(), 500);
      } else {
        wx.showToast({ title: res.msg || '生成失败', icon: 'none' });
      }
    } catch (err) {
      console.error('[photo2avatar] err:', err);
      wx.showModal({
        title: '生成失败',
        content: err.message || '请求失败',
        showCancel: false
      });
    } finally {
      wx.hideLoading();
      this.setData({ generating: false });
    }
  },

  renderCanvas() {
    const query = wx.createSelectorQuery();
    query.select('#petCanvas').fields({ node: true, size: true }).exec((res) => {
      if (!res[0] || !res[0].node) { setTimeout(() => this.renderCanvas(), 300); return; }
      const canvas = res[0].node;
      const ctx = canvas.getContext('2d');
      const dpr = wx.getWindowInfo().pixelRatio;
      const w = this.data.canvasSize;
      canvas.width = w * dpr;
      canvas.height = w * dpr;
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, w);

      ctx.fillStyle = '#FFF5F5';
      ctx.fillRect(0, 0, w, w);

      const petInfo = storage.getSync('currentDressPet');
      if (!petInfo || !petInfo.baseAppearance) return;

      const base = petInfo.baseAppearance;

      // AI 生成形象优先 — 使用缓存的 URL
      if (base.generated && base.resource) {
        const imgUrl = this._cachedAvatarUrl;
        if (imgUrl) {
          const img = canvas.createImage();
          img.onload = () => {
            ctx.drawImage(img, 0, 0, w, w);
            this._drawCanvasButtons(ctx, w);
          };
          img.onerror = () => {
            // 缓存失效，重新获取
            this._refreshAndDraw(ctx, w, base);
          };
          img.src = imgUrl;
        } else {
          this._refreshAndDraw(ctx, w, base);
        }
        return;
      }

      this._drawFallback(ctx, w, base);
      this._drawCanvasButtons(ctx, w);

      // 穿搭层
      if (petInfo.currentOutfit) {
        const layers = ['bottom', 'top', 'collar', 'hat', 'accessory'];
        for (const layer of layers) {
          const layerData = petInfo.currentOutfit[layer];
          if (!layerData) continue;
          const itemUrl = typeof layerData === 'string' ? layerData : layerData.resourceUrl || layerData.url;
          if (itemUrl) {
            const img = canvas.createImage();
            img.onload = () => ctx.drawImage(img, 26, 40, 300, 300);
            img.onerror = () => {};
            img.src = itemUrl;
          }
        }
      }
    });
  },

  _refreshAndDraw(ctx, w, base) {
    // 缓存失效时重新获取并缓存
    imageCache.getTempUrls([base.resource]).then(urls => {
      this._cachedAvatarUrl = urls[0] || '';
      const img = ctx.canvas.createImage();
      img.onload = () => { ctx.drawImage(img, 0, 0, w, w); this._drawCanvasButtons(ctx, w); };
      img.onerror = () => { this._drawFallback(ctx, w, base); this._drawCanvasButtons(ctx, w); };
      img.src = this._cachedAvatarUrl;
    }).catch(() => {
      this._drawFallback(ctx, w, base);
      this._drawCanvasButtons(ctx, w);
    });
  },

  _drawCanvasButtons(ctx, w) {
    const iconSize = 16;
    const gap = 12;
    const iconY = w - gap - iconSize;
    ctx.fillStyle = 'rgba(100,100,100,0.7)';
    ctx.font = iconSize + 'px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText('🗑️', gap, iconY);
    ctx.fillStyle = '#FF5A5F';
    ctx.textAlign = 'right';
    ctx.fillText('🔄', w - gap, iconY);
  },

  onCanvasTap(e) {
    if (!this.data.avatarCreated) return;
    const touch = e.touches[0];
    if (!touch) return;
    const w = this.data.canvasSize;
    const iconSize = 16;
    const gap = 12;
    const iconY = w - gap - iconSize;
    const dx = touch.x;
    const dy = touch.y;
    if (dx >= gap && dx <= gap + iconSize * 1.5 && dy >= iconY - iconSize && dy <= iconY + iconSize) {
      this.deleteAvatar(); return;
    }
    if (dx >= w - gap - iconSize * 1.5 && dx <= w - gap && dy >= iconY - iconSize && dy <= iconY + iconSize) {
      this.photo2Avatar(); return;
    }
  },

  _drawFallback(ctx, w, base) {
    const species = base.species || 'other';
    if (species === 'cat') {
      this._drawCat(ctx, w, base.color);
    } else if (species === 'dog') {
      this._drawDog(ctx, w, base.color);
    } else {
      this._drawGeneric(ctx, w, base.color);
    }
  },

  _drawCat(ctx, w, color) {
    const colors = {
      blue: '#7B9CB5', silver: '#C0C0C0', orange: '#F4A460', cream: '#F5DEB3',
      white: '#FAFAFA', black: '#444', brown: '#8B6914', yellow: '#F0D060'
    };
    const c = colors[color] || '#C0C0C0';
    const cx = w / 2, cy = w / 2, r = w * 0.32;
    ctx.fillStyle = c;
    ctx.beginPath(); ctx.ellipse(cx, cy + r * 0.2, r, r * 0.8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy - r * 0.45, r * 0.65, 0, Math.PI * 2); ctx.fill();
    // Ears
    ctx.beginPath(); ctx.moveTo(cx - r * 0.3, cy - r * 0.85); ctx.lineTo(cx - r * 0.55, cy - r * 1.15); ctx.lineTo(cx - r * 0.1, cy - r * 0.7); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx + r * 0.3, cy - r * 0.85); ctx.lineTo(cx + r * 0.55, cy - r * 1.15); ctx.lineTo(cx + r * 0.1, cy - r * 0.7); ctx.fill();
    ctx.fillStyle = '#F8C8C8';
    ctx.beginPath(); ctx.moveTo(cx - r * 0.35, cy - r * 0.88); ctx.lineTo(cx - r * 0.45, cy - r * 1.05); ctx.lineTo(cx - r * 0.18, cy - r * 0.75); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx + r * 0.35, cy - r * 0.88); ctx.lineTo(cx + r * 0.45, cy - r * 1.05); ctx.lineTo(cx + r * 0.18, cy - r * 0.75); ctx.fill();
    // Eyes
    ctx.fillStyle = '#333';
    ctx.beginPath(); ctx.arc(cx - r * 0.22, cy - r * 0.55, r * 0.08, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + r * 0.22, cy - r * 0.55, r * 0.08, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#F8A0A0';
    ctx.beginPath(); ctx.moveTo(cx, cy - r * 0.35); ctx.lineTo(cx - r * 0.06, cy - r * 0.28); ctx.lineTo(cx + r * 0.06, cy - r * 0.28); ctx.fill();
    ctx.strokeStyle = '#999'; ctx.lineWidth = 1;
    for (let side of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(cx + side * r * 0.1, cy - r * 0.38); ctx.lineTo(cx + side * r * 0.45, cy - r * 0.48); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + side * r * 0.1, cy - r * 0.35); ctx.lineTo(cx + side * r * 0.48, cy - r * 0.33); ctx.stroke();
    }
  },

  _drawDog(ctx, w, color) {
    const colors = {
      golden: '#E8C370', tan: '#D4A76A', yellow: '#F0D060', brown: '#8B6914',
      silver: '#C0C0C0', black: '#444', white: '#FAFAFA'
    };
    const c = colors[color] || '#D4A76A';
    const cx = w / 2, cy = w / 2, r = w * 0.32;
    ctx.fillStyle = c;
    ctx.beginPath(); ctx.ellipse(cx, cy + r * 0.2, r * 0.85, r * 0.7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx, cy - r * 0.5, r * 0.6, r * 0.55, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx - r * 0.45, cy - r * 0.45, r * 0.2, r * 0.35, -0.3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + r * 0.45, cy - r * 0.45, r * 0.2, r * 0.35, 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#333';
    ctx.beginPath(); ctx.arc(cx - r * 0.2, cy - r * 0.6, r * 0.08, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + r * 0.2, cy - r * 0.6, r * 0.08, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#333';
    ctx.beginPath(); ctx.ellipse(cx + r * 0.02, cy - r * 0.4, r * 0.1, r * 0.07, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#F88';
    ctx.beginPath(); ctx.ellipse(cx, cy - r * 0.28, r * 0.06, r * 0.08, 0, 0, Math.PI * 2); ctx.fill();
  },

  _drawGeneric(ctx, w, color) {
    const cx = w / 2, cy = w / 2, r = w * 0.32;
    ctx.fillStyle = '#E8E8E8';
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#333';
    ctx.beginPath(); ctx.arc(cx - r * 0.3, cy - r * 0.2, r * 0.08, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + r * 0.3, cy - r * 0.2, r * 0.08, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy + r * 0.1, r * 0.12, Math.PI, 0); ctx.stroke();
  },

  goCreatePet() {
    wx.navigateTo({ url: '/common/pet/create/index' });
  },

  async loadRecommendPets() {
    try {
      const res = await request('wp-recommend', { action: 'list' }, { silent: true });
      const pets = (res.data.pets || []).map(p => ({
        ...p,
        gender: this._normalizeGender(p.gender),
        bg: this._getCardBg(this._normalizeGender(p.gender))
      }));
      this.setData({ recommendPets: pets });
    } catch (err) {
      console.error('[loadRecommendPets]', err);
    }
  },

  _normalizeGender(g) {
    if (!g) return '女生';
    if (/^(male|男|公|男生)$/i.test(g)) return '男生';
    return '女生';
  },

  _getCardBg(gender) {
    return gender === '男生'
      ? 'linear-gradient(135deg,#E3F0FF,#D0E4FF)'
      : 'linear-gradient(135deg,#FFE8E7,#FFD5D3)';
  },

  refreshRecommend() {
    if (this.data.recommendLoading) return;
    this.setData({ recommendLoading: true });
    this.loadRecommendPets().finally(() => {
      setTimeout(() => { this.setData({ recommendLoading: false }); }, 1200);
    });
  },

  onRecCardTap(e) {
    if (this.data.recommendLoading || this.data.expandedCard) return;
    const idx = parseInt(e.currentTarget.dataset.index);
    const pet = this.data.recommendPets[idx];
    if (!pet) return;
    this.setData({ expandedCard: { ...pet, index: idx }, expandPhase: 'start' });
    wx.nextTick(() => {
      this.setData({ expandPhase: 'expand' });
      this._expTimer = setTimeout(() => {
        if (this.data.expandPhase === 'expand') this.setData({ expandPhase: 'show' });
      }, 450);
    });
  },

  onExpCardTransitionEnd() {
    if (this._expTimer) { clearTimeout(this._expTimer); this._expTimer = null; }
    if (this.data.expandPhase === 'expand') this.setData({ expandPhase: 'show' });
  },

  closeExpand() {
    if (this._expTimer) { clearTimeout(this._expTimer); this._expTimer = null; }
    this.setData({ expandPhase: 'start' });
    setTimeout(() => { this.setData({ expandedCard: null, expandPhase: '' }); }, 300);
  },

  noop() {}
});
