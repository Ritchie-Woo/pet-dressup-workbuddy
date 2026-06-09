# PRD：开团模块重构 — 人人开团 + 独立 Tab + 物流跟踪

> 版本: v2.1 | 日期: 2026-06-08 | 状态: 待审核
>
> v1.0 → v2.0 变更：P0 收窄为仅普通团购；role 字段保留不删；API 函数加 seller 前缀；补充 leader_id 重命名影响面清单；明确物流 API 前置条件。
>
> v2.0 → v2.1 变更：补充「我已开团」API 来源和跳转路由；明确原 gb/leader/product/edit 关系；ship action P0 直接支持 carrier_code；新增已有数据库迁移说明。

---

## 一、背景与目标

当前团长端入口藏在「我的」→「团长工作台」，路径太长。同时开团有角色权限限制（需手动设置 `role: 'leader'`），阻碍普通用户参与。

**核心目标：**
- 开团零门槛，任何用户都可以开团
- 独立「开团」Tab，一步直达
- 接入物流系统，买卖双方都能追踪物流

---

## 二、底部 Tab 结构调整

### 2.1 新 Tab 结构

**当前（5 个）：**
```
穿搭 / 团购 / 订单 / 地图 / 我的
```

**新版（5 个）：**
```
穿搭 / 团购 / 开团 / 地图 / 我的
```

「订单」Tab 移除。`gb/order/list` 路由保留在 `app.json` 的 `pages` 数组中（非 TabBar），买家通过「我的」→「我的订单」进入。

### 2.2 订单入口兜底

| 入口 | 路由 | 说明 |
|------|------|------|
| 「我的」→ 我的订单 | `gb/order/list` | 买家查看所有订单（含我开的团 + 我参的团） |
| 「我的」→ 我的订单 → 订单详情 | `gb/order/detail` | 订单详情 + 物流卡片 |
| 「开团」Tab → 订单管理 | `gb/groupbuy/order/list` | 卖家视角，按商品筛选订单 |

### 2.3 Tab 图标

| Tab | 文字 | 图标 |
|-----|------|------|
| 穿搭 | 穿搭 | `images/tab/wp.png` |
| 团购 | 团购 | `images/tab/gb.png` |
| 开团 | 开团 | `images/tab/groupbuy.png`（新增，需设计） |
| 地图 | 地图 | `images/tab/mp.png` |
| 我的 | 我的 | `images/tab/my.png` |

---

## 三、「开团」Tab 首页

### 3.1 页面路由

`gb/groupbuy/index`

### 3.2 P0 阶段页面布局（仅普通团购可用）

```
┌─────────────────────────────────┐
│  📣 官方活动 Banner（可配置）     │
├─────────────────────────────────┤
│  请选择开团类型                   │
│                                 │
│  ┌───────────────────────────┐ │
│  │ 🛍️        普通团购     ✅  │ │
│  │           实物商品         │ │
│  │           快递发货         │ │
│  └───────────────────────────┘ │
│                                 │
│  ┌───────────────────────────┐ │
│  │ ⏰        预售团购     🔒  │ │
│  │           即将上线         │ │
│  └───────────────────────────┘ │
│                                 │
│  ┌───────────────────────────┐ │
│  │ 📍        自提团购     🔒  │ │
│  │           即将上线         │ │
│  └───────────────────────────┘ │
│                                 │
├─────────────────────────────────┤
│  我已开团（sellerGetProducts，    │
│  取最近 5 条，点击进商品管理列表）  │
│  [商品1]  [商品2]  [商品3]  ...   │
└─────────────────────────────────┘
```

**「我已开团」数据说明：**
- 调用 `sellerGetProducts({ pageSize: 5 })` 获取当前用户创建的商品
- 点击任一商品卡片 → 跳转 `gb/groupbuy/product/list`（商品管理列表页）
- 如无商品则不展示此区域

### 3.3 三种团购类型（完整规划）

