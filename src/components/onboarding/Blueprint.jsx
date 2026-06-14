import { useState, useEffect } from 'react'
import { useForge, getAccent, useBgJob } from '../../App'
import { ArrowRight, Globe, Smartphone, ShoppingBag, Users, Youtube, Instagram, Twitter, CheckCircle, Play } from 'lucide-react'
import WingLogo from '../ui/WingLogo'
import { getScrapePromise, isScrapePending } from '../../services/scraper'
import { generateRecommendationsAI } from '../../services/ai'


// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n) {
  n = parseInt(n) || 0
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${Math.round(n / 1_000)}K`
  return String(n)
}

const PLATFORM_ICONS = {
  youtube:   Youtube,
  instagram: Instagram,
  twitter:   Twitter,
  tiktok:    Globe,
}

const PLATFORM_LABELS = {
  youtube:   'YouTube',
  instagram: 'Instagram',
  twitter:   'X / Twitter',
  tiktok:    'TikTok',
}

// ── Creator blurb from scraped signals ───────────────────────────────────────

function buildCreatorBlurb(creator) {
  const { name, handle, platform, followers, engagementRate, niche, description } = creator
  const displayName = name || (handle || '').replace('@', '') || 'This creator'
  const fmtFollowers = followers ? fmt(followers) : null
  const eng = parseFloat(engagementRate) || 0
  const platformLabel = PLATFORM_LABELS[platform] || platform || 'social'

  // Use real bio if available and meaningful
  if (description && description.length > 20) {
    const short = description.split('.')[0].trim()
    if (short.length > 15 && short.length < 120) return short
  }

  // Build from signals
  const parts = []
  if (niche && niche !== 'Lifestyle & Creativity') parts.push(`${niche} creator`)
  else parts.push('creator')

  if (fmtFollowers) parts.push(`with ${fmtFollowers} ${platformLabel} followers`)

  if (eng >= 6) parts.push('and an exceptionally engaged audience')
  else if (eng >= 3.5) parts.push('and a highly engaged audience')
  else if (eng > 0) parts.push('and an established community')

  return displayName + ' is a ' + parts.join(' ')
}

// ── Why-this-fits reasons (dynamic per blueprint × creator) ──────────────────

function buildReasons(blueprintId, creator) {
  const { platform, followers, engagementRate, niche, description } = creator
  const eng = parseFloat(engagementRate) || 0
  const subs = parseInt(followers) || 0
  const desc = (description || '').toLowerCase()
  const nicheL = (niche || '').toLowerCase()

  const isEducation  = nicheL.includes('educat') || nicheL.includes('learn') || desc.includes('teach') || desc.includes('learn') || desc.includes('course')
  const isEntertain  = nicheL.includes('comedy') || nicheL.includes('entertain') || nicheL.includes('gaming')
  const isTech       = nicheL.includes('tech') || nicheL.includes('gadget')
  const isFinance    = nicheL.includes('finance') || nicheL.includes('business')
  const isLifestyle  = nicheL.includes('lifestyle') || nicheL.includes('travel') || nicheL.includes('fitness')
  const isYouTube    = platform === 'youtube'
  const isShortForm  = platform === 'tiktok' || platform === 'instagram'
  const highEng      = eng >= 4
  const veryHighEng  = eng >= 6

  switch (blueprintId) {
    case 'web-app': return [
      subs >= 100_000
        ? `${fmt(subs)} followers signals a large enough base to support a paid platform from day one`
        : `Your engaged community is the right size to test a paid platform`,
      isYouTube
        ? `YouTube audiences expect long-form depth — a course platform is the natural next step`
        : `Your ${PLATFORM_LABELS[platform] || 'social'} audience already shows interest in learning from you`,
      highEng
        ? `${eng}% engagement rate means your audience is primed to pay for exclusive access`
        : `Your audience follows you for a reason — that trust converts to subscriptions`,
      isEducation
        ? `Your ${niche} niche has proven willingness to pay for structured knowledge`
        : `Course platforms work for every niche — yours included`,
    ]

    case 'mobile-app': return [
      isShortForm
        ? `${PLATFORM_LABELS[platform]} audiences check their phone constantly — a native app fits their behavior`
        : `A mobile app extends your YouTube presence into daily screen time`,
      veryHighEng
        ? `${eng}% engagement proves your audience wants more from you than a feed can offer`
        : `Push notifications can 3x your retention vs social algorithms`,
      `Mobile apps generate recurring revenue through in-app purchases and subscriptions`,
      isEntertain
        ? `Entertainment content thrives with daily drops and exclusive clips`
        : `Exclusive daily content keeps members coming back`,
    ]

    case 'community': return [
      highEng
        ? `${eng}% engagement means your followers already talk to each other — you just need a home for it`
        : `Even a small paid community from ${fmt(subs)} followers yields significant MRR`,
      isLifestyle || isFinance
        ? `${niche} followers pay premium for peer accountability and insider access`
        : `Paid communities work when people trust the host — your followers clearly do`,
      `Monthly memberships create predictable recurring revenue, unlike one-time products`,
      isYouTube
        ? `YouTube comment sections are screaming for a dedicated community space`
        : `Your most engaged followers want somewhere to connect beyond the algorithm`,
    ]

    case 'digital-products': return [
      `One-time products require zero ongoing effort after launch`,
      isFinance || isTech
        ? `${niche} audiences pay well for templates, tools, and frameworks that save them time`
        : `Templates and guides in your niche sell on autopilot once listed`,
      subs >= 50_000
        ? `At ${fmt(subs)} followers, even a 0.1% conversion rate means hundreds of sales per launch`
        : `Digital products have zero inventory risk — perfect for testing what your audience pays for`,
      `Bundles and upsells can multiply revenue per customer without extra content`,
    ]

    default: return []
  }
}

function getFallbackCleanRecommendations(creatorData) {
  const name = creatorData.name || creatorData.handle?.replace('@','') || 'Creator'
  return [
    {
      id: 'fallback-course',
      product_name: `${name}'s Creator Academy`,
      product_category: 'course',
      tagline: 'Step-by-step masterclass course platform',
      description: `A branded premium learning hub where your audience can buy courses and training material directly from you.`,
      revenue_potential: '$8K–$30K / mo',
      confidence_score: 0.99
    },
    {
      id: 'fallback-app',
      product_name: `${name} Club`,
      product_category: 'app',
      tagline: 'Your custom mobile application',
      description: 'An iOS/Android app allowing you to reach your audience directly on their phone screens.',
      revenue_potential: '$5K–$20K / mo',
      confidence_score: 0.87
    },
    {
      id: 'fallback-community',
      product_name: `${name} Inner Circle`,
      product_category: 'community',
      tagline: 'Private member-only community',
      description: 'A paid gated community for your followers with exclusive discussion boards, Q&As, and perks.',
      revenue_potential: '$3K–$15K / mo',
      confidence_score: 0.81
    },
    {
      id: 'fallback-store',
      product_name: `${name} Store`,
      product_category: 'physical_product',
      tagline: 'Templates, guides, and toolkits',
      description: 'A dedicated storefront containing digital resources, guides, and checklists matching your niche.',
      revenue_potential: '$2K–$12K / mo',
      confidence_score: 0.74
    }
  ]
}

