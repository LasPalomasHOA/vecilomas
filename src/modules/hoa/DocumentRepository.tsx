import { useState } from 'react'
import type { CommunityDocument, DocumentCategory } from '@/types/hoa'
import { useData } from '@/context/DataContext'
import GCard from '@/components/common/Card'
import Badge from '@/components/common/Badge'
import Btn from '@/components/common/Button'
import Modal from '@/components/common/Modal'
import Ico from '@/components/common/Icons'

export function DocumentRepository() {
  const { documents, addDocument, deleteDocument } = useData()
  const [selectedCat, setSelectedCat] = useState<'all' | DocumentCategory>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [downloadMsg, setDownloadMsg] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    category: 'Reglamento' as DocumentCategory,
    size: '1.5 MB',
  })

  function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name) return

    addDocument({
      name: form.name,
      category: form.category,
      size: form.size,
    })

    setModalOpen(false)
    setForm({ name: '', category: 'Reglamento', size: '1.5 MB' })
  }

  function handleDownload(docName: string) {
    setDownloadMsg(`Descargando archivo: "${docName}"...`)
    setTimeout(() => setDownloadMsg(null), 3000)
  }

  const filtered = documents.filter(d => (selectedCat === 'all' ? true : d.category === selectedCat))

  return (
    <div className="space-y-4">
      {/* Toast notification */}
      {downloadMsg && (
        <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-100 text-teal-800 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <Ico n="check" c="w-4 h-4 text-teal-600" />
          {downloadMsg}
        </div>
      )}

      {/* Top filter + Upload button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar flex-nowrap sm:flex-wrap">
          {(['all', 'Reglamento', 'Asamblea', 'Finanzas', 'Manuales', 'Políticas'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                selectedCat === cat
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
              }`}
            >
              {cat === 'all' ? 'Todos los Archivos' : cat}
            </button>
          ))}
        </div>

        <Btn onClick={() => setModalOpen(true)} className="shrink-0 whitespace-nowrap font-semibold">
          <Ico n="plus" c="w-4 h-4" />
          Subir Documento
        </Btn>
      </div>

      {/* Grid of Documents */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(d => (
          <GCard
            key={d.id}
            p="p-4"
            className="flex items-start gap-3.5 hover:shadow-md transition-all duration-300 group cursor-pointer"
          >
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                d.category === 'Reglamento'
                  ? 'bg-purple-50 text-purple-600'
                  : d.category === 'Finanzas'
                  ? 'bg-teal-50 text-teal-600'
                  : d.category === 'Asamblea'
                  ? 'bg-sky-50 text-sky-600'
                  : 'bg-rose-50 text-rose-500'
              }`}
            >
              <Ico n="file" c="w-5 h-5" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <Badge text={d.category} />
              </div>
              <p className="font-semibold text-sm text-slate-800 group-hover:text-teal-700 transition-colors leading-snug line-clamp-2">
                {d.name}
              </p>
              <p className="text-[11px] mt-1 text-slate-400 font-mono whitespace-nowrap truncate">
                {d.date} · {d.size}
              </p>
            </div>

            <div className="flex flex-col gap-1.5 shrink-0">
              <button
                onClick={() => handleDownload(d.name)}
                title="Descargar"
                className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors cursor-pointer"
              >
                <Ico n="dl" c="w-4 h-4" />
              </button>
              <button
                onClick={() => deleteDocument(d.id)}
                title="Eliminar"
                className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
              >
                <Ico n="x" c="w-4 h-4" />
              </button>
            </div>
          </GCard>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400 text-sm">
            No se encontraron documentos en esta categoría.
          </div>
        )}
      </div>

      {/* Modal Upload Document */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Subir Nuevo Documento Oficial"
        subtitle="Reglamentos, actas, balances financieros y manuales para consulta comunitaria."
      >
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-600">
              Nombre del Documento
            </label>
            <input
              required
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Ej. Reglamento de Uso de Alberca y Áreas Húmedas 2026"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50/80 border border-slate-200/80 focus:bg-white focus:border-teal-500 focus:outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-600">
                Categoría
              </label>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value as DocumentCategory }))}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50/80 border border-slate-200/80 focus:bg-white focus:border-teal-500 focus:outline-none transition-all font-medium text-slate-700"
              >
                <option value="Reglamento">Reglamento Interno</option>
                <option value="Asamblea">Acta de Asamblea</option>
                <option value="Finanzas">Estado Financiero</option>
                <option value="Manuales">Manual de Procedimientos</option>
                <option value="Políticas">Políticas de Uso</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-600">
                Tamaño Estimado
              </label>
              <input
                value={form.size}
                onChange={e => setForm(f => ({ ...f, size: e.target.value }))}
                placeholder="Ej. 2.1 MB"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50/80 border border-slate-200/80 focus:bg-white focus:border-teal-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="p-6 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors text-center cursor-pointer">
            <Ico n="file" c="w-10 h-10 mx-auto text-teal-600 mb-2" />
            <p className="text-xs font-semibold text-slate-700">Selecciona o arrastra el archivo PDF / DOCX</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Máximo 25 MB por archivo</p>
          </div>

          <div className="flex gap-3 pt-2">
            <Btn type="submit" className="flex-1 font-semibold">
              Confirmar y Subir
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
export default DocumentRepository
