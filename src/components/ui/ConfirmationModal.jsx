import React from 'react'
import { AlertTriangle, Trash2, X } from 'lucide-react'

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = true,
  isLoading = false,
  stats = [],
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-[#0e1117] border border-white/[0.1] rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
                isDestructive
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  : 'bg-purple-500/10 border-purple-500/30 text-purple-400'
              }`}
            >
              {isDestructive ? <Trash2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white tracking-tight">{title}</h3>
              <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-rose-400">
                Permanent Action
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message body */}
        <p className="text-xs text-slate-300 leading-relaxed">{message}</p>

        {/* Stats Pill Breakdown (if provided) */}
        {stats && stats.length > 0 && (
          <div className="p-3 rounded-2xl bg-black/40 border border-white/[0.06] space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Items Affected:
            </span>
            <div className="flex flex-wrap gap-2">
              {stats.map((s, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-white/[0.04] border border-white/[0.08] text-slate-300"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-white/[0.06] hover:bg-white/[0.1] transition-all cursor-pointer disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-lg cursor-pointer flex items-center gap-2 disabled:opacity-50 ${
              isDestructive
                ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                : 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/30'
            }`}
          >
            {isDestructive && <Trash2 className="w-3.5 h-3.5" />}
            <span>{isLoading ? 'Processing...' : confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
