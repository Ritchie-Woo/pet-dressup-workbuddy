# pet-wb 四模块产品需求文档（PRD）

> **版本**：v1.0  
> **日期**：2026年6月5日  
> **作者**：pet-wb 产品经理  
> **约束**：OPC（One Person Company）— 单人开发，串行推进，粒子性架构

---

## 目录

1. [产品概述](#一产品概述)
2. [用户画像](#二用户画像)
3. [模块详细需求](#三模块详细需求)
   - [共享层：用户体系 + 支付 + 宠物基础档案](#31-共享层用户体系--支付--宠物基础档案)
   - [#2 2D桌宠穿搭](#32-2-2d桌宠穿搭-phase-1-p0)
   - [#5 宠物用品团购](#33-5-宠物用品团购-phase-1-p0)
   - [#3 宠物友好地图](#34-3-宠物友好地图-phase-15-独立可交付)
   - [#4 宠物 MBTI](#35-4-宠物-mbti-phase-2-尽力而为)
4. [粒子性架构设计](#四粒子性架构设计)
5. [MVP Phase 1 计划](#五mvp-phase-1-计划)
6. [降级路径](#六降级路径)

---

## 一、产品概述

### 1.1 一句话产品定位

**「给宠物穿搭、给主人团购」— 以 2D 虚拟桌宠穿搭为核心体验、以宠物用品团购为变现闭环的养成+消费双引擎小程序。**

### 1.2 核心差异化

| 维度 | 竞品现状 | pet-wb 差异化 |
|------|---------|-------------|
| 桌宠体验 | 虚拟宠物游戏（会说话的汤姆猫等）偏纯娱乐 | **穿搭换装为核心**，服饰可购买实体同款 |
| 宠物电商 | 淘宝/拼多多宠物频道，纯货架 | **团购价 + 虚拟穿搭预览**，买前先看效果 |
| 社交钩子 | 宠物社区偏晒图 | **MBTI 性格标签**，标签匹配而非传统社交 |
| 地理层 | 美团/点评的地图 | **宠物友好地图**，专门标注允许宠物进入的场所 |

### 1.3 产品愿景

```
用户创建桌宠 → 免费搭配基础服饰 → 解锁穿搭日常
    ↓
看到团购 → 购买实体用品 → 桌宠同步穿上 2D 版
    ↓ （如果 MBTI 上线）
做性格测试 → 宠物获得标签（"i狗E型"）
    ↓
地图页 → 看到附近宠物 + 标签 → 标签联动提示
    ↓
围观对方穿搭 → 种草 → 回到团购
```

如果 MBTI 未上线，地图仅展示宠物友好场所，不涉及标签社交。

### 1.4 核心架构约束（全文红线）

以下约束贯穿本文档所有设计：

1. **重心分离**：#2+#5 是主引擎（必须成功），#4 是社交钩子（能成就成），#3 是地理层（独立可上线）
2. **绝对粒子性**：每个模块独立可构建、可部署、可上线；模块间仅通过 API/事件通信
3. **OPC 排期**：一个人串行推进，Phase 1 → 1.5 → 2
4. **功能降级**：#4 不可用 → #3 自动降级为纯地图模式，#2 不受影响

---

## 二、用户画像

### 2.1 用户 A：精致养宠的小林

| 属性 | 描述 |
|------|------|
| 年龄/职业 | 26 岁，互联网运营 |
| 宠物 | 一只 2 岁英短蓝猫「年糕」 |
| 月宠物消费 | 500-800 元（猫粮 + 零食 + 玩具 + 偶尔服饰） |
| 痛点 | 想给猫买衣服但 size 总不合适 / 网上看图片和实物差距大 / 想看别人家的猫怎么打扮 |
| 使用场景 | 午休刷手机时，打开小程序换一件新裙子给年糕的 2D 形象「试穿」，满意后从团购下单同款实体 |
| 付费意愿 | 愿意为「看得见的穿搭效果」付费，单价 30-80 元/件可接受 |

**用户故事：**
> 小林在朋友圈看到朋友分享的「我家猫的今日穿搭」卡片，点进去看到一只可爱的 2D 猫穿着小恐龙卫衣。她创建了自己的猫「年糕」，免费试搭了几套衣服后，看中了一件日系围兜。点击「购买同款」进入团购页，价格 39.9 元（淘宝同款 59 元）。下单后，年糕的 2D 形象自动穿上了新围兜，小林截图发了朋友圈。

### 2.2 用户 B：新晋铲屎官阿杰

| 属性 | 描述 |
|------|------|
| 年龄/职业 | 23 岁，应届毕业生/程序员 |
| 宠物 | 一只 4 个月大的金毛「坦克」 |
| 月宠物消费 | 300-500 元（以基础粮和必需品为主） |
| 痛点 | 第一次养狗，不知道什么该买 / 买了几次劣质玩具被咬坏 / 想知道附近哪里能遛狗 |
| 使用场景 | 周末想带狗出门，打开地图看附近宠物友好咖啡馆，顺便浏览团购推荐的新手养狗套装 |
| 付费意愿 | 中低，但对「一站式新手推荐」信任度高，首次购买 100-200 元可接受 |

**用户故事：**
> 阿杰刚领回坦克，同事推荐了这个小程序。他创建了坦克的 2D 形象，系统自动推荐了「新手养狗基础包」（食盆 + 牵引绳 + 磨牙玩具三件套），团购价 99 元。他用地图功能找到了小区附近一家允许大型犬进入的咖啡店，周末带坦克去喝了一杯。

### 2.3 用户 C：宠物社交达人小鹿

| 属性 | 描述 |
|------|------|
| 年龄/职业 | 28 岁，自由职业/小红书宠物博主 |
| 宠物 | 两只狗：柴犬「豆包」和柯基「泡芙」 |
| 月宠物消费 | 1000-1500 元（服饰 + 零食 + 精致用品） |
| 痛点 | 想知道自己宠物的性格标签 / 想找到「气味相投」的宠物一起玩 / 种草后购买路径太长 |
| 使用场景 | 给两只狗分别做 MBTI 测试（一个 i 狗一个 E 狗），分享标签到小红书，在地图上看附近同样「E 型」的宠物在哪里 |
| 付费意愿 | 高，愿意为社交身份和个性化推荐付费 |

**用户故事：**
> 小鹿是宠物穿搭达人，她在小程序里给「豆包」测出「哲学家型（INTJ狗）」，给「泡芙」测出「社交达人型（ESFP狗）」。她分享了标签卡片到小红书收获 200+ 赞。在地图页面，系统提示「附近有一只 ENFP 型狗正在 xx 咖啡馆」，她带着豆包前去「社交」。看到对方宠物的穿搭后种草了一件雨衣，直接团购下单。

---

## 三、模块详细需求

### 3.1 共享层：用户体系 + 支付 + 宠物基础档案

> **定位**：所有业务模块的公共基础设施。不包含任何业务逻辑，仅提供通用能力。

#### 3.1.1 功能清单

| 优先级 | 功能 | 说明 |
|--------|------|------|
| **P0** | 微信登录/授权 | wx.login + getUserProfile，获取 openid/unionid |
| **P0** | 用户基础信息 | 头像、昵称、注册时间 |
| **P0** | 宠物基础档案 | 宠物名、品种、性别、生日/年龄、头像（最多 5 只） |
| **P0** | 微信支付 | 统一下单、支付回调、退款 |
| **P1** | 用户地址管理 | 收货地址 CRUD（团购模块需要） |
| **P1** | 消息订阅 | 微信订阅消息模板（订单状态、团购提醒） |
| **P2** | 用户等级 | 基于消费额/活跃度的等级体系 |

#### 3.1.2 数据模型（独立表）

```sql
-- 用户表（共享层）
CREATE TABLE common_user (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    openid          VARCHAR(64) NOT NULL UNIQUE,     -- 微信 openid
    unionid         VARCHAR(64),                     -- 微信 unionid
    nickname        VARCHAR(64),                     -- 微信昵称
    avatar_url      VARCHAR(512),                    -- 微信头像
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 宠物档案表（共享层）
CREATE TABLE common_pet (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id         BIGINT NOT NULL,                 -- 关联 common_user.id
    name            VARCHAR(32) NOT NULL,            -- 宠物名
    species         VARCHAR(16) NOT NULL,            -- 物种：dog/cat/rabbit/other
    breed           VARCHAR(64),                     -- 品种（如"英短"）
    gender          ENUM('male','female','unknown') DEFAULT 'unknown',
    birthday        DATE,                            -- 生日
    avatar_url      VARCHAR(512),                    -- 头像图
    is_active       TINYINT DEFAULT 1,               -- 是否启用
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user (user_id)
);

-- 用户地址表（共享层）
CREATE TABLE common_address (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id         BIGINT NOT NULL,                 -- 关联 common_user.id
    receiver_name   VARCHAR(32) NOT NULL,            -- 收货人
    phone           VARCHAR(20) NOT NULL,            -- 电话
    province        VARCHAR(32),                     -- 省
    city            VARCHAR(32),                     -- 市
    district        VARCHAR(32),                     -- 区
    detail          VARCHAR(256),                    -- 详细地址
    is_default      TINYINT DEFAULT 0,               -- 是否默认
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id)
);
```

#### 3.1.3 接口定义（对其他模块暴露）

| 接口 | 输入 | 输出 | 说明 |
|------|------|------|------|
| `getUserInfo(userId)` | userId | { nickname, avatarUrl } | 获取用户公开信息 |
| `getPetInfo(petId)` | petId | { name, species, breed, gender, birthday, avatarUrl } | 获取宠物基础信息 |
| `getPetList(userId)` | userId | [{ petId, name, species, avatarUrl }] | 获取用户宠物列表 |
| `createOrder(params)` | { userId, items, totalAmount, addressId } | { orderId, paymentParams } | 统一下单，返回支付参数 |
| `getOrderStatus(orderId)` | orderId | { status, paidAt, shippedAt } | 查询订单状态 |

**重要**：共享层不包含任何模块特有的字段。例如「宠物穿搭槽位」属于 #2 模块，「宠物 MBTI 标签」属于 #4 模块。

---

### 3.2 #2 2D桌宠穿搭（Phase 1 P0）

> **定位**：核心体验引擎。用户创建 2D 宠物形象，搭配服饰，展示分享。
> 
> **Phase 1 目标**：基础穿搭 + 分享，无需 AI（AI 写真等留给后续版本）

#### 3.2.1 功能清单

| 优先级 | 功能 | 详细描述 |
|--------|------|----------|
| **P0** | 创建 2D 桌宠 | 基于宠物档案（品种+性别）生成基础 2D 形象（预设模板，非 AI 生成） |
| **P0** | 基础换装 | 切换服饰部件（帽子/上衣/下装/配饰/项圈），至少 4 个部件位 |
| **P0** | 穿搭预览 | 实时 2D 渲染预览，所见即所得 |
| **P0** | 穿搭保存 | 保存当前穿搭为方案，最多 5 套 |
| **P0** | 穿搭分享 | 生成分享卡片（Canvas 绘制），含小程序码 |
| **P1** | 服饰收藏夹 | 用户拥有的服饰列表（来源：免费/团购/活动） |
| **P1** | 新手引导 | 3 步引导：创宠 → 换装 → 分享 |
| **P1** | 每日穿搭推荐 | 随机推荐搭配方案 |
| **P1** | 穿搭点赞 | 用户间可查看对方穿搭并点赞（轻社交） |
| **P2** | 多宠物切换 | 支持切换不同宠物的 2D 形象 |
| **P2** | 穿搭动效 | 切换服饰时的微小动画（如星星闪烁） |
| **P2** | 穿搭历史 | 按日期回顾穿搭变化 |

#### 3.2.2 数据模型（独立表，仅 #2 模块使用）

```sql
-- 桌宠形象表（#2 模块专属）
CREATE TABLE wp_avatar (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    pet_id          BIGINT NOT NULL,                 -- 关联 common_pet.id（共享层）
    user_id         BIGINT NOT NULL,                 -- 关联 common_user.id（冗余，加速查询）
    base_appearance JSON NOT NULL,                   -- 基础形象配置 {"species":"cat","breed":"英短","color":"blue"}
    current_outfit  JSON,                            -- 当前穿搭快照 {"hat":"item_001","top":"item_002",...}
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_pet (pet_id),
    INDEX idx_user (user_id)
);

-- 服饰道具表（#2 模块专属）
CREATE TABLE wp_item (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    name            VARCHAR(64) NOT NULL,            -- 服饰名称
    category        ENUM('hat','top','bottom','accessory','collar') NOT NULL,  -- 部件分类
    thumbnail_url   VARCHAR(512),                    -- 缩略图
    resource_url    VARCHAR(512),                    -- 2D 资源文件（PNG/SVG）
    rarity          ENUM('common','rare','epic','legendary') DEFAULT 'common',
    source          ENUM('free','group_buy','event','premium') DEFAULT 'free',  -- 来源
    group_buy_id    BIGINT,                          -- 关联团购商品（来源为 group_buy 时）
    is_active       TINYINT DEFAULT 1,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 用户服饰拥有表（#2 模块专属）
CREATE TABLE wp_user_item (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id         BIGINT NOT NULL,                 -- 关联 common_user.id
    item_id         BIGINT NOT NULL,                 -- 关联 wp_item.id
    obtained_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_item (item_id),
    UNIQUE KEY uk_user_item (user_id, item_id)
);

-- 穿搭方案表（#2 模块专属）
CREATE TABLE wp_outfit (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id         BIGINT NOT NULL,
    avatar_id       BIGINT NOT NULL,                 -- 关联 wp_avatar.id
    name            VARCHAR(32),                     -- 方案名称，如"出门装"
    slots           JSON NOT NULL,                   -- 穿搭槽位 {"hat":"item_001","top":"item_002",...}
    is_current      TINYINT DEFAULT 0,               -- 是否当前穿搭
    like_count      INT DEFAULT 0,                   -- 点赞数
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_avatar (avatar_id)
);
```

#### 3.2.3 接口定义

**对外暴露（其他模块可调用）：**

| 接口 | 输入 | 输出 | 调用方 | 说明 |
|------|------|------|--------|------|
| `getAvatarByPet(petId)` | petId | { avatarId, currentOutfit, thumbnailUrl } | #3 地图（展示宠物形象） | 获取宠物当前 2D 形象 |
| `getUserItems(userId)` | userId | [{ itemId, name, category, thumbnailUrl, rarity }] | #5 团购（购买后自动入库） | 获取用户拥有的服饰列表 |
| `addItem(userId, itemId)` | userId, itemId | { success } | #5 团购（购买后自动添加） | 为用户添加服饰道具 |
| `getOutfitById(outfitId)` | outfitId | { slots, avatarId, likeCount } | #3 地图（围观穿搭） | 获取穿搭方案详情 |

**对外依赖（调用其他模块）：**

| 接口 | 来源 | 用途 |
|------|------|------|
| `getPetInfo(petId)` | 共享层 | 创建 2D 形象时获取宠物品种/性别 |
| `getWpItemByGroupBuyId(groupBuyId)` | #5 团购 | 查询团购关联的服饰道具 |

#### 3.2.4 核心交互流程

```
[用户] 选择宠物（共享层宠物列表）
    ↓
[#2] 基于品种生成 2D 基础形象（预设模板匹配）
    ↓
[#2] 进入穿搭页 → 显示当前穿搭 + 可用服饰列表
    ↓
├─ 点击服饰 → 预览穿搭效果（实时渲染）
├─ 保存穿搭方案（最多 5 套）
├─ 分享穿搭卡片（Canvas 绘制 → 保存图片 → 分享）
└─ 查看其他人穿搭 + 点赞
```

#### 3.2.5 2D 资源规范

由于 OPC 约束，初期 2D 资源采用 **预设模板 + 部件叠加** 方案，非实时骨骼动画：

- **基础形象**：预设 8 种基础形象（猫×4品种 + 狗×4品种），每种 2 个配色
- **服饰部件**：PNG 叠加方案，每个部件为独立 256×256 透明 PNG
- **渲染方式**：Canvas 分层绘制（身体层 → 服饰层（帽/上/下/配/项）→ 背景层）
- **资源管理**：服饰 PNG 存储在 CDN/云存储，前端按需加载

---

### 3.3 #5 宠物用品团购（Phase 1 P0）

> **定位**：变现闭环。用户在小程序内以团购价购买宠物用品，购买后自动解锁对应的 2D 桌宠服饰。
>
> **Phase 1 目标**：基础团购流程 + 购买后自动添加 2D 服饰。

#### 3.3.1 功能清单

| 优先级 | 功能 | 详细描述 |
|--------|------|----------|
| **P0** | 团购商品列表 | 商品卡片（主图/名称/团购价/原价/已团人数） |
| **P0** | 商品详情页 | 轮播图、规格选择、配送信息、穿搭预览（联动 #2） |
| **P0** | 下单购买 | 选择地址 → 微信支付 → 支付成功页 |
| **P0** | 购买后解锁服饰 | 支付成功 → 调用 #2 接口自动添加对应 2D 服饰 |
| **P0** | 订单管理 | 订单列表（待支付/已支付/已发货/已完成） |
| **P1** | 团购进度条 | 显示「已团 X 件/成团需 Y 件」，制造紧迫感 |
| **P1** | 商品搜索 | 按品类/关键词搜索 |
| **P1** | 「穿搭种草」关联 | 在他人穿搭页面看到服饰来源，一键跳转团购 |
| **P1** | 物流追踪 | 接入快递查询 API |
| **P2** | 商品评价 | 用户可对已购商品评价和晒图 |
| **P2** | 限时秒杀 | 倒计时 + 限量库存 |
| **P2** | 团购提醒 | 订阅消息：上新/成团/降价通知 |

#### 3.3.2 数据模型（独立表，仅 #5 模块使用）

```sql
-- 团购商品表（#5 模块专属）
CREATE TABLE gb_product (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    name            VARCHAR(128) NOT NULL,           -- 商品名称
    description     TEXT,                            -- 商品描述
    category        VARCHAR(32),                     -- 品类：food/toy/clothing/accessory/grooming
    price_original  DECIMAL(10,2) NOT NULL,          -- 原价
    price_group     DECIMAL(10,2) NOT NULL,          -- 团购价
    images          JSON,                            -- 商品图片数组 ["url1","url2",...]
    specs           JSON,                            -- 规格 [{name:"颜色",options:["红","蓝"]}]
    stock           INT DEFAULT 0,                   -- 库存
    min_group_size  INT DEFAULT 2,                   -- 成团人数
    sold_count      INT DEFAULT 0,                   -- 已售数
    wp_item_id      BIGINT,                          -- 关联的 2D 服饰道具（wp_item.id）
    is_active       TINYINT DEFAULT 1,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 团购订单表（#5 模块专属）
CREATE TABLE gb_order (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id         BIGINT NOT NULL,                 -- 关联 common_user.id
    product_id      BIGINT NOT NULL,                 -- 关联 gb_product.id
    spec_choice     JSON,                            -- 用户选择的规格 {"颜色":"红","尺寸":"M"}
    quantity        INT DEFAULT 1,
    amount_total    DECIMAL(10,2) NOT NULL,          -- 实付金额
    status          ENUM('pending','paid','shipped','completed','refunded') DEFAULT 'pending',
    address_id      BIGINT,                          -- 关联 common_address.id
    tracking_no     VARCHAR(64),                     -- 快递单号
    wp_item_added   TINYINT DEFAULT 0,               -- 是否已添加 2D 服饰（幂等标记）
    paid_at         DATETIME,
    shipped_at      DATETIME,
    completed_at    DATETIME,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_product (product_id),
    INDEX idx_status (status)
);

-- 团购进度表（#5 模块专属）
CREATE TABLE gb_progress (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    product_id      BIGINT NOT NULL,                 -- 关联 gb_product.id
    batch_no        VARCHAR(32),                     -- 团购批次号（支持多轮团购）
    current_count   INT DEFAULT 1,                   -- 当前参团人数
    target_count    INT NOT NULL,                    -- 成团目标
    status          ENUM('ongoing','success','failed') DEFAULT 'ongoing',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_product (product_id),
    INDEX idx_batch (batch_no)
);
```

#### 3.3.3 接口定义

**对外暴露（其他模块可调用）：**

| 接口 | 输入 | 输出 | 调用方 | 说明 |
|------|------|------|--------|------|
| `getWpItemByGroupBuyId(gbProductId)` | gbProductId | { wpItemId, name, category, thumbnailUrl } | #2 穿搭（展示团购品穿搭） | 查询团购商品关联的 2D 道具 |
| `getProductBrief(productId)` | productId | { name, priceGroup, thumbnail } | #3 地图（种草推荐） | 获取商品简要信息 |
| `getUserOrders(userId, status)` | userId, status? | [{ orderId, productName, status, amount }] | #2 穿搭（展示已购列表） | 查询用户订单 |

**对外依赖（调用其他模块）：**

| 接口 | 来源 | 用途 |
|------|------|------|
| `addItem(userId, itemId)` | #2 穿搭 | 购买后自动添加 2D 服饰 |
| `getUserItems(userId)` | #2 穿搭 | 商品详情页展示「已有同款穿搭」 |
| `getAvatarByPet(petId)` | #2 穿搭 | 商品详情页展示宠物试穿效果 |
| `createOrder(params)` | 共享层 | 统一下单支付 |
| `getAddressList(userId)` | 共享层 | 下单时选择地址 |

#### 3.3.4 核心交互流程

```
[用户] 在穿搭页看到想要的服饰 → 点击「购买同款」
    ↓
[#5] 进入商品详情页
    ├─ 展示商品图片、规格、价格
    ├─ 联动展示「你家宠物穿上效果」（调用 #2 getAvatarByPet）
    └─ 用户选择规格 → 下单
    ↓
[共享层] 微信支付
    ↓
[#5] 支付成功回调
    ├─ 更新订单状态 → paid
    ├─ 检查 wp_item_id 是否存在
    │   └─ 存在 → 调用 #2 addItem() 自动添加 2D 服饰
    └─ 发送订阅消息通知
    ↓
[#2] 用户回到穿搭页 → 新服饰已出现在收藏夹
```

---

### 3.4 #3 宠物友好地图（Phase 1.5 独立可交付）

> **定位**：地理层能力。展示宠物友好场所（餐厅/咖啡馆/公园/宠物店），支持位置搜索和导航。
>
> **Phase 1.5 目标**：纯地图模式（无 MBTI 依赖），展示公共/商业宠物友好地点。

#### 3.4.1 功能清单

| 优先级 | 功能 | 详细描述 |
|--------|------|----------|
| **P0** | 地图展示 | 基于微信地图组件（map），展示附近宠物友好场所 |
| **P0** | 地点分类筛选 | 按类型筛选：餐厅/咖啡馆/公园/宠物店/医院/酒店 |
| **P0** | 地点详情页 | 名称、地址、电话、营业时间、宠物政策、照片、用户评价 |
| **P0** | 导航 | 调用微信地图导航 |
| **P1** | 地点搜索 | 按名称/地址搜索 |
| **P1** | 地点收藏 | 收藏常用地点 |
| **P1** | 地点投稿 | 用户提交新地点（待审核） |
| **P1** | 附近宠物展示 | 如果该地点有宠物"打卡"（非 MBTI，只是显示有宠物来过） |
| **P2** | 宠物打卡 | 用户带宠物到某地点后打卡，展示 2D 形象 |
| **P2** | 穿搭种草链接 | 在地点详情页展示「这里的宠物都穿什么」，链接到团购 |
| **P3*** | 标签社交模式 | MBTI 上线后解锁：展示附近宠物标签、标签匹配提示 |

*P3 功能在 #4 上线后才激活，通过 feature flag 控制。若 #4 未上线，地图不显示任何标签相关功能。

#### 3.4.2 数据模型（独立表，仅 #3 模块使用）

```sql
-- 宠物友好地点表（#3 模块专属）
CREATE TABLE mp_place (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    name            VARCHAR(128) NOT NULL,           -- 地点名称
    category        ENUM('restaurant','cafe','park','pet_store','hospital','hotel','other') NOT NULL,
    address         VARCHAR(256),                    -- 详细地址
    latitude        DECIMAL(10,7) NOT NULL,          -- 纬度
    longitude       DECIMAL(10,7) NOT NULL,          -- 经度
    phone           VARCHAR(20),                     -- 电话
    business_hours  VARCHAR(128),                    -- 营业时间（自由文本，如"09:00-22:00"）
    pet_policy      TEXT,                            -- 宠物政策说明（如"允许小型犬，需牵绳"）
    images          JSON,                            -- 地点照片数组
    rating          DECIMAL(2,1) DEFAULT 0,          -- 评分
    review_count    INT DEFAULT 0,                   -- 评价数
    source          ENUM('official','user_submitted') DEFAULT 'official',  -- 数据来源
    status          ENUM('pending','approved','rejected') DEFAULT 'approved',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_location (latitude, longitude),
    INDEX idx_category (category)
);

-- 用户收藏地点表（#3 模块专属）
CREATE TABLE mp_favorite (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id         BIGINT NOT NULL,
    place_id        BIGINT NOT NULL,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    UNIQUE KEY uk_user_place (user_id, place_id)
);

-- 宠物打卡记录（#3 模块专属）
CREATE TABLE mp_checkin (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id         BIGINT NOT NULL,
    pet_id          BIGINT NOT NULL,                 -- 关联 common_pet.id
    place_id        BIGINT NOT NULL,
    avatar_snapshot VARCHAR(512),                    -- 打卡时的 2D 形象快照 URL（调用 #2 获取）
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_place (place_id),
    INDEX idx_user (user_id),
    INDEX idx_pet (pet_id)
);

-- 地点评价表（#3 模块专属）
CREATE TABLE mp_review (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id         BIGINT NOT NULL,
    place_id        BIGINT NOT NULL,
    rating          TINYINT NOT NULL,                -- 1-5 星
    content         TEXT,                            -- 评价内容
    images          JSON,                            -- 评价图片
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_place (place_id),
    INDEX idx_user (user_id)
);
```

#### 3.4.3 接口定义

**对外暴露（其他模块可调用）：**

| 接口 | 输入 | 输出 | 调用方 | 说明 |
|------|------|------|--------|------|
| `getNearbyPlaces(lat, lng, category?, radius?)` | lat, lng, category?, radius? | [{ placeId, name, category, distance }] | #4 MBTI（展示附近标签宠物所在位置） | 获取附近地点 |
| `getPlaceCheckins(placeId)` | placeId | [{ userId, petId, avatarSnapshot, createdAt }] | #4 MBTI（标签联动） | 获取地点打卡的宠物 |

**对外依赖（调用其他模块）：**

| 接口 | 来源 | 用途 |
|------|------|------|
| `getAvatarByPet(petId)` | #2 穿搭 | 打卡时获取 2D 形象（作为 avatarSnapshot 存储） |
| `getPetInfo(petId)` | 共享层 | 打卡时获取宠物名称 |
| `getProductBrief(productId)` | #5 团购 | 穿搭种草链接 |
| `getPetMBTI(petId)` | #4 MBTI | 标签社交模式：获取宠物标签（仅在 #4 上线后调用，通过 feature flag 控制） |

#### 3.4.4 功能退化策略

| 场景 | 行为 |
|------|------|
| #4 MBTI 未上线 | 地图仅展示宠物友好场所，不显示附近宠物、不显示标签 |
| #4 MBTI 已上线但 API 超时 | 降级：不显示标签信息，不影响地点展示 |
| #2 穿搭 API 调用失败 | 打卡时不显示 2D 形象快照（显示默认头像） |
| #5 团购 API 调用失败 | 不显示种草链接 |

---

### 3.5 #4 宠物 MBTI（Phase 2 尽力而为）

> **定位**：社交钩子层。通过性格测试为宠物生成 MBTI 风格标签，联动地图实现「标签社交」。
>
> **Phase 2 目标**：完整测试 → 标签生成 → 标签联动。如果开发不顺，优雅降级，不影响其他模块。

#### 3.5.1 功能清单

| 优先级 | 功能 | 详细描述 |
|--------|------|----------|
| **P0** | MBTI 测试问卷 | 12 道情景题（主人代答），覆盖 E/I、S/N、T/F、J/P 四个维度 |
| **P0** | 标签生成 | 根据得分生成四字母类型（如"INTJ"）→ 宠物化解读（如"哲学家型"） |
| **P0** | 标签卡片 | 生成精美分享卡片（含标签 + 类型描述 + 2D 形象） |
| **P0** | 标签展示 | 在宠物档案和 2D 形象页显示标签 |
| **P1** | 标签重测 | 允许重新测试（限每 30 天一次） |
| **P1** | 解读内容 | 每种类型生成详细性格解读 + 养护建议 |
| **P1** | 标签联动 | 在地图页显示附近宠物的标签 + 匹配提示 |
| **P2** | 标签趋势 | 用户宠物的标签变化趋势（多次测试） |
| **P2** | 标签匹配 | 标签间匹配推荐（如"INTJ狗 × ENFP狗 = 最佳玩伴"） |

#### 3.5.2 数据模型（独立表，仅 #4 模块使用）

```sql
-- MBTI 测试记录表（#4 模块专属）
CREATE TABLE mbti_test (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    pet_id          BIGINT NOT NULL,                 -- 关联 common_pet.id
    user_id         BIGINT NOT NULL,                 -- 关联 common_user.id
    e_score         TINYINT NOT NULL,                -- E 维度得分 (0-100)
    i_score         TINYINT NOT NULL,                -- I 维度得分 (0-100)
    s_score         TINYINT NOT NULL,                -- S 维度得分 (0-100)
    n_score         TINYINT NOT NULL,                -- N 维度得分 (0-100)
    t_score         TINYINT NOT NULL,                -- T 维度得分 (0-100)
    f_score         TINYINT NOT NULL,                -- F 维度得分 (0-100)
    j_score         TINYINT NOT NULL,                -- J 维度得分 (0-100)
    p_score         TINYINT NOT NULL,                -- P 维度得分 (0-100)
    result_type     VARCHAR(4) NOT NULL,             -- 结果类型（如 "INTJ"）
    answers         JSON NOT NULL,                   -- 答题记录 [{questionId, choice}]
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_pet (pet_id),
    INDEX idx_user (user_id)
);

-- 宠物当前 MBTI 标签（#4 模块专属）
CREATE TABLE mbti_label (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    pet_id          BIGINT NOT NULL,                 -- 关联 common_pet.id
    user_id         BIGINT NOT NULL,
    type_code       VARCHAR(4) NOT NULL,             -- 当前类型（如 "INTJ"）
    type_name       VARCHAR(32) NOT NULL,            -- 类型名称（如 "哲学家型"）
    last_test_id    BIGINT NOT NULL,                 -- 关联最新测试记录 mbti_test.id
    is_visible      TINYINT DEFAULT 1,               -- 是否公开标签
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_pet (pet_id),
    UNIQUE KEY uk_pet (pet_id)                       -- 每只宠物一个当前标签
);

-- 标签匹配关系表（#4 模块专属，静态数据）
CREATE TABLE mbti_match (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    type_a          VARCHAR(4) NOT NULL,             -- 类型 A（如 "INTJ"）
    type_b          VARCHAR(4) NOT NULL,             -- 类型 B（如 "ENFP"）
    match_name      VARCHAR(32),                     -- 匹配名称（如 "最佳玩伴"）
    match_desc      TEXT,                            -- 匹配描述
    compatibility   TINYINT NOT NULL,                -- 兼容度 1-100
    UNIQUE KEY uk_pair (type_a, type_b)
);
```

#### 3.5.3 接口定义

**对外暴露（其他模块可调用）：**

| 接口 | 输入 | 输出 | 调用方 | 说明 |
|------|------|------|--------|------|
| `getPetMBTI(petId)` | petId | { typeCode, typeName, isVisible } | #3 地图（标签社交模式）、#2 穿搭（展示标签） | 获取宠物当前 MBTI 标签 |
| `getNearbyLabels(lat, lng, radius)` | lat, lng, radius | [{ petId, typeCode, typeName, avatarUrl, distance }] | #3 地图（标签联动） | 获取附近宠物的标签 |
| `getMatchInfo(typeA, typeB)` | typeA, typeB | { matchName, matchDesc, compatibility } | #3 地图（标签匹配提示） | 获取两个类型的匹配信息 |

**对外依赖（调用其他模块）：**

| 接口 | 来源 | 用途 |
|------|------|------|
| `getPetInfo(petId)` | 共享层 | 生成标签卡片时获取宠物基本信息 |
| `getAvatarByPet(petId)` | #2 穿搭 | 生成标签卡片时获取 2D 形象 |
| `getNearbyPlaces(lat, lng)` | #3 地图 | 标签联动：获取附近地点以展示附近宠物 |

#### 3.5.4 测试问卷设计（P0 最小集）

| 题号 | 维度 | 问题 | 选项 |
|------|------|------|------|
| 1 | E/I | 出门遛弯时，TA 更喜欢？ | A. 主动靠近其他宠物 / B. 躲在你身后观察 |
| 2 | E/I | 家里来客人时，TA 通常会？ | A. 兴奋地凑上去 / B. 躲到角落或你身后 |
| 3 | E/I | 去宠物公园，TA 更倾向于？ | A. 主动探索新区域 / B. 待在熟悉的区域 |
| 4 | S/N | TA 对物理细节更敏感？ | A. 风吹草动立刻警觉 / B. 沉浸自己世界不注意周围 |
| 5 | S/N | 对新玩具的反应？ | A. 立刻上手玩 / B. 先观察思考再行动 |
| 6 | S/N | 学新指令时？ | A. 重复练习型 / B. 看一次就懂但不愿重复 |
| 7 | T/F | 你做错事（不小心踩到TA），TA？ | A. 理性后退，很快原谅 / B. 委屈哼唧，需要哄 |
| 8 | T/F | TA 对规则的态度？ | A. 严格遵守（知道哪不能去） / B. 随心情，规则看情况 |
| 9 | T/F | 做决策时更像？ | A. "逻辑分析型" / B. "直觉冲动型" |
| 10 | J/P | 吃饭习惯？ | A. 定时定量，规律性强 / B. 想吃就吃，随性而为 |
| 11 | J/P | 对日常路线变化？ | A. 换了路线会焦虑 / B. 随遇而安 |
| 12 | J/P | 玩具/床的摆放？ | A. 喜欢固定位置 / B. 到处拖来拖去 |

#### 3.5.5 标签联动逻辑（#3 + #4）

当 #4 MBTI 上线后，#3 地图升级为「标签社交」模式：

```
[#3] 地图页展示附近宠物友好场所
    ↓ (feature flag: mbti_social = true)
[#3] 调用 #4 getNearbyLabels()
    ↓
[#3] 在地图标记上叠加宠物标签图标
    ↓
[用户] 点击标记 → 查看对方宠物类型
    ↓
[#3] 调用 #4 getMatchInfo(typeA, typeB)
    ↓
[#3] 展示匹配提示："你的 INTJ狗 和这只 ENFP狗 是天生玩伴！"
    ↓
[用户] 点击对手宠物 → 查看对方穿搭 → 种草 → 跳转团购
```

**如果 mbti_social = false**：地图不执行以上任何逻辑，仅展示地点信息。

---

## 四、粒子性架构设计

### 4.1 模块隔离方案

```
┌─────────────────────────────────────────────────────────┐
│                      共享层 (common)                      │
│  用户体系 · 微信支付 · 宠物基础档案 · 地址管理              │
│  ┌─────────────────────────────────────────────────┐    │
│  │  对外暴露：getUserInfo / getPetInfo / createOrder  │    │
│  │  不包含任何业务逻辑                                  │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
         ↑                ↑                ↑
         │ API            │ API            │ API
         │                │                │
┌────────┴──────┐  ┌──────┴──────┐  ┌──────┴──────┐  ┌──────────────┐
│   #2 桌宠穿搭  │  │  #5 团购    │  │  #3 地图    │  │  #4 MBTI    │
│  独立数据表    │  │  独立数据表  │  │  独立数据表  │  │  独立数据表  │
│  独立云函数    │  │  独立云函数  │  │  独立云函数  │  │  独立云函数  │
│  独立配置 flag │  │  独立配置 flag│  │  独立配置 flag│  │  独立配置 flag│
└───────────────┘  └─────────────┘  └─────────────┘  └──────────────┘
       ↓ 事件             ↑ 接口             ↑ 接口
   [穿搭变更]      [购买解锁道具]      [展示穿搭/标签]
```

**隔离原则**：

1. **独立数据表**：每个模块的数据库表前缀独立（`wp_` #2, `gb_` #5, `mp_` #3, `mbti_` #4），无跨模块外键
2. **独立云函数**：每个模块的云函数在独立目录，互不引用对方代码
3. **独立配置**：每个模块有独立的 feature flag 配置项
4. **API 通信**：模块间仅通过明确的 HTTP/事件接口通信，不直接读写对方数据库
5. **共享层例外**：`common_` 前缀的表是唯一被多个模块读写的表，但共享层不包含业务逻辑

### 4.2 功能退化策略矩阵

> **核心原则**：A 模块挂了 → B 模块优雅降级，绝不崩溃。

| 故障模块 | 影响模块 | 退化行为 | 用户体验 | 恢复策略 |
|---------|---------|----------|---------|----------|
| #2 穿搭 | #5 团购 | 商品详情页不显示「试穿效果」，不自动添加服饰 | 购物流程正常，少了预览功能 | #2 恢复后补发道具 |
| #2 穿搭 | #3 地图 | 打卡不显示 2D 形象（用默认头像），地点页不显示穿搭种草 | 地图功能完整可用 | 下次打卡时更新 |
| #2 穿搭 | #4 MBTI | 标签卡片不显示 2D 形象 | 标签功能完整可用 | #2 恢复后重新生成卡片 |
| #4 MBTI | #3 地图 | 自动退化为纯地图模式，不显示标签、不调用 #4 接口 | 地图功能完整可用，只是少了社交层 | #4 恢复后自动激活 |
| #4 MBTI | #2 穿搭 | 宠物档案不显示 MBTI 标签 | 穿搭功能完整可用 | #4 恢复后自动显示 |
| #3 地图 | #4 MBTI | 标签联动无数据返回 | 无影响（#4 不依赖 #3 数据） | - |
| #5 团购 | #2 穿搭 | 穿搭页不显示「购买同款」按钮，只显示已有服饰 | 穿搭体验完整，少了变现入口 | #5 恢复后按钮重新出现 |
| 共享层 | 所有模块 | **唯一无法降级的依赖**。共享层必须高可用（独立部署、限流保护） | 产品无响应 | 共享层是整个产品的单点，需重点保障 |

**共享层保障措施**：
- 独立云函数部署（与其他模块物理隔离）
- 静态降级：用户信息可缓存在前端（token + openid），短时间共享层故障不影响已登录用户浏览
- 支付失败重试机制（订单模块内）

### 4.3 Feature Flag 设计

#### 4.3.1 配置项定义

| Flag Key | 作用域 | 默认值 | 说明 |
|----------|--------|--------|------|
| `module_wp_enabled` | #2 穿搭 | `true` | 控制 #2 模块整体开关 |
| `module_gb_enabled` | #5 团购 | `true` | 控制 #5 模块整体开关 |
| `module_mp_enabled` | #3 地图 | `false` | 控制 #3 模块开关（含所有页面入口） |
| `module_mbti_enabled` | #4 MBTI | `false` | 控制 #4 模块开关 |
| `mbti_social_mode` | #3 地图 | `false` | 地图标签社交模式（依赖 #4 在线） |
| `wp_share_enabled` | #2 穿搭 | `true` | 穿搭分享功能开关 |
| `gb_checkout_enabled` | #5 团购 | `true` | 团购下单功能开关（关闭后仅展示） |
| `mp_checkin_enabled` | #3 地图 | `false` | 打卡功能开关 |

#### 4.3.2 判定逻辑（伪代码）

```
// 地图页面加载
if (!featureFlag('module_mp_enabled')) {
    hideMapTab();  // 整个地图 Tab 不显示
}

if (featureFlag('mbti_social_mode') && featureFlag('module_mbti_enabled')) {
    loadNearbyLabels();  // 加载标签社交
    loadMatchInfo();
} else {
    loadPureMap();  // 纯地图模式
}

// 穿搭页
if (!featureFlag('module_gb_enabled')) {
    hideBuyButton();  // 团购入口不显示
}

// 团购支付
if (!featureFlag('gb_checkout_enabled')) {
    disableCheckout('浏览模式');
}
```

#### 4.3.3 存储与下发

- 存储在云端配置表（如 `sys_feature_flag`），支持实时修改
- 小程序启动时拉取全量 flag 并缓存（有效期内不重复请求）
- 关键 flag（如模块开关）在后端接口层二次校验，防止前端绕过

---

## 五、MVP Phase 1 计划

### 5.1 总体里程碑

```
Phase 1（8 周，必须交付）
├─ Week 1-2：共享层（用户 + 宠物档案 + 支付）
├─ Week 3-5： #2 2D桌宠穿搭（核心体验）
├─ Week 6-7： #5 团购（变现闭环）
└─ Week 8：联调 + 提审 + 上线
```

### 5.2 详细到周计划

#### Week 1-2：共享层建设

| 周次 | 任务 | 产出 |
|------|------|------|
| W1 | 小程序项目搭建（原生框架）、云开发环境初始化 | 项目骨架 |
| W1 | 微信登录/授权、用户表 CRUD | 登录闭环 |
| W1 | 宠物档案 CRUD（添加/编辑/列表） | 宠物管理页 |
| W2 | 微信支付接入（统一下单 + 回调处理） | 支付闭环（沙箱验证） |
| W2 | 用户地址管理 | 地址页 |
| W2 | Feature flag 基础设施（配置表 + 拉取 + 缓存） | flag 系统 |

**代码量估算**：~1000-1500 行（页面 4 个 + 云函数 4 个）

#### Week 3-5：#2 2D桌宠穿搭

| 周次 | 任务 | 产出 |
|------|------|------|
| W3 | 2D 基础形象系统（8 种预设形象模板 + Canvas 分层渲染） | 宠物创建页 |
| W3 | 服饰道具表 + 管理后台（手动录入 10-20 件初始服饰） | 服饰库 |
| W4 | 穿搭页（部件选择 + 实时预览 + 保存方案） | 穿搭核心页 |
| W4 | 用户服饰收藏（拥有列表 + 穿搭方案管理） | 收藏/方案页 |
| W5 | 穿搭分享卡片（Canvas 绘制 + 小程序码 + 保存图片） | 分享闭环 |
| W5 | 穿搭点赞（可选 P1） | 轻社交 |

**代码量估算**：~2000-2500 行（页面 5 个 + Canvas 绘制 + 云函数 3 个）

#### Week 6-7：#5 团购

| 周次 | 任务 | 产出 |
|------|------|------|
| W6 | 团购商品管理后台 + 商品列表页 + 详情页 | 商品浏览闭环 |
| W6 | 下单 + 支付（调用共享层 createOrder） | 购买闭环 |
| W7 | 购买后自动添加 2D 服饰（调用 #2 addItem） | 穿搭+团购联动 |
| W7 | 订单管理（列表 + 状态流转） | 订单页 |

**代码量估算**：~1500-2000 行（页面 4 个 + 云函数 3 个）

#### Week 8：联调 + 上线

| 任务 | 说明 |
|------|------|
| 全流程走查 | 创建宠物 → 穿搭 → 分享 → 团购 → 支付 → 解锁服饰 |
| Feature flag 测试 | 逐一开关模块，验证粒子性 |
| 性能优化 | 图片加载、Canvas 渲染、页面包大小 |
| 体验打磨 | 引导页、空状态、加载态、错误态 |
| 微信审核提交 | 类目选择、隐私政策、测试账号 |

### 5.3 代码量汇总

| 模块 | Phase | 页面数 | 云函数数 | 预估代码量 | 资源资产 |
|------|-------|--------|---------|-----------|----------|
| 共享层 | P0 | 4 | 4 | 1000-1500 行 | - |
| #2 桌宠穿搭 | P0 | 5 | 3 | 2000-2500 行 | 8 基础形象 + 10-20 服饰 PNG |
| #5 团购 | P0 | 4 | 3 | 1500-2000 行 | 商品图片 |
| **Phase 1 合计** | - | **13** | **10** | **4500-6000 行** | - |
| #3 地图 (1.5) | P1 | 3 | 2 | 1200-1500 行 | - |
| #4 MBTI (2) | P2 | 3 | 2 | 1200-1500 行 | - |
| **总计** | - | **19** | **14** | **~7000-9000 行** | - |

### 5.4 上线门槛（最小可交付功能集）

**Phase 1 必须完成才能上线：**

```
✅ 用户可通过微信登录
✅ 用户可创建至少 1 只宠物档案
✅ 用户可为宠物创建 2D 形象（8 种预设选 1）
✅ 用户可换装（至少 10 件初始免费服饰）
✅ 用户可保存穿搭方案
✅ 用户可生成分享卡片
✅ 用户可浏览团购商品列表
✅ 用户可下单并通过微信支付
✅ 用户购买后自动获得对应 2D 服饰
✅ 用户可查看订单状态
✅ 任一模块可通过 feature flag 独立关闭
```

**不上线的功能（留给后续版本）：**
- #3 地图（Phase 1.5）
- #4 MBTI（Phase 2）
- AI 写真/时间轴（Phase 3+）
- 饰评分/评价
- 秒杀/限量活动

---

## 六、降级路径

### 6.1 场景一：#4 MBTI 做不出来

> **核心原则**：产品不被 #4 绑架。即使 #4 永不开发，#2+#5 和 #3 纯地图模式也能独立生存。

**受影响的功能矩阵：**

| 功能 | #4 成功时 | #4 失败时 | 行为差异 |
|------|---------|----------|---------|
| #2 穿搭体验 | 宠物档案显示 MBTI 标签 | 不显示标签 | **穿搭核心无影响** |
| #3 地图首页 | 展示附近地点 + 附近宠物标签 | 仅展示附近地点 | 纯度变低，但核心功能完整 |
| #3 标签匹配提示 | "INTJ × ENFP 最佳玩伴" | 不展示 | 少了一个趣味性功能 |
| #3 围观穿搭 | 从标签匹配入口围观 | 从打卡/地点入口围观 | 路径不同，终点相同 |
| #5 团购种草 | 标签匹配 → 围观穿搭 → 团购 | 打卡 → 围观穿搭 → 团购 | 转化路径短一点 |
| 分享裂变 | 标签卡片 + 穿搭卡片两种 | 只有穿搭卡片一种 | 裂变素材减少 |

**优雅存活的策略：**

1. **#2 穿搭是核心锚点**：即使没有 MBTI 标签，穿搭本身的社交属性（分享穿搭卡片）足以驱动增长
2. **#5 团购是独立变现**：团购不需要 MBTI，购买后解锁穿搭的联动已经足够爽
3. **#3 纯地图模式**：地图只做宠物友好场所展示，不涉及社交，这是可以独立运转的模块
4. **分享是唯一增长引擎**：穿搭分享卡片 + 团购种草分享，两个分享触点足够

```
用户旅程（无 #4）：
创建桌宠 → 穿搭（#2）
    ↓
分享穿搭卡片（传播）
    ↓
看到团购（#5）→ 购买实体 → 解锁穿搭
    ↓
地图页（#3）→ 找宠物友好场所 → 种草 → 回到团购
```

**对比有 #4 的版本**：少了「标签身份认同」和「标签匹配」两个社交钩子，但不影响用户完成「穿搭 → 团购」的核心闭环。

### 6.2 场景二：#3 地图做不出来

**受影响的功能：**
- 没有地理位置能力，纯粹是穿搭 + 团购小程序
- 标签联动无法上线（但没有 #3，#4 的标签联动也无处展示）

**存活策略：**
```
用户旅程（无 #3）：
创建桌宠 → 穿搭（#2）
    ↓
分享穿搭卡片（传播）
    ↓
团购（#5）→ 购买实体 → 解锁穿搭
    ↓
围观穿搭（#2 轻社交）→ 种草 → 回到团购
```

仍然是一个完整的「穿搭 + 电商」闭环。

### 6.3 场景三：#5 团购供应链断裂

> 这是最糟糕的场景，因为 #5 是唯一的变现引擎。

**三级应对：**

| 级别 | 方案 | 说明 |
|------|------|------|
| L1 缓冲 | 库存预警 + 手动补货 | 团购后台监控库存，低于阈值邮件/短信通知 |
| L2 过渡 | 转为导购模式 | 团购页变为商品推荐（链接到淘宝/京东联盟），赚佣金而非利润 |
| L3 最低 | #2 穿搭单独存活 | 添加虚拟货币/会员体系，纯虚拟穿搭收费（如 AI 换装、限定皮肤） |

### 6.4 最终兜底

如果 Phase 1 三个模块全部碰壁：

| 指标 | 阈值 | 行动 |
|------|------|------|
| DAU | < 50（上线 1 个月后） | 暂停新功能开发，聚焦推广 |
| 付费率 | < 1%（上线 2 个月后） | 调整定价/增加免费服饰/优化团购选品 |
| 分享率 | < 2% | 优化分享卡片设计/A/B 测试文案 |
| 7 日留存 | < 15% | 增加每日签到/打卡奖励/推送提醒 |

**如果 Phase 1 全部失败且指标无改善趋势（3 个月内）**：
- 止损：不再投入开发
- 资产保留：已开发的共享层（用户/支付/宠物档案）和 #2 穿搭引擎可作为其他方向的基础
- 代码复用：约 4000 行代码中，共享层 ~1000 行可复用，穿搭框架可改造为其他展示类应用

---

## 附录

### A. 模块间接口调用关系总览

```
#2 穿搭 ──→ 共享层 (getPetInfo)
    ↑
    ├── 被 #5 团购调用 (addItem, getUserItems, getAvatarByPet)
    ├── 被 #3 地图调用 (getAvatarByPet)
    └── 被 #4 MBTI 调用 (getAvatarByPet)

#5 团购 ──→ 共享层 (createOrder, getAddressList)
    └──→ #2 穿搭 (addItem, getAvatarByPet)

#3 地图 ──→ 共享层 (getPetInfo)
    ├──→ #2 穿搭 (getAvatarByPet)
    ├──→ #5 团购 (getProductBrief)
    └──→ #4 MBTI (getPetMBTI, getNearbyLabels, getMatchInfo) [条件调用，仅 mbti_social_mode=true]

#4 MBTI ──→ 共享层 (getPetInfo)
    ├──→ #2 穿搭 (getAvatarByPet)
    └──→ #3 地图 (getNearbyPlaces) [标签联动时]

共享层 ──→ 无依赖（纯底层）
```

### B. 数据库命名规范

| 前缀 | 模块 | 示例 |
|------|------|------|
| `common_` | 共享层 | `common_user`, `common_pet`, `common_address` |
| `wp_` | #2 桌宠穿搭 (Wardrobe Pet) | `wp_avatar`, `wp_item`, `wp_outfit` |
| `gb_` | #5 团购 (Group Buy) | `gb_product`, `gb_order`, `gb_progress` |
| `mp_` | #3 地图 (Map) | `mp_place`, `mp_checkin`, `mp_review` |
| `mbti_` | #4 MBTI | `mbti_test`, `mbti_label`, `mbti_match` |
| `sys_` | 系统配置 | `sys_feature_flag` |

### C. 审核风险提示

| 风险项 | 说明 | 缓解 |
|--------|------|------|
| 微信支付接入审核 | 需要企业资质 | 提前准备营业执照/对公账户 |
| 社交类目审核 | 含点赞/分享可能被归为社交 | 定位为「工具+电商」，弱化社交描述 |
| 团购合规 | 需有实际供应链能力 | 准备供应商合同/授权书 |
| 地图类目 | 需要 LBS 类目 | 微信开放平台申请 |
| 宠物医疗（#4 若涉及） | 避免医疗诊断相关描述 | MBTI 严格定位为「趣味测试」，加免责声明 |

---

*文档结束。本文档中的所有设计均遵循「粒子性」和「OPC 单人可执行」的底层约束。*
