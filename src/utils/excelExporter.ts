import * as XLSX from 'xlsx'
import type { FeeStatement, MaintenanceTicket, PaymentTransaction } from '@/types/finance'

export interface FinanceExportData {
  fees: FeeStatement[]
  payments?: PaymentTransaction[]
  tickets?: MaintenanceTicket[]
  condominiumName?: string
}

/**
 * Exporta el reporte de Transacciones y Pagos Reales a Excel (.xlsx)
 */
export function exportPaymentsToExcel(payments: PaymentTransaction[], condominiumName = 'Condominio Residencial Las Palomas') {
  const wb = XLSX.utils.book_new()
  const today = new Date().toLocaleDateString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  // Hoja 1: Transacciones y Pagos
  const paymentsRows = payments.map((p, idx) => ({
    'No.': idx + 1,
    'ID Pago': p.id,
    'Unidad': p.unit || 'S/N',
    'Condómino / Pagador': p.resident || 'Propietario',
    'Concepto Liquidado': p.concept,
    'Monto Pagado ($ MXN)': Number(p.amountPaid) || 0,
    'Método de Pago': p.paymentMethod,
    'Referencia / Folio Bancario': p.referenceNumber || '—',
    'Fecha y Hora': p.paidAt || '—',
    'Estatus': (p.status || 'Aprobado').toUpperCase(),
    'Validado Por': p.verifiedBy || 'Sistema',
  }))

  const wsPayments = XLSX.utils.json_to_sheet(paymentsRows)
  wsPayments['!cols'] = [
    { wch: 6 },
    { wch: 12 },
    { wch: 12 },
    { wch: 28 },
    { wch: 38 },
    { wch: 22 },
    { wch: 24 },
    { wch: 28 },
    { wch: 22 },
    { wch: 14 },
    { wch: 24 },
  ]
  XLSX.utils.book_append_sheet(wb, wsPayments, 'Transacciones de Pago')

  // Hoja 2: Resumen
  const totalAmount = payments.reduce((s, p) => s + (Number(p.amountPaid) || 0), 0)
  const speiCount = payments.filter(p => p.paymentMethod.includes('SPEI') || p.paymentMethod.includes('Transferencia')).length
  const cardCount = payments.filter(p => p.paymentMethod.includes('Tarjeta')).length
  const cashCount = payments.filter(p => p.paymentMethod.includes('Efectivo')).length

  const summaryRows = [
    { 'RESUMEN DE COBRANZA': 'Condominio', 'DETALLE': condominiumName },
    { 'RESUMEN DE COBRANZA': 'Fecha de Emisión del Reporte', 'DETALLE': today },
    { 'RESUMEN DE COBRANZA': 'Total de Pagos Registrados', 'DETALLE': payments.length },
    { 'RESUMEN DE COBRANZA': 'Monto Total Ingresado', 'DETALLE': `$${totalAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN` },
    { 'RESUMEN DE COBRANZA': 'Pagos vía SPEI / Transferencia', 'DETALLE': speiCount },
    { 'RESUMEN DE COBRANZA': 'Pagos vía Tarjeta Débito/Crédito', 'DETALLE': cardCount },
    { 'RESUMEN DE COBRANZA': 'Pagos en Efectivo / Oficina', 'DETALLE': cashCount },
  ]
  const wsSummary = XLSX.utils.json_to_sheet(summaryRows)
  wsSummary['!cols'] = [{ wch: 32 }, { wch: 40 }]
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen de Ingresos')

  const dateStr = new Date().toISOString().slice(0, 10)
  const fileName = `Reporte_Pagos_Reales_${dateStr}.xlsx`
  XLSX.writeFile(wb, fileName)
  return fileName
}

/**
 * Exporta el reporte de Cuotas y Estados de Cuenta a formato Excel (.xlsx)
 */
