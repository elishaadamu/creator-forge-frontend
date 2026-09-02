import React, { useState } from 'react'
import {
  Activity, Play, CheckCircle2, XCircle, ShieldCheck,
  RefreshCw, Check, ChevronDown, ChevronRight,
  Sparkles, AlertCircle, Loader2, Send, CheckCheck,
  FileCode, ArrowRight, Bot, User, Layers, Search
} from 'lucide-react'
import { verifyProjectTaskWithAI, editOrGenerateCodeFileAI } from '../../services/ai'

export default function AutomatedQASuite({
  project,
  files = [],
  engineeringTasks = [],
  onUpdateTasks,
  onSaveProjectFiles,
  showToast
}) {
  const [customPrompt, setCustomPrompt] = useState('')
  const [isVerifyingCustom, setIsVerifyingCustom] = useState(false)
  const [customResult, setCustomResult] = useState(null)

  const [verifyingTaskId, setVerifyingTaskId] = useState(null)
  const [taskResults, setTaskResults] = useState({}) // { [taskId]: { passed, score, summary, checks, issues, recommendation } }
  const [isVerifyingAll, setIsVerifyingAll] = useState(false)
  const [searchFilter, setSearchFilter] = useState('')

  // 1. Run Custom Prompt Verification against Actual Code
  const handleRunCustomPromptTest = async (e) => {
    if (e) e.preventDefault()
    if (!customPrompt.trim()) return

    setIsVerifyingCustom(true)
    setCustomResult(null)

    try {
      const result = await verifyProjectTaskWithAI({
        taskTitle: 'Custom Code Verification',
        testPrompt: customPrompt,
        files: files || [],
        project: project || {}
      })
      setCustomResult(result)
      if (showToast) {
        showToast(result.passed ? 'Test Passed: Code verified successfully!' : 'Test Notice: Issues identified in codebase.')
      }
    } catch (err) {
      console.error('[QA Runner] Custom verification error:', err)
      if (showToast) showToast('Verification error: ' + err.message)
    } finally {
      setIsVerifyingCustom(false)
    }
  }

  // 2. Run Single Task Verification
  const handleVerifySingleTask = async (task) => {
    if (!task) return
    setVerifyingTaskId(task.id)

    try {
      const result = await verifyProjectTaskWithAI({
        taskTitle: task.title,
        testPrompt: `Verify that the codebase fully implements the following task: "${task.title}". Check for necessary UI elements, logic, styles, and integrations.`,
        files: files || [],
        project: project || {}
      })

      setTaskResults(prev => ({
        ...prev,
        [task.id]: result
      }))

      // If passed, auto-mark task as 'done'
      if (result.passed && onUpdateTasks && Array.isArray(engineeringTasks)) {
        const updated = engineeringTasks.map(t =>
          t.id === task.id ? { ...t, status: 'done', verifiedAt: new Date().toISOString() } : t
        )
        onUpdateTasks(updated)
      }

      if (showToast) {
        showToast(result.passed ? `Task '${task.title}' passed and marked Done!` : `Task '${task.title}' needs attention.`)
      }
    } catch (err) {
      console.error('[QA Runner] Task verification error:', err)
      if (showToast) showToast('Verification failed: ' + err.message)
    } finally {
      setVerifyingTaskId(null)
    }
  }

  // 3. Run All Tasks Verification
  const handleVerifyAllTasks = async () => {
    if (!Array.isArray(engineeringTasks) || engineeringTasks.length === 0) return
    setIsVerifyingAll(true)

    let updatedTasks = [...engineeringTasks]
    let newResults = { ...taskResults }

    try {
      for (const task of engineeringTasks) {
        setVerifyingTaskId(task.id)
        const result = await verifyProjectTaskWithAI({
          taskTitle: task.title,
          testPrompt: `Verify that the codebase implements: "${task.title}".`,
          files: files || [],
          project: project || {}
        })

        newResults[task.id] = result
        if (result.passed) {
          updatedTasks = updatedTasks.map(t =>
            t.id === task.id ? { ...t, status: 'done', verifiedAt: new Date().toISOString() } : t
          )
        }
      }

      setTaskResults(newResults)
      if (onUpdateTasks) {
        onUpdateTasks(updatedTasks)
      }
      if (showToast) {
        showToast('All sprint tasks verified against active codebase!')
      }
    } catch (err) {
      console.error('[QA Runner] Verify all error:', err)
    } finally {
      setVerifyingTaskId(null)
      setIsVerifyingAll(false)
    }
  }

  const passedTasksCount = (engineeringTasks || []).filter(t => t.status === 'done' || taskResults[t.id]?.passed).length
  const filteredTasks = (engineeringTasks || []).filter(t =>
    (t.title || '').toLowerCase().includes(searchFilter.toLowerCase())
  )

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-8">
      {/* QA Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 px-6 py-5 rounded-2xl bg-gradient-to-r from-[#0c0e14] via-[#10141e] to-[#0c0e14] border border-white/[0.08] shadow-lg shadow-black/30">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-sm sm:text-base font-bold text-white whitespace-nowrap">AI Task & Code QA</h2>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 font-mono whitespace-nowrap">
                Gemini 3.1 Flash Lite
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate mt-0.5">
              Auditing project code files against sprint tasks & custom testing prompts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0 ml-auto md:ml-0">
          <div className="text-right">
            <div className="text-xs font-bold text-white whitespace-nowrap">
              {passedTasksCount} / {engineeringTasks.length || 0} Tasks Done
            </div>
            <div className="text-[10px] text-emerald-400 font-mono whitespace-nowrap">
              {engineeringTasks.length > 0 ? Math.round((passedTasksCount / engineeringTasks.length) * 100) : 0}% Verified
            </div>
          </div>

          <button
            onClick={handleVerifyAllTasks}
            disabled={isVerifyingAll || engineeringTasks.length === 0}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition-all disabled:opacity-40 cursor-pointer whitespace-nowrap"
          >
            {isVerifyingAll ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Auditing Code...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Verify All Tasks</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 1. Custom Test Prompt Runner */}
      <div className="px-6 py-5 rounded-2xl bg-[#090b0e] border border-white/[0.08] space-y-3.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Run Custom Code Verification Prompt</span>
          </label>
          <span className="text-[11px] text-slate-500 font-mono">
            Tests {files.length} active code files
          </span>
        </div>

        <form onSubmit={handleRunCustomPromptTest} className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={customPrompt}
            onChange={e => setCustomPrompt(e.target.value)}
            placeholder="e.g. Test that index.html has a working hero section, responsive layout, and dark theme..."
            className="flex-1 px-3.5 py-2 rounded-xl bg-[#06080a] border border-white/[0.08] text-xs text-white placeholder-slate-500 outline-none focus:border-purple-500/50 font-mono"
          />

          <button
            type="submit"
            disabled={isVerifyingCustom || !customPrompt.trim()}
            className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer shadow-md shadow-purple-950/40"
          >
            {isVerifyingCustom ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Evaluating...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Run Test Prompt</span>
              </>
            )}
          </button>
        </form>

        {/* Quick prompt chips */}
        <div className="flex items-center gap-2 flex-wrap pt-1">
          <span className="text-[10px] text-slate-500">Quick tests:</span>
          {[
            'Verify HTML & modern responsive styling',
            'Check JavaScript event listeners & state interactivity',
            'Validate API integration & storage calls',
            'Verify UI components are production complete'
          ].map((promptText, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCustomPrompt(promptText)}
              className="text-[10px] px-2.5 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] text-slate-400 hover:text-slate-200 border border-white/[0.04] transition-colors"
            >
              {promptText}
            </button>
          ))}
        </div>

        {/* Custom Prompt Result Card */}
        {customResult && (
          <div className={`mt-3 p-4 rounded-xl border ${
            customResult.passed
              ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
              : 'bg-amber-950/20 border-amber-500/30 text-amber-300'
          } space-y-3`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                {customResult.passed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                )}
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span>{customResult.passed ? 'Test Passed' : 'Action Required'}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.1] font-mono">
                      Score: {customResult.score}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">{customResult.summary}</p>
                </div>
              </div>
            </div>

            {/* Checks list */}
            {Array.isArray(customResult.checks) && customResult.checks.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-white/[0.08]">
                {customResult.checks.map((check, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-[11px]">
                    <span className={`mt-0.5 shrink-0 ${check.status === 'Passed' ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {check.status === 'Passed' ? '✓' : '✗'}
                    </span>
                    <div>
                      <span className="font-bold text-white">{check.name}: </span>
                      <span className="text-slate-300">{check.detail}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Sprint Tasks Real QA Table */}
      <div className="p-5 rounded-2xl bg-[#090b0e] border border-white/[0.08] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-bold text-white">Sprint Tasks Verification Matrix</h3>
            <span className="text-xs text-slate-400">({engineeringTasks.length} tasks)</span>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search sprint tasks..."
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
              className="pl-8 pr-3 py-1 rounded-lg bg-[#06080a] border border-white/[0.08] text-xs text-white placeholder-slate-500 outline-none w-48 font-mono"
            />
          </div>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-xs">
            No sprint engineering tasks match your search.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map(task => {
              const result = taskResults[task.id]
              const isDone = task.status === 'done' || result?.passed
              const isChecking = verifyingTaskId === task.id

              return (
                <div
                  key={task.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isDone
                      ? 'bg-emerald-950/10 border-emerald-500/20'
                      : result && !result.passed
                      ? 'bg-amber-950/10 border-amber-500/20'
                      : 'bg-[#0c0e14] border-white/[0.06]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${isDone ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                        <h4 className="text-xs font-bold text-white truncate">{task.title}</h4>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        <span className="px-2 py-0.5 rounded bg-white/[0.04] text-slate-400 border border-white/[0.06] flex items-center gap-1">
                          {task.assignedTo === 'AI Agent' ? <Bot className="w-3 h-3 text-purple-400" /> : <User className="w-3 h-3 text-blue-400" />}
                          <span>{task.assignedTo || 'AI Agent'}</span>
                        </span>
                        {task.category && (
                          <span className="px-2 py-0.5 rounded bg-white/[0.04] text-slate-400 font-mono">
                            {task.category}
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded font-bold ${
                          isDone ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {isDone ? '✓ Done & Verified' : 'In Progress'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleVerifySingleTask(task)}
                        disabled={isChecking || isVerifyingAll}
                        className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40"
                      >
                        {isChecking ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Auditing...</span>
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-3 h-3" />
                            <span>Verify with AI</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Task Evaluation Details */}
                  {result && (
                    <div className="mt-3 pt-3 border-t border-white/[0.06] space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className={`font-bold ${result.passed ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {result.passed ? '✓ Requirements Satisfied' : '⚠️ Action Needed'}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">Match Score: {result.score}%</span>
                      </div>
                      <p className="text-[11px] text-slate-300">{result.summary}</p>

                      {Array.isArray(result.checks) && result.checks.length > 0 && (
                        <div className="space-y-1 pt-1">
                          {result.checks.map((c, idx) => (
                            <div key={idx} className="flex items-start gap-1.5 text-[11px]">
                              <span className={c.status === 'Passed' ? 'text-emerald-400' : 'text-amber-400'}>
                                {c.status === 'Passed' ? '✓' : '•'}
                              </span>
                              <span className="text-slate-400 font-mono">{c.name}:</span>
                              <span className="text-slate-200">{c.detail}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
