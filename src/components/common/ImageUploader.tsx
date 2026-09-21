import { useState, useRef, type DragEvent, type ChangeEvent } from 'react'
import Ico from '@/components/common/Icons'
import { optimizeImageToBase64, formatBytes, type OptimizedImageResult } from '@/utils/imageOptimizer'

interface ImageUploaderProps {
  value: string
  onChange: (base64OrUrl: string) => void
  label?: string
  helperText?: string
  required?: boolean
  maxWidth?: number
  maxHeight?: number
  quality?: number
}

export function ImageUploader({
  value,
  onChange,
  label = 'Imagen Ilustrativa',
  helperText = 'Sube una foto desde tu dispositivo; se optimizará automáticamente a formato ligero.',
  required = false,
  maxWidth = 1200,
  maxHeight = 800,
  quality = 0.82,
}: ImageUploaderProps) {
  const [mode, setMode] = useState<'upload' | 'url'>(value && !value.startsWith('data:') ? 'url' : 'upload')
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [stats, setStats] = useState<OptimizedImageResult | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function processFile(file: File) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Por favor selecciona un archivo de imagen válido (JPG, PNG, WEBP).')
      return
    }

    setErrorMessage(null)
    setIsProcessing(true)

    try {
      const result = await optimizeImageToBase64(file, {
        maxWidth,
        maxHeight,
        quality,
        preferredFormat: 'image/webp',
      })
      setStats(result)
      onChange(result.base64)
    } catch (err: any) {
      console.error('Error optimizing image:', err)
      setErrorMessage(err.message || 'Error al procesar y optimizar la imagen.')
    } finally {
      setIsProcessing(false)
    }
  }

  function handleFileSelect(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      processFile(file)
    }
    // Reset file input value to allow selecting the same file again if needed
    if (e.target) e.target.value = ''
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      processFile(file)
    }
  }

  function handleClear() {
    onChange('')
    setStats(null)
    setErrorMessage(null)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        
        {/* Switch between Upload Base64 and URL */}
        <div className="flex items-center gap-1 text-[11px] bg-slate-100 p-0.5 rounded-lg">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
              mode === 'upload'
                ? 'bg-white text-teal-800 shadow-2xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Subir Archivo (Base64)
          </button>
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
              mode === 'url'
                ? 'bg-white text-teal-800 shadow-2xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            URL Externa
          </button>
        </div>
      </div>

      {mode === 'upload' ? (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/webp, image/jpg"
            onChange={handleFileSelect}
            className="hidden"
          />

          {value ? (
            /* Image Preview Card */
            <div className="relative rounded-2xl border border-teal-500/30 bg-teal-950/5 p-3 overflow-hidden animate-fade-in group">
              <div className="flex flex-col sm:flex-row gap-3 items-center">
                <div className="w-full sm:w-36 h-28 rounded-xl overflow-hidden bg-slate-900 shrink-0 relative shadow-inner">
                  <img
                    src={value}
                    alt="Vista previa de imagen"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                  <span className="absolute bottom-1.5 left-1.5 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/60 text-teal-300 backdrop-blur-xs">
                    {value.startsWith('data:') ? 'BASE64' : 'WEB'}
                  </span>
                </div>

                <div className="flex-1 min-w-0 space-y-1.5 w-full text-left">
                  <div className="flex items-center gap-1.5 text-teal-800 font-bold text-xs">
                    <Ico n="check" c="w-4 h-4 text-teal-600" />
                    <span>Imagen optimizada y cargada</span>
                  </div>

                  {stats ? (
                    <div className="space-y-1 text-[11px] text-slate-600 bg-white/80 p-2 rounded-xl border border-teal-100">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-medium">Resolución:</span>
                        <span className="font-mono font-bold text-slate-700">{stats.width} × {stats.height} px</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-medium">Tamaño optimizado:</span>
                        <span className="font-mono font-bold text-teal-700 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200/50">
                          {formatBytes(stats.optimizedSize)}
                        </span>
                      </div>
                      {stats.savingsPercent > 0 && (
                        <div className="flex justify-between items-center text-[10px] text-emerald-700 font-semibold">
                          <span>Ahorro de espacio:</span>
                          <span>⚡ {stats.savingsPercent}% menor ({formatBytes(stats.originalSize)} orig.)</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500 leading-tight">
                      La imagen se encuentra lista para guardarse directamente en el sistema.
                    </p>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs font-bold px-3 py-1.5 rounded-xl bg-teal-700 text-white hover:bg-teal-800 transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5"
                    >
                      <Ico n="upload" c="w-3.5 h-3.5" />
                      Cambiar foto
                    </button>
                    <button
                      type="button"
                      onClick={handleClear}
                      className="text-xs font-semibold px-2.5 py-1.5 rounded-xl text-red-600 hover:bg-red-50 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Ico n="trash" c="w-3.5 h-3.5" />
                      Quitar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Upload Dropzone */
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-2 ${
                isDragging
                  ? 'border-teal-500 bg-teal-50/70 scale-[1.01] shadow-md'
                  : 'border-slate-300/80 bg-slate-50/60 hover:bg-teal-50/30 hover:border-teal-400'
              }`}
            >
              {isProcessing ? (
                <div className="py-3 flex flex-col items-center gap-2">
                  <div className="w-8 h-8 rounded-full border-3 border-teal-200 border-t-teal-700 animate-spin" />
                  <p className="text-xs font-bold text-teal-800">Comprimiendo y optimizando imagen...</p>
                  <p className="text-[10px] text-slate-500">Ajustando resolución y convirtiendo a Base64 WebP</p>
                </div>
              ) : (
                <>
                  <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center shadow-2xs">
                    <Ico n="upload" c="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      Arrastra y suelta tu imagen aquí, o{' '}
                      <span className="text-teal-700 underline underline-offset-2">explora tus archivos</span>
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      JPG, PNG o WebP. Se optimizará a resolución HD compacta ({maxWidth}x{maxHeight}px máx.)
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Manual URL input fallback */
        <div className="space-y-2">
          <input
            type="url"
            value={value}
            onChange={e => {
              onChange(e.target.value)
              setStats(null)
            }}
            placeholder="https://images.unsplash.com/..."
            className="w-full px-3.5 py-2.5 text-xs font-mono rounded-xl bg-slate-50/80 border border-slate-200/80 focus:bg-white focus:border-teal-500 focus:outline-none transition-all"
          />
          {value && (
            <div className="relative rounded-xl overflow-hidden h-32 bg-slate-900 border border-slate-200">
              <img
                src={value}
                alt="Vista previa URL"
                className="w-full h-full object-cover"
                onError={() => setErrorMessage('No se pudo cargar la imagen desde la URL especificada.')}
              />
              <span className="absolute bottom-2 left-2 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-black/60 text-white backdrop-blur-xs">
                Vista previa externa
              </span>
            </div>
          )}
        </div>
      )}

      {errorMessage && (
        <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
          <Ico n="info" c="w-4 h-4 text-red-500 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {helperText && !errorMessage && !stats && (
        <p className="text-[11px] text-slate-400">{helperText}</p>
      )}
    </div>
  )
}
export default ImageUploader
