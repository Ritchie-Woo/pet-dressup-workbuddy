## 推荐宠物数据接入 — 操作步骤

### Step 1 — 创建集合
微信开发者工具 → 云开发 → 数据库 → 添加集合 → `wp_recommend_pet`

### Step 2 — 部署云函数
```bash
cd /Users/ritchie/Documents/pet-wb
./deploy-cloudfunctions.sh
```

### Step 3 — 一键造数据
在微信开发者工具中，打开任意页面的调试器 Console，输入：

```js
wx.cloud.callFunction({ name: 'wp-recommend', data: { action: 'seed' } })
  .then(r => console.log('✅', r.result))
```

云函数会自动从 `common_pet` 随机抽取 10 条宠物记录写入推荐池，并为每条随机生成点赞数（50-550）和 3D 形象开关（60% 概率）。

### Step 4 — 验证
编译运行小程序 → 穿搭页 → 推荐宠物区域应显示 3 张真实宠物卡片。
