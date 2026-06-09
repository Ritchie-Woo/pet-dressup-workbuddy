// worklets/snap-drag.js — 列表三段式拖动
// 用法：标题行 bind:touchstart="onTouchStart" bind:touchmove="onTouchMove" bind:touchend="onTouchEnd"

let _startY = 0;
let _startHeightVh = 0;
let _currentHeightVh = 0;
let _dragging = false;
let _container = null;

// 三段高度（vh）
const SNAP_HEIGHTS = [30, 50, 80];
// 段位切换阈值（vh 偏移量）
const SNAP_THRESHOLD = 8;  // 拖动超过 8vh 才切换段位

function pxToVh(px) {
  try {
    const sysInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    return (px / sysInfo.windowHeight) * 100;
  } catch (e) {
    return px / 8; // 兜底
  }
}

function getContainer(instance) {
  // 通过 selectComponent 拿 .map-place-list 容器
  return instance.selectComponent('.map-place-list');
}

function setHeight(container, vh) {
  if (!container) return;
  container.style.height = vh + 'vh';
  container.style.transition = 'height 250ms ease';
}

function clearTransition(container) {
  if (!container) return;
  container.style.transition = 'none';
}

function snapToClosest(vh) {
  // 找最近的段
  let closest = SNAP_HEIGHTS[0];
  let minDiff = Math.abs(vh - SNAP_HEIGHTS[0]);
  for (let i = 1; i < SNAP_HEIGHTS.length; i++) {
    const diff = Math.abs(vh - SNAP_HEIGHTS[i]);
    if (diff < minDiff) {
      minDiff = diff;
      closest = SNAP_HEIGHTS[i];
    }
  }
  return closest;
}

function onTouchStart(e, instance) {
  _startY = e.touches[0].clientY;
  _dragging = true;
  _container = getContainer(instance);
  if (_container) {
    // 读当前 height（去掉 vh 单位）
    const cur = _container.style.height || '30vh';
    _startHeightVh = parseFloat(cur) || 30;
    _currentHeightVh = _startHeightVh;
    clearTransition(_container);
  }
}

function onTouchMove(e, instance) {
  if (!_dragging) return;
  if (!_container) {
    _container = getContainer(instance);
    if (!_container) return;
    const cur = _container.style.height || '30vh';
    _startHeightVh = parseFloat(cur) || 30;
  }
  const deltaY = e.touches[0].clientY - _startY; // 向上滑为负
  const deltaVh = pxToVh(-deltaY);
  let newVh = _startHeightVh + deltaVh;
  // 边界限制 [30, 80]
  if (newVh < 30) newVh = 30;
  if (newVh > 80) newVh = 80;
  _currentHeightVh = newVh;
  _container.style.height = newVh + 'vh';
}

function onTouchEnd(e, instance) {
  if (!_dragging) return;
  _dragging = false;
  if (!_container) return;
  // 吸附到最近的段
  const target = snapToClosest(_currentHeightVh);
  setHeight(_container, target);
  _currentHeightVh = target;
  // 通过 setData 同步段位（如果需要）
  if (instance && instance.callMethod) {
    instance.callMethod('onSnapChange', target);
  }
}

module.exports = {
  onTouchStart,
  onTouchMove,
  onTouchEnd
};
