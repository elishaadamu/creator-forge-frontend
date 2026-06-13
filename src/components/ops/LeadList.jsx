import { useState, useEffect, useCallback } from 'react'
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

function CreatorRow({ creator, onAnalyze, onQualify, onSuppress, onDelete, onViewAnalysis, analyzing, isLast }) {
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
        {creator.engagement_score ? (
          <button
            onClick={() => onViewAnalysis(creator)}
            className="text-[13px] font-semibold hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-none p-0 outline-none"
            style={{ color: creator.engagement_score >= 8 ? '#4ade80' : creator.engagement_score >= 5 ? '#facc15' : 'rgba(255,255,255,0.2)' }}
          >
            {creator.engagement_score}/10
          </button>
        ) : (
          <span className="text-[13px] font-semibold" style={{ color: 'rgba(255,255,255,0.2)' }}>
            Not provided
          </span>
        )}
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
                  
                  <button onClick={() => { setShowMenu(false); onViewAnalysis(creator) }}
                          className="w-full px-3 py-2 text-left text-[12px] flex items-center gap-2 hover:bg-white/5 transition-colors text-white">
                    <Eye size={12} /> Deep Analysis
                  </button>

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

  // Safe parsing of demand signals
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
    } catch (e) { 
      console.warn(e) 
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

  const filtered = creators.filter(c => {
    if (!search) return true
    const q = search.toLowerCase()
    return (c.handle || '').toLowerCase().includes(q) ||
           (c.display_name || '').toLowerCase().includes(q) ||
           (c.email_public || '').toLowerCase().includes(q)
  })

  return (
    <div className="p-6">
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
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all bg-transparent border-none"
                style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'white' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
              >
                <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              </button>
              <button
                onClick={() => setShowScrape(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-semibold text-black transition-all border-none"
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
                    <button onClick={() => setShowScrape(true)} className="mt-3 text-[12px] underline bg-transparent border-none cursor-pointer" style={{ color: 'rgba(255,255,255,0.4)' }}>
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
                      onViewAnalysis={handleViewAnalysis}
                      analyzing={analyzing}
                      isLast={i === filtered.length - 1}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
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

