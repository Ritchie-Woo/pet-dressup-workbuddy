-- ============================================================
-- pet-wb 数据库初始化脚本 (Phase 1)
-- 共享层 + 系统配置
-- 
-- 引擎: InnoDB | 字符集: utf8mb4 | 排序: utf8mb4_unicode_ci
-- 目标: 微信云开发 MySQL (CloudBase)
-- ============================================================

-- ============================================================
-- 共享层：用户体系 + 支付 + 宠物基础档案
-- 注意：共享层表可被所有模块读取，是唯一跨模块数据层
-- ============================================================

-- 用户表
CREATE TABLE IF NOT EXISTS common_user (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    openid          VARCHAR(64) NOT NULL,
    unionid         VARCHAR(64) DEFAULT NULL,
    nickname        VARCHAR(64) DEFAULT NULL COMMENT '微信昵称',
    avatar_url      VARCHAR(512) DEFAULT NULL COMMENT '微信头像',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_openid (openid),
    UNIQUE KEY uk_unionid (unionid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表（共享层）';

-- 宠物档案表
CREATE TABLE IF NOT EXISTS common_pet (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id         BIGINT NOT NULL COMMENT '关联 common_user.id',
    name            VARCHAR(32) NOT NULL COMMENT '宠物名',
    species         VARCHAR(16) NOT NULL COMMENT '物种: dog/cat/rabbit/other',
    breed           VARCHAR(64) DEFAULT NULL COMMENT '品种（如"英短"）',
    gender          VARCHAR(8) DEFAULT 'unknown' COMMENT '性别: male/female/unknown',
    birthday        DATE DEFAULT NULL COMMENT '生日',
    avatar_url      VARCHAR(512) DEFAULT NULL COMMENT '头像图',
    is_active       TINYINT DEFAULT 1 COMMENT '是否启用（软删除）',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='宠物档案表（共享层）';

-- 用户地址表
CREATE TABLE IF NOT EXISTS common_address (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id         BIGINT NOT NULL COMMENT '关联 common_user.id',
    receiver_name   VARCHAR(32) NOT NULL COMMENT '收货人',
    phone           VARCHAR(20) NOT NULL COMMENT '电话',
    province        VARCHAR(32) DEFAULT NULL COMMENT '省',
    city            VARCHAR(32) DEFAULT NULL COMMENT '市',
    district        VARCHAR(32) DEFAULT NULL COMMENT '区',
    detail          VARCHAR(256) DEFAULT NULL COMMENT '详细地址',
    is_default      TINYINT DEFAULT 0 COMMENT '是否默认地址',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户地址表（共享层，供#5团购使用）';

-- ============================================================
-- 系统配置层
-- ============================================================

-- Feature Flag 配置表
CREATE TABLE IF NOT EXISTS sys_feature_flag (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    flag_key        VARCHAR(64) NOT NULL COMMENT '功能开关标识',
    flag_value      TINYINT DEFAULT 0 COMMENT '0=关闭 1=开启',
    description     VARCHAR(256) DEFAULT NULL COMMENT '功能说明',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_flag_key (flag_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Feature Flag 配置表';

-- 插入初始 Feature Flag 数据（参考 PRD 4.3.1 节）
INSERT INTO sys_feature_flag (flag_key, flag_value, description) VALUES
    ('module_wp_enabled',    1, '#2 穿搭模块总开关'),
    ('module_gb_enabled',    1, '#5 团购模块总开关'),
    ('module_mp_enabled',    0, '#3 地图模块总开关'),
    ('module_mbti_enabled',  0, '#4 MBTI 模块总开关'),
    ('mbti_social_mode',     0, '地图标签社交模式（依赖 module_mbti_enabled=1）'),
    ('wp_share_enabled',     1, '穿搭分享功能开关'),
    ('gb_checkout_enabled',  1, '团购下单功能开关'),
    ('mp_checkin_enabled',   0, '地图打卡功能开关')
ON DUPLICATE KEY UPDATE description = VALUES(description);
