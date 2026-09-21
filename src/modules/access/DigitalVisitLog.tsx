import { useState } from 'react'
import type { VisitStatus, VisitType } from '@/types/access'
import { useData } from '@/context/DataContext'
import Badge from '@/components/common/Badge'
import Btn from '@/components/common/Button'
import Modal from '@/components/common/Modal'
import Ico from '@/components/common/Icons'

export function DigitalVisitLog() {
  const { visits, checkInVisit, checkOutVisit, residents } = useData()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | VisitStatus>('all')
  const [modalOpen, setModalOpen] = useState(false)

  // Manual Register Form
  const [form, setForm] = useState({
    visitor: '',
    unit: residents[0]?.unit || '',
    host: residents[0]?.name || '',
    type: 'Visita' as VisitType,
    plate: '',
  })

  function handleManualCheckIn(e: React.FormEvent) {
    e.preventDefault()
    if (!form.visitor) return

    checkInVisit({
      visitor: form.visitor,
      host: form.host,
      unit: form.unit,
      type: form.type,
      plate: form.plate || undefined,
    })

    setModalOpen(false)
    setForm({ visitor: '', unit: residents[0]?.unit || '', host: residents[0]?.name || '', type: 'Visita', plate: '' })
  }

  const filtered = visits.filter(v => {
    const matchesSearch =
      v.visitor.toLowerCase().includes(search.toLowerCase()) ||
      v.unit.toLowerCase().includes(search.toLowerCase()) ||
      v.host.toLowerCase().includes(search.toLowerCase()) ||
      (v.plate && v.plate.toLowerCase().includes(search.toLowerCase()))

    const matchesStatus = filterStatus === 'all' || v.status === filterStatus

    return matchesSearch && matchesStatus
  })

  const inFacilityCount = visits.filter(v => v.status === 'En Instalaciones').length

  return (
    <div className="space-y-4">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 min-w-0">
          <div className="relative flex-1 min-w-0 max-w-md">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <Ico n="search" c="w-4 h-4" />
            </span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar visitante, residente, unidad..."
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl bg-slate-50/80 border border-slate-200/80 focus:bg-white focus:border-teal-500 focus:outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar flex-nowrap pb-0.5">
            {(['all', 'En Instalaciones', 'Completada'] as const).map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  filterStatus === s
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                }`}
              >
                {s === 'all' ? 'Todos' : s}
              </button>
            ))}
          </div>
        </div>

        <Btn onClick={() => setModalOpen(true)} className="w-full sm:w-auto shrink-0 whitespace-nowrap justify-center font-semibold shadow-xs">
          <Ico n="plus" c="w-4 h-4" />
          Ingreso Manual
        </Btn>
      </div>

      {/* Table of Visits */}
      <div className="rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02),0_4px_16px_rgba(0,0,0,0.02)] border border-slate-100 bg-white">
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 gap-2.5">
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <h3 className="font-display font-semibold text-slate-900 text-base">
              Bitácora Histórica de Accesos
            </h3>
            <span className="text-xs font-mono text-slate-400">({filtered.length} registros)</span>
          </div>
          <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-100 self-start sm:self-auto shrink-0 whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse" />
            {inFacilityCount} en instalaciones
          </span>
        </div>

        <div className="overflow-x-auto hide-scrollbar">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                {['Fecha', 'Visitante', 'Tipo', 'Destino / Anfitrión', 'Placas', 'Entrada', 'Salida', 'Estado', 'Acción'].map(h => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(v => (
                <tr key={v.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-3.5 text-xs font-mono text-slate-400 font-medium whitespace-nowrap">{v.date}</td>
                  <td className="px-5 py-3.5 font-semibold text-slate-800 whitespace-nowrap">{v.visitor}</td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <Badge text={v.type || 'Visita'} />
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <p className="font-medium text-slate-800">{v.host}</p>
                    <p className="text-xs text-teal-700 font-display font-bold">Unidad {v.unit}</p>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs text-slate-500 whitespace-nowrap">{v.plate || '—'}</td>
                  <td className="px-5 py-3.5 font-mono text-xs text-slate-700 font-bold whitespace-nowrap">{v.entry} hrs</td>
                  <td className="px-5 py-3.5 font-mono text-xs text-slate-500 whitespace-nowrap">{v.exit ? `${v.exit} hrs` : '—'}</td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <Badge text={v.status} />
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    {v.status === 'En Instalaciones' ? (
                      <button
                        onClick={() => checkOutVisit(v.id)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-teal-200 text-teal-700 bg-teal-50/60 hover:bg-teal-50 transition-colors cursor-pointer whitespace-nowrap shadow-2xs"
                      >
                        Registrar Salida
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400 font-mono whitespace-nowrap">Concluido</span>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-slate-400 text-sm">
                    No se encontraron registros de visita.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Manual Visit Entry */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Registrar Ingreso Manual en Caseta"
        subtitle="Para visitas sin cita previa, técnicos o repartidores autorizados por el residente."
      >
        <form onSubmit={handleManualCheckIn} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-600">
              Nombre del Visitante / Proveedor
            </label>
            <input
              required
              value={form.visitor}
              onChange={e => setForm(f => ({ ...f, visitor: e.target.value }))}
              placeholder="Ej. Técnico Izzi / Uber Eats"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50/80 border border-slate-200/80 focus:bg-white focus:border-teal-500 focus:outline-none transition-all font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-600">
                Unidad Destino
              </label>
              <select
                value={form.unit}
                onChange={e => {
                  const u = e.target.value
                  const res = residents.find(r => r.unit === u)
                  setForm(f => ({ ...f, unit: u, host: res ? res.name : f.host }))
                }}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50/80 border border-slate-200/80 focus:bg-white focus:border-teal-500 focus:outline-none transition-all font-medium text-slate-700"
              >
                {residents.map(r => (
                  <option key={r.id} value={r.unit}>
                    {r.unit} — {r.name.split(' ')[0]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-600">
                Tipo de Acceso
              </label>
              <select
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value as VisitType }))}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50/80 border border-slate-200/80 focus:bg-white focus:border-teal-500 focus:outline-none transition-all font-medium text-slate-700"
              >
                <option value="Visita">Visita</option>
                <option value="Repartidor">Repartidor</option>
                <option value="Técnico">Técnico</option>
                <option value="Proveedor">Proveedor</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-600">
              Placas de Vehículo / Moto (Opcional)
            </label>
            <input
              value={form.plate}
              onChange={e => setForm(f => ({ ...f, plate: e.target.value }))}
              placeholder="Ej. MOTO-881 / JKL-1029"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50/80 border border-slate-200/80 focus:bg-white focus:border-teal-500 focus:outline-none transition-all font-mono"
            />
          </div>

          <div className="flex gap-3 pt-3">
            <Btn type="submit" className="flex-1 font-semibold">
              Registrar Entrada
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
export default DigitalVisitLog
