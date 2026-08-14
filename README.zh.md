# dsh-git-abstract

DeepSeek Harness (DSH) 的**动态 Cordis 插件**：Git 变更摘要按钮。

会话头部（Session log 旁）一个 ⑂ 按钮，点击弹出当前 git 仓库分支的变更摘要面板——+/- 行数、涉及文件、提交列表、冲突检查等一屏信息，配色与 DSH 主题一致。

> 适用于 DeepSeek Harness Web GUI：点一下按钮，就能看到当前工作区所在 git 仓库的变更全貌。

> **English: [README.md](README.md)**
[![Stars](https://img.shields.io/github/stars/Lings01/dsh-git-abstract?style=flat-square&label=Stars)](https://github.com/Lings01/dsh-git-abstract/stargazers)
[![Downloads](https://img.shields.io/github/downloads/Lings01/dsh-git-abstract/total?style=flat-square&label=Downloads)](https://github.com/Lings01/dsh-git-abstract/releases)
[![License](https://img.shields.io/github/license/Lings01/dsh-git-abstract?style=flat-square)](https://github.com/Lings01/dsh-git-abstract/blob/main/LICENSE)
[![Last commit](https://img.shields.io/github/last-commit/Lings01/dsh-git-abstract?style=flat-square&label=Last%20commit)](https://github.com/Lings01/dsh-git-abstract/commits/main)
[![Repo size](https://img.shields.io/github/repo-size/Lings01/dsh-git-abstract?style=flat-square&label=Repo%20size)](https://github.com/Lings01/dsh-git-abstract)


## 特性

- **概览卡片**：文件数 / +新增行 / −删除行 / 净变化 / 未跟踪文件数
- **元信息**：仓库路径、当前分支、upstream 及 ahead/behind、自动探测的基分支、HEAD 提交（短 hash + 提交信息 + 作者 + 时间）
- **未提交变更**：分三组——相对 HEAD 的总变更、已暂存 (staged)、未暂存 (unstaged)，每个文件带状态徽标（改/增/删/移/新）和 `+x −y` 行数
- **分支提交**：领先基分支的提交列表 + 合并差异统计（基分支按 `upstream → origin/<分支> → origin/main → origin/master → main → master → develop` 自动探测）
- **文件明细**：按变更量排序的完整文件表、变更最多 TOP5、按扩展名分组、按顶层目录分组
- **附加检查**：未跟踪文件清单、二进制文件数、冲突标记数（`<<<<<<<` 琥珀色告警）、空白错误、最近 5 条提交、生成时间
- **仓库自动定位**：从当前会话工作区向上查找最近的 git 仓库；**切换工作区自动刷新**
- **跨环境自适应**：不依赖宿主 PATH 完整性和沙箱 runner，四级降级自动执行（详见 [安装教程 → 跨环境兼容](docs/INSTALL.zh.md#跨环境兼容)）
- **DSH 主题一致**：使用 DSH 主题 token（浅色/深色自动适配），语义色跟随 DSH 状态色

## 快速开始

1. 获取代码：`git clone https://github.com/Lings01/dsh-git-abstract.git`（或直接复制 `plugin/` 下两个文件）
2. 在 DSH 会话中让 agent 用 `cordis_define` 定义插件（`code.host` 用 `plugin/host.js`，`code.client` 用 `plugin/client.js`）
3. `cordis_run` 激活（首次需在浏览器端授权）
4. 页面右上角出现 ⑂ 按钮，点击查看当前仓库变更摘要

详细步骤见 **[安装教程](docs/INSTALL.zh.md)**，面板每个区块的说明见 **[使用教程](docs/USAGE.zh.md)**。

## 文档

| 文档 | 内容 |
| --- | --- |
| [docs/INSTALL.zh.md](docs/INSTALL.zh.md) / [INSTALL.md](docs/INSTALL.md) | 安装教程（中/英）：前置条件、定义/激活/更新/停止插件的完整步骤、跨环境兼容说明 |
| [docs/USAGE.zh.md](docs/USAGE.zh.md) / [USAGE.md](docs/USAGE.md) | 使用教程（中/英）：面板详解、仓库定位、手动路径、状态徽标图例、常见操作 |
| [CHANGELOG.zh.md](CHANGELOG.zh.md) / [CHANGELOG.md](CHANGELOG.md) | 版本历史（中/英） |

## 工作原理

- **Host 半部**（`plugin/host.js`）：通过 `harness.handle` 注册 `git-summary` RPC，执行约 15 条**只读** git 命令（numstat / name-status / porcelain / log / diff --check 等）并解析成摘要 JSON。
- **Client 半部**（`plugin/client.js`）：注册在 `shell.overlay` 插槽（页面级浮层），渲染右上角按钮与面板，通过 `host.call('git-summary', …)` 取数。
- 仓库定位：优先用当前会话 `cwd`（`useSessions`），缺失时兜底最近活跃工作区路径，向上查找最近的 git 仓库；也可在面板手动指定路径。

## 目录结构

```
.
├── README.md / README.zh.md   # 文档（英/中）
├── docs/
│   ├── INSTALL.zh.md / INSTALL.md  # 安装教程（中/英）
│   └── USAGE.zh.md / USAGE.md      # 使用教程（中/英）
├── CHANGELOG.zh.md / CHANGELOG.md  # 版本历史（中/英）
├── plugin/
│   ├── host.js        # Host 半部（code.host 函数体）
│   └── client.js      # Client 半部（code.client 函数体）
├── LICENSE            # MIT
└── .gitignore
```

## 常见问题（FAQ）

| 现象 | 处理 |
| --- | --- |
| 提示“未找到 git 仓库” | 当前工作区及其父目录都不是仓库，在面板输入框填真实仓库路径 |
| 提示“路径不是可用的 git 仓库” | 确认路径存在且已 `git init` |
| 面板一直转圈 | 大仓库首次计算较慢（单条命令最多约 30s）；点 ⟳ 重试 |
| 调试区显示 `spawn bash/bwrap ENOENT` 或 `subprocess 执行失败` | 宿主执行环境 PATH/沙箱异常，插件会自动降级；若仍失败，确认 `git`/`bash` 在标准目录或宿主 PATH 中（详见 [安装教程](docs/INSTALL.zh.md#跨环境兼容)） |
| 换工作区没刷新 | 面板会自动跟随当前会话工作区；如仍显示旧数据，点 ⟳ 或手动输入路径 |
| 沙箱拒绝（`denied`） | 只读 git 命令被沙箱拦截时返回错误，可放宽沙箱策略后重试 |

## License

[MIT](LICENSE)
