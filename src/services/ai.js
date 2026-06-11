/**
 * Creator Forge — AI Generation Service
 *
 * Text:  Google Gemini 2.5 Flash  via /api/gemini proxy   (Gemini key: AIzaSy...)
 * Image: Together.ai FLUX Free    via /api/together proxy  (Together key: free at together.ai)
 *
 * Keys stored in localStorage — never sent to Forge servers.
 */

// ── Key management ─────────────────────────────────────────────────────────────

let inMemoryAiKeys = {
  geminiKey: '',
  togetherKey: '',
  nvidiaKey: '',
  openaiKey: '',
  anthropicKey: '',
}

// Whether user has consented to save AI keys to DB
let aiKeysConsentGiven = false

try {
  inMemoryAiKeys.geminiKey = localStorage.getItem('forge_gemini_api_key') || ''
  inMemoryAiKeys.togetherKey = localStorage.getItem('forge_together_api_key') || ''
  inMemoryAiKeys.nvidiaKey = localStorage.getItem('forge_nvidia_api_key') || ''
  inMemoryAiKeys.openaiKey = localStorage.getItem('forge_openai_api_key') || import.meta.env.VITE_OPENAI_API_KEY || ''
  inMemoryAiKeys.anthropicKey = localStorage.getItem('forge_anthropic_api_key') || ''
  
  if (!localStorage.getItem('forge_openai_api_key') && inMemoryAiKeys.openaiKey) {
    localStorage.setItem('forge_openai_api_key', inMemoryAiKeys.openaiKey)
  }
  
  aiKeysConsentGiven = localStorage.getItem('forge_ai_keys_consent') === 'true'
} catch (e) {
  console.warn('[Forge] Failed to load AI keys from localStorage:', e)
}

export function loadAiKeys() {
  return inMemoryAiKeys
}

export function saveAiKeys({ geminiKey, togetherKey, nvidiaKey, openaiKey, anthropicKey }) {
  if (geminiKey   !== undefined) {
    inMemoryAiKeys.geminiKey = (geminiKey || '').trim()
    try {
      localStorage.setItem('forge_gemini_api_key', inMemoryAiKeys.geminiKey)
    } catch (e) {}
  }
  if (togetherKey !== undefined) {
    inMemoryAiKeys.togetherKey = (togetherKey || '').trim()
    try {
      localStorage.setItem('forge_together_api_key', inMemoryAiKeys.togetherKey)
    } catch (e) {}
  }
  if (nvidiaKey   !== undefined) {
    inMemoryAiKeys.nvidiaKey = (nvidiaKey || '').trim()
    try {
      localStorage.setItem('forge_nvidia_api_key', inMemoryAiKeys.nvidiaKey)
    } catch (e) {}
  }
  if (openaiKey   !== undefined) {
    inMemoryAiKeys.openaiKey = (openaiKey || '').trim()
    try {
      localStorage.setItem('forge_openai_api_key', inMemoryAiKeys.openaiKey)
    } catch (e) {}
  }
  if (anthropicKey !== undefined) {
    inMemoryAiKeys.anthropicKey = (anthropicKey || '').trim()
    try {
      localStorage.setItem('forge_anthropic_api_key', inMemoryAiKeys.anthropicKey)
    } catch (e) {}
  }
}

export function clearInMemoryAiKeys() {
  inMemoryAiKeys = {
    geminiKey: '',
    togetherKey: '',
    nvidiaKey: '',
    openaiKey: '',
    anthropicKey: '',
  }
  aiKeysConsentGiven = false
  try {
    localStorage.removeItem('forge_gemini_api_key')
    localStorage.removeItem('forge_together_api_key')
    localStorage.removeItem('forge_nvidia_api_key')
    localStorage.removeItem('forge_openai_api_key')
    localStorage.removeItem('forge_anthropic_api_key')
    localStorage.removeItem('forge_ai_keys_consent')
  } catch (e) {}
}

export function hasGeminiKey() {
  const { geminiKey } = loadAiKeys()
  return !!geminiKey
}

export function hasTogetherKey() {
  const { togetherKey } = loadAiKeys()
  return !!togetherKey
}

export function hasNvidiaKey() {
  const { nvidiaKey } = loadAiKeys()
  return !!nvidiaKey
}

export function hasOpenaiKey() {
  const { openaiKey } = loadAiKeys()
  return !!openaiKey
}

export function hasAnthropicKey() {
  const { anthropicKey } = loadAiKeys()
  return !!anthropicKey
}

