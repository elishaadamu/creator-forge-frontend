import { useState, useEffect, useRef, useMemo } from 'react'
import {
  Rocket, CheckCircle2, DollarSign, Copy, Check, Video, MessageSquare,
  Users, ExternalLink, Globe, Sparkles, AlertCircle, ShieldCheck, ArrowRight,
  TrendingUp, Award, Calendar, CheckSquare, Eye, Smartphone, Send, FileText,
  CheckCheck, Loader2, MessageCircle, Zap, Lock, Layers, Cpu, Laptop, CreditCard,
  Plus, RotateCcw, Share2, HelpCircle
} from 'lucide-react'
import { getFrontendUrl, updateCoLaunchProject, getCoLaunchProject, getThreads, getWorkflowState } from '../../services/opsApi'
import { updatePageSEO } from '../../utils/seo'
import { CreatorPortalSkeleton } from './Section2Skeletons'
import { deduplicateAndSortMessages } from './CreatorWhatsAppChat'
import ProjectOS from './ProjectOS'
import DIYSubscriptionModal from './DIYSubscriptionModal'
import CreatorForgeLogo from '../ui/CreatorForgeLogo'
import PostVisualMockup from './PostVisualMockup'
import { getPhase1StepGuards, getPhase2StepGuards, getPhase3StepGuards } from '../../utils/stepGuards'

