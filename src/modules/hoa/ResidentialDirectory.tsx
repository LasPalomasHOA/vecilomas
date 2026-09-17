import { useState } from 'react'
import type { Resident, ResidentType, ResidentStatus } from '@/types/hoa'
import { useData } from '@/context/DataContext'
import Badge from '@/components/common/Badge'
import Btn from '@/components/common/Button'
import Modal from '@/components/common/Modal'
import Ico from '@/components/common/Icons'

export function ResidentialDirectory() {
  const { residents, addResident, updateResident } = useData()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | ResidentType>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | ResidentStatus>('all')

  // Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [editingResident, setEditingResident] = useState<Resident | null>(null)
  const [form, setForm] = useState({
    unit: '',
    name: '',
    type: 'Propietario' as ResidentType,
    status: 'Al corriente' as ResidentStatus,
    phone: '',
    email: '',
    vehicles: '',
  })

  function openCreate() {
    setEditingResident(null)
    setForm({
      unit: '',
      name: '',
      type: 'Propietario',
      status: 'Al corriente',
      phone: '',
      email: '',
      vehicles: '',
    })
    setModalOpen(true)
  }

  function openEdit(r: Resident) {
    setEditingResident(r)
    setForm({
      unit: r.unit,
      name: r.name,
      type: r.type,
      status: r.status,
      phone: r.phone,
      email: r.email,
      vehicles: r.vehicles.join(', '),
    })
    setModalOpen(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.unit || !form.name) return

    const vehiclesArray = form.vehicles
      .split(',')
      .map(v => v.trim())
      .filter(Boolean)

    if (editingResident) {
      updateResident({
        ...editingResident,
        unit: form.unit,
        name: form.name,
        type: form.type,
        status: form.status,
        phone: form.phone,
        email: form.email,
        vehicles: vehiclesArray,
      })
    } else {
      addResident({
        unit: form.unit,
        name: form.name,
        type: form.type,
        status: form.status,
        phone: form.phone,
        email: form.email,
        vehicles: vehiclesArray,
      })
    }
    setModalOpen(false)
  }

  const filtered = residents.filter(r => {
    const matchesSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.unit.toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase()) ||
      r.vehicles.some(v => v.toLowerCase().includes(search.toLowerCase()))

    const matchesType = typeFilter === 'all' || r.type === typeFilter
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter

    return matchesSearch && matchesType && matchesStatus
  })

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-2.5 overflow-x-auto hide-scrollbar flex-nowrap sm:flex-wrap flex-1">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] sm:min-w-[240px] max-w-md shrink-0 sm:shrink">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <Ico n="search" c="w-4 h-4" />
            </span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nombre, unidad o placa..."
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl placeholder:text-slate-400 bg-slate-50/80 border border-slate-200/80 focus:bg-white focus:border-teal-500 focus:outline-none transition-all"
            />
          </div>

          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value as any)}
            className="px-3 py-2 text-xs font-medium rounded-xl text-slate-700 bg-slate-50/80 border border-slate-200/80 hover:bg-slate-100 cursor-pointer shrink-0 whitespace-nowrap focus:outline-none focus:border-teal-500 transition-all"
          >
            <option value="all">Todos los Tipos</option>
            <option value="Propietario">Propietarios</option>
            <option value="Arrendatario">Arrendatarios</option>
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 text-xs font-medium rounded-xl text-slate-700 bg-slate-50/80 border border-slate-200/80 hover:bg-slate-100 cursor-pointer shrink-0 whitespace-nowrap focus:outline-none focus:border-teal-500 transition-all"
          >
            <option value="all">Todos los Estados</option>
            <option value="Al corriente">Al corriente</option>
            <option value="Moroso">Morosos</option>
          </select>
        </div>

        <Btn onClick={openCreate} className="font-semibold shadow-xs shrink-0 whitespace-nowrap">
          <Ico n="plus" c="w-4 h-4" />
          Registrar Condómino
        </Btn>
      </div>

      {/* Directory Table */}
      <div className="rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02),0_4px_16px_rgba(0,0,0,0.02)] border border-slate-100 bg-white">
        <div className="overflow-x-auto hide-scrollbar">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                {['Unidad', 'Residente / Contacto', 'Tipo', 'Teléfono', 'Vehículos Autorizados', 'Estado', 'Acciones'].map(h => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(r => (
                <tr
                  key={r.id}
                  className="hover:bg-slate-50/70 transition-colors group"
                >
                  <td className="px-5 py-4 font-display font-bold text-slate-900 text-sm whitespace-nowrap">
                    {r.unit}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-xs bg-gradient-to-br from-teal-500 to-teal-700"
                      >
                        {r.name
                          .split(' ')
                          .slice(0, 2)
                          .map(w => w[0])
                          .join('')}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 leading-tight whitespace-nowrap">{r.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5 whitespace-nowrap">{r.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <Badge text={r.type} />
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-600 font-medium whitespace-nowrap">{r.phone}</td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    {r.vehicles.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {r.vehicles.map(v => (
                          <span
                            key={v}
                            className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200/60 font-medium whitespace-nowrap"
                          >
                            <Ico n="car" c="w-3.5 h-3.5 text-teal-600" />
                            {v}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic whitespace-nowrap">Sin vehículos</span>
                    )}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <Badge text={r.status} />
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <button
                      onClick={() => openEdit(r)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer whitespace-nowrap shadow-2xs"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 text-sm">
                    No se encontraron residentes con los filtros aplicados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingResident ? `Editar Residente (${editingResident.unit})` : 'Registrar Nuevo Residente'}
        subtitle="Administra los datos de la propiedad, contactos y vehículos autorizados."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-600">
                Unidad / Depto
              </label>
              <input
                required
                value={form.unit}
                onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                placeholder="Ej. A-101"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50/80 border border-slate-200/80 focus:bg-white focus:border-teal-500 focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-600">
                Tipo de Ocupante
              </label>
              <select
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value as ResidentType }))}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50/80 border border-slate-200/80 focus:bg-white focus:border-teal-500 focus:outline-none transition-all font-medium text-slate-700"
              >
                <option value="Propietario">Propietario</option>
                <option value="Arrendatario">Arrendatario</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-600">
              Nombre Completo
            </label>
            <input
              required
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Ej. Carlos Mendoza Ruiz"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50/80 border border-slate-200/80 focus:bg-white focus:border-teal-500 focus:outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-600">
                Teléfono / WhatsApp
              </label>
              <input
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="+52 55 1234-5678"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50/80 border border-slate-200/80 focus:bg-white focus:border-teal-500 focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-600">
                Estado de Cuota
              </label>
              <select
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value as ResidentStatus }))}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50/80 border border-slate-200/80 focus:bg-white focus:border-teal-500 focus:outline-none transition-all font-medium text-slate-700"
              >
                <option value="Al corriente">Al corriente</option>
                <option value="Moroso">Moroso</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-600">
              Correo Electrónico
            </label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="carlos.mendoza@email.com"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50/80 border border-slate-200/80 focus:bg-white focus:border-teal-500 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-600">
              Vehículos Autorizados (Placas separadas por coma)
            </label>
            <input
              value={form.vehicles}
              onChange={e => setForm(f => ({ ...f, vehicles: e.target.value }))}
              placeholder="Ej. MXC-1234, DEF-9012"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50/80 border border-slate-200/80 focus:bg-white focus:border-teal-500 focus:outline-none transition-all"
            />
          </div>

          <div className="flex gap-3 pt-3">
            <Btn type="submit" className="flex-1 font-semibold">
              {editingResident ? 'Guardar Cambios' : 'Registrar Residente'}
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
export default ResidentialDirectory
