#!/bin/bash
# cc-notify 一键安装
# bash setup.sh [--full|--hook-only]

set -e
MODE="${1:---full}"
DIR="$(cd "$(dirname "$0")" && pwd)"
HOOK_DIR="$HOME/.claude/hooks"
CONFIG_DIR="$HOME/.config/cc-notify"

echo "=== cc-notify ==="

mkdir -p "$HOOK_DIR" "$CONFIG_DIR"

# 1. 安装 hook 脚本
echo "[1/3] hooks..."
cp "$DIR/hooks/capture-prompt.js" "$HOOK_DIR/"
cp "$DIR/hooks/notify.ps1" "$HOOK_DIR/"

# 2. 注入 hooks 到 settings.json
echo "[2/3] settings.json..."
SETTINGS="$HOME/.claude/settings.json"
NPS1_PATH=$(echo "$HOOK_DIR/notify.ps1" | sed 's|/|\\\\|g')

if grep -q "capture-prompt.js" "$SETTINGS" 2>/dev/null; then
  echo "  hooks already configured, skip"
else
  node -e "
const fs = require('fs');
const s = JSON.parse(fs.readFileSync('$SETTINGS','utf-8'));
s.hooks = s.hooks || {};
s.hooks.UserPromptSubmit = s.hooks.UserPromptSubmit || [];
s.hooks.UserPromptSubmit.push({hooks:[{type:'command',command:'node \"$HOOK_DIR/capture-prompt.js\"'.replace(/\\\\//g,'/')}]});
s.hooks.Stop = s.hooks.Stop || [];
const psCmd = 'powershell -ExecutionPolicy Bypass -Command \"Add-Type -AssemblyName System.Windows.Forms,System.Drawing; & \\\\'\"' + '$HOOK_DIR' + '/notify.ps1' + '\\\\'\\\"\"'.replace(/\\\\//g,'/');
s.hooks.Stop.push({hooks:[{type:'command',command:psCmd}]});
fs.writeFileSync('$SETTINGS', JSON.stringify(s,null,2));
console.log('  hooks added');
" 2>/dev/null || {
    echo "  auto-inject failed, please add manually:"
    echo "  UserPromptSubmit → node $HOOK_DIR/capture-prompt.js"
    echo "  Stop → powershell ... & '$HOOK_DIR/notify.ps1'"
  }
fi

# 3. CLI (full)
if [ "$MODE" = "--full" ]; then
  echo "[3/3] build + alias..."
  cd "$DIR" && npm install --silent && npm run build 2>/dev/null
  BRC="$HOME/.bashrc"
  ALIAS_LINE="alias cc-notify=\"node '$DIR/dist/cli/cli.js'\""
  if ! grep -q "cc-notify" "$BRC" 2>/dev/null; then
    echo "$ALIAS_LINE" >> "$BRC"
    echo "  alias added"
  fi
  echo ""
  echo "=== done ==="
  echo "  source ~/.bashrc"
  echo "  cc-notify web   → http://localhost:3789"
else
  echo "[3/3] skip"
  echo ""
  echo "=== done (hook only) ==="
fi

echo "Files:"
echo "  $HOOK_DIR/capture-prompt.js"
echo "  $HOOK_DIR/notify.ps1"
echo "  $CONFIG_DIR/style.json        (created on first save)"

# Check for lark-cli (optional, for 飞书通知)
if command -v lark-cli &>/dev/null; then
  echo ""
  echo "飞书通知: lark-cli detected, enabled by default"
  echo "  If not logged in: lark-cli auth login"
else
  echo ""
  echo "飞书通知: lark-cli not installed (optional)"
  echo "  Install:  npm i -g @larksuite/cli"
  echo "  Login:    lark-cli auth login"
fi
