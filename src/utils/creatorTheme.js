/**
 * Creator Forge Dynamic Dashboard Theme System
 *
 * Provides harmonious, cohesive, high-contrast color palettes for the Creator & Admin Dashboards.
 * Designed to ensure maximum readability (dark, crisp text on clean, tinted light canvases)
 * while expressing the creator's unique venture brand identity chosen by AI or Admin.
 */

export const CREATOR_THEMES = [
  {
    id: 'emerald',
    name: 'Studio Emerald',
    subtitle: 'Growth, SaaS & Tech',
    primaryHex: '#16A34A',
    primaryHover: '#15803D',
    glow: 'rgba(22, 163, 74, 0.22)',
    bgCanvas: '#f4faf6',
    bgCard: '#ffffff',
    bgCardSubtle: '#f0fdf4',
    borderCard: '#e2e8f0',
    borderActive: '#86efac',
    textHeading: '#0f172a',
    textBody: '#334155',
    textMuted: '#64748b',
    badgeBg: '#ecfdf5',
    badgeText: '#166534',
    badgeBorder: '#bbf7d0',
    accentBtnBg: '#16A34A',
    accentBtnText: '#ffffff',
    gradientAccent: 'linear-gradient(90deg, #16a34a 0%, #059669 100%)',
    dotColor: '#cbd5e1',
    ringColor: 'rgba(22, 163, 74, 0.25)',
  },
  {
    id: 'cyan',
    name: 'Ocean Cyan',
    subtitle: 'Creator Tools & Digital Platforms',
    primaryHex: '#0284C7',
    primaryHover: '#0369A1',
    glow: 'rgba(2, 132, 199, 0.22)',
    bgCanvas: '#f0f8ff',
    bgCard: '#ffffff',
    bgCardSubtle: '#f0f9ff',
    borderCard: '#e2e8f0',
    borderActive: '#7dd3fc',
    textHeading: '#0f172a',
    textBody: '#334155',
    textMuted: '#64748b',
    badgeBg: '#f0f9ff',
    badgeText: '#075985',
    badgeBorder: '#bae6fd',
    accentBtnBg: '#0284C7',
    accentBtnText: '#ffffff',
    gradientAccent: 'linear-gradient(90deg, #0284c7 0%, #0ea5e9 100%)',
    dotColor: '#cbd5e1',
    ringColor: 'rgba(2, 132, 199, 0.25)',
  },
  {
    id: 'obsidian',
    name: 'Obsidian Slate',
    subtitle: 'Finance, Engineering & Executive',
    primaryHex: '#0F172A',
    primaryHover: '#1E293B',
    glow: 'rgba(15, 23, 42, 0.25)',
    bgCanvas: '#f8fafc',
    bgCard: '#ffffff',
    bgCardSubtle: '#f1f5f9',
    borderCard: '#e2e8f0',
    borderActive: '#94a3b8',
    textHeading: '#020617',
    textBody: '#334155',
    textMuted: '#64748b',
    badgeBg: '#f1f5f9',
    badgeText: '#0f172a',
    badgeBorder: '#cbd5e1',
    accentBtnBg: '#0F172A',
    accentBtnText: '#ffffff',
    gradientAccent: 'linear-gradient(90deg, #0f172a 0%, #334155 100%)',
    dotColor: '#cbd5e1',
    ringColor: 'rgba(15, 23, 42, 0.25)',
  },
  {
    id: 'amber',
    name: 'Venture Amber',
    subtitle: 'Media, Creators & VIP Masterminds',
    primaryHex: '#D97706',
    primaryHover: '#B45309',
    glow: 'rgba(217, 119, 6, 0.22)',
    bgCanvas: '#fdfbf7',
    bgCard: '#ffffff',
    bgCardSubtle: '#fffbeb',
    borderCard: '#e2e8f0',
    borderActive: '#fcd34d',
    textHeading: '#1c1917',
    textBody: '#44403c',
    textMuted: '#78716c',
    badgeBg: '#fffbeb',
    badgeText: '#92400e',
    badgeBorder: '#fde68a',
    accentBtnBg: '#D97706',
    accentBtnText: '#ffffff',
    gradientAccent: 'linear-gradient(90deg, #d97706 0%, #f59e0b 100%)',
    dotColor: '#cbd5e1',
    ringColor: 'rgba(217, 119, 6, 0.25)',
  },
  {
    id: 'indigo',
    name: 'Royal Indigo',
    subtitle: 'AI Copilots, Workflows & Data',
    primaryHex: '#4F46E5',
    primaryHover: '#4338CA',
    glow: 'rgba(79, 70, 229, 0.22)',
    bgCanvas: '#f5f6fe',
    bgCard: '#ffffff',
    bgCardSubtle: '#eef2ff',
    borderCard: '#e2e8f0',
    borderActive: '#a5b4fc',
    textHeading: '#0f172a',
    textBody: '#334155',
    textMuted: '#64748b',
    badgeBg: '#eef2ff',
    badgeText: '#3730a3',
    badgeBorder: '#c7d2fe',
    accentBtnBg: '#4F46E5',
    accentBtnText: '#ffffff',
    gradientAccent: 'linear-gradient(90deg, #4f46e5 0%, #6366f1 100%)',
    dotColor: '#cbd5e1',
    ringColor: 'rgba(79, 70, 229, 0.25)',
  },
  {
    id: 'lime',
    name: 'Forge Lime',
    subtitle: 'Gaming, Fitness & High-Energy',
    primaryHex: '#65A30D',
    primaryHover: '#4D7C0F',
    glow: 'rgba(101, 163, 13, 0.22)',
    bgCanvas: '#f6fbf0',
    bgCard: '#ffffff',
    bgCardSubtle: '#f7fee7',
    borderCard: '#e2e8f0',
    borderActive: '#bef264',
    textHeading: '#0f172a',
    textBody: '#334155',
    textMuted: '#64748b',
    badgeBg: '#f7fee7',
    badgeText: '#3f6212',
    badgeBorder: '#d9f99d',
    accentBtnBg: '#65A30D',
    accentBtnText: '#ffffff',
    gradientAccent: 'linear-gradient(90deg, #65a30d 0%, #84cc16 100%)',
    dotColor: '#cbd5e1',
    ringColor: 'rgba(101, 163, 13, 0.25)',
  },
  {
    id: 'steel',
    name: 'Industrial Steel',
    subtitle: 'Operations, B2B & Developer Tools',
    primaryHex: '#475569',
    primaryHover: '#334155',
    glow: 'rgba(71, 85, 105, 0.22)',
    bgCanvas: '#f8fafc',
    bgCard: '#ffffff',
    bgCardSubtle: '#f1f5f9',
    borderCard: '#e2e8f0',
    borderActive: '#94a3b8',
    textHeading: '#0f172a',
    textBody: '#334155',
    textMuted: '#64748b',
    badgeBg: '#f1f5f9',
    badgeText: '#1e293b',
    badgeBorder: '#cbd5e1',
    accentBtnBg: '#475569',
    accentBtnText: '#ffffff',
    gradientAccent: 'linear-gradient(90deg, #475569 0%, #64748b 100%)',
    dotColor: '#cbd5e1',
    ringColor: 'rgba(71, 85, 105, 0.25)',
  },
]

