# PetMini · 交互态规范

> 设计系统：Notion 温润极简 | 基线：TDesign Miniprogram v1.5.0

---

## 1. 按钮交互态

### 主按钮 (Primary)

| 状态 | 背景色 | 文字色 | 边框 | 说明 |
|------|--------|--------|------|------|
| **default** | `#FF8C00` | `#FFFFFF` | none | 暖橙基准 |
| **hover** (web) | `#FFA344` | `#FFFFFF` | none | 提亮 1 级 |
| **press** (active) | `#D47300` | `#FFFFFF` | none | **加深而非变透明** ⚠️ |
| **loading** | `#FFBA78` | `#FFFFFF` | none | 色调减淡，显示 spinner |
| **disabled** | `#E4E3DF` | `#B7B5AF` | none | 灰化，pointer-events: none |

> ⚠️ Notion 原则：按下态**加深**背景色（品牌色阶 +1），而非降低 opacity。避免「浮起感」。

### 次要按钮 (Secondary)

| 状态 | 背景色 | 文字色 | 边框 |
|------|--------|--------|------|
| **default** | `transparent` | `#5F5D59` | `1px solid #E4E3DF` |
| **hover** | `#F5F4F1` | `#5F5D59` | `1px solid #D2D0CC` |
| **press** | `#EEEDEA` | `#37352F` | `1px solid #D2D0CC` |
| **disabled** | `transparent` | `#B7B5AF` | `1px solid #EEEDEA` |

### 文字按钮 (Text)

| 状态 | 背景色 | 文字色 | 边框 |
|------|--------|--------|------|
| **default** | `transparent` | `#FF8C00` | none |
| **hover** | `#FFF6ED` | `#FF8C00` | none |
| **press** | `#FFE8D0` | `#D47300` | none |
| **disabled** | `transparent` | `#B7B5AF` | none |

### 危险按钮 (Danger)

| 状态 | 背景色 | 文字色 |
|------|--------|--------|
| **default** | `#D54941` | `#FFFFFF` |
| **press** | `#AD352F` | `#FFFFFF` |
| **disabled** | `#E4E3DF` | `#B7B5AF` |

---

## 2. 卡片交互态

### 可点击卡片

| 状态 | 背景色 | 边框 | 说明 |
|------|--------|------|------|
| **default** | `#FFFFFF` | `1px solid #E4E3DF` | 无阴影 |
| **press** (active) | `#F5F4F1` | `1px solid #E4E3DF` | **背景微变，边框不变** ⚠️ |
| **selected** | `#FFF6ED` | `1px solid #FFBA78` | 暖橙色强调 |

> ⚠️ 卡片**绝不抬升**（不用 transform/阴影）。按下仅改变背景色。

---

## 3. 输入框交互态

| 状态 | 背景色 | 边框 | 文字色 |
|------|--------|------|--------|
| **default** | `#F5F4F1` | `1px solid transparent` | `#5F5D59` |
| **focus** | `#FFFFFF` | `1px solid #FF8C00` | `#37352F` |
| **filled** | `#FFFFFF` | `1px solid #E4E3DF` | `#37352F` |
| **error** | `#FFFFFF` | `1px solid #D54941` | `#5F5D59` |
| **disabled** | `#F5F4F1` | `1px solid transparent` | `#B7B5AF` |

Placeholder: `#B7B5AF`，14px（28rpx）

---

## 4. 标签交互态

| 状态 | 示例 | 背景色 | 文字色 |
|------|------|--------|--------|
| **default** | 普通标签 | `#F5F4F1` | `#9B9993` |
| **brand** | 品牌标签 | `#FFE8D0` | `#D47300` |
| **success** | 拼团成功 | `#E3F9E9` | `#2BA471` |
| **warning** | 即将过期 | `#FFF1E9` | `#E37318` |
| **error** | 已取消 | `#FFF0ED` | `#D54941` |

