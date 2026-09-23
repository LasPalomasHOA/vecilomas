import { useState, useEffect } from 'react'
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

// ── Date Formatting & Local Time Helpers (Spanish) ─────────────────────────
function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function parseISODate(isoStr: string): Date {
  if (!isoStr || !/^\d{4}-\d{2}-\d{2}/.test(isoStr)) {
    return new Date()
  }
  const [y, m, d] = isoStr.substring(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d)
}

function getStartOfWeek(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay() // 0 = Dom, 1 = Lun, 2 = Mar... 6 = Sáb
  const diff = date.getDate() - day + (day === 0 ? -6 : 1) // Start on Monday
  const monday = new Date(date.setDate(diff))
  return monday
}

const SPANISH_DAYS_ABBR = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const SPANISH_DAYS_FULL = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const SPANISH_MONTHS_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const SPANISH_MONTHS_FULL = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

function formatDateFriendly(isoStr: string | null | undefined): string {
  if (!isoStr) return ''
  const d = parseISODate(isoStr)
  const dayName = SPANISH_DAYS_FULL[d.getDay()]
  const dayNum = d.getDate()
  const monthName = SPANISH_MONTHS_FULL[d.getMonth()]
  const year = d.getFullYear()
  return `${dayName}, ${dayNum} de ${monthName} de ${year}`
}

function isSlotInPast(dateISO: string | null, slot: string): boolean {
  if (!dateISO) return false
  const today = toISODate(new Date())
  if (dateISO < today) return true
  if (dateISO > today) return false

  const now = new Date()
  const currentHM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  const slotParts = slot.replace(/hrs/g, '').split(/[–-]/).map(s => s.trim())
  if (slotParts.length >= 2) {
    const slotEnd = slotParts[1].length === 5 ? slotParts[1] : slotParts[1].padStart(5, '0')
    return currentHM >= slotEnd
  }
  return false
}

interface WeekDay {
  fullDate: string
  dayAbbr: string
  dayNum: string
  label: string
  isToday: boolean
  isTomorrow: boolean
  isPast: boolean
  dateObj: Date
}

function generateWeekDays(startMondayStr: string): WeekDay[] {
  const today = new Date()
  const todayISO = toISODate(today)
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  const tomorrowISO = toISODate(tomorrow)
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  const yesterdayISO = toISODate(yesterday)

  const monday = parseISODate(startMondayStr)
  const days: WeekDay[] = []

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const iso = toISODate(d)
    const dayAbbr = SPANISH_DAYS_ABBR[d.getDay()]
    const dayNum = String(d.getDate()).padStart(2, '0')

    let label = `${d.getDate()} ${SPANISH_MONTHS_SHORT[d.getMonth()]}`
    if (iso === todayISO) label = 'Hoy'
    else if (iso === tomorrowISO) label = 'Mañana'
    else if (iso === yesterdayISO) label = 'Ayer'

    const isToday = iso === todayISO
    const isTomorrow = iso === tomorrowISO
    const isPast = iso < todayISO

    days.push({
      fullDate: iso,
      dayAbbr,
      dayNum,
      label,
      isToday,
      isTomorrow,
      isPast,
      dateObj: d,
    })
  }

  return days
}

function checkSlotOverlap(slot: string, bookingTime: string): boolean {
  if (!bookingTime) return false
  const slotParts = slot.replace(/hrs/g, '').split(/[–-]/).map(s => s.trim())
  const bookParts = bookingTime.replace(/hrs/g, '').split(/[–-]/).map(s => s.trim())
  if (slotParts.length < 2 || bookParts.length < 2) return false

  const sStart = slotParts[0].length === 5 ? slotParts[0] : slotParts[0].padStart(5, '0')
  const sEnd = slotParts[1].length === 5 ? slotParts[1] : slotParts[1].padStart(5, '0')
  const bStart = bookParts[0].length === 5 ? bookParts[0] : bookParts[0].padStart(5, '0')
  const bEnd = bookParts[1].length === 5 ? bookParts[1] : bookParts[1].padStart(5, '0')

  // Interval overlap: bStart < sEnd && bEnd > sStart
  return bStart < sEnd && bEnd > sStart
}

