# dsh-git-abstract

DeepSeek Harness (DSH) 动态 Cordis 插件：**Git 变更摘要按钮**。

页面右上角一个悬浮按钮（⑂），点击弹出当前 git 仓库分支的变更摘要面板——包含 +/- 行数、涉及文件、提交列表、冲突检查等一屏信息。

> 在 DeepSeek Harness Web GUI 中点击右上角按钮即可查看你正在开发仓库的变更总览。

## 功能

- **概览卡片**：文件数 / +新增行 / −删除行 / 净变化 / 未跟踪文件数
- **元信息**：仓库路径、当前分支、upstream 及 ahead/behind、自动探测的基分支、HEAD 提交（短 hash + 提交信息 + 作者 + 时间）
- **未提交变更**：分三组——相对 HEAD 的总变更、已暂存 (staged)、未暂存 (unstaged)，每个文件带状态徽标（改/增/删/移）和 `+x −y` 行数
- **分支提交**：领先基分支的提交列表 + 合并差异统计（基分支按 `upstream → origin/<分支> → origin/main → origin/master → main → master → develop` 自动探测）
- **文件明细**：完整文件表（按变更量排序）、变更最多 TOP5、按扩展名分组、按顶层目录分组
- **附加检查**：未跟踪文件清单、二进制文件数、冲突标记数（`<<<<<<<` 黄色告警）、空白错误、最近 5 条提交、生成时间

所有区块可折叠，配色跟随页面主题（浅色/深色自适应）。

## 工作原理

- **Host 半部**（`plugin/host.js`）：通过 `harness.handle` 注册 `git-summary` RPC，用 `ctx.shell` 执行约 15 条**只读** git 命令（numstat / name-status / porcelain / log / diff --check 等），解析成摘要 JSON。
- **Client 半部**（`plugin/client.js`）：注册在 `shell.overlay` 插槽（页面级浮层），渲染右上角按钮与面板，通过 `host.call('git-summary', …)` 取数。
- 仓库定位：留空时从当前会话工作区向上查找最近的 git 仓库；也可以在面板输入框手动指定仓库路径。

## 安装

前置条件：

- DeepSeek Harness 环境（提供 `shell` / `slots` 服务与 `harness`、`React`、`host`、`styles` 等运行时能力）
- `git` ≥ 2.23

动态 Cordis 插件不需要 npm 安装。在 DSH 会话里让 agent 用 `cordis_define` 定义即可：

1. 把 [`plugin/host.js`](plugin/host.js) 的内容作为 `code.host`；
2. 把 [`plugin/client.js`](plugin/client.js) 的内容作为 `code.client`；
3. `cordis_run` 激活（首次在浏览器端需要授权确认）。

一个等效的说法是：把这两个文件交给会话中的 agent，让它“用 `cordis_define` 定义这个插件（host 代码在 `plugin/host.js`，client 代码在 `plugin/client.js`），然后运行它”。

激活后页面右上角出现按钮，点击即可使用。

## 使用方法

1. 点击右上角 **⑂** 按钮打开面板；
2. 面板自动从当前工作区向上探测 git 仓库；如果工作区不是仓库，在输入框填入仓库路径（如 `/path/to/your/repo`）回车或点“应用”；
3. 查看摘要；点 ⟳ 刷新，点 ✕ 或再点按钮关闭。

## 常见问题

| 现象 | 处理 |
| --- | --- |
| 提示“未找到 git 仓库” | 当前工作区及其父目录都不是仓库，在面板输入框填真实仓库路径 |
| 提示“路径不是可用的 git 仓库” | 确认路径存在且已 `git init` |
| 面板一直转圈 | 大仓库首次计算较慢（最多约 30s/命令）；点 ⟳ 重试 |
| 沙箱拒绝（`denied`） | 只读 git 命令被沙箱拦截时返回错误，可放宽沙箱策略后重试 |

## 目录结构

```
.
├── plugin/
│   ├── host.js      # Host 半部（code.host 函数体）
│   └── client.js    # Client 半部（code.client 函数体）
├── README.md
└── LICENSE
```

## License

[MIT](LICENSE)
