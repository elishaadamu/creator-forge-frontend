import React, { useEffect, useState, useRef } from 'react'
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X, Sparkles } from 'lucide-react'

export default function ActionNotificationToast({ toasts = [], onDismiss }) {
  if (!toasts || toasts.length === 0) return null

  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2 max-w-[320px] w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  )
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
      border: 'border-emerald-500/30',
      bg: 'bg-[#0e1612]',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />,
      barBg: 'bg-emerald-500',
      titleColor: 'text-emerald-300',
    },
    error: {
      border: 'border-rose-500/30',
      bg: 'bg-[#180f12]',
      icon: <AlertCircle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />,
      barBg: 'bg-rose-500',
      titleColor: 'text-rose-300',
    },
    warning: {
      border: 'border-amber-500/30',
      bg: 'bg-[#18140d]',
      icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />,
      barBg: 'bg-amber-500',
      titleColor: 'text-amber-300',
    },
    info: {
      border: 'border-purple-500/30',
      bg: 'bg-[#13101c]',
      icon: <Sparkles className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />,
      barBg: 'bg-purple-500',
      titleColor: 'text-purple-300',
    },
  }[type] || {
    border: 'border-white/[0.1]',
    bg: 'bg-[#10121a]',
    icon: <Info className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />,
    barBg: 'bg-slate-500',
    titleColor: 'text-white',
  }

  return (
    <div
      className={`pointer-events-auto relative overflow-hidden rounded-xl border ${config.border} ${config.bg} backdrop-blur-md px-3.5 py-2.5 transition-all duration-200 animate-in slide-in-from-top-2 shadow-lg flex items-start justify-between gap-2.5`}
    >
      <div className="flex items-start gap-2.5 min-w-0">
        <div className="mt-0.5 flex-shrink-0">
          {config.icon}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className={`text-[12px] font-bold ${config.titleColor} leading-tight`}>
            {title}
          </h4>
          {message && (
            <p className="text-[11px] text-slate-300 mt-0.5 leading-snug break-words">
              {message}
            </p>
          )}
        </div>
      </div>

      <button
        onClick={() => onDismiss?.(id)}
        className="text-slate-400 hover:text-white p-0.5 rounded transition-colors flex-shrink-0 cursor-pointer -mr-0.5"
      >
        <X className="w-3 h-3" />
      </button>

      {/* Hairline progress bar pinned to the bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/[0.06] overflow-hidden">
        <div
          className={`h-full ${config.barBg} transition-all duration-75 ease-linear`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
