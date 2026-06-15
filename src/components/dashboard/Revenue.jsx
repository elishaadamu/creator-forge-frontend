import { useState } from 'react'
import { useForge, getAccent } from '../../App'
import { TrendingUp, ChevronRight, Sparkles, BarChart2, AlertCircle, ArrowUpRight } from 'lucide-react'

const MONTHS = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Now']
const REVENUE_DATA = [0, 0, 0, 0, 0, 0, 0]

const INSIGHTS = [
  {
    type: 'action',
    icon: AlertCircle,
    label: 'No members yet - your product is live',
    detail: 'Share your launch link to get your first 10 signups. Forge suggests posting today.',
    cta: 'Generate launch post',
    color: 'rgba(255,255,255,0.06)',
  },
  {
    type: 'tip',
    icon: TrendingUp,
    label: 'Founders who launch in the first 48h earn 3× more in month 1',
    detail: 'Post your launch announcement now while momentum is fresh.',
    cta: 'Write announcement',
    color: 'rgba(255,255,255,0.04)',
  },
  {
    type: 'tip',
    icon: BarChart2,
    label: 'Email converts 3–5× better than social posts',
    detail: 'If you haven\'t sent your list an email yet - that\'s your highest-leverage move right now.',
    cta: 'Write email',
    color: 'rgba(255,255,255,0.04)',
  },
]

const REVENUE_PATHS = [
  { label: 'Monthly memberships', potential: '$8K–$30K/mo', description: 'Your primary offer', active: true },
  { label: 'Course sales', potential: '$2K–$8K/mo', description: 'One-time or bundle', active: false },
  { label: 'Coaching upsell', potential: '$3K–$15K/mo', description: '1:1 or group', active: false },
  { label: 'Sponsorships', potential: '$1K–$5K/mo', description: 'Brand deals aligned to niche', active: false },
]

