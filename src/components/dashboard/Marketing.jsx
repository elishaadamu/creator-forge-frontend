import { useState, useEffect, useRef } from 'react'
import { useForge, getAccent, useBgJob } from '../../App'
import { askForgeChat, generateStudioContent, hasTextKey, generateContentCalendar } from '../../services/ai'
import {
  Sparkles, TrendingUp, Mail, Video, Share2, Users,
  RefreshCw, Copy, Check, X, Calendar, ChevronRight,
  BarChart2, AlertCircle, MessageSquare, Send, ArrowRight, Play, Minus, Pencil
} from 'lucide-react'
import AiDoesItPanel from './AiDoesItPanel'

// ─── PIXEL COACH ─────────────────────────────────────────────────────────────
// A tiny pixel-art character that coaches the creator

function getCoachMessage(trigger, creatorData) {
  const handle = creatorData.handle || '@creator'
  const displayName = creatorData.name || handle.replace('@','')
  const platformName = creatorData.platform ? (creatorData.platform.charAt(0).toUpperCase() + creatorData.platform.slice(1)) : 'social media'
  const niche = creatorData.niche || 'content creation'
  const productName = creatorData.productName || 'Creator Academy'

  switch (trigger) {
    case 'idle': {
      let msg = `Hey ${displayName}! `
      if (creatorData.followers > 0) {
        const followersFormatted = creatorData.followers >= 1_000_000
          ? `${(creatorData.followers/1_000_000).toFixed(1)}M`
          : creatorData.followers >= 1_000
            ? `${Math.round(creatorData.followers/1_000)}K`
            : creatorData.followers
        msg += `I've analyzed your ${followersFormatted} followers on ${platformName}. `
      } else {
        msg += `Welcome to your dashboard. `
      }
      if (creatorData.engagementRate > 0) {
        msg += `Your ${creatorData.engagementRate}% engagement rate shows a very warm audience. `
      }
      msg += `Since you create content in ${niche}, launching your own product is the perfect way to monetize. Let's start with your launch plan today!`
      return msg
    }
    case 'teaser':
      return `Perfect. A teaser post primes your ${platformName} audience 48-72h before launch. I wrote one for your ${niche} brand below — copy it and post today.`
    case 'email':
      return `Email converts 3-5x better than social. Your list needs to hear about ${productName} before you go wide. Here's a launch email ready to send.`
    case 'bts':
      return `Behind-the-scenes content builds more trust than promos. Here's a caption. Pair it with a quick phone video showing your work on ${productName} — no editing needed.`
    case 'calendar':
      return `Batching a full week takes 20 minutes and means you never scramble again. I filled your launch week for ${productName} below. Drag to reschedule.`
    case 'scheduled':
      return `Saved to your calendar! Next up: post your launch email tomorrow morning. Want me to write it now?`
    case 'copied':
      return `Copied! Now paste it into ${platformName} and hit post. Don't overthink it — your audience is waiting.`
    default:
      return `Hey ${displayName}! Let's build your launch plan.`
  }
}

function PixelCoach({ message, onChat }) {
  const [expanded, setExpanded]     = useState(false)
  const [displayText, setDisplayText] = useState('')
  const [charIdx, setCharIdx]       = useState(0)

  useEffect(() => {
    setDisplayText('')
    setCharIdx(0)
  }, [message])

  useEffect(() => {
    if (!expanded) return
    if (charIdx >= message.length) return
    const t = setTimeout(() => {
      setDisplayText(prev => prev + message[charIdx])
      setCharIdx(i => i + 1)
    }, 14)
    return () => clearTimeout(t)
  }, [charIdx, message, expanded])

  // When user expands, kick off typewriter
  const handleExpand = () => {
    setExpanded(true)
    setDisplayText('')
    setCharIdx(0)
  }

  if (!expanded) {
    return (
      <button
        onClick={handleExpand}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all text-left"
        style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.11)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)' }}
      >
        {/* Mini pixel avatar */}
        <svg viewBox="0 0 16 16" width="20" height="20" style={{ imageRendering: 'pixelated', flexShrink: 0 }}>
          <rect x="4" y="1" width="8" height="2" fill="#f0d0a0"/>
          <rect x="4" y="3" width="8" height="5" fill="#fde8c8"/>
          <rect x="5" y="5" width="2" height="2" fill="#2a2a2a"/>
          <rect x="9" y="5" width="2" height="2" fill="#2a2a2a"/>
          <rect x="5" y="5" width="1" height="1" fill="white"/>
          <rect x="9" y="5" width="1" height="1" fill="white"/>
          <rect x="5" y="9" width="6" height="4" fill="white"/>
        </svg>
        <span className="text-[11px] flex-1 truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>
          <span className="font-semibold text-white/60 mr-1">Forge Coach</span>
          {message.slice(0, 80)}{message.length > 80 ? '…' : ''}
        </span>
        <ChevronRight size={12} style={{ color: 'rgba(255,255,255,0.25)', flexShrink: 0 }} />
      </button>
    )
  }

  return (
    <div className="flex items-end gap-3">
      {/* Pixel character */}
      <div className="flex-shrink-0" style={{ width: 36, height: 36 }}>
        <svg viewBox="0 0 16 16" width="36" height="36" style={{ imageRendering: 'pixelated' }}>
          <rect x="4" y="1" width="8" height="2" fill="#f0d0a0"/>
          <rect x="3" y="2" width="1" height="2" fill="#f0d0a0"/>
          <rect x="12" y="2" width="1" height="2" fill="#f0d0a0"/>
          <rect x="4" y="3" width="8" height="5" fill="#fde8c8"/>
          <rect x="5" y="5" width="2" height="2" fill="#2a2a2a"/>
          <rect x="9" y="5" width="2" height="2" fill="#2a2a2a"/>
          <rect x="5" y="5" width="1" height="1" fill="white"/>
          <rect x="9" y="5" width="1" height="1" fill="white"/>
          <rect x="6" y="7" width="1" height="1" fill="#c0806a"/>
          <rect x="7" y="8" width="2" height="1" fill="#c0806a"/>
          <rect x="9" y="7" width="1" height="1" fill="#c0806a"/>
          <rect x="5" y="9" width="6" height="4" fill="white"/>
          <rect x="7" y="9" width="2" height="1" fill="#e0e0e0"/>
          <rect x="3" y="9" width="2" height="3" fill="white"/>
          <rect x="11" y="9" width="2" height="3" fill="white"/>
        </svg>
      </div>

      {/* Speech bubble */}
      <div className="flex-1 relative">
        <div
          className="rounded-2xl rounded-bl-sm px-4 py-3 relative"
          style={{ background: 'var(--theme-card-bg)', border: '1px solid var(--theme-border-color)' }}
        >
          {/* Collapse button */}
          <button
            onClick={() => setExpanded(false)}
            className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)' }}
          >
            <X size={10} />
          </button>

          <p className="text-[12px] leading-relaxed pr-6" style={{ color: 'var(--theme-text)', opacity: 0.8 }}>
            {displayText}
            {charIdx < message.length && (
              <span className="cursor-blink text-white/40">|</span>
            )}
          </p>

          {charIdx >= message.length && (
            <div className="flex items-center gap-2 mt-2 pt-2" style={{ borderTop: '1px solid var(--theme-border-color)' }}>
              <button
                onClick={onChat}
                className="flex items-center gap-1.5 text-[11px] transition-all duration-150"
                style={{ color: 'var(--theme-text-muted)' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--theme-text)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--theme-text-muted)'}
              >
                <MessageSquare size={10} /> Reply to Forge coach
              </button>
            </div>
          )}
        </div>
        {/* Bubble tail */}
        <div className="absolute -left-2 bottom-3 w-0 h-0"
          style={{ borderTop: '6px solid transparent', borderBottom: '6px solid transparent', borderRight: '8px solid var(--theme-card-bg)' }} />
      </div>
    </div>
  )
}

// ─── WEEKLY CALENDAR ─────────────────────────────────────────────────────────

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const TODAY_IDX = (new Date().getDay() + 6) % 7 // 0=Mon

const INITIAL_WEEK = [
  { day: 'Mon', posts: [{ id: 'init-mon-1', type: 'reel', label: 'Launch teaser reel', platform: 'IG', color: 'rgba(225,48,108,0.25)', done: false }] },
  { day: 'Tue', posts: [{ id: 'init-tue-1', type: 'email', label: 'Early access email', platform: 'Email', color: 'rgba(255,255,255,0.12)', done: false }] },
  { day: 'Wed', posts: [{ id: 'init-wed-1', type: 'thread', label: '5 things I wish I knew', platform: 'X', color: 'rgba(96,165,250,0.2)', done: false }, { id: 'init-wed-2', type: 'story', label: 'BTS story', platform: 'IG', color: 'rgba(225,48,108,0.15)', done: false }] },
  { day: 'Thu', posts: [{ id: 'init-thu-1', type: 'live', label: 'YouTube live — product intro', platform: 'YT', color: 'rgba(255,59,48,0.2)', done: false }] },
  { day: 'Fri', posts: [{ id: 'init-fri-1', type: 'post', label: 'Launch day announcement', platform: 'All', color: 'rgba(255,255,255,0.1)', done: false }] },
  { day: 'Sat', posts: [] },
  { day: 'Sun', posts: [{ id: 'init-sun-1', type: 'recap', label: 'Week 1 recap + results', platform: 'YT', color: 'rgba(255,59,48,0.15)', done: false }] },
]

