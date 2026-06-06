// tools/seed-gb-products.js
// 团购种子数据导入脚本
// 用法：在微信云开发控制台 → 云函数 → gb-product → 高级功能 → 执行代码
// 或者创建一个临时云函数执行

const seedData = [
  {
    name: '宠物项圈·樱花粉',
    category: 'accessory',
    price_original: 79,
    price_group: 39,
    description: '柔软皮质项圈，樱花粉配色，适合中小型犬猫。附赠铃铛，走失提醒小帮手。',
    min_group_size: 3,
    stock: 100,
    sold_count: 28,
    images: ['https://picsum.photos/seed/collar/400/400', 'https://picsum.photos/seed/collar2/400/400'],
    wp_item_id: '',
    is_active: 1,
    created_at: new Date()
  },
  {
    name: '猫咪罐头·混合口味6罐装',
    category: 'food',
    price_original: 99,
    price_group: 49,
    description: '金枪鱼+鸡肉+三文鱼三种口味各2罐，优质蛋白质，无添加诱食剂。',
    min_group_size: 5,
    stock: 200,
    sold_count: 56,
    images: ['https://picsum.photos/seed/can/400/400'],
    wp_item_id: '',
    is_active: 1,
    created_at: new Date()
  },
  {
    name: '逗猫棒·羽毛铃铛款',
    category: 'toy',
    price_original: 39,
    price_group: 19,
    description: '天然羽毛逗猫棒，弹性杆+叮当铃铛，主子最爱追逐玩具。',
    min_group_size: 10,
    stock: 500,
    sold_count: 132,
    images: ['https://picsum.photos/seed/wand/400/400'],
    wp_item_id: '',
    is_active: 1,
    created_at: new Date()
  },
  {
    name: '狗狗磨牙棒·牛肉味',
    category: 'food',
    price_original: 69,
    price_group: 35,
    description: '天然牛皮磨牙棒，牛肉风味，清洁牙齿预防牙结石。适合中小型犬。',
    min_group_size: 5,
    stock: 150,
    sold_count: 41,
    images: ['https://picsum.photos/seed/chew/400/400'],
    wp_item_id: '',
    is_active: 1,
    created_at: new Date()
  },
  {
    name: '宠物云朵睡垫·M号',
    category: 'accessory',
    price_original: 199,
    price_group: 99,
    description: '超柔软云朵造型睡垫，可拆洗内芯，防滑底部。适合猫和中小型犬。',
    min_group_size: 3,
    stock: 60,
    sold_count: 15,
    images: ['https://picsum.photos/seed/bed/400/400', 'https://picsum.photos/seed/bed2/400/400'],
    wp_item_id: '',
    is_active: 1,
    created_at: new Date()
  },
  {
    name: '宠物条纹T恤·M号',
    category: 'clothing',
    price_original: 129,
    price_group: 69,
    description: '纯棉条纹T恤，透气舒适，适合春秋室内穿着。胸围35-42cm。',
    min_group_size: 5,
    stock: 80,
    sold_count: 22,
    images: ['https://picsum.photos/seed/shirt/400/400'],
    wp_item_id: '',
    is_active: 1,
    created_at: new Date()
  },
  {
    name: '宠物香氛沐浴露',
    category: 'grooming',
    price_original: 89,
    price_group: 45,
    description: '植物精华沐浴露，樱花香氛，温和不刺激，适合所有犬猫品种。',
    min_group_size: 5,
    stock: 120,
    sold_count: 34,
    images: ['https://picsum.photos/seed/wash/400/400'],
    wp_item_id: '',
    is_active: 1,
    created_at: new Date()
  },
  {
    name: '金色球形铃铛项圈',
    category: 'accessory',
    price_original: 49,
    price_group: 25,
    description: '金色球形铃铛，清脆悦耳，方便定位宠物位置。适配1-3cm宽项圈。',
    min_group_size: 10,
    stock: 300,
    sold_count: 78,
    images: ['https://picsum.photos/seed/bell/400/400'],
    wp_item_id: '',
    is_active: 1,
    created_at: new Date()
  }
];

// ====================================
// 方式一：直接在云函数高级功能里执行此代码
// ====================================
/*
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

for (const item of seedData) {
  try {
    await db.collection('gb_product').add({ data: item });
    console.log('✅', item.name);
  } catch (e) {
    console.log('❌', item.name, e.message);
  }
}
*/

// ====================================
// 方式二：命令行 Node.js 直接写入（需要微信云开发 API key）
// ====================================

console.log(`\n共 ${seedData.length} 条商品数据，请到微信云开发控制台手动执行导入。`);
console.log('\n操作路径：');
console.log('  云开发 → 数据库 → gb_product 集合 → 导入 → 选择此脚本生成的数据');
console.log('\n或复制上方注释块代码到 gb-product 云函数的"高级功能→执行代码"中运行。');
console.log('\n-- 数据预览 --');
seedData.forEach((item, i) => {
  console.log(`${i + 1}. [${item.category}] ${item.name} · ¥${item.price_original} → ¥${item.price_group}`);
});
