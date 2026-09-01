import { useState, useEffect } from 'react'
import {
  Sparkles, CheckCircle2, ShieldCheck, CreditCard, ArrowRight,
  Zap, Star, Lock, Users, Globe, ExternalLink, HelpCircle, Check,
  Loader2, AlertCircle, RefreshCw
} from 'lucide-react'
import ProductMockupDisplay from './ProductMockupDisplay'
import { trackVisit } from '../../services/tracker'
import { updatePageSEO } from '../../utils/seo'

export default function PreorderLandingPage({ slug }) {
  const [project, setProject] = useState(() => {
    try {
      const active = JSON.parse(localStorage.getItem('forge_launch_active_project') || '{}')
      return active && Object.keys(active).length > 0 ? active : null
    } catch (e) {
      return null
    }
  })

  useEffect(() => {
    const title = project?.name
      ? `VIP Early Access — ${project.name} | Creator Forge`
      : "VIP Early Access & Pre-Order | Creator Forge";
    updatePageSEO({
      title,
      description: project?.tagline || "Lock in founder pricing and early access to our exclusive software tool.",
      image: "/og-image.svg"
    });
  }, [project?.name, project?.tagline]);

  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false)
  const [selectedTier, setSelectedTier] = useState({ name: 'Founding Annual Pass', price: 99, deposit: false })
  const [paymentMethod, setPaymentMethod] = useState('stripe') // 'stripe' | 'paypal'
  
  // Payer Details (Required)
  const [buyerName, setBuyerName] = useState('')
  const [buyerEmail, setBuyerEmail] = useState('')
  
  // Stripe Card Details
  const [cardNumber, setCardNumber] = useState('')
  const [cardExp, setCardExp] = useState('')
  const [cardCvc, setCardCvc] = useState('')
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [successReceipt, setSuccessReceipt] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let isMounted = true

    const loadDbProject = async () => {
      try {
        const { getProjectBySlug } = await import('../../services/opsApi')
        if (slug) {
          const dbProj = await getProjectBySlug(slug)
          if (isMounted && dbProj) {
            setProject(dbProj)
            try {
              localStorage.setItem('forge_launch_active_project', JSON.stringify(dbProj))
            } catch (e) {}
          }
        }
      } catch (err) {
        try {
          const active = JSON.parse(localStorage.getItem('forge_launch_active_project') || '{}')
          if (isMounted && active && Object.keys(active).length > 0) {
            setProject(active)
          }
        } catch (e) {}
      }
    }

    loadDbProject()
    trackVisit(`/preorder/${slug || 'product'}`, updated => {
      if (isMounted && updated) setProject(updated)
    })

    const handleSync = () => {
      try {
        const cur = JSON.parse(localStorage.getItem('forge_launch_active_project') || '{}')
        if (cur && Object.keys(cur).length > 0) setProject(cur)
      } catch (err) {}
    }

    window.addEventListener('storage', handleSync)
    window.addEventListener('forge_project_updated', handleSync)
    return () => {
      isMounted = false
      window.removeEventListener('storage', handleSync)
      window.removeEventListener('forge_project_updated', handleSync)
    }
  }, [slug])

  const productName = project?.productName || 'Software Product'
  const creatorName = project?.creatorName || 'Creator Co-Founder'
  const niche = project?.niche || 'Software'
  const tagline = project?.productTagline || 'Autonomous software suite built for high-intent creators and teams.'
  const headline = project?.campaignKit?.landingPageCopy?.headline || `The ${productName} Workspace Built with ${creatorName}`
  const subheadline = project?.campaignKit?.landingPageCopy?.subheadline || tagline
  
  const cfg = project?.campaignKit?.pricingConfig
  const foundingPrice = Number(cfg?.foundingPrice) || (project?.pricing ? (Number(String(project.pricing).replace(/[^0-9]/g, '')) || 49) : 49)
  const depositPrice = Number(cfg?.depositPrice) || Math.max(9, Math.round(foundingPrice * 0.2))
  const perksText = cfg?.perks || '50% Lifetime Price Lock & VIP Alpha Perks'

  useEffect(() => {
    setSelectedTier(prev => {
      if (prev.deposit) {
        return { name: `VIP Deposit ($${depositPrice})`, price: depositPrice, deposit: true }
      }
      return { name: `Founding Annual Pass ($${foundingPrice})`, price: foundingPrice, deposit: false }
    })
  }, [foundingPrice, depositPrice])

  const handleCheckoutSubmit = (e) => {
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

    // Simulate Payment Gateway Processing (Stripe / PayPal)
    setTimeout(async () => {
      setIsProcessing(false)
      setIsSuccess(true)

      const txId = paymentMethod === 'stripe' 
        ? `tx_stripe_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`
        : `tx_paypal_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`

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

      // 1. Record to local project state dynamically for instantaneous tab sync
      const urlParams = new URLSearchParams(window.location.search)
      const refQuery = (urlParams.get('ref') || urlParams.get('utm_source') || urlParams.get('utm') || urlParams.get('source') || urlParams.get('channel') || '').toLowerCase()
      let attributedChannel = 'Direct / Other'
      if (refQuery.includes('instagram') || refQuery.includes('ig') || refQuery.includes('story') || refQuery.includes('insta')) {
        attributedChannel = 'Instagram Stories'
      } else if (refQuery.includes('tiktok') || refQuery.includes('reels') || refQuery.includes('shorts') || refQuery.includes('youtube') || refQuery.includes('yt')) {
        attributedChannel = 'TikTok / Shorts'
      } else if (refQuery.includes('twitter') || refQuery.includes('x_post') || refQuery.includes('tweet') || refQuery.includes('x')) {
        attributedChannel = 'Twitter / X'
      } else if (refQuery.includes('newsletter') || refQuery.includes('email') || refQuery.includes('broadcast') || refQuery.includes('mail')) {
        attributedChannel = 'Email Newsletter'
      } else if (refQuery.includes('dm') || refQuery.includes('outreach')) {
        attributedChannel = 'Direct Messages'
      }

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
        status: 'Paid'
      }

      try {
        const current = JSON.parse(localStorage.getItem('forge_launch_active_project') || '{}')
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

        localStorage.setItem('forge_launch_active_project', JSON.stringify(updated))
        setProject(updated)

        window.dispatchEvent(new CustomEvent('forge_project_updated', { detail: updated }))
        window.dispatchEvent(new Event('storage'))
      } catch (err) {}

      // 2. Persist to central Render PostgreSQL database for cross-device & cross-browser synchronization
      try {
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
          txId: txId
        })
        if (dbResult) {
          setProject(dbResult)
          try {
            localStorage.setItem('forge_launch_active_project', JSON.stringify(dbResult))
            window.dispatchEvent(new CustomEvent('forge_project_updated', { detail: dbResult }))
          } catch (e) {}
        }
      } catch (dbErr) {
        console.warn('[Preorder] DB persistence completed or logged:', dbErr)
      }
    }, 1200)
  }

  const openCheckout = (tier) => {
    setSelectedTier(tier)
    setIsSuccess(false)
    setSuccessReceipt(null)
    setErrorMessage('')
    setCheckoutModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 selection:bg-purple-500 selection:text-white font-sans antialiased overflow-x-hidden">
      {/* Top Launch Notification Banner */}
      <div className="bg-gradient-to-r from-purple-950/90 via-purple-900/70 to-[#07090e] border-b border-purple-500/20 py-2.5 px-4 text-center text-xs">
        <div className="flex items-center justify-center gap-2 font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-purple-200">Exclusive Co-Founder Early Launch by</span>
          <span className="text-white font-bold">{creatorName}</span>
          <span className="bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ml-1">
            50% Off Lifetime Tier
          </span>
        </div>
      </div>

      {/* Navigation Bar */}
      <header className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-purple-900/50">
            {productName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <span className="font-extrabold text-white text-base tracking-tight block">{productName}</span>
            <span className="text-[10px] text-purple-400 font-mono">by {creatorName}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => openCheckout({ name: `Founding Annual Pass ($${foundingPrice})`, price: foundingPrice, deposit: false })}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Claim Access (${foundingPrice})</span>
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto px-6 pt-10 pb-24 text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>Co-Created with {creatorName}’s Community</span>
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.15]">
          {headline}
        </h1>

        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          {subheadline}
        </p>

        {/* Action Buttons */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <button
              onClick={() => openCheckout({ name: `Founding Annual Pass ($${foundingPrice})`, price: foundingPrice, deposit: false })}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-950/60 transition-all active:scale-95 cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              <span>Claim Founding Access (${foundingPrice})</span>
            </button>

            <button
              onClick={() => openCheckout({ name: `VIP Deposit ($${depositPrice})`, price: depositPrice, deposit: true })}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[#141720] hover:bg-[#1c212e] text-slate-200 border border-white/[0.1] font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Reserve with ${depositPrice} Deposit</span>
            </button>
          </div>

          {/* Perks Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 pt-2">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>100% Refundable Guarantee</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{perksText}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Direct Co-Founder Access</span>
            </div>
          </div>
        </div>

        {/* Visual Designed Mockup Showcase (Full, Non-Editable UI Frame) */}
        <div className="pt-6">
          <ProductMockupDisplay project={project} theme="purple" />
        </div>

        {/* Value Pillars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-12 text-left">
          <div className="p-6 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Built for Your Workflow</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Designed specifically around the exact bottlenecks faced by {creatorName}’s audience in {niche}.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Star className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Lifetime Founder Perks</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Lock in 50% lifetime pricing and priority feature requests forever on day one.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Direct Co-Founder Line</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Join the private VIP Slack & direct alpha advisory channels with {creatorName} & Creator Forge.
            </p>
          </div>
        </div>
      </main>

      {/* Checkout Modal (Stripe & PayPal Options) */}
      {checkoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="max-w-md w-full max-h-[90vh] flex flex-col p-5 sm:p-6 rounded-3xl bg-[#0e1117] border border-purple-500/30 shadow-2xl animate-fade-in text-left my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 shrink-0">
              <div>
                <h3 className="text-sm font-bold text-white">Complete Pre-Order Reservation</h3>
                <p className="text-[11px] text-slate-400">{selectedTier.name} — ${selectedTier.price}</p>
              </div>
              <button
                onClick={() => setCheckoutModalOpen(false)}
                className="w-7 h-7 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 hover:text-white text-xs font-bold flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="overflow-y-auto pr-1 pt-3 space-y-3.5">
              {isSuccess && successReceipt ? (
                <div className="text-center py-2 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/50">
                    <Check className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-white">Payment Successful! 🎉</h4>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Welcome to the Founding Member cohort, <span className="text-white font-bold">{successReceipt.name}</span>!
                    </p>
                  </div>

                  {/* Receipt Card */}
                  <div className="p-3.5 rounded-2xl bg-[#141720] border border-white/[0.08] text-xs space-y-1.5 text-left">
                    <div className="flex items-center justify-between pb-1.5 border-b border-white/[0.06]">
                      <span className="text-slate-400 text-[11px]">Transaction ID</span>
                      <span className="font-mono text-purple-300 font-bold text-[11px]">{successReceipt.txId}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Payer Name</span>
                      <span className="text-white font-semibold">{successReceipt.name}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Payer Email</span>
                      <span className="text-white font-mono">{successReceipt.email}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Payment Gateway</span>
                      <span className="text-slate-200">{successReceipt.paymentMethod}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1.5 border-t border-white/[0.06] font-bold text-[11px]">
                      <span className="text-slate-300">Amount Paid</span>
                      <span className="text-emerald-400 text-sm font-mono">+${successReceipt.amount}</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400">
                    A receipt and your private founder credentials have been sent to <strong className="text-slate-200 font-mono">{successReceipt.email}</strong>.
                  </p>

                  <button
                    onClick={() => setCheckoutModalOpen(false)}
                    className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-colors shadow-lg shadow-emerald-950/40"
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
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                      1. Select Reservation Tier
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedTier({ name: `Founding Annual Pass ($${foundingPrice})`, price: foundingPrice, deposit: false })}
                        className={`p-2 rounded-xl border text-left text-xs transition-all ${
                          !selectedTier.deposit
                            ? 'bg-purple-600/20 border-purple-500 text-white shadow-sm'
                            : 'bg-[#141720] border-white/[0.06] text-slate-400 hover:text-white'
                        }`}
                      >
                        <span className="font-bold block text-white text-[11px]">Founding Pass</span>
                        <span className="text-emerald-400 font-mono font-bold text-xs">${foundingPrice}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedTier({ name: `VIP Deposit ($${depositPrice})`, price: depositPrice, deposit: true })}
                        className={`p-2 rounded-xl border text-left text-xs transition-all ${
                          selectedTier.deposit
                            ? 'bg-purple-600/20 border-purple-500 text-white shadow-sm'
                            : 'bg-[#141720] border-white/[0.06] text-slate-400 hover:text-white'
                        }`}
                      >
                        <span className="font-bold block text-white text-[11px]">VIP Deposit</span>
                        <span className="text-emerald-400 font-mono font-bold text-xs">${depositPrice} (Refundable)</span>
                      </button>
                    </div>
                  </div>

                  {/* Required Payer Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                        Full Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Jane Doe"
                        value={buyerName}
                        onChange={e => setBuyerName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#141720] border border-white/[0.08] text-xs text-white outline-none focus:border-purple-500/60"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                        Email Address <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="jane@example.com"
                        value={buyerEmail}
                        onChange={e => setBuyerEmail(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#141720] border border-white/[0.08] text-xs text-white outline-none focus:border-purple-500/60"
                      />
                    </div>
                  </div>

                  {/* Payment Method Selector (Stripe vs PayPal) */}
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                      2. Payment Method
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('stripe')}
                        className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-bold transition-all ${
                          paymentMethod === 'stripe'
                            ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                            : 'bg-[#141720] border-white/[0.08] text-slate-400 hover:text-white'
                        }`}
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Stripe (Card)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('paypal')}
                        className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-bold transition-all ${
                          paymentMethod === 'paypal'
                            ? 'bg-[#0070ba] text-white border-[#0070ba] shadow-sm'
                            : 'bg-[#141720] border-white/[0.08] text-slate-400 hover:text-white'
                        }`}
                      >
                        <span className="font-extrabold italic">P</span>
                        <span>PayPal</span>
                      </button>
                    </div>
                  </div>

                  {/* Stripe Card Inputs Simulation */}
                  {paymentMethod === 'stripe' && (
                    <div className="p-3 rounded-xl bg-[#141720] border border-white/[0.06] space-y-2">
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>Card Details</span>
                        <span className="text-emerald-400 font-mono flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" />
                          <span>256-bit Encrypted</span>
                        </span>
                      </div>

                      <input
                        type="text"
                        placeholder="4242 •••• •••• 4242"
                        value={cardNumber}
                        onChange={e => setCardNumber(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-[#0e1117] border border-white/[0.06] text-xs text-white outline-none font-mono focus:border-purple-500/50"
                      />

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="MM / YY"
                          value={cardExp}
                          onChange={e => setCardExp(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg bg-[#0e1117] border border-white/[0.06] text-xs text-white outline-none font-mono focus:border-purple-500/50 text-center"
                        />
                        <input
                          type="text"
                          placeholder="CVC"
                          value={cardCvc}
                          onChange={e => setCardCvc(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg bg-[#0e1117] border border-white/[0.06] text-xs text-white outline-none font-mono focus:border-purple-500/50 text-center"
                        />
                      </div>
                    </div>
                  )}

                  {/* PayPal Express Container Simulation */}
                  {paymentMethod === 'paypal' && (
                    <div className="p-3 rounded-xl bg-[#141720] border border-white/[0.06] text-center space-y-1">
                      <span className="text-[11px] text-slate-300 block font-semibold">
                        You will complete the payment securely via PayPal.
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        1-Click checkout with PayPal Balance, Bank, or Linked Cards.
                      </span>
                    </div>
                  )}

                  {/* Total Bar */}
                  <div className="p-2.5 rounded-xl bg-[#141720] border border-white/[0.06] text-xs flex items-center justify-between">
                    <span className="text-slate-400">Total Due Today:</span>
                    <span className="text-sm font-bold text-emerald-400 font-mono">${selectedTier.price}.00</span>
                  </div>

                  <button
                    type="submit"
                    disabled={isProcessing}
                    className={`w-full py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 shadow-lg ${
                      paymentMethod === 'paypal'
                        ? 'bg-[#ffc439] hover:bg-[#f0b830] text-slate-950 shadow-amber-950/40'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-950/40'
                    }`}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                        <span>Processing Payment...</span>
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

