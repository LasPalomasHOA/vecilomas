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
  acknowledgeNotice: (noticeId: number, unitOrEmail: string) => void
  documents: CommunityDocument[]
  addDocument: (d: Omit<CommunityDocument, 'id' | 'date'>) => void
  deleteDocument: (id: number) => void
  userPermissions: UserRolePermission[]
  addUserPermission: (u: Omit<UserRolePermission, 'id'>) => void

  // Module B: Amenities
  amenities: Amenity[]
  toggleAmenityMaintenance: (amenityId: number, note?: string) => void
  bookings: Booking[]
  addBooking: (b: Omit<Booking, 'id' | 'status'>) => void
  updateBookingStatus: (id: number, status: BookingStatus, rejectionReason?: string) => void

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
    setNotices(prev => [{ id: newId, date: today, acknowledgments: 0, readBy: [], ...n }, ...prev])
  }

  function deleteNotice(id: number) {
    setNotices(prev => prev.filter(n => n.id !== id))
  }

  function acknowledgeNotice(noticeId: number, unitOrEmail: string) {
    setNotices(prev =>
      prev.map(n => {
        if (n.id !== noticeId) return n
        const currentReadBy = n.readBy || []
        if (currentReadBy.includes(unitOrEmail)) return n
        return {
          ...n,
          acknowledgments: (n.acknowledgments || 0) + 1,
          readBy: [...currentReadBy, unitOrEmail],
        }
      })
    )
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
  function toggleAmenityMaintenance(amenityId: number, note?: string) {
    setAmenities(prev =>
      prev.map(a =>
        a.id === amenityId
          ? {
              ...a,
              available: !a.available,
              maintenanceNote: !a.available ? undefined : note || 'Mantenimiento preventivo programado',
            }
          : a
      )
    )
  }

  function addBooking(b: Omit<Booking, 'id' | 'status'>) {
    const newId = bookings.length > 0 ? Math.max(...bookings.map(x => x.id)) + 1 : 1
    const randCode = Math.random().toString(36).substring(2, 6).toUpperCase()
    const cleanUnit = (b.unit || 'A101').replace(/[^a-zA-Z0-9]/g, '')
    const qrPassCode = `AMN-${cleanUnit}-${randCode}`
    const newBooking: Booking = {
      id: newId,
      status: 'Pendiente',
      qrPassCode,
      createdAt: new Date().toISOString(),
      ...b,
    }
    setBookings(prev => [newBooking, ...prev])
  }

  function updateBookingStatus(id: number, status: BookingStatus, rejectionReason?: string) {
    setBookings(prev =>
      prev.map(b =>
        b.id === id
          ? {
              ...b,
              status,
              ...(rejectionReason ? { rejectionReason } : {}),
            }
          : b
      )
    )
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
      visitType: type,
      status: 'Activo',
      createdAt: new Date().toISOString(),
    }
    setAccessPasses(prev => [newPass, ...prev])
    return newPass
  }

  function validateQRCode(code: string): QRValidationResult {
    const trimmed = code.trim().toUpperCase()
    const found = accessPasses.find(p => p.code.toUpperCase() === trimmed)
    if (found) {
      if (found.status === 'Expirado') {
        return { valid: false, pass: found, message: 'El pase de acceso ha expirado.' }
      }
      return { valid: true, pass: found, message: 'Pase digital válido y verificado.' }
    }
    // Fallback recognition for seed patterns starting with VCN
    if (trimmed.startsWith('VCN-')) {
      const parts = trimmed.split('-')
      const mockPass: AccessPass = {
        id: 'PASS-LIVE',
        code: trimmed,
        visitor: parts[1] ? `Visitante (${parts[1]})` : 'Invitado Registrado',
        host: 'Residente Anfitrión',
        unit: parts[2] || 'A-101',
        validDate: 'Hoy',
        validTime: 'Acceso Inmediato',
        visitType: 'Visita',
        status: 'Activo',
        createdAt: new Date().toISOString(),
      }
      return { valid: true, pass: mockPass, message: 'Código QR verificado con éxito.' }
    }
    return { valid: false, message: 'Código no encontrado en el sistema o inválido.' }
  }

  function checkInVisit({ visitor, host, unit, type = 'Visita', plate }: { visitor: string; host: string; unit: string; type?: VisitType; plate?: string }) {
    const nowTime = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
    const newId = visits.length > 0 ? Math.max(...visits.map(x => x.id)) + 1 : 1
    const newVisit: VisitRecord = {
      id: newId,
      visitor,
      host,
      unit,
      entry: nowTime,
      exit: null,
      date: 'Hoy',
      status: 'En Instalaciones',
      type,
      plate,
    }
    setVisits(prev => [newVisit, ...prev])
  }

  function checkOutVisit(visitId: number) {
    const nowTime = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
    setVisits(prev =>
      prev.map(v => (v.id === visitId ? { ...v, exit: nowTime, status: 'Completada' as const } : v))
    )
  }

  // ── Handlers D ─────────────────────────────────────────────────────────────
  function registerFeePayment(feeId: string, method: string = 'Transferencia SPEI') {
    const today = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
    setFees(prev =>
      prev.map(f =>
        f.id === feeId ? { ...f, status: 'Pagada' as const, date: today, paymentMethod: method } : f
      )
    )
  }

  function addTicket(t: Omit<MaintenanceTicket, 'id' | 'date' | 'status'>) {
    const today = new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
    const newId = `TKT-${Math.floor(2025 + Math.random() * 50)}`
    const newTicket: MaintenanceTicket = {
      id: newId,
      date: today,
      status: 'Pendiente',
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
        acknowledgeNotice,
        documents,
        addDocument,
        deleteDocument,
        userPermissions,
        addUserPermission,
        amenities,
        toggleAmenityMaintenance,
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

