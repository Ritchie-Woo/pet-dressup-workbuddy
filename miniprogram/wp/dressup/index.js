// wp/dressup/index.js — Airbnb 4:6 布局
const storage = require('../../utils/storage');
const { request } = require('../../utils/request');

Page({
  data: {
    pets: [],
    selectedPetId: '',
    selectedPetName: '',
    avatarCreated: false,
    canvasSize: 350,
    loading: true,
    generating: false
  },

  _loading: false,

  onLoad() {
    const app = getApp();
    if (!app.globalData.token) {
      wx.redirectTo({ url: '/common/login/index' });
    }
  },

  onShow() {
    if (this._loading) return;
    this.loadPets();
  },

  async loadPets() {
    this._loading = true;
    this.setData({ loading: true });
    try {
      const res = await request('common-pet', { action: 'list' }, { silent: true });
      const pets = (res.data.pets || []).map(p => ({ ...p }));
      this.setData({ pets, loading: false });
      this._loading = false;

      // Restore last selected
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

    // Check if avatar exists
    try {
      const avatarRes = await request('wp-avatar', { action: 'getByPet', petId }, { silent: true });
      if (avatarRes && avatarRes.code === 1) {
        this.setData({ avatarCreated: true });
        // Cache and render
        storage.setSync('currentDressPet', {
          petId, petName: pet.name,
          avatarId: avatarRes.data.avatarId,
          baseAppearance: avatarRes.data.baseAppearance,
          currentOutfit: avatarRes.data.currentOutfit
        });
        setTimeout(() => this.renderCanvas(), 300);
      } else {
        this.setData({ avatarCreated: false });
      }
    } catch (err) {
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
        force: true  // 重新生成时强制覆盖
      });
      if (res.code === 1) {
        storage.setSync('currentDressPet', {
          petId: pet.petId, petName: pet.name,
          avatarId: res.data.avatarId,
          baseAppearance: res.data.baseAppearance,
          currentOutfit: res.data.currentOutfit
        });
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

    // 1. 选照片
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
      // 2. 上传到云存储
      const cloudPath = 'photos/pet_' + Date.now() + '_' + Math.random().toString(36).slice(2) + '.jpg';
      const uploadRes = await wx.cloud.uploadFile({
        cloudPath,
        filePath: chooseRes.tempFilePaths[0]
      });

      // 3. 调云函数 AI 生成
      const res = await request('wp-avatar', {
        action: 'photo2avatar',
        petId: pet.petId,
        photoFileID: uploadRes.fileID,
        species: pet.species,
        breed: pet.breed
      }, { timeout: 120000, silent: true }); // AI 生成需要更长时间，静默模式，自己处理提示

      if (res.code === 1) {
        storage.setSync('currentDressPet', {
          petId: pet.petId, petName: pet.name,
          avatarId: res.data.avatarId,
          baseAppearance: res.data.baseAppearance,
          currentOutfit: res.data.currentOutfit
        });
        this.setData({ avatarCreated: true });
        setTimeout(() => this.renderCanvas(), 500);
      } else {
        wx.showToast({ title: res.msg || '生成失败', icon: 'none' });
      }
    } catch (err) {
      const msg = err.message || '请求失败';
      console.error('[photo2avatar] err:', err);
      wx.showModal({
        title: '生成失败',
        content: msg,
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

      /* background */
      ctx.fillStyle = '#FFF5F5';
      ctx.fillRect(0, 0, w, w);

      const petInfo = storage.getSync('currentDressPet');
      if (!petInfo || !petInfo.baseAppearance) return;

      const base = petInfo.baseAppearance;

      // AI-generated image takes priority
      if (base.generated && base.resource) {
        wx.cloud.getTempFileURL({
          fileList: [base.resource],
          success: urlRes => {
            const imgUrl = urlRes.fileList[0].tempFileURL;
            const img = canvas.createImage();
            img.onload = () => {
              ctx.drawImage(img, 0, 0, w, w);
              this._drawCanvasButtons(ctx, w);
            };
            img.onerror = () => {
              this._drawFallback(ctx, w, base);
              this._drawCanvasButtons(ctx, w);
            };
            img.src = imgUrl;
          },
          fail: () => {
            this._drawFallback(ctx, w, base);
            this._drawCanvasButtons(ctx, w);
          }
        });
        return;
      }

      // Draw programmatic avatar
      this._drawFallback(ctx, w, base);
      this._drawCanvasButtons(ctx, w);

      // Render outfit layers
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

  // 在 canvas 上绘制图标（纯图标，无圆圈背景）
  _drawCanvasButtons(ctx, w) {
    const iconSize = 16; // 缩小一倍
    const gap = 12;
    const iconY = w - gap - iconSize;

    // 删除图标（左下）🗑️
    ctx.fillStyle = 'rgba(100,100,100,0.7)';
    ctx.font = iconSize + 'px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText('🗑️', gap, iconY);

    // 重新生成图标（右下）🔄
    ctx.fillStyle = '#FF5A5F';
    ctx.textAlign = 'right';
    ctx.fillText('🔄', w - gap, iconY);
  },

  // Canvas 点击事件 — 判断是否点击了图标
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

    // 删除图标点击区（左下）
    if (dx >= gap && dx <= gap + iconSize * 1.5 && dy >= iconY - iconSize && dy <= iconY + iconSize) {
      this.deleteAvatar();
      return;
    }
    // 重新生成图标点击区（右下）
    if (dx >= w - gap - iconSize * 1.5 && dx <= w - gap && dy >= iconY - iconSize && dy <= iconY + iconSize) {
      this.photo2Avatar();
      return;
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

    // Body
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.ellipse(cx, cy + r * 0.2, r, r * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.beginPath();
    ctx.arc(cx, cy - r * 0.45, r * 0.65, 0, Math.PI * 2);
    ctx.fill();

    // Ears
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.3, cy - r * 0.85);
    ctx.lineTo(cx - r * 0.55, cy - r * 1.15);
    ctx.lineTo(cx - r * 0.1, cy - r * 0.7);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx + r * 0.3, cy - r * 0.85);
    ctx.lineTo(cx + r * 0.55, cy - r * 1.15);
    ctx.lineTo(cx + r * 0.1, cy - r * 0.7);
    ctx.fill();

    // Inner ears
    ctx.fillStyle = '#F8C8C8';
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.35, cy - r * 0.88);
    ctx.lineTo(cx - r * 0.45, cy - r * 1.05);
    ctx.lineTo(cx - r * 0.18, cy - r * 0.75);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx + r * 0.35, cy - r * 0.88);
    ctx.lineTo(cx + r * 0.45, cy - r * 1.05);
    ctx.lineTo(cx + r * 0.18, cy - r * 0.75);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#333';
    ctx.beginPath(); ctx.arc(cx - r * 0.22, cy - r * 0.55, r * 0.08, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + r * 0.22, cy - r * 0.55, r * 0.08, 0, Math.PI * 2); ctx.fill();

    // Nose
    ctx.fillStyle = '#F8A0A0';
    ctx.beginPath();
    ctx.moveTo(cx, cy - r * 0.35);
    ctx.lineTo(cx - r * 0.06, cy - r * 0.28);
    ctx.lineTo(cx + r * 0.06, cy - r * 0.28);
    ctx.fill();

    // Whiskers
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 1;
    for (let side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(cx + side * r * 0.1, cy - r * 0.38);
      ctx.lineTo(cx + side * r * 0.45, cy - r * 0.48); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + side * r * 0.1, cy - r * 0.35);
      ctx.lineTo(cx + side * r * 0.48, cy - r * 0.33); ctx.stroke();
    }
  },

  _drawDog(ctx, w, color) {
    const colors = {
      golden: '#E8C370', tan: '#D4A76A', yellow: '#F0D060', brown: '#8B6914',
      silver: '#C0C0C0', black: '#444', white: '#FAFAFA'
    };
    const c = colors[color] || '#D4A76A';
    const cx = w / 2, cy = w / 2, r = w * 0.32;

    // Body
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.ellipse(cx, cy + r * 0.2, r * 0.85, r * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.beginPath();
    ctx.ellipse(cx, cy - r * 0.5, r * 0.6, r * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();

    // Floppy ears
    ctx.beginPath();
    ctx.ellipse(cx - r * 0.45, cy - r * 0.45, r * 0.2, r * 0.35, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + r * 0.45, cy - r * 0.45, r * 0.2, r * 0.35, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#333';
    ctx.beginPath(); ctx.arc(cx - r * 0.2, cy - r * 0.6, r * 0.08, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + r * 0.2, cy - r * 0.6, r * 0.08, 0, Math.PI * 2); ctx.fill();

    // Nose
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.ellipse(cx + r * 0.02, cy - r * 0.4, r * 0.1, r * 0.07, 0, 0, Math.PI * 2);
    ctx.fill();

    // Tongue
    ctx.fillStyle = '#F88';
    ctx.beginPath();
    ctx.ellipse(cx, cy - r * 0.28, r * 0.06, r * 0.08, 0, 0, Math.PI * 2);
    ctx.fill();
  },

  _drawGeneric(ctx, w, color) {
    const cx = w / 2, cy = w / 2, r = w * 0.32;
    ctx.fillStyle = '#E8E8E8';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#333';
    ctx.beginPath(); ctx.arc(cx - r * 0.3, cy - r * 0.2, r * 0.08, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + r * 0.3, cy - r * 0.2, r * 0.08, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy + r * 0.1, r * 0.12, Math.PI, 0);
    ctx.stroke();
  },

  goCreatePet() {
    wx.navigateTo({ url: '/common/pet/create/index' });
  }
});
