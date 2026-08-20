import { useState } from 'react'
import { Code, Cpu, Terminal } from 'lucide-react'

export default function Phase2BuildMVP({ project, api, onAdvanceToPhase3 }) {
  const [activeTab, setActiveTab] = useState('build')

  return (
    <div className="space-y-6">
      {/* Sub-nav for Phase 2 Steps */}
      <div className="flex items-center justify-between p-2 rounded-2xl bg-[#0e1117] border border-white/[0.08]">
        <div className="flex items-center gap-1">
          {[
            { id: 'spec', label: '1. Product Spec' },
            { id: 'build', label: '2. Engineering Build' },
            { id: 'beta', label: '3. Beta Testing' },
            { id: 'gate', label: '4. MVP Launch Gate' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                activeTab === tab.id
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Build MVP Execution */}
      {activeTab === 'build' && (
        <div className="p-5 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-4">
          <div className="border-b border-white/[0.07] pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Code className="w-4 h-4 text-blue-400" />
              <span>Engineering Build & AI Coding Tasks</span>
            </h3>
          </div>
          <div className="text-xs text-slate-400">
            Build task pipeline ready for API integration.
          </div>
        </div>
      )}

      {/* 4. Launch Gate Checkpoint */}
      {activeTab === 'gate' && (
        <div className="p-5 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-4">
          <div className="border-b border-white/[0.07] pb-3">
            <h3 className="text-sm font-bold text-white">Phase 2 Gate: MVP Launch Readiness</h3>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={onAdvanceToPhase3}
              className="py-2.5 px-5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs"
            >
              Approve & Launch Product (Advance to Phase 3)
            </button>
            <button className="py-2.5 px-4 rounded-xl bg-white/[0.04] text-slate-300 border border-white/[0.08] text-xs font-semibold">
              Continue Beta
            </button>
            <button className="py-2.5 px-4 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 text-xs font-bold">
              Kill Project
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
