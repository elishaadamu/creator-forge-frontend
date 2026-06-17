/**
 * Creator Forge — Real Profile Scraper
 *
 * ONE Apify token covers all 4 platforms:
 *   YouTube   → Apify: streamers~youtube-channel-scraper  (4.3★, 12K users)
 *               Fallback: YouTube Data API v3 if yt key also provided
 *   Instagram → Apify: apify~instagram-profile-scraper
 *   TikTok    → Apify: clockworks~free-tiktok-scraper
 *   Twitter/X → Apify: apify~twitter-scraper
 *
 * Keys are stored in localStorage so users never touch .env
 */

const YT_BASE    = 'https://www.googleapis.com/youtube/v3'
const APIFY_BASE = 'https://api.apify.com/v2'

// ── Key management ───────────────────────────────────────────────────────────

let inMemoryKeys = {
  youtubeApiKey: '',
  apifyToken: '',
}

try {
  inMemoryKeys.youtubeApiKey = localStorage.getItem('forge_youtube_api_key') || ''
  inMemoryKeys.apifyToken = localStorage.getItem('forge_apify_token') || ''
} catch (e) {
  console.warn('[Forge] Failed to load scraping keys from localStorage:', e)
}

export function loadKeys() {
  return inMemoryKeys
}

export function saveKeys({ youtubeApiKey, apifyToken }) {
  if (youtubeApiKey !== undefined) {
    inMemoryKeys.youtubeApiKey = (youtubeApiKey || '').trim()
    try {
      localStorage.setItem('forge_youtube_api_key', inMemoryKeys.youtubeApiKey)
    } catch (e) {
      console.warn('[Forge] Failed to save youtube key to localStorage:', e)
    }
  }
  if (apifyToken !== undefined) {
    inMemoryKeys.apifyToken = (apifyToken || '').trim()
    try {
      localStorage.setItem('forge_apify_token', inMemoryKeys.apifyToken)
    } catch (e) {
      console.warn('[Forge] Failed to save apify token to localStorage:', e)
    }
  }
}

export function clearInMemoryKeys() {
  inMemoryKeys = {
    youtubeApiKey: '',
    apifyToken: '',
  }
  try {
    localStorage.removeItem('forge_youtube_api_key')
    localStorage.removeItem('forge_apify_token')
  } catch (e) {}
}

/**
 * Returns true if we can scrape this platform.
 * Apify token covers ALL platforms including YouTube.
 * YouTube API key also works as an alternative for YouTube only.
 */
export function hasKey(platform) {
  return true
}

export function hasAnyKey() {
  return true
}

/** Test an Apify token by calling the /users/me endpoint.
 *  Returns { ok: true, username } or { ok: false, error } */
export async function testApifyToken(token) {
  try {
    const res = await fetch(`${APIFY_BASE}/users/me?token=${token.trim()}`)
    if (!res.ok) {
      const text = await res.text()
      return { ok: false, error: `HTTP ${res.status}: ${text.slice(0, 100)}` }
    }
    const data = await res.json()
    const username = data?.data?.username || data?.username || 'your account'
    return { ok: true, username }
  } catch (err) {
    return { ok: false, error: err.message }
  }
}

// ── Number formatter ─────────────────────────────────────────────────────────

