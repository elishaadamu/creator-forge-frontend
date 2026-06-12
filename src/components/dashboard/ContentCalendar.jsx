import { useState, useEffect } from 'react'
import { useForge, useBgJob } from '../../App'
import { RefreshCw, Copy, Check, Plus, Sparkles, ChevronLeft, ChevronRight, Info, Calendar, AlertCircle, X, Pencil } from 'lucide-react'
import { generateContentCalendar, generateSingleCalendarPost, hasTextKey } from '../../services/ai'


const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// Content theme categories with colors and rationale
const THEMES = {
  launch: { label: 'Launch', color: 'rgba(255,255,255,0.9)', bg: 'rgba(255,255,255,0.12)', why: 'Drive urgency and conversions' },
  value: { label: 'Value', color: 'rgba(255,255,255,0.6)', bg: 'rgba(255,255,255,0.06)', why: 'Build trust and grow organic reach' },
  bts: { label: 'BTS', color: 'rgba(255,255,255,0.55)', bg: 'rgba(255,255,255,0.05)', why: 'Behind-the-scenes builds intimacy with your audience' },
  proof: { label: 'Proof', color: 'rgba(255,255,255,0.65)', bg: 'rgba(255,255,255,0.07)', why: 'Social proof reduces buying hesitation' },
  cta: { label: 'CTA', color: 'rgba(255,255,255,0.85)', bg: 'rgba(255,255,255,0.1)', why: 'Direct conversion push for ready buyers' },
  community: { label: 'Community', color: 'rgba(255,255,255,0.5)', bg: 'rgba(255,255,255,0.05)', why: 'Engagement posts grow your organic algorithm reach' },
  story: { label: 'Story', color: 'rgba(255,255,255,0.5)', bg: 'rgba(255,255,255,0.05)', why: 'Stories humanize you and increase follower loyalty' },
}

