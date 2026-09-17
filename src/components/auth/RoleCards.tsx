import { useState } from 'react'
import type { UserRole } from '@/types'
import Ico from '@/components/common/Icons'

interface RoleCardsProps {
  onSelectRole: (role: UserRole) => void
  glass?: boolean
}

export function RoleCards({ onSelectRole, glass = false }: RoleCardsProps) {
  const [hovered, setHovered] = useState<UserRole | null>(null)

  const roles: {
    id: UserRole
    title: string
    tag: string
    desc: string
    color: string
    gradient: string
    badgeBg: string
    icon: React.ReactNode
  }[] = [
    {
      id: 'resident',
      title: 'Residente / Inquilino',
      tag: 'PORTAL RESIDENCIAL',
      desc: 'Pases QR, reservas de amenidades, comunicados y pagos',
      color: '#008080',
      gradient: 'from-teal-500 to-emerald-600',
      badgeBg: 'bg-teal-50 text-teal-700 border-teal-200/60',
      icon: (
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 10.5 12 3l9 7.5v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <path d="M9 21.5v-7a3 3 0 0 1 6 0v7" />
          <circle cx="12" cy="11" r="1.5" fill="currentColor" />
        </svg>
      ),
    },
    {
      id: 'admin',
      title: 'Administración HOA',
      tag: 'MESA DIRECTIVA & GESTIÓN',
      desc: 'Supervisión global, reportes financieros, cuotas y catálogo',
      color: '#6366f1',
      gradient: 'from-indigo-500 to-violet-600',
      badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200/60',
      icon: (
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <path d="M3 9h18" />
          <path d="M9 21V9" />
          <path d="M14 13h3" />
          <path d="M14 17h3" />
        </svg>
      ),
    },
    {
      id: 'security',
      title: 'Personal de Seguridad',
      tag: 'CASETA & CONTROL',
      desc: 'Validación de códigos QR en tiempo real y bitácora de accesos',
      color: '#0f766e',
      gradient: 'from-emerald-600 to-teal-800',
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200/60',
      icon: (
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      ),
    },
  ]

  return (
    <div className="space-y-3.5">
      {roles.map(r => {
        const on = hovered === r.id
        return (
          <button
            key={r.id}
            type="button"
            onClick={() => onSelectRole(r.id)}
            onMouseEnter={() => setHovered(r.id)}
            onMouseLeave={() => setHovered(null)}
            className="w-full text-left relative overflow-hidden rounded-2xl focus:outline-none cursor-pointer group transition-all duration-300"
            style={{
              border: glass
                ? `1px solid ${on ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.22)'}`
                : `1px solid ${on ? r.color + '55' : 'rgba(203, 213, 225, 0.7)'}`,
              backgroundColor: glass
                ? on
                  ? 'rgba(255,255,255,0.28)'
                  : 'rgba(255,255,255,0.14)'
                : on
                ? '#fafdfd'
                : '#ffffff',
              boxShadow: on
                ? `0 12px 32px -4px ${r.color}25, 0 4px 12px rgba(0,0,0,0.04)`
                : '0 2px 6px rgba(0,0,0,0.02)',
              transform: on ? 'translateY(-2px)' : 'translateY(0)',
            }}
          >
            {/* Left color bar */}
            <div
              className={`absolute left-0 top-2 bottom-2 w-1.5 rounded-r-full bg-gradient-to-b ${r.gradient} transition-all duration-300 ${
                on ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-50'
              }`}
            />

            <div className="flex items-center gap-4 px-5 py-4">
              {/* Premium Dual-Tone Icon Badge */}
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-300 shadow-sm relative overflow-hidden ${
                  on ? 'scale-105 shadow-md' : ''
                }`}
                style={{
                  background: on
                    ? `linear-gradient(135deg, ${r.color} 0%, ${r.color}dd 100%)`
                    : `${r.color}10`,
                  color: on ? '#ffffff' : r.color,
                  border: `1px solid ${on ? 'transparent' : r.color + '25'}`,
                }}
              >
                {r.icon}
              </div>

              {/* Text Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider border ${r.badgeBg}`}>
                    {r.tag}
                  </span>
                </div>
                <p className="font-display font-bold text-[15px] text-slate-900 group-hover:text-teal-950 transition-colors">
                  {r.title}
                </p>
                <p className="text-xs text-slate-500 line-clamp-1 mt-0.5 group-hover:text-slate-600">
                  {r.desc}
                </p>
              </div>

              {/* Action Chevron */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                  on
                    ? 'bg-slate-100 text-slate-900 translate-x-1'
                    : 'text-slate-400 group-hover:text-slate-600'
                }`}
              >
                <Ico n="chevron" c="w-4 h-4" />
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
export default RoleCards
