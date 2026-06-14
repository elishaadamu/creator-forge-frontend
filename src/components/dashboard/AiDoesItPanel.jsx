import { useState, useEffect, useRef } from 'react'
import { useForge, getAccent, useBgJob } from '../../App'
import {
  Sparkles, RefreshCw, Copy, Check, X,
  Mail, Instagram, Twitter, Smartphone, BarChart2, Image,
  AlertCircle, ExternalLink, Settings, ChevronDown, ChevronUp, Play
} from 'lucide-react'
import {
  generateMarketingPack, generateProductImage,
  regenerateSection, hasTextKey, hasTogetherKey
} from '../../services/ai'
import ApiKeysModal from '../ui/ApiKeysModal'

// ── Typewriter effect ──────────────────────────────────────────────────────────

function useTypewriter(text, active, speed = 8) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)
  const idxRef = useRef(0)

  useEffect(() => {
    if (!active || !text) return
    setDisplayed('')
    setDone(false)
    idxRef.current = 0

    const tick = () => {
      idxRef.current++
      setDisplayed(text.slice(0, idxRef.current))
      if (idxRef.current >= text.length) {
        setDone(true)
        return
      }
      // Faster for longer texts
      const delay = text.length > 400 ? 4 : speed
      setTimeout(tick, delay)
    }
    tick()
  }, [text, active])

  return { displayed, done }
}

// ── Copy button ────────────────────────────────────────────────────────────────

function CopyBtn({ text, small }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800) }}
      className="flex items-center gap-1.5 rounded-lg transition-all flex-shrink-0"
      style={{
        fontSize: small ? '10px' : '11px',
        padding: small ? '3px 8px' : '5px 10px',
        background: copied ? 'rgba(100,220,100,0.1)' : 'rgba(255,255,255,0.06)',
        color: copied ? 'rgba(100,220,100,0.9)' : 'rgba(255,255,255,0.4)',
        border: `1px solid ${copied ? 'rgba(100,220,100,0.25)' : 'rgba(255,255,255,0.09)'}`,
      }}
    >
      {copied ? <><Check size={9} /> Copied</> : <><Copy size={9} /> Copy</>}
    </button>
  )
}

// ── Inline editable field ──────────────────────────────────────────────────────

function Editable({ value, onChange, multiline, className, style }) {
  const [focus, setFocus] = useState(false)
  const Tag = multiline ? 'textarea' : 'input'
  return (
    <Tag
      className={`w-full bg-transparent outline-none resize-none ${className}`}
      style={{
        ...style,
        borderRadius: 6,
        border: focus ? '1px solid rgba(255,255,255,0.15)' : '1px solid transparent',
        padding: focus ? '6px 8px' : '0',
        transition: 'all 0.12s',
        cursor: 'text',
      }}
      value={value}
      onChange={e => onChange(e.target.value)}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
    />
  )
}

// ── Product mockup — always shown, no API key needed ─────────────────────────

