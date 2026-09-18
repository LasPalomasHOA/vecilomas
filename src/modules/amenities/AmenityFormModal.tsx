import { useState, useEffect } from 'react'
import type { Amenity } from '@/types/amenities'
import Modal from '@/components/common/Modal'
import Btn from '@/components/common/Button'
import Ico from '@/components/common/Icons'

const IMAGE_PRESETS = [
  {
    label: 'Alberca & Asoleadero',
    url: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80',
  },
  {
    label: 'Cancha de Pádel / Tenis',
    url: 'https://images.unsplash.com/photo-1668507911709-0249e832618d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80',
  },
  {
    label: 'Terraza & Asadores',
    url: 'https://images.unsplash.com/photo-1605495121416-c03e2e1d00da?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80',
  },
  {
    label: 'Salón de Eventos',
    url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80',
  },
  {
    label: 'Gimnasio Fitness',
    url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80',
  },
  {
    label: 'Beach Deck / Playa',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80',
  },
]

interface AmenityFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (amenityData: Omit<Amenity, 'id'> | Amenity) => void
  editingAmenity?: Amenity | null
}

export function AmenityFormModal({
  isOpen,
  onClose,
  onSave,
  editingAmenity,
}: AmenityFormModalProps) {
  const [name, setName] = useState('')
  const [capacity, setCapacity] = useState(20)
  const [rateType, setRateType] = useState<'free' | 'paid'>('free')
  const [costAmount, setCostAmount] = useState(0)
  const [deposit, setDeposit] = useState('No aplica')
  const [startHour, setStartHour] = useState('08:00')
  const [endHour, setEndHour] = useState('22:00')
  const [maxHours, setMaxHours] = useState(4)
  const [available, setAvailable] = useState(true)
  const [img, setImg] = useState(IMAGE_PRESETS[0].url)
  const [rulesText, setRulesText] = useState('')

  useEffect(() => {
    if (editingAmenity) {
      setName(editingAmenity.name)
      setCapacity(editingAmenity.capacity)
      setRateType(editingAmenity.costAmount > 0 ? 'paid' : 'free')
      setCostAmount(editingAmenity.costAmount)
      setDeposit(editingAmenity.deposit || 'No aplica')
      setAvailable(editingAmenity.available)
      setImg(editingAmenity.img)
      setMaxHours(editingAmenity.maxHoursPerBooking || 4)
      setRulesText(editingAmenity.rules ? editingAmenity.rules.join('\n') : '')

      // Parse hours if formatted "HH:MM – HH:MM"
      if (editingAmenity.hours.includes('–') || editingAmenity.hours.includes('-')) {
        const parts = editingAmenity.hours.replace('hrs', '').split(/–|-/)
        if (parts[0]) setStartHour(parts[0].trim())
        if (parts[1]) setEndHour(parts[1].trim())
      }
    } else {
      setName('')
      setCapacity(20)
      setRateType('free')
      setCostAmount(0)
      setDeposit('No aplica')
      setStartHour('08:00')
      setEndHour('22:00')
      setMaxHours(4)
      setAvailable(true)
      setImg(IMAGE_PRESETS[0].url)
      setRulesText('Uso exclusivo para residentes y sus invitados registrados.\nCuidar el mobiliario y dejar el área limpia.')
    }
  }, [editingAmenity, isOpen])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    const rate = rateType === 'free' ? 'Sin costo' : `$${costAmount.toLocaleString()} MXN / sesión`
    const hours = `${startHour} – ${endHour} hrs`
    const rules = rulesText
      .split('\n')
      .map(r => r.trim())
      .filter(Boolean)

    const payload = {
      ...(editingAmenity ? { id: editingAmenity.id } : {}),
      name: name.trim(),
      capacity: Number(capacity),
      rate,
      costAmount: rateType === 'free' ? 0 : Number(costAmount),
      deposit: deposit.trim() || 'No aplica',
      hours,
      available,
      img,
      maxHoursPerBooking: Number(maxHours),
      rules: rules.length > 0 ? rules : ['Uso responsable de instalaciones.'],
    }

    onSave(payload as any)
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingAmenity ? `Editar Amenidad: ${editingAmenity.name}` : 'Agregar Nueva Amenidad'}
      subtitle="Configura los datos del espacio común, horarios permitidos, cuotas y reglas de reservación."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Nombre de la Amenidad / Espacio
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ej. Cancha de Pádel 2, Terraza Deck Sur, Salón de Eventos..."
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-teal-600 font-medium"
          />
        </div>

        {/* Image Preset Picker */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Fotografía del Espacio
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-2">
            {IMAGE_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setImg(preset.url)}
                className={`relative h-16 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                  img === preset.url ? 'border-teal-600 scale-105 shadow-xs' : 'border-slate-200 hover:opacity-80'
                }`}
              >
                <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                <span className="absolute inset-x-0 bottom-0 text-[8px] bg-black/60 text-white font-bold px-1 py-0.5 truncate text-center">
                  {preset.label}
                </span>
              </button>
            ))}
          </div>
          <input
            type="text"
            value={img}
            onChange={e => setImg(e.target.value)}
            placeholder="O ingresa una URL de imagen personalizada..."
            className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-600"
          />
        </div>

        {/* Capacity & Max Duration */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Capacidad Máxima (Personas)
            </label>
            <input
              type="number"
              min={1}
              max={500}
              required
              value={capacity}
              onChange={e => setCapacity(Number(e.target.value))}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Horas Máximas por Reserva
            </label>
            <input
              type="number"
              min={1}
              max={12}
              required
              value={maxHours}
              onChange={e => setMaxHours(Number(e.target.value))}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 bg-white"
            />
          </div>
        </div>

        {/* Operating Schedule */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Hora de Apertura
            </label>
            <input
              type="time"
              required
              value={startHour}
              onChange={e => setStartHour(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Hora de Cierre
            </label>
            <input
              type="time"
              required
              value={endHour}
              onChange={e => setEndHour(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 bg-white"
            />
          </div>
        </div>

        {/* Rate and Deposit */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Tipo de Cuota
            </label>
            <select
              value={rateType}
              onChange={e => setRateType(e.target.value as 'free' | 'paid')}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 bg-white"
            >
              <option value="free">Sin costo (Incluida en mantenimiento)</option>
              <option value="paid">Con cuota por evento ($ MXN)</option>
            </select>
            {rateType === 'paid' && (
              <div className="mt-2">
                <input
                  type="number"
                  min={0}
                  placeholder="Monto en MXN (ej. 1500)"
                  value={costAmount}
                  onChange={e => setCostAmount(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Depósito en Garantía
            </label>
            <input
              type="text"
              value={deposit}
              onChange={e => setDeposit(e.target.value)}
              placeholder="Ej. $1,000 MXN reembolsable o No aplica"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 bg-white"
            />
          </div>
        </div>

        {/* Rules */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Reglas de Uso (Una por línea)
          </label>
          <textarea
            rows={3}
            value={rulesText}
            onChange={e => setRulesText(e.target.value)}
            placeholder="Prohibido envases de vidrio&#10;Música a volumen moderado&#10;Respetar horario límite"
            className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white resize-none"
          />
        </div>

        {/* Status */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
          <div>
            <p className="text-xs font-bold text-slate-800">Disponibilidad Inmediata</p>
            <p className="text-[11px] text-slate-500">Permitir que los residentes reserven este espacio</p>
          </div>
          <button
            type="button"
            onClick={() => setAvailable(!available)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
              available ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {available ? '✓ Habilitada' : 'En Mantenimiento'}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2.5 pt-3 border-t border-slate-100">
          <Btn type="submit" className="flex-1 font-bold">
            <Ico n="check" c="w-4 h-4" />
            {editingAmenity ? 'Guardar Cambios' : 'Registrar Amenidad'}
          </Btn>
          <Btn variant="ghost" onClick={onClose}>
            Cancelar
          </Btn>
        </div>
      </form>
    </Modal>
  )
}

export default AmenityFormModal
