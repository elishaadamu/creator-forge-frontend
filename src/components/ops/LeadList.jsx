import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Search, Plus, RefreshCw, ChevronDown, ExternalLink,
  Youtube, Instagram, Smartphone, Twitter, CheckCircle,
  XCircle, AlertCircle, Loader2, Zap, Mail, Eye, Trash2, MoreHorizontal,
  ArrowLeft, Calendar, Cpu, ShieldCheck, Activity, Copy, Check, ChevronUp
} from 'lucide-react'
import { getCreators, scrapeCreator, analyzeCreator, qualifyCreator, suppressCreator, deleteCreator, getCreatorAnalysis } from '../../services/opsApi'

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
    
    let scraper = null
    try {
      scraper = await import('../../services/scraper')
    } catch (e) {
      console.warn('Scraper module import failed:', e)
    }

    for (const handle of list.slice(0, 20)) {
      let scrapedOk = false
      let creatorData = null
      let errMsg = ''

      // Try frontend Apify first if keys are configured in frontend local memory
      if (scraper && scraper.hasKey(platform)) {
        try {
          const scraped = await scraper.startScrape(handle, platform)
          if (scraped && !scraped.error) {
            const payload = {
              handle: scraped.handle,
              platform: scraped.platform,
              display_name: scraped.display_name,
              bio: scraped.bio,
              profile_url: scraped.profile_url,
              avatar_url: scraped.avatarUrl || scraped.avatar_url,
              follower_count: scraped.follower_count || 0,
              niche: scraped.niche || [],
              website: scraped.website,
              email_public: scraped.email_public,
              discovery_source: 'scrape'
            }
            const saveRes = await saveCreator(payload)
            if (saveRes && (saveRes.creator || saveRes.created)) {
              scrapedOk = true
              creatorData = saveRes.creator
              
              if (scraped.email_public && saveRes.creator?.id) {
                await fetch(`/api/creators/${saveRes.creator.id}/contacts`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    contact_type: 'email',
                    value: scraped.email_public,
                    source: 'scraped_bio'
                  })
                }).catch(err => console.warn('Failed to save email contact:', err))
              }
              if (scraped.social_links && scraped.social_links.length > 0 && saveRes.creator?.id) {
                for (const link of scraped.social_links.slice(0, 3)) {
                  await fetch(`/api/creators/${saveRes.creator.id}/contacts`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      contact_type: 'business_inquiry_form',
                      value: link,
                      source: 'scraped_profile'
                    })
                  }).catch(err => console.warn('Failed to save social link:', err))
                }
              }
            } else {
              errMsg = 'Failed to save creator profile to database'
            }
          } else {
            errMsg = scraped?.error || 'Scraper did not return data'
          }
        } catch (e) {
          console.warn(`Frontend scrape failed for ${handle}, falling back to backend:`, e)
          errMsg = e.message
        }
      }

      // Fallback to backend scraper
      if (!scrapedOk) {
        try {
          const r = await scrapeCreator(platform, handle)
          out.push({ handle, ok: true, data: r.creator || r })
        } catch (e) {
          out.push({ handle, ok: false, error: errMsg || e.message })
        }
      } else {
        out.push({ handle, ok: true, data: creatorData })
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

const COMMON_NICHES = [
  'Tech', 'Finance', 'Business', 'Fitness', 'Health', 'Gaming', 'Beauty', 'Fashion', 'Food', 'Cooking', 'Travel', 'Lifestyle', 'Education'
]

function CreatorCard({ creator, onAnalyze, onQualify, onSuppress, onDelete, onViewAnalysis, analyzing }) {
  const [showMenu, setShowMenu] = useState(false)
  const isAnalyzing = analyzing === creator.id
  const { Icon, color } = PLATFORM_ICONS[creator.platform] || { Icon: AlertCircle, color: '#fff' }
  const niches = Array.isArray(creator.niche) ? creator.niche : (creator.niche ? [creator.niche] : [])

  const getInitialsGradient = (name) => {
    const code = (name || 'CF').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const gradients = [
      'linear-gradient(135deg, #059669 0%, #10b981 100%)', // Emerald
      'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)', // Blue
      'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)', // Purple
      'linear-gradient(135deg, #b45309 0%, #f59e0b 100%)', // Amber
      'linear-gradient(135deg, #db2777 0%, #f472b6 100%)', // Pink
      'linear-gradient(135deg, #475569 0%, #64748b 100%)', // Slate
      'linear-gradient(135deg, #0369a1 0%, #0ea5e9 100%)', // Sky
    ]
    return gradients[code % gradients.length]
  }

  const initials = (creator.display_name || creator.handle || '?')
    .replace(/^@/, '')
    .split(' ')
    .map(w => w.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div
      className="group relative rounded-2xl border flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
      style={{
        background: '#0e0e0e',
        borderColor: isAnalyzing ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.06)',
        boxShadow: isAnalyzing ? '0 0 15px rgba(139,92,246,0.15)' : 'none',
      }}
      onMouseEnter={e => {
        if (!isAnalyzing) {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
          e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.5)'
        }
      }}
      onMouseLeave={e => {
        if (!isAnalyzing) {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
          e.currentTarget.style.boxShadow = 'none'
        }
      }}
    >
      {/* Top Banner (Avatar or colored block) */}
      <div className="h-40 relative overflow-hidden bg-white/5 flex-shrink-0 flex items-center justify-center">
        {creator.avatar_url ? (
          <img
            src={creator.avatar_url}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            referrerPolicy="no-referrer"
            onError={e => {
              e.currentTarget.style.display = 'none'
              const placeholder = e.currentTarget.nextSibling
              if (placeholder) placeholder.style.display = 'flex'
            }}
          />
        ) : null}

        {/* Initials Placeholder */}
        <div
          className="absolute inset-0 flex items-center justify-center text-[40px] font-bold text-white tracking-wider"
          style={{
            background: getInitialsGradient(creator.display_name || creator.handle),
            display: creator.avatar_url ? 'none' : 'flex'
          }}
        >
          {initials}
        </div>

        {/* Top-Left Platform Badge */}
        <div
          className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-bold tracking-widest text-white/95 uppercase backdrop-blur-md"
          style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <Icon size={10} style={{ color }} />
          <span>{creator.platform}</span>
        </div>

        {/* Top-Right More Menu */}
        <div className="absolute top-3 right-3 z-10">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all backdrop-blur-md text-white/60 hover:text-white"
            style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <MoreHorizontal size={13} />
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)}></div>
              <div className="absolute right-0 top-8 z-50 w-40 rounded-xl py-1 shadow-2xl border overflow-hidden"
                   style={{ background: '#141414', borderColor: 'rgba(255,255,255,0.09)' }}>
                
                <button onClick={() => { setShowMenu(false); onViewAnalysis(creator) }}
                        className="w-full px-3 py-2 text-left text-[12px] flex items-center gap-2 hover:bg-white/5 transition-colors text-white">
                  <Eye size={12} /> Deep Analysis
                </button>

                <button onClick={() => { setShowMenu(false); onAnalyze(creator.id) }}
                        className="w-full px-3 py-2 text-left text-[12px] flex items-center gap-2 hover:bg-white/5 transition-colors text-white font-medium">
                  <Zap size={12} className="text-yellow-400" /> Analyze with AI
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
        </div>

        {/* Bottom-Right AI Engagement Score Badge */}
        {creator.engagement_score ? (
          <button
            onClick={() => onViewAnalysis(creator)}
            className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold backdrop-blur-md border hover:scale-105 transition-transform"
            style={{
              background: 'rgba(0,0,0,0.65)',
              borderColor: 'rgba(255,255,255,0.08)',
              color: creator.engagement_score >= 8 ? '#4ade80' : creator.engagement_score >= 5 ? '#facc15' : 'rgba(255,255,255,0.4)'
            }}
          >
            <span>Score: {creator.engagement_score}/10</span>
          </button>
        ) : null}
      </div>

      {/* Card Content Area */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-[14px] font-bold text-white leading-tight truncate mb-0.5" title={creator.display_name || creator.handle}>
            {creator.display_name || creator.handle}
          </h3>
          <p className="text-[11px] text-white/40 truncate">@{creator.handle}</p>

          <div className="mt-2 text-[12px] font-medium text-white/80">
            {fmt(creator.follower_count)} followers
          </div>

          {/* Niches */}
          <div className="flex flex-wrap gap-1 mt-3">
            {niches.length > 0 ? (
              niches.slice(0, 3).map(n => (
                <span key={n} className="text-[9px] px-1.5 py-0.5 rounded-md capitalize"
                  style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.03)' }}>
                  {n}
                </span>
              ))
            ) : (
              <span className="text-[10px] text-white/20 italic">No tags</span>
            )}
          </div>
        </div>

        {/* Footer info (Status & Email indicator) */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
          <StatusBadge status={creator.status} />

          {creator.email_public ? (
            <div className="w-5 h-5 rounded-md flex items-center justify-center bg-green-500/10 text-green-400 border border-green-500/20" title={creator.email_public}>
              <Mail size={10} />
            </div>
          ) : (
            <div className="w-5 h-5 rounded-md flex items-center justify-center bg-white/5 text-white/20" title="No public email">
              <Mail size={10} />
            </div>
          )}
        </div>
      </div>

      {/* Loader Overlay (for AI analysis) */}
      {isAnalyzing && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2.5 backdrop-blur-md animate-fade-in"
             style={{ background: 'rgba(0,0,0,0.7)' }}>
          <Loader2 size={22} className="animate-spin text-purple-400" />
          <p className="text-[11px] font-semibold text-purple-300 tracking-wide uppercase">Analyzing Profile…</p>
        </div>
      )}
    </div>
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
    const timer = setTimeout(onClose, 3500)
    return () => clearTimeout(timer)
  }, [onClose])

  const isSuccess = toast.type === 'success'
  const isInfo = toast.type === 'info'
  
  const accent = isSuccess
    ? { rgb: '52,211,153', border: 'rgba(52,211,153,0.15)', bgGlow: 'rgba(52,211,153,0.06)', iconColor: '#34d399' }
    : isInfo
    ? { rgb: '139,92,246', border: 'rgba(139,92,246,0.15)', bgGlow: 'rgba(139,92,246,0.06)', iconColor: '#a78bfa' }
    : { rgb: '248,113,113', border: 'rgba(248,113,113,0.15)', bgGlow: 'rgba(248,113,113,0.06)', iconColor: '#f87171' }

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3.5 rounded-2xl border shadow-[0_24px_64px_rgba(0,0,0,0.7)] overflow-hidden"
      style={{
        background: `radial-gradient(circle at 0% 0%, rgba(${accent.rgb}, 0.12) 0%, transparent 60%), rgba(13, 13, 13, 0.85)`,
        borderColor: 'rgba(255,255,255,0.08)',
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.05)`,
        backdropFilter: 'blur(20px) saturate(190%)',
        minWidth: 300,
        maxWidth: 400,
        padding: '12px 14px',
        animation: 'toastSlideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
      }}
    >
      <style>{`
        @keyframes toastSlideIn {
          0% { opacity: 0; transform: translateY(30px) scale(0.92) rotate(0.5deg); filter: blur(5px); }
          100% { opacity: 1; transform: translateY(0) scale(1) rotate(0); filter: blur(0); }
        }
      `}</style>
      
      {/* Top border glow segment */}
      <div
        className="absolute inset-x-0 top-0 h-[1px]"
        style={{
          background: `linear-gradient(90deg, transparent 0%, rgba(${accent.rgb},0.35) 15%, rgba(${accent.rgb},0.08) 50%, transparent 100%)`
        }}
      />

      {/* Icon container */}
      <div
        className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center border"
        style={{
          background: accent.bgGlow,
          borderColor: accent.border,
          boxShadow: `0 4px 12px rgba(${accent.rgb}, 0.05)`
        }}
      >
        {isSuccess ? (
          <CheckCircle size={15} style={{ color: accent.iconColor }} />
        ) : (
          <AlertCircle size={15} style={{ color: accent.iconColor }} />
        )}
      </div>

      {/* Text content */}
      <p className="flex-1 text-[12px] font-medium tracking-wide text-white/90 leading-snug">{toast.message}</p>

      {/* Close button */}
      <button
        onClick={onClose}
        className="w-5 h-5 rounded-full flex items-center justify-center transition-all duration-150 flex-shrink-0"
        style={{
          background: 'rgba(255,255,255,0.04)',
          color: 'rgba(255,255,255,0.4)',
          border: '1px solid rgba(255,255,255,0.05)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
          e.currentTarget.style.color = '#fff'
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
          e.currentTarget.style.color = 'rgba(255,255,255,0.4)'
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'
        }}
      >
        ✕
      </button>
    </div>
  )
}

const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-white/50 hover:text-white flex items-center gap-1 text-[11px]"
    >
      {copied ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

function DeepAnalysisView({ analysis, creator, onBack, onReanalyze, analyzing }) {
  const [showRaw, setShowRaw] = useState(false)
  const { Icon, color } = PLATFORM_ICONS[creator.platform] || { Icon: AlertCircle, color: '#fff' }

  const demandSignals = analysis.audience_demand_signals || {}
  const desireSignals = demandSignals.desire_signals || []
  const buyingIntent = demandSignals.buying_intent_indicators || []
  const painPoints = analysis.audience_pain_points || []
  const contentThemes = analysis.content_themes || []
  const recommendedNiches = analysis.recommended_niches || []

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2.5 rounded-xl hover:bg-white/5 text-white/60 hover:text-white transition-all flex items-center gap-2 text-[12px] font-medium"
            style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'transparent' }}
          >
            <ArrowLeft size={14} /> Back to Leads
          </button>
          
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center text-[16px] font-bold shrink-0"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {creator.avatar_url
                ? <img src={creator.avatar_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={e => e.currentTarget.style.display = 'none'} />
                : (creator.display_name || creator.handle || '?').charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[18px] font-bold text-white leading-tight">{creator.display_name || creator.handle}</h2>
                <StatusBadge status={creator.status} />
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.4)' }}>@{creator.handle}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full capitalize flex items-center gap-1"
                  style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)' }}>
                  <Icon size={10} style={{ color }} /> {creator.platform}
                </span>
                <span className="text-[12px] text-white/30">•</span>
                <span className="text-[12px] font-semibold text-white/70">{fmt(creator.follower_count)} followers</span>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => onReanalyze(creator.id)}
          disabled={analyzing}
          className="px-4 py-2.5 rounded-xl text-[12px] font-semibold text-white/90 hover:text-white transition-all flex items-center justify-center gap-1.5 shrink-0 bg-transparent"
          style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)' }}
        >
          {analyzing ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
          {analyzing ? 'Analyzing…' : 'Re-Run AI Analysis'}
        </button>
      </div>

      {/* Stats and Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Engagement Card */}
        <div className="p-5 rounded-2xl border flex flex-col justify-between" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-widest text-white/40">Engagement Quality</p>
            <Activity size={14} className="text-[#a78bfa]" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-[32px] font-bold text-white tracking-tight">{analysis.engagement_quality_score || 'N/A'}</span>
            <span className="text-[14px] text-white/30">/ 10</span>
          </div>
          <div className="mt-3 h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-500" 
              style={{ 
                width: `${(analysis.engagement_quality_score || 0) * 10}%`,
                background: 'linear-gradient(90deg, #8b5cf6, #ec4899)'
              }}
            />
          </div>
        </div>

        {/* Brand Safety Card */}
        <div className="p-5 rounded-2xl border flex flex-col justify-between" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-widest text-white/40">Brand Safety</p>
            <ShieldCheck size={14} className="text-green-400" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-[32px] font-bold text-white tracking-tight">{analysis.brand_safety_score || 'N/A'}</span>
            <span className="text-[14px] text-white/30">/ 10</span>
          </div>
          <div className="mt-3 h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-500" 
              style={{ 
                width: `${(analysis.brand_safety_score || 0) * 10}%`,
                background: 'linear-gradient(90deg, #10b981, #3b82f6)'
              }}
            />
          </div>
        </div>

        {/* AI Model Meta */}
        <div className="p-5 rounded-2xl border flex flex-col justify-between" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-widest text-white/40">AI Engine</p>
            <Cpu size={14} className="text-yellow-400" />
          </div>
          <div className="mt-4 space-y-1.5">
            <div className="flex justify-between text-[12px]">
              <span className="text-white/40">Model:</span>
              <span className="text-white/80 font-medium capitalize">{analysis.model_used || 'Claude 3.5 Sonnet'}</span>
            </div>
            <div className="flex justify-between text-[12px]">
              <span className="text-white/40">Analyzed At:</span>
              <span className="text-white/80 font-medium">
                {analysis.analyzed_at ? new Date(analysis.analyzed_at).toLocaleDateString() : 'Just now'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Section */}
      <div className="p-5 rounded-2xl border space-y-3" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <h3 className="text-[13px] font-bold uppercase tracking-widest text-white/50">Executive Profile Analysis</h3>
        <p className="text-[14px] text-white/80 leading-relaxed font-normal whitespace-pre-wrap">{analysis.summary || 'No summary available.'}</p>
      </div>

      {/* Deep Dive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Column 1: Audience & Monetization */}
        <div className="space-y-6">
          {/* Audience Pain Points */}
          <div className="p-5 rounded-2xl border space-y-3" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <h3 className="text-[13px] font-bold uppercase tracking-widest text-white/50">Audience Pain Points</h3>
            {painPoints.length > 0 ? (
              <ul className="space-y-2 text-[13px] text-white/80">
                {painPoints.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 leading-relaxed">
                    <span className="text-[#a78bfa] mt-1 shrink-0">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[12px] text-white/30 italic">No specific pain points identified.</p>
            )}
          </div>

          {/* Recommended Niches */}
          <div className="p-5 rounded-2xl border space-y-3" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <h3 className="text-[13px] font-bold uppercase tracking-widest text-white/50">Monetization Opportunities</h3>
            {recommendedNiches.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {recommendedNiches.map((niche, idx) => (
                  <span key={idx} className="text-[11px] font-medium px-2.5 py-1 rounded-xl capitalize"
                    style={{ background: 'rgba(139,92,246,0.1)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.15)' }}>
                    {niche}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-white/30 italic">No recommended niches generated.</p>
            )}
          </div>
        </div>

        {/* Column 2: Signals & Themes */}
        <div className="space-y-6">
          {/* Content Themes */}
          <div className="p-5 rounded-2xl border space-y-3" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <h3 className="text-[13px] font-bold uppercase tracking-widest text-white/50">Core Content Themes</h3>
            {contentThemes.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {contentThemes.map((theme, idx) => (
                  <span key={idx} className="text-[11px] font-medium px-2.5 py-1 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    {theme}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-white/30 italic">No content themes catalogued.</p>
            )}
          </div>

          {/* Buying Intent / Desire Signals */}
          <div className="p-5 rounded-2xl border space-y-4" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <h3 className="text-[13px] font-bold uppercase tracking-widest text-white/50">Audience Purchase Intent</h3>
            
            {/* Buying Intent Indicators */}
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">Purchase Intent Indicators</p>
              {buyingIntent.length > 0 ? (
                <ul className="space-y-1.5 text-[12px] text-white/80">
                  {buyingIntent.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-green-400 mt-1 shrink-0">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[11px] text-white/30 italic">No intent indicators found.</p>
              )}
            </div>

            {/* Desire Signals */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <p className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">Desire Signals</p>
              {desireSignals.length > 0 ? (
                <ul className="space-y-1.5 text-[12px] text-white/80">
                  {desireSignals.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-yellow-400 mt-1 shrink-0">★</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[11px] text-white/30 italic">No desire signals recorded.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Raw Output Block */}
      <div className="p-5 rounded-2xl border space-y-3" style={{ background: 'rgba(255,255,255,0.01)', borderColor: 'rgba(255,255,255,0.05)' }}>
        <button
          onClick={() => setShowRaw(!showRaw)}
          className="w-full flex items-center justify-between text-left text-[12px] font-semibold text-white/40 hover:text-white/70 transition-colors uppercase tracking-wider outline-none"
        >
          <span>Raw Analysis JSON</span>
          <div className="flex items-center gap-3">
            <CopyButton text={JSON.stringify(analysis, null, 2)} />
            <ChevronUp size={14} className={`transition-transform duration-300 ${showRaw ? '' : 'rotate-180'}`} />
          </div>
        </button>
        {showRaw && (
          <div className="mt-3 rounded-xl overflow-hidden border" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <pre className="p-4 text-[11px] text-white/75 font-mono overflow-auto max-h-[300px] leading-relaxed" style={{ background: '#070707' }}>
              {JSON.stringify(analysis, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}

export default function LeadList({ onCountChange }) {
  const [creators, setCreators] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [search, setSearch]     = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [platformFilter, setPlatformFilter] = useState('')
  const [sizeFilter, setSizeFilter]         = useState('')
  const [nicheFilter, setNicheFilter]       = useState('')
  const [scrapingInline, setScrapingInline] = useState(false)
  const [analyzing, setAnalyzing] = useState(null)
  const [showScrape, setShowScrape] = useState(false)
  const [toast, setToast] = useState(null)
  const [confirmModal, setConfirmModal] = useState(null)

  // Detailed Analysis States
  const [selectedAnalysis, setSelectedAnalysis] = useState(null)
  const [loadingAnalysis, setLoadingAnalysis] = useState(false)
  const [selectedCreator, setSelectedCreator] = useState(null)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
  }

  const onCountChangeRef = useRef(onCountChange)
  useEffect(() => {
    onCountChangeRef.current = onCountChange
  }, [onCountChange])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getCreators({ limit: 150 })
      const list = Array.isArray(data) ? data : (data.creators || data.items || [])
      console.log('Creators list loaded:', list)
      setCreators(list)
      onCountChangeRef.current?.(list.length)
    } catch (e) {
      setError(e.message)
      setCreators([])
      onCountChangeRef.current?.(0)
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleAnalyze = async (id) => {
    setAnalyzing(id)
    try { 
      const res = await analyzeCreator(id) 
      console.log('Analysis result:', res)
      showToast('AI analysis completed successfully!', 'success')
      // If currently viewing, reload the analysis details
      if (selectedCreator && selectedCreator.id === id) {
        const updatedAnalysis = await getCreatorAnalysis(id)
        setSelectedAnalysis(updatedAnalysis)
      }
    } catch (e) { 
      console.warn('Analysis error:', e) 
      showToast(`AI Analysis failed: ${e.message}`, 'error')
    }
    setAnalyzing(null)
    load()
  }

  const handleViewAnalysis = async (creator) => {
    setLoadingAnalysis(true)
    setSelectedCreator(creator)
    try {
      const data = await getCreatorAnalysis(creator.id)
      setSelectedAnalysis(data)
    } catch (e) {
      showToast('No analysis found. Try running "Analyze with AI" first.', 'error')
      setSelectedCreator(null)
      setSelectedAnalysis(null)
    }
    setLoadingAnalysis(false)
  }

  const handleQualify = async (id, status) => {
    try { 
      await qualifyCreator(id, status) 
      if (selectedCreator && selectedCreator.id === id) {
        setSelectedCreator(prev => ({ ...prev, status }))
      }
      showToast(`Creator status updated to ${status}.`, 'success')
    } catch (e) { 
      console.warn(e) 
      showToast(`Failed to update status: ${e.message}`, 'error')
    }
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
          if (selectedCreator && selectedCreator.id === id) {
            setSelectedCreator(prev => ({ ...prev, status: 'suppressed' }))
          }
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
          if (selectedCreator && selectedCreator.id === id) {
            setSelectedCreator(null)
            setSelectedAnalysis(null)
          }
        } catch (e) {
          showToast(`Failed to delete: ${e.message}`, 'error')
        }
        load()
      }
    })
  }

  const handleInlineScrape = async () => {
    if (!search.trim()) return
    setScrapingInline(true)
    try {
      let inputVal = search.trim()
      let platform = 'youtube'
      let handle = inputVal

      if (inputVal.includes('instagram.com/')) {
        platform = 'instagram'
        const parts = inputVal.split('instagram.com/')
        handle = parts[1].split(/[/?#]/)[0]
      } else if (inputVal.includes('tiktok.com/')) {
        platform = 'tiktok'
        const parts = inputVal.split('tiktok.com/')
        handle = parts[1].split(/[/?#]/)[0]
      } else if (inputVal.includes('youtube.com/')) {
        platform = 'youtube'
        const parts = inputVal.split('youtube.com/')
        handle = parts[1].split(/[/?#]/)[0]
      } else if (inputVal.includes('twitter.com/') || inputVal.includes('x.com/')) {
        platform = 'twitter'
        const parts = inputVal.includes('twitter.com/') ? inputVal.split('twitter.com/') : inputVal.split('x.com/')
        handle = parts[1].split(/[/?#]/)[0]
      } else {
        if (inputVal.startsWith('@')) {
          handle = inputVal
        }
        if (platformFilter) {
          platform = platformFilter
        }
      }

      showToast(`Scraping @${handle} on ${platform}...`, 'info')
      const r = await scrapeCreator(platform, handle)
      showToast(`Successfully scraped and saved @${handle}!`, 'success')
      setSearch('')
      load()
    } catch (e) {
      console.error(e)
      showToast(`Scrape failed: ${e.message}`, 'error')
    }
    setScrapingInline(false)
  }

  const handleInlineLookup = () => {
    if (!search.trim()) return
    const found = creators.find(c =>
      (c.handle || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.display_name || '').toLowerCase().includes(search.toLowerCase())
    )
    if (found) {
      showToast(`Found @${found.handle} in database!`, 'success')
      setPlatformFilter(found.platform)
      setSearch(found.handle)
    } else {
      showToast(`"@${search}" not found in database. Click "⚡ Scrape" to fetch them!`, 'error')
    }
  }

  const filtered = creators.filter(c => {
    if (search) {
      const q = search.toLowerCase()
      const matchesText = (c.handle || '').toLowerCase().includes(q) ||
                          (c.display_name || '').toLowerCase().includes(q) ||
                          (c.email_public || '').toLowerCase().includes(q)
      if (!matchesText) return false
    }
    if (platformFilter && c.platform !== platformFilter) {
      return false
    }
    if (statusFilter && c.status !== statusFilter) {
      return false
    }
    if (sizeFilter) {
      const count = c.follower_count || 0
      if (sizeFilter === 'under_100k' && count >= 100000) return false
      if (sizeFilter === '100k_1m' && (count < 100000 || count > 1000000)) return false
      if (sizeFilter === '1m_10m' && (count < 1000000 || count > 10000000)) return false
      if (sizeFilter === 'over_10m' && count <= 10000000) return false
    }
    if (nicheFilter) {
      const niches = Array.isArray(c.niche) ? c.niche : (c.niche ? [c.niche] : [])
      const hasNiche = niches.some(n => n.toLowerCase().includes(nicheFilter.toLowerCase()))
      if (!hasNiche) return false
    }
    return true
  })

  return (
    <div className="p-6 bg-[#080808]">
      {loadingAnalysis ? (
        <div className="text-center py-24">
          <Loader2 size={24} className="animate-spin mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.4)' }} />
          <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.4)' }}>Fetching deep analysis data…</p>
        </div>
      ) : selectedAnalysis && selectedCreator ? (
        <DeepAnalysisView
          analysis={selectedAnalysis}
          creator={selectedCreator}
          onBack={() => { setSelectedAnalysis(null); setSelectedCreator(null); }}
          onReanalyze={handleAnalyze}
          analyzing={analyzing === selectedCreator.id}
        />
      ) : (
        <>
          {/* Mockup-style Toolbar */}
          <div className="flex flex-wrap items-center gap-3 mb-6 p-3 rounded-2xl"
               style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            
            {/* Scrape button */}
            <button
              onClick={handleInlineScrape}
              disabled={scrapingInline || !search.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-bold text-white transition-all disabled:opacity-40"
              style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)' }}
              onMouseEnter={e => { if (search.trim()) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#111' }}
            >
              {scrapingInline ? <Loader2 size={13} className="animate-spin text-yellow-400" /> : <Zap size={13} className="text-yellow-400 fill-yellow-400" />}
              <span>Scrape</span>
            </button>

            {/* Input search/scrape url */}
            <div className="flex-1 min-w-[200px] flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)' }}>
              <Search size={13} style={{ color: 'rgba(255,255,255,0.3)' }} />
              <input
                className="flex-1 bg-transparent text-[12px] text-white outline-none placeholder:text-white/20"
                placeholder="Or paste a URL — youtube.com/@handle - instagram.com/handle - tiktok.com/@handle"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* Look up button */}
            <button
              onClick={handleInlineLookup}
              disabled={!search.trim()}
              className="px-4 py-2 rounded-xl text-[12px] font-semibold text-white/80 hover:text-white transition-all disabled:opacity-30 bg-transparent"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}
            >
              Look up
            </button>

            {/* Platform filter dropdown */}
            <select
              value={platformFilter}
              onChange={e => setPlatformFilter(e.target.value)}
              className="px-3 py-2 rounded-xl text-[12px] outline-none cursor-pointer"
              style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}
            >
              <option value="">All platforms</option>
              <option value="youtube">YouTube</option>
              <option value="instagram">Instagram</option>
              <option value="tiktok">TikTok</option>
              <option value="twitter">Twitter</option>
            </select>

            {/* Size filter dropdown */}
            <select
              value={sizeFilter}
              onChange={e => setSizeFilter(e.target.value)}
              className="px-3 py-2 rounded-xl text-[12px] outline-none cursor-pointer"
              style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}
            >
              <option value="">Any size</option>
              <option value="under_100k">&lt; 100K</option>
              <option value="100k_1m">100K - 1M</option>
              <option value="1m_10m">1M - 10M</option>
              <option value="over_10m">&gt; 10M</option>
            </select>

            {/* Niche filter dropdown */}
            <select
              value={nicheFilter}
              onChange={e => setNicheFilter(e.target.value)}
              className="px-3 py-2 rounded-xl text-[12px] outline-none cursor-pointer"
              style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}
            >
              <option value="">Any niche</option>
              {COMMON_NICHES.map(n => (
                <option key={n} value={n.toLowerCase()}>{n}</option>
              ))}
            </select>

            {/* Status filter dropdown */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl text-[12px] outline-none cursor-pointer"
              style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}
            >
              <option value="">Any status</option>
              <option value="discovered">Discovered</option>
              <option value="qualified">Qualified</option>
              <option value="in_review">In Review</option>
              <option value="approved">Approved</option>
              <option value="disqualified">Disqualified</option>
              <option value="suppressed">Suppressed</option>
            </select>

            {/* Count and Refresh */}
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-white/40 font-medium">
                {filtered.length} {filtered.length === 1 ? 'creator' : 'creators'}
              </span>
              <button
                onClick={load}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all bg-transparent border-none"
                style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'white' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
              >
                <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>

            {/* Batch Add button */}
            <button
              onClick={() => setShowScrape(true)}
              className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-bold text-black transition-all border-none bg-white hover:bg-white/95"
            >
              <Plus size={13} />
              <span>Add</span>
            </button>

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

          {/* Cards Grid */}
          {loading ? (
            <div className="text-center py-24">
              <Loader2 size={24} className="animate-spin mx-auto mb-3 text-white/30" />
              <p className="text-[13px] text-white/30">Loading leads…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24 rounded-2xl border border-dashed border-white/10" style={{ background: 'rgba(255,255,255,0.01)' }}>
              <p className="text-[14px] text-white/40">No creators match your filters.</p>
              <button onClick={() => setShowScrape(true)} className="mt-3 text-[12px] underline text-white/50 hover:text-white bg-transparent border-none cursor-pointer">
                Scrape a new profile →
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {filtered.map((c) => (
                <CreatorCard
                  key={c.id}
                  creator={c}
                  onAnalyze={handleAnalyze}
                  onQualify={handleQualify}
                  onSuppress={handleSuppress}
                  onDelete={handleDelete}
                  onViewAnalysis={handleViewAnalysis}
                  analyzing={analyzing}
                />
              ))}
            </div>
          )}
        </>
      )}

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

