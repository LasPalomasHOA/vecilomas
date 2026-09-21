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
  currentResident = 'Carlos Mendoza Ruiz',
}: {
  currentUnit?: string
  currentResident?: string
}) {
  const { amenities, bookings, addBooking } = useData()
  const [selectedDate, setSelectedDate] = useState('2026-09-05')
  const [selectedAmenityId, setSelectedAmenityId] = useState<number>(amenities[0]?.id || 1)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<string>('')
  const [guestsCount, setGuestsCount] = useState<number>(10)
  const [specialReqs, setSpecialReqs] = useState<string>('')
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  if (amenities.length === 0) {
    return (
      <div className="rounded-2xl p-12 bg-white border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] text-center space-y-3 animate-fade-in">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center">
          <Ico n="calendar" c="w-7 h-7" />
        </div>
        <h3 className="font-display font-bold text-slate-800 text-lg">No hay áreas comunes registradas</h3>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          Aún no se han dado de alta amenidades o áreas comunes en el sistema. Puedes agregar un nuevo espacio recreativo en el Catálogo de Áreas Comunes.
        </p>
      </div>
    )
  }

  const activeAmenity = amenities.find(a => a.id === selectedAmenityId) || amenities[0]

  const dayBookings = bookings.filter(b => {
    if (!activeAmenity) return false
    const matchAmenity =
      (b.amenity && b.amenity.toLowerCase().includes(activeAmenity.name?.toLowerCase() || '')) ||
      b.amenityId === activeAmenity.id
    const matchDate = b.date === selectedDate || b.date.includes(selectedDate.split('-')[2] || '999')
    return matchAmenity && matchDate && b.status !== 'Cancelada' && b.status !== 'Rechazada'
  })

  function handleSlotClick(slot: string, isOccupied: boolean) {
    if (isOccupied || !activeAmenity.available) return
    setSelectedSlot(slot)
    setGuestsCount(Math.min(10, activeAmenity.capacity))
    setSpecialReqs('')
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
      guests: guestsCount,
      cost: activeAmenity.rate,
      deposit: activeAmenity.deposit || 'No aplica',
      specialRequests: specialReqs || undefined,
    })

    setModalOpen(false)
    setToastMsg(`¡Reserva creada para "${activeAmenity.name}" el ${selectedDate} en horario ${selectedSlot}!`)
    setTimeout(() => setToastMsg(null), 4500)
  }

  return (
    <div className="space-y-6">
      {toastMsg && (
        <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 text-xs sm:text-sm font-semibold flex items-center gap-3 animate-fade-in shadow-xs">
          <Ico n="check" c="w-5 h-5 text-teal-600 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Date Ribbon + Custom Picker */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h4 className="font-display font-bold text-slate-900 text-sm">Selecciona el Día de Consulta</h4>
            <p className="text-xs text-slate-500">Revisa la disponibilidad de horarios en tiempo real para cualquier fecha.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Otra fecha:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="px-3 py-1 text-xs rounded-xl bg-slate-50 border border-slate-200 font-mono font-medium focus:outline-none focus:border-teal-600"
            />
          </div>
        </div>

        <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-1 hide-scrollbar flex-nowrap pt-1 border-t border-slate-100">
          {DAYS_AHEAD.map(d => {
            const isSelected = selectedDate === d.fullDate
            return (
              <button
                key={d.fullDate}
                onClick={() => setSelectedDate(d.fullDate)}
                className={`flex-1 min-w-[76px] sm:min-w-[90px] p-2.5 sm:p-3 rounded-2xl text-center transition-all duration-200 cursor-pointer shrink-0 border ${
                  isSelected
                    ? 'bg-teal-700 text-white border-teal-800 shadow-sm ring-2 ring-teal-600/20'
                    : 'bg-slate-50 text-slate-700 border-slate-200/60 hover:border-slate-300 hover:bg-white'
                }`}
              >
                <p className={`text-[10px] uppercase tracking-wider font-semibold whitespace-nowrap ${isSelected ? 'text-teal-200' : 'text-slate-400'}`}>
                  {d.day}
                </p>
                <p className="text-lg sm:text-2xl font-display font-bold my-0.5 tracking-tight whitespace-nowrap">{d.num}</p>
                <span
                  className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md whitespace-nowrap ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-200/70 text-slate-600'
                  }`}
                >
                  {d.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Amenity Selector & Time Slot Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Amenity Picker */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-display font-bold text-slate-900 text-sm">
              Espacio Seleccionado:
            </h4>
            <span className="text-[11px] font-mono font-semibold text-teal-700">
              {amenities.length} Áreas
            </span>
          </div>

          <div className="space-y-2.5">
            {amenities.map(a => {
              const isSelected = selectedAmenityId === a.id
              return (
                <button
                  key={a.id}
                  onClick={() => setSelectedAmenityId(a.id)}
                  className={`w-full text-left p-3 rounded-2xl transition-all duration-200 border flex items-center gap-3.5 cursor-pointer ${
                    isSelected
                      ? 'bg-white border-teal-500 shadow-sm ring-2 ring-teal-500/20'
                      : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50 shadow-[0_1px_3px_rgba(0,0,0,0.02)]'
                  }`}
                >
                  <img src={a.img} alt={a.name} className="w-12 h-12 sm:w-13 sm:h-13 rounded-xl object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 text-sm leading-tight truncate">{a.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium whitespace-nowrap truncate inline-flex items-center gap-1">
                      <Ico n="users" c="w-3.5 h-3.5 text-slate-400" />
                      <span>{a.capacity} pers</span>
                      <span className="text-slate-300">·</span>
                      <span className="font-semibold text-teal-700">{a.rate}</span>
                    </p>
                    {!a.available && (
                      <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded mt-1 inline-flex items-center gap-1">
                        <Ico n="alertTriangle" c="w-3 h-3 text-amber-600" />
                        En Mantenimiento
                      </span>
                    )}
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
          <div className="rounded-2xl p-5 sm:p-6 bg-white border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_4px_16px_rgba(0,0,0,0.02)] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="min-w-0">
                <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-teal-700 whitespace-nowrap">
                  Disponibilidad de Franjas Horarias
                </span>
                <h3 className="font-display font-extrabold text-slate-900 text-xl sm:text-2xl mt-0.5 truncate">
                  {activeAmenity.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 font-medium truncate">
                  Fecha: <strong className="text-slate-800 font-semibold">{selectedDate}</strong> · Horario permitido: {activeAmenity.hours}
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs shrink-0">
                <span className="flex items-center gap-1.5 font-semibold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100">
                  <span className="w-2 h-2 rounded-full bg-teal-600" /> Libre
                </span>
                <span className="flex items-center gap-1.5 font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/60">
                  <span className="w-2 h-2 rounded-full bg-slate-400" /> Ocupado
                </span>
              </div>
            </div>

            {/* Slots Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TIME_SLOTS.map(slot => {
                const booked = dayBookings.find(b => b.time.includes(slot.split(' – ')[0]))
                const isOccupied = !!booked || !activeAmenity.available

                return (
                  <div
                    key={slot}
                    onClick={() => handleSlotClick(slot, isOccupied)}
                    className={`p-3.5 sm:p-4 rounded-xl border transition-all duration-200 flex items-center justify-between gap-2.5 ${
                      !activeAmenity.available
                        ? 'bg-amber-50/50 border-amber-200 text-amber-800 cursor-not-allowed'
                        : isOccupied
                        ? 'bg-slate-50 border-slate-200/70 text-slate-400 cursor-not-allowed'
                        : 'bg-white border-slate-200/80 hover:border-teal-500 hover:shadow-xs cursor-pointer group'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                      <div
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          !activeAmenity.available
                            ? 'bg-amber-100 text-amber-700'
                            : isOccupied
                            ? 'bg-slate-100 text-slate-400'
                            : 'bg-slate-100 text-slate-700 group-hover:bg-teal-50 group-hover:text-teal-700 transition-colors'
                        }`}
                      >
                        <Ico n="clock" c="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs sm:text-sm font-bold whitespace-nowrap truncate ${isOccupied ? 'text-slate-500' : 'text-slate-900'}`}>
                          {slot}
                        </p>
                        <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate">
                          {!activeAmenity.available
                            ? 'En Mantenimiento'
                            : isOccupied
                            ? `Ocupado (${booked?.unit})`
                            : 'Libre para agendar'}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {!activeAmenity.available ? (
                        <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-lg">
                          Fuera de serv.
                        </span>
                      ) : isOccupied ? (
                        <Badge text={booked?.status || 'Ocupado'} />
                      ) : (
                        <span className="text-xs font-bold text-teal-700 bg-teal-50 px-3 py-1.5 rounded-xl border border-teal-100 group-hover:bg-teal-700 group-hover:text-white transition-all shadow-2xs flex items-center gap-1 whitespace-nowrap">
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
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-teal-950 text-white shadow-sm space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="font-bold text-sm text-teal-300">{activeAmenity.name}</span>
              <span className="font-bold bg-teal-500/20 text-teal-200 px-2 py-0.5 rounded-md border border-teal-400/30">
                {activeAmenity.rate}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-white/80 pt-1">
              <p className="inline-flex items-center gap-1.5">
                <Ico n="calendar" c="w-3.5 h-3.5 text-teal-300" />
                <span>Fecha: <strong className="text-white font-mono">{selectedDate}</strong></span>
              </p>
              <p className="inline-flex items-center gap-1.5">
                <Ico n="clock" c="w-3.5 h-3.5 text-teal-300" />
                <span>Horario: <strong className="text-white font-mono">{selectedSlot}</strong></span>
              </p>
            </div>
            {activeAmenity.deposit && activeAmenity.deposit !== 'No aplica' && (
              <p className="text-[11px] text-amber-200 bg-amber-500/10 p-2 rounded-lg border border-amber-400/20 inline-flex items-center gap-1.5 w-full">
                <Ico n="shield" c="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span>Depósito en garantía: <strong>{activeAmenity.deposit}</strong></span>
              </p>
            )}
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

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Número de Invitados
              </label>
              <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md">
                Máx. {activeAmenity.capacity} pers.
              </span>
            </div>
            <input
              type="number"
              min={1}
              max={activeAmenity.capacity}
              value={guestsCount}
              onChange={e => setGuestsCount(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-600">
              Peticiones Especiales (Opcional)
            </label>
            <input
              value={specialReqs}
              onChange={e => setSpecialReqs(e.target.value)}
              placeholder="Ej. Ingreso de mobiliario externo o animador..."
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 border border-slate-200 text-slate-800"
            />
          </div>

          <div className="flex gap-3 pt-3">
            <Btn type="submit" className="flex-1 font-bold shadow-md">
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