const STATUS_STYLES = {
  draft: { bg: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)', label: 'Draft' },
  scheduled: { bg: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', label: 'Scheduled' },
  posted: { bg: 'rgba(255,255,255,0.15)', color: 'white', label: 'Posted' },
  failed: { bg: 'rgba(255,0,0,0.12)', color: 'rgba(255,80,80,0.8)', label: 'Failed' },
}

const PLATFORM_ABBR = {
  Instagram: 'IG',
  Twitter: 'X',
  YouTube: 'YT',
  TikTok: 'TT',
  LinkedIn: 'LI',
  Email: '✉',
  Podcast: '🎙',
}

const PLATFORM_TYPES = {
  Instagram: ['Post', 'Reel', 'Story', 'Carousel'],
  Twitter: ['Post', 'Thread'],
  YouTube: ['Video', 'Community', 'Shorts', 'Live'],
  TikTok: ['Video'],
  LinkedIn: ['Post'],
  Email: ['Email'],
  Podcast: ['Episode'],
}

const INITIAL_CALENDAR = [
  {
    day: 'Mon',
    posts: [
      { id: 1, platform: 'Instagram', type: 'Reel', title: 'Launch teaser - something big is coming', theme: 'launch', status: 'draft' },
      { id: 2, platform: 'Twitter', type: 'Thread', title: '5 things most creators get wrong about monetization', theme: 'value', status: 'scheduled' },
    ],
  },
  {
    day: 'Tue',
    posts: [
      { id: 3, platform: 'Email', type: 'Email', title: 'Early access announcement to your list', theme: 'launch', status: 'scheduled' },
      { id: 4, platform: 'Instagram', type: 'Story', title: 'Behind-the-scenes day in my life', theme: 'bts', status: 'draft' },
    ],
  },
  {
    day: 'Wed',
    posts: [
      { id: 5, platform: 'YouTube', type: 'Community', title: 'Asking my audience what they struggle with', theme: 'community', status: 'draft' },
    ],
  },
  {
    day: 'Thu',
    posts: [
      { id: 6, platform: 'Instagram', type: 'Carousel', title: 'My journey - from 0 to [result]', theme: 'proof', status: 'scheduled' },
      { id: 7, platform: 'Twitter', type: 'Post', title: 'Your audience already wants to pay you', theme: 'value', status: 'posted' },
    ],
  },
  {
    day: 'Fri',
    posts: [
      { id: 8, platform: 'YouTube', type: 'Live', title: 'Launch day live - Q&A + product reveal', theme: 'launch', status: 'draft' },
      { id: 9, platform: 'Instagram', type: 'Post', title: '[Product] is live - link in bio', theme: 'cta', status: 'draft' },
    ],
  },
  {
    day: 'Sat',
    posts: [],
  },
  {
    day: 'Sun',
    posts: [
      { id: 10, platform: 'Instagram', type: 'Story', title: 'Week recap + what\'s coming next week', theme: 'story', status: 'draft' },
    ],
  },
]

function SkeletonCard() {
  return (
    <div
      className="rounded-xl border p-2.5 space-y-2.5 animate-pulse"
      style={{ background: 'var(--theme-card-bg)', borderColor: 'var(--theme-border-color)' }}
    >
      <div className="flex justify-between items-center">
        <div className="w-8 h-3.5 bg-white/5 rounded" />
        <div className="w-10 h-3.5 bg-white/5 rounded-full" />
      </div>
      <div className="space-y-1 mt-1.5">
        <div className="w-full h-3 bg-white/10 rounded" />
        <div className="w-3/4 h-3 bg-white/10 rounded" />
      </div>
      <div className="flex justify-between items-center mt-2">
        <div className="w-12 h-3.5 bg-white/5 rounded-full" />
        <div className="w-4 h-4 bg-white/5 rounded" />
      </div>
    </div>
  )
}

function PostCard({ post, onCopy, onSchedule, onRegenerate, isRegenerating, copiedId, onOpen }) {
  const [showWhy, setShowWhy] = useState(false)
  const theme = THEMES[post.theme]
  const status = STATUS_STYLES[post.status]

  if (isRegenerating) {
    return <SkeletonCard />
  }

  return (
    <div
      className="rounded-xl border p-2.5 group cursor-pointer transition-all duration-150 relative"
      style={{ background: 'var(--theme-card-bg)', borderColor: 'var(--theme-border-color)' }}
      onClick={() => onOpen && onOpen(post)}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--theme-accent)'; e.currentTarget.style.background = 'var(--theme-card-bg)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--theme-border-color)'; e.currentTarget.style.background = 'var(--theme-card-bg)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded"
            style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}
          >
            {PLATFORM_ABBR[post.platform]}
          </span>
          <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{post.type}</span>
        </div>
        <div className="flex items-center gap-1">
          {/* Theme tag */}
          <span
            className="text-[8px] font-semibold px-1.5 py-0.5 rounded-full"
            style={{ background: theme.bg, color: theme.color }}
          >
            {theme.label}
          </span>
          {/* Why button */}
          <button
            onClick={(e) => { e.stopPropagation(); setShowWhy(w => !w) }}
            title="Explain post theme/strategy"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: 'rgba(255,255,255,0.3)' }}
          >
            <Info size={9} />
          </button>
        </div>
      </div>

      {/* Title */}
      <p className="text-[11px] leading-tight mb-2" style={{ color: 'rgba(255,255,255,0.65)', lineHeight: '1.4' }}>
        {post.title}
      </p>

      {/* Why tooltip */}
      {showWhy && (
        <div className="mb-2 px-2 py-1.5 rounded-lg text-[10px] leading-relaxed" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>
          {theme.why}
        </div>
      )}

      {/* Status + actions */}
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wide" style={status}>
          {status.label}
        </span>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onCopy(post.id, post.title) }}
            title={copiedId === post.id ? "Copied!" : "Copy post text"}
            className="p-1 rounded transition-colors"
            style={{ color: 'rgba(255,255,255,0.4)' }}
            onMouseEnter={e => { e.target.style.color = 'white' }}
            onMouseLeave={e => { e.target.style.color = 'rgba(255,255,255,0.4)' }}
          >
            {copiedId === post.id ? <Check size={10} /> : <Copy size={10} />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onRegenerate(post.id) }}
            disabled={isRegenerating}
            title="Regenerate this specific post draft"
            className="p-1 rounded transition-colors disabled:opacity-40"
            style={{ color: 'rgba(255,255,255,0.4)' }}
            onMouseEnter={e => { if (!isRegenerating) e.target.style.color = 'white' }}
            onMouseLeave={e => { if (!isRegenerating) e.target.style.color = 'rgba(255,255,255,0.4)' }}
          >
            {isRegenerating ? (
              <RefreshCw size={10} className="animate-spin text-white" />
            ) : (
              <RefreshCw size={10} />
            )}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onSchedule(post.id) }}
            title="Queue/schedule post draft"
            className="p-1 rounded transition-colors"
            style={{ color: 'rgba(255,255,255,0.4)' }}
            onMouseEnter={e => { e.target.style.color = 'white' }}
            onMouseLeave={e => { e.target.style.color = 'rgba(255,255,255,0.4)' }}
          >
            <Calendar size={10} />
          </button>
        </div>
      </div>
    </div>
  )
}

function EmptySlot({ day, onGenerate, isGenerating }) {
  return (
    <button
      onClick={() => onGenerate(day)}
      title="Ask Forge AI to generate a post for this slot"
      className="w-full rounded-xl border flex flex-col items-center justify-center py-4 gap-1.5 transition-all duration-150"
      style={{
        borderStyle: 'dashed',
        borderColor: 'var(--theme-border-color)',
        background: 'transparent',
        minHeight: '72px',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--theme-accent)'; e.currentTarget.style.background = 'var(--theme-accent-bg)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--theme-border-color)'; e.currentTarget.style.background = 'transparent' }}
    >
      {isGenerating ? (
        <RefreshCw size={14} className="text-white/30 animate-spin" />
      ) : (
        <>
          <Sparkles size={12} className="text-white/20" />
          <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>Generate post</span>
        </>
      )}
    </button>
  )
}

