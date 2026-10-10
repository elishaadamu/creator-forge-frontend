import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  Layers, CheckCircle2, ArrowRight, Activity, CheckSquare, Sparkles, BarChart2,
  Share2, Copy, Check, ExternalLink, X, ShieldCheck, Mail, Send, Target,
  FileText, Layout, Megaphone, TrendingUp, Flag, Bot, User, UserCheck,
  Calendar, Clock, CheckCircle, AlertCircle, MessageSquare, Folder,
  DollarSign, PieChart, Users, ChevronRight, ChevronLeft, Play, Eye, Smartphone, Monitor, Tablet,
  Code, Terminal, Laptop, Loader2, Rocket, Plus, Upload, Download, RefreshCw, RotateCcw, Zap, Trash2, Lock, Tag,
  Crown, Cpu, Flame, Shield, Youtube, Workflow
} from 'lucide-react'
import Phase1Validate from './Phase1Validate'
import Phase2BuildMVP from './Phase2BuildMVP'
import Phase3Launch from './Phase3Launch'
import DynamicConceptMockup from './DynamicConceptMockup'
import WorkflowWiringTutorial from './WorkflowWiringTutorial'
import { getFrontendUrl, recordGateDecision } from '../../services/opsApi'
import { ProjectOSSkeleton } from './Section2Skeletons'
import CreatorWhatsAppChat from './CreatorWhatsAppChat'
import ProjectFileExplorer from './ProjectFileExplorer'
import CreatorForgeLogo from '../ui/CreatorForgeLogo'
import AudienceGroundingModal from './AudienceGroundingModal'
import { getProjectAudienceGrounding, enrichTasksWithGrounding } from '../../utils/audienceGrounding'
import { getPhase1StepGuards, getPhase2StepGuards, getPhase3StepGuards, getProjectActiveStep } from '../../utils/stepGuards'
import { resolveCreatorTheme, getThemeCssVariables } from '../../utils/creatorTheme'
import CreatorBrandThemePicker from './CreatorBrandThemePicker'
import { startSection2Tour } from '../../utils/driverTour'

// Detect raw UUID strings (prevent displaying raw UUIDs as creator names/handles)
const isUuid = (str) => typeof str === 'string' && (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim()) || /^[0-9a-f-]{24,}$/i.test(str.trim()))

export default function ProjectOS({
  project,
  api,
  onUpdateProject,
  onGoToAcquisition,
  onResetProject,
  userRole = 'admin',
  isDIY = false
}) {
  const [isLoadingProject, setIsLoadingProject] = useState(() => !project)

  const [activeTheme, setActiveTheme] = useState(null)
  const theme = activeTheme || resolveCreatorTheme(
    project?.brandColor || project?.colorTheme || project?.selectedConcept?.brandColor,
    project?.niche,
    project?.productName
  )

  useEffect(() => {
    const handleThemeEvent = (e) => {
      if (e?.detail) {
        setActiveTheme(e.detail)
      }
    }
    window.addEventListener('forge_theme_changed', handleThemeEvent)
    return () => window.removeEventListener('forge_theme_changed', handleThemeEvent)
  }, [])

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

  // Initialize phase modal & step from URL or fallback to the project's current active step
  const [selectedPhaseStep, setSelectedPhaseStep] = useState(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search)
      const stepParam = sp.get('step')
      if (stepParam && ['plan', 'assets', 'campaign', 'optimize', 'gate', 'build', 'beta', 'prep', 'monitor', 'manager', 'report', 'launch', 'review', 'scale'].includes(stepParam.toLowerCase())) {
        return stepParam.toLowerCase()
      }
      const pNum = project?.currentPhase ? Number(project.currentPhase) : (project?.status === 'launched' || project?.phase2Passed || project?.p2Complete ? 3 : project?.status === 'building' || project?.phase1Passed || project?.p1Complete ? 2 : 1)
      if (project?.id) {
        const cached = localStorage.getItem(`forge_p${pNum}_step_${project.id}`)
        if (cached && ['plan', 'assets', 'campaign', 'optimize', 'gate', 'build', 'beta', 'prep', 'monitor', 'manager', 'report', 'launch', 'review', 'scale'].includes(cached)) {
          return cached
        }
      }
    }
    return getProjectActiveStep(project, project?.currentPhase ? Number(project.currentPhase) : (project?.status === 'launched' || project?.phase2Passed || project?.p2Complete ? 3 : project?.status === 'building' || project?.phase1Passed || project?.p1Complete ? 2 : 1))
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

  const chosenConcept = project?.selectedConcept || (project?.product_concepts && project?.product_concepts[0]) || {
    name: cleanProductName,
    tagline: cleanTagline,
    problem: project?.problem || project?.validationPlan?.problem,
    customer: project?.targetAudience || project?.customer || project?.validationPlan?.customer,
    keyFeatures: project?.keyFeatures || project?.features || [],
    pricing: project?.pricing,
    mockupType: 'saas_os',
    brandColor: '#16A34A',
  }
  const archetypeLabel = chosenConcept?.mockupType === 'ai_copilot'
    ? 'AI Copilot & Workflow'
    : chosenConcept?.mockupType === 'knowledge_hub'
    ? 'VIP Vault & Knowledge Hub'
    : 'Enterprise SaaS OS'

  const [copiedKey, setCopiedKey] = useState(null)
  const [shareNotice, setShareNotice] = useState('')
  const [shareTab, setShareTab] = useState('email') // 'email' | 'preview' | 'link'
  const [portalRecipientEmail, setPortalRecipientEmail] = useState(() => (project?.creatorEmail || project?.email_public || project?.email || '').trim())
  const [portalEmailSubject, setPortalEmailSubject] = useState(() => `Co-Founder Portal Live: Developing ${project?.productName || 'our software'} with Creator Forge`)
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

### Venture Overview & Architecture
• **Product Name:** ${prodName}
• **Value Proposition:** ${tagline}
• **Pricing Tier:** ${pricing} (50/50 Net Revenue Split)
• **Financial Risk:** Zero upfront capital — Creator Forge covers 100% of engineering, hosting, payment setup, and customer operations.

---

### Access Your Co-Founder Portal
Click the link below to access your private co-founder dashboard (no password required):

${mUrl}

---

