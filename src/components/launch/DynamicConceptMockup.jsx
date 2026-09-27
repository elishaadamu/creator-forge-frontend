import React, { useState } from "react";
import {
  Sparkles,
  CheckCircle2,
  TrendingUp,
  Cpu,
  Layers,
  Users,
  Activity,
  Zap,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Star,
  Monitor,
  Command,
  Lock,
  Bot,
  Database,
  BarChart3,
  Calendar,
  Check,
  Terminal,
  Image as ImageIcon
} from "lucide-react";

/**
 * Creator Forge Studio Color Scheme
 * Clean, human, prestigious venture studio palettes (Obsidian, Emerald, Forge Lime, Ocean Cyan, Venture Amber, Steel)
 * Zero non-human AI purple gradients.
 */
export const BRAND_COLORS = [
  { name: "Emerald", hex: "#16A34A", bg: "bg-emerald-600", text: "text-emerald-500", border: "border-emerald-600/40", glow: "rgba(22, 163, 74, 0.22)" },
  { name: "Forge Lime", hex: "#C8FF3D", bg: "bg-[#C8FF3D]", text: "text-[#C8FF3D]", border: "border-[#C8FF3D]/40", glow: "rgba(200, 255, 61, 0.2)" },
  { name: "Obsidian Slate", hex: "#0F172A", bg: "bg-slate-900", text: "text-slate-200", border: "border-slate-700", glow: "rgba(15, 23, 42, 0.3)" },
  { name: "Ocean Cyan", hex: "#0284C7", bg: "bg-sky-600", text: "text-sky-400", border: "border-sky-500/40", glow: "rgba(2, 132, 199, 0.2)" },
  { name: "Venture Amber", hex: "#D97706", bg: "bg-amber-600", text: "text-amber-400", border: "border-amber-500/40", glow: "rgba(217, 119, 6, 0.2)" },
  { name: "Steel", hex: "#475569", bg: "bg-slate-600", text: "text-slate-300", border: "border-slate-600/40", glow: "rgba(71, 85, 105, 0.2)" },
];

export function getBrandColorObj(colorInput) {
  if (!colorInput) return BRAND_COLORS[0];
  const found = BRAND_COLORS.find(
    (c) =>
      c.name.toLowerCase() === String(colorInput).toLowerCase() ||
      c.hex.toLowerCase() === String(colorInput).toLowerCase()
  );
  if (found) return found;
  // If a legacy purple/violet hex was stored, remap to Emerald/Obsidian
  if (String(colorInput).toLowerCase().includes("8b5cf6") || String(colorInput).toLowerCase().includes("purple") || String(colorInput).toLowerCase().includes("violet")) {
    return BRAND_COLORS[0];
  }
  return {
    name: "Studio Custom",
    hex: colorInput,
    bg: "bg-emerald-600",
    text: "text-emerald-500",
    border: "border-emerald-600/40",
    glow: "rgba(22, 163, 74, 0.22)",
  };
}

/**
 * Dynamic Concept Mockup
 * Renders authentic, high-res simulated software interfaces tailored to Concept 1, Concept 2, and Concept 3
 * using Creator Forge's human studio color scheme (Dark Obsidian, Forest Emerald, Cyan, Slate).
 */
