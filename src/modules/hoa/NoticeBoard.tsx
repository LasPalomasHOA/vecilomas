import { useState } from 'react'
import type { NoticeType } from '@/types/hoa'
import { useData } from '@/context/DataContext'
import GCard from '@/components/common/Card'
import Badge from '@/components/common/Badge'
import Btn from '@/components/common/Button'
import Modal from '@/components/common/Modal'
import Ico from '@/components/common/Icons'

export function NoticeBoard() {
  const { notices, addNotice, deleteNotice, residents } = useData()
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  const [form, setForm] = useState({
    title: '',
    type: 'Comunicado' as NoticeType,
    content: '',
    urgent: false,
    pinned: false,
    audience: 'Todos los residentes',
    expiresAt: '',
    attachmentName: '',
  })

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim() || !form.content.trim()) return

    addNotice({
      title: form.title.trim(),
      type: form.type,
      content: form.content.trim(),
      urgent: form.urgent,
      pinned: form.pinned,
      audience: form.audience,
      expiresAt: form.expiresAt || undefined,
      attachment: form.attachmentName.trim()
        ? {
            name: form.attachmentName.trim().endsWith('.pdf')
              ? form.attachmentName.trim()
              : `${form.attachmentName.trim()}.pdf`,
            size: '1.4 MB',
          }
        : undefined,
    })

    setModalOpen(false)
    setForm({
      title: '',
      type: 'Comunicado',
      content: '',
      urgent: false,
      pinned: false,
      audience: 'Todos los residentes',
      expiresAt: '',
      attachmentName: '',
    })
    setFeedback('¡Comunicado oficial publicado con éxito en el tablón!')
    setTimeout(() => setFeedback(null), 3500)
  }

  function handleDelete(id: number, title: string) {
    deleteNotice(id)
    setFeedback(`El aviso "${title}" ha sido retirado del tablón.`)
    setTimeout(() => setFeedback(null), 3500)
  }

  // Filter logic (Search query)
  const filtered = notices.filter(n => {
    if (search.trim()) {
      const q = search.toLowerCase()
      const matchTitle = n.title.toLowerCase().includes(q)
      const matchContent = n.content.toLowerCase().includes(q)
      const matchAudience = n.audience?.toLowerCase().includes(q)
      if (!matchTitle && !matchContent && !matchAudience) return false
    }
    return true
  })

  const urgentNotices = filtered.filter(n => n.urgent)
  const generalNotices = filtered.filter(n => !n.urgent).sort((a, b) => {
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    return 0
  })

  const totalNotices = notices.length
  const urgentCount = notices.filter(n => n.urgent).length
  const pinnedCount = notices.filter(n => n.pinned).length
  const totalResidents = residents.length || 8
  const totalAcks = notices.reduce((acc, n) => acc + (n.acknowledgments || 0), 0)
  const avgReadRate = totalNotices > 0 ? Math.round((totalAcks / (totalNotices * totalResidents)) * 100) : 0

  return (
    <div className="space-y-4">
      {/* Toast Feedback */}
      {feedback && (
        <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold flex items-center gap-2 animate-fade-in shadow-xs">
          <Ico n="check" c="w-4 h-4 text-teal-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
            <Ico n="bell" c="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Avisos Totales</p>
            <p className="text-xl font-display font-bold text-slate-900 mt-0.5">{totalNotices}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Ico n="info" c="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Urgentes</p>
            <p className="text-xl font-display font-bold text-amber-600 mt-0.5">{urgentCount}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Ico n="tag" c="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Fijados Arriba</p>
            <p className="text-xl font-display font-bold text-purple-700 mt-0.5">{pinnedCount}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Ico n="users" c="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Alcance Vecinal</p>
            <p className="text-xl font-display font-bold text-emerald-700 mt-0.5">{avgReadRate}% leídos</p>
          </div>
        </div>
      </div>

      {/* Control Header: Search & Publish */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar comunicados por palabra clave, edificio o título..."
              className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 border border-slate-200/80 focus:bg-white focus:border-teal-600 focus:outline-none transition-all font-medium text-slate-800"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Ico n="search" c="w-4 h-4" />
            </div>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <Ico n="x" c="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <Btn onClick={() => setModalOpen(true)} className="shrink-0 whitespace-nowrap font-semibold">
            <Ico n="plus" c="w-4 h-4" />
            <span>Publicar Comunicado</span>
          </Btn>
        </div>
      </div>

      {/* DISCREET SECTION 1: ATENCIÓN PRIORITARIA */}
      {urgentNotices.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Atención Prioritaria
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/70">
              {urgentNotices.length} {urgentNotices.length === 1 ? 'aviso urgente' : 'avisos urgentes'}
            </span>
          </div>

          <div className="space-y-3">
            {urgentNotices.map(n => (
              <div
                key={n.id}
                className="rounded-2xl p-4 sm:p-5 bg-white border border-slate-200/80 border-l-4 border-l-amber-500 shadow-xs hover:shadow-md transition-all duration-200"
              >
                <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-md">
                        <Ico n="zap" c="w-3.5 h-3.5 text-amber-600" />
                        Urgente
                      </span>
                      <Badge text={n.type} />
                      {n.audience && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          <Ico n="users" c="w-3 h-3 text-slate-400" />
                          {n.audience}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 text-slate-400 text-xs font-mono">
                        <Ico n="calendar" c="w-3.5 h-3.5 text-slate-400" />
                        {n.date}
                      </span>
                      {n.expiresAt && (
                        <span className="inline-flex items-center gap-1 text-amber-800 bg-amber-50 font-bold px-2 py-0.5 rounded-md text-[11px] font-mono border border-amber-200/60">
                          <Ico n="clock" c="w-3 h-3 text-amber-700" />
                          Vigencia: {n.expiresAt}
                        </span>
                      )}
                    </div>

                    <h4 className="font-display font-semibold text-slate-900 text-base leading-snug">
                      {n.title}
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                      {n.content}
                    </p>

                    {n.attachment && (
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700">
                        <Ico n="file" c="w-3.5 h-3.5 text-teal-600" />
                        <span className="font-medium">{n.attachment.name}</span>
                        <span className="text-slate-400 text-[10px]">({n.attachment.size})</span>
                      </div>
                    )}
                  </div>

                  {/* Reading Stats & Action */}
                  <div className="flex md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <div className="text-left md:text-right">
                      <div className="flex items-center md:justify-end gap-1.5">
                        <span className="text-xs font-bold text-teal-700">
                          {n.acknowledgments || 0} de {totalResidents}
                        </span>
                        <span className="text-[11px] text-slate-400">enterados</span>
                      </div>
                      <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                        <div
                          className="bg-teal-600 h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, Math.round(((n.acknowledgments || 0) / totalResidents) * 100))}%`,
                          }}
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(n.id, n.title)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      title="Eliminar aviso"
                      aria-label="Eliminar aviso"
                    >
                      <Ico n="x" c="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DISCREET SECTION 2: COMUNICADOS GENERALES */}
      <div className="space-y-3">
        {urgentNotices.length > 0 && generalNotices.length > 0 && (
          <div className="flex items-center gap-2 px-1 pt-2">
            <span className="w-2 h-2 rounded-full bg-slate-300" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Comunicados Generales
            </h3>
          </div>
        )}

        <div className="space-y-3">
          {generalNotices.map(n => (
            <GCard
              key={n.id}
              className={`hover:shadow-md transition-all duration-200 ${
                n.pinned
                  ? 'border-purple-200/80 bg-gradient-to-r from-purple-50/20 via-white to-white'
                  : ''
              }`}
            >
              <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                <div className="flex-1 min-w-0 space-y-2">
                  {/* Meta Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    {n.pinned && (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-purple-800 bg-purple-100/80 border border-purple-200 px-2.5 py-0.5 rounded-md">
                        <Ico n="pin" c="w-3.5 h-3.5 text-purple-600" />
                        Fijado
                      </span>
                    )}
                    <Badge text={n.type} />
                    {n.audience && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        <Ico n="users" c="w-3 h-3 text-slate-400" />
                        {n.audience}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-slate-400 text-xs font-mono">
                      <Ico n="calendar" c="w-3.5 h-3.5 text-slate-400" />
                      {n.date}
                    </span>
                    {n.expiresAt && (
                      <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md text-[11px] font-mono">
                        Vigencia: {n.expiresAt}
                      </span>
                    )}
                  </div>

                  {/* Title & Body */}
                  <h4 className="font-display font-semibold text-slate-900 text-base leading-snug">
                    {n.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                    {n.content}
                  </p>

                  {/* Attachment info if exists */}
                  {n.attachment && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700">
                      <Ico n="file" c="w-3.5 h-3.5 text-teal-600" />
                      <span className="font-medium">{n.attachment.name}</span>
                      <span className="text-slate-400 text-[10px]">({n.attachment.size})</span>
                    </div>
                  )}
                </div>

                {/* Reading Stats & Action */}
                <div className="flex md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <div className="text-left md:text-right">
                    <div className="flex items-center md:justify-end gap-1.5">
                      <span className="text-xs font-bold text-teal-700">
                        {n.acknowledgments || 0} de {totalResidents}
                      </span>
                      <span className="text-[11px] text-slate-400">enterados</span>
                    </div>
                    <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                      <div
                        className="bg-teal-600 h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, Math.round(((n.acknowledgments || 0) / totalResidents) * 100))}%`,
                        }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(n.id, n.title)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    title="Eliminar aviso"
                    aria-label="Eliminar aviso"
                  >
                    <Ico n="x" c="w-4 h-4" />
                  </button>
                </div>
              </div>
            </GCard>
          ))}
        </div>
      </div>

      {filtered.length === 0 && (
        <GCard className="text-center py-12">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Ico n="bell" c="w-6 h-6" />
          </div>
          <p className="font-semibold text-slate-800 text-sm">No se encontraron comunicados</p>
          <p className="text-slate-400 text-xs mt-1">Borra el texto de búsqueda para ver todos los avisos.</p>
        </GCard>
      )}

      {/* Publish Notice Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Publicar Comunicado Oficial"
        subtitle="Emite avisos, circulares o notificaciones a los residentes de la comunidad."
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-600">
              Título del Comunicado
            </label>
            <input
              required
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Ej. Mantenimiento general a cisternas y bombas de agua"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50/80 border border-slate-200/80 focus:bg-white focus:border-teal-500 focus:outline-none transition-all font-medium text-slate-800"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-600">
                Categoría del Aviso
              </label>
              <select
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value as NoticeType }))}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50/80 border border-slate-200/80 focus:bg-white focus:border-teal-500 focus:outline-none transition-all font-medium text-slate-700 cursor-pointer"
              >
                <option value="Comunicado">Comunicado General</option>
                <option value="Mantenimiento">Mantenimiento</option>
                <option value="Asamblea">Asamblea</option>
                <option value="Servicio">Servicio</option>
                <option value="Seguridad">Seguridad</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-600">
                Audiencia Objetivo
              </label>
              <select
                value={form.audience}
                onChange={e => setForm(f => ({ ...f, audience: e.target.value }))}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50/80 border border-slate-200/80 focus:bg-white focus:border-teal-500 focus:outline-none transition-all font-medium text-slate-700 cursor-pointer"
              >
                <option value="Todos los residentes">Todos los residentes</option>
                <option value="Propietarios únicamente">Propietarios únicamente</option>
                <option value="Torre A">Torre A</option>
                <option value="Torre B">Torre B</option>
                <option value="Villas">Villas</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-600">
                Fecha de Vigencia / Límite (Opcional)
              </label>
              <input
                type="date"
                value={form.expiresAt}
                onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50/80 border border-slate-200/80 focus:bg-white focus:border-teal-500 focus:outline-none transition-all font-mono text-slate-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-600">
                Documento Adjunto (Opcional)
              </label>
              <input
                value={form.attachmentName}
                onChange={e => setForm(f => ({ ...f, attachmentName: e.target.value }))}
                placeholder="Ej. Convocatoria_Asamblea_2026.pdf"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50/80 border border-slate-200/80 focus:bg-white focus:border-teal-500 focus:outline-none transition-all font-medium text-slate-700"
              />
            </div>
          </div>

          {/* Checkboxes: Pinned & Urgent */}
          <div className="flex flex-wrap items-center gap-6 p-3 rounded-xl bg-slate-50 border border-slate-200/60">
            <label className="flex items-center gap-2 text-xs font-semibold text-purple-900 cursor-pointer">
              <input
                type="checkbox"
                checked={form.pinned}
                onChange={e => setForm(f => ({ ...f, pinned: e.target.checked }))}
                className="rounded text-purple-600 focus:ring-purple-400 w-4 h-4 cursor-pointer"
              />
              <span className="inline-flex items-center gap-1.5">
                <Ico n="pin" c="w-3.5 h-3.5 text-purple-600" />
                Fijar en la parte superior
              </span>
            </label>

            <label className="flex items-center gap-2 text-xs font-semibold text-amber-900 cursor-pointer">
              <input
                type="checkbox"
                checked={form.urgent}
                onChange={e => setForm(f => ({ ...f, urgent: e.target.checked }))}
                className="rounded text-amber-600 focus:ring-amber-400 w-4 h-4 cursor-pointer"
              />
              <span className="inline-flex items-center gap-1.5">
                <Ico n="zap" c="w-3.5 h-3.5 text-amber-600" />
                Marcar como Urgente
              </span>
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-600">
              Contenido Detallado
            </label>
            <textarea
              required
              rows={4}
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              placeholder="Describe detalladamente las fechas, horarios, instrucciones y recomendaciones para los vecinos..."
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50/80 border border-slate-200/80 focus:bg-white focus:border-teal-500 focus:outline-none transition-all resize-none font-medium text-slate-700"
            />
          </div>

          <div className="flex gap-3 pt-3">
            <Btn type="submit" className="flex-1 font-semibold">
              Publicar Aviso Oficial
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