// ── Blueprint definitions ─────────────────────────────────────────────────────

const BLUEPRINTS = [
  {
    id: 'web-app',
    type: 'Web App',
    name: 'Creator Academy',
    tagline: 'Your own skill-building platform',
    description: 'A branded learning hub where your audience pays for courses, live sessions, and exclusive resources — all under your name.',
    revenue: '$8K–$30K / mo',
    fit: 99,
    icon: Globe,
    primary: true,
    preview: 'webapp',
    features: ['Course builder', 'Community forum', 'Live events', 'Analytics'],
  },
  {
    id: 'mobile-app',
    type: 'Mobile App',
    name: 'Creator Club',
    tagline: 'Daily drops on mobile',
    description: 'An iOS/Android app your audience installs and returns to daily.',
    revenue: '$5K–$20K / mo',
    fit: 87,
    icon: Smartphone,
    preview: 'mobile',
    features: ['Push notifications', 'Members feed', 'Exclusive drops', 'In-app purchases'],
  },
  {
    id: 'community',
    type: 'Membership',
    name: 'Inner Circle',
    tagline: 'A paid community for your people',
    description: 'Gated community with tiered memberships and monthly live AMAs.',
    revenue: '$3K–$15K / mo',
    fit: 81,
    icon: Users,
    preview: 'community',
    features: ['Tiered tiers', 'Private forum', 'Monthly AMAs', 'Exclusive perks'],
  },
  {
    id: 'digital-products',
    type: 'Digital Products',
    name: 'Creator Store',
    tagline: 'Templates, guides, and toolkits',
    description: 'A curated storefront of high-value digital products your audience already wants.',
    revenue: '$2K–$12K / mo',
    fit: 74,
    icon: ShoppingBag,
    preview: 'store',
    features: ['Instant delivery', 'Bundled packs', 'Upsells', 'Affiliate support'],
  },
]

// ── Preview mocks ─────────────────────────────────────────────────────────────

