/**
 * pet-widget — 桌面宠物组件
 *
 * 功能:
 *   1. 手指滑动 → 眼珠跟随移动
 *   2. 单点 → 随机切换 5 种动作 (idle/happy/surprised/sleeping/angry)
 *
 * 属性:
 *   size           - 组件尺寸 (px), 默认 220
 *   autoResetDelay - 动作自动回到 idle 的延迟 (ms), 默认 3000
 *
 * 事件:
 *   bind:actionchange - 动作变化时触发, detail = { action }
 */

const ACTIONS = ['idle', 'happy', 'surprised', 'sleeping', 'angry'];

// 眼珠最大偏移量 (px)
const MAX_PUPIL_OFFSET = 5;
// 跟踪范围 (px)，超过此距离眼珠偏移达到最大值
const TRACK_RANGE = 120;

Component({
  properties: {
    size: {
      type: Number,
      value: 220,
    },
    autoResetDelay: {
      type: Number,
      value: 3000,
    },
  },

  data: {
    currentAction: 'idle',
    // 左右眼珠偏移
    eyeLX: 0,
    eyeLY: 0,
    eyeRX: 0,
    eyeRY: 0,
  },

  lifetimes: {
    attached() {
      this._actionTimer = null;
      this._petRect = null;
      this._lastUpdateTime = 0;
    },
    detached() {
      if (this._actionTimer) {
        clearTimeout(this._actionTimer);
        this._actionTimer = null;
      }
    },
  },

  methods: {
    /* ========== 眼珠跟踪 ========== */

    onTouchStart() {
      // 懒加载: 首次触摸时获取宠物区域
      if (!this._petRect) {
        this._queryPetRect();
      }
    },

    onTouchMove(e) {
      // 节流 ~60fps
      const now = Date.now();
      if (now - this._lastUpdateTime < 16) return;
      this._lastUpdateTime = now;

      const touch = e.touches[0];
      if (!touch) return;

      if (!this._petRect) {
        this._queryPetRect();
        return;
      }

      const rect = this._petRect;
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      const dx = touch.pageX - cx;
      const dy = touch.pageY - cy;

      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 1) {
        // 手指在正中，归位
        this.setData({ eyeLX: 0, eyeLY: 0, eyeRX: 0, eyeRY: 0 });
        return;
      }

      const scale = Math.min(dist / TRACK_RANGE, 1);
      const ox = (dx / dist) * scale * MAX_PUPIL_OFFSET;
      const oy = (dy / dist) * scale * MAX_PUPIL_OFFSET;

      this.setData({
        eyeLX: ox,
        eyeLY: oy,
        eyeRX: ox,
        eyeRY: oy,
      });
    },

    onTouchEnd() {
      // 手指离开 → 眼珠缓慢归位 (CSS transition 处理)
      this.setData({ eyeLX: 0, eyeLY: 0, eyeRX: 0, eyeRY: 0 });
    },

    _queryPetRect() {
      const query = this.createSelectorQuery();
      query.select('.pet-wrap').boundingClientRect();
      query.exec((res) => {
        if (res && res[0]) {
          this._petRect = res[0];
        }
      });
    },

    /* ========== 点击动作 ========== */

    onPetTap() {
      // 随机选取不同于当前的动作
      const pool = ACTIONS.filter((a) => a !== this.data.currentAction);
      const action = pool[Math.floor(Math.random() * pool.length)];

      this.setData({ currentAction: action });
      this.triggerEvent('actionchange', { action });

      // 自动回到 idle
      if (this._actionTimer) clearTimeout(this._actionTimer);
      this._actionTimer = setTimeout(() => {
        this.setData({ currentAction: 'idle' });
        this.triggerEvent('actionchange', { action: 'idle' });
      }, this.properties.autoResetDelay);
    },

    /* ========== 外部可调用方法 ========== */

    /** 手动设置动作 */
    setAction(action) {
      if (!ACTIONS.includes(action)) return;
      if (this._actionTimer) clearTimeout(this._actionTimer);
      this.setData({ currentAction: action });
      this.triggerEvent('actionchange', { action });
    },

    /** 回到 idle */
    resetToIdle() {
      if (this._actionTimer) clearTimeout(this._actionTimer);
      this.setData({ currentAction: 'idle' });
    },
  },
});
