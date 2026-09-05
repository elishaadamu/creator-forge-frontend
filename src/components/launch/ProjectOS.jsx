import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  Layers, CheckCircle2, ArrowRight, Activity, CheckSquare, Sparkles, BarChart2,
  Share2, Copy, Check, ExternalLink, X, ShieldCheck, Mail, Send, Target,
  FileText, Layout, Megaphone, TrendingUp, Flag, Bot, User, UserCheck,
  Calendar, Clock, CheckCircle, AlertCircle, MessageSquare, Folder,
  DollarSign, PieChart, Users, ChevronRight, ChevronLeft, Play, Eye, Smartphone, Monitor, Tablet,
  Code, Terminal, Laptop, Loader2, Rocket, Plus, Upload, Download, RefreshCw, Zap, Trash2
} from 'lucide-react'
import Phase1Validate from './Phase1Validate'
import Phase2BuildMVP from './Phase2BuildMVP'
import Phase3Launch from './Phase3Launch'
import { getFrontendUrl, recordGateDecision } from '../../services/opsApi'
import { ProjectOSSkeleton } from './Section2Skeletons'
import CreatorWhatsAppChat from './CreatorWhatsAppChat'
import ProjectFileExplorer from './ProjectFileExplorer'
import { getPhase1StepGuards, getPhase2StepGuards, getPhase3StepGuards } from '../../utils/stepGuards'

// Detect raw UUID strings (prevent displaying raw UUIDs as creator names/handles)
const isUuid = (str) => typeof str === 'string' && (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim()) || /^[0-9a-f-]{24,}$/i.test(str.trim()))

