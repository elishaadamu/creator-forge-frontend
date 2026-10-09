import { driver } from "driver.js"
import "driver.js/dist/driver.css"

export const TOUR_S1_KEY = 'forge_driver_tour_s1_dismissed'
export const TOUR_S2_KEY = 'forge_driver_tour_s2_dismissed'
export const TOUR_CRM_KEY = 'forge_driver_tour_crm_dismissed'
export const TOUR_PARTICIPATION_KEY = 'forge_driver_tour_participation_dismissed'
export const TOUR_PORTAL_PRE_KEY = 'forge_driver_tour_portal_pre_dismissed'
export const TOUR_PORTAL_POST_KEY = 'forge_driver_tour_portal_post_dismissed'
export const TOUR_ADMIN_KEY = 'forge_driver_tour_admin_dismissed'

export function isTourDismissed(key) {
  if (typeof window === 'undefined') return true
  try {
    return localStorage.getItem(key) === 'true'
  } catch {
    return false
  }
}

export function dismissTour(key) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, 'true')
  } catch (e) {
    console.warn('[DriverTour] LocalStorage write error:', e)
  }
}

export function isTourS1Dismissed() { return isTourDismissed(TOUR_S1_KEY) }
export function isTourS2Dismissed() { return isTourDismissed(TOUR_S2_KEY) }
export function isTourCrmDismissed() { return isTourDismissed(TOUR_CRM_KEY) }
export function isTourParticipationDismissed() { return isTourDismissed(TOUR_PARTICIPATION_KEY) }
export function isTourPortalPreDismissed() { return isTourDismissed(TOUR_PORTAL_PRE_KEY) }
export function isTourPortalPostDismissed() { return isTourDismissed(TOUR_PORTAL_POST_KEY) }
export function isTourAdminDismissed() { return isTourDismissed(TOUR_ADMIN_KEY) }

export function dismissTourS1() { dismissTour(TOUR_S1_KEY) }
export function dismissTourS2() { dismissTour(TOUR_S2_KEY) }
export function dismissTourCrm() { dismissTour(TOUR_CRM_KEY) }
export function dismissTourParticipation() { dismissTour(TOUR_PARTICIPATION_KEY) }
export function dismissTourPortalPre() { dismissTour(TOUR_PORTAL_PRE_KEY) }
export function dismissTourPortalPost() { dismissTour(TOUR_PORTAL_POST_KEY) }
export function dismissTourAdmin() { dismissTour(TOUR_ADMIN_KEY) }

export function resetAllTourPreferences() {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(TOUR_S1_KEY)
    localStorage.removeItem(TOUR_S2_KEY)
    localStorage.removeItem(TOUR_CRM_KEY)
    localStorage.removeItem(TOUR_PARTICIPATION_KEY)
    localStorage.removeItem(TOUR_PORTAL_PRE_KEY)
    localStorage.removeItem(TOUR_PORTAL_POST_KEY)
    localStorage.removeItem(TOUR_ADMIN_KEY)
  } catch {}
}

let activeDriverInstance = null

export function stopActiveTour() {
  if (activeDriverInstance) {
    try {
      activeDriverInstance.destroy()
    } catch {}
    activeDriverInstance = null
  }
  // Remove any leftover driver overlay artifacts
  if (typeof document !== 'undefined') {
    document.querySelectorAll('.driver-overlay, .driver-popover').forEach(el => el.remove())
    document.body.classList.remove('driver-active', 'driver-fade', 'driver-simple', 'driver-no-scroll')
  }
}

/**
 * Internal helper to instantiate a clean Driver.js tour
 * with bulletproof close & done handlers.
 */
function createManagedTour({ steps, dismissKey, onDoneText = 'Done ✓' }) {
  stopActiveTour()

  const safeDismissAndClose = (drv) => {
    dismissTour(dismissKey)
    try {
      if (drv) drv.destroy()
    } catch {}
    stopActiveTour()
  }

  // Filter steps so driver only attempts to navigate elements that exist or will exist
  const driverObj = driver({
    showProgress: true,
    animate: true,
    allowClose: true,
    overlayColor: 'rgba(15, 23, 42, 0.78)',
    stagePadding: 8,
    stageRadius: 14,
    popoverClass: 'creator-forge-driver-popover',
    nextBtnText: 'Next Step →',
    prevBtnText: '← Back',
    doneBtnText: onDoneText,
    onDoneClick: (element, step, { driver }) => {
      safeDismissAndClose(driver)
    },
    onCloseClick: (element, step, { driver }) => {
      safeDismissAndClose(driver)
    },
    onDestroyed: () => {
      dismissTour(dismissKey)
      activeDriverInstance = null
    },
    steps
  })

  activeDriverInstance = driverObj
  driverObj.drive()
  return driverObj
}

