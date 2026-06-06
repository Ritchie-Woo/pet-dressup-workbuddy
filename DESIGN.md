# PetMini · DESIGN.md

> 设计系统：**Notion（温润极简）**
> 基线组件库：TDesign Miniprogram v1.5.0
> 渲染引擎：Skyline + glass-easel
> 基准视口：375pt（竖屏）

---

## 1. Visual Theme · 视觉主题

### 设计哲学

温润、克制、内容优先。不依赖阴影和装饰建立层级，而是通过**排版节奏**和**间距呼吸**让信息自然流动。色彩作为温和的导航信号，而非视觉噪音。

### 五大设计原则

| 原则 | 含义 | 落地方式 |
|------|------|---------|
| **内容优先** | 让宠物穿搭图片、团购商品、MBTI 结果成为视觉主角 | 大图、少边框、低色彩饱和度 |
| **间距即层级** | 用呼吸感代替分割线和阴影 | 8pt 网格 + 三段间距体系 |
| **色彩克制** | 暖橙是导航信号，不是装饰色 | 仅在可交互元素和关键状态使用 |
| **排版叙事** | 字号对比代替视觉装饰 | PingFang SC 六级字号 + 精准行高 |
| **减法思维** | 每增加一个视觉元素都要问「能否去掉」 | 零阴影、统一圆角、最少边框 |

### 情感坐标

```
       温暖 ↑
            │  PetMini (Notion 化)
    冷淡 ←─┼────────→ 热情
            │
            ↓ 冷静
```

PetMini 位于 **温暖 × 克制** 象限——不烫不冰，恰好的体温感。

---

## 2. Color Palette · 色彩体系

### 2.1 品牌色阶（10 级暖橙）

基于 Notion「色彩克制」原则，品牌色仅用于可交互元素、选中态和关键强调。

| 级 | CSS 变量 | HEX | 用途 |
|----|---------|-----|------|
| 1 | `--color-brand-1` | `#FFF6ED` | 大面积暖底（页面背景备用） |
| 2 | `--color-brand-2` | `#FFE8D0` | 选中态背景、标签底色 |
| 3 | `--color-brand-3` | `#FFD4A8` | 悬停态（hover） |
| 4 | `--color-brand-4` | `#FFBA78` | 边框强调（focus ring） |
| 5 | `--color-brand-5` | `#FFA344` | 次要按钮 hover |
| 6 | `--color-brand-6` | `#FF8C00` | **主色基准** — 主按钮、链接、选中文字 |
| 7 | `--color-brand-7` | `#D47300` | 主按钮 press 态 |
| 8 | `--color-brand-8` | `#A85C00` | 深色背景上的品牌色 |
| 9 | `--color-brand-9` | `#7C4400` | 极少使用（深色强调） |
| 10 | `--color-brand-10` | `#502C00` | 极深（品牌氛围） |

### 2.2 暖灰中性色阶（14 级）

Notion 特征：灰中带暖，拒绝纯黑纯白。

| 级 | CSS 变量 | HEX | 用途 |
|----|---------|-----|------|
| 1 | `--color-gray-1` | `#FBFAF9` | 页面底色（替代纯白） |
| 2 | `--color-gray-2` | `#F5F4F1` | 次级背景 / 卡片悬停 |
| 3 | `--color-gray-3` | `#EEEDEA` | 分割填充（代替分割线） |
| 4 | `--color-gray-4` | `#E4E3DF` | 禁用态背景 |
| 5 | `--color-gray-5` | `#D2D0CC` | 禁用态文字 / 弱边框 |
| 6 | `--color-gray-6` | `#B7B5AF` | 占位符文字 |
| 7 | `--color-gray-7` | `#9B9993` | 辅助文字 |
| 8 | `--color-gray-8` | `#7D7B76` | 次要正文 |
| 9 | `--color-gray-9` | `#5F5D59` | 正文（柔和黑） |
| 10 | `--color-gray-10` | `#4A4845` | 标题文字 |
| 11 | `--color-gray-11` | `#37352F` | **Notion 特征黑** — 重要标题 |
| 12 | `--color-gray-12` | `#252320` | 加粗强调 |
| 13 | `--color-gray-13` | `#1A1815` | 极深（极少使用） |
| 14 | `--color-gray-14` | `#0F0E0C` | 最深（极少使用） |

### 2.3 语义功能色

| 语义 | CSS 变量 | HEX | 用途 |
|------|---------|-----|------|
| 成功 | `--color-success` | `#2BA471` | 拼团成功、支付完成 |
| 成功背景 | `--color-success-bg` | `#E3F9E9` | 成功态标签底色 |
| 错误 | `--color-error` | `#D54941` | 删除、失败、警告 |
| 错误背景 | `--color-error-bg` | `#FFF0ED` | 错误态标签底色 |
| 警告 | `--color-warning` | `#E37318` | 即将过期、库存紧张 |
| 警告背景 | `--color-warning-bg` | `#FFF1E9` | 警告态标签底色 |
| 信息 | `--color-info` | `#366EF4` | 提示、帮助 |
| 信息背景 | `--color-info-bg` | `#F2F3FF` | 信息态标签底色 |

