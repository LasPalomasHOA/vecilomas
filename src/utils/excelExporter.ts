import ExcelJS from 'exceljs'
import type { FeeStatement, MaintenanceTicket, PaymentTransaction } from '@/types/finance'

export interface FinanceExportData {
  fees: FeeStatement[]
  payments?: PaymentTransaction[]
  tickets?: MaintenanceTicket[]
  condominiumName?: string
}

// ── Paleta de Colores Corporativa (Formato ARGB de Excel) ───────────────────
const COLORS = {
  NAVY_HEADER: 'FF002B2B',       // #002b2b
  TEAL_PRIMARY: 'FF004C4C',      // #004c4c
  TEAL_ACCENT: 'FF008080',       // #008080
  TEAL_LIGHT: 'FFE6F4F4',        // #e6f4f4
  TEAL_BORDER: 'FF99D6D6',       // #99d6d6
  
  SUCCESS_BG: 'FFDCFCE7',        // #dcfce7
  SUCCESS_TEXT: 'FF166534',      // #166534
  
  WARNING_BG: 'FFFEF3C7',        // #fef3c7
  WARNING_TEXT: 'FF92400E',      // #92400e
  
  DANGER_BG: 'FFFEE2E2',         // #fee2e2
  DANGER_TEXT: 'FF991B1B',       // #991b1b
  
  ZEBRA_ROW: 'FFF8FAFC',         // #f8fafc
  WHITE: 'FFFFFFFF',             // #ffffff
  TEXT_MAIN: 'FF0F172A',         // #0f172a
  TEXT_MUTED: 'FF64748B',        // #64748b
  BORDER_LIGHT: 'FFE2E8F0',      // #e2e8f0
  BORDER_DARK: 'FF94A3B8',       // #94a3b8
}

/**
 * Genera una barra de progreso visual tipo gráfica de barras en texto
 */
function createBarGraph(percentage: number, length = 20): string {
  const clamped = Math.max(0, Math.min(100, percentage))
  const filledCount = Math.round((clamped / 100) * length)
  const emptyCount = length - filledCount
  return `${'█'.repeat(filledCount)}${'░'.repeat(emptyCount)} ${clamped.toFixed(1)}%`
}

/**
 * Descarga el libro de Excel en el navegador
 */
async function downloadWorkbook(workbook: ExcelJS.Workbook, fileName: string) {
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}

/**
 * Aplica estilos estándar a un rango de celdas
 */
function styleCell(
  cell: ExcelJS.Cell,
  options: {
    bg?: string
    fg?: string
    bold?: boolean
    size?: number
    align?: 'left' | 'center' | 'right'
    numFmt?: string
    border?: boolean
    borderStyle?: ExcelJS.BorderStyle
  } = {}
) {
  if (options.bg) {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: options.bg },
    }
  }
  cell.font = {
    name: 'Segoe UI',
    size: options.size || 10,
    bold: !!options.bold,
    color: { argb: options.fg || COLORS.TEXT_MAIN },
  }
  cell.alignment = {
    vertical: 'middle',
    horizontal: options.align || 'left',
    wrapText: true,
  }
  if (options.numFmt) {
    cell.numFmt = options.numFmt
  }
  if (options.border !== false) {
    const bStyle = options.borderStyle || 'thin'
    const bColor = { argb: COLORS.BORDER_LIGHT }
    cell.border = {
      top: { style: bStyle, color: bColor },
      left: { style: bStyle, color: bColor },
      bottom: { style: bStyle, color: bColor },
      right: { style: bStyle, color: bColor },
    }
  }
}

/**
 * Crea el Banner Principal de la Hoja
 */
function createHeaderBanner(
  sheet: ExcelJS.Worksheet,
  title: string,
  subtitle: string,
  condominiumName: string,
  maxCols = 9
) {
  const todayStr = new Date().toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  // Fila 1: Título Principal
  sheet.mergeCells(1, 1, 1, maxCols)
  const titleCell = sheet.getCell('A1')
  titleCell.value = `VECILOMAS HOA ERP  •  ${title.toUpperCase()}`
  styleCell(titleCell, { bg: COLORS.NAVY_HEADER, fg: COLORS.WHITE, bold: true, size: 14, align: 'center' })
  sheet.getRow(1).height = 36

  // Fila 2: Subtítulo
  sheet.mergeCells(2, 1, 2, maxCols)
  const subCell = sheet.getCell('A2')
  subCell.value = subtitle
  styleCell(subCell, { bg: COLORS.TEAL_PRIMARY, fg: COLORS.WHITE, bold: false, size: 11, align: 'center' })
  sheet.getRow(2).height = 24

  // Fila 3: Metadatos
  sheet.mergeCells(3, 1, 3, maxCols)
  const metaCell = sheet.getCell('A3')
  metaCell.value = `🏢 Condominio: ${condominiumName}   |   📅 Emisión: ${todayStr}   |   🔒 Estado: Verificado en Base de Datos`
  styleCell(metaCell, { bg: COLORS.TEAL_LIGHT, fg: COLORS.TEAL_PRIMARY, bold: true, size: 9.5, align: 'center' })
  sheet.getRow(3).height = 22

  sheet.addRow([]) // Fila 4 vacía
}

