import { useState } from 'react'
import type { Amenity } from '@/types/amenities'
import { BRAND_COLORS } from '@/types'
import { useData } from '@/context/DataContext'
import { GLASS_STYLES } from '@/components/common/Card'
import Modal from '@/components/common/Modal'
import Btn from '@/components/common/Button'
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
  currentResidentName = 'Carlos Mendoza',
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
  const [selectedAmenityForBooking, setSelectedAmenityForBooking] = useState<Amenity | null>(null)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [editingAmenity, setEditingAmenity] = useState<Amenity | null>(null)
  const [deletingAmenity, setDeletingAmenity] = useState<Amenity | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Booking Form
  const [form, setForm] = useState({
    resident: currentResidentName,
    unit: currentUnit,
    date: new Date().toISOString().split('T')[0],
    startTime: '16:00',
    endTime: '20:00',
    guests: 10,
  })

  function showToast(msg: string) {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  function handleOpenBooking(a: Amenity) {
    setSelectedAmenityForBooking(a)
    setForm(prev => ({ ...prev, guests: Math.min(prev.guests, a.capacity) }))
  }

  function handleConfirmBooking(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedAmenityForBooking) return

    addBooking({
      amenityId: selectedAmenityForBooking.id,
      amenity: selectedAmenityForBooking.name,
      resident: form.resident,
      unit: form.unit,
      date: form.date,
      time: `${form.startTime} – ${form.endTime}`,
      guests: Number(form.guests),
      cost: selectedAmenityForBooking.rate,
    })

    const amenityName = selectedAmenityForBooking.name
    setSelectedAmenityForBooking(null)
    showToast(`¡Solicitud de reservación para "${amenityName}" registrada con éxito!`)
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
          <Ico n="check" c="w-5 h-5 text-teal-600" />
          {toastMessage}
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

      {/* Catalog Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {amenities.map(a => (
          <div
            key={a.id}
            className={`rounded-2xl overflow-hidden transition-all duration-200 bg-white border border-teal-950/[0.08] shadow-[0_1px_3px_rgba(0,51,51,0.03),0_6px_20px_rgba(0,51,51,0.04)] hover:shadow-[0_12px_30px_rgba(0,51,51,0.08)] hover:border-teal-500/30 flex flex-col justify-between group ${
              !a.available ? 'opacity-85' : ''
            }`}
          >
            {/* Image Box */}
            <div className="h-48 relative overflow-hidden">
              <img
                src={a.img}
                alt={a.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(to top, rgba(0, 35, 35, 0.92) 0%, rgba(0, 51, 51, 0.2) 60%, transparent 100%)',
                }}
              />

              {/* Status Pill */}
              <span
                className={`absolute top-3 right-3 text-xs font-bold px-3 py-1 rounded-full text-white backdrop-blur-md border border-white/25 shadow-xs ${
                  a.available ? 'bg-teal-700/90' : 'bg-slate-700/90'
                }`}
              >
                {a.available ? '✓ Disponible' : 'En Mantenimiento'}
              </span>

              <div className="absolute bottom-3 left-4 right-4">
                <p className="text-[10px] font-mono text-teal-300 uppercase tracking-widest font-bold">
                  ÁREA RESIDENCIAL
                </p>
                <h4 className="font-display font-black text-white text-lg leading-tight drop-shadow-xs">
                  {a.name}
                </h4>
              </div>
            </div>

            {/* Info details */}
            <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
              <div className="space-y-2 text-xs mb-4">
                <div className="flex justify-between items-center py-1.5 border-b border-teal-950/[0.05] gap-2">
                  <span className="text-slate-500 font-medium whitespace-nowrap">Capacidad máxima</span>
                  <span className="font-bold text-slate-800 bg-slate-100/80 px-2.5 py-0.5 rounded-lg whitespace-nowrap shrink-0 border border-slate-200/60">
                    👥 {a.capacity} personas
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-teal-950/[0.05] gap-2">
                  <span className="text-slate-500 font-medium whitespace-nowrap">Horario habilitado</span>
                  <span className="font-mono font-bold text-slate-700 whitespace-nowrap shrink-0">⏰ {a.hours}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 gap-2">
                  <span className="text-slate-500 font-medium whitespace-nowrap">Cuota de reservación</span>
                  <span className="font-extrabold text-[#008080] text-sm whitespace-nowrap shrink-0 bg-teal-50 px-2.5 py-0.5 rounded-lg border border-teal-200/70 shadow-2xs">
                    {a.rate}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-teal-950/[0.06] space-y-2">
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
                      className="flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold text-white transition-all shadow-[0_4px_14px_rgba(0,128,128,0.22)] hover:brightness-110 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap justify-center"
                      style={
                        a.available
                          ? {
                              background: `linear-gradient(135deg, ${BRAND_COLORS.primary}, ${BRAND_COLORS.primaryDark})`,
                            }
                          : { backgroundColor: '#f1f5f9', color: '#94a3b8' }
                      }
                    >
                      {a.available ? 'Apartar Espacio' : 'No Disponible'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Amenity Create / Edit Modal */}
      <AmenityFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleSaveAmenity}
        editingAmenity={editingAmenity}
      />

      {/* Delete Confirmation Modal */}
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

      {/* Booking Form Modal */}
      <Modal
        isOpen={!!selectedAmenityForBooking}
        onClose={() => setSelectedAmenityForBooking(null)}
        title={selectedAmenityForBooking ? `Reservar ${selectedAmenityForBooking.name}` : 'Reservar'}
        subtitle="Ingresa la fecha, rango de horas y número de invitados estimados."
      >
        {selectedAmenityForBooking && (
          <form onSubmit={handleConfirmBooking} className="space-y-4">
            <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-between text-xs">
              <div>
                <p className="text-teal-800 font-mono uppercase font-bold text-[10px]">Cuota requerida:</p>
                <p className="font-extrabold text-teal-950 text-base mt-0.5">{selectedAmenityForBooking.rate}</p>
              </div>
              <div className="text-right">
                <p className="text-teal-800 font-mono uppercase font-bold text-[10px]">Capacidad:</p>
                <p className="font-bold text-slate-800 text-sm mt-0.5">Hasta {selectedAmenityForBooking.capacity} personas</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs uppercase tracking-wider mb-1 text-slate-700 font-bold">
                  Unidad
                </label>
                <select
                  value={form.unit}
                  onChange={e => {
                    const u = e.target.value
                    const res = residents.find(r => r.unit === u)
                    setForm(f => ({ ...f, unit: u, resident: res ? res.name : f.resident }))
                  }}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white border border-slate-200 font-medium focus:outline-none focus:border-teal-600"
                >
                  {residents.map(r => (
                    <option key={r.id} value={r.unit}>
                      {r.unit} — {r.name.split(' ')[0]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider mb-1 text-slate-700 font-bold">
                  Solicitante
                </label>
                <input
                  required
                  value={form.resident}
                  onChange={e => setForm(f => ({ ...f, resident: e.target.value }))}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-teal-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider mb-1 text-slate-700 font-bold">
                Fecha del Apartado
              </label>
              <input
                required
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white font-mono focus:outline-none focus:border-teal-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs uppercase tracking-wider mb-1 text-slate-700 font-bold">
                  Hora de Inicio
                </label>
                <input
                  required
                  type="time"
                  value={form.startTime}
                  onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white font-mono focus:outline-none focus:border-teal-600"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider mb-1 text-slate-700 font-bold">
                  Hora de Término
                </label>
                <input
                  required
                  type="time"
                  value={form.endTime}
                  onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white font-mono focus:outline-none focus:border-teal-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider mb-1 text-slate-700 font-bold">
                Número de Invitados (Máx. {selectedAmenityForBooking.capacity})
              </label>
              <input
                type="number"
                min={1}
                max={selectedAmenityForBooking.capacity}
                value={form.guests}
                onChange={e => setForm(f => ({ ...f, guests: Number(e.target.value) }))}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white font-mono focus:outline-none focus:border-teal-600"
              />
            </div>

            <div className="flex gap-3 pt-3">
              <Btn type="submit" className="flex-1 font-bold">
                Confirmar y Agendar
              </Btn>
              <Btn variant="ghost" onClick={() => setSelectedAmenityForBooking(null)}>
                Cancelar
              </Btn>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
export default AmenityCatalog
