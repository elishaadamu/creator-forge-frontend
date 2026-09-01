/**
 * Utility functions to dynamically parse and calculate pricing tiers
 * from various creator/concept pricing strings, validation plans, and campaign kits.
 */

export function parseMainPricingAmount(str, fallback = 49) {
  if (typeof str === 'number') {
    if (str <= 0) return fallback
    if (str >= 1000) {
      // If it's a concatenated artifact like 9919 or 2979
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
  const strVal = String(str).replace(/,/g, '')
  
  // 1. If string matches multi-tier or $XX pattern
  const matches = Array.from(strVal.matchAll(/\$(\d+)/g)).map(m => Number(m[1]))
  if (matches.length > 0) {
    const firstPrice = matches[0]
    if (firstPrice > 0 && firstPrice < 1000) return firstPrice
    if (firstPrice >= 1000) {
      const s = String(firstPrice)
      if (s.length === 4) {
        const firstTwo = Number(s.slice(0, 2))
        if (firstTwo > 0 && firstTwo < 200) return firstTwo
      }
    }
  }

  const digitMatch = strVal.match(/(\d+)/)
  if (digitMatch) {
    const num = Number(digitMatch[1])
    if (num > 0 && num < 1000) return num
    if (num >= 1000) {
      const s = String(num)
      if (s.length === 4) {
        const firstTwo = Number(s.slice(0, 2))
        if (firstTwo > 0 && firstTwo < 200) return firstTwo
      }
    }
  }

  return fallback
}

export function parseDepositPricingAmount(str, mainPrice = 49) {
  const dynamicMain = parseMainPricingAmount(mainPrice, 49)
  const baseFallback = Math.max(9, Math.round(dynamicMain * 0.2))
  if (typeof str === 'number') {
    if (str <= 0 || str >= 500 || str === 1984 || str === Math.round(9919 * 0.2)) return baseFallback
    return str
  }
  if (!str) return baseFallback

  const strVal = String(str)

  // 1. Explicit deposit or reservation keyword pattern, e.g. "($19 refundable reservation deposit)" or "deposit: $19"
  const depositMatch =
    strVal.match(/(?:deposit|reservation)[^\d$]*\$(\d+)/i) ||
    strVal.match(/\$(\d+)[^\d$]*(?:refundable|reservation|deposit)/i)
  if (depositMatch) {
    const parsed = Number(depositMatch[1])
    if (parsed > 0 && parsed < dynamicMain && parsed < 500) return parsed
  }

  // 2. Multi-tier pattern: e.g. "$99/mo Annual • $19/mo Community"
  const allPrices = Array.from(strVal.matchAll(/\$(\d+)/g))
    .map(m => Number(m[1]))
    .filter(p => p > 0 && p < 1000)

  if (allPrices.length >= 2) {
    const secondPrice = allPrices[1]
    // If the secondary price is lower than the primary price, treat it as the low-tier deposit / community rate
    if (secondPrice > 0 && secondPrice < allPrices[0]) {
      return secondPrice
    }
  }

  return baseFallback
}

/**
 * Sanitizes potentially corrupted pricing values (e.g. legacy regex-concatenated strings like '9919' from '$99...$19')
 */
export function sanitizePricingConfig(cfg, pricingSource) {
  const dynamicMain = parseMainPricingAmount(pricingSource, 99)
  const dynamicDeposit = parseDepositPricingAmount(pricingSource, dynamicMain)

  if (!cfg) {
    return {
      foundingPrice: dynamicMain,
      depositPrice: dynamicDeposit,
      perks: ''
    }
  }

  let founding = Number(cfg.foundingPrice)
  let deposit = Number(cfg.depositPrice)

  // Detect corrupted concatenation artifacts (e.g. 9919, 2979, 49129 from multi-tier strings)
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
    (founding > 300 && dynamicMain < 200)

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
    (deposit > 150 && dynamicDeposit < 100)

  if (isCorruptedDeposit) {
    deposit = dynamicDeposit
  }

  return {
    ...cfg,
    foundingPrice: founding,
    depositPrice: deposit
  }
}