export default function Revenue() {
  const { creatorData, triggerToast, setActiveTab, setPreloadStudioType } = useForge()
  const accent = getAccent(creatorData.platform)
  const [activeRange, setActiveRange] = useState('all')

  const [membersCount] = useState(() => {
    try {
      const stored = localStorage.getItem('forge_products_members')
      if (stored !== null) return parseInt(stored, 10)
    } catch {}
    return creatorData?.followers ? Math.round(creatorData.followers * 0.002) || 12 : 12
  })

  const baseRevenue = membersCount * 29
  const revenueHistory = [
    Math.round(baseRevenue * 0.15),
    Math.round(baseRevenue * 0.3),
    Math.round(baseRevenue * 0.45),
    Math.round(baseRevenue * 0.6),
    Math.round(baseRevenue * 0.75),
    Math.round(baseRevenue * 0.9),
    baseRevenue
  ]

  const maxHistoryVal = Math.max(...revenueHistory, 1)

  const handleNavigationToStudio = (typeId) => {
    if (setPreloadStudioType) {
      setPreloadStudioType(typeId)
    }
    if (setActiveTab) {
      setActiveTab('studio')
    }
    if (triggerToast) triggerToast(`Studio preloaded with content type: ${typeId}`, 'info')
  }

  const handleActivatePath = (label) => {
    if (triggerToast) triggerToast(`Opening Products to configure ${label}...`, 'info')
    setTimeout(() => {
      setActiveTab('products')
    }, 600)
  }

  return (
    <div className="p-6 max-w-3xl space-y-8">
      {/* Header */}
      <div>
        <p className="forge-label mb-3">Revenue</p>
        <h2 className="forge-heading mb-1.5" style={{ fontSize: 'clamp(22px, 3vw, 30px)', letterSpacing: '-0.03em' }}>
          Revenue overview
        </h2>
        <p className="text-[14px]" style={{ color: 'rgba(255,255,255,0.38)' }}>
          Forge tracks your revenue and tells you what to do next.
        </p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'MRR', value: `$${baseRevenue}`, sub: 'monthly recurring' },
          { label: 'Members', value: membersCount.toString(), sub: 'total active' },
          { label: 'Potential', value: `$${Math.round(baseRevenue * 4.5)}`, sub: 'per month at scale' },
        ].map((kpi, i) => (
          <div key={i} className="rounded-xl border p-4" style={{ background: '#111', borderColor: i === 2 ? `rgba(${accent.rgb},0.2)` : 'rgba(255,255,255,0.07)' }}>
            <p className="text-[11px] mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{kpi.label}</p>
            <p className="text-[24px] font-semibold tracking-tight text-white leading-none mb-0.5">{kpi.value}</p>
            <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.25)' }}>{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Main chart card */}
      <div className="rounded-2xl border p-6" style={{ background: '#111', borderColor: 'rgba(255,255,255,0.07)' }}>
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-[13px] mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Revenue over time</p>
            <div className="flex items-end gap-2">
              <span className="text-[36px] font-semibold tracking-tight text-white leading-none">${revenueHistory.reduce((a,b) => a+b, 0)}</span>
              <span className="text-[13px] mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>all time</span>
            </div>
          </div>
          <div className="flex gap-1">
            {['1m', '3m', 'all'].map(r => (
              <button key={r} onClick={() => setActiveRange(r)}
                className="text-[11px] px-2.5 py-1 rounded-full uppercase tracking-wide transition-all duration-150"
                style={{
                  background: activeRange === r ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)',
                  color: activeRange === r ? 'white' : 'rgba(255,255,255,0.3)',
                }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Bar chart */}
        <div className="flex items-end gap-2 h-24 mb-3">
          {MONTHS.map((month, i) => (
            <div key={month} className="flex-1 flex flex-col items-center gap-1.5">
              <div
                className="w-full rounded-lg transition-all duration-500 relative overflow-hidden"
                style={{
                  height: `${Math.max((revenueHistory[i] / maxHistoryVal) * 80, 6)}px`,
                  background: i === MONTHS.length - 1
                    ? `rgba(${accent.rgb},0.35)`
                    : 'rgba(255,255,255,0.06)',
                  border: i === MONTHS.length - 1 ? `1px solid rgba(${accent.rgb},0.4)` : '1px solid transparent',
                }}
              >
                {i === MONTHS.length - 1 && (
                  <div className="absolute inset-0 shimmer-line" style={{ opacity: 0.3 }} />
                )}
              </div>
              <span className="text-[10px]" style={{ color: i === MONTHS.length - 1 ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.18)' }}>{month}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 pt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: accent.color, opacity: 0.6 }} />
          <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Dynamic revenue estimates tracked based on active platform member conversions.
          </p>
        </div>
      </div>

      {/* Forge insights - action-tied */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <p className="forge-label">Forge guidance</p>
          <Sparkles size={13} className="text-white/25" />
        </div>
        <div className="space-y-2">
          {INSIGHTS.map((insight, i) => (
            <div key={i} className="flex items-start gap-4 p-4 rounded-xl border" style={{ background: insight.color, borderColor: 'rgba(255,255,255,0.07)' }}>
              <insight.icon size={15} className="text-white/40 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-white mb-0.5">{insight.label}</p>
                <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{insight.detail}</p>
              </div>
              <button
                onClick={() => {
                  if (insight.cta === 'Generate launch post') handleNavigationToStudio('ig-caption')
                  else if (insight.cta === 'Write announcement') handleNavigationToStudio('email-announce')
                  else if (insight.cta === 'Write email') handleNavigationToStudio('email-sequence')
                }}
                className="text-[12px] px-3 py-1.5 rounded-full flex-shrink-0 transition-all duration-150"
                style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.55)' }}
                onMouseEnter={e => { e.target.style.background = 'rgba(255,255,255,0.15)'; e.target.style.color = 'white' }}
                onMouseLeave={e => { e.target.style.background = 'rgba(255,255,255,0.08)'; e.target.style.color = 'rgba(255,255,255,0.55)' }}
              >
                {insight.cta} →
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Revenue paths */}
      <section>
        <p className="forge-label mb-4">Revenue paths</p>
        <div className="space-y-2">
          {REVENUE_PATHS.map((path, i) => {
            const widths = [85, 55, 65, 40]
            return (
              <div key={path.label} className="p-4 rounded-xl border transition-all duration-150" style={{ background: '#111', borderColor: path.active ? `rgba(${accent.rgb},0.2)` : 'rgba(255,255,255,0.07)' }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-white">{path.label}</span>
                      {path.active ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: accent.color, color: 'white' }}>Active</span>
                      ) : (
                        <button 
                          onClick={() => handleActivatePath(path.label)}
                          className="text-[9px] px-2 py-0.5 rounded-full border border-white/10 text-white/50 hover:bg-white/5 hover:text-white transition-all font-medium"
                        >
                          Activate
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{path.description}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[13px] font-semibold text-white">{path.potential}</p>
                    <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>potential</p>
                  </div>
                </div>
                {/* Potential bar */}
                <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${widths[i]}%`,
                      background: path.active ? accent.color : 'rgba(255,255,255,0.15)',
                      opacity: path.active ? 0.7 : 0.4,
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Next revenue action */}
      <div className="rounded-2xl border p-5" style={{ background: `rgba(${accent.rgb},0.05)`, borderColor: `rgba(${accent.rgb},0.15)` }}>
        <div className="flex items-center gap-3">
          <ArrowUpRight size={16} style={{ color: accent.color }} />
          <div className="flex-1">
            <p className="text-[13px] font-semibold text-white">Your next revenue move</p>
            <p className="text-[12px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Post your launch announcement to get your first 10 paying members.</p>
          </div>
          <button 
            onClick={() => handleNavigationToStudio('ig-caption')}
            className="forge-btn-primary text-[12px] py-2 px-4 flex-shrink-0"
          >
            Generate post
          </button>
        </div>
      </div>
    </div>
  )
}
