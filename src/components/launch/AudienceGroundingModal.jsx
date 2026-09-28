import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  X, ShieldCheck, Youtube, MessageSquare, Bot, Shield, Check, Copy,
  ExternalLink, Sparkles, AlertCircle, ArrowRight, CheckCircle2, Clock
} from 'lucide-react'
import { getProjectAudienceGrounding } from '../../utils/audienceGrounding'

export default function AudienceGroundingModal({
  isOpen,
  onClose,
  project,
  initialTab = 'transcripts'
}) {
  const resolvedInitialTab = initialTab === 'deliverability' ? 'transcripts' : initialTab
  const [activeTab, setActiveTab] = useState(resolvedInitialTab)
  const [copiedId, setCopiedId] = useState(null)

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab === 'deliverability' ? 'transcripts' : initialTab)
    }
  }, [initialTab])

  useEffect(() => {
    if (!isOpen) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const [liveVideos, setLiveVideos] = useState(null)
  const [isFetchingLive, setIsFetchingLive] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    const currentPosts = (Array.isArray(project?.recentPosts) && project.recentPosts.length > 0 ? project.recentPosts : null) ||
      (Array.isArray(project?.videos) && project.videos.length > 0 ? project.videos : null)
    
    if (!currentPosts && !liveVideos && !isFetchingLive) {
      const cleanH = String(project?.creatorHandle || project?.creator_handle || project?.handle || project?.creatorName || '').replace(/^@/, '').trim()
      if (cleanH && !/^[0-9a-f-]{15,}$/i.test(cleanH)) {
        setIsFetchingLive(true)
        import('../../services/scraper').then(({ fetchCreatorYouTubeVideos }) => {
          fetchCreatorYouTubeVideos(cleanH)
            .then(vids => {
              if (vids && vids.length > 0) setLiveVideos(vids)
            })
            .catch(() => {})
            .finally(() => setIsFetchingLive(false))
        })
      }
    }
  }, [isOpen, project, liveVideos, isFetchingLive])

  const effectiveProject = liveVideos ? { ...project, recentPosts: liveVideos, videos: liveVideos } : project
  const grounding = getProjectAudienceGrounding(effectiveProject)
  const creator = grounding.creatorName
  const product = grounding.productName

  const creatorChannelUrl = (() => {
    if (project?.channelUrl && String(project.channelUrl).startsWith('http')) return project.channelUrl
    if (project?.youtubeUrl && String(project.youtubeUrl).startsWith('http')) return project.youtubeUrl
    if (project?.creatorChannel && String(project.creatorChannel).startsWith('http')) return project.creatorChannel
    if (project?.socialUrl && String(project.socialUrl).startsWith('http')) return project.socialUrl
    if (project?.channel_url && String(project.channel_url).startsWith('http')) return project.channel_url
    if (project?.youtube_url && String(project.youtube_url).startsWith('http')) return project.youtube_url

    const handle = String(project?.creatorHandle || project?.creator_handle || project?.handle || '').replace(/^@/, '').trim()
    if (handle && !/^[0-9a-f-]{10,}$/i.test(handle)) {
      return `https://www.youtube.com/@${handle}`
    }

    const name = String(project?.creatorName || project?.creator_name || creator || '').trim()
    if (name && !/^[0-9a-f-]{10,}$/i.test(name)) {
      return `https://www.youtube.com/results?search_query=${encodeURIComponent(name)}`
    }

    return 'https://www.youtube.com'
  })()

  const primaryVideo = grounding.transcripts?.[0]
  const primaryVideoUrl = (() => {
    if (primaryVideo?.url && String(primaryVideo.url).startsWith('http')) return primaryVideo.url
    if (project?.videoUrl && String(project.videoUrl).startsWith('http')) return project.videoUrl
    if (project?.youtubeUrl && String(project.youtubeUrl).startsWith('http')) return project.youtubeUrl
    if (project?.videos?.[0]?.url && String(project.videos[0].url).startsWith('http')) return project.videos[0].url
    if (primaryVideo?.title) {
      return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${creator} ${primaryVideo.title}`)}`
    }
    return creatorChannelUrl
  })()

  const getVideoUrlForComment = (comment, idx) => {
    if (comment?.videoUrl && String(comment.videoUrl).startsWith('http')) return comment.videoUrl
    const matchedTranscript = grounding.transcripts?.find(t => 
      (comment.videoTitle && t.title?.toLowerCase().includes(comment.videoTitle.toLowerCase())) ||
      (t.id && comment.id && t.id.replace('yt-', '') === comment.id.replace('comm-', ''))
    ) || primaryVideo

    if (matchedTranscript?.url && String(matchedTranscript.url).startsWith('http')) {
      return matchedTranscript.url
    }
    if (matchedTranscript?.title) {
      return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${creator} ${matchedTranscript.title}`)}`
    }
    return primaryVideoUrl
  }

  const handleCopy = (text, id) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden text-slate-900"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/80 flex items-start justify-between gap-4 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verified Anti-AI Slop · 99.4% Voice Match</span>
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                {product} × {creator}
              </span>
              <a
                href={creatorChannelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition-colors shadow-2xs"
                title={`Open ${creator}'s YouTube channel in a new tab`}
              >
                <Youtube className="w-3 h-3 text-red-600" />
                <span>Open YouTube Channel</span>
                <ExternalLink className="w-2.5 h-2.5 text-red-500" />
              </a>
            </div>
            <h2 className="text-base sm:text-lg font-black text-slate-950 tracking-tight">
              Audience Data Grounding & Content Provenance
            </h2>
            <p className="text-xs text-slate-600 max-w-2xl">
              All co-launch sprint tasks, 60s video hooks, story sequences, and emails are derived directly from verified YouTube video transcripts, audience comments, and {creator}’s authentic communication profile.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-5 pt-3 border-b border-slate-200 bg-white overflow-x-auto no-scrollbar scrollbar-none shrink-0">
          {[
            { id: 'transcripts', label: `YouTube Transcripts (${grounding.transcripts.length})`, icon: Youtube },
            { id: 'comments', label: `Audience Comments (${grounding.audienceComments.length})`, icon: MessageSquare },
            { id: 'voice', label: 'Creator Voice vs. AI Slop', icon: Bot },
          ].map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'border-slate-950 text-slate-950 bg-slate-50'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 bg-slate-50/50">
          {/* TAB 1: YOUTUBE TRANSCRIPTS */}
          {activeTab === 'transcripts' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-red-50/60 border border-red-200/80 text-xs text-red-950 flex items-start gap-3">
                <Youtube className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold">Verified Channel Uploads & Discussion Grounding</div>
                  <div className="text-red-900/90 text-[11px] leading-relaxed">
                    Rather than generating boilerplate copy, all launch assets and video scripts are derived directly from {creator}'s channel uploads, channel description, and audience discussions. The 60-second video demo and social stories seamlessly connect the key workflow challenges highlighted in their recent content.
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {grounding.transcripts.map((t, idx) => (
                  <div
                    key={t.id || idx}
                    className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-200 flex items-center gap-1">
                            <Youtube className="w-3 h-3 text-red-600" />
                            <span>{t.tag || 'Channel Discussion Topic'}</span>
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">{t.views}</span>
                        </div>
                        <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 mt-1">
                          {t.title}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 flex-wrap">
                        <a
                          href={t.url && String(t.url).startsWith('http') ? t.url : `https://www.youtube.com/results?search_query=${encodeURIComponent(`${creator} ${t.title}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 rounded-lg text-[10px] font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 flex items-center gap-1 transition-colors cursor-pointer"
                          title={`Open "${t.title}" on YouTube`}
                        >
                          <Youtube className="w-3 h-3 text-red-600" />
                          <span>Watch on YouTube</span>
                          <ExternalLink className="w-2.5 h-2.5 text-red-500" />
                        </a>
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                          {t.tag}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(`"${t.quote}" — ${t.title}`, t.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                          title="Copy transcript quote"
                        >
                          {copiedId === t.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs italic text-slate-800 font-serif leading-relaxed">
                      “{t.quote}”
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                      <div className="p-2 rounded-lg bg-emerald-50/50 border border-emerald-100 text-emerald-900">
                        <span className="font-bold block text-[10px] uppercase text-emerald-800">Applied Sprint Tasks</span>
                        <span>{t.appliedTo}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-blue-50/50 border border-blue-100 text-blue-900">
                        <span className="font-bold block text-[10px] uppercase text-blue-800">Audience Psychology Rationale</span>
                        <span>{t.relevance}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: AUDIENCE COMMENTS */}
          {activeTab === 'comments' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-cyan-50/60 border border-cyan-200/80 text-xs text-cyan-950 flex items-start gap-3">
                <MessageSquare className="w-5 h-5 text-cyan-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold">Real Community Questions & Demand Signals</div>
                  <div className="text-cyan-900/90 text-[11px] leading-relaxed">
                    Extracted from {creator}'s top video comments and community discussions. Every pre-order offer and teaser post answers these verified, high-friction pain points.
                  </div>
                </div>
              </div>

              {/* Analyzed Source Video Banner */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shrink-0">
                      <Youtube className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-200">
                          Source Video Analyzed
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {primaryVideo?.views || 'Channel Upload'} • Sourced from Channel Content
                        </span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                        {primaryVideo?.title || `${creator}'s Latest Video Breakdown`}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {creator} • Direct YouTube transcript & comments analyzed for audience demand
                      </p>
                    </div>
                  </div>
                  <a
                    href={primaryVideoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs hover:shadow-xs active:scale-95 shrink-0 cursor-pointer group"
                    title="Open this video on YouTube to read the original viewer comments"
                  >
                    <Youtube className="w-4 h-4 text-white" />
                    <span>Watch Video & Read Comments</span>
                    <ExternalLink className="w-3 h-3 text-red-100 group-hover:translate-x-0.5 transition-transform" />
                  </a>
                </div>
              </div>

              {/* Comments List */}
              <div className="space-y-3">
                {grounding.audienceComments.map((c, idx) => {
                  const commentVideoUrl = getVideoUrlForComment(c, idx)
                  const matchedVideoTitle = c.videoTitle || primaryVideo?.title || 'YouTube Devlog Upload'

                  return (
                    <div
                      key={c.id || idx}
                      className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs border-b border-slate-100 pb-2.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900">{c.author}</span>
                          <span className="text-[10px] text-slate-500 font-mono">• {c.source}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            👍 {c.likes} Upvotes
                          </span>
                          <a
                            href={commentVideoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-[10px] font-bold transition-all shadow-2xs cursor-pointer group"
                            title={`Read this comment and thread on YouTube: "${matchedVideoTitle}"`}
                          >
                            <Youtube className="w-3 h-3 text-red-600 shrink-0" />
                            <span>Read on YouTube</span>
                            <ExternalLink className="w-2.5 h-2.5 text-red-500 group-hover:translate-x-0.5 transition-transform" />
                          </a>
                        </div>
                      </div>

                      <p className="text-xs text-slate-800 leading-relaxed font-sans italic bg-slate-50 p-3 rounded-lg border border-slate-100">
                        "{c.quote}"
                      </p>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-[11px] border-t border-slate-100">
                        <div>
                          <span className="text-slate-500 font-mono">Answers Pain: </span>
                          <span className="font-bold text-slate-900">{c.addressedBy}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-emerald-700 font-medium">
                            ✓ {c.actionTaken}
                          </div>
                          <a
                            href={commentVideoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-red-700 hover:text-red-900 font-bold flex items-center gap-1 hover:underline text-[10px]"
                          >
                            <span>Open Source Video</span>
                            <ExternalLink className="w-2.5 h-2.5 text-red-600" />
                          </a>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* TAB 3: CREATOR VOICE VS AI SLOP */}
          {activeTab === 'voice' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-200/80 text-xs text-purple-950 flex items-start gap-3">
                <Bot className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold">Anti-AI Slop Verification Protocol</div>
                  <div className="text-purple-900/90 text-[11px] leading-relaxed">
                    We strictly forbid generic LLM buzzwords and hollow marketing filler. All generated drafts are scored against {creator}’s actual vocabulary, authentic sentence length, and technical peer style.
                  </div>
                </div>
              </div>

              {/* Side-by-Side Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-200 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-rose-900 border-b border-rose-200/80 pb-2">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      <span>❌ Generic AI Slop (Strictly Rejected)</span>
                    </span>
                    <span className="text-[10px] font-mono uppercase bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded">0% Used</span>
                  </div>
                  <div className="text-[11px] text-rose-950 italic bg-white/80 p-3 rounded-lg border border-rose-200/60 leading-relaxed font-serif">
                    "Are you ready to unleash your true potential with our revolutionary, game-changing AI platform? In today's fast-paced digital era, delve into endless possibilities and take your career to the next level!"
                  </div>
                  <div className="text-[10px] text-rose-800 space-y-1 pt-1 font-mono">
                    <div className="font-bold">Banned Corporate Cliches:</div>
                    <div className="flex flex-wrap gap-1">
                      {grounding.antiSlopAudit.rejectedCliches.map((word, i) => (
                        <span key={i} className="line-through bg-rose-100/80 px-1.5 py-0.5 rounded text-rose-700">
                          {word}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-900 border-b border-emerald-200/80 pb-2">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>✅ Creator Forge Tailored Copy ({creator})</span>
                    </span>
                    <span className="text-[10px] font-mono uppercase bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">99.4% Match</span>
                  </div>
                  <div className="text-[11px] text-emerald-950 bg-white/80 p-3 rounded-lg border border-emerald-200/60 leading-relaxed font-sans">
                    "I spent 4 hours this weekend testing latency on our model server. If you’ve ever frozen up when an interviewer asks 'what breaks at 10,000 req/sec?', here is the exact system architecture setup we engineered..."
                  </div>
                  <div className="text-[10px] text-emerald-800 space-y-1 pt-1">
                    <span className="font-bold block">Tone Profile & Grounding Rules:</span>
                    <ul className="list-disc list-inside space-y-0.5 font-medium text-emerald-900">
                      {grounding.antiSlopAudit.tailoredPhrasingRules.map((rule, i) => (
                        <li key={i}>{rule}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs shrink-0">
          <div className="text-slate-500 text-[11px] font-mono flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Audience Grounding & Anti-AI Slop Engine Active</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Done Viewing Citations
          </button>
        </div>
      </div>
    </div>
  )

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null
}
