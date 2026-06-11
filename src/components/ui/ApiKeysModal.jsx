import { useState, useEffect } from 'react'
import { X, ExternalLink, Check, Eye, EyeOff, ChevronDown, Loader2, AlertCircle, Sparkles, Zap, Download, ShieldCheck, Database, Trash2 } from 'lucide-react'
import WingLogo from './WingLogo'
import { loadKeys, saveKeys, testApifyToken } from '../../services/scraper'
import { loadAiKeys, saveAiKeys, hasGeminiKey, hasTogetherKey, getAiKeysConsent, setAiKeysConsent, saveAiKeysToDb, deleteAiKeysFromDb } from '../../services/ai'
import { useForge } from '../../App'

export default function ApiKeysModal({ onClose, platform, defaultTab = 'scraping' }) {
  const { userProfile, updateAiKeys } = useForge()
  const [tab, setTab] = useState(defaultTab) // 'scraping' | 'ai'

  // ── Scraping keys ──────────────────────────────────────────────────────────
  const [apKey,      setApKey]      = useState('')
  const [ytKey,      setYtKey]      = useState('')
  const [showAp,     setShowAp]     = useState(false)
  const [showYt,     setShowYt]     = useState(false)
  const [showAdv,    setShowAdv]    = useState(false)
  const [testStatus, setTestStatus] = useState(null)
  const [testMsg,    setTestMsg]    = useState('')

  // ── AI keys ────────────────────────────────────────────────────────────────
  const [gemKey,      setGemKey]      = useState('')
  const [togetherKey, setTogetherKey] = useState('')
  const [nvKey,       setNvKey]       = useState('')
  const [showGem,     setShowGem]     = useState(false)
  const [showTogether,setShowTogether]= useState(false)
  const [showNv,       setShowNv]       = useState(false)

  // ── Consent for saving AI keys to DB ───────────────────────────────────────
  const [consentSave, setConsentSave] = useState(false)

  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const scrapeKeys = loadKeys()
    setApKey(scrapeKeys.apifyToken    || '')
    setYtKey(scrapeKeys.youtubeApiKey || '')
    const aiKeys = loadAiKeys()
    setGemKey(aiKeys.geminiKey      || '')
    setTogetherKey(aiKeys.togetherKey || '')
    setNvKey(aiKeys.nvidiaKey        || '')
    // Restore consent state
    setConsentSave(getAiKeysConsent())
  }, [])

  const handleSave = async () => {
    saveKeys({ apifyToken: apKey, youtubeApiKey: ytKey })
    updateAiKeys({ geminiKey: gemKey, togetherKey, nvidiaKey: nvKey })

    // Handle DB persistence based on consent
    if (tab === 'ai' && userProfile?.username) {
      const hasAnyAiKey = !!(gemKey.trim() || togetherKey.trim() || nvKey.trim())
      if (consentSave) {
        setAiKeysConsent(true)
        if (hasAnyAiKey) {
          await saveAiKeysToDb(userProfile.username)
        } else {
          await deleteAiKeysFromDb(userProfile.username)
        }
      } else {
        setAiKeysConsent(false)
        await deleteAiKeysFromDb(userProfile.username)
      }
    }

    setSaved(true)
    setTimeout(() => { setSaved(false); onClose?.() }, 800)
  }

  const handleDownloadPdf = () => {
    fetch('/api/settings/download-keys-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apify_token: apKey,
        youtube_api_key: ytKey,
        gemini_api_key: gemKey,
        together_api_key: togetherKey,
        nvidia_api_key: nvKey
      })
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to generate PDF')
        return res.blob()
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'creator_forge_api_keys.pdf'
        document.body.appendChild(a)
        a.click()
        a.remove()
        window.URL.revokeObjectURL(url)
      })
      .catch(err => {
        console.error('[Forge] PDF download error:', err)
        alert('Could not download API keys PDF backup. Please try again.')
      })
  }

  const handleTest = async () => {
    if (!apKey.trim()) return
    setTestStatus('testing')
    setTestMsg('')
    const result = await testApifyToken(apKey)
    if (result.ok) {
      setTestStatus('ok')
      setTestMsg('Connected to Apify')
    } else {
      setTestStatus('error')
      setTestMsg(result.error || 'Invalid token')
    }
  }

  const apConnected      = !!apKey.trim()
  const ytConnected      = !!ytKey.trim()
  const gemConnected     = !!gemKey.trim()
  const togetherConnected= !!togetherKey.trim()
  const nvConnected      = !!nvKey.trim()
  const hasAnyAiKey      = gemConnected || togetherConnected || nvConnected
  const canSave          = !!(apKey.trim() || ytKey.trim() || gemKey.trim() || togetherKey.trim() || nvKey.trim())
  const isLoggedIn       = !!userProfile?.username

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(14px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose?.() }}
    >
      <div
        className="w-full max-w-md rounded-2xl border overflow-hidden"
        style={{ background: '#0e0e0e', borderColor: 'rgba(255,255,255,0.1)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b"
          style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-3">
            <WingLogo size={20} />
            <div>
              <p className="text-[15px] font-semibold text-white">API Keys</p>
              <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                {consentSave && isLoggedIn ? 'Saved to your account' : 'Cloud sync available'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/25 hover:text-white/60 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          {[
            { id: 'scraping', label: 'Scraping', icon: Zap,      desc: 'Profile data' },
            { id: 'ai',       label: 'AI',        icon: Sparkles, desc: 'Generate content' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 text-[13px] font-medium transition-colors relative"
              style={{ color: tab === t.id ? 'white' : 'rgba(255,255,255,0.35)' }}
            >
              <t.icon size={13} />
              {t.label}
              {/* Active indicator */}
              {tab === t.id && (
                <div className="absolute bottom-0 left-4 right-4 h-px bg-white rounded-full" />
              )}
            </button>
          ))}
        </div>

        <div className="p-6 space-y-5 overflow-y-auto" style={{ maxHeight: '60vh' }}>
          {/* Security Notice Banner */}
          <div
            className="rounded-xl border p-3.5 flex items-start gap-3 text-left"
            style={{
              background: consentSave && isLoggedIn && tab === 'ai'
                ? 'rgba(16, 185, 129, 0.04)'
                : 'rgba(59, 130, 246, 0.04)',
              borderColor: consentSave && isLoggedIn && tab === 'ai'
                ? 'rgba(16, 185, 129, 0.15)'
                : 'rgba(59, 130, 246, 0.15)'
            }}
          >
            {consentSave && isLoggedIn && tab === 'ai' ? (
              <ShieldCheck className="text-emerald-400 flex-shrink-0 mt-0.5" size={15} />
            ) : (
              <AlertCircle className="text-blue-400 flex-shrink-0 mt-0.5" size={15} />
            )}
            <div className="space-y-0.5">
              <h4 className="text-[12px] font-semibold text-white">
                {tab === 'scraping' 
                  ? 'Local Storage' 
                  : consentSave && isLoggedIn 
                    ? 'Cloud Sync Enabled' 
                    : 'Secure Cloud Save'}
              </h4>
              <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
                {tab === 'scraping'
                  ? 'Scraping keys are kept in your browser and never stored on the server.'
                  : consentSave && isLoggedIn
                    ? 'Your AI keys are saved to your account and loaded automatically.'
                    : 'Save your AI keys below to automatically restore them next time you log in.'}
              </p>
            </div>
          </div>

          {/* ── SCRAPING TAB ─────────────────────────────────────────── */}
          {tab === 'scraping' && (
            <>
              {/* Platform coverage badges */}
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'YouTube',   color: '#ff3b30' },
                  { label: 'Instagram', color: '#e1306c' },
                  { label: 'TikTok',    color: '#69c9d0' },
                  { label: 'X/Twitter', color: '#60a5fa' },
                ].map(p => (
                  <span key={p.label}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: `${p.color}18`, color: p.color, border: `1px solid ${p.color}28` }}>
                    {p.label}
                  </span>
                ))}
              </div>

              {/* Steps */}
              <div className="space-y-2">
                {[
                  { n: 1, text: 'Go to', link: 'https://console.apify.com/account/integrations', label: 'apify.com → Account → Integrations' },
                  { n: 2, text: 'Sign up free — includes $5/mo credit (hundreds of lookups)' },
                  { n: 3, text: 'Copy your Personal API Token and paste it below' },
                ].map(s => (
                  <div key={s.n} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: 'rgba(255,255,255,0.07)', fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>
                      {s.n}
                    </div>
                    <p className="text-[12px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
                      {s.text}{' '}
                      {s.link && (
                        <a href={s.link} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 underline"
                          style={{ color: 'rgba(255,255,255,0.75)' }}>
                          {s.label} <ExternalLink size={9} />
                        </a>
                      )}
                    </p>
                  </div>
                ))}
              </div>

              {/* Apify token */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>Apify Personal API Token</p>
                  {testStatus === 'ok' && (
                    <div className="flex items-center gap-1 text-[11px]" style={{ color: 'rgba(100,220,100,0.85)' }}>
                      <Check size={10} /> {testMsg}
                    </div>
                  )}
                  {testStatus === 'error' && (
                    <div className="flex items-center gap-1 text-[11px]" style={{ color: 'rgba(255,90,90,0.85)' }}>
                      <AlertCircle size={10} /> Invalid
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 rounded-xl border px-4 py-3"
                  style={{
                    background: '#111',
                    borderColor: testStatus === 'ok' ? 'rgba(100,220,100,0.4)' : testStatus === 'error' ? 'rgba(255,90,90,0.35)' : apConnected ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.1)',
                  }}>
                  <input
                    type={showAp ? 'text' : 'password'}
                    className="flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-white/20 font-mono"
                    placeholder="apify_api_xxxxxxxxxxxxxxxx"
                    value={apKey}
                    onChange={e => { setApKey(e.target.value); setTestStatus(null); setTestMsg('') }}
                    autoFocus={tab === 'scraping'}
                  />
                  <button onClick={() => setShowAp(v => !v)} className="text-white/25 hover:text-white/60 transition-colors mr-1">
                    {showAp ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button
                    onClick={handleTest}
                    disabled={!apKey.trim() || testStatus === 'testing'}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all disabled:opacity-30 flex-shrink-0"
                    style={{
                      background: testStatus === 'ok' ? 'rgba(100,220,100,0.12)' : 'rgba(255,255,255,0.08)',
                      color: testStatus === 'ok' ? 'rgba(100,220,100,0.9)' : 'rgba(255,255,255,0.5)',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    {testStatus === 'testing' ? <Loader2 size={11} className="animate-spin" /> : testStatus === 'ok' ? <Check size={11} /> : 'Test'}
                  </button>
                </div>
                {testStatus === 'error' && testMsg && (
                  <p className="text-[11px] mt-1.5" style={{ color: 'rgba(255,90,90,0.65)' }}>{testMsg}</p>
                )}
              </div>

              {/* YouTube Data API (advanced) */}
              <div>
                <button
                  onClick={() => setShowAdv(v => !v)}
                  className="flex items-center gap-1.5 text-[11px] transition-colors"
                  style={{ color: showAdv ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.2)' }}
                >
                  <ChevronDown size={12} style={{ transform: showAdv ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                  Advanced: YouTube Data API key (optional backup)
                  {ytConnected && <span className="ml-1 text-green-400">✓</span>}
                </button>
                {showAdv && (
                  <div className="mt-3 space-y-2">
                    <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      Fallback if Apify YouTube actor is unavailable.{' '}
                      <a href="https://console.cloud.google.com/apis/library/youtube.googleapis.com"
                        target="_blank" rel="noopener noreferrer"
                        className="underline" style={{ color: 'rgba(255,255,255,0.55)' }}>
                        Get a free key
                      </a>
                    </p>
                    <div className="flex items-center gap-2 rounded-xl border px-4 py-3"
                      style={{ background: '#111', borderColor: ytConnected ? 'rgba(100,220,100,0.25)' : 'rgba(255,255,255,0.08)' }}>
                      <input
                        type={showYt ? 'text' : 'password'}
                        className="flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-white/20 font-mono"
                        placeholder="AIzaSy..."
                        value={ytKey}
                        onChange={e => setYtKey(e.target.value)}
                      />
                      <button onClick={() => setShowYt(v => !v)} className="text-white/25 hover:text-white/60 transition-colors">
                        {showYt ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── AI TAB ───────────────────────────────────────────────── */}
          {tab === 'ai' && (
            <>
              {/* What each key does */}
              <div className="rounded-xl p-4 space-y-2.5"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-[11px] font-semibold text-white/50 mb-3 uppercase tracking-wider">What gets generated</p>
                {[
                  { icon: '✉', label: 'Launch email',          key: 'NVIDIA / Gemini',    color: 'rgba(66,133,244,0.8)' },
                  { icon: '📸', label: 'Instagram + TikTok + X', key: 'NVIDIA / Gemini',   color: 'rgba(66,133,244,0.8)' },
                  { icon: '📊', label: 'Pitch deck (5 slides)', key: 'NVIDIA / Gemini',    color: 'rgba(66,133,244,0.8)' },
                  { icon: '🖼', label: 'Product mockup image',  key: 'NVIDIA / Together', color: 'rgba(118,185,0,0.8)' },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-[14px]">{item.icon}</span>
                      <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.55)' }}>{item.label}</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{ background: 'rgba(255,255,255,0.07)', color: item.color }}>
                      {item.key}
                    </span>
                  </div>
                ))}
              </div>

              {/* Gemini key */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-[12px] font-semibold text-white">Google Gemini API Key</p>
                    <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      Free at{' '}
                      <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer"
                        className="underline" style={{ color: 'rgba(66,133,244,0.8)' }}>
                        aistudio.google.com/apikey <ExternalLink size={9} className="inline" />
                      </a>
                    </p>
                  </div>
                  {gemConnected && (
                    <div className="flex items-center gap-1 text-[11px]" style={{ color: 'rgba(100,220,100,0.8)' }}>
                      <Check size={10} /> Connected
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 rounded-xl border px-4 py-3"
                  style={{ background: '#111', borderColor: gemConnected ? 'rgba(100,220,100,0.3)' : 'rgba(255,255,255,0.1)' }}>
                  <input
                    type={showGem ? 'text' : 'password'}
                    autoComplete="new-password"
                    className="flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-white/20 font-mono"
                    placeholder="AIzaSy..."
                    value={gemKey}
                    onChange={e => setGemKey(e.target.value)}
                    autoFocus={tab === 'ai'}
                  />
                  <button onClick={() => setShowGem(v => !v)} className="text-white/25 hover:text-white/60 transition-colors mr-1">
                    {showGem ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  {gemKey && (
                    <button
                      onClick={() => setGemKey('')}
                      title="Delete key"
                      className="text-white/25 hover:text-red-400 transition-colors flex-shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Together.ai key */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-[12px] font-semibold text-white">
                      Together.ai Key <span className="font-normal text-white/40">(optional — for images)</span>
                    </p>
                    <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      Free account at{' '}
                      <a href="https://api.together.ai" target="_blank" rel="noopener noreferrer"
                        className="underline" style={{ color: 'rgba(130,100,255,0.8)' }}>
                        api.together.ai <ExternalLink size={9} className="inline" />
                      </a>
                      {' '}— uses free FLUX model, no credit card.
                    </p>
                  </div>
                  {togetherConnected && (
                    <div className="flex items-center gap-1 text-[11px]" style={{ color: 'rgba(100,220,100,0.8)' }}>
                      <Check size={10} /> Connected
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 rounded-xl border px-4 py-3"
                  style={{ background: '#111', borderColor: togetherConnected ? 'rgba(100,220,100,0.3)' : 'rgba(255,255,255,0.1)' }}>
                  <input
                    type={showTogether ? 'text' : 'password'}
                    autoComplete="new-password"
                    className="flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-white/20 font-mono"
                    placeholder="together-api-..."
                    value={togetherKey}
                    onChange={e => setTogetherKey(e.target.value)}
                  />
                  <button onClick={() => setShowTogether(v => !v)} className="text-white/25 hover:text-white/60 transition-colors mr-1">
                    {showTogether ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  {togetherKey && (
                    <button
                      onClick={() => setTogetherKey('')}
                      title="Delete key"
                      className="text-white/25 hover:text-red-400 transition-colors flex-shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* NVIDIA NIM Key */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-[12px] font-semibold text-white">
                      NVIDIA NIM Key <span className="font-normal text-white/40">(optional — for images and text)</span>
                    </p>
                    <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      Free account at{' '}
                      <a href="https://build.nvidia.com" target="_blank" rel="noopener noreferrer"
                        className="underline" style={{ color: '#76b900' }}>
                        build.nvidia.com <ExternalLink size={9} className="inline" />
                      </a>
                      {' '}— generates mockup images and Nemotron text.
                    </p>
                  </div>
                  {nvConnected && (
                    <div className="flex items-center gap-1 text-[11px]" style={{ color: 'rgba(100,220,100,0.8)' }}>
                      <Check size={10} /> Connected
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 rounded-xl border px-4 py-3"
                  style={{ background: '#111', borderColor: nvConnected ? 'rgba(100,220,100,0.3)' : 'rgba(255,255,255,0.1)' }}>
                  <input
                    type={showNv ? 'text' : 'password'}
                    autoComplete="new-password"
                    className="flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-white/20 font-mono"
                    placeholder="nvapi-..."
                    value={nvKey}
                    onChange={e => setNvKey(e.target.value)}
                  />
                  <button onClick={() => setShowNv(v => !v)} className="text-white/25 hover:text-white/60 transition-colors mr-1">
                    {showNv ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  {nvKey && (
                    <button
                      onClick={() => setNvKey('')}
                      title="Delete key"
                      className="text-white/25 hover:text-red-400 transition-colors flex-shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <p className="text-[11px] mt-1.5" style={{ color: 'rgba(255,255,255,0.18)' }}>
                  If neither Together nor NVIDIA keys are set, product mockup images will be omitted.
                </p>
              </div>

              {/* ── Consent to save AI keys ────────────────────────────── */}
              {isLoggedIn && hasAnyAiKey && (
                <div
                  className="rounded-xl border p-4 transition-all duration-200"
                  style={{
                    background: consentSave ? 'rgba(16,185,129,0.04)' : 'rgba(255,255,255,0.02)',
                    borderColor: consentSave ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.08)',
                  }}
                >
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <div className="mt-0.5 flex-shrink-0">
                      <div
                        className="w-4 h-4 rounded border flex items-center justify-center transition-all duration-150"
                        style={{
                          background: consentSave ? 'rgba(16,185,129,0.9)' : 'transparent',
                          borderColor: consentSave ? 'rgba(16,185,129,0.9)' : 'rgba(255,255,255,0.25)',
                        }}
                        onClick={() => setConsentSave(v => !v)}
                      >
                        {consentSave && <Check size={10} className="text-white" strokeWidth={3} />}
                      </div>
                    </div>
                    <div onClick={() => setConsentSave(v => !v)}>
                      <p className="text-[12px] font-semibold text-white leading-tight">
                        Save my AI keys to my account
                      </p>
                      <p className="text-[11px] leading-relaxed mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        Your keys will be stored in your account and automatically restored when you log in.
                      </p>
                    </div>
                  </label>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-2.5 px-6 pb-6 pt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={!canSave}
              className="forge-btn-primary flex-1 text-[14px] py-3 gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {saved ? <><Check size={14} /> Saved!</> : (
                <>
                  {consentSave && isLoggedIn && tab === 'ai' && <Database size={13} />}
                  {consentSave && isLoggedIn && tab === 'ai' ? 'Save keys to account' : 'Save keys'}
                </>
              )}
            </button>
            <button onClick={onClose} className="forge-btn-secondary text-[13px] py-3 px-4">
              Cancel
            </button>
          </div>

          {canSave && (
            <button
              onClick={handleDownloadPdf}
              className="forge-btn-secondary w-full text-[12px] py-2.5 flex items-center justify-center gap-2"
              style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.08)' }}
            >
              <Download size={13} className="text-white/40" />
              Download API Keys PDF Backup
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
