import { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import Marketing from './Marketing'
import ContentCalendar from './ContentCalendar'
import Studio from './Studio'
import Community from './Community'
import Products from './Products'
import Revenue from './Revenue'
import Accounts from './Accounts'
import Settings from './Settings'
import ForgeChat from './ForgeChat'
import { useForge } from '../../App'
import { Sparkles, Laptop, Smartphone, Menu, LogOut } from 'lucide-react'
import WingLogo from '../ui/WingLogo'
import { AppMockup } from '../onboarding/Preview'
import ApiKeysModal from '../ui/ApiKeysModal'

function DashboardAppPreview() {
  const { creatorData } = useForge()
  const theme = creatorData.theme || 'dark'
  const blueprint = creatorData.blueprint || { name: 'Creator Academy', type: 'Web App' }
  const extraTabs = creatorData.extraTabs || []
  const [isMobileView, setIsMobileView] = useState(() => creatorData.isMobileView || false)
  const previewType = blueprint.preview || 'webapp'

  const [mockupActiveTab, setMockupActiveTab] = useState(() => {
    if (previewType === 'webapp') return 'Courses'
    if (previewType === 'mobile') return 'Home Feed'
    if (previewType === 'community') return 'Announcements'
    if (previewType === 'store') return 'All Products'
    return 'Courses'
  })

  return (
    <div className="p-6 h-full flex flex-col items-center justify-center">
      <div className="mb-4 text-center flex flex-col items-center">
        <h3 className="text-[16px] font-bold text-white mb-1">Live App Preview</h3>
        <p className="text-[12px] mb-4" style={{ color: 'var(--theme-text-muted)' }}>
          This is how your space looks to your audience.
        </p>

        {/* Viewport layout toggles */}
        <div 
          className="flex items-center gap-1 p-1 rounded-xl border"
          style={{ 
            background: 'var(--theme-sidebar-bg)', 
            borderColor: 'var(--theme-border-color)' 
          }}
        >
          <button
            onClick={() => setIsMobileView(false)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-150"
            style={{
              background: !isMobileView ? 'var(--theme-accent)' : 'transparent',
              color: !isMobileView ? 'var(--theme-btn-primary-text)' : 'var(--theme-text-muted)',
            }}
          >
            <Laptop size={13} />
            Desktop
          </button>
          <button
            onClick={() => setIsMobileView(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-150"
            style={{
              background: isMobileView ? 'var(--theme-accent)' : 'transparent',
              color: isMobileView ? 'var(--theme-btn-primary-text)' : 'var(--theme-text-muted)',
            }}
          >
            <Smartphone size={13} />
            Mobile
          </button>
        </div>
      </div>
      
      <div className="flex-1 w-full max-w-4xl flex items-center justify-center overflow-hidden">
        {isMobileView ? (
          <div
            className="relative rounded-[36px] border-[8px] shadow-2xl overflow-hidden flex flex-col"
            style={{
              width: '300px',
              height: '520px',
              borderColor: 'var(--theme-border-color)',
              background: '#000',
            }}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-4 bg-[#141414] rounded-b-xl z-20" />
            <div className="flex-1 overflow-hidden">
              <AppMockup
                theme={theme}
                activeTab={mockupActiveTab}
                setActiveTab={setMockupActiveTab}
                blueprint={blueprint}
                creatorData={creatorData}
                extraTabs={extraTabs}
                isMobile={true}
              />
            </div>
          </div>
        ) : (
          <div
            className="w-full h-full max-h-[550px] rounded-2xl border overflow-hidden relative flex flex-col"
            style={{
              borderColor: 'var(--theme-border-color)',
              background: 'var(--theme-bg)',
            }}
          >
            <div
              className="flex items-center gap-2 px-4 py-3 border-b flex-shrink-0"
              style={{ borderColor: 'var(--theme-border-color)', background: 'rgba(255,255,255,0.02)' }}
            >
              {[1,2,3].map(i => (
                <div key={i} className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--theme-border-color)' }} />
              ))}
              <div
                className="flex-1 mx-3 h-5 rounded-md flex items-center px-2"
                style={{ background: 'rgba(255,255,255,0.04)' }}
              >
                <span className="text-[10px]" style={{ color: 'var(--theme-text-muted)', opacity: 0.5 }}>
                  {blueprint.name?.toLowerCase().replace(/\s+/g, '') || 'site'}.forge.app
                </span>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <AppMockup
                theme={theme}
                activeTab={mockupActiveTab}
                setActiveTab={setMockupActiveTab}
                blueprint={blueprint}
                creatorData={creatorData}
                extraTabs={extraTabs}
                isMobile={false}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const TAB_COMPONENTS = {
  preview: DashboardAppPreview,
  marketing: Marketing,
  calendar: ContentCalendar,
  studio: Studio,
  community: Community,
  products: Products,
  revenue: Revenue,
  accounts: Accounts,
  settings: Settings,
}

const TAB_LABELS = {
  preview: 'App Preview',
  marketing: 'Marketing',
  calendar: 'Content Calendar',
  studio: 'Studio',
  community: 'Community',
  products: 'Products',
  revenue: 'Revenue',
  accounts: 'Accounts',
  settings: 'Settings',
}

export default function DashboardLayout() {
  const { 
    creatorData, 
    isRegistered, 
    aiActionsCount, 
    goTo, 
    apiModalOpen, 
    setApiModalOpen,
    activeTab,
    setActiveTab,
    logout,
    userProfile,
  } = useForge()
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 1024)
  const [chatOpen, setChatOpen] = useState(false)

  const TabComponent = TAB_COMPONENTS[activeTab] || Marketing
  const theme = creatorData.theme || 'dark'

  return (
    <div className={`flex h-screen overflow-hidden theme-${theme}`} style={{ background: 'var(--theme-bg)', color: 'var(--theme-text)' }}>
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden" style={{ minWidth: 0 }}>
        {/* Top bar */}
        <div
          className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b flex-shrink-0"
          style={{
            borderColor: 'var(--theme-border-color)',
            background: 'var(--theme-sidebar-bg)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setSidebarOpen(o => !o)}
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg transition-colors"
              style={{ color: 'var(--theme-text-muted)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--theme-accent-bg)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              <Menu size={18} />
            </button>
            <div>
              <h1 className="text-[15px] font-semibold tracking-tight" style={{ color: 'var(--theme-text)' }}>
                {TAB_LABELS[activeTab]}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Live status */}
            <div
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{ background: 'var(--theme-accent-bg)', border: '1px solid var(--theme-accent-border)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[12px]" style={{ color: 'var(--theme-text)' }}>
                {creatorData.productName || 'Creator Academy'} live
              </span>
            </div>

            {/* Forge Chat toggle */}
            <button
              onClick={() => setChatOpen(o => !o)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-150"
              style={{
                background: chatOpen ? 'var(--theme-accent-bg)' : 'rgba(255,255,255,0.05)',
                border: '1px solid',
                borderColor: chatOpen ? 'var(--theme-accent)' : 'var(--theme-border-color)',
                color: chatOpen ? 'var(--theme-text)' : 'var(--theme-text-muted)',
              }}
            >
              <Sparkles size={13} style={{ color: chatOpen ? 'var(--theme-accent)' : 'inherit' }} />
              <span className="text-[12px] font-medium hidden sm:block">Ask Forge</span>
            </button>

            {/* Creator name + avatar */}
            <div className="flex items-center gap-2">
              {creatorData.name && (
                <span className="text-[12px] hidden sm:block" style={{ color: 'var(--theme-text-muted)' }}>
                  {creatorData.name}
                </span>
              )}
              <div
                className="w-8 h-8 rounded-full border overflow-hidden flex items-center justify-center font-semibold text-[13px] cursor-pointer flex-shrink-0"
                style={{
                  background: 'var(--theme-card-bg)',
                  borderColor: 'var(--theme-border-color)',
                  color: 'var(--theme-text)',
                }}
              >
                {creatorData.avatarUrl ? (
                  <img
                    src={creatorData.avatarUrl}
                    alt={creatorData.name || creatorData.handle}
                    className="w-full h-full object-cover"
                    onError={e => { e.currentTarget.style.display = 'none' }}
                  />
                ) : (
                  (creatorData.name || creatorData.handle || 'C').replace('@', '').charAt(0).toUpperCase()
                )}
              </div>
            </div>

            {/* Individual User Logout Button */}
            <button
              onClick={logout}
              title={`Logout ${userProfile?.username || userProfile?.email || 'User'}`}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-300 hover:text-rose-200 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all cursor-pointer shadow-sm ml-1"
            >
              <LogOut size={13} className="text-rose-400" />
              <span className="hidden md:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Guest Action Suggestion Banner */}
        {!isRegistered && aiActionsCount >= 3 && (
          <div 
            className="mx-3 sm:mx-6 mt-3 sm:mt-4 p-3 sm:p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-fade-in-down relative overflow-hidden flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)',
              borderColor: 'rgba(139, 92, 246, 0.25)',
              backdropFilter: 'blur(16px)',
              boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
            }}
          >
            {/* Ambient purple background glow */}
            <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-purple-500/10 blur-xl pointer-events-none" />
            
            <div className="flex items-center gap-3.5 relative z-10">
              <div 
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 border"
                style={{ 
                  background: 'rgba(139, 92, 246, 0.1)', 
                  borderColor: 'rgba(139, 92, 246, 0.2)' 
                }}
              >
                <Sparkles size={16} className="text-purple-400 animate-pulse" />
              </div>
              <div className="space-y-0.5 text-left">
                <h4 className="text-[13px] font-semibold text-white tracking-tight flex items-center gap-2">
                  Upgrade to Secure Account
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded-full">
                    {aiActionsCount} AI Actions
                  </span>
                </h4>
                <p className="text-[12px] leading-relaxed" style={{ color: 'var(--theme-text-muted)' }}>
                  You are currently exploring Creator Forge in a temporary guest session. Register your permanent profile to protect and preserve your transient API keys, calendar configurations, and launch assets.
                </p>
              </div>
            </div>
            
            <button 
              onClick={() => goTo('signup')} 
              className="forge-btn-primary text-[12px] py-2 px-4 whitespace-nowrap self-start sm:self-center relative z-10 flex items-center gap-1.5"
            >
              Secure Console Account
            </button>
          </div>
        )}

        {/* Content row */}
        <div className="flex-1 flex overflow-hidden">
          {/* Tab content */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden min-w-0 max-w-full">
            <TabComponent />
          </div>

          {/* Forge Chat panel */}
          <ForgeChat isOpen={chatOpen} onClose={() => setChatOpen(false)} />
        </div>
      </main>
      
      {/* Global Modals */}
      {apiModalOpen && (
        <ApiKeysModal onClose={() => setApiModalOpen(false)} tab="ai" />
      )}
    </div>
  )
}