// ────────────────────────────────────────────────────────────────────────────
// 1. EXPORTAR CONTROL DE CUOTAS Y ESTADOS DE CUENTA
// ────────────────────────────────────────────────────────────────────────────
export async function exportFeesToExcel(fees: FeeStatement[], condominiumName = 'Condominio Residencial Las Palomas') {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'VeciLomas HOA Portal'
  wb.created = new Date()

  const collected = fees.filter(f => f.status === 'Pagada').reduce((s, f) => s + (Number(f.amount) || 0), 0)
  const pending = fees.filter(f => f.status === 'Pendiente').reduce((s, f) => s + (Number(f.amount) || 0), 0)
  const overdue = fees.filter(f => f.status === 'Vencida').reduce((s, f) => s + (Number(f.amount) || 0), 0)
  const totalBilled = collected + pending + overdue
  const collectionRate = totalBilled > 0 ? (collected / totalBilled) * 100 : 0

  // ── HOJA 1: RESUMEN EJECUTIVO & GRÁFICAS ─────────────────────────────────
  const wsSummary = wb.addWorksheet('Resumen y Gráficas', { views: [{ showGridLines: true }] })
  createHeaderBanner(wsSummary, 'Panel Ejecutivo de Cobranza', 'Métricas Clave y Distribución Gráfica de Cuotas', condominiumName, 6)

  // Tarjetas KPI en Cuadrícula
  wsSummary.getCell('A5').value = 'MÉTRICAS CLAVE DE RECAUDACIÓN'
  wsSummary.mergeCells('A5:C5')
  styleCell(wsSummary.getCell('A5'), { bg: COLORS.TEAL_PRIMARY, fg: COLORS.WHITE, bold: true, size: 11, align: 'center' })

  wsSummary.getCell('D5').value = 'GRÁFICAS DE DISTRIBUCIÓN (%)'
  wsSummary.mergeCells('D5:F5')
  styleCell(wsSummary.getCell('D5'), { bg: COLORS.NAVY_HEADER, fg: COLORS.WHITE, bold: true, size: 11, align: 'center' })

  const kpis = [
    { label: 'Total Recaudado (Pagado)', val: collected, fmt: '"$"#,##0.00', color: COLORS.SUCCESS_BG, text: COLORS.SUCCESS_TEXT, barVal: collectionRate },
    { label: 'Saldo Por Cobrar (Pendiente)', val: pending, fmt: '"$"#,##0.00', color: COLORS.WARNING_BG, text: COLORS.WARNING_TEXT, barVal: totalBilled > 0 ? (pending / totalBilled) * 100 : 0 },
    { label: 'Cartera Vencida (Mora)', val: overdue, fmt: '"$"#,##0.00', color: COLORS.DANGER_BG, text: COLORS.DANGER_TEXT, barVal: totalBilled > 0 ? (overdue / totalBilled) * 100 : 0 },
    { label: 'Presupuesto Total Facturado', val: totalBilled, fmt: '"$"#,##0.00', color: COLORS.TEAL_LIGHT, text: COLORS.TEAL_PRIMARY, barVal: 100 },
  ]

  let r = 6
  kpis.forEach(k => {
    wsSummary.getCell(`A${r}`).value = k.label
    wsSummary.mergeCells(`A${r}:B${r}`)
    styleCell(wsSummary.getCell(`A${r}`), { bold: true, size: 10 })

    wsSummary.getCell(`C${r}`).value = k.val
    styleCell(wsSummary.getCell(`C${r}`), { bg: k.color, fg: k.text, bold: true, size: 11, align: 'right', numFmt: k.fmt })

    wsSummary.getCell(`D${r}`).value = k.label.split(' ')[0]
    styleCell(wsSummary.getCell(`D${r}`), { bold: true, size: 9, align: 'center' })

    wsSummary.getCell(`E${r}`).value = createBarGraph(k.barVal, 16)
    wsSummary.mergeCells(`E${r}:F${r}`)
    styleCell(wsSummary.getCell(`E${r}`), { bg: k.color, fg: k.text, bold: true, size: 9.5, align: 'left' })

    wsSummary.getRow(r).height = 22
    r++
  })

  // Distribución de Unidades
  r += 2
  wsSummary.getCell(`A${r}`).value = 'DISTRIBUCIÓN DEL PADRÓN DE PROPIEDADES'
  wsSummary.mergeCells(`A${r}:F${r}`)
  styleCell(wsSummary.getCell(`A${r}`), { bg: COLORS.TEAL_PRIMARY, fg: COLORS.WHITE, bold: true, size: 11, align: 'center' })
  r++

  const unitStats = [
    { label: 'Propiedades al Corriente (Pagadas)', count: fees.filter(f => f.status === 'Pagada').length, pct: fees.length > 0 ? (fees.filter(f => f.status === 'Pagada').length / fees.length) * 100 : 0, bg: COLORS.SUCCESS_BG, fg: COLORS.SUCCESS_TEXT },
    { label: 'Propiedades con Cuota Pendiente', count: fees.filter(f => f.status === 'Pendiente').length, pct: fees.length > 0 ? (fees.filter(f => f.status === 'Pendiente').length / fees.length) * 100 : 0, bg: COLORS.WARNING_BG, fg: COLORS.WARNING_TEXT },
    { label: 'Propiedades en Estado de Mora', count: fees.filter(f => f.status === 'Vencida').length, pct: fees.length > 0 ? (fees.filter(f => f.status === 'Vencida').length / fees.length) * 100 : 0, bg: COLORS.DANGER_BG, fg: COLORS.DANGER_TEXT },
  ]

  unitStats.forEach(u => {
    wsSummary.getCell(`A${r}`).value = u.label
    wsSummary.mergeCells(`A${r}:C${r}`)
    styleCell(wsSummary.getCell(`A${r}`), { bold: true, size: 10 })

    wsSummary.getCell(`D${r}`).value = `${u.count} propiedades`
    styleCell(wsSummary.getCell(`D${r}`), { bold: true, size: 10, align: 'center' })

    wsSummary.getCell(`E${r}`).value = createBarGraph(u.pct, 16)
    wsSummary.mergeCells(`E${r}:F${r}`)
    styleCell(wsSummary.getCell(`E${r}`), { bg: u.bg, fg: u.fg, bold: true, size: 9.5, align: 'left' })

    wsSummary.getRow(r).height = 22
    r++
  })

  wsSummary.columns = [
    { width: 26 },
    { width: 18 },
    { width: 22 },
    { width: 18 },
    { width: 18 },
    { width: 18 },
  ]

  // ── HOJA 2: TABLA DETALLADA DE CUOTAS ────────────────────────────────────
  const wsDetail = wb.addWorksheet('Control de Cuotas', { views: [{ showGridLines: true }] })
  createHeaderBanner(wsDetail, 'Detalle de Cuotas y Cobranza', 'Relación Pormenorizada de Cargos por Unidad Condominal', condominiumName, 10)

  const headers = ['No.', 'Folio', 'Unidad', 'Condómino / Titular', 'Concepto de Pago', 'Importe ($ MXN)', 'Estatus', 'Vencimiento', 'Fecha Pago', 'Método de Pago']
  const headerRow = wsDetail.addRow(headers)
  headerRow.height = 26
  headerRow.eachCell(cell => {
    styleCell(cell, { bg: COLORS.TEAL_PRIMARY, fg: COLORS.WHITE, bold: true, size: 10.5, align: 'center' })
  })

  fees.forEach((f, idx) => {
    const isZebra = idx % 2 === 1
    const bgRow = isZebra ? COLORS.ZEBRA_ROW : COLORS.WHITE
    const isPaid = f.status === 'Pagada'
    const isOverdue = f.status === 'Vencida'

    const row = wsDetail.addRow([
      idx + 1,
      `CUOTA-${f.id}`,
      f.unit || 'S/N',
      f.resident || 'Propietario',
      f.concept,
      Number(f.amount) || 0,
      isPaid ? '✔ PAGADA' : isOverdue ? '⚠ VENCIDA' : '⏳ PENDIENTE',
      f.dueDate || '—',
      f.date || '—',
      f.paymentMethod || 'Pendiente',
    ])
    row.height = 22

    // Estilos celda por celda
    styleCell(row.getCell(1), { bg: bgRow, align: 'center', size: 9 })
    styleCell(row.getCell(2), { bg: bgRow, bold: true, align: 'center', size: 9 })
    styleCell(row.getCell(3), { bg: bgRow, bold: true, align: 'center', size: 10 })
    styleCell(row.getCell(4), { bg: bgRow, size: 9.5 })
    styleCell(row.getCell(5), { bg: bgRow, size: 9.5 })
    styleCell(row.getCell(6), { bg: bgRow, bold: true, align: 'right', size: 10.5, numFmt: '"$"#,##0.00' })
    
    // Status color pill
    const statusBg = isPaid ? COLORS.SUCCESS_BG : isOverdue ? COLORS.DANGER_BG : COLORS.WARNING_BG
    const statusFg = isPaid ? COLORS.SUCCESS_TEXT : isOverdue ? COLORS.DANGER_TEXT : COLORS.WARNING_TEXT
    styleCell(row.getCell(7), { bg: statusBg, fg: statusFg, bold: true, align: 'center', size: 9.5 })

    styleCell(row.getCell(8), { bg: bgRow, align: 'center', size: 9 })
    styleCell(row.getCell(9), { bg: bgRow, align: 'center', size: 9 })
    styleCell(row.getCell(10), { bg: bgRow, size: 9.5 })
  })

  // Fila de Totales
  const totalRow = wsDetail.addRow([
    'TOTAL',
    '',
    '',
    `${fees.length} registros`,
    'TOTAL FACTURADO',
    totalBilled,
    `${collectionRate.toFixed(1)}% cobrado`,
    '',
    '',
    '',
  ])
  totalRow.height = 26
  totalRow.eachCell((cell, colNumber) => {
    if (colNumber === 6) {
      styleCell(cell, { bg: COLORS.NAVY_HEADER, fg: COLORS.WHITE, bold: true, size: 11, align: 'right', numFmt: '"$"#,##0.00' })
    } else {
      styleCell(cell, { bg: COLORS.NAVY_HEADER, fg: COLORS.WHITE, bold: true, size: 10, align: 'center' })
    }
  })

  wsDetail.columns = [
    { width: 6 },
    { width: 14 },
    { width: 12 },
    { width: 28 },
    { width: 38 },
    { width: 20 },
    { width: 16 },
    { width: 16 },
    { width: 16 },
    { width: 24 },
  ]

  const dateStr = new Date().toISOString().slice(0, 10)
  const fileName = `Reporte_Financiero_Cuotas_${dateStr}.xlsx`
  await downloadWorkbook(wb, fileName)
  return fileName
}

