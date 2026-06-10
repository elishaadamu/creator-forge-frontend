import { useState } from 'react'
import { useForge } from '../../App'
import { Sparkles, RefreshCw, Copy, Check, Calendar, Plus, Users, MessageSquare, Radio, ChevronRight } from 'lucide-react'

const COMMUNITY_CONTENT_TYPES = [
  {
    id: 'welcome',
    icon: Users,
    label: 'Welcome post',
    description: 'Onboard new members with energy',
    example: `Welcome to [Community Name]! 🎉

You made it. This is the place where [creators / people interested in X] come to actually build - not just learn.

Here's what to do first:
→ Introduce yourself below (name, what you create, one goal for this year)
→ Check the pinned resources
→ Join the weekly challenge thread

Tag someone you think should be here. Let's build together.`,
  },
  {
    id: 'challenge',
    icon: Radio,
    label: 'Weekly challenge',
    description: 'Drive engagement and accountability',
    example: `This week's challenge: ⚡

Post ONE piece of content that directly promotes your offer. No hiding behind value posts. No "I'll do it next week."

Direct ask. Clear CTA. Ship it.

Tag me when you post it - I'll reshare the best ones.

Who's in? Comment "IN" below 👇`,
  },
  {
    id: 'discussion',
    icon: MessageSquare,
    label: 'Discussion starter',
    description: 'Get members talking and engaging',
    example: `Quick question for the group:

What's the ONE thing holding you back from monetizing right now?

Be honest. I'm going to address the top 3 answers this week in a live session.

Drop your answer below 👇

(P.S. There's no wrong answer - that's literally why this community exists.)`,
  },
  {
    id: 'announcement',
    icon: Plus,
    label: 'Member announcement',
    description: 'Share news, drops, or updates',
    example: `Big news for the community:

[Product / feature / event] is live.

Here's what this means for you:
→ [Benefit 1]
→ [Benefit 2]
→ [Benefit 3]

Check it out here: [link]

Questions? Drop them below and I'll answer every one.`,
  },
  {
    id: 'recap',
    icon: ChevronRight,
    label: 'Weekly recap',
    description: 'Celebrate wins and keep momentum',
    example: `Week [X] recap 🏁

This week we:
✓ Hit [milestone]
✓ Had [X] members ship their first [thing]
✓ Answered [X] questions live

Shoutout to [member name] for [achievement].

Next week: [what's coming]

Drop your biggest win from this week below 👇`,
  },
  {
    id: 'qa',
    icon: MessageSquare,
    label: 'Audience Q&A prompt',
    description: 'Collect questions for a live or post',
    example: `I'm doing a community Q&A [day/time].

Ask me anything about [topic]:
→ How to [outcome A]
→ How I [did X]
→ What I'd do differently
→ How to [outcome B]

Drop your question below - I'll answer every one live.`,
  },
  {
    id: 'reply',
    icon: MessageSquare,
    label: 'Comment reply suggestions',
    description: 'Respond to engagement authentically',
    example: `Here are 3 reply options for this comment:

Option A (warm + encouraging):
"This is exactly the right question to be asking. [Answer in 1-2 sentences.] Keep going - you're closer than you think."

Option B (direct + useful):
"[Direct answer]. Try [specific action] first. If you hit a wall, drop it back here."

Option C (community-focused):
"Great question - anyone else here have experience with this? I'd love to hear what's worked for the group."`,
  },
]

const MEMBER_STATS = [
  { label: 'Members', value: '0', sub: 'Invite your first 10' },
  { label: 'Active this week', value: '-', sub: 'Coming soon' },
  { label: 'Posts this week', value: '0', sub: 'Start a discussion' },
]

export default function Community() {
  const { creatorData } = useForge()
  const [selectedType, setSelectedType] = useState(null)
  const [generated, setGenerated] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [scheduled, setScheduled] = useState(false)

  const productName = creatorData.productName || 'Creator Academy'

  const handleGenerate = (type) => {
    setSelectedType(type)
    setIsGenerating(true)
    setGenerated(null)
    setTimeout(() => {
      setGenerated(type.example)
      setIsGenerating(false)
    }, 1000)
  }

  const handleCopy = () => {
    if (!generated) return
    navigator.clipboard.writeText(generated)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <p className="forge-label mb-3">Community</p>
      <h2 className="forge-heading mb-2" style={{ fontSize: 'clamp(22px, 3vw, 30px)', letterSpacing: '-0.03em' }}>
        {productName} community
      </h2>
      <p className="text-[14px] mb-8" style={{ color: 'rgba(255,255,255,0.38)' }}>
        Generate posts, challenges, and discussions - keep your community active and engaged.
      </p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {MEMBER_STATS.map(s => (
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
              <span className="text-[13px]" style={{ color: 'rgba(255,255,255,0.35)' }}>Writing {selectedType?.label}...</span>
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
              <div className="flex items-center gap-2 px-5 py-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                <button onClick={() => handleGenerate(selectedType)} className="forge-btn-secondary text-[12px] py-2 px-4 gap-1.5">
                  <RefreshCw size={11} />
                  Regenerate
                </button>
                <button className="forge-btn-secondary text-[12px] py-2 px-4">Make bolder</button>
                <button className="forge-btn-secondary text-[12px] py-2 px-4">Shorten</button>
                <button
                  onClick={() => setScheduled(true)}
                  className="forge-btn-primary text-[12px] py-2 px-4 gap-1.5 ml-auto"
                >
                  <Calendar size={11} />
                  {scheduled ? 'Scheduled ✓' : 'Schedule'}
                </button>
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

          {/* Quick wins */}
          <div className="mt-5">
            <p className="forge-label mb-3">Quick wins</p>
            <div className="space-y-2">
              {[
                { emoji: '👋', label: 'Post your first welcome message', urgent: true },
                { emoji: '💬', label: 'Start a discussion to break the ice', urgent: true },
                { emoji: '⚡', label: 'Create your first weekly challenge', urgent: false },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3.5 rounded-xl border" style={{ background: '#111', borderColor: 'rgba(255,255,255,0.07)' }}>
                  <span className="text-lg">{item.emoji}</span>
                  <span className="text-[13px] flex-1" style={{ color: 'rgba(255,255,255,0.6)' }}>{item.label}</span>
                  <button className="text-[12px] px-3 py-1 rounded-full transition-all duration-150" style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.4)' }}
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
