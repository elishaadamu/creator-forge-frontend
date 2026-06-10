import { useState, useEffect } from 'react'
import { useForge } from '../../App'
import { ArrowRight, Check } from 'lucide-react'
import WingLogo from '../ui/WingLogo'

function Confetti() {
  const pieces = Array.from({ length: 40 }, (_, i) => i)
  const colors = ['#ffffff', '#e5e5e5', '#a0a0a0', '#606060', '#c0c0c0']
  const shapes = ['rounded-full', 'rounded-sm', 'rounded-none']

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {pieces.map(i => {
        const x = Math.random() * 100
        const delay = Math.random() * 3
        const duration = 3 + Math.random() * 4
        const size = 4 + Math.random() * 8
        const color = colors[Math.floor(Math.random() * colors.length)]
        const shape = shapes[Math.floor(Math.random() * shapes.length)]

        return (
          <div
            key={i}
            className={`absolute confetti-piece ${shape}`}
            style={{
              left: `${x}%`,
              top: '-10px',
              width: `${size}px`,
              height: `${size * (0.4 + Math.random() * 0.8)}px`,
              background: color,
              opacity: 0.6 + Math.random() * 0.4,
              animationDuration: `${duration}s`,
              animationDelay: `${delay}s`,
            }}
          />
        )
      })}
    </div>
  )
}

const WHAT_WAS_BUILT = [
  'Course builder: upload your first lesson',
  'Community forum: invite your first members',
  'Creator dashboard: track your revenue',
  'Offer page: share your launch link',
  'Email sequences: your list is ready',
]

const FIRST_STEPS = [
  { emoji: '🚀', label: 'Share your launch link' },
  { emoji: '📧', label: 'Send your first email' },
  { emoji: '👥', label: 'Invite 10 beta members' },
]

export default function Celebration() {
  const { next, creatorData } = useForge()
  const [visible, setVisible] = useState(false)
  const [showItems, setShowItems] = useState([])
  const [showCTA, setShowCTA] = useState(false)

  const blueprint = creatorData.blueprint || { name: 'Creator Academy' }
  const handle = creatorData.handle || '@creator'

  useEffect(() => {
    setTimeout(() => setVisible(true), 100)

    // Stagger the built items
    WHAT_WAS_BUILT.forEach((_, i) => {
      setTimeout(() => {
        setShowItems(prev => [...prev, i])
      }, 600 + i * 180)
    })

    setTimeout(() => setShowCTA(true), 600 + WHAT_WAS_BUILT.length * 180 + 400)
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <Confetti />

      {/* Radial glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 65%)' }}
      />

      <div
        className="relative z-10 w-full max-w-md text-center"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(24px)',
          transition: 'all 0.65s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        {/* Icon */}
        <div className="flex justify-center mb-8">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center"
            style={{ background: 'white' }}
          >
            <WingLogo size={44} color="black" />
          </div>
        </div>

        {/* Heading */}
        <h1
          className="forge-heading mb-3"
          style={{ fontSize: 'clamp(36px, 6vw, 52px)', letterSpacing: '-0.04em' }}
        >
          {blueprint.name} is live.
        </h1>

        <p className="text-[16px] mb-10" style={{ color: 'rgba(255,255,255,0.4)', lineHeight: '1.5' }}>
          Forge built your entire {blueprint.type || 'platform'} in under a minute.
          <br />
          {handle}, your business is ready.
        </p>

        {/* What was built */}
        <div
          className="rounded-2xl border p-5 mb-6 text-left"
          style={{ background: '#111', borderColor: 'rgba(255,255,255,0.08)' }}
        >
          <p className="text-[12px] font-semibold uppercase tracking-widest mb-4" style={{ color: 'rgba(255,255,255,0.3)' }}>
            What Forge built
          </p>
          <div className="space-y-2.5">
            {WHAT_WAS_BUILT.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 transition-all duration-400"
                style={{
                  opacity: showItems.includes(i) ? 1 : 0,
                  transform: showItems.includes(i) ? 'translateY(0)' : 'translateY(6px)',
                  transition: 'all 0.35s cubic-bezier(0.16,1,0.3,1)',
                }}
              >
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: showItems.includes(i) ? 'white' : 'rgba(255,255,255,0.08)' }}
                >
                  {showItems.includes(i) && <Check size={11} className="text-black" strokeWidth={3} />}
                </div>
                <span className="text-[13px]" style={{ color: 'rgba(255,255,255,0.65)' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* First steps */}
        <div
          className="rounded-2xl border p-5 mb-8 text-left"
          style={{
            background: 'rgba(255,255,255,0.03)',
            borderColor: 'rgba(255,255,255,0.07)',
            opacity: showCTA ? 1 : 0,
            transition: 'opacity 0.4s ease',
          }}
        >
          <p className="text-[12px] font-semibold uppercase tracking-widest mb-4" style={{ color: 'rgba(255,255,255,0.25)' }}>
            What to do first
          </p>
          <div className="space-y-3">
            {FIRST_STEPS.map(({ emoji, label }, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xl">{emoji}</span>
                <span className="text-[13px]" style={{ color: 'rgba(255,255,255,0.55)' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div
          style={{
            opacity: showCTA ? 1 : 0,
            transform: showCTA ? 'translateY(0)' : 'translateY(8px)',
            transition: 'all 0.4s cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          <button
            onClick={next}
            className="forge-btn-primary w-full text-[15px] py-4 group"
          >
            Enter your dashboard
            <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-0.5" />
          </button>
          <p className="text-[12px] mt-3" style={{ color: 'rgba(255,255,255,0.2)' }}>
            Your Forge command center is ready
          </p>
        </div>
      </div>
    </div>
  )
}
