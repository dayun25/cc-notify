# cc-notify

Claude Code 回复完成时弹窗通知，样式可自定义。

## 另一台电脑安装

```bash
# 1. 把项目拷贝过去（git clone 或 U盘）
git clone <repo-url> cc-notify && cd cc-notify

# 2. 一键安装
bash setup.sh

# 3. 重启终端
source ~/.bashrc
```

**安装了什么：**
- `~/.claude/hooks/capture-prompt.js` — 捕获提问内容
- `~/.claude/hooks/notify.ps1` — 浮动窗口通知（读 style.json）
- `~/.claude/settings.json` — 自动配置 UserPromptSubmit + Stop hooks
- `cc-notify` 全局命令 — Web 管理面板

## 两种模式

| 模式 | 命令 | 适用 |
|------|------|------|
| 仅 Hook | `bash setup.sh --hook-only` | 只要弹窗，不需要调样式 |
| 完整 | `bash setup.sh --full` | Hook + Web 管理面板 |

## 使用方法

```bash
cc-notify web         # 启动样式管理面板 → http://localhost:3789
# 调样式 → 保存并测试 → 立即生效

# 或者直接编辑
notepad ~/.config/cc-notify/style.json
```

## 工作流程

```
Claude Code 输出完成
  → Stop hook 触发
  → notify.ps1 读取 ~/.config/cc-notify/style.json
  → 右下角弹出浮动窗口
```

## 项目结构

```
cc-notify/
├── hooks/              ← 给 Claude Code 用的 hook 脚本
│   ├── capture-prompt.js
│   └── notify.ps1
├── src/                ← Web 管理面板 + CLI
│   ├── cli/
│   ├── web/
│   ├── engine/
│   └── providers/
├── setup.sh            ← 一键安装
└── dist/               ← 编译产物
```