标签无 hover 态（不可交互时只做状态展示）。

---

## 5. 列表项交互态

| 状态 | 背景色 | 说明 |
|------|--------|------|
| **default** | `#FFFFFF` | — |
| **press** | `#F5F4F1` | 整行变色 |
| **swipe-reveal** | 露出操作按钮 | 左滑删除（微信原生） |

项间分割：`border-top: 1px solid #EEEDEA`

---

## 6. Tab / 导航交互态

| 状态 | 文字色 | 字重 | 下划线 |
|------|--------|------|--------|
| **inactive** | `#9B9993` | 400 | `transparent` |
| **active** | `#5F5D59` | 600 | `2px solid #FF8C00` |
| **hover** (web) | `#5F5D59` | 400 | `transparent` |

---

## 7. 弹窗 / Dialog

| 状态 | 说明 |
|------|------|
| **open** | 遮罩 `rgba(15,14,12,0.4)` + 弹窗渐入（fadeIn 0.2s） |
| **close** | 渐出（fadeOut 0.15s） |
| **backdrop press** | 默认关闭（微信标准行为） |

弹窗本身：白底 + 16rpx 圆角 + 唯一阴影 `0 2px 12px rgba(0,0,0,0.08)`

---

## 8. 加载态

| 场景 | 方案 |
|------|------|
| **全页加载** | TDesign Skeleton 骨架屏（商品列表、宠物列表） |
| **按钮加载** | 按钮内 spinner（#FFFFFF 或 #FF8C00 取决于按钮底色）+ "加载中…" |
| **图片加载** | 浅灰占位 `#F5F4F1` + 图片淡入（opacity 0→1, 0.3s） |
| **下拉刷新** | 微信原生下拉刷新（TDesign pull-down-refresh 组件） |
| **toast loading** | "处理中…" + spinner |

---

## 9. 空状态 / 错误态

| 场景 | 方案 |
|------|------|
| **列表为空** | TDesign Empty 组件 + 引导文案（"还没有宠物档案，去创建吧"） |
| **网络错误** | "网络开小差了" + 重试按钮（次要按钮样式） |
| **数据加载失败** | "加载失败" + 重试按钮 |
| **表单校验错误** | 输入框边框变红 + 下方红色提示文字（`#D54941`，11px） |

---

## 10. 动效规范

| 类型 | 时长 | 缓动 | 说明 |
|------|------|------|------|
| 页面转场 | 0.3s | ease-out | 微信原生 slide-in |
| 弹窗出现 | 0.2s | ease-out | opacity + scale |
| 弹窗消失 | 0.15s | ease-in | opacity |
| 图片加载 | 0.3s | ease-out | opacity 0→1 |
| 按钮 press | 0s | — | 即时变色，无 transition |
| Tab 切换 | 0.2s | ease-out | 下划线滑动 |
| Toast | 0.2s in / 0.15s out | — | TDesign 默认 |

> Notion 原则：动效服务于「安静」。不引入弹跳（spring）、缩放（scale）、旋转等花哨动效。

---

## 11. 状态速查

```
┌─────────────────────────────────────────────────────┐
│  组件状态矩阵                                        │
│                                                     │
│         default  hover   press   focus   disabled    │
│  主按钮   🟠       🟠       🟠🟠     —       ⬜       │
│  次按钮   ⬜       ⬜       ⬜       —       ⬜       │
│  文字按钮 🟠       ⬜       🟠       —       ⬜       │
│  卡片     ⬜        —       ⬜       —        —       │
│  输入框   ⬜        —        —       🟠       ⬜       │
│  列表项   ⬜        —       ⬜       —        —       │
│  Tab     ⬜        —        —       🟠       —       │
└─────────────────────────────────────────────────────┘

🟠 = 品牌暖橙色系    ⬜ = 暖灰色系    空白 = 无此状态
```

---

*交互态规范 v1.0 · 2025-06-05*
