import { useState, useEffect } from 'react'
import { useForge } from '../../App'
import { Check, Layout, Users, BarChart2, Package, Mail, Globe } from 'lucide-react'
import WingLogo from '../ui/WingLogo'

const BUILD_ARTIFACTS = [
  {
    id: 'shell',
    icon: Globe,
    label: 'Product shell',
    description: 'Core app architecture & routing',
    duration: 1600,
  },
  {
    id: 'dashboard',
    icon: Layout,
    label: 'Dashboard structure',
    description: 'Creator control panel & analytics',
    duration: 1800,
  },
  {
    id: 'offer',
    icon: Package,
    label: 'Offer page',
    description: 'Sales & landing page module',
    duration: 1400,
  },
  {
    id: 'onboarding',
    icon: Users,
    label: 'Onboarding flow',
    description: 'New member welcome sequence',
    duration: 1500,
  },
  {
    id: 'marketing',
    icon: Mail,
    label: 'Marketing assets',
    description: 'Launch emails & social templates',
    duration: 1200,
  },
]

function ArtifactPreview({ artifact, isActive, isBuilt }) {
  const { icon: Icon } = artifact

  return (
    <div
      className="rounded-xl border overflow-hidden transition-all duration-500"
      style={{
        background: isBuilt ? '#111' : isActive ? '#0e0e0e' : '#0a0a0a',
        borderColor: isBuilt
          ? 'rgba(255,255,255,0.12)'
          : isActive
            ? 'rgba(255,255,255,0.08)'
            : 'rgba(255,255,255,0.04)',
        opacity: isBuilt ? 1 : isActive ? 0.85 : 0.35,
      }}
    >
      {/* Title bar */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-2">
          <Icon size={12} className="text-white/50" />
          <span className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {artifact.label}
          </span>
        </div>
        {isBuilt && (
          <div
            className="w-4 h-4 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.12)' }}
          >
            <Check size={9} className="text-white" strokeWidth={3} />
          </div>
        )}
        {isActive && (
          <div className="flex gap-1">
            {[1,2,3].map(i => (
              <div
                key={i}
                className="w-1 h-1 rounded-full animate-pulse"
                style={{
                  background: 'rgba(255,255,255,0.4)',
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Content placeholder */}
      <div className="p-3 space-y-2">
        {isBuilt || isActive ? (
          <>
            <div
              className="h-14 rounded-lg"
              style={{ background: isBuilt ? 'rgba(255,255,255,0.05)' : 'transparent' }}
            >
              {isActive && (
                <div className="h-full shimmer-line rounded-lg" />
              )}
            </div>
            <div className="space-y-1.5">
              {[1,2].map(i => (
                <div
                  key={i}
                  className="h-1.5 rounded-full"
                  style={{
                    width: `${60 + i * 20}%`,
                    background: isBuilt ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
                  }}
                >
                  {isActive && <div className="h-full shimmer-line rounded-full" />}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="space-y-2">
            <div className="h-14 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }} />
            <div className="h-1.5 w-3/4 rounded-full" style={{ background: 'rgba(255,255,255,0.03)' }} />
          </div>
        )}
      </div>
    </div>
  )
}

export default function Building() {
  const { next, creatorData } = useForge()
  const [builtArtifacts, setBuiltArtifacts] = useState([])
  const [activeArtifact, setActiveArtifact] = useState(0)
  const [progress, setProgress] = useState(0)
  const [done, setDone] = useState(false)
  const [visible, setVisible] = useState(false)

  const blueprint = creatorData.blueprint || { name: 'Creator Academy', type: 'Web App' }

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    let artifactIdx = 0
    const totalDuration = BUILD_ARTIFACTS.reduce((s, a) => s + a.duration, 0)
    let elapsed = 0

    const runBuild = () => {
      if (artifactIdx >= BUILD_ARTIFACTS.length) {
        setProgress(100)
        setDone(true)
        setTimeout(next, 1200)
        return
      }

      setActiveArtifact(artifactIdx)
      const artifact = BUILD_ARTIFACTS[artifactIdx]

      const timeout = setTimeout(() => {
        setBuiltArtifacts(prev => [...prev, artifactIdx])
        elapsed += artifact.duration
        artifactIdx++
        runBuild()
      }, artifact.duration)

      return timeout
    }

    const buildTimeout = runBuild()

    // Progress interval
    const progressInterval = setInterval(() => {
      elapsed += 60
      const pct = Math.min(Math.round((elapsed / totalDuration) * 95), 95)
      setProgress(pct)
    }, 60)

    return () => {
      clearTimeout(buildTimeout)
      clearInterval(progressInterval)
    }
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-6 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <WingLogo size={22} />
          <span className="text-white font-semibold text-[15px] tracking-tight">Creator Forge</span>
        </div>
        <div className="flex items-center gap-1.5">
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="rounded-full transition-all duration-300"
              style={{
                width: i === 6 ? '20px' : '6px',
                height: '6px',
                background: i === 6 ? 'white' : i < 6 ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.12)',
              }}
            />
          ))}
        </div>
      </header>

      <main
        className="flex-1 px-6 pb-10 max-w-4xl mx-auto w-full"
        style={{
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.5s ease',
        }}
      >
        {/* Title */}
        <div className="mb-10">
          <p className="forge-label mb-4">Building your product</p>
          <h2
            className="forge-heading"
            style={{ fontSize: 'clamp(28px, 4vw, 38px)', letterSpacing: '-0.035em' }}
          >
            {done ? `${blueprint.name} is ready.` : `Forge is building\n${blueprint.name}.`}
          </h2>
          {!done && (
            <p className="text-[14px] mt-2" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Generating {blueprint.type.toLowerCase()} - this takes about 15 seconds.
            </p>
          )}
        </div>

        {/* Artifact grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-10">
          {BUILD_ARTIFACTS.map((artifact, i) => (
            <ArtifactPreview
              key={artifact.id}
              artifact={artifact}
              isBuilt={builtArtifacts.includes(i)}
              isActive={activeArtifact === i && !builtArtifacts.includes(i)}
            />
          ))}
        </div>

        {/* Build log */}
        <div
          className="rounded-xl border p-4 mb-8 font-mono overflow-hidden"
          style={{
            background: '#0a0a0a',
            borderColor: 'rgba(255,255,255,0.06)',
            maxHeight: '120px',
          }}
        >
          <div className="space-y-1">
            {BUILD_ARTIFACTS.slice(0, activeArtifact + 1).map((a, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.15)' }}>›</span>
                <span
                  className="text-[11px]"
                  style={{
                    color: builtArtifacts.includes(i) ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.7)',
                  }}
                >
                  {builtArtifacts.includes(i) ? '✓' : '·'} {a.description}
                  {!builtArtifacts.includes(i) && i === activeArtifact && (
                    <span className="cursor-blink">_</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
              {done ? 'Build complete' : BUILD_ARTIFACTS[activeArtifact]?.label || 'Initializing'}
            </span>
            <span className="text-[13px] font-semibold" style={{ color: done ? 'white' : 'rgba(255,255,255,0.5)' }}>
              {progress}%
            </span>
          </div>
          <div
            className="h-1 w-full rounded-full overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.08)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-300 relative progress-shimmer"
              style={{ width: `${progress}%`, background: 'white' }}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
