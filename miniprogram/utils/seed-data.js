/**
 * 种子数据 - 宠物用品拼团商品 & 订单模拟
 * 用于开发调试和演示
 */

/** 宠物商品种子数据 (7个商品) */
const SEED_PRODUCTS = [
  {
    id: 'prod-001',
    name: '皇家猫粮 室内成猫粮 2kg',
    price: 158,
    originalPrice: 198,
    image: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=600&h=600&fit=crop',
    groupPrice: 118,
    minGroupSize: 3,
    currentGroupSize: 1,
    description: '专为室内成猫设计，含易消化蛋白质和适量纤维，帮助控制毛球。添加Omega-3脂肪酸保持皮肤毛发健康。',
    category: 'food',
    tags: ['热卖', '猫粮'],
    soldCount: 1234,
    rating: 4.9,
    images: [
      'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1574104351253-bf2935fed409?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1606185540834-d65e8cd3e0ce?w=800&h=800&fit=crop'
    ],
    participants: [
      { avatar: 'https://i.pravatar.cc/80?img=1', name: '小**咪' },
      { avatar: 'https://i.pravatar.cc/80?img=5', name: '可**乐' }
    ]
  },
  {
    id: 'prod-002',
    name: '比瑞吉天然犬粮 小型犬专用 1.5kg',
    price: 128,
    originalPrice: 168,
    image: 'https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?w=600&h=600&fit=crop',
    groupPrice: 89,
    minGroupSize: 3,
    currentGroupSize: 2,
    description: '专为小型犬研发的天然粮，含优质鸡肉和糙米，添加益生菌促进消化。无人工色素和防腐剂。',
    category: 'food',
    tags: ['狗粮', '天然粮'],
    soldCount: 856,
    rating: 4.7,
    images: [
      'https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800&h=800&fit=crop'
    ],
    participants: [
      { avatar: 'https://i.pravatar.cc/80?img=8', name: '旺**饭' }
    ]
  },
  {
    id: 'prod-003',
    name: '宠物智能饮水机 循环过滤 2L',
    price: 199,
    originalPrice: 269,
    image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600&h=600&fit=crop',
    groupPrice: 149,
    minGroupSize: 2,
    currentGroupSize: 1,
    description: '四重过滤系统，去除毛发和杂质。2L大容量，静音水泵设计。水面发光便于夜间饮用。USB供电安全节能。',
    category: 'supplies',
    tags: ['智能设备', '饮水'],
    soldCount: 2103,
    rating: 4.8,
    images: [
      'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1583512603805-3cc6b41f3edb?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1601758125946-6ec2ef64daf8?w=800&h=800&fit=crop'
    ],
    participants: [
      { avatar: 'https://i.pravatar.cc/80?img=12', name: '饼**干' },
      { avatar: 'https://i.pravatar.cc/80?img=16', name: '团**子' }
    ]
  },
  {
    id: 'prod-004',
    name: '猫抓板 瓦楞纸 大号L型 耐磨',
    price: 49,
    originalPrice: 69,
    image: 'https://images.unsplash.com/photo-1545249390-6bdfa286032f?w=600&h=600&fit=crop',
    groupPrice: 35,
    minGroupSize: 3,
    currentGroupSize: 3,
    description: '高强度瓦楞纸材质，双面可用耐磨耐抓。L型设计贴合墙角，节省空间。内含猫薄荷增加趣味性。',
    category: 'toys',
    tags: ['已成团', '猫玩具'],
    soldCount: 4567,
    rating: 4.6,
    images: [
      'https://images.unsplash.com/photo-1545249390-6bdfa286032f?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&h=800&fit=crop'
    ],
    participants: [
      { avatar: 'https://i.pravatar.cc/80?img=20', name: '花**喵' },
      { avatar: 'https://i.pravatar.cc/80?img=24', name: '橘**长' },
      { avatar: 'https://i.pravatar.cc/80?img=28', name: '奶**茶' }
    ]
  },
  {
    id: 'prod-005',
    name: '宠物沙发窝 可拆洗 保暖深睡窝 M号',
    price: 138,
    originalPrice: 188,
    image: 'https://images.unsplash.com/photo-1541599468348-6480b13555a2?w=600&h=600&fit=crop',
    groupPrice: 99,
    minGroupSize: 2,
    currentGroupSize: 1,
    description: '高回弹海绵填充，四周环绕包裹设计给宠物安全感。表面水晶绒面料柔软亲肤，底部防滑颗粒。全可拆洗设计。',
    category: 'supplies',
    tags: ['热卖', '宠物窝'],
    soldCount: 1890,
    rating: 4.8,
    images: [
      'https://images.unsplash.com/photo-1541599468348-6480b13555a2?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1601758124510-52d02ddb7cbd?w=800&h=800&fit=crop'
    ],
    participants: [
      { avatar: 'https://i.pravatar.cc/80?img=32', name: '豆**豆' }
    ]
  },
  {
    id: 'prod-006',
    name: '顽皮猫零食 金枪鱼猫条 30支装',
    price: 39,
    originalPrice: 55,
    image: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=600&h=600&fit=crop',
    groupPrice: 25,
    minGroupSize: 3,
    currentGroupSize: 2,
    description: '100%真金枪鱼肉制作，无添加淀粉。独立小包装方便喂食，补水美毛双效合一。适口性极佳。',
    category: 'food',
    tags: ['零食', '猫条'],
    soldCount: 6723,
    rating: 4.9,
    images: [
      'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1612548403247-aa2873e9422d?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1626784215021-2e39ccf971cd?w=800&h=800&fit=crop'
    ],
    participants: [
      { avatar: 'https://i.pravatar.cc/80?img=36', name: '芋**喵' }
    ]
  },
  {
    id: 'prod-007',
    name: '狗狗磨牙棒 牛肉味 中大型犬 6支装',
    price: 45,
    originalPrice: 62,
    image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=600&h=600&fit=crop',
    groupPrice: 32,
    minGroupSize: 2,
    currentGroupSize: 1,
    description: '天然牛皮加牛肉风味，耐咬耐啃，有效清洁牙齿去除牙垢。适合中大型犬日常磨牙解闷。',
    category: 'food',
    tags: ['新品', '磨牙棒'],
    soldCount: 2341,
    rating: 4.7,
    images: [
      'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1601758125946-6ec2ef64daf8?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?w=800&h=800&fit=crop'
    ],
    participants: [
      { avatar: 'https://i.pravatar.cc/80?img=40', name: '雪**糕' }
    ]
  }
];

