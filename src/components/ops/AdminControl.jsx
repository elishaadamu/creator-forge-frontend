import { useState, useEffect, Fragment } from 'react'
import {
  Users, Database, Shield, ShieldCheck, ShieldAlert,
  Trash2, RefreshCw, Key, Settings, AlertTriangle, Loader2,
  Mail, Activity, Eye, EyeOff, Save, X, Play, Search, EyeIcon
} from 'lucide-react'

export default function AdminControl() {
  const [users, setUsers] = useState([])
  const [stats, setStats] = useState(null)
  const [sysSettings, setSysSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deletingUser, setDeletingUser] = useState(null) // holds username to delete
  const [confirmDeleteText, setConfirmDeleteText] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  // Edit settings form states
  const [isEditingSettings, setIsEditingSettings] = useState(false)
  const [editApifyKey, setEditApifyKey] = useState('')
  const [editAnthropicKey, setEditAnthropicKey] = useState('')
  const [editOpenAIKey, setEditOpenAIKey] = useState('')
  const [editGeminiKey, setEditGeminiKey] = useState('')
  const [editActiveProvider, setEditActiveProvider] = useState('gemini')
  const [editSendGridKey, setEditSendGridKey] = useState('')
  const [editFromEmail, setEditFromEmail] = useState('')
  const [editFromName, setEditFromName] = useState('')
  const [editGoogleEmail, setEditGoogleEmail] = useState('')
  const [editGoogleAppPassword, setEditGoogleAppPassword] = useState('')

  const [showEditApify, setShowEditApify] = useState(false)
  const [showEditAnthropic, setShowEditAnthropic] = useState(false)
  const [showEditOpenAI, setShowEditOpenAI] = useState(false)
  const [showEditGemini, setShowEditGemini] = useState(false)
  const [showEditSendGrid, setShowEditSendGrid] = useState(false)
  const [showEditGoogleAppPassword, setShowEditGoogleAppPassword] = useState(false)



  // Audit Logs states
  const [auditLogs, setAuditLogs] = useState([])
  const [logSearchQuery, setLogSearchQuery] = useState('')
  const [expandedLogId, setExpandedLogId] = useState(null)
  const [inspectedLog, setInspectedLog] = useState(null)
  const [inspectLoading, setInspectLoading] = useState(false)
  const [showRawMetadata, setShowRawMetadata] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      // 1. Fetch registered users
      const usersRes = await fetch('/api/admin/users')
      const usersData = await usersRes.json()
      if (usersData.status === 'success') {
        setUsers(usersData.users || [])
      }

      // 2. Fetch system/database stats
      const statsRes = await fetch('/api/admin/system-stats')
      const statsData = await statsRes.json()
      if (statsData.status === 'success') {
        setStats(statsData)
      }

      // 3. Fetch global system settings (API keys)
      const settingsRes = await fetch('/api/settings')
      const settingsData = await settingsRes.json()
      setSysSettings(settingsData)

      // Initialize edit fields
      setEditApifyKey(settingsData.apify_api_key || '')
      setEditAnthropicKey(settingsData.anthropic_api_key || '')
      setEditOpenAIKey(settingsData.openai_api_key || '')
      setEditGeminiKey(settingsData.gemini_api_key || '')
      setEditActiveProvider(settingsData.active_ai_provider || 'gemini')
      setEditSendGridKey(settingsData.sendgrid_api_key || '')
      setEditFromEmail(settingsData.from_email || '')
      setEditFromName(settingsData.from_name || '')
      setEditGoogleEmail(settingsData.google_email || '')
      setEditGoogleAppPassword(settingsData.google_app_password || '')

      // 4. Fetch recent activity audit logs
      const logsRes = await fetch('/api/audit/logs?limit=25')
      if (logsRes.ok) {
        const logsData = await logsRes.json()
        setAuditLogs(logsData || [])
      }

    } catch (e) {
      console.error('Failed to load admin control data:', e)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleDeleteUser = async () => {
    if (confirmDeleteText !== deletingUser) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(deletingUser)}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (data.status === 'success') {
        setDeletingUser(null)
        setConfirmDeleteText('')
        loadData()
      }
    } catch (e) {
      console.error('Failed to delete user:', e)
    }
    setActionLoading(false)
  }

  const handleSaveSettings = async () => {
    setActionLoading(true)
    const payload = {}

    // Only send key to update if the user has changed it from its masked bullet string
    if (editApifyKey && !editApifyKey.startsWith('•')) {
      payload.apify_api_key = editApifyKey
    }
    if (editAnthropicKey && !editAnthropicKey.startsWith('•')) {
      payload.anthropic_api_key = editAnthropicKey
    }
    if (editOpenAIKey && !editOpenAIKey.startsWith('•')) {
      payload.openai_api_key = editOpenAIKey
    }
    if (editGeminiKey && !editGeminiKey.startsWith('•')) {
      payload.gemini_api_key = editGeminiKey
    }
    if (editSendGridKey && !editSendGridKey.startsWith('•')) {
      payload.sendgrid_api_key = editSendGridKey
    }
    if (editGoogleAppPassword && !editGoogleAppPassword.startsWith('•')) {
      payload.google_app_password = editGoogleAppPassword
    }

    payload.active_ai_provider = editActiveProvider
    payload.from_email = editFromEmail
    payload.from_name = editFromName
    payload.google_email = editGoogleEmail

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        setIsEditingSettings(false)
        await loadData()
      } else {
        const errData = await res.json()
        alert('Failed to save settings: ' + (errData?.detail || 'Unknown error'))
      }
    } catch (e) {
      console.error('Failed to save global configurations:', e)
      alert('Network error while saving settings.')
    }
    setActionLoading(false)
  }



  const handleInspectLog = async (logId) => {
    if (expandedLogId === logId) {
      setExpandedLogId(null)
      setInspectedLog(null)
      return
    }
    setExpandedLogId(logId)
    setInspectLoading(true)
    setInspectedLog(null)
    setShowRawMetadata(false)
    try {
      const res = await fetch(`/api/audit/logs/${logId}/inspect`)
      if (res.ok) {
        const data = await res.json()
        setInspectedLog(data)
      }
    } catch (e) {
      console.error('Failed to inspect log details:', e)
    }
    setInspectLoading(false)
  }

  // Filter logs based on search query
  const filteredLogs = auditLogs.filter(log => {
    if (!logSearchQuery) return true
    const q = logSearchQuery.toLowerCase()
    return (
      (log.action && log.action.toLowerCase().includes(q)) ||
      (log.entity_type && log.entity_type.toLowerCase().includes(q)) ||
      (log.actor && log.actor.toLowerCase().includes(q))
    )
  })

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="animate-spin text-white/40 mb-3" size={24} />
        <p className="text-[13px] text-white/40">Loading admin control panel…</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[18px] font-bold text-white">System Admin Control</h2>
          <p className="text-[12px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Manage user accounts, database state, global configuration keys, and execution events.
          </p>
        </div>
        <button
          onClick={loadData}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all bg-white/5 hover:bg-white/12 text-white/50 hover:text-white"
        >
          <RefreshCw size={13} />
        </button>
      </div>

      {/* Stats Cards (expanded to 8 counts) */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Database Size', value: stats?.db_size || '0.0 KB', icon: Database, color: '#3b82f6' },
          { label: 'Registered Users', value: stats?.users_count ?? 0, icon: Users, color: '#10b981' },
          { label: 'Active Campaigns', value: stats?.campaigns_count ?? 0, icon: Settings, color: '#6366f1' },
          { label: 'Outreach Messages', value: stats?.outreach_count ?? 0, icon: Mail, color: '#ec4899' },
          { label: 'Creators Scraped', value: stats?.creators_count ?? 0, icon: ShieldCheck, color: '#a78bfa' },
          { label: 'AI Product Recs', value: stats?.recs_count ?? 0, icon: Key, color: '#f59e0b' },
          { label: 'Suppressed Contacts', value: stats?.suppression_count ?? 0, icon: ShieldAlert, color: '#ef4444' },
          { label: 'System Audit Logs', value: stats?.audit_logs_count ?? 0, icon: Activity, color: '#06b6d4' },
        ].map((card, idx) => {
          const Icon = card.icon
          return (
            <div key={idx} className="rounded-2xl border p-4 flex items-center gap-4" style={{ background: '#0a0a0a', borderColor: 'rgba(255,255,255,0.06)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${card.color}15`, color: card.color }}>
                <Icon size={18} />
              </div>
              <div>
                <p className="text-[11px] text-white/40 font-medium">{card.label}</p>
                <p className="text-[18px] font-bold text-white mt-0.5">{card.value}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* User Accounts list */}
      <div className="rounded-2xl border" style={{ borderColor: 'rgba(255,255,255,0.07)', background: '#0a0a0a' }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <h3 className="text-[14px] font-bold text-white">Registered User Accounts</h3>
          <p className="text-[11px] text-white/40 mt-0.5">Operators registered to use the dashboard console.</p>
        </div>

        <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#0e0e0e', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['Username', 'Email', 'Active Session Creator', 'AI Keys Consented', 'Registered Date', 'Actions'].map(h => (
                <th key={h} className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-white/30">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-[13px] text-white/30">
                  No user accounts registered yet.
                </td>
              </tr>
            ) : (
              users.map(u => (
                <tr key={u.username} className="border-b hover:bg-white/[0.01]" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                  {/* Username */}
                  <td className="px-5 py-3.5 text-[13px] font-semibold text-white">
                    {u.username}
                  </td>
                  {/* Email */}
                  <td className="px-5 py-3.5 text-[13px] text-white/70">
                    {u.email}
                  </td>
                  {/* Active Onboarded Creator */}
                  <td className="px-5 py-3.5 text-[12px] text-white/50">
                    {u.handle ? (
                      <span className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                        <span className="capitalize text-white/70 font-semibold">{u.platform}:</span>
                        <span className="text-white/80 font-mono">@{u.handle}</span>
                      </span>
                    ) : (
                      <span className="text-white/25 italic">Not onboarded</span>
                    )}
                  </td>
                  {/* AI Keys Consented */}
                  <td className="px-5 py-3.5 text-[12px]">
                    {u.has_ai_keys ? (
                      <span className="text-emerald-400 font-semibold inline-flex items-center gap-1">
                        <ShieldCheck size={12} /> Consented (Saved)
                      </span>
                    ) : (
                      <span className="text-white/30 inline-flex items-center gap-1">
                        <ShieldAlert size={12} className="text-white/20" /> Temporary Memory Only
                      </span>
                    )}
                  </td>
                  {/* Registered Date */}
                  <td className="px-5 py-3.5 text-[12px] text-white/40">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                  </td>
                  {/* Actions */}
                  <td className="px-5 py-3.5 text-[12px]">
                    <button
                      onClick={() => setDeletingUser(u.username)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-1.5 rounded-lg transition-all"
                      title="Delete user account"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Configurations & Utilities */}
      <div>
        {/* Global Settings Editor */}
        <div className="rounded-2xl border p-5 space-y-4" style={{ borderColor: 'rgba(255,255,255,0.07)', background: '#0a0a0a' }}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[14px] font-bold text-white">Global Server Configurations</h3>
              <p className="text-[11px] text-white/40 mt-0.5">Manage system fallback API keys & credentials in `.env`.</p>
            </div>
            {!isEditingSettings ? (
              <button
                onClick={() => setIsEditingSettings(true)}
                className="text-[11px] font-semibold bg-white/5 border border-white/10 hover:bg-white/10 text-white px-2.5 py-1.5 rounded-lg transition-all"
              >
                Edit settings
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleSaveSettings}
                  disabled={actionLoading}
                  className="text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 disabled:opacity-40"
                >
                  {actionLoading ? <Loader2 size={10} className="animate-spin" /> : <Save size={10} />}
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsEditingSettings(false)
                    // Reset to server defaults
                    if (sysSettings) {
                      setEditApifyKey(sysSettings.apify_api_key || '')
                      setEditAnthropicKey(sysSettings.anthropic_api_key || '')
                      setEditOpenAIKey(sysSettings.openai_api_key || '')
                      setEditGeminiKey(sysSettings.gemini_api_key || '')
                      setEditActiveProvider(sysSettings.active_ai_provider || 'gemini')
                      setEditSendGridKey(sysSettings.sendgrid_api_key || '')
                      setEditFromEmail(sysSettings.from_email || '')
                      setEditFromName(sysSettings.from_name || '')
                      setEditGoogleEmail(sysSettings.google_email || '')
                      setEditGoogleAppPassword(sysSettings.google_app_password || '')
                    }
                  }}
                  disabled={actionLoading}
                  className="text-[11px] font-semibold bg-white/5 hover:bg-white/10 text-white/70 px-2.5 py-1.5 rounded-lg transition-all disabled:opacity-40"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="space-y-3.5 text-[12px]">
            {/* Apify Key */}
            <div className="flex flex-col gap-1.5">
              <span className="text-white/40 font-medium">Apify API Key</span>
              {isEditingSettings ? (
                <div className="flex items-center gap-2 bg-[#070707] border border-white/8 rounded-xl px-3 py-2">
                  <input
                    type={showEditApify ? 'text' : 'password'}
                    value={editApifyKey}
                    onChange={e => setEditApifyKey(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-white font-mono text-[11px]"
                    placeholder="Enter key to update..."
                  />
                  <button onClick={() => setShowEditApify(!showEditApify)} className="text-white/30 hover:text-white/60">
                    {showEditApify ? <EyeOff size={12} /> : <Eye size={12} />}
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] text-white/70">{sysSettings?.apify_api_key || 'Not Set'}</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${sysSettings?.apify_configured ? 'bg-green-400' : 'bg-amber-400'}`} />
                </div>
              )}
            </div>

            {/* Anthropic Key */}
            <div className="flex flex-col gap-1.5 border-t border-white/[0.04] pt-3">
              <span className="text-white/40 font-medium">Anthropic (Claude) API Key</span>
              {isEditingSettings ? (
                <div className="flex items-center gap-2 bg-[#070707] border border-white/8 rounded-xl px-3 py-2">
                  <input
                    type={showEditAnthropic ? 'text' : 'password'}
                    value={editAnthropicKey}
                    onChange={e => setEditAnthropicKey(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-white font-mono text-[11px]"
                    placeholder="Enter key to update..."
                  />
                  <button onClick={() => setShowEditAnthropic(!showEditAnthropic)} className="text-white/30 hover:text-white/60">
                    {showEditAnthropic ? <EyeOff size={12} /> : <Eye size={12} />}
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] text-white/70">{sysSettings?.anthropic_api_key || 'Not Set'}</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${sysSettings?.anthropic_api_key ? 'bg-green-400' : 'bg-amber-400'}`} />
                </div>
              )}
            </div>

            {/* OpenAI API Key */}
            <div className="flex flex-col gap-1.5 border-t border-white/[0.04] pt-3">
              <span className="text-white/40 font-medium">OpenAI API Key</span>
              {isEditingSettings ? (
                <div className="flex items-center gap-2 bg-[#070707] border border-white/8 rounded-xl px-3 py-2">
                  <input
                    type={showEditOpenAI ? 'text' : 'password'}
                    value={editOpenAIKey}
                    onChange={e => setEditOpenAIKey(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-white font-mono text-[11px]"
                    placeholder="Enter key to update..."
                  />
                  <button onClick={() => setShowEditOpenAI(!showEditOpenAI)} className="text-white/30 hover:text-white/60">
                    {showEditOpenAI ? <EyeOff size={12} /> : <Eye size={12} />}
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] text-white/70">{sysSettings?.openai_api_key || 'Not Set'}</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${sysSettings?.openai_api_key ? 'bg-green-400' : 'bg-amber-400'}`} />
                </div>
              )}
            </div>

            {/* Gemini API Key */}
            <div className="flex flex-col gap-1.5 border-t border-white/[0.04] pt-3">
              <span className="text-white/40 font-medium">Gemini API Key</span>
              {isEditingSettings ? (
                <div className="flex items-center gap-2 bg-[#070707] border border-white/8 rounded-xl px-3 py-2">
                  <input
                    type={showEditGemini ? 'text' : 'password'}
                    value={editGeminiKey}
                    onChange={e => setEditGeminiKey(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-white font-mono text-[11px]"
                    placeholder="Enter key to update..."
                  />
                  <button onClick={() => setShowEditGemini(!showEditGemini)} className="text-white/30 hover:text-white/60">
                    {showEditGemini ? <EyeOff size={12} /> : <Eye size={12} />}
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] text-white/70">{sysSettings?.gemini_api_key || 'Not Set'}</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${sysSettings?.gemini_api_key ? 'bg-green-400' : 'bg-amber-400'}`} />
                </div>
              )}
            </div>

            {/* Active AI Provider selection */}
            <div className="flex flex-col gap-1.5 border-t border-white/[0.04] pt-3">
              <span className="text-white/40 font-medium">Active AI Provider</span>
              {isEditingSettings ? (
                <select
                  value={editActiveProvider}
                  onChange={e => setEditActiveProvider(e.target.value)}
                  className="bg-[#070707] border border-white/8 rounded-xl px-3 py-2 outline-none text-white text-[12px] font-semibold"
                >
                  <option value="gemini">Gemini AI (Default)</option>
                  <option value="openai">OpenAI (GPT-5.5)</option>
                  <option value="claude">Claude AI (Anthropic)</option>
                </select>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="capitalize text-[12px] text-emerald-400 font-semibold font-mono">
                    {sysSettings?.active_ai_provider || 'gemini'}
                  </span>
                </div>
              )}
            </div>

            {/* Google SMTP Credentials Section */}
            <div className="border-t border-white/[0.06] mt-4 pt-3">
              <span className="text-white/60 font-semibold text-[11px] uppercase tracking-wider block mb-2">Google SMTP Dispatcher</span>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <span className="text-white/40 font-medium">Google SMTP Email</span>
                  {isEditingSettings ? (
                    <input
                      type="email"
                      value={editGoogleEmail}
                      onChange={e => setEditGoogleEmail(e.target.value)}
                      className="bg-[#070707] border border-white/8 rounded-xl px-3 py-2 outline-none text-white text-[11px]"
                      placeholder="username@gmail.com"
                    />
                  ) : (
                    <span className="text-[12px] text-white/70 font-mono">{sysSettings?.google_email || 'Not Set'}</span>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-white/40 font-medium">Google App Password</span>
                  {isEditingSettings ? (
                    <div className="flex items-center gap-2 bg-[#070707] border border-white/8 rounded-xl px-3 py-2">
                      <input
                        type={showEditGoogleAppPassword ? 'text' : 'password'}
                        value={editGoogleAppPassword}
                        onChange={e => setEditGoogleAppPassword(e.target.value)}
                        className="flex-1 bg-transparent outline-none text-white font-mono text-[11px]"
                        placeholder="xxxx xxxx xxxx xxxx"
                      />
                      <button onClick={() => setShowEditGoogleAppPassword(!showEditGoogleAppPassword)} className="text-white/30 hover:text-white/60">
                        {showEditGoogleAppPassword ? <EyeOff size={12} /> : <Eye size={12} />}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] text-white/70 font-mono">{sysSettings?.google_app_password || 'Not Set'}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Legacy Sender configurations */}
            <div className="border-t border-white/[0.04] mt-4 pt-3">
              <span className="text-white/35 font-medium text-[10px] uppercase tracking-wider block mb-2">Legacy Sender Info (Optional)</span>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <span className="text-white/30 font-medium">Default From Email</span>
                  {isEditingSettings ? (
                    <input
                      type="email"
                      value={editFromEmail}
                      onChange={e => setEditFromEmail(e.target.value)}
                      className="bg-[#070707]/60 border border-white/8 rounded-xl px-3 py-2 outline-none text-white text-[11px]"
                      placeholder="partnerships@domain.com"
                    />
                  ) : (
                    <span className="text-[11px] text-white/50">{sysSettings?.from_email || 'Not Set'}</span>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-white/30 font-medium">Default From Name</span>
                  {isEditingSettings ? (
                    <input
                      type="text"
                      value={editFromName}
                      onChange={e => setEditFromName(e.target.value)}
                      className="bg-[#070707]/60 border border-white/8 rounded-xl px-3 py-2 outline-none text-white text-[11px]"
                      placeholder="Creator Forge Team"
                    />
                  ) : (
                    <span className="text-[11px] text-white/50">{sysSettings?.from_name || 'Not Set'}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Active LLM Model info */}
            <div className="py-2.5 flex items-center justify-between border-t border-white/[0.04] mt-2">
              <span className="text-white/40 font-medium">Active LLM Model</span>
              <span className="font-mono text-[11px] text-emerald-400 font-semibold">
                {sysSettings?.active_ai_provider === 'openai'
                  ? 'gpt-5.5'
                  : (sysSettings?.active_ai_provider === 'claude' || sysSettings?.active_ai_provider === 'anthropic')
                    ? (sysSettings?.ai_model || 'claude-opus-4-6')
                    : 'gemini-2.5-flash'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* System Activity Logs Section */}
      <div className="rounded-2xl border p-5 space-y-4" style={{ borderColor: 'rgba(255,255,255,0.07)', background: '#0a0a0a' }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-[14px] font-bold text-white">System Activity Logs</h3>
            <p className="text-[11px] text-white/40 mt-0.5">Real-time audit log tracker of system and operator actions.</p>
          </div>
          {/* Search Box */}
          <div className="flex items-center gap-2 bg-[#070707] border border-white/10 px-3 py-1.5 rounded-xl w-64">
            <Search size={13} className="text-white/30 flex-shrink-0" />
            <input
              type="text"
              value={logSearchQuery}
              onChange={e => setLogSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-white text-[11px] placeholder:text-white/20 w-full"
              placeholder="Search by action, actor, or entity..."
            />
            {logSearchQuery && (
              <button onClick={() => setLogSearchQuery('')} className="text-white/30 hover:text-white/60">
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-white/5">
          <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#0e0e0e', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['Timestamp', 'Actor', 'Action', 'Entity Type', 'Entity ID', 'Details'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-[9px] font-semibold uppercase tracking-wider text-white/30">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-[12px] text-white/30 font-mono">
                    No matching activity logs found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <Fragment key={log.id}>
                    <tr className="border-b border-white/[0.03] hover:bg-white/[0.01]">
                      <td className="px-4 py-3 text-[11px] text-white/40 font-mono">
                        {log.created_at ? new Date(log.created_at).toLocaleString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-[11px]">
                        <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/70 font-semibold font-mono text-[10px]">
                          {log.actor || 'system'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[11px] text-white font-medium">
                        {log.action}
                      </td>
                      <td className="px-4 py-3 text-[11px] text-white/50 capitalize">
                        {log.entity_type || '—'}
                      </td>
                      <td className="px-4 py-3 text-[11px] text-white/40 font-mono text-[10px]">
                        {log.entity_id || '—'}
                      </td>
                      <td className="px-4 py-3 text-[11px]">
                        <button
                          onClick={() => handleInspectLog(log.id)}
                          className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 font-semibold"
                        >
                          <EyeIcon size={11} />
                          {expandedLogId === log.id ? 'Collapse' : 'Inspect'}
                        </button>
                      </td>
                    </tr>
                    {expandedLogId === log.id && (
                      <tr className="bg-white/[0.005] hover:bg-transparent">
                        <td colSpan={6} className="px-4 py-3 border-b border-white/[0.03] align-top">
                          <div 
                            className="overflow-hidden"
                            style={{
                              animation: 'fadeIn 0.25s ease forwards, slideInUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                            }}
                          >
                            <div className="p-4 rounded-xl border border-blue-500/10 space-y-4" style={{ background: '#070707' }}>
                              <div className="flex items-center justify-between border-b border-white/[0.04] pb-2">
                                <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
                                  <Activity size={12} className="text-blue-400 animate-pulse" />
                                  Inspect Log Event: {expandedLogId}
                                </span>
                                <button onClick={() => { setExpandedLogId(null); setInspectedLog(null); }} className="text-white/30 hover:text-white/60">
                                  <X size={12} />
                                </button>
                              </div>

                              {inspectLoading ? (
                                <div className="flex items-center gap-2 py-4 justify-center text-[11px] text-white/40">
                                  <Loader2 size={13} className="animate-spin" />
                                  Retrieving detailed audit parameters and referenced database records...
                                </div>
                              ) : inspectedLog ? (
                                <div className="space-y-4">
                                  {/* Event Core Info */}
                                  <div className="grid grid-cols-4 gap-4 p-3 bg-white/[0.02] border border-white/5 rounded-xl text-[11px]">
                                    <div>
                                      <span className="text-white/30 block">Action Performed</span>
                                      <span className="text-white font-semibold font-mono">{inspectedLog.action}</span>
                                    </div>
                                    <div>
                                      <span className="text-white/30 block">Actor / Triggered By</span>
                                      <span className="text-emerald-400 font-semibold font-mono">@{inspectedLog.actor || 'system'}</span>
                                    </div>
                                    <div>
                                      <span className="text-white/30 block">Execution Time</span>
                                      <span className="text-white/70 font-mono">
                                        {inspectedLog.created_at ? new Date(inspectedLog.created_at).toLocaleString() : '—'}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-white/30 block">IP / Origin Host</span>
                                      <span className="text-white/50 font-mono">{inspectedLog.ip_address || '127.0.0.1 (Local)'}</span>
                                    </div>
                                  </div>

                                  {/* Hydrated Entity Details */}
                                  {inspectedLog.entity_details ? (
                                    <div className="space-y-2">
                                      <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider block">
                                        Referenced {inspectedLog.entity_details.type.replace('_', ' ')} Record details:
                                      </span>
                                      
                                      {inspectedLog.entity_details.type === 'creator' && (
                                        <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-3.5 rounded-xl">
                                          {inspectedLog.entity_details.profile_pic ? (
                                            <img 
                                              src={inspectedLog.entity_details.profile_pic} 
                                              className="w-12 h-12 rounded-full object-cover border border-white/15 bg-white/5 flex-shrink-0"
                                              alt=""
                                              onError={(e) => { e.target.style.display = 'none'; }}
                                            />
                                          ) : (
                                            <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[14px] flex-shrink-0 font-mono">
                                              {(inspectedLog.entity_details.name || inspectedLog.entity_details.handle || '?').charAt(0).toUpperCase()}
                                            </div>
                                          )}
                                          <div className="space-y-1">
                                            <div className="text-[13px] font-bold text-white flex items-center gap-2">
                                              {inspectedLog.entity_details.name || inspectedLog.entity_details.handle}
                                              <span className="px-2 py-0.5 rounded-full text-[9px] bg-white/5 border border-white/10 text-white/60 font-semibold font-mono">
                                                {inspectedLog.entity_details.platform}
                                              </span>
                                            </div>
                                            <div className="text-[11px] text-white/50">
                                              Handle: <span className="text-blue-400 font-mono">@{inspectedLog.entity_details.handle}</span>
                                              {inspectedLog.entity_details.follower_count && (
                                                <>
                                                  <span className="mx-2 text-white/10">|</span>
                                                  Followers: <span className="text-white/80 font-semibold">{Number(inspectedLog.entity_details.follower_count).toLocaleString()}</span>
                                                </>
                                              )}
                                            </div>
                                            <div className="flex items-center gap-2 pt-1">
                                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                                inspectedLog.entity_details.status === 'qualified' ? 'bg-green-500/10 text-green-400' :
                                                inspectedLog.entity_details.status === 'rejected' ? 'bg-red-500/10 text-red-400' :
                                                'bg-amber-500/10 text-amber-400'
                                              }`}>
                                                Campaign status: {inspectedLog.entity_details.status}
                                              </span>
                                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                                inspectedLog.entity_details.ai_status === 'analyzed' ? 'bg-purple-500/10 text-purple-400' :
                                                'bg-white/5 text-white/40'
                                              }`}>
                                                AI Model Action: {inspectedLog.entity_details.ai_status || 'Unprocessed'}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      )}

                                      {inspectedLog.entity_details.type === 'campaign' && (
                                        <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl space-y-2">
                                          <div className="text-[13px] font-bold text-white flex items-center gap-2">
                                            Campaign Name: <span className="text-blue-400">{inspectedLog.entity_details.name}</span>
                                          </div>
                                          <div className="grid grid-cols-3 gap-2 text-[11px]">
                                            <div>
                                              <span className="text-white/30 block">Campaign Status</span>
                                              <span className="capitalize text-emerald-400 font-semibold font-mono">{inspectedLog.entity_details.status}</span>
                                            </div>
                                            <div>
                                              <span className="text-white/30 block">Daily Limit</span>
                                              <span className="text-white font-semibold font-mono">{inspectedLog.entity_details.daily_send_limit || 'No limit'}</span>
                                            </div>
                                            <div>
                                              <span className="text-white/30 block">Total Dispatched</span>
                                              <span className="text-white font-semibold font-mono">{inspectedLog.entity_details.total_sent || 0}</span>
                                            </div>
                                          </div>
                                        </div>
                                      )}

                                      {inspectedLog.entity_details.type === 'outreach_message' && (
                                        <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl space-y-3">
                                          <div className="flex items-center justify-between border-b border-white/[0.04] pb-2">
                                            <span className="text-[12px] font-bold text-white flex items-center gap-1.5">
                                              Draft Email Message
                                            </span>
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                              inspectedLog.entity_details.status === 'sent' ? 'bg-emerald-500/10 text-emerald-400' :
                                              inspectedLog.entity_details.status === 'queued' ? 'bg-blue-500/10 text-blue-400' :
                                              inspectedLog.entity_details.status === 'failed' ? 'bg-red-500/10 text-red-400' :
                                              'bg-white/5 text-white/50'
                                            }`}>
                                              {inspectedLog.entity_details.status}
                                            </span>
                                          </div>
                                          {inspectedLog.entity_details.creator_handle && (
                                            <div className="text-[11px]">
                                              <span className="text-white/30">Target Recipient: </span>
                                              <span className="text-blue-400 font-semibold font-mono">{inspectedLog.entity_details.creator_handle}</span>
                                            </div>
                                          )}
                                          <div>
                                            <span className="text-white/30 text-[11px] block mb-1 font-semibold">Subject Line:</span>
                                            <div className="text-[11px] text-white bg-black/30 px-3 py-2 rounded-lg font-mono">
                                              {inspectedLog.entity_details.subject || '(No Subject Line Generated)'}
                                            </div>
                                          </div>
                                          <div>
                                            <span className="text-white/30 text-[11px] block mb-1 font-semibold">Message Body:</span>
                                            <div className="text-[11px] text-white/80 bg-black/40 p-3 rounded-lg font-mono whitespace-pre-wrap leading-relaxed max-h-[150px] overflow-y-auto">
                                              {inspectedLog.entity_details.body}
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-4 text-[10px] text-white/40 pt-1">
                                            <span>Send Method: <strong className="text-white/70 uppercase">{inspectedLog.entity_details.send_method}</strong></span>
                                            {inspectedLog.entity_details.sent_at && (
                                              <span>Sent At: <strong className="text-white/70 font-mono">{new Date(inspectedLog.entity_details.sent_at).toLocaleString()}</strong></span>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="p-3 bg-white/5 border border-white/5 text-white/40 rounded-xl text-[11px] text-center font-mono">
                                      No related database entity found for {inspectedLog.entity_type || 'this action'} (ID: {inspectedLog.entity_id || 'None'})
                                    </div>
                                  )}

                                  {/* Collapsible raw metadata */}
                                  <div className="border-t border-white/[0.04] pt-3">
                                    <button
                                      onClick={() => setShowRawMetadata(!showRawMetadata)}
                                      className="text-[10px] text-white/30 hover:text-white/60 transition-colors flex items-center gap-1 font-mono uppercase tracking-wider"
                                    >
                                      <span>{showRawMetadata ? '▼ Hide' : '▶ Show'} Raw Audit Log Metadata JSON</span>
                                    </button>
                                    {showRawMetadata && (
                                      <pre className="mt-2 text-[10px] text-white/70 overflow-x-auto p-3 bg-black/40 rounded-lg font-mono leading-relaxed" style={{ maxHeight: '150px' }}>
                                        {JSON.stringify(inspectedLog.details || {}, null, 2)}
                                      </pre>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="py-4 text-center text-[11px] text-white/30">
                                  Failed to load details for this audit log.
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>


      </div>

      {/* Delete User Confirmation Modal */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border p-5 space-y-4" style={{ background: '#0e0e0e', borderColor: 'rgba(255,255,255,0.1)' }}>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={16} />
              </div>
              <div>
                <h4 className="text-[14px] font-bold text-white">Delete User Account?</h4>
                <p className="text-[12px] text-white/50 leading-relaxed mt-1">
                  This will permanently delete the operator account <span className="font-mono text-white/80">@{deletingUser}</span> and clear all associated onboarding state backups from the database.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[11px] text-white/40">Type the username <span className="text-white/60 font-semibold font-mono">{deletingUser}</span> to confirm:</p>
              <input
                className="w-full rounded-xl border px-3 py-2 text-[12px] text-white outline-none font-mono placeholder:text-white/10"
                style={{ background: '#070707', borderColor: 'rgba(255,255,255,0.08)' }}
                placeholder={deletingUser}
                value={confirmDeleteText}
                onChange={e => setConfirmDeleteText(e.target.value)}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                disabled={actionLoading}
                onClick={() => { setDeletingUser(null); setConfirmDeleteText('') }}
                className="flex-1 py-2 rounded-xl text-[12px] text-white/60 hover:text-white border border-white/10 transition-all disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                disabled={actionLoading || confirmDeleteText !== deletingUser}
                onClick={handleDeleteUser}
                className="flex-1 py-2 rounded-xl text-[12px] font-semibold text-white bg-red-600 hover:bg-red-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                {actionLoading ? <Loader2 size={12} className="animate-spin" /> : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
