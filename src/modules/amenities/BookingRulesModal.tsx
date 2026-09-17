import type { Amenity } from '@/types/amenities'
import Modal from '@/components/common/Modal'
import Ico from '@/components/common/Icons'

interface BookingRulesModalProps {
  amenity: Amenity | null
  onClose: () => void
}

export function BookingRulesModal({ amenity, onClose }: BookingRulesModalProps) {
  if (!amenity) return null

  return (
    <Modal
      isOpen={!!amenity}
      onClose={onClose}
      title={`Reglas de Uso — ${amenity.name}`}
      subtitle="Condiciones de apartado, cuotas, aforos y lineamientos de convivencia."
    >
      <div className="space-y-4">
        {/* Quick parameters grid */}
        <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Capacidad Máxima
            </p>
            <p className="text-sm font-semibold text-slate-900 mt-0.5">{amenity.capacity} personas</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Horario Permitido
            </p>
            <p className="text-sm font-semibold text-slate-900 mt-0.5">{amenity.hours}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Cuota de Apartado
            </p>
            <p className="text-sm font-semibold text-teal-700 mt-0.5">{amenity.rate}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Depósito en Garantía
            </p>
            <p className="text-sm font-semibold text-slate-900 mt-0.5">{amenity.deposit || 'No aplica'}</p>
          </div>
        </div>

        {/* Rules bullet points */}
        <div>
          <h4 className="font-display font-semibold text-slate-900 text-sm mb-2.5 flex items-center gap-2">
            <Ico n="info" c="w-4 h-4 text-teal-600" />
            Reglamento Interno Específico:
          </h4>
          <ul className="space-y-2">
            {amenity.rules.map((r, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-600">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-1.5 shrink-0" />
                <span className="leading-relaxed">{r}</span>
              </li>
            ))}
            <li className="flex items-start gap-2.5 text-xs text-slate-600">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-1.5 shrink-0" />
              <span className="leading-relaxed">
                Tiempo límite por reservación: {amenity.maxHoursPerBooking || 4} horas consecutivas.
              </span>
            </li>
            <li className="flex items-start gap-2.5 text-xs text-slate-600">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-1.5 shrink-0" />
              <span className="leading-relaxed">
                Cancelaciones permitidas con al menos 24 horas de anticipación sin penalización.
              </span>
            </li>
          </ul>
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-teal-700 text-white hover:bg-teal-800 transition-colors cursor-pointer shadow-xs"
          >
            Entendido
          </button>
        </div>
      </div>
    </Modal>
  )
}
export default BookingRulesModal
