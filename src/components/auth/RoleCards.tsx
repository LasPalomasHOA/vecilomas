import { useState } from 'react'
import type { AuthUser, UserRole } from '@/types'
import { BRAND_COLORS } from '@/types'
import Ico from '@/components/common/Icons'

const ROLE_CFG: Record<UserRole, { icon: typeof Ico; title: string; desc: string; color: string; iconName: any }> = {
  admin: {
    icon: Ico,
    iconName: 'building',
    title: 'Administración HOA',
    desc: 'Gestión global, reportes y configuración',
    color: '#6366f1',
  },
  resident: {
    icon: Ico,
    iconName: 'home',
    title: 'Residente / Inquilino',
    desc: 'Autoservicio, reservas y consultas personales',
    color: BRAND_COLORS.primary,
  },
  security: {
    icon: Ico,
    iconName: 'shield',
    title: 'Personal de Seguridad',
    desc: 'Validación de accesos y bitácora de visitas',
    color: '#004c4c',
  },
}

export function RoleCards({
  onLogin,
  users,
  glass = false,
}: {
  onLogin: (u: AuthUser) => void
  users: Record<UserRole, AuthUser>
  glass?: boolean
}) {
  const [hovered, setHovered] = useState<UserRole | null>(null)
  const order: UserRole[] = ['resident', 'admin', 'security']

  return (
    <div className="space-y-3">
      {order.map(r => {
        const c = ROLE_CFG[r]
        const on = hovered === r
        return (
          <button
            key={r}
            onClick={() => onLogin(users[r])}
            onMouseEnter={() => setHovered(r)}
            onMouseLeave={() => setHovered(null)}
            className="w-full text-left relative overflow-hidden rounded-2xl focus:outline-none cursor-pointer group"
            style={{
              border: glass
                ? `1px solid ${on ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.22)'}`
                : `1px solid ${on ? c.color + '45' : 'rgba(126, 176, 166, 0.35)'}`,
              backgroundColor: glass
                ? on
                  ? 'rgba(255,255,255,0.26)'
                  : 'rgba(255,255,255,0.14)'
                : on
                ? c.color + '0c'
                : '#fff',
              backdropFilter: glass ? 'blur(18px)' : 'none',
              WebkitBackdropFilter: glass ? 'blur(18px)' : 'none',
              boxShadow: on
                ? `0 8px 28px rgba(0, 51, 51, 0.16), 0 2px 8px rgba(0,0,0,0.06)`
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
                backgroundColor: glass ? 'rgba(255,255,255,0.8)' : c.color,
                opacity: on ? 1 : 0,
                transform: on ? 'scaleY(1)' : 'scaleY(0.3)',
                transition: 'all 0.22s ease',
              }}
            />

            <div className="flex items-center gap-4 px-5 py-4">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200"
                style={{
                  backgroundColor: glass
                    ? 'rgba(255,255,255,0.18)'
                    : on
                    ? c.color + '22'
                    : c.color + '14',
                  color: glass ? '#fff' : c.color,
                  boxShadow: on ? `0 0 0 4px rgba(255,255,255,0.1)` : 'none',
                }}
              >
                <Ico n={c.iconName} c="w-6 h-6" />
              </div>

              <div className="flex-1 min-w-0">
                <p
                  className="font-display font-semibold text-[15px] leading-snug whitespace-nowrap truncate"
                  style={{ color: glass ? '#fff' : '#003333' }}
                >
                  {c.title}
                </p>
                <p
                  className="text-xs mt-0.5 leading-relaxed whitespace-nowrap truncate"
                  style={{ color: glass ? 'rgba(255,255,255,0.65)' : '#64748b' }}
                >
                  {c.desc}
                </p>
              </div>

              <div
                className="flex-shrink-0 transition-all duration-200"
                style={{
                  color: glass
                    ? on
                      ? '#fff'
                      : 'rgba(255,255,255,0.4)'
                    : on
                    ? c.color
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