function WebAppPreview({ accent }) {
  return (
    <div className="w-full h-full flex flex-col p-3 gap-2">
      <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <div className="w-16 h-2 rounded-full shimmer-line" />
        <div className="flex gap-1.5">
          {[8,8,10].map((w,i) => <div key={i} className="h-2 rounded-full" style={{ width: `${w*4}px`, background: 'rgba(255,255,255,0.08)' }} />)}
        </div>
      </div>
      <div className="rounded-lg p-2.5 flex-shrink-0" style={{ background: `rgba(${accent.rgb},0.08)` }}>
        <div className="w-20 h-1.5 rounded-full shimmer-line mb-1.5" />
        <div className="w-32 h-2.5 rounded-full" style={{ background: 'rgba(255,255,255,0.12)' }} />
      </div>
      <div className="grid grid-cols-2 gap-1.5 flex-1">
        {[1,2,3,4].map(i => (
          <div key={i} className="rounded-lg p-2 flex flex-col gap-1" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <div className="w-full h-8 rounded-md" style={{ background: 'rgba(255,255,255,0.07)' }} />
            <div className="w-3/4 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <div className="w-1/2 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} />
          </div>
        ))}
      </div>
    </div>
  )
}

function MobilePreview() {
  return (
    <div className="w-full h-full flex items-center justify-center p-3">
      <div className="relative rounded-3xl border-2 overflow-hidden"
        style={{ width: '100px', height: '175px', borderColor: 'rgba(255,255,255,0.15)', background: '#111' }}>
        <div className="flex justify-between items-center px-3 pt-2 pb-1">
          <div className="w-8 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }} />
          <div className="w-10 h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }} />
        </div>
        <div className="px-2 space-y-1.5">
          {[1,2,3].map(i => (
            <div key={i} className="rounded-lg p-1.5 flex gap-1.5" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div className="w-5 h-5 rounded-full flex-shrink-0" style={{ background: 'rgba(255,255,255,0.1)' }} />
              <div className="flex-1 space-y-1">
                <div className="w-full h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }} />
                <div className="w-2/3 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} />
              </div>
            </div>
          ))}
        </div>
        <div className="absolute bottom-0 left-0 right-0 flex justify-around py-1.5 border-t"
          style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.6)' }}>
          {[1,2,3,4].map(i => (
            <div key={i} className="w-3.5 h-3.5 rounded-full"
              style={{ background: i === 1 ? 'white' : 'rgba(255,255,255,0.15)' }} />
          ))}
        </div>
      </div>
    </div>
  )
}

