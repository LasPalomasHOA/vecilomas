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
      } ${withBorder ? 'border border-slate-100/90' : ''} flex items-center justify-center p-1.5 flex-shrink-0`}
    >
      <img
        src="/PalomasIcon.svg"
        alt="Las Palomas"
        className="w-full h-full object-contain select-none pointer-events-none"
      />
    </div>
  )
}
export default VeciLomasLogo
