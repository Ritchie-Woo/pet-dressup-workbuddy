# PRD：开团模块重构 — 人人开团 + 独立 Tab + 物流跟踪

> 版本: v1.0 | 日期: 2026-06-08 | 状态: 待开发

---

## 一、背景与目标

当前团长端入口藏在「我的」→「团长工作台」，路径太长，团长高频操作极不友好。同时，开团有角色权限限制（需手动设置 `role: 'leader'`），阻碍普通用户参与。

**核心目标：**
- 开团零门槛，任何用户都可以开团
- 独立「开团」Tab，一步直达工作台
- 接入物流系统，开团/参团双方都能看到物流轨迹

---

## 二、底部 Tab 结构调整

### 2.1 新 Tab 结构

替换「订单」Tab 为「开团」Tab。订单功能合并进「我的」页面。

**当前（5 个）：**
```
穿搭 / 团购 / 订单 / 地图 / 我的
```

**新版（5 个）：**
```
穿搭 / 团购 / 开团 / 地图 / 我的
```

### 2.2 Tab 图标定义

| Tab | 文字 | 图标（选中/未选中） |
|-----|------|-------------------|
| 穿搭 | 穿搭 | `images/tab/wp.png` |
| 团购 | 团购 | `images/tab/gb.png` |
| 开团 | 开团 | `images/tab/groupbuy.png`（需新增） |
| 地图 | 地图 | `images/tab/mp.png` |
| 我的 | 我的 | `images/tab/my.png` |

### 2.3 「我的」页面调整

在「我的」页面新增「我的订单」入口，聚合展示用户的所有订单（我开的团 + 我参的团）。

---

## 三、「开团」Tab 首页

### 3.1 页面路由

`gb/groupbuy/index`

### 3.2 页面布局

```
┌─────────────────────────────────┐
│  📣 官方活动 Banner（可配置）     │
├─────────────────────────────────┤
│  请选择开团类型                   │
│                                 │
│  ┌───────────────────────────┐ │
│  │ 🛍️        普通团购         │ │
│  │           创建实物商品      │ │
│  │           快递发货         │ │
│  └───────────────────────────┘ │
│                                 │
│  ┌───────────────────────────┐ │
│  │ ⏰        预售团购         │ │
│  │           先收款后采购      │ │
│  │           指定发货日期      │ │
│  └───────────────────────────┘ │
│                                 │
│  ┌───────────────────────────┐ │
│  │ 📍        自提团购         │ │
│  │           线下取货         │ │
│  │           无需快递         │ │
│  └───────────────────────────┘ │
│                                 │
├─────────────────────────────────┤
│  我开的团（如果有历史记录）        │
│  [商品1]  [商品2]  [商品3]  ... │
└─────────────────────────────────┘
```

### 3.3 三种团购类型

| 类型 | 标识 | 核心差异 | 发货方式 |
|------|------|----------|----------|
| 普通团购 | `normal` | 标准实物商品 | 快递发货 / 自寄 / 无需物流 |
| 预售团购 | `presale` | 指定发货日期，先收款后采购 | 快递发货 / 自寄 / 无需物流 |
| 自提团购 | `pickup` | 线下取货，无需快递 | 生成自提码，现场核销 |

---

## 四、开团流程

### 4.1 创建商品

**路由：** `gb/groupbuy/edit/index`

**表单字段（三种类型公用）：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| 商品名称 | text | ✅ | 最长 64 字 |
| 商品描述 | textarea | ❌ | 最长 500 字 |
| 分类 | select | ✅ | 服饰/项圈/食品/玩具/洗护 |
| 团购价 | number | ✅ | 元，支持两位小数 |
| 原价 | number | ❌ | 元，划线价 |
| 库存 | number | ✅ | 最小 1 |
| 成团人数 | number | ✅ | 最小 2，默认 2 |
| 商品规格 | array | ❌ | 如颜色/尺码 |
| 商品图片 | upload | ✅ | 最多 9 张 |
| 预计发货日期 | datepicker | 预售必填 | 7/15/30天后 或自定义 |
| 自提地点 | text | 自提必填 | 详细地址 |
| 自提时间 | text | 自提必填 | 如"工作日 9:00-18:00" |

**快速模式：** 仅需上传图片 + 填写名称 + 定价，其他字段有默认值，3 步完成。

### 4.2 发布与分享

1. 创建成功 → 生成团购商品详情页
2. 用户可分享商品卡片到微信群/朋友圈
3. 商品出现在「团购」页面的商品列表中

---

## 五、权限变更：人人可开团

### 5.1 数据库变更

**移除：**
- `common_user.role` 字段（不再使用 `role: 'leader'` 控制权限）

**现有字段重命名：**
- `gb_product.leader_id` → `gb_product.creator_id`：记录创建者

