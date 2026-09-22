import { useState } from 'react'
import type { FeeStatement, FeeStatus } from '@/types/finance'
import { useData } from '@/context/DataContext'
import GCard from '@/components/common/Card'
import Badge from '@/components/common/Badge'
import Btn from '@/components/common/Button'
import Modal from '@/components/common/Modal'
import Ico from '@/components/common/Icons'
import { exportFullFinanceReportToExcel } from '@/utils/excelExporter'

export function FeeControl() {
  const { fees, tickets, selectedCondominium, registerFeePayment } = useData()
  const [filterStatus, setFilterStatus] = useState<'all' | FeeStatus>('all')
  const [modalPayment, setModalPayment] = useState<FeeStatement | null>(null)
  const [payMethod, setPayMethod] = useState('Transferencia SPEI')
  const [refNumber, setRefNumber] = useState('')
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  const collected = fees
    .filter(f => f.status === 'Pagada')
    .reduce((s, f) => s + (Number(f.amount) || 0), 0)
  const pending = fees
    .filter(f => f.status === 'Pendiente')
    .reduce((s, f) => s + (Number(f.amount) || 0), 0)
  const overdueTotal = fees
    .filter(f => f.status === 'Vencida')
    .reduce((s, f) => s + (Number(f.amount) || 0), 0)
  const totalBilled = collected + pending + overdueTotal
  const collectionRate = totalBilled > 0 ? Math.round((collected / totalBilled) * 100) : 0

  function handleConfirmPayment(e: React.FormEvent) {
    e.preventDefault()
    if (!modalPayment) return

    const amountNum = Number(modalPayment.amount) || 0
    registerFeePayment(modalPayment.id, payMethod, refNumber)
    setToastMsg(`Pago registrado con éxito para la unidad ${modalPayment.unit} por $${amountNum.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN.`)
    setModalPayment(null)
    setRefNumber('')
    setTimeout(() => setToastMsg(null), 4000)
  }

  function handleExportReport() {
    try {
      const fileName = exportFullFinanceReportToExcel({
        fees: filtered,
        tickets: tickets,
        condominiumName: selectedCondominium?.name || 'Condominio Residencial Las Palomas',
      })
      setToastMsg(`📊 Reporte descargado exitosamente: "${fileName}"`)
      setTimeout(() => setToastMsg(null), 4500)
    } catch (err: any) {
      setToastMsg(`Error al generar el archivo Excel: ${err?.message || err}`)
    }
  }

  const filtered = fees.filter(f => (filterStatus === 'all' ? true : f.status === filterStatus))

  return (
    <div className="space-y-6">
      {toastMsg && (
        <div className="p-4 rounded-2xl bg-teal-50 border border-teal-100 text-teal-900 text-xs sm:text-sm font-semibold flex items-center gap-3 animate-fade-in shadow-xs">
          <Ico n="check" c="w-5 h-5 text-teal-600" />
          {toastMsg}
        </div>
      )}

      {/* KPI Cards in Clean Fintech Style */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <GCard p="p-4 sm:p-5" className="hover:shadow-md transition-all">
          <div className="flex items-center justify-between gap-1.5 mb-2.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 truncate">
              Total Recaudado
            </span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
              <Ico n="dollar" c="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-display font-bold text-slate-900 truncate">
            ${collected.toLocaleString()} <span className="text-[10px] sm:text-xs text-slate-400 font-sans font-normal">MXN</span>
          </p>
          <div className="mt-2.5 sm:mt-3 flex items-center gap-2">
            <div className="flex-1 h-1.5 sm:h-2 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full bg-teal-600 rounded-full" style={{ width: `${collectionRate}%` }} />
            </div>
            <span className="text-[11px] font-medium text-teal-700">{collectionRate}%</span>
          </div>
        </GCard>

        <GCard p="p-4 sm:p-5" className="hover:shadow-md transition-all">
          <div className="flex items-center justify-between gap-1.5 mb-2.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 truncate">
              Por Cobrar
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
              <Ico n="clock" c="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-display font-bold text-amber-700 truncate">
            ${pending.toLocaleString()} <span className="text-[10px] sm:text-xs text-slate-400 font-sans font-normal">MXN</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1.5 truncate">
            {fees.filter(f => f.status === 'Pendiente').length} unidades con fecha límite
          </p>
        </GCard>

        <GCard p="p-4 sm:p-5" className="hover:shadow-md transition-all">
          <div className="flex items-center justify-between gap-1.5 mb-2.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 truncate">
              Morosidad
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <Ico n="tool" c="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-display font-bold text-rose-600 truncate">
            ${overdueTotal.toLocaleString()} <span className="text-[10px] sm:text-xs text-slate-400 font-sans font-normal">MXN</span>
          </p>
          <p className="text-[11px] text-rose-600 mt-1.5 font-medium truncate">
            {fees.filter(f => f.status === 'Vencida').length} propiedades en mora
          </p>
        </GCard>

        <GCard p="p-4 sm:p-5" className="hover:shadow-md transition-all">
          <div className="flex items-center justify-between gap-1.5 mb-2.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 truncate">
              Presupuesto
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <Ico n="building" c="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-display font-bold text-slate-900 truncate">
            ${totalBilled.toLocaleString()} <span className="text-[10px] sm:text-xs text-slate-400 font-sans font-normal">MXN</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1.5 truncate">
            8 propiedades evaluadas
          </p>
        </GCard>
      </div>

      {/* Filter and Table Container */}
      <div className="rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02),0_4px_16px_rgba(0,0,0,0.02)] border border-slate-100 bg-white">
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100">
          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar flex-nowrap">
            {(['all', 'Pagada', 'Pendiente', 'Vencida'] as const).map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  filterStatus === s
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                }`}
              >
                {s === 'all' ? 'Todos los Estados' : s}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportReport}
            title="Exportar archivo Excel (.xlsx)"
            className="text-xs font-bold text-emerald-900 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 transition-all flex items-center gap-2 px-3.5 py-2 rounded-xl cursor-pointer self-end sm:self-auto whitespace-nowrap shrink-0 shadow-2xs active:scale-95"
          >
            <span className="w-5 h-5 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-[9px] font-black">
              XLS
            </span>
            <span>Exportar a Excel (.xlsx)</span>
          </button>
        </div>

        <div className="overflow-x-auto hide-scrollbar">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                {['Unidad', 'Condómino', 'Concepto', 'Monto', 'Fecha de Pago', 'Método', 'Estado', 'Acciones'].map(h => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(f => (
                <tr
                  key={f.id}
                  className={`hover:bg-slate-50/70 transition-colors ${
                    f.status === 'Vencida' ? 'bg-rose-50/20' : ''
                  }`}
                >
                  <td className="px-5 py-4 font-display font-bold text-slate-900 text-sm whitespace-nowrap">
                    {f.unit}
                  </td>
                  <td className="px-5 py-4 font-semibold text-slate-800 whitespace-nowrap">{f.resident}</td>
                  <td className="px-5 py-4 text-xs text-slate-500 whitespace-nowrap">{f.concept}</td>
                  <td className="px-5 py-4 font-display font-bold text-slate-900 text-sm whitespace-nowrap">
                    ${f.amount.toLocaleString()} MXN
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-500 font-medium whitespace-nowrap">{f.date}</td>
                  <td className="px-5 py-4 text-xs text-slate-500 whitespace-nowrap">
                    {f.paymentMethod || '—'}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <Badge text={f.status} />
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    {f.status !== 'Pagada' ? (
                      <button
                        onClick={() => setModalPayment(f)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-teal-200 text-teal-700 bg-teal-50/60 hover:bg-teal-50 hover:border-teal-300 transition-all cursor-pointer whitespace-nowrap shadow-2xs"
                      >
                        Registrar Pago
                      </button>
                    ) : (
                      <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100 whitespace-nowrap inline-flex items-center gap-1">
                        <Ico n="check" c="w-3.5 h-3.5 text-teal-700" />
                        Conciliado
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400 text-sm">
                    No hay registros con el filtro seleccionado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Register Payment */}
      <Modal
        isOpen={!!modalPayment}
        onClose={() => setModalPayment(null)}
        title="Registrar Pago de Cuota de Mantenimiento"
        subtitle={modalPayment ? `Unidad ${modalPayment.unit} · ${modalPayment.resident}` : ''}
      >
        {modalPayment && (
          <form onSubmit={handleConfirmPayment} className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Concepto:</span>
                <span className="font-semibold text-slate-800">{modalPayment.concept}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Monto a liquidar:</span>
                <span className="font-display font-bold text-teal-700 text-base">
                  ${modalPayment.amount.toLocaleString()} MXN
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-600">
                Método de Pago
              </label>
              <select
                value={payMethod}
                onChange={e => setPayMethod(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50/80 border border-slate-200/80 focus:bg-white focus:border-teal-500 focus:outline-none transition-all font-medium text-slate-700"
              >
                <option value="Transferencia SPEI">Transferencia Bancaria SPEI</option>
                <option value="Tarjeta de Débito / Crédito">Tarjeta de Débito / Crédito</option>
                <option value="Efectivo en Administración">Efectivo en Oficina de Administración</option>
                <option value="Cheque">Cheque de Caja</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-600">
                Referencia / Número de Rastreo
              </label>
              <input
                value={refNumber}
                onChange={e => setRefNumber(e.target.value)}
                placeholder="Ej. SPEI-8849204829"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50/80 border border-slate-200/80 focus:bg-white focus:border-teal-500 focus:outline-none transition-all font-mono"
              />
            </div>

            <div className="flex gap-3 pt-3">
              <Btn type="submit" className="flex-1 font-semibold">
                Confirmar y Liquidar Cuota
              </Btn>
              <Btn variant="ghost" onClick={() => setModalPayment(null)}>
                Cancelar
              </Btn>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
export default FeeControl
