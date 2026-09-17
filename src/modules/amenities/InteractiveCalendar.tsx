import { useState } from 'react'
import { useData } from '@/context/DataContext'
import Badge from '@/components/common/Badge'
import Btn from '@/components/common/Button'
import Modal from '@/components/common/Modal'
import Ico from '@/components/common/Icons'

const TIME_SLOTS = [
  '08:00 – 10:00',
  '10:00 – 12:00',
  '12:00 – 14:00',
  '14:00 – 16:00',
  '16:00 – 18:00',
  '18:00 – 20:00',
  '20:00 – 22:00',
]

const DAYS_AHEAD = [
  { day: 'Mié', num: '02', fullDate: '2026-09-02', label: 'Hoy' },
  { day: 'Jue', num: '03', fullDate: '2026-09-03', label: 'Mañana' },
  { day: 'Vie', num: '04', fullDate: '2026-09-04', label: '4 Sep' },
  { day: 'Sáb', num: '05', fullDate: '2026-09-05', label: '5 Sep' },
  { day: 'Dom', num: '06', fullDate: '2026-09-06', label: '6 Sep' },
  { day: 'Lun', num: '07', fullDate: '2026-09-07', label: '7 Sep' },
  { day: 'Mar', num: '08', fullDate: '2026-09-08', label: '8 Sep' },
]

