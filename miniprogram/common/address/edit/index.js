// common/address/edit/index.js — 新增/编辑地址
const { request } = require('../../../utils/request');

Page({
  data: {
    isEdit: false,
    editId: null,
    regionText: '',
    saving: false,
    form: {
      receiverName: '',
      phone: '',
      province: '',
      city: '',
      district: '',
      detail: '',
      isDefault: false
    }
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ isEdit: true, editId: options.id });
      this.loadExisting(options.id);
    }
  },

  async loadExisting(id) {
    try {
      const res = await request('common-address', { action: 'list' });
      if (res.code === 1) {
        const addr = res.data.find(a => a.id === id);
        if (addr) {
          this.setData({
            form: { ...addr },
            regionText: [addr.province, addr.city, addr.district].filter(Boolean).join(' ')
          });
        }
      }
    } catch (e) {
      // 降级本地
      const raw = wx.getStorageSync('addresses');
      const addresses = raw ? JSON.parse(raw) : [];
      const addr = addresses.find(a => a.id === id);
      if (addr) {
        this.setData({
          form: { ...addr },
          regionText: [addr.province, addr.city, addr.district].filter(Boolean).join(' ')
        });
      }
    }
  },

  onFieldChange(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ ['form.' + field]: e.detail.value });
  },

  onRegionChange(e) {
    const [province, city, district] = e.detail.value;
    this.setData({
      'form.province': province,
      'form.city': city,
      'form.district': district,
      regionText: [province, city, district].join(' ')
    });
  },

  toggleDefault() {
    this.setData({ 'form.isDefault': !this.data.form.isDefault });
  },

  async handleSave() {
    const { receiverName, phone, detail } = this.data.form;
    if (!receiverName || !phone || !detail) {
      wx.showToast({ title: '请填写完整信息', icon: 'none' });
      return;
    }
    if (!/^1\d{10}$/.test(phone)) {
      wx.showToast({ title: '手机号格式不正确', icon: 'none' });
      return;
    }

    this.setData({ saving: true });
    try {
      await request('common-address', {
        action: 'save',
        id: this.data.editId,
        ...this.data.form
      });
      wx.showToast({ title: '保存成功', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 800);
    } catch (err) {
      // 降级本地保存
      try {
        const raw = wx.getStorageSync('addresses');
        let addresses = raw ? JSON.parse(raw) : [];
        if (this.data.isEdit) {
          addresses = addresses.map(a =>
            a.id === this.data.editId ? { ...this.data.form, id: this.data.editId } : a
          );
        } else {
          addresses.push({ ...this.data.form, id: 'addr_' + Date.now() });
        }
        wx.setStorageSync('addresses', JSON.stringify(addresses));
        wx.showToast({ title: '保存成功', icon: 'success' });
        setTimeout(() => wx.navigateBack(), 800);
      } catch (e2) {
        wx.showToast({ title: '保存失败', icon: 'none' });
      }
    } finally {
      this.setData({ saving: false });
    }
  }
});
