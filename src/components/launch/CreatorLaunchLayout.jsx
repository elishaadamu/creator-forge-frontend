import { useEffect, useState } from 'react'
import { Rocket, Target, Layers, ExternalLink, LogOut, User, X, ShieldAlert, Lock, Users } from 'lucide-react'
import AcquisitionEngine from './AcquisitionEngine'
import ProjectOS from './ProjectOS'
import AdminPipelineLookup from './AdminPipelineLookup'
import CreatorFollowUpCRM from './CreatorFollowUpCRM'
import { createCoLaunchProject, getCoLaunchProject } from '../../services/opsApi'
import { updatePageSEO } from '../../utils/seo'

export default function CreatorLaunchLayout({
  initialProject = null,
  initialCreators = [],
  api = null
}) {
  useEffect(() => {
    updatePageSEO({
      title: "Operator Master Studio — Acquisition Engine & Launch OS | Creator Forge",
      description: "End-to-end creator discovery, audience intelligence, autonomous outreach, and 50/50 venture launch pipeline.",
      image: "/og-image.svg"
    });
  }, []);
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
      const savedProject = localStorage.getItem('forge_launch_active_project')
      if (savedProject) {
        return JSON.parse(savedProject)
      }
      return null
    } catch {
      return null
    }
  })
  const [showAdminLookup, setShowAdminLookup] = useState(false)
  const [showFollowUpCRM, setShowFollowUpCRM] = useState(false)
  const [crmCreators, setCrmCreators] = useState([])
  const [crmThreads, setCrmThreads] = useState([])
  const [isSyncingCrmImap, setIsSyncingCrmImap] = useState(false)

  const fetchCrmData = async () => {
    try {
      const { getCreators, getThreads } = await import('../../services/opsApi')
      const [creatorsRes, threadsRes] = await Promise.allSettled([
        getCreators({ limit: 50 }),
        getThreads(),
      ])
      if (creatorsRes.status === 'fulfilled' && creatorsRes.value) {
        const rawList = Array.isArray(creatorsRes.value) ? creatorsRes.value : creatorsRes.value?.creators || []
        setCrmCreators(rawList)
      }
      if (threadsRes.status === 'fulfilled' && threadsRes.value) {
        setCrmThreads(Array.isArray(threadsRes.value) ? threadsRes.value : [])
      }
    } catch (err) {
      console.warn('[CreatorLaunchLayout] CRM sync error:', err)
    }
  }

  const syncCrmImap = async () => {
    setIsSyncingCrmImap(true)
    try {
      const { pollInboxReplies, getThreads } = await import('../../services/opsApi')
      const res = await pollInboxReplies()
      const threads = res?.threads || (await getThreads())
      if (threads && Array.isArray(threads)) {
        setCrmThreads(threads)
      }
    } catch (e) {
      console.warn('[CreatorLaunchLayout] CRM IMAP sync error:', e)
    } finally {
      setIsSyncingCrmImap(false)
    }
  }

  const handleApproveCrmCreator = async (creatorId) => {
    setCrmCreators((prev) =>
      prev.map((c) => (c.id === creatorId || c.handle === creatorId ? { ...c, status: 'approved' } : c))
    )
    try {
      const { updateCreatorDetails } = await import('../../services/opsApi')
      await updateCreatorDetails(creatorId, { status: 'approved' })
    } catch (e) {
      console.warn('Approve CRM creator failed:', e)
    }
  }

  const handleRejectCrmCreator = async (creatorId) => {
    setCrmCreators((prev) =>
      prev.map((c) => (c.id === creatorId || c.handle === creatorId ? { ...c, status: 'rejected' } : c))
    )
    try {
      const { updateCreatorDetails } = await import('../../services/opsApi')
      await updateCreatorDetails(creatorId, { status: 'rejected' })
    } catch (e) {
      console.warn('Reject CRM creator failed:', e)
    }
  }

  const handleDeleteCrmCreator = (creatorId) => {
    setCrmCreators((prev) => prev.filter((c) => c.id !== creatorId && c.handle !== creatorId))
    fetchCrmData()
  }

  useEffect(() => {
    fetchCrmData()
  }, [activeSection])

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
    const handleUrlSync = () => {
      try {
        const searchParams = new URLSearchParams(window.location.search)
        const secParam = searchParams.get('section')
        const projIdParam = searchParams.get('project')

        if (secParam === 'section1' || secParam === 'section2') {
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
    }

    handleUrlSync()
    window.addEventListener('popstate', handleUrlSync)
    return () => window.removeEventListener('popstate', handleUrlSync)
  }, [])

  // Keep section & project in localStorage and clean URL query params
  useEffect(() => {
    try {
      localStorage.setItem('forge_launch_active_section', activeSection)
      if (activeProject) {
        localStorage.setItem('forge_launch_active_project', JSON.stringify(activeProject))
      }
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href)
        if (activeSection === 'section2') {
          url.searchParams.set('section', 'section2')
          url.searchParams.delete('step') // Clean stale Section 1 step number
          if (activeProject?.id) {
            url.searchParams.set('project', activeProject.id)
          }
        } else {
          url.searchParams.set('section', 'section1')
        }
        window.history.replaceState({}, '', url.toString())
      }
    } catch (e) {
      console.warn('Failed to sync creator launch state to localStorage', e)
    }
  }, [activeSection, activeProject])

  // Synchronize with backend DB: Sync workflow state and active projects across all devices
  useEffect(() => {
    let isMounted = true
    const syncDbState = async () => {
      try {
        const { getWorkflowState, getCoLaunchProjects } = await import('../../services/opsApi')
        const [workflowRes, projectsRes] = await Promise.allSettled([
          getWorkflowState(),
          getCoLaunchProjects(),
        ])

        if (isMounted && workflowRes.status === 'fulfilled' && workflowRes.value) {
          const ws = workflowRes.value
          const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
          const urlSec = searchParams?.get('section')
          if (!urlSec && ws.active_section) {
            setActiveSection(ws.active_section)
          }
        }

        if (isMounted && projectsRes.status === 'fulfilled' && projectsRes.value) {
          const projs = projectsRes.value
          if (Array.isArray(projs) && projs.length > 0) {
            const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
            const projIdParam = searchParams?.get('project')
            const matched = projIdParam ? projs.find(p => p.id === projIdParam) : projs[0]
            if (matched) {
              setActiveProject(prev => {
                const local = prev || (typeof localStorage !== 'undefined' ? (() => {
                  try {
                    return JSON.parse(localStorage.getItem('forge_launch_active_project') || 'null')
                  } catch {
                    return null
                  }
                })() : null)
                const resolvedPhase = Math.max(Number(matched.currentPhase || 1), Number(local?.currentPhase || 1))
                const merged = {
                  ...matched,
                  ...(local?.id === matched.id ? local : {}),
                  currentPhase: resolvedPhase,
                  status: resolvedPhase > 1 ? (local?.status || matched.status || 'building') : (matched.status || 'validating'),
                  gateDecisions: (local?.gateDecisions?.length || 0) > (matched.gateDecisions?.length || 0)
                    ? local.gateDecisions
                    : (matched.gateDecisions || local?.gateDecisions || []),
                  projectFiles: (local?.projectFiles?.length || 0) > 0 ? local.projectFiles : (matched.projectFiles || []),
                  messages: (local?.messages?.length || 0) > 0 ? local.messages : (matched.messages || [])
                }
                try {
                  localStorage.setItem('forge_launch_active_project', JSON.stringify(merged))
                } catch {}
                return merged
              })
            }
          }
        }
      } catch (err) {
        console.warn('[CreatorLaunchLayout] Cross-device sync error:', err)
      }
    }

    syncDbState()
    const syncInterval = setInterval(syncDbState, 20000)
    return () => {
      isMounted = false
      clearInterval(syncInterval)
    }
  }, [])

  const handleUpdateActiveProject = (updater) => {
    setActiveProject(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      if (!next) return next
      try {
        localStorage.setItem('forge_launch_active_project', JSON.stringify(next))
      } catch (e) {}

      // Persist to backend database tables in SQLite
      if (next.id) {
        import('../../services/opsApi').then(({ updateCoLaunchProject }) => {
          updateCoLaunchProject(next.id, {
            currentPhase: next.currentPhase,
            currentStep: next.currentStep,
            status: next.status,
            productName: next.productName,
            productTagline: next.productTagline,
            pricing: next.pricing,
            presaleTarget: next.presaleTarget,
            projectFiles: next.projectFiles || [],
            messages: next.messages || [],
            metadataInfo: {
              ...(next.metadataInfo || {}),
              activity_logs: next.activityLogs || next.adminActivity || [],
              gate_decisions: next.gateDecisions || [],
              mvpBuildPlan: next.mvpBuildPlan,
              engineeringTasks: next.engineeringTasks,
              project_files: next.projectFiles || [],
              messages: next.messages || []
            }
          }).catch(err => console.warn('[CreatorLaunchLayout] updateCoLaunchProject error:', err))
        })
      }
      return next
    })
  }

  const handleCreateProjectFromConcept = async (newProjData) => {
    const projId = `proj_${Date.now()}`
    const cleanProject = {
      id: projId,
      createdAt: new Date().toISOString(),
      currentPhase: newProjData.currentPhase || 1,
      ...newProjData,
      // Fresh metrics
      currentPresales: 0,
      presaleTarget: newProjData.presaleTarget || 12500,
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

  const handleCreateDemoProject = () => {
    handleCreateProjectFromConcept({
      creatorId: 'demo_creator_1',
      creatorName: 'TechLead Co-Launch',
      creatorHandle: '@TechLead',
      creatorEmail: 'creator@example.com',
      creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60',
      niche: 'Software & SaaS',
      productName: 'FlowForge DevOS',
      productTagline: 'AI-assisted developer workflow orchestrator and release pipeline.',
      targetAudience: 'Software engineers, founders, indie hackers',
      customer: 'Senior Developers & Technical Founders',
      problem: 'Managing fragmented CI/CD, deployment keys, and pull request testing wastes 10+ hours per sprint.',
      pricing: '$49/mo per seat',
      presaleTarget: 12500,
      currentPhase: 1,
    })
  }

  const handleResetProject = async () => {
    try {
      localStorage.removeItem('forge_launch_active_project')
      localStorage.removeItem('forge_launch_discovered_creators')
      localStorage.removeItem('forge_launch_real_threads')
      localStorage.removeItem('forge_launch_pitch_sent_map')
      localStorage.removeItem('forge_launch_answer_sent_map')
      localStorage.removeItem('forge_launch_persuasion_sent_map')
      localStorage.removeItem('forge_launch_ai_choice_map')
      localStorage.removeItem('forge_creator_data')
      localStorage.removeItem('forge_step2_timer_target')
      localStorage.setItem('forge_launch_active_section', 'section1')
      localStorage.setItem('forge_launch_active_step', '1')
      localStorage.setItem('forge_launch_acquisition_step', '1')

      const { deleteAllCreators, deleteCoLaunchProject } = await import('../../services/opsApi')
      if (activeProject?.id) {
        await deleteCoLaunchProject(activeProject.id).catch(() => {})
      }
      await deleteAllCreators().catch(() => {})
    } catch (e) {
      console.warn('Reset project and acquisition error:', e)
    }

    setActiveProject(null)
    setActiveSection('section1')
    window.location.href = '/launch?section=section1&step=1'
  }

  return (
    <div className="min-h-screen bg-[#090b0e] text-slate-100 font-sans flex flex-col">
      {/* Top Navbar */}
      <header className="h-14 border-b border-white/[0.08] bg-[#0d0f14]/95 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between px-4 sm:px-6">
        {/* Left: Brand & Navigation */}
        <div className="flex items-center gap-3 sm:gap-5 flex-shrink-0">
          <div
            className="flex items-center gap-2.5 cursor-pointer group"
            onClick={() => (window.location.href = '/')}
          >
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center group-hover:border-purple-500/50 transition-colors">
              <Rocket className="w-4 h-4 text-purple-400" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white tracking-tight text-sm">
                Creator Launch
              </span>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                OS
              </span>
            </div>
          </div>

          <div className="h-4 w-px bg-white/10 hidden md:block" />

          {/* Section Switcher Tabs */}
          <div className="flex items-center p-1 rounded-xl bg-white/[0.03] border border-white/[0.07]">
            <button
              onClick={() => {
                setActiveSection('section1')
                try {
                  const url = new URL(window.location.href)
                  url.searchParams.set('section', 'section1')
                  window.history.replaceState({}, '', url.toString())
                  import('../../services/opsApi').then(({ updateWorkflowState }) => {
                    updateWorkflowState({ active_section: 'section1' }).catch(() => {})
                  })
                } catch {}
              }}
              className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeSection === 'section1'
                  ? 'bg-purple-500/20 text-purple-200 border border-purple-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white border border-transparent'
              }`}
            >
              <Target className="w-3.5 h-3.5 text-purple-400" />
              <span>Section 1: Acquisition</span>
            </button>
            <button
              onClick={() => {
                setActiveSection('section2')
                try {
                  const url = new URL(window.location.href)
                  url.searchParams.set('section', 'section2')
                  window.history.replaceState({}, '', url.toString())
                  import('../../services/opsApi').then(({ updateWorkflowState }) => {
                    updateWorkflowState({ active_section: 'section2' }).catch(() => {})
                  })
                } catch {}
              }}
              className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeSection === 'section2'
                  ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white border border-transparent'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>Section 2: Project OS</span>
            </button>
          </div>
        </div>

        {/* Right: Actions, User Profile & Logout */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
          {/* Creator Follow-Up CRM Button — Opens /follow-up-crm in a new tab */}
          <button
            type="button"
            onClick={() => window.open('/follow-up-crm', '_blank')}
            className="flex items-center gap-1.5 px-3 h-8 rounded-xl text-xs font-semibold whitespace-nowrap bg-purple-500/15 hover:bg-purple-500/25 text-purple-200 border border-purple-500/30 transition-all cursor-pointer shadow-sm"
            title="Open Creator Outreach & Follow-Up CRM in a new tab (/follow-up-crm)"
          >
            <Users className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
            <span>Follow-Up CRM</span>
            <ExternalLink className="w-3 h-3 text-purple-300/80" />
          </button>

          {/* Admin Pipeline & Exception Lookup Button — Opens /admin-error-log in a new tab */}
          <button
            type="button"
            onClick={() => window.open('/admin-error-log', '_blank')}
            className="flex items-center gap-1.5 px-3 h-8 rounded-xl text-xs font-semibold whitespace-nowrap bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-all cursor-pointer shadow-sm"
            title="Open Admin Pipeline Oversight & Error Log in a new tab (/admin-error-log)"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
            <span>Admin Error Log</span>
            <ExternalLink className="w-3 h-3 text-rose-300/80" />
          </button>

          <div className="h-4 w-px bg-white/10 hidden md:block" />

          {/* Active Individual User Profile Badge */}
          <div className="hidden sm:flex items-center gap-2 px-2.5 h-8 rounded-xl bg-white/[0.04] border border-white/[0.08]">
            <div className="w-5 h-5 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-[10px] font-bold text-purple-300 flex-shrink-0">
              {userInitial}
            </div>
            <div className="flex items-center gap-1.5 text-left">
              <span className="text-xs font-semibold text-slate-200 leading-none max-w-[100px] truncate">
                {userDisplayName}
              </span>
              <span className="text-[9px] text-slate-400 font-mono leading-none">
                (Admin)
              </span>
            </div>
          </div>

          {/* Back to Dashboard */}
          <button
            onClick={() => (window.location.href = '/dashboard')}
            className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-2.5 h-8 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-colors whitespace-nowrap cursor-pointer"
          >
            <span className="hidden xl:inline">Back to Dashboard</span>
            <span className="xl:hidden">Dashboard</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </button>

          {/* Individual User Logout Button */}
          <button
            onClick={handleLogout}
            title={`Logout ${userDisplayName}`}
            className="flex items-center gap-1.5 text-xs font-semibold text-rose-300 hover:text-rose-100 px-3 h-8 rounded-xl bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/25 transition-all cursor-pointer shadow-sm whitespace-nowrap"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content View */}
      <main className="flex-1 w-full max-w-[1720px] mx-auto px-3 sm:px-5 py-4 space-y-5">
        {/* Mobile Section Switcher */}
        <div className="flex md:hidden items-center p-1 rounded-xl bg-white/[0.03] border border-white/[0.07] gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveSection('section1')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
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
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
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
            onUpdateProject={handleUpdateActiveProject}
            onGoToAcquisition={() => setActiveSection('section1')}
            onResetProject={handleResetProject}
          />
        ) : (
          <div className="p-10 rounded-2xl bg-[#0e1117] border border-white/[0.08] text-center space-y-5 max-w-lg mx-auto my-12 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mx-auto text-purple-400">
              <Layers className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-base font-bold text-white">No Active Co-Launch Project</h2>
              <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
                You haven't partnered with a creator yet. Qualify and pitch a lead in Section 1 to launch a live project, or initialize a demo venture below.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveSection('section1')}
                className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-slate-200 hover:text-white font-semibold text-xs border border-white/10 transition-colors cursor-pointer"
              >
                Go to Section 1: Acquisition
              </button>
              <button
                type="button"
                onClick={handleCreateDemoProject}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-colors cursor-pointer shadow-sm active:scale-95 flex items-center gap-1.5"
              >
                <Rocket className="w-3.5 h-3.5" />
                <span>Initialize Demo Venture</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-4 text-center text-xs text-slate-500 bg-[#090b0e]">
        <p>Creator Forge Launch Engine OS &copy; {new Date().getFullYear()}</p>
      </footer>

      {/* Admin Pipeline Oversight & Error Lookup Modal */}
      <AdminPipelineLookup
        isOpen={showAdminLookup}
        onClose={() => setShowAdminLookup(false)}
        creators={(() => {
          try {
            return JSON.parse(localStorage.getItem('forge_launch_discovered_creators') || '[]')
          } catch {
            return []
          }
        })()}
        realThreads={(() => {
          try {
            return JSON.parse(localStorage.getItem('forge_launch_real_threads') || '[]')
          } catch {
            return []
          }
        })()}
        pitchSentMap={(() => {
          try {
            return JSON.parse(localStorage.getItem('forge_launch_pitch_sent_map') || '{}')
          } catch {
            return {}
          }
        })()}
        answerSentMap={(() => {
          try {
            return JSON.parse(localStorage.getItem('forge_launch_answer_sent_map') || '{}')
          } catch {
            return {}
          }
        })()}
        persuasionSentMap={(() => {
          try {
            return JSON.parse(localStorage.getItem('forge_launch_persuasion_sent_map') || '{}')
          } catch {
            return {}
          }
        })()}
        onSelectCreator={(cid) => {
          setShowAdminLookup(false)
          setActiveSection('section1')
        }}
        onForceLaunchProject={handleCreateProjectFromConcept}
      />

      {/* Creator Follow-Up & Reply Status CRM Directory Modal */}
      <CreatorFollowUpCRM
        isOpen={showFollowUpCRM}
        onClose={() => setShowFollowUpCRM(false)}
        creators={(() => {
          try {
            return JSON.parse(localStorage.getItem('forge_launch_discovered_creators') || '[]')
          } catch {
            return []
          }
        })()}
        realThreads={(() => {
          try {
            return JSON.parse(localStorage.getItem('forge_launch_real_threads') || '[]')
          } catch {
            return []
          }
        })()}
        pitchSentMap={(() => {
          try {
            return JSON.parse(localStorage.getItem('forge_launch_pitch_sent_map') || '{}')
          } catch {
            return {}
          }
        })()}
        onSelectCreator={(cid, targetStep) => {
          setShowFollowUpCRM(false)
          if (targetStep === 'section2' || targetStep === 7) {
            setActiveSection('section2')
          } else {
            setActiveSection('section1')
          }
        }}
        onDeleteCreator={() => {
          fetchCrmData()
        }}
      />
    </div>
  )
}
