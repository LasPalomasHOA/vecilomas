import ModHero from '@/components/common/ModHero'
import Ico from '@/components/common/Icons'
import GuardValidationTablet from '@/modules/access/GuardValidationTablet'
import DigitalVisitLog from '@/modules/access/DigitalVisitLog'

export type SecurityTab = 'tablet' | 'log'

export function SecurityCasetaView({ defaultTab = 'tablet' }: { defaultTab?: SecurityTab }) {
  return (
    <div>
      <ModHero
        icon={<Ico n="shield" c="w-6 h-6" />}
        title={
          defaultTab === 'tablet'
            ? 'Caseta de Seguridad — Control de Accesos'
            : 'Caseta de Seguridad — Bitácora Digital'
        }
        desc={
          defaultTab === 'tablet'
            ? 'Escaneo y validación en tablet de pases QR, confirmación rápida de entradas y bitácora de visitas en tiempo real.'
            : 'Bitácora y registro en tiempo real de accesos, visitantes y salidas del condominio.'
        }
        badge={defaultTab === 'tablet' ? 'Vista de Caseta' : 'Bitácora de Caseta'}
      />

      {defaultTab === 'tablet' && <GuardValidationTablet />}
      {defaultTab === 'log' && <DigitalVisitLog />}
    </div>
  )
}
export default SecurityCasetaView