### 2.4 背景体系

| 用途 | CSS 变量 | HEX |
|------|---------|-----|
| 页面底色 | `--color-bg-page` | `#FBFAF9` |
| 卡片白 | `--color-bg-card` | `#FFFFFF` |
| 次级面板 | `--color-bg-secondary` | `#F5F4F1` |
| 遮罩层 | `--color-overlay` | `rgba(15, 14, 12, 0.4)` |

### 2.5 文本色（语义化快捷方式）

| 用途 | CSS 变量 | 映射值 |
|------|---------|--------|
| 主标题 | `--color-text-title` | `var(--color-gray-11)` → `#37352F` |
| 正文 | `--color-text-body` | `var(--color-gray-9)` → `#5F5D59` |
| 辅助文字 | `--color-text-secondary` | `var(--color-gray-7)` → `#9B9993` |
| 占位/禁用 | `--color-text-placeholder` | `var(--color-gray-6)` → `#B7B5AF` |
| 品牌色文字 | `--color-text-brand` | `var(--color-brand-6)` → `#FF8C00` |
| 反白文字 | `--color-text-inverse` | `#FFFFFF` |

---

## 3. Typography · 排版体系

### 3.1 字体栈

```css
font-family: -apple-system, "PingFang SC", "Hiragino Sans GB",
             "Microsoft YaHei", "Noto Sans CJK SC", sans-serif;
```

| 层级 | 用途 | 首选字体 |
|------|------|---------|
| 系统 UI | 全部界面 | PingFang SC（iOS）/ Microsoft YaHei（Android） |
| 数字/价格 | 金额展示 | SF Pro Text（iOS）/ Roboto（Android），等宽数字特性 |

### 3.2 字号层级（6 级）

Notion 哲学：字号阶梯温和递进，拒绝跳跃感。

| 级 | CSS 变量 | rpx | px | 用途 |
|----|---------|-----|-----|------|
| caption | `--font-caption` | 22rpx | 11px | 辅助标注、时间戳、角标 |
| body-sm | `--font-body-sm` | 26rpx | 13px | 列表摘要、标签文字 |
| body | `--font-body` | 28rpx | 14px | **基准正文** — 卡片标题、表单、列表项 |
| body-lg | `--font-body-lg` | 32rpx | 16px | 卡片主标题、弹窗标题 |
| title | `--font-title` | 36rpx | 18px | 页面大标题、关键数字 |
| headline | `--font-headline` | 44rpx | 22px | 价格展示、MBTI 结果字母 |

### 3.3 字重

| 用途 | font-weight | 说明 |
|------|------------|------|
| 常规正文 | 400 | 列表项、描述、表单标签 |
| 强调正文 | 500 | 卡片标题、重要数值、链接 |
| 标题 | 600 | 页面标题、MBTI 结果 |
| 特大标题 | 700 | 仅 headline 级价格/结果 |

> Notion 原则：只用 400/500/600/700 四档，避免过细（300）显得瘦弱，也避免整页 600 变成「全页喊叫」。

### 3.4 行高

| 级 | line-height | 说明 |
|----|------------|------|
| caption | 1.5 | 小字需要更多行高保证可读性 |
| body-sm | 1.6 | 列表摘要需要舒适的扫描间距 |
| body | 1.6 | **基准** — 正文标准行高 |
| body-lg | 1.5 | 标题级别，行高略收紧 |
| title | 1.4 | 页面大标题 |
| headline | 1.3 | 数字/结果字母，紧凑有力 |

### 3.5 排版色

| 元素 | 色值 | 说明 |
|------|------|------|
| 一级标题 | `#37352F` | Notion 特征深褐黑，非纯黑 |
| 正文 | `#5F5D59` | 柔和暖灰，长时间阅读不疲劳 |
| 辅助信息 | `#9B9993` | 与背景区分但不抢眼 |
| 链接 | `#FF8C00` | 品牌色用于可点击文字 |
| 价格数字 | `#37352F` | 加粗 + 略大一级 |

---

## 4. Spacing · 间距体系

### 4.1 基准网格：8pt

Notion 哲学：间距是隐形的信息架构。**用间距代替分割线和阴影**。

