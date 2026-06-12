import { useState, useEffect } from 'react'
import { useForge } from '../../App'
import { Check, Radio, RefreshCw, Calendar, Upload, Mail, ChevronRight, AlertCircle, Zap, ShieldCheck, Trash2, Sparkles, Eye, EyeOff, ChevronDown, Loader2, Download, Database, ExternalLink } from 'lucide-react'
import { loadAiKeys, saveAiKeys, getAiKeysConsent, setAiKeysConsent, saveAiKeysToDb, deleteAiKeysFromDb } from '../../services/ai'

// ─── Toggle ──────────────────────────────────────────────────────────────────

function Toggle({ value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="relative flex-shrink-0 transition-all duration-200"
      style={{
        width: '36px',
        height: '20px',
        borderRadius: '100px',
        background: value ? 'white' : 'rgba(255,255,255,0.12)',
      }}
    >
      <div
        className="absolute top-1 rounded-full transition-all duration-200"
        style={{
          width: '14px',
          height: '14px',
          left: value ? '19px' : '3px',
          background: value ? 'black' : 'rgba(255,255,255,0.3)',
        }}
      />
    </button>
  )
}

// ─── Automation card ─────────────────────────────────────────────────────────

function AutomationCard({ automation, onToggle, onEdit }) {
  return (
    <div
      className="rounded-xl border p-4 transition-all duration-150"
      style={{
        background: automation.active ? 'rgba(255,255,255,0.04)' : '#111',
        borderColor: automation.active ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.07)',
      }}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.07)' }}
        >
          <automation.icon size={15} className="text-white/50" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-[13px] font-semibold text-white">{automation.label}</p>
            {automation.active && (
              <span
                className="text-[9px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide"
                style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}
              >
                Active
              </span>
            )}
          </div>
          <p className="text-[12px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.38)' }}>
            {automation.description}
          </p>

          {/* Sub-settings when active */}
          {automation.active && (
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span
                className="text-[11px] px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)' }}
              >
                {automation.cadence}
              </span>
              <span
                className="text-[11px] px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)' }}
              >
                {automation.mode === 'draft' ? 'Creates drafts' : 'Auto-posts'}
              </span>
              <button
                onClick={onEdit}
                className="text-[11px] px-2.5 py-1 rounded-full transition-all duration-150"
                style={{ color: 'rgba(255,255,255,0.3)' }}
                onMouseEnter={e => { e.target.style.color = 'rgba(255,255,255,0.6)' }}
                onMouseLeave={e => { e.target.style.color = 'rgba(255,255,255,0.3)' }}
              >
                Edit →
              </button>
            </div>
          )}
        </div>

        {/* Toggle */}
        <Toggle value={automation.active} onChange={onToggle} />
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const INITIAL_AUTOMATIONS = [
  {
    id: 'weekly-content',
    icon: Calendar,
    label: 'Weekly content plan',
    description: 'Every Monday, Forge generates a full week of posts tailored to your launch goals and drops them into your calendar as drafts.',
    cadence: 'Every Monday',
    mode: 'draft',
    active: false,
  },
  {
    id: 'community-post',
    icon: Radio,
    label: 'Weekly community post',
    description: 'Automatically creates a discussion starter or challenge post for your community each week to keep members engaged.',
    cadence: 'Every Sunday',
    mode: 'draft',
    active: false,
  },
  {
    id: 'repurpose',
    icon: RefreshCw,
    label: 'Repurpose YouTube uploads',
    description: 'When you upload a YouTube video, Forge automatically generates 5 short-form posts adapted for Instagram, X, TikTok, and your email list.',
    cadence: 'On each upload',
    mode: 'draft',
    active: false,
  },
  {
    id: 'launch-reminders',
    icon: AlertCircle,
    label: 'Launch reminder drafts',
    description: 'Before key launch dates, Forge auto-drafts countdown posts and emails so you never go dark during your most important moments.',
    cadence: '3 days before dates',
    mode: 'draft',
    active: false,
  },
  {
    id: 'product-update-copy',
    icon: Upload,
    label: 'Product update copy',
    description: 'When you make changes to your product, Forge drafts an announcement post and email to keep your audience informed.',
    cadence: 'On product changes',
    mode: 'draft',
    active: false,
  },
  {
    id: 'milestone-posts',
    icon: Radio,
    label: 'Milestone celebration posts',
    description: 'When you hit milestones (10 members, $1K, first sale), Forge auto-drafts a celebration post to share your momentum.',
    cadence: 'On milestone hit',
    mode: 'draft',
    active: false,
  },
]

