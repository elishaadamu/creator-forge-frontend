import React, { useState, useEffect, useRef } from 'react'
import {
  Phone, Video, MoreVertical, Paperclip, Smile, Send, Mic,
  Check, CheckCheck, Play, Pause, Clock, Sparkles, Share2,
  ExternalLink, FileText, Volume2, ShieldCheck, Calendar,
  ChevronDown, User, Copy, Plus, X, MessageSquare, Flame,
  Rocket, Star, ArrowRight, CornerDownLeft, RefreshCw, AlertCircle
} from 'lucide-react'
import { getFrontendUrl, getThreads } from '../../services/opsApi'

// Module-level cache so leaving and returning to the Messages tab NEVER flashes a loading spinner
const globalThreadsCache = new Map()

export default function CreatorWhatsAppChat({ project = {}, onUpdateProject }) {
  const creatorName = project?.creatorName || 'Creator Partner'
  const creatorFirstName = creatorName.split(' ')[0]
  const creatorHandle = project?.creatorHandle || '@creator'
  const niche = project?.niche || 'Digital Tech'
  const portalSlug = (project?.creatorHandle || project?.creatorName || 'creator').replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
  const portalToken = project?.portalToken || 'cf_sec_live'
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001'
  const portalUrl = `${origin}/portal/${portalSlug}?token=${portalToken}`
  const preorderUrl = `${origin}/preorder/${project?.productSlug || portalSlug}`

  const creatorKey = project?.creatorId || project?.creatorHandle || 'default_creator'

  const [realSection1Messages, setRealSection1Messages] = useState(() => {
    return globalThreadsCache.get(creatorKey) || []
  })

  // Only show loading spinner on the very first time if no cache or messages exist
  const [isLoadingThreads, setIsLoadingThreads] = useState(() => {
    return !globalThreadsCache.has(creatorKey) && (!project?.messages || project.messages.length === 0)
  })

  const [inputText, setInputText] = useState('')
  const [isTypingCreator, setIsTypingCreator] = useState(false)
  const [showAttachMenu, setShowAttachMenu] = useState(false)
  const [showCallModal, setShowCallModal] = useState(false)
  const [callType, setCallType] = useState('audio') // 'audio' | 'video'
  const [showAddMeetingModal, setShowAddMeetingModal] = useState(false)
  const [newMeetingTitle, setNewMeetingTitle] = useState('')
  const [newMeetingNotes, setNewMeetingNotes] = useState('')
  const messagesEndRef = useRef(null)

  // Load actual Section 1 emails & replies from PostgreSQL (cached instantly)
  useEffect(() => {
    let isMounted = true
    const loadRealThreads = async () => {
      if (!globalThreadsCache.has(creatorKey) && realSection1Messages.length === 0) {
        setIsLoadingThreads(true)
      }
      try {
        const res = await getThreads().catch(() => [])
        const allThreads = Array.isArray(res) ? res : (res?.threads || [])
        
        const cId = project?.creatorId || project?.id
        const cHandle = (project?.creatorHandle || '').toLowerCase().replace(/^@/, '').trim()
        const cEmail = (project?.creatorEmail || project?.email || project?.email_public || '').toLowerCase().trim()
        const cName = (project?.creatorName || '').toLowerCase().trim()

        // Find matching thread for this creator
        const matchingThreads = allThreads.filter(t => {
          if (!t) return false
          if (cId && t.creator_id === cId) return true
          if (cHandle && t.creator_handle && t.creator_handle.toLowerCase().replace(/^@/, '').trim() === cHandle) return true
          if (cEmail && t.creator_email && t.creator_email.toLowerCase().trim() === cEmail) return true
          if (cName && cName.length >= 3 && (t.subject || '').toLowerCase().includes(cName)) return true
          return false
        })

        const collected = []

        matchingThreads.forEach(t => {
          // If thread has an initial outreach email
          if (t.initial_body || t.body) {
            collected.push({
              id: `thread-outreach-${t.id}`,
              sender: 'admin',
              senderName: 'Creator Forge Studio',
              subject: t.subject || 'Partnership Proposal',
              text: t.initial_body || t.body,
              time: t.created_at ? new Date(t.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Section 1',
              status: 'read',
              isSection1: true
            })
          }

          // Inbound and outbound replies in this thread
          const replies = t.replies || []
          replies.forEach(r => {
            const fromAddr = (r.from_address || '').toLowerCase().trim()
            const isFromStudio = fromAddr.includes('creatorforge.com') || fromAddr.includes('partnerships') || fromAddr.includes('studio')
            collected.push({
              id: `reply-${r.id || Math.random()}`,
              sender: isFromStudio ? 'admin' : 'creator',
              senderName: isFromStudio ? 'Creator Forge Studio' : creatorName,
              subject: r.subject || '',
              text: r.body || '',
              time: r.received_at || r.created_at ? new Date(r.received_at || r.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Section 1',
              status: 'read',
              isSection1: true
            })
          })
        })

        if (isMounted) {
          globalThreadsCache.set(creatorKey, collected)
          setRealSection1Messages(collected)
        }
      } catch (err) {
        console.warn('Failed to load Section 1 real threads:', err)
      } finally {
        if (isMounted) setIsLoadingThreads(false)
      }
    }

    loadRealThreads()
    return () => { isMounted = false }
  }, [creatorKey])

  // Custom messages added in Section 2 (if any)
  const customProjectMessages = Array.isArray(project?.messages) ? project.messages : []
  
  // Combine real Section 1 messages + Section 2 custom messages
  const allDisplayMessages = [...realSection1Messages, ...customProjectMessages]

  // Real-time polling for incoming creator messages from Creator Portal
  useEffect(() => {
    let isCancelled = false
    if (!project?.id) return

    const pollMessages = async () => {
      try {
        const { getCoLaunchProject } = await import('../../services/opsApi')
        const fresh = await getCoLaunchProject(project.id)
        if (!isCancelled && fresh && Array.isArray(fresh.messages)) {
          const curCount = Array.isArray(project.messages) ? project.messages.length : 0
          if (fresh.messages.length !== curCount) {
            onUpdateProject?.(prev => ({
              ...(prev || {}),
              messages: fresh.messages
            }))
          }
        }
      } catch (err) {}
    }

    const interval = setInterval(pollMessages, 3000)
    return () => {
      isCancelled = true
      clearInterval(interval)
    }
  }, [project?.id, project?.messages?.length])

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [allDisplayMessages.length, isTypingCreator])

  // Sync message back to project & PostgreSQL
  const syncMessages = (newCustomList) => {
    const updated = {
      ...(project || {}),
      messages: newCustomList
    }
    onUpdateProject?.(prev => ({
      ...(prev || {}),
      messages: newCustomList
    }))
    try {
      localStorage.setItem('forge_launch_active_project', JSON.stringify(updated))
      window.dispatchEvent(new CustomEvent('forge_project_updated', { detail: updated }))
    } catch (e) {}

    if (project?.id) {
      import('../../services/opsApi').then(({ updateCoLaunchProject }) => {
        updateCoLaunchProject(project.id, { messages: newCustomList }).catch(() => {})
      })
    }
  }

  // Handle Send Message
  const handleSendMessage = (textToSend) => {
    const trimmed = (textToSend || inputText).trim()
    if (!trimmed) return

    const newMsg = {
      id: `msg-${Date.now()}`,
      sender: 'admin',
      senderName: 'Creator Forge Studio',
      text: trimmed,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent'
    }

    const updated = [...customProjectMessages, newMsg]
    syncMessages(updated)
    setInputText('')
    setShowAttachMenu(false)
  }

  // Handle saving meeting notes
  const handleSaveMeetingNotes = () => {
    if (!newMeetingNotes.trim()) return
    const meetingItem = {
      id: `meeting-${Date.now()}`,
      title: newMeetingTitle.trim() || `Partnership Sync with ${creatorName}`,
      notes: newMeetingNotes.trim(),
      recordedAt: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
      recordedBy: 'Admin'
    }
    const currentNotes = Array.isArray(project?.meetingNotes) ? project.meetingNotes : []
    const updated = {
      ...(project || {}),
      meetingNotes: [meetingItem, ...currentNotes]
    }
    onUpdateProject?.(prev => ({ ...(prev || {}), ...updated }))
    try {
      localStorage.setItem('forge_launch_active_project', JSON.stringify(updated))
      window.dispatchEvent(new CustomEvent('forge_project_updated', { detail: updated }))
    } catch (e) {}
    setShowAddMeetingModal(false)
    setNewMeetingTitle('')
    setNewMeetingNotes('')
  }

  const meetingNotesList = Array.isArray(project?.meetingNotes) ? project.meetingNotes : []

  return (
    <div className="rounded-2xl bg-[#0b141a] border border-white/[0.1] shadow-2xl overflow-hidden flex flex-col h-[650px] relative font-sans">
      {/* ── 1. WHATSAPP APP BAR HEADER ── */}
      <div className="bg-[#1f2c34] px-4 py-3 border-b border-white/[0.08] flex items-center justify-between text-white z-10 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-emerald-500 p-0.5 shadow-md">
              {project?.creatorAvatar ? (
                <img
                  src={project.creatorAvatar}
                  alt={creatorName}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-[#111b21] flex items-center justify-center font-bold text-sm text-emerald-400">
                  {creatorName.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#1f2c34] rounded-full shadow-xs" title="Online" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-white truncate">{creatorName}</h3>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 shrink-0">
                <ShieldCheck className="w-2.5 h-2.5" />
                <span>Co-Founder</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-1.5 truncate">
              <span className="text-emerald-400 font-medium">Verified Partner</span>
              <span>•</span>
              <span className="text-slate-300">{niche} ({creatorHandle})</span>
            </p>
          </div>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <a
            href={portalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/40 text-purple-200 border border-purple-500/30 text-xs font-bold transition-all cursor-pointer shadow-xs"
            title="Open Co-Founder Portal"
          >
            <Rocket className="w-3.5 h-3.5 text-purple-300" />
            <span>Co-Founder Portal</span>
            <ExternalLink className="w-3 h-3 text-purple-400" />
          </a>
        </div>
      </div>

      {/* ── 2. WHATSAPP CHAT CANVAS ── */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-[#0b141a] bg-[radial-gradient(#1f2c34_1px,transparent_1px)] [background-size:16px_16px]">
        {/* Date / Channel Badge */}
        <div className="flex justify-center">
          <span className="px-3 py-1 rounded-lg bg-[#182229] border border-white/[0.06] text-[10px] font-bold text-slate-400 uppercase tracking-wider shadow-xs">
            Section 1 Acquisition & Direct Dialogue
          </span>
        </div>

        {/* ── RECORDED MEETING NOTES LIST (IF RECORDED) ── */}
        {meetingNotesList.map((m) => (
          <div key={m.id} className="max-w-xl mx-auto rounded-2xl bg-[#111b21] border border-purple-500/40 p-4 space-y-2.5 shadow-xl relative overflow-hidden text-xs">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-purple-400" />
                <span className="font-bold text-white text-xs">{m.title}</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">{m.recordedAt}</span>
            </div>
            <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">{m.notes}</p>
          </div>
        ))}

        {/* ── ACTUAL MESSAGES STREAM ── */}
        {isLoadingThreads ? (
          <div className="py-12 text-center text-slate-400 text-xs space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-400" />
            <p>Syncing communication threads with {creatorName}...</p>
          </div>
        ) : allDisplayMessages.length === 0 ? (
          <div className="py-12 px-6 max-w-md mx-auto text-center space-y-3 rounded-2xl bg-[#111b21] border border-white/[0.06]">
            <MessageSquare className="w-8 h-8 text-slate-500 mx-auto" />
            <h4 className="font-bold text-white text-sm">No Messages Exchanged Yet</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              No email outreach or replies were logged in Section 1 for {creatorName}. You can start a direct conversation or share project links using the composer below.
            </p>
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            {allDisplayMessages.map((msg, idx) => {
              const isOutgoing = msg.sender === 'admin'
              return (
                <div
                  key={msg.id || idx}
                  className={`flex flex-col ${isOutgoing ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[70%] rounded-2xl p-3.5 text-xs shadow-md space-y-1.5 relative ${
                      isOutgoing
                        ? 'bg-[#005c4b] text-slate-100 rounded-tr-xs border border-emerald-500/20'
                        : 'bg-[#202c33] text-slate-200 rounded-tl-xs border border-white/[0.06]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 pb-0.5 text-[11px]">
                      <span className={`font-extrabold ${isOutgoing ? 'text-emerald-300' : 'text-emerald-400'}`}>
                        {isOutgoing ? 'Creator Forge Studio' : (msg.senderName || creatorName)}
                      </span>
                      {msg.isSection1 && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-black/20 text-slate-300 font-mono">
                          Section 1 Outreach
                        </span>
                      )}
                    </div>

                    {msg.subject && (
                      <div className="font-bold text-white border-b border-white/[0.08] pb-1 text-[11px]">
                        {msg.subject}
                      </div>
                    )}

                    <p className="whitespace-pre-wrap leading-relaxed select-text font-sans text-xs">
                      {msg.text}
                    </p>

                    <div className={`flex items-center justify-end gap-1 text-[10px] ${
                      isOutgoing ? 'text-emerald-200/70' : 'text-slate-400'
                    }`}>
                      <span>{msg.time}</span>
                      {isOutgoing && (
                        <span title="Delivered & Read">
                          <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── 3. QUICK SUGGESTIONS STRIP ── */}
      <div className="bg-[#111b21] px-3 py-2 border-t border-white/[0.06] flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-1">
          Quick Message:
        </span>
        {[
          `Hi ${creatorFirstName}, here is our live Pre-Order link: ${preorderUrl}`,
          `Your Co-Founder portal is active: ${portalUrl}`,
          `Phase 2 MVP specs are ready for your review!`,
          `Can we do a quick 10-min launch sync call this week?`
        ].map((quickText, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSendMessage(quickText)}
            className="px-2.5 py-1 rounded-lg bg-[#202c33] hover:bg-[#2a3942] text-slate-300 hover:text-white text-[11px] font-medium border border-white/[0.06] whitespace-nowrap transition-all active:scale-95 shrink-0 cursor-pointer"
          >
            {quickText}
          </button>
        ))}
      </div>

      {/* ── 4. CHAT COMPOSER BAR ── */}
      <div className="bg-[#202c33] p-3 border-t border-white/[0.08] flex items-center gap-2 relative z-10 shrink-0">
        {/* Attachment Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowAttachMenu(!showAttachMenu)}
            className="p-2.5 rounded-full text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            title="Attach Link or Document"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {showAttachMenu && (
            <div className="absolute bottom-12 left-0 w-64 rounded-2xl bg-[#1f2c34] border border-white/[0.1] p-2 shadow-2xl space-y-1 text-xs animate-in fade-in z-30">
              <button
                type="button"
                onClick={() => {
                  handleSendMessage(`Here is our live Pre-Order link for your community: ${preorderUrl}`)
                }}
                className="w-full p-2 rounded-xl hover:bg-white/[0.06] text-left flex items-center gap-2.5 text-slate-200 cursor-pointer"
              >
                <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold block text-white">Share Pre-Order URL</span>
                  <span className="text-[10px] text-slate-400">Insert public landing page link</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleSendMessage(`Your private Co-Founder portal is ready: ${portalUrl}`)
                }}
                className="w-full p-2 rounded-xl hover:bg-white/[0.06] text-left flex items-center gap-2.5 text-slate-200 cursor-pointer"
              >
                <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
                  <Rocket className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold block text-white">Share Co-Founder Portal</span>
                  <span className="text-[10px] text-slate-400">Insert private token access link</span>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Text Input */}
        <div className="flex-1 relative">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage()
              }
            }}
            placeholder={`Type a message to ${creatorFirstName}...`}
            className="w-full bg-[#2a3942] text-white placeholder-slate-400 text-xs rounded-xl px-4 py-2.5 border border-transparent focus:border-emerald-500/50 focus:outline-none transition-colors"
          />
        </div>

        {/* Send Button */}
        <button
          type="button"
          onClick={() => handleSendMessage()}
          disabled={!inputText.trim()}
          className="w-10 h-10 rounded-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-950/40 transition-transform active:scale-95 cursor-pointer"
          title="Send Message"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      {/* ── 5. ADD MEETING NOTES MODAL ── */}
      {showAddMeetingModal && (
        <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="max-w-md w-full rounded-2xl bg-[#0e1117] border border-white/[0.1] p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <h4 className="font-bold text-white text-sm">Log Meeting Notes with {creatorFirstName}</h4>
              </div>
              <button
                onClick={() => setShowAddMeetingModal(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Meeting Title / Purpose
                </label>
                <input
                  type="text"
                  value={newMeetingTitle}
                  onChange={(e) => setNewMeetingTitle(e.target.value)}
                  placeholder={`e.g. Discovery & Concept Alignment Call with ${creatorFirstName}`}
                  className="w-full bg-[#141720] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Meeting Notes & Agreed Takeaways
                </label>
                <textarea
                  rows={5}
                  value={newMeetingNotes}
                  onChange={(e) => setNewMeetingNotes(e.target.value)}
                  placeholder="Record key decisions, agreed revenue split, launch commitments, or quotes from the call..."
                  className="w-full bg-[#141720] border border-white/[0.08] rounded-xl p-3.5 text-xs text-white focus:outline-none focus:border-emerald-500/50 resize-none leading-relaxed"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.06]">
              <button
                onClick={() => setShowAddMeetingModal(false)}
                className="px-3.5 py-1.5 rounded-xl bg-white/[0.04] text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMeetingNotes}
                disabled={!newMeetingNotes.trim()}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold shadow-md"
              >
                Save Notes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 6. SIMULATED CALL MODAL ── */}
      {showCallModal && (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-between p-8 text-white animate-in fade-in">
          <div className="text-center space-y-2 pt-8">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest block">
              {callType === 'video' ? 'Creator Forge Video Meeting' : 'WhatsApp Audio Call'}
            </span>
            <h3 className="text-xl font-black">{creatorName}</h3>
            <p className="text-xs text-slate-400 font-mono">{creatorHandle} • {niche}</p>
          </div>

          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-purple-600 to-emerald-500 p-1 animate-pulse">
              <div className="w-full h-full rounded-full bg-[#111b21] flex items-center justify-center font-bold text-2xl text-emerald-400">
                {creatorName.slice(0, 2).toUpperCase()}
              </div>
            </div>
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono">
              Connecting...
            </span>
          </div>

          <div className="space-y-4 pb-4">
            <button
              onClick={() => setShowCallModal(false)}
              className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-950/50 transition-transform active:scale-95 cursor-pointer mx-auto"
              title="End Call"
            >
              <Phone className="w-6 h-6 rotate-[135deg]" />
            </button>
            <span className="text-[11px] text-slate-400 block text-center">Click to dismiss call overlay</span>
          </div>
        </div>
      )}
    </div>
  )
}
