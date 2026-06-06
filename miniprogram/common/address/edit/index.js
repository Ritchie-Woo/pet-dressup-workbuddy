// common/address/edit/index.js — 新增/编辑地址
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
      // 从本地存储加载已有地址
      const raw = wx.getStorageSync('addresses');
      const addresses = raw ? JSON.parse(raw) : [];
      const addr = addresses.find(a => a.id === options.id);
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

  handleSave() {
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
      const raw = wx.getStorageSync('addresses');
      let addresses = raw ? JSON.parse(raw) : [];

      if (this.data.isEdit) {
        addresses = addresses.map(a =>
          a.id === this.data.editId ? { ...this.data.form, id: this.data.editId } : a
        );
      } else {
        const id = 'addr_' + Date.now();
        addresses.push({ ...this.data.form, id });
      }

      // 如果设为默认，取消其他默认
      if (this.data.form.isDefault) {
        addresses = addresses.map(a => ({ ...a, isDefault: a.id === (this.data.editId || addresses[addresses.length - 1]?.id) }));
      }

      wx.setStorageSync('addresses', JSON.stringify(addresses));
      wx.showToast({ title: '保存成功', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 800);
    } catch (err) {
      wx.showToast({ title: '保存失败', icon: 'none' });
    } finally {
      this.setData({ saving: false });
    }
  }
});
