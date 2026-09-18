import { useState } from 'react'
import type { UserRole } from '@/types'
import { BRAND_COLORS } from '@/types'
import Ico, { type IconName } from '@/components/common/Icons'

interface RoleCardsProps {
  onSelectRole: (role: UserRole) => void
  glass?: boolean
}

const ROLES: {
  id: UserRole
  title: string
  tag: string
  desc: string
  color: string
  gradient: string
  badgeBg: string
  iconName: IconName
}[] = [
  {
    id: 'resident',
    title: 'Residente / Inquilino',
    tag: 'PORTAL RESIDENCIAL',
    desc: 'Autoservicio, reservas y consultas personales',
    color: BRAND_COLORS.primary,
    gradient: 'from-teal-500 to-emerald-600',
    badgeBg: 'bg-teal-50 text-teal-700 border-teal-200/60',
    iconName: 'home',
  },
  {
    id: 'admin',
    title: 'Administración HOA',
    tag: 'MESA DIRECTIVA & GESTIÓN',
    desc: 'Gestión global, reportes y configuración',
    color: '#6366f1',
    gradient: 'from-indigo-500 to-violet-600',
    badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200/60',
    iconName: 'building',
  },
  {
    id: 'security',
    title: 'Personal de Seguridad',
    tag: 'CASETA & CONTROL',
    desc: 'Validación de accesos y bitácora de visitas',
    color: '#0f766e',
    gradient: 'from-emerald-600 to-teal-800',
    badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200/60',
    iconName: 'shield',
  },
]

export function RoleCards({ onSelectRole, glass = false }: RoleCardsProps) {
  const [hovered, setHovered] = useState<UserRole | null>(null)

  return (
    <div className="space-y-3">
      {ROLES.map(r => {
        const on = hovered === r.id
        return (
          <button
            key={r.id}
            type="button"
            onClick={() => onSelectRole(r.id)}
            onMouseEnter={() => setHovered(r.id)}
            onMouseLeave={() => setHovered(null)}
            className="w-full text-left relative overflow-hidden rounded-2xl focus:outline-none cursor-pointer group"
            style={{
              border: glass
                ? `1px solid ${on ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.22)'}`
                : `1px solid ${on ? r.color + '45' : 'rgba(126, 176, 166, 0.35)'}`,
              backgroundColor: glass
                ? on
                  ? 'rgba(255,255,255,0.26)'
                  : 'rgba(255,255,255,0.14)'
                : on
                ? r.color + '0c'
                : '#ffffff',
              backdropFilter: glass ? 'blur(18px)' : 'none',
              WebkitBackdropFilter: glass ? 'blur(18px)' : 'none',
              boxShadow: on
                ? glass
                  ? '0 8px 28px rgba(0, 51, 51, 0.16), 0 2px 8px rgba(0,0,0,0.06)'
                  : `0 12px 32px -4px ${r.color}25, 0 4px 12px rgba(0,0,0,0.04)`
                : glass
                ? '0 2px 10px rgba(0,0,0,0.1)'
                : '0 1px 4px rgba(0, 51, 51, 0.04)',
              transform: on ? 'translateY(-2px)' : 'translateY(0)',
              transition: 'all 0.22s ease',
            }}
          >
            {/* Left accent bar */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: '14%',
                bottom: '14%',
                width: 3.5,
                borderRadius: '0 3px 3px 0',
                backgroundColor: glass ? 'rgba(255,255,255,0.85)' : r.color,
                opacity: on ? 1 : 0,
                transform: on ? 'scaleY(1)' : 'scaleY(0.3)',
                transition: 'all 0.22s ease',
              }}
            />

            <div className="flex items-center gap-4 px-5 py-4">
              {/* Icon container */}
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200"
                style={{
                  backgroundColor: glass
                    ? 'rgba(255,255,255,0.18)'
                    : on
                    ? r.color + '22'
                    : r.color + '14',
                  color: glass ? '#ffffff' : r.color,
                  boxShadow: on ? '0 0 0 4px rgba(255,255,255,0.1)' : 'none',
                  border: glass ? '1px solid rgba(255,255,255,0.15)' : 'none',
                }}
              >
                <Ico n={r.iconName} c="w-6 h-6" />
              </div>

              {/* Text Info */}
              <div className="flex-1 min-w-0">
                {!glass && (
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider border ${r.badgeBg}`}>
                      {r.tag}
                    </span>
                  </div>
                )}
                <p
                  className="font-display font-semibold text-[15px] leading-snug whitespace-nowrap truncate"
                  style={{ color: glass ? '#ffffff' : '#003333' }}
                >
                  {r.title}
                </p>
                <p
                  className="text-xs mt-0.5 leading-relaxed whitespace-nowrap truncate"
                  style={{ color: glass ? 'rgba(255,255,255,0.65)' : '#64748b' }}
                >
                  {r.desc}
                </p>
              </div>

              {/* Action Chevron */}
              <div
                className="flex-shrink-0 transition-all duration-200"
                style={{
                  color: glass
                    ? on
                      ? '#ffffff'
                      : 'rgba(255,255,255,0.4)'
                    : on
                    ? r.color
                    : '#94a3b8',
                  transform: on ? 'translateX(2px)' : 'translateX(0)',
                }}
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
