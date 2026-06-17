import { useState, useEffect } from 'react'
import { useForge } from '../../App'
import { 
  ArrowRight, RefreshCw, Send, Sparkles, Check, Layout, Users, 
  BarChart2, Settings, Radio, Play, Lock, MessageSquare, Calendar, 
  Download, ShoppingBag, Laptop, Smartphone, Volume2, Award
} from 'lucide-react'
import WingLogo from '../ui/WingLogo'

const QUICK_PROMPTS = [
  'Make it more premium',
  'Focus on community',
  'More minimalist',
  'For women 25–34',
  'Mobile-first',
  'Add a podcast section',
]

const FEATURES = [
  { icon: Layout, label: 'Course builder' },
  { icon: Users, label: 'Community forum' },
  { icon: Radio, label: 'Live events' },
  { icon: BarChart2, label: 'Creator analytics' },
  { icon: Settings, label: 'Member management' },
  { icon: Volume2, label: 'Podcast section' },
]

export function AppMockup({ theme, activeTab, setActiveTab, blueprint, creatorData, extraTabs, isMobile }) {
  const isDark = theme === 'dark' || theme === 'premium' || theme === 'minimalist' || !theme
  
  // Theme color maps
  const themeStyles = {
    dark: {
      bg: '#0a0a0c',
      cardBg: '#121215',
      borderColor: 'rgba(255,255,255,0.06)',
      text: '#ffffff',
      textMuted: 'rgba(255,255,255,0.4)',
      accent: '#8b5cf6',
      accentBg: 'rgba(139, 92, 246, 0.1)',
      accentBorder: 'rgba(139, 92, 246, 0.2)'
    },
    light: {
      bg: '#f9fafb',
      cardBg: '#ffffff',
      borderColor: 'rgba(0,0,0,0.08)',
      text: '#111827',
      textMuted: '#6b7280',
      accent: '#6366f1',
      accentBg: 'rgba(99, 102, 241, 0.08)',
      accentBorder: 'rgba(99, 102, 241, 0.15)'
    },
    premium: {
      bg: '#08050e',
      cardBg: 'rgba(17, 12, 28, 0.75)',
      borderColor: 'rgba(168, 85, 247, 0.25)',
      text: '#f3e8ff',
      textMuted: '#c084fc',
      accent: '#eab308',
      accentBg: 'rgba(234, 179, 8, 0.1)',
      accentBorder: 'rgba(234, 179, 8, 0.25)',
      glow: 'shadow-[0_0_15px_rgba(168,85,247,0.15)]'
    },
    minimalist: {
      bg: '#ffffff',
      cardBg: '#ffffff',
      borderColor: '#000000',
      text: '#000000',
      textMuted: '#737373',
      accent: '#000000',
      accentBg: 'rgba(0, 0, 0, 0.05)',
      accentBorder: '#000000'
    },
    feminine: {
      bg: '#faf5f6',
      cardBg: 'rgba(255, 241, 242, 0.8)',
      borderColor: 'rgba(251, 113, 133, 0.18)',
      text: '#4c0519',
      textMuted: '#fda4af',
      accent: '#db2777',
      accentBg: 'rgba(219, 39, 119, 0.08)',
      accentBorder: 'rgba(219, 39, 119, 0.15)'
    }
  }

  const styles = themeStyles[theme] || themeStyles.dark
  const previewType = blueprint.preview || 'webapp'
  const creatorName = creatorData.name || creatorData.handle?.replace('@','') || 'Creator'

  // Tabs based on Blueprint Type
  let defaultTabs = []
  if (previewType === 'webapp') defaultTabs = ['Courses', 'Community', 'Live AMAs']
  else if (previewType === 'mobile') defaultTabs = ['Home Feed', 'Group Chat', 'Drops']
  else if (previewType === 'community') defaultTabs = ['Announcements', 'Chat Room', 'Events']
  else if (previewType === 'store') defaultTabs = ['All Products', 'Guides', 'Consultation']

  const allTabs = [...defaultTabs, ...extraTabs]

  // Render content based on activeTab
  const renderTabContent = () => {
    const tabLower = activeTab.toLowerCase()
    
    if (tabLower.includes('course')) {
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4">
          {[
            { title: `${creatorName} Core Method`, lessons: '12 lessons', badge: 'Popular', progress: '85%' },
            { title: 'Advanced Tactics & Secrets', lessons: '8 lessons', badge: 'Locked', lock: true },
            { title: 'Quick Start Templates', lessons: '5 lessons', badge: 'Ready', progress: '100%' }
          ].map((c, i) => (
            <div 
              key={i} 
              className={`rounded-xl p-3 border transition-all duration-200 ${styles.glow || ''}`}
              style={{ background: styles.cardBg, borderColor: styles.borderColor }}
            >
              <div className="h-16 rounded-lg mb-2 flex items-center justify-center relative overflow-hidden" 
                style={{ background: 'rgba(255,255,255,0.03)' }}
              >
                {c.lock ? (
                  <Lock size={16} style={{ color: styles.accent }} />
                ) : (
                  <Play size={16} style={{ color: styles.accent }} />
                )}
                {c.badge && (
                  <span className="absolute top-1.5 right-1.5 text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase"
                    style={{ background: styles.accentBg, color: styles.accent, border: `1px solid ${styles.accentBorder}` }}
                  >
                    {c.badge}
                  </span>
                )}
              </div>
              <h4 className="text-[11px] font-bold leading-tight mb-1 truncate" style={{ color: styles.text }}>{c.title}</h4>
              <p className="text-[9px] mb-2" style={{ color: styles.textMuted }}>{c.lessons}</p>
              {c.progress && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[7px] font-mono" style={{ color: styles.textMuted }}>
                    <span>Progress</span>
                    <span>{c.progress}</span>
                  </div>
                  <div className="h-1 w-full rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div className="h-full rounded-full" style={{ width: c.progress, background: styles.accent }} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )
    }

    if (tabLower.includes('community') || tabLower.includes('chat') || tabLower.includes('feed') || tabLower.includes('room') || tabLower.includes('announcement')) {
      return (
        <div className="space-y-2.5 p-4">
          {[
            { user: `@${creatorName.toLowerCase()}`, text: `Hey everyone! Welcome to my Inner Circle. Live AMA streams are scheduled in the Live tab!`, isCreator: true, time: '2h ago' },
            { user: '@alex_m', text: `Completed chapter 4. This is exactly what I've been struggling with for weeks.`, time: '4h ago' },
            { user: '@pc_builder_pro', text: `Anyone else here testing this layout? The design is incredibly slick.`, time: '1d ago' }
          ].map((p, i) => (
            <div 
              key={i} 
              className={`rounded-xl p-3 border flex gap-3 ${styles.glow || ''}`}
              style={{ background: styles.cardBg, borderColor: styles.borderColor }}
            >
              <div className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] flex-shrink-0"
                style={{ background: p.isCreator ? styles.accentBg : 'rgba(255,255,255,0.06)', color: p.isCreator ? styles.accent : styles.text }}
              >
                {p.user.charAt(1).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[10px] font-bold" style={{ color: styles.text }}>{p.user}</span>
                  {p.isCreator && (
                    <span className="text-[7px] font-bold uppercase px-1 rounded" style={{ background: styles.accentBg, color: styles.accent }}>
                      Host
                    </span>
                  )}
                  <span className="text-[8px] ml-auto" style={{ color: styles.textMuted }}>{p.time}</span>
                </div>
                <p className="text-[10px] leading-relaxed" style={{ color: styles.textMuted }}>{p.text}</p>
              </div>
            </div>
          ))}
        </div>
      )
    }

    if (tabLower.includes('live') || tabLower.includes('event')) {
      return (
        <div className="space-y-3 p-4">
          {[
            { title: 'Launch Day Live Q&A', desc: 'Join Carter for the live reveal and get early answers.', status: 'Live in 2 days', action: 'Add' },
            { title: 'Weekly Setup Critiques', desc: 'Host review of community visual setups.', status: 'Mon at 8:00 PM', action: 'Remind' }
          ].map((e, i) => (
            <div 
              key={i} 
              className={`rounded-xl p-3 border flex gap-4 items-center justify-between ${styles.glow || ''}`}
              style={{ background: styles.cardBg, borderColor: styles.borderColor }}
            >
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[8px] font-bold uppercase tracking-wider text-red-400">Stream</span>
                </div>
                <h4 className="text-[11px] font-bold truncate" style={{ color: styles.text }}>{e.title}</h4>
                <p className="text-[9px] leading-snug truncate" style={{ color: styles.textMuted }}>{e.desc}</p>
              </div>
              <div className="text-right flex flex-col gap-1 flex-shrink-0">
                <span className="text-[8px] font-mono" style={{ color: styles.text }}>{e.status}</span>
                <button className="text-[8px] font-bold px-2 py-1 rounded transition-colors border"
                  style={{ background: styles.accentBg, color: styles.accent, borderColor: styles.accentBorder }}
                >
                  {e.action}
                </button>
              </div>
            </div>
          ))}
        </div>
      )
    }

    if (tabLower.includes('podcast')) {
      return (
        <div className="space-y-2.5 p-4">
          {[
            { title: `Ep 14: Monetizing content in 2026`, duration: '42 min', plays: '12K list' },
            { title: `Ep 13: Secrets of highly successful creators`, duration: '35 min', plays: '8K list' }
          ].map((p, i) => (
            <div 
              key={i} 
              className={`rounded-xl p-3 border flex gap-3 items-center ${styles.glow || ''}`}
              style={{ background: styles.cardBg, borderColor: styles.borderColor }}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.03)' }}
              >
                <Volume2 size={13} style={{ color: styles.accent }} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[11px] font-bold truncate" style={{ color: styles.text }}>{p.title}</h4>
                <p className="text-[8px]" style={{ color: styles.textMuted }}>{p.duration} · {p.plays}</p>
              </div>
              <button className="w-6 h-6 rounded-full flex items-center justify-center border flex-shrink-0"
                style={{ background: styles.accentBg, color: styles.accent, borderColor: styles.accentBorder }}
              >
                <Play size={10} fill="currentColor" />
              </button>
            </div>
          ))}
        </div>
      )
    }

    if (tabLower.includes('product') || tabLower.includes('guide') || tabLower.includes('shop') || tabLower.includes('consult') || tabLower.includes('drop')) {
      return (
        <div className="grid grid-cols-2 gap-3 p-4">
          {[
            { title: 'Core Guide Blueprint', price: '$9.99', type: 'PDF Ebook' },
            { title: 'Interactive Master Toolkit', price: '$24.99', type: 'Resources' },
            { title: '1-on-1 Monetization Call', price: '$149.00', type: 'Consultation' },
            { title: 'Exclusive Setup Files', price: 'Free', type: 'Assets' }
          ].map((p, i) => (
            <div 
              key={i} 
              className={`rounded-xl p-3 border transition-all duration-200 flex flex-col justify-between ${styles.glow || ''}`}
              style={{ background: styles.cardBg, borderColor: styles.borderColor }}
            >
              <div>
                <span className="text-[8px] font-semibold uppercase tracking-wider" style={{ color: styles.textMuted }}>{p.type}</span>
                <h4 className="text-[11px] font-bold leading-tight mt-0.5 mb-2 truncate" style={{ color: styles.text }}>{p.title}</h4>
              </div>
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/5">
                <span className="text-[11px] font-mono font-bold" style={{ color: styles.text }}>{p.price}</span>
                <button className="p-1 rounded-lg" style={{ color: styles.accent }}>
                  <Download size={11} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )
    }

    // Default Fallback
    return (
      <div className="p-6 text-center" style={{ color: styles.textMuted }}>
        <p className="text-[11px]">Selecting new layout modules...</p>
      </div>
    )
  }

  // Desktop vs Mobile View wrapper layouts
  if (isMobile) {
    return (
      <div className="w-full h-full flex flex-col" style={{ background: styles.bg }}>
        {/* Mobile Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
          style={{ borderColor: styles.borderColor }}
        >
          <span className="text-[11px] font-black uppercase tracking-wider truncate mr-2" style={{ color: styles.text }}>
            {blueprint.name.split("'")[0]}
          </span>
          <div className="w-4 h-4 rounded-full flex items-center justify-center font-bold text-[8px] flex-shrink-0"
            style={{ background: styles.accentBg, color: styles.accent }}
          >
            {creatorName.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* Mobile Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto">
          {/* Mobile Hero */}
          <div className="px-4 py-4 flex-shrink-0 text-center border-b" style={{ borderColor: styles.borderColor }}>
            <h3 className="text-[14px] font-extrabold leading-tight tracking-tight mb-1" style={{ color: styles.text }}>
              {creatorName}'s Space
            </h3>
            <p className="text-[9px]" style={{ color: styles.textMuted }}>
              Exclusive masterclasses, drops & direct chats.
            </p>
          </div>
          {renderTabContent()}
        </div>

        {/* Mobile Bottom Navigation Bar */}
        <div className="h-12 border-t flex items-center justify-around flex-shrink-0"
          style={{ borderColor: styles.borderColor, background: 'rgba(0,0,0,0.1)' }}
        >
          {allTabs.slice(0, 4).map(t => {
            const isTabActive = activeTab === t
            return (
              <button 
                key={t} 
                onClick={() => setActiveTab(t)}
                className="flex flex-col items-center justify-center py-1 flex-1 text-[8px] font-bold"
                style={{ color: isTabActive ? styles.accent : styles.textMuted }}
              >
                <span>{t.split(' ')[0]}</span>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // Desktop View
  return (
    <div className="w-full h-full flex flex-col" style={{ background: styles.bg }}>
      {/* Desktop Header */}
      <div 
        className="flex items-center justify-between px-5 py-3 border-b flex-shrink-0"
        style={{ borderColor: styles.borderColor }}
      >
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: styles.accentBg, border: `1px solid ${styles.accentBorder}` }}>
            <span style={{ fontSize: '8px', color: styles.accent, fontWeight: 900 }}>
              {blueprint.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="text-[11px] font-black tracking-tight" style={{ color: styles.text }}>
            {blueprint.name}
          </span>
        </div>

        {/* Desktop Tabs */}
        <div className="flex gap-4">
          {allTabs.map(t => {
            const isTabActive = activeTab === t
            return (
              <button 
                key={t} 
                onClick={() => setActiveTab(t)}
                className="text-[10px] font-bold tracking-tight py-1 relative transition-colors"
                style={{ color: isTabActive ? styles.accent : styles.textMuted }}
              >
                {t}
                {isTabActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" 
                    style={{ background: styles.accent }} 
                  />
                )}
              </button>
            )
          })}
        </div>
        <div className="w-16 h-5 rounded-full text-[9px] font-extrabold flex items-center justify-center uppercase tracking-wide cursor-pointer" 
          style={{ background: styles.accent, color: isDark ? '#000000' : '#ffffff' }}
        >
          Sign In
        </div>
      </div>

      {/* Desktop Hero Section */}
      <div className="px-6 py-5 flex-shrink-0 border-b" style={{ borderColor: styles.borderColor }}>
        <h3 className="text-[16px] font-extrabold leading-tight tracking-tight mb-1" style={{ color: styles.text }}>
          Welcome to {blueprint.name}
        </h3>
        <p className="text-[10px] max-w-lg" style={{ color: styles.textMuted, lineHeight: '1.4' }}>
          Get direct access to step-by-step masterclasses, visual assets, and monthly live AMAs hosted by {creatorName}.
        </p>
      </div>

      {/* Desktop Scrollable Grid content */}
      <div className="flex-1 overflow-y-auto">
        {renderTabContent()}
      </div>
    </div>
  )
}

export default function Preview() {
  const { next, creatorData, updateCreator, prev } = useForge()
  const [visible, setVisible] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [theme, setTheme] = useState('dark')
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [appliedPrompts, setAppliedPrompts] = useState([])
  
  const blueprint = creatorData.blueprint || { name: 'Creator Academy', type: 'Web App' }

  const [activeTab, setActiveTab] = useState('Courses')
  const [isMobileView, setIsMobileView] = useState(false)
  const [extraTabs, setExtraTabs] = useState([])
  const [localFeatures, setLocalFeatures] = useState(() => {
    return blueprint.features || ['Course builder', 'Community forum', 'Live events']
  })

  useEffect(() => {
    const previewType = blueprint.preview || 'webapp'
    if (previewType === 'webapp') setActiveTab('Courses')
    else if (previewType === 'mobile') setActiveTab('Home Feed')
    else if (previewType === 'community') setActiveTab('Announcements')
    else if (previewType === 'store') setActiveTab('All Products')
  }, [creatorData.blueprint])

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [])

  const processPrompt = (text) => {
    const p = text.toLowerCase()
    
    // Theme shifts
    if (p.includes('premium')) {
      setTheme('premium')
    } else if (p.includes('minimalist') || p.includes('minimal')) {
      setTheme('minimalist')
    } else if (p.includes('women') || p.includes('female') || p.includes('feminine') || p.includes('rose') || p.includes('25')) {
      setTheme('feminine')
    } else if (p.includes('light') || p.includes('paper')) {
      setTheme('light')
    } else if (p.includes('dark') || p.includes('graphite')) {
      setTheme('dark')
    }

    // View shifts
    if (p.includes('mobile') || p.includes('phone') || p.includes('handheld')) {
      setIsMobileView(true)
    } else if (p.includes('desktop') || p.includes('web') || p.includes('laptop')) {
      setIsMobileView(false)
    }

    // Dynamic Features / Tabs additions
    if (p.includes('podcast')) {
      if (!extraTabs.includes('Podcast')) {
        setExtraTabs(prev => [...prev, 'Podcast'])
        setLocalFeatures(prev => {
          if (!prev.includes('Podcast section')) {
            return [...prev, 'Podcast section']
          }
          return prev
        })
      }
      setActiveTab('Podcast')
    }
    
    if (p.includes('community')) {
      const previewType = blueprint.preview || 'webapp'
      if (previewType === 'webapp') setActiveTab('Community')
      else if (previewType === 'mobile') setActiveTab('Group Chat')
      else if (previewType === 'community') setActiveTab('Chat Room')
    }
  }

  const handlePromptSend = () => {
    if (!prompt.trim()) return
    setIsRegenerating(true)
    setAppliedPrompts(prev => [...prev, prompt])
    const currentPrompt = prompt
    setPrompt('')
    
    setTimeout(() => {
      processPrompt(currentPrompt)
      setIsRegenerating(false)
    }, 1200)
  }

  const handleQuickPrompt = (p) => {
    setIsRegenerating(true)
    setAppliedPrompts(prev => [...prev, p])
    
    setTimeout(() => {
      processPrompt(p)
      setIsRegenerating(false)
    }, 1200)
  }

  const removeAppliedPrompt = (promptText) => {
    setIsRegenerating(true)
    setTimeout(() => {
      setAppliedPrompts(prev => prev.filter(x => x !== promptText))
      const p = promptText.toLowerCase()
      
      // Revert theme adjustments if it was a theme prompt
      if (p.includes('premium') || p.includes('minimalist') || p.includes('minimal') || 
          p.includes('women') || p.includes('female') || p.includes('feminine') || p.includes('rose') || p.includes('25') ||
          p.includes('light') || p.includes('paper') || p.includes('dark') || p.includes('graphite')) {
        setTheme('dark')
      }

      // Revert view shifts
      if (p.includes('mobile') || p.includes('phone') || p.includes('handheld')) {
        setIsMobileView(false)
      }

      // Revert dynamic features
      if (p.includes('podcast')) {
        setExtraTabs(prev => prev.filter(x => x !== 'Podcast'))
        setLocalFeatures(prev => prev.filter(x => x !== 'Podcast section'))
        setActiveTab('Courses')
      }
      setIsRegenerating(false)
    }, 800)
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-6 flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={prev}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all duration-150"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.5)',
            }}
          >
            ← Back
          </button>
          <div className="flex items-center gap-2.5">
            <WingLogo size={22} />
            <span className="text-white font-semibold text-[15px] tracking-tight">Creator Forge</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="rounded-full transition-all duration-300"
              style={{
                width: i === 5 ? '20px' : '6px',
                height: '6px',
                background: i === 5 ? 'white' : i < 5 ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.12)',
              }}
            />
          ))}
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left: Live Preview */}
        <div
          className="flex-1 p-6 flex flex-col"
          style={{
            opacity: visible ? 1 : 0,
            transition: 'opacity 0.55s ease',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="forge-label mb-1">Live preview</p>
              <h2
                className="forge-heading"
                style={{ fontSize: '22px', letterSpacing: '-0.03em' }}
              >
                {blueprint.name}
              </h2>
            </div>

            {/* Viewport layout toggles */}
            <div 
              className="flex items-center gap-1 p-0.5 rounded-xl border bg-black/40"
              style={{ borderColor: 'rgba(255,255,255,0.08)' }}
            >
              <button
                onClick={() => {
                  setIsMobileView(false)
                  setAppliedPrompts(prev => prev.filter(p => !p.toLowerCase().includes('mobile')))
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all duration-150"
                style={{
                  background: !isMobileView ? 'white' : 'transparent',
                  color: !isMobileView ? 'black' : 'rgba(255,255,255,0.4)',
                }}
              >
                <Laptop size={12} />
                Desktop
              </button>
              <button
                onClick={() => {
                  setIsMobileView(true)
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all duration-150"
                style={{
                  background: isMobileView ? 'white' : 'transparent',
                  color: isMobileView ? 'black' : 'rgba(255,255,255,0.4)',
                }}
              >
                <Smartphone size={12} />
                Mobile
              </button>
            </div>

            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.5)' }}>Generated</span>
            </div>
          </div>

          {/* Preview window */}
          <div className="flex-1 flex items-center justify-center">
            {isMobileView ? (
              /* Mobile Shell Frame */
              <div
                className="relative rounded-[36px] border-[8px] shadow-2xl overflow-hidden flex flex-col transition-all duration-300"
                style={{
                  width: '290px',
                  height: '480px',
                  borderColor: 'rgba(255,255,255,0.14)',
                  background: '#000',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                }}
              >
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-3.5 bg-[#141414] rounded-b-xl z-20" />
                
                {/* Regenerating overlay */}
                {isRegenerating && (
                  <div
                    className="absolute inset-0 flex items-center justify-center z-30 animate-fade-in"
                    style={{ background: 'rgba(8,8,8,0.85)', backdropFilter: 'blur(4px)' }}
                  >
                    <div className="text-center">
                      <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-3" />
                      <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.5)' }}>Refining...</p>
                    </div>
                  </div>
                )}

                <div className="flex-1 overflow-hidden">
                  <AppMockup 
                    theme={theme} 
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    blueprint={blueprint}
                    creatorData={creatorData}
                    extraTabs={extraTabs}
                    isMobile={true}
                  />
                </div>
              </div>
            ) : (
              /* Desktop Browser Shell Frame */
              <div
                className="w-full flex-1 rounded-2xl border overflow-hidden relative flex flex-col transition-all duration-300"
                style={{
                  borderColor: 'rgba(255,255,255,0.07)',
                  background: '#0a0a0a',
                  minHeight: '380px',
                  maxHeight: '520px',
                }}
              >
                {/* Window chrome */}
                <div
                  className="flex items-center gap-2 px-4 py-3 border-b flex-shrink-0"
                  style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}
                >
                  {[1,2,3].map(i => (
                    <div key={i} className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(255,255,255,0.12)' }} />
                  ))}
                  <div
                    className="flex-1 mx-3 h-5 rounded-md flex items-center px-2"
                    style={{ background: 'rgba(255,255,255,0.04)' }}
                  >
                    <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
                      {blueprint.name.toLowerCase().replace(/\s+/g, '')}.forge.app
                    </span>
                  </div>
                </div>

                {/* Regenerating overlay */}
                {isRegenerating && (
                  <div
                    className="absolute inset-0 flex items-center justify-center z-10"
                    style={{ background: 'rgba(8,8,8,0.85)', backdropFilter: 'blur(4px)' }}
                  >
                    <div className="text-center">
                      <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-3" />
                      <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.5)' }}>Refining...</p>
                    </div>
                  </div>
                )}

                <div className="flex-1 overflow-hidden">
                  <AppMockup 
                    theme={theme} 
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    blueprint={blueprint}
                    creatorData={creatorData}
                    extraTabs={extraTabs}
                    isMobile={false}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Applied prompts */}
          {appliedPrompts.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {appliedPrompts.map((p, i) => (
                <button
                  key={i}
                  onClick={() => removeAppliedPrompt(p)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] hover:bg-red-500/10 hover:text-red-400 group transition-all duration-150"
                  style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)' }}
                  title="Click to remove refinement"
                >
                  <Check size={10} className="group-hover:hidden" />
                  <span className="hidden group-hover:inline font-bold">×</span>
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Controls */}
        <div
          className="lg:w-[340px] border-l p-6 flex flex-col gap-6 overflow-y-auto"
          style={{
            borderColor: 'rgba(255,255,255,0.07)',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateX(0)' : 'translateX(20px)',
            transition: 'all 0.55s cubic-bezier(0.16,1,0.3,1) 0.1s',
          }}
        >
          {/* What was built */}
          <div>
            <p className="forge-label mb-3">What's included</p>
            <div className="space-y-2">
              {localFeatures.map(label => {
                const matched = FEATURES.find(f => f.label === label)
                const Icon = matched ? matched.icon : Layout
                return (
                  <div key={label} className="flex items-center gap-3">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(255,255,255,0.07)' }}
                    >
                      <Icon size={13} className="text-white/60" />
                    </div>
                    <span className="text-[13px] font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>{label}</span>
                    <Check size={12} className="ml-auto text-white/30" />
                  </div>
                )
              })}
            </div>
          </div>

          <div className="h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />

          {/* Prompt to refine */}
          <div>
            <p className="forge-label mb-3">Refine with Forge</p>

            {/* Quick prompts */}
            <div className="flex flex-wrap gap-2 mb-4">
              {QUICK_PROMPTS.map(p => (
                <button
                  key={p}
                  onClick={() => handleQuickPrompt(p)}
                  className="px-3 py-1.5 rounded-full text-[12px] font-medium transition-all duration-150"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    color: 'rgba(255,255,255,0.55)',
                    border: '1px solid ' + (theme === 'premium' && p.includes('premium') ? 'rgba(234, 179, 8, 0.4)' : 'rgba(255,255,255,0.07)'),
                  }}
                  onMouseEnter={e => {
                    e.target.style.background = 'rgba(255,255,255,0.1)'
                    e.target.style.color = 'rgba(255,255,255,0.85)'
                  }}
                  onMouseLeave={e => {
                    e.target.style.background = 'rgba(255,255,255,0.06)'
                    e.target.style.color = 'rgba(255,255,255,0.55)'
                  }}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Custom prompt input */}
            <div
              className="flex items-center gap-2 rounded-xl border px-4 py-3 mb-3"
              style={{ background: '#111', borderColor: 'rgba(255,255,255,0.08)' }}
            >
              <Sparkles size={14} className="text-white/25 flex-shrink-0" />
              <input
                className="bg-transparent flex-1 text-[13px] text-white focus:outline-none"
                placeholder="Describe a change..."
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handlePromptSend()}
              />
              <button
                onClick={handlePromptSend}
                disabled={!prompt.trim()}
                className="text-white/30 hover:text-white/70 transition-colors disabled:opacity-30"
              >
                <Send size={14} />
              </button>
            </div>

            <button
              onClick={() => handleQuickPrompt('Regenerate')}
              className="forge-btn-secondary w-full text-[13px] py-2.5 gap-2"
            >
              <RefreshCw size={13} />
              Regenerate
            </button>
          </div>

          <div className="mt-auto pt-4">
            <button
              onClick={() => {
                updateCreator({
                  theme,
                  isMobileView,
                  extraTabs,
                  features: localFeatures
                });
                next();
              }}
              className="forge-btn-primary w-full text-[14px] py-3.5 group"
            >
              Looks good, build it
              <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
