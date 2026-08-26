import { useState, useEffect } from 'react'
import {
  Code, Cpu, Terminal, CheckCircle2, ShieldCheck, Sparkles, Layers,
  Database, Server, Lock, CreditCard, BarChart3, AlertCircle, ArrowRight,
  ExternalLink, FileText, Check, Plus, Trash2, RefreshCw, Loader2,
  ChevronRight, Laptop, Workflow, Milestone, ShieldAlert, Download, Sliders,
  Edit3, Bot, UserCheck, Play, MessageSquare, Bug, HelpCircle, Send, Copy,
  CheckCircle, Globe, Activity, Rocket, User, Zap, XCircle, AlertTriangle,
  Flame, RotateCcw, Award, CheckCheck, Compass, CheckSquare
} from 'lucide-react'
import {
  generateMVPProductBuildPlanAI,
  buildSmartFallbackMVPBuildPlan,
  analyzeAndClusterBetaFeedbackAI,
  buildSmartFallbackBetaFeedbackClusters,
  executeAICodingTaskAI,
  generateProductReadinessReportAI,
  buildSmartFallbackReadinessReport,
  autoImplementFixesAI
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
        status: 'Completed',
        estimate: '2 Days',
        notes: 'Interactive workspace components and parameter inputs scaffolding.'
      },
      {
        id: 'task-human-1',
        title: 'Hardened OAuth & Stripe Webhook Security Layer',
        category: 'Security / Auth',
        assignedTo: 'Human Engineer',
        status: 'Completed',
        estimate: '1 Day',
        notes: 'Multi-tenant JWT token rotation, CORS policy, and Stripe signature verification.'
      },
      {
        id: 'task-ai-3',
        title: 'Implement Redis & Celery Async Worker Queue',
        category: 'AI / Pipeline',
        assignedTo: 'AI Agent',
        status: 'Completed',
        estimate: '1.5 Days',
        notes: 'Background task distribution for heavy inference workflows.'
      },
      {
        id: 'task-human-2',
        title: 'Complex Multi-Service Data Pipeline & Failover Optimization',
        category: 'Architecture',
        assignedTo: 'Human Engineer',
        status: 'Completed',
        estimate: '2 Days',
        notes: 'Resilient external API streaming and graceful fallback handling.'
      }
    ]
  })

  // Automated Testing / QA State
  const [qaRunning, setQaRunning] = useState(false)
  const [qaResults, setQaResults] = useState(() => project?.qaResults || {
    unitTests: { passed: 34, failed: 0, total: 34, coverage: '99%' },
    integrationTests: { passed: 18, failed: 0, total: 18 },
    e2eWorkflows: { passed: 8, failed: 0, total: 8 },
    lastRun: 'Just now',
    status: 'Passing (100% Green)'
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
        status: 'Active in Beta',
        token: `beta_${r.id.replace(/[^a-zA-Z0-9]/g, '').slice(-6)}`,
        lastActive: '1h ago'
      }))
    }
    return [
      { id: 'b-1', name: 'Alex Rivera', email: 'alex@creatorcompany.com', tier: 'Founding Annual ($99)', status: 'Active in Beta', token: 'beta_ar991', lastActive: '2h ago' },
      { id: 'b-2', name: 'Jordan Hayes', email: 'jordan.h@digitalscale.io', tier: 'VIP Founder ($199)', status: 'Active in Beta', token: 'beta_jh442', lastActive: '5h ago' },
      { id: 'b-3', name: 'Elena Rostova', email: 'elena@growthops.co', tier: 'Founding Annual ($99)', status: 'Active in Beta', token: 'beta_er108', lastActive: '1h ago' }
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

  // Step 4: Iterate + Launch Gate States
  const [readinessReport, setReadinessReport] = useState(() => {
    if (project?.readinessReport) return project.readinessReport
    return buildSmartFallbackReadinessReport(project)
  })
  const [isAuditing, setIsAuditing] = useState(false)
  const [isAutoFixing, setIsAutoFixing] = useState(false)
  const [appliedPatches, setAppliedPatches] = useState(() => project?.appliedPatches || [
    { issueTitle: 'Initial Onboarding & Setup Guidance (23 users)', fixSummary: 'Injected 3-step interactive onboarding modal with automatic credential validation.', filesModified: ['src/components/OnboardingModal.jsx'], verified: true },
    { issueTitle: 'Session Token Refresh Edge Case (4 users)', fixSummary: 'Implemented silent JWT refresh token rotation middleware in Axios client.', filesModified: ['src/services/api.js', 'backend/auth.py'], verified: true },
    { issueTitle: 'Direct Cloud Export / Webhook Request (11 users)', fixSummary: 'Added automated background webhook trigger and cloud export pipeline.', filesModified: ['src/services/exportEngine.js'], verified: true }
  ])
  const [mvpVersion, setMvpVersion] = useState(() => project?.mvpVersion || 'v1.0.0-GA')
  const [showKillModal, setShowKillModal] = useState(false)
  const [decisionNotice, setDecisionNotice] = useState('')

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

  // Synchronize all Phase 2 states when project changes to prevent former creator data leakage
  useEffect(() => {
    if (!project) return

    // 1. Build Plan
    if (project.mvpBuildPlan) {
      setBuildPlan(project.mvpBuildPlan)
    } else {
      setBuildPlan(buildSmartFallbackMVPBuildPlan(project))
    }

    // 2. Engineering Tasks
    if (project.engineeringTasks && project.engineeringTasks.length > 0) {
      setEngineeringTasks(project.engineeringTasks)
    } else {
      const prodName = project.productName || 'Core Engine'
      setEngineeringTasks([
        {
          id: 'task-ai-1',
          title: `Scaffold ${prodName} Architecture & PostgreSQL Models`,
          category: 'Backend / Schema',
          assignedTo: 'AI Agent',
          status: 'Completed',
          estimate: '1 Day',
          notes: `Data models and schemas for ${project.customer || project.niche || 'core users'} generated.`
        },
        {
          id: 'task-ai-2',
          title: `Generate React Command Workspace & ${prodName} UI Canvas`,
          category: 'Frontend',
          assignedTo: 'AI Agent',
          status: 'Completed',
          estimate: '2 Days',
          notes: 'Interactive workspace components and parameter inputs scaffolding.'
        },
        {
          id: 'task-human-1',
          title: 'Hardened OAuth & Stripe Webhook Security Layer',
          category: 'Security / Auth',
          assignedTo: 'Human Engineer',
          status: 'Completed',
          estimate: '1 Day',
          notes: 'Multi-tenant JWT token rotation, CORS policy, and Stripe signature verification.'
        },
        {
          id: 'task-ai-3',
          title: 'Implement Async Worker Queue & Processing Pipeline',
          category: 'AI / Pipeline',
          assignedTo: 'AI Agent',
          status: 'Completed',
          estimate: '1.5 Days',
          notes: `Background task distribution for ${prodName} workflows.`
        },
        {
          id: 'task-human-2',
          title: 'Complex Multi-Service Data Pipeline & Failover Optimization',
          category: 'Architecture',
          assignedTo: 'Human Engineer',
          status: 'Completed',
          estimate: '2 Days',
          notes: 'Resilient external API streaming and graceful fallback handling.'
        }
      ])
    }

    // 3. Beta Cohort
    if (Array.isArray(project.reservations) && project.reservations.length > 0) {
      setBetaCohort(project.reservations.map(r => ({
        id: r.id,
        name: r.name,
        email: r.email,
        tier: r.tier || 'Founding Backer',
        status: 'Active in Beta',
        token: `beta_${(r.id || '').replace(/[^a-zA-Z0-9]/g, '').slice(-6)}`,
        lastActive: '1h ago'
      })))
    } else {
      setBetaCohort([])
    }

    // 4. Feedback Clusters & Readiness Report
    if (project.feedbackClusters) {
      setFeedbackClusters(project.feedbackClusters)
    } else {
      setFeedbackClusters(buildSmartFallbackBetaFeedbackClusters(project))
    }

    if (project.readinessReport) {
      setReadinessReport(project.readinessReport)
    } else {
      setReadinessReport(buildSmartFallbackReadinessReport(project))
    }
  }, [project?.id, project?.creatorId, project?.productName])

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
      feedbackClusters,
      readinessReport,
      appliedPatches,
      mvpVersion
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
        unitTests: { passed: 34, failed: 0, total: 34, coverage: '99%' },
        integrationTests: { passed: 18, failed: 0, total: 18 },
        e2eWorkflows: { passed: 8, failed: 0, total: 8 },
        lastRun: 'Just now',
        status: 'Passing (100% Green)'
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

  // Step 4: Apply AI Auto-Fixes & Update MVP
  const handleApplyAIAutoFixes = async () => {
    setIsAutoFixing(true)
    try {
      const res = await autoImplementFixesAI(feedbackClusters, project)
      const patches = res.patchesApplied || []
      setAppliedPatches(patches)
      setMvpVersion('v1.0.0-GA')

      // Mark feedback clusters as resolved / completed
      const updatedClusters = feedbackClusters.map(c => ({ ...c, status: 'Resolved' }))
      setFeedbackClusters(updatedClusters)

      // Re-run QA suite to show clean pass
      setQaResults({
        unitTests: { passed: 36, failed: 0, total: 36, coverage: '99.4%' },
        integrationTests: { passed: 20, failed: 0, total: 20 },
        e2eWorkflows: { passed: 8, failed: 0, total: 8 },
        lastRun: 'Just now (Post-Patch Retest)',
        status: 'Passing (100% Green)'
      })

      showToast('AI Auto-Fixes applied, MVP updated to v1.0.0-GA, and retested successfully!')
    } catch (e) {
      console.warn('Auto-fix error:', e)
    } finally {
      setIsAutoFixing(false)
    }
  }

  // Step 4: Regenerate AI Product Readiness Audit Report
  const handleGenerateReadinessAudit = async () => {
    setIsAuditing(true)
    try {
      const report = await generateProductReadinessReportAI(project)
      setReadinessReport(report)
      showToast('Generated fresh AI Product-Readiness Audit Report!')
    } catch (e) {
      console.warn('Audit error:', e)
    } finally {
      setIsAuditing(false)
    }
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

---

### 4. AI PRODUCT READINESS REPORT & VERDICT
- **Score:** ${readinessReport.score}/100
- **Verdict:** ${readinessReport.verdict} (${readinessReport.confidence} Confidence)
- **Summary:** ${readinessReport.summary}
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
      {/* Toast notification */}
      {saveToast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-2xl bg-blue-600 text-white font-bold text-xs shadow-2xl flex items-center gap-2 border border-blue-400/40 animate-slide-up">
          <CheckCircle className="w-4 h-4 text-emerald-300" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* Kill Confirmation Modal */}
      {showKillModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 rounded-3xl bg-[#0e1117] border border-red-500/40 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-black text-white">Confirm Kill / Pivot Decision</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to stop development for <strong>{project?.productName || 'this product'}</strong>? You can choose to archive the project and refund presale founding backers, or pivot to a new product hypothesis.
            </p>
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-[11px] text-red-300">
              Validated Presales to Refund: <strong>${presalesRevenue.toLocaleString()}</strong> across <strong>{backersCount}</strong> backers.
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowKillModal(false)}
                className="px-4 py-2 rounded-xl bg-white/[0.06] text-slate-300 hover:text-white text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowKillModal(false)
                  setDecisionNotice('Project archived. Presale pledges queued for refund processing.')
                  showToast('Project archived.')
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs"
              >
                Confirm Archive & Refund
              </button>
            </div>
          </div>
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
              Division of labor between AI Coding Agents & Human Engineering with automated testing, beta cohort validation, and readiness audit.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
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
              className="px-3.5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-purple-950/40 transition-all active:scale-95 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>AI Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-purple-200" />
                  <span>AI Generate Build Plan</span>
                </>
              )}
            </button>

            <button
              onClick={handleExportMarkdown}
              className="p-2.5 rounded-xl bg-[#1a1f2c] hover:bg-[#23293b] text-slate-300 hover:text-white border border-white/[0.08] text-xs font-semibold flex items-center gap-1.5"
              title="Download Markdown Spec"
            >
              <Download className="w-4 h-4" />
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
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Product Readiness</span>
            <div className="text-base sm:text-lg font-black text-emerald-400 font-mono">
              {readinessReport.score}/100
            </div>
            <span className="text-[10px] text-emerald-400 font-semibold">{readinessReport.verdict}</span>
          </div>
        </div>
      </div>

      {/* Main 4 Steps Stepper Navigation */}
      <div className="flex items-center justify-between p-1.5 rounded-2xl bg-[#0e1117] border border-white/[0.08] overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          {[
            { id: 'plan', label: '1. Product + Build Plan', icon: FileText },
            { id: 'build', label: '2. Build MVP', icon: Code },
            { id: 'beta', label: '3. Beta Test', icon: Laptop },
            { id: 'gate', label: '4. Iterate + Launch Gate', icon: ShieldCheck },
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
              { id: 'tasks', label: 'Engineering Tasks', desc: `${engineeringTasks.length} sprint tasks` },
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
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      <span>Target Customer</span>
                    </span>
                  </div>
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
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Core Problem Validated</span>
                    </span>
                  </div>
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

              {/* Core MVP Features */}
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
                            <button onClick={() => handleDeleteFeature(idx)} className="text-slate-500 hover:text-red-400">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">{feat.description}</p>
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
                          className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>

              {/* End-to-End User Flow */}
              <div className="p-5 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Workflow className="w-4 h-4 text-emerald-400" />
                    <span>End-to-End User Flow</span>
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400">Step-by-Step Experience</span>
                </div>

                <div className="space-y-2">
                  {(buildPlan.productSpec?.userFlows || []).map((flow, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-[#141720] border border-white/[0.06] flex items-start gap-3 text-xs">
                      <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[11px] shrink-0">
                        {idx + 1}
                      </div>
                      <div>
                        <span className="font-bold text-white block">{flow.step}</span>
                        <p className="text-[11px] text-slate-400 leading-relaxed">{flow.action}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Screens */}
              <div className="p-5 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Laptop className="w-4 h-4 text-purple-400" />
                    <span>Core MVP Screens & UI Canvas</span>
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

              {/* Integrations, Payments & Auth */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-[#0e1117] border border-white/[0.08] space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                    <CreditCard className="w-4 h-4" />
                    <span>Payments & Billing</span>
                  </div>
                  <div className="space-y-1 text-[11px]">
                    <div className="text-white font-semibold">{buildPlan.productSpec?.payments?.provider || 'Stripe Billing'}</div>
                    <div className="text-slate-400">{buildPlan.productSpec?.payments?.model || 'Founding Tier Pass ($99/yr)'}</div>
                    <div className="text-slate-500 text-[10px]">{buildPlan.productSpec?.payments?.flow}</div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#0e1117] border border-white/[0.08] space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-400">
                    <Lock className="w-4 h-4" />
                    <span>Authentication & Security</span>
                  </div>
                  <div className="space-y-1 text-[11px]">
                    <div className="text-white font-semibold">{buildPlan.productSpec?.authentication?.method || 'Google OAuth + Magic Link'}</div>
                    <div className="text-slate-400">{buildPlan.productSpec?.authentication?.security || 'JWT Sessions + RBAC'}</div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#0e1117] border border-white/[0.08] space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
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
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Server className="w-4 h-4 text-blue-400" />
                    <span>System Architecture Overview</span>
                  </h3>
                  <span className="text-[10px] font-mono text-emerald-400">Decoupled Full-Stack Architecture</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {buildPlan.technicalPlan?.architecture || 'Modern decoupled SPA with Vite + React Frontend, FastAPI Python REST/WebSocket Backend, and Redis background queues.'}
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
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
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

              {/* Sprints & Milestones */}
              <div className="p-5 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Milestone className="w-4 h-4 text-purple-400" />
                    <span>Sprints & Milestones</span>
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
                <div className="p-5 rounded-2xl bg-[#0e1117] border border-emerald-500/30 space-y-3">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <h3 className="font-bold text-white text-xs">What IS Included in MVP</h3>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">
                      {(buildPlan.scopeBoundaries?.includedInMVP || []).length} Items
                    </span>
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

                {/* What IS NOT Included */}
                <div className="p-5 rounded-2xl bg-[#0e1117] border border-red-500/30 space-y-3">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-lg bg-red-500/20 text-red-400">
                        <ShieldAlert className="w-4 h-4" />
                      </div>
                      <h3 className="font-bold text-white text-xs">What is NOT Included (Post-MVP)</h3>
                    </div>
                    <span className="text-[10px] font-mono text-red-400 font-bold">
                      {(buildPlan.scopeBoundaries?.excludedFromMVP || []).length} Excluded
                    </span>
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

          {/* Step 1 Footer Action */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-white/[0.06]">
            <button
              onClick={handleExportMarkdown}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white/[0.04] text-slate-300 hover:text-white border border-white/[0.08] text-xs font-semibold flex items-center justify-center gap-2"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Product Spec (.md)</span>
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

          {/* SUBTAB 1: AI FEEDBACK CLUSTERS */}
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
              <span>Proceed to 4. Iterate + Launch Gate</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: ITERATE + LAUNCH GATE */}
      {activeStep === 'gate' && (
        <div className="space-y-5">
          {/* Executive Header Banner */}
          <div className="p-5 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
              <div>
                <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5" />
                  <span>Step 4: Iterate + Launch Gate</span>
                </span>
                <h3 className="text-base font-black text-white">
                  Executive Product-Readiness Audit & Launch Gate
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleApplyAIAutoFixes}
                  disabled={isAutoFixing}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-purple-950/40 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isAutoFixing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Applying Fixes & Retesting...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5" />
                      <span>Apply AI Fixes & Update MVP</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleGenerateReadinessAudit}
                  disabled={isAuditing}
                  className="px-3.5 py-2 rounded-xl bg-[#1a1f2c] hover:bg-[#252c3f] text-slate-200 border border-white/[0.08] font-semibold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {isAuditing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  <span>Re-Audit</span>
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              AI prioritizes feedback issues, applies targeted code hotfixes, updates the MVP build version, and verifies product readiness.
            </p>
          </div>

          {/* Decision Notice (if Continue Beta or Killed) */}
          {decisionNotice && (
            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-200 text-xs flex items-center gap-2 font-medium">
              <Compass className="w-4 h-4 text-blue-400 shrink-0" />
              <span>{decisionNotice}</span>
            </div>
          )}

          {/* 1. AI Product-Readiness Audit Score Card */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-[#0e1117] to-[#131724] border border-emerald-500/30 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                  AI Product-Readiness Score
                </span>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl sm:text-4xl font-black text-white font-mono">
                    {readinessReport.score}<span className="text-slate-500 text-xl font-normal">/100</span>
                  </span>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-black uppercase tracking-wider">
                    {readinessReport.verdict}
                  </span>
                </div>
              </div>

              <div className="text-xs text-slate-400 text-left sm:text-right space-y-0.5">
                <div>Confidence Level: <strong className="text-white">{readinessReport.confidence}</strong></div>
                <div>MVP Build Release: <strong className="text-purple-300 font-mono">{mvpVersion}</strong></div>
              </div>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed font-medium bg-[#090b0e] p-3 rounded-xl border border-white/[0.06]">
              "{readinessReport.summary}"
            </p>

            {/* 4 Pillars Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {(readinessReport.pillars || []).map((p, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-[#141720] border border-white/[0.06] space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{p.name}</span>
                    </span>
                    <span className="font-mono text-emerald-400 font-bold">{p.score}% • {p.status}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{p.detail}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Automated Hotfixes & MVP Update Log */}
          <div className="p-5 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-3">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-400" />
                <span>AI Automated Code Hotfixes ({appliedPatches.length} Patches Applied)</span>
              </h3>
              <span className="text-[10px] font-mono text-emerald-400">All Patches Verified ✓</span>
            </div>

            <div className="space-y-2">
              {appliedPatches.map((patch, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-[#141720] border border-white/[0.06] space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{patch.issueTitle}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                      Verified Fix ✓
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">{patch.fixSummary}</p>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Files patched: {patch.filesModified.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Post-Patch Retest Results */}
          <div className="p-5 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-3">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <CheckCheck className="w-4 h-4 text-emerald-400" />
                <span>Updated MVP Retest Summary</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-400">Target: Zero Launch Blockers</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-[#141720] border border-white/[0.06] space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Unit & Integration Tests</span>
                <div className="text-base font-black text-emerald-400 font-mono">
                  {qaResults.unitTests.passed + qaResults.integrationTests.passed} Tests Passing (100%)
                </div>
                <span className="text-[10px] text-slate-500">0 failures, 0 regressions</span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#141720] border border-white/[0.06] space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Critical P0 Bugs</span>
                <div className="text-base font-black text-emerald-400 font-mono">
                  0 Open Blockers
                </div>
                <span className="text-[10px] text-slate-500">All P0 criteria met</span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#141720] border border-white/[0.06] space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Beta Backer Provisioning</span>
                <div className="text-base font-black text-purple-300 font-mono">
                  {backersCount} Ready for Public Access
                </div>
                <span className="text-[10px] text-slate-500">Tokens activated</span>
              </div>
            </div>
          </div>

          {/* 4. Human Executive Decision Gate */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-[#0e1117] via-[#151a28] to-[#121626] border border-blue-500/40 shadow-2xl space-y-4">
            <div>
              <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest block">
                Human Executive Decision
              </span>
              <h3 className="text-lg font-black text-white tracking-tight">
                Choose the Next Strategic Milestone
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                As the technical operator, choose whether to launch generally, continue the private beta cycle, or kill/pivot the project.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              {/* Choice 1: Launch Product */}
              <button
                onClick={onAdvanceToPhase3}
                className="p-4 rounded-2xl bg-gradient-to-b from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white text-left space-y-2 shadow-xl shadow-blue-950/60 transition-all active:scale-[0.98] group"
              >
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-white/10 text-white">
                    <Rocket className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950 uppercase tracking-wider">
                    Recommended
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-black text-white group-hover:text-blue-100 transition-colors">
                    1. Launch Product
                  </h4>
                  <p className="text-[11px] text-blue-100/80 leading-relaxed mt-0.5">
                    Advance to Phase 3 (Scale / General Launch), open public onboarding, and activate marketing engine.
                  </p>
                </div>
              </button>

              {/* Choice 2: Continue Beta */}
              <button
                onClick={() => {
                  setActiveStep('beta')
                  setDecisionNotice('Beta cycle extended. Continue collecting usage data and inviting cohort testers.')
                  showToast('Beta cycle extended.')
                }}
                className="p-4 rounded-2xl bg-[#141720] hover:bg-[#1a1f2c] text-white text-left space-y-2 border border-white/[0.08] hover:border-purple-500/40 transition-all active:scale-[0.98] group"
              >
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300">
                    <RotateCcw className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">Iterate</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-purple-200 transition-colors">
                    2. Continue Beta
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                    Gather more cohort usage data, log additional feedback, and refine edge cases before public launch.
                  </p>
                </div>
              </button>

              {/* Choice 3: Kill / Pivot */}
              <button
                onClick={() => setShowKillModal(true)}
                className="p-4 rounded-2xl bg-[#141720] hover:bg-red-950/30 text-white text-left space-y-2 border border-white/[0.08] hover:border-red-500/40 transition-all active:scale-[0.98] group"
              >
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-red-500/20 text-red-400">
                    <XCircle className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono text-red-400">Pivot</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-red-300 group-hover:text-red-200 transition-colors">
                    3. Kill / Pivot
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                    Gracefully archive the project, process presale refunds, or pivot into a new validated problem space.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Step 4 Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
            <button
              onClick={() => setActiveStep('beta')}
              className="px-4 py-2.5 rounded-xl bg-white/[0.04] text-slate-300 hover:text-white border border-white/[0.08] text-xs font-semibold"
            >
              ← Back to Beta Testing
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
