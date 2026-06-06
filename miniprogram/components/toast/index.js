// components/toast/index.js — 轻量 Toast（备用，页面优先用 wx.showToast）
Component({
  properties: {
    show: { type: Boolean, value: false },
    message: { type: String, value: '' },
    icon: { type: String, value: 'success' },
    duration: { type: Number, value: 2000 }
  },
  observers: {
    'show': function(val) {
      if (val) {
        setTimeout(() => {
          this.setData({ show: false });
        }, this.data.duration);
      }
    }
  }
});