/**
 * AI Recommendation: Automatically select a theme from the creator's niche/concept
 */
export function getAiRecommendedTheme(niche = '', productName = '') {
  const text = `${niche} ${productName}`.toLowerCase()
  if (text.includes('game') || text.includes('gaming') || text.includes('fitness') || text.includes('sport') || text.includes('workout') || text.includes('creator') || text.includes('lifestyle')) {
    return CREATOR_THEMES.find(t => t.id === 'lime') || CREATOR_THEMES[0]
  }
  if (text.includes('ai') || text.includes('data') || text.includes('bot') || text.includes('automation') || text.includes('workflow') || text.includes('intelligence')) {
    return CREATOR_THEMES.find(t => t.id === 'indigo') || CREATOR_THEMES[0]
  }
  if (text.includes('finance') || text.includes('crypto') || text.includes('invest') || text.includes('trading') || text.includes('executive') || text.includes('wealth')) {
    return CREATOR_THEMES.find(t => t.id === 'obsidian') || CREATOR_THEMES[0]
  }
  if (text.includes('electronics') || text.includes('hardware') || text.includes('circuit') || text.includes('repair') || text.includes('mechanic') || text.includes('industrial') || text.includes('operations') || text.includes('b2b')) {
    return CREATOR_THEMES.find(t => t.id === 'amber') || CREATOR_THEMES.find(t => t.id === 'steel') || CREATOR_THEMES[0]
  }
  if (text.includes('video') || text.includes('media') || text.includes('youtube') || text.includes('course') || text.includes('community') || text.includes('vip') || text.includes('mastermind')) {
    return CREATOR_THEMES.find(t => t.id === 'amber') || CREATOR_THEMES[0]
  }
  if (text.includes('design') || text.includes('dev') || text.includes('code') || text.includes('tool') || text.includes('cloud') || text.includes('software') || text.includes('saas') || text.includes('tech')) {
    return CREATOR_THEMES.find(t => t.id === 'cyan') || CREATOR_THEMES[0]
  }
  return CREATOR_THEMES[0] // Studio Emerald default
}

