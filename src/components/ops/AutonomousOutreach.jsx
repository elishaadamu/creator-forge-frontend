import { useState, useEffect } from 'react'
import {
  Zap, Play, Clock, Users, Mail, Settings, RefreshCw, Check, AlertCircle,
  Eye, FileText, ChevronRight, Sliders, ShieldCheck, Sparkles, Send, Tag, Filter, Bell, Activity
} from 'lucide-react'
import {
  getAutonomousCampaigns, updateAutonomousCampaign,
  runAutonomousBatch, runAutonomousFollowups, previewAutonomousTemplate,
  getFollowupSchedulerStatus,
} from '../../services/opsApi'

const PRESET_NICHES = [
  'Tech', 'Software', 'SaaS', 'Creator Economy', 'Gaming',
  'Beauty', 'Fitness', 'Finance', 'E-commerce', 'AI Tools'
]

const PLACEHOLDERS = [
  { tag: '{{display_name}}', label: 'Full Name' },
  { tag: '{{first_name}}', label: 'First Name' },
  { tag: '{{handle}}', label: '@Handle' },
  { tag: '{{niche}}', label: 'Primary Niche' },
  { tag: '{{platform}}', label: 'Platform' },
  { tag: '{{follower_count}}', label: 'Audience Size' },
  { tag: '{{product_name}}', label: 'Product Name' },
]

