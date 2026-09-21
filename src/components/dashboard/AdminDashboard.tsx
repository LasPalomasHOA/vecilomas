import { useState, type ReactNode } from 'react'
import type { AuthUser, Module } from '@/types'
import type { Amenity } from '@/types/amenities'
import { useData } from '@/context/DataContext'
import GCard from '@/components/common/Card'
import Ico from '@/components/common/Icons'
import loginImg0 from '@/imports/image.png'
import AmenityFormModal from '@/modules/amenities/AmenityFormModal'

interface AdminDashboardProps {
  user: AuthUser
  onNav: (m: Module) => void
}

export function AdminDashboard({ user, onNav }: AdminDashboardProps) {
  const {
    residents,
    visits,
    bookings,
    fees,
    tickets,
    addAmenity,
    updateBookingStatus,
  } = useData()

  const [isAmenityModalOpen, setIsAmenityModalOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const inFacilityCount = visits.filter(v => v.status === 'En Instalaciones').length
  const overdueFees = fees.filter(f => f.status === 'Vencida')
  const overdueTotal = overdueFees.reduce((acc, f) => acc + f.amount, 0)
  const pendingBookingsList = bookings.filter(b => b.status === 'Pendiente')
  const openTickets = tickets.filter(t => t.status !== 'Resuelto').length

  function showToast(msg: string) {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  function handleSaveAmenity(data: Omit<Amenity, 'id'> | Amenity) {
    addAmenity(data)
    showToast(`¡Nueva amenidad "${data.name}" agregada con éxito!`)
  }

  function handleApproveBooking(id: number, name: string) {
    updateBookingStatus(id, 'Aprobada')
    showToast(`Reservación para "${name}" aprobada.`)
  }

  function handleRejectBooking(id: number, name: string) {
    updateBookingStatus(id, 'Rechazada')
    showToast(`Reservación para "${name}" rechazada.`)
  }

  const stats = [
    {
      label: 'Residentes Activos',
      value: String(residents.length),
      sub: `${residents.filter(r => r.type === 'Propietario').length} prop. · ${residents.filter(r => r.type === 'Arrendatario').length} inq.`,
      badge: 'Directorio',
      badgeStyle: 'bg-teal-50 text-teal-800 border-teal-200/80',
      icon: <Ico n="users" c="w-5 h-5 text-teal-700" />,
      iconBoxStyle: 'bg-teal-50 border-teal-200 text-teal-800 shadow-2xs',
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
      iconBoxStyle: 'bg-emerald-50 border-emerald-200 text-emerald-800 shadow-2xs',
      accentColor: '#059669',
      onClick: () => onNav('access'),
    },
    {
      label: 'Reservas Pendientes',
      value: String(pendingBookingsList.length),
      sub: `${bookings.length} reservaciones totales`,
      badge: pendingBookingsList.length > 0 ? `${pendingBookingsList.length} Por Aprobar` : 'Al día',
      badgeStyle: pendingBookingsList.length > 0 ? 'bg-indigo-50 text-indigo-800 border-indigo-200/80 font-bold' : 'bg-slate-100 text-slate-600 border-slate-200',
      icon: <Ico n="calendar" c="w-5 h-5 text-indigo-700" />,
      iconBoxStyle: 'bg-indigo-50 border-indigo-200 text-indigo-800 shadow-2xs',
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
      iconBoxStyle: 'bg-red-50 border-red-200 text-red-800 shadow-2xs',
      accentColor: '#dc2626',
      onClick: () => onNav('finance'),
    },
  ]

  const quickActions: { label: string; m?: Module; icon: ReactNode; desc: string; iconBoxStyle: string; accentColor: string; onClick?: () => void }[] = [
    {
      label: '+ Nueva Amenidad',
      icon: <Ico n="plus" c="w-5 h-5 text-teal-700" />,
      desc: 'Registrar nuevo espacio o alberca',
      iconBoxStyle: 'bg-teal-50 border-teal-200 text-teal-800',
      accentColor: '#008080',
      onClick: () => setIsAmenityModalOpen(true),
    },
    {
      label: 'Control de Accesos',
      m: 'access',
      icon: <Ico n="shield" c="w-5 h-5 text-teal-700" />,
      desc: 'Pases QR y validación en caseta',
      iconBoxStyle: 'bg-teal-50 border-teal-200 text-teal-800',
      accentColor: '#008080',
    },
    {
      label: 'Gestionar Reservas',
      m: 'amenities',
      icon: <Ico n="calendar" c="w-5 h-5 text-indigo-600" />,
      desc: `${pendingBookingsList.length} solicitudes pendientes`,
      iconBoxStyle: 'bg-indigo-50 border-indigo-200 text-indigo-800',
      accentColor: '#6366f1',
    },
    {
      label: 'Publicar Aviso HOA',
      m: 'hoa-board',
      icon: <Ico n="building" c="w-5 h-5 text-emerald-600" />,
      desc: 'Comunicados y circulares',
      iconBoxStyle: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      accentColor: '#10b981',
    },
    {
      label: 'Tickets de Mantenimiento',
      m: 'finance-tickets',
      icon: <Ico n="tool" c="w-5 h-5 text-amber-600" />,
      desc: `${openTickets} casos en atención`,
      iconBoxStyle: 'bg-amber-50 border-amber-200 text-amber-800',
      accentColor: '#f59e0b',
    },
  ]

  const firstName = user.name.split(' ')[0]

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 text-xs sm:text-sm font-bold flex items-center gap-3 animate-fade-in shadow-xs">
          <Ico n="check" c="w-5 h-5 text-teal-600" />
          {toastMessage}
        </div>
      )}

      {/* Modern Cinematic Admin Hero */}
      <div
        className="rounded-2xl relative overflow-hidden shadow-md border border-teal-900/30"
        style={{
          background:
            'linear-gradient(135deg, rgba(0, 51, 51, 0.97) 0%, rgba(0, 76, 76, 0.92) 50%, rgba(15, 23, 42, 0.96) 100%)',
        }}
      >
        {/* Coastal Background Image */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
          <img
            src={loginImg0}
            alt="Resort Aerial"
            className="w-full h-full object-cover filter blur-[4px] opacity-30"
          />
        </div>

        {/* Ambient Highlights */}
        <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-teal-400/20 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-amber-400/10 blur-xl pointer-events-none" />

        <div className="relative z-10 p-4 sm:p-7 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-semibold text-teal-200 bg-teal-950/70 border border-teal-400/30 backdrop-blur-md">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                Administración HOA & Gobernanza
              </span>

              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium text-slate-200 bg-white/10 border border-white/15 backdrop-blur-md">
                <Ico n="sun" c="w-3.5 h-3.5 text-amber-300" />
                <span>Puerto Peñasco · Operación Normal</span>
              </div>
            </div>

            <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-extrabold text-white tracking-tight leading-tight truncate">
              Bienvenido, {firstName}
            </h1>
            <p className="text-xs sm:text-sm mt-1 text-slate-200/90 font-normal max-w-xl leading-relaxed">
              Panel general de control operativo, finanzas, amenidades y accesos de Las Palomas Resort.
            </p>

            <div className="flex items-center gap-2.5 mt-3 sm:mt-4 flex-wrap">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 sm:py-1.5 rounded-xl bg-white/10 border border-white/20 backdrop-blur-md text-white text-[11px] sm:text-xs font-semibold whitespace-nowrap shadow-xs">
                <span>Condominio: <strong className="font-extrabold text-white">Condominio Residencial Las Palomas</strong></span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 sm:py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/30 backdrop-blur-md text-emerald-200 text-[11px] sm:text-xs font-bold whitespace-nowrap shadow-xs">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-300 animate-pulse" />
                Sistema Operativo 100%
              </div>

              <button
                onClick={() => setIsAmenityModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1 sm:py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-teal-950 font-bold text-[11px] sm:text-xs shadow-sm active:scale-95 transition-all cursor-pointer"
              >
                <Ico n="plus" c="w-3.5 h-3.5 text-teal-950" />
                <span>+ Nueva Amenidad</span>
              </button>
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
      </div>

      {/* Symmetrical KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {stats.map((s, idx) => (
          <div
            key={idx}
            onClick={s.onClick}
            className="p-3.5 sm:p-5 rounded-2xl bg-white border border-teal-950/[0.08] shadow-[0_1px_3px_rgba(0,51,51,0.03),0_6px_20px_rgba(0,51,51,0.04)] hover:shadow-[0_12px_28px_rgba(0,51,51,0.08)] hover:border-teal-500/30 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group flex flex-col justify-between relative overflow-hidden active:scale-[0.98]"
          >
            <div
              className="absolute left-0 top-3 bottom-3 w-[3.5px] rounded-r-full transition-all duration-200 opacity-0 group-hover:opacity-100"
              style={{ backgroundColor: s.accentColor }}
            />

            <div>
              <div className="flex items-center justify-between gap-1 mb-2.5 sm:mb-3">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105 ${s.iconBoxStyle}`}>
                  {s.icon}
                </div>
                <span className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap shrink-0 max-w-[85px] sm:max-w-none truncate ${s.badgeStyle}`}>
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

      {/* Main Grid: Pending Bookings Quick Approval + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Pending Bookings Quick Approval Widget */}
        <GCard className="lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 pb-3 border-b border-teal-950/[0.06] gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                <h3 className="font-display font-bold text-slate-900 text-base sm:text-lg leading-tight">
                  Aprobación Rápida de Reservaciones
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Solicitudes de residentes pendientes de confirmación</p>
            </div>
            <button
              onClick={() => onNav('amenities')}
              className="text-xs font-bold text-[#008080] hover:text-[#004c4c] transition-colors flex items-center gap-1 cursor-pointer bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100"
            >
              Ver todas ({bookings.length}) →
            </button>
          </div>

          {pendingBookingsList.length > 0 ? (
            <div className="space-y-3">
              {pendingBookingsList.slice(0, 3).map(b => (
                <div
                  key={b.id}
                  className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/90 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white hover:border-indigo-200 hover:shadow-xs transition-all"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-bold text-slate-900 text-sm sm:text-base">{b.amenity}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        Pendiente
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium inline-flex items-center gap-1.5 flex-wrap">
                      <span>Solicitante: <strong>{b.resident}</strong> (Unidad {b.unit})</span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1">
                        <Ico n="users" c="w-3 h-3 text-slate-400" />
                        {b.guests} personas
                      </span>
                    </p>
                    <p className="text-[11px] font-mono text-slate-500 mt-0.5 inline-flex items-center gap-1.5 flex-wrap">
                      <span className="inline-flex items-center gap-1">
                        <Ico n="calendar" c="w-3 h-3 text-slate-400" />
                        {b.date}
                      </span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1">
                        <Ico n="clock" c="w-3 h-3 text-slate-400" />
                        {b.time}
                      </span>
                      {b.cost ? <span>· Cuota: {b.cost}</span> : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleApproveBooking(b.id, b.amenity)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                    >
                      Aprobar
                    </button>
                    <button
                      onClick={() => handleRejectBooking(b.id, b.amenity)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-red-50 text-red-600 font-bold text-xs transition-colors cursor-pointer"
                    >
                      Rechazar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center rounded-2xl bg-slate-50/60 border border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center mx-auto mb-2">
                <Ico n="check" c="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-800">Todas las reservaciones están al día</p>
              <p className="text-xs text-slate-400 mt-0.5">No hay solicitudes pendientes de aprobación en este momento.</p>
            </div>
          )}

          {/* Recent visits activity summary */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">Últimos Accesos por Caseta</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {visits.slice(0, 2).map(v => (
                <div key={v.id} className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 truncate">{v.visitor}</p>
                    <p className="text-[10px] text-slate-500 truncate">Unidad {v.unit} · {v.type || 'Visita'}</p>
                  </div>
                  <span className="font-mono text-[10px] text-teal-800 font-bold bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100 shrink-0">
                    {v.entry || '14:20'} hrs
                  </span>
                </div>
              ))}
            </div>
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
            <p className="text-xs text-slate-500 mt-0.5">Atajos de administración HOA</p>
          </div>

          <div className="space-y-2.5">
            {quickActions.map(qa => (
              <button
                key={qa.label}
                onClick={() => {
                  if (qa.onClick) {
                    qa.onClick()
                  } else if (qa.m) {
                    onNav(qa.m)
                  }
                }}
                className="w-full flex items-center gap-3.5 p-3 sm:p-3.5 rounded-2xl text-left transition-all duration-200 bg-slate-50/90 border border-slate-200/80 hover:bg-white hover:border-teal-500/40 hover:shadow-sm focus:outline-none group cursor-pointer relative overflow-hidden active:scale-[0.99]"
              >
                <div
                  className="absolute left-0 top-2.5 bottom-2.5 w-[3.5px] rounded-r-full transition-all duration-200 opacity-0 group-hover:opacity-100"
                  style={{ backgroundColor: qa.accentColor }}
                />

                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-transform duration-200 group-hover:scale-105 ${qa.iconBoxStyle}`}
                >
                  {qa.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 text-sm group-hover:text-[#008080] leading-snug truncate">
                    {qa.label}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate font-normal">
                    {qa.desc}
                  </p>
                </div>
                <Ico
                  n="chevron"
                  c="w-4 h-4 text-slate-400 group-hover:text-[#008080] group-hover:translate-x-1 transition-all shrink-0"
                />
              </button>
            ))}
          </div>
        </GCard>
      </div>

      {/* Modal: Create Amenity from Dashboard */}
      <AmenityFormModal
        isOpen={isAmenityModalOpen}
        onClose={() => setIsAmenityModalOpen(false)}
        onSave={handleSaveAmenity}
      />
    </div>
  )
}

export default AdminDashboard
