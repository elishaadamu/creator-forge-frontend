import { useState, useEffect, useRef } from 'react'
import {
  Rocket, CheckCircle2, DollarSign, Copy, Check, Video, MessageSquare,
  Users, ExternalLink, Globe, Sparkles, AlertCircle, ShieldCheck, ArrowRight,
  TrendingUp, Award, Calendar, CheckSquare, Eye, Smartphone, Send, FileText,
  CheckCheck, Loader2, MessageCircle
} from 'lucide-react'
import { getFrontendUrl, updateCoLaunchProject, getCoLaunchProject, getThreads } from '../../services/opsApi'
import { updatePageSEO } from '../../utils/seo'
import { CreatorPortalSkeleton } from './Section2Skeletons'

export default function CreatorPortal({ portalId }) {
  const [loading, setLoading] = useState(true)
  const [project, setProject] = useState(() => {
    try {
      const saved = localStorage.getItem('forge_launch_active_project')
      if (saved) return JSON.parse(saved)
    } catch (e) {}
    return null
  })

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

        // If not found by specific ID, fetch the latest active project from DB
        if (!fetched) {
          try {
            const all = await getCoLaunchProjects()
            if (all && Array.isArray(all) && all.length > 0) {
              fetched = all[0]
            }
          } catch (e) {
            console.warn('[CreatorPortal] All projects fetch failed:', e)
          }
        }

        if (isMounted && fetched) {
          setProject(fetched)
          try {
            localStorage.setItem('forge_launch_active_project', JSON.stringify(fetched))
            localStorage.setItem('forge_launch_active_section', 'section2')
          } catch (e) {}
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
    const handleSync = () => {
      try {
        const saved = localStorage.getItem('forge_launch_active_project')
        if (saved) setProject(JSON.parse(saved))
      } catch (e) {}
    }
    window.addEventListener('storage', handleSync)
    window.addEventListener('forge_project_updated', handleSync)
    return () => {
      window.removeEventListener('storage', handleSync)
      window.removeEventListener('forge_project_updated', handleSync)
    }
  }, [])

  const [activeTab, setActiveTab] = useState('tasks') // 'tasks' | 'scripts' | 'presales' | 'messages' | 'strategy'
  const [activeScriptTab, setActiveScriptTab] = useState('post') // 'post' | 'video' | 'dm'
  const [viewDraftTask, setViewDraftTask] = useState(null)
  const [copiedKey, setCopiedKey] = useState(null)
  const [toast, setToast] = useState('')
  const [creatorReplyText, setCreatorReplyText] = useState('')
  const [isSendingReply, setIsSendingReply] = useState(false)
  const [section1Threads, setSection1Threads] = useState([])
  const chatMessagesEndRef = useRef(null)

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
                status: 'read',
                isSection1: true
              })
            })
          })
          setSection1Threads(collected)
        }
      } catch (e) {
        console.warn('[CreatorPortal] Threads error:', e)
      }
    }
    loadThreads()
    return () => { isMounted = false }
  }, [project?.creatorId, project?.creatorHandle, project?.creatorEmail])

  // Real-time polling for messages from the Admin Studio
  useEffect(() => {
    let isMounted = true
    if (!project?.id) return

    const pollProject = async () => {
      try {
        const fresh = await getCoLaunchProject(project.id)
        if (isMounted && fresh) {
          const curCount = Array.isArray(project?.messages) ? project.messages.length : 0
          const freshCount = Array.isArray(fresh.messages) ? fresh.messages.length : 0
          if (freshCount !== curCount || fresh.currentPresales !== project.currentPresales) {
            setProject(fresh)
            try {
              localStorage.setItem('forge_launch_active_project', JSON.stringify(fresh))
            } catch (e) {}
          }
        }
      } catch (e) {}
    }

    const interval = setInterval(pollProject, 3000)
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [project?.id, project?.messages?.length, project?.currentPresales])

  // Combine real Section 1 messages + Section 2 custom messages
  const customProjectMessages = Array.isArray(project?.messages) ? project.messages : []
  const portalDisplayMessages = [...section1Threads, ...customProjectMessages]

  // Auto-scroll on new messages
  useEffect(() => {
    if (activeTab === 'messages') {
      chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [portalDisplayMessages.length, activeTab])

  // Handle Creator Sending a Message to Admin Studio
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

    try {
      localStorage.setItem('forge_launch_active_project', JSON.stringify(updatedProject))
      window.dispatchEvent(new CustomEvent('forge_project_updated', { detail: updatedProject }))
    } catch (err) {}

    if (project.id) {
      updateCoLaunchProject(project.id, { messages: updatedMessages }).catch(() => {})
    }
    showToast('Message sent to Studio!')
  }

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const copyToClipboard = (text, key) => {
    if (!text) return
    navigator.clipboard?.writeText(text)
    setCopiedKey(key)
    showToast('Copied to clipboard!')
    setTimeout(() => setCopiedKey(null), 2000)
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
    try {
      localStorage.setItem('forge_launch_active_project', JSON.stringify(updated))
    } catch (e) {}
    showToast('Task status updated!')
  }

  const getTaskDraftContent = (task) => {
    if (!task) return ''
    const ck = project?.campaignKit || {}
    if (task.draftKey === 'storySequence') return ck.storySequence || 'STORY 1 — Poll\nSTORY 2 — Product Reveal\nSTORY 3 — Pre-Order Link CTA'
    if (task.draftKey === 'videoScript') return ck.videoScript || '60s Short-Form Video Script'
    if (task.draftKey === 'newsletterDraft') return ck.newsletterDraft || 'Email Newsletter Broadcast Draft'
    if (task.draftKey === 'directMessageScript') return ck.directMessageScript || '1-on-1 DM Script'
    return ck.announcementPost || 'Social Announcement Post Copy'
  }

  if (loading) {
    return <CreatorPortalSkeleton />
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-[#090b0e] text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full p-8 rounded-2xl bg-[#0e1117] border border-white/[0.08] text-center space-y-4">
          <Rocket className="w-10 h-10 text-purple-400 mx-auto" />
          <h2 className="text-lg font-bold">No Active Creator Project Loaded</h2>
          <p className="text-xs text-slate-400">
            Please ask your co-founder operator to initialize your partnership project and share your link.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all cursor-pointer"
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
  const presaleTarget = derivedPlanTarget > 0 ? derivedPlanTarget : Number(project.presaleTarget || project.targetRevenue || 12500)
  const creatorRevenueShare = Math.round(presalesRevenue * 0.5)
  const campaignKit = project.campaignKit || {}
  const schedule = (campaignKit.postingSchedule && campaignKit.postingSchedule.length > 0)
    ? campaignKit.postingSchedule
    : (project.checklist && project.checklist.length > 0 ? project.checklist : [
        { id: 'day-1', day: 1, title: 'Problem Teaser & Discovery Poll', channel: 'Twitter / X', isToday: false, done: true, draftKey: 'announcementPost', description: 'Post teaser and survey link.' },
        { id: 'day-2', day: 2, title: 'Post Instagram Story #2 — Pain Point Poll & Announcement', channel: 'Instagram Stories', isToday: true, done: false, draftKey: 'storySequence', description: 'Post 3-story sequence with interactive poll sticker.' },
        { id: 'day-3', day: 3, title: 'Publish 60-Second Video Demo & Launch Hook', channel: 'TikTok / Reels / Shorts', isToday: false, done: false, draftKey: 'videoScript', description: 'Post 60s short-form demo.' },
        { id: 'day-4', day: 4, title: 'Send Deep-Dive Email Newsletter Broadcast', channel: 'Email Newsletter', isToday: false, done: false, draftKey: 'newsletterDraft', description: 'Send dedicated email broadcast.' },
        { id: 'day-5', day: 5, title: '1-on-1 VIP DM Outreach to 20 High-Intent Members', channel: 'Direct Messages', isToday: false, done: false, draftKey: 'directMessageScript', description: 'Reach out personally to 20 followers.' },
        { id: 'day-6', day: 6, title: 'Share Live Pre-Order Milestones & Survey Insights', channel: 'Stories & Community', isToday: false, done: false, draftKey: 'storySequence', description: 'Share validation momentum.' },
        { id: 'day-7', day: 7, title: 'Final 24-Hour Founding Tier Price Lock Push', channel: 'All Social Channels', isToday: false, done: false, draftKey: 'announcementPost', description: 'Final call before founding cohort closes.' }
      ])
  const completedTasksCount = schedule.filter(t => t.done || t.completed).length
  const totalTasksCount = schedule.length
  const reservations = project.reservations || []
  const preorderUrl = `${getFrontendUrl()}/preorder?ref=${project.creatorHandle?.replace('@','') || 'creator'}`

  return (
    <div className="min-h-screen bg-[#090b0e] text-slate-100 font-sans flex flex-col">
      {/* Top Portal Header */}
      <header className="h-16 border-b border-white/[0.08] bg-[#0d0f14] sticky top-0 z-50 flex items-center justify-between px-4 sm:px-8">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-950/50">
            <Rocket className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white tracking-tight text-sm">{project.productName || 'Software Co-Launch'}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                50/50 Co-Founder Portal
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Welcome, {project.creatorName || 'Creator Partner'}</p>
          </div>
        </div>

        {/* Live Revenue Share Badge */}
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-[10px] font-bold uppercase text-slate-400">Your 50% Revenue Share</span>
            <span className="text-xs font-extrabold text-emerald-400">${creatorRevenueShare.toLocaleString()} Earned</span>
          </div>
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
      </header>

      {/* Floating Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 p-3 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toast}</span>
        </div>
      )}

      {/* Main Body */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-8 space-y-6">
        {/* Milestone Progress Card */}
        <div className="p-6 rounded-2xl bg-gradient-to-b from-[#141824] to-[#0e1117] border border-white/[0.08] shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 block">
                Validation Sprint Milestone
              </span>
              <h1 className="text-lg sm:text-xl font-extrabold text-white">
                ${presalesRevenue.toLocaleString()} <span className="text-slate-400 font-normal text-sm">of ${presaleTarget.toLocaleString()} Presale Goal</span>
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {presaleTarget > 0 ? Math.round((presalesRevenue / presaleTarget) * 100) : 0}% Target Reached
              </span>
            </div>
          </div>

          <div className="w-full bg-white/[0.06] rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-purple-500 to-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${presaleTarget > 0 ? Math.min(100, Math.round((presalesRevenue / presaleTarget) * 100)) : 0}%` }}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs pt-2">
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Your 50% Profit Share</span>
              <span className="text-sm font-extrabold text-emerald-400 mt-0.5 block">${creatorRevenueShare.toLocaleString()}</span>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Sprint Duration</span>
              <span className="text-sm font-extrabold text-emerald-300 mt-0.5 block">{project.validationPlan?.period || project.daysLeft || '18 Days'}</span>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Pre-Orders / Backers</span>
              <span className="text-sm font-extrabold text-white mt-0.5 block">{reservations.length}</span>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Sprint Tasks</span>
              <span className="text-sm font-extrabold text-purple-300 mt-0.5 block">{completedTasksCount} / {totalTasksCount} done</span>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Conversion Funnel</span>
              <span className="text-sm font-extrabold text-white mt-0.5 block">{Number(project.conversionRate || 0).toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3 overflow-x-auto">
          {[
            { id: 'tasks', label: 'Daily Launch Checklist', icon: CheckSquare, count: `${completedTasksCount}/${totalTasksCount}` },
            { id: 'scripts', label: 'Copyable Launch Content', icon: Video },
            { id: 'presales', label: 'Verified Pre-Orders', icon: Users, count: reservations.length },
            { id: 'messages', label: 'Studio Chat & Messages', icon: MessageSquare, count: portalDisplayMessages.length },
            { id: 'strategy', label: 'Validation Strategy & Plan', icon: FileText },
          ].map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-950/50'
                    : 'text-slate-400 hover:text-white bg-[#0e1117] border border-white/[0.06]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/20">
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* TAB 1: DAILY LAUNCH CHECKLIST */}
        {activeTab === 'tasks' && (
          <div className="p-5 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-4">
            {/* Today's Action Hero Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/50 via-[#141824] to-[#0d0f17] border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shadow-purple-950/30">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40 animate-pulse">
                    🔥 Today's Action (Day 2)
                  </span>
                  <span className="text-xs font-bold text-slate-300">Instagram Stories · Pain Point Poll</span>
                </div>
                <h4 className="text-sm font-extrabold text-white">
                  Today: Post Instagram Story #2 (Pain Point Poll & Pre-Order Link)
                </h4>
                <p className="text-[11px] text-slate-400">
                  Post the 3-story sequence with interactive poll sticker to drive warm audience to the pre-order page.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setViewDraftTask({
                    id: 'day-2',
                    day: 2,
                    title: 'Post Instagram Story #2 — Pain Point Poll & Announcement',
                    channel: 'Instagram Stories',
                    draftKey: 'storySequence'
                  })}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-purple-950/50 active:scale-95"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Draft</span>
                </button>

                <button
                  onClick={() => toggleChecklist('day-2')}
                  className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors border ${
                    schedule.find(t => t.id === 'day-2')?.done
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border-white/[0.08]'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{schedule.find(t => t.id === 'day-2')?.done ? 'Completed' : 'Mark Done'}</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div>
                <h3 className="font-bold text-white text-sm">Creator Launch Action Checklist</h3>
                <p className="text-xs text-slate-400">Complete tasks to drive pre-orders and hit the $5,000 validation gate.</p>
              </div>
              <span className="text-xs font-mono text-emerald-400">{completedTasksCount} of {totalTasksCount} Completed</span>
            </div>

            <div className="space-y-2.5">
              {schedule.map(item => {
                const isDone = item.done || item.completed
                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                      item.isToday
                        ? 'bg-[#141824] border-purple-500/40 shadow-sm shadow-purple-950/40'
                        : isDone
                        ? 'bg-emerald-950/10 border-emerald-500/30 text-slate-400'
                        : 'bg-[#141720] border-white/[0.06] hover:border-purple-500/40 text-white'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleChecklist(item.id)}
                        className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center transition-colors shrink-0 ${
                          isDone ? 'bg-emerald-500 border-emerald-400 text-slate-950' : 'border-slate-600 bg-transparent'
                        }`}
                      >
                        {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            item.isToday
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                              : isDone
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-white/[0.06] text-slate-400'
                          }`}>
                            {item.day ? `Day ${item.day}` : 'Task'}
                          </span>
                          {item.channel && (
                            <span className="text-[10px] font-bold text-slate-400 font-mono">
                              {item.channel}
                            </span>
                          )}
                        </div>
                        <h5 className={`text-xs font-bold ${isDone ? 'line-through text-slate-400' : 'text-white'}`}>
                          {item.title || item.text}
                        </h5>
                        {item.description && (
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        onClick={() => setViewDraftTask(item)}
                        className="px-3 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 text-xs font-bold border border-purple-500/30 flex items-center gap-1 transition-colors"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View Draft</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* View Draft Modal in Creator Portal */}
        {viewDraftTask && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-3xl bg-[#0e1117] border border-white/[0.1] shadow-2xl p-6 space-y-4 animate-scale-in">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-400 block">
                    {viewDraftTask.day ? `Day ${viewDraftTask.day} · ` : ''}{viewDraftTask.channel || 'Launch Content'}
                  </span>
                  <h3 className="text-base font-extrabold text-white">{viewDraftTask.title || viewDraftTask.text}</h3>
                </div>
                <button
                  onClick={() => setViewDraftTask(null)}
                  className="p-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-slate-400 hover:text-white transition-colors"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 rounded-xl bg-[#141720] border border-white/[0.06] max-h-72 overflow-y-auto">
                <pre className="text-xs text-slate-200 font-sans whitespace-pre-wrap leading-relaxed">
                  {getTaskDraftContent(viewDraftTask)}
                </pre>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  onClick={() => copyToClipboard(getTaskDraftContent(viewDraftTask), 'creator-draft-modal')}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-md"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedKey === 'creator-draft-modal' ? 'Copied!' : 'Copy Draft'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      toggleChecklist(viewDraftTask.id)
                      setViewDraftTask(null)
                    }}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark Done</span>
                  </button>
                  <button
                    onClick={() => setViewDraftTask(null)}
                    className="px-3.5 py-2 rounded-xl bg-white/[0.06] text-slate-300 text-xs font-bold border border-white/[0.08]"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: COPYABLE LAUNCH SCRIPTS */}
        {activeTab === 'scripts' && (
          <div className="p-5 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div>
                <h3 className="font-bold text-white text-sm">Ready-To-Use Launch Content</h3>
                <p className="text-xs text-slate-400">Pre-written copy tailored to your audience. Copy and post in 1 click.</p>
              </div>
            </div>

            <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3">
              {[
                { id: 'post', label: 'Announcement Post', icon: MessageSquare },
                { id: 'video', label: '60s Video Script', icon: Video },
                { id: 'dm', label: '1-on-1 DM Script', icon: Users },
              ].map(st => {
                const Icon = st.icon
                return (
                  <button
                    key={st.id}
                    onClick={() => setActiveScriptTab(st.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      activeScriptTab === st.id
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : 'text-slate-400 hover:text-white bg-white/[0.02]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{st.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Script Views */}
            {activeScriptTab === 'post' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-bold">Social Post Copy</span>
                  <button
                    onClick={() => copyToClipboard(campaignKit.announcementPost, 'post')}
                    disabled={!campaignKit.announcementPost}
                    className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-40"
                  >
                    {copiedKey === 'post' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'post' ? 'Copied!' : 'Copy Post'}</span>
                  </button>
                </div>
                <textarea
                  readOnly
                  rows={8}
                  value={campaignKit.announcementPost || 'No announcement post drafted yet.'}
                  className="w-full p-4 rounded-xl bg-[#141720] border border-white/[0.08] text-xs text-slate-200 outline-none font-sans leading-relaxed resize-none select-all"
                />
              </div>
            )}

            {activeScriptTab === 'video' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-bold">60-Second Video Script (TikTok / Reels)</span>
                  <button
                    onClick={() => copyToClipboard(campaignKit.videoScript, 'video')}
                    disabled={!campaignKit.videoScript}
                    className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-40"
                  >
                    {copiedKey === 'video' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'video' ? 'Copied!' : 'Copy Script'}</span>
                  </button>
                </div>
                <textarea
                  readOnly
                  rows={9}
                  value={campaignKit.videoScript || 'No video script drafted yet.'}
                  className="w-full p-4 rounded-xl bg-[#141720] border border-white/[0.08] text-xs text-purple-200 outline-none font-mono leading-relaxed resize-none select-all"
                />
              </div>
            )}

            {activeScriptTab === 'dm' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-bold">1-on-1 Community DM Outreach</span>
                  <button
                    onClick={() => copyToClipboard(campaignKit.directMessageScript, 'dm')}
                    disabled={!campaignKit.directMessageScript}
                    className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-40"
                  >
                    {copiedKey === 'dm' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'dm' ? 'Copied!' : 'Copy DM'}</span>
                  </button>
                </div>
                <textarea
                  readOnly
                  rows={6}
                  value={campaignKit.directMessageScript || 'No DM script drafted yet.'}
                  className="w-full p-4 rounded-xl bg-[#141720] border border-white/[0.08] text-xs text-slate-200 outline-none font-sans leading-relaxed resize-none select-all"
                />
              </div>
            )}
          </div>
        )}

        {/* TAB 3: VERIFIED PRE-ORDERS */}
        {activeTab === 'presales' && (
          <div className="p-5 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div>
                <h3 className="font-bold text-white text-sm">Verified Backer Reservations ({reservations.length})</h3>
                <p className="text-xs text-slate-400">Live feed of audience pre-orders directly tied to your revenue share.</p>
              </div>
              <span className="text-xs font-mono text-emerald-400">${presalesRevenue.toLocaleString()} Total</span>
            </div>

            {reservations.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs border border-dashed border-white/[0.08] rounded-xl">
                No customer pre-orders recorded yet. Pledges will populate here as backers join.
              </div>
            ) : (
              <div className="space-y-2">
                {reservations.map(res => (
                  <div key={res.id} className="p-3.5 rounded-xl bg-[#141720] border border-white/[0.06] flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-white">{res.name}</div>
                      <span className="text-[10px] text-slate-400 font-mono">{res.email}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-emerald-400">+${res.amount}</div>
                      <span className="text-[10px] text-slate-400">{res.tier}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: DIRECT MESSAGES & STUDIO CHAT */}
        {activeTab === 'messages' && (
          <div className="rounded-2xl bg-[#0b141a] border border-white/[0.1] shadow-2xl overflow-hidden flex flex-col h-[620px] relative font-sans">
            {/* Header */}
            <div className="bg-[#1f2c34] px-4 py-3 border-b border-white/[0.08] flex items-center justify-between text-white z-10 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-emerald-500 p-0.5 shadow-md shrink-0 flex items-center justify-center">
                  <div className="w-full h-full rounded-full bg-[#0d1117] flex items-center justify-center font-bold text-xs text-purple-300">
                    CF
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-white truncate">Creator Forge Studio</h3>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 shrink-0">
                      <ShieldCheck className="w-2.5 h-2.5" />
                      <span>Studio Co-Founder</span>
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1.5 truncate">
                    <span className="text-emerald-400 font-medium">Online · Dedicated Tech Team</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-[#0b141a] bg-[radial-gradient(#1f2c34_1px,transparent_1px)] [background-size:16px_16px]">
              {portalDisplayMessages.length === 0 ? (
                <div className="py-12 px-6 max-w-md mx-auto text-center space-y-3 rounded-2xl bg-[#111b21] border border-white/[0.06]">
                  <MessageSquare className="w-8 h-8 text-slate-500 mx-auto" />
                  <h4 className="font-bold text-white text-sm">Direct Channel with Studio</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Send real-time messages, feedback on features, or launch questions directly to your Creator Forge engineering team.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  {portalDisplayMessages.map((msg, idx) => {
                    // For creator portal: msg.sender === 'creator' is outgoing (right), msg.sender === 'admin' is incoming (left)
                    const isCreatorOutgoing = msg.sender === 'creator'
                    return (
                      <div
                        key={msg.id || idx}
                        className={`flex flex-col ${isCreatorOutgoing ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[85%] sm:max-w-[70%] rounded-2xl p-3.5 text-xs shadow-md space-y-1.5 relative ${
                            isCreatorOutgoing
                              ? 'bg-[#005c4b] text-slate-100 rounded-tr-xs border border-emerald-500/20'
                              : 'bg-[#202c33] text-slate-200 rounded-tl-xs border border-white/[0.06]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 pb-0.5 text-[11px]">
                            <span className={`font-extrabold ${isCreatorOutgoing ? 'text-emerald-300' : 'text-purple-300'}`}>
                              {isCreatorOutgoing ? (project.creatorName || 'You') : 'Creator Forge Studio'}
                            </span>
                            {msg.isSection1 && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-black/20 text-slate-300 font-mono">
                                Outreach
                              </span>
                            )}
                          </div>

                          {msg.subject && (
                            <div className="font-bold text-white border-b border-white/[0.08] pb-1 text-[11px]">
                              {msg.subject}
                            </div>
                          )}

                          <p className="whitespace-pre-wrap leading-relaxed select-text font-sans text-xs">
                            {msg.text}
                          </p>

                          <div className={`flex items-center justify-end gap-1 text-[10px] ${
                            isCreatorOutgoing ? 'text-emerald-200/70' : 'text-slate-400'
                          }`}>
                            <span>{msg.time}</span>
                            {isCreatorOutgoing && (
                              <span title="Delivered to Studio">
                                <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={chatMessagesEndRef} />
                </div>
              )}
            </div>

            {/* Composer */}
            <form onSubmit={handleSendCreatorMessage} className="bg-[#1f2c34] p-3 border-t border-white/[0.08] flex items-center gap-2">
              <input
                type="text"
                value={creatorReplyText}
                onChange={e => setCreatorReplyText(e.target.value)}
                placeholder="Type a message or question to Creator Forge Studio..."
                className="flex-1 bg-[#2a3942] text-white text-xs rounded-xl px-4 py-2.5 border border-transparent focus:border-purple-500 focus:outline-none transition-all placeholder:text-slate-400"
              />
              <button
                type="submit"
                disabled={!creatorReplyText.trim() || isSendingReply}
                className="p-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white transition-all shadow-md active:scale-95 cursor-pointer shrink-0"
              >
                {isSendingReply ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
          </div>
        )}

        {/* TAB 5: VALIDATION STRATEGY & PLAN */}
        {activeTab === 'strategy' && (
          <div className="p-5 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-4">
            <div className="border-b border-white/[0.06] pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-sm">Venture Validation Blueprint</h3>
                <p className="text-xs text-slate-400">The core target customer, value proposition, and validation success gates agreed upon for this co-launch.</p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
                50/50 Co-Founder Terms
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-[#141720] border border-white/[0.06] space-y-1.5">
                <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block">Target Customer</span>
                <p className="text-slate-200 leading-relaxed font-sans">
                  {project.validationPlan?.customer || project.targetAudience || "Core high-intent audience segment from your community."}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#141720] border border-white/[0.06] space-y-1.5">
                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">Core Problem Solved</span>
                <p className="text-slate-200 leading-relaxed font-sans">
                  {project.validationPlan?.problem || project.problem || "Automating friction points and repetitive tasks for your followers."}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#141720] border border-white/[0.06] space-y-1.5">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Founding Member Offer</span>
                <p className="text-slate-200 leading-relaxed font-sans">
                  {project.validationPlan?.offer || `Founding Access to ${project.productName || 'the product'}: Lifetime discount & direct alpha access.`}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#141720] border border-white/[0.06] space-y-1.5">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">Pricing & Reservation</span>
                <p className="text-slate-200 leading-relaxed font-sans">
                  {project.validationPlan?.pricing || project.pricing || "$89 founding annual pass with a refundable reservation deposit."}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#141720] border border-white/[0.06] space-y-1.5 md:col-span-2">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">Success Threshold & Sprint Gate</span>
                <p className="text-slate-200 leading-relaxed font-sans">
                  {project.validationPlan?.threshold || `$${presaleTarget.toLocaleString()} in pre-sales or 50 paid founding member reservations within ${project.validationPlan?.period || '18 days'}.`}
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