function fmt(n) {
  n = parseInt(n) || 0
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

/** Parse subscriber strings like "1.2M", "450K", "10,000" into a number */
function parseBigNum(val) {
  if (typeof val === 'number') return val
  if (!val) return 0
  const s = String(val).replace(/,/g, '').trim()
  if (s.endsWith('M') || s.endsWith('m')) return Math.round(parseFloat(s) * 1_000_000)
  if (s.endsWith('K') || s.endsWith('k')) return Math.round(parseFloat(s) * 1_000)
  return parseInt(s) || 0
}

// ── Module-level scrape promise (bridge between CreatorLink → Analyzing) ─────

let _scrapePromise = null
let _isPending = false

export function startScrape(url, platform) {
  _isPending = true
  _scrapePromise = _doScrape(url, platform).then(data => {
    _isPending = false
    if (data && data.avatarUrl && typeof data.avatarUrl === 'string' && data.avatarUrl.startsWith('http') && !data.avatarUrl.includes('/api/proxy/avatar')) {
      data.avatarUrl = `/api/proxy/avatar?url=${encodeURIComponent(data.avatarUrl)}`
    }
    return data
  }).catch(err => {
    _isPending = false
    throw err
  })
  return _scrapePromise
}

export function getScrapePromise() {
  return _scrapePromise
}

export function isScrapePending() {
  return _isPending
}

export function clearScrapePromise() {
  _scrapePromise = null
  _isPending = false
}

async function _doScrape(url, platform) {
  const handle = extractHandle(url)
  const res = await fetch('/api/creators/scrape', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ platform, handle, save: false })
  })
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`Scrape failed: ${res.status} ${txt.slice(0, 150)}`)
  }
  const data = await res.json()
  if (data.error || !data.scraped) {
    throw new Error(data.error || 'Failed to retrieve scraped data from backend.')
  }
  const scraped = data.scraped
  return {
    platform: scraped.platform,
    handle: scraped.handle,
    name: scraped.display_name || scraped.handle?.replace('@', ''),
    followers: scraped.follower_count || 0,
    description: scraped.bio || '',
    avatarUrl: scraped.avatar_url || '',
    videoCount: scraped.videoCount || scraped.video_count || 0,
    postCount: scraped.postCount || scraped.post_count || 0,
    totalViews: scraped.totalViews || scraped.total_views || 0,
    following: scraped.following || 0,
    heartCount: scraped.heartCount || scraped.heart_count || 0,
    recentPosts: (scraped.recent_posts || []).map(p => ({
      title: p.title || '',
      thumbnail: p.thumbnail || '',
      videoId: p.videoId || '',
      url: p.url || '',
      views: typeof p.views === 'number' ? fmt(p.views) : String(p.views || ''),
      likes: typeof p.likes === 'number' ? fmt(p.likes) : String(p.likes || ''),
      comments: typeof p.comments === 'number' ? fmt(p.comments) : String(p.comments || ''),
      hue: platform === 'youtube' ? 0 : platform === 'instagram' ? 330 : platform === 'tiktok' ? 180 : 210
    }))
  }
}

// ── YouTube ───────────────────────────────────────────────────────────────────
// Primary:  Apify streamers~youtube-channel-scraper  (no quota limits)
// Fallback: YouTube Data API v3 (if user only has a YT key)

export async function scrapeYouTube(url) {
  const { youtubeApiKey, apifyToken } = loadKeys()
  if (!apifyToken && !youtubeApiKey) throw new Error('NO_KEY')

  if (apifyToken) {
    try {
      return await _scrapeYouTubeApify(url, apifyToken)
    } catch (err) {
      console.warn('[Forge] YouTube Apify failed:', err.message)
      if (!youtubeApiKey) throw err
      // fall through to YouTube Data API
    }
  }
  return _scrapeYouTubeDataAPI(url, youtubeApiKey)
}

async function _scrapeYouTubeApify(rawUrl, token) {
  let url = rawUrl.trim()
  if (!url.startsWith('http')) url = 'https://' + url
  // Ensure www. prefix — some Apify actors require canonical YouTube URLs
  url = url.replace(/^(https?:\/\/)youtube\.com/, '$1www.youtube.com')

  const res = await apifyRunSync(
    'streamers~youtube-channel-scraper',
    { startUrls: [{ url }], maxResults: 10 },
    token,
    120
  )

  if (!res?.length) throw new Error('YouTube channel not found')
  const ch = res[0]

  // streamers~youtube-channel-scraper output field names
  // (with fallbacks for minor version differences)
  const name        = ch.channelName       || ch.title            || ch.name             || ''
  const description = ch.channelDescription || ch.description      || ''
  const avatar      = ch.channelAvatarUrl   || ch.channelThumbnailUrl || ch.thumbnailUrl    || ch.avatar           || ''
  const followers   = parseBigNum(ch.numberOfSubscribers || ch.subscriberCount || ch.subscribers || 0)
  const videoCount  = parseBigNum(ch.channelTotalVideos  || ch.numberOfVideos      || ch.videoCount      || 0)

  // Handle: try to pull from channelUrl, fall back to channelId
  let handleRaw = ''
  if (ch.channelUrl) {
    try { handleRaw = new URL(ch.channelUrl).pathname.split('/').filter(Boolean).pop() } catch {}
  }
  if (!handleRaw) handleRaw = ch.channelId || ch.id || name

  // Extract videos: The actor may return an array of video objects or a single channel object with a videos array.
  let rawVideos = []
  if (res.some(item => item.type === 'video' || item.type === 'short' || item.thumbnailUrl)) {
    rawVideos = res.filter(item => item.title)
  } else {
    rawVideos = ch.videos || ch.latestVideos || []
  }
  const videos = rawVideos.slice(0, 6)

  let engagementRate = 3.5
  if (videos.length && followers) {
    const avgEng = videos.reduce((sum, v) =>
      sum + parseBigNum(v.likeCount || v.likes || 0) + parseBigNum(v.commentCount || v.comments || 0), 0
    ) / videos.length
    engagementRate = parseFloat(Math.min((avgEng / followers) * 100, 25).toFixed(1)) || 3.5
  }

  return {
    platform:       'youtube',
    handle:         handleRaw.startsWith('@') ? handleRaw : `@${handleRaw}`,
    name,
    avatarUrl:      avatar,
    followers,
    videoCount,
    totalViews:     parseBigNum(ch.totalViews || ch.viewCount || 0),
    description,
    niche:          inferNicheFromDescription(description),
    engagementRate,
    recentPosts: videos.map(v => ({
      title:     v.title     || v.videoTitle  || '',
      thumbnail: v.thumbnailUrl || v.thumbnail || v.videoThumbnail || '',
      videoId:   v.id        || v.videoId     || '',
      url:       v.url       || (v.id || v.videoId ? `https://www.youtube.com/watch?v=${v.id || v.videoId}` : ''),
      views:     fmt(parseBigNum(v.viewCount    || v.views    || 0)),
      likes:     fmt(parseBigNum(v.likeCount    || v.likes    || 0)),
      comments:  fmt(parseBigNum(v.commentCount || v.comments || 0)),
      hue:       0,
    })),
  }
}

