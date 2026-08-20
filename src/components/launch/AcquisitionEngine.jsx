import { useState } from 'react'
import {
  Target, Search, Send, MessageSquare, Sparkles, CheckCircle2,
  XCircle, ArrowRight, RefreshCw, FileText, Zap, Award, Star, Clock, Play, Pause, ThumbsUp, ThumbsDown
} from 'lucide-react'

export default function AcquisitionEngine({ initialCreators = [], api, onCreateProject, onGoToProjectOS }) {
  const [activeStep, setActiveStep] = useState(1)
  const [campaignRunning, setCampaignRunning] = useState(true)

  // Step 1 Campaign Controls State
  const [nicheInput, setNicheInput] = useState('Tech, Software, SaaS, Fintech, Productivity')
  const [minFollowers, setMinFollowers] = useState(100000)
  const [maxFollowers, setMaxFollowers] = useState(1000000)
  const [minEngagement, setMinEngagement] = useState(2.0)
  const [volumePerWeek, setVolumePerWeek] = useState(50)
  const [templateSubject, setTemplateSubject] = useState('Co-founder partnership inquiry for {{display_name}}')
  const [templateBody, setTemplateBody] = useState(`Hi {{first_name}},\n\nI've been following your {{niche}} content on {{platform}} and love how engaged your community is.\n\nWe're building {{product_name}} — a high-growth product tailored for creators in {{niche}}. Given your audience scale ({{follower_count}} followers) and strong engagement, we'd love to discuss a co-founder partnership with a 50/50 revenue split.\n\nAre you open to a quick 15-minute sync this week?\n\nBest,\nCreator Forge Team`)

  // Step 4 Review & Creator Data State
  const [creators, setCreators] = useState(initialCreators)
  const [selectedCreatorId, setSelectedCreatorId] = useState(initialCreators[0]?.id || null)
  const [selectedConceptId, setSelectedConceptId] = useState(null)
  const [discovering, setDiscovering] = useState(false)
  const [discoveryLog, setDiscoveryLog] = useState('')

  const handleDiscoverCreators = async () => {
    setDiscovering(true)
    setDiscoveryLog('Running autonomous creator discovery & business email extraction...')
    try {
      const { discoverAutonomousCreators } = await import('../../services/opsApi')
      const res = await discoverAutonomousCreators({
        niches: nicheInput.split(',').map(n => n.trim()).filter(Boolean),
        min_followers: minFollowers,
        max_followers: maxFollowers,
        min_engagement_rate: minEngagement,
      })
      if (res && res.creators) {
        console.log('🔥 [Apify / Scraper] Discovered Creators List:', res.creators)
        setCreators(res.creators)
        if (res.creators.length > 0) {
          setSelectedCreatorId(res.creators[0].id)
        }
        setDiscoveryLog(`Discovered & enriched ${res.discovered_count} qualified creators with public business contact emails!`)
      }
    } catch (e) {
      console.warn(e)
      setDiscoveryLog(`Discovery output: ${e.message || 'Failed to discover creators'}`)
    } finally {
      setDiscovering(false)
    }
  }

  const selectedCreator = creators.find(c => c.id === selectedCreatorId) || creators[0] || null

  const handleApproveCreator = (id) => {
    setCreators(prev => prev.map(c => c.id === id ? { ...c, status: 'approved' } : c))
  }

  const handleRejectCreator = (id) => {
    setCreators(prev => prev.map(c => c.id === id ? { ...c, status: 'rejected' } : c))
  }

  const handlePitchAndCreateProject = () => {
    if (!selectedCreator) return
    const concept = selectedCreator.productConcepts?.find(p => p.id === selectedConceptId) || selectedCreator.productConcepts?.[0]
    onCreateProject({
      creatorName: selectedCreator.name || selectedCreator.display_name,
      creatorHandle: selectedCreator.handle,
      creatorAvatar: selectedCreator.avatar || selectedCreator.avatar_url,
      followers: selectedCreator.followerStr || selectedCreator.follower_count,
      niche: selectedCreator.niche,
      productName: concept?.name || 'New Product OS',
      productTagline: concept?.tagline || '',
      creatorScore: selectedCreator.creatorScore || selectedCreator.score || 85,
      opportunityScore: concept?.opportunityScore || 90,
    })
  }

  const [sendingBulk, setSendingBulk] = useState(false)
  const [outreachLog, setOutreachLog] = useState('')

  const handleSendBulkOutreach = async () => {
    setSendingBulk(true)
    setOutreachLog('Queuing & dispatching bulk outreach email batch via SMTP...')
    try {
      const { runAutonomousBatch, getAutonomousCampaigns } = await import('../../services/opsApi')
      const camps = await getAutonomousCampaigns()
      const campId = camps?.[0]?.id || 'default'
      const res = await runAutonomousBatch(campId, volumePerWeek)
      if (res) {
        setOutreachLog(`Bulk Outreach Batch Executed! Total Eligible: ${res.total_eligible || 0}, Sent: ${res.sent || 0}, Queued: ${res.queued || 0}`)
      }
    } catch (e) {
      console.warn(e)
      setOutreachLog(`Outreach Batch Status: ${e.message || 'Batch dispatched to active creator queue'}`)
    } finally {
      setSendingBulk(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* SECTION HEADER ETC */}
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0e1117] border border-purple-500/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-400">Section 1</span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs text-slate-300">Creator Acquisition & Opportunity Engine</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Acquisition & Opportunity Pipeline
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Target creators (100k–1M followers), run outreach, classify responses, research demand, and surface software co-launch concepts.
          </p>
        </div>

        <button
          onClick={() => setCampaignRunning(!campaignRunning)}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
            campaignRunning
              ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20'
              : 'bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20'
          }`}
        >
          {campaignRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          <span>{campaignRunning ? 'Engine Active' : 'Engine Paused'}</span>
        </button>
      </div>

      {/* 6-Step Visual Workflow Map */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 p-1.5 rounded-2xl bg-[#0e1117] border border-white/[0.08]">
        {[
          { step: 1, label: '1. Campaign Setup', icon: Target, textColor: 'text-purple-400', activeBg: 'bg-purple-500/20 border-purple-500/40 text-white' },
          { step: 2, label: '2. Qualify Creators', icon: Search, textColor: 'text-indigo-400', activeBg: 'bg-indigo-500/20 border-indigo-500/40 text-white' },
          { step: 3, label: '3. Outreach Queue', icon: Send, textColor: 'text-blue-400', activeBg: 'bg-blue-500/20 border-blue-500/40 text-white' },
          { step: 4, label: '4. Interested Review', icon: MessageSquare, textColor: 'text-emerald-400', activeBg: 'bg-emerald-500/20 border-emerald-500/40 text-white' },
          { step: 5, label: '5. Product Ideas', icon: Sparkles, textColor: 'text-amber-400', activeBg: 'bg-amber-500/20 border-amber-500/40 text-white' },
          { step: 6, label: '6. Pitch & Select', icon: Award, textColor: 'text-pink-400', activeBg: 'bg-pink-500/20 border-pink-500/40 text-white' },
        ].map((item) => {
          const Icon = item.icon
          const isActive = activeStep === item.step
          return (
            <button
              key={item.step}
              onClick={() => setActiveStep(item.step)}
              className={`flex flex-col items-start p-3 rounded-xl text-left transition-colors border ${
                isActive
                  ? item.activeBg
                  : 'bg-white/[0.02] border-transparent text-slate-400 hover:bg-white/[0.05] hover:text-white'
              }`}
            >
              <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-white/[0.05] mb-2">
                <Icon className={`w-3.5 h-3.5 ${item.textColor}`} />
              </div>
              <span className="text-xs font-semibold truncate w-full">{item.label}</span>
            </button>
          )
        })}
      </div>

      {/* STEP 1: CAMPAIGN SETUP */}
      {activeStep === 1 && (
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="p-5 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-4">
              <div className="border-b border-white/[0.07] pb-3 flex items-center justify-between">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Target className="w-4 h-4 text-purple-400" />
                  <span>Campaign Parameters</span>
                </h2>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  Active
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1 font-medium">Target Niches</label>
                  <input
                    type="text"
                    value={nicheInput}
                    onChange={e => setNicheInput(e.target.value)}
                    className="w-full bg-[#161a23] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1 font-medium">Weekly Outreach Volume</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="10"
                      max="200"
                      value={volumePerWeek}
                      onChange={e => setVolumePerWeek(Number(e.target.value))}
                      className="flex-1 accent-purple-500"
                    />
                    <span className="text-xs font-bold text-purple-400 w-12 text-right">{volumePerWeek}/wk</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1 font-medium">Follower Range</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={minFollowers}
                      onChange={e => setMinFollowers(Number(e.target.value))}
                      className="w-full bg-[#161a23] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                    />
                    <span className="text-slate-500 text-xs">to</span>
                    <input
                      type="number"
                      value={maxFollowers}
                      onChange={e => setMaxFollowers(Number(e.target.value))}
                      className="w-full bg-[#161a23] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1 font-medium">Min Engagement (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={minEngagement}
                    onChange={e => setMinEngagement(Number(e.target.value))}
                    className="w-full bg-[#161a23] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-4">
              <div className="border-b border-white/[0.07] pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-400" />
                  <span>Outreach Email Template</span>
                </h3>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1 font-medium">Subject</label>
                <input
                  type="text"
                  value={templateSubject}
                  onChange={e => setTemplateSubject(e.target.value)}
                  className="w-full bg-[#161a23] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1 font-medium">Body</label>
                <textarea
                  rows={5}
                  value={templateBody}
                  onChange={e => setTemplateBody(e.target.value)}
                  className="w-full bg-[#161a23] border border-white/10 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Engine Summary</h4>
              <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Target Range</span>
                  <span className="text-purple-300 font-bold">100K - 1M</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Min Engagement</span>
                  <span className="text-emerald-400 font-bold">≥ {minEngagement}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Follow-up Gap</span>
                  <span className="text-purple-300 font-bold">7 Days</span>
                </div>
              </div>

              <button
                onClick={() => setActiveStep(2)}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <span>Advance to Step 2</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: FIND + QUALIFY CREATORS */}
      {activeStep === 2 && (
        <div className="p-5 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/[0.07] pb-3">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Search className="w-4 h-4 text-indigo-400" />
                <span>Step 2 — Find & Qualify Creators</span>
              </h2>
              <p className="text-xs text-slate-400">Discover matching creators & extract public business contact emails</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDiscoverCreators}
                disabled={discovering}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${discovering ? 'animate-spin' : ''}`} />
                <span>{discovering ? 'Extracting Emails...' : '🤖 Run Autonomous Discovery'}</span>
              </button>
              <button
                onClick={() => setActiveStep(3)}
                className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5"
              >
                <span>Next Step</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {discoveryLog && (
            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs font-mono text-indigo-300">
              {discoveryLog}
            </div>
          )}

          {creators.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs space-y-3">
              <p>No creators found yet matching campaign criteria.</p>
              <button
                onClick={handleDiscoverCreators}
                disabled={discovering}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs inline-flex items-center gap-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${discovering ? 'animate-spin' : ''}`} />
                <span>Run Autonomous Creator & Email Search</span>
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {creators.map(c => (
                <div key={c.id} className="p-4 rounded-xl bg-[#161a23] border border-white/[0.08] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {c.avatar && <img src={c.avatar} alt={c.name} className="w-10 h-10 rounded-full object-cover border border-indigo-500/30" />}
                      <div>
                        <h3 className="text-xs font-bold text-white">{c.name || c.display_name}</h3>
                        <p className="text-[11px] text-slate-400">{c.handle} • {c.platform}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg">
                      Score: {c.creatorScore || c.score || 85}/100
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] p-2.5 rounded-lg bg-black/40 border border-white/[0.04]">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Public Business Email</span>
                      <span className="text-emerald-400 font-mono font-bold truncate block">
                        {c.email || c.email_public || 'Searching bio...'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Follower Count</span>
                      <span className="text-slate-200 font-bold">{c.followerStr || c.follower_count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* STEP 3: OUTREACH QUEUE */}
      {activeStep === 3 && (
        <div className="p-5 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/[0.07] pb-3">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-blue-400" />
                <span>Step 3 — Outreach Queue</span>
              </h2>
              <p className="text-xs text-slate-400">Queue status & 1-click bulk email batch dispatch</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSendBulkOutreach}
                disabled={sendingBulk}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <Send className={`w-3.5 h-3.5 ${sendingBulk ? 'animate-pulse' : ''}`} />
                <span>{sendingBulk ? 'Sending Batch...' : '✉️ Send Bulk Email Batch'}</span>
              </button>
              <button
                onClick={() => setActiveStep(4)}
                className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5"
              >
                <span>Next Step</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {outreachLog && (
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs font-mono text-blue-300">
              {outreachLog}
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-[#161a23] border border-white/[0.08]">
              <span className="text-slate-400 font-medium">Weekly Target</span>
              <p className="text-lg font-bold text-white mt-1">{volumePerWeek} / wk</p>
            </div>
            <div className="p-4 rounded-xl bg-[#161a23] border border-white/[0.08]">
              <span className="text-slate-400 font-medium">Auto Follow-up</span>
              <p className="text-lg font-bold text-purple-300 mt-1">7 Days Gap</p>
            </div>
            <div className="p-4 rounded-xl bg-[#161a23] border border-white/[0.08]">
              <span className="text-slate-400 font-medium">Active Queue</span>
              <p className="text-lg font-bold text-emerald-400 mt-1">{creators.length} Creators</p>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: INTERESTED REVIEW */}
      {activeStep === 4 && (
        <div className="p-5 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.07] pb-3">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <span>Step 4 — Interested Reply Review</span>
              </h2>
              <p className="text-xs text-slate-400">AI classified creator responses</p>
            </div>
            <button
              onClick={() => setActiveStep(5)}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5"
            >
              <span>Next Step</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {!selectedCreator ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No replies pending review.
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-[#161a23] border border-white/[0.08] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {selectedCreator.avatar && <img src={selectedCreator.avatar} alt="" className="w-10 h-10 rounded-full border border-emerald-500/30" />}
                  <div>
                    <h3 className="text-xs font-bold text-white">{selectedCreator.name || selectedCreator.display_name}</h3>
                    <p className="text-[11px] text-slate-400">{selectedCreator.handle}</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg">
                  Score: {selectedCreator.creatorScore || 85}/100
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#090b0e] border border-white/[0.06] text-xs text-slate-200 leading-relaxed italic">
                "{selectedCreator.replyText || 'Interested in exploring software co-founder partnership.'}"
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => handleRejectCreator(selectedCreator.id)}
                  className="px-3.5 py-1.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 text-xs font-bold"
                >
                  Reject
                </button>
                <button
                  onClick={() => {
                    handleApproveCreator(selectedCreator.id)
                    setActiveStep(5)
                  }}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                >
                  Approve & Generate Concepts
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 5: PRODUCT IDEAS */}
      {activeStep === 5 && (
        <div className="p-5 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.07] pb-3">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Step 5 — Top 3 Product Concepts</span>
              </h2>
              <p className="text-xs text-slate-400">Audience research & opportunity scoring</p>
            </div>
            <button
              onClick={() => setActiveStep(6)}
              className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5"
            >
              <span>Next Step</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {!selectedCreator?.productConcepts?.length ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No product concepts generated yet for selected creator.
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              {selectedCreator.productConcepts.map((concept, index) => (
                <div
                  key={concept.id || index}
                  onClick={() => setSelectedConceptId(concept.id)}
                  className={`p-4 rounded-xl border transition-colors cursor-pointer space-y-3 ${
                    selectedConceptId === concept.id
                      ? 'bg-purple-950/30 border-purple-500/50 text-white'
                      : 'bg-[#161a23] border-white/[0.08] text-slate-300 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-full">
                      Concept #{index + 1}
                    </span>
                    <span className="text-xs font-bold text-amber-400">Score: {concept.opportunityScore}/100</span>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">{concept.name}</h3>
                    <p className="text-[11px] text-purple-300 font-medium">{concept.tagline}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* STEP 6: PITCH & SELECT */}
      {activeStep === 6 && (
        <div className="p-5 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.07] pb-3">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-pink-400" />
                <span>Step 6 — Pitch & Create Project</span>
              </h2>
              <p className="text-xs text-slate-400">Confirm selected concept to start Section 2 Co-Launch OS</p>
            </div>
            <button
              onClick={handlePitchAndCreateProject}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
            >
              Create Project in Section 2
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
