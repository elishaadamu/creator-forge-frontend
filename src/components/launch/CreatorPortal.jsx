import { useState, useEffect } from 'react'
import {
  Rocket, CheckCircle2, DollarSign, Copy, Check, Video, MessageSquare,
  Users, ExternalLink, Globe, Sparkles, AlertCircle, ShieldCheck, ArrowRight,
  TrendingUp, Award, Calendar, CheckSquare, Eye, Smartphone, Send
} from 'lucide-react'
import { getFrontendUrl } from '../../services/opsApi'
import { updatePageSEO } from '../../utils/seo'

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

  const [activeTab, setActiveTab] = useState('tasks') // 'tasks' | 'scripts' | 'presales'
  const [activeScriptTab, setActiveScriptTab] = useState('post') // 'post' | 'video' | 'dm'
  const [viewDraftTask, setViewDraftTask] = useState(null)
  const [copiedKey, setCopiedKey] = useState(null)
  const [toast, setToast] = useState('')

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
    return (
      <div className="min-h-screen bg-[#090b0e] text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full p-8 rounded-2xl bg-[#0e1117] border border-white/[0.08] text-center space-y-4">
          <Rocket className="w-10 h-10 text-purple-400 mx-auto animate-bounce" />
          <h2 className="text-lg font-bold">Loading Co-Founder Portal...</h2>
          <p className="text-xs text-slate-400">
            Synchronizing live co-launch workspace, campaign kit, and backer dashboard.
          </p>
        </div>
      </div>
    )
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
  const presaleTarget = Number(project.presaleTarget || project.targetRevenue || 5000)
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

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2">
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Your Profit Share</span>
              <span className="text-sm font-extrabold text-emerald-400 mt-0.5 block">${creatorRevenueShare.toLocaleString()}</span>
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
        <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3">
          {[
            { id: 'tasks', label: 'Daily Launch Checklist', icon: CheckSquare, count: `${completedTasksCount}/${totalTasksCount}` },
            { id: 'scripts', label: 'Copyable Launch Content', icon: Video },
            { id: 'presales', label: 'Verified Pre-Orders', icon: Users, count: reservations.length },
          ].map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
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
      </main>
    </div>
  )
}
