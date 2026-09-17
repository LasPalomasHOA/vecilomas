import type { ReactNode } from 'react'
import type { AuthUser, Module } from '@/types'
import { useData } from '@/context/DataContext'
import GCard from '@/components/common/Card'
import Ico from '@/components/common/Icons'
import loginImg0 from '@/imports/image.png'

interface AdminDashboardProps {
  user: AuthUser
  onNav: (m: Module) => void
}

export function AdminDashboard({ user, onNav }: AdminDashboardProps) {
  const { residents, visits, bookings, fees, tickets } = useData()

  const inFacilityCount = visits.filter(v => v.status === 'En Instalaciones').length
  const overdueFees = fees.filter(f => f.status === 'Vencida')
  const overdueTotal = overdueFees.reduce((acc, f) => acc + f.amount, 0)
  const pendingBookings = bookings.filter(b => b.status === 'Pendiente').length
  const openTickets = tickets.filter(t => t.status !== 'Resuelto').length

  const stats = [
    {
      label: 'Residentes Activos',
      value: String(residents.length),
      sub: `${residents.filter(r => r.type === 'Propietario').length} prop. · ${residents.filter(r => r.type === 'Arrendatario').length} inq.`,
      badge: 'Directorio',
      badgeStyle: 'bg-teal-50 text-teal-800 border-teal-200/80',
      icon: <Ico n="users" c="w-5 h-5 text-teal-700" />,
      iconBoxStyle: 'bg-gradient-to-br from-teal-500/20 to-teal-700/10 border-teal-500/25 text-teal-800 shadow-[0_2px_8px_rgba(0,128,128,0.15)]',
      accentColor: '#008080',
      onClick: () => onNav('hoa'),
    },
    {
      label: 'En Instalaciones',
      value: String(inFacilityCount),
      sub: 'Visitas y proveedores activos',
      badge: 'Caseta Live',
      badgeStyle: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
      icon: <Ico n="shield" c="w-5 h-5 text-emerald-700" />,
      iconBoxStyle: 'bg-gradient-to-br from-emerald-500/20 to-emerald-700/10 border-emerald-500/25 text-emerald-800 shadow-[0_2px_8px_rgba(16,185,129,0.15)]',
      accentColor: '#059669',
      onClick: () => onNav('access'),
    },
    {
      label: 'Reservas Pendientes',
      value: String(pendingBookings),
      sub: `${bookings.length} reservaciones registradas`,
      badge: pendingBookings > 0 ? 'Por Aprobar' : 'Al día',
      badgeStyle: pendingBookings > 0 ? 'bg-indigo-50 text-indigo-800 border-indigo-200/80' : 'bg-slate-100 text-slate-600 border-slate-200',
      icon: <Ico n="calendar" c="w-5 h-5 text-indigo-700" />,
      iconBoxStyle: 'bg-gradient-to-br from-indigo-500/20 to-indigo-700/10 border-indigo-500/25 text-indigo-800 shadow-[0_2px_8px_rgba(99,102,241,0.15)]',
      accentColor: '#6366f1',
      onClick: () => onNav('amenities'),
    },
    {
      label: 'Cuentas en Mora',
      value: String(overdueFees.length),
      sub: `$${overdueTotal.toLocaleString()} MXN saldo`,
      badge: overdueFees.length > 0 ? 'Cobro Req.' : 'Al corriente',
      badgeStyle: overdueFees.length > 0 ? 'bg-red-50 text-red-800 border-red-200/80' : 'bg-slate-100 text-slate-600 border-slate-200',
      icon: <Ico n="dollar" c="w-5 h-5 text-red-700" />,
      iconBoxStyle: 'bg-gradient-to-br from-red-500/20 to-rose-700/10 border-red-500/25 text-red-800 shadow-[0_2px_8px_rgba(239,68,68,0.15)]',
      accentColor: '#dc2626',
      onClick: () => onNav('finance'),
    },
  ]

  const quickActions: { label: string; m: Module; icon: ReactNode; desc: string; iconBoxStyle: string; accentColor: string }[] = [
    {
      label: 'Control de Accesos',
      m: 'access',
      icon: <Ico n="shield" c="w-6 h-6 text-[#008080]" />,
      desc: 'Pases QR y validación en caseta',
      iconBoxStyle: 'bg-gradient-to-br from-teal-500/15 to-teal-700/10 border-teal-500/20 text-teal-800 shadow-xs',
      accentColor: '#008080',
    },
    {
      label: 'Gestionar Reservas',
      m: 'amenities',
      icon: <Ico n="calendar" c="w-6 h-6 text-indigo-600" />,
      desc: `${pendingBookings} solicitudes pendientes`,
      iconBoxStyle: 'bg-gradient-to-br from-indigo-500/15 to-indigo-700/10 border-indigo-500/20 text-indigo-800 shadow-xs',
      accentColor: '#6366f1',
    },
    {
      label: 'Publicar Aviso HOA',
      m: 'hoa-board',
      icon: <Ico n="building" c="w-6 h-6 text-emerald-600" />,
      desc: 'Comunicados y circulares',
      iconBoxStyle: 'bg-gradient-to-br from-emerald-500/15 to-emerald-700/10 border-emerald-500/20 text-emerald-800 shadow-xs',
      accentColor: '#10b981',
    },
    {
      label: 'Tickets de Mantenimiento',
      m: 'finance-tickets',
      icon: <Ico n="tool" c="w-6 h-6 text-amber-600" />,
      desc: `${openTickets} casos en atención`,
      iconBoxStyle: 'bg-gradient-to-br from-amber-400/15 to-amber-600/10 border-amber-500/20 text-amber-800 shadow-xs',
      accentColor: '#f59e0b',
    },
  ]

  const firstName = user.name.split(' ')[0]

  return (
    <div className="space-y-6">
      {/* Modern Cinematic Admin Hero */}
      <div
        className="rounded-2xl relative overflow-hidden shadow-md border border-teal-900/30"
        style={{
          background:
            'linear-gradient(135deg, rgba(0, 51, 51, 0.96) 0%, rgba(0, 76, 76, 0.90) 50%, rgba(15, 23, 42, 0.94) 100%)',
        }}
      >
        {/* Coastal Background Image */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
          <img
            src={loginImg0}
            alt="Resort Aerial"
            className="w-full h-full object-cover filter blur-[5px] opacity-35"
          />
        </div>

        {/* Ambient Teal/Gold Highlight Orbs */}
        <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-teal-400/20 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-amber-400/10 blur-xl pointer-events-none" />

        <div className="relative z-10 p-4 sm:p-7 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1 sm:mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono uppercase tracking-widest font-bold text-teal-200 bg-teal-950/60 border border-teal-400/30 backdrop-blur-md">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-300 animate-pulse" />
                Administración HOA & Gobernanza
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-extrabold text-white tracking-tight leading-tight drop-shadow-xs truncate">
              Bienvenido, {firstName}
            </h1>
            <p className="text-xs sm:text-sm mt-0.5 sm:mt-1 text-slate-200 font-normal max-w-xl leading-relaxed">
              Panel general de control administrativo de Las Palomas Resort & Residences.
            </p>

            <div className="flex items-center gap-2 mt-3 sm:mt-4 flex-wrap">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 sm:py-1.5 rounded-xl bg-white/10 border border-white/20 backdrop-blur-md text-white text-[11px] sm:text-xs font-semibold whitespace-nowrap shadow-xs">
                <Ico n="shield" c="w-3.5 h-3.5 text-teal-300" />
                <span>Condominio: <strong className="font-extrabold text-white">Torre Vista Mar (48 Deptos)</strong></span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 sm:py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/30 backdrop-blur-md text-emerald-200 text-[11px] sm:text-xs font-bold whitespace-nowrap shadow-xs">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-300 animate-pulse" />
                Sistema Operativo 100%
              </div>
            </div>
          </div>

          <div className="hidden md:flex flex-col gap-3 shrink-0">
            <div className="p-4 rounded-2xl bg-black/25 border border-white/20 backdrop-blur-md text-center min-w-[140px] shadow-inner">
              <p className="text-[10px] font-mono text-teal-300 uppercase font-semibold tracking-wider">Tickets Activos</p>
              <p className="text-2xl sm:text-3xl font-display font-extrabold text-white mt-0.5 font-mono">
                {openTickets}
              </p>
              <p className="text-[10px] text-slate-300 mt-0.5">En resolución</p>
            </div>
          </div>
        </div>

        {/* Bottom Shimmer Line */}
        <div className="h-[2px] w-full shimmer-line opacity-80" />
      </div>

      {/* Modern Luxury KPI Grid (2 cols on mobile, 4 cols on desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {stats.map((s, idx) => (
          <div
            key={idx}
            onClick={s.onClick}
            className="p-3 sm:p-5 rounded-2xl bg-white border border-teal-950/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.95),0_1px_3px_rgba(0,51,51,0.03),0_6px_20px_rgba(0,51,51,0.04)] hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_12px_28px_rgba(0,51,51,0.08)] hover:border-teal-500/30 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group flex flex-col justify-between relative overflow-hidden active:scale-[0.98]"
          >
            {/* Left Accent Glow Bar */}
            <div
              className="absolute left-0 top-2 sm:top-3 bottom-2 sm:bottom-3 w-[3px] sm:w-[3.5px] rounded-r-full transition-all duration-200 opacity-0 group-hover:opacity-100 group-hover:scale-y-100 scale-y-50"
              style={{ backgroundColor: s.accentColor }}
            />

            <div>
              <div className="flex items-center justify-between gap-1 mb-2 sm:mb-3">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105 ${s.iconBoxStyle}`}>
                  {s.icon}
                </div>
                <span className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap shrink-0 shadow-2xs max-w-[85px] sm:max-w-none truncate ${s.badgeStyle}`}>
                  {s.badge}
                </span>
              </div>

              <p className="text-[11px] sm:text-xs font-semibold text-slate-500 truncate leading-tight">
                {s.label}
              </p>
              <p className="text-lg sm:text-2xl lg:text-3xl font-display font-extrabold text-slate-900 mt-0.5 tracking-tight truncate leading-tight">
                {s.value}
              </p>
            </div>

            <div className="mt-2.5 sm:mt-3 pt-2 sm:pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] sm:text-xs text-slate-400 group-hover:text-[#008080] transition-colors">
              <span className="font-medium truncate">{s.sub}</span>
              <span className="font-bold group-hover:translate-x-1 transition-transform shrink-0 ml-1">→</span>
            </div>
          </div>
        ))}
      </div>

      {/* Admin Modules & Management Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Activity Feed */}
        <GCard className="lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 pb-3 border-b border-teal-950/[0.06] gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#008080]" />
                <h3 className="font-display font-bold text-slate-900 text-base sm:text-lg leading-tight">
                  Actividad Operativa Reciente
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Ingresos de caseta y tickets registrados</p>
            </div>
            <span className="text-xs font-mono text-[#008080] font-bold bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100 whitespace-nowrap self-start sm:self-auto shrink-0">
              ● En tiempo real
            </span>
          </div>

          <div className="space-y-2.5">
            {visits.slice(0, 3).map(v => (
              <div
                key={`vis-${v.id}`}
                className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/70 flex items-center justify-between gap-3 hover:bg-white hover:border-teal-200 hover:shadow-xs transition-all"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      v.status === 'En Instalaciones' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900 truncate">
                      {v.visitor} <span className="text-xs font-normal text-slate-500">— {v.type || 'Visita'} (U: {v.unit})</span>
                    </p>
                    <p className="text-xs text-slate-500 font-mono mt-0.5 truncate">
                      {v.status === 'En Instalaciones' ? '● En instalaciones' : `Salida a las ${v.exit} hrs`}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs whitespace-nowrap shrink-0">
                  {v.entry} hrs
                </span>
              </div>
            ))}

            {tickets.slice(0, 2).map(t => (
              <div
                key={`tkt-${t.id}`}
                className="p-3.5 rounded-2xl bg-amber-50/40 border border-amber-200/60 flex items-center justify-between gap-3 hover:bg-white hover:shadow-xs transition-all"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0 bg-amber-500" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900 truncate">
                      Ticket {t.id} ({t.priority}): <span className="text-xs font-normal text-slate-700">{t.issue}</span>
                    </p>
                    <p className="text-xs text-slate-500 font-mono mt-0.5 truncate">
                      📍 {t.location} · {t.reporter}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-amber-800 bg-amber-100/70 px-2.5 py-1 rounded-lg border border-amber-200 whitespace-nowrap shrink-0">
                  {t.status}
                </span>
              </div>
            ))}
          </div>
        </GCard>

        {/* Quick Operations Actions */}
        <GCard>
          <div className="mb-4 pb-3 border-b border-teal-950/[0.06]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
              <h3 className="font-display font-bold text-slate-900 text-base sm:text-lg leading-tight">
                Acciones Rápidas
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Atajos de administración</p>
          </div>

          <div className="space-y-2.5 sm:space-y-3">
            {quickActions.map(qa => (
              <button
                key={qa.label}
                onClick={() => onNav(qa.m)}
                className="w-full flex items-center gap-3.5 sm:gap-4 p-3.5 sm:p-4 rounded-2xl text-left transition-all duration-200 bg-slate-50/90 border border-slate-200/80 hover:bg-white hover:border-teal-500/40 hover:shadow-md focus:outline-none group cursor-pointer relative overflow-hidden active:scale-[0.99]"
              >
                {/* Left accent */}
                <div
                  className="absolute left-0 top-2.5 bottom-2.5 w-[3.5px] rounded-r-full transition-all duration-200 opacity-0 group-hover:opacity-100"
                  style={{ backgroundColor: qa.accentColor }}
                />

                <div
                  className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-transform duration-200 group-hover:scale-105 shadow-2xs ${qa.iconBoxStyle}`}
                >
                  {qa.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-[#008080] leading-snug whitespace-nowrap truncate">
                    {qa.label}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 truncate leading-tight font-normal">
                    {qa.desc}
                  </p>
                </div>
                <Ico
                  n="chevron"
                  c="w-5 h-5 text-slate-400 group-hover:text-[#008080] group-hover:translate-x-1.5 transition-all shrink-0"
                />
              </button>
            ))}
          </div>
        </GCard>
      </div>
    </div>
  )
}
export default AdminDashboard
