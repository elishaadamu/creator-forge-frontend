import { useState, useEffect, useCallback } from 'react'
import {
  MessageSquare, RefreshCw, Loader2, AlertCircle,
  CheckCircle, XCircle, Clock, TrendingUp, ChevronRight
} from 'lucide-react'
import { getThreads } from '../../services/opsApi'

const CLASSIFICATION_STYLES = {
  interested:    { bg: 'rgba(74,222,128,0.12)',  color: '#4ade80',  label: '🔥 Interested' },
  not_interested:{ bg: 'rgba(239,68,68,0.1)',    color: 'rgba(239,68,68,0.8)', label: '✕ Not Interested' },
  more_info:     { bg: 'rgba(96,165,250,0.12)',  color: '#60a5fa',  label: '❓ Wants More Info' },
  out_of_office: { bg: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.4)', label: '🌴 OOO' },
  bounced:       { bg: 'rgba(239,68,68,0.08)',   color: 'rgba(239,68,68,0.6)', label: '⚠ Bounced' },
  other:         { bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)', label: 'Other' },
}

const THREAD_STATUS_STYLES = {
  open:      { color: 'rgba(255,255,255,0.4)',   label: 'Open' },
  replied:   { color: '#4ade80',                 label: 'Replied' },
  closed:    { color: 'rgba(255,255,255,0.25)',   label: 'Closed' },
  converted: { color: '#facc15',                 label: '🎉 Converted' },
  lost:      { color: 'rgba(239,68,68,0.6)',      label: 'Lost' },
}

function timeSince(iso) {
  if (!iso) return '—'
  // Backend returns naive UTC datetimes, we must append 'Z' to treat as UTC correctly
  const parsedIso = iso.endsWith('Z') ? iso : iso + 'Z'
  const diff = Date.now() - new Date(parsedIso).getTime()
  const days = Math.floor(diff / 86400000)
  const hrs  = Math.floor(diff / 3600000)
  const mins = Math.floor(diff / 60000)
  
  if (diff < 60000) return 'just now'
  if (days > 0) return `${days}d ago`
  if (hrs > 0)  return `${hrs}h ago`
  return `${mins}m ago`
}

