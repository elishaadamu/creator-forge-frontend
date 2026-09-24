import { useState, useId, useEffect, useRef } from 'react'
import { useForge } from '../../App'
import {
  ArrowRight,
  Check,
  TrendingUp,
  Layers,
  Sparkles,
  Users,
  ShieldCheck,
  Zap,
  DollarSign,
  ArrowUpRight,
  Activity,
  Lock,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Terminal,
  ExternalLink,
  Laptop,
  Smartphone,
  CreditCard,
  Menu,
  X,
  Play,
  Star,
  Sliders,
  Search,
  Award,
  Flame,
  RotateCcw,
  Compass,
  Cpu
} from 'lucide-react'
import CreatorForgeLogo from '../ui/CreatorForgeLogo'
import FloatingPolygons from '../ui/FloatingPolygons'
import ShippedLiveCanvas from '../ui/ShippedLiveCanvas'

// ── Top Creators Partner Roster (Real Verified Channels) ──────────────────────
const CREATOR_PARTNERS = [
  {
    id: 'mkbhd',
    name: 'Marques Brownlee',
    handle: '@mkbhd',
    subscribers: '21.3M subscribers',
    videos: '1.8K videos',
    niche: 'Tech & Gear Reviews',
    avatar: 'https://yt3.googleusercontent.com/qu4TmIaYUlS41-dJ9gZ7DUR3nilvmB5_11i6OKSdvNnBNiyOusZP1bMN6ICnuxtjFBb6ioKgRQ=s160-c-k-c0x00ffffff-no-rj',
    saasProduct: 'GearVault OS',
    domain: 'gearvault.mkbhd.com',
    category: 'STUDIO GEAR CATALOG',
    mrr: '$64,800 MRR',
    splitRatio: '50/50 Profit Split',
    description: 'Fans constantly ask what cameras, lenses, and desk items Marques uses. GearVault organizes every piece of gear with 1-click buy links.',
    headline: 'Every camera and desk setup Marques uses, in one place.',
    rating: '4.9',
    reviewsCount: '1,840 reviews',
    tags: ['Built in 14 Days', '18,400+ Active Users', '$32,400/mo Creator Share'],
    demoFeatures: [
      { name: 'RED V-Raptor 8K VV', role: 'Main Studio Camera', price: '$24,500', rating: '99.4 Score' },
      { name: 'Sony FE 50mm f/1.2 GM', role: 'Primary Talking Head Lens', price: '$1,998', rating: '98.8 Score' },
      { name: 'Mac Studio M2 Ultra', role: 'Editing Computer (192GB)', price: '$6,799', rating: '99.9 Score' },
      { name: 'Aputure 600d Pro', role: 'Daylight Key Light Rig', price: '$1,890', rating: '97.2 Score' }
    ]
  },
  {
    id: 'aliabdaal',
    name: 'Ali Abdaal',
    handle: '@aliabdaal',
    subscribers: '5.8M subscribers',
    videos: '920 videos',
    niche: 'Productivity & Creator Growth',
    avatar: 'https://yt3.googleusercontent.com/ytc/AIdro_m2xx6mCZwsyjARnkwBKJxEv0FqGxGS2NwWNkjWH__Smw=s160-c-k-c0x00ffffff-no-rj',
    saasProduct: 'SponsorFlow CRM',
    domain: 'sponsorflow.aliabdaal.com',
    category: 'SPONSOR & BRAND DEAL ORGANIZER',
    mrr: '$48,200 MRR',
    splitRatio: '50/50 Profit Split',
    description: 'Brands send hundreds of emails asking for sponsorships. SponsorFlow manages inquiries, calculates fair rates, and gets contracts signed.',
    headline: 'Turn sponsor emails into steady monthly income.',
    rating: '4.9',
    reviewsCount: '2,410 reviews',
    tags: ['Built in 14 Days', '3,100 Creator Teams', '$24,100/mo Creator Share'],
    demoFeatures: [
      { name: 'Notion Integration', role: 'Signed & Paid', price: '$35,000', rating: 'Complete' },
      { name: 'Apple Hardware Segment', role: 'Contract Sent', price: '$45,000', rating: 'Reviewing' },
      { name: 'Epidemic Sound Annual', role: 'Active Partnership', price: '$22,000', rating: 'Delivered' },
      { name: 'Skillshare 60s Midroll', role: 'Signed Q3', price: '$18,500', rating: 'Done' }
    ]
  },
  {
    id: 'mrwhosetheboss',
    name: 'MrWhosetheboss',
    handle: '@mrwhosetheboss',
    subscribers: '20.5M subscribers',
    videos: '1.9K videos',
    niche: 'Smartphones & Tech Battles',
    avatar: 'https://yt3.googleusercontent.com/QFI5OsUuSRHV-YpwksnVqpqWC19gjU55smnxPzLVU5Y5ohqKIkxq21nV_VfBJhvanYeMBot21A=s160-c-k-c0x00ffffff-no-rj',
    saasProduct: 'TechSpec Benchmark Studio',
    domain: 'benchmark.mrwhosetheboss.com',
    category: 'PHONE & BATTERY COMPARISON',
    mrr: '$72,100 MRR',
    splitRatio: '50/50 Profit Split',
    description: 'Side-by-side battery tests and camera shootouts so your viewers pick the right phone before spending $1,200.',
    headline: 'Real-world phone comparisons that help fans buy with confidence.',
    rating: '5.0',
    reviewsCount: '3,890 reviews',
    tags: ['Built in 14 Days', '24,000 Paid Members', '$36,050/mo Creator Share'],
    demoFeatures: [
      { name: 'iPhone 16 Pro Max', role: 'Battery Drain Test', price: '12h 44m', rating: 'Rank #1 Battery' },
      { name: 'Samsung Galaxy S24 Ultra', role: 'Zoom Comparison', price: '100x Space', rating: 'Rank #1 Zoom' },
      { name: 'Google Pixel 9 Pro', role: 'Night Photo Test', price: 'Pure RAW', rating: 'Rank #1 Night' },
      { name: 'OnePlus 12', role: 'Charging Speed', price: '26 mins', rating: 'Rank #1 Speed' }
    ]
  },
  {
    id: 'lexfridman',
    name: 'Lex Fridman',
    handle: '@lexfridman',
    subscribers: '4.5M subscribers',
    videos: '460 episodes',
    niche: 'AI, Science & Longform Podcasts',
    avatar: 'https://yt3.googleusercontent.com/ytc/AIdro_ljfMy9kUR1PH9VRf-XsTsPqFMgORC_zodOQVEAm4hx36lC=s160-c-k-c0x00ffffff-no-rj',
    saasProduct: 'LexSemantics Archive',
    domain: 'archive.lexfridman.com',
    category: 'PODCAST SEARCH & TIMESTAMP ENGINE',
    mrr: '$39,500 MRR',
    splitRatio: '50/50 Profit Split',
    description: 'Fans can ask questions in plain English and instantly find the exact timestamp and quote across 450+ deep episodes.',
    headline: 'Search 2,000+ hours of podcast chats in seconds.',
    rating: '4.9',
    reviewsCount: '1,290 reviews',
    tags: ['Built in 14 Days', '8,400 Students & Pros', '$19,750/mo Creator Share'],
    demoFeatures: [
      { name: 'AI & Neural Networks', role: 'Yann LeCun & Hinton', price: '14 Deep Hits', rating: 'Top Match' },
      { name: 'Physics & Consciousness', role: 'Roger Penrose Series', price: '28 Citations', rating: 'Top Match' },
      { name: 'Space Travel & Mars', role: 'Elon Musk Series', price: '32 Timestamps', rating: 'Top Match' },
      { name: 'Game Theory & History', role: 'John Mearsheimer', price: '19 Topics', rating: 'Top Match' }
    ]
  },
  {
    id: 'cleoabram',
    name: 'Cleo Abram',
    handle: '@cleoabram',
    subscribers: '2.6M subscribers',
    videos: '340 videos',
    niche: 'Tech Optimism & Future Science',
    avatar: 'https://yt3.googleusercontent.com/RdjombbmvvGQGTokXHgVRF7qijHDLcnXs7h4S6N0oOua-veEap9RO7htFE30v7xnWDM1GUlCmI4=s160-c-k-c0x00ffffff-no-rj',
    saasProduct: 'Futurism Radar',
    domain: 'radar.cleoabram.com',
    category: 'FUTURE TECH MILESTONE TRACKER',
    mrr: '$31,400 MRR',
    splitRatio: '50/50 Profit Split',
    description: 'A visual progress tracker showing real milestones for nuclear fusion, helper robots, and clean energy breakthroughs.',
    headline: 'Visual tracking for future tech breakthroughs.',
    rating: '4.8',
    reviewsCount: '980 reviews',
    tags: ['Built in 14 Days', '4,200 Supporters', '$15,700/mo Creator Share'],
    demoFeatures: [
      { name: 'Clean Fusion Energy', role: 'ITER & Commonwealth', price: '2028 Goal', rating: '74% Done' },
      { name: 'Helper Robots in Homes', role: 'Figure 02 & Boston Dyn', price: 'Testing Now', rating: '88% Done' },
      { name: '1,000-Mile Car Batteries', role: 'QuantumScape / Toyota', price: '2027 Factory', rating: '81% Done' },
      { name: 'Clean Air Scrubbers', role: 'Climeworks Mammoth', price: '36K Tons/yr', rating: 'Running Now' }
    ]
  },
  {
    id: 'petermckinnon',
    name: 'Peter McKinnon',
    handle: '@PeterMcKinnon',
    subscribers: '5.9M subscribers',
    videos: '610 videos',
    niche: 'Photography & Filmmaking',
    avatar: 'https://yt3.googleusercontent.com/MGXZihlZFGjJEP3ew_ptOdSfvx1jXFXlMGrEuNMD864fp17F4rEqIEboNxljlw0kJpr3Ss6qRw=s160-c-k-c0x00ffffff-no-rj',
    saasProduct: 'LutVault Pro',
    domain: 'lutvault.petermckinnon.com',
    category: 'INSTANT VIDEO COLOR PREVIEWER',
    mrr: '$44,600 MRR',
    splitRatio: '50/50 Profit Split',
    description: 'Filmmakers drop their video clips into the browser and preview Peter’s signature cinematic color styles in one click.',
    headline: 'Try cinematic video filters directly in your browser.',
    rating: '4.9',
    reviewsCount: '2,150 reviews',
    tags: ['Built in 14 Days', '6,800 Video Editors', '$22,300/mo Creator Share'],
    demoFeatures: [
      { name: 'Pirate Life Cinematic', role: 'Moody Film Contrast', price: 'Instant Preview', rating: 'Top Filter' },
      { name: 'Golden Hour Sunset', role: 'Warm Skin Tones', price: 'Instant Preview', rating: 'Top Filter' },
      { name: 'Movie Teal & Orange', role: 'Hollywood Film Look', price: 'Instant Preview', rating: 'Top Filter' },
      { name: 'Classic Black & White', role: 'Timeless Film Grain', price: 'Instant Preview', rating: 'Top Filter' }
    ]
  }
]

// ── Portfolio Showcase Data ──────────────────────────────────────────────────
const PORTFOLIO_PRODUCTS = [
  {
    id: 'crm',
    title: 'Creator CRM OS',
    category: 'BRAND DEALS & SPONSORS',
    url: 'crm.creatorforge.app',
    creator: 'Ali Abdaal Ecosystem',
    mrr: '$42,300 MRR',
    badge: 'LIVE PARTNERSHIP',
    description: 'Helps creators track sponsor deals, review contracts, and get paid on time.',
    metric: '28 Active Deals · 64% Win Rate'
  },
  {
    id: 'intel',
    title: 'Audience Intelligence',
    category: 'COMMENT REQUEST FINDER',
    url: 'intel.creatorforge.app',
    creator: 'Elena Rostova Studio',
    mrr: '$31,800 MRR',
    badge: 'LIVE PARTNERSHIP',
    description: 'Turns YouTube video comments into clear feature requests that subscribers pay for.',
    metric: '142K Comments Mined · $680K Demand'
  },
  {
    id: 'community',
    title: 'Community OS Hub',
    category: 'MEMBER WORKSPACE',
    url: 'community.creatorforge.app',
    creator: 'Marcus Vance Network',
    mrr: '$54,200 MRR',
    badge: 'LIVE PARTNERSHIP',
    description: 'A private member hub where community members share project files and chat.',
    metric: '1,840 Paid Members · 94% Retention'
  },
  {
    id: 'finance',
    title: 'Creator Finance Treasury',
    category: 'AUTOMATIC PAYOUTS',
    url: 'treasury.creatorforge.app',
    creator: 'Jamal Rivera Co-Launch',
    mrr: '$28,600 MRR',
    badge: 'LIVE PARTNERSHIP',
    description: 'Automatically splits subscription revenue 50/50 and deposits earnings right into your bank.',
    metric: '$1.4M Disbursed · 100% Split Accuracy'
  }
]

// ── FAQ Items (Written in simple, plain human creator language) ───────────────
const FAQS = [
  {
    q: 'Why a 50/50 partnership instead of hiring a software agency?',
    a: 'Agencies charge $60,000 to $120,000 upfront, and if users leave or servers crash, they bill you more hourly fees. With Creator Forge, you pay $0 upfront. We do all the coding, design, and 24/7 server maintenance. We only make money when your app makes money.'
  },
  {
    q: 'What does the creator need to do? Do I need to know how to code?',
    a: 'You never write a single line of code. You just tell us what your audience asks for, test the app, and introduce it in your videos. We write 100% of the code, connect payment processing, and take care of customer support.'
  },
  {
    q: 'What if my audience doesn’t buy?',
    a: 'You risk zero dollars. Because we build everything for free, you never get a surprise bill. If a prototype does not get enough interest from your fans, we can easily change direction or test another idea at zero financial cost to you.'
  },
  {
    q: 'How and when do I get paid?',
    a: 'You get paid automatically through Stripe directly to your bank account. Whenever a customer pays their monthly subscription, half goes to your account immediately. You can check your earnings on your live dashboard anytime.'
  }
]

