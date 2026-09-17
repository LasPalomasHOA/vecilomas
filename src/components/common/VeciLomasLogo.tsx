export function VeciLomasLogo({
  className = 'w-10 h-10',
  rounded = 'rounded-2xl',
  shadow = true,
  withBorder = true,
}: {
  className?: string
  rounded?: string
  shadow?: boolean
  withBorder?: boolean
}) {
  return (
    <div
      className={`${className} ${rounded} overflow-hidden bg-white ${
        shadow ? 'shadow-[0_4px_16px_rgba(0,0,0,0.12)]' : ''
      } ${withBorder ? 'border border-slate-100/90' : ''} flex items-center justify-center p-1 flex-shrink-0`}
    >
      <svg
        viewBox="0 0 500 450"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="crispShadow" x="-10%" y="-10%" width="130%" height="130%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000000" floodOpacity="0.12" />
          </filter>
        </defs>
        <g filter="url(#crispShadow)">
          {/* Top Red Wing/Wave */}
          <path
            d="M 52 195 C 75 160, 140 90, 248 88 C 295 87, 318 120, 335 155 C 370 135, 415 125, 450 148 C 460 155, 460 168, 445 174 C 395 190, 345 198, 315 192 C 285 186, 268 148, 235 142 C 165 130, 105 185, 75 220 C 60 238, 40 215, 52 195 Z"
            fill="#E51922"
          />
          {/* Middle Green Wing/Wave */}
          <path
            d="M 98 290 C 135 255, 185 240, 222 250 C 248 258, 270 295, 290 328 C 340 295, 415 270, 480 282 C 492 285, 492 300, 478 308 C 405 348, 325 352, 280 348 C 255 345, 240 310, 222 298 C 188 278, 150 288, 118 318 C 105 330, 88 312, 98 290 Z"
            fill="#0B8052"
          />
          {/* Bottom Golden Yellow Wing/Wave */}
          <path
            d="M 130 422 C 150 380, 185 375, 218 385 C 238 392, 248 425, 262 445 C 310 405, 380 392, 430 398 C 440 400, 442 415, 430 422 C 372 455, 305 450, 265 448 C 248 447, 238 425, 222 418 C 195 408, 172 418, 148 445 C 138 456, 122 442, 130 422 Z"
            fill="#F9A718"
          />
        </g>
      </svg>
    </div>
  )
}
export default VeciLomasLogo