function ProductMockup({ creatorData, accent }) {
  const productName = creatorData.blueprint?.name || creatorData.productName || 'Creator Academy'
  const preview = creatorData.blueprint?.preview
  const blueprintType = preview === 'webapp' ? 'web-app' :
                        preview === 'mobile' ? 'mobile-app' :
                        preview === 'community' ? 'community' :
                        preview === 'store' ? 'digital-products' :
                        creatorData.blueprint?.id || 'web-app'
  const name  = creatorData.name || creatorData.handle?.replace('@','') || 'Creator'
  const niche = creatorData.niche || 'Content Creation'
  const tagline = creatorData.blueprint?.tagline || 'Your platform. Your rules.'
  const avatarUrl = creatorData.avatarUrl

  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2)

  // Shared browser chrome wrapper
  const Chrome = ({ children }) => (
    <div className="rounded-2xl overflow-hidden border" style={{ background: '#0d0d0d', borderColor: 'rgba(255,255,255,0.08)' }}>
      {/* Browser bar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ background: '#111', borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex gap-1.5">
          {['#ff5f57','#ffbd2e','#28c840'].map(c => (
            <div key={c} className="w-2.5 h-2.5 rounded-full" style={{ background: c, opacity: 0.7 }} />
          ))}
        </div>
        <div className="flex-1 mx-3 h-5 rounded-md flex items-center px-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
            {productName.toLowerCase().replace(/\s+/g,'-')}.com
          </span>
        </div>
      </div>
      {children}
    </div>
  )

  // Web app — course platform layout
  if (blueprintType === 'web-app' || !blueprintType) return (
    <Chrome>
      <div className="flex" style={{ minHeight: 200 }}>
        {/* Sidebar */}
        <div className="w-40 flex-shrink-0 border-r p-3 flex flex-col gap-1" style={{ background: '#0a0a0a', borderColor: 'rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-2 mb-3 px-1">
            {avatarUrl ? (
              <img src={avatarUrl} className="w-6 h-6 rounded-full object-cover" alt="" onError={e => { e.currentTarget.style.display='none' }} />
            ) : (
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold"
                style={{ background: `rgba(${accent.rgb},0.25)`, color: accent.color }}>{initials}</div>
            )}
            <span className="text-[11px] font-bold text-white truncate">{productName}</span>
          </div>
          {['Dashboard','Courses','Community','Live Events'].map((item, i) => (
            <div key={item} className="px-2 py-1.5 rounded-lg text-[10px]"
              style={{ background: i === 0 ? `rgba(${accent.rgb},0.15)` : 'transparent',
                color: i === 0 ? accent.color : 'rgba(255,255,255,0.35)' }}>
              {item}
            </div>
          ))}
        </div>
        {/* Main content */}
        <div className="flex-1 p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[13px] font-bold text-white">Welcome back 👋</p>
              <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>Your {niche} hub</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-2.5 py-1 rounded-full text-[10px] font-medium"
                style={{ background: `rgba(${accent.rgb},0.15)`, color: accent.color }}>
                Pro Member
              </div>
            </div>
          </div>
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[['127','Members'],['12','Courses'],['98%','Satisfaction']].map(([n,l]) => (
              <div key={l} className="rounded-xl p-2.5 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-[14px] font-bold text-white">{n}</p>
                <p className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{l}</p>
              </div>
            ))}
          </div>
          {/* Course grid */}
          <p className="text-[9px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.2)' }}>Featured Courses</p>
          <div className="grid grid-cols-2 gap-2">
            {[niche + ' Foundations', 'Advanced Strategies'].map((title, i) => (
              <div key={i} className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="h-12 flex items-center justify-center"
                  style={{ background: i === 0 ? `rgba(${accent.rgb},0.15)` : 'rgba(255,255,255,0.04)' }}>
                  <span className="text-[18px]">{i === 0 ? '🎯' : '🚀'}</span>
                </div>
                <div className="p-2">
                  <p className="text-[10px] font-semibold text-white leading-tight">{title}</p>
                  <p className="text-[9px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>by {name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Chrome>
  )

  // Mobile app
  if (blueprintType === 'mobile-app') return (
    <div className="flex justify-center py-2">
      <div className="relative rounded-[28px] overflow-hidden border-2" style={{ width: 180, background: '#0a0a0a', borderColor: 'rgba(255,255,255,0.15)' }}>
        {/* Status bar */}
        <div className="flex justify-between items-center px-4 py-2" style={{ background: '#111' }}>
          <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.4)' }}>9:41</span>
          <div className="w-12 h-3 rounded-full" style={{ background: 'rgba(0,0,0,0.5)' }} />
          <div className="flex gap-0.5">
            {[1,2,3].map(i => <div key={i} className="w-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.5)' }} />)}
          </div>
        </div>
        {/* App header */}
        <div className="px-4 py-3" style={{ background: `rgba(${accent.rgb},0.12)`, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-[12px] font-bold text-white">{productName}</p>
          <p className="text-[9px]" style={{ color: accent.color }}>by {name}</p>
        </div>
        {/* Feed */}
        <div className="p-3 space-y-2">
          {[`New drop 🔥`, `Exclusive post`, `Members only`].map((t, i) => (
            <div key={i} className="rounded-xl p-2.5 flex gap-2 items-center"
              style={{ background: i === 0 ? `rgba(${accent.rgb},0.1)` : 'rgba(255,255,255,0.04)', border: i === 0 ? `1px solid rgba(${accent.rgb},0.2)` : '1px solid rgba(255,255,255,0.06)' }}>
              {avatarUrl ? (
                <img src={avatarUrl} className="w-5 h-5 rounded-full flex-shrink-0 object-cover" alt="" onError={e => { e.currentTarget.style.display='none' }} />
              ) : (
                <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[8px] font-bold"
                  style={{ background: `rgba(${accent.rgb},0.3)`, color: accent.color }}>{initials[0]}</div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-medium text-white truncate">{t}</p>
                <p className="text-[8px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{name}</p>
              </div>
              {i === 0 && <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: accent.color }} />}
            </div>
          ))}
        </div>
        {/* Tab bar */}
        <div className="flex justify-around py-2.5 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)', background: '#111' }}>
          {['🏠','📚','💬','👤'].map((ic, i) => (
            <div key={i} className="text-[14px]" style={{ opacity: i === 0 ? 1 : 0.3 }}>{ic}</div>
          ))}
        </div>
      </div>
    </div>
  )

  // Community / membership
  if (blueprintType === 'community') return (
    <Chrome>
      <div className="flex" style={{ minHeight: 200 }}>
        {/* Sidebar */}
        <div className="w-36 flex-shrink-0 border-r p-3" style={{ background: '#0a0a0a', borderColor: 'rgba(255,255,255,0.05)' }}>
          <div className="mb-3">
            <p className="text-[11px] font-bold text-white truncate">{productName}</p>
            <p className="text-[9px]" style={{ color: accent.color }}>Inner Circle</p>
          </div>
          {['🏠 Home','💬 Chat','📅 Events','🔒 Members Only'].map((item, i) => (
            <div key={item} className="py-1.5 px-2 rounded-lg text-[10px] mb-0.5"
              style={{ background: i === 0 ? `rgba(${accent.rgb},0.12)` : 'transparent',
                color: i === 0 ? 'white' : 'rgba(255,255,255,0.35)' }}>{item}</div>
          ))}
        </div>
        {/* Posts */}
        <div className="flex-1 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[12px] font-bold text-white">Inner Circle</p>
            <div className="px-2 py-0.5 rounded-full text-[9px]" style={{ background: `rgba(${accent.rgb},0.15)`, color: accent.color }}>
              247 members
            </div>
          </div>
          {[
            { label: `Welcome to ${productName}! 🎉`, sub: 'Pinned by ' + name },
            { label: 'This week\'s challenge drop', sub: 'Yesterday · 12 replies' },
            { label: `${niche} resources & tools`, sub: '2 days ago · 8 replies' },
          ].map((post, i) => (
            <div key={i} className="flex gap-2.5 py-2.5 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
              {avatarUrl && i === 0 ? (
                <img src={avatarUrl} className="w-6 h-6 rounded-full flex-shrink-0 mt-0.5 object-cover" alt="" onError={e => { e.currentTarget.style.display='none' }} />
              ) : (
                <div className="w-6 h-6 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center text-[8px]"
                  style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}>
                  {i === 0 ? initials[0] : '👤'}
                </div>
              )}
              <div>
                <p className="text-[11px] font-medium text-white">{post.label}</p>
                <p className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{post.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Chrome>
  )

  // Digital products / store
  return (
    <Chrome>
      <div className="p-4" style={{ minHeight: 200 }}>
        {/* Store header */}
        <div className="flex items-center gap-3 mb-4">
          {avatarUrl ? (
            <img src={avatarUrl} className="w-9 h-9 rounded-xl object-cover" alt="" onError={e => { e.currentTarget.style.display='none' }} />
          ) : (
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold"
              style={{ background: `rgba(${accent.rgb},0.2)`, color: accent.color }}>{initials}</div>
          )}
          <div>
            <p className="text-[13px] font-bold text-white">{productName}</p>
            <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>by {name} · {niche}</p>
          </div>
        </div>
        {/* Product grid */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { emoji: '📋', name: `${niche} Template Pack`, price: '$27' },
            { emoji: '📖', name: 'Ultimate Guide', price: '$47' },
            { emoji: '🎯', name: 'Starter Toolkit', price: '$19' },
            { emoji: '📊', name: 'Notion Workspace', price: '$37' },
            { emoji: '🚀', name: 'Crash Course', price: '$97' },
            { emoji: '💼', name: 'Bundle Deal', price: '$149', hot: true },
          ].map((p, i) => (
            <div key={i} className="rounded-xl overflow-hidden relative"
              style={{ border: p.hot ? `1px solid rgba(${accent.rgb},0.3)` : '1px solid rgba(255,255,255,0.07)', background: p.hot ? `rgba(${accent.rgb},0.06)` : 'rgba(255,255,255,0.03)' }}>
              <div className="flex items-center justify-center py-3 text-[22px]">{p.emoji}</div>
              <div className="px-2 pb-2">
                <p className="text-[9px] font-medium text-white leading-tight mb-0.5">{p.name}</p>
                <p className="text-[10px] font-bold" style={{ color: accent.color }}>{p.price}</p>
              </div>
              {p.hot && (
                <div className="absolute top-1.5 right-1.5 text-[8px] px-1.5 py-0.5 rounded-full font-bold"
                  style={{ background: accent.color, color: '#000' }}>HOT</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Chrome>
  )
}

// ── Step row shown during generation ──────────────────────────────────────────

const STEPS = [
  { id: 'email',     label: 'Writing launch email',          icon: Mail,       color: '#34d399' },
  { id: 'instagram', label: 'Crafting Instagram caption',    icon: Instagram,  color: '#e1306c' },
  { id: 'twitter',   label: 'Building X thread',             icon: Twitter,    color: '#60a5fa' },
  { id: 'tiktok',    label: 'Scripting TikTok hook',         icon: Smartphone, color: '#69c9d0' },
  { id: 'pitchDeck', label: 'Building pitch deck',           icon: BarChart2,  color: '#f59e0b' },
  { id: 'image',     label: 'Generating product image',      icon: Image,      color: '#a78bfa' },
]

function StepRow({ step, status }) {
  // status: 'pending' | 'active' | 'done' | 'skipped'
  const Icon = step.icon
  return (
    <div className="flex items-center gap-3 py-2 transition-all duration-300"
      style={{ opacity: status === 'pending' ? 0.25 : 1 }}>
      <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500"
        style={{
          background: status === 'done' ? 'white'
            : status === 'active' ? `rgba(255,255,255,0.1)`
            : 'rgba(255,255,255,0.05)',
          border: status === 'active' ? '1px solid rgba(255,255,255,0.2)' : 'none',
        }}>
        {status === 'done'
          ? <Check size={12} className="text-black" strokeWidth={3} />
          : status === 'active'
            ? <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: step.color }} />
            : status === 'skipped'
              ? <X size={10} style={{ color: 'rgba(255,255,255,0.3)' }} />
              : <Icon size={11} style={{ color: 'rgba(255,255,255,0.3)' }} />
        }
      </div>
      <span className="text-[13px] font-medium flex-1" style={{
        color: status === 'done' ? 'rgba(255,255,255,0.6)'
          : status === 'active' ? 'white'
          : status === 'skipped' ? 'rgba(255,255,255,0.2)'
          : 'rgba(255,255,255,0.25)',
      }}>
        {step.label}
        {status === 'active' && <span className="ml-1 opacity-40 animate-pulse">_</span>}
      </span>
      {status === 'active' && (
        <div className="flex gap-0.5">
          {[0,1,2].map(i => (
            <div key={i} className="w-1 h-1 rounded-full animate-bounce"
              style={{ background: step.color, animationDelay: `${i * 120}ms`, opacity: 0.7 }} />
          ))}
        </div>
      )}
      {status === 'done' && (
        <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>done</span>
      )}
      {status === 'skipped' && (
        <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>skipped</span>
      )}
    </div>
  )
}

// ── Section card (collapsible, editable, copyable) ────────────────────────────

function SectionCard({ id, title, icon: Icon, iconColor, children, onRegen, regenning, accent, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-2xl border overflow-hidden transition-all duration-300"
      style={{ background: '#0e0e0e', borderColor: 'rgba(255,255,255,0.08)' }}>
      <div className="flex items-center justify-between px-4 py-3 cursor-pointer"
        onClick={() => setOpen(v => !v)}
        style={{ borderBottom: open ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: `${iconColor}18` }}>
            <Icon size={12} style={{ color: iconColor }} />
          </div>
          <span className="text-[13px] font-semibold text-white">{title}</span>
        </div>
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          {onRegen && (
            <button
              onClick={onRegen}
              disabled={regenning}
              className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg transition-all disabled:opacity-30"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.08)' }}
              onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
            >
              <RefreshCw size={9} className={regenning ? 'animate-spin' : ''} />
              {regenning ? 'Rewriting…' : 'Rewrite'}
            </button>
          )}
          <div style={{ color: 'rgba(255,255,255,0.2)' }}>
            {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </div>
        </div>
      </div>
      {open && <div className="p-4">{children}</div>}
    </div>
  )
}

// ── Main panel ─────────────────────────────────────────────────────────────────

const PACK_JOB   = 'launch-pack'
const IMAGE_JOB  = 'launch-pack-image'

export default function AiDoesItPanel({ onClose }) {
  const { creatorData, startBgJob, cancelBgJob, clearBgJob, incrementAiActions, setApiModalOpen, triggerToast, syncSessionToDb, dbLoadedTimestamp } = useForge()
  const accent = getAccent(creatorData.platform)
  const packJob  = useBgJob(PACK_JOB)
  const imageJob = useBgJob(IMAGE_JOB)

  const handle = creatorData?.handle || 'default'

  const [pack, setPack]         = useState(() => {
    try {
      const cached = localStorage.getItem(`forge_${handle}_launch_pack`)
      return cached ? JSON.parse(cached) : null
    } catch (e) {
      console.error(e)
      return null
    }
  })
  const [imageUrl, setImageUrl] = useState(() => {
    return localStorage.getItem(`forge_${handle}_launch_image`) || null
  })
  const [phase, setPhase]       = useState(() => {
    const cachedPack = localStorage.getItem(`forge_${handle}_launch_pack`)
    return cachedPack ? 'done' : 'idle'
  })   // idle | running | done | error
  const [stepStatus, setStepStatus] = useState(() => {
    const cachedPack = localStorage.getItem(`forge_${handle}_launch_pack`)
    const cachedImage = localStorage.getItem(`forge_${handle}_launch_image`)
    const initial = {}
    STEPS.forEach(s => { 
      initial[s.id] = (s.id === 'image' && cachedImage) || (s.id !== 'image' && cachedPack) ? 'done' : 'pending' 
    })
    return initial
  })   // stepId → 'pending'|'active'|'done'|'skipped'|'error'

  const [imageError, setImageError] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [regenning, setRegenning] = useState({})

  // Write pack and image to localStorage on change and sync to DB
  useEffect(() => {
    if (pack) {
      localStorage.setItem(`forge_${handle}_launch_pack`, JSON.stringify(pack))
      setTimeout(() => { if (syncSessionToDb) syncSessionToDb() }, 50)
    }
  }, [pack, handle, syncSessionToDb])

  useEffect(() => {
    if (imageUrl) {
      localStorage.setItem(`forge_${handle}_launch_image`, imageUrl)
      setTimeout(() => { if (syncSessionToDb) syncSessionToDb() }, 50)
    }
  }, [imageUrl, handle, syncSessionToDb])

  // Load/reload cached contents when handle resolves or changes
  useEffect(() => {
    const h = creatorData?.handle
    if (!h || h === 'default') return

    const cachedPack = localStorage.getItem(`forge_${h}_launch_pack`) || localStorage.getItem(`forge_${h.toLowerCase()}_launch_pack`)
    if (cachedPack) {
      try {
        setPack(JSON.parse(cachedPack))
        setPhase('done')
      } catch (e) {
        console.error('Failed to parse cached pack:', e)
      }
    }

    const cachedImage = localStorage.getItem(`forge_${h}_launch_image`) || localStorage.getItem(`forge_${h.toLowerCase()}_launch_image`)
    if (cachedImage) {
      setImageUrl(cachedImage)
    }

    const cachedEdits = localStorage.getItem(`forge_${h}_launch_pack_edits`) || localStorage.getItem(`forge_${h.toLowerCase()}_launch_pack_edits`)
    if (cachedEdits) {
      try {
        setEdits(JSON.parse(cachedEdits))
      } catch (e) {
        console.error('Failed to parse cached edits:', e)
      }
    }

    if (cachedPack || cachedImage) {
      const initial = {}
      STEPS.forEach(s => { 
        initial[s.id] = (s.id === 'image' && cachedImage) || (s.id !== 'image' && cachedPack) ? 'done' : 'pending' 
      })
      setStepStatus(initial)
    }
  }, [creatorData?.handle, dbLoadedTimestamp])

  // ── Re-apply background job results when they finish ─────────────────────────
  useEffect(() => {
    if (packJob.status === 'done' && packJob.result) {
      // Animate completion of text steps
      STEPS.slice(0, 5).forEach(s => setStepStatus(prev => ({ ...prev, [s.id]: 'done' })))
      setPack(packJob.result)
      setPhase('done')
      clearBgJob(PACK_JOB)
      if (triggerToast) triggerToast('Marketing Campaign Pack generated successfully!', 'success')
    }
    if (packJob.status === 'error' || packJob.status === 'cancelled') {
      if (packJob.status === 'error') {
        setErrorMsg(packJob.error || 'Generation failed')
        setPhase('error')
      } else {
        const cachedPack = localStorage.getItem(`forge_${handle}_launch_pack`)
        if (cachedPack) {
          try {
            setPack(JSON.parse(cachedPack))
            setPhase('done')
          } catch (e) {
            setPhase('idle')
          }
        } else {
          setPhase('idle')
        }
      }
      clearBgJob(PACK_JOB)
    }
    if (packJob.status === 'running' && phase === 'idle') {
      // Resumed view — show running phase
      setPhase('running')
      const initial = {}
      STEPS.forEach(s => { initial[s.id] = 'pending' })
      setStepStatus(initial)
    }
  }, [packJob.status, packJob.result, packJob.error, handle, clearBgJob, phase])

  useEffect(() => {
    if (imageJob.status === 'done' && imageJob.result) {
      setImageUrl(imageJob.result)
      setStepStatus(prev => ({ ...prev, image: 'done' }))
      clearBgJob(IMAGE_JOB)
      if (triggerToast) triggerToast('Product Mockup Image generated successfully!', 'success')
    }
    if (imageJob.status === 'error' || imageJob.status === 'cancelled') {
      if (imageJob.status === 'cancelled') {
        const cachedImage = localStorage.getItem(`forge_${handle}_launch_image`)
        setImageUrl(cachedImage || null)
        setStepStatus(prev => ({ ...prev, image: cachedImage ? 'done' : 'pending' }))
      } else {
        setImageError(imageJob.error || 'Image generation failed')
        setStepStatus(prev => ({ ...prev, image: 'error' }))
      }
      clearBgJob(IMAGE_JOB)
    }
    if (imageJob.status === 'running') {
      setStepStatus(prev => ({ ...prev, image: 'active' }))
    }
  }, [imageJob.status, imageJob.result, imageJob.error, handle, clearBgJob])

  // Edited values
  const [edits, setEdits] = useState(() => {
    try {
      const cached = localStorage.getItem(`forge_${handle}_launch_pack_edits`)
      return cached ? JSON.parse(cached) : {}
    } catch {
      return {}
    }
  })

  // Persist user inline edits to localStorage and sync to DB
  useEffect(() => {
    if (handle !== '@creator' && Object.keys(edits).length > 0) {
      localStorage.setItem(`forge_${handle}_launch_pack_edits`, JSON.stringify(edits))
      setTimeout(() => { if (syncSessionToDb) syncSessionToDb() }, 50)
    }
  }, [edits, handle, syncSessionToDb])

  const val = (path, fallback = '') => edits[path] !== undefined ? edits[path] : fallback
  const set = (path, v) => setEdits(p => ({ ...p, [path]: v }))

  // Helpers that merge pack + edits
  const emailSubj  = () => val('email.subject',  pack?.email?.subject  || '')
  const emailBody  = () => val('email.body',     pack?.email?.body     || '')
  const igCaption  = () => val('ig.caption',     pack?.instagram?.caption || '')
  const igTags     = () => val('ig.hashtags',    (pack?.instagram?.hashtags || []).join(' '))
  const tweet      = i  => val(`tw.${i}`,        pack?.twitter?.thread?.[i] || '')
  const tiktokHook = () => val('tt.hook',        pack?.tiktok?.hook    || '')
  const tiktokScript=() => val('tt.script',      pack?.tiktok?.script  || '')
  const deckHead   = () => val('deck.headline',  pack?.pitchDeck?.headline || '')
  const deckTag    = () => val('deck.tagline',   pack?.pitchDeck?.tagline  || '')
  const slideTitle = i  => val(`slide.${i}.title`,   pack?.pitchDeck?.slides?.[i]?.title || '')
  const slideBullets=i  => val(`slide.${i}.bullets`, (pack?.pitchDeck?.slides?.[i]?.bullets || []).join('\n'))

  // ── Run generation ───────────────────────────────────────────────────────────

  const run = async () => {
    if (!hasTextKey()) { setApiModalOpen(true); return }
    if (incrementAiActions) incrementAiActions()

    setPhase('running')
    setErrorMsg('')
    setImageError('')
    setPack(null)
    setImageUrl(null)
    setEdits({})

    // Mark all steps pending
    const initial = {}
    STEPS.forEach(s => { initial[s.id] = 'pending' })
    setStepStatus(initial)

    // Kick off both background jobs
    startBgJob(PACK_JOB, (sig) => generateMarketingPack(creatorData, sig))
    startBgJob(IMAGE_JOB, (sig) => generateProductImage(creatorData, sig))

    // Animate step indicators while waiting (they'll resolve via useEffect above)
    const textSteps = STEPS.slice(0, 5)
    const stepDurations = [1200, 900, 800, 900, 1100]
    for (let i = 0; i < textSteps.length; i++) {
      const step = textSteps[i]
      setStepStatus(prev => ({ ...prev, [step.id]: 'active' }))
      await new Promise(r => setTimeout(r, stepDurations[i]))
    }
  }

  // ── Regen single section ─────────────────────────────────────────────────────

  const regen = async (section) => {
    setRegenning(p => ({ ...p, [section]: true }))
    if (incrementAiActions) incrementAiActions()
    try {
      const result = await regenerateSection(section, creatorData)
      setPack(prev => ({ ...prev, [section]: result }))
      // Clear edits for that section prefix
      setEdits(prev => {
        const next = { ...prev }
        const prefix = { email: 'email', instagram: 'ig', twitter: 'tw', tiktok: 'tt', pitchDeck: ['deck','slide'] }[section]
        if (Array.isArray(prefix)) prefix.forEach(p => Object.keys(next).filter(k => k.startsWith(p + '.')).forEach(k => delete next[k]))
        else Object.keys(next).filter(k => k.startsWith(prefix + '.')).forEach(k => delete next[k])
        return next
      })
    } catch (e) {
      console.error(e)
    }
    setRegenning(p => ({ ...p, [section]: false }))
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="rounded-2xl border overflow-hidden"
      style={{ background: '#0a0a0a', borderColor: `rgba(${accent.rgb},0.2)` }}>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: `rgba(${accent.rgb},0.15)` }}>
            <Sparkles size={15} style={{ color: accent.color }} className={phase === 'running' ? 'animate-pulse' : ''} />
          </div>
          <div>
            <p className="text-[14px] font-semibold text-white">AI does it</p>
            <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {phase === 'running' ? 'AI is writing your launch pack…'
                : phase === 'done' ? 'All done — click any field to edit'
                : 'AI writes everything · FLUX/DALL-E/Gemini generates images'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setApiModalOpen(true)}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'rgba(255,255,255,0.25)' }}
            title="API Keys"
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.25)'}>
            <Settings size={13} />
          </button>
          {onClose && (
            <button onClick={onClose}
              className="p-2 rounded-lg transition-colors"
              style={{ color: 'rgba(255,255,255,0.25)' }}
              onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.25)'}>
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      <div className="p-5 space-y-4">

        {/* ── IDLE ────────────────────────────────────────────── */}
        {phase === 'idle' && (
          <div className="text-center py-5">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: `rgba(${accent.rgb},0.1)`, border: `1px solid rgba(${accent.rgb},0.2)` }}>
              <Sparkles size={24} style={{ color: accent.color }} />
            </div>
            <p className="text-[16px] font-bold text-white mb-2">Generate your full launch pack</p>
            <p className="text-[13px] mb-5 max-w-xs mx-auto" style={{ color: 'rgba(255,255,255,0.38)', lineHeight: 1.6 }}>
              One click. AI writes everything personalized to {creatorData.name || 'you'} — email, every social platform, pitch deck, and a product image.
            </p>
            <div className="flex flex-wrap justify-center gap-1.5 mb-6">
              {STEPS.map(s => (
                <span key={s.id} className="text-[11px] px-2.5 py-1 rounded-full flex items-center gap-1.5"
                  style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>
                  <s.icon size={10} style={{ color: s.color }} />
                  {s.label.replace('Writing ','').replace('Crafting ','').replace('Building ','').replace('Scripting ','').replace('Generating ','')}
                </span>
              ))}
            </div>
            {!hasTextKey() && (
              <div className="flex items-center justify-center gap-2 mb-4 text-[12px]"
                style={{ color: 'rgba(255,180,0,0.8)' }}>
                <AlertCircle size={12} />
                Add an AI API key first (Gemini, OpenAI, or Claude)
                <button onClick={() => setApiModalOpen(true)}
                  className="underline text-white/50 hover:text-white transition-colors">Add key →</button>
              </div>
            )}
            <button
              onClick={run}
              className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-2xl font-bold text-[15px] transition-all duration-200 group"
              style={{
                background: `linear-gradient(135deg, rgba(${accent.rgb},0.35), rgba(${accent.rgb},0.18))`,
                border: `1px solid rgba(${accent.rgb},0.4)`,
                color: 'white',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = `linear-gradient(135deg, rgba(${accent.rgb},0.45), rgba(${accent.rgb},0.25))`}}
              onMouseLeave={e => { e.currentTarget.style.background = `linear-gradient(135deg, rgba(${accent.rgb},0.35), rgba(${accent.rgb},0.18))`}}
            >
              <Sparkles size={16} />
              Do all steps with AI
            </button>
          </div>
        )}

        {/* ── RUNNING: animated steps ─────────────────────────── */}
        {phase === 'running' && (
          <div className="py-2">
            <div className="rounded-2xl border p-4 mb-4"
              style={{ background: '#0e0e0e', borderColor: `rgba(${accent.rgb},0.15)` }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles size={13} style={{ color: accent.color }} className="animate-pulse" />
                  <span className="text-[12px] font-semibold" style={{ color: accent.color }}>
                    AI working…
                  </span>
                </div>
                <button
                  onClick={() => {
                    cancelBgJob(PACK_JOB)
                    cancelBgJob(IMAGE_JOB)
                    setPhase('idle')
                  }}
                  className="text-[11px] font-semibold text-white/40 hover:text-white/80 border border-white/10 hover:border-white/25 px-2.5 py-1 rounded-lg transition-all"
                >
                  Cancel
                </button>
              </div>
              <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                {STEPS.map(step => (
                  <StepRow key={step.id} step={step} status={stepStatus[step.id] || 'pending'} />
                ))}
              </div>
            </div>
            {/* Pulsing bar */}
            <div className="h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div className="h-full rounded-full shimmer-line" style={{ background: accent.color, width: '100%' }} />
            </div>
          </div>
        )}

        {/* ── ERROR ────────────────────────────────────────────── */}
        {phase === 'error' && (
          <div className="rounded-2xl p-5 text-center"
            style={{ background: 'rgba(255,60,60,0.05)', border: '1px solid rgba(255,60,60,0.18)' }}>
            <AlertCircle size={22} className="mx-auto mb-3" style={{ color: 'rgba(255,90,90,0.75)' }} />
            <p className="text-[14px] font-semibold text-white mb-1">Something went wrong</p>
            <p className="text-[12px] mb-5 max-w-xs mx-auto" style={{ color: 'rgba(255,255,255,0.38)' }}>
              {errorMsg.includes('NO_GEMINI') || errorMsg.includes('401') || errorMsg.includes('403')
                ? 'Invalid or missing Gemini API key.'
                : errorMsg.slice(0, 180)}
            </p>
            <div className="flex items-center justify-center gap-3">
              {(errorMsg.includes('NO_GEMINI') || errorMsg.includes('401') || errorMsg.includes('403')) && (
                <button onClick={() => setApiModalOpen(true)}
                  className="forge-btn-secondary text-[12px] py-2 px-4 gap-1.5">
                  <Settings size={11} /> Fix API key
                </button>
              )}
              <button onClick={() => setPhase('idle')}
                className="forge-btn-secondary text-[12px] py-2 px-4 gap-1.5">
                <RefreshCw size={11} /> Try again
              </button>
            </div>
          </div>
        )}

        {/* ── DONE: all sections ───────────────────────────────── */}
        {phase === 'done' && pack && (
          <div className="space-y-3">

            {/* Summary steps (collapsed) */}
            <div className="rounded-xl border px-4 py-2 flex items-center gap-3"
              style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
              <Check size={13} style={{ color: accent.color }} />
              <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
                Generated for {creatorData.name || creatorData.handle} · click any field to edit
              </span>
              <button
                onClick={() => { setPhase('idle'); setPack(null); setEdits({}) }}
                className="ml-auto text-[11px] flex items-center gap-1"
                style={{ color: 'rgba(255,255,255,0.25)' }}
                onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.55)'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.25)'}
              >
                <RefreshCw size={10} /> Regenerate all
              </button>
            </div>

            {/* Product Mockup — always shown */}
            <SectionCard id="image" title="Product Mockup" icon={Image} iconColor="#a78bfa" accent={accent}>
              {/* CSS mockup — always rendered */}
              <ProductMockup creatorData={creatorData} accent={accent} />

              {/* FLUX-generated image on top when available */}
              {stepStatus.image === 'active' && (
                <div className="mt-3 rounded-xl flex items-center gap-2 px-4 py-3"
                  style={{ background: 'rgba(167,139,250,0.06)', border: '1px dashed rgba(167,139,250,0.18)' }}>
                  <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin flex-shrink-0"
                    style={{ borderColor: 'rgba(167,139,250,0.5)', borderTopColor: 'transparent' }} />
                  <p className="text-[11px]" style={{ color: 'rgba(167,139,250,0.6)' }}>FLUX generating AI image…</p>
                </div>
              )}
              {imageUrl && (
                <div className="mt-3 relative rounded-xl overflow-hidden group">
                  <img src={imageUrl} alt="AI product image" className="w-full rounded-xl" />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-end p-3"
                    style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)' }}>
                    <a href={imageUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg"
                      style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}>
                      <ExternalLink size={10} /> Full size
                    </a>
                  </div>
                </div>
              )}
              {stepStatus.image === 'error' && (
                <div className="mt-3 rounded-xl p-3"
                  style={{ background: 'rgba(255,60,60,0.06)', border: '1px solid rgba(255,60,60,0.18)' }}>
                  <p className="text-[11px] font-semibold mb-1" style={{ color: 'rgba(255,100,100,0.9)' }}>Image generation failed</p>
                  <p className="text-[10px] font-mono mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    {imageError?.slice(0, 200) || 'Unknown error'}
                  </p>
                  <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    Ensure your Together, OpenAI, or Gemini key is configured correctly for image generation.
                  </p>
                </div>
              )}
              {stepStatus.image === 'skipped' && !imageUrl && (
                <div className="mt-3 flex items-center justify-between px-3 py-2 rounded-xl"
                  style={{ background: 'rgba(167,139,250,0.05)', border: '1px solid rgba(167,139,250,0.1)' }}>
                  <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    AI image generation was skipped or not configured.
                  </p>
                </div>
              )}
            </SectionCard>

            {/* Email */}
            <SectionCard id="email" title="Launch Email" icon={Mail} iconColor="#34d399" accent={accent}
              onRegen={() => regen('email')} regenning={!!regenning.email}>
              <div className="space-y-3">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'rgba(255,255,255,0.2)' }}>Subject</p>
                  <Editable value={emailSubj()} onChange={v => set('email.subject', v)} multiline={false}
                    className="text-[14px] font-semibold text-white" />
                </div>
                <div className="h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
                <Editable value={emailBody()} onChange={v => set('email.body', v)} multiline
                  className="text-[12px] min-h-[120px]"
                  style={{ color: 'rgba(255,255,255,0.65)', lineHeight: '1.7' }} />
                <div className="flex justify-end">
                  <CopyBtn text={`Subject: ${emailSubj()}\n\n${emailBody()}`} />
                </div>
              </div>
            </SectionCard>

            {/* Instagram */}
            <SectionCard id="instagram" title="Instagram" icon={Instagram} iconColor="#e1306c" accent={accent}
              onRegen={() => regen('instagram')} regenning={!!regenning.instagram}>
              <div className="space-y-2">
                <Editable value={igCaption()} onChange={v => set('ig.caption', v)} multiline
                  className="text-[13px] min-h-[70px]"
                  style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.6' }} />
                <Editable value={igTags()} onChange={v => set('ig.hashtags', v)} multiline={false}
                  className="text-[12px]" style={{ color: 'rgba(225,48,108,0.65)' }} />
                <div className="flex justify-end">
                  <CopyBtn text={`${igCaption()}\n\n${igTags()}`} />
                </div>
              </div>
            </SectionCard>

            {/* Twitter thread */}
            <SectionCard id="twitter" title="X / Twitter Thread" icon={Twitter} iconColor="#60a5fa" accent={accent}
              onRegen={() => regen('twitter')} regenning={!!regenning.twitter}>
              <div className="space-y-3">
                {(pack.twitter?.thread || []).map((_, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[9px] font-bold"
                      style={{ background: 'rgba(96,165,250,0.12)', color: 'rgba(96,165,250,0.7)' }}>{i+1}</span>
                    <Editable value={tweet(i)} onChange={v => set(`tw.${i}`, v)} multiline
                      className="flex-1 text-[13px]"
                      style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.55' }} />
                  </div>
                ))}
                <div className="flex justify-end">
                  <CopyBtn text={(pack.twitter?.thread||[]).map((_,i) => tweet(i)).join('\n\n')} />
                </div>
              </div>
            </SectionCard>

            {/* TikTok */}
            <SectionCard id="tiktok" title="TikTok Script" icon={Smartphone} iconColor="#69c9d0" accent={accent}
              onRegen={() => regen('tiktok')} regenning={!!regenning.tiktok}>
              <div className="space-y-3">
                <div className="rounded-xl px-3 py-2.5"
                  style={{ background: 'rgba(105,201,208,0.06)', border: '1px solid rgba(105,201,208,0.12)' }}>
                  <p className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(105,201,208,0.6)' }}>Hook — first 3 seconds</p>
                  <Editable value={tiktokHook()} onChange={v => set('tt.hook', v)} multiline={false}
                    className="text-[14px] font-bold text-white" />
                </div>
                <Editable value={tiktokScript()} onChange={v => set('tt.script', v)} multiline
                  className="text-[12px] min-h-[80px]"
                  style={{ color: 'rgba(255,255,255,0.65)', lineHeight: '1.65' }} />
                <div className="flex justify-end">
                  <CopyBtn text={`HOOK: ${tiktokHook()}\n\n${tiktokScript()}`} />
                </div>
              </div>
            </SectionCard>

            {/* Pitch Deck */}
            <SectionCard id="pitchDeck" title="Pitch Deck" icon={BarChart2} iconColor="#f59e0b" accent={accent}
              onRegen={() => regen('pitchDeck')} regenning={!!regenning.pitchDeck} defaultOpen={false}>
              <div className="space-y-3">
                <div className="rounded-xl p-4 text-center"
                  style={{ background: `rgba(${accent.rgb},0.06)`, border: `1px solid rgba(${accent.rgb},0.1)` }}>
                  <Editable value={deckHead()} onChange={v => set('deck.headline', v)} multiline={false}
                    className="text-[17px] font-bold text-white text-center mb-1" />
                  <Editable value={deckTag()} onChange={v => set('deck.tagline', v)} multiline={false}
                    className="text-[12px] text-center"
                    style={{ color: 'rgba(255,255,255,0.4)' }} />
                </div>
                {(pack.pitchDeck?.slides || []).map((_, i) => (
                  <div key={i} className="rounded-xl border p-3"
                    style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
                    <Editable value={slideTitle(i)} onChange={v => set(`slide.${i}.title`, v)} multiline={false}
                      className="text-[11px] font-bold uppercase tracking-wider mb-1.5"
                      style={{ color: accent.color }} />
                    <Editable value={slideBullets(i)} onChange={v => set(`slide.${i}.bullets`, v)} multiline
                      className="text-[12px]"
                      style={{ color: 'rgba(255,255,255,0.5)', lineHeight: '1.7' }} />
                  </div>
                ))}
                <div className="flex justify-end">
                  <CopyBtn text={`${deckHead()}\n${deckTag()}\n\n${(pack.pitchDeck?.slides||[]).map((_,i)=>`${slideTitle(i)}\n${slideBullets(i)}`).join('\n\n')}`} />
                </div>
              </div>
            </SectionCard>

          </div>
        )}
      </div>
    </div>
  )
}
