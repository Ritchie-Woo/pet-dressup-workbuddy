# 设计交接包 · 设计师速查

> PetMini · Notion 温润极简 · 2025-06-05

---

## 📦 交接包内容

| # | 文件 | 用途 | 谁用 |
|---|------|------|------|
| 1 | `notion-style-guide.html` | 视觉风格指南（浏览器打开） | 设计师 / 产品 |
| 2 | `figma-tokens.json` | Figma 一键导入（Tokens Studio 插件） | UI 设计师 |
| 3 | `interaction-states.md` | 组件交互态完整定义 | UI 设计师 / 前端 |
| 4 | `icon-spec.md` | TDesign 图标清单（按模块） | UI 设计师 / 前端 |
| 5 | `../DESIGN.md` | 完整设计令牌文档（11 章） | 前端 |
| 6 | `../miniprogram/app.wxss` | 全局样式（可直接用） | 前端 |

---

## 🎨 设计师 3 步上手

### Step 1：看风格指南
浏览器打开 `notion-style-guide.html`，理解：
- 设计哲学（温润、克制、内容优先）
- 色彩体系（10 级暖橙 + 14 级暖灰）
- 组件规范（按钮/卡片/输入框/标签）
- 6 个关键页面预览

### Step 2：导入 Figma Tokens
1. Figma 安装 **Tokens Studio** 插件
2. Import → `figma-tokens.json`
3. 所有色彩、字号、间距、圆角自动创建为 Figma Styles

### Step 3：开始画原型
参考 `interaction-states.md` 定义每个组件的交互态，参考 `icon-spec.md` 选图标。

---

## 💻 前端 3 步上手

### Step 1：读 DESIGN.md
项目根目录 `DESIGN.md`——所有 CSS 变量定义、组件样式、布局规则。

### Step 2：替换 app.wxss
`miniprogram/app.wxss` 已包含：
- 完整的 TDesign CSS 变量覆盖（暖橙 + 暖灰）
- 工具类（flex/text/spacing/card）
- 全局基础样式

### Step 3：读页面 WXSS
14 个页面 WXSS 全部按 Notion 规范改造完成，直接参考即可。

---

## 🔑 核心设计决策速查

| 决策 | 值 |
|------|-----|
| 设计系统 | Notion 温润极简 |
| 主色 | `#FF8C00`（仅交互元素） |
| 背景 | `#FBFAF9`（页面）/ `#FFFFFF`（卡片） |
| 标题 | `#37352F` · 600 · 18px |
| 正文 | `#5F5D59` · 400 · 14px |
| 圆角 | 8/12/16px（仅 4 档） |
| 阴影 | **零阴影**（仅弹窗例外） |
| 按钮 | 12px 圆角（非药丸） |
| 分割 | 1px border + 间距（不用阴影） |
| 图标 | TDesign Icons，48rpx 标准 |
| 字体 | PingFang SC |
| 间距 | 8pt 网格 |

---

## ⚠️ 常见误区

| ❌ 不要 | ✅ 应该 |
|--------|--------|
| 给卡片加阴影 | 用 1px #E4E3DF 边框 + 白色底区分 |
| 按钮用药丸圆角 999px | 统一用 12px 圆角 |
| 标题用 #000000 | 用 #37352F（Notion 暖黑） |
| 正文用 #666666 | 用 #5F5D59（暖灰） |
| 暖橙色大面积铺背景 | 仅用于可交互元素 |
| 用 emoji 做图标 | 用 TDesign Icon |
| 加渐变背景 | 纯色背景 |
| 用弹跳动效 | fadeIn/fadeOut 0.2-0.3s |

---

*设计交接包 v1.0*
