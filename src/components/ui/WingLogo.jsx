export default function WingLogo({ size = 28, color = 'white', className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 84"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Main wing body */}
      <path
        d="M18 62 C22 48 38 28 110 6 C88 30 66 42 52 50 L44 70 C32 76 20 72 18 62Z"
        fill={color}
      />
      {/* Feather detail line 1 */}
      <path
        d="M36 55 C58 38 86 22 108 10"
        stroke="#080808"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Feather detail line 2 */}
      <path
        d="M44 51 C64 36 90 22 108 14"
        stroke="#080808"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.7"
      />
      {/* Foot / shoe base */}
      <path
        d="M34 66 C42 72 62 72 80 67 C86 64 84 60 78 58 C68 55 52 57 42 62 Z"
        fill={color}
      />
    </svg>
  )
}
