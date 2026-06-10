import { useState, useEffect } from 'react'
import { BarChart2, TrendingUp, Mail, MessageSquare, Loader2, RefreshCw, AlertCircle, Zap } from 'lucide-react'
import { getAnalytics } from '../../services/opsApi'

function StatCard({ label, value, sub, color, icon: Icon }) {
  return (
    <div
      className="rounded-2xl p-5 border"
      style={{ background: '#0e0e0e', borderColor: 'rgba(255,255,255,0.07)' }}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: `${color}18` }}
        >
          <Icon size={14} style={{ color }} />
        </div>
        {sub && (
          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(74,222,128,0.1)', color: '#4ade80' }}>
            {sub}
          </span>
        )}
      </div>
      <p className="text-[28px] font-bold text-white leading-none mb-1">{value}</p>
      <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</p>
    </div>
  )
}

function FunnelBar({ label, value, max, color }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <p className="text-[12px] w-24 text-right flex-shrink-0" style={{ color: 'rgba(255,255,255,0.5)' }}>{label}</p>
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <p className="text-[12px] w-8 flex-shrink-0 font-semibold text-white">{value}</p>
      <p className="text-[11px] w-8 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }}>{pct}%</p>
    </div>
  )
}

export default function CampaignStats() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const d = await getAnalytics()
      setData(d)
    } catch (e) {
      setError(e.message)
      // Demo data
      setData({
        total_scraped: 142,
        total_qualified: 38,
        total_outreach_sent: 24,
        total_replies: 7,
        total_interested: 4,
        total_converted: 1,
        open_rate: 62,
        reply_rate: 29,
        conversion_rate: 4,
        campaigns: [
          { name: 'YouTube Tech Creators Q2', sent: 14, replies: 4, interested: 2, status: 'active' },
          { name: 'Instagram Fitness Creators', sent: 10, replies: 3, interested: 2, status: 'active' },
        ]
      })
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 size={20} className="animate-spin" style={{ color: 'rgba(255,255,255,0.3)' }} />
    </div>
  )

  const d = data

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[18px] font-bold text-white">Campaign Analytics</h2>
          <p className="text-[12px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Full pipeline performance overview
          </p>
        </div>
        <button onClick={load}
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)' }}>
          <RefreshCw size={13} />
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl"
          style={{ background: 'rgba(255,180,0,0.07)', border: '1px solid rgba(255,180,0,0.15)' }}>
          <AlertCircle size={12} style={{ color: 'rgba(255,200,50,0.9)' }} />
          <p className="text-[11px]" style={{ color: 'rgba(255,200,50,0.8)' }}>Demo mode — backend offline.</p>
        </div>
      )}

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Creators Scraped"  value={d.total_scraped}        color="#60a5fa" icon={Zap} />
        <StatCard label="Qualified Leads"   value={d.total_qualified}      color="#a78bfa" icon={TrendingUp} sub={`${Math.round(d.total_qualified/d.total_scraped*100)||0}%`} />
        <StatCard label="Emails Sent"       value={d.total_outreach_sent}  color="#34d399" icon={Mail} />
        <StatCard label="Replies Received"  value={d.total_replies}        color="#facc15" icon={MessageSquare} sub={`${d.reply_rate}%`} />
      </div>

      {/* Funnel */}
      <div className="rounded-2xl border p-6" style={{ background: '#0e0e0e', borderColor: 'rgba(255,255,255,0.07)' }}>
        <p className="text-[13px] font-semibold text-white mb-5">Outreach Funnel</p>
        <div className="space-y-3">
          <FunnelBar label="Scraped"    value={d.total_scraped}        max={d.total_scraped}       color="#60a5fa" />
          <FunnelBar label="Qualified"  value={d.total_qualified}      max={d.total_scraped}       color="#a78bfa" />
          <FunnelBar label="Sent"       value={d.total_outreach_sent}  max={d.total_scraped}       color="#34d399" />
          <FunnelBar label="Replied"    value={d.total_replies}        max={d.total_outreach_sent} color="#facc15" />
          <FunnelBar label="Interested" value={d.total_interested||0}  max={d.total_replies||1}    color="#fb923c" />
          <FunnelBar label="Converted"  value={d.total_converted||0}   max={d.total_interested||1} color="#f43f5e" />
        </div>
      </div>

      {/* Active campaigns */}
      {d.campaigns?.length > 0 && (
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <div className="px-5 py-4 border-b" style={{ background: '#0e0e0e', borderColor: 'rgba(255,255,255,0.06)' }}>
            <p className="text-[13px] font-semibold text-white">Active Campaigns</p>
          </div>
          <table className="w-full" style={{ background: '#0a0a0a' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                {['Campaign', 'Sent', 'Replies', 'Interested', 'Status'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-widest"
                    style={{ color: 'rgba(255,255,255,0.3)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {d.campaigns.map((c, i) => (
                <tr key={i} className="border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                  <td className="px-5 py-3 text-[13px] font-medium text-white">{c.name}</td>
                  <td className="px-5 py-3 text-[13px] text-white">{c.sent}</td>
                  <td className="px-5 py-3 text-[13px] text-white">{c.replies}</td>
                  <td className="px-5 py-3 text-[13px]" style={{ color: '#4ade80' }}>{c.interested}</td>
                  <td className="px-5 py-3">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize"
                      style={{ background: c.status === 'active' ? 'rgba(74,222,128,0.12)' : 'rgba(255,255,255,0.07)', color: c.status === 'active' ? '#4ade80' : 'rgba(255,255,255,0.4)' }}>
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
