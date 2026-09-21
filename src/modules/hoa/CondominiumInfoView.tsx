import { useState } from 'react'
import { useData } from '@/context/DataContext'
import GCard from '@/components/common/Card'
import Btn from '@/components/common/Button'
import Modal from '@/components/common/Modal'
import Ico from '@/components/common/Icons'

interface CondominiumInfoViewProps {
  onGoToDirectory?: () => void
}

export function CondominiumInfoView({ onGoToDirectory }: CondominiumInfoViewProps) {
  const { selectedCondominium, updateCondominium, residents, amenities, userPermissions } = useData()

  const [editModalOpen, setEditModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [successToast, setSuccessToast] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: selectedCondominium?.name || 'Condominio Residencial Las Palomas',
    address: selectedCondominium?.address || 'Blvd. Costero #150, Sandy Beach',
    city: selectedCondominium?.city || 'Puerto Peñasco, Sonora',
    postalCode: selectedCondominium?.postalCode || '83550',
    currency: selectedCondominium?.currency || 'MXN',
  })

  function handleOpenEdit() {
    setForm({
      name: selectedCondominium?.name || 'Condominio Residencial Las Palomas',
      address: selectedCondominium?.address || 'Blvd. Costero #150, Sandy Beach',
      city: selectedCondominium?.city || 'Puerto Peñasco, Sonora',
      postalCode: selectedCondominium?.postalCode || '83550',
      currency: selectedCondominium?.currency || 'MXN',
    })
    setEditModalOpen(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedCondominium?.id) return

    setSaving(true)
    try {
      await updateCondominium(selectedCondominium.id, {
        name: form.name,
        address: form.address,
        city: form.city,
        postalCode: form.postalCode,
        currency: form.currency,
      })

      setEditModalOpen(false)
      setSuccessToast('¡Datos generales del residencial actualizados correctamente en la base de datos!')
      setTimeout(() => setSuccessToast(null), 4000)
    } catch (err) {
      console.error('Error al actualizar datos del condominio:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {successToast && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs sm:text-sm font-bold flex items-center gap-3 animate-fade-in shadow-md">
          <Ico n="check" c="w-5 h-5 text-emerald-600" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Main Luxury Identity Card */}
      <div className="bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-2xl border border-teal-900/40 relative overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-teal-400/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-400/30">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                Residencial Oficial Activo
              </span>
              <span className="text-xs font-mono text-slate-400 bg-white/5 px-2.5 py-0.5 rounded-lg border border-white/10">
                ID #{selectedCondominium?.id || 1} • PostgreSQL
              </span>
            </div>

            <h2 className="font-display font-black text-2xl sm:text-3xl lg:text-4xl text-white tracking-tight flex items-center gap-3">
              <Ico n="building" c="w-8 h-8 text-teal-400 shrink-0" />
              <span>{selectedCondominium?.name || 'Condominio Residencial Las Palomas'}</span>
            </h2>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-teal-100/90 pt-1">
              <span className="flex items-center gap-1.5">
                <span>📍 {selectedCondominium?.address || 'Blvd. Costero #150, Sandy Beach'}</span>
              </span>
              {selectedCondominium?.city && (
                <span>• {selectedCondominium.city}</span>
              )}
              {selectedCondominium?.postalCode && (
                <span className="font-mono text-teal-300 font-bold">(C.P. {selectedCondominium.postalCode})</span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start lg:self-center">
            <button
              type="button"
              onClick={handleOpenEdit}
              className="px-5 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md backdrop-blur-md"
            >
              <Ico n="edit" c="w-4 h-4 text-teal-300" />
              <span>Editar Datos del Residencial</span>
            </button>

            {onGoToDirectory && (
              <button
                type="button"
                onClick={onGoToDirectory}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-teal-500 to-teal-700 hover:from-teal-400 hover:to-teal-600 text-white text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer shadow-[0_4px_14px_rgba(0,128,128,0.3)]"
              >
                <Ico n="users" c="w-4 h-4" />
                <span>Ver Directorio de Condóminos</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Property Metrics Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Unidades y Casas Registradas',
            val: String(selectedCondominium?.unitsCount ?? residents.length),
            desc: 'Departamentos registrados en el residencial',
            icon: 'home' as const,
            color: 'text-teal-700',
            bg: 'bg-teal-50 border-teal-100',
          },
          {
            label: 'Condóminos en Directorio',
            val: String(residents.length),
            desc: 'Propietarios y arrendatarios activos',
            icon: 'users' as const,
            color: 'text-emerald-700',
            bg: 'bg-emerald-50 border-emerald-100',
          },
          {
            label: 'Amenidades y Áreas Comunes',
            val: String(amenities.length),
            desc: 'Albercas, canchas, terrazas y salones',
            icon: 'calendar' as const,
            color: 'text-sky-700',
            bg: 'bg-sky-50 border-sky-100',
          },
          {
            label: 'Usuarios y Personal',
            val: String(userPermissions.length || 3),
            desc: 'Administradores, guardias y caseta',
            icon: 'shield' as const,
            color: 'text-indigo-700',
            bg: 'bg-indigo-50 border-indigo-100',
          },
        ].map((m, i) => (
          <GCard key={i} p="p-5" className="hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between gap-3 mb-3">
              <span className={`w-10 h-10 rounded-2xl flex items-center justify-center ${m.bg} ${m.color} border shadow-2xs`}>
                <Ico n={m.icon} c="w-5 h-5" />
              </span>
              <span className="font-display font-black text-2xl text-slate-900">{m.val}</span>
            </div>
            <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">{m.label}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{m.desc}</p>
          </GCard>
        ))}
      </div>

      {/* Property Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Technical Data Card */}
        <GCard p="p-6 sm:p-7">
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-teal-950/[0.06]">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-800 flex items-center justify-center border border-teal-200">
              <Ico n="file" c="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-slate-900 text-lg">Ficha Técnica del Residencial</h3>
              <p className="text-xs text-slate-500 mt-0.5">Información jurídica y operativa del condominio</p>
            </div>
          </div>

          <div className="space-y-3.5 text-sm">
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Nombre Completo</span>
              <span className="font-bold text-slate-800 text-right">{selectedCondominium?.name || 'Condominio Residencial Las Palomas'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Ubicación / Ciudad</span>
              <span className="font-bold text-slate-800 text-right">{selectedCondominium?.city || 'Puerto Peñasco, Sonora'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Código Postal</span>
              <span className="font-mono font-bold text-slate-800">{selectedCondominium?.postalCode || '83550'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Moneda Operativa</span>
              <span className="font-mono font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-lg border border-teal-200">
                {selectedCondominium?.currency || 'MXN'} ($)
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-slate-500 font-medium">Zona Horaria Oficial</span>
              <span className="font-mono font-bold text-slate-700">America/Hermosillo (UTC-7 Sonora)</span>
            </div>
          </div>
        </GCard>

        {/* Administration & Contact Card */}
        <GCard p="p-6 sm:p-7">
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-teal-950/[0.06]">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-800 flex items-center justify-center border border-teal-200">
              <Ico n="shield" c="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-slate-900 text-lg">Mesa Directiva y Administración</h3>
              <p className="text-xs text-slate-500 mt-0.5">Canales de atención a propietarios y condóminos</p>
            </div>
          </div>

          <div className="space-y-4 text-sm">
            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-teal-900">Oficina de Administración HOA</p>
              <p className="text-xs text-slate-600 leading-relaxed">
                Atención a residentes, cobro de cuotas de mantenimiento, reservación de amenidades y control de acceso.
              </p>
              <div className="pt-2 flex flex-wrap gap-3 text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <Ico n="clock" c="w-3.5 h-3.5 text-teal-600" />
                  <span>Lun – Vie: 09:00 a 18:00 hrs</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Ico n="shield" c="w-3.5 h-3.5 text-teal-600" />
                  <span>Caseta: 24/7 Vigilancia Activa</span>
                </span>
              </div>
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={handleOpenEdit}
                className="w-full py-2.5 rounded-xl border border-teal-950/20 text-slate-800 hover:bg-slate-50 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
              >
                <Ico n="edit" c="w-3.5 h-3.5 text-teal-700" />
                <span>Modificar Dirección o Datos Generales</span>
              </button>
            </div>
          </div>
        </GCard>
      </div>

      {/* Modal: Edit Condominium Data */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Editar Datos Generales del Residencial"
        subtitle="Actualiza la información oficial de Las Palomas directamente en la base de datos PostgreSQL."
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-600">
              Nombre Oficial del Residencial *
            </label>
            <input
              required
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Ej. Condominio Residencial Las Palomas"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50/80 border border-slate-200/80 focus:bg-white focus:border-teal-500 focus:outline-none transition-all font-medium text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-600">
              Dirección Física Completa *
            </label>
            <input
              required
              value={form.address}
              onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
              placeholder="Ej. Blvd. Costero #150, Sandy Beach"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50/80 border border-slate-200/80 focus:bg-white focus:border-teal-500 focus:outline-none transition-all font-medium text-slate-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-600">
                Código Postal
              </label>
              <input
                value={form.postalCode}
                onChange={e => setForm(f => ({ ...f, postalCode: e.target.value }))}
                placeholder="83550"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50/80 border border-slate-200/80 focus:bg-white focus:border-teal-500 focus:outline-none transition-all font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-600">
                Ciudad / Estado
              </label>
              <input
                value={form.city}
                onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                placeholder="Puerto Peñasco, Sonora"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50/80 border border-slate-200/80 focus:bg-white focus:border-teal-500 focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-600">
                Moneda
              </label>
              <select
                value={form.currency}
                onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50/80 border border-slate-200/80 focus:bg-white focus:border-teal-500 focus:outline-none transition-all font-semibold text-slate-800"
              >
                <option value="MXN">MXN ($)</option>
                <option value="USD">USD ($)</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-3">
            <Btn type="submit" disabled={saving} className="flex-1 font-bold">
              {saving ? 'Guardando en BD...' : 'Guardar Cambios'}
            </Btn>
            <Btn variant="ghost" onClick={() => setEditModalOpen(false)}>
              Cancelar
            </Btn>
          </div>
        </form>
      </Modal>
    </div>
  )
}
export default CondominiumInfoView
