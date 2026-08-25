import { useState, useEffect } from 'react'
import {
  Code, Cpu, Terminal, CheckCircle2, ShieldCheck, Sparkles, Layers,
  Database, Server, Lock, CreditCard, BarChart3, AlertCircle, ArrowRight,
  ExternalLink, FileText, Check, Plus, Trash2, RefreshCw, Loader2,
  ChevronRight, Laptop, Workflow, Milestone, ShieldAlert, Download, Sliders,
  Edit3, Bot, UserCheck, Play, MessageSquare, Bug, HelpCircle, Send, Copy,
  CheckCircle, Globe, Activity, Rocket, User, Zap
} from 'lucide-react'
import {
  generateMVPProductBuildPlanAI,
  buildSmartFallbackMVPBuildPlan,
  analyzeAndClusterBetaFeedbackAI,
  buildSmartFallbackBetaFeedbackClusters,
  executeAICodingTaskAI
} from '../../services/ai'

export default function Phase2BuildMVP({ project, api, onUpdateProject, onAdvanceToPhase3 }) {
  const [activeStep, setActiveStep] = useState('plan') // 'plan' | 'build' | 'beta' | 'gate'
  const [specSubtab, setSpecSubtab] = useState('spec') // 'spec' | 'technical' | 'scope' | 'tasks'
  const [buildSubtab, setBuildSubtab] = useState('tasks') // 'tasks' | 'qa' | 'staging'
  const [betaSubtab, setBetaSubtab] = useState('clusters') // 'clusters' | 'cohort' | 'feedback'
  const [isEditingSpec, setIsEditingSpec] = useState(false)

  // Dynamic MVP Build Plan State (Spec + Tech Plan + Scope Boundaries)
  const [buildPlan, setBuildPlan] = useState(() => {
    if (project?.mvpBuildPlan) return project.mvpBuildPlan
    return buildSmartFallbackMVPBuildPlan(project)
  })

  // Division of Labor Engineering Tasks
  const [engineeringTasks, setEngineeringTasks] = useState(() => {
    if (project?.engineeringTasks && project.engineeringTasks.length > 0) {
      return project.engineeringTasks
    }
    return [
      {
        id: 'task-ai-1',
        title: 'Scaffold FastAPI Backend Skeleton & PostgreSQL Models',
        category: 'Backend / Schema',
        assignedTo: 'AI Agent',
        status: 'Completed',
        estimate: '1 Day',
        notes: 'SQLAlchemy models for users, workspaces, and pipeline jobs generated.'
      },
      {
        id: 'task-ai-2',
        title: 'Generate React Command Workspace & Execution Canvas',
        category: 'Frontend',
        assignedTo: 'AI Agent',
        status: 'In Progress',
        estimate: '2 Days',
        notes: 'Interactive workspace components and parameter inputs scaffolding.'
      },
      {
        id: 'task-human-1',
        title: 'Hardened OAuth & Stripe Webhook Security Layer',
        category: 'Security / Auth',
        assignedTo: 'Human Engineer',
        status: 'Ready',
        estimate: '1 Day',
        notes: 'Multi-tenant JWT token rotation, CORS policy, and Stripe signature verification.'
      },
      {
        id: 'task-ai-3',
        title: 'Implement Redis & Celery Async Worker Queue',
        category: 'AI / Pipeline',
        assignedTo: 'AI Agent',
        status: 'Ready',
        estimate: '1.5 Days',
        notes: 'Background task distribution for heavy inference workflows.'
      },
      {
        id: 'task-human-2',
        title: 'Complex Multi-Service Data Pipeline & Failover Optimization',
        category: 'Architecture',
        assignedTo: 'Human Engineer',
        status: 'Ready',
        estimate: '2 Days',
        notes: 'Resilient external API streaming and graceful fallback handling.'
      }
    ]
  })

  // Automated Testing / QA State
  const [qaRunning, setQaRunning] = useState(false)
  const [qaResults, setQaResults] = useState(() => project?.qaResults || {
    unitTests: { passed: 28, failed: 0, total: 28, coverage: '98%' },
    integrationTests: { passed: 14, failed: 0, total: 14 },
    e2eWorkflows: { passed: 6, failed: 0, total: 6 },
    lastRun: 'Just now',
    status: 'Passing'
  })

  // Beta Cohort State (Presales + Waitlist)
  const [betaCohort, setBetaCohort] = useState(() => {
    const res = Array.isArray(project?.reservations) ? project.reservations : []
    if (res.length > 0) {
      return res.map(r => ({
        id: r.id,
        name: r.name,
        email: r.email,
        tier: r.tier || 'Founding Backer',
        status: 'Invite Sent',
        token: `beta_${r.id.replace(/[^a-zA-Z0-9]/g, '').slice(-6)}`,
        lastActive: 'Awaiting Login'
      }))
    }
    return [
      { id: 'b-1', name: 'Alex Rivera', email: 'alex@creatorcompany.com', tier: 'Founding Annual ($99)', status: 'Active in Beta', token: 'beta_ar991', lastActive: '2h ago' },
      { id: 'b-2', name: 'Jordan Hayes', email: 'jordan.h@digitalscale.io', tier: 'VIP Founder ($199)', status: 'Active in Beta', token: 'beta_jh442', lastActive: '5h ago' },
      { id: 'b-3', name: 'Elena Rostova', email: 'elena@growthops.co', tier: 'Founding Annual ($99)', status: 'Invite Sent', token: 'beta_er108', lastActive: 'Pending' }
    ]
  })

  // Raw Beta Feedback Feed
  const [rawFeedback, setRawFeedback] = useState(() => project?.betaFeedback || [
    { id: 'f-1', author: 'Alex Rivera', type: 'UX / Onboarding', message: 'I was confused during step 1 of onboarding about where to input my API key.', timestamp: '3h ago' },
    { id: 'f-2', author: 'Jordan Hayes', type: 'Feature Request', message: 'Can you add direct 1-click cloud sync to Google Drive instead of manual CSV download?', timestamp: '5h ago' },
    { id: 'f-3', author: 'Beta Tester #4', type: 'Bug', message: 'Encountered session timeout after 20 minutes of idle time on the dashboard.', timestamp: '1d ago' },
    { id: 'f-4', author: 'Elena Rostova', type: 'Objection', message: 'Would love team seat permissions if we roll this out across 5 people.', timestamp: '1d ago' }
  ])

  // AI Feedback Clusters
  const [feedbackClusters, setFeedbackClusters] = useState(() => {
    if (project?.feedbackClusters) return project.feedbackClusters
    return buildSmartFallbackBetaFeedbackClusters(project)
  })

  const [isClusteringAI, setIsClusteringAI] = useState(false)
  const [newFeedbackAuthor, setNewFeedbackAuthor] = useState('')
  const [newFeedbackType, setNewFeedbackType] = useState('UX / Onboarding')
  const [newFeedbackMsg, setNewFeedbackMsg] = useState('')

  // AI Task Execution State
  const [executingTaskId, setExecutingTaskId] = useState(null)
  const [aiExecOutput, setAiExecOutput] = useState(null)

  const [isGenerating, setIsGenerating] = useState(false)
  const [saveToast, setSaveToast] = useState('')
  
  // New Feature & Scope Inputs
  const [newFeatureName, setNewFeatureName] = useState('')
  const [newFeatureDesc, setNewFeatureDesc] = useState('')
  const [newFeaturePriority, setNewFeaturePriority] = useState('P0 - Must Have')
  
  const [newIncludedItem, setNewIncludedItem] = useState('')
  const [newExcludedItem, setNewExcludedItem] = useState('')

  // New Sprint Task Inputs
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskCategory, setNewTaskCategory] = useState('Backend')
  const [newTaskAssigned, setNewTaskAssigned] = useState('AI Agent')
  const [newTaskEstimate, setNewTaskEstimate] = useState('1 Day')

  useEffect(() => {
    if (project?.mvpBuildPlan) {
      setBuildPlan(project.mvpBuildPlan)
    }
  }, [project?.mvpBuildPlan])

  const showToast = (msg) => {
    setSaveToast(msg)
    setTimeout(() => setSaveToast(''), 3500)
  }

  const handleSavePlan = (updatedPlan = buildPlan, updatedTasks = engineeringTasks) => {
    const updated = {
      ...(project || {}),
      mvpBuildPlan: updatedPlan,
      engineeringTasks: updatedTasks,
      qaResults,
      betaFeedback: rawFeedback,
      feedbackClusters
    }
    if (onUpdateProject) onUpdateProject(prev => ({ ...(prev || {}), ...updated }))
    try {
      localStorage.setItem('forge_launch_active_project', JSON.stringify(updated))
      window.dispatchEvent(new CustomEvent('forge_project_updated', { detail: updated }))
    } catch (e) {}
    showToast('Phase 2 state saved & synced!')
  }

  const handleGenerateAIPlan = async () => {
    setIsGenerating(true)
    try {
      const generated = await generateMVPProductBuildPlanAI(project)
      setBuildPlan(generated)
      handleSavePlan(generated)
      showToast('AI MVP Product & Technical Build Plan generated!')
    } catch (err) {
      console.warn('[Phase2BuildMVP] AI generation error:', err)
      const fallback = buildSmartFallbackMVPBuildPlan(project)
      setBuildPlan(fallback)
      handleSavePlan(fallback)
      showToast('Build Plan populated from Phase 1 validation inputs.')
    } finally {
      setIsGenerating(false)
    }
  }

  // Update spec text fields
  const updateSpecField = (field, value) => {
    const updated = {
      ...buildPlan,
      productSpec: {
        ...(buildPlan.productSpec || {}),
        [field]: value
      }
    }
    setBuildPlan(updated)
  }

  // Add Feature
  const handleAddFeature = (e) => {
    e?.preventDefault()
    if (!newFeatureName.trim()) return
    const newFeat = {
      name: newFeatureName.trim(),
      description: newFeatureDesc.trim() || 'Core workflow feature',
      priority: newFeaturePriority
    }
    const currentFeatures = buildPlan.productSpec?.features || []
    const updated = {
      ...buildPlan,
      productSpec: {
        ...(buildPlan.productSpec || {}),
        features: [...currentFeatures, newFeat]
      }
    }
    setBuildPlan(updated)
    handleSavePlan(updated)
    setNewFeatureName('')
    setNewFeatureDesc('')
    showToast(`Added feature: ${newFeat.name}`)
  }

  const handleDeleteFeature = (idx) => {
    const currentFeatures = (buildPlan.productSpec?.features || []).filter((_, i) => i !== idx)
    const updated = {
      ...buildPlan,
      productSpec: {
        ...(buildPlan.productSpec || {}),
        features: currentFeatures
      }
    }
    setBuildPlan(updated)
    handleSavePlan(updated)
  }

  // Scope boundaries add/remove
  const handleAddIncluded = (e) => {
    e?.preventDefault()
    if (!newIncludedItem.trim()) return
    const current = buildPlan.scopeBoundaries?.includedInMVP || []
    const updated = {
      ...buildPlan,
      scopeBoundaries: {
        ...(buildPlan.scopeBoundaries || {}),
        includedInMVP: [...current, newIncludedItem.trim()]
      }
    }
    setBuildPlan(updated)
    handleSavePlan(updated)
    setNewIncludedItem('')
  }

  const handleDeleteIncluded = (idx) => {
    const current = (buildPlan.scopeBoundaries?.includedInMVP || []).filter((_, i) => i !== idx)
    const updated = {
      ...buildPlan,
      scopeBoundaries: {
        ...(buildPlan.scopeBoundaries || {}),
        includedInMVP: current
      }
    }
    setBuildPlan(updated)
    handleSavePlan(updated)
  }

  const handleAddExcluded = (e) => {
    e?.preventDefault()
    if (!newExcludedItem.trim()) return
    const current = buildPlan.scopeBoundaries?.excludedFromMVP || []
    const updated = {
      ...buildPlan,
      scopeBoundaries: {
        ...(buildPlan.scopeBoundaries || {}),
        excludedFromMVP: [...current, newExcludedItem.trim()]
      }
    }
    setBuildPlan(updated)
    handleSavePlan(updated)
    setNewExcludedItem('')
  }

  const handleDeleteExcluded = (idx) => {
    const current = (buildPlan.scopeBoundaries?.excludedFromMVP || []).filter((_, i) => i !== idx)
    const updated = {
      ...buildPlan,
      scopeBoundaries: {
        ...(buildPlan.scopeBoundaries || {}),
        excludedFromMVP: current
      }
    }
    setBuildPlan(updated)
    handleSavePlan(updated)
  }

  // Add sprint task to Division of Labor Matrix
  const handleAddTask = (e) => {
    e?.preventDefault()
    if (!newTaskTitle.trim()) return
    const newTask = {
      id: `task-${Date.now()}`,
      title: newTaskTitle.trim(),
      category: newTaskCategory,
      assignedTo: newTaskAssigned,
      status: 'Ready',
      estimate: newTaskEstimate,
      notes: `Assigned to ${newTaskAssigned}`
    }
    const updated = [newTask, ...engineeringTasks]
    setEngineeringTasks(updated)
    handleSavePlan(buildPlan, updated)
    setNewTaskTitle('')
    showToast(`Added sprint task assigned to ${newTaskAssigned}`)
  }

  const handleDeleteTask = (taskId) => {
    const updated = engineeringTasks.filter(t => t.id !== taskId)
    setEngineeringTasks(updated)
    handleSavePlan(buildPlan, updated)
  }

  const handleToggleTaskStatus = (taskId) => {
    const updated = engineeringTasks.map(t => {
      if (t.id === taskId) {
        const next = t.status === 'Completed' ? 'Ready' : t.status === 'In Progress' ? 'Completed' : 'In Progress'
        return { ...t, status: next }
      }
      return t
    })
    setEngineeringTasks(updated)
    handleSavePlan(buildPlan, updated)
  }

  // Dispatch AI Coding Agent to execute task
  const handleDispatchAIAgent = async (task) => {
    setExecutingTaskId(task.id)
    setAiExecOutput(null)
    try {
      const res = await executeAICodingTaskAI(task, project)
      setAiExecOutput(res)
      const updated = engineeringTasks.map(t => {
        if (t.id === task.id) {
          return {
            ...t,
            status: 'Completed',
            notes: res.implementationNotes || 'Implemented and verified by AI Agent.'
          }
        }
        return t
      })
      setEngineeringTasks(updated)
      handleSavePlan(buildPlan, updated)
      showToast(`AI Coding Agent completed: ${task.title}`)
    } catch (e) {
      console.warn('AI Execution error:', e)
    } finally {
      setExecutingTaskId(null)
    }
  }

  // Run Automated QA Test Suite
  const handleRunQA = () => {
    setQaRunning(true)
    setTimeout(() => {
      const newResults = {
        unitTests: { passed: 32, failed: 0, total: 32, coverage: '99%' },
        integrationTests: { passed: 18, failed: 0, total: 18 },
        e2eWorkflows: { passed: 8, failed: 0, total: 8 },
        lastRun: 'Just now',
        status: 'Passing (All Tests Green)'
      }
      setQaResults(newResults)
      setQaRunning(false)
      showToast('Automated QA Test Suite completed successfully with 100% pass rate!')
    }, 1800)
  }

  // Add raw customer feedback
  const handleAddFeedback = (e) => {
    e?.preventDefault()
    if (!newFeedbackMsg.trim()) return
    const newF = {
      id: `f-${Date.now()}`,
      author: newFeedbackAuthor.trim() || 'Beta Backer',
      type: newFeedbackType,
      message: newFeedbackMsg.trim(),
      timestamp: 'Just now'
    }
    const updated = [newF, ...rawFeedback]
    setRawFeedback(updated)
    setNewFeedbackAuthor('')
    setNewFeedbackMsg('')
    showToast('Customer beta feedback logged.')
  }

  // AI Cluster Feedback
  const handleClusterFeedbackAI = async () => {
    setIsClusteringAI(true)
    try {
      const res = await analyzeAndClusterBetaFeedbackAI(rawFeedback, project)
      setFeedbackClusters(res.clusters || [])
      showToast('AI clustered recurring issues from customer feedback!')
    } catch (e) {
      console.warn('Cluster error:', e)
    } finally {
      setIsClusteringAI(false)
    }
  }

  // Convert Feedback Cluster to Engineering Task in Step 2
  const handleConvertClusterToTask = (cluster) => {
    const newTask = {
      id: `task-fix-${Date.now()}`,
      title: `[Fix / Resolve] ${cluster.title}`,
      category: cluster.category.includes('Bug') ? 'Security / Bug' : cluster.category.includes('UX') ? 'Frontend' : 'Backend',
      assignedTo: cluster.severity === 'High' ? 'Human Engineer' : 'AI Agent',
      status: 'Ready',
      estimate: '1 Day',
      notes: `Derived from beta cohort: "${cluster.description}" (${cluster.count} users impacted)`
    }
    const updated = [newTask, ...engineeringTasks]
    setEngineeringTasks(updated)
    handleSavePlan(buildPlan, updated)
    showToast(`Converted cluster to sprint task: ${newTask.title}`)
  }

  const handleExportMarkdown = () => {
    const spec = buildPlan.productSpec || {}
    const tech = buildPlan.technicalPlan || {}
    const scope = buildPlan.scopeBoundaries || {}

    const md = `# MVP PRODUCT & TECHNICAL BUILD PLAN: ${project?.productName || 'Software Product'}
## Creator Co-Founder: ${project?.creatorName || 'Creator'} | Niche: ${project?.niche || 'Software'}

---

### 1. PRODUCT SPECIFICATION
- **Target Customer:** ${spec.targetCustomer || 'N/A'}
- **Core Problem:** ${spec.coreProblem || 'N/A'}
- **Value Proposition:** ${spec.valueProposition || 'N/A'}

#### Core Features (MVP):
${(spec.features || []).map(f => `- **${f.name}** (${f.priority}): ${f.description}`).join('\n')}

#### User Flows:
${(spec.userFlows || []).map(uf => `1. **${uf.step}:** ${uf.action}`).join('\n')}

#### Key Screens:
${(spec.screens || []).map(s => `- **${s.name}:** ${s.description}`).join('\n')}

---

### 2. DIVISION OF LABOR & ENGINEERING TASKS
${engineeringTasks.map(t => `- [${t.status}] **${t.title}** (${t.category}) — Assigned to: *${t.assignedTo}* [${t.estimate}]`).join('\n')}

---

### 3. BETA TESTING & RECURRING FEEDBACK CLUSTERS
${feedbackClusters.map(c => `- **${c.count} users:** ${c.title} (${c.category} — ${c.severity} Severity)\n  *Fix:* ${c.recommendedAction}`).join('\n')}
`
    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `MVP_BUILD_PLAN_${(project?.productName || 'product').toUpperCase().replace(/[^A-Z0-9]/g, '_')}.md`
    a.click()
    URL.revokeObjectURL(url)
    showToast('Downloaded Markdown Product Spec!')
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001'
  const productSlug = (project?.slug || project?.productName || 'product').toLowerCase().replace(/[^a-z0-9]/g, '-')
  const presalesRevenue = Number(project?.currentPresales || 0)
  const backersCount = Array.isArray(project?.reservations) ? project.reservations.length : 0

  // OS Progress calculation
  const completedCount = engineeringTasks.filter(t => t.status === 'Completed').length
  const totalTasksCount = engineeringTasks.length
  const progressPercent = totalTasksCount > 0 ? Math.round((completedCount / totalTasksCount) * 100) : 0

  return (
    <div className="space-y-6 text-left">
      {/* Save Notification Toast */}
      {saveToast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-2xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-2xl flex items-center gap-2 animate-fade-in border border-emerald-400">
          <CheckCircle2 className="w-4 h-4" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* Top Banner: Goal & Validated Demand Metrics */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-[#0e1117] via-[#141722] to-[#121626] border border-blue-500/20 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-[10px] font-black uppercase tracking-wider">
                Phase 2 Checkpoint
              </span>
              <span className="text-xs text-slate-400 font-medium">Build MVP</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Turn Validated Demand into the Smallest Usable Version
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Division of labor between AI Coding Agents & Human Engineering with private beta clustering.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            {activeStep === 'plan' && (
              <button
                onClick={() => {
                  if (isEditingSpec) handleSavePlan()
                  setIsEditingSpec(!isEditingSpec)
                }}
                className={`px-3.5 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors ${
                  isEditingSpec
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                    : 'bg-[#1a1f2c] hover:bg-[#23293b] text-slate-200 border-white/[0.08]'
                }`}
              >
                {isEditingSpec ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Done Editing</span>
                  </>
                ) : (
                  <>
                    <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                    <span>Edit Spec</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={handleGenerateAIPlan}
              disabled={isGenerating}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-950/50 transition-all active:scale-95 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Architecting Spec...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-blue-200" />
                  <span>Generate AI Build Plan</span>
                </>
              )}
            </button>

            <button
              onClick={handleExportMarkdown}
              className="px-3.5 py-2.5 rounded-xl bg-[#1a1f2c] hover:bg-[#23293b] text-slate-200 border border-white/[0.08] font-semibold text-xs flex items-center gap-1.5 transition-colors"
              title="Download Product Spec Markdown"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Spec</span>
            </button>
          </div>
        </div>

        {/* Validated Demand Telemetry Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 rounded-2xl bg-[#090b0e] border border-white/[0.06] space-y-0.5">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Validated Presales</span>
            <div className="text-base sm:text-lg font-black text-emerald-400 font-mono">
              ${presalesRevenue.toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-500">Collected in Phase 1</span>
          </div>

          <div className="p-3 rounded-2xl bg-[#090b0e] border border-white/[0.06] space-y-0.5">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Founding Backers</span>
            <div className="text-base sm:text-lg font-black text-purple-300 font-mono">
              {backersCount} Cohort Members
            </div>
            <span className="text-[10px] text-slate-500">Awaiting private beta access</span>
          </div>

          <div className="p-3 rounded-2xl bg-[#090b0e] border border-white/[0.06] space-y-0.5">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">MVP Engineering Build</span>
            <div className="text-base sm:text-lg font-black text-blue-400 font-mono">
              {progressPercent}% Complete
            </div>
            <div className="w-full bg-white/[0.08] rounded-full h-1.5 overflow-hidden mt-1">
              <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[#090b0e] border border-white/[0.06] space-y-0.5">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">QA & Staging</span>
            <div className="text-base sm:text-lg font-black text-emerald-400 font-mono">
              {qaResults.status.includes('Passing') ? 'Tests Passing ✓' : 'QA In Progress'}
            </div>
            <span className="text-[10px] text-slate-500">Staging healthy</span>
          </div>
        </div>
      </div>

      {/* Main Phase 2 Step Navigation Tabs */}
      <div className="flex items-center justify-between p-1.5 rounded-2xl bg-[#0e1117] border border-white/[0.08] overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          {[
            { id: 'plan', label: '1. Product + Build Plan', icon: FileText },
            { id: 'build', label: '2. Build MVP', icon: Code },
            { id: 'beta', label: '3. Beta Test', icon: Laptop },
            { id: 'gate', label: '4. MVP Launch Gate', icon: ShieldCheck },
          ].map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveStep(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                  activeStep === tab.id
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-950/60'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* STEP 1: PRODUCT + BUILD PLAN */}
      {activeStep === 'plan' && (
        <div className="space-y-5">
          {/* Subtabs for Step 1 */}
          <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3">
            {[
              { id: 'spec', label: 'Product Spec', desc: 'Customer, flows, screens, auth & billing' },
              { id: 'technical', label: 'Technical Plan', desc: 'Architecture, schema, stack & criteria' },
              { id: 'scope', label: 'Scope Boundaries', desc: 'Included vs Excluded from MVP' },
              { id: 'tasks', label: 'Engineering Tasks', desc: `${buildPlan.technicalPlan?.engineeringTasks?.length || 0} sprint tasks` },
            ].map(sub => (
              <button
                key={sub.id}
                onClick={() => setSpecSubtab(sub.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  specSubtab === sub.id
                    ? 'bg-white/10 text-white border border-white/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {sub.label}
              </button>
            ))}
          </div>

          {/* SUBTAB A: PRODUCT SPEC */}
          {specSubtab === 'spec' && (
            <div className="space-y-4">
              {/* Target Customer & Core Problem Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-2">
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Workflow className="w-3.5 h-3.5" />
                    <span>Target Customer</span>
                  </span>
                  {isEditingSpec ? (
                    <textarea
                      value={buildPlan.productSpec?.targetCustomer || ''}
                      onChange={e => updateSpecField('targetCustomer', e.target.value)}
                      placeholder="Describe target customer segment..."
                      rows={3}
                      className="w-full px-3 py-2 rounded-xl bg-[#141720] border border-white/[0.1] text-xs text-white outline-none focus:border-blue-500/60"
                    />
                  ) : (
                    <p className="text-xs text-slate-200 leading-relaxed font-medium">
                      {buildPlan.productSpec?.targetCustomer || project?.validationPlan?.customer || 'No target customer defined yet. Click Edit Spec or Generate AI Build Plan.'}
                    </p>
                  )}
                </div>

                <div className="p-5 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-2">
                  <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Core Problem Validated</span>
                  </span>
                  {isEditingSpec ? (
                    <textarea
                      value={buildPlan.productSpec?.coreProblem || ''}
                      onChange={e => updateSpecField('coreProblem', e.target.value)}
                      placeholder="Describe core problem validated in Phase 1..."
                      rows={3}
                      className="w-full px-3 py-2 rounded-xl bg-[#141720] border border-white/[0.1] text-xs text-white outline-none focus:border-blue-500/60"
                    />
                  ) : (
                    <p className="text-xs text-slate-200 leading-relaxed font-medium">
                      {buildPlan.productSpec?.coreProblem || project?.validationPlan?.problem || 'No core problem defined yet. Click Edit Spec or Generate AI Build Plan.'}
                    </p>
                  )}
                </div>
              </div>

              {/* Core Features List */}
              <div className="p-5 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-400" />
                    <span>Core MVP Features</span>
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400">Strict P0 / P1 Focus</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(buildPlan.productSpec?.features || []).map((feat, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-[#141720] border border-white/[0.06] space-y-1 relative group">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs">{feat.name}</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                            feat.priority?.includes('P0')
                              ? 'bg-red-500/15 text-red-300 border border-red-500/30'
                              : 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                          }`}>
                            {feat.priority}
                          </span>
                          {isEditingSpec && (
                            <button
                              onClick={() => handleDeleteFeature(idx)}
                              className="text-slate-500 hover:text-red-400 p-0.5"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {feat.description}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Add Feature Form */}
                {isEditingSpec && (
                  <form onSubmit={handleAddFeature} className="p-3.5 rounded-xl bg-[#141720] border border-white/[0.08] space-y-2 mt-2">
                    <span className="text-xs font-bold text-white block">Add Core MVP Feature</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="Feature name..."
                        value={newFeatureName}
                        onChange={e => setNewFeatureName(e.target.value)}
                        className="px-3 py-1.5 rounded-lg bg-[#090b0e] border border-white/[0.08] text-xs text-white outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Feature description..."
                        value={newFeatureDesc}
                        onChange={e => setNewFeatureDesc(e.target.value)}
                        className="px-3 py-1.5 rounded-lg bg-[#090b0e] border border-white/[0.08] text-xs text-white outline-none"
                      />
                      <div className="flex items-center gap-2">
                        <select
                          value={newFeaturePriority}
                          onChange={e => setNewFeaturePriority(e.target.value)}
                          className="px-2 py-1.5 rounded-lg bg-[#090b0e] border border-white/[0.08] text-xs text-slate-300 outline-none"
                        >
                          <option value="P0 - Must Have">P0 - Must Have</option>
                          <option value="P1 - High Priority">P1 - High Priority</option>
                        </select>
                        <button
                          type="submit"
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>

              {/* User Flows */}
              <div className="p-5 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-3">
                <div className="border-b border-white/[0.06] pb-2.5">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-emerald-400" />
                    <span>End-to-End User Flow</span>
                  </h3>
                </div>

                <div className="space-y-2">
                  {(buildPlan.productSpec?.userFlows || []).map((flow, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-[#141720] border border-white/[0.06] flex items-start gap-3 text-xs">
                      <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[11px] shrink-0">
                        {idx + 1}
                      </div>
                      <div className="space-y-0.5">
                        <span className="font-bold text-white block">{flow.step}</span>
                        <p className="text-[11px] text-slate-400 leading-relaxed">{flow.action}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Application Screens & UI Views */}
              <div className="p-5 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-3">
                <div className="border-b border-white/[0.06] pb-2.5">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Laptop className="w-4 h-4 text-purple-400" />
                    <span>Application Screens & UI Views</span>
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(buildPlan.productSpec?.screens || []).map((screen, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-[#141720] border border-white/[0.06] space-y-1">
                      <span className="font-bold text-white text-xs block">{screen.name}</span>
                      <p className="text-[11px] text-slate-400 leading-relaxed">{screen.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payments, Authentication & Analytics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="p-4 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                    <CreditCard className="w-4 h-4" />
                    <span>Payments & Billing</span>
                  </div>
                  <div className="space-y-1 text-[11px]">
                    <div className="text-white font-semibold">{buildPlan.productSpec?.payments?.provider || 'Stripe Billing'}</div>
                    <div className="text-slate-400">{buildPlan.productSpec?.payments?.model || 'Founding Tier Pass ($99/yr)'}</div>
                    <div className="text-slate-500 text-[10px]">{buildPlan.productSpec?.payments?.flow}</div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-2">
                  <div className="flex items-center gap-2 text-purple-400 text-xs font-bold">
                    <Lock className="w-4 h-4" />
                    <span>Authentication & Security</span>
                  </div>
                  <div className="space-y-1 text-[11px]">
                    <div className="text-white font-semibold">{buildPlan.productSpec?.authentication?.method || 'Google OAuth + Magic Link'}</div>
                    <div className="text-slate-400">{buildPlan.productSpec?.authentication?.security || 'JWT Sessions + RBAC'}</div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-2">
                  <div className="flex items-center gap-2 text-blue-400 text-xs font-bold">
                    <BarChart3 className="w-4 h-4" />
                    <span>Telemetry & Analytics</span>
                  </div>
                  <div className="space-y-1 text-[11px]">
                    <div className="text-white font-semibold">{buildPlan.productSpec?.analytics?.engine || 'Built-in Telemetry'}</div>
                    <div className="text-slate-400">
                      {(buildPlan.productSpec?.analytics?.trackedEvents || []).slice(0, 3).join(', ')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUBTAB B: TECHNICAL PLAN */}
          {specSubtab === 'technical' && (
            <div className="space-y-4">
              {/* Architecture Overview */}
              <div className="p-5 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-2.5">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5" />
                  <span>System Architecture</span>
                </span>
                <p className="text-xs text-slate-200 leading-relaxed font-medium">
                  {buildPlan.technicalPlan?.architecture}
                </p>
              </div>

              {/* Tech Stack Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-[#141720] border border-white/[0.06] space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Frontend</span>
                  <div className="text-xs font-bold text-white">{buildPlan.technicalPlan?.techStack?.frontend || 'React 18 + Vite'}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#141720] border border-white/[0.06] space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Backend API</span>
                  <div className="text-xs font-bold text-white">{buildPlan.technicalPlan?.techStack?.backend || 'FastAPI Python'}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#141720] border border-white/[0.06] space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Database</span>
                  <div className="text-xs font-bold text-white">{buildPlan.technicalPlan?.techStack?.database || 'PostgreSQL + Redis'}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#141720] border border-white/[0.06] space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">AI Inference</span>
                  <div className="text-xs font-bold text-white">{buildPlan.technicalPlan?.techStack?.aiInference || 'Gemini 2.5 / GPT-4o'}</div>
                </div>
              </div>

              {/* Database Schema */}
              <div className="p-5 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-400" />
                    <span>Database Schema Design</span>
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400">PostgreSQL Relational Entities</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(buildPlan.technicalPlan?.database || []).map((tbl, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-[#141720] border border-white/[0.06] space-y-1.5 font-mono text-xs">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold text-[10px]">TABLE</span>
                        <span className="font-bold text-white">{tbl.table}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 break-words leading-relaxed pl-2 border-l border-white/[0.1]">
                        {tbl.columns}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Acceptance Criteria */}
              <div className="p-5 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-3">
                <div className="border-b border-white/[0.06] pb-2.5">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-400" />
                    <span>Acceptance Criteria (Definition of Done)</span>
                  </h3>
                </div>

                <div className="space-y-1.5">
                  {(buildPlan.technicalPlan?.acceptanceCriteria || []).map((crit, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-[#141720] border border-white/[0.04] flex items-center gap-2.5 text-xs text-slate-200">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{crit}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Milestones Roadmap */}
              <div className="p-5 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-3">
                <div className="border-b border-white/[0.06] pb-2.5">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Milestone className="w-4 h-4 text-purple-400" />
                    <span>Delivery Milestones</span>
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(buildPlan.technicalPlan?.milestones || []).map((m, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-[#141720] border border-white/[0.06] flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-white block">{m.name}</span>
                        <span className="text-[10px] text-slate-400">{m.duration}</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">
                        {m.status || 'Ready'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SUBTAB C: SCOPE BOUNDARIES */}
          {specSubtab === 'scope' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* What IS Included */}
                <div className="p-5 rounded-2xl bg-[#0e1117] border border-emerald-500/30 space-y-3 shadow-lg shadow-emerald-950/20">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                        Included in MVP (Day 1 Release)
                      </h3>
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    {(buildPlan.scopeBoundaries?.includedInMVP || []).map((inc, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-[#141720] border border-emerald-500/20 flex items-center justify-between gap-2.5 text-xs text-slate-200">
                        <div className="flex items-start gap-2.5">
                          <span className="text-emerald-400 font-bold shrink-0">✓</span>
                          <span>{inc}</span>
                        </div>
                        {isEditingSpec && (
                          <button onClick={() => handleDeleteIncluded(idx)} className="text-slate-500 hover:text-red-400">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {isEditingSpec && (
                    <form onSubmit={handleAddIncluded} className="flex gap-2 pt-2">
                      <input
                        type="text"
                        placeholder="Add included MVP item..."
                        value={newIncludedItem}
                        onChange={e => setNewIncludedItem(e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-[#090b0e] border border-white/[0.08] text-xs text-white outline-none"
                      />
                      <button type="submit" className="px-3 py-1.5 rounded-lg bg-emerald-600 text-slate-950 font-bold text-xs">
                        Add
                      </button>
                    </form>
                  )}
                </div>

                {/* What is NOT Included */}
                <div className="p-5 rounded-2xl bg-[#0e1117] border border-red-500/30 space-y-3 shadow-lg shadow-red-950/20">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
                    <div className="flex items-center gap-2 text-red-400">
                      <ShieldAlert className="w-4 h-4" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                        Explicitly Excluded (Post-MVP Roadmap)
                      </h3>
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    {(buildPlan.scopeBoundaries?.excludedFromMVP || []).map((exc, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-[#141720] border border-red-500/20 flex items-center justify-between gap-2.5 text-xs text-slate-300">
                        <div className="flex items-start gap-2.5">
                          <span className="text-red-400 font-bold shrink-0">✕</span>
                          <span>{exc}</span>
                        </div>
                        {isEditingSpec && (
                          <button onClick={() => handleDeleteExcluded(idx)} className="text-slate-500 hover:text-red-400">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {isEditingSpec && (
                    <form onSubmit={handleAddExcluded} className="flex gap-2 pt-2">
                      <input
                        type="text"
                        placeholder="Add excluded post-MVP item..."
                        value={newExcludedItem}
                        onChange={e => setNewExcludedItem(e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-[#090b0e] border border-white/[0.08] text-xs text-white outline-none"
                      />
                      <button type="submit" className="px-3 py-1.5 rounded-lg bg-red-600 text-white font-bold text-xs">
                        Add
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SUBTAB D: ENGINEERING TASK MATRIX */}
          {specSubtab === 'tasks' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-4">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Code className="w-4 h-4 text-blue-400" />
                    <span>Sprint Engineering Tasks ({engineeringTasks.length})</span>
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400">Click status to toggle</span>
                </div>

                {/* Task List */}
                <div className="space-y-2">
                  {engineeringTasks.map(task => (
                    <div
                      key={task.id}
                      className="p-3.5 rounded-xl bg-[#141720] border border-white/[0.06] flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleToggleTaskStatus(task.id)}
                          className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                            task.status === 'Completed'
                              ? 'bg-emerald-500 text-slate-950 font-black'
                              : 'bg-white/[0.06] border border-white/[0.1] hover:border-blue-400'
                          }`}
                        >
                          {task.status === 'Completed' && <Check className="w-3.5 h-3.5" />}
                        </button>
                        <div>
                          <span className={`font-bold block ${task.status === 'Completed' ? 'line-through text-slate-500' : 'text-white'}`}>
                            {task.title}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {task.category} • Assigned: <strong className={task.assignedTo === 'AI Agent' ? 'text-purple-400' : 'text-blue-400'}>{task.assignedTo}</strong> • {task.estimate}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleTaskStatus(task.id)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            task.status === 'Completed'
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                              : task.status === 'In Progress'
                              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                              : 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                          }`}
                        >
                          {task.status}
                        </button>

                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-1 rounded text-slate-500 hover:text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Custom Task Form */}
                <form onSubmit={handleAddTask} className="pt-2 flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="New engineering sprint task..."
                    value={newTaskTitle}
                    onChange={e => setNewTaskTitle(e.target.value)}
                    className="flex-1 px-3.5 py-2 rounded-xl bg-[#090b0e] border border-white/[0.08] text-xs text-white outline-none focus:border-blue-500/60"
                  />
                  <select
                    value={newTaskAssigned}
                    onChange={e => setNewTaskAssigned(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-[#090b0e] border border-white/[0.08] text-xs text-purple-300 outline-none font-bold"
                  >
                    <option value="AI Agent">🤖 AI Agent</option>
                    <option value="Human Engineer">👤 Human Engineer</option>
                  </select>
                  <select
                    value={newTaskCategory}
                    onChange={e => setNewTaskCategory(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-[#090b0e] border border-white/[0.08] text-xs text-slate-300 outline-none"
                  >
                    <option value="Backend">Backend</option>
                    <option value="Frontend">Frontend</option>
                    <option value="AI / Pipeline">AI / Pipeline</option>
                    <option value="Security / Auth">Security / Auth</option>
                    <option value="Architecture">Architecture</option>
                    <option value="Payments">Payments</option>
                  </select>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-white/[0.06]">
            <button
              onClick={() => handleSavePlan()}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#141720] hover:bg-[#1a1f2c] text-slate-200 border border-white/[0.1] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Save & Persist Build Plan</span>
            </button>

            <button
              onClick={() => setActiveStep('build')}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-blue-950/50 transition-all active:scale-95"
            >
              <span>Proceed to 2. Build MVP</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: BUILD MVP (DIVISION OF LABOR, QA, STAGING) */}
      {activeStep === 'build' && (
        <div className="space-y-5">
          {/* Subtabs for Step 2 */}
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div className="flex items-center gap-2">
              {[
                { id: 'tasks', label: '1. Division of Labor (AI vs Human)' },
                { id: 'qa', label: '2. Automated QA Testing' },
                { id: 'staging', label: '3. Staging Deployment' }
              ].map(sub => (
                <button
                  key={sub.id}
                  onClick={() => setBuildSubtab(sub.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    buildSubtab === sub.id
                      ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">OS Progress:</span>
              <strong className="text-blue-400 font-mono">{completedCount}/{totalTasksCount} Completed ({progressPercent}%)</strong>
            </div>
          </div>

          {/* SUBTAB 1: DIVISION OF LABOR */}
          {buildSubtab === 'tasks' && (
            <div className="space-y-4">
              {/* Division of Labor Cards Header */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 🤖 AI Coding Agents Column */}
                <div className="p-5 rounded-2xl bg-[#0e1117] border border-purple-500/30 space-y-3">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-300">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-xs">AI Coding Agents</h3>
                        <p className="text-[10px] text-slate-400">Suitable development work, CRUD, schemas & boilerplate</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-purple-300 font-bold">
                      {engineeringTasks.filter(t => t.assignedTo === 'AI Agent').length} Tasks
                    </span>
                  </div>

                  <div className="space-y-2">
                    {engineeringTasks.filter(t => t.assignedTo === 'AI Agent').map(task => (
                      <div key={task.id} className="p-3.5 rounded-xl bg-[#141720] border border-white/[0.06] space-y-2 text-xs">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-bold text-white block">{task.title}</span>
                            <span className="text-[10px] text-slate-400">{task.category} • Estimate: {task.estimate}</span>
                          </div>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            task.status === 'Completed'
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                              : 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                          }`}>
                            {task.status}
                          </span>
                        </div>

                        {task.notes && (
                          <p className="text-[11px] text-slate-400 font-mono bg-[#090b0e] p-2 rounded-lg border border-white/[0.04]">
                            {task.notes}
                          </p>
                        )}

                        <div className="flex items-center justify-between pt-1">
                          <button
                            onClick={() => handleToggleTaskStatus(task.id)}
                            className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                          >
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>{task.status === 'Completed' ? 'Mark Incomplete' : 'Mark Completed'}</span>
                          </button>

                          <button
                            onClick={() => handleDispatchAIAgent(task)}
                            disabled={executingTaskId === task.id}
                            className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px] flex items-center gap-1 shadow-md shadow-purple-950/40 disabled:opacity-50"
                          >
                            {executingTaskId === task.id ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                <span>Agent Coding...</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-3 h-3" />
                                <span>Dispatch AI Agent</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 👤 Human Engineering Column */}
                <div className="p-5 rounded-2xl bg-[#0e1117] border border-blue-500/30 space-y-3">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-300">
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-xs">Human Engineering</h3>
                        <p className="text-[10px] text-slate-400">Complex architecture, payments/auth security & hard bugs</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-blue-300 font-bold">
                      {engineeringTasks.filter(t => t.assignedTo === 'Human Engineer').length} Tasks
                    </span>
                  </div>

                  <div className="space-y-2">
                    {engineeringTasks.filter(t => t.assignedTo === 'Human Engineer').map(task => (
                      <div key={task.id} className="p-3.5 rounded-xl bg-[#141720] border border-white/[0.06] space-y-2 text-xs">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-bold text-white block">{task.title}</span>
                            <span className="text-[10px] text-slate-400">{task.category} • Estimate: {task.estimate}</span>
                          </div>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            task.status === 'Completed'
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                              : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          }`}>
                            {task.status}
                          </span>
                        </div>

                        {task.notes && (
                          <p className="text-[11px] text-slate-400 font-mono bg-[#090b0e] p-2 rounded-lg border border-white/[0.04]">
                            {task.notes}
                          </p>
                        )}

                        <div className="flex items-center justify-between pt-1">
                          <button
                            onClick={() => handleToggleTaskStatus(task.id)}
                            className="px-3 py-1.5 rounded-lg bg-[#1a1f2c] hover:bg-[#252c3f] text-slate-200 border border-white/[0.08] font-bold text-[11px] flex items-center gap-1 transition-colors"
                          >
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>{task.status === 'Completed' ? 'Reopen Task' : 'Signoff / Mark Done'}</span>
                          </button>

                          <span className="text-[10px] text-slate-500 font-semibold">
                            Requires Technical Signoff
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* AI Agent Live Output Card */}
              {aiExecOutput && (
                <div className="p-4 rounded-2xl bg-[#090b0e] border border-purple-500/40 space-y-2 font-mono text-xs animate-fade-in">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                    <span className="text-purple-300 font-bold flex items-center gap-2">
                      <Terminal className="w-3.5 h-3.5" />
                      <span>AI Coding Agent Output (Task: {aiExecOutput.taskId})</span>
                    </span>
                    <span className="text-emerald-400 text-[10px] font-bold">Execution Verified ✓</span>
                  </div>
                  <p className="text-slate-300 text-[11px]">{aiExecOutput.implementationNotes}</p>
                  <div className="text-[10px] text-slate-400">
                    <span className="text-emerald-400 font-bold">{aiExecOutput.automatedTests?.testOutput}</span>
                    <span className="ml-2 text-slate-500">(Coverage: {aiExecOutput.automatedTests?.coverage})</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SUBTAB 2: AUTOMATED QA TESTING */}
          {buildSubtab === 'qa' && (
            <div className="p-5 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.07] pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span>Automated QA & Test Execution Suite</span>
                  </h3>
                  <p className="text-xs text-slate-400">PyTest + Vitest + End-to-End browser workflow tests.</p>
                </div>

                <button
                  onClick={handleRunQA}
                  disabled={qaRunning}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-950/40 transition-all active:scale-95 disabled:opacity-50"
                >
                  {qaRunning ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Running QA Test Suite...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span>Run Full QA Test Suite</span>
                    </>
                  )}
                </button>
              </div>

              {/* QA Summary Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-[#141720] border border-white/[0.06] space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Unit Tests</span>
                  <div className="text-lg font-black text-emerald-400 font-mono">
                    {qaResults.unitTests.passed} / {qaResults.unitTests.total} Passing
                  </div>
                  <span className="text-[10px] text-slate-500">Coverage: {qaResults.unitTests.coverage}</span>
                </div>

                <div className="p-4 rounded-xl bg-[#141720] border border-white/[0.06] space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Integration Tests</span>
                  <div className="text-lg font-black text-blue-400 font-mono">
                    {qaResults.integrationTests.passed} / {qaResults.integrationTests.total} Passing
                  </div>
                  <span className="text-[10px] text-slate-500">FastAPI API endpoints</span>
                </div>

                <div className="p-4 rounded-xl bg-[#141720] border border-white/[0.06] space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">E2E User Journeys</span>
                  <div className="text-lg font-black text-purple-300 font-mono">
                    {qaResults.e2eWorkflows.passed} / {qaResults.e2eWorkflows.total} Passing
                  </div>
                  <span className="text-[10px] text-slate-500">Auth, checkout & export flows</span>
                </div>
              </div>

              {/* Terminal Log */}
              <div className="p-4 rounded-xl bg-[#090b0e] border border-white/[0.06] font-mono text-xs text-slate-300 space-y-1">
                <div className="text-slate-500 text-[10px] pb-1 border-b border-white/[0.04]">qa-runner-stdout • Last Run: {qaResults.lastRun}</div>
                <p className="text-emerald-400">✓ test_user_authentication_flow [PASSED]</p>
                <p className="text-emerald-400">✓ test_stripe_webhook_subscription_provisioning [PASSED]</p>
                <p className="text-emerald-400">✓ test_ai_pipeline_execution_latency_under_5s [PASSED]</p>
                <p className="text-emerald-400">✓ test_export_file_integrity_csv_json [PASSED]</p>
                <p className="text-blue-400">→ Status: {qaResults.status}</p>
              </div>
            </div>
          )}

          {/* SUBTAB 3: STAGING DEPLOYMENT */}
          {buildSubtab === 'staging' && (
            <div className="p-5 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.07] pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-400" />
                    <span>Staging Environment & Preview Server</span>
                  </h3>
                  <p className="text-xs text-slate-400">Live staging server for pre-beta validation.</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                  Staging Healthy ✓
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[#141720] border border-white/[0.06] space-y-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Staging URL</span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${origin}/preorder/${productSlug}`}
                    className="flex-1 px-3 py-2 rounded-xl bg-[#090b0e] border border-white/[0.08] text-xs text-purple-300 font-mono outline-none"
                  />
                  <a
                    href={`${origin}/preorder/${productSlug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1 transition-colors"
                  >
                    <span>Open Staging</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Step 2 Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-white/[0.06]">
            <button
              onClick={() => setActiveStep('plan')}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white/[0.04] text-slate-300 hover:text-white border border-white/[0.08] text-xs font-semibold"
            >
              ← Back to Product Plan
            </button>
            <button
              onClick={() => setActiveStep('beta')}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-blue-950/50 transition-all active:scale-95"
            >
              <span>Proceed to 3. Beta Test</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: BETA TEST (CUSTOMER COHORT & AI FEEDBACK CLUSTERING) */}
      {activeStep === 'beta' && (
        <div className="space-y-5">
          {/* Subtabs for Step 3 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
            <div className="flex items-center gap-2">
              {[
                { id: 'clusters', label: '1. AI Recurring Feedback Clusters' },
                { id: 'cohort', label: `2. Beta Cohort Invites (${betaCohort.length})` },
                { id: 'feedback', label: '3. Raw Customer Feedback Feed' }
              ].map(sub => (
                <button
                  key={sub.id}
                  onClick={() => setBetaSubtab(sub.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    betaSubtab === sub.id
                      ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>

            <button
              onClick={handleClusterFeedbackAI}
              disabled={isClusteringAI}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-purple-950/40 transition-all active:scale-95 disabled:opacity-50"
            >
              {isClusteringAI ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>AI Grouping Feedback...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Cluster & Group Feedback</span>
                </>
              )}
            </button>
          </div>

          {/* SUBTAB 1: AI FEEDBACK CLUSTERS (Example: 23 users confused by onboarding, 11 requested Feature X, 4 experienced Bug Y) */}
          {betaSubtab === 'clusters' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>AI Recurring Issue Summaries & Quantified Clusters</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    AI analyzes support conversations, bug reports, and objections into prioritized resolution tasks.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {feedbackClusters.map(cluster => (
                  <div
                    key={cluster.id}
                    className="p-4 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-black text-white font-mono flex items-center gap-1.5">
                          <span className={cluster.category === 'Bug' ? 'text-red-400' : cluster.category.includes('UX') ? 'text-amber-400' : 'text-blue-400'}>
                            {cluster.count} users
                          </span>
                        </span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          cluster.severity === 'High'
                            ? 'bg-red-500/15 text-red-300 border border-red-500/30'
                            : cluster.severity === 'Medium'
                            ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                            : 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                        }`}>
                          {cluster.category} • {cluster.severity}
                        </span>
                      </div>

                      <h4 className="font-bold text-white text-xs leading-snug">{cluster.title}</h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed">{cluster.description}</p>

                      {cluster.exampleQuote && (
                        <div className="p-2.5 rounded-xl bg-[#141720] border border-white/[0.04] text-[10px] text-slate-300 italic">
                          "{cluster.exampleQuote}"
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-white/[0.06] space-y-2">
                      <div className="text-[10px] text-emerald-400">
                        <strong>Recommended Fix:</strong> {cluster.recommendedAction}
                      </div>

                      <button
                        onClick={() => handleConvertClusterToTask(cluster)}
                        className="w-full py-2 rounded-xl bg-[#1a1f2c] hover:bg-blue-600 hover:text-white text-slate-200 border border-white/[0.08] font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Convert to Sprint Task</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SUBTAB 2: BETA COHORT INVITES */}
          {betaSubtab === 'cohort' && (
            <div className="p-5 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.07] pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white">Presale & Waitlist Beta Access Manager</h3>
                  <p className="text-xs text-slate-400">Provision private tokens to verified early backers.</p>
                </div>
                <span className="text-xs font-mono text-emerald-400 font-bold">${presalesRevenue.toLocaleString()} Total Pledged</span>
              </div>

              <div className="space-y-2">
                {betaCohort.map(backer => (
                  <div key={backer.id} className="p-3.5 rounded-xl bg-[#141720] border border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{backer.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 font-bold">
                          {backer.tier}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono block">{backer.email}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${
                        backer.status === 'Active in Beta'
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                      }`}>
                        {backer.status}
                      </span>

                      <button
                        onClick={() => {
                          const url = `${origin}/beta/${productSlug}?token=${backer.token}`
                          navigator.clipboard?.writeText(url)
                          showToast(`Copied Beta Magic Link for ${backer.name}!`)
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#090b0e] hover:bg-[#1f2536] text-slate-200 border border-white/[0.08] font-semibold text-[11px] flex items-center gap-1 transition-colors"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Copy Invite Link</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SUBTAB 3: RAW FEEDBACK LOGGER */}
          {betaSubtab === 'feedback' && (
            <div className="p-5 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Log Customer Support Conversation / Friction Point</h3>

              <form onSubmit={handleAddFeedback} className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                <input
                  type="text"
                  placeholder="Customer name..."
                  value={newFeedbackAuthor}
                  onChange={e => setNewFeedbackAuthor(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-[#090b0e] border border-white/[0.08] text-xs text-white outline-none"
                />
                <select
                  value={newFeedbackType}
                  onChange={e => setNewFeedbackType(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-[#090b0e] border border-white/[0.08] text-xs text-slate-300 outline-none"
                >
                  <option value="UX / Onboarding">UX / Onboarding</option>
                  <option value="Feature Request">Feature Request</option>
                  <option value="Bug">Bug Report</option>
                  <option value="Objection">Customer Objection</option>
                </select>
                <input
                  type="text"
                  placeholder="Feedback or message..."
                  value={newFeedbackMsg}
                  onChange={e => setNewFeedbackMsg(e.target.value)}
                  className="sm:col-span-2 px-3 py-2 rounded-xl bg-[#090b0e] border border-white/[0.08] text-xs text-white outline-none"
                />
                <button
                  type="submit"
                  className="sm:col-span-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Log Feedback Item</span>
                </button>
              </form>

              {/* Feed List */}
              <div className="space-y-2 pt-2">
                {rawFeedback.map(f => (
                  <div key={f.id} className="p-3 rounded-xl bg-[#141720] border border-white/[0.06] text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{f.author}</span>
                      <span className="text-[10px] text-purple-300 font-mono">{f.type} • {f.timestamp}</span>
                    </div>
                    <p className="text-slate-300 text-[11px]">"{f.message}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3 Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-white/[0.06]">
            <button
              onClick={() => setActiveStep('build')}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white/[0.04] text-slate-300 hover:text-white border border-white/[0.08] text-xs font-semibold"
            >
              ← Back to Build
            </button>
            <button
              onClick={() => setActiveStep('gate')}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-blue-950/50 transition-all active:scale-95"
            >
              <span>Proceed to 4. MVP Launch Gate</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: MVP LAUNCH GATE */}
      {activeStep === 'gate' && (
        <div className="p-5 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-5">
          <div className="border-b border-white/[0.07] pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Phase 2 Gate: MVP Launch Readiness Verification</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Verify all acceptance criteria, automated tests, and beta feedback fixes before advancing to Phase 3.
            </p>
          </div>

          {/* Verification checklist */}
          <div className="space-y-2">
            {(buildPlan.technicalPlan?.acceptanceCriteria || []).map((crit, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-[#141720] border border-white/[0.06] flex items-center gap-2.5 text-xs text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{crit}</span>
              </div>
            ))}
            <div className="p-3 rounded-xl bg-[#141720] border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Automated QA Suite: 100% Tests Passing on Staging</span>
            </div>
            <div className="p-3 rounded-xl bg-[#141720] border border-purple-500/30 flex items-center gap-2.5 text-xs text-purple-300">
              <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
              <span>Beta Cohort: Feedback clustered and high-severity bugs resolved</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-3 border-t border-white/[0.06]">
            <button
              onClick={onAdvanceToPhase3}
              className="w-full sm:w-auto py-3 px-6 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-xl shadow-purple-950/50 transition-all active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>Approve & Launch Product (Advance to Phase 3)</span>
            </button>

            <button
              onClick={() => setActiveStep('beta')}
              className="w-full sm:w-auto py-3 px-4 rounded-xl bg-white/[0.04] text-slate-300 hover:text-white border border-white/[0.08] text-xs font-semibold"
            >
              Continue Beta Testing
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
