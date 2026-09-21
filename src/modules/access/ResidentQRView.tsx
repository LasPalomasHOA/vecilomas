import { useState } from 'react'
import type { AuthUser } from '@/types'
import { useData } from '@/context/DataContext'
import ModHero from '@/components/common/ModHero'
import SubTabs from '@/components/common/SubTabs'
import GCard from '@/components/common/Card'
import Badge from '@/components/common/Badge'
import Ico from '@/components/common/Icons'
import QRVisual from '@/components/common/QRVisual'
import QRPassGenerator from '@/modules/access/QRPassGenerator'
import { shareQRPassToWhatsApp, downloadQRPassImage } from '@/utils/qrPassImageGenerator'

type ResidentQRTab = 'new-pass' | 'my-passes'

export function ResidentQRView({ user }: { user: AuthUser }) {
  const { accessPasses } = useData()
  const [tab, setTab] = useState<ResidentQRTab>('new-pass')
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [sharingPassId, setSharingPassId] = useState<string | null>(null)

  const myPasses = accessPasses.filter(
    p => p.unit === user.unit || p.host.toLowerCase().includes(user.name.split(' ')[0].toLowerCase())
  )

  function handleCopy(code: string) {
    navigator.clipboard.writeText(code)
    setToastMessage(`¡Código ${code} copiado al portapapeles!`)
    setTimeout(() => setToastMessage(null), 3000)
  }

  async function handleShare(pass: (typeof myPasses)[0]) {
    setSharingPassId(pass.id)
    try {
      const res = await shareQRPassToWhatsApp(pass)
      if (res.message) {
        setToastMessage(res.message)
      } else if (res.shared) {
        setToastMessage(`¡Pase para ${pass.visitor} enviado a WhatsApp con imagen!`)
      }
      setTimeout(() => setToastMessage(null), 4500)
    } catch (err) {
      console.error('Error al compartir pase:', err)
      const text = `¡Hola ${pass.visitor}! Te comparto tu Pase de Acceso Digital para Las Palomas Residencial:\n\n• Código: ${pass.code}\n• Unidad: ${pass.unit} (${pass.host})\n• Vigencia: ${pass.validDate} a las ${pass.validTime} hrs\n\nPor favor muéstralo en la caseta de entrada.`
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank')
    } finally {
      setSharingPassId(null)
    }
  }

  async function handleDownload(pass: (typeof myPasses)[0]) {
    try {
      await downloadQRPassImage(pass)
      setToastMessage(`¡Imagen PNG para ${pass.visitor} descargada!`)
      setTimeout(() => setToastMessage(null), 3500)
    } catch (err) {
      console.error('Error al descargar:', err)
    }
  }

  return (
    <div>
      <ModHero
        icon={<Ico n="qr" c="w-6 h-6" />}
        title="Pases QR para Invitados"
        desc="Crea invitaciones digitales con fecha y hora de vigencia para tus visitas, familiares y repartidores. Compártelas directamente como imagen vía WhatsApp."
      />

      {toastMessage && (
        <div className="mb-4 p-3.5 rounded-2xl bg-teal-50 border border-teal-100 text-teal-800 text-xs font-semibold flex items-center gap-2 animate-fade-in shadow-xs">
          <Ico n="check" c="w-4 h-4 text-teal-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <SubTabs
        tabs={[
          { id: 'new-pass' as ResidentQRTab, label: 'Crear Pase QR', shortLabel: 'Crear Pase' },
          { id: 'my-passes' as ResidentQRTab, label: 'Mis Pases Generados', shortLabel: 'Mis Pases', badge: myPasses.length },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'new-pass' && (
        <QRPassGenerator
          defaultUnit={user.unit || 'A-101'}
          defaultHost={user.name}
          isResidentView={true}
        />
      )}

      {tab === 'my-passes' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myPasses.map(p => (
              <GCard key={p.id} className="hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                    <Badge text={p.status} />
                    <span className="text-xs font-medium text-slate-400 whitespace-nowrap shrink-0">{p.visitType}</span>
                  </div>

                  <div className="flex items-center gap-3.5 mb-4 min-w-0">
                    <div className="shrink-0 p-1.5 rounded-xl bg-white border border-slate-100 shadow-2xs">
                      <QRVisual seed={p.code} size={4} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-display font-semibold text-slate-900 text-base leading-tight truncate">
                        {p.visitor}
                      </h4>
                      <p className="text-xs text-teal-700 font-mono font-bold mt-1 whitespace-nowrap">{p.code}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 whitespace-nowrap truncate inline-flex items-center gap-1">
                        <Ico n="calendar" c="w-3 h-3 text-slate-400" />
                        <span>{p.validDate}</span>
                        <span>·</span>
                        <Ico n="clock" c="w-3 h-3 text-slate-400" />
                        <span>{p.validTime} hrs</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => handleShare(p)}
                    disabled={sharingPassId === p.id}
                    className="w-full py-2 px-3 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    {sharingPassId === p.id ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Generando Imagen...</span>
                      </>
                    ) : (
                      <>
                        <Ico n="whatsapp" c="w-3.5 h-3.5 shrink-0" />
                        <span>Compartir Imagen por WhatsApp</span>
                      </>
                    )}
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleDownload(p)}
                      className="py-1.5 px-2 text-xs font-semibold rounded-xl bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                    >
                      <Ico n="dl" c="w-3.5 h-3.5 text-teal-700" />
                      <span>Descargar</span>
                    </button>
                    <button
                      onClick={() => handleCopy(p.code)}
                      className="py-1.5 px-2 text-xs font-semibold rounded-xl bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                    >
                      <Ico n="tag" c="w-3 h-3 text-slate-400" />
                      <span>Copiar</span>
                    </button>
                  </div>
                </div>
              </GCard>
            ))}
          </div>

          {myPasses.length === 0 && (
            <GCard className="text-center py-14">
              <p className="text-slate-400 text-sm">No has generado ningún pase de acceso aún.</p>
            </GCard>
          )}
        </div>
      )}
    </div>
  )
}
export default ResidentQRView
