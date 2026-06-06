// common/pet/detail/index.js — 宠物详情
const { getPetDetail, deletePet } = require('../../../utils/request');

Page({
  data: {
    pet: null,
    petId: '',
    loading: true
  },

  onLoad(options) {
    if (options.petId) {
      this.setData({ petId: options.petId });
      this.loadDetail(options.petId);
    }
  },

  async loadDetail(petId) {
    try {
      const res = await getPetDetail(petId);
      this.setData({ pet: res.data });
    } catch (err) {
      console.error('加载宠物详情失败', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1000);
    } finally {
      this.setData({ loading: false });
    }
  },

  goDressup() {
    wx.switchTab({ url: '/wp/dressup/index' });
  },

  goEdit() {
    // 复用 create 页面，带 petId 参数表示编辑模式
    wx.navigateTo({ url: '/common/pet/create/index?petId=' + this.data.petId });
  },

  confirmDelete() {
    wx.showModal({
      title: '确认删除',
      content: '删除后宠物档案和穿搭数据将无法恢复',
      confirmColor: '#FF4D4F',
      success: async (res) => {
        if (res.confirm) {
          try {
            await deletePet(this.data.petId);
            wx.showToast({ title: '已删除', icon: 'success' });
            setTimeout(() => wx.navigateBack(), 1000);
          } catch (err) {
            wx.showToast({ title: '删除失败', icon: 'none' });
          }
        }
      }
    });
  }
});