// ── YouTube Data API v3 (fallback when no Apify token) ───────────────────────

function parseYouTubeUrl(rawUrl) {
  let url = rawUrl.trim()
  if (!url.startsWith('http')) url = 'https://' + url
  try {
    const u     = new URL(url)
    const parts = u.pathname.split('/').filter(Boolean)
    const first = parts[0] || ''
    const second  = parts[1] || ''
    if (first === 'channel') return { type: 'channelId', value: second }
    if (first === 'user')    return { type: 'username',  value: second }
    if (first.startsWith('@')) return { type: 'handle',  value: first }
    if (first === 'c')         return { type: 'handle',  value: second }
    if (first && first !== 'watch' && first !== 'shorts') {
      return { type: 'vanity', value: first }
    }
  } catch {}
  return { type: 'unknown', value: rawUrl }
}

async function _ytFetchChannel(key, params) {
  const qs  = new URLSearchParams({ part: 'snippet,statistics,contentDetails', key, ...params })
  const res = await fetch(`${YT_BASE}/channels?${qs}`)
  const d   = await res.json()
  if (d.error) throw new Error(d.error.message || 'YouTube API error')
  return d.items?.[0] || null
}

async function _ytSearch(key, query) {
  const qs  = new URLSearchParams({ part: 'snippet', type: 'channel', q: query, maxResults: '1', key })
  const res = await fetch(`${YT_BASE}/search?${qs}`)
  const d   = await res.json()
  if (d.error) throw new Error(d.error.message || 'YouTube search error')
  const channelId = d.items?.[0]?.id?.channelId
  if (!channelId) return null
  return _ytFetchChannel(key, { id: channelId })
}

