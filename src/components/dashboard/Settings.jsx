import { useState } from 'react'
import { useForge } from '../../App'
import { Check, Radio, RefreshCw, Calendar, Upload, Mail, ChevronRight, AlertCircle, Zap, ShieldCheck } from 'lucide-react'

// ─── Toggle ──────────────────────────────────────────────────────────────────

function Toggle({ value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="relative flex-shrink-0 transition-all duration-200"
      style={{
        width: '36px',
        height: '20px',
        borderRadius: '100px',
        background: value ? 'white' : 'rgba(255,255,255,0.12)',
      }}
    >
      <div
        className="absolute top-1 rounded-full transition-all duration-200"
        style={{
          width: '14px',
          height: '14px',
          left: value ? '19px' : '3px',
          background: value ? 'black' : 'rgba(255,255,255,0.3)',
        }}
      />
    </button>
  )
}

// ─── Automation card ─────────────────────────────────────────────────────────

function AutomationCard({ automation, onToggle, onEdit }) {
  return (
    <div
      className="rounded-xl border p-4 transition-all duration-150"
      style={{
        background: automation.active ? 'rgba(255,255,255,0.04)' : '#111',
        borderColor: automation.active ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.07)',
      }}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.07)' }}
        >
          <automation.icon size={15} className="text-white/50" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-[13px] font-semibold text-white">{automation.label}</p>
            {automation.active && (
              <span
                className="text-[9px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide"
                style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}
              >
                Active
              </span>
            )}
          </div>
          <p className="text-[12px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.38)' }}>
            {automation.description}
          </p>

          {/* Sub-settings when active */}
          {automation.active && (
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span
                className="text-[11px] px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)' }}
              >
                {automation.cadence}
              </span>
              <span
                className="text-[11px] px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)' }}
              >
                {automation.mode === 'draft' ? 'Creates drafts' : 'Auto-posts'}
              </span>
              <button
                onClick={onEdit}
                className="text-[11px] px-2.5 py-1 rounded-full transition-all duration-150"
                style={{ color: 'rgba(255,255,255,0.3)' }}
                onMouseEnter={e => { e.target.style.color = 'rgba(255,255,255,0.6)' }}
                onMouseLeave={e => { e.target.style.color = 'rgba(255,255,255,0.3)' }}
              >
                Edit →
              </button>
            </div>
          )}
        </div>

        {/* Toggle */}
        <Toggle value={automation.active} onChange={onToggle} />
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const INITIAL_AUTOMATIONS = [
  {
    id: 'weekly-content',
    icon: Calendar,
    label: 'Weekly content plan',
    description: 'Every Monday, Forge generates a full week of posts tailored to your launch goals and drops them into your calendar as drafts.',
    cadence: 'Every Monday',
    mode: 'draft',
    active: false,
  },
  {
    id: 'community-post',
    icon: Radio,
    label: 'Weekly community post',
    description: 'Automatically creates a discussion starter or challenge post for your community each week to keep members engaged.',
    cadence: 'Every Sunday',
    mode: 'draft',
    active: false,
  },
  {
    id: 'repurpose',
    icon: RefreshCw,
    label: 'Repurpose YouTube uploads',
    description: 'When you upload a YouTube video, Forge automatically generates 5 short-form posts adapted for Instagram, X, TikTok, and your email list.',
    cadence: 'On each upload',
    mode: 'draft',
    active: false,
  },
  {
    id: 'launch-reminders',
    icon: AlertCircle,
    label: 'Launch reminder drafts',
    description: 'Before key launch dates, Forge auto-drafts countdown posts and emails so you never go dark during your most important moments.',
    cadence: '3 days before dates',
    mode: 'draft',
    active: false,
  },
  {
    id: 'product-update-copy',
    icon: Upload,
    label: 'Product update copy',
    description: 'When you make changes to your product, Forge drafts an announcement post and email to keep your audience informed.',
    cadence: 'On product changes',
    mode: 'draft',
    active: false,
  },
  {
    id: 'milestone-posts',
    icon: Radio,
    label: 'Milestone celebration posts',
    description: 'When you hit milestones (10 members, $1K, first sale), Forge auto-drafts a celebration post to share your momentum.',
    cadence: 'On milestone hit',
    mode: 'draft',
    active: false,
  },
]

const NOTIFICATION_SETTINGS = [
  { key: 'newMember', label: 'New member joins', sub: 'Email when someone signs up' },
  { key: 'weeklySummary', label: 'Weekly summary', sub: 'Revenue & growth digest every Monday' },
  { key: 'revenueAlerts', label: 'Revenue alerts', sub: 'Notified on each payment' },
  { key: 'contentReminders', label: 'Content reminders', sub: 'Calendar post-day reminders' },
  { key: 'automationRun', label: 'Automation notifications', sub: 'When an automation creates a draft' },
]

