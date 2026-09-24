import { useState, useId } from 'react'
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
  Terminal,
  ExternalLink,
  Laptop,
  Smartphone,
  CreditCard
} from 'lucide-react'
import CreatorForgeLogo from '../ui/CreatorForgeLogo'

// ── Portfolio Showcase Data ──────────────────────────────────────────────────
const PORTFOLIO_PRODUCTS = [
  {
    id: 'crm',
    title: 'Creator CRM OS',
    category: 'RELATIONSHIP PIPELINE',
    creator: 'Ali Abdaal Ecosystem',
    mrr: '$42,300 MRR',
    badge: 'LIVE PARTNERSHIP',
    description: 'Sovereign brand deal, sponsor pipeline, and deliverables tracking system.',
    metric: '28 Active Deals · 64% Win Rate'
  },
  {
    id: 'intel',
    title: 'Audience Intelligence',
    category: 'SEMANTIC MINING',
    creator: 'Elena Rostova Studio',
    mrr: '$31,800 MRR',
    badge: 'LIVE PARTNERSHIP',
    description: 'Autonomous comment cluster analyzer converting video feedback into SaaS features.',
    metric: '142K Comments Mined · $680K TAM'
  },
  {
    id: 'community',
    title: 'Community OS Hub',
    category: 'PRIVATE HUB & WORKSPACE',
    creator: 'Marcus Vance Network',
    mrr: '$54,200 MRR',
    badge: 'LIVE PARTNERSHIP',
    description: 'Modular developer community hub with built-in code vault and member directories.',
    metric: '1,840 Paid Members · 94% Retention'
  },
  {
    id: 'finance',
    title: 'Creator Finance Treasury',
    category: 'TREASURY & SPLITS',
    creator: 'Jamal Rivera Co-Launch',
    mrr: '$28,600 MRR',
    badge: 'LIVE PARTNERSHIP',
    description: 'Automated gross revenue distribution and collaborator contract payout router.',
    metric: '$1.4M Disbursed · 100% Split Accuracy'
  }
]

// ── FAQ Items ─────────────────────────────────────────────────────────────────
const FAQS = [
  {
    q: 'Why a 50/50 co-founder partnership instead of hiring an agency?',
    a: 'Agencies charge $50k–$120k upfront with zero skin in the game. When things break or users churn, they bill more hours. Creator Forge co-invests 100% of engineering, design, and DevOps. We only profit when your software generates recurring revenue together.'
  },
  {
    q: 'What is required from the creator?',
    a: 'You bring domain expertise and audience distribution. We handle software architecture, full-stack development, database infrastructure, security, payments, and 24/7 DevOps. You never write a line of code.'
  },
  {
    q: 'What if the audience doesn’t buy?',
    a: 'Because you invest zero upfront capital, you have zero financial exposure. If our initial pre-order campaign does not hit its validation target, we iterate or test another opportunity without penalty.'
  },
  {
    q: 'How do revenue distributions get paid?',
    a: 'Through automated Stripe Connect payouts. Every subscription payment is automatically split 50/50 directly into your verified bank account with real-time accounting telemetry.'
  }
]

