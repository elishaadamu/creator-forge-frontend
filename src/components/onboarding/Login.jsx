import { useState, useEffect } from 'react'
import { useForge } from '../../App'
import { ArrowRight, Lock, User, AlertTriangle, ShieldCheck, HelpCircle, Eye, EyeOff } from 'lucide-react'
import WingLogo from '../ui/WingLogo'

export default function Login() {
  const { goTo, updateCreator, setUserProfile, updateAiKeys } = useForge()
  const [identifier, setIdentifier] = useState('') // email or username
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [visible, setVisible] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [])

  const handleLogin = (e) => {
    e.preventDefault()
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
      .then(async res => {
        if (!res.ok) {
          let msg = 'Invalid username/email or password credentials.'
          try {
            const data = await res.json()
            if (data.detail) msg = data.detail
          } catch {}
          throw new Error(msg)
        }
        return res.json()
      })
      .then(data => {
        // Clear guest keys first
        localStorage.clear()

        // Save operator details in localStorage
        localStorage.setItem('forge_user_profile', JSON.stringify({
          username: data.username,
          email: data.email,
          password: password
        }))
        localStorage.setItem('forge_active_session', 'true')

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

        setTimeout(() => {
          goTo('dashboard')
        }, 800)
      })
      .catch(err => {
        setError(err.message || 'Failed to authenticate console keyway.')
        setLoading(false)
      })
  }

  const handleGoToSignup = () => {
    // If they have no profile or want to start fresh, clear the cache and go back
    localStorage.clear()
    goTo('welcome')
  }

  return (
    <div className="min-h-screen flex flex-col justify-between py-8 px-6">
      {/* Header */}
      <header className="flex items-center justify-between max-w-4xl mx-auto w-full">
        <button onClick={() => goTo('welcome')} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <WingLogo size={22} />
          <span className="text-white font-semibold text-[15px] tracking-tight">Creator Forge</span>
        </button>
      </header>

      {/* Main card */}
      <main 
        className="flex-1 flex items-center justify-center my-6"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(16px)',
          transition: 'all 0.55s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        <div 
          className="w-full max-w-md rounded-2xl border p-6 space-y-6 shadow-2xl relative"
          style={{ 
            background: 'var(--theme-card-bg)', 
            borderColor: 'var(--theme-border-color)' 
          }}
        >
          {/* Title */}
          <div className="text-center">
            <p className="forge-label mb-2">Secure Operator Access</p>
            <h2 className="forge-heading text-[24px] tracking-tight mb-2">Login to your console</h2>
            <p className="text-[13px]" style={{ color: 'var(--theme-text-muted)' }}>
              Enter your credentials to launch the secure Forge dashboard.
            </p>
          </div>

          {/* Security Alert Notice */}
          <div 
            className="rounded-xl border p-3.5 flex items-start gap-3"
            style={{ 
              background: 'rgba(59, 130, 246, 0.04)', 
              borderColor: 'rgba(59, 130, 246, 0.15)' 
            }}
          >
            <AlertTriangle className="text-blue-400 flex-shrink-0 mt-0.5" size={15} />
            <div className="space-y-0.5 text-left">
              <h4 className="text-[12px] font-semibold text-white">Secure API Key Management</h4>
              <p className="text-[11px] leading-relaxed" style={{ color: 'var(--theme-text-muted)' }}>
                By default, API keys are held transiently in-memory. You can check "Save my AI keys to my account" in settings to automatically restore them on login.
              </p>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div 
              className="rounded-xl border p-3 flex items-center gap-2.5 text-left"
              style={{ background: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
            >
              <AlertTriangle className="text-red-500 flex-shrink-0" size={14} />
              <p className="text-[12px] text-red-200 leading-snug">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Identifier (Username/Email) */}
            <div className="space-y-1.5 text-left">
              <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>
                Username or Email
              </label>
              <div className="forge-input-wrap">
                <User size={14} style={{ color: 'var(--theme-text-muted)' }} />
                <input
                  type="text"
                  required
                  disabled={loading}
                  className="forge-input text-[13px]"
                  placeholder="Username or email address"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5 text-left">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>
                  Password
                </label>
              </div>
              <div className="forge-input-wrap">
                <Lock size={14} style={{ color: 'var(--theme-text-muted)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={loading}
                  className="forge-input text-[13px]"
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="text-white/25 hover:text-white/60 transition-colors mr-1"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !identifier.trim() || !password}
              className="forge-btn-primary w-full text-[14px] py-3.5 mt-4 group disabled:opacity-30 disabled:pointer-events-none"
            >
              {loading ? (
                <>Verifying console keyway…</>
              ) : (
                <>
                  Unlock Console
                  <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          {/* Helper links */}
          <div className="text-center pt-2 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => goTo('signup')}
              className="text-[12.5px] font-semibold hover:underline"
              style={{ color: 'var(--theme-accent)' }}
            >
              Register a new account
            </button>
            <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.15)' }}>or</span>
            <button
              type="button"
              onClick={handleGoToSignup}
              className="text-[11px] hover:underline"
              style={{ color: 'var(--theme-text-muted)' }}
            >
              Start new onboarding flow
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center max-w-md mx-auto w-full flex-shrink-0">
        <p className="text-[11px]" style={{ color: 'var(--theme-text-muted)', opacity: 0.6 }}>
          Forge Operator Console · Client-Side Sandboxed Auth
        </p>
      </footer>
    </div>
  )
}