export function InteractiveCalendar({
  currentUnit = 'A-101',
  currentResident = 'Carlos Mendoza',
}: {
  currentUnit?: string
  currentResident?: string
}) {
  const { amenities, bookings, addBooking } = useData()
  const [selectedDate, setSelectedDate] = useState('2026-09-05')
  const [selectedAmenityId, setSelectedAmenityId] = useState<number>(amenities[0]?.id || 1)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<string>('')
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  const activeAmenity = amenities.find(a => a.id === selectedAmenityId) || amenities[0]

  const dayBookings = bookings.filter(b => {
    const matchAmenity =
      b.amenity.toLowerCase().includes(activeAmenity.name.toLowerCase()) ||
      b.amenityId === activeAmenity.id
    return matchAmenity && b.status !== 'Cancelada' && b.status !== 'Rechazada'
  })

  function handleSlotClick(slot: string, isOccupied: boolean) {
    if (isOccupied) return
    setSelectedSlot(slot)
    setModalOpen(true)
  }

  function handleScheduleBooking(e: React.FormEvent) {
    e.preventDefault()
    if (!activeAmenity || !selectedSlot) return

    addBooking({
      amenityId: activeAmenity.id,
      amenity: activeAmenity.name,
      resident: currentResident,
      unit: currentUnit,
      date: selectedDate,
      time: selectedSlot,
      guests: Math.min(10, activeAmenity.capacity),
      cost: activeAmenity.rate,
    })

    setModalOpen(false)
    setToastMsg(`¡Reserva creada para ${activeAmenity.name} el ${selectedDate} en horario ${selectedSlot}!`)
    setTimeout(() => setToastMsg(null), 4000)
  }

  return (
    <div className="space-y-6">
      {toastMsg && (
        <div className="p-4 rounded-2xl bg-teal-50 border border-teal-100 text-teal-900 text-xs sm:text-sm font-semibold flex items-center gap-3 animate-fade-in shadow-xs">
          <Ico n="check" c="w-5 h-5 text-teal-600" />
          {toastMsg}
        </div>
      )}

      {/* Date Ribbon */}
      <div className="flex gap-2.5 sm:gap-3 overflow-x-auto pb-2 hide-scrollbar flex-nowrap">
        {DAYS_AHEAD.map(d => {
          const isSelected = selectedDate === d.fullDate
          return (
            <button
              key={d.fullDate}
              onClick={() => setSelectedDate(d.fullDate)}
              className={`flex-1 min-w-[80px] sm:min-w-[95px] p-3 rounded-2xl text-center transition-all duration-200 cursor-pointer shrink-0 border ${
                isSelected
                  ? 'bg-teal-700 text-white border-teal-800 shadow-sm ring-2 ring-teal-600/20'
                  : 'bg-white text-slate-700 border-slate-100 hover:border-slate-200 hover:bg-slate-50/60 shadow-[0_1px_3px_rgba(0,0,0,0.02)]'
              }`}
            >
              <p className={`text-[11px] uppercase tracking-wider font-semibold whitespace-nowrap ${isSelected ? 'text-teal-200' : 'text-slate-400'}`}>
                {d.day}
              </p>
              <p className="text-xl sm:text-2xl font-display font-bold my-0.5 tracking-tight whitespace-nowrap">{d.num}</p>
              <span
                className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md whitespace-nowrap ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {d.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* Amenity Selector & Time Slot Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Amenity Picker */}
        <div className="space-y-3">
          <h4 className="font-display font-semibold text-slate-900 text-base whitespace-nowrap">
            Selecciona el Espacio:
          </h4>
          <div className="space-y-2.5">
            {amenities.map(a => {
              const isSelected = selectedAmenityId === a.id
              return (
                <button
                  key={a.id}
                  onClick={() => setSelectedAmenityId(a.id)}
                  className={`w-full text-left p-3.5 rounded-2xl transition-all duration-200 border flex items-center gap-3.5 cursor-pointer ${
                    isSelected
                      ? 'bg-white border-teal-500 shadow-xs ring-2 ring-teal-500/15'
                      : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/60 shadow-[0_1px_3px_rgba(0,0,0,0.02)]'
                  }`}
                >
                  <img src={a.img} alt={a.name} className="w-13 h-13 sm:w-14 sm:h-14 rounded-xl object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-sm leading-tight truncate">{a.name}</p>
                    <p className="text-xs text-slate-500 mt-1 font-medium whitespace-nowrap truncate">
                      👥 {a.capacity} pers · <span className="font-semibold text-teal-700">{a.rate}</span>
                    </p>
                  </div>
                  {isSelected && (
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-600 shrink-0" />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Time Slots Grid */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl p-5 sm:p-7 bg-white border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_4px_16px_rgba(0,0,0,0.02)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="min-w-0">
                <span className="text-[11px] font-semibold uppercase tracking-widest text-teal-700 whitespace-nowrap">
                  Disponibilidad de Horarios
                </span>
                <h3 className="font-display font-semibold text-slate-900 text-xl sm:text-2xl mt-0.5 truncate">
                  {activeAmenity.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 font-medium truncate">
                  Fecha: <strong className="text-slate-800 font-medium">{selectedDate}</strong> · Horario: {activeAmenity.hours}
                </p>
              </div>

              <div className="flex items-center gap-2.5 text-xs shrink-0">
                <span className="flex items-center gap-1.5 font-semibold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100 whitespace-nowrap">
                  <span className="w-2 h-2 rounded-full bg-teal-600" /> Libre
                </span>
                <span className="flex items-center gap-1.5 font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/60 whitespace-nowrap">
                  <span className="w-2 h-2 rounded-full bg-slate-400" /> Ocupado
                </span>
              </div>
            </div>

            {/* Slots */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TIME_SLOTS.map(slot => {
                const booked = dayBookings.find(b => b.time.includes(slot.split(' – ')[0]))
                const isOccupied = !!booked

                return (
                  <div
                    key={slot}
                    onClick={() => handleSlotClick(slot, isOccupied)}
                    className={`p-3.5 sm:p-4 rounded-xl border transition-all duration-200 flex items-center justify-between gap-2.5 ${
                      isOccupied
                        ? 'bg-slate-50/80 border-slate-200/70 text-slate-400 cursor-not-allowed'
                        : 'bg-white border-slate-200/70 hover:border-teal-500 hover:shadow-xs cursor-pointer group'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                      <div
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isOccupied
                            ? 'bg-slate-100 text-slate-400'
                            : 'bg-slate-100 text-slate-700 group-hover:bg-teal-50 group-hover:text-teal-700 transition-colors'
                        }`}
                      >
                        <Ico n="clock" c="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs sm:text-sm font-semibold whitespace-nowrap truncate ${isOccupied ? 'text-slate-500' : 'text-slate-800'}`}>
                          {slot}
                        </p>
                        <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate">
                          {isOccupied
                            ? `Ocupado (${booked?.unit})`
                            : 'Libre para agendar'}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isOccupied ? (
                        <Badge text={booked?.status || 'Ocupado'} />
                      ) : (
                        <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2.5 sm:px-3 py-1.5 rounded-xl border border-teal-100 group-hover:bg-teal-600 group-hover:text-white transition-all shadow-2xs flex items-center gap-1 whitespace-nowrap">
                          Apartar →
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Quick Reserve */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Confirmar Apartado — ${activeAmenity.name}`}
        subtitle={`Fecha: ${selectedDate} | Horario: ${selectedSlot}`}
      >
        <form onSubmit={handleScheduleBooking} className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1.5">
            <p className="font-semibold text-slate-900 text-sm">Resumen de Apartado:</p>
            <p className="text-slate-600">
              Espacio: <strong>{activeAmenity.name}</strong>
            </p>
            <p className="text-slate-600">
              Fecha: <strong className="font-medium">{selectedDate}</strong>
            </p>
            <p className="text-slate-600">
              Horario: <strong className="font-medium">{selectedSlot}</strong>
            </p>
            <p className="text-slate-600">
              Cuota de Apartado: <strong className="text-teal-700">{activeAmenity.rate}</strong>
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-600">
                Unidad
              </label>
              <input
                disabled
                value={currentUnit}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-100 font-semibold text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-600">
                Solicitante
              </label>
              <input
                disabled
                value={currentResident}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-100 font-semibold text-slate-800"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-3">
            <Btn type="submit" className="flex-1 font-semibold">
              Confirmar Reservación
            </Btn>
            <Btn variant="ghost" onClick={() => setModalOpen(false)}>
              Cancelar
            </Btn>
          </div>
        </form>
      </Modal>
    </div>
  )
}
export default InteractiveCalendar