| 级 | CSS 变量 | rpx | 语义 |
|----|---------|-----|------|
| 2xs | `--space-2xs` | 8rpx | 紧密关联元素（图标-文字间距） |
| xs | `--space-xs` | 16rpx | 组件内部间距（标签组 gap） |
| sm | `--space-sm` | 24rpx | 卡片内边距、列表项间距 |
| md | `--space-md` | 32rpx | 卡片间距、段落间距 |
| lg | `--space-lg` | 48rpx | 区块间距、页面内边距 |
| xl | `--space-xl` | 64rpx | 大区块分离、页面顶部留白 |
| 2xl | `--space-2xl` | 96rpx | 整页级别的呼吸感 |

### 4.2 页面内边距

```css
/* 页面统一水平内边距 */
.page-px { padding-left: var(--space-lg); padding-right: var(--space-lg); }
/* = 48rpx，Notion 的「宽呼吸」原则 */
```

### 4.3 卡片内边距

| 卡片类型 | padding | 说明 |
|----------|---------|------|
| 紧凑卡片（列表项） | 24rpx 32rpx | 信息密度高 |
| 标准卡片（商品卡） | 32rpx | 默认值 |
| 宽松卡片（详情卡） | 32rpx 48rpx | 内容少、需要呼吸 |

### 4.4 间距应用规则

1. **同组元素**用 `xs` 或 `sm`（亲密性）
2. **不同组元素**用 `md` 或 `lg`（分离性）
3. **有间距就不需要分割线** — 如果两个区块之间已经有 `lg` 间距，绝不再加 `border-bottom`

---

## 5. Border Radius · 圆角体系

Notion 特征：统一而克制。不做圆角层级游戏。

| 级 | CSS 变量 | rpx | 用途 |
|----|---------|-----|------|
| 小 | `--radius-sm` | 8rpx | 标签、角标、输入框 |
| 中 | `--radius-md` | 12rpx | **基准** — 卡片、按钮、图片 |
| 大 | `--radius-lg` | 16rpx | 弹窗、大面板 |
| 圆 | `--radius-round` | 999rpx | 药丸标签、头像 |

> **核心规则**：整个应用只有 4 种圆角。不允许出现其他值。与现有原型的差异：现有 `radius-md` 为 16rpx → 下调至 12rpx（更克制），现有 `radius-lg` 为 24rpx → 下调至 16rpx。

---

## 6. Depth & Elevation · 阴影体系

### Notion 核心原则：零阴影

```
❌ box-shadow → 用间距和背景色差代替
❌ 卡片阴影 → 用 1px border 或背景色区分
❌ 浮层阴影 → 仅弹窗/modal 保留极微阴影
```

### 唯一保留的阴影

| 场景 | 值 | 说明 |
|------|-----|------|
| 弹窗/Modal | `0 4rpx 24rpx rgba(0,0,0,0.08)` | 唯一阴影场景 — 模态层需要脱离感 |
| 顶部导航（滚动后） | `0 1rpx 0 var(--color-gray-3)` | 用底部边框代替阴影 |
| 底部操作栏 | `0 -1rpx 0 var(--color-gray-3)` | 同上 |

### 去阴影改造对照

| 现有元素 | 当前样式 | 改造为 |
|----------|---------|--------|
| `.card` | `box-shadow: 0 2rpx 12rpx` | 删除，仅保留 `border: 1rpx solid var(--color-gray-4)` |
| `.pet-bar` | `box-shadow: 0 2rpx 8rpx` | 删除，改为 `border-bottom: 1rpx solid var(--color-gray-3)` |
| `.action-bar` | `box-shadow: 0 -2rpx 8rpx` | 删除，改为 `border-top: 1rpx solid var(--color-gray-3)` |
| `.canvas-placeholder` | `box-shadow: 0 4rpx 20rpx` | 删除 |
| `.ph-btn` | `box-shadow: 0 4rpx 16rpx` | 删除 |

### Z-Index 分层

| 层 | z-index | 元素 |
|----|---------|------|
| 内容层 | 0 | 页面内容 |
| 吸顶层 | 100 | sticky navbar、底部操作栏 |
| 浮层 | 200 | dropdown、tooltip |
| 遮罩 | 300 | overlay |
| 弹窗 | 400 | dialog、popup、toast |

---

## 7. Component Styles · 组件规范

### 7.1 按钮

```css
/* 主按钮 */
.btn-primary {
  height: 88rpx;
  padding: 0 48rpx;
  background: var(--color-brand-6);      /* #FF8C00 */
  color: #FFFFFF;
  font-size: var(--font-body);            /* 28rpx */
  font-weight: 500;
  border-radius: var(--radius-md);        /* 12rpx */
  border: none;
}
.btn-primary:active {
  background: var(--color-brand-7);       /* #D47300 — 加深而非变透明 */
}

/* 次要按钮 */
.btn-secondary {
  height: 88rpx;
  padding: 0 48rpx;
  background: transparent;
  color: var(--color-text-body);          /* #5F5D59 */
  font-size: var(--font-body);
  font-weight: 400;
  border-radius: var(--radius-md);
  border: 1rpx solid var(--color-gray-4); /* #E4E3DF */
}

/* 文字按钮 */
.btn-text {
  color: var(--color-brand-6);
  font-size: var(--font-body);
  font-weight: 500;
  padding: 8rpx 16rpx;
  border-radius: var(--radius-sm);        /* 8rpx */
  background: transparent;
}

/* 危险按钮 */
.btn-danger {
  background: var(--color-error);         /* #D54941 */
  color: #FFFFFF;
  /* 其余同 .btn-primary */
}

/* 禁用态 */
.btn-disabled {
  background: var(--color-gray-4);        /* #E4E3DF */
  color: var(--color-gray-6);             /* #B7B5AF */
  pointer-events: none;
}
```