/**
 * 1. SECTION 1 TOUR (Acquisition OS: Step 1 Focused)
 * Focuses on: Navigation bar links, Target niche, Followers, Platforms, Creators numbers, and Discovery button.
 */
export function startSection1Tour(force = false) {
  if (!force && isTourS1Dismissed()) return null

  const steps = [
    {
      element: '#tour-header-nav',
      popover: {
        title: 'Main Navigation & Suite Links',
        description: 'Switch anytime between Acquisition OS (creator discovery), Project OS (Phase 1–3 co-launch cockpit), and Follow-Up CRM.',
        side: 'bottom',
        align: 'start'
      }
    },
    {
      element: '#tour-s1-niche-select',
      popover: {
        title: 'Target Niche(s)',
        description: 'Select pre-configured high-affinity creator niches (Electronics, SaaS, Gaming, etc.) or type custom niches. This directly seeds the discovery scraper.',
        side: 'bottom',
        align: 'start'
      }
    },
    {
      element: '#tour-s1-platforms',
      popover: {
        title: 'Target Platforms',
        description: 'Toggle discovery across YouTube (long-form videos & shorts), Instagram, or TikTok to locate qualified creator channels.',
        side: 'top',
        align: 'start'
      }
    },
    {
      element: '#tour-s1-followers',
      popover: {
        title: 'Followers / Audience Size',
        description: 'Set your audience range (100K–250K, 250K–500K, 500K–1M). Targeting 100K–1M ensures high engagement and high conversion rates.',
        side: 'top',
        align: 'start'
      }
    },
    {
      element: '#tour-s1-creators-count',
      popover: {
        title: 'Creators Target Count',
        description: 'Define how many qualified creator channels you want the crawler to discover, inspect, and enrich in this campaign batch (up to 50).',
        side: 'top',
        align: 'start'
      }
    },
    {
      element: '#tour-s1-discovery-btn',
      popover: {
        title: 'Start Autonomous Lead Discovery',
        description: 'Click to launch the discovery engine. The crawler will audit channel metrics, extract verified emails, and build rich creator profiles.',
        side: 'top',
        align: 'center'
      }
    }
  ]

  return createManagedTour({ steps, dismissKey: TOUR_S1_KEY })
}

/**
 * 2. SECTION 2 TOUR (Project OS: Command Center)
 */
export function startSection2Tour(force = false) {
  if (!force && isTourS2Dismissed()) return null

  const steps = [
    {
      element: '#tour-s2-header',
      popover: {
        title: 'Co-Launch Command Center',
        description: 'Welcome to your active venture headquarters. Review creator partnership details, pricing model, and live venture progress.',
        side: 'bottom',
        align: 'start'
      }
    },
    {
      element: '#tour-s2-blueprint-card',
      popover: {
        title: 'Chosen Concept Blueprint',
        description: 'This is the locked software venture chosen in Step 5. It contains the ICP target audience, core problem, and feature list.',
        side: 'top',
        align: 'start'
      }
    },
    {
      element: '#tour-s2-phase-tabs',
      popover: {
        title: '3-Phase Co-Launch Engine',
        description: 'Phase 1: Validate (presales & waitlist) → Phase 2: Build MVP (AI sprints) → Phase 3: Live Launch (public rollout).',
        side: 'right',
        align: 'center'
      }
    },
    {
      element: '#tour-s2-presales-meter',
      popover: {
        title: 'Presales Revenue Meter',
        description: 'Track pre-order revenue toward your Phase 1 validation target ($12,500 goal). Unlocks MVP development once reached.',
        side: 'bottom',
        align: 'center'
      }
    },
    {
      element: '#tour-s2-open-workspace-btn',
      popover: {
        title: 'Phase Execution Workspace',
        description: 'Open the active phase modal to review tasks, generate assets, or adjust marketing campaigns with AI.',
        side: 'bottom',
        align: 'end'
      }
    },
    {
      element: '#tour-s2-mockup-card',
      popover: {
        title: 'Dynamic Software Mockup',
        description: 'Live interactive software preview themed dynamically to match the creator niche brand colors.',
        side: 'left',
        align: 'center'
      }
    },
    {
      element: '#tour-s2-theme-picker',
      popover: {
        title: 'Creator Brand Theme Picker',
        description: 'Switch between 7 curated venture palettes (Venture Amber, Studio Emerald, Ocean Cyan, Royal Indigo, Forge Lime, Obsidian Slate, Industrial Steel).',
        side: 'bottom',
        align: 'end'
      }
    }
  ]

  return createManagedTour({ steps, dismissKey: TOUR_S2_KEY })
}

