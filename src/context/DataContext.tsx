import { createContext, useContext, useState, type ReactNode } from 'react'
import type { Resident, Notice, CommunityDocument, UserRolePermission } from '@/types/hoa'
import type { Amenity, Booking, BookingStatus } from '@/types/amenities'
import type { AccessPass, VisitRecord, QRValidationResult, VisitType } from '@/types/access'
import type { FeeStatement, MaintenanceTicket, TicketStatus } from '@/types/finance'
import {
  INITIAL_RESIDENTS,
  INITIAL_NOTICES,
  INITIAL_DOCUMENTS,
  INITIAL_PERMISSIONS_USERS,
  INITIAL_AMENITIES,
  INITIAL_BOOKINGS,
  INITIAL_ACCESS_PASSES,
  INITIAL_VISITS,
  INITIAL_FEES,
  INITIAL_TICKETS,
} from '@/data/mockData'

interface DataContextType {
  // Module A: HOA
  residents: Resident[]
  addResident: (r: Omit<Resident, 'id'>) => void
  updateResident: (r: Resident) => void
  notices: Notice[]
  addNotice: (n: Omit<Notice, 'id' | 'date'>) => void
  deleteNotice: (id: number) => void
  documents: CommunityDocument[]
  addDocument: (d: Omit<CommunityDocument, 'id' | 'date'>) => void
  deleteDocument: (id: number) => void
  userPermissions: UserRolePermission[]
  addUserPermission: (u: Omit<UserRolePermission, 'id'>) => void

  // Module B: Amenities
  amenities: Amenity[]
  addAmenity: (a: Omit<Amenity, 'id'>) => void
  updateAmenity: (a: Amenity) => void
  deleteAmenity: (id: number) => void
  toggleAmenityAvailability: (id: number) => void
  bookings: Booking[]
  addBooking: (b: Omit<Booking, 'id' | 'status'>) => void
  updateBookingStatus: (id: number, status: BookingStatus) => void

  // Module C: Access & Visits
  accessPasses: AccessPass[]
  visits: VisitRecord[]
  generateAccessPass: (data: { visitor: string; host: string; unit: string; date: string; time: string; type: VisitType }) => AccessPass
  validateQRCode: (code: string) => QRValidationResult
  checkInVisit: (passCodeOrManual: { visitor: string; host: string; unit: string; type?: VisitType; plate?: string }) => void
  checkOutVisit: (visitId: number) => void

  // Module D: Finance & Maintenance
  fees: FeeStatement[]
  tickets: MaintenanceTicket[]
  registerFeePayment: (id: string, method?: string) => void
  addTicket: (t: Omit<MaintenanceTicket, 'id' | 'date' | 'status'>) => MaintenanceTicket
  updateTicketStatus: (id: string, status: TicketStatus, assignedTo?: string) => void
}

