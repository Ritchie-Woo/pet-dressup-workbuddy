// tools/build-products.js — 从 taobaosku 生成商品数据文件
const fs = require('fs');
const path = require('path');

const CATEGORY_MAP = {
  '衣服': 'clothing',
  '鞋子': 'clothing',
  '帽子': 'clothing',
  '项圈': 'accessory',
  '用品': 'accessory',
  '食物': 'food',
  '玩具': 'toy',
  '洗护': 'grooming'
};

const SKU_DIR = path.join(__dirname, '..', 'taobaosku');
const OUTPUT = path.join(__dirname, '..', 'miniprogram', 'data', 'products.js');

const products = [];
let idCounter = 1;

for (const [dirName, catKey] of Object.entries(CATEGORY_MAP)) {
  const jsonPath = path.join(SKU_DIR, dirName, 'products.json');
  if (!fs.existsSync(jsonPath)) continue;

  const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  for (const item of raw) {
    const productId = 'prod_' + String(idCounter++).padStart(4, '0');
    const originalPrice = Math.round(item.price * 100) / 100;
    const groupPrice = Math.round(originalPrice * 0.6 * 100) / 100;

    products.push({
      productId,
      name: item.name,
      category: catKey,
      categoryLabel: dirName,
      thumbnail: '/images/products/' + dirName + '/' + item.image,
      images: ['/images/products/' + dirName + '/' + item.image],
      priceOriginal: originalPrice,
      priceGroup: groupPrice,
      description: item.description || '',
      minGroupSize: 2 + Math.floor(Math.random() * 4),
      stock: 100,
      soldCount: 10 + Math.floor(Math.random() * 41),
      isSoldOut: false,
      isActive: true
    });
  }
}

const dir = path.dirname(OUTPUT);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const content = '// 自动生成，来源：taobaosku 文件夹\nconst PRODUCTS = ' + JSON.stringify(products, null, 2) + ';\nmodule.exports = PRODUCTS;\n';

fs.writeFileSync(OUTPUT, content, 'utf8');
console.log('✅ 生成完成：' + OUTPUT);
console.log('📦 共 ' + products.length + ' 件商品');
const byCat = {};
for (const p of products) {
  byCat[p.category] = (byCat[p.category] || 0) + 1;
}
for (const [k, v] of Object.entries(byCat)) {
  console.log('  ' + k + ' → ' + v + ' 件');
}
