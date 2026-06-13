// common/pet/detail/index.js — 宠物详情编辑
const { request, getPetList } = require('../../../utils/request');

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
    petId: '',
    avatarUrl: '',
    avatarUploading: false,
    name: '',
    species: '',
    breedInput: '',
    gender: '',
    birthday: '',
    speciesList: [
      { value: 'dog', icon: '🐶', label: '狗狗' },
      { value: 'cat', icon: '🐱', label: '猫咪' }
    ],
    showBreedDrop: false,
    breedSuggestions: [],
    today: new Date().toISOString().split('T')[0],
    saving: false
  },

  onLoad(options) {
    const petId = options.petId || options.id;
    if (!petId) {
      wx.showToast({ title: '参数错误', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1000);
      return;
    }
    this.setData({ petId });
    this.loadPet(petId);
  },

  async loadPet(petId) {
    try {
      const res = await getPetList();
      const data = res.code === 1 ? res.data : {};
      const pets = data.pets || data || [];
      const pet = pets.find(p => p.petId === petId);
      if (!pet) throw new Error('找不到宠物');

      this.setData({
        avatarUrl: pet.avatarUrl || '',
        name: pet.name || '',
        species: pet.species || '',
        breedInput: pet.breed || '',
        gender: pet.gender || '',
        birthday: pet.birthday || ''
      });
    } catch (err) {
      wx.showToast({ title: '加载失败: ' + (err.message || ''), icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
    }
  },

  onAvatarTap() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: res => {
        const filePath = res.tempFilePaths[0];
        wx.cropImage({
          src: filePath,
          cropScale: '1:1',
          success: cropRes => this._uploadAvatar(cropRes.tempFilePath),
          fail: () => this._uploadAvatar(filePath)
        });
      }
    });
  },

  _uploadAvatar(filePath) {
    this.setData({ avatarUploading: true });
    wx.showLoading({ title: '上传中' });
    const cloudPath = 'avatars/' + Date.now() + '_' + Math.random().toString(36).slice(2) + '.png';
    wx.cloud.uploadFile({
      cloudPath,
      filePath,
      success: res => {
        this.setData({ avatarUrl: res.fileID });
        wx.showToast({ title: '头像已设置', icon: 'success' });
      },
      fail: err => {
        console.error('头像上传失败', err);
        wx.showToast({ title: '头像上传失败', icon: 'none' });
      },
      complete: () => {
        wx.hideLoading();
        this.setData({ avatarUploading: false });
      }
    });
  },

  onNameChange(e) { this.setData({ name: e.detail.value }); },

  selectSpecies(e) {
    this.setData({ species: e.currentTarget.dataset.val, breedInput: '', showBreedDrop: false });
  },

  // 品种只能从下拉选，输入仅做搜索
  onBreedInput(e) {
    const val = e.detail.value;
    this.setData({ breedInput: '', showBreedDrop: true });
    this.searchBreed(val);
  },

  onBreedFocus() {
    this.setData({ showBreedDrop: true, breedInput: '' });
    this.searchBreed('');
  },

  hideBreedDrop() {
    setTimeout(() => this.setData({ showBreedDrop: false }), 200);
  },

  searchBreed(q) {
    const list = BREEDS[this.data.species] || [];
    let suggestions = q ? list.filter(b => b.includes(q)) : list;
    // 始终在末尾加上"其他"
    suggestions = [...suggestions.slice(0, 15), '其他'];
    this.setData({ breedSuggestions: suggestions });
  },

  selectBreed(e) {
    const val = e.currentTarget.dataset.val;
    this.setData({ breedInput: val, showBreedDrop: false });
  },

  onGenderChange(e) {
    this.setData({ gender: e.currentTarget.dataset.val });
  },

  onBirthdayChange(e) {
    this.setData({ birthday: e.detail.value });
  },

  async handleSave() {
    if (!this.data.name || !this.data.species) {
      wx.showToast({ title: '请完善信息', icon: 'none' });
      return;
    }
    if (this.data.name.length > 8) {
      wx.showToast({ title: '宠物名不能超过8个字', icon: 'none' });
      return;
    }
    if (this.data.avatarUploading) {
      wx.showToast({ title: '头像上传中', icon: 'none' });
      return;
    }

    this.setData({ saving: true });
    try {
      await request('common-pet', {
        action: 'update',
        petId: this.data.petId,
        name: this.data.name,
        species: this.data.species,
        breed: this.data.breedInput,
        gender: this.data.gender,
        birthday: this.data.birthday,
        avatarUrl: this.data.avatarUrl
      });
      wx.showToast({ title: '保存成功', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 800);
    } catch (err) {
      wx.showToast({ title: '保存失败', icon: 'none' });
    } finally {
      this.setData({ saving: false });
    }
  }
});
