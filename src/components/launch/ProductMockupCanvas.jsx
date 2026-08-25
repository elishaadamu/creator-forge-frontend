import { useState, useRef } from 'react'
import {
  Sparkles, Camera, Download, RefreshCw, Loader2, Check, Image,
  Layers, Palette, Activity, Zap, Users, BarChart3, CheckCircle2,
  Sliders, ShieldCheck, ArrowRight, Smartphone, Monitor, Globe,
  Edit3, Settings2
} from 'lucide-react'
import html2canvas from 'html2canvas'
import { generateProductImageWithOpenAI } from '../../services/ai'

export default function ProductMockupCanvas({ project, onSaveMockupImage, onShowNotification }) {
  const mockupRef = useRef(null)
  const [viewMode, setViewMode] = useState('interactive') // 'interactive' | 'ai_generated' | 'converted'
  const [accentColor, setAccentColor] = useState('purple')
  const [isCapturing, setIsCapturing] = useState(false)
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [convertedImageUrl, setConvertedImageUrl] = useState(() => project?.mockupImage || null)
  const [aiImageUrl, setAiImageUrl] = useState(() => project?.mockupImage || null)
  const [showCustomizer, setShowCustomizer] = useState(false)

  const productName = project?.productName || 'Software Product'
  const creatorName = project?.creatorName || 'Creator'
  const niche = project?.niche || 'Software'
  const productTagline = project?.productTagline || 'Autonomous software suite built for creators'

  // Dynamic real data derived from project
  const initialAudienceVal = project?.followers
    ? (Number(project.followers) >= 1000 ? `${(Number(project.followers) / 1000).toFixed(1)}k` : `${project.followers}`)
    : (project?.visitors ? `${project.visitors}` : '0')
  const initialConversionVal = project?.reservations?.length
    ? `${project.reservations.length} Backers`
    : (project?.conversionRate ? `${Number(project.conversionRate).toFixed(1)}%` : '0%')
  const initialRevenueVal = project?.currentPresales ? `$${Number(project.currentPresales).toLocaleString()}` : '$0'

  // Customizer state for editable mockup metrics
  const [m1Label, setM1Label] = useState('Audience / Visitors')
  const [m1Val, setM1Val] = useState(initialAudienceVal)
  const [m2Label, setM2Label] = useState('Pre-Orders / Conversion')
  const [m2Val, setM2Val] = useState(initialConversionVal)
  const [m3Label, setM3Label] = useState('Presales Revenue')
  const [m3Val, setM3Val] = useState(initialRevenueVal)

  // Accent color themes
  const themeMap = {
    purple: {
      border: 'border-purple-500/40',
      glow: 'shadow-purple-950/50',
      badge: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
      primaryBg: 'bg-purple-600',
      bar: 'bg-purple-500',
      text: 'text-purple-400',
      gradient: 'from-purple-950/40 to-[#0e1117]'
    },
    emerald: {
      border: 'border-emerald-500/40',
      glow: 'shadow-emerald-950/50',
      badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      primaryBg: 'bg-emerald-600',
      bar: 'bg-emerald-500',
      text: 'text-emerald-400',
      gradient: 'from-emerald-950/40 to-[#0e1117]'
    },
    indigo: {
      border: 'border-indigo-500/40',
      glow: 'shadow-indigo-950/50',
      badge: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
      primaryBg: 'bg-indigo-600',
      bar: 'bg-indigo-500',
      text: 'text-indigo-400',
      gradient: 'from-indigo-950/40 to-[#0e1117]'
    },
    amber: {
      border: 'border-amber-500/40',
      glow: 'shadow-amber-950/50',
      badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      primaryBg: 'bg-amber-600',
      bar: 'bg-amber-500',
      text: 'text-amber-400',
      gradient: 'from-amber-950/40 to-[#0e1117]'
    },
    rose: {
      border: 'border-rose-500/40',
      glow: 'shadow-rose-950/50',
      badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
      primaryBg: 'bg-rose-600',
      bar: 'bg-rose-500',
      text: 'text-rose-400',
      gradient: 'from-rose-950/40 to-[#0e1117]'
    },
  }

  const currentTheme = themeMap[accentColor] || themeMap.purple

  // Convert live rendered DOM to PNG image
  const handleConvertToImage = async () => {
    if (!mockupRef.current) return
    setIsCapturing(true)
    try {
      await new Promise(r => setTimeout(r, 120))
      const canvas = await html2canvas(mockupRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#090b0e',
        logging: false
      })
      const dataUrl = canvas.toDataURL('image/png')
      setConvertedImageUrl(dataUrl)
      setViewMode('converted')
      onSaveMockupImage?.(dataUrl)
      onShowNotification?.('UI Mockup converted to high-res PNG image!')
    } catch (err) {
      console.error('Failed to convert mockup to image:', err)
      onShowNotification?.('Failed to convert mockup to image.')
    } finally {
      setIsCapturing(false)
    }
  }

  // Generate with OpenAI DALL-E 3
  const handleGenerateOpenAIImage = async () => {
    setIsGeneratingAI(true)
    try {
      const generated = await generateProductImageWithOpenAI({
        productName,
        creatorName,
        niche
      })
      if (generated) {
        setAiImageUrl(generated)
        setConvertedImageUrl(generated)
        setViewMode('ai_generated')
        onSaveMockupImage?.(generated)
        onShowNotification?.('OpenAI DALL-E 3 generated product mockup image!')
      }
    } catch (err) {
      console.error('OpenAI image generation error:', err)
      onShowNotification?.('OpenAI DALL-E 3 image generation failed. Verify API key.')
    } finally {
      setIsGeneratingAI(false)
    }
  }

  // Download Image File
  const handleDownload = () => {
    const activeImg = viewMode === 'ai_generated' ? aiImageUrl : convertedImageUrl
    if (!activeImg) return
    const a = document.createElement('a')
    a.href = activeImg
    a.download = `${productName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_mockup.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    onShowNotification?.('Downloading mockup image file...')
  }

  return (
    <div className="space-y-4 w-full max-w-full overflow-hidden">
      {/* Compact Responsive Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-2xl bg-[#0e1117] border border-white/[0.08]">
        {/* View Mode Tabs */}
        <div className="flex items-center gap-1 bg-[#141720] p-1 rounded-xl border border-white/[0.06] shrink-0">
          <button
            onClick={() => setViewMode('interactive')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
              viewMode === 'interactive' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Studio
          </button>
          <button
            onClick={() => setViewMode('ai_generated')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ${
              viewMode === 'ai_generated' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3 h-3 text-purple-300" />
            <span>DALL-E 3</span>
          </button>
          {convertedImageUrl && (
            <button
              onClick={() => setViewMode('converted')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                viewMode === 'converted' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              PNG
            </button>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Accent Palette Selector */}
          {viewMode === 'interactive' && (
            <div className="flex items-center gap-1 pr-1.5 border-r border-white/[0.08]">
              {['purple', 'emerald', 'indigo', 'amber', 'rose'].map(color => (
                <button
                  key={color}
                  onClick={() => setAccentColor(color)}
                  className={`w-4 h-4 rounded-full border transition-transform ${
                    color === 'purple' ? 'bg-purple-500' :
                    color === 'emerald' ? 'bg-emerald-500' :
                    color === 'indigo' ? 'bg-indigo-500' :
                    color === 'amber' ? 'bg-amber-500' : 'bg-rose-500'
                  } ${accentColor === color ? 'border-white scale-110 shadow-sm' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  title={`${color} theme`}
                />
              ))}
            </div>
          )}

          {/* Toggle Customizer */}
          {viewMode === 'interactive' && (
            <button
              onClick={() => setShowCustomizer(!showCustomizer)}
              className={`px-2.5 py-1 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-colors ${
                showCustomizer ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' : 'bg-white/[0.04] text-slate-300 border-white/[0.08]'
              }`}
            >
              <Settings2 className="w-3 h-3" />
              <span>Edit</span>
            </button>
          )}

          {/* Snap PNG Button */}
          {viewMode === 'interactive' && (
            <button
              onClick={handleConvertToImage}
              disabled={isCapturing}
              className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 transition-all shadow-sm active:scale-95 disabled:opacity-50"
            >
              {isCapturing ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Snapping...</span>
                </>
              ) : (
                <>
                  <Camera className="w-3 h-3" />
                  <span>Snap PNG</span>
                </>
              )}
            </button>
          )}

          {/* AI Generator Button */}
          <button
            onClick={handleGenerateOpenAIImage}
            disabled={isGeneratingAI}
            className="px-3 py-1 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1 transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            {isGeneratingAI ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3 text-purple-200" />
                <span>Generate AI</span>
              </>
            )}
          </button>

          {/* Download Button */}
          {(convertedImageUrl || aiImageUrl) && (
            <button
              onClick={handleDownload}
              className="p-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-slate-200 hover:text-white border border-white/[0.1] transition-colors"
              title="Download PNG Image"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Optional Data Customizer Drawer */}
      {showCustomizer && viewMode === 'interactive' && (
        <div className="p-4 rounded-xl bg-[#141720] border border-white/[0.08] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs animate-fade-in">
          <div>
            <label className="text-[10px] text-slate-400 font-bold block mb-1">Metric 1 (Label & Value)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={m1Label}
                onChange={e => setM1Label(e.target.value)}
                className="w-1/2 px-2.5 py-1.5 rounded-lg bg-[#0e1117] border border-white/[0.08] text-white text-xs"
              />
              <input
                type="text"
                value={m1Val}
                onChange={e => setM1Val(e.target.value)}
                className="w-1/2 px-2.5 py-1.5 rounded-lg bg-[#0e1117] border border-white/[0.08] text-purple-300 font-bold text-xs"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-slate-400 font-bold block mb-1">Metric 2 (Label & Value)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={m2Label}
                onChange={e => setM2Label(e.target.value)}
                className="w-1/2 px-2.5 py-1.5 rounded-lg bg-[#0e1117] border border-white/[0.08] text-white text-xs"
              />
              <input
                type="text"
                value={m2Val}
                onChange={e => setM2Val(e.target.value)}
                className="w-1/2 px-2.5 py-1.5 rounded-lg bg-[#0e1117] border border-white/[0.08] text-emerald-300 font-bold text-xs"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-slate-400 font-bold block mb-1">Metric 3 (Label & Value)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={m3Label}
                onChange={e => setM3Label(e.target.value)}
                className="w-1/2 px-2.5 py-1.5 rounded-lg bg-[#0e1117] border border-white/[0.08] text-white text-xs"
              />
              <input
                type="text"
                value={m3Val}
                onChange={e => setM3Val(e.target.value)}
                className="w-1/2 px-2.5 py-1.5 rounded-lg bg-[#0e1117] border border-white/[0.08] text-indigo-300 font-bold text-xs"
              />
            </div>
          </div>
        </div>
      )}

      {/* VIEW 1: INTERACTIVE LIVE UI STUDIO */}
      {viewMode === 'interactive' && (
        <div className="space-y-2">
          {/* Mockup Canvas to be captured */}
          <div
            ref={mockupRef}
            className={`rounded-2xl bg-[#090b0e] border ${currentTheme.border} p-4 sm:p-6 shadow-2xl ${currentTheme.glow} transition-all space-y-4`}
          >
            {/* macOS Window Titlebar */}
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/90 shadow-sm shadow-red-950" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/90 shadow-sm shadow-amber-950" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/90 shadow-sm shadow-emerald-950" />
                </div>
                <div className="px-3 py-0.5 rounded-md bg-[#141720] border border-white/[0.06] text-[10px] font-mono text-slate-400 flex items-center gap-1.5">
                  <Globe className="w-3 h-3 text-slate-500" />
                  <span>{typeof window !== 'undefined' ? `${window.location.origin}/app/${productName.toLowerCase().replace(/[^a-z0-9]/g, '')}` : 'http://localhost:5173/app'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${currentTheme.badge}`}>
                  ⚡ Production v1.0
                </span>
                <span className="text-[10px] font-mono text-slate-400">Co-Built with {creatorName}</span>
              </div>
            </div>

            {/* Mockup App Body */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
              {/* Mini App Sidebar */}
              <div className="md:col-span-3 bg-[#11141c] border border-white/[0.06] rounded-xl p-3 space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <div className={`w-7 h-7 rounded-lg ${currentTheme.primaryBg} flex items-center justify-center text-white font-black text-xs shadow-md`}>
                    {productName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
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
                            : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
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
                <div className={`p-4 rounded-xl bg-gradient-to-r ${currentTheme.gradient} border ${currentTheme.border} flex items-center justify-between`}>
                  <div>
                    <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block">Workspace Dashboard</span>
                    <h3 className="text-base font-extrabold text-white">{productName}</h3>
                    <p className="text-[11px] text-slate-300">{productTagline}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-emerald-400 font-bold block">Status: Online</span>
                    <span className="text-xs font-mono text-slate-300">Active Node</span>
                  </div>
                </div>

                {/* 3 Metric Cards (Dynamic & Editable) */}
                <div className="grid grid-cols-3 gap-2.5 text-xs">
                  <div className="p-3 rounded-xl bg-[#11141c] border border-white/[0.06] space-y-1">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block truncate">{m1Label}</span>
                    <div className="text-sm sm:text-base font-extrabold text-white">{m1Val}</div>
                    <div className="w-full bg-white/[0.06] h-1 rounded-full overflow-hidden">
                      <div className={`${currentTheme.bar} h-full w-4/5 rounded-full`} />
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#11141c] border border-white/[0.06] space-y-1">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block truncate">{m2Label}</span>
                    <div className="text-sm sm:text-base font-extrabold text-emerald-400">{m2Val}</div>
                    <div className="w-full bg-white/[0.06] h-1 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full w-11/12 rounded-full" />
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#11141c] border border-white/[0.06] space-y-1">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block truncate">{m3Label}</span>
                    <div className="text-sm sm:text-base font-extrabold text-indigo-300">{m3Val}</div>
                    <div className="w-full bg-white/[0.06] h-1 rounded-full overflow-hidden">
                      <div className="bg-indigo-500 h-full w-3/4 rounded-full" />
                    </div>
                  </div>
                </div>

                {/* Telemetry Stream Bar */}
                <div className="p-3 rounded-xl bg-[#11141c] border border-white/[0.06] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Activity className={`w-4 h-4 ${currentTheme.text}`} />
                    <span className="font-semibold text-slate-200">Real-Time Autonomous Pipeline Running</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Live Synced
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>Interactive Studio Canvas • Rendered at 2x Ultra HD resolution</span>
            <button
              onClick={handleConvertToImage}
              className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1"
            >
              <span>Click "Convert to PNG" to save snapshot</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* VIEW 2: OPENAI DALL-E 3 GENERATED IMAGE */}
      {viewMode === 'ai_generated' && (
        <div className="p-5 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>OpenAI DALL-E 3 Visual Mockup</span>
              </h4>
              <p className="text-xs text-slate-400">Photorealistic product design render powered by OpenAI.</p>
            </div>
            {aiImageUrl && (
              <button
                onClick={handleDownload}
                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Mockup</span>
              </button>
            )}
          </div>

          {aiImageUrl ? (
            <div className="rounded-xl overflow-hidden border border-purple-500/30 shadow-2xl max-h-[420px] flex items-center justify-center bg-black">
              <img
                src={aiImageUrl}
                alt="OpenAI Generated Mockup"
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 border border-dashed border-white/[0.1] rounded-2xl space-y-3">
              <Image className="w-10 h-10 text-purple-400 mx-auto" />
              <p className="text-xs">No OpenAI DALL-E 3 mockup generated yet.</p>
              <button
                onClick={handleGenerateOpenAIImage}
                disabled={isGeneratingAI}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 mx-auto"
              >
                {isGeneratingAI ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>Generate with OpenAI DALL-E 3</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: CONVERTED HIGH-RES PNG IMAGE */}
      {viewMode === 'converted' && (
        <div className="p-5 rounded-2xl bg-[#0e1117] border border-emerald-500/30 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Exported High-Resolution PNG Image Asset</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PNG</span>
              </button>
              <button
                onClick={() => setViewMode('interactive')}
                className="px-3 py-1.5 rounded-xl bg-white/[0.06] text-slate-300 text-xs font-bold"
              >
                Edit in Studio
              </button>
            </div>
          </div>

          <div className="rounded-xl overflow-hidden border border-white/[0.1] shadow-2xl max-h-[420px] flex items-center justify-center bg-black">
            <img
              src={convertedImageUrl}
              alt="Converted PNG Mockup"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  )
}