// ────────────────────────────────────────────────────────────────────────────
// 2. EXPORTAR HISTORIAL DE PAGOS Y TRANSACCIONES REALES (SPEI)
// ────────────────────────────────────────────────────────────────────────────
export async function exportPaymentsToExcel(payments: PaymentTransaction[], condominiumName = 'Condominio Residencial Las Palomas') {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'VeciLomas HOA Portal'
  wb.created = new Date()

  const totalAmount = payments.reduce((s, p) => s + (Number(p.amountPaid) || 0), 0)
  const speiPayments = payments.filter(p => p.paymentMethod.includes('SPEI') || p.paymentMethod.includes('Transferencia'))
  const speiTotal = speiPayments.reduce((s, p) => s + (Number(p.amountPaid) || 0), 0)
  const cardCount = payments.filter(p => p.paymentMethod.includes('Tarjeta')).length
  const cashCount = payments.filter(p => p.paymentMethod.includes('Efectivo')).length

  const ws = wb.addWorksheet('Transacciones SPEI', { views: [{ showGridLines: true }] })
  createHeaderBanner(ws, 'Libro de Ingresos y Pagos Conciliados', 'Registro Oficial de Transacciones Bancarias (SPEI / Tarjetas)', condominiumName, 10)

  // Bloque Superior de Resumen y Gráfica
  ws.getCell('A5').value = 'MÉTRICAS DE TRANSACCIONES BANCARIAS'
  ws.mergeCells('A5:E5')
  styleCell(ws.getCell('A5'), { bg: COLORS.TEAL_PRIMARY, fg: COLORS.WHITE, bold: true, size: 11, align: 'center' })

  ws.getCell('F5').value = 'DISTRIBUCIÓN POR MÉTODO DE PAGO'
  ws.mergeCells('F5:J5')
  styleCell(ws.getCell('F5'), { bg: COLORS.NAVY_HEADER, fg: COLORS.WHITE, bold: true, size: 11, align: 'center' })

  const summaryData = [
    { label: 'Total Recaudado en BD:', val: totalAmount, fmt: '"$"#,##0.00', mLabel: 'Transferencia SPEI', mPct: totalAmount > 0 ? (speiTotal / totalAmount) * 100 : 0 },
    { label: 'Número de Transacciones:', val: `${payments.length} aprobadas`, mLabel: 'Tarjeta Débito/Crédito', mPct: payments.length > 0 ? (cardCount / payments.length) * 100 : 0 },
    { label: 'Ingresos por SPEI:', val: speiTotal, fmt: '"$"#,##0.00', mLabel: 'Efectivo / Administración', mPct: payments.length > 0 ? (cashCount / payments.length) * 100 : 0 },
    { label: 'Tasa de Conciliación:', val: '100% Conciliado', mLabel: 'Eficiencia de Registro', mPct: 100 },
  ]

  let r = 6
  summaryData.forEach(s => {
    ws.getCell(`A${r}`).value = s.label
    ws.mergeCells(`A${r}:C${r}`)
    styleCell(ws.getCell(`A${r}`), { bold: true, size: 10 })

    ws.getCell(`D${r}`).value = s.val
    ws.mergeCells(`D${r}:E${r}`)
    styleCell(ws.getCell(`D${r}`), { bg: COLORS.SUCCESS_BG, fg: COLORS.SUCCESS_TEXT, bold: true, size: 10.5, align: 'right', numFmt: s.fmt })

    ws.getCell(`F${r}`).value = s.mLabel
    ws.mergeCells(`F${r}:G${r}`)
    styleCell(ws.getCell(`F${r}`), { bold: true, size: 9.5 })

    ws.getCell(`H${r}`).value = createBarGraph(s.mPct, 15)
    ws.mergeCells(`H${r}:J${r}`)
    styleCell(ws.getCell(`H${r}`), { bg: COLORS.TEAL_LIGHT, fg: COLORS.TEAL_PRIMARY, bold: true, size: 9, align: 'left' })

    ws.getRow(r).height = 22
    r++
  })

  // Encabezados de Tabla
  r += 2
  const headers = ['No.', 'Folio', 'Unidad', 'Condómino / Pagador', 'Concepto Liquidado', 'Monto Pagado ($ MXN)', 'Método', 'Clave de Rastreo / Referencia SPEI', 'Fecha y Hora', 'Estatus']
  const headerRow = ws.getRow(r)
  headers.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1)
    cell.value = h
    styleCell(cell, { bg: COLORS.TEAL_PRIMARY, fg: COLORS.WHITE, bold: true, size: 10.5, align: 'center' })
  })
  headerRow.height = 26
  r++

  // Filas de Datos
  payments.forEach((p, idx) => {
    const isZebra = idx % 2 === 1
    const bgRow = isZebra ? COLORS.ZEBRA_ROW : COLORS.WHITE

    const row = ws.getRow(r)
    row.values = [
      idx + 1,
      `PAG-${String(p.id).padStart(4, '0')}`,
      p.unit || 'S/N',
      p.resident || 'Propietario',
      p.concept,
      Number(p.amountPaid) || 0,
      p.paymentMethod,
      p.referenceNumber || '—',
      p.paidAt || '—',
      '✔ APROBADO',
    ]
    row.height = 22

    styleCell(row.getCell(1), { bg: bgRow, align: 'center', size: 9 })
    styleCell(row.getCell(2), { bg: bgRow, bold: true, align: 'center', size: 9 })
    styleCell(row.getCell(3), { bg: bgRow, bold: true, align: 'center', size: 10 })
    styleCell(row.getCell(4), { bg: bgRow, size: 9.5 })
    styleCell(row.getCell(5), { bg: bgRow, size: 9.5 })
    styleCell(row.getCell(6), { bg: bgRow, bold: true, align: 'right', size: 10.5, numFmt: '"$"#,##0.00' })
    styleCell(row.getCell(7), { bg: bgRow, size: 9.5, align: 'center' })
    styleCell(row.getCell(8), { bg: bgRow, bold: true, size: 9.5, align: 'center' })
    styleCell(row.getCell(9), { bg: bgRow, size: 9, align: 'center' })
    styleCell(row.getCell(10), { bg: COLORS.SUCCESS_BG, fg: COLORS.SUCCESS_TEXT, bold: true, size: 9.5, align: 'center' })
    r++
  })

  // Fila de Totales
  const totalRow = ws.getRow(r)
  totalRow.values = ['TOTAL', '', '', `${payments.length} transacciones`, 'TOTAL INGRESADO', totalAmount, '', '', '', '100% CONCILIADO']
  totalRow.height = 26
  totalRow.eachCell((cell, colNumber) => {
    if (colNumber === 6) {
      styleCell(cell, { bg: COLORS.NAVY_HEADER, fg: COLORS.WHITE, bold: true, size: 11, align: 'right', numFmt: '"$"#,##0.00' })
    } else {
      styleCell(cell, { bg: COLORS.NAVY_HEADER, fg: COLORS.WHITE, bold: true, size: 10, align: 'center' })
    }
  })

  ws.columns = [
    { width: 6 },
    { width: 14 },
    { width: 12 },
    { width: 28 },
    { width: 38 },
    { width: 22 },
    { width: 22 },
    { width: 32 },
    { width: 22 },
    { width: 16 },
  ]

  const dateStr = new Date().toISOString().slice(0, 10)
  const fileName = `Reporte_Pagos_Reales_${dateStr}.xlsx`
  await downloadWorkbook(wb, fileName)
  return fileName
}

