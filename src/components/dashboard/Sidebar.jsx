import { useState } from 'react'
import { Megaphone, Calendar, Layers, Package, DollarSign, Link, Settings, ChevronLeft, ChevronRight, Users, Laptop, LogOut, UserPlus, ShieldAlert } from 'lucide-react'
import WingLogo from '../ui/WingLogo'
import { useForge } from '../../App'

const NAV_ITEMS = [
  { id: 'preview',    icon: Laptop,     label: 'App Preview',       badge: 'Live' },
  { id: 'marketing',  icon: Megaphone,  label: 'Marketing',         badge: null },
  { id: 'calendar',   icon: Calendar,   label: 'Content Calendar',  badge: null },
  { id: 'community',  icon: Users,      label: 'Community',         badge: null },
  { id: 'studio',     icon: Layers,     label: 'Studio',            badge: null },
  { id: 'products',   icon: Package,    label: 'Products',          badge: null },
  { id: 'revenue',    icon: DollarSign, label: 'Revenue',           badge: null },
  { id: 'accounts',   icon: Link,       label: 'Accounts',          badge: null },
  { id: 'settings',   icon: Settings,   label: 'Settings',          badge: null },
]

export default function Sidebar({ activeTab, setActiveTab, isOpen, setIsOpen }) {
  const { logout, isRegistered, goTo } = useForge()
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-20"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className="relative z-30 flex flex-col border-r flex-shrink-0 transition-all duration-300"
        style={{
          width: isOpen ? '220px' : '60px',
          borderColor: 'var(--theme-border-color)',
          background: 'var(--theme-sidebar-bg)',
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-3 border-b flex-shrink-0 overflow-hidden"
          style={{
            borderColor: 'var(--theme-border-color)',
            padding: isOpen ? '18px 16px' : '18px 0',
            justifyContent: isOpen ? 'flex-start' : 'center',
          }}
        >
          <button
            onClick={() => setIsOpen(o => !o)}
            className="w-7 h-7 flex items-center justify-center flex-shrink-0"
          >
            <WingLogo size={22} />
          </button>
          {isOpen && (
            <span
              className="text-white font-semibold text-[14px] tracking-tight whitespace-nowrap"
              style={{ opacity: isOpen ? 1 : 0, transition: 'opacity 0.15s' }}
            >
              Creator Forge
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 overflow-hidden">
          <div className="space-y-0.5 px-2">
            {NAV_ITEMS.map(({ id, icon: Icon, label, badge }) => {
              const isActive = activeTab === id
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  title={!isOpen ? label : undefined}
                  className="w-full flex items-center rounded-xl transition-all duration-150 group overflow-hidden"
                  style={{
                    padding: isOpen ? '9px 10px' : '9px 0',
                    justifyContent: isOpen ? 'flex-start' : 'center',
                    gap: isOpen ? '10px' : '0',
                    background: isActive
                      ? 'var(--theme-accent-bg)'
                      : 'transparent',
                  }}
                  onMouseEnter={e => {
                    if (!isActive) e.currentTarget.style.background = 'var(--theme-accent-bg)'
                  }}
                  onMouseLeave={e => {
                    if (!isActive) e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <Icon
                    size={16}
                    className="flex-shrink-0 transition-colors"
                    style={{ color: isActive ? 'var(--theme-accent)' : 'var(--theme-text-muted)' }}
                  />

                  {isOpen && (
                    <>
                      <span
                        className="text-[13px] font-medium flex-1 text-left whitespace-nowrap"
                        style={{ color: isActive ? 'var(--theme-text)' : 'var(--theme-text-muted)' }}
                      >
                        {label}
                      </span>
                      {badge && (
                        <span
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                          style={{ background: 'var(--theme-accent)', color: 'var(--theme-btn-primary-text)' }}
                        >
                          {badge}
                        </span>
                      )}
                    </>
                  )}
                </button>
              )
            })}
          </div>
        </nav>

        {/* Register Account Promo (Only if guest) */}
        {!isRegistered && (
          <div className="px-2 pb-2 flex-shrink-0">
            <button
              onClick={() => goTo('signup')}
              title={!isOpen ? "Register Console Account" : undefined}
              className="w-full flex items-center rounded-xl transition-all duration-300 relative overflow-hidden group border"
              style={{
                padding: isOpen ? '10px 10px' : '10px 0',
                justifyContent: isOpen ? 'flex-start' : 'center',
                gap: isOpen ? '10px' : '0',
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(139, 92, 246, 0.05) 100%)',
                borderColor: 'rgba(139, 92, 246, 0.3)',
              }}
            >
              <UserPlus
                size={16}
                className="flex-shrink-0 text-purple-400 group-hover:scale-110 transition-transform"
              />
              {isOpen && (
                <span className="text-[12px] font-semibold text-white whitespace-nowrap text-left flex-1">
                  Register Account
                </span>
              )}
              {/* Subtle accent dot */}
              <span className="absolute right-2 top-2 w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
            </button>
          </div>
        )}

        {/* Logout button */}
        <div className="px-2 pb-2">
          <button
            onClick={() => {
              if (!isRegistered) {
                setShowLogoutModal(true)
              } else {
                logout()
              }
            }}
            title={!isOpen ? "Logout" : undefined}
            className="w-full flex items-center rounded-xl transition-all duration-150 group overflow-hidden"
            style={{
              padding: isOpen ? '9px 10px' : '9px 0',
              justifyContent: isOpen ? 'flex-start' : 'center',
              gap: isOpen ? '10px' : '0',
              background: 'transparent',
              color: 'var(--theme-text-muted)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'
              e.currentTarget.style.color = '#ef4444'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'var(--theme-text-muted)'
            }}
          >
            <LogOut size={16} className="flex-shrink-0" />
            {isOpen && (
              <span className="text-[13px] font-medium text-left whitespace-nowrap">
                Logout
              </span>
            )}
          </button>
        </div>

        {/* Collapse toggle */}
        <div
          className="px-2 py-3 border-t"
          style={{ borderColor: 'var(--theme-border-color)' }}
        >
          <button
            onClick={() => setIsOpen(o => !o)}
            title={isOpen ? "Collapse Sidebar" : "Expand Sidebar"}
            className="w-full flex items-center justify-center py-2 rounded-xl transition-all duration-150"
            style={{ color: 'var(--theme-text-muted)' }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--theme-accent-bg)'
              e.currentTarget.style.color = 'var(--theme-text)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'var(--theme-text-muted)'
            }}
          >
            {isOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
          </button>
        </div>
      </aside>

      {/* Logout Warning Modal for Guests */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}>
          <div className="w-full max-w-sm rounded-2xl border p-6 space-y-6 shadow-2xl text-left bg-[#0e0e0e]" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            <div className="flex items-center gap-3 text-amber-500">
              <ShieldAlert size={22} className="animate-bounce" />
              <h3 className="text-[16px] font-bold text-white">Discard Guest Progress?</h3>
            </div>
            <p className="text-[12.5px] leading-relaxed text-white/50">
              You are currently in a temporary guest session. If you log out without registering, all your scraped signals, content calendars, and campaign drafts will be permanently deleted.
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => {
                  setShowLogoutModal(false)
                  goTo('signup')
                }}
                className="forge-btn-primary w-full text-[13px] py-2.5 font-semibold"
              >
                Register Account & Save
              </button>
              <button
                onClick={() => {
                  setShowLogoutModal(false)
                  logout()
                }}
                className="w-full py-2.5 text-[12px] font-medium rounded-full border border-white/5 hover:border-red-500/20 hover:bg-red-500/5 text-white/40 hover:text-red-400 transition-all text-center"
              >
                Logout anyway (Discard all data)
              </button>
              <button
                onClick={() => setShowLogoutModal(false)}
                className="w-full py-2 text-[12px] font-medium text-white/40 hover:text-white/60 transition-colors text-center"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