export default function CreatorPortal({ portalId }) {
  const [loading, setLoading] = useState(true)
  const [project, setProject] = useState(null)
  const [selectedTrack, setSelectedTrack] = useState('interactive') // 'interactive' | 'managed'
  const [trackChoiceDismissed, setTrackChoiceDismissed] = useState(false)
  const [toast, setToast] = useState('')
  const [copiedKey, setCopiedKey] = useState(null)
  const [showDiyModal, setShowDiyModal] = useState(false)
  const [viewDraftTask, setViewDraftTask] = useState(null)
  const [portalDraftViewMode, setPortalDraftViewMode] = useState('visual') // 'visual' | 'text'
  const [showAgreementModal, setShowAgreementModal] = useState(false)
  const [creatorReplyText, setCreatorReplyText] = useState('')
  const [isSendingReply, setIsSendingReply] = useState(false)
  const [section1Threads, setSection1Threads] = useState([])
  const [creatorAvatar, setCreatorAvatar] = useState(null)
  const [avatarLoadError, setAvatarLoadError] = useState(false)
  const chatMessagesEndRef = useRef(null)

  const productName = project?.productName || project?.name || 'Software Co-Launch'
  const creatorName = project?.creatorName || 'Creator Partner'
  const ventureSlug = (productName || 'venture').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  // Resolve creator avatar from project or creator lookup
  useEffect(() => {
    let isMounted = true
    const resolveAvatar = async () => {
      const direct = project?.creatorAvatar || project?.creator_avatar || project?.avatar || project?.avatar_url
      if (direct) {
        setCreatorAvatar(direct)
        return
      }
      if (project?.creatorId || project?.creatorHandle) {
        try {
          const { getCreators } = await import('../../services/opsApi')
          const allCreators = await getCreators()
          if (isMounted && Array.isArray(allCreators)) {
            const cId = project?.creatorId
            const cHandle = (project?.creatorHandle || '').toLowerCase().replace(/^@/, '').trim()
            const match = allCreators.find(c =>
              (cId && String(c.id) === String(cId)) ||
              (cHandle && (c.handle || '').toLowerCase().replace(/^@/, '').trim() === cHandle)
            )
            if (match?.avatar_url || match?.avatar) {
              setCreatorAvatar(match.avatar_url || match.avatar)
            }
          }
        } catch (e) {
          console.warn('[CreatorPortal] Avatar resolution error:', e)
        }
      }
    }
    resolveAvatar()
    return () => { isMounted = false }
  }, [project?.creatorAvatar, project?.creator_avatar, project?.avatar, project?.avatar_url, project?.creatorId, project?.creatorHandle])

  useEffect(() => {
    updatePageSEO({
      title: project?.creatorName ? `${project.creatorName} — Partner Co-Founder Portal | Creator Forge` : "Partner Co-Founder Portal — Creator Forge",
      description: "Review your tailored software concepts, 50/50 revenue split dashboard, and launch roadmap with Creator Forge Studio.",
      image: "/og-image.svg"
    });
  }, [project?.creatorName]);

  // Fetch project from backend API on mount or when URL params/portalId changes
  useEffect(() => {
    let isMounted = true
    const fetchProject = async () => {
      try {
        const params = new URLSearchParams(window.location.search)
        const targetId = portalId || params.get('project') || params.get('id')
        const { getCoLaunchProject, getCoLaunchProjects } = await import('../../services/opsApi')

        let fetched = null
        if (targetId && targetId !== 'portal') {
          try {
            fetched = await getCoLaunchProject(targetId)
          } catch (e) {
            console.warn('[CreatorPortal] Specific project fetch failed:', e)
          }
        }

        if (!fetched) {
          try {
            const all = await getCoLaunchProjects()
            if (Array.isArray(all) && all.length > 0) {
              fetched = all[0]
            }
          } catch (e) {
            console.warn('[CreatorPortal] All projects fetch failed:', e)
          }
        }

        if (isMounted && fetched) {
          setProject(fetched)
        }
      } catch (err) {
        console.warn('[CreatorPortal] Failed to sync project from API:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchProject()
    return () => {
      isMounted = false
    }
  }, [portalId])

  useEffect(() => {
    const handleSync = (e) => {
      try {
        const updated = (e?.detail && typeof e.detail === 'object') ? e.detail : null
        if (updated) {
          setProject(updated)
          if (updated.isDIY || updated.diySubscription?.active || updated.diyOfferStatus === 'accepted') {
            setTrackChoiceDismissed(true)
          }
        }
      } catch (e) {}
    }
    const handleViewChange = (e) => {
      try {
        if (e?.detail && typeof e.detail === 'string') {
          setActiveMainView(e.detail)
          setTrackChoiceDismissed(true)
        }
      } catch (e) {}
    }
    window.addEventListener('forge_project_updated', handleSync)
    window.addEventListener('forge_view_change', handleViewChange)
    return () => {
      window.removeEventListener('forge_project_updated', handleSync)
      window.removeEventListener('forge_view_change', handleViewChange)
    }
  }, [])

  const [activeMainView, setActiveMainView] = useState(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search)
      const v = sp.get('view')
      if (v === 'launch_kit') return 'launch_kit'
      if (v === 'projectos' || v === 'pipeline' || v === 'diy') {
        return 'projectos'
      }
      const isPaidParam = sp.get('token') === 'cf_diy_paid' || sp.get('paid') === 'true'
      if (isPaidParam) {
        return 'projectos'
      }
    }
    return 'projectos'
  })

  const [activeTab, setActiveTab] = useState('tasks') // 'tasks' | 'scripts' | 'presales' | 'messages' | 'strategy'
  const [activeScriptTab, setActiveScriptTab] = useState('post') // 'post' | 'video' | 'dm'

  // Single authoritative source of truth: Database project state
  const isDiyFromDb = Boolean(
    project?.isDIY ||
    project?.diySubscription?.active ||
    project?.diyOfferStatus === 'accepted' ||
    project?.diyOfferStatus === 'paid'
  )

  const urlToken = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('token') : null
  const urlPaidParam = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('paid') : null
  const isExplicitUrlPaid = urlToken === 'cf_diy_paid' || urlPaidParam === 'true'

  // The database is the ONLY source of truth for payment status. No localStorage mocking!
  const isDiyActive = Boolean(isDiyFromDb || isExplicitUrlPaid)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Purge all legacy localStorage test flags to ensure DB is the sole source of truth
      try {
        if (project?.id) localStorage.removeItem(`forge_diy_paid_${project.id}`)
        if (project?.creatorHandle) localStorage.removeItem(`forge_diy_paid_${project.creatorHandle.replace(/^@/, '').toLowerCase()}`)
        if (portalId) localStorage.removeItem(`forge_diy_paid_${portalId}`)
        localStorage.removeItem('forge_diy_paid')
      } catch (e) {}
    }
  }, [project?.id, project?.creatorHandle, portalId])

  const [defaultPassPrice, setDefaultPassPrice] = useState(50)

  useEffect(() => {
    try { localStorage.removeItem('forge_cobuilder_pass_price') } catch (e) {}

    getWorkflowState().then((wf) => {
      const dbFee = wf?.default_pass_price ?? wf?.cobuilder_pass_price ?? wf?.extra_state?.default_pass_price ?? wf?.extra_state?.cobuilder_pass_price
      if (dbFee !== undefined && dbFee !== null && !isNaN(Number(dbFee))) {
        setDefaultPassPrice(Number(dbFee))
      }
    }).catch(() => {})

    const handlePriceEvent = (e) => {
      const p = e?.detail
      if (p !== undefined && p !== null && !isNaN(Number(p))) {
        setDefaultPassPrice(Number(p))
      }
    }
    window.addEventListener('forge_pass_price_changed', handlePriceEvent)
    return () => {
      window.removeEventListener('forge_pass_price_changed', handlePriceEvent)
    }
  }, [])

  const hasCustomFee = Boolean(
    project?.hasCustomFee ||
    project?.metadataInfo?.hasCustomFee ||
    project?.metadata_info?.hasCustomFee
  )

  const cobuilderPrice = Number(
    hasCustomFee
      ? (project?.diyFee ??
         project?.diyPassPrice ??
         project?.metadataInfo?.diy_fee ??
         project?.metadataInfo?.diyFee ??
         project?.metadataInfo?.diyPassPrice ??
         project?.metadata_info?.diy_fee ??
         project?.diySubscription?.amount ??
         defaultPassPrice ??
         50)
      : (defaultPassPrice ??
         project?.diyFee ??
         project?.diyPassPrice ??
         project?.metadataInfo?.diy_fee ??
         project?.metadataInfo?.diyFee ??
         project?.metadataInfo?.diyPassPrice ??
         50)
  )

  // When creator has paid, projectOS is the default view (unless explicitly overridden by URL)
  const hasAutoSwitchedToProjectOS = useRef(false)
  useEffect(() => {
    if (!hasAutoSwitchedToProjectOS.current && isDiyActive) {
      if (typeof window !== 'undefined') {
        const sp = new URLSearchParams(window.location.search)
        if (sp.get('view') === 'launch_kit') return
      }
      setActiveMainView('projectos')
      hasAutoSwitchedToProjectOS.current = true
    }
  }, [isDiyActive])

  const isTrackChoiceUrl = typeof window !== 'undefined' && (
    new URLSearchParams(window.location.search).get('offer') === 'track_choice' ||
    new URLSearchParams(window.location.search).get('track') === 'choice'
  )

  // Critical fix: If the user has already paid ($50 Co-Builder) or accepted/dismissed, track choice MUST NOT block them
  const isTrackChoicePending = !isDiyActive && !trackChoiceDismissed && project?.diyOfferStatus !== 'accepted' && project?.diyOfferStatus !== 'paid' && (
    isTrackChoiceUrl ||
    project?.diyOfferStatus !== 'declined'
  )

  // Automatically clean up offer/track URL params once paid/active on Track 1
  useEffect(() => {
    if (typeof window !== 'undefined' && isDiyActive) {
      const searchParams = new URLSearchParams(window.location.search)
      if (searchParams.has('offer') || searchParams.has('track')) {
        searchParams.delete('offer')
        searchParams.delete('track')
        const newSearch = searchParams.toString()
        const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : '') + window.location.hash
        window.history.replaceState({}, '', newUrl)
      }
    }
  }, [isDiyActive])

  const handleUpdateProject = (updatedProj) => {
    setProject(updatedProj)
    if (updatedProj?.id) {
      updateCoLaunchProject(updatedProj.id, updatedProj).catch(() => {})
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('forge_project_updated', { detail: updatedProj }))
    }
  }

  const handleDeclineDiyOffer = async () => {
    if (!project) return
    const updated = {
      ...project,
      diyOfferStatus: 'declined',
      isDIY: false
    }
    handleUpdateProject(updated)
    setTrackChoiceDismissed(true)
    setActiveMainView('launch_kit')
    showToast('Standard Studio-Managed track active (50/50 Revenue Split).')
  }

  const handleUnlockDiySuccess = (subRecordOrProj) => {
    if (!project) return
    const subRecord = subRecordOrProj?.diySubscription || subRecordOrProj
    const updated = {
      ...project,
      isDIY: true,
      diyOfferStatus: 'accepted',
      diySubscription: subRecord
    }
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search)
      searchParams.delete('offer')
      searchParams.delete('track')
      const newSearch = searchParams.toString()
      const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : '') + window.location.hash
      window.history.replaceState({}, '', newUrl)
    }
    handleUpdateProject(updated)
    setTrackChoiceDismissed(true)
    setShowDiyModal(false)
    setActiveMainView('projectos')
    showToast(`Interactive Co-Builder Pass active ($${cobuilderPrice} USD)!`)
  }

  // Load Section 1 outreach and threads
  useEffect(() => {
    let isMounted = true
    const loadThreads = async () => {
      try {
        const allThreads = await getThreads()
        if (isMounted && Array.isArray(allThreads)) {
          const cId = project?.creatorId
          const cHandle = (project?.creatorHandle || '').toLowerCase().replace(/^@/, '').trim()
          const cEmail = (project?.creatorEmail || project?.email_public || '').toLowerCase().trim()
          const cName = (project?.creatorName || '').toLowerCase().trim()

          const matchingThreads = allThreads.filter(t => {
            if (!t) return false
            if (cId && t.creator_id === cId) return true
            if (cHandle && t.creator_handle && t.creator_handle.toLowerCase().replace(/^@/, '').trim() === cHandle) return true
            if (cEmail && t.creator_email && t.creator_email.toLowerCase().trim() === cEmail) return true
            if (cName && cName.length >= 3 && (t.subject || '').toLowerCase().includes(cName)) return true
            return false
          })

          const collected = []
          matchingThreads.forEach(t => {
            if (t.initial_body || t.body) {
              collected.push({
                id: `thread-outreach-${t.id}`,
                sender: 'admin',
                senderName: 'Creator Forge Studio',
                subject: t.subject || 'Partnership Proposal',
                text: t.initial_body || t.body,
                time: t.created_at ? new Date(t.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Section 1',
                rawTime: t.created_at ? new Date(t.created_at).getTime() : 0,
                status: 'read',
                isSection1: true
              })
            }
            const replies = t.replies || []
            replies.forEach(r => {
              const fromAddr = (r.from_address || '').toLowerCase().trim()
              const isFromStudio = fromAddr.includes('creatorforge.com') || fromAddr.includes('partnerships') || fromAddr.includes('studio')
              collected.push({
                id: `reply-${r.id || Math.random()}`,
                sender: isFromStudio ? 'admin' : 'creator',
                senderName: isFromStudio ? 'Creator Forge Studio' : (project?.creatorName || 'You'),
                subject: r.subject || '',
                text: r.body || '',
                time: r.received_at || r.created_at ? new Date(r.received_at || r.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Section 1',
                rawTime: (r.received_at || r.created_at) ? new Date(r.received_at || r.created_at).getTime() : 0,
                status: 'read',
                isSection1: true
              })
            })
          })
          const dedupedThreads = deduplicateAndSortMessages(collected)
          setSection1Threads(dedupedThreads)
        }
      } catch (e) {
        console.warn('[CreatorPortal] Threads error:', e)
      }
    }
    loadThreads()
    return () => { isMounted = false }
  }, [project?.creatorId, project?.creatorHandle, project?.creatorEmail])

  // Real-time polling for messages from the Admin Studio (tab-aware)
  useEffect(() => {
    let isMounted = true
    if (!project?.id) return

    const pollProject = async () => {
      if (typeof document !== 'undefined' && document.hidden) return
      try {
        const fresh = await getCoLaunchProject(project.id)
        if (isMounted && fresh) {
          const curCount = Array.isArray(project?.messages) ? project.messages.length : 0
          const freshCount = Array.isArray(fresh.messages) ? fresh.messages.length : 0
          if (freshCount !== curCount || fresh.currentPresales !== project.currentPresales) {
            setProject(fresh)
          }
        }
      } catch (e) {}
    }

    const interval = setInterval(pollProject, 25000)
    const onVisibilityChange = () => {
      if (typeof document !== 'undefined' && !document.hidden) pollProject()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      isMounted = false
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [project?.id, project?.messages?.length, project?.currentPresales])

  // Combine real Section 1 messages + Section 2 custom messages with deduplication and chronological ordering
  const customProjectMessages = Array.isArray(project?.messages) ? project.messages : []
  const portalDisplayMessages = useMemo(() => {
    return deduplicateAndSortMessages([...section1Threads, ...customProjectMessages])
  }, [section1Threads, customProjectMessages])

  // Auto-scroll on new messages
  useEffect(() => {
    if (activeTab === 'messages') {
      chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [portalDisplayMessages.length, activeTab])

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  const copyToClipboard = (text, key) => {
    if (!text) return
    navigator.clipboard?.writeText(text)
    setCopiedKey(key)
    showToast('Copied to clipboard!')
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const handleSendCreatorMessage = async (e) => {
    e?.preventDefault?.()
    const trimmed = creatorReplyText.trim()
    if (!trimmed || !project) return

    setIsSendingReply(true)
    const newMsg = {
      id: `msg-${Date.now()}`,
      sender: 'creator',
      senderName: project.creatorName || 'Creator Partner',
      text: trimmed,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent'
    }

    const updatedMessages = [...customProjectMessages, newMsg]
    const updatedProject = {
      ...project,
      messages: updatedMessages
    }

    setProject(updatedProject)
    setCreatorReplyText('')
    setIsSendingReply(false)

    if (project.id) {
      updateCoLaunchProject(project.id, { messages: updatedMessages }).catch(() => {})
    }
    showToast('Message sent to Studio!')
  }

  const toggleChecklist = (id) => {
    if (!project) return
    const schedule = (project.campaignKit?.postingSchedule && project.campaignKit.postingSchedule.length > 0)
      ? project.campaignKit.postingSchedule
      : (project.checklist || [])
    const nextSchedule = schedule.map(item =>
      item.id === id ? { ...item, done: !item.done, completed: !item.completed } : item
    )
    const updated = {
      ...project,
      campaignKit: {
        ...(project.campaignKit || {}),
        postingSchedule: nextSchedule
      },
      checklist: nextSchedule
    }
    setProject(updated)
    if (project.id) {
      updateCoLaunchProject(project.id, {
        campaignKit: updated.campaignKit,
        checklist: nextSchedule
      }).catch(() => {})
    }
    showToast('Task status updated!')
  }

  const handleSimulatePreorder = () => {
    if (!project) return
    const currentRes = project.reservations || []
    const newReservation = {
      id: `res-${Date.now()}`,
      name: `Backer #${(currentRes.length + 1)}`,
      email: `member${currentRes.length + 1}@audience.com`,
      amount: 49,
      tier: 'Early Bird Pass',
      created_at: new Date().toISOString()
    }
    const updatedReservations = [newReservation, ...currentRes]
    const updatedRevenue = Number(project.currentPresales || 0) + 49
    const updated = {
      ...project,
      currentPresales: updatedRevenue,
      reservations: updatedReservations
    }
    handleUpdateProject(updated)
    showToast('Simulated backer pre-order recorded (+ $49 USD). Revenue share updated!')
  }

  const getTaskDraftContent = (task) => {
    if (!task) return ''
    const ck = project?.campaignKit || {}
    if (task.draftKey === 'storySequence') return ck.storySequence || 'STORY 1 — Pain Point Poll\nSTORY 2 — Product Solution Reveal\nSTORY 3 — Pre-Order Link & Founding Member Callout'
    if (task.draftKey === 'videoScript') return ck.videoScript || '60s Short-Form Video Script with hook, demo, and CTA'
    if (task.draftKey === 'newsletterDraft') return ck.newsletterDraft || 'Email Newsletter Broadcast Draft detailing the launch'
    if (task.draftKey === 'directMessageScript') return ck.directMessageScript || '1-on-1 DM Script for VIP audience members'
    return ck.announcementPost || 'Social Announcement Post Copy tailored for your community'
  }

  // Dynamic Phase & Step Synchronization directly matched with the Operator / Admin Dashboard
  // MUST BE CALLED UNCONDITIONALLY BEFORE ANY EARLY RETURNS TO PREVENT REACT ERROR #310
  const currentPhase = Number(project?.currentPhase || project?.current_phase || 1)
  const p1Guards = useMemo(() => getPhase1StepGuards(project || {}), [project])
  const p2Guards = useMemo(() => getPhase2StepGuards(project || {}), [project])
  const p3Guards = useMemo(() => getPhase3StepGuards(project || {}), [project])

  const activePhaseSteps = useMemo(() => {
    if (currentPhase === 2) {
      return [
        { id: 'plan', num: '01', label: '1. Plan & Spec', fullLabel: 'Product & Build Plan', isDone: p2Guards.isStep1Done },
        { id: 'build', num: '02', label: '2. Build MVP', fullLabel: 'Engineering Build', isDone: p2Guards.isStep2Done },
        { id: 'beta', num: '03', label: '3. Beta Test', fullLabel: 'Beta Testing', isDone: p2Guards.isStep3Done },
        { id: 'gate', num: '04', label: '4. Launch Gate', fullLabel: 'Iterate & Launch Gate', isDone: p2Guards.isStep4Done },
      ]
    }
    if (currentPhase === 3) {
      return [
        { id: 'prep', num: '01', label: '1. Prepare', fullLabel: 'Launch Preparation', isDone: p3Guards.isStep1Done },
        { id: 'launch', num: '02', label: '2. Launch & Monitor', fullLabel: 'Live Telemetry', isDone: p3Guards.isStep2Done },
        { id: 'review', num: '03', label: '3. Optimization', fullLabel: 'Review & Retarget', isDone: p3Guards.isStep3Done },
        { id: 'scale', num: '04', label: '4. Retention', fullLabel: 'Scale & Community', isDone: p3Guards.isStep4Done },
      ]
    }
    // Default Phase 1 (Validation Execution Workspace - EXACT MATCH with Admin Dashboard!)
    return [
      { id: 'plan', num: '01', label: '1. Plan', fullLabel: 'Validation Plan', isDone: p1Guards.isStep1Done },
      { id: 'assets', num: '02', label: '2. Assets', fullLabel: 'Validation Assets', isDone: p1Guards.isStep2Done },
      { id: 'campaign', num: '03', label: '3. Campaign', fullLabel: 'Creator Campaign', isDone: p1Guards.isStep3Done },
      { id: 'optimize', num: '04', label: '4. Optimize', fullLabel: 'Run & Optimize', isDone: p1Guards.isStep4Done },
      { id: 'gate', num: '05', label: '5. Gate', fullLabel: 'Validation Gate', isDone: p1Guards.isGatePassed || p1Guards.isStep5Done },
    ]
  }, [currentPhase, p1Guards, p2Guards, p3Guards])

  const activeStepIdx = activePhaseSteps.findIndex(s => !s.isDone)
  const resolvedActiveStepIndex = activeStepIdx === -1 ? activePhaseSteps.length - 1 : activeStepIdx
  const resolvedAvatar = creatorAvatar || project?.creatorAvatar || project?.creator_avatar || project?.avatar || project?.avatar_url

  if (loading) {
    return <CreatorPortalSkeleton />
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full p-8 rounded-2xl bg-white border border-slate-200 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center mx-auto">
            <Rocket className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">No Active Creator Project Loaded</h2>
          <p className="text-xs text-slate-500">
            Please ask your co-founder operator to initialize your partnership project and share your link.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      </div>
    )
  }

  const presalesRevenue = Number(project.currentPresales || 0)
  const parseThresholdAmount = (str) => {
    if (!str) return 0
    const match = String(str).replace(/,/g, '').match(/\$(\d+)/)
    return match ? Number(match[1]) : 0
  }
  const derivedPlanTarget = parseThresholdAmount(project.validationPlan?.threshold)
  const presaleTarget = derivedPlanTarget > 0 ? derivedPlanTarget : Number(project.presaleTarget || project.targetRevenue || 7000)
  const creatorRevenueShare = Math.round(presalesRevenue * 0.5)
  const campaignKit = project.campaignKit || {}
  const schedule = (campaignKit.postingSchedule && campaignKit.postingSchedule.length > 0)
    ? campaignKit.postingSchedule
    : (project.checklist && project.checklist.length > 0 ? project.checklist : [
        { id: 'day-1', day: 1, title: 'Problem Teaser & Discovery Poll', channel: 'X Post', isToday: false, done: true, draftKey: 'announcementPost', description: 'Post teaser and survey link to gather audience friction points.' },
        { id: 'day-2', day: 2, title: 'Post Instagram Story #2 — Pain Point Poll & Announcement', channel: 'Instagram Stories', isToday: true, done: false, draftKey: 'storySequence', description: 'Post 3-story sequence with interactive poll sticker to drive warm audience to the pre-order page.' },
        { id: 'day-3', day: 3, title: 'Publish 60-Second Video Demo & Launch Hook', channel: 'TikTok / Reels / Shorts', isToday: false, done: false, draftKey: 'videoScript', description: 'Post 60s short-form demo demonstrating the core solution in action.' },
        { id: 'day-4', day: 4, title: 'Send Deep-Dive Email Newsletter Broadcast', channel: 'Email Newsletter', isToday: false, done: false, draftKey: 'newsletterDraft', description: 'Send dedicated email broadcast detailing feature architecture and founding member bonuses.' },
        { id: 'day-5', day: 5, title: '1-on-1 VIP DM Outreach to 20 High-Intent Members', channel: 'Direct Messages', isToday: false, done: false, draftKey: 'directMessageScript', description: 'Reach out personally to 20 followers who engaged with earlier story polls.' },
        { id: 'day-6', day: 6, title: 'Share Live Pre-Order Milestones & Survey Insights', channel: 'Stories & Community', isToday: false, done: false, draftKey: 'storySequence', description: 'Share validation momentum and backer counts to generate social proof and urgency.' },
        { id: 'day-7', day: 7, title: 'Final 24-Hour Founding Tier Price Lock Push', channel: 'All Social Channels', isToday: false, done: false, draftKey: 'announcementPost', description: 'Final call before founding cohort closes and validation gate locks in.' }
      ])
  const completedTasksCount = schedule.filter(t => t.done || t.completed).length
  const totalTasksCount = schedule.length
  const reservations = project.reservations || []
  const preorderUrl = `${getFrontendUrl()}/preorder?ref=${project.creatorHandle?.replace('@','') || 'creator'}`
  const targetPct = presaleTarget > 0 ? Math.min(100, Math.round((presalesRevenue / presaleTarget) * 100)) : 0

  return (
    <div
      className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans flex flex-col relative antialiased selection:bg-emerald-100 selection:text-emerald-900"
      style={{
        backgroundImage: 'radial-gradient(#cbd5e1 1.25px, transparent 1.25px)',
        backgroundSize: '20px 20px',
      }}
    >
      {/* ── TOP NAV HEADER ──────────────────────────────────────────────────────── */}
      <header className="h-13 sm:h-14 border-b border-slate-200/90 bg-white/95 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between px-3 sm:px-6 shadow-2xs">
        {/* Brand / Partner Identity */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-[#0F172A] border border-slate-800 flex items-center justify-center shadow-xs text-white shrink-0">
            {resolvedAvatar && !avatarLoadError ? (
              <>
                <img
                  src={resolvedAvatar}
                  alt={creatorName || 'Creator'}
                  className="w-full h-full object-cover"
                  onError={() => setAvatarLoadError(true)}
                />
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#0F172A] border border-slate-700 flex items-center justify-center p-0.5 shadow-xs z-10">
                  <CreatorForgeLogo size={8} showText={false} theme="dark" />
                </div>
              </>
            ) : (
              <CreatorForgeLogo size={18} showText={false} theme="dark" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-extrabold text-slate-900 tracking-tight text-xs sm:text-sm truncate max-w-[120px] xs:max-w-[160px] sm:max-w-[200px] md:max-w-[240px]">
                {productName}
              </span>
              <span className="text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-300/80 shrink-0">
                50/50 Portal
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium truncate max-w-[150px] sm:max-w-[200px] hidden sm:block">
              Signed Partner: {creatorName}
            </p>
          </div>
        </div>

        {/* Center & Right Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Main View Switcher (Launch Kit vs ProjectOS) */}
          {!isTrackChoicePending && (
            <div className="hidden md:flex items-center gap-0.5 p-0.5 bg-slate-100/90 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setActiveMainView('launch_kit')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  activeMainView === 'launch_kit'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Launch Kit
              </button>
              <button
                type="button"
                onClick={() => setActiveMainView('projectos')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  activeMainView === 'projectos'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                ProjectOS
              </button>
            </div>
          )}

          {/* Track Indicator & Upgrade Pass Action */}
          {isDiyActive ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 text-[11px] font-mono font-bold shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="hidden sm:inline">Track 1: Co-Builder (${cobuilderPrice} Paid)</span>
              <span className="sm:hidden">Co-Builder (${cobuilderPrice})</span>
            </div>
          ) : isTrackChoicePending ? (
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-300 text-amber-800 text-[11px] font-mono font-bold shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span className="hidden sm:inline">Track Choice Pending</span>
                <span className="sm:hidden">Choice Pending</span>
              </div>
              <button
                type="button"
                onClick={() => setShowDiyModal(true)}
                className="h-7 sm:h-8 flex items-center gap-1.5 px-2.5 sm:px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] sm:text-xs font-bold transition-all duration-150 shadow-xs hover:shadow-sm cursor-pointer active:scale-[0.98] shrink-0"
              >
                <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-300 fill-amber-300" />
                <span className="hidden sm:inline">Co-Builder Pass (${cobuilderPrice})</span>
                <span className="sm:hidden">${cobuilderPrice} Pass</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <div className="hidden xl:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 border border-purple-300/80 text-purple-800 text-[11px] font-mono font-bold shadow-2xs">
                <span>🤝</span>
                <span>Track 2: Studio-Managed (50/50)</span>
              </div>
              <button
                type="button"
                onClick={() => setShowDiyModal(true)}
                className="h-7 sm:h-8 flex items-center gap-1.5 px-2.5 sm:px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] sm:text-xs font-bold transition-all duration-150 shadow-xs hover:shadow-sm cursor-pointer active:scale-[0.98] shrink-0"
              >
                <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-300 fill-amber-300" />
                <span className="hidden sm:inline">Upgrade to Co-Builder (${cobuilderPrice})</span>
                <span className="sm:hidden">${cobuilderPrice} Pass</span>
              </button>
            </div>
          )}

          {/* Revenue Share Pill */}
          <div className="h-7 sm:h-8 flex items-center gap-1.5 pl-2 border-l border-slate-200">
            <div className="px-2 py-0.5 rounded-lg bg-emerald-50/80 border border-emerald-200 flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-800">
              <DollarSign className="w-3 h-3 text-emerald-600 shrink-0" />
              <span className="hidden md:inline text-[10px] text-emerald-600 font-sans font-semibold">
                {isDiyActive ? '100% Pool:' : '50%:'}
              </span>
              <span className="text-emerald-700 font-extrabold">
                ${(isDiyActive ? presalesRevenue : creatorRevenueShare).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Floating Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 p-3.5 rounded-xl bg-slate-900 text-white font-bold text-xs shadow-2xl flex items-center gap-2.5 animate-bounce border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* ── MAIN BODY CONTAINER ─────────────────────────────────────────────────── */}
      <div className="flex-1 w-full max-w-[96%] xl:max-w-[95%] 2xl:max-w-[1720px] mx-auto px-2 sm:px-4 lg:px-6 py-4 space-y-4 sm:space-y-5">

        {/* ── STEP / PHASE PROGRESS BAR ────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-3.5">
          {/* LEVEL 1: PROJECT ROADMAP & THE 3 PHASES (Distinct top row!) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-xs shrink-0">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">Roadmap:</span>
                <span className="text-xs font-bold text-slate-800">
                  Phase {currentPhase} of 3 — {currentPhase === 1 ? 'Market Validation' : currentPhase === 2 ? 'AI MVP Build' : 'Live Launch'}
                </span>
              </div>
            </div>

            {/* The 3 Phases Macro Stepper */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {/* Phase 1 */}
              <div className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 shrink-0 ${
                currentPhase === 1
                  ? 'bg-slate-900 text-white shadow-xs'
                  : currentPhase > 1
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-slate-100 text-slate-500'
              }`}>
                {currentPhase > 1 ? (
                  <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                ) : currentPhase === 1 ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                ) : null}
                <span>Phase 1: Validation</span>
              </div>

              <div className="w-2.5 h-[1px] bg-slate-200 shrink-0" />

              {/* Phase 2 */}
              <div className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 shrink-0 ${
                currentPhase === 2
                  ? 'bg-slate-900 text-white shadow-xs'
                  : currentPhase > 2
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-slate-100/80 text-slate-400'
              }`}>
                {currentPhase > 2 ? (
                  <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                ) : currentPhase === 2 ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                ) : null}
                <span>Phase 2: Build MVP</span>
              </div>

              <div className="w-2.5 h-[1px] bg-slate-200 shrink-0" />

              {/* Phase 3 */}
              <div className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 shrink-0 ${
                currentPhase === 3
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100/80 text-slate-400'
              }`}>
                {currentPhase === 3 ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                ) : null}
                <span>Phase 3: Live Launch</span>
              </div>
            </div>
          </div>

          {/* LEVEL 2: DISTINCT EXECUTION STEPS (Clearly on its own row!) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  Execution Progress
                </span>
                <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                  {isTrackChoicePending ? '1 of 5' : `${activePhaseSteps.filter(s => s.isDone).length} of ${activePhaseSteps.length}`} Done
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                {isTrackChoicePending ? 'Step 01 Active' : `Active: Step ${activePhaseSteps[resolvedActiveStepIndex]?.num || '01'}`}
              </span>
            </div>

            {/* Steps Container */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              {isTrackChoicePending ? (
                <>
                  <div className="flex items-center gap-2 bg-slate-900 text-white px-3 py-1.5 rounded-xl text-xs font-mono font-bold shadow-xs shrink-0 ring-2 ring-emerald-400/30">
                    <span className="px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-bold">01</span>
                    <span>STEP 01 • ACTIVE</span>
                    <span className="text-emerald-400 font-sans font-extrabold ml-0.5">Co-Launch Track Choice</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-1" />
                  </div>
                  <div className="w-4 h-[2px] bg-slate-200 shrink-0" />
                  <div className="flex items-center gap-1.5 bg-slate-50 text-slate-500 border border-slate-200 px-2.5 py-1.5 rounded-xl text-xs font-mono shrink-0">
                    <span className="text-slate-400 font-bold">02</span>
                    <span className="font-sans">Venture Architecture</span>
                  </div>
                  <div className="w-4 h-[2px] bg-slate-200 shrink-0" />
                  <div className="flex items-center gap-1.5 bg-slate-50 text-slate-500 border border-slate-200 px-2.5 py-1.5 rounded-xl text-xs font-mono shrink-0">
                    <span className="text-slate-400 font-bold">03</span>
                    <span className="font-sans">Sprint 1 Execution</span>
                  </div>
                  <div className="w-4 h-[2px] bg-slate-200 shrink-0" />
                  <div className="flex items-center gap-1.5 bg-slate-50 text-slate-500 border border-slate-200 px-2.5 py-1.5 rounded-xl text-xs font-mono shrink-0">
                    <span className="text-slate-400 font-bold">04</span>
                    <span className="font-sans">Audience Validation</span>
                  </div>
                  <div className="w-4 h-[2px] bg-slate-200 shrink-0" />
                  <div className="flex items-center gap-1.5 bg-slate-50 text-slate-500 border border-slate-200 px-2.5 py-1.5 rounded-xl text-xs font-mono shrink-0">
                    <span className="text-slate-400 font-bold">05</span>
                    <span className="font-sans">Commercial Launch</span>
                  </div>
                </>
              ) : (
                activePhaseSteps.map((step, idx) => {
                  const isActive = idx === resolvedActiveStepIndex
                  const isDone = Boolean(step.isDone)
                  return (
                    <div key={step.id} className="flex items-center gap-2 shrink-0">
                      {isDone ? (
                        <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-300 px-3 py-1.5 rounded-xl text-xs font-mono font-semibold shadow-2xs">
                          <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                          <span className="font-sans font-bold text-slate-900">{step.label}</span>
                        </div>
                      ) : isActive ? (
                        <div className="flex items-center gap-2 bg-slate-900 text-white px-3 py-1.5 rounded-xl text-xs font-mono font-bold shadow-xs ring-2 ring-emerald-400/40">
                          <span className="px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-bold">
                            STEP {step.num}
                          </span>
                          <span className="text-white font-sans font-extrabold">{step.label}</span>
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 bg-slate-50 text-slate-600 border border-slate-200 px-2.5 py-1.5 rounded-xl text-xs font-mono">
                          <span className="text-slate-400 font-bold">{step.num}</span>
                          <span className="font-sans font-medium text-slate-600">{step.label}</span>
                        </div>
                      )}
                      {idx < activePhaseSteps.length - 1 && (
                        <div
                          className={`w-4 sm:w-5 h-[2px] rounded-full shrink-0 ${
                            isDone ? 'bg-emerald-400' : 'bg-slate-200'
                          }`}
                        />
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* ── INTERACTIVE CO-BUILDER PASS ($50 USD) UPGRADE BANNER ──────────────── */}
        {!isDiyActive && !isTrackChoicePending && (
          <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-slate-50 border border-emerald-300/80 rounded-2xl p-4 sm:px-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Zap className="w-5 h-5 text-amber-400 fill-amber-400" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-extrabold text-slate-900 text-sm">Interactive Co-Builder Pass (${cobuilderPrice} USD)</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono text-[10px] font-bold border border-emerald-300">
                    50/50 Equity Maintained
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  Want full command control to trigger AI MVP sprints, modify prompt blueprints, and code alongside the studio?
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowDiyModal(true)}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all duration-150 shadow-sm hover:shadow-md hover:shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] shrink-0 whitespace-nowrap"
            >
              <CreditCard className="w-3.5 h-3.5 text-white" />
              <span>Unlock Interactive Pass (${cobuilderPrice} USD) →</span>
            </button>
          </div>
        )}

        {/* ── STATE 1: CO-LAUNCH PARTICIPATION TRACK CHOICE (Image 2) ───────────── */}
        {isTrackChoicePending ? (
          <div className="space-y-6">
            {/* Header Hero Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs relative flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-[11px] font-mono font-bold text-slate-700 uppercase">
                  <span>VENTURE ID: {ventureSlug.toUpperCase()}</span>
                  <span>•</span>
                  <span>Signed Partner: {creatorName}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Select Your Co-Launch Participation Track
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
                  Every venture is structured under our verified <strong>50/50 Co-Founder Equity Partnership</strong>. Choose whether you want active hands-on workbench access with the interactive toolset, or delegate sprint execution directly to our dedicated studio engineering group.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1 shrink-0 self-start md:self-auto">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                  DEFAULT MODEL
                </span>
                <span className="text-sm font-extrabold text-slate-900 block font-sans">
                  Equal 50/50 Revenue Split
                </span>
              </div>
            </div>

            {/* 2-Column Split: Tracks on Left, Spec Preview Deck on Right */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Track Cards + Comparison Matrix (8 of 12 cols) */}
              <div className="lg:col-span-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                  {/* Track 1: Interactive Co-Builder Pass */}
                  <div
                    onClick={() => setSelectedTrack('interactive')}
                    className={`rounded-2xl bg-white p-6 shadow-xs relative flex flex-col justify-between transition-all cursor-pointer ${
                      selectedTrack === 'interactive'
                        ? 'border-2 border-emerald-500 ring-2 ring-emerald-500/10 shadow-md'
                        : 'border border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* Ribbon */}
                    <div className="absolute -top-3 left-4 px-3 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-mono font-bold uppercase tracking-wider shadow-xs flex items-center gap-1">
                      <Check className="w-3 h-3 text-white" />
                      <span>RECOMMENDED • ACTIVE SELECTION</span>
                    </div>

                    <div className="space-y-4 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-mono font-bold uppercase tracking-wider">
                          HANDS-ON PARTICIPATION
                        </span>
                        <div className="text-right">
                          <div className="text-2xl font-black text-slate-900 font-mono">
                            ${cobuilderPrice} <span className="text-xs font-normal text-slate-500 font-sans">USD</span>
                          </div>
                          <span className="text-[10px] text-slate-500 block font-mono">One-time toolset pass</span>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-base font-extrabold text-slate-900">Track 1: Interactive Co-Builder Pass</h3>
                        <p className="text-xs text-slate-600 leading-relaxed mt-1">
                          Participate actively instead of passive tracking. Get full command control access to ideate, execute MVP generation, trigger validation tests, and build alongside our core platform.
                        </p>
                      </div>

                      <div className="space-y-2.5 text-xs pt-1">
                        <div className="flex items-center gap-2.5 text-slate-700">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span><strong>50/50 Co-Founder Equity Split</strong> locked in charter</span>
                        </div>
                        <div className="flex items-center gap-2.5 text-slate-700">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Interactive Phase 1, Phase 2, & Phase 3 direct execution</span>
                        </div>
                        <div className="flex items-center gap-2.5 text-slate-700">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Run rapid MVP architecture sprints & feature modules</span>
                        </div>
                        <div className="flex items-center gap-2.5 text-slate-700">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Dedicated Workspace Subdomain & GitHub integration pass</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 space-y-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (isDiyActive) {
                            setTrackChoiceDismissed(true)
                            setActiveMainView('projectos')
                            if (typeof window !== 'undefined') {
                              const searchParams = new URLSearchParams(window.location.search)
                              searchParams.delete('offer')
                              searchParams.delete('track')
                              const newSearch = searchParams.toString()
                              window.history.replaceState({}, '', window.location.pathname + (newSearch ? `?${newSearch}` : '') + window.location.hash)
                            }
                          } else {
                            setSelectedTrack('interactive')
                            setShowDiyModal(true)
                          }
                        }}
                        className="group w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs tracking-tight transition-all duration-150 shadow-sm hover:shadow-md hover:shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-emerald-500"
                      >
                        <span>{isDiyActive ? 'Open Co-Builder Workspace →' : `Unlock Interactive Co-Builder Pass ($${cobuilderPrice} USD)`}</span>
                        <ArrowRight className="w-4 h-4 stroke-[2.5] group-hover:translate-x-1 transition-transform" />
                      </button>
                      <p className="text-[10px] text-center text-slate-400 font-mono">
                        {isDiyActive ? 'Pass active • Workspace ready' : 'Stripe & PayPal verified • Instant workspace provision'}
                      </p>
                    </div>
                  </div>

                  {/* Track 2: Studio-Managed Track */}
                  <div
                    onClick={() => setSelectedTrack('managed')}
                    className={`rounded-2xl bg-white p-6 shadow-xs relative flex flex-col justify-between transition-all cursor-pointer ${
                      selectedTrack === 'managed'
                        ? 'border-2 border-slate-900 ring-2 ring-slate-900/10 shadow-md'
                        : 'border border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="space-y-4 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-mono font-bold uppercase tracking-wider">
                          STUDIO COMPLETED
                        </span>
                        <div className="text-right">
                          <div className="text-2xl font-black text-slate-900 font-mono">
                            $0 <span className="text-xs font-normal text-slate-500 font-sans">Upfront</span>
                          </div>
                          <span className="text-[10px] text-slate-500 block font-mono">50/50 Equity Split</span>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-base font-extrabold text-slate-900">Track 2: Studio-Managed Track</h3>
                        <p className="text-xs text-slate-600 leading-relaxed mt-1">
                          Studio engineers complete all technical build sprints, backend architecture, and infrastructure while you monitor milestones in real-time and coordinate the launch with your audience.
                        </p>
                      </div>

                      <div className="space-y-2.5 text-xs pt-1">
                        <div className="flex items-center gap-2.5 text-slate-700">
                          <CheckCircle2 className="w-4 h-4 text-slate-800 shrink-0" />
                          <span><strong>50/50 Co-Founder Equity Split</strong> locked in charter</span>
                        </div>
                        <div className="flex items-center gap-2.5 text-slate-700">
                          <CheckCircle2 className="w-4 h-4 text-slate-800 shrink-0" />
                          <span>Studio team conducts end-to-end development phases</span>
                        </div>
                        <div className="flex items-center gap-2.5 text-slate-700">
                          <CheckCircle2 className="w-4 h-4 text-slate-800 shrink-0" />
                          <span>Real-Time Milestone Tracking & Review Portal</span>
                        </div>
                        <div className="flex items-center gap-2.5 text-slate-700">
                          <CheckCircle2 className="w-4 h-4 text-slate-800 shrink-0" />
                          <span>Zero local software configuration required on your side</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 space-y-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedTrack('managed')
                          handleDeclineDiyOffer()
                        }}
                        className="group w-full py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs tracking-tight transition-all duration-150 shadow-sm hover:shadow-md hover:shadow-slate-900/25 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-slate-900"
                      >
                        <span>Select Studio-Managed Track (50/50)</span>
                        <ArrowRight className="w-4 h-4 stroke-[2.5] group-hover:translate-x-1 transition-transform" />
                      </button>
                      <p className="text-[10px] text-center text-slate-400 font-mono">
                        Standard tracking portal activated immediately
                      </p>
                    </div>
                  </div>

                </div>

                {/* Comparative Technical Matrix (Protocol v2.4) */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-xs font-mono font-bold text-slate-900 uppercase tracking-wider">
                        COMPARATIVE TECHNICAL MATRIX
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">Protocol v2.4</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-sans">
                      <thead>
                        <tr className="border-b border-slate-100 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                          <th className="py-2 pr-4 font-bold">CAPABILITY / DELIVERABLE</th>
                          <th className="py-2 px-4 font-bold text-emerald-700">TRACK 1: INTERACTIVE PASS</th>
                          <th className="py-2 pl-4 font-bold text-slate-700">TRACK 2: STUDIO MANAGED</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        <tr>
                          <td className="py-3 pr-4 font-medium text-slate-700">Co-Founder Equity Division</td>
                          <td className="py-3 px-4 font-mono font-bold text-emerald-700">50% / 50%</td>
                          <td className="py-3 pl-4 font-mono font-bold text-slate-800">50% / 50%</td>
                        </tr>
                        <tr>
                          <td className="py-3 pr-4 font-medium text-slate-700">Sprint & Code Execution</td>
                          <td className="py-3 px-4 font-bold text-slate-900">Co-Pilot / Hands-On Access</td>
                          <td className="py-3 pl-4 text-slate-600">Engineered by Studio Devs</td>
                        </tr>
                        <tr>
                          <td className="py-3 pr-4 font-medium text-slate-700">Workspace Terminal & Repos</td>
                          <td className="py-3 px-4 font-mono font-semibold text-emerald-600">Instant Direct Provisioning</td>
                          <td className="py-3 pl-4 text-slate-500">Restricted to Studio Staff</td>
                        </tr>
                        <tr>
                          <td className="py-3 pr-4 font-medium text-slate-700">Validation Test Pipeline</td>
                          <td className="py-3 px-4 font-semibold text-slate-900">Full Real-Time Test Suite</td>
                          <td className="py-3 pl-4 text-slate-600">Milestone Summary Reports</td>
                        </tr>
                        <tr>
                          <td className="py-3 pr-4 font-medium text-slate-700">Upfront Capital Commitment</td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">${cobuilderPrice} One-Time Pass</td>
                          <td className="py-3 pl-4 font-mono font-bold text-emerald-700">$0.00 Upfront</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Right Column: PREVIEW DECK - VENTURE SUMMARY (4 of 12 cols) */}
              <div className="lg:col-span-4 sticky top-24 space-y-4">
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                        PREVIEW DECK
                      </span>
                      <h3 className="text-sm font-black text-slate-900 tracking-tight">VENTURE SUMMARY</h3>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300 text-[10px] font-mono font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>Live Spec</span>
                    </span>
                  </div>

                  {/* Spec Sheet Table */}
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Venture Title</span>
                      <span className="font-extrabold text-slate-900">{productName}</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Selected Path</span>
                      <span className={`font-mono font-bold ${selectedTrack === 'interactive' ? 'text-emerald-700' : 'text-slate-900'}`}>
                        {selectedTrack === 'interactive' ? 'Track 1: Interactive Pass' : 'Track 2: Studio-Managed'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Equity Ratio</span>
                      <span className="font-mono font-bold text-slate-900">50 / 50 Irrevocable</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Access Tier</span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-[11px] font-bold">
                        {selectedTrack === 'interactive' ? 'Full Interactive OS' : 'Studio-Managed'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Upfront Investment</span>
                      <span className="font-mono font-extrabold text-slate-900">
                        {selectedTrack === 'interactive' ? `$${cobuilderPrice.toFixed(2)} USD` : '$0.00 Upfront'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Response / Deployment</span>
                      <span className="font-mono text-emerald-700 font-semibold">Immediate Provisioning</span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-slate-500">Expected Build Cadence</span>
                      <span className="font-bold text-slate-900">3 Structured Phases</span>
                    </div>
                  </div>

                  {/* Better Action Buttons */}
                  <div className="space-y-2 pt-2">
                    {selectedTrack === 'interactive' ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (isDiyActive) {
                            setTrackChoiceDismissed(true)
                            setActiveMainView('projectos')
                            if (typeof window !== 'undefined') {
                              const searchParams = new URLSearchParams(window.location.search)
                              searchParams.delete('offer')
                              searchParams.delete('track')
                              const newSearch = searchParams.toString()
                              window.history.replaceState({}, '', window.location.pathname + (newSearch ? `?${newSearch}` : '') + window.location.hash)
                            }
                          } else {
                            setShowDiyModal(true)
                          }
                        }}
                        className="group w-full py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs tracking-tight transition-all duration-150 shadow-sm hover:shadow-md hover:shadow-slate-900/25 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-slate-900"
                      >
                        <span>{isDiyActive ? 'Access Co-Builder Workspace →' : `Continue with Interactive Pass ($${cobuilderPrice})`}</span>
                        <ArrowRight className="w-4 h-4 stroke-[2.5] group-hover:translate-x-1 transition-transform" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleDeclineDiyOffer}
                        className="group w-full py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs tracking-tight transition-all duration-150 shadow-sm hover:shadow-md hover:shadow-slate-900/25 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-slate-900"
                      >
                        <span>Continue with Studio-Managed Track</span>
                        <ArrowRight className="w-4 h-4 stroke-[2.5] group-hover:translate-x-1 transition-transform" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setSelectedTrack(prev => prev === 'interactive' ? 'managed' : 'interactive')}
                      className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-slate-300 text-slate-700 hover:text-slate-900 text-xs font-semibold transition-all duration-150 shadow-2xs hover:shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                      <span>Reset Selection</span>
                    </button>
                  </div>

                  <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                    Authorizes co-builder credentials and generates the live operational environment according to your tier.
                  </p>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
                    <span>Venture Spec:</span>
                    <button
                      type="button"
                      onClick={() => setShowAgreementModal(true)}
                      className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 cursor-pointer hover:underline transition-colors"
                    >
                      <FileText className="w-3 h-3" />
                      <span>CF-5050 Agreement (50/50)</span>
                    </button>
                  </div>

                  {/* Security Banner */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Legal 50/50 Partnership Bound</span>
                    </div>
                    <p className="text-slate-500 leading-relaxed text-[10.5px]">
                      Both tracks guarantee the exact same commercial payout structure. The ${cobuilderPrice} pass covers compute infrastructure and tooling licenses for self-execution.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : activeMainView === 'projectos' ? (
          /* ── PROJECTOS WORKSPACE VIEW ────────────────────────────────────────── */
          <div className="space-y-6">
            {isDiyActive ? (
              <ProjectOS project={project} onUpdateProject={handleUpdateProject} userRole="creator" isDIY={isDiyActive} />
            ) : (
              /* Studio Managed Status Dashboard */
              <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200 text-[10px] font-mono font-bold uppercase tracking-wider">
                        🤝 Studio-Managed Venture
                      </span>
                      <span className="text-xs text-slate-300">•</span>
                      <span className="text-xs font-bold text-emerald-700">50/50 Revenue Split Active</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      ProjectOS Progress Tracker: {productName}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
                      You chose the Studio-Managed Co-Launch track. The Creator Forge studio engineering team handles 100% of software development, architecture, and deployments for you. You can track all sprint progress, pre-orders, and telemetry below.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1 shrink-0">
                    <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block">Current Phase</span>
                    <div className="text-lg font-black text-slate-900 font-mono">
                      Phase {project?.currentPhase || 1}: {project?.currentPhase === 3 ? 'Launch & Scale' : project?.currentPhase === 2 ? 'Build MVP' : 'Validate'}
                    </div>
                    <span className="text-[10px] text-emerald-700 font-bold block">Managed by Studio Operators</span>
                  </div>
                </div>

                {/* Progress Milestones */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">Phase 1: Validation</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono font-bold">
                        {project?.currentPhase > 1 ? 'Completed' : 'In Progress'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Studio operators are managing pre-order telemetry and customer interest validation.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">Phase 2: Build MVP</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-mono font-bold">
                        {project?.currentPhase === 2 ? 'Active Sprint' : project?.currentPhase > 2 ? 'Completed' : 'Upcoming'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Engineers configure the full stack, database, and customer dashboard.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">Phase 3: Launch</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-mono font-bold">
                        {project?.currentPhase === 3 ? 'Active Launch' : 'Upcoming'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Production deployment and recurring subscription checkout management.
                    </p>
                  </div>
                </div>

                {/* Return to Launch Kit CTA */}
                <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-slate-900">Looking for your daily tasks & promotional scripts?</h4>
                    <p className="text-[11px] text-slate-500">
                      Head over to your Daily Launch Kit to copy promotional copy, Instagram stories, and video scripts.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveMainView('launch_kit')}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all shadow-sm cursor-pointer whitespace-nowrap"
                  >
                    Open Daily Launch Kit & Scripts →
                  </button>
                </div>

                {/* DIY Pass Upgrade Card */}
                {!isDiyActive && (
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-slate-50 border border-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900">Want direct workbench & terminal access?</span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono text-[10px] font-bold border border-emerald-300">${cobuilderPrice} USD</span>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        Unlock the Interactive Co-Builder Pass to trigger AI code generation, execute Phase 1–3 sprints yourself, and customize all specs.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowDiyModal(true)}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-sm hover:shadow-md cursor-pointer whitespace-nowrap active:scale-[0.98] flex items-center gap-2"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                      <span>Unlock Interactive Pass (${cobuilderPrice} USD) →</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* ── STATE 2: VALIDATION SPRINT & DAILY LAUNCH KIT (Image 3) ──────────── */
          <div className="space-y-6">

            {/* Validation Sprint Milestone Header Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                    VALIDATION SPRINT MILESTONE
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-0.5">
                    ${presalesRevenue.toLocaleString()}{' '}
                    <span className="text-slate-400 font-normal text-base sm:text-lg">
                      of ${presaleTarget.toLocaleString()} Presale Goal
                    </span>
                  </h1>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-900" />
                    <span>{targetPct}% Target Reached</span>
                  </span>
                </div>
              </div>

              {/* Progress Bar with Milestones */}
              <div className="space-y-2">
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5">
                  <div
                    className="bg-slate-900 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(2, targetPct)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>$0 Baseline</span>
                  <span className="font-semibold text-slate-700">${Math.round(presaleTarget * 0.7).toLocaleString()} Gate Threshold</span>
                  <span className="font-semibold text-slate-900">${presaleTarget.toLocaleString()} Stretch Target</span>
                </div>
              </div>

              {/* 5 KPI Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-mono font-bold uppercase block">Your 50% Profit Share</span>
                  <span className="text-base font-extrabold text-emerald-700 font-mono mt-0.5 block">
                    ${creatorRevenueShare.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Automated payout routing</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-mono font-bold uppercase block">Sprint Duration</span>
                  <span className="text-base font-extrabold text-slate-900 font-mono mt-0.5 block">
                    14 days
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">12 days remaining</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-mono font-bold uppercase block">Pre-Orders / Backers</span>
                  <span className="text-base font-extrabold text-slate-900 font-mono mt-0.5 block">
                    {reservations.length}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Tier: $49 Founding Pass</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-mono font-bold uppercase block">Sprint Tasks</span>
                  <span className="text-base font-extrabold text-slate-900 font-mono mt-0.5 block">
                    {completedTasksCount} / {totalTasksCount} done
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold block mt-0.5">
                    {totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0}% complete
                  </span>
                </div>
                <div className="col-span-2 sm:col-span-1 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-mono font-bold uppercase block">Conversion Funnel</span>
                  <span className="text-base font-extrabold text-slate-900 font-mono mt-0.5 block">
                    {Number(project.conversionRate || 0.0).toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Traffic to checkout</span>
                </div>
              </div>
            </div>

            {/* Sub-navigation Tabs */}
            <div className="flex items-center gap-1.5 p-1.5 bg-white rounded-xl border border-slate-200 shadow-2xs overflow-x-auto scrollbar-none">
              {[
                { id: 'tasks', label: 'Daily Launch Checklist', count: `${completedTasksCount}/${totalTasksCount}` },
                { id: 'scripts', label: 'Copyable Launch Content', count: '7 items' },
                { id: 'presales', label: 'Verified Pre-Orders', count: `${reservations.length}` },
                { id: 'messages', label: 'Studio Chat & Messages', count: `${portalDisplayMessages.length}` },
                { id: 'strategy', label: 'Validation Specs' },
              ].map(tab => {
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <span>{tab.label}</span>
                    {tab.count && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* 2-Column Sprint Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

              {/* Left Column: Tab Content (8 of 12 cols) */}
              <div className="lg:col-span-8 space-y-6">

                {/* TAB 1: DAILY LAUNCH CHECKLIST */}
                {activeTab === 'tasks' && (
                  <div className="space-y-6">
                    {/* Today's Action Card */}
                    <div className="bg-white rounded-2xl border-2 border-emerald-500/80 p-5 shadow-xs space-y-3 relative overflow-hidden">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-300">
                              🔥 TODAY'S ACTION (DAY 2)
                            </span>
                            <span className="text-xs text-slate-500 font-medium">Instagram Stories • Pain Point Poll</span>
                          </div>
                          <h4 className="text-base font-extrabold text-slate-900">
                            Today: Post Instagram Story #2 (Pain Point Poll & Pre-Order Link)
                          </h4>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            Post the 3-story sequence with interactive poll sticker to drive warm audience to the pre-order page.
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => setViewDraftTask(schedule.find(t => t.day === 2) || schedule[0])}
                            className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-slate-300 text-slate-700 hover:text-slate-900 text-xs font-bold transition-all duration-150 flex items-center gap-1.5 cursor-pointer shadow-2xs hover:shadow-xs active:scale-[0.98]"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            <span>View Draft</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleChecklist(schedule.find(t => t.day === 2)?.id || 'day-2')}
                            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all duration-150 flex items-center gap-1.5 cursor-pointer shadow-sm hover:shadow-md hover:shadow-slate-900/20 active:scale-[0.98]"
                          >
                            <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                            <span>Mark Done</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Creator Launch Action Checklist */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <span className="text-xs font-mono font-bold text-slate-900 uppercase tracking-wider">
                          CREATOR LAUNCH ACTION CHECKLIST
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300 font-mono text-[11px] font-bold">
                          {completedTasksCount} of {totalTasksCount} Completed
                        </span>
                      </div>

                      <div className="space-y-3">
                        {schedule.map(task => {
                          const isDone = Boolean(task.done || task.completed)
                          return (
                            <div
                              key={task.id}
                              className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                                isDone ? 'bg-slate-50/60 border-slate-200 opacity-80' : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <button
                                  type="button"
                                  onClick={() => toggleChecklist(task.id)}
                                  className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center transition-all cursor-pointer ${
                                    isDone
                                      ? 'bg-emerald-600 text-white'
                                      : 'border border-slate-300 hover:border-slate-400 bg-white'
                                  }`}
                                >
                                  {isDone && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                                </button>
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-[10px] font-mono font-bold uppercase text-slate-500">
                                      DAY {task.day}
                                    </span>
                                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                                      {task.channel}
                                    </span>
                                  </div>
                                  <div className={`text-xs font-bold ${isDone ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                                    {task.title}
                                  </div>
                                  <p className="text-[11px] text-slate-500 leading-normal">
                                    {task.description}
                                  </p>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => setViewDraftTask(task)}
                                className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-slate-300 text-slate-700 hover:text-slate-900 text-xs font-semibold shrink-0 transition-all duration-150 flex items-center gap-1.5 cursor-pointer shadow-2xs hover:shadow-xs active:scale-[0.98]"
                              >
                                <Eye className="w-3.5 h-3.5 text-slate-500" />
                                <span>View Draft</span>
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: COPYABLE LAUNCH CONTENT */}
                {activeTab === 'scripts' && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 text-sm">Copyable Promotional Assets</h3>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            Audience-Grounded · Authentic Voice
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Every draft is derived directly from your verified channel uploads, channel bio, and community comments.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {[
                        { id: 'post', label: 'Announcement Post' },
                        { id: 'story', label: 'Instagram Stories (3-Part)' },
                        { id: 'video', label: 'Video Demo Hook' },
                        { id: 'email', label: 'Email Newsletter' },
                        { id: 'dm', label: 'VIP DM Outreach' },
                      ].map(st => (
                        <button
                          key={st.id}
                          onClick={() => setActiveScriptTab(st.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            activeScriptTab === st.id
                              ? 'bg-slate-900 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-3 pt-2">
                      {activeScriptTab === 'email' && (
                        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                            <span className="text-[11px]">
                              <strong>Anti-Spam Deliverability Guard:</strong> Formatted as a personal 1:1 plain-text email from you. 0 spam triggers, Primary Inbox delivery guaranteed.
                            </span>
                          </div>
                        </div>
                      )}
                      {activeScriptTab === 'video' && (
                        <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-950 text-xs flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Video className="w-4 h-4 text-red-600 shrink-0" />
                            <span className="text-[11px]">
                              <strong>Native Video Segment:</strong> Seamless mid-roll hook directly connecting the workflow problems discussed in your uploads to this software.
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        {/* Visual / Text Toggle */}
                        <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                          <button
                            type="button"
                            onClick={() => setPortalDraftViewMode('visual')}
                            className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                              portalDraftViewMode === 'visual'
                                ? 'bg-white text-slate-900 shadow-2xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            👁️ Visual Mockup Preview
                          </button>
                          <button
                            type="button"
                            onClick={() => setPortalDraftViewMode('text')}
                            className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                              portalDraftViewMode === 'text'
                                ? 'bg-white text-slate-900 shadow-2xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            📝 Raw Text Script
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const map = {
                              post: campaignKit.announcementPost || `🚨 Sourced from our recent channel discussions, we're officially co-founding ${productName} — ${project?.productTagline || 'the new workspace'}. Reserve your early founding pass here: ${preorderUrl}`,
                              story: campaignKit.storySequence || `STORY 1:\n"Quick poll for everyone watching my channel..."\n\nSTORY 2:\n"We have been secretly engineering ${productName}..."\n\nSTORY 3:\n"Grab founding access here: ${preorderUrl}"`,
                              video: campaignKit.videoScript || `HOOK (0-8s): "If you saw our recent channel breakdown, you know how painful manual bottlenecks are..."\nDEMO (8-40s): "Here is how ${productName} handles it automatically..."\nCTA (40-60s): "Founding pass link in bio: ${preorderUrl}"`,
                              email: campaignKit.newsletterDraft || `Subject: Why I'm co-founding ${productName} (private invite)\n\nHey everyone,\n\nWe are officially partnering with Creator Forge Studio to engineer ${productName}...\n\nReserve your pass: ${preorderUrl}`,
                              dm: campaignKit.directMessageScript || `Hey! Saw your thoughts on our channel earlier — we just launched early founding access for ${productName}: ${preorderUrl}`
                            }
                            copyToClipboard(map[activeScriptTab], activeScriptTab)
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          {copiedKey === activeScriptTab ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedKey === activeScriptTab ? 'Copied!' : 'Copy Script Text'}</span>
                        </button>
                      </div>

                      {portalDraftViewMode === 'visual' ? (
                        <div className="p-3 sm:p-5 rounded-xl bg-slate-50 border border-slate-200">
                          <PostVisualMockup
                            type={
                              activeScriptTab === 'story'
                                ? 'story'
                                : activeScriptTab === 'video'
                                ? 'video'
                                : activeScriptTab === 'email'
                                ? 'newsletter'
                                : 'post'
                            }
                            project={project}
                            copyText={
                              activeScriptTab === 'story' ? (campaignKit.storySequence || '') :
                              activeScriptTab === 'video' ? (campaignKit.videoScript || '') :
                              activeScriptTab === 'email' ? (campaignKit.newsletterDraft || '') :
                              activeScriptTab === 'dm' ? (campaignKit.directMessageScript || '') :
                              (campaignKit.announcementPost || '')
                            }
                            preorderUrl={preorderUrl}
                          />
                        </div>
                      ) : (
                        <textarea
                          readOnly
                          rows={8}
                          value={
                            activeScriptTab === 'story' ? (campaignKit.storySequence || `STORY 1:\n"Quick question for everyone..."\n\nSTORY 2:\n"We have been secretly engineering ${productName}..."\n\nSTORY 3:\n"Grab founding access here: ${preorderUrl}"`) :
                            activeScriptTab === 'video' ? (campaignKit.videoScript || `HOOK (0-8s): "If you saw our recent channel breakdown, you know how painful manual bottlenecks are..."\nDEMO (8-40s): "Here is how ${productName} handles it automatically..."\nCTA (40-60s): "Link in bio for pre-order access: ${preorderUrl}"`) :
                            activeScriptTab === 'email' ? (campaignKit.newsletterDraft || `Subject: Why I'm co-founding ${productName} (private invite)\n\nHey everyone,\n\nWe are officially partnering with Creator Forge Studio to engineer ${productName}...\n\nReserve: ${preorderUrl}`) :
                            activeScriptTab === 'dm' ? (campaignKit.directMessageScript || `Hey! Saw you were asking about this on our channel — we just launched early founding access for ${productName}: ${preorderUrl}`) :
                            (campaignKit.announcementPost || `🚨 Big announcement! After hearing so many comments across our channel about the nightmare of manual workflows, we're officially building ${productName}.\n\nReserve your early pass now: ${preorderUrl}`)
                          }
                          className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 outline-none font-mono leading-relaxed resize-none select-all"
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 3: VERIFIED PRE-ORDERS */}
                {activeTab === 'presales' && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">Verified Backer Reservations ({reservations.length})</h3>
                        <p className="text-xs text-slate-500">Live feed of audience pre-orders directly tied to your revenue share.</p>
                      </div>
                      <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
                        ${presalesRevenue.toLocaleString()} Total Collected
                      </span>
                    </div>

                    {reservations.length === 0 ? (
                      <div className="py-12 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl space-y-2">
                        <Users className="w-8 h-8 text-slate-300 mx-auto" />
                        <p>No customer pre-orders recorded yet. Pledges will populate here as backers join.</p>
                        <button
                          type="button"
                          onClick={handleSimulatePreorder}
                          className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Simulate First Pre-Order (+$49)</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {reservations.map(res => (
                          <div key={res.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                            <div>
                              <div className="font-bold text-slate-900">{res.name}</div>
                              <span className="text-[10px] text-slate-400 font-mono">{res.email}</span>
                            </div>
                            <div className="text-right">
                              <div className="font-mono font-bold text-emerald-700">+${res.amount}</div>
                              <span className="text-[10px] text-slate-500 font-mono">{res.tier || 'Founding Pass'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 4: STUDIO CHAT & MESSAGES */}
                {activeTab === 'messages' && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">Studio Chat & Co-Founder Dispatch</h3>
                        <p className="text-xs text-slate-500">Direct operational communication channel with Creator Forge Studio.</p>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                        ● Studio Online
                      </span>
                    </div>

                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                      {portalDisplayMessages.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 text-xs">
                          No messages yet. Send a note to Creator Forge Studio below.
                        </div>
                      ) : (
                        portalDisplayMessages.map(msg => {
                          const isStudio = msg.sender === 'admin'
                          return (
                            <div
                              key={msg.id}
                              className={`p-4 rounded-xl text-xs space-y-1 ${
                                isStudio
                                  ? 'bg-slate-50 border border-slate-200 mr-8'
                                  : 'bg-emerald-50/50 border border-emerald-200 ml-8'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-900">{msg.senderName}</span>
                                <span className="text-[10px] text-slate-400 font-mono">{msg.time}</span>
                              </div>
                              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                            </div>
                          )
                        })
                      )}
                      <div ref={chatMessagesEndRef} />
                    </div>

                    <form onSubmit={handleSendCreatorMessage} className="pt-2 flex gap-2">
                      <input
                        type="text"
                        value={creatorReplyText}
                        onChange={(e) => setCreatorReplyText(e.target.value)}
                        placeholder="Reply to Creator Forge Studio..."
                        className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 outline-none focus:border-slate-400 transition-all font-sans"
                      />
                      <button
                        type="submit"
                        disabled={isSendingReply || !creatorReplyText.trim()}
                        className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send</span>
                      </button>
                    </form>
                  </div>
                )}

                {/* TAB 5: VALIDATION SPECS & STRATEGY */}
                {activeTab === 'strategy' && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                    <div className="border-b border-slate-100 pb-3">
                      <h3 className="font-bold text-slate-900 text-sm">Validation Strategy & Economic Model</h3>
                      <p className="text-xs text-slate-500">Commercial parameters and minimum gate thresholds required to proceed to Phase 2 Build.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                        <span className="font-bold text-slate-900">Commercial Split</span>
                        <p className="text-slate-600 leading-relaxed">
                          Equal 50/50 profit share paid on all monthly recurring subscriptions and founding pre-orders.
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                        <span className="font-bold text-slate-900">Gate Threshold</span>
                        <p className="text-slate-600 leading-relaxed">
                          ${presaleTarget.toLocaleString()} in verified pre-orders unlocks production engineering and beta hosting.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Right Column: PREVIEW DECK - SPRINT SUMMARY (4 of 12 cols) */}
              <div className="lg:col-span-4 sticky top-24 space-y-4">
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                        PREVIEW DECK
                      </span>
                      <h3 className="text-sm font-black text-slate-900 tracking-tight">SPRINT SUMMARY</h3>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300 text-[10px] font-mono font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>Live Spec</span>
                    </span>
                  </div>

                  {/* Spec Sheet Table */}
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Venture Partner</span>
                      <span className="font-extrabold text-slate-900">{creatorName}</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Validation Gate</span>
                      <span className="font-mono font-bold text-slate-900">${presaleTarget.toLocaleString()} Target</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Presale Price Point</span>
                      <span className="font-mono font-bold text-slate-900">$49 Early Bird Pass</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Backers Needed for Gate</span>
                      <span className="font-mono font-bold text-emerald-700">~{Math.max(1, Math.ceil(presaleTarget / 49))} Pre-Orders</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Co-Founder Split</span>
                      <span className="font-mono font-bold text-slate-900">50% / 50% Irrevocable</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Launch Timeline</span>
                      <span className="font-bold text-slate-900">7 Days of Structured Posts</span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-slate-500">Your Current 50% Pool</span>
                      <span className="font-mono font-black text-emerald-700">${creatorRevenueShare.toLocaleString()} USD</span>
                    </div>
                  </div>

                  {/* Better Action Buttons */}
                  <div className="space-y-2 pt-2">
                    {!isDiyActive && (
                      <button
                        type="button"
                        onClick={() => setShowDiyModal(true)}
                        className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs tracking-tight transition-all duration-150 shadow-sm hover:shadow-md hover:shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                      >
                        <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                        <span>Unlock Interactive Pass (${cobuilderPrice} USD)</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleSimulatePreorder}
                      className="w-full py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs tracking-tight transition-all duration-150 shadow-sm hover:shadow-md hover:shadow-slate-900/25 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-slate-900"
                    >
                      <Plus className="w-4 h-4 text-emerald-400 stroke-[3]" />
                      <span>Simulate Backer Pre-Order (+$49)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setViewDraftTask(schedule.find(t => t.day === 2) || schedule[0])}
                      className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-slate-300 text-slate-700 hover:text-slate-900 text-xs font-semibold transition-all duration-150 shadow-2xs hover:shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                    >
                      <Eye className="w-4 h-4 text-slate-500" />
                      <span>View Today's Story Assets</span>
                    </button>
                  </div>

                  <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                    Real-time telemetry connected to {creatorName} payment gateway webhook.
                  </p>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
                    <span>Venture Spec:</span>
                    <button
                      type="button"
                      onClick={() => setShowAgreementModal(true)}
                      className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 cursor-pointer hover:underline transition-colors"
                    >
                      <FileText className="w-3 h-3" />
                      <span>CF-5050 Agreement (50/50)</span>
                    </button>
                  </div>

                  {/* Settlement Banner */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Automated 50/50 Settlement</span>
                    </div>
                    <p className="text-slate-500 leading-relaxed text-[10.5px]">
                      Presale revenues automatically deposit 50% directly into your verified partner bank ledger via Stripe Connect.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* ── VIEW DRAFT MODAL ────────────────────────────────────────────────────── */}
      {viewDraftTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-slate-400">
                  DAY {viewDraftTask.day} • {viewDraftTask.channel}
                </span>
                <h3 className="text-base font-extrabold text-slate-900">{viewDraftTask.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setViewDraftTask(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">{viewDraftTask.description}</p>

            <div className="space-y-2">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Copyable Copy</span>
              <textarea
                readOnly
                rows={6}
                value={getTaskDraftContent(viewDraftTask)}
                className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 outline-none font-mono leading-relaxed resize-none select-all"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => copyToClipboard(getTaskDraftContent(viewDraftTask), 'draft')}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-[0.98] transition-all"
              >
                {copiedKey === 'draft' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'draft' ? 'Copied!' : 'Copy to Clipboard'}</span>
              </button>
              <button
                type="button"
                onClick={() => setViewDraftTask(null)}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-slate-300 text-slate-700 hover:text-slate-900 text-xs font-semibold cursor-pointer active:scale-[0.98] transition-all shadow-2xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CF-5050 CO-FOUNDER AGREEMENT SPEC MODAL ─────────────────────────────── */}
      {showAgreementModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-xl w-full bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 sm:p-7 space-y-5 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300">
                  LEGAL CHARTER SPECIFICATION • VERIFIED
                </span>
                <h3 className="text-base sm:text-lg font-black text-slate-900 mt-1">
                  Equal 50/50 Co-Founder Equity Agreement
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAgreementModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">PARTNER A (STUDIO)</span>
                <span className="font-bold text-slate-900 block mt-0.5">Creator Forge Studio</span>
                <span className="text-[11px] text-slate-500 block">Engineering, Hosting, AI Architecture</span>
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">PARTNER B (CREATOR)</span>
                <span className="font-bold text-slate-900 block mt-0.5">{creatorName}</span>
                <span className="text-[11px] text-slate-500 block">Audience, Co-Marketing, Feedback</span>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-700 max-h-64 overflow-y-auto pr-1">
              <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                <span className="font-bold text-slate-900">1. Equal 50/50 Gross Net Revenue Division</span>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  All gross revenue generated from founding presales, monthly/annual software subscriptions, and add-on modules is divided exactly 50% to Creator Forge Studio and 50% to {creatorName}.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                <span className="font-bold text-slate-900">2. Irrevocable Automated Settlement</span>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Payouts are handled through automated payment gateway webhooks (Stripe Connect). The creator's 50% share is routed directly to the verified partner ledger without artificial holding periods.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                <span className="font-bold text-slate-900">3. Full Engineering & Technical Provisioning</span>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  The studio assumes 100% responsibility for infrastructure, code deployments, LLM token provisioning, database scaling, and technical bug fixes.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                <span className="font-bold text-slate-900">4. Mutual Commercial IP & Transparency</span>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Both parties maintain transparent visibility into real-time telemetry, transaction volumes, backer accounts, and sprint progress.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-mono font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Verified Legal Charter v2.4</span>
              </div>
              <button
                type="button"
                onClick={() => setShowAgreementModal(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm cursor-pointer active:scale-[0.98]"
              >
                Close Spec
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DIY SUBSCRIPTION MODAL ($50 USD PASS UNLOCK) ────────────────────────── */}
      <DIYSubscriptionModal
        isOpen={showDiyModal}
        onClose={() => setShowDiyModal(false)}
        project={project}
        onUnlockSuccess={handleUnlockDiySuccess}
      />
    </div>
  )
}
