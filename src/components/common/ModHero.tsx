import type { ReactNode } from 'react'
import loginImg1 from '@/imports/image-1.png'

interface ModHeroProps {
  icon: ReactNode
  title: string
  desc: string
  bg?: string
  badge?: string
  action?: ReactNode
  stats?: { label: string; value: string }[]
}

export function ModHero({ icon, title, desc, bg, badge, action, stats }: ModHeroProps) {
  const background =
    bg ??
    `linear-gradient(135deg, rgba(0, 51, 51, 0.95) 0%, rgba(0, 76, 76, 0.90) 50%, rgba(15, 23, 42, 0.92) 100%)`

  return (
    <div className="rounded-2xl mb-6 relative overflow-hidden shadow-md border border-teal-900/30">
      {/* Background coastal photo layer */}
      <div className="absolute inset-0 scale-105 pointer-events-none overflow-hidden select-none">
        <img
          src={loginImg1}
          alt="Hero Atmosphere"
          className="w-full h-full object-cover filter blur-[5px] opacity-35"
        />
      </div>

      {/* Luxury Dark Scrim */}
      <div className="absolute inset-0 pointer-events-none" style={{ background }} />

      {/* Ambient Teal/Gold Highlight Orbs */}
      <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-teal-400/20 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-amber-400/10 blur-xl pointer-events-none" />

      <div className="relative z-10 p-6 sm:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="flex items-start sm:items-center gap-4 min-w-0 flex-1">
          <div className="w-12 h-12 rounded-2xl flex shrink-0 items-center justify-center text-white bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-md border border-white/25 shadow-[0_4px_16px_rgba(0,0,0,0.2)]">
            {icon}
          </div>

          <div className="min-w-0 flex-1">
            {badge && (
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-widest font-bold text-teal-200 bg-teal-950/60 border border-teal-400/30 backdrop-blur-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-300 animate-pulse" />
                  {badge}
                </span>
              </div>
            )}

            <h2 className="text-xl sm:text-2xl font-display font-bold text-white tracking-tight leading-tight drop-shadow-xs">
              {title}
            </h2>
            <p className="text-xs sm:text-sm mt-1 text-slate-200 font-normal max-w-2xl leading-relaxed">
              {desc}
            </p>
          </div>
        </div>

        <div className="flex flex-row items-center gap-3 shrink-0 overflow-x-auto hide-scrollbar w-full sm:w-auto">
          {stats && stats.length > 0 && (
            <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-black/20 border border-white/15 backdrop-blur-md shrink-0 w-full sm:w-auto justify-around sm:justify-start shadow-inner">
              {stats.map((st, i) => (
                <div key={i} className="px-3.5 py-1.5 text-center whitespace-nowrap">
                  <p className="text-[10px] font-mono text-teal-300 uppercase font-semibold tracking-wider whitespace-nowrap">{st.label}</p>
                  <p className="text-xs sm:text-sm font-bold text-white font-mono whitespace-nowrap mt-0.5">{st.value}</p>
                </div>
              ))}
            </div>
          )}
          {action && <div className="shrink-0">{action}</div>}
        </div>
      </div>

      {/* Shimmer Accent Line at Bottom */}
      <div className="h-[2px] w-full shimmer-line opacity-80" />
    </div>
  )
}
export default ModHero


