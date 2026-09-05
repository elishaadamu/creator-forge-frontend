import React from 'react'
import { Skeleton, SkeletonText, SkeletonCircle, SkeletonButton } from '../common/Skeleton'
import {
  Users,
  Sparkles,
  RefreshCw,
  Play,
  MessageSquare,
  AlertTriangle,
  Award,
  Target,
  Layers,
  Star,
  Cpu
} from 'lucide-react'

/**
 * Step5SkeletonLoader
 * High-end animated skeleton state shown while AI synthesizes deep audience intelligence
 * and engineers the top 3 co-launch software product concepts for the creator.
 * Replaces static hardcoded writeups with a dynamic, living venture studio analysis state.
 */
export default function Step5SkeletonLoader({ creatorName = 'Creator' }) {
  return (
    <div className="space-y-6 w-full animate-fade-in">
      {/* ── Section 1: Audience Intelligence & Deep Research Signals Skeleton ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-400" />
            <span>Audience Intelligence & Deep Research Signals</span>
          </h3>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] text-emerald-400/90 font-mono">
              Extracting {creatorName}&apos;s channel telemetry...
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {/* Card 1: Top-Performing Content */}
          <div className="p-4 rounded-xl bg-[#161a23] border border-white/[0.06] space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5 text-purple-400 opacity-60" />
                <Skeleton rounded="rounded-full" className="w-28 h-3.5" />
              </div>
              <Skeleton variant="purple" rounded="rounded-md" className="w-16 h-4" />
            </div>
            <SkeletonText lines={2} lineHeight="h-3" widths={['w-full', 'w-4/5']} />
            <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between">
              <Skeleton rounded="rounded-full" className="w-24 h-2.5" />
              <Skeleton rounded="rounded-full" className="w-16 h-2.5" />
            </div>
          </div>

          {/* Card 2: Recurring Questions */}
          <div className="p-4 rounded-xl bg-[#161a23] border border-white/[0.06] space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-cyan-400 opacity-60" />
                <Skeleton rounded="rounded-full" className="w-28 h-3.5" />
              </div>
              <Skeleton variant="blue" rounded="rounded-md" className="w-16 h-4" />
            </div>
            <SkeletonText lines={2} lineHeight="h-3" widths={['w-full', 'w-3/4']} />
            <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between">
              <Skeleton rounded="rounded-full" className="w-28 h-2.5" />
              <Skeleton rounded="rounded-full" className="w-14 h-2.5" />
            </div>
          </div>

          {/* Card 3: Core Pain Points */}
          <div className="p-4 rounded-xl bg-[#161a23] border border-white/[0.06] space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 opacity-60" />
                <Skeleton rounded="rounded-full" className="w-28 h-3.5" />
              </div>
              <Skeleton variant="amber" rounded="rounded-md" className="w-16 h-4" />
            </div>
            <SkeletonText lines={2} lineHeight="h-3" widths={['w-full', 'w-5/6']} />
            <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between">
              <Skeleton rounded="rounded-full" className="w-32 h-2.5" />
              <Skeleton rounded="rounded-full" className="w-12 h-2.5" />
            </div>
          </div>

          {/* Card 4: Audience Demographics */}
          <div className="p-4 rounded-xl bg-[#161a23] border border-white/[0.06] space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-400 opacity-60" />
                <Skeleton rounded="rounded-full" className="w-32 h-3.5" />
              </div>
              <Skeleton variant="purple" rounded="rounded-md" className="w-20 h-4" />
            </div>
            <SkeletonText lines={2} lineHeight="h-3" widths={['w-full', 'w-4/5']} />
            <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between">
              <Skeleton rounded="rounded-full" className="w-36 h-2.5" />
              <Skeleton rounded="rounded-full" className="w-16 h-2.5" />
            </div>
          </div>

          {/* Card 5: Current Monetization */}
          <div className="p-4 rounded-xl bg-[#161a23] border border-white/[0.06] space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-emerald-400 opacity-60" />
                <Skeleton rounded="rounded-full" className="w-30 h-3.5" />
              </div>
              <Skeleton variant="emerald" rounded="rounded-md" className="w-20 h-4" />
            </div>
            <SkeletonText lines={2} lineHeight="h-3" widths={['w-full', 'w-3/4']} />
            <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between">
              <Skeleton rounded="rounded-full" className="w-32 h-2.5" />
              <Skeleton rounded="rounded-full" className="w-16 h-2.5" />
            </div>
          </div>

          {/* Card 6: Competitors & Intent */}
          <div className="p-4 rounded-xl bg-[#161a23] border border-white/[0.06] space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-pink-400 opacity-60" />
                <Skeleton rounded="rounded-full" className="w-30 h-3.5" />
              </div>
              <Skeleton variant="purple" rounded="rounded-md" className="w-16 h-4" />
            </div>
            <SkeletonText lines={2} lineHeight="h-3" widths={['w-full', 'w-5/6']} />
            <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between">
              <Skeleton rounded="rounded-full" className="w-28 h-2.5" />
              <Skeleton rounded="rounded-full" className="w-14 h-2.5" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 2: Top 3 Product Concepts Skeleton ── */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between text-xs border-b border-white/[0.06] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Skeleton rounded="rounded-full" className="w-56 h-4" />
              <Skeleton variant="purple" rounded="rounded-full" className="w-20 h-4" />
            </div>
            <Skeleton rounded="rounded-full" className="w-80 h-3 mt-1.5" />
          </div>
          <Skeleton variant="emerald" rounded="rounded-lg" className="w-48 h-6 shrink-0" />
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {[1, 2, 3].map((num) => (
            <div
              key={num}
              className="p-5 rounded-2xl border border-white/[0.08] bg-[#161a23] text-slate-300 space-y-4 flex flex-col justify-between relative overflow-hidden shadow-sm"
            >
              <div className="space-y-3.5">
                {/* Header Badge & Opportunity Score */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-300/60 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/20">
                    Concept #{num}
                  </span>
                  <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <Star className="w-3 h-3 text-amber-400/70" />
                    <Skeleton variant="amber" rounded="rounded-full" className="w-14 h-3" />
                  </div>
                </div>

                {/* Window Chrome Mockup Preview Skeleton */}
                <div className="rounded-xl bg-[#0d1017] border border-white/10 p-3 relative overflow-hidden flex flex-col justify-between space-y-2.5">
                  <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-red-400/50" />
                      <div className="w-2 h-2 rounded-full bg-amber-400/50" />
                      <div className="w-2 h-2 rounded-full bg-emerald-400/50" />
                      <Skeleton rounded="rounded-full" className="w-20 h-2.5 ml-1" />
                    </div>
                    <Skeleton variant="emerald" rounded="rounded-md" className="w-14 h-3.5" />
                  </div>

                  {/* Mockup Canvas Shimmer */}
                  <div className="relative rounded-lg overflow-hidden border border-white/[0.08] h-28 bg-[#07090e] flex flex-col items-center justify-center p-3 text-center space-y-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                      <Cpu className="w-4 h-4 text-purple-400/60 animate-pulse" />
                    </div>
                    <Skeleton variant="purple" rounded="rounded-full" className="w-36 h-3" />
                    <Skeleton rounded="rounded-full" className="w-24 h-2" />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent animate-pulse" />
                  </div>
                </div>

                {/* Title & Tagline */}
                <div className="space-y-1.5 pt-1">
                  <Skeleton rounded="rounded-lg" className="w-3/4 h-5" />
                  <Skeleton rounded="rounded-full" className="w-full h-3" />
                  <Skeleton rounded="rounded-full" className="w-2/3 h-3" />
                </div>

                {/* Problem & Solution Container */}
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Skeleton variant="amber" rounded="rounded-full" className="w-16 h-3" />
                  </div>
                  <SkeletonText lines={2} lineHeight="h-2.5" widths={['w-full', 'w-4/5']} />
                </div>

                {/* Key Features Bullets */}
                <div className="space-y-1.5 pt-1">
                  {[1, 2, 3].map((f) => (
                    <div key={f} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400/50" />
                      <Skeleton rounded="rounded-full" className="w-4/5 h-2.5" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Metrics Pill & Action */}
              <div className="pt-3 border-t border-white/[0.06] space-y-2.5">
                <div className="flex items-center justify-between">
                  <Skeleton variant="purple" rounded="rounded-lg" className="w-24 h-5" />
                  <Skeleton variant="emerald" rounded="rounded-lg" className="w-20 h-5" />
                </div>
                <div className="w-full h-8 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                  <Skeleton rounded="rounded-full" className="w-28 h-3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
