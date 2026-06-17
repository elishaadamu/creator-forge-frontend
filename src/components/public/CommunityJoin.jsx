import { useState, useEffect } from 'react'
import { Users, ArrowRight, Check, Sparkles } from 'lucide-react'
import WingLogo from '../ui/WingLogo'

/**
 * CommunityJoin — Public landing page at /join/{handle}
 * Lets visitors sign up for a creator's community with name + email.
 */
export default function CommunityJoin({ handle }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [joined, setJoined] = useState(false)
  const [visible, setVisible] = useState(false)
  const [creatorInfo, setCreatorInfo] = useState(null)

  const cleanHandle = (handle || '').replace(/^@/, '').replace(/\//g, '-')

  // Try to load creator info from localStorage (populated if the creator's dashboard is on the same browser)
  useEffect(() => {
    setTimeout(() => setVisible(true), 80)
    try {
      const cached = localStorage.getItem('forge_creator_data')
      if (cached) {
        const data = JSON.parse(cached)
        const dataHandle = (data.handle || '').replace(/^@/, '').replace(/\//g, '-')
        if (dataHandle.toLowerCase() === cleanHandle.toLowerCase()) {
          setCreatorInfo(data)
        }
      }
    } catch {}
  }, [cleanHandle])

  const displayName = creatorInfo?.name || creatorInfo?.handle?.replace('@', '') || cleanHandle
  const productName = creatorInfo?.productName || `${displayName}'s Community`
  const avatarUrl = creatorInfo?.avatarUrl || null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!email.trim()) return

    const member = {
      name: name.trim(),
      email: email.trim(),
      joinedAt: new Date().toISOString(),
    }

    // Store member in localStorage for the creator's dashboard to pick up
    const key = `forge_${cleanHandle}_community_members`
    try {
      const existing = JSON.parse(localStorage.getItem(key) || '[]')
      // Prevent duplicate emails
      if (!existing.some(m => m.email.toLowerCase() === member.email.toLowerCase())) {
        existing.push(member)
        localStorage.setItem(key, JSON.stringify(existing))
      }
    } catch {
      localStorage.setItem(key, JSON.stringify([member]))
    }

    setJoined(true)
  }

  if (joined) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-[#080808] text-white">
        <div
          className="w-full max-w-sm text-center"
          style={{
            animation: 'fadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) both',
          }}
        >
          <style>{`
            @keyframes fadeInUp {
              0% { opacity: 0; transform: translateY(16px); }
              100% { opacity: 1; transform: translateY(0); }
            }
          `}</style>
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center mx-auto mb-6">
            <Check size={28} className="text-emerald-400" />
          </div>
          <h1 className="text-[28px] font-bold tracking-tight mb-3">You're in! 🎉</h1>
          <p className="text-[15px] leading-relaxed mb-6" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Welcome to <span className="text-white font-medium">{productName}</span>. 
            {displayName} will keep you posted on what's next.
          </p>
          <div className="rounded-xl border p-4 text-left" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
            <p className="text-[12px] font-semibold text-white/30 uppercase tracking-wider mb-2">What to expect</p>
            <div className="space-y-2">
              {[
                'Exclusive content and updates',
                'Weekly challenges and discussions',
                'Early access to new releases',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Sparkles size={10} className="text-white/25" />
                  <span className="text-[13px]" style={{ color: 'rgba(255,255,255,0.55)' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-[#080808] text-white relative overflow-hidden">
      {/* Background glow */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 65%)' }}
      />

      <div
        className="relative z-10 w-full max-w-sm"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.55s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        {/* Logo */}
        <div className="flex justify-center mb-8">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-16 h-16 rounded-2xl border object-cover"
              style={{ borderColor: 'rgba(255,255,255,0.1)' }}
              onError={e => { e.currentTarget.style.display = 'none' }}
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl border flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}>
              <Users size={24} className="text-white/40" />
            </div>
          )}
        </div>

        {/* Heading */}
        <div className="text-center mb-8">
          <h1 className="text-[26px] font-bold tracking-tight mb-2">
            Join {productName}
          </h1>
          <p className="text-[14px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
            by <span className="text-white/60 font-medium">{displayName}</span>
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-[14px] outline-none transition-all duration-150"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'white',
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(139,92,246,0.4)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
            />
          </div>
          <div>
            <input
              type="email"
              required
              placeholder="Your email *"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-[14px] outline-none transition-all duration-150"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'white',
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(139,92,246,0.4)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
            />
          </div>
          <button
            type="submit"
            disabled={!email.trim()}
            className="w-full py-3 rounded-xl text-[14px] font-semibold flex items-center justify-center gap-2 transition-all duration-200"
            style={{
              background: email.trim() ? 'white' : 'rgba(255,255,255,0.06)',
              color: email.trim() ? 'black' : 'rgba(255,255,255,0.25)',
              cursor: email.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            Join Community
            <ArrowRight size={15} />
          </button>
        </form>

        {/* Trust signals */}
        <div className="mt-6 flex items-center justify-center gap-4">
          {[
            `${displayName}'s community`,
            'Free to join',
          ].map((text, i) => (
            <span key={i} className="text-[11px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
              {text}
            </span>
          ))}
        </div>

        {/* Powered by */}
        <div className="mt-10 flex items-center justify-center gap-2">
          <WingLogo size={14} color="rgba(255,255,255,0.15)" />
          <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.15)' }}>Powered by Creator Forge</span>
        </div>
      </div>
    </div>
  )
}
