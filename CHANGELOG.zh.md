# 更新日志

> **English: [CHANGELOG.md](CHANGELOG.md)**

本仓库采用 [语义化版本](https://semver.org/lang/zh-CN/)。

## [0.3.0] - 2026-08-14

### 新增
- 切换 DSH 工作区时面板**自动刷新**（监听当前会话 cwd 变化）
- UI 全面对齐 DSH 主题：使用真实主题 token（`--dsw-alias-*`，浅色/深色自适应）、DSH 语义色（新增绿 / 删除红 / 冲突琥珀）、小号幽灵悬浮按钮
- 调试区仅在有错误或发生环境降级（`attempt > 1`）时显示

### 修复
- 对 git 输出的仓库路径 / 分支名 / upstream 做 trim，消除 stdout 尾部换行导致的路径错误（`cannot change to '...abstract '`）
- 第 4 级直连执行改为 `cwd=/` + `git -C <仓库>`，规避插件上下文 cwd 不可用导致的 `spawn ENOENT`

## [0.2.0] - 2026-08-14

### 新增
- 诊断信息（探测起点 / 兜底根 / 检测仓库 / 失败命令 stderr / 环境探测）
- Client 端从会话列表取当前工作区 cwd 作为仓库探测起点（`useSessions`，缺失时兜底 `useWorkspaces`）
- 环境探测（probe）辅助排查 spawn 类问题

### 修复
- CSS 常量在 `return` 之后导致的 TDZ 报错
- 区分"真正 unborn 仓库"与"git 命令失败"，不再把失败误报为 unborn
- 沙箱 runner（bwrap）缺失时降级为无沙箱执行
- 标准 PATH 注入，解决宿主 PATH 缺少系统目录（`spawn bash/bwrap ENOENT`）
- `ctx.subprocess` 直连兜底（绝对路径 `/bin/sh` + 命令内 `export PATH`）

## [0.1.0] - 2026-08-14

### 新增
- 会话头部 Session log 旁的按钮（⑂）与摘要面板（注册在 `conversation.session.header.utilities` 插槽）
- Host 端 `git-summary` RPC：约 15 条只读 git 命令并解析
- 摘要内容：概览卡、元信息、未提交/已暂存/未暂存、分支提交、文件明细（TOP5/按扩展名/按目录）、附加检查（未跟踪/二进制/冲突标记/空白错误/最近提交）
- 仓库自动探测（工作区向上查找）与手动路径输入
- 仓库与文档发布到 GitHub（`dsh-git-abstract`）
