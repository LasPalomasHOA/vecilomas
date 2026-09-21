import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import Ico from '@/components/common/Icons'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: ReactNode
  maxWidth?: string
}

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-xl',
}: ModalProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = originalOverflow || 'unset'
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen || !mounted || typeof document === 'undefined') return null

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      {/* Immersive Edge-to-Edge Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity duration-300 animate-backdrop-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Luxury Dialog Container */}
      <div
        className={`relative w-full ${maxWidth} my-auto flex flex-col rounded-[26px] sm:rounded-3xl bg-white border border-slate-200/80 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.35),0_0_0_1px_rgba(0,0,0,0.06)] p-5 sm:p-7 z-10 animate-modal-pop overflow-hidden`}
        onClick={e => e.stopPropagation()}
      >
        {/* Top subtle luxury brand glow line */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-teal-500/20 via-teal-600 to-teal-500/20 pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100 shrink-0">
          <div className="min-w-0 flex-1 pr-2">
            <h3 className="font-display font-bold text-lg sm:text-xl text-slate-900 tracking-tight leading-snug">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all duration-150 shrink-0 cursor-pointer active:scale-95"
            aria-label="Cerrar ventana emergente"
          >
            <Ico n="x" c="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto max-h-[calc(85vh-100px)] pt-4 pr-1 focus:outline-none">
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}

export default Modal
