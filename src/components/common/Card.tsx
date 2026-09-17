import type { ReactNode, CSSProperties } from 'react'

export const GLASS_STYLES = {
  nav: {
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(0, 51, 51, 0.08)',
    boxShadow: '0 4px 20px -4px rgba(0, 51, 51, 0.04)',
  } as CSSProperties,
  card: {
    backgroundColor: '#ffffff',
    border: '1px solid rgba(0, 51, 51, 0.07)',
    boxShadow:
      'inset 0 1px 0 0 rgba(255, 255, 255, 0.95), 0 1px 3px 0 rgba(0, 51, 51, 0.03), 0 6px 20px -2px rgba(0, 51, 51, 0.04)',
  } as CSSProperties,
  cardElevated: {
    backgroundColor: '#ffffff',
    border: '1px solid rgba(0, 128, 128, 0.15)',
    boxShadow:
      'inset 0 1px 0 0 rgba(255, 255, 255, 1), 0 12px 32px -4px rgba(0, 51, 51, 0.08), 0 4px 12px -2px rgba(0, 51, 51, 0.03)',
  } as CSSProperties,
  glass: {
    backgroundColor: 'rgba(255, 255, 255, 0.82)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.7)',
    boxShadow: '0 6px 24px rgba(0, 51, 51, 0.05)',
  } as CSSProperties,
  input: {
    backgroundColor: '#ffffff',
    border: '1px solid rgba(0, 51, 51, 0.12)',
    color: '#0f172a',
    outline: 'none',
    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.02)',
  } as CSSProperties,
}

export function GCard({
  children,
  className = '',
  style,
  p = 'p-5 sm:p-6',
  onClick,
  hoverable = false,
}: {
  children: ReactNode
  className?: string
  style?: CSSProperties
  p?: string
  onClick?: () => void
  accentColor?: string
  hoverable?: boolean
}) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl ${p} relative overflow-hidden transition-all duration-200 bg-white border border-teal-950/[0.07] ${
        hoverable
          ? 'hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(0,51,51,0.08)] hover:border-teal-600/30 cursor-pointer'
          : 'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,51,51,0.03),0_6px_20px_rgba(0,51,51,0.04)]'
      } ${className}`}
      style={{
        ...style,
      }}
    >
      {children}
    </div>
  )
}
export default GCard


