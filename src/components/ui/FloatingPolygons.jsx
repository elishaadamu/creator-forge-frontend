export function HeroShallowPolygons({ className = "" } = {}) {
  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden select-none ${className}`} aria-hidden="true">
      {/* Shallow Polygon at Hero Right (moderately sized, partially hiding in the extreme right) */}
      <div className="absolute top-2 sm:top-6 lg:top-8 -right-14 sm:-right-20 lg:-right-28 opacity-95">
        <svg
          viewBox="0 0 760 760"
          className="w-[280px] h-[280px] sm:w-[360px] sm:h-[360px] lg:w-[440px] lg:h-[440px]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="heroRightShallowPolyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366F1" stopOpacity="0.12" />
              <stop offset="50%" stopColor="#A855F7" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.03" />
            </linearGradient>
            <linearGradient id="heroRightShallowStrokeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#818CF8" stopOpacity="0.45" />
              <stop offset="60%" stopColor="#C084FC" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.10" />
            </linearGradient>
          </defs>

          {/* Organic Rounded Asymmetrical Polygon */}
          <path
            d="M 240 90 
               L 560 130 
               Q 620 140 645 190 
               L 700 420 
               Q 715 470 680 510 
               L 510 660 
               Q 470 695 410 690 
               L 170 650 
               Q 115 640 100 590 
               L 65 330 
               Q 50 275 90 235 
               L 190 115 
               Q 215 90 240 90 Z"
            fill="url(#heroRightShallowPolyGrad)"
            stroke="url(#heroRightShallowStrokeGrad)"
            strokeWidth="1.75"
          />

          {/* Thin Concentric Orbital Guide Rings */}
          <circle cx="530" cy="270" r="145" stroke="#818CF8" strokeOpacity="0.30" strokeWidth="1" strokeDasharray="5 6" />
          <circle cx="530" cy="270" r="110" stroke="#A855F7" strokeOpacity="0.22" strokeWidth="1" />

          {/* Faint Glowing Node Beads on Orbital Path */}
          <circle cx="410" cy="205" r="4" fill="#818CF8" fillOpacity="0.9" />
          <circle cx="410" cy="205" r="9" fill="#818CF8" fillOpacity="0.25" />
          <circle cx="650" cy="225" r="3.5" fill="#A855F7" fillOpacity="0.85" />
          <circle cx="650" cy="225" r="7.5" fill="#A855F7" fillOpacity="0.20" />

          {/* Floating Shallow Hexagon Contour inside */}
          <polygon
            points="530,215 575,242 575,298 530,325 485,298 485,242"
            fill="rgba(243, 232, 255, 0.40)"
            stroke="#A855F7"
            strokeOpacity="0.38"
            strokeWidth="1"
          />
        </svg>
      </div>

      {/* Shallow Polygon at Hero Bottom-Left (near CTA button, partially hiding in the extreme left) */}
      <div className="absolute bottom-6 sm:bottom-10 lg:bottom-14 -left-14 sm:-left-20 lg:-left-28 opacity-95">
        <svg
          viewBox="0 0 760 760"
          className="w-[260px] h-[260px] sm:w-[340px] sm:h-[340px] lg:w-[420px] lg:h-[420px]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="heroLeftShallowPolyGrad" x1="100%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.10" />
              <stop offset="50%" stopColor="#6366F1" stopOpacity="0.07" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.025" />
            </linearGradient>
            <linearGradient id="heroLeftShallowStrokeGrad" x1="100%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.42" />
              <stop offset="60%" stopColor="#818CF8" stopOpacity="0.26" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.10" />
            </linearGradient>
          </defs>

          {/* Organic Rounded Asymmetrical Polygon */}
          <path
            d="M 200 130 
               L 520 85 
               Q 580 80 615 120 
               L 695 360 
               Q 715 410 690 460 
               L 550 655 
               Q 515 700 460 705 
               L 205 680 
               Q 150 675 125 630 
               L 70 395 
               Q 55 345 85 305 
               L 165 155 
               Q 185 135 200 130 Z"
            fill="url(#heroLeftShallowPolyGrad)"
            stroke="url(#heroLeftShallowStrokeGrad)"
            strokeWidth="1.75"
          />

          {/* Thin Concentric Orbital Guide Rings */}
          <circle cx="410" cy="490" r="140" stroke="#10B981" strokeOpacity="0.28" strokeWidth="1" strokeDasharray="5 5" />
          <circle cx="410" cy="490" r="100" stroke="#6366F1" strokeOpacity="0.22" strokeWidth="1" />

          {/* Faint Glowing Node Beads on Orbital Path */}
          <circle cx="305" cy="425" r="4" fill="#10B981" fillOpacity="0.9" />
          <circle cx="305" cy="425" r="9" fill="#10B981" fillOpacity="0.25" />
          <circle cx="525" cy="525" r="3.5" fill="#6366F1" fillOpacity="0.85" />
          <circle cx="525" cy="525" r="7.5" fill="#6366F1" fillOpacity="0.20" />

          {/* Floating Shallow Hexagon Contour inside */}
          <polygon
            points="410,440 455,468 455,522 410,550 365,522 365,468"
            fill="rgba(236, 253, 245, 0.40)"
            stroke="#10B981"
            strokeOpacity="0.38"
            strokeWidth="1"
          />
        </svg>
      </div>
    </div>
  );
}

export const BigShallowBackgroundPolygons = HeroShallowPolygons;

export default function FloatingPolygons({ variant = 'hero' }) {
  if (variant === 'big-shallow') {
    return <HeroShallowPolygons />;
  }

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
