import { useState } from 'react'
import { useData } from '@/context/DataContext'
import ModHero from '@/components/common/ModHero'
import SubTabs from '@/components/common/SubTabs'
import GCard from '@/components/common/Card'
import Badge from '@/components/common/Badge'
import Ico from '@/components/common/Icons'

type ResidentNoticesTab = 'board' | 'documents'

interface ResidentNoticesViewProps {
  unit?: string
  name?: string
}

export function ResidentNoticesView({ unit = 'A-101' }: ResidentNoticesViewProps) {
  const { notices, documents, acknowledgeNotice } = useData()
  const [tab, setTab] = useState<ResidentNoticesTab>('board')
  const [search, setSearch] = useState('')
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null)
  const [ackToast, setAckToast] = useState<string | null>(null)

  function handleDownload(docName: string) {
    setDownloadNotice(`Descargando documento oficial: "${docName}"...`)
    setTimeout(() => setDownloadNotice(null), 3500)
  }

  function handleAcknowledge(noticeId: number, title: string) {
    acknowledgeNotice(noticeId, unit)
    setAckToast(`Has confirmado de enterado el aviso: "${title}". Se ha movido a tu lista general.`)
    setTimeout(() => setAckToast(null), 3500)
  }

  // Filter notices by search query
  const searchFiltered = notices.filter(n => {
    if (search.trim()) {
      const q = search.toLowerCase()
      const matchTitle = n.title.toLowerCase().includes(q)
      const matchContent = n.content.toLowerCase().includes(q)
      if (!matchTitle && !matchContent) return false
    }
    return true
  })

  // Pending urgent notices: ONLY urgent notices NOT yet confirmed by this resident
  const pendingUrgentNotices = searchFiltered.filter(
    n => n.urgent && !(n.readBy || []).includes(unit)
  )

  // General & already acknowledged urgent notices: grouped together in the main list
  const generalAndReadNotices = searchFiltered
    .filter(n => !n.urgent || (n.readBy || []).includes(unit))
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      return 0
    })

  return (
    <div className="space-y-4">
      <ModHero
        icon={<Ico n="bell" c="w-6 h-6 text-teal-700" />}
        title="Comunicados y Documentos HOA"
        desc="Mantente informado con los avisos oficiales de la administración, reglamentos internos y actas de asamblea de Las Palomas Resort."
      />

      {/* Toast Feedback */}
      {(downloadNotice || ackToast) && (
        <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-100 text-teal-900 text-xs sm:text-sm font-semibold flex items-center gap-2 animate-fade-in shadow-xs">
          <Ico n="check" c="w-4 h-4 text-teal-600 shrink-0" />
          <span>{downloadNotice || ackToast}</span>
        </div>
      )}

      <SubTabs
        tabs={[
          { id: 'board' as ResidentNoticesTab, label: 'Tablón de Comunicados', shortLabel: 'Avisos', badge: notices.length },
          { id: 'documents' as ResidentNoticesTab, label: 'Reglamentos y Documentos', shortLabel: 'Documentos', badge: documents.length },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'board' && (
        <div className="space-y-5">
          {/* Search Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar avisos por palabra clave (ej. elevador, asamblea, agua)..."
                className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 border border-slate-200/80 focus:bg-white focus:border-teal-600 focus:outline-none transition-all font-medium text-slate-800"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Ico n="search" c="w-4 h-4" />
              </div>
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs p-1 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* APARTADO PRIORITARIO: Se muestra ÚNICAMENTE si hay avisos urgentes pendientes de confirmar */}
          {pendingUrgentNotices.length > 0 && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Atención Prioritaria
                  </h3>
                </div>
                <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/70">
                  {pendingUrgentNotices.length} {pendingUrgentNotices.length === 1 ? 'pendiente de enterado' : 'pendientes de enterado'}
                </span>
              </div>

              <div className="space-y-3">
                {pendingUrgentNotices.map(n => (
                  <div
                    key={n.id}
                    className="rounded-2xl p-4 sm:p-5 bg-white border border-slate-200/80 border-l-4 border-l-amber-500 shadow-xs hover:shadow-md transition-all duration-200 space-y-3"
                  >
                    {/* Header row */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-md">
                          ⚡ Urgente
                        </span>
                        <Badge text={n.type} />
                        {n.audience && (
                          <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                            👥 {n.audience}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs font-mono text-slate-400 shrink-0">
                        <span>📅 {n.date}</span>
                        {n.expiresAt && (
                          <span className="text-amber-700 bg-amber-50/80 px-2 py-0.5 rounded text-[11px]">
                            Vigencia: {n.expiresAt}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div>
                      <h4 className="font-display font-bold text-slate-900 text-base mb-1 leading-snug">
                        {n.title}
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                        {n.content}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                      {n.attachment ? (
                        <button
                          type="button"
                          onClick={() => handleDownload(n.attachment!.name)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-teal-50 border border-slate-200 text-xs font-semibold text-slate-700 hover:text-teal-800 transition-all cursor-pointer group"
                        >
                          <Ico n="file" c="w-3.5 h-3.5 text-teal-600" />
                          <span className="truncate max-w-[200px] sm:max-w-xs">{n.attachment.name}</span>
                          <span className="text-slate-400 text-[10px]">({n.attachment.size})</span>
                          <Ico n="dl" c="w-3.5 h-3.5 text-teal-600 ml-1" />
                        </button>
                      ) : (
                        <div />
                      )}

                      <button
                        type="button"
                        onClick={() => handleAcknowledge(n.id, n.title)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-3.5 py-1.5 rounded-xl transition-colors cursor-pointer self-end sm:self-center"
                      >
                        <Ico n="check" c="w-3.5 h-3.5 text-amber-800" />
                        <span>Confirmar de enterado</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* LISTA DE COMUNICADOS GENERALES Y YA CONFIRMADOS */}
          <div className="space-y-3">
            {pendingUrgentNotices.length > 0 && generalAndReadNotices.length > 0 && (
              <div className="flex items-center gap-2 px-1 pt-1">
                <span className="w-2 h-2 rounded-full bg-slate-300" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Comunicados Generales
                </h3>
              </div>
            )}

            <div className="space-y-3">
              {generalAndReadNotices.map(n => {
                const isAcknowledged = (n.readBy || []).includes(unit)

                return (
                  <GCard
                    key={n.id}
                    className={`hover:shadow-md transition-all duration-200 ${
                      n.urgent
                        ? 'border-slate-200/80 bg-slate-50/40'
                        : n.pinned
                        ? 'border-purple-200/90 bg-gradient-to-r from-purple-50/20 via-white to-white'
                        : ''
                    }`}
                  >
                    <div className="flex flex-col gap-3">
                      {/* Header line */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          {n.urgent ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                              ⚡ Urgente
                            </span>
                          ) : n.pinned ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-800 bg-purple-100 border border-purple-200 px-2.5 py-0.5 rounded-md">
                              📌 Fijado
                            </span>
                          ) : null}
                          <Badge text={n.type} />
                          {n.audience && (
                            <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                              👥 {n.audience}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono shrink-0">
                          <span>📅 {n.date}</span>
                          {n.expiresAt && (
                            <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                              Vigencia: {n.expiresAt}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Title & Body */}
                      <div>
                        <h4 className="font-display font-bold text-slate-900 text-base mb-1 leading-snug">
                          {n.title}
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                          {n.content}
                        </p>
                      </div>

                      {/* Footer Actions */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                        {n.attachment ? (
                          <button
                            type="button"
                            onClick={() => handleDownload(n.attachment!.name)}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-teal-50 border border-slate-200 text-xs font-semibold text-slate-700 hover:text-teal-800 transition-all cursor-pointer group"
                          >
                            <Ico n="file" c="w-3.5 h-3.5 text-teal-600" />
                            <span className="truncate max-w-[200px] sm:max-w-xs">{n.attachment.name}</span>
                            <span className="text-slate-400 text-[10px]">({n.attachment.size})</span>
                            <Ico n="dl" c="w-3.5 h-3.5 text-teal-600 ml-1" />
                          </button>
                        ) : (
                          <div />
                        )}

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          {isAcknowledged ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                              <Ico n="check" c="w-3.5 h-3.5 text-emerald-600" />
                              <span>Confirmado (Depto {unit})</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleAcknowledge(n.id, n.title)}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3.5 py-1.5 rounded-xl transition-colors cursor-pointer"
                            >
                              <Ico n="check" c="w-3.5 h-3.5 text-teal-600" />
                              <span>Confirmar de enterado</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </GCard>
                )
              })}
            </div>
          </div>

          {searchFiltered.length === 0 && (
            <GCard className="text-center py-14">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Ico n="bell" c="w-6 h-6" />
              </div>
              <p className="font-semibold text-slate-800 text-base">No se encontraron comunicados</p>
              <p className="text-slate-400 text-xs mt-1">Borra el texto de búsqueda para ver todos los avisos.</p>
            </GCard>
          )}
        </div>
      )}

      {tab === 'documents' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex items-center justify-between">
            <div>
              <p className="font-display font-bold text-slate-900 text-sm">Biblioteca Oficial de la Comunidad</p>
              <p className="text-xs text-slate-500 mt-0.5">Consulta y descarga reglamentos internos, actas de asamblea y manuales vigentes.</p>
            </div>
            <span className="text-xs font-mono font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100">
              {documents.length} Archivos
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map(d => (
              <GCard
                key={d.id}
                p="p-4"
                className="flex items-start gap-3.5 hover:shadow-md transition-all duration-300 group cursor-pointer"
                onClick={() => handleDownload(d.name)}
              >
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                    d.category === 'Reglamento'
                      ? 'bg-purple-50 text-purple-600'
                      : d.category === 'Finanzas'
                      ? 'bg-teal-50 text-teal-600'
                      : 'bg-rose-50 text-rose-500'
                  }`}
                >
                  <Ico n="file" c="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="mb-1">
                    <Badge text={d.category} />
                  </div>
                  <p className="font-semibold text-sm text-slate-800 group-hover:text-teal-700 transition-colors leading-snug">
                    {d.name}
                  </p>
                  <p className="text-[11px] mt-1 text-slate-400 font-mono whitespace-nowrap truncate">
                    {d.date} · {d.size}
                  </p>
                </div>
                <button
                  type="button"
                  title="Descargar archivo"
                  className="p-2 rounded-xl text-slate-400 group-hover:text-teal-600 group-hover:bg-teal-50 transition-colors shrink-0 cursor-pointer"
                >
                  <Ico n="dl" c="w-4 h-4" />
                </button>
              </GCard>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
export default ResidentNoticesView
