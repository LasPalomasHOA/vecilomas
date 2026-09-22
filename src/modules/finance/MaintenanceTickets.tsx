import { useState } from 'react'
import type { MaintenanceTicket, TicketPriority, TicketStatus } from '@/types/finance'
import { useData } from '@/context/DataContext'
import GCard from '@/components/common/Card'
import Badge from '@/components/common/Badge'
import Btn from '@/components/common/Button'
import Modal from '@/components/common/Modal'
import Ico from '@/components/common/Icons'
import { exportTicketsToExcel } from '@/utils/excelExporter'

export function MaintenanceTickets() {
  const { tickets, selectedCondominium, updateTicketStatus, addTicket } = useData()
  const [filterPriority, setFilterPriority] = useState<'all' | TicketPriority>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | TicketStatus>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [assignModal, setAssignModal] = useState<MaintenanceTicket | null>(null)
  const [assignee, setAssignee] = useState('')
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  // Form New Ticket
  const [form, setForm] = useState({
    location: '',
    reporter: 'Administración General',
    issue: '',
    priority: 'Media' as TicketPriority,
  })

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.location || !form.issue) return

    addTicket({
      location: form.location,
      reporter: form.reporter,
      issue: form.issue,
      priority: form.priority,
    })

    setModalOpen(false)
    setToastMsg('¡Nuevo ticket de mantenimiento reportado con éxito!')
    setTimeout(() => setToastMsg(null), 3500)
    setForm({ location: '', reporter: 'Administración General', issue: '', priority: 'Media' })
  }

  function handleStatusChange(id: string, newStatus: TicketStatus) {
    updateTicketStatus(id, newStatus)
    setToastMsg(`Ticket ${id} actualizado a estado "${newStatus}".`)
    setTimeout(() => setToastMsg(null), 3000)
  }

  function handleAssignSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!assignModal || !assignee) return

    updateTicketStatus(assignModal.id, 'En Proceso', assignee)
    setToastMsg(`Ticket ${assignModal.id} asignado a "${assignee}".`)
    setAssignModal(null)
    setAssignee('')
    setTimeout(() => setToastMsg(null), 3500)
  }

  const filtered = tickets.filter(t => {
    const matchP = filterPriority === 'all' || t.priority === filterPriority
    const matchS = filterStatus === 'all' || t.status === filterStatus
    return matchP && matchS
  })

  function handleExportExcel() {
    try {
      const fileName = exportTicketsToExcel(
        filtered,
        selectedCondominium?.name || 'Condominio Residencial Las Palomas'
      )
      setToastMsg(`📊 Reporte de tickets descargado: "${fileName}"`)
      setTimeout(() => setToastMsg(null), 4000)
    } catch (err: any) {
      setToastMsg(`Error al exportar tickets: ${err?.message || err}`)
    }
  }

  return (
    <div className="space-y-6">
      {toastMsg && (
        <div className="p-4 rounded-2xl bg-teal-50 border border-teal-100 text-teal-900 text-xs sm:text-sm font-semibold flex items-center gap-3 animate-fade-in shadow-xs">
          <Ico n="check" c="w-5 h-5 text-teal-600" />
          {toastMsg}
        </div>
      )}

      {/* Top Filter and Actions Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar flex-1 flex-wrap sm:flex-nowrap">
          {/* Priority filter */}
          <select
            value={filterPriority}
            onChange={e => setFilterPriority(e.target.value as any)}
            className="px-3 py-2 text-xs font-semibold rounded-xl text-slate-700 bg-slate-50/80 border border-slate-200/80 hover:bg-slate-100 transition-all shrink-0 whitespace-nowrap focus:outline-none focus:border-teal-500"
          >
            <option value="all">Todas las Prioridades</option>
            <option value="Alta">Alta Prioridad</option>
            <option value="Media">Media Prioridad</option>
            <option value="Baja">Baja Prioridad</option>
          </select>

          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as any)}
            className="px-3 py-2 text-xs font-semibold rounded-xl text-slate-700 bg-slate-50/80 border border-slate-200/80 hover:bg-slate-100 transition-all shrink-0 whitespace-nowrap focus:outline-none focus:border-teal-500"
          >
            <option value="all">Todos los Estados</option>
            <option value="Pendiente">Pendientes</option>
            <option value="En Proceso">En Proceso</option>
            <option value="Resuelto">Resueltos</option>
          </select>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
          <button
            onClick={handleExportExcel}
            title="Exportar tickets a Excel (.xlsx)"
            className="text-xs font-bold text-emerald-900 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 transition-all flex items-center gap-2 px-3.5 py-2.5 rounded-xl cursor-pointer whitespace-nowrap shadow-2xs active:scale-95"
          >
            <span className="w-5 h-5 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-[9px] font-black">
              XLS
            </span>
            <span>Exportar a Excel</span>
          </button>

          <Btn onClick={() => setModalOpen(true)} className="shrink-0 whitespace-nowrap font-semibold shadow-xs">
            <Ico n="plus" c="w-4 h-4" />
            <span>Nuevo Reporte</span>
          </Btn>
        </div>
      </div>

      {/* Tickets Cards */}
      <div className="space-y-3">
        {filtered.map(t => (
          <GCard
            key={t.id}
            className="hover:shadow-md transition-all duration-300"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-start gap-3.5 min-w-0 flex-1">
                <div
                  className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                    t.status === 'Resuelto'
                      ? 'bg-teal-50 text-teal-700'
                      : t.priority === 'Alta'
                      ? 'bg-rose-50 text-rose-600'
                      : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  <Ico n="tool" c="w-5 h-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-mono text-xs font-bold text-slate-400 whitespace-nowrap">{t.id}</span>
                    <Badge text={t.priority} />
                    <Badge text={t.status} />
                    {t.assignedTo && (
                      <span className="text-[11px] font-medium text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-lg border border-teal-100 whitespace-nowrap">
                        Asignado a: {t.assignedTo}
                      </span>
                    )}
                  </div>

                  <p className="font-semibold text-slate-900 text-sm mb-0.5">{t.issue}</p>
                  <p className="text-xs text-slate-400 font-mono truncate inline-flex items-center gap-1.5">
                    <Ico n="mapPin" c="w-3.5 h-3.5 text-slate-400" />
                    <span>{t.location}</span>
                    <span>·</span>
                    <span>{t.reporter}</span>
                    <span>·</span>
                    <span>{t.date}</span>
                  </p>
                </div>
              </div>

              {/* Action Controls */}
              <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                <select
                  value={t.status}
                  onChange={e => handleStatusChange(t.id, e.target.value as TicketStatus)}
                  className="text-xs font-semibold rounded-xl px-2.5 py-1.5 border border-slate-200 bg-white text-slate-700 cursor-pointer hover:border-slate-300 transition-colors whitespace-nowrap shadow-2xs"
                >
                  <option value="Pendiente">Pendiente</option>
                  <option value="En Proceso">En Proceso</option>
                  <option value="Resuelto">Resuelto</option>
                </select>

                <button
                  onClick={() => setAssignModal(t)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap shadow-2xs"
                >
                  Asignar
                </button>
              </div>
            </div>
          </GCard>
        ))}

        {filtered.length === 0 && (
          <GCard className="text-center py-12">
            <p className="text-slate-400 text-sm">No se encontraron tickets con los filtros seleccionados.</p>
          </GCard>
        )}
      </div>

      {/* Modal New Ticket */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Crear Ticket de Mantenimiento"
        subtitle="Registra reportes de fallas o anomalías detectadas en áreas comunes."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-600">
              Ubicación de la Falla
            </label>
            <input
              required
              value={form.location}
              onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
              placeholder="Ej. Pasillo Nivel 2, Elevador Torre B, Estacionamiento..."
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50/80 border border-slate-200/80 focus:bg-white focus:border-teal-500 focus:outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-600">
                Nivel de Prioridad
              </label>
              <select
                value={form.priority}
                onChange={e => setForm(f => ({ ...f, priority: e.target.value as TicketPriority }))}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50/80 border border-slate-200/80 focus:bg-white focus:border-teal-500 focus:outline-none transition-all font-medium text-slate-700"
              >
                <option value="Alta">Alta (Urgente)</option>
                <option value="Media">Media (Ordinaria)</option>
                <option value="Baja">Baja (Preventiva)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-600">
                Reportado Por
              </label>
              <input
                value={form.reporter}
                onChange={e => setForm(f => ({ ...f, reporter: e.target.value }))}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50/80 border border-slate-200/80 focus:bg-white focus:border-teal-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-600">
              Descripción del Problema
            </label>
            <textarea
              required
              rows={4}
              value={form.issue}
              onChange={e => setForm(f => ({ ...f, issue: e.target.value }))}
              placeholder="Describe detalladamente el daño, ruido o fuga detectada para el equipo técnico..."
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50/80 border border-slate-200/80 focus:bg-white focus:border-teal-500 focus:outline-none transition-all resize-none"
            />
          </div>

          <div className="flex gap-3 pt-3">
            <Btn type="submit" className="flex-1 font-semibold">
              Registrar Ticket
            </Btn>
            <Btn variant="ghost" onClick={() => setModalOpen(false)}>
              Cancelar
            </Btn>
          </div>
        </form>
      </Modal>

      {/* Modal Assign Technician */}
      <Modal
        isOpen={!!assignModal}
        onClose={() => setAssignModal(null)}
        title="Asignar Responsable Técnico"
        subtitle={assignModal ? `Ticket ${assignModal.id} — ${assignModal.location}` : ''}
      >
        {assignModal && (
          <form onSubmit={handleAssignSubmit} className="space-y-4">
            <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <strong className="text-slate-900">Falla:</strong> {assignModal.issue}
            </p>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-600">
                Proveedor / Técnico Encargado
              </label>
              <input
                required
                value={assignee}
                onChange={e => setAssignee(e.target.value)}
                placeholder="Ej. Plomería Rodríguez / Mantenimiento Elevadores"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50/80 border border-slate-200/80 focus:bg-white focus:border-teal-500 focus:outline-none transition-all"
              />
            </div>

            <div className="flex gap-3 pt-3">
              <Btn type="submit" className="flex-1 font-semibold">
                Guardar Asignación
              </Btn>
              <Btn variant="ghost" onClick={() => setAssignModal(null)}>
                Cancelar
              </Btn>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
export default MaintenanceTickets
