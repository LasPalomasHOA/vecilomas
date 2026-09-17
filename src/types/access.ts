export type VisitStatus = 'En Instalaciones' | 'Completada' | 'Cancelado'
export type VisitType = 'Visita' | 'Repartidor' | 'Técnico' | 'Proveedor' | 'Familiar'

export interface AccessPass {
  id: string
  code: string
  visitor: string
  host: string
  unit: string
  validDate: string
  validTime: string
  visitType: VisitType
  status: 'Activo' | 'Utilizado' | 'Expirado'
  createdAt: string
}

export interface VisitRecord {
  id: number
  visitor: string
  host: string
  unit: string
  entry: string
  exit: string | null
  date: string
  status: VisitStatus
  type?: VisitType
  plate?: string
}

export interface QRValidationResult {
  valid: boolean
  pass?: AccessPass
  message: string
}
