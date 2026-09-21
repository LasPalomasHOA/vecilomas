import QRCode from 'qrcode'
import type { AccessPass } from '@/types/access'

/**
 * Dibuja un rectángulo con esquinas redondeadas
 */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number | { tl?: number; tr?: number; br?: number; bl?: number }
) {
  let tl = 0, tr = 0, br = 0, bl = 0
  if (typeof radius === 'number') {
    tl = tr = br = bl = radius
  } else {
    tl = radius.tl || 0
    tr = radius.tr || 0
    br = radius.br || 0
    bl = radius.bl || 0
  }

  ctx.beginPath()
  ctx.moveTo(x + tl, y)
  ctx.lineTo(x + width - tr, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + tr)
  ctx.lineTo(x + width, y + height - br)
  ctx.quadraticCurveTo(x + width, y + height, x + width - br, y + height)
  ctx.lineTo(x + bl, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - bl)
  ctx.lineTo(x, y + tl)
  ctx.quadraticCurveTo(x, y, x + tl, y)
  ctx.closePath()
}

/**
 * Genera un Canvas HTML con el diseño premium tipo Boarding Pass VIP del pase QR
 */
export async function generateQRPassCanvas(pass: AccessPass): Promise<HTMLCanvasElement> {
  const width = 800
  const height = 1100
  const scale = 2 // Alta resolución (Retina 2x = 1600x2200)

  const canvas = document.createElement('canvas')
  canvas.width = width * scale
  canvas.height = height * scale
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No se pudo inicializar el contexto 2D.')

  ctx.scale(scale, scale)

  // 1. Fondo exterior general
  ctx.fillStyle = '#f1f5f9'
  ctx.fillRect(0, 0, width, height)

  const cardMargin = 28
  const cardWidth = width - cardMargin * 2
  const cardHeight = height - cardMargin * 2
  const cardX = cardMargin
  const cardY = cardMargin
  const cardRadius = 36

  // Sombra de la tarjeta principal
  ctx.save()
  ctx.shadowColor = 'rgba(0, 51, 51, 0.18)'
  ctx.shadowBlur = 35
  ctx.shadowOffsetY = 14
  roundRect(ctx, cardX, cardY, cardWidth, cardHeight, cardRadius)
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  ctx.restore()

  // Recortar con la silueta de la tarjeta
  ctx.save()
  roundRect(ctx, cardX, cardY, cardWidth, cardHeight, cardRadius)
  ctx.clip()

  // ── SECCIÓN SUPERIOR: Header VIP Gradiente ──────────────────────────────────
  const headerHeight = 270
  const headerGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardWidth, cardY + headerHeight)
  headerGrad.addColorStop(0, '#002525')
  headerGrad.addColorStop(0.5, '#004747')
  headerGrad.addColorStop(1, '#007c7c')
  ctx.fillStyle = headerGrad
  ctx.fillRect(cardX, cardY, cardWidth, headerHeight)

  // Círculo decorativo difuso en esquina
  ctx.save()
  const glow = ctx.createRadialGradient(cardX + cardWidth - 40, cardY + 20, 10, cardX + cardWidth - 40, cardY + 20, 180)
  glow.addColorStop(0, 'rgba(94, 234, 212, 0.35)')
  glow.addColorStop(1, 'transparent')
  ctx.fillStyle = glow
  ctx.beginPath()
  ctx.arc(cardX + cardWidth - 40, cardY + 20, 180, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  // Texto: Subtítulo VIP
  ctx.fillStyle = '#5eead4'
  ctx.font = 'bold 13px system-ui, -apple-system, sans-serif'
  ctx.fillText('✦ PASE DE ACCESO DIGITAL VIP', cardX + 36, cardY + 54)

  // Texto: Nombre del Residencial
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 30px system-ui, -apple-system, sans-serif'
  ctx.fillText('Las Palomas Residencial', cardX + 36, cardY + 96)

  // Badge Tipo de Visita (Top Right)
  const badgeText = (pass.visitType || 'VISITA').toUpperCase()
  ctx.font = 'bold 12px system-ui, -apple-system, sans-serif'
  const badgeWidth = ctx.measureText(badgeText).width + 28
  const badgeHeight = 30
  const badgeX = cardX + cardWidth - 36 - badgeWidth
  const badgeY = cardY + 44

  ctx.fillStyle = 'rgba(255, 255, 255, 0.18)'
  roundRect(ctx, badgeX, badgeY, badgeWidth, badgeHeight, 15)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
  ctx.lineWidth = 1
  roundRect(ctx, badgeX, badgeY, badgeWidth, badgeHeight, 15)
  ctx.stroke()

  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'center'
  ctx.fillText(badgeText, badgeX + badgeWidth / 2, badgeY + 20)
  ctx.textAlign = 'left'

  // Línea divisoria en cabecera
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(cardX + 36, cardY + 130)
  ctx.lineTo(cardX + cardWidth - 36, cardY + 130)
  ctx.stroke()

  // Fila de datos en el Header: Invitado y Destino
  // Columna 1: Invitado
  ctx.fillStyle = 'rgba(204, 251, 241, 0.8)'
  ctx.font = 'bold 12px system-ui, -apple-system, sans-serif'
  ctx.fillText('INVITADO:', cardX + 36, cardY + 164)
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 22px system-ui, -apple-system, sans-serif'
  ctx.fillText(pass.visitor || 'Invitado', cardX + 36, cardY + 196)

  // Columna 2: Destino
  ctx.textAlign = 'right'
  ctx.fillStyle = 'rgba(204, 251, 241, 0.8)'
  ctx.font = 'bold 12px system-ui, -apple-system, sans-serif'
  ctx.fillText('DESTINO:', cardX + cardWidth - 36, cardY + 164)
  ctx.fillStyle = '#5eead4'
  ctx.font = 'bold 22px system-ui, -apple-system, sans-serif'
  ctx.fillText(`Unidad ${pass.unit || 'S/N'}`, cardX + cardWidth - 36, cardY + 196)

  if (pass.host) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
    ctx.font = '13px system-ui, -apple-system, sans-serif'
    ctx.fillText(`Anfitrión: ${pass.host}`, cardX + cardWidth - 36, cardY + 224)
  }
  ctx.textAlign = 'left'

  // ── SECCIÓN CENTRAL: Fondo y Corte Perforado ──────────────────────────────
  const bodyY = cardY + headerHeight
  const bodyHeight = cardHeight - headerHeight
  ctx.fillStyle = '#f8fafc'
  ctx.fillRect(cardX, bodyY, cardWidth, bodyHeight)

  // Línea punteada de separación
  ctx.save()
  ctx.setLineDash([8, 6])
  ctx.strokeStyle = '#cbd5e1'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(cardX + 24, bodyY)
  ctx.lineTo(cardX + cardWidth - 24, bodyY)
  ctx.stroke()
  ctx.restore()

  // Muescas semicirculares de boleto en los bordes izquierdo y derecho
  const notchRadius = 16
  ctx.fillStyle = '#f1f5f9'
  ctx.beginPath()
  ctx.arc(cardX, bodyY, notchRadius, -Math.PI / 2, Math.PI / 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(cardX + cardWidth, bodyY, notchRadius, Math.PI / 2, (Math.PI * 3) / 2)
  ctx.fill()

  // ── CÓDIGO QR HD EN EL CENTRO ──────────────────────────────────────────────
  const qrSize = 340
  const qrBoxX = cardX + (cardWidth - qrSize) / 2
  const qrBoxY = bodyY + 45

  // Contenedor blanco con sombra para el QR
  ctx.save()
  ctx.shadowColor = 'rgba(0, 51, 51, 0.12)'
  ctx.shadowBlur = 24
  ctx.shadowOffsetY = 8
  ctx.fillStyle = '#ffffff'
  roundRect(ctx, qrBoxX - 22, qrBoxY - 22, qrSize + 44, qrSize + 44, 28)
  ctx.fill()
  ctx.restore()

  ctx.strokeStyle = 'rgba(0, 77, 77, 0.1)'
  ctx.lineWidth = 1.5
  roundRect(ctx, qrBoxX - 22, qrBoxY - 22, qrSize + 44, qrSize + 44, 28)
  ctx.stroke()

  // Generar imagen del QR Code real usando la librería QRCode
  try {
    const qrDataUrl = await QRCode.toDataURL(pass.code || 'VECILOMAS-PASS', {
      errorCorrectionLevel: 'H',
      margin: 1,
      color: {
        dark: '#003333',
        light: '#ffffff',
      },
      width: qrSize,
    })

    const qrImg = new Image()
    await new Promise((res, rej) => {
      qrImg.onload = res
      qrImg.onerror = rej
      qrImg.src = qrDataUrl
    })

    ctx.drawImage(qrImg, qrBoxX, qrBoxY, qrSize, qrSize)
  } catch (err) {
    console.error('Error dibujando QR en canvas:', err)
  }

  // ── CÓDIGO ALFANUMÉRICO (PILL CHIP) ────────────────────────────────────────
  const chipY = qrBoxY + qrSize + 48
  const chipText = pass.code || 'VCN-PASS-001'
  ctx.font = 'bold 18px monospace'
  const chipTextWidth = ctx.measureText(chipText).width + 56
  const chipX = cardX + (cardWidth - chipTextWidth) / 2
  const chipHeight = 44

  ctx.fillStyle = '#ffffff'
  roundRect(ctx, chipX, chipY, chipTextWidth, chipHeight, 14)
  ctx.fill()
  ctx.strokeStyle = 'rgba(0, 128, 128, 0.3)'
  ctx.lineWidth = 1.5
  roundRect(ctx, chipX, chipY, chipTextWidth, chipHeight, 14)
  ctx.stroke()

  ctx.fillStyle = '#004c4c'
  ctx.textAlign = 'center'
  ctx.fillText(`🔑 ${chipText}`, cardX + cardWidth / 2, chipY + 28)

  // ── VIGENCIA Y FECHA / HORA ────────────────────────────────────────────────
  const validY = chipY + chipHeight + 38
  ctx.fillStyle = '#475569'
  ctx.font = '15px system-ui, -apple-system, sans-serif'
  ctx.fillText('Válido para el:', cardX + cardWidth / 2, validY)

  ctx.fillStyle = '#0f172a'
  ctx.font = 'bold 18px system-ui, -apple-system, sans-serif'
  ctx.fillText(`${pass.validDate} a las ${pass.validTime} hrs`, cardX + cardWidth / 2, validY + 28)

  // ── FOOTER DE SEGURIDAD ────────────────────────────────────────────────────
  const footerY = cardY + cardHeight - 72
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.06)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(cardX + 36, footerY - 18)
  ctx.lineTo(cardX + cardWidth - 36, footerY - 18)
  ctx.stroke()

  ctx.fillStyle = '#64748b'
  ctx.font = '12px system-ui, -apple-system, sans-serif'
  ctx.fillText('Presenta este código QR al guardia en la caseta principal al llegar.', cardX + cardWidth / 2, footerY + 6)
  ctx.fillStyle = '#94a3b8'
  ctx.font = '11px monospace'
  ctx.fillText('VeciLomas Residential Access • Sistema Verificado', cardX + cardWidth / 2, footerY + 26)

  ctx.restore()
  return canvas
}

