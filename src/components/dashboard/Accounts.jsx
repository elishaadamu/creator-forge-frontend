import { useState, useEffect } from 'react'
import { useForge } from '../../App'
import { Youtube, Instagram, Twitter, Check, Plus, ExternalLink, AlertCircle, Clock, Radio, ChevronRight, Edit3, X } from 'lucide-react'


const PLATFORMS = [
  {
    id: 'youtube',
    name: 'YouTube',
    icon: Youtube,
    description: 'Auto-post Shorts and Community posts',
    features: ['Community posts', 'Shorts publishing', 'Live scheduling'],
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: Instagram,
    description: 'Schedule Reels, Posts, and Stories',
    features: ['Reels', 'Feed posts', 'Story publishing'],
  },
  {
    id: 'twitter',
    name: 'Twitter / X',
    icon: Twitter,
    description: 'Auto-post threads and tweets',
    features: ['Tweets', 'Threads', 'Spaces reminder'],
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: () => <span className="font-black text-[13px]">TT</span>,
    description: 'Schedule and publish TikToks',
    features: ['Video publishing', 'Caption auto-fill'],
  },
  {
    id: 'email',
    name: 'Email (ConvertKit / Beehiiv)',
    icon: () => <span className="font-bold text-[11px]">✉</span>,
    description: 'Sync your list and trigger sequences',
    features: ['List sync', 'Sequence trigger', 'Broadcast send'],
  },
]

const RECENT_POSTS = [
  { platform: 'Instagram', content: 'Launch teaser - something big is coming', status: 'scheduled', time: 'Today 9am' },
  { platform: 'Twitter', content: '5 things most creators get wrong about monetization', status: 'scheduled', time: 'Today 2pm' },
  { platform: 'Email', content: 'Early access announcement email', status: 'draft', time: '-' },
  { platform: 'YouTube', content: 'Community post - launch countdown', status: 'draft', time: '-' },
]