**新字段：**
```javascript
// gb_product 新增
{
  group_type: 'normal',    // 'normal' | 'presale' | 'pickup'
  presale_date: null,      // 预售发货日期
  pickup_location: '',     // 自提地点
  pickup_time: ''          // 自提时间
}

// gb_order 新增
{
  ship_method: 'manual',    // 'platform' | 'cainiao' | 'manual' | 'none'
  carrier_code: '',         // 快递公司代码（SF/ZTO/YD等）
  logistics_status: '',     // 物流状态
  logistics_trace: [],      // 物流轨迹数组（缓存）
  pickup_code: '',          // 自提码（6位数字）
  pickup_confirmed: false   // 是否已自提确认
}
```

### 5.2 云函数变更

**`common-user`：**
- 移除 `checkRole` action
- `login` action 移除 `role` 字段写入

**`gb-product`：**
- `leaderCreate` → `create`（移除权限校验）
- `leaderUpdate` → `update`（校验 `creator_id` 是否为当前用户）
- `leaderToggle` → `toggleStatus`（同上）
- `leaderList` → `listMyProducts`（按 `creator_id` 查询）

**`gb-order`：**
- `leaderOrders` → `myProductOrders`（按创建者查订单）
- `leaderOrderDetail` → `sellerOrderDetail`（卖家视角订单详情）
- `leaderStats` → `mySalesStats`（我的销售统计）

**`gb-progress`：**
- `leaderProgress` → `myProgress` 重命名

**`my/index` 页面：**
- 移除 `checkRole()` 调用
- 移除「团长工作台」入口卡片
- 新增「我的订单」入口

---

## 六、物流系统

### 6.1 四种发货方式

| 方式 | 操作入口 | 单号获取 | 买家可见 |
|------|----------|----------|----------|
| **平台快递** | 订单详情 → 选择快递 → 一键下单 | 自动回填 | ✅ 实时物流轨迹 |
| **菜鸟裹裹** | 订单详情 → 跳转菜鸟小程序 | 回调回填 | ✅ 实时物流轨迹 |
| **自行寄出** | 订单详情 → 填快递公司 + 单号 | 手动输入 | ✅ 物流轨迹查询 |
| **无需物流** | 订单详情 → 标记已发货 | 无 | ❌ 仅显示"已发货" |

### 6.2 主要快递公司代码

| 公司 | 代码 | 公司 | 代码 |
|------|------|------|------|
| 顺丰速运 | SF | 中通快递 | ZTO |
| 圆通速递 | YTO | 申通快递 | STO |
| 韵达快递 | YD | 极兔速递 | JTSD |
| 邮政包裹 | YZPY | 京东物流 | JD |

### 6.3 卖家端发货流程

```
订单详情页（我的商品 → 订单管理 → 订单详情）
  └─ 点击「发货」按钮
      └─ 弹出发货方式选择
          ├─ 「在线叫快递」→ 选快递公司 → 填地址 → 下单 → 自动回填单号
          ├─ 「菜鸟裹裹寄件」→ 跳转菜鸟小程序 → 返回回填单号
          ├─ 「自行寄出」→ 选快递公司 → 手动填单号 → 确认
          └─ 「无需物流」→ 二次确认 → 标记已发货
```

### 6.4 买家端物流查看

**订单详情页新增物流卡片：**

```
┌─────────────────────────────────┐
│  物流信息                        │
│                                 │
│  📦 顺丰速运  SF1234567890     │
│  [复制单号]  [查看完整轨迹]      │
│                                 │
│  ○ 2026-03-15 14:32  已签收     │
│  ● 2026-03-15 08:15  派送中     │
│  ● 2026-03-14 22:30  到达网点   │
│  ● 2026-03-14 10:15  运输中     │
│  ● 2026-03-13 18:00  已揽件     │
└─────────────────────────────────┘
```

**自提订单显示：**

```
┌─────────────────────────────────┐
│  自提信息                        │
│                                 │
│  自提地址：XX路XX号XX店铺       │
│  自提时间：工作日 9:00-18:00    │
│                                 │
│  自提码：836492                  │
│  [出示给店员核销]                │
└─────────────────────────────────┘
```

### 6.5 物流 API（P2 阶段）

- 快递 100 API：物流轨迹查询、快递公司列表
- 菜鸟裹裹小程序跳转：`wx.navigateToMiniProgram`
- 首次上线先支持「自行寄出」和「无需物流」，平台快递和菜鸟在 P2 阶段接入

---

## 七、页面清单

### 7.1 新增页面

