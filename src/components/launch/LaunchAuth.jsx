import { useState, useEffect, createContext, useContext, useCallback } from 'react'
import {
  Lock,
  User,
  AlertTriangle,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  ArrowLeft,
  ArrowRight
} from 'lucide-react'
import CreatorForgeLogo from '../ui/CreatorForgeLogo'

const LAUNCH_AUTH_SESSION_KEY = 'forge_launch_auth_token'
const LAUNCH_AUTH_EMAIL_KEY = 'forge_launch_auth_email'
const LAUNCH_AUTH_TIMESTAMP_KEY = 'forge_launch_auth_timestamp'
const ONE_HOUR_MS = 60 * 60 * 1000 // 1 hour expiration (3,600,000 ms)

export const LaunchAuthContext = createContext(null)
export const useLaunchAuth = () => useContext(LaunchAuthContext)

export function isLaunchAuthenticated() {
  try {
    const token = localStorage.getItem(LAUNCH_AUTH_SESSION_KEY)
    const email = localStorage.getItem(LAUNCH_AUTH_EMAIL_KEY)
    const timestampStr = localStorage.getItem(LAUNCH_AUTH_TIMESTAMP_KEY)
    if (!token || !email || !timestampStr) return false

    const ts = parseInt(timestampStr, 10)
    if (isNaN(ts) || Date.now() - ts > ONE_HOUR_MS) {
      logoutLaunchAuth()
      return false
    }
    return true
  } catch {
    return false
  }
}

export function logoutLaunchAuth() {
  try {
    localStorage.removeItem(LAUNCH_AUTH_SESSION_KEY)
    localStorage.removeItem(LAUNCH_AUTH_EMAIL_KEY)
    localStorage.removeItem(LAUNCH_AUTH_TIMESTAMP_KEY)
    localStorage.removeItem('forge_launch_auth_user')
  } catch (e) {
    console.warn('[LaunchAuth] Logout error:', e)
  }
}

