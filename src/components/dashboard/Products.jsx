import { useState } from 'react'
import { useForge } from '../../App'
import {
  Package, Plus, ExternalLink, Users, DollarSign, BarChart2,
  Sparkles, RefreshCw, Check, ChevronRight, Radio, Edit3, Copy, Volume2
} from 'lucide-react'

const AVAILABLE_MODULES = [
  { icon: Radio, label: 'Live events', description: 'Host live sessions and webinars' },
  { icon: DollarSign, label: 'Digital products', description: 'Sell templates, guides, and downloads' },
  { icon: BarChart2, label: 'Coaching tier', description: '1:1 or group coaching upsell' },
  { icon: Package, label: 'Newsletter', description: 'Paid newsletter for your members' },
]

const FORGE_SUGGESTIONS = [
  { label: 'Write offer page copy', icon: Sparkles },
  { label: 'Generate FAQ section', icon: Sparkles },
  { label: 'Create onboarding sequence', icon: Sparkles },
  { label: 'Write module descriptions', icon: Sparkles },
]

export default function Products() {
  const { creatorData } = useForge()
  const [generating, setGenerating] = useState(null)
  const [generated, setGenerated] = useState({})
  const [copied, setCopied] = useState(null)

  const productName = creatorData.productName || 'Creator Academy'
  const blueprint = creatorData.blueprint || { type: 'Web App' }
  const features = creatorData.features || []

  // Dynamic modules list reflecting onboarding choices
  const activeModules = [
    {
      id: 'courses',
      icon: Package,
      label: 'Course builder',
      description: 'Upload lessons, modules, and resources',
      status: 'Active',
      members: 0,
      cta: 'Upload first lesson',
    },
    {
      id: 'community',
      icon: Users,
      label: 'Community forum',
      description: 'Threaded discussions, announcements, DMs',
      status: 'Active',
      members: 0,
      cta: 'Post welcome message',
    },
    ...(features.includes('Podcast section') ? [{
      id: 'podcast',
      icon: Volume2,
      label: 'Podcast section',
      description: 'Publish audio episodes, show notes, and transcripts',
      status: 'Active',
      members: 0,
      cta: 'Upload first episode',
    }] : []),
    {
      id: 'offer-page',
      icon: ExternalLink,
      label: 'Offer page',
      description: 'Conversion-optimized landing page',
      status: 'Live',
      members: null,
      cta: 'Share link',
    },
  ]

  const handleGenerate = (id) => {
    setGenerating(id)
    setTimeout(() => {
      setGenerated(prev => ({ ...prev, [id]: true }))
      setGenerating(null)
    }, 1100)
  }

  const handleCopy = (id) => {
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="p-6 max-w-3xl space-y-8">

      {/* Header */}
      <div>
        <p className="forge-label mb-3">Products</p>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              className="forge-heading mb-1.5"
              style={{ fontSize: 'clamp(22px, 3vw, 30px)', letterSpacing: '-0.03em' }}
            >
              {productName}
            </h2>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[13px]" style={{ color: 'var(--theme-text-muted)' }}>
                Live · {blueprint.type} · 0 members
              </span>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button className="forge-btn-secondary text-[13px] py-2.5 gap-1.5">
              <ExternalLink size={13} />
              View live
            </button>
            <button className="forge-btn-primary text-[13px] py-2.5 gap-1.5">
              <Plus size={13} />
              Add module
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Users, label: 'Members', value: '0', sub: 'Invite your first 10' },
          { icon: DollarSign, label: 'Revenue', value: '$0', sub: 'Share your launch link' },
          { icon: BarChart2, label: 'Conversion', value: '-', sub: 'Data coming soon' },
        ].map(({ icon: Icon, label, value, sub }) => (
          <div key={label} className="rounded-xl border p-4" style={{ background: 'var(--theme-card-bg)', borderColor: 'var(--theme-border-color)' }}>
            <Icon size={14} className="mb-2 text-white/30" />
            <p className="text-[22px] font-semibold tracking-tight text-white leading-none mb-1">{value}</p>
            <p className="text-[12px]" style={{ color: 'var(--theme-text-muted)' }}>{label}</p>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--theme-text-muted)', opacity: 0.7 }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Active modules */}
      <section>
        <p className="forge-label mb-4">Your modules</p>
        <div className="space-y-2">
          {activeModules.map(({ id, icon: Icon, label, description, status, members, cta }) => (
            <div
              key={id}
              className="flex items-center gap-4 p-4 rounded-xl border transition-all duration-150 group"
              style={{ background: 'var(--theme-card-bg)', borderColor: 'var(--theme-border-color)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--theme-card-bg)'; e.currentTarget.style.borderColor = 'var(--theme-accent)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--theme-card-bg)'; e.currentTarget.style.borderColor = 'var(--theme-border-color)' }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.07)' }}
              >
                <Icon size={16} className="text-white/50" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[13px] font-semibold text-white">{label}</span>
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: 'var(--theme-accent-bg)', color: 'var(--theme-accent)' }}
                  >
                    {status}
                  </span>
                </div>
                <p className="text-[12px]" style={{ color: 'var(--theme-text-muted)' }}>{description}</p>
                {members !== null && (
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--theme-text-muted)', opacity: 0.7 }}>{members} members</p>
                )}
              </div>

              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  className="text-[12px] px-3 py-1.5 rounded-full transition-all duration-150"
                  style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--theme-text-muted)' }}
                  onMouseEnter={e => { e.target.style.background = 'var(--theme-accent-bg)'; e.target.style.color = 'var(--theme-text)' }}
                  onMouseLeave={e => { e.target.style.background = 'rgba(255,255,255,0.08)'; e.target.style.color = 'var(--theme-text-muted)' }}
                >
                  {cta} →
                </button>
                <button style={{ color: 'var(--theme-text-muted)' }}>
                  <Edit3 size={13} />
                </button>
              </div>
            </div>
          ))}

          {/* Add module slots */}
          {AVAILABLE_MODULES.slice(0, 2).map(mod => (
            <button
              key={mod.label}
              className="w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-150"
              style={{ background: 'transparent', borderStyle: 'dashed', borderColor: 'var(--theme-border-color)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--theme-accent)'; e.currentTarget.style.background = 'var(--theme-accent-bg)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--theme-border-color)'; e.currentTarget.style.background = 'transparent' }}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <mod.icon size={15} className="text-white/25" />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-medium" style={{ color: 'var(--theme-text-muted)' }}>{mod.label}</p>
                <p className="text-[12px]" style={{ color: 'var(--theme-text-muted)', opacity: 0.6 }}>{mod.description}</p>
              </div>
              <Plus size={14} className="text-white/20 flex-shrink-0" />
            </button>
          ))}
        </div>
      </section>

      {/* Forge AI suggestions for product copy */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <p className="forge-label">Generate product copy</p>
          <span className="text-[12px]" style={{ color: 'var(--theme-text-muted)' }}>AI-written, edit before publishing</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {FORGE_SUGGESTIONS.map(({ label, icon: Icon }) => (
            <button
              key={label}
              onClick={() => handleGenerate(label)}
              disabled={generating === label}
              className="text-left rounded-xl border p-4 transition-all duration-150 group"
              style={{
                background: generated[label] ? 'var(--theme-accent-bg)' : 'var(--theme-card-bg)',
                borderColor: generated[label] ? 'var(--theme-accent)' : 'var(--theme-border-color)',
              }}
              onMouseEnter={e => { if (!generated[label]) { e.currentTarget.style.background = 'var(--theme-card-bg)'; e.currentTarget.style.borderColor = 'var(--theme-accent)' } }}
              onMouseLeave={e => { if (!generated[label]) { e.currentTarget.style.background = 'var(--theme-card-bg)'; e.currentTarget.style.borderColor = 'var(--theme-border-color)' } }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.07)' }}>
                  {generating === label
                    ? <RefreshCw size={13} className="text-white/50 animate-spin" />
                    : generated[label]
                      ? <Check size={13} className="text-white/70" />
                      : <Icon size={13} className="text-white/50" />
                  }
                </div>
                {generated[label] && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleCopy(label) }}
                    className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.07)', color: 'var(--theme-text-muted)' }}
                  >
                    {copied === label ? <Check size={9} /> : <Copy size={9} />}
                    {copied === label ? 'Copied' : 'Copy'}
                  </button>
                )}
              </div>
              <p className="text-[12px] font-medium" style={{ color: generated[label] ? 'white' : 'var(--theme-text)' }}>
                {label}
              </p>
              {generated[label] && (
                <p className="text-[11px] mt-1" style={{ color: 'var(--theme-text-muted)' }}>
                  Generated · click to regenerate
                </p>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Quick actions */}
      <section>
        <p className="forge-label mb-4">Quick actions</p>
        <div className="space-y-1.5">
          {[
            { label: 'Share your offer page link', sub: 'Copy the URL to post on your channels' },
            { label: 'Set your founding member price', sub: 'Lock in early-access pricing before going wide' },
            { label: 'Write your product description', sub: 'Forge will draft it for you in 10 seconds' },
            { label: 'Invite beta testers', sub: 'Get your first 5 members to give feedback' },
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-4 px-4 py-3 rounded-xl border cursor-pointer transition-all duration-150"
              style={{ background: 'var(--theme-card-bg)', borderColor: 'var(--theme-border-color)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--theme-card-bg)'; e.currentTarget.style.borderColor = 'var(--theme-accent)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--theme-card-bg)'; e.currentTarget.style.borderColor = 'var(--theme-border-color)' }}
            >
              <div className="flex-1">
                <p className="text-[13px] font-medium text-white">{item.label}</p>
                <p className="text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>{item.sub}</p>
              </div>
              <ChevronRight size={14} className="text-white/20 flex-shrink-0" />
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}
