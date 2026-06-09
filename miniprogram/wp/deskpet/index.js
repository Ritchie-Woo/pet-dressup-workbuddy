/**
 * wp/deskpet/index — 桌面宠物演示页
 *
 * 展示 pet-widget 组件的三个核心能力:
 *   1. 手指滑动 → 眼珠跟随
 *   2. 单点 → 随机动作 (5种)
 *   3. 动作 3s 后自动回到 idle
 */
Page({
  data: {
    currentAction: 'idle',
    actionLabel: '待机中',
  },

  ACTION_LABELS: {
    idle: '待机中 🐱',
    happy: '开心 😸',
    surprised: '惊讶 😲',
    sleeping: '睡觉 💤',
    angry: '生气 😾',
  },

  onActionChange(e) {
    const { action } = e.detail;
    this.setData({
      currentAction: action,
      actionLabel: this.ACTION_LABELS[action] || action,
    });
  },
});
