# pet-wb 数据库文档

> **项目**：pet-wb（微信小程序）  
> **数据库**：微信云开发 MySQL (CloudBase)  
> **版本**：v1.0  
> **日期**：2026-06-05

---

## 一、表前缀命名规范

| 前缀 | 模块 | 含义 | 表数量 |
|------|------|------|--------|
| `common_` | 共享层 | Common infrastructure | 3 |
| `wp_` | #2 穿搭 | Wardrobe Pet | 4 |
| `gb_` | #5 团购 | Group Buy | 3 |
| `mp_` | #3 地图 | Map | 4 |
| `mbti_` | #4 MBTI | MBTI personality | 3 |
| `sys_` | 系统配置 | System config | 1 |

**表清单**：

```
database/
├── init.sql          # Phase 1 全量 DDL（共享层 + 系统配置）
├── phase2-3.sql      # 模块表 DDL（#2 #3 #4 #5）
└── README.md         # 本文档
```

---

## 二、表关系图

```
┌──────────────────────────────────────────────────────────────────┐
│                        sys_feature_flag                          │
│   flag_key / flag_value / description                           │
└──────────────────────────────────────────────────────────────────┘
         ↑ (配置读取，无外键)

┌──────────────────────────────────────────────────────────────────┐
│                        共享层 (common_)                           │
│                                                                   │
│  ┌─────────────┐     ┌─────────────┐     ┌──────────────────┐  │
│  │ common_user  │────→│ common_pet  │     │ common_address   │  │
│  │              │ 1:N │             │     │                  │  │
│  │ id (PK)      │     │ id (PK)     │     │ id (PK)          │  │
│  │ openid       │     │ user_id (FK)│     │ user_id (FK)     │  │
│  │ nickname     │     │ name        │     │ receiver_name    │  │
│  │ avatar_url   │     │ species     │     │ phone            │  │
│  └─────────────┘     │ breed       │     │ province/city    │  │
│                       │ gender      │     │ detail           │  │
│                       │ birthday    │     │ is_default       │  │
│                       │ avatar_url  │     └──────────────────┘  │
│                       └─────────────┘                            │
└──────────────────────────────────────────────────────────────────┘
          │                       │                       │
          │ (API: getPetInfo)     │ (API: getPetList)     │ (API: getAddressList)
          ▼                       ▼                       ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐
│  #2 穿搭 (wp_)    │  │  #5 团购 (gb_)   │  │  #3 地图 (mp_)       │
│                  │  │                  │  │                      │
│  wp_avatar       │  │  gb_product ────→│──│  mp_place            │
│  │ pet_id ───────│──│  │ wp_item_id    │  │  │ category          │
│  │ user_id       │  │  │ name          │  │  │ lat/lng           │
│  │ base_appearance│  │  │ price_group   │  │  │ pet_policy        │
│  │ current_outfit │  │  │ images        │  │  │ rating            │
│  └───────┬────────┘  │  │ specs         │  │  └────────┬─────────┘
│          │            │  └───────┬───────┘  │           │
│  wp_item │            │          │          │  mp_checkin ──────→│ common_pet
│  │ group_buy_id ─────│──────────┘          │  │ pet_id/place_id  │
│  │ category          │                     │  │ avatar_snapshot  │
│  │ rarity            │  gb_order           │  └──────────────────┘
│  └────────┬──────────┘  │ product_id       │
│           │              │ user_id          │  mp_favorite
│  wp_user_item           │ address_id ─────→│ common_address    │  mp_review
│  │ user_id + item_id    │ wp_item_added    │  │ rating/content   │
│  └──────────────────────┘ status            │  └──────────────────┘
│                          └────────┬─────────┘
│  wp_outfit                       │
│  │ avatar_id            gb_progress
│  │ slots (JSON)          │ product_id
│  │ like_count            │ batch_no
│  └───────────────────────│ status
└───────────────────────────┘

┌──────────────────────────────────────────────────────┐
│              #4 MBTI (mbti_)                          │
│                                                       │
│  mbti_test                                            │
│  │ pet_id ─────────────→ common_pet                   │
│  │ e/i/s/n/t/f/j/p scores                            │
│  │ result_type (e.g. "INTJ")                         │
│  │ answers (JSON)                                     │
│  └────────┬───────────────────────────────────────────│
│           │                                            │
│  mbti_label                                           │
│  │ pet_id (UNIQUE)                                    │
│  │ type_code / type_name                              │
│  │ last_test_id ──────→ mbti_test                     │
│  │ is_visible                                         │
│  └────────────────────────────────────────────────────│
│                                                       │
│  mbti_match (静态数据)                                │
│  │ type_a / type_b                                   │
│  │ match_name / compatibility                        │
│  └────────────────────────────────────────────────────│
└──────────────────────────────────────────────────────┘
```

