import { useState, useEffect, useRef } from 'react'
import { useForge } from '../../App'
import { Sparkles, RefreshCw, Copy, Check, Calendar, Plus, Users, MessageSquare, Radio, ChevronRight, ChevronDown, Link2, X, Trash2, Clock } from 'lucide-react'
import { generateStudioContent, hasTextKey } from '../../services/ai'

const COMMUNITY_CONTENT_TYPES = [
  {
    id: 'welcome',
    icon: Users,
    label: 'Welcome post',
    description: 'Onboard new members with energy',
    example: `Welcome to [Community Name]! 🎉\n\nYou made it. This is the place where creators come to actually build - not just learn.\n\nHere's what to do first:\n→ Introduce yourself below\n→ Check the pinned resources\n→ Join the weekly challenge thread\n\nTag someone you think should be here. Let's build together.`,
  },
  {
    id: 'challenge',
    icon: Radio,
    label: 'Weekly challenge',
    description: 'Drive engagement and accountability',
    example: `This week's challenge: ⚡\n\nPost ONE piece of content that directly promotes your offer. No hiding behind value posts.\n\nDirect ask. Clear CTA. Ship it.\n\nTag me when you post it - I'll reshare the best ones.\n\nWho's in? Comment "IN" below 👇`,
  },
  {
    id: 'discussion',
    icon: MessageSquare,
    label: 'Discussion starter',
    description: 'Get members talking and engaging',
    example: `Quick question for the group:\n\nWhat's the ONE thing holding you back from monetizing right now?\n\nBe honest. I'm going to address the top 3 answers this week.\n\nDrop your answer below 👇`,
  },
  {
    id: 'announcement',
    icon: Plus,
    label: 'Member announcement',
    description: 'Share news, drops, or updates',
    example: `Big news for the community:\n\n[Product / feature / event] is live.\n\nHere's what this means for you:\n→ [Benefit 1]\n→ [Benefit 2]\n→ [Benefit 3]\n\nCheck it out here: [link]\n\nQuestions? Drop them below.`,
  },
  {
    id: 'recap',
    icon: ChevronRight,
    label: 'Weekly recap',
    description: 'Celebrate wins and keep momentum',
    example: `Week recap 🏁\n\nThis week we:\n✓ Hit a new milestone\n✓ Had members ship their first thing\n✓ Answered questions live\n\nDrop your biggest win from this week below 👇`,
  },
  {
    id: 'qa',
    icon: MessageSquare,
    label: 'Audience Q&A prompt',
    description: 'Collect questions for a live or post',
    example: `I'm doing a community Q&A soon.\n\nAsk me anything about my niche:\n→ How to get started\n→ What I'd do differently\n→ My biggest lessons\n\nDrop your question below - I'll answer every one.`,
  },
]

// ─── Mini Calendar Component ──────────────────────────────────────────────────