export function hasTextKey() {
  const { geminiKey, nvidiaKey, openaiKey, anthropicKey } = loadAiKeys()
  return !!(geminiKey || nvidiaKey || openaiKey || anthropicKey)
}

// ── DB-persisted AI keys (user-consented) ──────────────────────────────────────

export function getAiKeysConsent() {
  return aiKeysConsentGiven
}

export function setAiKeysConsent(value) {
  aiKeysConsentGiven = !!value
  try {
    localStorage.setItem('forge_ai_keys_consent', String(aiKeysConsentGiven))
  } catch (e) {}
}

export async function saveAiKeysToDb(username) {
  if (!username) return
  const keys = loadAiKeys()
  try {
    const res = await fetch('/api/auth/save-ai-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        ai_keys: {
          geminiKey: keys.geminiKey,
          togetherKey: keys.togetherKey,
          nvidiaKey: keys.nvidiaKey,
          openaiKey: keys.openaiKey,
          anthropicKey: keys.anthropicKey,
        }
      })
    })
    const data = await res.json()
    console.log('[Forge] saveAiKeysToDb response:', data)
    if (!res.ok) throw new Error('Failed to save AI keys')
    return true
  } catch (err) {
    console.error('[Forge] Failed to save AI keys to DB:', err)
    return false
  }
}

export async function deleteAiKeysFromDb(username) {
  if (!username) return
  try {
    const res = await fetch('/api/auth/delete-ai-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    })
    const data = await res.json()
    console.log('[Forge] deleteAiKeysFromDb response:', data)
    aiKeysConsentGiven = false
  } catch (err) {
    console.error('[Forge] Failed to delete AI keys from DB:', err)
  }
}

export function restoreAiKeysFromLoginData(aiKeysData) {
  if (aiKeysData && typeof aiKeysData === 'object') {
    inMemoryAiKeys.geminiKey   = aiKeysData.geminiKey   || ''
    inMemoryAiKeys.togetherKey = aiKeysData.togetherKey || ''
    inMemoryAiKeys.nvidiaKey   = aiKeysData.nvidiaKey   || ''
    inMemoryAiKeys.openaiKey   = aiKeysData.openaiKey   || ''
    inMemoryAiKeys.anthropicKey = aiKeysData.anthropicKey || ''
    aiKeysConsentGiven = true
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmt(n) {
  n = parseInt(n) || 0
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${Math.round(n / 1_000)}K`
  return String(n)
}

// ── Gemini call ────────────────────────────────────────────────────────────────

// ── Gemini call ────────────────────────────────────────────────────────────────

async function geminiCall(prompt, systemPrompt, maxTokens = 8192, signal = undefined, jsonMode = true) {
  const { geminiKey } = loadAiKeys()
  if (!geminiKey) throw new Error('NO_GEMINI_KEY')

  const url = `/api/gemini/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`

  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: {
      maxOutputTokens: maxTokens,
      temperature: 0.85,
    },
  }

  if (jsonMode) {
    body.generationConfig.responseMimeType = 'application/json'
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gemini ${res.status}: ${err.slice(0, 300)}`)
  }

  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
  if (!text) throw new Error('Gemini returned empty response')

  if (jsonMode) {
    const cleaned = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()
    try {
      return JSON.parse(cleaned)
    } catch (err) {
      console.error('[Forge] Gemini JSON parse failed. Raw response:', text)
      throw err
    }
  }

  return text
}

// ── Anthropic Call ─────────────────────────────────────────────────────────────

async function anthropicCall(prompt, systemPrompt, maxTokens = 4096, signal = undefined, jsonMode = true) {
  const { anthropicKey } = loadAiKeys()
  if (!anthropicKey) throw new Error('NO_ANTHROPIC_KEY')

  const url = '/api/anthropic/v1/messages'

  const body = {
    model: 'claude-opus-4-6',
    max_tokens: maxTokens,
    messages: [
      { role: 'user', content: prompt }
    ]
  }

  if (systemPrompt) {
    body.system = systemPrompt
  }

  if (jsonMode) {
    body.output_config = {
      format: {
        type: 'json_schema',
        name: 'GenericResponse',
        schema: {
          type: 'object',
          additionalProperties: true
        }
      }
    }
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': anthropicKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(body),
    signal,
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Anthropic ${res.status}: ${err.slice(0, 300)}`)
  }

  const data = await res.json()
  const text = data?.content?.[0]?.text || ''
  if (!text) throw new Error('Anthropic returned empty response')

  if (jsonMode) {
    const cleaned = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()
    try {
      return JSON.parse(cleaned)
    } catch (err) {
      console.error('[Forge] Anthropic JSON parse failed. Raw response:', text)
      throw err
    }
  }

  return text
}

// ── OpenAI Call ───────────────────────────────────────────────────────────────

async function openaiCall(prompt, systemPrompt, maxTokens = 4096, signal = undefined, jsonMode = true) {
  const { openaiKey } = loadAiKeys()
  if (!openaiKey) throw new Error('NO_OPENAI_KEY')

  const url = '/api/openai/v1/responses'

  const body = {
    model: 'gpt-5.5',
    reasoning: { effort: 'low' },
    input: prompt,
    max_completion_tokens: maxTokens,
  }

  if (systemPrompt) {
    body.instructions = systemPrompt
  }

  if (jsonMode) {
    body['text.format'] = { type: 'json_object' }
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiKey}`
    },
    body: JSON.stringify(body),
    signal,
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`OpenAI Responses ${res.status}: ${err.slice(0, 300)}`)
  }

  const data = await res.json()

  let text = ''
  if (data && typeof data.output_text === 'string') {
    text = data.output_text
  } else if (data && Array.isArray(data.output)) {
    for (const item of data.output) {
      if (item && item.type === 'message' && Array.isArray(item.content)) {
        for (const c of item.content) {
          if (c && c.type === 'output_text' && typeof c.text === 'string') {
            text += c.text
          } else if (c && typeof c.text === 'string') {
            text += c.text
          }
        }
      }
    }
  }

  // Fallback to chat completions response format in case of proxy mapping
  if (!text && data?.choices?.[0]?.message?.content) {
    text = data.choices[0].message.content
  }

  if (!text) throw new Error('OpenAI returned empty response')

  if (jsonMode) {
    const cleaned = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()
    try {
      return JSON.parse(cleaned)
    } catch (err) {
      console.error('[Forge] OpenAI JSON parse failed. Raw response:', text)
      throw err
    }
  }

  return text
}

