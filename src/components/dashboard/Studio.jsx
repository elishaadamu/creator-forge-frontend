import { useState, useEffect } from 'react'
import { useForge, getAccent, useBgJob } from '../../App'
import {
  Sparkles, RefreshCw, Copy, Check, ChevronDown,
  Instagram, Youtube, Twitter, Mail, FileText, Video,
  Radio, ArrowRight, X, Calendar, Send, AlertCircle, Volume2
} from 'lucide-react'
import { generateStudioContent } from '../../services/ai'
import ApiKeysModal from '../ui/ApiKeysModal'


// ─── CONTENT TYPES ───────────────────────────────────────────────────────────

const CONTENT_TYPES = [
  {
    group: 'Social',
    items: [
      { id: 'ig-caption', label: 'Instagram caption', platform: 'Instagram', icon: Instagram },
      { id: 'ig-reel', label: 'Instagram Reel concept', platform: 'Instagram', icon: Instagram },
      { id: 'x-post', label: 'X / Twitter post', platform: 'Twitter', icon: Twitter },
      { id: 'x-thread', label: 'X thread (5–7 tweets)', platform: 'Twitter', icon: Twitter },
      { id: 'linkedin', label: 'LinkedIn post', platform: 'LinkedIn', icon: FileText },
      { id: 'yt-community', label: 'YouTube community post', platform: 'YouTube', icon: Youtube },
      { id: 'tiktok', label: 'TikTok caption + hook', platform: 'TikTok', icon: Radio },
    ],
  },
  {
    group: 'Video',
    items: [
      { id: 'yt-ad', label: 'YouTube 60-sec ad script', platform: 'YouTube', icon: Youtube },
      { id: 'short-script', label: 'Short-form promo script', platform: 'Multi', icon: Video },
      { id: 'live-outline', label: 'Live session outline', platform: 'YouTube', icon: Video },
      { id: 'hook', label: 'Promo hook (0–5 sec)', platform: 'Multi', icon: Radio },
    ],
  },
  {
    group: 'Email',
    items: [
      { id: 'email-announce', label: 'Launch announcement email', platform: 'Email', icon: Mail },
      { id: 'email-welcome', label: 'Welcome email', platform: 'Email', icon: Mail },
      { id: 'email-sequence', label: 'Launch email sequence', platform: 'Email', icon: Mail },
      { id: 'email-followup', label: 'Follow-up / re-engagement', platform: 'Email', icon: Mail },
    ],
  },
  {
    group: 'Copy',
    items: [
      { id: 'offer-copy', label: 'Offer page copy', platform: 'Product', icon: FileText },
      { id: 'faq', label: 'FAQ section', platform: 'Product', icon: FileText },
      { id: 'cta', label: 'Call-to-action variants', platform: 'Multi', icon: ArrowRight },
      { id: 'bio', label: 'Bio / about copy', platform: 'Multi', icon: FileText },
    ],
  },
  {
    group: 'Repurpose',
    items: [
      { id: 'repurpose-short', label: 'Long-form → 5 short posts', platform: 'Multi', icon: RefreshCw },
      { id: 'repurpose-platform', label: 'One idea → all platforms', platform: 'Multi', icon: RefreshCw },
      { id: 'repurpose-email', label: 'Post → email newsletter', platform: 'Email', icon: Mail },
      { id: 'comment-reply', label: 'Comment reply suggestions', platform: 'Multi', icon: Send },
    ],
  },
]

