import React from 'react'

/**
 * Atomic Skeleton component with glassmorphism shimmer animation.
 */
export function Skeleton({
  className = '',
  variant = 'default', // 'default' | 'purple' | 'emerald' | 'blue' | 'amber' | 'dark'
  width,
  height,
  rounded = 'rounded-xl',
  style = {},
  children,
  ...props
}) {
  const variantStyles = {
    default: 'bg-white/[0.04] border-white/[0.06]',
    purple: 'bg-purple-500/[0.05] border-purple-500/20',
    emerald: 'bg-emerald-500/[0.05] border-emerald-500/20',
    blue: 'bg-blue-500/[0.05] border-blue-500/20',
    amber: 'bg-amber-500/[0.05] border-amber-500/20',
    dark: 'bg-[#0a0c10]/80 border-white/[0.04]'
  }

  const baseStyle = {
    width: width !== undefined ? (typeof width === 'number' ? `${width}px` : width) : undefined,
    height: height !== undefined ? (typeof height === 'number' ? `${height}px` : height) : undefined,
    ...style
  }

  return (
    <div
      className={`shimmer-line relative overflow-hidden border ${rounded} ${variantStyles[variant] || variantStyles.default} ${className}`}
      style={baseStyle}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * Shimmer text line with configurable rows and randomized widths.
 */
export function SkeletonText({
  lines = 2,
  className = '',
  lineHeight = 'h-3',
  gap = 'space-y-2',
  widths = ['w-full', 'w-4/5', 'w-2/3', 'w-1/2'],
  variant = 'default'
}) {
  return (
    <div className={`w-full ${gap} ${className}`}>
      {Array.from({ length: lines }).map((_, i) => {
        const widthClass = widths[i % widths.length]
        return (
          <Skeleton
            key={i}
            variant={variant}
            rounded="rounded-full"
            className={`${lineHeight} ${widthClass}`}
          />
        )
      })}
    </div>
  )
}

/**
 * Circular Skeleton placeholder for avatars, logos, and icon badges.
 */
export function SkeletonCircle({ size = 40, className = '', variant = 'default' }) {
  return (
    <Skeleton
      variant={variant}
      rounded="rounded-full"
      width={size}
      height={size}
      className={`shrink-0 ${className}`}
    />
  )
}

/**
 * Button / Pill Skeleton placeholder.
 */
export function SkeletonButton({
  width = 120,
  height = 36,
  rounded = 'rounded-xl',
  className = '',
  variant = 'default'
}) {
  return (
    <Skeleton
      variant={variant}
      rounded={rounded}
      width={width}
      height={height}
      className={`shrink-0 ${className}`}
    />
  )
}

/**
 * Card Skeleton container with header, body lines, and optional footer.
 */
export function SkeletonCard({
  className = '',
  variant = 'default',
  hasHeader = true,
  lines = 3,
  hasFooter = false
}) {
  return (
    <div
      className={`p-4 rounded-2xl bg-[#0e1117]/90 border border-white/[0.08] space-y-3 relative overflow-hidden ${className}`}
    >
      {hasHeader && (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <SkeletonCircle size={28} variant={variant} />
            <div className="space-y-1">
              <Skeleton variant={variant} rounded="rounded-full" className="w-24 h-3" />
              <Skeleton variant={variant} rounded="rounded-full" className="w-16 h-2" />
            </div>
          </div>
          <Skeleton variant={variant} rounded="rounded-full" className="w-12 h-4" />
        </div>
      )}

      <SkeletonText lines={lines} variant={variant} />

      {hasFooter && (
        <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between">
          <Skeleton variant={variant} rounded="rounded-full" className="w-20 h-2.5" />
          <Skeleton variant={variant} rounded="rounded-full" className="w-14 h-5" />
        </div>
      )}
    </div>
  )
}

export default Skeleton
