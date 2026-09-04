import React, { useState, useMemo } from 'react'
import {
  ShieldAlert,
  Clock,
  UserX,
  RefreshCw,
  AlertTriangle,
  Search,
  Filter,
  CheckCircle2,
  Mail,
  Send,
  ExternalLink,
  ChevronRight,
  Sparkles,
  X,
  ArrowRight,
  TrendingDown,
  Info,
  Layers,
  MessageSquare,
  Copy,
  Check,
  Edit2,
  Plus,
  Radio,
  Zap,
  CheckCheck,
  Target,
  ShieldCheck,
} from 'lucide-react'

export default function AdminPipelineLookup({
  isOpen = false,
  isPage = false,
  onClose,
  creators: rawCreators = [],
  realThreads: rawThreads = [],
  pitchSentMap = {},
  answerSentMap = {},
  persuasionSentMap = {},
  onSelectCreator,
  onTriggerFollowUp,
  onForceLaunchProject,
  onSyncImap,
  isSyncing = false,
  onNotify,
}) {
  const creators = useMemo(() => {
    if (Array.isArray(rawCreators)) return rawCreators;
    if (rawCreators && Array.isArray(rawCreators.data)) return rawCreators.data;
    if (rawCreators && Array.isArray(rawCreators.creators)) return rawCreators.creators;
    return [];
  }, [rawCreators]);

  const realThreads = useMemo(() => {
    if (Array.isArray(rawThreads)) return rawThreads;
    if (rawThreads && Array.isArray(rawThreads.data)) return rawThreads.data;
    if (rawThreads && Array.isArray(rawThreads.threads)) return rawThreads.threads;
    return [];
  }, [rawThreads]);

  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [platformFilter, setPlatformFilter] = useState('all')
  const [inspectingCreator, setInspectingCreator] = useState(null)
  const [actionSuccessMessage, setActionSuccessMessage] = useState('')
  const [copiedEmailId, setCopiedEmailId] = useState(null)
  const [editingEmailId, setEditingEmailId] = useState(null)
  const [inlineEmailValue, setInlineEmailValue] = useState('')

  // Copy helper
  const handleCopyEmail = (e, email, id) => {
    e.stopPropagation()
    if (!email) return
    navigator.clipboard.writeText(email)
    setCopiedEmailId(id)
    setTimeout(() => setCopiedEmailId(null), 2000)
    onNotify?.('info', 'Email Copied', `Copied ${email} to clipboard.`, 2500)
  }

  // Quick Inline Save Email
  const handleSaveInlineEmail = async (creatorId) => {
    const trimmed = inlineEmailValue.trim()
    if (!trimmed || !trimmed.includes('@')) {
      onNotify?.('error', 'Invalid Email', 'Please enter a valid email address with an @ sign.')
      return
    }

    try {
      const { updateCreatorDetails } = await import('../../services/opsApi')
      await updateCreatorDetails(creatorId, { email_public: trimmed })
      
      // Update local creators storage if possible
      try {
        const raw = localStorage.getItem('forge_launch_discovered_creators')
        if (raw) {
          const parsed = JSON.parse(raw)
          const stored = Array.isArray(parsed) ? parsed : (Array.isArray(parsed?.data) ? parsed.data : [])
          if (stored.length > 0) {
            const updated = stored.map((c) => (c.id === creatorId ? { ...c, email: trimmed, email_public: trimmed } : c))
            localStorage.setItem('forge_launch_discovered_creators', JSON.stringify(updated))
          }
        }
      } catch (err) {}

      // Update creator in-memory
      const target = creators.find((c) => c.id === creatorId)
      if (target) {
        target.email = trimmed
        target.email_public = trimmed
      }

      setEditingEmailId(null)
      setInlineEmailValue('')
      onNotify?.('success', 'Email Updated', `Successfully assigned ${trimmed} to creator.`, 4000)
    } catch (err) {
      onNotify?.('warning', 'Saved Locally', `Email updated in current session: ${trimmed}`, 3500)
      setEditingEmailId(null)
    }
  }

  const [hunterLoadingId, setHunterLoadingId] = useState(null)
  const [hunterStatusMap, setHunterStatusMap] = useState({})

  const handleHunterFindEmail = async (creator, e) => {
    if (e) e.stopPropagation()
    setHunterLoadingId(creator.id)
    try {
      const { findEmailWithHunter } = await import('../../services/opsApi')
      const res = await findEmailWithHunter({
        creator_id: creator.id,
        full_name: creator.display_name || creator.name,
        auto_save: true,
      })
      if (res && res.success && res.email) {
        creator.email = res.email
        creator.email_public = res.email
        setHunterStatusMap(prev => ({ ...prev, [creator.id]: res }))
        onNotify?.('success', 'Hunter.io Email Found!', `Found: ${res.email} (${res.score}% confidence)`, 4500)
      } else {
        onNotify?.('warning', 'Hunter.io Search', res?.error || 'No business email found on Hunter.io.', 3500)
      }
    } catch (err) {
      onNotify?.('error', 'Hunter.io Error', err.message || 'Failed to search Hunter.', 3500)
    } finally {
      setHunterLoadingId(null)
    }
  }

  const handleHunterVerifyEmail = async (creator, e) => {
    if (e) e.stopPropagation()
    const email = (creator.email || creator.email_public || '').trim()
    if (!email) return
    setHunterLoadingId(creator.id)
    try {
      const { verifyEmailWithHunter } = await import('../../services/opsApi')
      const res = await verifyEmailWithHunter({ email, creator_id: creator.id, auto_save: true })
      if (res && res.success) {
        setHunterStatusMap(prev => ({ ...prev, [creator.id]: res }))
        onNotify?.(
          res.deliverable ? 'success' : 'warning',
          `Hunter.io: ${res.deliverable ? 'Deliverable ✓' : 'Risky'}`,
          `Score: ${res.score}% | Status: ${res.status} | SMTP: ${res.smtp_check ? 'Passed' : 'Failed'}`,
          4500
        )
      }
    } catch (err) {
      onNotify?.('error', 'Hunter Verification Error', err.message, 3500)
    } finally {
      setHunterLoadingId(null)
    }
  }

  // Helper to retrieve thread messages for a creator
  const getCreatorMessages = (c) => {
    if (!c) return []
    const cHandle = (c.handle || '').toLowerCase().replace(/^@/, '').trim()
    const cEmail = (c.email || c.email_public || '').toLowerCase().trim()
    const cId = c.id

    const matchingThreads = realThreads.filter((t) => {
      if (t.creator_id === cId) return true
      if (cHandle && t.creator_handle?.toLowerCase().replace(/^@/, '').trim() === cHandle) return true
      if (cEmail && t.creator_email?.toLowerCase().trim() === cEmail) return true
      return false
    })

    return matchingThreads
      .flatMap((t) => t.replies || [])
      .filter((r) => r.body && r.body.trim())
      .sort((a, b) => new Date(b.received_at || 0) - new Date(a.received_at || 0))
  }

  // Evaluate every creator and categorize their current pipeline health / error state
  const categorizedCreators = useMemo(() => {
    return creators.map((c) => {
      const msgs = getCreatorMessages(c)
      const latestMsg = msgs[0] || null
      const email = (c.email || c.email_public || '').trim()
      const hasEmail = Boolean(email && email.includes('@'))
      const pitchSent = pitchSentMap[c.id]
      const answerSent = answerSentMap[c.id]
      const persuasionSent = persuasionSentMap[c.id]

      const pTime = pitchSent?.sentTimestamp || (pitchSent?.sentAt ? new Date(pitchSent.sentAt).getTime() : 0)
      const aTime = answerSent?.sentTimestamp || (answerSent?.sentAt ? new Date(answerSent.sentAt).getTime() : 0)
      const perTime = persuasionSent?.sentTimestamp || (persuasionSent?.sentAt ? new Date(persuasionSent.sentAt).getTime() : 0)
      const latestOutboundTime = Math.max(pTime, aTime, perTime)

      const bodyLower = latestMsg ? (latestMsg.body || '').toLowerCase() : ''

      // 1. Missing or Invalid Email Error
      if (!hasEmail) {
        return {
          creator: c,
          category: 'errors',
          statusLabel: 'Missing Email',
          badgeColor: 'rose',
          statusType: 'error',
          diagnostic: 'No verified email found. Outreach paused until email is added.',
          lastOutbound: null,
          latestReply: null,
          canFixEmail: true,
          severity: 'high',
        }
      }

      // 2. Uninterested / Opted Out / Rejected
      const isUnsubscribed =
        c.status === 'rejected' ||
        c.status === 'declined' ||
        bodyLower.includes('unsubscribe') ||
        bodyLower.includes('remove me') ||
        bodyLower.includes('stop emailing') ||
        bodyLower.includes('stop email') ||
        bodyLower.includes('never contact') ||
        bodyLower.includes('dont contact') ||
        bodyLower.includes("don't contact") ||
        bodyLower.includes('not interested') ||
        bodyLower.includes('no thanks') ||
        bodyLower.includes('pass for now')

      if (isUnsubscribed) {
        return {
          creator: c,
          category: 'uninterested',
          statusLabel: 'Declined',
          badgeColor: 'rose',
          statusType: 'declined',
          diagnostic: latestMsg
            ? `Declined: "${latestMsg.body.slice(0, 75)}..."`
            : 'Creator declined or opted out.',
          lastOutbound: pitchSent ? 'Opportunity Pitch' : 'Initial Outreach',
          latestReply: latestMsg,
          canFixEmail: false,
          severity: 'medium',
        }
      }

      // 3. Questions / Need Details (Awaiting Admin Dialog)
      const isAskingQuestions =
        bodyLower.includes('further explanation') ||
        bodyLower.includes('further explaination') ||
        bodyLower.includes('more details') ||
        bodyLower.includes('need more details') ||
        bodyLower.includes('how does') ||
        bodyLower.includes('revenue split') ||
        bodyLower.includes('what tech') ||
        bodyLower.includes('?')

      if (isAskingQuestions && !answerSent) {
        return {
          creator: c,
          category: 'awaiting',
          statusLabel: 'Question Received',
          badgeColor: 'blue',
          statusType: 'question',
          diagnostic: `Creator asked: "${latestMsg.body.slice(0, 75)}..."`,
          lastOutbound: pitchSent ? 'Opportunity Pitch' : 'Initial Outreach',
          latestReply: latestMsg,
          canAnswerQuestion: true,
          severity: 'medium',
        }
      }

      // 4. Stalled / Follow-up Non-Response (Sent > 24 hours ago, zero response)
      const now = Date.now()
      const hoursSinceOutbound = latestOutboundTime > 0 ? (now - latestOutboundTime) / (1000 * 60 * 60) : 0

      if (latestOutboundTime > 0 && msgs.length === 0 && hoursSinceOutbound >= 24) {
        return {
          creator: c,
          category: 'stalled',
          statusLabel: `Stalled (${Math.round(hoursSinceOutbound)}h)`,
          badgeColor: 'amber',
          statusType: 'stalled',
          diagnostic: `Outreach sent ${Math.round(hoursSinceOutbound)}h ago with no reply. Ready for follow-up nudge.`,
          lastOutbound: pitchSent ? 'Opportunity Pitch' : 'Initial Outreach',
          latestReply: null,
          canFollowUp: true,
          severity: 'medium',
        }
      }

      // 5. Awaiting Replies (Normal waiting queue)
      if (latestOutboundTime > 0 && msgs.length === 0) {
        return {
          creator: c,
          category: 'awaiting',
          statusLabel: 'Awaiting Reply',
          badgeColor: 'purple',
          statusType: 'awaiting',
          diagnostic: `Outreach sent (${pitchSent?.time || 'recently'}). Listening for response.`,
          lastOutbound: pitchSent ? 'Opportunity Pitch' : 'Initial Outreach',
          latestReply: null,
          canFollowUp: false,
          severity: 'low',
        }
      }

      // 6. General Active or Qualified
      return {
        creator: c,
        category: 'active',
        statusLabel: 'Active',
        badgeColor: 'emerald',
        statusType: 'active',
        diagnostic: 'Lead is active in the outreach pipeline.',
        lastOutbound: pitchSent ? 'Opportunity Pitch' : 'Initial Outreach',
        latestReply: latestMsg,
        severity: 'low',
      }
    })
  }, [creators, realThreads, pitchSentMap, answerSentMap, persuasionSentMap])

  // Counts for Segmented Tabs
  const counts = useMemo(() => {
    return {
      all: categorizedCreators.length,
      awaiting: categorizedCreators.filter((i) => i.category === 'awaiting').length,
      uninterested: categorizedCreators.filter((i) => i.category === 'uninterested').length,
      stalled: categorizedCreators.filter((i) => i.category === 'stalled').length,
      errors: categorizedCreators.filter((i) => i.category === 'errors').length,
    }
  }, [categorizedCreators])

  // Filtered List
  const filteredList = useMemo(() => {
    return categorizedCreators.filter((item) => {
      // Tab filter
      if (activeTab !== 'all' && item.category !== activeTab) return false

      // Platform filter (robust, case-insensitive, supporting aliases: ig/instagram, yt/youtube, tt/tiktok, x/twitter)
      if (platformFilter !== 'all') {
        const rawPlat = (
          item.creator.platform ||
          item.creator.channel ||
          item.creator.source ||
          item.creator.profile_url ||
          item.creator.url ||
          ''
        ).toLowerCase().trim()

        let matches = false
        if (platformFilter === 'instagram') {
          matches =
            rawPlat.includes('instagram') ||
            rawPlat.includes('instagr') ||
            rawPlat.includes('ig') ||
            rawPlat.includes('insta') ||
            rawPlat.includes('reels')
        } else if (platformFilter === 'youtube') {
          matches =
            rawPlat.includes('youtube') ||
            rawPlat.includes('youtu.be') ||
            rawPlat.includes('yt') ||
            rawPlat.includes('shorts')
        } else if (platformFilter === 'tiktok') {
          matches =
            rawPlat.includes('tiktok') ||
            rawPlat.includes('tt')
        } else if (platformFilter === 'twitter') {
          matches =
            rawPlat.includes('twitter') ||
            rawPlat.includes('x.com') ||
            rawPlat === 'x' ||
            rawPlat.includes('tweet')
        } else {
          matches = rawPlat.includes(platformFilter.toLowerCase())
        }

        if (!matches) return false
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const name = (item.creator.name || item.creator.display_name || '').toLowerCase()
        const handle = (item.creator.handle || '').toLowerCase()
        const email = (item.creator.email || item.creator.email_public || '').toLowerCase()
        const niche = (item.creator.niche || '').toLowerCase()
        const diag = (item.diagnostic || '').toLowerCase()
        const plat = (item.creator.platform || item.creator.channel || '').toLowerCase()
        return (
          name.includes(q) ||
          handle.includes(q) ||
          email.includes(q) ||
          niche.includes(q) ||
          diag.includes(q) ||
          plat.includes(q)
        )
      }

      return true
    })
  }, [categorizedCreators, activeTab, platformFilter, searchQuery])

  if (!isPage && !isOpen) return null

  // Helpers for platform badges
  const getPlatformBadge = (platform = '') => {
    const p = (platform || '').toLowerCase().trim()
    if (p.includes('youtube') || p.includes('yt')) return { name: 'YouTube', color: 'bg-red-500/15 text-red-400 border-red-500/30' }
    if (p.includes('twitter') || p.includes('x') || p.includes('tweet')) return { name: 'X / Twitter', color: 'bg-sky-500/15 text-sky-400 border-sky-500/30' }
    if (p.includes('instagram') || p.includes('ig') || p.includes('insta')) return { name: 'Instagram', color: 'bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/30' }
    if (p.includes('tiktok') || p.includes('tt')) return { name: 'TikTok', color: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' }
    return { name: platform || 'Social', color: 'bg-slate-500/15 text-slate-400 border-slate-500/30' }
  }

  const dashboardContent = (
    <div className={`relative w-full ${isPage ? 'rounded-3xl min-h-[85vh]' : 'max-w-6xl h-[88vh] rounded-3xl'} flex flex-col bg-[#0b0d13] border border-white/[0.12] shadow-2xl overflow-hidden`}>
        {/* Sleek Command Center Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-white/[0.08] bg-[#10131c]/90 backdrop-blur-md flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500/20 to-purple-500/20 border border-rose-500/30 text-rose-400 flex-shrink-0 shadow-inner">
              <ShieldAlert className="w-4 h-4" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400" />
            </div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-sm font-black text-white tracking-tight flex items-center gap-2">
                Pipeline Intelligence & Exception Dashboard
              </h2>
              <div className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-[11px] text-slate-400 font-mono">
                <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                <span>Live Audit ({creators.length} Leads)</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={onSyncImap}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 text-xs font-bold transition-all cursor-pointer disabled:opacity-50 flex-shrink-0"
              title="Check for incoming creator replies"
            >
              <RefreshCw className={`w-3.5 h-3.5 flex-shrink-0 inline-block origin-center ${isSyncing ? 'animate-spin text-purple-400' : 'text-slate-400'}`} />
              <span className="flex-shrink-0">Sync Replies</span>
            </button>
            {!isPage && onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Action Success Notification Strip */}
        {actionSuccessMessage && (
          <div className="px-6 py-2 bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-300 text-xs font-semibold flex items-center justify-between flex-shrink-0 animate-in fade-in slide-in-from-top-1">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{actionSuccessMessage}</span>
            </div>
            <button onClick={() => setActionSuccessMessage('')} className="text-emerald-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Compact Segmented Control & Search Command Rail */}
        <div className="px-6 py-2.5 border-b border-white/[0.06] bg-[#090b10] flex flex-wrap lg:flex-nowrap items-center justify-between gap-3 flex-shrink-0">
          {/* Segmented Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-none flex-shrink-0">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 border ${
                activeTab === 'all'
                  ? 'bg-purple-500/20 border-purple-500/50 text-white shadow-sm'
                  : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]'
              }`}
            >
              <span>All</span>
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                activeTab === 'all' ? 'bg-purple-500/40 text-purple-200' : 'bg-white/10 text-slate-400'
              }`}>
                {counts.all}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('awaiting')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 border ${
                activeTab === 'awaiting'
                  ? 'bg-purple-500/20 border-purple-500/50 text-purple-200 shadow-sm'
                  : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-purple-400" />
              <span>Awaiting</span>
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                activeTab === 'awaiting' ? 'bg-purple-500/40 text-purple-200' : 'bg-white/10 text-slate-400'
              }`}>
                {counts.awaiting}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('uninterested')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 border ${
                activeTab === 'uninterested'
                  ? 'bg-rose-500/20 border-rose-500/50 text-rose-200 shadow-sm shadow-rose-500/20'
                  : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]'
              }`}
            >
              <UserX className="w-3.5 h-3.5 text-rose-400" />
              <span>Declined</span>
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                activeTab === 'uninterested' ? 'bg-rose-500/40 text-rose-200' : 'bg-white/10 text-slate-400'
              }`}>
                {counts.uninterested}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('stalled')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 border ${
                activeTab === 'stalled'
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-200 shadow-sm shadow-amber-500/20'
                  : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5 text-amber-400" />
              <span>Stalled</span>
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                activeTab === 'stalled' ? 'bg-amber-500/40 text-amber-200' : 'bg-white/10 text-slate-400'
              }`}>
                {counts.stalled}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('errors')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 border ${
                activeTab === 'errors'
                  ? 'bg-rose-500/25 border-rose-500/60 text-rose-200 shadow-sm shadow-rose-500/25'
                  : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>Failed</span>
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                activeTab === 'errors' ? 'bg-rose-500/40 text-rose-200' : 'bg-white/10 text-slate-400'
              }`}>
                {counts.errors}
              </span>
            </button>
          </div>

          {/* Search and Platform Select */}
          <div className="flex items-center gap-2.5 w-full lg:w-auto justify-end">
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/60 focus:bg-white/[0.05] transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <select
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-slate-300 focus:outline-none cursor-pointer hover:bg-white/[0.06] transition-colors"
              >
                <option value="all" className="bg-[#10131c]">All</option>
                <option value="youtube" className="bg-[#10131c]">YouTube</option>
                <option value="instagram" className="bg-[#10131c]">Instagram</option>
                <option value="tiktok" className="bg-[#10131c]">TikTok</option>
              </select>
            </div>
          </div>
        </div>

        {/* Main Body: Creators List with Optional Slide-Over Drawer */}
        <div className="flex-1 min-h-0 flex overflow-hidden">
          {/* High-Height Creators List (THE CENTERPIECE) */}
          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-3.5">
            {filteredList.length === 0 ? (
              <div className="py-20 text-center text-slate-400 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-white">All Monitored Leads Operational</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  No pipeline exceptions or stalled threads found under the "{activeTab}" filter.
                </p>
              </div>
            ) : (
              filteredList.map((item) => {
                const { creator, category, statusLabel, badgeColor, statusType, diagnostic, lastOutbound, latestReply, canFixEmail } = item
                const platformBadge = getPlatformBadge(creator.platform)
                const isSelected = inspectingCreator?.creator?.id === creator.id
                const isEditingThisEmail = editingEmailId === creator.id

                return (
                  <div
                    key={creator.id}
                    className={`group relative p-4 rounded-2xl border transition-all shadow-md flex flex-col gap-3 ${
                      isSelected
                        ? 'bg-[#151926] border-purple-500/60 shadow-sm'
                        : 'bg-[#10131d]/90 hover:bg-[#131724] border-white/[0.08] hover:border-white/[0.16]'
                    }`}
                  >
                    {/* Top Row: Creator Identity + Status Badge + Action Triggers */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Left: Avatar + Names + Status Badge */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative flex-shrink-0">
                          <img
                            src={creator.avatar || creator.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60'}
                            alt=""
                            className="w-10 h-10 rounded-xl object-cover border border-white/10 shadow-sm"
                            onError={(e) => {
                              e.target.style.display = 'none'
                            }}
                          />
                        </div>

                        <div className="min-w-0 space-y-1">
                          {/* Row 1: Creator Name + Handle + Email Contact */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-white text-sm tracking-tight truncate">
                              {creator.name || creator.display_name}
                            </span>
                            <span className="text-xs text-slate-400 font-mono">
                              {creator.handle}
                            </span>

                            {/* Contact Email Chip & Hunter.io Actions */}
                            {creator.email || creator.email_public ? (
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={(e) => handleCopyEmail(e, creator.email || creator.email_public, creator.id)}
                                  className="group/email flex items-center gap-1.5 text-[11px] font-mono px-2 py-0.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/[0.06] transition-colors cursor-pointer"
                                  title="Click to copy email address"
                                >
                                  <Mail className="w-3 h-3 text-purple-400" />
                                  <span>{creator.email || creator.email_public}</span>
                                  {copiedEmailId === creator.id ? (
                                    <Check className="w-3 h-3 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3 h-3 opacity-0 group-hover/email:opacity-100 transition-opacity text-slate-400" />
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleHunterVerifyEmail(creator, e)}
                                  disabled={hunterLoadingId === creator.id}
                                  className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 hover:bg-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
                                  title="Verify deliverability via Hunter.io v2"
                                >
                                  {hunterLoadingId === creator.id ? (
                                    <RefreshCw className="w-2.5 h-2.5 text-emerald-400 animate-spin" />
                                  ) : (
                                    <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
                                  )}
                                  <span>
                                    {hunterStatusMap[creator.id]?.score
                                      ? `${hunterStatusMap[creator.id].score}% Valid`
                                      : 'Verify (Hunter)'}
                                  </span>
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={(e) => handleHunterFindEmail(creator, e)}
                                  disabled={hunterLoadingId === creator.id}
                                  className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg bg-gradient-to-r from-amber-500/15 to-orange-500/15 text-amber-300 border border-amber-500/30 hover:from-amber-500/25 hover:to-orange-500/25 transition-all cursor-pointer disabled:opacity-50"
                                  title="Find corporate email via Hunter.io API"
                                >
                                  {hunterLoadingId === creator.id ? (
                                    <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
                                  ) : (
                                    <Target className="w-3 h-3 text-amber-400" />
                                  )}
                                  <span>Hunter.io Finder</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingEmailId(creator.id)
                                    setInlineEmailValue('')
                                  }}
                                  className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-white/[0.04] text-slate-300 border border-white/[0.08] hover:bg-white/[0.08] transition-all cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>Manual</span>
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Row 2: Status Indicator Pill + Platform + Niche + Community */}
                          <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
                            {/* Status Indicator Pill */}
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border ${
                                badgeColor === 'rose'
                                  ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                                  : badgeColor === 'amber'
                                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                    : badgeColor === 'blue'
                                      ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                                      : badgeColor === 'purple'
                                        ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                                        : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                badgeColor === 'rose' ? 'bg-rose-400' : badgeColor === 'amber' ? 'bg-amber-400' : badgeColor === 'blue' ? 'bg-blue-400' : badgeColor === 'purple' ? 'bg-purple-400' : 'bg-emerald-400'
                              }`} />
                              <span>{statusLabel}</span>
                            </span>

                            <span>•</span>
                            <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold border ${platformBadge.color}`}>
                              {platformBadge.name}
                            </span>
                            <span>•</span>
                            <span className="text-slate-300 font-medium">{creator.niche || 'Technology'}</span>
                            <span>•</span>
                            <span className="text-slate-300 font-semibold">{creator.followerStr || '100k+'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: High-Priority Action Buttons */}
                      <div className="flex items-center gap-2 flex-shrink-0 flex-wrap sm:flex-nowrap">
                        {item.canFollowUp && (
                          <button
                            onClick={() => {
                              if (onTriggerFollowUp) onTriggerFollowUp(creator)
                              const msg = `Follow-up scheduled for ${creator.name || creator.handle}`
                              setActionSuccessMessage(msg)
                              onNotify?.('info', 'Follow-up Scheduled', msg)
                            }}
                            className="px-3 h-8 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95 shadow-sm"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Nudge</span>
                          </button>
                        )}

                        {item.canAnswerQuestion && (
                          <button
                            onClick={() => {
                              if (onSelectCreator) onSelectCreator(creator.id)
                              onClose()
                              onNotify?.('info', 'Ready to Answer', `Switched to dialog view for ${creator.name || creator.handle}.`)
                            }}
                            className="px-3 h-8 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 border border-blue-500/40 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95 shadow-sm"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Answer</span>
                          </button>
                        )}

                        {item.category === 'uninterested' && (
                          <button
                            onClick={() => {
                              if (onSelectCreator) onSelectCreator(creator.id)
                              onClose()
                              onNotify?.('info', 'Persuade', `Ready to send persuasion terms to ${creator.name || creator.handle}.`)
                            }}
                            className="px-3 h-8 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95 shadow-sm"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Persuade</span>
                          </button>
                        )}

                        {onForceLaunchProject && (
                          <button
                            onClick={() => {
                              onForceLaunchProject(creator)
                              const msg = `Launching Project OS for ${creator.name || creator.handle}...`
                              setActionSuccessMessage(msg)
                              onNotify?.('success', 'Project OS Launched', msg)
                            }}
                            className="px-3.5 h-8 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500/40 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95 shadow-sm"
                          >
                            <Layers className="w-3.5 h-3.5" />
                            <span>Launch Project</span>
                          </button>
                        )}

                        <button
                          onClick={() => {
                            if (inspectingCreator?.creator?.id === creator.id) {
                              setInspectingCreator(null)
                            } else {
                              setInspectingCreator(item)
                            }
                          }}
                          className={`px-3 h-8 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap border ${
                            isSelected
                              ? 'bg-purple-500/30 text-purple-200 border-purple-500/50 shadow-sm'
                              : 'bg-white/[0.05] hover:bg-white/[0.1] text-white border-white/[0.08]'
                          }`}
                        >
                          <span>{isSelected ? 'Close' : 'Inspect'}</span>
                          <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {/* Inline Email Fixer (if activated) */}
                    {isEditingThisEmail && (
                      <div className="p-2.5 rounded-xl bg-[#090b10] border border-purple-500/30 flex items-center gap-2 animate-in fade-in">
                        <Mail className="w-4 h-4 text-purple-400 flex-shrink-0" />
                        <input
                          type="email"
                          autoFocus
                          value={inlineEmailValue}
                          onChange={(e) => setInlineEmailValue(e.target.value)}
                          placeholder="Enter verified creator email (e.g. partner@creator.com)..."
                          className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
                        />
                        <button
                          onClick={() => handleSaveInlineEmail(creator.id)}
                          className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold cursor-pointer transition-all"
                        >
                          Save Email
                        </button>
                        <button
                          onClick={() => setEditingEmailId(null)}
                          className="px-2 py-1 text-slate-400 hover:text-white text-xs cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    )}

                    {/* Diagnostic Intelligence Callout */}
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/40 border border-white/[0.04] text-xs text-slate-300">
                      <Zap className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                      <span className="flex-1">{diagnostic}</span>
                    </div>

                    {/* Inbound Reply Message Bubble (if exists) */}
                    {latestReply && (
                      <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-purple-950/20 border border-purple-500/30 text-xs">
                        <MessageSquare className="w-3.5 h-3.5 text-purple-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <span className="font-bold text-purple-300">
                              Creator Reply:
                            </span>
                            <span className="text-[10px] text-purple-400/80 font-mono">
                              {latestReply.received_at ? new Date(latestReply.received_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                            </span>
                          </div>
                          <p className="text-purple-200/90 font-mono text-[11px] italic bg-black/20 p-2 rounded-lg border border-purple-500/15">
                            "{latestReply.body}"
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>

          {/* Slide-Over Inspection Drawer */}
          {inspectingCreator && (
            <div className="w-full sm:w-96 border-l border-white/[0.08] bg-[#0d1017] p-5 flex flex-col gap-4 overflow-y-auto animate-in slide-in-from-right duration-200 flex-shrink-0 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <h3 className="text-sm font-bold text-white">Lead Detail Inspection</h3>
                </div>
                <button
                  onClick={() => setInspectingCreator(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Creator Summary Card */}
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-2">
                <div className="flex items-center gap-3">
                  <img
                    src={inspectingCreator.creator.avatar || inspectingCreator.creator.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60'}
                    alt=""
                    className="w-12 h-12 rounded-xl object-cover border border-white/10"
                  />
                  <div>
                    <h4 className="font-bold text-white text-sm">
                      {inspectingCreator.creator.name || inspectingCreator.creator.display_name}
                    </h4>
                    <p className="text-xs text-slate-400 font-mono">{inspectingCreator.creator.handle}</p>
                    <p className="text-xs text-purple-400 mt-0.5">{inspectingCreator.creator.niche || 'Software & Tech'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.06] text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Followers</span>
                    <span className="text-white font-bold">{inspectingCreator.creator.followerStr || '100k+'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Status</span>
                    <span className="text-emerald-400 font-semibold">{inspectingCreator.statusLabel}</span>
                  </div>
                </div>
              </div>

              {/* Full Email Thread History */}
              <div className="space-y-2 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Thread Audit
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {getCreatorMessages(inspectingCreator.creator).length} messages
                  </span>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {getCreatorMessages(inspectingCreator.creator).length === 0 ? (
                    <div className="p-3 rounded-xl bg-black/20 border border-white/[0.04] text-xs text-slate-500 text-center">
                      No inbound replies logged yet for this thread.
                    </div>
                  ) : (
                    getCreatorMessages(inspectingCreator.creator).map((msg, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-purple-950/20 border border-purple-500/20 text-xs space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-purple-300 font-semibold">
                          <span>{msg.sender || inspectingCreator.creator.handle}</span>
                          <span className="font-mono text-slate-400">
                            {msg.received_at ? new Date(msg.received_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                          </span>
                        </div>
                        <p className="text-slate-200 text-[11px] leading-relaxed">
                          {msg.body}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Direct Jump to Acquisition Step */}
              <div className="pt-3 border-t border-white/[0.08] space-y-2">
                <button
                  onClick={() => {
                    if (onSelectCreator) onSelectCreator(inspectingCreator.creator.id)
                    onClose()
                  }}
                  className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <span>Open Creator in Pipeline</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* High-End Studio Footer */}
        <div className="px-6 py-2.5 border-t border-white/[0.08] bg-[#090b10] flex items-center justify-between text-xs text-slate-400 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
            <span className="text-[11px] sm:text-xs">
              Autonomous sync active with live inbox listener & outreach dispatch.
            </span>
          </div>
          {!isPage && onClose && (
            <button
              onClick={onClose}
              className="px-4 h-7.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-white text-xs font-bold transition-all cursor-pointer whitespace-nowrap active:scale-95"
            >
              Close Dashboard
            </button>
          )}
        </div>
      </div>
  )

  if (isPage) {
    return (
      <div className="w-full animate-in fade-in space-y-6">
        {dashboardContent}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-2xl animate-in fade-in duration-200">
      {dashboardContent}
    </div>
  )
}
