// ============================================================
// dsh-git-abstract · Client 半部
// ------------------------------------------------------------
// 这是 DeepSeek Harness 动态 Cordis 插件 code.client 的函数体
// （plain JavaScript，无 JSX/TS，直接返回 Cordis Plugin 对象）。
//
// 职责：
//   - 在 shell.overlay 插槽注册右上角悬浮按钮 + 摘要面板
//   - 通过 host.call('git-summary', …) 调用 Host 半部取数
// ============================================================

const h = React.createElement

const STATUS_LABEL = { M: '改', A: '增', D: '删', R: '移', C: '拷', U: '新', T: '型' }
const STATUS_TITLE = { M: '修改', A: '新增', D: '删除', R: '重命名', C: '复制', U: '未跟踪', T: '类型变更' }

const CSS = [
  ".gs-entry{display:inline-flex;align-items:center}",
  ".gs-fab{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:8px;border:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,.06));background:transparent;color:var(--dsw-alias-label-secondary,#cfd3d6);cursor:pointer;font-size:14px;line-height:1;transition:background .15s,color .15s,border-color .15s}",
  ".gs-fab:hover{background:var(--dsw-alias-bg-layer-1,#232324);border-color:var(--dsw-alias-border-l2,rgba(255,255,255,.12));color:var(--dsw-alias-label-primary,#f9fafb)}",
  ".gs-panel{position:fixed;top:48px;right:16px;z-index:2147483000;width:min(540px,calc(100vw - 24px));max-height:calc(100vh - 90px);overflow-y:auto;background:var(--dsw-alias-bg-overlay,#1b1b1f);border:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,.06));border-radius:12px;box-shadow:0 10px 40px rgba(0,0,0,.45);color:var(--dsw-alias-label-primary,#f9fafb);font-family:system-ui,-apple-system,'Segoe UI',sans-serif;font-size:12px;pointer-events:auto}",
  ".gs-head{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-bottom:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,.06))}",
  ".gs-title{font-size:13px;font-weight:600}",
  ".gs-sub{font-size:11px;color:var(--dsw-alias-label-secondary,#cfd3d6);margin-top:2px}",
  ".gs-head-r{display:flex;gap:6px}",
  ".gs-btn{background:var(--dsw-alias-bg-layer-1,#232324);border:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,.06));color:var(--dsw-alias-label-primary,#f9fafb);border-radius:8px;padding:4px 10px;font-size:12px;cursor:pointer}",
  ".gs-btn:hover{border-color:var(--dsw-alias-border-l2,rgba(255,255,255,.12))}",
  ".gs-btn-primary{background:var(--dsw-alias-brand-primary,#f9fafb);border-color:transparent;color:var(--dsw-alias-bg-base,#121314);font-weight:600}",
  ".gs-btn-primary:hover{opacity:.9}",
  ".gs-toolbar{display:flex;gap:6px;padding:8px 12px;border-bottom:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,.06))}",
  ".gs-input{flex:1;background:var(--dsw-alias-bg-layer-1,#232324);border:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,.06));color:var(--dsw-alias-label-primary,#f9fafb);border-radius:8px;padding:5px 8px;font-size:12px;min-width:0}",
  ".gs-input:focus{outline:none;border-color:var(--dsw-alias-brand-primary,#f9fafb)}",
  ".gs-body{padding:8px 12px 12px}",
  ".gs-loading{padding:16px;text-align:center;color:var(--dsw-alias-label-secondary,#cfd3d6)}",
  ".gs-error{padding:10px 12px;border:1px solid var(--dsw-alias-state-error-primary,#ec1313);color:var(--dsw-alias-state-error-primary,#ec1313);border-radius:8px;margin:8px 0;background:color-mix(in srgb,var(--dsw-alias-state-error-primary,#ec1313) 10%,transparent)}",
  ".gs-debug{margin:6px 0;padding:6px 8px;background:var(--dsw-alias-bg-layer-2,#2c2c2e);border-radius:6px;color:var(--dsw-alias-label-secondary,#cfd3d6);font-size:10px;overflow-x:auto}",
  ".gs-meta{padding:2px 0;font-size:12px;display:flex;flex-wrap:wrap;gap:4px;align-items:baseline}",
  ".gs-meta-k{color:var(--dsw-alias-label-secondary,#cfd3d6);font-size:11px}",
  ".gs-meta-sub{color:var(--dsw-alias-label-secondary,#cfd3d6);font-size:11px}",
  ".gs-mono{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:11px}",
  ".gs-cards{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin:8px 0}",
  ".gs-cell{background:var(--dsw-alias-bg-layer-1,#232324);border:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,.06));border-radius:8px;padding:6px 4px;text-align:center}",
  ".gs-cell-v{font-size:13px;font-weight:700}",
  ".gs-cell-l{font-size:10px;color:var(--dsw-alias-label-secondary,#cfd3d6);margin-top:2px}",
  ".gs-sec{border:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,.06));border-radius:8px;margin:8px 0;overflow:hidden;background:var(--dsw-alias-bg-layer-1,#232324)}",
  ".gs-sec-head{display:flex;align-items:center;gap:8px;width:100%;background:none;border:none;color:var(--dsw-alias-label-primary,#f9fafb);padding:8px 10px;cursor:pointer;font-size:12px;text-align:left}",
  ".gs-sec-title{font-weight:600;flex:1}",
  ".gs-sec-badge{font-size:11px;color:var(--dsw-alias-label-secondary,#cfd3d6);background:var(--dsw-alias-bg-layer-2,#2c2c2e);border-radius:999px;padding:1px 8px}",
  ".gs-sec-caret{color:var(--dsw-alias-label-secondary,#cfd3d6)}",
  ".gs-sec-body{padding:6px 10px 10px;border-top:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,.06))}",
  ".gs-frow{display:flex;align-items:center;gap:8px;padding:3px 0;font-size:12px}",
  ".gs-fpath{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;direction:rtl;text-align:left}",
  ".gs-chip{display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:18px;border-radius:5px;font-size:10px;font-weight:700;padding:0 4px}",
  ".gs-chip-M{background:var(--dsw-alias-bg-layer-2,#2c2c2e);color:var(--dsw-alias-label-primary,#f9fafb)}",
  ".gs-chip-A{background:#22c55e;color:#0b0b0d}",
  ".gs-chip-D{background:#ec1313;color:#fff}",
  ".gs-chip-R{background:#f59e0b;color:#0b0b0d}",
  ".gs-chip-U{background:var(--dsw-alias-label-secondary,#cfd3d6);color:#0b0b0d}",
  ".gs-chip-ext{background:var(--dsw-alias-bg-layer-2,#2c2c2e);color:var(--dsw-alias-label-secondary,#cfd3d6);min-width:auto}",
  ".gs-chip-dir{background:var(--dsw-alias-bg-layer-2,#2c2c2e);color:var(--dsw-alias-label-secondary,#cfd3d6);min-width:auto}",
  ".gs-delta{white-space:nowrap;font-size:11px}",
  ".gs-add{color:#22c55e}",
  ".gs-del{color:#ec1313}",
  ".gs-bin{font-size:10px;color:var(--dsw-alias-label-secondary,#cfd3d6)}",
  ".gs-empty{color:var(--dsw-alias-label-secondary,#cfd3d6);padding:6px 0;font-size:12px}",
  ".gs-flist{max-height:220px;overflow-y:auto}",
  ".gs-commit{display:flex;gap:8px;padding:2px 0;font-size:12px}",
  ".gs-commit-hash{color:var(--dsw-alias-label-secondary,#cfd3d6);font-family:ui-monospace,Menlo,Consolas,monospace;font-size:11px}",
  ".gs-commit-subject{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1}",
  ".gs-commits-sum{padding-top:6px;font-size:12px;color:var(--dsw-alias-label-secondary,#cfd3d6)}",
  ".gs-sec-stack{padding:4px 0}",
  ".gs-stack-title{font-size:11px;color:var(--dsw-alias-label-secondary,#cfd3d6);margin:8px 0 4px;font-weight:600}",
  ".gs-groups{display:flex;flex-direction:column;gap:4px}",
  ".gs-grow{display:flex;align-items:center;gap:8px;font-size:12px}",
  ".gs-gnum{font-size:11px;color:var(--dsw-alias-label-secondary,#cfd3d6)}",
  ".gs-extras{display:flex;flex-direction:column;gap:6px}",
  ".gs-extra-row{display:flex;justify-content:space-between;align-items:center;font-size:12px}",
  ".gs-untracked{max-height:120px;overflow-y:auto;color:var(--dsw-alias-label-secondary,#cfd3d6)}",
  ".gs-check-issues{margin-top:4px;max-height:100px;overflow-y:auto;background:var(--dsw-alias-bg-layer-2,#2c2c2e);border-radius:6px;padding:6px 8px}",
  ".gs-warn{color:#f59e0b}",
  ".gs-time{padding-top:8px;text-align:right;font-size:10px;color:var(--dsw-alias-label-secondary,#9aa0a6)}",
].join('\n')

