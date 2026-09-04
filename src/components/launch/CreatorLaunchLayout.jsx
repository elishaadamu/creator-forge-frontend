import { useEffect, useState } from 'react'
import { Rocket, Target, Layers, ExternalLink, LogOut, User, X, ShieldAlert, Lock, Users, ChevronDown, Check, Plus, Loader2, Menu, Search, Send, MessageSquare, Sparkles, Award } from 'lucide-react'
import AcquisitionEngine from './AcquisitionEngine'
import ProjectOS from './ProjectOS'
import { ProjectOSSkeleton } from './Section2Skeletons'
import AdminPipelineLookup from './AdminPipelineLookup'
import CreatorFollowUpCRM from './CreatorFollowUpCRM'
import { createCoLaunchProject, getCoLaunchProject, getCoLaunchProjects } from '../../services/opsApi'
import { updatePageSEO } from '../../utils/seo'
import { getExpiringItem, setExpiringItem, removeExpiringItem, ONE_HOUR_MS } from '../../utils/expiringStorage'

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
      if (secParam === 'section1') return 'section1'
      if (secParam === 'section2' || (!secParam && projParam)) return 'section2'
      // Direct navigation to /launch always defaults cleanly to section1
      return 'section1'
    } catch {
      return 'section1'
    }
  })

  // Detect raw UUID strings (prevent phantom projects from using UUIDs as names)
  const isUuid = (str) => typeof str === 'string' && (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim()) || /^[0-9a-f-]{24,}$/i.test(str.trim()))

  // Detect corrupted or phantom project fabricated for deleted/non-existent creator
  const isCorruptedPhantomProject = (p) => {
    if (!p) return false
    if (isUuid(p.creatorName) || isUuid(p.creatorHandle)) return true
    if (p.productName && isUuid(p.productName.replace(/ Pro Hub| Co-Launch OS| Software Product/gi, '').trim())) return true
    return false
  }

  const [activeProject, setActiveProject] = useState(() => {
    try {
      const savedProject = getExpiringItem('forge_launch_active_project')
      if (savedProject && !isCorruptedPhantomProject(savedProject)) {
        return savedProject
      }
      removeExpiringItem('forge_launch_active_project')
      return null
    } catch {
      return null
    }
  })
  const [allProjects, setAllProjects] = useState([])
  const [showPartnerMenu, setShowPartnerMenu] = useState(false)
  const [isSwitchingCreator, setIsSwitchingCreator] = useState(false)
  const [switchingTarget, setSwitchingTarget] = useState(null)
  const [showAdminLookup, setShowAdminLookup] = useState(false)
  const [showFollowUpCRM, setShowFollowUpCRM] = useState(false)
  const [crmCreators, setCrmCreators] = useState([])
  const [crmThreads, setCrmThreads] = useState([])
  const [isSyncingCrmImap, setIsSyncingCrmImap] = useState(false)
  const [acquisitionNavState, setAcquisitionNavState] = useState(() => {
    try {
      const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
      const secParam = searchParams?.get('section')
      const stepParam = Number(searchParams?.get('step'))
      const creatorParam = searchParams?.get('creator') || searchParams?.get('creatorId')
      if (secParam === 'section1' || (stepParam >= 1 && stepParam <= 6)) {
        return {
          step: (stepParam >= 1 && stepParam <= 6) ? stepParam : 5,
          creatorId: creatorParam || null,
          nonce: Date.now()
        }
      }
      return null
    } catch {
      return null
    }
  })
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [section1ActiveStep, setSection1ActiveStep] = useState(() => {
    try {
      const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
      const stepParam = Number(searchParams?.get('step'))
      return (stepParam >= 1 && stepParam <= 6) ? stepParam : 1
    } catch {
      return 1
    }
  })
  const [showSection1Menu, setShowSection1Menu] = useState(false)
  const [showSection1Sidebar, setShowSection1Sidebar] = useState(false)

  const SECTION1_STEPS = [
    { step: 1, label: '1. Campaign Setup', desc: 'Target Niches & Autonomous Engine', icon: Target, color: 'text-purple-400', bg: 'bg-purple-500/15' },
    { step: 2, label: '2. Find & Qualify', desc: 'Discover & Score Creator Candidates', icon: Search, color: 'text-indigo-400', bg: 'bg-indigo-500/15' },
    { step: 3, label: '3. Autonomous Outreach', desc: 'Personalized Inquiries & SMTP Delivery', icon: Send, color: 'text-cyan-400', bg: 'bg-cyan-500/15' },
    { step: 4, label: '4. Interested Review', desc: 'Live Creator Inquiries & Replies CRM', icon: MessageSquare, color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
    { step: 5, label: '5. Audience & Ideas', desc: 'Audience Analysis & 3 Engineered Concepts', icon: Sparkles, color: 'text-amber-400', bg: 'bg-amber-500/15' },
    { step: 6, label: '6. Pitch & Select', desc: '50/50 Co-Founder Launch Agreement', icon: Award, color: 'text-pink-400', bg: 'bg-pink-500/15' },
  ]

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
      removeExpiringItem('forge_launch_active_project')
      localStorage.removeItem('forge_launch_active_section')
      setExpiringItem('forge_launch_active_step', '1', ONE_HOUR_MS)
      setExpiringItem('forge_launch_acquisition_step', '1', ONE_HOUR_MS)

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

  // Dedicated multi-creator switcher: loads or creates a Co-Launch project for any selected creator
  const handleSwitchToCreatorProject = async (creatorOrId) => {
    if (!creatorOrId) return null

    const isObj = typeof creatorOrId === 'object' && creatorOrId !== null
    const targetId = isObj ? (creatorOrId.id || creatorOrId.creatorId || creatorOrId.handle) : String(creatorOrId).trim()
    const targetHandle = isObj ? (creatorOrId.handle || creatorOrId.creatorHandle) : (!targetId.startsWith('proj_') ? targetId : null)
    const targetEmail = isObj ? (creatorOrId.email || creatorOrId.email_public || creatorOrId.creatorEmail) : null
    const cleanTarget = String(targetHandle || targetId).replace(/^@/, '').toLowerCase().trim()

    // Immediate loader & target feedback
    const knownMatch = allProjects.find(p => p.id === targetId || p.creatorId === targetId || (p.creatorHandle && p.creatorHandle.replace(/^@/, '').toLowerCase() === cleanTarget)) ||
      crmCreators.find(c => c.id === targetId || (c.handle && c.handle.replace(/^@/, '').toLowerCase() === cleanTarget))

    const targetHintName = isObj
      ? (creatorOrId.name || creatorOrId.creatorName || creatorOrId.display_name || creatorOrId.handle)
      : (knownMatch?.creatorName || knownMatch?.name || cleanTarget)
    const targetHintAvatar = isObj
      ? (creatorOrId.avatar || creatorOrId.creatorAvatar || creatorOrId.avatar_url)
      : (knownMatch?.creatorAvatar || knownMatch?.avatar)
    const targetHintProduct = isObj
      ? (creatorOrId.productName || creatorOrId.name)
      : (knownMatch?.productName || `${targetHintName} Co-Launch OS`)

    setIsSwitchingCreator(true)
    setSwitchingTarget({
      id: targetId,
      name: targetHintName,
      avatar: targetHintAvatar,
      productName: targetHintProduct
    })
    const switchStart = Date.now()

    try {
      const { getCoLaunchProjects, getCreators, getCreator, createCoLaunchProject, updateWorkflowState, updateCreatorDetails } = await import('../../services/opsApi')

      let projs = []
      try {
        projs = (await getCoLaunchProjects()) || []
        if (Array.isArray(projs) && projs.length > 0) {
          setAllProjects(projs)
        }
      } catch (e) {
        projs = allProjects || []
      }

      // 1. Check if a project already exists for this creator across remote DB & local state
      const candidateProjects = [
        ...(Array.isArray(projs) ? projs : []),
        ...(Array.isArray(allProjects) ? allProjects : [])
      ]

      let matched = candidateProjects.find(p => {
        if (!p) return false
        if (p.id === targetId) return true
        if (p.creatorId && String(p.creatorId).toLowerCase() === targetId.toLowerCase()) return true
        if (p.creatorHandle && cleanTarget && p.creatorHandle.replace(/^@/, '').toLowerCase() === cleanTarget) return true
        if (p.creatorName && cleanTarget && p.creatorName.toLowerCase().trim() === cleanTarget) return true
        if (targetEmail && p.creatorEmail && p.creatorEmail.toLowerCase() === targetEmail.toLowerCase()) return true
        return false
      })

      if (matched) {
        setActiveProject(matched)
        try {
          setExpiringItem('forge_launch_active_project', matched, ONE_HOUR_MS)
          localStorage.removeItem('forge_launch_active_section')
          const url = new URL(window.location.href)
          url.searchParams.set('section', 'section2')
          url.searchParams.set('project', matched.id)
          if (matched.creatorId) url.searchParams.set('creator', matched.creatorId)
          window.history.replaceState({}, '', url.toString())
        } catch (e) {}
        setActiveSection('section2')

        const elapsed = Date.now() - switchStart
        if (elapsed < 280) {
          await new Promise(r => setTimeout(r, 280 - elapsed))
        }
        return matched
      }

      // 2. Project does not exist yet -> resolve full creator record to initialize fresh project
      let creatorProfile = isObj ? creatorOrId : null
      if (!creatorProfile || !creatorProfile.name) {
        try {
          const res = await getCreators({ limit: 100 })
          const list = Array.isArray(res) ? res : res?.creators || []
          creatorProfile = list.find(c =>
            c.id === targetId ||
            (c.handle && c.handle.replace(/^@/, '').toLowerCase() === cleanTarget) ||
            (targetEmail && (c.email || c.email_public)?.toLowerCase() === targetEmail.toLowerCase())
          )
        } catch (e) {}
      }

      // If still not found, try fetching individual creator by ID
      if (!creatorProfile && targetId && !targetId.startsWith('proj_')) {
        try {
          creatorProfile = await getCreator(targetId)
        } catch (e) {}
      }

      // CRITICAL SAFEGUARD: If creator does NOT exist in database, NEVER fabricate a phantom project with raw UUID!
      if (!creatorProfile || (!creatorProfile.name && !creatorProfile.display_name && !creatorProfile.handle)) {
        console.warn(`[CreatorLaunchLayout] Creator "${targetId}" not found in database. Aborting project creation.`)
        try {
          const url = new URL(window.location.href)
          url.searchParams.delete('creator')
          url.searchParams.delete('creatorId')
          url.searchParams.delete('project')
          window.history.replaceState({}, '', url.toString())
        } catch (e) {}
        setIsSwitchingCreator(false)
        setSwitchingTarget(null)
        if (!activeProject) {
          setActiveSection('section1')
        }
        return null
      }

      const rawName = creatorProfile?.name || creatorProfile?.display_name || creatorProfile?.handle || ''
      const creatorName = rawName && !isUuid(rawName) ? rawName : 'Creator Partner'
      const creatorHandle = (creatorProfile?.handle && !isUuid(creatorProfile.handle)) ? creatorProfile.handle : 'partner'
      const creatorEmail = creatorProfile?.email || creatorProfile?.email_public || targetEmail || 'partner@creatorforge.com'
      const creatorAvatar = creatorProfile?.avatar || creatorProfile?.avatar_url || ''
      const creatorFollowers = creatorProfile?.followerStr || creatorProfile?.follower_count || '50k+'
      const creatorNiche = creatorProfile?.niche || 'Software & Tech'

      // Prioritize explicitly selected concept (e.g. Concept 3) over default Concept 1
      const allConcepts = creatorProfile?.productConcepts || creatorProfile?.concepts || []
      const chosenConceptFromList = creatorProfile?.selectedConceptId
        ? allConcepts.find(c => c.id === creatorProfile.selectedConceptId)
        : null
      const primaryConcept = creatorProfile?.selectedConcept || chosenConceptFromList || allConcepts[0] || {
        name: `${creatorName} Pro Hub`,
        tagline: `All-in-one software platform built for ${creatorName}'s audience`,
        pricing: '$29/mo Starter • $79/mo Pro',
        revenueModel: 'Monthly SaaS Subscription',
        presaleTarget: 12500,
      }

      const newProjPayload = {
        id: `proj_${Date.now()}`,
        creatorId: creatorProfile?.id || targetId,
        creatorName,
        creatorHandle,
        creatorAvatar,
        creatorEmail,
        niche: creatorNiche,
        followers: creatorFollowers,
        productName: primaryConcept.name || `${creatorName} Pro Hub`,
        productTagline: primaryConcept.tagline || `Tailored co-launch platform for ${creatorName}`,
        pricing: primaryConcept.pricing || '$29/mo',
        presaleTarget: primaryConcept.presaleTarget || 12500,
        currentPhase: 1,
        status: 'validating'
      }

      let created = null
      try {
        created = await createCoLaunchProject(newProjPayload)
      } catch (err) {
        console.warn('[CreatorLaunchLayout] createCoLaunchProject API error, using local payload:', err)
      }
      const finalProject = created && created.id ? created : newProjPayload

      setActiveProject(finalProject)
      setAllProjects(prev => {
        const cleanHandle = (finalProject.creatorHandle || '').replace(/^@/, '').toLowerCase()
        const cleanName = (finalProject.creatorName || '').toLowerCase().trim()
        const cleanId = String(finalProject.creatorId || '').toLowerCase().trim()
        const filtered = (prev || []).filter(p => {
          if (!p) return false
          if (p.id === finalProject.id) return false
          if (cleanId && p.creatorId && String(p.creatorId).toLowerCase() === cleanId) return false
          const pHandle = (p.creatorHandle || '').replace(/^@/, '').toLowerCase()
          if (cleanHandle && pHandle && cleanHandle === pHandle) return false
          const pName = (p.creatorName || '').toLowerCase().trim()
          if (cleanName && pName && cleanName === pName) return false
          return true
        })
        return [finalProject, ...filtered]
      })
      try {
        setExpiringItem('forge_launch_active_project', finalProject, ONE_HOUR_MS)
        localStorage.removeItem('forge_launch_active_section')
        const url = new URL(window.location.href)
        url.searchParams.set('section', 'section2')
        url.searchParams.set('project', finalProject.id)
        if (finalProject.creatorId) url.searchParams.set('creator', finalProject.creatorId)
        window.history.replaceState({}, '', url.toString())

        // Mark creator as Section 2 partnered in local stage map and DB
        const map = getExpiringItem('forge_creator_stage_map', {})
        map[finalProject.creatorId] = {
          step: 'section2',
          stepNumber: 7,
          actionName: 'Section 2 Project OS',
          updatedAt: new Date().toISOString()
        }
        if (finalProject.creatorHandle) {
          map[finalProject.creatorHandle.replace(/^@/, '').toLowerCase()] = map[finalProject.creatorId]
        }
        setExpiringItem('forge_creator_stage_map', map, ONE_HOUR_MS)
        updateWorkflowState({ creator_stage_map: map }).catch(() => {})
        if (creatorProfile?.id) {
          updateCreatorDetails(creatorProfile.id, { status: 'partnered' }).catch(() => {})
        }
      } catch (e) {}

      setActiveSection('section2')
      const elapsed = Date.now() - switchStart
      if (elapsed < 280) {
        await new Promise(r => setTimeout(r, 280 - elapsed))
      }
      return finalProject
    } catch (err) {
      console.warn('[CreatorLaunchLayout] handleSwitchToCreatorProject failed:', err)
      setActiveSection('section2')
      return null
    } finally {
      setIsSwitchingCreator(false)
      setSwitchingTarget(null)
    }
  }

  // Deep-link handler: Load specific creator or project from URL query params (?section=section1&step=5&creator=xxx / ?section=section2&creator=xxx / ?project=proj_xxx)
  useEffect(() => {
    const handleUrlSync = () => {
      try {
        const searchParams = new URLSearchParams(window.location.search)
        const secParam = searchParams.get('section')
        const projIdParam = searchParams.get('project')
        const creatorParam = searchParams.get('creator') || searchParams.get('creatorId')
        const stepParam = searchParams.get('step')

        if (secParam === 'section1') {
          setActiveSection('section1')
          const stepNum = Number(stepParam) || 5
          setAcquisitionNavState({
            step: stepNum,
            creatorId: creatorParam || null,
            nonce: Date.now(),
          })
          return
        }

        if (secParam === 'section2') {
          setActiveSection('section2')
          if (creatorParam || projIdParam) {
            handleSwitchToCreatorProject(creatorParam || projIdParam)
          }
          return
        }

        // If no section param in URL, determine from project or creator & step
        if (projIdParam) {
          setActiveSection('section2')
          handleSwitchToCreatorProject(projIdParam)
        } else if (creatorParam) {
          const stepNum = Number(stepParam) || 5
          setActiveSection('section1')
          setAcquisitionNavState({
            step: stepNum,
            creatorId: creatorParam,
            nonce: Date.now(),
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

  // Keep activeProject in expiring storage (1 hour TTL) without modifying clean browser URLs
  useEffect(() => {
    try {
      localStorage.removeItem('forge_launch_active_section')
      if (activeProject) {
        setExpiringItem('forge_launch_active_project', activeProject, ONE_HOUR_MS)
      }
    } catch (e) {
      console.warn('Failed to sync creator launch state to storage', e)
    }
  }, [activeProject])

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
          // Do NOT auto-switch clean /launch to section2 just because of backend DB state.
          // Clean /launch must remain on Section 1 unless an explicit ?section=section2 query param was opened.
          if (urlSec === 'section2' && ws.active_section === 'section2') {
            setActiveSection('section2')
          }
          // If the backend workflow state still references a phantom raw UUID, wipe it
          if (ws.selected_creator_id && isUuid(ws.selected_creator_id)) {
            import('../../services/opsApi').then(({ resetWorkflowState }) => {
              resetWorkflowState().catch(() => {})
            })
          }
        }

        if (isMounted && projectsRes.status === 'fulfilled' && projectsRes.value) {
          const projs = projectsRes.value
          if (Array.isArray(projs) && projs.length > 0) {
            // Deduplicate incoming projects by creator handle / name / id, filtering out any corrupted phantom UUID projects
            const seen = new Set()
            const deduped = projs.filter(p => {
              if (isCorruptedPhantomProject(p)) return false
              const key = (p.creatorHandle || p.creatorName || p.creatorId || p.id || '').replace(/^@/, '').toLowerCase().trim()
              if (seen.has(key)) return false
              seen.add(key)
              return true
            })
            setAllProjects(deduped)
            const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
            const projIdParam = searchParams?.get('project')
            const creatorParam = searchParams?.get('creator') || searchParams?.get('creatorId')
            const cleanCreator = creatorParam ? creatorParam.replace(/^@/, '').toLowerCase().trim() : null

            setActiveProject(prev => {
              const local = prev || (() => {
                try {
                  const saved = getExpiringItem('forge_launch_active_project')
                  return isCorruptedPhantomProject(saved) ? null : saved
                } catch {
                  return null
                }
              })()

              let matched = null
              // 1. Explicit project ID from URL
              if (projIdParam) {
                matched = projs.find(p => p.id === projIdParam)
              }
              // 2. Explicit creator from URL
              if (!matched && cleanCreator) {
                matched = projs.find(p =>
                  p.creatorId === creatorParam ||
                  (p.creatorHandle && p.creatorHandle.replace(/^@/, '').toLowerCase() === cleanCreator) ||
                  (p.creatorEmail && p.creatorEmail.toLowerCase() === cleanCreator)
                )
              }
              // 3. Fallback to active/local project if already set
              if (!matched && local) {
                matched = projs.find(p => p.id === local.id || (p.creatorId && p.creatorId === local.creatorId))
              }
              // 4. Default to most recently updated project
              if (!matched) {
                matched = projs[0]
              }

              if (!matched) return null

              // Safeguard against ghost UUID
              if (isCorruptedPhantomProject(matched)) return null

              // Deep merge DB project record with any transient local memory
              const merged = {
                ...matched,
                gateDecisions: (local?.id === matched.id && (local?.gateDecisions?.length || 0) > (matched.gateDecisions?.length || 0))
                  ? local.gateDecisions
                  : (matched.gateDecisions || local?.gateDecisions || []),
                projectFiles: (local?.id === matched.id && (local?.projectFiles?.length || 0) > 0) ? local.projectFiles : (matched.projectFiles || []),
                messages: (local?.id === matched.id && (local?.messages?.length || 0) > 0) ? local.messages : (matched.messages || []),
                mvpBuildPlan: (local?.id === matched.id ? local?.mvpBuildPlan : null) || matched.mvpBuildPlan,
                engineeringTasks: (matched.engineeringTasks?.length || 0) > 0 ? matched.engineeringTasks : (local?.id === matched.id ? (local?.engineeringTasks || []) : []),
                qaResults: (local?.id === matched.id ? local?.qaResults : null) || matched.qaResults,
                betaFeedback: (matched.betaFeedback?.length || 0) > 0 ? matched.betaFeedback : (local?.id === matched.id ? (local?.betaFeedback || []) : []),
                feedbackClusters: (matched.feedbackClusters?.length || 0) > 0 ? matched.feedbackClusters : (local?.id === matched.id ? (local?.feedbackClusters || []) : []),
                readinessReport: (local?.id === matched.id ? local?.readinessReport : null) || matched.readinessReport,
                appliedPatches: (matched.appliedPatches?.length || 0) > 0 ? matched.appliedPatches : (local?.id === matched.id ? (local?.appliedPatches || []) : []),
                mvpVersion: (local?.id === matched.id ? local?.mvpVersion : null) || matched.mvpVersion || 'v1.0.0-MVP'
              }
              try {
                setExpiringItem('forge_launch_active_project', merged, ONE_HOUR_MS)
              } catch {}
              return merged
            })
          } else {
            // DB has 0 projects (e.g. all creators/projects deleted) -> wipe local orphan project
            setAllProjects([])
            setActiveProject(null)
            try {
              removeExpiringItem('forge_launch_active_project')
              const url = new URL(window.location.href)
              if (url.searchParams.has('project') || url.searchParams.has('creator') || url.searchParams.has('creatorId')) {
                url.searchParams.delete('project')
                url.searchParams.delete('creator')
                url.searchParams.delete('creatorId')
                window.history.replaceState({}, '', url.toString())
              }
            } catch (e) {}
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
        setExpiringItem('forge_launch_active_project', next, ONE_HOUR_MS)
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
    setAllProjects(prev => [cleanProject, ...prev.filter(p => p.id !== cleanProject.id)])
    try {
      setExpiringItem('forge_launch_active_project', cleanProject, ONE_HOUR_MS)
      localStorage.removeItem('forge_launch_active_section')
      const url = new URL(window.location.href)
      url.searchParams.set('section', 'section2')
      url.searchParams.set('project', cleanProject.id)
      if (cleanProject.creatorId) url.searchParams.set('creator', cleanProject.creatorId)
      window.history.replaceState({}, '', url.toString())
    } catch (e) {}
    setActiveSection('section2')

    // Persist to backend database tables in SQLite
    try {
      const dbProj = await createCoLaunchProject({ ...newProjData, id: projId })
      if (dbProj && dbProj.id) {
        setActiveProject(prev => {
          const merged = { ...(prev || {}), ...dbProj }
          try {
            setExpiringItem('forge_launch_active_project', merged, ONE_HOUR_MS)
          } catch {}
          return merged
        })
        setAllProjects(prev => [dbProj, ...prev.filter(p => p.id !== dbProj.id)])
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
      localStorage.removeItem('forge_launch_active_section')
      removeExpiringItem('forge_launch_active_project')
      removeExpiringItem('forge_launch_active_step')
      removeExpiringItem('forge_launch_acquisition_step')

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
    window.location.href = '/launch'
  }

  const getSafeDiscoveredCreators = () => {
    try {
      const list = getExpiringItem('forge_launch_discovered_creators');
      if (Array.isArray(list) && list.length > 0) return list;
      const raw = localStorage.getItem('forge_launch_discovered_creators');
      if (raw) {
        const p = JSON.parse(raw);
        if (Array.isArray(p)) return p;
        if (p && Array.isArray(p.data)) return p.data;
        if (p && Array.isArray(p.creators)) return p.creators;
      }
      return Array.isArray(crmCreators) ? crmCreators : [];
    } catch {
      return Array.isArray(crmCreators) ? crmCreators : [];
    }
  };

  const getSafeRealThreads = () => {
    try {
      const list = getExpiringItem('forge_launch_real_threads');
      if (Array.isArray(list) && list.length > 0) return list;
      const raw = localStorage.getItem('forge_launch_real_threads');
      if (raw) {
        const p = JSON.parse(raw);
        if (Array.isArray(p)) return p;
        if (p && Array.isArray(p.data)) return p.data;
        if (p && Array.isArray(p.threads)) return p.threads;
      }
      return Array.isArray(crmThreads) ? crmThreads : [];
    } catch {
      return Array.isArray(crmThreads) ? crmThreads : [];
    }
  };

  const getSafeSentMap = (storageKey) => {
    try {
      const raw = localStorage.getItem(storageKey) || '{}';
      const parsed = JSON.parse(raw);
      if (parsed && parsed.__expiring && parsed.data) return parsed.data;
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  };

  return (
    <div className="min-h-screen bg-[#090b0e] text-slate-100 font-sans flex flex-col">
      {/* Top Navbar */}
      <header className="h-14 border-b border-white/[0.08] bg-[#0d0f14]/95 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between px-4 sm:px-6 relative">
        {/* Workspace Switching Progress Bar (Linear / Vercel style) */}
        {isSwitchingCreator && (
          <div className="absolute bottom-0 left-0 right-0 h-[2px] z-50 overflow-hidden bg-white/[0.05]">
            <div className="h-full bg-gradient-to-r from-emerald-500 via-purple-400 to-emerald-400 animate-pulse w-full" />
          </div>
        )}

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

          {/* Section Switcher Tabs (Tablet & Desktop) */}
          <div className="hidden md:flex items-center p-1 rounded-xl bg-white/[0.03] border border-white/[0.07]">
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

          {/* Section 1 Dropdown Sidebar & Step Selector (When in Section 1, Tablet & Desktop) */}
          {activeSection === 'section1' && (
            <div className="relative hidden sm:block">
              <button
                type="button"
                onClick={() => setShowSection1Menu(!showSection1Menu)}
                className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/25 text-xs font-semibold text-purple-200 transition-all cursor-pointer shadow-sm"
                title="Section 1 Pipeline Steps & Quick Sidebar"
              >
                <div className="w-5 h-5 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0">
                  <Target className="w-3.5 h-3.5" />
                </div>
                <div className="hidden lg:flex flex-col text-left leading-tight">
                  <span className="text-[11px] font-bold text-white truncate max-w-[140px]">
                    {SECTION1_STEPS.find(s => s.step === section1ActiveStep)?.label || '1. Campaign Setup'}
                  </span>
                  <span className="text-[9px] text-purple-400 font-mono truncate max-w-[140px]">
                    Step {section1ActiveStep} of 6 • Pipeline
                  </span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-purple-400 shrink-0 transition-transform ${showSection1Menu ? 'rotate-180' : ''}`} />
              </button>

              {showSection1Menu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowSection1Menu(false)}
                  />
                  <div className="absolute left-0 mt-2 w-80 rounded-2xl bg-[#0f131c] border border-white/[0.12] shadow-2xl p-2 z-50 space-y-1 backdrop-blur-xl animate-in fade-in">
                    <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-white/[0.06]">
                      <span>Section 1 Acquisition Steps</span>
                      <span className="text-purple-400 font-mono">Step {section1ActiveStep} / 6</span>
                    </div>

                    <div className="max-h-72 overflow-y-auto space-y-1 py-1">
                      {SECTION1_STEPS.map((s) => {
                        const Icon = s.icon
                        const isCur = section1ActiveStep === s.step
                        return (
                          <button
                            key={s.step}
                            type="button"
                            onClick={() => {
                              setSection1ActiveStep(s.step)
                              setAcquisitionNavState({ step: s.step, nonce: Date.now() })
                              setShowSection1Menu(false)
                            }}
                            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-all cursor-pointer ${
                              isCur
                                ? 'bg-purple-600/20 border border-purple-500/40 text-white shadow-sm'
                                : 'hover:bg-white/[0.05] text-slate-300 border border-transparent'
                            }`}
                          >
                            <div className={`w-7 h-7 rounded-lg ${s.bg} shrink-0 flex items-center justify-center ${s.color}`}>
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold truncate text-white">
                                {s.label}
                              </div>
                              <div className="text-[10px] text-slate-400 truncate">
                                {s.desc}
                              </div>
                            </div>
                            {isCur && (
                              <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                            )}
                          </button>
                        )
                      })}
                    </div>

                    <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between gap-2 px-1">
                      <button
                        type="button"
                        onClick={() => {
                          setShowSection1Menu(false)
                          setShowSection1Sidebar(true)
                        }}
                        className="w-full py-2 px-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-200 border border-purple-500/25 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                      >
                        <Layers className="w-3.5 h-3.5 text-purple-400" />
                        <span>Open Section 1 Sidebar Drawer</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Active Partner Switcher Dropdown (When in Section 2, Tablet & Desktop) */}
          {activeSection === 'section2' && (
            <div className="relative hidden sm:block">
              <button
                type="button"
                onClick={() => setShowPartnerMenu(!showPartnerMenu)}
                className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-xs font-semibold text-white transition-all cursor-pointer shadow-sm"
                title="Switch Co-Launch Partner"
              >
                <div className="w-5 h-5 rounded-full overflow-hidden bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-[10px] font-bold text-purple-300 shrink-0">
                  {isSwitchingCreator ? (
                    <Loader2 className="w-3 h-3 text-emerald-400 animate-spin" />
                  ) : activeProject?.creatorAvatar ? (
                    <img src={activeProject.creatorAvatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    (activeProject?.creatorName || activeProject?.creatorHandle || 'P').charAt(0).toUpperCase()
                  )}
                </div>
                <div className="hidden lg:flex flex-col text-left leading-tight">
                  <span className="text-[11px] font-bold text-white truncate max-w-[130px]">
                    {isSwitchingCreator ? `Switching...` : (activeProject?.creatorName || activeProject?.creatorHandle || 'Select Partner')}
                  </span>
                  <span className="text-[9px] text-emerald-400 font-mono truncate max-w-[130px]">
                    {isSwitchingCreator ? (switchingTarget?.name || 'Loading') : `${activeProject?.productName || 'Project'} • P${activeProject?.currentPhase || 1}`}
                  </span>
                </div>
                {isSwitchingCreator ? (
                  <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin shrink-0" />
                ) : (
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${showPartnerMenu ? 'rotate-180' : ''}`} />
                )}
              </button>

              {showPartnerMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowPartnerMenu(false)}
                  />
                  <div className="absolute left-0 mt-2 w-72 rounded-2xl bg-[#0f131c] border border-white/[0.12] shadow-2xl p-2 z-50 space-y-1 backdrop-blur-xl animate-in fade-in">
                    <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-white/[0.06]">
                      <span>Co-Launch Partners ({(() => {
                        const seen = new Set()
                        return (allProjects || []).filter(p => {
                          const k = (p.creatorHandle || p.creatorName || p.creatorId || p.id || '').replace(/^@/, '').toLowerCase().trim()
                          if (seen.has(k)) return false
                          seen.add(k)
                          return true
                        }).length
                      })()})</span>
                      <span className="text-purple-400">Section 2</span>
                    </div>
                    <div className="max-h-60 overflow-y-auto space-y-1 py-1">
                      {(() => {
                        const seen = new Set()
                        const uniqueProjects = (allProjects || []).filter(p => {
                          const k = (p.creatorHandle || p.creatorName || p.creatorId || p.id || '').replace(/^@/, '').toLowerCase().trim()
                          if (seen.has(k)) return false
                          seen.add(k)
                          return true
                        })
                        return uniqueProjects.map((p) => {
                          const isCur = p.id === activeProject?.id;
                          const isThisSwitching = isSwitchingCreator && (switchingTarget?.id === p.id || switchingTarget?.id === p.creatorId);
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              handleSwitchToCreatorProject(p);
                              setShowPartnerMenu(false);
                            }}
                            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-all cursor-pointer ${
                              isCur
                                ? 'bg-emerald-500/15 border border-emerald-500/30 text-white'
                                : 'hover:bg-white/[0.05] text-slate-300 border border-transparent'
                            }`}
                          >
                            <div className="w-7 h-7 rounded-lg overflow-hidden bg-slate-800 shrink-0 flex items-center justify-center text-xs font-bold text-slate-300">
                              {p.creatorAvatar ? (
                                <img src={p.creatorAvatar} alt="" className="w-full h-full object-cover" />
                              ) : (
                                (p.creatorName || p.creatorHandle || 'P').charAt(0).toUpperCase()
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold truncate text-white">
                                {p.creatorName || p.creatorHandle}
                              </div>
                              <div className="text-[10px] text-slate-400 truncate">
                                {p.productName} • <span className="text-emerald-400 font-mono">Phase {p.currentPhase || 1}</span>
                              </div>
                            </div>
                            {isThisSwitching ? (
                              <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin shrink-0" />
                            ) : isCur ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            ) : null}
                          </button>
                        );
                      })
                      })()}
                    </div>
                    <div className="pt-1 border-t border-white/[0.06]">
                      <button
                        type="button"
                        onClick={() => {
                          setShowPartnerMenu(false);
                          setActiveSection('section1');
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-purple-300 hover:bg-purple-500/10 transition-all cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Launch Another Creator (Section 1)</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Right: Actions & User Profile (Desktop - lg screens) */}
        <div className="hidden lg:flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
          {/* Creator Follow-Up CRM Button */}
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

          {/* Admin Pipeline & Exception Lookup Button */}
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

        {/* Mobile & Tablet Header Controls (< lg) */}
        <div className="flex lg:hidden items-center gap-1.5 sm:gap-2">
          {activeSection === 'section1' && (
            <button
              type="button"
              onClick={() => setShowSection1Sidebar(!showSection1Sidebar)}
              className="flex sm:hidden items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-500/10 border border-purple-500/25 text-xs font-semibold text-purple-200"
              title="Open Section 1 Steps Sidebar"
            >
              <Target className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-[11px] font-bold">Step {section1ActiveStep}</span>
              <ChevronDown className="w-3 h-3 text-purple-400" />
            </button>
          )}

          {activeSection === 'section2' && (
            <button
              type="button"
              onClick={() => setShowPartnerMenu(!showPartnerMenu)}
              className="flex sm:hidden items-center gap-1 px-2 py-1 rounded-lg bg-white/[0.04] border border-white/[0.1] text-xs font-semibold text-white"
              title="Switch Partner"
            >
              <div className="w-5 h-5 rounded-full overflow-hidden bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-[10px] font-bold text-purple-300">
                {(activeProject?.creatorName || activeProject?.creatorHandle || 'P').charAt(0).toUpperCase()}
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
            className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/10 border border-white/[0.1] text-slate-200 transition-colors cursor-pointer"
            aria-label="Toggle Mobile Menu"
          >
            {mobileDrawerOpen ? <X className="w-4 h-4 text-purple-300" /> : <Menu className="w-4 h-4 text-slate-200" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Slide-Down Menu (< lg) */}
      {mobileDrawerOpen && (
        <div className="lg:hidden fixed inset-x-0 top-14 bottom-0 z-40 bg-black/70 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#0e1117] border-b border-white/[0.1] p-4 space-y-4 max-h-[calc(100dvh-3.5rem)] overflow-y-auto shadow-2xl">
            {/* Mobile Section Switcher */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Studio Pipeline Sections</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setActiveSection('section1')
                    setMobileDrawerOpen(false)
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                    activeSection === 'section1'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-950/40 border border-purple-500/40'
                      : 'bg-white/[0.03] text-slate-300 border border-white/[0.06]'
                  }`}
                >
                  <Target className="w-3.5 h-3.5" />
                  <span>Section 1: Acquisition</span>
                </button>
                <button
                  onClick={() => {
                    if (activeProject) {
                      setActiveSection('section2')
                      setMobileDrawerOpen(false)
                    } else {
                      setShowLockedModal(true)
                    }
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                    activeSection === 'section2'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40 border border-emerald-500/40'
                      : 'bg-white/[0.03] text-slate-300 border border-white/[0.06]'
                  }`}
                >
                  {activeProject ? <Layers className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5 text-amber-400" />}
                  <span>Section 2: Project OS</span>
                </button>
              </div>
            </div>

            {/* Quick Access Tools */}
            <div className="space-y-1.5 pt-2 border-t border-white/[0.06]">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Studio Tools & Portals</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    window.open('/follow-up-crm', '_blank')
                    setMobileDrawerOpen(false)
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-200 border border-purple-500/25 text-xs font-bold transition-all"
                >
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-400" />
                    <span>Creator Follow-Up CRM</span>
                  </span>
                  <ExternalLink className="w-3 h-3 text-purple-300/80" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    window.open('/admin-error-log', '_blank')
                    setMobileDrawerOpen(false)
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-200 border border-rose-500/25 text-xs font-bold transition-all"
                >
                  <span className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    <span>Admin Pipeline Error Log</span>
                  </span>
                  <ExternalLink className="w-3 h-3 text-rose-300/80" />
                </button>
              </div>
            </div>

            {/* Session Footer */}
            <div className="pt-2 border-t border-white/[0.06] flex items-center justify-end">
              <button
                onClick={handleLogout}
                className="px-3.5 py-1.5 rounded-xl bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 text-xs font-semibold border border-rose-500/30 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slide-out Section 1 Sidebar Drawer */}
      {showSection1Sidebar && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div
            className="fixed inset-0"
            onClick={() => setShowSection1Sidebar(false)}
          />
          <div className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-[#0c0e14] border-r border-white/[0.1] shadow-2xl z-50 flex flex-col justify-between p-4 overflow-y-auto animate-in slide-in-from-left duration-200">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
                    <Target className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Section 1 Engine</h3>
                    <p className="text-[10px] text-purple-400 font-mono">6-Step Funnel Pipeline</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSection1Sidebar(false)}
                  className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 block px-1">
                  Pipeline Steps
                </span>
                {SECTION1_STEPS.map((s) => {
                  const Icon = s.icon
                  const isCur = section1ActiveStep === s.step
                  return (
                    <button
                      key={s.step}
                      type="button"
                      onClick={() => {
                        setSection1ActiveStep(s.step)
                        setAcquisitionNavState({ step: s.step, nonce: Date.now() })
                        setShowSection1Sidebar(false)
                      }}
                      className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all cursor-pointer ${
                        isCur
                          ? 'bg-purple-600 text-white shadow-md shadow-purple-950/50 border border-purple-400/40'
                          : 'bg-[#121620] hover:bg-white/[0.05] text-slate-300 border border-white/[0.05]'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center mt-0.5 ${
                        isCur ? 'bg-white/20 text-white' : `${s.bg} ${s.color}`
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold truncate">
                          {s.label}
                        </div>
                        <div className={`text-[11px] leading-tight mt-0.5 ${isCur ? 'text-purple-100' : 'text-slate-400'}`}>
                          {s.desc}
                        </div>
                      </div>
                      {isCur && (
                        <span className="w-2 h-2 rounded-full bg-white mt-1.5 shrink-0" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-white/[0.08] space-y-2">
              <button
                type="button"
                onClick={() => {
                  setShowSection1Sidebar(false)
                  setActiveSection('section2')
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/25 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span>Switch to Section 2: Project OS</span>
              </button>
            </div>
          </div>
        </div>
      )}

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
            onGoToProjectOS={(creatorOrId) => handleSwitchToCreatorProject(creatorOrId)}
            onResetAll={() => {
              setActiveProject(null)
              setAllProjects([])
              setActiveSection('section1')
              try {
                removeExpiringItem('forge_launch_active_project')
                localStorage.removeItem('forge_launch_active_section')
                window.history.replaceState({}, '', '/launch')
              } catch (e) {}
            }}
            initialActiveStep={acquisitionNavState?.step}
            initialSelectedCreatorId={acquisitionNavState?.creatorId}
            initialNavNonce={acquisitionNavState?.nonce}
            onActiveStepChange={(step) => setSection1ActiveStep(step)}
          />
        ) : isSwitchingCreator ? (
          <div className="space-y-6 w-full max-w-full animate-fade-in">
            {/* Minimalist Linear-style workspace switching indicator */}
            <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-[#0e1117] border border-white/[0.08] text-xs shadow-sm">
              <div className="flex items-center gap-2.5">
                <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin flex-shrink-0" />
                <span className="text-slate-400">
                  Switching workspace to <span className="text-white font-semibold">{switchingTarget?.name || 'Partner'}</span>
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400 font-mono text-[11px] truncate max-w-[240px]">
                  {switchingTarget?.productName || 'Project OS'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Syncing Workspace</span>
              </div>
            </div>

            {/* Native Project OS Skeleton */}
            <ProjectOSSkeleton />
          </div>
        ) : activeProject ? (
          <ProjectOS
            key={activeProject.id}
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
        creators={getSafeDiscoveredCreators()}
        realThreads={getSafeRealThreads()}
        pitchSentMap={getSafeSentMap('forge_launch_pitch_sent_map')}
        answerSentMap={getSafeSentMap('forge_launch_answer_sent_map')}
        persuasionSentMap={getSafeSentMap('forge_launch_persuasion_sent_map')}
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
        creators={getSafeDiscoveredCreators()}
        realThreads={getSafeRealThreads()}
        pitchSentMap={getSafeSentMap('forge_launch_pitch_sent_map')}
        onSelectCreator={(cid, targetStep) => {
          setShowFollowUpCRM(false)
          if (targetStep === 'section2' || targetStep === 7) {
            handleSwitchToCreatorProject(cid)
          } else {
            setActiveSection('section1')
            const stepNum = Number(targetStep) || 5
            setAcquisitionNavState({ step: stepNum, creatorId: cid, nonce: Date.now() })
            try {
              const url = new URL(window.location.href)
              url.searchParams.set('section', 'section1')
              url.searchParams.set('step', String(stepNum))
              if (cid) url.searchParams.set('creator', cid)
              window.history.replaceState({}, '', url.toString())
            } catch (e) {}
          }
        }}
        onDeleteCreator={() => {
          fetchCrmData()
        }}
      />
    </div>
  )
}