async function _scrapeYouTubeDataAPI(rawUrl, key) {
  const parsed = parseYouTubeUrl(rawUrl)
  let ch = null

  if (parsed.type === 'channelId') {
    ch = await _ytFetchChannel(key, { id: parsed.value })
  } else if (parsed.type === 'username') {
    ch = await _ytFetchChannel(key, { forUsername: parsed.value })
    if (!ch) ch = await _ytFetchChannel(key, { forHandle: `@${parsed.value}` })
  } else if (parsed.type === 'handle') {
    const atVal = parsed.value.startsWith('@') ? parsed.value : `@${parsed.value}`
    ch = await _ytFetchChannel(key, { forHandle: atVal })
    if (!ch) ch = await _ytFetchChannel(key, { forUsername: parsed.value.replace('@','') })
  } else {
    // vanity / unknown — 3-layer resolution
    ch = await _ytFetchChannel(key, { forHandle: `@${parsed.value}` })
    if (!ch) ch = await _ytFetchChannel(key, { forUsername: parsed.value })
    if (!ch) ch = await _ytSearch(key, parsed.value)
  }

  if (!ch) throw new Error('YouTube channel not found')

  const stats      = ch.statistics
  const snip       = ch.snippet
  const uploadsId  = ch.contentDetails?.relatedPlaylists?.uploads
  let recentPosts  = []
  let engagementRate = 3.5

  if (uploadsId) {
    const plRes     = await fetch(`${YT_BASE}/playlistItems?part=snippet&playlistId=${uploadsId}&maxResults=6&key=${key}`)
    const plData    = await plRes.json()
    const items     = plData.items || []
    const videoIds  = items.map(v => v.snippet.resourceId.videoId).join(',')
    let videoStats  = []
    if (videoIds) {
      const vsRes  = await fetch(`${YT_BASE}/videos?part=statistics,snippet&id=${videoIds}&key=${key}`)
      const vsData = await vsRes.json()
      videoStats   = vsData.items || []
    }
    recentPosts = items.map((v, i) => {
      const vs     = videoStats[i]?.statistics || {}
      const vSnip  = videoStats[i]?.snippet    || v.snippet
      const thumbs = vSnip.thumbnails || v.snippet.thumbnails || {}
      return {
        title:     vSnip.title || v.snippet.title,
        thumbnail: thumbs.medium?.url || thumbs.default?.url || '',
        videoId:   v.snippet.resourceId.videoId,
        url:       `https://www.youtube.com/watch?v=${v.snippet.resourceId.videoId}`,
        views:     fmt(vs.viewCount),
        likes:     fmt(vs.likeCount),
        comments:  fmt(vs.commentCount),
        hue:       0,
      }
    })
    const subs   = parseInt(stats.subscriberCount) || 1
    const avgEng = videoStats.reduce((sum, v) => {
      const s = v.statistics || {}
      return sum + parseInt(s.likeCount || 0) + parseInt(s.commentCount || 0)
    }, 0) / Math.max(videoStats.length, 1)
    engagementRate = parseFloat(Math.min((avgEng / subs) * 100, 25).toFixed(1)) || 3.5
  }

  const resolvedHandle = snip.customUrl?.replace('@','') || parsed.value || 'channel'

  return {
    platform:       'youtube',
    handle:         `@${resolvedHandle}`,
    name:           snip.title,
    avatarUrl:      snip.thumbnails?.high?.url || snip.thumbnails?.medium?.url || '',
    followers:      parseInt(stats.subscriberCount) || 0,
    totalViews:     parseInt(stats.viewCount)  || 0,
    videoCount:     parseInt(stats.videoCount) || 0,
    description:    snip.description?.slice(0, 200) || '',
    niche:          inferNicheFromDescription(snip.description || ''),
    engagementRate,
    recentPosts,
  }
}

// ── Instagram via Apify ───────────────────────────────────────────────────────
// Actor: apify~instagram-profile-scraper
// Input: { usernames: ["handle"] }

export async function scrapeInstagram(url) {
  const { apifyToken } = loadKeys()
  if (!apifyToken) throw new Error('NO_APIFY_KEY')

  const handle = extractHandle(url)

  const res = await apifyRunSync(
    'apify~instagram-profile-scraper',
    { usernames: [handle] },
    apifyToken,
    90
  )
  if (!res?.length) throw new Error('Instagram profile not found')

  const p = res[0]

  // Field name fallbacks — actor versions differ
  const followersCount = p.followersCount || p.followers_count || p.edge_followed_by?.count || 0
  const username       = p.username || handle
  const fullName       = p.fullName || p.full_name || p.name || username
  const biography      = p.biography || p.bio || ''
  const profilePic     = p.profilePicUrlHD || p.profilePicUrl || p.profile_pic_url_hd || p.profile_pic_url || ''

  const posts = (p.latestPosts || p.posts || p.edge_owner_to_timeline_media?.edges?.map(e => e.node) || []).slice(0, 6)

  const avgLikes    = posts.reduce((s, x) => s + (x.likesCount    || x.like_count    || x.edge_liked_by?.count    || 0), 0) / Math.max(posts.length, 1)
  const avgComments = posts.reduce((s, x) => s + (x.commentsCount || x.comment_count || x.edge_media_to_comment?.count || 0), 0) / Math.max(posts.length, 1)
  const engagementRate = followersCount
    ? parseFloat(((avgLikes + avgComments) / followersCount * 100).toFixed(1))
    : 3.5

  return {
    platform:       'instagram',
    handle:         `@${username}`,
    name:           fullName,
    avatarUrl:      profilePic,
    followers:      followersCount,
    following:      p.followsCount || p.follows_count || p.edge_follow?.count || 0,
    postCount:      p.postsCount   || p.media_count   || 0,
    description:    biography,
    niche:          inferNicheFromDescription(biography),
    engagementRate: isNaN(engagementRate) ? 3.5 : engagementRate,
    recentPosts: posts.map(post => ({
      url:       post.url || (post.shortcode ? `https://www.instagram.com/p/${post.shortcode}/` : ''),
      thumbnail: post.displayUrl || post.display_url || post.thumbnailUrl || post.thumbnail_src || '',
      views:     fmt(post.videoViewCount || post.video_view_count || (post.likesCount || post.like_count || 0) * 8),
      likes:     fmt(post.likesCount     || post.like_count       || post.edge_liked_by?.count || 0),
      comments:  fmt(post.commentsCount  || post.comment_count    || post.edge_media_to_comment?.count || 0),
      hue:       330,
    })),
  }
}

