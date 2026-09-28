import { useState, useEffect, useCallback } from 'react'
import {
  Layers, ArrowLeft, Users, ExternalLink, RefreshCw, ChevronDown,
  Check, Sparkles, ShieldCheck, Rocket, AlertCircle, Plus, LayoutGrid, Zap
} from 'lucide-react'
import ProjectOS from './ProjectOS'
import { ProjectOSSkeleton } from './Section2Skeletons'
import DIYSubscriptionModal from './DIYSubscriptionModal'
import CreatorForgeLogo from '../ui/CreatorForgeLogo'
import {
  getCoLaunchProjects,
  getCoLaunchProject,
  updateCoLaunchProject,
  createCoLaunchProject,
  getCreators,
  getCreator
} from '../../services/opsApi'
import { updatePageSEO } from '../../utils/seo'

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
  const [showDiyModal, setShowDiyModal] = useState(false)
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

              const cleanH = String(creator.handle || 'partner').replace(/^@/, '').trim().toLowerCase()
              let cachedVideos = []
              if (cleanH) {
                try {
                  const raw = localStorage.getItem(`forge_creator_videos_${cleanH}`) || sessionStorage.getItem(`forge_creator_videos_${cleanH}`)
                  if (raw) cachedVideos = JSON.parse(raw)
                } catch (e) {}
              }
              const creatorPosts = (Array.isArray(creator.recentPosts) && creator.recentPosts.length > 0 ? creator.recentPosts : null) ||
                (Array.isArray(creator.recent_posts) && creator.recent_posts.length > 0 ? creator.recent_posts : null) ||
                (Array.isArray(creator.videos) && creator.videos.length > 0 ? creator.videos : null) ||
                (Array.isArray(cachedVideos) && cachedVideos.length > 0 ? cachedVideos : null) ||
                []

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
                selectedConceptId: primaryConcept.id,
                channelUrl: creator.profile_url || (cleanH ? `https://www.youtube.com/@${cleanH}` : ''),
                channelDescription: creator.bio || '',
                recentPosts: creatorPosts,
                videos: creatorPosts,
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

      // 3. Fallback to most recent project in list if not specified
      if (!target && list.length > 0) {
        target = list[0]
      }
      if (target) {
        const handleClean = String(target.creatorHandle || '').replace(/^@/, '').trim().toLowerCase()
        let cachedVideos = []
        if (handleClean) {
          try {
            const raw = localStorage.getItem(`forge_creator_videos_${handleClean}`) || sessionStorage.getItem(`forge_creator_videos_${handleClean}`)
            if (raw) cachedVideos = JSON.parse(raw)
          } catch (e) {}
        }
        const resolvedPosts = (Array.isArray(target.recentPosts) && target.recentPosts.length > 0 ? target.recentPosts : null) ||
          (Array.isArray(target.videos) && target.videos.length > 0 ? target.videos : null) ||
          (Array.isArray(cachedVideos) && cachedVideos.length > 0 ? cachedVideos : null) ||
          []

        const resolvedKit = target.campaignKit ||
          target.validationCampaign?.campaignKit ||
          target.validationCampaign?.campaign_kit ||
          (target.validationCampaign?.productAssets?.announcementPost ? target.validationCampaign.productAssets : null) ||
          null
        const hasKit = Boolean(
          resolvedKit && (
            Boolean(resolvedKit.announcementPost?.trim()) ||
            Boolean(resolvedKit.storySequence?.trim()) ||
            Boolean(resolvedKit.videoScript?.trim()) ||
            Boolean(resolvedKit.newsletterDraft?.trim())
          )
        )
        const enhancedTarget = {
          ...target,
          recentPosts: resolvedPosts,
          videos: resolvedPosts,
          channelUrl: target.channelUrl || (handleClean ? `https://www.youtube.com/@${handleClean}` : ''),
          channelDescription: target.channelDescription || '',
          campaignKit: resolvedKit,
          campaignLaunched: hasKit,
          campaignAssetsGenerated: hasKit,
          creatorTasks: Array.isArray(target.creatorTasks) ? target.creatorTasks : []
        }
        setActiveProject(enhancedTarget)

        // If target has no posts yet, fetch live from YouTube
        if (resolvedPosts.length === 0 && handleClean && !/^[0-9a-f-]{15,}$/i.test(handleClean)) {
          import('../../services/scraper').then(({ fetchCreatorYouTubeVideos }) => {
            fetchCreatorYouTubeVideos(handleClean).then((vids) => {
              if (vids && vids.length > 0) {
                setActiveProject((prev) => (prev && prev.id === target.id ? { ...prev, recentPosts: vids, videos: vids } : prev))
              }
            }).catch(() => {})
          })
        }

        try {
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
    loadProjects(false)
  }, [loadProjects])

  // Handle switching active project from dropdown
  const handleSelectProject = (project) => {
    setActiveProject(project)
    setShowProjectDropdown(false)
    try {
      const url = new URL(window.location.href)
      url.searchParams.set('project', project.id)
      if (project.creatorId) url.searchParams.set('creator', project.creatorId)
      window.history.replaceState({}, '', url.toString())
    } catch (e) {}
  }

  // Handle live updates from Phase 1-4 components
  const handleUpdateActiveProject = async (updater) => {
    let resolved
    setActiveProject(prev => {
      resolved = typeof updater === 'function' ? updater(prev) : updater
      return resolved
    })
    if (!resolved || !resolved.id) return
    setProjects((prev) => prev.map((p) => (p.id === resolved.id ? resolved : p)))

    try {
      await updateCoLaunchProject(resolved.id, {
        ...resolved,
        currentPhase: resolved.currentPhase,
        current_phase: resolved.currentPhase,
        status: resolved.status,
        campaignKit: resolved.campaignKit,
        campaign_kit: resolved.campaignKit,
        metadataInfo: {
          ...(resolved.metadataInfo || {}),
          campaign_kit: resolved.campaignKit || resolved.metadataInfo?.campaign_kit
        }
      })
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

  // Handle successful DIY Creator subscription unlock (Stripe/PayPal)
  const handleDiySubscribeSuccess = (subDetails) => {
    if (!activeProject) return
    const updated = {
      ...activeProject,
      isDIY: true,
      diySubscription: subDetails
    }
    handleUpdateActiveProject(updated)
    showToast('success', 'DIY License Activated', 'Full autonomous ProjectOS pipeline unlocked with 100% revenue retention.')
  }

  return (
    <div
      className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900"
      style={{ backgroundImage: 'radial-gradient(#cbd5e1 1.25px, transparent 1.25px)', backgroundSize: '20px 20px' }}
    >
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl bg-white border border-slate-200 text-slate-900 animate-in slide-in-from-bottom-2">
          {toast.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          ) : (
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          )}
          <div className="text-xs">
            <div className="font-semibold text-slate-900">{toast.title}</div>
            <div className="text-slate-500">{toast.message}</div>
          </div>
        </div>
      )}

      {/* Top Universal Operator Command Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4 shadow-2xs">
        {/* Left: Branding & Back Navigation */}
        <div className="flex items-center gap-3 sm:gap-4">
          <a
            href="/launch"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 hover:text-slate-950 transition-all text-xs font-semibold group"
            title="Return to Creator Acquisition Engine (Steps 1–6)"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-500 group-hover:-translate-x-0.5 transition-transform" />
            <span className="hidden sm:inline">Creator Acquisition</span>
            <span className="sm:hidden">Back</span>
          </a>

          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

          {/* Studio Brand & Section Indicator */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center shadow-xs shrink-0">
              <CreatorForgeLogo size={18} showText={false} theme="light" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-slate-950 tracking-tight uppercase">CREATOR FORGE</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-300">
                  PROJECT OS
                </span>
              </div>
              <p className="text-[10px] text-slate-500 hidden md:block">Co-Launch Operations & Engineering Command</p>
            </div>
          </div>
        </div>

        {/* Center: Project Switcher Dropdown */}
        {activeProject && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowProjectDropdown((prev) => !prev)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs text-xs transition-all max-w-[240px] sm:max-w-[340px]"
            >
              {activeProject.creatorAvatar ? (
                <img
                  src={activeProject.creatorAvatar}
                  alt={activeProject.creatorName}
                  className="w-5 h-5 rounded-full object-cover shrink-0 border border-slate-200"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px] shrink-0">
                  {(activeProject.creatorName || 'P')[0]}
                </div>
              )}
              <div className="text-left truncate">
                <div className="font-bold text-slate-900 truncate text-[11px] sm:text-xs">
                  {activeProject.productName || 'Active Venture'}
                </div>
                <div className="text-[10px] text-slate-500 truncate">
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
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-72 sm:w-80 rounded-2xl bg-white border border-slate-200 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 text-slate-900">
                  <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 flex items-center justify-between">
                    <span>Co-Launch Projects ({projects.length})</span>
                    <a
                      href="/launch?step=1"
                      className="text-emerald-600 hover:text-emerald-700 flex items-center gap-1 font-bold"
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
                              ? 'bg-emerald-50 border border-emerald-300 text-slate-900 font-bold'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          {p.creatorAvatar ? (
                            <img
                              src={p.creatorAvatar}
                              alt={p.creatorName}
                              className="w-7 h-7 rounded-full object-cover shrink-0"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-700 shrink-0">
                              {(p.creatorName || 'P')[0]}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-xs truncate flex items-center gap-1.5">
                              <span>{p.productName || 'Co-Launch Venture'}</span>
                              {isCurrent && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate">
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
          {/* Dedicated Co-Builder Passes & Participation Console Link */}
          <a
            href="/participation-manager"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 transition-all text-xs font-bold shadow-2xs"
            title="Open Dedicated Creator Participation & Co-Builder Console"
          >
            <Zap className="w-3.5 h-3.5 text-amber-700" />
            <span>Co-Builder Passes ($50)</span>
            <ExternalLink className="w-3 h-3 text-amber-700" />
          </a>

          <a
            href="/follow-up-crm"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 transition-all text-xs font-semibold shadow-2xs"
            title="Open Standalone Creator Follow-Up CRM"
          >
            <Users className="w-3.5 h-3.5 text-emerald-600" />
            <span>CRM & Replies</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>

          <button
            type="button"
            onClick={() => loadProjects(true)}
            disabled={isRefreshing}
            className="p-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 transition-all text-xs shadow-2xs cursor-pointer"
            title="Refresh Project Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {loading ? (
          <div className="px-3 sm:px-5 lg:px-6 py-4 max-w-[96%] xl:max-w-[95%] 2xl:max-w-[1720px] mx-auto w-full">
            <ProjectOSSkeleton />
          </div>
        ) : activeProject ? (
          <div className="px-3 sm:px-5 lg:px-6 py-4 max-w-[96%] xl:max-w-[95%] 2xl:max-w-[1720px] mx-auto w-full">
            <ProjectOS
              key={activeProject.id}
              project={activeProject}
              onUpdateProject={handleUpdateActiveProject}
              onGoToAcquisition={() => {
                window.location.href = '/launch'
              }}
              onResetProject={handleResetProject}
              userRole={activeProject.isDIY || activeProject.diySubscription?.active ? 'creator' : 'admin'}
              isDIY={Boolean(activeProject.isDIY || activeProject.diySubscription?.active)}
            />
          </div>
        ) : (
          /* Empty State: No Projects Created Yet */
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="max-w-md w-full p-8 rounded-3xl bg-white border border-slate-200 text-center space-y-5 shadow-xl text-slate-900">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-300 flex items-center justify-center mx-auto text-emerald-600 shadow-sm">
                <Rocket className="w-7 h-7" />
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-bold text-slate-900">No Active Co-Launch Project</h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  You have not initialized a software co-launch project yet. Scout, qualify, and pitch a creator in Section 1 to launch a live project.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href="/launch?step=1"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all"
                >
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>Start Creator Acquisition</span>
                </a>
                <a
                  href="/follow-up-crm"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold transition-all shadow-2xs"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>View CRM Leads</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* DIY Subscription Modal (Stripe / PayPal / Demo Unlock) */}
      {showDiyModal && activeProject && (
        <DIYSubscriptionModal
          project={activeProject}
          isOpen={showDiyModal}
          onClose={() => setShowDiyModal(false)}
          onSuccess={handleDiySubscribeSuccess}
        />
      )}
    </div>
  )
}