function WeekCalendar({ week, onAddPost, accentRgb, isLoading, onCardClick }) {
  const getWeekDates = () => {
    const dates = []
    const today = new Date()
    const currentDay = today.getDay()
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay
    for (let i = 0; i < 7; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() + distanceToMonday + i)
      dates.push(d)
    }
    return dates
  }
  const weekDates = getWeekDates()

  if (isLoading || !week || week.length === 0) {
    return (
      <div className="grid grid-cols-7 gap-1.5 animate-pulse">
        {DAYS.map((day, i) => {
          const dateStr = weekDates[i].toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })
          return (
            <div key={day}
              className="rounded-xl overflow-hidden"
              style={{
                background: 'var(--theme-card-bg)',
                border: '1px solid var(--theme-border-color)',
                minHeight: 90,
              }}
            >
              <div className="px-2 py-1.5 flex items-center justify-between"
                style={{ borderBottom: '1px solid var(--theme-border-color)' }}>
                <div className="flex flex-col">
                  <span className="text-[10px] font-semibold text-white/20">
                    {day}
                  </span>
                  <span className="text-[8px] text-white/10 mt-0.5">
                    {dateStr}
                  </span>
                </div>
              </div>
              <div className="p-1.5 space-y-1">
                <div className="w-full h-8 rounded-md bg-white/5" />
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-7 gap-1.5">
      {week.map((dayData, i) => {
        const isToday = i === TODAY_IDX
        const dateStr = weekDates[i].toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })
        return (
          <div key={`${dayData.day || 'day'}-${i}`}
            className="rounded-xl overflow-hidden"
            style={{
              background: isToday ? 'var(--theme-accent-bg)' : 'var(--theme-card-bg)',
              border: `1px solid ${isToday ? 'var(--theme-accent)' : 'var(--theme-border-color)'}`,
              minHeight: 90,
            }}
          >
            <div className="px-2 py-1.5 flex items-center justify-between"
              style={{ borderBottom: '1px solid var(--theme-border-color)' }}>
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold"
                  style={{ color: isToday ? 'var(--theme-text)' : 'var(--theme-text-muted)' }}>
                  {dayData.day}
                </span>
                <span className="text-[8px]" style={{ color: isToday ? 'var(--theme-accent)' : 'rgba(255,255,255,0.2)' }}>
                  {dateStr}
                </span>
              </div>
              {isToday && <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--theme-accent)' }} />}
            </div>
            <div className="p-1.5 space-y-1">
              {(dayData.posts || []).map((post, j) => (
                <div key={post.id ? `post-id-${post.id}-${j}` : `post-idx-${dayData.day}-${j}`}
                  className="group/card relative rounded-lg cursor-pointer transition-all duration-150 hover:brightness-110"
                  style={{ background: post.color }}
                  onClick={() => onCardClick && onCardClick(post, dayData.day)}
                >
                  {/* Platform badge + edit icon row */}
                  <div className="flex items-center justify-between px-1.5 pt-1 pb-0.5">
                    <span
                      className="text-[7.5px] font-bold uppercase tracking-widest"
                      style={{ color: 'rgba(255,255,255,0.55)' }}
                    >{post.platform}</span>
                    <button
                      onClick={e => { e.stopPropagation(); onCardClick && onCardClick(post, dayData.day) }}
                      className="opacity-0 group-hover/card:opacity-100 transition-opacity w-3.5 h-3.5 flex items-center justify-center rounded-sm flex-shrink-0"
                      style={{ background: 'rgba(0,0,0,0.3)', color: 'rgba(255,255,255,0.8)' }}
                      title="Edit post"
                    >
                      <Pencil size={7} />
                    </button>
                  </div>
                  {/* Post label */}
                  <p
                    className="px-1.5 pb-0.5 text-[8.5px] font-semibold leading-snug"
                    style={{ color: 'rgba(255,255,255,0.82)' }}
                  >{post.label}</p>
                  {/* Type pill at bottom */}
                  {post.type && (
                    <div className="px-1.5 pb-1.5 pt-0.5">
                      <span
                        className="inline-block text-[6px] font-bold uppercase tracking-widest px-1 py-0.5 rounded-sm"
                        style={{ background: 'rgba(0,0,0,0.25)', color: 'rgba(255,255,255,0.45)' }}
                      >{post.type}</span>
                    </div>
                  )}
                </div>
              ))}
              <button
                onClick={() => onAddPost(i)}
                className="w-full py-1 rounded-md text-[9px] transition-all duration-150 opacity-0 hover:opacity-100"
                style={{ color: 'rgba(255,255,255,0.25)', border: '1px dashed rgba(255,255,255,0.1)' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '1'}
              >
                + add
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── GENERATED CONTENT MAP ────────────────────────────────────────────────────

function buildContent(handle, productName, niche) {
  const h = handle || '@creator'
  const p = productName || 'Creator Academy'
  const n = niche || 'your niche'

  return {
    teaser: {
      title: 'Launch Teaser Post',
      platforms: ['Instagram', 'TikTok', 'X'],
      body: `Something big is dropping this week.

I've been building this for the past 3 months and I finally feel ready to share it.

If you've been following me for a while — you already know what problem this solves.

If you're new here: I make content about ${n}. And I built the exact resource I always wished existed when I was starting out.

Friday. Link in bio. 👀

Comment "in" and I'll DM you early access.`,
    },
    email: {
      title: 'Launch Announcement Email',
      platforms: ['Email'],
      body: `Subject: It's finally here (and you get first access)

Hey —

I don't usually send emails like this. But today feels different.

I just launched ${p}.

It's the thing I've spent the last few months building for people exactly like you — people who watch my ${n} content and want to actually go deeper.

Here's what's inside:
- [Module 1 — describe it]
- [Module 2 — describe it]
- [Module 3 — describe it]
- A private community of people doing the same work

For the next 48 hours, founding members get 40% off. That price closes Friday at midnight.

→ Get in here: [your link]

I read every reply. If you have a question, just hit respond.

${h.replace('@','')}

P.S. If this isn't for you, no worries. But if you've ever thought "I wish I had a proper place to learn this from ${h}" — this is it.`,
    },
    bts: {
      title: 'Behind-the-Scenes Caption',
      platforms: ['Instagram', 'TikTok'],
      body: `POV: It's 11pm and I'm still working on this thing I'm launching Friday.

No ring light. No script. Just me, my laptop, and the same playlist I've had on repeat for 3 months.

Here's what building this actually looked like:
- Week 1: convinced myself it was a bad idea
- Week 2: realized it was actually what my audience needed
- Week 3-8: built it, broke it, rebuilt it
- This week: shipping it

The behind-the-scenes is always messier than the highlight reel. I'm sharing it anyway.

Friday. You'll see what it was all for. 👀

#buildinginpublic #${n.toLowerCase().replace(/\s+/g,'').replace(/&/g,'')} #creatorbusiness`,
    },
    calendar: {
      title: 'Your 7-Day Launch Week',
      platforms: ['All platforms'],
      body: `MONDAY — Teaser post (IG Reel, 15-30 seconds)
"Something big is coming Friday." Show your workspace or a cryptic preview. Caption: keep it short and mysterious. Goal: get people asking questions.

TUESDAY — Email your list
Subject: "Early access closes Friday." Send to your full list. Personalize the first line. Link to waitlist or product page.

WEDNESDAY — X/Twitter thread + IG Story
Thread: "5 things I learned building [product]" — ends with a soft CTA. Story: 3-5 slides showing progress. Add a poll ("are you in?").

THURSDAY — YouTube live or long-form video
30-minute session: walk through what you built and why. Take live questions. Pin your launch link in the chat. This is your highest-intent touchpoint.

FRIDAY — LAUNCH DAY
Post everywhere at 9am EST. 4-6 social posts across all platforms. Send final email to list: "It's live." Go live on IG Stories for 30 minutes. Reply to every comment within 2 hours.

SATURDAY — Social proof + momentum
Screenshot kind words. Post testimonials. Share a "Day 1 results" update. Keep the energy going.

SUNDAY — Recap + extended deadline
"Last 24 hours at this price." Email non-openers with a different subject line. Post a simple "here's what happened this week" video.`,
    },
  }
}

// ─── OUTPUT PANEL ─────────────────────────────────────────────────────────────

function OutputPanel({ content, onClose, onSchedule, onCopy, accent, onRefine, isGenerating }) {
  const [copied, setCopied] = useState(false)
  const [tone, setTone] = useState('confident')

  const handleCopy = () => {
    navigator.clipboard.writeText(content.body)
    setCopied(true)
    onCopy?.()
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-2xl border overflow-hidden animate-fade-up"
      style={{ background: 'var(--theme-card-bg)', borderColor: 'var(--theme-border-color)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b"
        style={{ borderColor: 'var(--theme-border-color)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--theme-accent)', color: 'var(--theme-btn-primary-text)' }}>
            <Sparkles size={11} className="text-current" />
          </div>
          <span className="text-[14px] font-semibold text-white">{content.title}</span>
          <div className="flex gap-1 ml-1">
            {content.platforms.map(p => (
              <span key={p} className="text-[10px] px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.4)' }}>
                {p}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {['confident', 'casual', 'bold'].map(t => (
              <button key={t} onClick={() => { setTone(t); onRefine?.(`Rewrite this using a ${t} tone.`, t); }}
                disabled={isGenerating}
                className="text-[10px] px-2 py-0.5 rounded-full capitalize transition-all disabled:opacity-50"
                style={{
                  background: tone === t ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)',
                  color: tone === t ? 'white' : 'rgba(255,255,255,0.3)',
                }}>
                {t}
              </button>
            ))}
          </div>
          <button onClick={onClose}
            className="w-6 h-6 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.4)' }}>
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 max-h-80 overflow-y-auto">
        <pre className="text-[13px] whitespace-pre-wrap leading-[1.7]"
          style={{ color: 'rgba(255,255,255,0.75)', fontFamily: 'inherit' }}>
          {content.body}
        </pre>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 px-5 py-3 border-t"
        style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <button onClick={handleCopy}
          className="forge-btn-secondary text-[12px] py-2 px-4 gap-1.5">
          {copied ? <Check size={11} /> : <Copy size={11} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
        <button onClick={() => onRefine?.('Regenerate completely fresh', tone)} disabled={isGenerating}
          className="forge-btn-secondary text-[12px] py-2 px-4 gap-1.5 disabled:opacity-50">
          <RefreshCw size={11} className={isGenerating ? "animate-spin" : ""} /> Regenerate
        </button>
        <button onClick={() => onRefine?.('Make this shorter and more concise', tone)} disabled={isGenerating}
          className="forge-btn-secondary text-[12px] py-2 px-4 disabled:opacity-50">Shorten</button>
        <button onClick={() => onRefine?.('Make this much bolder, punchier, and more aggressive', tone)} disabled={isGenerating}
          className="forge-btn-secondary text-[12px] py-2 px-4 disabled:opacity-50">Make bolder</button>
        <button onClick={onSchedule}
          className="ml-auto forge-btn-primary text-[12px] py-2 px-4 gap-1.5">
          <Calendar size={11} /> Add to calendar
        </button>
      </div>
    </div>
  )
}

// ─── COACH CHAT ──────────────────────────────────────────────────────────────

function CoachChat({ accent, handle, onClose, creatorData }) {
  const [messages, setMessages] = useState(() => {
    try {
      const cached = localStorage.getItem(`forge_${handle}_coach_messages`)
      return cached ? JSON.parse(cached) : [
        { role: 'coach', text: `Hey ${handle}! I'm your Forge coach. I've analyzed your channel and I'm here to help you launch. What do you want to work on?` }
      ]
    } catch (e) {
      console.error(e)
      return [
        { role: 'coach', text: `Hey ${handle}! I'm your Forge coach. I've analyzed your channel and I'm here to help you launch. What do you want to work on?` }
      ]
    }
  })
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)

  useEffect(() => {
    if (messages && messages.length > 0) {
      localStorage.setItem(`forge_${handle}_coach_messages`, JSON.stringify(messages))
    }
  }, [messages, handle])
  const [minimized, setMinimized] = useState(false)
  const bottomRef = useRef(null)

  const QUICK = ['What should I post today?', 'Write my launch email', 'How do I grow faster?', 'Give me 5 hooks']

  const send = async (text) => {
    const msg = text || input.trim()
    if (!msg) return
    setInput('')
    
    const newMessages = [...messages, { role: 'user', text: msg }]
    setMessages(newMessages)
    setTyping(true)
    
    try {
      const history = messages.map(m => ({
        role: m.role === 'coach' ? 'forge' : 'user',
        text: m.text
      }))
      
      const reply = await askForgeChat(msg, history, creatorData)
      setMessages(prev => [...prev, { role: 'coach', text: reply }])
    } catch (err) {
      setMessages(prev => [...prev, { role: 'coach', text: `(Error) ${err.message}` }])
    } finally {
      setTyping(false)
    }
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  return (
    <div className={`fixed bottom-6 right-6 z-50 w-96 rounded-2xl border overflow-hidden shadow-2xl transition-all duration-300 ${minimized ? 'h-[52px] cursor-pointer' : ''}`}
      style={{ background: '#0e0e0e', borderColor: 'rgba(255,255,255,0.12)' }}
      onClick={() => minimized && setMinimized(false)}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b"
        style={{ borderColor: minimized ? 'transparent' : 'rgba(255,255,255,0.07)', background: '#111' }}>
        <div style={{ width: 28, height: 28, flexShrink: 0 }}>
          <svg viewBox="0 0 16 16" width="28" height="28" style={{ imageRendering: 'pixelated' }}>
            <rect x="4" y="1" width="8" height="2" fill="#f0d0a0"/>
            <rect x="4" y="3" width="8" height="5" fill="#fde8c8"/>
            <rect x="5" y="5" width="2" height="2" fill="#2a2a2a"/>
            <rect x="9" y="5" width="2" height="2" fill="#2a2a2a"/>
            <rect x="5" y="5" width="1" height="1" fill="white"/>
            <rect x="9" y="5" width="1" height="1" fill="white"/>
            <rect x="6" y="7" width="1" height="1" fill="#c0806a"/>
            <rect x="7" y="8" width="2" height="1" fill="#c0806a"/>
            <rect x="9" y="7" width="1" height="1" fill="#c0806a"/>
            <rect x="5" y="9" width="6" height="4" fill="white"/>
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-[13px] font-semibold text-white">Forge Coach</p>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>Online and watching your metrics</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={(e) => { e.stopPropagation(); setMinimized(!minimized) }} className="text-white/25 hover:text-white/60 transition-colors">
            <Minus size={14} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onClose() }} className="text-white/25 hover:text-white/60 transition-colors">
            <X size={14} />
          </button>
        </div>
      </div>

      <div className={`transition-opacity duration-300 ${minimized ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        {/* Messages */}
        <div className="overflow-y-auto px-4 py-3 space-y-3" style={{ maxHeight: 320 }}>
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            {m.role === 'coach' && (
              <div style={{ width: 22, height: 22, flexShrink: 0, marginTop: 2 }}>
                <svg viewBox="0 0 16 16" width="22" height="22" style={{ imageRendering: 'pixelated' }}>
                  <rect x="4" y="3" width="8" height="5" fill="#fde8c8"/>
                  <rect x="5" y="5" width="2" height="2" fill="#2a2a2a"/>
                  <rect x="9" y="5" width="2" height="2" fill="#2a2a2a"/>
                  <rect x="5" y="9" width="6" height="4" fill="white"/>
                </svg>
              </div>
            )}
            <div
              className="rounded-2xl px-3 py-2.5 max-w-[80%]"
              style={{
                background: m.role === 'coach' ? '#1a1a1a' : 'white',
                borderRadius: m.role === 'coach' ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
              }}
            >
              <pre className="text-[12px] whitespace-pre-wrap leading-relaxed"
                style={{ color: m.role === 'coach' ? 'rgba(255,255,255,0.75)' : 'black', fontFamily: 'inherit' }}>
                {m.text}
              </pre>
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex gap-2">
            <div style={{ width: 22, height: 22, flexShrink: 0 }}>
              <svg viewBox="0 0 16 16" width="22" height="22" style={{ imageRendering: 'pixelated' }}>
                <rect x="4" y="3" width="8" height="5" fill="#fde8c8"/>
                <rect x="5" y="9" width="6" height="4" fill="white"/>
              </svg>
            </div>
            <div className="rounded-2xl px-3 py-2.5 flex gap-1 items-center"
              style={{ background: '#1a1a1a', borderRadius: '4px 16px 16px 16px' }}>
              {[0,1,2].map(i => (
                <div key={i} className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ background: 'rgba(255,255,255,0.4)', animationDelay: `${i*0.15}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      <div className="px-4 pb-2 flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {QUICK.map(q => (
          <button key={q} onClick={() => send(q)}
            className="flex-shrink-0 text-[10px] px-2.5 py-1 rounded-full whitespace-nowrap transition-all"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.08)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'white' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.45)' }}
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="px-4 pb-4">
        <div className="flex items-center gap-2 rounded-xl border px-3 py-2.5"
          style={{ background: '#111', borderColor: 'rgba(255,255,255,0.1)' }}>
          <input
            className="flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-white/20"
            placeholder="Ask your coach anything..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
          />
          <button onClick={() => send()}
            disabled={!input.trim()}
            className="text-white/30 hover:text-white/70 transition-colors disabled:opacity-30">
            <Send size={13} />
          </button>
        </div>
      </div>
      </div>
    </div>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

function getTodayActions(platform) {
  const p = platform ? platform.toLowerCase() : 'other'
  
  if (p === 'youtube') {
    return [
      { id: 'teaser',   priority: 'High',   label: 'Post your launch teaser video',    rationale: 'Prime your channel viewers before launch — a short teaser video or Community tab post builds massive hype.', cta: 'Generate teaser',   icon: Share2 },
      { id: 'email',    priority: 'High',   label: 'Email your list about your launch', rationale: 'Convert subscribers to buyers. Your email list will drive the highest launch conversion rate.',         cta: 'Write email',        icon: Mail },
      { id: 'bts',      priority: 'Medium', label: 'Share a behind-the-scenes Short',   rationale: 'Shorts humanize your channel and drive high-reach algorithmic discovery. Show them how you built it.',     cta: 'Generate caption',   icon: Video },
      { id: 'calendar', priority: 'Medium', label: 'Schedule your launch week uploads',  rationale: 'Consistency is key on YouTube. Plan your main videos, Shorts, and Community posts for launch week.',      cta: 'Generate week',      icon: Calendar },
    ]
  }
  if (p === 'instagram') {
    return [
      { id: 'teaser',   priority: 'High',   label: 'Post your launch teaser Reel',     rationale: 'Priming your Instagram feed with a teaser primes your fans and lets you pin a high-converting announcement post.', cta: 'Generate teaser',   icon: Share2 },
      { id: 'email',    priority: 'High',   label: 'Email your list about your launch', rationale: 'Move your IG followers to owned media. Email converts 3-5x better than a bio link.',                 cta: 'Write email',        icon: Mail },
      { id: 'bts',      priority: 'Medium', label: 'Share a behind-the-scenes Reel/Story', rationale: 'BTS Reels build trust and build intimate connections. Show the raw, unpolished building process.',   cta: 'Generate caption',   icon: Video },
      { id: 'calendar', priority: 'Medium', label: 'Schedule your launch week IG posts', rationale: 'Keep engagement high during launch week. Batch your feed posts, Stories, and Reels.',                    cta: 'Generate week',      icon: Calendar },
    ]
  }
  if (p === 'twitter' || p === 'x') {
    return [
      { id: 'teaser',   priority: 'High',   label: 'Tweet your launch teaser thread',  rationale: 'Prime your timeline. A short hook-heavy teaser thread builds early bookmarks and retweets.',              cta: 'Generate teaser',   icon: Share2 },
      { id: 'email',    priority: 'High',   label: 'Email your list about your launch', rationale: 'Email guarantees delivery. X algorithm fluctuates, but email lands directly in your followers\' primary inboxes.', cta: 'Write email',        icon: Mail },
      { id: 'bts',      priority: 'Medium', label: 'Post a behind-the-scenes thread',   rationale: 'Share screenshots and raw stats. X audiences love transparent \'build-in-public\' BTS stories.',           cta: 'Generate caption',   icon: Video },
      { id: 'calendar', priority: 'Medium', label: 'Schedule your launch week X posts',   rationale: 'Batching your X posts ensures you maintain high visibility without being glued to the timeline.',          cta: 'Generate week',      icon: Calendar },
    ]
  }
  if (p === 'tiktok') {
    return [
      { id: 'teaser',   priority: 'High',   label: 'Post your launch teaser TikTok',   rationale: 'Prime your FYP views. A high-energy teaser video generates early search demand and profile visits.',      cta: 'Generate teaser',   icon: Share2 },
      { id: 'email',    priority: 'High',   label: 'Email your list about your launch', rationale: 'Convert short-form views into direct revenue. Direct TikTok traffic to an email sequence.',               cta: 'Write email',        icon: Mail },
      { id: 'bts',      priority: 'Medium', label: 'Share a behind-the-scenes TikTok',   rationale: 'TikTok audiences connect with authentic, low-production BTS clips. Show the late nights of building.',     cta: 'Generate caption',   icon: Video },
      { id: 'calendar', priority: 'Medium', label: 'Schedule your launch week TikToks',   rationale: 'Batching video hooks and captions ensures you maintain daily uploads during your launch phase.',          cta: 'Generate week',      icon: Calendar },
    ]
  }
  if (p === 'twitch') {
    return [
      { id: 'teaser',   priority: 'High',   label: 'Stream your launch countdown teaser', rationale: 'Announce the launch live! Prime your chat with a countdown and show early previews during stream.', cta: 'Generate teaser',   icon: Share2 },
      { id: 'email',    priority: 'High',   label: 'Email your list about your launch', rationale: 'Reach viewers when offline. An email notification brings loyal chat members back for launch day.',         cta: 'Write email',        icon: Mail },
      { id: 'bts',      priority: 'Medium', label: 'Share a behind-the-scenes stream clip', rationale: 'Clip a funny or raw moment of creation. Share it on social channels to invite new viewers in.',    cta: 'Generate caption',   icon: Video },
      { id: 'calendar', priority: 'Medium', label: 'Schedule launch week stream slots',   rationale: 'Set clear start times and titles for your stream events so your community knows exactly when to tune in.', cta: 'Generate week',      icon: Calendar },
    ]
  }
  return [
    { id: 'teaser',   priority: 'High',   label: 'Post your launch teaser',          rationale: 'Last post was 4 days ago. Audiences forget fast — a teaser now primes your best fans before launch.', cta: 'Generate teaser',   icon: Share2 },
    { id: 'email',    priority: 'High',   label: 'Email your list about your launch', rationale: 'Email converts 3-5x better than social. Your list needs to hear about this before you go wide.',         cta: 'Write email',        icon: Mail },
    { id: 'bts',      priority: 'Medium', label: 'Share a behind-the-scenes reel',   rationale: 'BTS content builds trust and outperforms promos by 2x in your niche. Low effort, high payoff.',           cta: 'Generate caption',   icon: Video },
    { id: 'calendar', priority: 'Medium', label: 'Schedule your next 7 days',        rationale: 'Creators who batch weekly post 4x more consistently. Forge can fill your entire week in seconds.',        cta: 'Generate week',      icon: Calendar },
  ]
}

const PRIORITY_STYLES = {
  High:   { bg: 'rgba(255,255,255,0.12)', color: 'white' },
  Medium: { bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)' },
}


const AUTOFILL_JOB = 'autofill-week'

const THEME_COLORS = {
  'launch': 'rgba(255,255,255,0.2)',
  'value': 'rgba(96,165,250,0.2)',
  'bts': 'rgba(225,48,108,0.15)',
  'proof': 'rgba(52,211,153,0.15)',
  'cta': 'rgba(255,59,48,0.2)',
  'community': 'rgba(167,139,250,0.15)',
  'story': 'rgba(251,191,36,0.15)',
}

const THEMES = {
  launch: { label: 'Launch' },
  value: { label: 'Value' },
  bts: { label: 'BTS' },
  proof: { label: 'Proof' },
  cta: { label: 'CTA' },
  community: { label: 'Community' },
  story: { label: 'Story' },
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

function getPlatformName(platform) {
  if (!platform) return 'Instagram'
  const lower = platform.toLowerCase()
  if (lower === 'youtube' || lower === 'yt') return 'YouTube'
  if (lower === 'instagram' || lower === 'ig') return 'Instagram'
  if (lower === 'twitter' || lower === 'x') return 'Twitter'
  if (lower === 'tiktok' || lower === 'tt') return 'TikTok'
  if (lower === 'linkedin' || lower === 'li') return 'LinkedIn'
  if (lower === 'email') return 'Email'
  if (lower === 'podcast') return 'Podcast'
  return 'Instagram'
}

function reverseMapPlatform(p) {
  if (p === 'IG') return 'Instagram'
  if (p === 'X') return 'Twitter'
  if (p === 'YT') return 'YouTube'
  if (p === 'TT') return 'TikTok'
  if (p === 'LI') return 'LinkedIn'
  if (p === 'Email') return 'Email'
  if (p === '✉') return 'Email'
  if (p === '🎙') return 'Podcast'
  return p || 'Instagram'
}

function reverseMapColorToTheme(color) {
  if (!color) return 'value'
  if (color.includes('225,48,108') || color.includes('e1306c')) return 'bts'
  if (color.includes('255,255,255')) return 'launch'
  if (color.includes('96,165,250') || color.includes('60a5fa')) return 'value'
  if (color.includes('52,211,153')) return 'proof'
  if (color.includes('255,59,48') || color.includes('ff3b30')) return 'cta'
  if (color.includes('167,139,250')) return 'community'
  if (color.includes('251,191,36')) return 'story'
  return 'value'
}

function mapCalendarResult(result) {
  if (!Array.isArray(result)) return null
  let idCounter = 1
  return result.map(day => ({
    day: day.day,
    posts: (day.posts || []).map(post => ({
      id: `post-gen-${idCounter++}`,
      type: post.type || 'post',
      label: post.title || 'Untitled Post',
      title: post.title || 'Untitled Post',
      body: post.body || '',
      platform: post.platform || 'IG',
      color: THEME_COLORS[post.theme] || 'rgba(255,255,255,0.12)',
      theme: post.theme || 'launch',
      status: post.status || 'draft',
      done: post.status === 'posted'
    }))
  }))
}

export default function Marketing() {
  const { creatorData, startBgJob, cancelBgJob, clearBgJob, incrementAiActions, setApiModalOpen, triggerToast, syncSessionToDb, dbLoadedTimestamp } = useForge()
  const accent = getAccent(creatorData.platform)
  const autofillJob = useBgJob(AUTOFILL_JOB)

  const handle      = creatorData.handle      || '@creator'
  const displayName = creatorData.name        || handle.replace('@','')
  const productName = creatorData.productName || 'Creator Academy'
  const niche       = creatorData.niche        || 'your niche'

  const CONTENT = buildContent(handle, productName, niche)

  const [dismissedActions, setDismissedActions] = useState(() => {
    try {
      const newKey = `forge_${handle}_launch_pack_dismissed_actions`
      const oldKey = `forge_${handle}_dismissed_actions`
      const cached = localStorage.getItem(newKey) || localStorage.getItem(oldKey)
      return cached ? JSON.parse(cached) : []
    } catch { return [] }
  })
  const [completedActions, setCompletedActions] = useState(() => {
    try {
      const newKey = `forge_${handle}_launch_pack_completed_actions`
      const oldKey = `forge_${handle}_completed_actions`
      const cached = localStorage.getItem(newKey) || localStorage.getItem(oldKey)
      return cached ? JSON.parse(cached) : []
    } catch { return [] }
  })
  const [generating, setGenerating]             = useState(null)
  const [openOutputId, setOpenOutputId]         = useState(null)  // which action's output is open
  const [generatedContents, setGeneratedContents] = useState(() => {
    const handle = creatorData?.handle || 'default'
    try {
      const cached = localStorage.getItem(`forge_${handle}_launch_pack_contents`) || localStorage.getItem(`forge_${handle.toLowerCase()}_launch_pack_contents`)
      return cached ? JSON.parse(cached) : {}
    } catch (e) {
      console.error('Failed to parse cached launch pack contents:', e)
      return {}
    }
  })
  const [selectedPost, setSelectedPost]         = useState(null)
  const [selectedPostDay, setSelectedPostDay]   = useState(null)
  const [week, setWeek]                         = useState(() => {
    const handle = creatorData?.handle || 'default'
    const cacheKey = `forge_calendar_${handle}_launch_w0`
    const cacheKeyLower = `forge_calendar_${handle.toLowerCase()}_launch_w0`
    try {
      const cached = localStorage.getItem(cacheKey) || localStorage.getItem(cacheKeyLower)
      if (cached) {
        return mapCalendarResult(JSON.parse(cached))
      }
    } catch (e) {
      console.error('Failed to parse cached calendar:', e)
    }
    return null
  })
  const [scheduledToast, setScheduledToast]     = useState(null)
  const [coachTrigger, setCoachTrigger]         = useState('idle')
  const [showCoachChat, setShowCoachChat]       = useState(false)

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newPostData, setNewPostData] = useState({
    title: '',
    day: 'Mon',
    platform: 'Instagram',
    type: 'Post',
    theme: 'launch',
    status: 'draft'
  })

  const getRawCalendar = () => {
    const handle = creatorData?.handle || 'default'
    const cacheKey = `forge_calendar_${handle}_launch_w0`
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      try {
        return JSON.parse(cached)
      } catch (e) {
        console.error('Failed to parse cached calendar:', e)
      }
    }
    if (week) {
      let idCounter = 1
      return week.map(dayData => ({
        day: dayData.day,
        posts: (dayData.posts || []).map(post => {
          const platform = reverseMapPlatform(post.platform)
          const theme = reverseMapColorToTheme(post.color)
          return {
            id: idCounter++,
            platform,
            type: post.type || 'Post',
            title: post.label || 'Untitled Post',
            theme,
            status: post.done ? 'posted' : 'draft'
          }
        })
      }))
    }
    return DAYS.map(day => ({ day, posts: [] }))
  }

  const coachMessage = getCoachMessage(coachTrigger, creatorData)

  // Load/reload cached contents when handle resolves or changes
  useEffect(() => {
    const h = creatorData?.handle
    if (!h || h === 'default') return
    
    const cachedContents = localStorage.getItem(`forge_${h}_launch_pack_contents`) || localStorage.getItem(`forge_${h.toLowerCase()}_launch_pack_contents`)
    if (cachedContents) {
      try {
        const parsed = JSON.parse(cachedContents)
        console.log('[Forge Marketing] Loaded cached launch pack contents:', parsed)
        setGeneratedContents(parsed)
      } catch (e) {
        console.error('Failed to parse cached launch pack contents:', e)
      }
    }
    
    const cacheKey = `forge_calendar_${h}_launch_w0`
    const cacheKeyLower = `forge_calendar_${h.toLowerCase()}_launch_w0`
    const cached = localStorage.getItem(cacheKey) || localStorage.getItem(cacheKeyLower)
    if (cached) {
      try {
        const parsed = JSON.parse(cached)
        console.log('[Forge Marketing] Loaded cached launch week calendar:', parsed)
        setWeek(mapCalendarResult(parsed))
      } catch (e) {
        console.error('Failed to parse cached calendar:', e)
      }
    }
    const cachedDismissed = localStorage.getItem(`forge_${h}_launch_pack_dismissed_actions`) ||
                            localStorage.getItem(`forge_${h.toLowerCase()}_launch_pack_dismissed_actions`) ||
                            localStorage.getItem(`forge_${h}_dismissed_actions`) ||
                            localStorage.getItem(`forge_${h.toLowerCase()}_dismissed_actions`)
    if (cachedDismissed) {
      try {
        const parsed = JSON.parse(cachedDismissed)
        console.log('[Forge Marketing] Loaded cached dismissed priorities:', parsed)
        setDismissedActions(parsed)
      } catch (e) {
        console.error('Failed to parse cached dismissed actions:', e)
      }
    }

    const cachedCompleted = localStorage.getItem(`forge_${h}_launch_pack_completed_actions`) ||
                            localStorage.getItem(`forge_${h.toLowerCase()}_launch_pack_completed_actions`) ||
                            localStorage.getItem(`forge_${h}_completed_actions`) ||
                            localStorage.getItem(`forge_${h.toLowerCase()}_completed_actions`)
    if (cachedCompleted) {
      try {
        const parsed = JSON.parse(cachedCompleted)
        console.log('[Forge Marketing] Loaded cached completed priorities:', parsed)
        setCompletedActions(parsed)
      } catch (e) {
        console.error('Failed to parse cached completed actions:', e)
      }
    }
  }, [creatorData?.handle, dbLoadedTimestamp])

  // ── Load cache or trigger autofill on mount
  useEffect(() => {
    const h = creatorData?.handle
    if (!h || h === 'default') return

    if (!week) {
      const cacheKey = `forge_calendar_${h}_launch_w0`
      const cacheKeyLower = `forge_calendar_${h.toLowerCase()}_launch_w0`
      const cached = localStorage.getItem(cacheKey) || localStorage.getItem(cacheKeyLower)
      if (cached) {
        // If cached calendar exists, load it and return (do NOT auto-generate)
        try {
          setWeek(mapCalendarResult(JSON.parse(cached)))
        } catch (e) {
          console.error('Failed to parse cached calendar:', e)
        }
        return
      }

      if (hasTextKey() && autofillJob.status === 'idle') {
        startBgJob(AUTOFILL_JOB, (sig) => generateContentCalendar(creatorData, 'launch', sig))
      } else if (!hasTextKey()) {
        setWeek(INITIAL_WEEK)
      }
    }
  }, [creatorData?.handle, week, autofillJob.status])

  // ── Apply result when autofill job finishes (even if user was on another tab)
  useEffect(() => {
    if (autofillJob.status === 'done' && autofillJob.result) {
      const mapped = mapCalendarResult(autofillJob.result)
      if (mapped) {
        setWeek(mapped)
        const handle = creatorData?.handle || 'default'
        const cacheKey = `forge_calendar_${handle}_launch_w0`
        localStorage.setItem(cacheKey, JSON.stringify(autofillJob.result))
        clearBgJob(AUTOFILL_JOB)
        if (triggerToast) triggerToast('Weekly content calendar autofilled!', 'success')
        setTimeout(() => { if (syncSessionToDb) syncSessionToDb() }, 50)
      } else {
        console.warn('[Forge] Weekly calendar mapping failed. Falling back to default/cached week.')
        const handle = creatorData?.handle || 'default'
        const cacheKey = `forge_calendar_${handle}_launch_w0`
        const cacheKeyLower = `forge_calendar_${handle.toLowerCase()}_launch_w0`
        const cached = localStorage.getItem(cacheKey) || localStorage.getItem(cacheKeyLower)
        if (cached) {
          try {
            setWeek(mapCalendarResult(JSON.parse(cached)))
          } catch (e) {
            setWeek(INITIAL_WEEK)
          }
        } else {
          setWeek(INITIAL_WEEK)
        }
        clearBgJob(AUTOFILL_JOB)
      }
    } else if (autofillJob.status === 'error' || autofillJob.status === 'cancelled') {
      const handle = creatorData?.handle || 'default'
      const cacheKey = `forge_calendar_${handle}_launch_w0`
      const cacheKeyLower = `forge_calendar_${handle.toLowerCase()}_launch_w0`
      const cached = localStorage.getItem(cacheKey) || localStorage.getItem(cacheKeyLower)
      if (cached) {
        try {
          setWeek(mapCalendarResult(JSON.parse(cached)))
        } catch (e) {
          setWeek(INITIAL_WEEK)
        }
      } else {
        setWeek(INITIAL_WEEK)
      }
      clearBgJob(AUTOFILL_JOB)
    }
  }, [autofillJob.status, autofillJob.result])

  // Close modal on escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isAddModalOpen) {
        setIsAddModalOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isAddModalOpen])

  const handleAutoFillWeek = () => {
    if (incrementAiActions) incrementAiActions()
    startBgJob(AUTOFILL_JOB, (sig) => generateContentCalendar(creatorData, 'launch', sig))
  }

  const todayActions = getTodayActions(creatorData?.platform)

  const visibleActions = todayActions.filter(
    a => !dismissedActions.includes(a.id) && !completedActions.includes(a.id)
  )

  const handleRefine = async (id, instruction, tone) => {
    setGenerating(id)
    if (incrementAiActions) incrementAiActions()
    try {
      if (!hasTextKey()) {
        setApiModalOpen(true)
        setGenerating(null)
        return
      }
      
      const typeMap = {
        'teaser': 'Launch Teaser Post',
        'email': 'Launch Announcement Email',
        'bts': 'Behind-the-Scenes Caption',
        'calendar': '7-Day Launch Calendar'
      }
      const contentType = typeMap[id] || id
      
      const existingContent = generatedContents[id]?.body || CONTENT[id]?.body || ""
      const newContext = instruction.startsWith('Regenerate') 
        ? "I need fresh launch materials. Be completely different from previous generation."
        : `Modify this existing content:\n\n"${existingContent}"\n\nInstruction: ${instruction}`
      
      const result = await generateStudioContent(contentType, newContext, creatorData, tone)
      
      setGeneratedContents(prev => {
        const updated = {
          ...prev,
          [id]: {
            title: CONTENT[id]?.title || contentType,
            platforms: result.platforms || CONTENT[id]?.platforms || ['All platforms'],
            body: result.body || result.text || result
          }
        }
        const h = creatorData?.handle || 'default'
        console.log(`[Forge Marketing] Refined marketing content for "${id}":`, updated[id])
        localStorage.setItem(`forge_${h}_launch_pack_contents`, JSON.stringify(updated))
        return updated
      })
      setTimeout(() => { if (syncSessionToDb) syncSessionToDb() }, 50)
    } catch (err) {
      console.error(err)
      alert("Error refining content: " + err.message)
    } finally {
      setGenerating(null)
    }
  }

  const handleGenerate = async (id) => {
    if (generatedContents[id]) {
      setOpenOutputId(id)
      return
    }

    if (!CONTENT[id]) return

    setGenerating(id)
    setCoachTrigger(id)
    if (incrementAiActions) incrementAiActions()
    try {
      if (!hasTextKey()) {
        setApiModalOpen(true)
        setGenerating(null)
        return
      }
      
      const typeMap = {
        'teaser': 'Launch Teaser Post',
        'email': 'Launch Announcement Email',
        'bts': 'Behind-the-Scenes Caption',
        'calendar': '7-Day Launch Calendar'
      }
      const contentType = typeMap[id] || id
      
      const result = await generateStudioContent(contentType, "I need launch materials.", creatorData)
      
      setGeneratedContents(prev => {
        const updated = {
          ...prev,
          [id]: {
            title: CONTENT[id].title,
            platforms: result.platforms || CONTENT[id].platforms,
            body: result.body || result.text || result
          }
        }
        const h = creatorData?.handle || 'default'
        console.log(`[Forge Marketing] Generated marketing content for "${id}":`, updated[id])
        localStorage.setItem(`forge_${h}_launch_pack_contents`, JSON.stringify(updated))
        return updated
      })
      
      setGenerating(null)
      setOpenOutputId(id)
      setTimeout(() => { if (syncSessionToDb) syncSessionToDb() }, 50)
    } catch (err) {
      console.error(err)
      alert("Error generating content: " + err.message)
      setGenerating(null)
    }
  }

  const handleSchedule = (id) => {
    setOpenOutputId(null)
    setScheduledToast(id)
    setCoachTrigger('scheduled')

    // Map action id → calendar post shape
    const content = generatedContents[id] || CONTENT[id]
    const body    = content?.body || ''

    const p = (creatorData?.platform || 'other').toLowerCase()
    let teaserPostShape = { type: 'reel', label: 'Launch teaser post', platform: 'IG', color: 'rgba(225,48,108,0.25)', theme: 'launch' }
    let btsPostShape = { type: 'reel', label: 'Behind-the-scenes caption', platform: 'IG', color: 'rgba(225,48,108,0.15)', theme: 'bts' }
    let calendarPostShape = { type: 'thread', label: '7-Day launch plan drafted', platform: 'All', color: 'rgba(96,165,250,0.2)', theme: 'value' }

    if (p === 'youtube') {
      teaserPostShape = { type: 'Shorts', label: 'Launch teaser video', platform: 'YT', color: 'rgba(255,59,48,0.25)', theme: 'launch' }
      btsPostShape = { type: 'Shorts', label: 'Behind-the-scenes Short', platform: 'YT', color: 'rgba(255,59,48,0.15)', theme: 'bts' }
      calendarPostShape = { type: 'Video', label: 'Launch week uploads plan', platform: 'YT', color: 'rgba(255,59,48,0.2)', theme: 'value' }
    } else if (p === 'twitter' || p === 'x') {
      teaserPostShape = { type: 'Thread', label: 'Launch teaser thread', platform: 'X', color: 'rgba(96,165,250,0.25)', theme: 'launch' }
      btsPostShape = { type: 'Post', label: 'Behind-the-scenes thread', platform: 'X', color: 'rgba(96,165,250,0.15)', theme: 'bts' }
      calendarPostShape = { type: 'Thread', label: 'X launch plan scheduled', platform: 'X', color: 'rgba(96,165,250,0.2)', theme: 'value' }
    } else if (p === 'tiktok') {
      teaserPostShape = { type: 'Video', label: 'Launch teaser TikTok', platform: 'TT', color: 'rgba(0,200,200,0.25)', theme: 'launch' }
      btsPostShape = { type: 'Video', label: 'Behind-the-scenes TikTok', platform: 'TT', color: 'rgba(0,200,200,0.15)', theme: 'bts' }
      calendarPostShape = { type: 'Video', label: 'TikTok launch schedule plan', platform: 'TT', color: 'rgba(0,200,200,0.2)', theme: 'value' }
    } else if (p === 'twitch') {
      teaserPostShape = { type: 'Stream', label: 'Launch stream countdown', platform: 'Twitch', color: 'rgba(145,70,255,0.25)', theme: 'launch' }
      btsPostShape = { type: 'Clip', label: 'Behind-the-scenes stream clip', platform: 'Twitch', color: 'rgba(145,70,255,0.15)', theme: 'bts' }
      calendarPostShape = { type: 'Stream', label: 'Twitch launch streams schedule', platform: 'Twitch', color: 'rgba(145,70,255,0.2)', theme: 'value' }
    }

    const ACTION_POST_MAP = {
      teaser: teaserPostShape,
      email: { type: 'email', label: 'Launch announcement email', platform: 'Email', color: 'rgba(255,255,255,0.12)', theme: 'launch' },
      bts: btsPostShape,
      calendar: calendarPostShape,
    }

    const postShape = ACTION_POST_MAP[id]
    if (postShape) {
      const newPost = {
        id: Date.now().toString(),
        ...postShape,
        title: postShape.label,
        body,
        status: 'scheduled',
        done: false,
      }

      setWeek(prev => {
        if (!prev) return null
        const updated = prev.map((d, i) => i === TODAY_IDX
          ? { ...d, posts: [...(d.posts || []), newPost] }
          : d
        )
        // Persist to localStorage
        const h = creatorData?.handle || 'default'
        const raw = updated.map(dayData => ({
          day: dayData.day,
          posts: (dayData.posts || []).map(p => ({
            id: p.id,
            platform: reverseMapPlatform(p.platform) || p.platform,
            type: p.type || 'Post',
            title: p.title || p.label || 'Untitled',
            body: p.body || '',
            theme: p.theme || reverseMapColorToTheme(p.color),
            status: p.done ? 'posted' : (p.status || 'draft'),
          }))
        }))
        localStorage.setItem(`forge_calendar_${h}_launch_w0`, JSON.stringify(raw))
        return updated
      })
    }

    // Mark as completed so it vanishes from Today's Priorities
    setCompletedActions(prev => {
      const next = prev.includes(id) ? prev : [...prev, id]
      localStorage.setItem(`forge_${handle}_launch_pack_completed_actions`, JSON.stringify(next))
      return next
    })

    setTimeout(() => setScheduledToast(null), 3000)
    setTimeout(() => { if (syncSessionToDb) syncSessionToDb() }, 50)
  }

  const handleCopy = () => {
    setCoachTrigger('copied')
  }

  const handleAddPost = (dayIdx) => {
    const defaultPlatform = getPlatformName(creatorData.platform)
    const defaultTypes = PLATFORM_TYPES[defaultPlatform] || ['Post']
    
    setNewPostData({
      title: '',
      day: DAYS[dayIdx] !== undefined ? DAYS[dayIdx] : 'Mon',
      platform: defaultPlatform,
      type: defaultTypes[0],
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

    const rawCalendar = getRawCalendar()
    const updatedRaw = rawCalendar.map(d => {
      if (d.day === newPostData.day) {
        return {
          ...d,
          posts: [...(d.posts || []), newPost]
        }
      }
      return d
    })

    const handle = creatorData?.handle || 'default'
    const cacheKey = `forge_calendar_${handle}_launch_w0`
    localStorage.setItem(cacheKey, JSON.stringify(updatedRaw))

    // Update the local state week with mapped format
    const mapped = mapCalendarResult(updatedRaw)
    if (mapped) {
      setWeek(mapped)
    }

    setIsAddModalOpen(false)
    setTimeout(() => { if (syncSessionToDb) syncSessionToDb() }, 50)
  }

  const handleSaveEditedPost = (updatedPost, day) => {
    setWeek(prev => {
      if (!prev) return null
      return prev.map(d =>
        d.day === day
          ? {
              ...d,
              posts: (d.posts || []).map(p =>
                p.id === updatedPost.id
                  ? { ...p, ...updatedPost, label: updatedPost.title || p.label }
                  : p
              )
            }
          : d
      )
    })
    // Persist to localStorage
    const raw = getRawCalendar()
    const updatedRaw = raw.map(d => {
      if (d.day === day) {
        return {
          ...d,
          posts: (d.posts || []).map(p =>
            (p.id?.toString() === updatedPost.id?.toString())
              ? { ...p, title: updatedPost.title, body: updatedPost.body, platform: updatedPost.platform, type: updatedPost.type, theme: updatedPost.theme, status: updatedPost.status }
              : p
          )
        }
      }
      return d
    })
    const h = creatorData?.handle || 'default'
    localStorage.setItem(`forge_calendar_${h}_launch_w0`, JSON.stringify(updatedRaw))
    setSelectedPost(null)
    if (triggerToast) triggerToast('Post draft updated!', 'success')
    setTimeout(() => { if (syncSessionToDb) syncSessionToDb() }, 50)
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl">

      {/* ─── CREATOR PROFILE CARD ────────────────────────────────── */}
      <div className="rounded-2xl border overflow-hidden"
        style={{ background: 'var(--theme-card-bg)', borderColor: 'var(--theme-border-color)' }}>
        {/* Top strip: avatar + name + stats */}
        <div className="flex items-center gap-4 px-5 py-4 border-b"
          style={{ borderColor: 'var(--theme-border-color)' }}>
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-14 h-14 rounded-full overflow-hidden border-2 flex items-center justify-center"
              style={{
                borderColor: 'var(--theme-accent-border)',
                background: 'var(--theme-accent-bg)',
              }}>
              {creatorData.avatarUrl ? (
                <img src={creatorData.avatarUrl} alt={displayName}
                  className="w-full h-full object-cover"
                  onError={e => { e.currentTarget.style.display = 'none' }} />
              ) : (
                <span className="text-xl font-bold text-white/60">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border flex items-center justify-center"
              style={{ background: 'var(--theme-card-bg)', borderColor: 'var(--theme-accent-border)' }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--theme-accent)' }} />
            </div>
          </div>

          {/* Name + handle + niche */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-[16px] font-bold text-white">{displayName}</p>
              <p className="text-[12px]" style={{ color: 'var(--theme-text-muted)' }}>{handle}</p>
              <span className="text-[10px] px-2 py-0.5 rounded-full capitalize"
                style={{ background: 'var(--theme-accent-bg)', color: 'var(--theme-accent)' }}>
                {creatorData.platform || 'creator'}
              </span>
            </div>
            {niche && niche !== 'your niche' && (
              <p className="text-[12px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{niche}</p>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 flex-shrink-0">
            {creatorData.followers > 0 && (
              <div className="text-right">
                <p className="text-[16px] font-bold text-white">
                  {creatorData.followers >= 1_000_000
                    ? `${(creatorData.followers/1_000_000).toFixed(1)}M`
                    : creatorData.followers >= 1_000
                      ? `${Math.round(creatorData.followers/1_000)}K`
                      : creatorData.followers}
                </p>
                <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>followers</p>
              </div>
            )}
            {creatorData.engagementRate > 0 && (
              <div className="text-right hidden sm:block">
                <p className="text-[16px] font-bold text-white">{creatorData.engagementRate}%</p>
                <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>engagement</p>
              </div>
            )}
            {creatorData.followers > 0 && creatorData.engagementRate > 0 && (
              <div className="text-right hidden md:block">
                <p className="text-[16px] font-bold text-white">
                  {(() => {
                    const r = Math.round(creatorData.followers * creatorData.engagementRate / 100)
                    return r >= 1_000 ? `${Math.round(r/1_000)}K` : r
                  })()}
                </p>
                <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>avg reach</p>
              </div>
            )}
          </div>
        </div>

        {/* Latest videos / posts grid */}
        {creatorData.recentPosts?.length > 0 && (
          <div className="px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-3"
              style={{ color: 'rgba(255,255,255,0.2)' }}>
              {creatorData.platform === 'youtube' ? 'Latest videos' : 'Recent posts'}
            </p>
            <div className="flex gap-2.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
              {creatorData.recentPosts.slice(0, 6).map((post, i) => {
                let postUrl = post.url;
                if (!postUrl) {
                  if (creatorData.platform === 'youtube' && post.videoId) {
                    postUrl = `https://www.youtube.com/watch?v=${post.videoId}`;
                  } else if (creatorData.platform === 'instagram' && post.shortcode) {
                    postUrl = `https://www.instagram.com/p/${post.shortcode}/`;
                  } else {
                    postUrl = '#';
                  }
                }
                return (
                  <a key={i} href={postUrl} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 relative rounded-xl overflow-hidden group cursor-pointer block"
                    style={{ width: 130, height: 80, background: 'rgba(255,255,255,0.04)' }}>
                    {post.thumbnail ? (
                      <img 
                        src={post.thumbnail} 
                        alt="" 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={e => {
                          if (!e.currentTarget.dataset.proxied) {
                            e.currentTarget.dataset.proxied = 'true';
                            e.currentTarget.src = `/api/proxy/avatar?url=${encodeURIComponent(post.thumbnail)}`;
                          } else {
                            e.currentTarget.style.display = 'none';
                            if (e.currentTarget.nextElementSibling) {
                              e.currentTarget.nextElementSibling.style.display = 'flex';
                            }
                          }
                        }} 
                      />
                    ) : null}
                    <div className="w-full h-full flex items-center justify-center absolute inset-0"
                      style={{ display: post.thumbnail ? 'none' : 'flex', background: 'rgba(255,255,255,0.03)' }}>
                      <Video size={16} style={{ color: 'rgba(255,255,255,0.15)' }} />
                    </div>
                    <div className="absolute inset-0"
                      style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 55%)' }} />
                    <div className="absolute bottom-1.5 left-2 right-2 flex justify-between items-end">
                      {post.views && (
                        <span className="text-[9px] font-semibold"
                          style={{ color: 'rgba(255,255,255,0.8)' }}>{post.views}</span>
                      )}
                      {post.likes && (
                        <span className="text-[9px]"
                          style={{ color: 'rgba(255,255,255,0.5)' }}>♥ {post.likes}</span>
                      )}
                    </div>
                    {post.title && (
                      <div className="absolute top-1.5 left-2 right-2">
                        <p className="text-[8px] leading-tight line-clamp-1"
                          style={{ color: 'rgba(255,255,255,0.6)' }}>{post.title}</p>
                      </div>
                    )}
                  </a>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ─── HEADER + COACH ──────────────────────────────────────── */}
      <div className="flex items-start gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <p className="forge-label">Today · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: accent.color, opacity: 0.8 }} />
          </div>
          <h2 className="forge-heading mb-1" style={{ fontSize: 'clamp(20px, 2.5vw, 28px)', letterSpacing: '-0.03em' }}>
            What's next for {displayName}?
          </h2>
          <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.35)', lineHeight: '1.5' }}>
            Forge analyzed your content history and audience signals.
          </p>
        </div>

        {/* Coach in top right — click to open chat */}
        <button
          onClick={() => setShowCoachChat(v => !v)}
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border transition-all duration-150 flex-shrink-0"
          style={{
            background: showCoachChat ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
            borderColor: showCoachChat ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.08)',
          }}
        >
          <div style={{ width: 24, height: 24, flexShrink: 0 }}>
            <svg viewBox="0 0 16 16" width="24" height="24" style={{ imageRendering: 'pixelated' }}>
              <rect x="4" y="1" width="8" height="2" fill="#f0d0a0"/>
              <rect x="4" y="3" width="8" height="5" fill="#fde8c8"/>
              <rect x="5" y="5" width="2" height="2" fill="#2a2a2a"/>
              <rect x="9" y="5" width="2" height="2" fill="#2a2a2a"/>
              <rect x="5" y="5" width="1" height="1" fill="white"/>
              <rect x="9" y="5" width="1" height="1" fill="white"/>
              <rect x="6" y="7" width="1" height="1" fill="#c0806a"/>
              <rect x="7" y="8" width="2" height="1" fill="#c0806a"/>
              <rect x="9" y="7" width="1" height="1" fill="#c0806a"/>
              <rect x="5" y="9" width="6" height="4" fill="white"/>
              <rect x="3" y="9" width="2" height="3" fill="white"/>
              <rect x="11" y="9" width="2" height="3" fill="white"/>
            </svg>
          </div>
          <div className="text-left">
            <p className="text-[12px] font-semibold text-white">Forge Coach</p>
            <div className="flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-green-400" />
              <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>online</span>
            </div>
          </div>
          <MessageSquare size={12} style={{ color: 'rgba(255,255,255,0.3)', marginLeft: 2 }} />
        </button>
      </div>

      {/* ─── COACH BUBBLE (contextual) ───────────────────────────── */}
      <PixelCoach
        message={coachMessage}
        onChat={() => setShowCoachChat(true)}
      />

      {/* ─── WEEKLY CALENDAR ─────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <p className="forge-label">This week's launch plan</p>
          <div className="flex items-center gap-2">
            {autofillJob.status === 'running' && (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
                  Running in background…
                </span>
                <button
                  onClick={() => cancelBgJob(AUTOFILL_JOB)}
                  className="text-[10px] font-semibold text-white/40 hover:text-white/80 border border-white/10 hover:border-white/25 px-1.5 py-0.5 rounded transition-all"
                >
                  Cancel
                </button>
              </div>
            )}
            {autofillJob.status === 'error' && (
              <span className="text-[10px]" style={{ color: 'rgba(255,80,80,0.8)' }}>
                Failed — try again
              </span>
            )}
            <button
              onClick={handleAutoFillWeek}
              disabled={autofillJob.status === 'running'}
              className="forge-btn-secondary text-[11px] py-1.5 px-3 gap-1.5 disabled:opacity-50"
            >
              <Sparkles size={10} className={autofillJob.status === 'running' ? "animate-pulse" : ""} />
              {autofillJob.status === 'running' ? "AI working…" : "Auto-fill week"}
            </button>
          </div>
        </div>
        <WeekCalendar week={week} onAddPost={handleAddPost} accentRgb={accent.rgb} isLoading={autofillJob.status === 'running'} onCardClick={(post, day) => { setSelectedPost(post); setSelectedPostDay(day) }} />
      </section>


      {/* ─── TODAY'S PRIORITIES ──────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <p className="forge-label">Today's priorities</p>
          <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.2)' }}>{visibleActions.length} remaining</span>
        </div>

        <div className="space-y-2">
          {visibleActions.map(action => (
            <div key={action.id}>
              <div
                className="group flex items-center gap-4 p-4 rounded-2xl border transition-all duration-150"
                style={{ background: '#111', borderColor: openOutputId === action.id ? `rgba(${accent.rgb},0.3)` : 'rgba(255,255,255,0.07)' }}
                onMouseEnter={e => { if (openOutputId !== action.id) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.background = '#161616' }}}
                onMouseLeave={e => { if (openOutputId !== action.id) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.background = '#111' }}}
              >
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: openOutputId === action.id ? `rgba(${accent.rgb},0.15)` : 'rgba(255,255,255,0.07)' }}>
                  <action.icon size={14} style={{ color: openOutputId === action.id ? accent.color : 'rgba(255,255,255,0.5)' }} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[13px] font-semibold text-white">{action.label}</span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                      style={PRIORITY_STYLES[action.priority]}>
                      {action.priority}
                    </span>
                  </div>
                  <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.35)' }}>{action.rationale}</p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => openOutputId === action.id ? setOpenOutputId(null) : handleGenerate(action.id)}
                    disabled={generating === action.id}
                    className="forge-btn-primary text-[12px] py-2 px-4 gap-1.5"
                    style={openOutputId === action.id ? { background: `rgba(${accent.rgb},0.2)`, borderColor: `rgba(${accent.rgb},0.4)`, color: 'white' } : {}}
                  >
                    {generating === action.id
                      ? <RefreshCw size={11} className="animate-spin" />
                      : openOutputId === action.id
                        ? <Check size={11} />
                        : <Sparkles size={11} />
                    }
                    {generating === action.id ? 'Writing...' : openOutputId === action.id ? 'Generated' : action.cta}
                  </button>
                  <button
                    onClick={() => {
                      setCompletedActions(p => {
                        const next = p.includes(action.id) ? p : [...p, action.id]
                        localStorage.setItem(`forge_${handle}_launch_pack_completed_actions`, JSON.stringify(next))
                        return next
                      })
                      setTimeout(() => { if (syncSessionToDb) syncSessionToDb() }, 50)
                    }}
                    className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-full flex items-center justify-center transition-all text-white/30 hover:text-white/70"
                    style={{ background: 'rgba(255,255,255,0.06)' }} title="Mark done">
                    <Check size={12} />
                  </button>
                  <button
                    onClick={() => {
                      setDismissedActions(p => {
                        const next = p.includes(action.id) ? p : [...p, action.id]
                        localStorage.setItem(`forge_${handle}_launch_pack_dismissed_actions`, JSON.stringify(next))
                        return next
                      })
                      setTimeout(() => { if (syncSessionToDb) syncSessionToDb() }, 50)
                    }}
                    className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-full flex items-center justify-center transition-all text-white/30 hover:text-white/70"
                    style={{ background: 'rgba(255,255,255,0.06)' }} title="Dismiss">
                    <X size={12} />
                  </button>
                </div>
              </div>

              {/* Output panel opens inline under the action that triggered it */}
              {openOutputId === action.id && (generatedContents[action.id] || CONTENT[action.id]) && (
                <div className="mt-2">
                  <OutputPanel
                    content={generatedContents[action.id] || CONTENT[action.id]}
                    accent={accent}
                    onClose={() => setOpenOutputId(null)}
                    onSchedule={() => handleSchedule(action.id)}
                    onCopy={handleCopy}
                    onRefine={(instruction, tone) => handleRefine(action.id, instruction, tone)}
                    isGenerating={generating === action.id}
                  />
                </div>
              )}
            </div>
          ))}

          {visibleActions.length === 0 && (
            <div className="text-center py-8" style={{ color: 'rgba(255,255,255,0.3)' }}>
              <Check size={20} className="mx-auto mb-2" />
              <p className="text-[13px]">All done. Forge will surface new actions tomorrow.</p>
            </div>
          )}
        </div>
      </section>

      {/* Scheduled toast */}
      {scheduledToast && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl animate-fade-up"
          style={{ background: `rgba(${accent.rgb},0.08)`, border: `1px solid rgba(${accent.rgb},0.2)` }}>
          <Check size={13} style={{ color: accent.color }} />
          <span className="text-[13px]" style={{ color: 'rgba(255,255,255,0.6)' }}>Added to your content calendar</span>
          <button onClick={() => setScheduledToast(null)} className="ml-auto text-white/25 hover:text-white/50"><X size={12} /></button>
        </div>
      )}

      {/* ─── AI DOES IT ──────────────────────────────────────────── */}
      <AiDoesItPanel onClose={() => {}} />

      {showCoachChat && (
        <CoachChat 
          accent={accent} 
          handle={handle} 
          creatorData={creatorData}
          onClose={() => setShowCoachChat(false)} 
        />
      )}

      {/* Add Custom Post Modal */}
      {isAddModalOpen && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsAddModalOpen(false)
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
        >
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
                    className="w-full rounded-xl border p-2.5 text-[13px] bg-[#141414] text-white outline-none"
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
                    className="w-full rounded-xl border p-2.5 text-[13px] bg-[#141414] text-white outline-none"
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
                    className="w-full rounded-xl border p-2.5 text-[13px] bg-[#141414] text-white outline-none"
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
                    className="w-full rounded-xl border p-2.5 text-[13px] bg-[#141414] text-white outline-none"
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

      {/* ─── POST DETAILS / EDIT MODAL ───────────────────────────── */}
      {selectedPost && (
        <PostDetailsModal
          post={selectedPost}
          day={selectedPostDay}
          onClose={() => setSelectedPost(null)}
          onSave={(updated) => handleSaveEditedPost(updated, selectedPostDay)}
          accent={accent}
        />
      )}
    </div>
  )
}

const STATUS_COLORS = {
  draft:     { bg: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.45)' },
  scheduled: { bg: 'rgba(96,165,250,0.15)',  color: 'rgba(96,165,250,0.9)'  },
  posted:    { bg: 'rgba(52,211,153,0.15)',   color: 'rgba(52,211,153,0.9)'  },
}

function PostDetailsModal({ post, day, onClose, onSave, accent }) {
  const { creatorData, incrementAiActions, setApiModalOpen, triggerToast } = useForge()
  const [edited, setEdited] = useState({ ...post })
  const [activeTab, setActiveTab] = useState('details') // 'details' | 'body'
  const [isGeneratingBody, setIsGeneratingBody] = useState(false)

  const accentRgb = accent?.rgb || '255,255,255'
  const accentColor = accent?.color || 'white'

  const handleWriteWithAi = async () => {
    if (!hasTextKey()) {
      setApiModalOpen(true)
      return
    }
    setIsGeneratingBody(true)
    if (incrementAiActions) incrementAiActions()
    try {
      const rawPlatform = edited.platform || 'Instagram'
      const platformName = reverseMapPlatform(rawPlatform)
      const text = await generateStudioContent(
        { label: `${platformName} ${edited.type || 'Post'}`, platform: platformName },
        edited.title || '',
        creatorData,
        'Confident'
      )
      setEdited(p => ({ ...p, body: text }))
      if (triggerToast) triggerToast('Caption generated successfully!', 'success')
    } catch (err) {
      console.error(err)
      if (triggerToast) triggerToast(err.message || 'Failed to generate caption', 'error')
    } finally {
      setIsGeneratingBody(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl border shadow-2xl relative overflow-hidden"
        onClick={e => e.stopPropagation()}
        style={{
          background: 'linear-gradient(135deg, #111 0%, #0d0d0d 100%)',
          borderColor: `rgba(${accentRgb},0.2)`,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Accent top bar */}
        <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, rgba(${accentRgb},0.6) 0%, transparent 100%)` }} />

        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-3">
            {/* Colour swatch */}
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: edited.color || 'rgba(255,255,255,0.12)' }}
            >
              <Pencil size={14} style={{ color: 'rgba(255,255,255,0.7)' }} />
            </div>
            <div>
              <p className="text-[15px] font-bold text-white leading-tight line-clamp-1 max-w-[240px]">{edited.title || 'Untitled Post'}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] font-semibold" style={{ color: accentColor }}>{edited.platform}</span>
                <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10 }}>·</span>
                <span className="text-[10px] capitalize" style={{ color: 'rgba(255,255,255,0.35)' }}>{edited.type}</span>
                <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10 }}>·</span>
                <span
                  className="text-[9.5px] font-semibold px-1.5 py-0.5 rounded-full capitalize"
                  style={STATUS_COLORS[edited.status] || STATUS_COLORS.draft}
                >{edited.status}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-colors flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.4)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
          >
            <X size={13} />
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          {[['details','Details'], ['body','Caption / Body']].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className="px-5 py-2.5 text-[12px] font-semibold transition-colors relative"
              style={{ color: activeTab === id ? 'white' : 'rgba(255,255,255,0.35)' }}
            >
              {label}
              {activeTab === id && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                  style={{ background: `rgba(${accentRgb},0.8)` }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1" style={{ scrollbarWidth: 'none' }}>

          {activeTab === 'details' && (
            <div className="p-5 space-y-4">

              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>Post Title / Hook</label>
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
                  <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>Platform</label>
                  <select
                    className="w-full rounded-xl border p-2.5 text-[13px] bg-[#141414] text-white outline-none"
                    style={{ borderColor: 'rgba(255,255,255,0.1)' }}
                    value={reverseMapPlatform(edited.platform)}
                    onChange={e => {
                      const pl = e.target.value
                      setEdited(p => ({ ...p, platform: pl, type: (PLATFORM_TYPES[pl] || ['Post'])[0] }))
                    }}
                  >
                    {Object.keys(PLATFORM_TYPES).map(pl => (
                      <option key={pl} value={pl}>{pl}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>Format</label>
                  <select
                    className="w-full rounded-xl border p-2.5 text-[13px] bg-[#141414] text-white outline-none"
                    style={{ borderColor: 'rgba(255,255,255,0.1)' }}
                    value={edited.type || 'Post'}
                    onChange={e => setEdited(p => ({ ...p, type: e.target.value }))}
                  >
                    {(PLATFORM_TYPES[reverseMapPlatform(edited.platform)] || ['Post']).map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Theme & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>Theme</label>
                  <select
                    className="w-full rounded-xl border p-2.5 text-[13px] bg-[#141414] text-white outline-none"
                    style={{ borderColor: 'rgba(255,255,255,0.1)' }}
                    value={edited.theme || 'launch'}
                    onChange={e => {
                      const theme = e.target.value
                      setEdited(p => ({ ...p, theme, color: THEME_COLORS[theme] || p.color }))
                    }}
                  >
                    {Object.entries(THEMES).map(([k, t]) => (
                      <option key={k} value={k}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>Status</label>
                  <div className="flex gap-1 flex-wrap">
                    {['draft','scheduled','posted'].map(s => (
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

              {/* Day indicator */}
              {day && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <Calendar size={12} style={{ color: accentColor }} />
                  <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.5)' }}>Scheduled for <span className="text-white font-semibold">{day}</span> this week</span>
                </div>
              )}
            </div>
          )}

          {activeTab === 'body' && (
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold uppercase tracking-wider block" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  Caption / Body Text
                </label>
                <button
                  onClick={handleWriteWithAi}
                  disabled={isGeneratingBody}
                  className="forge-btn-secondary py-1 px-3 text-[11px] gap-1.5 flex items-center"
                  style={{ borderColor: 'rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.03)' }}
                >
                  {isGeneratingBody ? (
                    <RefreshCw size={11} className="animate-spin text-white" />
                  ) : (
                    <Sparkles size={11} className="text-[var(--theme-accent)]" />
                  )}
                  {isGeneratingBody ? 'Generating...' : 'Generate with AI'}
                </button>
              </div>
              <div className="forge-input-wrap">
                <textarea
                  className="forge-input text-[13px] resize-y min-h-[200px] py-3 leading-relaxed"
                  placeholder="Write the full caption, email body, or script here..."
                  value={edited.body || ''}
                  onChange={e => setEdited(p => ({ ...p, body: e.target.value }))}
                  disabled={isGeneratingBody}
                />
              </div>
              <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.2)' }}>{(edited.body || '').length} chars</p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div
          className="flex items-center justify-between gap-3 px-5 py-4 border-t"
          style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.3)' }}
        >
          <button
            onClick={onClose}
            className="forge-btn-secondary py-2 px-4 text-[13px]"
          >Discard</button>
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
