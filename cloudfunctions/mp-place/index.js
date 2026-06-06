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
        const { lat, lng, radius = 5000, category } = event;
        if (!lat || !lng) return { code: -1, msg: '缺少经纬度' };

        let query = db.collection('mp_place').where({
          status: 'approved',
          latitude: _.gte(lat - 0.1).and(_.lte(lat + 0.1)),
          longitude: _.gte(lng - 0.1).and(_.lte(lng + 0.1))
        });
        if (category && category !== 'all') {
          query = query.where({ category });
        }

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
        return { code: 1, data: { places } };
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

        return {
          code: 1,
          data: {
            placeId: p._id, name: p.name, category: p.category, address: p.address,
            latitude: p.latitude, longitude: p.longitude, phone: p.phone,
            businessHours: p.business_hours, petPolicy: p.pet_policy,
            images: p.images || [], rating: p.rating, reviewCount: p.review_count,
            source: p.source, checkinCount, recentCheckins
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

      case 'favorite': {
        const { placeId, toggle } = event;
        if (!placeId) return { code: -1, msg: '缺少 placeId' };

        const users = db.collection('common_user');
        const u = await users.where({ openid }).get();
        if (u.data.length === 0) return { code: -1, msg: '用户未注册' };
        const userId = u.data[0]._id;

        if (toggle) {
          // 检查是否已收藏
          const exist = await db.collection('mp_favorite').where({ user_id: userId, place_id: placeId }).get();
          if (exist.data.length > 0) {
            await db.collection('mp_favorite').doc(exist.data[0]._id).remove();
            return { code: 1, data: { favorited: false } };
          }
          await db.collection('mp_favorite').add({ data: { user_id: userId, place_id: placeId, created_at: new Date() } });
          return { code: 1, data: { favorited: true } };
        }
        // 获取收藏状态
        const exist = await db.collection('mp_favorite').where({ user_id: userId, place_id: placeId }).get();
        return { code: 1, data: { favorited: exist.data.length > 0 } };
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

      default:
        return { code: 0, data: { message: 'mp-place — action 不支持' } };
    }
  } catch (err) {
    console.error('[mp-place] Error:', err);
    return { code: -1, msg: err.message };
  }
};