const EXAMPLE_OUTPUTS = {
  'ig-caption': `Just spent 3 days rethinking how I teach this.

And I realized - most people who struggle with [topic] aren't missing knowledge.

They're missing accountability.

So I built something about that.

Dropping Friday. Comment "in" and I'll send you the link first. 👇

#[niche] #[product] #creatorbusiness`,

  'x-thread': `1/ I spent 14 months building my creator business the wrong way.

Here's what I wish I'd known from day 1 (thread):

2/ Most creators start by trying to "go viral."
Wrong move. You don't need reach - you need a buyer persona.

3/ The fastest path isn't more content.
It's the right content, to the right 1,000 people, with one clear ask.

4/ Build the thing before you think you're ready.
Your audience will tell you if it's what they need.

5/ The biggest unlock: email > every platform combined.
Build your list from day one. Every post should have one.

6/ And finally: charge more than you think you should.
Underpricing kills momentum. $97 to $297 is not a big leap for the right buyer.

7/ That's it. If this helped:
→ Follow me for more
→ Check out [product] - link in bio
→ Reply with what you're building. I read every one.`,

  'email-announce': `Subject: It's finally here.

[First name],

I've been hinting at this for weeks. Today it's real.

[Product Name] is open.

Here's what you get:
- [Feature 1]
- [Feature 2]
- [Feature 3]

Founding members get 40% off - this pricing closes [date].

I built this because I kept seeing [problem]. You deserve something better.

→ Join [Product Name] here: [link]

Talk soon,
[Name]

P.S. I'll only keep this pricing for the first 100 members. If you're on the fence, this is the moment.`,

  'yt-ad': `[HOOK 0:00–0:08]
"I spent two years figuring this out the hard way. I just made it so you don't have to."

[PROBLEM 0:08–0:18]
"If you've been creating content and watching it go nowhere - not building a real business - this is exactly why."

[SOLUTION 0:18–0:38]
"[Product Name] is everything I wish existed when I started. [Feature 1]. [Feature 2]. And a community of people who are in the same chapter you are."

[SOCIAL PROOF 0:38–0:48]
"Creators like [example] used this to [result] in [timeframe]."

[CTA 0:48–0:60]
"Click below. Founding member pricing is open for 72 hours. I'll see you on the inside."`,

  'offer-copy': `**The headline**
Stop creating for free. Start building what your audience will actually pay for.

**The subheadline**
[Product Name] is the [type] built for creators who are ready to turn their audience into a real business.

**The ask**
You've built the audience. Forge built the engine.

Here's what's inside:
→ [Feature / module 1 with outcome]
→ [Feature / module 2 with outcome]
→ [Feature / module 3 with outcome]

**The close**
[Product Name] is $[price]/month. Cancel anytime.
But founding members pay $[discounted] - forever.

[CTA button: Join [Product Name] →]`,

  'podcast-outline': `[EPISODE OUTLINE]
Title: How to scale your creator business in 2026

[0:00–2:00] Intro hook: Ask the listener if they feel stuck trading time for views.
[2:00–10:00] Main topic 1: Decoupling views from revenue. Introduce digital modules.
[10:00–20:00] Main topic 2: Building your core signature product. Step-by-step layout.
[20:00–30:00] Main topic 3: Case studies of creators who did it.
[30:00–35:00] Outro + CTA: Join [Product Name] for templates and group coaching.`,

  'podcast-intro': `[SHOW INTRO]
"Hey guys, welcome back to the show. I'm your host, and today we're talking about one of the most critical unlocks for any creator looking to turn their content into a real business.

If you're tired of chasing views and want to build a sustainable, high-margin asset — this episode is for you.

Let's dive in."`,

  'default': `Writing your [content type] for [product]...

[Platform-optimized copy generated based on your niche, audience, and product positioning. Edit anything before publishing.]

→ Your hook goes here
→ Your body content (2–4 lines)
→ Your CTA

Ready to use. Want me to make it bolder, shorter, or remixed for another platform?`,
}

const TONE_OPTIONS = ['Confident', 'Casual', 'Bold', 'Minimal', 'Story-driven']
const PLATFORM_COLORS = {
  Instagram: 'rgba(225,48,108,0.2)',
  Twitter: 'rgba(29,161,242,0.2)',
  YouTube: 'rgba(255,0,0,0.2)',
  Email: 'rgba(255,255,255,0.08)',
  Product: 'rgba(255,255,255,0.08)',
  Multi: 'rgba(255,255,255,0.08)',
  TikTok: 'rgba(255,255,255,0.08)',
  LinkedIn: 'rgba(10,102,194,0.2)',
  Podcast: 'rgba(139,92,246,0.2)',
}

