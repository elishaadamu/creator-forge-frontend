import { useState, useEffect } from 'react'
import {
  CheckCircle2, DollarSign, Layout, Sparkles, Save, Check, Plus, Trash2,
  Loader2, AlertCircle, Copy, Video, MessageSquare, ExternalLink, Globe,
  CreditCard, Users, TrendingUp, RefreshCw, FileText, Megaphone, Target,
  Flag, ArrowRight, Layers, HelpCircle, BarChart3, Radio, ShieldCheck,
  Palette, Smartphone, Send, Image, Monitor, Zap, Compass, PieChart, Activity, Tablet, Calendar, Eye
} from 'lucide-react'
import {
  generateValidationPlanAI,
  generateValidationCampaignKitAI,
  generateDiscoverySurveyAI,
  analyzeSurveyResponsesAI,
  analyzeAndGenerateExperimentsAI,
  generateProductImage
} from '../../services/ai'
import ProductMockupCanvas from './ProductMockupCanvas'
import ProductMockupDisplay from './ProductMockupDisplay'
import { simulateUniqueDeviceVisit } from '../../services/tracker'
import {
  updateValidationPlan,
  updateValidationCampaign,
  addProjectReservation,
  recordGateDecision,
  getFrontendUrl
} from '../../services/opsApi'