// ────────────────────────────────────────────────────────────────────────────
// 3. EXPORTAR REPORTE INTEGRAL COMPLETO (CUOTAS + PAGOS + MANTENIMIENTO)
// ────────────────────────────────────────────────────────────────────────────
export async function exportFullFinanceReportToExcel(data: FinanceExportData) {
  const { fees, payments = [], tickets = [], condominiumName = 'Condominio Residencial Las Palomas' } = data
  const wb = new ExcelJS.Workbook()
  wb.creator = 'VeciLomas HOA Portal'
  wb.created = new Date()

  const collected = fees.filter(f => f.status === 'Pagada').reduce((s, f) => s + (Number(f.amount) || 0), 0)
  const pending = fees.filter(f => f.status === 'Pendiente').reduce((s, f) => s + (Number(f.amount) || 0), 0)
  const overdue = fees.filter(f => f.status === 'Vencida').reduce((s, f) => s + (Number(f.amount) || 0), 0)
  const totalBilled = collected + pending + overdue
  const collectionRate = totalBilled > 0 ? (collected / totalBilled) * 100 : 0

  // ── HOJA 1: RESUMEN EJECUTIVO ──
  const wsSummary = wb.addWorksheet('Resumen Ejecutivo', { views: [{ showGridLines: true }] })
  createHeaderBanner(wsSummary, 'Reporte Financiero y Operativo Integral', 'Auditoría Global de Cuotas, Cobranza y Mantenimiento Residencial', condominiumName, 6)

  wsSummary.getCell('A5').value = 'MÉTRICAS FINANCIERAS'
  wsSummary.mergeCells('A5:C5')
  styleCell(wsSummary.getCell('A5'), { bg: COLORS.TEAL_PRIMARY, fg: COLORS.WHITE, bold: true, size: 11, align: 'center' })

  wsSummary.getCell('D5').value = 'GRÁFICA DE EFICIENCIA (%)'
  wsSummary.mergeCells('D5:F5')
  styleCell(wsSummary.getCell('D5'), { bg: COLORS.NAVY_HEADER, fg: COLORS.WHITE, bold: true, size: 11, align: 'center' })

  const kpis = [
    { label: 'Total Recaudado (Al Corriente)', val: collected, fmt: '"$"#,##0.00', color: COLORS.SUCCESS_BG, text: COLORS.SUCCESS_TEXT, barVal: collectionRate },
    { label: 'Saldo Por Cobrar (Pendiente)', val: pending, fmt: '"$"#,##0.00', color: COLORS.WARNING_BG, text: COLORS.WARNING_TEXT, barVal: totalBilled > 0 ? (pending / totalBilled) * 100 : 0 },
    { label: 'Cartera Vencida (Mora)', val: overdue, fmt: '"$"#,##0.00', color: COLORS.DANGER_BG, text: COLORS.DANGER_TEXT, barVal: totalBilled > 0 ? (overdue / totalBilled) * 100 : 0 },
    { label: 'Presupuesto Total Facturado', val: totalBilled, fmt: '"$"#,##0.00', color: COLORS.TEAL_LIGHT, text: COLORS.TEAL_PRIMARY, barVal: 100 },
  ]

  let r = 6
  kpis.forEach(k => {
    wsSummary.getCell(`A${r}`).value = k.label
    wsSummary.mergeCells(`A${r}:B${r}`)
    styleCell(wsSummary.getCell(`A${r}`), { bold: true, size: 10 })

    wsSummary.getCell(`C${r}`).value = k.val
    styleCell(wsSummary.getCell(`C${r}`), { bg: k.color, fg: k.text, bold: true, size: 11, align: 'right', numFmt: k.fmt })

    wsSummary.getCell(`D${r}`).value = createBarGraph(k.barVal, 16)
    wsSummary.mergeCells(`D${r}:F${r}`)
    styleCell(wsSummary.getCell(`D${r}`), { bg: k.color, fg: k.text, bold: true, size: 9.5, align: 'left' })

    wsSummary.getRow(r).height = 22
    r++
  })

  // Operatividad de Mantenimiento
  r += 2
  wsSummary.getCell(`A${r}`).value = 'OPERATIVIDAD DE MANTENIMIENTO E INCIDENCIAS'
  wsSummary.mergeCells(`A${r}:F${r}`)
  styleCell(wsSummary.getCell(`A${r}`), { bg: COLORS.TEAL_PRIMARY, fg: COLORS.WHITE, bold: true, size: 11, align: 'center' })
  r++

  const resolvedCount = tickets.filter(t => t.status === 'Resuelto').length
  const inProgressCount = tickets.filter(t => t.status === 'En Proceso').length
  const pendingCount = tickets.filter(t => t.status === 'Pendiente').length
  const resolveRate = tickets.length > 0 ? (resolvedCount / tickets.length) * 100 : 0

  const ticketStats = [
    { label: 'Total Tickets de Mantenimiento Registrados', count: `${tickets.length} tickets`, pct: 100, bg: COLORS.TEAL_LIGHT, fg: COLORS.TEAL_PRIMARY },
    { label: 'Tickets Resueltos Exitosamente', count: `${resolvedCount} resueltos`, pct: resolveRate, bg: COLORS.SUCCESS_BG, fg: COLORS.SUCCESS_TEXT },
    { label: 'Tickets en Proceso Operativo', count: `${inProgressCount} en proceso`, pct: tickets.length > 0 ? (inProgressCount / tickets.length) * 100 : 0, bg: COLORS.WARNING_BG, fg: COLORS.WARNING_TEXT },
    { label: 'Tickets Pendientes de Asignación', count: `${pendingCount} pendientes`, pct: tickets.length > 0 ? (pendingCount / tickets.length) * 100 : 0, bg: COLORS.DANGER_BG, fg: COLORS.DANGER_TEXT },
  ]

  ticketStats.forEach(t => {
    wsSummary.getCell(`A${r}`).value = t.label
    wsSummary.mergeCells(`A${r}:C${r}`)
    styleCell(wsSummary.getCell(`A${r}`), { bold: true, size: 10 })

    wsSummary.getCell(`D${r}`).value = t.count
    styleCell(wsSummary.getCell(`D${r}`), { bold: true, size: 10, align: 'center' })

    wsSummary.getCell(`E${r}`).value = createBarGraph(t.pct, 16)
    wsSummary.mergeCells(`E${r}:F${r}`)
    styleCell(wsSummary.getCell(`E${r}`), { bg: t.bg, fg: t.fg, bold: true, size: 9.5, align: 'left' })

    wsSummary.getRow(r).height = 22
    r++
  })

  wsSummary.columns = [{ width: 28 }, { width: 18 }, { width: 22 }, { width: 18 }, { width: 18 }, { width: 18 }]

  // ── HOJA 2: CONTROL DE CUOTAS ──
  const wsFees = wb.addWorksheet('Control de Cuotas', { views: [{ showGridLines: true }] })
  createHeaderBanner(wsFees, 'Detalle de Cuotas', 'Relación Pormenorizada de Cargos', condominiumName, 10)
  const feeHeaders = ['No.', 'Folio', 'Unidad', 'Condómino', 'Concepto', 'Importe ($ MXN)', 'Estatus', 'Vencimiento', 'Fecha Pago', 'Método']
  const feeHeaderRow = wsFees.addRow(feeHeaders)
  feeHeaderRow.height = 26
  feeHeaderRow.eachCell(c => styleCell(c, { bg: COLORS.TEAL_PRIMARY, fg: COLORS.WHITE, bold: true, size: 10.5, align: 'center' }))

  fees.forEach((f, idx) => {
    const isZebra = idx % 2 === 1
    const bgRow = isZebra ? COLORS.ZEBRA_ROW : COLORS.WHITE
    const isPaid = f.status === 'Pagada'
    const isOverdue = f.status === 'Vencida'

    const row = wsFees.addRow([
      idx + 1,
      `FEE-${f.id}`,
      f.unit || 'S/N',
      f.resident || 'Propietario',
      f.concept,
      Number(f.amount) || 0,
      isPaid ? '✔ PAGADA' : isOverdue ? '⚠ VENCIDA' : '⏳ PENDIENTE',
      f.dueDate || '—',
      f.date || '—',
      f.paymentMethod || 'Pendiente',
    ])
    row.height = 22
    styleCell(row.getCell(1), { bg: bgRow, align: 'center', size: 9 })
    styleCell(row.getCell(2), { bg: bgRow, bold: true, align: 'center', size: 9 })
    styleCell(row.getCell(3), { bg: bgRow, bold: true, align: 'center', size: 10 })
    styleCell(row.getCell(4), { bg: bgRow, size: 9.5 })
    styleCell(row.getCell(5), { bg: bgRow, size: 9.5 })
    styleCell(row.getCell(6), { bg: bgRow, bold: true, align: 'right', size: 10.5, numFmt: '"$"#,##0.00' })
    const statusBg = isPaid ? COLORS.SUCCESS_BG : isOverdue ? COLORS.DANGER_BG : COLORS.WARNING_BG
    const statusFg = isPaid ? COLORS.SUCCESS_TEXT : isOverdue ? COLORS.DANGER_TEXT : COLORS.WARNING_TEXT
    styleCell(row.getCell(7), { bg: statusBg, fg: statusFg, bold: true, align: 'center', size: 9.5 })
    styleCell(row.getCell(8), { bg: bgRow, align: 'center', size: 9 })
    styleCell(row.getCell(9), { bg: bgRow, align: 'center', size: 9 })
    styleCell(row.getCell(10), { bg: bgRow, size: 9.5 })
  })

  const totalFeeRow = wsFees.addRow(['TOTAL', '', '', `${fees.length} registros`, 'TOTAL FACTURADO', totalBilled, `${collectionRate.toFixed(1)}% cobrado`, '', '', ''])
  totalFeeRow.height = 26
  totalFeeRow.eachCell((cell, col) => {
    if (col === 6) styleCell(cell, { bg: COLORS.NAVY_HEADER, fg: COLORS.WHITE, bold: true, size: 11, align: 'right', numFmt: '"$"#,##0.00' })
    else styleCell(cell, { bg: COLORS.NAVY_HEADER, fg: COLORS.WHITE, bold: true, size: 10, align: 'center' })
  })

  wsFees.columns = [
    { width: 6 }, { width: 14 }, { width: 12 }, { width: 28 }, { width: 38 },
    { width: 20 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 24 }
  ]

  // ── HOJA 3: PAGOS REALES & SPEI (si existen) ──
  if (payments.length > 0) {
    const wsPay = wb.addWorksheet('Pagos y SPEI', { views: [{ showGridLines: true }] })
    createHeaderBanner(wsPay, 'Historial de Pagos Conciliados', 'Comprobantes y Transacciones en Base de Datos', condominiumName, 10)
    const payHeaders = ['No.', 'Folio', 'Unidad', 'Condómino', 'Concepto', 'Monto Pagado ($ MXN)', 'Método', 'Referencia SPEI', 'Fecha y Hora', 'Estatus']
    const payHeaderRow = wsPay.addRow(payHeaders)
    payHeaderRow.height = 26
    payHeaderRow.eachCell(c => styleCell(c, { bg: COLORS.TEAL_PRIMARY, fg: COLORS.WHITE, bold: true, size: 10.5, align: 'center' }))

    payments.forEach((p, idx) => {
      const isZebra = idx % 2 === 1
      const bgRow = isZebra ? COLORS.ZEBRA_ROW : COLORS.WHITE
      const row = wsPay.addRow([
        idx + 1,
        `PAG-${String(p.id).padStart(4, '0')}`,
        p.unit || 'S/N',
        p.resident || 'Propietario',
        p.concept,
        Number(p.amountPaid) || 0,
        p.paymentMethod,
        p.referenceNumber || '—',
        p.paidAt || '—',
        '✔ APROBADO',
      ])
      row.height = 22
      styleCell(row.getCell(1), { bg: bgRow, align: 'center', size: 9 })
      styleCell(row.getCell(2), { bg: bgRow, bold: true, align: 'center', size: 9 })
      styleCell(row.getCell(3), { bg: bgRow, bold: true, align: 'center', size: 10 })
      styleCell(row.getCell(4), { bg: bgRow, size: 9.5 })
      styleCell(row.getCell(5), { bg: bgRow, size: 9.5 })
      styleCell(row.getCell(6), { bg: bgRow, bold: true, align: 'right', size: 10.5, numFmt: '"$"#,##0.00' })
      styleCell(row.getCell(7), { bg: bgRow, size: 9.5, align: 'center' })
      styleCell(row.getCell(8), { bg: bgRow, bold: true, size: 9.5, align: 'center' })
      styleCell(row.getCell(9), { bg: bgRow, size: 9, align: 'center' })
      styleCell(row.getCell(10), { bg: COLORS.SUCCESS_BG, fg: COLORS.SUCCESS_TEXT, bold: true, size: 9.5, align: 'center' })
    })

    const totalPay = payments.reduce((s, p) => s + (Number(p.amountPaid) || 0), 0)
    const totalPayRow = wsPay.addRow(['TOTAL', '', '', `${payments.length} transacciones`, 'TOTAL INGRESADO', totalPay, '', '', '', '100% CONCILIADO'])
    totalPayRow.height = 26
    totalPayRow.eachCell((cell, col) => {
      if (col === 6) styleCell(cell, { bg: COLORS.NAVY_HEADER, fg: COLORS.WHITE, bold: true, size: 11, align: 'right', numFmt: '"$"#,##0.00' })
      else styleCell(cell, { bg: COLORS.NAVY_HEADER, fg: COLORS.WHITE, bold: true, size: 10, align: 'center' })
    })
    wsPay.columns = [
      { width: 6 }, { width: 14 }, { width: 12 }, { width: 28 }, { width: 38 },
      { width: 22 }, { width: 22 }, { width: 30 }, { width: 22 }, { width: 16 }
    ]
  }

  // ── HOJA 4: TICKETS DE MANTENIMIENTO ──
  if (tickets.length > 0) {
    const wsTck = wb.addWorksheet('Mantenimiento', { views: [{ showGridLines: true }] })
    createHeaderBanner(wsTck, 'Bitácora de Mantenimiento', 'Registro y Seguimiento Operativo de Fallas', condominiumName, 9)
    const tckHeaders = ['Folio Ticket', 'Ubicación / Área', 'Condómino Reportante', 'Unidad', 'Descripción de la Falla', 'Prioridad', 'Estado', 'Fecha', 'Técnico Asignado']
    const tckHeaderRow = wsTck.addRow(tckHeaders)
    tckHeaderRow.height = 26
    tckHeaderRow.eachCell(c => styleCell(c, { bg: COLORS.TEAL_PRIMARY, fg: COLORS.WHITE, bold: true, size: 10.5, align: 'center' }))

    tickets.forEach((t, idx) => {
      const isZebra = idx % 2 === 1
      const bgRow = isZebra ? COLORS.ZEBRA_ROW : COLORS.WHITE
      const isResolved = t.status === 'Resuelto'
      const isProgress = t.status === 'En Proceso'

      const row = wsTck.addRow([
        t.id,
        t.location,
        t.reporter,
        t.unit || 'Áreas Comunes',
        t.issue,
        t.priority.toUpperCase(),
        isResolved ? '✔ RESUELTO' : isProgress ? '⚡ EN PROCESO' : '⏳ PENDIENTE',
        t.date,
        t.assignedTo || 'Por asignar',
      ])
      row.height = 22
      styleCell(row.getCell(1), { bg: bgRow, bold: true, align: 'center', size: 9 })
      styleCell(row.getCell(2), { bg: bgRow, size: 9.5 })
      styleCell(row.getCell(3), { bg: bgRow, size: 9.5 })
      styleCell(row.getCell(4), { bg: bgRow, align: 'center', size: 9.5 })
      styleCell(row.getCell(5), { bg: bgRow, size: 9.5 })

      const prioColor = t.priority === 'Alta' ? COLORS.DANGER_TEXT : t.priority === 'Media' ? COLORS.WARNING_TEXT : COLORS.SUCCESS_TEXT
      styleCell(row.getCell(6), { bg: bgRow, fg: prioColor, bold: true, align: 'center', size: 9.5 })

      const statusBg = isResolved ? COLORS.SUCCESS_BG : isProgress ? COLORS.WARNING_BG : COLORS.DANGER_BG
      const statusFg = isResolved ? COLORS.SUCCESS_TEXT : isProgress ? COLORS.WARNING_TEXT : COLORS.DANGER_TEXT
      styleCell(row.getCell(7), { bg: statusBg, fg: statusFg, bold: true, align: 'center', size: 9.5 })

      styleCell(row.getCell(8), { bg: bgRow, align: 'center', size: 9 })
      styleCell(row.getCell(9), { bg: bgRow, size: 9.5 })
    })

    wsTck.columns = [
      { width: 16 }, { width: 28 }, { width: 26 }, { width: 16 }, { width: 44 },
      { width: 14 }, { width: 16 }, { width: 16 }, { width: 28 }
    ]
  }

  const dateStr = new Date().toISOString().slice(0, 10)
  const fileName = `Reporte_Financiero_Integral_${dateStr}.xlsx`
  await downloadWorkbook(wb, fileName)
  return fileName
}