function normalizeDate(d: string | undefined): string {
  if (!d) return ''
  if (/^\d{4}-\d{2}-\d{2}/.test(d)) return d.substring(0, 10)
  return d
}

export function InteractiveCalendar({
  currentUnit = 'A-101',
  currentResident = 'Carlos Mendoza Ruiz',
}: {
  currentUnit?: string
  currentResident?: string
}) {
  const { amenities, bookings, addBooking } = useData()
  
  // Date states
  const todayISO = toISODate(new Date())
  const initialMondayISO = toISODate(getStartOfWeek(new Date()))

  const [selectedDate, setSelectedDate] = useState<string | null>(todayISO)
  const [weekStart, setWeekStart] = useState<string>(initialMondayISO)
  const [selectedAmenityId, setSelectedAmenityId] = useState<number>(amenities[0]?.id || 1)

  // Keep selected amenity synced if amenities list updates
  useEffect(() => {
    if (amenities.length > 0 && !amenities.some(a => a.id === selectedAmenityId)) {
      setSelectedAmenityId(amenities[0].id)
    }
  }, [amenities, selectedAmenityId])

  // Modal & form states
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<string>('')
  const [guestsCount, setGuestsCount] = useState<number>(2)
  const [specialReqs, setSpecialReqs] = useState<string>('')
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  // Generate the 7 days of the active week (Monday to Sunday)
  const weekDays = generateWeekDays(weekStart)

  // Calculate formatted range header (e.g. "21 – 27 de Septiembre, 2026")
  const firstDay = weekDays[0].dateObj
  const lastDay = weekDays[6].dateObj
  const rangeHeader = firstDay.getMonth() === lastDay.getMonth()
    ? `${firstDay.getDate()} – ${lastDay.getDate()} de ${SPANISH_MONTHS_FULL[firstDay.getMonth()]}, ${firstDay.getFullYear()}`
    : `${firstDay.getDate()} ${SPANISH_MONTHS_SHORT[firstDay.getMonth()]} – ${lastDay.getDate()} ${SPANISH_MONTHS_SHORT[lastDay.getMonth()]}, ${lastDay.getFullYear()}`

  // Helper: when navigating weeks, select Today only if in current week, else no selection
  function selectSmartDateForWeek(newWeek: WeekDay[]): string | null {
    const today = toISODate(new Date())
    const hasToday = newWeek.some(d => d.fullDate === today)
    if (hasToday) {
      return today
    }
    return null
  }

  // Week navigation handlers
  function handlePrevWeek() {
    const current = parseISODate(weekStart)
    current.setDate(current.getDate() - 7)
    const newStart = toISODate(current)
    setWeekStart(newStart)
    const newWeek = generateWeekDays(newStart)
    setSelectedDate(selectSmartDateForWeek(newWeek))
  }

  function handleNextWeek() {
    const current = parseISODate(weekStart)
    current.setDate(current.getDate() + 7)
    const newStart = toISODate(current)
    setWeekStart(newStart)
    const newWeek = generateWeekDays(newStart)
    setSelectedDate(selectSmartDateForWeek(newWeek))
  }

  function handleGoToday() {
    const now = new Date()
    const nowISO = toISODate(now)
    const monISO = toISODate(getStartOfWeek(now))
    setWeekStart(monISO)
    setSelectedDate(nowISO)
  }

  function handleDateInputChange(newDate: string) {
    if (!newDate) return
    setSelectedDate(newDate)
    const targetObj = parseISODate(newDate)
    const monObj = getStartOfWeek(targetObj)
    setWeekStart(toISODate(monObj))
  }

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
    if (!activeAmenity || !selectedDate) return false
    const matchAmenity =
      (b.amenity && b.amenity.toLowerCase().includes(activeAmenity.name?.toLowerCase() || '')) ||
      b.amenityId === activeAmenity.id
    const bDate = normalizeDate(b.date)
    const matchDate = bDate === selectedDate || (b.date && b.date.includes(selectedDate))
    return matchAmenity && matchDate && b.status !== 'Cancelada' && b.status !== 'Rechazada'
  })

  function handleSlotClick(slot: string, isOccupied: boolean, isPast: boolean) {
    if (isOccupied || isPast || !activeAmenity.available) return
    setSelectedSlot(slot)
    setGuestsCount(Math.min(2, activeAmenity.capacity))
    setSpecialReqs('')
    setModalOpen(true)
  }

  function handleScheduleBooking(e: React.FormEvent) {
    e.preventDefault()
    if (!activeAmenity || !selectedSlot || !selectedDate) return

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
    setToastMsg(`¡Reserva confirmada para "${activeAmenity.name}" el ${formatDateFriendly(selectedDate)} (${selectedSlot})!`)
    setTimeout(() => setToastMsg(null), 5000)
  }

  return (
    <div className="space-y-6">
      {toastMsg && (
        <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 text-xs sm:text-sm font-semibold flex items-center justify-between gap-3 animate-fade-in shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <Ico n="check" c="w-5 h-5 text-teal-600 shrink-0" />
            <span className="truncate">{toastMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMsg(null)}
            className="p-1 text-teal-700 hover:text-teal-900 cursor-pointer"
          >
            <Ico n="x" c="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Date Ribbon + Custom Picker + Symmetrical 7-Day Grid */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3.5">
        {/* Header Controls */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-display font-bold text-slate-900 text-sm sm:text-base">Selecciona el Día de Consulta</h4>
              <span className="text-[11px] font-semibold text-teal-800 bg-teal-50 border border-teal-200/70 px-2.5 py-0.5 rounded-md">
                {rangeHeader}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Revisa la disponibilidad de horarios en tiempo real para cualquier fecha.</p>
          </div>

          {/* Quick Actions & Date Input */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Week Nav Group */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={handlePrevWeek}
                className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-all cursor-pointer"
                title="Semana anterior"
              >
                <Ico n="chevronLeft" c="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleGoToday}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                  selectedDate === todayISO
                    ? 'bg-white text-teal-800 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                }`}
                title="Ir a esta semana / hoy"
              >
                <Ico n="calendar" c="w-3.5 h-3.5 text-teal-600" />
                <span>Hoy</span>
              </button>

              <button
                type="button"
                onClick={handleNextWeek}
                className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-all cursor-pointer"
                title="Semana siguiente"
              >
                <Ico n="chevronRight" c="w-4 h-4" />
              </button>
            </div>

            {/* Date Input */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
              <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Otra fecha:</span>
              <input
                type="date"
                value={selectedDate || ''}
                onChange={e => handleDateInputChange(e.target.value)}
                className="bg-transparent text-xs font-mono font-bold text-slate-800 focus:outline-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Symmetrical 7-Day Grid with Lateral Navigation Buttons */}
        <div className="relative pt-1 border-t border-slate-100 flex items-center gap-1.5 sm:gap-2.5">
          {/* Lateral Prev Button */}
          <button
            type="button"
            onClick={handlePrevWeek}
            className="shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-50 hover:bg-teal-50 border border-slate-200/80 hover:border-teal-300 text-slate-600 hover:text-teal-700 shadow-2xs flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95"
            title="Semana anterior"
          >
            <Ico n="chevronLeft" c="w-4 h-4" />
          </button>

          {/* 7 Days Grid */}
          <div className="flex-1 overflow-x-auto hide-scrollbar">
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5 min-w-[540px] sm:min-w-0">
              {weekDays.map(d => {
                const isSelected = selectedDate === d.fullDate
                
                // Count bookings on this specific day for active amenity
                const bookingsOnDay = bookings.filter(b => {
                  if (!activeAmenity) return false
                  const matchAmenity =
                    (b.amenity && b.amenity.toLowerCase().includes(activeAmenity.name?.toLowerCase() || '')) ||
                    b.amenityId === activeAmenity.id
                  const bDate = normalizeDate(b.date)
                  return matchAmenity && bDate === d.fullDate && b.status !== 'Cancelada' && b.status !== 'Rechazada'
                }).length

                return (
                  <button
                    key={d.fullDate}
                    type="button"
                    onClick={() => setSelectedDate(d.fullDate)}
                    className={`w-full p-2.5 sm:p-3 rounded-2xl text-center transition-all duration-200 cursor-pointer border relative ${
                      isSelected
                        ? 'bg-teal-700 text-white border-teal-800 shadow-sm ring-2 ring-teal-600/20 scale-[1.01]'
                        : d.isPast
                        ? 'bg-slate-50/70 text-slate-500 border-slate-200/50 hover:bg-white hover:border-slate-300'
                        : 'bg-slate-50 text-slate-700 border-slate-200/60 hover:border-teal-400 hover:bg-white shadow-[0_1px_2px_rgba(0,0,0,0.01)]'
                    }`}
                  >
                    {/* Today subtle indicator dot if not selected */}
                    {d.isToday && !isSelected && (
                      <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-teal-500 ring-1 ring-white" title="Hoy" />
                    )}

                    <p className={`text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold whitespace-nowrap ${isSelected ? 'text-teal-200' : 'text-slate-400'}`}>
                      {d.dayAbbr.toUpperCase()}
                    </p>
                    
                    <p className="text-lg sm:text-2xl font-display font-bold my-0.5 tracking-tight whitespace-nowrap">
                      {d.dayNum}
                    </p>

                    <div className="flex flex-col items-center gap-1">
                      <span
                        className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md whitespace-nowrap ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : d.isToday
                            ? 'bg-teal-100 text-teal-800 font-bold'
                            : 'bg-slate-200/70 text-slate-600'
                        }`}
                      >
                        {d.label}
                      </span>

                      {/* Booking Availability indicator badge */}
                      {bookingsOnDay > 0 && (
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full whitespace-nowrap flex items-center gap-0.5 ${
                            isSelected
                              ? 'bg-teal-900/60 text-teal-100'
                              : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                          }`}
                          title={`${bookingsOnDay} reserva(s) registrada(s)`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-teal-300' : 'bg-amber-500'}`} />
                          {bookingsOnDay} res
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Lateral Next Button */}
          <button
            type="button"
            onClick={handleNextWeek}
            className="shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-50 hover:bg-teal-50 border border-slate-200/80 hover:border-teal-300 text-slate-600 hover:text-teal-700 shadow-2xs flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95"
            title="Semana siguiente"
          >
            <Ico n="chevronRight" c="w-4 h-4" />
          </button>
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
            <span className="text-[11px] font-mono font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
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
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  {selectedDate ? (
                    <>
                      Fecha: <strong className="text-slate-800 font-semibold capitalize">{formatDateFriendly(selectedDate)}</strong> · Horario permitido: {activeAmenity.hours}
                    </>
                  ) : (
                    <>Horario permitido: {activeAmenity.hours} · Capacidad máxima: {activeAmenity.capacity} personas</>
                  )}
                </p>
              </div>

              {selectedDate && (
                <div className="flex items-center gap-2 text-xs shrink-0">
                  <span className="flex items-center gap-1.5 font-semibold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100">
                    <span className="w-2 h-2 rounded-full bg-teal-600" /> Libre
                  </span>
                  <span className="flex items-center gap-1.5 font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/60">
                    <span className="w-2 h-2 rounded-full bg-slate-400" /> Ocupado
                  </span>
                </div>
              )}
            </div>

            {/* If no date selected, show friendly empty state */}
            {!selectedDate ? (
              <div className="py-12 px-6 text-center space-y-3 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 animate-fade-in">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center shadow-2xs">
                  <Ico n="calendar" c="w-6 h-6" />
                </div>
                <div className="max-w-sm mx-auto">
                  <h4 className="font-display font-bold text-slate-800 text-sm sm:text-base">
                    Selecciona un día en la barra superior
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Haz clic en cualquiera de los 7 días de la semana para consultar las franjas horarias y disponibilidad de <strong className="text-slate-700">{activeAmenity.name}</strong>.
                  </p>
                </div>
              </div>
            ) : (
              /* Slots Grid */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {TIME_SLOTS.map(slot => {
                  const booked = dayBookings.find(b => checkSlotOverlap(slot, b.time))
                  const isOccupied = !!booked || !activeAmenity.available
                  const isPast = isSlotInPast(selectedDate, slot)

                  return (
                    <div
                      key={slot}
                      onClick={() => handleSlotClick(slot, isOccupied, isPast)}
                      className={`p-3.5 sm:p-4 rounded-xl border transition-all duration-200 flex items-center justify-between gap-2.5 ${
                        !activeAmenity.available
                          ? 'bg-amber-50/50 border-amber-200 text-amber-800 cursor-not-allowed'
                          : isOccupied
                          ? 'bg-slate-50 border-slate-200/70 text-slate-400 cursor-not-allowed'
                          : isPast
                          ? 'bg-slate-50/60 border-slate-200/50 text-slate-400 cursor-not-allowed'
                          : 'bg-white border-slate-200/80 hover:border-teal-500 hover:shadow-xs cursor-pointer group'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                        <div
                          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            !activeAmenity.available
                              ? 'bg-amber-100 text-amber-700'
                              : isOccupied || isPast
                              ? 'bg-slate-100 text-slate-400'
                              : 'bg-slate-100 text-slate-700 group-hover:bg-teal-50 group-hover:text-teal-700 transition-colors'
                          }`}
                        >
                          <Ico n="clock" c="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs sm:text-sm font-bold whitespace-nowrap truncate ${isOccupied || isPast ? 'text-slate-500' : 'text-slate-900'}`}>
                            {slot}
                          </p>
                          <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate">
                            {!activeAmenity.available
                              ? 'En Mantenimiento'
                              : isOccupied
                              ? `Ocupado (${booked?.unit})`
                              : isPast
                              ? 'Horario Concluido'
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
                        ) : isPast ? (
                          <span className="text-[11px] font-medium text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">
                            Pasado
                          </span>
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
            )}
          </div>
        </div>
      </div>

      {/* Modal Quick Reserve */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Confirmar Apartado — ${activeAmenity.name}`}
        subtitle={`Fecha: ${formatDateFriendly(selectedDate)} | Horario: ${selectedSlot}`}
      >
        <form onSubmit={handleScheduleBooking} className="space-y-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-teal-950 text-white shadow-sm space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="font-bold text-sm text-teal-300">{activeAmenity.name}</span>
              <span className="font-bold bg-teal-500/20 text-teal-200 px-2 py-0.5 rounded-md border border-teal-400/30">
                {activeAmenity.rate}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-white/80 pt-1">
              <p className="inline-flex items-center gap-1.5 truncate">
                <Ico n="calendar" c="w-3.5 h-3.5 text-teal-300 shrink-0" />
                <span className="truncate">Fecha: <strong className="text-white capitalize">{formatDateFriendly(selectedDate)}</strong></span>
              </p>
              <p className="inline-flex items-center gap-1.5">
                <Ico n="clock" c="w-3.5 h-3.5 text-teal-300 shrink-0" />
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
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600"
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
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600"
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
