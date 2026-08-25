import { useEffect, useState } from 'react'
import { Rocket, Target, Layers, ExternalLink } from 'lucide-react'
import AcquisitionEngine from './AcquisitionEngine'
import ProjectOS from './ProjectOS'

export default function CreatorLaunchLayout({
  initialProject = null,
  initialCreators = [],
  api = null
}) {
  const [activeSection, setActiveSection] = useState(() => {
    try {
      return localStorage.getItem('forge_launch_active_section') || 'section1'
    } catch {
      return 'section1'
    }
  })
  const [activeProject, setActiveProject] = useState(() => {
    try {
      const savedProject = localStorage.getItem('forge_launch_active_project')
      return savedProject ? JSON.parse(savedProject) : initialProject
    } catch {
      return initialProject
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('forge_launch_active_section', activeSection)
      if (activeProject) {
        localStorage.setItem('forge_launch_active_project', JSON.stringify(activeProject))
      }
    } catch (error) {
      console.warn('[CreatorLaunch] Failed to persist launch state:', error)
    }
  }, [activeSection, activeProject])

  const handleCreateProjectFromConcept = (newProjData) => {
    setActiveProject(prev => ({
      ...prev,
      ...newProjData,
      currentPhase: 1,
    }))
    setActiveSection('section2')
  }

  return (
    <div className="min-h-screen bg-[#090b0e] text-slate-100 font-sans flex flex-col">
      {/* Top Navbar */}
      <header className="h-14 border-b border-white/[0.08] bg-[#0d0f14] sticky top-0 z-50 flex items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.location.href = '/'}>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
              <Rocket className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white tracking-tight text-sm">Creator Launch</span>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  OS
                </span>
              </div>
            </div>
          </div>

          <div className="h-4 w-px bg-white/10 hidden md:block" />

          {/* Section Switcher Tabs */}
          <div className="hidden md:flex items-center p-1 rounded-xl bg-white/[0.03] border border-white/[0.07]">
            <button
              onClick={() => setActiveSection('section1')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeSection === 'section1'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Target className="w-3.5 h-3.5 text-purple-400" />
              <span>Section 1: Acquisition & Opportunity</span>
            </button>
            <button
              onClick={() => setActiveSection('section2')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeSection === 'section2'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>Section 2: Co-Launch Project OS</span>
            </button>
          </div>
        </div>

        {/* Global Controls & Return to App */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-colors"
          >
            <span>Back to Dashboard</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </button>
        </div>
      </header>

      {/* Main Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Mobile Section Switcher */}
        <div className="flex md:hidden items-center p-1 rounded-xl bg-white/[0.03] border border-white/[0.07]">
          <button
            onClick={() => setActiveSection('section1')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold ${
              activeSection === 'section1' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-slate-400'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Section 1: Acquisition</span>
          </button>
          <button
            onClick={() => setActiveSection('section2')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold ${
              activeSection === 'section2' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-400'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Section 2: Project OS</span>
          </button>
        </div>

        {/* Section 1 or Section 2 Container */}
        {activeSection === 'section1' ? (
          <AcquisitionEngine
            initialCreators={initialCreators}
            api={api}
            onCreateProject={handleCreateProjectFromConcept}
            onGoToProjectOS={() => setActiveSection('section2')}
          />
        ) : (
          <ProjectOS
            project={activeProject}
            api={api}
            onUpdateProject={setActiveProject}
            onGoToAcquisition={() => setActiveSection('section1')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-4 text-center text-xs text-slate-500 bg-[#090b0e]">
        <p>Creator Forge Launch Engine OS &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  )
}
