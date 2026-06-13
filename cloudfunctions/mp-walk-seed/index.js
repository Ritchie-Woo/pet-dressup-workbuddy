// 云函数: mp-walk-seed — 一次性造热力图 + 遛狗测试数据
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

// 4 个模拟用户（fake openid，绕过真实登录）
const FAKE_USERS = [
  { openid: 'test_walker_001', nickname: '二狗', avatar_url: '' },
  { openid: 'test_walker_002', nickname: '团子妈', avatar_url: '' },
  { openid: 'test_walker_003', nickname: '胖虎爹', avatar_url: '' },
  { openid: 'test_walker_004', nickname: '毛球', avatar_url: '' },
];

const GRID_PRECISION = 0.002;  // 与 mp-walk 一致

function snapToGrid(val) {
  return Math.round(val / GRID_PRECISION) * GRID_PRECISION;
}

function gridKey(lat, lng) {
  return `${snapToGrid(lat).toFixed(3)}_${snapToGrid(lng).toFixed(3)}`;
}

/**
 * 热力图历史数据（mp_walk_history）
 *
 * 南京建邺区 / 河西一带的热点区域，模拟不同热度等级。
 * 坐标系: GCJ-02
 * 网格精度: 0.002° (~200m)
 */
const HOTSPOTS = [
  // 奥体中心 — 最热区域，周末上午/傍晚遛狗高峰
  { lat: 32.002, lng: 118.726, sessions: 24, minutes: 720, peakHours: { 7: 8, 8: 5, 18: 6, 19: 5 } },
  { lat: 32.000, lng: 118.726, sessions: 18, minutes: 510, peakHours: { 7: 6, 8: 4, 19: 4, 20: 4 } },

  // 绿博园 — 宠物友好公园，热度次之
  { lat: 32.010, lng: 118.715, sessions: 20, minutes: 600, peakHours: { 6: 5, 7: 7, 17: 4, 18: 4 } },
  { lat: 32.010, lng: 118.713, sessions: 16, minutes: 440, peakHours: { 7: 5, 8: 4, 18: 4, 19: 3 } },
  { lat: 32.008, lng: 118.717, sessions: 11, minutes: 280, peakHours: { 7: 3, 8: 3, 19: 3, 20: 2 } },

  // 滨江公园 — 沿江步道，傍晚热门
  { lat: 31.995, lng: 118.720, sessions: 14, minutes: 380, peakHours: { 17: 4, 18: 5, 19: 3, 20: 2 } },
  { lat: 31.997, lng: 118.718, sessions: 9, minutes: 220, peakHours: { 18: 3, 19: 4, 20: 2 } },

  // 华采天地周边 — 商圈入口/广场
  { lat: 32.005, lng: 118.732, sessions: 10, minutes: 250, peakHours: { 12: 3, 13: 2, 19: 3, 20: 2 } },
  { lat: 32.004, lng: 118.730, sessions: 7, minutes: 160, peakHours: { 12: 2, 13: 2, 19: 2, 20: 1 } },
  { lat: 32.004, lng: 118.734, sessions: 6, minutes: 130, peakHours: { 18: 2, 19: 2, 20: 2 } },

  // 万达广场 — 一般热度
  { lat: 32.008, lng: 118.722, sessions: 8, minutes: 200, peakHours: { 18: 3, 19: 3, 20: 2 } },
  { lat: 32.009, lng: 118.724, sessions: 5, minutes: 110, peakHours: { 19: 2, 20: 2, 21: 1 } },

  // 南京眼步行桥 — 地标打卡点
  { lat: 31.998, lng: 118.718, sessions: 4, minutes: 80, peakHours: { 18: 1, 19: 2, 20: 1 } },

  // 河西中央公园
  { lat: 32.008, lng: 118.728, sessions: 3, minutes: 60, peakHours: { 7: 1, 8: 1, 19: 1 } },
  { lat: 32.010, lng: 118.728, sessions: 2, minutes: 40, peakHours: { 8: 1, 19: 1 } },
];

