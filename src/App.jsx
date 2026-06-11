import { useState, useEffect, createContext, useContext, useCallback, useRef } from 'react'
import Welcome from './components/onboarding/Welcome'
import CreatorLink from './components/onboarding/CreatorLink'
import Analyzing from './components/onboarding/Analyzing'
import Blueprint from './components/onboarding/Blueprint'
import Preview from './components/onboarding/Preview'
import Building from './components/onboarding/Building'
import PreFinish from './components/onboarding/PreFinish'
import Celebration from './components/onboarding/Celebration'
import Signup from './components/onboarding/Signup'
import Login from './components/onboarding/Login'
import DashboardLayout from './components/dashboard/DashboardLayout'
import OpsLayout from './components/ops/OpsLayout'
import OpsAuth from './components/ops/OpsAuth'
import { clearInMemoryKeys, loadKeys } from './services/scraper'
import { clearInMemoryAiKeys, restoreAiKeysFromLoginData, loadAiKeys } from './services/ai'
import { CheckCircle, AlertCircle, X } from 'lucide-react'

export const ForgeContext = createContext(null)
export function useForge() { return useContext(ForgeContext) }

/**
 * useBgJob(jobId)
 * Subscribe to a background job's status and result from any component/page.
 * status: 'idle' | 'running' | 'done' | 'error'
 */
export function useBgJob(jobId) {
  const { bgJobs } = useForge()
  return bgJobs[jobId] || { status: 'idle', result: null, error: null }
}

const STEPS = [
  'welcome', 'creator-link', 'analyzing', 'blueprint',
  'preview', 'building', 'pre-finish', 'celebration', 'signup', 'login', 'dashboard',
]

// Subtle accent colors per platform — kept low-opacity so B&W stays dominant
const PLATFORM_ACCENTS = {
  youtube:   { color: '#ff3b30', rgb: '255,59,48'   },
  instagram: { color: '#e1306c', rgb: '225,48,108'  },
  twitter:   { color: '#60a5fa', rgb: '96,165,250'  },
  tiktok:    { color: '#00c8c8', rgb: '0,200,200'   },
  twitch:    { color: '#9146ff', rgb: '145,70,255'  },
  other:     { color: '#ffffff', rgb: '255,255,255' },
}

export function getAccent(platform) {
  return PLATFORM_ACCENTS[platform] || PLATFORM_ACCENTS.other
}

