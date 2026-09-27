import { useState, useEffect } from 'react'
import { useForge } from '../../App'
import {
  ArrowRight,
  Lock,
  User,
  AlertTriangle,
  ShieldCheck,
  Eye,
  EyeOff,
  Sparkles,
  Zap,
  Layers,
  KeyRound,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Fingerprint
} from 'lucide-react'
import WingLogo from '../ui/WingLogo'

export default function Login() {
  const { goTo, updateCreator, setUserProfile, updateAiKeys } = useForge()
  const [identifier, setIdentifier] = useState('') // email or username
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [visible, setVisible] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [activeRole, setActiveRole] = useState('operator') // 'operator' | 'creator'

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60)
    return () => clearTimeout(t)
  }, [])

  // Auto-fill demo credentials helper for seamless test access
  const handleAutoFillDemo = () => {
    setIdentifier('admin')
    setPassword('creatorforge2026')
    setError('')
  }

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
      .then(async (res) => {
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

        setTimeout(() => {
          const sp = new URLSearchParams(window.location.search)
          const redirect = sp.get('redirect')
          if (redirect) {
            window.location.href = redirect
          } else {
            goTo('dashboard')
          }
        }, 700)
      })
      .catch((err) => {
        setError(err.message || 'Failed to authenticate console keyway. Please check your credentials.')
        setLoading(false)
      })
  }

  const handleGoToSignup = () => {
    localStorage.clear()
    goTo('welcome')
  }

  return (
    <div className="min-h-screen bg-[#06080d] text-white flex flex-col justify-between py-8 px-4 sm:px-6 relative overflow-hidden select-none font-sans">
      {/* Ambient Glow Orbs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-600/10 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/[0.03] rounded-full blur-[140px] pointer-events-none" />

      {/* Subtle Dot Grid Background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          maskImage: 'radial-gradient(ellipse 60% 60% at 50% 50%, #000 70%, transparent 100%)'
        }}
      />

      {/* Top Header */}
      <header className="flex items-center justify-between max-w-5xl mx-auto w-full relative z-10">
        <button
          onClick={() => goTo('welcome')}
          className="flex items-center gap-3 hover:opacity-90 transition-all cursor-pointer group"
        >
          <div className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.08] shadow-sm group-hover:border-white/[0.15] transition-all">
            <WingLogo size={20} />
          </div>
          <div>
            <span className="text-white font-extrabold text-sm sm:text-base tracking-tight block">
              Creator Forge
            </span>
            <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase block">
              Operator & Studio OS
            </span>
          </div>
        </button>

        {/* Live Security Node Indicator */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-400 font-medium shadow-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="hidden sm:inline">Node Active · 256-Bit SHA</span>
          <span className="sm:hidden">Active</span>
        </div>
      </header>

      {/* Main Login Card */}
      <main
        className="flex-1 flex items-center justify-center my-6 relative z-10"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.65s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        <div className="w-full max-w-[430px] rounded-3xl bg-[#0c0f17]/90 backdrop-blur-2xl border border-white/[0.08] p-7 sm:p-8 space-y-6 shadow-[0_32px_80px_rgba(0,0,0,0.8)] relative overflow-hidden">
          {/* Specular hairline top glow */}
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          {/* Role Mode Selector Toggle */}
          <div className="p-1 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveRole('operator')}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeRole === 'operator'
                  ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/30 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Studio Operator</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveRole('creator')}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeRole === 'creator'
                  ? 'bg-gradient-to-r from-amber-500/20 to-purple-500/20 text-amber-300 border border-amber-500/30 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Co-Founder Portal</span>
            </button>
          </div>

          {/* Heading */}
          <div className="text-center space-y-1.5">
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-[10px] font-mono text-slate-300 uppercase tracking-widest">
              <KeyRound className="w-2.5 h-2.5 text-emerald-400" />
              <span>
                {activeRole === 'operator' ? 'Studio Console Keyway' : 'Creator Co-Launch Access'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {activeRole === 'operator' ? 'Unlock Master Console' : 'Partner Sign-In'}
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
              {activeRole === 'operator'
                ? 'Authenticate your operator session to access Acquisition, ProjectOS, and Co-Builders.'
                : 'Enter your credentials or use the dedicated magic link sent to your partner email.'}
            </p>
          </div>

          {/* Quick Demo Fill Pill (discreet & high utility) */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.05] text-[11px]">
            <span className="text-slate-400">Need instant testing access?</span>
            <button
              type="button"
              onClick={handleAutoFillDemo}
              className="text-amber-400 hover:text-amber-300 font-semibold cursor-pointer transition-colors flex items-center gap-1"
            >
              <Fingerprint className="w-3.5 h-3.5" />
              <span>Auto-Fill Demo</span>
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-3.5 flex items-start gap-2.5 text-left animate-in fade-in duration-200">
              <AlertTriangle className="text-red-400 shrink-0 w-4 h-4 mt-0.5" />
              <div className="text-xs text-red-200 leading-snug">
                <p className="font-bold">Authentication Refused</p>
                <p className="text-[11px] text-red-300/80 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Identifier Field */}
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Username or Email</span>
                <span className="text-[9px] text-slate-500 lowercase">operator credential</span>
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-emerald-400 transition-colors">
                  <User size={15} />
                </div>
                <input
                  type="text"
                  required
                  disabled={loading}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="admin or user@domain.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.1] group-focus-within:border-emerald-500/60 group-focus-within:bg-white/[0.06] text-xs text-white placeholder-slate-500 focus:outline-none focus:shadow-[0_0_20px_rgba(16,185,129,0.15)] transition-all font-mono"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Console Password</span>
                <span className="text-[9px] text-slate-500">AES-256</span>
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-emerald-400 transition-colors">
                  <Lock size={15} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={loading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter console password"
                  className="w-full pl-10 pr-11 py-3 rounded-xl bg-white/[0.04] border border-white/[0.1] group-focus-within:border-emerald-500/60 group-focus-within:bg-white/[0.06] text-xs text-white placeholder-slate-500 focus:outline-none focus:shadow-[0_0_20px_rgba(16,185,129,0.15)] transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !identifier.trim() || !password}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 hover:brightness-110 active:scale-[0.98] text-slate-950 font-black text-xs transition-all shadow-[0_12px_28px_rgba(16,185,129,0.25)] cursor-pointer disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2 mt-5"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Console Keyway…</span>
                </>
              ) : (
                <>
                  <span>Unlock Workspace Console</span>
                  <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          {/* Quick Portals & Links */}
          <div className="pt-3 border-t border-white/[0.06] space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <button
                type="button"
                onClick={handleGoToSignup}
                className="hover:text-emerald-400 transition-colors cursor-pointer"
              >
                Start Onboarding
              </button>
              <span>•</span>
              <a
                href="/portal"
                className="hover:text-amber-400 transition-colors flex items-center gap-1"
              >
                <span>Creator Portal</span>
                <ExternalLink size={10} />
              </a>
              <span>•</span>
              <a
                href="/participation-manager"
                className="hover:text-purple-400 transition-colors flex items-center gap-1"
              >
                <span>Co-Builders</span>
                <ExternalLink size={10} />
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center max-w-md mx-auto w-full relative z-10 pt-2">
        <p className="text-[11px] text-slate-500">
          Creator Forge · 50/50 Co-Founder Venture Engine · Secure Keyway
        </p>
      </footer>
    </div>
  )
}
