// ============================================================
// dsh-git-abstract · Host 半部
// ------------------------------------------------------------
// 这是 DeepSeek Harness 动态 Cordis 插件 code.host 的函数体
// （plain JavaScript，直接返回一个 Cordis Plugin 对象）。
//
// 用法：在 DSH 会话中让 agent 执行 cordis_define，把本文件内容
// 作为 code.host；plugin/client.js 作为 code.client。
//
// 职责：
//   - 通过 harness.handle 注册 'git-summary' RPC 方法
//   - 用 ctx.shell 执行只读 git 命令并解析成摘要 JSON
// ============================================================

function quote(s) {
  return "'" + String(s).replace(/'/g, "'\\''") + "'"
}

// 标准系统目录 PATH：覆盖 bash / bwrap / git 的常规安装位置。
// 宿主执行环境 PATH 不完整（如缺少 /usr/bin）时用于降级，不依赖特定机器的路径。
const STANDARD_PATH = '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/local/git/bin:/opt/homebrew/bin:/opt/local/bin'

function parseNumstat(text) {
  const files = []
  for (const line of String(text || '').split('\n')) {
    if (!line.trim()) continue
    const tab1 = line.indexOf('\t')
    if (tab1 < 0) continue
    const tab2 = line.indexOf('\t', tab1 + 1)
    if (tab2 < 0) continue
    const addedRaw = line.slice(0, tab1)
    const deletedRaw = line.slice(tab1 + 1, tab2)
    let p = line.slice(tab2 + 1)
    let from = null
    const arrow = p.indexOf(' => ')
    if (arrow >= 0) {
      from = p.slice(0, arrow)
      p = p.slice(arrow + 4)
      if (from.endsWith('{') && p.endsWith('}')) { from = from.slice(0, -1); p = p.slice(0, -1) }
    }
    const binary = addedRaw === '-' || deletedRaw === '-'
    files.push({
      path: p,
      from: from,
      binary: binary,
      added: binary ? 0 : Number(addedRaw),
      deleted: binary ? 0 : Number(deletedRaw),
    })
  }
  return files
}

function parseNameStatus(text) {
  const items = []
  for (const line of String(text || '').split('\n')) {
    if (!line.trim()) continue
    const parts = line.split('\t')
    items.push({
      status: parts[0].replace(/[0-9]+$/, ''),
      path: parts[parts.length - 1],
      from: parts.length > 2 ? parts[1] : null,
    })
  }
  return items
}

function sumStats(files) {
  let added = 0, deleted = 0, binaries = 0
  for (const f of files) {
    if (f.binary) binaries += 1
    else { added += f.added; deleted += f.deleted }
  }
  return { added: added, deleted: deleted, net: added - deleted, binaries: binaries, files: files.length }
}

function extOf(p) {
  const base = String(p).split('/').pop()
  const i = base.lastIndexOf('.')
  return i > 0 ? base.slice(i + 1).toLowerCase() : '(无扩展名)'
}

function dirOf(p) {
  const s = String(p)
  return s.indexOf('/') >= 0 ? s.split('/')[0] : '(根目录)'
}

function groupFiles(files) {
  const byExt = new Map(), byDir = new Map()
  for (const f of files) {
    const e = extOf(f.path)
    const d = dirOf(f.path)
    for (const [key, map] of [[e, byExt], [d, byDir]]) {
      let g = map.get(key)
      if (!g) { g = { key: key, files: 0, added: 0, deleted: 0, binaries: 0 }; map.set(key, g) }
      g.files += 1
      if (f.binary) g.binaries += 1
      else { g.added += f.added; g.deleted += f.deleted }
    }
  }
  const rank = (m) => [...m.values()].sort((a, b) => (b.added + b.deleted) - (a.added + a.deleted))
  return { byExt: rank(byExt), byDir: rank(byDir) }
}

return {
  apply(ctx) {
    ctx.effect(() => harness.handle('git-summary', async (args) => {
      try {
        const explicit = args && typeof args.repo === 'string' ? args.repo.trim() : ''
        const startHint = args && typeof args.start === 'string' ? args.start.trim() : ''
        return await computeSummary(ctx, explicit, startHint)
      } catch (err) {
        return { ok: false, error: '内部错误: ' + (err && err.message ? err.message : String(err)) }
      }
    }))
  },
}

async function computeSummary(ctx, explicit, startHint) {
  const sp = ctx.get('sandboxPolicy')
  const fallbackRoot = (sp && sp.workspaceRoot) || ''
  const debug = { startHint: startHint || '', fallbackRoot: fallbackRoot, repo: '', branchErr: '', headErr: '', attempt: '' }
  const root = await detectRepo(ctx, explicit, startHint || fallbackRoot)
  if (root === null) return { ok: false, error: '未找到 git 仓库（已尝试会话工作区及其父目录），可在面板里输入仓库路径', debug: debug }
  if (root.error) return { ok: false, error: root.error, debug: debug }
  const repo = root
  debug.repo = repo

  const out = {
    ok: true,
    repo: repo,
    generatedAt: new Date().toISOString(),
    branch: null, upstream: null, ahead: 0, behind: 0, base: null, head: null,
    unborn: false, uncommitted: null, staged: null, unstaged: null,
    branchCommits: null, branchDiff: null, untracked: [], recent: [],
    check: null, groups: null,
  }

  const branchR = await runGit(ctx, ['rev-parse', '--abbrev-ref', 'HEAD'], repo)
  const branch = branchR.ok ? branchR.stdout : null
  if (!branchR.ok && branchR.stderr) debug.branchErr = branchR.stderr
  if (branchR.attempt) debug.attempt = String(branchR.attempt)
  out.branch = branch === 'HEAD' ? '(detached HEAD)' : (branch || null)

  const headR = await runGit(ctx, ['rev-parse', '--short', 'HEAD'], repo)
  if (!headR.ok) {
    const errText = headR.stderr || ('exit ' + headR.exitCode)
    debug.headErr = errText
    // 只有确认真的是“还没有任何提交”才算 unborn，否则把真实错误返回给面板
    if (/ambiguous argument 'HEAD'|unknown revision or path|HEAD does not point/i.test(errText)) {
      out.unborn = true
    } else {
      return { ok: false, error: 'git 命令失败（rev-parse --short HEAD）: ' + errText, debug: debug }
    }
  }

  const logR = await runGit(ctx, ['log', '-1', '--format=%h%x1f%s%x1f%an%x1f%aI'], repo)
  if (logR.ok && logR.stdout) {
    const parts = logR.stdout.split('\x1f')
    out.head = { short: parts[0], subject: parts[1], author: parts[2], date: parts[3] }
  }

  const upR = await runGit(ctx, ['rev-parse', '--abbrev-ref', '@{upstream}'], repo)
  if (upR.ok) {
    out.upstream = upR.stdout
    const abR = await runGit(ctx, ['rev-list', '--left-right', '--count', 'HEAD...@{upstream}'], repo)
    if (abR.ok) {
      const m = abR.stdout.trim().split(/\s+/)
      out.ahead = Number(m[0] || 0)
      out.behind = Number(m[1] || 0)
    }
  }

  const candidates = []
  if (out.upstream) candidates.push('@{upstream}')
  if (branch && branch !== 'HEAD' && branch !== '(detached HEAD)') candidates.push('origin/' + branch)
  for (const c of ['origin/main', 'origin/master', 'main', 'master', 'develop']) candidates.push(c)
  for (const c of candidates) {
    const v = await runGit(ctx, ['rev-parse', '--verify', '--quiet', c], repo)
    if (v.ok) { out.base = c; break }
  }

  if (!out.unborn) {
    const [totNs, totNsr, stNs, stNsr, unNs, unNsr, porc] = await Promise.all([
      runGit(ctx, ['diff', '--numstat', 'HEAD'], repo),
      runGit(ctx, ['diff', '--name-status', 'HEAD'], repo),
      runGit(ctx, ['diff', '--cached', '--numstat'], repo),
      runGit(ctx, ['diff', '--cached', '--name-status'], repo),
      runGit(ctx, ['diff', '--numstat'], repo),
      runGit(ctx, ['diff', '--name-status'], repo),
      runGit(ctx, ['status', '--porcelain'], repo),
    ])
    out.uncommitted = buildSection(totNs, totNsr)
    out.staged = buildSection(stNs, stNsr)
    out.unstaged = buildSection(unNs, unNsr)
    out.untracked = porc.stdout.split('\n').filter(function (l) { return l.startsWith('??') }).map(function (l) { return l.slice(3) })
  }

  if (out.base && !out.unborn) {
    const logB = await runGit(ctx, ['log', '--oneline', '--no-merges', out.base + '..HEAD'], repo)
    if (logB.ok) {
      const lines = logB.stdout ? logB.stdout.split('\n').filter(Boolean) : []
      out.branchCommits = {
        count: lines.length,
        list: lines.map(function (l) {
          const sp = l.indexOf(' ')
          return { short: sp > 0 ? l.slice(0, sp) : l, subject: sp > 0 ? l.slice(sp + 1) : '' }
        }),
      }
    }
    const bNs = await runGit(ctx, ['diff', '--numstat', out.base + '...HEAD'], repo)
    const bNsr = await runGit(ctx, ['diff', '--name-status', out.base + '...HEAD'], repo)
    out.branchDiff = buildSection(bNs, bNsr)
  }

  const recR = await runGit(ctx, ['log', '-5', '--format=%h%x1f%s%x1f%an%x1f%aI'], repo)
  if (recR.ok && recR.stdout) {
    out.recent = recR.stdout.split('\n').filter(Boolean).map(function (l) {
      const parts = l.split('\x1f')
      return { short: parts[0], subject: parts[1], author: parts[2], date: parts[3] }
    })
  }

  const checkR = await runGit(ctx, ['diff', '--check', 'HEAD'], repo)
  const checkText = (checkR.stdout + '\n' + checkR.stderr).trim()
  const checkLines = checkText ? checkText.split('\n').filter(Boolean) : []
  out.check = {
    conflicts: checkLines.filter(function (l) { return l.indexOf('conflict marker') >= 0 }).length,
    whitespace: checkLines.length - checkLines.filter(function (l) { return l.indexOf('conflict marker') >= 0 }).length,
    issues: checkLines.slice(0, 20),
    dirty: !checkR.ok,
  }

  if (out.uncommitted) {
    out.groups = groupFiles(out.uncommitted.files)
    out.topFiles = out.uncommitted.files
      .slice()
      .sort(function (a, b) { return (b.added + b.deleted) - (a.added + a.deleted) })
      .slice(0, 5)
  }

  out.debug = debug
  return out
}

function buildSection(nsR, nsrR) {
  const files = parseNumstat(nsR.stdout)
  const statuses = parseNameStatus(nsrR.stdout)
  const map = new Map(statuses.map(function (s) { return [s.path, s.status] }))
  for (const f of files) {
    const st = map.get(f.path)
    if (st) f.status = st
    if (!f.status) f.status = 'M'
  }
  return { files: files, stats: sumStats(files) }
}

async function runGit(ctx, args, cwd) {
  const shell = ctx.get('shell')
  if (!shell) return { ok: false, exitCode: -1, stdout: '', stderr: 'shell 服务不可用' }
  const sp = ctx.get('sandboxPolicy')
  const root = (sp && sp.workspaceRoot) || '/'
  // 多级尝试，适应不同部署环境：
  //   1) 默认请求 —— 宿主 PATH/沙箱正常时直接可用
  //   2) 显式标准 PATH —— 宿主 PATH 缺少系统目录（bash/bwrap/git 找不到）时
  //   3) 标准 PATH + 无沙箱 —— 沙箱 runner（bwrap）缺失或无法启动时
  // git 命令全部只读，第 3 级无沙箱执行是安全的。
  const attempts = [
    null,
    { env: { PATH: STANDARD_PATH } },
    { env: { PATH: STANDARD_PATH }, sandboxPolicy: { mode: 'danger-full-access', workspaceRoot: root } },
  ]
  let lastErr = ''
  for (let i = 0; i < attempts.length; i++) {
    try {
      const extra = attempts[i]
      const spec = shell.resolve({
        command: 'git ' + args.map(quote).join(' '),
        workdir: cwd,
        timeoutMs: 30000,
        stdoutMaxBytes: 8 * 1024 * 1024,
        ...(extra ? extra : {}),
      })
      const res = await shell.run(spec)
      const out = {
        ok: res.exitCode === 0,
        exitCode: res.exitCode,
        stdout: (res.stdout && res.stdout.text) || '',
        stderr: (res.stderr && res.stderr.text) || '',
        denied: !!(res.sandbox && res.sandbox.denied),
        runnerFailed: !!(res.sandbox && res.sandbox.runnerFailed),
        attempt: i + 1,
      }
      if (out.runnerFailed) { lastErr = 'sandbox runner failed'; continue }
      return out
    } catch (e) {
      lastErr = (e && e.message) ? e.message : String(e)
    }
  }
  return { ok: false, exitCode: -2, stdout: '', stderr: 'shell 执行失败: ' + lastErr, attempt: 0 }
}

async function detectRepo(ctx, explicit, startHint) {
  if (explicit) {
    const r = await runGit(ctx, ['rev-parse', '--show-toplevel'], explicit)
    if (r.ok && r.stdout) return r.stdout
    return { error: '路径不是可用的 git 仓库: ' + explicit + '（' + (r.stderr || ('exit ' + r.exitCode)) + '）' }
  }
  const sp = ctx.get('sandboxPolicy')
  let dir = startHint || (sp && sp.workspaceRoot) || '/'
  while (true) {
    const r = await runGit(ctx, ['rev-parse', '--show-toplevel'], dir)
    if (r.ok && r.stdout) return r.stdout
    const next = dir.replace(/\/[^/]*$/, '') || '/'
    if (next === dir) return null
    dir = next
  }
}