/**
 * Obtiene el Pase QR como DataURL (PNG)
 */
export async function generateQRPassDataURL(pass: AccessPass): Promise<string> {
  const canvas = await generateQRPassCanvas(pass)
  return canvas.toDataURL('image/png')
}

/**
 * Obtiene el Pase QR como Blob binario
 */
export async function generateQRPassBlob(pass: AccessPass): Promise<Blob> {
  const canvas = await generateQRPassCanvas(pass)
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) resolve(blob)
      else reject(new Error('No se pudo generar el blob de la imagen.'))
    }, 'image/png')
  })
}

/**
 * Descarga directamente la imagen del pase QR
 */
export async function downloadQRPassImage(pass: AccessPass) {
  const dataUrl = await generateQRPassDataURL(pass)
  const safeName = (pass.visitor || 'invitado').toLowerCase().replace(/\s+/g, '-')
  const link = document.createElement('a')
  link.download = `Pase-Acceso-${safeName}.png`
  link.href = dataUrl
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Comparte el Pase QR por WhatsApp mediante Imagen Directa
 * - En móviles y navegadores compatibles: Usa Web Share API con el archivo PNG para abrir WhatsApp directamente con la imagen.
 * - En escritorio: Copia la imagen al portapapeles, inicia la descarga del PNG y abre WhatsApp Web para pegar (Ctrl+V) al instante.
 */
export async function shareQRPassToWhatsApp(pass: AccessPass): Promise<{
  shared: boolean
  method: 'native' | 'clipboard' | 'download'
  message?: string
}> {
  const blob = await generateQRPassBlob(pass)
  const safeName = (pass.visitor || 'invitado').toLowerCase().replace(/\s+/g, '-')
  const file = new File([blob], `Pase-Acceso-${safeName}.png`, { type: 'image/png' })

  const companionText = `¡Hola ${pass.visitor}! Te comparto tu Pase de Acceso Digital VIP para Las Palomas Residencial.\n\n🔑 Código: ${pass.code}\n🏠 Unidad: ${pass.unit} (${pass.host})\n📅 Vigencia: ${pass.validDate} a las ${pass.validTime} hrs\n\nPor favor muestra el código QR adjunto en la caseta principal al llegar.`

  // 1. Intento con Web Share API (WhatsApp Móvil / Navegadores con soporte de archivo)
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        title: `Pase de Acceso - ${pass.visitor}`,
        text: companionText,
        files: [file],
      })
      return { shared: true, method: 'native' }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { shared: false, method: 'native', message: 'Compartir cancelado' }
      }
      console.warn('Fallo al compartir nativo con archivo:', err)
    }
  }

  // 2. Fallback para WhatsApp Web / Escritorio:
  // - Copiar imagen al portapapeles (para simplemente dar Ctrl+V en WhatsApp)
  // - Descargar automáticamente el archivo
  // - Abrir WhatsApp Web con el texto
  let clipboardCopied = false
  try {
    if (navigator.clipboard && window.ClipboardItem) {
      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': blob,
        }),
      ])
      clipboardCopied = true
    }
  } catch (err) {
    console.warn('No se pudo copiar imagen directamente al portapapeles:', err)
  }

  // Descarga el archivo de imagen automáticamente
  await downloadQRPassImage(pass)

  // Abrir WhatsApp con el mensaje de acompañamiento
  const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(companionText)}`
  window.open(waUrl, '_blank')

  return {
    shared: true,
    method: clipboardCopied ? 'clipboard' : 'download',
    message: clipboardCopied
      ? '¡Imagen del pase copiada al portapapeles y descargada! En WhatsApp solo presiona Pegar (Ctrl + V).'
      : '¡Imagen del pase descargada! Adjúntala en tu conversación de WhatsApp.',
  }
}