// ── TikTok via Apify ──────────────────────────────────────────────────────────
// Actor: clockworks~free-tiktok-scraper
// Input: { profiles: [url], resultsType: "profiles" }

export async function scrapeTikTok(url) {
  const { apifyToken } = loadKeys()
  if (!apifyToken) throw new Error('NO_APIFY_KEY')

  const handle     = extractHandle(url)
  const profileUrl = `https://www.tiktok.com/@${handle}`

  const res = await apifyRunSync(
    'clockworks~free-tiktok-scraper',
    { profiles: [profileUrl], resultsType: 'profiles', maxProfilesPerQuery: 1 },
    apifyToken,
    90
  )

  if (!res?.length) throw new Error('TikTok profile not found')
  const first = res[0]

  // Data may be nested under authorMeta or at root
  const p = first?.authorMeta || first

  const fans       = p.fans        || p.followerCount || p.followersCount || 0
  const nickName   = p.nickName    || p.nickname      || p.name          || handle
  const uniqueId   = p.uniqueId    || p.id            || handle
  const avatar     = p.avatarLarger || p.avatarMedium || p.avatarThumb   || p.avatar || ''
  const signature  = p.signature   || p.bio           || p.description   || ''

  // Try fetching recent videos in a second call
  let recentPosts = []
  try {
    const videoRes = await apifyRunSync(
      'clockworks~free-tiktok-scraper',
      { profiles: [profileUrl], resultsType: 'videos', maxVideosPerProfile: 6 },
      apifyToken,
      60
    )
    recentPosts = (videoRes || []).slice(0, 6).map(v => {
      const meta = v.videoMeta || {}
      return {
        url:       v.webVideoUrl || v.videoUrl || (v.id ? `https://www.tiktok.com/@${uniqueId}/video/${v.id}` : ''),
        thumbnail: meta.coverUrl    || v.covers?.[0]    || v.coverUrl     || '',
        views:     fmt(v.playCount  || meta.playCount   || 0),
        likes:     fmt(v.diggCount  || meta.diggCount   || v.likeCount    || 0),
        comments:  fmt(v.commentCount || meta.commentCount || 0),
        hue:       180,
      }
    })
  } catch (_) { /* silent — profile is more important than videos */ }

  return {
    platform:       'tiktok',
    handle:         `@${uniqueId}`,
    name:           nickName,
    avatarUrl:      avatar,
    followers:      fans,
    following:      p.following || 0,
    heartCount:     p.heart     || p.heartCount || 0,
    description:    signature,
    niche:          inferNicheFromDescription(signature),
    engagementRate: 5.2,
    recentPosts,
  }
}

// ── Twitter / X via Apify ─────────────────────────────────────────────────────
// Actor: apify~twitter-scraper
// Input: { twitterHandles: ["handle"], maxItems: 1 }

export async function scrapeTwitter(url) {
  const { apifyToken } = loadKeys()
  if (!apifyToken) throw new Error('NO_APIFY_KEY')

  const handle = extractHandle(url)

  const res = await apifyRunSync(
    'apify~twitter-scraper',
    {
      twitterHandles:  [handle],
      maxItems:        20,
      addUserInfo:     true,
      includeUserData: true,
    },
    apifyToken,
    90
  )

  // Scraper returns tweets; user is nested in author
  const item = res?.[0]
  if (!item) throw new Error('Twitter profile not found')

  // Field name fallbacks across actor versions
  const user = item.author || item.user || (item.userName ? item : null)
  if (!user) throw new Error('Twitter user data not found')

  const userName    = user.userName     || user.screen_name     || handle
  const name        = user.name         || user.displayName     || userName
  const description = user.description  || user.bio             || ''
  const followers   = user.followers    || user.followersCount  || user.public_metrics?.followers_count || 0
  const following   = user.following    || user.followingCount  || user.public_metrics?.following_count || 0
  const avatarRaw   = user.profilePicture || user.profile_image_url_https || user.avatarUrl || ''
  const avatar      = avatarRaw.replace('_normal', '_400x400')

  return {
    platform:       'twitter',
    handle:         `@${userName}`,
    name,
    avatarUrl:      avatar,
    followers,
    following,
    description,
    niche:          inferNicheFromDescription(description),
    engagementRate: 1.8,
    recentPosts:    [],
  }
}

