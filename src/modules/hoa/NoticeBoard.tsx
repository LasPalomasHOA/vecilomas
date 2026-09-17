import { useState } from 'react'
import type { Notice, NoticeType } from '@/types/hoa'
import { useData } from '@/context/DataContext'
import GCard from '@/components/common/Card'
import Badge from '@/components/common/Badge'
import Btn from '@/components/common/Button'
import Modal from '@/components/common/Modal'
import Ico from '@/components/common/Icons'

export function NoticeBoard() {
  const { notices, addNotice, deleteNotice } = useData()
  const [filterType, setFilterType] = useState<'all' | NoticeType>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({
    title: '',
    type: 'Comunicado' as NoticeType,
    content: '',
    urgent: false,
  })

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title || !form.content) return

    addNotice({
      title: form.title,
      type: form.type,
      content: form.content,
      urgent: form.urgent,
    })

    setModalOpen(false)
    setForm({ title: '', type: 'Comunicado', content: '', urgent: false })
  }

  const filtered = notices.filter(n => (filterType === 'all' ? true : n.type === filterType))

  return (
    <div className="space-y-4">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar flex-nowrap sm:flex-wrap">
          {(['all', 'Mantenimiento', 'Asamblea', 'Servicio', 'Comunicado'] as const).map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                filterType === t
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
              }`}
            >
              {t === 'all' ? 'Todos los Avisos' : t}
            </button>
          ))}
        </div>

        <Btn onClick={() => setModalOpen(true)} className="shrink-0 whitespace-nowrap font-semibold">
          <Ico n="plus" c="w-4 h-4" />
          Publicar Comunicado
        </Btn>
      </div>

      {/* Notices List */}
      <div className="space-y-3.5">
        {filtered.map(n => (
          <GCard
            key={n.id}
            className={`hover:shadow-md transition-all duration-300 ${
              n.urgent ? 'border-amber-200/80 bg-gradient-to-r from-amber-50/40 via-white to-white' : ''
            }`}
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <Badge text={n.type} />
                  {n.urgent && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200/60 px-2.5 py-0.5 rounded-lg whitespace-nowrap shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                      Urgente
                    </span>
                  )}
                  <span className="text-xs text-slate-400 font-mono whitespace-nowrap">{n.date}</span>
                </div>
                <h4 className="font-display font-semibold text-slate-900 text-base mb-1.5">{n.title}</h4>
                <p className="text-sm text-slate-600 leading-relaxed max-w-4xl">{n.content}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                <button
                  onClick={() => deleteNotice(n.id)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-red-200/70 text-red-600 bg-red-50/50 hover:bg-red-50 hover:border-red-300 transition-colors cursor-pointer whitespace-nowrap shrink-0 shadow-2xs"
                >
                  Dar de baja
                </button>
              </div>
            </div>
          </GCard>
        ))}

        {filtered.length === 0 && (
          <GCard className="text-center py-12">
            <p className="text-slate-400 text-sm">No hay publicaciones activas en esta categoría.</p>
          </GCard>
        )}
      </div>

      {/* Modal New Notice */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Publicar Comunicado Oficial"
        subtitle="Emite avisos para que todos los residentes se mantengan informados."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-600">
              Título del Aviso
            </label>
            <input
              required
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Ej. Mantenimiento Preventivo de Elevadores"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50/80 border border-slate-200/80 focus:bg-white focus:border-teal-500 focus:outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-600">
                Categoría
              </label>
              <select
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value as NoticeType }))}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50/80 border border-slate-200/80 focus:bg-white focus:border-teal-500 focus:outline-none transition-all font-medium text-slate-700"
              >
                <option value="Comunicado">Comunicado General</option>
                <option value="Mantenimiento">Mantenimiento Programado</option>
                <option value="Asamblea">Convocatoria Asamblea</option>
                <option value="Servicio">Aviso de Servicios</option>
              </select>
            </div>
            <div className="flex items-center pt-2 sm:pt-6">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.urgent}
                  onChange={e => setForm(f => ({ ...f, urgent: e.target.checked }))}
                  className="rounded text-amber-600 focus:ring-amber-400 w-4 h-4 cursor-pointer"
                />
                Marcar como Urgente
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-600">
              Contenido del Comunicado
            </label>
            <textarea
              required
              rows={4}
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              placeholder="Describe detalladamente las fechas, horarios, instrucciones y recomendaciones para los vecinos..."
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50/80 border border-slate-200/80 focus:bg-white focus:border-teal-500 focus:outline-none transition-all resize-none"
            />
          </div>

          <div className="flex gap-3 pt-3">
            <Btn type="submit" className="flex-1 font-semibold">
              Publicar Aviso
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
export default NoticeBoard
