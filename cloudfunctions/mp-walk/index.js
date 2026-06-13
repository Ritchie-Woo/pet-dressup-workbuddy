// 云函数: mp-walk — 遛狗会话管理 + 热力图数据
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

const STALE_THRESHOLD = 15 * 60 * 1000; // 15 分钟无心跳视为过期
const SESSION_TTL = 2 * 60 * 60 * 1000;  // 会话最长 2 小时
const GRID_PRECISION = 0.002;             // 网格精度 ~200m
const MAX_QUERY_LIMIT = 200;
const DEFAULT_RADIUS = 1000;
const MAX_RADIUS = 3000;

function snapToGrid(val) {
  return Math.round(val / GRID_PRECISION) * GRID_PRECISION;
}

function gridKey(lat, lng) {
  return `${snapToGrid(lat).toFixed(3)}_${snapToGrid(lng).toFixed(3)}`;
}

function toRadians(deg) {
  return deg * Math.PI / 180;
}

function distanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function buildBounds(latitude, longitude, radius) {
  const latDelta = radius / 111320;
  const lngDelta = radius / (111320 * Math.max(Math.cos(toRadians(latitude)), 0.01));
  return {
    latMin: latitude - latDelta,
    latMax: latitude + latDelta,
    lngMin: longitude - lngDelta,
    lngMax: longitude + lngDelta
  };
}

function buildWalkGroups(walkers) {
  const grouped = {};
  walkers.forEach(w => {
    const lat = snapToGrid(w.latitude);
    const lng = snapToGrid(w.longitude);
    const key = gridKey(w.latitude, w.longitude);
    if (!grouped[key]) {
      grouped[key] = {
        groupId: `walk_${lat.toFixed(3)}_${lng.toFixed(3)}`,
        count: 0,
        latitude: Number(lat.toFixed(3)),
        longitude: Number(lng.toFixed(3)),
        avatars: [],
        pets: []
      };
    }
    const group = grouped[key];
    group.count += 1;
    if (w.pet_avatar_url && group.avatars.length < 8) {
      group.avatars.push(w.pet_avatar_url);
    }
    if (group.pets.length < 8) {
      group.pets.push({ avatarUrl: w.pet_avatar_url || '' });
    }
  });
  return Object.values(grouped).sort((a, b) => b.count - a.count);
}

