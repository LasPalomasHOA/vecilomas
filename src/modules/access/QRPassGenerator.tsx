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

  const [form, setForm] = useState({
    visitor: '',
    unit: defaultUnit || (residents[0]?.unit || 'A-101'),
    host: defaultHost || (residents[0]?.name || 'Carlos Mendoza Ruiz'),
    date: '2026-09-02',
    time: '18:00',
    type: 'Visita' as VisitType,
  })

  const [createdPass, setCreatedPass] = useState<AccessPass | null>(null)
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null)

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
    const text = `¡Hola ${createdPass.visitor}! Te comparto tu Pase de Acceso Digital para Condominios Las Palomas:\n\n🔑 Código: ${createdPass.code}\n🏠 Unidad: ${createdPass.unit} (${createdPass.host})\n📅 Vigencia: ${createdPass.validDate} a las ${createdPass.validTime} hrs\n\nPor favor muestra este código al guardia de caseta al llegar.`
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
        <div className="mb-6 pb-4 border-b border-teal-950/[0.06] flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-500/20 to-teal-700/10 border border-teal-500/25 text-teal-800 flex items-center justify-center shrink-0 shadow-[0_2px_8px_rgba(0,128,128,0.15)]">
            <Ico n="qr" c="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-bold text-slate-900 text-lg leading-tight">
              Crear Pase de Acceso Digital
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Invitación con código QR para visitantes, familiares y repartidores.
            </p>
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
              className="w-full px-4 py-2.5 text-sm rounded-xl bg-slate-50/90 border border-slate-200/80 focus:bg-white focus:border-teal-600 focus:shadow-[0_0_0_3px_rgba(0,128,128,0.1)] focus:outline-none transition-all font-medium text-slate-900"
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
                  className="w-full px-4 py-2.5 text-sm rounded-xl bg-slate-50/90 border border-slate-200/80 focus:bg-white focus:border-teal-600 focus:shadow-[0_0_0_3px_rgba(0,128,128,0.1)] focus:outline-none transition-all font-medium text-slate-800"
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
                className="w-full px-4 py-2.5 text-sm rounded-xl bg-slate-50/90 border border-slate-200/80 focus:bg-white focus:border-teal-600 focus:shadow-[0_0_0_3px_rgba(0,128,128,0.1)] focus:outline-none transition-all font-medium text-slate-800"
              >
                <option value="Visita">Visita / Amigo</option>
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
                className="w-full px-4 py-2.5 text-sm rounded-xl bg-slate-50/90 border border-slate-200/80 focus:bg-white focus:border-teal-600 focus:shadow-[0_0_0_3px_rgba(0,128,128,0.1)] focus:outline-none transition-all font-medium text-slate-800"
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
                className="w-full px-4 py-2.5 text-sm rounded-xl bg-slate-50/90 border border-slate-200/80 focus:bg-white focus:border-teal-600 focus:shadow-[0_0_0_3px_rgba(0,128,128,0.1)] focus:outline-none transition-all font-medium text-slate-800"
              />
            </div>
          </div>

          <div className="pt-2">
            <Btn type="submit" className="w-full py-3 font-bold shadow-[0_4px_16px_rgba(0,128,128,0.25)]">
              <Ico n="qr" c="w-5 h-5" />
              Generar Pase QR Digital
            </Btn>
          </div>
        </form>
      </GCard>

      {/* Luxury Digital Boarding Pass Ticket Presentation */}
      <div className="flex flex-col justify-center">
        {createdPass ? (
          <div className="rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,51,51,0.14)] border border-teal-950/15 bg-white animate-fade-in relative">
            {/* Top Header of the Boarding Pass */}
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
                      ✦ PASE DE ACCESO DIGITAL VIP
                    </p>
                  </div>
                  <h4 className="text-xl font-display font-extrabold text-white mt-1">
                    Las Palomas Residencial
                  </h4>
                </div>
                <div className="px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-teal-100 text-xs font-bold shadow-xs">
                  {createdPass.visitType}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/15 flex justify-between text-xs">
                <div>
                  <p className="text-[10px] font-mono text-teal-200/80 uppercase font-semibold">Invitado:</p>
                  <p className="font-bold text-base text-white">{createdPass.visitor}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-mono text-teal-200/80 uppercase font-semibold">Destino:</p>
                  <p className="font-display font-extrabold text-base text-teal-300">Unidad {createdPass.unit}</p>
                </div>
              </div>
            </div>

            {/* Middle QR Code Section */}
            <div className="p-6 sm:p-8 bg-slate-50/80 flex flex-col items-center justify-center text-center relative border-y border-dashed border-slate-300">
              {/* Ticket Cutout Semi-Circles */}
              <div className="absolute -left-3 top-[-12px] w-6 h-6 rounded-full bg-slate-100 border-r border-slate-300/80" />
              <div className="absolute -right-3 top-[-12px] w-6 h-6 rounded-full bg-slate-100 border-l border-slate-300/80" />

              {copyFeedback && (
                <div className="mb-3 p-2.5 rounded-xl bg-teal-50 text-teal-800 border border-teal-200 text-xs font-bold animate-fade-in shadow-2xs">
                  {copyFeedback}
                </div>
              )}

              {/* QR Visual Container */}
              <div className="mb-4 bg-white p-4 rounded-3xl shadow-[0_4px_16px_rgba(0,51,51,0.08)] border border-teal-950/[0.08] relative">
                <QRVisual seed={createdPass.code} size={7} />
              </div>

              {/* Code Chip */}
              <div
                onClick={handleCopyCode}
                title="Haz clic para copiar"
                className="inline-flex items-center gap-2 font-mono text-xs font-bold text-slate-900 bg-white px-4 py-2 rounded-xl border border-teal-950/[0.12] shadow-xs cursor-pointer hover:bg-teal-50 hover:border-teal-500/40 transition-all group"
              >
                <span>{createdPass.code}</span>
                <Ico n="tag" c="w-3.5 h-3.5 text-teal-600 group-hover:scale-110 transition-transform" />
              </div>

              <p className="text-xs text-slate-500 mt-3 font-medium">
                Válido para: <strong className="text-slate-900 font-bold">{createdPass.validDate}</strong> a las{' '}
                <strong className="text-slate-900 font-bold">{createdPass.validTime} hrs</strong>
              </p>
            </div>

            {/* Bottom Sharing Strip */}
            <div className="p-4 bg-white flex flex-col sm:flex-row gap-2.5">
              <Btn variant="whatsapp" onClick={handleShareWhatsApp} className="w-full sm:flex-1 font-bold whitespace-nowrap justify-center py-2.5 shadow-[0_4px_12px_rgba(16,185,129,0.3)]">
                <Ico n="whatsapp" c="w-4 h-4 shrink-0" />
                <span>Compartir por WhatsApp</span>
              </Btn>
              <Btn variant="outline" onClick={handleCopyCode} className="w-full sm:flex-1 font-bold whitespace-nowrap justify-center py-2.5 border-teal-950/[0.15] hover:bg-slate-50">
                Copiar Código
              </Btn>
            </div>
          </div>
        ) : (
          <GCard p="p-8" className="text-center min-h-[380px] flex flex-col items-center justify-center">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 bg-gradient-to-br from-teal-500/20 to-teal-700/10 border border-teal-500/25 text-teal-800 shadow-[0_4px_16px_rgba(0,128,128,0.15)]">
              <Ico n="qr" c="w-9 h-9" />
            </div>
            <p className="font-display font-bold text-slate-900 text-lg">Pase Digital sin emitir</p>
            <p className="text-xs text-slate-500 mt-1.5 max-w-xs leading-relaxed">
              Completa el formulario con los datos de tu invitado para generar la invitación digital con código QR instantáneo.
            </p>
          </GCard>
        )}
      </div>
    </div>
  )
}
export default QRPassGenerator
