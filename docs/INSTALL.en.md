# Installation Tutorial

How to install, activate, update, and stop this plugin in DeepSeek Harness (DSH).

> **中文版见 [INSTALL.md](INSTALL.md)** / For Chinese docs see [INSTALL.md](INSTALL.md).

## Prerequisites

- **DeepSeek Harness environment**: provides `shell` / `subprocess` / `slots` services and the `harness`, `React`, `host`, `styles` runtime capabilities
- **git ≥ 2.23**: in a standard system directory (e.g. `/usr/bin/git`) or on the host PATH
- **bubblewrap (`bwrap`) optional**: when missing, the plugin automatically falls back to unsandboxed execution
- A **target git repo**: the plugin shows changes of some git repo (by default the repo of the current session workspace)

## Install

### 1. Get the code

Either:

```bash
git clone https://github.com/Lings01/dsh-git-abstract.git
# or just copy the two plugin files
cp dsh-git-abstract/plugin/host.js   <your-dir>/host.js
cp dsh-git-abstract/plugin/client.js <your-dir>/client.js
```

### 2. Define the plugin in a DSH session

This is a **dynamic Cordis plugin** — no npm install or build is needed. In a DSH session, ask the agent to run `cordis_define`:

- `code.host` ← the full content of `plugin/host.js`
- `code.client` ← the full content of `plugin/client.js`

**Example prompt** (send this to the agent in your session):

> Please define this Cordis plugin with `cordis_define`:
> - `code.host` from the content of `plugin/host.js`
> - `code.client` from the content of `plugin/client.js`
> - Name: Git Change Summary Button
>
> After defining, activate it with `cordis_run`.

The agent returns `pluginId` / `packageId`, e.g. `gitsum-2/pkg-30`.

### 3. Activate

Call `cordis_run` for the returned Package:

```text
cordis_run(pluginId: <pluginId>, packageId: <packageId>, mode: "run")
```

- **First activation**: the Client half needs browser-side approval (allow it in the UI). After one-time approval, later versions of the same plugin can run without re-approving.
- Once active, the **⑂ button appears at the top-right** of the page.

### 4. Verify

Click ⑂ to open the panel:

- If the current workspace (or a parent directory) is a git repo, the panel shows its change summary directly;
- Otherwise it reports "no git repo found" — enter a repo path manually in the input (see [Usage](USAGE.en.md)).

## Updating the Plugin

Define a new Package under the same `pluginId`, then switch with `cordis_run(mode: "update")`:

```text
cordis_define(plugin: { kind: "existing", pluginId: <pluginId> }, code: { host: <new-host-code>, client: <new-client-code> })
cordis_run(pluginId: <pluginId>, packageId: <new-packageId>, mode: "update")
```

A failed update does not auto-restore the old version; roll back by running `currentPackageId` with `mode: "run"`.

## Stop / Remove

- **Temporarily stop**: `cordis_stop(pluginId)` — keeps definitions and versions; resume later with `run`/`update`.
- **Permanently remove**: `cordis_undefine(pluginId)` — deletes all Packages and grants.

## Cross-Environment Compatibility

The plugin executes git commands with automatic fallbacks, independent of host PATH completeness and sandbox runner availability:

| Level | Approach | Solves |
| --- | --- | --- |
| 1 | Default request | Normal deployments with healthy PATH/sandbox (most cases) |
| 2 | Explicit standard PATH (`/usr/bin:/bin` etc.) | Host execution PATH misses system dirs (`bash`/`bwrap`/`git` not found, e.g. `spawn bash ENOENT`) |
| 3 | Standard PATH + unsandboxed (`danger-full-access`) | Sandbox runner (bubblewrap) missing/unspawnable (e.g. `spawn bwrap ENOENT`) |
| 4 | Direct `ctx.subprocess`: absolute `/bin/sh` + in-command `export PATH` + `git -C` | Last resort when all shell layers fail |

> All git commands are read-only; unsandboxed execution at levels 3–4 is safe.

On error or a degraded path (`attempt > 1`), the panel shows a debug area with the level used (`attempt: 1/2/3/4`) and environment probe info.

## Installation Troubleshooting

| Problem | Fix |
| --- | --- |
| `cordis_define` syntax error | Make sure the code matches `plugin/*.js` exactly (plain JavaScript, no JSX/TS/import) |
| No button after activation | Check that browser approval was completed; refresh the page |
| Panel reports `spawn ... ENOENT` | Environment PATH/sandbox issue; the plugin degrades automatically — if it still fails, ensure `git`/`bash` are in a standard location or on the host PATH |
