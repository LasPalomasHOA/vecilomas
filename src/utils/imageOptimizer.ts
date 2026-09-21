export interface OptimizeImageOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  preferredFormat?: 'image/webp' | 'image/jpeg'
}

export interface OptimizedImageResult {
  base64: string
  originalSize: number
  optimizedSize: number
  savingsPercent: number
  width: number
  height: number
  mimeType: string
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

/**
 * Optimiza y redimensiona una imagen en el navegador del cliente mediante HTML5 Canvas,
 * convirtiéndola a una cadena Base64 compacta (WebP o JPEG).
 */
export async function optimizeImageToBase64(
  file: File,
  options: OptimizeImageOptions = {}
): Promise<OptimizedImageResult> {
  const {
    maxWidth = 1200,
    maxHeight = 800,
    quality = 0.82,
    preferredFormat = 'image/webp',
  } = options

  if (!file.type.startsWith('image/')) {
    throw new Error('El archivo seleccionado no es una imagen válida.')
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onerror = () => reject(new Error('Error al leer el archivo de imagen.'))

    reader.onload = (e) => {
      const img = new Image()
      img.onerror = () => reject(new Error('Error al decodificar la imagen.'))

      img.onload = () => {
        let width = img.width
        let height = img.height

        // Calcular nuevas dimensiones manteniendo la relación de aspecto
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }

        // Crear canvas para el reescalado
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d', { alpha: preferredFormat === 'image/webp' })
        if (!ctx) {
          return reject(new Error('No se pudo inicializar el contexto de canvas 2D.'))
        }

        // Suavizado de imagen de alta calidad
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'

        // Si es JPEG y no tiene transparencia, pintar fondo blanco por defecto
        if (preferredFormat === 'image/jpeg') {
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(0, 0, width, height)
        }

        ctx.drawImage(img, 0, 0, width, height)

        // Intentar exportar a WebP, si no es soportado el navegador hace fallback a PNG o JPEG
        let base64 = canvas.toDataURL(preferredFormat, quality)
        let mimeType = preferredFormat

        // Si el navegador no soportó WebP y devolvió PNG, convertimos explícitamente a JPEG
        if (preferredFormat === 'image/webp' && !base64.startsWith('data:image/webp')) {
          base64 = canvas.toDataURL('image/jpeg', quality)
          mimeType = 'image/jpeg'
        }

        // Calcular tamaño aproximado del base64 en bytes
        const base64Data = base64.split(',')[1] || ''
        const optimizedBytes = Math.round((base64Data.length * 3) / 4)
        const originalBytes = file.size
        const savings = Math.max(0, Math.round((1 - optimizedBytes / originalBytes) * 100))

        resolve({
          base64,
          originalSize: originalBytes,
          optimizedSize: optimizedBytes,
          savingsPercent: savings,
          width,
          height,
          mimeType,
        })
      }

      img.src = e.target?.result as string
    }

    reader.readAsDataURL(file)
  })
}