/**
 * 3. FOLLOW-UP CRM TOUR (/follow-up-crm)
 */
export function startCrmTour(force = false) {
  if (!force && isTourCrmDismissed()) return null

  const steps = [
    {
      element: '#tour-crm-header',
      popover: {
        title: 'Creator Follow-Up CRM',
        description: 'Manage creator leads, classify inbound replies, review full email threads, and advance partnership stages.',
        side: 'bottom',
        align: 'start'
      }
    },
    {
      element: '#tour-crm-sync',
      popover: {
        title: 'Sync Gmail Replies',
        description: 'Poll IMAP to ingest real-time responses from creator channel emails directly into the CRM.',
        side: 'bottom',
        align: 'end'
      }
    },
    {
      element: '#tour-crm-kpis',
      popover: {
        title: 'Pipeline Classification Pills',
        description: 'Filter leads by response status: Active Ventures, Interested, Studio Replied, Questions, or Awaiting Reply.',
        side: 'bottom',
        align: 'start'
      }
    },
    {
      element: '#tour-crm-search',
      popover: {
        title: 'Instant Search & Platform Filters',
        description: 'Search creators by name, handle, verified email address, or social platform.',
        side: 'bottom',
        align: 'start'
      }
    },
    {
      element: '#tour-crm-list',
      popover: {
        title: 'Creator Leads & Action Cards',
        description: 'Review creator dossiers, view message history, send replies, or approve creators for 50/50 venture co-launch.',
        side: 'top',
        align: 'center'
      }
    }
  ]

  return createManagedTour({ steps, dismissKey: TOUR_CRM_KEY })
}

/**
 * 4. PARTICIPATION MANAGER TOUR (/participation-manager)
 */
export function startParticipationTour(force = false) {
  if (!force && isTourParticipationDismissed()) return null

  const steps = [
    {
      element: '#tour-participation-header',
      popover: {
        title: 'Creator Participation Manager',
        description: 'Dedicated console to manage creator co-ownership, track choices, and interactive Co-Builder access passes.',
        side: 'bottom',
        align: 'start'
      }
    },
    {
      element: '#tour-participation-pass-fee',
      popover: {
        title: 'Configurable Co-Builder Pass Fee',
        description: 'Edit the flat interactive Co-Builder Pass fee ($50 USD base). Creators pay this for hands-on developer access.',
        side: 'bottom',
        align: 'start'
      }
    },
    {
      element: '#tour-participation-equity-banner',
      popover: {
        title: '50/50 Co-Founder Equity Architecture',
        description: 'Creators always retain 50% equity whether they choose the interactive Co-Builder track or the hands-off Studio-Managed track.',
        side: 'bottom',
        align: 'start'
      }
    },
    {
      element: '#tour-participation-kpis',
      popover: {
        title: 'Participation Metrics',
        description: 'Track active Co-Builders, Studio-Managed ventures, and pending creator decisions.',
        side: 'bottom',
        align: 'start'
      }
    },
    {
      element: '#tour-participation-filters',
      popover: {
        title: 'Track Filters',
        description: 'Filter ventures by Co-Builders Active, Pending Choice, or Studio-Managed.',
        side: 'bottom',
        align: 'start'
      }
    },
    {
      element: '#tour-participation-list',
      popover: {
        title: 'Co-Launch Venture Directory',
        description: 'Open creator workspaces, copy portal magic links, and dispatch personalized follow-up emails.',
        side: 'top',
        align: 'center'
      }
    }
  ]

  return createManagedTour({ steps, dismissKey: TOUR_PARTICIPATION_KEY })
}

/**
 * 5. CREATOR PORTAL PRE-PAYMENT TOUR (/portal/:portalId)
 */