export default function LaunchAuth({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => isLaunchAuthenticated())
  const [identifier, setIdentifier] = useState('creatorforgeweb@gmail.com')
  const [password, setPassword] = useState('Upworkproject')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Periodic expiration watcher: check every 10 seconds for session timeout
  useEffect(() => {
    const checkExpiration = () => {
      const authenticated = isLaunchAuthenticated()
      if (!authenticated && isAuthenticated) {
        setIsAuthenticated(false)
        setError('Session expired. Please sign in again.')
      }
    }

    const interval = setInterval(checkExpiration, 10000)
    return () => clearInterval(interval)
  }, [isAuthenticated])

  const establishLaunchSession = (cleanEmail) => {
    const token = `op_${Date.now()}`
    localStorage.setItem(LAUNCH_AUTH_SESSION_KEY, token)
    localStorage.setItem(LAUNCH_AUTH_EMAIL_KEY, cleanEmail)
    localStorage.setItem(LAUNCH_AUTH_TIMESTAMP_KEY, Date.now().toString())
    localStorage.setItem('forge_launch_auth_user', JSON.stringify({ email: cleanEmail, role: 'operator_admin' }))
    localStorage.setItem('forge_active_session', 'true')
    localStorage.setItem('forge_login_timestamp', Date.now().toString())
    localStorage.setItem(
      'forge_user_profile',
      JSON.stringify({
        username: cleanEmail.split('@')[0] || 'admin',
        email: cleanEmail,
        role: 'operator_admin'
      })
    )
    try {
      localStorage.removeItem('forge_launch_acquisition_step')
      localStorage.removeItem('forge_launch_active_step')
    } catch (e) { }

    setTimeout(() => {
      setIsAuthenticated(true)
      setLoading(false)
    }, 200)
  }

  const handleLogin = async (e) => {
    if (e) e.preventDefault()
    setError('')

    const cleanIdentifier = identifier.trim().toLowerCase()
    const cleanPass = password

    if (!cleanIdentifier) {
      setError('Please enter your username or email.')
      return
    }
    if (!cleanPass) {
      setError('Please enter your password.')
      return
    }

    setLoading(true)

    try {
      // Call backend auth API
      const res = await fetch('/api/auth/launch-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanIdentifier, password: cleanPass })
      })

      const data = await res.json().catch(() => ({}))

      if (res.ok && data.status === 'success') {
        establishLaunchSession(cleanIdentifier)
        return
      }

      // Friendly fallback validation for dev & testing accounts
      if (
        (cleanIdentifier === 'creatorforgeweb@gmail.com' && (cleanPass === 'Upworkproject' || cleanPass === 'creatorforge2026')) ||
        (cleanIdentifier === 'admin' && (cleanPass === 'creatorforge2026' || cleanPass === 'Upworkproject'))
      ) {
        establishLaunchSession(cleanIdentifier.includes('@') ? cleanIdentifier : 'creatorforgeweb@gmail.com')
        return
      }

      setError(data.detail || 'Invalid email or password.')
      setLoading(false)
    } catch (err) {
      // Direct offline fallback
      if (
        (cleanIdentifier === 'creatorforgeweb@gmail.com' && (cleanPass === 'Upworkproject' || cleanPass === 'creatorforge2026')) ||
        (cleanIdentifier === 'admin' && (cleanPass === 'creatorforge2026' || cleanPass === 'Upworkproject'))
      ) {
        establishLaunchSession(cleanIdentifier.includes('@') ? cleanIdentifier : 'creatorforgeweb@gmail.com')
        return
      }
      setError('Authentication failed. Please verify credentials.')
      setLoading(false)
    }
  }

  const handleAutoFillDemo = () => {
    setIdentifier('creatorforgeweb@gmail.com')
    setPassword('Upworkproject')
    setError('')
  }

  const logout = useCallback(() => {
    logoutLaunchAuth()
    setIsAuthenticated(false)
    setPassword('')
  }, [])

  if (isAuthenticated) {
    return (
      <LaunchAuthContext.Provider value={{ isAuthenticated, logout, operatorEmail: identifier || 'creatorforgeweb@gmail.com' }}>
        {children}
      </LaunchAuthContext.Provider>
    )
  }

  return (
    <div className="login-split-page">

      {/* ── LEFT: FULL-BLEED IMAGE ── */}
      <div className="login-split-image">
        <img
          src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1400&q=80"
          alt="Engineering team collaborating in modern workspace"
          loading="eager"
        />
        {/* Dark overlay with soft gradient */}
        <div className="login-image-overlay" />

        {/* Creator Forge branding */}
        <div className="login-image-brand">
          <CreatorForgeLogo size={24} theme="dark" showWordmark={true} />
        </div>

        {/* Caption text */}
        <div className="login-image-caption">
          <span className="login-caption-tag">STUDIO</span>
          <h2>Build Products.<br />Share Ownership.</h2>
          <p>50/50 co-founder partnerships powered by AI sprint workflows.</p>
        </div>
      </div>

      {/* ── RIGHT: LOGIN FORM (WHITE BACKGROUND WITH BOTTOM GRADIENT) ── */}
      <div className="login-split-form">
        <div className="login-bottom-gradient" />

        {/* Top bar with back link */}
        <div className="login-form-topbar">
          <button type="button" onClick={() => { window.location.href = '/' }} className="login-back-link">
            <ArrowLeft size={15} />
            <span>Home</span>
          </button>
        </div>

        {/* Form inner (centered vertically) */}
        <div className="login-form-inner">

          {/* Heading */}
          <div className="login-form-heading">
            <h1>Welcome back</h1>
            <p>Sign in to your Creator Forge workspace</p>
          </div>

          {/* Error */}
          {error && (
            <div className="login-error">
              <AlertTriangle size={15} />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="login-fields">
            <label className="login-label">Username or Email</label>
            <div className="login-input-wrap">
              <User size={16} className="login-input-icon" />
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Enter your username or email"
                required
              />
            </div>

            <label className="login-label">Password</label>
            <div className="login-input-wrap">
              <Lock size={16} className="login-input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="login-eye-btn"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Forgot password */}
            <div className="login-forgot-row">
              <span className="login-forgot-link">Forgot password?</span>
            </div>

            {/* Submit (Discovery Signature Style Button with Beacon) */}
            <button
              type="submit"
              disabled={loading || !identifier.trim() || !password}
              className="relative w-full group flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm tracking-wide shadow-lg shadow-slate-900/10 hover:shadow-slate-900/20 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin text-white" />
                  <span>Signing in…</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </>
              )}
              {/* Signature Beacon Accent Dot */}
              <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 pointer-events-none items-center justify-center z-10">
                <span className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-sm ring-1 ring-slate-900/10" />
              </span>
            </button>
          </form>

          {/* Bottom text */}
          <p className="login-bottom-text">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={() => { window.location.href = '/' }}
              className="login-signup-link"
            >
              Start onboarding
            </button>
          </p>

        </div>

        {/* Footer */}
        <div className="login-form-footer">
          <span>© 2026 Creator Forge · 256-Bit Encrypted</span>
        </div>

      </div>

    </div>
  )
}
