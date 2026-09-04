import { useState, useEffect, useMemo } from "react";
import {
  Radio,
  Activity,
  Mail,
  Cpu,
  Award,
  Search,
  Youtube,
  Instagram,
  Music,
  XCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";

const SCOUTING_STAGES = [
  {
    id: "audience_scout",
    title: "Multi-Platform Audience Scouting",
    badge: "API Stream Scan",
    description: "Querying channel registries, subscriber velocity, and recent upload trends...",
    icon: Radio,
    color: "from-indigo-500 to-purple-500",
    textColor: "text-indigo-400",
    borderColor: "border-indigo-500/40",
    bgTint: "bg-indigo-500/10",
    progress: 22,
  },
  {
    id: "engagement_filter",
    title: "Retention & Engagement Analysis",
    badge: "Metric Filter ≥3.5%",
    description: "Filtering true organic views, comment frequency, and community sentiment...",
    icon: Activity,
    color: "from-cyan-500 to-blue-500",
    textColor: "text-cyan-400",
    borderColor: "border-cyan-500/40",
    bgTint: "bg-cyan-500/10",
    progress: 44,
  },
  {
    id: "contact_extraction",
    title: "Business Contact & MX DNS Verification",
    badge: "Email Intelligence",
    description: "Scouting direct business inquiries, agency reps, and validating mailboxes...",
    icon: Mail,
    color: "from-emerald-500 to-teal-500",
    textColor: "text-emerald-400",
    borderColor: "border-emerald-500/40",
    bgTint: "bg-emerald-500/10",
    progress: 68,
  },
  {
    id: "ai_monetization",
    title: "AI Co-Founder Software Model Fit",
    badge: "SaaS Opportunity Fit",
    description: "Analyzing audience demographics to architect tailored micro-SaaS tools...",
    icon: Cpu,
    color: "from-purple-500 to-pink-500",
    textColor: "text-purple-400",
    borderColor: "border-purple-500/40",
    bgTint: "bg-purple-500/10",
    progress: 86,
  },
  {
    id: "score_qualification",
    title: "Lead Qualification & Final Ranking",
    badge: "Score Gate ≥85",
    description: "Calculating Creator Score, commercial authority, and structuring outreach...",
    icon: Award,
    color: "from-amber-500 to-orange-500",
    textColor: "text-amber-400",
    borderColor: "border-amber-500/40",
    bgTint: "bg-amber-500/10",
    progress: 96,
  },
];

const PLATFORMS = [
  { name: "YouTube", icon: Youtube, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30" },
  { name: "Instagram", icon: Instagram, color: "text-pink-400", bg: "bg-pink-500/10", border: "border-pink-500/30" },
  { name: "TikTok", icon: Music, color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/30" },
  { name: "X / Twitter", icon: Sparkles, color: "text-slate-200", bg: "bg-white/10", border: "border-white/20" },
];

const MOCK_CANDIDATE_POOLS = [
  { handle: "@tech_nexus", platform: "YouTube", subs: "480K", eng: "5.2%", score: 94, niche: "Tech & SaaS", email: "contact@technexus.io" },
  { handle: "@fit_velocity", platform: "Instagram", subs: "260K", eng: "6.1%", score: 91, niche: "Fitness & Health", email: "business@fitvelocity.co" },
  { handle: "@code_artisan", platform: "YouTube", subs: "320K", eng: "4.8%", score: 89, niche: "Software & Dev", email: "jordan@artisanmedia.com" },
  { handle: "@gameforge_tv", platform: "TikTok", subs: "710K", eng: "7.4%", score: 95, niche: "Gaming & AI", email: "mgmt@gameforge.gg" },
  { handle: "@creator_hq", platform: "Instagram", subs: "195K", eng: "5.6%", score: 92, niche: "Productivity", email: "hello@creatorhq.studio" },
  { handle: "@cloud_architect", platform: "YouTube", subs: "530K", eng: "4.5%", score: 90, niche: "DevOps & Cloud", email: "alex@cloudarch.dev" },
];

export default function ScoutingCyclingAnimation({
  targetCount = 3,
  foundCount = 0,
  niches = ["Tech", "Software"],
  selectedPlatforms = ["YouTube", "Instagram"],
  onStopScouting,
  compact = false,
}) {
  const [stageIndex, setStageIndex] = useState(0);
  const [platformIndex, setPlatformIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [channelsEvaluated, setChannelsEvaluated] = useState(14);
  const [activeBlipIndex, setActiveBlipIndex] = useState(0);

  // 1. Elapsed timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Cycling scouting stages every 2.4s
  useEffect(() => {
    const stageTimer = setInterval(() => {
      setStageIndex((prev) => (prev + 1) % SCOUTING_STAGES.length);
    }, 2400);
    return () => clearInterval(stageTimer);
  }, []);

  // 3. Cycling platform scanner highlight every 1.5s
  useEffect(() => {
    const platTimer = setInterval(() => {
      setPlatformIndex((prev) => (prev + 1) % PLATFORMS.length);
    }, 1500);
    return () => clearInterval(platTimer);
  }, []);

  // 4. Dynamically ticking evaluated channels counter
  useEffect(() => {
    const evalTimer = setInterval(() => {
      setChannelsEvaluated((prev) => prev + Math.floor(Math.random() * 3) + 1);
      setActiveBlipIndex((prev) => (prev + 1) % 6);
    }, 900);
    return () => clearInterval(evalTimer);
  }, []);

  const currentStage = SCOUTING_STAGES[stageIndex];
  const currentPlatform = PLATFORMS[platformIndex];

  const formatElapsed = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // 6 radar blips with calculated trigonometry
  const radarBlips = useMemo(() => [
    { x: 30, y: 35, platform: "YouTube", color: "bg-red-400" },
    { x: 72, y: 28, platform: "Instagram", color: "bg-pink-400" },
    { x: 25, y: 70, platform: "TikTok", color: "bg-cyan-400" },
    { x: 68, y: 65, platform: "YouTube", color: "bg-red-400" },
    { x: 50, y: 22, platform: "X", color: "bg-white" },
    { x: 80, y: 80, platform: "Instagram", color: "bg-pink-400" },
  ], []);

  // Current rotating stream of 3 candidate previews
  const activeCandidates = useMemo(() => {
    const start = (stageIndex + Math.floor(elapsedSeconds / 3)) % MOCK_CANDIDATE_POOLS.length;
    return [
      MOCK_CANDIDATE_POOLS[start % MOCK_CANDIDATE_POOLS.length],
      MOCK_CANDIDATE_POOLS[(start + 1) % MOCK_CANDIDATE_POOLS.length],
      MOCK_CANDIDATE_POOLS[(start + 2) % MOCK_CANDIDATE_POOLS.length],
    ];
  }, [stageIndex, elapsedSeconds]);

  // If compact mode is requested (e.g. pinned above existing creators grid)
  if (compact) {
    return (
      <div className="relative rounded-2xl bg-[#0b0e14]/90 border border-indigo-500/40 p-4 shadow-xl backdrop-blur-md overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-cyan-500/5 to-purple-500/5 pointer-events-none" />
        <div className="flex items-center gap-3 relative z-10">
          <div className="relative w-10 h-10 rounded-full border border-indigo-500/40 bg-indigo-950/50 flex items-center justify-center flex-shrink-0">
            <div className="absolute inset-0 rounded-full border border-cyan-400/50 animate-radar-ping-slow" />
            <Radio className="w-5 h-5 text-indigo-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Autonomous Scouting Active
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono border border-indigo-500/30">
                {formatElapsed(elapsedSeconds)}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Current Phase: <strong className="text-cyan-300">{currentStage.title}</strong> · {channelsEvaluated}+ channels evaluated
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs font-mono text-slate-300">
            <span>Target: {foundCount} / {targetCount}</span>
          </div>
          {onStopScouting && (
            <button
              type="button"
              onClick={onStopScouting}
              className="px-3.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <XCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>Stop Scouting ({foundCount} Found)</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative rounded-3xl bg-[#090c13] border border-indigo-500/30 p-5 sm:p-7 shadow-2xl overflow-hidden backdrop-blur-xl">
      {/* Dynamic Background Ambient Shimmer */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Laser Scanning Bar */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-scan-beam-vertical opacity-80 pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-4 mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center flex-shrink-0 shadow-inner">
            <Radio className="w-4 h-4 text-indigo-400 animate-pulse" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#090c13] animate-ping" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                Creator Discovery Radar
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Live Scouting
                </span>
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Scouting {targetCount} high-fit creators across <strong className="text-slate-200">[{niches.join(", ")}]</strong>
            </p>
          </div>
        </div>

        {/* Telemetry Pills & Stop Scouting Button */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/40 border border-white/[0.08] text-xs font-mono text-slate-300">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>Elapsed: <strong className="text-white">{formatElapsed(elapsedSeconds)}</strong></span>
          </div>

          <div className="hidden lg:flex items-center gap-1 px-3 py-1.5 rounded-xl bg-black/40 border border-white/[0.08] text-xs">
            <span className="text-slate-400 text-[11px]">Platform:</span>
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md font-medium text-[11px] ${currentPlatform.bg} ${currentPlatform.color} border ${currentPlatform.border} transition-all`}>
              <currentPlatform.icon className="w-3 h-3" />
              <span>{currentPlatform.name}</span>
            </div>
          </div>

          {onStopScouting && (
            <button
              type="button"
              onClick={onStopScouting}
              className="px-3.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95 whitespace-nowrap"
              title="Halt autonomous scouting and inspect creators found so far"
            >
              <XCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>Stop Scouting ({foundCount} Found)</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Radar & Live Intelligence Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10 items-center">
        {/* Left Column: Tactical Circular Radar Dish (5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-4 rounded-2xl bg-black/40 border border-white/[0.06] relative overflow-hidden">
          <div className="relative w-60 h-60 sm:w-64 sm:h-64 flex items-center justify-center">
            {/* Radar Background Grids */}
            <div className="absolute inset-0 rounded-full border border-indigo-500/25 bg-gradient-to-b from-[#080d1a] to-[#04060c] shadow-inner" />
            <div className="absolute inset-6 rounded-full border border-indigo-500/20" />
            <div className="absolute inset-14 rounded-full border border-indigo-500/15" />
            <div className="absolute inset-22 rounded-full border border-indigo-500/10" />

            {/* Radar Crosshairs */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-full h-[1px] bg-indigo-500/20" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="h-full w-[1px] bg-indigo-500/20" />
            </div>

            {/* Polar Coordinate Markers */}
            <span className="absolute top-1 text-[9px] font-mono text-indigo-400/60 uppercase">000° N</span>
            <span className="absolute right-2 text-[9px] font-mono text-indigo-400/60 uppercase">090° E</span>
            <span className="absolute bottom-1 text-[9px] font-mono text-indigo-400/60 uppercase">180° S</span>
            <span className="absolute left-2 text-[9px] font-mono text-indigo-400/60 uppercase">270° W</span>

            {/* 360° Rotating Radar Sweep Line with Trailing Beam */}
            <div
              className="absolute inset-0 rounded-full pointer-events-none animate-radar-sweep"
              style={{
                background:
                  "conic-gradient(from 0deg, rgba(99, 102, 241, 0.45) 0deg, rgba(6, 182, 212, 0.25) 30deg, transparent 65deg, transparent 360deg)",
              }}
            />

            {/* Pulsing Sonar Rings */}
            <div className="absolute inset-10 rounded-full border border-cyan-400/40 animate-radar-ping-slow pointer-events-none" />

            {/* Radar Center Transmitter Hub */}
            <div className="relative w-8 h-8 rounded-full bg-indigo-600/40 border border-indigo-400 flex items-center justify-center shadow-lg z-20">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-ping" />
            </div>

            {/* Target Blip Dots */}
            {radarBlips.map((blip, i) => {
              const isActive = i === activeBlipIndex;
              return (
                <div
                  key={i}
                  className="absolute z-10 transition-all duration-300"
                  style={{ top: `${blip.y}%`, left: `${blip.x}%` }}
                >
                  <div className="relative flex items-center justify-center">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${blip.color} ${
                        isActive ? "scale-150 shadow-[0_0_12px_#fff]" : "opacity-80"
                      } transition-transform`}
                    />
                    {isActive && (
                      <span className="absolute -inset-2 rounded-full border border-cyan-300 animate-ping pointer-events-none" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Radar Status Readout */}
          <div className="mt-3 text-center">
            <div className="flex items-center justify-center gap-2 text-[11px] font-mono text-cyan-300">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>SWEEP 120 RPM · RADAR RANGE 50K-2.5M</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
              EVALUATING PUBLIC FEEDS & MX HOSTS
            </div>
          </div>
        </div>

        {/* Right Column: Cycling Scouting Stages & Live Candidate Stream (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Active Cycling Stage Hero Card */}
          <div className={`p-4 rounded-2xl bg-gradient-to-r from-white/[0.04] to-white/[0.01] border ${currentStage.borderColor} transition-all duration-500 relative overflow-hidden shadow-lg`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl ${currentStage.bgTint} border ${currentStage.borderColor} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                  <currentStage.icon className={`w-5 h-5 ${currentStage.textColor} animate-pulse`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-slate-300 border border-white/10">
                      Phase {stageIndex + 1} of {SCOUTING_STAGES.length}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${currentStage.bgTint} ${currentStage.textColor} border ${currentStage.borderColor}`}>
                      {currentStage.badge}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white mt-1">
                    {currentStage.title}
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {currentStage.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Animated Progress Bar */}
            <div className="mt-3 pt-3 border-t border-white/[0.06]">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
                <span>Phase Readiness</span>
                <span className={currentStage.textColor}>{currentStage.progress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-black/60 overflow-hidden border border-white/[0.06]">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${currentStage.color} animate-gradient-flow transition-all duration-700`}
                  style={{ width: `${currentStage.progress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Telemetry Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-2.5 rounded-xl bg-black/40 border border-white/[0.06] text-center">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-mono block">
                Evaluated
              </span>
              <span className="text-sm font-bold text-cyan-300 font-mono">
                {channelsEvaluated}+
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-black/40 border border-white/[0.06] text-center">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-mono block">
                Target Batch
              </span>
              <span className="text-sm font-bold text-indigo-300 font-mono">
                {foundCount} / {targetCount}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-black/40 border border-white/[0.06] text-center">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-mono block">
                Email Match
              </span>
              <span className="text-sm font-bold text-emerald-300 font-mono">
                92.4%
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-black/40 border border-white/[0.06] text-center">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-mono block">
                Avg Fit Score
              </span>
              <span className="text-sm font-bold text-amber-300 font-mono">
                91/100
              </span>
            </div>
          </div>

          {/* Real-time Candidate Stream Feed */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] text-slate-300">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                Live Candidate Vetting Stream
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Qualifying against venture criteria
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {activeCandidates.map((candidate, idx) => (
                <div
                  key={`${candidate.handle}-${idx}`}
                  className="p-2.5 rounded-xl bg-black/50 border border-white/[0.06] hover:border-indigo-500/30 transition-all flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-bold text-xs text-white truncate">
                      {candidate.handle}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      ★ {candidate.score}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 mb-1.5 flex items-center justify-between">
                    <span>{candidate.subs}</span>
                    <span className="text-cyan-400">{candidate.eng} Eng</span>
                  </div>

                  <div className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded truncate">
                    <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">Email Verified</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