| 类型 | 标识 | 核心差异 | 发货方式 | 上线阶段 |
|------|------|----------|----------|----------|
| 普通团购 | `normal` | 标准实物商品 | 快递发货/自寄/无需物流 | **P0** |
| 预售团购 | `presale` | 指定发货日期，先收款后采购 | 同普通 | P2 |
| 自提团购 | `pickup` | 线下取货，生成自提码 | 无快递，核销自提码 | P3 |

---

## 四、开团流程（P0 仅普通团购）

### 4.1 创建商品

**路由：** `gb/groupbuy/product/edit`

**表单字段：**

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| 商品名称 | text | ✅ | - | 最长 64 字 |
| 商品描述 | textarea | ❌ | '' | 最长 500 字 |
| 分类 | select | ✅ | 'all' | 服饰/项圈/食品/玩具/洗护 |
| 团购价 | number | ✅ | - | 元，支持两位小数 |
| 原价 | number | ❌ | - | 元，划线展示 |
| 库存 | number | ✅ | 999 | 最小 1 |
| 成团人数 | number | ✅ | 2 | 最小 2 |
| 商品规格 | array | ❌ | [] | 如颜色/尺码，动态添加 |
| 商品图片 | upload | ✅ | - | 最多 9 张 |
| 团购类型 | hidden | 自动 | 'normal' | P0 固定为 normal |

**快速模式：** 仅需图片 + 名称 + 价格，其余字段有默认值。

### 4.2 发布与分享

1. 创建成功 → 生成团购商品详情页（现有 `gb/detail/index`）
2. 用户可分享商品卡片到微信群/朋友圈
3. 商品出现在「团购」页商品列表中

---

## 五、权限变更：人人可开团

### 5.1 核心原则

- **不做删字段操作**，仅移除代码中的权限校验
- `common_user.role` 字段保留，`login` 不再写入 `role`
- 开团、编辑、发货不再校验 `role === 'leader'`

### 5.2 字段变化

**保留不变：**
```
common_user.role  →  字段保留，不再用于开团权限
```

**重命名（文档数据库无 Schema，只需改代码引用）：**
```
gb_product.leader_id  →  gb_product.creator_id
gb_product.idx_leader  →  gb_product.idx_creator
```

**已有数据的迁移（如果之前跑过 phase4-leader.sql 并写入过数据）：**

文档数据库不支持 ALTER TABLE，已有 `leader_id` 字段的记录需要通过以下方式迁移：

1. 云开发控制台 → `gb_product` 集合 → 导出全部数据（JSON）
2. 将每条记录的 `leader_id` 字段重命名为 `creator_id`
3. 删除原集合 → 重新导入修改后的 JSON
4. 删除旧索引 `idx_leader` → 新建索引 `idx_creator`（字段：`creator_id`）

如果数据库中还没有 `leader_id` 记录（纯新建环境），则直接按新字段名 `creator_id` 开发即可，无需迁移。

### 5.3 受 `creator_id` 重命名影响的全部位置

| 云函数 | Action | 受影响的查询条件 |
|--------|--------|----------------|
| `gb-product` | `leaderList` | `where({ leader_id: userId })` → `where({ creator_id: userId })` |
| `gb-product` | `leaderUpdate` | `prodResult.data.leader_id !== userId` → `creator_id !== userId` |
| `gb-product` | `leaderToggle` | 同上 |
| `gb-order` | `leaderOrders` | `where({ leader_id: userId })` 查商品 → `where({ creator_id: userId })` |
| `gb-order` | `ship` | `productResult.data.leader_id !== userId` → `creator_id !== userId` |
| `gb-order` | `leaderStats` | `where({ leader_id: userId })` → `where({ creator_id: userId })` |
| `gb-order` | `leaderOrderDetail` | `prodResult.data.leader_id !== userId` → `creator_id !== userId` |
| `gb-progress` | `leaderProgress` | 同 gb-product `leaderList` |

**数据库索引：** `idx_leader` → `idx_creator`（文档数据库需手动在控制台重建索引）。

### 5.4 云函数 Action 重命名

