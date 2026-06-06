// wp/avatar/index.js — 宠物选择 → 创建 2D 形象
const { request } = require('../../utils/request');
const storage = require('../../utils/storage');

Page({
  data: {
    pets: [],
    loading: true
  },

  _loading: false,

  onShow() {
    if (this._loading) return;
    this.loadPets();
  },

  async loadPets() {
    if (this._loading) return;
    this._loading = true;
    this.setData({ loading: true });
    try {
      const res = await request('common-pet', { action: 'list' }, { silent: true });
      const pets = (res.data.pets || []).map(p => ({ ...p, hasAvatar: false }));
      this.setData({ pets, loading: false });
      this._loading = false;

      // 并行检查哪些宠物已有 2D 形象（避免串行累积超时）
      const checks = pets.map(async (pet) => {
        try {
          const avatarRes = await request('wp-avatar', { action: 'getByPet', petId: pet.petId }, { silent: true });
          if (avatarRes && avatarRes.code === 1) {
            pet.hasAvatar = true;
            pet.avatarData = avatarRes.data;
          }
        } catch (e) { /* 忽略 */ }
      });
      await Promise.all(checks);
      // 批量更新一次，避免多次 setData
      if (pets.length) {
        this.setData({ pets: this.data.pets });
      }
    } catch (err) {
      console.error('加载宠物列表失败', err);
      this.setData({ loading: false });
      this._loading = false;
    }
  },

  async selectPet(e) {
    const petId = e.currentTarget.dataset.id;
    const pet = this.data.pets.find(p => p.petId === petId);
    if (!pet) return;

    wx.showLoading({ title: '加载中…' });
    try {
      // 创建或获取 2D 形象
      const res = await request('wp-avatar', {
        action: 'createOrGet',
        petId: pet.petId,
        species: pet.species,
        breed: pet.breed
      });

      if (res.code === 1) {
        // 缓存当前穿搭宠物
        storage.setSync('currentDressPet', {
          petId: pet.petId,
          petName: pet.name,
          avatarId: res.data.avatarId,
          baseAppearance: res.data.baseAppearance,
          currentOutfit: res.data.currentOutfit
        });
        wx.switchTab({ url: '/wp/dressup/index' });
      }
    } catch (err) {
      console.error('创建 2D 形象失败', err);
      wx.showToast({ title: err.message || '加载失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  goCreatePet() {
    wx.navigateTo({
      url: '/common/pet/create/index',
      fail(err) {
        console.error('[avatar] navigateTo pet/create 失败', err);
        wx.showToast({ title: '页面跳转失败，请重试', icon: 'none' });
      }
    });
  },

  goBack() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack();
    } else {
      wx.switchTab({ url: '/wp/dressup/index' });
    }
  }
});
