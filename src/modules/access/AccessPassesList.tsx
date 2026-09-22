import { useState, useMemo } from 'react'
import type { AccessPass, VisitType } from '@/types/access'
import { useData } from '@/context/DataContext'
import GCard from '@/components/common/Card'
import Badge from '@/components/common/Badge'
import Btn from '@/components/common/Button'
import Ico from '@/components/common/Icons'
import QRVisual from '@/components/common/QRVisual'
import Modal from '@/components/common/Modal'
import { shareQRPassToWhatsApp, downloadQRPassImage } from '@/utils/qrPassImageGenerator'

interface AccessPassesListProps {
  onNavigateToGenerate?: () => void
}

export function AccessPassesList({ onNavigateToGenerate }: AccessPassesListProps) {
  const { accessPasses } = useData()

  // State: Filtros y Búsqueda
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'Activo' | 'Utilizado' | 'Expirado'>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'upcoming'>('all')

  // State: Modal & Acciones
  const [selectedPass, setSelectedPass] = useState<AccessPass | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [sharingPassId, setSharingPassId] = useState<string | null>(null)
  const [downloadingPassId, setDownloadingPassId] = useState<string | null>(null)

  const todayStr = new Date().toISOString().split('T')[0]

  // Métricas
  const stats = useMemo(() => {
    const total = accessPasses.length
    const active = accessPasses.filter(p => p.status === 'Activo').length
    const used = accessPasses.filter(p => p.status === 'Utilizado').length
    const expired = accessPasses.filter(p => p.status === 'Expirado').length
    const todayCount = accessPasses.filter(p => p.validDate === todayStr).length
    return { total, active, used, expired, todayCount }
  }, [accessPasses, todayStr])

  // Lista filtrada
  const filteredPasses = useMemo(() => {
    return accessPasses.filter(p => {
      // Búsqueda por texto
      if (search.trim()) {
        const q = search.toLowerCase()
        const matchesVisitor = p.visitor.toLowerCase().includes(q)
        const matchesHost = p.host.toLowerCase().includes(q)
        const matchesUnit = p.unit.toLowerCase().includes(q)
        const matchesCode = p.code.toLowerCase().includes(q)
        if (!matchesVisitor && !matchesHost && !matchesUnit && !matchesCode) {
          return false
        }
      }

      // Filtro de Estado
      if (statusFilter !== 'all' && p.status !== statusFilter) {
        return false
      }

      // Filtro de Tipo
      if (typeFilter !== 'all' && p.visitType !== typeFilter) {
        return false
      }

      // Filtro de Fecha
      if (dateFilter === 'today' && p.validDate !== todayStr) {
        return false
      }
      if (dateFilter === 'upcoming' && p.validDate < todayStr) {
        return false
      }

      return true
    })
  }, [accessPasses, search, statusFilter, typeFilter, dateFilter, todayStr])

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  function handleCopy(code: string) {
    navigator.clipboard.writeText(code)
    showToast(`¡Código ${code} copiado al portapapeles!`)
  }

  async function handleShare(pass: AccessPass) {
    setSharingPassId(pass.id)
    try {
      const res = await shareQRPassToWhatsApp(pass)
      if (res.message) {
        showToast(res.message)
      } else if (res.shared) {
        showToast(`¡Pase para ${pass.visitor} enviado a WhatsApp!`)
      }
    } catch (err) {
      console.error('Error al compartir pase:', err)
      const text = `¡Hola ${pass.visitor}! Te comparto tu Pase de Acceso Digital para Las Palomas Residencial:\n\n• Código: ${pass.code}\n• Unidad: ${pass.unit} (${pass.host})\n• Vigencia: ${pass.validDate} a las ${pass.validTime} hrs\n\nPor favor muéstralo en la caseta de entrada.`
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank')
    } finally {
      setSharingPassId(null)
    }
  }

  async function handleDownload(pass: AccessPass) {
    setDownloadingPassId(pass.id)
    try {
      await downloadQRPassImage(pass)
      showToast(`¡Imagen PNG del pase para ${pass.visitor} descargada!`)
    } catch (err) {
      console.error('Error al descargar:', err)
    } finally {
      setDownloadingPassId(null)
    }
  }

  const getTypeIcon = (type: VisitType) => {
    switch (type) {
      case 'Repartidor':
        return <Ico n="truck" c="w-3.5 h-3.5 text-teal-600" />
      case 'Familiar':
        return <Ico n="car" c="w-3.5 h-3.5 text-indigo-600" />
      case 'Técnico':
        return <Ico n="tool" c="w-3.5 h-3.5 text-amber-600" />
      case 'Proveedor':
        return <Ico n="building" c="w-3.5 h-3.5 text-purple-600" />
      default:
        return <Ico n="user" c="w-3.5 h-3.5 text-slate-600" />
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 text-xs font-semibold flex items-center gap-2 shadow-sm animate-fade-in">
          <Ico n="check" c="w-4 h-4 text-teal-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-display font-bold text-slate-900 text-xl sm:text-2xl">
            Pases de Acceso Generados
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Registro, control y descarga de pases QR emitidos para visitas, proveedores y residentes.
          </p>
        </div>

        {onNavigateToGenerate && (
          <Btn onClick={onNavigateToGenerate} className="shrink-0 shadow-sm">
            <Ico n="plus" c="w-4 h-4" />
            Generar Nuevo Pase
          </Btn>
        )}
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">Total Emitidos</p>
          <div className="flex items-baseline justify-between mt-1">
            <p className="text-2xl font-black text-slate-900 font-display">{stats.total}</p>
            <span className="text-xs text-slate-500 font-medium">{stats.todayCount} hoy</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-800">Activos / Vigentes</p>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <p className="text-2xl font-black text-emerald-950 font-display mt-1">{stats.active}</p>
        </div>

        <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80 shadow-2xs">
          <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-blue-800">Utilizados</p>
          <p className="text-2xl font-black text-blue-950 font-display mt-1">{stats.used}</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 shadow-2xs">
          <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">Expirados</p>
          <p className="text-2xl font-black text-slate-700 font-display mt-1">{stats.expired}</p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <GCard p="p-4 sm:p-5">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search bar */}
          <div className="relative flex-1">
            <Ico n="search" c="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por visitante, anfitrión, unidad (ej. A-101) o código..."
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 border border-slate-200/80 focus:bg-white focus:border-teal-600 focus:outline-none transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <Ico n="x" c="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Pills */}
            <div className="flex rounded-xl bg-slate-100 p-0.5 border border-slate-200/80 text-xs">
              {(['all', 'Activo', 'Utilizado', 'Expirado'] as const).map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                    statusFilter === st
                      ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {st === 'all' ? 'Todos' : st}
                </button>
              ))}
            </div>

            {/* Type Dropdown */}
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="px-3 py-2 text-xs font-medium rounded-xl bg-slate-50 border border-slate-200/80 text-slate-700 focus:bg-white focus:border-teal-600 focus:outline-none cursor-pointer"
            >
              <option value="all">Todos los Tipos</option>
              <option value="Visita">Visita General</option>
              <option value="Familiar">Familiar</option>
              <option value="Repartidor">Repartidor</option>
              <option value="Técnico">Técnico</option>
              <option value="Proveedor">Proveedor</option>
            </select>

            {/* Date filter */}
            <select
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value as any)}
              className="px-3 py-2 text-xs font-medium rounded-xl bg-slate-50 border border-slate-200/80 text-slate-700 focus:bg-white focus:border-teal-600 focus:outline-none cursor-pointer"
            >
              <option value="all">Cualquier Fecha</option>
              <option value="today">Vigentes Hoy</option>
              <option value="upcoming">Próximos / Vigentes</option>
            </select>
          </div>
        </div>
      </GCard>

      {/* Passes Grid */}
      {filteredPasses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPasses.map(pass => {
            const isToday = pass.validDate === todayStr
            return (
              <GCard
                key={pass.id}
                p="p-5"
                className="hover:shadow-md transition-all flex flex-col justify-between border-slate-200/80 relative group"
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <Badge text={pass.status} />
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/60">
                      {getTypeIcon(pass.visitType)}
                      <span>{pass.visitType}</span>
                    </span>
                  </div>

                  {/* Main Info */}
                  <div className="flex items-start gap-3.5 mb-3.5">
                    {/* QR Thumbnail */}
                    <button
                      type="button"
                      onClick={() => setSelectedPass(pass)}
                      className="shrink-0 p-1.5 rounded-xl bg-white border border-teal-900/10 shadow-2xs hover:border-teal-600 hover:scale-105 transition-all cursor-pointer group/qr"
                      title="Haz clic para ver pase completo"
                    >
                      <QRVisual seed={pass.code} size={3.8} />
                      <span className="block text-[9px] font-bold text-teal-700 text-center mt-0.5 group-hover/qr:underline">
                        Ver QR
                      </span>
                    </button>

                    {/* Visitor & Host Info */}
                    <div className="min-w-0 flex-1">
                      <h4 className="font-display font-bold text-slate-900 text-base leading-tight truncate">
                        {pass.visitor}
                      </h4>
                      <p className="text-xs text-slate-600 mt-1 flex items-center gap-1.5 truncate">
                        <Ico n="building" c="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Unidad <strong>{pass.unit}</strong></span>
                        <span className="text-slate-300">·</span>
                        <span className="text-slate-500 truncate">{pass.host}</span>
                      </p>

                      <div className="mt-2 flex items-center gap-1.5">
                        <code className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200/70">
                          {pass.code}
                        </code>
                        <button
                          type="button"
                          onClick={() => handleCopy(pass.code)}
                          title="Copiar código"
                          className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          <Ico n="copy" c="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Validity Info */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100/90 text-xs text-slate-600 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Ico n="calendar" c="w-3.5 h-3.5 text-slate-400" />
                      <span>{pass.validDate}</span>
                      <span className="text-slate-300">·</span>
                      <Ico n="clock" c="w-3.5 h-3.5 text-slate-400" />
                      <span>{pass.validTime} hrs</span>
                    </div>

                    {isToday && pass.status === 'Activo' && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        Hoy
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2 mt-4 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleShare(pass)}
                    disabled={sharingPassId === pass.id}
                    className="w-full py-2 px-3 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    {sharingPassId === pass.id ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Generando Imagen...</span>
                      </>
                    ) : (
                      <>
                        <Ico n="whatsapp" c="w-3.5 h-3.5 shrink-0" />
                        <span>Enviar por WhatsApp</span>
                      </>
                    )}
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleDownload(pass)}
                      disabled={downloadingPassId === pass.id}
                      className="py-1.5 px-2 text-xs font-semibold rounded-xl bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                    >
                      <Ico n="dl" c="w-3.5 h-3.5 text-teal-700" />
                      <span>{downloadingPassId === pass.id ? 'Descargando...' : 'Descargar'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedPass(pass)}
                      className="py-1.5 px-2 text-xs font-semibold rounded-xl bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                    >
                      <Ico n="eye" c="w-3.5 h-3.5 text-slate-500" />
                      <span>Ver Ficha</span>
                    </button>
                  </div>
                </div>
              </GCard>
            )
          })}
        </div>
      ) : (
        /* Empty State */
        <GCard className="text-center py-14">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 mx-auto mb-3.5">
            <Ico n="qr" c="w-7 h-7" />
          </div>
          <h4 className="font-display font-bold text-slate-800 text-lg">No se encontraron pases</h4>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1 mb-5">
            {search || statusFilter !== 'all' || typeFilter !== 'all' || dateFilter !== 'all'
              ? 'No hay pases que coincidan con los filtros seleccionados. Intenta restablecer los filtros de búsqueda.'
              : 'Aún no se han generado pases de acceso digital en el sistema.'}
          </p>

          <div className="flex items-center justify-center gap-3">
            {(search || statusFilter !== 'all' || typeFilter !== 'all' || dateFilter !== 'all') ? (
              <button
                type="button"
                onClick={() => {
                  setSearch('')
                  setStatusFilter('all')
                  setTypeFilter('all')
                  setDateFilter('all')
                }}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
              >
                Limpiar Filtros
              </button>
            ) : null}

            {onNavigateToGenerate && (
              <Btn onClick={onNavigateToGenerate} className="text-xs py-2 shadow-sm">
                <Ico n="plus" c="w-3.5 h-3.5" />
                Crear Primer Pase QR
              </Btn>
            )}
          </div>
        </GCard>
      )}

      {/* Modal: Vista Previa Detallada del Pase Tipo Boarding Pass */}
      {selectedPass && (
        <Modal
          isOpen={!!selectedPass}
          title={`Pase Digital — ${selectedPass.visitor}`}
          onClose={() => setSelectedPass(null)}
        >
          <div className="space-y-4">
            {/* Boarding Pass Box */}
            <div className="rounded-2xl overflow-hidden border border-teal-900/20 shadow-md">
              <div
                className="p-4 text-white relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #003333 0%, #004c4c 60%, #008080 100%)',
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-teal-300 uppercase tracking-widest font-mono font-bold">
                      PASE DE ACCESO RESIDENCIAL
                    </p>
                    <h4 className="text-lg font-display font-extrabold mt-0.5">Las Palomas Residencial</h4>
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md border border-white/20 font-bold">
                    {selectedPass.visitType}
                  </span>
                </div>
              </div>

              <div className="p-6 bg-white flex flex-col items-center justify-center text-center">
                <div className="p-3 bg-white border-2 border-dashed border-teal-800/25 rounded-2xl shadow-sm mb-3">
                  <QRVisual seed={selectedPass.code} size={5.5} />
                </div>

                <p className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-widest">
                  Código de Caseta
                </p>
                <p className="text-2xl font-mono font-black text-slate-900 tracking-wider my-0.5">
                  {selectedPass.code}
                </p>

                <div className="w-full grid grid-cols-2 gap-2.5 mt-3 pt-3 border-t border-slate-100 text-left">
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Visitante</p>
                    <p className="text-xs font-bold text-slate-900 truncate mt-0.5">{selectedPass.visitor}</p>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Unidad / Anfitrión</p>
                    <p className="text-xs font-bold text-slate-900 truncate mt-0.5">
                      {selectedPass.unit} · {selectedPass.host}
                    </p>
                  </div>
                </div>

                <div className="w-full p-2.5 rounded-xl bg-teal-50/70 border border-teal-100 mt-2 text-center">
                  <p className="text-xs text-teal-900 font-semibold inline-flex items-center justify-center gap-1.5 w-full">
                    <Ico n="calendar" c="w-3.5 h-3.5 text-teal-700 shrink-0" />
                    <span>Vigencia: <strong>{selectedPass.validDate}</strong> a las <strong>{selectedPass.validTime} hrs</strong></span>
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="space-y-2 pt-2">
              <Btn
                variant="whatsapp"
                onClick={() => handleShare(selectedPass)}
                disabled={sharingPassId === selectedPass.id}
                className="w-full font-bold justify-center py-2.5 shadow-sm flex items-center gap-2"
              >
                {sharingPassId === selectedPass.id ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Generando Imagen...</span>
                  </>
                ) : (
                  <>
                    <Ico n="whatsapp" c="w-4 h-4 shrink-0" />
                    <span>Compartir Imagen por WhatsApp</span>
                  </>
                )}
              </Btn>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleDownload(selectedPass)}
                  disabled={downloadingPassId === selectedPass.id}
                  className="w-full py-2 px-3 text-xs font-bold rounded-xl border border-teal-950/[0.15] text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Ico n="dl" c="w-3.5 h-3.5 text-teal-700" />
                  <span>{downloadingPassId === selectedPass.id ? 'Descargando...' : 'Descargar Imagen'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCopy(selectedPass.code)}
                  className="w-full py-2 px-3 text-xs font-bold rounded-xl border border-teal-950/[0.15] text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Ico n="copy" c="w-3.5 h-3.5 text-slate-500" />
                  <span>Copiar Clave</span>
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default AccessPassesList
