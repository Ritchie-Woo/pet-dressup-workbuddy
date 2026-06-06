// pet-wb 小程序入口
App({
  globalData: {
    userInfo: null,
    token: null,
    featureFlags: {},
    flagsLoaded: false,
    systemInfo: null
  },

  onLaunch() {
    // 初始化云开发
    if (wx.cloud) {
      wx.cloud.init({
        env: 'cloud1-d7gqpsxqg5fb00c1b',
        traceUser: true
      });
    }
    this.getSystemInfo();
    // 启动时拉取 Feature Flag 配置
    this.loadFeatureFlags();
    // 检查登录态
    this.checkLoginStatus();
  },

  onShow(options) {
    // 处理分享进入、模板消息跳转等场景
    this.handleLaunchOptions(options);
  },

  // 获取系统信息
  getSystemInfo() {
    try {
      const windowInfo = wx.getWindowInfo();
      const deviceInfo = wx.getDeviceInfo();
      this.globalData.systemInfo = { ...windowInfo, ...deviceInfo };
      this.globalData.statusBarHeight = windowInfo.statusBarHeight;
      this.globalData.navBarHeight = deviceInfo.platform === 'android' ? 48 : 44;
    } catch (err) {
      console.error('[App] 获取系统信息失败', err);
    }
  },

  // 加载 Feature Flag
  loadFeatureFlags() {
    // 先用默认值，避免白等
    const featureFlag = require('./utils/featureFlag');
    this.globalData.featureFlags = featureFlag.DEFAULTS;
    this.globalData.flagsLoaded = true;

    featureFlag.loadFlags()
      .then((flags) => {
        this.globalData.featureFlags = flags;
        console.log('[App] Feature flags 加载完成', flags);
      })
      .catch((err) => {
        // 静默降级，已用默认值
        if (err.message !== '_FF_TIMEOUT_SILENT') {
          console.warn('[App] Feature flags 云加载失败，使用默认值');
        }
      });
  },

  // 检查登录状态
  checkLoginStatus() {
    const storage = require('./utils/storage');
    const token = storage.getSync('token');
    if (token) {
      this.globalData.token = token;
      const userInfo = storage.getSync('userInfo');
      if (userInfo) {
        this.globalData.userInfo = userInfo;
      }
    }
  },

  // 处理启动参数
  handleLaunchOptions(options) {
    if (options.query && options.query.scene) {
      console.log('[App] 通过场景值进入:', options.query.scene);
    }
  },

  // 获取 feature flag 值
  isFeatureEnabled(key, defaultValue) {
    const flags = this.globalData.featureFlags;
    if (flags && typeof flags[key] !== 'undefined') {
      return !!flags[key];
    }
    return defaultValue !== undefined ? defaultValue : false;
  }
});
