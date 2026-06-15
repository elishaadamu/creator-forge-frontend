import { useState, useEffect } from 'react'
import { useForge } from '../../App'
import {
  Package, Plus, ExternalLink, Users, DollarSign, BarChart2,
  Sparkles, RefreshCw, Check, ChevronRight, Radio, Edit3, Copy, Volume2, AlertCircle
} from 'lucide-react'
import { generateStudioContent } from '../../services/ai'

const AVAILABLE_MODULES = [
  { icon: Radio, label: 'Live events', description: 'Host live sessions and webinars' },
  { icon: DollarSign, label: 'Digital products', description: 'Sell templates, guides, and downloads' },
  { icon: BarChart2, label: 'Coaching tier', description: '1:1 or group coaching upsell' },
  { icon: Package, label: 'Newsletter', description: 'Paid newsletter for your members' },
]

const FORGE_SUGGESTIONS = [
  { label: 'Write offer page copy', icon: Sparkles },
  { label: 'Generate FAQ section', icon: Sparkles },
  { label: 'Create onboarding sequence', icon: Sparkles },
  { label: 'Write product description', icon: Sparkles },
]

export default function Products() {
  const { creatorData, triggerToast, setApiModalOpen, aiKeys, setActiveTab } = useForge()
  const [generating, setGenerating] = useState(null)
  const [generated, setGenerated] = useState({})
  const [copied, setCopied] = useState(null)
  const [activeTextLabel, setActiveTextLabel] = useState(null)

  const [membersCount, setMembersCount] = useState(() => {
    try {
      const stored = localStorage.getItem('forge_products_members')
      if (stored !== null) return parseInt(stored, 10)
    } catch {}
    return creatorData?.followers ? Math.round(creatorData.followers * 0.002) || 12 : 12
  })

  useEffect(() => {
    localStorage.setItem('forge_products_members', membersCount.toString())
  }, [membersCount])

  const productName = creatorData.productName || 'Creator Academy'
  const blueprint = creatorData.blueprint || { type: 'Web App' }
  const features = creatorData.features || []

  // Dynamic modules list reflecting onboarding choices
  const activeModules = [
    {
      id: 'courses',
      icon: Package,
      label: 'Course builder',
      description: 'Upload lessons, modules, and resources',
      status: 'Active',
      members: Math.round(membersCount * 0.8),
      cta: 'Upload first lesson',
    },
    {
      id: 'community',
      icon: Users,
      label: 'Community forum',
      description: 'Threaded discussions, announcements, DMs',
      status: 'Active',
      members: membersCount,
      cta: 'Post welcome message',
    },
    ...(features.includes('Podcast section') ? [{
      id: 'podcast',
      icon: Volume2,
      label: 'Podcast section',
      description: 'Publish audio episodes, show notes, and transcripts',
      status: 'Active',
      members: Math.round(membersCount * 0.5),
      cta: 'Upload first episode',
    }] : []),
    {
      id: 'offer-page',
      icon: ExternalLink,
      label: 'Offer page',
      description: 'Conversion-optimized landing page',
      status: 'Live',
      members: null,
      cta: 'Share link',
    },
  ]

  const handleGenerate = async (label) => {
    setGenerating(label)

    const hasKeys = aiKeys && (aiKeys.geminiKey || aiKeys.openaiKey || aiKeys.anthropicKey || aiKeys.togetherKey)
    if (!hasKeys) {
      // Demo Mode: Generate high-quality tailored mock copy
      setTimeout(() => {
        const mockMap = {
          'Write offer page copy': `**Headline**: Stop creating for free. Start building what your audience will actually pay for.

**Subheadline**: ${productName} is the premium space built for ${creatorData.niche || 'creators'} who are ready to turn their audience into a real business.

**What's Inside**:
→ Course builder to host your structured programs
→ Community forum for direct student discussions
→ Audio podcast section for subscriber episodes

**Pricing**: Join today for just $29/month.`,
          'Generate FAQ section': `**Q: Who is ${productName} for?**
A: It is designed specifically for my audience who wants to master ${creatorData.niche || 'content creation'} and build a sustainable brand.

**Q: Can I cancel my membership at any time?**
A: Yes! You can manage your subscription directly from your account page. There are no contracts or commitments.

**Q: How often is new content added?**
A: I publish new lessons and host live Q&A sessions weekly to ensure you always have fresh insights.`,
          'Create onboarding sequence': `**Email 1: Welcome to ${productName}! 👋**
Subject: You're in! Welcome to the family.
Body:
Hey there,

I am so excited to have you inside ${productName}. 

Over the next few weeks, you'll get access to my full library of training materials, our private community forum, and weekly live calls where we solve your biggest bottlenecks.

To get started, click here to log in and set up your profile.

See you inside!

---

**Email 2: Your first milestone 🚀**
Subject: The first step to master ${creatorData.niche || 'content creation'}
Body:
Hey!

Now that you're settled in, I want you to watch Lesson 1 in the Course Builder. It's only 10 minutes, but it lays the foundation for everything we build together.

Reply to this email when you've watched it!`,
          'Write product description': `Welcome to ${productName}! This is the ultimate hub where we learn, build, and scale together. 

Inside, you'll find step-by-step video courses, downloadable resource guides, and an active community of like-minded builders. Whether you are just starting out or looking to optimize your existing workflow, this space is built to give you the exact roadmap you need.`
        }
        
        const copy = mockMap[label] || `Mock copy generated for ${label}`
        setGenerated(prev => ({ ...prev, [label]: copy }))
        setActiveTextLabel(label)
        setGenerating(null)
        if (triggerToast) triggerToast(`${label} generated (Demo Mode)`, 'success')
      }, 800)
      return
    }

    try {
      const typeMap = {
        'Write offer page copy': { label: 'Offer Page Copy', platform: 'Product' },
        'Generate FAQ section': { label: 'FAQ section', platform: 'Product' },
        'Create onboarding sequence': { label: 'Welcome email onboarding sequence', platform: 'Email' },
        'Write product description': { label: 'Product description copy', platform: 'Product' },
      }
      
      const type = typeMap[label] || { label, platform: 'Product' }
      const copy = await generateStudioContent(type, '', creatorData)
      
      setGenerated(prev => ({ ...prev, [label]: copy }))
      setActiveTextLabel(label)
      if (triggerToast) triggerToast(`${label} generated!`, 'success')
    } catch (err) {
      console.error(err)
      if (triggerToast) triggerToast(err.message || 'Generation failed', 'error')
    } finally {
      setGenerating(null)
    }
  }

  const handleCopy = (label, text) => {
    navigator.clipboard.writeText(text || generated[label] || '')
    setCopied(label)
    if (triggerToast) triggerToast('Copied to clipboard!', 'success')
    setTimeout(() => setCopied(null), 2000)
  }

  const handleModuleCTA = (id, label) => {
    if (id === 'offer-page') {
      const url = `https://${creatorData.handle?.replace('@','') || 'creator'}.forge.app`
      navigator.clipboard.writeText(url)
      if (triggerToast) triggerToast('Offer page link copied to clipboard!', 'success')
    } else if (id === 'courses' || id === 'podcast') {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = id === 'courses' ? 'video/*,application/pdf' : 'audio/*'
      input.onchange = () => {
        if (triggerToast) triggerToast(`Mock upload started for: ${input.files[0]?.name || 'file'}`, 'info')
        setTimeout(() => {
          if (triggerToast) triggerToast('Upload completed! Lesson active.', 'success')
        }, 1500)
      }
      input.click()
    } else if (id === 'community') {
      if (triggerToast) triggerToast('Navigating to Community forum...', 'success')
      setTimeout(() => {
        setActiveTab('community')
      }, 500)
    }
  }

  const handleInviteBeta = () => {
    setMembersCount(prev => prev + 5)
    if (triggerToast) triggerToast('5 beta testers invited! Members updated.', 'success')
  }

  const handleQuickAction = (actionLabel) => {
    if (actionLabel === 'Share your offer page link') {
      const url = `https://${creatorData.handle?.replace('@','') || 'creator'}.forge.app`
      navigator.clipboard.writeText(url)
      if (triggerToast) triggerToast('Offer page link copied to clipboard!', 'success')
    } else if (actionLabel === 'Invite beta testers') {
      handleInviteBeta()
    } else if (actionLabel === 'Write your product description') {
      handleGenerate('Write product description')
    } else if (actionLabel === 'Set your founding member price') {
      const price = prompt("Enter your founding member price ($):", "29")
      if (price) {
        if (triggerToast) triggerToast(`Founding member price set to $${price}/month!`, 'success')
      }
    }
  }

  return (
    <div className="p-6 max-w-3xl space-y-8">

      {/* Header */}
      <div>
        <p className="forge-label mb-3">Products</p>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              className="forge-heading mb-1.5"
              style={{ fontSize: 'clamp(22px, 3vw, 30px)', letterSpacing: '-0.03em' }}
            >
              {productName}
            </h2>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[13px]" style={{ color: 'var(--theme-text-muted)' }}>
                Live · {blueprint.type} · {membersCount} members
              </span>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button 
              onClick={() => handleModuleCTA('offer-page')} 
              className="forge-btn-secondary text-[13px] py-2.5 gap-1.5"
            >
              <ExternalLink size={13} />
              View live
            </button>
            <button 
              onClick={() => {
                if (triggerToast) triggerToast('Select a slot below to add a new custom module.', 'info')
              }} 
              className="forge-btn-primary text-[13px] py-2.5 gap-1.5"
            >
              <Plus size={13} />
              Add module
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Users, label: 'Members', value: membersCount.toString(), sub: 'Invite your first 10' },
          { icon: DollarSign, label: 'Revenue', value: `$${membersCount * 29}`, sub: 'Share your launch link' },
          { icon: BarChart2, label: 'Conversion', value: '3.4%', sub: 'Healthy engagement' },
        ].map(({ icon: Icon, label, value, sub }) => (
          <div key={label} className="rounded-xl border p-4" style={{ background: 'var(--theme-card-bg)', borderColor: 'var(--theme-border-color)' }}>
            <Icon size={14} className="mb-2 text-white/30" />
            <p className="text-[22px] font-semibold tracking-tight text-white leading-none mb-1">{value}</p>
            <p className="text-[12px]" style={{ color: 'var(--theme-text-muted)' }}>{label}</p>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--theme-text-muted)', opacity: 0.7 }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Active modules */}
      <section>
        <p className="forge-label mb-4">Your modules</p>
        <div className="space-y-2">
          {activeModules.map(({ id, icon: Icon, label, description, status, members, cta }) => (
            <div
              key={id}
              className="flex items-center gap-4 p-4 rounded-xl border transition-all duration-150 group"
              style={{ background: 'var(--theme-card-bg)', borderColor: 'var(--theme-border-color)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--theme-card-bg)'; e.currentTarget.style.borderColor = 'var(--theme-accent)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--theme-card-bg)'; e.currentTarget.style.borderColor = 'var(--theme-border-color)' }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.07)' }}
              >
                <Icon size={16} className="text-white/50" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[13px] font-semibold text-white">{label}</span>
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: 'var(--theme-accent-bg)', color: 'var(--theme-accent)' }}
                  >
                    {status}
                  </span>
                </div>
                <p className="text-[12px]" style={{ color: 'var(--theme-text-muted)' }}>{description}</p>
                {members !== null && (
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--theme-text-muted)', opacity: 0.7 }}>{members} active users</p>
                )}
              </div>

              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleModuleCTA(id, label)}
                  className="text-[12px] px-3 py-1.5 rounded-full transition-all duration-150"
                  style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--theme-text-muted)' }}
                  onMouseEnter={e => { e.target.style.background = 'var(--theme-accent-bg)'; e.target.style.color = 'var(--theme-text)' }}
                  onMouseLeave={e => { e.target.style.background = 'rgba(255,255,255,0.08)'; e.target.style.color = 'var(--theme-text-muted)' }}
                >
                  {cta} →
                </button>
              </div>
            </div>
          ))}

          {/* Add module slots */}
          {AVAILABLE_MODULES.slice(0, 2).map(mod => (
            <button
              key={mod.label}
              onClick={() => {
                if (triggerToast) triggerToast(`Module "${mod.label}" added to your workspace!`, 'success')
              }}
              className="w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-150"
              style={{ background: 'transparent', borderStyle: 'dashed', borderColor: 'var(--theme-border-color)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--theme-accent)'; e.currentTarget.style.background = 'var(--theme-accent-bg)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--theme-border-color)'; e.currentTarget.style.background = 'transparent' }}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <mod.icon size={15} className="text-white/25" />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-medium" style={{ color: 'var(--theme-text-muted)' }}>{mod.label}</p>
                <p className="text-[12px]" style={{ color: 'var(--theme-text-muted)', opacity: 0.6 }}>{mod.description}</p>
              </div>
              <Plus size={14} className="text-white/20 flex-shrink-0" />
            </button>
          ))}
        </div>
      </section>

      {/* Forge AI suggestions for product copy */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <p className="forge-label">Generate product copy</p>
          <span className="text-[12px]" style={{ color: 'var(--theme-text-muted)' }}>AI-written, edit before publishing</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {FORGE_SUGGESTIONS.map(({ label, icon: Icon }) => (
            <button
              key={label}
              onClick={() => handleGenerate(label)}
              disabled={generating === label}
              className="text-left rounded-xl border p-4 transition-all duration-150 group"
              style={{
                background: generated[label] ? 'var(--theme-accent-bg)' : 'var(--theme-card-bg)',
                borderColor: generated[label] ? 'var(--theme-accent)' : 'var(--theme-border-color)',
              }}
              onMouseEnter={e => { if (!generated[label]) { e.currentTarget.style.background = 'var(--theme-card-bg)'; e.currentTarget.style.borderColor = 'var(--theme-accent)' } }}
              onMouseLeave={e => { if (!generated[label]) { e.currentTarget.style.background = 'var(--theme-card-bg)'; e.currentTarget.style.borderColor = 'var(--theme-border-color)' } }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.07)' }}>
                  {generating === label
                    ? <RefreshCw size={13} className="text-white/50 animate-spin" />
                    : generated[label]
                      ? <Check size={13} className="text-white/70" />
                      : <Icon size={13} className="text-white/50" />
                  }
                </div>
                {generated[label] && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleCopy(label, generated[label]) }}
                    className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.07)', color: 'var(--theme-text-muted)' }}
                  >
                    {copied === label ? <Check size={9} /> : <Copy size={9} />}
                    {copied === label ? 'Copied' : 'Copy'}
                  </button>
                )}
              </div>
              <p className="text-[12px] font-medium" style={{ color: generated[label] ? 'white' : 'var(--theme-text)' }}>
                {label}
              </p>
              {generated[label] && (
                <p className="text-[11px] mt-1" style={{ color: 'var(--theme-text-muted)' }}>
                  Generated · click to regenerate
                </p>
              )}
            </button>
          ))}
        </div>

        {activeTextLabel && generated[activeTextLabel] && (
          <div 
            className="rounded-2xl border p-5 mt-4 relative animate-fade-in-up flex flex-col"
            style={{ background: 'var(--theme-card-bg)', borderColor: 'var(--theme-accent)' }}
          >
            <div className="flex items-center justify-between mb-3 border-b pb-2" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
              <span className="text-[11.5px] font-bold uppercase tracking-wider text-white/60">{activeTextLabel}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleCopy(activeTextLabel, generated[activeTextLabel])}
                  className="flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-lg border transition-all"
                  style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'var(--theme-border-color)', color: 'var(--theme-text)' }}
                >
                  {copied === activeTextLabel ? <Check size={11} /> : <Copy size={11} />}
                  {copied === activeTextLabel ? 'Copied!' : 'Copy to clipboard'}
                </button>
                <button
                  onClick={() => setActiveTextLabel(null)}
                  className="text-[11px] px-2 py-1 hover:text-white"
                  style={{ color: 'var(--theme-text-muted)' }}
                >
                  Close
                </button>
              </div>
            </div>
            <pre className="text-[12.5px] whitespace-pre-wrap leading-relaxed opacity-85 text-white" style={{ fontFamily: 'inherit' }}>
              {generated[activeTextLabel]}
            </pre>
          </div>
        )}
      </section>

      {/* Quick actions */}
      <section>
        <p className="forge-label mb-4">Quick actions</p>
        <div className="space-y-1.5">
          {[
            { label: 'Share your offer page link', sub: 'Copy the URL to post on your channels' },
            { label: 'Set your founding member price', sub: 'Lock in early-access pricing before going wide' },
            { label: 'Write your product description', sub: 'Forge will draft it for you in 10 seconds' },
            { label: 'Invite beta testers', sub: 'Get your first 5 members to give feedback' },
          ].map((item, i) => (
            <div
              key={i}
              onClick={() => handleQuickAction(item.label)}
              className="flex items-center gap-4 px-4 py-3 rounded-xl border cursor-pointer transition-all duration-150"
              style={{ background: 'var(--theme-card-bg)', borderColor: 'var(--theme-border-color)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--theme-card-bg)'; e.currentTarget.style.borderColor = 'var(--theme-accent)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--theme-card-bg)'; e.currentTarget.style.borderColor = 'var(--theme-border-color)' }}
            >
              <div className="flex-1">
                <p className="text-[13px] font-medium text-white">{item.label}</p>
                <p className="text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>{item.sub}</p>
              </div>
              <ChevronRight size={14} className="text-white/20 flex-shrink-0" />
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}
