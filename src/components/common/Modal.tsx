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
  maxWidth = 'max-w-lg',
}: ModalProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Dialog container */}
      <div
        className={`relative w-full ${maxWidth} max-h-[90vh] flex flex-col rounded-3xl bg-white border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.15)] p-5 sm:p-7 z-10 animate-fade-in my-auto overflow-hidden`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-5 pb-4 border-b border-slate-100 shrink-0">
          <div className="min-w-0 flex-1">
            <h3 className="font-display font-semibold text-lg sm:text-xl text-slate-900 tracking-tight leading-snug truncate">{title}</h3>
            {subtitle && <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
            aria-label="Cerrar"
          >
            <Ico n="x" c="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto pr-1 flex-1">{children}</div>
      </div>
    </div>
  )
}
export default Modal

