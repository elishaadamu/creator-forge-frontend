import { useState } from 'react'
import {
  Sparkles,
  Users,
  Target,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  FileText,
  DollarSign,
  Rocket,
  CheckCircle2,
  Clock,
  Send,
  Layers,
  ExternalLink,
  ChevronRight,
  X,
  Copy,
  Check,
  Zap,
  Calendar,
  Sun
} from 'lucide-react'
import FloatingPolygons from '../ui/FloatingPolygons'

export default function LaunchStudioHero({
  onStartDiscovery,
  onOpenCRM,
  creatorsCount = 12,
  qualifiedCount = 8,
  outreachCount = 3,
  activeProjectsCount = 1
}) {
  const [showArtifactModal, setShowArtifactModal] = useState(false)
  const [selectedArtifactTab, setSelectedArtifactTab] = useState('agreement') // 'agreement' | 'blueprint' | 'demand'
  const [copiedKey, setCopiedKey] = useState(null)

  const handleCopy = (key, text) => {
    navigator.clipboard?.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const currentDateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  return (
    <div className="w-full space-y-4">
      {/* ── Top Hero Card with S1 Organic Mask & S2/S3 Studio Aesthetic ── */}
      <div className="relative rounded-3xl bg-white border border-slate-200/90 p-5 sm:p-7 md:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.03)] overflow-hidden">
        {/* Subtle Ambient Conic Glow */}
        <div
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full pointer-events-none opacity-25 blur-3xl -z-10"
          style={{
            background: 'conic-gradient(from 0deg at 50% 50%, #BEF264 0deg, #A3E635 60deg, #34D399 180deg, #84CC16 270deg, #BEF264 360deg)'
          }}
        />

        {/* Ambient Subtle Dot Grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-30 -z-10"
          style={{
            backgroundImage: 'radial-gradient(#94A3B8 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}
        />

        {/* Floating Geometric Polygons (Landing Page Style) */}
        <FloatingPolygons variant="section" />

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center relative z-10">
          {/* Left Column: Greeting, Title, Description, Landing Page Buttons */}
          <div className="lg:col-span-7 flex flex-col items-start text-left space-y-4">
            {/* S2-style Greeting & Date Bar */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 shadow-2xs">
              <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="font-semibold text-slate-900">Good morning, Operator</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 font-mono text-[11px]">{currentDateStr}</span>
            </div>

            {/* Main Headline */}
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-extrabold text-slate-950 tracking-tight leading-[1.1]">
                Turn Creator Audiences into Production Software Products
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xl">
                Identify top creators, synthesize high-retention software opportunities, and launch real SaaS products.
                We engineer, host, and scale the apps. Creators split net profits <strong className="text-slate-900">50/50</strong> with <strong className="text-slate-900">$0 upfront cost</strong>.
              </p>
            </div>

            {/* Quick Feature Badges (Human, Less AI) */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-semibold font-mono text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>14-Day Delivery SLA</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 font-semibold font-mono text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-700" />
                <span>Creator 100% IP Ownership</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 font-semibold font-mono text-[11px]">
                <Zap className="w-3.5 h-3.5 text-amber-600" />
                <span>Automated Stripe 50/50 Split</span>
              </span>
            </div>

            {/* Action Row: Landing Page Style Button with Beacon + Artifact Trigger */}
            <div className="flex flex-wrap items-center gap-3 pt-2 w-full sm:w-auto">
              {/* Primary Signature Button with Beacon (Landing Page Style) */}
              <button
                type="button"
                onClick={onStartDiscovery}
                className="relative inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs sm:text-sm font-bold shadow-[0_4px_16px_rgba(15,23,42,0.18)] hover:shadow-[0_8px_24px_rgba(15,23,42,0.28)] hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200 cursor-pointer select-none group"
              >
                <span>Discover Creator Leads</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                {/* Signature Top-Right Accent Beacon Dot */}
                <span className="absolute -top-1 -right-1 flex h-3 w-3 pointer-events-none items-center justify-center">
                  <span className="absolute inline-flex h-4 w-4 rounded-full bg-emerald-400/30 blur-[1px]" />
                  <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 border border-white" />
                </span>
              </button>

              {/* Browse Artifacts Button */}
              <button
                type="button"
                onClick={() => setShowArtifactModal(true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-2xs hover:border-slate-400"
              >
                <FileText className="w-3.5 h-3.5 text-slate-600" />
                <span>View Co-Launch Artifacts</span>
              </button>

              {/* View CRM Directory Button */}
              <button
                type="button"
                onClick={onOpenCRM}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-slate-600 hover:text-slate-950 text-xs font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <Users className="w-3.5 h-3.5 text-slate-500" />
                <span>Open CRM</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Right Column: S1 Masked Creator Image & Live Telemetry Badges */}
          <div className="lg:col-span-5 relative flex items-center justify-center pt-4 lg:pt-0">
            <div className="relative w-full max-w-[340px] sm:max-w-[400px] flex items-center justify-center">
              {/* Organic S1 Mask Container with Real Creator Desk Image */}
              <div className="relative w-full aspect-square flex items-center justify-center group">
                <img
                  src="/images/creator_desk_mask.png"
                  alt="Creator at Desk with Tablet and Color Swatches (Human Co-Founder)"
                  className="w-full h-auto max-h-[340px] object-contain drop-shadow-[0_20px_40px_rgba(15,23,42,0.12)] transition-transform duration-500 group-hover:scale-[1.02]"
                />

                {/* S2/S3 Telemetry Badge 1: Top Right */}
                <div className="absolute -top-2 -right-2 sm:-right-4 p-2.5 sm:p-3 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-xl text-left hidden sm:block animate-float-gentle z-20">
                  <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-500 mb-0.5 font-bold uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>MONTHLY CREATOR REVENUE</span>
                  </div>
                  <div className="text-sm sm:text-base font-display font-extrabold text-slate-950 font-mono">
                    $38,400 <span className="text-[11px] text-emerald-600 font-semibold font-sans">+18.4% MoM</span>
                  </div>
                  <span className="text-[9px] font-mono text-slate-500 block mt-0.5">Automated 50/50 Stripe Split</span>
                </div>

                {/* S2/S3 Telemetry Badge 2: Bottom Left */}
                <div className="absolute -bottom-2 -left-2 sm:-left-4 p-2.5 sm:p-3 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-xl text-left hidden sm:block animate-float-reverse z-20">
                  <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-500 mb-0.5 font-bold uppercase tracking-wider">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>14-DAY CO-LAUNCH SLA</span>
                  </div>
                  <div className="text-xs sm:text-sm font-display font-bold text-slate-900">
                    Production SaaS Deployed
                  </div>
                  <span className="text-[9px] font-mono text-slate-500 block mt-0.5">$0 Engineering Cost to Creator</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── S2 & S3 Style 4-Metric Stats Cards Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Total Leads Discovered */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-sm transition-all text-left">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Total Leads Discovered</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-display font-extrabold text-slate-950 font-mono">
            {creatorsCount}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-600 font-semibold font-mono">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>↑ 3 new this cycle</span>
          </div>
        </div>

        {/* Metric 2: AI Qualified & Interested */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-sm transition-all text-left">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Qualified & Interested</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-display font-extrabold text-slate-950 font-mono">
            {qualifiedCount}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-700 font-medium font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Step 5 Synthesized</span>
          </div>
        </div>

        {/* Metric 3: Outreach Messages Dispatched */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-sm transition-all text-left">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Outreach Dispatched</span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-display font-extrabold text-slate-950 font-mono">
            {outreachCount}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 font-mono">
            <span>Inbound replies synced</span>
          </div>
        </div>

        {/* Metric 4: Active 50/50 Co-Launches */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-sm transition-all text-left">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">50/50 Co-Launches</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center">
              <Rocket className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-display font-extrabold text-slate-950 font-mono">
            {activeProjectsCount}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-amber-700 font-semibold font-mono">
            <span>Phase 1: Validation live</span>
          </div>
        </div>
      </div>

      {/* ── Co-Launch Artifacts Modal ── */}
      {showArtifactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div
            className="fixed inset-0"
            onClick={() => setShowArtifactModal(false)}
          />
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden z-10 animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#0F172A] text-white flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-950">Creator Forge Co-Launch Artifacts</h3>
                  <p className="text-xs text-slate-500">Tangible deliverables, partnership contracts & software blueprints</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowArtifactModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* S2/S3 Pill Navigation Bar */}
            <div className="px-6 py-3 border-b border-slate-100 flex items-center gap-2 bg-white overflow-x-auto">
              {[
                { id: 'agreement', label: '1. 50/50 Venture Agreement', icon: ShieldCheck },
                { id: 'blueprint', label: '2. Software Architecture Blueprint', icon: Layers },
                { id: 'demand', label: '3. Audience Signal Synthesis', icon: Sparkles }
              ].map((tab) => {
                const Icon = tab.icon
                const isActive = selectedArtifactTab === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSelectedArtifactTab(tab.id)}
                    className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-[#0F172A] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Artifact Content Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-left">
              {/* TAB 1: 50/50 Venture Agreement */}
              {selectedArtifactTab === 'agreement' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                        LEGAL CO-FOUNDER CONTRACT TEMPLATE
                      </span>
                      <span className="text-xs font-mono text-slate-500 font-bold">Standard Form CF-5050-v3</span>
                    </div>
                    <h4 className="text-base font-bold text-slate-900 font-display">
                      50/50 Creator Software Partnership & Revenue Split Agreement
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Binding venture studio terms between Creator Forge (Engineering Co-Founder) and the Partner Creator (Distribution Co-Founder).
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1">
                      <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Term 1: Zero Upfront Cost ($0)</span>
                      </span>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        Creator Forge covers 100% of engineering development, server hosting, databases, AI inference, and maintenance costs.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1">
                      <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Term 2: 50/50 Automated Revenue Split</span>
                      </span>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        Every dollar paid by subscribers is split 50/50 instantly at the Stripe Connect payment gateway level on the 1st of every month.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1">
                      <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Term 3: 100% Creator IP Ownership</span>
                      </span>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        The creator retains full 100% ownership of their brand, likeness, subscriber email lists, and audience relationship forever.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1">
                      <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Term 4: 14-Day Delivery SLA</span>
                      </span>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        From proposal confirmation to production launch with live payment checkout takes no more than 14 calendar days.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Software Architecture Blueprint */}
              {selectedArtifactTab === 'blueprint' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-800 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-full">
                      FULL-STACK PRODUCTION BLUEPRINT
                    </span>
                    <h4 className="text-base font-bold text-slate-900 font-display">
                      Autonomous Production SaaS Stack
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Every creator software product is generated with a production architecture ready for thousands of paying monthly users.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                      <span className="font-bold text-slate-900 font-mono text-[11px] block">Frontend Client</span>
                      <p className="text-slate-600 text-[11px]">Next.js / React 19 with Tailwind CSS, Mobile-Responsive Viewports, and WebP asset optimization.</p>
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                      <span className="font-bold text-slate-900 font-mono text-[11px] block">Backend Engine</span>
                      <p className="text-slate-600 text-[11px]">Python FastAPI with async endpoints, rate limiting, and SQLite/PostgreSQL cloud syncing.</p>
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                      <span className="font-bold text-slate-900 font-mono text-[11px] block">Billing & Payouts</span>
                      <p className="text-slate-600 text-[11px]">Stripe Checkout, Customer Portal, Webhook listeners, and automated 50/50 Stripe Connect transfers.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: Audience Signal Synthesis */}
              {selectedArtifactTab === 'demand' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                      AUDIENCE PROBLEM MINING ENGINE
                    </span>
                    <h4 className="text-base font-bold text-slate-900 font-display">
                      Audience Signal & Willingness-to-Pay Extraction
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      We analyze comments, community questions, and recurring inquiries to build apps that fans already want to buy.
                    </p>
                  </div>

                  <div className="space-y-2 text-xs">
                    {[
                      { problem: "Fans constantly asking 'What camera/gear are you using in this video?'", app: "GearVault OS (Affiliate + 1-Click Equipment Inventory)", creator: "Tech & Production Creators" },
                      { problem: "Hundreds of sponsor emails with low offers or messy tracking", app: "SponsorFlow CRM (Automated Rate Calculator & Contract Signing)", creator: "Productivity & Lifestyle Creators" },
                      { problem: "Long 3-hour podcast episodes where fans can't find specific discussions", app: "Podcast Semantics Search (Instant Timestamp & Audio Quote Match)", creator: "Interview & Science Podcasters" }
                    ].map((item, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">{item.creator}</span>
                          <p className="font-semibold text-slate-900">{item.problem}</p>
                        </div>
                        <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/80 whitespace-nowrap shrink-0">
                          → {item.app}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
              <span className="text-xs text-slate-500 font-mono">
                Creator Forge Studio OS • 100% Managed Co-Launch
              </span>
              <button
                type="button"
                onClick={() => setShowArtifactModal(false)}
                className="px-4 py-2 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                Close Artifacts
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
