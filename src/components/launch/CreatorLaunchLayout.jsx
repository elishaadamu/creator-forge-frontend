import { useEffect, useState } from 'react'
import { Rocket, Target, Layers, ExternalLink, LogOut, User, Lock, X } from 'lucide-react'
import AcquisitionEngine from './AcquisitionEngine'
import ProjectOS from './ProjectOS'
import { createCoLaunchProject, getCoLaunchProject } from '../../services/opsApi'

export default function CreatorLaunchLayout({
  initialProject = null,
  initialCreators = [],
  api = null
}) {
  const [activeSection, setActiveSection] = useState(() => {
    try {
      const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
      const secParam = searchParams?.get('section')
      const projParam = searchParams?.get('project')
      // Section 2 can ONLY be accessed directly if the admin project link is provided
      if (secParam === 'section2' && projParam) return 'section2'
      return 'section1'
    } catch {
      return 'section1'
    }
  })
  const [activeProject, setActiveProject] = useState(() => {
    try {
      const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
      const projParam = searchParams?.get('project')
      // Strictly load project ONLY if authorized by the creator's admin URL
      if (projParam) {
        const savedProject = localStorage.getItem('forge_launch_active_project')
        if (savedProject) {
          const parsed = JSON.parse(savedProject)
          if (parsed?.id === projParam) return parsed
        }
      }
      return null
    } catch {
      return null
    }
  })
  const [showLockedModal, setShowLockedModal] = useState(false)

  // Read active individual user / admin profile
  const [userProfile, setUserProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('forge_user_profile')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  const userDisplayName = userProfile?.name || userProfile?.username || userProfile?.email || 'Admin'
  const userInitial = userDisplayName.replace('@', '').charAt(0).toUpperCase() || 'A'

  // Logout handler: resets pipeline to Section 1, Step 1, locks Section 2, and cleans caches
  const handleLogout = () => {
    try {
      localStorage.removeItem('forge_active_session')
      localStorage.removeItem('forge_user_profile')
      localStorage.removeItem('forge_login_timestamp')
      localStorage.removeItem('ops_admin_auth')
      localStorage.removeItem('ops_authenticated')

      // Clear Section 2 project and lock it completely
      localStorage.removeItem('forge_launch_active_project')
      localStorage.setItem('forge_launch_active_section', 'section1')
      localStorage.setItem('forge_launch_active_step', '1')
      localStorage.setItem('forge_launch_acquisition_step', '1')

      // Clear pipeline state so Step 1 starts fresh
      localStorage.removeItem('forge_launch_discovered_creators')
      localStorage.removeItem('forge_launch_real_threads')
      localStorage.removeItem('forge_launch_pitch_sent_map')
      localStorage.removeItem('forge_launch_answer_sent_map')
      localStorage.removeItem('forge_launch_persuasion_sent_map')
      localStorage.removeItem('forge_launch_ai_choice_map')
      localStorage.removeItem('forge_creator_data')
    } catch (e) {
      console.warn('Logout cleanup error:', e)
    }

    setActiveProject(null)
    setActiveSection('section1')

    // Navigate to Section 1 Step 1 and do full reload to guarantee clean state
    window.location.href = '/launch?section=section1&step=1'
  }

  // Deep-link handler: Load specific project & section from URL query params (?section=section2&project=proj_xxx)
  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search)
      const secParam = searchParams.get('section')
      const projIdParam = searchParams.get('project')

      if (secParam === 'section2' || secParam === 'section1') {
        setActiveSection(secParam)
      }

      if (projIdParam) {
        import('../../services/opsApi').then(({ getCoLaunchProject, getCoLaunchProjects }) => {
          getCoLaunchProject(projIdParam)
            .then((p) => {
              if (p && p.id) {
                setActiveProject(p)
                try {
                  localStorage.setItem('forge_launch_active_project', JSON.stringify(p))
                  localStorage.setItem('forge_launch_active_section', 'section2')
                } catch {}
                setActiveSection('section2')
              }
            })
            .catch(() => {
              getCoLaunchProjects().then((projs) => {
                const matched = projs?.find((item) => item.id === projIdParam)
                if (matched) {
                  setActiveProject(matched)
                  setActiveSection('section2')
                }
              })
            })
        })
      }
    } catch (e) {
      console.warn('[CreatorLaunchLayout] URL parameter parse error:', e)
    }
  }, [])

  // Keep section & project in localStorage
  useEffect(() => {
    try {
      localStorage.setItem('forge_launch_active_section', activeSection)
      if (activeProject) {
        localStorage.setItem('forge_launch_active_project', JSON.stringify(activeProject))
      }
    } catch (e) {
      console.warn('Failed to sync creator launch state to localStorage', e)
    }
  }, [activeSection, activeProject])

  // Synchronize with backend DB: ONLY sync if project was authorized via Admin URL or freshly launched
  useEffect(() => {
    let isMounted = true
    const syncDbProjects = async () => {
      try {
        const searchParams = new URLSearchParams(window.location.search)
        const projIdParam = searchParams.get('project')
        const targetId = projIdParam || activeProject?.id

        if (!targetId) {
          // No admin project URL specified -> Section 2 remains strictly locked
          return
        }

        const { getCoLaunchProjects } = await import('../../services/opsApi')
        const projects = await getCoLaunchProjects()
        if (isMounted && projects) {
          const matched = projects.find(p => p.id === targetId)
          if (matched) {
            setActiveProject(prev => {
              if (!prev || prev.id !== matched.id || prev.status !== matched.status) {
                try {
                  localStorage.setItem('forge_launch_active_project', JSON.stringify(matched))
                } catch {}
                return matched
              }
              return prev
            })
          }
        }
      } catch (err) {
        console.warn('[CreatorLaunchLayout] Background project sync error:', err)
      }
    }

    syncDbProjects()
    return () => {
      isMounted = false
    }
  }, [activeProject?.id])

  const handleCreateProjectFromConcept = async (newProjData) => {
    const projId = `proj_${Date.now()}`
    const cleanProject = {
      id: projId,
      createdAt: new Date().toISOString(),
      currentPhase: 1,
      ...newProjData,
      // Fresh metrics
      currentPresales: 0,
      presaleTarget: 5000,
      visitors: 0,
      conversionRate: 0,
      reservations: [],
      experiments: [],
      // Clear all legacy specs from former creators so the new creator starts fresh
      mvpBuildPlan: null,
      engineeringTasks: null,
      betaFeedback: null,
      feedbackClusters: null,
      readinessReport: null,
      campaignKit: null,
      surveyData: null,
      surveyResponses: [],
      launchStrategy: null,
      creatorAssets: null,
      launchTelemetry: null,
    }
    setActiveProject(cleanProject)
    try {
      localStorage.setItem('forge_launch_active_project', JSON.stringify(cleanProject))
    } catch (e) {}
    setActiveSection('section2')

    // Persist to backend database tables in SQLite
    try {
      const dbProj = await createCoLaunchProject({ ...newProjData, id: projId })
      if (dbProj && dbProj.id) {
        setActiveProject(prev => {
          const merged = { ...(prev || {}), ...dbProj }
          try {
            localStorage.setItem('forge_launch_active_project', JSON.stringify(merged))
          } catch {}
          return merged
        })
      }
    } catch (err) {
      console.warn('[CreatorLaunchLayout] Project DB sync warning:', err)
    }
  }

  const handleResetProject = () => {
    try {
      localStorage.removeItem('forge_launch_active_project')
    } catch (e) {}
    setActiveProject(null)
    setActiveSection('section1')
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
              onClick={() => {
                if (activeProject) {
                  setActiveSection('section2')
                } else {
                  setShowLockedModal(true)
                }
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeSection === 'section2'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : activeProject
                    ? 'text-slate-400 hover:text-white'
                    : 'text-slate-500 hover:text-slate-400'
              }`}
            >
              {activeProject ? (
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-amber-400/80" />
              )}
              <span>Section 2: Co-Launch Project OS</span>
              {!activeProject && (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400/90 border border-amber-500/20">
                  Locked
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Global Controls, User Profile & Logout */}
        <div className="flex items-center gap-3">
          {/* Active Individual User Profile Badge */}
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08]">
            <div className="w-6 h-6 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-[11px] font-bold text-purple-300">
              {userInitial}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-200 leading-tight max-w-[120px] truncate">
                {userDisplayName}
              </span>
              <span className="text-[9px] text-slate-400 font-mono leading-tight">
                Operator Admin
              </span>
            </div>
          </div>

          <button
            onClick={() => window.location.href = '/dashboard'}
            className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-colors"
          >
            <span>Back to Dashboard</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </button>

          {/* Individual User Logout Button */}
          <button
            onClick={handleLogout}
            title={`Logout ${userDisplayName}`}
            className="flex items-center gap-1.5 text-xs font-semibold text-rose-300 hover:text-rose-100 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/25 transition-all cursor-pointer shadow-sm"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Logout</span>
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
            onClick={() => {
              if (activeProject) {
                setActiveSection('section2')
              } else {
                setShowLockedModal(true)
              }
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold ${
              activeSection === 'section2' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-400'
            }`}
          >
            {activeProject ? <Layers className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5 text-amber-400/80" />}
            <span>Section 2: Project OS</span>
            {!activeProject && (
              <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-amber-500/10 text-amber-400/90 border border-amber-500/20">
                Locked
              </span>
            )}
          </button>
        </div>

        {/* Section 1 or Section 2 Container */}
        {activeSection === 'section1' ? (
          <AcquisitionEngine
            initialCreators={initialCreators}
            api={api}
            onCreateProject={handleCreateProjectFromConcept}
            onGoToProjectOS={() => setActiveSection('section2')}
            onResetAll={() => {
              setActiveProject(null)
              setActiveSection('section1')
              try {
                localStorage.removeItem('forge_launch_active_project')
                localStorage.setItem('forge_launch_active_section', 'section1')
              } catch (e) {}
            }}
          />
        ) : activeProject ? (
          <ProjectOS
            project={activeProject}
            api={api}
            onUpdateProject={setActiveProject}
            onGoToAcquisition={() => setActiveSection('section1')}
            onResetProject={handleResetProject}
          />
        ) : (
          <div className="p-12 rounded-2xl bg-[#0e1117] border border-white/[0.08] text-center space-y-4 max-w-lg mx-auto my-12">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-white">Section 2: Project OS Locked</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Section 2 cannot be accessed directly without an authorized project link. To access this creator's Co-Launch Project OS, open the <strong>Admin Project OS Dashboard</strong> link sent to your briefing email.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setActiveSection('section1')}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Go to Section 1: Acquisition Engine
              </button>
            </div>
          </div>
        )}

        {/* Section 2 Locked Warning Modal */}
        {showLockedModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
            <div className="w-full max-w-md bg-[#12151c] border border-amber-500/30 rounded-2xl p-6 shadow-2xl space-y-4 relative">
              <button
                onClick={() => setShowLockedModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Section 2: Project OS Locked</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Section 2 cannot be accessed again unless you use the dedicated <strong>Admin Project OS Dashboard</strong> URL dispatched to your admin email for that creator:
              </p>
              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.08] text-[11px] font-mono text-purple-300 break-all">
                /launch?section=section2&project=proj_xxx
              </div>
              <p className="text-[11px] text-slate-400">
                Alternatively, you can complete Section 1 Step 6 to acquire a new creator and initialize a fresh venture.
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowLockedModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors"
                >
                  Understood
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-4 text-center text-xs text-slate-500 bg-[#090b0e]">
        <p>Creator Forge Launch Engine OS &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  )
}
