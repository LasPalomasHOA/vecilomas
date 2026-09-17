import type { AuthUser, Module } from '@/types'
import { useData } from '@/context/DataContext'
import GCard from '@/components/common/Card'
import Badge from '@/components/common/Badge'
import Ico from '@/components/common/Icons'
import loginImg0 from '@/imports/image.png'

interface ResidentDashboardProps {
  user: AuthUser
  onNav: (m: Module) => void
}

export function ResidentDashboard({ user, onNav }: ResidentDashboardProps) {
  const { fees, bookings, tickets, notices, accessPasses } = useData()

  const myFee = fees.find(f => f.unit === user.unit)
  const myBookings = bookings.filter(
    b =>
      (b.unit === user.unit ||
        b.resident.toLowerCase().includes(user.name.split(' ')[0].toLowerCase())) &&
      b.status !== 'Cancelada'
  )
  const myTickets = tickets.filter(
    t =>
      t.reporter.toLowerCase().includes(user.name.split(' ')[0].toLowerCase()) ||
      t.unit === user.unit
  )
  const myPasses = accessPasses.filter(
    p =>
      (p.unit === user.unit ||
        p.host.toLowerCase().includes(user.name.split(' ')[0].toLowerCase())) &&
      p.status === 'Activo'
  )
  const firstName = user.name.split(' ')[0]

  const stats = [
    {
      label: 'Estado de Cuenta',
      value: myFee?.status === 'Pagada' ? 'Al Corriente' : 'Adeudo',
      sub: myFee?.status === 'Pagada' ? 'Cuota liquidada' : `$${myFee?.amount.toLocaleString()} pendiente`,
      badge: myFee?.status === 'Pagada' ? 'Sin Adeudo' : 'Vencido',
      badgeStyle: myFee?.status === 'Pagada' ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80' : 'bg-red-50 text-red-800 border-red-200/80',
      icon: <Ico n="dollar" c="w-4 h-4 sm:w-5 sm:h-5 text-emerald-700" />,
      iconBoxStyle: 'bg-gradient-to-br from-emerald-500/20 to-emerald-700/10 border-emerald-500/25 text-emerald-800 shadow-[0_2px_8px_rgba(16,185,129,0.15)]',
      accentColor: '#059669',
      onClick: () => onNav('myaccount'),
    },
    {
      label: 'Pases QR Activos',
      value: String(myPasses.length),
      sub: myPasses.length > 0 ? `${myPasses[0].visitor}` : 'Sin visitas activas',
      badge: myPasses.length > 0 ? 'Activo' : 'Generar',
      badgeStyle: myPasses.length > 0 ? 'bg-teal-50 text-teal-800 border-teal-200/80' : 'bg-slate-100 text-slate-600 border-slate-200',
      icon: <Ico n="qr" c="w-4 h-4 sm:w-5 sm:h-5 text-teal-700" />,
      iconBoxStyle: 'bg-gradient-to-br from-teal-500/20 to-teal-700/10 border-teal-500/25 text-teal-800 shadow-[0_2px_8px_rgba(0,128,128,0.15)]',
      accentColor: '#008080',
      onClick: () => onNav('qr'),
    },
    {
      label: 'Mis Reservaciones',
      value: String(myBookings.length),
      sub: myBookings.length > 0 ? `${myBookings[0]?.amenity}` : 'Sin reservas',
      badge: myBookings.length > 0 ? 'Agendada' : 'Disponible',
      badgeStyle: myBookings.length > 0 ? 'bg-indigo-50 text-indigo-800 border-indigo-200/80' : 'bg-slate-100 text-slate-600 border-slate-200',
      icon: <Ico n="calendar" c="w-4 h-4 sm:w-5 sm:h-5 text-indigo-700" />,
      iconBoxStyle: 'bg-gradient-to-br from-indigo-500/20 to-indigo-700/10 border-indigo-500/25 text-indigo-800 shadow-[0_2px_8px_rgba(99,102,241,0.15)]',
      accentColor: '#6366f1',
      onClick: () => onNav('res-amenities'),
    },
    {
      label: 'Reportes de Falla',
      value: String(myTickets.filter(t => t.status !== 'Resuelto').length),
      sub: myTickets.length > 0 ? 'En atención' : 'Sin fallas',
      badge: myTickets.some(t => t.priority === 'Alta') ? 'Alta Prioridad' : 'Al día',
      badgeStyle: myTickets.some(t => t.priority === 'Alta') ? 'bg-amber-50 text-amber-800 border-amber-200/80' : 'bg-slate-100 text-slate-600 border-slate-200',
      icon: <Ico n="tool" c="w-4 h-4 sm:w-5 sm:h-5 text-amber-700" />,
      iconBoxStyle: 'bg-gradient-to-br from-amber-400/20 to-amber-600/10 border-amber-500/25 text-amber-800 shadow-[0_2px_8px_rgba(245,158,11,0.15)]',
      accentColor: '#d97706',
      onClick: () => onNav('myaccount-tickets'),
    },
  ]

  const quickActions = [
    {
      label: 'Generar Pase QR',
      m: 'qr' as Module,
      desc: 'Pases digitales para visitas',
      icon: <Ico n="qr" c="w-6 h-6 text-[#008080]" />,
      iconBoxStyle: 'bg-gradient-to-br from-teal-500/15 to-teal-700/10 border-teal-500/20 text-teal-800 shadow-xs',
      accentColor: '#008080',
    },
    {
      label: 'Reservar Amenidad',
      m: 'res-amenities' as Module,
      desc: 'Asadores, alberca y canchas',
      icon: <Ico n="calendar" c="w-6 h-6 text-indigo-600" />,
      iconBoxStyle: 'bg-gradient-to-br from-indigo-500/15 to-indigo-700/10 border-indigo-500/20 text-indigo-800 shadow-xs',
      accentColor: '#6366f1',
    },
    {
      label: 'Reportar Falla',
      m: 'myaccount-tickets' as Module,
      desc: 'Mantenimiento e incidencias',
      icon: <Ico n="tool" c="w-6 h-6 text-amber-600" />,
      iconBoxStyle: 'bg-gradient-to-br from-amber-400/15 to-amber-600/10 border-amber-500/20 text-amber-800 shadow-xs',
      accentColor: '#f59e0b',
    },
    {
      label: 'Mi Estado de Cuenta',
      m: 'myaccount' as Module,
      desc: 'Historial y datos de pago SPEI',
      icon: <Ico n="dollar" c="w-6 h-6 text-emerald-600" />,
      iconBoxStyle: 'bg-gradient-to-br from-emerald-500/15 to-emerald-700/10 border-emerald-500/20 text-emerald-800 shadow-xs',
      accentColor: '#10b981',
    },
  ]

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Modern Cinematic Hero Banner */}
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
            alt="Resort Balcony"
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
                Portal Residencial VIP
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-extrabold text-white tracking-tight leading-tight drop-shadow-xs truncate">
              Hola, {firstName}
            </h1>
            <p className="text-xs sm:text-sm mt-0.5 sm:mt-1 text-slate-200 font-normal max-w-xl leading-relaxed">
              Bienvenido a tu portal residencial. Gestiona accesos, amenidades y pagos al instante.
            </p>

            <div className="flex items-center gap-2 mt-3 sm:mt-4 flex-wrap">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 sm:py-1.5 rounded-xl bg-white/10 border border-white/20 backdrop-blur-md text-white text-[11px] sm:text-xs font-semibold whitespace-nowrap shadow-xs">
                <Ico n="home" c="w-3.5 h-3.5 text-teal-300" />
                <span>Unidad: <strong className="font-extrabold text-white">{user.unit || 'A-101'}</strong></span>
              </div>

              {myFee && (
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-bold backdrop-blur-md border whitespace-nowrap shadow-xs ${
                    myFee.status === 'Pagada'
                      ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30'
                      : 'bg-red-500/20 text-red-200 border-red-400/30'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
                      myFee.status === 'Pagada' ? 'bg-emerald-300' : 'bg-red-400'
                    }`}
                  />
                  Cuota: {myFee.status}
                </div>
              )}

              {/* Mobile Notice Counter Pill */}
              <button
                onClick={() => onNav('notices')}
                className="md:hidden inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-teal-500/20 border border-teal-400/30 backdrop-blur-md text-teal-200 text-[11px] font-bold whitespace-nowrap shadow-xs active:scale-95 transition-transform"
              >
                <Ico n="bell" c="w-3.5 h-3.5 text-teal-300" />
                <span>{notices.length} Avisos</span>
              </button>
            </div>
          </div>

          {/* Desktop Notice Box */}
          <div className="hidden md:flex flex-col gap-3 shrink-0">
            <div
              onClick={() => onNav('notices')}
              className="p-4 rounded-2xl bg-black/25 border border-white/20 backdrop-blur-md text-center min-w-[130px] shadow-inner cursor-pointer hover:bg-black/35 transition-colors"
            >
              <p className="text-[10px] font-mono text-teal-300 uppercase font-semibold tracking-wider">Comunicados</p>
              <p className="text-2xl sm:text-3xl font-display font-extrabold text-white mt-0.5 font-mono">
                {notices.length}
              </p>
              <p className="text-[10px] text-slate-300 mt-0.5">Vigentes hoy</p>
            </div>
          </div>
        </div>

        {/* Bottom shimmer line */}
        <div className="h-[2px] w-full shimmer-line opacity-80" />
      </div>

      {/* Symmetrical 2x2 KPI Cards on Mobile, 4 columns on Desktop */}
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

      {/* Main Grid: Notice Board + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* Notices Board */}
        <GCard className="lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3.5 sm:mb-4 pb-2.5 sm:pb-3 border-b border-teal-950/[0.06] gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#008080]" />
                <h3 className="font-display font-bold text-slate-900 text-base sm:text-lg leading-tight">
                  Tablón de Avisos y Comunicados
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Noticias oficiales de la administración del condominio</p>
            </div>
            <button
              onClick={() => onNav('notices')}
              className="text-xs font-bold text-[#008080] hover:text-[#004c4c] transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap self-start sm:self-auto shrink-0 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100 hover:bg-teal-100/60"
            >
              Ver todos ({notices.length}) →
            </button>
          </div>

          <div className="space-y-2.5">
            {notices.slice(0, 3).map(n => (
              <div
                key={n.id}
                onClick={() => onNav('notices')}
                className={`p-3 sm:p-3.5 rounded-2xl transition-all duration-200 cursor-pointer border ${
                  n.urgent
                    ? 'bg-gradient-to-r from-red-50/70 to-rose-50/40 border-red-200/70 hover:bg-white hover:shadow-xs'
                    : 'bg-slate-50/80 border-slate-200/70 hover:bg-white hover:border-teal-200 hover:shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1 flex-nowrap">
                  <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                    <Badge text={n.type} />
                    {n.urgent && (
                      <span className="text-[9px] sm:text-[10px] font-bold text-red-700 bg-red-100/90 border border-red-200 px-2 py-0.2 rounded-full whitespace-nowrap shrink-0 animate-pulse">
                        ¡Urgente!
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-mono font-medium text-slate-400 whitespace-nowrap shrink-0">{n.date}</span>
                </div>

                <h4 className="font-display font-bold text-slate-900 text-sm sm:text-base leading-snug">
                  {n.title}
                </h4>
                <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                  {n.content}
                </p>
              </div>
            ))}
          </div>
        </GCard>

        {/* Quick Actions (Modern Luxury Tiles) */}
        <GCard>
          <div className="mb-4 pb-3 border-b border-teal-950/[0.06]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              <h3 className="font-display font-bold text-slate-900 text-base sm:text-lg leading-tight">
                Autoservicio Rápido
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Acciones inmediatas para residentes</p>
          </div>

          <div className="space-y-2.5 sm:space-y-3">
            {quickActions.map(qa => (
              <button
                key={qa.label}
                onClick={() => onNav(qa.m)}
                className="w-full flex items-center gap-3.5 sm:gap-4 p-3.5 sm:p-4 rounded-2xl text-left transition-all duration-200 bg-slate-50/90 border border-slate-200/80 hover:bg-white hover:border-teal-500/40 hover:shadow-md focus:outline-none group cursor-pointer relative overflow-hidden active:scale-[0.99]"
              >
                {/* Micro left accent on hover */}
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
export default ResidentDashboard