/** 订单模拟数据 (5条，不同状态) */
const SEED_ORDERS = [
  {
    orderId: 'GB20240101001',
    productId: 'prod-001',
    productName: '皇家猫粮 室内成猫粮 2kg',
    productThumbnail: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=200&h=200&fit=crop',
    quantity: 1,
    amountTotal: 118,
    status: 'pending',
    specChoiceText: '2kg装',
    createdAt: '2024-01-15 14:30',
    expireAt: '2024-01-15 15:00'
  },
  {
    orderId: 'GB20240101002',
    productId: 'prod-003',
    productName: '宠物智能饮水机 循环过滤 2L',
    productThumbnail: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=200&h=200&fit=crop',
    quantity: 1,
    amountTotal: 149,
    status: 'paid',
    specChoiceText: '白色/2L',
    createdAt: '2024-01-14 10:20',
    paidAt: '2024-01-14 10:25',
    trackingNo: ''
  },
  {
    orderId: 'GB20240101003',
    productId: 'prod-004',
    productName: '猫抓板 瓦楞纸 大号L型 耐磨',
    productThumbnail: 'https://images.unsplash.com/photo-1545249390-6bdfa286032f?w=200&h=200&fit=crop',
    quantity: 2,
    amountTotal: 70,
    status: 'shipped',
    specChoiceText: 'L型/含猫薄荷',
    createdAt: '2024-01-12 16:45',
    paidAt: '2024-01-12 16:50',
    shippedAt: '2024-01-13 09:30',
    trackingNo: 'SF1234567890'
  },
  {
    orderId: 'GB20240101004',
    productId: 'prod-005',
    productName: '宠物沙发窝 可拆洗 保暖深睡窝 M号',
    productThumbnail: 'https://images.unsplash.com/photo-1541599468348-6480b13555a2?w=200&h=200&fit=crop',
    quantity: 1,
    amountTotal: 99,
    status: 'completed',
    specChoiceText: 'M号/灰色',
    createdAt: '2024-01-08 20:00',
    paidAt: '2024-01-08 20:05',
    shippedAt: '2024-01-09 14:00',
    completedAt: '2024-01-11 10:30',
    trackingNo: 'YT0987654321'
  },
  {
    orderId: 'GB20240101005',
    productId: 'prod-006',
    productName: '顽皮猫零食 金枪鱼猫条 30支装',
    productThumbnail: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=200&h=200&fit=crop',
    quantity: 3,
    amountTotal: 75,
    status: 'refunded',
    specChoiceText: '金枪鱼味',
    createdAt: '2024-01-10 11:00',
    paidAt: '2024-01-10 11:02',
    refundedAt: '2024-01-11 15:00'
  }
];

module.exports = {
  SEED_PRODUCTS,
  SEED_ORDERS
};