export default function ContentCalendar() {
  const { creatorData, startBgJob, cancelBgJob, clearBgJob, incrementAiActions, setApiModalOpen, triggerToast, syncSessionToDb, dbLoadedTimestamp } = useForge()
  const handle = creatorData?.handle || 'default'

  const [activeGoal, setActiveGoal] = useState(() => {
    return localStorage.getItem(`forge_${handle}_calendar_active_goal`) || 'launch'
  })

  const [calendar, setCalendar] = useState(() => {
    const initialGoal = localStorage.getItem(`forge_${handle}_calendar_active_goal`) || 'launch'
    const cacheKey = `forge_calendar_${handle}_${initialGoal}_w0`
    const cacheKeyLower = `forge_calendar_${handle.toLowerCase()}_${initialGoal.toLowerCase()}_w0`
    try {
      const cached = localStorage.getItem(cacheKey) || localStorage.getItem(cacheKeyLower)
      if (cached) return JSON.parse(cached)
    } catch (e) {
      console.error('Failed to parse cached calendar:', e)
    }
    return null
  })

  // Save activeGoal selection to localStorage
  useEffect(() => {
    localStorage.setItem(`forge_${handle}_calendar_active_goal`, activeGoal)
  }, [activeGoal, handle])

  const [copiedId, setCopiedId] = useState(null)
  const [regeneratingPostId, setRegeneratingPostId] = useState(null)
  const [generatingSlot, setGeneratingSlot] = useState(null)
  const [view, setView] = useState('week')
  const [week, setWeek] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedPost, setSelectedPost] = useState(null)
  const [selectedDay, setSelectedDay]   = useState(null)

  const getWeekDates = (weekOffset) => {
    const dates = []
    const today = new Date()
    const currentDay = today.getDay()
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay
    for (let i = 0; i < 7; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() + distanceToMonday + i + (weekOffset * 7))
      dates.push(d)
    }
    return dates
  }
  const weekDates = getWeekDates(week)

  // Derive a stable job id from current goal + week
  const calJobId = `calendar-week-${activeGoal}-${week}`
  const calJob = useBgJob(calJobId)

  // Custom Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newPostData, setNewPostData] = useState({
    title: '',
    day: 'Mon',
    platform: 'Instagram',
    type: 'Post',
    theme: 'launch',
    status: 'draft'
  })

  const goals = ['launch', 'growth', 'engagement', 'community']

  const loadOrGenerateCalendar = async (goal, forceRegenerate = false) => {
    const handle = creatorData?.handle || 'default'
    const cacheKey = `forge_calendar_${handle}_${goal}_w${week}`
    
    if (!forceRegenerate) {
      const cacheKeyLower = `forge_calendar_${handle.toLowerCase()}_${goal.toLowerCase()}_w${week}`
      const cached = localStorage.getItem(cacheKey) || localStorage.getItem(cacheKeyLower)
      if (cached) {
        try {
          const parsed = JSON.parse(cached)
          console.log(`[Forge ContentCalendar] Loaded cached calendar for active goal "${goal}":`, parsed)
          setCalendar(parsed)
          setError(null)
          return
        } catch (e) {
          console.error('Failed to parse cached calendar:', e)
        }
      }
    }

    if (!hasTextKey()) {
      // Offline fallback: adapt initial mock calendar
      const adaptedMock = INITIAL_CALENDAR.map(day => ({
        ...day,
        posts: day.posts.map(post => {
          let newTheme = post.theme
          if (goal === 'community' && post.theme === 'launch') newTheme = 'community'
          if (goal === 'engagement' && post.theme === 'launch') newTheme = 'value'
          if (goal === 'growth' && post.theme === 'launch') newTheme = 'proof'
          return {
            ...post,
            theme: newTheme,
            title: post.title.replace(/Launch/i, goal.charAt(0).toUpperCase() + goal.slice(1))
          }
        })
      }))
      setCalendar(adaptedMock)
      localStorage.setItem(cacheKey, JSON.stringify(adaptedMock))
      setTimeout(() => { if (syncSessionToDb) syncSessionToDb() }, 50)
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const result = await generateContentCalendar(creatorData, goal)
      if (result && Array.isArray(result)) {
        let idCounter = 1
        const normalized = result.map(day => ({
          day: day.day,
          posts: (day.posts || []).map(post => ({
            id: post.id || idCounter++,
            platform: post.platform || 'Instagram',
            type: post.type || 'Post',
            title: post.title || 'Untitled Post',
            theme: THEMES[post.theme] ? post.theme : 'value',
            status: STATUS_STYLES[post.status] ? post.status : 'draft'
          }))
        }))
        console.log(`[Forge ContentCalendar] Generated new 7-Day week calendar via AI for goal "${goal}":`, normalized)
        setCalendar(normalized)
        localStorage.setItem(cacheKey, JSON.stringify(normalized))
        setTimeout(() => { if (syncSessionToDb) syncSessionToDb() }, 50)
      } else {
        throw new Error("Invalid response format received from AI.")
      }
    } catch (err) {
      console.error(err)
      setError("Failed to generate content calendar. Using mock fallback.")
      const cacheFallbackKey = `forge_calendar_${handle}_${goal}_w${week}`
      const fallback = localStorage.getItem(cacheFallbackKey)
      if (fallback) {
        setCalendar(JSON.parse(fallback))
      } else {
        setCalendar(INITIAL_CALENDAR)
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const handle = creatorData?.handle
    if (!handle || handle === 'default') {
      setCalendar(INITIAL_CALENDAR)
      return
    }
    loadOrGenerateCalendar(activeGoal, false)
  }, [activeGoal, week, creatorData?.handle, dbLoadedTimestamp])

  // Reload activeGoal when database loads
  useEffect(() => {
    const handle = creatorData?.handle || 'default'
    const cachedGoal = localStorage.getItem(`forge_${handle}_calendar_active_goal`) || 'launch'
    if (cachedGoal !== activeGoal) {
      setActiveGoal(cachedGoal)
    }
  }, [dbLoadedTimestamp, creatorData?.handle])

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleSchedule = (id) => {
    setCalendar(prev => {
      const updated = prev.map(day => ({
        ...day,
        posts: day.posts.map(p => p.id === id ? { ...p, status: 'scheduled' } : p),
      }))
      const handle = creatorData?.handle || 'default'
      const cacheKey = `forge_calendar_${handle}_${activeGoal}_w${week}`
      localStorage.setItem(cacheKey, JSON.stringify(updated))
      return updated
    })
    setTimeout(() => { if (syncSessionToDb) syncSessionToDb() }, 50)
  }

  // Apply background-job result when it finishes (works even after leaving the page)
  useEffect(() => {
    if (calJob.status === 'done' && calJob.result) {
      const result = calJob.result
      if (Array.isArray(result)) {
        let idCounter = 1
        const normalized = result.map(day => ({
          day: day.day,
          posts: (day.posts || []).map(post => ({
            id: post.id || idCounter++,
            platform: post.platform || 'Instagram',
            type: post.type || 'Post',
            title: post.title || 'Untitled Post',
            theme: THEMES[post.theme] ? post.theme : 'value',
            status: STATUS_STYLES[post.status] ? post.status : 'draft'
          }))
        }))
        const handle = creatorData?.handle || 'default'
        const cacheKey = `forge_calendar_${handle}_${activeGoal}_w${week}`
        console.log('[Forge ContentCalendar] Background 7-day calendar week generation complete:', normalized)
        setCalendar(normalized)
        localStorage.setItem(cacheKey, JSON.stringify(normalized))
        clearBgJob(calJobId)
        if (triggerToast) triggerToast('7-Day calendar week generated!', 'success')
        setTimeout(() => { if (syncSessionToDb) syncSessionToDb() }, 50)
      }
    }
    if (calJob.status === 'error' || calJob.status === 'cancelled') {
      setError(calJob.status === 'cancelled' ? 'AI generation cancelled.' : 'AI generation failed. Showing cached or fallback data.')
      const handle = creatorData?.handle || 'default'
      const cacheKey = `forge_calendar_${handle}_${activeGoal}_w${week}`
      const cacheKeyLower = `forge_calendar_${handle.toLowerCase()}_${activeGoal.toLowerCase()}_w${week}`
      const cached = localStorage.getItem(cacheKey) || localStorage.getItem(cacheKeyLower)
      if (cached) {
        try {
          setCalendar(JSON.parse(cached))
        } catch (e) {
          setCalendar(INITIAL_CALENDAR)
        }
      } else {
        setCalendar(INITIAL_CALENDAR)
      }
      clearBgJob(calJobId)
    }
  }, [calJob.status, calJob.result])

  const handleRegenerateWeek = () => {
    if (calJob.status === 'running') return
    if (!hasTextKey()) {
      setApiModalOpen(true)
      return
    }
    if (incrementAiActions) incrementAiActions()
    startBgJob(calJobId, () => generateContentCalendar(creatorData, activeGoal))
  }

  const handleGenerateSlot = async (day) => {
    setGeneratingSlot(day)
    if (incrementAiActions) incrementAiActions()
    try {
      if (!hasTextKey()) {
        setApiModalOpen(true)
        setGeneratingSlot(null)
        return
      }
      const postData = await generateSingleCalendarPost(creatorData, day, activeGoal)
        const newPost = {
          id: Date.now(),
          platform: postData.platform || 'Instagram',
          type: postData.type || 'Post',
          title: postData.title || `Forge generated post for ${day}`,
          theme: THEMES[postData.theme] ? postData.theme : 'value',
          status: postData.status || 'draft',
        }
        setCalendar(prev => {
          if (!prev) return null
          const updated = prev.map(d =>
            d.day === day ? { ...d, posts: [...d.posts, newPost] } : d
          )
          const handle = creatorData?.handle || 'default'
          const cacheKey = `forge_calendar_${handle}_${activeGoal}_w${week}`
          localStorage.setItem(cacheKey, JSON.stringify(updated))
          if (triggerToast) triggerToast('New post draft generated!', 'success')
          return updated
        })
        setTimeout(() => { if (syncSessionToDb) syncSessionToDb() }, 50)
      
    } catch (err) {
      console.error(err)
      alert("Failed to generate post suggestion: " + err.message)
    } finally {
      setGeneratingSlot(null)
    }
  }

  const handleRegeneratePost = async (postId, day) => {
    setRegeneratingPostId(postId)
    if (incrementAiActions) incrementAiActions()
    try {
      if (!hasTextKey()) {
        setApiModalOpen(true)
        setRegeneratingPostId(null)
        return
      }
      const postData = await generateSingleCalendarPost(creatorData, day, activeGoal)
      const updatedPost = {
        id: postId,
        platform: postData.platform || 'Instagram',
        type: postData.type || 'Post',
        title: postData.title || `Forge generated post for ${day}`,
        theme: THEMES[postData.theme] ? postData.theme : 'value',
        status: 'draft',
      }
      setCalendar(prev => {
        if (!prev) return null
        const updated = prev.map(d =>
          d.day === day
            ? { ...d, posts: d.posts.map(p => p.id === postId ? updatedPost : p) }
            : d
        )
        const handle = creatorData?.handle || 'default'
        const cacheKey = `forge_calendar_${handle}_${activeGoal}_w${week}`
        localStorage.setItem(cacheKey, JSON.stringify(updated))
        if (triggerToast) triggerToast('Post draft regenerated successfully!', 'success')
        return updated
      })
      setTimeout(() => { if (syncSessionToDb) syncSessionToDb() }, 50)
    } catch (err) {
      console.error(err)
      alert("Failed to regenerate post suggestion: " + err.message)
    } finally {
      setRegeneratingPostId(null)
    }
  }

  const handleAddPost = () => {
    setNewPostData({
      title: '',
      day: 'Mon',
      platform: 'Instagram',
      type: 'Post',
      theme: 'launch',
      status: 'draft'
    })
    setIsAddModalOpen(true)
  }

  const handleSaveNewPost = () => {
    if (!newPostData.title.trim()) return
    const newPost = {
      id: Date.now(),
      platform: newPostData.platform,
      type: newPostData.type,
      title: newPostData.title,
      theme: newPostData.theme,
      status: newPostData.status,
    }
    setCalendar(prev => {
      if (!prev) return null
      const updated = prev.map(d =>
        d.day === newPostData.day ? { ...d, posts: [...d.posts, newPost] } : d
      )
      const handle = creatorData?.handle || 'default'
      const cacheKey = `forge_calendar_${handle}_${activeGoal}_w${week}`
      localStorage.setItem(cacheKey, JSON.stringify(updated))
      return updated
    })
    setIsAddModalOpen(false)
    setTimeout(() => { if (syncSessionToDb) syncSessionToDb() }, 50)
  }

  const handleScheduleAllDrafts = () => {
    if (!calendar) return
    setCalendar(prev => {
      if (!prev) return null
      const updated = prev.map(day => ({
        ...day,
        posts: day.posts.map(p => p.status === 'draft' ? { ...p, status: 'scheduled' } : p),
      }))
      const handle = creatorData?.handle || 'default'
      const cacheKey = `forge_calendar_${handle}_${activeGoal}_w${week}`
      localStorage.setItem(cacheKey, JSON.stringify(updated))
      return updated
    })
    setTimeout(() => { if (syncSessionToDb) syncSessionToDb() }, 50)
  }

  const handleSaveEditedPost = (updatedPost) => {
    setCalendar(prev => {
      if (!prev) return null
      const updated = prev.map(d =>
        d.day === selectedDay
          ? { ...d, posts: d.posts.map(p => p.id === updatedPost.id ? { ...p, ...updatedPost } : p) }
          : d
      )
      const h = creatorData?.handle || 'default'
      const cacheKey = `forge_calendar_${h}_${activeGoal}_w${week}`
      localStorage.setItem(cacheKey, JSON.stringify(updated))
      if (triggerToast) triggerToast('Post draft updated!', 'success')
      return updated
    })
    setSelectedPost(null)
    setSelectedDay(null)
    setTimeout(() => { if (syncSessionToDb) syncSessionToDb() }, 50)
  }

  const totalPosts = calendar ? calendar.reduce((s, d) => s + (d.posts ? d.posts.length : 0), 0) : 0
  const scheduled = calendar ? calendar.reduce((s, d) => s + (d.posts ? d.posts.filter(p => p.status === 'scheduled').length : 0), 0) : 0
  const drafts = calendar ? calendar.reduce((s, d) => s + (d.posts ? d.posts.filter(p => p.status === 'draft').length : 0), 0) : 0


  return (
    <div className="p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="forge-label mb-3">Content Calendar</p>
          <h2 className="forge-heading mb-1.5" style={{ fontSize: 'clamp(22px, 3vw, 30px)', letterSpacing: '-0.03em' }}>
            This week's content plan
          </h2>
          <p className="text-[14px]" style={{ color: 'rgba(255,255,255,0.38)' }}>
            Forge built a full week around your launch goal. Click any slot to edit.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {calJob.status === 'running' && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
                Running in background…
              </span>
              <button
                onClick={() => cancelBgJob(calJobId)}
                className="text-[10px] font-semibold text-white/40 hover:text-white/80 border border-white/10 hover:border-white/25 px-2 py-0.5 rounded transition-all"
              >
                Cancel
              </button>
            </div>
          )}
          <button
            onClick={handleRegenerateWeek}
            disabled={calJob.status === 'running' || isLoading}
            className="forge-btn-secondary text-[13px] py-2.5 gap-2"
          >
            <RefreshCw size={13} className={calJob.status === 'running' || isLoading ? 'animate-spin' : ''} />
            {calJob.status === 'running' ? 'AI working…' : 'Regenerate'}
          </button>
          <button onClick={handleAddPost} className="forge-btn-primary text-[13px] py-2.5 gap-2">
            <Plus size={13} />
            Add post
          </button>
        </div>
      </div>

      {!hasTextKey() && (
        <div className="mb-6 p-4 rounded-xl border flex items-center justify-between gap-4" style={{ background: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.15)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
              <AlertCircle size={16} className="text-red-400" />
            </div>
            <div>
              <p className="text-[13px] font-medium text-white">Mock Mode Active</p>
              <p className="text-[12px] text-white/50">Configure your API keys in Settings to generate actual custom 7-day content plans.</p>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        {/* Goal remix */}
        <div className="flex items-center gap-2">
          <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.3)' }}>Goal:</span>
          <div className="flex gap-1">
            {goals.map(g => (
              <button key={g} onClick={() => setActiveGoal(g)}
                disabled={isLoading}
                className="text-[11px] px-3 py-1 rounded-full capitalize transition-all duration-150"
                style={{
                  background: activeGoal === g ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)',
                  color: activeGoal === g ? 'white' : 'rgba(255,255,255,0.4)',
                  border: '1px solid',
                  borderColor: activeGoal === g ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.07)',
                  cursor: isLoading ? 'not-allowed' : 'pointer'
                }}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Week nav */}
        <div className="flex items-center gap-2">
          <button onClick={() => setWeek(w => w - 1)} disabled={isLoading} title="Previous Week" className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)', cursor: isLoading ? 'not-allowed' : 'pointer' }}>
            <ChevronLeft size={13} />
          </button>
          <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {week === 0 ? 'This week' : week > 0 ? `+${week}w` : `${week}w`}
          </span>
          <button onClick={() => setWeek(w => w + 1)} disabled={isLoading} title="Next Week" className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)', cursor: isLoading ? 'not-allowed' : 'pointer' }}>
            <ChevronRight size={13} />
          </button>
        </div>
      </div>

      {/* Theme legend */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.2)' }}>Themes:</span>
        {Object.entries(THEMES).map(([key, t]) => (
          <div key={key} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ background: t.color, opacity: 0.6 }} />
            <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{t.label}</span>
          </div>
        ))}
      </div>

      {/* 7-day grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Day headers */}
        {DAYS.map((day, i) => {
          const dateObj = weekDates[i]
          const dateStr = dateObj ? dateObj.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }) : ''
          const isToday = week === 0 && dateObj && dateObj.toDateString() === new Date().toDateString()
          return (
            <div key={day} className="pb-2 border-b text-center" style={{ borderColor: isToday ? 'var(--theme-accent)' : 'rgba(255,255,255,0.07)' }}>
              <span className="text-[12px] font-semibold block" style={{ color: isToday ? 'var(--theme-accent)' : 'white' }}>
                {day}
              </span>
              <span className="text-[10px]" style={{ color: isToday ? 'var(--theme-accent)' : 'rgba(255,255,255,0.25)' }}>
                {dateStr}
              </span>
            </div>
          )
        })}

        {/* Day cells */}
        {isLoading || calJob.status === 'running' || !calendar ? (
          DAYS.map(day => (
            <div key={day} className="space-y-2 pt-2">
              <SkeletonCard />
              <div className="w-full h-12 bg-white/[0.01] border border-dashed border-white/5 rounded-xl animate-pulse" />
            </div>
          ))
        ) : (
          calendar.map((dayData, dayIdx) => {
            const dateObj = weekDates[dayIdx]
            const isToday = week === 0 && dateObj && dateObj.toDateString() === new Date().toDateString()
            return (
              <div key={dayData.day} className="space-y-2 pt-2 px-1 rounded-xl transition-all duration-150"
                style={{
                  background: isToday ? 'rgba(255,255,255,0.02)' : 'transparent',
                  border: isToday ? '1px solid rgba(255,255,255,0.04)' : '1px solid transparent'
                }}>
                {(dayData.posts || []).map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onCopy={handleCopy}
                    onSchedule={handleSchedule}
                    onRegenerate={(id) => handleRegeneratePost(id, dayData.day)}
                    isRegenerating={regeneratingPostId === post.id}
                    copiedId={copiedId}
                    onOpen={(p) => { setSelectedPost(p); setSelectedDay(dayData.day) }}
                  />
                ))}
                <EmptySlot
                  day={dayData.day}
                  onGenerate={handleGenerateSlot}
                  isGenerating={generatingSlot === dayData.day}
                />
              </div>
            )
          })
        )}
      </div>

      {/* Stats bar */}
      <div className="mt-6 flex items-center gap-6 p-4 rounded-xl border" style={{ background: 'var(--theme-card-bg)', borderColor: 'var(--theme-border-color)' }}>
        {[
          { label: 'Total posts', value: totalPosts },
          { label: 'Scheduled', value: scheduled },
          { label: 'Drafts', value: drafts },
          { label: 'Posted', value: calendar ? calendar.reduce((s, d) => s + (d.posts ? d.posts.filter(p => p.status === 'posted').length : 0), 0) : 0 },
        ].map(stat => (
          <div key={stat.label} className="flex items-center gap-2">
            <span className="text-[18px] font-semibold text-white">{stat.value}</span>
            <span className="text-[12px]" style={{ color: 'var(--theme-text-muted)' }}>{stat.label}</span>
          </div>
        ))}
        <div className="ml-auto">
          <button onClick={handleScheduleAllDrafts} className="forge-btn-primary text-[12px] py-2 px-4 gap-1.5">
            <Calendar size={11} />
            Schedule all drafts
          </button>
        </div>
      </div>

      {/* Add Custom Post Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div 
            className="w-full max-w-md rounded-2xl border p-6 space-y-6 shadow-2xl relative"
            style={{ 
              background: 'var(--theme-card-bg)', 
              borderColor: 'var(--theme-border-color)',
              color: 'var(--theme-text)'
            }}
          >
            <div>
              <h3 className="text-[18px] font-bold text-white mb-1.5">Add Custom Post</h3>
              <p className="text-[12px]" style={{ color: 'var(--theme-text-muted)' }}>
                Create a customized draft post to add to your calendar.
              </p>
            </div>

            <div className="space-y-4">
              {/* Title Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>Post Title / Hook</label>
                <div className="forge-input-wrap">
                  <input
                    type="text"
                    className="forge-input text-[13px]"
                    placeholder="e.g. 5 secrets to scaling your agency"
                    value={newPostData.title}
                    onChange={e => setNewPostData(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
              </div>

              {/* Day & Platform */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>Day of Week</label>
                  <select
                    className="w-full rounded-xl border p-2.5 text-[13px] bg-[#141414] text-white"
                    style={{ borderColor: 'var(--theme-border-color)' }}
                    value={newPostData.day}
                    onChange={e => setNewPostData(prev => ({ ...prev, day: e.target.value }))}
                  >
                    {DAYS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>Platform</label>
                  <select
                    className="w-full rounded-xl border p-2.5 text-[13px] bg-[#141414] text-white"
                    style={{ borderColor: 'var(--theme-border-color)' }}
                    value={newPostData.platform}
                    onChange={e => {
                      const platform = e.target.value
                      const defaultTypes = PLATFORM_TYPES[platform] || ['Post']
                      setNewPostData(prev => ({ 
                        ...prev, 
                        platform, 
                        type: defaultTypes[0] 
                      }))
                    }}
                  >
                    {Object.keys(PLATFORM_TYPES).map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Format Type & Theme */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>Format Type</label>
                  <select
                    className="w-full rounded-xl border p-2.5 text-[13px] bg-[#141414] text-white"
                    style={{ borderColor: 'var(--theme-border-color)' }}
                    value={newPostData.type}
                    onChange={e => setNewPostData(prev => ({ ...prev, type: e.target.value }))}
                  >
                    {(PLATFORM_TYPES[newPostData.platform] || ['Post']).map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>Campaign Theme</label>
                  <select
                    className="w-full rounded-xl border p-2.5 text-[13px] bg-[#141414] text-white"
                    style={{ borderColor: 'var(--theme-border-color)' }}
                    value={newPostData.theme}
                    onChange={e => setNewPostData(prev => ({ ...prev, theme: e.target.value }))}
                  >
                    {Object.entries(THEMES).map(([k, t]) => (
                      <option key={k} value={k}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>Initial Status</label>
                <div className="flex gap-4">
                  {['draft', 'scheduled'].map(s => (
                    <label key={s} className="flex items-center gap-2 text-[13px] cursor-pointer text-white">
                      <input
                        type="radio"
                        name="newPostStatus"
                        checked={newPostData.status === s}
                        onChange={() => setNewPostData(prev => ({ ...prev, status: s }))}
                        className="accent-[var(--theme-accent)]"
                      />
                      <span className="capitalize">{s}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--theme-border-color)' }}>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="forge-btn-secondary py-2 px-4 text-[13px]"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNewPost}
                disabled={!newPostData.title.trim()}
                className="forge-btn-primary py-2 px-5 text-[13px] disabled:opacity-50"
              >
                Add to Calendar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── POST DETAILS / EDIT MODAL ────────────────────── */}
      {selectedPost && (
        <PostDetailsModal
          post={selectedPost}
          day={selectedDay}
          onClose={() => { setSelectedPost(null); setSelectedDay(null) }}
          onSave={handleSaveEditedPost}
        />
      )}
    </div>
  )
}

// ─── POST DETAILS MODAL ────────────────────────────────────────

const STATUS_COLORS = {
  draft:     { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.45)' },
  scheduled: { background: 'rgba(96,165,250,0.15)',  color: 'rgba(96,165,250,0.9)'  },
  posted:    { background: 'rgba(52,211,153,0.15)',   color: 'rgba(52,211,153,0.9)'  },
  failed:    { background: 'rgba(255,59,48,0.15)',    color: 'rgba(255,80,80,0.9)'   },
}

function PostDetailsModal({ post, day, onClose, onSave }) {
  const [edited, setEdited] = useState({ ...post })
  const [activeTab, setActiveTab] = useState('details')

  // Close on Escape
  useEffect(() => {
    const fn = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [onClose])

  const themeColor = THEMES[edited.theme]?.color || 'rgba(255,255,255,0.5)'
  const themeBg    = THEMES[edited.theme]?.bg    || 'rgba(255,255,255,0.06)'

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm"
      style={{ animation: 'fadeIn 0.15s ease' }}
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl border shadow-2xl"
        onClick={e => e.stopPropagation()}
        style={{
          background: 'linear-gradient(135deg, #111 0%, #0d0d0d 100%)',
          borderColor: 'rgba(255,255,255,0.1)',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Accent bar */}
        <div className="h-0.5 w-full rounded-t-3xl sm:rounded-t-2xl" style={{ background: `linear-gradient(90deg, ${themeColor} 0%, transparent 70%)` }} />

        {/* Header */}
        <div className="flex items-start gap-3 px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: themeBg }}>
            <Pencil size={13} style={{ color: themeColor }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-bold text-white leading-tight truncate">{edited.title || 'Untitled Post'}</p>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <span className="text-[10px] font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>{edited.platform}</span>
              <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
              <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{edited.type}</span>
              <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
              <span
                className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full capitalize"
                style={STATUS_COLORS[edited.status] || STATUS_COLORS.draft}
              >{edited.status}</span>
              {day && (
                <>
                  <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
                  <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>{day}</span>
                </>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-colors"
            style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.4)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
          >
            <X size={13} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          {[['details', 'Details'], ['body', 'Caption / Body']].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className="px-5 py-2.5 text-[12px] font-semibold relative transition-colors"
              style={{ color: activeTab === id ? 'white' : 'rgba(255,255,255,0.35)' }}
            >
              {label}
              {activeTab === id && (
                <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full" style={{ background: themeColor }} />
              )}
            </button>
          ))}
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 p-5" style={{ scrollbarWidth: 'none' }}>
          {activeTab === 'details' && (
            <div className="space-y-4">

              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider block" style={{ color: 'rgba(255,255,255,0.35)' }}>Post Title / Hook</label>
                <div className="forge-input-wrap">
                  <input
                    type="text"
                    className="forge-input text-[13px]"
                    value={edited.title || ''}
                    onChange={e => setEdited(p => ({ ...p, title: e.target.value }))}
                    placeholder="Your hook..."
                  />
                </div>
              </div>

              {/* Platform & Type */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider block" style={{ color: 'rgba(255,255,255,0.35)' }}>Platform</label>
                  <select
                    className="w-full rounded-xl border p-2.5 text-[13px] bg-[#141414] text-white outline-none"
                    style={{ borderColor: 'rgba(255,255,255,0.1)' }}
                    value={edited.platform || 'Instagram'}
                    onChange={e => {
                      const pl = e.target.value
                      setEdited(p => ({ ...p, platform: pl, type: (PLATFORM_TYPES[pl] || ['Post'])[0] }))
                    }}
                  >
                    {Object.keys(PLATFORM_TYPES).map(pl => <option key={pl} value={pl}>{pl}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider block" style={{ color: 'rgba(255,255,255,0.35)' }}>Format</label>
                  <select
                    className="w-full rounded-xl border p-2.5 text-[13px] bg-[#141414] text-white outline-none"
                    style={{ borderColor: 'rgba(255,255,255,0.1)' }}
                    value={edited.type || 'Post'}
                    onChange={e => setEdited(p => ({ ...p, type: e.target.value }))}
                  >
                    {(PLATFORM_TYPES[edited.platform] || ['Post']).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {/* Theme & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider block" style={{ color: 'rgba(255,255,255,0.35)' }}>Theme</label>
                  <select
                    className="w-full rounded-xl border p-2.5 text-[13px] bg-[#141414] text-white outline-none"
                    style={{ borderColor: 'rgba(255,255,255,0.1)' }}
                    value={edited.theme || 'value'}
                    onChange={e => setEdited(p => ({ ...p, theme: e.target.value }))}
                  >
                    {Object.entries(THEMES).map(([k, t]) => <option key={k} value={k}>{t.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider block" style={{ color: 'rgba(255,255,255,0.35)' }}>Status</label>
                  <div className="flex gap-1 flex-wrap">
                    {['draft', 'scheduled', 'posted'].map(s => (
                      <button
                        key={s}
                        onClick={() => setEdited(p => ({ ...p, status: s }))}
                        className="flex-1 py-2 rounded-xl text-[11px] font-semibold capitalize transition-all border"
                        style={edited.status === s
                          ? { ...(STATUS_COLORS[s]), borderColor: 'transparent' }
                          : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.3)', borderColor: 'rgba(255,255,255,0.08)' }
                        }
                      >{s}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'body' && (
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider block mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>Caption / Body Text</label>
              <div className="forge-input-wrap">
                <textarea
                  className="forge-input text-[13px] resize-y min-h-[200px] py-3 leading-relaxed"
                  placeholder="Write the full caption, email body, or script here..."
                  value={edited.body || ''}
                  onChange={e => setEdited(p => ({ ...p, body: e.target.value }))}
                />
              </div>
              <p className="text-[11px] mt-2" style={{ color: 'rgba(255,255,255,0.2)' }}>{(edited.body || '').length} chars</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between gap-3 px-5 py-4 border-t"
          style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.3)' }}
        >
          <button onClick={onClose} className="forge-btn-secondary py-2 px-4 text-[13px]">Discard</button>
          <button
            onClick={() => onSave(edited)}
            disabled={!(edited.title || '').trim()}
            className="forge-btn-primary py-2 px-5 text-[13px] disabled:opacity-50 gap-1.5"
          >
            <Check size={12} />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}