export function startCreatorPortalPrePaymentTour(force = false) {
  if (!force && isTourPortalPreDismissed()) return null

  const steps = [
    {
      element: '#tour-portal-header',
      popover: {
        title: 'Creator Co-Founder Portal',
        description: 'Welcome to your dedicated partnership portal. Here you can explore your tailored software concept and choose your launch track.',
        side: 'bottom',
        align: 'start'
      }
    },
    {
      element: '#tour-portal-equity',
      popover: {
        title: '50/50 Co-Founder Revenue Model',
        description: 'You retain 50% co-founder profit split. Track pre-order momentum and customer backing in real-time.',
        side: 'bottom',
        align: 'start'
      }
    },
    {
      element: '#tour-portal-blueprint',
      popover: {
        title: 'Audience-Tailored Concept Blueprint',
        description: 'Review the software concept, target customer demographic, and monetization structure built specifically for your audience.',
        side: 'top',
        align: 'start'
      }
    },
    {
      element: '#tour-portal-track-card',
      popover: {
        title: 'Choose Your Track',
        description: 'Compare Track 1 (Interactive Co-Builder Pass with hands-on AI sprints) and Track 2 (Studio-Managed, 100% hands-off engineering).',
        side: 'top',
        align: 'center'
      }
    },
    {
      element: '#tour-portal-unlock-btn',
      popover: {
        title: 'Unlock Co-Builder Pass',
        description: 'Activate your interactive pass to get direct developer access inside the ProjectOS workspace and co-build your MVP.',
        side: 'top',
        align: 'center'
      }
    }
  ]

  return createManagedTour({ steps, dismissKey: TOUR_PORTAL_PRE_KEY })
}

/**
 * 6. CREATOR PORTAL POST-PAYMENT TOUR (/portal/:portalId - Paid)
 */
export function startCreatorPortalPostPaymentTour(force = false) {
  if (!force && isTourPortalPostDismissed()) return null

  const steps = [
    {
      element: '#tour-portal-badge',
      popover: {
        title: 'Verified Co-Builder Pass Active',
        description: 'Your pass is activated! You have full developer access, verified license credentials, and priority studio engineering support.',
        side: 'bottom',
        align: 'start'
      }
    },
    {
      element: '#tour-portal-workspace',
      popover: {
        title: 'Interactive ProjectOS Workspace',
        description: 'Execute Phase 1 validation tasks, review Phase 2 MVP sprints, and co-direct the build directly inside your portal.',
        side: 'top',
        align: 'center'
      }
    },
    {
      element: '#tour-portal-campaigns',
      popover: {
        title: 'Launch Campaigns & Marketing Kits',
        description: 'Access promotional post copy, video scripts, and visual social assets ready to share with your audience.',
        side: 'top',
        align: 'center'
      }
    },
    {
      element: '#tour-portal-chat',
      popover: {
        title: 'Direct Studio Team Line',
        description: 'Collaborate directly with Creator Forge engineers via your private WhatsApp/direct chat line.',
        side: 'top',
        align: 'end'
      }
    }
  ]

  return createManagedTour({ steps, dismissKey: TOUR_PORTAL_POST_KEY })
}

/**
 * 7. ADMIN PIPELINE LOOKUP & ERROR LOG TOUR (/admin-error-log)
 */
export function startAdminDashboardTour(force = false) {
  if (!force && isTourAdminDismissed()) return null

  const steps = [
    {
      element: '#tour-admin-header',
      popover: {
        title: 'Pipeline Diagnostics & Exception Dashboard',
        description: 'Audit outreach deliveries, diagnose email errors, and track creator pipeline conversions.',
        side: 'bottom',
        align: 'start'
      }
    },
    {
      element: '#tour-admin-sync',
      popover: {
        title: 'Sync Inbox & Replies',
        description: 'Trigger an on-demand poll across IMAP mailboxes to ingest incoming creator responses and error bounces.',
        side: 'bottom',
        align: 'end'
      }
    },
    {
      element: '#tour-admin-filters',
      popover: {
        title: 'Pipeline Status & Issue Filters',
        description: 'Filter leads by diagnostic state: All, Awaiting Reply, Declined, or Stalled Outreach.',
        side: 'bottom',
        align: 'start'
      }
    },
    {
      element: '#tour-admin-list',
      popover: {
        title: 'Exception & Lead Audit Table',
        description: 'Inspect individual outreach records, retry failed emails, or force-launch projects directly.',
        side: 'top',
        align: 'center'
      }
    }
  ]

  return createManagedTour({ steps, dismissKey: TOUR_ADMIN_KEY })
}

/**
 * Universal single-element highlight utility
 */
export function highlightTourElement(selector, title, description) {
  stopActiveTour()
  const driverObj = driver({
    showProgress: false,
    animate: true,
    allowClose: true,
    overlayColor: 'rgba(15, 23, 42, 0.78)',
    stagePadding: 8,
    stageRadius: 14,
    popoverClass: 'creator-forge-driver-popover',
    doneBtnText: 'Got It ✓',
    onDoneClick: (element, step, { driver }) => {
      driver.destroy()
      stopActiveTour()
    },
    onCloseClick: (element, step, { driver }) => {
      driver.destroy()
      stopActiveTour()
    }
  })

  driverObj.highlight({
    element: selector,
    popover: {
      title,
      description,
      side: 'bottom',
      align: 'center'
    }
  })

  activeDriverInstance = driverObj
  return driverObj
}