---

## 三、模块隔离说明

### 3.1 隔离原则

1. **物理隔离**：每个模块使用独立表前缀，无跨模块物理外键
2. **逻辑关联**：通过 `*_id` 字段记录关联 ID，关联关系仅在应用层维护
3. **API 通信**：模块间仅通过 HTTP/事件接口读写数据，不直接操作对方数据库表
4. **共享层例外**：`common_*` 表是唯一可被多模块直接读取的表，但写入仍通过共享层 API

### 3.2 逻辑外键清单

以下为逻辑外键关系（非物理约束，由应用层保证一致性）：

| 表 (子) | 字段 | 关联表 (父) | 说明 |
|---------|------|-----------|------|
| `common_pet` | `user_id` | `common_user.id` | 宠物属于用户 |
| `common_address` | `user_id` | `common_user.id` | 地址属于用户 |
| `wp_avatar` | `pet_id` | `common_pet.id` | 形象关联宠物 |
| `wp_avatar` | `user_id` | `common_user.id` | 冗余字段 |
| `wp_user_item` | `user_id` | `common_user.id` | 用户拥有服饰 |
| `wp_user_item` | `item_id` | `wp_item.id` | 服饰道具 |
| `wp_item` | `group_buy_id` | `gb_product.id` | 团购关联道具 |
| `wp_outfit` | `user_id` | `common_user.id` | 穿搭属于用户 |
| `wp_outfit` | `avatar_id` | `wp_avatar.id` | 穿搭关联形象 |
| `gb_product` | `wp_item_id` | `wp_item.id` | 团购关联 2D 道具 |
| `gb_order` | `user_id` | `common_user.id` | 订单属于用户 |
| `gb_order` | `product_id` | `gb_product.id` | 订单关联商品 |
| `gb_order` | `address_id` | `common_address.id` | 收货地址 |
| `gb_progress` | `product_id` | `gb_product.id` | 进度关联商品 |
| `mp_favorite` | `user_id` | `common_user.id` | 收藏属于用户 |
| `mp_favorite` | `place_id` | `mp_place.id` | 收藏关联地点 |
| `mp_checkin` | `user_id` | `common_user.id` | 打卡属于用户 |
| `mp_checkin` | `pet_id` | `common_pet.id` | 打卡关联宠物 |
| `mp_checkin` | `place_id` | `mp_place.id` | 打卡关联地点 |
| `mp_review` | `user_id` | `common_user.id` | 评价属于用户 |
| `mp_review` | `place_id` | `mp_place.id` | 评价关联地点 |
| `mbti_test` | `pet_id` | `common_pet.id` | 测试关联宠物 |
| `mbti_test` | `user_id` | `common_user.id` | 测试属于用户 |
| `mbti_label` | `pet_id` | `common_pet.id` | 标签关联宠物 |
| `mbti_label` | `last_test_id` | `mbti_test.id` | 最新测试记录 |

### 3.3 跨模块数据流

```
#5 团购支付成功
  └─→ 调用 #2 API: addItem(userId, wpItemId)
      └─→ 写入 wp_user_item 表

#3 地图打卡
  └─→ 调用 #2 API: getAvatarByPet(petId)
      └─→ 获取 2D 形象快照 URL → 写入 mp_checkin.avatar_snapshot

#3 标签社交模式 (feature_flag: mbti_social_mode=1)
  └─→ 调用 #4 API: getNearbyLabels(lat, lng, radius)
      └─→ 查询 mbti_label + common_pet 联表

#4 MBTI 标签卡片
  └─→ 调用共享层: getPetInfo(petId)
  └─→ 调用 #2 API: getAvatarByPet(petId)
      └─→ 生成分享卡片时不直接读写对方表
```

---

## 四、数据类型规范

| 类型 | 用途 | 示例 |
|------|------|------|
| `BIGINT` | 主键、外键 ID | `id`, `user_id` |
| `VARCHAR(N)` | 短文本 | `VARCHAR(64)` 用于名称 |
| `TEXT` | 长文本 | 商品描述、宠物政策 |
| `JSON` | 结构化数据 | 规格、图片数组、穿搭槽位 |
| `DECIMAL(M,D)` | 金额 | `DECIMAL(10,2)` |
| `TINYINT` | 布尔/小整数 | 开关、状态、评分 |
| `INT` | 计数 | `sold_count`, `like_count` |
| `DATE` | 日期 | `birthday` |
| `DATETIME` | 时间戳 | `created_at`, `paid_at` |

---

## 五、JSON 字段示例

以下为关键 JSON 字段的数据格式示例：

### wp_avatar.base_appearance
```json
{
  "species": "cat",
  "breed": "英短",
  "color": "blue"
}
```