### 7.2 卡片

```css
/* 标准卡片 — 无阴影 */
.card {
  background: #FFFFFF;
  border-radius: var(--radius-md);        /* 12rpx */
  border: 1rpx solid var(--color-gray-4); /* #E4E3DF */
  padding: var(--space-sm);               /* 24rpx */
}

/* 可点击卡片 — hover 时微变背景 */
.card-interactive:active {
  background: var(--color-gray-2);        /* #F5F4F1 */
}

/* 高亮卡片 — 仅边框着色 */
.card-highlight {
  border-color: var(--color-brand-4);     /* #FFBA78 */
  background: var(--color-brand-1);       /* #FFF6ED */
}

/* 穿搭展示卡 — 图片优先 */
.card-outfit {
  background: #FFFFFF;
  border-radius: var(--radius-md);
  border: 1rpx solid var(--color-gray-4);
  overflow: hidden;
}
.card-outfit .card-image {
  width: 100%;
  aspect-ratio: 1;
}
.card-outfit .card-body {
  padding: var(--space-sm);
}
```

### 7.3 输入框

```css
.input {
  height: 88rpx;
  padding: 0 var(--space-sm);             /* 24rpx */
  background: var(--color-gray-2);        /* #F5F4F1 */
  border: 1rpx solid transparent;
  border-radius: var(--radius-sm);        /* 8rpx */
  font-size: var(--font-body);
  color: var(--color-text-body);
}
.input:focus {
  background: #FFFFFF;
  border-color: var(--color-brand-6);     /* #FF8C00 */
}
.input::placeholder {
  color: var(--color-text-placeholder);   /* #B7B5AF */
}
```

### 7.4 标签

```css
.tag {
  display: inline-flex;
  align-items: center;
  height: 40rpx;
  padding: 0 16rpx;
  font-size: var(--font-caption);         /* 22rpx */
  font-weight: 500;
  border-radius: var(--radius-sm);        /* 8rpx */
}

.tag-default {
  background: var(--color-gray-2);        /* #F5F4F1 */
  color: var(--color-text-secondary);     /* #9B9993 */
}
.tag-brand {
  background: var(--color-brand-2);       /* #FFE8D0 */
  color: var(--color-brand-7);            /* #D47300 */
}
.tag-success {
  background: var(--color-success-bg);
  color: var(--color-success);
}
```

### 7.5 列表项

```css
.list-item {
  display: flex;
  align-items: center;
  padding: var(--space-sm) var(--space-md); /* 24rpx 32rpx */
  background: #FFFFFF;
  min-height: 96rpx;
}
.list-item + .list-item {
  border-top: 1rpx solid var(--color-gray-3); /* 仅项间分割线 */
}
.list-item:active {
  background: var(--color-gray-2);
}
```

### 7.6 导航

```css
/* Tab Bar — 原生微信 TabBar 通过 app.json 配置 */
/* 选中色: #FF8C00, 未选中: #9B9993, 背景: #FFFFFF, 上边框: #EEEDEA */

/* 页面内 Tabs */
.tab-item {
  padding: 16rpx 32rpx;
  font-size: var(--font-body);
  font-weight: 400;
  color: var(--color-text-secondary);     /* #9B9993 */
  border-bottom: 2rpx solid transparent;
}
.tab-item.active {
  color: var(--color-text-body);          /* #5F5D59 */
  font-weight: 600;
  border-bottom-color: var(--color-brand-6);
}
```

### 7.7 弹窗 / Dialog

```css
.dialog {
  background: #FFFFFF;
  border-radius: var(--radius-lg);        /* 16rpx */
  box-shadow: 0 4rpx 24rpx rgba(0,0,0,0.08); /* 唯一阴影 */
  padding: var(--space-md);               /* 32rpx */
}
.dialog-overlay {
  background: var(--color-overlay);       /* rgba(15,14,12,0.4) */
}
```

---

## 8. Layout · 布局规则

### 8.1 页面结构模板

