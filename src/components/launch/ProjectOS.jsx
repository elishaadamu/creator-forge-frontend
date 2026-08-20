import { useState } from 'react'
import {
  Layers, CheckCircle2, ArrowRight, Activity, CheckSquare, Sparkles, BarChart2
} from 'lucide-react'
import Phase1Validate from './Phase1Validate'
import Phase2BuildMVP from './Phase2BuildMVP'
import Phase3Launch from './Phase3Launch'

export default function ProjectOS({ project, api, onUpdateProject, onGoToAcquisition }) {
  const [activeTab, setActiveTab] = useState('overview')

  if (!project) {
    return (
      <div className="p-12 rounded-2xl bg-[#0e1117] border border-white/[0.08] text-center space-y-4">
        <p className="text-xs text-slate-400">No active Co-Launch project loaded yet.</p>
        <button
          onClick={onGoToAcquisition}
          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs"
        >
          Go to Section 1: Acquire Creator
        </button>
      </div>
    )
  }

  const currentPhase = project.currentPhase || 1

  const handleAdvancePhase = (nextPhase) => {
    onUpdateProject?.(prev => ({
      ...prev,
      currentPhase: nextPhase
    }))
  }

  return (
    <div className="space-y-6">
      {/* Project Command Center Header */}
      <div className="p-5 rounded-2xl bg-[#0e1117] border border-emerald-500/20 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {project.creatorAvatar && (
              <img
                src={project.creatorAvatar}
                alt=""
                className="w-12 h-12 rounded-2xl object-cover border border-emerald-500/30"
              />
            )}
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Co-Launch Project OS</span>
                {project.opportunityScore && (
                  <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                    Score: {project.opportunityScore}/100
                  </span>
                )}
              </div>
              <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <span>{project.productName || 'Project'}</span>
                {project.creatorName && (
                  <span className="text-xs text-slate-400">× {project.creatorName}</span>
                )}
              </h1>
              {project.productTagline && (
                <p className="text-xs text-slate-300 mt-0.5">{project.productTagline}</p>
              )}
            </div>
          </div>

          <button
            onClick={onGoToAcquisition}
            className="self-start md:self-auto px-3.5 py-2 rounded-xl bg-white/[0.04] text-slate-300 hover:text-white border border-white/[0.08] text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <span>Acquisition Engine (Section 1)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 3 Progressive Phase Gates Bar */}
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/[0.08]">
          {[
            { phase: 1, title: 'PHASE 1: VALIDATE', subtitle: 'Prove Demand Before Build' },
            { phase: 2, title: 'PHASE 2: BUILD MVP', subtitle: 'AI & Human Spec Build' },
            { phase: 3, title: 'PHASE 3: LAUNCH', subtitle: 'Production Revenue & Scale' },
          ].map(p => {
            const isCurrent = currentPhase === p.phase
            const isDone = currentPhase > p.phase
            return (
              <button
                key={p.phase}
                onClick={() => handleAdvancePhase(p.phase)}
                className={`p-3.5 rounded-xl text-left border transition-colors ${
                  isCurrent
                    ? 'bg-emerald-950/40 border-emerald-500/50 text-white'
                    : isDone
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                    : 'bg-white/[0.02] border-white/[0.06] text-slate-500'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider">{p.title}</span>
                  {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                </div>
                <p className="text-xs font-semibold">{p.subtitle}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Command Center Tabs */}
      <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3">
        {[
          { id: 'overview', label: 'Overview', icon: Layers },
          { id: 'progress', label: 'Phase Execution', icon: Activity },
          { id: 'performance', label: 'Performance & KPIs', icon: BarChart2 },
          { id: 'work', label: 'Work & Tasks', icon: CheckSquare },
          { id: 'ai', label: 'AI Activity Log', icon: Sparkles },
        ].map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                activeTab === tab.id
                  ? 'bg-white/10 text-white border border-white/15'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Main Command Center Tab View */}
      {activeTab === 'progress' || activeTab === 'overview' ? (
        <div>
          {currentPhase === 1 && (
            <Phase1Validate project={project} api={api} onAdvanceToPhase2={() => handleAdvancePhase(2)} />
          )}
          {currentPhase === 2 && (
            <Phase2BuildMVP project={project} api={api} onAdvanceToPhase3={() => handleAdvancePhase(3)} />
          )}
          {currentPhase === 3 && (
            <Phase3Launch project={project} api={api} />
          )}
        </div>
      ) : null}

      {/* Performance & KPIs Tab */}
      {activeTab === 'performance' && (
        <div className="p-5 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-4">
          <h3 className="text-sm font-bold text-white">Performance & KPIs</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-xs">
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-emerald-400 font-bold block uppercase">Presales Revenue</span>
              <span className="text-base font-extrabold text-white mt-1 block">${project.currentPresales || '0'}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#161a23] border border-white/[0.08]">
              <span className="text-slate-400 font-bold block uppercase">Target Goal</span>
              <span className="text-base font-bold text-white mt-1 block">${project.targetRevenue || '5,000'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Work & Tasks Tab */}
      {activeTab === 'work' && (
        <div className="p-5 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-4">
          <h3 className="text-sm font-bold text-white">Work: AI Tasks, Creator Tasks & Co-Launch Tasks</h3>
          <div className="text-xs text-slate-400">
            Task execution stream ready for API integration.
          </div>
        </div>
      )}

      {/* AI Activity Log Tab */}
      {activeTab === 'ai' && (
        <div className="p-5 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-4">
          <h3 className="text-sm font-bold text-white">AI Activity Log</h3>
          <div className="text-xs text-slate-400">
            AI recommendations & action stream.
          </div>
        </div>
      )}
    </div>
  )
}
