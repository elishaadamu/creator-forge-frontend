/**
 * Ops API client — talks to the FastAPI backend
 * Base URL: /api (proxied via Vite dev server, Vercel rewrites in prod)
 */

const BASE = '/api'

function proxyAvatars(obj) {
  if (!obj || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) {
    return obj.map(proxyAvatars)
  }
  const res = {}
  for (const [key, val] of Object.entries(obj)) {
    if ((key === 'avatar_url' || key === 'avatarUrl') && typeof val === 'string' && val.startsWith('http') && !val.includes('/api/proxy/avatar')) {
      res[key] = `/api/proxy/avatar?url=${encodeURIComponent(val)}`
    } else if (typeof val === 'object' && val !== null) {
      res[key] = proxyAvatars(val)
    } else {
      res[key] = val
    }
  }
  return res
}

async function req(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  }
  if (body) opts.body = JSON.stringify(body)
  const res = await fetch(BASE + path, opts)
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`${res.status}: ${err.slice(0, 200)}`)
  }
  const data = await res.json()
  return proxyAvatars(data)
}

// ── Creators / Leads ─────────────────────────────────────────────────────────

export const getCreators = (params = {}) => {
  const q = new URLSearchParams(params).toString()
  return req('GET', `/creators${q ? '?' + q : ''}`)
}

export const saveCreator = (data) => 
  req('POST', '/creators', data)

export const recommendCreator = (id) =>
  req('POST', `/creators/${id}/recommend`)

export const scrapeCreator = (platform, handle) =>
  req('POST', '/creators/scrape', { platform, handle })

export const analyzeCreator = (id) =>
  req('POST', `/creators/${id}/analyze`)

export const getCreatorAnalysis = (id) =>
  req('GET', `/creators/${id}/analysis`)

export const qualifyCreator = (id, status) =>
  req('POST', `/creators/${id}/qualify`, { status })

export const suppressCreator = (id, reason = 'do_not_contact') =>
  req('POST', `/creators/${id}/suppress`, { reason })

export const deleteCreator = (id) =>
  req('DELETE', `/creators/${id}`)

export const getCreator = (id) =>
  req('GET', `/creators/${id}`)

// ── Outreach / Queue ─────────────────────────────────────────────────────────

export const getOutreachMessages = (params = {}) => {
  const q = new URLSearchParams(params).toString()
  return req('GET', `/outreach${q ? '?' + q : ''}`)
}

export const generateOutreach = (creatorId, campaignId, opts = {}) =>
  req('POST', '/outreach/drafts', { creator_id: creatorId, campaign_id: campaignId, ...opts })

export const approveOutreach = (id) =>
  req('POST', `/outreach/${id}/approve`)

export const rejectOutreach = (id, notes = '') =>
  req('POST', `/outreach/${id}/reject`, { notes })

export const sendOutreach = (id) =>
  req('POST', `/outreach/${id}/send`)

export const updateOutreachDraft = (id, subject, body) =>
  req('PATCH', `/outreach/${id}`, { subject, body })

// ── Reply Inbox ──────────────────────────────────────────────────────────────

export const getThreads = (params = {}) => {
  const q = new URLSearchParams(params).toString()
  return req('GET', `/outreach/threads${q ? '?' + q : ''}`)
}

export const getThread = (id) =>
  req('GET', `/outreach/threads/${id}`)

// ── Campaigns ────────────────────────────────────────────────────────────────

export const getCampaigns = () => req('GET', '/campaigns')
export const createCampaign = (data) => req('POST', '/campaigns', data)

// ── Agent (batch runner) ─────────────────────────────────────────────────────

export const runDiscovery = (handles, platform = 'youtube') =>
  req('POST', '/agent/run-discovery', { handles, platform })

export const runOutreachBatch = (campaignId) =>
  req('POST', '/agent/run-outreach', { campaign_id: campaignId })

export const runFollowupBatch = () =>
  req('POST', '/agent/run-followups')

export const getAgentStatus = () =>
  req('GET', '/agent/status')

// ── Analytics ────────────────────────────────────────────────────────────────

export const getAnalytics = () => req('GET', '/analytics/summary')
