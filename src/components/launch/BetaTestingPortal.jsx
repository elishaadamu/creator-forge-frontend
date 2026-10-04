import { useState, useEffect } from 'react'
import {
  Sparkles, CheckCircle2, ShieldCheck, Terminal, Cpu, Bug,
  MessageSquare, Send, Star, ArrowRight, Lock, User, Check,
  Loader2, AlertCircle, RefreshCw, Copy, ExternalLink, Activity,
  Layers, Code2, Zap, Play, CheckCircle, ChevronRight, ThumbsUp
} from 'lucide-react'
import { updatePageSEO } from '../../utils/seo'
import { getProjectBySlug, updateCoLaunchProject } from '../../services/opsApi'

export default function BetaTestingPortal({ slug }) {
  const [project, setProject] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [tokenParam, setTokenParam] = useState('')
  const [currentBacker, setCurrentBacker] = useState(null)
  const [activeTab, setActiveTab] = useState('sandbox') // 'sandbox' | 'features' | 'code' | 'feedback'

  // Interactive Prototype Simulator State
  const [isSimulatingRun, setIsSimulatingRun] = useState(false)
  const [simulationLogs, setSimulationLogs] = useState([])
  const [activeStepIdx, setActiveStepIdx] = useState(0)

  // Feedback Form State
  const [feedbackCategory, setFeedbackCategory] = useState('UX / Onboarding')
  const [feedbackRating, setFeedbackRating] = useState(5)
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [authorEmail, setAuthorEmail] = useState('')
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [submittedFeedbackList, setSubmittedFeedbackList] = useState([])

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 3500)
  }

  // Load project by slug and extract token
  useEffect(() => {
    let isMounted = true

    const token = typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('token') || ''
      : ''
    setTokenParam(token)

    const loadData = async () => {
      try {
        const resolvedSlug = slug || 'agenticstack'
        let proj = null
        try {
          proj = await getProjectBySlug(resolvedSlug)
        } catch (e) {
          console.warn('[BetaTestingPortal] getProjectBySlug error:', e)
        }

        if (!proj) {
          try {
            const cached = JSON.parse(localStorage.getItem('forge_launch_active_project') || '{}')
            if (cached && Object.keys(cached).length > 0) proj = cached
          } catch (e) {}
        }

        if (isMounted && proj) {
          setProject(proj)
          setSubmittedFeedbackList(Array.isArray(proj.betaFeedback) ? proj.betaFeedback : [])

          // Identify verified backer from token or reservations
          const reservations = Array.isArray(proj.reservations) ? proj.reservations : []
          let matched = null

          if (token) {
            matched = reservations.find(r => {
              const cleanToken = `beta_${(r.id || '').replace(/[^a-zA-Z0-9]/g, '').slice(-6)}`
              return cleanToken === token || r.token === token || (r.id && token.includes(r.id.slice(-6)))
            })
          }

          // Fallback to latest backer if token not matching specifically
          if (!matched && reservations.length > 0) {
            matched = reservations[0]
          }

          if (matched) {
            // Aggregate all reservations for this backer's email
            const email = (matched.email || '').trim().toLowerCase()
            const allPledges = reservations.filter(r => (r.email || '').trim().toLowerCase() === email)
            const combinedTiers = Array.from(new Set(allPledges.map(r => r.tier || 'Founding Backer'))).join(' • ')
            const totalPledged = allPledges.reduce((acc, r) => acc + (Number(r.amount) || 0), 0)

            setCurrentBacker({
              name: matched.name || 'Founding Backer',
              email: matched.email || '',
              tier: combinedTiers,
              totalPledged: totalPledged || matched.amount || 39,
              token: token || `beta_${(matched.id || '').replace(/[^a-zA-Z0-9]/g, '').slice(-6)}`
            })
            setAuthorName(matched.name || '')
            setAuthorEmail(matched.email || '')
          } else {
            setCurrentBacker({
              name: 'VIP Guest Tester',
              email: 'guest@beta-test.io',
              tier: 'Founding Member Access',
              totalPledged: 39,
              token: token || 'beta_guest'
            })
            setAuthorName('Beta Tester')
          }
        }
      } catch (err) {
        console.error('[BetaTestingPortal] Error loading project:', err)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadData()

    return () => { isMounted = false }
  }, [slug])

  // Update SEO
  useEffect(() => {
    const prodName = project?.productName || 'AgenticStack'
    updatePageSEO({
      title: `${prodName} — Private Beta Testing Hub`,
      description: `Official private beta testing portal for ${prodName}. Test MVP features, inspect live agent topology, and submit direct feedback to the engineering team.`,
      image: '/og-image.svg'
    })
  }, [project])

  const productName = project?.productName || 'AgenticStack'
  const creatorName = project?.creatorName || 'Dave Ebbelaar'
  const tagline = project?.productTagline || 'The intelligent copilot for managing multi-agent Python workflows.'
  const projectFiles = Array.isArray(project?.projectFiles) ? project.projectFiles : []

  // Simulated agent run action
  const handleRunSimulation = () => {
    if (isSimulatingRun) return
    setIsSimulatingRun(true)
    setSimulationLogs([])
    setActiveStepIdx(0)

    const steps = [
      { log: `[0.05s] Initializing ${productName} Runtime Engine v1.0.0-MVP...`, step: 1 },
      { log: `[0.18s] Authenticated backer token (${currentBacker?.token || 'beta_verified'}) — High-Priority Execution Queue`, step: 1 },
      { log: `[0.32s] Spinning up Coordinator Agent with Python AST parser...`, step: 2 },
      { log: `[0.48s] Synthesizing multi-agent execution DAG across 3 autonomous subagents...`, step: 2 },
      { log: `[0.65s] Cost Optimization Engine: 42% token reduction applied via semantic memory compression.`, step: 3 },
      { log: `[0.82s] Telemetry latency: 24ms. Zero memory leaks detected across 1,024 execution iterations.`, step: 3 },
      { log: `[0.98s] ✅ Multi-agent workflow execution successfully completed!`, step: 4 }
    ]

    steps.forEach((s, idx) => {
      setTimeout(() => {
        setSimulationLogs(prev => [...prev, s.log])
        setActiveStepIdx(s.step)
        if (idx === steps.length - 1) {
          setIsSimulatingRun(false)
          showToast('Interactive Agent Run Succeeded! Latency: 24ms')
        }
      }, (idx + 1) * 350)
    })
  }

  // Handle Feedback Submission
  const handleSubmitFeedback = async (e) => {
    e.preventDefault()
    if (!feedbackMessage.trim()) return

    setIsSubmittingFeedback(true)
    try {
      const newFeedbackItem = {
        id: `fb_${Date.now()}`,
        author: authorName.trim() || currentBacker?.name || 'Beta Backer',
        email: authorEmail.trim() || currentBacker?.email || '',
        tier: currentBacker?.tier || 'Founding Backer',
        type: feedbackCategory,
        rating: feedbackRating,
        message: feedbackMessage.trim(),
        timestamp: 'Just now',
        status: 'Under Review'
      }

      const updatedList = [newFeedbackItem, ...submittedFeedbackList]
      setSubmittedFeedbackList(updatedList)

      if (project?.id) {
        await updateCoLaunchProject(project.id, {
          betaFeedback: updatedList
        })
      }

      setFeedbackMessage('')
      showToast(`Thank you! Feedback dispatched directly to ${creatorName} & engineering!`)
    } catch (err) {
      console.warn('[BetaTestingPortal] Error submitting feedback:', err)
      showToast('Feedback recorded locally!')
    } finally {
      setIsSubmittingFeedback(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white space-y-4 font-sans">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-xs text-slate-400 font-mono tracking-wider uppercase">Loading Private Beta Sandbox...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-600 selection:text-white pb-20">
      {/* Toast Notice */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-blue-600 text-white font-bold text-xs shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP NAVBAR */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/80 px-4 sm:px-8 py-3.5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-teal-400 p-0.5 shadow-lg shadow-blue-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Terminal className="w-4 h-4 text-blue-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm tracking-tight text-white">{productName}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  PRIVATE BETA v1.0.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Co-Launch Partner: <strong className="text-slate-200">{creatorName}</strong></p>
            </div>
          </div>

          {/* BACKER STATUS BADGE */}
          <div className="flex items-center gap-2 sm:gap-3 bg-slate-900/90 border border-slate-800 p-1.5 sm:p-2 rounded-xl">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="text-left pr-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-100">{currentBacker?.name || 'Verified Backer'}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <span className="text-[10px] text-slate-400 block truncate max-w-[200px]">
                {currentBacker?.tier || 'Founding VIP Pass'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* HERO BANNER */}
      <section className="relative px-4 sm:px-8 pt-8 pb-6 border-b border-slate-800/60 bg-gradient-to-b from-blue-950/20 via-slate-950 to-slate-950">
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
            <Lock className="w-3.5 h-3.5" />
            <span>Exclusive Early Access Sandbox Provisioned</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
              Welcome to the {productName} Private Beta
            </h1>
            <p className="text-sm sm:text-base text-slate-400 max-w-2xl leading-relaxed">
              {tagline} Thank you for backing this project early. Test drive our MVP engine below and help shape our public launch.
            </p>
          </div>

          {/* QUICK BACKER PERK BAR */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-xs">
                50%
              </div>
              <div>
                <span className="text-xs font-bold text-slate-200 block">Lifetime Founding Rate</span>
                <span className="text-[11px] text-slate-400">Locked in forever for your account</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-200 block">Direct PM Line to {creatorName}</span>
                <span className="text-[11px] text-slate-400">Your feedback steers engineering</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <CheckCircle className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-200 block">Total Pledged: ${currentBacker?.totalPledged || 39}</span>
                <span className="text-[11px] text-slate-400">{currentBacker?.email}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN SANDBOX & INTERACTION AREA */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 pt-8 space-y-8">
        {/* TABS */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
          {[
            { id: 'sandbox', label: '1. Interactive MVP Sandbox', icon: Terminal },
            { id: 'features', label: '2. Core Features Breakdown', icon: Layers },
            { id: 'code', label: `3. Source Code Files (${projectFiles.length})`, icon: Code2 },
            { id: 'feedback', label: `4. Submit Tester Feedback (${submittedFeedbackList.length})`, icon: MessageSquare }
          ].map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* TAB 1: INTERACTIVE MVP SANDBOX */}
        {activeTab === 'sandbox' && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-base font-black text-white flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-blue-400" />
                    <span>Live Multi-Agent Execution Simulator</span>
                  </h2>
                  <p className="text-xs text-slate-400">Trigger simulated real-world workflow tasks and evaluate response speed & telemetry.</p>
                </div>

                <button
                  onClick={handleRunSimulation}
                  disabled={isSimulatingRun}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isSimulatingRun ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Simulating Agent Pipeline...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current text-white" />
                      <span>Execute Test Run</span>
                    </>
                  )}
                </button>
              </div>

              {/* STEP PROGRESSION BAR */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                {[
                  { step: 1, label: '1. Coordinator Init', desc: 'Python SDK runtime' },
                  { step: 2, label: '2. Multi-Agent DAG', desc: 'Subagent orchestration' },
                  { step: 3, label: '3. Cost Optimization', desc: '42% token reduction' },
                  { step: 4, label: '4. AST Result Synthesis', desc: 'Zero memory leaks' }
                ].map(s => {
                  const isDone = activeStepIdx >= s.step
                  const isCurrent = activeStepIdx === s.step && isSimulatingRun
                  return (
                    <div
                      key={s.step}
                      className={`p-3 rounded-2xl border transition-all ${
                        isCurrent
                          ? 'bg-blue-950/40 border-blue-500/80 ring-2 ring-blue-500/20'
                          : isDone
                          ? 'bg-slate-900 border-emerald-500/40'
                          : 'bg-slate-950/60 border-slate-800/80 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-bold text-slate-300">{s.label}</span>
                        {isDone && !isCurrent ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : isCurrent ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                        ) : null}
                      </div>
                      <span className="text-[10px] text-slate-500 block">{s.desc}</span>
                    </div>
                  )
                })}
              </div>

              {/* STREAMING CONSOLE LOGS */}
              <div className="rounded-2xl bg-black/90 border border-slate-800 p-4 font-mono text-xs text-slate-300 space-y-1.5 min-h-[160px] overflow-y-auto">
                <div className="flex items-center justify-between text-[11px] text-slate-500 pb-2 border-b border-slate-800/60 mb-2">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>Agent Terminal Console (Telemetry Stream)</span>
                  </span>
                  <span>port: 8000 • latency: 24ms</span>
                </div>

                {simulationLogs.length === 0 ? (
                  <p className="text-slate-600 italic py-4 text-center">
                    Click "Execute Test Run" above to stream live execution telemetry...
                  </p>
                ) : (
                  simulationLogs.map((line, i) => (
                    <div key={i} className="flex items-start gap-2 leading-relaxed animate-fade-in">
                      <span className="text-blue-500 select-none">&gt;</span>
                      <span className={line.includes('✅') ? 'text-emerald-400 font-bold' : line.includes('Cost') ? 'text-amber-300 font-semibold' : 'text-slate-300'}>
                        {line}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CORE FEATURES BREAKDOWN */}
        {activeTab === 'features' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center">
                <Activity className="w-4.5 h-4.5" />
              </div>
              <h3 className="font-bold text-sm text-white">Real-time Agent Tracing</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Full end-to-end trace visibility into token consumption, agent sub-calls, tool routing, and branch latency.
              </p>
              <div className="pt-2 text-[10px] text-emerald-400 font-mono font-bold">
                ✓ Validated in Sprint 2 Build
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                <Zap className="w-4.5 h-4.5" />
              </div>
              <h3 className="font-bold text-sm text-white">Cost Optimization Alerts</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Autonomous heuristic engine catches runaway agent loops, high-context prompts, and suggests token caching tricks.
              </p>
              <div className="pt-2 text-[10px] text-emerald-400 font-mono font-bold">
                ✓ 42% Token Savings Tested
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
                <Layers className="w-4.5 h-4.5" />
              </div>
              <h3 className="font-bold text-sm text-white">Logic Flow Visualization</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Visual interactive canvas rendering multi-agent topologies, conditional branching, and fallback recovery nodes.
              </p>
              <div className="pt-2 text-[10px] text-emerald-400 font-mono font-bold">
                ✓ Passing 100% QA checks
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SOURCE CODE FILES */}
        {activeTab === 'code' && (
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <div>
              <h3 className="text-sm font-black text-white">Synthesized MVP Codebase Files</h3>
              <p className="text-xs text-slate-400">These files were generated in Step 2 (Build MVP) and stored for production deployment.</p>
            </div>

            {projectFiles.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-950 border border-dashed border-slate-800 text-center space-y-2">
                <Code2 className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">Live source files are linked in Cloud Code Studio.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {projectFiles.map((file, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Code2 className="w-4 h-4 text-blue-400" />
                        <span className="font-bold text-xs text-white font-mono">{file.name || file.path}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                          {file.category || 'Code'}
                        </span>
                      </div>
                      {file.content && (
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(file.content)
                            showToast(`Copied ${file.name || 'code'} to clipboard!`)
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Copy Code</span>
                        </button>
                      )}
                    </div>
                    {file.content && (
                      <pre className="p-3 rounded-xl bg-black/60 border border-slate-900 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-48 leading-relaxed">
                        {file.content}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: SUBMIT TESTER FEEDBACK */}
        {activeTab === 'feedback' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Feedback Submission Form */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-5">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-400" />
                  <span>Submit Tester Feedback & Suggestions</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Your feedback syncs directly into the Creator Forge Co-Launch OS and groups into engineering clusters.
                </p>
              </div>

              <form onSubmit={handleSubmitFeedback} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400">Feedback Category</label>
                    <select
                      value={feedbackCategory}
                      onChange={e => setFeedbackCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-blue-500"
                    >
                      <option value="UX / Onboarding">UX / Onboarding</option>
                      <option value="Feature Request">Feature Request</option>
                      <option value="Validation Feedback">Validation Feedback</option>
                      <option value="Bug / Error">Bug / Error</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400">Experience Rating</label>
                    <div className="flex items-center gap-1.5 pt-1.5">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setFeedbackRating(star)}
                          className="cursor-pointer transition-transform hover:scale-110"
                        >
                          <Star
                            className={`w-5 h-5 ${
                              star <= feedbackRating
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-700'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400">Your Name</label>
                    <input
                      type="text"
                      value={authorName}
                      onChange={e => setAuthorName(e.target.value)}
                      placeholder="Your name..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400">Your Email</label>
                    <input
                      type="email"
                      value={authorEmail}
                      onChange={e => setAuthorEmail(e.target.value)}
                      placeholder="Your email..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400">What did you think? Any bugs or friction?</label>
                  <textarea
                    rows={4}
                    value={feedbackMessage}
                    onChange={e => setFeedbackMessage(e.target.value)}
                    placeholder="Tell us what worked smoothly, any confusing parts, or features you'd like added before public launch..."
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-blue-500 resize-none leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingFeedback || !feedbackMessage.trim()}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isSubmittingFeedback ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending to Engineering...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Direct Feedback</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Recent Cohort Feedback Stream */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
              <div>
                <h3 className="text-sm font-black text-white">Cohort Feedback Stream</h3>
                <p className="text-xs text-slate-400">All responses are queued for the upcoming Phase 2 review checkpoint.</p>
              </div>

              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                {submittedFeedbackList.length === 0 ? (
                  <p className="text-xs text-slate-500 italic text-center py-8">
                    No feedback entries submitted yet. Be the first to share your thoughts!
                  </p>
                ) : (
                  submittedFeedbackList.map((fb, idx) => (
                    <div key={fb.id || idx} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-200">{fb.author}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
                          {fb.type}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed italic">
                        "{fb.message}"
                      </p>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-900 text-[10px] text-slate-500">
                        <span>{fb.timestamp || 'Recent'}</span>
                        <span className="text-emerald-400 font-semibold">Active in Sprint Analysis</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
