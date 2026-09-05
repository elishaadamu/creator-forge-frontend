import { useState, useEffect, useCallback } from 'react'
import {
  Layers, ArrowLeft, Users, ExternalLink, RefreshCw, ChevronDown,
  Check, Sparkles, ShieldCheck, Rocket, AlertCircle, Plus, LayoutGrid
} from 'lucide-react'
import ProjectOS from './ProjectOS'
import { ProjectOSSkeleton } from './Section2Skeletons'
import {
  getCoLaunchProjects,
  getCoLaunchProject,
  updateCoLaunchProject,
  createCoLaunchProject,
  getCreators,
  getCreator
} from '../../services/opsApi'
import { updatePageSEO } from '../../utils/seo'
import { getExpiringItem, setExpiringItem, removeExpiringItem, ONE_HOUR_MS } from '../../utils/expiringStorage'

// Helper to check if string is raw UUID
const isUuid = (str) =>
  typeof str === 'string' &&
  (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim()) ||
    /^[0-9a-f-]{24,}$/i.test(str.trim()))

export default function ProjectOSPage() {
  const [projects, setProjects] = useState([])
  const [activeProject, setActiveProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showProjectDropdown, setShowProjectDropdown] = useState(false)
  const [toast, setToast] = useState(null)

  const showToast = (type, title, message) => {
    setToast({ type, title, message, id: Date.now() })
    setTimeout(() => setToast(null), 4000)
  }

  // Update SEO on mount
  useEffect(() => {
    updatePageSEO({
      title: 'Project OS — Co-Launch Operations Center | Creator Forge',
      description: 'Dedicated operator command center for validating, building, and launching partner software ventures.',
      image: '/og-image.svg'
    })
  }, [])

  // Resolve target project ID or creator ID from URL
  const getUrlParams = useCallback(() => {
    if (typeof window === 'undefined') return { projectId: null, creatorId: null }
    const sp = new URLSearchParams(window.location.search)
    let projectId = sp.get('project') || sp.get('id') || sp.get('projectId')
    let creatorId = sp.get('creator') || sp.get('creatorId')

    // Also check pathname: e.g. /project-os/proj_123 or /projects/proj_123
    const pathParts = window.location.pathname.split('/').filter(Boolean)
    if (pathParts.length > 1 && (pathParts[0] === 'project-os' || pathParts[0] === 'projects')) {
      projectId = pathParts[1]
    }
    return { projectId, creatorId }
  }, [])

  // Load projects and resolve active project
  const loadProjects = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true)
    else setIsRefreshing(true)

    try {
      const { projectId, creatorId } = getUrlParams()
      const remoteProjects = await getCoLaunchProjects()
      const list = Array.isArray(remoteProjects) ? remoteProjects : remoteProjects?.projects || []
      setProjects(list)

      let target = null

      // 1. Try to find by projectId from URL
      if (projectId) {
        target = list.find((p) => p.id === projectId)
        if (!target) {
          try {
            target = await getCoLaunchProject(projectId)
          } catch (e) {
            console.warn('[ProjectOSPage] Direct project fetch failed:', e)
          }
        }
      }

      // 2. Try to find by creatorId from URL
      if (!target && creatorId) {
        target = list.find(
          (p) =>
            p.creatorId === creatorId ||
            (p.creatorHandle && p.creatorHandle.replace(/^@/, '').toLowerCase() === creatorId.replace(/^@/, '').toLowerCase())
        )

        // If no project exists yet for this creator, initialize one
        if (!target) {
          try {
            let creator = null
            try {
              creator = await getCreator(creatorId)
            } catch (e) {
              const allCreators = await getCreators({ limit: 100 })
              const clist = Array.isArray(allCreators) ? allCreators : allCreators?.creators || []
              creator = clist.find(
                (c) =>
                  c.id === creatorId ||
                  (c.handle && c.handle.replace(/^@/, '').toLowerCase() === creatorId.replace(/^@/, '').toLowerCase())
              )
            }

            if (creator) {
              const creatorName = creator.name || creator.display_name || creator.handle || 'Partner Creator'
              const allConcepts = creator.productConcepts || creator.concepts || []
              const primaryConcept = creator.selectedConcept || allConcepts[0] || {
                name: `${creatorName} Pro Hub`,
                tagline: `Software platform built for ${creatorName}'s audience`,
                pricing: '$29/mo Starter • $79/mo Pro',
                revenueModel: 'Monthly SaaS Subscription',
                presaleTarget: 12500
              }

              const newPayload = {
                id: `proj_${Date.now()}`,
                creatorId: creator.id || creatorId,
                creatorName,
                creatorHandle: creator.handle || 'partner',
                creatorAvatar: creator.avatar || creator.avatar_url || '',
                creatorEmail: creator.email || creator.email_public || '',
                niche: creator.niche || 'Software & Tech',
                followers: creator.followerStr || creator.follower_count || '50k+',
                productName: primaryConcept.name,
                productTagline: primaryConcept.tagline,
                pricing: primaryConcept.pricing || '$29/mo',
                presaleTarget: primaryConcept.presaleTarget || 12500,
                currentPhase: 1,
                status: 'validating',
                selectedConcept: primaryConcept,
                selectedConceptId: primaryConcept.id
              }

              const created = await createCoLaunchProject(newPayload)
              target = created || newPayload
              setProjects((prev) => [target, ...prev])
            }
          } catch (err) {
            console.warn('[ProjectOSPage] Auto-create project for creator failed:', err)
          }
        }
      }

      // 3. Fallback to cached active project in local storage
      if (!target) {
        const cached = getExpiringItem('forge_launch_active_project')
        if (cached && cached.id) {
          target = list.find((p) => p.id === cached.id) || cached
        }
      }

      // 4. Fallback to most recent project in list
      if (!target && list.length > 0) {
        target = list[0]
      }

      if (target) {
        setActiveProject(target)
        try {
          setExpiringItem('forge_launch_active_project', target, ONE_HOUR_MS)
          // Reflect project ID in URL without reload
          const url = new URL(window.location.href)
          url.searchParams.set('project', target.id)
          if (target.creatorId) url.searchParams.set('creator', target.creatorId)
          window.history.replaceState({}, '', url.toString())
        } catch (e) {}
      }
    } catch (err) {
      console.error('[ProjectOSPage] Failed to load projects:', err)
      showToast('error', 'Sync Failed', 'Could not load projects from database.')
    } finally {
      if (!isSilent) setLoading(false)
      setIsRefreshing(false)
    }
  }, [getUrlParams])

  // Initial load
  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  // Handle switching active project from dropdown
  const handleSelectProject = (project) => {
    setActiveProject(project)
    setShowProjectDropdown(false)
    try {
      setExpiringItem('forge_launch_active_project', project, ONE_HOUR_MS)
      const url = new URL(window.location.href)
      url.searchParams.set('project', project.id)
      if (project.creatorId) url.searchParams.set('creator', project.creatorId)
      window.history.replaceState({}, '', url.toString())
    } catch (e) {}
  }

  // Handle live updates from Phase 1-4 components
  const handleUpdateActiveProject = async (updatedProject) => {
    if (!updatedProject || !updatedProject.id) return
    setActiveProject(updatedProject)
    setProjects((prev) => prev.map((p) => (p.id === updatedProject.id ? updatedProject : p)))

    try {
      setExpiringItem('forge_launch_active_project', updatedProject, ONE_HOUR_MS)
      await updateCoLaunchProject(updatedProject.id, updatedProject)
    } catch (err) {
      console.warn('[ProjectOSPage] Error saving project update:', err)
    }
  }

  // Handle resetting project state
  const handleResetProject = async (projectId) => {
    if (!projectId) return
    const confirmed = window.confirm(
      'Are you sure you want to reset this co-launch project back to Phase 1 (Validate)? Pre-orders, build files, and gate decisions will be cleared.'
    )
    if (!confirmed) return

    const resetPayload = {
      ...activeProject,
      currentPhase: 1,
      status: 'validating',
      gateDecisions: [],
      presaleOrders: [],
      engineeringTasks: [],
      betaFeedback: [],
      qaResults: null
    }

    await handleUpdateActiveProject(resetPayload)
    showToast('success', 'Project Reset', 'Project reset cleanly to Phase 1.')
  }

  return (
    <div className="min-h-screen bg-[#06080d] text-slate-100 flex flex-col font-sans selection:bg-purple-500/30">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl bg-[#0f1420] border border-white/10 text-white animate-in slide-in-from-bottom-2">
          {toast.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          ) : (
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          )}
          <div className="text-xs">
            <div className="font-semibold">{toast.title}</div>
            <div className="text-slate-400">{toast.message}</div>
          </div>
        </div>
      )}

      {/* Top Universal Operator Command Bar */}
      <header className="sticky top-0 z-40 bg-[#080b12]/90 backdrop-blur-md border-b border-white/[0.08] px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Left: Branding & Back Navigation */}
        <div className="flex items-center gap-3 sm:gap-4">
          <a
            href="/launch"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 hover:text-white transition-all text-xs font-medium group"
            title="Return to Creator Acquisition Engine (Steps 1–6)"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-400 group-hover:-translate-x-0.5 transition-transform" />
            <span className="hidden sm:inline">Creator Acquisition</span>
            <span className="sm:hidden">Back</span>
          </a>

          <div className="h-4 w-px bg-white/10 hidden sm:block" />

          {/* Studio Brand & Section Indicator */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-purple-500/20">
              CF
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white tracking-wide">CREATOR FORGE</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  PROJECT OS
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden md:block">Co-Launch Operations & Engineering Command</p>
            </div>
          </div>
        </div>

        {/* Center: Project Switcher Dropdown */}
        {activeProject && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowProjectDropdown((prev) => !prev)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.1] text-xs transition-all max-w-[240px] sm:max-w-[340px]"
            >
              {activeProject.creatorAvatar ? (
                <img
                  src={activeProject.creatorAvatar}
                  alt={activeProject.creatorName}
                  className="w-5 h-5 rounded-full object-cover shrink-0 border border-white/20"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold text-[10px] shrink-0">
                  {(activeProject.creatorName || 'P')[0]}
                </div>
              )}
              <div className="text-left truncate">
                <div className="font-semibold text-white truncate text-[11px] sm:text-xs">
                  {activeProject.productName || 'Active Venture'}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {activeProject.creatorName ? `w/ ${activeProject.creatorName}` : 'Partner Project'}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
            </button>

            {/* Dropdown Menu */}
            {showProjectDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowProjectDropdown(false)}
                />
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-72 sm:w-80 rounded-2xl bg-[#0e121c] border border-white/[0.12] shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 border-b border-white/[0.06] flex items-center justify-between">
                    <span>Co-Launch Projects ({projects.length})</span>
                    <a
                      href="/launch?step=1"
                      className="text-purple-400 hover:text-purple-300 flex items-center gap-1 font-medium"
                    >
                      <Plus className="w-3 h-3" /> New Lead
                    </a>
                  </div>

                  <div className="max-h-64 overflow-y-auto py-1 space-y-1">
                    {projects.map((p) => {
                      const isCurrent = p.id === activeProject.id
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleSelectProject(p)}
                          className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-3 transition-all ${
                            isCurrent
                              ? 'bg-purple-500/15 border border-purple-500/30 text-white'
                              : 'hover:bg-white/[0.04] text-slate-300'
                          }`}
                        >
                          {p.creatorAvatar ? (
                            <img
                              src={p.creatorAvatar}
                              alt={p.creatorName}
                              className="w-7 h-7 rounded-full object-cover shrink-0"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-300 shrink-0">
                              {(p.creatorName || 'P')[0]}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-xs truncate flex items-center gap-1.5">
                              <span>{p.productName || 'Co-Launch Venture'}</span>
                              {isCurrent && <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
                              {p.creatorName || p.creatorHandle || 'Partner'} • Phase {p.currentPhase || 1}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Right: CRM Link & Refresh Button */}
        <div className="flex items-center gap-2">
          <a
            href="/follow-up-crm"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 hover:text-white transition-all text-xs font-medium"
            title="Open Standalone Creator Follow-Up CRM"
          >
            <Users className="w-3.5 h-3.5 text-purple-400" />
            <span>CRM & Replies</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>

          <button
            type="button"
            onClick={() => loadProjects(true)}
            disabled={isRefreshing}
            className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 hover:text-white transition-all text-xs"
            title="Refresh Project Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-purple-400' : ''}`} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {loading ? (
          <div className="p-6 max-w-7xl mx-auto w-full">
            <ProjectOSSkeleton />
          </div>
        ) : activeProject ? (
          <ProjectOS
            key={activeProject.id}
            project={activeProject}
            onUpdateProject={handleUpdateActiveProject}
            onGoToAcquisition={() => {
              window.location.href = '/launch'
            }}
            onResetProject={handleResetProject}
          />
        ) : (
          /* Empty State: No Projects Created Yet */
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="max-w-md w-full p-8 rounded-3xl bg-[#0c0f17] border border-white/[0.08] text-center space-y-5 shadow-2xl">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mx-auto text-purple-400 shadow-lg shadow-purple-500/10">
                <Rocket className="w-7 h-7" />
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-bold text-white">No Active Co-Launch Project</h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  You have not initialized a software co-launch project yet. Scout, qualify, and pitch a creator in Section 1 to launch a live project.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href="/launch?step=1"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-purple-500/25 transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Start Creator Acquisition</span>
                </a>
                <a
                  href="/follow-up-crm"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 text-xs font-medium transition-all"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>View CRM Leads</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
