/**
 * 全局常量定义
 */

// 宠物物种
const SPECIES = {
  DOG: 'dog',
  CAT: 'cat',
  RABBIT: 'rabbit',
  OTHER: 'other'
};

const SPECIES_LABELS = {
  dog: '狗狗',
  cat: '猫猫',
  rabbit: '兔兔',
  other: '其他'
};

// 宠物性别
const GENDER = {
  MALE: 'male',
  FEMALE: 'female',
  UNKNOWN: 'unknown'
};

const GENDER_LABELS = {
  male: '公',
  female: '母',
  unknown: '未知'
};

// 服饰部件分类
const ITEM_CATEGORY = {
  HAT: 'hat',
  TOP: 'top',
  BOTTOM: 'bottom',
  ACCESSORY: 'accessory',
  COLLAR: 'collar'
};

const ITEM_CATEGORY_LABELS = {
  hat: '帽子',
  top: '上衣',
  bottom: '下装',
  accessory: '配饰',
  collar: '项圈'
};

// 服饰稀有度
const ITEM_RARITY = {
  COMMON: 'common',
  RARE: 'rare',
  EPIC: 'epic',
  LEGENDARY: 'legendary'
};

const ITEM_RARITY_LABELS = {
  common: '普通',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说'
};

// 服饰来源
const ITEM_SOURCE = {
  FREE: 'free',
  GROUP_BUY: 'group_buy',
  EVENT: 'event',
  PREMIUM: 'premium'
};

// 团购品类
const PRODUCT_CATEGORY = {
  FOOD: 'food',
  TOY: 'toy',
  CLOTHING: 'clothing',
  ACCESSORY: 'accessory',
  GROOMING: 'grooming'
};

const PRODUCT_CATEGORY_LABELS = {
  food: '食品',
  toy: '玩具',
  clothing: '服饰',
  accessory: '配饰',
  grooming: '洗护'
};

// 订单状态
const ORDER_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  SHIPPED: 'shipped',
  COMPLETED: 'completed',
  REFUNDED: 'refunded'
};

const ORDER_STATUS_LABELS = {
  pending: '待支付',
  paid: '已支付',
  shipped: '已发货',
  completed: '已完成',
  refunded: '已退款'
};

// 地图地点分类
const PLACE_CATEGORY = {
  MALL: 'mall',
  RESTAURANT: 'restaurant',
  PARK: 'park',
  HOTEL: 'hotel',
  ADOPTION: 'adoption',
  OTHER: 'other'
};

const PLACE_CATEGORY_LABELS = {
  mall: '商场',
  restaurant: '餐厅',
  park: '公园',
  hotel: '酒店',
  adoption: '领养',
  other: '其他'
};

// MBTI 维度
const MBTI_DIMENSIONS = [
  { key: 'EI', label: '能量来源', left: '外向 E', right: '内向 I' },
  { key: 'SN', label: '信息获取', left: '实感 S', right: '直觉 N' },
  { key: 'TF', label: '判断方式', left: '理性 T', right: '感性 F' },
  { key: 'JP', label: '生活态度', left: '计划 J', right: '随性 P' }
];

// 页面路径常量
const PAGES = {
  LOGIN: '/common/login/index',
  PET_LIST: '/common/pet/list/index',
  PET_CREATE: '/common/pet/create/index',
  PET_DETAIL: '/common/pet/detail/index',
  ADDRESS_LIST: '/common/address/list/index',
  ADDRESS_EDIT: '/common/address/edit/index',
  WP_DRESS: '/wp/dressup/index',
  WP_AVATAR: '/wp/avatar/index',
  WP_SHARE: '/wp/share/index',
  GB_LIST: '/gb/list/index',
  GB_DETAIL: '/gb/detail/index',
  GB_ORDER_LIST: '/gb/order/list',
  GB_ORDER_DETAIL: '/gb/order/detail',
  MP_MAP: '/mp/map/index',
  MP_PLACE: '/mp/place/index',
  MP_CHECKIN: '/mp/checkin/index',
  MBTI_TEST: '/mbti/test/index',
  MBTI_CARD: '/mbti/card/index',
  MY: '/my/index'
};

module.exports = {
  SPECIES,
  SPECIES_LABELS,
  GENDER,
  GENDER_LABELS,
  ITEM_CATEGORY,
  ITEM_CATEGORY_LABELS,
  ITEM_RARITY,
  ITEM_RARITY_LABELS,
  ITEM_SOURCE,
  PRODUCT_CATEGORY,
  PRODUCT_CATEGORY_LABELS,
  ORDER_STATUS,
  ORDER_STATUS_LABELS,
  PLACE_CATEGORY,
  PLACE_CATEGORY_LABELS,
  MBTI_DIMENSIONS,
  PAGES
};
