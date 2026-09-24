export default function CreatorForgeLogo({ size = 22, className = '', showText = true, theme = 'dark' }) {
  const isLight = theme === 'light'
  return (
    <div className={`inline-flex items-center gap-2.5 select-none shrink-0 ${className}`}>
      {/* Geometric Forge / Catalyst Symbol (creator → idea → product → business) */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        {/* Node 1: Creator (Base anchor) */}
        <rect x="3" y="13" width="7" height="7" rx="1.5" fill={isLight ? "#0F172A" : "#F5F3EA"} />
        {/* Node 2: Idea / Signal (Elevation) */}
        <rect x="3" y="4" width="7" height="7" rx="1.5" fill={isLight ? "#64748B" : "#969DA6"} fillOpacity="0.8" />
        {/* Node 3: Software Product (Core) */}
        <rect x="12" y="4" width="7" height="7" rx="1.5" fill={isLight ? "#0F172A" : "#F5F3EA"} />
        {/* Node 4: Business / Catalyst Spark (Electric Lime) */}
        <rect x="12" y="13" width="7" height="7" rx="1.5" fill={isLight ? "#65A30D" : "#C8FF3D"} />
      </svg>

      {showText && (
        <div className="flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0">
          <span className={`font-display font-bold text-xs sm:text-[14px] tracking-tight uppercase whitespace-nowrap ${isLight ? 'text-[#0F172A]' : 'text-[#F5F3EA]'}`}>
            CREATOR FORGE
          </span>
          <span className={`text-[8.5px] sm:text-[9px] font-mono tracking-widest px-1.5 py-0.5 rounded uppercase whitespace-nowrap hidden xs:inline-block ${
            isLight
              ? 'bg-[#F1F5F9] text-[#0F172A] border border-[#CBD5E1]'
              : 'bg-[#171C22] text-[#C8FF3D] border border-[#252B32]'
          }`}>
            STUDIO
          </span>
        </div>
      )}
    </div>
  )
}
