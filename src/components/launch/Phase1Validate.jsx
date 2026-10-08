import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  CheckCircle2, DollarSign, Layout, Sparkles, Save, Check, Plus, Trash2,
  Loader2, AlertCircle, Copy, Video, MessageSquare, ExternalLink, Globe,
  CreditCard, Users, TrendingUp, RefreshCw, FileText, Megaphone, Target,
  Flag, ArrowRight, Layers, HelpCircle, BarChart3, Radio, ShieldCheck,
  Palette, Smartphone, Send, Mail, Image, Monitor, Zap, Compass, PieChart, Activity, Tablet, Calendar, Eye, X, Bell, Lock, RotateCcw,
  Youtube, Shield, Sliders, Trophy, Flame, Coins, Award, Crown, Radar, MousePointerClick, Camera, ShoppingBag, Gauge, Rocket, Clock, ShieldAlert,
  Download, Play, ChevronDown, ChevronUp
} from 'lucide-react'
import {
  generateValidationPlanAI,
  generateValidationCampaignKitAI,
  generateDiscoverySurveyAI,
  analyzeSurveyResponsesAI,
  analyzeAndGenerateExperimentsAI
} from '../../services/ai'
import { simulateUniqueDeviceVisit } from '../../services/tracker'
import {
  updateValidationPlan,
  updateValidationCampaign,
  addProjectReservation,
  addProjectSurveyResponse,
  deleteSurveyResponse,
  clearAllSurveyResponses,
  logProjectActivity,
  recordGateDecision,
  updateCoLaunchProject,
  getFrontendUrl,
  sendTaskReminder,
  generateCampaignSocialImage,
  generateCampaignVideo,
  sendCampaignPostEmail,
  toggleAutonomousCampaignDelivery,
  startCampaignSimulation,
  getCampaignSimulationStatus,
  stopCampaignSimulation
} from '../../services/opsApi'
import {
  parseMainPricingAmount,
  parseDepositPricingAmount,
  sanitizePricingConfig
} from '../../utils/pricing'
import {
  Phase1ValidateSkeleton,
  Phase1CampaignGenSkeleton,
  Phase1ExperimentsGenSkeleton
} from './Section2Skeletons'
import ProductMockupCanvas from './ProductMockupCanvas'
import ProductMockupDisplay from './ProductMockupDisplay'
import AudienceGroundingModal from './AudienceGroundingModal'
import PostVisualMockup, { XLogo } from './PostVisualMockup'
import { getProjectAudienceGrounding } from '../../utils/audienceGrounding'
import { getPhase1StepGuards, getProjectActiveStep } from '../../utils/stepGuards'
import { fetchCreatorYouTubeVideos } from '../../services/scraper'

