import { useState } from 'react'
import type { Amenity } from '@/types/amenities'
import { BRAND_COLORS } from '@/types'
import { useData } from '@/context/DataContext'
import { GLASS_STYLES } from '@/components/common/Card'
import Modal from '@/components/common/Modal'
import Btn from '@/components/common/Button'
import Ico from '@/components/common/Icons'
import ImageUploader from '@/components/common/ImageUploader'
import BookingRulesModal from '@/modules/amenities/BookingRulesModal'

interface AmenityCatalogProps {
  currentUnit?: string
  currentResidentName?: string
  onBookingSuccess?: () => void
}

export function AmenityCatalog({
  currentUnit = '',
  currentResidentName = '',
  onBookingSuccess,
}: AmenityCatalogProps) {
  const { amenities, addAmenity, updateAmenity, deleteAmenity, addBooking, residents } = useData()
  const [selectedAmenityForRules, setSelectedAmenityForRules] = useState<Amenity | null>(null)
  const [selectedAmenityForBooking, setSelectedAmenityForBooking] = useState<Amenity | null>(null)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editAmenityData, setEditAmenityData] = useState<Amenity | null>(null)
  const [deleteAmenityId, setDeleteAmenityId] = useState<number | null>(null)
  const [successToast, setSuccessToast] = useState<string | null>(null)

  // New Amenity Form State
  const [newForm, setNewForm] = useState({
    name: '',
    capacity: 20,
    rate: 'Sin costo',
    costAmount: 0,
    hours: '08:00 – 22:00 hrs',
    deposit: 'No aplica',
    maxHoursPerBooking: 4,
    img: '',
    rules: 'Uso exclusivo para residentes y sus invitados\nCuidar las instalaciones y recoger basura\nRespetar el aforo y horario establecido',
  })

  // Edit Amenity Form State
  const [editForm, setEditForm] = useState({
    id: 0,
    name: '',
    capacity: 20,
    rate: 'Sin costo',
    costAmount: 0,
    hours: '08:00 – 22:00 hrs',
    deposit: 'No aplica',
    maxHoursPerBooking: 4,
    available: true,
    img: '',
    rules: '',
  })

  // Booking Form State
  const [form, setForm] = useState({
    resident: currentResidentName,
    unit: currentUnit,
    date: new Date().toISOString().split('T')[0],
    startTime: '16:00',
    endTime: '20:00',
    guests: 10,
  })

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
    setSuccessToast(`¡Solicitud de reservación para "${amenityName}" registrada con éxito!`)
    setTimeout(() => setSuccessToast(null), 4000)
    if (onBookingSuccess) onBookingSuccess()
  }

  function handleCreateAmenity(e: React.FormEvent) {
    e.preventDefault()
    if (!newForm.name) return

    const rulesList = newForm.rules
      .split('\n')
      .map(r => r.trim())
      .filter(Boolean)

    addAmenity({
      name: newForm.name,
      capacity: Number(newForm.capacity),
      rate: newForm.rate,
      costAmount: Number(newForm.costAmount) || 0,
      hours: newForm.hours,
      deposit: newForm.deposit,
      maxHoursPerBooking: Number(newForm.maxHoursPerBooking) || 4,
      available: true,
      img: newForm.img || 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80',
      rules: rulesList.length > 0 ? rulesList : ['Uso responsable de las instalaciones'],
    })

    setCreateModalOpen(false)
    setSuccessToast(`¡Amenidad "${newForm.name}" agregada con éxito al catálogo con imagen optimizada!`)
    setTimeout(() => setSuccessToast(null), 4000)
    setNewForm({
      name: '',
      capacity: 20,
      rate: 'Sin costo',
      costAmount: 0,
      hours: '08:00 – 22:00 hrs',
      deposit: 'No aplica',
      maxHoursPerBooking: 4,
      img: '',
      rules: 'Uso exclusivo para residentes y sus invitados\nCuidar las instalaciones y recoger basura\nRespetar el aforo y horario establecido',
    })
  }

  function handleOpenEdit(a: Amenity) {
    setEditAmenityData(a)
    setEditForm({
      id: a.id,
      name: a.name,
      capacity: a.capacity,
      rate: a.rate,
      costAmount: a.costAmount || (parseInt(a.rate.replace(/[^0-9]/g, '')) || 0),
      hours: a.hours,
      deposit: a.deposit || 'No aplica',
      maxHoursPerBooking: a.maxHoursPerBooking || 4,
      available: a.available !== false,
      img: a.img || '',
      rules: Array.isArray(a.rules) ? a.rules.join('\n') : (a.rules || ''),
    })
  }

  function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editForm.name) return

    const rulesList = editForm.rules
      .split('\n')
      .map(r => r.trim())
      .filter(Boolean)

    updateAmenity({
      id: editForm.id,
      name: editForm.name,
      capacity: Number(editForm.capacity),
      rate: editForm.rate,
      costAmount: Number(editForm.costAmount) || 0,
      hours: editForm.hours,
      deposit: editForm.deposit,
      maxHoursPerBooking: Number(editForm.maxHoursPerBooking) || 4,
      available: editForm.available,
      img: editForm.img || 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80',
      rules: rulesList.length > 0 ? rulesList : ['Uso responsable de las instalaciones'],
    })

    setEditAmenityData(null)
    setSuccessToast(`¡Amenidad "${editForm.name}" actualizada con éxito!`)
    setTimeout(() => setSuccessToast(null), 4000)
  }

  function handleDeleteAmenity(id: number) {
    const target = amenities.find(a => a.id === id)
    deleteAmenity(id)
    setDeleteAmenityId(null)
    setSuccessToast(`¡Amenidad "${target?.name || ''}" eliminada del catálogo!`)
    setTimeout(() => setSuccessToast(null), 4000)
  }

  return (
    <div className="space-y-6">
      {successToast && (
        <div className="p-4 rounded-2xl bg-[#e6f2f0] border border-[#7eb0a6] text-[#003333] text-xs sm:text-sm font-bold flex items-center gap-3 animate-fade-in shadow-md">
          <Ico n="check" c="w-5 h-5 text-[#008080]" />
          {successToast}
        </div>
      )}

      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div>
          <h3 className="font-display font-bold text-slate-900 text-base sm:text-lg">
            Catálogo de Espacios y Áreas Comunes
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Administra las amenidades, sube fotos optimizadas, establece cuotas, aforos y horarios.
          </p>
        </div>
        <Btn
          onClick={() => setCreateModalOpen(true)}
          className="shrink-0 whitespace-nowrap font-bold shadow-xs flex items-center justify-center gap-2"
        >
          <Ico n="plus" c="w-4 h-4" />
          + Nueva Amenidad
        </Btn>
      </div>

      {/* Catalog Grid */}
      {amenities.length === 0 ? (
        <div className="rounded-2xl p-12 bg-white border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] text-center space-y-3 animate-fade-in">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center">
            <Ico n="tag" c="w-7 h-7" />
          </div>
          <h3 className="font-display font-bold text-slate-800 text-lg">Catálogo de amenidades vacío</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            Aún no se han registrado áreas comunes. Haz clic en "+ Nueva Amenidad" para registrar una alberca, terraza, asadores, canchas o salón de eventos.
          </p>
          <div className="pt-2">
            <Btn onClick={() => setCreateModalOpen(true)} className="font-bold">
              + Agregar Primera Amenidad
            </Btn>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {amenities.map(a => (
            <div
              key={a.id}
              className={`rounded-2xl overflow-hidden transition-all duration-200 bg-white border border-teal-950/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.95),0_1px_3px_rgba(0,51,51,0.03),0_6px_20px_rgba(0,51,51,0.04)] hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_12px_30px_rgba(0,51,51,0.08)] hover:border-teal-500/30 hover:-translate-y-0.5 flex flex-col justify-between group ${
                !a.available ? 'opacity-75' : ''
              }`}
            >
              {/* Image Box */}
              <div className="h-48 relative overflow-hidden bg-slate-900">
                <img
                  src={a.img || 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80'}
                  alt={a.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(to top, rgba(0, 35, 35, 0.92) 0%, rgba(0, 51, 51, 0.3) 60%, transparent 100%)',
                  }}
                />

                {/* Status Pill & Action Buttons */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                  <span
                    className="text-xs font-bold px-3 py-1 rounded-full text-white backdrop-blur-md border border-white/25 shadow-xs"
                    style={{
                      backgroundColor: a.available ? 'rgba(0, 128, 128, 0.9)' : 'rgba(100, 116, 139, 0.9)',
                    }}
                  >
                    {a.available ? '✓ Disponible' : 'Mantenimiento'}
                  </span>

                  {/* Edit button */}
                  <button
                    type="button"
                    title="Editar amenidad"
                    onClick={() => handleOpenEdit(a)}
                    className="w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all cursor-pointer"
                  >
                    <Ico n="edit" c="w-3.5 h-3.5" />
                  </button>

                  {/* Delete button */}
                  <button
                    type="button"
                    title="Eliminar amenidad"
                    onClick={() => setDeleteAmenityId(a.id)}
                    className="w-8 h-8 rounded-full bg-red-600/70 hover:bg-red-600 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all cursor-pointer"
                  >
                    <Ico n="trash" c="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="absolute bottom-3 left-4 right-4">
                  <p className="text-[10px] font-mono text-teal-300 uppercase tracking-widest font-bold">
                    ✦ ÁREA EXCLUSIVA RESIDENCIAL
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
                <div className="flex items-center gap-2 pt-3 border-t border-teal-950/[0.06]">
                  <button
                    type="button"
                    onClick={() => setSelectedAmenityForRules(a)}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200/80 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    Reglamento
                  </button>
                  <button
                    type="button"
                    disabled={!a.available}
                    onClick={() => handleOpenBooking(a)}
                    className="flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold text-white transition-all shadow-[0_4px_14px_rgba(0,128,128,0.22)] hover:brightness-110 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap justify-center text-center"
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
              </div>
            </div>
          ))}
        </div>
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
            <div className="p-4 rounded-2xl bg-[#e6f2f0] border border-[#7eb0a6]/40 flex items-center justify-between text-xs">
              <div>
                <p className="text-slate-400 font-mono uppercase font-bold text-[10px]">Cuota requerida:</p>
                <p className="font-extrabold text-[#003333] text-base mt-0.5">{selectedAmenityForBooking.rate}</p>
              </div>
              <div className="text-right">
                <p className="text-slate-400 font-mono uppercase font-bold text-[10px]">Capacidad:</p>
                <p className="font-bold text-slate-800 text-sm mt-0.5">Hasta {selectedAmenityForBooking.capacity} personas</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider mb-1 text-[#004c4c] font-bold">
                  Unidad
                </label>
                <select
                  value={form.unit}
                  onChange={e => {
                    const u = e.target.value
                    const res = residents.find(r => r.unit === u)
                    setForm(f => ({ ...f, unit: u, resident: res ? res.name : f.resident }))
                  }}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white border border-[#7eb0a6]/50 font-medium"
                >
                  {residents.map(r => (
                    <option key={r.id} value={r.unit}>
                      {r.unit} — {r.name.split(' ')[0]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider mb-1 text-[#004c4c] font-bold">
                  Solicitante
                </label>
                <input
                  required
                  value={form.resident}
                  onChange={e => setForm(f => ({ ...f, resident: e.target.value }))}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl"
                  style={GLASS_STYLES.input}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider mb-1 text-[#004c4c] font-bold">
                Fecha del Apartado
              </label>
              <input
                required
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl font-mono"
                style={GLASS_STYLES.input}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider mb-1 text-[#004c4c] font-bold">
                  Hora de Inicio
                </label>
                <input
                  required
                  type="time"
                  value={form.startTime}
                  onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl font-mono"
                  style={GLASS_STYLES.input}
                />
              </div>
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider mb-1 text-[#004c4c] font-bold">
                  Hora de Término
                </label>
                <input
                  required
                  type="time"
                  value={form.endTime}
                  onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl font-mono"
                  style={GLASS_STYLES.input}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider mb-1 text-[#004c4c] font-bold">
                Número de Invitados (Máx. {selectedAmenityForBooking.capacity})
              </label>
              <input
                type="number"
                min={1}
                max={selectedAmenityForBooking.capacity}
                value={form.guests}
                onChange={e => setForm(f => ({ ...f, guests: Number(e.target.value) }))}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl font-mono"
                style={GLASS_STYLES.input}
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

      {/* Create New Amenity Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Crear Nueva Amenidad"
        subtitle="Registra un nuevo espacio común, sube su fotografía optimizada, capacidad, horarios y cuotas."
      >
        <form onSubmit={handleCreateAmenity} className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-600">
                Nombre de la Amenidad *
              </label>
              <input
                required
                value={newForm.name}
                onChange={e => setNewForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Ej. Alberca Principal, Salón de Eventos..."
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50/80 border border-slate-200/80 focus:bg-white focus:border-teal-500 focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-600">
                Aforo Máximo (Personas) *
              </label>
              <input
                required
                type="number"
                min={1}
                max={500}
                value={newForm.capacity}
                onChange={e => setNewForm(f => ({ ...f, capacity: Number(e.target.value) }))}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50/80 border border-slate-200/80 focus:bg-white focus:border-teal-500 focus:outline-none transition-all font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-600">
                Texto de Cuota
              </label>
              <input
                value={newForm.rate}
                onChange={e => setNewForm(f => ({ ...f, rate: e.target.value }))}
                placeholder="Ej. $300 MXN / sesión o Sin costo"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50/80 border border-slate-200/80 focus:bg-white focus:border-teal-500 focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-600">
                Monto Numérico ($ MXN)
              </label>
              <input
                type="number"
                min={0}
                value={newForm.costAmount}
                onChange={e => setNewForm(f => ({ ...f, costAmount: Number(e.target.value) }))}
                placeholder="0"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50/80 border border-slate-200/80 focus:bg-white focus:border-teal-500 focus:outline-none transition-all font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-600">
                Horario de Operación
              </label>
              <input
                value={newForm.hours}
                onChange={e => setNewForm(f => ({ ...f, hours: e.target.value }))}
                placeholder="08:00 – 22:00 hrs"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50/80 border border-slate-200/80 focus:bg-white focus:border-teal-500 focus:outline-none transition-all font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-600">
                Depósito en Garantía
              </label>
              <input
                value={newForm.deposit}
                onChange={e => setNewForm(f => ({ ...f, deposit: e.target.value }))}
                placeholder="Ej. $1,000 MXN en garantía o No aplica"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50/80 border border-slate-200/80 focus:bg-white focus:border-teal-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Optimized Image Uploader */}
          <ImageUploader
            label="Fotografía Ilustrativa (Base64 Optimizada)"
            helperText="Sube una fotografía desde tu computadora o celular. Se optimizará y comprimirá automáticamente a Base64 ligero."
            value={newForm.img}
            onChange={val => setNewForm(f => ({ ...f, img: val }))}
            maxWidth={1200}
            maxHeight={800}
            quality={0.82}
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-600">
              Reglas de Uso (Una por renglón)
            </label>
            <textarea
              rows={3}
              value={newForm.rules}
              onChange={e => setNewForm(f => ({ ...f, rules: e.target.value }))}
              placeholder="Escribe cada regla en un renglón..."
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50/80 border border-slate-200/80 focus:bg-white focus:border-teal-500 focus:outline-none transition-all"
            />
          </div>

          <div className="flex gap-3 pt-3">
            <Btn type="submit" className="flex-1 font-bold">
              Guardar Amenidad
            </Btn>
            <Btn variant="ghost" onClick={() => setCreateModalOpen(false)}>
              Cancelar
            </Btn>
          </div>
        </form>
      </Modal>

      {/* Edit Amenity Modal */}
      <Modal
        isOpen={!!editAmenityData}
        onClose={() => setEditAmenityData(null)}
        title={editAmenityData ? `Editar Amenidad: ${editAmenityData.name}` : 'Editar Amenidad'}
        subtitle="Modifica la información del espacio, actualiza su fotografía o cambia el aforo y reglas."
      >
        <form onSubmit={handleSaveEdit} className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-600">
                Nombre de la Amenidad *
              </label>
              <input
                required
                value={editForm.name}
                onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50/80 border border-slate-200/80 focus:bg-white focus:border-teal-500 focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-600">
                Aforo Máximo (Personas) *
              </label>
              <input
                required
                type="number"
                min={1}
                max={500}
                value={editForm.capacity}
                onChange={e => setEditForm(f => ({ ...f, capacity: Number(e.target.value) }))}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50/80 border border-slate-200/80 focus:bg-white focus:border-teal-500 focus:outline-none transition-all font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-600">
                Texto de Cuota
              </label>
              <input
                value={editForm.rate}
                onChange={e => setEditForm(f => ({ ...f, rate: e.target.value }))}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50/80 border border-slate-200/80 focus:bg-white focus:border-teal-500 focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-600">
                Monto Numérico ($ MXN)
              </label>
              <input
                type="number"
                min={0}
                value={editForm.costAmount}
                onChange={e => setEditForm(f => ({ ...f, costAmount: Number(e.target.value) }))}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50/80 border border-slate-200/80 focus:bg-white focus:border-teal-500 focus:outline-none transition-all font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-600">
                Horario de Operación
              </label>
              <input
                value={editForm.hours}
                onChange={e => setEditForm(f => ({ ...f, hours: e.target.value }))}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50/80 border border-slate-200/80 focus:bg-white focus:border-teal-500 focus:outline-none transition-all font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-600">
                Estado Operativo
              </label>
              <select
                value={editForm.available ? 'true' : 'false'}
                onChange={e => setEditForm(f => ({ ...f, available: e.target.value === 'true' }))}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50/80 border border-slate-200/80 focus:bg-white focus:border-teal-500 focus:outline-none transition-all"
              >
                <option value="true">✓ Disponible para reservas</option>
                <option value="false">⚙ En Mantenimiento / Deshabilitado</option>
              </select>
            </div>
          </div>

          {/* Optimized Image Uploader for Edit */}
          <ImageUploader
            label="Fotografía Ilustrativa (Base64 Optimizada)"
            helperText="Puedes subir una nueva foto para reemplazar la actual. Se optimizará automáticamente."
            value={editForm.img}
            onChange={val => setEditForm(f => ({ ...f, img: val }))}
            maxWidth={1200}
            maxHeight={800}
            quality={0.82}
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-600">
              Reglas de Uso (Una por renglón)
            </label>
            <textarea
              rows={3}
              value={editForm.rules}
              onChange={e => setEditForm(f => ({ ...f, rules: e.target.value }))}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50/80 border border-slate-200/80 focus:bg-white focus:border-teal-500 focus:outline-none transition-all"
            />
          </div>

          <div className="flex gap-3 pt-3">
            <Btn type="submit" className="flex-1 font-bold">
              Guardar Cambios
            </Btn>
            <Btn variant="ghost" onClick={() => setEditAmenityData(null)}>
              Cancelar
            </Btn>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteAmenityId !== null}
        onClose={() => setDeleteAmenityId(null)}
        title="¿Eliminar Amenidad?"
        subtitle="Esta acción eliminará el espacio del catálogo y su disponibilidad en el sistema."
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            ¿Estás seguro de que deseas eliminar permanentemente esta amenidad? Esta acción no se puede deshacer.
          </p>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => deleteAmenityId && handleDeleteAmenity(deleteAmenityId)}
              className="flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer shadow-xs"
            >
              Sí, Eliminar
            </button>
            <Btn variant="ghost" onClick={() => setDeleteAmenityId(null)} className="flex-1">
              Cancelar
            </Btn>
          </div>
        </div>
      </Modal>
    </div>
  )
}
export default AmenityCatalog