// ── AI Text Call Dispatcher (Anthropic -> Nemotron -> OpenAI -> Gemini) ─────────

async function aiTextCall(prompt, systemPrompt, maxTokens = 8192, signal = undefined, jsonMode = true) {
  const { geminiKey, nvidiaKey, openaiKey, anthropicKey } = loadAiKeys()

  // 1. Anthropic Claude
  if (anthropicKey) {
    try {
      return await anthropicCall(prompt, systemPrompt, maxTokens, signal, jsonMode)
    } catch (err) {
      if (err.name === 'AbortError') throw err
      console.warn("[Forge] Anthropic Claude call failed, trying fallback:", err)
    }
  }

  // 2. Nvidia Nemotron
  if (nvidiaKey) {
    try {
      const data = await nvidiaCall(prompt, systemPrompt, signal)
      let content = data
      if (data && data.content !== undefined) {
        content = data.content
      }
      if (typeof content === 'string') {
        if (jsonMode) {
          const cleaned = content.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()
          return JSON.parse(cleaned)
        }
        return content
      }
      if (typeof content === 'object' && content !== null) {
        return content
      }
      throw new Error("Invalid format from Nvidia Call")
    } catch (err) {
      if (err.name === 'AbortError') throw err
      console.warn("[Forge] Nvidia Nemotron call failed, trying fallback:", err)
    }
  }

  // 3. OpenAI Responses
  if (openaiKey) {
    try {
      return await openaiCall(prompt, systemPrompt, maxTokens, signal, jsonMode)
    } catch (err) {
      if (err.name === 'AbortError') throw err
      console.warn("[Forge] OpenAI Responses call failed, trying fallback:", err)
    }
  }

  // 4. Gemini 2.5 Flash
  if (geminiKey) {
    try {
      return await geminiCall(prompt, systemPrompt, maxTokens, signal, jsonMode)
    } catch (err) {
      if (err.name === 'AbortError') throw err
      console.error("[Forge] Gemini call failed:", err)
      throw err
    }
  }

  throw new Error("NO_ACTIVE_AI_KEY")
}

// ── Nvidia Nemotron call ───────────────────────────────────────────────────────

