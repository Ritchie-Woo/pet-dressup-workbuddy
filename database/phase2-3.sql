-- ============================================================
-- pet-wb 数据库迁移脚本 (Phase 1.5 / Phase 2)
-- #2 穿搭 / #5 团购 / #3 地图 / #4 MBTI
--
-- 引擎: InnoDB | 字符集: utf8mb4 | 排序: utf8mb4_unicode_ci
-- 目标: 微信云开发 MySQL (CloudBase)
--
-- 重要约束：
-- - 每个模块独立建表，表前缀隔离（wp_ / gb_ / mp_ / mbti_）
-- - 模块间不使用物理外键，逻辑关联在 README 中注明
-- - 跨模块数据通过 API/事件通信，不直接读写对方表
-- ============================================================

-- ============================================================
-- #2 2D桌宠穿搭 (wp_) — 核心体验引擎
-- ============================================================

-- 桌宠形象表
CREATE TABLE IF NOT EXISTS wp_avatar (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    pet_id          BIGINT NOT NULL COMMENT '关联 common_pet.id（共享层）',
    user_id         BIGINT NOT NULL COMMENT '关联 common_user.id（冗余，加速查询）',
    base_appearance JSON NOT NULL COMMENT '基础形象配置，示例: {"species":"cat","breed":"英短","color":"blue"}',
    current_outfit  JSON DEFAULT NULL COMMENT '当前穿搭快照，示例: {"hat":"item_001","top":"item_002","accessory":null,"collar":"item_005"}',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_pet (pet_id),
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='桌宠形象表（#2 穿搭模块）';

-- 服饰道具表
CREATE TABLE IF NOT EXISTS wp_item (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    name            VARCHAR(64) NOT NULL COMMENT '服饰名称',
    category        VARCHAR(16) NOT NULL COMMENT '部件分类: hat/top/bottom/accessory/collar',
    thumbnail_url   VARCHAR(512) DEFAULT NULL COMMENT '缩略图',
    resource_url    VARCHAR(512) DEFAULT NULL COMMENT '2D 资源文件 (PNG/SVG)',
    rarity          VARCHAR(16) DEFAULT 'common' COMMENT '稀有度: common/rare/epic/legendary',
    source          VARCHAR(16) DEFAULT 'free' COMMENT '来源: free/group_buy/event/premium',
    group_buy_id    BIGINT DEFAULT NULL COMMENT '关联 gb_product.id（来源为 group_buy 时）',
    is_active       TINYINT DEFAULT 1 COMMENT '是否上架',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='服饰道具表（#2 穿搭模块）';

-- 用户服饰拥有表
CREATE TABLE IF NOT EXISTS wp_user_item (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id         BIGINT NOT NULL COMMENT '关联 common_user.id',
    item_id         BIGINT NOT NULL COMMENT '关联 wp_item.id',
    obtained_at     DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '获得时间',
    INDEX idx_user (user_id),
    INDEX idx_item (item_id),
    UNIQUE KEY uk_user_item (user_id, item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户服饰拥有表（#2 穿搭模块）';

-- 穿搭方案表
CREATE TABLE IF NOT EXISTS wp_outfit (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id         BIGINT NOT NULL COMMENT '关联 common_user.id',
    avatar_id       BIGINT NOT NULL COMMENT '关联 wp_avatar.id',
    name            VARCHAR(32) DEFAULT NULL COMMENT '方案名称，如"出门装"',
    slots           JSON NOT NULL COMMENT '穿搭槽位，示例: {"hat":"item_001","top":"item_002","bottom":null,"accessory":null,"collar":"item_005"}',
    is_current      TINYINT DEFAULT 0 COMMENT '是否当前穿搭',
    like_count      INT DEFAULT 0 COMMENT '点赞数',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_avatar (avatar_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='穿搭方案表（#2 穿搭模块）';

-- ============================================================
-- #5 宠物用品团购 (gb_) — 变现引擎
-- ============================================================

-- 团购商品表
CREATE TABLE IF NOT EXISTS gb_product (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    name            VARCHAR(128) NOT NULL COMMENT '商品名称',
    description     TEXT DEFAULT NULL COMMENT '商品描述',
    category        VARCHAR(32) DEFAULT NULL COMMENT '品类: food/toy/clothing/accessory/grooming',
    price_original  DECIMAL(10,2) NOT NULL COMMENT '原价',
    price_group     DECIMAL(10,2) NOT NULL COMMENT '团购价',
    images          JSON DEFAULT NULL COMMENT '商品图片数组，示例: ["https://cdn.example.com/img1.jpg","https://cdn.example.com/img2.jpg"]',
    specs           JSON DEFAULT NULL COMMENT '规格，示例: [{"name":"颜色","options":["红","蓝"]},{"name":"尺寸","options":["S","M","L"]}]',
    stock           INT DEFAULT 0 COMMENT '库存',
    min_group_size  INT DEFAULT 2 COMMENT '成团人数',
    sold_count      INT DEFAULT 0 COMMENT '已售数',
    wp_item_id      BIGINT DEFAULT NULL COMMENT '关联 wp_item.id（购买后解锁的2D服饰）',
    is_active       TINYINT DEFAULT 1 COMMENT '是否上架',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='团购商品表（#5 团购模块）';

-- 团购订单表
CREATE TABLE IF NOT EXISTS gb_order (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id         BIGINT NOT NULL COMMENT '关联 common_user.id',
    product_id      BIGINT NOT NULL COMMENT '关联 gb_product.id',
    spec_choice     JSON DEFAULT NULL COMMENT '用户选择的规格，示例: {"颜色":"红","尺寸":"M"}',
    quantity        INT DEFAULT 1 COMMENT '购买数量',
    amount_total    DECIMAL(10,2) NOT NULL COMMENT '实付金额',
    status          VARCHAR(16) DEFAULT 'pending' COMMENT '订单状态: pending/paid/shipped/completed/refunded',
    address_id      BIGINT DEFAULT NULL COMMENT '关联 common_address.id',
    tracking_no     VARCHAR(64) DEFAULT NULL COMMENT '快递单号',
    wp_item_added   TINYINT DEFAULT 0 COMMENT '是否已添加2D服饰（幂等标记）',
    paid_at         DATETIME DEFAULT NULL,
    shipped_at      DATETIME DEFAULT NULL,
    completed_at    DATETIME DEFAULT NULL,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_product (product_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='团购订单表（#5 团购模块）';

-- 团购进度表
CREATE TABLE IF NOT EXISTS gb_progress (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    product_id      BIGINT NOT NULL COMMENT '关联 gb_product.id',
    batch_no        VARCHAR(32) DEFAULT NULL COMMENT '团购批次号（支持多轮团购）',
    current_count   INT DEFAULT 1 COMMENT '当前参团人数',
    target_count    INT NOT NULL COMMENT '成团目标',
    status          VARCHAR(16) DEFAULT 'ongoing' COMMENT '团购状态: ongoing/success/failed',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_product (product_id),
    INDEX idx_batch (batch_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='团购进度表（#5 团购模块）';

-- ============================================================
-- #3 宠物友好地图 (mp_) — 地理层
-- ============================================================

-- 宠物友好地点表
CREATE TABLE IF NOT EXISTS mp_place (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    name            VARCHAR(128) NOT NULL COMMENT '地点名称',
    category        VARCHAR(32) NOT NULL COMMENT '分类: restaurant/cafe/park/pet_store/hospital/hotel/other',
    address         VARCHAR(256) DEFAULT NULL COMMENT '详细地址',
    latitude        DECIMAL(10,7) NOT NULL COMMENT '纬度',
    longitude       DECIMAL(10,7) NOT NULL COMMENT '经度',
    phone           VARCHAR(20) DEFAULT NULL COMMENT '电话',
    business_hours  VARCHAR(128) DEFAULT NULL COMMENT '营业时间（自由文本，如"09:00-22:00"）',
    pet_policy      TEXT DEFAULT NULL COMMENT '宠物政策说明（如"允许小型犬，需牵绳"）',
    images          JSON DEFAULT NULL COMMENT '地点照片数组，示例: ["https://cdn.example.com/place1.jpg"]',
    rating          DECIMAL(2,1) DEFAULT 0 COMMENT '评分 (0.0-5.0)',
    review_count    INT DEFAULT 0 COMMENT '评价数',
    source          VARCHAR(16) DEFAULT 'official' COMMENT '数据来源: official/user_submitted',
    status          VARCHAR(16) DEFAULT 'approved' COMMENT '审核状态: pending/approved/rejected',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_location (latitude, longitude),
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='宠物友好地点表（#3 地图模块）';

-- 用户收藏地点表
CREATE TABLE IF NOT EXISTS mp_favorite (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id         BIGINT NOT NULL COMMENT '关联 common_user.id',
    place_id        BIGINT NOT NULL COMMENT '关联 mp_place.id',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    UNIQUE KEY uk_user_place (user_id, place_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户收藏地点表（#3 地图模块）';

-- 宠物打卡记录表
CREATE TABLE IF NOT EXISTS mp_checkin (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id         BIGINT NOT NULL COMMENT '关联 common_user.id',
    pet_id          BIGINT NOT NULL COMMENT '关联 common_pet.id',
    place_id        BIGINT NOT NULL COMMENT '关联 mp_place.id',
    avatar_snapshot VARCHAR(512) DEFAULT NULL COMMENT '打卡时的2D形象快照URL（通过#2接口获取）',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_place (place_id),
    INDEX idx_user (user_id),
    INDEX idx_pet (pet_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='宠物打卡记录表（#3 地图模块）';

-- 地点评价表
CREATE TABLE IF NOT EXISTS mp_review (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id         BIGINT NOT NULL COMMENT '关联 common_user.id',
    place_id        BIGINT NOT NULL COMMENT '关联 mp_place.id',
    rating          TINYINT NOT NULL COMMENT '评分 1-5',
    content         TEXT DEFAULT NULL COMMENT '评价内容',
    images          JSON DEFAULT NULL COMMENT '评价图片数组',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_place (place_id),
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='地点评价表（#3 地图模块）';

-- ============================================================
-- #4 宠物 MBTI (mbti_) — 社交钩子层
-- ============================================================

-- MBTI 测试记录表
CREATE TABLE IF NOT EXISTS mbti_test (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    pet_id          BIGINT NOT NULL COMMENT '关联 common_pet.id',
    user_id         BIGINT NOT NULL COMMENT '关联 common_user.id',
    e_score         TINYINT NOT NULL COMMENT 'E 维度得分 (0-100)',
    i_score         TINYINT NOT NULL COMMENT 'I 维度得分 (0-100)',
    s_score         TINYINT NOT NULL COMMENT 'S 维度得分 (0-100)',
    n_score         TINYINT NOT NULL COMMENT 'N 维度得分 (0-100)',
    t_score         TINYINT NOT NULL COMMENT 'T 维度得分 (0-100)',
    f_score         TINYINT NOT NULL COMMENT 'F 维度得分 (0-100)',
    j_score         TINYINT NOT NULL COMMENT 'J 维度得分 (0-100)',
    p_score         TINYINT NOT NULL COMMENT 'P 维度得分 (0-100)',
    result_type     VARCHAR(4) NOT NULL COMMENT '结果类型（如 "INTJ"）',
    answers         JSON NOT NULL COMMENT '答题记录，示例: [{"questionId":1,"choice":"A"},{"questionId":2,"choice":"B"}]',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_pet (pet_id),
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='MBTI 测试记录表（#4 MBTI 模块）';

-- 宠物当前 MBTI 标签表
CREATE TABLE IF NOT EXISTS mbti_label (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    pet_id          BIGINT NOT NULL COMMENT '关联 common_pet.id',
    user_id         BIGINT NOT NULL COMMENT '关联 common_user.id',
    type_code       VARCHAR(4) NOT NULL COMMENT '当前类型（如 "INTJ"）',
    type_name       VARCHAR(32) NOT NULL COMMENT '类型名称（如 "哲学家型"）',
    last_test_id    BIGINT NOT NULL COMMENT '关联最新测试记录 mbti_test.id',
    is_visible      TINYINT DEFAULT 1 COMMENT '是否公开标签',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_pet (pet_id),
    UNIQUE KEY uk_pet (pet_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='宠物MBTI标签表（#4 MBTI 模块）';

-- 标签匹配关系表（静态数据，预填充）
CREATE TABLE IF NOT EXISTS mbti_match (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    type_a          VARCHAR(4) NOT NULL COMMENT '类型 A（如 "INTJ"）',
    type_b          VARCHAR(4) NOT NULL COMMENT '类型 B（如 "ENFP"）',
    match_name      VARCHAR(32) DEFAULT NULL COMMENT '匹配名称（如 "最佳玩伴"）',
    match_desc      TEXT DEFAULT NULL COMMENT '匹配描述',
    compatibility   TINYINT NOT NULL COMMENT '兼容度 1-100',
    UNIQUE KEY uk_pair (type_a, type_b)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='标签匹配关系表（#4 MBTI 模块，静态数据）';