function CommunityPreview() {
  return (
    <div className="w-full h-full flex gap-2 p-3">
      <div className="flex flex-col gap-1.5 w-14 flex-shrink-0">
        {['Members','Posts','Events','Chat'].map((l, i) => (
          <div key={l} className="px-1.5 py-1 rounded-lg text-center"
            style={{ background: i === 0 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)', fontSize: '7px', color: 'rgba(255,255,255,0.5)' }}>
            {l}
          </div>
        ))}
      </div>
      <div className="flex-1 space-y-1.5">
        {[1,2,3].map(i => (
          <div key={i} className="rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-3.5 h-3.5 rounded-full" style={{ background: 'rgba(255,255,255,0.12)' }} />
              <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }} />
            </div>
            <div className="space-y-0.5">
              <div className="w-full h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }} />
              <div className="w-3/4 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function StorePreview() {
  return (
    <div className="w-full h-full p-3">
      <div className="w-20 h-2 rounded-full shimmer-line mb-3" />
      <div className="grid grid-cols-2 gap-1.5">
        {[1,2,3,4].map(i => (
          <div key={i} className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <div className="w-full h-14" style={{ background: `rgba(255,255,255,${0.06 + i * 0.02})` }} />
            <div className="p-1.5 space-y-1">
              <div className="w-3/4 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }} />
              <div className="w-1/2 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const PREVIEW_COMPONENTS = { webapp: WebAppPreview, mobile: MobilePreview, community: CommunityPreview, store: StorePreview }

// ── Main component ────────────────────────────────────────────────────────────

// ── Mapping Recommendations ──────────────────────────────────────────────────

function mapRecommendationsToBlueprints(recs) {
  if (!recs || recs.length === 0) return BLUEPRINTS

  const CATEGORY_MAP = {
    course:            { type: 'Web App', icon: Globe, preview: 'webapp' },
    community:         { type: 'Membership', icon: Users, preview: 'community' },
    app:               { type: 'Mobile App', icon: Smartphone, preview: 'mobile' },
    physical_product:  { type: 'Digital Products', icon: ShoppingBag, preview: 'store' },
    saas:              { type: 'Web App', icon: Globe, preview: 'webapp' },
    coaching:          { type: 'Membership', icon: Users, preview: 'community' },
    newsletter:        { type: 'Web App', icon: Globe, preview: 'webapp' },
    other:             { type: 'Digital Products', icon: ShoppingBag, preview: 'store' },
  }

  return recs.slice(0, 4).map((r, index) => {
    const config = CATEGORY_MAP[r.product_category] || CATEGORY_MAP.other
    const featuresMap = {
      course: ['Course builder', 'Community forum', 'Live events', 'Analytics'],
      community: ['Private forum', 'Tiered tiers', 'Monthly AMAs', 'Exclusive perks'],
      app: ['Push notifications', 'Members feed', 'Exclusive drops', 'In-app purchases'],
      physical_product: ['Instant delivery', 'Bundled packs', 'Upsells', 'Affiliate support'],
      saas: ['Custom domain', 'API access', 'Billing integration', 'Analytics dashboard'],
      coaching: ['Booking calendar', '1-on-1 video', 'Resource sharing', 'Messaging'],
      newsletter: ['Email publisher', 'Subscriber list', 'Paid sponsorships', 'Premium archives'],
      other: ['Custom storefront', 'Digital delivery', 'Secure checkout', 'Customer dashboard']
    }

    return {
      id: r.id || `rec-${index}`,
      type: config.type,
      name: r.product_name,
      tagline: r.tagline || 'Custom built for your brand',
      description: r.description || 'A tailored monetization platform designed specifically for your audience niche.',
      revenue: r.revenue_potential || '$5K–$25K / mo',
      fit: Math.round((r.confidence_score || 0.8) * 100),
      icon: config.icon,
      primary: index === 0,
      preview: config.preview,
      features: featuresMap[r.product_category] || featuresMap.other,
      raw: r
    }
  })
}

function getReasonsCategoryKey(selectedBlueprint) {
  if (!selectedBlueprint) return 'web-app'
  const preview = selectedBlueprint.preview
  if (preview === 'webapp') return 'web-app'
  if (preview === 'mobile') return 'mobile-app'
  if (preview === 'community') return 'community'
  if (preview === 'store') return 'digital-products'
  return 'web-app'
}

export default function Blueprint() {
  const { next, creatorData, updateCreator, startBgJob } = useForge()
  const accent  = getAccent(creatorData.platform)
  
  const recsJob = useBgJob('onboarding-recs')
  const blueprints = mapRecommendationsToBlueprints(creatorData.recommendations)
  const [selected, setSelected] = useState(blueprints[0]?.id)
  const [visible,  setVisible]  = useState(false)
  const [showReasons, setShowReasons] = useState(false)
  const [isScraping, setIsScraping] = useState(false)
  const [quotaWarning, setQuotaWarning] = useState(null)

  const recs = creatorData.recommendations
  const isPlaceholder = recs && recs.length === 1 && (recs[0].product_name?.includes('[Placeholder]') || recs[0].product_name?.includes('Placeholder'))
  const hasNoRecs = !recs || recs.length === 0 || isPlaceholder

  const isGenerating = recsJob.status === 'running' || (hasNoRecs && recsJob.status === 'idle')

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const promise = getScrapePromise()
    if (promise && isScrapePending()) {
      setIsScraping(true)
      promise
        .then(() => setIsScraping(false))
        .catch(() => setIsScraping(false))
    } else {
      setIsScraping(false)
    }
  }, [])

  useEffect(() => {
    if (hasNoRecs && recsJob.status === 'idle') {
      startBgJob('onboarding-recs', async (sig) => {
        const aiRecs = await generateRecommendationsAI(creatorData, sig)
        if (aiRecs && Array.isArray(aiRecs) && aiRecs.length > 0) {
          return aiRecs
        }
        throw new Error("Empty recommendations response")
      })
    }
  }, [hasNoRecs, recsJob.status])

  useEffect(() => {
    if (recsJob.status === 'done' && recsJob.result) {
      updateCreator({ recommendations: recsJob.result })
    } else if (recsJob.status === 'error') {
      const fallbacks = getFallbackCleanRecommendations(creatorData)
      updateCreator({ recommendations: fallbacks })
      setQuotaWarning(
        recsJob.error?.includes('429') || recsJob.error?.includes('exceeded')
          ? "API rate limit exceeded. Loaded default product templates." 
          : "Failed to generate recommendations. Loaded default templates."
      )
    }
  }, [recsJob.status, recsJob.result, recsJob.error])

  useEffect(() => {
    if (blueprints.length > 0 && !blueprints.some(b => b.id === selected)) {
      setSelected(blueprints[0].id)
    }
  }, [creatorData.recommendations])

  const selectedBlueprint = blueprints.find(b => b.id === selected) || blueprints[0]
  const primary           = blueprints[0]
  const alternates        = blueprints.slice(1)

  const blurb   = buildCreatorBlurb(creatorData)
  const reasonsKey = getReasonsCategoryKey(selectedBlueprint)
  const reasons = buildReasons(reasonsKey, creatorData)

  const PlatformIcon = PLATFORM_ICONS[creatorData.platform] || Globe

  const handleContinue = () => {
    if (isScraping || isGenerating) return
    updateCreator({ blueprint: selectedBlueprint, productName: selectedBlueprint.name })
    next()
  }

  const PreviewComp = PREVIEW_COMPONENTS[primary.preview]

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-2.5">
          <WingLogo size={26} />
          <span className="text-white font-semibold text-[15px] tracking-tight">Creator Forge</span>
        </div>
        <div className="flex items-center gap-1.5">
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="rounded-full transition-all duration-300"
              style={{ width: i === 4 ? '20px' : '6px', height: '6px',
                background: i === 4 ? 'white' : i < 4 ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.12)' }}
            />
          ))}
        </div>
      </header>

      <main className="flex-1 px-6 pb-12 max-w-5xl mx-auto w-full">
        {quotaWarning && (
          <div className="mb-6 p-4 rounded-xl border flex items-center justify-between gap-4" style={{ background: 'rgba(245, 158, 11, 0.05)', borderColor: 'rgba(245, 158, 11, 0.15)' }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
                <CheckCircle size={16} className="text-amber-400" />
              </div>
              <div>
                <p className="text-[13px] font-medium text-white">Rate Limit Notice</p>
                <p className="text-[12px] text-white/50">{quotaWarning}</p>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════ SKELETON LOADER ═══════════════ */}
        {(isScraping || isGenerating) ? (
          <div style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.4s ease' }}>

            {/* ── Loading Title & Status ── */}
            <div className="mb-10" style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(16px)', transition: 'all 0.55s cubic-bezier(0.16,1,0.3,1)' }}>
              <p className="forge-label mb-3">Product Blueprint</p>
              <h2 className="forge-heading mb-3"
                style={{ fontSize: 'clamp(26px, 4vw, 38px)', letterSpacing: '-0.035em', maxWidth: '520px' }}>
                {isScraping ? 'Analyzing your channel…' : 'Generating your blueprint…'}
              </h2>
              <p className="text-[14px] max-w-md" style={{ color: 'rgba(255,255,255,0.4)', lineHeight: '1.6' }}>
                {isScraping
                  ? 'Forge is scraping your profile data, recent posts, and audience signals to build a personalized monetization strategy.'
                  : 'Our AI is crafting tailored product recommendations based on your niche, audience size, and engagement patterns.'
                }
              </p>

              {/* Animated progress dots */}
              <div className="flex items-center gap-3 mt-5">
                <div className="flex items-center gap-1.5">
                  {[0,1,2].map(i => (
                    <div key={i} className="w-2 h-2 rounded-full"
                      style={{
                        background: 'white',
                        animation: `dot-pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
                        opacity: 0.15,
                      }}
                    />
                  ))}
                </div>
                <span className="text-[12px] font-medium" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  {isScraping ? 'Collecting signals…' : 'Building recommendations…'}
                </span>
              </div>
            </div>

            {/* Skeleton cards */}
            <div>
            {/* Skeleton: Creator card */}
            <div className="flex items-center gap-4 mb-8 p-4 rounded-2xl border"
              style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
              <div className="w-12 h-12 rounded-full shimmer-line flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="w-32 h-3 rounded-full shimmer-line" />
                <div className="w-48 h-2.5 rounded-full shimmer-line" />
              </div>
              <div className="flex gap-5 flex-shrink-0">
                <div className="text-right space-y-1">
                  <div className="w-10 h-3.5 rounded-full shimmer-line ml-auto" />
                  <div className="w-14 h-2 rounded-full shimmer-line ml-auto" />
                </div>
                <div className="text-right space-y-1 hidden sm:block">
                  <div className="w-10 h-3.5 rounded-full shimmer-line ml-auto" />
                  <div className="w-16 h-2 rounded-full shimmer-line ml-auto" />
                </div>
                <div className="text-right space-y-1 hidden sm:block">
                  <div className="w-8 h-3.5 rounded-full shimmer-line ml-auto" />
                  <div className="w-16 h-2 rounded-full shimmer-line ml-auto" />
                </div>
              </div>
            </div>

            {/* Skeleton: Recent posts strip */}
            <div className="mb-6">
              <div className="w-20 h-2 rounded-full shimmer-line mb-3" />
              <div className="flex gap-2 overflow-hidden">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="flex-shrink-0 rounded-xl shimmer-line"
                    style={{ width: 110, height: 72 }} />
                ))}
              </div>
            </div>

            {/* Skeleton: Grid — Primary + Alternates */}
            <div className="grid lg:grid-cols-[1fr_300px] gap-5">
              {/* Skeleton: Primary card */}
              <div className="rounded-2xl border p-6" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                <div className="flex justify-between mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl shimmer-line" />
                    <div className="w-16 h-2.5 rounded-full shimmer-line" />
                  </div>
                  <div className="w-24 h-6 rounded-full shimmer-line" />
                </div>
                <div className="grid md:grid-cols-[1fr_200px] gap-6">
                  <div className="space-y-3">
                    <div className="w-44 h-5 rounded-lg shimmer-line" />
                    <div className="w-52 h-3 rounded-full shimmer-line" />
                    <div className="space-y-1.5 mt-2">
                      <div className="w-full h-2.5 rounded-full shimmer-line" />
                      <div className="w-4/5 h-2.5 rounded-full shimmer-line" />
                      <div className="w-3/5 h-2.5 rounded-full shimmer-line" />
                    </div>
                    <div className="flex gap-2 mt-3">
                      {[1,2,3,4].map(i => (
                        <div key={i} className="w-20 h-6 rounded-full shimmer-line" />
                      ))}
                    </div>
                    <div className="w-36 h-3 rounded-full shimmer-line mt-3" />
                    <div className="flex items-center gap-3 mt-3">
                      <div className="w-28 h-5 rounded-lg shimmer-line" />
                      <div className="w-24 h-3 rounded-full shimmer-line" />
                    </div>
                  </div>
                  {/* Skeleton: Preview mock */}
                  <div className="rounded-xl overflow-hidden" style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.06)', minHeight: 180 }}>
                    <div className="w-full h-6 flex items-center gap-1.5 px-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                      {[1,2,3].map(i => <div key={i} className="w-2 h-2 rounded-full shimmer-line" />)}
                    </div>
                    <div className="p-3 space-y-2">
                      <div className="w-full h-3 rounded-full shimmer-line" />
                      <div className="grid grid-cols-2 gap-1.5">
                        {[1,2,3,4].map(i => (
                          <div key={i} className="rounded-lg shimmer-line" style={{ height: 48 }} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Skeleton: Alternates sidebar */}
              <div className="flex flex-col gap-2">
                <div className="w-20 h-2.5 rounded-full shimmer-line mb-1" />
                {[1,2,3].map(i => (
                  <div key={i} className="rounded-xl border p-4" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                    <div className="flex items-start gap-3 mb-2">
                      <div className="w-8 h-8 rounded-lg shimmer-line flex-shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="flex justify-between">
                          <div className="w-24 h-3 rounded-full shimmer-line" />
                          <div className="w-8 h-3 rounded-full shimmer-line" />
                        </div>
                        <div className="w-32 h-2.5 rounded-full shimmer-line" />
                        <div className="w-20 h-2.5 rounded-full shimmer-line" />
                      </div>
                    </div>
                    <div className="mt-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                      <div className="w-full h-2 rounded-full shimmer-line" />
                    </div>
                  </div>
                ))}
                <div className="rounded-xl border p-4" style={{ borderColor: 'rgba(255,255,255,0.05)', borderStyle: 'dashed' }}>
                  <div className="w-24 h-3 rounded-full shimmer-line mx-auto mb-1" />
                  <div className="w-36 h-2 rounded-full shimmer-line mx-auto" />
                </div>
              </div>
            </div>

            {/* Skeleton: CTA */}
            <div className="mt-8 flex items-center gap-4">
              <div className="w-44 h-12 rounded-xl shimmer-line" />
              <div className="w-48 h-3 rounded-full shimmer-line" />
            </div>
            </div>
          </div>

        ) : (
        /* ═══════════════ REAL CONTENT ═══════════════ */
        <>
        {/* ── Creator card ─────────────────────────────────────────────────── */}
          <div
            className="flex items-center gap-4 mb-8 p-4 rounded-2xl border"
            style={{
              background:  `rgba(${accent.rgb},0.05)`,
              borderColor: `rgba(${accent.rgb},0.15)`,
              opacity:     visible ? 1 : 0,
              transition:  'opacity 0.5s ease',
            }}
          >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div
                className="w-12 h-12 rounded-full border-2 flex items-center justify-center overflow-hidden"
                style={{ borderColor: `rgba(${accent.rgb},0.4)`, background: `rgba(${accent.rgb},0.15)` }}
              >
                {creatorData.avatarUrl ? (
                  <img
                    src={creatorData.avatarUrl}
                    alt={creatorData.handle}
                    className="w-full h-full object-cover"
                    onError={e => { e.currentTarget.style.display = 'none' }}
                  />
                ) : (
                  <span className="text-white font-bold text-[16px]">
                    {(creatorData.handle || '@C').replace('@','').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              {/* Platform badge */}
              <div
                className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center border"
                style={{ background: '#0e0e0e', borderColor: `rgba(${accent.rgb},0.3)` }}
              >
                <PlatformIcon size={10} style={{ color: accent.color }} />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                {creatorData.name && creatorData.name !== creatorData.handle?.replace('@','') ? (
                  <>
                    <p className="text-[15px] font-bold text-white truncate">{creatorData.name}</p>
                    <p className="text-[12px] flex-shrink-0" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      {creatorData.handle}
                    </p>
                  </>
                ) : (
                  <p className="text-[14px] font-semibold text-white truncate">
                    {creatorData.handle || '@creator'}
                  </p>
                )}
                <span className="text-[11px] flex-shrink-0 px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.4)' }}>
                  {PLATFORM_LABELS[creatorData.platform] || 'creator'}
                </span>
              </div>
              <p className="text-[12px] leading-snug" style={{ color: 'rgba(255,255,255,0.45)', maxWidth: 420 }}>
                {blurb}
              </p>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-5 flex-shrink-0">
              <div className="text-right">
                <p className="text-[15px] font-bold text-white">
                  {creatorData.followers ? fmt(creatorData.followers) : '?'}
                </p>
                <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  {PLATFORM_LABELS[creatorData.platform] || 'followers'}
                </p>
              </div>
              {creatorData.engagementRate > 0 && (
                <div className="text-right hidden sm:block">
                  <p className="text-[15px] font-bold text-white">{creatorData.engagementRate}%</p>
                  <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>Engagement</p>
                </div>
              )}
              <div className="text-right hidden sm:block">
                <p className="text-[15px] font-bold text-white">94%</p>
                <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>Audience fit</p>
              </div>
            </div>
          </div>

        {/* ── Recent posts strip ───────────────────────────────────────────── */}
        {creatorData.recentPosts && creatorData.recentPosts.length > 0 && (
          <div className="mb-6"
            style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.5s ease 0.1s' }}>
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-2.5 px-0.5"
              style={{ color: 'rgba(255,255,255,0.2)' }}>
              {creatorData.platform === 'youtube' ? 'Latest videos' : 'Recent posts'}
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
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
                  <a key={i} href={postUrl} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 relative rounded-xl overflow-hidden group block"
                    style={{ width: 140, height: 80, background: 'rgba(255,255,255,0.05)' }}>
                    {post.thumbnail ? (
                      <img 
                        src={post.thumbnail} 
                        alt={post.title || ''} 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
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
                    {/* Fallback placeholder — always present, shown if no thumbnail or img errors */}
                    <div className="w-full h-full flex items-center justify-center absolute inset-0"
                      style={{ display: post.thumbnail ? 'none' : 'flex', background: 'rgba(255,255,255,0.03)' }}>
                      <Play size={16} style={{ color: 'rgba(255,255,255,0.15)' }} />
                    </div>
                    {/* Gradient overlay */}
                    <div className="absolute inset-0"
                      style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)' }} />
                    {/* Stats */}
                    <div className="absolute bottom-1 left-1.5 right-1.5 flex justify-between items-center">
                      {post.views && <span className="text-[8px] font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>{post.views}</span>}
                      {post.likes && <span className="text-[8px]" style={{ color: 'rgba(255,255,255,0.5)' }}>♥ {post.likes}</span>}
                    </div>
                    {/* Title tooltip on hover */}
                    {post.title && (
                      <div className="absolute top-0 left-0 right-0 px-1.5 pt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)' }}>
                        <p className="text-[7px] leading-tight text-white/70 line-clamp-2">{post.title}</p>
                      </div>
                    )}
                  </a>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Heading ──────────────────────────────────────────────────────── */}
        <div className="mb-8"
          style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(16px)', transition: 'all 0.55s cubic-bezier(0.16,1,0.3,1)' }}>
          <p className="forge-label mb-3">What Forge should build</p>
          <h2 className="forge-heading mb-2"
            style={{ fontSize: 'clamp(28px, 4vw, 40px)', letterSpacing: '-0.035em', maxWidth: '500px' }}>
            Here is what makes sense
            <br />for {creatorData.name || (creatorData.handle || 'your audience')}.
          </h2>
          <p className="text-[14px] max-w-sm" style={{ color: 'rgba(255,255,255,0.4)', lineHeight: '1.5' }}>
            Based on your follower count, engagement rate, niche, and platform behavior.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr_300px] gap-5"
          style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)', transition: 'all 0.6s cubic-bezier(0.16,1,0.3,1) 0.1s' }}>

          {/* ── Primary recommendation ───────────────────────────────────── */}
          <div
            className="relative rounded-2xl border p-6 cursor-pointer transition-all duration-200"
            style={{
              background:  selected === primary.id ? 'rgba(255,255,255,0.05)' : '#111',
              borderColor: selected === primary.id ? `rgba(${accent.rgb},0.3)` : 'rgba(255,255,255,0.08)',
            }}
            onClick={() => setSelected(primary.id)}
          >
            <div className="absolute top-5 right-5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                style={{ background: `rgba(${accent.rgb},0.15)`, color: accent.color, border: `1px solid rgba(${accent.rgb},0.25)` }}>
                Best match · {primary.fit}%
              </div>
            </div>

            <div className="grid md:grid-cols-[1fr_200px] gap-6">
              <div>
                <div className="flex items-center gap-2.5 mb-5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <primary.icon size={18} className="text-white" />
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    {primary.type}
                  </span>
                </div>
                <h3 className="forge-heading mb-1" style={{ fontSize: '26px', letterSpacing: '-0.03em' }}>
                  {primary.name}
                </h3>
                <p className="text-[13px] mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>{primary.tagline}</p>
                <p className="text-[13px] leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,0.4)', maxWidth: '380px' }}>
                  {primary.description}
                </p>
                <div className="flex flex-wrap gap-2 mb-5">
                  {primary.features.map(f => (
                    <span key={f} className="px-3 py-1 rounded-full text-[12px] font-medium"
                      style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.6)' }}>
                      {f}
                    </span>
                  ))}
                </div>

                {/* Why this fits */}
                <div className="mb-5">
                  <button
                    onClick={e => { e.stopPropagation(); setShowReasons(v => !v) }}
                    className="flex items-center gap-1.5 text-[12px] mb-2 transition-colors"
                    style={{ color: showReasons ? accent.color : 'rgba(255,255,255,0.35)' }}
                  >
                    <CheckCircle size={12} />
                    Why this fits {creatorData.name || creatorData.handle || 'you'}
                    <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '10px' }}>{showReasons ? '▲' : '▼'}</span>
                  </button>
                  {showReasons && (
                    <div className="space-y-2 pl-1">
                      {reasons.map((r, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="text-[10px] mt-0.5 flex-shrink-0" style={{ color: accent.color }}>✓</span>
                          <p className="text-[12px] leading-snug" style={{ color: 'rgba(255,255,255,0.5)' }}>{r}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-baseline gap-3">
                  <span className="text-white font-semibold text-[18px]">{primary.revenue}</span>
                  <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.3)' }}>estimated potential</span>
                </div>
              </div>

              {/* App preview */}
              <div className="rounded-xl overflow-hidden" style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.06)', minHeight: '180px' }}>
                <div className="w-full h-6 flex items-center gap-1.5 px-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                  {[1,2,3].map(i => <div key={i} className="w-2 h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }} />)}
                </div>
                <PreviewComp accent={accent} />
              </div>
            </div>
          </div>

          {/* ── Alternates sidebar ───────────────────────────────────────── */}
          <div className="flex flex-col gap-2">
            <p className="text-[12px] mb-1 px-1" style={{ color: 'rgba(255,255,255,0.25)' }}>Other options</p>
            {alternates.map(blueprint => {
              const altReasonsKey = getReasonsCategoryKey(blueprint)
              const altReasons = buildReasons(altReasonsKey, creatorData)
              const isSelected = selected === blueprint.id
              return (
                <div key={blueprint.id}
                  className="rounded-xl border p-4 cursor-pointer transition-all duration-200"
                  style={{
                    background:  isSelected ? 'rgba(255,255,255,0.05)' : '#111',
                    borderColor: isSelected ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.07)',
                  }}
                  onClick={() => setSelected(blueprint.id)}
                >
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <blueprint.icon size={14} className="text-white/60" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[13px] font-semibold text-white">{blueprint.name}</span>
                        <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{blueprint.fit}%</span>
                      </div>
                      <p className="text-[12px] truncate mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{blueprint.tagline}</p>
                      <p className="text-[12px] font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>{blueprint.revenue}</p>
                    </div>
                  </div>
                  {altReasons[0] && (
                    <div className="flex items-start gap-1.5 mt-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <span className="text-[9px] flex-shrink-0 mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>✓</span>
                      <p className="text-[11px] leading-snug" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        {altReasons[0]}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}

            <div className="rounded-xl border p-4 cursor-pointer text-center"
              style={{ background: 'transparent', borderColor: 'rgba(255,255,255,0.05)', borderStyle: 'dashed' }}>
              <span className="text-[13px]" style={{ color: 'rgba(255,255,255,0.25)' }}>Something else</span>
              <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.15)' }}>Tell Forge what you have in mind</p>
            </div>
          </div>
        </div>

        {/* ── CTA ──────────────────────────────────────────────────────────── */}
        <div className="mt-8 flex items-center gap-4"
          style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.6s ease 0.3s' }}>
          <button 
            onClick={handleContinue} 
            className="forge-btn-primary text-[15px] px-7 py-3.5 group"
          >
            Build {selectedBlueprint?.name}
            <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-0.5" />
          </button>
          <span className="text-[13px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
            Customize everything in the next step
          </span>
        </div>
        </>
        )}
      </main>
    </div>
  )
}
