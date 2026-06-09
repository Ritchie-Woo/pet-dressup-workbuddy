// 云函数: mp-place-stats — POI 聚合统计缓存刷新
// PRD: §5.3 · 踩点/投票写入后异步调用，刷新 mp_place_stats

const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

// 时段划分
const HOUR_SLOTS = [6, 9, 12, 14, 17, 20];

function getHourSlot(hour) {
  if (hour >= 6 && hour < 9) return 6;
  if (hour >= 9 && hour < 12) return 9;
  if (hour >= 12 && hour < 14) return 12;
  if (hour >= 14 && hour < 17) return 14;
  if (hour >= 17 && hour < 20) return 17;
  if (hour >= 20 && hour < 23) return 20;
  return null; // 不在统计时段内
}

// weekday: JS getDay() 0=Sun → PRD 1=Mon 7=Sun
function getWeekday(date) {
  const d = date.getDay();
  return d === 0 ? 7 : d;
}

exports.main = async (event, context) => {
  const { action = 'refresh', placeId } = event;
  if (!placeId) return { code: -1, msg: '缺少 placeId' };

  if (action === 'refresh') {
    return refresh(placeId);
  }

  return { code: 0, msg: '不支持' };
};

async function refresh(placeId) {
  const now = Date.now();

  try {
    // ── 1. 聚合 mp_checkin ──
    const { total, last } = await aggregateCheckins(placeId);

    // ── 2. 品种分布 ──
    const breeds = await aggregateBreeds(placeId);

    // ── 3. 时段热度 ──
    const heatmap = await aggregateHeatmap(placeId);

    // ── 4. 标签投票统计 ──
    const tags = await aggregateTags(placeId);

    // ── 5. 写入缓存 ──
    await db.collection('mp_place_stats').doc(placeId).set({
      data: {
        _id: placeId,
        total_checkins: total,
        last_checkin_time: last,
        breed_distribution: breeds,
        hourly_heatmap: heatmap,
        tag_stats: tags,
        updated_at: now
      }
    });

    return { code: 1, data: { placeId, total, updated_at: now } };
  } catch (err) {
    console.error('[mp-place-stats] Error:', err);
    return { code: -1, msg: err.message };
  }
}

// 聚合踩点总数和最近时间
async function aggregateCheckins(placeId) {
  try {
    const countRes = await db.collection('mp_checkin')
      .where({ place_id: placeId }).count();
    const total = countRes.total;

    let last = null;
    if (total > 0) {
      const lastRes = await db.collection('mp_checkin')
        .where({ place_id: placeId })
        .orderBy('created_at', 'desc')
        .limit(1).get();
      if (lastRes.data.length > 0) {
        last = lastRes.data[0].created_at;
      }
    }
    return { total, last };
  } catch (e) {
    return { total: 0, last: null };
  }
}

// 聚合品种分布
async function aggregateBreeds(placeId) {
  try {
    const checkins = await db.collection('mp_checkin')
      .where({ place_id: placeId }).get();

    if (checkins.data.length === 0) return {};

    const petIds = [...new Set(checkins.data.map(c => c.pet_id).filter(Boolean))];
    const petMap = {};

    if (petIds.length > 0) {
      const pets = await db.collection('common_pet')
        .where({ _id: _.in(petIds) }).get();
      pets.data.forEach(p => {
        petMap[p._id] = p.breed || '';
      });
    }

    // 按 pet_id 去重后的 breed 分布（每个 pet_id 只计一次）
    const seenPets = new Set();
    const breedCount = {};
    let unknown = 0;

    for (const c of checkins.data) {
      const petId = c.pet_id;
      if (!petId) { unknown++; continue; }
      if (seenPets.has(petId)) continue;
      seenPets.add(petId);

      const breed = petMap[petId] || '';
      if (!breed) { unknown++; continue; }
      breedCount[breed] = (breedCount[breed] || 0) + 1;
    }

    // 取 Top 5，unknown 占比用于前端判断
    const totalBreedEntries = seenPets.size + unknown;
    const unknownRatio = totalBreedEntries > 0 ? unknown / totalBreedEntries : 0;

    const sorted = Object.entries(breedCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      top: Object.fromEntries(sorted),
      unknown_ratio: Math.round(unknownRatio * 100) / 100
    };
  } catch (e) {
    return {};
  }
}

// 聚合时段热度（6×7 热力矩阵）
async function aggregateHeatmap(placeId) {
  try {
    const checkins = await db.collection('mp_checkin')
      .where({ place_id: placeId }).get();

    const heatmap = {};
    for (let d = 1; d <= 7; d++) {
      for (const h of HOUR_SLOTS) {
        heatmap[`${d}-${h}`] = 0;
      }
    }

    for (const c of checkins.data) {
      if (!c.created_at) continue;
      const date = new Date(c.created_at);
      const weekday = getWeekday(date);
      const slot = getHourSlot(date.getHours());
      if (slot === null) continue;
      heatmap[`${weekday}-${slot}`] = (heatmap[`${weekday}-${slot}`] || 0) + 1;
    }

    return heatmap;
  } catch (e) {
    return {};
  }
}

// 聚合标签投票统计
async function aggregateTags(placeId) {
  try {
    const votes = await db.collection('mp_place_tag_vote')
      .where({ place_id: placeId }).get();

    const tagStats = {};
    for (const v of votes.data) {
      if (!tagStats[v.tag_id]) {
        tagStats[v.tag_id] = { confirm: 0, deny: 0 };
      }
      if (v.vote === 1) tagStats[v.tag_id].confirm++;
      else if (v.vote === -1) tagStats[v.tag_id].deny++;
    }
    return tagStats;
  } catch (e) {
    return {};
  }
}