export default function AutonomousOutreach() {
  const [campaign, setCampaign] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [runningBatch, setRunningBatch] = useState(false)
  const [runningFollowups, setRunningFollowups] = useState(false)
  const [toast, setToast] = useState(null)
  const [previewData, setPreviewData] = useState(null)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [activeTab, setActiveTab] = useState('template') // 'template' | 'criteria' | 'followup'

  // Form states
  const [name, setName] = useState('')
  const [targetWeeklyLimit, setTargetWeeklyLimit] = useState(50)
  const [minFollowers, setMinFollowers] = useState(100000)
  const [maxFollowers, setMaxFollowers] = useState(1000000)
  const [minEngagementRate, setMinEngagementRate] = useState(2.0)
  const [niches, setNiches] = useState([])
  const [templateSubject, setTemplateSubject] = useState('')
  const [templateBody, setTemplateBody] = useState('')
  const [followupSubject, setFollowupSubject] = useState('')
  const [followupBody, setFollowupBody] = useState('')
  const [followupDelayDays, setFollowupDelayDays] = useState(7)
  const [status, setStatus] = useState('active')
  const [autoSend, setAutoSend] = useState(true)
  const [lastResult, setLastResult] = useState(null)
  const [schedulerStatus, setSchedulerStatus] = useState(null)

  const showToastMsg = (msg, type = 'info') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  const loadCampaign = async () => {
    setLoading(true)
    try {
      const data = await getAutonomousCampaigns()
      if (data && data.length > 0) {
        const c = data[0]
        setCampaign(c)
        setName(c.name || '100k-1M Creators Autonomous Batch')
        setTargetWeeklyLimit(c.target_weekly_limit || 50)
        setMinFollowers(c.min_followers || 100000)
        setMaxFollowers(c.max_followers || 1000000)
        setMinEngagementRate(c.min_engagement_rate ?? 2.0)
        setNiches(c.niches || ['Tech', 'Software', 'SaaS', 'Creator Economy', 'Gaming'])
        setTemplateSubject(c.template_subject || '')
        setTemplateBody(c.template_body || '')
        setFollowupSubject(c.followup_template_subject || '')
        setFollowupBody(c.followup_template_body || '')
        setFollowupDelayDays(c.followup_delay_days || 7)
        setStatus(c.status || 'active')
        setAutoSend(c.auto_send ?? true)
      }
    } catch (e) {
      showToastMsg(`Failed to load autonomous campaign: ${e.message}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCampaign()
    // Load scheduler status on mount
    getFollowupSchedulerStatus().then(setSchedulerStatus).catch(() => {})
  }, [])

  const handleSave = async () => {
    if (!campaign) return
    setSaving(true)
    try {
      const updated = await updateAutonomousCampaign(campaign.id, {
        name,
        target_weekly_limit: Number(targetWeeklyLimit),
        min_followers: Number(minFollowers),
        max_followers: Number(maxFollowers),
        min_engagement_rate: Number(minEngagementRate),
        niches,
        template_subject: templateSubject,
        template_body: templateBody,
        followup_template_subject: followupSubject,
        followup_template_body: followupBody,
        followup_delay_days: Number(followupDelayDays),
        status,
        auto_send: autoSend,
      })
      setCampaign(updated)
      showToastMsg('Autonomous campaign settings saved!', 'success')
    } catch (e) {
      showToastMsg(`Save failed: ${e.message}`, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleRunBatchNow = async () => {
    if (!campaign) return
    setRunningBatch(true)
    try {
      const res = await runAutonomousBatch(campaign.id)
      console.log('🚀 [AUTONOMOUS BATCH RUN RESULT]', res)
      if (res?.processed_creators?.length) {
        console.group('🔍 Processed Creators & Email Details')
        console.table(res.processed_creators)
        console.groupEnd()
      }
      setLastResult(res)
      showToastMsg(`Batch run completed: ${res.sent || 0} sent, ${res.queued || 0} queued`, 'success')
      loadCampaign()
    } catch (e) {
      console.error('❌ [AUTONOMOUS BATCH ERROR]', e)
      showToastMsg(`Batch run failed: ${e.message}`, 'error')
    } finally {
      setRunningBatch(false)
    }
  }

  const handleRunFollowupsNow = async () => {
    setRunningFollowups(true)
    try {
      const res = await runAutonomousFollowups(campaign?.id)
      setLastResult({ ...res, _type: 'followup' })
      const sent = res.sent ?? 0
      const processed = res.processed ?? 0
      const skipped = res.skipped_already_sent ?? 0
      showToastMsg(`Follow-up check done: ${sent} sent · ${processed} processed · ${skipped} already had follow-up`, 'success')
      // Refresh scheduler status
      getFollowupSchedulerStatus().then(setSchedulerStatus).catch(() => {})
      loadCampaign()
    } catch (e) {
      showToastMsg(`Follow-up run failed: ${e.message}`, 'error')
    } finally {
      setRunningFollowups(false)
    }
  }

  const handlePreview = async () => {
    try {
      const res = await previewAutonomousTemplate({
        template_subject: activeTab === 'followup' ? followupSubject : templateSubject,
        template_body: activeTab === 'followup' ? followupBody : templateBody,
      })
      setPreviewData(res)
      setShowPreviewModal(true)
    } catch (e) {
      showToastMsg(`Preview error: ${e.message}`, 'error')
    }
  }

  const toggleNiche = (tag) => {
    if (niches.includes(tag)) {
      setNiches(niches.filter(n => n !== tag))
    } else {
      setNiches([...niches, tag])
    }
  }

  const insertPlaceholder = (tag, targetField) => {
    if (targetField === 'subject') {
      setTemplateSubject(prev => prev + ' ' + tag)
    } else if (targetField === 'body') {
      setTemplateBody(prev => prev + ' ' + tag)
    } else if (targetField === 'fu_subject') {
      setFollowupSubject(prev => prev + ' ' + tag)
    } else if (targetField === 'fu_body') {
      setFollowupBody(prev => prev + ' ' + tag)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-white/50">
        <RefreshCw size={18} className="animate-spin mr-2" />
        Loading autonomous outreach campaign settings...
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl border shadow-xl flex items-center gap-2 text-xs font-semibold ${
            toast.type === 'error'
              ? 'bg-red-950/90 border-red-500/30 text-red-200'
              : toast.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-200'
              : 'bg-zinc-900/90 border-zinc-700 text-zinc-200'
          }`}
        >
          {toast.type === 'error' ? <AlertCircle size={14} /> : <Check size={14} />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Zap size={16} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                Autonomous Outreach Engine
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Weekly Batches
                </span>
              </h1>
              <p className="text-xs text-white/40 mt-0.5">
                Autonomous weekly creator outreach (100k-1M followers, high engagement) & automatic 7-day follow-up.
              </p>
            </div>
          </div>
        </div>

        {/* Top Control Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleRunBatchNow}
            disabled={runningBatch || status === 'paused'}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white transition-all shadow-lg shadow-purple-900/20 disabled:opacity-50"
          >
            {runningBatch ? <RefreshCw size={13} className="animate-spin" /> : <Play size={13} />}
            <span>{runningBatch ? 'Processing Batch…' : 'Run Batch Now'}</span>
          </button>

          <button
            onClick={handleRunFollowupsNow}
            disabled={runningFollowups}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-all disabled:opacity-50"
          >
            {runningFollowups ? <RefreshCw size={13} className="animate-spin" /> : <Clock size={13} />}
            <span>{runningFollowups ? 'Running Follow-ups…' : 'Run Follow-ups Now'}</span>
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all disabled:opacity-50"
          >
            {saving ? <RefreshCw size={13} className="animate-spin" /> : <Check size={13} />}
            <span>{saving ? 'Saving…' : 'Save Settings'}</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.07] flex flex-col justify-between">
          <div className="flex items-center justify-between text-white/50 text-xs">
            <span>Weekly Target Limit</span>
            <Users size={14} className="text-purple-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white">{targetWeeklyLimit}</span>
            <span className="text-xs text-white/40 ml-1.5">creators / week</span>
          </div>
          <p className="text-[10px] text-white/30 mt-2">Cap per execution cycle</p>
        </div>

        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.07] flex flex-col justify-between">
          <div className="flex items-center justify-between text-white/50 text-xs">
            <span>Audience Target</span>
            <Filter size={14} className="text-blue-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white">
              {(minFollowers / 1000).toFixed(0)}k - {(maxFollowers / 1000000).toFixed(1)}M
            </span>
          </div>
          <p className="text-[10px] text-white/30 mt-2">Min Engagement: ≥ {minEngagementRate}%</p>
        </div>

        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.07] flex flex-col justify-between">
          <div className="flex items-center justify-between text-white/50 text-xs">
            <span>Total Outreach Sent</span>
            <Mail size={14} className="text-emerald-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white">{campaign?.total_sent || 0}</span>
            <span className="text-xs text-emerald-400 ml-2 font-medium">Auto-dispatched</span>
          </div>
          <p className="text-[10px] text-white/30 mt-2">Mode: {autoSend ? 'Autonomous Auto-Send' : 'Review Queue'}</p>
        </div>

        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.07] flex flex-col justify-between">
          <div className="flex items-center justify-between text-white/50 text-xs">
            <span>Auto Follow-ups Sent</span>
            <Clock size={14} className="text-amber-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white">{campaign?.total_followups_sent || 0}</span>
            <span className="text-xs text-amber-400 ml-2 font-medium">
              {schedulerStatus?.mode === 'testing' ? `${schedulerStatus.delay_hours}h gap` : `${followupDelayDays}d gap`}
            </span>
          </div>
          <p className="text-[10px] text-white/30 mt-2">
            {schedulerStatus?.mode === 'testing' ? '🧪 Testing mode: 1h intervals' : 'Checks every hour · fires after delay'}
          </p>
        </div>
      </div>

      {/* ── Follow-up Scheduler Status Panel ─────────────────────────────────── */}
      {schedulerStatus && (
        <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Activity size={15} className="text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white flex items-center gap-2">
                Follow-up Scheduler
                <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border ${
                  schedulerStatus.mode === 'testing'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                }`}>
                  {schedulerStatus.mode}
                </span>
              </p>
              <p className="text-xs text-white/40 mt-0.5">
                Checks {schedulerStatus.next_check_approx} · fires after {schedulerStatus.followup_fires_after}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6 text-xs">
            <div className="text-center">
              <p className="text-white/40">Targets</p>
              <p className="text-white font-medium mt-0.5">No-reply + Not Interested</p>
            </div>
            <div className="text-center">
              <p className="text-white/40">Check Interval</p>
              <p className="text-amber-300 font-bold mt-0.5">{schedulerStatus.check_interval_hours}h</p>
            </div>
            <div className="text-center">
              <p className="text-white/40">Delay Before Fire</p>
              <p className="text-amber-300 font-bold mt-0.5">{schedulerStatus.delay_hours}h</p>
            </div>
            {schedulerStatus.mode === 'testing' && (
              <div className="text-[11px] text-amber-400/70 bg-amber-500/10 border border-amber-500/20 rounded-lg px-2.5 py-1.5 max-w-[180px]">
                Set <code className="font-mono">FOLLOWUP_DELAY_HOURS=168</code> to switch to 7-day production mode
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Configuration Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        <button
          onClick={() => setActiveTab('template')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'template'
              ? 'bg-white/10 text-white border border-white/15'
              : 'text-white/40 hover:text-white hover:bg-white/5'
          }`}
        >
          <FileText size={13} />
          <span>Outreach Email Template</span>
        </button>

        <button
          onClick={() => setActiveTab('followup')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'followup'
              ? 'bg-white/10 text-white border border-white/15'
              : 'text-white/40 hover:text-white hover:bg-white/5'
          }`}
        >
          <Clock size={13} />
          <span>7-Day Follow-Up Template</span>
        </button>

        <button
          onClick={() => setActiveTab('criteria')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'criteria'
              ? 'bg-white/10 text-white border border-white/15'
              : 'text-white/40 hover:text-white hover:bg-white/5'
          }`}
        >
          <Sliders size={13} />
          <span>Batch Criteria & Automation</span>
        </button>
      </div>

      {/* TAB 1: OUTREACH EMAIL TEMPLATE */}
      {activeTab === 'template' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.07] space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Initial Outreach Copy Template</h3>
                <p className="text-xs text-white/40">
                  Custom copy dispatched to target creators. Insert tags to dynamically personalize each email.
                </p>
              </div>

              <button
                onClick={handlePreview}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-500/10 text-purple-300 border border-purple-500/20 hover:bg-purple-500/20 transition-all"
              >
                <Eye size={13} />
                <span>Preview Template</span>
              </button>
            </div>

            {/* Dynamic Placeholder Buttons */}
            <div>
              <label className="block text-[11px] font-mono text-white/40 uppercase mb-2">
                Click to Insert Dynamic Placeholder Tag:
              </label>
              <div className="flex flex-wrap gap-2">
                {PLACEHOLDERS.map(p => (
                  <button
                    key={p.tag}
                    onClick={() => insertPlaceholder(p.tag, 'body')}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-purple-300 border border-white/10 text-xs font-mono transition-all flex items-center gap-1.5"
                  >
                    <span>{p.tag}</span>
                    <span className="text-[10px] text-white/30 font-sans">({p.label})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Subject Line */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-white/70">Subject Line</label>
              <input
                type="text"
                value={templateSubject}
                onChange={e => setTemplateSubject(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs font-mono focus:border-purple-500 focus:outline-none"
                placeholder="e.g. Co-founder partnership inquiry for {{display_name}}"
              />
            </div>

            {/* Email Body */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-white/70">Email Body Template</label>
              <textarea
                rows={9}
                value={templateBody}
                onChange={e => setTemplateBody(e.target.value)}
                className="w-full px-3.5 py-3 rounded-xl bg-black/50 border border-white/10 text-white text-xs font-mono leading-relaxed focus:border-purple-500 focus:outline-none"
                placeholder="Write template email copy with {{display_name}}, {{niche}}, etc."
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: 7-DAY FOLLOW-UP TEMPLATE */}
      {activeTab === 'followup' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.07] space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">7-Day Follow-Up Email Copy</h3>
                <p className="text-xs text-white/40">
                  Automatically dispatched {followupDelayDays} days after original outreach if no reply has been received.
                </p>
              </div>

              <button
                onClick={handlePreview}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20 hover:bg-amber-500/20 transition-all"
              >
                <Eye size={13} />
                <span>Preview Follow-Up</span>
              </button>
            </div>

            {/* Dynamic Placeholder Buttons */}
            <div>
              <label className="block text-[11px] font-mono text-white/40 uppercase mb-2">
                Click to Insert Placeholder:
              </label>
              <div className="flex flex-wrap gap-2">
                {PLACEHOLDERS.map(p => (
                  <button
                    key={p.tag}
                    onClick={() => insertPlaceholder(p.tag, 'fu_body')}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-amber-300 border border-white/10 text-xs font-mono transition-all flex items-center gap-1.5"
                  >
                    <span>{p.tag}</span>
                    <span className="text-[10px] text-white/30 font-sans">({p.label})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Delay gap config */}
            <div className="flex items-center gap-4 bg-white/5 p-3 rounded-xl border border-white/5">
              <Clock size={16} className="text-amber-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-medium text-white">Follow-Up Delay Interval</p>
                <p className="text-[11px] text-white/40">Default 7 days (1 week) after initial outreach</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={followupDelayDays}
                  onChange={e => setFollowupDelayDays(e.target.value)}
                  className="w-16 px-2.5 py-1 rounded-lg bg-black/60 border border-white/15 text-white text-center text-xs font-bold"
                />
                <span className="text-xs text-white/60">Days</span>
              </div>
            </div>

            {/* Follow-up Subject Line */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-white/70">Follow-Up Subject Line</label>
              <input
                type="text"
                value={followupSubject}
                onChange={e => setFollowupSubject(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs font-mono focus:border-amber-500 focus:outline-none"
              />
            </div>

            {/* Follow-up Body */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-white/70">Follow-Up Email Body</label>
              <textarea
                rows={8}
                value={followupBody}
                onChange={e => setFollowupBody(e.target.value)}
                className="w-full px-3.5 py-3 rounded-xl bg-black/50 border border-white/10 text-white text-xs font-mono leading-relaxed focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BATCH CRITERIA & AUTOMATION CONTROLS */}
      {activeTab === 'criteria' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Criteria Filters */}
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.07] space-y-5">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Filter size={15} className="text-purple-400" />
              <span>Target Audience Criteria</span>
            </h3>

            {/* Weekly limit */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-white/70">Weekly Outreach Quota Cap</span>
                <span className="text-purple-400 font-bold">{targetWeeklyLimit} creators/week</span>
              </div>
              <input
                type="range"
                min={5}
                max={250}
                step={5}
                value={targetWeeklyLimit}
                onChange={e => setTargetWeeklyLimit(e.target.value)}
                className="w-full accent-purple-500 bg-white/10"
              />
            </div>

            {/* Follower Range */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs text-white/70">Min Followers</label>
                <input
                  type="number"
                  step={10000}
                  value={minFollowers}
                  onChange={e => setMinFollowers(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs text-white/70">Max Followers</label>
                <input
                  type="number"
                  step={50000}
                  value={maxFollowers}
                  onChange={e => setMaxFollowers(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white text-xs font-mono"
                />
              </div>
            </div>

            {/* Engagement Rate */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-white/70">Minimum Engagement Rate</span>
                <span className="text-blue-400 font-bold">≥ {minEngagementRate}%</span>
              </div>
              <input
                type="range"
                min={0.5}
                max={10.0}
                step={0.5}
                value={minEngagementRate}
                onChange={e => setMinEngagementRate(e.target.value)}
                className="w-full accent-blue-500 bg-white/10"
              />
            </div>

            {/* Niche Categories */}
            <div className="space-y-2">
              <label className="block text-xs text-white/70">Target Niches</label>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_NICHES.map(n => {
                  const sel = niches.includes(n)
                  return (
                    <button
                      key={n}
                      onClick={() => toggleNiche(n)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                        sel
                          ? 'bg-purple-500/20 text-purple-200 border-purple-500/40'
                          : 'bg-white/5 text-white/40 border-white/10 hover:text-white/70'
                      }`}
                    >
                      {sel ? '✓ ' : '+ '}{n}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Engine Mode & Operations */}
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.07] space-y-5">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <ShieldCheck size={15} className="text-emerald-400" />
              <span>Automation & Dispatch Mode</span>
            </h3>

            {/* Campaign Active Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/5">
              <div>
                <p className="text-xs font-semibold text-white">Autonomous Engine Status</p>
                <p className="text-[11px] text-white/40">Enable or pause weekly batch schedule</p>
              </div>
              <button
                onClick={() => setStatus(status === 'active' ? 'paused' : 'active')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  status === 'active'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                }`}
              >
                {status}
              </button>
            </div>

            {/* Fully Autonomous Auto-send Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/5">
              <div>
                <p className="text-xs font-semibold text-white">Direct Auto-Send Mode</p>
                <p className="text-[11px] text-white/40">
                  {autoSend ? 'Emails automatically send without manual approval' : 'Drafts saved to Ops Review Queue first'}
                </p>
              </div>
              <button
                onClick={() => setAutoSend(!autoSend)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  autoSend
                    ? 'bg-purple-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                }`}
              >
                {autoSend ? 'AUTONOMOUS' : 'REVIEW QUEUE'}
              </button>
            </div>

            {/* Last Execution Run Summary */}
            {lastResult && (
              <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/20 text-xs space-y-1.5">
                <p className="font-semibold text-purple-300 flex items-center gap-1.5">
                  <Sparkles size={13} />
                  <span>{lastResult._type === 'followup' ? 'Last Follow-up Run Results' : 'Last Batch Run Results'}</span>
                </p>
                <div className="text-white/70 space-y-0.5 font-mono text-[11px]">
                  {lastResult._type === 'followup' ? (
                    <>
                      <p>Processed: {lastResult.processed ?? 0}</p>
                      <p>Sent: {lastResult.sent ?? 0}</p>
                      <p>Queued: {lastResult.queued ?? 0}</p>
                      <p>Already had follow-up: {lastResult.skipped_already_sent ?? 0}</p>
                    </>
                  ) : (
                    <>
                      <p>Eligible Processed: {lastResult.total_eligible ?? lastResult.processed ?? 0}</p>
                      <p>Sent: {lastResult.sent ?? 0}</p>
                      <p>Queued: {lastResult.queued ?? 0}</p>
                      {lastResult.skipped_no_email > 0 && (
                        <p className="text-amber-400">Skipped (no email): {lastResult.skipped_no_email}</p>
                      )}
                    </>
                  )}
                  {lastResult.errors?.length > 0 && (
                    <p className="text-red-400">Errors: {lastResult.errors.length}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Live Preview Modal */}
      {showPreviewModal && previewData && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Eye size={15} className="text-purple-400" />
                Live Email Template Preview
              </h3>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="text-white/50 hover:text-white text-xs font-semibold px-2 py-1 rounded"
              >
                Close ✕
              </button>
            </div>

            <div className="text-xs space-y-1 bg-black/40 p-3 rounded-xl border border-white/5 text-white/60 font-mono">
              <p><strong className="text-white/80">Sample Creator:</strong> {previewData.creator.display_name} (@{previewData.creator.handle})</p>
              <p><strong className="text-white/80">Audience:</strong> {previewData.creator.follower_count?.toLocaleString()} followers</p>
              <p><strong className="text-white/80">Niche:</strong> {previewData.creator.niche?.join(', ')}</p>
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-mono text-white/40 uppercase">Rendered Subject</label>
              <div className="p-3 rounded-xl bg-black/60 border border-white/10 text-white text-xs font-semibold font-mono">
                {previewData.rendered_subject}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-mono text-white/40 uppercase">Rendered Body</label>
              <div className="p-4 rounded-xl bg-black/60 border border-white/10 text-white/90 text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                {previewData.rendered_body}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