```
┌─────────────────────────────┐
│  status bar (safe-area-top)  │
├─────────────────────────────┤
│  page title      (48rpx px) │
├─────────────────────────────┤
│                             │
│  content area               │
│  (flex: 1, overflow-y)      │
│  gap: 32rpx (card 间距)      │
│                             │
├─────────────────────────────┤
│  bottom bar    (safe-area)  │
└─────────────────────────────┘
```

### 8.2 内容区网格

```css
.page-content {
  padding: var(--space-lg);               /* 48rpx 水平 */
  padding-top: calc(env(safe-area-inset-top) + 88rpx);
}

/* 两列网格（团购列表、穿搭方案） */
.grid-2 {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);                   /* 24rpx */
}
.grid-2 > * {
  width: calc(50% - 12rpx);
}

/* 三列网格（收藏衣橱） */
.grid-3 {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);                   /* 16rpx */
}
.grid-3 > * {
  width: calc(33.333% - 11rpx);
}
```

### 8.3 内容优先的页面布局

| 页面类型 | 布局策略 |
|----------|---------|
| 穿搭主页 | 宠物画布区 `flex:1` 垂直居中，操作栏固定在底部 |
| 团购列表 | 两列网格 + 顶部分类 tabs |
| 地图 | Canvas 全屏，搜索栏悬浮顶部，结果卡片底部抽屉 |
| MBTI 测试 | 单题垂直居中，大段文字 + 选项按钮，留白充足 |
| MBTI 结果卡 | 大字母居中（headline 44rpx），描述文字下方，社交分享按钮底部 |
| 我的 | 头像-昵称区 + 列表式菜单，无卡片包裹 |

### 8.4 安全区适配

```css
.safe-area-top {
  padding-top: constant(safe-area-inset-top);
  padding-top: env(safe-area-inset-top);
}
.safe-area-bottom {
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}
```

---

## 9. Design Principles · 设计原则总结

### 9.1 Do's ✅

- 用 `space-lg`（48rpx）间距区分不同内容区块
- 用 `--color-gray-3`（1rpx border）作为区块间唯一的分割手段
- 卡片白色（#FFF）+ 页面暖灰底（#FBFAF9）→ 靠色差区分层级
- 暖橙仅用于：主按钮、链接、选中态、价格强调
- 正文用 #5F5D59（非纯黑），标题用 #37352F
- 统一圆角：主要 12rpx，小型 8rpx，大型 16rpx
- 拒绝阴影，除非是弹窗

### 9.2 Don'ts ❌

- 不要在卡片上使用 box-shadow
- 不要用超过 4 种圆角值
- 不要在非交互元素上使用品牌色
- 不要用分割线 + 间距同时分隔（二选一，间距优先）
- 不要用纯黑色 #000000 做文字色
- 不要使用渐变背景
- 不要在组件上加多余的装饰（图标底色、彩色边框等）
- 不要引入波纹动效（ripple）和按压缩放（scale）

### 9.3 Agent Prompt Guide

当 AI 生成页面代码时，遵循以下提示：

```
你在为一个「Notion 风格」的宠物穿搭社交小程序编写 WXSS。
设计系统：温润极简、内容优先、零阴影、暖灰色系。

规则：
1. 所有卡片使用 border 而非 box-shadow
2. 文字色用 var(--color-text-*)，禁止写死 #000 或 #333
3. 品牌暖橙仅用于可交互元素
4. 间距统一使用 var(--space-*) 变量
5. 圆角统一使用 var(--radius-*) 变量
6. 页面底色用 var(--color-bg-page)
7. 新增元素前先思考：能否用已有样式（间距/字号/颜色）区分，而非增加新样式
```

---

## 10. TDesign CSS Variable Override Map

将以下映射表写入 `app.wxss` 的 `page {}` 块中，替换原有变量。

### 10.1 品牌色阶覆盖

```css
/* ===== Notion 风格 TDesign 变量覆盖 ===== */
page {
  /* 品牌色阶（原 TDesign 蓝 → PetMini 暖橙） */
  --td-brand-color-1:  #FFF6ED;
  --td-brand-color-2:  #FFE8D0;
  --td-brand-color-3:  #FFD4A8;
  --td-brand-color-4:  #FFBA78;
  --td-brand-color-5:  #FFA344;
  --td-brand-color-6:  #FF8C00;
  --td-brand-color-7:  #D47300;
  --td-brand-color-8:  #A85C00;
  --td-brand-color-9:  #7C4400;
  --td-brand-color-10: #502C00;

  /* 主色别名链 */
  --td-primary-color-1:  var(--td-brand-color-1);
  --td-primary-color-2:  var(--td-brand-color-2);
  --td-primary-color-3:  var(--td-brand-color-3);
  --td-primary-color-4:  var(--td-brand-color-4);
  --td-primary-color-5:  var(--td-brand-color-5);
  --td-primary-color-6:  var(--td-brand-color-6);
  --td-primary-color-7:  var(--td-brand-color-7);
  --td-primary-color-8:  var(--td-brand-color-8);
  --td-primary-color-9:  var(--td-brand-color-9);
  --td-primary-color-10: var(--td-brand-color-10);

  /* 便捷别名（现有代码兼容） */
  --td-brand-color:        var(--td-brand-color-6);
  --td-brand-color-light:  var(--td-brand-color-2);
  --td-brand-color-lighter:var(--td-brand-color-1);
```