function list(items, fn) {
  const out = []
  for (let i = 0; i < items.length; i++) out.push(fn(items[i], i))
  return out
}

function fmt(n) {
  return String(n)
}

function fmtDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleString()
}

function StatCell(props) {
  return h('div', { className: 'gs-cell' },
    h('div', { className: 'gs-cell-v', style: { color: props.color } }, props.value),
    h('div', { className: 'gs-cell-l' }, props.label))
}

function Section(props) {
  const [collapsed, setCollapsed] = React.useState(false)
  return h('div', { className: 'gs-sec' },
    h('button', { className: 'gs-sec-head', onClick: function () { setCollapsed(!collapsed) } },
      h('span', { className: 'gs-sec-title' }, props.title),
      props.badge ? h('span', { className: 'gs-sec-badge' }, props.badge) : null,
      h('span', { className: 'gs-sec-caret' }, collapsed ? '▸' : '▾')),
    collapsed ? null : h('div', { className: 'gs-sec-body' }, props.children))
}

function StatusChip(props) {
  const s = props.status || 'M'
  return h('span', { className: 'gs-chip gs-chip-' + s, title: STATUS_TITLE[s] || s }, STATUS_LABEL[s] || s)
}

function Delta(props) {
  if (props.binary) return h('span', { className: 'gs-bin' }, '二进制')
  return h('span', { className: 'gs-delta' },
    h('span', { className: 'gs-add' }, '+' + fmt(props.added)),
    ' ',
    h('span', { className: 'gs-del' }, '-' + fmt(props.deleted)))
}

