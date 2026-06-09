// 云函数: mp-place — 宠物友好地点管理（列表/搜索/详情/投稿/收藏）
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

// 计算两点间距离（米）
function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

exports.main = async (event, context) => {
  const { action } = event;
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  try {
    switch (action) {
      case 'list': {
        // 矩形范围查询：lat/lng 为可视区域中心，bounds 为可视区域四个边界
        // 任一边界缺失时降级为 ±range（兼容旧调用方）
        const { lat, lng, latMin, latMax, lngMin, lngMax, category } = event;
        if (lat == null || lng == null) return { code: -1, msg: '缺少经纬度' };

        const t0 = Date.now();

        const useBounds = latMin != null && latMax != null && lngMin != null && lngMax != null;
        let where = { status: 'approved' };
        if (useBounds) {
          where.latitude = _.gte(latMin).and(_.lte(latMax));
          where.longitude = _.gte(lngMin).and(_.lte(lngMax));
        } else {
          // 降级：±0.135° ≈ 15km
          const range = 0.135;
          where.latitude = _.gte(lat - range).and(_.lte(lat + range));
          where.longitude = _.gte(lng - range).and(_.lte(lng + range));
        }
        let query = db.collection('mp_place').where(where);
        if (category && category !== 'all') {
          query = query.where({ category });
        }

        // D2：硬截断 limit 50（缩放到全国时也不爆）
        const result = await query.limit(50).get();
        const places = result.data.map(p => ({
          placeId: p._id,
          name: p.name,
          category: p.category,
          address: p.address,
          latitude: p.latitude,
          longitude: p.longitude,
          phone: p.phone,
          businessHours: p.business_hours,
          petPolicy: p.pet_policy,
          images: p.images || [],
          rating: p.rating,
          reviewCount: p.review_count,
          distance: getDistance(lat, lng, p.latitude, p.longitude)
        }));
        places.sort((a, b) => a.distance - b.distance);
        console.log(`[mp-place list] query=${Date.now() - t0}ms, rows=${result.data.length}`);
        return { code: 1, data: { places, truncated: result.data.length >= 50 } };
      }

      case 'search': {
        const { keyword } = event;
        if (!keyword) return { code: -1, msg: '缺少搜索关键词' };
        const result = await db.collection('mp_place')
          .where(_.or([
            { name: db.RegExp({ regexp: keyword, options: 'i' }) },
            { address: db.RegExp({ regexp: keyword, options: 'i' }) }
          ]).and({ status: 'approved' }))
          .limit(20).get();
        const places = result.data.map(p => ({
          placeId: p._id, name: p.name, category: p.category, address: p.address,
          latitude: p.latitude, longitude: p.longitude, phone: p.phone,
          images: p.images || [], rating: p.rating, reviewCount: p.review_count
        }));
        return { code: 1, data: { places } };
      }

      case 'detail': {
        const { placeId } = event;
        if (!placeId) return { code: -1, msg: '缺少 placeId' };
        const result = await db.collection('mp_place').doc(placeId).get();
        if (!result.data || !result.data._id) return { code: -1, msg: '地点不存在' };
        const p = result.data;

        // 获取打卡数和最近打卡
        let checkinCount = 0, recentCheckins = [];
        try {
          const ckResult = await db.collection('mp_checkin').where({ place_id: placeId }).count();
          checkinCount = ckResult.total;
          const recent = await db.collection('mp_checkin').where({ place_id: placeId }).orderBy('created_at', 'desc').limit(5).get();
          recentCheckins = recent.data.map(c => ({
            userId: c.user_id, petId: c.pet_id, avatarSnapshot: c.avatar_snapshot, createdAt: c.created_at
          }));
        } catch (e) { /* 打卡数据非必须 */ }

        // P1: 优先读 mp_place_stats 缓存，缺失时降级到实时查询
        let tagStats = {}, breedDistribution = {}, hourlyHeatmap = {};
        try {
          const stats = await db.collection('mp_place_stats').doc(placeId).get();
          if (stats.data) {
            tagStats = stats.data.tag_stats || {};
            breedDistribution = stats.data.breed_distribution || {};
            hourlyHeatmap = stats.data.hourly_heatmap || {};
          }
        } catch (e) { /* 缓存未命中，降级 */ }

        // 全量 tag 统计：直接聚合 mp_place_tag_vote 集合
        let tagList = [];
        try {
          const voteRes = await db.collection('mp_place_tag_vote').where({ place_id: placeId }).get();
          // 聚合到 { tag_id: { pos, neg, total } }
          const agg = {};
          voteRes.data.forEach(v => {
            if (!agg[v.tag_id]) agg[v.tag_id] = { pos: 0, neg: 0, total: 0 };
            if (v.vote === 1) agg[v.tag_id].pos++;
            else if (v.vote === -1) agg[v.tag_id].neg++;
            agg[v.tag_id].total++;
          });
          // 输出每个 tag 的聚合（前端会与本地 TAGS 合并补全）
          tagList = Object.keys(agg).map(tid => ({
            id: tid,
            pos: agg[tid].pos,
            neg: agg[tid].neg,
            total: agg[tid].total
          }));
        } catch (e) { /* tag vote 集合可能不存在 */ }

        return {
          code: 1,
          data: {
            placeId: p._id, name: p.name, category: p.category, address: p.address,
            latitude: p.latitude, longitude: p.longitude, phone: p.phone,
            businessHours: p.business_hours, petPolicy: p.pet_policy,
            images: p.images || [], rating: p.rating, reviewCount: p.review_count,
            source: p.source, checkinCount, recentCheckins,
            tagStats, tagList, breedDistribution, hourlyHeatmap
          }
        };
      }

      case 'submit': {
        const { name, category, address, latitude, longitude, phone, businessHours, petPolicy, images } = event;
        if (!name || !address || !category) return { code: -1, msg: '名称、地址和分类为必填' };

        const result = await db.collection('mp_place').add({
          data: {
            name, category, address,
            latitude: latitude || 0, longitude: longitude || 0,
            phone: phone || '', business_hours: businessHours || '',
            pet_policy: petPolicy || '', images: images || [],
            rating: 0, review_count: 0,
            source: 'user_submitted', status: 'pending',
            created_at: new Date(), updated_at: new Date()
          }
        });
        return { code: 1, data: { placeId: result._id } };
      }

      // 上传照片：将云存储 fileID 追加到 mp_place.images 数组
      case 'addImage': {
        const { placeId, imageFileId } = event;
        if (!placeId || !imageFileId) return { code: -1, msg: '缺少参数' };

        const result = await db.collection('mp_place').doc(placeId).get();
        if (!result.data || !result.data._id) return { code: -1, msg: '地点不存在' };

        const images = result.data.images || [];
        images.push(imageFileId);
        await db.collection('mp_place').doc(placeId).update({
          data: { images, updated_at: new Date() }
        });
        return { code: 1, data: { images } };
      }

      case 'favorite': {
        const { placeId, toggle } = event;
        if (!placeId) return { code: -1, msg: '缺少 placeId' };

        const users = db.collection('common_user');
        const u = await users.where({ openid }).get();
        if (u.data.length === 0) return { code: -1, msg: '用户未注册' };
        const userId = u.data[0]._id;

        // 查询/写入 mp_favorite 时容错：集合不存在视为未收藏
        try {
          if (toggle) {
            const exist = await db.collection('mp_favorite').where({ user_id: userId, place_id: placeId }).get();
            if (exist.data.length > 0) {
              await db.collection('mp_favorite').doc(exist.data[0]._id).remove();
              return { code: 1, data: { favorited: false } };
            }
            await db.collection('mp_favorite').add({ data: { user_id: userId, place_id: placeId, created_at: new Date() } });
            return { code: 1, data: { favorited: true } };
          }
          const exist = await db.collection('mp_favorite').where({ user_id: userId, place_id: placeId }).get();
          return { code: 1, data: { favorited: exist.data.length > 0 } };
        } catch (e) {
          // 集合不存在
          if (toggle) {
            await db.collection('mp_favorite').add({ data: { user_id: userId, place_id: placeId, created_at: new Date() } });
            return { code: 1, data: { favorited: true } };
          }
          return { code: 1, data: { favorited: false } };
        }
      }

      case 'myFavorites': {
        const users = db.collection('common_user');
        const u = await users.where({ openid }).get();
        if (u.data.length === 0) return { code: -1, msg: '用户未注册' };
        const userId = u.data[0]._id;

        const favResult = await db.collection('mp_favorite').where({ user_id: userId }).get();
        const placeIds = favResult.data.map(f => f.place_id);
        if (placeIds.length === 0) return { code: 1, data: { places: [] } };

        const placeResult = await db.collection('mp_place').where({ _id: _.in(placeIds), status: 'approved' }).get();
        const places = placeResult.data.map(p => ({
          placeId: p._id, name: p.name, category: p.category, address: p.address,
          latitude: p.latitude, longitude: p.longitude, images: p.images || [], rating: p.rating
        }));
        return { code: 1, data: { places } };
      }

      // DEV ONLY: 种子数据注入（开发阶段用，上线前删除）
      case 'seedDev': {
        const now = new Date();
        const seeds = [
          {
            name: '星巴克臻选（华侨城店）', category: 'cafe',
            address: '深圳市南山区华侨城创意园北区A4栋',
            latitude: 22.5362, longitude: 113.9792,
            phone: '0755-26901234',
            business_hours: '07:00-22:00',
            pet_policy: '户外座位宠物友好，提供饮水碗，室内需装包',
            images: ['https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600'],
            rating: 4.5, review_count: 28,
            status: 'approved', source: 'dev_seed'
          },
          {
            name: '华侨城生态广场', category: 'park',
            address: '深圳市南山区侨城西街8号',
            latitude: 22.5380, longitude: 113.9810,
            phone: '',
            business_hours: '全天开放',
            pet_policy: '大型草坪可遛狗，需牵绳，有宠物厕所',
            images: ['https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600'],
            rating: 4.8, review_count: 56,
            status: 'approved', source: 'dev_seed'
          },
          {
            name: '宠物家（科技园店）', category: 'pet_store',
            address: '深圳市南山区科技南路18号阳光粤海花园1楼',
            latitude: 22.5431, longitude: 113.9520,
            phone: '0755-86543210',
            business_hours: '09:00-21:00',
            pet_policy: '可带宠物进店，提供免费零食和试吃',
            images: ['https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600'],
            rating: 4.6, review_count: 42,
            status: 'approved', source: 'dev_seed'
          },
          {
            name: '猫狗咖啡厅·Caturday', category: 'cafe',
            address: '深圳市福田区华强北路1019号华强广场B1',
            latitude: 22.5478, longitude: 114.0857,
            phone: '0755-87654321',
            business_hours: '10:00-20:00',
            pet_policy: '猫狗友好主题咖啡厅，有宠物菜单，可进室内',
            images: ['https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?w=600'],
            rating: 4.7, review_count: 89,
            status: 'approved', source: 'dev_seed'
          },
          {
            name: '瑞鹏宠物医院（南山分院）', category: 'hospital',
            address: '深圳市南山区桃园路222号',
            latitude: 22.5280, longitude: 113.9245,
            phone: '0755-26781234',
            business_hours: '09:00-21:00（急诊24h）',
            pet_policy: '全科宠物医院，有独立犬猫候诊区',
            images: ['https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=600'],
            rating: 4.4, review_count: 103,
            status: 'approved', source: 'dev_seed'
          }
        ];

        const ids = [];
        for (const place of seeds) {
          // 避免重复：同名同地址跳过
          const exist = await db.collection('mp_place')
            .where({ name: place.name, address: place.address }).get();
          if (exist.data.length > 0) {
            ids.push(exist.data[0]._id);
            continue;
          }
          const res = await db.collection('mp_place').add({
            data: { ...place, created_at: now, updated_at: now }
          });
          ids.push(res._id);
        }
        return { code: 1, data: { inserted: ids.length, ids } };
      }

      default:
        return { code: 0, data: { message: 'mp-place — action 不支持' } };
    }
  } catch (err) {
    console.error('[mp-place] Error:', err);
    return { code: -1, msg: err.message };
  }
};
