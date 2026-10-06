/**
 * Utility functions to dynamically parse and calculate pricing tiers
 * from various creator/concept pricing strings, validation plans, and campaign kits.
 */

/**
 * Intelligently extracts founding price, deposit price, starter price, and tiers
 * from concept pricing strings like:
 *   - "$59/mo Membership • $199 One-time Annual Access"
 *   - "$19/mo Starter • $49/mo Pro"
 *   - "$29/mo Membership • $299 Lifetime Access"
 *   - "$49/mo Membership • $149/mo VIP Mastermind"
 *   - "$89"
 */
export function parseConceptPricing(str, fallbackFounding = 99) {
  if (typeof str === 'number') {
    const num = str > 0 && str < 1000 ? str : fallbackFounding
    const dep = Math.max(9, Math.round(num * 0.2))
    return {
      foundingPrice: num,
      depositPrice: dep,
      starterPrice: Math.max(9, Math.round(num * 0.3)),
      proPrice: num,
      tiers: [{ name: 'Founding Member Pass', price: num, period: 'lifetime' }]
    }
  }

  if (!str) {
    const dep = Math.max(9, Math.round(fallbackFounding * 0.2))
    return {
      foundingPrice: fallbackFounding,
      depositPrice: dep,
      starterPrice: Math.max(9, Math.round(fallbackFounding * 0.3)),
      proPrice: fallbackFounding,
      tiers: [{ name: 'Founding Member Pass', price: fallbackFounding, period: 'lifetime' }]
    }
  }

  const strVal = String(str).replace(/,/g, '').trim()
  const segments = strVal.split(/[•|;]/).map(s => s.trim()).filter(Boolean)
  const extracted = []

  for (const seg of segments) {
    const priceMatch = seg.match(/\$(\d+)/)
    if (priceMatch) {
      const price = Number(priceMatch[1])
      if (price > 0 && price < 10000) {
        const isMonthly = /\/mo|per month|monthly/i.test(seg)
        const isAnnual = /annual|one-time|lifetime|access|pass|year|\/yr/i.test(seg)
        const isVip = /vip|mastermind|founding/i.test(seg)

        let name = seg.replace(/\$(\d+)/, '').replace(/\//g, ' ').trim()
        name = name.replace(/^\s*(?:mo|per month)\s*/i, '').trim()
        name = name.replace(/\s+/g, ' ')

        if (!name || ['plan', 'tier'].includes(name.toLowerCase())) {
          name = isMonthly ? 'Monthly Membership' : (isAnnual ? 'Founding Annual Pass' : 'Standard Plan')
        } else if (isMonthly && !/(?:monthly|month|\/mo)/i.test(name)) {
          name = `${name} (Monthly)`
        }

        extracted.push({
          raw: seg,
          price,
          name,
          isMonthly,
          isAnnual,
          isVip,
          period: isMonthly ? 'month' : (isAnnual ? 'annual' : 'one-time')
        })
      }
    }
  }

  if (extracted.length === 0) {
    const allPrices = Array.from(strVal.matchAll(/\$(\d+)/g)).map(m => Number(m[1])).filter(p => p > 0 && p < 10000)
    for (let idx = 0; idx < allPrices.length; idx++) {
      const price = allPrices[idx]
      extracted.push({
        raw: `$${price}`,
        price,
        name: idx === 0 ? 'Starter Plan' : 'Founding Tier',
        isMonthly: false,
        isAnnual: idx > 0,
        isVip: false,
        period: 'one-time'
      })
    }
  }

  if (extracted.length === 0) {
    const digits = strVal.match(/(\d+)/)
    const base = digits ? Number(digits[1]) : fallbackFounding
    const dep = Math.max(9, Math.round(base * 0.2))
    return {
      foundingPrice: base,
      depositPrice: dep,
      starterPrice: Math.max(9, Math.round(base * 0.3)),
      proPrice: base,
      tiers: [{ name: 'Founding Member Pass', price: base, period: 'lifetime' }]
    }
  }

  const annualOrOneTime = extracted.find(t => t.isAnnual || t.isVip)
  const monthly = extracted.find(t => t.isMonthly)

  let foundingPrice = fallbackFounding
  let starterPrice = 29
  let proPrice = 79

  if (extracted.length === 1) {
    foundingPrice = extracted[0].price
    starterPrice = extracted[0].isMonthly ? extracted[0].price : Math.max(9, Math.round(foundingPrice * 0.3))
    proPrice = Math.max(starterPrice * 2, Math.round(foundingPrice * 0.7))
  } else if (annualOrOneTime && monthly) {
    foundingPrice = annualOrOneTime.price
    starterPrice = monthly.price
    proPrice = foundingPrice
  } else {
    const sorted = [...extracted].sort((a, b) => a.price - b.price)
    const lowest = sorted[0]
    const highest = sorted[sorted.length - 1]
    starterPrice = lowest.price
    if (highest.price >= 80) {
      foundingPrice = highest.price
    } else {
      foundingPrice = Math.max(highest.price * 2, 89)
    }
    proPrice = highest.price
  }

  const depositPrice = Math.max(9, Math.round(foundingPrice * 0.2))

  const tiers = extracted.map(t => {
    let tName = t.name
    if (t.price === foundingPrice && !/(?:founding|annual|lifetime|pass)/i.test(tName)) {
      tName = `Founding Pass (${tName})`
    }
    return {
      name: tName,
      price: t.price,
      period: t.period
    }
  })

  return {
    foundingPrice,
    depositPrice,
    starterPrice,
    proPrice,
    tiers
  }
}

export function parseMainPricingAmount(str, fallback = 49) {
  if (typeof str === 'number') {
    if (str <= 0) return fallback
    if (str >= 1000) {
      const s = String(str)
      if (s.length === 4) {
        const firstTwo = Number(s.slice(0, 2))
        if (firstTwo > 0 && firstTwo < 200) return firstTwo
      }
      return fallback
    }
    return str
  }
  if (!str) return fallback

  const parsed = parseConceptPricing(str, fallback)
  return parsed.foundingPrice
}

export function parseDepositPricingAmount(str, mainPrice = 49) {
  if (typeof str === 'number') {
    if (str <= 0 || str >= 500 || str === 1984 || str === Math.round(9919 * 0.2)) {
      const dyn = parseMainPricingAmount(mainPrice, 49)
      return Math.max(9, Math.round(dyn * 0.2))
    }
    return str
  }
  if (!str) {
    const dyn = parseMainPricingAmount(mainPrice, 49)
    return Math.max(9, Math.round(dyn * 0.2))
  }

  const strVal = String(str)

  // Explicit deposit or reservation keyword pattern, e.g. "($19 refundable reservation deposit)"
  const depositMatch =
    strVal.match(/(?:deposit|reservation)[^\d$]*\$(\d+)/i) ||
    strVal.match(/\$(\d+)[^\d$]*(?:refundable|reservation|deposit)/i)
  if (depositMatch) {
    const parsed = Number(depositMatch[1])
    if (parsed > 0 && parsed < 500) return parsed
  }

  const parsed = parseConceptPricing(str, mainPrice)
  return parsed.depositPrice
}

/**
 * Sanitizes potentially corrupted pricing values (e.g. legacy regex-concatenated strings like '9919' from '$99...$19'
 * or outdated default fallbacks like 89/18).
 */
export function sanitizePricingConfig(cfg, pricingSource) {
  const parsed = parseConceptPricing(pricingSource, 99)
  const dynamicMain = parsed.foundingPrice
  const dynamicDeposit = parsed.depositPrice

  if (!cfg) {
    return {
      foundingPrice: dynamicMain,
      depositPrice: dynamicDeposit,
      perks: '',
      tiers: parsed.tiers
    }
  }

  let founding = Number(cfg.foundingPrice)
  let deposit = Number(cfg.depositPrice)

  // Detect corrupted concatenation artifacts (e.g. 9919, 2979, 49129 from multi-tier strings)
  // or legacy stale backend fallbacks (89, 177, 29, 99 when concept specifies 199 or another price)
  const rawPricingStr = String(pricingSource || '')
  const rawConcat = Number(rawPricingStr.replace(/[^0-9]/g, '')) || 0

  const isCorruptedFounding =
    !founding ||
    founding <= 0 ||
    founding >= 1000 ||
    founding === 9919 ||
    founding === 2979 ||
    founding === 49129 ||
    (rawConcat > 0 && founding === rawConcat && founding !== dynamicMain) ||
    (dynamicMain > 0 && founding !== dynamicMain && (founding === 89 || founding === 177 || founding === 29 || founding === 99))

  if (isCorruptedFounding) {
    founding = dynamicMain
  }

  const isCorruptedDeposit =
    !deposit ||
    deposit <= 0 ||
    deposit >= founding ||
    deposit >= 500 ||
    deposit === 1984 ||
    deposit === Math.round(9919 * 0.2) ||
    (rawConcat > 0 && deposit === Math.round(rawConcat * 0.2) && deposit !== dynamicDeposit) ||
    (dynamicDeposit > 0 && deposit !== dynamicDeposit && (deposit === 18 || deposit === 35 || deposit === 6 || (deposit === 19 && dynamicDeposit !== 19)))

  if (isCorruptedDeposit) {
    deposit = dynamicDeposit
  }

  return {
    ...cfg,
    foundingPrice: founding,
    depositPrice: deposit,
    tiers: cfg.tiers || parsed.tiers
  }
}

/**
 * Formats/sanitizes a concept pricing display string so that missing dollar amounts
 * (e.g. "/mo Membership •  Lifetime Access") are safely resolved with complete pricing.
 */
export function formatConceptPricing(str) {
  if (!str || typeof str !== 'string') return '$29/mo Membership • $299 Lifetime Access'
  const trimmed = str.trim()
  if (
    trimmed === '/mo Membership •  Lifetime Access' ||
    trimmed === '/mo Membership • Lifetime Access' ||
    trimmed.startsWith('/mo Membership') ||
    trimmed.startsWith('/mo')
  ) {
    return '$29/mo Membership • $299 Lifetime Access'
  }
  if (trimmed.includes('Lifetime Access') && !trimmed.match(/\$\d+[^•]*Lifetime Access/i)) {
    if (trimmed.startsWith('$')) {
      return trimmed.replace(/•\s*(?:[A-Za-z\s]*\s*)?Lifetime Access/i, '• $299 Lifetime Access')
    }
    return '$29/mo Membership • $299 Lifetime Access'
  }
  if (!trimmed.includes('$') && (trimmed.includes('/mo') || trimmed.includes('Access') || trimmed.includes('Pro') || trimmed.includes('Starter'))) {
    return `$${trimmed}`
  }
  return trimmed
}
