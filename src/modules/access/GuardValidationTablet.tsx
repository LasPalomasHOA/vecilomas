import { useState } from 'react'
import type { QRValidationResult } from '@/types/access'
import { useData } from '@/context/DataContext'
import GCard from '@/components/common/Card'
import Btn from '@/components/common/Button'
import Badge from '@/components/common/Badge'
import Ico from '@/components/common/Icons'

export function GuardValidationTablet() {
  const { validateQRCode, checkInVisit, visits, checkOutVisit } = useData()
  const [code, setCode] = useState('')
  const [validationResult, setValidationResult] = useState<QRValidationResult | null>(null)
  const [vehiclePlate, setVehiclePlate] = useState('')
  const [cameraActive, setCameraActive] = useState(false)
  const [successToast, setSuccessToast] = useState<string | null>(null)

  function handleVerify() {
    if (!code.trim()) return
    const result = validateQRCode(code)
    setValidationResult(result)
  }

  function handleConfirmEntry() {
    if (!validationResult || !validationResult.valid || !validationResult.pass) return

    checkInVisit({
      visitor: validationResult.pass.visitor,
      host: validationResult.pass.host,
      unit: validationResult.pass.unit,
      type: validationResult.pass.visitType,
      plate: vehiclePlate || undefined,
    })

    const name = validationResult.pass.visitor
    setSuccessToast(`¡Ingreso registrado exitosamente para ${name}!`)
    setTimeout(() => setSuccessToast(null), 4000)

    setCode('')
    setVehiclePlate('')
    setValidationResult(null)
    setCameraActive(false)
  }

  function simulateQRScan(sampleCode: string) {
    setCode(sampleCode)
    const res = validateQRCode(sampleCode)
    setValidationResult(res)
    setCameraActive(false)
  }

  const activeVisitors = visits.filter(v => v.status === 'En Instalaciones')

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {successToast && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-sm font-bold flex items-center gap-3 animate-fade-in shadow-md">
          <span className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Ico n="check" c="w-5 h-5" />
          </span>
          <div>
            <p className="font-display font-bold text-base">{successToast}</p>
            <p className="text-xs font-normal text-emerald-700">Se ha añadido el registro a la bitácora activa en tiempo real.</p>
          </div>
        </div>
      )}

      {/* Main Tablet Station */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Verification Tablet Viewfinder */}
        <GCard p="p-6 sm:p-7">
          <div className="flex items-center justify-between mb-5 pb-4 border-b border-teal-950/[0.06] flex-wrap sm:flex-nowrap gap-2">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-500/20 to-teal-700/10 border border-teal-500/25 text-teal-800 flex items-center justify-center shrink-0 shadow-[0_2px_8px_rgba(0,128,128,0.15)]">
                <Ico n="camera" c="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-display font-bold text-slate-900 text-base sm:text-lg leading-tight truncate">
                  Caseta de Control — Validación QR
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 truncate">Escaneo de código y confirmación de acceso</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-teal-950 text-teal-200 border border-teal-500/30 whitespace-nowrap shrink-0 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              Caseta Activa
            </span>
          </div>

          {/* Camera Scan Simulation View */}
          <div
            className={`rounded-3xl p-5 sm:p-6 text-center mb-5 border transition-all duration-300 relative overflow-hidden ${
              cameraActive
                ? 'border-teal-400/60 bg-slate-950 text-white shadow-2xl'
                : 'border-dashed border-teal-900/20 bg-slate-50/80 text-slate-700'
            }`}
          >
            {cameraActive ? (
              <div className="py-4 sm:py-6 space-y-4">
                <div
                  className="w-40 h-40 sm:w-48 sm:h-48 mx-auto border-2 border-teal-400 rounded-3xl relative flex items-center justify-center bg-slate-900/70"
                  style={{
                    boxShadow: '0 0 35px rgba(20, 184, 166, 0.35), inset 0 0 25px rgba(20, 184, 166, 0.2)',
                  }}
                >
                  <div className="absolute inset-x-2 top-1/2 h-0.5 bg-teal-300 shadow-[0_0_16px_#2dd4bf] animate-pulse" />
                  <Ico n="qr" c="w-20 h-20 sm:w-24 sm:h-24 text-teal-400/40" />
                </div>
                <p className="text-xs sm:text-sm font-mono text-teal-300 font-bold animate-pulse">
                  [Cámara activa] Detectando código QR...
                </p>
                <div className="flex flex-wrap justify-center gap-2 pt-2">
                  <button
                    onClick={() => simulateQRScan('VCN-LAU-A101-X4F9')}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white transition-all cursor-pointer whitespace-nowrap shadow-[0_4px_12px_rgba(0,128,128,0.3)]"
                  >
                    Simular Pase Válido
                  </button>
                  <button
                    onClick={() => setCameraActive(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/15 text-white hover:bg-white/25 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Cerrar Cámara
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 bg-white text-teal-700 shadow-xs border border-teal-950/[0.08]">
                  <Ico n="camera" c="w-8 h-8" />
                </div>
                <p className="font-display font-bold text-slate-900 text-base">Escáner de Cámara QR</p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Apunta la cámara de la tablet al código digital presentado por el visitante en su teléfono.
                </p>
                <button
                  type="button"
                  onClick={() => setCameraActive(true)}
                  className="mt-4 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-teal-700 to-teal-900 hover:from-teal-600 hover:to-teal-800 transition-all cursor-pointer shadow-[0_4px_14px_rgba(0,128,128,0.25)]"
                >
                  Activar Escáner de Cámara
                </button>
              </div>
            )}
          </div>

          <p className="text-xs text-center text-slate-400 mb-3 font-mono font-medium">
            — O ingresa el código alfanumérico manualmente —
          </p>

          {/* Code input */}
          <div className="flex gap-2.5">
            <input
              value={code}
              onChange={e => {
                setCode(e.target.value)
                setValidationResult(null)
              }}
              onKeyDown={e => e.key === 'Enter' && handleVerify()}
              placeholder="Ej. VCN-LAU-A101-X4F9"
              className="flex-1 px-4 py-2.5 text-sm font-mono font-bold rounded-xl bg-slate-50/90 border border-slate-200/80 focus:bg-white focus:border-teal-600 focus:outline-none placeholder:text-slate-400 uppercase transition-all"
            />
            <Btn onClick={handleVerify} className="px-6 py-2.5 font-bold text-sm shadow-[0_4px_14px_rgba(0,128,128,0.2)]">
              Verificar
            </Btn>
          </div>

          {/* Validation Feedback Result */}
          {validationResult && (
            <div
              className={`mt-5 p-5 rounded-2xl border animate-fade-in ${
                validationResult.valid
                  ? 'bg-gradient-to-br from-teal-50 to-emerald-50/50 border-teal-300 shadow-sm'
                  : 'bg-gradient-to-br from-red-50 to-rose-50/50 border-red-300 shadow-sm'
              }`}
            >
              {validationResult.valid && validationResult.pass ? (
                <div className="space-y-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-700 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-xs">
                      ✓
                    </div>
                    <div>
                      <h4 className="font-display font-extrabold text-teal-950 text-lg leading-tight">
                        ACCESO AUTORIZADO
                      </h4>
                      <p className="text-xs font-semibold text-teal-800 mt-0.5">{validationResult.message}</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white/90 border border-teal-200/80 text-xs space-y-2 shadow-2xs">
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-slate-500 whitespace-nowrap font-medium">Visitante:</span>
                      <span className="font-bold text-slate-900 text-sm truncate">{validationResult.pass.visitor}</span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-slate-500 whitespace-nowrap font-medium">Unidad Destino:</span>
                      <span className="font-display font-extrabold text-teal-800 text-sm whitespace-nowrap">
                        {validationResult.pass.unit} ({validationResult.pass.host})
                      </span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-slate-500 whitespace-nowrap font-medium">Tipo de Acceso:</span>
                      <Badge text={validationResult.pass.visitType} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5 text-slate-700 whitespace-nowrap">
                      Placas de Vehículo (Opcional):
                    </label>
                    <input
                      value={vehiclePlate}
                      onChange={e => setVehiclePlate(e.target.value)}
                      placeholder="Ej. MXC-9921"
                      className="w-full px-3.5 py-2 text-sm rounded-xl font-mono font-bold bg-white border border-slate-200 focus:border-teal-500 focus:outline-none text-slate-900"
                    />
                  </div>

                  <button
                    onClick={handleConfirmEntry}
                    className="w-full py-3 rounded-xl text-sm font-extrabold text-white bg-gradient-to-r from-teal-700 to-teal-900 hover:from-teal-600 hover:to-teal-800 transition-all shadow-[0_4px_16px_rgba(0,128,128,0.25)] cursor-pointer whitespace-nowrap"
                  >
                    Confirmar y Registrar Entrada
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-xs">
                      ✗
                    </div>
                    <div>
                      <h4 className="font-display font-extrabold text-red-950 text-lg leading-tight whitespace-nowrap">
                        ACCESO DENEGADO
                      </h4>
                      <p className="text-xs font-semibold text-red-700">{validationResult.message}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-700 bg-white/90 p-3 rounded-xl border border-red-200 leading-relaxed font-medium">
                    El código no está registrado o se encuentra vencido. Solicita al visitante comunicarse con el anfitrión.
                  </p>
                </div>
              )}
            </div>
          )}
        </GCard>

        {/* Live In-Facility Stream */}
        <GCard p="p-6 sm:p-7" className="flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 pb-4 border-b border-teal-950/[0.06] gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <h3 className="font-display font-bold text-slate-900 text-base sm:text-lg leading-tight truncate">
                    Visitas Activas en Instalaciones
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 truncate">Control de flujo y checkout en tiempo real</p>
              </div>
              <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 whitespace-nowrap self-start sm:self-auto shrink-0 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                {activeVisitors.length} activos
              </span>
            </div>

            <div className="space-y-3">
              {activeVisitors.map(v => (
                <div
                  key={v.id}
                  className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/70 shadow-xs flex items-center justify-between gap-3 hover:bg-white hover:border-teal-200 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-800 flex items-center justify-center font-display font-extrabold text-xs shrink-0 border border-teal-200">
                      {v.unit}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-900 text-sm truncate">{v.visitor}</p>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        {v.host} · <span className="font-semibold text-slate-700">{v.entry} hrs</span>
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => checkOutVisit(v.id)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-slate-300 text-slate-800 hover:bg-slate-100 hover:border-slate-400 transition-colors shrink-0 shadow-2xs cursor-pointer whitespace-nowrap"
                  >
                    Registrar Salida
                  </button>
                </div>
              ))}

              {activeVisitors.length === 0 && (
                <div className="py-16 text-center text-slate-400 text-xs font-medium">
                  No hay visitantes dentro de las instalaciones en este momento.
                </div>
              )}
            </div>
          </div>
        </GCard>
      </div>
    </div>
  )
}
export default GuardValidationTablet
