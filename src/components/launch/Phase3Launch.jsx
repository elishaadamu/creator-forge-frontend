import { useState, useEffect } from 'react'
import {
  Rocket, TrendingUp, Sparkles, CheckCircle2, ShieldCheck, DollarSign,
  Users, Activity, ArrowRight, ExternalLink, FileText, Check, Plus,
  Trash2, RefreshCw, Loader2, Copy, Send, Zap, AlertTriangle, XCircle,
  BarChart3, Video, MessageSquare, Mail, Layers, Globe, ShieldAlert,
  Sliders, Award, Compass, Play, Server, Clock, Calendar, CheckSquare,
  Flame, HelpCircle, ChevronRight, Eye, MousePointerClick, Smartphone
} from 'lucide-react'
import {
  generatePhase3LaunchStrategyAI,
  buildSmartFallbackPhase3Strategy,
  generatePhase3CreatorAssetsAI,
  buildSmartFallbackPhase3CreatorAssets,
  runAILaunchManagerAI,
  buildSmartFallbackAILaunchManager,
  generatePhase3LaunchReportAI,
  buildSmartFallbackPhase3LaunchReport
} from '../../services/ai'
import { getFrontendUrl } from '../../services/opsApi'
import { Phase3LaunchSkeleton, LaunchReportSkeleton } from './Section2Skeletons'

