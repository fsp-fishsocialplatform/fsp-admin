#!/bin/bash
set -e

RELEASE_BRANCH="release"

# Step 1: 记住当前分支
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

if [ "$CURRENT_BRANCH" = "$RELEASE_BRANCH" ]; then
  echo "Error: 当前已在 $RELEASE_BRANCH 分支，请切换到其他分支后再执行。"
  exit 1
fi

echo "当前分支: $CURRENT_BRANCH"

# 有未提交的改动则先 stash
STASHED=false
if ! git diff --quiet || ! git diff --cached --quiet || [ -n "$(git ls-files --others --exclude-standard)" ]; then
  echo "检测到未提交的改动，暂存中..."
  git stash push -u -m "merge-to-release auto stash"
  STASHED=true
fi

# Step 2: 切到 release 分支，从远端拉取最新
echo "切换到 $RELEASE_BRANCH 并拉取远端..."
git checkout "$RELEASE_BRANCH"
git pull origin "$RELEASE_BRANCH"

# Step 3: 合并当前分支到 release，推到远端
echo "合并 $CURRENT_BRANCH 到 $RELEASE_BRANCH..."
git merge "$CURRENT_BRANCH" --no-ff -m "Merge branch '$CURRENT_BRANCH' into $RELEASE_BRANCH"

echo "推送 $RELEASE_BRANCH 到远端..."
git push origin "$RELEASE_BRANCH"

# Step 4: 切回原分支
echo "切回 $CURRENT_BRANCH..."
git checkout "$CURRENT_BRANCH"

# 还原之前 stash 的改动
if [ "$STASHED" = true ]; then
  echo "还原暂存的改动..."
  git stash pop
fi

echo "完成。"