export default function DynamicConceptMockup({
  concept,
  creator,
  conceptIndex = 0,
  onOpenDeck,
  onEditConcept
}) {
  const brandColorObj = getBrandColorObj(concept?.brandColor || (conceptIndex === 0 ? "#16A34A" : conceptIndex === 1 ? "#0F172A" : "#0284C7"));
  const accentHex = brandColorObj.hex;
  const creatorName = creator?.name || creator?.display_name || "Creator";
  const firstName = creatorName.split(" ")[0];
  const niche = creator?.niche || "Creator Economy";

  const appUrl =
    concept?.mockup?.appUrl ||
    concept?.appUrl ||
    `${(concept?.name || firstName).toLowerCase().replace(/[^a-z0-9]/g, "")}.app`;

  // Guarantee that Deck 1, Deck 2, and Deck 3 NEVER share the same visual software design:
  // Deck 1 (conceptIndex 0) -> saas_os (or ai_copilot if specified)
  // Deck 2 (conceptIndex 1) -> ai_copilot (or saas_os)
  // Deck 3 (conceptIndex 2) -> knowledge_hub (distinct VIP Vault / Engine module, never duplicate Deck 1 or 2)
  const resolvedMockupType = (() => {
    if (concept?.isModifiedByAdmin && concept?.mockupType) {
      return concept.mockupType;
    }
    const raw = concept?.mockupType;
    if (conceptIndex === 0) {
      return raw === "ai_copilot" ? "ai_copilot" : "saas_os";
    }
    if (conceptIndex === 1) {
      return raw === "saas_os" ? "saas_os" : "ai_copilot";
    }
    // conceptIndex >= 2 (Deck 3):
    // Deck 3 MUST be visually distinct from Deck 1 and Deck 2 (always knowledge_hub)
    return "knowledge_hub";
  })();

  const mockupType = resolvedMockupType;

  const rawCustomImg = (concept?.customImageUrl || concept?.imageUrl || concept?.mockup?.imageUrl || "").trim();
  const hasRealCustomImg = Boolean(
    rawCustomImg &&
    !rawCustomImg.includes("/api/outreach/concept-card-image") &&
    !rawCustomImg.includes("images.unsplash.com")
  );
  const customImageUrl = hasRealCustomImg ? rawCustomImg : null;

  return (
    <div
      className="rounded-xl bg-[#080A0C] border border-[#252B32] p-3 relative overflow-hidden flex flex-col justify-between shadow-2xs space-y-2.5 transition-all duration-300"
      style={{
        boxShadow: `0 4px 20px -2px ${brandColorObj.glow}`,
        borderColor: accentHex === "#0F172A" ? "#334155" : `${accentHex}40`
      }}
    >
      {/* Top Browser / macOS Window Chrome */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500/90" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400/90" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/90" />
          <span className="text-[10px] font-mono text-slate-300 font-semibold ml-1.5 truncate max-w-[150px] flex items-center gap-1">
            <Layers className="w-2.5 h-2.5 text-emerald-400" />
            <span>{concept?.name || "Architecture Spec"}</span>
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            MVP Ready
          </span>
        </div>
      </div>

      {/* Main Interactive Simulated Software Canvas */}
      <div className="relative rounded-lg overflow-hidden border border-slate-800/90 h-36 bg-[#04060A] flex flex-col justify-between p-2.5 group">
        {/* If user provided custom image screenshot, render image */}
        {customImageUrl ? (
          <div className="absolute inset-0 z-0">
            <img
              src={customImageUrl}
              alt={concept.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
          </div>
        ) : (
          /* Render Tailored Dynamic Software UI based on concept type */
          <div className="relative z-10 w-full h-full flex flex-col justify-between">
            {/* TYPE 1: All-In-One SaaS Workspace / OS Canvas */}
            {mockupType === "saas_os" && (
              <div className="space-y-2 h-full flex flex-col justify-between">
                {/* Simulated Mini App Header */}
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                  <div className="flex items-center gap-1.5">
                    {creator?.avatar ? (
                      <img src={creator.avatar} alt="" className="w-4 h-4 rounded-full border border-slate-700" />
                    ) : (
                      <div className="w-4 h-4 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[8px] flex items-center justify-center">
                        {firstName[0]}
                      </div>
                    )}
                    <span className="text-[10px] font-bold text-white tracking-tight truncate max-w-[120px]">
                      {concept.name}
                    </span>
                  </div>
                  <span className="text-[8px] font-mono text-slate-400 bg-slate-900 px-1 py-0.5 rounded border border-slate-800">
                    Live Workspace
                  </span>
                </div>

                {/* Simulated Left Nav + Dashboard Chart Area */}
                <div className="grid grid-cols-4 gap-1.5 flex-1 items-center">
                  <div className="col-span-1 bg-slate-900/90 rounded border border-slate-800/70 p-1 space-y-1 h-full flex flex-col justify-around">
                    <div className="flex items-center gap-1 text-[7px] text-slate-300 font-medium">
                      <BarChart3 className="w-2.5 h-2.5 text-emerald-400" /> Dash
                    </div>
                    <div className="flex items-center gap-1 text-[7px] text-slate-400 font-medium">
                      <Zap className="w-2.5 h-2.5 text-amber-400" /> Tasks
                    </div>
                    <div className="flex items-center gap-1 text-[7px] text-slate-400 font-medium">
                      <Layers className="w-2.5 h-2.5 text-slate-400" /> Flows
                    </div>
                  </div>

                  <div className="col-span-3 bg-slate-950/90 rounded border border-slate-800/80 p-1.5 h-full flex flex-col justify-between relative overflow-hidden">
                    <div className="flex items-center justify-between text-[8px]">
                      <span className="text-slate-400 font-medium">MRR Trajectory</span>
                      <span className="font-mono font-bold text-emerald-400">+38.4%</span>
                    </div>

                    {/* Smooth glowing SVG area chart in Emerald/Lime/Studio accent */}
                    <div className="h-9 w-full relative flex items-end">
                      <svg className="w-full h-full overflow-visible" viewBox="0 0 100 35" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id={`grad-p1-${conceptIndex}`} x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#16A34A" stopOpacity="0.45" />
                            <stop offset="100%" stopColor="#16A34A" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        <path
                          d="M0,32 Q20,24 35,26 T70,12 T100,5 L100,35 L0,35 Z"
                          fill={`url(#grad-p1-${conceptIndex})`}
                        />
                        <path
                          d="M0,32 Q20,24 35,26 T70,12 T100,5"
                          fill="none"
                          stroke="#16A34A"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>

                    <div className="flex items-center justify-between text-[7px] text-slate-500 font-mono">
                      <span>Launch Day</span>
                      <span>Target: $25K</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TYPE 2: AI Copilot & Automation Engine HUD (Obsidian + Emerald/Lime Studio Styling) */}
            {mockupType === "ai_copilot" && (
              <div className="space-y-1.5 h-full flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-1">
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded bg-emerald-500/20 flex items-center justify-center">
                      <Terminal className="w-2.5 h-2.5 text-emerald-400" />
                    </div>
                    <span className="text-[10px] font-bold text-white tracking-tight truncate max-w-[120px]">
                      {concept.name}
                    </span>
                  </div>
                  <span className="text-[8px] font-mono text-emerald-400 bg-emerald-950/70 px-1 py-0.5 rounded border border-emerald-800 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Fine-Tuned Copilot
                  </span>
                </div>

                <div className="bg-slate-900/90 rounded border border-slate-800/90 p-1.5 space-y-1 flex-1 flex flex-col justify-around">
                  <div className="flex items-center gap-1.5 bg-black/60 p-1 rounded border border-slate-800 text-[8px] text-slate-300">
                    <Cpu className="w-2.5 h-2.5 text-emerald-400 flex-shrink-0" />
                    <span className="truncate font-mono">Synthesizing {niche} workflow automations...</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[7px]">
                    <div className="bg-slate-950/80 p-1 rounded border border-slate-800 flex items-center gap-1 text-slate-200">
                      <Check className="w-2.5 h-2.5 text-emerald-400" /> 450+ Prompts Indexed
                    </div>
                    <div className="bg-slate-950/80 p-1 rounded border border-slate-800 flex items-center gap-1 text-slate-200">
                      <Zap className="w-2.5 h-2.5 text-amber-400" /> 120ms Latency
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[7px] text-slate-400 font-mono">
                  <span>Core Model: {firstName}-Studio-v1</span>
                  <span className="text-emerald-400 font-bold">Accuracy: 98.4%</span>
                </div>
              </div>
            )}

            {/* TYPE 3: Private Community, Toolkit & Mastermind Hub */}
            {mockupType === "knowledge_hub" && (
              <div className="space-y-1.5 h-full flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-1">
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded bg-cyan-500/20 flex items-center justify-center">
                      <Users className="w-2.5 h-2.5 text-cyan-400" />
                    </div>
                    <span className="text-[10px] font-bold text-cyan-200 tracking-tight truncate max-w-[120px]">
                      {concept.name}
                    </span>
                  </div>
                  <span className="text-[8px] font-mono text-cyan-300 bg-cyan-950/60 px-1 py-0.5 rounded border border-cyan-500/30">
                    VIP Vault Active
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1 flex-1 items-center">
                  <div className="p-1 rounded bg-slate-900/90 border border-slate-800 text-center space-y-0.5">
                    <Database className="w-2.5 h-2.5 text-cyan-400 mx-auto" />
                    <span className="text-[7px] text-slate-300 block font-bold">Preset Vault</span>
                    <span className="text-[6px] text-cyan-400 font-mono">42 Tools</span>
                  </div>
                  <div className="p-1 rounded bg-slate-900/90 border border-slate-800 text-center space-y-0.5">
                    <Calendar className="w-2.5 h-2.5 text-amber-400 mx-auto" />
                    <span className="text-[7px] text-slate-300 block font-bold">Live Calls</span>
                    <span className="text-[6px] text-amber-300 font-mono">Bi-Weekly</span>
                  </div>
                  <div className="p-1 rounded bg-slate-900/90 border border-slate-800 text-center space-y-0.5">
                    <ShieldCheck className="w-2.5 h-2.5 text-emerald-400 mx-auto" />
                    <span className="text-[7px] text-slate-300 block font-bold">Deal Desk</span>
                    <span className="text-[6px] text-emerald-300 font-mono">Verified</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[7px] text-slate-400 font-mono">
                  <span>Audience Scale: {creator?.followerStr || "250K"}</span>
                  <span className="text-emerald-400 font-bold">94% Retention</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Hover Action Overlay */}
        <div className="absolute inset-0 bg-black/75 backdrop-blur-2xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-20">
          {onOpenDeck && (
            <button
              type="button"
              onClick={onOpenDeck}
              className="px-2.5 py-1 rounded-lg bg-white text-slate-900 font-bold text-[10px] hover:bg-slate-100 transition-colors flex items-center gap-1 cursor-pointer shadow-md"
            >
              <Monitor className="w-3 h-3 text-slate-700" />
              <span>View Deck</span>
            </button>
          )}
          {onEditConcept && (
            <button
              type="button"
              onClick={onEditConcept}
              className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-white font-bold text-[10px] hover:bg-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>Customize</span>
            </button>
          )}
        </div>
      </div>

      {/* 3 Metric Pills with Studio High-Contrast Styling */}
      <div className="grid grid-cols-3 gap-1.5">
        <div className="p-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-center">
          <span className="text-[8px] text-slate-400 block font-medium">MRR Projected</span>
          <span className="text-[10px] font-bold text-emerald-400 font-mono">
            {concept?.mockup?.primaryMetric || concept?.primaryMetric || "$22.5K"}
          </span>
        </div>
        <div className="p-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-center">
          <span className="text-[8px] text-slate-400 block font-medium">Active Users</span>
          <span className="text-[10px] font-bold text-slate-200 font-mono">
            {concept?.mockup?.activeMetric || concept?.activeMetric || "850"}
          </span>
        </div>
        <div className="p-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-center">
          <span className="text-[8px] text-slate-400 block font-medium">Retention</span>
          <span className="text-[10px] font-bold text-cyan-300 font-mono">
            {concept?.mockup?.efficiencyMetric || concept?.efficiencyMetric || "94%"}
          </span>
        </div>
      </div>

      {/* Target User & Pricing Footer */}
      <div className="flex items-center justify-between text-[9px] text-slate-400 border-t border-slate-800 pt-1.5">
        <span className="truncate max-w-[130px] text-slate-300">
          {concept?.customer || concept?.demographicAlignment || "Target Users"}
        </span>
        <span className="text-emerald-400 font-bold font-mono">
          {concept?.pricing || "$29/mo"}
        </span>
      </div>
    </div>
  );
}
