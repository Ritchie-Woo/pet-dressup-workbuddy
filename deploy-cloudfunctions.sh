#!/bin/bash
# 部署所有云函数到微信云开发环境
# 用法: ./deploy-cloudfunctions.sh

ENV_ID="cloud1-d7gqpsxqg5fb00c1b"
CLI="/Applications/wechatwebdevtools.app/Contents/MacOS/cli"
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

# 云函数列表
FUNCTIONS=(
  "common-user"
  "common-pet"
  "common-featureFlag"
  "login-resources"
  "wp-avatar"
  "wp-items"
  "wp-outfits"
  "wp-recommend"
  "gb-product"
  "gb-order"
  "gb-progress"
  "mp-place"
  "mp-checkin"
  "mp-place-stats"
  "mbti-test"
)

echo "========================================"
echo "开始部署云函数到环境: $ENV_ID"
echo "========================================"

for func in "${FUNCTIONS[@]}"; do
  echo ""
  echo "[$func] 部署中..."
  $CLI cloud functions deploy \
    --env "$ENV_ID" \
    --path "$PROJECT_DIR/cloudfunctions/$func"

  if [ $? -eq 0 ]; then
    echo "[$func] ✅ 部署成功"
  else
    echo "[$func] ❌ 部署失败"
  fi
done

echo ""
echo "========================================"
echo "全部完成！"
echo "========================================"