async function nvidiaCall(prompt, systemPrompt, signal = undefined) {
  const { nvidiaKey } = loadAiKeys()
  const headers = { 'Content-Type': 'application/json' }
  if (nvidiaKey) {
    headers['X-Nvidia-Api-Key'] = nvidiaKey
  }

  const res = await fetch('/api/studio/generate', {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({ system_prompt: systemPrompt, prompt: prompt }),
    signal,
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Nvidia Nemotron generation failed: ${res.status} ${errText}`)
  }

  return await res.json()
}

// ── Generate full marketing pack ───────────────────────────────────────────────

export async function generateMarketingPack(creatorData, signal = undefined) {
  const name        = creatorData.name        || creatorData.handle?.replace('@','') || 'this creator'
  const handle      = creatorData.handle      || '@creator'
  const platform    = creatorData.platform    || 'social media'
  const followers   = creatorData.followers   ? fmt(creatorData.followers) : 'growing'
  const engRate     = creatorData.engagementRate ? `${creatorData.engagementRate}%` : 'solid'
  const niche       = creatorData.niche       || 'content creation'
  const productName = creatorData.productName || 'Creator Academy'
  const blueprint   = creatorData.blueprint
  const productDesc = blueprint?.description  || `a premium ${niche} platform`
  const bio         = creatorData.description ? `\nBio: "${creatorData.description.slice(0, 150)}"` : ''

  const system = `You are an elite creator economy marketing strategist. Write copy that sounds exactly like this creator — authentic, platform-native, never generic. Return ONLY valid JSON.`

  const prompt = `Generate a complete product launch marketing pack for:

Creator: ${name} (${handle})
Platform: ${platform} — ${followers} followers, ${engRate} engagement
Niche: ${niche}${bio}
Launching: "${productName}" — ${productDesc}

Return this exact JSON (be specific, personal, creator-native — not generic):

{
  "email": {
    "subject": "subject line under 60 chars — curiosity-driven",
    "preview": "preview text under 80 chars",
    "body": "full launch email 220-280 words — first person, conversational, ends with CTA and [PRODUCT_LINK]"
  },
  "instagram": {
    "caption": "150-200 char caption — hook first, story, CTA. Use line breaks.",
    "hashtags": ["6 relevant hashtags without #"]
  },
  "twitter": {
    "thread": ["tweet 1 hook <240 chars", "tweet 2 value <240 chars", "tweet 3 social proof <240 chars", "tweet 4 CTA with [PRODUCT_LINK] <240 chars"]
  },
  "tiktok": {
    "hook": "opening line — first 3 seconds, under 9 words",
    "script": "30-second TikTok script with [ACTION] cues"
  },
  "pitchDeck": {
    "headline": "product headline under 8 words",
    "tagline": "supporting tagline under 18 words",
    "slides": [
      { "title": "Problem", "bullets": ["3 specific pain points"] },
      { "title": "Solution", "bullets": ["3 ways ${productName} solves them"] },
      { "title": "What's Inside", "bullets": ["4 key features"] },
      { "title": "Who It's For", "bullets": ["3 audience descriptions"] },
      { "title": "The Offer", "bullets": ["founding price", "what they get", "urgency"] }
    ]
  }
}`

  return aiTextCall(prompt, system, 8192, signal, true)
}

// ── Regenerate one section ─────────────────────────────────────────────────────

export async function regenerateSection(section, creatorData) {
  const name        = creatorData.name        || creatorData.handle?.replace('@','') || 'this creator'
  const productName = creatorData.productName || 'Creator Academy'
  const niche       = creatorData.niche       || 'content creation'

  const prompts = {
    email:     `Write a completely different launch email for "${productName}" by ${name}. New angle, same authenticity. Return JSON: { "subject": "...", "preview": "...", "body": "..." }`,
    instagram: `Write a fresh Instagram launch caption for "${productName}" by ${name}. Different hook. Return JSON: { "caption": "...", "hashtags": ["..."] }`,
    twitter:   `Write a new 4-tweet launch thread for "${productName}" by ${name}. Fresh angle. Return JSON: { "thread": ["t1","t2","t3","t4"] }`,
    tiktok:    `Write a new 30-second TikTok script for "${productName}" by ${name}. New hook. Return JSON: { "hook": "...", "script": "..." }`,
    pitchDeck: `Create a fresh pitch deck for "${productName}" by ${name} in ${niche}. New framing. Return JSON: { "headline": "...", "tagline": "...", "slides": [{ "title": "...", "bullets": ["..."] }] }`,
  }

  return aiTextCall(prompts[section], 'You are a creator economy marketing expert. Return ONLY valid JSON.', 8192, undefined, true)
}

// ── Gemini image generation (uses existing Gemini key — no extra signup) ───────
// Model: gemini-2.0-flash-exp-image-generation
// Same key as text generation — free at aistudio.google.com/apikey

export async function generateProductImageWithGemini(creatorData, signal = undefined) {
  const { geminiKey } = loadAiKeys()
  if (!geminiKey) throw new Error('NO_GEMINI_KEY')

  const productName = creatorData.productName || 'Creator Academy'
  const niche       = creatorData.niche       || 'content creation'
  const type        = creatorData.blueprint?.type || 'Web App'

  const prompt = `Sleek dark ${type} app screenshot mockup for a ${niche} creator platform called "${productName}". Premium SaaS UI on deep dark background with subtle glow. Shows a clean dashboard with course cards and metrics. No real text, just UI shapes and blocks. Professional product photography style. Linear, Notion aesthetic. Ultra detailed.`

  const url = `/api/gemini/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${geminiKey}`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
    }),
    signal,
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gemini image ${res.status}: ${err.slice(0, 300)}`)
  }

  const data = await res.json()
  // Image comes back as inlineData base64
  const parts = data?.candidates?.[0]?.content?.parts || []
  const imgPart = parts.find(p => p.inlineData)
  if (!imgPart) throw new Error('Gemini returned no image')
  const { mimeType, data: b64 } = imgPart.inlineData
  return `data:${mimeType};base64,${b64}`
}

