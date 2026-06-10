import { useState, useEffect, useCallback } from 'react'
import {
  Search, Plus, RefreshCw, ChevronDown, ExternalLink,
  Youtube, Instagram, Smartphone, Twitter, CheckCircle,
  XCircle, AlertCircle, Loader2, Zap, Mail, Eye, Trash2, MoreHorizontal
} from 'lucide-react'
import { getCreators, scrapeCreator, analyzeCreator, qualifyCreator, suppressCreator, deleteCreator } from '../../services/opsApi'

const PLATFORM_ICONS = {
  youtube:   { Icon: Youtube,    color: '#ff3b30' },
  instagram: { Icon: Instagram,  color: '#e1306c' },
  tiktok:    { Icon: Smartphone, color: '#00c8c8' },
  twitter:   { Icon: Twitter,    color: '#60a5fa' },
}

const STATUS_STYLES = {
  discovered:   { bg: 'rgba(255,255,255,0.08)',  color: 'rgba(255,255,255,0.5)',  label: 'Discovered' },
  qualified:    { bg: 'rgba(74,222,128,0.12)',   color: '#4ade80',               label: 'Qualified' },
  in_review:    { bg: 'rgba(250,204,21,0.12)',   color: '#facc15',               label: 'In Review' },
  approved:     { bg: 'rgba(74,222,128,0.18)',   color: '#4ade80',               label: 'Approved' },
  disqualified: { bg: 'rgba(239,68,68,0.1)',     color: 'rgba(239,68,68,0.8)',   label: 'Disqualified' },
  suppressed:   { bg: 'rgba(255,255,255,0.04)',  color: 'rgba(255,255,255,0.25)', label: 'Suppressed' },
}

