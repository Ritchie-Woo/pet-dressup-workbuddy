// wp/share/index.js — 穿搭分享卡片生成
const storage = require('../../utils/storage');

Page({
  data: {
    loading: true,
    canvasW: 300,
    canvasH: 480,
    cardImagePath: ''
  },

  onLoad() {
    this.generateCard();
  },

  async generateCard() {
    const petInfo = storage.getSync('currentDressPet');
    if (!petInfo) {
      wx.showToast({ title: '请先选择宠物', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1000);
      return;
    }

    const query = wx.createSelectorQuery();
    query.select('#shareCanvas').fields({ node: true, size: true }).exec((res) => {
      if (!res[0] || !res[0].node) {
        setTimeout(() => this.generateCard(), 300);
        return;
      }

      try {
        const canvas = res[0].node;
        this._canvas = canvas;
        const ctx = canvas.getContext('2d');
        const dpr = wx.getWindowInfo().pixelRatio;
        const w = this.data.canvasW;
        const h = this.data.canvasH;

        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.scale(dpr, dpr);

        // 背景
        ctx.fillStyle = '#FFF8F0';
        ctx.fillRect(0, 0, w, h);

        // 顶部标题
        ctx.fillStyle = '#FF8C00';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('我的宠物穿搭', w / 2, 60);

        // 宠物名
        ctx.fillStyle = '#333';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText(petInfo.petName + ' 的今日穿搭', w / 2, 100);

        // 2D 形象（从穿搭页的快照区域截取）
        ctx.fillStyle = '#F5F5F5';
        ctx.fillRect(25, 130, 250, 250);
        ctx.fillStyle = '#ccc';
        ctx.font = '14px sans-serif';
        ctx.fillText('宠物 2D 形象', w / 2, 260);

        // 底部品牌
        ctx.fillStyle = '#999';
        ctx.font = '12px sans-serif';
        ctx.fillText('pet-wb · 给宠物穿搭 给主人团购', w / 2, 440);

        ctx.fillStyle = '#ddd';
        ctx.fillText('扫码看看 TA 的穿搭', w / 2, 460);

        this.setData({ loading: false });
      } catch (err) {
        console.error('分享卡片生成失败', err);
        this.setData({ loading: false });
      }
    });
  },

  async saveToAlbum() {
    try {
      const canvas = await this.getCanvasTempFile();
      await wx.saveImageToPhotosAlbum({ filePath: canvas });
      wx.showToast({ title: '已保存到相册', icon: 'success' });
    } catch (err) {
      if (err.errMsg && err.errMsg.includes('auth deny')) {
        wx.showModal({
          title: '需要相册权限',
          content: '请在设置中允许访问相册',
          confirmText: '去设置',
          success: (res) => {
            if (res.confirm) wx.openSetting();
          }
        });
      } else {
        wx.showToast({ title: '保存失败', icon: 'none' });
      }
    }
  },

  getCanvasTempFile() {
    return new Promise((resolve, reject) => {
      wx.canvasToTempFilePath({
        canvas: this._canvas,
        success: (res) => resolve(res.tempFilePath),
        fail: reject
      });
    });
  },

  onShareAppMessage() {
    return {
      title: '看看我家毛孩子的穿搭！',
      path: '/wp/dressup/index'
    };
  }
});
