import { useState, useEffect, useCallback } from 'react'
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

  // Poll for global inbox counts (navbar badges)
  useEffect(() => {
    let interval;
    const fetchCounts = async () => {
      try {
        const res = await fetch('/api/outreach/threads?status=replied');
        if (res.ok) {
          const data = await res.json();
          setCounts(p => ({ ...p, inbox: data.length }));
        }
      } catch (e) {
        console.warn('Failed to fetch global thread counts', e);
      }
    };
    
    fetchCounts();
    interval = setInterval(fetchCounts, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const runAgent = async () => {
    setAgentRunning(true)
    try {
      await fetch('/api/agent/run-full-pipeline?campaign_id=default', { method: 'POST' })
    } catch (e) {
      console.warn('Agent run error:', e)
    }
    setTimeout(() => setAgentRunning(false), 4000)
  }

  const handleLeadsCountChange = useCallback((n) => {
    setCounts(p => p.leads === n ? p : { ...p, leads: n })
  }, [])

  const handleQueueCountChange = useCallback((n) => {
    setCounts(p => p.queue === n ? p : { ...p, queue: n })
  }, [])

  const handleInboxCountChange = useCallback((n) => {
    setCounts(p => p.inbox === n ? p : { ...p, inbox: n })
  }, [])

  const COMPONENTS = {
    leads: <LeadList onCountChange={handleLeadsCountChange} />,
    queue: <OutreachQueue onCountChange={handleQueueCountChange} />,
    inbox: <ReplyInbox onCountChange={handleInboxCountChange} />,
    stats: <CampaignStats />,
    admin: <AdminControl />,
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-black text-white" style={{ background: '#080808' }}>
      {/* Top Header Navbar */}
      <header
        className="flex items-center justify-between px-6 py-3 border-b flex-shrink-0"
        style={{ borderColor: 'rgba(255,255,255,0.06)', background: '#090909' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <Shield size={13} className="text-white" />
          </div>
          <div>
            <p className="text-[13px] font-bold text-white tracking-wider uppercase">Creator Forge</p>
            <p className="text-[8px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Internal Ops</p>
          </div>
        </div>

        {/* Center Pill Navigation */}
        <nav className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
          {NAV.filter(item => item.id !== 'admin').map(item => {
            const active = activeTab === item.id
            const count = counts[item.id]
            const label = item.id === 'leads' ? 'Creators' : item.label
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="relative px-3.5 py-1.5 rounded-lg text-[12px] font-semibold transition-all duration-150 flex items-center gap-1.5"
                style={{
                  background: active ? 'white' : 'transparent',
                  color: active ? 'black' : 'rgba(255,255,255,0.45)',
                }}
              >
                {label}
                {count > 0 && (
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{
                      background: active ? 'rgba(0,0,0,0.1)' : item.badge === 'review' ? 'rgba(255,180,0,0.2)' : 'rgba(255,255,255,0.1)',
                      color: active ? 'black' : item.badge === 'review' ? 'rgba(255,200,50,1)' : 'rgba(255,255,255,0.7)',
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          {/* Agent status badge */}
          <AgentStatusBadge running={agentRunning} onRun={runAgent} />

          {/* Admin Control Link */}
          <button
            onClick={() => setActiveTab('admin')}
            className="px-3.5 py-1.5 rounded-lg text-[12px] font-semibold flex items-center gap-1.5 transition-all"
            style={{
              background: activeTab === 'admin' ? 'white' : 'transparent',
              color: activeTab === 'admin' ? 'black' : 'rgba(255,255,255,0.45)',
            }}
          >
            <Settings size={12} />
            <span>Admin</span>
          </button>

          <div className="h-4 w-px bg-white/10" />

          {/* Sign out */}
          <button
            onClick={opsSignOut}
            title="Sign out"
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all text-white/40 hover:text-red-400 hover:bg-red-500/10"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            <LogOut size={13} />
          </button>

          {/* Operator Initial Avatar */}
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[12px] font-bold text-white/80"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            OP
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Extra subbar with connectivity indicator */}
        <div className="flex items-center justify-between px-6 py-1.5 border-b" style={{ borderColor: 'rgba(255,255,255,0.04)', background: '#080808' }}>
          <div className="flex items-center gap-1.5">
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
          <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.15)' }}>
            Pipeline Active · Auto-runs daily 9am UTC
          </span>
        </div>

        {/* Inner Content */}
        <div className="flex-1 overflow-y-auto">
          {COMPONENTS[activeTab]}
        </div>
      </main>
    </div>
  )
}