const NOTIFICATION_SETTINGS = [
  { key: 'newMember', label: 'New member joins', sub: 'Email when someone signs up' },
  { key: 'weeklySummary', label: 'Weekly summary', sub: 'Revenue & growth digest every Monday' },
  { key: 'revenueAlerts', label: 'Revenue alerts', sub: 'Notified on each payment' },
  { key: 'contentReminders', label: 'Content reminders', sub: 'Calendar post-day reminders' },
  { key: 'automationRun', label: 'Automation notifications', sub: 'When an automation creates a draft' },
]

const NICHE_KEYWORDS = {
  'Tech & Gadgets':         ['tech', 'technology', 'gadget', 'phone', 'apple', 'android', 'software', 'coding', 'dev', 'ai', 'programming', 'developer', 'computer', 'science', 'math'],
  'Finance & Business':     ['finance', 'money', 'invest', 'crypto', 'business', 'entrepreneur', 'startup', 'trading', 'wealth', 'stocks', 'marketing', 'sales', 'realestate', 'property'],
  'Health & Fitness':       ['fitness', 'health', 'workout', 'gym', 'nutrition', 'wellness', 'diet', 'run', 'yoga', 'crossfit', 'bodybuilding', 'muscle', 'athletics'],
  'Gaming':                 ['gaming', 'games', 'gamer', 'twitch', 'esport', 'playstation', 'xbox', 'nintendo', 'stream', 'gameplay', 'letplay'],
  'Beauty & Fashion':       ['beauty', 'makeup', 'fashion', 'style', 'skincare', 'outfit', 'luxury', 'ootd', 'glam', 'hair', 'nails', 'cosmetics'],
  'Food & Cooking':         ['food', 'cook', 'recipe', 'restaurant', 'baking', 'chef', 'eat', 'culinary', 'kitchen', 'foodie', 'mukbang', 'dessert'],
  'Travel & Lifestyle':     ['travel', 'lifestyle', 'adventure', 'explore', 'vlog', 'daily', 'trip', 'journey', 'nature', 'wanderlust', 'backpacker'],
  'Education':              ['education', 'learn', 'teach', 'tutor', 'course', 'tutorial', 'how to', 'tips', 'guide', 'study', 'science', 'history', 'geography'],
  'Comedy & Entertainment': ['comedy', 'funny', 'meme', 'entertainment', 'laugh', 'sketch', 'humor', 'jokes', 'fun', 'reaction', 'prank'],
  'Music & Arts':           ['music', 'musician', 'artist', 'art', 'creative', 'singer', 'guitar', 'producer', 'beats', 'cover', 'dance', 'drawing', 'painting', 'craft'],
  'Parenting & Family':     ['parent', 'family', 'mom', 'dad', 'kids', 'baby', 'parenting', 'children', 'motherhood', 'fatherhood', 'toddler'],
  'Creator & Marketing':    ['creator', 'content', 'youtube', 'instagram', 'social media', 'marketing', 'brand', 'influence', 'growth', 'seo', 'sponsors']
}

function inferNicheFromHandle(handle) {
  if (!handle) return 'Lifestyle & Creativity'
  const lower = handle.toLowerCase()
  for (const [niche, keywords] of Object.entries(NICHE_KEYWORDS)) {
    if (keywords.some(k => lower.includes(k))) return niche
  }
  return 'Lifestyle & Creativity'
}

