// common/login/index.js — 粒子+真实照片混合动效
const { login } = require('../../utils/request');
const storage = require('../../utils/storage');

Page({
  data: { loading: false },

  onReady() {
    this.loadPhotos();
  },

  onUnload() {
    if (this._animId) {
      this._canvasNode && this._canvasNode.cancelAnimationFrame(this._animId);
    }
  },

  async loadPhotos() {
    // 直接从 manifest.json 读取文件路径
    const images = [];
    try {
      const fs = wx.getFileSystemManager();
      const data = fs.readFileSync('images/particles/manifest.json', 'utf8');
      const manifest = JSON.parse(data);
      console.log('[Login] manifest 加载成功，共', manifest.length, '张');
      for (const path of manifest) images.push({ path });
    } catch (e) {
      console.log('[Login] manifest 读取失败，用内置列表', e.message);
      // 内置 JPEG 文件列表
      const builtin = [
        '/images/particles/微信图片_20260527223055_23_7.jpg',
        '/images/particles/微信图片_20260529120049_24_7.jpg',
        '/images/particles/微信图片_20260531153211_28_7.jpg',
        '/images/particles/微信图片_20260531153212_29_7.jpg',
        '/images/particles/微信图片_20260601182319_31_7.jpg',
        '/images/particles/微信图片_20260603231537_209_154.jpg',
        '/images/particles/微信图片_20260603231557_210_154.jpg',
        '/images/particles/微信图片_20260603231624_211_154.jpg',
        '/images/particles/微信图片_20260603231718_212_154.jpg'
      ];
      for (const path of builtin) images.push({ path });
    }
    console.log('[Login] 将使用', images.length, '张照片作为粒子');
    this.initParticles(images);
  },

  initParticles(avatarImages) {
    const query = wx.createSelectorQuery();
    query.select('#particleCanvas').fields({ node: true, size: true }).exec((res) => {
      if (!res[0] || !res[0].node) return;
      const canvas = res[0].node;
      const ctx = canvas.getContext('2d');
      const dpr = wx.getWindowInfo().pixelRatio;
      const w = res[0].width;
      const h = res[0].height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);

      this._canvasNode = canvas;
      this._cx = w / 2;
      this._cy = h / 2 - 40;

      const COLORS = ['#FF5A5F', '#FF8A8E', '#FFB8B3', '#FFE5E3', '#00A699', '#4DD4C6'];

      // 预加载照片（用 wx.getImageInfo 获取可靠路径）
      const photoPaths = avatarImages.map(av => av.path);
      console.log('[Login] 开始预加载', photoPaths.length, '张照片');
      const photoPromises = photoPaths.map(path => new Promise((resolve) => {
        const img = canvas.createImage();
        img.onload = () => { console.log('[Login] 加载成功:', path); resolve(img); };
        img.onerror = (e) => { console.log('[Login] 加载失败:', path, e); resolve(null); };
        img.src = path;
      }));
      Promise.all(photoPromises).then(loadedPhotos => {
        const validPhotos = loadedPhotos.filter(img => img !== null);
        console.log('[Login] 成功预加载', validPhotos.length, '/', photoPaths.length, '张照片');

        const particles = [];
        for (let i = 0; i < 300; i++) {
          const p = mkParticle(COLORS, validPhotos);
          // 粒子从中心，照片从全屏边缘随机位置
          p.x = p.isPhoto ? (Math.random() * w) : this._cx;
          p.y = p.isPhoto ? (Math.random() * h) : this._cy;
          // 照片朝向中心飘，速度方向重算
          if (p.isPhoto) {
            const dx = this._cx - p.x;
            const dy = this._cy - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy) + 1;
            const sp = 0.3 + Math.random() * 0.8;
            p.vx = (dx / dist) * sp;
            p.vy = (dy / dist) * sp;
          }
          particles.push(p);
        }

        const animate = () => {
          ctx.clearRect(0, 0, w, h);
          for (const p of particles) {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.005;

            if (p.life <= 0 || p.x < -80 || p.x > w + 80 || p.y < -80 || p.y > h + 80) {
              const np = mkParticle(COLORS, validPhotos);
              Object.assign(p, np);
              p.x = p.isPhoto ? (Math.random() * w) : this._cx;
              p.y = p.isPhoto ? (Math.random() * h) : this._cy;
              if (p.isPhoto) {
                const dx = this._cx - p.x;
                const dy = this._cy - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy) + 1;
                const sp = 0.3 + Math.random() * 0.8;
                p.vx = (dx / dist) * sp;
                p.vy = (dy / dist) * sp;
              }
            }

            if (p.isPhoto && p.photoIdx >= 0 && validPhotos[p.photoIdx] && validPhotos[p.photoIdx].complete) {
            // 圆形真实照片
            const r = 18;
            ctx.globalAlpha = Math.min(p.life * 1.2, 0.85);
            ctx.save();
            ctx.beginPath();
            ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(validPhotos[p.photoIdx], p.x - r, p.y - r, r * 2, r * 2);
            ctx.restore();
            ctx.beginPath();
            ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.stroke();
          } else {
            // 彩色粒子点
            ctx.globalAlpha = Math.min(p.life, 0.55);
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.globalAlpha = 1;
        this._animId = canvas.requestAnimationFrame(animate);
      };
          animate();
        }); // Promise.all.then
      }); // exec callback
  },

  async handleLogin() {
    if (this.data.loading) return;
    this.setData({ loading: true });
    try {
      let nickname = '', avatarUrl = '';
      try { const r = await wx.getUserProfile({ desc: '用于宠物穿搭展示' }); nickname = r.userInfo.nickName; avatarUrl = r.userInfo.avatarUrl; } catch (e) {}
      const res = await login(nickname, avatarUrl);
      if (res.code === 1 && res.data) {
        const u = res.data;
        storage.setSync('token', u.openid || Date.now().toString());
        storage.setSync('userInfo', { userId: u._id, nickname: u.nickname, avatarUrl: u.avatar_url });
        getApp().globalData.userInfo = { userId: u._id, nickname: u.nickname, avatarUrl: u.avatar_url };
        getApp().globalData.token = u.openid;
        wx.reLaunch({ url: '/wp/dressup/index' });
      } else throw new Error(res.msg || '登录失败');
    } catch (err) {
      wx.showToast({ title: err.message || '登录失败', icon: 'none' });
    } finally { this.setData({ loading: false }); }
  },

  onAgreementTap(e) {
    const t = e.currentTarget.dataset.type;
    wx.showModal({
      title: t === 'privacy' ? '隐私政策' : '用户协议',
      content: t === 'privacy' ? '我们重视您的隐私。本小程序仅收集必要信息用于宠物穿搭展示。' : '欢迎使用 PetMini！使用即表示同意服务条款。',
      showCancel: false, confirmText: '我知道了'
    });
  },

  goHome() {
    const t = 'guest_' + Date.now();
    storage.setSync('token', t);
    getApp().globalData.token = t;
    wx.reLaunch({ url: '/wp/dressup/index' });
  }
});

function mkParticle(colors, photos) {
  const a = Math.random() * Math.PI * 2;
  const isPhoto = photos.length > 0 && Math.random() < 0.05;
  // 粒子快，照片慢
  const s = isPhoto ? (0.4 + Math.random() * 1.0) : (1.2 + Math.random() * 3.0);
  // 粒子粗，照片固定大小
  const size = isPhoto ? 12 : (0.8 + Math.random() * 2.2);
  return {
    x: 0, y: 0,
    vx: Math.cos(a) * s,
    vy: Math.sin(a) * s,
    size,
    color: colors[Math.floor(Math.random() * colors.length)],
    life: 0.4 + Math.random() * 0.6,
    isPhoto,
    photoIdx: isPhoto ? Math.floor(Math.random() * photos.length) : -1
  };
}