/**
 * 活跃遛狗者（mp_active_walk）
 *
 * 需要至少 3 个真实 user_id，从 common_user 取前 5 个。
 * 如果没有真实用户，回退到使用 mock openid 直接 insert。
 */
const WALKERS = [
  { petName: '小布丁', petAvatar: '', lat: 32.0012, lng: 118.7265, at: '奥体中心南门' },
  { petName: '胖虎', petAvatar: '', lat: 32.0104, lng: 118.7158, at: '绿博园北门' },
  { petName: 'Lucky', petAvatar: '', lat: 31.9965, lng: 118.7203, at: '滨江步道中段' },
  { petName: '毛球', petAvatar: '', lat: 32.0058, lng: 118.7302, at: '华采天地广场' },
];

const XUANWU_WALKERS = [
  { openid: 'test_walker_001', lat: 32.0589, lng: 118.7970, petAvatar: '/assets/icons/walk.png' },
  { openid: 'test_walker_002', lat: 32.0592, lng: 118.7958, petAvatar: '/assets/icons/walk.png' },
  { openid: 'test_walker_003', lat: 32.0718, lng: 118.8115, petAvatar: '/assets/icons/walk.png' },
];

exports.main = async (event, context) => {
  const { action = 'seed' } = event;

  // ====== 安全锁：需要 confirm=true 才执行写操作 ======
  if (action === 'seed' && event.confirm !== true) {
    return {
      code: 0,
      msg: '⚠️ 这是一次性造数据操作，将清空现有 mp_walk_history 和 mp_active_walk 数据。请传入 confirm: true 确认。',
      hotspotCount: HOTSPOTS.length,
      walkerCount: WALKERS.length,
      preview: {
        hotspots: HOTSPOTS.map(h => ({ ...h, gridKey: gridKey(h.lat, h.lng) })),
        walkers: WALKERS.map(w => ({ name: w.petName, lat: w.lat, lng: w.lng, at: w.at })),
      },
    };
  }

  if (action === 'seed') {
    // ----- Step 0: 确保有 4 个测试用户 -----
    console.log('[seed] 创建测试用户...');
    const userDocs = [];
    for (const fu of FAKE_USERS) {
      // 幂等：已有则不重复创建
      const exist = await db.collection('common_user').where({ openid: fu.openid }).get();
      if (exist.data.length > 0) {
        userDocs.push(exist.data[0]);
      } else {
        const res = await db.collection('common_user').add({
          data: {
            openid: fu.openid,
            nickname: fu.nickname,
            avatar_url: fu.avatar_url,
            is_active: 1,
            created_at: new Date(),
            updated_at: new Date()
          }
        });
        userDocs.push({ _id: res._id, openid: fu.openid, nickname: fu.nickname });
      }
    }

    if (userDocs.length < 4) {
      return { code: -1, msg: '用户创建失败，仅 ' + userDocs.length + ' 个' };
    }

    // ----- Step 1: 清空旧数据 -----
    console.log('[seed] 清空旧数据...');

    const historyRes = await db.collection('mp_walk_history').limit(1000).get();
    for (const doc of historyRes.data) {
      await db.collection('mp_walk_history').doc(doc._id).remove().catch(() => {});
    }

    const activeRes = await db.collection('mp_active_walk').limit(100).get();
    for (const doc of activeRes.data) {
      await db.collection('mp_active_walk').doc(doc._id).remove().catch(() => {});
    }

    // ----- Step 2: 写入热力图历史数据 -----
    console.log('[seed] 写入热力图历史数据...');
    const now = new Date();
    const historyResults = [];

    for (const h of HOTSPOTS) {
      const gKey = gridKey(h.lat, h.lng);
      const gridLat = snapToGrid(h.lat);
      const gridLng = snapToGrid(h.lng);

      const res = await db.collection('mp_walk_history').add({
        data: {
          grid_key: gKey,
          latitude: gridLat,
          longitude: gridLng,
          total_sessions: h.sessions,
          total_minutes: h.minutes,
          last_active: now,
          peak_hours: h.peakHours,
          updated_at: now,
        },
      });
      historyResults.push({ gridKey: gKey, sessions: h.sessions, _id: res._id });
    }

    // ----- Step 3: 写入活跃遛狗者 -----
    console.log('[seed] 写入活跃遛狗者...');
    const walkerResults = [];
    const sessionTTL = 2 * 60 * 60 * 1000; // 2 小时

    for (let i = 0; i < WALKERS.length; i++) {
      const w = WALKERS[i];
      const user = userDocs[i];
      const sessionStart = new Date(now.getTime() - Math.floor(Math.random() * 20 * 60000)); // 0-20 分钟前开始

      const res = await db.collection('mp_active_walk').add({
        data: {
          user_id: user._id,
          openid: user.openid || '',
          pet_id: user._id, // 用 user._id 模拟 petId
          pet_name: w.petName,
          pet_avatar_url: w.petAvatar || '',
          latitude: w.lat,
          longitude: w.lng,
          started_at: sessionStart,
          last_heartbeat: now,
          expires_at: new Date(now.getTime() + sessionTTL),
          status: 'active',
        },
      });
      walkerResults.push({
        petName: w.petName,
        lat: w.lat,
        lng: w.lng,
        at: w.at,
        _id: res._id,
      });
    }

    return {
      code: 1,
      msg: '✅ 造数据完成',
      summary: {
        hotspots: historyResults.length,
        walkers: walkerResults.length,
      },
      hotspots: historyResults,
      walkers: walkerResults,
      tip: '数据有效期：活跃遛狗者 2 小时后过期，历史热力图永久保留。',
    };
  }

  // ====== action=seedXuanwu: 只补玄武湖附近的临时活跃遛狗测试数据，不清空历史数据 ======
  if (action === 'seedXuanwu' && event.confirm === true) {
    const now = new Date();
    // 测试数据需要给手测留出窗口；远未来 heartbeat 只用于 source=test_xuanwu_walk_seed 的临时记录。
    const heartbeatAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const expiresAt = new Date(now.getTime() + 26 * 60 * 60 * 1000);

    const old = await db.collection('mp_active_walk')
      .where({ source: 'test_xuanwu_walk_seed' })
      .limit(100)
      .get();
    for (const doc of old.data) {
      await db.collection('mp_active_walk').doc(doc._id).remove().catch(() => {});
    }

    const inserted = [];
    for (const walker of XUANWU_WALKERS) {
      const userRes = await db.collection('common_user')
        .where({ openid: walker.openid })
        .limit(1)
        .get();
      if (userRes.data.length === 0) continue;

      const user = userRes.data[0];
      const res = await db.collection('mp_active_walk').add({
        data: {
          user_id: user._id,
          openid: user.openid,
          pet_id: `${user._id}_dog`,
          pet_avatar_url: walker.petAvatar || '/assets/icons/walk.png',
          latitude: walker.lat,
          longitude: walker.lng,
          started_at: now,
          last_heartbeat: heartbeatAt,
          expires_at: expiresAt,
          status: 'active',
          source: 'test_xuanwu_walk_seed'
        }
      });
      inserted.push({ _id: res._id, latitude: walker.lat, longitude: walker.lng });
    }

    return {
      code: 1,
      msg: '已写入玄武湖附近遛狗测试数据',
      data: { inserted }
    };
  }

  // ====== action=clear: 仅清空 ======
  if (action === 'clear' && event.confirm === true) {
    const hRes = await db.collection('mp_walk_history').limit(1000).get();
    for (const doc of hRes.data) {
      await db.collection('mp_walk_history').doc(doc._id).remove().catch(() => {});
    }
    const aRes = await db.collection('mp_active_walk').limit(100).get();
    for (const doc of aRes.data) {
      await db.collection('mp_active_walk').doc(doc._id).remove().catch(() => {});
    }
    return { code: 1, msg: '已清空 mp_walk_history 和 mp_active_walk' };
  }

  return { code: 0, msg: '不支持的 action，可用: seed (confirm:true) | clear (confirm:true)' };
};
