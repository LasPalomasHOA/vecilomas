interface TabItem<T extends string> {
  id: T
  label: string
  shortLabel?: string
  badge?: number | string
}

interface SubTabsProps<T extends string> {
  tabs: TabItem<T>[]
  active: T
  onChange: (tab: T) => void
}

export function SubTabs<T extends string>({ tabs, active, onChange }: SubTabsProps<T>) {
  return (
    <div className="flex flex-nowrap gap-1 p-1 rounded-xl mb-6 w-full sm:w-fit overflow-x-auto hide-scrollbar bg-slate-100/90 border border-slate-200/60 shadow-xs relative z-10">
      {tabs.map(t => {
        const isSelected = active === t.id
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={`whitespace-nowrap shrink-0 px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 relative flex items-center gap-2 cursor-pointer focus:outline-none ${
              isSelected
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            {t.shortLabel ? (
              <>
                <span className="sm:hidden whitespace-nowrap">{t.shortLabel}</span>
                <span className="hidden sm:inline whitespace-nowrap">{t.label}</span>
              </>
            ) : (
              <span className="whitespace-nowrap">{t.label}</span>
            )}
            {t.badge !== undefined && (
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold whitespace-nowrap shrink-0 ${
                  isSelected ? 'bg-teal-50 text-[#008080] border border-teal-100' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {t.badge}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
export default SubTabs


