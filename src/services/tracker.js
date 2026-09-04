/**
 * Google Analytics-style Unique Visitor Tracking Service
 * Tracks unique devices (Desktop, Mobile, Tablet) using persistent client IDs + hardware fingerprints.
 * Same device visits = 1 unique visitor (increments pageviews only).
 * Different devices (Phone vs Tablet vs PC) = separate unique visitors.
 */

// Simple string hash helper
function simpleHash(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash |= 0
  }
  return Math.abs(hash).toString(36)
}

/**
 * Detect Device Category
 */
export function getDeviceType() {
  if (typeof window === 'undefined') return 'desktop'
  const ua = navigator.userAgent || ''
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet'
  }
  if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(ua)) {
    return 'mobile'
  }
  return 'desktop'
}

/**
 * Generate a deterministic device fingerprint
 */
export function getDeviceFingerprint() {
  if (typeof window === 'undefined') return 'server-node'
  try {
    const screenInfo = `${window.screen?.width}x${window.screen?.height}x${window.screen?.colorDepth}`
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
    const lang = navigator.language || 'en'
    const platform = navigator.platform || 'web'
    const cores = navigator.hardwareConcurrency || 4
    const ua = navigator.userAgent || ''

    const raw = `${screenInfo}|${timeZone}|${lang}|${platform}|${cores}|${ua}`
    return `fp_${simpleHash(raw)}`
  } catch (e) {
    return `fp_gen_${Date.now().toString(36)}`
  }
}

/**
 * Get or create persistent Client ID (like GA _ga cookie)
 */
export function getOrCreateClientId() {
  if (typeof window === 'undefined') return 'node_client'
  const STORAGE_KEY = 'forge_unique_client_id'
  let clientId = localStorage.getItem(STORAGE_KEY)

  if (!clientId) {
    const fp = getDeviceFingerprint()
    const device = getDeviceType()
    clientId = `cid_${device}_${fp.slice(3)}_${Date.now().toString(36)}`
    try {
      localStorage.setItem(STORAGE_KEY, clientId)
      // Also store in cookie as backup
      document.cookie = `_forge_cid=${clientId};path=/;max-age=31536000;SameSite=Lax`
    } catch (e) {}
  }
  return clientId
}

/**
 * Track a page/dashboard visit
 * Returns { isNewVisitor: boolean, totalUniqueVisitors: number, visitorsList: Array, deviceBreakdown: Object }
 */
