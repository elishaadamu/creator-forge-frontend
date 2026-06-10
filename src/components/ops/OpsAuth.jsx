/**
 * OpsAuth — lightweight password gate for the /ops internal panel.
 *
 * Strategy: stores a session token in sessionStorage so login persists
 * for the browser tab. On close/refresh the token clears (intentional).
 *
 * Two modes:
 *  1. VITE_OPS_PASSWORD is set → password checked client-side (dev/quick deploy)
 *  2. Supabase keys are set   → proper email + password via Supabase Auth
 *
 * In production, use Supabase — add the user once via:
 *   supabase.auth.admin.createUser({ email, password, email_confirm: true })
 */
import { useState, useEffect } from 'react'
import { Shield, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'
import { supabase, signIn as supabaseSignIn } from '../../services/supabase'

const SESSION_KEY = 'forge_ops_authed'

// ── Determine auth mode ────────────────────────────────────────────────────────
const OPS_PASSWORD   = import.meta.env.VITE_OPS_PASSWORD   || ''
const SUPABASE_URL   = import.meta.env.VITE_SUPABASE_URL   || ''
const USE_SUPABASE   = SUPABASE_URL.startsWith('http')

function checkSession() {
  return sessionStorage.getItem(SESSION_KEY) === 'yes'
}

function setSession() {
  sessionStorage.setItem(SESSION_KEY, 'yes')
}

function clearSession() {
  sessionStorage.removeItem(SESSION_KEY)
}

// ── Login screen ───────────────────────────────────────────────────────────────
function OpsLogin({ onAuth }) {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [show,     setShow]     = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!password) return
    setLoading(true)
    setError('')

    try {
      if (USE_SUPABASE) {
        // Full Supabase email+password login
        await supabaseSignIn(email, password)
        setSession()
        onAuth()
      } else if (OPS_PASSWORD) {
        // Simple env-var password check
        if (password === OPS_PASSWORD) {
          setSession()
          onAuth()
        } else {
          setError('Incorrect password.')
        }
      } else {
        // No auth configured — dev mode, just pass through
        setSession()
        onAuth()
      }
    } catch (err) {
      setError(err.message || 'Login failed. Check your credentials.')
    }
    setLoading(false)
  }

  const devMode = !USE_SUPABASE && !OPS_PASSWORD

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: '#080808' }}
    >
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      <div
        className="relative w-full max-w-sm mx-4 rounded-2xl border overflow-hidden"
        style={{ background: '#0e0e0e', borderColor: 'rgba(255,255,255,0.09)' }}
      >
        {/* Header */}
        <div
          className="px-7 pt-8 pb-6 border-b"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-3 mb-5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <Shield size={16} className="text-white" />
            </div>
            <div>
              <p className="text-[13px] font-bold text-white">Forge Ops</p>
              <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Internal Pipeline
              </p>
            </div>
          </div>
          <h1 className="text-[22px] font-bold text-white tracking-tight">Sign in</h1>
          <p className="text-[12px] mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {USE_SUPABASE ? 'Enter your operator credentials.' : 'This panel is restricted to operators only.'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-7 py-6 space-y-4">
          {devMode && (
            <div
              className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl"
              style={{ background: 'rgba(255,180,0,0.06)', border: '1px solid rgba(255,180,0,0.18)' }}
            >
              <AlertCircle size={13} style={{ color: 'rgba(255,180,0,0.8)', flexShrink: 0, marginTop: 1 }} />
              <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(255,200,60,0.8)' }}>
                <strong>Dev mode</strong> — no password configured. Add{' '}
                <code style={{ color: 'rgba(255,200,60,0.9)' }}>VITE_OPS_PASSWORD</code> to{' '}
                <code>.env.local</code> to protect this panel.
              </p>
            </div>
          )}

          {USE_SUPABASE && (
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@yourcompany.com"
                required
                className="w-full px-4 py-3 rounded-xl text-[13px] text-white outline-none placeholder:text-white/20"
                style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)' }}
                onFocus={e => e.target.style.borderColor = 'rgba(255,255,255,0.25)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Password
            </label>
            <div className="relative">
              <input
                type={show ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={devMode ? 'Any value (dev mode)' : '••••••••'}
                autoComplete="current-password"
                required={!devMode}
                className="w-full px-4 py-3 pr-11 rounded-xl text-[13px] text-white outline-none placeholder:text-white/20"
                style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)' }}
                onFocus={e => e.target.style.borderColor = 'rgba(255,255,255,0.25)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
              <button
                type="button"
                onClick={() => setShow(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: 'rgba(255,255,255,0.25)' }}
                onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.55)'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.25)'}
              >
                {show ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {error && (
            <div
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
            >
              <AlertCircle size={12} style={{ color: 'rgba(239,68,68,0.8)', flexShrink: 0 }} />
              <p className="text-[11px]" style={{ color: 'rgba(239,68,68,0.9)' }}>{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || (!devMode && !password)}
            className="w-full py-3 rounded-xl text-[13px] font-semibold text-black transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: loading ? 'rgba(255,255,255,0.7)' : 'white' }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={13} className="animate-spin" /> Signing in…
              </span>
            ) : devMode ? 'Enter (dev mode)' : 'Sign in'}
          </button>

          {devMode && (
            <p className="text-center text-[10px]" style={{ color: 'rgba(255,255,255,0.15)' }}>
              Set VITE_OPS_PASSWORD in .env.local to enable password protection
            </p>
          )}
        </form>
      </div>
    </div>
  )
}

// ── Auth wrapper — wraps OpsLayout ─────────────────────────────────────────────
export default function OpsAuth({ children }) {
  const [authed, setAuthed] = useState(checkSession)

  // Also check active Supabase session on mount
  useEffect(() => {
    if (USE_SUPABASE && !authed && supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setSession()
          setAuthed(true)
        }
      })
    }
  }, [])

  if (!authed) {
    return <OpsLogin onAuth={() => setAuthed(true)} />
  }

  return children
}

// ── Sign-out helper (call from OpsLayout header) ───────────────────────────────
export function opsSignOut() {
  clearSession()
  if (USE_SUPABASE) {
    supabase.auth.signOut().catch(() => {})
  }
  window.location.reload()
}
