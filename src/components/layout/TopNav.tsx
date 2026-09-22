import type { AuthUser, Module, NavItem, UserRole } from '@/types'
import { BRAND_COLORS } from '@/types'
import Ico from '@/components/common/Icons'
import VeciLomasLogo from '@/components/common/VeciLomasLogo'

const ROLE_LABEL: Record<UserRole, string> = {
  admin: 'Administración',
  resident: 'Residente',
  security: 'Seguridad',
}

interface TopNavProps {
  active: Module
  onSelect: (m: Module) => void
  user: AuthUser
  onLogout: () => void
  navItems: NavItem[]
  navActive: (id: Module) => boolean
}

export function TopNav({
  onSelect,
  user,
  onLogout,
  navItems,
  navActive,
}: TopNavProps) {
  const homeModule = navItems[0]?.id ?? 'dashboard'

  return (
    <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-xl border-b border-teal-950/[0.08] shadow-[0_4px_24px_-4px_rgba(0,51,51,0.06)] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16 sm:h-18 gap-4">
        {/* Brand Logo */}
        <div
          className="flex items-center gap-3 flex-shrink-0 cursor-pointer group select-none"
          onClick={() => onSelect(homeModule)}
        >
          <VeciLomasLogo className="w-10 h-10 group-hover:scale-105 transition-transform duration-300" rounded="rounded-2xl" />
          <div>
            <div className="flex items-center gap-1.5">
              <p className="font-display font-extrabold text-slate-900 text-base sm:text-lg leading-none tracking-tight group-hover:text-[#008080] transition-colors">
                Las Palomas
              </p>
              <span className="w-1.5 h-1.5 rounded-full bg-[#008080] animate-pulse" />
            </div>
            <p className="text-[10px] font-mono font-semibold text-teal-800/70 uppercase tracking-widest mt-0.5 flex items-center gap-1">
              <span>RESORT & RESIDENCES</span>
            </p>
          </div>
        </div>

        {/* Desktop Nav Items */}
        <nav className="hidden md:flex items-center gap-1 p-1 bg-slate-100/80 border border-teal-950/[0.06] rounded-2xl backdrop-blur-md">
          {navItems.map(item => {
            const isActive = navActive(item.id)
            return (
              <button
                key={item.id}
                onClick={() => onSelect(item.id)}
                className={`relative flex items-center justify-center gap-2 px-3 xl:px-3.5 py-2 rounded-xl text-xs xl:text-sm font-medium whitespace-nowrap transition-all duration-200 focus:outline-none cursor-pointer shrink-0 select-none ${
                  isActive
                    ? 'bg-white text-teal-950 shadow-[0_2px_8px_rgba(0,51,51,0.08)] font-bold border border-teal-950/[0.05]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <span className={`transition-colors shrink-0 ${isActive ? 'text-[#008080]' : 'text-slate-400'}`}>
                  {item.icon}
                </span>
                <span className="hidden xl:inline">{item.label}</span>
                <span className="xl:hidden">{item.shortLabel || item.label}</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#008080] shrink-0 ml-0.5" />
                )}
              </button>
            )
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3.5 pr-1.5 sm:pr-2 py-1 sm:py-1.5 rounded-2xl bg-slate-100/80 border border-teal-950/[0.06] shadow-xs">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-900 leading-tight">
                {user.name}
              </p>
              <div className="flex items-center justify-end gap-1.5 mt-0.5">
                <span className="text-[10px] font-semibold text-slate-500">
                  {ROLE_LABEL[user.role]}
                </span>
                {user.unit && (
                  <span className="text-[10px] font-mono font-bold text-[#008080] bg-teal-50 px-1.5 py-0.2 rounded-md border border-teal-200/80 shadow-2xs">
                    {user.unit}
                  </span>
                )}
              </div>
            </div>

            {user.unit && (
              <span className="sm:hidden text-[10px] font-mono font-bold text-[#008080] bg-teal-50 px-1.5 py-0.5 rounded-md border border-teal-200/80">
                {user.unit}
              </span>
            )}

            <div
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-[11px] sm:text-xs font-black text-white shadow-[0_2px_8px_rgba(0,128,128,0.25)] border border-white/20 shrink-0"
              style={{
                background: `linear-gradient(135deg, ${BRAND_COLORS.primary}, ${BRAND_COLORS.primaryDark})`,
              }}
            >
              {user.initials}
            </div>
          </div>

          <button
            onClick={onLogout}
            title="Cerrar sesión"
            className="p-2 sm:p-2.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50/80 transition-all cursor-pointer border border-transparent hover:border-red-100"
          >
            <Ico n="logout" c="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  )
}
export default TopNav


