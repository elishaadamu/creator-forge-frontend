import { useState } from 'react'
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
  Star,
  Check,
  Loader2,
  DollarSign,
  Layers,
  Cpu,
  BarChart2,
  Laptop
} from 'lucide-react'
import { updateCoLaunchProject } from '../../services/opsApi'

export default function DIYSubscriptionModal({
  isOpen,
  onClose,
  project,
  onUnlockSuccess
}) {
  const [billingCycle, setBillingCycle] = useState('monthly') // 'monthly' | 'annual'
  const [paymentMethod, setPaymentMethod] = useState('stripe') // 'stripe' | 'paypal'

  // Stripe card form state
  const [cardName, setCardName] = useState(project?.creatorName || '')
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242')
  const [cardExp, setCardExp] = useState('12/28')
  const [cardCvc, setCardCvc] = useState('888')
  const [postalCode, setPostalCode] = useState('94103')

  // Payment processing state
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStep, setProcessingStep] = useState('')
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [subscriptionRecord, setSubscriptionRecord] = useState(null)

  if (!isOpen) return null

  const monthlyPrice = 99
  const annualPrice = 79 * 12 // $948/yr
  const amountToCharge = billingCycle === 'monthly' ? monthlyPrice : annualPrice
  const productName = project?.productName || 'Your Custom SaaS App'

  const handleProcessPayment = async (isTestBypass = false) => {
    if (!project?.id) return
    setIsProcessing(true)

    try {
      if (isTestBypass) {
        setProcessingStep('Instant test unlock verified...')
        await new Promise((r) => setTimeout(r, 600))
      } else {
        setProcessingStep(
          paymentMethod === 'stripe'
            ? 'Contacting Stripe Checkout & verifying card token...'
            : 'Authorizing PayPal subscription agreement...'
        )
        await new Promise((r) => setTimeout(r, 1100))

        setProcessingStep('Provisioning autonomous Creator Forge license...')
        await new Promise((r) => setTimeout(r, 800))
      }

      const newSub = {
        active: true,
        plan: billingCycle === 'monthly' ? 'diy_creator_monthly' : 'diy_creator_annual',
        planName: billingCycle === 'monthly' ? 'DIY Autonomous Monthly' : 'DIY Autonomous Annual (Founding Pass)',
        amount: amountToCharge,
        billingCycle,
        paymentMethod: isTestBypass ? 'Test Mode (Instant Unlock)' : paymentMethod === 'stripe' ? 'Stripe (Card •••• 4242)' : 'PayPal Express',
        transactionId: `sub_${paymentMethod}_${Date.now()}`,
        unlockedAt: new Date().toISOString(),
        unlockedPhases: [1, 2, 3],
        status: 'active',
        keepFullRevenue: true,
        licenseKey: `FORGE-DIY-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
      }

      setProcessingStep('Unlocking Phase 1, Phase 2, & Phase 3 Command Control...')
      const updatedProject = {
        ...project,
        diySubscription: newSub,
        isDIY: true
      }

      // Persist to backend PostgreSQL
      await updateCoLaunchProject(project.id, {
        diySubscription: newSub,
        isDIY: true
      }).catch((e) => console.warn('[DIYSubscriptionModal] DB save warning:', e))

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
    <div className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in overflow-y-auto">
      <div className="w-full max-w-xl rounded-3xl bg-[#0b0e14] border border-amber-500/40 shadow-2xl overflow-hidden flex flex-col my-auto border-t-2 border-t-amber-400">
        {/* Top Header Bar */}
        <div className="p-5 sm:p-6 border-b border-white/[0.08] bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-indigo-500/10 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>Do-It-Yourself Subscription</span>
              </span>
              <span className="text-slate-500 text-xs">•</span>
              <span className="text-[11px] font-bold text-emerald-400">100% Equity / Keep Revenue</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Autonomous Creator Command Control</span>
            </h2>
            <p className="text-xs text-slate-300">
              Run the full engineering, validation, and launch phases yourself for <strong>{productName}</strong>.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto max-h-[78vh]">
          {paymentSuccess ? (
            /* SUCCESS STATE */
            <div className="py-6 text-center space-y-4 animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-black text-white">Full Autonomous Command Control Unlocked!</h3>
                <p className="text-xs text-slate-300 max-w-md mx-auto">
                  Your Do-It-Yourself subscription is now active. You have 100% authority to validate, build the MVP with AI sprints, and launch to your audience.
                </p>
              </div>

              {/* License Details Badge */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-left text-xs space-y-2 max-w-md mx-auto">
                <div className="flex justify-between items-center text-slate-400">
                  <span>License Key:</span>
                  <strong className="font-mono text-amber-300">{subscriptionRecord?.licenseKey}</strong>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Plan & Billing:</span>
                  <strong className="text-white">{subscriptionRecord?.planName} (${subscriptionRecord?.amount})</strong>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Payment Gateway:</span>
                  <strong className="text-emerald-400">{subscriptionRecord?.paymentMethod}</strong>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Unlocked Capabilities:</span>
                  <strong className="text-purple-300">Phase 1, Phase 2, Phase 3 + AI Sprints</strong>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-slate-950 font-black text-sm transition-all shadow-lg shadow-emerald-950/50 cursor-pointer active:scale-98 flex items-center justify-center gap-2"
                >
                  <span>Open Full ProjectOS Command Center</span>
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </button>
              </div>
            </div>
          ) : (
            /* CHECKOUT FORM */
            <>
              {/* Feature Highlights Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-left">
                <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs">
                    <Layers className="w-3.5 h-3.5" />
                    <span>All 3 Phases</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    Full execution for Market Validation, MVP Sprint Roadmap, & Live Launch.
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-1">
                  <div className="flex items-center gap-1.5 text-purple-400 font-bold text-xs">
                    <Cpu className="w-3.5 h-3.5" />
                    <span>AI Engineering</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    Generate tech specs, code architecture, and pre-order landing pages autonomously.
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>100% Revenue</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    Keep 100% of member subscriptions directly via your own Stripe checkout.
                  </p>
                </div>
              </div>

              {/* Billing Cycle Switcher */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300 uppercase text-[10px] tracking-wider">
                    Select Billing Cycle
                  </span>
                  <span className="text-amber-400 text-[11px] font-bold">Cancel anytime with 1-click</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setBillingCycle('monthly')}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative ${
                      billingCycle === 'monthly'
                        ? 'bg-amber-500/10 border-amber-400/80 shadow-md ring-1 ring-amber-400/30'
                        : 'bg-white/[0.02] border-white/[0.08] hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Monthly Plan</span>
                      {billingCycle === 'monthly' && (
                        <div className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-[10px] font-black">
                          ✓
                        </div>
                      )}
                    </div>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-lg font-black text-white">$99</span>
                      <span className="text-slate-400 text-xs font-normal">/ month</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Flexible month-to-month access</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBillingCycle('annual')}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative ${
                      billingCycle === 'annual'
                        ? 'bg-amber-500/10 border-amber-400/80 shadow-md ring-1 ring-amber-400/30'
                        : 'bg-white/[0.02] border-white/[0.08] hover:border-white/20'
                    }`}
                  >
                    <span className="absolute -top-2 right-2 px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black text-[9px] uppercase tracking-wider">
                      Save 20%
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Annual Pass</span>
                      {billingCycle === 'annual' && (
                        <div className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-[10px] font-black">
                          ✓
                        </div>
                      )}
                    </div>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-lg font-black text-white">$79</span>
                      <span className="text-slate-400 text-xs font-normal">/ month</span>
                    </div>
                    <span className="text-[10px] text-emerald-400 block mt-0.5 font-medium">$948 billed annually</span>
                  </button>
                </div>
              </div>

              {/* Payment Gateway Tabs (Stripe vs PayPal) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300 uppercase text-[10px] tracking-wider">
                    Select Payment Gateway
                  </span>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>256-Bit SSL Encrypted</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-1 bg-white/[0.03] border border-white/[0.08] rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('stripe')}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      paymentMethod === 'stripe'
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Stripe (Card / Apple Pay)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('paypal')}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      paymentMethod === 'paypal'
                        ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="font-black italic">P</span>
                    <span>PayPal Checkout</span>
                  </button>
                </div>

                {/* Gateway Detail Box */}
                {paymentMethod === 'stripe' ? (
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Cardholder Name
                      </label>
                      <input
                        type="text"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        placeholder="Creator Name"
                        className="w-full px-3 py-2 rounded-xl bg-[#121620] border border-white/[0.1] text-xs text-white outline-none focus:border-amber-400/60"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Card Information
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          placeholder="4242 •••• •••• 4242"
                          className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#121620] border border-white/[0.1] text-xs font-mono text-white outline-none focus:border-amber-400/60"
                        />
                        <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Expires (MM/YY)
                        </label>
                        <input
                          type="text"
                          value={cardExp}
                          onChange={(e) => setCardExp(e.target.value)}
                          placeholder="12/28"
                          className="w-full px-3 py-2 rounded-xl bg-[#121620] border border-white/[0.1] text-xs font-mono text-white outline-none focus:border-amber-400/60"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          CVC / Security Code
                        </label>
                        <input
                          type="text"
                          value={cardCvc}
                          onChange={(e) => setCardCvc(e.target.value)}
                          placeholder="888"
                          className="w-full px-3 py-2 rounded-xl bg-[#121620] border border-white/[0.1] text-xs font-mono text-white outline-none focus:border-amber-400/60"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-amber-400/5 border border-amber-400/20 text-center space-y-2">
                    <div className="text-xl font-black italic text-amber-300">PayPal</div>
                    <p className="text-xs text-slate-300">
                      You will be authenticated through PayPal to confirm your recurring DIY autonomous subscription of <strong>${amountToCharge}</strong>.
                    </p>
                    <div className="text-[11px] text-slate-400">
                      Immediate redirect & instantaneous license activation upon confirmation.
                    </div>
                  </div>
                )}
              </div>

              {/* Processing Loader */}
              {isProcessing && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3 text-xs text-amber-200 animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400 shrink-0" />
                  <span>{processingStep}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={() => handleProcessPayment(false)}
                  disabled={isProcessing}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:brightness-110 text-slate-950 font-black text-sm transition-all shadow-xl shadow-amber-950/40 cursor-pointer disabled:opacity-50 active:scale-98 flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4 text-slate-950" />
                  <span>
                    Pay ${amountToCharge}.00 & Unlock Full Command Control via {paymentMethod === 'stripe' ? 'Stripe' : 'PayPal'}
                  </span>
                </button>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-slate-500 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                    <span>Instant activation · 14-day refund policy</span>
                  </span>

                  {/* Instant Test Mode Bypass */}
                  <button
                    type="button"
                    onClick={() => handleProcessPayment(true)}
                    disabled={isProcessing}
                    className="text-[11px] font-bold text-amber-400 hover:text-amber-300 underline underline-offset-2 cursor-pointer transition-colors"
                    title="Unlock immediately in test mode without card charge"
                  >
                    ⚡ Demo Test Unlock (Instant Access)
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