export default function Phase1Validate({
  project,
  api,
  activeStepId,
  onSelectStep,
  onUpdateProject,
  onAdvanceToPhase2
}) {
  const resolveInitialStep = () => {
    if (activeStepId) return activeStepId
    return getProjectActiveStep(project, 1)
  }
  const [activeStep, setActiveStep] = useState(resolveInitialStep)
  const [assetSubTab, setAssetSubTab] = useState('product_assets')
  const [campaignSubTab, setCampaignSubTab] = useState('schedule')
  const [viewDraftTask, setViewDraftTask] = useState(null)
  const [draftModalView, setDraftModalView] = useState('visual') // 'visual' | 'text'
  const [isAnalyzingExperiments, setIsAnalyzingExperiments] = useState(false)
  const [isAdvancingPhase, setIsAdvancingPhase] = useState(false)
  const [isIteratingGate, setIsIteratingGate] = useState(false)
  const [isArchivingProject, setIsArchivingProject] = useState(false)

  // Robust resolver to ensure experiments are NEVER lost across navigation, rerender, or polling
  const resolveExperimentsData = (proj) => {
    if (proj?.experimentsData?.experiments?.length > 0) return proj.experimentsData
    if (proj?.metadataInfo?.experimentsData?.experiments?.length > 0) return proj.metadataInfo.experimentsData
    if (proj?.metadata_info?.experiments_data?.experiments?.length > 0) return proj.metadata_info.experiments_data
    if (proj?.metadataInfo?.experiments_data?.experiments?.length > 0) return proj.metadataInfo.experiments_data
    if (Array.isArray(proj?.experiments) && proj.experiments.length > 0) {
      return {
        experiments: proj.experiments,
        performanceAudit: proj?.metadataInfo?.performanceAudit || proj?.metadata_info?.performanceAudit || null
      }
    }
    if (Array.isArray(proj?.telemetry?.experiments) && proj.telemetry.experiments.length > 0) {
      return {
        experiments: proj.telemetry.experiments,
        performanceAudit: proj?.metadataInfo?.performanceAudit || proj?.metadata_info?.performanceAudit || null
      }
    }
    return null
  }

  const [experimentsData, setExperimentsData] = useState(() => resolveExperimentsData(project))
  const [mockupImage, setMockupImage] = useState(() => project?.mockupImage || null)
  const [showAudienceIntelModal, setShowAudienceIntelModal] = useState(false)
  const [audienceIntelModalTab, setAudienceIntelModalTab] = useState('transcripts')
  const audienceGroundingData = getProjectAudienceGrounding(project)

  const creatorChannelUrl = (() => {
    if (project?.channelUrl && String(project.channelUrl).startsWith('http')) return project.channelUrl
    if (project?.youtubeUrl && String(project.youtubeUrl).startsWith('http')) return project.youtubeUrl
    if (project?.creatorChannel && String(project.creatorChannel).startsWith('http')) return project.creatorChannel
    if (project?.socialUrl && String(project.socialUrl).startsWith('http')) return project.socialUrl
    if (project?.channel_url && String(project.channel_url).startsWith('http')) return project.channel_url
    if (project?.youtube_url && String(project.youtube_url).startsWith('http')) return project.youtube_url

    const handle = String(project?.creatorHandle || project?.creator_handle || project?.handle || '').replace(/^@/, '').trim()
    if (handle && !/^[0-9a-f-]{10,}$/i.test(handle)) {
      return `https://www.youtube.com/@${handle}`
    }

    const name = String(project?.creatorName || project?.creator_name || '').trim()
    if (name && !/^[0-9a-f-]{10,}$/i.test(name)) {
      return `https://www.youtube.com/results?search_query=${encodeURIComponent(name)}`
    }

    return 'https://www.youtube.com'
  })()

  const [isStep2Approved, setIsStep2Approved] = useState(() => Boolean(
    project?.assetsApproved ||
    project?.landingPageApproved ||
    project?.validationCampaign?.review_status === 'approved' ||
    project?.validationCampaign?.reviewStatus === 'approved'
  ))

  useEffect(() => {
    if (activeStepId) setActiveStep(activeStepId)
  }, [activeStepId])

  useEffect(() => {
    if (
      project?.assetsApproved ||
      project?.landingPageApproved ||
      project?.validationCampaign?.review_status === 'approved' ||
      project?.validationCampaign?.reviewStatus === 'approved'
    ) {
      setIsStep2Approved(true)
    }
  }, [
    project?.assetsApproved,
    project?.landingPageApproved,
    project?.validationCampaign?.review_status,
    project?.validationCampaign?.reviewStatus
  ])

  // Synchronize experimentsData whenever project prop updates or polling refreshes
  useEffect(() => {
    const incoming = resolveExperimentsData(project)
    if (incoming) {
      setExperimentsData(incoming)
    }
  }, [
    project?.id,
    project?.experimentsData,
    project?.metadataInfo?.experimentsData,
    project?.metadata_info?.experiments_data,
    project?.experiments,
    project?.telemetry?.experiments
  ])

  // Live YouTube Creator Uploads Synchronization
  useEffect(() => {
    const hasPosts = (Array.isArray(project?.recentPosts) && project.recentPosts.length > 0) ||
      (Array.isArray(project?.videos) && project.videos.length > 0)
    if (!hasPosts) {
      const cleanH = String(project?.creatorHandle || project?.creator_handle || project?.handle || project?.creatorName || '').replace(/^@/, '').trim()
      if (cleanH && !/^[0-9a-f-]{15,}$/i.test(cleanH)) {
        fetchCreatorYouTubeVideos(cleanH).then(vids => {
          if (vids && vids.length > 0 && onUpdateProject) {
            onUpdateProject(prev => {
              if (!prev) return prev
              return {
                ...prev,
                recentPosts: vids,
                videos: vids
              }
            })
          }
        }).catch(() => {})
      }
    }
  }, [project?.id, project?.creatorHandle, project?.recentPosts, onUpdateProject])

  // Real Project Presales State
  const [presalesRevenue, setPresalesRevenue] = useState(() => {
    if (project?.currentPresales !== undefined) {
      return Number(String(project.currentPresales).replace(/[^0-9.]/g, '')) || 0
    }
    return 0
  })
  // Real Project Reservations / Backers state
  const [reservations, setReservations] = useState(() => project?.reservations || [])

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

  // Dynamic pricing resolution
  const dynamicPricingSource =
    project?.selectedConcept?.pricing ||
    project?.pricing ||
    plan?.pricing ||
    project?.validationPlan?.pricing ||
    49
  const dynamicMainPrice = parseMainPricingAmount(dynamicPricingSource, 49)
  const dynamicDepositPrice = parseDepositPricingAmount(dynamicPricingSource, dynamicMainPrice)
  const dynamicVipPrice = Math.round(dynamicMainPrice * 2)

  // Dynamic presale target derived from validation plan threshold or project
  const parseThresholdAmount = (str) => {
    if (!str) return 0
    const match = String(str).replace(/,/g, '').match(/\$(\d+)/)
    return match ? Number(match[1]) : 0
  }
  const derivedPlanTarget = parseThresholdAmount(plan?.threshold || project?.validationPlan?.threshold)
  const presaleTarget = derivedPlanTarget > 0 ? derivedPlanTarget : Number(project?.presaleTarget || project?.targetRevenue || 5000)

  // Real Project Campaign Kit State (Database Sourced)
  const [campaignKit, setCampaignKit] = useState(() => {
    const fromProject = project?.campaignKit ||
      project?.validationCampaign?.campaignKit ||
      project?.validationCampaign?.campaign_kit ||
      (project?.validationCampaign?.productAssets?.announcementPost ? project?.validationCampaign?.productAssets : null) ||
      (project?.validationCampaign?.product_assets?.announcementPost ? project?.validationCampaign?.product_assets : null)
    if (fromProject && (fromProject.announcementPost || fromProject.storySequence || fromProject.videoScript || fromProject.newsletterDraft || fromProject.postingSchedule?.length > 0)) {
      return fromProject
    }
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

  // Synchronize campaignKit from project prop when database updates
  useEffect(() => {
    const fromProject = project?.campaignKit ||
      project?.validationCampaign?.campaignKit ||
      project?.validationCampaign?.campaign_kit ||
      (project?.validationCampaign?.productAssets?.announcementPost ? project?.validationCampaign?.productAssets : null) ||
      (project?.validationCampaign?.product_assets?.announcementPost ? project?.validationCampaign?.product_assets : null)
    if (fromProject && (fromProject.announcementPost || fromProject.storySequence || fromProject.videoScript || fromProject.newsletterDraft || fromProject.postingSchedule?.length > 0)) {
      setCampaignKit(fromProject)
      if (fromProject.pacingMode) setCampaignPacing(fromProject.pacingMode)
      if (fromProject.postingFrequency) setPostingFrequency(fromProject.postingFrequency)
      if (fromProject.customPrompt !== undefined) setCampaignStrategyPrompt(fromProject.customPrompt)
    }
  }, [project?.id, project?.campaignKit, project?.validationCampaign?.campaignKit, project?.validationCampaign?.campaign_kit])

  // Sanitized dynamic pricing configuration
  const sanitizedPricingConfig = sanitizePricingConfig(
    campaignKit?.pricingConfig,
    project?.selectedConcept?.pricing ||
    project?.pricing ||
    project?.validationPlan?.pricing ||
    plan?.pricing ||
    project?.concepts?.find(c => c.selected)?.pricing
  )
  const activeFoundingPrice = sanitizedPricingConfig.foundingPrice
  const activeDepositPrice = sanitizedPricingConfig.depositPrice
  const activeVipPrice = Math.round(activeFoundingPrice * 2)

  // Simulated buyer form in Run & Optimize
  const [simBuyerName, setSimBuyerName] = useState('')
  const [simBuyerEmail, setSimBuyerEmail] = useState('')
  const [simBuyerTier, setSimBuyerTier] = useState(() => activeFoundingPrice)
  const [showRecordForm, setShowRecordForm] = useState(false)

  useEffect(() => {
    setSimBuyerTier(activeFoundingPrice)
  }, [activeFoundingPrice])

  // Creator Launch Pacing & Customizable Strategy Guidance Prompt
  const [campaignPacing, setCampaignPacing] = useState(() => project?.campaignKit?.pacingMode || 'low_burden')
  const [postingFrequency, setPostingFrequency] = useState(() => project?.campaignKit?.postingFrequency || '1 video per week (Standard YouTube)')
  const [campaignStrategyPrompt, setCampaignStrategyPrompt] = useState(() => project?.campaignKit?.customPrompt || '')

  // Check if Campaign Kit has been generated or populated
  const hasCampaignGenerated = Boolean(
    campaignKit && (
      (Array.isArray(campaignKit.postingSchedule) && campaignKit.postingSchedule.length > 0) ||
      Boolean(String(campaignKit.announcementPost || '').trim()) ||
      Boolean(String(campaignKit.storySequence || '').trim()) ||
      Boolean(String(campaignKit.videoScript || '').trim()) ||
      Boolean(String(campaignKit.newsletterDraft || '').trim())
    )
  )

  const todayTask = (campaignKit?.postingSchedule || []).find(t => t.isToday) ||
    (campaignKit?.postingSchedule || []).find(t => !t.done) ||
    (campaignKit?.postingSchedule || [])[0]

  // Real Project Survey & Research State (Database Sourced)
  const [surveyData, setSurveyData] = useState(() => {
    const fromProject = project?.surveyData || project?.validationCampaign?.researchSurvey || project?.validationCampaign?.research_survey
    if (fromProject && (fromProject.summary || fromProject.questions?.length > 0)) {
      return fromProject
    }
    return {
      summary: '',
      keyTakeaways: [],
      questions: []
    }
  })

  // Synchronize surveyData from project prop when database updates
  useEffect(() => {
    const fromProject = project?.surveyData || project?.validationCampaign?.researchSurvey || project?.validationCampaign?.research_survey
    if (fromProject && (fromProject.summary || fromProject.questions?.length > 0)) {
      setSurveyData(fromProject)
    }
  }, [project?.id, project?.surveyData, project?.validationCampaign?.researchSurvey, project?.validationCampaign?.research_survey])
  const [newQuestionText, setNewQuestionText] = useState('')
  const [newQuestionCategory, setNewQuestionCategory] = useState('Pain Point')

  // Real Survey & Research Responses
  const [surveyResponses, setSurveyResponses] = useState(() => {
    const raw = project?.surveyResponses ||
      project?.validationCampaign?.researchSurvey?.responses ||
      project?.validationCampaign?.research_survey?.responses ||
      project?.surveyData?.responses ||
      (project?.metadataInfo || project?.metadata_info)?.survey_responses
    return Array.isArray(raw) ? raw : []
  })
  const [surveyAnalysis, setSurveyAnalysis] = useState(() => {
    return project?.surveyAnalysis ||
      project?.validationCampaign?.researchSurvey?.analysis ||
      project?.validationCampaign?.research_survey?.analysis ||
      project?.surveyData?.analysis ||
      (project?.metadataInfo || project?.metadata_info)?.survey_analysis ||
      null
  })
  const [isAnalyzingResponses, setIsAnalyzingResponses] = useState(false)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [imageGenError, setImageGenError] = useState(null)
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false)
  const [videoGenError, setVideoGenError] = useState(null)
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
        pricing: project.selectedConcept?.pricing || project.pricing || '$29/mo Starter • $79/mo Pro',
        testMethod: '1) Co-founder video announcement, 2) 10 user interviews, 3) 48-hour Founding Pre-Order sprint',
        period: '14 days',
        threshold: '$5,000 in pre-sales or 50 paid founding reservations'
      })
    }

    const incomingKit = project.campaignKit ||
      project.validationCampaign?.campaignKit ||
      project.validationCampaign?.campaign_kit ||
      (project.validationCampaign?.productAssets?.announcementPost ? project.validationCampaign?.productAssets : null) ||
      (project.validationCampaign?.product_assets?.announcementPost ? project.validationCampaign?.product_assets : null)
    if (incomingKit && (incomingKit.announcementPost || incomingKit.videoScript || incomingKit.storySequence || incomingKit.newsletterDraft || incomingKit.postingSchedule?.length > 0)) {
      setCampaignKit(incomingKit)
      if (incomingKit.pacingMode) setCampaignPacing(incomingKit.pacingMode)
      if (incomingKit.postingFrequency) setPostingFrequency(incomingKit.postingFrequency)
      if (incomingKit.customPrompt !== undefined) setCampaignStrategyPrompt(incomingKit.customPrompt)
    } else {
      setCampaignKit(null)
    }

    const incomingSurvey = project.surveyData || project.validationCampaign?.researchSurvey || project.validationCampaign?.research_survey
    if (incomingSurvey && (incomingSurvey.summary || incomingSurvey.questions?.length > 0)) {
      setSurveyData(incomingSurvey)
    } else {
      setSurveyData(null)
    }

    const resolvedResponses = (Array.isArray(project.surveyResponses) && project.surveyResponses.length > 0)
      ? project.surveyResponses
      : (Array.isArray(incomingSurvey?.responses) ? incomingSurvey.responses : (Array.isArray((project.metadataInfo || project.metadata_info)?.survey_responses) ? (project.metadataInfo || project.metadata_info).survey_responses : []))

    const resolvedAnalysis = project.surveyAnalysis ||
      incomingSurvey?.analysis ||
      (project.metadataInfo || project.metadata_info)?.survey_analysis ||
      null

    setSurveyResponses(resolvedResponses)
    setSurveyAnalysis(resolvedAnalysis)
    const incomingExperiments = resolveExperimentsData(project)
    if (incomingExperiments) {
      setExperimentsData(incomingExperiments)
      setExperiments(incomingExperiments.experiments || [])
    } else {
      setExperiments(Array.isArray(project.experiments) ? project.experiments : [])
    }
  }, [project?.id, project?.creatorId, project?.productName])

  useEffect(() => {
    if (Array.isArray(project?.surveyResponses)) {
      setSurveyResponses(project.surveyResponses)
    }
  }, [project?.surveyResponses])

  useEffect(() => {
    if (project?.surveyAnalysis) {
      setSurveyAnalysis(project.surveyAnalysis)
    }
  }, [project?.surveyAnalysis])

  useEffect(() => {
    if (project?.reservations) setReservations(project.reservations)
  }, [project?.reservations])

  useEffect(() => {
    const incoming = resolveExperimentsData(project)
    if (incoming) {
      setExperimentsData(incoming)
      setExperiments(incoming.experiments || [])
    }
  }, [project?.experiments, project?.experimentsData, project?.metadataInfo?.experimentsData, project?.telemetry?.experiments])

  useEffect(() => {
    if (project?.currentPresales !== undefined) {
      setPresalesRevenue(Number(String(project.currentPresales).replace(/[^0-9.]/g, '')) || 0)
    }
  }, [project?.currentPresales])

  useEffect(() => {
    const handleSync = (e) => {
      try {
        const cur = (e?.detail && typeof e.detail === 'object') ? e.detail : null
        if (cur) {
          if (cur.reservations) setReservations(cur.reservations)
          if (cur.currentPresales !== undefined) setPresalesRevenue(Number(cur.currentPresales) || 0)
          if (onUpdateProject) {
            onUpdateProject(prev => ({ ...(prev || {}), ...cur }))
          }
        }
      } catch (err) {}
    }

    window.addEventListener('forge_project_updated', handleSync)
    return () => {
      window.removeEventListener('forge_project_updated', handleSync)
    }
  }, [onUpdateProject])

  const origin = getFrontendUrl()
  const productSlug = (project?.slug || project?.productName || 'product').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  const normalizeUrlText = (text) => {
    if (typeof text !== 'string') return text
    const realPreorderUrl = `${origin}/preorder/${productSlug}`
    return text
      .replace(/https?:\/\/[a-zA-Z0-9\-_.]+\.creatorforge\.app\/preorder/gi, realPreorderUrl)
      .replace(/https?:\/\/[a-zA-Z0-9\-_.]+\.creatorforge\.app\/launch/gi, `${origin}/p/${productSlug}`)
      .replace(/https?:\/\/flutterflowflowai\.creatorforge\.app\/preorder/gi, realPreorderUrl)
      .replace(/https?:\/\/localhost:\d+\/preorder\/[a-zA-Z0-9\-_]+/gi, realPreorderUrl)
      .replace(/https?:\/\/localhost:\d+\/preorder/gi, realPreorderUrl)
      .replace(/https?:\/\/localhost:\d+\/p\/[a-zA-Z0-9\-_]+/gi, `${origin}/p/${productSlug}`)
      .replace(/https?:\/\/localhost:\d+\/p/gi, `${origin}/p`)
      .replace(/https?:\/\/localhost:\d+/gi, origin)
  }

  useEffect(() => {
    if (campaignKit) {
      const hasOldUrls = Boolean(
        campaignKit.announcementPost?.includes('creatorforge.app') ||
        campaignKit.announcementPost?.includes('localhost:') ||
        campaignKit.storySequence?.includes('creatorforge.app') ||
        campaignKit.storySequence?.includes('localhost:') ||
        campaignKit.newsletterDraft?.includes('creatorforge.app') ||
        campaignKit.newsletterDraft?.includes('localhost:') ||
        campaignKit.directMessageScript?.includes('creatorforge.app') ||
        campaignKit.directMessageScript?.includes('localhost:')
      )
      if (hasOldUrls) {
        const sanitized = {
          ...campaignKit,
          announcementPost: normalizeUrlText(campaignKit.announcementPost),
          storySequence: normalizeUrlText(campaignKit.storySequence),
          newsletterDraft: normalizeUrlText(campaignKit.newsletterDraft),
          directMessageScript: normalizeUrlText(campaignKit.directMessageScript)
        }
        setCampaignKit(sanitized)
        if (onUpdateProject) onUpdateProject(curr => ({ ...(curr || {}), campaignKit: sanitized }))
      }
    }
  }, [campaignKit, origin, productSlug])

  const showNotification = (msg) => {
    setFeedbackNotice(msg)
    setTimeout(() => setFeedbackNotice(''), 3500)
  }

  const copyToClipboard = (text, key) => {
    if (!text) return
    const sanitized = normalizeUrlText(text)
    navigator.clipboard?.writeText(sanitized)
    setCopiedKey(key)
    showNotification('Copied to clipboard!')
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const updatePlan = (field, value) => {
    setPlan(prev => ({ ...prev, [field]: value }))
  }

  const campaignSyncTimerRef = useRef(null)

  const updateCampaignKit = (field, value) => {
    setCampaignKit(prev => {
      const next = { ...prev, [field]: value }
      if (onUpdateProject) {
        onUpdateProject(curr => ({
          ...(curr || {}),
          campaignKit: next,
          metadataInfo: { ...(curr?.metadataInfo || {}), campaign_kit: next }
        }))
      }
      if (project?.id) {
        if (campaignSyncTimerRef.current) clearTimeout(campaignSyncTimerRef.current)
        campaignSyncTimerRef.current = setTimeout(() => {
          const step2Assets = project?.validationCampaign?.productAssets || project?.validationCampaign?.product_assets || {
            productName: project?.productName,
            productTagline: project?.productTagline,
            pricingConfig: sanitizedPricingConfig
          }
          updateValidationCampaign(project.id, {
            product_assets: step2Assets,
            campaign_kit: next,
            campaignKit: next,
            creator_tasks: next.postingSchedule || [],
            campaign_launched: true,
            infrastructure: {
              landingPageUrl: `/p/${productSlug}`,
              checkoutUrl: `/p/${productSlug}/checkout`,
              waitlistCount: 240,
              attributionTracking: true
            },
            research_survey: surveyData,
            review_status: 'approved'
          }).catch(e => console.warn('[Phase1] DB campaign auto-sync warning:', e))
        }, 600)
      }
      return next
    })
  }

  const saveAll = () => {
    setSaveStatus('saving')
    const kitToSave = campaignKit ? {
      ...campaignKit,
      pacingMode: campaignPacing,
      postingFrequency,
      customPrompt: campaignStrategyPrompt
    } : null

    const updated = {
      ...(project || {}),
      validationPlan: plan,
      presaleTarget: presaleTarget,
      targetRevenue: presaleTarget,
      campaignKit: kitToSave,
      surveyData: surveyData,
      reservations: reservations,
      experiments: experimentsData?.experiments || experiments || [],
      experimentsData: experimentsData,
      currentPresales: presalesRevenue,
      ...(isStep2Approved ? { assetsApproved: true, landingPageApproved: true } : {})
    }

    if (onUpdateProject) {
      onUpdateProject(prev => ({ ...(prev || {}), ...updated }))
    }

    // Persist to backend database tables in SQLite / PostgreSQL
    if (project?.id) {
      logProjectActivity(project.id, {
        action: 'Validation Plan & Assets Configured',
        details: `Saved pricing (${plan.pricing || '$49/mo'}), presale target ($${presaleTarget.toLocaleString()}), and validation campaign assets.`,
        step: 'plan',
        phase: 1
      }).catch(e => console.warn('[Phase1] Activity logging warning:', e))

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

      const step2Assets = project?.validationCampaign?.productAssets || project?.validationCampaign?.product_assets || {
        productName: project?.productName,
        productTagline: project?.productTagline,
        pricingConfig: sanitizedPricingConfig
      }
      updateValidationCampaign(project.id, {
        product_assets: step2Assets,
        campaign_kit: kitToSave,
        campaignKit: kitToSave,
        creator_tasks: kitToSave?.postingSchedule || project?.creatorTasks || [],
        campaign_launched: Boolean(project?.campaignLaunched || hasCampaignGenerated),
        infrastructure: {
          landingPageUrl: `/p/${productSlug}`,
          checkoutUrl: `/p/${productSlug}/checkout`,
          waitlistCount: 240,
          attributionTracking: true
        },
        research_survey: surveyData,
        review_status: 'approved'
      }).catch(e => console.warn('[Phase1] DB campaign sync warning:', e))

      updateCoLaunchProject(project.id, {
        campaignKit: kitToSave,
        campaign_kit: kitToSave,
        campaignLaunched: Boolean(project?.campaignLaunched || hasCampaignGenerated),
        experimentsData: experimentsData,
        experiments: experimentsData?.experiments || experiments || [],
        metadataInfo: {
          ...(project?.metadataInfo || {}),
          campaign_kit: kitToSave,
          campaign_launched: Boolean(project?.campaignLaunched || hasCampaignGenerated),
          experimentsData: experimentsData
        }
      }).catch(() => {})
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
    showNotification('🤖 Architecting 30-day AI Validation Plan...')
    try {
      let generated = null
      if (api?.generateValidationPlan) {
        generated = await api.generateValidationPlan(project)
      } else {
        generated = await generateValidationPlanAI(project)
      }

      if (generated) {
        setPlan(generated)
        const newTarget = parseThresholdAmount(generated.threshold) || 12500
        const updated = {
          ...(project || {}),
          validationPlan: generated,
          presaleTarget: newTarget,
          targetRevenue: newTarget,
          campaignKit,
          surveyData,
          reservations,
          currentPresales: presalesRevenue
        }
        if (onUpdateProject) onUpdateProject(prev => ({ ...(prev || {}), ...updated }))

        setSaveStatus('saved')
        showNotification('✓ AI Validation Plan generated & saved to database!')
        setTimeout(() => setSaveStatus('idle'), 2500)
      }
    } catch (err) {
      console.error('Validation plan error:', err)
      showNotification(`❌ Failed to generate validation plan: ${err.message || 'Please verify AI keys.'}`)
      setSaveStatus('idle')
    } finally {
      setIsGenerating(false)
    }
  }

  const generateCampaign = async () => {
    setIsGeneratingCampaign(true)
    showNotification('🚀 Generating AI Campaign Kit: tailored roadmap, video scripts & posts...')
    try {
      let projectForGen = project
      const hasPosts = (Array.isArray(project?.recentPosts) && project.recentPosts.length > 0) ||
        (Array.isArray(project?.videos) && project.videos.length > 0)
      if (!hasPosts) {
        const cleanH = String(project?.creatorHandle || project?.creator_handle || project?.handle || project?.creatorName || '').replace(/^@/, '').trim()
        if (cleanH && !/^[0-9a-f-]{15,}$/i.test(cleanH)) {
          try {
            const fetched = await fetchCreatorYouTubeVideos(cleanH)
            if (fetched && fetched.length > 0) {
              projectForGen = {
                ...(project || {}),
                recentPosts: fetched,
                videos: fetched
              }
              if (onUpdateProject) {
                onUpdateProject(prev => ({
                  ...(prev || {}),
                  recentPosts: fetched,
                  videos: fetched
                }))
              }
            }
          } catch (e) {
            console.warn('Could not pre-fetch videos for campaign generation:', e)
          }
        }
      }

      const generated = await generateValidationCampaignKitAI(projectForGen, {
        pacing: campaignPacing,
        postingFrequency,
        customPrompt: campaignStrategyPrompt?.trim() || "based on creator's normal posting frequency, what you think will hit the next phase goal, what will be enough but not burden the creator..."
      })
      if (generated) {
        generated.pacingMode = campaignPacing
        generated.postingFrequency = postingFrequency
        generated.customPrompt = campaignStrategyPrompt
        setCampaignKit(generated)
        const updated = {
          ...(project || {}),
          validationPlan: plan,
          campaignKit: generated,
          campaignLaunched: true,
          campaignAssetsGenerated: true,
          creatorTasks: generated.postingSchedule || project?.creatorTasks || [],
          surveyData,
          reservations,
          currentPresales: presalesRevenue
        }
        if (onUpdateProject) onUpdateProject(prev => ({ ...(prev || {}), ...updated }))

        // Persist immediately to backend database
        if (project?.id) {
          const step2Assets = project?.validationCampaign?.productAssets || project?.validationCampaign?.product_assets || {
            productName: project?.productName,
            productTagline: project?.productTagline,
            pricingConfig: sanitizedPricingConfig
          }
          try {
            await updateValidationCampaign(project.id, {
              product_assets: step2Assets,
              campaign_kit: generated,
              campaignKit: generated,
              creator_tasks: generated.postingSchedule || [],
              campaign_launched: true,
              infrastructure: {
                landingPageUrl: `/p/${productSlug}`,
                checkoutUrl: `/p/${productSlug}/checkout`,
                waitlistCount: 240,
                attributionTracking: true
              },
              research_survey: surveyData,
              review_status: 'approved'
            })

            await updateCoLaunchProject(project.id, {
              campaignKit: generated,
              campaign_kit: generated,
              campaignLaunched: true,
              metadataInfo: {
                ...(project?.metadataInfo || {}),
                campaign_kit: generated,
                campaign_launched: true
              }
            }).catch(() => {})
          } catch (e) {
            console.warn('[Phase1] DB campaign auto-sync warning:', e)
          }

          logProjectActivity(project.id, {
            action: 'AI Campaign Content Generated & Locked',
            details: `Generated tailored creator launch roadmap (${campaignPacing === 'low_burden' ? '4 non-burdensome milestones' : 'paced sprint'}) with video scripts, newsletter, and social assets.`,
            step: 'campaign',
            phase: 1
          }).catch(e => console.warn(e))
        }

        showNotification('✓ Creator campaign assets generated with AI & saved to database!')

        // Auto-generate post graphic (OpenAI) and video teaser (Veo 3.1) in parallel
        showNotification('🚀 Generating AI Campaign: image & video teaser...')
        handleGeneratePostImage(null, generated).catch(e => console.warn('Auto image gen warning:', e))
        handleGenerateCampaignVideo(null, generated).catch(e => console.warn('Auto video gen warning:', e))

        // Auto-configure autonomous email delivery every 24 hours in creator timezone
        const creatorEmailAddr = autonomousEmail || project?.creatorEmail || project?.creator_email || ''
        const tzToUse = creatorTimezone || detectedTimezone
        const countryToUse = creatorCountry || 'United States'
        if (project?.id && creatorEmailAddr) {
          toggleAutonomousCampaignDelivery(project.id, {
            enabled: true,
            recipientEmail: creatorEmailAddr,
            preferredHour: 0,
            timezone: tzToUse,
            country: countryToUse
          }).catch(e => console.warn('Auto email config warning:', e))
        }
      }
    } catch (err) {
      console.error('Campaign generation error:', err)
      showNotification(`❌ Failed to generate campaign assets: ${err.message || 'Please retry.'}`)
    } finally {
      setIsGeneratingCampaign(false)
    }
  }

  const handleGeneratePostImage = async (customPrompt = null, targetKit = null) => {
    if (!project?.id) {
      showNotification('Please save or select a valid project first.')
      return
    }
    const baseKit = targetKit || campaignKit || {}
    setImageGenError(null)
    setIsGeneratingImage(true)
    showNotification('🎨 Generating image (OpenAI Astra)...')
    try {
      const promptToUse = typeof customPrompt === 'string' && customPrompt.trim()
        ? customPrompt.trim()
        : undefined
      const isCreator = window.location.pathname.includes('/portal') || window.location.search.includes('role=creator')
      const res = await generateCampaignSocialImage(project.id, {
        prompt: promptToUse,
        caller: isCreator ? 'creator' : 'admin'
      })
      if (res?.success && res?.media) {
        const newImgUrl = res.media.url
        const existingSchedule = baseKit?.postingSchedule || campaignKit?.postingSchedule || []
        const updatedSchedule = existingSchedule.map(t => {
          const ch = (t.channel || '').toLowerCase()
          const ti = (t.title || '').toLowerCase()
          const dk = t.draftKey || ''
          const isPost = dk === 'announcementPost' || (dk !== 'videoScript' && dk !== 'newsletterDraft' && dk !== 'storySequence' && (ti.includes('announcement') || ti.includes('launch') || (!ch.includes('video') && !ch.includes('story') && !ch.includes('email') && !ch.includes('newsletter'))))
          if (isPost) {
            return {
              ...t,
              imageUrl: newImgUrl,
              postImageUrl: newImgUrl,
              imageGeneratedAt: new Date().toISOString()
            }
          }
          return t
        })

        const nextKit = {
          ...baseKit,
          postImageUrl: res.media.url,
          postImageDataUrl: res.media.data_url,
          postImagePrompt: res.media.prompt,
          postImageModel: res.media.model,
          postImageProvider: res.media.provider,
          cloudinaryPublicId: res.media.cloudinary_public_id,
          cloudinaryUrl: res.media.cloudinary_url,
          creatorFolder: res.media.creator_folder,
          creatorSlug: res.media.creator_slug,
          isCloudinary: res.media.is_cloudinary,
          postingSchedule: updatedSchedule
        }
        setCampaignKit(prev => ({ ...(prev || {}), ...nextKit }))
        setImageGenError(null)
        if (onUpdateProject) {
          onUpdateProject(curr => ({
            ...(curr || {}),
            campaignKit: { ...(curr?.campaignKit || {}), ...nextKit },
            metadataInfo: { ...(curr?.metadataInfo || {}), campaign_kit: { ...(curr?.metadataInfo?.campaign_kit || {}), ...nextKit } }
          }))
        }
        showNotification('✨ Image generated & saved!')
      } else {
        throw new Error(res?.detail || 'Failed to generate image')
      }
    } catch (err) {
      console.error('Image generation error:', err)
      const cleanMsg = err?.message || 'Image generation failed. Please try again.'
      setImageGenError(cleanMsg)
      showNotification(`❌ Image generation failed: ${cleanMsg}`)
    } finally {
      setIsGeneratingImage(false)
    }
  }

  const handleGenerateCampaignVideo = async (customPrompt = null, targetKit = null) => {
    if (!project?.id) {
      showNotification('Please save or select a valid project first.')
      return
    }
    const baseKit = targetKit || campaignKit || {}
    setVideoGenError(null)
    setIsGeneratingVideo(true)
    showNotification('🎬 Generating video (Veo 3.1)...')
    try {
      const promptToUse = typeof customPrompt === 'string' && customPrompt.trim()
        ? customPrompt.trim()
        : undefined
      const isCreator = window.location.pathname.includes('/portal') || window.location.search.includes('role=creator')
      const res = await generateCampaignVideo(project.id, {
        prompt: promptToUse,
        postImageUrl: baseKit?.postImageUrl || campaignKit?.postImageUrl,
        caller: isCreator ? 'creator' : 'admin'
      })
      if (res?.success && res?.media) {
        const newVidUrl = res.media.url
        const existingSchedule = baseKit?.postingSchedule || campaignKit?.postingSchedule || []
        const updatedSchedule = existingSchedule.map(t => {
          const ch = (t.channel || '').toLowerCase()
          const ti = (t.title || '').toLowerCase()
          const dk = t.draftKey || ''
          const isVideo = dk === 'videoScript' || (dk !== 'announcementPost' && dk !== 'newsletterDraft' && dk !== 'storySequence' && (ch.includes('video') || ch.includes('reel') || ch.includes('short') || (ch.includes('youtube') && !ch.includes('community')) || ti.includes('video')))
          if (isVideo) {
            return {
              ...t,
              videoUrl: newVidUrl,
              thumbnailUrl: res.media.thumbnail_url || newVidUrl,
              videoGeneratedAt: new Date().toISOString()
            }
          } else if (dk === 'announcementPost' && t.videoUrl) {
            const copy = { ...t }
            delete copy.videoUrl
            delete copy.thumbnailUrl
            delete copy.videoGeneratedAt
            return copy
          }
          return t
        })

        const nextKit = {
          ...baseKit,
          videoUrl: res.media.url,
          videoPrompt: res.media.prompt,
          videoModel: res.media.model,
          videoProvider: res.media.provider,
          cloudinaryVideoPublicId: res.media.cloudinary_public_id,
          cloudinaryVideoUrl: res.media.cloudinary_url,
          videoThumbnailUrl: res.media.thumbnail_url,
          videoOptimizeUrl: res.media.optimize_url,
          creatorFolder: res.media.creator_folder,
          creatorSlug: res.media.creator_slug,
          isVideoCloudinary: res.media.is_cloudinary,
          postingSchedule: updatedSchedule
        }
        setCampaignKit(prev => ({ ...(prev || {}), ...nextKit }))
        setVideoGenError(null)
        if (onUpdateProject) {
          onUpdateProject(curr => ({
            ...(curr || {}),
            campaignKit: { ...(curr?.campaignKit || {}), ...nextKit },
            metadataInfo: { ...(curr?.metadataInfo || {}), campaign_kit: { ...(curr?.metadataInfo?.campaign_kit || {}), ...nextKit } }
          }))
        }
        showNotification('🎬 Video generated & saved!')
      } else {
        throw new Error(res?.detail || 'Failed to generate video')
      }
    } catch (err) {
      console.error('Video generation error:', err)
      const cleanMsg = err?.message || 'Video generation failed. Please try again.'
      setVideoGenError(cleanMsg)
      showNotification(`❌ Video generation failed: ${cleanMsg}`)
    } finally {
      setIsGeneratingVideo(false)
    }
  }

  const handleToggleScheduleTask = (taskId) => {
    const schedule = campaignKit?.postingSchedule || []
    const updatedSchedule = schedule.map(t => t.id === taskId ? { ...t, done: !t.done } : t)
    updateCampaignKit('postingSchedule', updatedSchedule)
    showNotification('Daily task status updated!')
  }

  const detectedTimezone = (() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York'
    } catch {
      return 'America/New_York'
    }
  })()

  const [sendingEmailTaskId, setSendingEmailTaskId] = useState(null)
  const [isSendingTodayEmail, setIsSendingTodayEmail] = useState(false)
  const [autonomousEmail, setAutonomousEmail] = useState(
    campaignKit?.autonomousEmailDelivery?.recipientEmail || project?.creatorEmail || project?.creator_email || ''
  )
  const [isAutonomousEnabled, setIsAutonomousEnabled] = useState(
    campaignKit?.autonomousEmailDelivery?.enabled !== false
  )
  const [creatorTimezone, setCreatorTimezone] = useState(
    campaignKit?.autonomousEmailDelivery?.timezone ||
    campaignKit?.creatorTimezone ||
    project?.creatorTimezone ||
    project?.timezone ||
    detectedTimezone
  )
  const [creatorCountry, setCreatorCountry] = useState(
    campaignKit?.autonomousEmailDelivery?.country ||
    campaignKit?.creatorCountry ||
    project?.creatorCountry ||
    project?.country ||
    'United States'
  )
  const [isSavingAutonomousConfig, setIsSavingAutonomousConfig] = useState(false)
  const [copiedTaskId, setCopiedTaskId] = useState(null)

  useEffect(() => {
    if (campaignKit?.autonomousEmailDelivery?.recipientEmail) {
      setAutonomousEmail(campaignKit.autonomousEmailDelivery.recipientEmail)
    } else if (project?.creatorEmail || project?.creator_email) {
      setAutonomousEmail(project.creatorEmail || project.creator_email)
    }
    if (campaignKit?.autonomousEmailDelivery?.enabled !== undefined) {
      setIsAutonomousEnabled(campaignKit.autonomousEmailDelivery.enabled)
    }
    if (campaignKit?.autonomousEmailDelivery?.timezone || campaignKit?.creatorTimezone) {
      setCreatorTimezone(campaignKit.autonomousEmailDelivery?.timezone || campaignKit.creatorTimezone)
    }
    if (campaignKit?.autonomousEmailDelivery?.country || campaignKit?.creatorCountry) {
      setCreatorCountry(campaignKit.autonomousEmailDelivery?.country || campaignKit.creatorCountry)
    }
  }, [campaignKit?.autonomousEmailDelivery, campaignKit?.creatorTimezone, campaignKit?.creatorCountry, project?.creatorEmail, project?.creator_email])

  const handleSendPostKitEmail = async (task = null) => {
    if (!project?.id) return
    const tId = task?.id || null
    const day = task?.day || null
    if (tId) setSendingEmailTaskId(tId)
    else setIsSendingTodayEmail(true)

    try {
      const res = await sendCampaignPostEmail(project.id, {
        taskId: tId,
        day: day,
        recipientEmail: autonomousEmail || undefined
      })
      if (res?.success) {
        showNotification(`📬 Post Kit sent to ${res.recipient}! Check inbox.`)
        if (res?.project?.validationCampaign?.campaignKit) {
          setCampaignKit(res.project.validationCampaign.campaignKit)
        } else {
          setCampaignKit(prev => {
            const schedule = [...(prev?.postingSchedule || [])].map(t =>
              (tId && t.id === tId) || (day && t.day === day)
                ? { ...t, emailed: true, lastEmailedAt: new Date().toISOString() }
                : t
            )
            return { ...prev, postingSchedule: schedule }
          })
        }
      } else {
        throw new Error(res?.detail || res?.message || 'Failed to dispatch email')
      }
    } catch (err) {
      console.error('Email dispatch error:', err)
      showNotification(`❌ Could not send post kit: ${err.message || 'Check email configuration'}`)
    } finally {
      setSendingEmailTaskId(null)
      setIsSendingTodayEmail(false)
    }
  }

  const handleToggleAutonomousEmail = async (enabled, customTz = null, customCountry = null) => {
    if (!project?.id) return
    setIsSavingAutonomousConfig(true)
    const tzToUse = customTz || creatorTimezone || detectedTimezone
    const countryToUse = customCountry || creatorCountry || 'United States'
    try {
      const res = await toggleAutonomousCampaignDelivery(project.id, {
        enabled,
        recipientEmail: autonomousEmail,
        preferredHour: 0,
        timezone: tzToUse,
        country: countryToUse
      })
      if (res?.success) {
        setIsAutonomousEnabled(enabled)
        setCampaignKit(prev => ({
          ...(prev || {}),
          creatorTimezone: tzToUse,
          creatorCountry: countryToUse,
          autonomousEmailDelivery: {
            ...(prev?.autonomousEmailDelivery || {}),
            enabled,
            recipientEmail: autonomousEmail,
            preferredHour: 0,
            intervalHours: 24,
            intervalSeconds: 86400,
            cadence: '24_hours',
            timezone: tzToUse,
            country: countryToUse,
            dispatchTime: 'Every 24 Hours',
            dispatchSchedule: `Every 24 Hours (${tzToUse})`
          }
        }))
        showNotification(enabled ? '✅ Autonomous post delivery active: Every 24 hours!' : '⏸️ 24-Hour delivery paused.')
      }
    } catch (err) {
      showNotification(`❌ Failed to update delivery settings: ${err.message}`)
    } finally {
      setIsSavingAutonomousConfig(false)
    }
  }

  const [simulationState, setSimulationState] = useState(null)
  const [isStartingSimulation, setIsStartingSimulation] = useState(false)

  // Poll autonomous simulation status periodically (tab-aware)
  useEffect(() => {
    if (!project?.id) return
    let timer = null
    const pollSim = async () => {
      if (typeof document !== 'undefined' && document.hidden) return
      try {
        const res = await getCampaignSimulationStatus(project.id)
        if (res?.simulation) {
          setSimulationState(res.simulation)
        }
      } catch (e) {
        // quiet fallback
      }
    }
    pollSim()
    const isSimActive = simulationState?.status === 'running' || simulationState?.status === 'in_progress'
    const intervalMs = isSimActive ? 10000 : 45000
    timer = setInterval(pollSim, intervalMs)
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [project?.id, simulationState?.status])

  const handleStartSimulation = async () => {
    if (!project?.id) return
    setIsStartingSimulation(true)
    try {
      const res = await startCampaignSimulation(project.id, {
        recipientEmail: autonomousEmail || undefined,
        intervalSeconds: 42
      })
      if (res?.success) {
        showNotification(`🚀 5-Minute autonomous dispatch started! Delivering posts every 42s to ${autonomousEmail || 'creator inbox'}.`)
        setSimulationState(res.status)
      } else {
        throw new Error(res?.detail || res?.message || 'Failed to start simulation')
      }
    } catch (err) {
      showNotification(`❌ Error starting simulation: ${err.message}`)
    } finally {
      setIsStartingSimulation(false)
    }
  }

  const handleStopSimulation = async () => {
    if (!project?.id) return
    try {
      await stopCampaignSimulation(project.id)
      showNotification('🛑 Autonomous test stopped.')
      setSimulationState(prev => prev ? { ...prev, running: false, status: 'cancelled' } : null)
    } catch (err) {
      showNotification(`❌ Error stopping simulation: ${err.message}`)
    }
  }

  const handleDownloadAsset = (url, defaultName) => {
    if (!url) return
    const a = document.createElement('a')
    a.href = url
    a.download = defaultName || 'campaign-asset'
    a.target = '_blank'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    showNotification('📥 Asset download started!')
  }

  const handleCopyTextWithFeedback = (text, taskId) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopiedTaskId(taskId)
    showNotification('📋 Caption copied to clipboard!')
    setTimeout(() => setCopiedTaskId(null), 2500)
  }

  const [remindingTaskId, setRemindingTaskId] = useState(null)

  const handleSendTaskReminder = async (task) => {
    if (!task || !project?.id) return
    setRemindingTaskId(task.id)
    try {
      const res = await sendTaskReminder(project.id, task.id)
      if (res && res.status === 'sent') {
        showNotification(`Reminder email sent to ${project.creatorName || 'creator'} (${res.sentTo?.join(', ') || project.creatorEmail || 'creator'})!`)
      } else {
        showNotification(`Reminder logged for ${project.creatorName || 'creator'}!`)
      }
    } catch (err) {
      console.warn('[Phase1] Failed to dispatch task reminder:', err)
      showNotification(`Reminder notification logged for ${project.creatorName || 'creator'}.`)
    } finally {
      setRemindingTaskId(null)
    }
  }

  const handleWhatsAppNudge = (task) => {
    const creatorName = project?.creatorName || 'Hey'
    const portalSlug = (project?.creatorHandle || project?.creatorName || 'creator').replace(/[@ ]/g, '').toLowerCase()
    const portalUrl = `${window.location.origin}/portal/${portalSlug}`
    const text = `Hey ${creatorName}! Quick heads-up: our Day ${task.day || task.dayNumber || 1} co-launch mission for ${project?.productName || 'our product'} (${task.channel}) is ready to post. Here is your draft & link: ${portalUrl}. Let me know once it's live!`
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
      showNotification('WhatsApp nudge message copied to clipboard!')
    }
    const phone = (project?.creatorPhone || '').replace(/[^0-9]/g, '')
    if (phone) {
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank')
    }
  }

  const getTaskDraftContent = (task, overrideType = null) => {
    if (!task) return ''
    const effectiveType = overrideType || task.viewType
    if (effectiveType === 'video') return normalizeUrlText(campaignKit?.videoScript || '60s Short-Form Video Script')
    if (effectiveType === 'story') return normalizeUrlText(campaignKit?.storySequence || 'STORY 1 — Poll\nSTORY 2 — Product Reveal\nSTORY 3 — Pre-Order Link CTA')
    if (effectiveType === 'newsletter') return normalizeUrlText(campaignKit?.newsletterDraft || 'Email Newsletter Broadcast Draft')
    if (effectiveType === 'dm') return normalizeUrlText(campaignKit?.directMessageScript || '1-on-1 DM Script')
    if (effectiveType === 'post') return normalizeUrlText(campaignKit?.announcementPost || 'Social Announcement Post Copy')

    let content = ''
    if (task.draftKey === 'storySequence') content = campaignKit?.storySequence || 'STORY 1 — Poll\nSTORY 2 — Product Reveal\nSTORY 3 — Pre-Order Link CTA'
    else if (task.draftKey === 'videoScript') content = campaignKit?.videoScript || '60s Short-Form Video Script'
    else if (task.draftKey === 'newsletterDraft') content = campaignKit?.newsletterDraft || 'Email Newsletter Broadcast Draft'
    else if (task.draftKey === 'directMessageScript') content = campaignKit?.directMessageScript || '1-on-1 DM Script'
    else content = campaignKit?.announcementPost || 'Social Announcement Post Copy'
    return normalizeUrlText(content)
  }

  const handleGenerateSurvey = async () => {
    setIsGeneratingSurvey(true)
    showNotification('🤖 Generating dynamic AI discovery survey questions...')
    try {
      const generated = await generateDiscoverySurveyAI(project)
      if (generated) {
        setSurveyData(generated)
        const updated = {
          ...(project || {}),
          surveyData: generated
        }
        if (onUpdateProject) onUpdateProject(prev => ({ ...(prev || {}), ...updated }))
        if (project?.id) {
          updateValidationCampaign(project.id, {
            research_survey: generated
          }).catch(e => console.warn('[Phase1] DB survey sync warning:', e))
        }
        showNotification('✓ Dynamic AI discovery survey generated & saved!')
      }
    } catch (err) {
      console.error('Survey generation error:', err)
      showNotification(`❌ Failed to generate survey questions: ${err.message || 'Please retry.'}`)
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
    if (project?.id) {
      updateValidationCampaign(project.id, {
        research_survey: updated
      }).catch(e => console.warn('[Phase1] DB survey sync warning:', e))
    }
    showNotification('Question added to discovery survey.')
  }

  const handleAnalyzeResponses = async () => {
    if (!surveyResponses || surveyResponses.length === 0) {
      showNotification('Please collect at least 1 audience survey response.')
      return
    }
    setIsAnalyzingResponses(true)
    try {
      const result = await analyzeSurveyResponsesAI(project, surveyResponses)
      if (result) {
        setSurveyAnalysis(result)
        const updated = { ...(project || {}), surveyAnalysis: result }
        if (onUpdateProject) onUpdateProject(prev => ({ ...(prev || {}), ...updated }))
        if (project?.id) {
          updateCoLaunchProject(project.id, {
            metadataInfo: {
              ...(project?.metadataInfo || {}),
              survey_analysis: result
            }
          }).catch(e => console.warn('[Phase1] DB survey analysis sync warning:', e))
        }
        showNotification(`AI analysis complete! Score: ${result.overallScore}/100`)
      }
    } catch (err) {
      console.error('Survey analysis error:', err)
      showNotification('Failed to analyze responses with AI.')
    } finally {
      setIsAnalyzingResponses(false)
    }
  }

  const handleDeleteSurveyResponse = async (responseId) => {
    try {
      const nextResponses = surveyResponses.filter(r => r.id !== responseId)
      setSurveyResponses(nextResponses)

      const updatedQuestions = (surveyData?.questions || []).map(q => {
        const remainingCount = nextResponses.filter(r => {
          const ans = r.answers || {}
          return ans[q.id] && String(ans[q.id]).trim().length > 0
        }).length
        return { ...q, responseCount: remainingCount }
      })
      const updatedSurveyData = {
        ...surveyData,
        questions: updatedQuestions,
        responses: nextResponses
      }
      setSurveyData(updatedSurveyData)

      if (project?.id) {
        const updatedProj = await deleteSurveyResponse(project.id, responseId)
        if (updatedProj && onUpdateProject) {
          onUpdateProject(updatedProj)
        }
      }
      showNotification('Survey response removed.')
    } catch (err) {
      console.error('Delete survey response error:', err)
      showNotification('Failed to delete response.')
    }
  }

  const handleClearAllSurveyResponses = async () => {
    if (!window.confirm('Clear all audience survey responses?')) return
    try {
      setSurveyResponses([])
      setSurveyAnalysis(null)
      const updatedQuestions = (surveyData?.questions || []).map(q => ({
        ...q,
        responseCount: 0
      }))
      const updatedSurveyData = {
        ...surveyData,
        questions: updatedQuestions,
        responses: [],
        analysis: null
      }
      setSurveyData(updatedSurveyData)

      if (project?.id) {
        const updatedProj = await clearAllSurveyResponses(project.id)
        if (updatedProj && onUpdateProject) {
          onUpdateProject(updatedProj)
        }
      }
      showNotification('All survey responses cleared.')
    } catch (err) {
      console.error('Clear survey responses error:', err)
      showNotification('Failed to clear responses.')
    }
  }

  const handleSimulateSurveyResponse = async () => {
    const sampleNames = ['Marcus Vance', 'Sarah Jenkins', 'Elena Rostova', 'David Chen', 'Amara Okafor']
    const sampleProblems = [
      'Current tools take 3+ hours daily. Need direct automation for creators.',
      'Manual multi-step workflow is broken. Would gladly pay for an integrated suite.',
      'Excited for this co-founder collaboration. Ready to test early beta and pre-order.'
    ]
    const randomName = sampleNames[Math.floor(Math.random() * sampleNames.length)]
    const randomEmail = `${randomName.toLowerCase().replace(' ', '.')}@gmail.com`
    const sampleResp = {
      id: `resp-${Date.now()}`,
      name: randomName,
      email: randomEmail,
      rating: Math.floor(Math.random() * 3) + 8, // 8, 9, 10
      answers: {
        'Workflow Bottleneck': sampleProblems[Math.floor(Math.random() * sampleProblems.length)],
        'Pricing Viability': `$${activeFoundingPrice}/year is fair for this value.`
      },
      submittedAt: 'Just now',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }
    const nextResponses = [sampleResp, ...surveyResponses]
    setSurveyResponses(nextResponses)
    if (onUpdateProject) onUpdateProject(p => ({ ...(p || {}), surveyResponses: nextResponses }))
    if (project?.id) {
      addProjectSurveyResponse(project.id, sampleResp).catch(e => console.warn(e))
    }
    showNotification(`Discovery feedback recorded from ${randomName}!`)
  }

  const handleRunExperimentsAI = async () => {
    setIsAnalyzingExperiments(true)
    try {
      const results = await analyzeAndGenerateExperimentsAI(project)
      if (results && Array.isArray(results.experiments) && results.experiments.length > 0) {
        setExperimentsData(results)
        setExperiments(results.experiments)
        const updated = {
          ...(project || {}),
          experimentsData: results,
          experiments: results.experiments,
          metadataInfo: {
            ...(project?.metadataInfo || {}),
            experimentsData: results,
            experiments_data: results,
            performanceAudit: results.performanceAudit
          }
        }
        if (onUpdateProject) onUpdateProject(prev => ({ ...(prev || {}), ...updated }))
        if (project?.id) {
          updateCoLaunchProject(project.id, {
            experimentsData: results,
            experiments: results.experiments,
            metadataInfo: {
              ...(project.metadataInfo || {}),
              experimentsData: results,
              experiments_data: results,
              performanceAudit: results.performanceAudit
            }
          }).catch(e => console.warn('[Phase1Validate] updateCoLaunchProject err:', e))
        }
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
    let appliedMessage = `Experiment "${exp.title}" applied!`
    let updatedPlanPricing = null

    // 1. Messaging Variant -> Step 2 Campaign Kit & Step 3 Social Post Draft
    if (exp.category === 'messaging' || exp.targetField === 'announcementPost') {
      updatedCampaign.announcementPost = exp.variant
      updatedCampaign.activeMessagingExperiment = { id: exp.id, title: exp.title, variant: exp.variant, expectedUplift: exp.expectedUplift }
      if (Array.isArray(updatedCampaign.postingSchedule)) {
        updatedCampaign.postingSchedule = updatedCampaign.postingSchedule.map(t => {
          if (t.day === 1 || t.title?.toLowerCase().includes('announcement')) {
            return { ...t, description: `[AI Experiment Variant Active: ${exp.title}] ${exp.variant}` }
          }
          return t
        })
      }
      appliedMessage = `Messaging variant applied to Step 2 Campaign Kit & Step 3 Social Announcement!`
    }
    // 2. Creator Content Variant -> Step 3 Creator Story Sprints & Tasks
    else if (exp.category === 'creator_content' || exp.targetField === 'storySequence') {
      updatedCampaign.storySequence = exp.variant
      updatedCampaign.activeStoryExperiment = { id: exp.id, title: exp.title, variant: exp.variant, expectedUplift: exp.expectedUplift }
      if (Array.isArray(updatedCampaign.postingSchedule)) {
        updatedCampaign.postingSchedule = updatedCampaign.postingSchedule.map(t => {
          if (t.day === 2 || t.day === 3 || t.title?.toLowerCase().includes('story')) {
            return { ...t, description: `[AI Experiment Variant Active: ${exp.title}] ${exp.variant}` }
          }
          return t
        })
      }
      appliedMessage = `Creator story sequence & sprint tasks updated with AI variant in Step 3!`
    }
    // 3. Landing Page Variant -> Step 2 Live Landing Page Hero & Headline
    else if (exp.category === 'landing_page' || exp.targetField === 'landingPageHero') {
      const existingLP = updatedCampaign.landingPageCopy || {}
      const isMockupVariant = exp.variant?.toLowerCase().includes('mockup') || exp.variant?.toLowerCase().includes('frame') || exp.title?.toLowerCase().includes('mockup')
      updatedCampaign.landingPageCopy = {
        ...existingLP,
        headline: !isMockupVariant ? exp.variant : existingLP.headline || `The ${project?.productName || 'Product'} Workspace Built with ${project?.creatorName || 'Co-Founder'}`,
        heroStyle: isMockupVariant ? 'mockup_first' : 'standard',
        activeExperimentTitle: exp.title,
        activeExperimentVariant: exp.variant
      }
      appliedMessage = `Landing page hero variant applied to Step 2 Funnel & Public Pre-Order Page!`
    }
    // 4. Pricing Variant -> Step 1 Validation Plan & Step 2 Pre-Order Checkout
    else if (exp.category === 'pricing' || exp.targetField === 'pricingTier') {
      const priceMatches = exp.variant.match(/\$(\d+)/g)
      let parsedDeposit = null
      let parsedFounding = null
      if (priceMatches && priceMatches.length > 0) {
        const nums = priceMatches.map(m => Number(m.replace('$', ''))).filter(n => !isNaN(n) && n > 0)
        if (nums.length === 1) {
          if (nums[0] < activeFoundingPrice) {
            parsedDeposit = nums[0]
          } else {
            parsedFounding = nums[0]
          }
        } else if (nums.length >= 2) {
          nums.sort((a, b) => a - b)
          parsedDeposit = nums[0]
          parsedFounding = nums[nums.length - 1]
        }
      }

      const nextFounding = parsedFounding || activeFoundingPrice
      const nextDeposit = parsedDeposit || (Math.round(nextFounding * 0.2) || activeDepositPrice)

      updatedCampaign.pricingConfig = {
        ...(updatedCampaign.pricingConfig || {}),
        foundingPrice: nextFounding,
        depositPrice: nextDeposit,
        activeExperimentVariant: exp.variant,
        activeExperimentTitle: exp.title
      }

      updatedPlanPricing = `${exp.variant} (Pricing adjusted via AI Experiment: ${exp.title})`
      setPlan(prev => ({ ...prev, pricing: updatedPlanPricing }))
      appliedMessage = `Pricing adjusted: Founding Pass $${nextFounding}, Deposit Pass $${nextDeposit}! Updated in Step 1 Plan & Step 2 Checkout.`
    }

    setCampaignKit(updatedCampaign)

    let nextExpData = experimentsData
    if (experimentsData?.experiments) {
      const updatedExps = experimentsData.experiments.map(e => e.id === exp.id ? {
        ...e,
        status: 'applied',
        appliedAt: new Date().toISOString()
      } : e)
      nextExpData = { ...experimentsData, experiments: updatedExps }
      setExperimentsData(nextExpData)
      setExperiments(updatedExps)
    }

    const updatedProject = {
      ...(project || {}),
      campaignKit: updatedCampaign,
      experimentsData: nextExpData,
      experiments: nextExpData?.experiments || [],
      ...(updatedPlanPricing ? { pricing: updatedPlanPricing } : {})
    }
    if (onUpdateProject) onUpdateProject(prev => ({ ...(prev || {}), ...updatedProject }))

    if (project?.id) {
      updateCoLaunchProject(project.id, {
        campaignKit: updatedCampaign,
        experimentsData: nextExpData,
        experiments: nextExpData?.experiments || [],
        ...(updatedPlanPricing ? { pricing: updatedPlanPricing } : {}),
        metadataInfo: {
          ...(project.metadataInfo || {}),
          campaign_kit: updatedCampaign,
          experimentsData: nextExpData
        }
      }).catch(e => console.warn(e))

      updateValidationCampaign(project.id, {
        campaign_kit: updatedCampaign,
        campaignKit: updatedCampaign
      }).catch(e => console.warn(e))

      if (updatedPlanPricing) {
        updateValidationPlan(project.id, {
          pricing: updatedPlanPricing
        }).catch(e => console.warn(e))
      }

      logProjectActivity(project.id, {
        action: `AI Experiment Implemented: ${exp.title}`,
        details: `Variant activated: "${exp.variant.slice(0, 100)}"`,
        step: 'optimize',
        phase: 1
      }).catch(() => {})
    }

    showNotification(appliedMessage)
  }

  const handleRevertExperiment = (exp) => {
    if (!exp) return
    let updatedCampaign = { ...campaignKit }

    if (exp.category === 'messaging' || exp.targetField === 'announcementPost') {
      updatedCampaign.announcementPost = exp.control || ''
      updatedCampaign.activeMessagingExperiment = null
      if (Array.isArray(updatedCampaign.postingSchedule)) {
        updatedCampaign.postingSchedule = updatedCampaign.postingSchedule.map(t => {
          if (t.day === 1 || t.title?.toLowerCase().includes('announcement')) {
            return { ...t, description: exp.control || t.description?.replace(/\[AI Experiment Variant Active:.*?\]\s*/, '') }
          }
          return t
        })
      }
    } else if (exp.category === 'creator_content' || exp.targetField === 'storySequence') {
      updatedCampaign.storySequence = exp.control || ''
      updatedCampaign.activeStoryExperiment = null
      if (Array.isArray(updatedCampaign.postingSchedule)) {
        updatedCampaign.postingSchedule = updatedCampaign.postingSchedule.map(t => {
          if (t.day === 2 || t.day === 3 || t.title?.toLowerCase().includes('story')) {
            return { ...t, description: exp.control || t.description?.replace(/\[AI Experiment Variant Active:.*?\]\s*/, '') }
          }
          return t
        })
      }
    } else if (exp.category === 'landing_page' || exp.targetField === 'landingPageHero') {
      const existingLP = updatedCampaign.landingPageCopy || {}
      updatedCampaign.landingPageCopy = {
        ...existingLP,
        headline: exp.control || `The ${project?.productName || 'Product'} System`,
        heroStyle: 'standard',
        activeExperimentTitle: null,
        activeExperimentVariant: null
      }
    } else if (exp.category === 'pricing' || exp.targetField === 'pricingTier') {
      const origFounding = parseMainPricingAmount(project?.pricing || 49)
      const origDeposit = parseDepositPricingAmount(project?.pricing, origFounding)
      updatedCampaign.pricingConfig = {
        ...(updatedCampaign.pricingConfig || {}),
        foundingPrice: origFounding,
        depositPrice: origDeposit,
        activeExperimentVariant: null,
        activeExperimentTitle: null
      }
      setPlan(prev => ({ ...prev, pricing: project?.pricing || `$${origFounding} founding member pass` }))
      if (project?.id) {
        updateValidationPlan(project.id, { pricing: project?.pricing || `$${origFounding}` }).catch(() => {})
      }
    }

    setCampaignKit(updatedCampaign)

    let nextExpData = experimentsData
    if (experimentsData?.experiments) {
      const updatedExps = experimentsData.experiments.map(e => e.id === exp.id ? {
        ...e,
        status: 'ready',
        appliedAt: null
      } : e)
      nextExpData = { ...experimentsData, experiments: updatedExps }
      setExperimentsData(nextExpData)
      setExperiments(updatedExps)
    }

    const updatedProject = {
      ...(project || {}),
      campaignKit: updatedCampaign,
      experimentsData: nextExpData,
      experiments: nextExpData?.experiments || []
    }
    if (onUpdateProject) onUpdateProject(prev => ({ ...(prev || {}), ...updatedProject }))

    if (project?.id) {
      updateCoLaunchProject(project.id, {
        campaignKit: updatedCampaign,
        experimentsData: nextExpData,
        experiments: nextExpData?.experiments || []
      }).catch(e => console.warn(e))

      updateValidationCampaign(project.id, {
        campaign_kit: updatedCampaign,
        campaignKit: updatedCampaign
      }).catch(e => console.warn(e))
    }

    showNotification(`Reverted experiment "${exp.title}" back to control.`)
  }

  const handleSimulatePresale = (e) => {
    e?.preventDefault()
    if (!simBuyerName.trim() || !simBuyerEmail.trim()) {
      showNotification('Please enter a backer name and email.')
      return
    }
    const name = simBuyerName.trim()
    const email = simBuyerEmail.trim()
    const amount = Number(simBuyerTier) || dynamicMainPrice

    const newReservation = {
      id: `r-${Date.now()}`,
      name,
      email,
      amount,
      tier: amount === dynamicDepositPrice ? `Refundable Deposit ($${amount})` : amount === dynamicVipPrice ? `VIP Founder Pass ($${amount})` : `Founding Annual Pass ($${amount})`,
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
      reservations: nextReservations,
      currentPresales: nextRevenue
    }

    if (onUpdateProject) onUpdateProject(prev => ({ ...(prev || {}), ...updated }))

    // Persist pre-order reservation to SQLite / PostgreSQL database
    if (project?.id) {
      addProjectReservation(project.id, {
        name,
        email,
        amount,
        tier: amount === activeFoundingPrice ? `Founding Annual ($${activeFoundingPrice})` : amount === activeDepositPrice ? `Refundable Deposit ($${activeDepositPrice})` : `Pledge ($${amount})`,
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
    if (project?.id) {
      updateCoLaunchProject(project.id, {
        reservations: [],
        currentPresales: 0
      }).catch(e => console.warn(e))
    }
    showNotification('Pre-orders cleared.')
  }

  // Dynamic Telemetry Calculations
  const totalTraffic = Number(project?.visitors || project?.uniqueVisitors?.length || 0)
  const totalSignups = Number(project?.telemetry?.signups || (project?.waitlist || []).length || 0)
  const dynamicConversionRate = totalTraffic > 0
    ? (reservations.length / totalTraffic) * 100
    : Number(project?.conversionRate || 0)
  const dynamicCTR = project?.telemetry?.ctr !== undefined && project?.telemetry?.ctr !== null
    ? Number(project.telemetry.ctr)
    : (totalTraffic > 0 && (totalSignups + reservations.length > 0))
    ? ((totalSignups + reservations.length) / totalTraffic) * 100
    : 0

  const {
    isStep1Done,
    isStep2Done,
    isStep3Done,
    isStep4Done,
    isStep5Done,
    isGatePassed: dbGatePassed,
    allPriorStepsDone,
    canAccessStep1,
    canAccessStep2,
    canAccessStep3,
    canAccessStep4,
    canAccessStep5
  } = getPhase1StepGuards({
    ...project,
    validationPlan: { ...(project?.validationPlan || {}), ...(plan || {}) },
    validationCampaign: {
      ...(project?.validationCampaign || {}),
      ...(isStep2Approved ? { review_status: 'approved', reviewStatus: 'approved' } : {})
    },
    assetsApproved: Boolean(isStep2Approved || project?.assetsApproved || project?.landingPageApproved),
    landingPageApproved: Boolean(isStep2Approved || project?.landingPageApproved),
    campaignKit,
    surveyData,
    reservations,
    currentPresales: presalesRevenue
  })

  // Gate can be passed when threshold is met, DB gate passed, or manual advance
  const isGatePassed = Boolean(
    dbGatePassed ||
    project?.p1Complete === true ||
    project?.phase1Passed === true ||
    Number(project?.currentPhase || project?.current_phase || 1) >= 2 ||
    project?.status === 'building' ||
    (presaleTarget > 0 && presalesRevenue >= presaleTarget && reservations.length > 0) ||
    (allPriorStepsDone && (
      dbGatePassed ||
      (presaleTarget > 0 && presalesRevenue >= presaleTarget)
    ))
  )

  const canAccessStep = (stepId) => {
    if (stepId === 'plan') return true
    if (stepId === 'assets') return canAccessStep2
    if (stepId === 'campaign') return canAccessStep3
    if (stepId === 'optimize') return canAccessStep4
    if (stepId === 'gate') return canAccessStep5
    return true
  }

  const getStepMissingPrerequisiteText = (stepId) => {
    if (stepId === 'assets' && !canAccessStep2) return 'Please complete Step 1 (Validation Plan) first.'
    if (stepId === 'campaign' && !canAccessStep3) return 'Please complete Step 2 (Validation Assets) first.'
    if (stepId === 'optimize' && !canAccessStep4) return 'Please complete Step 3 (Creator Campaign) first.'
    if (stepId === 'gate' && !canAccessStep5) return 'Validation Gate locked: Complete Steps 1–4 first.'
    return 'Please complete previous steps first.'
  }

  const handleStepChange = (id) => {
    if (!canAccessStep(id)) {
      showNotification(getStepMissingPrerequisiteText(id))
      return
    }
    setActiveStep(id)
    onSelectStep?.(id)
  }

  // If currently active step is locked, automatically drop down to highest unlocked step
  useEffect(() => {
    if (!canAccessStep(activeStep)) {
      if (canAccessStep4) setActiveStep('optimize')
      else if (canAccessStep3) setActiveStep('campaign')
      else if (canAccessStep2) setActiveStep('assets')
      else setActiveStep('plan')
    }
  }, [activeStep, canAccessStep1, canAccessStep2, canAccessStep3, canAccessStep4, canAccessStep5])

  return (
    <div className="space-y-5 w-full max-w-full overflow-hidden">
      {/* 5-Step Phase 1 Progress Nav */}
      <div className="p-3 rounded-2xl bg-slate-100/90 border border-slate-200 shadow-2xs space-y-2.5">
        {/* Top Row: Pipeline Title & Telemetry Badges */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/70">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-mono font-black uppercase tracking-wider text-slate-700">
              Validation Sprint Pipeline
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              type="button"
              className="execution-btn flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-mono font-bold shadow-xs ring-1 ring-emerald-400/30 cursor-default select-none"
              style={{ color: '#ffffff', backgroundColor: '#0f172a' }}
            >
              <span className="text-[10px] uppercase font-mono tracking-wider inline" style={{ color: '#ffffff' }}>
                Execution Progress
              </span>
              <span className="font-extrabold text-xs inline" style={{ color: '#ffffff' }}>
                {[isStep1Done, isStep2Done, isStep3Done, isStep4Done, isStep5Done].filter(Boolean).length} of 5 Done
              </span>
            </button>
            <div className="flex items-center justify-between sm:justify-end gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 shrink-0 shadow-2xs">
              <span className="text-[10px] text-slate-500 uppercase font-mono hidden sm:inline">Target Goal:</span>
              <span className="flex items-center gap-1 font-mono font-extrabold text-slate-900">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" /> ${presalesRevenue.toLocaleString()} / ${presaleTarget.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Row: 5-Step Pipeline Roadmap */}
        <div className="flex items-center justify-between gap-1 sm:gap-2 overflow-x-auto no-scrollbar pb-1">
          {[
            { id: 'plan', num: '01', label: '1. Plan', icon: FileText, isDone: isStep1Done, canAccess: canAccessStep1 },
            { id: 'assets', num: '02', label: '2. Assets', icon: Layout, isDone: isStep2Done, canAccess: canAccessStep2 },
            { id: 'campaign', num: '03', label: '3. Campaign', icon: Megaphone, isDone: isStep3Done, canAccess: canAccessStep3 },
            { id: 'optimize', num: '04', label: '4. Optimize', icon: TrendingUp, isDone: isStep4Done, canAccess: canAccessStep4 },
            { id: 'gate', num: '05', label: '5. Gate', icon: Flag, isDone: isStep5Done, canAccess: canAccessStep5 },
          ].map((step, idx, arr) => {
            const isActive = activeStep === step.id
            const isLocked = !step.canAccess
            const isDone = Boolean(step.isDone)

            return (
              <div key={step.id} className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0 last:flex-initial">
                <button
                  type="button"
                  onClick={() => handleStepChange(step.id)}
                  disabled={isLocked}
                  title={isLocked ? getStepMissingPrerequisiteText(step.id) : step.label}
                  className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-mono transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs ring-2 ring-emerald-400/40 border border-slate-900 font-bold'
                      : isDone
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100/80 font-semibold shadow-2xs'
                      : isLocked
                      ? 'bg-slate-200/50 text-slate-400 border border-slate-200/80 cursor-not-allowed opacity-60'
                      : 'bg-slate-50 text-slate-600 hover:text-slate-950 hover:bg-white border border-slate-200 shadow-2xs'
                  }`}
                >
                  {isActive ? (
                    <>
                      <span className="px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-bold">
                        STEP {step.num}
                      </span>
                      <span className="text-white font-sans font-extrabold whitespace-nowrap">{step.label}</span>
                      <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5 shrink-0" />
                    </>
                  ) : isDone ? (
                    <>
                      <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                      <span className="font-sans font-bold text-slate-900 whitespace-nowrap">{step.label}</span>
                    </>
                  ) : isLocked ? (
                    <>
                      <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-sans font-medium text-slate-500 whitespace-nowrap">{step.label}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-slate-400 font-bold">{step.num}</span>
                      <span className="font-sans font-medium text-slate-600 whitespace-nowrap">{step.label}</span>
                    </>
                  )}
                </button>
                {idx < arr.length - 1 && (
                  <div
                    className={`flex-1 h-[2px] min-w-[8px] max-w-[48px] rounded-full shrink-0 ${
                      isDone ? 'bg-emerald-400' : 'bg-slate-200'
                    }`}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Floating Notification Toast */}
      {feedbackNotice && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md p-3.5 rounded-2xl bg-slate-900 border border-slate-700 text-white text-xs shadow-2xl flex items-center justify-between gap-3 animate-slide-up backdrop-blur-md">
          <div className="flex items-center gap-2.5 font-medium">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="leading-snug">{feedbackNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackNotice('')}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* STEP 1: VALIDATION PLAN */}
      {activeStep === 'plan' && (
        <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4">
          <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>1. Validation Plan Specification</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  AI Generated
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                AI defines customer, problem, offer, pricing, test method, validation period + success threshold.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={generatePlan}
                disabled={isGenerating}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all disabled:opacity-50 active:scale-95 shadow-sm"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-300" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Generate Plan</span>
                  </>
                )}
              </button>
              <button
                onClick={saveAll}
                disabled={saveStatus === 'saving'}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 shadow-sm ${
                  saveStatus === 'saved'
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-600 font-extrabold'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold'
                }`}
              >
                {saveStatus === 'saving' ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-700" />
                    <span>Saving...</span>
                  </>
                ) : saveStatus === 'saved' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-white" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5 text-emerald-700" />
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
              <label key={field} className={`p-3.5 rounded-xl bg-slate-50 border ${field === 'threshold' ? 'border-emerald-500/30 bg-emerald-50/40' : 'border-slate-200 focus-within:border-slate-400'} space-y-1.5 block ${field === 'testMethod' ? 'md:col-span-2' : ''} transition-all`}>
                <div className="flex items-center justify-between">
                  <span className={`${field === 'threshold' ? 'text-emerald-700' : 'text-slate-600'} font-bold uppercase tracking-wider text-[10px]`}>{label}</span>
                  <div className="flex items-center gap-1.5">
                    {field === 'pricing' && (plan.pricing?.includes('AI Experiment') || campaignKit?.pricingConfig?.activeExperimentTitle) && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                        <span>AI Variant Active</span>
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400">editable</span>
                  </div>
                </div>
                <textarea
                  value={plan[field] || ''}
                  onChange={event => updatePlan(field, event.target.value)}
                  rows={field === 'testMethod' ? 3 : 2}
                  className="w-full mt-1 resize-y bg-transparent text-slate-900 outline-none placeholder:text-slate-400 font-sans leading-relaxed text-xs"
                  placeholder={`Click 'Generate Plan with AI' or enter ${label.toLowerCase()}...`}
                />
              </label>
            ))}
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={async () => {
                saveAll()
                const updated = {
                  ...(project || {}),
                  validationPlan: { ...(plan || {}), status: 'approved', locked: true },
                  planLocked: true
                }
                if (onUpdateProject) onUpdateProject(prev => ({ ...(prev || {}), ...updated }))
                if (project?.id) {
                  updateValidationPlan(project.id, {
                    customer: plan.customer,
                    problem: plan.problem,
                    offer: plan.offer,
                    pricing: plan.pricing,
                    test_method: plan.testMethod,
                    period: plan.period,
                    threshold: plan.threshold,
                    target_revenue: presaleTarget,
                    status: 'approved',
                    locked: true
                  }).catch(e => console.warn(e))
                }
                showNotification('Validation plan approved & locked! Advancing to Assets.')
                setActiveStep('assets')
                onSelectStep?.('assets')
              }}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm active:scale-95"
            >
              <span>Next: Build Validation Assets</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: BUILD VALIDATION ASSETS */}
      {activeStep === 'assets' && (
        <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-5 shadow-xs">
          <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>2. Build Validation Assets & Infrastructure</span>
              </h3>
              <p className="text-xs text-slate-500">
                Product assets, branding, positioning, copy, landing page, checkout, waitlist, analytics & customer discovery surveys.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={saveAll}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Save className="w-3.5 h-3.5 text-emerald-700" />
                <span>Save Assets</span>
              </button>
            </div>
          </div>

          {/* Sub Navigation */}
          <div className="flex items-center gap-1.5 border-b border-slate-200 pb-3 overflow-x-auto">
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
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    (assetSubTab === tab.id || (tab.id === 'product_assets' && (!assetSubTab || assetSubTab === 'branding')))
                      ? 'bg-slate-900 text-white shadow-xs border border-slate-900'
                      : 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>

          {/* 1. PRODUCT ASSETS (Product Name, Basic Branding, Positioning, Copy + Pricing) */}
          {(assetSubTab === 'branding' || assetSubTab === 'product_assets') && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name, Branding & Positioning Card */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wider block">
                    Product Identity, Branding & Positioning
                  </span>

                  <div>
                    <label className="text-[10px] text-slate-500 block font-bold">Product Name</label>
                    <input
                      type="text"
                      value={project?.productName || ''}
                      onChange={e => {
                        const val = e.target.value
                        if (onUpdateProject) onUpdateProject(p => ({ ...(p || {}), productName: val }))
                      }}
                      placeholder="e.g. FlutterFlow Flow AI"
                      className="w-full mt-1 px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 font-bold outline-none focus:border-slate-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 block font-bold">Positioning Statement</label>
                    <textarea
                      rows={2}
                      value={project?.productTagline || ''}
                      onChange={e => {
                        const val = e.target.value
                        if (onUpdateProject) onUpdateProject(p => ({ ...(p || {}), productTagline: val }))
                      }}
                      placeholder="e.g. Autonomous AI workflow engine tailored to mobile app creators"
                      className="w-full mt-1 p-2.5 rounded-lg bg-white border border-slate-200 text-slate-800 outline-none resize-none focus:border-slate-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[10px] text-slate-500 block font-bold">Brand Tag / Tone</label>
                      <input
                        type="text"
                        value={project?.brandTone || 'Modern, Minimal, Dark SaaS'}
                        onChange={e => {
                          const val = e.target.value
                          if (onUpdateProject) onUpdateProject(p => ({ ...(p || {}), brandTone: val }))
                        }}
                        className="w-full mt-1 px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs outline-none focus:border-slate-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block font-bold">Target Audience</label>
                      <input
                        type="text"
                        value={project?.targetAudience || project?.niche || 'Mobile Developers & Creators'}
                        onChange={e => {
                          const val = e.target.value
                          if (onUpdateProject) onUpdateProject(p => ({ ...(p || {}), targetAudience: val, niche: val }))
                        }}
                        className="w-full mt-1 px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs outline-none focus:border-slate-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Copy & Pricing Card (Fully Dynamic & Real-time Synced) */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block font-mono">
                      Product Copy & Pricing Structure
                    </span>
                    <span className="text-[10px] text-emerald-700 font-mono font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Live on /preorder</span>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 block font-bold">Hero Headline Copy</label>
                    <input
                      type="text"
                      value={campaignKit?.landingPageCopy?.headline ?? `The ${project?.productName || 'Software'} Workspace Built with ${project?.creatorName || 'Founding Creator'}`}
                      onChange={e => {
                        const val = e.target.value
                        updateCampaignKit('landingPageCopy', { ...(campaignKit?.landingPageCopy || {}), headline: val })
                      }}
                      placeholder="e.g. Built for ambitious creators to 10x workflow speed."
                      className="w-full mt-1 px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 font-bold outline-none focus:border-slate-400 text-xs shadow-2xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-500 block font-bold">Founding Annual Price</label>
                      <div className="flex items-center gap-1 mt-1 px-3 py-2 rounded-lg bg-white border border-slate-200 focus-within:border-slate-400 shadow-2xs">
                        <span className="text-slate-500 font-bold">$</span>
                        <input
                          type="number"
                          value={activeFoundingPrice}
                          onChange={e => {
                            const val = Number(e.target.value) || 0
                            updateCampaignKit('pricingConfig', { ...(campaignKit?.pricingConfig || {}), foundingPrice: val })
                          }}
                          className="bg-transparent text-slate-900 font-bold text-xs outline-none w-full"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block font-bold">Refundable Deposit</label>
                      <div className="flex items-center gap-1 mt-1 px-3 py-2 rounded-lg bg-white border border-slate-200 focus-within:border-slate-400 shadow-2xs">
                        <span className="text-slate-500 font-bold">$</span>
                        <input
                          type="number"
                          value={activeDepositPrice}
                          onChange={e => {
                            const val = Number(e.target.value) || 0
                            updateCampaignKit('pricingConfig', { ...(campaignKit?.pricingConfig || {}), depositPrice: val })
                          }}
                          className="bg-transparent text-slate-900 font-bold text-xs outline-none w-full"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 block font-bold">Offer Perks & Guarantee</label>
                    <input
                      type="text"
                      value={campaignKit?.pricingConfig?.perks ?? `50% Lifetime Discount + 1-on-1 Alpha Onboarding for ${project?.creatorName || 'Founding'} VIPs`}
                      onChange={e => {
                        const val = e.target.value
                        updateCampaignKit('pricingConfig', { ...(campaignKit?.pricingConfig || {}), perks: val })
                      }}
                      placeholder="e.g. 50% Lifetime Discount + 1-on-1 Alpha Onboarding"
                      className="w-full mt-1 px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs outline-none focus:border-slate-400 shadow-2xs"
                    />
                  </div>
                </div>
              </div>

              {/* Product Mockup Studio & Visual Asset */}
              <div className="space-y-2.5 pt-4 pb-4">
                <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wider block font-mono px-1">
                  Product Mockup Studio & Visual Asset
                </span>
                <ProductMockupCanvas
                  project={{ ...(project || {}), currentPresales: presalesRevenue, reservations, mockupImage }}
                  onSaveMockupImage={(imgUrl) => {
                    setMockupImage(imgUrl)
                    if (onUpdateProject) onUpdateProject(prev => ({ ...(prev || {}), mockupImage: imgUrl }))
                    if (project?.id) {
                      updateCoLaunchProject(project.id, { mockupImage: imgUrl }).catch(() => {})
                    }
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
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-slate-200 text-slate-800 font-mono text-[11px] truncate flex-1 max-w-lg shadow-2xs">
                    <Globe className="w-3.5 h-3.5 text-slate-500 shrink-0" />
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
                    className="px-3 py-1 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
                  >
                    <Copy className="w-3 h-3 text-slate-500" />
                    <span>Copy Link</span>
                  </button>

                  <a
                    href={`${origin}/preorder/${productSlug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1 transition-colors shadow-2xs"
                  >
                    <span>Open Live Page</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Rich Live Interactive Landing Page Preview Frame */}
              <div className="rounded-3xl bg-slate-50/70 border border-slate-200/90 overflow-hidden shadow-sm p-6 sm:p-8 space-y-6">
                {/* Top Pre-sale Badge */}
                <div className="text-center space-y-3 max-w-2xl mx-auto">
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    <span className="inline-block px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-mono font-bold uppercase tracking-wider shadow-2xs">
                      🔥 Founding Member Pre-Sale
                    </span>
                    {(campaignKit?.landingPageCopy?.activeExperimentTitle || campaignKit?.pricingConfig?.activeExperimentTitle) && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold shadow-2xs">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                        <span>AI Optimization Variant Live</span>
                      </span>
                    )}
                  </div>
                  <h2 className="font-display text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                    {campaignKit?.landingPageCopy?.headline || `The ${project?.productName || 'Product'} System`}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xl mx-auto">
                    {campaignKit?.landingPageCopy?.subheadline || project?.productTagline || 'Reserve early founding access and lock in lifetime benefits.'}
                  </p>

                  {/* Live Pre-Order Action Buttons */}
                  {(() => {
                    const parsedPrice = activeFoundingPrice
                    const depositVal = activeDepositPrice
                    return (
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                        <a
                          href={`${origin}/preorder/${productSlug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-900/10 transition-all active:scale-95"
                        >
                          <CreditCard className="w-4 h-4" />
                          <span>Live Checkout: Claim Access (${parsedPrice})</span>
                          <ExternalLink className="w-3.5 h-3.5 ml-0.5 opacity-80" />
                        </a>

                        <a
                          href={`${origin}/preorder/${productSlug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                        >
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          <span>Reserve with ${depositVal} Deposit</span>
                          <ExternalLink className="w-3.5 h-3.5 ml-0.5 opacity-80" />
                        </a>
                      </div>
                    )
                  })()}
                  {campaignKit?.pricingConfig?.activeExperimentTitle && (
                    <p className="text-[11px] text-emerald-700 font-semibold">
                      ✨ Pricing optimized via active experiment: {campaignKit.pricingConfig.activeExperimentTitle}
                    </p>
                  )}
                </div>

                {/* Visual Designed Mockup Showcase (Full, Non-Editable UI Frame) */}
                <div className="pt-4 max-w-4xl mx-auto">
                  <ProductMockupDisplay project={project} theme="lime" />
                </div>
              </div>

              {/* Infrastructure Hub: Checkout, Attribution & Waitlist */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {/* 1. Stripe Checkout Engine */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/90 space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider font-mono">Stripe Checkout</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <div className="text-xl font-extrabold text-slate-900 font-display">
                    ${presalesRevenue.toLocaleString()} <span className="text-xs text-slate-500 font-normal">Collected</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Stripe pre-orders active. Live payment simulation updates revenue in real-time.
                  </p>
                </div>

                {/* 2. Creator Attribution & UTM Tracking */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/90 space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider font-mono">Attribution Tracker</span>
                    <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 truncate max-w-[150px]">
                      ?ref={(project?.creatorHandle || 'creator').replace('@','')}
                    </span>
                  </div>
                  <div className="text-xl font-extrabold text-slate-900 font-display">
                    100% <span className="text-xs text-slate-500 font-normal">Channel Attribution</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Tracks creator audience conversions, social link clicks, and presale attribution.
                  </p>
                </div>

                {/* 3. Waitlist & Deposit Capture */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/90 space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider font-mono">Waitlist System</span>
                    <span className="text-[10px] text-emerald-700 font-mono font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {reservations.length} Leads
                    </span>
                  </div>
                  <div className="text-xl font-extrabold text-slate-900 font-display">
                    ${activeDepositPrice} <span className="text-xs text-slate-500 font-normal">Deposit Model</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
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
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-mono text-[11px] truncate flex-1 max-w-lg shadow-2xs">
                    <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate font-semibold">
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
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 flex items-center gap-1.5 transition-colors shadow-2xs active:scale-95 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copy Link</span>
                  </button>

                  <a
                    href={`${origin}/survey/${productSlug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs active:scale-95 cursor-pointer"
                  >
                    <span>Open Live Survey</span>
                    <ExternalLink className="w-3.5 h-3.5 text-white/80" />
                  </a>
                </div>
              </div>

              {/* AI Research & Validation Scorecard */}
              <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-50 to-white border border-slate-200 space-y-4 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 font-mono">
                        AI Validation & Demand Score
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {surveyResponses.length} Responses Collected
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-slate-900 mt-0.5">
                      {surveyAnalysis?.scoreVerdict || (surveyResponses.length > 0 ? 'Validation Data Ready for Analysis' : 'Awaiting Audience Responses')}
                    </h3>
                  </div>

                  <button
                    onClick={handleAnalyzeResponses}
                    disabled={isAnalyzingResponses || surveyResponses.length === 0}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isAnalyzingResponses ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                        <span className="text-white">Analyzing with AI...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span className="text-white">Analyze Responses with AI</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Score Breakdown Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1 shadow-2xs">
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Overall Score</span>
                    <div className="text-2xl font-black text-slate-900 font-display">
                      {surveyAnalysis?.overallScore !== undefined ? `${surveyAnalysis.overallScore}/100` : '—'}
                    </div>
                    <div className="text-[10px] font-bold text-slate-600">
                      {surveyAnalysis?.recommendation === 'PROCEED' ? '🟢 Proceed to Build' : surveyAnalysis ? '🟡 Iterate Pricing' : 'Awaiting analysis'}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1 shadow-2xs">
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Market Demand</span>
                    <div className="text-2xl font-black text-emerald-600 font-display">
                      {surveyAnalysis?.marketDemandScore !== undefined ? `${surveyAnalysis.marketDemandScore}%` : '—'}
                    </div>
                    <div className="text-[10px] font-medium text-slate-500">Problem urgency signal</div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1 shadow-2xs">
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Pricing Viability (${activeFoundingPrice})</span>
                    <div className="text-2xl font-black text-indigo-600 font-display">
                      {surveyAnalysis?.pricingViabilityScore !== undefined ? `${surveyAnalysis.pricingViabilityScore}%` : '—'}
                    </div>
                    <div className="text-[10px] font-medium text-slate-500">Willingness to pay signal</div>
                  </div>
                </div>

                {/* AI Executive Synthesis */}
                {surveyAnalysis?.executiveSummary && (
                  <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2 shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-800 uppercase tracking-wider block">
                      AI Executive Summary
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {surveyAnalysis.executiveSummary}
                    </p>

                    {surveyAnalysis.keyFindings?.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 space-y-1">
                        {surveyAnalysis.keyFindings.map((finding, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-[11px] text-slate-700">
                            <span className="text-emerald-600 font-bold">✓</span>
                            <span>{finding}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Discovery Questions Card */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">Customer Discovery Questions</h4>
                    <p className="text-[11px] text-slate-500">
                      Qualitative discovery questions asked on the public survey page.
                    </p>
                  </div>

                  <button
                    onClick={handleGenerateSurvey}
                    disabled={isGeneratingSurvey}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isGeneratingSurvey ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                        <span className="text-white">Generating...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span className="text-white">Regenerate Questions with AI</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="space-y-2.5">
                  {(surveyData?.questions || []).map((q, index) => (
                    <div key={q.id || index} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-slate-200 text-slate-800 border border-slate-300 shrink-0 font-mono">
                            {q.category || 'Discovery'}
                          </span>
                          <span className="font-bold text-slate-900 text-xs">{q.question}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                          (q.responseCount || 0) > 0
                            ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                            : 'text-slate-600 bg-white border border-slate-200'
                        }`}>
                          {(q.responseCount || 0) > 0 ? `${q.responseCount} responses` : '0 responses (Awaiting data)'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Custom Question Form */}
                <form onSubmit={handleAddQuestion} className="flex gap-2 pt-2 border-t border-slate-100">
                  <select
                    value={newQuestionCategory}
                    onChange={e => setNewQuestionCategory(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 font-bold outline-none focus:border-slate-400"
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
                    className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 outline-none focus:border-slate-400 placeholder:text-slate-400"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-white" />
                    <span className="text-white">Add</span>
                  </button>
                </form>
              </div>

              {/* Live Audience Responses Stream */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">Live Community Response Stream</h4>
                    <p className="text-[11px] text-slate-500">
                      Real-time responses submitted by audience members through the public survey URL.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200 font-mono">
                      {surveyResponses.length} Responses
                    </span>
                    {surveyResponses.length > 0 && (
                      <button
                        onClick={handleClearAllSurveyResponses}
                        className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-[10px] font-bold transition-colors cursor-pointer"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                </div>

                {surveyResponses.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-xs border border-dashed border-slate-200 bg-slate-50/50 rounded-xl space-y-1.5">
                    <p className="font-semibold text-slate-700">No audience responses submitted yet.</p>
                    <p className="text-[10px] text-slate-500">Share your survey URL to collect responses from the community.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {surveyResponses.map((r) => (
                      <div key={r.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 relative group">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-xs">{r.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono">({r.email})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              Intent: {r.rating || 8}/10 🔥
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">{r.submittedAt || r.date}</span>
                            <button
                              onClick={() => handleDeleteSurveyResponse(r.id)}
                              title="Delete response"
                              className="p-1 rounded hover:bg-red-100 text-slate-400 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Answers Breakdown */}
                        {r.answers && (
                          <div className="space-y-1.5 text-[11px] text-slate-700 pl-1">
                            {Object.entries(r.answers).map(([key, ans]) => (
                              <div key={key} className="flex items-start gap-1.5">
                                <span className="text-slate-400 font-bold shrink-0">•</span>
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

          <div className="pt-4 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-200">
            <div className="flex items-center gap-2 text-xs text-slate-700 font-medium">
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>Verification: Verify assets, copy, discovery survey & infrastructure</span>
            </div>
            <button
              onClick={() => {
                const step2Assets = project?.validationCampaign?.productAssets || project?.validationCampaign?.product_assets || {
                  productName: project?.productName,
                  productTagline: project?.productTagline,
                  pricingConfig: sanitizedPricingConfig
                }

                setIsStep2Approved(true)

                const updated = {
                  ...(project || {}),
                  planLocked: true,
                  assetsApproved: true,
                  landingPageApproved: true,
                  validationCampaign: {
                    ...(project?.validationCampaign || {}),
                    product_assets: step2Assets,
                    productAssets: step2Assets,
                    campaign_kit: campaignKit,
                    campaignKit: campaignKit,
                    creator_tasks: campaignKit?.postingSchedule || [],
                    infrastructure: {
                      landingPageUrl: `/p/${productSlug}`,
                      checkoutUrl: `/p/${productSlug}/checkout`,
                      waitlistCount: 240,
                      attributionTracking: true
                    },
                    research_survey: surveyData,
                    review_status: 'approved',
                    reviewStatus: 'approved'
                  }
                }

                if (onUpdateProject) {
                  onUpdateProject(prev => ({ ...(prev || {}), ...updated }))
                }

                if (project?.id) {
                  updateValidationCampaign(project.id, {
                    product_assets: step2Assets,
                    campaign_kit: campaignKit,
                    campaignKit: campaignKit,
                    creator_tasks: campaignKit?.postingSchedule || [],
                    infrastructure: {
                      landingPageUrl: `/p/${productSlug}`,
                      checkoutUrl: `/p/${productSlug}/checkout`,
                      waitlistCount: 240,
                      attributionTracking: true
                    },
                    research_survey: surveyData,
                    review_status: 'approved'
                  }).catch(e => console.warn('[Phase1] DB campaign approval warning:', e))

                  updateCoLaunchProject(project.id, {
                    assetsApproved: true,
                    landingPageApproved: true,
                    campaignKit: campaignKit,
                    campaign_kit: campaignKit
                  }).catch(e => console.warn('[Phase1] DB project approval warning:', e))

                  logProjectActivity(project.id, {
                    action: 'Validation Assets & Campaign Approved',
                    details: 'Step 2 assets, copy, and research survey approved. Advancing to Creator Campaign.',
                    step: 'assets',
                    phase: 1
                  }).catch(e => console.warn('[Phase1] Activity logging warning:', e))
                }

                showNotification('Validation assets approved & locked in database! Advancing to Creator Campaign.')
                setActiveStep('campaign')
                onSelectStep?.('campaign')
              }}
              className="execution-btn px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-extrabold text-xs flex items-center gap-2 transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span className="text-white">Approve & Launch Validation Campaign</span>
              <ArrowRight className="w-3.5 h-3.5 text-white" />
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
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <button
                onClick={generateCampaign}
                disabled={isGeneratingCampaign}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white border border-slate-900 text-xs font-bold transition-all disabled:opacity-50 active:scale-95 shadow-sm"
              >
                {isGeneratingCampaign ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                    <span>Drafting...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                    <span>Generate AI Content</span>
                  </>
                )}
              </button>
              <button
                onClick={saveAll}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold transition-all active:scale-95 shadow-sm"
              >
                <Save className="w-3.5 h-3.5 text-emerald-700" />
                <span>Save</span>
              </button>
            </div>
          </div>

          {/* CREATOR CHANNEL & AUDIENCE DATA INVESTIGATION BAR */}
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-slate-900">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center shrink-0 shadow-2xs">
                <Youtube className="w-5 h-5 text-red-600" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black text-slate-950 truncate">
                    {project?.creatorName || 'Creator Partner'}
                  </span>
                  {project?.creatorHandle && (
                    <span className="text-[11px] font-mono font-medium text-slate-500">
                      {project.creatorHandle.startsWith('@') ? project.creatorHandle : `@${project.creatorHandle}`}
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Audience Data Grounded</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                  Sourced from recent channel uploads & community discussions.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href={creatorChannelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 text-xs font-bold transition-all shadow-2xs cursor-pointer group"
                title="Open Creator Channel"
              >
                <Youtube className="w-3.5 h-3.5 text-red-600 shrink-0" />
                <span>Creator Channel</span>
                <ExternalLink className="w-3 h-3 text-red-500 group-hover:translate-x-0.5 transition-transform" />
              </a>
              <button
                type="button"
                onClick={() => {
                  setAudienceIntelModalTab('transcripts')
                  setShowAudienceIntelModal(true)
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                title="View Audience Citations and transcripts"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Audience Citations</span>
              </button>
            </div>
          </div>

          {/* CAMPAIGN CADENCE & PACING */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-slate-700" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Campaign Cadence
                </h4>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Cadence Mode Selector */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  Cadence
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'low_burden', label: 'Low-Burden', desc: '4 posts' },
                    { id: 'balanced', label: 'Balanced', desc: '5 posts' },
                    { id: 'intensive', label: 'Sprint', desc: '7 posts' }
                  ].map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setCampaignPacing(p.id)}
                      className={`py-2 px-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        campaignPacing === p.id
                          ? 'bg-slate-900 border-slate-900 text-white shadow-2xs'
                          : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="text-xs font-bold">{p.label}</div>
                      <div className={`text-[10px] ${campaignPacing === p.id ? 'text-slate-300' : 'text-slate-500'}`}>
                        {p.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Normal Posting Rhythm Selector */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  Creator Posting Frequency
                </label>
                <select
                  value={postingFrequency}
                  onChange={e => setPostingFrequency(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 outline-none focus:bg-white focus:border-slate-400 transition-all cursor-pointer"
                >
                  <option value="1 video per week (Standard YouTube)">1 video / week (Standard YouTube)</option>
                  <option value="2-3 posts per week (Multi-channel)">2–3 posts / week (Multi-channel)</option>
                  <option value="Bi-weekly or monthly (Long-form deep dives)">Bi-weekly or monthly</option>
                  <option value="High-frequency short-form (Daily TikTok/Reels)">Daily short-form (Reels/TikTok)</option>
                </select>
              </div>
            </div>

            {/* Optional Custom Instructions */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-slate-500" />
                  <span>Custom Instructions (Optional)</span>
                </label>
                {campaignStrategyPrompt && (
                  <button
                    type="button"
                    onClick={() => setCampaignStrategyPrompt('')}
                    className="text-[10px] text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>

              <input
                type="text"
                value={campaignStrategyPrompt}
                onChange={e => setCampaignStrategyPrompt(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-slate-400 transition-all"
                placeholder="e.g. Focus on YouTube mid-roll, avoid Twitter spam, keep effort under 30 mins..."
              />

              {/* Compact Quick Preset Chips */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { label: '⚡ Low-Burden (4 posts)', prompt: 'Design a low-burden roadmap of 4 spaced milestones. Avoid daily spam.', pacing: 'low_burden' },
                  { label: '🎯 Balanced (5 posts)', prompt: 'Create 5 spaced touchpoints including a behind-the-scenes engineering story and mid-roll demo.', pacing: 'balanced' },
                  { label: '🚀 Sprint Pace (7 posts)', prompt: 'Execute a fast 7-milestone validation sprint across multiple channels to lock 50 Founding Members.', pacing: 'intensive' },
                  { label: '🎬 Video Mid-Roll Only', prompt: 'Focus promotional effort on an organic 60s mid-roll in their next YouTube video plus 1:1 email.' },
                  { label: '💌 Email + Stories Only', prompt: 'Hit the goal using only 1:1 founder email and Instagram story polls. Zero video filming required.' }
                ].map(chip => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => {
                      setCampaignStrategyPrompt(chip.prompt)
                      if (chip.pacing) setCampaignPacing(chip.pacing)
                    }}
                    className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all cursor-pointer ${
                      campaignStrategyPrompt === chip.prompt
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-500 font-medium">
                {campaignPacing === 'low_burden' 
                  ? '4 spaced milestones · ~40 mins creator effort' 
                  : campaignPacing === 'balanced' 
                  ? '5 spaced milestones · ~55 mins creator effort' 
                  : '7 milestones · Sprint pace'}
              </span>

              <button
                onClick={generateCampaign}
                disabled={isGeneratingCampaign}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs active:scale-95 disabled:opacity-50 cursor-pointer shrink-0"
              >
                {isGeneratingCampaign ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                    <span>Generating Campaign...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                    <span>{hasCampaignGenerated ? 'Update Campaign' : 'Generate Campaign'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* If Campaign Kit is actively generating */}
          {isGeneratingCampaign ? (
            <Phase1CampaignGenSkeleton />
          ) : !hasCampaignGenerated ? (
            <div className="p-8 sm:p-12 rounded-2xl bg-white border border-dashed border-slate-200 text-center space-y-4 max-w-xl mx-auto my-6 shadow-xs text-slate-900">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center mx-auto text-indigo-600 shadow-2xs">
                <Megaphone className="w-8 h-8 text-indigo-600" />
              </div>
              <div className="space-y-1.5 max-w-md mx-auto">
                <h4 className="text-base font-bold text-slate-900">Campaign Kit Ready to Generate</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Generate a tailored launch roadmap with non-burdensome spaced milestones, social copy, story sequences, 60s video scripts, newsletter drafts, and tracking links customized for {project?.creatorName || 'the creator'}.
                </p>
              </div>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={generateCampaign}
                  disabled={isGeneratingCampaign}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-900 hover:bg-black text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-xs active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-white" />
                  <span>Generate Campaign Kit with AI</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Today's Action Highlight Banner */}
              {todayTask && (() => {
                const campaignStartDate = project?.validationCampaign?.createdAt || project?.created_at || project?.createdAt
                const currentCampaignDay = campaignStartDate
                  ? Math.max(1, Math.floor((Date.now() - new Date(campaignStartDate).getTime()) / (1000 * 60 * 60 * 24)) + 1)
                  : 1
                const isTodayTaskOverdue = !todayTask.done && todayTask.day < currentCampaignDay

                return (
                  <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs ${
                    isTodayTaskOverdue
                      ? 'bg-amber-50/80 border-amber-300 shadow-amber-100'
                      : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {isTodayTaskOverdue ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 font-mono">
                            <AlertCircle className="w-3 h-3 text-amber-600" />
                            <span>⚠️ Missed Mission · Day {todayTask.day}</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-slate-200 text-slate-800 border border-slate-300 font-mono">
                            🔥 Today's Mission (Day {todayTask.day})
                          </span>
                        )}
                        <span className="text-xs font-bold text-slate-600">{todayTask.channel}</span>
                      </div>
                      <h4 className="text-sm font-extrabold text-slate-900">
                        {isTodayTaskOverdue ? 'Overdue Action: ' : 'Today: '}{todayTask.title}
                      </h4>
                      <p className="text-[11px] text-slate-600">
                        {todayTask.description}
                      </p>

                      {/* Live Asset Preview in Today's Task if available */}
                      {(() => {
                        const todayDk = todayTask.draftKey || ''
                        const todayCh = (todayTask.channel || '').toLowerCase()
                        const todayTi = (todayTask.title || '').toLowerCase()
                        const isTodayVideo = todayDk === 'videoScript' || (!todayDk && (todayCh.includes('video') || todayCh.includes('reel') || todayCh.includes('short') || (todayCh.includes('youtube') && !todayCh.includes('community')) || todayTi.includes('video')))
                        const isTodayPost = todayDk === 'announcementPost' || (!isTodayVideo && !todayCh.includes('email') && !todayCh.includes('newsletter') && !todayCh.includes('story'))

                        if (isTodayPost && (todayTask.imageUrl || campaignKit?.postImageUrl || campaignKit?.postImageDataUrl)) {
                          return (
                            <div className="mt-2.5 p-2 rounded-xl bg-white border border-slate-200 flex items-center gap-2.5 max-w-md shadow-2xs">
                              <img
                                src={todayTask.imageUrl || campaignKit?.postImageUrl || campaignKit?.postImageDataUrl}
                                alt="Today's Announcement Graphic"
                                className="w-12 h-12 object-cover rounded-lg border border-slate-300 shadow-2xs shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => {
                                  setDraftModalView('visual')
                                  setViewDraftTask({ ...todayTask, viewType: 'post' })
                                }}
                                title="Click to preview full mockup"
                              />
                              <div className="min-w-0">
                                <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                                  <Sparkles className="w-3 h-3 text-amber-600 shrink-0" />
                                  <span className="truncate">Visual Announcement Graphic</span>
                                </span>
                                <div className="flex items-center gap-2 text-[10px] pt-0.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setDraftModalView('visual')
                                      setViewDraftTask({ ...todayTask, viewType: 'post' })
                                    }}
                                    className="font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                                  >
                                    View Mockup
                                  </button>
                                  <span className="text-slate-300">·</span>
                                  <a
                                    href={todayTask.imageUrl || campaignKit?.postImageUrl || campaignKit?.postImageDataUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="font-bold text-slate-500 hover:text-slate-700 cursor-pointer flex items-center gap-0.5"
                                  >
                                    <span>Full Res</span>
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                </div>
                              </div>
                            </div>
                          )
                        }

                        if (isTodayVideo && (todayTask.videoUrl || campaignKit?.videoUrl)) {
                          return (
                            <div className="mt-2.5 p-2 rounded-xl bg-white border border-slate-200 flex items-center gap-2.5 max-w-md shadow-2xs">
                              <div
                                onClick={() => {
                                  setDraftModalView('video')
                                  setViewDraftTask({ ...todayTask, viewType: 'video' })
                                }}
                                className="w-12 h-12 rounded-lg bg-slate-900 border border-slate-300 shadow-2xs shrink-0 flex items-center justify-center cursor-pointer hover:bg-black transition-colors group/play"
                                title="Click to preview video teaser"
                              >
                                <Play className="w-4 h-4 text-amber-400 fill-amber-400 group-hover/play:scale-110 transition-transform" />
                              </div>
                              <div className="min-w-0">
                                <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                                  <Video className="w-3 h-3 text-rose-600 shrink-0" />
                                  <span className="truncate">AI Video Teaser Attached</span>
                                </span>
                                <div className="flex items-center gap-2 text-[10px] pt-0.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setDraftModalView('video')
                                      setViewDraftTask({ ...todayTask, viewType: 'video' })
                                    }}
                                    className="font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                                  >
                                    Watch Video
                                  </button>
                                  <span className="text-slate-300">·</span>
                                  <a
                                    href={todayTask.videoUrl || campaignKit?.videoUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="font-bold text-slate-500 hover:text-slate-700 cursor-pointer flex items-center gap-0.5"
                                  >
                                    <span>Download MP4</span>
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                </div>
                              </div>
                            </div>
                          )
                        }

                        return null
                      })()}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      {isTodayTaskOverdue && (
                        <>
                          <button
                            onClick={() => handleSendTaskReminder(todayTask)}
                            disabled={remindingTaskId === todayTask.id}
                            className="px-3 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold border border-amber-300 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                            title="Send email reminder to creator"
                          >
                            {remindingTaskId === todayTask.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-700" />
                            ) : (
                              <Bell className="w-3.5 h-3.5 text-amber-700" />
                            )}
                            <span>{remindingTaskId === todayTask.id ? 'Sending...' : 'Remind Creator'}</span>
                          </button>

                          <button
                            onClick={() => handleWhatsAppNudge(todayTask)}
                            className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                            title="Copy WhatsApp Nudge message"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                            <span>WhatsApp Nudge</span>
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => setViewDraftTask(todayTask)}
                        className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Draft</span>
                      </button>

                      <button
                        onClick={() => handleToggleScheduleTask(todayTask.id)}
                        className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors border cursor-pointer ${
                          todayTask.done
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-2xs'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{todayTask.done ? 'Completed' : 'Mark Done'}</span>
                      </button>
                    </div>
                  </div>
                )
              })()}

              {/* AUDIENCE PROVENANCE & ANTI-SPAM ARCHITECTURE BANNER */}
              <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 text-xs text-slate-700 space-y-2.5 shadow-2xs">
                <div className="flex items-center gap-2 border-b border-emerald-200/80 pb-2.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Grounded in Real Creator Content & Audience Data</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-700 leading-relaxed">
                  Every post, 60s script, and email draft is derived directly from <strong className="text-slate-900 font-semibold">{project?.creatorName || 'the creator'}'s channel uploads</strong>, channel bio, and <strong className="text-slate-900 font-semibold">{audienceGroundingData.stats.commentsIngested}+ community comments</strong>. Formatted into spaced milestones with 1:1 plain-text emails to guarantee Primary Inbox delivery.
                </p>
              </div>

              {/* Subtabs Navigation */}
              <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 pb-3">
                {[
                  { id: 'schedule', label: '1. Schedule', icon: Calendar },
                  { id: 'post', label: '2. Announcement Post', icon: MessageSquare },
                  { id: 'story', label: '3. Stories & Polls', icon: Smartphone },
                  { id: 'video', label: '4. Video Script', icon: Video },
                  { id: 'newsletter', label: '5. Newsletter', icon: Send },
                  { id: 'dm', label: '6. DM Outreach', icon: Users },
                  { id: 'links', label: '7. Tracking Links', icon: Globe },
                ].map(tab => {
                  const Icon = tab.icon
                  const isActive = campaignSubTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setCampaignSubTab(tab.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                        isActive
                          ? 'bg-slate-900 text-white shadow-xs border border-slate-900'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 bg-white border border-slate-200/80 shadow-2xs'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                      <span>{tab.label}</span>
                    </button>
                  )
                })}
              </div>

              {/* SUBTAB 1: SCHEDULE & CHECKLIST */}
              {campaignSubTab === 'schedule' && (
                <div className="space-y-4">
                  {/* Autonomous Morning Post Dispatcher Card */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center shrink-0 text-indigo-600 shadow-2xs">
                          <Mail className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-extrabold text-slate-900 tracking-wide font-sans">
                              Autonomous 24-Hour Post Dispatcher
                            </h4>
                            <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold font-mono border ${
                              isAutonomousEnabled
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300 shadow-2xs'
                                : 'bg-slate-200 text-slate-700 border-slate-300'
                            }`}>
                              {isAutonomousEnabled ? '● AUTO-DELIVERY ACTIVE (EVERY 24 HOURS)' : 'PAUSED'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-relaxed max-w-2xl font-normal">
                            Zero friction. Creator Forge automatically emails each day's ready-to-post caption + direct download link for the high-res graphic or video directly to the creator's inbox every 24 hours on schedule. No app login required.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                        <button
                          type="button"
                          onClick={() => handleSendPostKitEmail(null)}
                          disabled={isSendingTodayEmail}
                          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50 active:scale-95"
                          title="Instantly email today's ready-to-post content kit"
                        >
                          {isSendingTodayEmail ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                          ) : (
                            <Send className="w-3.5 h-3.5 text-white" />
                          )}
                          <span>{isSendingTodayEmail ? 'Sending...' : "Send Today's Post to Email"}</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-indigo-100 text-xs">
                      <div className="flex items-center gap-2 flex-1 max-w-md">
                        <span className="text-[11px] text-slate-700 font-semibold shrink-0">Deliver to:</span>
                        <input
                          type="email"
                          value={autonomousEmail}
                          onChange={(e) => setAutonomousEmail(e.target.value)}
                          onBlur={() => handleToggleAutonomousEmail(isAutonomousEnabled)}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleToggleAutonomousEmail(isAutonomousEnabled) }}
                          placeholder="creator@email.com"
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
                        />
                      </div>
                      <div className="flex items-center gap-2 shrink-0 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleToggleAutonomousEmail(!isAutonomousEnabled)}
                          disabled={isSavingAutonomousConfig}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isAutonomousEnabled
                              ? 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 shadow-2xs font-semibold'
                              : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs font-bold'
                          }`}
                        >
                          {isAutonomousEnabled ? 'Pause 24-Hour Dispatch' : 'Enable 24-Hour Dispatch'}
                        </button>
                        <button
                          type="button"
                          onClick={simulationState?.running ? handleStopSimulation : handleStartSimulation}
                          disabled={isStartingSimulation}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            simulationState?.running
                              ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 shadow-2xs'
                              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs'
                          }`}
                        >
                          {simulationState?.running ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
                              <span>Stop 5-Min Test ({simulationState?.completed || 0}/{simulationState?.total || 7})</span>
                            </>
                          ) : (
                            <>
                              <Zap className="w-3.5 h-3.5 text-amber-300" />
                              <span>Test 5-Min Dispatch</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {simulationState?.logs?.length > 0 && (
                      <div className="mt-3 p-3 bg-white/90 rounded-xl border border-indigo-100 shadow-2xs text-xs">
                        <div className="flex items-center justify-between font-bold text-slate-800 mb-1.5">
                          <span className="flex items-center gap-1.5">
                            {simulationState.running ? (
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            ) : simulationState.status === 'completed' ? (
                              <span>✅</span>
                            ) : (
                              <span>🛑</span>
                            )}
                            Autonomous 5-Min Dispatch Sequence {simulationState.running ? 'Running' : simulationState.status === 'completed' ? 'Completed' : 'Stopped'}
                          </span>
                          <span className="text-[11px] font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 font-bold">
                            {simulationState.completed} / {simulationState.total} Delivered
                          </span>
                        </div>
                        <div className="flex gap-1.5 overflow-x-auto py-1">
                          {simulationState.logs.map((log, lIdx) => (
                            <div key={lIdx} className="shrink-0 bg-slate-50 border border-slate-200/80 rounded-lg px-2.5 py-1 text-[11px] flex items-center gap-1.5">
                              <span className="font-bold text-slate-700">Day {log.day}:</span>
                              <span className="text-slate-600 truncate max-w-[130px]">{log.title}</span>
                              <span className="text-emerald-600 font-bold">✓</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Header & Progress */}
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Creator Launch Roadmap (Non-Burdensome Cadence)</h4>
                      <p className="text-[11px] text-slate-500">
                        Spaced milestones tailored to {project?.creatorName || 'the creator'}'s upload rhythm — hitting validation targets with under 45 mins total effort.
                      </p>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 shadow-2xs font-mono">
                      {(campaignKit?.postingSchedule || []).filter(t => t.done)?.length || 0} / {(campaignKit?.postingSchedule || []).length} Completed
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                      style={{ 
                        width: `${(((campaignKit?.postingSchedule || []).filter(t => t.done)?.length || 0) / Math.max(1, (campaignKit?.postingSchedule || []).length)) * 100}%` 
                      }}
                    />
                  </div>

                  {/* Milestone Cards with Visual Asset Showcase */}
                  <div className="space-y-3.5">
                    {(() => {
                      const campaignStartDate = project?.validationCampaign?.createdAt || project?.created_at || project?.createdAt
                      const currentCampaignDay = campaignStartDate
                        ? Math.max(1, Math.floor((Date.now() - new Date(campaignStartDate).getTime()) / (1000 * 60 * 60 * 24)) + 1)
                        : 1

                      return (campaignKit?.postingSchedule || []).map((task, taskIdx) => {
                        const isOverdue = !task.done && task.day < currentCampaignDay
                        const dk = task.draftKey || ''
                        const channelLower = (task.channel || '').toLowerCase()
                        const titleLower = (task.title || '').toLowerCase()

                        const isVideoTask = dk === 'videoScript' || (!dk && (channelLower.includes('video') || channelLower.includes('reel') || channelLower.includes('short') || (channelLower.includes('youtube') && !channelLower.includes('community')) || titleLower.includes('video')))
                        const isStoryTask = dk === 'storySequence' || (!dk && (channelLower.includes('story') || channelLower.includes('instagram') || titleLower.includes('story') || titleLower.includes('poll')))
                        const isEmailTask = dk === 'newsletterDraft' || (!dk && (channelLower.includes('newsletter') || channelLower.includes('email') || titleLower.includes('newsletter') || titleLower.includes('email')))
                        const isDmTask = dk === 'directMessageScript' || (!dk && (channelLower.includes('dm') || channelLower.includes('direct') || channelLower.includes('message') || titleLower.includes('dm')))
                        const isPostTask = dk === 'announcementPost' || (!isVideoTask && !isStoryTask && !isEmailTask && !isDmTask)

                        return (
                          <div
                            key={task.id || taskIdx}
                            className={`p-4 rounded-2xl border transition-all space-y-3.5 ${
                              isOverdue
                                ? 'bg-amber-50/70 border-amber-300 shadow-sm'
                                : task.isToday
                                ? 'bg-white border-emerald-400 ring-2 ring-emerald-500/15 shadow-sm'
                                : task.done
                                ? 'bg-slate-50/80 border-slate-200 opacity-85'
                                : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                            }`}
                          >
                            {/* Card Top: Checkbox, Badges & Actions */}
                            <div className="flex items-start justify-between gap-3 flex-wrap">
                              <div className="flex items-start gap-3 min-w-0">
                                <button
                                  type="button"
                                  onClick={() => handleToggleScheduleTask(task.id)}
                                  className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center transition-colors shrink-0 cursor-pointer ${
                                    task.done
                                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xs'
                                      : 'border-slate-300 bg-white hover:border-emerald-500 hover:bg-emerald-50/50'
                                  }`}
                                  title={task.done ? 'Mark pending' : 'Mark completed'}
                                >
                                  {task.done && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                </button>

                                <div className="space-y-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {isOverdue ? (
                                      <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 font-mono">
                                        <AlertCircle className="w-3 h-3 text-amber-600" />
                                        <span>Missed · Milestone {task.milestoneNumber || taskIdx + 1}</span>
                                      </span>
                                    ) : task.isToday ? (
                                      <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono shadow-2xs flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                                        <span>Active · Milestone {task.milestoneNumber || taskIdx + 1} (Day {task.day})</span>
                                      </span>
                                    ) : task.done ? (
                                      <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                                        Milestone {task.milestoneNumber || taskIdx + 1} (Day {task.day})
                                      </span>
                                    ) : (
                                      <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                                        Milestone {task.milestoneNumber || taskIdx + 1} (Day {task.day})
                                      </span>
                                    )}

                                    {(task.effort || task.effortEstimate) && (
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono">
                                        ⏱️ {task.effort || task.effortEstimate}
                                      </span>
                                    )}

                                    <span className="text-[10px] font-semibold text-slate-500 font-mono">
                                      {task.channel}
                                    </span>

                                    {task.description?.includes('[AI Experiment Variant Active') && (
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono flex items-center gap-1 shadow-2xs">
                                        <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                                        <span>AI Variant Active</span>
                                      </span>
                                    )}

                                    {task.emailed && (
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono flex items-center gap-1">
                                        <Mail className="w-2.5 h-2.5 text-indigo-500" />
                                        <span>Emailed to Creator</span>
                                      </span>
                                    )}
                                  </div>

                                  <h5 className={`text-sm font-bold ${task.done ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                                    {task.title}
                                  </h5>
                                  <p className="text-xs text-slate-600 leading-relaxed">
                                    {task.description}
                                  </p>

                                  {/* Asset Thumbnail Preview for Announcement Graphic */}
                                  {(isPostTask && (task.imageUrl || campaignKit?.postImageUrl || campaignKit?.postImageDataUrl)) && (
                                    <div className="mt-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3 max-w-md shadow-2xs">
                                      <img
                                        src={task.imageUrl || campaignKit?.postImageUrl || campaignKit?.postImageDataUrl}
                                        alt={task.title}
                                        className="w-14 h-14 object-cover rounded-lg border border-slate-300 shadow-2xs shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                                        onClick={() => {
                                          setDraftModalView('visual')
                                          setViewDraftTask({ ...task, viewType: 'post' })
                                        }}
                                        title="Click to preview full mockup"
                                      />
                                      <div className="space-y-0.5 min-w-0">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                                          <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                          <span className="truncate">Visual Announcement Graphic</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[11px]">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setDraftModalView('visual')
                                              setViewDraftTask({ ...task, viewType: 'post' })
                                            }}
                                            className="font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                                          >
                                            View Mockup
                                          </button>
                                          <span className="text-slate-300">·</span>
                                          <a
                                            href={task.imageUrl || campaignKit?.postImageUrl || campaignKit?.postImageDataUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="font-bold text-slate-500 hover:text-slate-700 cursor-pointer flex items-center gap-0.5"
                                          >
                                            <span>Full Res</span>
                                            <ExternalLink className="w-2.5 h-2.5" />
                                          </a>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Video Teaser Preview exclusively for Video Tasks */}
                                  {(isVideoTask && (task.videoUrl || campaignKit?.videoUrl)) && (
                                    <div className="mt-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3 max-w-md shadow-2xs">
                                      <div
                                        onClick={() => {
                                          setDraftModalView('video')
                                          setViewDraftTask({ ...task, viewType: 'video' })
                                        }}
                                        className="w-14 h-14 rounded-lg bg-slate-900 border border-slate-300 shadow-2xs shrink-0 flex items-center justify-center cursor-pointer hover:bg-black transition-colors group/play"
                                        title="Click to preview video teaser"
                                      >
                                        <Play className="w-5 h-5 text-amber-400 fill-amber-400 group-hover/play:scale-110 transition-transform" />
                                      </div>
                                      <div className="space-y-0.5 min-w-0">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                                          <Video className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                          <span className="truncate">AI Video Teaser Attached</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[11px]">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setDraftModalView('video')
                                              setViewDraftTask({ ...task, viewType: 'video' })
                                            }}
                                            className="font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                                          >
                                            Watch Video
                                          </button>
                                          <span className="text-slate-300">·</span>
                                          <a
                                            href={task.videoUrl || campaignKit?.videoUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="font-bold text-slate-500 hover:text-slate-700 cursor-pointer flex items-center gap-0.5"
                                          >
                                            <span>Download MP4</span>
                                            <ExternalLink className="w-2.5 h-2.5" />
                                          </a>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono">
                                  {task.channel}
                                </span>
                              </div>
                            </div>

                            {/* Milestone Card Footer: Action Bar & Asset Indicators */}
                            <div className="pt-2.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                              <div className="flex items-center gap-2 flex-wrap">
                                {isPostTask && (task.imageUrl || campaignKit?.postImageUrl || campaignKit?.postImageDataUrl) && (
                                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-mono flex items-center gap-1 shadow-2xs">
                                    <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                                    <span>AI Graphic Ready (View in Modal)</span>
                                  </span>
                                )}
                                {isVideoTask && (task.videoUrl || campaignKit?.videoUrl) && (
                                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200 font-mono flex items-center gap-1 shadow-2xs">
                                    <Video className="w-2.5 h-2.5 text-rose-600" />
                                    <span>AI Video Ready (View in Modal)</span>
                                  </span>
                                )}
                                {!task.done && (
                                  <span className="text-[11px] text-slate-500 font-medium">
                                    {task.isToday ? "🔥 Scheduled for today's release" : `Scheduled for Day ${task.day}`}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => handleCopyTextWithFeedback(getTaskDraftContent(task), task.id)}
                                  className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
                                  title="Copy raw text draft"
                                >
                                  {copiedTaskId === task.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                                  <span>{copiedTaskId === task.id ? 'Copied!' : 'Copy Text'}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleSendPostKitEmail(task)}
                                  disabled={sendingEmailTaskId === task.id}
                                  className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                                  title="Send this specific post kit to creator email"
                                >
                                  {sendingEmailTaskId === task.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                                  ) : (
                                    <Mail className="w-3.5 h-3.5 text-indigo-600" />
                                  )}
                                  <span className="hidden sm:inline">{task.emailed ? 'Re-send Email' : 'Email Post Kit'}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setDraftModalView(isVideoTask ? 'video' : 'visual')
                                    setViewDraftTask(task)
                                  }}
                                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                                  title="Open modal with visual mockup, generated image/video, and copy"
                                >
                                  <Eye className="w-3.5 h-3.5 text-slate-300" />
                                  <span>View Draft &amp; Mockup</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })
                    })()}
                  </div>
                </div>
              )}

              {/* SUBTAB 2: POST */}
              {campaignSubTab === 'post' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                  {/* Left: High-Fidelity Social Media Card Mockup */}
                  <div className="lg:col-span-7 space-y-2.5">
                    <div className="flex items-center justify-between text-xs gap-2 flex-wrap">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <XLogo className="w-3.5 h-3.5 text-slate-900" />
                        <span>Visual Post Mockup (Official X Post Preview)</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleGeneratePostImage()}
                        disabled={isGeneratingImage}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                        title="Generate announcement graphic"
                      >
                        {isGeneratingImage ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                            <span className="text-white">Generating Image...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-white" />
                            <span className="text-white">{campaignKit?.postImageUrl ? 'Regenerate Image' : 'Generate Image'}</span>
                          </>
                        )}
                      </button>
                    </div>

                    {imageGenError && (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200/90 text-rose-800 text-xs flex items-start justify-between gap-3 animate-fade-in shadow-2xs">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                          <div className="space-y-0.5 min-w-0">
                            <span className="font-bold text-rose-950 block">Image Generation Notice</span>
                            <span className="text-[11px] text-rose-800 leading-relaxed block break-words">{imageGenError}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleGeneratePostImage()}
                            className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold transition-all cursor-pointer shadow-2xs"
                          >
                            Retry
                          </button>
                          <button
                            type="button"
                            onClick={() => setImageGenError(null)}
                            className="p-1 rounded-md text-rose-400 hover:text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
                            title="Dismiss error"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}

                    <PostVisualMockup
                      type="post"
                      project={project}
                      copyText={campaignKit?.announcementPost}
                      preorderUrl={`${origin}/preorder/${productSlug}`}
                      imageUrl={campaignKit?.postImageUrl || campaignKit?.postImageDataUrl}
                      isGeneratingImage={isGeneratingImage}
                      imageError={imageGenError}
                      onRetryImage={() => handleGeneratePostImage()}
                    />

                    {campaignKit?.postImageUrl && (
                      <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/90 flex items-center justify-between gap-2 text-xs flex-wrap">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                          <span className="text-amber-950 text-xs truncate">
                            <strong>AI Announcement Graphic Active</strong>
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleDownloadAsset(campaignKit.postImageUrl, `${project?.creatorHandle || 'launch'}_graphic.png`)}
                            className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download PNG</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSendPostKitEmail(campaignKit?.postingSchedule?.find(t => (t.channel || '').toLowerCase().includes('post') || (t.channel || '').toLowerCase().includes('x')) || null)}
                            disabled={isSendingTodayEmail}
                            className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200 flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                          >
                            <Mail className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Email Post Kit</span>
                          </button>
                          <a
                            href={campaignKit.postImageUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-bold text-amber-800 hover:text-amber-950 underline cursor-pointer"
                          >
                            View ↗
                          </a>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right: Copy & Caption Editor */}
                  <div className="lg:col-span-5 space-y-2">
                    {campaignKit?.activeMessagingExperiment && (
                      <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 flex items-center justify-between gap-2 shadow-2xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold text-emerald-900 block truncate">
                              AI Variant Active: {campaignKit.activeMessagingExperiment.title}
                            </span>
                            <span className="text-[9px] text-emerald-700">Applied from Step 4 Funnel Experiments</span>
                          </div>
                        </div>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0 font-mono">
                          {campaignKit.activeMessagingExperiment.expectedUplift || '+28% CTR'}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Social Announcement Post Copy</span>
                      <button
                        onClick={() => copyToClipboard(campaignKit?.announcementPost, 'post')}
                        disabled={!campaignKit?.announcementPost}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors disabled:opacity-40 cursor-pointer shadow-2xs"
                      >
                        {copiedKey === 'post' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey === 'post' ? 'Copied!' : 'Copy Post'}</span>
                      </button>
                    </div>
                    <textarea
                      value={campaignKit?.announcementPost || ''}
                      onChange={e => updateCampaignKit('announcementPost', e.target.value)}
                      placeholder="Click 'Generate AI Content' or write custom announcement post..."
                      rows={12}
                      className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 outline-none leading-relaxed font-sans focus:bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5 resize-y transition-all"
                    />
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 space-y-1">
                      <div className="flex items-center justify-between text-slate-500 font-mono text-[10px]">
                        <span>Length: {(campaignKit?.announcementPost || '').length} chars</span>
                        <span>Pre-Order URL: /preorder/{productSlug}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                        Anchored in channel topics. Backers click through to pre-order and reserve Founding Cohort spots.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* SUBTAB 3: STORIES & POLLS */}
              {campaignSubTab === 'story' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                  {/* Left: Interactive 9:16 Story Frame Mockup */}
                  <div className="lg:col-span-5 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-pink-500" />
                        <span>Interactive 9:16 Story Frame Mockup</span>
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">Instagram / TikTok</span>
                    </div>
                    <PostVisualMockup
                      type="story"
                      project={project}
                      copyText={campaignKit?.storySequence}
                      preorderUrl={`${origin}/preorder/${productSlug}`}
                    />
                  </div>

                  {/* Right: 3-Story Sequence Editor */}
                  <div className="lg:col-span-7 space-y-2">
                    {campaignKit?.activeStoryExperiment && (
                      <div className="p-2.5 rounded-xl bg-pink-50 border border-pink-300 text-pink-950 flex items-center justify-between gap-2 shadow-2xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse shrink-0" />
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold text-pink-900 block truncate">
                              AI Variant Active: {campaignKit.activeStoryExperiment.title}
                            </span>
                            <span className="text-[9px] text-pink-700">Applied from Step 4 Funnel Experiments</span>
                          </div>
                        </div>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-pink-100 text-pink-800 border border-pink-300 shrink-0 font-mono">
                          {campaignKit.activeStoryExperiment.expectedUplift || '+2.1x Engagement'}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Instagram / TikTok 3-Story Sequence & Polls</span>
                      <button
                        onClick={() => copyToClipboard(campaignKit?.storySequence, 'story')}
                        disabled={!campaignKit?.storySequence}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors disabled:opacity-40 cursor-pointer shadow-2xs"
                      >
                        {copiedKey === 'story' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey === 'story' ? 'Copied!' : 'Copy Stories'}</span>
                      </button>
                    </div>
                    <textarea
                      value={campaignKit?.storySequence || ''}
                      onChange={e => updateCampaignKit('storySequence', e.target.value)}
                      placeholder="Story 1: Pain point poll&#10;Story 2: Product announcement&#10;Story 3: Link sticker CTA"
                      rows={14}
                      className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 outline-none leading-relaxed font-sans focus:bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5 resize-y transition-all"
                    />
                    <div className="p-3.5 rounded-xl bg-pink-50/60 border border-pink-200/80 text-[11px] text-pink-950 space-y-1">
                      <span className="font-bold block text-xs">3-Step Non-Burdensome Conversion Arc:</span>
                      <p className="text-[10px] text-pink-900/80 leading-relaxed">
                        Story 1 tests organic pain point friction via poll sticker (zero selling) → Story 2 reveals the co-founded software → Story 3 adds the pre-order link sticker to capture the 50 Founding Members.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* SUBTAB 4: VIDEO SCRIPT */}
              {campaignSubTab === 'video' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                  {/* Left: 60-Second Video Player Mockup with Teleprompter */}
                  <div className="lg:col-span-7 space-y-2.5">
                    <div className="flex items-center justify-between text-xs gap-2 flex-wrap">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Video className="w-3.5 h-3.5 text-red-500" />
                        <span>60-Second Video Player &amp; Teleprompter Mockup</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleGenerateCampaignVideo()}
                        disabled={isGeneratingVideo}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                        title="Generate teaser video"
                      >
                        {isGeneratingVideo ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                            <span className="text-white">Generating Video...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-white" />
                            <span className="text-white">{campaignKit?.videoUrl ? 'Regenerate Video' : 'Generate Video'}</span>
                          </>
                        )}
                      </button>
                    </div>

                    {videoGenError && (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200/90 text-rose-800 text-xs flex items-start justify-between gap-3 animate-fade-in shadow-2xs">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                          <div className="space-y-0.5 min-w-0">
                            <span className="font-bold text-rose-950 block">Video Generation Notice</span>
                            <span className="text-[11px] text-rose-800 leading-relaxed block break-words">{videoGenError}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleGenerateCampaignVideo()}
                            className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold transition-all cursor-pointer shadow-2xs"
                          >
                            Retry
                          </button>
                          <button
                            type="button"
                            onClick={() => setVideoGenError(null)}
                            className="p-1 rounded-md text-rose-400 hover:text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
                            title="Dismiss error"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}

                    <PostVisualMockup
                      type="video"
                      project={project}
                      copyText={campaignKit?.videoScript}
                      preorderUrl={`${origin}/preorder/${productSlug}`}
                      videoUrl={campaignKit?.videoUrl}
                      isGeneratingVideo={isGeneratingVideo}
                      videoError={videoGenError}
                      onRetryVideo={() => handleGenerateCampaignVideo()}
                    />

                    {campaignKit?.videoUrl && (
                      <div className="p-3 rounded-xl bg-red-50/80 border border-red-200/90 flex items-center justify-between gap-2 text-xs flex-wrap">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                          <span className="text-red-950 text-xs truncate">
                            <strong>AI Launch Video Active</strong>
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleDownloadAsset(campaignKit.videoUrl, `${project?.creatorHandle || 'launch'}_video.mp4`)}
                            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download MP4</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSendPostKitEmail(campaignKit?.postingSchedule?.find(t => (t.channel || '').toLowerCase().includes('video')) || null)}
                            disabled={isSendingTodayEmail}
                            className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200 flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                          >
                            <Mail className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Email Video Kit</span>
                          </button>
                          <a
                            href={campaignKit.videoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-bold text-red-700 hover:text-red-900 underline cursor-pointer"
                          >
                            Open ↗
                          </a>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right: Teleprompter Script Editor & Citation */}
                  <div className="lg:col-span-5 space-y-2.5">
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-center justify-between gap-2 text-xs shadow-2xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <Youtube className="w-4 h-4 text-red-600 shrink-0" />
                        <span className="text-red-950 text-[11px] truncate">
                          <strong>Mid-Roll Anchor:</strong> "{audienceGroundingData.transcripts[0]?.title || 'Recent Channel Upload'}"
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setAudienceIntelModalTab('transcripts')
                          setShowAudienceIntelModal(true)
                        }}
                        className="text-[10px] font-bold text-red-700 hover:text-red-900 underline cursor-pointer shrink-0"
                      >
                        View Citation ↗
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">60-Second Short Form Script</span>
                      <button
                        onClick={() => copyToClipboard(campaignKit?.videoScript, 'video')}
                        disabled={!campaignKit?.videoScript}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors disabled:opacity-40 cursor-pointer shadow-2xs"
                      >
                        {copiedKey === 'video' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey === 'video' ? 'Copied!' : 'Copy Script'}</span>
                      </button>
                    </div>
                    <textarea
                      value={campaignKit?.videoScript || ''}
                      onChange={e => updateCampaignKit('videoScript', e.target.value)}
                      placeholder="Click 'Generate AI Content' or write 60-second video script..."
                      rows={12}
                      className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 outline-none leading-relaxed font-mono focus:bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5 resize-y transition-all"
                    />
                  </div>
                </div>
              )}

              {/* SUBTAB 5: NEWSLETTER */}
              {campaignSubTab === 'newsletter' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                  {/* Left: 1:1 Founder Email Inbox Mockup */}
                  <div className="lg:col-span-7 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-600" />
                        <span>1:1 Founder Email Inbox Mockup</span>
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">Gmail / Superhuman preview</span>
                    </div>
                    <PostVisualMockup
                      type="newsletter"
                      project={project}
                      copyText={campaignKit?.newsletterDraft}
                      preorderUrl={`${origin}/preorder/${productSlug}`}
                    />
                  </div>

                  {/* Right: Newsletter Copy Editor */}
                  <div className="lg:col-span-5 space-y-2.5">
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-2 text-xs shadow-2xs">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-amber-600 shrink-0" />
                        <span className="text-amber-950 text-[11px]">
                          <strong>Deliverability Guard:</strong> 1:1 founder plain-text from {project?.creatorName || 'creator'}. 0% spam triggers, Primary Inbox delivery guaranteed.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setAudienceIntelModalTab('comments')
                          setShowAudienceIntelModal(true)
                        }}
                        className="text-[10px] font-bold text-amber-800 hover:text-amber-950 underline cursor-pointer shrink-0"
                      >
                        View Evidence ↗
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Creator Email Newsletter Copy</span>
                      <button
                        onClick={() => copyToClipboard(campaignKit?.newsletterDraft, 'newsletter')}
                        disabled={!campaignKit?.newsletterDraft}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors disabled:opacity-40 cursor-pointer shadow-2xs"
                      >
                        {copiedKey === 'newsletter' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey === 'newsletter' ? 'Copied!' : 'Copy Newsletter'}</span>
                      </button>
                    </div>
                    <textarea
                      rows={12}
                      value={campaignKit?.newsletterDraft || ''}
                      onChange={e => updateCampaignKit('newsletterDraft', e.target.value)}
                      placeholder="Click 'Generate AI Content' or write newsletter copy..."
                      className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 outline-none leading-relaxed font-sans focus:bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5 transition-all"
                    />
                  </div>
                </div>
              )}

              {/* SUBTAB 6: DM OUTREACH */}
              {campaignSubTab === 'dm' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                  {/* Left: 1-on-1 Direct Message Mockup */}
                  <div className="lg:col-span-7 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-indigo-500" />
                        <span>1:1 Direct Message Mockup (High-Intent Supporter Outreach)</span>
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">Encrypted chat preview</span>
                    </div>
                    <PostVisualMockup
                      type="dm"
                      project={project}
                      copyText={campaignKit?.directMessageScript}
                      preorderUrl={`${origin}/preorder/${productSlug}`}
                    />
                  </div>

                  {/* Right: DM Script Editor */}
                  <div className="lg:col-span-5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">1-on-1 DM Script</span>
                      <button
                        onClick={() => copyToClipboard(campaignKit?.directMessageScript, 'dm')}
                        disabled={!campaignKit?.directMessageScript}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors disabled:opacity-40 cursor-pointer shadow-2xs"
                      >
                        {copiedKey === 'dm' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey === 'dm' ? 'Copied!' : 'Copy DM'}</span>
                      </button>
                    </div>
                    <textarea
                      value={campaignKit?.directMessageScript || ''}
                      onChange={e => updateCampaignKit('directMessageScript', e.target.value)}
                      placeholder="Click 'Generate AI Content' or write DM outreach template..."
                      rows={10}
                      className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 outline-none leading-relaxed font-sans focus:bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5 transition-all"
                    />
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 space-y-1">
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                        Personal outreach message sent directly from {project?.creatorName || 'creator'} to top commenters and community leaders.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* SUBTAB 7: TRACKING LINKS */}
              {campaignSubTab === 'links' && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Channel Attribution UTM Links</h4>
                    <p className="text-[11px] text-slate-500">
                      Trackable pre-order URLs for creator social bio, stories, videos, and newsletters.
                    </p>
                  </div>

                  <div className="space-y-2">
                    {[
                      { channel: 'Instagram Stories', ref: 'instagram_story' },
                      { channel: 'TikTok / Shorts', ref: 'tiktok_video' },
                      { channel: 'X (Social Post)', ref: 'x_post' },
                      { channel: 'Email Newsletter', ref: 'newsletter' },
                      { channel: '1-on-1 DM Outreach', ref: 'dm_outreach' },
                    ].map((item, i) => {
                      const slug = (project?.productName || 'product').toLowerCase().replace(/[^a-z0-9]/g, '')
                      const fullUrl = `${origin}/preorder/${slug}?ref=${item.ref}`
                      return (
                        <div key={i} className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <span className="font-bold text-slate-900 text-xs block">{item.channel}</span>
                            <span className="text-[11px] text-slate-600 font-mono truncate">{fullUrl}</span>
                          </div>
                          <button
                            onClick={() => copyToClipboard(fullUrl, `link-${i}`)}
                            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 flex items-center gap-1 transition-colors self-end sm:self-auto cursor-pointer"
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
              {viewDraftTask && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[99999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in overflow-y-auto">
                  <div className="w-full max-w-2xl rounded-3xl bg-white border border-slate-200 shadow-2xl p-5 sm:p-6 space-y-4 animate-scale-in text-slate-900 my-auto">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3 gap-3">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block font-mono">
                          Day {viewDraftTask.day} · {viewDraftTask.channel}
                        </span>
                        <h3 className="text-base font-extrabold text-slate-900">{viewDraftTask.title}</h3>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Visual / Video / Text Toggle */}
                        <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                          <button
                            type="button"
                            onClick={() => setDraftModalView('visual')}
                            className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer flex items-center gap-1 ${
                              draftModalView === 'visual'
                                ? 'bg-white text-slate-900 shadow-2xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <span>👁️</span>
                            <span>Visual Mockup</span>
                          </button>
                          {(campaignKit?.videoUrl || viewDraftTask?.videoUrl || viewDraftTask?.draftKey === 'videoScript') && (
                            <button
                              type="button"
                              onClick={() => setDraftModalView('video')}
                              className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                draftModalView === 'video'
                                  ? 'bg-rose-600 text-white shadow-2xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              <Video className="w-3 h-3" />
                              <span>Watch Video</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setDraftModalView('text')}
                            className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer flex items-center gap-1 ${
                              draftModalView === 'text'
                                ? 'bg-white text-slate-900 shadow-2xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <span>📝</span>
                            <span>Raw Text</span>
                          </button>
                        </div>

                        <button
                          onClick={() => setViewDraftTask(null)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Modal Body: Video Player, Visual Mockup, or Raw Text */}
                    {draftModalView === 'video' ? (
                      <div className="py-1 max-h-[68vh] overflow-y-auto pr-1">
                        <PostVisualMockup
                          type="video"
                          project={project}
                          copyText={getTaskDraftContent(viewDraftTask, 'video')}
                          preorderUrl={`${origin}/preorder/${productSlug}`}
                          imageUrl={viewDraftTask?.imageUrl || campaignKit?.postImageUrl || campaignKit?.postImageDataUrl}
                          videoUrl={viewDraftTask?.videoUrl || campaignKit?.videoUrl}
                        />
                      </div>
                    ) : draftModalView === 'visual' ? (
                      <div className="py-1 max-h-[68vh] overflow-y-auto pr-1">
                        {(() => {
                          const targetType = viewDraftTask.viewType || (() => {
                            const dk = viewDraftTask.draftKey || ''
                            if (dk === 'videoScript') return 'video'
                            if (dk === 'storySequence') return 'story'
                            if (dk === 'newsletterDraft') return 'newsletter'
                            if (dk === 'directMessageScript') return 'dm'
                            if (dk === 'announcementPost') return 'post'
                            const ch = (viewDraftTask.channel || '').toLowerCase()
                            const ti = (viewDraftTask.title || '').toLowerCase()
                            if (ch.includes('video') || ch.includes('reel') || ch.includes('short') || (ch.includes('youtube') && !ch.includes('community')) || ti.includes('video')) return 'video'
                            if (ch.includes('story') || ch.includes('instagram') || ti.includes('story') || ti.includes('poll')) return 'story'
                            if (ch.includes('newsletter') || ch.includes('email') || ti.includes('newsletter') || ti.includes('email')) return 'newsletter'
                            if (ch.includes('dm') || ch.includes('direct') || ch.includes('message')) return 'dm'
                            return 'post'
                          })()

                          return (
                            <PostVisualMockup
                              type={targetType}
                              project={project}
                              copyText={getTaskDraftContent(viewDraftTask, targetType)}
                              preorderUrl={`${origin}/preorder/${productSlug}`}
                              imageUrl={viewDraftTask?.imageUrl || campaignKit?.postImageUrl || campaignKit?.postImageDataUrl}
                              videoUrl={viewDraftTask?.videoUrl || campaignKit?.videoUrl}
                            />
                          )
                        })()}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 max-h-72 overflow-y-auto font-sans leading-relaxed text-xs text-slate-800">
                        <pre className="text-xs text-slate-800 font-sans whitespace-pre-wrap leading-relaxed">
                          {getTaskDraftContent(viewDraftTask)}
                        </pre>
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => {
                          copyToClipboard(getTaskDraftContent(viewDraftTask), 'draft-modal')
                          showNotification('Draft content copied to clipboard!')
                        }}
                        className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{copiedKey === 'draft-modal' ? 'Copied!' : 'Copy Draft Text'}</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            handleToggleScheduleTask(viewDraftTask.id)
                            setViewDraftTask(null)
                          }}
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Mark Completed</span>
                        </button>
                        <button
                          onClick={() => setViewDraftTask(null)}
                          className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition-colors cursor-pointer"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                </div>,
                document.body
              )}

            </>
          )}

          <div className="pt-2 flex justify-end">
            <button
              onClick={() => {
                const updated = {
                  ...(project || {}),
                  campaignApproved: true,
                  step3Done: true,
                  campaignKit: campaignKit
                }
                if (onUpdateProject) onUpdateProject(prev => ({ ...(prev || {}), ...updated }))
                if (project?.id) {
                  updateCoLaunchProject(project.id, {
                    campaignApproved: true,
                    step3Done: true
                  }).catch(e => console.warn(e))
                }
                showNotification('Creator campaign approved & sprint launched!')
                setActiveStep('optimize')
                onSelectStep?.('optimize')
              }}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <span>Next: Run & Optimize</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: RUN & OPTIMIZE */}
      {/* STEP 4: RUN & OPTIMIZE (VALIDATION ENGINE & COHORT TRACKING) */}
      {activeStep === 'optimize' && (() => {
        // Stage Progression System
        const currentLevelData = (() => {
          if (reservations.length >= 50 || presalesRevenue >= presaleTarget) {
            return {
              level: 5,
              title: 'Cohort Validated',
              subtitle: 'Phase 1 validation criteria achieved. 50 Founding Members secured for Phase 2 MVP Engineering.',
              badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
              nextTarget: 'Target Reached (50 Backers)'
            }
          }
          if (reservations.length >= 10 || presalesRevenue >= 500) {
            return {
              level: 4,
              title: 'Scaling Momentum',
              subtitle: `${reservations.length} / 50 Founding passes secured. Strong conversion velocity across channels.`,
              badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
              nextTarget: '50 Backers Target'
            }
          }
          if (reservations.length >= 1 || presalesRevenue >= 50) {
            return {
              level: 3,
              title: 'Early Traction',
              subtitle: `First paid pre-orders verified! ${50 - reservations.length} Founding passes remaining.`,
              badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
              nextTarget: '10 Backers Milestone'
            }
          }
          if (totalTraffic >= 10 || totalSignups >= 1) {
            return {
              level: 2,
              title: 'Audience Signal',
              subtitle: `${totalTraffic} unique visitors tracking funnel resonance. Awaiting first customer pre-order.`,
              badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
              nextTarget: 'First Customer Pre-Order'
            }
          }
          return {
            level: 1,
            title: 'Funnel Initialized',
            subtitle: 'Validation engine active. Direct creator audience to pre-order checkout to validate demand.',
            badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
            nextTarget: 'First 10 Visitors'
          }
        })()

        // Validation Milestones
        const validationTrophies = [
          {
            id: 'launch_kit',
            title: 'Mission Uplink',
            desc: 'Launch roadmap & assets ready',
            icon: Megaphone,
            unlocked: Boolean(campaignKit?.announcementPost || (campaignKit?.postingSchedule || []).length > 0),
            reward: 'Steps 1–3 Ready'
          },
          {
            id: 'traffic_pulse',
            title: 'Audience Radar',
            desc: 'Traffic arriving from creator channels',
            icon: Radar,
            unlocked: totalTraffic > 0,
            reward: 'Audience Active',
            current: `${totalTraffic} / 10 visitors`
          },
          {
            id: 'survey_voice',
            title: 'Voice of Community',
            desc: 'Discovery feedback recorded',
            icon: MessageSquare,
            unlocked: (surveyResponses?.length || 0) > 0,
            reward: 'Demand Validated',
            current: `${surveyResponses?.length || 0} responses`
          },
          {
            id: 'genesis_backer',
            title: 'Genesis Backer',
            desc: 'First pre-order payment collected',
            icon: Crown,
            unlocked: reservations.length > 0,
            reward: 'First Sale',
            current: `${reservations.length} / 1 backer`
          },
          {
            id: 'sovereign_gate',
            title: 'Sovereign Validation',
            desc: '50 Founding Members secured',
            icon: Trophy,
            unlocked: reservations.length >= 50 || presalesRevenue >= presaleTarget,
            reward: 'Phase 2 Unlock',
            current: `${reservations.length} / 50 backers`
          }
        ]

        // Attribution Channels with Real Icons and Ranked Ordering
        const rawChannels = [
          {
            id: 'instagram',
            name: 'Instagram Stories',
            icon: Camera,
            iconColor: 'text-pink-600 bg-pink-50 border-pink-200',
            badge: 'Story Polls',
            traffic: Math.max(
              (project?.uniqueVisitors || []).filter(v => {
                const ch = (v.channel || '').toLowerCase()
                const p = (v.path || '').toLowerCase()
                const r = (v.referrer || '').toLowerCase()
                return ch.includes('instagram') || ch.includes('ig') || ch.includes('story') || p.includes('instagram') || p.includes('ig') || r.includes('instagram') || r.includes('ig')
              }).length,
              Number(project?.telemetry?.channelAttribution?.['Instagram Stories'] || project?.telemetry?.channelAttribution?.['instagram'] || 0)
            ),
            conversions: reservations.filter(r => (r.channel || '').toLowerCase().includes('instagram') || (r.channel || '').toLowerCase().includes('ig')).length
          },
          {
            id: 'tiktok',
            name: 'TikTok / Shorts',
            icon: Video,
            iconColor: 'text-cyan-700 bg-cyan-50 border-cyan-200',
            badge: '60s Video Mid-Roll',
            traffic: Math.max(
              (project?.uniqueVisitors || []).filter(v => {
                const ch = (v.channel || '').toLowerCase()
                const p = (v.path || '').toLowerCase()
                const r = (v.referrer || '').toLowerCase()
                return ch.includes('tiktok') || ch.includes('shorts') || ch.includes('reels') || ch.includes('youtube') || ch.includes('yt') || p.includes('tiktok') || r.includes('tiktok')
              }).length,
              Number(project?.telemetry?.channelAttribution?.['TikTok / Shorts'] || project?.telemetry?.channelAttribution?.['tiktok'] || 0)
            ),
            conversions: reservations.filter(r => (r.channel || '').toLowerCase().includes('tiktok') || (r.channel || '').toLowerCase().includes('shorts')).length
          },
          {
            id: 'x',
            name: 'X (Social Post)',
            isXLogo: true,
            iconColor: 'text-slate-900 bg-slate-100 border-slate-300',
            badge: 'Announcement Post',
            traffic: Math.max(
              (project?.uniqueVisitors || []).filter(v => {
                const ch = (v.channel || '').toLowerCase()
                const p = (v.path || '').toLowerCase()
                const r = (v.referrer || '').toLowerCase()
                return ch.includes('twitter') || ch.includes('x') || p.includes('twitter') || r.includes('twitter') || r.includes('t.co')
              }).length,
              Number(project?.telemetry?.channelAttribution?.['Twitter / X'] || project?.telemetry?.channelAttribution?.['twitter'] || 0)
            ),
            conversions: reservations.filter(r => (r.channel || '').toLowerCase().includes('twitter') || (r.channel || '').toLowerCase().includes('x')).length
          },
          {
            id: 'newsletter',
            name: 'Email Newsletter',
            icon: Mail,
            iconColor: 'text-amber-700 bg-amber-50 border-amber-200',
            badge: '1:1 Founder Letter',
            traffic: Math.max(
              (project?.uniqueVisitors || []).filter(v => {
                const ch = (v.channel || '').toLowerCase()
                const p = (v.path || '').toLowerCase()
                const r = (v.referrer || '').toLowerCase()
                return ch.includes('newsletter') || ch.includes('email') || p.includes('newsletter') || r.includes('newsletter') || r.includes('email')
              }).length,
              Number(project?.telemetry?.channelAttribution?.['Email Newsletter'] || project?.telemetry?.channelAttribution?.['newsletter'] || 0)
            ),
            conversions: reservations.filter(r => (r.channel || '').toLowerCase().includes('newsletter') || (r.channel || '').toLowerCase().includes('email')).length
          }
        ]

        // Rank sorted channels
        const rankedChannels = [...rawChannels].sort((a, b) => (b.conversions * 10 + b.traffic) - (a.conversions * 10 + a.traffic))
        const maxTraffic = Math.max(1, ...rawChannels.map(c => c.traffic))

        return (
          <div className="space-y-2">
            {/* TIGHT VALIDATION FUNNEL HERO */}
            <div className="p-2 sm:p-2.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                {/* Left: Crest Badge, Stage & Progress */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative shrink-0" data-testid="mission-level-crest">
                    <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-white shadow-2xs">
                      <Rocket className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 px-1 py-0.2 rounded-full text-[7px] font-mono font-bold bg-emerald-500 text-slate-950 shadow-2xs border border-white">
                      LVL {currentLevelData.level}
                    </div>
                  </div>

                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`px-1.5 py-0.2 rounded text-[8px] font-mono font-bold uppercase tracking-wider border shadow-2xs ${currentLevelData.badgeColor}`}>
                        Stage {currentLevelData.level}: {currentLevelData.title}
                      </span>
                      <h3 className="text-xs font-bold text-slate-900 tracking-tight truncate">
                        4. Run + Optimize Validation Engine
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-slate-500 min-w-0">
                      <span className="truncate max-w-xs sm:max-w-md">{currentLevelData.subtitle}</span>
                      <span className="text-slate-300 hidden sm:inline">•</span>
                      <div className="hidden sm:flex items-center gap-1.5 shrink-0 font-mono text-[9px]">
                        <span className="text-slate-500">Cohort: <strong className="text-slate-900">{reservations.length}/50</strong></span>
                        <div className="w-16 bg-slate-100 h-1 rounded-full overflow-hidden border border-slate-200/60 inline-block align-middle">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, Math.max(8, (reservations.length / 50) * 100))}%` }}
                          />
                        </div>
                        <span className="text-emerald-700 font-semibold">{currentLevelData.nextTarget}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-1.5 shrink-0">
                  <button
                    onClick={handleRunExperimentsAI}
                    disabled={isAnalyzingExperiments}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-semibold transition-colors disabled:opacity-50 shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer h-6.5"
                  >
                    {isAnalyzingExperiments ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin text-emerald-400" />
                        <span>Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <Sliders className="w-3 h-3 text-slate-300" />
                        <span>Run Optimization</span>
                      </>
                    )}
                  </button>

                  <span className="text-[8px] font-mono font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1 h-6.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Live Pulse</span>
                  </span>
                </div>
              </div>
            </div>

            {/* SECTION 1: TIGHT TELEMETRY GRID */}
            <div className="space-y-1">
              <div className="flex items-center justify-between px-0.5">
                <span className="text-[10px] font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1">
                  <Activity className="w-3 h-3 text-emerald-600" />
                  <span>Validation Engine Telemetry</span>
                </span>
                <span className="text-[9px] font-mono text-slate-500 font-medium">Target: 50 Presales ($1,000 Milestone)</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5 text-xs">
                {/* 1. Traffic */}
                <div className="p-1.5 sm:p-2 rounded-lg bg-white border border-slate-200/80 hover:border-slate-300 transition-all space-y-0.5 shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Traffic</span>
                    <Radar className="w-3 h-3 text-slate-400" />
                  </div>
                  <div className="text-sm sm:text-base font-extrabold font-mono text-slate-900 tracking-tight leading-none py-0.5">{totalTraffic.toLocaleString()}</div>
                  <div className="text-[8px] text-slate-400 flex items-center justify-between pt-0.5 border-t border-slate-100">
                    <span>Unique</span>
                    <span className="font-mono font-medium px-1 py-0.2 rounded bg-slate-100 text-slate-600">Live</span>
                  </div>
                </div>

                {/* 2. CTR */}
                <div className="p-1.5 sm:p-2 rounded-lg bg-white border border-slate-200/80 hover:border-slate-300 transition-all space-y-0.5 shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">CTR</span>
                    <MousePointerClick className="w-3 h-3 text-slate-400" />
                  </div>
                  <div className="text-sm sm:text-base font-extrabold font-mono text-slate-900 tracking-tight leading-none py-0.5">{dynamicCTR.toFixed(1)}%</div>
                  <div className="text-[8px] text-slate-400 flex items-center justify-between pt-0.5 border-t border-slate-100">
                    <span>Clicks</span>
                    <span className="font-mono font-medium px-1 py-0.2 rounded bg-slate-100 text-slate-600">Funnel</span>
                  </div>
                </div>

                {/* 3. Signups */}
                <div className="p-1.5 sm:p-2 rounded-lg bg-white border border-slate-200/80 hover:border-slate-300 transition-all space-y-0.5 shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Signups</span>
                    <Flame className="w-3 h-3 text-slate-400" />
                  </div>
                  <div className="text-sm sm:text-base font-extrabold font-mono text-slate-900 tracking-tight leading-none py-0.5">{totalSignups.toLocaleString()}</div>
                  <div className="text-[8px] text-slate-400 flex items-center justify-between pt-0.5 border-t border-slate-100">
                    <span>Waitlist</span>
                    <span className="font-mono font-medium px-1 py-0.2 rounded bg-slate-100 text-slate-600">Leads</span>
                  </div>
                </div>

                {/* 4. Presales */}
                <div className="p-1.5 sm:p-2 rounded-lg bg-white border border-slate-200/80 hover:border-slate-300 transition-all space-y-0.5 shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Presales</span>
                    <Crown className="w-3 h-3 text-amber-500" />
                  </div>
                  <div className="text-sm sm:text-base font-extrabold font-mono text-amber-700 tracking-tight leading-none py-0.5">{reservations.length} <span className="text-[9px] font-normal text-slate-400">/ 50</span></div>
                  <div className="text-[8px] text-slate-400 flex items-center justify-between pt-0.5 border-t border-slate-100">
                    <span>Orders</span>
                    <span className="font-mono font-medium px-1 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200/80">{Math.round((reservations.length / 50) * 100)}%</span>
                  </div>
                </div>

                {/* 5. Revenue */}
                <div className="p-1.5 sm:p-2 rounded-lg bg-emerald-50/40 border border-emerald-200/90 hover:border-emerald-300 transition-all space-y-0.5 shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] text-emerald-800 font-bold uppercase tracking-wider">Revenue</span>
                    <Coins className="w-3 h-3 text-emerald-600" />
                  </div>
                  <div className="text-sm sm:text-base font-extrabold font-mono text-emerald-700 tracking-tight leading-none py-0.5">${presalesRevenue.toLocaleString()}</div>
                  <div className="text-[8px] text-emerald-800/80 flex items-center justify-between pt-0.5 border-t border-emerald-200/60">
                    <span>${presaleTarget.toLocaleString()} goal</span>
                    <span className="font-mono font-medium px-1 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-200/80">{presalesRevenue >= 1000 ? 'Unlocked' : 'Tracking'}</span>
                  </div>
                </div>

                {/* 6. Conversion */}
                <div className="p-1.5 sm:p-2 rounded-lg bg-white border border-slate-200/80 hover:border-slate-300 transition-all space-y-0.5 shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Conversion</span>
                    <Gauge className="w-3 h-3 text-teal-500" />
                  </div>
                  <div className="text-sm sm:text-base font-extrabold font-mono text-slate-900 tracking-tight leading-none py-0.5">{dynamicConversionRate.toFixed(1)}%</div>
                  <div className="text-[8px] text-slate-400 flex items-center justify-between pt-0.5 border-t border-slate-100">
                    <span>Paid rate</span>
                    <span className="font-mono font-medium px-1 py-0.2 rounded bg-teal-50 text-teal-800 border border-teal-200/80">{dynamicConversionRate >= 3 ? 'Healthy' : 'Tracking'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* VALIDATION MILESTONES & TROPHY RACK */}
            <div className="p-2 sm:p-2.5 rounded-xl bg-white border border-slate-200/80 space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between gap-2 px-0.5">
                <div className="flex items-center gap-1.5">
                  <Award className="w-3 h-3 text-amber-500 shrink-0" />
                  <span className="text-xs font-bold text-slate-900">
                    Phase 1 Validation Quests & Trophy Rack
                  </span>
                  <span className="text-[9px] text-slate-400 hidden sm:inline">
                    • De-risk commercial demand before Phase 2
                  </span>
                </div>
                <span className="text-[8px] font-mono font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 shrink-0">
                  {validationTrophies.filter(t => t.unlocked).length} / {validationTrophies.length} Milestones Achieved
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5">
                {validationTrophies.map(trophy => {
                  const Icon = trophy.icon
                  return (
                    <div
                      key={trophy.id}
                      className={`p-1.5 sm:p-2 rounded-lg border transition-all flex flex-col justify-between h-[76px] relative ${
                        trophy.unlocked
                          ? 'bg-emerald-50/20 border-emerald-300 text-slate-900 shadow-2xs'
                          : 'bg-slate-50/50 border-slate-200/70 text-slate-500'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className={`w-4.5 h-4.5 rounded flex items-center justify-center shrink-0 ${
                            trophy.unlocked
                              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-400 border border-slate-200'
                          }`}>
                            <Icon className="w-2.5 h-2.5" />
                          </div>
                          <span className="font-bold text-[10px] sm:text-[11px] truncate text-slate-900 leading-tight">
                            {trophy.title}
                          </span>
                        </div>
                        <span className={`text-[7px] font-mono font-semibold px-1 py-0.2 rounded shrink-0 ${
                          trophy.unlocked
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}>
                          {trophy.unlocked ? 'Unlocked ✓' : 'Locked'}
                        </span>
                      </div>

                      <div className="text-[9px] text-slate-400 truncate leading-tight">
                        {trophy.desc}
                      </div>

                      <div className="text-[8px] font-mono text-slate-500 font-medium flex items-center justify-between pt-0.5 border-t border-slate-100">
                        <span className={trophy.unlocked ? 'text-emerald-700 font-semibold' : 'text-slate-400'}>{trophy.reward}</span>
                        {trophy.current && <span className="text-slate-400 font-normal">{trophy.current}</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* SECTION 2: ATTRIBUTION CHANNEL MATRIX & LEADERBOARD */}
            <div className="p-2 sm:p-2.5 rounded-xl bg-white border border-slate-200/80 space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between gap-2 px-0.5 border-b border-slate-100 pb-1">
                <div className="flex items-center gap-1.5">
                  <Globe className="w-3 h-3 text-sky-500" />
                  <h4 className="text-xs font-bold text-slate-900">
                    Channel Attribution & Conversion Leaderboard
                  </h4>
                  <span className="text-[9px] text-slate-400 hidden sm:inline">• Live CTR & conversions from creator links</span>
                </div>
                <span className="text-[8px] font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 shrink-0 font-medium">
                  Real-time Attribution
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1.5">
                {rankedChannels.map((ch, idx) => {
                  const Icon = ch.icon
                  const ctr = ch.traffic > 0 ? `${((ch.conversions / ch.traffic) * 100).toFixed(1)}%` : '0.0%'
                  const trafficPercent = Math.round((ch.traffic / maxTraffic) * 100)

                  return (
                    <div
                      key={ch.id}
                      className="p-1.5 sm:p-2 rounded-lg bg-slate-50/60 border border-slate-200/70 hover:border-slate-300 hover:bg-white transition-all space-y-1 shadow-2xs"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className={`w-5 h-5 rounded flex items-center justify-center border shadow-2xs shrink-0 ${ch.iconColor}`}>
                            {ch.isXLogo ? <XLogo className="w-2.5 h-2.5" /> : <Icon className="w-2.5 h-2.5" />}
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] sm:text-[11px] font-bold text-slate-900 block leading-tight truncate">{ch.name}</span>
                            <span className="text-[8px] text-slate-400 font-mono truncate block">{ch.badge}</span>
                          </div>
                        </div>

                        <span className={`text-[8px] font-mono font-semibold px-1 py-0.2 rounded shrink-0 ${
                          idx === 0 && ch.traffic > 0
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-white text-slate-600 border border-slate-200'
                        }`}>
                          {idx === 0 && ch.traffic > 0 ? '#1 Top' : `#${idx + 1}`}
                        </span>
                      </div>

                      {/* Mini Traffic Bar */}
                      <div className="space-y-0.5">
                        <div className="flex items-center justify-between text-[8px] text-slate-500 font-mono">
                          <span>Traffic: <strong className="text-slate-900">{ch.traffic}</strong></span>
                          <span>CTR: <strong className="text-emerald-700">{ctr}</strong></span>
                        </div>
                        <div className="w-full bg-slate-200/70 h-1 rounded-full overflow-hidden">
                          <div
                            className="bg-sky-500 h-full rounded-full transition-all duration-300"
                            style={{ width: `${Math.max(5, trafficPercent)}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[8px] pt-0.5 border-t border-slate-200/50">
                        <span className="text-slate-500">Pre-orders: <strong className="text-emerald-700 font-mono font-bold">{ch.conversions}</strong></span>
                        {ch.conversions > 0 ? (
                          <span className="font-mono font-semibold text-emerald-800 bg-emerald-100 px-1 py-0.2 rounded border border-emerald-200">
                            High Intent
                          </span>
                        ) : (
                          <span className="font-mono text-slate-400">Tracking</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* SECTION 3: RECORDED PRE-ORDERS & FOUNDING MEMBERS LEDGER */}
            <div className="p-2 sm:p-2.5 rounded-xl bg-white border border-slate-200/80 space-y-1.5 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-100 pb-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0 shadow-2xs">
                    <Trophy className="w-2.5 h-2.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>Founding Members Ledger ({reservations.length} / 50 Claimed)</span>
                    </h4>
                    <span className="text-[8px] text-slate-400 font-mono">
                      Target Validation Cohort • 50% Lifetime Price Lock
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <a
                    href={`${origin}/preorder/${productSlug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-slate-700 hover:text-slate-900 font-medium flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer h-6"
                  >
                    <span>Open Preorder Checkout</span>
                    <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                  </a>

                  <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 h-6 flex items-center">
                    ${presalesRevenue.toLocaleString()} Collected
                  </span>

                  {reservations.length > 0 && (
                    <button
                      onClick={handleClearAllReservations}
                      className="text-[10px] text-red-600 hover:text-red-700 font-medium bg-red-50 hover:bg-red-100 px-1.5 py-0.5 rounded-md border border-red-200 flex items-center gap-1 transition-colors cursor-pointer h-6"
                      title="Clear all recorded test pre-orders"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                      <span>Reset</span>
                    </button>
                  )}
                </div>
              </div>

              {reservations.length === 0 ? (
                /* TIGHT EMPTY STATE CARD */
                <div className="p-2 rounded-lg bg-amber-50/40 border border-amber-200/60 flex items-center justify-between gap-2 text-left">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0 shadow-2xs" data-testid="founding-trophy-pedestal">
                      <Trophy className="w-3 h-3 text-amber-700" />
                    </div>
                    <div className="min-w-0">
                      <h5 className="text-[11px] font-bold text-slate-900 leading-tight">The 50 Founding Members Cohort is Open</h5>
                      <p className="text-[10px] text-slate-500 leading-tight truncate sm:line-clamp-1 mt-0.2">
                        Lock your first customer pre-order to claim <strong className="text-amber-800 font-semibold">Genesis Backer #1</strong> and kick off validation momentum.
                      </p>
                    </div>
                  </div>

                  <a
                    href={`${origin}/preorder/${productSlug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-white font-semibold text-[10px] flex items-center justify-center gap-1 transition-colors shadow-2xs shrink-0 cursor-pointer h-6.5"
                  >
                    <span>Open Preorder ↗</span>
                  </a>
                </div>
              ) : (
                /* BACKERS LIST (COMPACT SCROLLABLE) */
                <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                  {reservations.map((res, idx) => (
                    <div
                      key={res.id}
                      className="p-1.5 rounded-lg bg-slate-50/70 border border-slate-200/80 hover:border-slate-300 hover:bg-white flex items-center justify-between gap-2 text-xs transition-all shadow-2xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-5 h-5 rounded bg-white border border-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-800 shadow-2xs shrink-0">
                          {idx === 0 ? '👑' : idx < 5 ? '⭐' : '#' + (idx + 1)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-900 text-[11px] truncate">{res.name}</span>
                            <span className={`text-[7px] font-mono font-semibold px-1 py-0.2 rounded border ${
                              idx === 0
                                ? 'bg-amber-100 text-amber-800 border-amber-300'
                                : idx < 5
                                ? 'bg-purple-100 text-purple-800 border-purple-300'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}>
                              {idx === 0 ? 'Genesis Backer #1' : idx < 5 ? `Pioneer #${idx + 1}` : `VIP #${idx + 1}`}
                            </span>
                            {res.paymentMethod && (
                              <span className="text-[7px] font-mono text-slate-500 bg-slate-100 px-1 py-0.2 rounded border border-slate-200">
                                {res.paymentMethod}
                              </span>
                            )}
                            {res.experimentVariant && (
                              <span className="text-[7px] font-mono text-emerald-800 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200 truncate max-w-[130px]" title={res.experimentVariant}>
                                Exp: {res.experimentVariant}
                              </span>
                            )}
                          </div>
                          <div className="text-[8px] text-slate-500 font-mono truncate">{res.email}</div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-bold text-xs text-emerald-700 font-mono">+${res.amount}</div>
                        <span className="text-[8px] text-slate-500">{res.tier}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TIGHT COLLAPSIBLE RECORD TRANSACTION FORM */}
              <div className="rounded-lg bg-slate-50/60 border border-slate-200/70 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowRecordForm(!showRecordForm)}
                  className="w-full p-1.5 sm:p-2 flex items-center justify-between text-left hover:bg-slate-100/70 transition-colors cursor-pointer"
                >
                  <span className="text-[10px] font-bold text-slate-900 flex items-center gap-1.5">
                    <Plus className={`w-3 h-3 text-emerald-600 transition-transform ${showRecordForm ? 'rotate-45' : ''}`} />
                    <span>Record Direct Backer Transaction</span>
                  </span>
                  <div className="flex items-center gap-1 text-[8px] font-mono text-slate-400">
                    <span>Manual Entry / VIP Checkout Simulation</span>
                    <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${showRecordForm ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {showRecordForm && (
                  <div className="p-2 pt-0 space-y-1.5 border-t border-slate-200/50">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 pt-1.5">
                      {[
                        { label: `Founding ($${activeFoundingPrice})`, value: activeFoundingPrice, desc: '50% Price Lock' },
                        { label: `Deposit ($${activeDepositPrice})`, value: activeDepositPrice, desc: 'Guaranteed Hold' },
                        { label: `VIP Pass ($${activeVipPrice})`, value: activeVipPrice, desc: 'Roadmap Access' }
                      ].map(tier => (
                        <button
                          key={tier.value}
                          type="button"
                          onClick={() => setSimBuyerTier(tier.value)}
                          className={`p-1 rounded-md border text-left transition-all cursor-pointer ${
                            simBuyerTier === tier.value
                              ? 'bg-white border-slate-900 text-slate-900 shadow-2xs ring-1 ring-slate-900'
                              : 'bg-white/80 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-white'
                          }`}
                        >
                          <div className="text-[10px] font-semibold">{tier.label}</div>
                          <div className="text-[8px] text-slate-400 leading-tight">{tier.desc}</div>
                        </button>
                      ))}
                    </div>

                    <form onSubmit={handleSimulatePresale} className="grid grid-cols-1 sm:grid-cols-3 gap-1">
                      <input
                        type="text"
                        placeholder="Backer Name"
                        value={simBuyerName}
                        onChange={e => setSimBuyerName(e.target.value)}
                        className="px-2 py-1 rounded-md bg-white border border-slate-200 text-[11px] text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-400 h-6.5"
                      />
                      <input
                        type="email"
                        placeholder="Backer Email"
                        value={simBuyerEmail}
                        onChange={e => setSimBuyerEmail(e.target.value)}
                        className="px-2 py-1 rounded-md bg-white border border-slate-200 text-[11px] text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-400 h-6.5"
                      />
                      <button
                        type="submit"
                        className="px-2 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-white font-semibold text-[10px] flex items-center justify-center gap-1 transition-colors shadow-2xs cursor-pointer h-6.5"
                      >
                        <Plus className="w-2.5 h-2.5" />
                        <span>Record Backer (+${simBuyerTier})</span>
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 4: FUNNEL OPTIMIZATION & A/B EXPERIMENTS */}
            <div className="space-y-1.5 text-xs pt-0.5">
              <div className="p-2 sm:p-2.5 rounded-xl bg-white border border-slate-200/80 space-y-1.5 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-100 pb-1.5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0 shadow-2xs">
                      <Sliders className="w-3 h-3" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Funnel Optimization & A/B Experiments</span>
                      <span className="text-[9px] text-slate-400 font-mono">CRO telemetry analysis for messaging, pricing, and creator content</span>
                    </div>
                  </div>

                  <button
                    onClick={handleRunExperimentsAI}
                    disabled={isAnalyzingExperiments}
                    className="text-[10px] font-semibold text-white bg-slate-900 hover:bg-slate-800 px-2.5 py-1 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs shrink-0 h-6.5"
                  >
                    {isAnalyzingExperiments ? <Loader2 className="w-3 h-3 animate-spin text-emerald-400" /> : <Sliders className="w-3 h-3 text-slate-300" />}
                    <span>{experimentsData ? 'Re-Analyze Funnel' : 'Generate Experiments'}</span>
                  </button>
                </div>

                <p className="text-slate-600 text-[11px] leading-relaxed">
                  {experimentsData?.performanceAudit?.summary || 'Formulate conversion experiments tailored to audience resonance and live funnel bottlenecks.'}
                </p>
              </div>

              {/* Experiments Cards Grid */}
              {isAnalyzingExperiments ? (
                <Phase1ExperimentsGenSkeleton />
              ) : !experimentsData?.experiments || experimentsData.experiments.length === 0 ? (
                <div className="p-3 text-center text-slate-500 border border-slate-200/80 rounded-xl space-y-1.5 bg-slate-50/40">
                  <p className="text-xs">No optimization experiments generated yet.</p>
                  <button
                    type="button"
                    onClick={handleRunExperimentsAI}
                    disabled={isAnalyzingExperiments}
                    className="px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-semibold transition-colors inline-flex items-center gap-1 cursor-pointer h-6.5"
                  >
                    <Sliders className="w-3 h-3" />
                    <span>Analyze Funnel & Generate Experiments</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {/* Active Experiments Summary Banner */}
                  {experimentsData.experiments.some(e => e.status === 'applied') && (
                    <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 shadow-2xs">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-md bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700 shrink-0">
                          <Check className="w-3 h-3" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-bold text-emerald-900">
                              {experimentsData.experiments.filter(e => e.status === 'applied').length} Active Optimization Experiment{experimentsData.experiments.filter(e => e.status === 'applied').length > 1 ? 's' : ''} Live in Phase 1
                            </span>
                            <span className="text-[8px] font-mono font-semibold uppercase px-1 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Active
                            </span>
                          </div>
                          <p className="text-[10px] text-emerald-700">
                            Your Phase 1 Validation Plan (Step 1), Landing Page (Step 2), and Creator Tasks (Step 3) are powered by these active variants.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveStep('assets')
                          onSelectStep?.('assets')
                        }}
                        className="px-2 py-0.5 rounded-md bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300 text-[10px] font-semibold transition-all flex items-center gap-1 shrink-0 cursor-pointer h-6"
                      >
                        <span>View in Funnel</span>
                        <ArrowRight className="w-2.5 h-2.5 text-emerald-700" />
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                    {experimentsData.experiments.map((exp) => {
                      const categoryIcons = {
                        messaging: MessageSquare,
                        pricing: Coins,
                        landing_page: Layout,
                        creator_content: Video
                      }
                      const CatIcon = categoryIcons[exp.category] || Sliders

                      return (
                        <div key={exp.id} className="p-2 sm:p-2.5 rounded-lg bg-white border border-slate-200 hover:border-slate-300 space-y-1.5 flex flex-col justify-between transition-all shadow-2xs">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-mono font-medium uppercase tracking-wider px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                                <CatIcon className="w-2.5 h-2.5 text-slate-600" />
                                <span>{exp.category?.replace('_', ' ')} Experiment</span>
                              </span>
                              <span className="text-[9px] font-mono font-bold text-emerald-800 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                                {exp.expectedUplift}
                              </span>
                            </div>

                            <h4 className="font-bold text-slate-900 text-[11px] leading-snug">{exp.title}</h4>
                            <p className="text-[10px] text-slate-500 leading-relaxed">{exp.hypothesis}</p>

                            <div className="p-1.5 rounded-md bg-slate-50 border border-slate-200/80 space-y-0.2 text-[10px]">
                              <span className="text-emerald-700 font-semibold block flex items-center gap-1 text-[9px]">
                                <ArrowRight className="w-2.5 h-2.5 text-emerald-600" />
                                <span>Proposed Variant:</span>
                              </span>
                              <p className="text-slate-800 italic leading-relaxed">{exp.variant}</p>
                            </div>

                            {/* Phase 1 Implementation Mapping */}
                            <div className="text-[9px] text-slate-400 flex items-center gap-1 pt-0.5">
                              <span className="font-medium text-slate-500">Targets:</span>
                              <span className="text-slate-600 font-mono">
                                {exp.category === 'messaging'
                                  ? 'Step 2 Kit & Step 3 Social'
                                  : exp.category === 'creator_content'
                                  ? 'Step 3 Story Sprints'
                                  : exp.category === 'landing_page'
                                  ? 'Step 2 Hero & Headline'
                                  : 'Step 1 Plan & Step 2 Checkout'}
                              </span>
                            </div>
                          </div>

                          <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between gap-1.5">
                            <div className="flex items-center gap-1">
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                exp.status === 'applied' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                              }`} />
                              <span className={`text-[9px] font-mono font-medium uppercase tracking-wider ${
                                exp.status === 'applied' ? 'text-emerald-700' : 'text-slate-500'
                              }`}>
                                {exp.status === 'applied' ? 'Live in Phase 1' : 'Ready to Test'}
                              </span>
                            </div>

                            <div className="flex items-center gap-1">
                              {exp.status === 'applied' && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (exp.category === 'messaging') {
                                        setActiveStep('campaign')
                                        setCampaignSubTab('post')
                                        onSelectStep?.('campaign')
                                      } else if (exp.category === 'creator_content') {
                                        setActiveStep('campaign')
                                        setCampaignSubTab('story')
                                        onSelectStep?.('campaign')
                                      } else if (exp.category === 'pricing') {
                                        setActiveStep('plan')
                                        onSelectStep?.('plan')
                                      } else {
                                        setActiveStep('assets')
                                        onSelectStep?.('assets')
                                      }
                                    }}
                                    className="px-1.5 py-0.5 rounded text-[10px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 transition-colors flex items-center gap-1 cursor-pointer h-6"
                                    title="Jump to target step in Phase 1 to view live changes"
                                  >
                                    <span>Jump to Target ↗</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRevertExperiment(exp)}
                                    className="px-1.5 py-0.5 rounded text-[10px] font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer h-6"
                                    title="Revert back to control"
                                  >
                                    <RotateCcw className="w-2.5 h-2.5" />
                                    <span>Revert</span>
                                  </button>
                                </>
                              )}

                              <button
                                type="button"
                                onClick={() => handleApplyExperiment(exp)}
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all flex items-center gap-1 cursor-pointer shadow-2xs h-6 ${
                                  exp.status === 'applied'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                                }`}
                              >
                                <Check className="w-2.5 h-2.5" />
                                <span>{exp.status === 'applied' ? 'Applied to Phase 1' : 'Apply to Phase 1'}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 5: AUDIENCE FEEDBACK PULSE */}
            <div className="space-y-1.5 text-xs pt-0.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <MessageSquare className="w-3 h-3 text-emerald-600" />
                    <span>Live Audience Feedback & Demand Sentiment</span>
                  </h4>
                  <p className="text-[10px] text-slate-500">
                    Real-time qualitative insights gathered from customer discovery surveys and backer checkout notes.
                  </p>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[9px] font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200 font-semibold">
                    {surveyResponses?.length || 0} Discovery Feedback Recorded
                  </span>

                  <button
                    type="button"
                    onClick={() => copyToClipboard(`${origin}/survey/${productSlug}`, 'survey_link')}
                    className="px-2 py-0.5 rounded-md bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[10px] font-medium transition-colors flex items-center gap-1 cursor-pointer h-6 shadow-2xs"
                    title="Copy shareable survey URL"
                  >
                    {copiedKey === 'survey_link' ? <Check className="w-2.5 h-2.5 text-emerald-600" /> : <Copy className="w-2.5 h-2.5 text-slate-500" />}
                    <span>{copiedKey === 'survey_link' ? 'Copied' : 'Copy Survey Link'}</span>
                  </button>

                  <a
                    href={`${origin}/survey/${productSlug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2 py-0.5 rounded-md bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[10px] font-medium transition-colors flex items-center gap-1 cursor-pointer h-6 shadow-2xs"
                    title="Open live public audience survey"
                  >
                    <span>Open Live Survey</span>
                    <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                  </a>

                  <button
                    type="button"
                    onClick={handleSimulateSurveyResponse}
                    className="px-2 py-0.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer h-6 shadow-2xs"
                    title="Simulate 1 incoming audience survey response"
                  >
                    <Plus className="w-2.5 h-2.5" />
                    <span>+ Simulate</span>
                  </button>

                  {surveyResponses && surveyResponses.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAllSurveyResponses}
                      className="px-1.5 py-0.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 text-[10px] transition-colors cursor-pointer h-6"
                      title="Clear all responses"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              </div>

              {(!surveyResponses || surveyResponses.length === 0) ? (
                <div className="p-3.5 text-center text-slate-500 border border-slate-200/70 rounded-xl space-y-2 bg-slate-50/40">
                  <p className="font-semibold text-xs text-slate-800">No audience discovery responses recorded yet.</p>
                  <p className="text-[10px] text-slate-500 max-w-md mx-auto leading-relaxed">
                    Share your research survey link <span className="font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-[9px]">/survey/{productSlug}</span> with your audience to gather real-time feedback, or simulate a response to view the sentiment engine.
                  </p>
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleSimulateSurveyResponse}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Simulate Discovery Feedback (+1)</span>
                    </button>
                    <a
                      href={`${origin}/survey/${productSlug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[10px] font-semibold transition-colors flex items-center gap-1.5 shadow-2xs"
                    >
                      <span>Take Live Survey</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {surveyResponses.map(res => (
                    <div key={res.id} className="p-2 rounded-lg bg-white border border-slate-200/80 space-y-1 shadow-2xs group">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 text-[11px]">{res.name}</span>
                          <span className="text-[9px] text-slate-500 font-mono">{res.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            Intent: {res.rating || 8}/10
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteSurveyResponse(res.id)}
                            className="text-slate-300 hover:text-rose-600 transition-colors p-0.5 rounded cursor-pointer"
                            title="Delete this feedback response"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>

                      {res.answers && (
                        <div className="space-y-0.5 text-[10px] text-slate-700 bg-slate-50 p-1.5 rounded-md border border-slate-200/80">
                          {Object.entries(res.answers).map(([qKey, ans], aIdx) => (
                            <div key={aIdx} className="leading-relaxed">
                              <strong className="text-slate-600 font-mono">{qKey}:</strong> {ans}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-1 flex justify-end">
              <button
                onClick={() => {
                  const updated = {
                    ...(project || {}),
                    step4Done: true,
                    phase1Step4Done: true,
                    validationOptimized: true,
                    telemetryReviewed: true
                  }
                  if (onUpdateProject) onUpdateProject(prev => ({ ...(prev || {}), ...updated }))
                  if (project?.id) {
                    updateCoLaunchProject(project.id, {
                      step4Done: true,
                      phase1Step4Done: true,
                      validationOptimized: true,
                      telemetryReviewed: true
                    }).catch(e => console.warn(e))
                  }
                  showNotification('Validation metrics reviewed. Ready for Gate Checkpoint.')
                  setActiveStep('gate')
                  onSelectStep?.('gate')
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs h-7"
              >
                <span>Proceed to Step 5: Gate Checkpoint</span>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
              </button>
            </div>
          </div>
        )
      })()}

      {/* STEP 5: VALIDATION GATE */}
      {activeStep === 'gate' && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-6 text-slate-900">
          {/* Prerequisite Check Banner if prior steps are incomplete */}
          {!allPriorStepsDone && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs space-y-2.5 animate-fade-in shadow-2xs">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <Lock className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Validation Gate is Locked: Prerequisite Steps Incomplete</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                The Gate Checkpoint evaluates data, audience feedback, and campaign telemetry from Steps 1–4. You can review each step below, or mark all prerequisites complete to proceed with your MVP decision.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <button
                  onClick={() => handleStepChange('plan')}
                  className={`p-2 rounded-xl text-left text-[11px] font-bold border flex items-center justify-between transition-all cursor-pointer shadow-2xs ${
                    isStep1Done ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-rose-50 border-rose-300 text-rose-900 hover:bg-rose-100'
                  }`}
                >
                  <span className="font-extrabold">1. Plan</span>
                  <span className="font-mono">{isStep1Done ? '✓ Done' : '❌ Required'}</span>
                </button>
                <button
                  onClick={() => handleStepChange('assets')}
                  disabled={!canAccessStep2}
                  className={`p-2 rounded-xl text-left text-[11px] font-bold border flex items-center justify-between transition-all shadow-2xs ${
                    isStep2Done
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900 cursor-pointer'
                      : canAccessStep2
                      ? 'bg-rose-50 border-rose-300 text-rose-900 hover:bg-rose-100 cursor-pointer'
                      : 'opacity-50 bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <span className="font-extrabold">2. Assets</span>
                  <span className="font-mono">{isStep2Done ? '✓ Done' : '❌ Required'}</span>
                </button>
                <button
                  onClick={() => handleStepChange('campaign')}
                  disabled={!canAccessStep3}
                  className={`p-2 rounded-xl text-left text-[11px] font-bold border flex items-center justify-between transition-all shadow-2xs ${
                    isStep3Done
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900 cursor-pointer'
                      : canAccessStep3
                      ? 'bg-rose-50 border-rose-300 text-rose-900 hover:bg-rose-100 cursor-pointer'
                      : 'opacity-50 bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <span className="font-extrabold">3. Campaign</span>
                  <span className="font-mono">{isStep3Done ? '✓ Done' : '❌ Required'}</span>
                </button>
                <button
                  onClick={() => handleStepChange('optimize')}
                  disabled={!canAccessStep4}
                  className={`p-2 rounded-xl text-left text-[11px] font-bold border flex items-center justify-between transition-all shadow-2xs ${
                    isStep4Done
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900 cursor-pointer'
                      : canAccessStep4
                      ? 'bg-rose-50 border-rose-300 text-rose-900 hover:bg-rose-100 cursor-pointer'
                      : 'opacity-50 bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <span className="font-extrabold">4. Optimize</span>
                  <span className="font-mono">{isStep4Done ? '✓ Done' : '❌ Required'}</span>
                </button>
              </div>
              <div className="flex items-center justify-end pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const updated = {
                      ...(project || {}),
                      planLocked: true,
                      phase1Step1Done: true,
                      assetsApproved: true,
                      landingPageApproved: true,
                      phase1Step2Done: true,
                      campaignApproved: true,
                      phase1Step3Done: true,
                      step3Done: true,
                      step4Done: true,
                      phase1Step4Done: true,
                      validationOptimized: true,
                      telemetryReviewed: true
                    }
                    if (onUpdateProject) onUpdateProject(prev => ({ ...(prev || {}), ...updated }))
                    if (project?.id) {
                      updateCoLaunchProject(project.id, {
                        planLocked: true,
                        phase1Step1Done: true,
                        assetsApproved: true,
                        landingPageApproved: true,
                        phase1Step2Done: true,
                        campaignApproved: true,
                        phase1Step3Done: true,
                        step3Done: true,
                        step4Done: true,
                        phase1Step4Done: true,
                        validationOptimized: true,
                        telemetryReviewed: true
                      }).catch(e => console.warn(e))
                    }
                    showNotification('All prerequisite validation steps marked complete.')
                  }}
                  className="px-3 py-1.5 rounded-lg bg-amber-800 hover:bg-amber-900 text-white font-bold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-200" />
                  <span>Mark All 1–4 Prerequisites Complete</span>
                </button>
              </div>
            </div>
          )}

          {/* Gate Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="p-2 rounded-xl bg-slate-900 text-white shadow-xs">
                  <Flag className="w-4 h-4 text-emerald-400" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                  5. Validation Gate Checkpoint
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold tracking-wide uppercase border ${
                  !allPriorStepsDone
                    ? 'bg-slate-100 text-slate-600 border-slate-200'
                    : isGatePassed
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-amber-50 text-amber-900 border-amber-300'
                }`}>
                  Result: {!allPriorStepsDone ? 'LOCKED' : isGatePassed ? 'PASS' : 'TEST AGAIN'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Synthesize campaign telemetry, verify buyer pre-orders, and execute the co-founder venture trajectory decision.
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              <span className={`text-xs font-mono font-bold px-3 py-1.5 rounded-xl border shadow-2xs flex items-center gap-1.5 ${
                !allPriorStepsDone
                  ? 'bg-slate-50 text-slate-500 border-slate-200'
                  : isGatePassed
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-extrabold'
                  : 'bg-amber-50 text-amber-900 border-amber-300 font-bold'
              }`}>
                {isGatePassed ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : !allPriorStepsDone ? <Lock className="w-3.5 h-3.5 text-slate-400" /> : <Clock className="w-3.5 h-3.5 text-amber-600" />}
                <span>Gate Status: {!allPriorStepsDone ? 'LOCKED (Prerequisites Required)' : isGatePassed ? 'PASS (Ready for MVP Build)' : `${presaleTarget > 0 ? Math.round((presalesRevenue/presaleTarget)*100) : 0}% of Goal`}</span>
              </span>
            </div>
          </div>

          {/* Milestone Target Progress Bar */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-slate-500" />
                <span>Validation Revenue Threshold</span>
              </span>
              <span className="font-extrabold text-slate-900">
                ${presalesRevenue.toLocaleString()}{' '}
                <span className="text-slate-400 font-normal">
                  / ${presaleTarget.toLocaleString()} target ({presaleTarget > 0 ? Math.min(100, Math.round((presalesRevenue/presaleTarget)*100)) : 0}%)
                </span>
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden p-0.5">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  isGatePassed
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                    : 'bg-gradient-to-r from-amber-500 to-emerald-500'
                }`}
                style={{ width: `${Math.max(2, Math.min(100, presaleTarget > 0 ? Math.round((presalesRevenue/presaleTarget)*100) : 0))}%` }}
              />
            </div>
          </div>

          {/* Executive Telemetry Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-1.5 shadow-2xs hover:border-slate-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase font-mono tracking-wider">Goal</span>
                <Target className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <span className="text-lg font-extrabold text-slate-900 block font-display">${presaleTarget.toLocaleString()}</span>
              <span className="text-[11px] text-slate-500 font-medium block">14-day sprint target</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-1.5 shadow-2xs hover:border-slate-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase font-mono tracking-wider">Actual</span>
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <span className={`text-lg font-extrabold block font-display ${presalesRevenue > 0 ? 'text-emerald-700' : 'text-slate-900'}`}>
                ${presalesRevenue.toLocaleString()}
              </span>
              <span className="text-[11px] text-slate-500 font-medium block">
                {reservations.length} paying backer{reservations.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-1.5 shadow-2xs hover:border-slate-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase font-mono tracking-wider">Conversion</span>
                <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
              </div>
              <span className="text-lg font-extrabold text-slate-900 block font-display">{dynamicConversionRate.toFixed(1)}%</span>
              <span className="text-[11px] text-slate-500 font-medium block">Traffic-to-presale</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-1.5 shadow-2xs hover:border-slate-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase font-mono tracking-wider">Result</span>
                {isGatePassed ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : !allPriorStepsDone ? (
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <Award className="w-3.5 h-3.5 text-amber-600" />
                )}
              </div>
              <span className={`text-lg font-extrabold block font-display ${
                isGatePassed ? 'text-emerald-700' : !allPriorStepsDone ? 'text-slate-500' : 'text-amber-700'
              }`}>
                {!allPriorStepsDone ? 'LOCKED' : isGatePassed ? 'PASS' : 'IN PROGRESS'}
              </span>
              <span className="text-[11px] text-slate-500 font-medium block">
                {!allPriorStepsDone ? 'Prerequisites required' : isGatePassed ? 'Demand verified' : 'Awaiting target'}
              </span>
            </div>
          </div>

          {/* Strategic Recommendation Panel */}
          <div className={`p-4 rounded-xl border flex items-start gap-3 text-xs leading-relaxed shadow-2xs ${
            isGatePassed
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
              : !allPriorStepsDone
              ? 'bg-slate-50 border-slate-200 text-slate-700'
              : 'bg-amber-50/80 border-amber-200 text-amber-950'
          }`}>
            <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
              isGatePassed ? 'bg-emerald-100 text-emerald-800' : !allPriorStepsDone ? 'bg-slate-200 text-slate-700' : 'bg-amber-100 text-amber-900'
            }`}>
              {isGatePassed ? <CheckCircle2 className="w-4 h-4" /> : !allPriorStepsDone ? <Lock className="w-4 h-4" /> : <Flame className="w-4 h-4" />}
            </div>
            <div className="space-y-1">
              <strong className="font-bold block text-slate-900">
                {!allPriorStepsDone
                  ? 'Validation Prerequisites Incomplete'
                  : isGatePassed
                  ? 'Validation Target Achieved — Greenlight Ready'
                  : 'Validation in Progress — Awaiting Target Revenue'}
              </strong>
              <p className="text-slate-600 text-xs">
                {!allPriorStepsDone
                  ? 'The Gate Checkpoint evaluates evidence gathered across the validation lifecycle. Please complete the plan, asset review, creator campaign sprint, and optimization steps before making a final gate decision.'
                  : isGatePassed
                  ? `The willingness-to-pay threshold of $${presaleTarget.toLocaleString()} was achieved with verified audience demand and a ${dynamicConversionRate.toFixed(1)}% conversion rate. You are ready to advance to Phase 2: Build MVP.`
                  : `Collected $${presalesRevenue.toLocaleString()} across ${reservations.length} reservations toward the $${presaleTarget.toLocaleString()} goal. You can test additional messaging/pricing experiments in Step 4, or make an executive decision below.`}
              </p>
            </div>
          </div>

          {/* Co-Founder Decision Controls */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-900">Co-Founder Executive Decision</span>
              </div>
              <span className="text-[11px] font-mono text-slate-500">Choose one path to progress</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {/* Option 1: Build MVP */}
              <button
                disabled={isAdvancingPhase || isIteratingGate || isArchivingProject}
                onClick={async () => {
                  if (isAdvancingPhase) return
                  setIsAdvancingPhase(true)
                  try {
                    const notes = `Validation target passed with $${presalesRevenue.toLocaleString()} presales and ${reservations.length} backers.`
                    const decisionItem = {
                      id: `gate_${Date.now()}`,
                      decision: 'pass_to_phase2',
                      targetRevenue: presaleTarget,
                      achievedRevenue: presalesRevenue,
                      backersCount: reservations.length,
                      conversionRate: Number(dynamicConversionRate.toFixed(1)),
                      gateStatus: 'passed',
                      notes: notes,
                      decidedAt: new Date().toLocaleString()
                    }
                    const updated = {
                      ...(project || {}),
                      currentPhase: 2,
                      current_phase: 2,
                      currentStep: 'plan',
                      current_step: 'plan',
                      p1Complete: true,
                      phase1Passed: true,
                      step4Done: true,
                      step5Done: true,
                      status: 'building',
                      gateDecisions: [decisionItem, ...(project?.gateDecisions || [])],
                      decisions: [decisionItem, ...(project?.decisions || [])]
                    }
                    if (onUpdateProject) onUpdateProject(prev => ({ ...(prev || {}), ...updated }))

                    if (project?.id) {
                      try {
                        await recordGateDecision(project.id, { decision: 'pass_to_phase2', notes })
                        await updateCoLaunchProject(project.id, {
                          currentPhase: 2,
                          current_phase: 2,
                          currentStep: 'plan',
                          current_step: 'plan',
                          p1Complete: true,
                          phase1Passed: true,
                          step4Done: true,
                          step5Done: true,
                          status: 'building'
                        })
                      } catch (e) {
                        console.warn('[Phase1] DB gate decision warning:', e)
                      }
                    }
                    showNotification('Validation Gate Passed! Advancing to Phase 2: Build MVP.')
                    onAdvanceToPhase2?.()
                  } finally {
                    setIsAdvancingPhase(false)
                  }
                }}
                className={`py-2 px-3 rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-0.5 shadow-2xs transition-all border cursor-pointer ${
                  isAdvancingPhase
                    ? 'bg-emerald-700 text-white cursor-wait border-emerald-600'
                    : isGatePassed
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white active:scale-98 border-emerald-500 shadow-emerald-950/20'
                    : 'bg-slate-900 hover:bg-slate-800 text-white active:scale-98 border-slate-900'
                }`}
                title="Advance to Phase 2 Sprints"
              >
                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                  {isAdvancingPhase ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white shrink-0" />
                  ) : (
                    <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${isGatePassed ? 'text-white' : 'text-emerald-400'}`} />
                  )}
                  <span className="font-extrabold text-white text-xs whitespace-nowrap">
                    {isAdvancingPhase ? 'Advancing to Phase 2...' : isGatePassed ? 'Build MVP (PASS)' : 'Build MVP (Advance to Phase 2)'}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-extrabold uppercase tracking-wide whitespace-nowrap shrink-0 ${
                    isGatePassed ? 'bg-white/20 text-white' : 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/30'
                  }`}>
                    {isGatePassed ? 'RECOMMENDED' : 'PASS & ADVANCE'}
                  </span>
                </div>
                <span className="text-[10px] font-normal text-slate-300 text-center leading-tight">
                  {isAdvancingPhase
                    ? 'Setting up Phase 2 Engineering Workspace...'
                    : 'Advance to Phase 2 Sprints & Mark Phase 1 Done'}
                </span>
              </button>

              {/* Option 2: Test Again */}
              <button
                disabled={isAdvancingPhase || isIteratingGate || isArchivingProject}
                onClick={async () => {
                  if (isIteratingGate) return
                  setIsIteratingGate(true)
                  try {
                    const notes = 'Resetting validation sprint for new optimization iteration.'
                    const decisionItem = {
                      id: `gate_${Date.now()}`,
                      decision: 'iterate_validation',
                      targetRevenue: presaleTarget,
                      achievedRevenue: presalesRevenue,
                      backersCount: reservations.length,
                      conversionRate: Number(dynamicConversionRate.toFixed(1)),
                      gateStatus: 'iterating',
                      notes: notes,
                      decidedAt: new Date().toLocaleString()
                    }
                    const updated = {
                      ...(project || {}),
                      currentPhase: 1,
                      status: 'validating',
                      gateDecisions: [decisionItem, ...(project?.gateDecisions || [])],
                      decisions: [decisionItem, ...(project?.decisions || [])]
                    }
                    if (onUpdateProject) onUpdateProject(prev => ({ ...(prev || {}), ...updated }))

                    if (project?.id) {
                      await recordGateDecision(project.id, { decision: 'iterate_validation', notes }).catch(e => console.warn(e))
                    }
                    showNotification('Validation sprint reset for new iteration with fresh experiments.')
                    handleStepChange('optimize')
                  } finally {
                    setIsIteratingGate(false)
                  }
                }}
                className="py-2 px-3 rounded-xl bg-white hover:bg-amber-50 text-slate-900 border border-amber-300 hover:border-amber-400 shadow-2xs font-bold text-xs flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                  {isIteratingGate ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600 shrink-0" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  )}
                  <span className="font-extrabold text-slate-900 text-xs whitespace-nowrap">
                    {isIteratingGate ? 'Resetting Sprint...' : 'Test Again (Iterate)'}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200 text-[8.5px] font-extrabold uppercase tracking-wide whitespace-nowrap shrink-0">
                    {!isGatePassed ? 'RECOMMENDED' : 'ITERATE'}
                  </span>
                </div>
                <span className="text-[10px] font-normal text-slate-600 text-center leading-tight">
                  {isIteratingGate ? 'Preparing fresh experiments...' : 'Run fresh messaging/pricing'}
                </span>
              </button>

              {/* Option 3: Kill Project */}
              <button
                disabled={isAdvancingPhase || isIteratingGate || isArchivingProject}
                onClick={async () => {
                  if (isArchivingProject) return
                  if (window.confirm('Are you sure you want to kill and archive this venture?\n\nThis will:\n1. Stop all validation and marketing outreach\n2. Mark venture status as "Killed" and archive it\n3. Initiate refund protocol for backers who reserved/pre-ordered')) {
                    setIsArchivingProject(true)
                    try {
                      const notes = 'Project failed validation gate threshold. Venture archived and backer refunds initiated.'
                      const decisionItem = {
                        id: `gate_${Date.now()}`,
                        decision: 'kill_project',
                        targetRevenue: presaleTarget,
                        achievedRevenue: presalesRevenue,
                        backersCount: reservations.length,
                        conversionRate: Number(dynamicConversionRate.toFixed(1)),
                        gateStatus: 'killed',
                        notes: notes,
                        decidedAt: new Date().toLocaleString()
                      }
                      const updated = {
                        ...(project || {}),
                        status: 'killed',
                        gateDecisions: [decisionItem, ...(project?.gateDecisions || [])],
                        decisions: [decisionItem, ...(project?.decisions || [])]
                      }
                      if (onUpdateProject) onUpdateProject(prev => ({ ...(prev || {}), ...updated }))

                      if (project?.id) {
                        await recordGateDecision(project.id, { decision: 'kill_project', notes }).catch(e => console.warn(e))
                        await updateCoLaunchProject(project.id, { status: 'killed' }).catch(e => console.warn(e))
                      }
                      showNotification('Project archived and backer refund protocol logged.')
                    } finally {
                      setIsArchivingProject(false)
                    }
                  }
                }}
                className="py-2 px-3 rounded-xl bg-white hover:bg-rose-50 text-slate-900 border border-rose-300 hover:border-rose-400 shadow-2xs font-bold text-xs flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                  {isArchivingProject ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600 shrink-0" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  )}
                  <span className="font-extrabold text-slate-900 text-xs whitespace-nowrap">
                    {isArchivingProject ? 'Archiving Venture...' : 'Kill (Archive)'}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200 text-[8.5px] font-extrabold uppercase tracking-wide whitespace-nowrap shrink-0">
                    ARCHIVE
                  </span>
                </div>
                <span className="text-[10px] font-normal text-slate-600 text-center leading-tight">
                  {isArchivingProject ? 'Logging audit & refund logs...' : 'Wind down & refund backers'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AUDIENCE DATA GROUNDING & PROVENANCE CITATIONS MODAL */}
      <AudienceGroundingModal
        isOpen={showAudienceIntelModal}
        onClose={() => setShowAudienceIntelModal(false)}
        project={project}
        initialTab={audienceIntelModalTab}
      />
    </div>
  )
}