| 云函数 | 原 Action | 新 Action |
|--------|-----------|-----------|
| `common-user` | `checkRole` | **移除**（不再需要） |
| `gb-product` | `leaderList` | `myProductList` |
| `gb-product` | `leaderCreate` | `createProduct` |
| `gb-product` | `leaderUpdate` | `updateProduct` |
| `gb-product` | `leaderToggle` | `toggleProductStatus` |
| `gb-order` | `leaderOrders` | `myProductOrders` |
| `gb-order` | `leaderOrderDetail` | `sellerOrderDetail` |
| `gb-order` | `leaderStats` | `mySalesStats` |
| `gb-progress` | `leaderProgress` | `myProgress` |

---

## 六、物流系统

### 6.1 四种发货方式（最终态）

| 方式 | 操作流程 | 单号获取 | 买家可见 |
|------|----------|----------|----------|
| **平台快递** | 订单详情 → 选快递公司 → 一键下单 | 自动回填 | ✅ 实时物流轨迹 |
| **菜鸟裹裹** | 订单详情 → 跳转菜鸟小程序 → 返回 | 自动回填 | ✅ 实时物流轨迹 |
| **自行寄出** | 订单详情 → 选快递公司 + 填单号 | 手动输入 | ✅ 物流轨迹查询 |
| **无需物流** | 订单详情 → 标记已发货 | 无 | ❌ "已发货" |

### 6.2 P0 阶段：自行寄出 + 无需物流

P0 只实现两种手动方式，卖家端操作：

```
订单详情页 → 点击「去发货」
  └─ 弹窗选择发货方式
      ├─ 「自行寄出」→ 下拉选快递公司 → 填单号 → 确认
      └─ 「无需物流」→ 二次确认 → 标记已发货
```

**P0 `ship` action 参数（一次扩展到最终签名）：**

```javascript
// gb-order ship action P0 参数
{
  orderId: String,       // 订单 ID
  shipMethod: String,    // 'manual' | 'none'
  carrierCode: String,   // 快递公司代码，自寄必填
  carrierName: String,   // 快递公司名称，自寄必填
  trackingNo: String     // 快递单号，自寄必填
}
// 「无需物流」时 carrierCode/Name/trackingNo 均传空字符串
```

P1 再加 `'platform'` 和 `'cainiao'` 两种 `shipMethod`，无需改接口签名。

### 6.3 P2 阶段：平台快递 + 菜鸟裹裹

**前置条件（必须 P2 开始前完成）：**
- 快递 100 企业认证完成
- 确认 API 计费模型和免费额度
- 快递公司列表和下单接口调通

**平台快递流程：**
```
订单详情页 → 点击「去发货」
  └─ 「在线叫快递」
      └─ 选择快递公司（顺丰/中通/圆通/韵达等）
      └─ 确认寄件/收件地址（自动填入买家收货地址）
      └─ 提交下单 → 自动回填运单号
      └─ 买家端实时显示物流轨迹
```

### 6.4 买家端物流展示

**gb/order/detail 新增物流卡片：**

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

### 6.5 数据库新增字段

```javascript
// gb_order 新增（文档数据库直接加字段即可）
{
  ship_method: 'manual',      // 'platform' | 'cainiao' | 'manual' | 'none'
  carrier_code: '',           // 快递公司代码（SF/ZTO/YD/STO/YTO等）
  carrier_name: '',           // 快递公司名称（顺丰速运/中通快递等）
  tracking_no: '',            // 快递单号（已有字段，扩展使用）
  logistics_status: '',       // 物流状态缓存
  logistics_trace: [],        // 物流轨迹数组缓存
  pickup_code: '',            // 自提码 6 位数字（P3）
  pickup_confirmed: false     // 是否已自提（P3）
}
```

### 6.6 快递公司代码表

| 公司 | 代码 | 客服电话 |
|------|------|----------|
| 顺丰速运 | SF | 95338 |
| 中通快递 | ZTO | 95311 |
| 圆通速递 | YTO | 95554 |
| 申通快递 | STO | 95543 |
| 韵达快递 | YD | 95546 |
| 极兔速递 | JTSD | 956025 |
| 邮政包裹 | YZPY | 11183 |
| 京东物流 | JD | 950616 |
| 德邦快递 | DBL | 95353 |