function FileRow(props) {
  const f = props.f
  const name = f.from ? f.from + ' → ' + f.path : f.path
  return h('div', { className: 'gs-frow' },
    h(StatusChip, { status: f.status }),
    h('span', { className: 'gs-fpath', title: name }, name),
    h(Delta, { added: f.added, deleted: f.deleted, binary: f.binary }))
}

function FileList(props) {
  const files = props.files || []
  if (files.length === 0) return h('div', { className: 'gs-empty' }, '无变更')
  return h('div', { className: 'gs-flist' }, list(files, function (f, i) {
    return h(FileRow, { key: i, f: f })
  }))
}

function StatBadge(props) {
  const s = props.stats
  return h('span', { className: 'gs-sec-badge' },
    fmt(s.files) + ' 文件 · ',
    h('span', { className: 'gs-add' }, '+' + fmt(s.added)), ' ',
    h('span', { className: 'gs-del' }, '-' + fmt(s.deleted)))
}

function CommitRow(props) {
  const c = props.c
  return h('div', { className: 'gs-commit' },
    h('span', { className: 'gs-commit-hash' }, c.short),
    h('span', { className: 'gs-commit-subject' }, c.subject || ''))
}

function GroupRow(props) {
  const g = props.g
  const kind = props.kind
  return h('div', { className: 'gs-grow' },
    h('span', { className: 'gs-chip ' + (kind === 'ext' ? 'gs-chip-ext' : 'gs-chip-dir') }, g.key),
    h('span', { className: 'gs-gnum' }, fmt(g.files) + ' 文件 ',
      h('span', { className: 'gs-add' }, '+' + fmt(g.added)), ' ',
      h('span', { className: 'gs-del' }, '-' + fmt(g.deleted))))
}

