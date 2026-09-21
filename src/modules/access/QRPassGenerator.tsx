import { useState } from 'react'
import type { VisitType, AccessPass } from '@/types/access'
import { useData } from '@/context/DataContext'
import GCard from '@/components/common/Card'
import Btn from '@/components/common/Button'
import QRVisual from '@/components/common/QRVisual'
import Ico from '@/components/common/Icons'

interface QRPassGeneratorProps {
  defaultUnit?: string
  defaultHost?: string
  isResidentView?: boolean
}

export function QRPassGenerator({
  defaultUnit = '',
  defaultHost = '',
  isResidentView = false,
}: QRPassGeneratorProps) {
  const { residents, generateAccessPass } = useData()

  const todayStr = new Date().toISOString().split('T')[0]
  const currentHour = new Date().getHours()
  const defaultTime = `${String(Math.min(23, currentHour + 2)).padStart(2, '0')}:00`

  const [form, setForm] = useState({
    visitor: '',
    unit: defaultUnit || (residents[0]?.unit || 'A-101'),
    host: defaultHost || (residents[0]?.name || 'Carlos Mendoza Ruiz'),
    date: todayStr,
    time: defaultTime,
    type: 'Visita' as VisitType,
  })

  const [createdPass, setCreatedPass] = useState<AccessPass | null>(null)
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null)

  function applyPreset(presetType: 'delivery' | 'family' | 'service') {
    const now = new Date()
    const dStr = now.toISOString().split('T')[0]

    if (presetType === 'delivery') {
      const hStr = `${String(Math.min(23, now.getHours() + 2)).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      setForm(f => ({
        ...f,
        visitor: 'Repartidor / Paquetería',
        type: 'Repartidor',
        date: dStr,
        time: hStr,
      }))
    } else if (presetType === 'family') {
      setForm(f => ({
        ...f,
        visitor: 'Visita Familiar',
        type: 'Familiar',
        date: dStr,
        time: '23:59',
      }))
    } else if (presetType === 'service') {
      setForm(f => ({
        ...f,
        visitor: 'Técnico de Mantenimiento',
        type: 'Técnico',
        date: dStr,
        time: '18:00',
      }))
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.visitor) return

    const newPass = generateAccessPass({
      visitor: form.visitor,
      host: form.host,
      unit: form.unit,
      date: form.date,
      time: form.time,
      type: form.type,
    })

    setCreatedPass(newPass)
  }

  function handleShareWhatsApp() {
    if (!createdPass) return
    const text = `¡Hola ${createdPass.visitor}! Te comparto tu Pase de Acceso Digital para Condominios Las Palomas:\n\nCódigo de Caseta: ${createdPass.code}\nUnidad: ${createdPass.unit} (${createdPass.host})\nVigencia: ${createdPass.validDate} a las ${createdPass.validTime} hrs\n\nPor favor muestra este código al oficial de caseta al llegar.`
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }

  function handleCopyCode() {
    if (!createdPass) return
    navigator.clipboard.writeText(createdPass.code)
    setCopyFeedback('¡Código copiado al portapapeles!')
    setTimeout(() => setCopyFeedback(null), 3000)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Form Card */}
      <GCard p="p-6 sm:p-7">
        <div className="mb-5 pb-4 border-b border-teal-950/[0.06] flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center shrink-0 shadow-xs">
            <Ico n="qr" c="w-5 h-5 text-teal-700" />
          </div>
          <div>
            <h3 className="font-display font-bold text-slate-900 text-lg leading-tight">
              Crear Pase de Acceso Digital
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Genera una clave de acceso rápido para visitantes, familiares y repartidores.
            </p>
          </div>
        </div>

        {/* 1-Click Fast Presets */}
        <div className="mb-5">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Plantillas Rápidas (1-Clic)</p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => applyPreset('delivery')}
              className="p-2.5 rounded-xl border border-teal-200 bg-teal-50/70 hover:bg-teal-100/70 text-left transition-all cursor-pointer group"
            >
              <p className="text-xs font-bold text-teal-950 inline-flex items-center gap-1.5">
                <Ico n="truck" c="w-3.5 h-3.5 text-teal-700" />
                Repartidor
              </p>
              <p className="text-[10px] text-teal-700 mt-0.5">Vigencia 2 hrs</p>
            </button>
            <button
              type="button"
              onClick={() => applyPreset('family')}
              className="p-2.5 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100/70 text-left transition-all cursor-pointer group"
            >
              <p className="text-xs font-bold text-indigo-950 inline-flex items-center gap-1.5">
                <Ico n="car" c="w-3.5 h-3.5 text-indigo-700" />
                Familiar
              </p>
              <p className="text-[10px] text-indigo-700 mt-0.5">Todo el día</p>
            </button>
            <button
              type="button"
              onClick={() => applyPreset('service')}
              className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/70 hover:bg-amber-100/70 text-left transition-all cursor-pointer group"
            >
              <p className="text-xs font-bold text-amber-950 inline-flex items-center gap-1.5">
                <Ico n="tool" c="w-3.5 h-3.5 text-amber-700" />
                Técnico
              </p>
              <p className="text-[10px] text-amber-700 mt-0.5">Jornada 8 hrs</p>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-700">
              Nombre Completo del Visitante
            </label>
            <input
              required
              value={form.visitor}
              onChange={e => setForm(f => ({ ...f, visitor: e.target.value }))}
              placeholder="Ej. Laura Gómez Pérez"
              className="w-full px-4 py-2.5 text-sm rounded-xl bg-slate-50/90 border border-slate-200/80 focus:bg-white focus:border-teal-600 focus:outline-none transition-all font-medium text-slate-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-700">
                Unidad Destino
              </label>
              {isResidentView ? (
                <input
                  disabled
                  value={form.unit}
                  className="w-full px-4 py-2.5 text-sm rounded-xl font-display font-extrabold bg-slate-100 text-slate-800 border border-slate-200"
                />
              ) : (
                <select
                  value={form.unit}
                  onChange={e => {
                    const u = e.target.value
                    const res = residents.find(r => r.unit === u)
                    setForm(f => ({ ...f, unit: u, host: res ? res.name : f.host }))
                  }}
                  className="w-full px-4 py-2.5 text-sm rounded-xl bg-slate-50/90 border border-slate-200/80 focus:bg-white focus:border-teal-600 focus:outline-none transition-all font-medium text-slate-800"
                >
                  {residents.map(r => (
                    <option key={r.id} value={r.unit}>
                      {r.unit} — {r.name.split(' ')[0]}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-700">
                Tipo de Visita
              </label>
              <select
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value as VisitType }))}
                className="w-full px-4 py-2.5 text-sm rounded-xl bg-slate-50/90 border border-slate-200/80 focus:bg-white focus:border-teal-600 focus:outline-none transition-all font-medium text-slate-800"
              >
                <option value="Visita">Visita General</option>
                <option value="Familiar">Familiar</option>
                <option value="Repartidor">Repartidor (Delivery)</option>
                <option value="Técnico">Servicio Técnico</option>
                <option value="Proveedor">Proveedor / Mudanza</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-700">
                Fecha de Vigencia
              </label>
              <input
                required
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full px-4 py-2.5 text-sm rounded-xl bg-slate-50/90 border border-slate-200/80 focus:bg-white focus:border-teal-600 focus:outline-none transition-all font-medium text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-700">
                Hora Estimada
              </label>
              <input
                required
                type="time"
                value={form.time}
                onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                className="w-full px-4 py-2.5 text-sm rounded-xl bg-slate-50/90 border border-slate-200/80 focus:bg-white focus:border-teal-600 focus:outline-none transition-all font-medium text-slate-800"
              />
            </div>
          </div>

          <div className="pt-2">
            <Btn type="submit" className="w-full py-3 font-bold shadow-sm">
              <Ico n="qr" c="w-5 h-5" />
              Generar Pase QR Digital
            </Btn>
          </div>
        </form>
      </GCard>

      {/* Luxury Digital Boarding Pass Ticket Presentation */}
      <div className="flex flex-col justify-center">
        {createdPass ? (
          <div className="rounded-3xl overflow-hidden shadow-xl border border-teal-950/15 bg-white animate-fade-in relative">
            {/* Top Header */}
            <div
              className="p-5 sm:p-6 text-white relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #003333 0%, #004c4c 60%, #008080 100%)',
              }}
            >
              <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-teal-400/20 blur-xl pointer-events-none" />

              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-300 animate-pulse" />
                    <p className="text-[10px] text-teal-300 uppercase tracking-widest font-mono font-bold">
                      PASE DE ACCESO RESIDENCIAL
                    </p>
                  </div>
                  <h4 className="text-xl sm:text-2xl font-display font-extrabold mt-1 tracking-tight">
                    Las Palomas Residencial
                  </h4>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 font-bold">
                    {createdPass.visitType}
                  </span>
                </div>
              </div>
            </div>

            {/* Middle QR Code and Key Details */}
            <div className="p-6 sm:p-8 flex flex-col items-center justify-center text-center bg-white">
              <div className="p-3 bg-white border-2 border-dashed border-teal-800/25 rounded-2xl shadow-sm mb-4">
                <QRVisual seed={createdPass.code} size={6} />
              </div>

              <p className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-widest">
                Código de Caseta
              </p>
              <p className="text-3xl sm:text-4xl font-mono font-black text-slate-900 tracking-wider my-1">
                {createdPass.code}
              </p>

              <div className="w-full grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100 text-left">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Visitante</p>
                  <p className="text-sm font-bold text-slate-900 truncate mt-0.5">{createdPass.visitor}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Unidad / Anfitrión</p>
                  <p className="text-sm font-bold text-slate-900 truncate mt-0.5">
                    {createdPass.unit} · {createdPass.host.split(' ')[0]}
                  </p>
                </div>
              </div>

              <div className="w-full p-2.5 rounded-xl bg-teal-50/70 border border-teal-100 mt-2 text-center">
                <p className="text-xs text-teal-900 font-semibold inline-flex items-center justify-center gap-1.5 w-full">
                  <Ico n="calendar" c="w-3.5 h-3.5 text-teal-700 shrink-0" />
                  <span>Vigencia: <strong>{createdPass.validDate}</strong> a las <strong>{createdPass.validTime} hrs</strong></span>
                </p>
              </div>

              {copyFeedback && (
                <div className="mt-3 p-2 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold animate-fade-in">
                  {copyFeedback}
                </div>
              )}

              {/* Action Buttons */}
              <div className="w-full grid grid-cols-2 gap-3 mt-5">
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <Ico n="whatsapp" c="w-4 h-4" />
                  <span>Enviar por WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Ico n="copy" c="w-4 h-4" />
                  <span>Copiar Clave</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full min-h-[300px] rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 mb-3">
              <Ico n="qr" c="w-7 h-7" />
            </div>
            <h4 className="font-display font-bold text-slate-800 text-base">Vista Previa del Pase</h4>
            <p className="text-xs text-slate-500 max-w-xs mt-1">
              Completa el formulario o selecciona una plantilla rápida para generar la ficha digital con código QR.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default QRPassGenerator
