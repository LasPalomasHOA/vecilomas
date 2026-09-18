import { useState } from 'react'
import { useData } from '@/context/DataContext'
import ModHero from '@/components/common/ModHero'
import SubTabs from '@/components/common/SubTabs'
import GCard from '@/components/common/Card'
import Badge from '@/components/common/Badge'
import Ico from '@/components/common/Icons'

type ResidentNoticesTab = 'board' | 'documents'

export function ResidentNoticesView() {
  const { notices, documents } = useData()
  const [tab, setTab] = useState<ResidentNoticesTab>('board')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null)

  function handleDownload(docName: string) {
    setDownloadNotice(`Descargando documento: ${docName}...`)
    setTimeout(() => setDownloadNotice(null), 3000)
  }

  const filteredNotices = notices.filter(n => {
    if (categoryFilter === 'all') return true
    if (categoryFilter === 'urgent') return n.urgent
    return n.type.toLowerCase().includes(categoryFilter.toLowerCase())
  })

  return (
    <div>
      <ModHero
        icon={<Ico n="bell" c="w-6 h-6 text-teal-700" />}
        title="Comunicados y Documentos HOA"
        desc="Mantente informado con los avisos oficiales de la administración, reglamentos internos y actas de asamblea de Las Palomas Resort."
      />

      {downloadNotice && (
        <div className="mb-4 p-3.5 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 text-xs font-semibold flex items-center gap-2 animate-fade-in shadow-xs">
          <Ico n="check" c="w-4 h-4 text-teal-600" />
          {downloadNotice}
        </div>
      )}

      <SubTabs
        tabs={[
          { id: 'board' as ResidentNoticesTab, label: 'Tablón de Avisos', shortLabel: 'Avisos', badge: notices.length },
          { id: 'documents' as ResidentNoticesTab, label: 'Repositorio de Documentos', shortLabel: 'Documentos', badge: documents.length },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'board' && (
        <div className="space-y-4">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                categoryFilter === 'all'
                  ? 'bg-teal-800 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Todos ({notices.length})
            </button>
            <button
              onClick={() => setCategoryFilter('urgent')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                categoryFilter === 'urgent'
                  ? 'bg-red-700 text-white shadow-xs'
                  : 'bg-white text-red-700 border border-red-200 hover:bg-red-50'
              }`}
            >
              Urgentes ({notices.filter(n => n.urgent).length})
            </button>
            <button
              onClick={() => setCategoryFilter('Mantenimiento')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                categoryFilter === 'Mantenimiento'
                  ? 'bg-teal-800 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Mantenimiento
            </button>
            <button
              onClick={() => setCategoryFilter('Evento')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                categoryFilter === 'Evento'
                  ? 'bg-teal-800 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Eventos & Asambleas
            </button>
          </div>

          <div className="space-y-3">
            {filteredNotices.map(n => (
              <GCard
                key={n.id}
                className={`hover:shadow-sm transition-all duration-200 border ${
                  n.urgent
                    ? 'border-red-200 bg-red-50/40'
                    : 'border-slate-200/80 bg-white'
                }`}
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge text={n.type} />
                      {n.urgent && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-100 border border-red-200 px-2.5 py-0.5 rounded-lg whitespace-nowrap shrink-0">
                          Aviso Urgente
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 font-mono whitespace-nowrap shrink-0">📅 {n.date}</span>
                  </div>
                  <h4 className="font-display font-bold text-slate-900 text-base">{n.title}</h4>
                  <p className="text-sm text-slate-600 leading-relaxed">{n.content}</p>
                </div>
              </GCard>
            ))}

            {filteredNotices.length === 0 && (
              <GCard className="text-center py-12 bg-white border border-slate-200">
                <p className="text-sm text-slate-500">No hay avisos en esta categoría.</p>
              </GCard>
            )}
          </div>
        </div>
      )}

      {tab === 'documents' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map(d => (
            <GCard
              key={d.id}
              p="p-4"
              className="flex items-start gap-3.5 hover:shadow-md transition-all duration-200 group cursor-pointer border border-slate-200/80 bg-white"
              onClick={() => handleDownload(d.name)}
            >
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 border ${
                  d.category === 'Reglamento'
                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                    : d.category === 'Finanzas'
                    ? 'bg-teal-50 text-teal-700 border-teal-200'
                    : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                }`}
              >
                <Ico n="file" c="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="mb-1">
                  <Badge text={d.category} />
                </div>
                <p className="font-bold text-sm text-slate-800 group-hover:text-teal-800 transition-colors leading-snug">
                  {d.name}
                </p>
                <p className="text-[11px] mt-1 text-slate-400 font-mono whitespace-nowrap truncate">
                  {d.date} · {d.size}
                </p>
              </div>
              <button
                title="Descargar archivo"
                className="p-2 rounded-xl text-slate-400 group-hover:text-teal-700 group-hover:bg-teal-50 transition-colors shrink-0 cursor-pointer"
              >
                <Ico n="dl" c="w-4 h-4" />
              </button>
            </GCard>
          ))}
        </div>
      )}
    </div>
  )
}

export default ResidentNoticesView