### 10.2 中性灰覆盖

```css
  /* 暖灰色阶（替换 TDesign 冷灰） */
  --td-gray-color-1:  #FBFAF9;
  --td-gray-color-2:  #F5F4F1;
  --td-gray-color-3:  #EEEDEA;
  --td-gray-color-4:  #E4E3DF;
  --td-gray-color-5:  #D2D0CC;
  --td-gray-color-6:  #B7B5AF;
  --td-gray-color-7:  #9B9993;
  --td-gray-color-8:  #7D7B76;
  --td-gray-color-9:  #5F5D59;
  --td-gray-color-10: #4A4845;
  --td-gray-color-11: #37352F;
  --td-gray-color-12: #252320;
  --td-gray-color-13: #1A1815;
  --td-gray-color-14: #0F0E0C;
```

### 10.3 语义色覆盖

```css
  /* 警告色（保持暖向，微调） */
  --td-warning-color-1:  #FFF6ED;
  --td-warning-color-2:  #FFE8D0;
  --td-warning-color-3:  #FFD4A8;
  --td-warning-color-4:  #FFBA78;
  --td-warning-color-5:  #FF8C00;
  --td-warning-color-6:  #E37318;
  --td-warning-color-7:  #BE5A00;
  --td-warning-color-8:  #954500;
  --td-warning-color-9:  #713300;
  --td-warning-color-10: #3B1700;
  --td-warning-color:     var(--td-warning-color-6);

  /* 成功色（不变） */
  --td-success-color-1:  #E3F9E9;
  --td-success-color-2:  #C6F3D7;
  --td-success-color-3:  #92DAB2;
  --td-success-color-4:  #56C08D;
  --td-success-color-5:  #2BA471;
  --td-success-color-6:  #008858;
  --td-success-color-7:  #006C45;
  --td-success-color-8:  #005334;
  --td-success-color-9:  #003B23;
  --td-success-color-10: #002515;
  --td-success-color:     var(--td-success-color-5);

  /* 错误色（微调红色偏暖） */
  --td-error-color-1:  #FFF0ED;
  --td-error-color-2:  #FFD8D2;
  --td-error-color-3:  #FFB9B0;
  --td-error-color-4:  #FF9285;
  --td-error-color-5:  #F6685D;
  --td-error-color-6:  #D54941;
  --td-error-color-7:  #AD352F;
  --td-error-color-8:  #881F1C;
  --td-error-color-9:  #68070A;
  --td-error-color-10: #490002;
  --td-error-color:     var(--td-error-color-6);
```

### 10.4 文字色覆盖

```css
  /* 文字色 */
  --td-font-white-1: #FFFFFF;
  --td-font-white-2: rgba(255,255,255,0.55);
  --td-font-white-3: rgba(255,255,255,0.35);
  --td-font-white-4: rgba(255,255,255,0.22);
  --td-font-gray-1:  var(--td-gray-color-11);  /* #37352F 标题 */
  --td-font-gray-2:  var(--td-gray-color-9);   /* #5F5D59 正文 */
  --td-font-gray-3:  var(--td-gray-color-7);   /* #9B9993 辅助 */
  --td-font-gray-4:  var(--td-gray-color-6);   /* #B7B5AF 占位 */

  --td-text-color-primary:    var(--td-font-gray-1);
  --td-text-color-secondary:  var(--td-font-gray-2);
  --td-text-color-placeholder:var(--td-font-gray-4);
  --td-text-color-disabled:   var(--td-font-gray-3);
  --td-text-color-anti:       #FFFFFF;
  --td-text-color-brand:      var(--td-brand-color-6);
  --td-text-color-link:       var(--td-brand-color-6);
```

### 10.5 背景色覆盖

```css
  /* 背景色 */
  --td-bg-color-page:         #FBFAF9;
  --td-bg-color-container:    #FFFFFF;
  --td-bg-color-container-hover: #F5F4F1;
  --td-bg-color-container-active:#EEEDEA;
  --td-bg-color-secondarycontainer: #F5F4F1;
  --td-bg-color-component:    #F5F4F1;
  --td-bg-color-component-hover: #EEEDEA;
  --td-bg-color-component-active:#E4E3DF;
  --td-bg-color-component-disabled:#F5F4F1;
  --td-bg-color-specialcomponent: #FFFFFF;
```

### 10.6 圆角覆盖

