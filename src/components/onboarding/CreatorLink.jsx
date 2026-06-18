import { useState, useEffect, useRef } from 'react'
import { useForge } from '../../App'
import { ArrowRight, Youtube, Instagram, Twitter, Globe, X, Settings, AlertCircle } from 'lucide-react'
import WingLogo from '../ui/WingLogo'
import ApiKeysModal from '../ui/ApiKeysModal'
import { startScrape, hasKey, loadKeys } from '../../services/scraper'
import { loadAiKeys } from '../../services/ai'

const PLATFORMS = [
  { id: 'youtube',   label: 'YouTube',     icon: Youtube,   patterns: ['youtube.com','youtu.be'] },
  { id: 'instagram', label: 'Instagram',   icon: Instagram, patterns: ['instagram.com'] },
  { id: 'twitter',   label: 'X / Twitter', icon: Twitter,   patterns: ['twitter.com','x.com'] },
  { id: 'tiktok',    label: 'TikTok',      icon: Globe,     patterns: ['tiktok.com'] },
]

function detectPlatform(url) {
  const lower = url.toLowerCase()
  for (const p of PLATFORMS) {
    if (p.patterns.some(pat => lower.includes(pat))) return p
  }
  return null
}

function extractHandle(url) {
  try {
    let parseUrl = url
    if (!parseUrl.startsWith('http')) parseUrl = 'https://' + parseUrl
    const u = new URL(parseUrl)
    const parts = u.pathname.split('/').filter(Boolean)
    
    if (parts.length) {
      // Handle youtube.com/user/handle, youtube.com/c/handle, etc.
      if (parts[0] === 'user' || parts[0] === 'c' || parts[0] === 'channel') {
        const h = parts[1]
        if (h) {
          if (parts[0] === 'channel') return `channel/${h}`
          return h.startsWith('@') ? h : `@${h}`
        }
      }
      // General fallback, ignore trailing /videos or /shorts
      const last = parts[parts.length - 1]
      const h = (last === 'videos' || last === 'shorts' || last === 'featured') && parts.length > 1
        ? parts[parts.length - 2]
        : last
      return h.startsWith('@') ? h : `@${h}`
    }
  } catch {}
  return ''
}

const EXAMPLES = [
  'youtube.com/@mkbhd',
  'instagram.com/natgeo',
  'x.com/lexfridman',
  'tiktok.com/@khaby.lame',
]

