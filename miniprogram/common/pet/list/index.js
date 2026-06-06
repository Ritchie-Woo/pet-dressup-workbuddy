// common/pet/list/index.js — 宠物列表
const { getPetList } = require('../../../utils/request');

Page({
  data: {
    pets: [],
    loading: true
  },

  onShow() {
    this.loadPets();
  },

  async loadPets() {
    this.setData({ loading: true });
    try {
      const res = await getPetList();
      this.setData({ pets: res.data.pets || [] });
    } catch (err) {
      console.error('宠物列表加载失败', err);
    } finally {
      this.setData({ loading: false });
    }
  },

  goCreate() {
    wx.navigateTo({ url: '/common/pet/create/index' });
  },

  goDetail(e) {
    const petId = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/common/pet/detail/index?petId=' + petId });
  }
});
