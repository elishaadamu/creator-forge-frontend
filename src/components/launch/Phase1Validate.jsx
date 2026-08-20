import { useState } from 'react'
import { CheckCircle2, DollarSign, ExternalLink, Layout } from 'lucide-react'

export default function Phase1Validate({ project, api, onAdvanceToPhase2 }) {
  const [activeTab, setActiveTab] = useState('plan')
  const [presalesRevenue] = useState(project?.currentPresales ? Number(String(project.currentPresales).replace(/[^0-9.]/g, '')) : 0)
  const [presaleTarget] = useState(5000)
  const [checklist, setChecklist] = useState(project?.checklist || [])

  const toggleChecklist = (id) => {
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, done: !item.done } : item))
  }

  const isGatePassed = presalesRevenue >= presaleTarget

  return (
    <div className="space-y-6">
      {/* Sub-nav for Phase 1 Steps */}
      <div className="flex items-center justify-between p-2 rounded-2xl bg-[#0e1117] border border-white/[0.08]">
        <div className="flex items-center gap-1">
          {[
            { id: 'plan', label: '1. Validation Plan' },
            { id: 'campaign', label: '2. Validation Campaign' },
            { id: 'checklist', label: '3. Creator Daily Checklist' },
            { id: 'gate', label: '4. Validation Gate' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                activeTab === tab.id
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-400">
          <DollarSign className="w-3.5 h-3.5" />
          <span>${presalesRevenue.toLocaleString()} / ${presaleTarget.toLocaleString()} Presales</span>
        </div>
      </div>

      {/* 1. Validation Plan */}
      {activeTab === 'plan' && (
        <div className="p-5 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-4">
          <div className="border-b border-white/[0.07] pb-3">
            <h3 className="text-sm font-bold text-white">Validation Plan Specification</h3>
            <p className="text-xs text-slate-400">Customer, problem, offer, pricing & validation threshold</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-[#161a23] border border-white/[0.08] space-y-1">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Target Customer</span>
              <p className="text-white">Target audience derived from creator channel analysis.</p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#161a23] border border-white/[0.08] space-y-1">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Core Offer</span>
              <p className="text-white">Presale access discount offer for {project?.productName || 'product'}.</p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#161a23] border border-white/[0.08] space-y-1">
              <span className="text-emerald-400 font-bold uppercase text-[10px]">Validation Threshold</span>
              <p className="text-emerald-300 font-bold">${presaleTarget.toLocaleString()} in presales within 14 days.</p>
            </div>
          </div>
        </div>
      )}

      {/* 2. Validation Campaign */}
      {activeTab === 'campaign' && (
        <div className="p-5 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-4">
          <div className="border-b border-white/[0.07] pb-3">
            <h3 className="text-sm font-bold text-white">Validation Campaign Assets</h3>
            <p className="text-xs text-slate-400">Landing page & waitlist infrastructure</p>
          </div>

          <div className="p-4 rounded-xl bg-[#161a23] border border-white/[0.08] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Layout className="w-6 h-6 text-purple-400" />
              <div>
                <h4 className="text-xs font-bold text-white">Waitlist & Presale Landing Page</h4>
                <p className="text-[11px] text-slate-400">Attribution analytics connected</p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              Deployed
            </span>
          </div>
        </div>
      )}

      {/* 3. Creator Daily Checklist */}
      {activeTab === 'checklist' && (
        <div className="p-5 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-4">
          <div className="border-b border-white/[0.07] pb-3">
            <h3 className="text-sm font-bold text-white">Creator Daily Checklist</h3>
            <p className="text-xs text-slate-400">Simple actionable tasks for creator</p>
          </div>

          {checklist.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No checklist items added yet.
            </div>
          ) : (
            <div className="space-y-2">
              {checklist.map(item => (
                <div
                  key={item.id}
                  onClick={() => toggleChecklist(item.id)}
                  className={`p-3.5 rounded-xl border transition-colors cursor-pointer flex items-center justify-between text-xs ${
                    item.done
                      ? 'bg-emerald-950/20 border-emerald-500/30 text-slate-400'
                      : 'bg-[#161a23] border-white/[0.08] text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className={`w-4 h-4 ${item.done ? 'text-emerald-400' : 'text-slate-600'}`} />
                    <span>{item.text}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. Validation Gate */}
      {activeTab === 'gate' && (
        <div className="p-5 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-4">
          <div className="border-b border-white/[0.07] pb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Validation Gate Checkpoint</h3>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
              isGatePassed ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
            }`}>
              Result: {isGatePassed ? 'PASS' : 'PENDING'}
            </span>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={onAdvanceToPhase2}
              className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
            >
              Approve & Advance to Phase 2: Build MVP
            </button>
            <button className="py-2.5 px-4 rounded-xl bg-white/[0.04] text-slate-300 border border-white/[0.08] text-xs font-semibold">
              Test Again
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
