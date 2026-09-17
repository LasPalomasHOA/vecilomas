import { useState, useEffect } from 'react'
import ModHero from '@/components/common/ModHero'
import SubTabs from '@/components/common/SubTabs'
import Ico from '@/components/common/Icons'
import FeeControl from '@/modules/finance/FeeControl'
import MaintenanceTickets from '@/modules/finance/MaintenanceTickets'
import { useData } from '@/context/DataContext'

export type FinanceTab = 'fees' | 'tickets'

export function FinanceModule({ defaultTab = 'fees' }: { defaultTab?: FinanceTab }) {
  const [tab, setTab] = useState<FinanceTab>(defaultTab)
  const { fees, tickets } = useData()

  useEffect(() => {
    setTab(defaultTab)
  }, [defaultTab])

  const overdueCount = fees.filter(f => f.status === 'Vencida').length
  const pendingTicketsCount = tickets.filter(t => t.status !== 'Resuelto').length

  return (
    <div>
      <ModHero
        icon={<Ico n="dollar" c="w-6 h-6" />}
        title="Módulo de Finanzas y Mantenimiento (Soporte)"
        desc="Control de cuotas condominales, estados de cuenta por propiedad, registro de pagos y seguimiento de tickets de mantenimiento."
        badge="Módulo D"
      />

      <SubTabs
        tabs={[
          { id: 'fees' as FinanceTab, label: 'Control de Cuotas y Finanzas', shortLabel: 'Cuotas', badge: overdueCount ? `${overdueCount} morosas` : undefined },
          { id: 'tickets' as FinanceTab, label: 'Tickets de Mantenimiento', shortLabel: 'Tickets', badge: pendingTicketsCount || undefined },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'fees' && <FeeControl />}
      {tab === 'tickets' && <MaintenanceTickets />}
    </div>
  )
}
export default FinanceModule
