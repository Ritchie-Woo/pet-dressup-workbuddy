// 云函数: seed-products — 一次性种子数据导入
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

const SEED_DATA = [
  {
    "name": "Pet Deadly Doll 万圣节趣味服装 - 小号",
    "category": "clothing",
    "price_original": 88.22,
    "price_group": 52.93,
    "description": "创意恐怖娃娃角色扮演造型，适合万圣节圣诞节派对。趣味十足，让宠物成为全场焦点。适合中小型犬。",
    "images": [
      "/images/products/衣服/clothes_01.jpg"
    ],
    "min_group_size": 3,
    "stock": 100,
    "sold_count": 43,
    "is_active": 1,
    "specs": [],
    "wp_item_id": "",
    "created_at": "2026-06-06T17:02:13.382Z"
  },
  {
    "name": "NACOCO 牛仔骑士风格宠物服装 - M码",
    "category": "clothing",
    "price_original": 115.39,
    "price_group": 69.23,
    "description": "经典牛仔骑士造型，带小娃娃和帽子装饰。趣味cosplay风格，万圣节宠物派对必备。NACOCO品牌。",
    "images": [
      "/images/products/衣服/clothes_02.jpg"
    ],
    "min_group_size": 2,
    "stock": 100,
    "sold_count": 22,
    "is_active": 1,
    "specs": [],
    "wp_item_id": "",
    "created_at": "2026-06-06T17:02:13.382Z"
  },
  {
    "name": "牛仔背带裤宠物连体衣 - 蓝色中号",
    "category": "clothing",
    "price_original": 128.97,
    "price_group": 77.38,
    "description": "时尚牛仔布背带裤连体衣设计，可爱帅气。适合小型中型猫狗穿着，蓝色经典百搭。牛仔夹克吊带连身衣。",
    "images": [
      "/images/products/衣服/clothes_03.jpg"
    ],
    "min_group_size": 4,
    "stock": 100,
    "sold_count": 43,
    "is_active": 1,
    "specs": [],
    "wp_item_id": "",
    "created_at": "2026-06-06T17:02:13.382Z"
  },
  {
    "name": "iSmarten 牛仔骑手风格宠物套装 - S码",
    "category": "clothing",
    "price_original": 101.8,
    "price_group": 61.08,
    "description": "西部牛仔骑手风格设计，搭配小娃娃和帽子。宠物cosplay服装，拍照凹造型利器。iSmarten品牌。",
    "images": [
      "/images/products/衣服/clothes_04.jpg"
    ],
    "min_group_size": 2,
    "stock": 100,
    "sold_count": 13,
    "is_active": 1,
    "specs": [],
    "wp_item_id": "",
    "created_at": "2026-06-06T17:02:13.382Z"
  },
  {
    "name": "NACOCO 绿色恐龙造型宠物服装 - XL码",
    "category": "clothing",
    "price_original": 108.6,
    "price_group": 65.16,
    "description": "可爱绿色恐龙造型连体衣，背部带脊刺装饰。适合中型和大型犬，万圣节/圣诞节/日常搞怪必备。NACOCO品牌。",
    "images": [
      "/images/products/衣服/clothes_05.jpg"
    ],
    "min_group_size": 2,
    "stock": 100,
    "sold_count": 27,
    "is_active": 1,
    "specs": [],
    "wp_item_id": "",
    "created_at": "2026-06-06T17:02:13.382Z"
  },
  {
    "name": "Gimilife 卡通连帽衫宠物睡衣套装 - S码",
    "category": "clothing",
    "price_original": 135.76,
    "price_group": 81.46,
    "description": "卡通造型连帽衫设计，保暖舒适。万圣节圣诞节主题睡衣套装，适合小型到大型犬和猫咪冬季穿着。",
    "images": [
      "/images/products/衣服/clothes_06.jpg"
    ],
    "min_group_size": 4,
    "stock": 100,
    "sold_count": 36,
    "is_active": 1,
    "specs": [],
    "wp_item_id": "",
    "created_at": "2026-06-06T17:02:13.382Z"
  },
  {
    "name": "QUMY 狗狗鞋 - 大型犬户外防护靴",
    "category": "clothing",
    "price_original": 196.89,
    "price_group": 118.13,
    "description": "QUMY品牌热销狗靴，防滑鞋底适合冬季雪地、夏季热路面和雨天。防水材质，户外散步和室内硬地板均可穿。",
    "images": [
      "/images/products/鞋子/shoes_01.jpg"
    ],
    "min_group_size": 3,
    "stock": 100,
    "sold_count": 33,
    "is_active": 1,
    "specs": [],
    "wp_item_id": "",
    "created_at": "2026-06-06T17:02:13.382Z"
  },
  {
    "name": "XSY&G 防水反光狗靴4件套 - 尺码6",
    "category": "clothing",
    "price_original": 162.93,
    "price_group": 97.76,
    "description": "防水材质搭配反光条设计，夜间更安全。坚固防滑鞋底，4件套装。适合中型至大型犬户外活动。",
    "images": [
      "/images/products/鞋子/shoes_02.jpg"
    ],
    "min_group_size": 4,
    "stock": 100,
    "sold_count": 39,
    "is_active": 1,
    "specs": [],
    "wp_item_id": "",
    "created_at": "2026-06-06T17:02:13.382Z"
  },
  {
    "name": "防水狗靴 - 小型/中型犬防滑背带靴（黑色）",
    "category": "clothing",
    "price_original": 95.01,
    "price_group": 57.01,
    "description": "防水防污材质，背带式固定不易脱落。反光设计保持安全，防滑舒适短靴。适合小型和中型犬。",
    "images": [
      "/images/products/鞋子/shoes_03.jpg"
    ],
    "min_group_size": 4,
    "stock": 100,
    "sold_count": 17,
    "is_active": 1,
    "specs": [],
    "wp_item_id": "",
    "created_at": "2026-06-06T17:02:13.382Z"
  },
  {
    "name": "SCENEREAL 透气打孔狗鞋 - EVA防滑底",
    "category": "clothing",
    "price_original": 251.22,
    "price_group": 150.73,
    "description": "透气打孔设计不闷脚，EVA轻质防滑鞋底。适合炎热路面防护，小中大型犬均有尺码可选。",
    "images": [
      "/images/products/鞋子/shoes_04.jpg"
    ],
    "min_group_size": 3,
    "stock": 100,
    "sold_count": 45,
    "is_active": 1,
    "specs": [],
    "wp_item_id": "",
    "created_at": "2026-06-06T17:02:13.383Z"
  },
  {
    "name": "Dimicoo 透气狗靴 - 夏季炎热路面防滑鞋",
    "category": "clothing",
    "price_original": 122.11,
    "price_group": 73.27,
    "description": "Dimicoo品牌轻质透气狗靴，夏季炎热路面防护。防滑鞋底适合室内外硬地板，爪子保护利器。",
    "images": [
      "/images/products/鞋子/shoes_05.jpg"
    ],
    "min_group_size": 5,
    "stock": 100,
    "sold_count": 33,
    "is_active": 1,
    "specs": [],
    "wp_item_id": "",
    "created_at": "2026-06-06T17:02:13.383Z"
  },
  {
    "name": "狗狗棒球帽 - 粉色夏季沙滩遮阳帽（小号）",
    "category": "clothing",
    "price_original": 81.43,
    "price_group": 48.86,
    "description": "可爱粉色棒球帽设计，带耳孔透气。可调节大小，夏季沙滩户外遮阳防晒必备。适合狗猫通用。",
    "images": [
      "/images/products/帽子/hat_01.jpg"
    ],
    "min_group_size": 4,
    "stock": 100,
    "sold_count": 23,
    "is_active": 1,
    "specs": [],
    "wp_item_id": "",
    "created_at": "2026-06-06T17:02:13.383Z"
  },
  {
    "name": "宠物夏季遮阳帽 - 蓝色狗猫通用（小号）",
    "category": "clothing",
    "price_original": 88.22,
    "price_group": 52.93,
    "description": "清爽蓝色遮阳帽，带耳孔设计让宠物佩戴更舒适。可调节帽围，适合中小型犬和猫咪夏季户外使用。",
    "images": [
      "/images/products/帽子/hat_02.jpg"
    ],
    "min_group_size": 4,
    "stock": 100,
    "sold_count": 16,
    "is_active": 1,
    "specs": [],
    "wp_item_id": "",
    "created_at": "2026-06-06T17:02:13.383Z"
  },
  {
    "name": "宠物狗棒球帽 - 绿色户外太阳帽（大号）",
    "category": "clothing",
    "price_original": 81.43,
    "price_group": 48.86,
    "description": "户外休闲绿色棒球帽，带耳孔透气设计。可调节猫狗太阳帽，适合大型犬户外登山、散步遮阳。",
    "images": [
      "/images/products/帽子/hat_03.jpg"
    ],
    "min_group_size": 5,
    "stock": 100,
    "sold_count": 34,
    "is_active": 1,
    "specs": [],
    "wp_item_id": "",
    "created_at": "2026-06-06T17:02:13.383Z"
  },
  {
    "name": "迷你毕业帽2件套 - 黄色流苏宠物拍照道具",
    "category": "clothing",
    "price_original": 61.06,
    "price_group": 36.64,
    "description": "2件装迷你毕业帽搭配黄色流苏，可调节大小。宠物毕业季拍照道具，节日派对服装配饰，萌趣可爱。",
    "images": [
      "/images/products/帽子/hat_04.jpg"
    ],
    "min_group_size": 3,
    "stock": 100,
    "sold_count": 50,
    "is_active": 1,
    "specs": [],
    "wp_item_id": "",
    "created_at": "2026-06-06T17:02:13.383Z"
  },
  {
    "name": "带耳孔防晒棒球帽 - 粉色宠物户外登山帽（中号）",
    "category": "clothing",
    "price_original": 67.85,
    "price_group": 40.71,
    "description": "夏季户外防晒棒球帽，带耳孔设计透气不闷。适合小型和中型犬户外登山、散步使用。粉色甜美可爱。",
    "images": [
      "/images/products/帽子/hat_05.jpg"
    ],
    "min_group_size": 2,
    "stock": 100,
    "sold_count": 21,
    "is_active": 1,
    "specs": [],
    "wp_item_id": "",
    "created_at": "2026-06-06T17:02:13.383Z"
  },
  {
    "name": "PU皮革猫狗项圈带铃铛 - 桃红色",
    "category": "accessory",
    "price_original": 40.61,
    "price_group": 24.37,
    "description": "柔软PU皮革材质，可调节带扣设计，配备可爱铃铛。适合超小型犬和猫咪，桃红色甜美可爱。",
    "images": [
      "/images/products/项圈/collar_01.jpg"
    ],
    "min_group_size": 5,
    "stock": 100,
    "sold_count": 31,
    "is_active": 1,
    "specs": [],
    "wp_item_id": "",
    "created_at": "2026-06-06T17:02:13.383Z"
  },
  {
    "name": "Weewooday 6件装皮革猫项圈带铃铛 - 经典色套装",
    "category": "accessory",
    "price_original": 54.26,
    "price_group": 32.56,
    "description": "6条不同颜色的皮革项圈套装，每条都带有可爱铃铛。适合男孩女孩猫咪和小狗，性价比超高。",
    "images": [
      "/images/products/项圈/collar_02.jpg"
    ],
    "min_group_size": 4,
    "stock": 100,
    "sold_count": 40,
    "is_active": 1,
    "specs": [],
    "wp_item_id": "",
    "created_at": "2026-06-06T17:02:13.383Z"
  },
  {
    "name": "Guiding Star 红色皮革项圈带铃铛",
    "category": "accessory",
    "price_original": 47.47,
    "price_group": 28.48,
    "description": "经典红色皮革设计，配备小铃铛。适合小型至中型犬及猫咪，可调节长度15.7-25.4cm。",
    "images": [
      "/images/products/项圈/collar_03.jpg"
    ],
    "min_group_size": 3,
    "stock": 100,
    "sold_count": 41,
    "is_active": 1,
    "specs": [],
    "wp_item_id": "",
    "created_at": "2026-06-06T17:02:13.383Z"
  },
  {
    "name": "高级PU皮革珍珠蕾丝贝壳吊坠项圈 - 粉色",
    "category": "accessory",
    "price_original": 88.22,
    "price_group": 52.93,
    "description": "精美珍珠+蕾丝装饰，搭配贝壳吊坠，华丽公主风。PU皮革材质柔软舒适，可调节大小。",
    "images": [
      "/images/products/项圈/collar_04.jpg"
    ],
    "min_group_size": 4,
    "stock": 100,
    "sold_count": 37,
    "is_active": 1,
    "specs": [],
    "wp_item_id": "",
    "created_at": "2026-06-06T17:02:13.383Z"
  },
  {
    "name": "OOPSDOGGY 皮革AirTag猫项圈 - 深棕色",
    "category": "accessory",
    "price_original": 88.09,
    "price_group": 52.85,
    "description": "内置Apple AirTag支架，GPS定位追踪。皮革材质轻盈耐用，配备铃铛。非分离式设计更安全。",
    "images": [
      "/images/products/项圈/collar_05.jpg"
    ],
    "min_group_size": 2,
    "stock": 100,
    "sold_count": 29,
    "is_active": 1,
    "specs": [],
    "wp_item_id": "",
    "created_at": "2026-06-06T17:02:13.383Z"
  },
  {
    "name": "真牛皮柔软衬垫厚金扣宠物项圈 - 红色",
    "category": "accessory",
    "price_original": 47.4,
    "price_group": 28.44,
    "description": "真牛皮材质柔软触感，内衬保护宠物皮肤。厚实金色金属扣彰显质感，耐用不易断裂。",
    "images": [
      "/images/products/项圈/collar_06.jpg"
    ],
    "min_group_size": 5,
    "stock": 100,
    "sold_count": 47,
    "is_active": 1,
    "specs": [],
    "wp_item_id": "",
    "created_at": "2026-06-06T17:02:13.383Z"
  },
  {
    "name": "SLSON 可折叠宠物喂食碗2只装 - 粉绿配色",
    "category": "accessory",
    "price_original": 54.26,
    "price_group": 32.56,
    "description": "便携式可折叠设计，带防尘盖。仙女粉+发芽绿双色套装，外出旅行携带方便。适合宠物猫狗使用。",
    "images": [
      "/images/products/用品/supply_01.jpg"
    ],
    "min_group_size": 5,
    "stock": 100,
    "sold_count": 29,
    "is_active": 1,
    "specs": [],
    "wp_item_id": "",
    "created_at": "2026-06-06T17:02:13.383Z"
  },
  {
    "name": "骨干宠物收纳盒 - 爪骨印花薄荷绿",
    "category": "accessory",
    "price_original": 68.32,
    "price_group": 40.99,
    "description": "爪骨印花可爱设计，小长方形收纳盒。可存放宠物零食、玩具、牵引绳等用品，薄荷绿清新配色。",
    "images": [
      "/images/products/用品/supply_02.jpg"
    ],
    "min_group_size": 3,
    "stock": 100,
    "sold_count": 41,
    "is_active": 1,
    "specs": [],
    "wp_item_id": "",
    "created_at": "2026-06-06T17:02:13.383Z"
  },
  {
    "name": "Neater Feeder Express 防脏乱高架猫碗 - 灰色",
    "category": "accessory",
    "price_original": 203.68,
    "price_group": 122.21,
    "description": "防溢漏设计保持地面干净，高架碗体减少颈部压力。不锈钢餐盘易清洗，猫咪胡须友好设计。灰色时尚。",
    "images": [
      "/images/products/用品/supply_03.jpg"
    ],
    "min_group_size": 2,
    "stock": 100,
    "sold_count": 32,
    "is_active": 1,
    "specs": [],
    "wp_item_id": "",
    "created_at": "2026-06-06T17:02:13.383Z"
  },
  {
    "name": "陶瓷猫碗套装带木架 - 现代简约灰色双碟",
    "category": "accessory",
    "price_original": 122.18,
    "price_group": 73.31,
    "description": "现代简约陶瓷碗+实木支架，食品级陶瓷安全无毒。防滑底座稳固不倒，双碟设计食物和水分开。灰色高级感。",
    "images": [
      "/images/products/用品/supply_04.jpg"
    ],
    "min_group_size": 2,
    "stock": 100,
    "sold_count": 49,
    "is_active": 1,
    "specs": [],
    "wp_item_id": "",
    "created_at": "2026-06-06T17:02:13.383Z"
  },
  {
    "name": "Morpilot 柔软猫笼宠物背包 - 棕色",
    "category": "accessory",
    "price_original": 203.68,
    "price_group": 122.21,
    "description": "柔软可折叠猫笼，适合20磅以内中大型猫。带双面垫、安全搭扣和可折叠碗。也可作为小型犬背带使用。",
    "images": [
      "/images/products/用品/supply_05.jpg"
    ],
    "min_group_size": 3,
    "stock": 100,
    "sold_count": 39,
    "is_active": 1,
    "specs": [],
    "wp_item_id": "",
    "created_at": "2026-06-06T17:02:13.383Z"
  },
  {
    "name": "互动狗狗食物拼图慢速喂食器 - 鸭形零食分配器",
    "category": "food",
    "price_original": 95.01,
    "price_group": 57.01,
    "description": "鸭形可爱造型食物拼图玩具，慢速喂食防止噎食。益智训练+喂食二合一，适合中小型犬和猫咪使用。",
    "images": [
      "/images/products/食物/food_01.jpg"
    ],
    "min_group_size": 5,
    "stock": 100,
    "sold_count": 45,
    "is_active": 1,
    "specs": [],
    "wp_item_id": "",
    "created_at": "2026-06-06T17:02:13.383Z"
  },
  {
    "name": "Yummy Sam 2件套猫条喂食器挤压勺",
    "category": "food",
    "price_original": 33.89,
    "price_group": 20.33,
    "description": "猫条专用挤压勺，适用于湿粮、液体零食和果泥。方便喂食不脏手，也可用于小型宠物。2件套装。",
    "images": [
      "/images/products/食物/food_02.jpg"
    ],
    "min_group_size": 3,
    "stock": 100,
    "sold_count": 34,
    "is_active": 1,
    "specs": [],
    "wp_item_id": "",
    "created_at": "2026-06-06T17:02:13.383Z"
  },
  {
    "name": "狗狗零食密封玻璃容器罐 - 2.2夸脱一键式盖子",
    "category": "food",
    "price_original": 149.35,
    "price_group": 89.61,
    "description": "玻璃材质密封储存罐，一键式开盖方便取用。2.2夸脱大容量，保持狗粮猫粮零食新鲜干燥。厨房台面摆放美观。",
    "images": [
      "/images/products/食物/food_03.jpg"
    ],
    "min_group_size": 3,
    "stock": 100,
    "sold_count": 40,
    "is_active": 1,
    "specs": [],
    "wp_item_id": "",
    "created_at": "2026-06-06T17:02:13.383Z"
  },
  {
    "name": "互动鸭形食物拼图慢速喂食器 - 小型宠物版",
    "category": "food",
    "price_original": 40.68,
    "price_group": 24.41,
    "description": "迷你鸭形食物拼图，慢速喂食防止进食过快。适合小型猫狗和其他宠物，益智训练促进智力发展。",
    "images": [
      "/images/products/食物/food_04.jpg"
    ],
    "min_group_size": 4,
    "stock": 100,
    "sold_count": 41,
    "is_active": 1,
    "specs": [],
    "wp_item_id": "",
    "created_at": "2026-06-06T17:02:13.383Z"
  },
  {
    "name": "猫咪治疗勺+3个硅胶罐盖套装 - 多色",
    "category": "food",
    "price_original": 54.26,
    "price_group": 32.56,
    "description": "硅胶治疗喂食勺搭配3个通用罐盖，挤压式液体零食喂食器。不含双酚A，无浪费可舔设计。多色可选。",
    "images": [
      "/images/products/食物/food_05.jpg"
    ],
    "min_group_size": 2,
    "stock": 100,
    "sold_count": 40,
    "is_active": 1,
    "specs": [],
    "wp_item_id": "",
    "created_at": "2026-06-06T17:02:13.383Z"
  },
  {
    "name": "SZKOKUHO 9件装小狗吱吱叫玩具 - 多色可爱设计",
    "category": "toy",
    "price_original": 59.77,
    "price_group": 35.86,
    "description": "9只不同可爱造型的吱吱叫玩具套装，小巧易咬适合小型犬。多种颜色吸引宠物注意，消耗精力好帮手。",
    "images": [
      "/images/products/玩具/toy_01.jpg"
    ],
    "min_group_size": 2,
    "stock": 100,
    "sold_count": 48,
    "is_active": 1,
    "specs": [],
    "wp_item_id": "",
    "created_at": "2026-06-06T17:02:13.383Z"
  },
  {
    "name": "Aipper 25件装狗狗玩具套装 - 清洁牙齿+拔河+球",
    "category": "toy",
    "price_original": 109.95,
    "price_group": 65.97,
    "description": "25件超值套装：含吱吱毛绒玩具、清洁牙齿咀嚼玩具、拔河绳索玩具、发声球等。从幼犬到小型犬都适用。",
    "images": [
      "/images/products/玩具/toy_02.jpg"
    ],
    "min_group_size": 4,
    "stock": 100,
    "sold_count": 18,
    "is_active": 1,
    "specs": [],
    "wp_item_id": "",
    "created_at": "2026-06-06T17:02:13.383Z"
  },
  {
    "name": "Outward Hound 松鼠吱吱叫毛绒玩具 - 3件装",
    "category": "toy",
    "price_original": 85.1,
    "price_group": 51.06,
    "description": "经典松鼠造型毛绒吱吱叫玩具3件装，含隐藏松鼠替换件。Outward Hound品牌，适合小狗和成犬玩耍。",
    "images": [
      "/images/products/玩具/toy_03.jpg"
    ],
    "min_group_size": 3,
    "stock": 100,
    "sold_count": 11,
    "is_active": 1,
    "specs": [],
    "wp_item_id": "",
    "created_at": "2026-06-06T17:02:13.383Z"
  },
  {
    "name": "3件套彩色甜甜圈吱吱叫宠物玩具",
    "category": "toy",
    "price_original": 47.47,
    "price_group": 28.48,
    "description": "甜甜圈造型可爱设计，发声吱吱叫吸引宠物注意。3件套色彩缤纷，坚固耐咬适合小狗和猫咪咀嚼玩耍。",
    "images": [
      "/images/products/玩具/toy_04.jpg"
    ],
    "min_group_size": 5,
    "stock": 100,
    "sold_count": 47,
    "is_active": 1,
    "specs": [],
    "wp_item_id": "",
    "created_at": "2026-06-06T17:02:13.383Z"
  },
  {
    "name": "Multipet Lamb Chop 羊羔毛绒玩具 - 10英寸5个发声器",
    "category": "toy",
    "price_original": 60.99,
    "price_group": 36.59,
    "description": "经典Lamb Chop羊羔造型，超软毛绒材质适合拥抱和玩耍。内置5个发声器，奶油色10英寸。Multipet品牌热销款。",
    "images": [
      "/images/products/玩具/toy_05.jpg"
    ],
    "min_group_size": 5,
    "stock": 100,
    "sold_count": 48,
    "is_active": 1,
    "specs": [],
    "wp_item_id": "",
    "created_at": "2026-06-06T17:02:13.383Z"
  },
  {
    "name": "3合1宠物蒸汽美容刷 - 自清洁喷雾梳（蓝色）",
    "category": "grooming",
    "price_original": 135.76,
    "price_group": 81.46,
    "description": "蒸汽喷雾+梳毛+去浮毛三合一设计。自清洁功能方便打理，喷雾滋润毛发。适用于长毛宠物，附赠无水洗发水。",
    "images": [
      "/images/products/洗护/grooming_01.jpg"
    ],
    "min_group_size": 5,
    "stock": 100,
    "sold_count": 28,
    "is_active": 1,
    "specs": [],
    "wp_item_id": "",
    "created_at": "2026-06-06T17:02:13.383Z"
  },
  {
    "name": "Augwind 6件套宠物美容沐浴套装 - 海军蓝",
    "category": "grooming",
    "price_original": 67.71,
    "price_group": 40.63,
    "description": "6件套沐浴美容工具：清洗手套+清洁手套+沐浴刷+洗发刷等。一套搞定全部洗护需求，适合狗猫马通用。",
    "images": [
      "/images/products/洗护/grooming_02.jpg"
    ],
    "min_group_size": 4,
    "stock": 100,
    "sold_count": 30,
    "is_active": 1,
    "specs": [],
    "wp_item_id": "",
    "created_at": "2026-06-06T17:02:13.383Z"
  },
  {
    "name": "Bodhi 狗狗洗发沐浴刷 - 蓝色",
    "category": "grooming",
    "price_original": 67.85,
    "price_group": 40.71,
    "description": "Bodhi品牌高级沐浴洗涤器，适用于长毛和短毛宠物。淋浴、沐浴和按摩三用，柔软硅胶触感舒适。",
    "images": [
      "/images/products/洗护/grooming_03.jpg"
    ],
    "min_group_size": 2,
    "stock": 100,
    "sold_count": 32,
    "is_active": 1,
    "specs": [],
    "wp_item_id": "",
    "created_at": "2026-06-06T17:02:13.383Z"
  },
  {
    "name": "宠物沐浴按摩清洁刷 - 蓝色软胶",
    "category": "grooming",
    "price_original": 26.15,
    "price_group": 15.69,
    "description": "柔软硅胶按摩刷，洗澡时边清洁边按摩。舒适触感让宠物享受沐浴过程，去浮毛效果好。蓝色简约设计。",
    "images": [
      "/images/products/洗护/grooming_04.jpg"
    ],
    "min_group_size": 3,
    "stock": 100,
    "sold_count": 41,
    "is_active": 1,
    "specs": [],
    "wp_item_id": "",
    "created_at": "2026-06-06T17:02:13.383Z"
  },
  {
    "name": "2026新款宠物蒸汽美容梳 - 冷雾去浮毛",
    "category": "grooming",
    "price_original": 135.76,
    "price_group": 81.46,
    "description": "2026年新款冷雾蒸汽梳，温和软化毛发减少静电。去浮毛、柔顺光滑一步到位。帮助不喜欢洗澡的宠物轻松护理。附赠无水洗发水。",
    "images": [
      "/images/products/洗护/grooming_05.jpg"
    ],
    "min_group_size": 5,
    "stock": 100,
    "sold_count": 28,
    "is_active": 1,
    "specs": [],
    "wp_item_id": "",
    "created_at": "2026-06-06T17:02:13.383Z"
  }
];

exports.main = async (event, context) => {
  const coll = db.collection('gb_product');

  // 先清空已有数据
  try {
    const existing = await coll.get();
    for (const doc of existing.data) {
      await coll.doc(doc._id).remove();
    }
    console.log('已清空 ' + existing.data.length + ' 条旧数据');
  } catch (e) {
    console.log('清空旧数据失败（集合可能不存在）:', e.message);
  }

  // 批量写入
  const results = [];
  for (const item of SEED_DATA) {
    try {
      const res = await coll.add({ data: item });
      results.push({ id: res._id, name: item.name });
    } catch (e) {
      results.push({ error: e.message, name: item.name });
    }
  }

  return {
    code: 1,
    data: {
      total: results.length,
      succeeded: results.filter(r => r.id).length,
      failed: results.filter(r => r.error).length,
      results
    }
  };
};
