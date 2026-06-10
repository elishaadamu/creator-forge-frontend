import { useEffect, useState, useRef } from 'react'
import { useForge } from '../../App'
import { ArrowRight, ChevronRight } from 'lucide-react'
import WingLogo from '../ui/WingLogo'

// ── Sample creator cards ──────────────────────────────────────────────────────

const CREATORS = [
  { name: 'Ali Abdaal',       handle: '@aliabdaal',     subs: '5.4M',  platform: 'YouTube', color: '#c0392b' },
  { name: 'Codie Sanchez',    handle: '@codiesanchez',  subs: '2.1M',  platform: 'YouTube', color: '#e67e22' },
  { name: 'Sahil Bloom',      handle: '@sahilbloom',    subs: '890K',  platform: 'Twitter', color: '#2980b9' },
  { name: 'Lara Acosta',      handle: '@laraacosta',    subs: '780K',  platform: 'LinkedIn', color: '#8e44ad' },
  { name: 'Chris Williamson', handle: '@chriswillxm',   subs: '2.6M',  platform: 'YouTube', color: '#16a085' },
  { name: 'Davie Fogarty',    handle: '@daviefogarty',  subs: '3.5M',  platform: 'YouTube', color: '#c0392b' },
]

const FEATURES = [
  {
    icon: '⚡',
    title: 'Analyze Your Audience',
    body: 'Forge scrapes your real engagement data — comments, sentiment, view patterns — to find exactly what your followers are asking for.',
  },
  {
    icon: '🧠',
    title: 'AI Blueprints the Product',
    body: 'Based on your niche, platform, and audience signals, Forge recommends the exact product type with the highest revenue potential.',
  },
  {
    icon: '🏗️',
    title: 'Builds It in Minutes',
    body: 'One click. Forge generates the full launch pack — email, social copy, pitch deck, and a product image — personalized to you.',
  },
  {
    icon: '📈',
    title: 'Launch on Autopilot',
    body: 'Your AI co-founder handles the marketing calendar, content plan, and outreach. You own the product. You keep the revenue.',
  },
]

const PIPELINE_STEPS = [
  {
    n: '1',
    icon: '🔍',
    title: 'Paste Your Profile Link',
    body: 'YouTube, Instagram, TikTok, or Twitter. Forge scrapes live data — followers, engagement rate, recent content.',
  },
  {
    n: '2',
    icon: '📊',
    title: 'Deep-Dive Audience Analysis',
    body: 'We pull comment sentiment, recurring questions, top-performing topics, and unmet demand signals from your content.',
  },
  {
    n: '3',
    icon: '🎯',
    title: 'Product Blueprint Recommendation',
    body: 'Forge matches your signals to the highest-fit product — course platform, community, mobile app, or digital products.',
  },
  {
    n: '4',
    icon: '🤖',
    title: 'AI Writes Everything',
    body: 'Launch email, Instagram caption, X thread, TikTok script, pitch deck — Gemini generates it all in under 30 seconds.',
  },
]

const STATS = [
  { value: '2,400+', label: 'Creators using Forge' },
  { value: '$8K–30K', label: 'Avg monthly revenue potential' },
  { value: '< 30s', label: 'From analysis to launch pack' },
]

// ── Intersection observer hook ─────────────────────────────────────────────────

function useInView(threshold = 0.15) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    if (!ref.current) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true) },
      { threshold }
    )
    obs.observe(ref.current)
    return () => obs.disconnect()
  }, [threshold])
  return [ref, inView]
}

// ── Animated section wrapper ───────────────────────────────────────────────────

