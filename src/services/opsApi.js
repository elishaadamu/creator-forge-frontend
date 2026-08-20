import { loadAiKeys } from './ai'

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
  const aiKeys = loadAiKeys()
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Gemini-Key': aiKeys?.geminiKey || '',
      'X-OpenAI-Key': aiKeys?.openaiKey || '',
      'X-Anthropic-Key': aiKeys?.anthropicKey || '',
      'X-Together-Key': aiKeys?.togetherKey || '',
    },
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

function getActiveUsername() {
  try {
    const cached = localStorage.getItem('forge_user_profile')
    if (cached) {
      const parsed = JSON.parse(cached)
      return parsed.username || 'internal'
    }
  } catch (e) {
    console.warn('[opsApi] Failed to parse forge_user_profile:', e)
  }
  return 'internal'
}

export const getCreators = (params = {}) => {
  const q = new URLSearchParams(params).toString()
  return req('GET', `/creators${q ? '?' + q : ''}`)
}

export const saveCreator = (data) => 
  req('POST', '/creators', data)

export const recommendCreator = (id) => {
  const actor = getActiveUsername()
  return req('POST', `/creators/${id}/recommend?actor=${encodeURIComponent(actor)}`)
}

export const scrapeCreator = (platform, handle) =>
  req('POST', '/creators/scrape', { platform, handle })

export const analyzeCreator = (id) => {
  const actor = getActiveUsername()
  return req('POST', `/creators/${id}/analyze?actor=${encodeURIComponent(actor)}`)
}

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

export const addCreatorContact = (creatorId, contactType, value) =>
  req('POST', `/creators/${creatorId}/contacts`, { contact_type: contactType, value, source: 'manual' })

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

export const submitOutreachDraft = (id) =>
  req('POST', `/outreach/drafts/${id}/submit`)

export const deleteOutreachMessage = (id) =>
  req('DELETE', `/outreach/messages/${id}`)

// ── Reply Inbox ──────────────────────────────────────────────────────────────

export const getThreads = (params = {}) => {
  const q = new URLSearchParams(params).toString()
  return req('GET', `/outreach/threads${q ? '?' + q : ''}`)
}

export const getThread = (id) =>
  req('GET', `/outreach/threads/${id}`)

export const sendThreadReply = (threadId, body, toEmail = null) =>
  req('POST', `/outreach/threads/${threadId}/reply`, { body, to_email: toEmail })

export const deleteThread = (id) =>
  req('DELETE', `/outreach/threads/${id}`)

export const deleteReply = (id) =>
  req('DELETE', `/outreach/replies/${id}`)

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

// ── Autonomous Outreach Campaigns ───────────────────────────────────────────

export const getAutonomousCampaigns = () => req('GET', '/autonomous/campaigns')
export const createAutonomousCampaign = (data) => req('POST', '/autonomous/campaigns', data)
export const getAutonomousCampaign = (id) => req('GET', `/autonomous/campaigns/${id}`)
export const updateAutonomousCampaign = (id, data) => req('PUT', `/autonomous/campaigns/${id}`, data)
export const deleteAutonomousCampaign = (id) => req('DELETE', `/autonomous/campaigns/${id}`)
export const runAutonomousBatch = (id, limit) => req('POST', `/autonomous/campaigns/${id}/run${limit ? '?limit=' + limit : ''}`)
export const runAutonomousFollowups = (id) => req('POST', `/autonomous/run-followups${id ? '?campaign_id=' + id : ''}`)
export const previewAutonomousTemplate = (data) => req('POST', '/autonomous/preview', data)
export const discoverAutonomousCreators = (data) => req('POST', '/autonomous/discover-creators', data || {})

