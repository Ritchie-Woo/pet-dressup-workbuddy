// gb/groupbuy/product/edit — 商品编辑/新建
const { sellerCreateProduct, sellerUpdateProduct, getProductDetail } = require('../../../../utils/request');

const CATEGORIES = [
  { value: 'clothing', label: '服饰' },
  { value: 'accessory', label: '项圈' },
  { value: 'food', label: '食品' },
  { value: 'toy', label: '玩具' },
  { value: 'grooming', label: '洗护' }
];

Page({
  data: {
    isEdit: false,
    productId: '',
    form: {
      name: '',
      description: '',
      category: 'clothing',
      priceGroup: '',
      priceOriginal: '',
      stock: 999,
      minGroupSize: 2,
      specs: [],
      images: []
    },
    categories: CATEGORIES,
    uploadFiles: [],
    uploadedImages: [],
    submitting: false
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ isEdit: true, productId: options.id });
      this._loadProduct(options.id);
    }
  },

  goBack() {
    wx.navigateBack({ delta: 1 });
  },

  async _loadProduct(id) {
    try {
      const res = await getProductDetail(id);
      if (res.code === 1) {
        const p = res.data;
        this.setData({
          form: {
            name: p.name || '',
            description: p.description || '',
            category: p.category || 'clothing',
            priceGroup: p.priceGroup || '',
            priceOriginal: p.priceOriginal || '',
            stock: p.stock || 999,
            minGroupSize: p.minGroupSize || 2,
            specs: p.specs || [],
            images: p.images || []
          },
          uploadedImages: p.images || [],
          uploadFiles: (p.images || []).map((url, i) => ({ url, name: `img${i}`, type: 'image' }))
        });
      }
    } catch (e) {
      wx.showToast({ title: '加载商品失败', icon: 'none' });
    }
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  onStepper(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  onCategory(e) {
    this.setData({ 'form.category': e.currentTarget.dataset.value });
  },

  // 规格
  addSpec() {
    const specs = [...this.data.form.specs, { name: '', options: [] }];
    this.setData({ 'form.specs': specs });
  },

  deleteSpec(e) {
    const idx = e.currentTarget.dataset.index;
    const specs = this.data.form.specs.filter((_, i) => i !== idx);
    this.setData({ 'form.specs': specs });
  },

  onSpecName(e) {
    const idx = e.currentTarget.dataset.index;
    this.setData({ [`form.specs[${idx}].name`]: e.detail.value });
  },

  addSpecOption(e) {
    const idx = e.currentTarget.dataset.index;
    const val = e.detail.value || '';
    if (!val.trim()) return;
    const options = [...this.data.form.specs[idx].options, val.trim()];
    this.setData({ [`form.specs[${idx}].options`]: options });
  },

  deleteSpecOption(e) {
    const { spec, opt } = e.currentTarget.dataset;
    const options = this.data.form.specs[spec].options.filter((_, i) => i !== opt);
    this.setData({ [`form.specs[${spec}].options`]: options });
  },

  // 图片上传
  onUploadAdd(e) {
    const files = e.detail.files;
    files.forEach(file => {
      wx.cloud.uploadFile({
        cloudPath: `products/${Date.now()}_${Math.random().toString(36).slice(2)}.png`,
        filePath: file.url
      }).then(res => {
        const images = [...this.data.uploadedImages, res.fileID];
        this.setData({ uploadedImages: images });
      }).catch(err => {
        console.error('上传失败', err);
      });
    });
  },

  onUploadRemove(e) {
    const removedUrl = e.detail.file.url;
    const uploadedImages = this.data.uploadedImages.filter(url => url !== removedUrl);
    this.setData({ uploadedImages });
  },

  // 提交
  async onSubmit() {
    const { form, isEdit, productId, uploadedImages, submitting } = this.data;
    if (submitting) return;
    if (!form.name.trim()) return wx.showToast({ title: '请输入商品名称', icon: 'none' });
    if (!form.priceGroup) return wx.showToast({ title: '请输入团购价', icon: 'none' });
    if (uploadedImages.length === 0) return wx.showToast({ title: '请上传商品图片', icon: 'none' });

    const params = {
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category,
      priceGroup: Number(form.priceGroup),
      priceOriginal: form.priceOriginal ? Number(form.priceOriginal) : null,
      stock: form.stock,
      minGroupSize: form.minGroupSize,
      specs: form.specs.filter(s => s.name.trim()),
      images: uploadedImages
    };

    this.setData({ submitting: true });
    try {
      if (isEdit) {
        params.productId = productId;
        await sellerUpdateProduct(params);
        wx.showToast({ title: '保存成功', icon: 'success' });
      } else {
        await sellerCreateProduct(params);
        wx.showToast({ title: '创建成功', icon: 'success' });
      }
      setTimeout(() => wx.navigateBack(), 1500);
    } catch (e) {
      wx.showToast({ title: e.message || '操作失败', icon: 'none' });
    } finally {
      this.setData({ submitting: false });
    }
  }
});