---

## 七、页面清单

### 7.1 新增页面

| 页面 | 路由 | 说明 | 阶段 |
|------|------|------|------|
| 开团首页 | `gb/groupbuy/index` | 开团类型选择（P0 仅普通可点）| P0 |
| 商品管理 | `gb/groupbuy/product/list` | 我的商品列表 | P0 |
| 商品编辑 | `gb/groupbuy/product/edit` | 创建/编辑商品 | P0 |
| 订单管理 | `gb/groupbuy/order/list` | 我卖出的订单 | P0 |
| 订单详情 | `gb/groupbuy/order/detail` | 卖家视角 + 发货操作 | P0 |

### 7.2 修改页面

| 页面 | 路由 | 变更 | 阶段 |
|------|------|------|------|
| `app.json` | - | Tab 替换 + 新路由注册 | P0 |
| 我的 | `my/index` | 移除团长入口 + 移除 checkRole 调用；新增「我的订单」 | P0 |
| 订单列表 | `gb/order/list` | 保留路由（非 TabBar）；增加物流查看入口 | P1 |
| 订单详情 | `gb/order/detail` | 新增物流卡片 | P1 |

### 7.3 移除内容

| 移除项 | 说明 | 阶段 |
|--------|------|------|
| `gb/leader/*` 全部 6 页面 | 代码迁移到 `gb/groupbuy/*` | P0 |
| `my/index` 中的 `checkRole()` 调用 | 不再需要角色校验 | P0 |
| `common-user` 的 `checkRole` action | 不再需要 | P0 |
| `utils/request.js` 的 `checkRole` 函数 | 无调用方 | P0 |
| `database/phase4-leader.sql` | leader_id 改为 creator_id，role 不再新增 | P0 |

> **说明：** 项目中不存在 `gb/product/edit`。原编辑页路由为 `gb/leader/product/edit`，隶属于团长端模块。本次重构将 `gb/leader/*` 整体替换为 `gb/groupbuy/*`，不存在两套编辑页重叠的问题。

---

## 八、`request.js` API 函数

### 8.1 新增函数（seller 前缀，避免与买家端函数冲突）

```javascript
// 开团 API
sellerGetProducts(params)           // gb-product.myProductList
sellerCreateProduct(params)         // gb-product.createProduct
sellerUpdateProduct(params)         // gb-product.updateProduct
sellerToggleProduct(productId)      // gb-product.toggleProductStatus
sellerGetOrders(params)             // gb-order.myProductOrders
sellerGetOrderDetail(orderId)       // gb-order.sellerOrderDetail
sellerShip(orderId, shipMethod, data)// gb-order.ship（扩展参数）
sellerGetStats()                    // gb-order.mySalesStats
sellerGetProgress()                 // gb-progress.myProgress

// 物流 API（P1+）
getLogisticsTrace(carrierCode, trackingNo)  // gb-logistics.getTrace
```

### 8.2 移除函数

```javascript
checkRole()               // 不再需要角色校验
leaderGetProducts()       // → sellerGetProducts
leaderCreateProduct()     // → sellerCreateProduct
leaderUpdateProduct()     // → sellerUpdateProduct
leaderToggleProduct()     // → sellerToggleProduct
leaderGetOrders()         // → sellerGetOrders
leaderGetOrderDetail()    // → sellerGetOrderDetail
leaderShip()              // → sellerShip
leaderGetStats()          // → sellerGetStats
leaderGetProgress()       // → sellerGetProgress
```

---

## 九、云函数变更汇总

### 9.1 `common-user`

| 变更 | 说明 |
|------|------|
| 移除 `checkRole` action | 不再需要角色校验 |
| `login` 不再写 `role` 字段 | 保留 `common_user.role` 数据库字段不动，仅不再写入 |

### 9.2 `gb-product`

