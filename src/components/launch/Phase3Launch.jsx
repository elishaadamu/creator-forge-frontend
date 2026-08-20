import { useState } from 'react'
import { Rocket, TrendingUp } from 'lucide-react'

export default function Phase3Launch({ project, api }) {
  const [activeTab, setActiveTab] = useState('monitor')

  return (
    <div className="space-y-6">
      {/* Sub-nav for Phase 3 Steps */}
      <div className="flex items-center justify-between p-2 rounded-2xl bg-[#0e1117] border border-white/[0.08]">
        <div className="flex items-center gap-1">
          {[
            { id: 'prep', label: '1. Launch Strategy' },
            { id: 'monitor', label: '2. Live Monitor' },
            { id: 'manager', label: '3. AI Launch Manager' },
            { id: 'report', label: '4. Decision Gate' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                activeTab === tab.id
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Live Launch Monitor */}
      {activeTab === 'monitor' && (
        <div className="p-5 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-4">
          <div className="border-b border-white/[0.07] pb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Production Telemetry & Live Revenue</span>
            </h3>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              Live
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-xs">
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-emerald-400 font-bold block uppercase">Monthly Revenue</span>
              <span className="text-base font-extrabold text-white mt-1 block">$0 MRR</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#161a23] border border-white/[0.08]">
              <span className="text-slate-400 font-bold block uppercase">Active Customers</span>
              <span className="text-base font-bold text-white mt-1 block">0 Active</span>
            </div>
          </div>
        </div>
      )}

      {/* 4. Launch Decision Gate */}
      {activeTab === 'report' && (
        <div className="p-5 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-4">
          <div className="border-b border-white/[0.07] pb-3">
            <h3 className="text-sm font-bold text-white">Phase 3 Launch Decision Gate</h3>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button className="py-2.5 px-5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs">
              SCALE
            </button>
            <button className="py-2.5 px-4 rounded-xl bg-white/[0.04] text-slate-300 border border-white/[0.08] text-xs font-semibold">
              Iterate
            </button>
            <button className="py-2.5 px-4 rounded-xl bg-white/[0.04] text-slate-300 border border-white/[0.08] text-xs font-semibold">
              Maintain
            </button>
            <button className="py-2.5 px-4 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 text-xs font-bold">
              Kill
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
