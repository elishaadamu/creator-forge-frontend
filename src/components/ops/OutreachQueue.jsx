import { useState, useEffect, useCallback } from 'react'
import {
  CheckCircle, XCircle, Edit3, Send, Loader2,
  AlertCircle, RefreshCw, Mail, ChevronDown, ChevronUp, Copy, Check
} from 'lucide-react'
import { getOutreachMessages, approveOutreach, rejectOutreach, sendOutreach, updateOutreachDraft } from '../../services/opsApi'

const STATUS_STYLES = {
  draft:          { bg: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.4)', label: 'Draft' },
  review_pending: { bg: 'rgba(250,204,21,0.12)', color: '#facc15', label: 'Needs Review' },
  approved:       { bg: 'rgba(74,222,128,0.12)', color: '#4ade80', label: 'Approved' },
  queued:         { bg: 'rgba(96,165,250,0.12)', color: '#60a5fa', label: 'Queued' },
  sent:           { bg: 'rgba(74,222,128,0.07)', color: 'rgba(74,222,128,0.6)', label: 'Sent' },
  rejected:       { bg: 'rgba(239,68,68,0.1)',   color: 'rgba(239,68,68,0.7)', label: 'Rejected' },
  failed:         { bg: 'rgba(239,68,68,0.15)',  color: '#f87171', label: 'Failed' },
}

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800) }}
      className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg transition-all"
      style={{ background: copied ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.06)', color: copied ? '#4ade80' : 'rgba(255,255,255,0.4)' }}
    >
      {copied ? <Check size={9} /> : <Copy size={9} />} {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

function MessageCard({ msg, onApprove, onReject, onSend, working }) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [subject, setSubject] = useState(msg.subject || '')
  const [body, setBody] = useState(msg.body || '')
  const s = STATUS_STYLES[msg.status] || STATUS_STYLES.draft

  return (
    <div
      className="rounded-2xl border overflow-hidden transition-all duration-200"
      style={{
        background: '#0e0e0e',
        borderColor: msg.status === 'review_pending' ? 'rgba(250,204,21,0.2)' : 'rgba(255,255,255,0.07)',
      }}
    >
      {/* Card header */}
      <div
        className="flex items-center gap-4 px-5 py-4 cursor-pointer"
        style={{ borderBottom: expanded ? '1px solid rgba(255,255,255,0.06)' : 'none' }}
        onClick={() => setExpanded(v => !v)}
      >
        {/* Creator avatar placeholder */}
        <div
          className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-[12px] font-bold"
          style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)' }}
        >
          {(msg.creator_name || msg.creator_id || '?').charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[13px] font-semibold text-white truncate">
              {msg.creator_name || `Creator ${msg.creator_id?.slice(0, 8)}`}
            </p>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: s.bg, color: s.color }}>
              {s.label}
            </span>
          </div>
          <p className="text-[12px] truncate mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
            {msg.subject || 'No subject'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {msg.status === 'review_pending' && (
            <>
              <button
                onClick={e => { e.stopPropagation(); onApprove(msg.id) }}
                disabled={working === msg.id}
                className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg font-semibold transition-all disabled:opacity-40"
                style={{ background: 'rgba(74,222,128,0.15)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.25)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(74,222,128,0.25)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(74,222,128,0.15)'}
              >
                {working === msg.id ? <Loader2 size={10} className="animate-spin" /> : <CheckCircle size={10} />}
                Approve
              </button>
              <button
                onClick={e => { e.stopPropagation(); onReject(msg.id) }}
                disabled={working === msg.id}
                className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg font-semibold transition-all disabled:opacity-40"
                style={{ background: 'rgba(239,68,68,0.1)', color: 'rgba(239,68,68,0.8)', border: '1px solid rgba(239,68,68,0.2)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.18)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
              >
                <XCircle size={10} /> Reject
              </button>
            </>
          )}
          {msg.status === 'approved' && (
            <button
              onClick={e => { e.stopPropagation(); onSend(msg.id) }}
              disabled={working === msg.id}
              className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg font-semibold transition-all disabled:opacity-40"
              style={{ background: 'rgba(96,165,250,0.15)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.25)' }}
            >
              {working === msg.id ? <Loader2 size={10} className="animate-spin" /> : <Send size={10} />}
              Send Now
            </button>
          )}
          <div style={{ color: 'rgba(255,255,255,0.25)' }}>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>
        </div>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div className="p-5 space-y-4">
          {editing ? (
            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-1">Subject</p>
                <input
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-[13px] text-white outline-none"
                  style={{ background: '#111', border: '1px solid rgba(255,255,255,0.12)' }}
                />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-1">Body</p>
                <textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  rows={10}
                  className="w-full px-3 py-2 rounded-xl text-[12px] text-white outline-none resize-none leading-relaxed"
                  style={{ background: '#111', border: '1px solid rgba(255,255,255,0.12)' }}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditing(false)}
                  className="text-[12px] px-4 py-2 rounded-xl font-semibold text-black"
                  style={{ background: 'white' }}
                >Save</button>
                <button
                  onClick={() => { setSubject(msg.subject || ''); setBody(msg.body || ''); setEditing(false) }}
                  className="text-[12px] px-4 py-2 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)' }}
                >Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-1">Subject</p>
                  <p className="text-[14px] font-semibold text-white">{subject}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <CopyBtn text={`Subject: ${subject}\n\n${body}`} />
                  {['draft', 'review_pending'].includes(msg.status) && (
                    <button
                      onClick={() => setEditing(true)}
                      className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg transition-all"
                      style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}
                      onMouseEnter={e => e.currentTarget.style.color = 'white'}
                      onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
                    >
                      <Edit3 size={9} /> Edit
                    </button>
                  )}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-2">Body</p>
                <pre className="text-[12px] whitespace-pre-wrap leading-[1.75]" style={{ color: 'rgba(255,255,255,0.65)', fontFamily: 'inherit' }}>
                  {body}
                </pre>
              </div>
              <div className="flex items-center gap-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <Mail size={11} style={{ color: 'rgba(255,255,255,0.25)' }} />
                <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  Via {msg.send_method || 'email'} · {msg.created_at ? new Date(msg.created_at).toLocaleDateString() : 'Draft'}
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function ToastNotification({ toast, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500)
    return () => clearTimeout(timer)
  }, [onClose])

  const isSuccess = toast.type === 'success'
  const accent = isSuccess
    ? { rgb: '52,211,153', border: 'rgba(52,211,153,0.15)', bgGlow: 'rgba(52,211,153,0.06)', iconColor: '#34d399' }
    : { rgb: '248,113,113', border: 'rgba(248,113,113,0.15)', bgGlow: 'rgba(248,113,113,0.06)', iconColor: '#f87171' }

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3.5 rounded-2xl border shadow-[0_24px_64px_rgba(0,0,0,0.7)] overflow-hidden"
      style={{
        background: `radial-gradient(circle at 0% 0%, rgba(${accent.rgb}, 0.12) 0%, transparent 60%), rgba(13, 13, 13, 0.85)`,
        borderColor: 'rgba(255,255,255,0.08)',
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.05)`,
        backdropFilter: 'blur(20px) saturate(190%)',
        minWidth: 300,
        maxWidth: 400,
        padding: '12px 14px',
        animation: 'toastSlideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
      }}
    >
      <style>{`
        @keyframes toastSlideIn {
          0% { opacity: 0; transform: translateY(30px) scale(0.92) rotate(0.5deg); filter: blur(5px); }
          100% { opacity: 1; transform: translateY(0) scale(1) rotate(0); filter: blur(0); }
        }
      `}</style>
      
      {/* Top border glow segment */}
      <div
        className="absolute inset-x-0 top-0 h-[1px]"
        style={{
          background: `linear-gradient(90deg, transparent 0%, rgba(${accent.rgb},0.35) 15%, rgba(${accent.rgb},0.08) 50%, transparent 100%)`
        }}
      />

      {/* Icon container */}
      <div
        className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center border"
        style={{
          background: accent.bgGlow,
          borderColor: accent.border,
          boxShadow: `0 4px 12px rgba(${accent.rgb}, 0.05)`
        }}
      >
        {isSuccess
          ? <CheckCircle size={15} style={{ color: accent.iconColor }} />
          : <AlertCircle size={15} style={{ color: accent.iconColor }} />
        }
      </div>

      {/* Text content */}
      <p className="flex-1 text-[12px] font-medium tracking-wide text-white/90 leading-snug">{toast.message}</p>

      {/* Close button */}
      <button
        onClick={onClose}
        className="w-5 h-5 rounded-full flex items-center justify-center transition-all duration-150 flex-shrink-0"
        style={{
          background: 'rgba(255,255,255,0.04)',
          color: 'rgba(255,255,255,0.4)',
          border: '1px solid rgba(255,255,255,0.05)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
          e.currentTarget.style.color = '#fff'
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
          e.currentTarget.style.color = 'rgba(255,255,255,0.4)'
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'
        }}
      >
        ✕
      </button>
    </div>
  )
}

export default function OutreachQueue({ onCountChange }) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [statusFilter, setStatusFilter] = useState('review_pending')
  const [working, setWorking]   = useState(null)
  const [toast, setToast]       = useState(null)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
  }

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = {}
      if (statusFilter) params.status = statusFilter
      const data = await getOutreachMessages(params)
      const list = Array.isArray(data) ? data : (data.messages || data.items || [])
      setMessages(list)
      onCountChange?.(list.filter(m => m.status === 'review_pending').length)
    } catch (e) {
      setError(e.message)
      // Demo data
      const mock = [
        {
          id: 'm1', creator_id: 'c1', creator_name: 'MKBHD', status: 'review_pending', send_method: 'email',
          subject: 'A product idea for your 18M tech audience',
          body: `Hi Marques,\n\nI've been watching your channel for years — the way you explain complex tech simply is genuinely rare.\n\nWe've been building Creator Forge, a platform that turns your audience signals into revenue-ready products. Based on your comment section, we think a "MKBHD Camera Masterclass" would convert exceptionally well — your audience is constantly asking about your exact gear setup and workflow.\n\nWould you be open to a 30-minute call this week to explore this?\n\nBest,\n[Your Name]\n\nP.S. Reply STOP if you'd prefer not to hear from us.`,
          created_at: new Date().toISOString(),
        },
        {
          id: 'm2', creator_id: 'c2', creator_name: 'Ali Abdaal', status: 'draft', send_method: 'email',
          subject: 'Monetize your productivity audience with 1 product',
          body: `Hi Ali,\n\nYour Feel Good Productivity framework resonated deeply — and your audience's hunger for implementation tools is clear from every comment thread.\n\nWe'd love to help you build a "Productivity OS" course + community that your 5M subscribers would actually buy.\n\nWorth a quick chat?\n\nBest,\n[Your Name]\n\nP.S. Reply STOP to opt out.`,
          created_at: new Date(Date.now() - 86400000).toISOString(),
        },
      ]
      const filtered = statusFilter ? mock.filter(m => m.status === statusFilter) : mock
      setMessages(filtered)
      onCountChange?.(filtered.filter(m => m.status === 'review_pending').length)
    }
    setLoading(false)
  }, [statusFilter])

  useEffect(() => { load() }, [load])

  const handleApprove = async (id) => {
    setWorking(id)
    try {
      await approveOutreach(id)
      showToast('Outreach draft approved!', 'success')
    } catch (e) {
      console.warn(e)
      showToast(e.message || 'Failed to approve draft.', 'error')
    }
    setWorking(null)
    load()
  }

  const handleReject = async (id) => {
    setWorking(id)
    try {
      await rejectOutreach(id)
      showToast('Outreach draft rejected.', 'success')
    } catch (e) {
      console.warn(e)
      showToast(e.message || 'Failed to reject draft.', 'error')
    }
    setWorking(null)
    load()
  }

  const handleSend = async (id) => {
    if (!confirm('Send this email now? This cannot be undone.')) return
    setWorking(id)
    try {
      const res = await sendOutreach(id)
      console.log('Outreach send success:', res)
      showToast('Outreach email sent successfully!', 'success')
    } catch (e) {
      console.error('Outreach send failed:', e)
      showToast(e.message || 'Failed to send outreach email.', 'error')
    }
    setWorking(null)
    load()
  }

  const pendingCount = messages.filter(m => m.status === 'review_pending').length

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-[18px] font-bold text-white">Outreach Queue</h2>
          <p className="text-[12px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {pendingCount > 0
              ? `${pendingCount} email${pendingCount !== 1 ? 's' : ''} need your review before sending`
              : 'No emails pending review'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-[12px] outline-none"
            style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}
          >
            <option value="review_pending">Needs Review</option>
            <option value="draft">Drafts</option>
            <option value="approved">Approved</option>
            <option value="sent">Sent</option>
            <option value="">All</option>
          </select>
          <button
            onClick={load}
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)' }}
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Warning banner for pending reviews */}
      {pendingCount > 0 && (
        <div className="mb-4 flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{ background: 'rgba(250,204,21,0.07)', border: '1px solid rgba(250,204,21,0.18)' }}>
          <AlertCircle size={14} style={{ color: '#facc15', flexShrink: 0 }} />
          <p className="text-[12px]" style={{ color: 'rgba(255,220,80,0.9)' }}>
            Review and approve each email before it can be sent. <strong>Emails are never auto-sent.</strong>
          </p>
        </div>
      )}

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl flex items-center gap-2"
          style={{ background: 'rgba(255,180,0,0.08)', border: '1px solid rgba(255,180,0,0.2)' }}>
          <AlertCircle size={13} style={{ color: 'rgba(255,200,50,0.9)' }} />
          <p className="text-[11px]" style={{ color: 'rgba(255,200,50,0.8)' }}>
            Backend offline — showing demo data.
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={20} className="animate-spin" style={{ color: 'rgba(255,255,255,0.3)' }} />
        </div>
      ) : messages.length === 0 ? (
        <div className="text-center py-16">
          <Mail size={28} className="mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.15)' }} />
          <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.3)' }}>No messages in this queue.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map(msg => (
            <MessageCard
              key={msg.id}
              msg={msg}
              onApprove={handleApprove}
              onReject={handleReject}
              onSend={handleSend}
              working={working}
            />
          ))}
        </div>
      )}

      {toast && (
        <ToastNotification
          toast={toast}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
