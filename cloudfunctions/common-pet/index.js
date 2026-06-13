// 云函数: common-pet — 宠物档案 CRUD
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;
const MAX_PET_PHOTOS = 5;

function normalizePhotos(photos) {
  if (!Array.isArray(photos)) return [];
  return photos.filter(photo => typeof photo === 'string' && photo.trim()).slice(0, MAX_PET_PHOTOS);
}

function parsePhotosInput(photos) {
  if (photos === undefined) return { provided: false, photos: [] };
  if (!Array.isArray(photos)) return { error: '照片数据格式错误' };
  const cleaned = photos.filter(photo => typeof photo === 'string' && photo.trim());
  if (cleaned.length > MAX_PET_PHOTOS) return { error: '最多上传 5 张照片' };
  return { provided: true, photos: cleaned };
}

function normalizeIsPublic(pet) {
  return pet.is_public !== false;
}

function normalizeLikeCount(pet) {
  return typeof pet.like_count === 'number' ? pet.like_count : 0;
}

function formatPet(p) {
  return {
    petId: p._id,
    name: p.name,
    species: p.species,
    breed: p.breed,
    gender: p.gender,
    birthday: p.birthday,
    avatarUrl: p.avatar_url,
    photos: normalizePhotos(p.photos),
    isPublic: normalizeIsPublic(p),
    likeCount: normalizeLikeCount(p),
    createdAt: p.created_at
  };
}

exports.main = async (event, context) => {
  const { action } = event;
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  try {
    // 所有操作需要 openid 鉴权
    const users = db.collection('common_user');
    const userResult = await users.where({ openid }).get();
    if (userResult.data.length === 0) {
      return { code: -1, msg: '用户未注册' };
    }
    const userId = userResult.data[0]._id;

    switch (action) {
      case 'create': {
        const { name, species, breed, gender, birthday, avatarUrl, photos, isPublic } = event;
        if (!name || !species) return { code: -1, msg: '宠物名和物种为必填' };
        const parsedPhotos = parsePhotosInput(photos);
        if (parsedPhotos.error) return { code: -1, msg: parsedPhotos.error };

        // 限制每用户最多 5 只宠物
        const countResult = await db.collection('common_pet')
          .where({ user_id: userId, is_active: 1 }).count();
        if (countResult.total >= 5) {
          return { code: -1, msg: '最多添加 5 只宠物' };
        }

        const result = await db.collection('common_pet').add({
          data: {
            user_id: userId,
            name,
            species,
            breed: breed || '',
            gender: gender || 'unknown',
            birthday: birthday || null,
            avatar_url: avatarUrl || '',
            photos: parsedPhotos.provided ? parsedPhotos.photos : [],
            is_public: isPublic === false ? false : true,
            like_count: 0,
            is_active: 1,
            created_at: new Date(),
            updated_at: new Date()
          }
        });
        return { code: 1, data: { petId: result._id } };
      }

      case 'list': {
        const pets = db.collection('common_pet')
          .where({ user_id: userId, is_active: 1 })
          .orderBy('created_at', 'asc');
        const result = await pets.get();
        const list = result.data.map(formatPet);
        return { code: 1, data: { pets: list, total: list.length } };
      }

      case 'detail': {
        const { petId } = event;
        if (!petId) return { code: -1, msg: '缺少 petId' };
        const result = await db.collection('common_pet').doc(petId).get();
        if (!result.data || !result.data._id) return { code: -1, msg: '宠物不存在' };
        if (result.data.user_id !== userId) return { code: -2, msg: '无权访问' };

        const p = result.data;
        return {
          code: 1,
          data: formatPet(p)
        };
      }

      case 'update': {
        const { petId, name, species, breed, gender, birthday, avatarUrl, photos, isPublic } = event;
        if (!petId) return { code: -1, msg: '缺少 petId' };
        const result = await db.collection('common_pet').doc(petId).get();
        if (!result.data || !result.data._id) return { code: -1, msg: '宠物不存在' };
        if (result.data.user_id !== userId) return { code: -2, msg: '无权操作' };
        const parsedPhotos = parsePhotosInput(photos);
        if (parsedPhotos.error) return { code: -1, msg: parsedPhotos.error };

        const updateData = { updated_at: new Date() };
        if (name !== undefined) updateData.name = name;
        if (species !== undefined) updateData.species = species;
        if (breed !== undefined) updateData.breed = breed;
        if (gender !== undefined) updateData.gender = gender;
        if (birthday !== undefined) updateData.birthday = birthday;
        if (avatarUrl !== undefined) updateData.avatar_url = avatarUrl;
        if (parsedPhotos.provided) updateData.photos = parsedPhotos.photos;
        if (isPublic !== undefined) updateData.is_public = !!isPublic;

        await db.collection('common_pet').doc(petId).update({ data: updateData });
        return { code: 1, data: { success: true } };
      }

      case 'delete': {
        const { petId } = event;
        if (!petId) return { code: -1, msg: '缺少 petId' };
        const result = await db.collection('common_pet').doc(petId).get();
        if (!result.data || result.data.length === 0) return { code: -1, msg: '宠物不存在' };
        if (result.data.user_id !== userId) return { code: -2, msg: '无权操作' };

        // 软删除
        await db.collection('common_pet').doc(petId).update({
          data: { is_active: 0, updated_at: new Date() }
        });
        return { code: 1, data: { success: true } };
      }

      default:
        return { code: 0, data: { message: 'common-pet — action 不支持' } };
    }
  } catch (err) {
    console.error('[common-pet] Error:', err);
    return { code: -1, msg: err.message };
  }
};
