export default function FloatingPolygons({ variant = 'hero' }) {
  if (variant === 'hero') {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
        {/* Top Left Orange Triangle */}
        <div className="absolute top-12 left-[4%] sm:left-[8%] animate-float-slow opacity-85">
          <svg className="w-4 h-4 text-[#F97316] fill-current rotate-12 drop-shadow-xs" viewBox="0 0 24 24">
            <polygon points="12,2 22,20 2,20" />
          </svg>
        </div>

        {/* Top Right Teal Diamond */}
        <div className="absolute top-14 right-[5%] sm:right-[10%] animate-float-gentle opacity-80">
          <svg className="w-3.5 h-3.5 text-[#10B981] fill-current rotate-45 drop-shadow-xs" viewBox="0 0 24 24">
            <rect x="4" y="4" width="16" height="16" rx="2" />
          </svg>
        </div>

        {/* Mid-Left Purple Circle */}
        <div className="absolute top-[36%] left-[3%] sm:left-[6%] animate-float-reverse opacity-75">
          <span className="w-3 h-3 rounded-full bg-[#8B5CF6] inline-block shadow-xs" />
        </div>

        {/* Mid-Right Coral Triangle */}
        <div className="absolute top-[40%] right-[4%] sm:right-[7%] animate-float-slow opacity-80">
          <svg className="w-4 h-4 text-[#F43F5E] fill-current -rotate-12 drop-shadow-xs" viewBox="0 0 24 24">
            <polygon points="12,2 22,20 2,20" />
          </svg>
        </div>

        {/* Lower Left Amber Star */}
        <div className="absolute bottom-28 left-[8%] sm:left-[11%] animate-float-gentle opacity-85">
          <span className="text-[#F59E0B] font-bold text-base leading-none select-none">✦</span>
        </div>

        {/* Lower Right Cyan Dot */}
        <div className="absolute bottom-32 right-[8%] sm:right-[12%] animate-float-reverse opacity-80">
          <span className="w-2.5 h-2.5 rounded-full bg-[#06B6D4] inline-block shadow-xs" />
        </div>

        {/* Scattered small micro dots */}
        <div className="absolute top-[22%] left-[22%] animate-float-slow opacity-60">
          <span className="w-2 h-2 rounded-full bg-[#EAB308] inline-block" />
        </div>
        <div className="absolute top-[26%] right-[20%] animate-float-gentle opacity-60">
          <span className="text-[#10B981] font-bold text-xs select-none">✦</span>
        </div>
      </div>
    )
  }

  // Section variant for Pipeline, Reviews, etc.
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
      <div className="absolute top-8 left-[3%] sm:left-[5%] animate-float-slow opacity-75">
        <svg className="w-3.5 h-3.5 text-[#10B981] fill-current rotate-45 drop-shadow-xs" viewBox="0 0 24 24">
          <rect x="4" y="4" width="16" height="16" rx="2" />
        </svg>
      </div>
      <div className="absolute top-10 right-[4%] sm:right-[6%] animate-float-gentle opacity-80">
        <svg className="w-4 h-4 text-[#F97316] fill-current rotate-12 drop-shadow-xs" viewBox="0 0 24 24">
          <polygon points="12,2 22,20 2,20" />
        </svg>
      </div>
      <div className="absolute bottom-10 left-[5%] sm:left-[8%] animate-float-reverse opacity-70">
        <span className="text-[#8B5CF6] font-bold text-sm select-none">✦</span>
      </div>
      <div className="absolute bottom-8 right-[5%] sm:right-[8%] animate-float-slow opacity-75">
        <svg className="w-3.5 h-3.5 text-[#F43F5E] fill-current -rotate-12 drop-shadow-xs" viewBox="0 0 24 24">
          <polygon points="12,2 22,20 2,20" />
        </svg>
      </div>
    </div>
  )
}
