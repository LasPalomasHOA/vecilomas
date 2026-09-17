import type { ReactNode, ButtonHTMLAttributes } from 'react'
import { BRAND_COLORS } from '@/types'

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'whatsapp'
  sm?: boolean
  className?: string
}

export function Btn({
  children,
  onClick,
  sm = false,
  variant = 'primary',
  disabled = false,
  type = 'button',
  className = '',
  ...rest
}: BtnProps) {
  const sizeClasses = sm ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-sm'

  if (variant === 'ghost') {
    return (
      <button
        type={type}
        disabled={disabled}
        onClick={onClick}
        className={`inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed text-slate-600 hover:text-slate-900 whitespace-nowrap shrink-0 cursor-pointer ${sizeClasses} ${className}`}
        {...rest}
      >
        {children}
      </button>
    )
  }

  if (variant === 'secondary') {
    return (
      <button
        type={type}
        disabled={disabled}
        onClick={onClick}
        className={`inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 bg-slate-100 text-slate-800 hover:bg-slate-200/80 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shrink-0 cursor-pointer ${sizeClasses} ${className}`}
        {...rest}
      >
        {children}
      </button>
    )
  }

  if (variant === 'outline') {
    return (
      <button
        type={type}
        disabled={disabled}
        onClick={onClick}
        className={`inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shrink-0 cursor-pointer shadow-xs ${sizeClasses} ${className}`}
        {...rest}
      >
        {children}
      </button>
    )
  }

  if (variant === 'danger') {
    return (
      <button
        type={type}
        disabled={disabled}
        onClick={onClick}
        className={`inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 bg-red-50 border border-red-100 text-red-600 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shrink-0 cursor-pointer ${sizeClasses} ${className}`}
        {...rest}
      >
        {children}
      </button>
    )
  }

  if (variant === 'whatsapp') {
    return (
      <button
        type={type}
        disabled={disabled}
        onClick={onClick}
        className={`inline-flex items-center justify-center gap-2 font-medium rounded-xl text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shrink-0 cursor-pointer ${sizeClasses} ${className}`}
        style={{
          background: 'linear-gradient(135deg, #10b981, #059669)',
          boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
        }}
        {...rest}
      >
        {children}
      </button>
    )
  }

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 font-medium rounded-xl text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shrink-0 cursor-pointer ${sizeClasses} ${className}`}
      style={{
        background: `linear-gradient(135deg, ${BRAND_COLORS.primary}, ${BRAND_COLORS.primaryDark})`,
        boxShadow: '0 2px 8px rgba(0, 128, 128, 0.25)',
      }}
      {...rest}
    >
      {children}
    </button>
  )
}
export default Btn