function fmt(n) {
  n = parseInt(n) || 0
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${Math.round(n / 1_000)}K`
  return n > 0 ? String(n) : '—'
}

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.discovered
  return (
    <span
      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
      style={{ background: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  )
}

function ScrapeModal({ onClose, onSuccess }) {
  const [platform, setPlatform] = useState('youtube')
  const [handles, setHandles] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState([])
  const [error, setError] = useState('')

  const run = async () => {
    const list = handles.split(/[\n,]+/).map(h => h.trim()).filter(Boolean)
    if (!list.length) return
    setLoading(true)
    setError('')
    const out = []
    for (const handle of list.slice(0, 20)) {
      try {
        const r = await scrapeCreator(platform, handle)
        out.push({ handle, ok: true, data: r })
      } catch (e) {
        out.push({ handle, ok: false, error: e.message })
      }
    }
    setResults(out)
    setLoading(false)
    if (out.some(r => r.ok)) onSuccess()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md rounded-2xl border overflow-hidden" style={{ background: '#111', borderColor: 'rgba(255,255,255,0.1)' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <p className="text-[14px] font-semibold text-white">Scrape Creator Profiles</p>
          <button onClick={onClose} className="text-white/30 hover:text-white/60 transition-colors">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <p className="text-[11px] font-medium text-white/40 mb-2 uppercase tracking-widest">Platform</p>
            <div className="flex gap-2">
              {['youtube', 'instagram', 'tiktok'].map(p => (
                <button key={p}
                  onClick={() => setPlatform(p)}
                  className="flex-1 py-2 rounded-xl text-[12px] font-medium capitalize transition-all"
                  style={{
                    background: platform === p ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)',
                    color: platform === p ? 'white' : 'rgba(255,255,255,0.4)',
                    border: `1px solid ${platform === p ? 'rgba(255,255,255,0.2)' : 'transparent'}`,
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[11px] font-medium text-white/40 mb-2 uppercase tracking-widest">Handles (one per line or comma-separated)</p>
            <textarea
              value={handles}
              onChange={e => setHandles(e.target.value)}
              placeholder="MrBeast&#10;PewDiePie&#10;mkbhd"
              rows={5}
              className="w-full rounded-xl px-3 py-2.5 text-[13px] text-white placeholder:text-white/20 outline-none resize-none"
              style={{ background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </div>
          {error && <p className="text-[12px] text-red-400">{error}</p>}
          {results.length > 0 && (
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {results.map((r, i) => (
                <div key={i} className="flex items-center gap-2 text-[11px]">
                  {r.ok
                    ? <CheckCircle size={11} className="text-green-400 flex-shrink-0" />
                    : <XCircle size={11} className="text-red-400 flex-shrink-0" />}
                  <span style={{ color: r.ok ? 'rgba(255,255,255,0.7)' : 'rgba(239,68,68,0.8)' }}>
                    @{r.handle} {r.ok ? `— ${fmt(r.data?.follower_count)} followers` : `— ${r.error}`}
                  </span>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={run}
            disabled={loading || !handles.trim()}
            className="w-full py-3 rounded-xl text-[13px] font-semibold text-black transition-all disabled:opacity-40"
            style={{ background: loading ? 'rgba(255,255,255,0.6)' : 'white' }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={13} className="animate-spin" /> Scraping…
              </span>
            ) : 'Run Scraper'}
          </button>
        </div>
      </div>
    </div>
  )
}

function CreatorRow({ creator, onAnalyze, onQualify, onSuppress, onDelete, analyzing, isLast }) {
  const [showMenu, setShowMenu] = useState(false)
  const { Icon, color } = PLATFORM_ICONS[creator.platform] || { Icon: AlertCircle, color: '#fff' }
  const niches = Array.isArray(creator.niche) ? creator.niche : (creator.niche ? [creator.niche] : [])
  const isAnalyzing = analyzing === creator.id

  return (
    <tr
      className="group border-b transition-all duration-300"
      style={{
        borderColor: 'rgba(255,255,255,0.04)',
        background: isAnalyzing ? 'rgba(139,92,246,0.04)' : 'transparent',
        position: 'relative',
      }}
      onMouseEnter={e => { if (!isAnalyzing) e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
      onMouseLeave={e => { if (!isAnalyzing) e.currentTarget.style.background = 'transparent' }}
    >
      {/* Creator */}
      <td className="px-5 py-3" style={{ borderBottomLeftRadius: isLast ? '16px' : 0 }}>
        <div className="flex items-center gap-3">
          {creator.profile_url ? (
            <a href={creator.profile_url} target="_blank" rel="noopener noreferrer" className="block shrink-0 hover:opacity-80 transition-opacity">
              <div
                className="w-9 h-9 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center text-[13px] font-bold"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: `1px solid ${isAnalyzing ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.08)'}`,
                  boxShadow: isAnalyzing ? '0 0 8px rgba(139,92,246,0.3)' : 'none',
                  transition: 'all 0.3s',
                }}
              >
                {creator.avatar_url
                  ? <img src={creator.avatar_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={e => e.currentTarget.style.display = 'none'} />
                  : (creator.display_name || creator.handle || '?').charAt(0).toUpperCase()}
              </div>
            </a>
          ) : (
            <div
              className="w-9 h-9 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center text-[13px] font-bold"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: `1px solid ${isAnalyzing ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.08)'}`,
                boxShadow: isAnalyzing ? '0 0 8px rgba(139,92,246,0.3)' : 'none',
                transition: 'all 0.3s',
              }}
            >
              {creator.avatar_url
                ? <img src={creator.avatar_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={e => e.currentTarget.style.display = 'none'} />
                : (creator.display_name || creator.handle || '?').charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-white truncate">{creator.display_name || creator.handle}</p>
            <p className="text-[11px] truncate" style={{ color: 'rgba(255,255,255,0.35)' }}>@{creator.handle}</p>
          </div>
        </div>
      </td>

      {/* Platform */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <Icon size={12} style={{ color }} />
          <span className="text-[11px] capitalize" style={{ color: 'rgba(255,255,255,0.5)' }}>{creator.platform}</span>
        </div>
      </td>

      {/* Followers */}
      <td className="px-4 py-3">
        <span className="text-[13px] font-semibold text-white">{fmt(creator.follower_count)}</span>
      </td>

      {/* Score */}
      <td className="px-4 py-3">
        <span className="text-[13px] font-semibold" style={{ color: creator.engagement_score >= 8 ? '#4ade80' : creator.engagement_score >= 5 ? '#facc15' : 'rgba(255,255,255,0.2)' }}>
          {creator.engagement_score ? `${creator.engagement_score}/10` : 'Not provided'}
        </span>
      </td>

      {/* Niche */}
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {niches.length > 0 ? (
            niches.slice(0, 3).map(n => (
              <span key={n} className="text-[9px] px-1.5 py-0.5 rounded-full capitalize"
                style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.45)' }}>
                {n}
              </span>
            ))
          ) : (
            <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.2)' }}>Not provided</span>
          )}
        </div>
      </td>

      {/* Email */}
      <td className="px-4 py-3">
        <span className="text-[11px]" style={{ color: creator.email_public ? '#4ade80' : 'rgba(255,255,255,0.2)' }}>
          {creator.email_public || 'Not provided'}
        </span>
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        {isAnalyzing
          ? (
            <span className="inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full font-semibold"
              style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.3)' }}>
              <Loader2 size={10} className="animate-spin" />
              Analyzing…
            </span>
          )
          : <StatusBadge status={creator.status} />
        }
      </td>

      {/* Actions */}
      <td className="px-4 py-3 relative" style={{ borderBottomRightRadius: isLast ? '16px' : 0 }}>
        {isAnalyzing ? (
          <div className="w-8 h-8 flex items-center justify-center">
            <Loader2 size={14} className="animate-spin" style={{ color: '#a78bfa' }} />
          </div>
        ) : (
          <>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
              style={{ background: showMenu ? 'rgba(255,255,255,0.1)' : 'transparent', color: showMenu ? 'white' : 'rgba(255,255,255,0.5)' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'white' }}
              onMouseLeave={e => { if (!showMenu) e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
            >
              <MoreHorizontal size={14} />
            </button>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)}></div>
                <div className="absolute right-4 top-10 z-50 w-40 rounded-xl py-1 shadow-xl border overflow-hidden"
                     style={{ background: '#1a1a1a', borderColor: 'rgba(255,255,255,0.08)' }}>
                  
                  <button onClick={() => { setShowMenu(false); onAnalyze(creator.id) }}
                          className="w-full px-3 py-2 text-left text-[12px] flex items-center gap-2 hover:bg-white/5 transition-colors text-white">
                    <Zap size={12} /> Analyze with AI
                  </button>
                  
                  <button onClick={() => { setShowMenu(false); onQualify(creator.id, 'qualified') }}
                          className="w-full px-3 py-2 text-left text-[12px] flex items-center gap-2 hover:bg-white/5 transition-colors text-[#4ade80]">
                    <CheckCircle size={12} /> Mark Qualified
                  </button>

                  <button onClick={() => { setShowMenu(false); onSuppress(creator.id) }}
                          className="w-full px-3 py-2 text-left text-[12px] flex items-center gap-2 hover:bg-white/5 transition-colors" style={{ color: 'rgba(239,68,68,0.8)' }}>
                    <XCircle size={12} /> Suppress
                  </button>

                  <button onClick={() => { setShowMenu(false); onDelete(creator.id) }}
                          className="w-full px-3 py-2 text-left text-[12px] flex items-center gap-2 hover:bg-white/5 transition-colors" style={{ color: '#ef4444' }}>
                    <Trash2 size={12} /> Delete
                  </button>
                  
                  {creator.profile_url && (
                    <a href={creator.profile_url} target="_blank" rel="noopener noreferrer" onClick={() => setShowMenu(false)}
                       className="w-full px-3 py-2 text-left text-[12px] flex items-center gap-2 hover:bg-white/5 transition-colors text-white/70">
                      <ExternalLink size={12} /> View Profile
                    </a>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </td>
    </tr>
  )
}

function ConfirmModal({ title, message, confirmLabel, confirmBg, onClose, onConfirm }) {
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onConfirm()
      onClose()
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-sm rounded-2xl border overflow-hidden animate-in fade-in zoom-in-95 duration-150" style={{ background: '#111', borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <p className="text-[13px] font-semibold text-white uppercase tracking-wider">{title}</p>
          <button onClick={onClose} disabled={loading} className="text-white/30 hover:text-white/60 transition-colors">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-[13px] text-white/70 leading-relaxed">{message}</p>
          
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-[12px] font-semibold text-white/60 hover:text-white hover:bg-white/5 transition-all"
              style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'transparent' }}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-[12px] font-semibold text-white transition-all flex items-center justify-center gap-1.5"
              style={{ background: confirmBg }}
            >
              {loading ? (
                <>
                  <Loader2 size={12} className="animate-spin" /> Processing…
                </>
              ) : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ToastNotification({ toast, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  const isSuccess = toast.type === 'success'

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl border transition-all duration-300 animate-in fade-in slide-in-from-bottom-5"
         style={{
           background: '#141414',
           borderColor: isSuccess ? 'rgba(74,222,128,0.18)' : 'rgba(239,68,68,0.18)',
           boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
         }}>
      {isSuccess ? (
        <CheckCircle size={14} className="text-green-400" />
      ) : (
        <AlertCircle size={14} className="text-red-400" />
      )}
      <p className="text-[12px] font-medium text-white/90">{toast.message}</p>
      <button onClick={onClose} className="text-white/20 hover:text-white/40 ml-2 transition-colors">✕</button>
    </div>
  )
}

export default function LeadList({ onCountChange }) {
  const [creators, setCreators] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [search, setSearch]     = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [analyzing, setAnalyzing] = useState(null)
  const [showScrape, setShowScrape] = useState(false)
  const [toast, setToast] = useState(null)
  const [confirmModal, setConfirmModal] = useState(null)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
  }

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = {}
      if (statusFilter) params.status = statusFilter
      if (search) params.search = search
      const data = await getCreators(params)
      const list = Array.isArray(data) ? data : (data.creators || data.items || [])
      console.log('Creators list:', list)
      setCreators(list)
      onCountChange?.(list.length)
    } catch (e) {
      setError(e.message)
      setCreators([])
      onCountChange?.(0)
    }
    setLoading(false)
  }, [search, statusFilter])

  useEffect(() => { load() }, [load])

  const handleAnalyze = async (id) => {
    setAnalyzing(id)
    try { 
      const res = await analyzeCreator(id) 
      console.log('Analysis result:', res)
    } catch (e) { 
      console.warn('Analysis error:', e) 
    }
    setAnalyzing(null)
    load()
  }

  const handleQualify = async (id, status) => {
    try { await qualifyCreator(id, status) } catch (e) { console.warn(e) }
    load()
  }

  const handleSuppress = async (id) => {
    const c = creators.find(x => x.id === id)
    if (!c) return
    const handle = c.handle
    setConfirmModal({
      title: 'Suppress Creator',
      message: `Are you sure you want to suppress @${handle}? They will be marked as suppressed and excluded from all future outreach.`,
      confirmLabel: 'Suppress',
      confirmBg: '#f59e0b',
      onConfirm: async () => {
        try {
          await suppressCreator(id)
          showToast(`@${handle} has been suppressed.`, 'success')
        } catch (e) {
          showToast(`Failed to suppress: ${e.message}`, 'error')
        }
        load()
      }
    })
  }

  const handleDelete = async (id) => {
    const c = creators.find(x => x.id === id)
    if (!c) return
    const handle = c.handle
    setConfirmModal({
      title: 'Delete Creator',
      message: `Are you sure you want to delete @${handle} entirely? This action cannot be undone.`,
      confirmLabel: 'Delete',
      confirmBg: '#ef4444',
      onConfirm: async () => {
        try {
          await deleteCreator(id)
          showToast(`@${handle} has been deleted.`, 'success')
        } catch (e) {
          showToast(`Failed to delete: ${e.message}`, 'error')
        }
        load()
      }
    })
  }

  const filtered = creators.filter(c => {
    if (!search) return true
    const q = search.toLowerCase()
    return (c.handle || '').toLowerCase().includes(q) ||
           (c.display_name || '').toLowerCase().includes(q) ||
           (c.email_public || '').toLowerCase().includes(q)
  })

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-[18px] font-bold text-white">Creator Leads</h2>
          <p className="text-[12px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {creators.length} creators in database
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
            style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'white' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setShowScrape(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-semibold text-black transition-all"
            style={{ background: 'white' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.9)'}
            onMouseLeave={e => e.currentTarget.style.background = 'white'}
          >
            <Plus size={13} /> Add Creators
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)' }}>
          <Search size={13} style={{ color: 'rgba(255,255,255,0.3)' }} />
          <input
            className="flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-white/25"
            placeholder="Search by handle, name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-xl text-[12px] outline-none"
          style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}
        >
          <option value="">All statuses</option>
          <option value="discovered">Discovered</option>
          <option value="qualified">Qualified</option>
          <option value="in_review">In Review</option>
          <option value="approved">Approved</option>
          <option value="disqualified">Disqualified</option>
          <option value="suppressed">Suppressed</option>
        </select>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl flex items-center gap-2"
          style={{ background: 'rgba(255,180,0,0.08)', border: '1px solid rgba(255,180,0,0.2)' }}>
          <AlertCircle size={13} style={{ color: 'rgba(255,200,50,0.9)' }} />
          <p className="text-[11px]" style={{ color: 'rgba(255,200,50,0.8)' }}>
            Backend offline — showing demo data. {error}
          </p>
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
        <table className="w-full" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead>
            <tr style={{ background: '#0e0e0e' }}>
              {['Creator', 'Platform', 'Followers', 'Score', 'Niche', 'Email', 'Status', 'Actions'].map((h, i, arr) => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest"
                  style={{ 
                    color: 'rgba(255,255,255,0.3)',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    borderTopLeftRadius: i === 0 ? '16px' : 0,
                    borderTopRightRadius: i === arr.length - 1 ? '16px' : 0,
                  }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody style={{ background: '#0a0a0a' }}>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-12">
                <Loader2 size={20} className="animate-spin mx-auto mb-2" style={{ color: 'rgba(255,255,255,0.3)' }} />
                <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.3)' }}>Loading leads…</p>
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-12">
                <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.3)' }}>No creators found.</p>
                <button onClick={() => setShowScrape(true)} className="mt-3 text-[12px] underline" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Add your first creator →
                </button>
              </td></tr>
            ) : (
              filtered.map((c, i) => (
                <CreatorRow
                  key={c.id}
                  creator={c}
                  onAnalyze={handleAnalyze}
                  onQualify={handleQualify}
                  onSuppress={handleSuppress}
                  onDelete={handleDelete}
                  analyzing={analyzing}
                  isLast={i === filtered.length - 1}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Scrape modal */}
      {showScrape && (
        <ScrapeModal
          onClose={() => setShowScrape(false)}
          onSuccess={() => {
            setShowScrape(false)
            load()
            showToast('Creators added successfully!', 'success')
          }}
        />
      )}

      {/* Custom confirm modal */}
      {confirmModal && (
        <ConfirmModal
          title={confirmModal.title}
          message={confirmModal.message}
          confirmLabel={confirmModal.confirmLabel}
          confirmBg={confirmModal.confirmBg}
          onClose={() => setConfirmModal(null)}
          onConfirm={confirmModal.onConfirm}
        />
      )}

      {/* Custom toast alert */}
      {toast && (
        <ToastNotification
          toast={toast}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