export function exportFeesToExcel(fees: FeeStatement[], condominiumName = 'Condominio Residencial Las Palomas') {
  const wb = XLSX.utils.book_new()
  const today = new Date().toLocaleDateString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  // ── Hoja 1: Detalle de Cuotas y Cobranza ──────────────────────────────────
  const feesRows = fees.map((f, idx) => ({
    'No.': idx + 1,
    'Unidad / Depto': f.unit || 'S/N',
    'Condómino / Titular': f.resident || 'Propietario',
    'Concepto de Pago': f.concept,
    'Monto ($ MXN)': Number(f.amount) || 0,
    'Estado': f.status,
    'Fecha de Vencimiento': f.dueDate || '—',
    'Fecha de Pago': f.date || '—',
    'Método de Pago': f.paymentMethod || 'Pendiente de pago',
  }))

  const wsFees = XLSX.utils.json_to_sheet(feesRows)

  // Ajustar anchos de columnas
  wsFees['!cols'] = [
    { wch: 6 },   // No.
    { wch: 16 },  // Unidad
    { wch: 28 },  // Condómino
    { wch: 38 },  // Concepto
    { wch: 16 },  // Monto
    { wch: 14 },  // Estado
    { wch: 22 },  // Fecha Vencimiento
    { wch: 18 },  // Fecha Pago
    { wch: 24 },  // Método
  ]

  XLSX.utils.book_append_sheet(wb, wsFees, 'Control de Cuotas')

  // ── Hoja 2: Resumen Ejecutivo Financiero ──────────────────────────────────
  const collected = fees.filter(f => f.status === 'Pagada').reduce((s, f) => s + (Number(f.amount) || 0), 0)
  const pending = fees.filter(f => f.status === 'Pendiente').reduce((s, f) => s + (Number(f.amount) || 0), 0)
  const overdue = fees.filter(f => f.status === 'Vencida').reduce((s, f) => s + (Number(f.amount) || 0), 0)
  const totalBilled = collected + pending + overdue
  const collectionRate = totalBilled > 0 ? Math.round((collected / totalBilled) * 100) : 0

  const summaryRows = [
    { Indicador: 'Condominio', Valor: condominiumName },
    { Indicador: 'Fecha de Generación del Reporte', Valor: today },
    { Indicador: 'Generado por', Valor: 'Sistema VeciLomas HOA - Módulo Finanzas' },
    { Indicador: 'Total de Registros de Cuotas', Valor: fees.length },
    { Indicador: '----------------------------------------', Valor: '----------------------------------------' },
    { Indicador: 'Total Recaudado (Pagado)', Valor: `$${collected.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN` },
    { Indicador: 'Total Por Cobrar (Pendiente)', Valor: `$${pending.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN` },
    { Indicador: 'Total Cartera Vencida (Morosidad)', Valor: `$${overdue.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN` },
    { Indicador: 'Presupuesto Total Facturado', Valor: `$${totalBilled.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN` },
    { Indicador: 'Porcentaje de Cobranza', Valor: `${collectionRate}%` },
    { Indicador: '----------------------------------------', Valor: '----------------------------------------' },
    { Indicador: 'Propiedades al Corriente', Valor: fees.filter(f => f.status === 'Pagada').length },
    { Indicador: 'Propiedades con Cuota Pendiente', Valor: fees.filter(f => f.status === 'Pendiente').length },
    { Indicador: 'Propiedades en Estado de Mora', Valor: fees.filter(f => f.status === 'Vencida').length },
  ]

  const wsSummary = XLSX.utils.json_to_sheet(summaryRows)
  wsSummary['!cols'] = [
    { wch: 36 },
    { wch: 40 },
  ]

  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen Financiero')

  // Descargar archivo Excel
  const dateStr = new Date().toISOString().slice(0, 10)
  const fileName = `Reporte_Financiero_Cuotas_${dateStr}.xlsx`
  XLSX.writeFile(wb, fileName)
  return fileName
}

/**
 * Exporta el reporte completo de Finanzas (Cuotas + Tickets de Mantenimiento)
 */
