import type { Module, NavItem } from '@/types'

interface BottomNavProps {
  active: Module
  onSelect: (m: Module) => void
  navItems: NavItem[]
  navActive: (id: Module) => boolean
}

export function BottomNav({
  onSelect,
  navItems,
  navActive,
}: BottomNavProps) {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-2xl border-t border-teal-950/[0.08] shadow-[0_-4px_20px_rgba(0,51,51,0.06)]"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="flex items-center justify-around px-2 py-2 gap-1 max-w-lg mx-auto">
        {navItems.map(item => {
          const isActive = navActive(item.id)
          const displayLabel = item.shortLabel || item.label
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`relative flex-1 flex flex-col items-center justify-center py-1.5 px-1 h-12 gap-1 rounded-2xl transition-all duration-200 focus:outline-none min-w-0 cursor-pointer select-none ${
                isActive
                  ? 'bg-teal-500/10 text-teal-800 font-bold border border-teal-500/20 shadow-xs'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <span className={`transition-transform duration-200 shrink-0 ${isActive ? 'scale-110 text-[#008080]' : ''}`}>
                {item.icon}
              </span>
              <span
                className={`text-[10px] leading-tight whitespace-nowrap truncate max-w-full ${
                  isActive ? 'font-extrabold text-[#008080]' : 'font-medium text-slate-500'
                }`}
              >
                {displayLabel}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
export default BottomNav


