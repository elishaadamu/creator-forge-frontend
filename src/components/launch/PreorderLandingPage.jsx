import { useState, useEffect } from 'react'
import {
  Sparkles, CheckCircle2, ShieldCheck, CreditCard, ArrowRight,
  Zap, Star, Lock, Users, Globe, ExternalLink, HelpCircle, Check,
  Loader2, AlertCircle, RefreshCw, Layers, Award, Target, CheckCircle
} from 'lucide-react'
import ProductMockupDisplay from './ProductMockupDisplay'
import { trackVisit } from '../../services/tracker'
import { updatePageSEO } from '../../utils/seo'
import {
  parseMainPricingAmount,
  parseDepositPricingAmount,
  sanitizePricingConfig,
  parseConceptPricing
} from '../../utils/pricing'
import { PreorderLandingSkeleton } from './Section2Skeletons'

export default function PreorderLandingPage({ slug }) {
  const [isLoading, setIsLoading] = useState(true)
  const [project, setProject] = useState(null)
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('stripe') // 'stripe' | 'paypal'

  // Dynamic Selected Concept & Pricing Extraction
  const selectedConcept = project?.selectedConcept || (
    Array.isArray(project?.concepts)
      ? project.concepts.find(c => c.selected) || project.concepts[0]
      : null
  )

  const productName = project?.productName || selectedConcept?.name || 'TacticianAI'
  const creatorName = project?.creatorName || 'PotatoMcWhiskey'
  const creatorAvatar = project?.creatorAvatar || selectedConcept?.creatorAvatar || null
  const creatorHandle = project?.creatorHandle || 'PotatoMcWhiskey'
  const niche = project?.niche || selectedConcept?.demographicAlignment || 'Competitive Strategy Gaming'
  const tagline = project?.productTagline || selectedConcept?.tagline || 'Personalized strategy co-pilot for high-level tactical execution.'
  const headline = project?.campaignKit?.landingPageCopy?.headline || `The ${productName} Workspace Built with ${creatorName}`
  const subheadline = project?.campaignKit?.landingPageCopy?.subheadline || selectedConcept?.description || tagline

  const targetAudience = selectedConcept?.customer || project?.targetAudience || project?.customer || 'Ambitious ranked-play ladder climbers'
  const problemSolved = selectedConcept?.problem || project?.problem || 'Lack of personalized feedback on individual playstyle; general tutorials are too broad.'
  const keyFeatures = (Array.isArray(selectedConcept?.keyFeatures) && selectedConcept.keyFeatures.length > 0)
    ? selectedConcept.keyFeatures
    : (Array.isArray(project?.keyFeatures) && project.keyFeatures.length > 0)
      ? project.keyFeatures
      : ['VOD review AI agent', 'Tactical decision scoring', 'Voice-activated strategy lookup', 'Playstyle optimization reports']

  const conceptPricing = selectedConcept?.pricing || project?.pricing || '$27/mo Pro • $69/mo Copilot Tier'

  const cfg = project?.campaignKit?.pricingConfig || project?.pricingConfig || project?.validationCampaign?.productAssets?.pricingConfig
  const sanitizedPricing = sanitizePricingConfig(cfg, conceptPricing)
  const foundingPrice = sanitizedPricing.foundingPrice || 138
  const depositPrice = sanitizedPricing.depositPrice || Math.max(9, Math.round(foundingPrice * 0.2))
  const perksText = cfg?.perks || `50% Lifetime Price Lock ($${foundingPrice}/yr) & VIP Alpha Perks`

  // Build Comprehensive List of Selectable Tiers
  const parsedConcept = parseConceptPricing(conceptPricing, foundingPrice)
  const availableTiers = [
    ...(parsedConcept.tiers || []).map(t => ({
      id: `tier_${t.price}`,
      name: t.name,
      price: t.price,
      period: t.period === 'month' ? '/mo' : t.period === 'annual' ? '/yr' : '',
      deposit: false,
      badge: t.price >= 50 ? 'POPULAR TIER' : 'STARTER',
      highlight: false
    })),
    {
      id: 'tier_founding_annual',
      name: `Founding Annual Pass ($${foundingPrice}/yr)`,
      price: foundingPrice,
      period: '/yr',
      deposit: false,
      badge: '50% LIFETIME PRICE LOCK',
      highlight: true
    },
    {
      id: 'tier_deposit',
      name: `VIP Reservation Deposit ($${depositPrice})`,
      price: depositPrice,
      period: 'refundable',
      deposit: true,
      badge: '100% REFUNDABLE GUARANTEE',
      highlight: false
    }
  ]

  const [selectedTier, setSelectedTier] = useState({
    name: `Founding Annual Pass ($${foundingPrice})`,
    price: foundingPrice,
    deposit: false
  })

  useEffect(() => {
    const title = productName
      ? `VIP Early Access — ${productName} | Co-Built with ${creatorName}`
      : "VIP Early Access & Pre-Order | Creator Forge";
    updatePageSEO({
      title,
      description: tagline || "Lock in founder pricing and early access to our exclusive software tool.",
      image: "/og-image.svg"
    });
  }, [productName, creatorName, tagline]);

  // Synchronize default selected tier with dynamic founding/deposit pricing
  useEffect(() => {
    setSelectedTier(prev => {
      if (prev.deposit) {
        return { name: `VIP Deposit ($${depositPrice})`, price: depositPrice, deposit: true }
      }
      if (prev.price === foundingPrice) {
        return { name: `Founding Annual Pass ($${foundingPrice})`, price: foundingPrice, deposit: false }
      }
      return prev
    })
  }, [foundingPrice, depositPrice])

  // Payer Details (Required)
  const [buyerName, setBuyerName] = useState('')
  const [buyerEmail, setBuyerEmail] = useState('')
  
  // Stripe Card Details
  const [cardNumber, setCardNumber] = useState('')
  const [cardExp, setCardExp] = useState('')
  const [cardCvc, setCardCvc] = useState('')
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStep, setProcessingStep] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const [successReceipt, setSuccessReceipt] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let isMounted = true

    const loadDbProject = async () => {
      setIsLoading(true)
      try {
        const { getProjectBySlug, getCoLaunchProjects } = await import('../../services/opsApi')
        let dbProj = null
        if (slug) {
          try {
            dbProj = await getProjectBySlug(slug)
          } catch (e) {
            console.warn('[Preorder] Direct slug lookup notice:', e)
          }
        }
        if (!dbProj) {
          try {
            const all = await getCoLaunchProjects()
            const list = Array.isArray(all) ? all : all?.projects || []
            if (slug) {
              const clean = slug.toLowerCase().replace(/[^a-z0-9]/g, '')
              dbProj = list.find(p => {
                const pSlug = (p.slug || '').toLowerCase().replace(/[^a-z0-9]/g, '')
                const pName = (p.productName || p.title || p.product_name || '').toLowerCase().replace(/[^a-z0-9]/g, '')
                const pHandle = (p.creatorHandle || p.creator_handle || '').toLowerCase().replace(/[^a-z0-9]/g, '')
                const pId = (p.id || '').toLowerCase()
                return pSlug === clean || pName === clean || pHandle === clean || pId === slug.toLowerCase()
              })
            }
            if (!dbProj && list.length > 0) {
              dbProj = list[0]
            }
          } catch (e) {
            console.warn('[Preorder] Projects list fallback notice:', e)
          }
        }

        if (isMounted && dbProj) {
          setProject(dbProj)
        }
      } catch (err) {
        console.warn('[Preorder] Failed to load project from MongoDB Atlas:', err)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadDbProject()

    // Visitor telemetry tracking
    trackVisit(`/preorder/${slug || 'product'}`, visitorTelemetry => {
      if (isMounted && visitorTelemetry) {
        setProject(prev => prev ? ({
          ...prev,
          visitors: visitorTelemetry.visitors ?? prev.visitors,
          uniqueVisitors: visitorTelemetry.uniqueVisitors ?? prev.uniqueVisitors,
          conversionRate: visitorTelemetry.conversionRate ?? prev.conversionRate,
          channelAttribution: visitorTelemetry.channelAttribution ?? prev.channelAttribution
        }) : prev)
      }
    })

    const handleSync = (e) => {
      if (e?.detail && (e.detail.productName || e.detail.id || e.detail.selectedConcept)) {
        setProject(e.detail)
      }
    }

    window.addEventListener('forge_project_updated', handleSync)
    return () => {
      isMounted = false
      window.removeEventListener('forge_project_updated', handleSync)
    }
  }, [slug])

  if (isLoading && !project) {
    return <PreorderLandingSkeleton slug={slug} />
  }

  const handleCheckoutSubmit = async (e) => {
    e?.preventDefault()
    setErrorMessage('')

    if (!buyerName.trim()) {
      setErrorMessage('Please enter your full name.')
      return
    }
    if (!buyerEmail.trim() || !buyerEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.')
      return
    }

    setIsProcessing(true)
    setProcessingStep('Authorizing secure transaction...')

    try {
      // 1. Handshake & payment verification simulation
      await new Promise(r => setTimeout(r, 600))
      setProcessingStep('Securing reservation & recording payment on database...')

      const txId = paymentMethod === 'stripe' 
        ? `tx_stripe_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`
        : `tx_paypal_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`

      const urlParams = new URLSearchParams(window.location.search)
      const refQuery = (urlParams.get('ref') || urlParams.get('utm_source') || urlParams.get('utm') || urlParams.get('source') || urlParams.get('channel') || '').toLowerCase()
      let attributedChannel = 'Direct / Other'
      if (refQuery.includes('instagram') || refQuery.includes('ig') || refQuery.includes('story') || refQuery.includes('insta')) {
        attributedChannel = 'Instagram Stories'
      } else if (refQuery.includes('tiktok') || refQuery.includes('reels') || refQuery.includes('shorts') || refQuery.includes('youtube') || refQuery.includes('yt')) {
        attributedChannel = 'TikTok / Shorts'
      } else if (refQuery.includes('twitter') || refQuery.includes('x_post') || refQuery.includes('tweet') || refQuery.includes('x')) {
        attributedChannel = 'X Post'
      } else if (refQuery.includes('newsletter') || refQuery.includes('email') || refQuery.includes('broadcast') || refQuery.includes('mail')) {
        attributedChannel = 'Email Newsletter'
      } else if (refQuery.includes('dm') || refQuery.includes('outreach')) {
        attributedChannel = 'Direct Messages'
      }

      const activeExpVariant = project?.campaignKit?.pricingConfig?.activeExperimentTitle || project?.campaignKit?.landingPageCopy?.activeExperimentTitle || null

      const newReservation = {
        id: `res-${Date.now()}`,
        name: buyerName.trim(),
        email: buyerEmail.trim(),
        amount: selectedTier.price,
        tier: selectedTier.name,
        paymentMethod: paymentMethod === 'stripe' ? 'Stripe' : 'PayPal',
        channel: attributedChannel,
        txId: txId,
        date: 'Just now',
        timestamp: Date.now(),
        status: 'Paid',
        experimentVariant: activeExpVariant
      }

      // Optimistic Local State Sync
      const current = project || {}
      const existingReservations = Array.isArray(current.reservations) ? current.reservations : []
      const nextReservations = [newReservation, ...existingReservations]
      const nextTotalRevenue = nextReservations.reduce((acc, r) => acc + (Number(r.amount) || 0), 0)
      const totalUniqueVisitors = Number(current.visitors || 1)
      const nextConversionRate = totalUniqueVisitors > 0 ? ((nextReservations.length / totalUniqueVisitors) * 100).toFixed(1) : 0

      const updated = {
        ...current,
        reservations: nextReservations,
        currentPresales: nextTotalRevenue,
        conversionRate: Number(nextConversionRate)
      }

      setProject(updated)
      window.dispatchEvent(new CustomEvent('forge_project_updated', { detail: updated }))

      // 2. Real API Persistence Call to DB
      setProcessingStep('Provisioning private access token & syncing project...')
      const { recordPreorderUniversal } = await import('../../services/opsApi')
      const dbResult = await recordPreorderUniversal({
        projectId: project?.id,
        slug: slug,
        creatorHandle: project?.creatorHandle,
        name: buyerName.trim(),
        email: buyerEmail.trim(),
        amount: selectedTier.price,
        tier: selectedTier.name,
        paymentMethod: paymentMethod === 'stripe' ? 'Stripe' : 'PayPal',
        channel: attributedChannel,
        txId: txId,
        experimentVariant: activeExpVariant
      })

      if (dbResult) {
        setProject(dbResult)
        window.dispatchEvent(new CustomEvent('forge_project_updated', { detail: dbResult }))
      }

      const receipt = {
        txId,
        name: buyerName.trim(),
        email: buyerEmail.trim(),
        amount: selectedTier.price,
        tier: selectedTier.name,
        paymentMethod: paymentMethod === 'stripe' ? 'Stripe (Credit / Debit Card)' : 'PayPal Express',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        status: 'Paid & Confirmed'
      }

      setSuccessReceipt(receipt)
      setIsSuccess(true)
    } catch (err) {
      console.warn('[Preorder] Payment API warning:', err)
      setErrorMessage(err.message || 'Payment processing failed. Please check your details and try again.')
    } finally {
      setIsProcessing(false)
      setProcessingStep('')
    }
  }

  const openCheckout = (tier) => {
    setSelectedTier(tier)
    setIsSuccess(false)
    setSuccessReceipt(null)
    setErrorMessage('')
    setCheckoutModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-[#080A0C] text-[#F5F3EA] selection:bg-[#C8FF3D] selection:text-[#080A0C] font-sans antialiased overflow-x-hidden relative">
      {/* Top Dynamic API Loading Indicator Bar */}
      {isLoading && (
        <div className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-gradient-to-r from-[#C8FF3D] via-[#78E08F] to-[#C8FF3D] animate-pulse shadow-sm" />
      )}

      {/* Floating Backend Sync Status Pill */}
      {isLoading && (
        <div className="fixed top-4 right-4 z-[9999] flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#101419]/90 border border-[#C8FF3D]/40 backdrop-blur-md shadow-lg shadow-black/50 text-xs font-mono text-[#C8FF3D] animate-pulse">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C8FF3D]" />
          <span>Syncing backend data...</span>
        </div>
      )}

      {/* Top Launch Notification Banner */}
      <div className="bg-[#0D1014] border-b border-[#252B32] py-2.5 px-3 sm:px-4 text-center text-xs">
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 font-medium flex-wrap">
          <span className="w-2 h-2 rounded-full bg-[#78E08F] animate-pulse shrink-0" />
          <span className="text-[#969DA6]">Exclusive Co-Founder Early Launch by</span>
          <span className="text-[#F5F3EA] font-semibold">{creatorName}</span>
          <span className="bg-[#C8FF3D]/10 text-[#C8FF3D] border border-[#C8FF3D]/25 px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider shrink-0">
            50% Off Lifetime Tier
          </span>
        </div>
      </div>

      {/* Navigation Bar */}
      <header className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          {creatorAvatar ? (
            <img
              src={creatorAvatar}
              alt={creatorName}
              className="w-8 sm:w-9 h-8 sm:h-9 rounded-xl object-cover border border-[#252B32] shrink-0"
            />
          ) : (
            <div className="w-8 sm:w-9 h-8 sm:h-9 rounded-xl bg-[#171C22] border border-[#252B32] flex items-center justify-center text-[#C8FF3D] font-display font-black text-xs sm:text-sm shadow-sm shrink-0">
              {productName.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <span className="font-display font-bold text-[#F5F3EA] text-sm sm:text-base tracking-tight block truncate">{productName}</span>
            <span className="text-[10px] text-[#969DA6] font-mono truncate block">co-built with @{creatorHandle}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => openCheckout({ name: `Founding Annual Pass ($${foundingPrice})`, price: foundingPrice, deposit: false })}
            className="px-3.5 sm:px-4 py-2 rounded-xl bg-[#C8FF3D] hover:bg-[#d8ff66] text-[#080A0C] font-bold text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Claim Access</span>
            <span>(${foundingPrice})</span>
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto px-6 pt-10 pb-24 text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#101419] border border-[#252B32] text-[#C8FF3D] text-xs font-mono font-bold tracking-wider uppercase">
          <Sparkles className="w-3.5 h-3.5 text-[#C8FF3D]" />
          <span>Co-Created with {creatorName}’s Community</span>
        </div>

        <h1 className="font-display text-3xl sm:text-5xl md:text-6xl font-black text-[#F5F3EA] tracking-tight leading-[1.12]">
          {headline}
        </h1>

        <p className="text-base sm:text-lg text-[#969DA6] max-w-2xl mx-auto leading-relaxed">
          {subheadline}
        </p>

        {/* Action Buttons */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <button
              onClick={() => openCheckout({ name: `Founding Annual Pass ($${foundingPrice})`, price: foundingPrice, deposit: false })}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-[#C8FF3D] hover:bg-[#d8ff66] text-[#080A0C] font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#C8FF3D]/10 transition-all active:scale-95 cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              <span>Claim Founding Access (${foundingPrice})</span>
            </button>

            <button
              onClick={() => openCheckout({ name: `VIP Deposit ($${depositPrice})`, price: depositPrice, deposit: true })}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#101419] hover:bg-[#171C22] text-[#F5F3EA] border border-[#252B32] font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-[#78E08F]" />
              <span>Reserve with ${depositPrice} Deposit</span>
            </button>
          </div>

          {/* Perks Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-[#969DA6] pt-2">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#78E08F]" />
              <span>100% Refundable Guarantee</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#78E08F]" />
              <span>{perksText}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#78E08F]" />
              <span>Direct Co-Founder Access</span>
            </div>
          </div>
        </div>

        {/* Visual Designed Mockup Showcase (Full, Non-Editable UI Frame) */}
        <div className="pt-6">
          <ProductMockupDisplay project={project} theme="lime" />
        </div>

        {/* Creator's Approved Blueprint Spotlight Card */}
        <div className="pt-6 text-left">
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-[#101419] to-[#0A0D10] border border-[#252B32] relative overflow-hidden shadow-2xl space-y-6">
            {/* Top Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#252B32] pb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#171C22] border border-[#C8FF3D]/30 flex items-center justify-center text-[#C8FF3D] font-bold">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#C8FF3D] font-bold">
                      Creator's Selected Co-Launch Concept
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[#78E08F]/10 border border-[#78E08F]/30 text-[#78E08F] text-[9px] font-mono font-bold">
                      Verified
                    </span>
                  </div>
                  <h2 className="text-xl font-display font-black text-[#F5F3EA] mt-0.5">{productName}</h2>
                </div>
              </div>

              <div className="px-3.5 py-1.5 rounded-xl bg-[#171C22] border border-[#252B32] text-xs font-mono text-[#F5F3EA]">
                <span className="text-[#969DA6] mr-1.5">Model:</span>
                <span className="text-[#C8FF3D] font-bold">{conceptPricing}</span>
              </div>
            </div>

            {/* Target Audience & Core Problem Solved Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-[#080A0C] border border-[#252B32] space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono text-[#78E08F] font-bold uppercase tracking-wider">
                  <Target className="w-3.5 h-3.5" />
                  <span>Target Audience & Demographic</span>
                </div>
                <p className="text-xs text-[#F5F3EA] leading-relaxed font-medium">
                  {targetAudience}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#080A0C] border border-[#252B32] space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono text-[#C8FF3D] font-bold uppercase tracking-wider">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Core Problem Solved</span>
                </div>
                <p className="text-xs text-[#F5F3EA] leading-relaxed font-medium">
                  {problemSolved}
                </p>
              </div>
            </div>

            {/* Built-in Features */}
            <div className="space-y-3">
              <span className="text-xs font-mono text-[#969DA6] uppercase tracking-wider block font-bold">
                Built-in Software Capabilities
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {keyFeatures.map((feat, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-[#080A0C] border border-[#252B32] flex items-center gap-2.5 text-xs text-[#F5F3EA]"
                  >
                    <CheckCircle className="w-4 h-4 text-[#78E08F] shrink-0" />
                    <span className="font-medium">{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Tiers & Reservation Selector */}
        <div className="pt-10 text-left space-y-6">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-display font-black text-[#F5F3EA]">
              Choose Your Reservation Tier
            </h2>
            <p className="text-xs sm:text-sm text-[#969DA6]">
              Lock in guaranteed founder pricing for {productName} before public release.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            {availableTiers.map((t, idx) => {
              const isSelected = selectedTier.name.includes(String(t.price)) || (t.deposit && selectedTier.deposit)
              return (
                <div
                  key={idx}
                  onClick={() => openCheckout({ name: t.name, price: t.price, deposit: t.deposit })}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden group ${
                    isSelected || t.highlight
                      ? 'bg-gradient-to-b from-[#14181E] to-[#101419] border-[#C8FF3D] shadow-lg shadow-[#C8FF3D]/10'
                      : 'bg-[#101419] border-[#252B32] hover:border-[#78E08F]/50'
                  }`}
                >
                  {/* Top Badge */}
                  <div className="flex items-center justify-between gap-2 pb-3">
                    <span className={`text-[9px] font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                      t.highlight
                        ? 'bg-[#C8FF3D]/15 text-[#C8FF3D] border-[#C8FF3D]/30'
                        : 'bg-[#171C22] text-[#969DA6] border-[#252B32]'
                    }`}>
                      {t.badge}
                    </span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-[#C8FF3D] animate-ping shrink-0" />
                    )}
                  </div>

                  <div className="space-y-1.5 my-2">
                    <h3 className="text-sm font-bold text-[#F5F3EA]">{t.name}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl sm:text-3xl font-black font-display text-[#F5F3EA]">${t.price}</span>
                      {t.period && <span className="text-xs text-[#969DA6] font-mono">{t.period}</span>}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      openCheckout({ name: t.name, price: t.price, deposit: t.deposit })
                    }}
                    className={`w-full mt-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      t.highlight || isSelected
                        ? 'bg-[#C8FF3D] hover:bg-[#d8ff66] text-[#080A0C] shadow-md'
                        : 'bg-[#171C22] hover:bg-[#252B32] text-[#F5F3EA] border border-[#252B32]'
                    }`}
                  >
                    <span>Pre-Order (${t.price})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Value Pillars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-12 text-left">
          <div className="p-6 rounded-2xl bg-[#101419] border border-[#252B32] hover:border-[#C8FF3D]/40 space-y-2.5 transition-all">
            <div className="w-9 h-9 rounded-xl bg-[#171C22] border border-[#252B32] flex items-center justify-center text-[#C8FF3D]">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-[#F5F3EA]">Built for Your Workflow</h3>
            <p className="text-xs text-[#969DA6] leading-relaxed">
              Designed specifically around the exact bottlenecks faced by {creatorName}’s audience in {niche}.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#101419] border border-[#252B32] hover:border-[#78E08F]/40 space-y-2.5 transition-all">
            <div className="w-9 h-9 rounded-xl bg-[#171C22] border border-[#252B32] flex items-center justify-center text-[#78E08F]">
              <Star className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-[#F5F3EA]">Lifetime Founder Perks</h3>
            <p className="text-xs text-[#969DA6] leading-relaxed">
              Lock in 50% lifetime pricing (${foundingPrice > 0 ? `$${foundingPrice}/yr` : 'exclusive founder rate'}) and priority feature requests forever on day one.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#101419] border border-[#252B32] hover:border-[#C8FF3D]/40 space-y-2.5 transition-all">
            <div className="w-9 h-9 rounded-xl bg-[#171C22] border border-[#252B32] flex items-center justify-center text-[#C8FF3D]">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-[#F5F3EA]">Direct Co-Founder Line</h3>
            <p className="text-xs text-[#969DA6] leading-relaxed">
              Join the private VIP Slack & direct alpha advisory channels with {creatorName} & Creator Forge.
            </p>
          </div>
        </div>
      </main>

      {/* Checkout Modal (Stripe & PayPal Options) */}
      {checkoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="max-w-md w-full max-h-[90vh] flex flex-col p-5 sm:p-6 rounded-3xl bg-[#101419] border border-[#252B32] shadow-2xl animate-fade-in text-left my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#252B32] pb-3 shrink-0">
              <div>
                <h3 className="text-sm font-bold text-[#F5F3EA]">Complete Pre-Order Reservation</h3>
                <p className="text-[11px] text-[#969DA6]">{selectedTier.name} — ${selectedTier.price}</p>
              </div>
              <button
                onClick={() => setCheckoutModalOpen(false)}
                className="w-7 h-7 rounded-full bg-[#171C22] hover:bg-[#252B32] text-[#969DA6] hover:text-[#F5F3EA] text-xs font-bold flex items-center justify-center transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="overflow-y-auto pr-1 pt-3 space-y-3.5">
              {isSuccess && successReceipt ? (
                <div className="text-center py-2 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-[#78E08F]/20 border border-[#78E08F]/40 text-[#78E08F] flex items-center justify-center mx-auto shadow-lg shadow-[#78E08F]/20">
                    <Check className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-[#F5F3EA]">Payment Successful! 🎉</h4>
                    <p className="text-xs text-[#969DA6] mt-0.5">
                      Welcome to the Founding Member cohort, <span className="text-[#F5F3EA] font-bold">{successReceipt.name}</span>!
                    </p>
                  </div>

                  {/* Receipt Card */}
                  <div className="p-3.5 rounded-2xl bg-[#0D1014] border border-[#252B32] text-xs space-y-1.5 text-left">
                    <div className="flex items-center justify-between pb-1.5 border-b border-[#252B32]">
                      <span className="text-[#969DA6] text-[11px]">Transaction ID</span>
                      <span className="font-mono text-[#C8FF3D] font-bold text-[11px]">{successReceipt.txId}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#969DA6]">Payer Name</span>
                      <span className="text-[#F5F3EA] font-semibold">{successReceipt.name}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#969DA6]">Payer Email</span>
                      <span className="text-[#F5F3EA] font-mono">{successReceipt.email}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#969DA6]">Payment Gateway</span>
                      <span className="text-[#F5F3EA]">{successReceipt.paymentMethod}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1.5 border-t border-[#252B32] font-bold text-[11px]">
                      <span className="text-[#969DA6]">Amount Paid</span>
                      <span className="text-[#78E08F] text-sm font-mono">+${successReceipt.amount}</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-[#969DA6]">
                    A receipt and your private founder credentials have been sent to <strong className="text-[#F5F3EA] font-mono">{successReceipt.email}</strong>.
                  </p>

                  <button
                    onClick={() => setCheckoutModalOpen(false)}
                    className="w-full py-2.5 rounded-xl bg-[#C8FF3D] hover:bg-[#d8ff66] text-[#080A0C] font-bold text-xs transition-colors shadow-lg shadow-[#C8FF3D]/10 cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleCheckoutSubmit} className="space-y-3">
                  {errorMessage && (
                    <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* Tier Selection */}
                  <div>
                    <label className="text-[10px] text-[#969DA6] font-bold uppercase tracking-wider block mb-1">
                      1. Select Reservation Tier
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {availableTiers.slice(0, 4).map((t, idx) => {
                        const isChosen = selectedTier.name === t.name || (t.deposit && selectedTier.deposit)
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setSelectedTier({ name: t.name, price: t.price, deposit: t.deposit })}
                            className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                              isChosen
                                ? 'bg-[#C8FF3D]/10 border-[#C8FF3D] text-[#F5F3EA] shadow-sm'
                                : 'bg-[#0D1014] border-[#252B32] text-[#969DA6] hover:text-[#F5F3EA]'
                            }`}
                          >
                            <span className="font-bold block text-[#F5F3EA] text-[11px] truncate">{t.name}</span>
                            <span className="text-[#C8FF3D] font-mono font-bold text-xs">${t.price}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Required Payer Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-[#969DA6] font-bold uppercase tracking-wider block mb-1">
                        Full Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Jane Doe"
                        value={buyerName}
                        onChange={e => setBuyerName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#0D1014] border border-[#252B32] text-xs text-[#F5F3EA] outline-none focus:border-[#C8FF3D]"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-[#969DA6] font-bold uppercase tracking-wider block mb-1">
                        Email Address <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="jane@example.com"
                        value={buyerEmail}
                        onChange={e => setBuyerEmail(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#0D1014] border border-[#252B32] text-xs text-[#F5F3EA] outline-none focus:border-[#C8FF3D]"
                      />
                    </div>
                  </div>

                  {/* Payment Method Selector (Stripe vs PayPal) */}
                  <div>
                    <label className="text-[10px] text-[#969DA6] font-bold uppercase tracking-wider block mb-1">
                      2. Payment Method
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('stripe')}
                        className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                          paymentMethod === 'stripe'
                            ? 'bg-[#C8FF3D] text-[#080A0C] border-[#C8FF3D] shadow-sm'
                            : 'bg-[#0D1014] border-[#252B32] text-[#969DA6] hover:text-[#F5F3EA]'
                        }`}
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Stripe (Card)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('paypal')}
                        className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                          paymentMethod === 'paypal'
                            ? 'bg-[#0070ba] text-white border-[#0070ba] shadow-sm'
                            : 'bg-[#0D1014] border-[#252B32] text-[#969DA6] hover:text-[#F5F3EA]'
                        }`}
                      >
                        <span className="font-extrabold italic">P</span>
                        <span>PayPal</span>
                      </button>
                    </div>
                  </div>

                  {/* Stripe Card Inputs Simulation */}
                  {paymentMethod === 'stripe' && (
                    <div className="p-3 rounded-xl bg-[#0D1014] border border-[#252B32] space-y-2">
                      <div className="flex items-center justify-between text-[10px] text-[#969DA6]">
                        <span>Card Details</span>
                        <span className="text-[#78E08F] font-mono flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" />
                          <span>256-bit Encrypted</span>
                        </span>
                      </div>

                      <input
                        type="text"
                        placeholder="4242 •••• •••• 4242"
                        value={cardNumber}
                        onChange={e => setCardNumber(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-[#101419] border border-[#252B32] text-xs text-[#F5F3EA] outline-none font-mono focus:border-[#C8FF3D]"
                      />

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="MM / YY"
                          value={cardExp}
                          onChange={e => setCardExp(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg bg-[#101419] border border-[#252B32] text-xs text-[#F5F3EA] outline-none font-mono focus:border-[#C8FF3D] text-center"
                        />
                        <input
                          type="text"
                          placeholder="CVC"
                          value={cardCvc}
                          onChange={e => setCardCvc(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg bg-[#101419] border border-[#252B32] text-xs text-[#F5F3EA] outline-none font-mono focus:border-[#C8FF3D] text-center"
                        />
                      </div>
                    </div>
                  )}

                  {/* PayPal Express Container Simulation */}
                  {paymentMethod === 'paypal' && (
                    <div className="p-3 rounded-xl bg-[#0D1014] border border-[#252B32] text-center space-y-1">
                      <span className="text-[11px] text-[#F5F3EA] block font-semibold">
                        You will complete the payment securely via PayPal.
                      </span>
                      <span className="text-[10px] text-[#969DA6] block">
                        1-Click checkout with PayPal Balance, Bank, or Linked Cards.
                      </span>
                    </div>
                  )}

                  {/* Total Bar */}
                  <div className="p-2.5 rounded-xl bg-[#0D1014] border border-[#252B32] text-xs flex items-center justify-between">
                    <span className="text-[#969DA6]">Total Due Today:</span>
                    <span className="text-sm font-bold text-[#78E08F] font-mono">${selectedTier.price}.00</span>
                  </div>

                  <button
                    type="submit"
                    disabled={isProcessing}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 shadow-lg cursor-pointer ${
                      paymentMethod === 'paypal'
                        ? 'bg-[#ffc439] hover:bg-[#f0b830] text-[#080A0C]'
                        : 'bg-[#C8FF3D] hover:bg-[#d8ff66] text-[#080A0C]'
                    }`}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[#080A0C]" />
                        <span>{processingStep || 'Processing Payment...'}</span>
                      </>
                    ) : paymentMethod === 'paypal' ? (
                      <span>Pay ${selectedTier.price} with PayPal</span>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        <span>Pay ${selectedTier.price} via Stripe</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