// ── Together.ai FLUX image generation ─────────────────────────────────────────
// Free model: black-forest-labs/FLUX.1-schnell-Free (no credits needed)
// Get key free at: together.ai

export async function generateProductImageWithTogether(creatorData, signal = undefined) {
  const { togetherKey } = loadAiKeys()
  if (!togetherKey) throw new Error('NO_TOGETHER_KEY')

  const productName = creatorData.productName || 'Creator Academy'
  const niche       = creatorData.niche       || 'content creation'
  const type        = creatorData.blueprint?.type || 'Web App'

  const prompt = `Sleek dark ${type} screenshot mockup for "${productName}" — ${niche} creator platform. Premium SaaS UI, floating on deep dark background with subtle glow. Shows dashboard or course page with cards and metrics. No text. Professional product photography. Ultra detailed. Linear, Notion aesthetic.`

  const res = await fetch('/api/together/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${togetherKey}`,
    },
    body: JSON.stringify({
      model: 'black-forest-labs/FLUX.1-schnell-Free',
      prompt,
      width: 1024,
      height: 576,
      steps: 4,
      n: 1,
      response_format: 'url',
    }),
    signal,
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Together.ai ${res.status}: ${err.slice(0, 300)}`)
  }

  const data = await res.json()
  if (data?.data?.[0]?.url) return data.data[0].url
  if (data?.data?.[0]?.b64_json) return `data:image/png;base64,${data.data[0].b64_json}`
  return null
}

// ── OpenAI GPT Image 2 generation ─────────────────────────────────────────────

export async function generateProductImageWithOpenAI(creatorData, signal = undefined) {
  const { openaiKey } = loadAiKeys()
  if (!openaiKey) throw new Error('NO_OPENAI_KEY')

  const productName = creatorData.productName || 'Creator Academy'
  const niche       = creatorData.niche       || 'content creation'
  const type        = creatorData.blueprint?.type || 'Web App'

  const prompt = `Sleek dark ${type} screenshot mockup for "${productName}" — ${niche} creator platform. Premium SaaS UI, floating on deep dark background with subtle glow. Shows dashboard or course page with cards and metrics. No text. Professional product photography. Ultra detailed. Linear, Notion aesthetic.`

  const res = await fetch('/api/openai/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-image-2',
      prompt,
      n: 1,
      size: '1024x1024',
      response_format: 'url',
    }),
    signal,
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`OpenAI gpt-image-2 ${res.status}: ${err.slice(0, 300)}`)
  }

  const data = await res.json()
  if (data?.data?.[0]?.url) return data.data[0].url
  if (data?.data?.[0]?.b64_json) return `data:image/png;base64,${data.data[0].b64_json}`
  return null
}

export async function generateProductImage(creatorData, signal = undefined) {
  const productName = creatorData.productName || 'Creator Academy'
  const niche       = creatorData.niche       || 'content creation'
  const type        = creatorData.blueprint?.type || 'Web App'

  const prompt = `Sleek dark ${type} app screenshot mockup for a ${niche} creator platform called "${productName}". Premium SaaS UI on deep dark background with subtle glow. Shows a clean dashboard with course cards and metrics. No real text, just UI shapes and blocks. Professional product photography style. Linear, Notion aesthetic. Ultra detailed.`

  const { nvidiaKey, openaiKey, togetherKey, geminiKey } = loadAiKeys()

  // 1. Nvidia
  if (nvidiaKey) {
    try {
      const headers = { 'Content-Type': 'application/json', 'X-Nvidia-Api-Key': nvidiaKey }
      const res = await fetch('/api/v1/infer', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ prompt, seed: 0 }),
        signal,
      })
      if (res.ok) {
        const data = await res.json()
        const b64 = data?.artifacts?.[0]?.base64
        if (b64) return `data:image/jpeg;base64,${b64}`
      }
    } catch (err) {
      if (err.name === 'AbortError') throw err
      console.warn("[Forge] NVIDIA NIM Image Generation failed, trying fallback:", err)
    }
  }

  // 2. OpenAI GPT Image 2
  if (openaiKey) {
    try {
      return await generateProductImageWithOpenAI(creatorData, signal)
    } catch (err) {
      if (err.name === 'AbortError') throw err
      console.warn("[Forge] OpenAI gpt-image-2 Generation failed, trying fallback:", err)
    }
  }

  // 3. Together.ai FLUX
  if (togetherKey) {
    try {
      return await generateProductImageWithTogether(creatorData, signal)
    } catch (err) {
      if (err.name === 'AbortError') throw err
      console.warn("[Forge] Together.ai Image Generation failed, trying fallback:", err)
    }
  }

  // 4. Gemini Image
  if (geminiKey) {
    try {
      return await generateProductImageWithGemini(creatorData, signal)
    } catch (err) {
      if (err.name === 'AbortError') throw err
      console.warn("[Forge] Gemini Image Generation failed:", err)
    }
  }

  throw new Error("NO_ACTIVE_IMAGE_KEY")
}

// ── askForgeChat ───────────────────────────────────────────────────────────────

export async function askForgeChat(message, history, creatorData) {
  const niche = creatorData.niche || 'content creation'
  const productName = creatorData.productName || 'Creator Academy'
  const name = creatorData.name || creatorData.handle?.replace('@','') || 'creator'
  const handle = creatorData.handle || '@creator'
  const followers = creatorData.followers ? fmt(creatorData.followers) : 'growing'
  const platform = creatorData.platform || 'social media'

  const systemPrompt = `You are "Forge", an elite, sharp, and highly strategic AI cofounder for creators. 
You are chatting with ${name} (${handle}), a ${niche} creator on ${platform} with ${followers} followers. 
Their main product is "${productName}".

Keep your responses direct, highly tactical, actionable, and conversational (never overly polite or verbose). 
Use formatting like bullet points or bold tags (**phrase**) to highlight critical insights. 
Ensure you sound like a trusted partner who knows the creator economy inside out.

Do NOT output JSON. Output raw text with markdown formatting (using **bold** for emphasis, but no headers like ###).`

  const formattedHistory = history.map(msg => `${msg.role === 'forge' || msg.role === 'coach' ? 'Coach' : 'User'}: ${msg.content || msg.text || ''}`).join('\n\n')
  const finalPrompt = `Conversation History:\n\n${formattedHistory}\n\nUser: ${message}\n\nCoach:`

  return aiTextCall(finalPrompt, systemPrompt, 8192, undefined, false)
}

// ── generateStudioContent ──────────────────────────────────────────────────────

export async function generateStudioContent(contentType, inputContext, creatorData, tone = 'Confident', signal = undefined) {
  const name        = creatorData.name        || creatorData.handle?.replace('@','') || 'this creator'
  const handle      = creatorData.handle      || '@creator'
  const platform    = creatorData.platform    || 'social media'
  const followers   = creatorData.followers   ? fmt(creatorData.followers) : 'growing'
  const engRate     = creatorData.engagementRate ? `${creatorData.engagementRate}%` : 'solid'
  const niche       = creatorData.niche       || 'content creation'
  const productName = creatorData.productName || 'Creator Academy'
  const blueprint   = creatorData.blueprint
  const productDesc = blueprint?.description  || `a premium ${niche} platform`
  const bio         = creatorData.description ? `\nBio: "${creatorData.description.slice(0, 150)}"` : ''

  const system = `You are an elite creator economy copywriter. You write highly engaging, high-conversion copy for creators. Return ONLY a JSON object containing a "content" field with the generated copy text.`

  const prompt = `Write a piece of copy with the following requirements:
Content Type: ${contentType.label} (${contentType.platform})
Tone: ${tone}
Creator Name: ${name} (${handle})
Platform: ${platform} (${followers} followers, ${engRate} engagement)
Niche: ${niche}${bio}
Product Launching: "${productName}" — ${productDesc}
${inputContext ? `Additional Context/Instructions: ${inputContext}` : ''}

Write native, high-impact, authentic copy for this specific content type. Avoid generic templates, make it sound like a real creator on that platform. Use line breaks and emojis where appropriate for the platform.
Return exactly this JSON:
{
  "content": "the generated copy here, with formatting, line breaks, or paragraphs if needed"
}`

  try {
    const data = await aiTextCall(prompt, system, 8192, signal, true)
    return data.content || ''
  } catch (err) {
    if (err.name === 'AbortError') throw err
    throw new Error(`AI generation failed: ${err.message}`)
  }
}

export function extractCalendarArray(data) {
  if (Array.isArray(data)) return data
  if (data && typeof data === 'object') {
    for (const key of Object.keys(data)) {
      if (Array.isArray(data[key])) {
        return data[key]
      }
    }
    for (const key of Object.keys(data)) {
      if (data[key] && typeof data[key] === 'object') {
        const nested = extractCalendarArray(data[key])
        if (nested) return nested
      }
    }
  }
  return null
}

export async function generateContentCalendar(creatorData, goal, signal = undefined) {
  const name        = creatorData.name        || creatorData.handle?.replace('@','') || 'this creator'
  const handle      = creatorData.handle      || '@creator'
  const platform    = creatorData.platform    || 'social media'
  const followers   = creatorData.followers   ? fmt(creatorData.followers) : 'growing'
  const engRate     = creatorData.engagementRate ? `${creatorData.engagementRate}%` : 'solid'
  const niche       = creatorData.niche       || 'content creation'
  const productName = creatorData.productName || 'Creator Academy'
  const blueprint   = creatorData.blueprint
  const productDesc = blueprint?.description  || `a premium ${niche} platform`
  const bio         = creatorData.description ? `\nBio: "${creatorData.description.slice(0, 150)}"` : ''

  const system = `You are an elite creator economy content planner. You design highly strategic, platform-native weekly content calendars. Return ONLY valid JSON.`

  const prompt = `Generate a 7-day weekly content calendar tailored to:
Creator: ${name} (${handle})
Platform: ${platform} (${followers} followers)
Niche: ${niche}
Product: "${productName}" (${productDesc})
Current Campaign Goal: ${goal.toUpperCase()} (e.g., launch a product, drive growth, boost engagement, build community)

The calendar must consist of 7 days: "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun".
For each day, suggest 0 to 2 posts.
For each post, provide:
- platform: one of "Instagram", "Twitter", "YouTube", "TikTok", "LinkedIn", "Email"
- type: e.g., "Reel", "Post", "Thread", "Story", "Email", "Video", "Shorts", "Community" (appropriate for the platform)
- title: a specific, compelling hook, outline, or title for the post (e.g. "Behind-the-scenes building Creator Academy" or "5 tools I use to save 10 hours a week")
- theme: one of the allowed theme keys: "launch", "value", "bts", "proof", "cta", "community", "story"
- status: one of "draft", "scheduled" (default most to "draft", but include a few "scheduled" or "posted" for variety)

Return exactly this JSON structure (an array of 7 objects representing the days of the week, in order from Mon to Sun):
[
  {
    "day": "Mon",
    "posts": [
      { "id": 1, "platform": "Instagram", "type": "Reel", "title": "...", "theme": "...", "status": "..." }
    ]
  },
  ...
]

Ensure each post id is a unique number (starting from 1 and incrementing). Make the titles tailored, highly specific, and creative based on the creator's niche and product.`

  try {
    const data = await aiTextCall(prompt, system, 8192, signal, true)
    let parsed = null
    
    if (Array.isArray(data)) {
      parsed = data
    } else if (data && data.content && typeof data.content === 'string') {
      if (data.content.startsWith('(API Call Failed:') || data.content.startsWith('Error:')) {
        throw new Error(data.content)
      }
      try {
        parsed = JSON.parse(data.content)
      } catch(e) {
        throw new Error("Failed to parse AI response content as JSON")
      }
    } else if (data && typeof data === 'object') {
      parsed = extractCalendarArray(data)
    }

    if (Array.isArray(parsed)) {
      return parsed
    }

    throw new Error("AI did not return a valid calendar array")
  } catch (err) {
    if (err.name === 'AbortError') throw err
    console.error("AI Calendar generation failed:", err)
    throw err
  }
}

export async function generateSingleCalendarPost(creatorData, day, goal, signal = undefined) {
  const name        = creatorData.name        || creatorData.handle?.replace('@','') || 'this creator'
  const niche       = creatorData.niche       || 'content creation'
  const productName = creatorData.productName || 'Creator Academy'

  const system = `You are an elite content strategist. Return ONLY valid JSON.`
  const prompt = `Generate a single strategic calendar post for ${day} for the creator ${name} (niche: ${niche}) targeting the campaign goal: ${goal.toUpperCase()}.
The product is "${productName}".

Return exactly this JSON:
{
  "platform": "Instagram" (or "Twitter", "YouTube", "TikTok", "LinkedIn", "Email"),
  "type": "Reel" (or "Thread", "Story", "Post", "Video", "Shorts", "Community" etc.),
  "title": "A highly specific, native post hook or title",
  "theme": "launch" (or "value", "bts", "proof", "cta", "community", "story"),
  "status": "draft"
}`
  try {
    const data = await aiTextCall(prompt, system, 8192, signal, true)
    if (data && data.content && typeof data.content === 'string') {
      try { return JSON.parse(data.content) } catch(e) {}
    }
    if (data && data.content && typeof data.content === 'object') {
      return data.content
    }
    return data
  } catch (err) {
    if (err.name === 'AbortError') throw err
    console.error("AI Single Calendar Post generation failed:", err)
    throw err
  }
}

export async function generateRecommendationsAI(creatorData) {
  const name      = creatorData.name      || creatorData.handle?.replace('@','') || 'this creator'
  const handle    = creatorData.handle    || '@creator'
  const platform  = creatorData.platform  || 'social media'
  const followers = creatorData.followers ? fmt(creatorData.followers) : 'growing'
  const engRate   = creatorData.engagementRate ? `${creatorData.engagementRate}%` : 'solid'
  const niche     = creatorData.niche     || 'content creation'
  const bio       = creatorData.description ? `\nBio: "${creatorData.description.slice(0, 150)}"` : ''

  const system = `You are a world-class creator monetization strategist. You analyze a creator's niche, audience, and platform, and recommend the top 4 highly personalized product types to launch. Return ONLY a valid JSON array. Ensure all string values are properly escaped (especially double quotes inside strings) and contain no raw newlines.`

  const prompt = `Generate exactly 4 product recommendations for:
Creator: ${name} (${handle})
Platform: ${platform} (${followers} followers, ${engRate} engagement)
Niche: ${niche}${bio}

Recommend 4 products across different categories chosen from: "course", "community", "app", "physical_product", "saas", "coaching", "newsletter", "other".
Order them from best match (highest confidence) to alternates.

Return exactly this JSON array structure:
[
  {
    "product_name": "Course / Product Name (creative and specific, do not include '[Placeholder]')",
    "product_category": "course",
    "tagline": "Catchy 5-8 word tagline",
    "description": "2-sentence clear explanation of what this product is and how the audience accesses it",
    "target_audience": "Specific audience segment",
    "revenue_model": "Pricing strategy (e.g. $29/mo membership, $199 one-time course)",
    "revenue_potential": "$5K–$20K / mo (reasonable estimation matching their followers/niche)",
    "confidence_score": 0.95
  },
  ...
]

Keep product names authentic, tailored, and highly specific to the creator's niche.`

  try {
    const data = await aiTextCall(prompt, system, 8192, undefined, true)

    // 1. Direct array
    if (Array.isArray(data)) return data

    // 2. Wrapped string content — try to parse it
    if (data && typeof data.content === 'string') {
      const raw = data.content.trim()
      // Strip markdown fences if present
      const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
      const jsonStr = fenceMatch ? fenceMatch[1] : raw
      // Find first '[' array in the string
      const arrStart = jsonStr.indexOf('[')
      const arrEnd   = jsonStr.lastIndexOf(']')
      if (arrStart !== -1 && arrEnd !== -1) {
        try { return JSON.parse(jsonStr.slice(arrStart, arrEnd + 1)) } catch(e) {}
      }
      try { return JSON.parse(jsonStr) } catch(e) {}
    }

    // 3. Wrapped object content
    if (data && typeof data.content === 'object') return data.content

    // 4. Object with known array keys
    if (data && typeof data === 'object') {
      if (data.recommendations) return data.recommendations
      // Search any array-valued key
      const arrVal = Object.values(data).find(v => Array.isArray(v))
      if (arrVal) return arrVal
    }

    throw new Error('AI returned unrecognisable format')
  } catch (err) {
    console.error('AI failed for recommendations:', err)
    throw err
  }
}



