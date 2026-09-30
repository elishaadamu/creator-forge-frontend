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
  Trash2,
  Sun,
  Moon,
  MoreHorizontal,
  RotateCcw
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
import { getExpiringItem, removeExpiringItem } from '../../utils/expiringStorage'
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

  // Theme State: 'light' or 'dark' (defaults to light per user request)
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('forge_participation_theme')
      return saved === 'dark' ? 'dark' : 'light'
    } catch {
      return 'light'
    }
  })
  const isLight = theme === 'light'

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    try {
      localStorage.setItem('forge_participation_theme', next)
    } catch (e) {}
  }

  // Follow-up email modal state
  const [emailModalProject, setEmailModalProject] = useState(null)
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [isSendingEmail, setIsSendingEmail] = useState(false)

  // Manual payment / DIY modal state
  const [diyModalProject, setDiyModalProject] = useState(null)

  // Actions menu modal state (Ellipsis action menu that floats over table without clipping)
  const [actionModalProject, setActionModalProject] = useState(null)

  // Dynamic Co-Builder Pass Price States
  const [defaultPassPrice, setDefaultPassPrice] = useState(() => {
    try {
      const saved = localStorage.getItem('forge_cobuilder_pass_price')
      return saved && !isNaN(Number(saved)) ? Number(saved) : 50
    } catch {
      return 50
    }
  })

  // Global Pass Price Modal
  const [showGlobalPriceModal, setShowGlobalPriceModal] = useState(false)
  const [globalPriceInput, setGlobalPriceInput] = useState(50)
  const [updatePendingWithGlobal, setUpdatePendingWithGlobal] = useState(true)
  const [isSavingGlobalPrice, setIsSavingGlobalPrice] = useState(false)

  // Per-Creator Custom Price Modal
  const [customPriceModalProject, setCustomPriceModalProject] = useState(null)
  const [customPriceInput, setCustomPriceInput] = useState(50)
  const [isSavingCustomPrice, setIsSavingCustomPrice] = useState(false)

  // Helper to resolve pass price for any project (custom or default)
  const getProjectPassPrice = useCallback((proj) => {
    if (!proj) return defaultPassPrice
    if (proj.diySubscription?.amount && !isNaN(Number(proj.diySubscription.amount))) {
      return Number(proj.diySubscription.amount)
    }
    if (proj.diyFee !== undefined && proj.diyFee !== null && !isNaN(Number(proj.diyFee))) {
      return Number(proj.diyFee)
    }
    if (proj.diyPassPrice !== undefined && proj.diyPassPrice !== null && !isNaN(Number(proj.diyPassPrice))) {
      return Number(proj.diyPassPrice)
    }
    return defaultPassPrice
  }, [defaultPassPrice])

  // Open custom price modal for a project
  const handleOpenCustomPriceModal = (proj) => {
    if (!proj) return
    setCustomPriceModalProject(proj)
    setCustomPriceInput(getProjectPassPrice(proj))
  }

  // Save custom price for a project
  const handleSaveCustomPrice = async () => {
    if (!customPriceModalProject?.id) return
    const numericFee = Math.max(0, Number(customPriceInput) || 0)
    setIsSavingCustomPrice(true)

    try {
      await updateCoLaunchProject(customPriceModalProject.id, {
        diyFee: numericFee,
        diyPassPrice: numericFee
      })

      setProjects((prev) =>
        prev.map((p) =>
          p.id === customPriceModalProject.id
            ? { ...p, diyFee: numericFee, diyPassPrice: numericFee }
            : p
        )
      )

      showToast(
        'success',
        'Pass Fee Updated',
        `Co-Builder pass fee for ${customPriceModalProject.creatorName || 'creator'} set to $${numericFee} USD`
      )
      setCustomPriceModalProject(null)
    } catch (err) {
      console.error('[CreatorParticipationManager] Failed to update creator fee:', err)
      showToast('error', 'Update Failed', err.message || 'Could not update creator pass fee')
    } finally {
      setIsSavingCustomPrice(false)
    }
  }

  // Save global default price
  const handleSaveGlobalPrice = async () => {
    const numericFee = Math.max(0, Number(globalPriceInput) || 0)
    setIsSavingGlobalPrice(true)

    try {
      try {
        localStorage.setItem('forge_cobuilder_pass_price', String(numericFee))
      } catch (e) {}
      setDefaultPassPrice(numericFee)

      if (updatePendingWithGlobal) {
        const pendingProjects = projects.filter(
          (p) => !(p.isDIY || p.diySubscription?.active || p.diyOfferStatus === 'paid' || p.diyOfferStatus === 'accepted')
        )

        await Promise.allSettled(
          pendingProjects.map((p) =>
            updateCoLaunchProject(p.id, { diyFee: numericFee, diyPassPrice: numericFee })
          )
        )

        setProjects((prev) =>
          prev.map((p) => {
            const isPaid = p.isDIY || p.diySubscription?.active || p.diyOfferStatus === 'paid' || p.diyOfferStatus === 'accepted'
            if (!isPaid) {
              return { ...p, diyFee: numericFee, diyPassPrice: numericFee }
            }
            return p
          })
        )
      }

      showToast(
        'success',
        'Global Fee Updated',
        `Standard Co-Builder Pass fee updated to $${numericFee} USD${updatePendingWithGlobal ? ' & synced to pending ventures' : ''}.`
      )
      setShowGlobalPriceModal(false)
    } catch (err) {
      console.error('[CreatorParticipationManager] Failed to update global fee:', err)
      showToast('error', 'Update Failed', err.message || 'Could not update global pass fee')
    } finally {
      setIsSavingGlobalPrice(false)
    }
  }

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
      description: 'Dedicated real-time operator console for tracking creator participation tracks, Co-Builder passes, dynamic pricing, and follow-ups.',
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

  // Mark Paid as Co-Builder (Dynamic Fee)
  const handleMarkAsPaidCoBuilder = async (proj) => {
    if (!proj?.id) return
    const passFee = getProjectPassPrice(proj)
    const confirmed = window.confirm(
      `Mark $${passFee} Co-Builder Pass as PAID for ${proj.creatorName || proj.creatorHandle}?\n\nThis gives the creator interactive Phase 1-3 access to ideate and run AI MVP tasks directly (with 50/50 Co-Founder Equity).`
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
        plan: `diy_full_${passFee}`,
        planName: `Interactive Co-Builder ProjectOS Pass ($${passFee} USD)`,
        amount: passFee,
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
        diyOfferStatus: 'paid',
        diyFee: passFee,
        diyPassPrice: passFee
      })

      showToast('success', 'Co-Builder Pass Activated', `$${passFee} Pass marked paid for ${proj.creatorName}. Creator now has interactive execution access!`)
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
    const passFee = getProjectPassPrice(proj)

    if (templateType === 'invoice') {
      setEmailSubject(`Your Co-Builder Pass Invoice & Setup ($${passFee} USD) — ${productName}`)
      setEmailBody(
        `Hi ${creatorName},\n\nHere is your official invite and payment invoice for the Interactive Co-Builder Pass ($${passFee} USD flat fee) for ${productName}.\n\n` +
        `As a reminder, our partnership is a 50/50 Co-Founder Equity Split. This $${passFee} pass gives you full hands-on access inside Creator Forge ProjectOS to run AI MVP tasks, test features, and participate directly in every build phase instead of waiting for us to do it alone.\n\n` +
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
        `1. Interactive Co-Builder Pass ($${passFee} USD flat fee):\n` +
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
      if (proj.creatorId) {
        try {
          const { updateCreatorDetails } = await import('../../services/opsApi')
          await updateCreatorDetails(proj.creatorId, {
            status: 'qualified',
            project_id: null,
            projectId: null
          })
        } catch (e) {}
      }
      try {
        const activeLocal = getExpiringItem('forge_launch_active_project')
        if (activeLocal?.id === proj.id) {
          removeExpiringItem('forge_launch_active_project')
        }
      } catch (e) {}
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
      try {
        removeExpiringItem('forge_launch_active_project')
        localStorage.removeItem('forge_launch_all_projects')
        localStorage.removeItem('forge_launch_active_section')
      } catch (e) {}
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
  const totalRevenue = projects
    .filter((p) => p.isDIY || p.diySubscription?.active || p.diyOfferStatus === 'paid' || p.diyOfferStatus === 'accepted')
    .reduce((sum, p) => sum + (Number(p.diySubscription?.amount) || getProjectPassPrice(p)), 0)

  return (
    <div className={`min-h-screen ${isLight ? 'bg-[#f0f2f5] text-slate-900 selection:bg-amber-500/20 selection:text-amber-900' : 'bg-[#07090e] text-white selection:bg-amber-500/30 selection:text-amber-200'} flex flex-col font-sans transition-colors duration-200`}>
      {/* Top Banner & Header */}
      <header className={`sticky top-0 z-40 ${isLight ? 'bg-white/95 border-slate-200/90 shadow-2xs' : 'bg-[#07090e]/90 border-white/[0.08] shadow-2xl'} backdrop-blur-xl border-b`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => {
                if (typeof window !== 'undefined') window.location.href = '/launch'
              }}
              className={`p-2 rounded-xl ${isLight ? 'bg-slate-100 hover:bg-slate-200/80 border-slate-200 text-slate-700' : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-slate-300 hover:text-white'} border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold`}
              title="Return to Master Launch OS"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Launch OS</span>
            </button>

            <div className={`h-5 w-[1px] ${isLight ? 'bg-slate-200' : 'bg-white/[0.1]'} hidden sm:block`} />

            <div className="flex items-center gap-2.5">
              <CreatorForgeLogo size={24} theme={isLight ? 'light' : 'dark'} />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className={`text-sm sm:text-base font-extrabold ${isLight ? 'text-slate-900' : 'text-white'} tracking-tight`}>
                    Creator Participation & Co-Builder Console
                  </h1>
                  <span className={`px-2 py-0.5 rounded-full ${isLight ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-amber-400/20 text-amber-300 border-amber-400/30'} border text-[10px] font-black uppercase tracking-wider hidden md:inline-flex items-center gap-1`}>
                    <Sparkles className="w-2.5 h-2.5" />
                    Dedicated Admin Page
                  </span>
                </div>
                <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'} hidden sm:block`}>
                  Co-Builder pass fees, tracking, and partnership governance.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            {/* Dynamic Pass Fee Quick-Edit Button */}
            <button
              type="button"
              onClick={() => {
                setGlobalPriceInput(defaultPassPrice || 50)
                setShowGlobalPriceModal(true)
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95 ${
                isLight
                  ? 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 hover:border-slate-300'
                  : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.1] text-slate-200 hover:border-white/[0.2]'
              }`}
              title="Click to change the default Co-Builder Pass fee anytime"
            >
              <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 ${
                isLight ? 'bg-slate-100 text-slate-700' : 'bg-white/[0.08] text-slate-300'
              }`}>
                <DollarSign className="w-3.5 h-3.5" />
              </div>
              <span className={isLight ? 'text-slate-700' : 'text-slate-300'}>
                Pass Fee: <strong className={`font-black font-mono ${isLight ? 'text-slate-950' : 'text-white'}`}>${defaultPassPrice || 50} USD</strong>
              </span>
              <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ml-0.5 ${
                isLight
                  ? 'bg-slate-100 text-slate-600 border-slate-200/80'
                  : 'bg-white/[0.08] text-slate-300 border-white/[0.1]'
              }`}>
                Edit
              </span>
            </button>

            {/* Real-time status indicator */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'} border text-[11px] font-medium`}>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="hidden md:inline">Real-Time Sync Active (4s)</span>
              <span className="md:hidden">Live</span>
            </div>

            {/* Light / Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-xl ${isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700' : 'bg-white/[0.05] hover:bg-white/[0.1] border-white/[0.1] text-slate-200 hover:text-white'} border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold`}
              title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {isLight ? <Moon className="w-3.5 h-3.5 text-indigo-600" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
              <span className="hidden sm:inline">{isLight ? 'Dark' : 'Light'}</span>
            </button>

            {/* Quick Links */}
            <button
              onClick={() => {
                if (typeof window !== 'undefined') window.location.href = '/crm'
              }}
              className={`px-3 py-1.5 rounded-xl ${isLight ? 'bg-slate-100 hover:bg-slate-200/80 border-slate-200 text-slate-700' : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-slate-300 hover:text-white'} border text-xs transition-all cursor-pointer font-medium hidden sm:inline-flex items-center gap-1.5`}
            >
              <Users className="w-3.5 h-3.5 text-purple-500" />
              <span>CRM</span>
            </button>

            <button
              onClick={() => {
                if (typeof window !== 'undefined') window.location.href = '/project-os'
              }}
              className={`px-3 py-1.5 rounded-xl ${isLight ? 'bg-slate-100 hover:bg-slate-200/80 border-slate-200 text-slate-700' : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-slate-300 hover:text-white'} border text-xs transition-all cursor-pointer font-medium hidden sm:inline-flex items-center gap-1.5`}
            >
              <Layers className="w-3.5 h-3.5 text-sky-500" />
              <span>ProjectOS</span>
            </button>

            {/* Manual Refresh */}
            <button
              onClick={() => loadData(false)}
              disabled={isRefreshing}
              className={`p-2 rounded-xl ${isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700' : 'bg-white/[0.05] hover:bg-white/[0.1] border-white/[0.1] text-slate-200 hover:text-white'} border transition-all cursor-pointer disabled:opacity-50`}
              title="Refresh Real-Time Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-500' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-4 space-y-3.5">
        {/* Equity Architecture Notice */}
        <div className={`px-4 py-3 rounded-xl ${isLight ? 'bg-white border-slate-200/90 text-slate-800 shadow-2xs' : 'bg-white/[0.02] border-white/[0.08] text-white shadow-lg'} border flex flex-col md:flex-row md:items-center justify-between gap-3`}>
          <div className="flex items-start gap-3">
            <div className={`p-1.5 rounded-lg ${isLight ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'} border shrink-0`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`text-xs sm:text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  50/50 Co-Founder Equity Architecture
                </h3>
                <span className={`px-2 py-0.5 rounded-full ${isLight ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-500/20 text-emerald-300'} text-[9px] font-black uppercase tracking-wider`}>
                  Guaranteed
                </span>
              </div>
              <p className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-300'} mt-0.5 leading-relaxed`}>
                Creators always retain <strong>50% co-founder equity</strong> on both tracks. The Co-Builder Pass fee (<strong>${defaultPassPrice} USD</strong> base, customizable per creator) gives hands-on access to build and run AI MVP tasks directly.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className={`px-2.5 py-1 rounded-lg ${isLight ? 'bg-white border-slate-200 shadow-2xs' : 'bg-white/[0.04] border-white/[0.08]'} border text-right`}>
              <span className={`text-[9px] ${isLight ? 'text-slate-500' : 'text-slate-400'} uppercase tracking-wider block font-bold`}>Standard Equity Split</span>
              <span className={`text-xs font-black ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>50% Creator / 50% Studio</span>
            </div>
          </div>
        </div>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {/* Card 1: Total Co-Launches */}
          <div className={`p-3 rounded-xl ${isLight ? 'bg-white border-slate-200/90 shadow-2xs' : 'bg-white/[0.02] border-white/[0.08] shadow-sm'} border space-y-0.5`}>
            <span className={`text-[10px] font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'} uppercase tracking-wider block`}>
              Total Ventures
            </span>
            <div className={`text-xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>{totalProjects}</div>
            <p className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>Active co-launch projects</p>
          </div>

          {/* Card 2: Co-Builders Active */}
          <div className={`p-3 rounded-xl ${isLight ? 'bg-white border-slate-200/90 shadow-2xs' : 'bg-white/[0.02] border-white/[0.08] shadow-sm'} border space-y-0.5`}>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'} uppercase tracking-wider block`}>
                Co-Builders Active
              </span>
              <Zap className={`w-3.5 h-3.5 ${isLight ? 'text-amber-500' : 'text-amber-400'}`} />
            </div>
            <div className={`text-xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>{coBuildersCount}</div>
            <p className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>Active Interactive Passes</p>
          </div>

          {/* Card 3: Studio Managed Track */}
          <div className={`p-3 rounded-xl ${isLight ? 'bg-white border-slate-200/90 shadow-2xs' : 'bg-white/[0.02] border-white/[0.08] shadow-sm'} border space-y-0.5`}>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'} uppercase tracking-wider block`}>
                Studio-Managed
              </span>
              <Rocket className={`w-3.5 h-3.5 ${isLight ? 'text-purple-500' : 'text-purple-400'}`} />
            </div>
            <div className={`text-xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>{managedCount}</div>
            <p className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>Studio team executing builds</p>
          </div>

          {/* Card 4: Decision Pending */}
          <div className={`p-3 rounded-xl ${isLight ? 'bg-white border-slate-200/90 shadow-2xs' : 'bg-white/[0.02] border-white/[0.08] shadow-sm'} border space-y-0.5`}>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'} uppercase tracking-wider block`}>
                Pending Decision
              </span>
              <Clock className={`w-3.5 h-3.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`} />
            </div>
            <div className={`text-xl font-black ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>{pendingCount}</div>
            <p className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>Follow-up needed</p>
          </div>

          {/* Card 5: Total Revenue */}
          <div className={`p-3 rounded-xl ${isLight ? 'bg-white border-slate-200/90 shadow-2xs' : 'bg-white/[0.02] border-white/[0.08] shadow-sm'} border space-y-0.5 col-span-2 sm:col-span-1`}>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'} uppercase tracking-wider block`}>
                Toolset Revenue
              </span>
              <DollarSign className={`w-3.5 h-3.5 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
            </div>
            <div className={`text-xl font-black ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>${totalRevenue.toLocaleString()}</div>
            <p className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>from Co-Builder passes</p>
          </div>
        </div>

        {/* Filter and Search Ribbon */}
        <div className={`px-3 py-2 rounded-xl ${isLight ? 'bg-white border-slate-200/90 shadow-2xs' : 'bg-white/[0.02] border-white/[0.08]'} border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2`}>
          {/* Track Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <button
              onClick={() => setFilterTrack('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                filterTrack === 'all'
                  ? isLight ? 'bg-slate-900 text-white shadow-2xs' : 'bg-white text-slate-950 shadow-md'
                  : isLight ? 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70' : 'bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              All Ventures ({totalProjects})
            </button>

            <button
              onClick={() => setFilterTrack('cobuilder')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                filterTrack === 'cobuilder'
                  ? 'bg-amber-400 text-slate-950 font-black shadow-2xs'
                  : isLight ? 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70' : 'bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              <Zap className="w-3 h-3" />
              <span>Co-Builders Active ({coBuildersCount})</span>
            </button>

            <button
              onClick={() => setFilterTrack('pending')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                filterTrack === 'pending'
                  ? isLight ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-md'
                  : isLight ? 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70' : 'bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>Pending Choice ({pendingCount})</span>
            </button>

            <button
              onClick={() => setFilterTrack('managed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                filterTrack === 'managed'
                  ? isLight ? 'bg-purple-100 text-purple-900 border border-purple-300 shadow-2xs' : 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-md'
                  : isLight ? 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70' : 'bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              <Rocket className="w-3 h-3" />
              <span>Studio-Managed ({managedCount})</span>
            </button>
          </div>

          {/* Search Box & Actions */}
          <div className="flex items-center gap-2">
            <div className="relative min-w-[220px]">
              <Search className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${isLight ? 'text-slate-400' : 'text-slate-400'}`} />
              <input
                type="text"
                placeholder="Search creator, handle, email, app..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-9 pr-3 py-1.5 rounded-xl ${isLight ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500' : 'bg-white/[0.04] border-white/[0.08] text-white placeholder-slate-500 focus:border-amber-400/50'} border text-xs focus:outline-none transition-colors`}
              />
            </div>
            {totalProjects > 0 && (
              <button
                type="button"
                onClick={handleDeleteAllVentures}
                className={`px-3 py-1.5 rounded-xl ${isLight ? 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-600' : 'bg-red-500/10 hover:bg-red-500/20 border-red-500/30 text-red-400 hover:text-red-300'} border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap`}
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
          <div className={`p-8 text-center space-y-2.5 rounded-xl border ${isLight ? 'border-slate-200 bg-white shadow-2xs' : 'border-white/[0.05] bg-white/[0.01]'}`}>
            <RefreshCw className="w-6 h-6 text-amber-500 animate-spin mx-auto" />
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Loading real-time participation records and payment links…</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className={`py-10 px-6 text-center space-y-2 rounded-xl border ${isLight ? 'border-slate-200 bg-white shadow-2xs' : 'border-white/[0.05] bg-white/[0.01]'}`}>
            <Users className={`w-7 h-7 ${isLight ? 'text-slate-300' : 'text-slate-500'} mx-auto`} />
            <h3 className={`text-sm font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>No co-launch ventures found</h3>
            <p className={`text-[11px] ${isLight ? 'text-slate-400' : 'text-slate-400'} max-w-xs mx-auto leading-relaxed`}>
              {searchQuery || filterTrack !== 'all'
                ? 'Try adjusting your filters or search query.'
                : 'Approved Step 6 co-launch creators will automatically appear here with their participation status.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredProjects.map((proj) => {
              const isCoBuilder = proj.isDIY || proj.diySubscription?.active
              const isDeclined = proj.diyOfferStatus === 'declined'
              const isPending = !isCoBuilder && !isDeclined
              const sub = proj.diySubscription || {}
              const workspaceUrl = getCreatorWorkspaceUrl(proj)
              const projPrice = getProjectPassPrice(proj)

              return (
                <div
                  key={proj.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 relative overflow-hidden ${
                    isLight
                      ? 'bg-white border-slate-200/90 hover:border-slate-300 shadow-2xs hover:shadow-xs'
                      : 'bg-[#0d1017] border-white/[0.08] hover:border-white/[0.15]'
                  }`}
                >

                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
                    {/* Left: Creator & Venture Profile */}
                    <div className="space-y-2.5 flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        {proj.creatorAvatar ? (
                          <img
                            src={proj.creatorAvatar}
                            alt={proj.creatorName || ''}
                            className={`w-11 h-11 rounded-xl object-cover border ${isLight ? 'border-slate-200' : 'border-white/[0.1]'} shrink-0`}
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className={`w-11 h-11 rounded-xl ${isLight ? 'bg-slate-100 text-slate-800 border-slate-200' : 'bg-white/[0.08] text-white border-white/[0.1]'} border flex items-center justify-center text-sm font-bold shrink-0`}>
                            {(proj.creatorName || proj.creatorHandle || 'C').charAt(0).toUpperCase()}
                          </div>
                        )}

                        {/* Names & Contact */}
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className={`text-sm sm:text-base font-extrabold ${isLight ? 'text-slate-900' : 'text-white'} truncate`}>
                              {proj.creatorName || 'Unnamed Creator'}
                            </h2>
                            <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'} font-mono`}>
                              {proj.creatorHandle || '@creator'}
                            </span>
                            {/* Equity Badge */}
                            <span className={`px-2 py-0.5 rounded-full ${isLight ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'} border text-[10px] font-bold`}>
                              50/50 Equity
                            </span>
                          </div>

                          <div className={`flex flex-wrap items-center gap-2.5 mt-0.5 text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
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
                      <div className={`px-3 py-2 rounded-lg ${isLight ? 'bg-slate-50 border-slate-200/80' : 'bg-white/[0.02] border-white/[0.05]'} border space-y-0.5`}>
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-[10px] font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'} uppercase tracking-wider`}>
                            Venture Software Product
                          </span>
                          <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'} font-mono`}>
                            Phase {proj.currentPhase || 1} · {proj.status || 'validating'}
                          </span>
                        </div>
                        <p className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          {proj.productName || 'New Venture'}{' '}
                          {proj.productTagline && (
                            <span className={`${isLight ? 'text-slate-500' : 'text-slate-400'} font-normal`}>
                              — {decodeText(proj.productTagline)}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Middle: Participation Status Card */}
                    <div className={`w-full lg:w-80 xl:w-[340px] shrink-0 p-3.5 rounded-xl border transition-all space-y-2.5 ${
                      isLight
                        ? 'bg-slate-50/80 border-slate-200/80 shadow-2xs'
                        : 'bg-white/[0.02] border-white/[0.08]'
                    }`}>
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${
                          isLight ? 'text-slate-500' : 'text-slate-400'
                        }`}>
                          Participation Track
                        </span>
                        {isCoBuilder ? (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider whitespace-nowrap shrink-0 border ${
                            isLight
                              ? 'bg-slate-900 text-white border-slate-900'
                              : 'bg-white text-slate-950 border-white'
                          }`}>
                            <Zap className={`w-3 h-3 shrink-0 ${isLight ? 'text-amber-400 fill-amber-400' : 'text-slate-950 fill-slate-950'}`} />
                            <span>Co-Builder (${projPrice} Paid)</span>
                          </span>
                        ) : isDeclined ? (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider whitespace-nowrap shrink-0 border ${
                            isLight ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          }`}>
                            <ShieldCheck className="w-3 h-3 text-purple-600 dark:text-purple-400 shrink-0" />
                            <span>Studio-Managed</span>
                          </span>
                        ) : (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider whitespace-nowrap shrink-0 border ${
                            isLight ? 'bg-slate-200/80 text-slate-700 border border-slate-300/80' : 'bg-white/[0.08] text-slate-300 border border-white/[0.1]'
                          }`}>
                            <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                            <span>Choice Pending</span>
                          </span>
                        )}
                      </div>

                      {/* Status Details */}
                      {isCoBuilder ? (
                        <div className="space-y-2 pt-0.5">
                          <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold border ${
                            isLight
                              ? 'bg-white border-slate-200 text-slate-800 shadow-2xs'
                              : 'bg-white/[0.04] border-white/[0.1] text-slate-200'
                          }`}>
                            <Sparkles className={`w-3.5 h-3.5 shrink-0 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
                            <span className="truncate">Phases 1–3 Interactive Execution Unlocked</span>
                          </div>
                          <div className={`space-y-1.5 pt-1.5 border-t ${isLight ? 'border-slate-200/70' : 'border-white/[0.06]'} text-xs`}>
                            <div className="flex items-center justify-between gap-2">
                              <span className={`text-[11px] font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>License:</span>
                              <span className={`font-mono text-[10.5px] font-semibold px-2 py-0.5 rounded tracking-wide border ${
                                isLight
                                  ? 'bg-white text-slate-800 border-slate-200 shadow-2xs'
                                  : 'bg-white/[0.06] text-slate-200 border-white/[0.08]'
                              }`}>
                                {sub.licenseKey || 'FORGE-ACTIVE'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <span className={`text-[11px] font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Payment:</span>
                              <span className={`font-bold text-xs flex items-center gap-1.5 ${
                                isLight ? 'text-emerald-700' : 'text-emerald-400'
                              }`}>
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block shadow-xs"></span>
                                ${projPrice.toFixed(2)} USD
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : isDeclined ? (
                        <div className="space-y-2 pt-0.5">
                          <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold ${
                            isLight
                              ? 'bg-white border border-purple-200/80 text-purple-950 shadow-2xs'
                              : 'bg-black/40 border border-purple-500/30 text-purple-300'
                          }`}>
                            <ShieldCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                            <span className="truncate">Studio-Managed Engineering Track</span>
                          </div>
                          <div className={`flex items-center justify-between text-xs pt-1 border-t ${isLight ? 'border-slate-200/60' : 'border-white/[0.06]'}`}>
                            <span className={`text-[11px] font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Pass Fee:</span>
                            <button
                              type="button"
                              onClick={() => handleOpenCustomPriceModal(proj)}
                              className={`px-2 py-0.5 rounded-lg border text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                                isLight
                                  ? 'bg-slate-100/90 hover:bg-slate-200/90 border-slate-200 text-slate-800'
                                  : 'bg-white/[0.06] hover:bg-white/[0.1] border-white/[0.1] text-slate-200'
                              }`}
                              title="Click to change Co-Builder Pass fee for this creator"
                            >
                              <span className="font-mono">${projPrice} USD</span>
                              <span className="text-[10px] opacity-60 underline decoration-slate-400">Edit</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2 pt-0.5">
                          <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold ${
                            isLight
                              ? 'bg-white border border-slate-200 text-slate-700 shadow-2xs'
                              : 'bg-black/40 border border-white/[0.1] text-slate-300'
                          }`}>
                            <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span className="truncate">Awaiting Track Selection</span>
                          </div>
                          <div className={`flex items-center justify-between text-xs pt-1 border-t ${isLight ? 'border-slate-200/60' : 'border-white/[0.06]'}`}>
                            <span className={`text-[11px] font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Pass Fee:</span>
                            <button
                              type="button"
                              onClick={() => handleOpenCustomPriceModal(proj)}
                              className={`px-2 py-0.5 rounded-lg border text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                                isLight
                                  ? 'bg-slate-100/90 hover:bg-slate-200/90 border-slate-200 text-slate-800'
                                  : 'bg-white/[0.06] hover:bg-white/[0.1] border-white/[0.1] text-slate-200'
                              }`}
                              title="Click to change Co-Builder Pass fee for this creator"
                            >
                              <span className="font-mono">${projPrice} USD</span>
                              <span className="text-[10px] opacity-60 underline decoration-slate-400">Edit</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right: Streamlined Action Controls (Quick actions + Ellipsis modal trigger) */}
                    <div className="flex items-center gap-2 shrink-0 self-start lg:self-center">
                      {/* Copy Workspace URL */}
                      <button
                        type="button"
                        onClick={() => handleCopyUrl(proj)}
                        className={`h-9 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs hover:shadow-xs active:scale-95 ${
                          isLight
                            ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                            : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-slate-300 hover:text-white'
                        }`}
                        title="Copy Workspace URL"
                      >
                        {copiedId === proj.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-emerald-600 font-bold">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-500" />
                            <span className="hidden sm:inline">Copy URL</span>
                          </>
                        )}
                      </button>

                      {/* Live Portal Preview */}
                      <a
                        href={workspaceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={`h-9 px-3 rounded-xl border text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-2xs hover:shadow-xs active:scale-95 ${
                          isLight
                            ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900'
                            : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-slate-300 hover:text-white'
                        }`}
                        title="Preview Portal View in New Tab"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span className="hidden sm:inline">Portal</span>
                        <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                      </a>

                      {/* Ellipsis Button: Opens Modal with All Actions */}
                      <button
                        type="button"
                        onClick={() => setActionModalProject(proj)}
                        className={`h-9 px-3.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs hover:shadow-sm active:scale-95 ${
                          isLight
                            ? 'bg-slate-900 hover:bg-slate-800 text-white border-slate-900 shadow-slate-900/10'
                            : 'bg-white hover:bg-slate-100 text-slate-950 border-white shadow-white/10'
                        }`}
                        title="Open Venture Actions Menu"
                      >
                        <MoreHorizontal className="w-4 h-4 stroke-[2.5]" />
                        <span className="hidden sm:inline">Actions</span>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* ── VENTURE ACTIONS MODAL (ELLIPSIS MENU - NEVER CLIPPED BY TABLE) ── */}
      {actionModalProject && (
        <div
          className="fixed inset-0 z-[9999] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActionModalProject(null)
          }}
        >
          <div
            className={`relative w-full max-w-lg rounded-3xl ${
              isLight ? 'bg-white border-slate-200 text-slate-900 shadow-2xl shadow-slate-900/15' : 'bg-[#0f131c] border-white/[0.12] text-white shadow-2xl'
            } border p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150 my-auto`}
          >
            {/* Header: Title, Creator & Close */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3 min-w-0">
                {actionModalProject.creatorAvatar ? (
                  <img
                    src={actionModalProject.creatorAvatar}
                    alt=""
                    className="w-11 h-11 rounded-2xl object-cover border border-slate-200 shadow-2xs shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className={`w-11 h-11 rounded-2xl ${isLight ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-amber-500/20 text-white border-white/10'} border flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs`}>
                    {(actionModalProject.creatorName || actionModalProject.creatorHandle || 'C').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className={`text-base font-black ${isLight ? 'text-slate-900' : 'text-white'} truncate`}>
                      {actionModalProject.productName || 'Venture Workspace'}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold">
                      50/50 Equity
                    </span>
                  </div>
                  <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'} truncate mt-0.5`}>
                    Partner: <strong className={isLight ? 'text-slate-800' : 'text-slate-200'}>{actionModalProject.creatorName || 'Creator'}</strong>{' '}
                    <span className="font-mono text-emerald-700">({actionModalProject.creatorHandle || '@creator'})</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActionModalProject(null)}
                className={`p-2 rounded-xl ${
                  isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-600' : 'bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 hover:text-white'
                } transition-colors cursor-pointer shrink-0`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current Track Snapshot Bar */}
            <div className={`p-3 rounded-2xl ${isLight ? 'bg-slate-50 border-slate-200/80' : 'bg-white/[0.03] border-white/[0.08]'} border flex items-center justify-between text-xs`}>
              <span className={`font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Current Track:</span>
              {(actionModalProject.isDIY || actionModalProject.diySubscription?.active) ? (
                <span className="px-2.5 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-xs">
                  <Zap className="w-3 h-3 fill-slate-950" />
                  Track 1: Co-Builder (${getProjectPassPrice(actionModalProject)} Paid)
                </span>
              ) : actionModalProject.diyOfferStatus === 'declined' ? (
                <span className={`px-2.5 py-1 rounded-full ${isLight ? 'bg-purple-100 text-purple-800 border-purple-300' : 'bg-purple-500/20 text-purple-300'} border font-bold text-[10px] uppercase tracking-wider`}>
                  Track 2: Studio-Managed (50/50)
                </span>
              ) : (
                <span className={`px-2.5 py-1 rounded-full ${isLight ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-amber-500/20 text-amber-300'} border font-bold text-[10px] uppercase tracking-wider`}>
                  Awaiting Track Choice
                </span>
              )}
            </div>

            {/* Action Buttons List */}
            <div className="space-y-2 pt-1">
              {/* Dynamic Pass Fee Setting */}
              <button
                type="button"
                onClick={() => {
                  const p = actionModalProject
                  setActionModalProject(null)
                  handleOpenCustomPriceModal(p)
                }}
                className={`w-full p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-left transition-all active:scale-[0.99] cursor-pointer shadow-2xs hover:shadow-xs ${
                  isLight ? 'bg-slate-50 hover:bg-slate-100/80 border-slate-200 text-slate-900' : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.1] text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isLight ? 'bg-slate-200 text-slate-800' : 'bg-white/[0.08] text-white'
                  }`}>
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold flex items-center gap-1.5">
                      <span>Change Pass Fee</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                        isLight ? 'bg-slate-200 text-slate-800' : 'bg-white/[0.1] text-slate-200'
                      }`}>${getProjectPassPrice(actionModalProject)} USD</span>
                    </div>
                    <div className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      Set a custom Co-Builder Pass price for this creator
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              {/* Quick Mark Paid / Switch Track */}
              {!(actionModalProject.isDIY || actionModalProject.diySubscription?.active || actionModalProject.diyOfferStatus === 'paid' || actionModalProject.diyOfferStatus === 'accepted') ? (
                <button
                  type="button"
                  onClick={() => {
                    const p = actionModalProject
                    setActionModalProject(null)
                    handleMarkAsPaidCoBuilder(p)
                  }}
                  className={`w-full p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-left transition-all active:scale-[0.99] cursor-pointer shadow-2xs hover:shadow-xs ${
                    isLight ? 'bg-emerald-50/70 hover:bg-emerald-100/70 border-emerald-200 text-slate-900' : 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                      <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-xs font-bold flex items-center gap-1.5">
                        <span>Mark Paid as Co-Builder</span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-950 text-[10px] font-black">${getProjectPassPrice(actionModalProject)} USD</span>
                      </div>
                      <div className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        Unlock interactive workspace access immediately
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-emerald-500" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const p = actionModalProject
                    setActionModalProject(null)
                    handleSwitchToStudioManaged(p)
                  }}
                  className={`w-full p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-left transition-all active:scale-[0.99] cursor-pointer shadow-2xs hover:shadow-xs ${
                    isLight ? 'bg-purple-50/70 hover:bg-purple-100/70 border-purple-200 text-slate-900' : 'bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/30 text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">Switch to Studio-Managed</div>
                      <div className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        Studio engineering team completes MVP builds (50/50 Equity)
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-purple-500" />
                </button>
              )}
              {/* 1. Send Follow-Up Button: Only visible when creator has NOT paid yet. Once paid, it is automatically removed! */}
              {!(actionModalProject.isDIY || actionModalProject.diySubscription?.active || actionModalProject.diyOfferStatus === 'paid' || actionModalProject.diyOfferStatus === 'accepted') && (
                <button
                  type="button"
                  onClick={() => {
                    const p = actionModalProject
                    setActionModalProject(null)
                    handleOpenEmailModal(p, 'followup')
                  }}
                  className={`w-full p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-left transition-all active:scale-[0.99] cursor-pointer shadow-2xs hover:shadow-xs ${
                    isLight ? 'bg-white hover:bg-slate-50 border-slate-200 text-slate-900' : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/[0.08] text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4 text-amber-500" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">Send Follow-Up</div>
                      <div className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        Dispatch personalized email to {actionModalProject.creatorEmail || 'creator'}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              )}

              {/* 2. Copy Workspace URL Button */}
              <button
                type="button"
                onClick={() => handleCopyUrl(actionModalProject)}
                className={`w-full p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-left transition-all active:scale-[0.99] cursor-pointer shadow-2xs hover:shadow-xs ${
                  isLight ? 'bg-white hover:bg-slate-50 border-slate-200 text-slate-900' : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/[0.08] text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                    <Copy className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">Copy Workspace URL</div>
                    <div className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      Copy direct portal authentication URL to clipboard
                    </div>
                  </div>
                </div>
                {copiedId === actionModalProject.id ? (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Copied!
                  </span>
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {/* 3. Live Portal Preview Link */}
              <a
                href={getCreatorWorkspaceUrl(actionModalProject)}
                target="_blank"
                rel="noreferrer"
                className={`w-full p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-left transition-all active:scale-[0.99] cursor-pointer shadow-2xs hover:shadow-xs ${
                  isLight ? 'bg-white hover:bg-slate-50 border-slate-200 text-slate-900' : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/[0.08] text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center shrink-0">
                    <Eye className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">Preview Portal View</div>
                    <div className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      Open partner workspace view in a new browser tab
                    </div>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-400" />
              </a>

              {/* 5. Delete Venture Button (Danger Zone) */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    const p = actionModalProject
                    setActionModalProject(null)
                    handleDeleteProject(p)
                  }}
                  className={`w-full p-3 rounded-2xl border flex items-center justify-between gap-3 text-left transition-all active:scale-[0.99] cursor-pointer ${
                    isLight ? 'bg-rose-50/80 hover:bg-rose-100 border-rose-200 text-rose-700' : 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30 text-rose-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-600 flex items-center justify-center shrink-0">
                      <Trash2 className="w-4 h-4 text-rose-600" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">Delete Venture</div>
                      <div className={`text-[11px] ${isLight ? 'text-rose-600/80' : 'text-rose-400/80'}`}>Permanently remove venture from Section 2</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-200/60 text-rose-800">Delete</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Real-Time Direct Email Dispatch Modal */}
      {emailModalProject && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className={`w-full max-w-2xl rounded-3xl ${isLight ? 'bg-white border-slate-200 text-slate-900 shadow-2xl' : 'bg-[#0f131c] border-white/[0.12] text-white shadow-2xl'} border p-6 sm:p-8 space-y-5 relative`}>
            <button
              onClick={() => setEmailModalProject(null)}
              className={`absolute top-5 right-5 p-2 rounded-xl ${isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-600' : 'bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 hover:text-white'} transition-colors cursor-pointer`}
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <span className={`px-2.5 py-0.5 rounded-full ${isLight ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-amber-400/20 text-amber-300 border-amber-400/30'} border text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1`}>
                <Send className="w-3 h-3" />
                Real-Time Direct Email Dispatch
              </span>
              <h2 className={`text-lg font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Send Follow-up to {emailModalProject.creatorName || emailModalProject.creatorHandle}
              </h2>
              <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Dispatches immediately from the studio SMTP server to <strong>{emailModalProject.creatorEmail || 'creator email'}</strong>.
              </p>
            </div>

            {/* Quick Templates */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'} font-bold uppercase tracking-wider`}>Templates:</span>
              <button
                type="button"
                onClick={() => handleOpenEmailModal(emailModalProject, 'followup')}
                className={`px-2.5 py-1 rounded-lg ${isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-white/[0.05] hover:bg-white/[0.1] text-slate-300'} text-[11px] font-medium transition-colors cursor-pointer`}
              >
                Track Choice Reminder
              </button>
              <button
                type="button"
                onClick={() => handleOpenEmailModal(emailModalProject, 'invoice')}
                className={`px-2.5 py-1 rounded-lg ${isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-white/[0.05] hover:bg-white/[0.1] text-slate-300'} text-[11px] font-medium transition-colors cursor-pointer`}
              >
                ${getProjectPassPrice(emailModalProject)} Pass Invoice
              </button>
              <button
                type="button"
                onClick={() => handleOpenEmailModal(emailModalProject, 'portal_link')}
                className={`px-2.5 py-1 rounded-lg ${isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-white/[0.05] hover:bg-white/[0.1] text-slate-300'} text-[11px] font-medium transition-colors cursor-pointer`}
              >
                Workspace URL Dispatch
              </button>
            </div>

            {/* Subject Input */}
            <div className="space-y-1.5">
              <label className={`text-[11px] font-bold ${isLight ? 'text-slate-700' : 'text-slate-400'} uppercase tracking-wider block`}>
                Email Subject
              </label>
              <input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl ${isLight ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-amber-500' : 'bg-white/[0.04] border-white/[0.1] text-white placeholder-slate-500 focus:border-amber-400/50'} border text-xs focus:outline-none`}
              />
            </div>

            {/* Body Textarea */}
            <div className="space-y-1.5">
              <label className={`text-[11px] font-bold ${isLight ? 'text-slate-700' : 'text-slate-400'} uppercase tracking-wider block`}>
                Email Message Body
              </label>
              <textarea
                rows={9}
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                className={`w-full p-3.5 rounded-xl ${isLight ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-amber-500 font-sans' : 'bg-white/[0.04] border-white/[0.1] text-slate-200 placeholder-slate-500 focus:border-amber-400/50 font-mono'} border text-xs focus:outline-none leading-relaxed`}
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEmailModalProject(null)}
                className={`px-4 py-2.5 rounded-xl ${isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-white/[0.05] hover:bg-white/[0.1] text-slate-300'} text-xs font-semibold transition-colors cursor-pointer`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendEmail}
                disabled={isSendingEmail || !emailSubject.trim() || !emailBody.trim()}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer disabled:opacity-40 flex items-center gap-2 shadow-sm ${
                  isLight
                    ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/10'
                    : 'bg-white hover:bg-slate-100 text-slate-950 shadow-white/10'
                }`}
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

      {/* ── GLOBAL CO-BUILDER PASS FEE MODAL ── */}
      {showGlobalPriceModal && (
        <div
          className="fixed inset-0 z-[9999] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSavingGlobalPrice) setShowGlobalPriceModal(false)
          }}
        >
          <div
            className={`relative w-full max-w-md rounded-3xl ${
              isLight ? 'bg-white border-slate-200 text-slate-900 shadow-2xl' : 'bg-[#0f131c] border-white/[0.12] text-white shadow-2xl'
            } border p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150 my-auto`}
          >
            {/* Header */}
            <div className={`flex items-start justify-between gap-3 border-b ${isLight ? 'border-slate-100' : 'border-white/[0.08]'} pb-3.5`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
                  isLight
                    ? 'bg-slate-900 text-white border-slate-800 shadow-xs'
                    : 'bg-white/[0.08] text-white border-white/[0.12]'
                }`}>
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-base font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Default Pass Fee
                  </h3>
                  <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Standard Co-Builder Pass price for invitations
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGlobalPriceModal(false)}
                disabled={isSavingGlobalPrice}
                className={`p-2 rounded-xl ${
                  isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800' : 'bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 hover:text-white'
                } transition-colors cursor-pointer shrink-0`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Presets */}
            <div className="space-y-1.5">
              <span className={`text-[10px] font-bold uppercase tracking-wider block ${isLight ? 'text-slate-400' : 'text-slate-400'}`}>
                Quick Presets
              </span>
              <div className="grid grid-cols-6 gap-1.5">
                {[25, 50, 75, 99, 149, 199].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setGlobalPriceInput(amt)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      Number(globalPriceInput) === amt
                        ? isLight
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-white text-slate-950 border-white shadow-sm'
                        : isLight
                        ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300'
                        : 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border-white/[0.08]'
                    }`}
                  >
                    ${amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Numeric Input */}
            <div className="space-y-1.5">
              <label className={`text-[11px] font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'} uppercase tracking-wider block`}>
                Pass Fee Amount (USD)
              </label>
              <div className={`relative flex items-center rounded-xl border transition-all ${
                isLight
                  ? 'bg-white border-slate-200 hover:border-slate-300 focus-within:border-slate-900 focus-within:ring-2 focus-within:ring-slate-900/5'
                  : 'bg-white/[0.03] border-white/[0.1] hover:border-white/[0.16] focus-within:border-white focus-within:ring-2 focus-within:ring-white/10'
              }`}>
                <span className={`pl-3.5 text-base font-bold select-none ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>$</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={globalPriceInput}
                  onChange={(e) => setGlobalPriceInput(e.target.value)}
                  className={`w-full py-2.5 px-2 bg-transparent text-base font-black font-mono outline-none ${
                    isLight ? 'text-slate-900 placeholder:text-slate-400' : 'text-white placeholder:text-slate-500'
                  }`}
                  placeholder="50"
                />
                <div className="pr-3 shrink-0">
                  <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md ${
                    isLight ? 'bg-slate-100 text-slate-600 border border-slate-200/80' : 'bg-white/[0.06] text-slate-300 border border-white/[0.08]'
                  }`}>
                    USD
                  </span>
                </div>
              </div>
            </div>

            {/* Sync Checkbox */}
            <label className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer select-none transition-all ${
              updatePendingWithGlobal
                ? isLight
                  ? 'bg-slate-50/90 border-slate-300/90'
                  : 'bg-white/[0.04] border-white/[0.14]'
                : isLight
                ? 'bg-white border-slate-200/80 hover:bg-slate-50/60'
                : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]'
            }`}>
              <input
                type="checkbox"
                checked={updatePendingWithGlobal}
                onChange={(e) => setUpdatePendingWithGlobal(e.target.checked)}
                className="sr-only"
              />
              <div className={`w-4 h-4 mt-0.5 rounded-md flex items-center justify-center shrink-0 border transition-all ${
                updatePendingWithGlobal
                  ? isLight
                    ? 'bg-slate-900 border-slate-900 text-white shadow-2xs'
                    : 'bg-white border-white text-slate-950 shadow-2xs'
                  : isLight
                  ? 'bg-white border-slate-300'
                  : 'bg-white/[0.06] border-white/[0.2]'
              }`}>
                {updatePendingWithGlobal && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
              <div className="text-xs space-y-0.5">
                <span className={`font-bold block ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                  Update all pending ventures to this fee
                </span>
                <span className={`text-[11px] block leading-tight ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Syncs this new fee across pending creator offers
                </span>
              </div>
            </label>

            {/* Modal Actions */}
            <div className={`flex items-center justify-end gap-2.5 pt-3 border-t ${isLight ? 'border-slate-100' : 'border-white/[0.08]'}`}>
              <button
                type="button"
                onClick={() => setShowGlobalPriceModal(false)}
                disabled={isSavingGlobalPrice}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    : 'bg-white/[0.06] hover:bg-white/[0.1] text-slate-300'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveGlobalPrice}
                disabled={isSavingGlobalPrice || !globalPriceInput || Number(globalPriceInput) < 0}
                className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-sm hover:shadow flex items-center gap-1.5 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${
                  isLight
                    ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/10'
                    : 'bg-white hover:bg-slate-100 text-slate-950 shadow-white/10'
                }`}
              >
                {isSavingGlobalPrice ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Save Pass Fee</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PER-CREATOR CUSTOM PASS FEE MODAL ── */}
      {customPriceModalProject && (
        <div
          className="fixed inset-0 z-[9999] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSavingCustomPrice) setCustomPriceModalProject(null)
          }}
        >
          <div
            className={`relative w-full max-w-md rounded-3xl ${
              isLight ? 'bg-white border-slate-200 text-slate-900 shadow-2xl' : 'bg-[#0f131c] border-white/[0.12] text-white shadow-2xl'
            } border p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150 my-auto`}
          >
            {/* Header */}
            <div className={`flex items-start justify-between gap-3 border-b ${isLight ? 'border-slate-100' : 'border-white/[0.08]'} pb-3.5`}>
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
                  isLight
                    ? 'bg-slate-900 text-white border-slate-800 shadow-xs'
                    : 'bg-white/[0.08] text-white border-white/[0.12]'
                }`}>
                  <DollarSign className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className={`text-base font-black ${isLight ? 'text-slate-900' : 'text-white'} truncate`}>
                    Creator Pass Fee
                  </h3>
                  <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'} truncate`}>
                    {customPriceModalProject.creatorName || customPriceModalProject.creatorHandle || 'Creator'} • {customPriceModalProject.productName || 'Venture'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCustomPriceModalProject(null)}
                disabled={isSavingCustomPrice}
                className={`p-2 rounded-xl ${
                  isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800' : 'bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 hover:text-white'
                } transition-colors cursor-pointer shrink-0`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Presets */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-slate-400'}`}>
                  Quick Presets
                </span>
                <button
                  type="button"
                  onClick={() => setCustomPriceInput(defaultPassPrice)}
                  className={`text-[10px] font-bold cursor-pointer transition-colors ${
                    isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                  } underline underline-offset-2`}
                >
                  Reset to Default (${defaultPassPrice})
                </button>
              </div>
              <div className="grid grid-cols-6 gap-1.5">
                {[25, 50, 75, 99, 149, 199].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setCustomPriceInput(amt)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      Number(customPriceInput) === amt
                        ? isLight
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-white text-slate-950 border-white shadow-sm'
                        : isLight
                        ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300'
                        : 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border-white/[0.08]'
                    }`}
                  >
                    ${amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Numeric Input */}
            <div className="space-y-1.5">
              <label className={`text-[11px] font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'} uppercase tracking-wider block`}>
                Custom Fee For This Creator (USD)
              </label>
              <div className={`relative flex items-center rounded-xl border transition-all ${
                isLight
                  ? 'bg-white border-slate-200 hover:border-slate-300 focus-within:border-slate-900 focus-within:ring-2 focus-within:ring-slate-900/5'
                  : 'bg-white/[0.03] border-white/[0.1] hover:border-white/[0.16] focus-within:border-white focus-within:ring-2 focus-within:ring-white/10'
              }`}>
                <span className={`pl-3.5 text-base font-bold select-none ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>$</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={customPriceInput}
                  onChange={(e) => setCustomPriceInput(e.target.value)}
                  className={`w-full py-2.5 px-2 bg-transparent text-base font-black font-mono outline-none ${
                    isLight ? 'text-slate-900 placeholder:text-slate-400' : 'text-white placeholder:text-slate-500'
                  }`}
                  placeholder="50"
                />
                <div className="pr-3 shrink-0">
                  <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md ${
                    isLight ? 'bg-slate-100 text-slate-600 border border-slate-200/80' : 'bg-white/[0.06] text-slate-300 border border-white/[0.08]'
                  }`}>
                    USD
                  </span>
                </div>
              </div>
              <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'} pt-0.5`}>
                Applied across this creator's invoice, emails, and unlock portal.
              </p>
            </div>

            {/* Modal Actions */}
            <div className={`flex items-center justify-end gap-2.5 pt-3 border-t ${isLight ? 'border-slate-100' : 'border-white/[0.08]'}`}>
              <button
                type="button"
                onClick={() => setCustomPriceModalProject(null)}
                disabled={isSavingCustomPrice}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    : 'bg-white/[0.06] hover:bg-white/[0.1] text-slate-300'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCustomPrice}
                disabled={isSavingCustomPrice || !customPriceInput || Number(customPriceInput) < 0}
                className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-sm hover:shadow flex items-center gap-1.5 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${
                  isLight
                    ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/10'
                    : 'bg-white hover:bg-slate-100 text-slate-950 shadow-white/10'
                }`}
              >
                {isSavingCustomPrice ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Apply Fee</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual / Operator Checkout Simulator Modal */}
      {diyModalProject && (
        <DIYSubscriptionModal
          isOpen={Boolean(diyModalProject)}
          project={diyModalProject}
          onClose={() => setDiyModalProject(null)}
          onUnlockSuccess={() => {
            setDiyModalProject(null)
            loadData(true)
          }}
        />
      )}

      {/* Global Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl ${isLight ? 'bg-white border-slate-200 shadow-xl' : 'bg-[#0f131c] border-white/[0.12] shadow-2xl'} border`}>
          {toast.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          )}
          <div className="min-w-0 pr-2">
            <p className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{toast.title}</p>
            <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{toast.message}</p>
          </div>
        </div>
      )}
    </div>
  )
}