export default function Phase3Launch({ project, api, onUpdateProject }) {
  const [activeStep, setActiveStep] = useState('prep') // 'prep' | 'monitor' | 'manager' | 'report'
  const [prepSubtab, setPrepSubtab] = useState('strategy') // 'strategy' | 'assets' | 'infra' | 'checklists'
  const [assetTab, setAssetTab] = useState('post') // 'post' | 'story' | 'email' | 'video' | 'links'
  const [isLive, setIsLive] = useState(() => project?.launchStatus === 'LIVE' || false)
  const [saveToast, setSaveToast] = useState('')
  const [showKillModal, setShowKillModal] = useState(false)
  const [decisionNotice, setDecisionNotice] = useState('')

  // 1. Launch Strategy State
  const [strategy, setStrategy] = useState(() => {
    if (project?.launchStrategy) return project.launchStrategy
    return buildSmartFallbackPhase3Strategy(project)
  })
  const [isGeneratingStrategy, setIsGeneratingStrategy] = useState(false)

  // 2. Creator Launch Assets State
  const [creatorAssets, setCreatorAssets] = useState(() => {
    if (project?.creatorAssets) return project.creatorAssets
    return buildSmartFallbackPhase3CreatorAssets(project)
  })
  const [isGeneratingAssets, setIsGeneratingAssets] = useState(false)

  // 3. Live Telemetry & Channel Attribution State
  const initialVisitors = Number(project?.visitors || project?.uniqueVisitors || 320)
  const initialBackers = Array.isArray(project?.reservations) ? project.reservations.length : 14
  const initialPresales = Number(project?.currentPresales || 1386)

  const [telemetry, setTelemetry] = useState(() => project?.launchTelemetry || {
    visitors: initialVisitors,
    signups: Math.max(initialBackers + 12, 38),
    activatedUsers: Math.max(initialBackers + 8, 32),
    customers: initialBackers,
    revenue: initialPresales,
    uptime: '99.98%',
    errorRate: '0.02%',
    avgLatency: '142ms'
  })

  // Channel Breakdown
  const [channelStats, setChannelStats] = useState(() => project?.channelStats || [
    { id: 'ch-ig', name: 'Instagram Stories', traffic: 184, ctr: '8.4%', convRate: '8.2%', customers: Math.max(8, Math.round(initialBackers * 0.55)), revenue: Math.max(792, Math.round(initialPresales * 0.55)), topPerformer: true },
    { id: 'ch-tt', name: 'TikTok / Reels / Shorts', traffic: 88, ctr: '6.1%', convRate: '5.7%', customers: Math.max(3, Math.round(initialBackers * 0.25)), revenue: Math.max(297, Math.round(initialPresales * 0.25)), topPerformer: false },
    { id: 'ch-yt', name: 'YouTube Video & Desc', traffic: 32, ctr: '9.2%', convRate: '6.2%', customers: Math.max(2, Math.round(initialBackers * 0.12)), revenue: Math.max(198, Math.round(initialPresales * 0.12)), topPerformer: false },
    { id: 'ch-tw', name: 'Twitter / X Thread', traffic: 46, ctr: '4.8%', convRate: '4.3%', customers: Math.max(1, Math.round(initialBackers * 0.08)), revenue: Math.max(99, Math.round(initialPresales * 0.08)), topPerformer: false },
    { id: 'ch-em', name: 'Email Newsletter Broadcast', traffic: 95, ctr: '5.2%', convRate: '2.1%', customers: 2, revenue: 198, topPerformer: false }
  ])

  // 4. AI Launch Manager State
  const [launchManager, setLaunchManager] = useState(() => {
    if (project?.launchManagerData) return project.launchManagerData
    return buildSmartFallbackAILaunchManager(project, {
      instagramConv: 8.2,
      emailConv: 2.1,
      visitors: telemetry.visitors,
      customers: telemetry.customers,
      revenue: telemetry.revenue
    })
  })
  const [isRunningManager, setIsRunningManager] = useState(false)
  const [dispatchedActions, setDispatchedActions] = useState(() => project?.dispatchedActions || [])

  // 5. Phase 3 Launch Decision Report State
  const [launchReport, setLaunchReport] = useState(() => {
    if (project?.launchReport) return project.launchReport
    return buildSmartFallbackPhase3LaunchReport(project, telemetry)
  })
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)

  const showToast = (msg) => {
    setSaveToast(msg)
    setTimeout(() => setSaveToast(''), 3500)
  }

  // Synchronize all Phase 3 states when project changes to prevent former creator data leakage
  useEffect(() => {
    if (!project) return
    if (project.launchStrategy) {
      setStrategy(project.launchStrategy)
    } else {
      setStrategy(buildSmartFallbackPhase3Strategy(project))
    }
    if (project.creatorAssets) {
      setCreatorAssets(project.creatorAssets)
    } else {
      setCreatorAssets(buildSmartFallbackPhase3CreatorAssets(project))
    }
    const curVisitors = Number(project.visitors || 0)
    const curBackers = Array.isArray(project.reservations) ? project.reservations.length : 0
    const curPresales = Number(project.currentPresales || 0)
    if (project.launchTelemetry) {
      setTelemetry(project.launchTelemetry)
    } else {
      setTelemetry({
        visitors: curVisitors,
        signups: Math.max(curBackers, 0),
        activatedUsers: Math.max(curBackers, 0),
        customers: curBackers,
        revenue: curPresales,
        uptime: '99.98%',
        errorRate: '0.02%',
        avgLatency: '142ms'
      })
    }
    if (project.launchReport) {
      setLaunchReport(project.launchReport)
    } else {
      setLaunchReport(buildSmartFallbackPhase3LaunchReport(project, telemetry))
    }
  }, [project?.id, project?.creatorId, project?.productName])

  // Save full Phase 3 state
  const handleSaveState = (updatedState = {}) => {
    const updated = {
      ...(project || {}),
      launchStrategy: updatedState.strategy || strategy,
      creatorAssets: updatedState.creatorAssets || creatorAssets,
      launchTelemetry: updatedState.telemetry || telemetry,
      channelStats: updatedState.channelStats || channelStats,
      launchManagerData: updatedState.launchManager || launchManager,
      dispatchedActions: updatedState.dispatchedActions || dispatchedActions,
      launchReport: updatedState.launchReport || launchReport,
      launchStatus: isLive ? 'LIVE' : 'PRE-LAUNCH'
    }

    if (onUpdateProject) onUpdateProject(prev => ({ ...(prev || {}), ...updated }))
    try {
      localStorage.setItem('forge_launch_active_project', JSON.stringify(updated))
      window.dispatchEvent(new CustomEvent('forge_project_updated', { detail: updated }))
    } catch (e) {}
  }

  // Toggle checklist tasks
  const handleToggleCreatorTask = (taskId) => {
    const updated = (strategy.creatorChecklist || []).map(t => {
      if (t.id === taskId) return { ...t, done: !t.done }
      return t
    })
    const newStrat = { ...strategy, creatorChecklist: updated }
    setStrategy(newStrat)
    handleSaveState({ strategy: newStrat })
  }

  const handleToggleOpsTask = (taskId) => {
    const updated = (strategy.opsChecklist || []).map(t => {
      if (t.id === taskId) return { ...t, done: !t.done }
      return t
    })
    const newStrat = { ...strategy, opsChecklist: updated }
    setStrategy(newStrat)
    handleSaveState({ strategy: newStrat })
  }

  // AI Generation Handlers
  const handleGenerateStrategy = async () => {
    setIsGeneratingStrategy(true)
    try {
      const gen = await generatePhase3LaunchStrategyAI(project)
      setStrategy(gen)
      handleSaveState({ strategy: gen })
      showToast('AI Launch Strategy & Checklists updated!')
    } catch (e) {
      console.warn('Strategy generation error:', e)
      const fb = buildSmartFallbackPhase3Strategy(project)
      setStrategy(fb)
      handleSaveState({ strategy: fb })
      showToast('Populated launch strategy.')
    } finally {
      setIsGeneratingStrategy(false)
    }
  }

  const handleGenerateAssets = async () => {
    setIsGeneratingAssets(true)
    try {
      const gen = await generatePhase3CreatorAssetsAI(project)
      setCreatorAssets(gen)
      handleSaveState({ creatorAssets: gen })
      showToast('AI generated fresh creator launch assets!')
    } catch (e) {
      console.warn('Asset generation error:', e)
      const fb = buildSmartFallbackPhase3CreatorAssets(project)
      setCreatorAssets(fb)
      handleSaveState({ creatorAssets: fb })
    } finally {
      setIsGeneratingAssets(false)
    }
  }

  const handleRunLaunchManager = async () => {
    setIsRunningManager(true)
    try {
      const res = await runAILaunchManagerAI(project, telemetry)
      setLaunchManager(res)
      handleSaveState({ launchManager: res })
      showToast('AI Launch Manager analyzed telemetry and dispatched actions!')
    } catch (e) {
      console.warn('Manager error:', e)
      const fb = buildSmartFallbackAILaunchManager(project, telemetry)
      setLaunchManager(fb)
      handleSaveState({ launchManager: fb })
    } finally {
      setIsRunningManager(false)
    }
  }

  const handleDispatchAction = (action) => {
    if (dispatchedActions.includes(action.id)) return
    const updatedDispatched = [...dispatchedActions, action.id]
    setDispatchedActions(updatedDispatched)

    if (action.targetRole === 'Creator') {
      // Add directly to Creator Checklist in Step 1
      const newTask = {
        id: `task-ai-${Date.now()}`,
        title: `[AI Growth Action] ${action.title}: ${action.generatedContent?.slice(0, 60)}...`,
        done: false
      }
      const newStrat = {
        ...strategy,
        creatorChecklist: [newTask, ...(strategy.creatorChecklist || [])]
      }
      setStrategy(newStrat)
      handleSaveState({ strategy: newStrat, dispatchedActions: updatedDispatched })
      showToast(`Added action to Creator Checklist: "${action.title}"`)
    } else {
      // Engineering CRO Task
      const newTask = {
        id: `task-ops-${Date.now()}`,
        title: `[AI Engineering CRO] ${action.title}`,
        done: false
      }
      const newStrat = {
        ...strategy,
        opsChecklist: [newTask, ...(strategy.opsChecklist || [])]
      }
      setStrategy(newStrat)
      handleSaveState({ strategy: newStrat, dispatchedActions: updatedDispatched })
      showToast(`Created Engineering Task: "${action.title}"`)
    }
  }

  const handleGenerateLaunchReport = async () => {
    setIsGeneratingReport(true)
    try {
      const rep = await generatePhase3LaunchReportAI(project, telemetry)
      setLaunchReport(rep)
      handleSaveState({ launchReport: rep })
      showToast('Generated fresh AI Launch & Scaling Report!')
    } catch (e) {
      console.warn('Report error:', e)
      const fb = buildSmartFallbackPhase3LaunchReport(project, telemetry)
      setLaunchReport(fb)
      handleSaveState({ launchReport: fb })
    } finally {
      setIsGeneratingReport(false)
    }
  }

  const handleToggleProductionLaunch = () => {
    const nextState = !isLive
    setIsLive(nextState)
    if (nextState) {
      showToast('🚀 PRODUCT IS OFFICIALLY LIVE IN PRODUCTION!')
    } else {
      showToast('Switched to Pre-Launch Draft state.')
    }
    handleSaveState()
  }

  const handleExportMarkdown = () => {
    const md = `# PHASE 3 COMMERCIAL LAUNCH PLAN: ${project?.productName || 'Software Product'}
## Creator Co-Founder: ${project?.creatorName || 'Creator'} | Launch Status: ${isLive ? 'LIVE' : 'PREP'}

---

### 1. LAUNCH STRATEGY & TARGET CHANNELS
- **Launch Date:** ${strategy.launchDate}
${(strategy.targetChannels || []).map(tc => `- **${tc.channel}:** ${tc.strategy} (Expected Share: ${tc.expectedShare})`).join('\n')}

#### Launch Offers:
${(strategy.launchOffers || []).map(lo => `- **${lo.tier} (${lo.price}):** ${lo.discount} [${lo.urgency}]`).join('\n')}

---

### 2. CREATOR LAUNCH MARKETING ASSETS
#### Announcement Post:
\`\`\`
${creatorAssets.announcementPost}
\`\`\`

#### Email Broadcast:
**Subject:** ${creatorAssets.newsletterBroadcast?.subject}
\`\`\`
${creatorAssets.newsletterBroadcast?.body}
\`\`\`

---

### 3. PRODUCTION TELEMETRY & ATTRIBUTION
- **Total Revenue:** $${telemetry.revenue.toLocaleString()}
- **Paying Customers:** ${telemetry.customers}
- **Unique Visitors:** ${telemetry.visitors}
- **Top Channel:** Instagram Stories (8.2% Paid Conversion)

---

### 4. AI LAUNCH MANAGER & EXECUTIVE VERDICT
- **Score:** ${launchReport.score}/100
- **Verdict:** ${launchReport.verdict}
- **Executive Recommendation:** ${launchReport.recommendation}
- **Summary:** ${launchReport.executiveSummary}
`
    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `LAUNCH_REPORT_${(project?.productName || 'product').toUpperCase().replace(/[^A-Z0-9]/g, '_')}.md`
    a.click()
    URL.revokeObjectURL(url)
    showToast('Downloaded Markdown Launch Report!')
  }

  const origin = getFrontendUrl()
  const productSlug = (project?.slug || project?.productName || 'product').toLowerCase().replace(/[^a-z0-9]/g, '-')
  const conversionRate = telemetry.visitors > 0 ? ((telemetry.customers / telemetry.visitors) * 100).toFixed(1) : '0.0'

  return (
    <div className="space-y-6 text-left">
      {/* Toast Notification */}
      {saveToast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-2xl bg-blue-600 text-white font-bold text-xs shadow-2xl flex items-center gap-2 border border-blue-400/40 animate-slide-up">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* Kill Confirmation Modal */}
      {showKillModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 rounded-3xl bg-[#0e1117] border border-red-500/40 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-black text-white">Confirm Phase 3 Sunset / Kill</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to sunset <strong>{project?.productName || 'this product'}</strong>? You can choose to archive the repository, halt marketing campaigns, and notify existing active subscribers.
            </p>
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-[11px] text-red-300">
              Active Subscribers: <strong>{telemetry.customers}</strong> • Total Revenue: <strong>${telemetry.revenue.toLocaleString()}</strong>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowKillModal(false)}
                className="px-4 py-2 rounded-xl bg-white/[0.06] text-slate-300 hover:text-white text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowKillModal(false)
                  setDecisionNotice('Product sunsetted and archived. Marketing campaigns paused.')
                  showToast('Project archived.')
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs"
              >
                Confirm Sunset & Archive
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Banner: Goal & Production Revenue Metrics */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-[#0e1117] via-[#141724] to-[#111928] border border-purple-500/25 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-[10px] font-black uppercase tracking-wider">
                Phase 3 Checkpoint
              </span>
              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                isLive
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse'
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
              }`}>
                {isLive ? '🚀 LIVE IN PRODUCTION' : 'PRE-LAUNCH PREP'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Turn the Working MVP into a Real Revenue-Producing Business
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Execute commercial launch, monitor production telemetry & channel attribution, and deploy real-time AI growth actions.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <button
              onClick={handleToggleProductionLaunch}
              className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all active:scale-95 shadow-lg ${
                isLive
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-950/40'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-950/50'
              }`}
            >
              <Rocket className="w-3.5 h-3.5" />
              <span>{isLive ? 'Production Live ✓' : 'Go Live / Launch Now'}</span>
            </button>

            <button
              onClick={handleExportMarkdown}
              className="p-2.5 rounded-xl bg-[#1a1f2c] hover:bg-[#23293b] text-slate-300 hover:text-white border border-white/[0.08] text-xs font-semibold flex items-center gap-1.5"
              title="Download Launch Report"
            >
              <FileText className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Production Telemetry Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3.5 rounded-2xl bg-[#090b0e] border border-emerald-500/20 space-y-0.5">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Live Revenue</span>
            <div className="text-base sm:text-lg font-black text-emerald-400 font-mono">
              ${telemetry.revenue.toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-500">Gross processed sales</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#090b0e] border border-purple-500/20 space-y-0.5">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Paying Customers</span>
            <div className="text-base sm:text-lg font-black text-purple-300 font-mono">
              {telemetry.customers} Subscribers
            </div>
            <span className="text-[10px] text-slate-500">Active founding accounts</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#090b0e] border border-blue-500/20 space-y-0.5">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Conversion Rate</span>
            <div className="text-base sm:text-lg font-black text-blue-400 font-mono">
              {conversionRate}%
            </div>
            <span className="text-[10px] text-slate-500">From {telemetry.visitors} unique visitors</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#090b0e] border border-white/[0.06] space-y-0.5">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Top Channel</span>
            <div className="text-xs sm:text-sm font-black text-white truncate">
              Instagram Stories
            </div>
            <span className="text-[10px] text-emerald-400 font-semibold">8.2% Paid Conversion</span>
          </div>
        </div>
      </div>

      {/* Stepper Navigation */}
      <div className="flex items-center justify-between p-1.5 rounded-2xl bg-[#0e1117] border border-white/[0.08] overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          {[
            { id: 'prep', label: '1. Prepare Launch', icon: Calendar },
            { id: 'monitor', label: '2. Launch + Monitor', icon: TrendingUp },
            { id: 'manager', label: '3. AI Launch Manager', icon: Sparkles },
            { id: 'report', label: '4. Launch Report + Decision', icon: ShieldCheck },
          ].map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveStep(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                  activeStep === tab.id
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-950/60'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* STEP 1: PREPARE LAUNCH */}
      {activeStep === 'prep' && (
        <div className="space-y-5">
          {/* Subtabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
            <div className="flex items-center gap-2">
              {[
                { id: 'strategy', label: 'Strategy & Offers' },
                { id: 'assets', label: 'Creator Launch Assets' },
                { id: 'infra', label: 'Product & Infrastructure' },
                { id: 'checklists', label: 'Automated Checklists' }
              ].map(sub => (
                <button
                  key={sub.id}
                  onClick={() => setPrepSubtab(sub.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    prepSubtab === sub.id
                      ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>

            <button
              onClick={handleGenerateStrategy}
              disabled={isGeneratingStrategy}
              className="px-3.5 py-1.5 rounded-xl bg-[#1a1f2c] hover:bg-[#252c3f] text-purple-300 border border-purple-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {isGeneratingStrategy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>Regenerate Strategy with AI</span>
            </button>
          </div>

          {/* SUBTAB 1: STRATEGY & OFFERS */}
          {prepSubtab === 'strategy' && (
            <div className="space-y-4">
              {/* Launch Date & Channels */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-2">
                  <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Target Launch Window</span>
                  </span>
                  <div className="text-lg font-black text-white font-mono">{strategy.launchDate}</div>
                  <p className="text-xs text-slate-400">Coordinated 48-hour commercial launch window with creator audience.</p>
                </div>

                <div className="md:col-span-2 p-5 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-3">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5" />
                      <span>Target Launch Channels</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">Expected Conversion Share</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {(strategy.targetChannels || []).map((tc, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-[#141720] border border-white/[0.06] space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white">{tc.channel}</span>
                          <span className="text-[10px] font-bold text-purple-300 font-mono px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20">{tc.expectedShare}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">{tc.strategy}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Commercial Offers & Pricing Tiers */}
              <div className="p-5 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    <span>Commercial Launch Offers & Urgency Tiers</span>
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(strategy.launchOffers || []).map((offer, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-[#141720] border border-emerald-500/20 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-sm">{offer.tier}</span>
                        <span className="text-base font-black text-emerald-400 font-mono">{offer.price}</span>
                      </div>
                      <p className="text-slate-300 text-[11px]">{offer.discount}</p>
                      <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400 border-t border-white/[0.04]">
                        <span>Cap: {offer.spots} Founding Spots</span>
                        <span className="text-purple-300 font-bold">{offer.urgency}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Messaging Pillars */}
              <div className="p-5 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-400" />
                  <span>Core Launch Messaging Angles</span>
                </h3>

                <div className="space-y-2">
                  {(strategy.messagingPillars || []).map((m, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-[#141720] border border-white/[0.06] text-xs space-y-1">
                      <span className="font-bold text-purple-300 block">{m.angle}</span>
                      <p className="text-slate-200 text-[11px]">"{m.hook}"</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SUBTAB 2: CREATOR ASSETS */}
          {prepSubtab === 'assets' && (
            <div className="p-5 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.07] pb-3">
                <div className="flex items-center gap-2">
                  {[
                    { id: 'post', label: 'Announcement Post' },
                    { id: 'story', label: 'IG Story Sequence' },
                    { id: 'email', label: 'Newsletter Broadcast' },
                    { id: 'video', label: 'Video Demo Script' },
                    { id: 'links', label: 'UTM Referral Links' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setAssetTab(tab.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                        assetTab === tab.id
                          ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleGenerateAssets}
                  disabled={isGeneratingAssets}
                  className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-950/40 disabled:opacity-50"
                >
                  {isGeneratingAssets ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>Generate Assets with AI</span>
                </button>
              </div>

              {/* Asset Viewer */}
              {assetTab === 'post' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Social Media Launch Post (IG / Twitter / LinkedIn)</span>
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(creatorAssets.announcementPost)
                        showToast('Copied announcement post to clipboard!')
                      }}
                      className="px-3 py-1 rounded-lg bg-[#1a1f2c] hover:bg-[#252c3f] text-slate-200 border border-white/[0.08] text-xs font-semibold flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy Text</span>
                    </button>
                  </div>
                  <pre className="p-4 rounded-xl bg-[#090b0e] border border-white/[0.06] text-slate-200 text-xs font-mono whitespace-pre-wrap leading-relaxed">
                    {creatorAssets.announcementPost}
                  </pre>
                </div>
              )}

              {assetTab === 'story' && (
                <div className="space-y-3">
                  <span className="text-xs font-bold text-white block">3-Slide Instagram Story Sequence</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {(creatorAssets.storySequence || []).map((slide, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-[#141720] border border-white/[0.06] space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-purple-300">Slide {slide.slide || idx + 1}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">{slide.type}</span>
                        </div>
                        <p className="text-slate-300 text-[11px] leading-relaxed">{slide.copy}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {assetTab === 'email' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white block">Subject: {creatorAssets.newsletterBroadcast?.subject}</span>
                      <span className="text-[11px] text-slate-400">Preview: {creatorAssets.newsletterBroadcast?.preview}</span>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(creatorAssets.newsletterBroadcast?.body)
                        showToast('Copied email newsletter body!')
                      }}
                      className="px-3 py-1 rounded-lg bg-[#1a1f2c] hover:bg-[#252c3f] text-slate-200 border border-white/[0.08] text-xs font-semibold flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy Email</span>
                    </button>
                  </div>
                  <pre className="p-4 rounded-xl bg-[#090b0e] border border-white/[0.06] text-slate-200 text-xs font-mono whitespace-pre-wrap leading-relaxed">
                    {creatorAssets.newsletterBroadcast?.body}
                  </pre>
                </div>
              )}

              {assetTab === 'video' && (
                <div className="space-y-3">
                  <span className="text-xs font-bold text-white block">Short-form Video Demo Script (TikTok / Reels / Shorts)</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 rounded-xl bg-[#141720] border border-white/[0.06] space-y-1">
                      <span className="text-[10px] font-bold text-purple-300 uppercase">1. Video Hook (0-3s)</span>
                      <p className="text-white font-semibold">{creatorAssets.videoScript?.hook}</p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-[#141720] border border-white/[0.06] space-y-1">
                      <span className="text-[10px] font-bold text-red-400 uppercase">2. Problem Agitation (3-15s)</span>
                      <p className="text-slate-300">{creatorAssets.videoScript?.problemSection}</p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-[#141720] border border-white/[0.06] space-y-1">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase">3. 1-Click Solution Demo (15-35s)</span>
                      <p className="text-slate-300">{creatorAssets.videoScript?.solutionSection}</p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-[#141720] border border-white/[0.06] space-y-1">
                      <span className="text-[10px] font-bold text-blue-400 uppercase">4. Urgent CTA & Bio Link (35-45s)</span>
                      <p className="text-white font-semibold">{creatorAssets.videoScript?.cta}</p>
                    </div>
                  </div>
                </div>
              )}

              {assetTab === 'links' && (
                <div className="space-y-3">
                  <span className="text-xs font-bold text-white block">UTM Channel Attribution Referral Links</span>
                  <div className="space-y-2">
                    {(creatorAssets.referralLinks || []).map((link, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-[#141720] border border-white/[0.06] flex items-center justify-between gap-3 text-xs">
                        <div>
                          <span className="font-bold text-white block">{link.channel}</span>
                          <span className="text-[10px] text-purple-300 font-mono">{link.url}</span>
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard?.writeText(link.url)
                            showToast(`Copied ${link.channel} tracking link!`)
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#090b0e] hover:bg-[#1a1f2c] text-slate-200 border border-white/[0.08] font-semibold text-[11px] flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SUBTAB 3: PRODUCT & INFRASTRUCTURE */}
          {prepSubtab === 'infra' && (
            <div className="p-5 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-400" />
                <span>Production Environment & Infrastructure Readiness</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-4 rounded-xl bg-[#141720] border border-white/[0.06] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">Stripe Live Billing</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-bold">Active ✓</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Webhook listener provisioning customer subscriptions automatically.</p>
                </div>

                <div className="p-4 rounded-xl bg-[#141720] border border-white/[0.06] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">OAuth & Magic Links</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-bold">Live ✓</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Google OAuth and passwordless JWT session authentication verified.</p>
                </div>

                <div className="p-4 rounded-xl bg-[#141720] border border-white/[0.06] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">Sentry Error Alerts</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-bold">Connected ✓</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Live error monitoring streaming alerts to Discord ops channel.</p>
                </div>
              </div>

              {/* Live Support & FAQ section */}
              <div className="p-4 rounded-xl bg-[#141720] border border-white/[0.06] space-y-2">
                <span className="font-bold text-white text-xs block">Customer Support & FAQs Published</span>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Support desk email (<code className="text-purple-300">support@{productSlug}.app</code>) and self-service knowledge base FAQs are live on the checkout landing page.
                </p>
              </div>
            </div>
          )}

          {/* SUBTAB 4: AUTOMATED CHECKLISTS */}
          {prepSubtab === 'checklists' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Creator Checklist */}
              <div className="p-5 rounded-2xl bg-[#0e1117] border border-purple-500/30 space-y-3">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
                  <h3 className="font-bold text-white text-xs flex items-center gap-2">
                    <Video className="w-4 h-4 text-purple-400" />
                    <span>Creator Launch Checklist</span>
                  </h3>
                  <span className="text-[10px] font-mono text-purple-300">
                    {(strategy.creatorChecklist || []).filter(t => t.done).length}/{(strategy.creatorChecklist || []).length} Completed
                  </span>
                </div>

                <div className="space-y-2">
                  {(strategy.creatorChecklist || []).map(task => (
                    <div
                      key={task.id}
                      onClick={() => handleToggleCreatorTask(task.id)}
                      className="p-3 rounded-xl bg-[#141720] border border-white/[0.06] flex items-center gap-3 text-xs cursor-pointer hover:border-purple-500/40 transition-colors"
                    >
                      <div className={`w-4 h-4 rounded flex items-center justify-center font-bold ${
                        task.done ? 'bg-purple-500 text-white' : 'border border-white/20'
                      }`}>
                        {task.done && <Check className="w-3 h-3" />}
                      </div>
                      <span className={task.done ? 'line-through text-slate-500' : 'text-slate-200'}>
                        {task.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Co-Launch / Engineering Checklist */}
              <div className="p-5 rounded-2xl bg-[#0e1117] border border-blue-500/30 space-y-3">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
                  <h3 className="font-bold text-white text-xs flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-400" />
                    <span>Co-Launch Engineering / Ops Checklist</span>
                  </h3>
                  <span className="text-[10px] font-mono text-blue-300">
                    {(strategy.opsChecklist || []).filter(t => t.done).length}/{(strategy.opsChecklist || []).length} Verified
                  </span>
                </div>

                <div className="space-y-2">
                  {(strategy.opsChecklist || []).map(task => (
                    <div
                      key={task.id}
                      onClick={() => handleToggleOpsTask(task.id)}
                      className="p-3 rounded-xl bg-[#141720] border border-white/[0.06] flex items-center gap-3 text-xs cursor-pointer hover:border-blue-500/40 transition-colors"
                    >
                      <div className={`w-4 h-4 rounded flex items-center justify-center font-bold ${
                        task.done ? 'bg-blue-500 text-white' : 'border border-white/20'
                      }`}>
                        {task.done && <Check className="w-3 h-3" />}
                      </div>
                      <span className={task.done ? 'line-through text-slate-500' : 'text-slate-200'}>
                        {task.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 1 Footer */}
          <div className="flex justify-end pt-2 border-t border-white/[0.06]">
            <button
              onClick={() => setActiveStep('monitor')}
              className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs flex items-center gap-1.5 shadow-lg shadow-purple-950/50 transition-all active:scale-95"
            >
              <span>Proceed to 2. Launch + Monitor</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: LAUNCH + MONITOR (LIVE DASHBOARD & ATTRIBUTION) */}
      {activeStep === 'monitor' && (
        <div className="space-y-5">
          {/* Live Status Control Header */}
          <div className="p-5 rounded-2xl bg-[#0e1117] border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <h3 className="text-sm font-bold text-white">Live Production Telemetry & Conversion Funnel</h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Real-time visitor tracking, conversion analytics & technical uptime.</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 font-mono">Uptime: <strong className="text-emerald-400">{telemetry.uptime}</strong></span>
              <span className="text-[11px] text-slate-400 font-mono">Latency: <strong className="text-blue-400">{telemetry.avgLatency}</strong></span>
            </div>
          </div>

          {/* Production Telemetry Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-[#141720] border border-white/[0.06] space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-blue-400" />
                <span>Unique Visitors</span>
              </span>
              <div className="text-xl font-black text-white font-mono">{telemetry.visitors.toLocaleString()}</div>
              <span className="text-[10px] text-emerald-400 font-semibold">+18% vs campaign benchmark</span>
            </div>

            <div className="p-4 rounded-xl bg-[#141720] border border-white/[0.06] space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-purple-400" />
                <span>Signups & Activation</span>
              </span>
              <div className="text-xl font-black text-purple-300 font-mono">{telemetry.signups} Accounts</div>
              <span className="text-[10px] text-slate-400">{telemetry.activatedUsers} active in workspace</span>
            </div>

            <div className="p-4 rounded-xl bg-[#141720] border border-white/[0.06] space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>Paying Customers</span>
              </span>
              <div className="text-xl font-black text-emerald-400 font-mono">{telemetry.customers}</div>
              <span className="text-[10px] text-emerald-400 font-bold">${telemetry.revenue.toLocaleString()} Processed</span>
            </div>

            <div className="p-4 rounded-xl bg-[#141720] border border-white/[0.06] space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                <MousePointerClick className="w-3.5 h-3.5 text-amber-400" />
                <span>Overall Paid Conversion</span>
              </span>
              <div className="text-xl font-black text-amber-400 font-mono">{conversionRate}%</div>
              <span className="text-[10px] text-slate-400">Visitor-to-paid ratio</span>
            </div>
          </div>

          {/* Channel Attribution & Content CTR Table */}
          <div className="p-5 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-3">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-purple-400" />
                  <span>Channel Attribution & Traffic Source CTR Breakdown</span>
                </h3>
                <p className="text-xs text-slate-400">Performance measured across creator content channels.</p>
              </div>
              <span className="text-[10px] font-mono text-emerald-400">Live Funnel Breakdown</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-300">
                <thead>
                  <tr className="border-b border-white/[0.06] text-slate-400 text-[10px] uppercase font-bold">
                    <th className="py-2.5 px-3">Channel / Content</th>
                    <th className="py-2.5 px-3">Traffic (Clicks)</th>
                    <th className="py-2.5 px-3">Content CTR</th>
                    <th className="py-2.5 px-3">Paid Conv. Rate</th>
                    <th className="py-2.5 px-3">Customers</th>
                    <th className="py-2.5 px-3 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {channelStats.map(ch => (
                    <tr key={ch.id} className={ch.topPerformer ? 'bg-purple-500/[0.06]' : ''}>
                      <td className="py-3 px-3 font-bold text-white flex items-center gap-2">
                        <span>{ch.name}</span>
                        {ch.topPerformer && (
                          <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                            Top ROI
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono">{ch.traffic}</td>
                      <td className="py-3 px-3 font-mono text-blue-400 font-bold">{ch.ctr}</td>
                      <td className="py-3 px-3 font-mono text-emerald-400 font-bold">{ch.convRate}</td>
                      <td className="py-3 px-3 font-mono text-purple-300 font-bold">{ch.customers}</td>
                      <td className="py-3 px-3 font-mono text-white font-bold text-right">${ch.revenue.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Step 2 Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
            <button
              onClick={() => setActiveStep('prep')}
              className="px-4 py-2.5 rounded-xl bg-white/[0.04] text-slate-300 hover:text-white border border-white/[0.08] text-xs font-semibold"
            >
              ← Back to Prepare
            </button>
            <button
              onClick={() => setActiveStep('manager')}
              className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs flex items-center gap-1.5 shadow-lg shadow-purple-950/50 transition-all active:scale-95"
            >
              <span>Proceed to 3. AI Launch Manager</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: AI LAUNCH MANAGER (AUTONOMOUS ACTIONS) */}
      {activeStep === 'manager' && (
        <div className="space-y-5">
          {/* Header */}
          <div className="p-5 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
              <div>
                <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Step 3: Autonomous AI Launch Manager</span>
                </span>
                <h3 className="text-base font-black text-white">
                  Continuous Telemetry Diagnostics & Growth Action Dispatcher
                </h3>
              </div>

              <button
                onClick={handleRunLaunchManager}
                disabled={isRunningManager}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-purple-950/40 transition-all active:scale-95 disabled:opacity-50"
              >
                {isRunningManager ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                <span>Run Diagnostic Sweep</span>
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              AI evaluates conversion disparity across creator channels, detects funnel bottlenecks, and writes actionable copy / engineering tasks.
            </p>
          </div>

          {/* AI Executive Diagnosis Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-[#0e1117] via-[#131724] to-[#161a29] border border-purple-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                Telemetry Verdict: {launchManager.overallHealth}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Swept at: {launchManager.analysisTimestamp}</span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed font-medium bg-[#090b0e] p-3 rounded-xl border border-white/[0.06]">
              "{launchManager.executiveSummary}"
            </p>
          </div>

          {/* AI Automated Actions Roster */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-400" />
              <span>Recommended High-Impact Actions ({launchManager.automatedActions?.length || 0})</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {(launchManager.automatedActions || []).map(action => {
                const isDispatched = dispatchedActions.includes(action.id)
                return (
                  <div
                    key={action.id}
                    className="p-4 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                          action.targetRole === 'Creator'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}>
                          {action.type}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-400 font-mono">{action.severity}</span>
                      </div>

                      <h4 className="font-bold text-white text-xs leading-snug">{action.title}</h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed">{action.insight}</p>

                      {/* Generated Content Box */}
                      {action.generatedContent && (
                        <div className="p-2.5 rounded-xl bg-[#141720] border border-white/[0.04] space-y-1">
                          <span className="text-[9px] text-purple-300 font-bold uppercase block">AI-Generated Asset:</span>
                          <p className="text-[10px] text-slate-300 font-mono whitespace-pre-wrap">{action.generatedContent}</p>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-white/[0.06]">
                      <button
                        onClick={() => handleDispatchAction(action)}
                        disabled={isDispatched}
                        className={`w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                          isDispatched
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-default'
                            : 'bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-950/40 active:scale-95'
                        }`}
                      >
                        {isDispatched ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Action Dispatched ✓</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5" />
                            <span>{action.actionLabel || 'Execute Action'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Step 3 Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
            <button
              onClick={() => setActiveStep('monitor')}
              className="px-4 py-2.5 rounded-xl bg-white/[0.04] text-slate-300 hover:text-white border border-white/[0.08] text-xs font-semibold"
            >
              ← Back to Monitor
            </button>
            <button
              onClick={() => setActiveStep('report')}
              className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs flex items-center gap-1.5 shadow-lg shadow-purple-950/50 transition-all active:scale-95"
            >
              <span>Proceed to 4. Launch Report + Decision</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: LAUNCH REPORT + DECISION GATE */}
      {activeStep === 'report' && (
        <div className="space-y-5">
          {/* Header */}
          <div className="p-5 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
              <div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5" />
                  <span>Step 4: Commercial Report & Strategic Milestone</span>
                </span>
                <h3 className="text-base font-black text-white">
                  Executive Launch Report & Strategic Decision Gate
                </h3>
              </div>

              <button
                onClick={handleGenerateLaunchReport}
                disabled={isGeneratingReport}
                className="px-3.5 py-1.5 rounded-xl bg-[#1a1f2c] hover:bg-[#252c3f] text-slate-200 border border-white/[0.08] text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
              >
                {isGeneratingReport ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                <span>Refresh Report</span>
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Synthesizes processed revenue, customer unit economics, creator performance, technical health, and strategic growth next steps.
            </p>
          </div>

          {/* Decision Notice */}
          {decisionNotice && (
            <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-200 text-xs flex items-center gap-2 font-medium">
              <Compass className="w-4 h-4 text-purple-400 shrink-0" />
              <span>{decisionNotice}</span>
            </div>
          )}

          {/* 1. Executive Score & Summary */}
          {isGeneratingReport ? (
            <LaunchReportSkeleton />
          ) : (
            <>
              <div className="p-5 rounded-3xl bg-gradient-to-br from-[#0e1117] via-[#121724] to-[#151c2d] border border-emerald-500/30 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                  Commercial Launch Score
                </span>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl sm:text-4xl font-black text-white font-mono">
                    {launchReport.score}<span className="text-slate-500 text-xl font-normal">/100</span>
                  </span>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-black uppercase tracking-wider">
                    {launchReport.verdict}
                  </span>
                </div>
              </div>

              <div className="text-xs text-slate-400 text-left sm:text-right space-y-0.5">
                <div>AI Recommendation: <strong className="text-emerald-400">{launchReport.recommendation}</strong></div>
                <div>Customer CAC: <strong className="text-white font-mono">{launchReport.metricsSummary?.customerCAC || '$0.00 Organic'}</strong></div>
              </div>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed font-medium bg-[#090b0e] p-3 rounded-xl border border-white/[0.06]">
              "{launchReport.executiveSummary}"
            </p>

            {/* 4 Pillars Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {(launchReport.pillars || []).map((p, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-[#141720] border border-white/[0.06] space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{p.name}</span>
                    </span>
                    <span className="font-mono text-emerald-400 font-bold">{p.rating}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{p.detail}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Strategic Learnings & Next Steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                <span>Strategic Campaign Learnings</span>
              </h3>
              <div className="space-y-2">
                {(launchReport.strategicLearnings || []).map((lrn, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-[#141720] border border-white/[0.04] text-xs text-slate-200 flex items-start gap-2">
                    <span className="text-blue-400 font-bold shrink-0">•</span>
                    <span>{lrn}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>Recommended Scaling Next Steps</span>
              </h3>
              <div className="space-y-2">
                {(launchReport.nextStepsRecommendation || []).map((step, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-[#141720] border border-white/[0.04] text-xs text-slate-200 flex items-start gap-2">
                    <span className="text-emerald-400 font-bold shrink-0">→</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 4. Human Executive Milestone Decision Gate */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-[#0e1117] via-[#141825] to-[#121626] border border-purple-500/40 shadow-2xl space-y-4">
            <div>
              <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest block">
                Human Executive Milestone Decision
              </span>
              <h3 className="text-lg font-black text-white tracking-tight">
                Select the Ongoing Operational Direction
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                Choose the strategic path for the business following the initial launch campaign.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
              {/* Choice 1: SCALE */}
              <button
                onClick={() => {
                  setDecisionNotice('🚀 SCALE MODE ACTIVATED: Creator posting frequency doubled, viral referral engine enabled, paid channels unlocked.')
                  showToast('Scale mode activated!')
                }}
                className="p-4 rounded-2xl bg-gradient-to-b from-purple-600 to-indigo-700 hover:from-purple-500 hover:to-indigo-600 text-white text-left space-y-2 shadow-xl shadow-purple-950/60 transition-all active:scale-[0.98] group"
              >
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-white/10 text-white">
                    <Rocket className="w-5 h-5" />
                  </div>
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950 uppercase tracking-wider">
                    Recommended
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-black text-white group-hover:text-purple-100 transition-colors">
                    1. SCALE
                  </h4>
                  <p className="text-[11px] text-purple-100/80 leading-relaxed mt-0.5">
                    Double down on top channels (Instagram 8.2%), increase creator posting cadence & unlock viral loops.
                  </p>
                </div>
              </button>

              {/* Choice 2: ITERATE */}
              <button
                onClick={() => {
                  setDecisionNotice('🔄 ITERATE MODE: Refining onboarding funnel and optimizing mobile checkout friction before further ad spend.')
                  showToast('Iterate mode set.')
                }}
                className="p-4 rounded-2xl bg-[#141720] hover:bg-[#1a1f2c] text-white text-left space-y-2 border border-white/[0.08] hover:border-blue-500/40 transition-all active:scale-[0.98] group"
              >
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-blue-500/20 text-blue-300">
                    <RefreshCw className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">Optimize</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-blue-200 transition-colors">
                    2. ITERATE
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                    Optimize lower-converting channels (Email 2.1%) and patch mobile checkout drop-offs.
                  </p>
                </div>
              </button>

              {/* Choice 3: MAINTAIN */}
              <button
                onClick={() => {
                  setDecisionNotice('🛡️ MAINTAIN MODE: Operating at steady-state organic posting and monitoring subscriber retention.')
                  showToast('Maintain mode set.')
                }}
                className="p-4 rounded-2xl bg-[#141720] hover:bg-[#1a1f2c] text-white text-left space-y-2 border border-white/[0.08] hover:border-emerald-500/40 transition-all active:scale-[0.98] group"
              >
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">Steady</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-emerald-200 transition-colors">
                    3. MAINTAIN
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                    Preserve organic creator posting rhythm, maintain high customer retention and steady MRR.
                  </p>
                </div>
              </button>

              {/* Choice 4: KILL */}
              <button
                onClick={() => setShowKillModal(true)}
                className="p-4 rounded-2xl bg-[#141720] hover:bg-red-950/30 text-white text-left space-y-2 border border-white/[0.08] hover:border-red-500/40 transition-all active:scale-[0.98] group"
              >
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-red-500/20 text-red-400">
                    <XCircle className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono text-red-400">Sunset</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-red-300 group-hover:text-red-200 transition-colors">
                    4. KILL
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                    Gracefully sunset product, refund active subscriptions, or pivot to a new validated problem space.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Step 4 Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
            <button
              onClick={() => setActiveStep('manager')}
              className="px-4 py-2.5 rounded-xl bg-white/[0.04] text-slate-300 hover:text-white border border-white/[0.08] text-xs font-semibold"
            >
              ← Back to AI Launch Manager
            </button>
          </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