exports.main = async (event, context) => {
  const { action } = event;
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  // 内部 action：递归调用自己执行时 openid 为 undefined，跳过用户校验
  if (action === '_cleanup') {
    return _cleanupExpiredSessions();
  }

  if (!openid) return { code: -1, msg: 'openid 缺失' };

  const users = db.collection('common_user');
  const u = await users.where({ openid }).get();
  if (u.data.length === 0) return { code: -1, msg: '用户未注册' };
  const userId = u.data[0]._id;

  try {
    switch (action) {
      case 'start': {
        const { petId } = event;
        if (!petId) return { code: -1, msg: '缺少 petId' };

        // 先清理该用户所有旧会话（避免残留数据堆积）
        try {
          await db.collection('mp_active_walk')
            .where({ user_id: userId })
            .remove();
        } catch (e) { /* 集合为空或权限不足，忽略 */ }

        // 幂等：已有活跃会话则直接返回（清理后如果有重新查询）
        const existing = await db.collection('mp_active_walk')
          .where({ user_id: userId, status: 'active' })
          .get();
        if (existing.data.length > 0) {
          return { code: 1, data: { session: existing.data[0] } };
        }

        // 获取宠物信息：仅允许当前用户的狗狗开启遛狗
        let petAvatarUrl = '';
        try {
          const petRes = await db.collection('common_pet').doc(petId).get();
          if (!petRes.data || petRes.data.user_id !== userId || petRes.data.is_active === 0) {
            return { code: -1, msg: '宠物不存在或无权操作' };
          }
          if (petRes.data.species !== 'dog') {
            return { code: -1, msg: '请选择狗狗开始遛狗' };
          }
          petAvatarUrl = petRes.data.avatar_url || '';
        } catch (e) {
          return { code: -1, msg: '宠物不存在或无权操作' };
        }

        // 尝试获取宠物头像
        try {
          const avatarRes = await cloud.callFunction({
            name: 'wp-avatar',
            data: { action: 'getByPet', petId }
          });
          if (avatarRes.result && avatarRes.result.code === 1) {
            petAvatarUrl = avatarRes.result.data.baseAppearance?.resource || petAvatarUrl;
          }
        } catch (e) { /* 穿搭不可用 */ }

        const now = new Date();
        const doc = {
          user_id: userId,
          openid,
          pet_id: petId,
          pet_avatar_url: petAvatarUrl,
          latitude: 0,
          longitude: 0,
          started_at: now,
          last_heartbeat: now,
          expires_at: new Date(now.getTime() + SESSION_TTL),
          status: 'active'
        };

        const addRes = await db.collection('mp_active_walk').add({ data: doc });
        doc._id = addRes._id;
        return { code: 1, data: { session: doc } };
      }

      case 'heartbeat': {
        const { sessionId, latitude, longitude } = event;
        if (!sessionId) return { code: -1, msg: '缺少 sessionId' };
        if (typeof latitude !== 'number' || typeof longitude !== 'number') {
          return { code: -1, msg: '缺少经纬度' };
        }

        const session = await db.collection('mp_active_walk').doc(sessionId).get();
        if (!session.data || session.data.user_id !== userId) {
          return { code: -1, msg: '会话不存在或无权操作' };
        }

        const now = Date.now();
        const lastHB = session.data.last_heartbeat
          ? new Date(session.data.last_heartbeat).getTime() : 0;

        // 超过 15 分钟未心跳，视为过期不再更新
        if (now - lastHB > STALE_THRESHOLD) {
          return { code: -1, msg: '会话已过期，请重新开始' };
        }

        await db.collection('mp_active_walk').doc(sessionId).update({
          data: {
            latitude,
            longitude,
            last_heartbeat: new Date(now)
          }
        });

        return { code: 1, data: { updated: true } };
      }

      case 'stop': {
        const { sessionId } = event;
        if (!sessionId) return { code: -1, msg: '缺少 sessionId' };

        const session = await db.collection('mp_active_walk').doc(sessionId).get();
        if (!session.data || session.data.user_id !== userId) {
          return { code: -1, msg: '会话不存在或无权操作' };
        }

        const data = session.data;
        const now = new Date();
        const startedAt = data.started_at ? new Date(data.started_at) : now;
        const durationMinutes = Math.max(1, Math.round((now.getTime() - startedAt.getTime()) / 60000));

        // 只在有有效坐标时写入历史
        if (data.latitude && data.longitude) {
          const gKey = gridKey(data.latitude, data.longitude);
          const gridLat = snapToGrid(data.latitude);
          const gridLng = snapToGrid(data.longitude);
          const hourKey = String(startedAt.getHours());

          try {
            // 尝试累加已有记录
            const existing = await db.collection('mp_walk_history')
              .where({ grid_key: gKey })
              .get();

            if (existing.data.length > 0) {
              const hist = existing.data[0];
              const peakHours = hist.peak_hours || {};
              peakHours[hourKey] = (peakHours[hourKey] || 0) + 1;

              await db.collection('mp_walk_history').doc(hist._id).update({
                data: {
                  total_sessions: _.inc(1),
                  total_minutes: _.inc(durationMinutes),
                  last_active: now,
                  peak_hours: peakHours,
                  updated_at: now
                }
              });
            } else {
              await db.collection('mp_walk_history').add({
                data: {
                  grid_key: gKey,
                  latitude: gridLat,
                  longitude: gridLng,
                  total_sessions: 1,
                  total_minutes: durationMinutes,
                  last_active: now,
                  peak_hours: { [hourKey]: 1 },
                  updated_at: now
                }
              });
            }
          } catch (e) {
            console.error('[mp-walk] history write failed:', e.message);
          }
        }

        // 删除活跃会话
        await db.collection('mp_active_walk').doc(sessionId).remove();

        return { code: 1, data: { duration_minutes: durationMinutes } };
      }

      case 'query': {
        const centerLat = Number(event.latitude ?? event.lat);
        const centerLng = Number(event.longitude ?? event.lng);
        const hasCenter = Number.isFinite(centerLat) && Number.isFinite(centerLng);
        const radius = Math.min(Math.max(Number(event.radius) || DEFAULT_RADIUS, 1), MAX_RADIUS);
        const bounds = hasCenter
          ? buildBounds(centerLat, centerLng, radius)
          : {
              latMin: event.latMin,
              latMax: event.latMax,
              lngMin: event.lngMin,
              lngMax: event.lngMax
            };

        const { latMin, latMax, lngMin, lngMax } = bounds;
        if (latMin == null || latMax == null || lngMin == null || lngMax == null) {
          return { code: -1, msg: '缺少查询范围参数' };
        }

        const now = new Date();
        const staleCutoff = new Date(Date.now() - STALE_THRESHOLD);

        // 同步清理过期会话（不递归调云函数，避免 openid 缺失报错）
        _cleanupExpiredSessions().catch(() => {});

        // 并行：查活跃狗友 + 查历史热点
        const [walkersRes, hotspotsRes] = await Promise.all([
          // 活跃狗友：范围内 + 最近 15 分钟有心跳 + 未过期
          db.collection('mp_active_walk')
            .where({
              status: 'active',
              expires_at: _.gt(now),
              last_heartbeat: _.gt(staleCutoff),
              latitude: _.gte(latMin).and(_.lte(latMax)),
              longitude: _.gte(lngMin).and(_.lte(lngMax))
            })
            .limit(50)
            .get(),
          // 历史热点：视口范围内，按热度降序
          db.collection('mp_walk_history')
            .where({
              latitude: _.gte(latMin).and(_.lte(latMax)),
              longitude: _.gte(lngMin).and(_.lte(lngMax))
            })
            .orderBy('total_sessions', 'desc')
            .limit(MAX_QUERY_LIMIT)
            .get()
        ]);

        const otherWalkers = walkersRes.data.filter(w => w.user_id !== userId);
        const nearbyWalkers = hasCenter
          ? otherWalkers.filter(w => distanceMeters(centerLat, centerLng, w.latitude, w.longitude) <= radius)
          : otherWalkers;
        const groups = buildWalkGroups(nearbyWalkers);

        const hotspots = hotspotsRes.data.map(h => ({
          _id: h._id,
          latitude: h.latitude,
          longitude: h.longitude,
          total_sessions: h.total_sessions,
          total_minutes: h.total_minutes,
          last_active: h.last_active
        }));

        return { code: 1, data: { groups, hotspots } };
      }

      // 内部清理：删除所有过期会话（直接同步执行，不递归调云函数）
      case '_cleanup': {
        return _cleanupExpiredSessions();
      }

      default:
        return { code: 0, data: { message: 'mp-walk — action 不支持' } };
    }
  } catch (err) {
    console.error('[mp-walk] Error:', err);
    return { code: -1, msg: err.message };
  }
};

// 抽离清理逻辑：供 query 内部调用，也保留 case 入口兜底
async function _cleanupExpiredSessions() {
  const now = new Date();
  const staleCutoff = new Date(now.getTime() - STALE_THRESHOLD);
  try {
    const [expired, stale] = await Promise.all([
      db.collection('mp_active_walk')
        .where({ expires_at: _.lt(now) })
        .limit(100)
        .get(),
      db.collection('mp_active_walk')
        .where({ last_heartbeat: _.lt(staleCutoff) })
        .limit(100)
        .get()
    ]);
    const ids = Array.from(new Set(
      expired.data.concat(stale.data).map(d => d._id).filter(Boolean)
    ));
    if (ids.length > 0) {
      await Promise.all(
        ids.map(id => db.collection('mp_active_walk').doc(id).remove().catch(() => {}))
      );
    }
  } catch (e) { /* 忽略清理失败 */ }
  return { code: 1, data: { cleaned: true } };
}
