# 安装教程

本文档说明如何在 DeepSeek Harness (DSH) 中安装、激活、更新、停止本插件。

> **English: [INSTALL.md](INSTALL.md)**

## 前置条件

- **DeepSeek Harness 环境**：提供 `shell` / `subprocess` / `slots` 等服务，以及 `harness`、`React`、`host`、`styles` 等运行时能力
- **git ≥ 2.23**：位于标准系统目录（如 `/usr/bin/git`）或宿主 PATH 中
- **bubblewrap（`bwrap`）可选**：缺失时插件自动降级为无沙箱执行，不影响功能
- 一个**目标 git 仓库**：插件展示的是某个 git 仓库的变更（默认取当前会话工作区所在仓库）

## 安装步骤

### 1. 获取代码

任选其一：

```bash
# 克隆仓库
git clone https://github.com/Lings01/dsh-git-abstract.git
# 或者只取两个插件文件
cp dsh-git-abstract/plugin/host.js   <你的目录>/host.js
cp dsh-git-abstract/plugin/client.js <你的目录>/client.js
```

### 2. 在 DSH 会话中定义插件

本插件是**动态 Cordis 插件**，不需要 npm 安装或构建。在 DSH 会话中让 agent 执行 `cordis_define`：

- `code.host` ← `plugin/host.js` 的全部内容
- `code.client` ← `plugin/client.js` 的全部内容

**示例对话**（把下面的内容发给会话中的 agent 即可）：

> 请用 `cordis_define` 定义这个 Cordis 插件：
> - code.host 使用 `plugin/host.js` 的内容
> - code.client 使用 `plugin/client.js` 的内容
> - 名称：Git 变更摘要按钮
>
> 定义完成后用 `cordis_run` 激活它。

agent 会返回 `pluginId` / `packageId`，例如 `gitsum-2/pkg-30`。

### 3. 激活插件

调用 `cordis_run` 激活对应 Package：

```text
cordis_run(pluginId: <pluginId>, packageId: <packageId>, mode: "run")
```

- **首次激活**：Client 半部需要在浏览器端授权（在界面上允许）。授权一次后，同一插件的后续版本可继续运行。
- 激活成功后，页面**右上角出现 ⑂ 按钮**即安装完成。

### 4. 验证

点击 ⑂ 打开面板：

- 若当前工作区（或其父目录）是 git 仓库，面板直接显示该仓库的变更摘要；
- 否则提示未找到仓库，可在面板输入框手动指定仓库路径（见[使用教程](USAGE.zh.md)）。

## 更新插件

插件代码更新后，用同一 `pluginId` 定义新 Package，然后 `cordis_run(mode: "update")` 切换：

```text
cordis_define(plugin: { kind: "existing", pluginId: <pluginId> }, code: { host: <新host代码>, client: <新client代码> })
cordis_run(pluginId: <pluginId>, packageId: <新packageId>, mode: "update")
```

更新失败不会自动回滚旧版本；可对 `currentPackageId` 执行 `mode: "run"` 回滚。

## 停止 / 移除插件

- **临时停止**：`cordis_stop(pluginId)` —— 保留定义和版本，之后可 `run`/`update` 恢复。
- **永久移除**：`cordis_undefine(pluginId)` —— 删除所有 Package 和授权记录。

## 跨环境兼容

插件执行 git 命令时按需自动降级，不依赖宿主环境的 PATH 完整性和沙箱 runner 是否可用：

| 级别 | 做法 | 解决什么问题 |
| --- | --- | --- |
| 1 | 默认请求 | 宿主 PATH / 沙箱正常时直接可用（绝大多数部署） |
| 2 | 显式标准 PATH（`/usr/bin:/bin` 等） | 宿主执行环境 PATH 缺少系统目录（`bash`/`bwrap`/`git` 找不到，如 `spawn bash ENOENT`） |
| 3 | 标准 PATH + 无沙箱（`danger-full-access`） | 沙箱 runner（bubblewrap）缺失或无法启动（如 `spawn bwrap ENOENT`） |
| 4 | `ctx.subprocess` 直连：绝对路径 `/bin/sh` + 命令内 `export PATH` + `git -C` | 以上 shell 层全部失败时的最后手段 |

> git 命令全部只读，第 3/4 级无沙箱执行是安全的。

面板在出错或发生降级（`attempt > 1`）时会显示调试区，包含实际命中的级别（`attempt: 1/2/3/4`）与环境探测信息，便于排查。

## 常见安装问题

| 问题 | 处理 |
| --- | --- |
| `cordis_define` 报语法错误 | 确认代码与 `plugin/*.js` 完全一致（plain JavaScript，无 JSX/TS/import） |
| 激活后没有按钮 | 检查是否完成浏览器端授权；刷新页面重试 |
| 面板报 `spawn ... ENOENT` | 属环境 PATH/沙箱问题，插件会自动降级；仍失败请确认 `git`/`bash` 在标准目录或宿主 PATH 中 |
