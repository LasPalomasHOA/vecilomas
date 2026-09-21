import { useState } from 'react'
import type { Amenity } from '@/types/amenities'
import { BRAND_COLORS } from '@/types'
import { useData } from '@/context/DataContext'
import Modal from '@/components/common/Modal'
import Ico from '@/components/common/Icons'
import BookingRulesModal from '@/modules/amenities/BookingRulesModal'
import AmenityFormModal from '@/modules/amenities/AmenityFormModal'

interface AmenityCatalogProps {
  currentUnit?: string
  currentResidentName?: string
  onBookingSuccess?: () => void
  isAdmin?: boolean
}

export function AmenityCatalog({
  currentUnit = 'A-101',
  currentResidentName = 'Carlos Mendoza Ruiz',
  onBookingSuccess,
  isAdmin = false,
}: AmenityCatalogProps) {
  const {
    amenities,
    addBooking,
    residents,
    addAmenity,
    updateAmenity,
    deleteAmenity,
    toggleAmenityAvailability,
  } = useData()

  const [selectedAmenityForRules, setSelectedAmenityForRules] = useState<Amenity | null>(null)
  const [bookingAmenity, setBookingAmenity] = useState<Amenity | null>(null)
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [editingAmenity, setEditingAmenity] = useState<Amenity | null>(null)
  const [deletingAmenity, setDeletingAmenity] = useState<Amenity | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Booking Form State
  const [form, setForm] = useState({
    resident: currentResidentName,
    unit: currentUnit,
    date: new Date().toISOString().split('T')[0],
    startTime: '16:00',
    endTime: '20:00',
    guests: 10,
    specialRequests: '',
    acceptedRules: true,
  })

  function showToast(msg: string) {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  function handleOpenBooking(a: Amenity) {
    setBookingAmenity(a)
    setStep(1)
    setForm(prev => ({
      ...prev,
      resident: currentResidentName,
      unit: currentUnit,
      guests: Math.min(10, a.capacity),
      acceptedRules: true,
    }))
  }

  function handleConfirmBooking(e: React.FormEvent) {
    e.preventDefault()
    if (!bookingAmenity) return

    addBooking({
      amenityId: bookingAmenity.id,
      amenity: bookingAmenity.name,
      resident: form.resident,
      unit: form.unit,
      date: form.date,
      time: `${form.startTime} – ${form.endTime}`,
      guests: Number(form.guests),
      cost: bookingAmenity.rate,
      deposit: bookingAmenity.deposit || 'No aplica',
      specialRequests: form.specialRequests || undefined,
    })

    const name = bookingAmenity.name
    setBookingAmenity(null)
    showToast(`¡Reservación para "${name}" enviada exitosamente! Revisa tu pase en "Mis Reservaciones".`)
    if (onBookingSuccess) onBookingSuccess()
  }

  function handleOpenCreate() {
    setEditingAmenity(null)
    setIsFormModalOpen(true)
  }

  function handleOpenEdit(a: Amenity) {
    setEditingAmenity(a)
    setIsFormModalOpen(true)
  }

  function handleSaveAmenity(data: Omit<Amenity, 'id'> | Amenity) {
    if ('id' in data) {
      updateAmenity(data as Amenity)
      showToast(`¡Amenidad "${data.name}" actualizada con éxito!`)
    } else {
      addAmenity(data)
      showToast(`¡Nueva amenidad "${data.name}" registrada con éxito!`)
    }
  }

  function handleDeleteConfirm() {
    if (!deletingAmenity) return
    const name = deletingAmenity.name
    deleteAmenity(deletingAmenity.id)
    setDeletingAmenity(null)
    showToast(`Amenidad "${name}" eliminada del catálogo.`)
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 text-xs sm:text-sm font-bold flex items-center gap-3 animate-fade-in shadow-xs">
          <Ico n="check" c="w-5 h-5 text-teal-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Admin Action Bar */}
      {isAdmin && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div>
            <h3 className="font-display font-bold text-slate-900 text-base">
              Catálogo de Espacios y Áreas Comunes
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Administra las amenidades, cuotas de uso por evento, horarios y disponibilidad.
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#008080] hover:bg-[#006666] text-white font-bold text-xs shadow-xs transition-colors cursor-pointer shrink-0"
          >
            <Ico n="plus" c="w-4 h-4" />
            <span>+ Nueva Amenidad</span>
          </button>
        </div>
      )}

      {/* Header Intro */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div>
          <h3 className="font-display font-bold text-slate-900 text-base">Espacios Disponibles para Residentes</h3>
          <p className="text-xs text-slate-500 mt-0.5">Explora amenidades de primera clase, revisa equipamiento, capacidad y reserva al instante.</p>
        </div>
        <span className="text-xs font-mono font-bold text-teal-700 bg-teal-50 px-3 py-1 rounded-xl border border-teal-100">
          {amenities.filter(a => a.available).length} de {amenities.length} Activas
        </span>
      </div>

      {/* Catalog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {amenities.map(a => (
          <div
            key={a.id}
            className={`rounded-2xl overflow-hidden transition-all duration-300 bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_4px_16px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_32px_rgba(0,128,128,0.1)] hover:border-teal-500/40 hover:-translate-y-1 flex flex-col justify-between group ${
              !a.available ? 'opacity-80' : ''
            }`}
          >
            {/* Image Box */}
            <div className="h-52 relative overflow-hidden">
              <img
                src={a.img}
                alt={a.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(to top, rgba(15, 23, 42, 0.92) 0%, rgba(15, 23, 42, 0.3) 55%, transparent 100%)',
                }}
              />

              {/* Status Pill */}
              <span
                className={`absolute top-3.5 right-3.5 text-[11px] font-bold px-3 py-1 rounded-full text-white backdrop-blur-md border shadow-xs ${
                  a.available
                    ? 'bg-teal-600/90 border-teal-400/40 text-teal-50'
                    : 'bg-amber-600/90 border-amber-400/40 text-amber-50'
                }`}
              >
                {a.available ? (
                  <span className="inline-flex items-center gap-1">
                    <Ico n="check" c="w-3.5 h-3.5" />
                    Disponible
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1">
                    <Ico n="alertTriangle" c="w-3.5 h-3.5" />
                    En Mantenimiento
                  </span>
                )}
              </span>

              <div className="absolute bottom-3.5 left-4 right-4">
                <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-teal-300">
                  ÁREA RESIDENCIAL EXCLUSIVA
                </span>
                <h4 className="font-display font-extrabold text-white text-lg leading-tight drop-shadow-sm mt-0.5">
                  {a.name}
                </h4>
                {a.subtitle && (
                  <p className="text-xs text-white/80 line-clamp-1 mt-0.5 font-normal">
                    {a.subtitle}
                  </p>
                )}
              </div>
            </div>

            {/* Info details */}
            <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
              {/* Features Chips */}
              {a.features && a.features.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {a.features.slice(0, 3).map((f, i) => (
                    <span
                      key={i}
                      className="text-[11px] font-medium text-slate-600 bg-slate-100/90 px-2.5 py-0.5 rounded-lg border border-slate-200/50"
                    >
                      {f}
                    </span>
                  ))}
                  {a.features.length > 3 && (
                    <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-lg">
                      +{a.features.length - 3} más
                    </span>
                  )}
                </div>
              )}

              {/* Key Specs */}
              <div className="space-y-2 text-xs bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-slate-500 font-medium">Capacidad máxima:</span>
                  <span className="font-bold text-slate-800 bg-white px-2.5 py-0.5 rounded-md border border-slate-200/60 shadow-2xs inline-flex items-center gap-1.5">
                    <Ico n="users" c="w-3.5 h-3.5 text-slate-400" />
                    Hasta {a.capacity} pers.
                  </span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-slate-500 font-medium">Horario de servicio:</span>
                  <span className="font-mono font-semibold text-slate-700 inline-flex items-center gap-1.5">
                    <Ico n="clock" c="w-3.5 h-3.5 text-slate-400" />
                    {a.hours}
                  </span>
                </div>
                <div className="flex justify-between items-center py-0.5 pt-1 border-t border-slate-200/60">
                  <span className="text-slate-500 font-medium">Cuota de reservación:</span>
                  <span className="font-bold text-teal-800 text-xs sm:text-sm bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
                    {a.rate}
                  </span>
                </div>
                {a.deposit && a.deposit !== 'No aplica' && (
                  <div className="flex justify-between items-center py-0.5 text-[11px] text-slate-400">
                    <span>Depósito en garantía:</span>
                    <span className="font-medium text-slate-600">{a.deposit}</span>
                  </div>
                )}
              </div>

              {/* Maintenance note if any */}
              {!a.available && a.maintenanceNote && (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 font-medium flex items-center gap-2">
                  <Ico n="info" c="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{a.maintenanceNote}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                {isAdmin ? (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(a)}
                      className="flex-1 py-1.5 px-2 rounded-xl text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer text-center"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleAmenityAvailability(a.id)}
                      className={`py-1.5 px-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                        a.available
                          ? 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                      }`}
                    >
                      {a.available ? 'Pausar' : 'Activar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingAmenity(a)}
                      className="py-1.5 px-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 border border-red-200 transition-colors cursor-pointer"
                      title="Eliminar amenidad"
                    >
                      <Ico n="x" c="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedAmenityForRules(a)}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      Reglamento
                    </button>
                    <button
                      type="button"
                      disabled={!a.available}
                      onClick={() => handleOpenBooking(a)}
                      className="flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white transition-all shadow-[0_4px_14px_rgba(0,128,128,0.22)] hover:brightness-110 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap justify-center flex items-center gap-1.5"
                      style={
                        a.available
                          ? {
                              background: `linear-gradient(135deg, ${BRAND_COLORS.primary}, ${BRAND_COLORS.primaryDark})`,
                            }
                          : { backgroundColor: '#f1f5f9', color: '#94a3b8' }
                      }
                    >
                      <Ico n="calendar" c="w-4 h-4" />
                      <span>{a.available ? 'Apartar Espacio' : 'Fuera de Servicio'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Amenity Create / Edit Modal (Admin) */}
      <AmenityFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleSaveAmenity}
        editingAmenity={editingAmenity}
      />

      {/* Delete Confirmation Modal (Admin) */}
      {deletingAmenity && (
        <Modal
          isOpen={true}
          onClose={() => setDeletingAmenity(null)}
          title="Eliminar Amenidad"
          subtitle={`¿Estás seguro de que deseas eliminar "${deletingAmenity.name}" del catálogo?`}
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600">
              Esta acción eliminará el espacio del catálogo y no estará disponible para nuevas reservaciones.
            </p>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Sí, Eliminar Amenidad
              </button>
              <button
                type="button"
                onClick={() => setDeletingAmenity(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Rules Modal */}
      <BookingRulesModal
        amenity={selectedAmenityForRules}
        onClose={() => setSelectedAmenityForRules(null)}
      />

      {/* Multi-Step Booking Wizard Modal */}
      <Modal
        isOpen={!!bookingAmenity}
        onClose={() => setBookingAmenity(null)}
        title={bookingAmenity ? `Reservación: ${bookingAmenity.name}` : 'Reservar Espacio'}
        subtitle={`Paso ${step} de 3 — ${step === 1 ? 'Fecha y Horario' : step === 2 ? 'Detalles e Invitados' : 'Confirmación de Apartado'}`}
      >
        {bookingAmenity && (
          <form onSubmit={handleConfirmBooking} className="space-y-4">
            {/* Step Progress Indicators */}
            <div className="grid grid-cols-3 gap-2 pb-1">
              {[
                { s: 1, label: '1. Fecha y Hora', desc: 'Horario' },
                { s: 2, label: '2. Invitados', desc: 'Aforo' },
                { s: 3, label: '3. Resumen', desc: 'Pase QR' },
              ].map(st => (
                <button
                  type="button"
                  key={st.s}
                  onClick={() => {
                    if (st.s < step) setStep(st.s as 1 | 2 | 3)
                  }}
                  disabled={st.s > step}
                  className={`text-center py-2 px-1 rounded-xl text-xs font-semibold transition-all duration-200 ${
                    step === st.s
                      ? 'bg-teal-700 text-white shadow-xs'
                      : step > st.s
                      ? 'bg-teal-50 text-teal-800 border border-teal-200/80 cursor-pointer hover:bg-teal-100/70'
                      : 'text-slate-400 bg-slate-50/80 border border-slate-100 cursor-not-allowed'
                  }`}
                >
                  <span className="block truncate">{st.label}</span>
                </button>
              ))}
            </div>

            {/* STEP 1: Date & Time */}
            {step === 1 && (
              <div className="space-y-3.5 animate-fade-in">
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-teal-50/80 via-slate-50 to-teal-50/80 border border-teal-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Cuota requerida:</span>
                    <p className="font-bold text-teal-800 text-sm mt-0.5">{bookingAmenity.rate}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Horario permitido:</span>
                    <p className="font-semibold text-slate-700 text-xs mt-0.5 font-mono">{bookingAmenity.hours}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-700">
                    Fecha de la Reservación
                  </label>
                  <div className="relative">
                    <input
                      required
                      type="date"
                      value={form.date}
                      onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50/70 border border-slate-200 focus:bg-white focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 focus:outline-none transition-all font-mono font-semibold text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-700">
                      Hora de Inicio
                    </label>
                    <input
                      required
                      type="time"
                      value={form.startTime}
                      onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50/70 border border-slate-200 focus:bg-white focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 focus:outline-none transition-all font-mono font-semibold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-700">
                      Hora de Término
                    </label>
                    <input
                      required
                      type="time"
                      value={form.endTime}
                      onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50/70 border border-slate-200 focus:bg-white focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 focus:outline-none transition-all font-mono font-semibold text-slate-800"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="w-full py-2.5 rounded-xl font-bold text-sm bg-teal-700 hover:bg-teal-800 active:scale-[0.99] text-white transition-all duration-150 shadow-md cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Continuar al Paso 2</span>
                    <Ico n="chevron" c="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Guests & Requests */}
            {step === 2 && (
              <div className="space-y-3.5 animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-700">
                      Unidad / Depto
                    </label>
                    <select
                      value={form.unit}
                      onChange={e => {
                        const u = e.target.value
                        const res = residents.find(r => r.unit === u)
                        setForm(f => ({ ...f, unit: u, resident: res ? res.name : f.resident }))
                      }}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50/70 border border-slate-200 font-semibold text-slate-800 focus:bg-white focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 focus:outline-none cursor-pointer"
                    >
                      {residents.map(r => (
                        <option key={r.id} value={r.unit}>
                          {r.unit} — {r.name.split(' ')[0]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-700">
                      Nombre del Titular
                    </label>
                    <input
                      required
                      value={form.resident}
                      onChange={e => setForm(f => ({ ...f, resident: e.target.value }))}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50/70 border border-slate-200 font-semibold text-slate-800 focus:bg-white focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                      Número Estimado de Invitados
                    </label>
                    <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
                      Aforo máx. {bookingAmenity.capacity} pers.
                    </span>
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={bookingAmenity.capacity}
                    value={form.guests}
                    onChange={e => setForm(f => ({ ...f, guests: Number(e.target.value) }))}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50/70 border border-slate-200 font-mono font-bold text-slate-800 focus:bg-white focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-700">
                    Peticiones Especiales / Notas para Caseta (Opcional)
                  </label>
                  <input
                    value={form.specialRequests}
                    onChange={e => setForm(f => ({ ...f, specialRequests: e.target.value }))}
                    placeholder="Ej. Ingresará personal de catering o animadores..."
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50/70 border border-slate-200 text-slate-800 focus:bg-white focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 focus:outline-none"
                  />
                </div>

                <label className="flex items-start gap-2.5 p-3 rounded-2xl bg-teal-50/70 border border-teal-200/80 text-xs font-medium text-teal-950 cursor-pointer hover:bg-teal-50 transition-colors">
                  <input
                    type="checkbox"
                    required
                    checked={form.acceptedRules}
                    onChange={e => setForm(f => ({ ...f, acceptedRules: e.target.checked }))}
                    className="rounded text-teal-700 focus:ring-teal-600 w-4 h-4 mt-0.5 cursor-pointer"
                  />
                  <span>
                    He leído y me comprometo a cumplir el <strong>Reglamento de Uso y Convivencia</strong> del espacio.
                  </span>
                </label>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                  >
                    ← Volver
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-teal-700 hover:bg-teal-800 active:scale-[0.99] text-white transition-all duration-150 shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Revisar Resumen</span>
                    <Ico n="chevron" c="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Summary & Submit */}
            {step === 3 && (
              <div className="space-y-3.5 animate-fade-in">
                <div className="p-4.5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 text-white shadow-xl space-y-3.5 border border-slate-700/50">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono text-teal-300 uppercase tracking-widest font-bold">
                        RESUMEN DE RESERVACIÓN
                      </span>
                      <h4 className="font-display font-bold text-lg leading-tight mt-0.5">{bookingAmenity.name}</h4>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-teal-500/20 text-teal-200 border border-teal-400/30">
                      {bookingAmenity.rate}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs pt-3 border-t border-white/10">
                    <div>
                      <span className="text-white/60 text-[10px] uppercase font-bold">Fecha Apartada:</span>
                      <p className="font-semibold text-white mt-0.5 font-mono inline-flex items-center gap-1.5">
                        <Ico n="calendar" c="w-3.5 h-3.5 text-teal-300" />
                        {form.date}
                      </p>
                    </div>
                    <div>
                      <span className="text-white/60 text-[10px] uppercase font-bold">Horario:</span>
                      <p className="font-semibold text-white mt-0.5 font-mono inline-flex items-center gap-1.5">
                        <Ico n="clock" c="w-3.5 h-3.5 text-teal-300" />
                        {form.startTime} – {form.endTime}
                      </p>
                    </div>
                    <div>
                      <span className="text-white/60 text-[10px] uppercase font-bold">Titular / Unidad:</span>
                      <p className="font-semibold text-white mt-0.5 inline-flex items-center gap-1.5">
                        <Ico n="user" c="w-3.5 h-3.5 text-teal-300" />
                        {form.resident} ({form.unit})
                      </p>
                    </div>
                    <div>
                      <span className="text-white/60 text-[10px] uppercase font-bold">Aforo Invitados:</span>
                      <p className="font-semibold text-white mt-0.5 inline-flex items-center gap-1.5">
                        <Ico n="users" c="w-3.5 h-3.5 text-teal-300" />
                        {form.guests} personas
                      </p>
                    </div>
                  </div>

                  {bookingAmenity.deposit && bookingAmenity.deposit !== 'No aplica' && (
                    <p className="text-[11px] text-amber-200 bg-amber-500/10 p-2.5 rounded-xl border border-amber-400/20 leading-relaxed inline-flex items-center gap-1.5 w-full">
                      <Ico n="shield" c="w-3.5 h-3.5 text-amber-300 shrink-0" />
                      <span>Depósito en garantía: <strong>{bookingAmenity.deposit}</strong> (Reembolsable tras el evento)</span>
                    </p>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                  >
                    ← Modificar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-teal-700 hover:bg-teal-800 active:scale-[0.99] text-white transition-all duration-150 shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Ico n="check" c="w-4 h-4" />
                    <span>Confirmar y Solicitar Apartado</span>
                  </button>
                </div>
              </div>
            )}
          </form>
        )}
      </Modal>
    </div>
  )
}
export default AmenityCatalog
