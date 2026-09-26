import React, { useState, useEffect } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Layers,
  Users,
  Target,
  BarChart3,
  DollarSign,
  CheckCircle2,
  Lock,
  Zap,
  ArrowRight,
  Copy,
  Check,
  Palette,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  Monitor
} from "lucide-react";
import DynamicConceptMockup, { BRAND_COLORS, getBrandColorObj } from "./DynamicConceptMockup";

/**
 * CustomizedDeckModal
 * Interactive presentation deck tailored to the creator's audience research, buyer demographics,
 * brand colors, and engineered software product blueprint.
 */
export default function CustomizedDeckModal({
  isOpen,
  concept,
  conceptIndex = 0,
  creator,
  audienceIntelligence,
  onClose,
  onEditConcept
}) {
  if (!isOpen || !concept) return null;

  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeBrandColor, setActiveBrandColor] = useState(
    () => concept.brandColor || BRAND_COLORS[conceptIndex % BRAND_COLORS.length].hex
  );
  const [copiedDeck, setCopiedDeck] = useState(false);

  const brandColorObj = getBrandColorObj(activeBrandColor);
  const accentHex = brandColorObj.hex;

  const creatorName = creator?.name || creator?.display_name || "Creator";
  const firstName = creatorName.split(" ")[0];
  const cHandle = creator?.handle || `@${firstName.toLowerCase()}`;
  const niche = creator?.niche || "Creator Economy";
  const followers = creator?.followerStr || (creator?.follower_count ? `${creator.follower_count.toLocaleString()}` : "250K");

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight") {
        setCurrentSlide((prev) => Math.min(prev + 1, 3));
      } else if (e.key === "ArrowLeft") {
        setCurrentSlide((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const slides = [
    { title: "Opportunity & Partnership", subtitle: "Co-Founder Venture Blueprint" },
    { title: "Audience & Demographics", subtitle: "Verified Research Signals" },
    { title: "Software Blueprint", subtitle: "MVP Architecture & Features" },
    { title: "Commercials & Roadmap", subtitle: "Unit Economics & Launch Plan" }
  ];

  const handleCopyDeckSummary = () => {
    const summary = `
# Customized Software Deck: ${concept.name}
**Creator:** ${creatorName} (${cHandle}) — ${followers} followers in ${niche}
**Opportunity Score:** ${concept.opportunityScore || 95}/100
**Brand Theme:** ${brandColorObj.name} (${accentHex})

## 1. Audience & Demographic Evidence
- Demographics: ${concept.demographicAlignment || audienceIntelligence?.demographics?.description || "High purchasing power"}
- Audience Pain: ${concept.problem || audienceIntelligence?.painPoints?.description}
- Community Evidence: "${concept.audienceEvidence || audienceIntelligence?.recurringQuestions?.quote}"

## 2. Product Blueprint
- Tagline: ${concept.tagline}
- Target Customer: ${concept.customer}
- Core MVP Features:
${(concept.keyFeatures || []).map((f) => `  - ${f}`).join("\n")}

## 3. Commercial Model (50/50 Co-Founder Venture)
- Pricing: ${concept.pricing}
- Projected MRR: ${concept.mockup?.primaryMetric || "$22.5K MRR"}
- Active Users: ${concept.mockup?.activeMetric || "850"}
- Retention: ${concept.mockup?.efficiencyMetric || "94%"}
- MVP Timeline: ${concept.mvpDifficulty || "2 weeks"}
    `.trim();

    navigator.clipboard.writeText(summary);
    setCopiedDeck(true);
    setTimeout(() => setCopiedDeck(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0A0E17] text-white rounded-3xl border border-slate-800 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden relative">
        {/* Top Deck Navigation Bar */}
        <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/60 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            {creator?.avatar ? (
              <img src={creator.avatar} alt="" className="w-8 h-8 rounded-full border border-slate-700 object-cover" />
            ) : (
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shadow-xs"
                style={{ backgroundColor: accentHex }}
              >
                {firstName[0]}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white font-display">
                  {creatorName} • Customized Opportunity Deck
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Slide {currentSlide + 1} of {slides.length}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {slides[currentSlide].title} — <span className="text-slate-300 font-medium">{slides[currentSlide].subtitle}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Brand Color Quick Switcher */}
            <div className="hidden sm:flex items-center gap-1 bg-slate-900/90 px-2 py-1 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold mr-1 flex items-center gap-1">
                <Palette className="w-3 h-3 text-emerald-400" /> Theme:
              </span>
              {BRAND_COLORS.slice(0, 5).map((bc) => (
                <button
                  key={bc.name}
                  type="button"
                  onClick={() => setActiveBrandColor(bc.hex)}
                  className={`w-4 h-4 rounded-full transition-transform cursor-pointer ${
                    activeBrandColor.toLowerCase() === bc.hex.toLowerCase() ? "scale-125 ring-2 ring-white" : "opacity-60 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: bc.hex }}
                  title={`${bc.name} Theme`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={handleCopyDeckSummary}
              className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-bold text-slate-300 transition-colors flex items-center gap-1 cursor-pointer"
              title="Copy markdown outline of deck"
            >
              {copiedDeck ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span className="hidden sm:inline">{copiedDeck ? "Copied" : "Copy Deck"}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Slide Progress Indicator Pills */}
        <div className="grid grid-cols-4 gap-2 px-6 pt-3 pb-1 bg-slate-950/40 border-b border-slate-800/40">
          {slides.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentSlide(idx)}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                idx === currentSlide
                  ? "bg-white shadow-xs"
                  : idx < currentSlide
                  ? "bg-slate-600"
                  : "bg-slate-800"
              }`}
              style={idx === currentSlide ? { backgroundColor: accentHex } : {}}
              title={s.title}
            />
          ))}
        </div>

        {/* Slide Canvas Area */}
        <div className="p-6 sm:p-8 flex-1 overflow-y-auto">
          {/* SLIDE 1: Executive Opportunity & Co-Founder Venture Deck */}
          {currentSlide === 0 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 relative overflow-hidden">
                <div className="space-y-2 relative z-10">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold font-mono border"
                    style={{
                      color: accentHex,
                      backgroundColor: `${accentHex}15`,
                      borderColor: `${accentHex}30`
                    }}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Creator Forge 50/50 Co-Founder Venture</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {concept.name}
                  </h1>
                  <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
                    {concept.tagline}
                  </p>
                  <p className="text-xs text-slate-400 font-mono">
                    Engineered exclusively for {creatorName} ({cHandle}) • {followers} Followers in {niche}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-black/60 border border-slate-800 text-center space-y-1 sm:w-48 flex-shrink-0">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
                    Opportunity Score
                  </span>
                  <span className="text-3xl font-black font-mono" style={{ color: accentHex }}>
                    {concept.opportunityScore || 96}/100
                  </span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800 block">
                    Verified Demand
                  </span>
                </div>
              </div>

              {/* 3 Value Pillars */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${accentHex}20` }}>
                    <DollarSign className="w-4 h-4" style={{ color: accentHex }} />
                  </div>
                  <h4 className="text-xs font-bold text-white">100% Studio Funded</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Zero financial risk or code required from {firstName}. Our venture studio funds the complete design, engineering, and cloud infrastructure.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-800/80 border border-slate-700">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  </div>
                  <h4 className="text-xs font-bold text-white">50/50 Co-Founder Split</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Equal 50/50 revenue and equity partnership. You bring your trusted audience; we bring world-class SaaS engineering and ops.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-cyan-500/20">
                    <Zap className="w-4 h-4 text-cyan-400" />
                  </div>
                  <h4 className="text-xs font-bold text-white">Rapid 2-3 Week MVP</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Ready-to-launch MVP software shipped in 14-21 days so {firstName} can start generating recurring MRR immediately.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 2: Audience & Demographic Research */}
          {currentSlide === 1 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-400" />
                  <span>Verified Audience Demographics & Research Signals</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Why this specific software concept converts {creatorName}&apos;s community at high margins
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Demographic & Buyer Persona */}
                <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                      <Target className="w-4 h-4 text-indigo-400" />
                      <span>Buyer Demographics</span>
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                      High Purchasing Power
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {concept.demographicAlignment || audienceIntelligence?.demographics?.description ||
                      "Predominantly 22-42 year-old ambitious professionals, creators, and agency owners with high digital purchasing power."}
                  </p>
                  <div className="p-2.5 rounded-xl bg-black/40 border border-slate-800 text-[11px] text-slate-400 font-mono">
                    Budget Tier: Tier-1 US/UK/EU audience with recurring software spend
                  </div>
                </div>

                {/* Comment Analysis & Core Pain Point */}
                <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <span>Verified Community Pain Point</span>
                    </span>
                    <span className="text-[10px] font-mono text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800">
                      450+ Inquiries
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed italic">
                    "{concept.audienceEvidence || audienceIntelligence?.recurringQuestions?.quote ||
                      "How can I automate my workflow without paying thousands for fragmented tools?"}"
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {concept.problem || audienceIntelligence?.painPoints?.description}
                  </p>
                </div>

                {/* Existing Monetization vs Uncapped SaaS */}
                <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span>Monetization Opportunity</span>
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Currently relying on ad revenue and sponsor deals. A dedicated SaaS product transforms passive viewers into high-retention monthly recurring revenue (MRR).
                  </p>
                </div>

                {/* Unfair Distribution Moat */}
                <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                    <span>Zero-CAC Distribution Moat</span>
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Direct access to {followers} loyal followers generates immediate day-1 paying users with zero paid advertising expense.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 3: Software Blueprint & Mockup */}
          {currentSlide === 2 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                {/* Left: Dynamic High-Res Mockup Window */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Monitor className="w-4 h-4" style={{ color: accentHex }} />
                      <span>Interactive Software Mockup</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      Branded with {creatorName}&apos;s identity
                    </span>
                  </div>
                  <DynamicConceptMockup
                    concept={{ ...concept, brandColor: activeBrandColor }}
                    creator={creator}
                    conceptIndex={conceptIndex}
                  />
                </div>

                {/* Right: Architecture & Core Features */}
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                      Software Architecture
                    </span>
                    <h3 className="text-xl font-bold text-white mt-1">
                      {concept.name}
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {concept.description || concept.tagline}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-200 block">
                      Core MVP Features:
                    </span>
                    <div className="space-y-1.5">
                      {(concept.keyFeatures || []).map((feat, fi) => (
                        <div key={fi} className="flex items-start gap-2 text-xs text-slate-300 bg-slate-900/60 p-2 rounded-xl border border-slate-800">
                          <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: accentHex }} />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {onEditConcept && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onEditConcept(concept);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-white transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Edit Concept Details</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 4: Commercials, Unit Economics & 3-Week Launch Plan */}
          {currentSlide === 3 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 text-center space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
                    Projected Month-1 MRR
                  </span>
                  <span className="text-2xl font-black font-mono text-emerald-400">
                    {concept.mockup?.primaryMetric || "$22.5K"}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    Based on 1.8% conversion of {followers} followers
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 text-center space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
                    Target Active Users
                  </span>
                  <span className="text-2xl font-black font-mono text-slate-200">
                    {concept.mockup?.activeMetric || "850"}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    Initial cohort capacity
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 text-center space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
                    Pricing Tiers
                  </span>
                  <span className="text-sm font-bold font-mono text-cyan-300 block truncate pt-1">
                    {concept.pricing || "$29/mo • $79/mo"}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    50/50 Net Profit Distribution
                  </span>
                </div>
              </div>

              {/* 3-Week Roadmap */}
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>3-Week Go-To-Market Execution Plan</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="p-3 rounded-xl bg-black/40 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-mono font-bold text-slate-400 block">Week 1: Build & Deploy</span>
                    <p className="text-[11px] text-slate-300">
                      Studio engineers deploy responsive web app, auth, and Stripe billing.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-black/40 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-mono font-bold text-emerald-400 block">Week 2: VIP Alpha</span>
                    <p className="text-[11px] text-slate-300">
                      Private beta roll-out to top 100 power followers for feedback & testimonials.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-black/40 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-mono font-bold text-emerald-400 block">Week 3: Public Launch</span>
                    <p className="text-[11px] text-slate-300">
                      Co-launch video & announcement across {creator?.platform || "YouTube"} community.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Slide Controller Footer */}
        <div className="px-6 py-4 border-t border-slate-800/80 bg-slate-950/80 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setCurrentSlide((prev) => Math.max(prev - 1, 0))}
            disabled={currentSlide === 0}
            className="px-3.5 py-1.5 rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 cursor-pointer text-xs font-bold"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <div className="flex items-center gap-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentSlide(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                  idx === currentSlide ? "w-6 bg-white" : "bg-slate-700 hover:bg-slate-500"
                }`}
                style={idx === currentSlide ? { backgroundColor: accentHex } : {}}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              if (currentSlide < slides.length - 1) {
                setCurrentSlide((prev) => prev + 1);
              } else {
                onClose();
              }
            }}
            className="px-4 py-1.5 rounded-xl text-slate-900 font-bold hover:opacity-95 transition-all flex items-center gap-1.5 cursor-pointer text-xs shadow-md"
            style={{ backgroundColor: accentHex }}
          >
            <span>{currentSlide === slides.length - 1 ? "Close Deck" : "Next Slide"}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