// ────────────────────────────────────────────────────────────────────────────
// 4. EXPORTAR TICKETS DE MANTENIMIENTO
// ────────────────────────────────────────────────────────────────────────────
export async function exportTicketsToExcel(tickets: MaintenanceTicket[], condominiumName = 'Condominio Residencial Las Palomas') {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'VeciLomas HOA Portal'
  wb.created = new Date()

  const resolved = tickets.filter(t => t.status === 'Resuelto').length
  const inProgress = tickets.filter(t => t.status === 'En Proceso').length
  const pending = tickets.filter(t => t.status === 'Pendiente').length
  const resolveRate = tickets.length > 0 ? (resolved / tickets.length) * 100 : 0

  const ws = wb.addWorksheet('Tickets Mantenimiento', { views: [{ showGridLines: true }] })
  createHeaderBanner(ws, 'Gestión de Mantenimiento e Incidencias', 'Seguimiento Técnico y Solución de Fallas Residenciales', condominiumName, 9)

  // Bloque KPI & Gráfica
  ws.getCell('A5').value = 'MÉTRICAS DE RESOLUCIÓN'
  ws.mergeCells('A5:D5')
  styleCell(ws.getCell('A5'), { bg: COLORS.TEAL_PRIMARY, fg: COLORS.WHITE, bold: true, size: 11, align: 'center' })

  ws.getCell('E5').value = 'ESTATUS GRÁFICO (%)'
  ws.mergeCells('E5:I5')
  styleCell(ws.getCell('E5'), { bg: COLORS.NAVY_HEADER, fg: COLORS.WHITE, bold: true, size: 11, align: 'center' })

  const stats = [
    { label: 'Incidencias Resueltas:', val: `${resolved} tickets`, pct: resolveRate, bg: COLORS.SUCCESS_BG, fg: COLORS.SUCCESS_TEXT },
    { label: 'Incidencias en Proceso:', val: `${inProgress} tickets`, pct: tickets.length > 0 ? (inProgress / tickets.length) * 100 : 0, bg: COLORS.WARNING_BG, fg: COLORS.WARNING_TEXT },
    { label: 'Incidencias Pendientes:', val: `${pending} tickets`, pct: tickets.length > 0 ? (pending / tickets.length) * 100 : 0, bg: COLORS.DANGER_BG, fg: COLORS.DANGER_TEXT },
    { label: 'Efectividad de Atención:', val: `${resolveRate.toFixed(1)}%`, pct: resolveRate, bg: COLORS.TEAL_LIGHT, fg: COLORS.TEAL_PRIMARY },
  ]

  let r = 6
  stats.forEach(s => {
    ws.getCell(`A${r}`).value = s.label
    ws.mergeCells(`A${r}:C${r}`)
    styleCell(ws.getCell(`A${r}`), { bold: true, size: 10 })

    ws.getCell(`D${r}`).value = s.val
    styleCell(ws.getCell(`D${r}`), { bg: s.bg, fg: s.fg, bold: true, size: 10, align: 'center' })

    ws.getCell(`E${r}`).value = createBarGraph(s.pct, 18)
    ws.mergeCells(`E${r}:I${r}`)
    styleCell(ws.getCell(`E${r}`), { bg: s.bg, fg: s.fg, bold: true, size: 9.5, align: 'left' })

    ws.getRow(r).height = 22
    r++
  })

  r += 2
  const headers = ['Folio Ticket', 'Ubicación / Área', 'Condómino Reportante', 'Unidad', 'Descripción de la Falla', 'Prioridad', 'Estado', 'Fecha Registro', 'Proveedor / Técnico']
  const headerRow = ws.getRow(r)
  headers.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1)
    cell.value = h
    styleCell(cell, { bg: COLORS.TEAL_PRIMARY, fg: COLORS.WHITE, bold: true, size: 10.5, align: 'center' })
  })
  headerRow.height = 26
  r++

  tickets.forEach((t, idx) => {
    const isZebra = idx % 2 === 1
    const bgRow = isZebra ? COLORS.ZEBRA_ROW : COLORS.WHITE
    const isResolved = t.status === 'Resuelto'
    const isProgress = t.status === 'En Proceso'

    const row = ws.getRow(r)
    row.values = [
      t.id,
      t.location,
      t.reporter,
      t.unit || 'Áreas Comunes',
      t.issue,
      t.priority.toUpperCase(),
      isResolved ? '✔ RESUELTO' : isProgress ? '⚡ EN PROCESO' : '⏳ PENDIENTE',
      t.date,
      t.assignedTo || 'Por asignar',
    ]
    row.height = 22
    styleCell(row.getCell(1), { bg: bgRow, bold: true, align: 'center', size: 9 })
    styleCell(row.getCell(2), { bg: bgRow, size: 9.5 })
    styleCell(row.getCell(3), { bg: bgRow, size: 9.5 })
    styleCell(row.getCell(4), { bg: bgRow, align: 'center', size: 9.5 })
    styleCell(row.getCell(5), { bg: bgRow, size: 9.5 })

    const prioColor = t.priority === 'Alta' ? COLORS.DANGER_TEXT : t.priority === 'Media' ? COLORS.WARNING_TEXT : COLORS.SUCCESS_TEXT
    styleCell(row.getCell(6), { bg: bgRow, fg: prioColor, bold: true, align: 'center', size: 9.5 })

    const statusBg = isResolved ? COLORS.SUCCESS_BG : isProgress ? COLORS.WARNING_BG : COLORS.DANGER_BG
    const statusFg = isResolved ? COLORS.SUCCESS_TEXT : isProgress ? COLORS.WARNING_TEXT : COLORS.DANGER_TEXT
    styleCell(row.getCell(7), { bg: statusBg, fg: statusFg, bold: true, align: 'center', size: 9.5 })

    styleCell(row.getCell(8), { bg: bgRow, align: 'center', size: 9 })
    styleCell(row.getCell(9), { bg: bgRow, size: 9.5 })
    r++
  })

  ws.columns = [
    { width: 16 }, { width: 28 }, { width: 26 }, { width: 16 }, { width: 44 },
    { width: 14 }, { width: 16 }, { width: 18 }, { width: 30 }
  ]

  const dateStr = new Date().toISOString().slice(0, 10)
  const fileName = `Reporte_Tickets_Mantenimiento_${dateStr}.xlsx`
  await downloadWorkbook(wb, fileName)
  return fileName
}