export default function Welcome() {
  const { next, goTo, userProfile } = useForge()
  const [openFaq, setOpenFaq] = useState(0)

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
    <div className="min-h-screen bg-[#080A0C] text-[#F5F3EA] font-sans selection:bg-[#C8FF3D] selection:text-[#080A0C] overflow-x-hidden relative">

      {/* ── Background Grid Matrix ────────────────────────────────────────── */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.035] z-0"
        style={{
          backgroundImage: `linear-gradient(#F5F3EA 1px, transparent 1px), linear-gradient(90deg, #F5F3EA 1px, transparent 1px)`,
          backgroundSize: '72px 72px'
        }}
      />

      {/* ── Ambient Radial Warm Lighting Glow ──────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div 
          className="absolute -top-[15%] left-1/2 -translate-x-1/2 w-[1000px] h-[550px] rounded-full blur-[200px] opacity-[0.14]"
          style={{ background: 'radial-gradient(circle, rgba(200, 255, 61, 0.3) 0%, rgba(8, 10, 12, 0) 70%)' }}
        />
        <div 
          className="absolute top-[45%] right-[-10%] w-[700px] h-[700px] rounded-full blur-[220px] opacity-[0.07]"
          style={{ background: 'radial-gradient(circle, rgba(120, 224, 143, 0.25) 0%, rgba(8, 10, 12, 0) 70%)' }}
        />
      </div>

      {/* ── Sticky Navigation Bar ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#080A0C]/90 border-b border-[#252B32] transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Brand Logo & Studio Pill */}
          <div 
            className="flex items-center gap-3 cursor-pointer group" 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <CreatorForgeLogo size={22} showText={true} />
            <div className="hidden lg:flex items-center pl-2">
              <span className="text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#171C22] text-[#C8FF3D] border border-[#252B32]">
                VENTURE STUDIO
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-[13px] font-medium text-[#969DA6]">
            <a href="#showcase" className="hover:text-[#F5F3EA] transition-colors">The Platform</a>
            <a href="#discovery" className="hover:text-[#F5F3EA] transition-colors">Semantic Mining</a>
            <a href="#engineering" className="hover:text-[#F5F3EA] transition-colors">14-Day Sprint</a>
            <a href="#model" className="hover:text-[#F5F3EA] transition-colors">50/50 Model</a>
            <a href="#calculator" className="hover:text-[#F5F3EA] transition-colors">Calculator</a>
            <a href="#portfolio" className="hover:text-[#F5F3EA] transition-colors">Portfolio</a>
            <a 
              href="/launch" 
              className="flex items-center gap-1.5 text-[#C8FF3D] hover:text-white font-mono text-xs px-2.5 py-1 rounded bg-[#171C22] border border-[#252B32] hover:border-[#C8FF3D]/40 transition-all"
            >
              <span>Operator OS</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#C8FF3D] animate-pulse" />
            </a>
          </nav>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-3">
            {userProfile ? (
              <button
                onClick={() => goTo('dashboard')}
                className="text-xs font-semibold text-[#969DA6] hover:text-[#F5F3EA] px-3.5 py-2 rounded-xl border border-[#252B32] hover:bg-[#101419] transition-all cursor-pointer"
              >
                Dashboard
              </button>
            ) : (
              <button
                onClick={() => goTo('login')}
                className="text-xs font-semibold text-[#969DA6] hover:text-[#F5F3EA] px-3 py-2 rounded-xl hover:bg-[#101419] transition-all cursor-pointer"
              >
                Sign In
              </button>
            )}

            <button
              onClick={next}
              className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl bg-[#C8FF3D] text-[#080A0C] hover:bg-[#b8ef2d] shadow-[0_0_20px_rgba(200,255,61,0.25)] active:scale-95 transition-all cursor-pointer"
            >
              <span>Apply as Co-Founder</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </header>

      {/* ── HERO SECTION (VISUAL FIRST) ───────────────────────────────────── */}
      <section className="relative pt-16 sm:pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
        
        {/* Eyebrow Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#101419] border border-[#252B32] text-[11px] font-mono font-semibold uppercase tracking-[0.2em] text-[#969DA6] mb-6 animate-fade-in shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[#C8FF3D] animate-pulse" />
          <span>ZERO-CAPITAL SOFTWARE CO-FOUNDERS</span>
          <span className="text-[#686F78]">/</span>
          <span className="text-[#C8FF3D]">50/50 EQUITY</span>
        </div>

        {/* Hero Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-display font-extrabold tracking-tight text-[#F5F3EA] max-w-4xl leading-[1.07]">
          Turn your audience into a{' '}
          <span className="text-[#C8FF3D] relative inline-block">
            high-margin software business.
          </span>
        </h1>

        {/* Punchy 1-Sentence Subheadline */}
        <p className="mt-5 text-base sm:text-lg text-[#969DA6] max-w-2xl font-normal leading-relaxed">
          Creator Forge discovers audience pain points, engineers custom SaaS MVPs, and co-launches 50/50 software partnerships with creators. Zero upfront capital.
        </p>

        {/* Action Buttons */}
        <div className="mt-7 flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto">
          <button
            onClick={next}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-[#C8FF3D] text-[#080A0C] text-sm font-bold shadow-[0_4px_24px_rgba(200,255,61,0.25)] hover:bg-[#b8ef2d] hover:shadow-[0_6px_32px_rgba(200,255,61,0.35)] active:scale-[0.98] transition-all cursor-pointer"
          >
            <span>Apply as Creator Co-Founder (50/50) →</span>
          </button>

          <a
            href="/launch"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#101419] hover:bg-[#171C22] text-[#F5F3EA] border border-[#252B32] hover:border-[#363D47] text-sm font-semibold transition-all active:scale-[0.98]"
          >
            <Activity className="w-4 h-4 text-[#78E08F]" />
            <span>Open Operator Studio OS</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#686F78]" />
          </a>
        </div>

        {/* Guarantee Badges */}
        <div className="mt-7 flex flex-wrap items-center justify-center gap-6 text-xs font-mono text-[#969DA6]">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#78E08F]" />
            <span>$0 Upfront Capital</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#78E08F]" />
            <span>14-Day MVP Build Sprint</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#78E08F]" />
            <span>50/50 Software Equity</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#78E08F]" />
            <span>Full Engineering & DevOps Included</span>
          </div>
        </div>

        {/* ── HERO PHOTOREALISTIC DEVICE SHOWCASE ─────────────────────────── */}
        <div id="showcase" className="mt-12 w-full max-w-5xl mx-auto relative group">
          <div className="rounded-2xl sm:rounded-3xl border border-[#252B32] bg-[#0D1014] shadow-[0_32px_120px_rgba(0,0,0,0.9)] overflow-hidden relative">
            
            {/* Top Device Titlebar */}
            <div className="h-10 bg-[#080A0C] border-b border-[#252B32] px-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#252B32]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#252B32]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#252B32]" />
                <div className="ml-3 hidden sm:flex items-center gap-2 px-3 py-1 rounded-md bg-[#101419] border border-[#252B32] text-[10px] font-mono text-[#969DA6]">
                  <Lock className="w-2.5 h-2.5 text-[#C8FF3D]" />
                  <span>app.creatorforge.studio/venture/os</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#78E08F] animate-pulse" />
                <span className="text-[10px] font-mono uppercase text-[#C8FF3D] font-bold">
                  PRODUCTION TELEMETRY ACTIVE
                </span>
              </div>
            </div>

            {/* High-Resolution Hero Visual Mockup */}
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#080A0C]">
              <img
                src="/images/hero_saas_macbook.jpg"
                alt="Creator Forge SaaS OS Running on Space Black MacBook Pro with iPhone Telemetry"
                className="w-full h-full object-cover object-center group-hover:scale-[1.01] transition-transform duration-700"
                loading="eager"
              />

              {/* Floating Live Telemetry Cards Pinned Directly on Visual */}
              <div className="absolute top-4 left-4 sm:top-6 sm:left-6 p-3 sm:p-4 rounded-2xl bg-[#080A0C]/90 backdrop-blur-md border border-[#252B32] shadow-2xl text-left hidden sm:block animate-fade-in">
                <div className="flex items-center gap-2 text-[10px] font-mono text-[#969DA6] mb-1">
                  <span className="w-2 h-2 rounded-full bg-[#78E08F] animate-pulse" />
                  <span>CO-LAUNCH MRR RUN-RATE</span>
                </div>
                <div className="text-xl sm:text-2xl font-display font-black text-[#F5F3EA] font-mono">
                  $38,400 <span className="text-xs text-[#78E08F] font-normal">+18.4% MoM</span>
                </div>
                <span className="text-[10px] font-mono text-[#C8FF3D] block mt-0.5">Automated 50/50 Stripe Split</span>
              </div>

              <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 p-3 sm:p-4 rounded-2xl bg-[#080A0C]/90 backdrop-blur-md border border-[#252B32] shadow-2xl text-right hidden sm:block animate-fade-in">
                <div className="flex items-center justify-end gap-2 text-[10px] font-mono text-[#969DA6] mb-1">
                  <CreditCard className="w-3.5 h-3.5 text-[#C8FF3D]" />
                  <span>STRIPE EXPRESS PAYOUT</span>
                </div>
                <div className="text-xl sm:text-2xl font-display font-black text-[#C8FF3D] font-mono">
                  $19,200.00
                </div>
                <span className="text-[10px] font-mono text-[#969DA6] block mt-0.5">Creator Net 50% Take-Home</span>
              </div>

            </div>

          </div>
        </div>

      </section>

      {/* ── SECTION 1: SEMANTIC MINING (IMAGE + 3 PUNCHY CARDS) ──────────── */}
      <section id="discovery" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#252B32]">
        
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#C8FF3D] font-bold">
            STEP 01 · AUDIENCE SIGNAL MINING
          </span>
          <h2 className="text-3xl sm:text-5xl font-display font-bold text-[#F5F3EA] mt-1">
            We find what your audience is desperate to buy.
          </h2>
          <p className="mt-3 text-sm text-[#969DA6]">
            No guesswork. Our proprietary NLP scans your comments and DMs to locate verified willingness-to-pay.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-6xl mx-auto">
          
          {/* Visual: Semantic Mining Engine */}
          <div className="lg:col-span-7 rounded-2xl sm:rounded-3xl border border-[#252B32] bg-[#0D1014] overflow-hidden shadow-2xl relative group">
            <img
              src="/images/semantic_mining_engine.jpg"
              alt="Semantic Signal Mining NLP Clustering Comments into SaaS Feature Specifications"
              className="w-full h-auto object-cover group-hover:scale-[1.02] transition-transform duration-500"
              loading="lazy"
            />
            <div className="absolute bottom-3 left-3 bg-[#080A0C]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#252B32] text-[10px] font-mono text-[#C8FF3D]">
              NLP Signal Extraction Engine · 98% Confidence Match
            </div>
          </div>

          {/* 3 Concise Feature Cards */}
          <div className="lg:col-span-5 space-y-4 text-left">
            
            <div className="p-5 rounded-2xl bg-[#101419] border border-[#252B32] hover:border-[#C8FF3D]/40 transition-colors space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-[#C8FF3D]">01</span>
                <h3 className="text-base font-display font-bold text-[#F5F3EA]">10,000+ Comments Scanned</h3>
              </div>
              <p className="text-xs text-[#969DA6] leading-relaxed">
                We ingest historical video comments, community Discord threads, and content questions to identify recurring friction.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#101419] border border-[#252B32] hover:border-[#C8FF3D]/40 transition-colors space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-[#C8FF3D]">02</span>
                <h3 className="text-base font-display font-bold text-[#F5F3EA]">Filter General Praise vs Real Demand</h3>
              </div>
              <p className="text-xs text-[#969DA6] leading-relaxed">
                Our NLP strips away casual compliments to isolate verified software requests and commercial intent.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#101419] border border-[#252B32] hover:border-[#C8FF3D]/40 transition-colors space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-[#C8FF3D]">03</span>
                <h3 className="text-base font-display font-bold text-[#F5F3EA]">Validated TAM & Pricing Architecture</h3>
              </div>
              <p className="text-xs text-[#969DA6] leading-relaxed">
                Before writing a line of code, we calculate exact community TAM, feature scopes, and pricing tiers ($29–$99/mo).
              </p>
            </div>

          </div>

        </div>

      </section>

      {/* ── SECTION 2: 14-DAY RAPID ENGINEERING (IMAGE + 3 CARDS) ────────── */}
      <section id="engineering" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#252B32]">
        
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#C8FF3D] font-bold">
            STEP 02 · RAPID MVP ENGINEERING
          </span>
          <h2 className="text-3xl sm:text-5xl font-display font-bold text-[#F5F3EA] mt-1">
            Production software in 14 days. Zero code from you.
          </h2>
          <p className="mt-3 text-sm text-[#969DA6]">
            Our full-stack venture team builds a real, responsive SaaS product on modern infrastructure.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-6xl mx-auto">
          
          {/* 3 Concise Feature Cards */}
          <div className="lg:col-span-5 space-y-4 text-left order-2 lg:order-1">
            
            <div className="p-5 rounded-2xl bg-[#101419] border border-[#252B32] hover:border-[#C8FF3D]/40 transition-colors space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-[#C8FF3D]">01</span>
                <h3 className="text-base font-display font-bold text-[#F5F3EA]">Full-Stack React & Cloud DB</h3>
              </div>
              <p className="text-xs text-[#969DA6] leading-relaxed">
                Complete web app, secure database architecture, user authentication, and automated billing built from day one.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#101419] border border-[#252B32] hover:border-[#C8FF3D]/40 transition-colors space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-[#C8FF3D]">02</span>
                <h3 className="text-base font-display font-bold text-[#F5F3EA]">Multi-Device Responsive Studio</h3>
              </div>
              <p className="text-xs text-[#969DA6] leading-relaxed">
                Engineered for desktop browsers, iPads, and mobile screens so your audience can use it across any workflow.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#101419] border border-[#252B32] hover:border-[#C8FF3D]/40 transition-colors space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-[#C8FF3D]">03</span>
                <h3 className="text-base font-display font-bold text-[#F5F3EA]">Zero Capital Risk For You</h3>
              </div>
              <p className="text-xs text-[#969DA6] leading-relaxed">
                We fund all development, server costs, API fees, and maintenance. You never pay an invoice.
              </p>
            </div>

          </div>

          {/* Visual: Multi-Device SaaS Setup */}
          <div className="lg:col-span-7 rounded-2xl sm:rounded-3xl border border-[#252B32] bg-[#0D1014] overflow-hidden shadow-2xl relative group order-1 lg:order-2">
            <img
              src="/images/saas_multi_device_showcase.jpg"
              alt="Custom Creator SaaS Platform Running across iPad, Laptop, and Mobile Phone"
              className="w-full h-auto object-cover group-hover:scale-[1.02] transition-transform duration-500"
              loading="lazy"
            />
            <div className="absolute bottom-3 left-3 bg-[#080A0C]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#252B32] text-[10px] font-mono text-[#78E08F]">
              Live Multi-Device MVP · $142.5K ARR Run-Rate
            </div>
          </div>

        </div>

      </section>

      {/* ── SECTION 3: THE 50/50 MODEL (IMAGE + DUAL PILLARS) ─────────────── */}
      <section id="model" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#252B32]">
        
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#C8FF3D] font-bold">
            STEP 03 · THE 50/50 CO-FOUNDER NEXUS
          </span>
          <h2 className="text-3xl sm:text-5xl font-display font-bold text-[#F5F3EA] mt-1">
            Equal co-founders. Equal recurring cashflow.
          </h2>
          <p className="mt-3 text-sm text-[#969DA6]">
            You bring the audience. We engineer the company. Revenue is split 50/50 automatically via Stripe.
          </p>
        </div>

        {/* Photorealistic 50/50 Nexus Visual */}
        <div className="max-w-5xl mx-auto rounded-2xl sm:rounded-3xl border border-[#252B32] bg-[#0D1014] overflow-hidden shadow-2xl relative group mb-8">
          <img
            src="/images/partnership_split_nexus.jpg"
            alt="3D Architectural Pillars Showing Creator 50% and Studio 50% Connected to Stripe Payout"
            className="w-full h-auto object-cover group-hover:scale-[1.01] transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 bg-[#080A0C]/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-[#252B32] text-[10px] font-mono text-[#C8FF3D]">
            Automated Stripe Connect Division · 50% Creator Equity
          </div>
        </div>

        {/* Dual Pillar Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-5xl mx-auto text-left">
          
          <div className="p-6 rounded-2xl bg-[#101419] border border-[#252B32] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#969DA6]">CREATOR CO-FOUNDER</span>
              <span className="text-2xl font-mono font-bold text-[#F5F3EA]">50%</span>
            </div>
            <ul className="text-xs text-[#969DA6] space-y-2">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#C8FF3D]" />
                <span>Audience distribution & community trust</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#C8FF3D]" />
                <span>Direct feedback loops & feature approval</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#C8FF3D]" />
                <span>100% control of your personal brand & content</span>
              </li>
            </ul>
          </div>

          <div className="p-6 rounded-2xl bg-[#101419] border border-[#252B32] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#C8FF3D]">CREATOR FORGE STUDIO</span>
              <span className="text-2xl font-mono font-bold text-[#C8FF3D]">50%</span>
            </div>
            <ul className="text-xs text-[#969DA6] space-y-2">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#C8FF3D]" />
                <span>Full-stack software architecture & React dev</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#C8FF3D]" />
                <span>$0 upfront capital or agency retainer fees</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#C8FF3D]" />
                <span>24/7 cloud servers, DevOps, and ongoing updates</span>
              </li>
            </ul>
          </div>

        </div>

      </section>

      {/* ── INTERACTIVE CO-FOUNDER REVENUE CALCULATOR ───────────────────────── */}
      <section id="calculator" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#252B32]">
        <div className="p-8 sm:p-12 rounded-3xl bg-[#0D1014] border border-[#252B32] max-w-5xl mx-auto">
          
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#C8FF3D] font-bold">
              VENTURE CALCULATOR
            </span>
            <h2 className="text-2xl sm:text-4xl font-display font-bold text-[#F5F3EA] mt-1">
              Estimate Your 50/50 Software Earnings
            </h2>
            <p className="mt-2 text-xs text-[#969DA6]">
              Simulate recurring subscription income based on your audience reach and pricing.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Sliders & Selectors */}
            <div className="lg:col-span-6 space-y-5 text-left">
              
              <div className="p-4 rounded-xl bg-[#101419] border border-[#252B32] space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor={audienceRangeId} className="text-xs font-mono font-bold text-[#969DA6] uppercase">Audience Reach</label>
                  <span className="text-base font-mono font-bold text-[#F5F3EA]">{calcAudience.toLocaleString()} Followers</span>
                </div>
                <input
                  id={audienceRangeId}
                  type="range"
                  min="10000"
                  max="1000000"
                  step="10000"
                  value={calcAudience}
                  onChange={(e) => setCalcAudience(Number(e.target.value))}
                  className="w-full accent-[#C8FF3D] bg-[#171C22] h-2 rounded-lg cursor-pointer"
                />
              </div>

              <div className="p-4 rounded-xl bg-[#101419] border border-[#252B32] space-y-2">
                <label className="text-xs font-mono font-bold text-[#969DA6] uppercase block">Monthly Tier Pricing</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { price: 29, sub: '$29/mo' },
                    { price: 49, sub: '$49/mo' },
                    { price: 99, sub: '$99/mo' }
                  ].map((p) => (
                    <button
                      key={p.price}
                      type="button"
                      onClick={() => setCalcPricing(p.price)}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer font-mono font-bold text-xs ${
                        calcPricing === p.price
                          ? 'bg-[#171C22] border-[#C8FF3D] text-[#C8FF3D]'
                          : 'bg-[#0D1014] border-[#252B32] text-[#969DA6]'
                      }`}
                    >
                      {p.sub}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#101419] border border-[#252B32] space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor={convRangeId} className="text-xs font-mono font-bold text-[#969DA6] uppercase">Conversion Benchmark</label>
                  <span className="text-sm font-mono font-bold text-[#C8FF3D]">{calcConvRate.toFixed(1)}%</span>
                </div>
                <input
                  id={convRangeId}
                  type="range"
                  min="0.2"
                  max="3.0"
                  step="0.1"
                  value={calcConvRate}
                  onChange={(e) => setCalcConvRate(Number(e.target.value))}
                  className="w-full accent-[#C8FF3D] bg-[#171C22] h-2 rounded-lg cursor-pointer"
                />
              </div>

            </div>

            {/* Projected Revenue Result */}
            <div className="lg:col-span-6 p-6 sm:p-8 rounded-2xl bg-[#101419] border border-[#252B32] text-left space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#252B32]">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#969DA6]">CO-FOUNDER CASHFLOW</span>
                <span className="text-[10px] font-mono text-[#78E08F] bg-[#171C22] px-2 py-0.5 rounded-full border border-[#252B32]">
                  $0 Upfront
                </span>
              </div>

              <div>
                <span className="text-xs font-mono text-[#969DA6] block">Your 50% Monthly Net Share</span>
                <div className="text-3xl sm:text-5xl font-display font-black text-[#C8FF3D] font-mono mt-1">
                  ${creatorShareMonthly.toLocaleString()} <span className="text-xs font-normal text-[#969DA6]">/ mo</span>
                </div>
                <div className="text-xs font-mono text-[#F5F3EA] mt-1">
                  ${creatorShareAnnual.toLocaleString()} annual run-rate
                </div>
              </div>

              <div className="space-y-2 pt-3 border-t border-[#252B32] text-xs">
                <div className="flex justify-between">
                  <span className="text-[#969DA6]">Paying Subscribers</span>
                  <span className="font-mono font-bold text-[#F5F3EA]">{estimatedSubscribers.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#969DA6]">Total Platform MRR</span>
                  <span className="font-mono font-bold text-[#F5F3EA]">${monthlyRevenue.toLocaleString()} / mo</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#969DA6]">Creator Capital Risk</span>
                  <span className="font-mono font-bold text-[#78E08F]">$0.00 (Zero Risk)</span>
                </div>
              </div>

              <button
                onClick={next}
                className="w-full py-3 px-4 rounded-xl bg-[#C8FF3D] text-[#080A0C] font-bold text-xs hover:bg-[#b8ef2d] transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Apply as Co-Founder for Your Niche</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

            </div>

          </div>

        </div>
      </section>

      {/* ── PORTFOLIO SECTION ────────────────────────────────────────────────── */}
      <section id="portfolio" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#252B32]">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#C8FF3D] font-bold">
              PORTFOLIO ARCHITECTURE
            </span>
            <h2 className="text-2xl sm:text-4xl font-display font-bold text-[#F5F3EA] mt-1">
              Active Software Ventures
            </h2>
          </div>
          <p className="mt-2 md:mt-0 text-xs text-[#969DA6] max-w-sm">
            Real SaaS businesses launched with creators as 50/50 co-founder partnerships.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PORTFOLIO_PRODUCTS.map((prod) => (
            <div
              key={prod.id}
              className="p-5 rounded-2xl bg-[#101419] border border-[#252B32] hover:border-[#363D47] transition-all text-left flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-[#252B32] mb-3">
                  <span className="text-[9px] font-mono text-[#969DA6] uppercase">{prod.category}</span>
                  <span className="text-[9px] font-mono text-[#78E08F]">{prod.badge}</span>
                </div>

                <h3 className="text-base font-display font-bold text-[#F5F3EA] group-hover:text-[#C8FF3D] transition-colors">
                  {prod.title}
                </h3>
                <p className="text-xs font-mono text-[#C8FF3D] mt-0.5">{prod.mrr}</p>
                <p className="text-xs text-[#969DA6] mt-2 leading-relaxed">
                  {prod.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#252B32] text-[11px] font-mono text-[#F5F3EA]">
                {prod.metric}
              </div>
            </div>
          ))}
        </div>

      </section>

      {/* ── FAQ SECTION ──────────────────────────────────────────────────────── */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto border-t border-[#252B32]">
        
        <div className="text-center mb-12">
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#C8FF3D] font-bold">
            FREQUENTLY ASKED QUESTIONS
          </span>
          <h2 className="text-2xl sm:text-4xl font-display font-bold text-[#F5F3EA] mt-1">
            Common Creator Questions
          </h2>
        </div>

        <div className="space-y-3 text-left">
          {FAQS.map((faq, i) => {
            const isOpen = openFaq === i
            return (
              <div
                key={i}
                className="rounded-2xl bg-[#101419] border border-[#252B32] overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : i)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between text-left gap-4 cursor-pointer"
                >
                  <span className="text-sm font-display font-bold text-[#F5F3EA]">{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-[#969DA6] shrink-0 transition-transform ${isOpen ? 'rotate-180 text-[#C8FF3D]' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs text-[#969DA6] leading-relaxed border-t border-[#252B32]/50 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            )
          })}
        </div>

      </section>

      {/* ── CLOSING CTA BANNER ───────────────────────────────────────────────── */}
      <section className="pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="p-8 sm:p-14 rounded-3xl bg-[#0D1014] border border-[#252B32] text-center relative overflow-hidden">
          <div className="max-w-2xl mx-auto relative z-10">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#C8FF3D] font-bold">
              ZERO-CAPITAL 50/50 PARTNERSHIP
            </span>
            <h3 className="text-3xl sm:text-5xl font-display font-bold text-[#F5F3EA] mt-2">
              Ready to engineer your audience software business?
            </h3>
            <p className="mt-3 text-[#969DA6] text-sm leading-relaxed">
              We discover what your audience needs, build your custom SaaS MVP in 14 days, and co-launch the business together.
            </p>

            <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <button
                onClick={next}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#C8FF3D] text-[#080A0C] text-sm font-bold shadow-[0_0_24px_rgba(200,255,61,0.25)] hover:bg-[#b8ef2d] active:scale-[0.98] transition-all cursor-pointer"
              >
                Apply as Creator Co-Founder (50/50) →
              </button>

              <a
                href="/launch"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#171C22] hover:bg-[#252B32] text-[#F5F3EA] border border-[#252B32] text-sm font-mono font-semibold transition-all flex items-center justify-center gap-2"
              >
                <span>Launch Studio OS</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#C8FF3D]" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────────── */}
      <footer className="border-t border-[#252B32] bg-[#080A0C] py-12 text-xs text-[#686F78]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          
          <div className="flex items-center gap-3">
            <CreatorForgeLogo size={18} showText={true} />
            <span className="text-[#252B32]">|</span>
            <span className="text-[#969DA6]">Venture Studio Software Partnerships</span>
          </div>

          <div className="flex items-center gap-6 text-[11px] font-mono">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#78E08F]" />
              <span className="text-[#969DA6]">SYSTEM OPERATIONAL</span>
            </div>
            <span>© {new Date().getFullYear()} CREATOR FORGE STUDIO. ZERO CAPITAL CO-FOUNDERS.</span>
          </div>

        </div>
      </footer>

    </div>
  )
}