export default function Welcome() {
  const { next, goTo, userProfile } = useForge()
  const [openFaq, setOpenFaq] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Interactive Creator Demo State
  const [selectedCreatorDemo, setSelectedCreatorDemo] = useState('mkbhd')
  const [demoModalOpen, setDemoModalOpen] = useState(false)
  const [activeMkbhdTab, setActiveMkbhdTab] = useState('studio-a')
  const [aliDealStatus, setAliDealStatus] = useState({
    notion: 'Signed & Paid',
    apple: 'In Negotiation',
    epidemic: 'Approved',
    skillshare: 'Active Run'
  })

  // Creator Focus Slider / Carousel State
  const [activeCreatorIndex, setActiveCreatorIndex] = useState(0)
  const [isCarouselHovered, setIsCarouselHovered] = useState(false)
  const carouselContainerRef = useRef(null)
  const [carouselWidth, setCarouselWidth] = useState(0)
  const touchStartXRef = useRef(null)

  // Measure carousel container width for responsive pixel-perfect centering
  useEffect(() => {
    if (!carouselContainerRef.current) return
    const updateWidth = () => {
      if (carouselContainerRef.current) {
        setCarouselWidth(carouselContainerRef.current.offsetWidth)
      }
    }
    updateWidth()
    const ro = new ResizeObserver(updateWidth)
    ro.observe(carouselContainerRef.current)
    window.addEventListener('resize', updateWidth)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', updateWidth)
    }
  }, [])

  const isDesktopCarousel = carouselWidth >= 640
  const maxCreatorIndex = isDesktopCarousel ? Math.max(0, CREATOR_PARTNERS.length - 2) : CREATOR_PARTNERS.length - 1

  const handleNextCreator = () => {
    setActiveCreatorIndex((prev) => (prev >= maxCreatorIndex ? 0 : prev + 1))
  }

  const handlePrevCreator = () => {
    setActiveCreatorIndex((prev) => (prev <= 0 ? maxCreatorIndex : prev - 1))
  }

  // Auto-slide every 5.5s unless hovered or interactive demo modal is open
  useEffect(() => {
    if (isCarouselHovered || demoModalOpen) return
    const interval = setInterval(() => {
      setActiveCreatorIndex((prev) => (prev >= maxCreatorIndex ? 0 : prev + 1))
    }, 5500)
    return () => clearInterval(interval)
  }, [isCarouselHovered, demoModalOpen, maxCreatorIndex])

  const openDemoForCreator = (creatorId) => {
    setSelectedCreatorDemo(creatorId)
    setDemoModalOpen(true)
  }

  const handleTouchStart = (e) => {
    if (e.touches && e.touches[0]) {
      touchStartXRef.current = e.touches[0].clientX
    }
  }

  const handleTouchEnd = (e) => {
    if (touchStartXRef.current === null) return
    const touchEndX = e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientX : null
    if (touchEndX !== null) {
      const diff = touchStartXRef.current - touchEndX
      if (diff > 45) {
        // Swiped left -> next
        handleNextCreator()
      } else if (diff < -45) {
        // Swiped right -> prev
        handlePrevCreator()
      }
    }
    touchStartXRef.current = null
  }

  // Ensure body and html background are pristine white while on landing page
  useEffect(() => {
    const prevBg = document.body.style.backgroundColor
    const prevHtmlBg = document.documentElement.style.backgroundColor
    const prevColor = document.body.style.color
    document.body.style.backgroundColor = '#FFFFFF'
    document.documentElement.style.backgroundColor = '#FFFFFF'
    document.body.style.color = '#0F172A'
    return () => {
      document.body.style.backgroundColor = prevBg
      document.documentElement.style.backgroundColor = prevHtmlBg
      document.body.style.color = prevColor
    }
  }, [])

  // Smooth scroll handler with sticky header offset
  const scrollToSection = (e, sectionId) => {
    e.preventDefault()
    setMobileMenuOpen(false)
    const element = document.getElementById(sectionId)
    if (element) {
      const headerOffset = 72
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
      try {
        window.history.pushState(null, '', `#${sectionId}`)
      } catch (err) {}
    }
  }

  // Interactive Co-Founder Revenue Calculator State
  const [calcAudience, setCalcAudience] = useState(150000)
  const [calcPricing, setCalcPricing] = useState(49)
  const [calcConvRate, setCalcConvRate] = useState(1.0) // 1.0%

  // Derived Calculator Values
  const estimatedSubscribers = Math.round(calcAudience * (calcConvRate / 100))
  const monthlyRevenue = estimatedSubscribers * calcPricing
  const annualRevenue = monthlyRevenue * 12
  const creatorShareMonthly = Math.round(monthlyRevenue * 0.50)
  const creatorShareAnnual = creatorShareMonthly * 12

  // Unique accessible IDs for interactive range sliders
  const audienceRangeId = useId()
  const convRangeId = useId()

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#0F172A] font-sans selection:bg-[#E2F952] selection:text-[#0F172A] overflow-x-hidden relative">

      {/* ── Background Grid Matrix (Subtle Architectural Lines) ──────────── */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.035] z-0"
        style={{
          backgroundImage: `linear-gradient(#0F172A 1px, transparent 1px), linear-gradient(90deg, #0F172A 1px, transparent 1px)`,
          backgroundSize: '64px 64px'
        }}
      />

      {/* ── Ambient Radial Lighting Glow (Soft Radiant Wash) ──────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div 
          className="absolute -top-[15%] left-1/2 -translate-x-1/2 w-[1000px] h-[500px] rounded-full blur-[180px] opacity-[0.10]"
          style={{ background: 'radial-gradient(circle, rgba(163, 230, 53, 0.4) 0%, rgba(255, 255, 255, 0) 70%)' }}
        />
        <div 
          className="absolute top-[40%] right-[-10%] w-[600px] h-[600px] rounded-full blur-[200px] opacity-[0.06]"
          style={{ background: 'radial-gradient(circle, rgba(59, 130, 246, 0.25) 0%, rgba(255, 255, 255, 0) 70%)' }}
        />
      </div>

      {/* ── Sticky Light Navigation Bar ───────────────────────────────────── */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/90 border-b border-slate-200/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Brand Logo (Light Mode) */}
          <div 
            className="flex items-center gap-2.5 cursor-pointer shrink-0" 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <CreatorForgeLogo size={22} showText={true} theme="light" />
          </div>

          {/* Navigation Links (Desktop — Clean Essential Anchors) */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8 text-sm font-semibold text-slate-600 whitespace-nowrap shrink-0">
            <a 
              href="#creators" 
              onClick={(e) => scrollToSection(e, 'creators')} 
              className="hover:text-slate-950 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5"
            >
              <span>Creators</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </a>
            <a 
              href="#reviews" 
              onClick={(e) => scrollToSection(e, 'reviews')} 
              className="hover:text-slate-950 transition-colors whitespace-nowrap cursor-pointer"
            >
              Reviews
            </a>
            <a 
              href="#pipeline" 
              onClick={(e) => scrollToSection(e, 'pipeline')} 
              className="hover:text-slate-950 transition-colors whitespace-nowrap cursor-pointer"
            >
              How It Works
            </a>
            <a 
              href="#calculator" 
              onClick={(e) => scrollToSection(e, 'calculator')} 
              className="hover:text-slate-950 transition-colors whitespace-nowrap cursor-pointer"
            >
              Earnings
            </a>
            <a 
              href="#faq" 
              onClick={(e) => scrollToSection(e, 'faq')} 
              className="hover:text-slate-950 transition-colors whitespace-nowrap cursor-pointer"
            >
              FAQ
            </a>
          </nav>

          {/* Header Action Button & Hamburger Menu */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 whitespace-nowrap">
            {/* Signature Button with Top-Right Beacon (WCAG AAA contrast, >=44px touch target) */}
            <button
              type="button"
              onClick={(e) => e.preventDefault()}
              className="relative inline-flex items-center gap-2 text-xs sm:text-sm font-bold px-3.5 sm:px-5 py-2.5 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white shadow-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200 cursor-pointer whitespace-nowrap shrink-0 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 select-none min-h-[44px]"
            >
              <span>Apply as Co-Founder</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
              {/* Signature Top-Right Accent Beacon Dot with Ambient Halo */}
              <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 pointer-events-none items-center justify-center">
                <span className="absolute inline-flex h-6 w-6 rounded-full bg-emerald-400/30 blur-[2px]" />
                <span className="animate-ping absolute inline-flex h-3.5 w-3.5 rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white shadow-xs" />
              </span>
            </button>

            {/* Hamburger Menu Toggle Button (Prominent across all screen sizes) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 transition-all cursor-pointer shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              aria-label={mobileMenuOpen ? "Close Navigation Menu" : "Open Navigation Menu"}
              title="Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-slate-900" /> : <Menu className="w-5 h-5 text-slate-800" />}
            </button>
          </div>
        </div>

        {/* Responsive Dropdown Drawer Menu */}
        {mobileMenuOpen && (
          <div className="bg-white/95 backdrop-blur-2xl border-b border-slate-200/90 px-4 sm:px-6 py-5 space-y-4 animate-fade-in shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs font-mono uppercase tracking-wider text-slate-400">
              <span>Navigation Menu</span>
              <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">50/50 Co-Founder Portal</span>
            </div>
            <nav className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm font-semibold">
              <a 
                href="#creators" 
                onClick={(e) => {
                  scrollToSection(e, 'creators')
                  setMobileMenuOpen(false)
                }}
                className="px-4 py-3 rounded-xl text-slate-700 hover:text-slate-950 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all cursor-pointer flex items-center justify-between"
              >
                <span>Creators Roster</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </a>
              <a 
                href="#reviews" 
                onClick={(e) => {
                  scrollToSection(e, 'reviews')
                  setMobileMenuOpen(false)
                }}
                className="px-4 py-3 rounded-xl text-slate-700 hover:text-slate-950 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all cursor-pointer"
              >
                Reviews & Testimonials
              </a>
              <a 
                href="#pipeline" 
                onClick={(e) => {
                  scrollToSection(e, 'pipeline')
                  setMobileMenuOpen(false)
                }}
                className="px-4 py-3 rounded-xl text-slate-700 hover:text-slate-950 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all cursor-pointer flex items-center justify-between"
              >
                <span>How It Works</span>
                <span className="text-xs font-mono text-emerald-700 font-bold">14-Day App</span>
              </a>
              <a 
                href="#calculator" 
                onClick={(e) => {
                  scrollToSection(e, 'calculator')
                  setMobileMenuOpen(false)
                }}
                className="px-4 py-3 rounded-xl text-slate-700 hover:text-slate-950 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all cursor-pointer flex items-center justify-between"
              >
                <span>50/50 Earnings</span>
                <span className="text-xs font-mono text-emerald-700 font-bold">$0 Upfront</span>
              </a>
              <a 
                href="#faq" 
                onClick={(e) => {
                  scrollToSection(e, 'faq')
                  setMobileMenuOpen(false)
                }}
                className="px-4 py-3 rounded-xl text-slate-700 hover:text-slate-950 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all cursor-pointer"
              >
                FAQ
              </a>
            </nav>

            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-slate-500 font-mono">
                <span className="font-bold text-slate-800">CreatorForge</span> · We code & run the app. You split profits 50/50.
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  setMobileMenuOpen(false)
                }}
                className="relative w-full sm:w-auto px-6 py-2.5 text-center text-xs sm:text-sm font-bold text-white rounded-xl bg-[#0F172A] hover:bg-[#1E293B] min-h-[44px] flex items-center justify-center gap-2"
              >
                <span>Apply as Co-Founder (50/50)</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3 pointer-events-none items-center justify-center">
                  <span className="absolute inline-flex h-4 w-4 rounded-full bg-emerald-400/30 blur-[1px]" />
                  <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-white" />
                </span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ── HERO SECTION (S1: STRUCTURED LIKE REFERENCE DESIGN, CREATORFORGE PALETTE, LARGE 3D HERO) ── */}
      <section className="relative w-full px-4 sm:px-6 md:px-8 lg:px-[10%] min-h-[82vh] lg:min-h-[88vh] flex flex-col justify-center py-12 sm:py-16 lg:py-20 overflow-hidden border-b border-slate-200/60">
        
        {/* Ambient Light Green Conic Gradient Glow Aura */}
        <div 
          className="absolute top-1/2 right-[0%] sm:right-[5%] lg:right-[8%] -translate-y-1/2 w-[750px] sm:w-[1000px] lg:w-[1300px] h-[750px] sm:h-[1000px] lg:h-[1300px] rounded-full pointer-events-none opacity-35 sm:opacity-40 blur-[85px] sm:blur-[120px] -z-10 animate-spin-slow"
          style={{
            background: 'conic-gradient(from 0deg at 50% 50%, #BEF264 0deg, #A3E635 60deg, #84CC16 120deg, #34D399 180deg, #E2F952 240deg, #A3E635 300deg, #BEF264 360deg)'
          }}
        />

        {/* Subtle Canvas Dot Grid Background */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-40 -z-10"
          style={{
            backgroundImage: 'radial-gradient(#94A3B8 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}
        />

        {/* Floating Background Polygons (Image 5 Style) */}
        <FloatingPolygons variant="hero" />

        {/* 2-Column Balanced 50/50 Responsive Hero Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 xl:gap-16 items-center w-full relative z-10">
          
          {/* Left Column (50%): Typography & Actions with Proper Breathing Room */}
          <div className="w-full flex flex-col items-start text-left">
            {/* Eyebrow Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-slate-200/90 text-xs sm:text-sm font-mono font-semibold uppercase tracking-wider text-slate-700 mb-3.5 sm:mb-4 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-900 font-bold">WE BUILD YOUR APP FOR FREE</span>
              <span className="text-slate-400">·</span>
              <span className="text-emerald-700 font-bold">YOU KEEP 50% PROFIT</span>
            </div>

            {/* Headline: Perfectly Proportionate for 50/50 Layout (No Awkward 1-Word Wrapping) */}
            <h1 className="font-display font-black tracking-tight uppercase text-3xl sm:text-4xl md:text-5xl lg:text-[46px] xl:text-[54px] 2xl:text-[60px] leading-[0.96] text-slate-950">
              <span className="block whitespace-normal sm:whitespace-nowrap">YOU HAVE THE AUDIENCE</span>
              <span className="block mt-1 sm:mt-1.5 whitespace-normal sm:whitespace-nowrap">
                <span className="text-transparent font-black [-webkit-text-stroke:_1.5px_#0F172A] sm:[-webkit-text-stroke:_2px_#0F172A] lg:[-webkit-text-stroke:_2.5px_#0F172A] [text-stroke:_1.5px_#0F172A] sm:[text-stroke:_2px_#0F172A] mr-2 sm:mr-3 inline-block">
                  WE BUILD
                </span>
                <span className="text-slate-950 inline-block">THE SOFTWARE.</span>
              </span>
            </h1>

            {/* Tilted Sticker Tag Right Below Headline */}
            <div className="mt-3.5 sm:mt-4 inline-block -rotate-2 transform hover:rotate-0 transition-transform duration-200 origin-left">
              <div className="bg-[#84CC16] text-slate-950 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-md font-display font-black text-xs sm:text-sm md:text-base tracking-wider uppercase shadow-[0_4px_14px_rgba(132,204,22,0.32)] select-none">
                FLY HIGH, DON'T JUST GLIDE. 50/50 PROFIT SPLIT.
              </div>
            </div>

            {/* Clear Description Paragraph */}
            <p className="mt-4 sm:mt-5 text-sm sm:text-base lg:text-[17px] text-slate-600 max-w-lg font-normal leading-relaxed sm:leading-7">
              Helping creators acquire more monthly paying subscribers by turning their audience into simple, high-retention software products. $0 upfront cost, 100% managed.
            </p>

            {/* Action Row: Solid Action Button + Inline Estimated Cost & Time */}
            <div className="mt-6 sm:mt-7 flex flex-wrap items-center gap-3.5 sm:gap-4 w-full">
              {/* Primary Signature Button with Beacon (Does nothing on click) */}
              <button
                type="button"
                onClick={(e) => e.preventDefault()}
                className="relative inline-flex items-center justify-center gap-2.5 px-6 py-3.5 sm:px-7 sm:py-4 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs sm:text-sm font-display font-bold shadow-[0_6px_24px_rgba(15,23,42,0.18)] hover:shadow-[0_10px_32px_rgba(15,23,42,0.28)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 select-none min-h-[48px] shrink-0 uppercase tracking-wide"
              >
                <span>SUBMIT YOUR IDEA (50/50)</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                {/* Signature Top-Right Accent Beacon Dot with Soft Halo Glow */}
                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 pointer-events-none items-center justify-center">
                  <span className="absolute inline-flex h-6 w-6 rounded-full bg-emerald-400/30 blur-[2px]" />
                  <span className="animate-ping absolute inline-flex h-3.5 w-3.5 rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white shadow-xs" />
                </span>
              </button>

              {/* Inline Estimate Label */}
              <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 font-mono whitespace-nowrap">
                <span>Estimated cost & time →</span>
                <span className="font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-md">
                  $0 / 14 days
                </span>
              </div>
            </div>

            {/* Guarantee Reassurance Badges */}
            <div className="mt-5 flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-medium text-slate-700">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>$0 Upfront Cost</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Live in 14 Days</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>50/50 Profit Split</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Zero Tech Skills Needed</span>
              </div>
            </div>
          </div>

          {/* Right Column (50%): Centered 3D Astronaut Rocket (Well-Proportioned & Isolated) */}
          <div className="w-full relative flex items-center justify-center">
            <div className="relative w-full max-w-[440px] sm:max-w-[480px] md:max-w-[520px] lg:max-w-[560px] xl:max-w-[620px] animate-float-slow select-none">
              
              {/* Transparent 3D Hero Astronaut Rocket (No background box) */}
              <img
                src="/images/hero_astronaut_rocket.png"
                alt="Creator Forge 3D Rocket Launch"
                className="w-full h-auto object-contain drop-shadow-[0_28px_56px_rgba(15,23,42,0.20)] transform hover:scale-[1.03] transition-transform duration-500"
              />

              {/* Floating Live Telemetry Badge 1: Top Right */}
              <div className="absolute -top-3 right-2 sm:right-6 p-2.5 sm:p-3 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-xl text-left hidden sm:block animate-float-gentle z-20">
                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 mb-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-bold">MONTHLY SUBSCRIBER REVENUE</span>
                </div>
                <div className="text-base sm:text-lg font-display font-black text-slate-950 font-mono">
                  $38,400 <span className="text-xs text-emerald-600 font-normal">+18.4% MoM</span>
                </div>
                <span className="text-[10px] font-mono text-slate-700 font-semibold block mt-0.5">Automated 50/50 Stripe Split</span>
              </div>

              {/* Floating Live Telemetry Badge 2: Bottom Right */}
              <div className="absolute -bottom-2 right-0 sm:right-4 p-2.5 sm:p-3 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-xl text-right hidden sm:block animate-float-reverse z-20">
                <div className="flex items-center justify-end gap-2 text-[10px] font-mono text-slate-500 mb-0.5">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="font-bold">STRIPE PAYOUT DEPOSITED</span>
                </div>
                <div className="text-base sm:text-lg font-display font-black text-slate-950 font-mono">
                  $19,200.00
                </div>
                <span className="text-[10px] font-mono text-slate-600 block mt-0.5">Creator Net 50% Take-Home</span>
              </div>

            </div>
          </div>

        </div>

      </section>

      {/* ── TOP CREATORS FOCUS CAROUSEL / SLIDER (2 ACTIVE + 1/2 BLURRED, LEFT ALIGNED) ── */}
      <section id="creators" className="py-8 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200/80">
        <div className="text-center max-w-3xl mx-auto mb-4 sm:mb-6">
          <span className="text-xs sm:text-sm font-mono uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-3.5 py-1 rounded-full font-bold inline-block">
            REAL APPS IN PRODUCTION · 50/50 CO-FOUNDERS
          </span>
          <h2 className="text-3xl sm:text-5xl font-display font-black text-slate-950 mt-2.5 tracking-tight leading-[1.15]">
            Software built for top creators
          </h2>
          <p className="mt-2.5 text-base sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed sm:leading-8 font-normal">
            See how top creators turned what their fans ask for every day into simple, helpful software apps that make recurring monthly income.
          </p>

          {/* Quick Creator Tabs Bar */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
            {CREATOR_PARTNERS.map((creator, idx) => {
              const isPrimary = idx === activeCreatorIndex
              const isSecondary = isDesktopCarousel && idx === activeCreatorIndex + 1
              const isSelected = isPrimary || isSecondary

              return (
                <button
                  key={creator.id}
                  onClick={() => setActiveCreatorIndex(Math.min(idx, maxCreatorIndex))}
                  className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                    isPrimary
                      ? 'bg-[#0F172A] text-white shadow-sm ring-2 ring-slate-900/10 font-bold scale-105'
                      : isSecondary
                        ? 'bg-slate-100 text-slate-900 border border-slate-300 font-bold ring-1 ring-slate-400/30'
                        : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <img
                    src={creator.avatar}
                    alt={creator.name}
                    className="w-4 h-4 rounded-full object-cover border border-white/20"
                  />
                  <span className="truncate max-w-[100px] sm:max-w-none">{creator.name.split(' ')[0]}</span>
                  {isPrimary && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                  {isSecondary && (
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400" title="Active on screen" />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Left-Aligned Carousel Container (2 Active + 1/2 Blurred) ── */}
        <div 
          ref={carouselContainerRef}
          onMouseEnter={() => setIsCarouselHovered(true)}
          onMouseLeave={() => setIsCarouselHovered(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="relative w-full overflow-hidden py-1 select-none"
        >
          {/* Subtle side edge fade mask on right edge */}
          <div className="pointer-events-none absolute inset-y-0 right-0 w-8 sm:w-16 z-20 bg-gradient-to-l from-white/90 to-transparent hidden md:block" />

          {/* Slider Track */}
          {(() => {
            const cardGap = 20
            const cardWidth = carouselWidth > 0 
              ? (carouselWidth >= 1024 
                  ? Math.floor((carouselWidth - cardGap * 2) / 2.5)
                  : carouselWidth >= 640 
                    ? Math.floor((carouselWidth - cardGap) / 2.35)
                    : Math.min(Math.floor(carouselWidth * 0.8), 340))
              : 440

            const trackTranslateX = -(activeCreatorIndex * (cardWidth + cardGap))

            return (
              <div
                className="flex items-stretch"
                style={{
                  transform: `translateX(${trackTranslateX}px)`,
                  transition: 'transform 600ms cubic-bezier(0.16, 1, 0.3, 1)',
                  gap: `${cardGap}px`
                }}
              >
                {CREATOR_PARTNERS.map((creator, index) => {
                  const isActive = isDesktopCarousel 
                    ? (index === activeCreatorIndex || index === activeCreatorIndex + 1)
                    : (index === activeCreatorIndex)

                  return (
                    <div
                      key={creator.id}
                      onClick={() => {
                        if (!isActive) {
                          setActiveCreatorIndex(Math.min(index, maxCreatorIndex))
                        }
                      }}
                      style={{
                        width: `${cardWidth}px`,
                        flexShrink: 0,
                        filter: isActive ? 'blur(0px)' : 'blur(5px)',
                        opacity: isActive ? 1 : 0.45,
                        transform: isActive ? 'scale(1)' : 'scale(0.96)',
                        transition: 'filter 600ms cubic-bezier(0.16, 1, 0.3, 1), opacity 600ms cubic-bezier(0.16, 1, 0.3, 1), transform 600ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 600ms cubic-bezier(0.16, 1, 0.3, 1), border-color 600ms ease'
                      }}
                      className={`rounded-2xl sm:rounded-3xl bg-white border flex flex-col justify-between overflow-hidden relative text-left p-4 sm:p-5 transition-all ${
                        isActive 
                          ? 'border-slate-300 ring-2 ring-slate-900/10 shadow-[0_15px_35px_-10px_rgba(15,23,42,0.08)] cursor-default' 
                          : 'border-slate-200 hover:border-slate-300 hover:opacity-75 shadow-xs cursor-pointer'
                      }`}
                    >
                      {/* Inactive overlay tooltip hint */}
                      {!isActive && (
                        <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-900/5 hover:bg-slate-900/10 transition-colors">
                          <span className="px-3 py-1 rounded-full bg-slate-950/85 backdrop-blur-md text-white text-[10px] font-mono font-bold shadow-md">
                            Click to Focus · {creator.name.split(' ')[0]}
                          </span>
                        </div>
                      )}

                      <div className="space-y-3.5">
                        {/* Top Creator Header */}
                        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="relative shrink-0">
                              <img
                                src={creator.avatar}
                                alt={creator.name}
                                className="w-11 h-11 rounded-2xl object-cover border border-slate-200 shadow-2xs"
                              />
                              <span 
                                className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" 
                                title="Active Venture Co-Founder" 
                              />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1">
                                <h3 className="font-display font-bold text-base text-slate-950 truncate">
                                  {creator.name}
                                </h3>
                                <CheckCircle2 className="w-4 h-4 text-sky-500 fill-sky-100 shrink-0" />
                              </div>
                              <div className="flex items-center gap-1.5 text-xs font-mono text-slate-500 truncate mt-0.5">
                                <span className="font-semibold text-slate-700">{creator.handle}</span>
                                <span>·</span>
                                <span className="text-slate-900 font-bold">{creator.subscribers.split(' ')[0]}</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-xs font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold inline-block">
                              {creator.mrr}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500 block mt-0.5">
                              50/50 Split
                            </span>
                          </div>
                        </div>

                        {/* Co-Founded Product Showcase (Clean & Readable) */}
                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] font-mono">
                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-semibold shadow-2xs truncate max-w-[170px]">
                              <Lock className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                              <span className="truncate">{creator.domain}</span>
                            </div>
                            <span className="text-[10px] font-mono text-emerald-800 font-bold bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded uppercase shrink-0">
                              LIVE APP
                            </span>
                          </div>

                          <div className="pt-0.5">
                            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
                              {creator.category}
                            </span>
                            <h4 className="font-display font-extrabold text-lg sm:text-xl text-slate-950 tracking-tight">
                              {creator.saasProduct}
                            </h4>
                          </div>

                          <p className="text-xs sm:text-sm text-slate-800 font-medium leading-snug">
                            {creator.headline}
                          </p>
                          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                            {creator.description}
                          </p>
                        </div>

                        {/* Feature / Spec Previews */}
                        <div className="grid grid-cols-2 gap-2 text-left pt-0.5">
                          {creator.demoFeatures.slice(0, 4).map((feat, fIdx) => (
                            <div 
                              key={fIdx} 
                              className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors"
                            >
                              <div className="flex items-center justify-between gap-1 text-[10px] font-mono">
                                <span className="text-slate-500 truncate">
                                  {feat.role}
                                </span>
                                <span className="text-emerald-700 font-bold shrink-0">
                                  {feat.rating.split(' ')[0]}
                                </span>
                              </div>
                              <span className="text-xs font-display font-bold text-slate-950 block truncate mt-0.5">
                                {feat.name}
                              </span>
                              <span className="text-xs font-mono text-slate-600 block truncate">
                                {feat.price}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Traction Metrics Pills */}
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {creator.tags.slice(0, 3).map((tag, idx) => (
                            <span key={idx} className="text-xs font-mono px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Footer Actions (Featuring the Beacon Button with Halo) */}
                      <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            openDemoForCreator(creator.id)
                          }}
                          className="relative flex-1 py-2.5 px-3.5 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs sm:text-sm font-bold transition-all shadow-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer group select-none min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Interactive Demo</span>
                          <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                          {/* Top-Right Accent Beacon Dot with Ambient Halo */}
                          <span className="absolute -top-1 -right-1 flex h-3 w-3 pointer-events-none items-center justify-center">
                            <span className="absolute inline-flex h-4 w-4 rounded-full bg-emerald-400/30 blur-[1px]" />
                            <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 opacity-60" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-white" />
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            scrollToSection(e, 'pipeline')
                          }}
                          className="py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap active:scale-95 min-h-[44px]"
                        >
                          50/50 Terms
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })()}
        </div>

        {/* ── Carousel Bottom Controls Bar (Prev/Next, Dots, Counter) ── */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-2xl mx-auto px-4">
          {/* Left / Right Arrow Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevCreator}
              className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-slate-950 hover:bg-slate-50 hover:border-slate-300 shadow-xs active:scale-95 flex items-center justify-center transition-all cursor-pointer min-h-[44px] min-w-[44px]"
              aria-label="Previous Creators"
            >
              <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
            </button>

            <button
              type="button"
              onClick={handleNextCreator}
              className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-slate-950 hover:bg-slate-50 hover:border-slate-300 shadow-xs active:scale-95 flex items-center justify-center transition-all cursor-pointer min-h-[44px] min-w-[44px]"
              aria-label="Next Creators"
            >
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>

          {/* Position Dots Indicator */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: maxCreatorIndex + 1 }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveCreatorIndex(idx)}
                className={`transition-all duration-300 cursor-pointer ${
                  idx === activeCreatorIndex
                    ? 'w-7 h-2 rounded-full bg-[#0F172A]'
                    : 'w-2 h-2 rounded-full bg-slate-300 hover:bg-slate-400'
                }`}
                aria-label={`Go to slide pair ${idx + 1}`}
              />
            ))}
          </div>

          {/* Next Creator Preview Pill */}
          {(() => {
            const nextIdx = (activeCreatorIndex + (isDesktopCarousel ? 2 : 1)) % CREATOR_PARTNERS.length
            const nextCreator = CREATOR_PARTNERS[nextIdx]
            return (
              <button
                type="button"
                onClick={handleNextCreator}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs sm:text-sm font-mono text-slate-600 hover:text-slate-950 transition-all cursor-pointer min-h-[44px]"
              >
                <span className="text-slate-400 text-[10px]">NEXT UP:</span>
                <img
                  src={nextCreator.avatar}
                  alt={nextCreator.name}
                  className="w-4 h-4 rounded-full object-cover"
                />
                <span className="font-bold text-slate-800">{nextCreator.name.split(' ')[0]}</span>
                <ArrowRight className="w-3 h-3 text-slate-500" />
              </button>
            )
          })()}
        </div>
      </section>

      {/* ── VERIFIED REVIEWS & TESTIMONIALS (CURVED PINNED DECK WITH DASHED TRAJECTORY) ── */}
      <section id="reviews" className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200/80">
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12">
          <span className="text-xs sm:text-sm font-mono uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-3.5 py-1 rounded-full font-bold inline-block">
            CO-FOUNDER REVIEWS
          </span>
          <h2 className="text-3xl sm:text-5xl font-display font-black text-slate-950 mt-2.5 tracking-tight leading-[1.15]">
            Loved by creators. Proven by numbers.
          </h2>
          <p className="mt-2.5 text-base sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed sm:leading-8 font-normal">
            Real creators who partnered with CreatorForge to turn their community into high-retention software equity.
          </p>
        </div>

        {/* Dotted Canvas with Arched Dashed Trajectory & 3 Pinned Review Cards */}
        <div className="relative p-6 sm:p-12 lg:p-16 rounded-[32px] bg-slate-50/70 border border-slate-200/90 overflow-hidden shadow-xs">
          
          {/* Floating Background Polygons */}
          <FloatingPolygons variant="section" />

          {/* Subtle Canvas Dot Grid Background */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-60"
            style={{
              backgroundImage: 'radial-gradient(#94A3B8 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }}
          />

          {/* Arched Dashed Trajectory Arc (Connecting behind the cards) */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-44 pointer-events-none hidden md:block overflow-visible z-0">
            <svg className="w-full h-full" viewBox="0 0 1000 160" fill="none" preserveAspectRatio="none">
              <path 
                d="M 50 110 Q 500 10 950 110" 
                stroke="#FDBA74" 
                strokeWidth="2.5" 
                strokeDasharray="9 9" 
                opacity="0.85"
              />
            </svg>
          </div>

          {/* 3 Interactive Hover Cards Deck */}
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-8 max-w-5xl mx-auto group/deck items-center">
            
            {/* Card 1 — Left (Sarah) */}
            <div className="relative group rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-7 shadow-[0_12px_32px_-8px_rgba(15,23,42,0.08)] transition-all duration-300 ease-out md:-rotate-2 md:translate-y-2 hover:!rotate-0 hover:!-translate-y-6 md:hover:!-translate-y-8 hover:!scale-[1.03] hover:!shadow-[0_24px_48px_-10px_rgba(15,23,42,0.18)] hover:!border-slate-300 hover:z-20 group-hover/deck:opacity-85 hover:!opacity-100 flex flex-col justify-between min-h-[300px]">
              
              {/* Top Pinned Dark Circular Node */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-[#0F172A] border-[3.5px] border-white shadow-[0_2px_8px_rgba(15,23,42,0.25)] flex items-center justify-center z-20 transition-all duration-300 group-hover:scale-110 group-hover:ring-4 group-hover:ring-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
              </div>

              <div>
                {/* Header: Avatar + Creator Info */}
                <div className="flex items-center gap-3.5">
                  <img
                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=160&q=80"
                    alt="Sarah"
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-slate-100 shrink-0 shadow-xs"
                  />
                  <div>
                    <h3 className="font-display font-bold text-slate-950 text-base leading-tight">Sarah</h3>
                    <p className="text-xs text-slate-500 font-medium leading-tight mt-1">Event Planner & Coordinator</p>
                  </div>
                </div>

                {/* Body Quote */}
                <p className="mt-5 text-sm sm:text-[14.5px] text-slate-700 font-normal leading-relaxed italic">
                  “Planning a luxury wedding used to stress me out. CreatorForge gave me complete confidence — their team and coordinators handled the entire flow flawlessly, and we never looked back.”
                </p>
              </div>

              {/* Footer: Stars + Verified Client Badge */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-500 text-amber-500" />
                  ))}
                </div>
                <span className="text-[10px] sm:text-[11px] font-mono font-bold tracking-wider text-slate-400 uppercase">
                  VERIFIED CLIENT
                </span>
              </div>
            </div>

            {/* Card 2 — Center (Kemi - Elevated) */}
            <div className="relative group rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-7 shadow-[0_16px_36px_-8px_rgba(15,23,42,0.10)] transition-all duration-300 ease-out md:rotate-0 md:-translate-y-4 hover:!-translate-y-10 hover:!scale-[1.03] hover:!shadow-[0_28px_52px_-10px_rgba(15,23,42,0.20)] hover:!border-slate-300 hover:z-20 group-hover/deck:opacity-85 hover:!opacity-100 flex flex-col justify-between min-h-[300px]">
              
              {/* Top Pinned Dark Circular Node */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-[#0F172A] border-[3.5px] border-white shadow-[0_2px_8px_rgba(15,23,42,0.25)] flex items-center justify-center z-20 transition-all duration-300 group-hover:scale-110 group-hover:ring-4 group-hover:ring-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
              </div>

              <div>
                {/* Header: Avatar + Creator Info */}
                <div className="flex items-center gap-3.5">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80"
                    alt="Kemi"
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-slate-100 shrink-0 shadow-xs"
                  />
                  <div>
                    <h3 className="font-display font-bold text-slate-950 text-base leading-tight">Kemi</h3>
                    <p className="text-xs text-slate-500 font-medium leading-tight mt-1">Wedding Celebrant & Bride</p>
                  </div>
                </div>

                {/* Body Quote */}
                <p className="mt-5 text-sm sm:text-[14.5px] text-slate-700 font-normal leading-relaxed italic">
                  “I’ve worked with many service providers, but CreatorForge truly understands the luxury event industry. Clean coordination, bespoke presentation, and pure excellence from start to finish.”
                </p>
              </div>

              {/* Footer: Stars + Verified Client Badge */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-500 text-amber-500" />
                  ))}
                </div>
                <span className="text-[10px] sm:text-[11px] font-mono font-bold tracking-wider text-slate-400 uppercase">
                  VERIFIED CLIENT
                </span>
              </div>
            </div>

            {/* Card 3 — Right (Deji) */}
            <div className="relative group rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-7 shadow-[0_12px_32px_-8px_rgba(15,23,42,0.08)] transition-all duration-300 ease-out md:rotate-2 md:translate-y-2 hover:!rotate-0 hover:!-translate-y-6 md:hover:!-translate-y-8 hover:!scale-[1.03] hover:!shadow-[0_24px_48px_-10px_rgba(15,23,42,0.18)] hover:!border-slate-300 hover:z-20 group-hover/deck:opacity-85 hover:!opacity-100 flex flex-col justify-between min-h-[300px]">
              
              {/* Top Pinned Dark Circular Node */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-[#0F172A] border-[3.5px] border-white shadow-[0_2px_8px_rgba(15,23,42,0.25)] flex items-center justify-center z-20 transition-all duration-300 group-hover:scale-110 group-hover:ring-4 group-hover:ring-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
              </div>

              <div>
                {/* Header: Avatar + Creator Info */}
                <div className="flex items-center gap-3.5">
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80"
                    alt="Deji"
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-slate-100 shrink-0 shadow-xs"
                  />
                  <div>
                    <h3 className="font-display font-bold text-slate-950 text-base leading-tight">Deji</h3>
                    <p className="text-xs text-slate-500 font-medium leading-tight mt-1">Corporate Summit Director</p>
                  </div>
                </div>

                {/* Body Quote */}
                <p className="mt-5 text-sm sm:text-[14.5px] text-slate-700 font-normal leading-relaxed italic">
                  “From executive ushers to cinematic visual coverage, CreatorForge managed our flagship gala with unmatched professionalism. Every attendee remarked on the standard of hospitality.”
                </p>
              </div>

              {/* Footer: Stars + Verified Client Badge */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-500 text-amber-500" />
                  ))}
                </div>
                <span className="text-[10px] sm:text-[11px] font-mono font-bold tracking-wider text-slate-400 uppercase">
                  VERIFIED CLIENT
                </span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ── THE PIPELINE ROUTE MAP (DANNY POSTMA S-CURVE PATTERN WITH SHIPPED & LIVE CANVAS) ── */}
      <section id="pipeline" className="py-8 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto border-t border-slate-200/80">
        <div className="text-center max-w-3xl mx-auto mb-4 sm:mb-6">
          <span className="text-xs sm:text-sm font-mono uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-3.5 py-1 rounded-full font-bold inline-block">
            HOW THE PARTNERSHIP WORKS
          </span>
          <h2 className="text-3xl sm:text-5xl font-display font-black text-slate-950 mt-2.5 tracking-tight leading-[1.15]">
            From fan comments to a live app in 14 days
          </h2>
          <p className="mt-2.5 text-base sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed sm:leading-8 font-normal">
            We handle all the coding, design, and 24/7 server maintenance. You approve each step before we move forward, and we split the profits 50/50.
          </p>
          <div className="mt-3.5 inline-flex flex-wrap items-center justify-center gap-2 text-xs sm:text-sm font-mono text-slate-600 bg-slate-50 border border-slate-200 px-4 py-1.5 rounded-full">
            <span className="font-bold text-slate-900">3 simple steps</span>
            <span>·</span>
            <span className="font-bold text-slate-900">14-day build</span>
            <span>·</span>
            <span className="font-bold text-slate-900">50/50 profit split</span>
            <span>·</span>
            <span className="text-emerald-700 font-semibold">you approve every step</span>
          </div>
        </div>

        {/* ── DESKTOP CONTINUOUS SERPENTINE S-CURVE ROUTE (ANIMATED ENERGY FLOW & CANVAS CELEBRATION) ── */}
        <div className="hidden lg:block relative p-6 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden group select-none">
          
          {/* Subtle Background Polygons in Pipeline */}
          <FloatingPolygons variant="section" />

          {/* Celebratory Canvas Particle Explosion when energy reaches ★ SHIPPED & LIVE */}
          <ShippedLiveCanvas
            cycleDuration={6500}
            originXPercent={0.888}
            originYPercent={0.830}
          />

          <svg className="w-full h-auto relative z-10" viewBox="0 0 1000 500" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* SVG Definitions for Glow Effects */}
            <defs>
              <filter id="glowGreen" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Hidden Master S-Curve Path for Continuous Particle Tracer */}
            <path
              id="scurveMasterRoute"
              d="M 90 79 L 850 79 A 84 84 0 0 1 850 247 L 160 247 A 84 84 0 0 0 160 415 L 810 415"
              fill="none"
              stroke="transparent"
            />

            {/* ── PHASE 1, 2, 3 HEADER LABELS (Background Layer) ─────────── */}
            <text x="140" y="44" fill="#D9A441" fontFamily="ui-monospace, monospace" fontSize="12" fontWeight="700" letterSpacing="0.1em">
              1 · FIND WHAT FANS WANT
            </text>
            <text x="740" y="214" fill="#17A79B" fontFamily="ui-monospace, monospace" fontSize="12" fontWeight="700" letterSpacing="0.1em" textAnchor="middle">
              2 · WE BUILD IT IN 14 DAYS
            </text>
            <text x="210" y="380" fill="#6E61AA" fontFamily="ui-monospace, monospace" fontSize="12" fontWeight="700" letterSpacing="0.1em">
              3 · LAUNCH & SPLIT PROFITS
            </text>

            {/* ── CONTINUOUS S-CURVE BASE ROUTE PATHS ── */}
            {/* Row 1: Line 1 (Amber, Left-to-Right) */}
            <line x1="90" y1="79" x2="850" y2="79" stroke="#D9A441" strokeWidth="6" strokeLinecap="round" />

            {/* Turn 1: Right 180° Downward Arc into Row 2 (Teal) */}
            <path d="M 850 79 A 84 84 0 0 1 850 247" stroke="#17A79B" strokeWidth="6" strokeLinecap="round" fill="none" />

            {/* Row 2: Line 2 (Teal, Right-to-Left) */}
            <line x1="850" y1="247" x2="160" y2="247" stroke="#17A79B" strokeWidth="6" strokeLinecap="round" />

            {/* Turn 2: Left 180° Downward Arc into Row 3 (Purple) */}
            <path d="M 160 247 A 84 84 0 0 0 160 415" stroke="#6E61AA" strokeWidth="6" strokeLinecap="round" fill="none" />

            {/* Row 3: Line 3 (Purple, Left-to-Right) */}
            <line x1="160" y1="415" x2="810" y2="415" stroke="#6E61AA" strokeWidth="6" strokeLinecap="round" />

            {/* ── ANIMATED ENERGY DASH OVERLAY (Continuous Electric Flow) ── */}
            <path
              d="M 90 79 L 850 79 A 84 84 0 0 1 850 247 L 160 247 A 84 84 0 0 0 160 415 L 810 415"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="3.5"
              strokeLinecap="round"
              className="animate-path-dash opacity-70 pointer-events-none"
            />

            {/* ── CONTINUOUS TRAVELING PARTICLE ENERGY BEAM (Full Circuit into ★ SHIPPED & LIVE) ── */}
            <circle r="8" fill="#10B981" filter="url(#glowGreen)" opacity="0.95">
              <animateMotion
                dur="6.5s"
                repeatCount="indefinite"
                path="M 90 79 L 850 79 A 84 84 0 0 1 850 247 L 160 247 A 84 84 0 0 0 160 415 L 810 415"
              />
            </circle>

            {/* Secondary High-Speed Particle */}
            <circle r="4.5" fill="#A3E635" opacity="0.9">
              <animateMotion
                dur="6.5s"
                begin="-3.25s"
                repeatCount="indefinite"
                path="M 90 79 L 850 79 A 84 84 0 0 1 850 247 L 160 247 A 84 84 0 0 0 160 415 L 810 415"
              />
            </circle>

            {/* ── STOP NODES & TEXT LABELS (Simple Non-Tech Language) ─────────────── */}
            {/* START Badge */}
            <rect x="24" y="62" width="68" height="34" rx="17" fill="#0F172A" />
            <text x="58" y="83" fill="#FFFFFF" fontFamily="ui-monospace, monospace" fontSize="11" fontWeight="800" textAnchor="middle">
              START
            </text>

            {/* Row 1 Stop 1: What fans ask for */}
            <circle cx="230" cy="79" r="8" fill="#0F172A" stroke="#FFFFFF" strokeWidth="3" />
            <text x="230" y="112" fill="#0F172A" fontFamily="system-ui, sans-serif" fontSize="13" fontWeight="700" textAnchor="middle">
              What fans ask for
            </text>
            <text x="230" y="130" fill="#64748B" fontFamily="system-ui, sans-serif" fontSize="11" textAnchor="middle">
              Read comments & repeat questions
            </text>

            {/* Row 1 Stop 2: Spot popular requests */}
            <circle cx="450" cy="79" r="8" fill="#0F172A" stroke="#FFFFFF" strokeWidth="3" />
            <text x="450" y="112" fill="#0F172A" fontFamily="system-ui, sans-serif" fontSize="13" fontWeight="700" textAnchor="middle">
              Spot popular requests
            </text>
            <text x="450" y="130" fill="#64748B" fontFamily="system-ui, sans-serif" fontSize="11" textAnchor="middle">
              Group fan requests into one app idea
            </text>

            {/* Row 1 Stop 3: Set monthly price */}
            <circle cx="660" cy="79" r="8" fill="#0F172A" stroke="#FFFFFF" strokeWidth="3" />
            <text x="660" y="112" fill="#0F172A" fontFamily="system-ui, sans-serif" fontSize="13" fontWeight="700" textAnchor="middle">
              Set monthly price
            </text>
            <text x="660" y="130" fill="#64748B" fontFamily="system-ui, sans-serif" fontSize="11" textAnchor="middle">
              Pick simple –/mo plans fans love
            </text>

            {/* Row 2 Stop 1: Design the app */}
            <circle cx="650" cy="247" r="8" fill="#0F172A" stroke="#FFFFFF" strokeWidth="3" />
            <text x="650" y="280" fill="#0F172A" fontFamily="system-ui, sans-serif" fontSize="13" fontWeight="700" textAnchor="middle">
              Design the app
            </text>
            <text x="650" y="298" fill="#64748B" fontFamily="system-ui, sans-serif" fontSize="11" textAnchor="middle">
              Clean screens and 1-click login
            </text>

            {/* Row 2 Stop 2: We write all code */}
            <circle cx="400" cy="247" r="8" fill="#0F172A" stroke="#FFFFFF" strokeWidth="3" />
            <text x="400" y="280" fill="#0F172A" fontFamily="system-ui, sans-serif" fontSize="13" fontWeight="700" textAnchor="middle">
              We write all code
            </text>
            <text x="400" y="298" fill="#64748B" fontFamily="system-ui, sans-serif" fontSize="11" textAnchor="middle">
              Our team codes the complete app in 14 days
            </text>

            {/* Row 3 Stop 1: Share with fans */}
            <circle cx="280" cy="415" r="8" fill="#0F172A" stroke="#FFFFFF" strokeWidth="3" />
            <text x="280" y="448" fill="#0F172A" fontFamily="system-ui, sans-serif" fontSize="13" fontWeight="700" textAnchor="middle">
              Share with fans
            </text>
            <text x="280" y="466" fill="#64748B" fontFamily="system-ui, sans-serif" fontSize="11" textAnchor="middle">
              Add the link to your video descriptions
            </text>

            {/* Row 3 Stop 2: 50/50 automatic split */}
            <circle cx="480" cy="415" r="8" fill="#0F172A" stroke="#FFFFFF" strokeWidth="3" />
            <text x="480" y="448" fill="#0F172A" fontFamily="system-ui, sans-serif" fontSize="13" fontWeight="700" textAnchor="middle">
              50/50 automatic split
            </text>
            <text x="480" y="466" fill="#64748B" fontFamily="system-ui, sans-serif" fontSize="11" textAnchor="middle">
              Half of every dollar goes to your bank
            </text>

            {/* Row 3 Stop 3: 24/7 care & updates */}
            <circle cx="680" cy="415" r="8" fill="#0F172A" stroke="#FFFFFF" strokeWidth="3" />
            <text x="680" y="448" fill="#0F172A" fontFamily="system-ui, sans-serif" fontSize="13" fontWeight="700" textAnchor="middle">
              24/7 care & updates
            </text>
            <text x="680" y="466" fill="#64748B" fontFamily="system-ui, sans-serif" fontSize="11" textAnchor="middle">
              We fix bugs & keep servers running
            </text>

            {/* Terminal Target: ★ SHIPPED & LIVE (With Radar Ripple Animation & Interactive Burst) */}
            <g className="cursor-pointer">
              {/* Radar pulse ripples on arrival */}
              <circle cx="888" cy="415" r="30" stroke="#10B981" strokeWidth="2" fill="none" opacity="0.6">
                <animate attributeName="r" values="24;52" dur="2.2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.85;0" dur="2.2s" repeatCount="indefinite" />
              </circle>
              <circle cx="888" cy="415" r="20" stroke="#A3E635" strokeWidth="2" fill="none" opacity="0.8">
                <animate attributeName="r" values="16;42" dur="2.2s" begin="1.1s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.95;0" dur="2.2s" begin="1.1s" repeatCount="indefinite" />
              </circle>

              {/* Pill Container */}
              <rect x="804" y="397" width="168" height="36" rx="18" fill="#0D9488" className="shadow-lg transition-transform hover:scale-105" />
              <text x="888" y="420" fill="#FFFFFF" fontFamily="system-ui, sans-serif" fontSize="12" fontWeight="800" textAnchor="middle">
                ★ SHIPPED & LIVE
              </text>
            </g>
            <text x="888" y="452" fill="#047857" fontFamily="ui-monospace, monospace" fontSize="11" fontWeight="700" textAnchor="middle">
              ,300/MO EARNINGS
            </text>

            {/* ── DIAMOND APPROVAL GATES (WITH ANIMATED RADAR RINGS) ── */}
            {/* Gate 1 */}
            <circle cx="850" cy="79" r="22" stroke="#10B981" strokeWidth="2" fill="none" opacity="0.6" className="pointer-events-none">
              <animate attributeName="r" values="18;36" dur="2.4s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.75;0" dur="2.4s" repeatCount="indefinite" />
            </circle>
            <g transform="translate(850, 79)">
              <rect x="-19" y="-19" width="38" height="38" rx="8" fill="#FFFFFF" transform="rotate(45)" />
              <rect x="-16" y="-16" width="32" height="32" rx="6" fill="#10B981" transform="rotate(45)" />
              <path d="M-6 0 L-2 4 L6 -4" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </g>
            <text x="850" y="122" fill="#065F46" fontFamily="ui-monospace, monospace" fontSize="10" fontWeight="700" textAnchor="middle">
              YOU APPROVE
            </text>

            {/* Gate 2 */}
            <circle cx="160" cy="247" r="22" stroke="#10B981" strokeWidth="2" fill="none" opacity="0.6" className="pointer-events-none">
              <animate attributeName="r" values="18;36" dur="2.4s" begin="1.2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.75;0" dur="2.4s" begin="1.2s" repeatCount="indefinite" />
            </circle>
            <g transform="translate(160, 247)">
              <rect x="-19" y="-19" width="38" height="38" rx="8" fill="#FFFFFF" transform="rotate(45)" />
              <rect x="-16" y="-16" width="32" height="32" rx="6" fill="#10B981" transform="rotate(45)" />
              <path d="M-6 0 L-2 4 L6 -4" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </g>
            <text x="160" y="290" fill="#065F46" fontFamily="ui-monospace, monospace" fontSize="10" fontWeight="700" textAnchor="middle">
              YOU APPROVE
            </text>
          </svg>

        </div>

        {/* Mobile Stepper Fallback (< lg) */}
        <div className="lg:hidden mt-6 max-w-md mx-auto space-y-4 text-left">
          {/* Phase 1 */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <span className="text-xs font-mono font-bold uppercase text-[#D9A441] bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
              1 · FIND WHAT FANS WANT
            </span>
            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-[#D9A441] mt-1.5 shrink-0" />
                <div><b className="text-slate-900">What fans ask for:</b> <span className="text-slate-600">Read comments & repeat questions</span></div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-[#D9A441] mt-1.5 shrink-0" />
                <div><b className="text-slate-900">Spot popular requests:</b> <span className="text-slate-600">Group repeat questions into one app</span></div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-[#D9A441] mt-1.5 shrink-0" />
                <div><b className="text-slate-900">Set fair price:</b> <span className="text-slate-600">Pick simple –/mo subscription plans</span></div>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs font-bold text-slate-900">
              <span>YOU APPROVE THE APP IDEA</span>
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px]">✓</span>
            </div>
          </div>

          {/* Phase 2 */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <span className="text-xs font-mono font-bold uppercase text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
              2 · WE BUILD IT IN 14 DAYS
            </span>
            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-[#17A79B] mt-1.5 shrink-0" />
                <div><b className="text-slate-900">Design the app:</b> <span className="text-slate-600">Simple screens and easy login for fans</span></div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-[#17A79B] mt-1.5 shrink-0" />
                <div><b className="text-slate-900">We code everything:</b> <span className="text-slate-600">Our team builds the complete web app</span></div>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs font-bold text-slate-900">
              <span>YOU TEST & APPROVE THE APP</span>
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px]">✓</span>
            </div>
          </div>

          {/* Phase 3 */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <span className="text-xs font-mono font-bold uppercase text-purple-800 bg-purple-50 px-2.5 py-0.5 rounded border border-purple-200">
              3 · LAUNCH & SPLIT PROFITS
            </span>
            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-[#6E61AA] mt-1.5 shrink-0" />
                <div><b className="text-slate-900">Share with fans:</b> <span className="text-slate-600">Put your app link in your videos</span></div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-[#6E61AA] mt-1.5 shrink-0" />
                <div><b className="text-slate-900">50/50 profit split:</b> <span className="text-slate-600">Half of every dollar goes to your bank</span></div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-[#6E61AA] mt-1.5 shrink-0" />
                <div><b className="text-slate-900">24/7 care & updates:</b> <span className="text-slate-600">We fix bugs and keep servers fast</span></div>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900 text-white flex items-center justify-between text-xs font-mono font-bold">
              <span>★ SHIPPED & LIVE</span>
              <span className="text-emerald-400">,300/MO</span>
            </div>
          </div>
        </div>

        {/* Support Tools Footer Pill */}
        <p className="mt-8 text-center text-xs font-mono text-slate-500">
          <span className="font-bold text-slate-700">Studio tools included:</span> Comment Reader · Fair Price Finder · App Builder · Stripe Auto-Split · 24/7 Server Shield
        </p>

      </section>

      {/* ── STEP-BY-STEP SECTIONS (DANNY POSTMA SKELETON DOCUMENT CARDS) ──── */}
      <section id="steps" className="py-8 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto border-t border-slate-200/80">
        
        <div className="text-center max-w-3xl mx-auto mb-4 sm:mb-6">
          <span className="text-xs sm:text-sm font-mono uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-3.5 py-1 rounded-full font-bold inline-block">
            STEP BY STEP PROCESS
          </span>
          <h2 className="text-3xl sm:text-5xl font-display font-black text-slate-950 mt-2.5 tracking-tight leading-[1.15]">
            How your software gets built
          </h2>
          <p className="mt-2.5 text-base sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed sm:leading-8 font-normal">
            Here is the exact step-by-step roadmap we follow to take your idea from concept to a live recurring business.
          </p>
        </div>

        <div className="space-y-7 sm:space-y-9">

          {/* ── STEP 1: icp_signals.md ──── */}
          <div className="grid lg:grid-cols-2 gap-6 sm:gap-10 lg:gap-14 items-center">
            {/* Left: Skeleton Doc Card */}
            <div className="p-5 sm:p-7 rounded-3xl bg-slate-50 border border-slate-200 shadow-xs flex items-center justify-center">
              <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-left">
                <div className="px-5 py-3 border-b border-slate-100 font-mono text-xs text-slate-500 bg-slate-50 flex items-center justify-between">
                  <span>fan_requests.md</span>
                  <span className="w-2 h-2 rounded-full bg-[#b8862f]" />
                </div>
                <div className="p-6 space-y-5">
                  <div>
                    <p className="text-xs font-mono font-bold tracking-wider uppercase text-[#b8862f]">
                      WHO BUYS
                    </p>
                    <div className="space-y-1.5 mt-2">
                      <div className="h-2 rounded-full bg-slate-200 w-3/4" />
                      <div className="h-2 rounded-full bg-slate-200 w-1/2" />
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-mono font-bold tracking-wider uppercase text-[#b8862f]">
                      WHAT THEY NEED
                    </p>
                    <div className="space-y-1.5 mt-2">
                      <div className="h-2 rounded-full bg-slate-200 w-full" />
                      <div className="h-2 rounded-full bg-slate-200 w-2/3" />
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-mono font-bold tracking-wider uppercase text-[#b8862f]">
                      WHAT FANS SAY IN COMMENTS
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50 text-xs font-mono text-slate-500">
                        <span>"</span>
                        <div className="h-2 rounded-full bg-slate-300 w-16" />
                        <span>"</span>
                      </div>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50 text-xs font-mono text-slate-500">
                        <span>"</span>
                        <div className="h-2 rounded-full bg-slate-300 w-12" />
                        <span>"</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Step Details */}
            <div className="text-left">
              <p className="text-xs font-mono font-bold tracking-wider uppercase text-[#b8862f]">
                STEP 1 · FIND WHAT FANS WANT
              </p>
              <h3 className="mt-2 text-2xl sm:text-3xl font-display font-black text-slate-900 tracking-tight leading-snug">
                Find out what your fans are actually asking to buy
              </h3>
              <p className="mt-3 text-base sm:text-lg text-slate-600 leading-relaxed sm:leading-8">
                We read through your video comments, community posts, and DMs to find questions fans ask again and again. Then we build an app that solves that exact problem for them.
              </p>
              <p className="mt-4 font-mono text-xs text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5">
                $ <b className="text-slate-900">/find-fan-requests</b>
              </p>
            </div>
          </div>

          {/* ── STEP 2: tam_pricing_model.md ─────────────────────────────── */}
          <div className="grid lg:grid-cols-2 gap-6 sm:gap-10 lg:gap-14 items-center">
            {/* Left: Step Details (Alternating) */}
            <div className="text-left order-2 lg:order-1">
              <p className="text-xs font-mono font-bold tracking-wider uppercase text-[#b8862f]">
                STEP 2 · FAIR MONTHLY PRICING
              </p>
              <h3 className="mt-2 text-2xl sm:text-3xl font-display font-black text-slate-900 tracking-tight leading-snug">
                Pick the perfect price fans will happily pay
              </h3>
              <p className="mt-3 text-base sm:text-lg text-slate-600 leading-relaxed sm:leading-8">
                We figure out whether $19, $29, or $49 per month makes the most sense. You only launch an app that makes dependable recurring income month after month.
              </p>
              <p className="mt-4 font-mono text-xs text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5">
                $ <b className="text-slate-900">/set-monthly-pricing</b>
              </p>
            </div>

            {/* Right: Skeleton Doc Card */}
            <div className="p-5 sm:p-7 rounded-3xl bg-slate-50 border border-slate-200 shadow-xs flex items-center justify-center order-1 lg:order-2">
              <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-left">
                <div className="px-5 py-3 border-b border-slate-100 font-mono text-xs text-slate-500 bg-slate-50 flex items-center justify-between">
                  <span>monthly_pricing.md</span>
                  <span className="w-2 h-2 rounded-full bg-[#b8862f]" />
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-2 rounded-full bg-slate-200 w-24" />
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">$29/MO BASIC</span>
                    <div className="h-2 rounded-full bg-slate-200 w-10 ml-auto" />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-2 rounded-full bg-slate-200 w-32" />
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">$49/MO PRO</span>
                    <div className="h-2 rounded-full bg-slate-200 w-8 ml-auto" />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-2 rounded-full bg-slate-200 w-20" />
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">$99/MO TEAM</span>
                    <div className="h-2 rounded-full bg-slate-200 w-12 ml-auto" />
                  </div>
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-mono text-slate-500 uppercase">PROJECTED YEARLY</span>
                    <span className="text-sm font-mono font-bold text-slate-900">$480,000 / YR</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── STEP 3: saas_blueprint.json ──────────────────────────────── */}
          <div className="grid lg:grid-cols-2 gap-6 sm:gap-10 lg:gap-14 items-center">
            {/* Left: Skeleton Doc Card */}
            <div className="p-5 sm:p-7 rounded-3xl bg-slate-50 border border-slate-200 shadow-xs flex items-center justify-center">
              <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-left">
                <div className="px-5 py-3 border-b border-slate-100 font-mono text-xs text-slate-500 bg-slate-50 flex items-center justify-between">
                  <span>app_blueprint.json</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                </div>
                <div className="p-5 space-y-2.5">
                  <div className="flex items-center gap-3 border border-slate-200 rounded-lg px-3 py-2 bg-slate-50">
                    <span className="text-xs font-mono font-bold text-emerald-800">01 · USER ACCOUNTS & LOGIN</span>
                    <div className="h-2 rounded-full bg-slate-200 w-20 ml-auto" />
                  </div>
                  <div className="flex items-center gap-3 border border-slate-200 rounded-lg px-3 py-2 bg-slate-50">
                    <span className="text-xs font-mono font-bold text-emerald-800">02 · MAIN APP FEATURES</span>
                    <div className="h-2 rounded-full bg-slate-200 w-16 ml-auto" />
                  </div>
                  <div className="flex items-center gap-3 border border-slate-200 rounded-lg px-3 py-2 bg-slate-50">
                    <span className="text-xs font-mono font-bold text-emerald-800">03 · STRIPE PAYMENTS</span>
                    <div className="h-2 rounded-full bg-slate-200 w-14 ml-auto" />
                  </div>
                  <div className="flex items-center gap-3 border border-slate-200 rounded-lg px-3 py-2 bg-slate-50">
                    <span className="text-xs font-mono font-bold text-emerald-800">04 · LIVE EARNINGS DASHBOARD</span>
                    <div className="h-2 rounded-full bg-slate-200 w-16 ml-auto" />
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Step Details */}
            <div className="text-left">
              <p className="text-xs font-mono font-bold tracking-wider uppercase text-emerald-800">
                STEP 3 · APP BLUEPRINT
              </p>
              <h3 className="mt-2 text-2xl sm:text-3xl font-display font-black text-slate-900 tracking-tight leading-snug">
                A simple plan you review before we start
              </h3>
              <p className="mt-3 text-base sm:text-lg text-slate-600 leading-relaxed sm:leading-8">
                We map out the screens, features, and simple login so you know exactly what your app will look like. You give feedback and approve it before we write a single line of code.
              </p>
              <p className="mt-4 font-mono text-xs text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5">
                $ <b className="text-slate-900">/review-app-plan</b>
              </p>
            </div>
          </div>

          {/* ── STEP 4: app_prototype.jsx (LO-FI / PROTOTYPE WIREFRAME) ──── */}
          <div className="grid lg:grid-cols-2 gap-6 sm:gap-10 lg:gap-14 items-center">
            {/* Left: Step Details (Alternating) */}
            <div className="text-left order-2 lg:order-1">
              <p className="text-xs font-mono font-bold tracking-wider uppercase text-emerald-800">
                STEP 4 · 14-DAY BUILD
              </p>
              <h3 className="mt-2 text-2xl sm:text-3xl font-display font-black text-slate-900 tracking-tight leading-snug">
                We build your app in 14 days — you write zero code
              </h3>
              <p className="mt-3 text-base sm:text-lg text-slate-600 leading-relaxed sm:leading-8">
                Our engineering team codes the web app, tests everything on mobile and desktop, and connects payments. You test the app and approve it before your fans ever see it.
              </p>
              <p className="mt-4 font-mono text-xs text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5">
                $ <b className="text-slate-900">/build-your-app</b>
              </p>
            </div>

            {/* Right: Skeleton Doc Card */}
            <div className="p-5 sm:p-7 rounded-3xl bg-slate-50 border border-slate-200 shadow-xs flex items-center justify-center order-1 lg:order-2">
              <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-left">
                <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50 flex items-center gap-1.5 font-mono text-xs text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-slate-300" />
                  <span className="w-2 h-2 rounded-full bg-slate-300" />
                  <span className="w-2 h-2 rounded-full bg-slate-300" />
                  <span className="ml-1 text-xs">your_app_preview.jsx</span>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="h-2 rounded-full bg-slate-300 w-16" />
                    <div className="flex gap-1.5">
                      <div className="h-2 rounded-full bg-slate-200 w-8" />
                      <div className="h-2 rounded-full bg-slate-200 w-8" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 items-center">
                    <div>
                      <div className="h-2.5 rounded-full bg-slate-800 w-full" />
                      <div className="h-2 rounded-full bg-slate-200 w-5/6 mt-1.5" />
                      <div className="h-2 rounded-full bg-slate-200 w-2/3 mt-1.5" />
                    </div>
                    <div className="h-16 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center">
                      <span className="text-xs font-mono text-slate-500 font-bold">READY TO TEST</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <div className="h-10 rounded-lg bg-slate-100 border border-slate-200/60" />
                    <div className="h-10 rounded-lg bg-slate-100 border border-slate-200/60" />
                    <div className="h-10 rounded-lg bg-slate-100 border border-slate-200/60" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── STEP 5: stripe_splits.json ───────────────────────────────── */}
          <div className="grid lg:grid-cols-2 gap-6 sm:gap-10 lg:gap-14 items-center">
            {/* Left: Skeleton Doc Card */}
            <div className="p-5 sm:p-7 rounded-3xl bg-slate-50 border border-slate-200 shadow-xs flex items-center justify-center">
              <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-left">
                <div className="px-5 py-3 border-b border-slate-100 font-mono text-xs text-slate-500 bg-slate-50 flex items-center justify-between">
                  <span>stripe_splits_router.json</span>
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                </div>
                <div className="p-5 space-y-3">
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-slate-900 uppercase">CREATOR (YOU)</span>
                      <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">50% YOUR SHARE</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200 w-3/4" />
                  </div>
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-slate-900 uppercase">CREATOR FORGE</span>
                      <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">50% STUDIO SHARE</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200 w-2/3" />
                  </div>
                  <div className="pt-2 flex items-center gap-2 text-xs font-mono text-emerald-700 font-semibold">
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>AUTOMATIC BANK DEPOSIT ACTIVE</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Step Details */}
            <div className="text-left">
              <p className="text-xs font-mono font-bold tracking-wider uppercase text-purple-800">
                STEP 5 · 50/50 PROFIT SPLIT
              </p>
              <h3 className="mt-2 text-2xl sm:text-3xl font-display font-black text-slate-900 tracking-tight leading-snug">
                Half of every dollar goes straight to your bank
              </h3>
              <p className="mt-3 text-base sm:text-lg text-slate-600 leading-relaxed sm:leading-8">
                Whenever a subscriber pays each month, Stripe automatically deposits 50% directly into your bank account. You get transparent dashboards with zero accounting headaches.
              </p>
              <p className="mt-4 font-mono text-xs text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5">
                $ <b className="text-slate-900">/turn-on-direct-splits</b>
              </p>
            </div>
          </div>

          {/* ── STEP 6: production_telemetry.md (INCREASED GRAPH & HISTORY HEIGHT TO h-60) ── */}
          <div className="grid lg:grid-cols-2 gap-6 sm:gap-10 lg:gap-14 items-center">
            {/* Left: Step Details (Alternating) */}
            <div className="text-left order-2 lg:order-1">
              <p className="text-xs font-mono font-bold tracking-wider uppercase text-purple-800">
                STEP 6 · 24/7 CARE & UPDATES
              </p>
              <h3 className="mt-2 text-2xl sm:text-3xl font-display font-black text-slate-900 tracking-tight leading-snug">
                Zero tech headaches — we manage servers 24/7
              </h3>
              <p className="mt-3 text-base sm:text-lg text-slate-600 leading-relaxed sm:leading-8">
                You never have to manage servers, worry about crashes, or answer tech support questions. We take care of all of it while you focus on making great videos.
              </p>
              <p className="mt-4 font-mono text-xs text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5">
                $ <b className="text-slate-900">/24-7-cloud-shield</b>
              </p>
            </div>

            {/* Right: Skeleton Doc Card with EXPANDED GRAPH HEIGHT (h-60) */}
            <div className="p-5 sm:p-7 rounded-3xl bg-slate-50 border border-slate-200 shadow-xs flex items-center justify-center order-1 lg:order-2">
              <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-left">
                <div className="px-5 py-3 border-b border-slate-100 font-mono text-xs text-slate-500 bg-slate-50 flex items-center justify-between">
                  <span>live_earnings_history.md</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
                
                {/* Taller Graph / History Chart (Increased Height to h-60) */}
                <div className="p-5 space-y-4">
                  {/* Expanded Bar Graph (Increased Height from h-44 to h-60) */}
                  <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col justify-between h-56 sm:h-60">
                    <div className="flex items-center justify-between text-xs sm:text-sm font-mono text-slate-500">
                      <span className="font-bold text-slate-900 uppercase">MONTHLY CASHFLOW GROWTH</span>
                      <span className="text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">+28% MoM</span>
                    </div>
                    
                    {/* Tall Bars with Month Labels */}
                    <div className="flex items-end justify-between gap-2.5 h-36 sm:h-40 w-full pt-3 border-b border-slate-200/80">
                      <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                        <span className="text-[10px] sm:text-xs font-mono text-slate-600 font-bold">$8.4k</span>
                        <div className="w-full rounded-t-lg bg-emerald-200 group-hover:bg-emerald-300 transition-colors h-[28%]" />
                        <span className="text-[10px] sm:text-xs font-mono text-slate-500 font-semibold">M1</span>
                      </div>
                      <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                        <span className="text-[10px] sm:text-xs font-mono text-slate-600 font-bold">$16.8k</span>
                        <div className="w-full rounded-t-lg bg-emerald-300 group-hover:bg-emerald-400 transition-colors h-[48%]" />
                        <span className="text-[10px] sm:text-xs font-mono text-slate-500 font-semibold">M2</span>
                      </div>
                      <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                        <span className="text-[10px] sm:text-xs font-mono text-slate-600 font-bold">$24.2k</span>
                        <div className="w-full rounded-t-lg bg-emerald-400 group-hover:bg-emerald-500 transition-colors h-[68%]" />
                        <span className="text-[10px] sm:text-xs font-mono text-slate-500 font-semibold">M3</span>
                      </div>
                      <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                        <span className="text-[10px] sm:text-xs font-mono text-slate-600 font-bold">$32.6k</span>
                        <div className="w-full rounded-t-lg bg-emerald-500 group-hover:bg-emerald-600 transition-colors h-[84%]" />
                        <span className="text-[10px] sm:text-xs font-mono text-slate-500 font-semibold">M4</span>
                      </div>
                      <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                        <span className="text-[10px] sm:text-xs font-mono text-emerald-800 font-bold">$42.3k</span>
                        <div className="w-full rounded-t-lg bg-emerald-600 group-hover:bg-emerald-700 transition-colors h-[100%]" />
                        <span className="text-[10px] sm:text-xs font-mono font-bold text-slate-900">M5</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-1">
                      <span>Stripe Payouts Active</span>
                      <span className="text-emerald-700 font-semibold">Auto-Deposited</span>
                    </div>
                  </div>

                  {/* Operational Status Below Graph */}
                  <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm font-mono">
                    <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                        <Activity className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">UPTIME</span>
                        <span className="font-bold text-slate-900">99.99% Online</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                        <ShieldCheck className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">MAINTENANCE</span>
                        <span className="font-bold text-slate-900">24/7 Managed</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>

        </div>

        {/* ── OBJECTION BUSTER CARD (Clean & Compact) ────────── */}
        <div className="mt-8 sm:mt-10 max-w-2xl mx-auto p-5 sm:p-7 bg-slate-50 border border-slate-200 rounded-3xl text-center shadow-xs">
          <h3 className="text-lg sm:text-xl font-display font-bold text-slate-950">
            "Couldn’t I just hire a software agency or sell another course?"
          </h3>
          <p className="mt-2.5 text-sm sm:text-base text-slate-600 leading-relaxed sm:leading-7">
            Agencies charge $60,000 to $120,000 upfront with zero skin in the game. If users cancel or things break, they bill you more hourly fees. Digital courses burn out audiences with low completion rates. Creator Forge does 100% of the engineering and 24/7 maintenance for $0 upfront. We only make money when your software succeeds.
          </p>
        </div>

      </section>

      {/* ── INTERACTIVE CO-FOUNDER REVENUE CALCULATOR ───────────────────────── */}
      <section id="calculator" className="py-8 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200/80">
        <div className="p-5 sm:p-8 rounded-3xl bg-slate-50 border border-slate-200 max-w-5xl mx-auto shadow-xs">
          
          <div className="text-center max-w-2xl mx-auto mb-5 sm:mb-6">
            <span className="text-xs sm:text-sm font-mono uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-3.5 py-1 rounded-full font-bold inline-block">
              MONTHLY EARNINGS CALCULATOR
            </span>
            <h2 className="text-3xl sm:text-5xl font-display font-black text-slate-950 mt-2.5 tracking-tight leading-[1.15]">
              See how much you could earn every month
            </h2>
            <p className="mt-2.5 text-base sm:text-xl text-slate-600 leading-relaxed sm:leading-8 font-normal">
              Adjust the sliders below to see what your recurring income looks like based on your audience size and pricing.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
            
            {/* Sliders & Selectors */}
            <div className="lg:col-span-6 space-y-4 text-left">
              
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <label htmlFor={audienceRangeId} className="text-xs sm:text-sm font-mono font-bold text-slate-700 uppercase">
                    Your Audience Size
                  </label>
                  <span className="text-base sm:text-lg font-mono font-bold text-slate-950">
                    {calcAudience.toLocaleString()} Followers
                  </span>
                </div>
                <input
                  id={audienceRangeId}
                  type="range"
                  min="10000"
                  max="1000000"
                  step="10000"
                  value={calcAudience}
                  onChange={(e) => setCalcAudience(Number(e.target.value))}
                  className="w-full accent-slate-900 bg-slate-200 h-2.5 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[11px] font-mono text-slate-400">
                  <span>10K fans</span>
                  <span>500K fans</span>
                  <span>1M+ fans</span>
                </div>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2.5">
                <label className="text-xs sm:text-sm font-mono font-bold text-slate-700 uppercase block">
                  Monthly App Price
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { price: 29, sub: '$29/mo' },
                    { price: 49, sub: '$49/mo' },
                    { price: 99, sub: '$99/mo' }
                  ].map((p) => (
                    <button
                      key={p.price}
                      type="button"
                      onClick={() => setCalcPricing(p.price)}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer font-mono font-bold text-xs sm:text-sm min-h-[44px] ${
                        calcPricing === p.price
                          ? 'bg-[#0F172A] border-[#0F172A] text-white shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {p.sub}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <label htmlFor={convRangeId} className="text-xs sm:text-sm font-mono font-bold text-slate-700 uppercase">
                    Fans Who Subscribe
                  </label>
                  <span className="text-base font-mono font-bold text-emerald-700">
                    {calcConvRate.toFixed(1)}% ({estimatedSubscribers.toLocaleString()} subscribers)
                  </span>
                </div>
                <input
                  id={convRangeId}
                  type="range"
                  min="0.2"
                  max="3.0"
                  step="0.1"
                  value={calcConvRate}
                  onChange={(e) => setCalcConvRate(Number(e.target.value))}
                  className="w-full accent-slate-900 bg-slate-200 h-2.5 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[11px] font-mono text-slate-400">
                  <span>0.2% (Conservative)</span>
                  <span>1.0% (Average)</span>
                  <span>3.0% (High Trust)</span>
                </div>
              </div>

            </div>

            {/* Projected Revenue Result with TALL Growth Trajectory Graph */}
            <div className="lg:col-span-6 p-5 sm:p-7 rounded-3xl bg-white border border-slate-200 text-left space-y-4 shadow-lg">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-500 font-bold">
                  YOUR 50% TAKE-HOME PAY
                </span>
                <span className="text-xs sm:text-sm font-mono text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-bold">
                  $0 Upfront Cost
                </span>
              </div>

              <div>
                <span className="text-xs font-mono text-slate-500 block">Deposited Directly Every Month</span>
                <div className="text-4xl sm:text-5xl font-display font-black text-slate-950 font-mono mt-1">
                  ${creatorShareMonthly.toLocaleString()}{' '}
                  <span className="text-sm sm:text-base font-normal text-slate-500 font-sans">/ month</span>
                </div>
                <div className="text-xs sm:text-sm font-mono text-slate-600 mt-1">
                  ${creatorShareAnnual.toLocaleString()} yearly run-rate
                </div>
              </div>

              {/* ── TALL 6-MONTH PROJECTED TRAJECTORY GRAPH (Increased Height to h-64) ── */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between text-xs sm:text-sm font-mono text-slate-500">
                  <span className="font-bold text-slate-800 uppercase tracking-wide">6-Month Cashflow Trajectory</span>
                  <span className="text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">50% Net Share</span>
                </div>

                {/* Taller Bar Columns Container (h-60 on mobile, h-64 on desktop) */}
                <div className="h-56 sm:h-64 pt-4 pb-2 flex items-end justify-between gap-2.5 border-b border-slate-200">
                  {[
                    { month: 'M1', mult: 0.32, label: 'Launch' },
                    { month: 'M2', mult: 0.54, label: 'Growth' },
                    { month: 'M3', mult: 0.72, label: 'Momentum' },
                    { month: 'M4', mult: 0.86, label: 'Adoption' },
                    { month: 'M5', mult: 0.96, label: 'Steady' },
                    { month: 'M6', mult: 1.12, label: 'Mature' }
                  ].map((m, mIdx) => {
                    const monthCreatorShare = Math.round(creatorShareMonthly * m.mult)
                    const barHeightPercent = Math.min(100, Math.max(16, Math.round(m.mult * 85)))

                    return (
                      <div key={mIdx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group cursor-default">
                        {/* Monthly Dollar Badge above bar */}
                        <span className="text-[10px] sm:text-xs font-mono font-bold text-slate-700 group-hover:text-emerald-700 transition-colors">
                          ${monthCreatorShare >= 1000 ? `${(monthCreatorShare / 1000).toFixed(1)}k` : monthCreatorShare}
                        </span>

                        {/* Stacked Two-Tone Bar (Emerald Creator + Slate Studio) */}
                        <div 
                          className="w-full rounded-t-xl bg-slate-100 overflow-hidden flex flex-col justify-end transition-all duration-500 relative"
                          style={{ height: `${barHeightPercent}%` }}
                        >
                          {/* Creator 50% Share (Top Segment) */}
                          <div className="w-full h-1/2 bg-emerald-500 group-hover:bg-emerald-400 transition-colors" />
                          {/* Studio 50% Share (Bottom Segment) */}
                          <div className="w-full h-1/2 bg-[#0F172A]" />
                        </div>

                        {/* Month Label below bar */}
                        <span className="text-[10px] sm:text-xs font-mono font-bold text-slate-600">
                          {m.month}
                        </span>
                      </div>
                    )
                  })}
                </div>

                <div className="flex items-center justify-between text-[11px] sm:text-xs font-mono text-slate-500 pt-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                    <span>Your 50% Take-Home</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#0F172A]" />
                    <span>Studio 50% Share</span>
                  </div>
                </div>
              </div>

              {/* Clear Stats Breakdown */}
              <div className="space-y-2 pt-1 border-t border-slate-100 text-xs sm:text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Paying Subscribers</span>
                  <span className="font-mono font-bold text-slate-900">{estimatedSubscribers.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Total Monthly Revenue</span>
                  <span className="font-mono font-bold text-slate-900">${monthlyRevenue.toLocaleString()} / mo</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Your Cost to Build</span>
                  <span className="font-mono font-bold text-emerald-700">$0.00 (100% Free)</span>
                </div>
              </div>

              {/* Signature Beacon Button with Ambient Halo Glow */}
              <button
                type="button"
                onClick={(e) => e.preventDefault()}
                className="relative w-full py-4 px-6 rounded-2xl bg-[#0F172A] hover:bg-[#1E293B] text-white font-display font-bold text-sm sm:text-base shadow-md hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 group select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 min-h-[52px]"
              >
                <span>Apply to Build Your App (50/50)</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                {/* Signature Top-Right Accent Beacon Dot with Ambient Halo */}
                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 pointer-events-none items-center justify-center">
                  <span className="absolute inline-flex h-6 w-6 rounded-full bg-emerald-400/30 blur-[2px]" />
                  <span className="animate-ping absolute inline-flex h-3.5 w-3.5 rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white shadow-xs" />
                </span>
              </button>

            </div>

          </div>

        </div>
      </section>

      {/* ── PORTFOLIO SECTION ────────────────────────────────────────────────── */}
      <section id="portfolio" className="py-8 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200/80">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-4 sm:mb-6">
          <div>
            <span className="text-xs sm:text-sm font-mono uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-3.5 py-1 rounded-full font-bold inline-block">
              LIVE PARTNERSHIPS
            </span>
            <h2 className="text-3xl sm:text-5xl font-display font-black text-slate-950 mt-2.5 tracking-tight leading-[1.15]">
              Real software built with creators
            </h2>
          </div>
          <p className="mt-2 md:mt-0 text-base sm:text-lg text-slate-600 max-w-sm">
            Real software businesses launched with creators as equal 50/50 partners.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {PORTFOLIO_PRODUCTS.map((prod) => (
            <div
              key={prod.id}
              className="rounded-2xl bg-white border border-slate-200 hover:border-slate-300 shadow-xs hover:shadow-md transition-all text-left flex flex-col justify-between overflow-hidden group"
            >
              {/* Browser Window Titlebar */}
              <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-300" />
                  <span className="w-2 h-2 rounded-full bg-slate-300" />
                  <span className="w-2 h-2 rounded-full bg-slate-300" />
                </div>
                <span className="text-[11px] font-mono text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded shadow-2xs">
                  {prod.url}
                </span>
              </div>

              {/* Card Body */}
              <div className="p-5 flex flex-col justify-between flex-1">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
                    <span className="text-[10px] font-mono text-slate-500 uppercase">{prod.category}</span>
                    <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">{prod.badge}</span>
                  </div>

                  <h3 className="text-base sm:text-lg font-display font-bold text-slate-950 group-hover:text-slate-700 transition-colors">
                    {prod.title}
                  </h3>
                  <p className="text-xs font-mono font-bold text-emerald-700 mt-0.5">{prod.mrr}</p>
                  <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                    {prod.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 text-xs font-mono text-slate-800 font-semibold flex items-center justify-between">
                  <span>{prod.metric}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </section>

      {/* ── FAQ SECTION ──────────────────────────────────────────────────────── */}
      <section id="faq" className="py-8 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto border-t border-slate-200/80">
        
        <div className="text-center mb-4 sm:mb-6">
          <span className="text-xs sm:text-sm font-mono uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-3.5 py-1 rounded-full font-bold inline-block">
            FREQUENTLY ASKED QUESTIONS
          </span>
          <h2 className="text-3xl sm:text-5xl font-display font-black text-slate-950 mt-2.5 tracking-tight leading-[1.15]">
            Common questions answered
          </h2>
          <p className="mt-2.5 text-base sm:text-xl text-slate-600">
            Everything you need to know about partnering with Creator Forge.
          </p>
        </div>

        <div className="space-y-3.5 text-left">
          {FAQS.map((faq, i) => {
            const isOpen = openFaq === i
            return (
              <div
                key={i}
                className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : i)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between text-left gap-4 cursor-pointer hover:bg-slate-50 transition-colors min-h-[48px]"
                >
                  <span className="text-base sm:text-xl font-display font-bold text-slate-900">{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-slate-500 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-slate-900' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-base sm:text-lg text-slate-600 leading-relaxed sm:leading-8 border-t border-slate-100 pt-3.5">
                    {faq.a}
                  </div>
                )}
              </div>
            )
          })}
        </div>

      </section>

      {/* ── CLOSING LIGHT CTA BANNER ────────────────────────────────────────── */}
      <section className="pb-8 sm:pb-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="p-6 sm:p-9 rounded-3xl bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900 border border-slate-200 text-center relative overflow-hidden shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
          {/* Soft ambient radial glow */}
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] rounded-full blur-[140px] opacity-[0.25] pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(163, 230, 53, 0.45) 0%, rgba(59, 130, 246, 0.15) 50%, transparent 70%)' }}
          />

          <div className="max-w-2xl mx-auto relative z-10">
            <span className="text-xs sm:text-sm font-mono uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-3.5 py-1 rounded-full font-bold inline-block">
              ZERO-CAPITAL 50/50 PARTNERSHIP
            </span>
            <h3 className="text-3xl sm:text-5xl font-display font-black text-slate-950 mt-2.5 leading-[1.15] tracking-tight">
              Ready to turn your audience into monthly income?
            </h3>
            <p className="mt-2.5 text-base sm:text-xl text-slate-600 leading-relaxed sm:leading-8">
              We build your custom app in 14 days for free, connect payments, and split profits 50/50.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <button
                type="button"
                onClick={(e) => e.preventDefault()}
                className="relative w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-9 py-4 rounded-2xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-base sm:text-lg font-display font-bold shadow-[0_6px_24px_rgba(15,23,42,0.18)] hover:shadow-[0_10px_32px_rgba(15,23,42,0.28)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 select-none min-h-[52px]"
              >
                <span>Apply to Build Your App (50/50)</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                {/* Signature Top-Right Accent Beacon Dot with Ambient Halo */}
                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 pointer-events-none items-center justify-center">
                  <span className="absolute inline-flex h-6 w-6 rounded-full bg-emerald-400/30 blur-[2px]" />
                  <span className="animate-ping absolute inline-flex h-3.5 w-3.5 rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white shadow-xs" />
                </span>
              </button>

              <a
                href="#creators"
                onClick={(e) => scrollToSection(e, 'creators')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 hover:border-slate-300 text-base font-semibold shadow-xs transition-all active:scale-[0.98] cursor-pointer min-h-[52px]"
              >
                <Play className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                <span>See Creator Demos</span>
              </a>
            </div>

            {/* Micro guarantees */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-5 text-sm sm:text-base font-medium text-slate-600">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>$0 Upfront Cost</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>14-Day Launch</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>50/50 Automatic Splits</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── CLEAN LIGHT FOOTER ──────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 bg-slate-50 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          
          <div className="flex items-center gap-3">
            <CreatorForgeLogo size={18} showText={true} theme="light" />
            <span className="text-slate-300">|</span>
            <span className="text-slate-600 font-medium">Venture Studio Software Partnerships</span>
          </div>

          <div className="flex items-center gap-6 text-[11px] font-mono">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-slate-700 font-semibold">SYSTEM OPERATIONAL</span>
            </div>
            <span>© {new Date().getFullYear()} CREATOR FORGE STUDIO. ZERO CAPITAL CO-FOUNDERS.</span>
          </div>

        </div>
      </footer>

      {/* ── INTERACTIVE CREATOR DEMO SANDBOX MODAL ───────────────────────── */}
      {demoModalOpen && (() => {
        const creator = CREATOR_PARTNERS.find(c => c.id === selectedCreatorDemo) || CREATOR_PARTNERS[0]
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-md animate-fade-in">
            <div className="relative w-full max-w-4xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-left">
              
              {/* Modal Top Chrome (Danny Postma Browser Window) */}
              <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-rose-400" />
                    <span className="w-3 h-3 rounded-full bg-amber-400" />
                    <span className="w-3 h-3 rounded-full bg-emerald-400" />
                  </div>
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-lg bg-white border border-slate-200 text-xs font-mono text-slate-700 shadow-2xs">
                    <Lock className="w-3 h-3 text-emerald-600" />
                    <span className="font-semibold text-slate-900">{creator.domain}</span>
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      LIVE SANDBOX
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-500 hidden sm:inline">
                    Simulating: <b className="text-slate-900">{creator.name}</b>
                  </span>
                  <button
                    type="button"
                    onClick={() => setDemoModalOpen(false)}
                    className="p-1.5 rounded-xl hover:bg-slate-200/80 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                    aria-label="Close Demo"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Creator Switcher Tab Ribbon inside modal */}
              <div className="px-5 py-2.5 bg-slate-100/70 border-b border-slate-200 flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-none">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold shrink-0">CREATOR:</span>
                {CREATOR_PARTNERS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCreatorDemo(c.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                      selectedCreatorDemo === c.id
                        ? 'bg-white text-slate-950 shadow-xs font-bold border border-slate-200'
                        : 'text-slate-600 hover:text-slate-950 hover:bg-white/50'
                    }`}
                  >
                    <img src={c.avatar} alt={c.name} className="w-4 h-4 rounded-full object-cover" />
                    <span>{c.name.split(' ')[0]}</span>
                    <span className="text-[10px] font-mono text-emerald-700 font-bold">({c.saasProduct.split(' ')[0]})</span>
                  </button>
                ))}
              </div>

              {/* Modal Body (Scrollable Interactive Simulator) */}
              <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1">
                
                {/* Creator Header Profile Banner */}
                <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-50 to-white border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <img
                      src={creator.avatar}
                      alt={creator.name}
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-200 shadow-xs"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-display font-bold text-base sm:text-lg text-slate-950">
                          {creator.name}
                        </h4>
                        <CheckCircle2 className="w-4 h-4 text-sky-500 fill-sky-100" />
                        <span className="text-[10px] font-mono text-slate-500">{creator.handle}</span>
                      </div>
                      <p className="text-xs font-mono text-slate-600">
                        {creator.subscribers} · {creator.niche}
                      </p>
                      <p className="text-xs text-emerald-800 font-bold font-mono mt-0.5">
                        Co-Founded Venture: {creator.saasProduct} ({creator.category})
                      </p>
                    </div>
                  </div>

                  <div className="sm:text-right shrink-0">
                    <span className="text-xl sm:text-2xl font-display font-black text-slate-950 font-mono block">
                      {creator.mrr}
                    </span>
                    <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold inline-block mt-0.5">
                      {creator.splitRatio}
                    </span>
                  </div>
                </div>

                {/* Conditional Dynamic Simulator according to creator */}
                {creator.id === 'mkbhd' && (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-display font-bold text-sm text-slate-900">
                          Interactive Studio Gear Rig Configurator
                        </h5>
                        <p className="text-xs text-slate-500">
                          Click items below to inspect real-time specs, optical ratings, and affiliate revenue share.
                        </p>
                      </div>
                      <span className="text-xs font-mono text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        18,420 Paid Users
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {creator.demoFeatures.map((feat, i) => (
                        <div
                          key={i}
                          className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs transition-all space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono text-slate-400 uppercase">{feat.role}</span>
                            <span className="text-[11px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                              {feat.rating}
                            </span>
                          </div>
                          <div className="font-display font-bold text-sm text-slate-900">
                            {feat.name}
                          </div>
                          <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs font-mono">
                            <span className="text-slate-500">Hardware Value</span>
                            <span className="font-bold text-slate-900">{feat.price}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Live Telemetry Bar */}
                    <div className="p-4 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
                      <div>
                        <span className="text-slate-400 block text-[10px]">AUTOMATED STRIPE SPLIT ENGINE</span>
                        <span className="font-bold text-emerald-400 text-sm">$32,400 to Marques Brownlee / $32,400 to Creator Forge</span>
                      </div>
                      <span className="text-emerald-400 bg-emerald-950/80 border border-emerald-700/60 px-3 py-1 rounded-full text-[11px] font-bold self-start sm:self-auto">
                        100% PASS-THROUGH ACCURACY
                      </span>
                    </div>
                  </div>
                )}

                {creator.id === 'aliabdaal' && (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-display font-bold text-sm text-slate-900">
                          Sponsor Deal CRM Pipeline Simulator
                        </h5>
                        <p className="text-xs text-slate-500">
                          Manage inbound brand deals, generate automated rate cards, and split earnings.
                        </p>
                      </div>
                      <span className="text-xs font-mono text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        3,100 Active Teams
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {creator.demoFeatures.map((feat, i) => (
                        <div
                          key={i}
                          className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs transition-all space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono text-slate-400 uppercase">{feat.role}</span>
                            <span className="text-[11px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                              {feat.rating}
                            </span>
                          </div>
                          <div className="font-display font-bold text-sm text-slate-900">
                            {feat.name}
                          </div>
                          <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs font-mono">
                            <span className="text-slate-500">Deal Value</span>
                            <span className="font-bold text-slate-900">{feat.price}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Live Telemetry Bar */}
                    <div className="p-4 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
                      <div>
                        <span className="text-slate-400 block text-[10px]">AUTOMATED STRIPE CONNECT DISTRIBUTION</span>
                        <span className="font-bold text-emerald-400 text-sm">$24,100 to Ali Abdaal / $24,100 to Creator Forge</span>
                      </div>
                      <span className="text-emerald-400 bg-emerald-950/80 border border-emerald-700/60 px-3 py-1 rounded-full text-[11px] font-bold self-start sm:self-auto">
                        4.2-DAY DEAL VELOCITY
                      </span>
                    </div>
                  </div>
                )}

                {creator.id === 'mrwhosetheboss' && (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-display font-bold text-sm text-slate-900">
                          Smartphone Shootout Benchmark Matrix
                        </h5>
                        <p className="text-xs text-slate-500">
                          Real-world battery drain and camera sensor comparisons for millions of tech buyers.
                        </p>
                      </div>
                      <span className="text-xs font-mono text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        24,000 Paid Pro Users
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {creator.demoFeatures.map((feat, i) => (
                        <div
                          key={i}
                          className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono text-slate-400 uppercase">{feat.role}</span>
                            <span className="text-[11px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                              {feat.rating}
                            </span>
                          </div>
                          <div className="font-display font-bold text-sm text-slate-900">
                            {feat.name}
                          </div>
                          <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs font-mono">
                            <span className="text-slate-500">Benchmark Score</span>
                            <span className="font-bold text-slate-900">{feat.price}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
                      <div>
                        <span className="text-slate-400 block text-[10px]">MONTHLY RUN-RATE TELEMETRY</span>
                        <span className="font-bold text-emerald-400 text-sm">$36,050 to Arun Maini / $36,050 to Creator Forge</span>
                      </div>
                      <span className="text-emerald-400 bg-emerald-950/80 border border-emerald-700/60 px-3 py-1 rounded-full text-[11px] font-bold self-start sm:self-auto">
                        380+ DEVICES TESTED
                      </span>
                    </div>
                  </div>
                )}

                {creator.id === 'lexfridman' && (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-display font-bold text-sm text-slate-900">
                          Semantic AI Concept Synthesizer
                        </h5>
                        <p className="text-xs text-slate-500">
                          Search 2,150+ hours across 450 deep episodes by concept, thesis, and peer citation.
                        </p>
                      </div>
                      <span className="text-xs font-mono text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        8,400 Research Pro
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {creator.demoFeatures.map((feat, i) => (
                        <div
                          key={i}
                          className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono text-slate-400 uppercase">{feat.role}</span>
                            <span className="text-[11px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                              {feat.rating}
                            </span>
                          </div>
                          <div className="font-display font-bold text-sm text-slate-900">
                            {feat.name}
                          </div>
                          <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs font-mono">
                            <span className="text-slate-500">Vector Nodes</span>
                            <span className="font-bold text-slate-900">{feat.price}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
                      <div>
                        <span className="text-slate-400 block text-[10px]">MONTHLY RUN-RATE TELEMETRY</span>
                        <span className="font-bold text-emerald-400 text-sm">$19,750 to Lex Fridman / $19,750 to Creator Forge</span>
                      </div>
                      <span className="text-emerald-400 bg-emerald-950/80 border border-emerald-700/60 px-3 py-1 rounded-full text-[11px] font-bold self-start sm:self-auto">
                        1.2M VECTOR EMBEDDINGS
                      </span>
                    </div>
                  </div>
                )}

                {creator.id === 'cleoabram' && (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-display font-bold text-sm text-slate-900">
                          Futurism Breakthrough Roadmap Tracker
                        </h5>
                        <p className="text-xs text-slate-500">
                          Interactive timeline monitoring fusion, robotics, and synthetic biology breakthroughs.
                        </p>
                      </div>
                      <span className="text-xs font-mono text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        4,200 Founding Patrons
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {creator.demoFeatures.map((feat, i) => (
                        <div
                          key={i}
                          className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono text-slate-400 uppercase">{feat.role}</span>
                            <span className="text-[11px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                              {feat.rating}
                            </span>
                          </div>
                          <div className="font-display font-bold text-sm text-slate-900">
                            {feat.name}
                          </div>
                          <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs font-mono">
                            <span className="text-slate-500">Target Year</span>
                            <span className="font-bold text-slate-900">{feat.price}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
                      <div>
                        <span className="text-slate-400 block text-[10px]">MONTHLY RUN-RATE TELEMETRY</span>
                        <span className="font-bold text-emerald-400 text-sm">$15,700 to Cleo Abram / $15,700 to Creator Forge</span>
                      </div>
                      <span className="text-emerald-400 bg-emerald-950/80 border border-emerald-700/60 px-3 py-1 rounded-full text-[11px] font-bold self-start sm:self-auto">
                        85 MILESTONES VERIFIED
                      </span>
                    </div>
                  </div>
                )}

                {creator.id === 'petermckinnon' && (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-display font-bold text-sm text-slate-900">
                          WebAssembly RAW Video Color Grade Previewer
                        </h5>
                        <p className="text-xs text-slate-500">
                          Test cinematic 3D LUTs directly in the browser on uncompressed RAW footage with zero lag.
                        </p>
                      </div>
                      <span className="text-xs font-mono text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        6,800 Active Creators
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {creator.demoFeatures.map((feat, i) => (
                        <div
                          key={i}
                          className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono text-slate-400 uppercase">{feat.role}</span>
                            <span className="text-[11px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                              {feat.rating}
                            </span>
                          </div>
                          <div className="font-display font-bold text-sm text-slate-900">
                            {feat.name}
                          </div>
                          <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs font-mono">
                            <span className="text-slate-500">Precision Format</span>
                            <span className="font-bold text-slate-900">{feat.price}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
                      <div>
                        <span className="text-slate-400 block text-[10px]">MONTHLY RUN-RATE TELEMETRY</span>
                        <span className="font-bold text-emerald-400 text-sm">$22,300 to Peter McKinnon / $22,300 to Creator Forge</span>
                      </div>
                      <span className="text-emerald-400 bg-emerald-950/80 border border-emerald-700/60 px-3 py-1 rounded-full text-[11px] font-bold self-start sm:self-auto">
                        100% WASM ACCELERATED
                      </span>
                    </div>
                  </div>
                )}

              </div>

              {/* Modal Bottom CTA Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                <div className="text-xs text-slate-600">
                  <span className="font-semibold text-slate-900">Ready to build software for your audience?</span> $0 upfront capital · 14-day sprint
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setDemoModalOpen(false)}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 cursor-pointer min-h-[44px]"
                  >
                    Close Demo
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      // Investor preview mode - does nothing
                    }}
                    className="relative flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs sm:text-sm font-bold shadow-xs cursor-pointer flex items-center justify-center gap-1.5 min-h-[44px] group"
                  >
                    <span>Apply as Co-Founder (50/50) →</span>
                    {/* Signature Top-Right Accent Beacon Dot with Ambient Halo */}
                    <span className="absolute -top-1 -right-1 flex h-3 w-3 pointer-events-none items-center justify-center">
                      <span className="absolute inline-flex h-4 w-4 rounded-full bg-emerald-400/30 blur-[1px]" />
                      <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 opacity-60" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-white" />
                    </span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        )
      })()}

    </div>
  )
}
