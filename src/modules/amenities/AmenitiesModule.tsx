import { useState } from 'react'
import ModHero from '@/components/common/ModHero'
import SubTabs from '@/components/common/SubTabs'
import Ico from '@/components/common/Icons'
import AmenityCatalog from '@/modules/amenities/AmenityCatalog'
import InteractiveCalendar from '@/modules/amenities/InteractiveCalendar'
import BookingManagement from '@/modules/amenities/BookingManagement'
import { useData } from '@/context/DataContext'

export type AmenitiesTab = 'catalog' | 'calendar' | 'bookings'

export function AmenitiesModule() {
  const [tab, setTab] = useState<AmenitiesTab>('catalog')
  const { amenities, bookings } = useData()

  return (
    <div>
      <ModHero
        icon={<Ico n="calendar" c="w-6 h-6" />}
        title="Módulo de Reservación de Áreas Comunes"
        desc="Catálogo de amenidades, configuración de reglas y cuotas, calendario de disponibilidad en tiempo real y aprobación de reservaciones."
        badge="Módulo B"
      />

      <SubTabs
        tabs={[
          { id: 'catalog' as AmenitiesTab, label: 'Catálogo de Áreas Comunes', shortLabel: 'Catálogo', badge: amenities.length },
          { id: 'calendar' as AmenitiesTab, label: 'Calendario Interactivo', shortLabel: 'Calendario' },
          { id: 'bookings' as AmenitiesTab, label: 'Gestión y Aprobación de Reservas', shortLabel: 'Reservas', badge: bookings.filter(b => b.status === 'Pendiente').length || undefined },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'catalog' && <AmenityCatalog />}
      {tab === 'calendar' && <InteractiveCalendar />}
      {tab === 'bookings' && <BookingManagement />}
    </div>
  )
}
export default AmenitiesModule