export default function CreatorLink() {
  const { next, updateCreator, prev, aiKeys } = useForge()
  const [url, setUrl]               = useState('')
  const [platform, setPlatform]     = useState(null)
  const [handle, setHandle]         = useState('')
  const [visible, setVisible]       = useState(false)
  const [exampleIdx, setExampleIdx] = useState(0)
  const [showKeysModal, setShowKeysModal] = useState(false)
  const [keysConfigured, setKeysConfigured] = useState(false)
  // After modal saves a key, auto-continue if we were blocked
  const pendingContinue = useRef(false)
 
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [])
 
  useEffect(() => {
    const interval = setInterval(() => setExampleIdx(i => (i + 1) % EXAMPLES.length), 2800)
    return () => clearInterval(interval)
  }, [])
 
  // Refresh key status whenever modal closes or context keys change; auto-continue if pending
  useEffect(() => {
    const keys = loadKeys()
    const scrapingConfigured = !!(keys.youtubeApiKey || keys.apifyToken)
    const aiConfigured = !!(aiKeys?.geminiKey || aiKeys?.openaiKey || aiKeys?.anthropicKey)
    setKeysConfigured(aiConfigured)
 
    // If user just added a key after being blocked, continue automatically
    if (pendingContinue.current) {
      const platformId = platform?.id || 'other'
      const scrapingRequired = platform && !hasKey(platformId)
      
      const scrapingOk = !scrapingRequired || scrapingConfigured
      const aiOk = aiConfigured
 
      if (scrapingOk && aiOk) {
        pendingContinue.current = false
        _doNavigate()
      }
    }
  }, [showKeysModal, aiKeys, platform])

  const handleChange = (e) => {
    const val = e.target.value
    setUrl(val)
    const detected = detectPlatform(val)
    setPlatform(detected)
    setHandle(detected ? extractHandle(val) : '')
  }

  // Separated so we can call it from the effect above
  const _doNavigate = () => {
    const currentUrl = url
    const currentPlatform = platform
    const currentHandle = handle

    const h          = currentHandle || '@creator'
    const platformId = currentPlatform?.id || 'other'

    updateCreator({
      url:            currentUrl.trim(),
      platform:       platformId,
      handle:         h,
      name:           h.replace('@', ''),
      followers:      0,
      engagementRate: 0,
      niche:          '',
      avatarUrl:      '',
      recentPosts:    [],
    })

    if (hasKey(platformId) && platformId !== 'other') {
      startScrape(currentUrl.trim(), platformId)
    }

    next()
  }

  const handleContinue = () => {
    if (!url.trim()) return

    const platformId = platform?.id || 'other'

    // If platform detected but no key → block and open key modal
    if (platform && !hasKey(platformId)) {
      pendingContinue.current = true
      setShowKeysModal(true)
      return
    }

    // Prompt user to add AI API key next if none is set
    const hasAiKey = !!(aiKeys?.geminiKey || aiKeys?.openaiKey || aiKeys?.anthropicKey)
    if (!hasAiKey) {
      pendingContinue.current = true
      setShowKeysModal(true)
      return
    }

    _doNavigate()
  }

  const PlatformIcon   = platform?.icon
  const platformHasKey = platform ? hasKey(platform.id) : false

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-4">
          <button
            onClick={prev}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all duration-150"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.5)',
            }}
          >
            ← Back
          </button>
          <div className="flex items-center gap-2.5">
            <WingLogo size={26} />
            <span className="text-white font-semibold text-[15px] tracking-tight">Creator Forge</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowKeysModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] transition-all duration-150"
            style={{
              background:  keysConfigured ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)',
              border:      '1px solid',
              borderColor: keysConfigured ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)',
              color:       keysConfigured ? 'rgba(255,255,255,0.6)'  : 'rgba(255,255,255,0.3)',
            }}
          >
            {keysConfigured
              ? <><span className="w-1.5 h-1.5 rounded-full bg-green-400" /> API connected</>
              : <><Settings size={11} /> Connect APIs</>
            }
          </button>

          <div className="flex items-center gap-1.5">
            {[1,2,3,4,5,6,7,8].map(i => (
              <div key={i} className="rounded-full transition-all duration-300"
                style={{ width: i === 2 ? '20px' : '6px', height: '6px',
                  background: i === 2 ? 'white' : i < 2 ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.12)' }}
              />
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
        <div className="w-full max-w-md"
          style={{
            opacity:    visible ? 1 : 0,
            transform:  visible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.55s cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          <p className="forge-label mb-5">Step 1 of 8</p>
          <h2 className="forge-heading mb-3"
            style={{ fontSize: 'clamp(32px, 5vw, 48px)', letterSpacing: '-0.035em' }}>
            Where is your
            <br />audience?
          </h2>
          <p className="text-[15px] mb-5" style={{ color: 'rgba(255,255,255,0.4)', lineHeight: '1.5' }}>
            Paste your creator link and Forge will analyze your real profile, follower count, and content.
          </p>

          {/* Why bullets */}
          <div className="flex flex-col gap-2.5 mb-8">
            {[
              { label: 'Real follower count', detail: 'scraped live from the platform' },
              { label: 'Your actual profile photo', detail: 'used across your whole product' },
              { label: 'Audience & engagement data', detail: 'determines which business model fits best' },
            ].map(({ label, detail }) => (
              <div key={label} className="flex items-start gap-2.5">
                <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '9px' }}>✓</span>
                </div>
                <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.45)', lineHeight: 1.4 }}>
                  <span className="text-white/70 font-medium">{label}</span>
                  {' — '}{detail}
                </p>
              </div>
            ))}
          </div>

          {/* URL input */}
          <div className="forge-input-wrap mb-3" style={{ padding: '14px 18px', borderRadius: '14px' }}>
            {platform
              ? <PlatformIcon size={16} className="text-white/60 flex-shrink-0" />
              : <Globe size={16} className="text-white/25 flex-shrink-0" />
            }
            <input
              className="forge-input flex-1 text-[15px]"
              placeholder={`e.g. ${EXAMPLES[exampleIdx]}`}
              value={url}
              onChange={handleChange}
              autoFocus
              onKeyDown={e => e.key === 'Enter' && url.trim() && handleContinue()}
            />
            {url && (
              <button onClick={() => { setUrl(''); setPlatform(null); setHandle('') }}
                className="text-white/25 hover:text-white/50 transition-colors">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Platform detection pill */}
          <div className="mb-3 transition-all duration-300"
            style={{ height: platform ? '28px' : '0px', overflow: 'hidden', opacity: platform ? 1 : 0 }}>
            {platform && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
                style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                {platform.label} detected
                {handle && <span className="text-white/40 ml-1">· {handle}</span>}
              </div>
            )}
          </div>

          {/* Key status — prominent warning if missing, green confirmation if set */}
          {platform && !platformHasKey && (
            <div
              className="mb-5 rounded-xl p-4"
              style={{ background: 'rgba(255,180,0,0.06)', border: '1px solid rgba(255,180,0,0.2)' }}
            >
              <div className="flex items-start gap-3">
                <AlertCircle size={14} style={{ color: 'rgba(255,180,0,0.8)', flexShrink: 0, marginTop: 1 }} />
                <div className="flex-1">
                  <p className="text-[13px] font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.75)' }}>
                    API key required for real data
                  </p>
                  <p className="text-[12px] leading-relaxed mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    Add your Apify token to pull real followers, profile photo, and post thumbnails for all platforms including YouTube.
                    {' '}Without it, data will be made up.
                  </p>
                  <button
                    onClick={() => setShowKeysModal(true)}
                    className="text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-all"
                    style={{
                      background: 'rgba(255,255,255,0.09)',
                      color: 'rgba(255,255,255,0.75)',
                      border: '1px solid rgba(255,255,255,0.12)',
                    }}
                  >
                    Add Apify token now
                  </button>
                </div>
              </div>
            </div>
          )}


          {platform && platformHasKey && (
            <div className="mb-5 flex items-center gap-2 px-3 py-2 rounded-lg"
              style={{ background: 'rgba(100,220,100,0.06)', border: '1px solid rgba(100,220,100,0.15)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
              <p className="text-[12px]" style={{ color: 'rgba(100,220,100,0.8)' }}>
                Scraping active. Real data will be scraped from {platform.label}.
              </p>
            </div>
          )}

          {!platform && <div className="mb-5" />}

          <button onClick={handleContinue} disabled={!url.trim()}
            className="forge-btn-primary w-full text-[15px] py-3.5 group disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:transform-none">
            {!keysConfigured ? 'Connect AI Key' : (platform && !platformHasKey ? 'Connect API + Analyze' : 'Analyze my audience')}
            <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-0.5" />
          </button>

          {platform && !platformHasKey && (
            <button
              onClick={_doNavigate}
              className="w-full mt-3 text-[12px] py-2 transition-colors"
              style={{ color: 'rgba(255,255,255,0.2)' }}
              onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.2)'}
            >
              Skip and use estimated data instead
            </button>
          )}

          <div className="mt-8 flex items-center gap-3 flex-wrap">
            <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.2)' }}>Works with</span>
            {PLATFORMS.map(p => (
              <div key={p.id} className="flex items-center gap-1.5 text-[12px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                <p.icon size={12} /><span>{p.label}</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      {showKeysModal && (
        <ApiKeysModal onClose={() => setShowKeysModal(false)} platform={platform?.id} />
      )}
    </div>
  )
}
