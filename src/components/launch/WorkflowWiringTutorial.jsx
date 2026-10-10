import React, { useState, useEffect } from 'react'
import {
  Workflow, GitFork, ArrowRight, CheckCircle2, ShieldCheck, Sparkles,
  Layers, Database, Server, Lock, DollarSign, Activity, FileText,
  Mail, Users, Target, Compass, X, ChevronRight, Eye, Check,
  Zap, Laptop, AlertCircle, RefreshCw, Award, Code2, Play
} from 'lucide-react'

const STORAGE_KEY = 'forge_workflow_tutorial_dismissed'

export const WORKFLOW_STAGES = [
  {
    id: 's1_acquisition',
    title: 'Section 1: Acquisition Engine',
    subtitle: 'Creator Discovery & Concept Blueprinting',
    phaseNumber: 'S1',
    badge: 'Discovery & Pitch',
    color: 'amber',
    accentHex: '#d97706',
    borderClass: 'border-amber-300',
    bgClass: 'bg-amber-50',
    textClass: 'text-amber-900',
    summary: 'Identify high-engagement creator channels, audit audience pain points from video transcripts, pitch a 50/50 software co-venture, and select a winning software concept.',
    steps: [
      {
        id: 's1_step1',
        title: 'Step 1: Campaign Setup',
        whatHappens: 'Operator configures campaign targeting, selects creator niches (e.g. Software, Mobile Dev, Electronics Repair), specifies platform filters, and sets candidate search parameters.',
        wiringInput: 'Operator niche preferences, platform filters, and qualification parameters.',
        wiringOutput: 'Active campaign queries broadcast to autonomous scraper and qualification bus.',
        howToFulfill: 'Select or add target niches, filter platforms, and click "Proceed to Find & Qualify".'
      },
      {
        id: 's1_step2',
        title: 'Step 2: Find & Qualify',
        whatHappens: 'Autonomous scraping extracts creator subscribers, average views, engagement rate, channel bios, and direct contact emails.',
        wiringInput: 'Campaign niche parameters and qualification filters.',
        wiringOutput: 'Structured creator dossiers with validated reach, contact emails, and engagement scores.',
        howToFulfill: 'Click "Start Autonomous Discovery" or add creators. Review scraped dossiers and qualify channels.'
      },
      {
        id: 's1_step3',
        title: 'Step 3: Direct Outreach',
        whatHappens: 'Generates personalized cold emails citing specific channel content and shared 50/50 partnership economics, dispatched via integrated SMTP.',
        wiringInput: 'Creator dossiers, contact emails, and channel grounding signals.',
        wiringOutput: 'Dispatched cold outreach emails with IMAP reply monitoring & thread tracking.',
        howToFulfill: 'Review personalized email drafts, refine messaging if desired, and click "Dispatch Cold Outreach".'
      },
      {
        id: 's1_step4',
        title: 'Step 4: Interested Review',
        whatHappens: 'Monitors real inbound email replies via IMAP. AI classifies creator sentiment (Interested, Awaiting, Declined) and alerts the operator.',
        wiringInput: 'Inbound creator email responses via IMAP thread sync.',
        wiringOutput: 'Sentiment-classified leads ready for concept development and audience intelligence.',
        howToFulfill: 'Review incoming creator replies, inspect sentiment badges, and approve interested creators to advance to Step 5.'
      },
      {
        id: 's1_step5',
        title: 'Step 5: Audience & Ideas',
        whatHappens: 'AI conducts deep audience research from transcripts and comments, then autonomously synthesizes 3 distinct software concepts with tiered pricing and UI mockups.',
        wiringInput: 'Creator channel metrics, video transcripts, community pain points, and optional prompt steering.',
        wiringOutput: 'Deep 7-pillar audience research intelligence + 3 tailored software product concepts.',
        howToFulfill: 'Watch AI synthesize audience intelligence and 3 software concepts live (with skeleton loader). Refine concepts with steering prompts or edit fields.'
      },
      {
        id: 's1_step6',
        title: 'Step 6: Pitch & Select',
        whatHappens: 'Operator reviews the software concepts with the creator, selects the winning concept, and initializes the Co-Launch Venture into Section 2.',
        wiringInput: 'Approved software concept blueprints and verified creator partnership agreement.',
        wiringOutput: 'Primary Chosen Concept locked into MongoDB co_launch_projects and synchronized to Section 2 (Phase 1).',
        howToFulfill: 'Select the winning concept (e.g. Concept 1), verify partnership commitment, and click "Lock Concept & Initialize Venture".'
      }
    ]
  },
  {
    id: 's2_phase1',
    title: 'Phase 1: Validation Sprint',
    subtitle: 'Section 2 — Zero-Code Validation & Presales',
    phaseNumber: '01',
    badge: 'Presales Validation',
    color: 'emerald',
    accentHex: '#059669',
    borderClass: 'border-emerald-300',
    bgClass: 'bg-emerald-50',
    textClass: 'text-emerald-900',
    summary: 'Validate commercial demand with a live landing page, multi-channel creator campaign kit, and actual paid customer deposits before writing a single line of backend code.',
    steps: [
      {
        id: 'p1_step1',
        title: 'Step 1: Validation Plan Specification',
        whatHappens: 'Defines the Target Customer (ICP), Core Problem Statement, Value Proposition Offer, and Founding Pricing Model ($49 deposit / $149 lifetime).',
        wiringInput: 'Chosen Concept data wired directly from Section 1 Step 5.',
        wiringOutput: 'Approved Validation Plan synchronized to MongoDB co_launch_projects collection.',
        howToFulfill: 'Review AI-generated customer, problem, and offer fields. Edit or refine details, then click "Lock & Save Validation Plan".'
      },
      {
        id: 'p1_step2',
        title: 'Step 2: Brand Identity & Landing Page Assets',
        whatHappens: 'Generates the live public landing page (/preorder/{slug}), hero copy, brand color tokens, and interactive software mockup.',
        wiringInput: 'Validation Plan + Selected Concept features.',
        wiringOutput: 'Live public preorder URL + Stripe deposit checkout infrastructure.',
        howToFulfill: 'Customize the product name, hero headline, and feature pills. Click "Open Public Preorder Page" to test live.'
      },
      {
        id: 'p1_step3',
        title: 'Step 3: Launch Campaigns (Multi-Channel Kit)',
        whatHappens: 'Generates ready-to-post creator copy: social launch posts, 5-day Instagram/X story arc, YouTube video sponsor script, newsletter draft, and DM scripts.',
        wiringInput: 'Product Positioning + Preorder checkout link.',
        wiringOutput: 'Campaign Kit copy + Optional autonomous email delivery to creator.',
        howToFulfill: 'Copy posts or download the Campaign Kit. Provide copy to creator for scheduled release.'
      },
      {
        id: 'p1_step4',
        title: 'Step 4: Live Optimization & Traffic Telemetry',
        whatHappens: 'Monitors real-time visitor traffic, reservation deposit count, conversion rates, and qualitative survey answers.',
        wiringInput: 'Real preorders & survey responses via public checkout.',
        wiringOutput: 'Presales Revenue progress bar ($12,500 target) + ICP interest clustering.',
        howToFulfill: 'Track metrics as the creator posts. Test attribution experiments and review audience sentiment.'
      },
      {
        id: 'p1_step5',
        title: 'Step 5: Validation Decision Gate',
        whatHappens: 'Formal evaluation milestone. Determines if sufficient buyer deposits and validation signals were collected to greenlight MVP development.',
        wiringInput: 'Current Presales Revenue vs. Target ($12,500).',
        wiringOutput: 'Unlocks Phase 2: MVP Rapid Build.',
        howToFulfill: 'Review the validation summary. Click "Approve Validation & Advance to Phase 2 Build".'
      }
    ]
  },
  {
    id: 's2_phase2',
    title: 'Phase 2: MVP Rapid Build',
    subtitle: 'Section 2 — Engineering & Code Studio',
    phaseNumber: '02',
    badge: 'Rapid Build',
    color: 'blue',
    accentHex: '#2563eb',
    borderClass: 'border-blue-300',
    bgClass: 'bg-blue-50',
    textClass: 'text-blue-900',
    summary: 'Turn the validated offer into real software using AI scaffold generation, division-of-labor engineering tasks, automated QA test suites, and private backer beta cohorts.',
    steps: [
      {
        id: 'p2_step1',
        title: 'Step 1: Product & Technical Spec',
        whatHappens: 'AI architects the database schema, API contracts, frontend component tree, and divides engineering labor into discrete tasks.',
        wiringInput: 'Phase 1 Validated Offer + Core Feature list.',
        wiringOutput: 'Engineering Task Board (Task status, code scaffolds, priority).',
        howToFulfill: 'Click "AI Generate MVP Build Plan". Review technical architecture and approve task scope.'
      },
      {
        id: 'p2_step2',
        title: 'Step 2: Cloud Code Studio & QA Execution',
        whatHappens: 'Executes automated code generation, unit tests (34 tests), integration routes (18 tests), and end-to-end workflow verification.',
        wiringInput: 'Engineering tasks & project repository files.',
        wiringOutput: '100% Passing QA Test Report + Live component sandbox preview.',
        howToFulfill: 'Open Cloud Code Studio, inspect generated code files, and click "Run Full Automated QA Suite".'
      },
      {
        id: 'p2_step3',
        title: 'Step 3: VIP Beta Cohort & Feedback Clusters',
        whatHappens: 'Backers who paid presale deposits in Phase 1 receive VIP access passes. AI clusters user bug reports and feature feedback into actionable patches.',
        wiringInput: 'Phase 1 Preorder customer list (reservations).',
        wiringOutput: 'Clustered user feedback + Release Readiness Score (0-100%).',
        howToFulfill: 'Issue private beta invitations. Review incoming feedback clusters and mark critical patches as applied.'
      },
      {
        id: 'p2_step4',
        title: 'Step 4: Production Release Gate',
        whatHappens: 'Final engineering review verifying zero critical bugs, >90% test coverage, and complete creator approval.',
        wiringInput: 'QA results + Readiness Report + Beta sign-offs.',
        wiringOutput: 'Unlocks Phase 3: Public Launch & Delivery.',
        howToFulfill: 'Verify green status across all 4 release criteria. Click "Sign Off & Advance to Phase 3 Launch".'
      }
    ]
  },
  {
    id: 's2_phase3',
    title: 'Phase 3: Public Launch & Deliver',
    subtitle: 'Section 2 — Live Go-To-Market & Revenue Operations',
    phaseNumber: '03',
    badge: 'Live Launch',
    color: 'purple',
    accentHex: '#7c3aed',
    borderClass: 'border-purple-300',
    bgClass: 'bg-purple-50',
    textClass: 'text-purple-900',
    summary: 'Coordinate a synchronized public launch across the creator’s audience, monitor real-time server health and revenue, manage promo drops, and scale monthly recurring revenue.',
    steps: [
      {
        id: 'p3_step1',
        title: 'Step 1: Launch Prep & Strategy',
        whatHappens: 'Establishes the public launch countdown, server auto-scaling, creator promo schedule, and launch day email blasts.',
        wiringInput: 'Approved MVP build + Creator communication calendar.',
        wiringOutput: 'Launch Checklist sign-offs + Live deployment trigger.',
        howToFulfill: 'Complete the Launch Prep checklist. Click "Initialize Public Launch".'
      },
      {
        id: 'p3_step2',
        title: 'Step 2: Live War Room Monitor',
        whatHappens: 'Real-time telemetry tracking live concurrent users, checkout conversion rates, Stripe revenue spikes, and system response latency.',
        wiringInput: 'Live web telemetry & Stripe webhooks.',
        wiringOutput: 'Live MRR counter + Server status indicators.',
        howToFulfill: 'Monitor live metrics during the first 48 hours of launch. Address any operational alerts.'
      },
      {
        id: 'p3_step3',
        title: 'Step 3: Creator Campaign Manager',
        whatHappens: 'Tracks creator deliverables (pinned comments, community posts, dedicated video mentions) and calculates 50/50 profit splits.',
        wiringInput: 'Social links & affiliate attribution codes.',
        wiringOutput: 'Creator payout ledger + Referral conversion rankings.',
        howToFulfill: 'Log live campaign drops and review revenue generated per post channel.'
      },
      {
        id: 'p3_step4',
        title: 'Step 4: Venture Retrospective & Scale',
        whatHappens: 'Analyzes churn metrics, customer lifetime value (LTV), feature request trends, and prepares enterprise/annual pricing upgrades.',
        wiringInput: '30-day cohort retention data.',
        wiringOutput: 'Compound Growth Roadmap + Scale Phase Strategy.',
        howToFulfill: 'Review 30-day revenue analytics and approve long-term feature roadmap.'
      }
    ]
  }
]