| 变更 | 说明 |
|------|------|
| `leaderCreate` → `createProduct` | 移除 `role === 'leader'` 校验 |
| `leaderUpdate` → `updateProduct` | 校验 `creator_id` 是否为当前用户 |
| `leaderToggle` → `toggleProductStatus` | 同上 |
| `leaderList` → `myProductList` | `leader_id` 字段改为 `creator_id` |
| 新增 `group_type` 字段写入（默认 `'normal'`） | 为预售/自提预留 |

### 9.3 `gb-order`

| 变更 | 说明 |
|------|------|
| `leaderOrders` → `myProductOrders` | `leader_id` → `creator_id` |
| `leaderOrderDetail` → `sellerOrderDetail` | 同上；返回物流信息字段 |
| `leaderStats` → `mySalesStats` | 同上 |
| `ship` 扩展（P0） | 新增 `shipMethod`、`carrierCode`、`carrierName`、`trackingNo` 参数 |

### 9.4 `gb-progress`

| 变更 | 说明 |
|------|------|
| `leaderProgress` → `myProgress` | `leader_id` → `creator_id` |

### 9.5 新增 `gb-logistics`（P1）

- `getTrace` action：调用快递 100 API 查询物流轨迹

---

## 十、开发优先级

### P0：核心入口 + 人人开团 + 手动物流（第一批）

- [ ] `app.json` Tab 结构调整（订单 → 开团）
- [ ] `app.json` 注册 5 个新页面路由
- [ ] `gb/groupbuy/index` 开团首页（P0 仅普通团购可点，另两个置灰 + 锁标）
- [ ] `gb/groupbuy/product/list` 我的商品列表
- [ ] `gb/groupbuy/product/edit` 商品编辑（仅 normal 类型）
- [ ] `gb/groupbuy/order/list` 我的订单列表（卖家视角）
- [ ] `gb/groupbuy/order/detail` 订单详情 + 发货面板（自寄/无物流两种，直接传入 carrier_code + carrier_name + tracking_no）
- [ ] `my/index` 移除团长入口；移除 `checkRole()` 调用；新增「我的订单」
- [ ] `gb/order/list` 保留为普通页面路由（非 TabBar）
- [ ] 云函数 Action 重命名 + `leader_id` → `creator_id`
- [ ] `common-user` 移除 `checkRole` action
- [ ] `request.js` 函数替换（leader* → seller*）
- [ ] 移除 `gb/leader/*` 全部文件
- [ ] 移除 `database/phase4-leader.sql`

### P1：物流追踪 + 买家端物流展示（第二批）

- [ ] `gb/order/detail` 买家端订单详情新增物流卡片
- [ ] `gb/order/list` 买家端订单列表增加物流查看入口
- [ ] `gb-logistics` 云函数创建 + `getTrace` action
- [ ] 物流轨迹缓存与刷新

### P2：平台快递 + 菜鸟裹裹 + 预售团购（第三批）

**前置条件：快递 100 企业认证完成 + API 调通**
- [ ] 「在线叫快递」下单功能
- [ ] 「菜鸟裹裹」跳转 + 单号回填
- [ ] 预售团购类型开通（含 `presale_date` 字段 + 倒计时 UI）

### P3：自提团购 + 物流推送（第四批）

- [ ] 自提团购类型开通（自提地点 + 自提码）
- [ ] 自提码生成与扫码核销
- [ ] 物流状态订阅推送

---

## 十一、风险与待确认项

| 风险/待确认 | 影响 | 建议 |
|-------------|------|------|
| 「开团」Tab 图标需设计 | UI 缺失 | P0 开发前产出图标 |
| 快递 100 企业认证 | 阻塞 P2 全部物流功能 | P0/P1 期间启动认证流程 |
| `gb/order/list` 从 TabBar 降为普通页面 | 需验证页面内 `onTabItemTap` 逻辑是否受影响 | P0 开发时检查 |
| `gb/detail/index` 商品详情页是否兼容 `creator_id` | 买家查看商品时不需要此字段，影响小 | P0 开发时检查 |