const DataContext = createContext<DataContextType | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  // State A: HOA
  const [residents, setResidents] = useState<Resident[]>(INITIAL_RESIDENTS)
  const [notices, setNotices] = useState<Notice[]>(INITIAL_NOTICES)
  const [documents, setDocuments] = useState<CommunityDocument[]>(INITIAL_DOCUMENTS)
  const [userPermissions, setUserPermissions] = useState<UserRolePermission[]>(INITIAL_PERMISSIONS_USERS)

  // State B: Amenities
  const [amenities, setAmenities] = useState<Amenity[]>(INITIAL_AMENITIES)
  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS)

  // State C: Access
  const [accessPasses, setAccessPasses] = useState<AccessPass[]>(INITIAL_ACCESS_PASSES)
  const [visits, setVisits] = useState<VisitRecord[]>(INITIAL_VISITS)

  // State D: Finance & Maintenance
  const [fees, setFees] = useState<FeeStatement[]>(INITIAL_FEES)
  const [tickets, setTickets] = useState<MaintenanceTicket[]>(INITIAL_TICKETS)

  // ── Handlers A ─────────────────────────────────────────────────────────────
  function addResident(r: Omit<Resident, 'id'>) {
    const newId = residents.length > 0 ? Math.max(...residents.map(x => x.id)) + 1 : 1
    setResidents(prev => [{ id: newId, ...r }, ...prev])
  }

  function updateResident(updated: Resident) {
    setResidents(prev => prev.map(r => (r.id === updated.id ? updated : r)))
  }

  function addNotice(n: Omit<Notice, 'id' | 'date'>) {
    const today = new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
    const newId = notices.length > 0 ? Math.max(...notices.map(x => x.id)) + 1 : 1
    setNotices(prev => [{ id: newId, date: today, ...n }, ...prev])
  }

  function deleteNotice(id: number) {
    setNotices(prev => prev.filter(n => n.id !== id))
  }

  function addDocument(d: Omit<CommunityDocument, 'id' | 'date'>) {
    const today = new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
    const newId = documents.length > 0 ? Math.max(...documents.map(x => x.id)) + 1 : 1
    setDocuments(prev => [{ id: newId, date: today, ...d }, ...prev])
  }

  function deleteDocument(id: number) {
    setDocuments(prev => prev.filter(d => d.id !== id))
  }

  function addUserPermission(u: Omit<UserRolePermission, 'id'>) {
    const newId = `USR-00${userPermissions.length + 1}`
    setUserPermissions(prev => [...prev, { id: newId, ...u }])
  }

  // ── Handlers B ─────────────────────────────────────────────────────────────
  function addAmenity(a: Omit<Amenity, 'id'>) {
    const newId = amenities.length > 0 ? Math.max(...amenities.map(x => x.id)) + 1 : 1
    setAmenities(prev => [...prev, { id: newId, ...a }])
  }

  function updateAmenity(updated: Amenity) {
    setAmenities(prev => prev.map(a => (a.id === updated.id ? updated : a)))
  }

  function deleteAmenity(id: number) {
    setAmenities(prev => prev.filter(a => a.id !== id))
  }

  function toggleAmenityAvailability(id: number) {
    setAmenities(prev =>
      prev.map(a => (a.id === id ? { ...a, available: !a.available } : a))
    )
  }

  function addBooking(b: Omit<Booking, 'id' | 'status'>) {
    const newId = bookings.length > 0 ? Math.max(...bookings.map(x => x.id)) + 1 : 1
    const newBooking: Booking = { id: newId, status: 'Pendiente', ...b }
    setBookings(prev => [newBooking, ...prev])
  }

  function updateBookingStatus(id: number, status: BookingStatus) {
    setBookings(prev => prev.map(b => (b.id === id ? { ...b, status } : b)))
  }

  // ── Handlers C ─────────────────────────────────────────────────────────────
  function generateAccessPass({ visitor, host, unit, date, time, type }: { visitor: string; host: string; unit: string; date: string; time: string; type: VisitType }) {
    const visitorPrefix = (visitor.slice(0, 3) || 'VIS').toUpperCase()
    const cleanUnit = (unit || 'A101').replace(/[^a-zA-Z0-9]/g, '')
    const randCode = Math.random().toString(36).substring(2, 6).toUpperCase()
    const code = `VCN-${visitorPrefix}-${cleanUnit}-${randCode}`
    
    const newPass: AccessPass = {
      id: `PASS-00${accessPasses.length + 1}`,
      code,
      visitor,
      host,
      unit,
      validDate: date,
      validTime: time,
      status: 'Activo',
      visitType: type,
      vehiclePlate: '',
    }
    setAccessPasses(prev => [newPass, ...prev])
    return newPass
  }

  function validateQRCode(code: string): QRValidationResult {
    const pass = accessPasses.find(p => p.code.toUpperCase() === code.trim().toUpperCase())
    if (!pass) return { valid: false, message: 'Código QR no encontrado en el sistema.' }
    if (pass.status === 'Expirado') return { valid: false, message: 'Este pase de acceso ha expirado.', pass }
    if (pass.status === 'Usado') return { valid: false, message: 'Este pase ya fue utilizado previamente.', pass }
    return { valid: true, message: `Pase de acceso válido para la unidad ${pass.unit}.`, pass }
  }

  function checkInVisit(passCodeOrManual: { visitor: string; host: string; unit: string; type?: VisitType; plate?: string }) {
    const now = new Date()
    const dateStr = now.toISOString().split('T')[0]
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    const newVisit: VisitRecord = {
      id: visits.length > 0 ? Math.max(...visits.map(v => v.id)) + 1 : 1,
      visitor: passCodeOrManual.visitor,
      unit: passCodeOrManual.unit,
      host: passCodeOrManual.host,
      type: passCodeOrManual.type || 'Visita',
      plate: passCodeOrManual.plate || '---',
      entryDate: dateStr,
      entryTime: timeStr,
      status: 'En Sitio',
    }
    setVisits(prev => [newVisit, ...prev])
  }

  function checkOutVisit(visitId: number) {
    const now = new Date()
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    setVisits(prev =>
      prev.map(v => (v.id === visitId ? { ...v, exitTime: timeStr, status: 'Completada' as const } : v))
    )
  }

  // ── Handlers D ─────────────────────────────────────────────────────────────
  function registerFeePayment(id: string, method: string = 'Transferencia SPEI') {
    const today = new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
    setFees(prev =>
      prev.map(f => (f.id === id ? { ...f, status: 'Pagada', date: today, paymentMethod: method } : f))
    )
  }

  function addTicket(t: Omit<MaintenanceTicket, 'id' | 'date' | 'status'>) {
    const today = new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
    const newId = `TCK-00${tickets.length + 1}`
    const newTicket: MaintenanceTicket = {
      id: newId,
      date: today,
      status: 'Abierto',
      ...t,
    }
    setTickets(prev => [newTicket, ...prev])
    return newTicket
  }

  function updateTicketStatus(id: string, status: TicketStatus, assignedTo?: string) {
    setTickets(prev =>
      prev.map(t =>
        t.id === id ? { ...t, status, ...(assignedTo ? { assignedTo } : {}) } : t
      )
    )
  }

  return (
    <DataContext.Provider
      value={{
        residents,
        addResident,
        updateResident,
        notices,
        addNotice,
        deleteNotice,
        documents,
        addDocument,
        deleteDocument,
        userPermissions,
        addUserPermission,
        amenities,
        addAmenity,
        updateAmenity,
        deleteAmenity,
        toggleAmenityAvailability,
        bookings,
        addBooking,
        updateBookingStatus,
        accessPasses,
        visits,
        generateAccessPass,
        validateQRCode,
        checkInVisit,
        checkOutVisit,
        fees,
        tickets,
        registerFeePayment,
        addTicket,
        updateTicketStatus,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) {
    throw new Error('useData must be used within a DataProvider')
  }
  return ctx
}
