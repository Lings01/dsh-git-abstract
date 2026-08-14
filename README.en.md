# dsh-git-abstract

A **dynamic Cordis plugin** for DeepSeek Harness (DSH): a Git change summary button.

A floating button (⑂) at the top-right of the page opens a panel showing a concise summary of the current git branch's changes — added/deleted lines, affected files, commits, conflict checks — with styling that matches the DSH theme.

> Works in the DeepSeek Harness Web GUI: one click shows the full picture of the git repo your current workspace lives in.

> **中文文档见 [README.md](README.md)** / For Chinese docs see [README.md](README.md).

## Features

- **Overview cards**: files changed / +added lines / −deleted lines / net change / untracked files
- **Meta info**: repo path, current branch, upstream and ahead/behind, auto-detected base branch, HEAD commit (short hash + subject + author + date)
- **Uncommitted changes**: three groups — total vs HEAD, staged, unstaged; each file with a status badge (modified/added/deleted/renamed/untracked) and `+x −y` line counts
- **Branch commits**: commits ahead of the base branch + combined diff stats (base resolved via `upstream → origin/<branch> → origin/main → origin/master → main → master → develop`)
- **File details**: full file table sorted by change magnitude, TOP5 most-changed files, grouping by extension, grouping by top-level directory
- **Extra checks**: untracked files, binary files, conflict markers (`<<<<<<<`, amber warning), whitespace errors, last 5 commits, generated-at timestamp
- **Automatic repo detection**: walks up from the current session workspace; **auto-refreshes when you switch workspaces**
- **Cross-environment resilient**: 4-level automatic fallback that does not depend on host PATH completeness or sandbox runner availability (see [Install → Cross-environment compatibility](docs/INSTALL.en.md#cross-environment-compatibility))
- **DSH-themed UI**: uses DSH theme tokens (auto light/dark), semantic colors follow DSH state colors

## Quick Start

1. Get the code: `git clone https://github.com/Lings01/dsh-git-abstract.git` (or just copy the two files under `plugin/`)
2. In a DSH session, ask the agent to define the plugin with `cordis_define` (`code.host` from `plugin/host.js`, `code.client` from `plugin/client.js`)
3. Activate with `cordis_run` (browser approval required on first activation)
4. Click the ⑂ button at the top-right to view the current repo's change summary

Full steps: **[Installation](docs/INSTALL.en.md)** · every panel section explained in **[Usage](docs/USAGE.en.md)**.

## Documentation

| Doc | Content |
| --- | --- |
| [docs/INSTALL.en.md](docs/INSTALL.en.md) | Installation tutorial: prerequisites, define/activate/update/stop, cross-environment compatibility |
| [docs/USAGE.en.md](docs/USAGE.en.md) | Usage tutorial: panel reference, repo resolution, status badge legend, common operations |
| [CHANGELOG.en.md](CHANGELOG.en.md) | Version history |

## How It Works

- **Host half** (`plugin/host.js`): registers the `git-summary` RPC via `harness.handle`, runs ~15 **read-only** git commands (numstat / name-status / porcelain / log / diff --check, etc.) and parses them into summary JSON.
- **Client half** (`plugin/client.js`): registers in the `shell.overlay` slot (frame-wide overlay), renders the top-right button and panel, fetches data via `host.call('git-summary', …)`.
- Repo resolution: prefers the current session `cwd` (via `useSessions`), falls back to the most recently active workspace path, then walks up to the nearest git repo; a manual path can also be entered in the panel.

## Repository Layout

```
.
├── README.md / README.en.md   # docs (zh/en)
├── docs/
│   ├── INSTALL.md / INSTALL.en.md
│   └── USAGE.md / USAGE.en.md
├── CHANGELOG.md / CHANGELOG.en.md
├── plugin/
│   ├── host.js        # Host half (code.host function body)
│   └── client.js      # Client half (code.client function body)
├── LICENSE            # MIT
└── .gitignore
```

## FAQ

| Symptom | Fix |
| --- | --- |
| "No git repo found" | Neither the workspace nor its parents is a repo; enter a real repo path in the panel input |
| "Path is not a usable git repo" | Make sure the path exists and has been `git init`-ed |
| Panel keeps spinning | Large repos take time (up to ~30s per command); click ⟳ to retry |
| Debug area shows `spawn bash/bwrap ENOENT` or `subprocess failed` | Host PATH/sandbox issue; the plugin degrades automatically — if it still fails, ensure `git`/`bash` are in a standard location or on the host PATH (see [Install](docs/INSTALL.en.md#cross-environment-compatibility)) |
| No refresh after switching workspace | The panel follows the current session workspace; if stale, click ⟳ or enter a path manually |
| Sandbox denial (`denied`) | A read-only git command was blocked; relax the sandbox policy and retry |

## License

[MIT](LICENSE)
