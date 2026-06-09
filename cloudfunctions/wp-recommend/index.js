// 云函数: wp-recommend — 推荐宠物列表
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

// 统一性别为中文
function normalizeGender(g) {
  if (!g) return '未知';
  if (/^(male|男|公|男生)$/i.test(g)) return '男生';
  if (/^(female|女|母|女生)$/i.test(g)) return '女生';
  return g;
}

exports.main = async (event, context) => {
  const { action } = event;
  const wxContext = cloud.getWXContext();

  try {
    switch (action) {
      // ---- seed: 自动造宠物 + 推荐数据 ----
      case 'seed': {
        const count = event.count || 10;

        // 1. 检查 common_pet 里有多少宠物
        let allPets = await db.collection('common_pet')
          .where({ is_active: 1 })
          .field({ _id: true })
          .limit(100)
          .get();

        // 2. 不够就批量造假数据
        if (allPets.data.length < count) {
          const need = count - allPets.data.length;
          const names = ['球球','豆豆','棉花','奶茶','团子','布丁','年糕','汤圆','雪饼','奥利','摩卡','芝士','泡芙','可乐','芒果','曲奇','糯米','馒头','包子','花卷'];
          const breeds = {
            dog: ['金毛','柯基','萨摩耶','柴犬','泰迪','哈士奇','边牧','法斗','比熊','博美'],
            cat: ['暹罗','英短','美短','布偶','橘猫','蓝猫','加菲','无毛','缅因','折耳'],
            rabbit: ['荷兰垂耳','侏儒兔','安哥拉','狮子兔','迷你雷克斯'],
            other: ['仓鼠','龙猫','刺猬','鹦鹉']
          };
          const speciesList = ['dog','cat','rabbit','other'];
          const genders = ['男生','女生'];

          const now = new Date();
          const fakePets = [];
          for (let i = 0; i < need; i++) {
            const species = speciesList[Math.floor(Math.random() * speciesList.length)];
            const breedList = breeds[species];
            const breed = breedList[Math.floor(Math.random() * breedList.length)];
            fakePets.push({
              name: names[Math.floor(Math.random() * names.length)] + (Math.random() > 0.5 ? '' : names[Math.floor(Math.random() * names.length)]),
              species,
              breed,
              gender: normalizeGender(genders[Math.floor(Math.random() * genders.length)]),
              birthday: `202${1 + Math.floor(Math.random() * 4)}-${String(Math.floor(Math.random() * 12) + 1).padStart(2,'0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2,'0')}`,
              avatar_url: '',
              user_id: 'seed_pool',   // 标记为种子数据，不属于任何真实用户
              is_active: 1,
              created_at: now,
              updated_at: now
            });
          }

          // 批量插入
          for (const pet of fakePets) {
            await db.collection('common_pet').add({ data: pet });
          }

          // 重新查询
          allPets = await db.collection('common_pet')
            .where({ is_active: 1 })
            .field({ _id: true })
            .limit(100)
            .get();
        }

        // 3. 随机打乱取 count 条写入推荐池
        const shuffled = [...allPets.data].sort(() => Math.random() - 0.5);
        const picked = shuffled.slice(0, count);

        // 先清空旧推荐
        const old = await db.collection('wp_recommend_pet').where({}).get();
        for (const doc of old.data) {
          await db.collection('wp_recommend_pet').doc(doc._id).remove();
        }

        const now = new Date();
        for (const p of picked) {
          await db.collection('wp_recommend_pet').add({
            data: {
              pet_id: p._id,
              likes: Math.floor(Math.random() * 500) + 50,
              has_3d: Math.random() > 0.4,
              avatar_3d_url: '',
              is_active: true,
              created_at: now,
              updated_at: now
            }
          });
        }

        return { code: 1, data: { count: picked.length }, msg: '已生成推荐数据（含自动补全宠物）' };
      }

      // ---- list: 获取 3 条推荐 ----
      case 'list': {
        const recommendResult = await db.collection('wp_recommend_pet')
          .where({ is_active: true })
          .get();

        if (!recommendResult.data.length) {
          return { code: 1, data: { pets: [] } };
        }

        const shuffled = [...recommendResult.data].sort(() => Math.random() - 0.5);
        const picked = shuffled.slice(0, 3);

        const petIds = [...new Set(picked.map(r => r.pet_id))];
        const petResults = await db.collection('common_pet')
          .where({ _id: _.in(petIds), is_active: 1 })
          .get();
        const petMap = {};
        petResults.data.forEach(p => { petMap[p._id] = p; });

        const pets = picked.map(r => {
          const pet = petMap[r.pet_id];
          if (!pet) return null;
          return {
            id: r._id,
            petId: pet._id,
            name: pet.name,
            species: pet.species || 'other',
            breed: pet.breed || '',
            gender: normalizeGender(pet.gender),
            birthday: pet.birthday || '',
            avatarUrl: pet.avatar_url || '',
            avatar3dUrl: r.avatar_3d_url || '',
            has3d: !!r.has_3d,
            likes: r.likes || 0
          };
        }).filter(Boolean);

        return { code: 1, data: { pets } };
      }

      default:
        return { code: -1, msg: '未知操作: ' + action };
    }
  } catch (err) {
    console.error('[wp-recommend]', err);
    return { code: -1, msg: err.message || '服务异常' };
  }
};
