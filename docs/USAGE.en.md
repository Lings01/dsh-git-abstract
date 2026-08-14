# Usage Tutorial

Every part of the Git change summary panel, plus common operations.

> **中文版见 [USAGE.md](USAGE.md)** / For Chinese docs see [USAGE.md](USAGE.md).

## Open & Close

- Click the **⑂ button at the top-right** of the page to open the panel; click it again, or click **✕** in the panel header, to close.
- The panel header has a **⟳ refresh** button to recompute manually.

## Repo Resolution

Which repo the panel shows is decided as follows:

1. **Auto-detect (default)**: walk **up from the current session workspace** to the nearest git repo (`git rev-parse --show-toplevel`). E.g. workspace is `/home/user/proj/subdir` but the repo is at `/home/user/proj` — the repo root is resolved automatically.
2. **Manual**: type a repo path in the input at the top, press Enter or click **Apply**.
3. **Follows the workspace**: after switching DSH workspaces the panel clears stale data and recomputes for the new workspace; if you entered a manual path, that path keeps being used.

## Panel Reference

### Overview cards (top)

| Card | Meaning |
| --- | --- |
| Files | Total files with changes vs HEAD (incl. binary) |
| Added | Total added lines vs HEAD (green) |
| Deleted | Total deleted lines vs HEAD (red) |
| Net | Added − deleted (signed) |
| Untracked | Number of untracked files (`git ls-files --others`) |

### Meta info

- **Repo**: the repo root actually used
- **Base branch**: auto-detected (upstream → `origin/<branch>` → `origin/main` → `origin/master` → `main` → `master` → `develop`); used for the "branch commits" section
- **Upstream**: remote-tracking branch, plus commits ahead (+) / behind (−)
- **HEAD**: short hash, subject, author, commit date

### Uncommitted changes (collapsible)

- **Uncommitted vs HEAD**: every uncommitted modification (staged + unstaged)
- **Staged**: changes added with `git add`
- **Unstaged**: modified but not yet `git add`-ed

Each file row: **status badge + path + `+x −y` lines** (binary files show "binary").

### Status badge legend

| Badge | Meaning | Color |
| --- | --- | --- |
| M | Modified | Neutral gray |
| A | Added | Green |
| D | Deleted | Red |
| R | Renamed (`old → new`) | Amber |
| U | Untracked | Gray |

### Branch commits (ahead of base)

- List of commits on the current branch not in the base (**no merge commits**), with hash + subject
- **Combined diff stats** of those commits (files / +lines / −lines)

### File details (sorted by change magnitude)

- **TOP5 most changed**: the 5 files with the largest (added + deleted) counts
- **By extension**: e.g. `.py`, `.js`, `.md` — file counts and line changes each
- **By top-level directory**: aggregation across the repo's top-level dirs

### Extra checks

- **Untracked files**: count + first 10 paths
- **Binary files**: changes without line counts, counted per file
- **Conflict markers**: `<<<<<<<` markers found by `git diff --check` (amber warning)
- **Whitespace errors**: reported by `git diff --check`
- **Recent commits**: last 5 commits of the repo (hash + subject)

### Debug area (only on abnormal cases)

When there is an error or a degraded execution path (`attempt > 1`), the panel bottom shows a small monospace debug block:

- `repo` / `start` / `fallback`: repo path used, detection start, fallback root
- `attempt`: execution level hit (1 default / 2 standard PATH / 3 unsandboxed / 4 subprocess direct)
- `probe`: the plugin environment's PATH and whether `git`/`bash`/`sh` resolve
- `branchErr` / `headErr`: stderr of the failed commands

The debug area is hidden on the normal path (no error, `attempt` 1).

## Common Operations

| Action | How |
| --- | --- |
| Recompute | Click ⟳ in the panel header |
| Switch repo | Enter a path in the input → Enter / Apply |
| Back to auto-detect | Clear the input → Apply |
| Collapse / expand a section | Click the section title |
| See the full file list | Lists scroll (up to ~220px) |

## Theme & Colors

The panel uses DSH theme tokens (`--dsw-alias-*`) and follows DSH light/dark themes automatically:

- Panel/card/section backgrounds: `bg-overlay` / `bg-layer-1` / `bg-layer-2`
- Text: `label-primary` / `label-secondary`
- Semantic colors: added green `#22c55e`, deleted red `#ec1313`, conflict/warning amber `#f59e0b`
