// mbti/card/index.js — MBTI 结果卡片
const storage = require('../../utils/storage');
const { request } = require('../../utils/request');

Page({
  data: {
    result: null, loading: true
  },

  onLoad(options) {
    // 优先从缓存读取
    const cached = storage.getSync('mbtiResult');
    if (cached) {
      this.setData({ result: cached, loading: false });
    } else {
      wx.showToast({ title: '请先完成测试', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1000);
    }
  },

  goShare() {
    const r = this.data.result;
    if (!r) return;
    wx.showShareMenu({ withShareTicket: true });
    // 生成分享卡片可以用 Canvas 绘制（简化版用标题分享）
  },

  onShareAppMessage() {
    const r = this.data.result;
    return {
      title: r.petName + '是「' + r.typeName + '」型！来测测你家宠物的性格吧',
      path: '/mbti/test/index'
    };
  },

  retest() {
    wx.navigateTo({ url: '/mbti/test/index' });
  }
});