```css
  /* 圆角（Notion 化：更克制） */
  --td-radius-small:      8rpx;
  --td-radius-default:    12rpx;
  --td-radius-large:      12rpx;
  --td-radius-extraLarge: 16rpx;
  --td-radius-round:      999rpx;
  --td-radius-circle:     50%;
```

### 10.7 间距覆盖（与 TDesign 默认接近，保持）

```css
  /* 间距 */
  --td-spacer:   16rpx;
  --td-spacer-1: 24rpx;
  --td-spacer-2: 32rpx;
  --td-spacer-3: 48rpx;
  --td-spacer-4: 64rpx;
  --td-spacer-5: 96rpx;
  --td-spacer-6: 160rpx;
```

### 10.8 自定义变量（现有代码兼容）

```css
  /* ===== 自定义变量（兼容现有代码） ===== */
  --color-primary:        var(--td-brand-color-6);
  --color-primary-light:  var(--td-brand-color-2);
  --color-bg-page:        var(--td-bg-color-page);
  --color-bg-card:        var(--td-bg-color-container);
  --color-text-main:      var(--td-font-gray-1);
  --color-text-sub:       var(--td-font-gray-2);
  --color-text-hint:      var(--td-font-gray-3);
  --color-border:         var(--td-gray-color-4);
  --color-shadow:         transparent;  /* Notion: 无阴影 */

  /* 间距 */
  --spacing-xs:  var(--td-spacer);
  --spacing-sm:  var(--td-spacer-1);
  --spacing-md:  var(--td-spacer-2);
  --spacing-lg:  48rpx;
  --spacing-xl:  64rpx;

  /* 圆角 */
  --radius-sm:    var(--td-radius-small);
  --radius-md:    var(--td-radius-default);
  --radius-lg:    var(--td-radius-extraLarge);
  --radius-round: var(--td-radius-round);

  /* 字号 */
  --font-xs:  22rpx;
  --font-sm:  26rpx;
  --font-md:  28rpx;
  --font-lg:  32rpx;
  --font-xl:  36rpx;
  --font-xxl: 44rpx;

  /* 全局基础 */
  font-family: -apple-system, "PingFang SC", "Hiragino Sans GB",
               "Microsoft YaHei", "Noto Sans CJK SC", sans-serif;
  font-size: var(--font-md);
  color: var(--color-text-main);
  background-color: var(--color-bg-page);
  line-height: 1.6;
  box-sizing: border-box;
}
```

---

## 11. Page Retrofit Strategy · 页面改造策略

### 11.1 改造优先级

| 优先级 | 范围 | 页面 | 改造量 | 策略 |
|--------|------|------|--------|------|
| **P0 全局** | app.wxss | — | 变量替换 | 一次性替换所有 CSS 变量 |
| **P1 卡片** | 全部 | 所有含 `.card` 页面 | 删阴影 | 去掉 `box-shadow`，加 `border` |
| **P2 固定栏** | wp/gb/mp/my | pet-bar, action-bar | 微调 | 阴影→底部边框 |
| **P3 按钮** | wp/gb | ph-btn, editor-item | 微调 | 去除阴影，调整圆角 |
| **P4 特殊页** | mbti | test, card | 适配 | 大字号 + 充足留白 |

### 11.2 按页面模块改造清单

#### wp/（穿搭模块）

| 文件 | 改动项 | 具体操作 |
|------|--------|---------|
| `wp/dressup/index.wxss` | `.pet-bar` | `box-shadow` → `border-bottom: 1rpx solid var(--color-border)` |
| | `.action-bar` | `box-shadow` → `border-top: 1rpx solid var(--color-border)` |
| | `.canvas-placeholder` | 删除 `box-shadow` |
| | `.ph-btn` | 删除 `box-shadow: 0 4rpx 16rpx rgba(255,140,0,0.3)` |
| | `.cat-tab` | `border-radius: 999rpx` → `var(--radius-sm)` 8rpx（Notion 标签不用药丸） |
| | `.editor-item` | `box-shadow` → 无，保持 `border` 方案 |
| `wp/share/index.wxss` | 卡片 | 去阴影 |

#### gb/（团购模块）

| 文件 | 改动项 | 具体操作 |
|------|--------|---------|
| `gb/list/index.wxss` | `.card` 类 | 去掉 `box-shadow`，加 `border` |
| | 列表项 | 项间用 `border-top` 而非间距 `margin-bottom` |
| `gb/detail/index.wxss` | 商品图 | `border-radius: var(--radius-md)` 12rpx |
| | 价格 | `font-size: var(--font-xxl)` 44rpx + `font-weight: 700` |
| | 拼团进度条 | 背景 `var(--color-gray-3)`，填充 `var(--color-brand-6)` |
| `gb/order/list.wxss` | 订单卡 | 去阴影 |
| `gb/order/detail.wxss` | 状态标签 | 使用 `.tag-success` / `.tag-warning` 映射 |

