import { useState } from 'react'
import type { BookingStatus, Booking } from '@/types/amenities'
import { useData } from '@/context/DataContext'
import Badge from '@/components/common/Badge'
import Ico from '@/components/common/Icons'
import Modal from '@/components/common/Modal'
import GCard from '@/components/common/Card'

type ManagementSubTab = 'bookings' | 'maintenance'

export function BookingManagement() {
  const { bookings, updateBookingStatus, amenities, toggleAmenityMaintenance } = useData()
  const [subTab, setSubTab] = useState<ManagementSubTab>('bookings')
  const [filterStatus, setFilterStatus] = useState<'all' | BookingStatus>('all')
  const [filterAmenity, setFilterAmenity] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)

  // Rejection modal state
  const [rejectingBooking, setRejectingBooking] = useState<Booking | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [selectedQuickReason, setSelectedQuickReason] = useState('')

  // Maintenance toggle modal state
  const [maintenanceTarget, setMaintenanceTarget] = useState<number | null>(null)
  const [maintenanceNoteInput, setMaintenanceNoteInput] = useState('')

  const quickRejectionReasons = [
    'Solapamiento de horario con evento comunitario',
    'Mantenimiento correctivo o preventivo en la fecha solicitada',
    'Adeudo o suspensión temporal de cuotas de mantenimiento',
    'Aforo de invitados excede la capacidad reglamentaria',
  ]

  function handleApprove(b: Booking) {
    updateBookingStatus(b.id, 'Aprobada')
    setFeedback(`Reservación #${b.id} de ${b.resident} (${b.amenity}) fue APROBADA.`)
    setTimeout(() => setFeedback(null), 3500)
  }

  function handleOpenRejectModal(b: Booking) {
    setRejectingBooking(b)
    setRejectionReason('')
    setSelectedQuickReason('')
  }

  function handleConfirmRejection() {
    if (!rejectingBooking) return
    const finalReason = rejectionReason.trim() || selectedQuickReason || 'Rechazada por disposición de administración.'
    updateBookingStatus(rejectingBooking.id, 'Rechazada', finalReason)
    setFeedback(`Reservación #${rejectingBooking.id} fue RECHAZADA.`)
    setRejectingBooking(null)
    setRejectionReason('')
    setTimeout(() => setFeedback(null), 3500)
  }

  function handleCancelApproved(b: Booking) {
    if (confirm(`¿Estás seguro de cancelar la reservación aprobada #${b.id} de ${b.resident}?`)) {
      updateBookingStatus(b.id, 'Cancelada')
      setFeedback(`Reservación #${b.id} ha sido cancelada.`)
      setTimeout(() => setFeedback(null), 3500)
    }
  }

  function handleOpenMaintenanceModal(amenityId: number, currentStatus: boolean, currentNote?: string) {
    if (currentStatus) {
      // Space is currently active, prompt for note before entering maintenance
      setMaintenanceTarget(amenityId)
      setMaintenanceNoteInput(currentNote || 'Mantenimiento preventivo programado')
    } else {
      // Space is in maintenance, reactivate immediately
      toggleAmenityMaintenance(amenityId)
      setFeedback('Espacio reactivado y disponible para reservaciones.')
      setTimeout(() => setFeedback(null), 3500)
    }
  }

  function handleConfirmMaintenance() {
    if (maintenanceTarget === null) return
    toggleAmenityMaintenance(maintenanceTarget, maintenanceNoteInput)
    setFeedback('Espacio puesto en mantenimiento con éxito.')
    setMaintenanceTarget(null)
    setMaintenanceNoteInput('')
    setTimeout(() => setFeedback(null), 3500)
  }

  // Filter logic
  const filtered = bookings.filter(b => {
    if (filterStatus !== 'all' && b.status !== filterStatus) return false
    if (filterAmenity !== 'all' && b.amenity !== filterAmenity) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchName = b.resident.toLowerCase().includes(q)
      const matchUnit = b.unit.toLowerCase().includes(q)
      const matchAmenity = b.amenity.toLowerCase().includes(q)
      const matchCode = b.qrPassCode?.toLowerCase().includes(q)
      if (!matchName && !matchUnit && !matchAmenity && !matchCode) return false
    }
    return true
  })

  // Metrics
  const pendingCount = bookings.filter(b => b.status === 'Pendiente').length
  const approvedCount = bookings.filter(b => b.status === 'Aprobada').length
  const maintenanceCount = amenities.filter(a => !a.available).length
  const totalRevenue = bookings
    .filter(b => b.status === 'Aprobada')
    .reduce((sum, b) => {
      const val = parseInt((b.cost || '').replace(/[^0-9]/g, ''), 10)
      return isNaN(val) ? sum : sum + val
    }, 0)

  return (
    <div className="space-y-5">
      {/* Toast feedback */}
      {feedback && (
        <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-semibold flex items-center gap-2 animate-fade-in shadow-xs">
          <Ico n="check" c="w-4 h-4 text-teal-600" />
          {feedback}
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-2xl p-4 border border-amber-200/60 bg-amber-50/40 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-800">Pendientes</p>
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          </div>
          <p className="text-2xl font-display font-bold mt-1 text-amber-900">{pendingCount}</p>
          <p className="text-[11px] text-amber-700/80 mt-0.5">Requieren aprobación</p>
        </div>

        <div className="rounded-2xl p-4 border border-teal-100 bg-teal-50/30 shadow-xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-teal-800">Aprobadas</p>
          <p className="text-2xl font-display font-bold mt-1 text-teal-900">{approvedCount}</p>
          <p className="text-[11px] text-teal-700/80 mt-0.5">Reservaciones activas</p>
        </div>

        <div className="rounded-2xl p-4 border border-slate-100 bg-white shadow-xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Ingresos Cuotas</p>
          <p className="text-2xl font-display font-bold mt-1 text-slate-900">${totalRevenue.toLocaleString()}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">En reservas aprobadas</p>
        </div>

        <div className="rounded-2xl p-4 border border-slate-100 bg-white shadow-xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">En Mantenimiento</p>
          <p className="text-2xl font-display font-bold mt-1 text-slate-900">{maintenanceCount} <span className="text-xs font-normal text-slate-400">/ {amenities.length}</span></p>
          <p className="text-[11px] text-slate-400 mt-0.5">Espacios bloqueados</p>
        </div>
      </div>

      {/* Main Subtabs: Bookings vs Maintenance */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
        <button
          onClick={() => setSubTab('bookings')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
            subTab === 'bookings'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Ico n="calendar" c="w-4 h-4" />
          Solicitudes y Reservaciones ({bookings.length})
        </button>

        <button
          onClick={() => setSubTab('maintenance')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
            subTab === 'maintenance'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Ico n="tool" c="w-4 h-4" />
          Estado de Espacios y Mantenimiento ({maintenanceCount} en pausa)
        </button>
      </div>

      {/* TAB 1: Bookings Management */}
      {subTab === 'bookings' && (
        <div className="space-y-4">
          {/* Controls Bar: Search & Filters */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row gap-2.5">
              {/* Search input */}
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Ico n="search" c="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Buscar por residente, unidad, amenidad o clave QR..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition-all"
                />
              </div>

              {/* Amenity Filter dropdown */}
              <select
                value={filterAmenity}
                onChange={e => setFilterAmenity(e.target.value)}
                className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600 cursor-pointer"
              >
                <option value="all">Todas las Amenidades</option>
                {amenities.map(a => (
                  <option key={a.id} value={a.name}>{a.name}</option>
                ))}
              </select>
            </div>

            {/* Status Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar pt-1 border-t border-slate-100">
              {(['all', 'Pendiente', 'Aprobada', 'Cancelada', 'Rechazada'] as const).map(s => {
                const count = s === 'all' ? bookings.length : bookings.filter(b => b.status === s).length
                return (
                  <button
                    key={s}
                    onClick={() => setFilterStatus(s)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                      filterStatus === s
                        ? 'bg-teal-700 text-white shadow-xs'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                    }`}
                  >
                    {s === 'all' ? 'Todas' : s}
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${filterStatus === s ? 'bg-teal-800 text-teal-100' : 'bg-slate-200/70 text-slate-600'}`}>
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Bookings Table (Desktop) & Cards (Mobile) */}
          <div className="rounded-2xl overflow-hidden shadow-xs border border-slate-100 bg-white">
            <div className="overflow-x-auto hide-scrollbar">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60 text-slate-500">
                    <th className="text-left px-4 py-3.5 text-xs font-semibold uppercase tracking-wider whitespace-nowrap">ID / Folio</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Espacio</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Residente / Depto</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Fecha y Horario</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Aforo</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Cuota</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Estado</th>
                    <th className="text-right px-4 py-3.5 text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Acción de Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map(b => (
                    <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="font-mono text-xs font-bold text-slate-500">#{b.id}</span>
                        {b.qrPassCode && (
                          <p className="font-mono text-[10px] text-slate-400 mt-0.5">{b.qrPassCode}</p>
                        )}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap font-semibold text-slate-800">
                        {b.amenity}
                        {b.specialRequests && (
                          <p className="text-[11px] font-normal text-amber-700 bg-amber-50 rounded px-1.5 py-0.5 mt-1 max-w-xs truncate">
                            Nota: {b.specialRequests}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <p className="font-medium text-slate-800">{b.resident}</p>
                        <p className="text-xs text-slate-400">Depto {b.unit}</p>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs text-slate-600">
                        <p className="font-medium text-slate-800 inline-flex items-center gap-1.5">
                          <Ico n="calendar" c="w-3.5 h-3.5 text-slate-400" />
                          {b.date}
                        </p>
                        <p className="text-slate-500 mt-0.5 inline-flex items-center gap-1.5">
                          <Ico n="clock" c="w-3.5 h-3.5 text-slate-400" />
                          {b.time}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-600 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5">
                          <Ico n="users" c="w-3.5 h-3.5 text-slate-400" />
                          {b.guests} personas
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs font-semibold text-teal-700 whitespace-nowrap">
                        {b.cost || 'Sin costo'}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <Badge text={b.status} />
                        {b.status === 'Rechazada' && b.rejectionReason && (
                          <p className="text-[10px] text-red-600 mt-1 max-w-[160px] truncate" title={b.rejectionReason}>
                            {b.rejectionReason}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-right">
                        {b.status === 'Pendiente' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleApprove(b)}
                              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 hover:bg-teal-100 transition-colors cursor-pointer shadow-2xs"
                            >
                              Aprobar
                            </button>
                            <button
                              onClick={() => handleOpenRejectModal(b)}
                              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition-colors cursor-pointer shadow-2xs"
                            >
                              Rechazar
                            </button>
                          </div>
                        ) : b.status === 'Aprobada' ? (
                          <button
                            onClick={() => handleCancelApproved(b)}
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            Cancelar
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Concluido</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-slate-400 text-sm">
                        No se encontraron reservaciones con los filtros seleccionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Amenities Maintenance & Availability Control */}
      {subTab === 'maintenance' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-100 text-teal-900 text-xs flex items-start gap-2.5">
            <Ico n="info" c="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Control de Operatividad:</strong> Poner un espacio en mantenimiento bloquea automáticamente las fechas en el catálogo y calendario interactivo de los residentes, evitando nuevas solicitudes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {amenities.map(a => (
              <GCard key={a.id} className="relative overflow-hidden">
                <div className="flex items-start gap-4">
                  {a.img && (
                    <img
                      src={a.img}
                      alt={a.name}
                      className="w-20 h-20 rounded-xl object-cover shrink-0 bg-slate-100"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="font-display font-semibold text-slate-900 text-sm truncate">{a.name}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${a.available ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                        {a.available ? (
                          <span className="inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Disponible
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1">
                            <Ico n="alertTriangle" c="w-3 h-3 text-amber-600" />
                            En Mantenimiento
                          </span>
                        )}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 mb-2">{a.subtitle || a.hours}</p>

                    {!a.available && a.maintenanceNote && (
                      <div className="p-2 rounded-lg bg-amber-50/80 border border-amber-200/80 text-[11px] text-amber-800 mb-2">
                        <strong>Motivo:</strong> {a.maintenanceNote}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                      <span className="text-slate-500">Aforo máx: {a.capacity} pers.</span>
                      <button
                        onClick={() => handleOpenMaintenanceModal(a.id, a.available, a.maintenanceNote)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          a.available
                            ? 'bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700'
                        }`}
                      >
                        {a.available ? 'Poner en Mantenimiento' : 'Reactivar Espacio'}
                      </button>
                    </div>
                  </div>
                </div>
              </GCard>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Rejection Reason */}
      {rejectingBooking && (
        <Modal
          isOpen={true}
          onClose={() => setRejectingBooking(null)}
          title="Rechazar Solicitud de Reservación"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <p className="font-semibold text-slate-800">
                Reservación #{rejectingBooking.id} · {rejectingBooking.amenity}
              </p>
              <p className="text-slate-500 mt-0.5">
                Solicitante: {rejectingBooking.resident} (Depto {rejectingBooking.unit}) · Fecha: {rejectingBooking.date}
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Selecciona un motivo frecuente:
              </label>
              <div className="space-y-1.5">
                {quickRejectionReasons.map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setSelectedQuickReason(r)
                      setRejectionReason(r)
                    }}
                    className={`w-full text-left p-2 rounded-xl border text-xs transition-all cursor-pointer ${
                      rejectionReason === r
                        ? 'border-red-400 bg-red-50/50 text-red-900 font-semibold'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    • {r}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                O escribe un motivo personalizado para el residente:
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                placeholder="Explica la razón del rechazo..."
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 text-xs"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleConfirmRejection}
                className="flex-1 py-2 rounded-xl font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer"
              >
                Confirmar Rechazo
              </button>
              <button
                type="button"
                onClick={() => setRejectingBooking(null)}
                className="px-4 py-2 rounded-xl font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Put space in maintenance */}
      {maintenanceTarget !== null && (
        <Modal
          isOpen={true}
          onClose={() => setMaintenanceTarget(null)}
          title="Poner Espacio en Mantenimiento"
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-600">
              Indica el motivo o los detalles del trabajo de mantenimiento para que los residentes conozcan la causa del bloqueo de fechas:
            </p>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nota / Motivo de Mantenimiento:
              </label>
              <input
                type="text"
                value={maintenanceNoteInput}
                onChange={e => setMaintenanceNoteInput(e.target.value)}
                placeholder="Ej. Reparación de duela, mantenimiento de bomba de alberca..."
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 text-xs"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleConfirmMaintenance}
                className="flex-1 py-2 rounded-xl font-semibold bg-amber-600 hover:bg-amber-700 text-white transition-colors cursor-pointer"
              >
                Confirmar Mantenimiento
              </button>
              <button
                type="button"
                onClick={() => setMaintenanceTarget(null)}
                className="px-4 py-2 rounded-xl font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
export default BookingManagement
