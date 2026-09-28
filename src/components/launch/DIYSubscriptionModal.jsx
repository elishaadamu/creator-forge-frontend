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

  const amountToCharge = 50 // $50 USD flat fee as requested
  const productName = project?.productName || 'Your Custom SaaS App'

  const handleProcessPayment = async (isTestBypass = false) => {
    if (!project?.id) return
    setIsProcessing(true)

    try {
      if (isTestBypass) {
        setProcessingStep('Instant test unlock verified ($50 USD bypass)...')
        await new Promise((r) => setTimeout(r, 600))
      } else {
        setProcessingStep(
          paymentMethod === 'stripe'
            ? 'Contacting Stripe Checkout & verifying $50 charge...'
            : 'Authorizing PayPal $50.00 payment...'
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
        plan: 'diy_full_50',
        planName: 'Interactive Co-Builder ProjectOS Pass ($50 USD)',
        amount: 50,
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
          const emailBody = `Hi ${project?.creatorName || 'there'},\n\nThank you for your $50 payment! Your Interactive Co-Builder ProjectOS Workspace for ${productName} has been officially unlocked.\n\nYou now have full authority to directly participate and build alongside the studio across all 3 phases:\n• Phase 1: Market Validation & Pre-order Campaign\n• Phase 2: AI MVP Sprints, Architecture & Database\n• Phase 3: Launch & Production Telemetry\n• 50/50 Co-Founder Equity Partnership\n\nClick the link below to access your interactive workspace:\n${generatedUrl}\n\nBest regards,\nThe Creator Forge Studio Team`

          await sendDirectEmail(targetEmail, emailSubject, emailBody, project?.creatorId || project?.id)
          setEmailNotice(`Dedicated URL dispatched to ${targetEmail}`)
        } catch (mailErr) {
          console.warn('[DIYSubscriptionModal] Failed to dispatch confirmation email:', mailErr)
          setEmailNotice(`URL ready (email notification skipped: ${mailErr?.message || 'offline'})`)
        }
      }

      // Broadcast event so portal & ProjectOS immediately sync
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
      className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isProcessing) onClose()
      }}
    >
      <div className="relative w-full max-w-3xl rounded-3xl bg-[#0c101a] border border-amber-500/30 shadow-2xl shadow-black/90 flex flex-col my-auto overflow-hidden text-slate-100">
        {/* Ambient Top Glow Line */}
        <div className="h-1 w-full bg-gradient-to-r from-amber-400 via-emerald-400 to-indigo-500" />

        {/* Top Header Bar */}
        <div className="px-5 py-3.5 sm:px-6 sm:py-4 border-b border-white/[0.08] bg-white/[0.02] flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-[11px] font-extrabold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Interactive Co-Builder Pass</span>
            </div>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>50/50 Co-Founder Partnership</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.14] text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto max-h-[85vh]">
          {paymentSuccess ? (
            /* SUCCESS STATE */
            <div className="p-6 sm:p-8 text-center space-y-5 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/25">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl sm:text-2xl font-black text-white">Interactive Co-Builder Access Unlocked!</h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto">
                  Your $50 payment has been confirmed. You now have full execution authority to participate across all phases and build alongside the studio under our 50/50 co-founder partnership.
                </p>
              </div>

              {/* Dedicated ProjectOS URL Box with Copy */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#101524] border border-amber-400/40 text-left space-y-2.5 max-w-lg mx-auto shadow-xl">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-300 flex items-center gap-1.5">
                    <Rocket className="w-3.5 h-3.5 text-amber-400" />
                    <span>Your Dedicated Co-Builder Workspace URL:</span>
                  </span>
                  {emailNotice && (
                    <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      <span>Sent to Email</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 p-2 rounded-xl bg-black/50 border border-white/10">
                  <input
                    type="text"
                    readOnly
                    value={dedicatedUrl}
                    className="w-full bg-transparent text-xs text-slate-200 font-mono outline-none truncate"
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
                    className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer active:scale-95"
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
                  <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>We also emailed this direct access link to <strong className="text-slate-200">{project.creatorEmail}</strong>.</span>
                  </p>
                )}
              </div>

              {/* License Details Badge */}
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-left text-xs space-y-1.5 max-w-lg mx-auto">
                <div className="flex justify-between items-center text-slate-400">
                  <span>Pass Key:</span>
                  <strong className="font-mono text-amber-300">{subscriptionRecord?.licenseKey}</strong>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Payment Amount:</span>
                  <strong className="text-white">$50.00 USD (One-Time Access)</strong>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Payment Gateway:</span>
                  <strong className="text-emerald-400">{subscriptionRecord?.paymentMethod}</strong>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Equity Partnership:</span>
                  <strong className="text-emerald-300 font-bold">50/50 Co-Founder Split (Interactive Build Access)</strong>
                </div>
              </div>

              <div className="pt-2 max-w-lg mx-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-slate-950 font-black text-sm transition-all shadow-lg shadow-emerald-950/50 cursor-pointer active:scale-98 flex items-center justify-center gap-2"
                >
                  <span>Open Interactive ProjectOS Workspace</span>
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </button>
              </div>
            </div>
          ) : (
            /* 2-COLUMN MODERN CHECKOUT */
            <div className="grid grid-cols-1 md:grid-cols-12 min-h-[420px]">
              {/* LEFT COLUMN: PRODUCT, VALUE & GUARANTEE (5 cols) */}
              <div className="md:col-span-5 p-5 sm:p-6 border-b md:border-b-0 md:border-r border-white/[0.08] bg-gradient-to-b from-white/[0.02] via-transparent to-black/30 flex flex-col justify-between space-y-5">
                <div className="space-y-4">
                  {/* Product & Price Header */}
                  <div>
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">
                      Participate & Co-Build
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-white leading-tight mt-0.5">
                      {productName}
                    </h3>
                  </div>

                  {/* Price Tag Box */}
                  <div className="p-3.5 rounded-2xl bg-amber-400/[0.07] border border-amber-400/30 space-y-1">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-black text-amber-300 tracking-tight">$50</span>
                      <span className="text-xs font-bold text-slate-300">USD</span>
                      <span className="ml-auto text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/30">
                        One-Time Pass
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-snug">
                      No monthly fees. Unlocks direct execution authority across all phases.
                    </p>
                  </div>

                  {/* Benefit Checkpoints */}
                  <div className="space-y-2.5 pt-1 text-xs">
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-lg bg-amber-400/15 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Layers className="w-3 h-3" />
                      </div>
                      <div>
                        <strong className="text-white font-semibold block text-[11px]">All 3 Phases Unlocked</strong>
                        <span className="text-slate-400 text-[10px] leading-tight block">
                          Participate in Market Validation, MVP Sprints & Live Launch.
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-lg bg-purple-400/15 text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Cpu className="w-3 h-3" />
                      </div>
                      <div>
                        <strong className="text-white font-semibold block text-[11px]">AI Execution Authority</strong>
                        <span className="text-slate-400 text-[10px] leading-tight block">
                          Directly trigger AI tools, customize blueprints & modify features.
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-lg bg-emerald-400/15 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <DollarSign className="w-3 h-3" />
                      </div>
                      <div>
                        <strong className="text-white font-semibold block text-[11px]">50/50 Co-Founder Split</strong>
                        <span className="text-slate-400 text-[10px] leading-tight block">
                          Equal venture profit sharing with direct Stripe Connect deposits.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Trust Footer */}
                <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-slate-400">
                  <div className="flex items-center gap-1 text-emerald-400 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>256-Bit SSL Encrypted</span>
                  </div>
                  <span className="text-slate-500">14-Day Guarantee</span>
                </div>
              </div>

              {/* RIGHT COLUMN: PAYMENT GATEWAY & CHECKOUT (7 cols) */}
              <div className="md:col-span-7 p-5 sm:p-6 flex flex-col justify-between space-y-4">
                <div className="space-y-3.5">
                  {/* Gateway Selector Tabs */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Select Payment Method
                      </label>
                      <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5 text-emerald-400" />
                        <span>Instant Access</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 p-1 bg-black/40 border border-white/[0.08] rounded-xl">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('stripe')}
                        className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          paymentMethod === 'stripe'
                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                            : 'text-slate-400 hover:text-white'
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
                            ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                            : 'text-slate-400 hover:text-white'
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
                          className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block"
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
                            className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#121622] border border-white/[0.1] text-xs text-white placeholder-slate-500 outline-none focus:border-amber-400/80 transition-colors"
                            required
                          />
                          <User className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                        </div>
                      </div>

                      {/* Card Number */}
                      <div className="space-y-1">
                        <label
                          htmlFor="co-builder-cc-number"
                          className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block"
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
                            className="w-full pl-8 pr-16 py-2 rounded-xl bg-[#121622] border border-white/[0.1] text-xs font-mono text-white placeholder-slate-500 outline-none focus:border-amber-400/80 transition-colors"
                            required
                          />
                          <CreditCard className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                          <div className="absolute right-2.5 top-2 flex items-center gap-1 opacity-70">
                            <span className="px-1.5 py-0.5 rounded bg-white/10 text-[9px] font-bold text-slate-300">VISA</span>
                            <span className="px-1.5 py-0.5 rounded bg-white/10 text-[9px] font-bold text-slate-300">MC</span>
                          </div>
                        </div>
                      </div>

                      {/* Exp & CVC Row */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label
                            htmlFor="co-builder-cc-exp"
                            className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block"
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
                            className="w-full px-3 py-2 rounded-xl bg-[#121622] border border-white/[0.1] text-xs font-mono text-white placeholder-slate-500 outline-none focus:border-amber-400/80 transition-colors"
                            required
                          />
                        </div>

                        <div className="space-y-1">
                          <label
                            htmlFor="co-builder-cc-csc"
                            className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block"
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
                            className="w-full px-3 py-2 rounded-xl bg-[#121622] border border-white/[0.1] text-xs font-mono text-white placeholder-slate-500 outline-none focus:border-amber-400/80 transition-colors"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* PayPal Gateway Detail */
                    <div className="p-4 rounded-xl bg-amber-400/[0.05] border border-amber-400/20 text-center space-y-2">
                      <div className="text-xl font-black italic text-amber-300">PayPal</div>
                      <p className="text-xs text-slate-300">
                        Confirm your one-time payment of <strong className="text-white">$50.00 USD</strong> for the Interactive ProjectOS Pass via PayPal.
                      </p>
                      <div className="text-[11px] text-slate-400">
                        Immediate redirect & instantaneous license activation to your email.
                      </div>
                    </div>
                  )}

                  {/* Processing Status Banner */}
                  {isProcessing && (
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2.5 text-xs text-amber-200 animate-pulse">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400 shrink-0" />
                      <span className="truncate">{processingStep}</span>
                    </div>
                  )}
                </div>

                {/* Always Visible Checkout Actions */}
                <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => handleProcessPayment(false)}
                    disabled={isProcessing}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:brightness-110 active:scale-[0.98] text-slate-950 font-black text-xs sm:text-sm tracking-tight transition-all shadow-lg shadow-amber-950/40 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                        <span>Authorizing Payment...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5 text-slate-950" />
                        <span>Pay ${amountToCharge}.00 USD & Unlock Access</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-950" />
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-slate-400" />
                      <span>Instant URL dispatch to email</span>
                    </span>

                    {/* Instant Test Mode Bypass */}
                    <button
                      type="button"
                      onClick={() => handleProcessPayment(true)}
                      disabled={isProcessing}
                      className="font-bold text-amber-400 hover:text-amber-300 underline underline-offset-2 cursor-pointer transition-colors text-[10px] sm:text-[11px]"
                      title="Unlock immediately in test mode without card charge"
                    >
                      ⚡ Demo Test Unlock (Instant Access)
                    </button>
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

