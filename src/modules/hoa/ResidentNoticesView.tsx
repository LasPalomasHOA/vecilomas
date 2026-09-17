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
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null)

  function handleDownload(docName: string) {
    setDownloadNotice(`Descargando documento: ${docName}...`)
    setTimeout(() => setDownloadNotice(null), 3000)
  }

  return (
    <div>
      <ModHero
        icon={<Ico n="bell" c="w-6 h-6" />}
        title="Comunicados y Documentos HOA"
        desc="Mantente informado con los avisos oficiales de la administración, reglamentos internos y actas de asamblea."
      />

      {downloadNotice && (
        <div className="mb-4 p-3.5 rounded-2xl bg-teal-50 border border-teal-100 text-teal-800 text-xs font-semibold flex items-center gap-2 animate-fade-in">
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
        <div className="space-y-3.5">
          {notices.map(n => (
            <GCard
              key={n.id}
              className={`hover:shadow-md transition-all duration-300 ${
                n.urgent ? 'border-amber-200/80 bg-gradient-to-r from-amber-50/40 via-white to-white' : ''
              }`}
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge text={n.type} />
                    {n.urgent && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-lg whitespace-nowrap shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                        Importante
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 font-mono whitespace-nowrap shrink-0">{n.date}</span>
                </div>
                <h4 className="font-display font-semibold text-slate-900 text-base">{n.title}</h4>
                <p className="text-sm text-slate-600 leading-relaxed">{n.content}</p>
              </div>
            </GCard>
          ))}
        </div>
      )}

      {tab === 'documents' && (
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
                title="Descargar archivo"
                className="p-2 rounded-xl text-slate-400 group-hover:text-teal-600 group-hover:bg-teal-50 transition-colors shrink-0 cursor-pointer"
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
