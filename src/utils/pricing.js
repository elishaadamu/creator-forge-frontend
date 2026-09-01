/**
 * Utility functions to dynamically parse and calculate pricing tiers
 * from various creator/concept pricing strings, validation plans, and campaign kits.
 */

export function parseMainPricingAmount(str, fallback = 49) {
  if (typeof str === 'number') {
    if (str <= 0) return fallback
    return str
  }
  if (!str) return fallback
  const strVal = String(str).replace(/,/g, '')
  const match = strVal.match(/\$(\d+)/)
  if (match) return Number(match[1]) || fallback
  const digitMatch = strVal.match(/(\d+)/)
  return digitMatch ? Number(digitMatch[1]) : fallback
}

export function parseDepositPricingAmount(str, mainPrice = 49) {
  const dynamicMain = parseMainPricingAmount(mainPrice, 49)
  const baseFallback = Math.max(9, Math.round(dynamicMain * 0.2))
  if (typeof str === 'number') {
    if (str <= 0) return baseFallback
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
    if (parsed > 0) return parsed
  }

  // 2. Multi-tier pattern: e.g. "$99/mo Annual • $19/mo Community"
  const allPrices = Array.from(strVal.matchAll(/\$(\d+)/g)).map(m => Number(m[1]))
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
  const dynamicMain = parseMainPricingAmount(pricingSource, 49)
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

  // Detect corrupted concatenation artifacts (e.g. 9919 or 2979 from multi-tier strings)
  const rawPricingStr = String(pricingSource || '')
  const rawConcat = Number(rawPricingStr.replace(/[^0-9]/g, '')) || 0
  if (founding === rawConcat && founding !== dynamicMain && rawPricingStr.includes('$')) {
    founding = dynamicMain
  }
  if (!founding || founding <= 0) {
    founding = dynamicMain
  }

  if (!deposit || deposit <= 0) {
    deposit = dynamicDeposit
  }

  return {
    ...cfg,
    foundingPrice: founding,
    depositPrice: deposit
  }
}
