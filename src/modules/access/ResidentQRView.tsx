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

type ResidentQRTab = 'new-pass' | 'my-passes'

export function ResidentQRView({ user }: { user: AuthUser }) {
  const { accessPasses } = useData()
  const [tab, setTab] = useState<ResidentQRTab>('new-pass')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const myPasses = accessPasses.filter(
    p => p.unit === user.unit || p.host.toLowerCase().includes(user.name.split(' ')[0].toLowerCase())
  )

  function handleCopy(code: string) {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 3000)
  }

  function handleShare(pass: (typeof myPasses)[0]) {
    const text = `¡Hola ${pass.visitor}! Te comparto tu Pase de Acceso Digital para Condominios Las Palomas:\n\n🔑 Código: ${pass.code}\n🏠 Unidad: ${pass.unit} (${pass.host})\n📅 Vigencia: ${pass.validDate} a las ${pass.validTime} hrs\n\nPor favor muéstralo en la caseta de entrada.`
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }

  return (
    <div>
      <ModHero
        icon={<Ico n="qr" c="w-6 h-6" />}
        title="Pases QR para Invitados"
        desc="Crea invitaciones digitales con fecha y hora de vigencia para tus visitas, familiares y repartidores. Compártelas directamente vía WhatsApp."
      />

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
          {copiedCode && (
            <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-100 text-teal-800 text-xs font-semibold flex items-center gap-2 animate-fade-in">
              <Ico n="check" c="w-4 h-4 text-teal-600" />
              ¡Código {copiedCode} copiado al portapapeles!
            </div>
          )}

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
                      <p className="text-[11px] text-slate-400 mt-0.5 whitespace-nowrap truncate">
                        📅 {p.validDate} · ⏰ {p.validTime} hrs
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => handleShare(p)}
                    className="flex-1 py-2 px-2 text-xs font-semibold rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/70 hover:bg-emerald-100 transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shadow-2xs"
                  >
                    <Ico n="whatsapp" c="w-3.5 h-3.5 shrink-0" />
                    <span>WhatsApp</span>
                  </button>
                  <button
                    onClick={() => handleCopy(p.code)}
                    className="flex-1 py-2 px-2 text-xs font-semibold rounded-xl bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap shadow-2xs"
                  >
                    Copiar Código
                  </button>
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
