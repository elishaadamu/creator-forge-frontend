import { useState } from 'react'
import { Youtube, Instagram, Twitter, Check, Plus, ExternalLink, AlertCircle, Clock, Radio, ChevronRight } from 'lucide-react'

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
  const [platforms, setPlatforms] = useState(
    PLATFORMS.map(p => ({ ...p, connected: false, audience: null, autoPost: false, approveBeforePost: true }))
  )
  const [connecting, setConnecting] = useState(null)
  const [expandedId, setExpandedId] = useState(null)

  const handleConnect = (id) => {
    setConnecting(id)
    setTimeout(() => {
      setPlatforms(prev => prev.map(p =>
        p.id === id
          ? { ...p, connected: true, audience: `${Math.floor(Math.random() * 800 + 100)}K followers` }
          : p
      ))
      setConnecting(null)
    }, 1400)
  }

  const handleDisconnect = (id) => {
    setPlatforms(prev => prev.map(p =>
      p.id === id ? { ...p, connected: false, audience: null, autoPost: false } : p
    ))
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

  const connectedCount = platforms.filter(p => p.connected).length

  return (
    <div className="p-6 max-w-2xl space-y-8">
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
      {connectedCount === 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl border" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}>
          <AlertCircle size={15} className="text-white/40 flex-shrink-0" />
          <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Connect at least one account to enable scheduling and auto-posting.
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
                <div className="flex items-center gap-4 p-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}>
                    <platform.icon size={18} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
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

                  <div className="flex items-center gap-2">
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
              <div key={i} className="flex items-center gap-4 p-3.5 rounded-xl border" style={{ background: '#111', borderColor: 'rgba(255,255,255,0.07)' }}>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded w-8 text-center flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>
                  {post.platform.slice(0, 2).toUpperCase()}
                </span>
                <span className="text-[13px] flex-1 truncate" style={{ color: 'rgba(255,255,255,0.65)' }}>{post.content}</span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {post.time !== '-' && (
                    <span className="text-[11px] flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      <Clock size={10} />
                      {post.time}
                    </span>
                  )}
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={s}>{s.label}</span>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <p className="text-[12px] text-center" style={{ color: 'rgba(255,255,255,0.18)' }}>
        Forge uses OAuth only - your credentials are never stored.
      </p>
    </div>
  )
}
