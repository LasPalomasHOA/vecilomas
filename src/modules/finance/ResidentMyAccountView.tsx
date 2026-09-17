import { useState } from 'react'
import type { TicketPriority } from '@/types/finance'
import { BRAND_COLORS } from '@/types'
import { useData } from '@/context/DataContext'
import ModHero from '@/components/common/ModHero'
import SubTabs from '@/components/common/SubTabs'
import GCard, { GLASS_STYLES } from '@/components/common/Card'
import Badge from '@/components/common/Badge'
import Btn from '@/components/common/Button'
import Modal from '@/components/common/Modal'
import Ico from '@/components/common/Icons'

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
  const { fees, tickets, addTicket } = useData()
  const [tab, setTab] = useState<ResidentAccountTab>(defaultTab)
  const [modalTicketOpen, setModalTicketOpen] = useState(false)
  const [ticketToast, setTicketToast] = useState<string | null>(null)
  const [copiedClabe, setCopiedClabe] = useState(false)

  const [form, setForm] = useState({
    location: '',
    issue: '',
    priority: 'Media' as TicketPriority,
  })

  const myFee = fees.find(f => f.unit === unit)
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
    setTicketToast('¡Tu reporte de falla fue enviado a la administración con éxito!')
    setTimeout(() => setTicketToast(null), 4000)
    setForm({ location: '', issue: '', priority: 'Media' })
  }

  function handleCopyClabe() {
    navigator.clipboard.writeText('012 180 00123456789 0')
    setCopiedClabe(true)
    setTimeout(() => setCopiedClabe(false), 3000)
  }

  return (
    <div>
      <ModHero
        icon={<Ico n="dollar" c="w-6 h-6" />}
        title="Mi Cuenta y Soporte Residencial"
        desc="Consulta el estado de cuenta de tu condominio, verifica tu historial de cuotas de mantenimiento y reporta incidencias de áreas comunes."
      />

      {ticketToast && (
        <div className="mb-4 p-4 rounded-2xl bg-[#e6f2f0] border border-[#7eb0a6] text-[#003333] text-xs sm:text-sm font-bold flex items-center gap-3 animate-fade-in shadow-md">
          <Ico n="check" c="w-5 h-5 text-[#008080]" />
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
              className="rounded-3xl p-6 sm:p-7 text-white shadow-[0_20px_45px_rgba(0,51,51,0.35)] relative overflow-hidden flex flex-col justify-between min-h-[230px] border border-teal-500/30"
              style={{
                background:
                  'linear-gradient(135deg, #002b2b 0%, #004c4c 50%, #008080 100%)',
              }}
            >
              {/* Card glossy light glare & holographic mesh */}
              <div
                className="absolute -right-12 -top-12 w-56 h-56 rounded-full pointer-events-none opacity-30"
                style={{ background: 'radial-gradient(circle, rgba(45, 212, 191, 0.6) 0%, transparent 70%)' }}
              />
              <div
                className="absolute -left-12 -bottom-12 w-48 h-48 rounded-full pointer-events-none opacity-20"
                style={{ background: 'radial-gradient(circle, rgba(245, 158, 11, 0.5) 0%, transparent 70%)' }}
              />

              <div className="flex items-center justify-between relative z-10">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-300 animate-pulse" />
                    <p className="text-[10px] font-mono tracking-widest text-teal-300 font-bold uppercase">
                      ✦ LAS PALOMAS RESORT
                    </p>
                  </div>
                  <p className="text-xs font-semibold text-teal-100/90 mt-0.5">Credencial Digital de Residente</p>
                </div>
                {/* Gold Card Chip */}
                <div className="w-10 h-7 rounded-lg bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 border border-amber-300/80 shadow-xs flex items-center justify-center">
                  <div className="w-6 h-4 border border-amber-800/30 rounded-xs flex items-center justify-center">
                    <div className="w-4 h-2 border-t border-b border-amber-800/30" />
                  </div>
                </div>
              </div>

              <div className="my-3 relative z-10">
                <p className="text-[10px] font-mono text-teal-200 uppercase tracking-widest font-semibold">
                  Unidad Condominal
                </p>
                <p className="text-3xl sm:text-4xl font-display font-black text-white tracking-wider drop-shadow-xs">
                  {unit}
                </p>
              </div>

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
                            ? 'bg-gradient-to-br from-emerald-500/20 to-emerald-700/10 border-emerald-500/25 text-emerald-800 shadow-[0_2px_8px_rgba(16,185,129,0.15)]'
                            : 'bg-gradient-to-br from-red-500/20 to-rose-700/10 border-red-500/25 text-red-800 shadow-[0_2px_8px_rgba(239,68,68,0.15)]'
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
                  {copiedClabe && (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 animate-fade-in whitespace-nowrap self-start sm:self-auto shrink-0 shadow-2xs">
                      ✓ ¡CLABE copiada!
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50/90 p-4 rounded-2xl border border-slate-200/80">
                  <div>
                    <p className="text-slate-500 text-[11px] font-medium whitespace-nowrap">Banco Destino:</p>
                    <p className="font-bold text-slate-900 text-sm mt-0.5 whitespace-nowrap">BBVA México</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-[11px] font-medium whitespace-nowrap">Beneficiario:</p>
                    <p className="font-bold text-slate-900 text-sm mt-0.5 truncate">Condominios Las Palomas A.C.</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-[11px] font-medium whitespace-nowrap">CLABE Interbancaria:</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono font-bold text-slate-900 text-xs sm:text-sm whitespace-nowrap">012 180 00123456789 0</span>
                      <button
                        onClick={handleCopyClabe}
                        className="p-1 rounded-md text-[#008080] hover:bg-teal-50 cursor-pointer shrink-0 border border-teal-200/60"
                        title="Copiar CLABE"
                      >
                        <Ico n="tag" c="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <p className="text-slate-500 text-[11px] font-medium whitespace-nowrap">Concepto Obligatorio:</p>
                    <p className="font-mono font-bold text-[#008080] text-sm mt-0.5 whitespace-nowrap">CUOTA-{unit}</p>
                  </div>
                </div>
              </GCard>
            </div>
          </div>
        </div>
      )}

      {tab === 'tickets' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-white border border-slate-100 shadow-xs">
            <div className="min-w-0">
              <h3 className="font-display font-bold text-slate-900 text-base truncate">
                Reportes de Falla y Mantenimiento
              </h3>
              <p className="text-xs text-slate-400 truncate">
                Informa sobre problemas en elevadores, fugas o áreas comunes.
              </p>
            </div>
            <Btn onClick={() => setModalTicketOpen(true)}>
              <Ico n="plus" c="w-4 h-4" />
              Reportar Falla
            </Btn>
          </div>

          <div className="space-y-2.5">
            {myTickets.map(t => (
              <GCard key={t.id} className="shadow-xs border border-slate-100 bg-white">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                        t.status === 'Resuelto'
                          ? 'bg-[#e6f2f0] text-[#004c4c]'
                          : t.priority === 'Alta'
                          ? 'bg-red-50 text-red-500'
                          : 'bg-amber-50 text-amber-500'
                      }`}
                    >
                      <Ico n="tool" c="w-5 h-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-mono text-xs font-black text-slate-500 whitespace-nowrap">{t.id}</span>
                        <Badge text={t.priority} />
                        <Badge text={t.status} />
                      </div>
                      <p className="font-bold text-slate-900 text-sm sm:text-base mb-0.5">{t.issue}</p>
                      <p className="text-xs text-slate-500 font-mono truncate">
                        📍 {t.location} · {t.date}
                        {t.assignedTo ? ` · Técnico: ${t.assignedTo}` : ''}
                      </p>
                    </div>
                  </div>
                </div>
              </GCard>
            ))}

            {myTickets.length === 0 && (
              <GCard className="text-center py-16 shadow-md border border-[#7eb0a6]/30 bg-white">
                <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-3 bg-[#e6f2f0] text-[#004c4c] shadow-inner">
                  <Ico n="tool" c="w-8 h-8" />
                </div>
                <p className="font-display font-bold text-[#003333] text-lg">Sin reportes de falla activos</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Si encuentras algún desperfecto en tu edificio o áreas comunes, abre un reporte para que el personal técnico lo atienda.
                </p>
                <button
                  onClick={() => setModalTicketOpen(true)}
                  className="mt-4 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#004c4c] text-white hover:bg-[#008080] transition-colors cursor-pointer"
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
            subtitle="Describe la falla para que el equipo de mantenimiento atienda tu reporte."
          >
            <form onSubmit={handleSubmitTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider mb-1 text-[#004c4c] font-bold">
                  Ubicación de la Incidencia
                </label>
                <input
                  required
                  value={form.location}
                  onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  placeholder="Ej. Pasillo Nivel 2, Elevador Torre A, Gimnasio..."
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl"
                  style={GLASS_STYLES.input}
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider mb-1 text-[#004c4c] font-bold">
                  Nivel de Urgencia
                </label>
                <select
                  value={form.priority}
                  onChange={e => setForm(f => ({ ...f, priority: e.target.value as TicketPriority }))}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white border border-[#7eb0a6]/50 font-medium"
                >
                  <option value="Alta">Alta (Fuga activa, falla de elevador, corte eléctrico)</option>
                  <option value="Media">Media (Lámpara fundida, cerradura dañada)</option>
                  <option value="Baja">Baja (Mantenimiento preventivo menor, pintura)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider mb-1 text-[#004c4c] font-bold">
                  Descripción Detallada
                </label>
                <textarea
                  required
                  rows={4}
                  value={form.issue}
                  onChange={e => setForm(f => ({ ...f, issue: e.target.value }))}
                  placeholder="Explica qué sucede, dónde se encuentra exactamente y cualquier observación relevante..."
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl resize-none"
                  style={GLASS_STYLES.input}
                />
              </div>

              <div className="flex gap-3 pt-3">
                <Btn type="submit" className="flex-1 font-bold">
                  Enviar Reporte a Administración
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