export function exportFullFinanceReportToExcel(data: FinanceExportData) {
  const { fees, tickets = [], condominiumName = 'Condominio Residencial Las Palomas' } = data
  const wb = XLSX.utils.book_new()
  const today = new Date().toLocaleDateString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  // 1. Resumen General
  const collected = fees.filter(f => f.status === 'Pagada').reduce((s, f) => s + (Number(f.amount) || 0), 0)
  const pending = fees.filter(f => f.status === 'Pendiente').reduce((s, f) => s + (Number(f.amount) || 0), 0)
  const overdue = fees.filter(f => f.status === 'Vencida').reduce((s, f) => s + (Number(f.amount) || 0), 0)
  const totalBilled = collected + pending + overdue
  const collectionRate = totalBilled > 0 ? Math.round((collected / totalBilled) * 100) : 0

  const summaryRows = [
    { 'REPORTE FINANCIERO Y OPERATIVO': condominiumName, 'VALOR / DETALLE': '' },
    { 'REPORTE FINANCIERO Y OPERATIVO': 'Fecha y Hora de Emisión', 'VALOR / DETALLE': today },
    { 'REPORTE FINANCIERO Y OPERATIVO': 'Sistema Emisor', 'VALOR / DETALLE': 'VeciLomas HOA ERP & Residential Portal' },
    { 'REPORTE FINANCIERO Y OPERATIVO': '', 'VALOR / DETALLE': '' },
    { 'REPORTE FINANCIERO Y OPERATIVO': '═══ MÉTRICAS DE COBRANZA ═══', 'VALOR / DETALLE': '' },
    { 'REPORTE FINANCIERO Y OPERATIVO': 'Total Recaudado', 'VALOR / DETALLE': `$${collected.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN` },
    { 'REPORTE FINANCIERO Y OPERATIVO': 'Total Por Cobrar', 'VALOR / DETALLE': `$${pending.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN` },
    { 'REPORTE FINANCIERO Y OPERATIVO': 'Cartera Vencida (Mora)', 'VALOR / DETALLE': `$${overdue.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN` },
    { 'REPORTE FINANCIERO Y OPERATIVO': 'Presupuesto Total Evaluado', 'VALOR / DETALLE': `$${totalBilled.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN` },
    { 'REPORTE FINANCIERO Y OPERATIVO': 'Efectividad de Cobranza', 'VALOR / DETALLE': `${collectionRate}%` },
    { 'REPORTE FINANCIERO Y OPERATIVO': '', 'VALOR / DETALLE': '' },
    { 'REPORTE FINANCIERO Y OPERATIVO': '═══ TICKETS DE MANTENIMIENTO ═══', 'VALOR / DETALLE': '' },
    { 'REPORTE FINANCIERO Y OPERATIVO': 'Total Tickets Registrados', 'VALOR / DETALLE': tickets.length },
    { 'REPORTE FINANCIERO Y OPERATIVO': 'Tickets Resueltos', 'VALOR / DETALLE': tickets.filter(t => t.status === 'Resuelto').length },
    { 'REPORTE FINANCIERO Y OPERATIVO': 'Tickets En Proceso', 'VALOR / DETALLE': tickets.filter(t => t.status === 'En Proceso').length },
    { 'REPORTE FINANCIERO Y OPERATIVO': 'Tickets Pendientes', 'VALOR / DETALLE': tickets.filter(t => t.status === 'Pendiente').length },
  ]

  const wsSummary = XLSX.utils.json_to_sheet(summaryRows)
  wsSummary['!cols'] = [{ wch: 38 }, { wch: 45 }]
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen Ejecutivo')

  // 2. Hoja de Cuotas
  const feesRows = fees.map((f, idx) => ({
    'Folio / Ref': idx + 1,
    'Unidad': f.unit || 'S/N',
    'Condómino': f.resident || 'Propietario',
    'Concepto': f.concept,
    'Monto ($ MXN)': Number(f.amount) || 0,
    'Estado': f.status,
    'Vencimiento': f.dueDate || '—',
    'Fecha Pago': f.date || '—',
    'Método': f.paymentMethod || 'Pendiente',
  }))
  const wsFees = XLSX.utils.json_to_sheet(feesRows)
  wsFees['!cols'] = [{ wch: 12 }, { wch: 12 }, { wch: 26 }, { wch: 36 }, { wch: 16 }, { wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 22 }]
  XLSX.utils.book_append_sheet(wb, wsFees, 'Estado de Cuotas')

  // 3. Hoja de Pagos Reales / Transacciones Bancarias (si existen)
  const payments = data.payments || []
  if (payments.length > 0) {
    const paymentsRows = payments.map((p, idx) => ({
      'No.': idx + 1,
      'ID Pago': p.id,
      'Unidad': p.unit || 'S/N',
      'Condómino / Pagador': p.resident || 'Propietario',
      'Concepto Liquidado': p.concept,
      'Monto Pagado ($ MXN)': Number(p.amountPaid) || 0,
      'Método de Pago': p.paymentMethod,
      'Referencia / Folio SPEI': p.referenceNumber || '—',
      'Fecha y Hora': p.paidAt || '—',
      'Estatus': (p.status || 'Aprobado').toUpperCase(),
      'Validado Por': p.verifiedBy || 'Sistema',
    }))
    const wsPayments = XLSX.utils.json_to_sheet(paymentsRows)
    wsPayments['!cols'] = [
      { wch: 6 },
      { wch: 12 },
      { wch: 12 },
      { wch: 28 },
      { wch: 38 },
      { wch: 22 },
      { wch: 24 },
      { wch: 28 },
      { wch: 22 },
      { wch: 14 },
      { wch: 24 },
    ]
    XLSX.utils.book_append_sheet(wb, wsPayments, 'Transacciones de Pago')
  }

  // 4. Hoja de Tickets (si existen)
  if (tickets.length > 0) {
    const ticketsRows = tickets.map(t => ({
      'Folio': t.id,
      'Ubicación': t.location,
      'Reportado Por': t.reporter,
      'Unidad': t.unit || 'Áreas Comunes',
      'Problema / Asunto': t.issue,
      'Prioridad': t.priority,
      'Estado': t.status,
      'Fecha': t.date,
      'Asignado A': t.assignedTo || 'Sin asignar',
    }))
    const wsTickets = XLSX.utils.json_to_sheet(ticketsRows)
    wsTickets['!cols'] = [{ wch: 14 }, { wch: 26 }, { wch: 24 }, { wch: 16 }, { wch: 40 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 28 }]
    XLSX.utils.book_append_sheet(wb, wsTickets, 'Tickets de Mantenimiento')
  }

  const dateStr = new Date().toISOString().slice(0, 10)
  const fileName = `Reporte_Financiero_Integral_${dateStr}.xlsx`
  XLSX.writeFile(wb, fileName)
  return fileName
}

