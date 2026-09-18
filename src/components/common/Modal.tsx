import { useEffect, type ReactNode } from 'react'
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
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Centering container */}
      <div className="flex min-h-full items-center justify-center p-3 sm:p-6 text-center">
        {/* Modal dialog card */}
        <div
          className={`relative w-full ${maxWidth} max-h-[85vh] flex flex-col rounded-3xl bg-white border border-slate-100 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] p-5 sm:p-7 z-10 animate-fade-in text-left my-auto overflow-hidden`}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-4 pb-3.5 border-b border-slate-100 shrink-0">
            <div className="min-w-0 flex-1">
              <h3 className="font-display font-bold text-lg sm:text-xl text-slate-900 tracking-tight leading-snug truncate">
                {title}
              </h3>
              {subtitle && (
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5 leading-relaxed">
                  {subtitle}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
              aria-label="Cerrar modal"
            >
              <Ico n="x" c="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="overflow-y-auto flex-1 pr-1.5 -mr-1">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Modal
