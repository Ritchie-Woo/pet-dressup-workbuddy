// common/login/index.js — 粒子动效（真实用户宠物头像 + 纯色粒子混合）
const { login } = require('../../utils/request');
const storage = require('../../utils/storage');

Page({
  data: { loading: false },

  onReady() {
    this.loadParticlePhotos();
  },

  onUnload() {
    if (this._animId) {
      this._canvasNode && this._canvasNode.cancelAnimationFrame(this._animId);
    }
  },

  async loadParticlePhotos() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'login-resources',
        data: { count: 12 }
      });
      const data = (res.result && res.result.data) || {};
      const urls = data.urls || [];
      const fileIDs = data.fileIDs || [];

      // 将 cloud fileID → temp URL 映射写入缓存（后续页面复用）
      if (fileIDs.length > 0 && urls.length === fileIDs.length) {
        const cache = require('../../utils/imageCache');
        // 通过 getTempUrls 触发缓存写入
        // 由于已有 urls，直接通过内部机制缓存
        fileIDs.forEach((_fid, i) => {
          // 存储到 Storage 以便下次复用
          try {
            const raw = wx.getStorageSync('_img_cache');
            const map = raw ? JSON.parse(raw) : {};
            map[fileIDs[i]] = { url: urls[i], ts: Date.now() };
            wx.setStorageSync('_img_cache', JSON.stringify(map));
          } catch (e) {}
        });
      }

      console.log('[Login] 获取到', urls.length, '张真实宠物头像');
      this.initParticles(urls);
    } catch (err) {
      console.warn('[Login] 获取宠物头像失败，使用纯色粒子', err);
      this.initParticles([]);
    }
  },

  initParticles(photoUrls) {
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
      const cx = w / 2;
      const cy = h / 2 - 40;
      const COLORS = ['#FF5A5F', '#FF8A8E', '#FFB8B3', '#FFE5E3', '#00A699', '#4DD4C6'];

      // 预加载真实宠物照片
      const photoPromises = photoUrls.map(url => new Promise((resolve) => {
        const img = canvas.createImage();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = url;
      }));

      Promise.all(photoPromises).then(loadedPhotos => {
        const validPhotos = loadedPhotos.filter(img => img !== null);
        console.log('[Login] 照片预加载:', validPhotos.length, '/', photoUrls.length);

        // 减少总粒子数，降低照片比例（5%），避免过于密集
        const TOTAL_PARTICLES = 150;
        const PHOTO_RATIO = 0.05;
        const particles = [];
        for (let i = 0; i < TOTAL_PARTICLES; i++) {
          const isPhoto = validPhotos.length > 0 && i < Math.max(3, Math.floor(TOTAL_PARTICLES * PHOTO_RATIO));
          particles.push(this._makeParticle(cx, cy, w, h, COLORS, validPhotos, isPhoto));
        }

        const animate = () => {
          ctx.clearRect(0, 0, w, h);
          for (const p of particles) {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.005;

            if (p.life <= 0 || p.x < -80 || p.x > w + 80 || p.y < -80 || p.y > h + 80) {
              Object.assign(p, this._makeParticle(cx, cy, w, h, COLORS, validPhotos));
            }

            if (p.isPhoto && p.photo && p.photo.complete) {
              const r = 10;
              ctx.globalAlpha = Math.min(p.life * 1.2, 0.85);
              ctx.save();
              ctx.beginPath();
              ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
              ctx.closePath();
              ctx.clip();
              ctx.drawImage(p.photo, p.x - r, p.y - r, r * 2, r * 2);
              ctx.restore();
              ctx.beginPath();
              ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
              ctx.strokeStyle = '#fff';
              ctx.lineWidth = 1;
              ctx.stroke();
            } else {
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
      });
    });
  },

  _makeParticle(cx, cy, w, h, colors, photos, isPhoto) {
    const a = Math.random() * Math.PI * 2;
    // 照片粒子：照片半径缩小到 10px，从画面边缘随机位置出发向中心移动
    if (isPhoto === undefined) {
      isPhoto = photos.length > 0 && Math.random() < 0.05;
    }

    if (isPhoto) {
      const photo = photos[Math.floor(Math.random() * photos.length)];
      // 从边缘随机位置出现
      const edge = Math.floor(Math.random() * 4);
      let x, y;
      const margin = 60;
      switch (edge) {
        case 0: x = Math.random() * w; y = -margin; break;       // top
        case 1: x = w + margin; y = Math.random() * h; break;     // right
        case 2: x = Math.random() * w; y = h + margin; break;     // bottom
        case 3: x = -margin; y = Math.random() * h; break;        // left
      }
      const dx = cx - x;
      const dy = cy - y;
      const dist = Math.sqrt(dx * dx + dy * dy) + 1;
      const sp = 0.15 + Math.random() * 0.3;
      return {
        x, y,
        vx: (dx / dist) * sp,
        vy: (dy / dist) * sp,
        size: 0,
        color: '',
        life: 0.4 + Math.random() * 0.6,
        isPhoto: true,
        photo
      };
    }

    const speed = 0.6 + Math.random() * 1.4;
    const size = 0.5 + Math.random() * 1.4;
    return {
      x: cx, y: cy,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed,
      size,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 0.4 + Math.random() * 0.6,
      isPhoto: false,
      photo: null
    };
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
