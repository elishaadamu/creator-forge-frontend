import { useState, useEffect } from 'react'
import {
  Sparkles, CheckCircle2, MessageSquare, Send, Star,
  HelpCircle, ArrowRight, ShieldCheck, Heart, Loader2
} from 'lucide-react'
import { getProjectBySlug, getCoLaunchProjects, recordSurveyResponseUniversal } from '../../services/opsApi'
import { trackVisit } from '../../services/tracker'
import { updatePageSEO } from '../../utils/seo'

export default function PublicSurveyPage({ slug }) {
  const [project, setProject] = useState(null)
  const [respondentName, setRespondentName] = useState('')
  const [respondentEmail, setRespondentEmail] = useState('')
  const [answers, setAnswers] = useState({})
  const [intentRating, setIntentRating] = useState(8)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  useEffect(() => {
    let isMounted = true
    const fetchProject = async () => {
      try {
        let fetched = null
        if (slug) {
          try {
            fetched = await getProjectBySlug(slug)
          } catch (e) {}
        }
        if (!fetched) {
          const all = await getCoLaunchProjects()
          const list = Array.isArray(all) ? all : all?.projects || []
          if (slug) {
            const clean = slug.toLowerCase().trim()
            fetched = list.find(p =>
              (p.slug && p.slug.toLowerCase() === clean) ||
              (p.productName && p.productName.toLowerCase().replace(/[^a-z0-9]+/g, '-') === clean) ||
              (p.id === clean)
            )
          }
          if (!fetched && list.length > 0) {
            fetched = list[0]
          }
        }
        if (isMounted && fetched) {
          setProject(fetched)
        }
      } catch (err) {
        console.warn('[PublicSurveyPage] Project fetch notice:', err)
      }
    }

    fetchProject()
    trackVisit(`/survey/${slug || 'product'}`, updated => {
      if (isMounted && updated) setProject(prev => ({ ...(prev || {}), ...updated }))
    })

    return () => {
      isMounted = false
    }
  }, [slug])

  useEffect(() => {
    updatePageSEO({
      title: project?.productName ? `Audience Survey — ${project.productName} | Creator Forge` : "Audience Discovery & Research Survey | Creator Forge",
      description: "Help shape our next software product! Share your biggest workflow challenges in 60 seconds.",
      image: "/og-image.svg"
    });
  }, [project?.productName]);

  const productName = project?.productName || 'Software Product'
  const creatorName = project?.creatorName || 'Creator'
  const niche = project?.niche || 'Software Workflows'
  
  const rawQuestions = project?.surveyData?.questions ||
    project?.validationCampaign?.researchSurvey?.questions ||
    project?.validationCampaign?.research_survey?.questions ||
    project?.discoverySurvey?.questions

  const questions = (Array.isArray(rawQuestions) && rawQuestions.length > 0)
    ? rawQuestions
    : [
        {
          id: 'q1',
          category: 'Pain Point',
          question: `What is the single most frustrating bottleneck you face when managing ${niche}?`
        },
        {
          id: 'q2',
          category: 'Current Spend',
          question: `What tools or services do you currently pay for monthly? Approximately how much do you spend?`
        },
        {
          id: 'q3',
          category: 'Pricing Validation',
          question: `If ${productName} automates this completely, would a founding member price of $99/year provide positive ROI?`
        },
        {
          id: 'q4',
          category: 'Feature Wishlist',
          question: `What is the #1 must-have feature you need in ${productName} on day one?`
        }
      ]

  const handleAnswerChange = (qId, val) => {
    setAnswers(prev => ({ ...prev, [qId]: val }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const responsePayload = {
        projectId: project?.id,
        slug: slug || project?.slug || project?.productName,
        name: respondentName.trim() || 'Community Member',
        email: respondentEmail.trim(),
        rating: intentRating,
        answers: answers
      }

      const updatedProject = await recordSurveyResponseUniversal(responsePayload)
      if (updatedProject) {
        setProject(updatedProject)
        try {
          window.dispatchEvent(new CustomEvent('forge_project_updated', { detail: updatedProject }))
        } catch (e) {}
      }
      setIsSubmitted(true)
    } catch (err) {
      console.error('Failed saving survey response to database:', err)
      setIsSubmitted(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 selection:bg-purple-500 selection:text-white font-sans antialiased py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header Branding */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Community Discovery Research</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Help Shape <span className="text-purple-400">{productName}</span>
          </h1>

          <p className="text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
            Co-founded with <strong className="text-white">{creatorName}</strong>. Share 2 minutes of feedback to help us build the exact features you need.
          </p>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Founding Contributor Priority Access Included</span>
          </div>
        </div>

        {/* Survey Form Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#0e1117] border border-white/[0.08] shadow-2xl space-y-6">
          {isSubmitted ? (
            <div className="text-center py-10 space-y-4 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto text-2xl">
                ✓
              </div>
              <h3 className="text-xl font-bold text-white">Thank You for Your Feedback!</h3>
              <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                Your response has been recorded. The AI validation engine is analyzing your feedback to prioritize the Day 1 MVP roadmap.
              </p>
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href={`/preorder/${productName.toLowerCase().replace(/[^a-z0-9]/g, '')}`}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <span>View Founding Pre-Order Page</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={() => {
                    setIsSubmitted(false)
                    setAnswers({})
                  }}
                  className="px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 text-xs font-bold"
                >
                  Submit Another Response
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Question Items */}
              <div className="space-y-5">
                {questions.map((q, idx) => (
                  <div key={q.id || idx} className="p-4 rounded-2xl bg-[#141720] border border-white/[0.06] space-y-2.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-300 text-[10px] font-extrabold uppercase tracking-wider">
                        {q.category || `Question ${idx + 1}`}
                      </span>
                      <span className="text-xs font-bold text-white flex-1">{q.question}</span>
                    </div>

                    <textarea
                      rows={2}
                      required={idx === 0}
                      placeholder="Type your feedback here..."
                      value={answers[q.id] || ''}
                      onChange={e => handleAnswerChange(q.id, e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#090b0e] border border-white/[0.08] text-xs text-white placeholder:text-slate-500 outline-none focus:border-purple-500/60 transition-colors"
                    />
                  </div>
                ))}
              </div>

              {/* Buying Intent Rating Slider */}
              <div className="p-4 rounded-2xl bg-[#141720] border border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">How excited are you to use {productName}?</span>
                  <span className="text-xs font-extrabold text-purple-400 font-mono">{intentRating}/10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={intentRating}
                  onChange={e => setIntentRating(Number(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>1 - Not interested</span>
                  <span>5 - Might try</span>
                  <span>10 - Need it immediately 🔥</span>
                </div>
              </div>

              {/* Respondent Info (Name & Email for VIP access) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your full name"
                    value={respondentName}
                    onChange={e => setRespondentName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#141720] border border-white/[0.08] text-xs text-white placeholder:text-slate-500 outline-none focus:border-purple-500/60"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Your Email (for VIP Alpha invite)</label>
                  <input
                    type="email"
                    required
                    placeholder="Enter your email address"
                    value={respondentEmail}
                    onChange={e => setRespondentEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#141720] border border-white/[0.08] text-xs text-white placeholder:text-slate-500 outline-none focus:border-purple-500/60"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-950/50 transition-all disabled:opacity-50 active:scale-[0.99]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting Feedback...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Discovery Feedback & Claim VIP Spot</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-slate-500 text-xs">
          Powered by CreatorForge Co-Launch OS · Confidential Discovery Research
        </div>
      </div>
    </div>
  )
}
