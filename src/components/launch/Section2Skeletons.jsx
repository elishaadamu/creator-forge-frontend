import React from 'react'
import { Skeleton, SkeletonText, SkeletonCircle, SkeletonButton, SkeletonCard } from '../common/Skeleton'
import { Layers, Sparkles, Rocket, RefreshCw, Megaphone, TrendingUp, Flag, Layout, FileText, Code, CheckCircle2 } from 'lucide-react'

/**
 * 1. Project OS Section 2 Full Overview Skeleton — Light Mode Command Center
 */
export function ProjectOSSkeleton() {
  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden animate-fade-in text-slate-900">
      {/* Top Banner Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/90 pb-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-16 h-4 rounded bg-emerald-100/70 border border-emerald-200/80 animate-pulse" />
            <span className="text-xs text-slate-300">•</span>
            <span className="w-32 h-5 rounded-full bg-slate-100 border border-slate-200 animate-pulse" />
          </div>
          <div className="w-64 sm:w-80 h-7 rounded-xl bg-slate-200/90 animate-pulse" />
          <div className="flex items-center gap-2 pt-0.5">
            <div className="w-36 h-3 rounded-full bg-slate-200/70 animate-pulse" />
            <span className="text-slate-300">•</span>
            <div className="w-56 h-3 rounded-full bg-slate-100 animate-pulse" />
          </div>
        </div>

        {/* Right Buttons Placeholder */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="w-36 h-8 rounded-xl bg-white border border-slate-200 shadow-2xs animate-pulse" />
          <div className="w-32 h-8 rounded-xl bg-white border border-slate-200 shadow-2xs animate-pulse" />
          <div className="w-28 h-8 rounded-xl bg-rose-50 border border-rose-200 shadow-2xs animate-pulse" />
        </div>
      </div>

      {/* Expanded Command Center Skeleton (Matching ProjectOS Command Center) */}
      <div className="w-full space-y-4">
        <div className="rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-stretch w-full relative">
          {/* Left Mini Sidebar Skeleton */}
          <div className="w-full md:w-56 lg:w-60 bg-slate-50/95 border-b md:border-b-0 md:border-r border-slate-200/90 p-3 sm:p-3.5 flex flex-row md:flex-col justify-between items-center md:items-stretch gap-2 shrink-0 md:self-start md:min-h-[580px] rounded-t-2xl md:rounded-tr-none md:rounded-l-2xl">
            <div className="flex md:flex-col items-center md:items-stretch gap-1 overflow-x-auto scrollbar-none shrink-0 w-full pt-0.5">
              <div className="hidden md:block px-2 py-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                Command Center
              </div>

              {[
                { label: 'Overview', active: true },
                { label: 'Tasks' },
                { label: 'Metrics' },
                { label: 'Files' },
                { label: 'Messages' },
                { label: 'Decisions' },
              ].map((tab, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold w-full shrink-0 ${
                    tab.active
                      ? 'bg-white text-slate-950 shadow-xs border border-slate-200'
                      : 'text-slate-400'
                  }`}
                >
                  <div className={`w-3.5 h-3.5 rounded shrink-0 ${tab.active ? 'bg-emerald-500/40' : 'bg-slate-200'} animate-pulse`} />
                  <span className={`h-3 rounded-full animate-pulse ${tab.active ? 'w-20 bg-slate-300' : 'w-16 bg-slate-200'}`} />
                </div>
              ))}
            </div>

            {/* Bottom Active Phase Box */}
            <div className="md:mt-auto md:pt-4 shrink-0 w-full">
              <div className="p-2 sm:p-3 rounded-2xl bg-white border border-slate-200 text-center flex md:flex-col items-center gap-2 shadow-2xs">
                <span className="hidden md:block w-20 h-2.5 rounded bg-slate-200 animate-pulse mx-auto" />
                <div className="flex items-center justify-center gap-1.5">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-100 border border-emerald-300 animate-pulse" />
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-100 animate-pulse" />
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-100 animate-pulse" />
                </div>
                <span className="hidden md:block w-24 h-2 rounded bg-slate-200 animate-pulse mx-auto" />
              </div>
            </div>
          </div>

          {/* Right Main Command Center Inner Area Skeleton */}
          <div className="flex-1 min-w-0 p-4 sm:p-5 lg:p-6 space-y-4 bg-white rounded-b-2xl md:rounded-bl-none md:rounded-r-2xl overflow-x-hidden">
            {/* Header inside Command Center */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-200/80 pb-3.5">
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-48 sm:w-60 h-6 sm:h-7 rounded-xl bg-slate-200 animate-pulse" />
                  <span className="text-slate-300">×</span>
                  <div className="w-36 sm:w-44 h-6 sm:h-7 rounded-xl bg-slate-200/70 animate-pulse" />
                </div>

                {/* Unified metadata row: Pricing, AI experiment, Chosen Concept & Archetype */}
                <div className="flex items-center gap-2 flex-wrap max-w-full pt-0.5">
                  <div className="w-44 h-6 rounded-lg bg-emerald-50 border border-emerald-200 shadow-2xs animate-pulse" />
                  <div className="w-52 h-6 rounded-lg bg-emerald-50 border border-emerald-200 shadow-2xs animate-pulse" />
                  <div className="w-36 h-6 rounded-lg bg-slate-100 border border-slate-200 animate-pulse" />
                </div>

                <div className="w-full sm:w-3/4 h-3.5 rounded-full bg-slate-100 animate-pulse pt-0.5" />
              </div>

              {/* Action buttons on right of Command Center Header */}
              <div className="flex items-center gap-2 shrink-0 self-start sm:pt-0.5 flex-wrap">
                <div className="w-32 h-7 rounded-full bg-emerald-50 border border-emerald-300 shadow-2xs animate-pulse" />
                <div className="w-40 h-8 rounded-xl bg-slate-900/15 animate-pulse" />
              </div>
            </div>

            {/* Overview Hero Blueprint Card Skeleton */}
            <div className="relative rounded-2xl bg-gradient-to-br from-white via-slate-50/70 to-emerald-50/30 border-2 border-emerald-500/40 p-4 sm:p-5 lg:p-6 shadow-sm space-y-4 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-300 animate-pulse shrink-0 shadow-2xs" />
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="w-44 h-4 rounded bg-emerald-100 border border-emerald-300 animate-pulse" />
                      <div className="w-24 h-4 rounded-full bg-slate-100 border border-slate-200 animate-pulse" />
                      <div className="w-36 h-4 rounded-full bg-emerald-50 border border-emerald-300 animate-pulse" />
                    </div>
                    <div className="w-48 h-6 rounded-lg bg-slate-200 animate-pulse mt-1" />
                  </div>
                </div>
                <div className="w-36 h-8 rounded-xl bg-emerald-600/30 border border-emerald-500/30 animate-pulse shrink-0" />
              </div>

              {/* Blueprint Columns: Left Details + Right Simulated Architecture Preview */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                <div className="lg:col-span-7 space-y-3">
                  <div className="w-full h-3.5 rounded-full bg-slate-200 animate-pulse" />
                  <div className="w-4/5 h-3 rounded-full bg-slate-100 animate-pulse" />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
                      <div className="w-24 h-3.5 rounded bg-rose-100 border border-rose-200 animate-pulse" />
                      <div className="w-full h-2.5 rounded bg-slate-100 animate-pulse" />
                      <div className="w-4/5 h-2.5 rounded bg-slate-100 animate-pulse" />
                    </div>
                    <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
                      <div className="w-24 h-3.5 rounded bg-blue-100 border border-blue-200 animate-pulse" />
                      <div className="w-full h-2.5 rounded bg-slate-100 animate-pulse" />
                      <div className="w-3/4 h-2.5 rounded bg-slate-100 animate-pulse" />
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5 rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 shadow-md">
                  <div className="px-3.5 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500/60" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
                      <div className="w-32 h-2.5 rounded bg-slate-800 ml-2 animate-pulse" />
                    </div>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <div className="p-4 space-y-2.5">
                    <div className="w-full h-3 rounded bg-slate-800 animate-pulse" />
                    <div className="w-4/5 h-3 rounded bg-slate-800 animate-pulse" />
                    <div className="w-3/5 h-3 rounded bg-slate-800 animate-pulse" />
                    <div className="w-1/2 h-8 rounded-xl bg-emerald-600/30 border border-emerald-500/30 mt-3 animate-pulse" />
                  </div>
                </div>
              </div>
            </div>

            {/* Top 4 KPI Metric Cards Skeleton */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 shadow-2xs">
                  <div className="w-20 h-2.5 rounded bg-slate-200 animate-pulse" />
                  <div className="w-24 h-6 rounded-lg bg-slate-300 animate-pulse" />
                  <div className="w-28 h-2 rounded bg-slate-200/80 animate-pulse" />
                  <div className="w-full h-1.5 rounded-full bg-slate-200 animate-pulse mt-1" />
                </div>
              ))}
            </div>

            {/* Bottom 2 Columns: Tasks & AI Activity Stream */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 sm:p-5 rounded-xl bg-slate-50/70 border border-slate-200 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                  <div className="w-36 h-3.5 rounded bg-slate-300 animate-pulse" />
                  <div className="w-12 h-3.5 rounded bg-slate-200 animate-pulse" />
                </div>
                <div className="space-y-2.5">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center justify-between py-1 border-b border-slate-100 last:border-0">
                      <div className="flex items-center gap-2">
                        <div className="w-3.5 h-3.5 rounded-full bg-slate-200 animate-pulse" />
                        <div className="w-44 h-3 rounded bg-slate-200 animate-pulse" />
                      </div>
                      <div className="w-12 h-2.5 rounded bg-slate-200/70 animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 sm:p-5 rounded-xl bg-slate-50/70 border border-slate-200 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                  <div className="w-32 h-3.5 rounded bg-slate-300 animate-pulse" />
                  <div className="w-20 h-4 rounded-full bg-emerald-50 border border-emerald-200 animate-pulse" />
                </div>
                <div className="space-y-2.5">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-start gap-2 py-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500/50 mt-1 shrink-0 animate-pulse" />
                      <div className="space-y-1 w-full">
                        <div className="w-3/4 h-3 rounded bg-slate-200 animate-pulse" />
                        <div className="w-1/2 h-2 rounded bg-slate-100 animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * 2. Phase 1 Validation View Skeleton — Light Mode
 */
export function Phase1ValidateSkeleton() {
  return (
    <div className="space-y-5 w-full max-w-full overflow-hidden animate-fade-in text-slate-900">
      {/* 5-Step Progress Nav Skeleton */}
      <div className="p-2 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between overflow-x-auto gap-2">
        <div className="flex items-center gap-2 min-w-max">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="w-24 h-7 rounded-xl bg-slate-100 border border-slate-200 animate-pulse" />
          ))}
        </div>
        <div className="w-32 h-7 rounded-xl bg-emerald-50 border border-emerald-300 animate-pulse shrink-0" />
      </div>

      {/* Main Spec Card Skeleton */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
          <div className="space-y-1.5">
            <div className="w-48 h-4 rounded-full bg-slate-200 animate-pulse" />
            <div className="w-72 h-3 rounded-full bg-slate-100 animate-pulse" />
          </div>
          <div className="w-28 h-8 rounded-xl bg-slate-100 border border-slate-200 animate-pulse" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="w-24 h-4 rounded bg-slate-200 animate-pulse" />
            <div className="w-full h-3 rounded bg-slate-100 animate-pulse" />
            <div className="w-3/4 h-3 rounded bg-slate-100 animate-pulse" />
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="w-24 h-4 rounded bg-slate-200 animate-pulse" />
            <div className="w-full h-3 rounded bg-slate-100 animate-pulse" />
            <div className="w-3/4 h-3 rounded bg-slate-100 animate-pulse" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="w-20 h-3 rounded-full bg-slate-200 animate-pulse" />
              <div className="w-16 h-5 rounded-lg bg-slate-300 animate-pulse" />
              <div className="w-full h-2 rounded-full bg-slate-100 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * 3. Phase 1 AI Campaign Kit Generation Shimmer Skeleton
 */
export function Phase1CampaignGenSkeleton() {
  return (
    <div className="space-y-4 p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs animate-fade-in">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700">
            <Sparkles className="w-4 h-4 animate-spin" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <span>Generating 7-Day Campaign Kit with AI...</span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-700 animate-pulse" />
            </h4>
            <p className="text-[10px] text-slate-500">
              Synthesizing Instagram Stories, TikTok scripts, VIP email newsletter, and 1-on-1 DM sequences.
            </p>
          </div>
        </div>
        <Skeleton variant="default" rounded="rounded-full" className="w-24 h-5" />
      </div>

      {/* Shimmer Schedule Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
        {['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'].map((day, i) => (
          <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-slate-500">{day}</span>
              <SkeletonCircle size={10} variant="default" />
            </div>
            <Skeleton rounded="rounded-full" className="w-full h-2.5" />
            <Skeleton rounded="rounded-full" className="w-3/4 h-2" />
          </div>
        ))}
      </div>

      {/* Shimmer Copy Previews */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
          <div className="flex items-center gap-2">
            <SkeletonCircle size={18} variant="default" />
            <Skeleton rounded="rounded-full" className="w-32 h-3" />
          </div>
          <SkeletonText lines={3} />
        </div>
        <div className="p-4 rounded-xl bg-[#141720] border border-white/[0.06] space-y-2.5">
          <div className="flex items-center gap-2">
            <SkeletonCircle size={18} variant="blue" />
            <Skeleton rounded="rounded-full" className="w-36 h-3" />
          </div>
          <SkeletonText lines={3} />
        </div>
      </div>
    </div>
  )
}

/**
 * 4. Phase 1 AI CRO Experiments Generation Skeleton
 */
export function Phase1ExperimentsGenSkeleton() {
  return (
    <div className="space-y-4 p-5 rounded-2xl bg-[#0e1117] border border-emerald-500/20 shadow-lg shadow-emerald-950/20 animate-fade-in">
      <div className="flex items-center justify-between border-b border-white/[0.07] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <TrendingUp className="w-4 h-4 animate-bounce" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              <span>Formulating CRO Experiments with AI...</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </h4>
            <p className="text-[10px] text-slate-400">
              Evaluating telemetry, drop-off rates, and generating high-impact A/B variants.
            </p>
          </div>
        </div>
        <Skeleton variant="emerald" rounded="rounded-full" className="w-28 h-5" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="p-4 rounded-xl bg-[#141720] border border-white/[0.06] space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton rounded="rounded-full" className="w-36 h-3.5" />
              <Skeleton variant="emerald" rounded="rounded-full" className="w-16 h-4" />
            </div>
            <SkeletonText lines={2} />
            <div className="flex items-center gap-2 pt-1">
              <Skeleton rounded="rounded-md" className="w-20 h-6" />
              <Skeleton rounded="rounded-md" className="w-24 h-6" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * 5. Phase 2 Build MVP Specifications Skeleton
 */
export function Phase2BuildMVPSkeleton() {
  return (
    <div className="space-y-5 w-full max-w-full overflow-hidden animate-fade-in">
      {/* Subtab Bar Skeleton */}
      <div className="p-1.5 rounded-2xl bg-[#0e1117] border border-white/[0.08] flex items-center justify-between">
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} rounded="rounded-xl" className="w-28 h-7" />
          ))}
        </div>
        <SkeletonButton width={130} height={30} variant="default" />
      </div>

      {/* Main PRD Spec Card */}
      <div className="p-6 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-5">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div className="space-y-1">
            <Skeleton rounded="rounded-full" className="w-60 h-4" />
            <Skeleton rounded="rounded-full" className="w-40 h-2.5" />
          </div>
          <Skeleton rounded="rounded-full" className="w-20 h-5" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-[#141720] border border-white/[0.06] space-y-2">
            <Skeleton rounded="rounded-full" className="w-28 h-3 font-bold" />
            <SkeletonText lines={3} />
          </div>
          <div className="p-4 rounded-xl bg-[#141720] border border-white/[0.06] space-y-2">
            <Skeleton rounded="rounded-full" className="w-32 h-3 font-bold" />
            <SkeletonText lines={3} />
          </div>
          <div className="p-4 rounded-xl bg-[#141720] border border-white/[0.06] space-y-2">
            <Skeleton rounded="rounded-full" className="w-36 h-3 font-bold" />
            <SkeletonText lines={3} />
          </div>
        </div>

        {/* Division of Labor Tasks Shimmer */}
        <div className="space-y-2 pt-2">
          <Skeleton rounded="rounded-full" className="w-44 h-3.5" />
          {[1, 2, 3].map(i => (
            <div key={i} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <SkeletonCircle size={18} variant="blue" />
                <Skeleton rounded="rounded-full" className="w-64 h-3" />
              </div>
              <Skeleton rounded="rounded-full" className="w-20 h-4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * 6. Phase 2 Feedback Clustering Skeleton
 */
export function FeedbackClusterSkeleton() {
  return (
    <div className="space-y-3 p-4 rounded-2xl bg-[#0e1117] border border-white/[0.08] animate-fade-in">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
        <Skeleton rounded="rounded-full" className="w-48 h-3.5" />
        <SkeletonCircle size={16} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {[1, 2, 3].map(i => (
          <div key={i} className="p-3 rounded-xl bg-[#141720] border border-white/[0.06] space-y-2">
            <Skeleton rounded="rounded-full" className="w-24 h-3" />
            <SkeletonText lines={2} />
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * 7. Phase 3 Launch & Scale View Skeleton
 */
export function Phase3LaunchSkeleton() {
  return (
    <div className="space-y-5 w-full max-w-full overflow-hidden animate-fade-in">
      <div className="p-1.5 rounded-2xl bg-[#0e1117] border border-white/[0.08] flex items-center justify-between">
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} rounded="rounded-xl" className="w-28 h-7" />
          ))}
        </div>
        <Skeleton variant="emerald" rounded="rounded-full" className="w-24 h-6 shrink-0" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="p-4 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-2">
            <Skeleton rounded="rounded-full" className="w-16 h-3" />
            <Skeleton rounded="rounded-lg" className="w-20 h-6" />
            <Skeleton rounded="rounded-full" className="w-28 h-2" />
          </div>
        ))}
      </div>

      <div className="p-6 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-4">
        <Skeleton rounded="rounded-full" className="w-52 h-4" />
        <SkeletonText lines={4} />
      </div>
    </div>
  )
}

/**
 * 8. Phase 3 Executive Launch Report Skeleton
 */
export function LaunchReportSkeleton() {
  return (
    <div className="p-6 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-4 animate-fade-in">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
        <Skeleton rounded="rounded-full" className="w-64 h-5" />
        <SkeletonButton width={110} height={30} variant="emerald" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
            <Skeleton rounded="rounded-full" className="w-16 h-2.5" />
            <Skeleton rounded="rounded-lg" className="w-20 h-5" />
          </div>
        ))}
      </div>
      <SkeletonText lines={4} />
    </div>
  )
}

/**
 * 9. Creator Partner Portal Skeleton — Light Blueprint Matching Real Portal
 */
export function CreatorPortalSkeleton() {
  return (
    <div
      className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans flex flex-col relative antialiased animate-fade-in"
      style={{
        backgroundImage: 'radial-gradient(#cbd5e1 1.25px, transparent 1.25px)',
        backgroundSize: '20px 20px',
      }}
    >
      {/* Top Nav Header Skeleton */}
      <header className="h-16 border-b border-slate-200/90 bg-white/90 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between px-4 sm:px-8 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-900/10 animate-pulse shrink-0" />
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-36 h-4 rounded-md bg-slate-200 animate-pulse" />
              <div className="w-28 h-4 rounded-full bg-emerald-100/60 border border-emerald-200/60 animate-pulse" />
            </div>
            <div className="w-24 h-2.5 rounded bg-slate-100 animate-pulse" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 p-1 bg-slate-100 rounded-xl">
            <div className="w-32 h-7 rounded-lg bg-white shadow-2xs animate-pulse" />
            <div className="w-32 h-7 rounded-lg bg-slate-200/60 animate-pulse" />
          </div>
          <div className="w-36 h-8 rounded-xl bg-slate-100 border border-slate-200 animate-pulse" />
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl w-full mx-auto px-4 sm:px-8 py-8 space-y-6 flex-1">
        {/* Hero Revenue Card Skeleton */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="flex items-center gap-2">
              <div className="w-24 h-5 rounded-full bg-emerald-50 border border-emerald-200 animate-pulse" />
              <div className="w-32 h-4 rounded-full bg-slate-100 animate-pulse" />
            </div>
            <div className="w-64 sm:w-80 h-8 rounded-xl bg-slate-200 animate-pulse" />
            <div className="w-full sm:w-96 h-4 rounded-md bg-slate-100 animate-pulse" />
          </div>

          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3 min-w-[240px]">
            <div className="flex items-center justify-between">
              <div className="w-24 h-3 rounded bg-slate-200 animate-pulse" />
              <div className="w-12 h-3 rounded bg-emerald-200 animate-pulse" />
            </div>
            <div className="w-32 h-7 rounded-lg bg-slate-300 animate-pulse" />
            <div className="w-full h-2 rounded-full bg-slate-200 animate-pulse" />
          </div>
        </div>

        {/* 4 Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
              <div className="w-20 h-3 rounded bg-slate-100 animate-pulse" />
              <div className="w-16 h-6 rounded-lg bg-slate-200 animate-pulse" />
              <div className="w-24 h-2.5 rounded bg-slate-100 animate-pulse" />
            </div>
          ))}
        </div>

        {/* Step Progression Bar */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-40 h-3.5 rounded bg-slate-200 animate-pulse" />
            <div className="w-20 h-3 rounded bg-slate-100 animate-pulse" />
          </div>
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-slate-200 animate-pulse shrink-0" />
                <div className="w-16 h-3 rounded bg-slate-200 animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Daily Tasks Card */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="space-y-1">
              <div className="w-48 h-4 rounded bg-slate-200 animate-pulse" />
              <div className="w-72 h-3 rounded bg-slate-100 animate-pulse" />
            </div>
            <div className="w-24 h-8 rounded-xl bg-slate-100 animate-pulse" />
          </div>

          <div className="space-y-2.5">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/70 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-lg bg-slate-200 animate-pulse shrink-0" />
                  <div className="space-y-1.5">
                    <div className="w-48 sm:w-64 h-3.5 rounded bg-slate-200 animate-pulse" />
                    <div className="w-32 sm:w-44 h-2.5 rounded bg-slate-100 animate-pulse" />
                  </div>
                </div>
                <div className="w-20 h-7 rounded-lg bg-white border border-slate-200 animate-pulse shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

/**
 * 10. Pre-Order Landing Page Skeleton
 */
export function PreorderLandingSkeleton() {
  return (
    <div className="min-h-screen bg-[#07090e] text-white flex flex-col animate-fade-in">
      {/* Top Navbar */}
      <div className="p-4 border-b border-white/[0.08] flex items-center justify-between max-w-5xl w-full mx-auto">
        <div className="flex items-center gap-3">
          <SkeletonCircle size={32} variant="default" />
          <Skeleton rounded="rounded-full" className="w-36 h-4" />
        </div>
        <SkeletonButton width={120} height={34} variant="default" />
      </div>

      {/* Hero Body */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-6 sm:p-12 text-center space-y-6">
        <Skeleton rounded="rounded-full" className="w-40 h-5 mx-auto" variant="emerald" />
        <Skeleton rounded="rounded-2xl" className="w-full h-12 max-w-xl mx-auto" />
        <Skeleton rounded="rounded-full" className="w-4/5 h-4 mx-auto" />

        {/* Pricing pass cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 max-w-xl mx-auto">
          <div className="p-5 rounded-2xl bg-[#0e1117] border border-slate-700/60 space-y-3">
            <Skeleton rounded="rounded-full" className="w-28 h-3.5" />
            <Skeleton rounded="rounded-lg" className="w-20 h-7" variant="emerald" />
            <SkeletonText lines={2} />
            <SkeletonButton width="100%" height={38} variant="default" />
          </div>
          <div className="p-5 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-3">
            <Skeleton rounded="rounded-full" className="w-24 h-3.5" />
            <Skeleton rounded="rounded-lg" className="w-16 h-7" />
            <SkeletonText lines={2} />
            <SkeletonButton width="100%" height={38} variant="default" />
          </div>
        </div>
      </main>
    </div>
  )
}

/**
 * 11. Follow-Up CRM & Inbox Skeleton Table & Card Mockups
 */
export function CRMSkeleton() {
  return (
    <div className="space-y-4 w-full animate-fade-in">
      {/* KPI Status Pills Skeleton */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-pulse" />
              <div className="w-16 h-3 rounded bg-slate-200 animate-pulse" />
            </div>
            <div className="w-6 h-4 rounded bg-slate-200 animate-pulse" />
          </div>
        ))}
      </div>

      {/* Search & Filter Bar Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
        <div className="w-full sm:w-80 h-9 rounded-xl bg-slate-100 animate-pulse" />
        <div className="flex items-center gap-2">
          <div className="w-24 h-8 rounded-lg bg-slate-100 animate-pulse" />
          <div className="w-24 h-8 rounded-lg bg-slate-100 animate-pulse" />
        </div>
      </div>

      {/* Directory Full Cards Mockups */}
      <div className="space-y-4">
        {[1, 2].map(i => (
          <div key={i} className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
            {/* Header: Avatar, Name, Handle, Stage Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 animate-pulse shrink-0" />
                <div className="space-y-1.5">
                  <div className="w-44 h-4 rounded bg-slate-200 animate-pulse" />
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-3 rounded bg-emerald-100 animate-pulse" />
                    <div className="w-16 h-3 rounded bg-slate-100 animate-pulse" />
                  </div>
                </div>
              </div>
              <div className="w-36 h-6 rounded-full bg-slate-100 border border-slate-200 animate-pulse" />
            </div>

            {/* 6 Stats Tiles */}
            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-32 h-3 rounded bg-slate-200 animate-pulse" />
                <div className="w-24 h-4 rounded bg-amber-100 animate-pulse" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {[1, 2, 3, 4, 5, 6].map(idx => (
                  <div key={idx} className="p-2 rounded-lg bg-white border border-slate-200/80 text-center space-y-1">
                    <div className="w-12 h-2.5 mx-auto rounded bg-slate-100 animate-pulse" />
                    <div className="w-10 h-3.5 mx-auto rounded bg-slate-200 animate-pulse" />
                  </div>
                ))}
              </div>
            </div>

            {/* Content Bio Box */}
            <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1.5">
              <div className="w-24 h-2.5 rounded bg-slate-200 animate-pulse" />
              <div className="w-full h-3 rounded bg-slate-100 animate-pulse" />
              <div className="w-3/4 h-3 rounded bg-slate-100 animate-pulse" />
            </div>

            {/* Buttons Row */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                <div className="w-16 h-7 rounded-xl bg-slate-100 animate-pulse" />
                <div className="w-24 h-7 rounded-xl bg-slate-100 animate-pulse" />
                <div className="w-28 h-7 rounded-xl bg-slate-900/10 animate-pulse" />
              </div>
              <div className="w-40 h-7 rounded-xl bg-slate-100 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * 12. Phase 3 Launch Strategy & Schedule Skeleton
 */
export function Phase3StrategySkeleton() {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-3">
          <Skeleton rounded="rounded-full" className="w-32 h-3" variant="emerald" />
          <Skeleton rounded="rounded-lg" className="w-40 h-7" />
          <Skeleton rounded="rounded-full" className="w-full h-3" />
          <Skeleton rounded="rounded-xl" className="w-full h-10" variant="default" />
        </div>
        <div className="md:col-span-2 p-5 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-3">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
            <Skeleton rounded="rounded-full" className="w-44 h-3.5" variant="blue" />
            <Skeleton rounded="rounded-full" className="w-28 h-3" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="p-3.5 rounded-xl bg-[#141720] border border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton rounded="rounded-full" className="w-28 h-3.5" />
                  <Skeleton rounded="rounded" className="w-12 h-4" variant="default" />
                </div>
                <Skeleton rounded="rounded-full" className="w-full h-2.5" />
                <Skeleton rounded="rounded-full" className="w-3/4 h-2.5" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-5 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-3">
        <Skeleton rounded="rounded-full" className="w-56 h-3.5" variant="emerald" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {[1, 2].map(i => (
            <div key={i} className="p-4 rounded-xl bg-[#141720] border border-white/[0.06] space-y-2.5">
              <div className="flex items-center justify-between">
                <Skeleton rounded="rounded-full" className="w-32 h-4" />
                <Skeleton rounded="rounded-lg" className="w-20 h-6" variant="emerald" />
              </div>
              <Skeleton rounded="rounded-full" className="w-48 h-3" />
              <Skeleton rounded="rounded-lg" className="w-full h-8" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * 13. Phase 3 Creator Assets Skeleton
 */
export function Phase3AssetsSkeleton() {
  return (
    <div className="p-5 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-4 animate-fade-in">
      <div className="flex items-center justify-between border-b border-white/[0.07] pb-3">
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} rounded="rounded-xl" className="w-24 h-7" />
          ))}
        </div>
        <SkeletonButton width={130} height={32} variant="default" />
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton rounded="rounded-full" className="w-48 h-4" />
          <Skeleton rounded="rounded-lg" className="w-20 h-7" />
        </div>
        <div className="p-5 rounded-xl bg-[#090b0e] border border-white/[0.06] space-y-2">
          <Skeleton rounded="rounded-full" className="w-full h-3" />
          <Skeleton rounded="rounded-full" className="w-4/5 h-3" />
          <Skeleton rounded="rounded-full" className="w-3/5 h-3" />
          <Skeleton rounded="rounded-full" className="w-2/3 h-3" />
        </div>
      </div>
    </div>
  )
}

/**
 * 14. Phase 3 Infrastructure Skeleton
 */
export function Phase3InfraSkeleton() {
  return (
    <div className="p-5 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-4 animate-fade-in">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
        <Skeleton rounded="rounded-full" className="w-64 h-4" variant="emerald" />
        <Skeleton rounded="rounded-full" className="w-24 h-3.5" variant="emerald" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="p-4 rounded-xl bg-[#141720] border border-white/[0.06] space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton rounded="rounded-full" className="w-28 h-3.5" />
              <Skeleton rounded="rounded" className="w-14 h-4" variant="emerald" />
            </div>
            <Skeleton rounded="rounded-full" className="w-full h-2.5" />
            <Skeleton rounded="rounded-full" className="w-3/4 h-2" />
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * 15. Phase 3 Checklists Skeleton
 */
export function Phase3ChecklistsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
      {[1, 2].map(col => (
        <div key={col} className="p-5 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-3">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
            <Skeleton rounded="rounded-full" className="w-40 h-4" variant={col === 1 ? 'emerald' : 'blue'} />
            <Skeleton rounded="rounded-full" className="w-24 h-3" />
          </div>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="p-3 rounded-xl bg-[#141720] border border-white/[0.06] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 w-full">
                  <SkeletonCircle size={16} />
                  <Skeleton rounded="rounded-full" className="w-4/5 h-3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * 16. Section 1 Step 2: Creator Candidate Cards Skeleton
 */
export function CreatorCardSkeleton({ count = 3 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3.5 relative overflow-hidden animate-fade-in"
        >
          {/* Subtle Shimmer Overlay */}
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-slate-100/50 to-transparent pointer-events-none" />

          {/* Header row with avatar, name and score */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 animate-pulse" />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-200 border-2 border-white animate-pulse" />
              </div>
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="h-4 w-32 sm:w-36 bg-slate-200/80 rounded-md animate-pulse" />
                <div className="h-3 w-24 bg-slate-100 rounded-md animate-pulse" />
              </div>
            </div>
            {/* Score Badge */}
            <div className="h-6 w-16 bg-emerald-50 border border-emerald-200/80 rounded-lg flex items-center justify-center animate-pulse shrink-0">
              <div className="h-2.5 w-10 bg-emerald-200/70 rounded-full" />
            </div>
          </div>

          {/* Stats 4-Grid in soft pastel tiles */}
          <div className="grid grid-cols-4 gap-1.5 text-center">
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1 animate-pulse">
              <div className="h-2 w-8 mx-auto bg-slate-200/70 rounded-full" />
              <div className="h-3 w-10 mx-auto bg-slate-300/80 rounded-md" />
            </div>
            <div className="p-2 rounded-xl bg-emerald-50/70 border border-emerald-200/70 space-y-1 animate-pulse">
              <div className="h-2 w-8 mx-auto bg-emerald-200/70 rounded-full" />
              <div className="h-3 w-10 mx-auto bg-emerald-300/80 rounded-md" />
            </div>
            <div className="p-2 rounded-xl bg-slate-100/70 border border-slate-200/70 space-y-1 animate-pulse">
              <div className="h-2 w-8 mx-auto bg-slate-200/70 rounded-full" />
              <div className="h-3 w-10 mx-auto bg-slate-300/80 rounded-md" />
            </div>
            <div className="p-2 rounded-xl bg-amber-50/70 border border-amber-200/70 space-y-1 animate-pulse">
              <div className="h-2 w-8 mx-auto bg-amber-200/70 rounded-full" />
              <div className="h-3 w-10 mx-auto bg-amber-300/80 rounded-md" />
            </div>
          </div>

          {/* Bio lines snippet box */}
          <div className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-200/70 space-y-1.5 animate-pulse">
            <div className="h-2.5 w-full bg-slate-200/70 rounded-full" />
            <div className="h-2.5 w-4/5 bg-slate-200/60 rounded-full" />
          </div>

          {/* Contact and action footer */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
            <div className="h-6 w-36 bg-slate-100 border border-slate-200/60 rounded-lg animate-pulse" />
            <div className="h-7 w-20 bg-slate-100 border border-slate-200/80 rounded-xl animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * 17. Section 1 Step 5: AI Software Concept Cards Skeleton
 */
export function ConceptCardSkeleton({ count = 3 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-5 rounded-2xl border border-slate-200/90 bg-white space-y-4 relative overflow-hidden shadow-2xs animate-fade-in"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="h-6 w-28 bg-slate-100 border border-slate-200/70 rounded-lg animate-pulse" />
            <div className="h-5 w-16 bg-emerald-50 border border-emerald-200/70 rounded-full animate-pulse" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-4/5 bg-slate-200/80 rounded-full animate-pulse" />
            <div className="h-3 w-full bg-slate-100 rounded-full animate-pulse" />
            <div className="h-3 w-2/3 bg-slate-100 rounded-full animate-pulse" />
          </div>
          <div className="space-y-2 pt-2 border-t border-slate-100">
            {[1, 2, 3].map(f => (
              <div key={f} className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-full bg-slate-200 shrink-0 animate-pulse" />
                <div className="h-3 w-3/4 bg-slate-100 rounded-full animate-pulse" />
              </div>
            ))}
          </div>
          <div className="pt-2">
            <div className="h-10 w-full bg-slate-100 border border-slate-200/80 rounded-xl animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * 18. Section 1 Step 3: Direct Outreach Queue Skeleton
 */
export function OutreachQueueSkeleton() {
  return (
    <div className="p-5 rounded-2xl bg-white border border-slate-200/90 space-y-4 animate-fade-in w-full shadow-2xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="h-4 w-48 bg-slate-200/80 rounded-full animate-pulse" />
        <div className="h-6 w-24 bg-slate-100 border border-slate-200/60 rounded-full animate-pulse" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse shrink-0" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3.5 w-36 bg-slate-200/80 rounded-full animate-pulse" />
                <div className="h-2.5 w-56 bg-slate-100 rounded-full animate-pulse" />
              </div>
            </div>
            <div className="h-5 w-20 bg-emerald-50 border border-emerald-200/60 rounded-full shrink-0 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * 19. Section 1 Step 4: Reply Classifier Inbox Skeleton
 */
export function ReplyInboxSkeleton() {
  return (
    <div className="p-5 rounded-2xl bg-white border border-slate-200/90 space-y-4 animate-fade-in w-full shadow-2xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="h-4 w-44 bg-slate-200/80 rounded-full animate-pulse" />
        <div className="h-6 w-28 bg-emerald-50 border border-emerald-200/60 rounded-full animate-pulse" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-slate-200 animate-pulse shrink-0" />
                <div className="h-3.5 w-32 bg-slate-200/80 rounded-full animate-pulse" />
              </div>
              <div className="h-4 w-16 bg-emerald-50 border border-emerald-200/60 rounded-full animate-pulse" />
            </div>
            <div className="h-3 w-4/5 bg-slate-200/70 rounded-full animate-pulse" />
            <div className="h-2.5 w-1/2 bg-slate-100 rounded-full animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}


