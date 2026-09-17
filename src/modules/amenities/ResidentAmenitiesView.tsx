import { useState } from 'react'
import { useData } from '@/context/DataContext'
import ModHero from '@/components/common/ModHero'
import SubTabs from '@/components/common/SubTabs'
import GCard from '@/components/common/Card'
import Badge from '@/components/common/Badge'
import Ico from '@/components/common/Icons'
import AmenityCatalog from '@/modules/amenities/AmenityCatalog'
import InteractiveCalendar from '@/modules/amenities/InteractiveCalendar'

type ResidentAmenitiesTab = 'catalog' | 'calendar' | 'mybookings'

interface ResidentAmenitiesViewProps {
  unit: string
  name: string
}

export function ResidentAmenitiesView({ unit, name }: ResidentAmenitiesViewProps) {
  const { bookings, updateBookingStatus } = useData()
  const [tab, setTab] = useState<ResidentAmenitiesTab>('catalog')
  const [cancelToast, setCancelToast] = useState<string | null>(null)

  const myBookings = bookings.filter(
    b => b.unit === unit || b.resident.toLowerCase().includes(name.split(' ')[0].toLowerCase())
  )

  function handleCancelBooking(id: number, amenity: string) {
    updateBookingStatus(id, 'Cancelada')
    setCancelToast(`Tu reserva de "${amenity}" fue cancelada con éxito.`)
    setTimeout(() => setCancelToast(null), 3500)
  }

  return (
    <div>
      <ModHero
        icon={<Ico n="calendar" c="w-6 h-6" />}
        title="Amenidades y Áreas Comunes"
        desc="Consulta el catálogo de espacios recreativos, revisa la disponibilidad en el calendario interactivo y gestiona tus reservaciones."
      />

      {cancelToast && (
        <div className="mb-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <Ico n="info" c="w-4 h-4 text-amber-600" />
          {cancelToast}
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
        <div className="space-y-3.5">
          {myBookings.length === 0 ? (
            <GCard className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-teal-50 text-teal-700">
                <Ico n="calendar" c="w-8 h-8" />
              </div>
              <p className="font-display font-semibold text-slate-900 text-lg">Sin reservaciones activas</p>
              <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                Explora el catálogo o usa el calendario para apartar asadores, canchas, alberca o el salón de eventos.
              </p>
              <button
                onClick={() => setTab('catalog')}
                className="mt-5 px-5 py-2.5 rounded-xl text-xs font-semibold bg-teal-700 text-white hover:bg-teal-800 transition-colors cursor-pointer shadow-xs"
              >
                Ver Catálogo de Amenidades
              </button>
            </GCard>
          ) : (
            myBookings.map(b => (
              <GCard key={b.id} className="hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center flex-shrink-0 bg-teal-50 text-teal-700 shrink-0">
                      <Ico n="calendar" c="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-display font-semibold text-slate-900 text-base truncate">{b.amenity}</span>
                        <Badge text={b.status} />
                      </div>
                      <p className="text-xs text-slate-500 font-mono truncate">
                        📅 {b.date} · ⏰ {b.time} · 👥 {b.guests} pers. · Cuota: {b.cost || 'Sin costo'}
                      </p>
                    </div>
                  </div>

                  {b.status === 'Pendiente' || b.status === 'Aprobada' ? (
                    <button
                      onClick={() => handleCancelBooking(b.id, b.amenity)}
                      className="text-xs font-semibold px-3.5 py-1.5 rounded-xl border border-red-200/70 text-red-600 bg-red-50/60 hover:bg-red-50 transition-colors cursor-pointer shrink-0 self-end sm:self-center whitespace-nowrap shadow-2xs"
                    >
                      Cancelar Reserva
                    </button>
                  ) : null}
                </div>
              </GCard>
            ))
          )}
        </div>
      )}
    </div>
  )
}
export default ResidentAmenitiesView
