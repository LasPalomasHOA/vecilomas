export interface Amenity {
  id: number
  name: string
  subtitle?: string
  capacity: number
  rate: string
  costAmount: number
  hours: string
  available: boolean
  maintenanceNote?: string
  img: string
  features: string[]
  rules: string[]
  deposit?: string
  maxHoursPerBooking?: number
}

export type BookingStatus = 'Aprobada' | 'Pendiente' | 'Cancelada' | 'Rechazada'

export interface Booking {
  id: number
  amenityId?: number
  amenity: string
  resident: string
  unit: string
  date: string
  time: string
  status: BookingStatus
  guests: number
  cost?: string
  deposit?: string
  createdAt?: string
  qrPassCode?: string
  rejectionReason?: string
  specialRequests?: string
}

