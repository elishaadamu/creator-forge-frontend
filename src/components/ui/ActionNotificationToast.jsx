import React, { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X, Sparkles } from 'lucide-react'

export default function ActionNotificationToast({ toasts = [], onDismiss }) {
  if (!toasts || toasts.length === 0) return null

  const content = (
    <div className="fixed top-16 sm:top-20 right-4 sm:right-6 z-[99999] flex flex-col gap-2.5 max-w-[340px] w-full pointer-events-none transition-all">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  )

  if (typeof document !== 'undefined') {
    return createPortal(content, document.body)
  }

  return content
}

function ToastItem({ toast, onDismiss }) {
  const { id, type = 'info', title, message, duration = 3500 } = toast
  const [progress, setProgress] = useState(100)
  const onDismissRef = useRef(onDismiss)
  onDismissRef.current = onDismiss

  useEffect(() => {
    const startTime = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100)
      setProgress(remaining)
      if (remaining <= 0) {
        clearInterval(interval)
        onDismissRef.current?.(id)
      }
    }, 50)

    return () => clearInterval(interval)
  }, [id, duration])

  const config = {
    success: {
      border: 'border-emerald-500/40',
      bg: 'bg-slate-900/95',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />,
      barBg: 'bg-emerald-500',
      titleColor: 'text-emerald-400',
    },
    error: {
      border: 'border-rose-500/40',
      bg: 'bg-slate-900/95',
      icon: <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />,
      barBg: 'bg-rose-500',
      titleColor: 'text-rose-400',
    },
    warning: {
      border: 'border-amber-500/40',
      bg: 'bg-slate-900/95',
      icon: <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />,
      barBg: 'bg-amber-500',
      titleColor: 'text-amber-400',
    },
    info: {
      border: 'border-purple-500/40',
      bg: 'bg-slate-900/95',
      icon: <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0" />,
      barBg: 'bg-purple-500',
      titleColor: 'text-purple-400',
    },
  }[type] || {
    border: 'border-slate-700/60',
    bg: 'bg-slate-900/95',
    icon: <Info className="w-4 h-4 text-slate-300 flex-shrink-0" />,
    barBg: 'bg-slate-400',
    titleColor: 'text-white',
  }

  return (
    <div
      className={`pointer-events-auto relative overflow-hidden rounded-2xl border ${config.border} ${config.bg} backdrop-blur-md px-4 py-3 transition-all duration-200 animate-in slide-in-from-top-3 shadow-2xl flex items-start justify-between gap-3 text-slate-100`}
    >
      <div className="flex items-start gap-3 min-w-0">
        <div className="mt-0.5 flex-shrink-0">
          {config.icon}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className={`text-xs font-bold ${config.titleColor} leading-tight`}>
            {title}
          </h4>
          {message && (
            <p className="text-[11px] text-slate-200 mt-1 leading-snug break-words">
              {message}
            </p>
          )}
        </div>
      </div>

      <button
        onClick={() => onDismiss?.(id)}
        className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0 cursor-pointer -mr-1"
        aria-label="Dismiss notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Hairline progress bar pinned to the bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/[0.08] overflow-hidden">
        <div
          className={`h-full ${config.barBg} transition-all duration-75 ease-linear`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