const STUDIO_JOB = 'studio-gen'

export default function Studio() {
  const { creatorData, startBgJob, cancelBgJob, clearBgJob, incrementAiActions, triggerToast } = useForge()
  const accent = getAccent(creatorData.platform)
  const studioJob = useBgJob(STUDIO_JOB)

  const [selectedType, setSelectedType] = useState(null)
  const [input, setInput] = useState('')
  const [generated, setGenerated] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [tone, setTone] = useState('Confident')
  const [copied, setCopied] = useState(false)
  const [expandedGroup, setExpandedGroup] = useState('Social')
  const [scheduled, setScheduled] = useState(false)
  const [showKeys, setShowKeys] = useState(false)

  const handle = creatorData?.handle || 'default'

  // Load cached generated text when selectedType changes
  useEffect(() => {
    if (selectedType) {
      const cached = localStorage.getItem(`forge_${handle}_studio_${selectedType.id}`)
      setGenerated(cached || null)
    } else {
      setGenerated(null)
    }
  }, [selectedType, handle])

  // Save generated text to localStorage
  useEffect(() => {
    if (selectedType && generated !== null) {
      localStorage.setItem(`forge_${handle}_studio_${selectedType.id}`, generated)
    }
  }, [generated, selectedType, handle])

  // Apply result when bg job finishes (even after navigating away)
  useEffect(() => {
    if (studioJob.status === 'done' && studioJob.result !== null) {
      setGenerated(studioJob.result)
      setIsGenerating(false)
      clearBgJob(STUDIO_JOB)
      if (triggerToast) triggerToast('Script generated successfully!', 'success')
    }
    if (studioJob.status === 'cancelled') {
      const cached = localStorage.getItem(`forge_${handle}_studio_${selectedType?.id}`)
      setGenerated(cached || null)
      setIsGenerating(false)
      clearBgJob(STUDIO_JOB)
    }
    if (studioJob.status === 'error') {
      setGenerated(`(Generation failed: ${studioJob.error})`)
      setIsGenerating(false)
      clearBgJob(STUDIO_JOB)
    }
    if (studioJob.status === 'running') {
      setIsGenerating(true)
    }
  }, [studioJob.status, studioJob.result, studioJob.error, selectedType, handle, clearBgJob])

  const productName = creatorData.productName || 'Creator Academy'
  const features = creatorData.features || []

  // Dynamic content types reflecting onboarding modifications
  const contentTypes = [
    ...CONTENT_TYPES,
    ...(features.includes('Podcast section') ? [{
      group: 'Podcast',
      items: [
        { id: 'podcast-outline', label: 'Podcast episode outline', platform: 'Podcast', icon: Volume2 },
        { id: 'podcast-intro', label: 'Podcast show intro & hook', platform: 'Podcast', icon: Volume2 },
      ]
    }] : [])
  ]

  const handleGenerate = () => {
    if (!selectedType) return
    setIsGenerating(true)
    setGenerated(null)
    if (incrementAiActions) incrementAiActions()
    startBgJob(STUDIO_JOB, () => generateStudioContent(selectedType, input, creatorData, tone))
  }

  const handleRefine = (instruction) => {
    if (!selectedType) return
    setIsGenerating(true)
    setGenerated(null)
    if (incrementAiActions) incrementAiActions()
    startBgJob(STUDIO_JOB, () => generateStudioContent(
      selectedType,
      `${input ? `${input}. ` : ''}Please rewrite the previous copy with this direction: ${instruction}`,
      creatorData,
      tone
    ))
  }

  const handleAdaptPlatform = (platformName) => {
    if (!selectedType) return
    setIsGenerating(true)
    setGenerated(null)
    const flatTypes = contentTypes.flatMap(g => g.items)
    const matchedType = flatTypes.find(t => t.platform.toLowerCase() === platformName.toLowerCase()) || selectedType
    setSelectedType(matchedType)
    if (incrementAiActions) incrementAiActions()
    startBgJob(STUDIO_JOB, () => generateStudioContent(
      matchedType,
      `${input ? `${input}. ` : ''}Adapt this copy to suit the ${platformName} platform rules, format, length, and best practices.`,
      creatorData,
      tone
    ))
  }

  const handleCopy = () => {
    if (!generated) return
    navigator.clipboard.writeText(generated)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }


  return (
    <div className="flex h-full">
      {/* ─── Left: Type selector ────────────────────────────────── */}
      <div className="w-56 border-r flex-shrink-0 overflow-y-auto py-4" style={{ borderColor: 'var(--theme-border-color)' }}>
        <p className="forge-label px-4 mb-3">Content type</p>

        {contentTypes.map(group => (
          <div key={group.group}>
            <button
              onClick={() => setExpandedGroup(g => g === group.group ? null : group.group)}
              className="w-full flex items-center justify-between px-4 py-2 transition-colors"
              style={{ color: 'var(--theme-text-muted)' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--theme-text)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--theme-text-muted)' }}
            >
              <span className="text-[11px] font-semibold uppercase tracking-wider">{group.group}</span>
              <ChevronDown
                size={12}
                style={{
                  transition: 'transform 0.2s',
                  transform: expandedGroup === group.group ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              />
            </button>

            {expandedGroup === group.group && (
              <div className="pb-2">
                {group.items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => { setSelectedType(item); setGenerated(null) }}
                    className="w-full text-left px-4 py-2 flex items-center gap-2.5 transition-all duration-150"
                    style={{
                      background: selectedType?.id === item.id ? 'var(--theme-accent-bg)' : 'transparent',
                      borderLeft: selectedType?.id === item.id ? '2px solid var(--theme-accent)' : '2px solid transparent',
                    }}
                    onMouseEnter={e => { if (selectedType?.id !== item.id) e.currentTarget.style.background = 'var(--theme-accent-bg)' }}
                    onMouseLeave={e => { if (selectedType?.id !== item.id) e.currentTarget.style.background = 'transparent' }}
                  >
                    <item.icon size={12} style={{ color: selectedType?.id === item.id ? 'var(--theme-text)' : 'var(--theme-text-muted)', flexShrink: 0 }} />
                    <span className="text-[12px] leading-tight" style={{ color: selectedType?.id === item.id ? 'var(--theme-text)' : 'var(--theme-text-muted)' }}>
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ─── Right: Generator ───────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!selectedType ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
            {/* Visual platform preview cards */}
            <div className="flex gap-3 mb-8">
              {[
                { color: 'rgba(225,48,108,0.15)', border: 'rgba(225,48,108,0.25)', label: 'IG', lines: [70, 55, 85] },
                { color: 'rgba(29,161,242,0.12)', border: 'rgba(29,161,242,0.2)', label: 'X', lines: [85, 60, 70, 45] },
                { color: 'rgba(255,0,0,0.1)', border: 'rgba(255,0,0,0.18)', label: 'YT', lines: [65, 80] },
              ].map((card, i) => (
                <div key={i} className="w-28 rounded-xl border p-3 text-left" style={{ background: card.color, borderColor: card.border }}>
                  <div className="text-[9px] font-bold mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>{card.label}</div>
                  <div className="space-y-1.5">
                    {card.lines.map((w, j) => (
                      <div key={j} className="h-1.5 rounded-full" style={{ width: `${w}%`, background: 'rgba(255,255,255,0.15)' }} />
                    ))}
                  </div>
                  <div className="mt-3 flex items-center gap-1">
                    <Sparkles size={9} style={{ color: 'rgba(255,255,255,0.3)' }} />
                    <div className="h-1 flex-1 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center mb-4">
              <Sparkles size={16} className="text-black" />
            </div>
            <h3 className="forge-heading mb-2" style={{ fontSize: '20px', letterSpacing: '-0.03em' }}>AI Content Studio</h3>
            <p className="text-[13px] max-w-xs" style={{ color: 'var(--theme-text-muted)', lineHeight: '1.5' }}>
              Choose a content type from the left to generate creator-ready assets for {productName}.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 justify-center max-w-sm">
              {['Instagram caption', 'X thread', 'Launch email', '60-sec ad script', 'Offer copy'].map(t => (
                <span key={t} className="text-[11px] px-3 py-1 rounded-full" style={{ background: 'var(--theme-accent-bg)', color: 'var(--theme-text-muted)', border: '1px solid var(--theme-accent-border)' }}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Top bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0" style={{ borderColor: 'var(--theme-border-color)' }}>
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: PLATFORM_COLORS[selectedType.platform] || 'rgba(255,255,255,0.08)' }}>
                  <selectedType.icon size={13} className="text-white/70" />
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-white">{selectedType.label}</p>
                  <p className="text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>{selectedType.platform}</p>
                </div>
              </div>

              {/* Tone selector */}
              <div className="flex items-center gap-2">
                <span className="text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>Tone:</span>
                <div className="flex gap-1">
                  {TONE_OPTIONS.map(t => (
                    <button key={t} onClick={() => setTone(t)}
                      className="text-[11px] px-2.5 py-1 rounded-full transition-all duration-150"
                      style={{
                        background: tone === t ? 'var(--theme-accent-bg)' : 'rgba(255,255,255,0.05)',
                        color: tone === t ? 'var(--theme-text)' : 'var(--theme-text-muted)',
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Input area */}
            <div className="px-6 py-4 border-b flex-shrink-0" style={{ borderColor: 'var(--theme-border-color)' }}>
              <p className="text-[12px] mb-2" style={{ color: 'var(--theme-text-muted)' }}>Context (optional)</p>
              <div className="flex gap-3">
                <div
                  className="flex-1 rounded-xl border px-4 py-2.5 transition-all duration-200 focus-within:border-white/20"
                  style={{ background: 'var(--theme-card-bg)', borderColor: 'var(--theme-border-color)' }}
                >
                  <input
                    className="forge-input text-[13px] w-full"
                    placeholder={`e.g. "focus on the community angle" or paste your idea here...`}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleGenerate()}
                  />
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="forge-btn-primary text-[13px] py-2.5 px-5 gap-2 flex-shrink-0"
                >
                  {isGenerating ? <RefreshCw size={13} className="animate-spin" /> : <Sparkles size={13} />}
                  Generate
                </button>
              </div>
            </div>

            {/* Output */}
            <div className="flex-1 overflow-y-auto px-6 py-4">


              {isGenerating ? (
                <div className="flex items-center gap-3 py-8">
                  <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center">
                    <Sparkles size={11} className="text-black" />
                  </div>
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'rgba(255,255,255,0.4)', animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                  <span className="text-[13px]" style={{ color: 'rgba(255,255,255,0.35)' }}>Writing your {selectedType.label}...</span>
                  <button
                    onClick={() => {
                      cancelBgJob(STUDIO_JOB)
                      setIsGenerating(false)
                    }}
                    className="ml-4 text-[11px] font-semibold text-white/40 hover:text-white/85 border border-white/10 hover:border-white/25 px-2.5 py-1 rounded-lg transition-all"
                  >
                    Cancel
                  </button>
                </div>
              ) : generated ? (
                <div>
                  {/* Output card */}
                  <div
                    className="rounded-2xl border p-5 mb-4 relative group"
                    style={{ background: 'var(--theme-card-bg)', borderColor: 'var(--theme-border-color)' }}
                  >
                    <pre className="text-[13px] whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--theme-text)', fontFamily: 'inherit', opacity: 0.85 }}>
                      {generated}
                    </pre>
                  </div>

                  {/* Action bar */}
                  <div className="flex flex-wrap gap-2">
                    <button onClick={handleCopy} className="forge-btn-secondary text-[12px] py-2 px-4 gap-1.5">
                      {copied ? <Check size={12} /> : <Copy size={12} />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                    <button onClick={handleGenerate} className="forge-btn-secondary text-[12px] py-2 px-4 gap-1.5">
                      <RefreshCw size={12} />
                      Regenerate
                    </button>
                    <button onClick={() => handleRefine('make it bolder, more high-energy, and direct')} className="forge-btn-secondary text-[12px] py-2 px-4">Make bolder</button>
                    <button onClick={() => handleRefine('shorten it significantly, making it concise and punchy')} className="forge-btn-secondary text-[12px] py-2 px-4">Shorten</button>
                    <button onClick={() => handleRefine('simplify the language to be extremely clear and easy to read')} className="forge-btn-secondary text-[12px] py-2 px-4">Simplify</button>

                    {/* Repurpose */}
                    <div className="ml-auto flex gap-2">
                      <button onClick={() => setScheduled(true)} className="forge-btn-primary text-[12px] py-2 px-4 gap-1.5">
                        <Calendar size={12} />
                        {scheduled ? 'Scheduled ✓' : 'Schedule post'}
                      </button>
                    </div>
                  </div>

                  {/* Adapt to other platforms */}
                  <div className="mt-5">
                    <p className="text-[12px] mb-3" style={{ color: 'var(--theme-text-muted)' }}>Adapt for other platforms</p>
                    <div className="flex flex-wrap gap-2">
                      {['Instagram', 'X / Twitter', 'LinkedIn', 'TikTok', 'Email', 'YouTube'].map(p => (
                        <button key={p}
                          className="text-[11px] px-3 py-1.5 rounded-full transition-all duration-150"
                          style={{ background: 'var(--theme-accent-bg)', color: 'var(--theme-text-muted)', border: '1px solid var(--theme-accent-border)' }}
                          onMouseEnter={e => { e.target.style.background = 'var(--theme-accent)'; e.target.style.color = 'var(--theme-btn-primary-text)' }}
                          onMouseLeave={e => { e.target.style.background = 'var(--theme-accent-bg)'; e.target.style.color = 'var(--theme-text-muted)' }}
                          onClick={() => handleAdaptPlatform(p)}
                        >
                          → {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8">
                  <p className="text-[13px] mb-4" style={{ color: 'var(--theme-text-muted)' }}>Recent outputs</p>
                  {[
                    { type: 'Instagram caption', preview: 'Just spent 3 days rethinking how I teach this...' },
                    { type: 'X thread', preview: '1/ I spent 14 months building my creator business the wrong way...' },
                    { type: 'Launch email', preview: 'Subject: It\'s finally here...' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3 p-3.5 rounded-xl mb-2 cursor-pointer transition-all duration-150"
                      style={{ background: 'var(--theme-card-bg)', border: '1px solid var(--theme-border-color)' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--theme-card-bg)'; e.currentTarget.style.borderColor = 'var(--theme-accent)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'var(--theme-card-bg)'; e.currentTarget.style.borderColor = 'var(--theme-border-color)' }}
                    >
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded flex-shrink-0 mt-0.5" style={{ background: 'var(--theme-accent-bg)', color: 'var(--theme-accent)' }}>
                        {item.type}
                      </span>
                      <p className="text-[12px] truncate" style={{ color: 'var(--theme-text-muted)' }}>{item.preview}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {showKeys && <ApiKeysModal onClose={() => setShowKeys(false)} defaultTab="ai" />}
    </div>
  )
}

