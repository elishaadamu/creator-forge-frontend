import { useState, useEffect } from 'react'
import {
  Users, Mail, MessageSquare, BarChart2, Settings,
  Zap, ChevronRight, Activity, Search, Bell, Shield, LogOut
} from 'lucide-react'
import LeadList from './LeadList'
import OutreachQueue from './OutreachQueue'
import ReplyInbox from './ReplyInbox'
import CampaignStats from './CampaignStats'
import AdminControl from './AdminControl'
import { opsSignOut } from './OpsAuth'

const NAV = [
  { id: 'leads',    label: 'Lead Discovery',    icon: Users,       badge: null },
  { id: 'queue',    label: 'Outreach Queue',    icon: Mail,        badge: 'review' },
  { id: 'inbox',    label: 'Reply Inbox',       icon: MessageSquare, badge: 'new' },
  { id: 'stats',    label: 'Campaign Stats',    icon: BarChart2,   badge: null },
  { id: 'admin',    label: 'Admin Control',     icon: Settings,    badge: null },
]

function NavItem({ item, active, onClick, counts }) {
  const Icon = item.icon
  const count = counts?.[item.id]
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 group"
      style={{
        background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
        border: active ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
    >
      <Icon size={15} style={{ color: active ? 'white' : 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
      <span className="flex-1 text-[13px] font-medium" style={{ color: active ? 'white' : 'rgba(255,255,255,0.5)' }}>
        {item.label}
      </span>
      {count > 0 && (
        <span
          className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
          style={{
            background: item.badge === 'review' ? 'rgba(255,180,0,0.2)' : 'rgba(255,255,255,0.1)',
            color: item.badge === 'review' ? 'rgba(255,200,50,1)' : 'rgba(255,255,255,0.7)',
          }}
        >
          {count}
        </span>
      )}
    </button>
  )
}

function AgentStatusBadge({ running, onRun }) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-xl"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <div className="flex items-center gap-1.5">
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: running ? '#4ade80' : 'rgba(255,255,255,0.2)', boxShadow: running ? '0 0 6px #4ade80' : 'none' }}
        />
        <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
          {running ? 'Agent running' : 'Agent idle'}
        </span>
      </div>
      <button
        onClick={onRun}
        className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg transition-all"
        style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'white' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
      >
        <Zap size={9} /> Run now
      </button>
    </div>
  )
}

export default function OpsLayout() {
  const [activeTab, setActiveTab]     = useState('leads')
  const [agentRunning, setAgentRunning] = useState(false)
  const [counts, setCounts]           = useState({ leads: 0, queue: 0, inbox: 0 })
  const [backendOnline, setBackendOnline] = useState(null) // null=checking, true=ok, false=offline

  // Check backend connectivity on mount
  useEffect(() => {
    fetch('/api/agent/status')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        setBackendOnline(true)
        setAgentRunning(data.running || false)
      })
      .catch(() => setBackendOnline(false))
  }, [])

  const runAgent = async () => {
    setAgentRunning(true)
    try {
      await fetch('/api/agent/run-full-pipeline?campaign_id=default', { method: 'POST' })
    } catch (e) {
      console.warn('Agent run error:', e)
    }
    setTimeout(() => setAgentRunning(false), 4000)
  }

  const COMPONENTS = {
    leads: <LeadList onCountChange={n => setCounts(p => ({ ...p, leads: n }))} />,
    queue: <OutreachQueue onCountChange={n => setCounts(p => ({ ...p, queue: n }))} />,
    inbox: <ReplyInbox onCountChange={n => setCounts(p => ({ ...p, inbox: n }))} />,
    stats: <CampaignStats />,
    admin: <AdminControl />,
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#080808' }}>
      {/* Sidebar */}
      <div
        className="w-56 flex-shrink-0 flex flex-col border-r"
        style={{ borderColor: 'rgba(255,255,255,0.06)', background: '#090909' }}
      >
        {/* Logo */}
        <div className="px-4 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <Shield size={13} className="text-white" />
            </div>
            <div>
              <p className="text-[12px] font-bold text-white tracking-tight">Forge Ops</p>
              <p className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>Internal Pipeline</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(item => (
            <NavItem
              key={item.id}
              item={item}
              active={activeTab === item.id}
              onClick={() => setActiveTab(item.id)}
              counts={counts}
            />
          ))}
        </nav>

        {/* Agent status */}
        <div className="px-3 pb-4 space-y-2">
          <AgentStatusBadge running={agentRunning} onRun={runAgent} />
          {/* Backend connectivity dot */}
          <div className="flex items-center gap-1.5 px-1">
            <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{
                background: backendOnline === null ? 'rgba(255,255,255,0.2)'
                           : backendOnline ? '#4ade80' : 'rgba(255,180,0,0.8)',
                boxShadow: backendOnline === true ? '0 0 5px #4ade80' : 'none',
              }}
            />
            <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
              {backendOnline === null ? 'Connecting…'
               : backendOnline ? 'API connected · localhost:8000'
               : 'Demo mode — start backend'}
            </span>
          </div>
          <p className="text-[9px] px-1" style={{ color: 'rgba(255,255,255,0.14)' }}>
            Cron runs daily 9am UTC
          </p>
        </div>

      </div>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
          style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(8,8,8,0.97)' }}
        >
          <h1 className="text-[15px] font-semibold text-white">
            {NAV.find(n => n.id === activeTab)?.label}
          </h1>
          <div className="flex items-center gap-2">
            <button
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
              style={{ color: 'rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.04)' }}
              onMouseEnter={e => e.currentTarget.style.color = 'white'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
            >
              <Bell size={14} />
            </button>
            <button
              onClick={opsSignOut}
              title="Sign out"
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
              style={{ color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.04)' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'rgba(239,68,68,0.8)'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
            >
              <LogOut size={14} />
            </button>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[12px] font-bold text-white cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              O
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {COMPONENTS[activeTab]}
        </div>
      </main>
    </div>
  )
}
