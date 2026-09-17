import { useState } from 'react'
import type { BookingStatus } from '@/types/amenities'
import { useData } from '@/context/DataContext'
import Badge from '@/components/common/Badge'
import Ico from '@/components/common/Icons'

export function BookingManagement() {
  const { bookings, updateBookingStatus } = useData()
  const [filterStatus, setFilterStatus] = useState<'all' | BookingStatus>('all')
  const [feedback, setFeedback] = useState<string | null>(null)

  function handleAction(id: number, status: BookingStatus, name: string) {
    updateBookingStatus(id, status)
    setFeedback(`Reservación #${id} (${name}) actualizada a "${status}".`)
    setTimeout(() => setFeedback(null), 3500)
  }

  const filtered = bookings.filter(b => (filterStatus === 'all' ? true : b.status === filterStatus))

  const pendingCount = bookings.filter(b => b.status === 'Pendiente').length
  const approvedCount = bookings.filter(b => b.status === 'Aprobada').length
  const canceledCount = bookings.filter(b => b.status === 'Cancelada' || b.status === 'Rechazada').length

  return (
    <div className="space-y-4">
      {/* Toast feedback */}
      {feedback && (
        <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-100 text-teal-800 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <Ico n="check" c="w-4 h-4 text-teal-600" />
          {feedback}
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Pendientes por Aprobar', value: String(pendingCount), color: 'text-amber-700', bg: 'bg-amber-50/60 border-amber-100' },
          { label: 'Reservaciones Aprobadas', value: String(approvedCount), color: 'text-teal-700', bg: 'bg-teal-50/60 border-teal-100' },
          { label: 'Canceladas / Rechazadas', value: String(canceledCount), color: 'text-slate-600', bg: 'bg-slate-50/60 border-slate-100' },
        ].map(m => (
          <div
            key={m.label}
            className={`rounded-2xl p-4.5 border bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)]`}
          >
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{m.label}</p>
            <p className={`text-2xl font-display font-bold mt-1.5 ${m.color}`}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar flex-nowrap bg-white p-3 rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        {(['all', 'Pendiente', 'Aprobada', 'Cancelada', 'Rechazada'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              filterStatus === s
                ? 'bg-teal-700 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
            }`}
          >
            {s === 'all' ? 'Todas las Reservaciones' : s}
          </button>
        ))}
      </div>

      {/* Bookings Table */}
      <div className="rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02),0_4px_16px_rgba(0,0,0,0.02)] border border-slate-100 bg-white">
        <div className="overflow-x-auto hide-scrollbar">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                {['ID', 'Área / Amenidad', 'Residente Solicitante', 'Fecha Apartada', 'Horario', 'Invitados', 'Cuota', 'Estado', 'Acciones'].map(h => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(b => (
                <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-3.5 font-mono text-xs font-bold text-slate-400 whitespace-nowrap">#{b.id}</td>
                  <td className="px-5 py-3.5 font-semibold text-slate-800 whitespace-nowrap">{b.amenity}</td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <p className="font-medium text-slate-800">{b.resident}</p>
                    <p className="text-xs text-slate-400">Unidad {b.unit}</p>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-600 font-medium whitespace-nowrap">{b.date}</td>
                  <td className="px-5 py-3.5 text-xs text-slate-500 whitespace-nowrap">{b.time}</td>
                  <td className="px-5 py-3.5 text-xs text-slate-600 whitespace-nowrap">{b.guests} pers.</td>
                  <td className="px-5 py-3.5 text-xs font-semibold text-teal-700 whitespace-nowrap">{b.cost || 'Sin costo'}</td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <Badge text={b.status} />
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    {b.status === 'Pendiente' ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAction(b.id, 'Aprobada', b.amenity)}
                          className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 hover:bg-teal-100 transition-colors cursor-pointer whitespace-nowrap"
                        >
                          Aprobar
                        </button>
                        <button
                          onClick={() => handleAction(b.id, 'Rechazada', b.amenity)}
                          className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition-colors cursor-pointer whitespace-nowrap"
                        >
                          Rechazar
                        </button>
                      </div>
                    ) : b.status === 'Aprobada' ? (
                      <button
                        onClick={() => handleAction(b.id, 'Cancelada', b.amenity)}
                        className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Cancelar
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400 italic whitespace-nowrap">Concluido</span>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-slate-400 text-sm">
                    No se encontraron reservaciones con el estado seleccionado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
export default BookingManagement