export default function ProjectOS({ project, api, onUpdateProject, onGoToAcquisition, onResetProject }) {
  const [isLoadingProject, setIsLoadingProject] = useState(() => !project)

  // Initialize sidebarTab from URL search param or default 'overview'
  const [sidebarTab, setSidebarTabState] = useState(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search)
      const tabParam = sp.get('tab')
      const validTabs = ['overview', 'tasks', 'metrics', 'files', 'messages', 'decisions']
      if (tabParam && validTabs.includes(tabParam.toLowerCase())) {
        return tabParam.toLowerCase()
      }
    }
    return 'overview'
  })

  // Sync sidebar tab state and URL parameter
  const setSidebarTab = (newTab) => {
    setSidebarTabState(newTab)
    if (typeof window !== 'undefined') {
      try {
        const url = new URL(window.location.href)
        url.searchParams.set('tab', newTab)
        window.history.replaceState({}, '', url.toString())
      } catch (e) {}
    }
  }

  // Initialize phase modal & step from URL or fallback
  const [selectedPhaseStep, setSelectedPhaseStep] = useState(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search)
      const stepParam = sp.get('step')
      if (stepParam && ['plan', 'build', 'beta', 'gate', 'campaign', 'launch'].includes(stepParam)) {
        return stepParam
      }
    }
    return 'plan'
  })

  const [showShareModal, setShowShareModal] = useState(false)
  const [showPhaseExecutionModal, setShowPhaseExecutionModal] = useState(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search)
      return sp.get('modal') === 'phase' || Boolean(sp.get('step'))
    }
    return false
  })

  const [decisionViewPhase, setDecisionViewPhase] = useState(() => {
    return Number(project?.currentPhase || (project?.status === 'launched' ? 3 : project?.status === 'building' ? 2 : 1))
  })

  useEffect(() => {
    if (project?.currentPhase) {
      setDecisionViewPhase(Number(project.currentPhase))
    }
  }, [project?.currentPhase])

  // Listen to popstate or URL changes to sync tab
  useEffect(() => {
    const handleLocationChange = () => {
      if (typeof window !== 'undefined') {
        const sp = new URLSearchParams(window.location.search)
        const tabParam = sp.get('tab')
        if (tabParam && ['overview', 'tasks', 'metrics', 'files', 'messages', 'decisions'].includes(tabParam.toLowerCase())) {
          setSidebarTabState(tabParam.toLowerCase())
        }
      }
    }
    window.addEventListener('popstate', handleLocationChange)
    return () => window.removeEventListener('popstate', handleLocationChange)
  }, [])

  // Lock background body scroll whenever a modal is open
  useEffect(() => {
    if (showPhaseExecutionModal || showShareModal) {
      const prevOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = prevOverflow
      }
    }
  }, [showPhaseExecutionModal, showShareModal])

  // Compute clean display values to protect against raw UUIDs being displayed
  const cleanCreatorName = isUuid(project?.creatorName) ? 'Creator Partner' : (project?.creatorName || 'Creator Partner')
  const cleanCreatorHandle = isUuid(project?.creatorHandle) ? 'partner' : (project?.creatorHandle || project?.niche || 'Partner')
  const cleanProductName = (project?.productName && isUuid(project.productName.replace(/ Pro Hub| Co-Launch OS| Software Product/gi, '').trim()))
    ? 'Software Co-Launch OS'
    : (project?.productName || 'Active Project')
  const cleanTagline = (project?.productTagline && isUuid(project.productTagline.replace(/All-in-one software platform built for |'s audience|Tailored co-launch platform for /gi, '').trim()))
    ? 'All-in-one software platform built for creator audience'
    : (project?.productTagline || 'Co-launching software with creator audience.')
  const portalSlug = (project?.creatorHandle || project?.creatorName || 'creator').replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
  const portalToken = project?.portalToken || 'cf_sec_live'
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001'
  const portalUrl = `${origin}/portal/${portalSlug}?token=${portalToken}`

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
    const mUrl = portalUrl
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
    // Background polling from PostgreSQL so cross-device and Vercel payments appear on localhost in real time
    let isCancelled = false
    const pollDb = async () => {
      try {
        const { getCoLaunchProjects } = await import('../../services/opsApi')
        const allProjs = await getCoLaunchProjects()
        if (!isCancelled && Array.isArray(allProjs) && allProjs.length > 0) {
          const matched = allProjs.find(p => p.id === project?.id) || allProjs[0]
          if (matched) {
            onUpdateProject?.(prev => {
              const curRev = Number(prev?.currentPresales || 0)
              const newRev = Number(matched.currentPresales || 0)
              const curResCount = Array.isArray(prev?.reservations) ? prev.reservations.length : 0
              const newResCount = Array.isArray(matched.reservations) ? matched.reservations.length : 0
              const curActCount = Array.isArray(prev?.activityLogs) ? prev.activityLogs.length : 0
              const newActCount = Array.isArray(matched.activityLogs) ? matched.activityLogs.length : 0
              const curPhase = Number(prev?.currentPhase || prev?.current_phase || 1)
              const newPhase = Number(matched.currentPhase || matched.current_phase || (matched.status === 'building' ? 2 : matched.status === 'launched' ? 3 : ((matched.gateDecisions?.length || 0) > 0 ? 2 : 1)))
              const curVisitors = Number(prev?.visitors || 0)
              const newVisitors = Number(matched.visitors || 0)
              const curFilesCount = Array.isArray(prev?.projectFiles) ? prev.projectFiles.length : 0
              const newFilesCount = Array.isArray(matched.projectFiles) ? matched.projectFiles.length : 0

              if (curRev !== newRev || curVisitors !== newVisitors || curResCount !== newResCount || curActCount !== newActCount || curPhase !== newPhase || newFilesCount > curFilesCount) {
                return {
                  ...prev,
                  ...matched,
                  visitors: matched.visitors,
                  conversionRate: matched.conversionRate,
                  projectFiles: (matched.projectFiles && matched.projectFiles.length > 0) ? matched.projectFiles : (prev?.projectFiles || []),
                  messages: (matched.messages && matched.messages.length > 0) ? matched.messages : (prev?.messages || []),
                  currentPhase: newPhase,
                  current_phase: newPhase
                }
              }
              return prev
            })
          }
        }
      } catch (err) {} finally {
        if (!isCancelled) setIsLoadingProject(false)
      }
    }

    pollDb()
    const timer = setInterval(pollDb, 4000)
    return () => {
      isCancelled = true
      clearInterval(timer)
    }
  }, [project?.id])

  if (isLoadingProject && !project) {
    return <ProjectOSSkeleton />
  }

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

  const projectCurrentPhase = Number(
    project.currentPhase ||
    project.current_phase ||
    (project.status === 'building' ? 2 : project.status === 'launched' ? 3 : ((project.gateDecisions?.length || 0) > 0 ? 2 : 1))
  )
  const [selectedPhaseTab, setSelectedPhaseTab] = useState(projectCurrentPhase)

  useEffect(() => {
    setSelectedPhaseTab(projectCurrentPhase)
  }, [project?.id, projectCurrentPhase])

  const currentPhase = selectedPhaseTab
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
  const daysLeft = project.daysLeft || project.validationPlan?.period || '18 days'
  const magicPortalUrl = portalUrl

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
    const updatedStatus = nextPhase === 2 ? 'building' : nextPhase === 3 ? 'launched' : 'validating'
    const updated = {
      ...(project || {}),
      currentPhase: nextPhase,
      current_phase: nextPhase,
      status: updatedStatus
    }
    onUpdateProject?.(prev => ({
      ...(prev || {}),
      ...updated
    }))
    if (project?.id) {
      import('../../services/opsApi').then(({ updateCoLaunchProject }) => {
        updateCoLaunchProject(project.id, {
          currentPhase: nextPhase,
          current_phase: nextPhase,
          status: updatedStatus
        }).catch(e => console.warn(e))
      })
    }
  }

  const formatDecisionTitle = (dec) => {
    if (!dec) return 'Validation Gate Review'
    const decisionKey = typeof dec === 'string' ? dec : dec.decision
    if (decisionKey === 'pass_to_phase2') return 'Phase 1 Gate: Build MVP (Approved)'
    if (decisionKey === 'iterate_validation') return 'Phase 1 Gate: Iterate & Re-Test Sprint'
    if (decisionKey === 'kill_project') return 'Phase 1 Gate: Venture Archived & Refunded'
    if (decisionKey === 'phase3_scale' || decisionKey === 'scale') return 'Phase 3 Launch: Scale Commercial Growth (Active)'
    if (decisionKey === 'phase3_iterate' || decisionKey === 'iterate') return 'Phase 3 Launch: Iterate & CRO Sprint'
    if (decisionKey === 'phase3_maintain' || decisionKey === 'maintain') return 'Phase 3 Launch: Maintain Steady-State Ops'
    if (decisionKey === 'phase3_kill' || decisionKey === 'kill') return 'Phase 3 Launch: Sunset & Archive Venture'
    if (dec.title) return dec.title
    return String(decisionKey || 'Decision').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  }

  const handleRecordPhase3Decision = async (decisionType, label, notes) => {
    const noticeText = `${label}: ${notes}`
    const newDecision = {
      id: `gate_p3_${Date.now()}`,
      decision: `phase3_${decisionType}`,
      phase: 3,
      title: `Phase 3 Launch: ${label}`,
      targetRevenue: presaleTarget,
      achievedRevenue: presalesRevenue,
      backersCount: backersCount,
      conversionRate: conversionRate,
      gateStatus: decisionType === 'scale' ? 'passed' : decisionType === 'iterate' ? 'iterating' : decisionType === 'maintain' ? 'maintaining' : 'killed',
      notes: noticeText,
      decidedAt: new Date().toISOString()
    }
    const updatedDecisions = [newDecision, ...(project?.gateDecisions || [])]
    const updatedProject = {
      ...(project || {}),
      decisionNotice: noticeText,
      gateDecisions: updatedDecisions,
      status: decisionType === 'kill' ? 'archived' : 'launched'
    }
    onUpdateProject?.(prev => ({ ...(prev || {}), ...updatedProject }))

    if (project?.id) {
      try {
        const { updateCoLaunchProject, recordGateDecision } = await import('../../services/opsApi')
        await recordGateDecision(project.id, {
          decision: `phase3_${decisionType}`,
          notes: noticeText
        }).catch(() => {})
        await updateCoLaunchProject(project.id, {
          decisionNotice: noticeText,
          status: decisionType === 'kill' ? 'archived' : 'launched'
        }).catch(() => {})
      } catch (e) {}
    }
    setShareNotice(`Recorded Phase 3 Decision: ${label}`)
    setTimeout(() => setShareNotice(''), 3500)
  }

  const formatDecisionDate = (isoStr) => {
    if (!isoStr) return 'Recent checkpoint'
    try {
      const d = new Date(isoStr)
      if (isNaN(d.getTime())) return String(isoStr)
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    } catch {
      return String(isoStr)
    }
  }

  const openPhaseStep = (stepId) => {
    const sId = stepId || 'plan'
    setSelectedPhaseStep(sId)
    setShowPhaseExecutionModal(true)
    try {
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href)
        url.searchParams.set('step', sId)
        window.history.replaceState({}, '', url.toString())
      }
    } catch (e) {}
  }

  const closePhaseModal = () => {
    setShowPhaseExecutionModal(false)
    try {
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href)
        url.searchParams.delete('step')
        url.searchParams.delete('modal')
        window.history.replaceState({}, '', url.toString())
      }
    } catch (e) {}
  }

  const [previewingFile, setPreviewingFile] = useState(null)
  const defaultScheduleTasks = [
    { id: 'day-1', day: 1, title: 'Post Instagram Story #1: The Problem Teaser', channel: 'Instagram Stories', done: true, role: 'Creator Task' },
    { id: 'day-2', day: 2, title: 'Post Instagram Story #2: Behind-The-Scenes Co-Founding', channel: 'Instagram Stories', isToday: true, done: false, role: 'Creator Task' },
    { id: 'day-3', day: 3, title: 'YouTube Video Integration Script (60s Mid-Roll)', channel: 'YouTube / Video', done: false, role: 'Creator Task' },
    { id: 'day-4', day: 4, title: 'Newsletter Broadcast: Founding Cohort Announcement', channel: 'Email Newsletter', done: false, role: 'Creator Task' },
    { id: 'day-5', day: 5, title: 'X / Twitter Breakdown Thread', channel: 'Twitter / X', done: false, role: 'Creator Task' },
    { id: 'day-6', day: 6, title: 'Post Instagram Story #3: Live Backer Progress', channel: 'Instagram Stories', done: false, role: 'Creator Task' },
    { id: 'day-7', day: 7, title: 'Community Post & Final Call', channel: 'All Channels', done: false, role: 'Creator Task' }
  ]

  const checklistTasks = (project.campaignKit?.postingSchedule?.length > 0
    ? project.campaignKit.postingSchedule
    : (project.creatorTasks?.length > 0
      ? project.creatorTasks
      : (project.checklist?.length > 0 ? project.checklist : defaultScheduleTasks)))

  const rawActivity = project.activityLogs || project.adminActivity || project.aiActivity || []
  const aiActivityList = Array.isArray(rawActivity) ? rawActivity : []
  const messagesList = project.messages || []
  const rawDecisions = project.decisions || project.gateDecisions || []
  const baseDecisionsList = Array.isArray(rawDecisions) ? [...rawDecisions] : []
  const decisionsList = (() => {
    const list = [...baseDecisionsList]
    if (project.decisionNotice && !list.some(d => d.decision?.includes('phase3') || d.decision?.includes('scale') || d.notes === project.decisionNotice)) {
      list.unshift({
        id: 'active_phase3_decision',
        decision: project.decisionNotice.toLowerCase().includes('scale') ? 'phase3_scale' : project.decisionNotice.toLowerCase().includes('iterate') ? 'phase3_iterate' : project.decisionNotice.toLowerCase().includes('maintain') ? 'phase3_maintain' : 'phase3_decision',
        phase: 3,
        title: project.decisionNotice.toLowerCase().includes('scale') ? 'Phase 3 Launch: Scale Commercial Growth (Active)' : project.decisionNotice.toLowerCase().includes('iterate') ? 'Phase 3 Launch: Iterate Funnel & CRO (Active)' : project.decisionNotice.toLowerCase().includes('maintain') ? 'Phase 3 Launch: Maintain Steady-State Ops (Active)' : 'Phase 3 Launch: Commercial Decision (Active)',
        gateStatus: project.decisionNotice.toLowerCase().includes('scale') ? 'passed' : project.decisionNotice.toLowerCase().includes('iterate') ? 'iterating' : 'maintaining',
        notes: project.decisionNotice,
        decidedAt: new Date().toISOString()
      })
    }
    return list
  })()

  // Phase 1, Phase 2, and Phase 3 Database-Driven Step Guards
  const p1Guards = getPhase1StepGuards(project)
  const p2Guards = getPhase2StepGuards(project)
  const p3Guards = getPhase3StepGuards(project)

  const presaleGoal = p1Guards.presaleGoal
  const backersCount = Array.isArray(project.reservations) ? project.reservations.length : Number(project.telemetry?.presalesCount || 0)
  const currentPresales = p1Guards.currentPresales
  const conversionRate = Number(project.conversionRate || (Number(project.visitors || 0) > 0 ? (backersCount / Number(project.visitors)) * 100 : 0))
  const isGatePassed = p1Guards.isGatePassed

  // Step Completion Guards
  const isStep1Done = p1Guards.isStep1Done
  const isStep2Done = p1Guards.isStep2Done
  const isStep3Done = p1Guards.isStep3Done
  const isStep4Done = p1Guards.isStep4Done
  const isStep5Done = p1Guards.isStep5Done

  const isLiveLaunch = Boolean(
    project.launchStatus === 'LIVE' ||
    project.isLive === true ||
    project.status === 'LIVE' ||
    Boolean(project.phase3Strategy?.productionLive === true)
  )

  const isP1Done = isGatePassed

  const isP2Done = Boolean(
    project.p2Complete === true ||
    project.readinessReport?.greenlight === true ||
    project.gateDecisions?.some(d => d.decision === 'greenlight_launch' || d.decision === 'pass_to_phase3' || (d.phase === 2 && d.gateStatus === 'passed')) ||
    (Array.isArray(project.engineeringTasks) && project.engineeringTasks.length > 0 && project.engineeringTasks.every(t => t.status === 'Completed' || t.status === 'done'))
  )

  const isP3Done = Boolean(
    project.p3Complete === true ||
    project.gateDecisions?.some(d => String(d.decision).startsWith('phase3_')) ||
    Boolean(project.launchReport?.score && project.decisionNotice)
  )

  const activePhaseTasks = currentPhase === 3
    ? ((project.phase3Strategy?.opsChecklist || []).concat(project.phase3Strategy?.creatorChecklist || []).length > 0
        ? (project.phase3Strategy?.opsChecklist || []).concat(project.phase3Strategy?.creatorChecklist || [])
        : checklistTasks)
    : currentPhase === 2
    ? (Array.isArray(project.engineeringTasks) && project.engineeringTasks.length > 0 ? project.engineeringTasks : checklistTasks)
    : checklistTasks

  return (
    <div className="space-y-6 w-full max-w-full">
      {/* SECTION 2 HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-400">
              SECTION 2
            </span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs font-bold text-white bg-white/[0.06] px-2 py-0.5 rounded-full border border-white/10">
              {cleanProductName}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mt-0.5">
            CO-LAUNCH PROJECT OS
          </h1>
          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
            <span>Co-Founding Partner:</span>
            <strong className="text-emerald-400 font-bold">{cleanCreatorName}</strong>
            <span className="text-slate-500">({cleanCreatorHandle})</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-300 italic">"{cleanTagline}"</span>
          </p>
        </div>

        {/* Right CTA / Portal Quick Button */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <a
            href={portalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-slate-200 border border-white/[0.08] text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <Rocket className="w-3.5 h-3.5 text-purple-400" />
            <span>Co-Founder Portal</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>

          <button
            onClick={() => setShowShareModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer whitespace-nowrap active:scale-95"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share Portal</span>
          </button>

          {onResetProject && (
            <button
              onClick={() => {
                if (window.confirm('Reset this co-launch project and return to Section 1?')) {
                  onResetProject()
                }
              }}
              className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap active:scale-95"
              title="Reset project and return to Section 1"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Reset Project</span>
            </button>
          )}
        </div>
      </div>

      {/* 2-COLUMN MAIN LAYOUT */}
      <div className="flex flex-col lg:flex-row gap-5 items-start w-full">
        {/* LEFT / CENTER: PROJECT COMMAND CENTER */}
        <div className="flex-1 min-w-0 space-y-4 w-full">
          <div className="rounded-2xl bg-[#0e1117] border border-white/[0.1] shadow-xl flex flex-col md:flex-row min-h-[520px] items-stretch">
            {/* Left Mini Sidebar (Compact horizontal rail on mobile, sticky sidebar on desktop) */}
            <div className="w-full md:w-48 bg-[#0a0c10] border-b md:border-b-0 md:border-r border-white/[0.08] p-2 sm:p-3.5 flex flex-row md:flex-col justify-between items-center md:items-stretch gap-2 shrink-0 md:sticky md:top-20 md:self-start md:h-[520px] rounded-t-2xl md:rounded-tr-none md:rounded-l-2xl z-10 overflow-x-auto scrollbar-none">
              <div className="flex md:flex-col items-center md:items-stretch gap-1 overflow-x-auto scrollbar-none shrink-0">
                <div className="hidden md:block px-2.5 py-1.5 text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
                  Command Center
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
                      className={`flex items-center gap-1.5 sm:gap-2.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                        isActive
                          ? 'bg-white/10 text-white shadow-sm border border-white/10 font-bold'
                          : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span>{tab.label}</span>
                    </button>
                  )
                })}
              </div>

              {/* ACTIVE PHASE PINNED TO BOTTOM ON DESKTOP, INLINE ON MOBILE */}
              <div className="md:mt-auto md:pt-3 shrink-0">
                <div className="p-1 sm:p-3 rounded-xl sm:rounded-2xl bg-white/[0.03] border border-white/[0.08] text-center flex md:flex-col items-center gap-1.5 sm:gap-2">
                  <span className="hidden md:block text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    {isLiveLaunch ? '🚀 Live Launch' : 'Active Phase'}
                  </span>
                  <div className="flex items-center justify-center gap-1">
                    {[1, 2, 3].map(p => {
                      const isDone = p === 1 ? isP1Done : p === 2 ? isP2Done : isP3Done
                      return (
                        <button
                          key={p}
                          onClick={() => setSelectedPhaseTab(p)}
                          className={`relative w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center ${
                            currentPhase === p
                              ? p === 2
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                                : p === 3
                                ? isLiveLaunch
                                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/50'
                                  : 'bg-purple-600 text-white shadow-md shadow-purple-900/40'
                                : 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
                              : isDone
                              ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20'
                              : 'bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08]'
                          }`}
                          title={`Switch to Phase ${p}${isDone ? ' (Completed)' : ''}`}
                        >
                          <span className={isDone ? 'text-slate-200 font-black' : ''}>
                            P{p}
                          </span>
                          {isDone && (
                            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-[8px] font-black shadow-xs">
                              ✓
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                  <span className="hidden md:flex text-[10px] font-extrabold text-white items-center justify-center gap-1.5 pt-0.5">
                    {isLiveLaunch ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        <span className="text-emerald-400">Live Launch ✓</span>
                      </>
                    ) : currentPhase === 1 ? (
                      'Phase 1: Validate'
                    ) : currentPhase === 2 ? (
                      'Phase 2: Build MVP'
                    ) : (
                      'Phase 3: Launch'
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Main Command Center Inner Area */}
            <div className="flex-1 min-w-0 p-5 sm:p-6 space-y-5 bg-[#0e1117] overflow-x-hidden">
              {/* Header inside Command Center */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                      <span>{cleanProductName}</span>
                      <span className="text-slate-400 font-normal">×</span>
                      <span className="truncate">{cleanCreatorName}</span>
                    </h2>
                    {project.pricing && (
                      <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 shadow-xs whitespace-nowrap shrink-0">
                        {project.pricing}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 mt-1 line-clamp-1 max-w-2xl">
                    {cleanTagline}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap shadow-xs flex items-center gap-1.5 ${
                    isLiveLaunch
                      ? 'text-emerald-300 bg-emerald-500/20 border border-emerald-500/40 shadow-emerald-950/50'
                      : currentPhase === 2
                      ? 'text-blue-400 bg-blue-500/10 border border-blue-500/20'
                      : currentPhase === 3
                      ? 'text-purple-400 bg-purple-500/10 border border-purple-500/20'
                      : 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                  }`}>
                    {isLiveLaunch ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>🚀 Live Launch</span>
                      </>
                    ) : currentPhase === 1 ? (
                      'Phase 1: Validate'
                    ) : currentPhase === 2 ? (
                      'Phase 2: Build MVP'
                    ) : (
                      'Phase 3: Launch'
                    )}
                  </span>
                </div>
              </div>

              {/* OVERVIEW TAB CONTENT */}
              {sidebarTab === 'overview' && (
                <div className="space-y-5 animate-fade-in">
                  {/* Top 4 KPI Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    {/* 1. Presales / Live Revenue */}
                    <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.08] space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        {currentPhase === 3 ? 'Live Revenue' : 'Presales'}
                      </span>
                      <div className="text-lg sm:text-xl font-extrabold text-white">
                        ${presalesRevenue.toLocaleString()}
                      </div>
                      <span className="text-[10px] text-slate-400 block">
                        {currentPhase === 3 ? 'Total processed revenue' : `of $${presaleTarget.toLocaleString()} goal`}
                      </span>
                      <div className="w-full bg-white/[0.06] rounded-full h-1.5 overflow-hidden mt-1">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${presaleTarget > 0 ? Math.min(100, Math.round((presalesRevenue / presaleTarget) * 100)) : 100}%` }}
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
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        {currentPhase === 3 ? 'Paid Conversion' : 'Conversion'}
                      </span>
                      <div className="text-lg sm:text-xl font-extrabold text-white">
                        {conversionRate.toFixed(1)}%
                      </div>
                      <span className="text-[10px] text-slate-500">Tracked rate</span>
                    </div>

                    {/* 4. Days Left / Production Status */}
                    <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.08] space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        {isLiveLaunch ? 'Production Status' : 'Days Left'}
                      </span>
                      <div className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-1.5">
                        {isLiveLaunch ? (
                          <>
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                            <span className="text-emerald-400">Live</span>
                          </>
                        ) : (
                          daysLeft
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {isLiveLaunch ? '99.98% Uptime • Live Funnel' : 'Validation window'}
                      </span>
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
                            <span>
                              {currentPhase === 3 ? 'Launch & Growth Tasks' : currentPhase === 2 ? 'MVP Engineering Tasks' : 'Validation Sprint Tasks'}
                            </span>
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono font-bold bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.06]">
                            {activePhaseTasks.length} total
                          </span>
                        </div>
                        {activePhaseTasks.length === 0 ? (
                          <div className="py-3 text-center text-slate-400 text-xs space-y-1">
                            <p className="text-slate-300 font-medium">No tasks logged yet</p>
                            <p className="text-[10px] text-slate-500">Tasks generate automatically during this phase.</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {activePhaseTasks.slice(0, 3).map((task, idx) => (
                              <div key={idx} className="flex items-center justify-between text-slate-200">
                                <span className="flex items-center gap-2 truncate">
                                  <span>{task.done || task.completed || task.status === 'Completed' ? '✅' : '📍'}</span>
                                  <span className={`font-medium truncate ${task.done || task.completed || task.status === 'Completed' ? 'line-through text-slate-400' : ''}`}>
                                    {task.title || task.name || task.text}
                                  </span>
                                </span>
                                <span className="text-[11px] text-slate-400 shrink-0 ml-2">
                                  {task.due || (task.done || task.completed || task.status === 'Completed' ? 'Done' : 'Pending')}
                                </span>
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
                            {aiActivityList.slice(0, 4).map((act, idx) => {
                              const title = typeof act === 'string' ? act : (act.action || act.message || 'System Action')
                              const details = typeof act === 'object' ? (act.details || '') : ''
                              return (
                                <div key={idx} className="flex items-start gap-2 py-0.5">
                                  <span className="text-purple-400 font-bold shrink-0">•</span>
                                  <div className="min-w-0">
                                    <span className="font-medium text-slate-200 block truncate">{title}</span>
                                    {details && <span className="text-[10px] text-slate-400 block truncate">{details}</span>}
                                  </div>
                                </div>
                              )
                            })}
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
                      {checklistTasks.map((task, idx) => {
                        const isDone = Boolean(task.done || task.completed)
                        const isToday = Boolean(task.isToday || (!isDone && task.day === 2))
                        return (
                          <div
                            key={task.id || idx}
                            onClick={() => openPhaseStep('campaign')}
                            className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer group ${
                              isDone
                                ? 'bg-[#0e1117] border-white/[0.04] opacity-80'
                                : isToday
                                ? 'bg-[#151926] border-purple-500/40 shadow-sm shadow-purple-950/40'
                                : 'bg-[#141720] border-white/[0.06] hover:border-white/15'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                                isDone
                                  ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                                  : isToday
                                  ? 'border-purple-400 bg-purple-500/20 text-purple-300'
                                  : 'border-white/20 bg-white/[0.02]'
                              }`}>
                                {isDone ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : isToday ? <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" /> : null}
                              </div>
                              <div className="min-w-0">
                                <div className={`font-semibold text-xs truncate ${isDone ? 'line-through text-slate-400' : 'text-white'}`}>
                                  {task.title || task.text}
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[10px] text-purple-300/80 font-mono">{task.channel || task.role || 'Sprint Task'}</span>
                                  <span className="text-[10px] text-slate-500">•</span>
                                  <span className="text-[10px] text-slate-400 font-mono">Day {task.day || idx + 1}</span>
                                </div>
                              </div>
                            </div>
                            <div className="shrink-0">
                              {isDone ? (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                  ✓ Done
                                </span>
                              ) : isToday ? (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 animate-pulse">
                                  🔥 Today's Mission
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono text-slate-400 bg-white/[0.04] border border-white/[0.08]">
                                  Queued
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })}
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

              {/* FILES TAB — INTERACTIVE CODEBASE & REPOSITORY EXPLORER */}
              {sidebarTab === 'files' && (
                <div className="space-y-4 animate-fade-in text-xs">
                  <ProjectFileExplorer
                    project={project}
                    onUpdateProject={onUpdateProject}
                    currentPhase={currentPhase}
                  />
                </div>
              )}

              {/* MESSAGES TAB */}
              {sidebarTab === 'messages' && (
                <div className="space-y-3 animate-fade-in text-xs">
                  <CreatorWhatsAppChat
                    project={project}
                    onUpdateProject={onUpdateProject}
                  />
                </div>
              )}

              {/* DECISIONS TAB */}
              {sidebarTab === 'decisions' && (
                <div className="space-y-4 animate-fade-in text-xs">
                  {/* Dynamic Validation Gate Metrics */}
                  {(() => {
                    const parseThreshold = (str) => {
                      if (!str) return 0
                      const match = String(str).replace(/,/g, '').match(/\$(\d+)/)
                      return match ? Number(match[1]) : 0
                    }
                    const derivedGoal = parseThreshold(project.validationPlan?.threshold)
                    const presaleGoal = derivedGoal > 0 ? derivedGoal : Number(project.presaleTarget || project.targetRevenue || 5000)
                    const backersCount = Array.isArray(project.reservations) ? project.reservations.length : Number(project.telemetry?.presalesCount || 0)
                    const currentPresales = Number(String(project.currentPresales || 0).replace(/[^0-9.]/g, '')) || (project.reservations || []).reduce((acc, r) => acc + (Number(r.amount) || 0), 0)
                    const conversionRate = Number(project.conversionRate || (Number(project.visitors || 0) > 0 ? (backersCount / Number(project.visitors)) * 100 : 0))
                    const isRevenueGoalMet = presaleGoal > 0 && currentPresales >= presaleGoal
                    const isFounderApproved = Number(project.currentPhase || 1) > 1 || project.status === 'building'
                    const isGatePassed = isRevenueGoalMet || isFounderApproved

                    return (
                      <>
                        {/* Executive Header */}
                        <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-purple-950/20 via-white/[0.02] to-transparent p-4 rounded-2xl border border-white/[0.08]">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 shadow-lg shadow-purple-950/40">
                              <ShieldCheck className="w-4.5 h-4.5" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-extrabold text-white text-sm tracking-tight">
                                  Decisions Requiring Human Approval
                                </h3>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0">
                                  {decisionViewPhase === 3 ? 'Phase 3 Milestone' : decisionViewPhase === 2 ? 'Phase 2 Milestone' : 'Phase 1 Milestone'}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                Executive gate reviews, scaling trajectory & co-founder milestone decisions.
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.03] border border-white/[0.08] shrink-0">
                            <button
                              type="button"
                              onClick={() => setDecisionViewPhase(3)}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                decisionViewPhase === 3
                                  ? 'bg-purple-600 text-white shadow-sm shadow-purple-900/40'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              🚀 Phase 3 Launch
                            </button>
                            <button
                              type="button"
                              onClick={() => setDecisionViewPhase(2)}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                decisionViewPhase === 2
                                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-900/40'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              ⚙️ Phase 2 MVP
                            </button>
                            <button
                              type="button"
                              onClick={() => setDecisionViewPhase(1)}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                decisionViewPhase === 1
                                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-900/40'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              📊 Phase 1 Validate
                            </button>
                          </div>
                        </div>

                        {/* ── PHASE 3 COMMERCIAL DECISION GATE ── */}
                        {decisionViewPhase === 3 && (
                          <div className="relative rounded-2xl bg-gradient-to-b from-[#121624] via-[#0d101a] to-[#080a0f] border border-purple-500/30 p-4 sm:p-5 space-y-4 shadow-2xl shadow-purple-950/30 overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-purple-500 via-indigo-500 to-emerald-400" />

                            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 border-b border-white/[0.06] pb-3.5">
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0">
                                  <Rocket className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="font-extrabold text-white text-sm tracking-tight">
                                      Phase 3: Launch Report & Scaling Decision Gate
                                    </h4>
                                    <span className="text-[9px] font-mono font-bold text-purple-300 uppercase px-2 py-0.5 rounded-md bg-purple-500/15 border border-purple-500/30 shrink-0">
                                      Commercial Gate
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-400 mt-0.5">
                                    Autonomous Telemetry Evaluation & Post-Launch Human Decision (Scale / Iterate / Maintain / Kill)
                                  </p>
                                </div>
                              </div>
                              <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${
                                project?.decisionNotice
                                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                                  : isLiveLaunch
                                  ? 'bg-purple-500/15 text-purple-300 border-purple-500/40'
                                  : 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                              }`}>
                                {project?.decisionNotice ? (
                                  <>
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                    <span>Decision Recorded</span>
                                  </>
                                ) : isLiveLaunch ? (
                                  <>
                                    <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                                    <span>Production Live</span>
                                  </>
                                ) : (
                                  <>
                                    <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                    <span>Pre-Launch Prep</span>
                                  </>
                                )}
                              </span>
                            </div>

                            {/* Active Decision Trajectory Notice */}
                            {project?.decisionNotice ? (
                              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/15 via-emerald-500/10 to-teal-500/15 border border-emerald-500/30 space-y-1.5 text-xs">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>Active Human Strategic Decision</span>
                                  </span>
                                  <span className="text-[10px] text-emerald-300/80 font-mono">Recorded in Launch OS</span>
                                </div>
                                <p className="text-xs font-bold text-white leading-relaxed">{project.decisionNotice}</p>
                              </div>
                            ) : (
                              <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/30 space-y-1 text-xs">
                                <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-purple-300 uppercase tracking-wider">
                                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                                  <span>Executive Co-Founder Choice Required</span>
                                </div>
                                <p className="text-[11px] text-purple-200 leading-relaxed">
                                  Review launch performance below and choose an operating path: <strong>Scale</strong>, <strong>Iterate</strong>, <strong>Maintain</strong>, or <strong>Kill</strong>.
                                </p>
                              </div>
                            )}

                            {/* Telemetry 4-Cards Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.08] hover:border-white/15 transition-all flex flex-col justify-between">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Live Revenue</span>
                                <div className="text-base font-black text-emerald-400 my-1">
                                  ${(Number(project.telemetry?.revenue || presalesRevenue || 0)).toLocaleString()}
                                </div>
                                <span className="text-[9px] text-slate-500 block">Total processed</span>
                              </div>
                              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.08] hover:border-purple-500/30 transition-all flex flex-col justify-between">
                                <span className="text-[9px] font-bold text-purple-300 uppercase tracking-wider block">Paying Backers</span>
                                <div className="text-base font-black text-purple-300 my-1">
                                  {project.telemetry?.customers || backersCount || 0}
                                </div>
                                <span className="text-[9px] text-purple-400/80 block">Active customers</span>
                              </div>
                              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.08] hover:border-blue-500/30 transition-all flex flex-col justify-between">
                                <span className="text-[9px] font-bold text-blue-300 uppercase tracking-wider block">Conversion Rate</span>
                                <div className="text-base font-black text-blue-300 my-1">
                                  {conversionRate.toFixed(1)}%
                                </div>
                                <span className="text-[9px] text-blue-400/80 block">Visitor-to-paid</span>
                              </div>
                              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.08] hover:border-emerald-500/30 transition-all flex flex-col justify-between">
                                <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider block">Technical Health</span>
                                <div className="text-base font-black text-emerald-300 my-1">
                                  99.98%
                                </div>
                                <span className="text-[9px] text-emerald-400/80 block">&lt;150ms latency</span>
                              </div>
                            </div>

                            {/* AI Executive Assessment */}
                            <div className="p-3.5 rounded-xl bg-gradient-to-r from-purple-950/30 via-indigo-950/20 to-purple-950/10 border border-purple-500/30 space-y-1.5 text-slate-200">
                              <div className="flex flex-wrap items-center justify-between gap-1.5">
                                <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
                                  <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                                  <span>AI Launch Report Milestone Assessment</span>
                                </div>
                                <span className="text-[9px] font-mono text-emerald-300 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 shrink-0">
                                  Recommended: SCALE (Score 96/100)
                                </span>
                              </div>
                              <p className="text-[11px] leading-relaxed text-slate-300">
                                Instagram Stories is currently the top-performing acquisition channel at <strong>8.2% paid conversion</strong> (3.9x higher than email newsletter at <strong>2.1%</strong>). With zero critical technical exceptions and sub-150ms latency, the venture has demonstrated product-market fit and is primed for accelerated scaling.
                              </p>
                            </div>
                          </div>
                        )}

                        {/* ── PHASE 2 MVP LAUNCH GATE ── */}
                        {decisionViewPhase === 2 && (
                          <div className="relative rounded-2xl bg-gradient-to-b from-[#121624] via-[#0d101a] to-[#080a0f] border border-blue-500/30 p-4 sm:p-5 space-y-4 shadow-2xl shadow-blue-950/30 overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400" />

                            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 border-b border-white/[0.06] pb-3.5">
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-300 shrink-0">
                                  <Zap className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="font-extrabold text-white text-sm tracking-tight">
                                      Phase 2: MVP Launch Gate & Readiness Checkpoint
                                    </h4>
                                    <span className="text-[9px] font-mono font-bold text-blue-300 uppercase px-2 py-0.5 rounded-md bg-blue-500/15 border border-blue-500/30 shrink-0">
                                      Engineering Gate
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-400 mt-0.5">
                                    Code Build Verification, QA Test Suite Execution & Production Deployment Clearance
                                  </p>
                                </div>
                              </div>
                              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border shrink-0 bg-blue-500/15 text-blue-300 border-blue-500/40">
                                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                <span>MVP Built & Verified</span>
                              </span>
                            </div>

                            <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-200 leading-relaxed">
                              Engineering tasks and QA testing have confirmed readiness. Commercial launch clearance verified for Phase 3.
                            </div>
                          </div>
                        )}

                        {/* ── PHASE 1 VALIDATION GATE CHECKPOINT ── */}
                        {decisionViewPhase === 1 && (
                          <div className="relative rounded-2xl bg-gradient-to-b from-[#121624] via-[#0d101a] to-[#080a0f] border border-white/[0.12] p-4 sm:p-5 space-y-4 shadow-2xl shadow-purple-950/30 overflow-hidden">
                            {/* Top Accent Gradient Bar */}
                            <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-purple-500 via-indigo-500 to-emerald-400" />

                            {/* Card Title & Checkpoint Badge */}
                            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 border-b border-white/[0.06] pb-3.5">
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0">
                                  <Flag className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="font-extrabold text-white text-sm tracking-tight">
                                      5. Validation Gate Checkpoint
                                    </h4>
                                    <span className="text-[9px] font-mono font-bold text-purple-300 uppercase px-2 py-0.5 rounded-md bg-purple-500/15 border border-purple-500/30 shrink-0">
                                      Executive Gate
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-400 mt-0.5">
                                    Pre-Order Demand & Willingness-to-Pay Threshold
                                  </p>
                                </div>
                              </div>
                              <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${
                                isRevenueGoalMet
                                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                                  : isFounderApproved
                                  ? 'bg-blue-500/15 text-blue-300 border-blue-500/40'
                                  : 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                              }`}>
                                {isRevenueGoalMet ? (
                                  <>
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                    <span>Validated</span>
                                  </>
                                ) : isFounderApproved ? (
                                  <>
                                    <Zap className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                    <span>Sprint Active</span>
                                  </>
                                ) : (
                                  <>
                                    <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                    <span>Validating</span>
                                  </>
                                )}
                              </span>
                            </div>

                            {/* Telemetry 4-Cards Cohesive Grid */}
                            <div className="grid grid-cols-2 gap-2.5 text-center">
                              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.08] hover:border-white/15 transition-all flex flex-col justify-between">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Target Goal</span>
                                <div className="text-base font-black text-white my-1">
                                  ${presaleGoal.toLocaleString()}
                                </div>
                                <span className="text-[9px] text-slate-500 block">Presale threshold</span>
                              </div>
                              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.08] hover:border-emerald-500/30 transition-all flex flex-col justify-between">
                                <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider block">Actual Revenue</span>
                                <div className="text-base font-black text-emerald-300 my-1">
                                  ${currentPresales.toLocaleString()}
                                </div>
                                <span className="text-[9px] text-emerald-400/80 font-medium block">
                                  {backersCount} paying backer{backersCount === 1 ? '' : 's'}
                                </span>
                              </div>
                              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.08] hover:border-purple-500/30 transition-all flex flex-col justify-between">
                                <span className="text-[9px] font-bold text-purple-300 uppercase tracking-wider block">Conversion Rate</span>
                                <div className="text-base font-black text-purple-300 my-1">
                                  {conversionRate.toFixed(1)}%
                                </div>
                                <span className="text-[9px] text-purple-400/70 block">Traffic-to-order</span>
                              </div>
                              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.08] hover:border-white/15 transition-all flex flex-col justify-between">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Gate Status</span>
                                <div className={`text-base font-black my-1 ${
                                  isRevenueGoalMet ? 'text-emerald-400' : isFounderApproved ? 'text-blue-400' : 'text-amber-400'
                                }`}>
                                  {isRevenueGoalMet ? 'PASSED' : isFounderApproved ? 'APPROVED' : 'IN PROGRESS'}
                                </div>
                                <span className="text-[9px] text-slate-400 block">
                                  {isRevenueGoalMet ? 'Threshold Met' : isFounderApproved ? 'Phase 2 Sprint' : 'Testing Demand'}
                                </span>
                              </div>
                            </div>

                            {/* Sleek Progress Bar */}
                            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2">
                              <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs">
                                <span className="text-slate-300 font-semibold">Progress Toward Gate</span>
                                <span className="font-mono font-bold text-[11px] text-white bg-white/[0.05] px-2 py-0.5 rounded-md border border-white/[0.08]">
                                  ${currentPresales.toLocaleString()} / ${presaleGoal.toLocaleString()} • {presaleGoal > 0 ? Math.min(100, Math.round((currentPresales / presaleGoal) * 100)) : 0}%
                                </span>
                              </div>
                              <div className="w-full bg-[#06080d] rounded-full h-2.5 overflow-hidden p-0.5 border border-white/[0.08]">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    isRevenueGoalMet
                                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-sm shadow-emerald-500/50'
                                      : isFounderApproved
                                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 shadow-sm shadow-blue-500/50'
                                      : 'bg-gradient-to-r from-purple-500 via-indigo-500 to-amber-500'
                                  }`}
                                  style={{ width: `${presaleGoal > 0 ? Math.min(100, Math.max(currentPresales > 0 ? 3 : 0, Math.round((currentPresales / presaleGoal) * 100))) : 0}%` }}
                                />
                              </div>
                            </div>

                            {/* AI Validation Co-Pilot Assessment */}
                            <div className="p-3.5 rounded-xl bg-gradient-to-r from-purple-950/30 via-indigo-950/20 to-purple-950/10 border border-purple-500/30 space-y-2 text-slate-200">
                              <div className="flex flex-wrap items-center justify-between gap-1.5">
                                <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
                                  <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                                  <span>AI Executive Assessment</span>
                                </div>
                                <span className="text-[9px] font-mono text-purple-300/80 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20 shrink-0">
                                  Verified
                                </span>
                              </div>
                              <p className="text-[11px] leading-relaxed text-slate-300">
                                {isRevenueGoalMet ? (
                                  <span>
                                    🔥 <strong className="text-white">Target Reached:</strong> Presale target (<strong className="text-emerald-300">${presaleGoal.toLocaleString()}</strong>) validated with <strong className="text-emerald-300">${currentPresales.toLocaleString()}</strong> across <strong className="text-white">{backersCount}</strong> backer{backersCount === 1 ? '' : 's'} (<strong className="text-purple-300">{conversionRate.toFixed(1)}%</strong> conv.). Recommending <strong className="text-emerald-300">Build MVP</strong> for Phase 2.
                                  </span>
                                ) : isFounderApproved ? (
                                  <span>
                                    🚀 <strong className="text-white">Founder Greenlit:</strong> Approved for <strong className="text-blue-300">Phase 2: Build MVP</strong> with <strong className="text-emerald-300">${currentPresales.toLocaleString()}</strong> presale revenue, <strong className="text-white">{backersCount}</strong> backer{backersCount === 1 ? '' : 's'} (<strong className="text-purple-300">{conversionRate.toFixed(1)}%</strong> conv.). Pre-orders remain open during development.
                                  </span>
                                ) : (
                                  <span>
                                    📊 <strong className="text-white">Validation Underway:</strong> <strong className="text-emerald-300">${currentPresales.toLocaleString()}</strong> in pre-orders, <strong className="text-white">{backersCount}</strong> backer{backersCount === 1 ? '' : 's'} (<strong className="text-purple-300">{conversionRate.toFixed(1)}%</strong> conv.) toward <strong className="text-white">${presaleGoal.toLocaleString()}</strong> target ({presaleGoal > 0 ? Math.min(100, Math.round((currentPresales / presaleGoal) * 100)) : 0}%). Continue campaigns or execute a gate decision below.
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        )}
                      </>
                    )
                  })()}

                  {/* RECORDED DECISION LOGS & AUDIT TRAIL */}
                  <div className="space-y-2.5 pt-2 border-t border-white/[0.08]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                          Decision History & Gate Audit Trail
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 bg-white/[0.03] px-2 py-0.5 rounded border border-white/[0.06]">
                        {decisionsList.length} recorded
                      </span>
                    </div>

                    {decisionsList.length === 0 ? (
                      <div className="p-4 rounded-xl bg-[#141720]/60 border border-white/[0.06] text-center text-slate-400 text-xs">
                        No decisions logged yet. Executive gate actions recorded above will appear here.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {decisionsList.map((d, i) => {
                          const isScale = d.decision?.includes('scale') || d.title?.toLowerCase().includes('scale')
                          const isIterate = d.decision === 'iterate_validation' || d.gateStatus === 'iterating' || d.decision?.includes('iterate')
                          const isMaintain = d.decision?.includes('maintain')
                          const isKilled = d.decision === 'kill' || d.decision === 'kill_project' || d.gateStatus === 'killed'
                          const isPassed = d.decision === 'pass_to_phase2' || d.gateStatus === 'passed' || isScale || isMaintain
                          return (
                            <div key={d.id || i} className="p-3.5 rounded-xl bg-[#141720] border border-white/[0.08] space-y-1.5 hover:border-white/15 transition-colors">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className={`w-2 h-2 rounded-full shrink-0 ${isScale ? 'bg-purple-400' : isPassed ? 'bg-emerald-400' : isIterate ? 'bg-amber-400' : 'bg-rose-400'}`} />
                                  <span className="font-bold text-white text-xs truncate">
                                    {formatDecisionTitle(d)}
                                  </span>
                                </div>
                                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${
                                  isScale
                                    ? 'text-purple-300 bg-purple-500/15 border-purple-500/30'
                                    : isPassed
                                    ? 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30'
                                    : isIterate
                                    ? 'text-amber-300 bg-amber-500/15 border-amber-500/30'
                                    : 'text-rose-300 bg-rose-500/15 border-rose-500/30'
                                }`}>
                                  {isScale
                                    ? '🚀 Scale Mode Active'
                                    : isMaintain
                                    ? '🛡️ Steady-State'
                                    : isPassed
                                    ? 'Approved & Passed'
                                    : isIterate
                                    ? 'Iteration Sprint'
                                    : isKilled
                                    ? 'Archived'
                                    : d.status || 'Decided'}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-300 leading-relaxed">{d.notes || d.description || 'Executive co-founder decision recorded.'}</p>
                              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/[0.04] text-[10px] text-slate-500 font-mono">
                                <span>{formatDecisionDate(d.decidedAt || d.timestamp || d.date)}</span>
                                {(d.achievedRevenue !== undefined || d.targetRevenue !== undefined) && (
                                  <span className="text-slate-400 font-sans">
                                    ${(Number(d.achievedRevenue) || 0).toLocaleString()} / ${(Number(d.targetRevenue) || presaleGoal).toLocaleString()} Presales
                                  </span>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
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

        {/* RIGHT PANEL: PHASE 1 / PHASE 2 / PHASE 3 WORKSPACE (STICKY) */}
        <div className="w-full lg:w-[310px] xl:w-[330px] shrink-0 rounded-2xl bg-[#0e1117] border border-white/[0.1] p-4 sm:p-4.5 space-y-3.5 shadow-xl lg:sticky lg:top-20 lg:self-start">
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
                    icon: FileText,
                    isDone: p2Guards.isStep1Done
                  },
                  {
                    id: 'build',
                    num: '2. Engineering Build',
                    desc: 'FastAPI backend, React frontend, database migrations, and async AI worker pipeline',
                    icon: Terminal,
                    isDone: p2Guards.isStep2Done
                  },
                  {
                    id: 'beta',
                    num: '3. Beta Testing',
                    desc: `Invite ${Array.isArray(project?.reservations) ? project.reservations.length : 0} founding pre-order backers for private beta QA`,
                    icon: Laptop,
                    isDone: p2Guards.isStep3Done
                  },
                  {
                    id: 'gate',
                    num: '4. MVP Launch Gate',
                    desc: 'Verify acceptance criteria, zero critical errors, approve & advance to Phase 3',
                    icon: ShieldCheck,
                    isDone: p2Guards.isP2Done
                  },
                ].map(step => {
                  const Icon = step.icon
                  const isDone = step.isDone
                  return (
                    <div
                      key={step.id}
                      onClick={() => openPhaseStep(step.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer group space-y-1 ${
                        isDone
                          ? 'bg-emerald-950/15 border-emerald-500/20 hover:border-emerald-500/40 hover:bg-emerald-950/25'
                          : 'bg-[#141720] hover:bg-[#1b202c] border-white/[0.06] hover:border-blue-500/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 text-xs font-bold transition-colors">
                          {isDone ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : (
                            <Icon className="w-4 h-4 text-blue-400 shrink-0" />
                          )}
                          <span className={isDone ? 'text-slate-200 font-bold' : 'text-white group-hover:text-blue-300'}>
                            {step.num}
                          </span>
                        </div>
                        <span className={`text-[10px] font-bold flex items-center gap-1 ${
                          isDone ? 'text-emerald-400' : 'text-slate-400 group-hover:text-white'
                        }`}>
                          {isDone ? (
                            <>
                              <span>✓ Done</span>
                              <ChevronRight className="w-3 h-3" />
                            </>
                          ) : (
                            <>
                              <span>Open</span>
                              <ChevronRight className="w-3 h-3" />
                            </>
                          )}
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed pl-6 text-slate-400">
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

              {/* 4 Step Cards for Phase 3 */}
              <div className="space-y-2.5">
                {[
                  {
                    id: 'prep',
                    num: '1. Prepare Launch',
                    desc: 'Strategy, channels, offers, creator marketing assets, production infra & verified checklists',
                    icon: Calendar,
                    isDone: Boolean(
                      project?.launchStrategy &&
                      (project.launchStrategy.creatorChecklist || []).length > 0 &&
                      (project.launchStrategy.creatorChecklist || []).every(t => Boolean(t.done)) &&
                      (project.launchStrategy.opsChecklist || []).length > 0 &&
                      (project.launchStrategy.opsChecklist || []).every(t => Boolean(t.done))
                    )
                  },
                  {
                    id: 'monitor',
                    num: '2. Launch + Monitor',
                    desc: 'Live production telemetry, customer conversion funnel, and channel attribution breakdown',
                    icon: TrendingUp,
                    isDone: Boolean(project?.launchStatus === 'LIVE' && ((project?.launchTelemetry?.revenue || 0) > 0 || (project?.launchTelemetry?.customers || 0) > 0))
                  },
                  {
                    id: 'manager',
                    num: '3. AI Launch Manager',
                    desc: 'Autonomous telemetry sweep, growth optimization engine, and real-time CRO interventions',
                    icon: Sparkles,
                    isDone: Boolean(
                      (project?.dispatchedActions || []).length > 0 &&
                      (project?.launchManagerData?.automatedActions || []).length > 0 &&
                      (project.launchManagerData.automatedActions || []).every(a => (project.dispatchedActions || []).includes(a.id))
                    )
                  },
                  {
                    id: 'report',
                    num: '4. Launch Report + Decision',
                    desc: 'Commercial score, CAC economics, executive milestone verdict, and scale/pivot decision gate',
                    icon: ShieldCheck,
                    isDone: Boolean((project?.launchReport?.score || 0) > 0 && project?.decisionNotice)
                  },
                ].map(step => {
                  const Icon = step.icon
                  const isDone = step.isDone
                  return (
                    <div
                      key={step.id}
                      onClick={() => {
                        openPhaseStep(step.id)
                      }}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer group space-y-1 ${
                        isDone
                          ? 'bg-[#141720] hover:bg-[#1b202c] border-emerald-500/30'
                          : 'bg-[#141720] hover:bg-[#1b202c] border-white/[0.06] hover:border-purple-500/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
                          {isDone ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : (
                            <Icon className="w-4 h-4 text-purple-400 shrink-0" />
                          )}
                          <span className={isDone ? 'text-slate-200 font-bold' : ''}>
                            {step.num}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {isDone && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-normal">
                              Done
                            </span>
                          )}
                          <span className="text-[10px] font-bold text-slate-400 group-hover:text-white flex items-center gap-0.5">
                            <span>Open</span>
                            <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed pl-6">
                        {step.desc}
                      </p>
                    </div>
                  )
                })}
              </div>

              <button
                onClick={() => {
                  openPhaseStep('prep')
                }}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-purple-950/40 active:scale-95 cursor-pointer"
              >
                <span>Open Phase 3 Launch Workspace</span>
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
                    icon: FileText,
                    isDone: isStep1Done,
                    borderDone: 'bg-emerald-500/[0.05] border-emerald-500/35 hover:border-emerald-400/60 shadow-sm shadow-emerald-950/20',
                    badgeDone: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
                    iconDoneColor: 'text-emerald-400',
                    badgeText: '✓ Spec & Target Locked'
                  },
                  {
                    id: 'assets',
                    num: '2. Build Validation Assets',
                    desc: 'Landing page, presales, checkout, analytics, emails, discovery surveys',
                    icon: Layout,
                    isDone: isStep2Done,
                    borderDone: 'bg-purple-500/[0.05] border-purple-500/35 hover:border-purple-400/60 shadow-sm shadow-purple-950/20',
                    badgeDone: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
                    iconDoneColor: 'text-purple-400',
                    badgeText: '⚡ Funnel & Prototype Live'
                  },
                  {
                    id: 'campaign',
                    num: '3. Creator Campaign',
                    desc: 'Posts, stories, newsletter, videos, polls, CTAs, images, scripts',
                    icon: Megaphone,
                    isDone: isStep3Done,
                    borderDone: 'bg-blue-500/[0.05] border-blue-500/35 hover:border-blue-400/60 shadow-sm shadow-blue-950/20',
                    badgeDone: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
                    iconDoneColor: 'text-blue-400',
                    badgeText: '📣 7-Day Sprint Active'
                  },
                  {
                    id: 'optimize',
                    num: '4. Run & Optimize',
                    desc: 'Track traffic, presales, revenue, conversion, feedback. AI suggests experiments',
                    icon: TrendingUp,
                    isDone: isStep4Done,
                    borderDone: 'bg-amber-500/[0.05] border-amber-500/35 hover:border-amber-400/60 shadow-sm shadow-amber-950/20',
                    badgeDone: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
                    iconDoneColor: 'text-amber-400',
                    badgeText: `💰 $${presalesRevenue.toLocaleString()} Presales (${(project.reservations || []).length} Backers)`
                  },
                  {
                    id: 'gate',
                    num: '5. Validation Gate',
                    desc: 'PASS → Build MVP | TEST AGAIN → Iterate | FAIL → Kill',
                    icon: Flag,
                    isDone: isStep5Done,
                    borderDone: isStep5Done
                      ? 'bg-emerald-500/[0.08] border-emerald-500/50 hover:border-emerald-400/80 shadow-md shadow-emerald-950/30'
                      : 'bg-[#141720] hover:bg-[#1b202c] border border-white/[0.08] hover:border-emerald-500/40',
                    badgeDone: isStep5Done ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : '',
                    iconDoneColor: isStep5Done ? 'text-emerald-400' : 'text-slate-400',
                    badgeText: isStep5Done ? '🚀 Gate Passed → Build MVP' : 'Open Milestone'
                  },
                ].map(step => {
                  const Icon = step.icon
                  return (
                    <div
                      key={step.id}
                      onClick={() => openPhaseStep(step.id)}
                      className={`p-3 rounded-xl transition-all cursor-pointer group space-y-1 ${
                        step.isDone
                          ? step.borderDone
                          : 'bg-[#141720] hover:bg-[#1b202c] border border-white/[0.06] hover:border-emerald-500/40'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {step.isDone ? (
                            <CheckCircle2 className={`w-4 h-4 shrink-0 ${step.iconDoneColor}`} />
                          ) : (
                            <Icon className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 shrink-0 transition-colors" />
                          )}
                          <span className={`text-xs font-bold truncate ${step.isDone ? 'text-slate-200' : 'text-white'}`}>
                            {step.num}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {step.isDone ? (
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border ${step.badgeDone}`}>
                              {step.badgeText}
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400 group-hover:text-emerald-300 flex items-center gap-0.5 transition-colors">
                              <span>Open</span>
                              <ChevronRight className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-[11px] leading-relaxed pl-6 line-clamp-2 text-slate-400">
                        {step.desc}
                      </p>
                    </div>
                  )
                })}
              </div>

              <button
                onClick={() => {
                  if (isStep5Done || currentPhase >= 2) {
                    handleAdvancePhase(2)
                    setShowPhaseExecutionModal(true)
                  } else {
                    openPhaseStep('plan')
                  }
                }}
                className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg active:scale-95 ${
                  isStep5Done || currentPhase >= 2
                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-950/40'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40'
                }`}
              >
                <span>
                  {isStep5Done || currentPhase >= 2
                    ? 'Advance to Phase 2: Build MVP'
                    : 'Open Phase 1 Workspace'}
                </span>
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
                onClick={closePhaseModal}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {currentPhase === 2 ? (
              <Phase2BuildMVP
                project={project}
                api={api}
                activeStepId={selectedPhaseStep}
                onSelectStep={(step) => {
                  setSelectedPhaseStep(step)
                  openPhaseStep(step)
                }}
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

      {/* VENTURE FILE PREVIEW MODAL */}
      {previewingFile && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[99999] bg-black/95 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6 animate-fade-in overflow-hidden">
          <div className="max-w-3xl w-full max-h-[85vh] flex flex-col rounded-3xl bg-[#090b0e] border border-white/[0.12] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>{previewingFile.title}</span>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {previewingFile.badge || 'Venture Asset'}
                    </span>
                  </h3>
                  <p className="text-[11px] font-mono text-slate-400">{previewingFile.name} • {previewingFile.size}</p>
                </div>
              </div>
              <button
                onClick={() => setPreviewingFile(null)}
                className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto rounded-xl bg-[#0e1117] border border-white/[0.06] p-4 text-xs font-mono text-slate-200 whitespace-pre-wrap leading-relaxed shadow-inner">
              {previewingFile.content}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/[0.08] shrink-0">
              <div className="text-[11px] text-slate-400 font-mono">
                Stored in Project Vault • Ready for export
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopy(previewingFile.content, previewingFile.id)}
                  className="px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedKey === previewingFile.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === previewingFile.id ? 'Copied' : 'Copy Text'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadFile(previewingFile)}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-purple-950/40 cursor-pointer"
                >
                  <ArrowRight className="w-3.5 h-3.5 rotate-90" />
                  <span>Download Asset</span>
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