export default function WorkflowWiringTutorial({ isOpen, onClose }) {
  const [selectedStageIndex, setSelectedStageIndex] = useState(0)
  const [selectedStepId, setSelectedStepId] = useState('s1_step1')
  const [activeView, setActiveView] = useState('wiring') // 'wiring' | 'steps' | 'wiringBus'
  const [dontShowAgain, setDontShowAgain] = useState(true)

  const activeStage = WORKFLOW_STAGES[selectedStageIndex]
  const activeStep = activeStage.steps.find(s => s.id === selectedStepId) || activeStage.steps[0]

  const handleDismiss = () => {
    if (typeof window !== 'undefined') {
      try {
        if (dontShowAgain) {
          localStorage.setItem(STORAGE_KEY, 'true')
        } else {
          localStorage.removeItem(STORAGE_KEY)
        }
      } catch (e) {
        console.warn('LocalStorage access warning:', e)
      }
    }
    if (onClose) onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[10000] bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-150">
      <div className="w-full max-w-5xl max-h-[92vh] flex flex-col rounded-3xl bg-white border border-slate-200 shadow-2xl text-slate-900 overflow-hidden transform-gpu">
        {/* Header Bar */}
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 flex items-center justify-center shrink-0">
              <Workflow className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  Creator Forge Co-Launch Architecture
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  Wiring Guide
                </span>
              </div>
              <p className="text-xs text-slate-500">
                End-to-end signal flow from cold creator acquisition to validated live software venture.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Switcher */}
            <div className="hidden sm:flex items-center bg-slate-200/70 p-0.5 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveView('wiring')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeView === 'wiring'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Wiring Architecture
              </button>
              <button
                type="button"
                onClick={() => setActiveView('steps')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeView === 'steps'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Step-by-Step Manual
              </button>
            </div>

            <button
              type="button"
              onClick={handleDismiss}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-all cursor-pointer"
              title="Close Tutorial"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stage Selection Pills */}
        <div className="px-5 py-3 border-b border-slate-200 bg-white grid grid-cols-2 md:grid-cols-4 gap-2 shrink-0">
          {WORKFLOW_STAGES.map((stg, idx) => {
            const isSelected = selectedStageIndex === idx
            return (
              <button
                key={stg.id}
                type="button"
                onClick={() => {
                  setSelectedStageIndex(idx)
                  setSelectedStepId(stg.steps[0].id)
                }}
                className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                  isSelected
                    ? `${stg.borderClass} ${stg.bgClass} shadow-xs ring-1 ring-${stg.color}-400/40`
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
                    isSelected ? stg.textClass : 'text-slate-500'
                  }`}>
                    {stg.badge}
                  </span>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-black ${
                    isSelected ? 'bg-white text-slate-900 shadow-2xs' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {stg.phaseNumber}
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-900 truncate">
                  {stg.title.split(':')[1] || stg.title}
                </div>
              </button>
            )
          })}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Signal Wiring Bus Visualizer */}
          <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3 relative overflow-hidden shadow-inner">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2">
                <GitFork className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-300">
                  Data Pipeline Wiring Bus
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                Stage {activeStage.phaseNumber} Active
              </span>
            </div>

            {/* Visual Bus Stream */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-center text-xs">
              <div className={`p-2.5 rounded-xl border transition-all ${
                selectedStageIndex === 0
                  ? 'bg-amber-950/60 border-amber-500/60 text-amber-200'
                  : 'bg-white/5 border-white/10 text-slate-400'
              }`}>
                <div className="text-[10px] font-mono uppercase text-slate-400">Section 1</div>
                <div className="font-bold text-xs truncate">Acquisition Engine</div>
                <div className="text-[10px] opacity-75 mt-0.5">Outputs: 6-Step Pipeline & Concept</div>
              </div>

              <div className={`p-2.5 rounded-xl border transition-all ${
                selectedStageIndex === 1
                  ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-200'
                  : 'bg-white/5 border-white/10 text-slate-400'
              }`}>
                <div className="text-[10px] font-mono uppercase text-slate-400">Phase 01</div>
                <div className="font-bold text-xs truncate">Preorder Validation</div>
                <div className="text-[10px] opacity-75 mt-0.5">Outputs: $12.5k Presales</div>
              </div>

              <div className={`p-2.5 rounded-xl border transition-all ${
                selectedStageIndex === 2
                  ? 'bg-blue-950/60 border-blue-500/60 text-blue-200'
                  : 'bg-white/5 border-white/10 text-slate-400'
              }`}>
                <div className="text-[10px] font-mono uppercase text-slate-400">Phase 02</div>
                <div className="font-bold text-xs truncate">MVP Rapid Build</div>
                <div className="text-[10px] opacity-75 mt-0.5">Outputs: Verified Code & QA</div>
              </div>

              <div className={`p-2.5 rounded-xl border transition-all ${
                selectedStageIndex === 3
                  ? 'bg-purple-950/60 border-purple-500/60 text-purple-200'
                  : 'bg-white/5 border-white/10 text-slate-400'
              }`}>
                <div className="text-[10px] font-mono uppercase text-slate-400">Phase 03</div>
                <div className="font-bold text-xs truncate">Public GTM Launch</div>
                <div className="text-[10px] opacity-75 mt-0.5">Outputs: Scaled MRR</div>
              </div>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
              {activeStage.summary}
            </p>
          </div>

          {/* Interactive Step Explorer */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Step Selection List */}
            <div className="lg:col-span-5 space-y-2">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 px-1">
                Steps in this Stage ({activeStage.steps.length})
              </h3>
              <div className="space-y-1.5">
                {activeStage.steps.map((st, idx) => {
                  const isCurStep = st.id === activeStep.id
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setSelectedStepId(st.id)}
                      className={`w-full p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isCurStep
                          ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                          isCurStep ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {idx + 1}
                        </span>
                        <div className="truncate">
                          <div className="font-bold text-xs truncate">{st.title}</div>
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 shrink-0 ${
                        isCurStep ? 'text-white' : 'text-slate-400'
                      }`} />
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Step Wiring Detail Card */}
            <div className="lg:col-span-7 p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                    Step Specification
                  </span>
                  <h4 className="text-sm font-black text-slate-900">
                    {activeStep.title}
                  </h4>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-white border border-slate-200 text-slate-700 shadow-2xs">
                  {activeStage.phaseNumber} • Step {activeStage.steps.findIndex(s => s.id === activeStep.id) + 1}
                </span>
              </div>

              {/* What Happens */}
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5 text-blue-600" />
                  <span>Objective & Purpose</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed bg-white p-3 rounded-xl border border-slate-200">
                  {activeStep.whatHappens}
                </p>
              </div>

              {/* Wiring Input / Output Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/80 space-y-1">
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1">
                    <ArrowRight className="w-3 h-3 text-amber-600 rotate-180" />
                    <span>Wiring Input (From)</span>
                  </div>
                  <p className="text-xs text-amber-950 font-medium">
                    {activeStep.wiringInput}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/80 space-y-1">
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1">
                    <ArrowRight className="w-3 h-3 text-emerald-600" />
                    <span>Wiring Output (To)</span>
                  </div>
                  <p className="text-xs text-emerald-950 font-medium">
                    {activeStep.wiringOutput}
                  </p>
                </div>
              </div>

              {/* How to Fulfill */}
              <div className="space-y-1 pt-1">
                <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>How to Complete in Creator Forge</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 font-medium leading-relaxed">
                  {activeStep.howToFulfill}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-600">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={e => setDontShowAgain(e.target.checked)}
              className="w-4 h-4 rounded text-slate-900 border-slate-300 focus:ring-slate-900"
            />
            <span>Remember in this browser (don’t show automatically on page refresh)</span>
          </label>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleDismiss}
              className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-all cursor-pointer"
            >
              Dismiss
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>I Understand the Workflow</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