/**
 * Exporta el reporte de Tickets de Mantenimiento a Excel
 */
export function exportTicketsToExcel(tickets: MaintenanceTicket[], condominiumName = 'Condominio Residencial Las Palomas') {
  const wb = XLSX.utils.book_new()
  const today = new Date().toLocaleDateString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  const ticketsRows = tickets.map(t => ({
    'Folio Ticket': t.id,
    'Ubicación': t.location,
    'Reportado Por': t.reporter,
    'Unidad': t.unit || 'Áreas Comunes',
    'Descripción de la Falla': t.issue,
    'Prioridad': t.priority,
    'Estado': t.status,
    'Fecha de Reporte': t.date,
    'Técnico / Proveedor Asignado': t.assignedTo || 'Por asignar',
  }))

  const wsTickets = XLSX.utils.json_to_sheet(ticketsRows)
  wsTickets['!cols'] = [
    { wch: 16 },
    { wch: 28 },
    { wch: 24 },
    { wch: 16 },
    { wch: 42 },
    { wch: 12 },
    { wch: 14 },
    { wch: 18 },
    { wch: 30 },
  ]
  XLSX.utils.book_append_sheet(wb, wsTickets, 'Mantenimiento')

  const summaryRows = [
    { Campo: 'Condominio', Valor: condominiumName },
    { Campo: 'Fecha del Reporte', Valor: today },
    { Campo: 'Total de Tickets', Valor: tickets.length },
    { Campo: 'Tickets Resueltos', Valor: tickets.filter(t => t.status === 'Resuelto').length },
    { Campo: 'Tickets En Proceso', Valor: tickets.filter(t => t.status === 'En Proceso').length },
    { Campo: 'Tickets Pendientes', Valor: tickets.filter(t => t.status === 'Pendiente').length },
  ]
  const wsSummary = XLSX.utils.json_to_sheet(summaryRows)
  wsSummary['!cols'] = [{ wch: 25 }, { wch: 35 }]
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen')

  const dateStr = new Date().toISOString().slice(0, 10)
  const fileName = `Reporte_Tickets_Mantenimiento_${dateStr}.xlsx`
  XLSX.writeFile(wb, fileName)
  return fileName
}

/**
 * Exporta el estado de cuenta individual para un residente
 */
export function exportResidentStatementToExcel(
  fees: FeeStatement[],
  residentName: string,
  unit: string,
  condominiumName = 'Condominio Residencial Las Palomas'
) {
  const wb = XLSX.utils.book_new()
  const today = new Date().toLocaleDateString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  const rows = fees.map((f, i) => ({
    'No.': i + 1,
    'Concepto': f.concept,
    'Monto ($ MXN)': Number(f.amount) || 0,
    'Fecha Límite': f.dueDate || '—',
    'Fecha de Pago': f.date || '—',
    'Método de Pago': f.paymentMethod || '—',
    'Estatus': f.status,
  }))

  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = [
    { wch: 6 },
    { wch: 38 },
    { wch: 16 },
    { wch: 18 },
    { wch: 18 },
    { wch: 24 },
    { wch: 14 },
  ]

  XLSX.utils.book_append_sheet(wb, ws, `Estado de Cuenta ${unit}`)

  const summary = [
    { Detalle: 'Condominio', Informacion: condominiumName },
    { Detalle: 'Residente / Titular', Informacion: residentName },
    { Detalle: 'Unidad / Departamento', Informacion: unit },
    { Detalle: 'Fecha de Emisión', Informacion: today },
    { Detalle: 'Total Pagado', Informacion: `$${fees.filter(f => f.status === 'Pagada').reduce((s, f) => s + (Number(f.amount) || 0), 0).toLocaleString()} MXN` },
    { Detalle: 'Saldo Pendiente', Informacion: `$${fees.filter(f => f.status !== 'Pagada').reduce((s, f) => s + (Number(f.amount) || 0), 0).toLocaleString()} MXN` },
  ]
  const wsSum = XLSX.utils.json_to_sheet(summary)
  wsSum['!cols'] = [{ wch: 25 }, { wch: 35 }]
  XLSX.utils.book_append_sheet(wb, wsSum, 'Datos Generales')

  const fileName = `Estado_Cuenta_${unit}_${residentName.replace(/\s+/g, '_')}.xlsx`
  XLSX.writeFile(wb, fileName)
  return fileName
}
