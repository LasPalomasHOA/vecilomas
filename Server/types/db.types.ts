// Tipos y Modelos de la Base de Datos para el esquema `vecilomas`

export type UserRole = 'admin' | 'resident' | 'security'
export type ResidentType = 'propietario' | 'arrendatario'
export type UnitStatus = 'al_corriente' | 'moroso'
export type UserStatus = 'activo' | 'inactivo' | 'bloqueado'
export type VisitType = 'visita' | 'repartidor' | 'tecnico' | 'proveedor' | 'familiar'
export type PassStatus = 'activo' | 'utilizado' | 'expirado' | 'cancelado'
export type VisitStatus = 'en_instalaciones' | 'completada' | 'rechazada'
export type BookingStatus = 'pendiente' | 'aprobada' | 'rechazada' | 'cancelada'
export type DepositStatus = 'no_aplica' | 'pendiente' | 'retenido' | 'devuelto'
export type FeeStatus = 'pendiente' | 'pagada' | 'vencida' | 'cancelada'
export type PaymentMethod = 'spei' | 'tarjeta_debito' | 'tarjeta_credito' | 'efectivo_oficina' | 'otro'
export type PaymentStatus = 'en_revision' | 'aprobado' | 'rechazado'
export type TicketPriority = 'baja' | 'media' | 'alta' | 'urgente'
export type TicketStatus = 'pendiente' | 'en_proceso' | 'resuelto' | 'cancelado'
export type TicketCategory = 'plomeria' | 'electricidad' | 'elevadores' | 'seguridad' | 'jardineria' | 'limpieza' | 'intercom' | 'otro'
export type NoticeType = 'mantenimiento' | 'asamblea' | 'servicio' | 'comunicado' | 'emergencia'
export type DocumentCategory = 'reglamento' | 'asamblea' | 'finanzas' | 'manuales' | 'politicas'

export interface CondominiumEntity {
  id: string
  name: string
  address: string
  postal_code?: string
  city?: string
  currency: string
  created_at: string
}

export interface UnitEntity {
  id: string
  condominium_id: string
  unit_number: string
  building_block?: string
  floor?: number
  status: UnitStatus
  created_at: string
}

export interface UserEntity {
  id: string
  condominium_id: string
  unit_id?: string | null
  email: string
  password_hash: string
  full_name: string
  phone?: string
  role: UserRole
  resident_type?: ResidentType | null
  status: UserStatus
  avatar_url?: string | null
  created_at: string
  updated_at: string
}

export interface VehicleEntity {
  id: string
  unit_id: string
  user_id?: string | null
  plate_number: string
  brand_model?: string
  created_at: string
}

export interface UserPermissionEntity {
  id: string
  user_id: string
  permission_key: string
  granted_at: string
}

export interface AccessPassEntity {
  id: string
  unit_id: string
  host_user_id: string
  qr_code: string
  visitor_name: string
  visitor_phone?: string
  visit_type: VisitType
  valid_from: string
  valid_until: string
  is_single_use: boolean
  status: PassStatus
  created_at: string
}

export interface VisitLogEntity {
  id: number
  condominium_id: string
  access_pass_id?: string | null
  unit_id: string
  guard_user_id?: string | null
  visitor_name: string
  host_name?: string
  visit_type: VisitType
  vehicle_plate?: string | null
  entry_timestamp: string
  exit_timestamp?: string | null
  status: VisitStatus
  identification_notes?: string | null
  incident_reported: boolean
}

export interface AmenityEntity {
  id: number
  condominium_id: string
  name: string
  description?: string
  capacity: number
  cost_amount: number
  deposit_amount: number
  opening_time: string
  closing_time: string
  max_hours_per_booking: number
  requires_approval: boolean
  image_url?: string
  rules: string[]
  is_active: boolean
}

export interface BookingEntity {
  id: number
  amenity_id: number
  user_id: string
  unit_id: string
  start_datetime: string
  end_datetime: string
  guests_count: number
  total_cost: number
  deposit_status: DepositStatus
  status: BookingStatus
  approved_by_user_id?: string | null
  notes?: string | null
  created_at: string
}

export interface FeeConceptEntity {
  id: number
  condominium_id: string
  code: string
  name: string
  default_amount: number
  is_recurring: boolean
}

export interface FeeStatementEntity {
  id: string
  folio: string
  unit_id: string
  concept_id?: number | null
  description: string
  amount: number
  late_fee_amount: number
  issue_date: string
  due_date: string
  status: FeeStatus
  created_at: string
}

export interface PaymentEntity {
  id: string
  fee_statement_id: string
  user_id: string
  amount_paid: number
  payment_method: PaymentMethod
  reference_number?: string | null
  voucher_url?: string | null
  verified_by_user_id?: string | null
  verified_at?: string | null
  status: PaymentStatus
  paid_at: string
}

export interface MaintenanceTicketEntity {
  id: string
  ticket_number: string
  condominium_id: string
  unit_id?: string | null
  reported_by_user_id: string
  location: string
  category: TicketCategory
  title: string
  description: string
  priority: TicketPriority
  status: TicketStatus
  assigned_to?: string | null
  estimated_cost?: number | null
  created_at: string
  resolved_at?: string | null
}

export interface TicketCommentEntity {
  id: number
  ticket_id: string
  user_id: string
  comment: string
  attachment_url?: string | null
  is_internal: boolean
  created_at: string
}

export interface NoticeEntity {
  id: number
  condominium_id: string
  author_user_id: string
  title: string
  content: string
  notice_type: NoticeType
  is_urgent: boolean
  published_at: string
  expires_at?: string | null
}

export interface CommunityDocumentEntity {
  id: number
  condominium_id: string
  name: string
  category: DocumentCategory
  file_url: string
  file_size_bytes?: number
  mime_type?: string
  uploaded_by_user_id?: string | null
  created_at: string
}

export interface AuditLogEntity {
  id: number
  user_id?: string | null
  action: string
  entity_name: string
  entity_id: string
  previous_state?: any
  new_state?: any
  ip_address?: string | null
  created_at: string
}