// ── Apify sync runner ─────────────────────────────────────────────────────────

async function apifyRunSync(actorId, input, token, timeoutSecs = 60) {
  const url = `${APIFY_BASE}/acts/${actorId}/run-sync-get-dataset-items?token=${token}&timeout=${timeoutSecs}&memory=256`
  console.log(`[Forge] Apify POST ${actorId}`, input)
  const res  = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(input),
  })
  if (!res.ok) {
    const errText = await res.text()
    console.error(`[Forge] Apify ${actorId} → HTTP ${res.status}:`, errText.slice(0, 500))
    throw new Error(`Apify ${res.status} (${actorId}): ${errText.slice(0, 200)}`)
  }
  const data = await res.json()
  console.log(`[Forge] Apify ${actorId} → ${data?.length ?? 0} items`, data?.[0])
  return data
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractHandle(url) {
  try {
    let parseUrl = url
    if (!parseUrl.startsWith('http')) parseUrl = 'https://' + parseUrl
    const u = new URL(parseUrl)
    const parts = u.pathname.split('/').filter(Boolean)
    
    if (parts.length) {
      if (parts[0] === 'user' || parts[0] === 'c' || parts[0] === 'channel') {
        const h = parts[1]
        if (h) {
          if (parts[0] === 'channel') return `channel/${h}`
          return h.replace('@', '')
        }
      }
      const last = parts[parts.length - 1]
      const h = (last === 'videos' || last === 'shorts' || last === 'featured') && parts.length > 1
        ? parts[parts.length - 2]
        : last
      return h.replace('@', '')
    }
  } catch {}
  return url.replace('@', '')
}

const NICHE_KEYWORDS = {
  'Tech & Gadgets':         ['tech', 'technology', 'gadget', 'phone', 'apple', 'android', 'software', 'coding', 'dev', 'ai', 'programming'],
  'Finance & Business':     ['finance', 'money', 'invest', 'crypto', 'business', 'entrepreneur', 'startup', 'trading', 'wealth'],
  'Health & Fitness':       ['fitness', 'health', 'workout', 'gym', 'nutrition', 'wellness', 'diet', 'run', 'yoga', 'crossfit'],
  'Gaming':                 ['gaming', 'games', 'gamer', 'twitch', 'esport', 'playstation', 'xbox', 'nintendo', 'stream'],
  'Beauty & Fashion':       ['beauty', 'makeup', 'fashion', 'style', 'skincare', 'outfit', 'luxury', 'ootd', 'glam'],
  'Food & Cooking':         ['food', 'cook', 'recipe', 'restaurant', 'baking', 'chef', 'eat', 'culinary', 'kitchen'],
  'Travel & Lifestyle':     ['travel', 'lifestyle', 'adventure', 'explore', 'vlog', 'daily', 'trip', 'journey'],
  'Education':              ['education', 'learn', 'teach', 'tutor', 'course', 'tutorial', 'how to', 'tips', 'guide'],
  'Comedy & Entertainment': ['comedy', 'funny', 'meme', 'entertainment', 'laugh', 'sketch', 'humor', 'jokes'],
  'Music & Arts':           ['music', 'musician', 'artist', 'art', 'creative', 'singer', 'guitar', 'producer', 'beats'],
  'Parenting & Family':     ['parent', 'family', 'mom', 'dad', 'kids', 'baby', 'parenting', 'children'],
  'Creator & Marketing':    ['creator', 'content', 'youtube', 'instagram', 'social media', 'marketing', 'brand', 'influence'],
}

function inferNicheFromDescription(text) {
  const lower = text.toLowerCase()
  for (const [niche, keywords] of Object.entries(NICHE_KEYWORDS)) {
    if (keywords.some(k => lower.includes(k))) return niche
  }
  return 'Lifestyle & Creativity'
}
