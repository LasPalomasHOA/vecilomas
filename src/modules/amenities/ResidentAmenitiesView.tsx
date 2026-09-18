import { useState } from 'react'
import type { Booking } from '@/types/amenities'
import { useData } from '@/context/DataContext'
import ModHero from '@/components/common/ModHero'
import SubTabs from '@/components/common/SubTabs'
import GCard from '@/components/common/Card'
import Badge from '@/components/common/Badge'
import Ico from '@/components/common/Icons'
import Modal from '@/components/common/Modal'
import AmenityCatalog from '@/modules/amenities/AmenityCatalog'
import InteractiveCalendar from '@/modules/amenities/InteractiveCalendar'

type ResidentAmenitiesTab = 'catalog' | 'calendar' | 'mybookings'
type BookingFilter = 'all' | 'active' | 'history'

interface ResidentAmenitiesViewProps {
  unit: string
  name: string
}

export function ResidentAmenitiesView({ unit, name }: ResidentAmenitiesViewProps) {
  const { bookings, updateBookingStatus, amenities } = useData()
  const [tab, setTab] = useState<ResidentAmenitiesTab>('catalog')
  const [filter, setFilter] = useState<BookingFilter>('all')
  const [toast, setToast] = useState<string | null>(null)
  const [selectedPass, setSelectedPass] = useState<Booking | null>(null)
  const [copiedCode, setCopiedCode] = useState(false)

  const myBookings = bookings.filter(
    b => b.unit === unit || b.resident.toLowerCase().includes(name.split(' ')[0].toLowerCase())
  )

  const filteredBookings = myBookings.filter(b => {
    if (filter === 'active') return b.status === 'Pendiente' || b.status === 'Aprobada'
    if (filter === 'history') return b.status === 'Cancelada' || b.status === 'Rechazada'
    return true
  })

  function handleCancelBooking(id: number, amenity: string) {
    if (confirm(`¿Estás seguro de cancelar la reservación de "${amenity}"?`)) {
      updateBookingStatus(id, 'Cancelada')
      setToast(`Tu reservación de "${amenity}" fue cancelada con éxito.`)
      setTimeout(() => setToast(null), 3500)
    }
  }

  function handleCopyPassCode(code: string) {
    navigator.clipboard?.writeText(code)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  function handleShareWhatsApp(b: Booking) {
    const text = encodeURIComponent(
      `¡Hola! Te comparto el pase de acceso para nuestra reunión en VeciLomas:\n\n` +
      `📍 Espacio: ${b.amenity}\n` +
      `📅 Fecha: ${b.date}\n` +
      `⏰ Horario: ${b.time}\n` +
      `👥 Anfitrión: ${b.resident} (Unidad ${b.unit})\n` +
      `🔑 Clave de Pase: ${b.qrPassCode || 'N/A'}\n\n` +
      `Muestra este código o proporciona la clave al personal de seguridad en caseta.`
    )
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  return (
    <div className="space-y-6">
      <ModHero
        icon={<Ico n="calendar" c="w-6 h-6" />}
        title="Amenidades y Áreas Comunes"
        desc="Explora los espacios recreativos del residencial, verifica disponibilidad en tiempo real, reserva de forma guiada y obtén tus pases de acceso QR para invitados."
      />

      {toast && (
        <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-semibold flex items-center gap-2 animate-fade-in shadow-xs">
          <Ico n="check" c="w-4 h-4 text-teal-600" />
          {toast}
        </div>
      )}

      <SubTabs
        tabs={[
          { id: 'catalog' as ResidentAmenitiesTab, label: 'Catálogo de Espacios', shortLabel: 'Espacios' },
          { id: 'calendar' as ResidentAmenitiesTab, label: 'Calendario y Horarios', shortLabel: 'Calendario' },
          { id: 'mybookings' as ResidentAmenitiesTab, label: 'Mis Reservaciones', shortLabel: 'Mis Reservas', badge: myBookings.length },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'catalog' && (
        <AmenityCatalog
          currentUnit={unit}
          currentResidentName={name}
          onBookingSuccess={() => setTab('mybookings')}
        />
      )}

      {tab === 'calendar' && (
        <InteractiveCalendar currentUnit={unit} currentResident={name} />
      )}

      {tab === 'mybookings' && (
        <div className="space-y-4">
          {/* Sub-filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
              {[
                { id: 'all' as BookingFilter, label: 'Todas las Reservas', count: myBookings.length },
                { id: 'active' as BookingFilter, label: 'Activas / Próximas', count: myBookings.filter(b => b.status === 'Pendiente' || b.status === 'Aprobada').length },
                { id: 'history' as BookingFilter, label: 'Historial', count: myBookings.filter(b => b.status === 'Cancelada' || b.status === 'Rechazada').length },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                    filter === f.id
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                  }`}
                >
                  {f.label}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${filter === f.id ? 'bg-teal-800 text-teal-100' : 'bg-slate-200/70 text-slate-600'}`}>
                    {f.count}
                  </span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setTab('catalog')}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors cursor-pointer self-start sm:self-auto flex items-center gap-1.5"
            >
              <Ico n="plus" c="w-3.5 h-3.5" />
              Nueva Reservación
            </button>
          </div>

          {filteredBookings.length === 0 ? (
            <GCard className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-teal-50 text-teal-700">
                <Ico n="calendar" c="w-8 h-8" />
              </div>
              <p className="font-display font-semibold text-slate-900 text-lg">No hay reservaciones en este filtro</p>
              <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                {filter === 'all'
                  ? 'Aún no has apartado ningún espacio recreativo. Explora el catálogo para hacer tu primera reserva.'
                  : 'No se encontraron reservaciones que coincidan con la categoría seleccionada.'}
              </p>
              <button
                onClick={() => setTab('catalog')}
                className="mt-5 px-5 py-2.5 rounded-xl text-xs font-semibold bg-teal-700 text-white hover:bg-teal-800 transition-colors cursor-pointer shadow-xs"
              >
                Explorar Catálogo de Amenidades
              </button>
            </GCard>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredBookings.map(b => {
                const matchedAmenity = amenities.find(a => a.id === b.amenityId || a.name === b.amenity)
                const isApproved = b.status === 'Aprobada'
                const isPending = b.status === 'Pendiente'
                const isRejected = b.status === 'Rechazada'
                const isCanceled = b.status === 'Cancelada'

                return (
                  <GCard key={b.id} className="hover:shadow-md transition-all duration-200 border-slate-100/90 overflow-hidden">
                    <div className="flex flex-col md:flex-row gap-5">
                      {/* Amenity thumbnail or icon */}
                      {matchedAmenity?.img ? (
                        <div className="w-full md:w-44 h-32 md:h-auto rounded-xl overflow-hidden shrink-0 relative bg-slate-100">
                          <img
                            src={matchedAmenity.img}
                            alt={b.amenity}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 left-2">
                            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-black/60 text-white backdrop-blur-xs">
                              #{b.id}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                          <Ico n="calendar" c="w-7 h-7" />
                        </div>
                      )}

                      {/* Info body */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <h3 className="font-display font-semibold text-slate-900 text-base">{b.amenity}</h3>
                              <Badge text={b.status} />
                            </div>
                            {b.qrPassCode && (
                              <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 border border-slate-200/60">
                                Clave: {b.qrPassCode}
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-3 p-3 rounded-xl bg-slate-50/70 border border-slate-100 text-xs">
                            <div>
                              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Fecha</p>
                              <p className="font-semibold text-slate-800 mt-0.5">📅 {b.date}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Horario</p>
                              <p className="font-semibold text-slate-800 mt-0.5">⏰ {b.time}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Aforo</p>
                              <p className="font-semibold text-slate-800 mt-0.5">👥 {b.guests} personas</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Cuota / Depósito</p>
                              <p className="font-semibold text-teal-700 mt-0.5">{b.cost || 'Sin costo'}</p>
                            </div>
                          </div>

                          {b.specialRequests && (
                            <p className="text-xs text-slate-500 bg-amber-50/50 border border-amber-100/70 rounded-lg px-2.5 py-1.5 mb-3">
                              <strong className="text-amber-800">Solicitud especial:</strong> {b.specialRequests}
                            </p>
                          )}

                          {isRejected && b.rejectionReason && (
                            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs mb-3 flex items-start gap-2">
                              <Ico n="info" c="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold">Motivo del rechazo administrativo:</span>
                                <p className="mt-0.5 text-red-600">{b.rejectionReason}</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Actions row */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 mt-2">
                          <div className="text-[11px] text-slate-400">
                            Titular: <span className="font-semibold text-slate-700">{b.resident}</span> · Depto {b.unit}
                          </div>

                          <div className="flex items-center gap-2">
                            {(isApproved || isPending) && (
                              <button
                                onClick={() => setSelectedPass(b)}
                                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-teal-700 hover:bg-teal-800 text-white transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                              >
                                <Ico n="qr" c="w-3.5 h-3.5" />
                                Ver Pase QR
                              </button>
                            )}

                            {(isApproved || isPending) && (
                              <button
                                onClick={() => handleCancelBooking(b.id, b.amenity)}
                                className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-red-200 text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              >
                                Cancelar
                              </button>
                            )}

                            {(isCanceled || isRejected) && (
                              <span className="text-xs text-slate-400 italic">
                                Reservación inactiva
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </GCard>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Guest Digital Pass QR Modal */}
      {selectedPass && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedPass(null)}
          title="Pase Digital de Acceso a Amenidad"
        >
          <div className="space-y-5">
            <div className="bg-gradient-to-b from-teal-700 to-teal-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden text-center">
              <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-teal-600/30 rounded-full blur-xl pointer-events-none" />
              
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-[10px] font-bold tracking-widest uppercase bg-teal-600/60 px-2.5 py-0.5 rounded-full border border-teal-500/40">
                  VeciLomas Residencial
                </span>
                <span className="text-[10px] font-semibold bg-white/20 px-2 py-0.5 rounded-full">
                  {selectedPass.status}
                </span>
              </div>

              <h2 className="text-xl font-display font-bold text-white mb-1">
                {selectedPass.amenity}
              </h2>
              <p className="text-xs text-teal-100/80 mb-5">
                Pase de autorización de invitados para área común
              </p>

              {/* QR Mock graphic */}
              <div className="w-48 h-48 mx-auto bg-white rounded-2xl p-4 shadow-inner flex flex-col items-center justify-center relative">
                <svg viewBox="0 0 100 100" className="w-full h-full text-slate-900">
                  <rect width="100" height="100" fill="white" />
                  {/* Top-left marker */}
                  <rect x="10" y="10" width="24" height="24" fill="#0f172a" rx="3" />
                  <rect x="14" y="14" width="16" height="16" fill="white" rx="1.5" />
                  <rect x="18" y="18" width="8" height="8" fill="#0f172a" rx="1" />
                  
                  {/* Top-right marker */}
                  <rect x="66" y="10" width="24" height="24" fill="#0f172a" rx="3" />
                  <rect x="70" y="14" width="16" height="16" fill="white" rx="1.5" />
                  <rect x="74" y="18" width="8" height="8" fill="#0f172a" rx="1" />
                  
                  {/* Bottom-left marker */}
                  <rect x="10" y="66" width="24" height="24" fill="#0f172a" rx="3" />
                  <rect x="14" y="70" width="16" height="16" fill="white" rx="1.5" />
                  <rect x="18" y="74" width="8" height="8" fill="#0f172a" rx="1" />
                  
                  {/* Grid pattern mock */}
                  <rect x="40" y="12" width="6" height="6" fill="#0f172a" />
                  <rect x="52" y="12" width="6" height="6" fill="#0f172a" />
                  <rect x="40" y="24" width="18" height="6" fill="#0f172a" />
                  <rect x="12" y="42" width="18" height="6" fill="#0f172a" />
                  <rect x="36" y="40" width="8" height="8" fill="#008080" rx="1.5" />
                  <rect x="56" y="40" width="8" height="8" fill="#0f172a" />
                  <rect x="72" y="42" width="16" height="6" fill="#0f172a" />
                  <rect x="40" y="56" width="20" height="6" fill="#0f172a" />
                  <rect x="40" y="70" width="8" height="8" fill="#0f172a" />
                  <rect x="56" y="70" width="12" height="6" fill="#008080" rx="1" />
                  <rect x="76" y="72" width="12" height="12" fill="#0f172a" rx="1.5" />
                </svg>
              </div>

              {/* Pass Code badge with copy */}
              <div className="mt-4 flex items-center justify-center gap-2">
                <span className="font-mono text-sm tracking-widest font-bold bg-white/10 px-3.5 py-1.5 rounded-xl border border-white/20">
                  {selectedPass.qrPassCode || `AMN-${selectedPass.unit}-${selectedPass.id}X`}
                </span>
                <button
                  onClick={() => handleCopyPassCode(selectedPass.qrPassCode || '')}
                  className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
                  title="Copiar Clave"
                >
                  <Ico n={copiedCode ? "check" : "file"} c="w-4 h-4" />
                </button>
              </div>
              {copiedCode && (
                <p className="text-[11px] text-teal-200 mt-1 font-semibold">¡Clave copiada al portapapeles!</p>
              )}
            </div>

            {/* Pass details summary */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2.5 text-xs text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-400">📅 Fecha:</span>
                <span className="font-semibold text-slate-900">{selectedPass.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">⏰ Horario reservado:</span>
                <span className="font-semibold text-slate-900">{selectedPass.time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">👤 Residente / Anfitrión:</span>
                <span className="font-semibold text-slate-900">{selectedPass.resident} (Depto {selectedPass.unit})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">👥 Capacidad autorizada:</span>
                <span className="font-semibold text-slate-900">Hasta {selectedPass.guests} invitados</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed text-center">
              🛡️ El guardia de caseta escaneará este código QR para agilizar la entrada de tus invitados hacia el área de amenidades.
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => handleShareWhatsApp(selectedPass)}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs"
              >
                <Ico n="whatsapp" c="w-4 h-4" />
                Compartir por WhatsApp
              </button>
              <button
                onClick={() => setSelectedPass(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
export default ResidentAmenitiesView
