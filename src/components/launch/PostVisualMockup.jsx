import { useState } from 'react'
import {
  Heart,
  MessageCircle,
  Repeat2,
  Bookmark,
  Share2,
  Play,
  Pause,
  Volume2,
  Sparkles,
  Check,
  Copy,
  ExternalLink,
  ShieldCheck,
  Zap,
  Youtube,
  Mail,
  Smartphone,
  Video,
  CheckCircle2,
  Layers,
  ArrowRight
} from 'lucide-react'

export function XLogo({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

/**
 * PostVisualMockup
 * Renders high-fidelity visual mockups for social posts, Instagram/TikTok stories,
 * 60-second video integrations, and email newsletters — avoiding raw text heaviness.
 */
export default function PostVisualMockup({
  type = 'post', // 'post' | 'story' | 'video' | 'newsletter' | 'dm'
  project = {},
  copyText = '',
  preorderUrl = '',
  brandColor = '#f59e0b',
  onCopy = null,
  imageUrl = null,
  videoUrl = null,
  isGeneratingImage = false,
  isGeneratingVideo = false
}) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [activeStoryIdx, setActiveStoryIdx] = useState(0)
  const [pollSelected, setPollSelected] = useState(null)
  const [copied, setCopied] = useState(false)

  const activeImageUrl = imageUrl || project?.campaignKit?.postImageUrl || project?.campaignKit?.postImageDataUrl || null
  const activeVideoUrl = videoUrl || project?.campaignKit?.videoUrl || null

  const creatorName = project?.creatorName || 'Creator'
  const creatorHandle = (project?.creatorHandle || project?.handle || '@creator').replace(/^@/, '')
  const creatorAvatar = project?.creatorAvatar || null
  const productName = project?.productName || project?.title || 'Software Venture'
  const productTagline = project?.productTagline || project?.tagline || 'The high-leverage workspace'
  const niche = project?.niche || 'Software Engineering'

  const pricingConfig = project?.campaignKit?.pricingConfig || project?.pricingConfig || {}
  const foundingPrice = pricingConfig.foundingPrice || 99
  const depositPrice = pricingConfig.depositPrice || 19

  // Detect recent video upload title for authentic grounding
  const recentVideoTitle =
    project?.recentPosts?.[0]?.title ||
    project?.videos?.[0]?.title ||
    project?.transcripts?.[0]?.title ||
    'Recent Channel Upload'

  const targetUrl = preorderUrl || (typeof window !== 'undefined' ? `${window.location.origin}/preorder/${(productName || 'product').toLowerCase().replace(/[^a-z0-9]+/g, '-')}` : 'https://creatorforge.app/preorder')

  const handleCopyAction = () => {
    if (onCopy) {
      onCopy()
    } else if (copyText && navigator.clipboard) {
      navigator.clipboard.writeText(copyText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 1. SOCIAL POST MOCKUP (Official X Post Dark Mode Preview)
  // ─────────────────────────────────────────────────────────────
  if (type === 'post') {
    return (
      <div className="w-full max-w-xl mx-auto rounded-2xl bg-black border border-[#2f3336] shadow-2xl overflow-hidden text-white transition-all font-sans keep-dark product-mockup-display post-visual-mockup">
        {/* Mockup Header bar */}
        <div className="px-4 py-2.5 bg-black border-b border-[#2f3336] flex items-center justify-between text-xs text-[#71767b]">
          <div className="flex items-center gap-2 font-medium">
            <XLogo className="w-3.5 h-3.5 text-white" />
            <span className="text-white font-semibold">X Announcement Preview</span>
            <span className="text-[#71767b] font-normal hidden sm:inline">· Official Post</span>
          </div>
          <span className="text-[10px] font-mono bg-[#16181c] text-[#e7e9ea] px-2.5 py-0.5 rounded-full border border-[#2f3336] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Live Post Preview</span>
          </span>
        </div>

        <div className="p-4 sm:p-5 space-y-3.5 bg-black text-[#e7e9ea]">
          {/* Post Author Info */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {creatorAvatar ? (
                <img
                  src={creatorAvatar}
                  alt={creatorName}
                  className="w-10 h-10 rounded-full object-cover border border-[#2f3336] shadow-sm"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#16181c] border border-[#2f3336] text-white font-bold flex items-center justify-center text-sm shadow-sm">
                  {creatorName.charAt(0)}
                </div>
              )}
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-sm text-white" style={{ color: '#ffffff' }}>{creatorName}</span>
                  <span className="w-3.5 h-3.5 rounded-full bg-[#1d9bf0] flex items-center justify-center text-[8px] text-white font-bold leading-none" title="Verified">✓</span>
                  <span className="text-xs text-[#71767b] font-mono">@{creatorHandle}</span>
                  <span className="text-xs text-[#71767b]">· 2h</span>
                </div>
                <span className="text-[11px] text-[#71767b] font-medium block">Co-Founder &amp; Creator · {niche}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <XLogo className="w-4 h-4 text-[#71767b]" />
              <button
                type="button"
                onClick={handleCopyAction}
                className="px-2.5 py-1 rounded-full bg-[#16181c] hover:bg-[#202327] text-[#e7e9ea] text-xs font-semibold flex items-center gap-1.5 border border-[#2f3336] transition-colors cursor-pointer"
                title="Copy caption"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-[#71767b]" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Post Body Caption */}
          <div className="text-xs sm:text-[13px] text-[#e7e9ea] leading-relaxed space-y-2 whitespace-pre-wrap font-normal" style={{ color: '#e7e9ea' }}>
            {copyText ? (
              copyText.slice(0, 280) + (copyText.length > 280 ? '...' : '')
            ) : (
              <>
                <p style={{ color: '#e7e9ea' }}>
                  🚨 After hundreds of comments across our channel on how broken manual workflows are in {niche}, we're officially co-founding <strong className="text-white font-bold" style={{ color: '#ffffff' }}>{productName}</strong>.
                </p>
                <p style={{ color: '#9ca3af' }}>
                  💡 {productTagline}. Sourced directly from our recent breakdown on "{recentVideoTitle}".
                </p>
                <p className="text-[#1d9bf0] font-medium" style={{ color: '#1d9bf0' }}>
                  We're accepting only 50 Founding Members at 50% off + lifetime roadmap input 👇
                </p>
              </>
            )}
          </div>

          {/* Attached High-Fidelity Visual Image Mockup Banner */}
          <div className="rounded-2xl border border-[#2f3336] overflow-hidden bg-gradient-to-br from-[#0c1322] via-[#080d1a] to-[#030611] text-white shadow-xl group keep-dark product-mockup-display relative">
            {/* Generating Overlay */}
            {isGeneratingImage && (
              <div className="absolute inset-0 bg-black/85 backdrop-blur-sm z-30 flex flex-col items-center justify-center gap-3 p-6 text-center">
                <div className="w-10 h-10 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
                <div className="space-y-1">
                  <span className="text-xs font-bold text-amber-300 block">Generating AI Post Graphic with Gemini 3.1...</span>
                  <span className="text-[10px] text-slate-400 block max-w-xs">
                    Calling gemini-3.1-flash-image to synthesize official announcement graphic.
                  </span>
                </div>
              </div>
            )}

            {/* Visual Header Banner */}
            <div className="p-3.5 sm:p-4 pb-3 flex items-center justify-between border-b border-white/[0.08] bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/90" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/90" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/90" />
                </div>
                <span className="text-[10px] font-mono text-slate-400" style={{ color: '#94a3b8' }}>app.{productName.toLowerCase().replace(/[^a-z0-9]/g, '')}.io</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-400/15 text-amber-300 border border-amber-400/30 flex items-center gap-1 font-mono">
                <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                {activeImageUrl ? 'Gemini 3.1 AI Graphic' : 'Founding Cohort (50 Spots)'}
              </span>
            </div>

            {/* Visual Body: AI Generated Image OR Graphic Artwork */}
            {activeImageUrl ? (
              <div className="relative group/media overflow-hidden bg-black flex items-center justify-center">
                <img
                  src={activeImageUrl}
                  alt={`${productName} announcement`}
                  className="w-full h-auto max-h-[440px] object-cover transition-transform duration-500 group-hover/media:scale-[1.01]"
                />
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold bg-black/80 backdrop-blur-md text-amber-300 border border-amber-400/30 flex items-center gap-1.5 shadow-lg">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Gemini 3.1 Flash Image</span>
                </div>
              </div>
            ) : (
              <div className="p-5 sm:p-6 space-y-4 relative">
                <div className="space-y-1.5">
                  <div className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    {niche} Architecture OS
                  </div>
                  <h3
                    className="text-lg sm:text-xl font-extrabold text-white tracking-tight"
                    style={{ color: '#ffffff' }}
                  >
                    {productName}
                  </h3>
                  <p
                    className="text-xs text-slate-300 max-w-md line-clamp-2"
                    style={{ color: '#cbd5e1' }}
                  >
                    {productTagline}
                  </p>
                </div>

                {/* Graphic Mockup Cards Grid */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] space-y-1">
                    <span className="text-[10px] font-mono text-slate-400 uppercase block" style={{ color: '#94a3b8' }}>Founding Pass</span>
                    <div className="text-sm font-extrabold text-emerald-400 font-mono" style={{ color: '#34d399' }}>50% Lifetime Off</div>
                    <span className="text-[9px] text-slate-400 block" style={{ color: '#94a3b8' }}>${foundingPrice}/yr (Lock Forever)</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] space-y-1">
                    <span className="text-[10px] font-mono text-slate-400 uppercase block" style={{ color: '#94a3b8' }}>Refundable Hold</span>
                    <div className="text-sm font-extrabold text-amber-300 font-mono" style={{ color: '#fcd34d' }}>${depositPrice} Deposit</div>
                    <span className="text-[9px] text-slate-400 block" style={{ color: '#94a3b8' }}>100% Guaranteed</span>
                  </div>
                </div>

                {/* Verified Attribution Watermark */}
                <div className="pt-2 flex items-center justify-between text-[10px] border-t border-white/[0.06]">
                  <span style={{ color: '#94a3b8' }}>Co-founded with {creatorName}</span>
                  <span className="font-mono text-emerald-400 flex items-center gap-1" style={{ color: '#34d399' }}>
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    Verified Engineering Pass
                  </span>
                </div>
              </div>
            )}

            {/* Clickable Card Link Metadata Footer */}
            <div className="px-4 py-2.5 bg-black border-t border-[#2f3336] flex items-center justify-between text-xs">
              <div className="min-w-0">
                <span className="text-[10px] text-[#71767b] font-mono block truncate" style={{ color: '#71767b' }}>creatorforge.app/preorder</span>
                <span className="font-bold text-white text-xs truncate block" style={{ color: '#ffffff' }}>{productName} — Official Co-Launch</span>
              </div>
              <span className="px-3.5 py-1.5 rounded-full bg-white hover:bg-slate-200 text-black font-extrabold text-xs shrink-0 flex items-center gap-1.5 transition-colors shadow-sm">
                <span>Reserve</span>
                <ArrowRight className="w-3 h-3 stroke-[2.5]" />
              </span>
            </div>
          </div>

          {/* Social Engagement Stats */}
          <div className="flex items-center justify-between text-[#71767b] text-xs pt-1 px-1 border-t border-[#2f3336]">
            <span className="flex items-center gap-1.5 hover:text-[#1d9bf0] cursor-pointer transition-colors group">
              <MessageCircle className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              <span>48</span>
            </span>
            <span className="flex items-center gap-1.5 hover:text-[#00ba7c] cursor-pointer transition-colors group">
              <Repeat2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              <span>112</span>
            </span>
            <span className="flex items-center gap-1.5 hover:text-[#f91880] cursor-pointer transition-colors group">
              <Heart className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              <span>624</span>
            </span>
            <span className="flex items-center gap-1.5 hover:text-[#1d9bf0] cursor-pointer transition-colors group">
              <Bookmark className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              <span>94</span>
            </span>
            <span className="flex items-center gap-1.5 hover:text-[#1d9bf0] cursor-pointer transition-colors group">
              <Share2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            </span>
          </div>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────
  // 2. STORY SEQUENCE MOCKUP (Instagram / TikTok 9:16 Story Frame)
  // ─────────────────────────────────────────────────────────────
  if (type === 'story') {
    // Parse dynamic copyText into individual story steps
    const parseStoriesFromCopy = (text) => {
      if (!text || typeof text !== 'string') return null
      const storyBlocks = text.split(/(?:STORY\s*\d+|Story\s*\d+)[\s:—–-]+/i).map(s => s.trim()).filter(Boolean)
      if (storyBlocks.length >= 2) return storyBlocks
      const lines = text.split(/\n\s*\n/).map(l => l.trim()).filter(Boolean)
      if (lines.length >= 2) return lines
      return null
    }

    const storyParts = parseStoriesFromCopy(copyText)
    const currentStoryRaw = storyParts && storyParts[activeStoryIdx] ? storyParts[activeStoryIdx] : null

    return (
      <div className="w-full max-w-sm mx-auto space-y-3 font-sans py-2">
        {/* Story Step Selector Controls */}
        <div className="flex items-center justify-between text-xs px-1">
          <span className="font-bold flex items-center gap-1.5 text-slate-800" style={{ color: '#1e293b' }}>
            <Smartphone className="w-3.5 h-3.5 text-pink-500" />
            <span>Interactive 3-Story Sequence</span>
          </span>
          <div className="flex gap-1">
            {['1. Poll', '2. Reveal', '3. CTA'].map((label, idx) => (
              <button
                key={label}
                type="button"
                onClick={() => setActiveStoryIdx(idx)}
                style={
                  activeStoryIdx === idx
                    ? { backgroundColor: '#db2777', color: '#ffffff' }
                    : { backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' }
                }
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  activeStoryIdx === idx
                    ? 'shadow-xs'
                    : 'hover:bg-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* 9:16 Mobile Phone Frame */}
        <div
          className="relative w-full aspect-[9/16] min-h-[580px] max-h-[620px] rounded-[36px] border-[5px] shadow-2xl overflow-hidden flex flex-col justify-between pt-7 pb-6 px-4 sm:px-5 select-none post-visual-mockup keep-dark product-mockup-display"
          style={{
            backgroundColor: '#0c0f1d',
            backgroundImage: 'radial-gradient(ellipse at top, #231145 0%, #0d1124 55%, #05070e 100%)',
            borderColor: '#1e2433',
            color: '#ffffff'
          }}
        >
          {/* Phone Dynamic Island / Camera */}
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-20 h-4 bg-black/90 rounded-full z-20 pointer-events-none flex items-center justify-end pr-2">
            <div className="w-2 h-2 rounded-full bg-[#151515] border border-white/10" />
          </div>

          {/* Ambient Background Gradient */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(180deg, rgba(35, 17, 69, 0.45) 0%, rgba(13, 17, 36, 0.6) 50%, rgba(5, 7, 14, 0.92) 100%)'
            }}
          />

          {/* Top Story Progress Bars */}
          <div className="relative z-10 space-y-3 pt-1">
            <div className="grid grid-cols-3 gap-1">
              {[0, 1, 2].map((idx) => (
                <div key={idx} className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.25)' }}>
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      backgroundColor: '#ffffff',
                      width: activeStoryIdx > idx ? '100%' : activeStoryIdx === idx ? '75%' : '0%'
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Creator Profile Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {creatorAvatar ? (
                  <img
                    src={creatorAvatar}
                    alt={creatorName}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-pink-500"
                    style={{ border: '1px solid rgba(255,255,255,0.4)' }}
                  />
                ) : (
                  <div
                    className="w-8 h-8 rounded-full font-bold flex items-center justify-center text-xs"
                    style={{ backgroundColor: '#db2777', color: '#ffffff' }}
                  >
                    {creatorName.charAt(0)}
                  </div>
                )}
                <div>
                  <span className="font-bold text-xs block leading-tight" style={{ color: '#ffffff' }}>{creatorHandle}</span>
                  <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.65)' }}>3h ago · Story {activeStoryIdx + 1}/3</span>
                </div>
              </div>
              <span
                className="text-[10px] font-mono px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.12)',
                  backdropFilter: 'blur(8px)',
                  color: 'rgba(255,255,255,0.9)',
                  border: '1px solid rgba(255,255,255,0.15)'
                }}
              >
                {activeStoryIdx === 0 ? 'Problem Poll' : activeStoryIdx === 1 ? 'Product Reveal' : 'Founding CTA'}
              </span>
            </div>
          </div>

          {/* Story Content Canvas (Changes per activeStoryIdx) */}
          <div className="relative z-10 my-auto py-3 space-y-4">
            {activeStoryIdx === 0 && (
              <div className="space-y-4 text-center">
                <div className="space-y-1">
                  <div
                    className="inline-block px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider"
                    style={{
                      backgroundColor: 'rgba(236, 72, 153, 0.2)',
                      color: '#f472b6',
                      border: '1px solid rgba(244, 114, 182, 0.4)'
                    }}
                  >
                    Quick Poll For Everyone
                  </div>
                  <h4 className="text-base sm:text-lg font-black px-2 leading-snug" style={{ color: '#ffffff' }}>
                    {currentStoryRaw ? currentStoryRaw.replace(/^.*Text:\s*"?/i, '').replace(/"?.*$/i, '').slice(0, 90) : `How many hours do you waste weekly on manual ${niche} tasks?`}
                  </h4>
                </div>

                {/* Interactive Poll Sticker Mockup */}
                <div
                  className="max-w-[270px] mx-auto rounded-2xl p-2.5 space-y-2 shadow-xl"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255, 255, 255, 0.18)'
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setPollSelected('a')}
                    className="w-full p-2.5 rounded-xl border text-xs font-bold transition-all text-left flex items-center justify-between cursor-pointer"
                    style={
                      pollSelected === 'a'
                        ? { backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#ffffff', boxShadow: '0 4px 12px rgba(0,0,0,0.25)' }
                        : { backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#ffffff', borderColor: 'rgba(255, 255, 255, 0.18)' }
                    }
                  >
                    <span className="font-semibold" style={{ color: pollSelected === 'a' ? '#0f172a' : '#ffffff' }}>1–3 Hours</span>
                    <span className="font-mono text-[11px] font-bold" style={{ color: pollSelected === 'a' ? '#475569' : 'rgba(255,255,255,0.75)' }}>18%</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPollSelected('b')}
                    className="w-full p-2.5 rounded-xl border text-xs font-bold transition-all text-left flex items-center justify-between cursor-pointer"
                    style={
                      pollSelected === 'b'
                        ? {
                            backgroundColor: '#10b981',
                            color: '#022c22',
                            borderColor: '#34d399',
                            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
                          }
                        : {
                            backgroundColor: 'rgba(16, 185, 129, 0.15)',
                            color: '#ffffff',
                            borderColor: 'rgba(52, 211, 153, 0.35)'
                          }
                    }
                  >
                    <span className="font-bold" style={{ color: pollSelected === 'b' ? '#022c22' : '#ffffff' }}>
                      5+ Hours (Too much!)
                    </span>
                    <span
                      className="font-mono text-[11px] font-black px-1.5 py-0.5 rounded-md"
                      style={
                        pollSelected === 'b'
                          ? { backgroundColor: 'rgba(2, 44, 34, 0.2)', color: '#022c22' }
                          : { backgroundColor: 'rgba(52, 211, 153, 0.25)', color: '#34d399' }
                      }
                    >
                      82% ✓
                    </span>
                  </button>
                </div>
                <p className="text-[11px]" style={{ color: '#94a3b8' }}>
                  Tap next to see what we've been secretly engineering 🤫
                </p>
              </div>
            )}

            {activeStoryIdx === 1 && (
              <div className="space-y-3.5 text-center">
                <div
                  className="inline-block px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider"
                  style={{
                    backgroundColor: 'rgba(99, 102, 241, 0.2)',
                    color: '#c7d2fe',
                    border: '1px solid rgba(129, 140, 248, 0.4)'
                  }}
                >
                  Co-Founding Announcement
                </div>
                <h4 className="text-lg font-black" style={{ color: '#ffffff' }}>
                  Meet {productName}
                </h4>
                <p className="text-xs px-2 line-clamp-3 leading-relaxed" style={{ color: '#cbd5e1' }}>
                  {currentStoryRaw ? currentStoryRaw.replace(/^.*Text:\s*"?/i, '').slice(0, 120) : productTagline}
                </p>

                {/* Floating Product Card */}
                <div
                  className="max-w-[270px] mx-auto p-4 rounded-2xl text-left space-y-2.5 shadow-xl"
                  style={{
                    backgroundColor: '#111827',
                    backgroundImage: 'linear-gradient(135deg, rgba(30, 27, 75, 0.85) 0%, rgba(15, 23, 42, 0.95) 100%)',
                    border: '1px solid rgba(129, 140, 248, 0.35)',
                    color: '#ffffff'
                  }}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="font-semibold" style={{ color: '#a5b4fc' }}>Studio MVP</span>
                    <span className="font-bold flex items-center gap-1" style={{ color: '#34d399' }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Live In Sprint</span>
                    </span>
                  </div>
                  <div className="text-sm font-extrabold" style={{ color: '#ffffff' }}>{productName}</div>
                  <div className="text-[11px] leading-relaxed" style={{ color: '#e2e8f0' }}>
                    Automates the exact friction discussed in "{recentVideoTitle}".
                  </div>
                </div>
              </div>
            )}

            {activeStoryIdx === 2 && (
              <div className="space-y-3.5 text-center">
                <div
                  className="inline-block px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider"
                  style={{
                    backgroundColor: 'rgba(245, 158, 11, 0.18)',
                    color: '#fbbf24',
                    border: '1px solid rgba(245, 158, 11, 0.4)'
                  }}
                >
                  Founding Backer Access
                </div>
                <h4 className="text-lg font-black" style={{ color: '#ffffff' }}>
                  50 VIP Spots Open
                </h4>
                <p className="text-xs px-3 leading-relaxed" style={{ color: '#cbd5e1' }}>
                  {currentStoryRaw ? currentStoryRaw.replace(/^.*Text:\s*"?/i, '').slice(0, 110) : `Lock 50% lifetime pricing ($${foundingPrice}/yr) + direct input with ${creatorName} on product features.`}
                </p>

                {/* Link Sticker Mockup */}
                <div className="pt-2">
                  <a
                    href={targetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
                    style={{
                      backgroundColor: '#ffffff',
                      color: '#090d16',
                      border: '1px solid #ffffff'
                    }}
                  >
                    <span style={{ color: '#090d16' }}>🔗 PREORDER FOUNDING PASS</span>
                    <ArrowRight className="w-3.5 h-3.5" style={{ color: '#090d16' }} />
                  </a>
                </div>
                <div className="pt-1">
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-semibold"
                    style={{
                      backgroundColor: 'rgba(0, 0, 0, 0.55)',
                      border: '1px solid rgba(245, 158, 11, 0.35)',
                      color: '#fbbf24'
                    }}
                  >
                    <span>🔒</span>
                    <span>${depositPrice} refundable hold · 100% guaranteed</span>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Reply Bar & Home Indicator */}
          <div className="relative z-10 space-y-3 pt-2">
            <div
              className="flex items-center gap-2 pt-2"
              style={{ borderTop: '1px solid rgba(255, 255, 255, 0.12)' }}
            >
              <div
                className="flex-1 px-3.5 py-2.5 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: 'rgba(255, 255, 255, 0.65)'
                }}
              >
                Send message to {creatorName}...
              </div>
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer hover:scale-105 transition-transform shrink-0"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)'
                }}
              >
                <Heart className="w-4 h-4 text-pink-400 fill-pink-400" />
              </div>
            </div>

            {/* Home Indicator Bar */}
            <div className="w-28 h-1 rounded-full bg-white/35 mx-auto pointer-events-none" />
          </div>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────
  // 3. 60-SECOND VIDEO INTEGRATION / SHORT-FORM VIDEO MOCKUP
  // ─────────────────────────────────────────────────────────────
  if (type === 'video') {
    return (
      <div
        className="w-full max-w-xl mx-auto rounded-2xl shadow-xl overflow-hidden font-sans keep-dark product-mockup-display post-visual-mockup"
        style={{ backgroundColor: '#090d16', border: '1px solid #1e2433', color: '#ffffff' }}
      >
        {/* Player Top Bar */}
        <div
          className="px-4 py-2.5 flex items-center justify-between text-xs"
          style={{ backgroundColor: '#0f1422', borderBottom: '1px solid #1e2433', color: '#94a3b8' }}
        >
          <div className="flex items-center gap-2">
            <Video className="w-4 h-4 text-red-500" />
            <span className="font-bold" style={{ color: '#ffffff' }}>60s Video Integration Mockup (Shorts / Reels / Mid-Roll)</span>
          </div>
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-mono"
            style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)' }}
          >
            Native Video Script
          </span>
        </div>

        {/* Video Canvas Simulation OR Real Veo 3.1 Video */}
        <div
          className="relative aspect-video flex items-center justify-center overflow-hidden bg-black"
          style={{ background: 'linear-gradient(135deg, #0f172a 0%, #090d16 50%, #030712 100%)' }}
        >
          {isGeneratingVideo ? (
            <div className="absolute inset-0 bg-black/90 backdrop-blur-sm z-30 flex flex-col items-center justify-center gap-3 p-6 text-center">
              <div className="w-12 h-12 rounded-full border-3 border-rose-500 border-t-transparent animate-spin" />
              <div className="space-y-1">
                <span className="text-sm font-bold text-rose-400 block">Veo 3.1 Video Generation In Progress...</span>
                <span className="text-[11px] text-slate-300 block max-w-sm">
                  Polling operation status via veo-3.1-generate-preview. Compiling cinematic AI video.
                </span>
              </div>
            </div>
          ) : activeVideoUrl ? (
            <div className="relative w-full h-full flex items-center justify-center bg-black group/video">
              <video
                src={activeVideoUrl}
                controls
                playsInline
                className="w-full h-full object-contain"
              />
              <div className="absolute top-3 left-3 pointer-events-none px-2.5 py-1 rounded-full text-[10px] font-bold bg-black/80 backdrop-blur-md text-rose-300 border border-rose-500/30 flex items-center gap-1.5 z-10 shadow-lg">
                <Video className="w-3 h-3 text-rose-400" />
                <span>Veo 3.1 AI Generated Video</span>
              </div>
            </div>
          ) : (
            <>
              {/* Ambient Video Visual Backdrop */}
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />

              {/* Play/Pause Button Overlay */}
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-16 h-16 rounded-full bg-red-600/90 hover:bg-red-600 text-white flex items-center justify-center shadow-2xl transition-transform hover:scale-110 active:scale-95 cursor-pointer relative z-20 group"
              >
                {isPlaying ? (
                  <Pause className="w-7 h-7" />
                ) : (
                  <Play className="w-7 h-7 fill-white translate-x-0.5" />
                )}
              </button>

              {/* Teleprompter Subtitle Overlay (Dynamic from AI copyText) */}
              <div className="absolute bottom-4 inset-x-4 z-20 text-center space-y-2">
                <div
                  className="inline-block px-3 py-1 rounded-full text-[11px] font-mono font-medium backdrop-blur-md"
                  style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)', border: '1px solid rgba(255, 255, 255, 0.2)', color: '#fde047' }}
                >
                  {isPlaying ? '▶ Teleprompter Script Sync Active' : '⏸ Video Script Teleprompter Preview'}
                </div>
                <div
                  className="text-xs sm:text-[13px] font-medium leading-relaxed drop-shadow-md max-w-lg mx-auto backdrop-blur-md p-3 rounded-xl max-h-36 overflow-y-auto whitespace-pre-wrap text-left select-text"
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.75)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#ffffff'
                  }}
                >
                  {copyText || `"If you saw our recent breakdown on \"${recentVideoTitle}\", you saw how painful manual workflows in ${niche} really are. That's why we engineered ${productName}..."`}
                </div>
              </div>

              {/* Live Attribution Overlay Badge */}
              <div
                className="absolute top-4 left-4 z-20 flex items-center gap-2 backdrop-blur-md px-3 py-1.5 rounded-xl"
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)', border: '1px solid rgba(255, 255, 255, 0.15)' }}
              >
                {creatorAvatar ? (
                  <img src={creatorAvatar} alt="" className="w-5 h-5 rounded-full object-cover" />
                ) : (
                  <Youtube className="w-4 h-4 text-red-500" />
                )}
                <span className="text-xs font-bold" style={{ color: '#ffffff' }}>{creatorName}</span>
                <span className="text-[10px] font-mono" style={{ color: '#94a3b8' }}>0:24 / 1:00</span>
              </div>

              <div
                className="absolute top-4 right-4 z-20 flex items-center gap-1.5 backdrop-blur-md px-2.5 py-1.5 rounded-xl text-xs"
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#cbd5e1' }}
              >
                <Volume2 className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[10px] font-mono">Original Audio</span>
              </div>
            </>
          )}
        </div>

        {/* Video Scrubber & Script Stage Guide */}
        <div
          className="p-4 border-t space-y-3"
          style={{ backgroundColor: '#0c101d', borderColor: '#1e2433' }}
        >
          {/* Progress bar */}
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div className="bg-red-500 h-full w-2/5 rounded-full" />
          </div>

          {/* 4-Stage Script Breakdown Markers */}
          <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-mono">
            <div
              className="p-1.5 rounded-lg"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fde047' }}
            >
              <span className="font-bold block">Hook (0-8s)</span>
              <span className="text-[9px]" style={{ color: '#94a3b8' }}>Video Citation</span>
            </div>
            <div
              className="p-1.5 rounded-lg"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fda4af' }}
            >
              <span className="font-bold block">Problem (8-22s)</span>
              <span className="text-[9px]" style={{ color: '#94a3b8' }}>Viewer Pain</span>
            </div>
            <div
              className="p-1.5 rounded-lg"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#6ee7b7' }}
            >
              <span className="font-bold block">Solution (22-42s)</span>
              <span className="text-[9px]" style={{ color: '#94a3b8' }}>Software Demo</span>
            </div>
            <div
              className="p-1.5 rounded-lg"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#7dd3fc' }}
            >
              <span className="font-bold block">CTA (42-60s)</span>
              <span className="text-[9px]" style={{ color: '#94a3b8' }}>50 Founding Spots</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────
  // 4. 1:1 FOUNDER EMAIL NEWSLETTER MOCKUP
  // ─────────────────────────────────────────────────────────────
  if (type === 'newsletter') {
    const subjectMatch = typeof copyText === 'string' ? copyText.match(/Subject:\s*(.*)/i) : null;
    const emailSubject = subjectMatch ? subjectMatch[1].trim() : `Why I'm co-founding ${productName} (and an early invite for you)`;
    const emailBodyText = typeof copyText === 'string'
      ? copyText.replace(/^Subject:\s*.*(?:\r?\n)+/i, '').trim()
      : '';

    return (
      <div className="w-full max-w-xl mx-auto rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden text-slate-900 font-sans">
        {/* Email Client Window Chrome */}
        <div className="px-4 py-2.5 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            </div>
            <span className="font-medium text-slate-600 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-slate-500" />
              1:1 Plain-Text Newsletter Preview
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
            Primary Inbox Guaranteed
          </span>
        </div>

        {/* Email Metadata Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 space-y-2 bg-slate-50/50 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-mono">From:</span>
            <span className="font-semibold text-slate-900">
              {creatorName} &lt;{creatorHandle}@newsletter.com&gt;
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-mono">To:</span>
            <span className="text-slate-700 font-medium">Core Subscribers ({niche} Community)</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-mono">Subject:</span>
            <span className="font-bold text-slate-900 text-xs sm:text-sm">
              {emailSubject}
            </span>
          </div>
        </div>

        {/* Email Body Preview (Dynamic from AI copyText) */}
        <div className="p-5 sm:p-6 space-y-3.5 text-xs sm:text-[13px] text-slate-800 leading-relaxed whitespace-pre-wrap">
          {emailBodyText ? (
            emailBodyText.split(/\n\s*\n/).map((para, pIdx) => {
              if (para.includes('http') || para.includes('/preorder/')) {
                return (
                  <div key={pIdx} className="pt-2 text-center sm:text-left">
                    <a
                      href={targetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs transition-colors shadow-xs"
                    >
                      <span>👉 Claim Founding Pass (${depositPrice} Deposit)</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )
              }
              return <p key={pIdx}>{para}</p>
            })
          ) : (
            <>
              <p>Hey [First Name],</p>
              <p>
                If you've been following my channel and community discussions in {niche}, you know how much time we waste on manual bottlenecks.
              </p>
              <p className="bg-amber-50/70 border-l-2 border-amber-400 p-2.5 rounded-r-lg text-slate-700 italic">
                "In our recent video <strong>"{recentVideoTitle}"</strong>, hundreds of you reached out asking for a better way to handle this without juggling 4 different tools."
              </p>
              <p>
                Today, I'm thrilled to announce that we are officially co-founding <strong>{productName}</strong> — {productTagline}.
              </p>
              <p>
                Rather than building in isolation, we are keeping this initial founding cohort to just <strong>50 members</strong> so we can architect this in close collaboration with you.
              </p>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="font-bold text-slate-900 block text-xs uppercase tracking-wider">
                  As a Founding Member, you get:
                </span>
                <ul className="space-y-1 text-slate-700 text-xs list-disc list-inside">
                  <li>50% Lifetime Price Lock (${foundingPrice}/year forever)</li>
                  <li>Direct Discord access with me & the engineering team</li>
                  <li>1-on-1 private alpha onboarding session</li>
                  <li>100% money-back guarantee if goals aren't reached</li>
                </ul>
              </div>

              <div className="pt-2 text-center sm:text-left">
                <a
                  href={targetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs transition-colors shadow-xs"
                >
                  <span>👉 Claim Founding Pass (${depositPrice} Deposit)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>

              <p className="pt-2 text-slate-500 text-xs">
                Can't wait to build this with you,<br />
                <strong>{creatorName}</strong>
              </p>
            </>
          )}
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────
  // 5. 1-ON-1 DM OUTREACH MOCKUP (X / Instagram Direct Message)
  // ─────────────────────────────────────────────────────────────
  if (type === 'dm') {
    return (
      <div className="w-full max-w-xl mx-auto rounded-2xl bg-black border border-[#2f3336] shadow-xl overflow-hidden text-white font-sans keep-dark product-mockup-display post-visual-mockup">
        {/* DM Chat Header */}
        <div className="px-4 py-3 bg-[#0c0f17] border-b border-[#2f3336] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {creatorAvatar ? (
              <img src={creatorAvatar} alt="" className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-white">
                {creatorName.charAt(0)}
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white">{creatorName}</span>
                <span className="text-[10px] text-slate-400 font-mono">@{creatorHandle}</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Active Now · 1:1 VIP Outreach
              </span>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            Direct Message
          </span>
        </div>

        {/* DM Chat Canvas */}
        <div className="p-4 sm:p-5 space-y-3.5 bg-[#07090e] min-h-[220px] flex flex-col justify-end">
          <div className="text-center text-[10px] text-slate-500 font-mono py-1">
            Today · End-to-end encrypted
          </div>

          {/* Outgoing Message Bubble from Creator */}
          <div className="flex items-start gap-2 max-w-[90%] self-end">
            <div className="p-3.5 rounded-2xl rounded-tr-sm bg-slate-900 border border-slate-700 text-xs text-slate-100 leading-relaxed space-y-2 shadow-md">
              <div className="whitespace-pre-wrap font-sans">
                {copyText || `Hey! Saw your recent comments on our channel and loved your perspective. We're putting together a private founding group of 50 members for ${productName} (${productTagline}). Would love to give you early access + direct input!`}
              </div>
              <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400 font-mono border-t border-slate-800">
                <span>Direct 1:1 invite</span>
                <span className="text-emerald-400">Sent · Delivered ✓</span>
              </div>
            </div>
          </div>
        </div>

        {/* DM Input Bar */}
        <div className="px-4 py-2.5 bg-[#0c0f17] border-t border-[#2f3336] flex items-center justify-between text-xs text-slate-500">
          <span className="text-[11px] text-slate-500 font-mono truncate">
            Press copy on the right to send to high-intent community followers
          </span>
        </div>
      </div>
    )
  }

  // Fallback default
  return null
}
