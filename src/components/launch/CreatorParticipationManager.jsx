import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Layers,
  ArrowLeft,
  Users,
  ExternalLink,
  RefreshCw,
  Check,
  Sparkles,
  ShieldCheck,
  Rocket,
  AlertCircle,
  Zap,
  CreditCard,
  Mail,
  Copy,
  Clock,
  Send,
  Eye,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Sliders,
  Search,
  Filter,
  X,
  Laptop,
  CheckCircle,
  ChevronRight,
  Info,
  Trash2
} from 'lucide-react'
import {
  getCoLaunchProjects,
  updateCoLaunchProject,
  deleteCoLaunchProject,
  deleteAllProjects,
  sendDirectEmail,
  getCreators
} from '../../services/opsApi'
import { updatePageSEO } from '../../utils/seo'
import CreatorForgeLogo from '../ui/CreatorForgeLogo'
import DIYSubscriptionModal from './DIYSubscriptionModal'

export default function CreatorParticipationManager() {
  const [projects, setProjects] = useState([])
  const [creators, setCreators] = useState([])
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [filterTrack, setFilterTrack] = useState('all') // 'all' | 'cobuilder' | 'pending' | 'managed'
  const [searchQuery, setSearchQuery] = useState('')
  const [toast, setToast] = useState(null)
  const [copiedId, setCopiedId] = useState(null)

  // Follow-up email modal state
  const [emailModalProject, setEmailModalProject] = useState(null)
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [isSendingEmail, setIsSendingEmail] = useState(false)

  // Manual payment / DIY modal state
  const [diyModalProject, setDiyModalProject] = useState(null)

  // Preview modal
  const [previewUrl, setPreviewUrl] = useState(null)

  // Live polling ref
  const pollTimerRef = useRef(null)

  const showToast = (type, title, message) => {
    setToast({ type, title, message, id: Date.now() })
    setTimeout(() => setToast(null), 4200)
  }

  // SEO Update
  useEffect(() => {
    updatePageSEO({
      title: 'Creator Co-Builder & Participation Manager | Creator Forge',
      description: 'Dedicated real-time operator console for tracking creator participation tracks, $50 Co-Builder passes, payments, and follow-ups.',
      image: '/og-image.svg'
    })
  }, [])

  // Decode plus signs in text helper
  const decodeText = (txt) => {
    if (!txt || typeof txt !== 'string') return ''
    try {
      return decodeURIComponent(txt.replace(/\+/g, ' '))
    } catch {
      return txt.replace(/\+/g, ' ')
    }
  }

  // Load data from backend
  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true)
    else setIsRefreshing(true)

    try {
      const [projRes, creatorRes] = await Promise.allSettled([
        getCoLaunchProjects(),
        getCreators({ limit: 100 })
      ])

      if (projRes.status === 'fulfilled' && projRes.value) {
        const list = Array.isArray(projRes.value) ? projRes.value : projRes.value?.projects || []
        setProjects(list)
      }

      if (creatorRes.status === 'fulfilled' && creatorRes.value) {
        const cList = Array.isArray(creatorRes.value) ? creatorRes.value : creatorRes.value?.creators || []
        setCreators(cList)
      }
    } catch (err) {
      console.warn('[CreatorParticipationManager] Load error:', err)
      if (!isSilent) {
        showToast('error', 'Sync Failed', 'Failed to retrieve real-time projects and participation states.')
      }
    } finally {
      if (!isSilent) setLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  // Mount & Real-Time 4-second Polling
  useEffect(() => {
    loadData()
    pollTimerRef.current = setInterval(() => {
      loadData(true)
    }, 4000)

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current)
    }
  }, [loadData])

  // Get Creator's Personalized Portal Link
  const getCreatorWorkspaceUrl = (proj) => {
    if (!proj) return ''
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001'
    const handleClean = (proj.creatorHandle || proj.creatorName || 'creator')
      .replace(/^@/, '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toLowerCase()
    
    const isCoBuilder = proj.isDIY || proj.diySubscription?.active
    if (isCoBuilder) {
      return `${origin}/portal/${handleClean}?view=projectos&token=cf_diy_paid&project=${proj.id}`
    }
    return `${origin}/portal/${handleClean}?project=${proj.id}`
  }

  // Copy Workspace URL
  const handleCopyUrl = (proj) => {
    const url = getCreatorWorkspaceUrl(proj)
    if (!url) return
    navigator.clipboard.writeText(url)
    setCopiedId(proj.id)
    showToast('success', 'URL Copied', `Copied workspace link for ${proj.creatorName || proj.creatorHandle}`)
    setTimeout(() => setCopiedId(null), 2500)
  }

  // Mark Paid as Co-Builder ($50 USD Flat)
  const handleMarkAsPaidCoBuilder = async (proj) => {
    if (!proj?.id) return
    const confirmed = window.confirm(
      `Mark $50 Co-Builder Pass as PAID for ${proj.creatorName || proj.creatorHandle}?\n\nThis gives the creator interactive Phase 1-3 access to ideate and run AI MVP tasks directly (with 50/50 Co-Founder Equity).`
    )
    if (!confirmed) return

    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001'
      const handleClean = (proj.creatorHandle || proj.creatorName || 'creator')
        .replace(/^@/, '')
        .replace(/[^a-zA-Z0-9]/g, '')
        .toLowerCase()
      const workspaceUrl = `${origin}/portal/${handleClean}?view=projectos&token=cf_diy_paid&project=${proj.id}`
      const licenseKey = `FORGE-COBUILDER-${Math.random().toString(36).substring(2, 10).toUpperCase()}`

      const subscriptionRecord = {
        active: true,
        plan: 'diy_full_50',
        planName: 'Interactive Co-Builder ProjectOS Pass ($50 USD)',
        amount: 50,
        billingCycle: 'one_time',
        paymentMethod: 'Manual Admin Unlock (Direct / Wire / Stripe)',
        transactionId: `tx_admin_manual_${Date.now()}`,
        unlockedAt: new Date().toISOString(),
        unlockedPhases: [1, 2, 3],
        status: 'active',
        licenseKey,
        dedicatedUrl: workspaceUrl
      }

      await updateCoLaunchProject(proj.id, {
        isDIY: true,
        diySubscription: subscriptionRecord,
        diyOfferStatus: 'paid'
      })

      showToast('success', 'Co-Builder Pass Activated', `$50 Pass marked paid for ${proj.creatorName}. Creator now has interactive execution access!`)
      loadData(true)
    } catch (err) {
      console.error('[CreatorParticipationManager] Failed to mark paid:', err)
      showToast('error', 'Update Failed', err.message || 'Could not update project status')
    }
  }

  // Switch to Studio-Managed Track
  const handleSwitchToStudioManaged = async (proj) => {
    if (!proj?.id) return
    const confirmed = window.confirm(
      `Switch ${proj.creatorName || proj.creatorHandle} to Studio-Managed Track?\n\nStudio team will execute development phases while the creator tracks milestones (50/50 Co-Founder Equity).`
    )
    if (!confirmed) return

    try {
      await updateCoLaunchProject(proj.id, {
        isDIY: false,
        diySubscription: null,
        diyOfferStatus: 'declined'
      })

      showToast('success', 'Switched to Studio-Managed', `${proj.creatorName} is now set to Studio-Managed Track (50/50 equity).`)
      loadData(true)
    } catch (err) {
      console.error('[CreatorParticipationManager] Failed to switch track:', err)
      showToast('error', 'Update Failed', err.message || 'Could not update project status')
    }
  }

  // Open Follow-up Email Drawer
  const handleOpenEmailModal = (proj, templateType = 'followup') => {
    setEmailModalProject(proj)
    const creatorName = proj.creatorName || proj.creatorHandle || 'there'
    const productName = proj.productName || 'our co-launch venture'
    const workspaceUrl = getCreatorWorkspaceUrl(proj)

    if (templateType === 'invoice') {
      setEmailSubject(`Your Co-Builder Pass Invoice & Setup ($50 USD) — ${productName}`)
      setEmailBody(
        `Hi ${creatorName},\n\nHere is your official invite and payment invoice for the Interactive Co-Builder Pass ($50 USD flat fee) for ${productName}.\n\n` +
        `As a reminder, our partnership is a 50/50 Co-Founder Equity Split. This $50 pass gives you full hands-on access inside Creator Forge ProjectOS to run AI MVP tasks, test features, and participate directly in every build phase instead of waiting for us to do it alone.\n\n` +
        `👉 Access your Co-Builder Workspace here:\n${workspaceUrl}\n\n` +
        `Looking forward to building this together!\n\nBest,\nCreator Forge Studio Operations`
      )
    } else if (templateType === 'portal_link') {
      setEmailSubject(`Your Co-Builder ProjectOS Workspace Link — ${productName}`)
      setEmailBody(
        `Hi ${creatorName},\n\nYour Co-Builder ProjectOS workspace is ready for ${productName}!\n\n` +
        `You have full interactive co-builder access to Phase 1, Phase 2, and Phase 3 sprints.\n\n` +
        `👉 Open Your Workspace:\n${workspaceUrl}\n\n` +
        `Best,\nCreator Forge Studio Team`
      )
    } else {
      // Standard Follow-up
      setEmailSubject(`Follow-up: Choose Your Co-Launch Track for ${productName}`)
      setEmailBody(
        `Hi ${creatorName},\n\nI wanted to follow up on our co-launch roadmap for ${productName}.\n\n` +
        `As agreed, our partnership is a 50/50 Co-Founder Equity Split. You have two options for how we execute the development:\n\n` +
        `1. Interactive Co-Builder Pass ($50 USD flat fee):\n` +
        `Get hands-on participation inside our ProjectOS suite so you can run AI MVP tasks, ideate, test, and co-execute every phase directly with us.\n\n` +
        `2. Studio-Managed Track ($0 upfront):\n` +
        `Our studio engineering team completes all technical phases and hosting for you while you monitor progress in real-time.\n\n` +
        `👉 Review and select your track here:\n${workspaceUrl}\n\n` +
        `Let me know if you have any questions!\n\nBest,\nCreator Forge Operations`
      )
    }
  }

  // Send Direct Follow-Up Email
  const handleSendEmail = async () => {
    if (!emailModalProject || !emailSubject.trim() || !emailBody.trim()) return
    const toEmail = emailModalProject.creatorEmail
    if (!toEmail) {
      showToast('error', 'Missing Email', 'This creator has no recorded email address. Please update their profile first.')
      return
    }

    setIsSendingEmail(true)
    try {
      await sendDirectEmail(toEmail, emailSubject.trim(), emailBody.trim(), emailModalProject.creatorId, {
        projectId: emailModalProject.id,
        trackFollowup: true
      })

      // Update offer sent timestamp in project metadata
      await updateCoLaunchProject(emailModalProject.id, {
        diyOfferSentAt: new Date().toISOString()
      })

      showToast('success', 'Email Dispatched', `Real-time follow-up sent to ${toEmail}!`)
      setEmailModalProject(null)
      loadData(true)
    } catch (err) {
      console.error('[CreatorParticipationManager] Failed to send email:', err)
      showToast('error', 'Send Failed', err.message || 'Failed to dispatch email via SMTP')
    } finally {
      setIsSendingEmail(false)
    }
  }

  // Delete Individual Venture
  const handleDeleteProject = async (proj) => {
    if (!proj) return
    const name = proj.productName || 'this venture'
    const creator = proj.creatorName || proj.creatorHandle || 'partner'
    if (!window.confirm(`Are you sure you want to permanently delete "${name}" for ${creator}?\n\nThis will remove all associated validation records, Cloudinary assets, and tasks.`)) {
      return
    }

    try {
      await deleteCoLaunchProject(proj.id)
      setProjects((prev) => prev.filter((p) => p.id !== proj.id))
      showToast('success', 'Venture Deleted', `Successfully removed "${name}".`)
    } catch (err) {
      console.error('[CreatorParticipationManager] Delete project failed:', err)
      showToast('error', 'Delete Failed', err.message || 'Failed to delete venture.')
    }
  }

  // Delete All Section 2 Ventures
  const handleDeleteAllVentures = async () => {
    if (projects.length === 0) return
    if (!window.confirm(`Are you sure you want to wipe ALL ${projects.length} co-launch ventures from Section 2?\n\nThis will permanently purge all projects, tasks, and telemetry data.`)) {
      return
    }

    try {
      await deleteAllProjects()
      setProjects([])
      showToast('success', 'All Ventures Deleted', 'Successfully wiped all Section 2 co-launch ventures.')
    } catch (err) {
      console.error('[CreatorParticipationManager] Delete all projects failed:', err)
      showToast('error', 'Wipe Failed', err.message || 'Failed to wipe ventures.')
    }
  }

  // Filter & Search Logic
  const filteredProjects = projects.filter((p) => {
    const isCoBuilder = p.isDIY || p.diySubscription?.active
    const isDeclined = p.diyOfferStatus === 'declined'
    const isPending = !isCoBuilder && !isDeclined

    if (filterTrack === 'cobuilder' && !isCoBuilder) return false
    if (filterTrack === 'managed' && !isDeclined) return false
    if (filterTrack === 'pending' && !isPending) return false

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const cName = (p.creatorName || '').toLowerCase()
      const cHandle = (p.creatorHandle || '').toLowerCase()
      const cEmail = (p.creatorEmail || '').toLowerCase()
      const pName = (p.productName || '').toLowerCase()
      const license = (p.diySubscription?.licenseKey || '').toLowerCase()
      if (!cName.includes(q) && !cHandle.includes(q) && !cEmail.includes(q) && !pName.includes(q) && !license.includes(q)) {
        return false
      }
    }
    return true
  })

  // Compute Metrics
  const totalProjects = projects.length
  const coBuildersCount = projects.filter((p) => p.isDIY || p.diySubscription?.active).length
  const managedCount = projects.filter((p) => p.diyOfferStatus === 'declined').length
  const pendingCount = projects.filter((p) => !p.isDIY && !p.diySubscription?.active && p.diyOfferStatus !== 'declined').length
  const totalRevenue = coBuildersCount * 50

  return (
    <div className="min-h-screen bg-[#07090e] text-white flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Banner & Header */}
      <header className="sticky top-0 z-40 bg-[#07090e]/90 backdrop-blur-xl border-b border-white/[0.08] shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => {
                if (typeof window !== 'undefined') window.location.href = '/launch'
              }}
              className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
              title="Return to Master Launch OS"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Launch OS</span>
            </button>

            <div className="h-5 w-[1px] bg-white/[0.1] hidden sm:block" />

            <div className="flex items-center gap-2.5">
              <CreatorForgeLogo size={24} />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                    Creator Participation & Co-Builder Console
                  </h1>
                  <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-black uppercase tracking-wider hidden md:inline-flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    Dedicated Admin Page
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  Real-time operational control for $50 Co-Builder passes, participation follow-ups, and 50/50 partnership governance.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            {/* Real-time status indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-400 font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="hidden md:inline">Real-Time Sync Active (4s)</span>
              <span className="md:hidden">Live</span>
            </div>

            {/* Quick Links */}
            <button
              onClick={() => {
                if (typeof window !== 'undefined') window.location.href = '/crm'
              }}
              className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs text-slate-300 hover:text-white transition-all cursor-pointer font-medium hidden sm:inline-flex items-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5 text-purple-400" />
              <span>CRM</span>
            </button>

            <button
              onClick={() => {
                if (typeof window !== 'undefined') window.location.href = '/project-os'
              }}
              className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs text-slate-300 hover:text-white transition-all cursor-pointer font-medium hidden sm:inline-flex items-center gap-1.5"
            >
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>ProjectOS</span>
            </button>

            {/* Manual Refresh */}
            <button
              onClick={() => loadData(false)}
              disabled={isRefreshing}
              className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-slate-200 hover:text-white transition-all cursor-pointer disabled:opacity-50"
              title="Refresh Real-Time Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Equity Architecture Notice */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/30 via-slate-900/40 to-cyan-950/30 border border-emerald-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-bold text-white">
                  50/50 Co-Founder Equity Architecture
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-black uppercase tracking-wider">
                  Guaranteed
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                Creators always retain <strong>50% co-founder equity</strong> on both tracks. The $50 USD fee is strictly for the <strong>Interactive Co-Builder Pass</strong>, giving creators hands-on access to build, ideate, and run AI MVP tasks directly instead of the studio completing phases alone.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-right">
              <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-bold">Standard Equity Split</span>
              <span className="text-xs font-black text-emerald-400">50% Creator / 50% Studio</span>
            </div>
          </div>
        </div>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {/* Card 1: Total Co-Launches */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] shadow-sm space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Ventures
            </span>
            <div className="text-2xl font-black text-white">{totalProjects}</div>
            <p className="text-[10px] text-slate-500">Active co-launch projects</p>
          </div>

          {/* Card 2: Co-Builders Active ($50 Paid) */}
          <div className="p-4 rounded-2xl bg-gradient-to-b from-amber-500/10 to-transparent border border-amber-500/30 shadow-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block">
                Co-Builders Active
              </span>
              <Zap className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-400">{coBuildersCount}</div>
            <p className="text-[10px] text-amber-200/70">$50 Pass Paid · Interactive</p>
          </div>

          {/* Card 3: Studio Managed Track */}
          <div className="p-4 rounded-2xl bg-gradient-to-b from-purple-500/10 to-transparent border border-purple-500/30 shadow-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider block">
                Studio-Managed
              </span>
              <Rocket className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="text-2xl font-black text-purple-400">{managedCount}</div>
            <p className="text-[10px] text-purple-200/70">Studio team executing builds</p>
          </div>

          {/* Card 4: Decision Pending */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] shadow-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Pending Decision
              </span>
              <Clock className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="text-2xl font-black text-slate-200">{pendingCount}</div>
            <p className="text-[10px] text-slate-500">Follow-up needed</p>
          </div>

          {/* Card 5: Total Revenue */}
          <div className="p-4 rounded-2xl bg-gradient-to-b from-emerald-500/10 to-transparent border border-emerald-500/30 shadow-sm space-y-1 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider block">
                Toolset Revenue
              </span>
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400">${totalRevenue.toLocaleString()}</div>
            <p className="text-[10px] text-emerald-200/70">from $50 Co-Builder passes</p>
          </div>
        </div>

        {/* Filter and Search Ribbon */}
        <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.08] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Track Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <button
              onClick={() => setFilterTrack('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                filterTrack === 'all'
                  ? 'bg-white text-slate-950 shadow-md'
                  : 'bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              All Ventures ({totalProjects})
            </button>

            <button
              onClick={() => setFilterTrack('cobuilder')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                filterTrack === 'cobuilder'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              <Zap className="w-3 h-3" />
              <span>Co-Builders Active ({coBuildersCount})</span>
            </button>

            <button
              onClick={() => setFilterTrack('pending')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                filterTrack === 'pending'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-md'
                  : 'bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>Pending Choice ({pendingCount})</span>
            </button>

            <button
              onClick={() => setFilterTrack('managed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                filterTrack === 'managed'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-md'
                  : 'bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              <Rocket className="w-3 h-3" />
              <span>Studio-Managed ({managedCount})</span>
            </button>
          </div>

          {/* Search Box & Actions */}
          <div className="flex items-center gap-2">
            <div className="relative min-w-[220px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search creator, handle, email, app..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/50 transition-colors"
              />
            </div>
            {totalProjects > 0 && (
              <button
                type="button"
                onClick={handleDeleteAllVentures}
                className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-xs font-bold text-red-400 hover:text-red-300 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
                title="Wipe all co-launch ventures from Section 2"
              >
                <Trash2 className="w-3 h-3 text-red-400" />
                <span>Wipe All ({totalProjects})</span>
              </button>
            )}
          </div>
        </div>

        {/* Projects List / Grid */}
        {loading ? (
          <div className="p-12 text-center space-y-3 rounded-2xl border border-white/[0.05] bg-white/[0.01]">
            <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Loading real-time participation records and payment links…</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="p-12 text-center space-y-3 rounded-2xl border border-white/[0.05] bg-white/[0.01]">
            <Users className="w-8 h-8 text-slate-500 mx-auto" />
            <h3 className="text-sm font-bold text-white">No co-launch ventures found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchQuery || filterTrack !== 'all'
                ? 'Try adjusting your filters or search query.'
                : 'Approved Step 6 co-launch creators will automatically appear here with their participation status.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProjects.map((proj) => {
              const isCoBuilder = proj.isDIY || proj.diySubscription?.active
              const isDeclined = proj.diyOfferStatus === 'declined'
              const isPending = !isCoBuilder && !isDeclined
              const sub = proj.diySubscription || {}
              const workspaceUrl = getCreatorWorkspaceUrl(proj)

              return (
                <div
                  key={proj.id}
                  className={`p-5 sm:p-6 rounded-2xl border transition-all duration-200 relative overflow-hidden shadow-xl ${
                    isCoBuilder
                      ? 'bg-gradient-to-r from-amber-950/20 via-[#0e121a] to-[#0d1017] border-amber-500/40 shadow-amber-950/20'
                      : isDeclined
                      ? 'bg-[#0e121a] border-purple-500/30'
                      : 'bg-[#0d1017] border-white/[0.08] hover:border-white/[0.15]'
                  }`}
                >
                  {/* Glowing ambient indicator for paid Co-Builders */}
                  {isCoBuilder && (
                    <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
                  )}

                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 relative z-10">
                    {/* Left: Creator & Venture Profile */}
                    <div className="space-y-3 flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        {proj.creatorAvatar ? (
                          <img
                            src={proj.creatorAvatar}
                            alt={proj.creatorName || ''}
                            className="w-11 h-11 rounded-xl object-cover border border-white/[0.1] shrink-0"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500/20 to-purple-500/20 border border-white/[0.1] flex items-center justify-center text-sm font-bold text-white shrink-0">
                            {(proj.creatorName || proj.creatorHandle || 'C').charAt(0).toUpperCase()}
                          </div>
                        )}

                        {/* Names & Contact */}
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-sm sm:text-base font-extrabold text-white truncate">
                              {proj.creatorName || 'Unnamed Creator'}
                            </h2>
                            <span className="text-xs text-slate-400 font-mono">
                              {proj.creatorHandle || '@creator'}
                            </span>
                            {/* Equity Badge */}
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                              50/50 Equity
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2.5 mt-0.5 text-[11px] text-slate-400">
                            <span>📧 {proj.creatorEmail || 'No email saved'}</span>
                            {proj.niche && (
                              <>
                                <span>•</span>
                                <span className="capitalize">{proj.niche}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Product Venture Summary */}
                      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Venture Software Product
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Phase {proj.currentPhase || 1} · {proj.status || 'validating'}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-white">
                          {proj.productName || 'New Venture'}{' '}
                          {proj.productTagline && (
                            <span className="text-slate-400 font-normal">
                              — {decodeText(proj.productTagline)}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Middle: Participation Status Card */}
                    <div className="w-full lg:w-72 shrink-0 p-3.5 rounded-xl bg-black/40 border border-white/[0.08] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Participation Track
                        </span>
                        {isCoBuilder ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[9px] uppercase tracking-wider flex items-center gap-1 shadow-xs">
                            <Zap className="w-2.5 h-2.5" />
                            Co-Builder ($50 Paid)
                          </span>
                        ) : isDeclined ? (
                          <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold text-[9px] uppercase tracking-wider">
                            Studio-Managed
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold text-[9px] uppercase tracking-wider">
                            Choice Pending
                          </span>
                        )}
                      </div>

                      {/* Status Details */}
                      {isCoBuilder ? (
                        <div className="space-y-1 text-[11px]">
                          <p className="text-amber-200/90 font-medium">
                            Phases 1-3 Interactive Execution Unlocked
                          </p>
                          <div className="flex items-center justify-between text-slate-400 text-[10px]">
                            <span>License:</span>
                            <span className="font-mono text-white/80">{sub.licenseKey || 'FORGE-ACTIVE'}</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-400 text-[10px]">
                            <span>Payment:</span>
                            <span className="text-emerald-400 font-bold">$50.00 USD</span>
                          </div>
                        </div>
                      ) : isDeclined ? (
                        <div className="space-y-0.5 text-[11px] text-slate-300">
                          <p className="font-medium text-purple-300">Managed Track</p>
                          <p className="text-[10px] text-slate-400">
                            Studio engineering builds MVP; Creator monitors milestone sprints.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-1 text-[11px] text-slate-300">
                          <p className="text-amber-300/80 font-medium">Awaiting Track Selection</p>
                          <p className="text-[10px] text-slate-400">
                            {proj.diyOfferSentAt
                              ? `Offer dispatched: ${new Date(proj.diyOfferSentAt).toLocaleDateString()}`
                              : 'Offer pending creator review'}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Right: Real-Time Action Controls */}
                    <div className="flex flex-wrap lg:flex-col items-stretch gap-2 w-full lg:w-48 shrink-0">
                      {/* Send / Resend Follow-up Email */}
                      <button
                        onClick={() => handleOpenEmailModal(proj, isCoBuilder ? 'portal_link' : 'followup')}
                        className="flex-1 lg:flex-initial py-2 px-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-xs font-semibold text-slate-200 hover:text-white transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Mail className="w-3.5 h-3.5 text-amber-400" />
                        <span>{isCoBuilder ? 'Send Workspace Email' : 'Send Follow-Up'}</span>
                      </button>

                      {/* Copy Workspace URL */}
                      <button
                        onClick={() => handleCopyUrl(proj)}
                        className="flex-1 lg:flex-initial py-2 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        {copiedId === proj.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Workspace URL</span>
                          </>
                        )}
                      </button>

                      {/* State Toggle Buttons */}
                      {!isCoBuilder ? (
                        <button
                          onClick={() => handleMarkAsPaidCoBuilder(proj)}
                          className="flex-1 lg:flex-initial py-2 px-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-110 text-slate-950 text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-amber-950/30"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Mark Paid DIY ($50)</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSwitchToStudioManaged(proj)}
                          className="flex-1 lg:flex-initial py-1.5 px-3 rounded-xl bg-white/[0.03] hover:bg-red-500/10 border border-white/[0.06] hover:border-red-500/20 text-[11px] font-semibold text-slate-400 hover:text-red-300 transition-all cursor-pointer flex items-center justify-center gap-1"
                        >
                          <span>Revert to Managed</span>
                        </button>
                      )}

                      {/* Live Portal Preview */}
                      <a
                        href={workspaceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 lg:flex-initial py-1.5 px-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] text-[11px] text-slate-400 hover:text-slate-200 transition-all text-center flex items-center justify-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Preview Portal View</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>

                      {/* Delete Venture Button */}
                      <button
                        type="button"
                        onClick={() => handleDeleteProject(proj)}
                        className="flex-1 lg:flex-initial py-1.5 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 text-[11px] font-bold text-red-400 hover:text-red-300 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        title="Permanently Delete this Co-Launch Venture from Section 2"
                      >
                        <Trash2 className="w-3 h-3 text-red-400" />
                        <span>Delete Venture</span>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Real-Time Direct Email Dispatch Modal */}
      {emailModalProject && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-[#0f131c] border border-white/[0.12] p-6 sm:p-8 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setEmailModalProject(null)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1">
                <Send className="w-3 h-3" />
                Real-Time Direct Email Dispatch
              </span>
              <h2 className="text-lg font-black text-white">
                Send Follow-up to {emailModalProject.creatorName || emailModalProject.creatorHandle}
              </h2>
              <p className="text-xs text-slate-400">
                Dispatches immediately from the studio SMTP server to <strong>{emailModalProject.creatorEmail || 'creator email'}</strong>.
              </p>
            </div>

            {/* Quick Templates */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Templates:</span>
              <button
                type="button"
                onClick={() => handleOpenEmailModal(emailModalProject, 'followup')}
                className="px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-[11px] text-slate-300 font-medium transition-colors cursor-pointer"
              >
                Track Choice Reminder
              </button>
              <button
                type="button"
                onClick={() => handleOpenEmailModal(emailModalProject, 'invoice')}
                className="px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-[11px] text-slate-300 font-medium transition-colors cursor-pointer"
              >
                $50 Pass Invoice
              </button>
              <button
                type="button"
                onClick={() => handleOpenEmailModal(emailModalProject, 'portal_link')}
                className="px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-[11px] text-slate-300 font-medium transition-colors cursor-pointer"
              >
                Workspace URL Dispatch
              </button>
            </div>

            {/* Subject Input */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Email Subject
              </label>
              <input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.1] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/50"
              />
            </div>

            {/* Body Textarea */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Email Message Body
              </label>
              <textarea
                rows={9}
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                className="w-full p-3.5 rounded-xl bg-white/[0.04] border border-white/[0.1] text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400/50 leading-relaxed"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEmailModalProject(null)}
                className="px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendEmail}
                disabled={isSendingEmail || !emailSubject.trim() || !emailBody.trim()}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-110 text-slate-950 font-black text-xs transition-all cursor-pointer disabled:opacity-40 flex items-center gap-2 shadow-lg shadow-amber-950/40"
              >
                {isSendingEmail ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Dispatching Email…</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Follow-Up Real-Time 🚀</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#0f131c] border border-white/[0.12] shadow-2xl">
          {toast.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          )}
          <div className="min-w-0 pr-2">
            <p className="text-xs font-bold text-white">{toast.title}</p>
            <p className="text-[11px] text-slate-400">{toast.message}</p>
          </div>
        </div>
      )}
    </div>
  )
}
