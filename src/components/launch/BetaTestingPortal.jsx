import { useState, useEffect, useMemo } from 'react'
import {
  Terminal, Code2, Copy, Download, ExternalLink, Check,
  AlertCircle, Send, Star, Play, Layers, Sparkles, BookOpen,
  Laptop, Globe, Smartphone, Server, Plus, Trash2, Edit3, Save,
  FileCode, CheckCircle2, ArrowRight, ShieldCheck, RefreshCw
} from 'lucide-react'
import { updatePageSEO } from '../../utils/seo'
import { getProjectBySlug, updateCoLaunchProject } from '../../services/opsApi'

export default function BetaTestingPortal({ slug }) {
  const [project, setProject] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentBacker, setCurrentBacker] = useState(null)
  const [activeTab, setActiveTab] = useState('code') // 'code' | 'testing' | 'human_build' | 'feedback'

  // Code Explorer State
  const [selectedFileIdx, setSelectedFileIdx] = useState(0)
  const [copiedFileId, setCopiedFileId] = useState(null)
  const [copiedPrompt, setCopiedPrompt] = useState(false)

  // Human Code Editor State
  const [isAddingFile, setIsAddingFile] = useState(false)
  const [newFilePath, setNewFilePath] = useState('')
  const [newFileCategory, setNewFileCategory] = useState('Frontend')
  const [newFileContent, setNewFileContent] = useState('')
  const [isSavingCode, setIsSavingCode] = useState(false)

  // Feedback State
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
    setTimeout(() => setToastMessage(''), 3000)
  }

  // Load project by slug and extract token
  useEffect(() => {
    let isMounted = true

    const token = typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('token') || ''
      : ''

    const loadData = async () => {
      try {
        const resolvedSlug = slug || 'agenticstack'
        let proj = null
        try {
          proj = await getProjectBySlug(resolvedSlug)
        } catch (e) {
          console.warn('[BetaTestingPortal] getProjectBySlug error:', e)
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

          if (!matched && reservations.length > 0) {
            matched = reservations[0]
          }

          if (matched) {
            const email = (matched.email || '').trim().toLowerCase()
            const allPledges = reservations.filter(r => (r.email || '').trim().toLowerCase() === email)
            const combinedTiers = Array.from(new Set(allPledges.map(r => r.tier || 'Founding Backer'))).join(' • ')
            const totalPledged = allPledges.reduce((acc, r) => acc + (Number(r.amount) || 0), 0)

            setCurrentBacker({
              name: matched.name || 'Founding Backer',
              email: matched.email || '',
              tier: combinedTiers,
              totalPledged: totalPledged || matched.amount || 48
            })
            setAuthorName(matched.name || '')
            setAuthorEmail(matched.email || '')
          } else {
            setCurrentBacker({
              name: 'Verified Beta Tester',
              email: 'backer@creatorforge.com',
              tier: 'Founding Member Access',
              totalPledged: 48
            })
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

  // Update Page SEO
  useEffect(() => {
    if (project) {
      updatePageSEO({
        title: `${project.productName || 'MVP'} | Beta Testing & Code Workspace`,
        description: `Source code review, local testing guide, and feedback portal for ${project.productName || 'Creator Forge'}.`,
        keywords: 'beta testing, source code, mvp, creator forge'
      })
    }
  }, [project])

  // Project properties
  const productName = project?.productName || 'AgenticStack'
  const creatorName = project?.creatorName || 'Dave Ebbelaar'
  const tagline = project?.tagline || 'Multi-Agent Workflow Framework & Visual Optimizer'
  const niche = project?.niche || 'Python AI Apps'

  // Extract all real code files from project
  const realCodeFiles = useMemo(() => {
    const list = []

    // 1. Files from project.generatedCode
    if (Array.isArray(project?.generatedCode) && project.generatedCode.length > 0) {
      project.generatedCode.forEach(f => {
        if (f && (f.content || f.codeSnippet)) {
          list.push({
            name: f.name || f.path || f.filePath || 'untitled',
            path: f.path || f.filePath || f.name || 'src/index.js',
            content: f.content || f.codeSnippet || '',
            category: f.category || 'Source Code',
            language: f.language || (f.path?.endsWith('.py') ? 'python' : f.path?.endsWith('.dart') ? 'dart' : 'javascript'),
            source: 'Generated'
          })
        }
      })
    }

    // 2. Files from project.engineeringTasks where AI scaffolded output exists
    if (Array.isArray(project?.engineeringTasks)) {
      project.engineeringTasks.forEach(t => {
        if (t.aiOutput?.filesScaffolded && Array.isArray(t.aiOutput.filesScaffolded)) {
          t.aiOutput.filesScaffolded.forEach(f => {
            if (f && (f.codeSnippet || f.content)) {
              const p = f.filePath || f.path || `${t.title || 'Component'}.jsx`
              // Avoid duplicates
              if (!list.some(existing => existing.path === p)) {
                list.push({
                  name: p.split('/').pop() || p,
                  path: p,
                  content: f.codeSnippet || f.content || '',
                  category: t.category || 'Engineering',
                  language: f.language || (p.endsWith('.py') ? 'python' : p.endsWith('.dart') ? 'dart' : 'javascript'),
                  source: 'AI Scaffold'
                })
              }
            }
          })
        }
      })
    }

    return list
  }, [project])

  // Determine tech category based on niche and project details
  const techProfile = useMemo(() => {
    const n = (niche + ' ' + productName + ' ' + tagline).toLowerCase()
    if (n.includes('flutter') || n.includes('mobile') || n.includes('dart') || n.includes('android') || n.includes('ios')) {
      return {
        type: 'mobile',
        framework: 'Flutter / Dart',
        icon: Smartphone,
        editor: 'Android Studio / VS Code with Flutter Extension',
        browserTestingMethod: 'DartPad or Flutter Web Sandbox',
        browserTestingUrl: 'https://dartpad.dev',
        localCommands: [
          '# 1. Ensure Flutter 3.x SDK is installed',
          'flutter doctor',
          '# 2. Get dependencies',
          'flutter pub get',
          '# 3. Run in browser (Chrome)',
          'flutter run -d chrome',
          '# Or run on mobile simulator',
          'flutter run'
        ],
        recommendedToolkits: [
          { name: 'Flutter SDK 3.x', purpose: 'Cross-platform UI toolkit for iOS, Android, and Web' },
          { name: 'flutter_riverpod / provider', purpose: 'Reactive and testable state management' },
          { name: 'dio', purpose: 'Powerful HTTP networking with interceptors and retry logic' },
          { name: 'hive / shared_preferences', purpose: 'Lightweight offline key-value and caching storage' }
        ]
      }
    }

    if (n.includes('python') || n.includes('ai') || n.includes('agent') || n.includes('fastapi') || n.includes('backend') || n.includes('api')) {
      return {
        type: 'python_ai',
        framework: 'Python 3.11+ / FastAPI',
        icon: Server,
        editor: 'VS Code or Cursor with Python & Pylance extensions',
        browserTestingMethod: 'Interactive FastAPI Swagger UI (/docs) or ReDoc (/redoc)',
        browserTestingUrl: 'http://127.0.0.1:8000/docs',
        localCommands: [
          '# 1. Create and activate Python virtual environment',
          'python3 -m venv venv',
          'source venv/bin/activate  # On Windows: venv\\Scripts\\activate',
          '# 2. Install dependencies',
          'pip install fastapi uvicorn pydantic requests pytest',
          '# 3. Start local development API server',
          'uvicorn main:app --reload --port 8000',
          '# 4. Open browser test console',
          'open http://127.0.0.1:8000/docs'
        ],
        recommendedToolkits: [
          { name: 'FastAPI + Pydantic v2', purpose: 'High-performance asynchronous API framework with type validation' },
          { name: 'Uvicorn', purpose: 'Lightning-fast ASGI server for production deployment' },
          { name: 'OpenAI / Anthropic Python SDK', purpose: 'Official client libraries for LLM tool invocation & streaming' },
          { name: 'Pytest + httpx', purpose: 'Automated unit and integration test suite' }
        ]
      }
    }

    // Default: React / Next.js / Web
    return {
      type: 'web',
      framework: 'React / Next.js / Vite',
      icon: Globe,
      editor: 'VS Code, Cursor, or WebStorm',
      browserTestingMethod: 'StackBlitz / CodeSandbox 1-Click Browser Runner',
      browserTestingUrl: 'https://stackblitz.com',
      localCommands: [
        '# 1. Install Node.js 18+ dependencies',
        'npm install',
        '# 2. Launch local dev server',
        'npm run dev',
        '# 3. Open local preview in your browser',
        'open http://localhost:5173  # or http://localhost:3000'
      ],
      recommendedToolkits: [
        { name: 'Vite / Next.js 14', purpose: 'Modern, zero-config build tool and frontend architecture' },
        { name: 'TailwindCSS + Lucide Icons', purpose: 'Utility-first responsive styling and SVG iconography' },
        { name: 'Supabase / Firebase Client', purpose: 'Authentication, PostgreSQL database, and storage' },
        { name: '@stripe/stripe-js', purpose: 'Stripe Elements for PCI-compliant checkout & memberships' }
      ]
    }
  }, [niche, productName, tagline])

  // Build a complete, comprehensive implementation prompt for Human Engineers / AI Editors
  const humanEngineeringPrompt = useMemo(() => {
    const included = project?.mvpBuildPlan?.scopeBoundaries?.includedInMVP || [
      'Core user workspace / dashboard',
      'Data model and storage operations',
      'API routing and endpoint handling',
      'Authentication session verification'
    ]
    const excluded = project?.mvpBuildPlan?.scopeBoundaries?.excludedFromMVP || [
      'Multi-region high availability clusters',
      'Custom white-label enterprise domains',
      'Legacy OAuth1 integrations'
    ]
    const tasks = Array.isArray(project?.engineeringTasks) && project.engineeringTasks.length > 0
      ? project.engineeringTasks.map((t, i) => `${i + 1}. [${t.category}] ${t.title}`).join('\n')
      : '1. [Frontend] Responsive dashboard canvas\n2. [Backend] Core REST endpoints & data validation\n3. [Auth] Session token verification\n4. [Billing] Stripe subscription integration'

    return `### Project Architecture & Implementation Specification: ${productName}

**Product Overview**: ${tagline}
**Creator / Stakeholder**: ${creatorName}
**Niche**: ${niche}
**Primary Tech Stack**: ${techProfile.framework}

---

### Core Scope Boundaries:
**Included in MVP (Must Implement)**:
${included.map(item => `- ${item}`).join('\n')}

**Strictly Excluded (Out of Scope for v1)**:
${excluded.map(item => `- ${item}`).join('\n')}

---

### Engineering Sprint Tasks:
${tasks}

---

### Recommended Toolkits & Dependencies:
${techProfile.recommendedToolkits.map(t => `- **${t.name}**: ${t.purpose}`).join('\n')}

---

### Execution Instructions for Developer / AI Agent:
1. Initialize the project structure following standard conventions for ${techProfile.framework}.
2. Implement clean, modular code with strict input validation and zero memory leaks.
3. Write automated unit and integration tests covering the core user flows.
4. Ensure environment configuration uses .env variables for sensitive credentials (API keys, DB URLs).
5. Prepare a standard README with prerequisites and local startup commands.`
  }, [project, productName, tagline, creatorName, niche, techProfile])

  // Handle Copy File Code
  const handleCopyCode = (content, fileId) => {
    navigator.clipboard.writeText(content)
    setCopiedFileId(fileId)
    showToast('Code copied to clipboard!')
    setTimeout(() => setCopiedFileId(null), 2500)
  }

  // Handle Download File
  const handleDownloadFile = (fileName, content) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    showToast(`Downloaded ${fileName}!`)
  }

  // Handle Copy Full Architecture Prompt
  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(humanEngineeringPrompt)
    setCopiedPrompt(true)
    showToast('Implementation prompt copied to clipboard!')
    setTimeout(() => setCopiedPrompt(false), 2500)
  }

  // Handle Human Adding / Saving a New Code File
  const handleSaveHumanFile = async (e) => {
    e.preventDefault()
    if (!newFilePath.trim() || !newFileContent.trim()) return

    setIsSavingCode(true)
    try {
      const fileName = newFilePath.trim().split('/').pop() || newFilePath.trim()
      const newFileObj = {
        name: fileName,
        path: newFilePath.trim(),
        filePath: newFilePath.trim(),
        content: newFileContent.trim(),
        codeSnippet: newFileContent.trim(),
        category: newFileCategory,
        language: newFilePath.endsWith('.py') ? 'python' : newFilePath.endsWith('.dart') ? 'dart' : 'javascript'
      }

      const existingGenerated = Array.isArray(project?.generatedCode) ? [...project.generatedCode] : []
      const existingIdx = existingGenerated.findIndex(f => (f.path || f.name) === newFileObj.path)

      if (existingIdx >= 0) {
        existingGenerated[existingIdx] = newFileObj
      } else {
        existingGenerated.push(newFileObj)
      }

      // Persist to backend project
      if (project?.id) {
        await updateCoLaunchProject(project.id, {
          generatedCode: existingGenerated
        })
      }

      // Update local state
      const updatedProj = { ...project, generatedCode: existingGenerated }
      setProject(updatedProj)

      setIsAddingFile(false)
      setNewFilePath('')
      setNewFileContent('')
      showToast(`Saved ${fileName} to MVP codebase!`)
    } catch (err) {
      console.error('[BetaTestingPortal] Error saving code file:', err)
      showToast('Error saving file. Please try again.')
    } finally {
      setIsSavingCode(false)
    }
  }

  // Handle Feedback Submission (No XP, real feedback sync)
  const handleSubmitFeedback = async (e) => {
    e.preventDefault()
    if (!feedbackMessage.trim()) return

    setIsSubmittingFeedback(true)
    try {
      const newFeedback = {
        id: `fb-${Date.now()}`,
        author: authorName.trim() || currentBacker?.name || 'Verified Beta Tester',
        email: authorEmail.trim() || currentBacker?.email || '',
        category: feedbackCategory,
        rating: feedbackRating,
        message: feedbackMessage.trim(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toISOString().split('T')[0]
      }

      const updated = [newFeedback, ...submittedFeedbackList]
      setSubmittedFeedbackList(updated)

      if (project?.id) {
        await updateCoLaunchProject(project.id, {
          betaFeedback: updated
        })
      }

      setFeedbackMessage('')
      showToast('Feedback logged directly to the engineering team!')
    } catch (err) {
      console.error('[BetaTestingPortal] Error submitting feedback:', err)
      showToast('Error submitting feedback. Please try again.')
    } finally {
      setIsSubmittingFeedback(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#080A0C] flex flex-col items-center justify-center text-[#F5F3EA] space-y-3 font-sans">
        <div className="w-10 h-10 rounded-xl bg-[#0D1014] border border-[#252B32] flex items-center justify-center">
          <Terminal className="w-5 h-5 text-[#C8FF3D]" />
        </div>
        <p className="text-xs text-[#969DA6] font-mono tracking-wider uppercase">
          Loading Beta Testing Workspace...
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#080A0C] text-[#F5F3EA] font-sans selection:bg-[#C8FF3D] selection:text-[#080A0C] pb-24">
      
      {/* Toast Notification (Flat, Clean, No Box Shadow) */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-[#0D1014] border border-[#C8FF3D] text-[#F5F3EA] font-semibold text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#C8FF3D] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER: BRAND + BACKER STATUS (CLEAN, FLAT, NO BLINKING DOTS) */}
      <header className="sticky top-0 z-40 bg-[#080A0C] border-b border-[#252B32] px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Brand Info */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0D1014] border border-[#252B32] flex items-center justify-center">
              <Terminal className="w-4 h-4 text-[#C8FF3D]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight text-white">{productName}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#101419] text-[#C8FF3D] border border-[#252B32] font-mono uppercase">
                  BETA TESTING WORKSPACE
                </span>
              </div>
              <p className="text-[11px] text-[#969DA6]">
                Co-Designed with <strong className="text-white font-medium">{creatorName}</strong>
              </p>
            </div>
          </div>

          {/* Clean Backer Status (Flat, No Pulse or Ping) */}
          <div className="flex items-center gap-3 bg-[#0D1014] border border-[#252B32] px-3 py-1.5 rounded-xl">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="text-left text-xs">
              <span className="font-semibold text-white block truncate max-w-[160px]">
                {currentBacker?.name || 'Verified Tester'}
              </span>
              <span className="text-[10px] text-[#969DA6] font-mono block">
                ${currentBacker?.totalPledged || 48} Backed • {currentBacker?.tier || 'Founding Member'}
              </span>
            </div>
          </div>

        </div>
      </header>

      {/* HERO SECTION: TITLE & CONTEXT (FLAT, NO RADIAL GLOW) */}
      <section className="px-4 sm:px-8 pt-8 pb-6 border-b border-[#252B32] bg-[#0D1014]">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-[#101419] border border-[#252B32] text-emerald-400 text-xs font-mono font-medium">
              <span>● ACCESS GRANTED</span>
              <span className="text-[#969DA6]">•</span>
              <span>{techProfile.framework}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {productName} Beta Code & Verification Workspace
            </h1>

            <p className="text-xs sm:text-sm text-[#969DA6] leading-relaxed">
              {tagline}. As an early backer, you have access to review the synthesized source code, follow tailored instructions to test the implementation in your browser or local editor, or use the prompt kit to build and extend the MVP.
            </p>
          </div>

          {/* Quick Tech Spec Indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-[#080A0C] border border-[#252B32] space-y-1">
              <span className="text-[10px] font-mono uppercase text-[#969DA6] block">Architecture Profile</span>
              <span className="text-xs font-bold text-white block flex items-center gap-1.5">
                <techProfile.icon className="w-3.5 h-3.5 text-[#C8FF3D]" />
                <span>{techProfile.framework}</span>
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#080A0C] border border-[#252B32] space-y-1">
              <span className="text-[10px] font-mono uppercase text-[#969DA6] block">Niche & Aim</span>
              <span className="text-xs font-bold text-white block">{niche}</span>
            </div>

            <div className="p-3 rounded-xl bg-[#080A0C] border border-[#252B32] space-y-1">
              <span className="text-[10px] font-mono uppercase text-[#969DA6] block">Available Code Files</span>
              <span className="text-xs font-bold text-white block font-mono">
                {realCodeFiles.length} {realCodeFiles.length === 1 ? 'file ready' : 'files ready'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT AREA */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 pt-8 space-y-6">
        
        {/* TABS (FLAT, NO BOX SHADOWS) */}
        <div className="flex items-center gap-2 border-b border-[#252B32] pb-3 overflow-x-auto">
          {[
            { id: 'code', label: `1. Synthesized Codebase (${realCodeFiles.length})`, icon: Code2 },
            { id: 'testing', label: '2. How to Test (Browser & Local)', icon: Laptop },
            { id: 'human_build', label: '3. Human Engineering & Prompt Kit', icon: BookOpen },
            { id: 'feedback', label: `4. Backer Feedback (${submittedFeedbackList.length})`, icon: Send }
          ].map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap select-none ${
                  isActive
                    ? 'bg-[#C8FF3D] text-[#080A0C]'
                    : 'text-[#969DA6] hover:text-white hover:bg-[#0D1014]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* TAB 1: SYNTHESIZED CODEBASE */}
        {activeTab === 'code' && (
          <div className="space-y-4">
            {realCodeFiles.length === 0 ? (
              <div className="p-10 rounded-2xl bg-[#0D1014] border border-[#252B32] text-center space-y-4">
                <div className="w-12 h-12 rounded-xl bg-[#101419] border border-[#252B32] text-[#969DA6] flex items-center justify-center mx-auto">
                  <Code2 className="w-6 h-6" />
                </div>
                <div className="space-y-1.5 max-w-md mx-auto">
                  <h3 className="text-sm font-bold text-white">No AI Code Generated Yet</h3>
                  <p className="text-xs text-[#969DA6] leading-relaxed">
                    AI Coding Agents have not yet scaffolded code files for this project in Phase 2 Step 2 (Build MVP). You can either dispatch agents from the Build MVP tab, or use our Human Engineering Kit to build it with a custom prompt.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => setActiveTab('human_build')}
                    className="px-4 py-2 rounded-xl bg-[#C8FF3D] hover:bg-[#b5ee2e] text-[#080A0C] font-black text-xs transition-colors cursor-pointer"
                  >
                    Open Human Engineering Studio →
                  </button>
                  <button
                    onClick={() => setIsAddingFile(true)}
                    className="px-4 py-2 rounded-xl bg-[#101419] hover:bg-[#1a212b] border border-[#252B32] text-white font-bold text-xs transition-colors cursor-pointer"
                  >
                    + Add Code File Manually
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-[#0D1014] border border-[#252B32] overflow-hidden">
                {/* Code Editor Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 border-b border-[#252B32] bg-[#101419]">
                  {/* File Selector Tabs */}
                  <div className="flex items-center gap-1.5 overflow-x-auto max-w-full">
                    {realCodeFiles.map((file, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedFileIdx(idx)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                          selectedFileIdx === idx
                            ? 'bg-[#080A0C] text-[#C8FF3D] border border-[#252B32]'
                            : 'text-[#969DA6] hover:text-white hover:bg-[#080A0C]/50'
                        }`}
                      >
                        <FileCode className="w-3.5 h-3.5" />
                        <span>{file.name}</span>
                      </button>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyCode(realCodeFiles[selectedFileIdx]?.content || '', selectedFileIdx)}
                      className="px-3 py-1.5 rounded-lg bg-[#080A0C] hover:bg-[#1a212b] border border-[#252B32] text-xs text-white font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {copiedFileId === selectedFileIdx ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-[#969DA6]" />
                          <span>Copy File</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleDownloadFile(realCodeFiles[selectedFileIdx]?.name || 'code.txt', realCodeFiles[selectedFileIdx]?.content || '')}
                      className="px-3 py-1.5 rounded-lg bg-[#080A0C] hover:bg-[#1a212b] border border-[#252B32] text-xs text-white font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-[#969DA6]" />
                      <span>Download</span>
                    </button>

                    <button
                      onClick={() => setIsAddingFile(true)}
                      className="px-3 py-1.5 rounded-lg bg-[#C8FF3D] hover:bg-[#b5ee2e] text-[#080A0C] font-black text-xs flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add File</span>
                    </button>
                  </div>
                </div>

                {/* File Path & Metadata Strip */}
                <div className="px-4 py-2 bg-[#080A0C] border-b border-[#252B32] flex items-center justify-between text-[11px] font-mono text-[#969DA6]">
                  <span className="text-white font-medium">{realCodeFiles[selectedFileIdx]?.path}</span>
                  <span>{realCodeFiles[selectedFileIdx]?.content.split('\n').length} lines • {realCodeFiles[selectedFileIdx]?.language}</span>
                </div>

                {/* Code Content Viewer */}
                <div className="p-4 bg-[#040608] font-mono text-xs text-slate-200 overflow-x-auto max-h-[500px] overflow-y-auto leading-relaxed">
                  <pre>
                    <code>{realCodeFiles[selectedFileIdx]?.content}</code>
                  </pre>
                </div>
              </div>
            )}

            {/* Manual File Creator Modal / Area */}
            {isAddingFile && (
              <div className="p-5 rounded-2xl bg-[#0D1014] border border-[#252B32] space-y-4">
                <div className="flex items-center justify-between border-b border-[#252B32] pb-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Add / Upload Code File to MVP
                  </h4>
                  <button
                    onClick={() => setIsAddingFile(false)}
                    className="text-xs text-[#969DA6] hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                <form onSubmit={handleSaveHumanFile} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-[11px] font-bold text-[#969DA6]">File Path</label>
                      <input
                        type="text"
                        placeholder="e.g. app/routers/agents.py or src/components/Dashboard.jsx"
                        value={newFilePath}
                        onChange={e => setNewFilePath(e.target.value)}
                        required
                        className="w-full px-3 py-2 rounded-xl bg-[#080A0C] border border-[#252B32] text-xs text-white outline-none focus:border-[#C8FF3D] font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-[#969DA6]">Category</label>
                      <select
                        value={newFileCategory}
                        onChange={e => setNewFileCategory(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#080A0C] border border-[#252B32] text-xs text-white outline-none focus:border-[#C8FF3D]"
                      >
                        <option value="Frontend">Frontend Component</option>
                        <option value="Backend">Backend / API Route</option>
                        <option value="Database">Database Model / Migration</option>
                        <option value="Configuration">Configuration / Environment</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#969DA6]">Source Code Content</label>
                    <textarea
                      rows={8}
                      placeholder="Paste or write code content here..."
                      value={newFileContent}
                      onChange={e => setNewFileContent(e.target.value)}
                      required
                      className="w-full p-3 rounded-xl bg-[#040608] border border-[#252B32] text-xs text-slate-200 outline-none focus:border-[#C8FF3D] font-mono leading-relaxed resize-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingFile(false)}
                      className="px-4 py-2 rounded-xl bg-[#101419] border border-[#252B32] text-xs font-semibold text-[#969DA6] hover:text-white transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingCode}
                      className="px-5 py-2 rounded-xl bg-[#C8FF3D] hover:bg-[#b5ee2e] text-[#080A0C] font-black text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{isSavingCode ? 'Saving File...' : 'Save File to MVP'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: AI RECOMMENDED TESTING (BROWSER & LOCAL) */}
        {activeTab === 'testing' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-[#0D1014] border border-[#252B32] space-y-5">
              <div className="space-y-1">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-[#C8FF3D]" />
                  <span>AI Recommended Testing Strategy for {techProfile.framework}</span>
                </h3>
                <p className="text-xs text-[#969DA6]">
                  Tailored testing workflow based on the creator's niche ({niche}) and target platform.
                </p>
              </div>

              {/* Testing Methods Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Method A: In a Browser */}
                <div className="p-4 rounded-xl bg-[#080A0C] border border-[#252B32] space-y-3">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-xs font-bold text-white">Option 1: In a Browser Sandbox</h4>
                  </div>
                  <p className="text-xs text-[#969DA6] leading-relaxed">
                    Test the code directly in your browser without complex local tooling setup.
                  </p>
                  <div className="p-3 rounded-lg bg-[#101419] border border-[#252B32] text-xs space-y-2">
                    <span className="text-[11px] font-bold text-white block">
                      Recommended Tool: {techProfile.browserTestingMethod}
                    </span>
                    <a
                      href={techProfile.browserTestingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C8FF3D] hover:bg-[#b5ee2e] text-[#080A0C] font-black text-[11px] transition-colors cursor-pointer"
                    >
                      <span>Open Browser Sandbox</span>
                      <ExternalLink className="w-3 h-3 text-[#080A0C]" />
                    </a>
                  </div>
                </div>

                {/* Method B: In a Local Code Editor */}
                <div className="p-4 rounded-xl bg-[#080A0C] border border-[#252B32] space-y-3">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-[#C8FF3D]" />
                    <h4 className="text-xs font-bold text-white">Option 2: In a Code Editor (VS Code / Cursor)</h4>
                  </div>
                  <p className="text-xs text-[#969DA6] leading-relaxed">
                    Clone or copy the files into your local development environment for full terminal debugging.
                  </p>
                  <div className="p-3 rounded-lg bg-[#101419] border border-[#252B32] text-xs space-y-1">
                    <span className="text-[11px] font-bold text-white block">Recommended IDE Setup:</span>
                    <span className="text-[#969DA6] text-[11px] block">{techProfile.editor}</span>
                  </div>
                </div>

              </div>

              {/* Local Step-by-Step Terminal Instructions */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Step-by-Step Local Execution Commands
                </h4>
                <div className="p-4 rounded-xl bg-[#040608] border border-[#252B32] font-mono text-xs text-slate-300 space-y-1.5 overflow-x-auto">
                  {techProfile.localCommands.map((cmd, idx) => (
                    <div key={idx} className={cmd.startsWith('#') ? 'text-[#969DA6] italic' : 'text-[#C8FF3D]'}>
                      {cmd}
                    </div>
                  ))}
                </div>
              </div>

              {/* Acceptance Criteria Checklist */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Functional Acceptance Criteria for {productName}
                </h4>
                <div className="space-y-2">
                  {(project?.mvpBuildPlan?.scopeBoundaries?.includedInMVP || [
                    'User can open the workspace and see the primary feature layout',
                    'Data validation succeeds with proper error status codes on invalid inputs',
                    'State updates reactively without unhandled console exceptions'
                  ]).map((criterion, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-[#080A0C] border border-[#252B32] flex items-center gap-2.5 text-xs">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="text-slate-200">{criterion}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 3: HUMAN ENGINEERING & PROMPT KIT */}
        {activeTab === 'human_build' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-[#0D1014] border border-[#252B32] space-y-5">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#C8FF3D]" />
                    <span>Human Engineering Handoff & Architecture Prompt</span>
                  </h3>
                  <button
                    onClick={handleCopyPrompt}
                    className="px-3 py-1.5 rounded-lg bg-[#C8FF3D] hover:bg-[#b5ee2e] text-[#080A0C] font-black text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedPrompt ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Prompt Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Prompt for Cursor / Claude Code</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-[#969DA6]">
                  If the AI scaffold is not complete, copy this comprehensive architecture prompt directly into Cursor, Windsurf, Claude Code, or GitHub Copilot to implement production-ready code.
                </p>
              </div>

              {/* Formatted Prompt Display Container */}
              <div className="p-4 rounded-xl bg-[#040608] border border-[#252B32] font-mono text-[11px] text-slate-300 leading-relaxed overflow-x-auto max-h-[420px] overflow-y-auto whitespace-pre-wrap">
                {humanEngineeringPrompt}
              </div>

              {/* Curated Toolkit Recommendations */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Recommended Toolkits & Libraries for {niche}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {techProfile.recommendedToolkits.map((tool, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-[#080A0C] border border-[#252B32] space-y-1">
                      <span className="font-mono font-bold text-xs text-[#C8FF3D]">{tool.name}</span>
                      <p className="text-[11px] text-[#969DA6]">{tool.purpose}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: BACKER FEEDBACK */}
        {activeTab === 'feedback' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Feedback Submission Form */}
            <div className="p-6 rounded-2xl bg-[#0D1014] border border-[#252B32] space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Send className="w-4 h-4 text-[#C8FF3D]" />
                  <span>Submit Tester Feedback or Bug Report</span>
                </h3>
                <p className="text-xs text-[#969DA6]">
                  Direct line to {creatorName} and engineering team. Responses sync directly into the sprint backlog.
                </p>
              </div>

              <form onSubmit={handleSubmitFeedback} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#969DA6]">Feedback Category</label>
                    <select
                      value={feedbackCategory}
                      onChange={e => setFeedbackCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#080A0C] border border-[#252B32] text-xs text-white outline-none focus:border-[#C8FF3D]"
                    >
                      <option value="UX / Onboarding">UX / Onboarding</option>
                      <option value="Bug / Error">Bug / Friction Point</option>
                      <option value="Feature Request">Feature Request</option>
                      <option value="Performance">Performance & Speed</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#969DA6]">Rating</label>
                    <div className="flex items-center gap-1 pt-1.5">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setFeedbackRating(star)}
                          className="cursor-pointer"
                        >
                          <Star
                            className={`w-4 h-4 ${
                              star <= feedbackRating
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-[#252B32]'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#969DA6]">Your Name</label>
                    <input
                      type="text"
                      value={authorName}
                      onChange={e => setAuthorName(e.target.value)}
                      placeholder="Your name..."
                      className="w-full px-3 py-2 rounded-xl bg-[#080A0C] border border-[#252B32] text-xs text-white outline-none focus:border-[#C8FF3D]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#969DA6]">Your Email</label>
                    <input
                      type="email"
                      value={authorEmail}
                      onChange={e => setAuthorEmail(e.target.value)}
                      placeholder="Your email..."
                      className="w-full px-3 py-2 rounded-xl bg-[#080A0C] border border-[#252B32] text-xs text-white outline-none focus:border-[#C8FF3D]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#969DA6]">Feedback / Bug Details</label>
                  <textarea
                    rows={4}
                    value={feedbackMessage}
                    onChange={e => setFeedbackMessage(e.target.value)}
                    placeholder="Describe any confusing friction points, broken workflows, or feature wishes..."
                    required
                    className="w-full px-3 py-2.5 rounded-xl bg-[#080A0C] border border-[#252B32] text-xs text-white outline-none focus:border-[#C8FF3D] resize-none leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingFeedback || !feedbackMessage.trim()}
                  className="w-full py-2.5 rounded-xl bg-[#C8FF3D] hover:bg-[#b5ee2e] text-[#080A0C] font-black text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmittingFeedback ? 'Submitting...' : 'Submit Feedback'}</span>
                </button>
              </form>
            </div>

            {/* Submitted Feedback Stream */}
            <div className="p-6 rounded-2xl bg-[#0D1014] border border-[#252B32] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-white">Cohort Feedback Stream</h3>
                  <p className="text-xs text-[#969DA6]">Verified early feedback submitted by cohort testers.</p>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#101419] text-[#969DA6] border border-[#252B32]">
                  {submittedFeedbackList.length} LOGGED
                </span>
              </div>

              <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                {submittedFeedbackList.length === 0 ? (
                  <p className="text-xs text-[#969DA6] italic text-center py-12">
                    No feedback entries recorded yet. Be the first tester to share your experience!
                  </p>
                ) : (
                  submittedFeedbackList.map((fb, idx) => (
                    <div key={fb.id || idx} className="p-3 rounded-xl bg-[#080A0C] border border-[#252B32] space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-white">{fb.author}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-[#101419] text-[#C8FF3D] border border-[#252B32] font-mono">
                          {fb.category || fb.type || 'Feedback'}
                        </span>
                      </div>
                      <p className="text-xs text-[#969DA6] leading-relaxed italic">
                        "{fb.message}"
                      </p>
                      <div className="flex items-center justify-between pt-1 border-t border-[#1b2026] text-[10px] text-[#969DA6]">
                        <span>{fb.timestamp || fb.date || 'Recent'}</span>
                        <span className="text-emerald-400 font-mono">✓ Received</span>
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
