export type FeeStatus = 'Pagada' | 'Pendiente' | 'Vencida'

export interface FeeStatement {
  id: string
  unit: string
  resident: string
  concept: string
  amount: number
  status: FeeStatus
  date: string
  dueDate: string
  paymentMethod?: string
}

export interface PaymentTransaction {
  id: string
  feeStatementId: string
  unit: string
  resident: string
  concept: string
  amountPaid: number
  paymentMethod: string
  referenceNumber: string
  voucherUrl?: string
  status: string
  paidAt: string
  verifiedBy: string
}

export type TicketPriority = 'Alta' | 'Media' | 'Baja'
export type TicketStatus = 'Pendiente' | 'En Proceso' | 'Resuelto'

export interface MaintenanceTicket {
  id: string
  location: string
  reporter: string
  unit?: string
  issue: string
  priority: TicketPriority
  status: TicketStatus
  date: string
  assignedTo?: string
  notes?: string
}
