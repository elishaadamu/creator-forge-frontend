import React from 'react'
import { Skeleton, SkeletonText, SkeletonCircle, SkeletonButton, SkeletonCard } from '../common/Skeleton'
import { Layers, Sparkles, Rocket, RefreshCw, Megaphone, TrendingUp, Flag, Layout, FileText, Code, CheckCircle2 } from 'lucide-react'

/**
 * 1. Project OS Section 2 Full Overview Skeleton
 */
export function ProjectOSSkeleton() {
  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden animate-fade-in">
      {/* Header Banner Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton variant="emerald" rounded="rounded-full" className="w-20 h-4" />
            <span className="text-slate-600">•</span>
            <Skeleton variant="default" rounded="rounded-full" className="w-32 h-4" />
          </div>
          <Skeleton variant="default" rounded="rounded-lg" className="w-64 h-7" />
          <div className="flex items-center gap-2 pt-1">
            <Skeleton variant="default" rounded="rounded-full" className="w-28 h-3.5" />
            <Skeleton variant="emerald" rounded="rounded-full" className="w-36 h-3.5" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <SkeletonButton width={110} height={36} variant="purple" />
          <SkeletonButton width={130} height={36} variant="default" />
        </div>
      </div>

      {/* KPI Top Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="p-4 rounded-2xl bg-[#0e1117]/90 border border-white/[0.08] space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton rounded="rounded-full" className="w-16 h-3" />
              <SkeletonCircle size={16} />
            </div>
            <Skeleton rounded="rounded-lg" className="w-24 h-6" />
            <Skeleton rounded="rounded-full" className="w-28 h-2.5" />
          </div>
        ))}
      </div>

      {/* Phase 1-5 Milestone Matrix */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton rounded="rounded-full" className="w-48 h-4" />
          <Skeleton rounded="rounded-full" className="w-24 h-3" />
        </div>

        <div className="space-y-2.5">
          {[
            { num: '1. Validation Plan & Target Specification', color: 'emerald' },
            { num: '2. Build Validation Assets & Live Funnel', color: 'purple' },
            { num: '3. 7-Day Creator Launch Campaign', color: 'blue' },
            { num: '4. Live Telemetry & Growth Optimizations', color: 'amber' },
            { num: '5. Executive Validation Gate Milestone', color: 'emerald' }
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-[#141720]/80 border border-white/[0.06] flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <SkeletonCircle size={22} variant={item.color} />
                <div className="space-y-1">
                  <Skeleton rounded="rounded-full" className="w-56 sm:w-72 h-3.5" />
                  <Skeleton rounded="rounded-full" className="w-36 sm:w-48 h-2.5" />
                </div>
              </div>
              <Skeleton variant={item.color} rounded="rounded-full" className="w-20 h-5 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * 2. Phase 1 Validation View Skeleton
 */
export function Phase1ValidateSkeleton() {
  return (
    <div className="space-y-5 w-full max-w-full overflow-hidden animate-fade-in">
      {/* 5-Step Progress Nav Skeleton */}
      <div className="p-2 rounded-2xl bg-[#0e1117] border border-white/[0.08] flex items-center justify-between overflow-x-auto gap-2">
        <div className="flex items-center gap-2 min-w-max">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} rounded="rounded-xl" className="w-24 h-7" />
          ))}
        </div>
        <Skeleton variant="emerald" rounded="rounded-xl" className="w-32 h-7 shrink-0" />
      </div>

      {/* Main Spec Card Skeleton */}
      <div className="p-6 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-6">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
          <div className="space-y-1.5">
            <Skeleton rounded="rounded-full" className="w-48 h-4" />
            <Skeleton rounded="rounded-full" className="w-72 h-3" />
          </div>
          <SkeletonButton width={120} height={32} variant="purple" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SkeletonCard lines={4} hasHeader={true} />
          <SkeletonCard lines={4} hasHeader={true} />
        </div>

        <div className="grid grid-cols-3 gap-3 pt-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-2">
              <Skeleton rounded="rounded-full" className="w-20 h-3" />
              <Skeleton rounded="rounded-lg" className="w-16 h-5" />
              <Skeleton rounded="rounded-full" className="w-full h-2" />
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
    <div className="space-y-4 p-5 rounded-2xl bg-[#0e1117] border border-purple-500/20 shadow-lg shadow-purple-950/20 animate-fade-in">
      <div className="flex items-center justify-between border-b border-white/[0.07] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
            <Sparkles className="w-4 h-4 animate-spin" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              <span>Generating 7-Day Campaign Kit with AI...</span>
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            </h4>
            <p className="text-[10px] text-slate-400">
              Synthesizing Instagram Stories, TikTok scripts, VIP email newsletter, and 1-on-1 DM sequences.
            </p>
          </div>
        </div>
        <Skeleton variant="purple" rounded="rounded-full" className="w-24 h-5" />
      </div>

      {/* Shimmer Schedule Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
        {['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'].map((day, i) => (
          <div key={i} className="p-3 rounded-xl bg-[#141720] border border-white/[0.06] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-slate-400">{day}</span>
              <SkeletonCircle size={10} variant="purple" />
            </div>
            <Skeleton rounded="rounded-full" className="w-full h-2.5" />
            <Skeleton rounded="rounded-full" className="w-3/4 h-2" />
          </div>
        ))}
      </div>

      {/* Shimmer Copy Previews */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
        <div className="p-4 rounded-xl bg-[#141720] border border-white/[0.06] space-y-2.5">
          <div className="flex items-center gap-2">
            <SkeletonCircle size={18} variant="purple" />
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
        <SkeletonButton width={130} height={30} variant="purple" />
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
 * 9. Creator Partner Portal Skeleton
 */
export function CreatorPortalSkeleton() {
  return (
    <div className="min-h-screen bg-[#090b0e] text-white p-4 sm:p-8 space-y-6 max-w-5xl mx-auto animate-fade-in">
      {/* Top Banner Skeleton */}
      <div className="p-6 rounded-3xl bg-[#0e1117] border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <SkeletonCircle size={48} variant="purple" />
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Skeleton rounded="rounded-full" className="w-48 h-4" />
              <Skeleton variant="emerald" rounded="rounded-full" className="w-16 h-4" />
            </div>
            <Skeleton rounded="rounded-full" className="w-64 h-3" />
          </div>
        </div>

        <Skeleton variant="emerald" rounded="rounded-2xl" className="w-44 h-12 shrink-0" />
      </div>

      {/* Tabs Skeleton */}
      <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3">
        <Skeleton rounded="rounded-xl" className="w-32 h-8" />
        <Skeleton rounded="rounded-xl" className="w-32 h-8" />
        <Skeleton rounded="rounded-xl" className="w-32 h-8" />
      </div>

      {/* Checklist Rows Skeleton */}
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map(i => (
          <div
            key={i}
            className="p-4 rounded-2xl bg-[#0e1117] border border-white/[0.06] flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <SkeletonCircle size={22} variant="purple" />
              <div className="space-y-1">
                <Skeleton rounded="rounded-full" className="w-48 sm:w-64 h-3.5" />
                <Skeleton rounded="rounded-full" className="w-32 sm:w-44 h-2.5" />
              </div>
            </div>
            <SkeletonButton width={90} height={30} variant="default" />
          </div>
        ))}
      </div>
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
          <SkeletonCircle size={32} variant="purple" />
          <Skeleton rounded="rounded-full" className="w-36 h-4" />
        </div>
        <SkeletonButton width={120} height={34} variant="purple" />
      </div>

      {/* Hero Body */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-6 sm:p-12 text-center space-y-6">
        <Skeleton rounded="rounded-full" className="w-40 h-5 mx-auto" variant="emerald" />
        <Skeleton rounded="rounded-2xl" className="w-full h-12 max-w-xl mx-auto" />
        <Skeleton rounded="rounded-full" className="w-4/5 h-4 mx-auto" />

        {/* Pricing pass cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 max-w-xl mx-auto">
          <div className="p-5 rounded-2xl bg-[#0e1117] border border-purple-500/30 space-y-3">
            <Skeleton rounded="rounded-full" className="w-28 h-3.5" />
            <Skeleton rounded="rounded-lg" className="w-20 h-7" variant="emerald" />
            <SkeletonText lines={2} />
            <SkeletonButton width="100%" height={38} variant="purple" />
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
 * 11. Follow-Up CRM & Inbox Skeleton Table
 */
export function CRMSkeleton() {
  return (
    <div className="space-y-4 w-full animate-fade-in">
      {/* Search & Filter Bar Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-[#0e1117] border border-white/[0.08]">
        <Skeleton rounded="rounded-xl" className="w-full sm:w-64 h-9" />
        <div className="flex items-center gap-2">
          <Skeleton rounded="rounded-lg" className="w-20 h-8" />
          <Skeleton rounded="rounded-lg" className="w-20 h-8" />
          <Skeleton rounded="rounded-lg" className="w-24 h-8" variant="purple" />
        </div>
      </div>

      {/* Directory Table Rows */}
      <div className="rounded-2xl bg-[#0e1117] border border-white/[0.08] overflow-hidden divide-y divide-white/[0.04]">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <SkeletonCircle size={36} variant="purple" />
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Skeleton rounded="rounded-full" className="w-32 h-3.5" />
                  <Skeleton rounded="rounded-full" className="w-16 h-3" />
                </div>
                <Skeleton rounded="rounded-full" className="w-48 h-2.5" />
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-3">
              <Skeleton variant="emerald" rounded="rounded-full" className="w-20 h-5" />
              <Skeleton rounded="rounded-full" className="w-16 h-4" />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <SkeletonButton width={70} height={28} variant="default" />
              <SkeletonButton width={80} height={28} variant="purple" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
