# PetMini · 图标规范

> 设计系统：Notion 温润极简 | 图标库：TDesign Icons (Miniprogram)
> 基准尺寸：48rpx (24px) | 颜色：`#5F5D59` (正文) / `#9B9993` (辅助) / `#FF8C00` (品牌强调)

---

## 1. 引用方式

```xml
<!-- 微信小程序中引用 TDesign Icon -->
<t-icon name="icon-name" size="48rpx" color="#5F5D59" />
```

所有页面使用 TDesign Miniprogram 内置图标组件，不引入第三方图标库。

---

## 2. 图标尺寸

| 场景 | 尺寸 (rpx) | 示例 |
|------|-----------|------|
| **小图标**（标签内、行内辅助） | 32rpx | 标签内关闭、列表箭头 |
| **标准图标**（导航、列表项、Tab） | 48rpx | 菜单图标、功能入口 |
| **大图标**（空状态、欢迎页） | 80rpx | 空状态插图 |
| **超大图标**（结果页） | 120rpx | MBTI 结果装饰 |

---

## 3. 图标颜色

| 场景 | 颜色 | 色值 |
|------|------|------|
| **默认 UI**（导航、菜单、列表） | 正文暖灰 | `#5F5D59` |
| **辅助**（信息提示、次要入口） | 辅助暖灰 | `#9B9993` |
| **品牌强调**（选中态、关键操作） | 暖橙 | `#FF8C00` |
| **成功**（完成、通过） | 语义成功 | `#2BA471` |
| **错误**（删除、失败、警告） | 语义错误 | `#D54941` |
| **反白**（主按钮内、深色背景上） | 纯白 | `#FFFFFF` |

---

## 4. 各模块图标清单

### 4.1 Tab Bar（底部导航）

| Tab | TDesign Icon | 尺寸 |
|-----|-------------|------|
| 穿搭 | `gesture-click` | 44rpx |
| 团购 | `shop` | 44rpx |
| 地图 | `location` | 44rpx |
| 我的 | `user` | 44rpx |

### 4.2 穿搭模块 (wp/)

| 场景 | TDesign Icon | 尺寸 | 颜色 |
|------|-------------|------|------|
| 切换宠物 | `swap` | 48rpx | `#5F5D59` |
| 保存穿搭 | `download` | 48rpx | `#FF8C00` |
| 分享 | `share` | 48rpx | `#FF8C00` |
| 随机搭配 | `refresh` | 48rpx | `#5F5D59` |
| 撤销 | `rollback` | 48rpx | `#9B9993` |
| 服饰分类 | `view-list` | 40rpx | `#9B9993` |

### 4.3 团购模块 (gb/)

| 场景 | TDesign Icon | 尺寸 | 颜色 |
|------|-------------|------|------|
| 搜索 | `search` | 40rpx | `#9B9993` |
| 购物车 | `cart` | 48rpx | `#FF8C00` |
| 收藏 | `star` | 40rpx | `#9B9993` |
| 收藏（已） | `star-filled` | 40rpx | `#FF8C00` |
| 分享商品 | `share` | 40rpx | `#9B9993` |
| 右箭头 | `chevron-right` | 36rpx | `#9B9993` |
| 筛选 | `filter` | 40rpx | `#5F5D59` |

### 4.4 订单模块

| 场景 | TDesign Icon | 尺寸 | 颜色 |
|------|-------------|------|------|
| 待支付 | `wallet` | 48rpx | `#E37318` |
| 待发货 | `package` | 48rpx | `#FF8C00` |
| 待收货 | `delivery` | 48rpx | `#366EF4` |
| 已完成 | `check-circle` | 48rpx | `#2BA471` |
| 已取消 | `close-circle` | 48rpx | `#9B9993` |
| 物流 | `truck` | 48rpx | `#5F5D59` |

### 4.5 地图模块 (mp/)