function GitSummaryOverlay(props) {
  const [open, setOpen] = React.useState(false)
  const [data, setData] = React.useState(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState(null)
  const [repoInput, setRepoInput] = React.useState('')

  // 会话列表：current 是当前会话 id，byId[current].cwd 即当前工作区路径，
  // 作为仓库自动探测的起点（Host 端无法可靠拿到会话 cwd）。
  const sessions = props && props.useSessions ? props.useSessions(function (s) { return s }) : null
  let autoCwd = sessions && sessions.current && sessions.byId && sessions.byId[sessions.current]
    ? sessions.byId[sessions.current].cwd || ''
    : ''
  // 兜底：会话 cwd 缺失时用最近活跃工作区的路径
  if (!autoCwd && props && props.useWorkspaces) {
    const workspaces = props.useWorkspaces(function (s) { return s })
    if (workspaces && workspaces.items && workspaces.recentWorkspaceId) {
      const w = workspaces.items.find(function (x) { return x.workspaceId === workspaces.recentWorkspaceId })
      if (w && w.path) autoCwd = w.path
    }
  }

  const load = function (repo) {
    setLoading(true)
    setError(null)
    const payload = repo && repo.trim() ? { repo: repo.trim() } : (autoCwd ? { start: autoCwd } : {})
    host.call('git-summary', payload).then(function (res) {
      setData(res)
      if (!res || res.ok !== true) setError((res && res.error) || '获取失败')
      setLoading(false)
    }, function (err) {
      setError('调用失败: ' + String((err && err.message) || err))
      setLoading(false)
    })
  }

  React.useEffect(function () {
    if (open && !data && !loading) load(repoInput)
  }, [open])

  // 工作区切换（autoCwd 变化）时清空旧数据并自动刷新
  React.useEffect(function () {
    setData(null)
    setError(null)
    if (open) load(repoInput)
  }, [autoCwd])

  const fab = h('button', { className: 'gs-fab', title: 'Git 变更摘要', onClick: function () { setOpen(!open) } },
    h('span', { className: 'gs-fab-icon' }, '⑂'))

  if (!open) return h('div', { className: 'gs-entry' }, fab)

  const header = h('div', { className: 'gs-head' },
    h('div', { className: 'gs-head-l' },
      h('div', { className: 'gs-title' }, 'Git 变更摘要'),
      h('div', { className: 'gs-sub' }, data && data.ok ? (data.branch || '—') + ' @ ' + ((data.head && data.head.short) || '—') : '加载中…')),
    h('div', { className: 'gs-head-r' },
      h('button', { className: 'gs-btn', title: '刷新', onClick: function () { load(repoInput) } }, '⟳'),
      h('button', { className: 'gs-btn', title: '关闭', onClick: function () { setOpen(false) } }, '✕')))

  const toolbar = h('div', { className: 'gs-toolbar' },
    h('input', { className: 'gs-input', placeholder: '仓库路径（留空自动检测）', value: repoInput,
      onChange: function (e) { setRepoInput(e.target.value) },
      onKeyDown: function (e) { if (e.key === 'Enter') load(repoInput) } }),
    h('button', { className: 'gs-btn gs-btn-primary', onClick: function () { load(repoInput) } }, '应用'))

  const content = []
  if (loading) content.push(h('div', { key: 'loading', className: 'gs-loading' }, '正在计算变更摘要…'))
  if (error) content.push(h('div', { key: 'error', className: 'gs-error' }, error))
  // 仅在有错误或未走默认路径（attempt>1，即发生了环境降级）时显示调试区
  if (data && data.debug && (error || (data.debug.attempt && data.debug.attempt !== '1'))) {
    const dg = data.debug
    const lines = []
    if (dg.repo) lines.push('repo: ' + dg.repo)
    if (dg.startHint) lines.push('start: ' + dg.startHint)
    if (dg.fallbackRoot) lines.push('fallback: ' + dg.fallbackRoot)
    if (dg.attempt) lines.push('attempt: ' + dg.attempt)
    if (dg.probe) lines.push('probe: ' + dg.probe)
    if (dg.branchErr) lines.push('branchErr: ' + dg.branchErr)
    if (dg.headErr) lines.push('headErr: ' + dg.headErr)
    if (lines.length) {
      content.push(h('div', { key: 'debug', className: 'gs-debug' }, list(lines, function (l, i) { return h('div', { key: i, className: 'gs-mono' }, l) })))
    }
  }

  if (data && data.ok) {
    const d = data
    const un = d.uncommitted

    const headLine = d.head ? h('div', { className: 'gs-meta' },
      h('span', { className: 'gs-meta-k' }, 'HEAD'), ' ',
      h('span', { className: 'gs-mono' }, d.head.short), ' ',
      h('span', { className: 'gs-meta-sub' }, d.head.subject || ''),
      h('div', { className: 'gs-meta-sub' }, (d.head.author || '') + (d.head.date ? ' · ' + fmtDate(d.head.date) : ''))) : null

    const repoLine = h('div', { className: 'gs-meta' },
      h('span', { className: 'gs-meta-k' }, '仓库'), ' ',
      h('span', { className: 'gs-mono' }, d.repo || ''))

    const baseLine = h('div', { className: 'gs-meta' },
      h('span', { className: 'gs-meta-k' }, '基分支'), ' ',
      h('span', { className: 'gs-mono' }, d.base || '—'),
      d.upstream ? h('span', { className: 'gs-meta-sub' }, '  upstream ' + d.upstream + (d.ahead || d.behind ? ' · +' + d.ahead + ' / -' + d.behind : '')) : null)

    const overview = h('div', { className: 'gs-cards' },
      h(StatCell, { label: '文件数', value: un ? fmt(un.stats.files) : '—' }),
      h(StatCell, { label: '新增行', value: un ? '+' + fmt(un.stats.added) : '—', color: 'var(--dsw-alias-state-success-primary, #4caf50)' }),
      h(StatCell, { label: '删除行', value: un ? '-' + fmt(un.stats.deleted) : '—', color: 'var(--dsw-alias-state-error-primary, #ef5350)' }),
      h(StatCell, { label: '净变化', value: un ? fmt(un.stats.net >= 0 ? '+' + un.stats.net : un.stats.net) : '—' }),
      h(StatCell, { label: '未跟踪', value: d.untracked ? fmt(d.untracked.length) : '—' }))

    content.push(h('div', { key: 'meta' }, repoLine, baseLine, headLine, overview))

    if (d.unborn) {
      content.push(h('div', { key: 'unborn', className: 'gs-empty' }, '仓库还没有提交（unborn branch），仅显示未跟踪文件。'))
    } else {
      const secs = []
      secs.push(h(Section, { key: 'un', title: '未提交变更（相对 HEAD）', badge: h(StatBadge, { stats: un.stats }), children: h(FileList, { files: un.files }) }))
      secs.push(h(Section, { key: 'st', title: '已暂存 (staged)', badge: h(StatBadge, { stats: d.staged.stats }), children: h(FileList, { files: d.staged.files }) }))
      secs.push(h(Section, { key: 'us', title: '未暂存 (unstaged)', badge: h(StatBadge, { stats: d.unstaged.stats }), children: h(FileList, { files: d.unstaged.files }) }))

      if (d.branchCommits) {
        const commitEls = list(d.branchCommits.list, function (c, i) { return h(CommitRow, { key: i, c: c }) })
        if (d.branchDiff) {
          commitEls.push(h('div', { key: 'sum', className: 'gs-commits-sum' }, '合并差异: ' + fmt(d.branchDiff.stats.files) + ' 文件 ',
            h('span', { className: 'gs-add' }, '+' + fmt(d.branchDiff.stats.added)), ' ',
            h('span', { className: 'gs-del' }, '-' + fmt(d.branchDiff.stats.deleted))))
        }
        secs.push(h(Section, { key: 'bc', title: '分支提交（领先 ' + d.base + '）', badge: fmt(d.branchCommits.count) + ' 条', children: h('div', { className: 'gs-commits' }, commitEls) }))
      }

      const fileChildren = []
      if (d.topFiles && d.topFiles.length) {
        fileChildren.push(h('div', { key: 'top-t', className: 'gs-stack-title' }, '变更最多 TOP ' + d.topFiles.length))
        fileChildren.push(h(FileList, { key: 'top', files: d.topFiles }))
      }
      if (d.groups) {
        fileChildren.push(h('div', { key: 'ext-t', className: 'gs-stack-title' }, '按扩展名'))
        fileChildren.push(h('div', { key: 'ext', className: 'gs-groups' }, list(d.groups.byExt.slice(0, 12), function (g, i) { return h(GroupRow, { key: i, g: g, kind: 'ext' }) })))
        fileChildren.push(h('div', { key: 'dir-t', className: 'gs-stack-title' }, '按顶层目录'))
        fileChildren.push(h('div', { key: 'dir', className: 'gs-groups' }, list(d.groups.byDir.slice(0, 12), function (g, i) { return h(GroupRow, { key: i, g: g, kind: 'dir' }) })))
      }
      secs.push(h(Section, { key: 'files', title: '文件明细（按变更量排序）', badge: un ? fmt(un.files.length) : '0', children: h('div', { className: 'gs-sec-stack' }, fileChildren) }))

      const extras = []
      extras.push(h('div', { key: 'ut', className: 'gs-extra-row' }, h('span', {}, '未跟踪文件'), h('span', { className: 'gs-mono' }, fmt(d.untracked.length))))
      if (d.untracked && d.untracked.length) {
        extras.push(h('div', { key: 'utl', className: 'gs-untracked' }, list(d.untracked.slice(0, 10), function (p, i) { return h('div', { key: i, className: 'gs-mono' }, p) })))
      }
      extras.push(h('div', { key: 'bin', className: 'gs-extra-row' }, h('span', {}, '二进制文件'), h('span', { className: 'gs-mono' }, fmt(un.stats.binaries))))
      extras.push(h('div', { key: 'cf', className: 'gs-extra-row' }, h('span', {}, '冲突标记'), h('span', { className: 'gs-mono', style: { color: d.check && d.check.conflicts ? 'var(--dsw-alias-state-warn-primary, #ffb74d)' : undefined } }, fmt(d.check ? d.check.conflicts : 0))))
      extras.push(h('div', { key: 'ws', className: 'gs-extra-row' }, h('span', {}, '空白错误'), h('span', { className: 'gs-mono' }, fmt(d.check ? d.check.whitespace : 0))))
      if (d.check && d.check.issues && d.check.issues.length) {
        extras.push(h('div', { key: 'ci', className: 'gs-check-issues' }, list(d.check.issues, function (l, i) { return h('div', { key: i, className: 'gs-mono gs-warn' }, l) })))
      }
      secs.push(h(Section, { key: 'extras', title: '附加检查', children: h('div', { className: 'gs-extras' }, extras) }))

      secs.push(h(Section, { key: 'recent', title: '最近 5 条提交', children: h('div', { className: 'gs-commits' }, list(d.recent, function (c, i) { return h(CommitRow, { key: i, c: c }) })) }))
      content.push(h('div', { key: 'secs', className: 'gs-secs' }, secs))
    }

    content.push(h('div', { key: 'time', className: 'gs-time' }, '生成于 ' + fmtDate(d.generatedAt)))
  }

  return h('div', { className: 'gs-entry' }, fab, h('div', { className: 'gs-panel' }, header, toolbar, h('div', { className: 'gs-body' }, content)))
}

return {
  apply(ctx) {
    ctx.effect(function () { return styles.insert(CSS) })
    const slots = ctx.get('slots')
    if (slots === undefined) return
    slots.inject('conversation.session.header.utilities', function () {
      return slots.register(
        { name: 'conversation.session.header.utilities', id: 'git-summary', order: 30 },
        function (props) { return h(GitSummaryOverlay, props) },
      )
    })
  },
}