| 页面 | 路由 | 说明 |
|------|------|------|
| 开团首页 | `gb/groupbuy/index` | 三种开团类型选择 + 我的商品入口 |
| 商品管理 | `gb/groupbuy/product/list` | 我的商品列表（上下架、编辑） |
| 商品编辑 | `gb/groupbuy/product/edit` | 创建/编辑商品（三种类型共用） |
| 订单管理 | `gb/groupbuy/order/list` | 我卖出的订单列表（状态 Tab 筛选） |
| 订单详情 | `gb/groupbuy/order/detail` | 卖家视角订单详情 + 发货操作 |

### 7.2 修改页面

| 页面 | 路由 | 变更内容 |
|------|------|----------|
| 我的 | `my/index` | 移除团长入口；新增「我的订单」入口 |
| 订单列表 | `gb/order/list` | 增加「我开的团/我参的团」Tab；增加物流入口 |
| 订单详情 | `gb/order/detail` | 新增物流卡片；新增自提码展示 |
| app.json | - | 替换 Tab 配置；注册新页面路由 |

### 7.3 移除页面

`gb/leader/*` 全部 6 个页面。代码逻辑迁移到 `gb/groupbuy/*`。

---

## 八、云函数清单

### 8.1 修改的云函数

| 云函数 | 变更 |
|--------|------|
| `common-user` | 移除 `checkRole` action；`login` 不再写入 `role` |
| `gb-product` | Action 重命名：`leaderXxx` → `create/update/toggle/listMy`；移除权限校验；新增 `group_type`/`presale_date`/`pickup_*` 字段处理 |
| `gb-order` | Action 重命名：`leaderXxx` → `myProductXxx`；扩展 `ship` action 支持四种发货方式；扩展 `detail` action 返回物流信息 |
| `gb-progress` | Action 重命名：`leaderProgress` → `myProgress` |

### 8.2 新增的云函数

| 云函数 | 说明 |
|--------|------|
| `gb-logistics` | 物流轨迹查询；订阅推送（P2） |

### 8.3 `request.js` 新增函数

```javascript
// 开团 API（替代原 leader 系列）
getMyProducts(params)           // gb-product.myList
createProduct(params)           // gb-product.create
updateProduct(params)           // gb-product.update
toggleProductStatus(productId)  // gb-product.toggleStatus
getMyProductOrders(params)      // gb-order.myProductOrders
getSellerOrderDetail(orderId)   // gb-order.sellerOrderDetail
getMySalesStats()               // gb-order.mySalesStats
getMyProgress()                 // gb-progress.myProgress

// 物流 API
getLogisticsTrace(carrierCode, trackingNo)  // gb-logistics.getTrace
shipOrder(orderId, shipMethod, data)        // gb-order.ship（扩展）
```

---

## 九、开发优先级

### P0：核心入口 + 人人开团（第一批）

- [ ] `app.json` Tab 结构调整（订单 → 开团）
- [ ] `my/index` 移除团长入口，新增「我的订单」
- [ ] `gb/groupbuy/index` 开团首页（三种类型选择）
- [ ] `gb/groupbuy/product/edit` 商品编辑页（三类合一）
- [ ] 云函数权限移除（`common-user`、`gb-product`、`gb-order`、`gb-progress`）
- [ ] `request.js` 函数重命名 + 新建
- [ ] 移除 `gb/leader/*` 和 `database/phase4-leader.sql`

### P1：物流手动模式 + 订单管理（第二批）

- [ ] `gb/groupbuy/product/list` 我的商品管理
- [ ] `gb/groupbuy/order/list` 我的订单管理
- [ ] `gb/groupbuy/order/detail` 订单详情 + 发货面板
- [ ] 四种发货方式（自行寄出 + 无需物流优先）
- [ ] 买家端订单详情物流卡片

### P2：平台快递 + 菜鸟裹裹（第三批）

- [ ] 快递 100 / 快递鸟 API 对接
- [ ] 在线叫快递（选快递公司下单）
- [ ] 菜鸟裹裹小程序跳转 + 回调
- [ ] 物流轨迹实时查询

### P3：体验增强（第四批）

- [ ] 物流状态订阅推送
- [ ] 自提码生成与扫码核销
- [ ] 预售倒计时提醒
- [ ] 开团分享带缩略图和价格

---

## 十、与原团长端的差异对照

| 维度 | 原团长端 | 新版开团 |
|------|----------|----------|
| 入口 | 「我的」→ 团长工作台 | 底部「开团」Tab 直达 |
| 权限 | 需手动设 `role: 'leader'` | 人人可开团 |
| 页面路径 | `gb/leader/*` | `gb/groupbuy/*` |
| 团购类型 | 仅普通团购 | 普通/预售/自提三种 |
| 发货方式 | 仅手动填单号 | 四种方式（平台/菜鸟/自寄/无需） |
| 物流查看 | 无 | 开团方 + 参团方都能看 |
| 工作台 | 数据看板 3 入口 | 类型选择 + 已开团列表 |
