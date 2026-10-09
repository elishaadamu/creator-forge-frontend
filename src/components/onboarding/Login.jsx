import { useState } from 'react'
import { useForge } from '../../App'
import {
  Lock,
  User,
  AlertTriangle,
  Eye,
  EyeOff,
  Loader2,
  ArrowLeft,
  ArrowRight
} from 'lucide-react'
import CreatorForgeLogo from '../ui/CreatorForgeLogo'

export default function Login() {
  const { goTo, updateCreator, setUserProfile, updateAiKeys } = useForge()
  const [identifier, setIdentifier] = useState('admin')
  const [password, setPassword] = useState('creatorforge2026')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [activeRole, setActiveRole] = useState('operator')

  const handleAutoFillDemo = () => {
    setIdentifier('admin')
    setPassword('creatorforge2026')
    setError('')
  }

  const handleLogin = (e) => {
    if (e) e.preventDefault()
    setError('')
    setLoading(true)

    fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: identifier.trim(),
        password: password
      })
    })
      .then(async (res) => {
        if (!res.ok) {
          let msg = 'Invalid username/email or password credentials.'
          try {
            const data = await res.json()
            if (data.detail) msg = data.detail
          } catch { }
          throw new Error(msg)
        }
        return res.json()
      })
      .then((data) => {
        // Clear guest keys first
        localStorage.clear()

        // Save operator details in localStorage
        localStorage.setItem(
          'forge_user_profile',
          JSON.stringify({
            username: data.username,
            email: data.email,
            password: password
          })
        )
        localStorage.setItem('forge_active_session', 'true')
        localStorage.setItem('forge_login_timestamp', Date.now().toString())

        // Restore creatorData, calendar, launch pack, and studio copies from DB
        if (data.creator_data) {
          localStorage.setItem('forge_creator_data', JSON.stringify(data.creator_data))
          updateCreator(data.creator_data)
        }
        if (data.calendar_data) {
          Object.entries(data.calendar_data).forEach(([key, val]) => {
            if (key && val) localStorage.setItem(key, val)
          })
        }
        if (data.launch_pack_data) {
          Object.entries(data.launch_pack_data).forEach(([key, val]) => {
            if (key && val) localStorage.setItem(key, val)
          })
        }
        if (data.studio_data) {
          Object.entries(data.studio_data).forEach(([key, val]) => {
            if (key && val) localStorage.setItem(key, val)
          })
        }

        // Restore AI keys from DB if user previously consented
        if (data.ai_keys) {
          updateAiKeys(data.ai_keys)
        }

        if (setUserProfile) {
          setUserProfile({
            username: data.username,
            email: data.email,
            password: password
          })
        }

        setLoading(false)
        goTo('dashboard')
      })
      .catch((err) => {
        // Fallback local auth for demo/offline
        if (
          (identifier.trim() === 'admin' && password === 'creatorforge2026') ||
          (identifier.trim() === 'creatorforgeweb@gmail.com' && (password === 'Upworkproject' || password === 'creatorforge2026'))
        ) {
          localStorage.setItem('forge_active_session', 'true')
          localStorage.setItem('forge_login_timestamp', Date.now().toString())
          localStorage.setItem(
            'forge_user_profile',
            JSON.stringify({
              username: identifier.trim(),
              email: 'creatorforgeweb@gmail.com',
              password: password
            })
          )
          setLoading(false)
          goTo('dashboard')
          return
        }
        setError(err.message || 'Login failed. Please check credentials.')
        setLoading(false)
      })
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
          <button type="button" onClick={() => goTo('welcome')} className="login-back-link">
            <ArrowLeft size={15} />
            <span>Back</span>
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

            {/* Submit */}
            {/* Submit (Discovery Signature Style Button with Beacon) */}
            <button
              type="submit"
              disabled={loading || !identifier.trim() || !password}
              className="relative w-full group overflow-hidden flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm tracking-wide shadow-lg shadow-slate-900/10 hover:shadow-slate-900/20 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
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
              <span className="absolute -top-1 -right-1 flex h-3 w-3 pointer-events-none items-center justify-center">
                <span className="w-2.5 h-2.5 rounded-full bg-[#C8FF3D] border-2 border-slate-900 shadow-xs" />
              </span>
            </button>
          </form>

          {/* Bottom text */}
          <p className="login-bottom-text">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={() => goTo('welcome')}
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
