import React from 'react'
import {
  Users,
  Sparkles,
  Play,
  MessageSquare,
  AlertTriangle,
  Award,
  Target,
  Star,
  Cpu
} from 'lucide-react'

/**
 * Step5SkeletonLoader
 * Light-theme animated skeleton state shown while AI synthesizes deep audience intelligence
 * and engineers the top 3 co-launch software product concepts for the creator.
 * Matches the exact clean white/slate design system of Creator Forge.
 */
export default function Step5SkeletonLoader({ creatorName = 'Creator' }) {
  return (
    <div className="space-y-6 w-full animate-fade-in text-slate-900">
      {/* ── Section 1: Audience Intelligence & Deep Research Signals Skeleton ── */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-600" />
            <span>Audience Intelligence & Deep Research Signals</span>
          </h3>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] text-emerald-700 font-mono font-medium">
              Extracting {creatorName}&apos;s channel telemetry...
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {/* Card 1: Top-Performing Content */}
          <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-3 relative overflow-hidden">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-slate-100/60 to-transparent pointer-events-none" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <span className="font-bold text-xs text-slate-900">Top-Performing Content</span>
              </div>
              <span className="text-[10px] text-purple-700 bg-purple-50 border border-purple-200/70 px-2 py-0.5 rounded font-mono font-medium">
                Analysis
              </span>
            </div>
            <div className="space-y-2">
              <div className="h-2.5 w-full bg-slate-200/80 rounded-full animate-pulse" />
              <div className="h-2.5 w-4/5 bg-slate-100 rounded-full animate-pulse" />
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div className="h-2 w-28 bg-slate-200/70 rounded-full animate-pulse" />
              <div className="h-2 w-16 bg-slate-100 rounded-full animate-pulse" />
            </div>
          </div>

          {/* Card 2: Recurring Questions */}
          <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-3 relative overflow-hidden">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-slate-100/60 to-transparent pointer-events-none" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                <span className="font-bold text-xs text-slate-900">Recurring Questions</span>
              </div>
              <span className="text-[10px] text-cyan-700 bg-cyan-50 border border-cyan-200/70 px-2 py-0.5 rounded font-mono font-medium">
                Audience Q&A
              </span>
            </div>
            <div className="space-y-2">
              <div className="h-2.5 w-full bg-slate-200/80 rounded-full animate-pulse" />
              <div className="h-2.5 w-3/4 bg-slate-100 rounded-full animate-pulse" />
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div className="h-2 w-32 bg-slate-200/70 rounded-full animate-pulse" />
              <div className="h-2 w-14 bg-slate-100 rounded-full animate-pulse" />
            </div>
          </div>

          {/* Card 3: Core Pain Points */}
          <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-3 relative overflow-hidden">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-slate-100/60 to-transparent pointer-events-none" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="font-bold text-xs text-slate-900">Core Pain Points</span>
              </div>
              <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200/70 px-2 py-0.5 rounded font-mono font-medium">
                Frustrations
              </span>
            </div>
            <div className="space-y-2">
              <div className="h-2.5 w-full bg-slate-200/80 rounded-full animate-pulse" />
              <div className="h-2.5 w-5/6 bg-slate-100 rounded-full animate-pulse" />
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div className="h-2 w-30 bg-slate-200/70 rounded-full animate-pulse" />
              <div className="h-2 w-12 bg-slate-100 rounded-full animate-pulse" />
            </div>
          </div>

          {/* Card 4: Audience Demographics */}
          <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-3 relative overflow-hidden">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-slate-100/60 to-transparent pointer-events-none" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span className="font-bold text-xs text-slate-900">Audience Demographics</span>
              </div>
              <span className="text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-200/70 px-2 py-0.5 rounded font-mono font-medium">
                Demographics
              </span>
            </div>
            <div className="space-y-2">
              <div className="h-2.5 w-full bg-slate-200/80 rounded-full animate-pulse" />
              <div className="h-2.5 w-4/5 bg-slate-100 rounded-full animate-pulse" />
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div className="h-2 w-32 bg-slate-200/70 rounded-full animate-pulse" />
              <div className="h-2 w-16 bg-slate-100 rounded-full animate-pulse" />
            </div>
          </div>

          {/* Card 5: Current Monetization */}
          <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-3 relative overflow-hidden">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-slate-100/60 to-transparent pointer-events-none" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="font-bold text-xs text-slate-900">Current Monetization</span>
              </div>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 rounded font-mono font-medium">
                Revenue
              </span>
            </div>
            <div className="space-y-2">
              <div className="h-2.5 w-full bg-slate-200/80 rounded-full animate-pulse" />
              <div className="h-2.5 w-3/4 bg-slate-100 rounded-full animate-pulse" />
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div className="h-2 w-28 bg-slate-200/70 rounded-full animate-pulse" />
              <div className="h-2 w-16 bg-slate-100 rounded-full animate-pulse" />
            </div>
          </div>

          {/* Card 6: Competitors & Intent */}
          <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-3 relative overflow-hidden">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-slate-100/60 to-transparent pointer-events-none" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-pink-600 shrink-0" />
                <span className="font-bold text-xs text-slate-900">Competitors & Intent</span>
              </div>
              <span className="text-[10px] text-pink-700 bg-pink-50 border border-pink-200/70 px-2 py-0.5 rounded font-mono font-medium">
                Market Gap
              </span>
            </div>
            <div className="space-y-2">
              <div className="h-2.5 w-full bg-slate-200/80 rounded-full animate-pulse" />
              <div className="h-2.5 w-5/6 bg-slate-100 rounded-full animate-pulse" />
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div className="h-2 w-26 bg-slate-200/70 rounded-full animate-pulse" />
              <div className="h-2 w-14 bg-slate-100 rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 2: Top 3 Product Concepts Skeleton ── */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border-b border-slate-200/80 pb-3">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Top 3 Product Opportunities for {creatorName}</span>
            </h3>
            <p className="text-slate-500 text-xs">
              Synthesizing problem statements, core features, audience evidence, pricing models, and revenue projections...
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-mono font-semibold shrink-0 animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
            <span>Engineering 3 Concepts...</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[1, 2, 3].map((num) => (
            <div
              key={num}
              className="p-5 rounded-2xl border border-slate-200/90 bg-white text-slate-700 space-y-4 flex flex-col justify-between shadow-2xs relative overflow-hidden"
            >
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-slate-100/50 to-transparent pointer-events-none" />

              <div className="space-y-3.5">
                {/* Header Badge & Opportunity Score */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200/60">
                    Concept #{num}
                  </span>
                  <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-50 border border-amber-200/80">
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                    <div className="h-3 w-16 bg-amber-200/70 rounded-full animate-pulse" />
                  </div>
                </div>

                {/* Window Chrome Mockup Preview Skeleton (Matches Concept Card Image Window) */}
                <div className="rounded-xl bg-slate-950 border border-slate-800 p-3 relative overflow-hidden flex flex-col justify-between shadow-2xs space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-rose-500/90" />
                      <div className="w-2 h-2 rounded-full bg-amber-400/90" />
                      <div className="w-2 h-2 rounded-full bg-emerald-400/90" />
                      <div className="h-2.5 w-24 bg-slate-800 rounded-full animate-pulse ml-1" />
                    </div>
                    <span className="text-[9px] font-bold text-emerald-300 bg-emerald-500/20 px-1.5 py-0.2 rounded border border-emerald-500/30">
                      MVP Ready
                    </span>
                  </div>

                  {/* Mockup Canvas Shimmer */}
                  <div className="relative rounded-lg overflow-hidden border border-slate-800 h-28 bg-[#05070c] flex flex-col items-center justify-center p-3 text-center space-y-2">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                      <Cpu className="w-4 h-4 text-purple-400 animate-spin" />
                    </div>
                    <div className="h-3 w-32 bg-slate-800 rounded-full animate-pulse" />
                    <div className="h-2 w-20 bg-slate-800/80 rounded-full animate-pulse" />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent animate-pulse" />
                  </div>

                  {/* 3 Metric Tiles Skeleton */}
                  <div className="grid grid-cols-3 gap-1.5">
                    <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-center space-y-1">
                      <span className="text-[8px] text-slate-400 block font-mono">MRR</span>
                      <div className="h-2.5 w-10 mx-auto bg-emerald-500/40 rounded-full animate-pulse" />
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-center space-y-1">
                      <span className="text-[8px] text-slate-400 block font-mono">Users</span>
                      <div className="h-2.5 w-8 mx-auto bg-purple-400/40 rounded-full animate-pulse" />
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-center space-y-1">
                      <span className="text-[8px] text-slate-400 block font-mono">Score</span>
                      <div className="h-2.5 w-8 mx-auto bg-cyan-400/40 rounded-full animate-pulse" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[9px] text-slate-400 border-t border-slate-800 pt-1">
                    <div className="h-2 w-24 bg-slate-800 rounded-full animate-pulse" />
                    <div className="h-2 w-16 bg-slate-800/70 rounded-full animate-pulse" />
                  </div>
                </div>

                {/* Title & Tagline in Card Body */}
                <div className="space-y-1.5 pt-1">
                  <div className="h-4 w-3/4 bg-slate-200/90 rounded-lg animate-pulse" />
                  <div className="h-2.5 w-full bg-slate-100 rounded-full animate-pulse" />
                  <div className="h-2.5 w-4/5 bg-slate-100 rounded-full animate-pulse" />
                </div>

                {/* Problem & Solution Callout Box */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2.5 w-20 bg-amber-100 rounded-full animate-pulse" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-2 w-full bg-slate-200/70 rounded-full animate-pulse" />
                    <div className="h-2 w-4/5 bg-slate-100 rounded-full animate-pulse" />
                  </div>
                </div>

                {/* Key Features Bullets */}
                <div className="space-y-1.5 pt-1">
                  {[1, 2, 3].map((f) => (
                    <div key={f} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-600/70 shrink-0" />
                      <div className="h-2 w-4/5 bg-slate-100 rounded-full animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Metrics Pill & Action */}
              <div className="pt-3 border-t border-slate-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="h-6 w-24 bg-purple-50 border border-purple-200/60 rounded-lg animate-pulse" />
                  <div className="h-6 w-20 bg-emerald-50 border border-emerald-200/60 rounded-lg animate-pulse" />
                </div>
                <div className="w-full h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center animate-pulse">
                  <div className="h-2.5 w-28 bg-slate-300/80 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