function GlobalToast({ toast, onClose }) {
  const [progress, setProgress] = useState(100)
  const DURATION = 4200

  useEffect(() => {
    const timer = setTimeout(onClose, DURATION)
    // Shrink progress bar smoothly
    const interval = setInterval(() => {
      setProgress(p => Math.max(0, p - (100 / (DURATION / 50))))
    }, 50)
    return () => { clearTimeout(timer); clearInterval(interval) }
  }, [onClose])

  const isSuccess = toast.type === 'success'
  const isError   = toast.type === 'error'
  const isInfo    = !isSuccess && !isError

  const accent = isSuccess
    ? { bar: '#4ade80', glow: 'rgba(74,222,128,0.15)', border: 'rgba(74,222,128,0.18)', icon: '#4ade80' }
    : isError
    ? { bar: '#f87171', glow: 'rgba(248,113,113,0.15)', border: 'rgba(248,113,113,0.2)',  icon: '#f87171' }
    : { bar: '#60a5fa', glow: 'rgba(96,165,250,0.15)',  border: 'rgba(96,165,250,0.18)', icon: '#60a5fa' }

  return (
    <div
      className="fixed bottom-6 right-6 z-[9999] pointer-events-auto"
      style={{
        animation: 'toastSlideIn 0.28s cubic-bezier(0.34,1.56,0.64,1) both',
      }}
    >
      <style>{`
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateY(18px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
      `}</style>

      <div
        className="relative flex items-start gap-3.5 rounded-2xl border shadow-2xl overflow-hidden"
        style={{
          background: 'rgba(14,14,14,0.97)',
          borderColor: accent.border,
          boxShadow: `0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px ${accent.border}, inset 0 1px 0 rgba(255,255,255,0.04)`,
          minWidth: 300,
          maxWidth: 400,
          padding: '14px 16px 18px',
        }}
      >
        {/* Left accent stripe */}
        <div
          className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl"
          style={{ background: `linear-gradient(180deg, ${accent.bar} 0%, transparent 100%)` }}
        />

        {/* Icon */}
        <div
          className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center mt-0.5"
          style={{ background: accent.glow }}
        >
          {isSuccess
            ? <CheckCircle size={16} style={{ color: accent.icon }} />
            : isError
            ? <AlertCircle size={16} style={{ color: accent.icon }} />
            : <AlertCircle size={16} style={{ color: accent.icon }} />
          }
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-6">
          <p
            className="text-[13px] font-semibold leading-snug"
            style={{ color: 'rgba(255,255,255,0.95)' }}
          >
            {toast.message}
          </p>
          {toast.subtitle && (
            <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {toast.subtitle}
            </p>
          )}
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center transition-colors flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.35)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.13)'; e.currentTarget.style.color = 'white' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.35)' }}
        >
          <X size={11} />
        </button>

        {/* Progress bar */}
        <div
          className="absolute bottom-0 left-0 right-0 h-[2px]"
          style={{ background: 'rgba(255,255,255,0.06)' }}
        >
          <div
            className="h-full rounded-full transition-none"
            style={{
              width: `${progress}%`,
              background: `linear-gradient(90deg, ${accent.bar} 0%, ${accent.bar}88 100%)`,
              transition: 'width 50ms linear',
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [step, setStep] = useState(() => {
    try {
      const path = window.location.pathname
      const cachedUser = localStorage.getItem('forge_user_profile')
      const activeSession = localStorage.getItem('forge_active_session')
      if (path === '/dashboard') {
        if (cachedUser && activeSession === 'true') {
          return 'dashboard'
        }
        return 'login'
      }
      if (path === '/login') return 'login'
      if (path === '/signup') return 'signup'

      if (path === '/') {
        const cachedStep = localStorage.getItem('forge_onboarding_step')
        if (cachedStep && ['welcome', 'creator-link', 'analyzing', 'blueprint', 'preview', 'building', 'pre-finish', 'celebration'].includes(cachedStep)) {
          return cachedStep
        }
      }
    } catch {}
    return 'welcome'
  })

  const [userProfile, setUserProfile] = useState(() => {
    try {
      const cachedUser = localStorage.getItem('forge_user_profile')
      return cachedUser ? JSON.parse(cachedUser) : null
    } catch {
      return null
    }
  })
  const isRegistered = !!userProfile

  const [aiActionsCount, setAiActionsCount] = useState(() => {
    try {
      return parseInt(localStorage.getItem('forge_ai_actions') || '0', 10)
    } catch {
      return 0
    }
  })

  // Lives at the root so it persists across all tab/page navigation.
  const [bgJobs, setBgJobs] = useState({})
  const abortControllersRef = useRef({})
  
  // API Keys modal state
  const [apiModalOpen, setApiModalOpen] = useState(false)

  const [aiKeys, setAiKeysState] = useState({
    geminiKey: '',
    togetherKey: '',
    nvidiaKey: '',
  })

  const updateAiKeys = useCallback((newKeys) => {
    if (newKeys) {
      restoreAiKeysFromLoginData(newKeys)
      setAiKeysState({
        geminiKey: newKeys.geminiKey || '',
        togetherKey: newKeys.togetherKey || '',
        nvidiaKey: newKeys.nvidiaKey || '',
      })
    }
  }, [])

  const [globalToast, setGlobalToast] = useState(null)
  const triggerToast = useCallback((message, type = 'success') => {
    setGlobalToast({ message, type })
  }, [])

  /**
   * startBgJob(jobId, asyncFn)
   * Fires an async function in the background and tracks it in bgJobs.
   * The result is available from any page via useBgJob(jobId).
   */
  const startBgJob = useCallback((jobId, asyncFn) => {
    if (abortControllersRef.current[jobId]) {
      abortControllersRef.current[jobId].abort()
    }
    const controller = new AbortController()
    abortControllersRef.current[jobId] = controller

    setBgJobs(prev => ({ ...prev, [jobId]: { status: 'running', result: null, error: null } }))
    asyncFn(controller.signal)
      .then(result => {
        if (abortControllersRef.current[jobId] === controller) {
          delete abortControllersRef.current[jobId]
        }
        setBgJobs(prev => ({ ...prev, [jobId]: { status: 'done', result, error: null } }))
      })
      .catch(err => {
        if (abortControllersRef.current[jobId] === controller) {
          delete abortControllersRef.current[jobId]
        }
        if (err.name === 'AbortError') {
          setBgJobs(prev => ({ ...prev, [jobId]: { status: 'cancelled', result: null, error: 'Cancelled by user' } }))
        } else {
          setBgJobs(prev => ({ ...prev, [jobId]: { status: 'error', result: null, error: err.message || String(err) } }))
        }
      })
  }, [])

  /** Abort / cancel an ongoing background job */
  const cancelBgJob = useCallback((jobId) => {
    if (abortControllersRef.current[jobId]) {
      abortControllersRef.current[jobId].abort()
      delete abortControllersRef.current[jobId]
    }
    setBgJobs(prev => ({ ...prev, [jobId]: { status: 'cancelled', result: null, error: 'Cancelled by user' } }))
  }, [])

  /** Dismiss / clear a finished job so it doesn't re-apply on the next visit */
  const clearBgJob = useCallback((jobId) => {
    setBgJobs(prev => { const next = { ...prev }; delete next[jobId]; return next })
  }, [])

  const [creatorData, setCreatorData] = useState({
    url: '',
    platform: null,
    handle: '',
    name: '',
    followers: 0,
    avatar: null,
    niche: '',
    recentPosts: [],
    engagementRate: 0,
    brandColor: null,
    blueprint: null,
    productName: '',
    buildItems: [],
  })

  // Synchronize localStorage configuration to the backend SQLite database
  const syncSessionToDb = useCallback((currentUsername, currentCreatorData) => {
    const activeUser = currentUsername || userProfile?.username
    if (!activeUser) return // Guest session, skip sync

    const cData = currentCreatorData || creatorData
    const h = cData?.handle || 'default'
    
    const calendar_data = {}
    const launch_pack_data = {}
    const studio_data = {}
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('forge_calendar_')) {
        calendar_data[key] = localStorage.getItem(key)
      } else if (key && (key.startsWith(`forge_${h}_launch_pack`) || key.startsWith(`forge_${h}_launch_image`))) {
        launch_pack_data[key] = localStorage.getItem(key)
      } else if (key && key.startsWith(`forge_${h}_studio_`)) {
        studio_data[key] = localStorage.getItem(key)
      }
    }

    const payload = {
      username: activeUser,
      creator_data: cData,
      calendar_data,
      launch_pack_data,
      studio_data
    }

    fetch('/api/auth/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(data => {
        console.log('[Forge] Database session synced:', data)
      })
      .catch(err => {
        console.error('[Forge] Session sync failed:', err)
      })
  }, [userProfile, creatorData])

  const incrementAiActions = useCallback(() => {
    setAiActionsCount(prev => {
      const nextCount = prev + 1
      localStorage.setItem('forge_ai_actions', nextCount.toString())
      return nextCount
    })
    // Also trigger database sync if registered!
    if (userProfile?.username) {
      setTimeout(() => syncSessionToDb(), 200)
    }
  }, [userProfile, syncSessionToDb])

  // Navigate function that updates pathname using history pushState
  const navigate = useCallback((newStep) => {
    setStep(newStep)
    let path = '/'
    if (newStep === 'login') path = '/login'
    else if (newStep === 'signup') path = '/signup'
    else if (newStep === 'dashboard') path = '/dashboard'
    
    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path)
    }
  }, [])

  const next = () => {
    if (step === 'celebration') {
      navigate('signup')
    } else {
      const idx = STEPS.indexOf(step)
      if (idx < STEPS.length - 1) navigate(STEPS[idx + 1])
    }
  }

  const goTo = (s) => navigate(s)

  const updateCreator = (data) => {
    setCreatorData(prev => ({ ...prev, ...data }))
  }

  // Handle URL navigation popstate and session restores
  useEffect(() => {
    const handleNavigation = () => {
      const path = window.location.pathname
      const cachedUser = localStorage.getItem('forge_user_profile')
      const activeSession = localStorage.getItem('forge_active_session')
      const cachedCreator = localStorage.getItem('forge_creator_data')

      if (cachedCreator) {
        try {
          setCreatorData(JSON.parse(cachedCreator))
        } catch (e) {
          console.error('[Forge] Failed to sync creator data:', e)
        }
      }

      if (path === '/login') {
        setStep('login')
      } else if (path === '/signup') {
        setStep('signup')
      } else if (path === '/dashboard') {
        if (cachedUser && activeSession === 'true') {
          setStep('dashboard')
        } else {
          setStep('login')
          window.history.replaceState(null, '', '/login')
        }
      } else {
        const cachedStep = localStorage.getItem('forge_onboarding_step')
        if (cachedStep && ['welcome', 'creator-link', 'analyzing', 'blueprint', 'preview', 'building', 'pre-finish', 'celebration'].includes(cachedStep)) {
          setStep(cachedStep)
        } else {
          setStep('welcome')
        }
      }
    }

    handleNavigation()
    window.addEventListener('popstate', handleNavigation)
    return () => window.removeEventListener('popstate', handleNavigation)
  }, [])

  // Auto-save creatorData updates
  useEffect(() => {
    if (creatorData && (creatorData.handle || creatorData.url)) {
      localStorage.setItem('forge_creator_data', JSON.stringify(creatorData))
    }
  }, [creatorData])

  // Persist onboarding step to localStorage
  useEffect(() => {
    try {
      const isOnboardingStep = ['welcome', 'creator-link', 'analyzing', 'blueprint', 'preview', 'building', 'pre-finish', 'celebration'].includes(step)
      if (isOnboardingStep) {
        localStorage.setItem('forge_onboarding_step', step)
        
        // Log all localStorage contents to developer console during onboarding
        const store = {}
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          store[key] = localStorage.getItem(key)
        }
        console.log(`[Forge] Onboarding active step: "${step}". Current localStorage:`, store)
        console.log('[Forge] Current in-memory Scraper & AI API keys:', {
          scraping: loadKeys(),
          ai: loadAiKeys()
        })
      } else if (step === 'dashboard' || step === 'login' || step === 'signup') {
        localStorage.removeItem('forge_onboarding_step')
      }
    } catch (e) {
      console.warn('[Forge] Failed to save onboarding step:', e)
    }
  }, [step])

  // Restore AI keys from DB if user is logged in
  useEffect(() => {
    if (userProfile?.username) {
      fetch(`/api/auth/load-ai-keys/${encodeURIComponent(userProfile.username)}`)
        .then(res => {
          if (!res.ok) throw new Error('Failed to load keys')
          return res.json()
        })
        .then(data => {
          if (data.status === 'success' && data.ai_keys) {
            updateAiKeys(data.ai_keys)
          }
        })
        .catch(err => {
          console.error('[Forge] Failed to restore AI keys from DB on mount:', err)
        })
    }
  }, [userProfile, updateAiKeys])

  // Logout callback - clears transient keys, active session, and dashboard caches
  const logout = useCallback(() => {
    clearInMemoryKeys()
    clearInMemoryAiKeys()
    setAiKeysState({
      geminiKey: '',
      togetherKey: '',
      nvidiaKey: '',
    })

    localStorage.clear()
    setUserProfile(null)

    setCreatorData({
      url: '',
      platform: null,
      handle: '',
      name: '',
      followers: 0,
      avatar: null,
      niche: '',
      recentPosts: [],
      engagementRate: 0,
      brandColor: null,
      blueprint: null,
      productName: '',
      buildItems: [],
    })
    setBgJobs({})
    setAiActionsCount(0)
    navigate('login')
  }, [navigate])

  const accent = getAccent(creatorData.platform)
  const ctx = {
    step,
    next,
    goTo,
    creatorData,
    updateCreator,
    accent,
    bgJobs,
    startBgJob,
    cancelBgJob,
    clearBgJob,
    logout,
    userProfile,
    setUserProfile,
    isRegistered,
    aiActionsCount,
    incrementAiActions,
    syncSessionToDb,
    apiModalOpen,
    setApiModalOpen,
    triggerToast,
    aiKeys,
    updateAiKeys
  }

  // /ops route — internal operator pipeline panel (login-protected)
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/ops')) {
    return (
      <OpsAuth>
        <OpsLayout />
      </OpsAuth>
    )
  }

  if (step === 'dashboard') {
    return (
      <ForgeContext.Provider value={ctx}>
        <DashboardLayout />
        {globalToast && (
          <GlobalToast toast={globalToast} onClose={() => setGlobalToast(null)} />
        )}
      </ForgeContext.Provider>
    )
  }

  const screens = {
    'welcome':      <Welcome />,
    'creator-link': <CreatorLink />,
    'analyzing':    <Analyzing />,
    'blueprint':    <Blueprint />,
    'preview':      <Preview />,
    'building':     <Building />,
    'pre-finish':   <PreFinish />,
    'celebration':  <Celebration />,
    'signup':       <Signup />,
    'login':        <Login />,
  }

  return (
    <ForgeContext.Provider value={ctx}>
      <div className="min-h-screen bg-forge-bg text-white overflow-hidden">
        {screens[step] || <Welcome />}
      </div>
      {globalToast && (
        <GlobalToast toast={globalToast} onClose={() => setGlobalToast(null)} />
      )}
    </ForgeContext.Provider>
  )
}