| 场景 | TDesign Icon | 尺寸 | 颜色 |
|------|-------------|------|------|
| 当前位置 | `location` | 48rpx | `#FF8C00` |
| 搜索地点 | `search` | 40rpx | `#9B9993` |
| 导航 | `navigation` | 48rpx | `#366EF4` |
| 电话 | `call` | 48rpx | `#2BA471` |
| 宠物友好标识 | `heart` | 36rpx | `#D54941` |
| 评分星星 | `star-filled` | 32rpx | `#FF8C00` |

### 4.6 MBTI 模块 (mbti/)

| 场景 | TDesign Icon | 尺寸 | 颜色 |
|------|-------------|------|------|
| 上一步 | `chevron-left` | 48rpx | `#5F5D59` |
| 下一步 | `chevron-right` | 48rpx | `#FF8C00` |
| 重新测试 | `refresh` | 48rpx | `#9B9993` |
| 分享结果 | `share` | 48rpx | `#FF8C00` |

### 4.7 我的模块 (my/)

| 场景 | TDesign Icon | 尺寸 | 颜色 |
|------|-------------|------|------|
| 我的宠物 | `heart` | 48rpx | `#FF8C00` |
| 我的穿搭 | `gesture-click` | 48rpx | `#5F5D59` |
| 我的订单 | `file-paste` | 48rpx | `#5F5D59` |
| 收货地址 | `location` | 48rpx | `#5F5D59` |
| 设置 | `setting` | 48rpx | `#9B9993` |
| 右箭头 | `chevron-right` | 36rpx | `#9B9993` |

### 4.8 公共模块 (common/)

| 场景 | TDesign Icon | 尺寸 | 颜色 |
|------|-------------|------|------|
| 宠物档案 | `user-avatar` | 48rpx | `#5F5D59` |
| 添加宠物 | `add` | 48rpx | `#FF8C00` |
| 编辑 | `edit` | 40rpx | `#5F5D59` |
| 删除 | `delete` | 40rpx | `#D54941` |
| 相机（拍照) | `camera` | 48rpx | `#5F5D59` |
| 相册 | `image` | 48rpx | `#5F5D59` |
| 关闭 | `close` | 48rpx | `#5F5D59` |
| 提示/说明 | `info-circle` | 40rpx | `#366EF4` |
| 成功 | `check-circle` | 48rpx | `#2BA471` |
| 失败/错误 | `close-circle` | 48rpx | `#D54941` |
| 警告 | `error-circle` | 48rpx | `#E37318` |
| 加载中 | `loading` | 48rpx | `#FF8C00` |

### 4.9 通用/系统

| 场景 | TDesign Icon | 尺寸 | 颜色 |
|------|-------------|------|------|
| 返回 | `chevron-left` | 48rpx | `#37352F` |
| 更多 | `ellipsis` | 48rpx | `#5F5D59` |
| 首页 | `home` | 48rpx | `#5F5D59` |
| 搜索 | `search` | 40rpx | `#9B9993` |
| 通知 | `notification` | 48rpx | `#5F5D59` |
| 扫码 | `scan` | 48rpx | `#5F5D59` |

---

## 5. 图标使用规则

### Do's ✅
- 同场景同尺寸：列表项图标统一 48rpx
- 颜色语义化：交互图标用暖橙，信息图标用暖灰，危险操作用红色
- 保持间距：图标与文字间距统一 8rpx（`--space-2xs`）
- Tab Bar 图标：选中 `#FF8C00`，未选中 `#9B9993`

### Don'ts ❌
- 不要在同一列表混用不同尺寸图标
- 不要用 emoji 代替图标（跨平台渲染不一致）
- 不要给图标加多余底色（除非是圆形功能按钮）
- 不要使用第三方图标库（统一 TDesign Icons）

---

## 6. 圆形功能按钮（带底色图标）

部分场景需要图标 + 圆形背景：

```css
.icon-circle {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: var(--color-brand-1);    /* #FFF6ED */
  display: flex;
  align-items: center;
  justify-content: center;
}
.icon-circle > .t-icon {
  color: var(--color-brand-6);         /* #FF8C00 */
}
```

应用场景：穿搭操作栏按钮、宠物选择入口、空状态引导图标。

---

*图标规范 v1.0 · 2025-06-05*