export function trackVisit(pagePath = '/dashboard', onProjectUpdate = null) {
  if (typeof window === 'undefined') return null

  // 1. Exclude internal admin workspaces and dashboards from customer traffic
  if (!pagePath || pagePath.includes('/dashboard') || pagePath.includes('/admin')) {
    return null
  }

  try {
    const activeProject = JSON.parse(localStorage.getItem('forge_launch_active_project') || '{}')
    const clientId = getOrCreateClientId()
    const fingerprint = getDeviceFingerprint()
    const deviceType = getDeviceType()

    // 2. Session refresh guard: page refresh in same tab/session is NOT a new visitor
    const sessionSeenKey = `forge_session_visited_${activeProject.id || 'proj'}_${pagePath}`
    const isRefreshInSession = Boolean(sessionStorage.getItem(sessionSeenKey))
    try {
      sessionStorage.setItem(sessionSeenKey, 'true')
    } catch (e) {}

    const rawVisitors = Array.isArray(activeProject.uniqueVisitors) ? activeProject.uniqueVisitors : []
    const existingIndex = rawVisitors.findIndex(v => v.id === clientId || v.fingerprint === fingerprint)

    const now = Date.now()
    let isNew = false
    let updatedVisitors = [...rawVisitors]

    // Detect traffic source & channel attribution from URL query or document.referrer
    let rawRef = 'direct'
    let channel = 'Direct / Other'
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const refQuery = urlParams.get('ref') || urlParams.get('utm_source') || urlParams.get('utm') || urlParams.get('source') || urlParams.get('channel')
      if (refQuery) {
        rawRef = refQuery.toLowerCase()
        if (rawRef.includes('instagram') || rawRef.includes('ig') || rawRef.includes('story') || rawRef.includes('insta')) {
          channel = 'Instagram Stories'
        } else if (rawRef.includes('tiktok') || rawRef.includes('reels') || rawRef.includes('shorts') || rawRef.includes('youtube') || rawRef.includes('yt')) {
          channel = 'TikTok / Shorts'
        } else if (rawRef.includes('twitter') || rawRef.includes('x_post') || rawRef.includes('tweet') || rawRef.includes('x')) {
          channel = 'Twitter / X'
        } else if (rawRef.includes('newsletter') || rawRef.includes('email') || rawRef.includes('broadcast') || rawRef.includes('mail')) {
          channel = 'Email Newsletter'
        } else if (rawRef.includes('dm') || rawRef.includes('outreach')) {
          channel = 'Direct Messages'
        }
      } else if (document.referrer) {
        try {
          const refUrl = new URL(document.referrer)
          rawRef = refUrl.hostname
          if (rawRef.includes('instagram')) channel = 'Instagram Stories'
          else if (rawRef.includes('tiktok')) channel = 'TikTok / Shorts'
          else if (rawRef.includes('twitter') || rawRef.includes('t.co') || rawRef.includes('x.com')) channel = 'Twitter / X'
        } catch (e) {}
      }
    }

    if (existingIndex >= 0) {
      // Returning visitor on same device -> update pageviews, lastSeen, and specific campaign channel
      const prevChannel = updatedVisitors[existingIndex].channel
      const effectiveChannel = (channel !== 'Direct / Other') ? channel : (prevChannel || channel)
      updatedVisitors[existingIndex] = {
        ...updatedVisitors[existingIndex],
        lastSeen: now,
        pageviews: (updatedVisitors[existingIndex].pageviews || 1) + 1,
        path: pagePath,
        channel: effectiveChannel,
        referrer: rawRef
      }
    } else if (!isRefreshInSession) {
      // Brand new unique device visitor
      isNew = true
      const newVisitor = {
        id: clientId,
        fingerprint: fingerprint,
        deviceType: deviceType,
        firstSeen: now,
        lastSeen: now,
        pageviews: 1,
        path: pagePath,
        channel: channel,
        referrer: rawRef
      }
      updatedVisitors.push(newVisitor)
    }

    const uniqueCount = Math.max(1, updatedVisitors.length)
    const reservationsCount = Array.isArray(activeProject.reservations) ? activeProject.reservations.length : 0
    const conversionRate = uniqueCount > 0 ? ((reservationsCount / uniqueCount) * 100).toFixed(1) : 0

    // Compute device breakdown
    const breakdown = updatedVisitors.reduce(
      (acc, v) => {
        const type = v.deviceType || 'desktop'
        acc[type] = (acc[type] || 0) + 1
        return acc
      },
      { desktop: 0, mobile: 0, tablet: 0 }
    )

    // Compute live channel attribution breakdown
    const channelAttribution = updatedVisitors.reduce((acc, v) => {
      const ch = v.channel || 'Direct / Other'
      acc[ch] = (acc[ch] || 0) + 1
      return acc
    }, {})

    const updatedProject = {
      ...activeProject,
      visitors: uniqueCount,
      uniqueVisitors: updatedVisitors,
      conversionRate: Number(conversionRate),
      deviceBreakdown: breakdown,
      channelAttribution: channelAttribution,
      lastVisitorTimestamp: now
    }

    try {
      localStorage.setItem('forge_launch_active_project', JSON.stringify(updatedProject))
      window.dispatchEvent(new CustomEvent('forge_project_updated', { detail: updatedProject }))
    } catch (e) {}

    // Persist visit to backend database with client deduplication tokens
    import('./opsApi').then(({ recordVisitUniversal }) => {
      recordVisitUniversal({
        projectId: activeProject.id,
        slug: activeProject.productName ? activeProject.productName.toLowerCase().replace(/ /g, '-') : undefined,
        channel: channel,
        ref: rawRef,
        path: pagePath,
        clientId: clientId,
        fingerprint: fingerprint,
        isNewVisitor: isNew
      }).then(serverRes => {
        if (serverRes && onProjectUpdate) {
          onProjectUpdate(prev => ({
            ...(prev || {}),
            visitors: serverRes.visitors ?? prev?.visitors,
            conversionRate: serverRes.conversionRate ?? prev?.conversionRate
          }))
        }
      }).catch(err => console.warn('[Tracker] DB visit sync warning:', err))
    }).catch(() => {})

    if (onProjectUpdate) {
      onProjectUpdate(updatedProject)
    }

    return {
      isNewVisitor: isNew,
      totalUniqueVisitors: uniqueCount,
      visitorsList: updatedVisitors,
      deviceBreakdown: breakdown,
      clientId
    }
  } catch (err) {
    console.warn('[Tracker] Failed tracking visit:', err)
    return null
  }
}

/**
 * Simulate an additional unique visitor from a specific device for testing
 */
export function simulateUniqueDeviceVisit(deviceType = 'mobile', onProjectUpdate = null) {
  try {
    const activeProject = JSON.parse(localStorage.getItem('forge_launch_active_project') || '{}')
    const rawVisitors = activeProject.uniqueVisitors || []
    
    const fakeId = `cid_${deviceType}_${Math.random().toString(36).slice(2, 9)}_${Date.now().toString(36)}`
    const fakeFp = `fp_${deviceType}_${Math.random().toString(36).slice(2, 8)}`

    const newVisitor = {
      id: fakeId,
      fingerprint: fakeFp,
      deviceType: deviceType,
      firstSeen: Date.now(),
      lastSeen: Date.now(),
      pageviews: Math.floor(Math.random() * 3) + 1,
      path: '/preorder',
      referrer: 'social_link'
    }

    const updatedVisitors = [...rawVisitors, newVisitor]
    const uniqueCount = updatedVisitors.length
    const reservationsCount = Array.isArray(activeProject.reservations) ? activeProject.reservations.length : 0
    const conversionRate = uniqueCount > 0 ? ((reservationsCount / uniqueCount) * 100).toFixed(1) : 0

    const breakdown = updatedVisitors.reduce(
      (acc, v) => {
        const type = v.deviceType || 'desktop'
        acc[type] = (acc[type] || 0) + 1
        return acc
      },
      { desktop: 0, mobile: 0, tablet: 0 }
    )

    const updatedProject = {
      ...activeProject,
      visitors: uniqueCount,
      uniqueVisitors: updatedVisitors,
      conversionRate: Number(conversionRate),
      deviceBreakdown: breakdown,
      lastVisitorTimestamp: Date.now()
    }

    localStorage.setItem('forge_launch_active_project', JSON.stringify(updatedProject))
    if (onProjectUpdate) onProjectUpdate(updatedProject)

    return updatedProject
  } catch (e) {
    console.error('Simulate visitor error', e)
  }
}
