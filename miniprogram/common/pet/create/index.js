// common/pet/create/index.js — 创建宠物档案
const { createPet } = require('../../../utils/request');

const BREEDS = {
  dog: [
    '金毛寻回犬', '拉布拉多', '柯基', '哈士奇', '柴犬', '泰迪', '比熊', '萨摩耶',
    '边境牧羊犬', '德国牧羊犬', '法国斗牛犬', '英国斗牛犬', '博美', '雪纳瑞', '吉娃娃',
    '约克夏', '马尔济斯', '西高地白梗', '秋田犬', '阿拉斯加', '杜宾', '罗威纳',
    '大丹犬', '松狮', '巴哥', '京巴', '蝴蝶犬', '可卡', '比格', '灵缇',
    '中华田园犬', '巴吉度', '阿富汗猎犬', '圣伯纳', '大白熊', '藏獒', '卡斯罗',
    '牛头梗', '西施犬', '银狐', '贝灵顿梗', '苏俄猎狼犬'
  ],
  cat: [
    '英国短毛猫', '美国短毛猫', '布偶猫', '暹罗猫', '波斯猫', '橘猫', '三花猫',
    '玳瑁猫', '缅因猫', '异国短毛猫', '金吉拉', '苏格兰折耳猫', '斯芬克斯猫',
    '德文卷毛猫', '阿比西尼亚', '孟加拉豹猫', '挪威森林猫', '西伯利亚森林猫',
    '土耳其梵猫', '新加坡猫', '中华田园猫', '俄罗斯蓝猫', '东方短毛猫',
    '柯尼斯卷毛猫', '塞尔凯克卷毛猫', '缅甸猫', '埃及猫', '日本短尾猫',
    '喜马拉雅猫', '伯曼猫', '索马里猫', '马恩岛猫'
  ]
};

Page({
  data: {
    name: '',
    species: '',
    breed: '',
    breedInput: '',
    breedSuggestions: [],
    showBreedDrop: false,
    gender: 'male',
    birthday: '',
    today: '',
    avatarUrl: '',
    submitting: false,
    speciesList: [
      { value: 'dog', icon: '🐶', label: '狗狗' },
      { value: 'cat', icon: '🐱', label: '猫咪' }
    ]
  },

  onLoad() {
    const d = new Date();
    const pad = n => String(n).padStart(2, '0');
    this.setData({ today: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` });
  },

  onNameChange(e) { this.setData({ name: e.detail.value }); },

  /* ===== Avatar ===== */
  onAvatarTap() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: res => {
        wx.cropImage({
          src: res.tempFilePaths[0],
          cropScale: '1:1',
          success: cropRes => this._uploadAvatar(cropRes.tempFilePath),
          fail: err => {
            console.error('cropImage failed, uploading original:', err);
            this._uploadAvatar(res.tempFilePaths[0]);
          }
        });
      }
    });
  },

  _uploadAvatar(filePath) {
    wx.showLoading({ title: '上传中' });
    const cloudPath = 'avatars/' + Date.now() + '_' + Math.random().toString(36).slice(2) + '.png';
    wx.cloud.uploadFile({
      cloudPath,
      filePath,
      success: res => {
        wx.hideLoading();
        this.setData({ avatarUrl: res.fileID });
        wx.showToast({ title: '头像已设置', icon: 'success' });
      },
      fail: err => {
        wx.hideLoading();
        console.error('上传失败', err);
        wx.showToast({ title: '头像上传失败', icon: 'none' });
      }
    });
  },

  /* ===== Breed autocomplete ===== */
  onBreedInput(e) {
    const val = e.detail.value;
    const { species } = this.data;
    if (!species) {
      wx.showToast({ title: '请先选择物种', icon: 'none' });
      return;
    }
    const pool = BREEDS[species] || [];
    let matches = val ? pool.filter(b => b.includes(val)) : pool;
    matches = [...matches.slice(0, 15), '其他'];
    this.setData({
      breedInput: val,
      breedSuggestions: matches,
      showBreedDrop: true
    });
  },

  onBreedFocus() {
    const { species } = this.data;
    if (!species) {
      wx.showToast({ title: '请先选择物种', icon: 'none' });
      return;
    }
    const pool = BREEDS[species] || [];
    const matches = [...pool.slice(0, 15), '其他'];
    this.setData({
      breedInput: '',
      breedSuggestions: matches,
      showBreedDrop: true
    });
  },

  selectBreed(e) {
    const val = e.currentTarget.dataset.val;
    this.setData({ breed: val, breedInput: val, showBreedDrop: false, breedSuggestions: [] });
  },

  hideBreedDrop() {
    // delay so tap can register
    setTimeout(() => this.setData({ showBreedDrop: false }), 200);
  },

  onGenderChange(e) { this.setData({ gender: e.currentTarget.dataset.val }); },
  onBirthdayChange(e) { this.setData({ birthday: e.detail.value }); },

  selectSpecies(e) {
    const val = e.currentTarget.dataset.val;
    this.setData({
      species: val,
      breed: '',
      breedInput: '',
      breedSuggestions: [],
      showBreedDrop: false
    });
  },

  async handleSubmit() {
    const { name, species, breed, gender, birthday, avatarUrl } = this.data;
    if (!name || !species) {
      wx.showToast({ title: '请填写宠物名和物种', icon: 'none' });
      return;
    }
    if (name.length > 8) {
      wx.showToast({ title: '宠物名不能超过8个字', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });
    try {
      await createPet({ name, species, breed, gender, birthday, avatarUrl });
      wx.showToast({ title: '创建成功', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 1000);
    } catch (err) {
      console.error('创建失败', err);
      wx.showToast({ title: err.message || '创建失败', icon: 'none' });
    } finally {
      this.setData({ submitting: false });
    }
  },

  goBack() { wx.navigateBack(); }
});