export default function Phase1Validate({
  project,
  api,
  activeStepId = 'plan',
  onSelectStep,
  onUpdateProject,
  onAdvanceToPhase2
}) {
  const [activeStep, setActiveStep] = useState(activeStepId || 'plan')
  const [assetSubTab, setAssetSubTab] = useState('product_assets')
  const [campaignSubTab, setCampaignSubTab] = useState('schedule')
  const [optimizeSubTab, setOptimizeSubTab] = useState('telemetry') // 'telemetry' | 'experiments' | 'feedback'
  const [viewDraftTask, setViewDraftTask] = useState(null)
  const [isAnalyzingExperiments, setIsAnalyzingExperiments] = useState(false)
  const [experimentsData, setExperimentsData] = useState(() => project?.experimentsData || null)

  useEffect(() => {
    if (activeStepId) setActiveStep(activeStepId)
  }, [activeStepId])

  // Real Project Presales State
  const [presalesRevenue, setPresalesRevenue] = useState(() => {
    if (project?.currentPresales !== undefined) {
      return Number(String(project.currentPresales).replace(/[^0-9.]/g, '')) || 0
    }
    return 0
  })
  const presaleTarget = Number(project?.presaleTarget || project?.targetRevenue || 5000)

  // Real Project Reservations / Backers state
  const [reservations, setReservations] = useState(() => project?.reservations || [])

  // Simulated buyer form in Run & Optimize
  const [simBuyerName, setSimBuyerName] = useState('')
  const [simBuyerEmail, setSimBuyerEmail] = useState('')
  const [simBuyerTier, setSimBuyerTier] = useState(99)

  // Real Project Validation Plan State
  const [plan, setPlan] = useState(() => project?.validationPlan || {
    customer: '',
    problem: '',
    offer: '',
    pricing: '',
    testMethod: '',
    period: '',
    threshold: ''
  })

  // Real Project Campaign Kit State
  const [campaignKit, setCampaignKit] = useState(() => {
    if (project?.campaignKit) return project.campaignKit
    return {
      announcementPost: '',
      storySequence: '',
      videoScript: '',
      newsletterDraft: '',
      directMessageScript: '',
      postingSchedule: [],
      landingPageCopy: null
    }
  })

  // Real Project Survey & Research State
  const [surveyData, setSurveyData] = useState(() => project?.surveyData || {
    summary: '',
    keyTakeaways: [],
    questions: []
  })
  const [newQuestionText, setNewQuestionText] = useState('')
  const [newQuestionCategory, setNewQuestionCategory] = useState('Pain Point')

  // Real Project Mockup Image State
  const [mockupImage, setMockupImage] = useState(() => project?.mockupImage || null)
  const [mockupViewMode, setMockupViewMode] = useState('ui')

  // Real Survey & Research Responses
  const [surveyResponses, setSurveyResponses] = useState(() => project?.surveyResponses || [])
  const [surveyAnalysis, setSurveyAnalysis] = useState(() => project?.surveyAnalysis || null)
  const [isAnalyzingResponses, setIsAnalyzingResponses] = useState(false)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [isGeneratingSurvey, setIsGeneratingSurvey] = useState(false)

  // Real Project Optimization Experiments
  const [experiments, setExperiments] = useState(() => project?.experiments || [])

  // Loading & Action States
  const [isGenerating, setIsGenerating] = useState(false)
  const [isGeneratingCampaign, setIsGeneratingCampaign] = useState(false)
  const [saveStatus, setSaveStatus] = useState('idle')
  const [feedbackNotice, setFeedbackNotice] = useState('')
  const [copiedKey, setCopiedKey] = useState(null)

  // Synchronize all Phase 1 states when project changes to prevent former creator data leakage
  useEffect(() => {
    if (!project) return
    setPresalesRevenue(Number(project.currentPresales || 0))
    setReservations(Array.isArray(project.reservations) ? project.reservations : [])
    if (project.validationPlan) {
      setPlan(project.validationPlan)
    } else {
      setPlan({
        customer: project.customer || project.targetAudience || '',
        problem: project.problem || '',
        offer: `${project.productName || 'Product'} Founding Access: ${project.productTagline || ''}`,
        pricing: project.pricing || '$29/mo Starter • $79/mo Pro',
        testMethod: '1) Co-founder video announcement, 2) 10 user interviews, 3) 48-hour Founding Pre-Order sprint',
        period: '14 days',
        threshold: '$5,000 in pre-sales or 50 paid founding reservations'
      })
    }
    if (project.campaignKit) {
      setCampaignKit(project.campaignKit)
    } else {
      setCampaignKit({
        announcementPost: '',
        storySequence: '',
        videoScript: '',
        newsletterDraft: '',
        directMessageScript: '',
        postingSchedule: [],
        landingPageCopy: null
      })
    }
    if (project.surveyData) {
      setSurveyData(project.surveyData)
    } else {
      setSurveyData({
        summary: '',
        keyTakeaways: [],
        questions: []
      })
    }
    setSurveyResponses(Array.isArray(project.surveyResponses) ? project.surveyResponses : [])
    setSurveyAnalysis(project.surveyAnalysis || null)
    setMockupImage(project.mockupImage || null)
    setExperiments(Array.isArray(project.experiments) ? project.experiments : [])
  }, [project?.id, project?.creatorId, project?.productName])

  useEffect(() => {
    if (project?.reservations) setReservations(project.reservations)
  }, [project?.reservations])

  useEffect(() => {
    if (project?.experiments) setExperiments(project.experiments)
  }, [project?.experiments])

  useEffect(() => {
    if (project?.currentPresales !== undefined) {
      setPresalesRevenue(Number(String(project.currentPresales).replace(/[^0-9.]/g, '')) || 0)
    }
  }, [project?.currentPresales])

  useEffect(() => {
    const handleSync = (e) => {
      try {
        const cur = JSON.parse(localStorage.getItem('forge_launch_active_project') || '{}')
        if (cur.reservations) setReservations(cur.reservations)
        if (cur.currentPresales !== undefined) setPresalesRevenue(Number(cur.currentPresales) || 0)
      } catch (err) {}
    }

    window.addEventListener('storage', handleSync)
    window.addEventListener('forge_project_updated', handleSync)
    return () => {
      window.removeEventListener('storage', handleSync)
      window.removeEventListener('forge_project_updated', handleSync)
    }
  }, [])

  const origin = getFrontendUrl()
  const productSlug = (project?.slug || project?.productName || 'product').toLowerCase().replace(/[^a-z0-9]/g, '-')

  const showNotification = (msg) => {
    setFeedbackNotice(msg)
    setTimeout(() => setFeedbackNotice(''), 3500)
  }

  const copyToClipboard = (text, key) => {
    if (!text) return
    navigator.clipboard?.writeText(text)
    setCopiedKey(key)
    showNotification('Copied to clipboard!')
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const updatePlan = (field, value) => {
    setPlan(prev => ({ ...prev, [field]: value }))
  }

  const updateCampaignKit = (field, value) => {
    setCampaignKit(prev => {
      const next = { ...prev, [field]: value }
      if (onUpdateProject) onUpdateProject(curr => ({ ...(curr || {}), campaignKit: next }))
      try {
        const cur = JSON.parse(localStorage.getItem('forge_launch_active_project') || '{}')
        localStorage.setItem('forge_launch_active_project', JSON.stringify({ ...cur, campaignKit: next }))
      } catch (e) {}
      return next
    })
  }

  const saveAll = () => {
    setSaveStatus('saving')
    const updated = {
      ...(project || {}),
      validationPlan: plan,
      campaignKit: campaignKit,
      surveyData: surveyData,
      mockupImage: mockupImage,
      reservations: reservations,
      experiments: experiments,
      currentPresales: presalesRevenue
    }

    if (onUpdateProject) {
      onUpdateProject(prev => ({ ...(prev || {}), ...updated }))
    }

    try {
      localStorage.setItem('forge_launch_active_project', JSON.stringify(updated))
    } catch (e) {}

    // Persist to backend database tables in SQLite
    if (project?.id) {
      updateValidationPlan(project.id, {
        customer: plan.customer,
        problem: plan.problem,
        offer: plan.offer,
        pricing: plan.pricing,
        test_method: plan.testMethod,
        period: plan.period,
        threshold: plan.threshold,
        target_revenue: presaleTarget
      }).catch(e => console.warn('[Phase1] DB plan sync warning:', e))

      updateValidationCampaign(project.id, {
        product_assets: campaignKit,
        infrastructure: {
          landingPageUrl: `/p/${productSlug}`,
          checkoutUrl: `/p/${productSlug}/checkout`,
          waitlistCount: 240,
          attributionTracking: true
        },
        research_survey: surveyData
      }).catch(e => console.warn('[Phase1] DB campaign sync warning:', e))
    }

    setTimeout(() => {
      setSaveStatus('saved')
      showNotification('Validation plan & assets saved!')
      setTimeout(() => setSaveStatus('idle'), 2500)
    }, 250)
  }

  const generatePlan = async () => {
    setIsGenerating(true)
    setSaveStatus('saving')
    try {
      let generated = null
      if (api?.generateValidationPlan) {
        generated = await api.generateValidationPlan(project)
      } else {
        generated = await generateValidationPlanAI(project)
      }

      if (generated) {
        setPlan(generated)
        const updated = {
          ...(project || {}),
          validationPlan: generated,
          campaignKit,
          surveyData,
          mockupImage,
          reservations,
          currentPresales: presalesRevenue
        }
        if (onUpdateProject) onUpdateProject(prev => ({ ...(prev || {}), ...updated }))
        try {
          localStorage.setItem('forge_launch_active_project', JSON.stringify(updated))
        } catch (e) {}

        setSaveStatus('saved')
        showNotification('AI Validation Plan generated & saved!')
        setTimeout(() => setSaveStatus('idle'), 2500)
      }
    } catch (err) {
      console.error('Validation plan error:', err)
      showNotification('Failed to generate plan. Please verify AI API keys.')
      setSaveStatus('idle')
    } finally {
      setIsGenerating(false)
    }
  }

  const generateCampaign = async () => {
    setIsGeneratingCampaign(true)
    try {
      const generated = await generateValidationCampaignKitAI(project)
      if (generated) {
        setCampaignKit(generated)
        const updated = {
          ...(project || {}),
          validationPlan: plan,
          campaignKit: generated,
          surveyData,
          mockupImage,
          reservations,
          currentPresales: presalesRevenue
        }
        if (onUpdateProject) onUpdateProject(prev => ({ ...(prev || {}), ...updated }))
        try {
          localStorage.setItem('forge_launch_active_project', JSON.stringify(updated))
        } catch (e) {}
        showNotification('Creator campaign assets generated with AI!')
      }
    } catch (err) {
      console.error('Campaign generation error:', err)
      showNotification('Failed to generate campaign assets.')
    } finally {
      setIsGeneratingCampaign(false)
    }
  }

  const handleToggleScheduleTask = (taskId) => {
    const schedule = campaignKit?.postingSchedule || []
    const updatedSchedule = schedule.map(t => t.id === taskId ? { ...t, done: !t.done } : t)
    updateCampaignKit('postingSchedule', updatedSchedule)
    showNotification('Daily task status updated!')
  }

  const getTaskDraftContent = (task) => {
    if (!task) return ''
    if (task.draftKey === 'storySequence') return campaignKit?.storySequence || 'STORY 1 — Poll\nSTORY 2 — Product Reveal\nSTORY 3 — Pre-Order Link CTA'
    if (task.draftKey === 'videoScript') return campaignKit?.videoScript || '60s Short-Form Video Script'
    if (task.draftKey === 'newsletterDraft') return campaignKit?.newsletterDraft || 'Email Newsletter Broadcast Draft'
    if (task.draftKey === 'directMessageScript') return campaignKit?.directMessageScript || '1-on-1 DM Script'
    return campaignKit?.announcementPost || 'Social Announcement Post Copy'
  }

  const handleGenerateSurvey = async () => {
    setIsGeneratingSurvey(true)
    try {
      const generated = await generateDiscoverySurveyAI(project)
      if (generated) {
        setSurveyData(generated)
        const updated = {
          ...(project || {}),
          surveyData: generated
        }
        if (onUpdateProject) onUpdateProject(prev => ({ ...(prev || {}), ...updated }))
        try {
          const current = JSON.parse(localStorage.getItem('forge_launch_active_project') || '{}')
          localStorage.setItem('forge_launch_active_project', JSON.stringify({ ...current, surveyData: generated }))
        } catch (e) {}
        showNotification('Dynamic AI discovery survey generated!')
      }
    } catch (err) {
      console.error('Survey generation error:', err)
      showNotification('Failed to generate survey questions.')
    } finally {
      setIsGeneratingSurvey(false)
    }
  }

  const handleAddQuestion = (e) => {
    e.preventDefault()
    if (!newQuestionText.trim()) return
    const newQ = {
      id: `q-${Date.now()}`,
      category: newQuestionCategory,
      question: newQuestionText.trim(),
      responseCount: 0,
      topInsight: 'Awaiting responses.'
    }
    const updated = {
      ...surveyData,
      questions: [...(surveyData.questions || []), newQ]
    }
    setSurveyData(updated)
    setNewQuestionText('')
    if (onUpdateProject) onUpdateProject(p => ({ ...(p || {}), surveyData: updated }))
    try {
      const current = JSON.parse(localStorage.getItem('forge_launch_active_project') || '{}')
      localStorage.setItem('forge_launch_active_project', JSON.stringify({ ...current, surveyData: updated }))
    } catch (e) {}
    showNotification('Question added to discovery survey.')
  }

  const handleAnalyzeResponses = async () => {
    if (!surveyResponses || surveyResponses.length === 0) {
      showNotification('Please collect at least 1 audience response or simulate a test response.')
      return
    }
    setIsAnalyzingResponses(true)
    try {
      const result = await analyzeSurveyResponsesAI(project, surveyResponses)
      if (result) {
        setSurveyAnalysis(result)
        const updated = { ...(project || {}), surveyAnalysis: result }
        if (onUpdateProject) onUpdateProject(prev => ({ ...(prev || {}), ...updated }))
        try {
          const current = JSON.parse(localStorage.getItem('forge_launch_active_project') || '{}')
          localStorage.setItem('forge_launch_active_project', JSON.stringify({ ...current, surveyAnalysis: result }))
        } catch (e) {}
        showNotification(`AI analysis complete! Score: ${result.overallScore}/100`)
      }
    } catch (err) {
      console.error('Survey analysis error:', err)
      showNotification('Failed to analyze responses with AI.')
    } finally {
      setIsAnalyzingResponses(false)
    }
  }

  const handleSimulateSurveyResponse = () => {
    const sampleNames = ['Alex Rivera', 'Devon Vance', 'Elena Rostova', 'Marcus Brody', 'Priya Sharma', 'Tyler Bennett']
    const samplePains = [
      'Managing environments manually takes 5+ hours every week and breaks team builds.',
      'Context switching between 4 separate tools slows down our workflow significantly.',
      'Docker containers fail repeatedly due to dependency and driver mismatches.'
    ]
    const sampleFeatures = [
      '1-Click automated reproducible environment launch',
      'Direct team collaboration & cloud sync',
      'Automated pipeline deployment with zero config'
    ]

    const randomName = sampleNames[Math.floor(Math.random() * sampleNames.length)]
    const randomRating = Math.floor(Math.random() * 3) + 8 // 8, 9, 10
    const newResp = {
      id: `sr-${Date.now()}`,
      name: `${randomName}`,
      email: `${randomName.toLowerCase().replace(/[^a-z]/g, '')}_${Date.now().toString().slice(-4)}@example.com`,
      rating: randomRating,
      answers: {
        q1: samplePains[Math.floor(Math.random() * samplePains.length)],
        q2: '$75/month across AWS, Docker and SaaS subscriptions',
        q3: 'Yes, $99 founding price is a no-brainer for the time saved.',
        q4: sampleFeatures[Math.floor(Math.random() * sampleFeatures.length)]
      },
      submittedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toISOString().split('T')[0]
    }

    const nextResponses = [newResp, ...surveyResponses]
    setSurveyResponses(nextResponses)

    const updatedQuestions = (surveyData?.questions || []).map(q => ({
      ...q,
      responseCount: (q.responseCount || 0) + 1
    }))
    const updatedSurveyData = { ...surveyData, questions: updatedQuestions }
    setSurveyData(updatedSurveyData)

    const updatedProject = {
      ...(project || {}),
      surveyResponses: nextResponses,
      surveyData: updatedSurveyData
    }
    if (onUpdateProject) onUpdateProject(prev => ({ ...(prev || {}), ...updatedProject }))
    try {
      const current = JSON.parse(localStorage.getItem('forge_launch_active_project') || '{}')
      localStorage.setItem('forge_launch_active_project', JSON.stringify({
        ...current,
        surveyResponses: nextResponses,
        surveyData: updatedSurveyData
      }))
    } catch (e) {}
    showNotification(`New audience response recorded from ${randomName}!`)
  }

  const handleGenerateAIMockupImage = async () => {
    setIsGeneratingImage(true)
    try {
      const imgResult = await generateProductImage({
        productName: project?.productName || 'Product',
        niche: project?.niche || 'software',
        creatorName: project?.creatorName || 'Creator'
      })
      if (imgResult) {
        setMockupImage(imgResult)
        setMockupViewMode('ai_image')
        const updated = { ...(project || {}), mockupImage: imgResult }
        if (onUpdateProject) onUpdateProject(prev => ({ ...(prev || {}), ...updated }))
        try {
          localStorage.setItem('forge_launch_active_project', JSON.stringify(updated))
        } catch (e) {}
        showNotification('AI visual product mockup generated successfully!')
      }
    } catch (err) {
      console.error('AI Image generation error:', err)
      showNotification('Image generation failed. Please verify AI API keys.')
    } finally {
      setIsGeneratingImage(false)
    }
  }

  const handleRunExperimentsAI = async () => {
    setIsAnalyzingExperiments(true)
    try {
      const results = await analyzeAndGenerateExperimentsAI(project)
      if (results) {
        setExperimentsData(results)
        const updated = { ...(project || {}), experimentsData: results }
        if (onUpdateProject) onUpdateProject(prev => ({ ...(prev || {}), ...updated }))
        try {
          const cur = JSON.parse(localStorage.getItem('forge_launch_active_project') || '{}')
          localStorage.setItem('forge_launch_active_project', JSON.stringify({ ...cur, experimentsData: results }))
        } catch (e) {}
        showNotification('AI growth & optimization experiments generated!')
      }
    } catch (err) {
      console.error('Optimization error:', err)
      showNotification('Failed to generate experiments.')
    } finally {
      setIsAnalyzingExperiments(false)
    }
  }

  const handleApplyExperiment = (exp) => {
    if (!exp) return
    let updatedCampaign = { ...campaignKit }

    if (exp.category === 'messaging' || exp.targetField === 'announcementPost') {
      updatedCampaign.announcementPost = exp.variant
    } else if (exp.category === 'creator_content' || exp.targetField === 'storySequence') {
      updatedCampaign.storySequence = exp.variant
    } else if (exp.category === 'landing_page') {
      updatedCampaign.landingPageCopy = {
        ...(updatedCampaign.landingPageCopy || {}),
        headline: exp.variant
      }
    }

    setCampaignKit(updatedCampaign)

    if (experimentsData?.experiments) {
      const updatedExps = experimentsData.experiments.map(e => e.id === exp.id ? { ...e, status: 'applied' } : e)
      const nextExpData = { ...experimentsData, experiments: updatedExps }
      setExperimentsData(nextExpData)
      
      const updatedProject = {
        ...(project || {}),
        campaignKit: updatedCampaign,
        experimentsData: nextExpData
      }
      if (onUpdateProject) onUpdateProject(prev => ({ ...(prev || {}), ...updatedProject }))
      try {
        const cur = JSON.parse(localStorage.getItem('forge_launch_active_project') || '{}')
        localStorage.setItem('forge_launch_active_project', JSON.stringify({ ...cur, campaignKit: updatedCampaign, experimentsData: nextExpData }))
      } catch (e) {}
    }

    showNotification(`Experiment "${exp.title}" applied to live campaign!`)
  }

  const handleSimulatePresale = (e) => {
    e?.preventDefault()
    if (!simBuyerName.trim() || !simBuyerEmail.trim()) {
      showNotification('Please enter a backer name and email.')
      return
    }
    const name = simBuyerName.trim()
    const email = simBuyerEmail.trim()
    const amount = Number(simBuyerTier) || 99

    const newReservation = {
      id: `r-${Date.now()}`,
      name,
      email,
      amount,
      tier: amount === 99 ? 'Founding Annual ($99)' : amount === 199 ? 'VIP Founder Pass ($199)' : 'Refundable Deposit ($19)',
      date: 'Just now',
      status: 'Paid'
    }

    const nextReservations = [newReservation, ...reservations]
    const nextRevenue = presalesRevenue + amount

    setReservations(nextReservations)
    setPresalesRevenue(nextRevenue)
    setSimBuyerName('')
    setSimBuyerEmail('')

    const updated = {
      ...(project || {}),
      validationPlan: plan,
      campaignKit,
      surveyData,
      mockupImage,
      reservations: nextReservations,
      currentPresales: nextRevenue
    }

    if (onUpdateProject) onUpdateProject(prev => ({ ...(prev || {}), ...updated }))
    try {
      localStorage.setItem('forge_launch_active_project', JSON.stringify(updated))
      window.dispatchEvent(new CustomEvent('forge_project_updated', { detail: updated }))
    } catch (e) {}

    // Persist pre-order reservation to SQLite database
    if (project?.id) {
      addProjectReservation(project.id, {
        name,
        email,
        amount,
        tier: amount === 99 ? 'Founding Annual ($99)' : amount === 199 ? 'VIP Founder Pass ($199)' : 'Refundable Deposit ($19)',
        channel: 'creator_campaign'
      }).catch(e => console.warn('[Phase1] DB reservation sync warning:', e))
    }

    showNotification(`Recorded $${amount} presale pledge from ${name}!`)
  }

  const handleClearAllReservations = () => {
    setReservations([])
    setPresalesRevenue(0)
    const updated = {
      ...(project || {}),
      reservations: [],
      currentPresales: 0,
      conversionRate: 0
    }
    if (onUpdateProject) onUpdateProject(prev => ({ ...(prev || {}), ...updated }))
    try {
      const cur = JSON.parse(localStorage.getItem('forge_launch_active_project') || '{}')
      localStorage.setItem('forge_launch_active_project', JSON.stringify({ ...cur, reservations: [], currentPresales: 0, conversionRate: 0 }))
      window.dispatchEvent(new CustomEvent('forge_project_updated', { detail: updated }))
    } catch (e) {}
    showNotification('Pre-orders cleared.')
  }

  const isGatePassed = presalesRevenue >= presaleTarget
  const handleStepChange = (id) => {
    setActiveStep(id)
    onSelectStep?.(id)
  }

  return (
    <div className="space-y-5 w-full max-w-full overflow-hidden">
      {/* 5-Step Phase 1 Progress Nav */}
      <div className="p-2 rounded-2xl bg-[#0e1117] border border-white/[0.08] flex items-center justify-between overflow-x-auto gap-2">
        <div className="flex items-center gap-1 min-w-max">
          {[
            { id: 'plan', label: '1. Plan', icon: FileText },
            { id: 'assets', label: '2. Assets', icon: Layout },
            { id: 'campaign', label: '3. Campaign', icon: Megaphone },
            { id: 'optimize', label: '4. Optimize', icon: TrendingUp },
            { id: 'gate', label: '5. Gate', icon: Flag },
          ].map(step => {
            const Icon = step.icon
            const isActive = activeStep === step.id
            return (
              <button
                key={step.id}
                onClick={() => handleStepChange(step.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{step.label}</span>
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-400 shrink-0">
          <DollarSign className="w-3.5 h-3.5" />
          <span>${presalesRevenue.toLocaleString()} / ${presaleTarget.toLocaleString()}</span>
        </div>
      </div>

      {/* Floating Notification */}
      {feedbackNotice && (
        <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{feedbackNotice}</span>
          </div>
          <span className="text-[10px] text-emerald-400/80 font-mono">synced</span>
        </div>
      )}

      {/* STEP 1: VALIDATION PLAN */}
      {activeStep === 'plan' && (
        <div className="p-5 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-4">
          <div className="border-b border-white/[0.07] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>1. Validation Plan Specification</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                  AI Generated
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                AI defines customer, problem, offer, pricing, test method, validation period + success threshold.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={generatePlan}
                disabled={isGenerating}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/40 text-xs font-bold transition-all disabled:opacity-50 active:scale-95 shadow-sm"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-300" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>Generate Plan</span>
                  </>
                )}
              </button>
              <button
                onClick={saveAll}
                disabled={saveStatus === 'saving'}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 shadow-sm ${
                  saveStatus === 'saved'
                    ? 'bg-emerald-500 text-slate-950 border border-emerald-400 font-extrabold'
                    : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/40'
                }`}
              >
                {saveStatus === 'saving' ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-300" />
                    <span>Saving...</span>
                  </>
                ) : saveStatus === 'saved' ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 text-xs">
            {[
              ['customer', 'Target Customer'], ['problem', 'Problem'], ['offer', 'Offer'],
              ['pricing', 'Pricing & Deposits'], ['testMethod', 'Test Method'], ['period', 'Validation Period'],
              ['threshold', 'Success Threshold']
            ].map(([field, label]) => (
              <label key={field} className={`p-3.5 rounded-xl bg-[#161a23] border ${field === 'threshold' ? 'border-emerald-500/30 bg-emerald-950/10' : 'border-white/[0.08] focus-within:border-purple-500/40'} space-y-1.5 block ${field === 'testMethod' ? 'md:col-span-2' : ''} transition-all`}>
                <div className="flex items-center justify-between">
                  <span className={`${field === 'threshold' ? 'text-emerald-400' : 'text-slate-400'} font-bold uppercase tracking-wider text-[10px]`}>{label}</span>
                  <span className="text-[10px] text-slate-500">editable</span>
                </div>
                <textarea
                  value={plan[field] || ''}
                  onChange={event => updatePlan(field, event.target.value)}
                  rows={field === 'testMethod' ? 3 : 2}
                  className="w-full mt-1 resize-y bg-transparent text-slate-100 outline-none placeholder:text-slate-600 font-sans leading-relaxed text-xs"
                  placeholder={`Click 'Generate Plan with AI' or enter ${label.toLowerCase()}...`}
                />
              </label>
            ))}
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={() => handleStepChange('assets')}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <span>Next: Build Validation Assets</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: BUILD VALIDATION ASSETS */}
      {activeStep === 'assets' && (
        <div className="p-5 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-5">
          <div className="border-b border-white/[0.07] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>2. Build Validation Assets & Infrastructure</span>
              </h3>
              <p className="text-xs text-slate-400">
                Product assets, branding, positioning, copy, product mockups, landing page, checkout, waitlist, analytics & feedback surveys.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={saveAll}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/40 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Assets</span>
              </button>
            </div>
          </div>

          {/* Sub Navigation */}
          <div className="flex items-center gap-1.5 border-b border-white/[0.08] pb-3 overflow-x-auto">
            {[
              { id: 'product_assets', label: '1. Product Assets', icon: Palette },
              { id: 'infrastructure', label: '2. Infrastructure', icon: Globe },
              { id: 'research', label: '3. Research', icon: HelpCircle },
            ].map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setAssetSubTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    (assetSubTab === tab.id || (tab.id === 'product_assets' && (!assetSubTab || assetSubTab === 'branding')))
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-950/50 border border-purple-500/60'
                      : 'text-slate-400 hover:text-white bg-white/[0.03] border border-transparent'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>

          {/* 1. PRODUCT ASSETS (Product Name, Basic Branding, Positioning, Copy, Product Mockups + Pricing) */}
          {(assetSubTab === 'branding' || assetSubTab === 'product_assets') && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name, Branding & Positioning Card */}
                <div className="p-4 rounded-xl bg-[#161a23] border border-white/[0.08] space-y-3">
                  <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider block">
                    Product Identity, Branding & Positioning
                  </span>

                  <div>
                    <label className="text-[10px] text-slate-400 block font-bold">Product Name</label>
                    <input
                      type="text"
                      value={project?.productName || ''}
                      onChange={e => onUpdateProject?.(p => ({ ...(p || {}), productName: e.target.value }))}
                      placeholder="e.g. ClipForge AI"
                      className="w-full mt-1 px-3 py-2 rounded-lg bg-[#0e1117] border border-white/[0.08] text-white font-bold outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block font-bold">Positioning Statement</label>
                    <textarea
                      rows={2}
                      value={project?.productTagline || ''}
                      onChange={e => onUpdateProject?.(p => ({ ...(p || {}), productTagline: e.target.value }))}
                      placeholder="e.g. Autonomous AI clipping & repurposing suite for long-form creators"
                      className="w-full mt-1 p-2.5 rounded-lg bg-[#0e1117] border border-white/[0.08] text-slate-200 outline-none resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[10px] text-slate-400 block font-bold">Brand Tag / Tone</label>
                      <input
                        type="text"
                        defaultValue="Modern, Minimal, Dark SaaS"
                        className="w-full mt-1 px-3 py-2 rounded-lg bg-[#0e1117] border border-white/[0.08] text-slate-300 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block font-bold">Target Audience</label>
                      <input
                        type="text"
                        defaultValue={project?.niche || 'Content Creators'}
                        className="w-full mt-1 px-3 py-2 rounded-lg bg-[#0e1117] border border-white/[0.08] text-slate-300 text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Copy & Pricing Card */}
                <div className="p-4 rounded-xl bg-[#161a23] border border-white/[0.08] space-y-3">
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                    Product Copy & Pricing Structure
                  </span>

                  <div>
                    <label className="text-[10px] text-slate-400 block font-bold">Hero Headline Copy</label>
                    <input
                      type="text"
                      value={campaignKit?.landingPageCopy?.headline || ''}
                      onChange={e => updateCampaignKit('landingPageCopy', { ...(campaignKit?.landingPageCopy || {}), headline: e.target.value })}
                      placeholder="e.g. Built for ambitious creators to 10x workflow speed."
                      className="w-full mt-1 px-3 py-2 rounded-lg bg-[#0e1117] border border-white/[0.08] text-white font-bold outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-400 block font-bold">Founding Annual Price</label>
                      <div className="flex items-center gap-1 mt-1 px-3 py-2 rounded-lg bg-[#0e1117] border border-white/[0.08]">
                        <span className="text-slate-400 font-bold">$</span>
                        <input
                          type="number"
                          defaultValue={99}
                          className="bg-transparent text-white font-bold text-xs outline-none w-full"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block font-bold">Refundable Deposit</label>
                      <div className="flex items-center gap-1 mt-1 px-3 py-2 rounded-lg bg-[#0e1117] border border-white/[0.08]">
                        <span className="text-slate-400 font-bold">$</span>
                        <input
                          type="number"
                          defaultValue={19}
                          className="bg-transparent text-white font-bold text-xs outline-none w-full"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block font-bold">Offer Perks & Guarantee</label>
                    <input
                      type="text"
                      defaultValue="50% Lifetime Discount + 1-on-1 Alpha Onboarding"
                      className="w-full mt-1 px-3 py-2 rounded-lg bg-[#0e1117] border border-white/[0.08] text-slate-300 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Product Mockups Canvas Studio */}
              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-bold text-white uppercase tracking-wider block">
                  Product Mockup Studio & Visual Asset
                </span>
                <ProductMockupCanvas
                  project={project}
                  onSaveMockupImage={(imgUrl) => {
                    setMockupImage(imgUrl)
                    onUpdateProject?.(prev => ({ ...(prev || {}), mockupImage: imgUrl }))
                    try {
                      const cur = JSON.parse(localStorage.getItem('forge_launch_active_project') || '{}')
                      localStorage.setItem('forge_launch_active_project', JSON.stringify({ ...cur, mockupImage: imgUrl }))
                    } catch (e) {}
                  }}
                  onShowNotification={showNotification}
                />
              </div>
            </div>
          )}

          {/* 2. INFRASTRUCTURE (Landing page, checkout/presales, waitlist, analytics + attribution) */}
          {(assetSubTab === 'page' || assetSubTab === 'infrastructure') && (
            <div className="space-y-4 text-xs">
              {/* Top Browser Bar with Real Localhost URL */}
              <div className="p-3 rounded-2xl bg-[#0e1117] border border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#141720] border border-white/[0.08] text-purple-300 font-mono text-[11px] truncate flex-1 max-w-lg">
                    <Globe className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span className="truncate">
                      {`${origin}/preorder/${productSlug}`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      const url = `${origin}/preorder/${productSlug}`
                      if (url) {
                        navigator.clipboard?.writeText(url)
                        showNotification('Pre-order link copied!')
                      }
                    }}
                    className="px-3 py-1 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-slate-200 text-xs font-bold border border-white/[0.1] flex items-center gap-1 transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy Link</span>
                  </button>

                  <a
                    href={`${origin}/preorder/${productSlug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1 transition-colors shadow-sm"
                  >
                    <span>Open Live Page</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Rich Live Interactive Landing Page Preview Frame */}
              <div className="rounded-3xl bg-[#090b0e] border border-white/[0.1] overflow-hidden shadow-2xl p-6 sm:p-8 space-y-6">
                {/* Top Pre-sale Badge */}
                <div className="text-center space-y-3 max-w-2xl mx-auto">
                  <span className="inline-block px-3.5 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-black uppercase tracking-wider">
                    🔥 Founding Member Pre-Sale
                  </span>
                  <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                    {campaignKit?.landingPageCopy?.headline || `The ${project?.productName || 'Product'} System`}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {campaignKit?.landingPageCopy?.subheadline || project?.productTagline || 'Reserve early founding access and lock in lifetime benefits.'}
                  </p>

                  {/* Live Pre-Order Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                    <a
                      href={`${origin}/preorder/${productSlug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/60 transition-all active:scale-95"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Live Checkout: Claim Access ($99)</span>
                      <ExternalLink className="w-3.5 h-3.5 ml-0.5 opacity-75" />
                    </a>

                    <a
                      href={`${origin}/preorder/${productSlug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-[#141720] hover:bg-[#1a1f2c] text-slate-200 border border-white/[0.1] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Reserve with $19 Deposit</span>
                      <ExternalLink className="w-3.5 h-3.5 ml-0.5 opacity-75" />
                    </a>
                  </div>
                </div>

                {/* Visual Designed Mockup Showcase (Full, Non-Editable UI Frame) */}
                <div className="pt-4 max-w-4xl mx-auto">
                  <ProductMockupDisplay project={project} theme="purple" />
                </div>
              </div>

              {/* Infrastructure Hub: Checkout, Attribution & Waitlist */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {/* 1. Stripe Checkout Engine */}
                <div className="p-4 rounded-2xl bg-[#141720] border border-white/[0.08] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Stripe Checkout</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <div className="text-base font-extrabold text-white">
                    ${presalesRevenue.toLocaleString()} <span className="text-xs text-slate-400 font-normal">Collected</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Stripe pre-orders active. Live payment simulation updates revenue in real-time.
                  </p>
                </div>

                {/* 2. Creator Attribution & UTM Tracking */}
                <div className="p-4 rounded-2xl bg-[#141720] border border-white/[0.08] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Attribution Tracker</span>
                    <span className="text-[10px] font-mono text-purple-300">?ref={(project?.creatorHandle || 'creator').replace('@','')}</span>
                  </div>
                  <div className="text-base font-extrabold text-white">
                    100% <span className="text-xs text-slate-400 font-normal">Channel Attribution</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Tracks creator audience conversions, social link clicks, and presale attribution.
                  </p>
                </div>

                {/* 3. Waitlist & Deposit Capture */}
                <div className="p-4 rounded-2xl bg-[#141720] border border-white/[0.08] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Waitlist System</span>
                    <span className="text-[10px] text-indigo-300 font-bold">{reservations.length} Leads</span>
                  </div>
                  <div className="text-base font-extrabold text-white">
                    $19 <span className="text-xs text-slate-400 font-normal">Deposit Model</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Captures high-intent buyers with refundable reservation pass before full MVP build.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 3. RESEARCH (Survey/questions + shareable link + live responses + AI scoring) */}
          {(assetSubTab === 'survey' || assetSubTab === 'research') && (
            <div className="space-y-4 text-xs">
              {/* Shareable Public Survey Bar */}
              <div className="p-3 rounded-2xl bg-[#0e1117] border border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-purple-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#141720] border border-white/[0.08] text-purple-300 font-mono text-[11px] truncate flex-1 max-w-lg">
                    <Globe className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span className="truncate">
                      {`${origin}/survey/${productSlug}`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      const url = `${origin}/survey/${productSlug}`
                      if (url) {
                        navigator.clipboard?.writeText(url)
                        showNotification('Shareable survey link copied!')
                      }
                    }}
                    className="px-3 py-1 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-slate-200 text-xs font-bold border border-white/[0.1] flex items-center gap-1 transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy Link</span>
                  </button>

                  <a
                    href={`${origin}/survey/${productSlug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1 transition-colors shadow-sm"
                  >
                    <span>Open Live Survey</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <button
                    onClick={handleSimulateSurveyResponse}
                    className="px-3 py-1 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-xs font-bold border border-emerald-500/30 flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Simulate Response</span>
                  </button>
                </div>
              </div>

              {/* AI Research & Validation Scorecard */}
              <div className="p-5 rounded-2xl bg-gradient-to-b from-[#141824] to-[#0d0f17] border border-purple-500/30 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-400">
                        AI Validation & Demand Score
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                        {surveyResponses.length} Responses Collected
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-white">
                      {surveyAnalysis?.scoreVerdict || (surveyResponses.length > 0 ? 'Validation Data Ready for Analysis' : 'Awaiting Audience Responses')}
                    </h3>
                  </div>

                  <button
                    onClick={handleAnalyzeResponses}
                    disabled={isAnalyzingResponses || surveyResponses.length === 0}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-purple-950/50 disabled:opacity-40"
                  >
                    {isAnalyzingResponses ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Analyzing with AI...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Analyze Responses with AI</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Score Breakdown Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-[#0e1117] border border-white/[0.06] space-y-1">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Overall Score</span>
                    <div className="text-2xl font-black text-white">
                      {surveyAnalysis?.overallScore !== undefined ? `${surveyAnalysis.overallScore}/100` : '—'}
                    </div>
                    <div className="text-[10px] font-bold text-purple-400">
                      {surveyAnalysis?.recommendation === 'PROCEED' ? '🟢 Proceed to Build' : surveyAnalysis ? '🟡 Iterate Pricing' : 'Awaiting analysis'}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#0e1117] border border-white/[0.06] space-y-1">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Market Demand</span>
                    <div className="text-2xl font-black text-emerald-400">
                      {surveyAnalysis?.marketDemandScore !== undefined ? `${surveyAnalysis.marketDemandScore}%` : '—'}
                    </div>
                    <div className="text-[10px] text-slate-400">Problem urgency signal</div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#0e1117] border border-white/[0.06] space-y-1">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Pricing Viability ($99)</span>
                    <div className="text-2xl font-black text-indigo-300">
                      {surveyAnalysis?.pricingViabilityScore !== undefined ? `${surveyAnalysis.pricingViabilityScore}%` : '—'}
                    </div>
                    <div className="text-[10px] text-slate-400">Willingness to pay signal</div>
                  </div>
                </div>

                {/* AI Executive Synthesis */}
                {surveyAnalysis?.executiveSummary && (
                  <div className="p-3.5 rounded-xl bg-[#0e1117] border border-white/[0.06] space-y-2">
                    <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider block">
                      AI Executive Summary
                    </span>
                    <p className="text-xs text-slate-200 leading-relaxed">
                      {surveyAnalysis.executiveSummary}
                    </p>

                    {surveyAnalysis.keyFindings?.length > 0 && (
                      <div className="pt-2 border-t border-white/[0.06] space-y-1">
                        {surveyAnalysis.keyFindings.map((finding, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-[11px] text-slate-300">
                            <span className="text-emerald-400">✓</span>
                            <span>{finding}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Discovery Questions Card */}
              <div className="p-4 rounded-xl bg-[#161a23] border border-white/[0.08] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
                  <div>
                    <h4 className="font-bold text-white text-xs">Customer Discovery Questions</h4>
                    <p className="text-[11px] text-slate-400">
                      Qualitative discovery questions asked on the public survey page.
                    </p>
                  </div>

                  <button
                    onClick={handleGenerateSurvey}
                    disabled={isGeneratingSurvey}
                    className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    {isGeneratingSurvey ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Regenerate Questions with AI</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="space-y-2.5">
                  {(surveyData?.questions || []).map((q, index) => (
                    <div key={q.id || index} className="p-3.5 rounded-xl bg-[#0e1117] border border-white/[0.06] space-y-1.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-300 border border-purple-500/20 shrink-0">
                            {q.category || 'Discovery'}
                          </span>
                          <span className="font-bold text-white text-xs">{q.question}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                          (q.responseCount || 0) > 0
                            ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                            : 'text-slate-400 bg-white/[0.04] border border-white/[0.06]'
                        }`}>
                          {(q.responseCount || 0) > 0 ? `${q.responseCount} responses` : '0 responses (Awaiting data)'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Custom Question Form */}
                <form onSubmit={handleAddQuestion} className="flex gap-2 pt-2 border-t border-white/[0.06]">
                  <select
                    value={newQuestionCategory}
                    onChange={e => setNewQuestionCategory(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-[#0e1117] border border-white/[0.08] text-xs text-purple-300 font-bold outline-none"
                  >
                    <option value="Pain Point">Pain Point</option>
                    <option value="Pricing Validation">Pricing</option>
                    <option value="Feature Wishlist">Feature Wishlist</option>
                    <option value="Workflow Bottleneck">Workflow</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Add custom survey question..."
                    value={newQuestionText}
                    onChange={e => setNewQuestionText(e.target.value)}
                    className="flex-1 px-3.5 py-2 rounded-xl bg-[#0e1117] border border-white/[0.08] text-xs text-white outline-none focus:border-purple-500/50 placeholder:text-slate-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </form>
              </div>

              {/* Live Audience Responses Stream */}
              <div className="p-4 rounded-xl bg-[#161a23] border border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                  <div>
                    <h4 className="font-bold text-white text-xs">Live Community Response Stream</h4>
                    <p className="text-[11px] text-slate-400">
                      Real-time responses submitted by audience members through the public survey URL.
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-purple-300 bg-purple-500/10 px-2.5 py-1 rounded-full border border-purple-500/20">
                    {surveyResponses.length} Responses
                  </span>
                </div>

                {surveyResponses.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-xs border border-dashed border-white/[0.08] rounded-xl space-y-2">
                    <p>No audience responses submitted yet.</p>
                    <div className="flex items-center justify-center gap-3 pt-1">
                      <button
                        onClick={handleSimulateSurveyResponse}
                        className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-colors"
                      >
                        Simulate Test Response
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {surveyResponses.map((r) => (
                      <div key={r.id} className="p-4 rounded-xl bg-[#0e1117] border border-white/[0.06] space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.04] pb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-xs">{r.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">({r.email})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                              Intent: {r.rating || 8}/10 🔥
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">{r.submittedAt || r.date}</span>
                          </div>
                        </div>

                        {/* Answers Breakdown */}
                        {r.answers && (
                          <div className="space-y-1.5 text-[11px] text-slate-300 pl-1">
                            {Object.entries(r.answers).map(([key, ans]) => (
                              <div key={key} className="flex items-start gap-1.5">
                                <span className="text-purple-400 font-bold shrink-0">•</span>
                                <span>{ans}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-white/[0.08]">
            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Human Review: Verify assets, copy, mockups & infrastructure</span>
            </div>
            <button
              onClick={() => {
                if (project?.id) {
                  updateValidationCampaign(project.id, {
                    product_assets: campaignKit,
                    infrastructure: {
                      landingPageUrl: `/p/${productSlug}`,
                      checkoutUrl: `/p/${productSlug}/checkout`,
                      waitlistCount: 240,
                      attributionTracking: true
                    },
                    research_survey: surveyData,
                    review_status: 'approved'
                  }).catch(e => console.warn('[Phase1] DB campaign approval warning:', e))
                }
                showNotification('Validation assets approved & locked in database!')
                handleStepChange('campaign')
              }}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center gap-2 transition-all shadow-md shadow-emerald-950/40 active:scale-95 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Approve & Launch Validation Campaign</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: CREATOR CAMPAIGN */}
      {activeStep === 'campaign' && (
        <div className="p-5 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-5">
          <div className="border-b border-white/[0.07] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>3. Creator Campaign Execution</span>
              </h3>
              <p className="text-xs text-slate-400">
                Posts, Instagram stories, newsletter copy, videos, polls, CTAs, images & 60s scripts for the creator.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={generateCampaign}
                disabled={isGeneratingCampaign}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/40 text-xs font-bold transition-all disabled:opacity-50 active:scale-95 shadow-sm"
              >
                {isGeneratingCampaign ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-300" />
                    <span>Drafting...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>Generate AI Content</span>
                  </>
                )}
              </button>
              <button
                onClick={saveAll}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/40 text-xs font-bold transition-all active:scale-95 shadow-sm"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            </div>
          </div>

          {/* Today's Action Highlight Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-[#141824] to-[#0d0f17] border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shadow-purple-950/30">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40 animate-pulse">
                  🔥 Today's Mission (Day 2)
                </span>
                <span className="text-xs font-bold text-slate-300">Instagram Stories · Pain Point Poll</span>
              </div>
              <h4 className="text-sm font-extrabold text-white">
                Today: Post Instagram Story #2 (Pain Point Poll & Pre-Order Link)
              </h4>
              <p className="text-[11px] text-slate-400">
                Creator posts the 3-story sequence with interactive poll sticker to drive warm audience to the pre-order page.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setViewDraftTask({
                  id: 'day-2',
                  day: 2,
                  title: 'Post Instagram Story #2 — Pain Point Poll & Announcement',
                  channel: 'Instagram Stories',
                  draftKey: 'storySequence'
                })}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-purple-950/50 active:scale-95"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View Draft</span>
              </button>

              <button
                onClick={() => handleToggleScheduleTask('day-2')}
                className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors border ${
                  campaignKit?.postingSchedule?.find(t => t.id === 'day-2')?.done
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border-white/[0.08]'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{campaignKit?.postingSchedule?.find(t => t.id === 'day-2')?.done ? 'Completed' : 'Mark Done'}</span>
              </button>
            </div>
          </div>

          {/* Subtabs Navigation */}
          <div className="flex items-center gap-1.5 border-b border-white/[0.08] pb-3 overflow-x-auto">
            {[
              { id: 'schedule', label: '1. Schedule & Checklist', icon: Calendar },
              { id: 'post', label: '2. Social Posts', icon: MessageSquare },
              { id: 'story', label: '3. Stories & Polls', icon: Smartphone },
              { id: 'video', label: '4. Video Script', icon: Video },
              { id: 'newsletter', label: '5. Newsletter', icon: Send },
              { id: 'dm', label: '6. DM Outreach', icon: Users },
              { id: 'links', label: '7. Tracking Links', icon: Globe },
            ].map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setCampaignSubTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    campaignSubTab === tab.id
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-950/50 border border-purple-500/60'
                      : 'text-slate-400 hover:text-white bg-white/[0.03] border border-transparent'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>

          {/* SUBTAB 1: SCHEDULE & CHECKLIST */}
          {campaignSubTab === 'schedule' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">Creator 7-Day Campaign Checklist</h4>
                  <p className="text-[11px] text-slate-400">
                    Step-by-step daily launch actions with ready-to-use drafts for the creator.
                  </p>
                </div>
                <span className="text-[10px] font-bold text-purple-300 bg-purple-500/10 px-2.5 py-1 rounded-full border border-purple-500/20">
                  {campaignKit?.postingSchedule?.filter(t => t.done)?.length || 1} / {campaignKit?.postingSchedule?.length || 7} Completed
                </span>
              </div>

              <div className="space-y-2.5">
                {(campaignKit?.postingSchedule || [
                  { id: 'day-1', day: 1, title: 'Problem Teaser & Discovery Poll', channel: 'Twitter / X', isToday: false, done: true, draftKey: 'announcementPost', description: 'Post teaser highlighting the bottleneck and survey link.' },
                  { id: 'day-2', day: 2, title: 'Post Instagram Story #2 — Pain Point Poll & Announcement', channel: 'Instagram Stories', isToday: true, done: false, draftKey: 'storySequence', description: 'Post 3-story sequence with poll sticker and pre-order link.' },
                  { id: 'day-3', day: 3, title: 'Publish 60-Second Video Demo & Launch Hook', channel: 'TikTok / Reels / Shorts', isToday: false, done: false, draftKey: 'videoScript', description: 'Post 60s short-form demo of the problem and founding offer.' },
                  { id: 'day-4', day: 4, title: 'Send Deep-Dive Email Newsletter Broadcast', channel: 'Email Newsletter', isToday: false, done: false, draftKey: 'newsletterDraft', description: 'Send dedicated email broadcast to newsletter subscribers.' },
                  { id: 'day-5', day: 5, title: '1-on-1 VIP DM Outreach to 20 High-Intent Members', channel: 'Direct Messages', isToday: false, done: false, draftKey: 'directMessageScript', description: 'Reach out personally to 20 high-value followers.' },
                  { id: 'day-6', day: 6, title: 'Share Live Pre-Order Milestones & Survey Insights', channel: 'Stories & Community', isToday: false, done: false, draftKey: 'storySequence', description: 'Share backer numbers and survey results.' },
                  { id: 'day-7', day: 7, title: 'Final 24-Hour Founding Tier Price Lock Push', channel: 'All Social Channels', isToday: false, done: false, draftKey: 'announcementPost', description: 'Final call before founding cohort closes.' }
                ]).map((task) => (
                  <div
                    key={task.id}
                    className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      task.isToday
                        ? 'bg-[#141824] border-purple-500/40 shadow-sm shadow-purple-950/40'
                        : task.done
                        ? 'bg-[#0e1117] border-white/[0.04] opacity-80'
                        : 'bg-[#11141c] border-white/[0.06]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => handleToggleScheduleTask(task.id)}
                        className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center transition-colors shrink-0 ${
                          task.done
                            ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                            : 'border-white/[0.2] bg-white/[0.02] hover:border-purple-400'
                        }`}
                      >
                        {task.done && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            task.isToday
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                              : task.done
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-white/[0.06] text-slate-400'
                          }`}>
                            {task.isToday ? 'Today · Day ' + task.day : 'Day ' + task.day}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 font-mono">
                            {task.channel}
                          </span>
                        </div>
                        <h5 className={`text-xs font-bold ${task.done ? 'line-through text-slate-400' : 'text-white'}`}>
                          {task.title}
                        </h5>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          {task.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        onClick={() => setViewDraftTask(task)}
                        className="px-3 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 text-xs font-bold border border-purple-500/30 flex items-center gap-1 transition-colors"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View Draft</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SUBTAB 2: POST */}
          {campaignSubTab === 'post' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Social Announcement Post Copy</span>
                <button
                  onClick={() => copyToClipboard(campaignKit?.announcementPost, 'post')}
                  disabled={!campaignKit?.announcementPost}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors disabled:opacity-40"
                >
                  {copiedKey === 'post' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'post' ? 'Copied!' : 'Copy Post'}</span>
                </button>
              </div>
              <textarea
                value={campaignKit?.announcementPost || ''}
                onChange={e => updateCampaignKit('announcementPost', e.target.value)}
                placeholder="Click 'Generate AI Content' or write custom announcement post..."
                rows={8}
                className="w-full p-3.5 rounded-xl bg-[#161a23] border border-white/[0.08] text-xs text-white outline-none leading-relaxed font-sans focus:border-purple-500/50 resize-y"
              />
            </div>
          )}

          {/* SUBTAB 3: STORIES & POLLS */}
          {campaignSubTab === 'story' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Instagram / TikTok 3-Story Sequence & Polls</span>
                <button
                  onClick={() => copyToClipboard(campaignKit?.storySequence, 'story')}
                  disabled={!campaignKit?.storySequence}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors disabled:opacity-40"
                >
                  {copiedKey === 'story' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'story' ? 'Copied!' : 'Copy Stories'}</span>
                </button>
              </div>
              <textarea
                value={campaignKit?.storySequence || ''}
                onChange={e => updateCampaignKit('storySequence', e.target.value)}
                placeholder="Story 1: Pain point poll&#10;Story 2: Product announcement&#10;Story 3: Link sticker CTA"
                rows={9}
                className="w-full p-3.5 rounded-xl bg-[#161a23] border border-white/[0.08] text-xs text-white outline-none leading-relaxed font-sans focus:border-purple-500/50 resize-y"
              />
            </div>
          )}

          {/* SUBTAB 4: VIDEO SCRIPT */}
          {campaignSubTab === 'video' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">60-Second Short Form Script</span>
                <button
                  onClick={() => copyToClipboard(campaignKit?.videoScript, 'video')}
                  disabled={!campaignKit?.videoScript}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors disabled:opacity-40"
                >
                  {copiedKey === 'video' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'video' ? 'Copied!' : 'Copy Script'}</span>
                </button>
              </div>
              <textarea
                value={campaignKit?.videoScript || ''}
                onChange={e => updateCampaignKit('videoScript', e.target.value)}
                placeholder="Click 'Generate AI Content' or write 60-second video script..."
                rows={10}
                className="w-full p-3.5 rounded-xl bg-[#161a23] border border-white/[0.08] text-xs text-purple-200 outline-none leading-relaxed font-mono focus:border-purple-500/50 resize-y"
              />
            </div>
          )}

          {/* SUBTAB 5: NEWSLETTER */}
          {campaignSubTab === 'newsletter' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Creator Email Newsletter Copy</span>
                <button
                  onClick={() => copyToClipboard(campaignKit?.newsletterDraft, 'newsletter')}
                  disabled={!campaignKit?.newsletterDraft}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors disabled:opacity-40"
                >
                  {copiedKey === 'newsletter' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'newsletter' ? 'Copied!' : 'Copy Newsletter'}</span>
                </button>
              </div>
              <textarea
                rows={9}
                value={campaignKit?.newsletterDraft || ''}
                onChange={e => updateCampaignKit('newsletterDraft', e.target.value)}
                placeholder="Click 'Generate AI Content' or write newsletter copy..."
                className="w-full p-3.5 rounded-xl bg-[#161a23] border border-white/[0.08] text-xs text-white outline-none leading-relaxed font-sans"
              />
            </div>
          )}

          {/* SUBTAB 6: DM OUTREACH */}
          {campaignSubTab === 'dm' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">1-on-1 DM Script</span>
                <button
                  onClick={() => copyToClipboard(campaignKit?.directMessageScript, 'dm')}
                  disabled={!campaignKit?.directMessageScript}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors disabled:opacity-40"
                >
                  {copiedKey === 'dm' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'dm' ? 'Copied!' : 'Copy DM'}</span>
                </button>
              </div>
              <textarea
                value={campaignKit?.directMessageScript || ''}
                onChange={e => updateCampaignKit('directMessageScript', e.target.value)}
                placeholder="Click 'Generate AI Content' or write DM outreach template..."
                rows={7}
                className="w-full p-3.5 rounded-xl bg-[#161a23] border border-white/[0.08] text-xs text-white outline-none leading-relaxed font-sans"
              />
            </div>
          )}

          {/* SUBTAB 7: TRACKING LINKS */}
          {campaignSubTab === 'links' && (
            <div className="p-4 rounded-xl bg-[#161a23] border border-white/[0.08] space-y-3">
              <div>
                <h4 className="text-xs font-bold text-white">Channel Attribution UTM Links</h4>
                <p className="text-[11px] text-slate-400">
                  Trackable pre-order URLs for creator social bio, stories, videos, and newsletters.
                </p>
              </div>

              <div className="space-y-2">
                {[
                  { channel: 'Instagram Stories', ref: 'instagram_story' },
                  { channel: 'TikTok / Shorts', ref: 'tiktok_video' },
                  { channel: 'Twitter / X', ref: 'twitter_post' },
                  { channel: 'Email Newsletter', ref: 'newsletter' },
                  { channel: '1-on-1 DM Outreach', ref: 'dm_outreach' },
                ].map((item, i) => {
                  const slug = (project?.productName || 'product').toLowerCase().replace(/[^a-z0-9]/g, '')
                  const fullUrl = `${origin}/preorder/${slug}?ref=${item.ref}`
                  return (
                    <div key={i} className="p-3 rounded-lg bg-[#0e1117] border border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="font-bold text-white text-xs block">{item.channel}</span>
                        <span className="text-[11px] text-purple-300 font-mono truncate">{fullUrl}</span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(fullUrl, `link-${i}`)}
                        className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-slate-200 text-xs font-bold border border-white/[0.08] flex items-center gap-1 transition-colors self-end sm:self-auto"
                      >
                        {copiedKey === `link-${i}` ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey === `link-${i}` ? 'Copied!' : 'Copy Link'}</span>
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* View Draft Modal */}
          {viewDraftTask && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="w-full max-w-lg rounded-3xl bg-[#0e1117] border border-white/[0.1] shadow-2xl p-6 space-y-4 animate-scale-in">
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-400 block">
                      Day {viewDraftTask.day} · {viewDraftTask.channel}
                    </span>
                    <h3 className="text-base font-extrabold text-white">{viewDraftTask.title}</h3>
                  </div>
                  <button
                    onClick={() => setViewDraftTask(null)}
                    className="p-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-slate-400 hover:text-white transition-colors"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-[#141720] border border-white/[0.06] max-h-72 overflow-y-auto">
                  <pre className="text-xs text-slate-200 font-sans whitespace-pre-wrap leading-relaxed">
                    {getTaskDraftContent(viewDraftTask)}
                  </pre>
                </div>

                <div className="flex items-center justify-between gap-3 pt-2">
                  <button
                    onClick={() => {
                      copyToClipboard(getTaskDraftContent(viewDraftTask), 'draft-modal')
                      showNotification('Draft content copied to clipboard!')
                    }}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-md"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedKey === 'draft-modal' ? 'Copied!' : 'Copy Draft'}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        handleToggleScheduleTask(viewDraftTask.id)
                        setViewDraftTask(null)
                      }}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark Completed</span>
                    </button>
                    <button
                      onClick={() => setViewDraftTask(null)}
                      className="px-3.5 py-2 rounded-xl bg-white/[0.06] text-slate-300 text-xs font-bold border border-white/[0.08]"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              onClick={() => handleStepChange('optimize')}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <span>Next: Run & Optimize</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: RUN & OPTIMIZE */}
      {activeStep === 'optimize' && (
        <div className="p-5 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-5">
          <div className="border-b border-white/[0.07] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>4. Run + Optimize Validation Engine</span>
              </h3>
              <p className="text-xs text-slate-400">
                Track traffic, CTR, signups, presales, revenue, conversion, attribution & audience feedback. AI analyzes performance to run messaging, pricing, landing-page & content experiments.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleRunExperimentsAI}
                disabled={isAnalyzingExperiments}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/40 text-xs font-bold transition-all disabled:opacity-50 active:scale-95 shadow-sm"
              >
                {isAnalyzingExperiments ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-300" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>Run AI Optimization</span>
                  </>
                )}
              </button>

              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Auto-Updating</span>
              </span>
            </div>
          </div>

          {/* Subtabs Navigation */}
          <div className="flex items-center gap-1.5 border-b border-white/[0.08] pb-3 overflow-x-auto">
            {[
              { id: 'telemetry', label: '1. Telemetry & Attribution', icon: Activity },
              { id: 'experiments', label: '2. AI Experiments (4 Areas)', icon: Sparkles, badge: experimentsData?.experiments?.length || 4 },
              { id: 'feedback', label: '3. Audience Feedback Pulse', icon: MessageSquare, badge: surveyResponses?.length || 0 },
            ].map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setOptimizeSubTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    optimizeSubTab === tab.id
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-950/50 border border-purple-500/60'
                      : 'text-slate-400 hover:text-white bg-white/[0.03] border border-transparent'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
                      {tab.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* SUBTAB 1: TELEMETRY & ATTRIBUTION */}
          {optimizeSubTab === 'telemetry' && (
            <div className="space-y-4">
              {/* Telemetry Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                  <span className="text-[10px] text-emerald-400 font-bold uppercase block">Presales Revenue</span>
                  <span className="text-lg font-extrabold text-white mt-0.5 block">${presalesRevenue.toLocaleString()}</span>
                  <span className="text-[10px] text-emerald-400/80">of ${presaleTarget.toLocaleString()} goal</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#161a23] border border-white/[0.08]">
                  <span className="text-[10px] text-purple-400 font-bold uppercase block">Unique Visitors</span>
                  <span className="text-lg font-extrabold text-white mt-0.5 block">{Number(project?.visitors || 0).toLocaleString()}</span>
                  <span className="text-[10px] text-slate-400">Tracked unique devices</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#161a23] border border-white/[0.08]">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Conversion Rate</span>
                  <span className="text-lg font-extrabold text-white mt-0.5 block">{Number(project?.conversionRate || 0).toFixed(1)}%</span>
                  <span className="text-[10px] text-slate-500">Tracked attribution</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#161a23] border border-white/[0.08]">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Days Left</span>
                  <span className="text-lg font-extrabold text-white mt-0.5 block">{project?.daysLeft || '—'}</span>
                  <span className="text-[10px] text-slate-500">Sprint duration</span>
                </div>
              </div>

              {/* Attribution Channel Matrix */}
              <div className="p-4 rounded-xl bg-[#161a23] border border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Channel Attribution & Traffic Source CTR</span>
                  <span className="text-[10px] font-mono text-purple-300">Live Funnel Breakdown</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  {[
                    {
                      name: 'Instagram Stories',
                      traffic: (project?.uniqueVisitors || []).filter(v => v.channel === 'Instagram Stories' || (v.path || '').includes('instagram') || (v.referrer || '').includes('instagram')).length,
                      conversions: reservations.filter(r => r.channel === 'Instagram Stories').length
                    },
                    {
                      name: 'TikTok / Shorts',
                      traffic: (project?.uniqueVisitors || []).filter(v => v.channel === 'TikTok / Shorts' || (v.path || '').includes('tiktok') || (v.referrer || '').includes('tiktok')).length,
                      conversions: reservations.filter(r => r.channel === 'TikTok / Shorts').length
                    },
                    {
                      name: 'Twitter / X',
                      traffic: (project?.uniqueVisitors || []).filter(v => v.channel === 'Twitter / X' || (v.path || '').includes('twitter') || (v.referrer || '').includes('twitter')).length,
                      conversions: reservations.filter(r => r.channel === 'Twitter / X').length
                    },
                    {
                      name: 'Email Newsletter',
                      traffic: (project?.uniqueVisitors || []).filter(v => v.channel === 'Email Newsletter' || (v.path || '').includes('newsletter') || (v.referrer || '').includes('newsletter')).length,
                      conversions: reservations.filter(r => r.channel === 'Email Newsletter').length
                    }
                  ].map((ch, idx) => {
                    const ctr = ch.traffic > 0 ? `${((ch.conversions / ch.traffic) * 100).toFixed(1)}%` : '0.0%'
                    return (
                      <div key={idx} className="p-3 rounded-lg bg-[#0e1117] border border-white/[0.04] space-y-1">
                        <span className="text-[11px] font-bold text-white block truncate">{ch.name}</span>
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span>Traffic: <strong className="text-white font-mono">{ch.traffic}</strong></span>
                          <span>CTR: <strong className="text-purple-300 font-mono">{ctr}</strong></span>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Pre-orders: <strong className="text-emerald-400 font-mono">{ch.conversions}</strong>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Recorded Presales List */}
              <div className="p-4 rounded-xl bg-[#161a23] border border-white/[0.08] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-bold text-white">Recorded Customer Pre-Orders ({reservations.length})</span>
                    <a
                      href={`${origin}/preorder/${productSlug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-purple-400 hover:text-purple-300 underline font-semibold flex items-center gap-0.5"
                    >
                      <span>Open Preorder Checkout</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">${presalesRevenue.toLocaleString()} Collected</span>
                    {reservations.length > 0 && (
                      <button
                        onClick={handleClearAllReservations}
                        className="text-[10px] text-red-400 hover:text-red-300 font-bold bg-red-500/10 hover:bg-red-500/20 px-2.5 py-1 rounded-lg border border-red-500/20 flex items-center gap-1 transition-colors"
                        title="Clear all recorded test pre-orders"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Clear All</span>
                      </button>
                    )}
                  </div>
                </div>

                {reservations.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 text-xs border border-dashed border-white/[0.08] rounded-xl space-y-1">
                    <p>No customer pre-orders recorded yet.</p>
                    <p className="text-[11px] text-slate-400">
                      Visit <a href={`${origin}/preorder/${productSlug}`} target="_blank" rel="noopener noreferrer" className="text-purple-400 underline">{origin}/preorder/{productSlug}</a> to submit live pre-orders via Stripe or PayPal.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {reservations.map(res => (
                      <div key={res.id} className="p-3 rounded-lg bg-[#0e1117] border border-white/[0.06] flex items-center justify-between text-xs">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{res.name}</span>
                            {res.paymentMethod && (
                              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                res.paymentMethod.toLowerCase().includes('paypal') 
                                  ? 'bg-[#0070ba]/20 text-[#38a9f5] border border-[#0070ba]/30'
                                  : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              }`}>
                                {res.paymentMethod}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">{res.email}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-emerald-400">+${res.amount}</div>
                          <span className="text-[10px] text-slate-400">{res.tier}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Record Presale Transaction */}
              <div className="p-4 rounded-xl bg-[#161a23] border border-white/[0.08] space-y-3">
                <span className="text-xs font-bold text-white block">Record Pre-Order Transaction</span>
                <form onSubmit={handleSimulatePresale} className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                  <input
                    type="text"
                    placeholder="Backer Name"
                    value={simBuyerName}
                    onChange={e => setSimBuyerName(e.target.value)}
                    className="px-3 py-2 rounded-lg bg-[#0e1117] border border-white/[0.08] text-xs text-white outline-none focus:border-purple-500/50"
                  />
                  <input
                    type="email"
                    placeholder="Backer Email"
                    value={simBuyerEmail}
                    onChange={e => setSimBuyerEmail(e.target.value)}
                    className="px-3 py-2 rounded-lg bg-[#0e1117] border border-white/[0.08] text-xs text-white outline-none focus:border-purple-500/50"
                  />
                  <select
                    value={simBuyerTier}
                    onChange={e => setSimBuyerTier(Number(e.target.value))}
                    className="px-3 py-2 rounded-lg bg-[#0e1117] border border-white/[0.08] text-xs text-white outline-none"
                  >
                    <option value={99}>Founding Annual ($99)</option>
                    <option value={19}>Refundable Deposit ($19)</option>
                    <option value={199}>VIP Founder Pass ($199)</option>
                  </select>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Record (+${simBuyerTier})</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* SUBTAB 2: AI EXPERIMENTS (4 CRITICAL AREAS) */}
          {optimizeSubTab === 'experiments' && (
            <div className="space-y-4 text-xs">
              {/* AI Performance Audit Banner */}
              <div className="p-4 rounded-xl bg-[#161a23] border border-purple-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>AI Optimization Audit & Bottleneck Analysis</span>
                  </span>
                  <button
                    onClick={handleRunExperimentsAI}
                    disabled={isAnalyzingExperiments}
                    className="text-[10px] font-bold text-purple-200 bg-purple-600 hover:bg-purple-500 px-3 py-1 rounded-lg transition-colors flex items-center gap-1"
                  >
                    {isAnalyzingExperiments ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    <span>{experimentsData ? 'Re-Analyze with AI' : 'Generate Experiments with AI'}</span>
                  </button>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  {experimentsData?.performanceAudit?.summary || 'Click "Generate Experiments with AI" to analyze live telemetry and formulate experiments across Messaging, Pricing, Landing Page, and Creator Content.'}
                </p>
              </div>

              {/* Experiments Cards Grid */}
              {!experimentsData?.experiments || experimentsData.experiments.length === 0 ? (
                <div className="p-8 text-center text-slate-500 border border-dashed border-white/[0.08] rounded-xl space-y-3">
                  <p>No growth experiments generated yet.</p>
                  <button
                    onClick={handleRunExperimentsAI}
                    disabled={isAnalyzingExperiments}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors inline-flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Analyze Telemetry & Generate Experiments</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {experimentsData.experiments.map((exp) => (
                    <div key={exp.id} className="p-4 rounded-xl bg-[#141720] border border-white/[0.08] space-y-3 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            {exp.category?.replace('_', ' ')} Experiment
                          </span>
                          <span className="text-[10px] font-bold text-emerald-400 font-mono">
                            {exp.expectedUplift}
                          </span>
                        </div>

                        <h4 className="font-bold text-white text-xs leading-snug">{exp.title}</h4>
                        <p className="text-[11px] text-slate-400 leading-relaxed">{exp.hypothesis}</p>

                        <div className="p-2.5 rounded-lg bg-[#0e1117] border border-white/[0.04] space-y-1 text-[11px]">
                          <span className="text-purple-300 font-bold block">Proposed Variant:</span>
                          <p className="text-slate-300 italic">{exp.variant}</p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between gap-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${
                          exp.status === 'applied' ? 'text-emerald-400' : 'text-slate-400'
                        }`}>
                          Status: {exp.status || 'Ready'}
                        </span>

                        <button
                          onClick={() => handleApplyExperiment(exp)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ${
                            exp.status === 'applied'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-purple-600 hover:bg-purple-500 text-white'
                          }`}
                        >
                          <Check className="w-3 h-3" />
                          <span>{exp.status === 'applied' ? 'Applied' : 'Apply Experiment'}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SUBTAB 3: AUDIENCE FEEDBACK PULSE */}
          {optimizeSubTab === 'feedback' && (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">Live Audience Feedback & Demand Sentiment</h4>
                  <p className="text-[11px] text-slate-400">
                    Real-time qualitative insights gathered from customer discovery surveys and backer checkout notes.
                  </p>
                </div>
                <span className="text-[10px] font-mono text-purple-300">
                  {surveyResponses?.length || 0} Discovery Feedback Recorded
                </span>
              </div>

              {(!surveyResponses || surveyResponses.length === 0) ? (
                <div className="p-8 text-center text-slate-500 border border-dashed border-white/[0.08] rounded-xl space-y-2">
                  <p>No audience discovery responses recorded yet.</p>
                  <p className="text-[11px] text-slate-400">Share your research link or simulate responses in Step 2 Subtab 3 to view live feedback pulse.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {surveyResponses.map(res => (
                    <div key={res.id} className="p-3.5 rounded-xl bg-[#141720] border border-white/[0.06] space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{res.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{res.email}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          Intent: {res.rating || 8}/10 🔥
                        </span>
                      </div>

                      {res.answers && (
                        <div className="space-y-1 text-[11px] text-slate-300 bg-[#0e1117] p-2.5 rounded-lg border border-white/[0.04]">
                          {Object.entries(res.answers).map(([qKey, ans], aIdx) => (
                            <div key={aIdx} className="leading-relaxed">
                              <strong className="text-slate-400 font-mono">{qKey}:</strong> {ans}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              onClick={() => handleStepChange('gate')}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <span>Next: Gate</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: VALIDATION GATE */}
      {activeStep === 'gate' && (
        <div className="p-5 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-5">
          <div className="border-b border-white/[0.07] pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>5. Validation Gate Checkpoint</span>
              </h3>
              <p className="text-xs text-slate-400">
                PASS → Advance to Phase 2 (Build MVP) | TEST AGAIN → Iterate | FAIL → Kill
              </p>
            </div>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${
              isGatePassed ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-extrabold' : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
            }`}>
              Gate Status: {isGatePassed ? 'PASS (Ready for MVP Build)' : `${presaleTarget > 0 ? Math.round((presalesRevenue/presaleTarget)*100) : 0}% of $5K Target`}
            </span>
          </div>

          <div className="grid sm:grid-cols-3 gap-3 text-center text-xs">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
              <span className="text-[10px] text-emerald-400 font-bold uppercase block">Presale Revenue Collected</span>
              <span className="text-xl font-extrabold text-white mt-1 block">${presalesRevenue.toLocaleString()}</span>
              <span className="text-[10px] text-slate-400">Requirement: ${presaleTarget.toLocaleString()}</span>
            </div>
            <div className="p-4 rounded-xl bg-[#161a23] border border-white/[0.08]">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Verified Backers</span>
              <span className="text-xl font-extrabold text-white mt-1 block">{reservations.length}</span>
              <span className="text-[10px] text-slate-400">Pledged reservations</span>
            </div>
            <div className="p-4 rounded-xl bg-[#161a23] border border-white/[0.08]">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Conversion Rate</span>
              <span className="text-xl font-extrabold text-white mt-1 block">{Number(project?.conversionRate || 0).toFixed(1)}%</span>
              <span className="text-[10px] text-slate-400">Funnel efficiency</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#161a23] border border-white/[0.08] space-y-3">
            <span className="text-xs font-bold text-white block">Executive Validation Decision</span>
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={async () => {
                  if (project?.id) {
                    try {
                      await recordGateDecision(project.id, {
                        decision: 'pass_to_phase2',
                        notes: `Validation target passed with $${presalesRevenue.toLocaleString()} presales and ${reservations.length} backers.`
                      })
                    } catch (e) {
                      console.warn('[Phase1] DB gate decision warning:', e)
                    }
                  }
                  showNotification('Validation Gate Passed! Advancing to Phase 2: Build MVP.')
                  onAdvanceToPhase2?.()
                }}
                className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-950/50 transition-all active:scale-95 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>PASS → Build MVP</span>
              </button>
              <button
                onClick={async () => {
                  if (project?.id) {
                    recordGateDecision(project.id, {
                      decision: 'iterate_validation',
                      notes: 'Resetting validation sprint for new optimization iteration.'
                    }).catch(e => console.warn(e))
                  }
                  showNotification('Validation sprint reset for new iteration.')
                  handleStepChange('optimize')
                }}
                className="py-2.5 px-4 rounded-xl bg-white/[0.04] text-slate-300 hover:text-white border border-white/[0.08] text-xs font-semibold transition-colors cursor-pointer"
              >
                TEST AGAIN
              </button>
              <button
                onClick={async () => {
                  if (project?.id) {
                    recordGateDecision(project.id, {
                      decision: 'kill_project',
                      notes: 'Project failed validation gate threshold.'
                    }).catch(e => console.warn(e))
                  }
                  showNotification('Project archived.')
                }}
                className="py-2.5 px-4 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 text-xs font-bold transition-colors cursor-pointer"
              >
                FAIL → Kill
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
