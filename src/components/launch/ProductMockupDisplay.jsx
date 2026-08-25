import { Globe, BarChart3, Zap, Users, Layers, Activity } from 'lucide-react'

export default function ProductMockupDisplay({ project, theme = 'purple' }) {
  const productName = project?.productName || 'Software Product'
  const creatorName = project?.creatorName || 'Creator'
  const niche = project?.niche || 'Software'
  const productTagline = project?.productTagline || 'Autonomous software suite built for creators'

  // Dynamic real data derived from project
  const audienceVal = project?.followers
    ? (Number(project.followers) >= 1000 ? `${(Number(project.followers) / 1000).toFixed(1)}k` : `${project.followers}`)
    : (project?.visitors ? `${project.visitors}` : '0')
  const conversionVal = project?.reservations?.length
    ? `${project.reservations.length} Backers`
    : (project?.conversionRate ? `${Number(project.conversionRate).toFixed(1)}%` : '0%')
  const revenueVal = project?.currentPresales ? `$${Number(project.currentPresales).toLocaleString()}` : '$0'

  const themeMap = {
    purple: {
      border: 'border-purple-500/30',
      glow: 'shadow-purple-950/40',
      badge: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
      primaryBg: 'bg-purple-600',
      bar: 'bg-purple-500',
      text: 'text-purple-400',
      gradient: 'from-purple-950/40 to-[#0e1117]'
    },
    emerald: {
      border: 'border-emerald-500/30',
      glow: 'shadow-emerald-950/40',
      badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      primaryBg: 'bg-emerald-600',
      bar: 'bg-emerald-500',
      text: 'text-emerald-400',
      gradient: 'from-emerald-950/40 to-[#0e1117]'
    },
    indigo: {
      border: 'border-indigo-500/30',
      glow: 'shadow-indigo-950/40',
      badge: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
      primaryBg: 'bg-indigo-600',
      bar: 'bg-indigo-500',
      text: 'text-indigo-400',
      gradient: 'from-indigo-950/40 to-[#0e1117]'
    },
    amber: {
      border: 'border-amber-500/30',
      glow: 'shadow-amber-950/40',
      badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      primaryBg: 'bg-amber-600',
      bar: 'bg-amber-500',
      text: 'text-amber-400',
      gradient: 'from-amber-950/40 to-[#0e1117]'
    },
    rose: {
      border: 'border-rose-500/30',
      glow: 'shadow-rose-950/40',
      badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
      primaryBg: 'bg-rose-600',
      bar: 'bg-rose-500',
      text: 'text-rose-400',
      gradient: 'from-rose-950/40 to-[#0e1117]'
    },
  }

  const currentTheme = themeMap[theme] || themeMap.purple

  return (
    <div className={`w-full rounded-2xl bg-[#090b0e] border ${currentTheme.border} p-4 sm:p-6 shadow-2xl ${currentTheme.glow} transition-all space-y-4 text-left select-none`}>
      {/* macOS Window Titlebar */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/90 shadow-sm shadow-red-950" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/90 shadow-sm shadow-amber-950" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/90 shadow-sm shadow-emerald-950" />
          </div>
          <div className="px-2.5 py-0.5 rounded-md bg-[#141720] border border-white/[0.06] text-[10px] font-mono text-slate-400 flex items-center gap-1.5">
            <Globe className="w-3 h-3 text-slate-500" />
            <span>{typeof window !== 'undefined' ? `${window.location.origin}/app/${productName.toLowerCase().replace(/[^a-z0-9]/g, '')}` : 'http://localhost:5173/app'}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${currentTheme.badge}`}>
            ⚡ Production v1.0
          </span>
          <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">Co-Built with {creatorName}</span>
        </div>
      </div>

      {/* Mockup App Body */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
        {/* Mini App Sidebar */}
        <div className="md:col-span-3 bg-[#11141c] border border-white/[0.06] rounded-xl p-3 space-y-3">
          <div className="flex items-center gap-2 px-1">
            <div className={`w-7 h-7 rounded-lg ${currentTheme.primaryBg} flex items-center justify-center text-white font-black text-xs shadow-md shrink-0`}>
              {productName.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-white text-xs truncate">{productName}</div>
              <div className="text-[9px] text-slate-400 truncate">{niche}</div>
            </div>
          </div>

          <div className="space-y-1">
            {[
              { label: 'Overview', icon: BarChart3, active: true },
              { label: 'Workflows', icon: Zap, active: false },
              { label: 'Audience', icon: Users, active: false },
              { label: 'Integrations', icon: Layers, active: false },
            ].map((nav, i) => {
              const NavIcon = nav.icon
              return (
                <div
                  key={i}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                    nav.active
                      ? `${currentTheme.primaryBg} text-white shadow-sm`
                      : 'text-slate-400 bg-transparent'
                  }`}
                >
                  <NavIcon className="w-3.5 h-3.5" />
                  <span>{nav.label}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Main App Viewport */}
        <div className="md:col-span-9 space-y-3">
          {/* Header Card */}
          <div className={`p-4 rounded-xl bg-gradient-to-r ${currentTheme.gradient} border ${currentTheme.border} flex items-center justify-between gap-2`}>
            <div>
              <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block">Workspace Dashboard</span>
              <h3 className="text-sm sm:text-base font-extrabold text-white">{productName}</h3>
              <p className="text-[11px] text-slate-300 line-clamp-1">{productTagline}</p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] text-emerald-400 font-bold block">Status: Online</span>
              <span className="text-xs font-mono text-slate-300">Active Node</span>
            </div>
          </div>

          {/* 3 Metric Cards */}
          <div className="grid grid-cols-3 gap-2.5 text-xs">
            <div className="p-3 rounded-xl bg-[#11141c] border border-white/[0.06] space-y-1">
              <span className="text-[9px] uppercase font-bold text-slate-400 block truncate">Audience / Visitors</span>
              <div className="text-sm sm:text-base font-extrabold text-white">{audienceVal}</div>
              <div className="w-full bg-white/[0.06] h-1 rounded-full overflow-hidden">
                <div className={`${currentTheme.bar} h-full w-4/5 rounded-full`} />
              </div>
            </div>
            <div className="p-3 rounded-xl bg-[#11141c] border border-white/[0.06] space-y-1">
              <span className="text-[9px] uppercase font-bold text-slate-400 block truncate">Conversion Rate</span>
              <div className="text-sm sm:text-base font-extrabold text-emerald-400">{conversionVal}</div>
              <div className="w-full bg-white/[0.06] h-1 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full w-11/12 rounded-full" />
              </div>
            </div>
            <div className="p-3 rounded-xl bg-[#11141c] border border-white/[0.06] space-y-1">
              <span className="text-[9px] uppercase font-bold text-slate-400 block truncate">Presales Revenue</span>
              <div className="text-sm sm:text-base font-extrabold text-indigo-300">{revenueVal}</div>
              <div className="w-full bg-white/[0.06] h-1 rounded-full overflow-hidden">
                <div className="bg-indigo-500 h-full w-3/4 rounded-full" />
              </div>
            </div>
          </div>

          {/* Telemetry Stream Bar */}
          <div className="p-2.5 rounded-xl bg-[#11141c] border border-white/[0.06] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Activity className={`w-3.5 h-3.5 ${currentTheme.text}`} />
              <span className="font-semibold text-slate-200 text-[11px]">Real-Time Autonomous Pipeline Running</span>
            </div>
            <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              Live Synced
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
