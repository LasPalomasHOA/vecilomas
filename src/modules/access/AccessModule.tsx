import { useState } from 'react'
import ModHero from '@/components/common/ModHero'
import SubTabs from '@/components/common/SubTabs'
import Ico from '@/components/common/Icons'
import QRPassGenerator from '@/modules/access/QRPassGenerator'
import AccessPassesList from '@/modules/access/AccessPassesList'
import DigitalVisitLog from '@/modules/access/DigitalVisitLog'
import { useData } from '@/context/DataContext'

export type AccessTab = 'generate' | 'passes' | 'log'

export function AccessModule({ defaultTab = 'generate' }: { defaultTab?: AccessTab }) {
  const [tab, setTab] = useState<AccessTab>(defaultTab)
  const { visits, accessPasses } = useData()

  const inFacilityCount = visits.filter(v => v.status === 'En Instalaciones').length

  return (
    <div>
      <ModHero
        icon={<Ico n="shield" c="w-6 h-6" />}
        title="Módulo de Control de Accesos e Invitados (Visitas)"
        desc="Gestión integral de pases QR digitales, historial de accesos emitidos y bitácora en tiempo real de entradas y salidas."
        badge="Módulo C"
      />

      <SubTabs
        tabs={[
          { id: 'generate' as AccessTab, label: 'Generación de Pases QR', shortLabel: 'Crear Pase' },
          { id: 'passes' as AccessTab, label: 'Pases Generados', shortLabel: 'Pases', badge: accessPasses.length },
          { id: 'log' as AccessTab, label: 'Bitácora Digital de Visitas', shortLabel: 'Bitácora', badge: inFacilityCount },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'generate' && <QRPassGenerator />}
      {tab === 'passes' && <AccessPassesList onNavigateToGenerate={() => setTab('generate')} />}
      {tab === 'log' && <DigitalVisitLog />}
    </div>
  )
}
export default AccessModule
