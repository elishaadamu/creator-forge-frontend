import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  Layers, CheckCircle2, ArrowRight, Activity, CheckSquare, Sparkles, BarChart2,
  Share2, Copy, Check, ExternalLink, X, ShieldCheck, Mail, Send, Target,
  FileText, Layout, Megaphone, TrendingUp, Flag, Bot, User, UserCheck,
  Calendar, Clock, CheckCircle, AlertCircle, MessageSquare, Folder,
  DollarSign, PieChart, Users, ChevronRight, Play, Eye, Smartphone, Monitor, Tablet,
  Code, Terminal, Laptop, Loader2, Rocket
} from 'lucide-react'
import Phase1Validate from './Phase1Validate'
import Phase2BuildMVP from './Phase2BuildMVP'
import Phase3Launch from './Phase3Launch'
import { trackVisit } from '../../services/tracker'
import { getFrontendUrl } from '../../services/opsApi'

export default function ProjectOS({ project, api, onUpdateProject, onGoToAcquisition, onResetProject }) {
  const [sidebarTab, setSidebarTab] = useState('overview')
  const [selectedPhaseStep, setSelectedPhaseStep] = useState('plan')
  const [showShareModal, setShowShareModal] = useState(false)
  const [showPhaseExecutionModal, setShowPhaseExecutionModal] = useState(false)

  // Lock background body scroll whenever a modal is open to prevent underlying page movement
  useEffect(() => {
    if (showPhaseExecutionModal || showShareModal) {
      const prevOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = prevOverflow
      }
    }
  }, [showPhaseExecutionModal, showShareModal])
  const [copiedKey, setCopiedKey] = useState(null)
  const [shareNotice, setShareNotice] = useState('')
  const [shareTab, setShareTab] = useState('email') // 'email' | 'preview' | 'link'
  const [portalRecipientEmail, setPortalRecipientEmail] = useState(() => (project?.creatorEmail || project?.email_public || project?.email || '').trim())
  const [portalEmailSubject, setPortalEmailSubject] = useState(() => `🚀 Co-Founder Portal Live: Developing ${project?.productName || 'our software'} with Creator Forge`)
  const [portalEmailBody, setPortalEmailBody] = useState(() => {
    const firstName = (project?.creatorName || 'there').split(' ')[0]
    const prodName = project?.productName || 'your custom software platform'
    const pricing = project?.pricing || '$29-$79/mo'
    const tagline = project?.productTagline || 'Tailored software venture'
    const portalSlug = (project?.creatorHandle || project?.creatorName || 'creator').replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
    const portalToken = project?.portalToken || 'cf_sec_live'
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001'
    const mUrl = `${origin}/portal/${portalSlug}?token=${portalToken}`
    return `Hi ${firstName},

Exciting milestone! Our venture studio engineering team has officially initiated the active development and co-launch sprint for **${prodName}** under our 50/50 venture co-launch agreement.

Your private, passwordless **Co-Founder Portal** is now live. Through your portal, you have real-time transparency into our sprint progress, shared presales revenue, launch strategy, and daily collaboration milestones.

---

### 📦 Venture Overview & Architecture
• **Product Name:** ${prodName}
• **Value Proposition:** ${tagline}
• **Pricing Tier:** ${pricing} (50/50 Net Revenue Split)
• **Financial Risk:** Zero upfront capital — Creator Forge covers 100% of engineering, hosting, payment setup, and customer operations.

---

### 🔑 Access Your Co-Founder Portal
Click the link below to access your private co-founder dashboard (no password required):

${mUrl}

---

### 🛠️ Current Engineering Sprint:
1. **MVP Architecture & Staging Environment:** Fully functional core web app ready for your private review.
2. **Audience Pre-Order & Validation Funnel:** High-converting landing page, checkout, and email sequence.
3. **Co-Founder Analytics Dashboard:** Live tracking of daily visitors, conversion rate, and revenue payouts.

We are thrilled to partner with you on this venture. Feel free to reply directly to this email at any time.

Best regards,
**The Creator Forge Studio Team**
partnerships@creatorforge.com`
  })
  const [isSendingPortalEmail, setIsSendingPortalEmail] = useState(false)
  const [portalEmailSuccess, setPortalEmailSuccess] = useState(false)
  const [portalEmailStatus, setPortalEmailStatus] = useState('')

  const handleSendPortalEmail = async () => {
    const to = (portalRecipientEmail || targetEmail || '').trim()
    if (!to || !to.includes('@')) {
      setPortalEmailSuccess(false)
      setPortalEmailStatus('Please enter a valid recipient email address.')
      return
    }

    setIsSendingPortalEmail(true)
    setPortalEmailStatus('')
    try {
      const { sendDirectEmail } = await import('../../services/opsApi')
      await sendDirectEmail(to, portalEmailSubject, portalEmailBody, project.creatorId || project.id)
      setPortalEmailSuccess(true)
      setPortalEmailStatus(`Portal invitation successfully sent to ${to}!`)
      setShareNotice(`Portal email invitation successfully sent to ${to}!`)
      setTimeout(() => {
        setShareNotice('')
        setPortalEmailSuccess(false)
        setPortalEmailStatus('')
      }, 4000)
    } catch (err) {
      console.error('Failed to send portal email:', err)
      setPortalEmailSuccess(false)
      setPortalEmailStatus(err.message || 'Failed to dispatch email. Please verify SMTP credentials.')
    } finally {
      setIsSendingPortalEmail(false)
    }
  }
  const targetEmail = (project?.creatorEmail || project?.email_public || project?.email || '').trim()

  useEffect(() => {
    trackVisit('/dashboard', onUpdateProject)
  }, [])


  if (!project) {
    return (
      <div className="p-12 rounded-2xl bg-[#0e1117] border border-white/[0.08] text-center space-y-4 max-w-lg mx-auto my-12">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
          <Layers className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-white">No active Co-Launch project loaded</h2>
        <p className="text-xs text-slate-400">
          Acquire a creator and accept a partnership deal in Section 1 to initialize your Co-Launch Project OS.
        </p>
        <div className="pt-2">
          <button
            type="button"
            onClick={onGoToAcquisition}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Go to Section 1: Acquire Creator
          </button>
        </div>
      </div>
    )
  }

  const currentPhase = project.currentPhase || 1
  const presalesRevenue = Number(project.currentPresales || 0)

  // Dynamic presale target derived from validation plan threshold or project
  const parseThresholdAmount = (str) => {
    if (!str) return 0
    const match = String(str).replace(/,/g, '').match(/\$(\d+)/)
    return match ? Number(match[1]) : 0
  }
  const derivedPlanTarget = parseThresholdAmount(project.validationPlan?.threshold)
  const presaleTarget = derivedPlanTarget > 0 ? derivedPlanTarget : Number(project.presaleTarget || project.targetRevenue || 12500)
  const visitorsCount = Number(project.visitors || 0)
  const conversionRate = Number(project.conversionRate || 0)
  const daysLeft = project.daysLeft || project.validationPlan?.period || '18 days'

  const portalSlug = (project.creatorHandle || project.creatorName || 'creator').replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
  const portalToken = project.portalToken || 'cf_sec_live'
  const origin = getFrontendUrl()
  const magicPortalUrl = `${origin}/portal/${portalSlug}?token=${portalToken}`

  const kickoffMessage = `Hey ${project.creatorName || 'there'}! 🎉\n\nYour private Co-Founder Portal for ${project.productName || 'our product'} is live.\n\nYou can track our $${presaleTarget.toLocaleString()} validation milestone, review your revenue share, and check off your daily launch tasks here:\n${magicPortalUrl}\n\nLet's build something massive!`

  const handleCopy = (text, key) => {
    if (!text) return
    navigator.clipboard?.writeText(text)
    setCopiedKey(key)
    setShareNotice('Copied to clipboard!')
    setTimeout(() => {
      setCopiedKey(null)
      setShareNotice('')
    }, 2500)
  }

  const handleAdvancePhase = (nextPhase) => {
    onUpdateProject?.(prev => ({
      ...prev,
      currentPhase: nextPhase
    }))
  }

  const openPhaseStep = (stepId) => {
    setSelectedPhaseStep(stepId)
    setShowPhaseExecutionModal(true)
  }

  const checklistTasks = project.checklist || []
  const aiActivityList = project.aiActivity || []
  const filesList = project.files || []
  const messagesList = project.messages || []
  const decisionsList = project.decisions || []

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      {/* SECTION 2 HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-400">
              SECTION 2
            </span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs font-bold text-white bg-white/[0.06] px-2 py-0.5 rounded-full border border-white/10">
              {project?.productName || 'Active Project'}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mt-0.5">
            CO-LAUNCH PROJECT OS
          </h1>
          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
            <span>Co-Founding Partner:</span>
            <strong className="text-emerald-400 font-bold">{project?.creatorName || 'Creator'}</strong>
            <span className="text-slate-500">({project?.creatorHandle || project?.niche || 'Partner'})</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-300 italic">"{project?.productTagline || ''}"</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowShareModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer whitespace-nowrap active:scale-95"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share Portal</span>
          </button>
        </div>
      </div>

      {/* 2-COLUMN MAIN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT / CENTER: PROJECT COMMAND CENTER */}
        <div className="lg:col-span-8 space-y-4">
          <div className="rounded-2xl bg-[#0e1117] border border-white/[0.1] overflow-hidden shadow-xl flex flex-col md:flex-row min-h-[460px]">
            {/* Left Mini Sidebar */}
            <div className="w-full md:w-44 bg-[#0a0c10] border-r border-white/[0.08] p-3 flex flex-col justify-between shrink-0">
              <div className="space-y-1">
                <div className="px-3 py-2 text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
                  Project Command Center
                </div>

                {[
                  { id: 'overview', label: 'Overview', icon: Layers },
                  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
                  { id: 'metrics', label: 'Metrics', icon: BarChart2 },
                  { id: 'files', label: 'Files', icon: Folder },
                  { id: 'messages', label: 'Messages', icon: MessageSquare },
                  { id: 'decisions', label: 'Decisions', icon: ShieldCheck },
                ].map(tab => {
                  const Icon = tab.icon
                  const isActive = sidebarTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setSidebarTab(tab.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left ${
                        isActive
                          ? 'bg-white/10 text-white shadow-sm border border-white/10'
                          : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span>{tab.label}</span>
                    </button>
                  )
                })}
              </div>

              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-center space-y-1.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Active Phase</span>
                <div className="flex items-center justify-center gap-1">
                  {[1, 2, 3].map(p => (
                    <button
                      key={p}
                      onClick={() => handleAdvancePhase(p)}
                      className={`w-7 h-7 rounded-lg text-xs font-black transition-all ${
                        currentPhase === p
                          ? p === 2
                            ? 'bg-blue-600 text-white shadow-sm'
                            : p === 3
                            ? 'bg-purple-600 text-white shadow-sm'
                            : 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-white/[0.04] text-slate-400 hover:text-white'
                      }`}
                      title={`Switch to Phase ${p}`}
                    >
                      P{p}
                    </button>
                  ))}
                </div>
                <span className="text-[10px] font-extrabold text-white block">
                  {currentPhase === 1 ? 'Phase 1: Validate' : currentPhase === 2 ? 'Phase 2: Build MVP' : 'Phase 3: Launch'}
                </span>
              </div>
            </div>

            {/* Main Command Center Inner Area */}
            <div className="flex-1 p-5 sm:p-6 space-y-5 bg-[#0e1117]">
              {/* Header inside Command Center */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                      <span>{project.productName || 'Software Product'}</span>
                      <span className="text-slate-400 font-normal">×</span>
                      <span className="truncate">{project.creatorName || 'Creator Partner'}</span>
                    </h2>
                    {project.pricing && (
                      <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 shadow-xs whitespace-nowrap shrink-0">
                        {project.pricing}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 mt-1 line-clamp-1 max-w-2xl">
                    {project.productTagline || 'Co-launching software with creator audience.'}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap shadow-xs ${
                    currentPhase === 2
                      ? 'text-blue-400 bg-blue-500/10 border border-blue-500/20'
                      : currentPhase === 3
                      ? 'text-purple-400 bg-purple-500/10 border border-purple-500/20'
                      : 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                  }`}>
                    {currentPhase === 1 ? 'Phase 1: Validate' : currentPhase === 2 ? 'Phase 2: Build MVP' : 'Phase 3: Launch'}
                  </span>
                </div>
              </div>

              {/* OVERVIEW TAB CONTENT */}
              {sidebarTab === 'overview' && (
                <div className="space-y-5 animate-fade-in">
                  {/* Top 4 KPI Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    {/* 1. Presales */}
                    <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.08] space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Presales</span>
                      <div className="text-lg sm:text-xl font-extrabold text-white">
                        ${presalesRevenue.toLocaleString()}
                      </div>
                      <span className="text-[10px] text-slate-400 block">of ${presaleTarget.toLocaleString()} goal</span>
                      <div className="w-full bg-white/[0.06] rounded-full h-1.5 overflow-hidden mt-1">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${presaleTarget > 0 ? Math.min(100, Math.round((presalesRevenue / presaleTarget) * 100)) : 0}%` }}
                        />
                      </div>
                    </div>

                    {/* 2. Unique Visitors */}
                    <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.08] space-y-1">
                      <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block">Unique Visitors</span>
                      <div className="text-lg sm:text-xl font-extrabold text-white">
                        {visitorsCount.toLocaleString()}
                      </div>
                      <span className="text-[10px] text-slate-400">Tracked unique devices</span>
                    </div>

                    {/* 3. Conversion */}
                    <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.08] space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Conversion</span>
                      <div className="text-lg sm:text-xl font-extrabold text-white">
                        {conversionRate.toFixed(1)}%
                      </div>
                      <span className="text-[10px] text-slate-500">Tracked rate</span>
                    </div>

                    {/* 4. Days Left */}
                    <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.08] space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Days Left</span>
                      <div className="text-lg sm:text-xl font-extrabold text-white">
                        {daysLeft}
                      </div>
                      <span className="text-[10px] text-slate-500">Validation window</span>
                    </div>
                  </div>

                  {/* Two Columns: Tasks & AI Activity */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {/* Tasks Card */}
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.08] space-y-3 flex flex-col justify-between hover:border-white/15 transition-all">
                      <div>
                        <div className="flex items-center justify-between border-b border-white/[0.06] pb-2 mb-2.5">
                          <span className="font-bold text-white text-xs flex items-center gap-1.5">
                            <CheckSquare className="w-3.5 h-3.5 text-purple-400" />
                            <span>Validation Sprint Tasks</span>
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono font-bold bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.06]">
                            {checklistTasks.length} total
                          </span>
                        </div>
                        {checklistTasks.length === 0 ? (
                          <div className="py-3 text-center text-slate-400 text-xs space-y-1">
                            <p className="text-slate-300 font-medium">No tasks logged yet</p>
                            <p className="text-[10px] text-slate-500">Tasks generate automatically during Phase 1 Validation.</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {checklistTasks.slice(0, 3).map((task, idx) => (
                              <div key={idx} className="flex items-center justify-between text-slate-200">
                                <span className="flex items-center gap-2 truncate">
                                  <span>{task.completed ? '✅' : '📍'}</span>
                                  <span className="font-medium truncate">{task.title || task.text}</span>
                                </span>
                                <span className="text-[11px] text-slate-400 shrink-0 ml-2">{task.due || 'Pending'}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => setSidebarTab('tasks')}
                        className="text-[11px] font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1 mt-2 text-left cursor-pointer"
                      >
                        <span>View all tasks</span>
                        <span>→</span>
                      </button>
                    </div>

                    {/* AI Activity Card */}
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.08] space-y-3 flex flex-col justify-between hover:border-white/15 transition-all">
                      <div>
                        <div className="flex items-center justify-between border-b border-white/[0.06] pb-2 mb-2.5">
                          <span className="font-bold text-white text-xs flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                            <span>AI Activity Stream</span>
                          </span>
                          <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span>Autonomous</span>
                          </span>
                        </div>
                        {aiActivityList.length === 0 ? (
                          <div className="py-3 text-center text-slate-400 text-xs space-y-1">
                            <p className="text-slate-300 font-medium">Autonomous agent standing by</p>
                            <p className="text-[10px] text-slate-500">Actions log automatically during validation & campaign execution.</p>
                          </div>
                        ) : (
                          <div className="space-y-1.5 text-slate-300 text-[11px]">
                            {aiActivityList.slice(0, 4).map((act, idx) => (
                              <div key={idx} className="flex items-start gap-2">
                                <span className="text-purple-400">•</span>
                                <span>{act.message || act}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => setSidebarTab('decisions')}
                        className="text-[11px] font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1 mt-2 text-left cursor-pointer"
                      >
                        <span>View all activity</span>
                        <span>→</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TASKS TAB */}
              {sidebarTab === 'tasks' && (
                <div className="space-y-3 animate-fade-in text-xs">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                    <span className="font-bold text-white">Work: AI Tasks, Creator Tasks & Co-Launch Sprint</span>
                    <button
                      onClick={() => openPhaseStep('campaign')}
                      className="text-purple-400 hover:underline font-bold text-[11px]"
                    >
                      Open Creator Campaign Kit →
                    </button>
                  </div>
                  {checklistTasks.length === 0 ? (
                    <div className="py-8 text-center text-slate-500 text-xs border border-dashed border-white/[0.08] rounded-xl">
                      No tasks in pipeline. Use Phase 1 validation tools to populate sprint checklist.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {checklistTasks.map((task, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-[#141720] border border-white/[0.06] flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <CheckCircle2 className={`w-4 h-4 ${task.completed ? 'text-emerald-400' : 'text-slate-600'}`} />
                            <div>
                              <div className={`font-semibold ${task.completed ? 'line-through text-slate-500' : 'text-white'}`}>{task.title || task.text}</div>
                              <span className="text-[10px] text-purple-300">{task.role || 'Sprint Task'}</span>
                            </div>
                          </div>
                          <span className="text-[11px] text-slate-400">{task.due || 'Active'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* METRICS TAB */}
              {sidebarTab === 'metrics' && (
                <div className="space-y-4 animate-fade-in text-xs">
                  <span className="font-bold text-white block">Performance Telemetry & Attribution</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                      <span className="text-emerald-400 font-bold block uppercase text-[10px]">Presales Revenue</span>
                      <span className="text-base font-extrabold text-white mt-1 block">${presalesRevenue.toLocaleString()}</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-[#141720] border border-white/[0.08]">
                      <span className="text-slate-400 font-bold block uppercase text-[10px]">Unique Visitors</span>
                      <span className="text-base font-bold text-white mt-1 block">{visitorsCount.toLocaleString()}</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-[#141720] border border-white/[0.08]">
                      <span className="text-slate-400 font-bold block uppercase text-[10px]">Conversion Rate</span>
                      <span className="text-base font-bold text-white mt-1 block">{conversionRate.toFixed(1)}%</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-[#141720] border border-white/[0.08]">
                      <span className="text-slate-400 font-bold block uppercase text-[10px]">Refund Rate</span>
                      <span className="text-base font-bold text-white mt-1 block">{Number(project.refundRate || 0)}%</span>
                    </div>
                  </div>
                </div>
              )}

              {/* FILES TAB */}
              {sidebarTab === 'files' && (
                <div className="space-y-3 animate-fade-in text-xs">
                  <span className="font-bold text-white block">Project Assets & Research Files</span>
                  {filesList.length === 0 ? (
                    <div className="py-8 text-center text-slate-500 text-xs border border-dashed border-white/[0.08] rounded-xl">
                      No project files saved yet. Generated validation specifications and scripts will appear here.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filesList.map((f, i) => (
                        <div key={i} className="p-3 rounded-xl bg-[#141720] border border-white/[0.06] flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <FileText className="w-4 h-4 text-purple-400" />
                            <div>
                              <div className="font-bold text-white">{f.name}</div>
                              <span className="text-[10px] text-slate-400">{f.type}</span>
                            </div>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">{f.size}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* MESSAGES TAB */}
              {sidebarTab === 'messages' && (
                <div className="space-y-3 animate-fade-in text-xs">
                  <span className="font-bold text-white block">Creator Conversations & Team Notes</span>
                  {messagesList.length === 0 ? (
                    <div className="py-8 text-center text-slate-500 text-xs border border-dashed border-white/[0.08] rounded-xl">
                      No direct messages or team notes recorded yet.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {messagesList.map((m, i) => (
                        <div key={i} className="p-4 rounded-xl bg-[#141720] border border-white/[0.08] space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-purple-300">{m.sender}</span>
                            <span className="text-[10px] text-slate-400">{m.date}</span>
                          </div>
                          <p className="text-slate-300 leading-relaxed">{m.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* DECISIONS TAB */}
              {sidebarTab === 'decisions' && (
                <div className="space-y-3 animate-fade-in text-xs">
                  <span className="font-bold text-white block">Decisions Requiring Human Approval</span>
                  {decisionsList.length === 0 ? (
                    <div className="py-8 text-center text-slate-500 text-xs border border-dashed border-white/[0.08] rounded-xl">
                      No decisions pending human approval.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {decisionsList.map((d, i) => (
                        <div key={i} className="p-4 rounded-xl bg-[#141720] border border-purple-500/30 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white">{d.title}</span>
                            <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full">Pending</span>
                          </div>
                          <p className="text-slate-300 leading-relaxed">{d.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* BOTTOM WORKFLOW BANNER */}
          <div className="p-4 rounded-2xl bg-[#0e1117] border border-white/[0.08] shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-white block">AI Project Manager</span>
                  <span className="text-[11px] text-slate-400 leading-tight block">
                    Creates tasks, tracks progress, unblocks, and adapts the plan.
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-white block">Creator Portal</span>
                  <span className="text-[11px] text-slate-400 leading-tight block">
                    Simple daily tasks with ready-to-use content.
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-white block">Human Decisions</span>
                  <span className="text-[11px] text-slate-400 leading-tight block">
                    Important decisions come to your inbox.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: PHASE 1 / PHASE 2 / PHASE 3 WORKSPACE */}
        <div className="lg:col-span-4 rounded-2xl bg-[#0e1117] border border-white/[0.1] p-5 sm:p-6 space-y-4 shadow-xl">
          {currentPhase === 2 ? (
            /* PHASE 2: BUILD MVP */
            <>
              <div className="flex items-start justify-between border-b border-white/[0.08] pb-4">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-400 block">
                    PHASE 2
                  </span>
                  <h2 className="text-xl font-extrabold text-white tracking-tight mt-0.5">
                    BUILD MVP
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Smallest usable version.
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 shadow-lg shadow-blue-950/40">
                  <Code className="w-6 h-6" />
                </div>
              </div>

              {/* 4 Step Cards for Phase 2 */}
              <div className="space-y-2.5">
                {[
                  {
                    id: 'plan',
                    num: '1. Product + Build Plan',
                    desc: 'Product spec, user flows, tech stack, schema, acceptance criteria & scope boundaries',
                    icon: FileText
                  },
                  {
                    id: 'build',
                    num: '2. Engineering Build',
                    desc: 'FastAPI backend, React frontend, database migrations, and async AI worker pipeline',
                    icon: Terminal
                  },
                  {
                    id: 'beta',
                    num: '3. Beta Testing',
                    desc: `Invite ${Array.isArray(project?.reservations) ? project.reservations.length : 0} founding pre-order backers for private beta QA`,
                    icon: Laptop
                  },
                  {
                    id: 'gate',
                    num: '4. MVP Launch Gate',
                    desc: 'Verify acceptance criteria, zero critical errors, approve & advance to Phase 3',
                    icon: ShieldCheck
                  },
                ].map(step => {
                  const Icon = step.icon
                  return (
                    <div
                      key={step.id}
                      onClick={() => openPhaseStep(step.id)}
                      className="p-3.5 rounded-xl bg-[#141720] hover:bg-[#1b202c] border border-white/[0.06] hover:border-blue-500/40 transition-all cursor-pointer group space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 text-xs font-bold text-white group-hover:text-blue-300 transition-colors">
                          <Icon className="w-4 h-4 text-blue-400 shrink-0" />
                          <span>{step.num}</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 group-hover:text-white flex items-center gap-0.5">
                          <span>Open</span>
                          <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed pl-6">
                        {step.desc}
                      </p>
                    </div>
                  )
                })}
              </div>

              <button
                onClick={() => openPhaseStep('plan')}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-blue-950/40 active:scale-95"
              >
                <span>Open Phase 2 MVP Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </>
          ) : currentPhase === 3 ? (
            /* PHASE 3: LAUNCH */
            <>
              <div className="flex items-start justify-between border-b border-white/[0.08] pb-4">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-purple-400 block">
                    PHASE 3
                  </span>
                  <h2 className="text-xl font-extrabold text-white tracking-tight mt-0.5">
                    LAUNCH
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Acquire, activate & scale.
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 shadow-lg shadow-purple-950/40">
                  <Sparkles className="w-6 h-6" />
                </div>
              </div>

              <button
                onClick={() => openPhaseStep('launch')}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-purple-950/40 active:scale-95"
              >
                <span>Open Phase 3 Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            /* PHASE 1: VALIDATE */
            <>
              <div className="flex items-start justify-between border-b border-white/[0.08] pb-4">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400 block">
                    PHASE 1
                  </span>
                  <h2 className="text-xl font-extrabold text-white tracking-tight mt-0.5">
                    VALIDATE
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Prove people will pay.
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg shadow-emerald-950/40">
                  <Target className="w-6 h-6" />
                </div>
              </div>

              {/* 5 Step Cards */}
              <div className="space-y-2.5">
                {[
                  {
                    id: 'plan',
                    num: '1. Validation Plan',
                    desc: 'Define customer, problem, offer, price, test method, success threshold',
                    icon: FileText
                  },
                  {
                    id: 'assets',
                    num: '2. Build Validation Assets',
                    desc: 'Landing page, presales, checkout, analytics, emails, surveys, mockups',
                    icon: Layout
                  },
                  {
                    id: 'campaign',
                    num: '3. Creator Campaign',
                    desc: 'Posts, stories, newsletter, videos, polls, CTAs, images, scripts',
                    icon: Megaphone
                  },
                  {
                    id: 'optimize',
                    num: '4. Run & Optimize',
                    desc: 'Track traffic, presales, revenue, conversion, feedback. AI suggests experiments',
                    icon: TrendingUp
                  },
                  {
                    id: 'gate',
                    num: '5. Validation Gate',
                    desc: 'PASS → Build MVP | TEST AGAIN → Iterate | FAIL → Kill',
                    icon: Flag
                  },
                ].map(step => {
                  const Icon = step.icon
                  return (
                    <div
                      key={step.id}
                      onClick={() => openPhaseStep(step.id)}
                      className="p-3.5 rounded-xl bg-[#141720] hover:bg-[#1b202c] border border-white/[0.06] hover:border-emerald-500/40 transition-all cursor-pointer group space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                          <Icon className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>{step.num}</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 group-hover:text-white flex items-center gap-0.5">
                          <span>Open</span>
                          <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed pl-6">
                        {step.desc}
                      </p>
                    </div>
                  )
                })}
              </div>

              <button
                onClick={() => openPhaseStep('plan')}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-emerald-950/40 active:scale-95"
              >
                <span>Open Phase 1 Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* PHASE EXECUTION MODAL (PHASE 1 / PHASE 2 / PHASE 3) */}
      {showPhaseExecutionModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6 animate-fade-in overflow-hidden">
          <div className="max-w-5xl w-full max-h-[92vh] overflow-y-auto rounded-3xl bg-[#090b0e] border border-white/[0.1] p-6 space-y-6 shadow-2xl overscroll-contain">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  currentPhase === 2
                    ? 'bg-blue-500/10 border border-blue-500/30 text-blue-400'
                    : currentPhase === 3
                    ? 'bg-purple-500/10 border border-purple-500/30 text-purple-400'
                    : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                }`}>
                  {currentPhase === 2 ? <Code className="w-5 h-5" /> : currentPhase === 3 ? <Sparkles className="w-5 h-5" /> : <Target className="w-5 h-5" />}
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold text-white">
                    Phase {currentPhase}: {currentPhase === 2 ? 'Build MVP Execution Workspace' : currentPhase === 3 ? 'Launch Execution Workspace' : 'Validation Execution Workspace'}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {project.productName} × {project.creatorName}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowPhaseExecutionModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {currentPhase === 2 ? (
              <Phase2BuildMVP
                project={project}
                api={api}
                onUpdateProject={onUpdateProject}
                onAdvanceToPhase3={() => {
                  setShowPhaseExecutionModal(false)
                  handleAdvancePhase(3)
                }}
              />
            ) : currentPhase === 3 ? (
              <Phase3Launch
                project={project}
                api={api}
                onUpdateProject={onUpdateProject}
              />
            ) : (
              <Phase1Validate
                project={project}
                api={api}
                activeStepId={selectedPhaseStep}
                onSelectStep={setSelectedPhaseStep}
                onUpdateProject={onUpdateProject}
                onAdvanceToPhase2={() => {
                  setShowPhaseExecutionModal(false)
                  handleAdvancePhase(2)
                }}
              />
            )}
          </div>
        </div>,
        document.body
      )}

      {/* SHARE CREATOR PORTAL MODAL */}
      {showShareModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6 animate-fade-in overflow-hidden">
          <div className="max-w-2xl w-full p-5 sm:p-6 rounded-2xl bg-[#0e1117] border border-purple-500/40 space-y-4 shadow-2xl max-h-[92vh] flex flex-col overscroll-contain">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Creator Co-Founder Portal & Email Dispatch</h3>
                  <p className="text-[11px] text-slate-400">Passwordless access link & luxury email invite for {project.creatorName || 'Creator'}</p>
                </div>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-white/[0.03] border border-white/[0.06] rounded-xl shrink-0">
              <button
                type="button"
                onClick={() => setShareTab('email')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  shareTab === 'email'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email Dispatch (SMTP)</span>
              </button>
              <button
                type="button"
                onClick={() => setShareTab('preview')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  shareTab === 'preview'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Visual Email Preview</span>
              </button>
              <button
                type="button"
                onClick={() => setShareTab('link')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  shareTab === 'link'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Magic Link & DM</span>
              </button>
            </div>

            {/* Modal Tab Content */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {/* TAB 1: EMAIL DISPATCH */}
              {shareTab === 'email' && (
                <div className="space-y-3.5 animate-fade-in">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                      Recipient Email (Creator)
                    </label>
                    <input
                      type="email"
                      value={portalRecipientEmail}
                      onChange={(e) => setPortalRecipientEmail(e.target.value)}
                      placeholder="creator@example.com"
                      className="w-full px-3 py-2 rounded-xl bg-[#161a23] border border-white/[0.1] text-xs font-mono text-white outline-none focus:border-purple-500/50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                      Subject Line
                    </label>
                    <input
                      type="text"
                      value={portalEmailSubject}
                      onChange={(e) => setPortalEmailSubject(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#161a23] border border-white/[0.1] text-xs text-white outline-none focus:border-purple-500/50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                      Personalized Message Body
                    </label>
                    <textarea
                      rows={5}
                      value={portalEmailBody}
                      onChange={(e) => setPortalEmailBody(e.target.value)}
                      className="w-full p-3.5 rounded-xl bg-[#161a23] border border-white/[0.1] text-xs text-slate-200 outline-none leading-relaxed font-sans resize-none focus:border-purple-500/50"
                    />
                  </div>

                  {portalEmailStatus && (
                    <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                      portalEmailSuccess
                        ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                    }`}>
                      {portalEmailSuccess ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                      <span>{portalEmailStatus}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleSendPortalEmail}
                      disabled={isSendingPortalEmail}
                      className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      {isSendingPortalEmail ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Dispatching...</span>
                        </>
                      ) : portalEmailSuccess ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Sent Successfully!</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Send Portal Invite Email 🚀</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: LUXURY VISUAL EMAIL PREVIEW */}
              {shareTab === 'preview' && (
                <div className="space-y-3 animate-fade-in">
                  <div className="p-4 rounded-xl bg-[#07090e] border border-white/[0.1] space-y-3 shadow-inner">
                    {/* Simulated Email Client Bar */}
                    <div className="p-2.5 rounded-lg bg-black/60 border border-white/[0.06] text-[11px] space-y-1 font-mono text-slate-400">
                      <div><strong className="text-slate-200">From:</strong> Creator Forge Venture Studio &lt;partnerships@creatorforge.com&gt;</div>
                      <div><strong className="text-slate-200">To:</strong> {portalRecipientEmail || 'creator@example.com'}</div>
                      <div><strong className="text-slate-200">Subject:</strong> {portalEmailSubject}</div>
                    </div>

                    {/* Email Card Preview */}
                    <div className="rounded-xl border border-white/[0.08] bg-[#0c1017] overflow-hidden text-xs">
                      <div className="p-4 bg-gradient-to-r from-purple-900/40 via-indigo-900/30 to-purple-950/40 border-b border-white/[0.06] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Rocket className="w-4 h-4 text-purple-400" />
                          <span className="font-extrabold text-white text-sm">CREATOR FORGE</span>
                        </div>
                        <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          Verified Invite
                        </span>
                      </div>

                      <div className="p-5 space-y-3 text-slate-300 leading-relaxed font-sans">
                        <p className="whitespace-pre-line text-slate-200 font-medium">
                          {portalEmailBody}
                        </p>

                        <div className="p-3.5 rounded-xl bg-[#141824] border border-purple-500/30 space-y-2">
                          <div className="font-bold text-white text-xs">Co-Launch Venture Snapshot</div>
                          <div className="grid grid-cols-2 gap-2 text-[11px]">
                            <div><span className="text-slate-400">Software:</span> <strong className="text-purple-300">{project.productName || 'Custom App'}</strong></div>
                            <div><span className="text-slate-400">Revenue Split:</span> <strong className="text-emerald-400">50% Net Creator Share</strong></div>
                            <div><span className="text-slate-400">Initial Pricing:</span> <strong className="text-slate-200">{project.pricing || '$49/mo'}</strong></div>
                            <div><span className="text-slate-400">Validation Goal:</span> <strong className="text-emerald-400">${presaleTarget.toLocaleString()}</strong></div>
                          </div>
                        </div>

                        <div className="pt-2 text-center">
                          <a
                            href={magicPortalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-extrabold text-xs shadow-lg shadow-purple-950/50 hover:brightness-110 transition-all"
                          >
                            <span>Open Co-Founder Portal (Passwordless Access)</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>

                      {/* Email Footer */}
                      <div className="p-4 bg-[#090d16] border-t border-[#1e293b] text-center text-[10px] text-slate-500 space-y-0.5">
                        <div className="font-bold text-slate-400">Creator Forge Venture Studio</div>
                        <div>Co-launching software empires with leading digital creators.</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: MAGIC LINK & DM */}
              {shareTab === 'link' && (
                <div className="space-y-3.5 animate-fade-in">
                  {/* Portal Magic URL Box */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                      Secure Magic Link (No Password Required)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={magicPortalUrl}
                        className="flex-1 px-3 py-2 rounded-xl bg-[#161a23] border border-white/[0.1] text-xs font-mono text-purple-300 outline-none select-all"
                      />
                      <button
                        onClick={() => handleCopy(magicPortalUrl, 'link')}
                        className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        {copiedKey === 'link' ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey === 'link' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Kickoff DM Message */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                        Social DM / WhatsApp Invite Message
                      </label>
                      <button
                        onClick={() => handleCopy(kickoffMessage, 'msg')}
                        className="text-xs text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === 'msg' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey === 'msg' ? 'Copied Message' : 'Copy Message'}</span>
                      </button>
                    </div>
                    <textarea
                      readOnly
                      rows={6}
                      value={kickoffMessage}
                      className="w-full p-3.5 rounded-xl bg-[#161a23] border border-white/[0.08] text-xs text-slate-200 outline-none leading-relaxed font-sans resize-none select-all"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-white/[0.08] shrink-0">
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span>{shareNotice || 'Magic token active & verified'}</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={magicPortalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-200 hover:text-white border border-purple-500/40 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <span>Preview Live Portal</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