const STATUS_STYLES = {
  scheduled: { bg: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', label: 'Scheduled' },
  draft: { bg: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)', label: 'Draft' },
  posted: { bg: 'rgba(255,255,255,0.15)', color: 'white', label: 'Posted' },
  failed: { bg: 'rgba(255,50,50,0.12)', color: 'rgba(255,100,100,0.8)', label: 'Failed' },
}

export default function Accounts() {
  const { creatorData, updateCreator, setActiveTab, setPreloadStudioType, triggerToast } = useForge()
  const [isManualModalOpen, setIsManualModalOpen] = useState(false)
  const [manualBusinessId, setManualBusinessId] = useState('')
  const [manualAccessToken, setManualAccessToken] = useState('')
  const [modalTab, setModalTab] = useState('oauth') // 'oauth' | 'manual'


  const [platforms, setPlatforms] = useState(() => {
    try {
      const stored = localStorage.getItem('forge_accounts_platforms')
      if (stored) {
        const parsed = JSON.parse(stored)
        return PLATFORMS.map(p => {
          const match = parsed.find(x => x.id === p.id)
          return match ? { ...p, ...match } : { ...p, connected: false, audience: null, autoPost: false, approveBeforePost: true }
        })
      }
    } catch (e) {
      console.error(e)
    }
    
    // Default: Pre-connect primary platform based on creatorData
    return PLATFORMS.map(p => {
      const isPrimary = p.id === creatorData.platform?.toLowerCase()
      const followersText = creatorData.followers 
        ? `${(creatorData.followers / 1000).toFixed(0)}K followers` 
        : '12.5K followers'
      
      return {
        ...p,
        connected: isPrimary,
        audience: isPrimary ? followersText : null,
        autoPost: false,
        approveBeforePost: true
      }
    })
  })

  useEffect(() => {
    // Strip function components before saving
    const serialized = platforms.map(({ id, connected, audience, autoPost, approveBeforePost }) => ({
      id, connected, audience, autoPost, approveBeforePost
    }))
    localStorage.setItem('forge_accounts_platforms', JSON.stringify(serialized))
  }, [platforms])

  const [connecting, setConnecting] = useState(null)
  const [expandedId, setExpandedId] = useState(null)

  const handleConnect = (id) => {
    if (id === 'instagram') {
      // Instead of direct redirect, open our new setup modal!
      setManualBusinessId(creatorData?.instagram_business_id || '')
      setManualAccessToken(creatorData?.instagram_access_token || '')
      setModalTab(creatorData?.instagram_access_token ? 'manual' : 'oauth')
      setIsManualModalOpen(true)
      return
    }

    // Default simulation for other platforms
    setConnecting(id)
    setTimeout(() => {
      setPlatforms(prev => prev.map(p =>
        p.id === id
          ? { 
              ...p, 
              connected: true, 
              audience: creatorData?.followers && p.id === creatorData.platform?.toLowerCase()
                ? `${(creatorData.followers / 1000).toFixed(0)}K followers`
                : `${Math.floor(Math.random() * 80 + 10)}K followers` 
            }
          : p
      ))
      setConnecting(null)
      if (triggerToast) triggerToast(`${id.toUpperCase()} connected successfully!`, 'success')
    }, 1400)
  }

  // Listen for OAuth callbacks in the URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    
    if (params.get('ig_connected') === 'true') {
      setPlatforms(prev => prev.map(p => 
        p.id === 'instagram' 
          ? { 
              ...p, 
              connected: true,
              audience: creatorData?.followers ? `${(creatorData.followers / 1000).toFixed(0)}K followers` : '84K followers'
            } 
          : p
      ))
      
      if (triggerToast) {
        if (params.get('demo_mode') === 'true') {
          triggerToast('Instagram connected (Demo mode - no real Meta App ID configured)', 'success')
        } else {
          triggerToast('INSTAGRAM connected successfully via OAuth!', 'success')
        }
      }
      
      // Clean up URL
      const newUrl = window.location.pathname + (params.get('tab') ? `?tab=${params.get('tab')}` : '')
      window.history.replaceState({}, document.title, newUrl)
    }

    if (params.get('ig_error') === 'true') {
      if (triggerToast) triggerToast('Failed to connect to Instagram.', 'error')
      const newUrl = window.location.pathname + (params.get('tab') ? `?tab=${params.get('tab')}` : '')
      window.history.replaceState({}, document.title, newUrl)
    }
  }, [creatorData?.followers, triggerToast])

  const handleDisconnect = (id) => {
    setPlatforms(prev => prev.map(p =>
      p.id === id ? { ...p, connected: false, audience: null, autoPost: false } : p
    ))
    if (id === 'instagram') {
      updateCreator({
        instagram_access_token: null,
        instagram_business_id: null
      })
    }
    if (triggerToast) triggerToast(`${id.toUpperCase()} disconnected.`, 'info')
  }

  const toggleAutoPost = (id) => {
    setPlatforms(prev => prev.map(p =>
      p.id === id ? { ...p, autoPost: !p.autoPost } : p
    ))
  }

  const toggleApprove = (id) => {
    setPlatforms(prev => prev.map(p =>
      p.id === id ? { ...p, approveBeforePost: !p.approveBeforePost } : p
    ))
  }

  const handleEditQueuePost = (platform) => {
    const typeMap = {
      'Instagram': 'ig-caption',
      'Twitter': 'x-post',
      'Email': 'email-announce',
      'YouTube': 'yt-community'
    }
    const typeId = typeMap[platform] || 'ig-caption'
    if (setPreloadStudioType) {
      setPreloadStudioType(typeId)
    }
    if (setActiveTab) {
      setActiveTab('studio')
    }
    if (triggerToast) triggerToast(`Opening Studio to edit ${platform} draft...`, 'info')
  }

  const connectedCount = platforms.filter(p => p.connected).length

  return (
    <div className="p-3 sm:p-6 max-w-2xl space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <p className="forge-label mb-3">Accounts</p>
        <h2 className="forge-heading mb-1.5" style={{ fontSize: 'clamp(22px, 3vw, 30px)', letterSpacing: '-0.03em' }}>
          Social connections
        </h2>
        <p className="text-[14px]" style={{ color: 'rgba(255,255,255,0.38)' }}>
          Connect your accounts to generate, schedule, and auto-post directly from Forge.
        </p>
      </div>

      {/* Status banner */}
      {connectedCount === 0 ? (
        <div className="flex items-center gap-3 p-4 rounded-xl border animate-pulse" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}>
          <AlertCircle size={15} className="text-white/40 flex-shrink-0" />
          <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Connect at least one account to enable scheduling and auto-posting.
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-emerald-500/20" style={{ background: 'rgba(16,185,129,0.04)' }}>
          <Check size={15} className="text-emerald-400 flex-shrink-0" />
          <p className="text-[13px] text-emerald-300">
            Connections active. Auto-post features available for {connectedCount} account{connectedCount > 1 ? 's' : ''}.
          </p>
        </div>
      )}

      {/* Platform cards */}
      <section>
        <p className="forge-label mb-3">Connected accounts</p>
        <div className="space-y-2">
          {platforms.map(platform => {
            const isExpanded = expandedId === platform.id

            return (
              <div
                key={platform.id}
                className="rounded-2xl border overflow-hidden transition-all duration-200"
                style={{
                  background: platform.connected ? 'rgba(255,255,255,0.04)' : '#111',
                  borderColor: platform.connected ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.07)',
                }}
              >
                {/* Main row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-3.5 sm:p-4">
                  <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}>
                      <platform.icon size={18} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="text-[14px] font-semibold text-white">{platform.name}</span>
                        {platform.connected && (
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
                            <Check size={9} strokeWidth={3} />
                            Connected
                          </div>
                        )}
                        {platform.connected && platform.autoPost && (
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}>
                            <Radio size={9} />
                            Auto-posting
                          </div>
                        )}
                      </div>
                      <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        {platform.connected ? platform.audience : platform.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                    {platform.connected ? (
                      <>
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : platform.id)}
                          className="text-[12px] px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all duration-150"
                          style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)' }}
                        >
                          Settings
                          <ChevronRight size={11} style={{ transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                        </button>
                        <button onClick={() => handleDisconnect(platform.id)}
                          className="text-[12px] px-3 py-1.5 rounded-full transition-all duration-150"
                          style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)' }}
                          onMouseEnter={e => { e.target.style.color = 'rgba(255,255,255,0.6)' }}
                          onMouseLeave={e => { e.target.style.color = 'rgba(255,255,255,0.3)' }}
                        >
                          Disconnect
                        </button>
                      </>
                    ) : (
                      <button onClick={() => handleConnect(platform.id)} disabled={connecting === platform.id}
                        className="forge-btn-primary text-[12px] py-2 px-4 gap-1.5 disabled:opacity-60"
                      >
                        {connecting === platform.id ? (
                          <>
                            <div className="w-3 h-3 border border-black/30 border-t-black rounded-full animate-spin" />
                            Connecting
                          </>
                        ) : (
                          <><Plus size={12} />Connect</>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded settings */}
                {isExpanded && platform.connected && (
                  <div className="px-4 pb-4 border-t pt-4" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                    <div className="space-y-3">
                      {/* Auto-post toggle */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[13px] font-medium text-white">Auto-post</p>
                          <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>Publish scheduled content automatically</p>
                        </div>
                        <button onClick={() => toggleAutoPost(platform.id)}
                          className="relative flex-shrink-0 transition-all duration-200"
                          style={{ width: '36px', height: '20px', borderRadius: '100px', background: platform.autoPost ? 'white' : 'rgba(255,255,255,0.12)' }}
                        >
                          <div className="absolute top-1 rounded-full transition-all duration-200"
                            style={{ width: '14px', height: '14px', left: platform.autoPost ? '19px' : '3px', background: platform.autoPost ? 'black' : 'rgba(255,255,255,0.3)' }}
                          />
                        </button>
                      </div>

                      {/* Approve before post */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[13px] font-medium text-white">Approve before posting</p>
                          <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>Review each post before it goes live</p>
                        </div>
                        <button onClick={() => toggleApprove(platform.id)}
                          className="relative flex-shrink-0 transition-all duration-200"
                          style={{ width: '36px', height: '20px', borderRadius: '100px', background: platform.approveBeforePost ? 'white' : 'rgba(255,255,255,0.12)' }}
                        >
                          <div className="absolute top-1 rounded-full transition-all duration-200"
                            style={{ width: '14px', height: '14px', left: platform.approveBeforePost ? '19px' : '3px', background: platform.approveBeforePost ? 'black' : 'rgba(255,255,255,0.3)' }}
                          />
                        </button>
                      </div>

                      {/* Instagram manual credentials section */}
                      {platform.id === 'instagram' && (creatorData?.instagram_access_token || creatorData?.instagram_business_id) && (
                        <div className="p-3 rounded-xl border border-white/5 bg-white/[0.02] space-y-2 mt-2">
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Instagram Developer Keys</p>
                            <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              Custom credentials configured
                            </span>
                          </div>
                          <div className="flex flex-col gap-1 text-[11px] font-mono text-white/70">
                            <div className="flex justify-between">
                              <span className="text-white/40">Business ID:</span>
                              <span>{creatorData.instagram_business_id || 'Not Set'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-white/40">Access Token:</span>
                              <span>
                                {creatorData.instagram_access_token 
                                  ? `${creatorData.instagram_access_token.slice(0, 8)}...${creatorData.instagram_access_token.slice(-8)}`
                                  : 'Not Set'}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setManualBusinessId(creatorData.instagram_business_id || '')
                              setManualAccessToken(creatorData.instagram_access_token || '')
                              setModalTab('manual')
                              setIsManualModalOpen(true)
                            }}
                            className="text-[11px] font-semibold text-white/60 hover:text-white px-2.5 py-1.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 transition-all w-full text-center"
                          >
                            Update Credentials
                          </button>
                        </div>
                      )}

                      {/* Supported features */}
                      <div className="flex flex-wrap gap-2 pt-1">
                        {platform.features.map(f => (
                          <span key={f} className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
                            ✓ {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* Publishing queue */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <p className="forge-label">Publishing queue</p>
          <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.25)' }}>{RECENT_POSTS.length} posts</span>
        </div>
        <div className="space-y-2">
          {RECENT_POSTS.map((post, i) => {
            const s = STATUS_STYLES[post.status]
            return (
              <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 sm:p-3.5 rounded-xl border group" style={{ background: '#111', borderColor: 'rgba(255,255,255,0.07)' }}>
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded w-8 text-center flex-shrink-0"
                    style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>
                    {post.platform.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="text-[13px] flex-1 truncate" style={{ color: 'rgba(255,255,255,0.65)' }}>{post.content}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                  {post.time !== '-' && (
                    <span className="text-[11px] flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      <Clock size={10} />
                      {post.time}
                    </span>
                  )}
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={s}>{s.label}</span>
                  <button 
                    onClick={() => handleEditQueuePost(post.platform)}
                    className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity p-1 text-white/40 hover:text-white"
                  >
                    <Edit3 size={12} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <p className="text-[12px] text-center" style={{ color: 'rgba(255,255,255,0.18)' }}>
        Forge uses OAuth by default, with manual key fallback for testing.
      </p>

      {/* Instagram setup modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <style>{`
            @keyframes modalSlideIn {
              0% { opacity: 0; transform: translateY(20px) scale(0.95); }
              100% { opacity: 1; transform: translateY(0) scale(1); }
            }
          `}</style>
          <div 
            className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0d0d0d] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            style={{
              animation: 'modalSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) both'
            }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Instagram size={18} className="text-white/80" />
                <h3 className="text-[15px] font-bold text-white">Link Instagram Account</h3>
              </div>
              <button 
                onClick={() => setIsManualModalOpen(false)}
                className="text-white/40 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-white/5 bg-white/[0.01]">
              <button
                onClick={() => setModalTab('oauth')}
                className={`flex-1 py-3 text-[12px] font-bold uppercase tracking-wider transition-all ${
                  modalTab === 'oauth' 
                    ? 'text-white border-b-2 border-white' 
                    : 'text-white/40 hover:text-white/60'
                }`}
              >
                Automatic OAuth
              </button>
              <button
                onClick={() => setModalTab('manual')}
                className={`flex-1 py-3 text-[12px] font-bold uppercase tracking-wider transition-all ${
                  modalTab === 'manual' 
                    ? 'text-white border-b-2 border-white' 
                    : 'text-white/40 hover:text-white/60'
                }`}
              >
                Manual Keys
              </button>
            </div>

            {/* Modal Content Scroll Area */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1 custom-scrollbar text-[13px] leading-relaxed">
              {modalTab === 'oauth' ? (
                <div className="space-y-4">
                  <p className="text-white/60">
                    Connect automatically via Meta's secure login. This requires the site owner to have configured the main Meta developer credentials.
                  </p>
                  <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02] space-y-2">
                    <h4 className="font-semibold text-white/80">Permissions requested:</h4>
                    <ul className="list-disc pl-4 text-white/40 space-y-1 text-[12px]">
                      <li>Access your Instagram Business Profile Info</li>
                      <li>Publish media, posts, and Reels to your profile</li>
                      <li>Manage your linked pages & accounts list</li>
                    </ul>
                  </div>
                  <button
                    onClick={() => {
                      setConnecting('instagram')
                      setIsManualModalOpen(false)
                      const handleParam = creatorData?.handle || 'default'
                      window.location.href = `/api/auth/instagram/login?handle=${encodeURIComponent(handleParam)}`
                    }}
                    className="w-full forge-btn-primary py-2.5 rounded-xl font-bold flex items-center justify-center gap-2"
                  >
                    <Instagram size={14} />
                    Sign in with Facebook
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl border border-emerald-500/10 bg-emerald-500/[0.02]">
                    <p className="text-emerald-400 font-bold mb-1 flex items-center gap-1.5 text-[12px]">
                      <AlertCircle size={13} />
                      Creator Self-Connection Guide
                    </p>
                    <p className="text-white/50 text-[11px] leading-normal">
                      To publish posts from this app without using a global OAuth connection, you can generate your own local tokens on Meta's developer dashboard.
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    <p className="font-bold text-white/80">Follow these steps to connect:</p>
                    <ol className="list-decimal pl-4 space-y-2 text-white/60 text-[12px]">
                      <li>
                        Ensure your Instagram is a <strong className="text-white">Business or Creator</strong> account and linked to a Facebook Page.
                      </li>
                      <li>
                        Register as a developer on <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="text-white underline inline-flex items-center gap-0.5 hover:text-white/80">developers.facebook.com <ExternalLink size={10} /></a>.
                      </li>
                      <li>
                        Click **Create App** → Choose **Other** → **Business** App and add **Instagram Graph API** to it.
                      </li>
                      <li>
                        Open the <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer" className="text-white underline inline-flex items-center gap-0.5 hover:text-white/80">Graph API Explorer <ExternalLink size={10} /></a>. Select your App, and add these scopes:
                        <div className="mt-1 font-mono bg-white/5 p-2 rounded text-white/80 text-[10px] select-all border border-white/5 break-all">
                          instagram_basic, instagram_content_publish, pages_read_engagement, pages_show_list
                        </div>
                      </li>
                      <li>
                        Click **Generate Access Token** and approve permissions in the popup.
                      </li>
                      <li>
                        Find your **Instagram Business Account ID** by making this query:
                        <div className="mt-1 font-mono bg-white/5 p-2 rounded text-white/80 text-[10px] border border-white/5">
                          GET /me/accounts?fields=instagram_business_account,name
                        </div>
                      </li>
                    </ol>
                  </div>

                  {/* Form inputs */}
                  <div className="space-y-3.5 pt-3.5 border-t border-white/5">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider block">Instagram Business Account ID</label>
                      <input 
                        type="text" 
                        value={manualBusinessId}
                        onChange={(e) => setManualBusinessId(e.target.value)}
                        placeholder="e.g. 178414053987165"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-white/30 text-[13px] font-mono"
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider block">Developer User Access Token</label>
                      <textarea 
                        value={manualAccessToken}
                        onChange={(e) => setManualAccessToken(e.target.value)}
                        placeholder="Paste your generated Facebook Access Token here..."
                        className="w-full h-20 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-white/30 text-[12px] font-mono resize-none custom-scrollbar"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (!manualBusinessId.trim() || !manualAccessToken.trim()) {
                        if (triggerToast) triggerToast('Please enter both Business Account ID and Access Token', 'error')
                        return
                      }
                      
                      // Save keys inside creatorData
                      updateCreator({
                        instagram_business_id: manualBusinessId.trim(),
                        instagram_access_token: manualAccessToken.trim()
                      })
                      
                      // Mark Instagram connected in platforms list
                      setPlatforms(prev => prev.map(p => 
                        p.id === 'instagram' 
                          ? { 
                              ...p, 
                              connected: true,
                              audience: 'Connected (Manual)' 
                            } 
                          : p
                      ))
                      
                      setIsManualModalOpen(false)
                      if (triggerToast) triggerToast('Instagram manually connected with custom credentials!', 'success')
                    }}
                    className="w-full forge-btn-primary py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 mt-4"
                  >
                    Save & Connect Account
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