export default function Settings() {
  const { creatorData, updateCreator, setApiModalOpen, userProfile, setUserProfile, aiKeys, updateAiKeys, syncSessionToDb, triggerToast } = useForge()

  const [profileName, setProfileName] = useState(creatorData.name || '')
  const [profileHandle, setProfileHandle] = useState(creatorData.handle || '')
  const [profileEmail, setProfileEmail] = useState(userProfile?.email || '')
  const [profileNiche, setProfileNiche] = useState(creatorData.niche || '')

  useEffect(() => {
    setProfileName(creatorData.name || '')
    setProfileHandle(creatorData.handle || '')
    setProfileNiche(creatorData.niche || '')
  }, [creatorData])

  useEffect(() => {
    setProfileEmail(userProfile?.email || '')
  }, [userProfile])
  const [automations, setAutomations] = useState(INITIAL_AUTOMATIONS)
  const [notifications, setNotifications] = useState({
    newMember: true,
    weeklySummary: true,
    revenueAlerts: true,
    contentReminders: false,
    automationRun: true,
  })
  const [saved, setSaved] = useState(false)
  const [activeSection, setActiveSection] = useState(() => {
    try {
      return localStorage.getItem('forge_settings_active_section') || 'profile'
    } catch {
      return 'profile'
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('forge_settings_active_section', activeSection)
    } catch (e) {
      console.warn('[Forge] Failed to cache active settings section:', e)
    }
  }, [activeSection])

  // ── AI keys ────────────────────────────────────────────────────────────────
  const [gemKey,      setGemKey]      = useState('')
  const [togetherKey, setTogetherKey] = useState('')
  const [nvKey,       setNvKey]       = useState('')
  const [openaiKey,   setOpenaiKey]   = useState('')
  const [anthropicKey,setAnthropicKey] = useState('')
  const [showGem,     setShowGem]     = useState(false)
  const [showTogether,setShowTogether]= useState(false)
  const [showNv,       setShowNv]       = useState(false)
  const [showOpenai,   setShowOpenai]   = useState(false)
  const [showAnthropic,setShowAnthropic] = useState(false)

  // ── Consent for saving AI keys to DB ───────────────────────────────────────
  const [consentSave, setConsentSave] = useState(false)
  const [keysSaved, setKeysSaved] = useState(false)

  // Load keys on mount
  useEffect(() => {
    setConsentSave(getAiKeysConsent())
  }, [])

  // Sync state if aiKeys changes in context (e.g. loads asynchronously)
  useEffect(() => {
    if (aiKeys) {
      setGemKey(aiKeys.geminiKey || '')
      setTogetherKey(aiKeys.togetherKey || '')
      setNvKey(aiKeys.nvidiaKey || '')
      setOpenaiKey(aiKeys.openaiKey || '')
      setAnthropicKey(aiKeys.anthropicKey || '')
    }
  }, [aiKeys])

  const handleDeleteIndividualKey = async (keyType) => {
    let updatedGem = gemKey
    let updatedTogether = togetherKey
    let updatedNv = nvKey
    let updatedOpenai = openaiKey
    let updatedAnthropic = anthropicKey

    if (keyType === 'gemini') {
      setGemKey('')
      updatedGem = ''
    } else if (keyType === 'together') {
      setTogetherKey('')
      updatedTogether = ''
    } else if (keyType === 'nvidia') {
      setNvKey('')
      updatedNv = ''
    } else if (keyType === 'openai') {
      setOpenaiKey('')
      updatedOpenai = ''
    } else if (keyType === 'anthropic') {
      setAnthropicKey('')
      updatedAnthropic = ''
    }

    updateAiKeys({ geminiKey: updatedGem, togetherKey: updatedTogether, nvidiaKey: updatedNv, openaiKey: updatedOpenai, anthropicKey: updatedAnthropic })

    if (userProfile?.username) {
      const hasAnyAiKey = !!(updatedGem.trim() || updatedTogether.trim() || updatedNv.trim() || updatedOpenai.trim() || updatedAnthropic.trim())
      if (consentSave) {
        if (hasAnyAiKey) {
          const success = await saveAiKeysToDb(userProfile.username)
          console.log(`[Forge] saveAiKeysToDb response after deleting ${keyType} (success status):`, success)
        } else {
          await deleteAiKeysFromDb(userProfile.username)
          console.log(`[Forge] All AI keys cleared. deleteAiKeysFromDb called after deleting ${keyType}.`)
        }
      } else {
        await deleteAiKeysFromDb(userProfile.username)
        console.log(`[Forge] Consent false. deleteAiKeysFromDb called after deleting ${keyType}.`)
      }
    }
  }

  const handleSaveApiKeys = async () => {
    updateAiKeys({ geminiKey: gemKey, togetherKey, nvidiaKey: nvKey, openaiKey: openaiKey, anthropicKey })

    if (userProfile?.username) {
      const hasAnyAiKey = !!(gemKey.trim() || togetherKey.trim() || nvKey.trim() || openaiKey.trim() || anthropicKey.trim())
      if (consentSave) {
        setAiKeysConsent(true)
        if (hasAnyAiKey) {
          const success = await saveAiKeysToDb(userProfile.username)
          console.log('[Forge] saveAiKeysToDb response success status:', success)
        } else {
          await deleteAiKeysFromDb(userProfile.username)
        }
      } else {
        setAiKeysConsent(false)
        await deleteAiKeysFromDb(userProfile.username)
      }
    }

    setKeysSaved(true)
    setTimeout(() => { setKeysSaved(false) }, 1500)
  }

  const handleDownloadPdf = () => {
    fetch('/api/settings/download-keys-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apify_token: '',
        youtube_api_key: '',
        gemini_api_key: gemKey,
        together_api_key: togetherKey,
        nvidia_api_key: nvKey,
        openai_api_key: openaiKey,
        anthropic_api_key: anthropicKey
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

  const handleSave = async () => {
    const nameChanged = profileName !== (creatorData.name || '')
    const handleChanged = profileHandle !== (creatorData.handle || '')
    const emailChanged = profileEmail.trim().toLowerCase() !== (userProfile?.email || '').toLowerCase()
    const nicheChanged = profileNiche !== (creatorData.niche || '')

    const changedFields = []
    if (nameChanged) changedFields.push('Display name')
    if (handleChanged) changedFields.push('Handle')
    if (emailChanged) changedFields.push('Email')
    if (nicheChanged) changedFields.push('Niche')

    // 1. Update creatorData in-memory
    updateCreator({
      name: profileName,
      handle: profileHandle,
      niche: profileNiche
    })

    // 2. If registered, save changes to DB
    if (userProfile?.username) {
      // Update email on DB if changed
      if (emailChanged) {
        try {
          const res = await fetch('/api/auth/update-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: userProfile.username,
              email: profileEmail.trim()
            })
          })
          if (!res.ok) {
            const err = await res.json()
            alert('Failed to update email: ' + (err.detail || 'Email already registered.'))
            return
          }
          const data = await res.json()
          if (data.status === 'success') {
            // Update local state
            const updatedProfile = { ...userProfile, email: data.email }
            localStorage.setItem('forge_user_profile', JSON.stringify(updatedProfile))
            setUserProfile(updatedProfile)
          }
        } catch (e) {
          console.error('Failed to update email in DB:', e)
          alert('Failed to update email address.')
          return
        }
      }

      // Sync updated creatorData to DB
      const updatedCreator = {
        ...creatorData,
        name: profileName,
        handle: profileHandle,
        niche: profileNiche
      }
      setTimeout(() => {
        if (syncSessionToDb) {
          syncSessionToDb(userProfile.username, updatedCreator)
        }
      }, 100)
    }

    if (changedFields.length > 0) {
      const msg = `Successfully updated: ${changedFields.join(', ')}`
      alert(msg)
      if (triggerToast) {
        triggerToast(msg, 'success')
      }
    }

    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const toggleAutomation = (id) => {
    setAutomations(prev =>
      prev.map(a => a.id === id ? { ...a, active: !a.active } : a)
    )
  }

  const activeAutomationCount = automations.filter(a => a.active).length
  const sections = ['profile', 'api-keys', 'automations', 'notifications', 'billing']

  return (
    <div className="flex h-full">
      {/* Left nav */}
      <div
        className="w-44 border-r py-6 flex-shrink-0"
        style={{ borderColor: 'rgba(255,255,255,0.07)' }}
      >
        <p className="forge-label px-4 mb-3">Settings</p>
        <div className="space-y-0.5 px-2">
          {sections.map(s => (
            <button
              key={s}
              onClick={() => setActiveSection(s)}
              className="w-full text-left px-3 py-2 rounded-xl text-[13px] font-medium capitalize transition-all duration-150"
              style={{
                background: activeSection === s ? 'rgba(255,255,255,0.08)' : 'transparent',
                color: activeSection === s ? 'white' : 'rgba(255,255,255,0.4)',
                borderLeft: activeSection === s ? '2px solid white' : '2px solid transparent',
              }}
              onMouseEnter={e => { if (activeSection !== s) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
              onMouseLeave={e => { if (activeSection !== s) e.currentTarget.style.background = 'transparent' }}
            >
              {s}
              {s === 'automations' && activeAutomationCount > 0 && (
                <span
                  className="ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                  style={{ background: 'white', color: 'black' }}
                >
                  {activeAutomationCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Right content */}
      <div className="flex-1 overflow-y-auto p-6 max-w-xl">

        {/* ─── PROFILE ─────────────────────────────────────────── */}
        {activeSection === 'profile' && (
          <div className="space-y-6">
            <div>
              <h2 className="forge-heading mb-1" style={{ fontSize: '22px', letterSpacing: '-0.03em' }}>Profile</h2>
              <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.38)' }}>Your creator identity inside Forge.</p>
            </div>

            <div className="space-y-3">
              {[
                { label: 'Display name', value: profileName, onChange: setProfileName, type: 'text' },
                {
                  label: 'Handle',
                  value: profileHandle,
                  onChange: (val) => {
                    setProfileHandle(val)
                    const inferred = inferNicheFromHandle(val)
                    setProfileNiche(inferred)
                  },
                  type: 'text'
                },
                { label: 'Email', value: profileEmail, onChange: setProfileEmail, type: 'email' },
                { label: 'Niche / topic', value: profileNiche, onChange: setProfileNiche, type: 'text' },
              ].map(field => (
                <div key={field.label}>
                  <label className="block text-[12px] mb-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    {field.label}
                  </label>
                  <div className="forge-input-wrap rounded-xl">
                    <input
                      className="forge-input text-[14px]"
                      value={field.value}
                      onChange={e => field.onChange(e.target.value)}
                      type={field.type}
                    />
                  </div>
                </div>
              ))}
            </div>

            <button onClick={handleSave} className="forge-btn-primary text-[14px] py-3 px-7 gap-2">
              {saved ? <><Check size={14} /> Saved</> : 'Save changes'}
            </button>
          </div>
        )}

        {/* ─── API KEYS ────────────────────────────────────────── */}
        {activeSection === 'api-keys' && (
          <div className="space-y-6">
            <div>
              <h2 className="forge-heading mb-1" style={{ fontSize: '22px', letterSpacing: '-0.03em' }}>API Keys</h2>
              <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.38)' }}>Manage your AI and Generation integrations.</p>
            </div>

            <div className="space-y-5">
              {/* Gemini key */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <p className="text-[12px] font-semibold text-white">Google Gemini API Key</p>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)' }}>gemini-2.5-flash</span>
                  </div>
                  {gemKey.trim() && (
                    <div className="flex items-center gap-1 text-[11px]" style={{ color: 'rgba(100,220,100,0.8)' }}>
                      <Check size={10} /> Connected
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 rounded-xl border px-4 py-3"
                  style={{ background: '#111', borderColor: gemKey.trim() ? 'rgba(100,220,100,0.3)' : 'rgba(255,255,255,0.1)' }}>
                  <input
                    type={showGem ? 'text' : 'password'}
                    autoComplete="new-password"
                    className="flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-white/20 font-mono"
                    placeholder="AIzaSy..."
                    value={gemKey}
                    onChange={e => setGemKey(e.target.value)}
                  />
                  <button onClick={() => setShowGem(v => !v)} className="text-white/25 hover:text-white/60 transition-colors mr-1">
                    {showGem ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  {gemKey && (
                    <button
                      onClick={() => handleDeleteIndividualKey('gemini')}
                      title="Delete key"
                      className="text-white/25 hover:text-red-400 transition-colors flex-shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* OpenAI API Key */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <p className="text-[12px] font-semibold text-white">OpenAI API Key</p>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)' }}>gpt-5.5</span>
                    <span className="text-[11px] text-white/40 font-normal">(optional)</span>
                  </div>
                  {openaiKey.trim() && (
                    <div className="flex items-center gap-1 text-[11px]" style={{ color: 'rgba(100,220,100,0.8)' }}>
                      <Check size={10} /> Connected
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 rounded-xl border px-4 py-3"
                  style={{ background: '#111', borderColor: openaiKey.trim() ? 'rgba(100,220,100,0.3)' : 'rgba(255,255,255,0.1)' }}>
                  <input
                    type={showOpenai ? 'text' : 'password'}
                    autoComplete="new-password"
                    className="flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-white/20 font-mono"
                    placeholder="sk-proj-..."
                    value={openaiKey}
                    onChange={e => setOpenaiKey(e.target.value)}
                  />
                  <button onClick={() => setShowOpenai(v => !v)} className="text-white/25 hover:text-white/60 transition-colors mr-1">
                    {showOpenai ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  {openaiKey && (
                    <button
                      onClick={() => handleDeleteIndividualKey('openai')}
                      title="Delete key"
                      className="text-white/25 hover:text-red-400 transition-colors flex-shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Anthropic API Key */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <p className="text-[12px] font-semibold text-white">Anthropic API Key</p>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)' }}>claude-opus-4-6</span>
                    <span className="text-[11px] text-white/40 font-normal">(optional)</span>
                  </div>
                  {anthropicKey.trim() && (
                    <div className="flex items-center gap-1 text-[11px]" style={{ color: 'rgba(100,220,100,0.8)' }}>
                      <Check size={10} /> Connected
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 rounded-xl border px-4 py-3"
                  style={{ background: '#111', borderColor: anthropicKey.trim() ? 'rgba(100,220,100,0.3)' : 'rgba(255,255,255,0.1)' }}>
                  <input
                    type={showAnthropic ? 'text' : 'password'}
                    autoComplete="new-password"
                    className="flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-white/20 font-mono"
                    placeholder="sk-ant-..."
                    value={anthropicKey}
                    onChange={e => setAnthropicKey(e.target.value)}
                  />
                  <button onClick={() => setShowAnthropic(v => !v)} className="text-white/25 hover:text-white/60 transition-colors mr-1">
                    {showAnthropic ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  {anthropicKey && (
                    <button
                      onClick={() => handleDeleteIndividualKey('anthropic')}
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
                  <div className="flex items-center gap-2">
                    <p className="text-[12px] font-semibold text-white">Together.ai Key</p>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)' }}>FLUX.1-schnell</span>
                    <span className="text-[11px] text-white/40 font-normal">(optional)</span>
                  </div>
                  {togetherKey.trim() && (
                    <div className="flex items-center gap-1 text-[11px]" style={{ color: 'rgba(100,220,100,0.8)' }}>
                      <Check size={10} /> Connected
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 rounded-xl border px-4 py-3"
                  style={{ background: '#111', borderColor: togetherKey.trim() ? 'rgba(100,220,100,0.3)' : 'rgba(255,255,255,0.1)' }}>
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
                      onClick={() => handleDeleteIndividualKey('together')}
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
                  <div className="flex items-center gap-2">
                    <p className="text-[12px] font-semibold text-white">NVIDIA NIM Key</p>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)' }}>nemotron-3-ultra</span>
                    <span className="text-[11px] text-white/40 font-normal">(optional)</span>
                  </div>
                  {nvKey.trim() && (
                    <div className="flex items-center gap-1 text-[11px]" style={{ color: 'rgba(100,220,100,0.8)' }}>
                      <Check size={10} /> Connected
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 rounded-xl border px-4 py-3"
                  style={{ background: '#111', borderColor: nvKey.trim() ? 'rgba(100,220,100,0.3)' : 'rgba(255,255,255,0.1)' }}>
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
                      onClick={() => handleDeleteIndividualKey('nvidia')}
                      title="Delete key"
                      className="text-white/25 hover:text-red-400 transition-colors flex-shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Consent checkbox */}
              {!!userProfile?.username && (gemKey.trim() || togetherKey.trim() || nvKey.trim() || openaiKey.trim()) && (
                <label className="flex items-center gap-3 cursor-pointer select-none py-1.5 mt-2">
                  <div
                    className="w-4 h-4 rounded border flex items-center justify-center transition-all duration-150"
                    style={{
                      background: consentSave ? 'white' : 'transparent',
                      borderColor: consentSave ? 'white' : 'rgba(255,255,255,0.25)',
                    }}
                    onClick={() => setConsentSave(v => !v)}
                  >
                    {consentSave && <Check size={10} className="text-black" strokeWidth={3} />}
                  </div>
                  <span className="text-[13px] text-white/75" onClick={() => setConsentSave(v => !v)}>
                    Save keys to my account for cloud sync
                  </span>
                </label>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2.5 pt-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSaveApiKeys}
                  disabled={!(gemKey.trim() || togetherKey.trim() || nvKey.trim() || openaiKey.trim())}
                  className="forge-btn-primary flex-1 text-[14px] py-3 gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {keysSaved ? <><Check size={14} /> Saved!</> : 'Save API Keys'}
                </button>
              </div>

              {(gemKey.trim() || togetherKey.trim() || nvKey.trim() || openaiKey.trim()) && (
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
        )}

        {/* ─── AUTOMATIONS ─────────────────────────────────────── */}
        {activeSection === 'automations' && (
          <div className="space-y-6">
            <div>
              <h2 className="forge-heading mb-1" style={{ fontSize: '22px', letterSpacing: '-0.03em' }}>Automations</h2>
              <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.38)', lineHeight: '1.5' }}>
                Let Forge handle recurring work automatically. All automations create drafts by default - you approve before anything posts.
              </p>
            </div>

            {/* Active count banner */}
            {activeAutomationCount > 0 && (
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-xl border"
                style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)' }}
              >
                <Radio size={14} className="text-white/50" />
                <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  <strong className="text-white">{activeAutomationCount} automation{activeAutomationCount > 1 ? 's' : ''} active.</strong>{' '}
                  Forge will create drafts automatically - you'll be notified before anything posts.
                </p>
              </div>
            )}

            {/* Automation cards */}
            <div className="space-y-2">
              {automations.map(automation => (
                <AutomationCard
                  key={automation.id}
                  automation={automation}
                  onToggle={() => toggleAutomation(automation.id)}
                  onEdit={() => {}}
                />
              ))}
            </div>

            {/* Global approval setting */}
            <div
              className="rounded-xl border p-4"
              style={{ background: '#111', borderColor: 'rgba(255,255,255,0.07)' }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-semibold text-white mb-0.5">Always require approval</p>
                  <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    Forge will never auto-post without your review. Automations create drafts only.
                  </p>
                </div>
                <Toggle value={true} onChange={() => {}} />
              </div>
            </div>
          </div>
        )}

        {/* ─── NOTIFICATIONS ───────────────────────────────────── */}
        {activeSection === 'notifications' && (
          <div className="space-y-6">
            <div>
              <h2 className="forge-heading mb-1" style={{ fontSize: '22px', letterSpacing: '-0.03em' }}>Notifications</h2>
              <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.38)' }}>
                Choose what Forge notifies you about.
              </p>
            </div>

            <div className="space-y-1">
              {NOTIFICATION_SETTINGS.map(({ key, label, sub }) => (
                <div
                  key={key}
                  className="flex items-center justify-between p-4 rounded-xl transition-all duration-150"
                  style={{ background: '#111' }}
                >
                  <div>
                    <p className="text-[13px] font-medium text-white">{label}</p>
                    <p className="text-[12px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{sub}</p>
                  </div>
                  <Toggle
                    value={notifications[key]}
                    onChange={val => setNotifications(prev => ({ ...prev, [key]: val }))}
                  />
                </div>
              ))}
            </div>

            <button onClick={handleSave} className="forge-btn-primary text-[14px] py-3 px-7 gap-2">
              {saved ? <><Check size={14} /> Saved</> : 'Save changes'}
            </button>
          </div>
        )}

        {/* ─── BILLING ─────────────────────────────────────────── */}
        {activeSection === 'billing' && (
          <div className="space-y-6">
            <div>
              <h2 className="forge-heading mb-1" style={{ fontSize: '22px', letterSpacing: '-0.03em' }}>Billing</h2>
              <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.38)' }}>
                Manage your Forge subscription.
              </p>
            </div>

            {/* Plan card */}
            <div
              className="rounded-2xl border p-5"
              style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.12)' }}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Current plan</p>
                  <p className="text-[22px] font-semibold tracking-tight text-white">Founding Member</p>
                  <p className="text-[13px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Full access · Locked in at founder pricing</p>
                </div>
                <span
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                  style={{ background: 'white', color: 'black' }}
                >
                  Active
                </span>
              </div>

              <div className="space-y-2">
                {['Unlimited content generation', 'All dashboard features', 'Community management', 'Automation layer', 'Priority support'].map(f => (
                  <div key={f} className="flex items-center gap-2">
                    <Check size={13} className="text-white/50" />
                    <span className="text-[13px]" style={{ color: 'rgba(255,255,255,0.6)' }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
              <button
                className="text-[13px] transition-colors"
                style={{ color: 'rgba(255,255,255,0.2)' }}
                onMouseEnter={e => { e.target.style.color = 'rgba(255,255,255,0.5)' }}
                onMouseLeave={e => { e.target.style.color = 'rgba(255,255,255,0.2)' }}
              >
                Cancel subscription
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