function FadeUp({ children, delay = 0, className = '' }) {
  const [ref, inView] = useInView()
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(28px)',
        transition: `opacity 0.65s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.65s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

// ── Section label ──────────────────────────────────────────────────────────────

function Label({ children }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-[0.18em] mb-3"
      style={{ color: 'rgba(200,60,60,0.8)', letterSpacing: '0.18em' }}>
      {children}
    </p>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function Welcome() {
  const { next, goTo, userProfile } = useForge()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [])

  const fade = (delay = 0) => ({
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(20px)',
    transition: `all 0.65s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
  })

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#060407', color: 'white' }}>

      {/* ── Global background glow ─────────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 130% 55% at 50% -5%, rgba(110,5,5,0.55) 0%, transparent 65%)',
        }} />
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%',
          background: 'radial-gradient(ellipse 80% 50% at 50% 100%, rgba(90,5,5,0.35) 0%, transparent 70%)',
        }} />
      </div>

      {/* ── Navigation ────────────────────────────────────────────────────────── */}
      <header className="relative z-10 flex items-center justify-between px-8 py-5 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.06)', ...fade(0) }}>
        <div className="flex items-center gap-2.5">
          <WingLogo size={26} />
          <span className="text-white font-semibold text-[15px] tracking-tight">Creator Forge</span>
        </div>
        <div className="flex items-center gap-5">
          <span className="text-[13px] hidden sm:block" style={{ color: 'rgba(255,255,255,0.4)' }}>
            For Creators
          </span>
          {userProfile ? (
            <button
              onClick={() => goTo('dashboard')}
              className="text-[13px] font-semibold px-4 py-2 rounded-xl hover:bg-white/5 transition-all duration-200"
              style={{ color: 'rgba(255,255,255,0.75)' }}
            >
              Dashboard
            </button>
          ) : (
            <button
              onClick={() => goTo('login')}
              className="text-[13px] font-semibold px-4 py-2 rounded-xl hover:bg-white/5 transition-all duration-200"
              style={{ color: 'rgba(255,255,255,0.75)' }}
            >
              Login
            </button>
          )}
          <button
            onClick={next}
            className="flex items-center gap-1.5 text-[13px] font-semibold px-4 py-2 rounded-xl transition-all duration-200"
            style={{
              background: 'linear-gradient(135deg, #c0392b, #a93226)',
              color: 'white',
              boxShadow: '0 2px 16px rgba(192,57,43,0.4)',
            }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 24px rgba(192,57,43,0.6)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 16px rgba(192,57,43,0.4)'}
          >
            Get Started
            <ChevronRight size={13} />
          </button>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <section className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 py-24 min-h-[85vh]">

        <div style={fade(100)}>
          <Label>Audience-to-Product Engine</Label>
        </div>

        <h1
          style={{
            ...fade(180),
            fontSize: 'clamp(42px, 6.5vw, 88px)',
            fontWeight: 800,
            lineHeight: 1.02,
            letterSpacing: '-0.04em',
            maxWidth: 820,
          }}
        >
          Your audience is already
          <br />
          <span style={{ color: 'rgba(255,255,255,0.3)' }}>telling you what to build.</span>
        </h1>

        <p style={{
          ...fade(260),
          fontSize: '17px',
          color: 'rgba(255,255,255,0.42)',
          maxWidth: 460,
          lineHeight: 1.65,
          marginTop: 24,
          letterSpacing: '-0.01em',
        }}>
          Forge reads your content, analyzes audience demand, recommends what to build — then builds the entire launch pack in under 30 seconds.
        </p>

        <div className="flex items-center gap-4 mt-10" style={fade(340)}>
          <button
            onClick={next}
            className="flex items-center gap-2.5 text-[15px] font-bold px-8 py-4 rounded-2xl transition-all duration-200 group"
            style={{
              background: 'linear-gradient(135deg, #c0392b, #a93226)',
              color: 'white',
              boxShadow: '0 4px 28px rgba(192,57,43,0.5)',
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 40px rgba(192,57,43,0.7)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 28px rgba(192,57,43,0.5)'; e.currentTarget.style.transform = 'translateY(0)' }}
          >
            Get started
            <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-0.5" />
          </button>
          <button
            className="text-[14px] font-medium px-6 py-4 rounded-2xl transition-all duration-200"
            style={{
              background: 'rgba(255,255,255,0.05)',
              color: 'rgba(255,255,255,0.6)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; e.currentTarget.style.color = 'rgba(255,255,255,0.85)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }}
          >
            How it works
          </button>
        </div>

        <p style={{ ...fade(420), marginTop: 14, fontSize: '12px', color: 'rgba(255,255,255,0.22)' }}>
          No credit card required
        </p>

        {/* Creator card */}
        <div style={{ ...fade(500), marginTop: 40 }}>
          <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-2xl border"
            style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)' }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold"
              style={{ background: 'rgba(192,57,43,0.25)', color: '#e87070' }}>K</div>
            <div className="text-left">
              <p className="text-[12px] font-semibold text-white">Kize Bae</p>
              <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>YouTube · 247K subscribers</p>
            </div>
            <div className="text-[10px] px-2 py-0.5 rounded-full font-medium"
              style={{ background: 'rgba(192,57,43,0.2)', color: 'rgba(240,130,110,0.9)' }}>
              Using Forge
            </div>
          </div>
        </div>
      </section>

      {/* ── Creator showcase ───────────────────────────────────────────────────── */}
      <section className="relative z-10 py-16 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <FadeUp>
          <p className="text-center text-[11px] font-semibold uppercase tracking-widest mb-8"
            style={{ color: 'rgba(255,255,255,0.2)' }}>
            Creators already using Forge
          </p>
        </FadeUp>
        <div className="flex gap-3 overflow-x-auto px-8 pb-2" style={{ scrollbarWidth: 'none' }}>
          {CREATORS.map((c, i) => (
            <FadeUp key={c.handle} delay={i * 60}>
              <div
                className="flex-shrink-0 rounded-2xl border px-5 py-4 flex flex-col items-center gap-2 text-center"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  borderColor: 'rgba(255,255,255,0.08)',
                  width: 160,
                  transition: 'border-color 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(192,57,43,0.4)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
              >
                <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-[15px]"
                  style={{ background: `${c.color}33`, color: c.color }}>
                  {c.name.split(' ').map(w => w[0]).join('').slice(0,2)}
                </div>
                <p className="text-[12px] font-semibold text-white leading-tight">{c.name}</p>
                <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>{c.handle}</p>
                <div className="text-[10px] px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
                  {c.subs} · {c.platform}
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ── The Shift ─────────────────────────────────────────────────────────── */}
      <section className="relative z-10 py-24 px-6 border-t text-center"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <FadeUp>
          <Label>The Shift</Label>
          <h2 style={{
            fontSize: 'clamp(30px, 4.5vw, 54px)',
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: '-0.035em',
            maxWidth: 680,
            margin: '0 auto 20px',
          }}>
            One-person businesses are replacing entire companies.
          </h2>
          <p style={{
            fontSize: '16px',
            color: 'rgba(255,255,255,0.4)',
            maxWidth: 480,
            margin: '0 auto',
            lineHeight: 1.7,
          }}>
            AI can build websites, write code, run operations. But the one thing it still can't do? Get people to care. Distribution is the last human moat — and creators own it. Forge turns that moat into a product.
          </p>
        </FadeUp>
      </section>

      {/* ── How it works ──────────────────────────────────────────────────────── */}
      <section className="relative z-10 py-20 px-6 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="max-w-5xl mx-auto">
          <FadeUp>
            <div className="text-center mb-14">
              <Label>How It Works</Label>
              <h2 style={{
                fontSize: 'clamp(28px, 4vw, 48px)',
                fontWeight: 800,
                letterSpacing: '-0.035em',
                lineHeight: 1.1,
              }}>
                The full pipeline, automated.
              </h2>
            </div>
          </FadeUp>
          <div className="grid sm:grid-cols-2 gap-4">
            {FEATURES.map((f, i) => (
              <FadeUp key={f.title} delay={i * 80}>
                <div
                  className="rounded-2xl p-6 h-full transition-all duration-200"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(192,57,43,0.06)'; e.currentTarget.style.borderColor = 'rgba(192,57,43,0.25)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[20px] mb-4"
                    style={{ background: 'rgba(192,57,43,0.15)' }}>
                    {f.icon}
                  </div>
                  <h3 className="text-[15px] font-bold text-white mb-2">{f.title}</h3>
                  <p className="text-[13px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.42)' }}>{f.body}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pipeline steps ────────────────────────────────────────────────────── */}
      <section className="relative z-10 py-20 px-6 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="max-w-3xl mx-auto">
          <FadeUp>
            <div className="mb-14 text-center">
              <Label>Watch It Work</Label>
              <h2 style={{
                fontSize: 'clamp(26px, 3.5vw, 44px)',
                fontWeight: 800,
                letterSpacing: '-0.035em',
                lineHeight: 1.1,
              }}>
                From URL to launch pack in 4 steps.
              </h2>
            </div>
          </FadeUp>
          <div className="space-y-6">
            {PIPELINE_STEPS.map((step, i) => (
              <FadeUp key={step.n} delay={i * 100}>
                <div className="flex gap-5 items-start">
                  <div className="flex-shrink-0 flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-[14px] border"
                      style={{
                        background: 'rgba(192,57,43,0.12)',
                        borderColor: 'rgba(192,57,43,0.3)',
                        color: '#e87070',
                      }}>
                      {step.n}
                    </div>
                    {i < PIPELINE_STEPS.length - 1 && (
                      <div className="w-px flex-1" style={{ background: 'rgba(255,255,255,0.07)', minHeight: 24 }} />
                    )}
                  </div>
                  <div className="pb-6">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[18px]">{step.icon}</span>
                      <h3 className="text-[15px] font-bold text-white">{step.title}</h3>
                    </div>
                    <p className="text-[13px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.42)' }}>
                      {step.body}
                    </p>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why This Works ────────────────────────────────────────────────────── */}
      <section className="relative z-10 py-20 px-6 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="max-w-4xl mx-auto text-center">
          <FadeUp>
            <Label>Why This Works</Label>
            <h2 style={{
              fontSize: 'clamp(28px, 4vw, 50px)',
              fontWeight: 800,
              letterSpacing: '-0.035em',
              lineHeight: 1.12,
              marginBottom: 16,
            }}>
              Creators have the audience.
              <br />
              <span style={{ color: 'rgba(255,255,255,0.35)' }}>Forge brings the product.</span>
            </h2>
          </FadeUp>
          <div className="grid sm:grid-cols-2 gap-4 mt-10">
            {[
              {
                icon: '🏢',
                title: 'For Every Creator',
                body: 'Whether you have 10K or 10M followers, Forge finds the right product fit and generates everything you need to launch — for free.',
              },
              {
                icon: '⚙️',
                title: 'Zero Manual Work',
                body: 'Apify scrapes your real data, Gemini AI analyzes the demand, and your full launch pack is ready before you finish your coffee.',
              },
            ].map((item, i) => (
              <FadeUp key={item.title} delay={i * 100}>
                <div className="rounded-2xl p-6 text-left"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="text-[22px] mb-3">{item.icon}</div>
                  <h3 className="text-[14px] font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-[13px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.42)' }}>{item.body}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────────────────────────── */}
      <section className="relative z-10 py-16 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="max-w-3xl mx-auto grid grid-cols-3 gap-8 px-6">
          {STATS.map((s, i) => (
            <FadeUp key={s.label} delay={i * 80}>
              <div className="text-center">
                <p style={{ fontSize: 'clamp(22px, 3.5vw, 34px)', fontWeight: 800, letterSpacing: '-0.03em' }}>
                  {s.value}
                </p>
                <p className="text-[12px] mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{s.label}</p>
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────────────── */}
      <section className="relative z-10 py-28 px-6 border-t text-center"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        {/* Red glow behind CTA */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(100,5,5,0.45) 0%, transparent 70%)' }} />
        <FadeUp>
          <h2 style={{
            fontSize: 'clamp(32px, 5vw, 60px)',
            fontWeight: 800,
            letterSpacing: '-0.04em',
            lineHeight: 1.05,
            marginBottom: 16,
          }}>
            From creator to founder.
          </h2>
          <p style={{
            fontSize: '16px',
            color: 'rgba(255,255,255,0.4)',
            maxWidth: 400,
            margin: '0 auto 8px',
            lineHeight: 1.65,
          }}>
            We find what your audience wants, build the pitch, and generate your entire launch in minutes. You focus on creating.
          </p>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)', marginBottom: 36 }}>
            The entire pipeline runs on autopilot.
          </p>
          <button
            onClick={next}
            className="inline-flex items-center gap-2.5 text-[16px] font-bold px-10 py-4 rounded-2xl transition-all duration-200"
            style={{
              background: 'linear-gradient(135deg, #c0392b, #a93226)',
              color: 'white',
              boxShadow: '0 4px 36px rgba(192,57,43,0.55)',
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 52px rgba(192,57,43,0.75)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 36px rgba(192,57,43,0.55)'; e.currentTarget.style.transform = 'translateY(0)' }}
          >
            Get started
            <ArrowRight size={17} />
          </button>
        </FadeUp>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────────── */}
      <footer className="relative z-10 py-8 px-8 border-t flex items-center justify-between"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2">
          <WingLogo size={18} />
          <span className="text-[13px]" style={{ color: 'rgba(255,255,255,0.3)' }}>Creator Forge</span>
        </div>
        <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.18)' }}>
          © 2026 Creator Forge. All rights reserved.
        </p>
      </footer>

    </div>
  )
}