#### mp/（地图模块）

| 文件 | 改动项 | 具体操作 |
|------|--------|---------|
| `mp/map/index.wxss` | 搜索栏 | 悬浮卡片：白色背景 + 12rpx 圆角 + 1rpx border，无阴影 |
| | 地点卡片 | 底部抽屉列表：白色 + 顶部圆角 16rpx |
| `mp/place/index.wxss` | 详情卡片 | 去阴影 |

#### mbti/（MBTI 模块）

| 文件 | 改动项 | 具体操作 |
|------|--------|---------|
| `mbti/test/index.wxss` | 题目区 | 大段留白，题目 `var(--font-body-lg)`，选项按钮两列 |
| | 进度条 | `var(--color-gray-3)` 底色 + `var(--color-brand-6)` 填充 |
| `mbti/card/index.wxss` | 结果字母 | `font-size: var(--font-xxl)` 44rpx，`font-weight: 700`，`color: var(--color-brand-6)` |
| | 描述文字 | `var(--font-body)`，`color: var(--color-text-sub)`，行距 1.8 |

#### my/（我的模块）

| 文件 | 改动项 | 具体操作 |
|------|--------|---------|
| `my/index.wxss` | 列表 | 无卡片包裹，直接用 `border-top` 分隔列表项 |
| | 头像 | 圆形 50%，`border: 2rpx solid var(--color-gray-3)` |

### 11.3 改造执行顺序

```
Step 1: 替换 app.wxss（变量全覆盖）              ← 10 分钟
Step 2: 全局搜索 box-shadow → 删除或替换         ← 15 分钟
Step 3: 页面逐一检查间距/圆角/色彩               ← 30 分钟
Step 4: MBTI 页面专项适配                        ← 15 分钟
Step 5: 全局回归测试（18 页）                    ← 20 分钟
────────────────────────────────────────────────
总计：约 90 分钟
```

---

## 附录 A：CSS 变量速查表

```css
/* 快速参考 — 最常用的 20 个变量 */

/* 颜色 */
--color-brand-6:       #FF8C00   /* 主色 */
--color-brand-2:       #FFE8D0   /* 选中背景 */
--color-bg-page:       #FBFAF9   /* 页面底色 */
--color-bg-card:       #FFFFFF   /* 卡片白 */
--color-gray-3:        #EEEDEA   /* 分割填充 */
--color-gray-4:        #E4E3DF   /* 卡片边框 */
--color-gray-11:       #37352F   /* 标题文字 */
--color-gray-9:        #5F5D59   /* 正文 */
--color-gray-7:        #9B9993   /* 辅助文字 */
--color-success:       #2BA471   /* 成功 */
--color-error:         #D54941   /* 错误 */

/* 间距 */
--space-sm:            24rpx     /* 卡片内边距 */
--space-md:            32rpx     /* 卡片间距 */
--space-lg:            48rpx     /* 页面内边距 */

/* 圆角 */
--radius-sm:           8rpx      /* 标签/输入框 */
--radius-md:           12rpx     /* 卡片/按钮 */
--radius-lg:           16rpx     /* 弹窗 */

/* 字号 */
--font-caption:        22rpx     /* 辅助标注 */
--font-body:           28rpx     /* 正文基准 */
--font-title:          36rpx     /* 页面标题 */
--font-headline:       44rpx     /* 价格/MBTI 结果 */
```

---

## 附录 B：变更对照总表

| 属性 | 现有值 | Notion 值 | 变化 |
|------|--------|-----------|------|
| 主色 | `#FF8C00` | `#FF8C00` | 不变 |
| 页面底色 | `#FFF8F0` | `#FBFAF9` | 更接近白，减少黄调 |
| 卡片底色 | `#FFFFFF` | `#FFFFFF` | 不变 |
| 标题文字 | `#333333` | `#37352F` | Notion 特征暖黑 |
| 正文文字 | `#666666` | `#5F5D59` | 更柔和的暖灰 |
| 辅助文字 | `#999999` | `#9B9993` | 微调暖向 |
| 卡片阴影 | `0 2rpx 12rpx` | `none` | **去阴影** |
| 卡片圆角 | `16rpx` / `24rpx` | `12rpx` / `16rpx` | **更克制** |
| 按钮圆角 | `999rpx`（药丸） | `12rpx`（统一） | **去药丸** |
| 分割手段 | 阴影为主 | 间距 + 1rpx border | **范式转变** |

> **核心变化**：从「阴影建立层级」转向「间距 + 色差建立层级」。这是整个改造中唯一的范式级变化，其余均为参数微调。

---

*DESIGN.md v1.0 · 设计系统：Notion（温润极简） · 生成日期：2025-03-14*