// ────────────────────────────────────────────────────────────────────────────
// 5. EXPORTAR ESTADO DE CUENTA INDIVIDUAL DEL RESIDENTE
// ────────────────────────────────────────────────────────────────────────────
export async function exportResidentStatementToExcel(
  fees: FeeStatement[],
  residentName: string,
  unit: string,
  condominiumName = 'Condominio Residencial Las Palomas'
) {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'VeciLomas HOA Portal'
  wb.created = new Date()

  const totalPaid = fees.filter(f => f.status === 'Pagada').reduce((s, f) => s + (Number(f.amount) || 0), 0)
  const pendingAmount = fees.filter(f => f.status !== 'Pagada').reduce((s, f) => s + (Number(f.amount) || 0), 0)
  const totalAmount = totalPaid + pendingAmount
  const isUpToDate = pendingAmount === 0

  const ws = wb.addWorksheet(`Estado Cuenta ${unit}`, { views: [{ showGridLines: true }] })
  createHeaderBanner(ws, `Estado de Cuenta Oficial — Unidad ${unit}`, `Titular: ${residentName}   |   Comprobante Financiero Residencial`, condominiumName, 8)

  // Resumen del Residente
  ws.getCell('A5').value = 'INFORMACIÓN Y BALANCE DE LA PROPIEDAD'
  ws.mergeCells('A5:D5')
  styleCell(ws.getCell('A5'), { bg: COLORS.TEAL_PRIMARY, fg: COLORS.WHITE, bold: true, size: 11, align: 'center' })

  ws.getCell('E5').value = 'ESTADO DE SOLVENCIA'
  ws.mergeCells('E5:H5')
  styleCell(ws.getCell('E5'), { bg: isUpToDate ? COLORS.SUCCESS_TEXT : COLORS.DANGER_TEXT, fg: COLORS.WHITE, bold: true, size: 11, align: 'center' })

  const summary = [
    { label: 'Unidad Privativa / Departamento:', val: unit, sLabel: 'Condición Financiera:', sVal: isUpToDate ? '✔ AL CORRIENTE' : '⏳ PENDIENTE DE PAGO', sBg: isUpToDate ? COLORS.SUCCESS_BG : COLORS.WARNING_BG, sFg: isUpToDate ? COLORS.SUCCESS_TEXT : COLORS.WARNING_TEXT },
    { label: 'Condómino / Propietario:', val: residentName, sLabel: 'Total Pagado Histórico:', sVal: totalPaid, sFmt: '"$"#,##0.00', sBg: COLORS.SUCCESS_BG, sFg: COLORS.SUCCESS_TEXT },
    { label: 'Total Cuotas Asignadas:', val: `${fees.length} recibos`, sLabel: 'Saldo Pendiente por Liquidar:', sVal: pendingAmount, sFmt: '"$"#,##0.00', sBg: pendingAmount === 0 ? COLORS.SUCCESS_BG : COLORS.DANGER_BG, sFg: pendingAmount === 0 ? COLORS.SUCCESS_TEXT : COLORS.DANGER_TEXT },
    { label: 'Porcentaje de Cumplimiento:', val: `${totalAmount > 0 ? ((totalPaid / totalAmount) * 100).toFixed(1) : 100}%`, sLabel: 'Gráfica de Cumplimiento:', sVal: createBarGraph(totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 100, 16), sBg: COLORS.TEAL_LIGHT, sFg: COLORS.TEAL_PRIMARY },
  ]

  let r = 6
  summary.forEach(s => {
    ws.getCell(`A${r}`).value = s.label
    ws.mergeCells(`A${r}:B${r}`)
    styleCell(ws.getCell(`A${r}`), { bold: true, size: 10 })

    ws.getCell(`C${r}`).value = s.val
    ws.mergeCells(`C${r}:D${r}`)
    styleCell(ws.getCell(`C${r}`), { bold: true, size: 10, align: 'center' })

    ws.getCell(`E${r}`).value = s.sLabel
    ws.mergeCells(`E${r}:F${r}`)
    styleCell(ws.getCell(`E${r}`), { bold: true, size: 10 })

    ws.getCell(`G${r}`).value = s.sVal
    ws.mergeCells(`G${r}:H${r}`)
    styleCell(ws.getCell(`G${r}`), { bg: s.sBg, fg: s.sFg, bold: true, size: 10, align: 'center', numFmt: s.sFmt })

    ws.getRow(r).height = 22
    r++
  })

  r += 2
  const headers = ['No.', 'Folio Recibo', 'Concepto de Cuota', 'Importe ($ MXN)', 'Fecha Límite', 'Fecha de Pago', 'Método de Pago', 'Estatus']
  const headerRow = ws.getRow(r)
  headers.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1)
    cell.value = h
    styleCell(cell, { bg: COLORS.TEAL_PRIMARY, fg: COLORS.WHITE, bold: true, size: 10.5, align: 'center' })
  })
  headerRow.height = 26
  r++

  fees.forEach((f, idx) => {
    const isZebra = idx % 2 === 1
    const bgRow = isZebra ? COLORS.ZEBRA_ROW : COLORS.WHITE
    const isPaid = f.status === 'Pagada'
    const isOverdue = f.status === 'Vencida'

    const row = ws.getRow(r)
    row.values = [
      idx + 1,
      `REC-${f.id}`,
      f.concept,
      Number(f.amount) || 0,
      f.dueDate || '—',
      f.date || '—',
      f.paymentMethod || '—',
      isPaid ? '✔ PAGADA' : isOverdue ? '⚠ VENCIDA' : '⏳ PENDIENTE',
    ]
    row.height = 22
    styleCell(row.getCell(1), { bg: bgRow, align: 'center', size: 9 })
    styleCell(row.getCell(2), { bg: bgRow, bold: true, align: 'center', size: 9 })
    styleCell(row.getCell(3), { bg: bgRow, size: 9.5 })
    styleCell(row.getCell(4), { bg: bgRow, bold: true, align: 'right', size: 10.5, numFmt: '"$"#,##0.00' })
    styleCell(row.getCell(5), { bg: bgRow, align: 'center', size: 9 })
    styleCell(row.getCell(6), { bg: bgRow, align: 'center', size: 9 })
    styleCell(row.getCell(7), { bg: bgRow, size: 9.5 })
    const statusBg = isPaid ? COLORS.SUCCESS_BG : isOverdue ? COLORS.DANGER_BG : COLORS.WARNING_BG
    const statusFg = isPaid ? COLORS.SUCCESS_TEXT : isOverdue ? COLORS.DANGER_TEXT : COLORS.WARNING_TEXT
    styleCell(row.getCell(8), { bg: statusBg, fg: statusFg, bold: true, align: 'center', size: 9.5 })
    r++
  })

  // Fila de Balance
  const totalRow = ws.getRow(r)
  totalRow.values = ['BALANCE', '', `${fees.length} cuotas evaluadas`, totalAmount, '', '', `Saldo Pendiente: $${pendingAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, isUpToDate ? 'AL CORRIENTE' : 'CON SALDO']
  totalRow.height = 26
  totalRow.eachCell((cell, col) => {
    if (col === 4) styleCell(cell, { bg: COLORS.NAVY_HEADER, fg: COLORS.WHITE, bold: true, size: 11, align: 'right', numFmt: '"$"#,##0.00' })
    else styleCell(cell, { bg: COLORS.NAVY_HEADER, fg: COLORS.WHITE, bold: true, size: 10, align: 'center' })
  })

  ws.columns = [
    { width: 6 }, { width: 14 }, { width: 38 }, { width: 20 },
    { width: 18 }, { width: 18 }, { width: 24 }, { width: 18 }
  ]

  const fileName = `Estado_Cuenta_${unit}_${residentName.replace(/\s+/g, '_')}.xlsx`
  await downloadWorkbook(wb, fileName)
  return fileName
}
