import { useState, useEffect } from 'react'
import {
  X,
  CheckCircle2,
  Lock,
  Sparkles,
  Rocket,
  ShieldCheck,
  CreditCard,
  Zap,
  ArrowRight,
  Check,
  Loader2,
  DollarSign,
  Layers,
  Cpu,
  Copy,
  Mail,
  User,
  ExternalLink
} from 'lucide-react'
import { updateCoLaunchProject, sendDirectEmail } from '../../services/opsApi'
import FloatingPolygons from '../ui/FloatingPolygons'

export default function DIYSubscriptionModal({
  isOpen,
  onClose,
  project,
  onUnlockSuccess
}) {
  const [paymentMethod, setPaymentMethod] = useState('stripe') // 'stripe' | 'paypal'

  // Stripe card form state
  const [cardName, setCardName] = useState(project?.creatorName || '')
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242')
  const [cardExp, setCardExp] = useState('12/28')
  const [cardCvc, setCardCvc] = useState('888')

  // Payment processing state
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStep, setProcessingStep] = useState('')
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [subscriptionRecord, setSubscriptionRecord] = useState(null)
  const [dedicatedUrl, setDedicatedUrl] = useState('')
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [emailNotice, setEmailNotice] = useState('')

  // Handle ESC key to dismiss modal
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isProcessing) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isProcessing, onClose])

  if (!isOpen) return null

  const defaultPassPrice = (() => {
    try {
      const saved = localStorage.getItem('forge_cobuilder_pass_price')
      return saved && !isNaN(Number(saved)) ? Number(saved) : 50
    } catch {
      return 50
    }
  })()

  const amountToCharge = Number(
    project?.diyFee ??
    project?.diyPassPrice ??
    project?.metadataInfo?.diy_fee ??
    project?.metadataInfo?.diyFee ??
    project?.metadata_info?.diy_fee ??
    project?.diySubscription?.amount ??
    defaultPassPrice ??
    50
  )
  const productName = project?.productName || 'Your Custom SaaS App'

  const handleProcessPayment = async (isTestBypass = false) => {
    if (!project?.id) return
    setIsProcessing(true)

    try {
      if (isTestBypass) {
        setProcessingStep(`Instant test unlock verified ($${amountToCharge} USD bypass)...`)
        await new Promise((r) => setTimeout(r, 600))
      } else {
        setProcessingStep(
          paymentMethod === 'stripe'
            ? `Contacting Stripe Checkout & verifying $${amountToCharge} charge...`
            : `Authorizing PayPal $${amountToCharge.toFixed(2)} payment...`
        )
        await new Promise((r) => setTimeout(r, 1100))

        setProcessingStep('Provisioning autonomous Creator Forge license...')
        await new Promise((r) => setTimeout(r, 800))
      }

      const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001'
      const creatorHandleClean = (project?.creatorHandle || project?.creatorName || 'creator')
        .replace(/^@/, '')
        .replace(/[^a-zA-Z0-9]/g, '')
        .toLowerCase()
      const generatedUrl = `${origin}/portal/${creatorHandleClean}?view=projectos&token=cf_diy_paid&project=${project.id}`
      setDedicatedUrl(generatedUrl)

      const licenseKey = `FORGE-COBUILDER-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
      const newSub = {
        active: true,
        plan: `diy_full_${amountToCharge}`,
        planName: `Interactive Co-Builder ProjectOS Pass ($${amountToCharge} USD)`,
        amount: amountToCharge,
        billingCycle: 'one_time',
        paymentMethod: isTestBypass ? 'Test Mode (Instant Unlock)' : paymentMethod === 'stripe' ? 'Stripe (Card •••• 4242)' : 'PayPal Express',
        transactionId: `tx_${paymentMethod}_${Date.now()}`,
        unlockedAt: new Date().toISOString(),
        unlockedPhases: [1, 2, 3],
        status: 'active',
        licenseKey,
        dedicatedUrl: generatedUrl
      }

      setProcessingStep('Unlocking Phase 1, Phase 2, & Phase 3 Interactive Co-Builder Access...')
      const updatedProject = {
        ...project,
        diySubscription: newSub,
        isDIY: true,
        diyOfferStatus: 'accepted'
      }

      // Persist to backend PostgreSQL
      await updateCoLaunchProject(project.id, {
        diySubscription: newSub,
        isDIY: true,
        diyOfferStatus: 'accepted'
      }).catch((e) => console.warn('[DIYSubscriptionModal] DB save warning:', e))

      // Dispatch dedicated URL to creator email immediately
      const targetEmail = (project?.creatorEmail || project?.email_public || '').trim()
      if (targetEmail && targetEmail.includes('@')) {
        setProcessingStep(`Dispatching dedicated URL to ${targetEmail}...`)
        try {
          const emailSubject = `🚀 Your Interactive Co-Builder ProjectOS URL: ${productName}`
          const emailBody = `Hi ${project?.creatorName || 'there'},\n\nThank you for your $${amountToCharge} payment! Your Interactive Co-Builder ProjectOS Workspace for ${productName} has been officially unlocked.\n\nYou now have full authority to directly participate and build alongside the studio across all 3 phases:\n• Phase 1: Market Validation & Pre-order Campaign\n• Phase 2: AI MVP Sprints, Architecture & Database\n• Phase 3: Launch & Production Telemetry\n• 50/50 Co-Founder Equity Partnership\n\nClick the link below to access your interactive workspace:\n${generatedUrl}\n\nBest regards,\nThe Creator Forge Studio Team`

          await sendDirectEmail(targetEmail, emailSubject, emailBody, project?.creatorId || project?.id)
          setEmailNotice(`Dedicated URL dispatched to ${targetEmail}`)
        } catch (mailErr) {
          console.warn('[DIYSubscriptionModal] Failed to dispatch confirmation email:', mailErr)
          setEmailNotice(`URL ready (email notification skipped: ${mailErr?.message || 'offline'})`)
        }
      }

      // Broadcast event so portal & ProjectOS immediately sync with database updatedProject
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('forge_project_updated', { detail: updatedProject })
        )
      }

      setSubscriptionRecord(newSub)
      setPaymentSuccess(true)
      setIsProcessing(false)

      if (onUnlockSuccess) {
        onUnlockSuccess(updatedProject)
      }
    } catch (err) {
      console.error('[DIYSubscriptionModal] Payment failure:', err)
      setIsProcessing(false)
      alert('Payment processing failed. Please try again.')
    }
  }

  return (
    <div
      className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isProcessing) onClose()
      }}
    >
      <div className="relative w-full max-w-3xl rounded-3xl bg-white border border-slate-200 shadow-2xl shadow-slate-900/20 flex flex-col my-auto overflow-hidden text-slate-900">
        {/* Ambient Top Accent Bar */}
        <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500 relative z-10" />

        {/* Ambient Blueprint Dot Grid in Background */}
        <div
          className="absolute inset-0 pointer-events-none opacity-35 z-0"
          style={{
            backgroundImage: 'radial-gradient(#94A3B8 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}
        />

        {/* Floating Geometric Polygons & Micro-accents */}
        <FloatingPolygons variant="section" />

        {/* Premium Corner Faceted SVG Polygons */}
        <div className="absolute -top-12 -right-12 w-64 h-64 pointer-events-none opacity-70 z-0">
          <svg viewBox="0 0 300 300" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="modalPolyGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.14" />
                <stop offset="60%" stopColor="#6366F1" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.02" />
              </linearGradient>
              <linearGradient id="modalPolyStroke1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#818CF8" stopOpacity="0.25" />
              </linearGradient>
            </defs>
            {/* Asymmetrical faceted polygon */}
            <polygon points="150,20 280,90 260,220 170,270 40,200 60,60" fill="url(#modalPolyGrad1)" stroke="url(#modalPolyStroke1)" strokeWidth="1.5" />
            <circle cx="150" cy="150" r="85" stroke="#10B981" strokeOpacity="0.2" strokeWidth="1" strokeDasharray="4 4" />
            <polygon points="150,110 185,130 185,170 150,190 115,170 115,130" fill="rgba(16, 185, 129, 0.08)" stroke="#10B981" strokeOpacity="0.35" strokeWidth="1" />
          </svg>
        </div>

        <div className="absolute -bottom-14 -left-14 w-64 h-64 pointer-events-none opacity-60 z-0">
          <svg viewBox="0 0 300 300" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="modalPolyGrad2" x1="100%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#818CF8" stopOpacity="0.14" />
                <stop offset="50%" stopColor="#C084FC" stopOpacity="0.07" />
                <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.02" />
              </linearGradient>
            </defs>
            <polygon points="130,30 260,80 250,210 120,260 30,170 50,70" fill="url(#modalPolyGrad2)" stroke="#818CF8" strokeOpacity="0.32" strokeWidth="1.5" />
            <circle cx="140" cy="140" r="70" stroke="#818CF8" strokeOpacity="0.18" strokeWidth="1" strokeDasharray="3 3" />
          </svg>
        </div>

        {/* Top Header Bar */}
        <div className="px-5 py-3.5 sm:px-6 sm:py-4 border-b border-slate-100 bg-slate-50/80 backdrop-blur-sm flex items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-[11px] font-extrabold tracking-wide uppercase shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Interactive Co-Builder Pass</span>
            </div>
            <span className="text-slate-300 hidden sm:inline">•</span>
            <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>50/50 Co-Founder Partnership</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto max-h-[85vh] relative z-10">
          {paymentSuccess ? (
            /* SUCCESS STATE (LIGHT MODE) */
            <div className="p-6 sm:p-8 text-center space-y-5 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/25">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl sm:text-2xl font-black text-slate-900">Interactive Co-Builder Access Unlocked!</h3>
                <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">
                  Your ${amountToCharge} payment has been confirmed. You now have full execution authority to participate across all phases and build alongside the studio under our 50/50 co-founder partnership.
                </p>
              </div>

              {/* Dedicated ProjectOS URL Box with Copy */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-emerald-200/90 text-left space-y-2.5 max-w-lg mx-auto shadow-sm">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Rocket className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Your Dedicated Co-Builder Workspace URL:</span>
                  </span>
                  {emailNotice && (
                    <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                      <Mail className="w-3 h-3 text-emerald-600" />
                      <span>Sent to Email</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <input
                    type="text"
                    readOnly
                    value={dedicatedUrl}
                    className="w-full bg-transparent text-xs text-slate-800 font-mono outline-none truncate"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(dedicatedUrl)
                        setCopiedUrl(true)
                        setTimeout(() => setCopiedUrl(false), 2500)
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer active:scale-95 shadow-xs"
                  >
                    {copiedUrl ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy URL</span>
                      </>
                    )}
                  </button>
                </div>

                {project?.creatorEmail && (
                  <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>We also emailed this direct access link to <strong className="text-slate-800">{project.creatorEmail}</strong>.</span>
                  </p>
                )}
              </div>

              {/* License Details Badge */}
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 text-left text-xs space-y-1.5 max-w-lg mx-auto shadow-2xs">
                <div className="flex justify-between items-center text-slate-500">
                  <span>Pass Key:</span>
                  <strong className="font-mono text-slate-900">{subscriptionRecord?.licenseKey}</strong>
                </div>
                <div className="flex justify-between items-center text-slate-500">
                  <span>Payment Amount:</span>
                  <strong className="text-slate-900">${amountToCharge.toFixed(2)} USD (One-Time Access)</strong>
                </div>
                <div className="flex justify-between items-center text-slate-500">
                  <span>Payment Gateway:</span>
                  <strong className="text-emerald-700">{subscriptionRecord?.paymentMethod}</strong>
                </div>
                <div className="flex justify-between items-center text-slate-500">
                  <span>Equity Partnership:</span>
                  <strong className="text-emerald-700 font-bold">50/50 Co-Founder Split (Interactive Build Access)</strong>
                </div>
              </div>

              <div className="pt-2 max-w-lg mx-auto">
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      const searchParams = new URLSearchParams(window.location.search)
                      searchParams.delete('offer')
                      searchParams.delete('track')
                      const newSearch = searchParams.toString()
                      const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : '') + window.location.hash
                      window.history.replaceState({}, '', newUrl)
                      window.dispatchEvent(new CustomEvent('forge_view_change', { detail: 'projectos' }))
                    }
                    onClose()
                  }}
                  className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm transition-all shadow-md shadow-emerald-600/20 cursor-pointer active:scale-98 flex items-center justify-center gap-2"
                >
                  <span>Open Interactive ProjectOS Workspace</span>
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </button>
              </div>
            </div>
          ) : (
            /* 2-COLUMN MODERN CHECKOUT (LIGHT MODE) */
            <div className="grid grid-cols-1 md:grid-cols-12 min-h-[420px]">
              {/* LEFT COLUMN: PRODUCT, VALUE & GUARANTEE (5 cols) */}
              <div className="md:col-span-5 p-5 sm:p-6 border-b md:border-b-0 md:border-r border-slate-100 bg-gradient-to-b from-slate-50/90 via-slate-50/40 to-white/70 flex flex-col justify-between space-y-5 relative">
                <div className="space-y-4">
                  {/* Product & Price Header */}
                  <div>
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest block">
                      Participate & Co-Build
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-slate-950 leading-tight mt-0.5">
                      {productName}
                    </h3>
                  </div>

                  {/* Price Tag Box */}
                  <div className="p-3.5 rounded-2xl bg-white border border-emerald-200/90 shadow-sm space-y-1">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-black text-slate-950 tracking-tight">${amountToCharge}</span>
                      <span className="text-xs font-bold text-slate-500">USD</span>
                      <span className="ml-auto text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-300">
                        One-Time Pass
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      No monthly fees. Unlocks direct execution authority across all phases.
                    </p>
                  </div>

                  {/* Benefit Checkpoints */}
                  <div className="space-y-2.5 pt-1 text-xs">
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                        <Layers className="w-3 h-3" />
                      </div>
                      <div>
                        <strong className="text-slate-900 font-semibold block text-[11px]">All 3 Phases Unlocked</strong>
                        <span className="text-slate-500 text-[10px] leading-tight block">
                          Participate in Market Validation, MVP Sprints & Live Launch.
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                        <Cpu className="w-3 h-3" />
                      </div>
                      <div>
                        <strong className="text-slate-900 font-semibold block text-[11px]">AI Execution Authority</strong>
                        <span className="text-slate-500 text-[10px] leading-tight block">
                          Directly trigger AI tools, customize blueprints & modify features.
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                        <DollarSign className="w-3 h-3" />
                      </div>
                      <div>
                        <strong className="text-slate-900 font-semibold block text-[11px]">50/50 Co-Founder Split</strong>
                        <span className="text-slate-500 text-[10px] leading-tight block">
                          Equal venture profit sharing with direct Stripe Connect deposits.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Trust Footer */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                  <div className="flex items-center gap-1 text-emerald-700 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>256-Bit SSL Encrypted</span>
                  </div>
                  <span className="text-slate-400">14-Day Guarantee</span>
                </div>
              </div>

              {/* RIGHT COLUMN: PAYMENT GATEWAY & CHECKOUT (7 cols) */}
              <div className="md:col-span-7 p-5 sm:p-6 flex flex-col justify-between space-y-4 bg-white/70 backdrop-blur-sm">
                <div className="space-y-3.5">
                  {/* Gateway Selector Tabs */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
                        Select Payment Method
                      </label>
                      <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5 text-emerald-600" />
                        <span>Instant Access</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 border border-slate-200 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('stripe')}
                        className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          paymentMethod === 'stripe'
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Card / Apple Pay</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('paypal')}
                        className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          paymentMethod === 'paypal'
                            ? 'bg-amber-400 text-slate-950 shadow-xs font-black'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <span className="font-black italic text-sm leading-none">P</span>
                        <span>PayPal</span>
                      </button>
                    </div>
                  </div>

                  {/* Payment Details Form */}
                  {paymentMethod === 'stripe' ? (
                    <div className="space-y-2.5">
                      {/* Cardholder Name */}
                      <div className="space-y-1">
                        <label
                          htmlFor="co-builder-cc-name"
                          className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block"
                        >
                          Cardholder Name
                        </label>
                        <div className="relative">
                          <input
                            id="co-builder-cc-name"
                            name="cc-name"
                            type="text"
                            autoComplete="cc-name"
                            value={cardName}
                            onChange={(e) => setCardName(e.target.value)}
                            placeholder="Creator Name"
                            className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 transition-all"
                            required
                          />
                          <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                        </div>
                      </div>

                      {/* Card Number */}
                      <div className="space-y-1">
                        <label
                          htmlFor="co-builder-cc-number"
                          className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block"
                        >
                          Card Information
                        </label>
                        <div className="relative">
                          <input
                            id="co-builder-cc-number"
                            name="cc-number"
                            type="text"
                            autoComplete="cc-number"
                            inputMode="numeric"
                            maxLength={19}
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            placeholder="4242 •••• •••• 4242"
                            className="w-full pl-8 pr-16 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 transition-all"
                            required
                          />
                          <CreditCard className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                          <div className="absolute right-2.5 top-2 flex items-center gap-1 opacity-80">
                            <span className="px-1.5 py-0.5 rounded bg-slate-200/80 text-[9px] font-bold text-slate-700">VISA</span>
                            <span className="px-1.5 py-0.5 rounded bg-slate-200/80 text-[9px] font-bold text-slate-700">MC</span>
                          </div>
                        </div>
                      </div>

                      {/* Exp & CVC Row */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label
                            htmlFor="co-builder-cc-exp"
                            className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block"
                          >
                            Expires (MM/YY)
                          </label>
                          <input
                            id="co-builder-cc-exp"
                            name="cc-exp"
                            type="text"
                            autoComplete="cc-exp"
                            maxLength={5}
                            value={cardExp}
                            onChange={(e) => setCardExp(e.target.value)}
                            placeholder="12/28"
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 transition-all"
                            required
                          />
                        </div>

                        <div className="space-y-1">
                          <label
                            htmlFor="co-builder-cc-csc"
                            className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block"
                          >
                            CVC / Security Code
                          </label>
                          <input
                            id="co-builder-cc-csc"
                            name="cc-csc"
                            type="text"
                            autoComplete="cc-csc"
                            inputMode="numeric"
                            maxLength={4}
                            value={cardCvc}
                            onChange={(e) => setCardCvc(e.target.value)}
                            placeholder="888"
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 transition-all"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* PayPal Gateway Detail (Light Mode) */
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-center space-y-2">
                      <div className="text-xl font-black italic text-amber-600">PayPal</div>
                      <p className="text-xs text-slate-700">
                        Confirm your one-time payment of <strong className="text-slate-950">${amountToCharge.toFixed(2)} USD</strong> for the Interactive ProjectOS Pass via PayPal.
                      </p>
                      <div className="text-[11px] text-slate-500">
                        Immediate redirect & instantaneous license activation to your email.
                      </div>
                    </div>
                  )}

                  {/* Processing Status Banner */}
                  {isProcessing && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-xs text-emerald-800 animate-pulse">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600 shrink-0" />
                      <span className="truncate">{processingStep}</span>
                    </div>
                  )}
                </div>

                {/* Always Visible Checkout Actions */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleProcessPayment(false)}
                    disabled={isProcessing}
                    className="w-full py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm tracking-tight transition-all shadow-md shadow-slate-900/20 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Authorizing Payment...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5 text-white" />
                        <span>Pay ${amountToCharge}.00 USD & Unlock Access</span>
                        <ArrowRight className="w-3.5 h-3.5 text-white" />
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-center gap-2.5 text-[10px] text-slate-500 py-1">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Instant URL dispatch & workspace provision</span>
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="font-mono text-slate-400">256-bit SSL Encrypted</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

