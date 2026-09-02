import { loadAiKeys } from './ai'
import { loadKeys } from './scraper'

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
  const scrapeKeys = loadKeys()
  // 5-minute timeout for heavy endpoints (discover-creators with 50 creators, Apify)
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 300000)
  const opts = {
    method,
    signal: controller.signal,
    headers: {
      'Content-Type': 'application/json',
      'X-Gemini-Key': aiKeys?.geminiKey || '',
      'X-OpenAI-Key': aiKeys?.openaiKey || '',
      'X-Anthropic-Key': aiKeys?.anthropicKey || '',
      'X-Together-Key': aiKeys?.togetherKey || '',
      'X-Apify-Token': scrapeKeys?.apifyToken || localStorage.getItem('forge_apify_token') || '',
    },
  }
  if (body) opts.body = JSON.stringify(body)
  try {
    const cleanPath = path.startsWith('/api/') ? path.slice(4) : path
    const res = await fetch(BASE + cleanPath, opts)
    clearTimeout(timeoutId)
    if (!res.ok) {
      const err = await res.text()
      throw new Error(`${res.status}: ${err.slice(0, 200)}`)
    }
    const data = await res.json()
    return proxyAvatars(data)
  } catch (e) {
    clearTimeout(timeoutId)
    if (e.name === 'AbortError') {
      throw new Error('Request timed out — the backend is still processing. Please try again with fewer creators.')
    }
    throw e
  }
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

export const updateCreatorDetails = (creatorId, data) =>
  req('PATCH', `/creators/${creatorId}`, data)

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

export const deleteAllCreators = () =>
  req('DELETE', '/creators/all')

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

export const sendDirectEmail = (toEmail, subject, body, creatorId = null) =>
  req('POST', '/outreach/send-direct', { to_email: toEmail, subject, body, creator_id: creatorId })

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

export const pollInboxReplies = () => req('POST', '/outreach/poll-inbox')

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
export const runAutonomousBatch = (id, limit, payload = {}) => {
  const q = limit ? `?limit=${limit}` : ''
  return req('POST', `/autonomous/campaigns/${id}/run${q}`, payload)
}
export const runAutonomousFollowups = (id) => req('POST', `/autonomous/run-followups${id ? '?campaign_id=' + id : ''}`)
export const previewAutonomousTemplate = (data) => req('POST', '/autonomous/preview', data)
export const discoverAutonomousCreators = (data) => req('POST', '/autonomous/discover-creators', data || {})
export const getFollowupSchedulerStatus = () => req('GET', '/autonomous/followup-scheduler/status')


// ── Apify Business Email Scraper ──────────────────────────────────────────────
export const findEmailWithApify = (params) => req('POST', '/creators/apify/find-email', params)

// ── Co-Launch Projects & 5-Step Validation Workflow ─────────────────────────
export const getCoLaunchProjects = () => req('GET', '/projects')
export const getCoLaunchProject = (id) => req('GET', `/projects/${id}`)
export const createCoLaunchProject = (data) => req('POST', '/projects', data)
export const updateCoLaunchProject = (id, data) => req('PATCH', `/projects/${id}`, data)
export const updateValidationPlan = (id, plan) => req('PUT', `/projects/${id}/plan`, plan)
export const updateValidationCampaign = (id, campaign) => req('PUT', `/projects/${id}/campaign`, campaign)
export const getCreatorCampaignTasks = (id) => req('GET', `/projects/${id}/creator-tasks`)
export const updateCreatorCampaignTask = (id, taskId, updates) => req('PATCH', `/projects/${id}/creator-tasks/${taskId}`, updates)
export const addProjectReservation = (id, reservation) => req('POST', `/projects/${id}/reservations`, reservation)
export const recordPreorderUniversal = (data) => req('POST', '/projects/record-preorder', data)
export const recordVisitUniversal = (data) => req('POST', '/projects/record-visit', data)
export const logProjectActivity = (id, activity) => req('POST', `/projects/${id}/log-activity`, activity)
export const getProjectBySlug = (slug) => req('GET', `/projects/by-slug/${slug}`)
export const recordGateDecision = (id, decisionData) => req('POST', `/projects/${id}/gate-decision`, decisionData)
export const deleteCoLaunchProject = (id) => req('DELETE', `/projects/${id}`)
export const deleteAllProjects = () => req('DELETE', '/projects')

export const generateDecisionEmail = (params) =>
  req('POST', '/autonomous/generate-decision-email', params)

export const generateAudienceAndConcepts = (params) =>
  req('POST', '/autonomous/generate-audience-and-concepts', params)

export const generateStep6Response = (params) =>
  req('POST', '/autonomous/generate-step6-response', params)

// ── Global Cross-Device Workflow State Sync ─────────────────────────────────
export const getWorkflowState = () => req('GET', '/workflow-state')
export const updateWorkflowState = (data) => req('POST', '/workflow-state', data)

export const uploadMediaToCloudinary = (data) => req('POST', '/upload', data)

export const uploadFormFileToCloudinary = async (file, folder = 'creator_forge', projectId = null) => {
  const formData = new FormData()
  formData.append('file', file)
  if (folder) formData.append('folder', folder)
  if (projectId) formData.append('project_id', projectId)

  const res = await fetch('/api/upload/form', {
    method: 'POST',
    body: formData
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(err || 'Upload failed')
  }
  return res.json()
}

export const deleteMediaFromCloudinary = async ({ publicId, url, resourceType = 'image', projectId = null, fileId = null }) => {
  try {
    const res = await fetch('/api/upload/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        publicId,
        url,
        resourceType,
        projectId,
        fileId
      })
    })
    if (!res.ok) {
      const err = await res.text()
      throw new Error(err || 'Delete failed')
    }
    return res.json()
  } catch (e) {
    console.warn('[opsApi] deleteMediaFromCloudinary error:', e)
    return { success: false, error: e.message }
  }
}


export const getFrontendUrl = () => {
  const envUrl = import.meta.env?.VITE_FRONTEND_URL
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    return envUrl.trim().replace(/\/$/, '')
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/$/, '')
  }
  return 'https://creator-forge-frontend.vercel.app'
}
