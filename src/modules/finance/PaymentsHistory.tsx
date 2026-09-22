import { useState } from 'react'
import type { PaymentTransaction } from '@/types/finance'
import { useData } from '@/context/DataContext'
import GCard from '@/components/common/Card'
import Badge from '@/components/common/Badge'
import Ico from '@/components/common/Icons'
import { exportPaymentsToExcel } from '@/utils/excelExporter'

export function PaymentsHistory() {
  const { payments, selectedCondominium } = useData()
  const [search, setSearch] = useState('')
  const [methodFilter, setMethodFilter] = useState('all')
  const [copiedRef, setCopiedRef] = useState<string | null>(null)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  const totalCollected = payments.reduce((sum, p) => sum + (Number(p.amountPaid) || 0), 0)
  const speiPayments = payments.filter(p => p.paymentMethod.includes('SPEI') || p.paymentMethod.includes('Transferencia'))
  const speiTotal = speiPayments.reduce((sum, p) => sum + (Number(p.amountPaid) || 0), 0)
  const avgPayment = payments.length > 0 ? Math.round(totalCollected / payments.length) : 0

  const filtered = payments.filter(p => {
    const q = search.toLowerCase()
    const matchSearch =
      !search ||
      p.unit.toLowerCase().includes(q) ||
      p.resident.toLowerCase().includes(q) ||
      p.concept.toLowerCase().includes(q) ||
      (p.referenceNumber && p.referenceNumber.toLowerCase().includes(q)) ||
      String(p.id).includes(q)

    const matchMethod =
      methodFilter === 'all' ||
      (methodFilter === 'spei' && (p.paymentMethod.includes('SPEI') || p.paymentMethod.includes('Transferencia'))) ||
      (methodFilter === 'card' && p.paymentMethod.includes('Tarjeta')) ||
      (methodFilter === 'cash' && p.paymentMethod.includes('Efectivo'))

    return matchSearch && matchMethod
  })

  function handleCopy(text: string, id: string) {
    if (!text || text === '—') return
    navigator.clipboard.writeText(text)
    setCopiedRef(id)
    setTimeout(() => setCopiedRef(null), 2500)
  }

  function handleExportExcel() {
    try {
      const fileName = exportPaymentsToExcel(
        filtered,
        selectedCondominium?.name || 'Condominio Residencial Las Palomas'
      )
      setToastMsg(`📊 Historial de transacciones descargado: "${fileName}"`)
      setTimeout(() => setToastMsg(null), 4000)
    } catch (err: any) {
      setToastMsg(`Error al exportar transacciones: ${err?.message || err}`)
    }
  }

  return (
    <div className="space-y-6">
      {toastMsg && (
        <div className="p-4 rounded-2xl bg-teal-50 border border-teal-100 text-teal-900 text-xs sm:text-sm font-semibold flex items-center gap-3 animate-fade-in shadow-xs">
          <Ico n="check" c="w-5 h-5 text-teal-600" />
          {toastMsg}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <GCard p="p-4 sm:p-5" className="hover:shadow-md transition-all">
          <div className="flex items-center justify-between gap-1.5 mb-2.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 truncate">
              Total Recaudado (BD)
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
              <Ico n="dollar" c="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-display font-bold text-slate-900 truncate">
            ${totalCollected.toLocaleString('es-MX', { minimumFractionDigits: 2 })} <span className="text-[10px] sm:text-xs text-slate-400 font-sans font-normal">MXN</span>
          </p>
          <p className="text-[11px] text-emerald-800 font-medium mt-1.5 truncate">
            {payments.length} transacciones registradas
          </p>
        </GCard>

        <GCard p="p-4 sm:p-5" className="hover:shadow-md transition-all">
          <div className="flex items-center justify-between gap-1.5 mb-2.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 truncate">
              Ingresos vía SPEI
            </span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
              <Ico n="creditCard" c="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-display font-bold text-slate-900 truncate">
            ${speiTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })} <span className="text-[10px] sm:text-xs text-slate-400 font-sans font-normal">MXN</span>
          </p>
          <p className="text-[11px] text-teal-800 font-medium mt-1.5 truncate">
            {speiPayments.length} transferencias bancarias
          </p>
        </GCard>

        <GCard p="p-4 sm:p-5" className="hover:shadow-md transition-all">
          <div className="flex items-center justify-between gap-1.5 mb-2.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 truncate">
              Ticket Promedio
            </span>
            <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-800 flex items-center justify-center shrink-0">
              <Ico n="badgeCheck" c="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-display font-bold text-slate-900 truncate">
            ${avgPayment.toLocaleString()} <span className="text-[10px] sm:text-xs text-slate-400 font-sans font-normal">MXN</span>
          </p>
          <p className="text-[11px] text-slate-500 font-medium mt-1.5 truncate">
            Promedio por cuota liquidada
          </p>
        </GCard>

        <GCard p="p-4 sm:p-5" className="hover:shadow-md transition-all">
          <div className="flex items-center justify-between gap-1.5 mb-2.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 truncate">
              Estado de Validaciones
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <Ico n="shield" c="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-display font-bold text-slate-900 truncate">
            100%
          </p>
          <p className="text-[11px] text-emerald-800 font-medium mt-1.5 truncate">
            Todas aprobadas en PostgreSQL
          </p>
        </GCard>
      </div>

      {/* Filter and Actions Bar */}
      <div className="rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02),0_4px_16px_rgba(0,0,0,0.02)] border border-slate-100 bg-white">
        <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
            {/* Search input */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Buscar por unidad, condómino o referencia SPEI..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200/80 focus:outline-none focus:border-teal-500 text-slate-800 placeholder:text-slate-400"
              />
              <div className="absolute left-3 top-2.5 text-slate-400">
                <Ico n="search" c="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Method filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar flex-nowrap">
              {[
                { id: 'all', label: 'Todos los Métodos' },
                { id: 'spei', label: 'SPEI / Transferencia' },
                { id: 'card', label: 'Tarjeta' },
                { id: 'cash', label: 'Efectivo' },
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => setMethodFilter(m.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    methodFilter === m.id
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleExportExcel}
            title="Exportar transacciones de pago a Excel (.xlsx)"
            className="text-xs font-bold text-emerald-900 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 transition-all flex items-center gap-2 px-3.5 py-2 rounded-xl cursor-pointer self-end sm:self-auto whitespace-nowrap shrink-0 shadow-2xs active:scale-95"
          >
            <span className="w-5 h-5 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-[9px] font-black">
              XLS
            </span>
            <span>Exportar Pagos a Excel</span>
          </button>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4 sm:px-6">ID / Folio</th>
                <th className="py-3.5 px-4 sm:px-6">Unidad</th>
                <th className="py-3.5 px-4 sm:px-6">Condómino / Pagador</th>
                <th className="py-3.5 px-4 sm:px-6">Concepto Liquidado</th>
                <th className="py-3.5 px-4 sm:px-6">Monto Pagado</th>
                <th className="py-3.5 px-4 sm:px-6">Método de Pago</th>
                <th className="py-3.5 px-4 sm:px-6">Referencia / Rastreo</th>
                <th className="py-3.5 px-4 sm:px-6">Fecha y Hora</th>
                <th className="py-3.5 px-4 sm:px-6">Estatus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400 font-medium">
                    No se encontraron transacciones de pago registradas.
                  </td>
                </tr>
              ) : (
                filtered.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6 font-mono font-bold text-slate-900">
                      #{p.id}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6">
                      <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                        {p.unit}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 font-medium text-slate-900">
                      {p.resident}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-slate-700">
                      {p.concept}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 font-bold text-emerald-950">
                      ${(Number(p.amountPaid) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                    </td>
                    <td className="py-3.5 px-4 sm:px-6">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium text-[11px]">
                        <Ico n="creditCard" c="w-3.5 h-3.5 text-teal-600" />
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 font-mono">
                      {p.referenceNumber && p.referenceNumber !== '—' ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-800 font-semibold">{p.referenceNumber}</span>
                          <button
                            onClick={() => handleCopy(p.referenceNumber, p.id)}
                            className="p-1 rounded text-slate-400 hover:text-teal-700 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Copiar referencia"
                          >
                            {copiedRef === p.id ? (
                              <Ico n="check" c="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Ico n="copy" c="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-slate-500 whitespace-nowrap">
                      {p.paidAt}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6">
                      <Badge text="Pagada" className="text-xs px-2.5 py-0.5 font-bold" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default PaymentsHistory