### wp_avatar.current_outfit / wp_outfit.slots
```json
{
  "hat": "item_001",
  "top": "item_002",
  "bottom": null,
  "accessory": "item_010",
  "collar": "item_005"
}
```

### gb_product.images
```json
[
  "https://cdn.example.com/product/123/main.jpg",
  "https://cdn.example.com/product/123/detail1.jpg",
  "https://cdn.example.com/product/123/detail2.jpg"
]
```

### gb_product.specs
```json
[
  {"name": "颜色", "options": ["红色", "蓝色", "绿色"]},
  {"name": "尺寸", "options": ["S", "M", "L"]}
]
```

### gb_order.spec_choice
```json
{"颜色": "红色", "尺寸": "M"}
```

### mbti_test.answers
```json
[
  {"questionId": 1, "choice": "A"},
  {"questionId": 2, "choice": "B"}
]
```

---

## 六、部署步骤

### 6.1 前置条件

- 微信云开发环境已开通
- MySQL 数据库实例已创建
- 有数据库管理权限（控制台或 CLI）

### 6.2 Phase 1 部署（共享层 + 系统配置）

```bash
# 1. 连接云开发 MySQL
# 方式一：微信开发者工具 → 云开发 → 数据库 → SQL 编辑器
# 方式二：通过云开发 CLI

# 2. 执行初始化脚本
mysql -h <云开发MySQL地址> -u <用户名> -p <database> < database/init.sql

# 3. 验证
# 检查 common_user / common_pet / common_address / sys_feature_flag 四张表已创建
# 检查 sys_feature_flag 已插入 8 条初始配置
```

### 6.3 后续模块部署

```bash
# #2 穿搭 / #5 团购（Phase 1）
mysql -h <云开发MySQL地址> -u <用户名> -p <database> < database/phase2-3.sql

# 验证
SHOW TABLES LIKE 'wp_%';   -- 应显示 4 张表
SHOW TABLES LIKE 'gb_%';   -- 应显示 3 张表
SHOW TABLES LIKE 'mp_%';   -- 应显示 4 张表
SHOW TABLES LIKE 'mbti_%'; -- 应显示 3 张表
```

### 6.4 回滚

```sql
-- 按模块回滚（示例）
DROP TABLE IF EXISTS wp_outfit, wp_user_item, wp_item, wp_avatar;
DROP TABLE IF EXISTS gb_progress, gb_order, gb_product;
DROP TABLE IF EXISTS mp_review, mp_checkin, mp_favorite, mp_place;
DROP TABLE IF EXISTS mbti_match, mbti_label, mbti_test;
```

---

## 七、索引策略

| 表 | 索引 | 类型 | 用途 |
|-----|------|------|------|
| `common_user` | `uk_openid` | UNIQUE | 微信登录查询 |
| `common_pet` | `idx_user` | INDEX | 用户宠物列表 |
| `common_address` | `idx_user` | INDEX | 用户地址列表 |
| `wp_avatar` | `idx_pet`, `idx_user` | INDEX | 宠物/用户查形象 |
| `wp_user_item` | `uk_user_item` | UNIQUE | 防重复拥有 |
| `wp_outfit` | `idx_user`, `idx_avatar` | INDEX | 用户穿搭列表 |
| `gb_order` | `idx_user`, `idx_product`, `idx_status` | INDEX | 订单查询 |
| `gb_progress` | `idx_product`, `idx_batch` | INDEX | 团购进度查询 |
| `mp_place` | `idx_location`, `idx_category` | INDEX | 地理位置+分类搜索 |
| `mp_favorite` | `uk_user_place` | UNIQUE | 防重复收藏 |
| `mp_checkin` | `idx_place`, `idx_user`, `idx_pet` | INDEX | 打卡查询 |
| `mp_review` | `idx_place`, `idx_user` | INDEX | 评价查询 |
| `mbti_test` | `idx_pet`, `idx_user` | INDEX | 测试记录查询 |
| `mbti_label` | `uk_pet` | UNIQUE | 每宠唯一标签 |
| `mbti_match` | `uk_pair` | UNIQUE | 类型配对唯一 |
| `sys_feature_flag` | `uk_flag_key` | UNIQUE | Flag 查询 |

---

## 八、维护注意事项

1. **所有 ID 字段使用 BIGINT AUTO_INCREMENT**，不对外暴露自增 ID 的业务含义
2. **时间字段统一 DATETIME**，应用层负责时区转换
3. **JSON 字段不参与 WHERE 条件**，如需查询 JSON 内部字段，考虑冗余列或应用层过滤
4. **软删除**：`common_pet.is_active` 和 `wp_item.is_active` 用于软删除，不物理删除数据
5. **幂等标记**：`gb_order.wp_item_added` 防止重复添加 2D 服饰
6. **无物理外键**：数据一致性由应用层/云函数保证，部署顺序不受外键约束限制