function ThreadCard({ thread, onClick }) {
  const status = THREAD_STATUS_STYLES[thread.status] || THREAD_STATUS_STYLES.open
  const lastReply = thread.replies?.[0]
  const clf = lastReply ? (CLASSIFICATION_STYLES[lastReply.classification] || CLASSIFICATION_STYLES.other) : null

  return (
    <button
      onClick={onClick}
      className="w-full text-left px-5 py-4 border-b flex items-center gap-4 transition-colors group"
      style={{ borderColor: 'rgba(255,255,255,0.05)' }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {/* Avatar */}
      <div
        className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-[12px] font-bold"
        style={{ background: 'rgba(255,255,255,0.07)' }}
      >
        {(thread.creator_name || thread.creator_id || '?').charAt(0).toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-[13px] font-semibold text-white truncate">
            {thread.creator_name || `Creator ${thread.creator_id?.slice(0, 8)}`}
          </p>
          {clf && (
            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0"
              style={{ background: clf.bg, color: clf.color }}>
              {clf.label}
            </span>
          )}
        </div>
        {lastReply ? (
          <p className="text-[11px] truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {lastReply.ai_summary || lastReply.body?.slice(0, 80) || 'Reply received'}
          </p>
        ) : (
          <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
            Awaiting reply · sent {timeSince(thread.created_at)}
          </p>
        )}
      </div>

      {/* Meta */}
      <div className="flex-shrink-0 text-right">
        <p className="text-[10px]" style={{ color: status.color }}>{status.label}</p>
        <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>
          {timeSince(thread.last_activity)}
        </p>
      </div>

      <ChevronRight size={13} style={{ color: 'rgba(255,255,255,0.2)', flexShrink: 0 }} className="group-hover:text-white/40 transition-colors" />
    </button>
  )
}

function ThreadDetail({ thread, onClose, onReload }) {
  const [replyBody, setReplyBody] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [sendError, setSendError] = useState('')

  const handleSend = async () => {
    if (!replyBody.trim()) return
    setIsSending(true)
    setSendError('')
    try {
      // Need to import sendThreadReply at the top of the file! 
      // We will add it to the import statement.
      const { sendThreadReply } = await import('../../services/opsApi')
      await sendThreadReply(thread.id, replyBody)
      setReplyBody('')
      onReload?.()
    } catch (e) {
      setSendError(e.message)
    } finally {
      setIsSending(false)
    }
  }

  const lastReply = thread.replies?.[thread.replies.length - 1]
  const clf = lastReply ? (CLASSIFICATION_STYLES[lastReply.classification] || CLASSIFICATION_STYLES.other) : null

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
        style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <div>
          <p className="text-[14px] font-semibold text-white">
            {thread.creator_name || `Creator ${thread.creator_id?.slice(0, 8)}`}
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Thread · {(thread.replies?.length || 0)} reply
          </p>
        </div>
        <button onClick={onClose} className="text-white/30 hover:text-white/60 transition-colors text-[16px]">✕</button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* Original outreach */}
        {thread.original_subject && (
          <div className="rounded-2xl p-4" style={{ background: '#111', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-2">Your Outreach</p>
            <p className="text-[13px] font-semibold text-white mb-2">{thread.original_subject}</p>
            <pre className="text-[12px] whitespace-pre-wrap leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'inherit' }}>
              {thread.original_body || '(body not available)'}
            </pre>
            <p className="text-[10px] mt-3" style={{ color: 'rgba(255,255,255,0.2)' }}>
              Sent {timeSince(thread.created_at)}
            </p>
          </div>
        )}

        {/* Replies */}
        {thread.replies?.map((reply, i) => (
          <div key={i}>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
              <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                Creator replied {timeSince(reply.received_at)}
              </span>
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
            </div>
            <div className="rounded-2xl p-4" style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.1)' }}>
              {clf && i === thread.replies.length - 1 && (
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: clf.bg, color: clf.color }}>
                    {clf.label}
                  </span>
                  {reply.ai_summary && (
                    <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{reply.ai_summary}</span>
                  )}
                </div>
              )}
              <pre className="text-[12px] whitespace-pre-wrap leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'inherit' }}>
                {reply.body || '(empty reply)'}
              </pre>
            </div>
          </div>
        ))}

        {(!thread.replies || thread.replies.length === 0) && (
          <div className="text-center py-8">
            <Clock size={20} className="mx-auto mb-2" style={{ color: 'rgba(255,255,255,0.2)' }} />
            <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.3)' }}>Awaiting reply…</p>
          </div>
        )}
      </div>

      {/* Reply Box */}
      <div className="p-4 border-t flex-shrink-0" style={{ borderColor: 'rgba(255,255,255,0.07)', background: '#0a0a0a' }}>
        {sendError && (
          <p className="text-[11px] text-red-400 mb-2">{sendError}</p>
        )}
        <textarea
          value={replyBody}
          onChange={e => setReplyBody(e.target.value)}
          placeholder="Type your reply..."
          className="w-full bg-transparent border rounded-xl p-3 text-[13px] text-white placeholder-white/30 outline-none focus:border-white/20 transition-colors resize-none"
          style={{ borderColor: 'rgba(255,255,255,0.1)', minHeight: '80px' }}
        />
        <div className="flex justify-end mt-2">
          <button
            onClick={handleSend}
            disabled={!replyBody.trim() || isSending}
            className="px-4 py-1.5 rounded-lg text-[12px] font-semibold flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: '#fff', color: '#000' }}
          >
            {isSending ? <Loader2 size={14} className="animate-spin" /> : null}
            Send Reply
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ReplyInbox({ onCountChange }) {
  const [threads, setThreads]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [selected, setSelected]   = useState(null)
  const [filter, setFilter]       = useState('all')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getThreads()
      const list = Array.isArray(data) ? data : (data.threads || data.items || [])
      setThreads(list)
      const newReplies = list.filter(t => t.status === 'replied').length
      onCountChange?.(newReplies)
    } catch (e) {
      setError(e.message)
      const mock = [
        {
          id: 't1', creator_name: 'MKBHD', creator_id: 'c1', status: 'replied',
          last_activity: new Date(Date.now() - 3600000).toISOString(),
          created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
          original_subject: 'A product idea for your 18M tech audience',
          original_body: 'Hi Marques,\n\nI came across your channel and was blown away...',
          replies: [{
            id: 'r1', classification: 'interested',
            ai_summary: 'Interested in chatting, asked to schedule a call for next Tuesday.',
            body: 'Hey, this is interesting timing — been thinking about something like this.\n\nCan we do a call next Tuesday after 2pm EST?\n\nM.',
            received_at: new Date(Date.now() - 3600000).toISOString(),
          }]
        },
        {
          id: 't2', creator_name: 'Ali Abdaal', creator_id: 'c2', status: 'open',
          last_activity: new Date(Date.now() - 86400000 * 3).toISOString(),
          created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
          original_subject: 'Monetize your productivity audience',
          replies: []
        },
      ]
      const filtered = filter === 'all' ? mock : mock.filter(t => t.status === filter)
      setThreads(filtered)
      onCountChange?.(mock.filter(t => t.status === 'replied').length)
    }
    setLoading(false)
  }, [filter])

  useEffect(() => { load() }, [load])

  const filtered = filter === 'all' ? threads : threads.filter(t => t.status === filter)
  const selectedThread = selected ? threads.find(t => t.id === selected) : null

  return (
    <div className="flex h-full">
      {/* Thread list */}
      <div className="flex flex-col border-r" style={{ width: selectedThread ? '40%' : '100%', borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div>
            <h2 className="text-[16px] font-bold text-white">Reply Inbox</h2>
            <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {threads.filter(t => t.status === 'replied').length} new replies
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="px-2 py-1.5 rounded-lg text-[11px] outline-none"
              style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}
            >
              <option value="all">All threads</option>
              <option value="replied">Replied</option>
              <option value="open">Open</option>
              <option value="converted">Converted</option>
              <option value="closed">Closed</option>
            </select>
            <button onClick={load} className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)' }}>
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {error && (
          <div className="mx-4 mt-3 px-3 py-2 rounded-xl flex items-center gap-2"
            style={{ background: 'rgba(255,180,0,0.07)', border: '1px solid rgba(255,180,0,0.15)' }}>
            <AlertCircle size={11} style={{ color: 'rgba(255,200,50,0.9)' }} />
            <p className="text-[10px]" style={{ color: 'rgba(255,200,50,0.8)' }}>Demo mode — backend offline.</p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={18} className="animate-spin" style={{ color: 'rgba(255,255,255,0.3)' }} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <MessageSquare size={24} className="mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.15)' }} />
              <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.3)' }}>No threads yet.</p>
            </div>
          ) : (
            filtered.map(thread => (
              <ThreadCard
                key={thread.id}
                thread={thread}
                onClick={() => setSelected(selected === thread.id ? null : thread.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* Thread detail panel */}
      {selectedThread && (
        <div className="flex-1 overflow-hidden">
          <ThreadDetail thread={selectedThread} onClose={() => setSelected(null)} onReload={load} />
        </div>
      )}
    </div>
  )
}