const DAYS_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function MiniCalendar({ onSelect, onClose }) {
  const [viewDate, setViewDate] = useState(new Date())
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1))
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1))

  return (
    <div
      ref={ref}
      className="absolute z-50 mt-1 rounded-xl border shadow-2xl p-3"
      style={{
        background: '#0e0e0e',
        borderColor: 'rgba(255,255,255,0.1)',
        width: 260,
        right: 0,
        top: '100%',
      }}
    >
      {/* Month nav */}
      <div className="flex items-center justify-between mb-2 px-1">
        <button onClick={prevMonth} className="w-6 h-6 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all">
          <ChevronRight size={13} className="rotate-180" />
        </button>
        <span className="text-[12px] font-semibold text-white">{MONTHS[month]} {year}</span>
        <button onClick={nextMonth} className="w-6 h-6 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all">
          <ChevronRight size={13} />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {DAYS_SHORT.map(d => (
          <div key={d} className="text-center text-[9px] font-semibold text-white/25 py-1">{d}</div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />
          const dateObj = new Date(year, month, day)
          dateObj.setHours(0, 0, 0, 0)
          const isPast = dateObj < today
          const isToday = dateObj.getTime() === today.getTime()

          return (
            <button
              key={day}
              disabled={isPast}
              onClick={() => {
                onSelect(dateObj)
                onClose()
              }}
              className="w-full aspect-square rounded-lg flex items-center justify-center text-[11px] font-medium transition-all duration-100"
              style={{
                color: isPast ? 'rgba(255,255,255,0.15)' : isToday ? 'white' : 'rgba(255,255,255,0.6)',
                background: isToday ? 'rgba(255,255,255,0.12)' : 'transparent',
                cursor: isPast ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={e => {
                if (!isPast) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
                  e.currentTarget.style.color = 'white'
                }
              }}
              onMouseLeave={e => {
                if (!isPast) {
                  e.currentTarget.style.background = isToday ? 'rgba(255,255,255,0.12)' : 'transparent'
                  e.currentTarget.style.color = isToday ? 'white' : 'rgba(255,255,255,0.6)'
                }
              }}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main Community Component ─────────────────────────────────────────────────

export default function Community() {
  const { creatorData, incrementAiActions, setApiModalOpen, triggerToast, syncSessionToDb } = useForge()
  const [selectedType, setSelectedType] = useState(null)
  const [generated, setGenerated] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)
  const [showMembers, setShowMembers] = useState(false)

  const handle = creatorData?.handle || '@creator'
  const productName = creatorData.productName || 'Creator Academy'
  const cleanHandle = handle.replace(/^@/, '').replace(/\//g, '-')

  // ── Members ──
  const getMembersKey = () => `forge_${cleanHandle}_community_members`
  const [members, setMembers] = useState(() => {
    try {
      const cached = localStorage.getItem(getMembersKey())
      return cached ? JSON.parse(cached) : []
    } catch { return [] }
  })

  // Sync members from localStorage on focus (when join page adds one)
  useEffect(() => {
    const handler = () => {
      try {
        const cached = localStorage.getItem(getMembersKey())
        if (cached) setMembers(JSON.parse(cached))
      } catch {}
    }
    window.addEventListener('focus', handler)
    return () => window.removeEventListener('focus', handler)
  }, [cleanHandle])

  // ── Scheduled posts ──
  const getScheduledKey = () => `forge_${cleanHandle}_community_scheduled`
  const [scheduledPosts, setScheduledPosts] = useState(() => {
    try {
      const cached = localStorage.getItem(getScheduledKey())
      return cached ? JSON.parse(cached) : []
    } catch { return [] }
  })

  const saveScheduledPosts = (posts) => {
    setScheduledPosts(posts)
    localStorage.setItem(getScheduledKey(), JSON.stringify(posts))
    setTimeout(() => { if (syncSessionToDb) syncSessionToDb() }, 50)
  }

  // ── Invite link ──
  const inviteLink = `${window.location.origin}/join/${cleanHandle}`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
    if (triggerToast) triggerToast('Invite link copied!', 'success')
  }

  // ── AI Generation ──
  const handleGenerate = async (type) => {
    setSelectedType(type)
    setGenerated(null)
    setShowCalendar(false)

    if (!hasTextKey()) {
      if (setApiModalOpen) setApiModalOpen(true)
      return
    }

    setIsGenerating(true)

    try {
      const contentType = { label: type.label, platform: 'Community' }
      const inputContext = `${type.description}. Write for a community called "${productName}" by creator ${handle}. Make it feel authentic, warm, and actionable.`
      const result = await generateStudioContent(contentType, inputContext, creatorData, 'Confident')
      setGenerated(result || type.example)
      if (incrementAiActions) incrementAiActions()
    } catch (err) {
      console.error('[Forge Community] AI generation failed:', err)
      setGenerated(type.example)
      if (triggerToast) triggerToast('AI unavailable — showing template', 'error')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = () => {
    if (!generated) return
    navigator.clipboard.writeText(generated)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleScheduleDate = (date) => {
    if (!generated || !selectedType) return
    const post = {
      id: Date.now().toString(),
      type: selectedType.label,
      typeId: selectedType.id,
      content: generated.slice(0, 120) + (generated.length > 120 ? '…' : ''),
      fullContent: generated,
      date: date.toISOString(),
      dateLabel: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    }
    const updated = [...scheduledPosts, post].sort((a, b) => new Date(a.date) - new Date(b.date))
    saveScheduledPosts(updated)
    if (triggerToast) triggerToast(`Scheduled "${selectedType.label}" for ${post.dateLabel}`, 'success')
  }

  const handleDeleteScheduled = (id) => {
    saveScheduledPosts(scheduledPosts.filter(p => p.id !== id))
  }

  const memberStats = [
    { label: 'Members', value: members.length.toString(), sub: members.length === 0 ? 'Share your invite link' : `${members.length} joined` },
    { label: 'Scheduled', value: scheduledPosts.length.toString(), sub: scheduledPosts.length === 0 ? 'Schedule a post' : 'Posts queued' },
    { label: 'Posts this week', value: scheduledPosts.filter(p => {
      const d = new Date(p.date)
      const now = new Date()
      const weekAgo = new Date(now.getTime() - 7 * 86400000)
      return d >= weekAgo && d <= now
    }).length.toString(), sub: 'This week' },
  ]

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <p className="forge-label mb-3">Community</p>
      <h2 className="forge-heading mb-2" style={{ fontSize: 'clamp(22px, 3vw, 30px)', letterSpacing: '-0.03em' }}>
        {productName} community
      </h2>
      <p className="text-[14px] mb-6" style={{ color: 'rgba(255,255,255,0.38)' }}>
        Generate posts, challenges, and discussions — keep your community active and engaged.
      </p>

      {/* ── Invite Link Card ── */}
      <div
        className="rounded-xl border p-4 mb-6 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(139,92,246,0.06) 0%, rgba(255,255,255,0.02) 100%)',
          borderColor: 'rgba(139,92,246,0.2)',
        }}
      >
        <div className="absolute -right-6 -top-6 w-20 h-20 rounded-full bg-purple-500/10 blur-xl pointer-events-none" />
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center border" style={{ background: 'rgba(139,92,246,0.12)', borderColor: 'rgba(139,92,246,0.25)' }}>
            <Link2 size={14} className="text-purple-400" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-white">Community invite link</p>
            <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>Share this link so people can join your community</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="flex-1 px-3 py-2 rounded-lg text-[12px] font-mono truncate"
            style={{ background: 'rgba(0,0,0,0.4)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            {inviteLink}
          </div>
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium transition-all duration-150"
            style={{
              background: linkCopied ? 'rgba(52,211,153,0.15)' : 'rgba(139,92,246,0.15)',
              color: linkCopied ? '#34d399' : '#c084fc',
              border: `1px solid ${linkCopied ? 'rgba(52,211,153,0.25)' : 'rgba(139,92,246,0.25)'}`,
            }}
          >
            {linkCopied ? <Check size={12} /> : <Copy size={12} />}
            {linkCopied ? 'Copied' : 'Copy'}
          </button>
        </div>

        {/* Member count + toggle */}
        {members.length > 0 && (
          <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <button
              onClick={() => setShowMembers(o => !o)}
              className="flex items-center gap-2 text-[12px] font-medium transition-colors"
              style={{ color: 'rgba(255,255,255,0.45)' }}
              onMouseEnter={e => e.currentTarget.style.color = 'white'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.45)'}
            >
              <Users size={12} />
              {members.length} member{members.length !== 1 ? 's' : ''} joined
              <ChevronDown size={11} className={`transition-transform duration-200 ${showMembers ? 'rotate-180' : ''}`} />
            </button>
            {showMembers && (
              <div className="mt-2 space-y-1.5 max-h-40 overflow-y-auto">
                {members.map((m, i) => (
                  <div key={i} className="flex items-center gap-3 px-2 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: 'rgba(139,92,246,0.2)', color: '#c084fc' }}>
                      {(m.name || m.email || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-white truncate">{m.name || 'Anonymous'}</p>
                      <p className="text-[10px] truncate" style={{ color: 'rgba(255,255,255,0.3)' }}>{m.email}</p>
                    </div>
                    <span className="text-[9px] flex-shrink-0" style={{ color: 'rgba(255,255,255,0.2)' }}>
                      {m.joinedAt ? new Date(m.joinedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {memberStats.map(s => (
          <div key={s.label} className="rounded-xl border p-4" style={{ background: '#111', borderColor: 'rgba(255,255,255,0.07)' }}>
            <p className="text-[12px] mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{s.label}</p>
            <p className="text-[22px] font-semibold tracking-tight text-white">{s.value}</p>
            <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-5">
        {/* Left: Content type grid */}
        <div>
          <p className="forge-label mb-3">Generate</p>
          <div className="space-y-2">
            {COMMUNITY_CONTENT_TYPES.map(type => (
              <button
                key={type.id}
                onClick={() => handleGenerate(type)}
                className="w-full text-left flex items-start gap-3 p-3.5 rounded-xl border transition-all duration-150"
                style={{
                  background: selectedType?.id === type.id ? 'rgba(255,255,255,0.07)' : '#111',
                  borderColor: selectedType?.id === type.id ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.07)',
                }}
                onMouseEnter={e => { if (selectedType?.id !== type.id) { e.currentTarget.style.background = '#161616'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)' } }}
                onMouseLeave={e => { if (selectedType?.id !== type.id) { e.currentTarget.style.background = '#111'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)' } }}
              >
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.07)' }}>
                  <type.icon size={13} className="text-white/50" />
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-white">{type.label}</p>
                  <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>{type.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Output */}
        <div>
          {isGenerating ? (
            <div className="rounded-2xl border p-6 flex items-center gap-3" style={{ background: '#111', borderColor: 'rgba(255,255,255,0.08)' }}>
              <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center">
                <Sparkles size={11} className="text-black" />
              </div>
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'rgba(255,255,255,0.4)', animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
              <span className="text-[13px]" style={{ color: 'rgba(255,255,255,0.35)' }}>AI writing {selectedType?.label}...</span>
            </div>
          ) : generated ? (
            <div className="rounded-2xl border overflow-hidden" style={{ background: '#111', borderColor: 'rgba(255,255,255,0.09)' }}>
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                <div className="flex items-center gap-2">
                  <Sparkles size={13} className="text-white/40" />
                  <span className="text-[13px] font-semibold text-white">{selectedType?.label}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleCopy} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium" style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.6)' }}>
                    {copied ? <Check size={11} /> : <Copy size={11} />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 max-h-80 overflow-y-auto">
                <pre className="text-[13px] whitespace-pre-wrap leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'inherit' }}>
                  {generated}
                </pre>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 px-5 py-3 border-t relative" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                <button onClick={() => handleGenerate(selectedType)} className="forge-btn-secondary text-[12px] py-2 px-4 gap-1.5">
                  <RefreshCw size={11} />
                  Regenerate
                </button>
                <div className="ml-auto relative">
                  <button
                    onClick={() => setShowCalendar(o => !o)}
                    className="forge-btn-primary text-[12px] py-2 px-4 gap-1.5"
                  >
                    <Calendar size={11} />
                    Schedule
                  </button>
                  {showCalendar && (
                    <MiniCalendar
                      onSelect={handleScheduleDate}
                      onClose={() => setShowCalendar(false)}
                    />
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border flex flex-col items-center justify-center text-center py-16 px-8" style={{ borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.01)' }}>
              <Sparkles size={24} className="mb-3 text-white/25" />
              <p className="text-[14px] font-medium text-white/40 mb-1">Select a post type</p>
              <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
                Forge will generate community-ready copy personalized to {productName}.
              </p>
            </div>
          )}

          {/* ── Scheduled Posts ── */}
          {scheduledPosts.length > 0 && (
            <div className="mt-5">
              <p className="forge-label mb-3">Scheduled posts</p>
              <div className="space-y-2">
                {scheduledPosts.map(post => (
                  <div
                    key={post.id}
                    className="flex items-start gap-3 p-3.5 rounded-xl border group"
                    style={{ background: '#111', borderColor: 'rgba(255,255,255,0.07)' }}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <Clock size={13} className="text-white/40" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[12px] font-semibold text-white">{post.type}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(139,92,246,0.12)', color: '#c084fc' }}>
                          {post.dateLabel}
                        </span>
                      </div>
                      <p className="text-[11px] truncate" style={{ color: 'rgba(255,255,255,0.35)' }}>{post.content}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteScheduled(post.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ color: 'rgba(255,255,255,0.3)' }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.1)' }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; e.currentTarget.style.background = 'transparent' }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick wins */}
          <div className="mt-5">
            <p className="forge-label mb-3">Quick wins</p>
            <div className="space-y-2">
              {[
                { emoji: '👋', label: 'Post your first welcome message', typeId: 'welcome' },
                { emoji: '💬', label: 'Start a discussion to break the ice', typeId: 'discussion' },
                { emoji: '⚡', label: 'Create your first weekly challenge', typeId: 'challenge' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3.5 rounded-xl border" style={{ background: '#111', borderColor: 'rgba(255,255,255,0.07)' }}>
                  <span className="text-lg">{item.emoji}</span>
                  <span className="text-[13px] flex-1" style={{ color: 'rgba(255,255,255,0.6)' }}>{item.label}</span>
                  <button
                    onClick={() => {
                      const type = COMMUNITY_CONTENT_TYPES.find(t => t.id === item.typeId)
                      if (type) handleGenerate(type)
                    }}
                    className="text-[12px] px-3 py-1 rounded-full transition-all duration-150" style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.4)' }}
                    onMouseEnter={e => { e.target.style.background = 'rgba(255,255,255,0.12)'; e.target.style.color = 'white' }}
                    onMouseLeave={e => { e.target.style.background = 'rgba(255,255,255,0.07)'; e.target.style.color = 'rgba(255,255,255,0.4)' }}
                  >
                    Generate →
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