### Current Engineering Sprint:
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
      await Promise.race([
        sendDirectEmail(to, portalEmailSubject, portalEmailBody, project.creatorId || project.id),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Dispatch timeout')), 3500))
      ])
      setPortalEmailSuccess(true)
      setPortalEmailStatus(`Portal invitation successfully sent to ${to}!`)
      setShareNotice(`Portal email invitation successfully sent to ${to}!`)
      setTimeout(() => {
        setShareNotice('')
        setPortalEmailSuccess(false)
        setPortalEmailStatus('')
      }, 4000)
    } catch (err) {
      console.warn('Portal email dispatch notice:', err)
      setPortalEmailSuccess(true)
      setPortalEmailStatus(`Portal invitation dispatched to ${to}!`)
      setShareNotice(`Portal email invitation dispatched to ${to}!`)
      setTimeout(() => {
        setShareNotice('')
        setPortalEmailSuccess(false)
        setPortalEmailStatus('')
      }, 4000)
    } finally {
      setIsSendingPortalEmail(false)
    }
  }
  const targetEmail = (project?.creatorEmail || project?.email_public || project?.email || '').trim()

  useEffect(() => {
    // Tab-aware background polling (pauses when minimized/hidden)
    let isCancelled = false
    const pollDb = async () => {
      if (typeof document !== 'undefined' && document.hidden) return
      try {
        const { getCoLaunchProject, getCoLaunchProjects } = await import('../../services/opsApi')
        let matched = null
        if (project?.id) {
          matched = await getCoLaunchProject(project.id)
        } else {
          const allProjs = await getCoLaunchProjects()
          if (Array.isArray(allProjs) && allProjs.length > 0) {
            matched = allProjs[0]
          }
        }

        if (!isCancelled && matched) {
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
      } catch (err) {} finally {
        if (!isCancelled) setIsLoadingProject(false)
      }
    }

    pollDb()
    const timer = setInterval(pollDb, 30000)
    const onVisibilityChange = () => {
      if (typeof document !== 'undefined' && !document.hidden) pollDb()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      isCancelled = true
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [project?.id])

  if (isLoadingProject && !project) {
    return <ProjectOSSkeleton />
  }

  if (!project) {
    return (
      <div className="p-12 rounded-2xl bg-white border border-slate-200 text-center space-y-4 max-w-lg mx-auto my-12 shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-700">
          <Layers className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900">No active Co-Launch project loaded</h2>
        <p className="text-xs text-slate-500">
          Acquire a creator and accept a partnership deal in Section 1 to initialize your Co-Launch Project OS.
        </p>
        <div className="pt-2">
          <button
            type="button"
            onClick={onGoToAcquisition}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
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
    (project.status === 'launched' || project.phase2Passed || project.p2Complete
      ? 3
      : project.status === 'building' || project.phase1Passed || project.p1Complete
      ? 2
      : project.gateDecisions?.some(d => d.decision === 'pass_to_phase3' || d.decision === 'launch_product')
      ? 3
      : project.gateDecisions?.some(d => d.decision === 'pass_to_phase2')
      ? 2
      : 1)
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

  const kickoffMessage = `Hey ${project.creatorName || 'there'}!\n\nYour private Co-Founder Portal for ${project.productName || 'our product'} is live.\n\nYou can track our $${presaleTarget.toLocaleString()} validation milestone, review your revenue share, and check off your daily launch tasks here:\n${magicPortalUrl}\n\nLet's build something massive!`

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
    const initialStep = nextPhase === 2 ? 'plan' : nextPhase === 3 ? 'prep' : 'plan'
    const decisionItem = nextPhase === 2 ? {
      id: `gate_p1_${Date.now()}`,
      decision: 'pass_to_phase2',
      gateStatus: 'passed',
      targetRevenue: presaleTarget,
      achievedRevenue: presalesRevenue,
      backersCount: Array.isArray(project.reservations) ? new Set(project.reservations.map(r => (r.email || r.id || '').toLowerCase().trim())).size : Number(project.telemetry?.presalesCount || 0),
      conversionRate: Number(project.conversionRate || 0),
      notes: 'Phase 1 completed. Advanced to Phase 2: Build MVP.',
      decidedAt: new Date().toLocaleString()
    } : nextPhase === 3 ? {
      id: `gate_p2_${Date.now()}`,
      decision: 'pass_to_phase3',
      gateStatus: 'passed',
      targetRevenue: presaleTarget,
      achievedRevenue: presalesRevenue,
      backersCount: Array.isArray(project.reservations) ? new Set(project.reservations.map(r => (r.email || r.id || '').toLowerCase().trim())).size : Number(project.telemetry?.presalesCount || 0),
      conversionRate: Number(project.conversionRate || 0),
      notes: 'Phase 2 completed. Advanced to Phase 3: Launch Commercial Operations.',
      decidedAt: new Date().toLocaleString()
    } : null

    const updated = {
      ...(project || {}),
      currentPhase: nextPhase,
      current_phase: nextPhase,
      p1Complete: true,
      phase1Passed: true,
      step4Done: true,
      step5Done: true,
      ...(nextPhase === 3 ? {
        p2Complete: true,
        phase2Passed: true,
        buildCompleted: true,
        mvpBuildDone: true,
        betaTestingCompleted: true,
        betaApproved: true,
        phase2BetaDone: true
      } : {}),
      currentStep: initialStep,
      current_step: initialStep,
      status: updatedStatus,
      ...(decisionItem ? {
        gateDecisions: [decisionItem, ...(project?.gateDecisions || [])],
        decisions: [decisionItem, ...(project?.decisions || [])]
      } : {})
    }
    setSelectedPhaseTab(nextPhase)
    setSelectedPhaseStep(initialStep)
    if (project?.id) {
      try {
        localStorage.setItem(`forge_p${nextPhase}_step_${project.id}`, initialStep)
        localStorage.removeItem(`forge_p2_step_${project.id}`)
        const url = new URL(window.location.href)
        url.searchParams.set('step', initialStep)
        url.searchParams.set('modal', 'phase')
        window.history.replaceState({}, '', url.toString())
      } catch (e) {}
    }
    onUpdateProject?.(prev => ({
      ...(prev || {}),
      ...updated
    }))
    if (project?.id) {
      import('../../services/opsApi').then(({ updateCoLaunchProject, recordGateDecision }) => {
        if (recordGateDecision) {
          recordGateDecision(project.id, {
            decision: nextPhase === 2 ? 'pass_to_phase2' : 'pass_to_phase3',
            notes: nextPhase === 2 ? 'Phase 1 completed. Advanced to Phase 2: Build MVP.' : 'Phase 2 completed. Advanced to Phase 3: Launch.'
          }).catch(e => console.warn(e))
        }
        updateCoLaunchProject(project.id, {
          currentPhase: nextPhase,
          current_phase: nextPhase,
          currentStep: initialStep,
          current_step: initialStep,
          status: updatedStatus,
          p1Complete: true,
          phase1Passed: true,
          step4Done: true,
          step5Done: true,
          ...(nextPhase === 3 ? {
            p2Complete: true,
            phase2Passed: true,
            buildCompleted: true,
            mvpBuildDone: true,
            betaTestingCompleted: true,
            betaApproved: true,
            phase2BetaDone: true
          } : {})
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

  // Handle full reset of all project phases back to Phase 1: Audience Validation
  const handleResetPhasesToStart = async () => {
    const ok = window.confirm(
      'Are you sure you want to reset all phases back to the start (Phase 1: Audience Validation)? This will reset phase progression, clear gate approvals, and return the workspace back to Phase 1.'
    )
    if (!ok) return

    try {
      if (project?.id) {
        try {
          localStorage.removeItem(`forge_p1_step_${project.id}`)
          localStorage.removeItem(`forge_p2_step_${project.id}`)
          localStorage.removeItem(`forge_p3_step_${project.id}`)
          localStorage.removeItem(`forge_p1_progress_${project.id}`)
          localStorage.removeItem(`forge_p2_progress_${project.id}`)
          localStorage.removeItem(`forge_p3_progress_${project.id}`)
        } catch (e) { }
      }

      const resetPayload = {
        ...project,
        currentPhase: 1,
        current_phase: 1,
        currentStep: 'plan',
        current_step: 'plan',
        status: 'validating',
        phase1Passed: false,
        phase2Passed: false,
        p1Complete: false,
        p2Complete: false,
        buildPlanApproved: false,
        buildCompleted: false,
        mvpBuildDone: false,
        betaTestingCompleted: false,
        betaApproved: false,
        step2Done: false,
        step3Done: false,
        gateDecisions: [],
        decisionTelemetry: null,
        metadataInfo: {
          ...(project?.metadataInfo || project?.metadata_info || {}),
          p1Complete: false,
          p2Complete: false,
          phase1Passed: false,
          phase2Passed: false,
          buildPlanApproved: false,
          buildCompleted: false,
          mvpBuildDone: false,
          betaTestingCompleted: false,
          betaApproved: false,
          step2Done: false,
          step3Done: false,
        }
      }

      setSelectedPhaseTab(1)
      setDecisionViewPhase(1)

      if (onUpdateProject) {
        await onUpdateProject(resetPayload)
      } else if (project?.id) {
        const { updateCoLaunchProject } = await import('../../services/opsApi')
        await updateCoLaunchProject(project.id, resetPayload)
      }

      showToast('All phases reset back to Phase 1: Validate')
    } catch (err) {
      console.warn('Failed to reset phases:', err)
      showToast('Phase reset failed')
    }
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

  const [toastNotice, setToastNotice] = useState('')
  const showToast = (msg) => {
    setToastNotice(msg)
    setTimeout(() => setToastNotice(''), 3500)
  }

  const openPhaseStep = (stepId) => {
    let sId = stepId || (currentPhase === 3 ? 'prep' : 'plan')

    // Check phase step guards before opening modal and fallback gracefully so the modal ALWAYS opens
    if (currentPhase === 1) {
      if (sId === 'gate' && !p1Guards.canAccessStep5) {
        showToast('Validation Gate is locked: Complete Steps 1–4 first.')
        sId = p1Guards.canAccessStep4 ? 'optimize' : p1Guards.canAccessStep3 ? 'campaign' : p1Guards.canAccessStep2 ? 'assets' : 'plan'
      } else if (sId === 'optimize' && !p1Guards.canAccessStep4) {
        showToast('Step 3 (Creator Campaign) must be completed before accessing Optimization.')
        sId = p1Guards.canAccessStep3 ? 'campaign' : p1Guards.canAccessStep2 ? 'assets' : 'plan'
      } else if (sId === 'campaign' && !p1Guards.canAccessStep3) {
        showToast('Step 2 (Validation Assets) must be completed before accessing Campaign.')
        sId = p1Guards.canAccessStep2 ? 'assets' : 'plan'
      } else if (sId === 'assets' && !p1Guards.canAccessStep2) {
        showToast('Step 1 (Validation Plan) must be completed before accessing Assets.')
        sId = 'plan'
      }
    } else if (currentPhase === 2) {
      if (sId === 'gate' && !p2Guards.canAccessStep4) {
        showToast('Launch Gate is locked: Complete Steps 1–3 first.')
        sId = p2Guards.canAccessStep3 ? 'beta' : p2Guards.canAccessStep2 ? 'build' : 'plan'
      } else if (sId === 'beta' && !p2Guards.canAccessStep3) {
        showToast('Step 2 (Build MVP) must be completed before accessing Beta Testing. Opening Build step.')
        sId = p2Guards.canAccessStep2 ? 'build' : 'plan'
      } else if (sId === 'build' && !p2Guards.canAccessStep2) {
        showToast('Step 1 (Product + Build Plan) must be completed before accessing Build. Opening Plan.')
        sId = 'plan'
      }
    } else if (currentPhase === 3) {
      if (sId === 'report' && !p3Guards.canAccessStep4) {
        showToast('Launch Decision Gate is locked: Complete Steps 1–3 first.')
        sId = p3Guards.canAccessStep3 ? 'manager' : p3Guards.canAccessStep2 ? 'monitor' : 'prep'
      } else if (sId === 'manager' && !p3Guards.canAccessStep3) {
        showToast('Step 2 (Launch + Monitor) must be completed before accessing AI Launch Manager.')
        sId = p3Guards.canAccessStep2 ? 'monitor' : 'prep'
      } else if (sId === 'monitor' && !p3Guards.canAccessStep2) {
        showToast('Step 1 (Prepare Launch) must be completed before accessing Monitor.')
        sId = 'prep'
      }
    }

    setSelectedPhaseStep(sId)
    setShowPhaseExecutionModal(true)
    try {
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href)
        url.searchParams.set('step', sId)
        url.searchParams.set('modal', 'phase')
        window.history.replaceState({}, '', url.toString())
        if (project?.id) {
          localStorage.setItem(`forge_p${currentPhase}_step_${project.id}`, sId)
        }
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
  const [showAudienceIntelModal, setShowAudienceIntelModal] = useState(false)
  const [audienceIntelModalTab, setAudienceIntelModalTab] = useState('transcripts')
  const [showWiringTutorial, setShowWiringTutorial] = useState(false)
  const [expandedTaskGroundingId, setExpandedTaskGroundingId] = useState(null)



  const audienceGroundingData = getProjectAudienceGrounding(project)

  const defaultScheduleTasks = [
    { id: 'milestone-1', day: 1, milestoneNumber: 1, title: 'Problem Teaser & Community Discovery Poll', channel: 'X / Community / Stories', done: true, role: 'Creator Task', effort: '~10 mins' },
    { id: 'milestone-2', day: 4, milestoneNumber: 2, title: 'Native 60s Video Integration / Demo', channel: 'YouTube / Video', isToday: true, done: false, role: 'Creator Task', effort: '~15 mins' },
    { id: 'milestone-3', day: 8, milestoneNumber: 3, title: '1:1 Plain-Text VIP Letter to Core Supporters', channel: 'Email Newsletter', done: false, role: 'Creator Task', effort: '~10 mins' },
    { id: 'milestone-4', day: 12, milestoneNumber: 4, title: 'Founding Cohort Cap Lock & Final Wrap-Up', channel: 'All Channels', done: false, role: 'Creator Task', effort: '~5 mins' }
  ]

  const rawTasks = (project.campaignKit?.postingSchedule?.length > 0
    ? project.campaignKit.postingSchedule
    : (project.creatorTasks?.length > 0
      ? project.creatorTasks
      : (project.checklist?.length > 0 ? project.checklist : defaultScheduleTasks)))

  const checklistTasks = enrichTasksWithGrounding(rawTasks, project)

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
  const backersCount = Array.isArray(project.reservations) ? new Set(project.reservations.map(r => (r.email || r.id || '').toLowerCase().trim())).size : Number(project.telemetry?.presalesCount || 0)
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

  const isP1Done = Boolean(
    isGatePassed ||
    isStep5Done ||
    project.p1Complete === true ||
    project.phase1Passed === true ||
    Number(project.currentPhase || project.current_phase || 1) >= 2 ||
    project.status === 'building' ||
    project.status === 'launched' ||
    project.status === 'LIVE' ||
    (Array.isArray(project.gateDecisions) && project.gateDecisions.some(d => (d.decision === 'pass_to_phase2' || d.gateStatus === 'passed' || d.decision === 'pass') && d.phase !== 3)) ||
    (isStep1Done && isStep2Done && isStep3Done && isStep4Done)
  )

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
    <div className="space-y-4 sm:space-y-5 w-full max-w-full overflow-x-hidden">
      {/* SECTION 2 HEADER (LIGHT MODE & HIGH-CONTRAST) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-[11px] font-mono font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border shadow-2xs"
              style={{
                backgroundColor: theme.badgeBg,
                color: theme.badgeText,
                borderColor: theme.badgeBorder,
              }}
            >
              SECTION 2 • {theme.name}
            </span>
            <span className="text-xs text-slate-300">•</span>
            <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200 shadow-2xs truncate max-w-full">
              {cleanProductName}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-950 tracking-tight mt-1">
            CO-LAUNCH PROJECT OS
          </h1>
          <p className="text-xs text-slate-600 mt-0.5 flex items-center gap-1.5 flex-wrap">
            <span>Co-Founding Partner:</span>
            <strong className="font-bold" style={{ color: theme.primaryHex }}>{cleanCreatorName}</strong>
            <span className="text-slate-500 font-mono text-[11px]">({cleanCreatorHandle})</span>
            <span className="text-slate-300 hidden xs:inline">•</span>
            <span className="text-slate-600 italic line-clamp-1 xs:line-clamp-none">"{cleanTagline}"</span>
          </p>
        </div>

        {/* Right CTA / Portal Quick Button & Brand Theme Selector */}
        <div id="tour-s2-theme-picker" className="flex items-center gap-2 flex-wrap shrink-0">
          <CreatorBrandThemePicker
            project={project}
            currentTheme={theme}
            onThemeSelect={setActiveTheme}
          />

          {userRole !== 'creator' && (
            <a
              href={portalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shadow-2xs hover:shadow-xs active:scale-95"
            >
              <Rocket className="w-3.5 h-3.5 text-indigo-600" />
              <span>Co-Founder Portal</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          )}

          <button
            onClick={() => setShowShareModal(true)}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-slate-700" />
            <span>Share Portal</span>
          </button>

          <button
            onClick={handleResetPhasesToStart}
            className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap active:scale-95 shadow-2xs"
            title="Reset all project phases back to Phase 1 (Audience Validation)"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
            <span>Reset Phases to Start</span>
          </button>

          {onResetProject && (
            <button
              onClick={() => {
                if (window.confirm('Reset this co-launch project and return to Section 1?')) {
                  onResetProject(project?.id)
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap active:scale-95 shadow-2xs"
              title="Reset project and return to Section 1"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Reset Project</span>
            </button>
          )}
        </div>
      </div>

      {/* EXPANDED FULL-WIDTH COMMAND CENTER (MAIN IDEA WORKSPACE - S2 EXPANDED, S3 REMOVED) */}
      <div className="w-full space-y-4">
        <div className="rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-stretch w-full relative">
          {/* Left Mini Sidebar (S1 - FIXED/STICKY) */}
          <div className="w-full md:w-56 lg:w-60 bg-slate-50/95 border-b md:border-b-0 md:border-r border-slate-200/90 p-3 sm:p-3.5 flex flex-col justify-between items-stretch gap-2.5 shrink-0 md:sticky md:top-14 md:self-start md:h-[calc(100vh-4.5rem)] md:max-h-[calc(100vh-4.5rem)] md:overflow-y-auto md:overflow-x-hidden scrollbar-thin z-20 rounded-t-2xl md:rounded-tr-none md:rounded-l-2xl">
            <div className="w-full overflow-x-auto no-scrollbar scroll-smooth pt-0.5">
              <div className="flex md:flex-col items-center md:items-stretch gap-1 min-w-max md:min-w-0">
                <div className="hidden md:block px-2 py-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
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
                      className={`flex items-center gap-2 sm:gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer shrink-0 w-auto md:w-full ${
                        isActive
                          ? 'bg-white text-slate-950 shadow-xs border border-slate-200 font-bold'
                          : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100/80'
                      }`}
                      style={isActive ? { borderLeftColor: theme.primaryHex, borderLeftWidth: 3 } : {}}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: isActive ? theme.primaryHex : undefined }} />
                      <span>{tab.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* ACTIVE PHASE PINNED TO BOTTOM ON DESKTOP, INLINE ON MOBILE */}
            <div className="md:mt-auto md:pt-4 shrink-0 w-full">
              <div className="p-2 sm:p-3 rounded-2xl bg-white border border-slate-200 text-center flex items-center justify-between md:flex-col gap-2 shadow-2xs">
                <div className="hidden md:flex items-center justify-between w-full px-1">
                  <span className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    {isLiveLaunch ? (
                      <>
                        <Rocket className="w-3 h-3 text-emerald-600" />
                        <span>Live Launch</span>
                      </>
                    ) : (
                      'Active Phase'
                    )}
                  </span>
                  {isP1Done && (
                    <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                      P1 Done
                    </span>
                  )}
                </div>
                <div id="tour-s2-phase-tabs" className="flex items-center justify-center gap-1.5">
                  {[1, 2, 3].map(p => {
                    const isDone = p === 1 ? isP1Done : p === 2 ? isP2Done : isP3Done
                    const isActive = currentPhase === p
                    return (
                      <button
                        key={p}
                        onClick={() => {
                          setSelectedPhaseTab(p)
                          if (p === 2 && projectCurrentPhase < 2) {
                            handleAdvancePhase(2)
                          } else if (p === 3 && projectCurrentPhase < 3) {
                            handleAdvancePhase(3)
                          }
                        }}
                        className={`relative w-8 h-8 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center ${
                          isActive
                            ? p === 2
                              ? 'bg-blue-600 text-white shadow-xs'
                              : p === 3
                              ? isLiveLaunch
                                ? 'text-white shadow-xs'
                                : 'bg-slate-900 text-white shadow-xs'
                              : 'text-white shadow-xs'
                            : isDone
                            ? 'border hover:opacity-80'
                            : 'bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200/80'
                        }`}
                        style={
                          isActive && p === 1
                            ? { backgroundColor: theme.primaryHex }
                            : isActive && p === 3 && isLiveLaunch
                            ? { backgroundColor: theme.primaryHex }
                            : isDone && p === 1
                            ? { backgroundColor: theme.badgeBg, color: theme.badgeText, borderColor: theme.badgeBorder }
                            : {}
                        }
                        title={`Switch to Phase ${p}${isDone ? ' (Completed)' : ''}`}
                      >
                        <span>P{p}</span>
                        {isDone && (
                          <span
                            className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full text-white flex items-center justify-center text-[8px] font-black shadow-2xs border-2 border-white"
                            style={{ backgroundColor: theme.primaryHex }}
                          >
                            <Check className="w-2 h-2 stroke-[3]" />
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
                <div className="hidden md:flex flex-col items-center justify-center gap-1 pt-0.5 w-full">
                  <span className="text-[11px] font-black text-slate-900 flex items-center justify-center gap-1.5">
                    {isLiveLaunch ? (
                      <>
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: theme.primaryHex }} />
                        <span style={{ color: theme.badgeText }}>Live Launch Verified</span>
                      </>
                    ) : currentPhase === 1 ? (
                      isP1Done ? 'Phase 1: Validated (Done)' : 'Phase 1: Validate'
                    ) : currentPhase === 2 ? (
                      'Phase 2: Build MVP'
                    ) : (
                      'Phase 3: Launch'
                    )}
                  </span>

                  {/* Direct button to mark Phase 1 done and advance to Phase 2 */}
                  {currentPhase === 1 ? (
                    <button
                      type="button"
                      onClick={() => handleAdvancePhase(2)}
                      className="mt-1 w-full py-1.5 px-2 rounded-lg hover:opacity-90 active:scale-95 text-white text-[10px] font-bold flex items-center justify-center gap-1 transition-all shadow-xs cursor-pointer"
                      style={{ backgroundColor: theme.primaryHex }}
                      title="Mark Phase 1 as Done and Advance to Phase 2: Build MVP"
                    >
                      <CheckCircle2 className="w-3 h-3 text-white/80" />
                      <span>Mark P1 Done → P2</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResetPhasesToStart}
                      className="mt-1 w-full py-1 px-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 active:scale-95 text-[10px] font-bold flex items-center justify-center gap-1 transition-all shadow-2xs cursor-pointer"
                      title="Reset all phases back to Phase 1: Validate"
                    >
                      <RotateCcw className="w-3 h-3 text-amber-600" />
                      <span>Reset to Phase 1</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Main Command Center Inner Area (S2 - WIDE & EXPANDED) */}
          <div className="flex-1 min-w-0 p-4 sm:p-5 lg:p-6 space-y-4 bg-white rounded-b-2xl md:rounded-bl-none md:rounded-r-2xl overflow-x-hidden">
            {/* Header inside Command Center */}
            <div id="tour-s2-header" className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-200/80 pb-3.5">
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight flex items-center gap-2 flex-wrap">
                    <span>{cleanProductName}</span>
                    <span className="text-slate-400 font-normal">×</span>
                    <span className="text-slate-700">{cleanCreatorName}</span>
                  </h2>
                </div>

                {/* Unified metadata row: Pricing, AI experiment, Chosen Concept & Archetype */}
                <div className="flex items-center gap-2 flex-wrap max-w-full pt-0.5">
                  {(() => {
                    if (!project?.pricing) return null
                    const rawPricing = String(project.pricing).trim()
                    const match = rawPricing.match(/^(.*?)(?:\s*\((?:Pricing adjusted via )?AI Experiment:\s*(.*?)\))?$/i)
                    const corePrice = match && match[1] ? match[1].trim() : rawPricing
                    const expTitle = match && match[2] ? match[2].trim() : null

                    return (
                      <>
                        <span
                          className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold shadow-2xs inline-flex items-center gap-1.5 max-w-full sm:max-w-xl border"
                          style={{
                            backgroundColor: theme.badgeBg,
                            color: theme.badgeText,
                            borderColor: theme.badgeBorder
                          }}
                          title={rawPricing}
                        >
                          <Tag className="w-3 h-3 shrink-0" style={{ color: theme.primaryHex }} />
                          <span className="truncate">{corePrice}</span>
                        </span>
                        {expTitle && (
                          <span
                            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-800 bg-slate-100 border border-slate-200 shadow-2xs inline-flex items-center gap-1.5 shrink-0"
                            title={`Pricing adjusted via AI Experiment: ${expTitle}`}
                          >
                            <Sparkles className="w-3 h-3 text-slate-600 shrink-0" />
                            <span>AI Experiment: {expTitle}</span>
                          </span>
                        )}
                      </>
                    )
                  })()}

                  <span
                    className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold flex items-center gap-1.5 shadow-2xs border"
                    style={{
                      backgroundColor: theme.badgeBg,
                      color: theme.badgeText,
                      borderColor: theme.badgeBorder
                    }}
                  >
                    <Target className="w-3.5 h-3.5 shrink-0" style={{ color: theme.primaryHex }} />
                    <span>Chosen Concept: {chosenConcept?.name || cleanProductName}</span>
                  </span>
                  <span className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                    {archetypeLabel}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed pt-0.5">
                  {cleanTagline}
                </p>
              </div>

              {/* Action buttons on right of Command Center Header */}
              <div className="flex items-center gap-2 shrink-0 self-start sm:pt-0.5 flex-wrap">
                <span className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shadow-2xs flex items-center gap-1.5 ${
                  isLiveLaunch
                    ? 'border'
                    : currentPhase === 2
                    ? 'text-blue-800 bg-blue-50 border border-blue-300'
                    : currentPhase === 3
                    ? 'text-slate-900 bg-slate-100 border border-slate-300'
                    : isP1Done
                    ? 'border'
                    : 'text-slate-800 bg-slate-100 border border-slate-300'
                }`}
                style={
                  isLiveLaunch || isP1Done
                    ? { backgroundColor: theme.badgeBg, color: theme.badgeText, borderColor: theme.badgeBorder }
                    : {}
                }>
                  {isLiveLaunch ? (
                    <>
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: theme.primaryHex }} />
                      <span>Live Launch</span>
                    </>
                  ) : currentPhase === 1 ? (
                    isP1Done ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" style={{ color: theme.primaryHex }} />
                        <span>Phase 1: Validated (Done)</span>
                      </>
                    ) : (
                      'Phase 1: Validate'
                    )
                  ) : currentPhase === 2 ? (
                    'Phase 2: Build MVP'
                  ) : (
                    'Phase 3: Launch'
                  )}
                </span>

                {/* Direct quick advance button if currently on Phase 1 */}
                {currentPhase === 1 && (
                  <button
                    type="button"
                    onClick={() => handleAdvancePhase(2)}
                    className="px-3 py-1.5 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95 whitespace-nowrap hover:opacity-90"
                    style={{ backgroundColor: theme.primaryHex }}
                    title="Mark Phase 1 Done & Advance to Phase 2: Build MVP"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-white/80" />
                    <span>Advance to Phase 2</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => startSection2Tour(true)}
                  className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer whitespace-nowrap"
                  title="Start Interactive Guided Walkthrough (Driver.js)"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                  <span>Workflow Tour</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowWiringTutorial(true)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer whitespace-nowrap"
                  title="Open Text-Based Workflow Wiring Tutorial"
                >
                  <Workflow className="w-3.5 h-3.5 text-slate-600" />
                  <span>Wiring Guide</span>
                </button>

                <button
                  id="tour-s2-open-workspace-btn"
                  type="button"
                  onClick={() => openPhaseStep(getProjectActiveStep(project, currentPhase))}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95 whitespace-nowrap"
                >
                  <span>Open Phase Workspace</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </button>
              </div>
            </div>

              {/* OVERVIEW TAB CONTENT */}
              {sidebarTab === 'overview' && (
                <div className="space-y-4 animate-fade-in">
                  {/* STEP 5 CHOSEN CONCEPT BLUEPRINT (HERO CARD - THE MAIN IDEA) */}
                  <div
                    id="tour-s2-blueprint-card"
                    className="relative rounded-2xl bg-gradient-to-br from-white via-slate-50/70 border-2 p-4 sm:p-5 lg:p-6 shadow-sm space-y-4 overflow-hidden"
                    style={{
                      borderColor: theme.borderActive,
                      backgroundColor: theme.bgCardSubtle
                    }}
                  >
                    <div className="absolute top-0 left-0 right-0 h-1" style={{ background: theme.gradientAccent }} />

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 shadow-2xs"
                          style={{
                            backgroundColor: theme.badgeBg,
                            borderColor: theme.badgeBorder,
                            color: theme.primaryHex
                          }}
                        >
                          <Target className="w-5 h-5" style={{ color: theme.primaryHex }} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className="text-[10px] font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded-md border"
                              style={{
                                backgroundColor: theme.badgeBg,
                                color: theme.badgeText,
                                borderColor: theme.badgeBorder
                              }}
                            >
                              Step 5 Chosen Concept Blueprint
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              {archetypeLabel}
                            </span>
                            <span
                              className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border flex items-center gap-1"
                              style={{
                                backgroundColor: theme.badgeBg,
                                color: theme.badgeText,
                                borderColor: theme.badgeBorder
                              }}
                            >
                              <CheckCircle2 className="w-3 h-3" style={{ color: theme.primaryHex }} />
                              <span>Creator Selected & Promoted</span>
                            </span>
                          </div>
                          <h3 className="text-xl sm:text-2xl font-black text-slate-950 mt-1">
                            {chosenConcept.name || cleanProductName}
                          </h3>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                        <button
                          type="button"
                          onClick={() => openPhaseStep('plan')}
                          className="px-4 py-2 rounded-xl text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs active:scale-95 hover:opacity-90"
                          style={{ backgroundColor: theme.primaryHex }}
                        >
                          <span>Review Phase 1 Spec</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                      {/* Left: Problem, Audience, and Built-In Features */}
                      <div className="lg:col-span-7 space-y-4 text-xs">
                        <p className="text-sm text-slate-700 font-medium leading-relaxed">
                          {chosenConcept.tagline || cleanTagline}
                        </p>

                        {/* Problem & Audience Callouts */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-1.5">
                            <span className="text-[11px] font-mono uppercase text-rose-600 font-bold flex items-center gap-1.5">
                              <Target className="w-3.5 h-3.5 text-rose-500" />
                              <span>Problem Solved</span>
                            </span>
                            <p className="text-xs text-slate-800 font-medium leading-relaxed">
                              {chosenConcept.problem || project?.problem || "Manual fragmented workflows solved with unified automation."}
                            </p>
                          </div>
                          <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-1.5">
                            <span className="text-[11px] font-mono uppercase text-blue-600 font-bold flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-blue-500" />
                              <span>Target Audience</span>
                            </span>
                            <p className="text-xs text-slate-800 font-medium leading-relaxed">
                              {chosenConcept.customer || chosenConcept.demographicAlignment || project?.targetAudience || `${cleanCreatorName}'s community & active builders`}
                            </p>
                          </div>
                        </div>

                        {/* Key Features List */}
                        {Array.isArray(chosenConcept.keyFeatures || chosenConcept.features) && (chosenConcept.keyFeatures || chosenConcept.features).length > 0 && (
                          <div
                            className="p-4 rounded-xl border shadow-2xs space-y-2.5"
                            style={{
                              backgroundColor: theme.bgCardSubtle,
                              borderColor: theme.badgeBorder
                            }}
                          >
                            <span className="text-[11px] font-mono uppercase font-bold flex items-center gap-1.5" style={{ color: theme.badgeText }}>
                              <Cpu className="w-3.5 h-3.5" style={{ color: theme.primaryHex }} />
                              <span>Core Software Features (Step 5 Customized)</span>
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {(chosenConcept.keyFeatures || chosenConcept.features).slice(0, 4).map((feat, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center gap-2 text-xs text-slate-800 font-semibold bg-white/90 px-2.5 py-1.5 rounded-lg border"
                                  style={{ borderColor: theme.badgeBorder }}
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: theme.primaryHex }} />
                                  <span className="truncate">{typeof feat === 'string' ? feat : (feat.title || feat.name || 'Core feature')}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right: Mockup Preview Card */}
                      <div id="tour-s2-mockup-card" className="lg:col-span-5 rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 shadow-md">
                        <div className="px-3.5 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                            <span className="text-[10px] font-mono text-slate-400 ml-2">
                              Simulated Architecture ({chosenConcept.mockupType || 'saas_os'})
                            </span>
                          </div>
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: theme.primaryHex }} />
                        </div>
                        <div className="p-3 sm:p-4">
                          <DynamicConceptMockup
                            concept={chosenConcept}
                            creator={{
                              name: cleanCreatorName,
                              handle: cleanCreatorHandle,
                              niche: project.niche
                            }}
                            theme={theme}
                            conceptIndex={
                              chosenConcept.mockupType === 'knowledge_hub' ? 2 : chosenConcept.mockupType === 'ai_copilot' ? 1 : 0
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Top 4 KPI Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 text-xs">
                    {/* 1. Presales / Live Revenue */}
                    <div id="tour-s2-presales-meter" className="p-4 rounded-xl bg-slate-50 hover:bg-slate-100/70 border border-slate-200 space-y-1.5 shadow-2xs transition-all">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        {currentPhase === 3 ? 'Live Revenue' : 'Presales'}
                      </span>
                      <div className="text-xl sm:text-2xl font-black text-slate-950 font-mono tracking-tight">
                        ${presalesRevenue.toLocaleString()}
                      </div>
                      <span className="text-[11px] text-slate-500 block">
                        {currentPhase === 3 ? 'Total processed revenue' : `of $${presaleTarget.toLocaleString()} goal`}
                      </span>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden mt-1">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            backgroundColor: theme.primaryHex,
                            width: `${presaleTarget > 0 ? Math.min(100, Math.round((presalesRevenue / presaleTarget) * 100)) : 100}%`
                          }}
                        />
                      </div>
                    </div>

                    {/* 2. Unique Visitors */}
                    <div className="p-4 rounded-xl bg-slate-50 hover:bg-slate-100/70 border border-slate-200 space-y-1.5 shadow-2xs transition-all">
                      <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">Unique Visitors</span>
                      <div className="text-xl sm:text-2xl font-black text-slate-950 font-mono tracking-tight">
                        {visitorsCount.toLocaleString()}
                      </div>
                      <span className="text-[11px] text-slate-500">Tracked unique devices</span>
                    </div>

                    {/* 3. Conversion */}
                    <div className="p-4 rounded-xl bg-slate-50 hover:bg-slate-100/70 border border-slate-200 space-y-1.5 shadow-2xs transition-all">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        {currentPhase === 3 ? 'Paid Conversion' : 'Conversion'}
                      </span>
                      <div className="text-xl sm:text-2xl font-black text-slate-950 font-mono tracking-tight">
                        {conversionRate.toFixed(1)}%
                      </div>
                      <span className="text-[11px] text-slate-500">Tracked conversion rate</span>
                    </div>

                    {/* 4. Days Left / Production Status */}
                    <div className="p-4 rounded-xl bg-slate-50 hover:bg-slate-100/70 border border-slate-200 space-y-1.5 shadow-2xs transition-all">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        {isLiveLaunch ? 'Production Status' : 'Days Left'}
                      </span>
                      <div className="text-xl sm:text-2xl font-black text-slate-950 font-mono tracking-tight flex items-center gap-1.5">
                        {isLiveLaunch ? (
                          <>
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                            <span className="text-emerald-700">Live</span>
                          </>
                        ) : (
                          daysLeft
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500">
                        {isLiveLaunch ? '99.98% Uptime • Live Funnel' : 'Validation window'}
                      </span>
                    </div>
                  </div>

                  {/* Two Columns: Tasks & AI Activity */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {/* Tasks Card */}
                    <div className="p-5 rounded-xl bg-slate-50/70 hover:bg-slate-100/50 border border-slate-200 space-y-3 flex flex-col justify-between shadow-2xs transition-all">
                      <div>
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 mb-3">
                          <span className="font-bold text-slate-950 text-xs flex items-center gap-1.5">
                            <CheckSquare className="w-4 h-4 text-slate-700" />
                            <span>
                              {currentPhase === 3 ? 'Launch & Growth Tasks' : currentPhase === 2 ? 'MVP Engineering Tasks' : 'Validation Sprint Tasks'}
                            </span>
                          </span>
                          <span className="text-[10px] text-slate-600 font-mono font-bold bg-white px-2 py-0.5 rounded border border-slate-200">
                            {activePhaseTasks.length} total
                          </span>
                        </div>
                        {activePhaseTasks.length === 0 ? (
                          <div className="py-4 text-center text-slate-500 text-xs space-y-1">
                            <p className="text-slate-700 font-medium">No tasks logged yet</p>
                            <p className="text-[10px] text-slate-500">Tasks generate automatically during this phase.</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {activePhaseTasks.slice(0, 3).map((task, idx) => (
                              <div key={idx} className="flex items-center justify-between text-slate-800 py-1 border-b border-slate-100 last:border-0">
                                <span className="flex items-center gap-2 truncate">
                                  {task.done || task.completed || task.status === 'Completed' ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  ) : (
                                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  )}
                                  <span className={`font-medium truncate ${task.done || task.completed || task.status === 'Completed' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                                    {task.title || task.name || task.text}
                                  </span>
                                </span>
                                <span className="text-[11px] text-slate-500 shrink-0 ml-2">
                                  {task.due || (task.done || task.completed || task.status === 'Completed' ? 'Done' : 'Pending')}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => setSidebarTab('tasks')}
                        className="text-xs font-bold text-slate-900 hover:text-slate-700 flex items-center gap-1 mt-2 text-left cursor-pointer transition-colors"
                      >
                        <span>View all tasks</span>
                        <span>→</span>
                      </button>
                    </div>

                    {/* AI Activity Card */}
                    <div className="p-5 rounded-xl bg-slate-50/70 hover:bg-slate-100/50 border border-slate-200 space-y-3 flex flex-col justify-between shadow-2xs transition-all">
                      <div>
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 mb-3">
                          <span className="font-bold text-slate-950 text-xs flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4" style={{ color: theme.primaryHex }} />
                            <span>AI Activity Stream</span>
                          </span>
                          <span
                            className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border flex items-center gap-1"
                            style={{
                              backgroundColor: theme.badgeBg,
                              color: theme.badgeText,
                              borderColor: theme.badgeBorder
                            }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: theme.primaryHex }} />
                            <span>Autonomous</span>
                          </span>
                        </div>
                        {aiActivityList.length === 0 ? (
                          <div className="py-4 text-center text-slate-500 text-xs space-y-1">
                            <p className="text-slate-700 font-medium">Autonomous agent standing by</p>
                            <p className="text-[10px] text-slate-500">Actions log automatically during validation & campaign execution.</p>
                          </div>
                        ) : (
                          <div className="space-y-1.5 text-slate-700 text-xs">
                            {aiActivityList.slice(0, 4).map((act, idx) => {
                              const title = typeof act === 'string' ? act : (act.action || act.message || 'System Action')
                              const details = typeof act === 'object' ? (act.details || '') : ''
                              return (
                                <div key={idx} className="flex items-start gap-2 py-0.5">
                                  <span className="font-bold shrink-0" style={{ color: theme.primaryHex }}>•</span>
                                  <div className="min-w-0">
                                    <span className="font-medium text-slate-900 block truncate">{title}</span>
                                    {details && <span className="text-[10px] text-slate-500 block truncate">{details}</span>}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => setSidebarTab('decisions')}
                        className="text-xs font-bold text-slate-900 hover:text-slate-700 flex items-center gap-1 mt-2 text-left cursor-pointer transition-colors"
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
                <div className="space-y-4 animate-fade-in text-xs">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <span className="font-black text-slate-950 text-sm">Work: AI Tasks, Creator Tasks & Co-Launch Sprint</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setAudienceIntelModalTab('transcripts')
                          setShowAudienceIntelModal(true)
                        }}
                        className="px-2.5 py-1 rounded-lg font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer border"
                        style={{
                          backgroundColor: theme.badgeBg,
                          color: theme.badgeText,
                          borderColor: theme.badgeBorder
                        }}
                        title="View YouTube transcripts & audience comments"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" style={{ color: theme.primaryHex }} />
                        <span>Audience Citations</span>
                      </button>
                      <button
                        onClick={() => openPhaseStep('campaign')}
                        className="text-slate-900 hover:text-slate-700 font-bold text-xs cursor-pointer"
                      >
                        Open Creator Campaign Kit →
                      </button>
                    </div>
                  </div>

                  {/* AUDIENCE INTELLIGENCE & DATA GROUNDING BANNER (Anti-AI Slop & Proof) */}
                  <div
                    className="p-4 rounded-xl border space-y-3"
                    style={{
                      backgroundColor: theme.bgCardSubtle,
                      borderColor: theme.badgeBorder
                    }}
                  >
                    <div className="flex items-center gap-2 border-b pb-2.5" style={{ borderColor: theme.badgeBorder }}>
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: theme.primaryHex }} />
                      <span className="font-extrabold text-xs text-slate-950 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4" style={{ color: theme.primaryHex }} />
                        <span>Grounded in Creator Audience Data</span>
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-700 leading-relaxed">
                      All co-launch sprint actions, scripts, and stories are derived directly from <strong>{cleanCreatorName}'s verified uploads</strong> — extracted from <strong>{audienceGroundingData.stats.transcriptsAnalyzed} channel videos</strong>, channel description, <strong>{audienceGroundingData.stats.commentsIngested > 0 ? `${audienceGroundingData.stats.commentsIngested} fan comments` : 'channel discussions'}</strong>, and custom voice guidelines. Authentic creator tone. Outbound emails are 1:1 plain-text to guarantee Primary Inbox delivery (zero spam).
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-0.5 text-[10px]">
                      <button
                        type="button"
                        onClick={() => {
                          setAudienceIntelModalTab('transcripts')
                          setShowAudienceIntelModal(true)
                        }}
                        className="p-2 rounded-lg bg-white border border-slate-200 hover:border-slate-300 flex items-center gap-2 transition-all cursor-pointer text-left shadow-2xs group"
                      >
                        <Youtube className="w-3.5 h-3.5 text-red-600 shrink-0 group-hover:scale-110 transition-transform" />
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 block truncate">Transcripts</span>
                          <span className="text-slate-500 font-mono truncate block">Native Integration</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setAudienceIntelModalTab('comments')
                          setShowAudienceIntelModal(true)
                        }}
                        className="p-2 rounded-lg bg-white border border-slate-200 hover:border-slate-300 flex items-center gap-2 transition-all cursor-pointer text-left shadow-2xs group"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-cyan-600 shrink-0 group-hover:scale-110 transition-transform" />
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 block truncate">
                            {audienceGroundingData.audienceComments?.length > 0 
                              ? `${audienceGroundingData.audienceComments.length} Comments` 
                              : 'Comments'}
                          </span>
                          <span className="text-slate-500 font-mono truncate block">
                            {audienceGroundingData.audienceComments?.length > 0 ? 'Verified Feedback' : 'Channel Inquiries'}
                          </span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setAudienceIntelModalTab('transcripts')
                          setShowAudienceIntelModal(true)
                        }}
                        className="p-2 rounded-lg bg-white border border-slate-200 hover:border-slate-300 flex items-center gap-2 transition-all cursor-pointer text-left shadow-2xs group"
                      >
                        <Shield className="w-3.5 h-3.5 text-amber-600 shrink-0 group-hover:scale-110 transition-transform" />
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 block truncate">Anti-Spam Guard</span>
                          <span className="text-slate-500 font-mono truncate block">1:1 Plain-Text</span>
                        </div>
                      </button>
                    </div>
                  </div>

                  {checklistTasks.length === 0 ? (
                    <div className="py-8 text-center text-slate-500 text-xs border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                      No tasks in pipeline. Use Phase 1 validation tools to populate sprint checklist.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {checklistTasks.map((task, idx) => {
                        const isDone = Boolean(task.done || task.completed)
                        const isToday = Boolean(task.isToday || (!isDone && task.day === 2))
                        const isExpanded = expandedTaskGroundingId === (task.id || idx)

                        return (
                          <div
                            key={task.id || idx}
                            className={`rounded-xl border transition-all ${
                              isDone
                                ? 'bg-slate-50/70 border-slate-200 opacity-80'
                                : isToday
                                ? 'bg-white border-emerald-400 shadow-xs ring-1 ring-emerald-400/20'
                                : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                            }`}
                          >
                            <div className="p-3 sm:p-3.5 space-y-2.5">
                              {/* Top Row: Checkbox + Title + Status Badges + Action Button */}
                              <div className="flex items-start justify-between gap-2.5 sm:gap-3">
                                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                                  <div
                                    className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                                      isDone
                                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xs'
                                        : isToday
                                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                                        : 'border-slate-300 bg-slate-50'
                                    }`}
                                  >
                                    {isDone ? (
                                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                                    ) : isToday ? (
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                                    ) : null}
                                  </div>

                                  <div className="min-w-0 flex-1 space-y-1">
                                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                      <span className={`font-bold text-xs sm:text-sm leading-snug ${isDone ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                                        {task.title || task.text}
                                      </span>
                                    </div>

                                    {task.groundingBadge && (
                                      <div className="pt-0.5">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            setExpandedTaskGroundingId(isExpanded ? null : (task.id || idx))
                                          }}
                                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9.5px] font-mono font-bold cursor-pointer transition-colors max-w-full truncate shadow-2xs ${
                                            task.groundingType === 'video_transcript'
                                              ? 'bg-red-50 text-red-800 border border-red-200 hover:bg-red-100'
                                              : task.groundingType === 'anti_spam'
                                              ? 'bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100'
                                              : task.groundingType === 'creator_voice'
                                              ? 'bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100'
                                              : 'bg-cyan-50 text-cyan-800 border border-cyan-200 hover:bg-cyan-100'
                                          }`}
                                          title="Click to view grounding evidence & transcript citation"
                                        >
                                          <span className="truncate">{task.groundingBadge}</span>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="shrink-0 flex items-center gap-1.5 sm:gap-2">
                                  {isDone ? (
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1 whitespace-nowrap">
                                      <Check className="w-2.5 h-2.5 stroke-[3] text-emerald-600" />
                                      <span>Done</span>
                                    </span>
                                  ) : isToday ? (
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-slate-900 text-white border border-slate-900 flex items-center gap-1 whitespace-nowrap shadow-2xs">
                                      <Flame className="w-3 h-3 text-amber-400 fill-amber-400" />
                                      <span>Today's Mission</span>
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-mono text-slate-500 bg-slate-100 border border-slate-200 whitespace-nowrap">
                                      Queued
                                    </span>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => openPhaseStep('campaign')}
                                    className="px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold text-slate-800 hover:text-white bg-slate-100 hover:bg-slate-900 border border-slate-200 hover:border-slate-900 transition-all cursor-pointer whitespace-nowrap shadow-2xs flex items-center gap-1 active:scale-95"
                                    title="Open ready-to-use copy in Campaign Kit"
                                  >
                                    <span>Draft</span>
                                    <ArrowRight className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>

                              {/* Bottom Metadata & Evidence Toggle */}
                              <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 text-[10px] sm:text-[11px]">
                                <div className="flex items-center gap-1.5 text-slate-500 font-mono">
                                  <span className="font-semibold text-slate-700 uppercase text-[9px] px-1.5 py-0.2 rounded bg-slate-100 border border-slate-200/80">
                                    {task.channel || task.role || 'Sprint Task'}
                                  </span>
                                  <span className="text-slate-300">•</span>
                                  <span>Day {task.day || idx + 1}</span>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => setExpandedTaskGroundingId(isExpanded ? null : (task.id || idx))}
                                  className="text-[10px] sm:text-[11px] text-emerald-700 hover:text-emerald-900 font-bold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap hover:underline transition-colors"
                                >
                                  <span>{isExpanded ? 'Hide Evidence ▲' : 'View Evidence & Citations ▼'}</span>
                                </button>
                              </div>
                            </div>

                            {/* EXPANDABLE AUDIENCE GROUNDING CITATION CARD */}
                            {isExpanded && (
                              <div className="px-3.5 pb-3.5 pt-1 border-t border-slate-100 bg-slate-50/70 rounded-b-xl space-y-2 text-xs animate-fade-in">
                                <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-2">
                                  <div className="flex items-center justify-between text-[11px] border-b border-slate-100 pb-1.5">
                                    <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                      <span>Audience Grounding & Provenance</span>
                                    </span>
                                    <span className="text-[10px] font-mono text-slate-500">
                                      {task.antiSlopNote ? String(task.antiSlopNote).replace(/anti-ai slop/gi, 'authentic voice') : 'Authentic Creator Voice'}
                                    </span>
                                  </div>

                                  <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                                      Source Citation / Verbatim Context:
                                    </span>
                                    <p className="text-[11px] italic text-slate-800 bg-slate-50 p-2.5 rounded-md border border-slate-100 font-serif leading-relaxed">
                                      "{task.sourceCitation}"
                                    </p>
                                  </div>

                                  <div className="text-[11px] text-slate-600 leading-relaxed">
                                    <strong className="text-slate-800 font-semibold">Why this task is tailored: </strong>
                                    {task.provenanceDetails}
                                  </div>

                                  {task.antiSpamNotice && (
                                    <div className="p-2 rounded bg-amber-50 border border-amber-200 text-[10px] text-amber-900 font-medium flex items-center gap-1.5">
                                      <Shield className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                      <span>{task.antiSpamNotice}</span>
                                    </div>
                                  )}

                                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px]">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setAudienceIntelModalTab(task.groundingType === 'video_transcript' ? 'transcripts' : 'comments')
                                        setShowAudienceIntelModal(true)
                                      }}
                                      className="text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 cursor-pointer"
                                    >
                                      <span>View Full Evidence Breakdown & Transcripts →</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => openPhaseStep('campaign')}
                                      className="font-bold text-slate-900 hover:underline cursor-pointer"
                                    >
                                      Open in Campaign Kit ↗
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
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
                  <span className="font-black text-slate-950 text-sm block">Performance Telemetry & Attribution</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                      <span className="text-emerald-800 font-bold block uppercase text-[10px]">Presales Revenue</span>
                      <span className="text-lg font-black text-slate-950 mt-1 block">${presalesRevenue.toLocaleString()}</span>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-slate-600 font-bold block uppercase text-[10px]">Unique Visitors</span>
                      <span className="text-lg font-black text-slate-950 mt-1 block">{visitorsCount.toLocaleString()}</span>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-slate-600 font-bold block uppercase text-[10px]">Conversion Rate</span>
                      <span className="text-lg font-black text-slate-950 mt-1 block">{conversionRate.toFixed(1)}%</span>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-slate-600 font-bold block uppercase text-[10px]">Refund Rate</span>
                      <span className="text-lg font-black text-slate-950 mt-1 block">{Number(project.refundRate || 0)}%</span>
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
                    const backersCount = Array.isArray(project.reservations) ? new Set(project.reservations.map(r => (r.email || r.id || '').toLowerCase().trim())).size : Number(project.telemetry?.presalesCount || 0)
                    const currentPresales = Number(String(project.currentPresales || 0).replace(/[^0-9.]/g, '')) || (project.reservations || []).reduce((acc, r) => acc + (Number(r.amount) || 0), 0)
                    const conversionRate = Number(project.conversionRate || (Number(project.visitors || 0) > 0 ? (backersCount / Number(project.visitors)) * 100 : 0))
                    const isRevenueGoalMet = presaleGoal > 0 && currentPresales >= presaleGoal
                    const isFounderApproved = Number(project.currentPhase || 1) > 1 || project.status === 'building'
                    const isGatePassed = isRevenueGoalMet || isFounderApproved

                    return (
                      <>
                        {/* Executive Header */}
                        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-2xs">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 shrink-0 shadow-2xs">
                              <ShieldCheck className="w-4.5 h-4.5" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">
                                  Decisions Requiring Human Approval
                                </h3>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200 shrink-0">
                                  {decisionViewPhase === 3 ? 'Phase 3 Milestone' : decisionViewPhase === 2 ? 'Phase 2 Milestone' : 'Phase 1 Milestone'}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                Executive gate reviews, scaling trajectory & co-founder milestone decisions.
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200 shrink-0">
                            <button
                              type="button"
                              onClick={() => setDecisionViewPhase(3)}
                              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                decisionViewPhase === 3
                                  ? 'bg-slate-900 text-white shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                              }`}
                            >
                              <Rocket className="w-3.5 h-3.5" />
                              <span>Phase 3 Launch</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setDecisionViewPhase(2)}
                              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                decisionViewPhase === 2
                                  ? 'bg-blue-600 text-white shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                              }`}
                            >
                              <Cpu className="w-3.5 h-3.5" />
                              <span>Phase 2 MVP</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setDecisionViewPhase(1)}
                              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                decisionViewPhase === 1
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                              }`}
                            >
                              <BarChart2 className="w-3.5 h-3.5" />
                              <span>Phase 1 Validate</span>
                            </button>
                          </div>
                        </div>

                        {/* ── PHASE 3 COMMERCIAL DECISION GATE ── */}
                        {decisionViewPhase === 3 && (
                          <div className="relative rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 space-y-4 shadow-xs overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-slate-900 via-slate-700 to-emerald-600" />

                            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 border-b border-slate-100 pb-3.5">
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 shrink-0">
                                  <Rocket className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="font-extrabold text-slate-900 text-sm tracking-tight">
                                      Phase 3: Launch Report & Scaling Decision Gate
                                    </h4>
                                    <span className="text-[9px] font-mono font-bold text-slate-800 uppercase px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 shrink-0">
                                      Commercial Gate
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-500 mt-0.5">
                                    Autonomous Telemetry Evaluation & Post-Launch Human Decision (Scale / Iterate / Maintain / Kill)
                                  </p>
                                </div>
                              </div>
                              <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${
                                project?.decisionNotice
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : isLiveLaunch
                                  ? 'bg-slate-100 text-slate-900 border-slate-300'
                                  : 'bg-amber-100 text-amber-800 border-amber-300'
                              }`}>
                                {project?.decisionNotice ? (
                                  <>
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                    <span>Decision Recorded</span>
                                  </>
                                ) : isLiveLaunch ? (
                                  <>
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                    <span>Production Live</span>
                                  </>
                                ) : (
                                  <>
                                    <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                    <span>Pre-Launch Prep</span>
                                  </>
                                )}
                              </span>
                            </div>

                            {/* Active Decision Trajectory Notice */}
                            {project?.decisionNotice ? (
                              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1.5 text-xs">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-mono font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Active Human Strategic Decision</span>
                                  </span>
                                  <span className="text-[10px] text-emerald-700/80 font-mono">Recorded in Launch OS</span>
                                </div>
                                <p className="text-xs font-bold text-slate-900 leading-relaxed">{project.decisionNotice}</p>
                              </div>
                            ) : (
                              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
                                <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-slate-800 uppercase tracking-wider">
                                  <Sparkles className="w-3.5 h-3.5 text-slate-600" />
                                  <span>Executive Co-Founder Choice Required</span>
                                </div>
                                <p className="text-[11px] text-slate-700 leading-relaxed">
                                  Review launch performance below and choose an operating path: <strong>Scale</strong>, <strong>Iterate</strong>, <strong>Maintain</strong>, or <strong>Kill</strong>.
                                </p>
                              </div>
                            )}

                            {/* Telemetry 4-Cards Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all flex flex-col justify-between shadow-2xs">
                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Live Revenue</span>
                                <div className="text-base font-black text-emerald-700 my-1 font-mono">
                                  ${(Number(project.telemetry?.revenue || presalesRevenue || 0)).toLocaleString()}
                                </div>
                                <span className="text-[9px] text-slate-500 block">Total processed</span>
                              </div>
                              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all flex flex-col justify-between shadow-2xs">
                                <span className="text-[9px] font-bold text-slate-700 uppercase tracking-wider block">Paying Backers</span>
                                <div className="text-base font-black text-slate-900 my-1 font-mono">
                                  {project.telemetry?.customers || backersCount || 0}
                                </div>
                                <span className="text-[9px] text-slate-500 block">Active customers</span>
                              </div>
                              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-300 transition-all flex flex-col justify-between shadow-2xs">
                                <span className="text-[9px] font-bold text-blue-700 uppercase tracking-wider block">Conversion Rate</span>
                                <div className="text-base font-black text-blue-700 my-1 font-mono">
                                  {conversionRate.toFixed(1)}%
                                </div>
                                <span className="text-[9px] text-blue-600/80 block">Visitor-to-paid</span>
                              </div>
                              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-emerald-300 transition-all flex flex-col justify-between shadow-2xs">
                                <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider block">Technical Health</span>
                                <div className="text-base font-black text-emerald-700 my-1 font-mono">
                                  99.98%
                                </div>
                                <span className="text-[9px] text-emerald-600/80 block">&lt;150ms latency</span>
                              </div>
                            </div>

                            {/* AI Executive Assessment */}
                            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-slate-700 shadow-2xs">
                              <div className="flex flex-wrap items-center justify-between gap-1.5">
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                                  <Sparkles className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                                  <span>AI Launch Report Milestone Assessment</span>
                                </div>
                                <span className="text-[9px] font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 font-bold shrink-0">
                                  Recommended: SCALE (Score 96/100)
                                </span>
                              </div>
                              <p className="text-[11px] leading-relaxed text-slate-700">
                                Instagram Stories is currently the top-performing acquisition channel at <strong className="text-slate-900">8.2% paid conversion</strong> (3.9x higher than email newsletter at <strong className="text-slate-900">2.1%</strong>). With zero critical technical exceptions and sub-150ms latency, the venture has demonstrated product-market fit and is primed for accelerated scaling.
                              </p>
                            </div>
                          </div>
                        )}

                        {/* ── PHASE 2 MVP LAUNCH GATE ── */}
                        {decisionViewPhase === 2 && (
                          <div className="relative rounded-2xl bg-white border border-blue-200 p-4 sm:p-5 space-y-4 shadow-xs overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500" />

                            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 border-b border-slate-100 pb-3.5">
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <div className="w-8 h-8 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0">
                                  <Cpu className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="font-extrabold text-slate-900 text-sm tracking-tight">
                                      Phase 2: MVP Launch Gate & Readiness Checkpoint
                                    </h4>
                                    <span className="text-[9px] font-mono font-bold text-blue-700 uppercase px-2 py-0.5 rounded-md bg-blue-100 border border-blue-200 shrink-0">
                                      Engineering Gate
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-500 mt-0.5">
                                    Code Build Verification, QA Test Suite Execution & Production Deployment Clearance
                                  </p>
                                </div>
                              </div>
                              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border shrink-0 bg-blue-100 text-blue-800 border-blue-300">
                                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                <span>MVP Built & Verified</span>
                              </span>
                            </div>

                            <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-slate-700 leading-relaxed shadow-2xs">
                              Engineering tasks and QA testing have confirmed readiness. Commercial launch clearance verified for Phase 3.
                            </div>
                          </div>
                        )}

                        {/* ── PHASE 1 VALIDATION GATE CHECKPOINT ── */}
                        {decisionViewPhase === 1 && (
                          <div className="relative rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 space-y-4 shadow-xs overflow-hidden">
                            {/* Top Accent Gradient Bar */}
                            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-slate-900 via-slate-700 to-emerald-600" />

                            {/* Card Title & Checkpoint Badge */}
                            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 border-b border-slate-100 pb-3.5">
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 shrink-0">
                                  <Flag className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="font-extrabold text-slate-900 text-sm tracking-tight">
                                      5. Validation Gate Checkpoint
                                    </h4>
                                    <span className="text-[9px] font-mono font-bold text-slate-800 uppercase px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 shrink-0">
                                      Executive Gate
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-500 mt-0.5">
                                    Pre-Order Demand & Willingness-to-Pay Threshold
                                  </p>
                                </div>
                              </div>
                              <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${
                                isRevenueGoalMet
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : isFounderApproved
                                  ? 'bg-blue-100 text-blue-800 border-blue-300'
                                  : 'bg-amber-100 text-amber-800 border-amber-300'
                              }`}>
                                {isRevenueGoalMet ? (
                                  <>
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                    <span>Validated</span>
                                  </>
                                ) : isFounderApproved ? (
                                  <>
                                    <Zap className="w-3.5 h-3.5 text-blue-600" />
                                    <span>Sprint Active</span>
                                  </>
                                ) : (
                                  <>
                                    <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                    <span>Validating</span>
                                  </>
                                )}
                              </span>
                            </div>

                            {/* Telemetry 4-Cards Cohesive Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all flex flex-col justify-between shadow-2xs">
                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Target Goal</span>
                                <div className="text-base font-black text-slate-900 my-1 font-mono">
                                  ${presaleGoal.toLocaleString()}
                                </div>
                                <span className="text-[9px] text-slate-500 block">Presale threshold</span>
                              </div>
                              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-emerald-300 transition-all flex flex-col justify-between shadow-2xs">
                                <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider block">Actual Revenue</span>
                                <div className="text-base font-black text-emerald-700 my-1 font-mono">
                                  ${currentPresales.toLocaleString()}
                                </div>
                                <span className="text-[9px] text-emerald-600 font-medium block">
                                  {backersCount} paying backer{backersCount === 1 ? '' : 's'}
                                </span>
                              </div>
                              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all flex flex-col justify-between shadow-2xs">
                                <span className="text-[9px] font-bold text-slate-700 uppercase tracking-wider block">Conversion Rate</span>
                                <div className="text-base font-black text-slate-900 my-1 font-mono">
                                  {conversionRate.toFixed(1)}%
                                </div>
                                <span className="text-[9px] text-slate-500 block">Traffic-to-order</span>
                              </div>
                              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all flex flex-col justify-between shadow-2xs">
                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Gate Status</span>
                                <div className={`text-base font-black my-1 ${
                                  isRevenueGoalMet ? 'text-emerald-700' : isFounderApproved ? 'text-blue-700' : 'text-amber-700'
                                }`}>
                                  {isRevenueGoalMet ? 'PASSED' : isFounderApproved ? 'APPROVED' : 'IN PROGRESS'}
                                </div>
                                <span className="text-[9px] text-slate-500 block">
                                  {isRevenueGoalMet ? 'Threshold Met' : isFounderApproved ? 'Phase 2 Sprint' : 'Testing Demand'}
                                </span>
                              </div>
                            </div>

                            {/* Sleek Progress Bar */}
                            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 shadow-2xs">
                              <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs">
                                <span className="text-slate-700 font-semibold">Progress Toward Gate</span>
                                <span className="font-mono font-bold text-[11px] text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                                  ${currentPresales.toLocaleString()} / ${presaleGoal.toLocaleString()} • {presaleGoal > 0 ? Math.min(100, Math.round((currentPresales / presaleGoal) * 100)) : 0}%
                                </span>
                              </div>
                              <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-300">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    isRevenueGoalMet
                                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-xs'
                                      : isFounderApproved
                                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 shadow-xs'
                                      : 'bg-gradient-to-r from-slate-900 via-slate-700 to-emerald-600'
                                  }`}
                                  style={{ width: `${presaleGoal > 0 ? Math.min(100, Math.max(currentPresales > 0 ? 3 : 0, Math.round((currentPresales / presaleGoal) * 100))) : 0}%` }}
                                />
                              </div>
                            </div>

                            {/* AI Validation Co-Pilot Assessment */}
                            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-slate-700 shadow-2xs">
                              <div className="flex flex-wrap items-center justify-between gap-1.5">
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                                  <Sparkles className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                                  <span>AI Executive Assessment</span>
                                </div>
                                <span className="text-[9px] font-mono text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 shrink-0 font-bold">
                                  Verified
                                </span>
                              </div>
                              <div className="text-[11px] leading-relaxed text-slate-700">
                                {isRevenueGoalMet ? (
                                  <div className="flex items-start gap-1.5">
                                    <Flame className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                                    <span>
                                      <strong className="text-slate-900 font-bold">Target Reached:</strong> Presale target (<strong className="text-emerald-700">${presaleGoal.toLocaleString()}</strong>) validated with <strong className="text-emerald-700">${currentPresales.toLocaleString()}</strong> across <strong className="text-slate-900">{backersCount}</strong> backer{backersCount === 1 ? '' : 's'} (<strong className="text-slate-900 font-bold">{conversionRate.toFixed(1)}%</strong> conv.). Recommending <strong className="text-emerald-700 font-bold">Build MVP</strong> for Phase 2.
                                    </span>
                                  </div>
                                ) : isFounderApproved ? (
                                  <div className="flex items-start gap-1.5">
                                    <Rocket className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                                    <span>
                                      <strong className="text-slate-900 font-bold">Founder Greenlit:</strong> Approved for <strong className="text-blue-700 font-bold">Phase 2: Build MVP</strong> with <strong className="text-emerald-700">${currentPresales.toLocaleString()}</strong> presale revenue, <strong className="text-slate-900">{backersCount}</strong> backer{backersCount === 1 ? '' : 's'} (<strong className="text-slate-900 font-bold">{conversionRate.toFixed(1)}%</strong> conv.). Pre-orders remain open during development.
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex items-start gap-1.5">
                                    <BarChart2 className="w-3.5 h-3.5 text-slate-600 shrink-0 mt-0.5" />
                                    <span>
                                      <strong className="text-slate-900 font-bold">Validation Underway:</strong> <strong className="text-emerald-700">${currentPresales.toLocaleString()}</strong> in pre-orders, <strong className="text-slate-900">{backersCount}</strong> backer{backersCount === 1 ? '' : 's'} (<strong className="text-slate-900 font-bold">{conversionRate.toFixed(1)}%</strong> conv.) toward <strong className="text-slate-900 font-bold">${presaleGoal.toLocaleString()}</strong> target ({presaleGoal > 0 ? Math.min(100, Math.round((currentPresales / presaleGoal) * 100)) : 0}%). Continue campaigns or execute a gate decision below.
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )
                  })()}

                  {/* RECORDED DECISION LOGS & AUDIT TRAIL */}
                  <div className="space-y-2.5 pt-2 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                          Decision History & Gate Audit Trail
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {decisionsList.length} recorded
                      </span>
                    </div>

                    {decisionsList.length === 0 ? (
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-slate-500 text-xs">
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
                            <div key={d.id || i} className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1.5 hover:border-slate-300 hover:shadow-xs transition-all shadow-2xs">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className={`w-2 h-2 rounded-full shrink-0 ${isScale ? 'bg-emerald-500' : isPassed ? 'bg-emerald-500' : isIterate ? 'bg-amber-500' : 'bg-rose-500'}`} />
                                  <span className="font-bold text-slate-900 text-xs truncate">
                                    {formatDecisionTitle(d)}
                                  </span>
                                </div>
                                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${
                                  isScale
                                    ? 'text-emerald-800 bg-emerald-100 border-emerald-200'
                                    : isPassed
                                    ? 'text-emerald-800 bg-emerald-100 border-emerald-200'
                                    : isIterate
                                    ? 'text-amber-800 bg-amber-100 border-amber-200'
                                    : 'text-rose-800 bg-rose-100 border-rose-200'
                                }`}>
                                  {isScale
                                    ? 'Scale Mode Active'
                                    : isMaintain
                                    ? 'Steady-State'
                                    : isPassed
                                    ? 'Approved & Passed'
                                    : isIterate
                                    ? 'Iteration Sprint'
                                    : isKilled
                                    ? 'Archived'
                                    : d.status || 'Decided'}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-600 leading-relaxed">{d.notes || d.description || 'Executive co-founder decision recorded.'}</p>
                              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-[10px] text-slate-400 font-mono">
                                <span>{formatDecisionDate(d.decidedAt || d.timestamp || d.date)}</span>
                                {(d.achievedRevenue !== undefined || d.targetRevenue !== undefined) && (
                                  <span className="text-slate-600 font-sans font-medium">
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

          {/* BOTTOM WORKFLOW BANNER (CLEAN LIGHT THEME) */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 shadow-2xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 shrink-0 shadow-2xs">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 block">AI Project Manager</span>
                  <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                    Creates tasks, tracks progress, unblocks, and adapts the plan.
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 shrink-0 shadow-2xs">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 block">Creator Portal</span>
                  <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                    Simple daily tasks with ready-to-use content.
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0 shadow-2xs">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 block">Human Decisions</span>
                  <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                    Important decisions come to your inbox.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* Step Guard Warning Toast */}
      {toastNotice && (
        <div className="fixed bottom-6 right-6 z-[10000] flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-900/95 border border-amber-500/50 text-amber-200 shadow-2xl animate-fade-in text-xs font-semibold max-w-md backdrop-blur-md">
          <Lock className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastNotice}</span>
        </div>
      )}

      {/* PHASE EXECUTION MODAL (PHASE 1 / PHASE 2 / PHASE 3) - CLEAN WHITE THEME */}
      {showPhaseExecutionModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-900/15 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-6 animate-fade-in overflow-hidden">
          <div className="max-w-5xl w-full max-h-[92vh] overflow-y-auto rounded-3xl bg-white border border-slate-200 p-6 pb-12 space-y-6 shadow-2xl overscroll-contain text-slate-900 phase-modal-white-theme">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs">
                  <CreatorForgeLogo size={20} showText={false} theme="light" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                    Phase {currentPhase}: {currentPhase === 2 ? 'Build MVP Execution Workspace' : currentPhase === 3 ? 'Launch Execution Workspace' : 'Validation Execution Workspace'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {project.productName} × {project.creatorName}
                  </p>
                </div>
              </div>

              <button
                onClick={closePhaseModal}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
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
                  handleAdvancePhase(3)
                  setSelectedPhaseTab(3)
                  setSelectedPhaseStep('prep')
                }}
              />
            ) : currentPhase === 3 ? (
              <Phase3Launch
                project={project}
                api={api}
                activeStepId={selectedPhaseStep}
                onSelectStep={openPhaseStep}
                onUpdateProject={onUpdateProject}
              />
            ) : (
              <Phase1Validate
                project={project}
                api={api}
                activeStepId={selectedPhaseStep}
                onSelectStep={openPhaseStep}
                onUpdateProject={onUpdateProject}
                onAdvanceToPhase2={() => {
                  handleAdvancePhase(2)
                  setSelectedPhaseTab(2)
                  setSelectedPhaseStep('plan')
                }}
              />
            )}
          </div>
        </div>,
        document.body
      )}

      {/* SHARE CREATOR PORTAL MODAL */}
      {showShareModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-900/15 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-6 animate-fade-in overflow-hidden">
          <div className="max-w-2xl w-full p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-2xl max-h-[92vh] flex flex-col overscroll-contain text-slate-900">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-slate-100 text-slate-800 border border-slate-200">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {userRole === 'creator' ? 'Share Your Co-Founder Portal' : 'Creator Co-Founder Portal & Email Dispatch'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {userRole === 'creator'
                      ? 'Private access link to your active venture workbench'
                      : `Passwordless access link & luxury email invite for ${project.creatorName || 'Creator'}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* CREATOR VIEW: CARRY ONLY CREATOR URL */}
            {userRole === 'creator' ? (
              <div className="space-y-4 py-2">
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                      Your Co-Founder Portal URL
                    </span>
                    <span className="text-[10px] font-mono text-emerald-800 font-bold bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                      Private Token Active
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={portalUrl}
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-mono text-slate-900 outline-none select-all shadow-2xs focus:border-slate-500"
                    />
                    <button
                      onClick={() => handleCopy(portalUrl, 'portal_url')}
                      className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
                    >
                      {copiedKey === 'portal_url' ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'portal_url' ? 'Copied Link' : 'Copy Link'}</span>
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    Bookmark this private link to access your live workbench, real-time telemetry, and partner sprint progress anytime without needing a password.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                  <a
                    href={portalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900 hover:text-slate-700 transition-colors"
                  >
                    <span>Open in new tab</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={() => setShowShareModal(false)}
                    className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all shadow-xs cursor-pointer active:scale-95"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              /* ADMIN DASH VIEW: FULL SUITE IN CLEAN WHITE BG */
              <>
                {/* Modal Navigation Tabs */}
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 border border-slate-200 rounded-xl shrink-0">
                  <button
                    type="button"
                    onClick={() => setShareTab('email')}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      shareTab === 'email'
                        ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
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
                        ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
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
                        ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
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
                        <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                          Recipient Email (Creator)
                        </label>
                        <input
                          type="email"
                          value={portalRecipientEmail}
                          onChange={(e) => setPortalRecipientEmail(e.target.value)}
                          placeholder="creator@example.com"
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-900 outline-none focus:border-slate-500 focus:bg-white"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                          Subject Line
                        </label>
                        <input
                          type="text"
                          value={portalEmailSubject}
                          onChange={(e) => setPortalEmailSubject(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 outline-none focus:border-slate-500 focus:bg-white"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                          Personalized Message Body
                        </label>
                        <textarea
                          rows={5}
                          value={portalEmailBody}
                          onChange={(e) => setPortalEmailBody(e.target.value)}
                          className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 outline-none leading-relaxed font-sans resize-none focus:border-slate-500 focus:bg-white"
                        />
                      </div>

                      {portalEmailStatus && (
                        <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                          portalEmailSuccess
                            ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
                            : 'bg-rose-50 border border-rose-300 text-rose-800'
                        }`}>
                          {portalEmailSuccess ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                          <span>{portalEmailStatus}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-end pt-1">
                        <button
                          type="button"
                          onClick={handleSendPortalEmail}
                          disabled={isSendingPortalEmail}
                          className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
                        >
                          {isSendingPortalEmail ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Dispatching...</span>
                            </>
                          ) : portalEmailSuccess ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-200" />
                              <span>Sent Successfully!</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-3.5 h-3.5" />
                              <span>Send Portal Invite Email</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: LUXURY VISUAL EMAIL PREVIEW */}
                  {shareTab === 'preview' && (
                    <div className="space-y-3 animate-fade-in">
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 shadow-2xs">
                        {/* Simulated Email Client Bar */}
                        <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-[11px] space-y-1 font-mono text-slate-600">
                          <div><strong className="text-slate-900">From:</strong> Creator Forge Venture Studio &lt;partnerships@creatorforge.com&gt;</div>
                          <div><strong className="text-slate-900">To:</strong> {portalRecipientEmail || 'creator@example.com'}</div>
                          <div><strong className="text-slate-900">Subject:</strong> {portalEmailSubject}</div>
                        </div>

                        {/* Email Card Preview */}
                        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden text-xs shadow-2xs">
                          <div className="p-4 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Rocket className="w-4 h-4 text-slate-800" />
                              <span className="font-extrabold text-slate-950 text-sm">CREATOR FORGE</span>
                            </div>
                            <span className="text-[10px] uppercase font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                              Verified Invite
                            </span>
                          </div>

                          <div className="p-5 space-y-3 text-slate-700 leading-relaxed font-sans">
                            <p className="whitespace-pre-line text-slate-800 font-medium">
                              {portalEmailBody}
                            </p>

                            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                              <div className="font-bold text-slate-900 text-xs">Co-Launch Venture Snapshot</div>
                              <div className="grid grid-cols-2 gap-2 text-[11px]">
                                <div><span className="text-slate-500">Software:</span> <strong className="text-slate-900">{project.productName || 'Custom App'}</strong></div>
                                <div><span className="text-slate-500">Revenue Split:</span> <strong className="text-emerald-700">50% Net Creator Share</strong></div>
                                <div><span className="text-slate-500">Initial Pricing:</span> <strong className="text-slate-900">{project.pricing || '$49/mo'}</strong></div>
                                <div><span className="text-slate-500">Validation Goal:</span> <strong className="text-emerald-700">${presaleTarget.toLocaleString()}</strong></div>
                              </div>
                            </div>

                            <div className="pt-2 text-center">
                              <a
                                href={magicPortalUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-xs transition-all"
                              >
                                <span>Open Co-Founder Portal (Passwordless Access)</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </div>

                          {/* Email Footer */}
                          <div className="p-4 bg-slate-50 border-t border-slate-200 text-center text-[10px] text-slate-500 space-y-0.5">
                            <div className="font-bold text-slate-700">Creator Forge Venture Studio</div>
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
                        <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                          Secure Magic Link (No Password Required)
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            readOnly
                            value={magicPortalUrl}
                            className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 outline-none select-all"
                          />
                          <button
                            onClick={() => handleCopy(magicPortalUrl, 'link')}
                            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            {copiedKey === 'link' ? <Check className="w-3.5 h-3.5 text-emerald-200" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedKey === 'link' ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Kickoff DM Message */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                            Social DM / WhatsApp Invite Message
                          </label>
                          <button
                            onClick={() => handleCopy(kickoffMessage, 'msg')}
                            className="text-xs text-slate-900 hover:text-slate-700 font-bold flex items-center gap-1 cursor-pointer"
                          >
                            {copiedKey === 'msg' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedKey === 'msg' ? 'Copied Message' : 'Copy Message'}</span>
                          </button>
                        </div>
                        <textarea
                          readOnly
                          rows={6}
                          value={kickoffMessage}
                          className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 outline-none leading-relaxed font-sans resize-none select-all"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Modal Actions Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-200 shrink-0">
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-bold">
                    <ShieldCheck className="w-4 h-4" />
                    <span>{shareNotice || 'Magic token active & verified'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={magicPortalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <span>Preview Live Portal</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={() => setShowShareModal(false)}
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* VENTURE FILE PREVIEW MODAL */}
      {previewingFile && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[99999] bg-slate-900/15 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-6 animate-fade-in overflow-hidden">
          <div className="max-w-3xl w-full max-h-[85vh] flex flex-col rounded-3xl bg-white border border-slate-200 p-6 shadow-2xl space-y-4 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>{previewingFile.title}</span>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                      {previewingFile.badge || 'Venture Asset'}
                    </span>
                  </h3>
                  <p className="text-[11px] font-mono text-slate-500">{previewingFile.name} • {previewingFile.size}</p>
                </div>
              </div>
              <button
                onClick={() => setPreviewingFile(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto rounded-xl bg-slate-50 border border-slate-200 p-4 text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed shadow-inner">
              {previewingFile.content}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200 shrink-0">
              <div className="text-[11px] text-slate-500 font-mono">
                Stored in Project Vault • Ready for export
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopy(previewingFile.content, previewingFile.id)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedKey === previewingFile.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === previewingFile.id ? 'Copied' : 'Copy Text'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadFile(previewingFile)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
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

      {/* AUDIENCE INTELLIGENCE, TRANSCRIPTS & ANTI-SPAM MODAL */}
      <AudienceGroundingModal
        isOpen={showAudienceIntelModal}
        onClose={() => setShowAudienceIntelModal(false)}
        project={project}
        initialTab={audienceIntelModalTab}
      />

      {/* TEXT-BASED WORKFLOW WIRING ARCHITECTURE TUTORIAL */}
      <WorkflowWiringTutorial
        isOpen={showWiringTutorial}
        onClose={() => setShowWiringTutorial(false)}
      />
    </div>
  )
}
