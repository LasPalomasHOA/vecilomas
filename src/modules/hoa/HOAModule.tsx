import { useState, useEffect } from 'react'
import ModHero from '@/components/common/ModHero'
import SubTabs from '@/components/common/SubTabs'
import Ico from '@/components/common/Icons'
import ResidentialDirectory from '@/modules/hoa/ResidentialDirectory'
import UserRoleControl from '@/modules/hoa/UserRoleControl'
import NoticeBoard from '@/modules/hoa/NoticeBoard'
import DocumentRepository from '@/modules/hoa/DocumentRepository'
import { useData } from '@/context/DataContext'

export type HOATab = 'directory' | 'roles' | 'board' | 'documents'

export function HOAModule({ defaultTab = 'directory' }: { defaultTab?: HOATab }) {
  const [tab, setTab] = useState<HOATab>(defaultTab)
  const { residents, userPermissions, notices, documents } = useData()

  useEffect(() => {
    setTab(defaultTab)
  }, [defaultTab])

  return (
    <div>
      <ModHero
        icon={<Ico n="building" c="w-6 h-6" />}
        title="Módulo de Administración HOA y Propiedades"
        desc="Gestión del directorio residencial, control de usuarios y niveles de acceso, publicación de comunicados y repositorio de reglamentos."
        badge="Módulo A"
      />

      <SubTabs
        tabs={[
          { id: 'directory' as HOATab, label: 'Directorio Residencial', shortLabel: 'Directorio', badge: residents.length },
          { id: 'roles' as HOATab, label: 'Control de Usuarios y Roles', shortLabel: 'Roles', badge: userPermissions.length },
          { id: 'board' as HOATab, label: 'Tablón de Avisos y Comunicados', shortLabel: 'Avisos', badge: notices.length },
          { id: 'documents' as HOATab, label: 'Repositorio de Documentos', shortLabel: 'Documentos', badge: documents.length },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'directory' && <ResidentialDirectory />}
      {tab === 'roles' && <UserRoleControl />}
      {tab === 'board' && <NoticeBoard />}
      {tab === 'documents' && <DocumentRepository />}
    </div>
  )
}
export default HOAModule