/**
 * Resolves full theme definition from project or color identifier
 */
export function resolveCreatorTheme(colorInput, niche = '', productName = '') {
  if (!colorInput) {
    return getAiRecommendedTheme(niche, productName)
  }

  const raw = String(colorInput).trim().toLowerCase()

  // Match by theme ID
  const byId = CREATOR_THEMES.find(t => t.id === raw)
  if (byId) return byId

  // Match by theme Name
  const byName = CREATOR_THEMES.find(t => t.name.toLowerCase().includes(raw))
  if (byName) return byName

  // Match by Hex
  const byHex = CREATOR_THEMES.find(t => t.primaryHex.toLowerCase() === raw)
  if (byHex) return byHex

  // Custom Hex Support with high-contrast calculated fallbacks
  if (raw.startsWith('#') || raw.length === 6) {
    const hex = raw.startsWith('#') ? raw : `#${raw}`
    return {
      id: 'custom',
      name: 'Custom Brand',
      subtitle: 'Tailored Creator Brand',
      primaryHex: hex,
      primaryHover: hex,
      glow: `${hex}33`,
      bgCanvas: '#f8fafc',
      bgCard: '#ffffff',
      bgCardSubtle: '#f1f5f9',
      borderCard: '#e2e8f0',
      borderActive: hex,
      textHeading: '#0f172a', // High-contrast dark text
      textBody: '#334155',
      textMuted: '#64748b',
      badgeBg: '#f1f5f9',
      badgeText: '#0f172a',
      badgeBorder: '#cbd5e1',
      accentBtnBg: hex,
      accentBtnText: '#ffffff',
      gradientAccent: `linear-gradient(90deg, ${hex} 0%, #0f172a 100%)`,
      dotColor: '#cbd5e1',
      ringColor: `${hex}40`,
    }
  }

  return getAiRecommendedTheme(niche, productName)
}

/**
 * Injects CSS variables for consistent global theming across child components
 */
export function getThemeCssVariables(theme) {
  return {
    '--brand-primary': theme.primaryHex,
    '--brand-primary-hover': theme.primaryHover,
    '--brand-glow': theme.glow,
    '--brand-canvas': theme.bgCanvas,
    '--brand-card': theme.bgCard,
    '--brand-heading': theme.textHeading,
    '--brand-body': theme.textBody,
    '--brand-muted': theme.textMuted,
    '--brand-badge-bg': theme.badgeBg,
    '--brand-badge-text': theme.badgeText,
    '--brand-badge-border': theme.badgeBorder,
    '--brand-ring': theme.ringColor,
  }
}
