# Changelog

This project follows [Semantic Versioning](https://semver.org/).

> **中文版见 [CHANGELOG.md](CHANGELOG.md)** / For Chinese docs see [CHANGELOG.md](CHANGELOG.md).

## [0.3.0] - 2026-08-14

### Added
- Panel **auto-refreshes** when the DSH workspace changes (listens to the current session cwd)
- UI aligned with the DSH theme: real theme tokens (`--dsw-alias-*`, auto light/dark), DSH semantic colors (added green / deleted red / conflict amber), compact ghost floating button
- Debug area shown only on error or a degraded path (`attempt > 1`)

### Fixed
- Trim git stdout (repo path / branch / upstream) — the trailing newline broke path resolution (`cannot change to '...abstract '`)
- Level-4 direct execution uses `cwd=/` + `git -C <repo>` to avoid `spawn ENOENT` caused by an unusable cwd in the plugin context

## [0.2.0] - 2026-08-14

### Added
- Diagnostics (detection start / fallback root / detected repo / failed-command stderr / environment probe)
- Client takes the current session workspace `cwd` from the session list (`useSessions`, fallback `useWorkspaces`) as the repo-detection start
- Environment probe to help diagnose spawn-class issues

### Fixed
- TDZ error caused by CSS constant defined after `return`
- Distinguish a true "unborn repo" from a failed git command — no longer misreports failures as unborn
- Fall back to unsandboxed execution when the sandbox runner (bwrap) is missing
- Standard PATH injection for hosts whose PATH lacks system dirs (`spawn bash/bwrap ENOENT`)
- `ctx.subprocess` direct fallback (absolute `/bin/sh` + in-command `export PATH`)

## [0.1.0] - 2026-08-14

### Added
- Button (⑂) beside "Session log" in the session header and summary panel (registered in the `conversation.session.header.utilities` slot)
- Host-side `git-summary` RPC: ~15 read-only git commands with parsing
- Summary content: overview cards, meta info, uncommitted/staged/unstaged, branch commits, file details (TOP5 / by extension / by directory), extra checks (untracked / binary / conflict markers / whitespace errors / recent commits)
- Automatic repo detection (walk up from workspace) and manual path input
- Published to GitHub (`dsh-git-abstract`) with docs
