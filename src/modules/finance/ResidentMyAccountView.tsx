import { useState } from 'react'
import type { TicketPriority } from '@/types/finance'
import { useData } from '@/context/DataContext'
import ModHero from '@/components/common/ModHero'
import SubTabs from '@/components/common/SubTabs'
import GCard, { GLASS_STYLES } from '@/components/common/Card'
import Badge from '@/components/common/Badge'
import Btn from '@/components/common/Button'
import Modal from '@/components/common/Modal'
import Ico from '@/components/common/Icons'
import QRVisual from '@/components/common/QRVisual'
import { exportResidentStatementToExcel } from '@/utils/excelExporter'

type ResidentAccountTab = 'statement' | 'tickets'

interface ResidentMyAccountViewProps {
  unit: string
  name: string
  defaultTab?: ResidentAccountTab
}

export function ResidentMyAccountView({
  unit,
  name,
  defaultTab = 'statement',
}: ResidentMyAccountViewProps) {
  const { fees, tickets, selectedCondominium, addTicket } = useData()
  const [tab, setTab] = useState<ResidentAccountTab>(defaultTab)
  const [modalTicketOpen, setModalTicketOpen] = useState(false)
  const [ticketToast, setTicketToast] = useState<string | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [showCardQR, setShowCardQR] = useState(false)

  const [form, setForm] = useState({
    location: '',
    issue: '',
    priority: 'Media' as TicketPriority,
  })

  const myFees = fees.filter(f => f.unit === unit || !f.unit || f.unit === 'S/N')
  const myFee = fees.find(f => f.unit === unit) || myFees[0]

  function handleExportMyStatement() {
    try {
      const fileName = exportResidentStatementToExcel(
        myFees.length > 0 ? myFees : fees.slice(0, 3),
        name,
        unit,
        selectedCondominium?.name || 'Condominio Residencial Las Palomas'
      )
      setTicketToast(`📊 Estado de cuenta descargado en Excel: "${fileName}"`)
      setTimeout(() => setTicketToast(null), 4000)
    } catch (err: any) {
      setTicketToast(`Error al exportar: ${err?.message || err}`)
    }
  }
  const myTickets = tickets.filter(
    t => t.reporter.toLowerCase().includes(name.split(' ')[0].toLowerCase()) || t.unit === unit
  )

  function handleSubmitTicket(e: React.FormEvent) {
    e.preventDefault()
    if (!form.location || !form.issue) return

    addTicket({
      location: form.location,
      reporter: `${name} (${unit})`,
      unit,
      issue: form.issue,
      priority: form.priority,
    })

    setModalTicketOpen(false)
    setTicketToast('¡Tu reporte de falla fue enviado al equipo de mantenimiento!')
    setTimeout(() => setTicketToast(null), 4000)
    setForm({ location: '', issue: '', priority: 'Media' })
  }

  function handleCopy(text: string, label: string) {
    navigator.clipboard.writeText(text)
    setCopiedField(label)
    setTimeout(() => setCopiedField(null), 2500)
  }

  function getStepIndex(status: string) {
    switch (status) {
      case 'Abierto':
        return 1
      case 'En Progreso':
        return 2
      case 'Resuelto':
        return 3
      default:
        return 1
    }
  }

  return (
    <div>
      <ModHero
        icon={<Ico n="creditCard" c="w-6 h-6 text-teal-700" />}
        title="Mi Cuenta y Soporte Residencial"
        desc="Consulta el estado de cuenta de tu condominio, verifica tu historial de cuotas de mantenimiento y reporta incidencias de áreas comunes."
      />

      {ticketToast && (
        <div className="mb-4 p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 text-xs sm:text-sm font-bold flex items-center gap-3 animate-fade-in shadow-xs">
          <Ico n="check" c="w-5 h-5 text-teal-600" />
          {ticketToast}
        </div>
      )}

      <SubTabs
        tabs={[
          { id: 'statement' as ResidentAccountTab, label: 'Mi Estado de Cuenta', shortLabel: 'Estado de Cuenta' },
          { id: 'tickets' as ResidentAccountTab, label: 'Mis Reportes de Mantenimiento', shortLabel: 'Reportes', badge: myTickets.length },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'statement' && (
        <div className="space-y-6">
          {/* Digital Membership / Account Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Visual Platinum Luxury Card */}
            <div
              className="rounded-3xl p-6 sm:p-7 text-white shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[240px] border border-teal-500/30"
              style={{
                background:
                  'linear-gradient(135deg, #002b2b 0%, #004c4c 50%, #008080 100%)',
              }}
            >
              {/* Holographic light glare */}
              <div
                className="absolute -right-12 -top-12 w-56 h-56 rounded-full pointer-events-none opacity-25"
                style={{ background: 'radial-gradient(circle, rgba(45, 212, 191, 0.6) 0%, transparent 70%)' }}
              />

              <div className="flex items-center justify-between relative z-10">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-300 animate-pulse" />
                    <p className="text-[10px] font-mono tracking-widest text-teal-300 font-bold uppercase">
                      LAS PALOMAS RESORT & RESIDENCES
                    </p>
                  </div>
                  <p className="text-xs font-semibold text-teal-100/90 mt-0.5">Credencial Digital de Residente</p>
                </div>

                {/* Switch to QR / Card Chip */}
                <button
                  type="button"
                  onClick={() => setShowCardQR(!showCardQR)}
                  className="w-10 h-7 rounded-lg bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 border border-amber-300/80 shadow-xs flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
                  title="Toca para alternar código QR"
                >
                  <div className="w-6 h-4 border border-amber-800/30 rounded-xs flex items-center justify-center">
                    <div className="w-4 h-2 border-t border-b border-amber-800/30" />
                  </div>
                </button>
              </div>

              {showCardQR ? (
                <div className="my-2 py-2 flex flex-col items-center justify-center bg-white/10 rounded-2xl border border-white/20 backdrop-blur-md relative z-10">
                  <div className="p-1.5 bg-white rounded-xl">
                    <QRVisual seed={`RESIDENT-${unit}-${name}`} size={3.5} />
                  </div>
                  <p className="text-[10px] font-mono text-teal-200 mt-1">Escaneo de Caseta / Amenidades</p>
                </div>
              ) : (
                <div className="my-3 relative z-10">
                  <p className="text-[10px] font-mono text-teal-200 uppercase tracking-widest font-semibold">
                    Unidad Condominal
                  </p>
                  <p className="text-3xl sm:text-4xl font-display font-black text-white tracking-wider drop-shadow-xs">
                    {unit}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between text-xs pt-3 border-t border-white/20 gap-2 relative z-10">
                <div className="min-w-0">
                  <p className="text-[9px] font-mono text-teal-200/80 uppercase font-semibold whitespace-nowrap">Titular</p>
                  <p className="font-bold text-white truncate max-w-[150px]">{name}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[9px] font-mono text-teal-200/80 uppercase font-semibold whitespace-nowrap">Estado Cuota</p>
                  <span
                    className={`inline-block font-extrabold text-[10px] px-2.5 py-0.5 rounded-full whitespace-nowrap shadow-xs ${
                      myFee?.status === 'Pagada'
                        ? 'bg-emerald-400 text-slate-950'
                        : 'bg-red-400 text-slate-950'
                    }`}
                  >
                    {myFee?.status || 'Pendiente'}
                  </span>
                </div>
              </div>
            </div>

            {/* Account Financial Status */}
            <div className="lg:col-span-2 space-y-4">
              {myFee && (
                <GCard>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                          myFee.status === 'Pagada'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : 'bg-red-50 border-red-200 text-red-800'
                        }`}
                      >
                        <Ico n="dollar" c="w-6 h-6" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap truncate block">
                          Cuota de Mantenimiento Mensual
                        </span>
                        <h3 className="text-xl sm:text-2xl font-display font-black text-slate-900 mt-0.5 whitespace-nowrap tracking-tight">
                          ${myFee.amount.toLocaleString()} MXN
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">
                          Concepto: <strong>{myFee.concept}</strong> · Vence: {myFee.dueDate}
                        </p>
                      </div>
                    </div>

                    <div className="sm:text-right shrink-0">
                      <Badge text={myFee.status} className="text-xs px-3 py-1 font-bold shadow-2xs" />
                      <p className="text-[11px] font-mono font-medium text-slate-500 mt-1 whitespace-nowrap">
                        {myFee.status === 'Pagada' ? `Pagado el ${myFee.date}` : 'Sin pago registrado'}
                      </p>
                    </div>
                  </div>
                </GCard>
              )}

              {/* Bank Transfer Instructions */}
              <GCard>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 pb-2 border-b border-teal-950/[0.06] gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#008080]" />
                    <h4 className="font-display font-bold text-slate-900 text-xs sm:text-sm">
                      Datos Bancarios para Pago por Transferencia SPEI
                    </h4>
                  </div>
                  {copiedField && (
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200 animate-fade-in whitespace-nowrap inline-flex items-center gap-1">
                      <Ico n="check" c="w-3.5 h-3.5 text-emerald-700" />
                      ¡{copiedField} copiado!
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50/90 p-4 rounded-2xl border border-slate-200/80">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/60">
                    <div>
                      <p className="text-slate-500 text-[10px] font-medium">Banco Receptor:</p>
                      <p className="font-bold text-slate-900 text-xs sm:text-sm mt-0.5">BBVA México</p>
                    </div>
                    <button
                      onClick={() => handleCopy('BBVA México', 'Banco')}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-teal-800 hover:bg-teal-50 transition-colors cursor-pointer"
                      title="Copiar Banco"
                    >
                      <Ico n="copy" c="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/60">
                    <div>
                      <p className="text-slate-500 text-[10px] font-medium">Beneficiario:</p>
                      <p className="font-bold text-slate-900 text-xs sm:text-sm mt-0.5 truncate max-w-[160px]">Condominios Las Palomas A.C.</p>
                    </div>
                    <button
                      onClick={() => handleCopy('Condominios Las Palomas A.C.', 'Beneficiario')}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-teal-800 hover:bg-teal-50 transition-colors cursor-pointer"
                      title="Copiar Beneficiario"
                    >
                      <Ico n="copy" c="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2.5 sm:p-3 rounded-xl bg-white border border-slate-200/60 sm:col-span-2 gap-2">
                    <div>
                      <p className="text-slate-500 text-[10px] font-medium">CLABE Interbancaria (18 dígitos):</p>
                      <p className="font-mono font-bold text-teal-950 text-xs sm:text-base mt-0.5 tracking-tight">012 180 00123456789 0</p>
                    </div>
                    <button
                      onClick={() => handleCopy('012180001234567890', 'CLABE')}
                      className="w-full sm:w-auto px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs shrink-0"
                    >
                      <Ico n="copy" c="w-3.5 h-3.5" />
                      <span>Copiar CLABE</span>
                    </button>
                  </div>
                </div>
              </GCard>
            </div>
          </div>

          {/* Statement and Payments History Card with Excel Export */}
          <div className="rounded-3xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-600" />
                  <h3 className="font-display font-bold text-slate-900 text-base sm:text-lg">
                    Historial de Cuotas y Recibos
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Consulta tus cuotas ordinarias y extraordinarias asignadas a la unidad {unit}.
                </p>
              </div>

              <button
                onClick={handleExportMyStatement}
                title="Descargar Estado de Cuenta en Excel (.xlsx)"
                className="text-xs font-bold text-emerald-950 bg-emerald-50 hover:bg-emerald-100/90 border border-emerald-200/80 transition-all flex items-center gap-2.5 px-4 py-2.5 rounded-xl cursor-pointer shadow-2xs self-start sm:self-auto active:scale-95"
              >
                <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black shadow-2xs">
                  XLS
                </span>
                <span>Descargar Estado de Cuenta (.xlsx)</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4 sm:px-6">Folio / Período</th>
                    <th className="py-3 px-4 sm:px-6">Concepto</th>
                    <th className="py-3 px-4 sm:px-6">Monto</th>
                    <th className="py-3 px-4 sm:px-6">Vencimiento</th>
                    <th className="py-3 px-4 sm:px-6">Fecha Pago</th>
                    <th className="py-3 px-4 sm:px-6">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {myFees.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                        No hay registros de cuotas para tu unidad.
                      </td>
                    </tr>
                  ) : (
                    myFees.map((fee) => (
                      <tr key={fee.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 sm:px-6 font-mono font-bold text-slate-900">
                          {fee.id}
                        </td>
                        <td className="py-3.5 px-4 sm:px-6 font-medium text-slate-900">
                          {fee.concept}
                        </td>
                        <td className="py-3.5 px-4 sm:px-6 font-bold text-slate-900">
                          ${(Number(fee.amount) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                        </td>
                        <td className="py-3.5 px-4 sm:px-6 text-slate-500">
                          {fee.dueDate}
                        </td>
                        <td className="py-3.5 px-4 sm:px-6 text-slate-500 font-mono">
                          {fee.date || '—'}
                        </td>
                        <td className="py-3.5 px-4 sm:px-6">
                          <Badge text={fee.status} className="text-xs px-2.5 py-0.5" />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'tickets' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <div className="min-w-0">
              <h3 className="font-display font-bold text-slate-900 text-base truncate">
                Reportes de Falla y Mantenimiento
              </h3>
              <p className="text-xs text-slate-500 truncate">
                Informa sobre incidencias en elevadores, plomería o áreas comunes y rastrea su progreso.
              </p>
            </div>
            <Btn onClick={() => setModalTicketOpen(true)}>
              <Ico n="plus" c="w-4 h-4" />
              Nuevo Reporte
            </Btn>
          </div>

          <div className="space-y-3">
            {myTickets.map(t => {
              const currentStep = getStepIndex(t.status)

              return (
                <GCard key={t.id} className="shadow-xs border border-slate-200/80 bg-white">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                          t.status === 'Resuelto'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : t.priority === 'Alta'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        <Ico n="tool" c="w-5 h-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-mono text-xs font-bold text-slate-600">{t.id}</span>
                          <Badge text={t.priority} />
                          <Badge text={t.status} />
                        </div>
                        <p className="font-bold text-slate-900 text-sm sm:text-base mb-1">{t.issue}</p>
                        <p className="text-xs text-slate-500 font-medium inline-flex items-center gap-1.5 flex-wrap">
                          <span className="inline-flex items-center gap-1">
                            <Ico n="mapPin" c="w-3.5 h-3.5 text-slate-400" />
                            {t.location}
                          </span>
                          <span>·</span>
                          <span className="inline-flex items-center gap-1">
                            <Ico n="calendar" c="w-3.5 h-3.5 text-slate-400" />
                            {t.date}
                          </span>
                          {t.assignedTo ? <span>· Asignado a: {t.assignedTo}</span> : ''}
                        </p>

                        {/* Interactive Timeline Progress Bar */}
                        <div className="mt-4 pt-3 border-t border-slate-100">
                          <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">Progreso de Atención</p>
                          <div className="grid grid-cols-3 gap-2">
                            <div className={`p-2 rounded-xl text-center text-xs font-bold border transition-colors ${
                              currentStep >= 1
                                ? 'bg-teal-50 border-teal-200 text-teal-900'
                                : 'bg-slate-50 border-slate-200 text-slate-400'
                            }`}>
                              <span>1. Registrado</span>
                            </div>
                            <div className={`p-2 rounded-xl text-center text-xs font-bold border transition-colors ${
                              currentStep >= 2
                                ? 'bg-indigo-50 border-indigo-200 text-indigo-900'
                                : 'bg-slate-50 border-slate-200 text-slate-400'
                            }`}>
                              <span>2. En Reparación</span>
                            </div>
                            <div className={`p-2 rounded-xl text-center text-xs font-bold border transition-colors ${
                              currentStep >= 3
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                                : 'bg-slate-50 border-slate-200 text-slate-400'
                            }`}>
                              <span>3. Resuelto</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </GCard>
              )
            })}

            {myTickets.length === 0 && (
              <GCard className="text-center py-14 shadow-xs border border-slate-200 bg-white">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 bg-teal-50 text-teal-800 border border-teal-100">
                  <Ico n="tool" c="w-7 h-7 text-teal-700" />
                </div>
                <p className="font-display font-bold text-slate-900 text-base">Sin reportes de falla activos</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Si encuentras algún desperfecto en áreas comunes o en tu torre, genera un reporte para atención inmediata.
                </p>
                <button
                  onClick={() => setModalTicketOpen(true)}
                  className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-teal-800 text-white hover:bg-teal-700 transition-colors cursor-pointer"
                >
                  Abrir Reporte de Falla
                </button>
              </GCard>
            )}
          </div>

          {/* Modal New Ticket */}
          <Modal
            isOpen={modalTicketOpen}
            onClose={() => setModalTicketOpen(false)}
            title="Reportar Falla en Áreas Comunes"
            subtitle="Describe la incidencia para que el equipo de guardia la atienda."
          >
            <form onSubmit={handleSubmitTicket} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider mb-1 text-slate-700 font-bold">
                  Ubicación de la Incidencia
                </label>
                <input
                  required
                  value={form.location}
                  onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  placeholder="Ej. Elevador Torre Coronado, Pasillo Nivel 3, Cancha..."
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider mb-1 text-slate-700 font-bold">
                  Nivel de Urgencia
                </label>
                <select
                  value={form.priority}
                  onChange={e => setForm(f => ({ ...f, priority: e.target.value as TicketPriority }))}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white border border-slate-200 font-medium"
                >
                  <option value="Alta">Alta (Fuga de agua, elevador bloqueado, corte eléctrico)</option>
                  <option value="Media">Media (Lámpara fundida, cerrajería)</option>
                  <option value="Baja">Baja (Pintura, mantenimiento preventivo menor)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider mb-1 text-slate-700 font-bold">
                  Descripción del Problema
                </label>
                <textarea
                  required
                  rows={4}
                  value={form.issue}
                  onChange={e => setForm(f => ({ ...f, issue: e.target.value }))}
                  placeholder="Explica qué sucede y cualquier detalle relevante para el personal técnico..."
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl resize-none border border-slate-200 bg-white focus:outline-none focus:border-teal-600"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <Btn type="submit" className="flex-1 font-bold">
                  Enviar Reporte
                </Btn>
                <Btn variant="ghost" onClick={() => setModalTicketOpen(false)}>
                  Cancelar
                </Btn>
              </div>
            </form>
          </Modal>
        </div>
      )}
    </div>
  )
}

export default ResidentMyAccountView