export default function Settings() {
  const { creatorData, setApiModalOpen } = useForge()
  const [automations, setAutomations] = useState(INITIAL_AUTOMATIONS)
  const [notifications, setNotifications] = useState({
    newMember: true,
    weeklySummary: true,
    revenueAlerts: true,
    contentReminders: false,
    automationRun: true,
  })
  const [saved, setSaved] = useState(false)
  const [activeSection, setActiveSection] = useState('profile')

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const toggleAutomation = (id) => {
    setAutomations(prev =>
      prev.map(a => a.id === id ? { ...a, active: !a.active } : a)
    )
  }

  const activeAutomationCount = automations.filter(a => a.active).length
  const sections = ['profile', 'api-keys', 'automations', 'notifications', 'billing']

  return (
    <div className="flex h-full">
      {/* Left nav */}
      <div
        className="w-44 border-r py-6 flex-shrink-0"
        style={{ borderColor: 'rgba(255,255,255,0.07)' }}
      >
        <p className="forge-label px-4 mb-3">Settings</p>
        <div className="space-y-0.5 px-2">
          {sections.map(s => (
            <button
              key={s}
              onClick={() => setActiveSection(s)}
              className="w-full text-left px-3 py-2 rounded-xl text-[13px] font-medium capitalize transition-all duration-150"
              style={{
                background: activeSection === s ? 'rgba(255,255,255,0.08)' : 'transparent',
                color: activeSection === s ? 'white' : 'rgba(255,255,255,0.4)',
                borderLeft: activeSection === s ? '2px solid white' : '2px solid transparent',
              }}
              onMouseEnter={e => { if (activeSection !== s) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
              onMouseLeave={e => { if (activeSection !== s) e.currentTarget.style.background = 'transparent' }}
            >
              {s}
              {s === 'automations' && activeAutomationCount > 0 && (
                <span
                  className="ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                  style={{ background: 'white', color: 'black' }}
                >
                  {activeAutomationCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Right content */}
      <div className="flex-1 overflow-y-auto p-6 max-w-xl">

        {/* ─── PROFILE ─────────────────────────────────────────── */}
        {activeSection === 'profile' && (
          <div className="space-y-6">
            <div>
              <h2 className="forge-heading mb-1" style={{ fontSize: '22px', letterSpacing: '-0.03em' }}>Profile</h2>
              <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.38)' }}>Your creator identity inside Forge.</p>
            </div>

            <div className="space-y-3">
              {[
                { label: 'Display name', value: creatorData.name || 'Creator', type: 'text' },
                { label: 'Handle', value: creatorData.handle || '@creator', type: 'text' },
                { label: 'Email', value: 'you@example.com', type: 'email' },
                { label: 'Niche / topic', value: creatorData.niche || 'Technology & Lifestyle', type: 'text' },
              ].map(field => (
                <div key={field.label}>
                  <label className="block text-[12px] mb-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    {field.label}
                  </label>
                  <div className="forge-input-wrap rounded-xl">
                    <input
                      className="forge-input text-[14px]"
                      defaultValue={field.value}
                      type={field.type}
                    />
                  </div>
                </div>
              ))}
            </div>

            <button onClick={handleSave} className="forge-btn-primary text-[14px] py-3 px-7 gap-2">
              {saved ? <><Check size={14} /> Saved</> : 'Save changes'}
            </button>
          </div>
        )}

        {/* ─── API KEYS ────────────────────────────────────────── */}
        {activeSection === 'api-keys' && (
          <div className="space-y-6">
            <div>
              <h2 className="forge-heading mb-1" style={{ fontSize: '22px', letterSpacing: '-0.03em' }}>API Keys</h2>
              <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.38)' }}>Manage your Scraping and AI integrations.</p>
            </div>

            <div className="rounded-xl border p-6" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' }}>
              <div className="flex items-start gap-4 mb-6">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <Zap size={18} className="text-white/50" />
                </div>
                <div>
                  <h3 className="text-[14px] font-semibold text-white mb-1">Manage Integrations</h3>
                  <p className="text-[12px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    Configure your Apify, YouTube, Gemini, Together, and NVIDIA API keys. These power Forge's ability to pull your data and generate AI content.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setApiModalOpen(true)}
                className="forge-btn-secondary text-[13px] py-2.5 px-5"
              >
                Configure API Keys
              </button>
            </div>
            
            <div className="rounded-xl border p-4 flex items-start gap-3" style={{ background: 'rgba(16, 185, 129, 0.04)', borderColor: 'rgba(16, 185, 129, 0.15)' }}>
              <ShieldCheck className="text-emerald-400 mt-0.5" size={15} />
              <div>
                <h4 className="text-[12px] font-semibold text-white">Your keys are secure</h4>
                <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  You control whether your AI keys are saved to your account or kept temporarily in memory. Manage this directly in the API Keys modal.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ─── AUTOMATIONS ─────────────────────────────────────── */}
        {activeSection === 'automations' && (
          <div className="space-y-6">
            <div>
              <h2 className="forge-heading mb-1" style={{ fontSize: '22px', letterSpacing: '-0.03em' }}>Automations</h2>
              <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.38)', lineHeight: '1.5' }}>
                Let Forge handle recurring work automatically. All automations create drafts by default - you approve before anything posts.
              </p>
            </div>

            {/* Active count banner */}
            {activeAutomationCount > 0 && (
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-xl border"
                style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)' }}
              >
                <Radio size={14} className="text-white/50" />
                <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  <strong className="text-white">{activeAutomationCount} automation{activeAutomationCount > 1 ? 's' : ''} active.</strong>{' '}
                  Forge will create drafts automatically - you'll be notified before anything posts.
                </p>
              </div>
            )}

            {/* Automation cards */}
            <div className="space-y-2">
              {automations.map(automation => (
                <AutomationCard
                  key={automation.id}
                  automation={automation}
                  onToggle={() => toggleAutomation(automation.id)}
                  onEdit={() => {}}
                />
              ))}
            </div>

            {/* Global approval setting */}
            <div
              className="rounded-xl border p-4"
              style={{ background: '#111', borderColor: 'rgba(255,255,255,0.07)' }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-semibold text-white mb-0.5">Always require approval</p>
                  <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    Forge will never auto-post without your review. Automations create drafts only.
                  </p>
                </div>
                <Toggle value={true} onChange={() => {}} />
              </div>
            </div>
          </div>
        )}

        {/* ─── NOTIFICATIONS ───────────────────────────────────── */}
        {activeSection === 'notifications' && (
          <div className="space-y-6">
            <div>
              <h2 className="forge-heading mb-1" style={{ fontSize: '22px', letterSpacing: '-0.03em' }}>Notifications</h2>
              <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.38)' }}>
                Choose what Forge notifies you about.
              </p>
            </div>

            <div className="space-y-1">
              {NOTIFICATION_SETTINGS.map(({ key, label, sub }) => (
                <div
                  key={key}
                  className="flex items-center justify-between p-4 rounded-xl transition-all duration-150"
                  style={{ background: '#111' }}
                >
                  <div>
                    <p className="text-[13px] font-medium text-white">{label}</p>
                    <p className="text-[12px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{sub}</p>
                  </div>
                  <Toggle
                    value={notifications[key]}
                    onChange={val => setNotifications(prev => ({ ...prev, [key]: val }))}
                  />
                </div>
              ))}
            </div>

            <button onClick={handleSave} className="forge-btn-primary text-[14px] py-3 px-7 gap-2">
              {saved ? <><Check size={14} /> Saved</> : 'Save changes'}
            </button>
          </div>
        )}

        {/* ─── BILLING ─────────────────────────────────────────── */}
        {activeSection === 'billing' && (
          <div className="space-y-6">
            <div>
              <h2 className="forge-heading mb-1" style={{ fontSize: '22px', letterSpacing: '-0.03em' }}>Billing</h2>
              <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.38)' }}>
                Manage your Forge subscription.
              </p>
            </div>

            {/* Plan card */}
            <div
              className="rounded-2xl border p-5"
              style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.12)' }}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Current plan</p>
                  <p className="text-[22px] font-semibold tracking-tight text-white">Founding Member</p>
                  <p className="text-[13px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Full access · Locked in at founder pricing</p>
                </div>
                <span
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                  style={{ background: 'white', color: 'black' }}
                >
                  Active
                </span>
              </div>

              <div className="space-y-2">
                {['Unlimited content generation', 'All dashboard features', 'Community management', 'Automation layer', 'Priority support'].map(f => (
                  <div key={f} className="flex items-center gap-2">
                    <Check size={13} className="text-white/50" />
                    <span className="text-[13px]" style={{ color: 'rgba(255,255,255,0.6)' }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
              <button
                className="text-[13px] transition-colors"
                style={{ color: 'rgba(255,255,255,0.2)' }}
                onMouseEnter={e => { e.target.style.color = 'rgba(255,255,255,0.5)' }}
                onMouseLeave={e => { e.target.style.color = 'rgba(255,255,255,0.2)' }}
              >
                Cancel subscription
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
