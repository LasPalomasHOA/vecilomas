export type ResidentType = 'Propietario' | 'Arrendatario'
export type ResidentStatus = 'Al corriente' | 'Moroso'

export interface Resident {
  id: number
  unit: string
  name: string
  type: ResidentType
  status: ResidentStatus
  phone: string
  email: string
  vehicles: string[]
}

export type NoticeType = 'Mantenimiento' | 'Asamblea' | 'Servicio' | 'Comunicado' | 'Seguridad'

export interface NoticeAttachment {
  name: string
  size: string
  url?: string
}

export interface Notice {
  id: number
  title: string
  date: string
  type: NoticeType
  content: string
  urgent?: boolean
  pinned?: boolean
  expiresAt?: string
  attachment?: NoticeAttachment
  acknowledgments?: number
  readBy?: string[] // list of units or user emails that confirmed receipt
  audience?: string // e.g. 'Todos los residentes', 'Torre A', 'Torre B', 'Villas'
}

export type DocumentCategory = 'Reglamento' | 'Asamblea' | 'Finanzas' | 'Manuales' | 'Políticas'

export interface CommunityDocument {
  id: number
  name: string
  category: DocumentCategory
  date: string
  size: string
  url?: string
}

export interface UserRolePermission {
  id: string
  name: string
  email: string
  role: 'admin' | 'resident' | 'security'
  unit?: string
  status: 'Activo' | 'Inactivo'
  permissions: string[]
}

