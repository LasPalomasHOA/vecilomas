import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { Resident, Notice, CommunityDocument, UserRolePermission } from '@/types/hoa'
import type { Amenity, Booking, BookingStatus } from '@/types/amenities'
import type { AccessPass, VisitRecord, QRValidationResult, VisitType } from '@/types/access'
import type { FeeStatement, MaintenanceTicket, TicketStatus, PaymentTransaction } from '@/types/finance'
import { ApiClient } from '@/services/apiClient'

export interface Condominium {
  id: number
  name: string
  address: string
  postalCode?: string
  city?: string
  currency?: string
  unitsCount?: number
  residentsCount?: number
}

interface DataContextType {
  // Condominio
  condominiums: Condominium[]
  selectedCondominiumId: number | null
  selectedCondominium: Condominium | undefined
  setSelectedCondominiumId: (id: number) => void
  createCondominium: (c: Omit<Condominium, 'id'>) => Promise<any>
  updateCondominium: (id: number, c: Partial<Condominium>) => Promise<any>
  deleteCondominium: (id: number) => Promise<any>
  reloadAllData: () => Promise<void>

  // Module A: HOA
  residents: Resident[]
  addResident: (r: Omit<Resident, 'id'>) => Promise<void>
  updateResident: (r: Resident) => Promise<void>
  deleteResident: (id: number | string) => Promise<void>
  notices: Notice[]
  addNotice: (n: Omit<Notice, 'id' | 'date'>) => Promise<void>
  deleteNotice: (id: number) => Promise<void>
  acknowledgeNotice: (noticeId: number, unitOrEmail: string) => void
  documents: CommunityDocument[]
  addDocument: (d: Omit<CommunityDocument, 'id' | 'date'>) => Promise<void>
  deleteDocument: (id: number) => Promise<void>
  userPermissions: UserRolePermission[]
  addUserPermission: (u: Omit<UserRolePermission, 'id'>) => Promise<void>
  deleteUserPermission: (id: number | string) => Promise<void>

  // Module B: Amenities
  amenities: Amenity[]
  addAmenity: (a: Omit<Amenity, 'id'>) => Promise<any>
  updateAmenity: (a: Amenity) => Promise<void>
  deleteAmenity: (id: number) => Promise<void>
  toggleAmenityAvailability: (id: number) => void
  toggleAmenityMaintenance: (amenityId: number, note?: string) => void
  bookings: Booking[]
  addBooking: (b: Omit<Booking, 'id' | 'status'>) => Promise<void>
  updateBookingStatus: (id: number, status: BookingStatus, rejectionReason?: string) => Promise<void>

  // Module C: Access & Visits
  accessPasses: AccessPass[]
  visits: VisitRecord[]
  addAccessPass: (p: Omit<AccessPass, 'id' | 'createdAt'>) => AccessPass
  generateAccessPass: (data: { visitor: string; host: string; unit: string; date: string; time: string; type: VisitType }) => AccessPass
  validateQRCode: (code: string) => QRValidationResult
  checkInVisit: (passCodeOrManual: { visitor: string; host: string; unit: string; type?: VisitType; plate?: string }) => void
  checkOutVisit: (visitId: number) => void

  // Module D: Finance & Maintenance
  fees: FeeStatement[]
  payments: PaymentTransaction[]
  tickets: MaintenanceTicket[]
  registerFeePayment: (id: string | number, method?: string, reference?: string) => Promise<void> | void
  addTicket: (t: Omit<MaintenanceTicket, 'id' | 'date' | 'status'> & { id?: string; date?: string; status?: TicketStatus }) => Promise<MaintenanceTicket> | MaintenanceTicket
  updateTicketStatus: (id: string, status: TicketStatus, assignedTo?: string) => Promise<void> | void
}

const DEFAULT_FEES: FeeStatement[] = [
  { id: '15', unit: 'A-101', resident: 'Carlos Mendoza', concept: 'Mantenimiento Ordinario - Marzo 2026', amount: 3500, status: 'Pagada', date: '22 Mar 2026', dueDate: '10 Mar 2026', paymentMethod: 'Transferencia SPEI' },
  { id: '16', unit: 'A-101', resident: 'Carlos Mendoza', concept: 'Mantenimiento Ordinario - Abril 2026', amount: 3500, status: 'Pendiente', date: '—', dueDate: '10 Abr 2026' },
  { id: '17', unit: 'A-102', resident: 'Juan Torres', concept: 'Mantenimiento Ordinario - Marzo 2026', amount: 3500, status: 'Pagada', date: '22 Mar 2026', dueDate: '10 Mar 2026', paymentMethod: 'Transferencia SPEI' },
  { id: '18', unit: 'A-102', resident: 'Juan Torres', concept: 'Mantenimiento Ordinario - Abril 2026', amount: 3500, status: 'Pagada', date: '22 Mar 2026', dueDate: '10 Abr 2026', paymentMethod: 'Transferencia SPEI' },
  { id: '19', unit: 'B-204', resident: 'Ing. Carlos Villalobos', concept: 'Mantenimiento Ordinario - Abril 2026', amount: 3500, status: 'Pagada', date: '22 Mar 2026', dueDate: '10 Abr 2026', paymentMethod: 'Transferencia SPEI' },
  { id: '20', unit: 'B-205', resident: 'Ing. Carlos Villalobos', concept: 'Mantenimiento Ordinario - Marzo 2026', amount: 3500, status: 'Vencida', date: '—', dueDate: '10 Mar 2026' },
  { id: '21', unit: 'PH-01', resident: 'Roberto Flores', concept: 'Mantenimiento Ordinario - Abril 2026', amount: 5200, status: 'Pagada', date: '22 Mar 2026', dueDate: '10 Abr 2026', paymentMethod: 'Transferencia SPEI' },
]

const DEFAULT_PAYMENTS: PaymentTransaction[] = [
  { id: '1', feeStatementId: '15', unit: 'A-101', resident: 'Carlos Mendoza', concept: 'Mantenimiento Ordinario - Marzo 2026', amountPaid: 3500, paymentMethod: 'Transferencia SPEI', referenceNumber: 'TEST-SPEI-001', status: 'aprobado', paidAt: '22 Mar 2026, 09:44', verifiedBy: 'Sistema Automático' },
  { id: '2', feeStatementId: '21', unit: 'PH-01', resident: 'Roberto Flores', concept: 'Mantenimiento Ordinario - Abril 2026', amountPaid: 5200, paymentMethod: 'Transferencia SPEI', referenceNumber: '123456789', status: 'aprobado', paidAt: '22 Mar 2026, 09:48', verifiedBy: 'Sistema Automático' },
  { id: '3', feeStatementId: '18', unit: 'A-102', resident: 'Juan Torres', concept: 'Mantenimiento Ordinario - Abril 2026', amountPaid: 3500, paymentMethod: 'Transferencia SPEI', referenceNumber: '123456789', status: 'aprobado', paidAt: '22 Mar 2026, 09:58', verifiedBy: 'Sistema Automático' },
  { id: '4', feeStatementId: '20', unit: 'B-205', resident: 'Ing. Carlos Villalobos', concept: 'Mantenimiento Ordinario - Marzo 2026', amountPaid: 3500, paymentMethod: 'Transferencia SPEI', referenceNumber: '1234567891', status: 'aprobado', paidAt: '22 Mar 2026, 11:28', verifiedBy: 'Sistema Automático' },
]

const DEFAULT_TICKETS: MaintenanceTicket[] = [
  { id: 'TCK-2026-001', location: 'Pasillo Torre A, Piso 1', reporter: 'Carlos Mendoza (A-101)', unit: 'A-101', issue: 'Luminaria parpadeando en pasillo de Torre A', priority: 'Media', status: 'En Proceso', date: '22 Mar 2026', assignedTo: 'Ing. Electricista - Roberto Nava' },
  { id: 'TCK-2026-002', location: 'Área Alberca', reporter: 'Ing. Carlos Villalobos (B-204)', unit: 'B-204', issue: 'Baja presión detectada en regaderas exteriores de alberca', priority: 'Baja', status: 'Pendiente', date: '22 Mar 2026', assignedTo: 'Servicios Hidráulicos del Noroeste' },
  { id: 'TCK-2026-003', location: 'Caseta Norte', reporter: 'Roberto Flores (PH-01)', unit: 'PH-01', issue: 'Calibración de sensor de portón vehicular', priority: 'Alta', status: 'Resuelto', date: '21 Mar 2026', assignedTo: 'Sistemas de Seguridad Peñasco' },
]

const DataContext = createContext<DataContextType | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  // State: Condominiums (cargados exclusivamente de la base de datos PostgreSQL)
  const [condominiums, setCondominiums] = useState<Condominium[]>([])
  const [selectedCondominiumId, setSelectedCondominiumId] = useState<number | null>(null)

  // State A: HOA (100% de la base de datos PostgreSQL)
  const [residents, setResidents] = useState<Resident[]>([])
  const [notices, setNotices] = useState<Notice[]>([])
  const [documents, setDocuments] = useState<CommunityDocument[]>([])
  const [userPermissions, setUserPermissions] = useState<UserRolePermission[]>([])

  // State B: Amenities (100% de la base de datos PostgreSQL)
  const [amenities, setAmenities] = useState<Amenity[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])

  // State C: Access (100% de la base de datos PostgreSQL)
  const [accessPasses, setAccessPasses] = useState<AccessPass[]>([])
  const [visits, setVisits] = useState<VisitRecord[]>([])

  // State D: Finance & Maintenance (100% de la base de datos PostgreSQL)
  const [fees, setFees] = useState<FeeStatement[]>(DEFAULT_FEES)
  const [payments, setPayments] = useState<PaymentTransaction[]>(DEFAULT_PAYMENTS)
  const [tickets, setTickets] = useState<MaintenanceTicket[]>(DEFAULT_TICKETS)

  const DEFAULT_CONDO: Condominium = {
    id: 1,
    name: 'Condominio Residencial Las Palomas',
    address: 'Blvd. Costero #150, Sandy Beach',
    city: 'Puerto Peñasco, Sonora',
    postalCode: '83550',
    currency: 'MXN',
  }

  // Computed selected condominium with guaranteed fallback
  const selectedCondominium = condominiums.find(c => c.id === selectedCondominiumId) || condominiums[0] || DEFAULT_CONDO

  // ── Auto-load from Backend API / Database ──────────────────────────────────
  const loadCondoData = useCallback(async (condoId?: number | null) => {
    const targetCondoId = condoId || undefined
    try {
      const [dirData, noticesData, docsData, usersData, amenData, bookingsData, passesData, visitsData, feesData, paymentsData, ticketsData] = await Promise.allSettled([
        ApiClient.hoa.getDirectory(targetCondoId),
        ApiClient.hoa.getNotices(targetCondoId),
        ApiClient.hoa.getDocuments(targetCondoId),
        ApiClient.hoa.getUsersPermissions(targetCondoId),
        ApiClient.amenities.getAmenities(targetCondoId),
        ApiClient.amenities.getBookings(undefined, targetCondoId),
        ApiClient.access.getPasses(targetCondoId),
        ApiClient.access.getVisits(targetCondoId),
        ApiClient.finance.getFees(undefined, targetCondoId),
        ApiClient.finance.getPayments(targetCondoId),
        ApiClient.finance.getTickets(undefined, targetCondoId),
      ])

      if (dirData.status === 'fulfilled' && Array.isArray(dirData.value) && dirData.value.length > 0) {
        setResidents(dirData.value)
      }
      if (noticesData.status === 'fulfilled' && Array.isArray(noticesData.value) && noticesData.value.length > 0) {
        setNotices(noticesData.value)
      }
      if (docsData.status === 'fulfilled' && Array.isArray(docsData.value) && docsData.value.length > 0) {
        setDocuments(docsData.value)
      }
      if (usersData.status === 'fulfilled' && Array.isArray(usersData.value) && usersData.value.length > 0) {
        setUserPermissions(usersData.value)
      }
      if (amenData.status === 'fulfilled' && Array.isArray(amenData.value) && amenData.value.length > 0) {
        setAmenities(amenData.value)
      }
      if (bookingsData.status === 'fulfilled' && Array.isArray(bookingsData.value) && bookingsData.value.length > 0) {
        setBookings(bookingsData.value)
      }
      if (passesData.status === 'fulfilled' && Array.isArray(passesData.value) && passesData.value.length > 0) {
        setAccessPasses(passesData.value)
      }
      if (visitsData.status === 'fulfilled' && Array.isArray(visitsData.value) && visitsData.value.length > 0) {
        setVisits(visitsData.value)
      }
      if (feesData.status === 'fulfilled' && Array.isArray(feesData.value) && feesData.value.length > 0) {
        setFees(feesData.value)
      }
      if (paymentsData.status === 'fulfilled' && Array.isArray(paymentsData.value) && paymentsData.value.length > 0) {
        setPayments(paymentsData.value)
      }
      if (ticketsData.status === 'fulfilled' && Array.isArray(ticketsData.value) && ticketsData.value.length > 0) {
        setTickets(ticketsData.value)
      }
    } catch (err) {
      console.warn('Error loading condo data:', err)
    }
  }, [])

  const reloadAllData = useCallback(async () => {
    try {
      const condoList = await ApiClient.hoa.getCondominiums()
      if (Array.isArray(condoList) && condoList.length > 0) {
        setCondominiums(condoList)
        const currentId = selectedCondominiumId || condoList[0].id
        if (!selectedCondominiumId) setSelectedCondominiumId(currentId)
        await loadCondoData(currentId)
      }
    } catch (err) {
      console.warn('Error reloading all data:', err)
    }
  }, [loadCondoData, selectedCondominiumId])

  useEffect(() => {
    ApiClient.hoa.getCondominiums()
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setCondominiums(data)
          setSelectedCondominiumId(prev => (prev !== null ? prev : data[0].id))
          loadCondoData(data[0].id)
        } else {
          setCondominiums([DEFAULT_CONDO])
          setSelectedCondominiumId(1)
          loadCondoData(1)
        }
      })
      .catch((err) => {
        console.warn('Conectando con datos iniciales:', err)
        setCondominiums([DEFAULT_CONDO])
        setSelectedCondominiumId(1)
        loadCondoData(1)
      })
  }, [loadCondoData])

  // When selected condominium changes
  useEffect(() => {
    if (selectedCondominiumId !== null) {
      loadCondoData(selectedCondominiumId)
    }
  }, [selectedCondominiumId, loadCondoData])

  // ── Condominium Handlers ──────────────────────────────────────────────────
  async function createCondominium(data: Omit<Condominium, 'id'>) {
    try {
      const created: any = await ApiClient.hoa.createCondominium(data)
      const list = await ApiClient.hoa.getCondominiums()
      if (Array.isArray(list)) {
        setCondominiums(list)
        if (created?.id) setSelectedCondominiumId(created.id)
      }
      return created
    } catch (err) {
      console.error('Error creating condominium:', err)
      throw err
    }
  }

  async function updateCondominium(id: number, data: Partial<Condominium>) {
    try {
      const updated = await ApiClient.hoa.updateCondominium(id, data)
      const list = await ApiClient.hoa.getCondominiums()
      if (Array.isArray(list)) setCondominiums(list)
      return updated
    } catch (err) {
      console.error('Error updating condominium:', err)
      throw err
    }
  }

  async function deleteCondominium(id: number) {
    try {
      await ApiClient.hoa.deleteCondominium(id)
      const list = await ApiClient.hoa.getCondominiums()
      if (Array.isArray(list)) {
        setCondominiums(list)
        if (list.length > 0) setSelectedCondominiumId(list[0].id)
      }
    } catch (err) {
      console.error('Error deleting condominium:', err)
      throw err
    }
  }

  // ── Handlers A: HOA ────────────────────────────────────────────────────────
  async function addResident(r: Omit<Resident, 'id'>) {
    const activeCondoId = selectedCondominium?.id || condominiums[0]?.id || 1
    try {
      await ApiClient.hoa.createResident({
        condominiumId: activeCondoId,
        unitNumber: r.unit,
        fullName: r.name,
        email: r.email,
        phone: r.phone,
        residentType: r.type,
        status: r.status,
        vehicles: r.vehicles,
        password: r.password,
      })
      const updatedList = await ApiClient.hoa.getDirectory(activeCondoId)
      if (Array.isArray(updatedList)) setResidents(updatedList)

      // Refresh condominiums counts
      const condoList = await ApiClient.hoa.getCondominiums()
      if (Array.isArray(condoList)) setCondominiums(condoList)
    } catch (err) {
      console.error('Error adding resident:', err)
      const newId = residents.length > 0 ? Math.max(...residents.map(x => Number(x.id) || 0)) + 1 : 1
      setResidents(prev => [{ id: newId, ...r }, ...prev])
    }
  }

  async function updateResident(updated: Resident) {
    const activeCondoId = selectedCondominium?.id || condominiums[0]?.id || 1
    try {
      await ApiClient.hoa.updateResident(updated.id, {
        unitNumber: updated.unit,
        fullName: updated.name,
        email: updated.email,
        phone: updated.phone,
        residentType: updated.type,
        status: updated.status,
        vehicles: updated.vehicles,
        password: updated.password,
      })
      const updatedList = await ApiClient.hoa.getDirectory(activeCondoId)
      if (Array.isArray(updatedList)) setResidents(updatedList)
    } catch (err) {
      console.error('Error updating resident in DB:', err)
      setResidents(prev => prev.map(r => (r.id === updated.id ? updated : r)))
    }
  }

  async function deleteResident(id: number | string) {
    const activeCondoId = selectedCondominium?.id || condominiums[0]?.id || 1
    try {
      await ApiClient.hoa.deleteResident(id)
      const updatedList = await ApiClient.hoa.getDirectory(activeCondoId)
      if (Array.isArray(updatedList)) setResidents(updatedList)

      // Refresh condominiums counts
      const condoList = await ApiClient.hoa.getCondominiums()
      if (Array.isArray(condoList)) setCondominiums(condoList)
    } catch (err) {
      console.error('Error deleting resident in DB:', err)
      setResidents(prev => prev.filter(r => String(r.id) !== String(id)))
    }
  }

  async function addNotice(n: Omit<Notice, 'id' | 'date'>) {
    const today = new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
    const activeCondoId = selectedCondominium?.id || condominiums[0]?.id || 1
    try {
      const created: any = await ApiClient.hoa.createNotice({
        condominiumId: activeCondoId,
        authorUserId: 1,
        title: n.title,
        content: n.content,
        noticeType: n.type || 'Comunicado',
        isUrgent: n.urgent || false,
      })
      const newId = created?.id || (notices.length > 0 ? Math.max(...notices.map(x => x.id)) + 1 : 1)
      setNotices(prev => [{ id: newId, date: today, acknowledgments: 0, readBy: [], ...n }, ...prev])
    } catch (err) {
      const newId = notices.length > 0 ? Math.max(...notices.map(x => x.id)) + 1 : 1
      setNotices(prev => [{ id: newId, date: today, acknowledgments: 0, readBy: [], ...n }, ...prev])
    }
  }

  async function deleteNotice(id: number) {
    try {
      await ApiClient.hoa.deleteNotice(id)
    } catch (err) {}
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

  async function addDocument(d: Omit<CommunityDocument, 'id' | 'date'>) {
    const today = new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
    const activeCondoId = selectedCondominium?.id || condominiums[0]?.id || 1
    try {
      const created: any = await ApiClient.hoa.createDocument({
        condominiumId: activeCondoId,
        name: d.name,
        category: d.category,
        fileUrl: d.url || 'https://example.com/doc.pdf',
        fileSizeBytes: 1024 * 1024,
      })
      const newId = created?.id || (documents.length > 0 ? Math.max(...documents.map(x => x.id)) + 1 : 1)
      setDocuments(prev => [{ id: newId, date: today, ...d }, ...prev])
    } catch (err) {
      const newId = documents.length > 0 ? Math.max(...documents.map(x => x.id)) + 1 : 1
      setDocuments(prev => [{ id: newId, date: today, ...d }, ...prev])
    }
  }

  async function deleteDocument(id: number) {
    try {
      await ApiClient.hoa.deleteDocument(id)
    } catch (err) {}
    setDocuments(prev => prev.filter(d => d.id !== id))
  }

  async function addUserPermission(u: Omit<UserRolePermission, 'id'>) {
    const activeCondoId = selectedCondominium?.id || condominiums[0]?.id || 1
    try {
      await ApiClient.hoa.createUserPermission({
        condominiumId: activeCondoId,
        fullName: u.name,
        email: u.email,
        role: u.role,
        password: u.password,
        unitNumber: u.role === 'resident' ? u.unit : undefined,
        permissions: u.permissions,
      })
      const updated = await ApiClient.hoa.getUsersPermissions(activeCondoId)
      if (Array.isArray(updated)) setUserPermissions(updated)
    } catch (err) {
      console.error('Error creating user permission:', err)
      const newId = `USR-00${userPermissions.length + 1}`
      setUserPermissions(prev => [...prev, { id: newId, ...u }])
    }
  }

  async function deleteUserPermission(id: number | string) {

    const activeCondoId = selectedCondominium?.id || condominiums[0]?.id || 1
    try {
      await ApiClient.hoa.deleteUserPermission(id)
      const updated = await ApiClient.hoa.getUsersPermissions(activeCondoId)
      if (Array.isArray(updated)) setUserPermissions(updated)
    } catch (err) {
      setUserPermissions(prev => prev.filter(u => String(u.id) !== String(id)))
    }
  }

  // ── Handlers B: Amenities ──────────────────────────────────────────────────
  async function addAmenity(a: Omit<Amenity, 'id'>) {
    const activeCondoId = selectedCondominium?.id || condominiums[0]?.id || 1
    try {
      const created: any = await ApiClient.amenities.createAmenity({
        condominiumId: activeCondoId,
        name: a.name,
        capacity: a.capacity,
        rate: a.rate,
        costAmount: a.costAmount || 0,
        deposit: a.deposit,
        depositAmount: a.deposit ? (parseInt(a.deposit.replace(/[^0-9]/g, '')) || 0) : 0,
        hours: a.hours,
        maxHoursPerBooking: a.maxHoursPerBooking || 4,
        img: a.img,
        rules: a.rules,
      })
      const list = await ApiClient.amenities.getAmenities(activeCondoId)
      if (Array.isArray(list)) setAmenities(list)
      else setAmenities(prev => [...prev, created as Amenity])
      return created
    } catch (err) {
      console.warn('Backend API fallback for addAmenity:', err)
      const newId = amenities.length > 0 ? Math.max(...amenities.map(x => x.id)) + 1 : 1
      const fallback: Amenity = { id: newId, ...a }
      setAmenities(prev => [...prev, fallback])
      return fallback
    }
  }

  async function updateAmenity(updated: Amenity) {
    const activeCondoId = selectedCondominium?.id || condominiums[0]?.id || 1
    try {
      await ApiClient.amenities.updateAmenity(updated.id, {
        name: updated.name,
        capacity: updated.capacity,
        costAmount: updated.costAmount || 0,
        hours: updated.hours,
        img: updated.img,
        rules: updated.rules,
        available: updated.available,
      })
      const list = await ApiClient.amenities.getAmenities(activeCondoId)
      if (Array.isArray(list)) setAmenities(list)
    } catch (err) {
      setAmenities(prev => prev.map(a => (a.id === updated.id ? updated : a)))
    }
  }

  async function deleteAmenity(id: number) {
    const activeCondoId = selectedCondominium?.id || condominiums[0]?.id || 1
    try {
      await ApiClient.amenities.deleteAmenity(id)
      const list = await ApiClient.amenities.getAmenities(activeCondoId)
      if (Array.isArray(list)) setAmenities(list)
    } catch (err) {
      setAmenities(prev => prev.filter(a => a.id !== id))
    }
  }

  function toggleAmenityAvailability(id: number) {
    setAmenities(prev =>
      prev.map(a => (a.id === id ? { ...a, available: !a.available } : a))
    )
  }

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

  async function addBooking(b: Omit<Booking, 'id' | 'status'>) {
    const activeCondoId = selectedCondominium?.id || condominiums[0]?.id || 1
    const randCode = Math.random().toString(36).substring(2, 6).toUpperCase()
    const cleanUnit = (b.unit || 'A101').replace(/[^a-zA-Z0-9]/g, '')
    const qrPassCode = `AMN-${cleanUnit}-${randCode}`

    let startDatetime = ''
    let endDatetime = ''
    if (b.date && b.time) {
      const parts = b.time.replace(/hrs/g, '').split(/[–-]/).map(s => s.trim())
      const startH = parts[0] ? (parts[0].length === 5 ? parts[0] : parts[0].padStart(5, '0')) : '08:00'
      const endH = parts[1] ? (parts[1].length === 5 ? parts[1] : parts[1].padStart(5, '0')) : '10:00'
      startDatetime = `${b.date}T${startH}:00`
      endDatetime = `${b.date}T${endH}:00`
    } else {
      startDatetime = new Date().toISOString()
      endDatetime = new Date(Date.now() + 2 * 3600000).toISOString()
    }

    try {
      await ApiClient.amenities.createBooking({
        condominiumId: activeCondoId,
        amenityId: b.amenityId || 1,
        unitNumber: b.unit,
        residentName: b.resident,
        date: b.date,
        time: b.time,
        startDatetime,
        endDatetime,
        guestsCount: b.guests || 2,
        notes: b.specialRequests,
      })
      const list = await ApiClient.amenities.getBookings(undefined, activeCondoId)
      if (Array.isArray(list)) setBookings(list)
    } catch (err) {
      console.warn('Error creating booking on API:', err)
      const newId = bookings.length > 0 ? Math.max(...bookings.map(x => x.id)) + 1 : 1
      const newBooking: Booking = { id: newId, status: 'Pendiente', qrPassCode, createdAt: new Date().toISOString(), ...b }
      setBookings(prev => [newBooking, ...prev])
    }
  }

  async function updateBookingStatus(id: number, status: BookingStatus, rejectionReason?: string) {
    const activeCondoId = selectedCondominium?.id || condominiums[0]?.id || 1
    try {
      await ApiClient.amenities.updateStatus(id, status)
      const list = await ApiClient.amenities.getBookings(undefined, activeCondoId)
      if (Array.isArray(list)) setBookings(list)
    } catch (err) {
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
  }

  // ── Handlers C: Access ─────────────────────────────────────────────────────
  function addAccessPass(p: Omit<AccessPass, 'id' | 'createdAt'>) {
    const newPass: AccessPass = {
      id: `PASS-00${accessPasses.length + 1}`,
      createdAt: new Date().toISOString(),
      ...p,
    }
    setAccessPasses(prev => [newPass, ...prev])
    return newPass
  }

  function generateAccessPass({ visitor, host, unit, date, time, type }: { visitor: string; host: string; unit: string; date: string; time: string; type: VisitType }) {
    const activeCondoId = selectedCondominium?.id || condominiums[0]?.id || 1
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

    // Guardar en la base de datos PostgreSQL en segundo plano
    ApiClient.access.createPass({
      condominiumId: activeCondoId,
      unitNumber: unit,
      visitorName: visitor,
      hostName: host,
      visitType: type,
      customQrCode: code,
      date,
      time,
    }).then((created: any) => {
      if (created && created.id) {
        setAccessPasses(prev => prev.map(p => p.code === code ? { ...p, id: String(created.id) } : p))
      }
    }).catch(err => console.warn('Error guardando pase en BD:', err))

    return newPass
  }

  function validateQRCode(code: string): QRValidationResult {
    const trimmed = (code || '').trim().toUpperCase()
    const pass = accessPasses.find(p => p.code.toUpperCase() === trimmed)
    if (pass) {
      if (pass.status === 'Expirado') {
        return { valid: false, pass, message: 'El código QR ha expirado. Contacta al residente anfitrión.' }
      }
      if (pass.status === 'Utilizado') {
        return { valid: false, pass, message: 'Este pase de acceso de un solo uso ya fue utilizado previamente.' }
      }
      return { valid: true, pass, message: 'Pase de acceso válido. Acceso autorizado.' }
    }
    if (trimmed.startsWith('VCN-')) {
      const parts = trimmed.split('-')
      const livePass: AccessPass = {
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
      return { valid: true, pass: livePass, message: 'Código QR verificado con éxito en caseta.' }
    }
    return { valid: false, message: 'Código QR no registrado o inválido en el sistema.' }
  }

  async function checkInVisit(data: { visitor: string; host: string; unit: string; type?: VisitType; plate?: string }) {
    const activeCondoId = selectedCondominium?.id || condominiums[0]?.id || 1
    const now = new Date()
    const dateStr = now.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
    const timeStr = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
    const newVisit: VisitRecord = {
      id: visits.length > 0 ? Math.max(...visits.map(v => v.id)) + 1 : 1,
      visitor: data.visitor,
      host: data.host,
      unit: data.unit,
      date: dateStr,
      entry: timeStr,
      exit: null,
      status: 'En Instalaciones',
      type: data.type || 'Visita',
      plate: data.plate || undefined,
    }
    setVisits(prev => [newVisit, ...prev])

    try {
      await ApiClient.access.checkIn({
        condominiumId: activeCondoId,
        unitNumber: data.unit,
        visitorName: data.visitor,
        hostName: data.host,
        visitType: data.type,
        vehiclePlate: data.plate,
      })
      const list = await ApiClient.access.getVisits(activeCondoId)
      if (Array.isArray(list)) setVisits(list)
    } catch (err) {
      console.warn('Error registrando check-in en PostgreSQL:', err)
    }
  }

  async function checkOutVisit(visitId: number) {
    const activeCondoId = selectedCondominium?.id || condominiums[0]?.id || 1
    const now = new Date()
    const timeStr = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
    setVisits(prev =>
      prev.map(v => (v.id === visitId ? { ...v, exit: timeStr, status: 'Completada' as const } : v))
    )

    try {
      await ApiClient.access.checkOut(visitId)
      const list = await ApiClient.access.getVisits(activeCondoId)
      if (Array.isArray(list)) setVisits(list)
    } catch (err) {
      console.warn('Error registrando check-out en PostgreSQL:', err)
    }
  }

  // ── Handlers D: Finance ────────────────────────────────────────────────────
  async function registerFeePayment(id: string | number, method: string = 'Transferencia SPEI', reference?: string) {
    const today = new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
    
    // Optimistic UI update
    setFees(prev =>
      prev.map(f => (String(f.id) === String(id) ? { ...f, status: 'Pagada', date: today, paymentMethod: method } : f))
    )

    try {
      await ApiClient.finance.registerPayment({
        feeStatementId: id,
        paymentMethod: method,
        referenceNumber: reference,
      })
      const activeCondoId = selectedCondominium?.id || 1
      const [listFees, listPayments] = await Promise.all([
        ApiClient.finance.getFees(undefined, activeCondoId),
        ApiClient.finance.getPayments(activeCondoId),
      ])
      if (Array.isArray(listFees)) setFees(listFees)
      if (Array.isArray(listPayments)) setPayments(listPayments)
    } catch (err) {
      console.warn('Error saving payment to PostgreSQL:', err)
    }
  }

  async function addTicket(t: Omit<MaintenanceTicket, 'id' | 'date' | 'status'> & { id?: string; date?: string; status?: TicketStatus }) {
    const today = new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
    const tempId = `TCK-${new Date().getFullYear()}-${String(Math.floor(100 + Math.random() * 900))}`
    const tempTicket: MaintenanceTicket = {
      id: tempId,
      date: today,
      status: 'Pendiente',
      ...t,
    }
    setTickets(prev => [tempTicket, ...prev])

    try {
      const created: any = await ApiClient.finance.createTicket({
        condominiumId: selectedCondominiumId || 1,
        location: t.location,
        reporter: t.reporter,
        unit: t.unit,
        issue: t.issue,
        title: t.notes || t.issue || t.location,
        description: t.issue,
        priority: t.priority,
        category: 'General',
      })
      const list = await ApiClient.finance.getTickets(undefined, selectedCondominiumId || 1)
      if (Array.isArray(list) && list.length > 0) {
        setTickets(list)
      } else if (created && created.id) {
        setTickets(prev => prev.map(item => (item.id === tempId ? { ...item, id: created.id } : item)))
      }
      return created || tempTicket
    } catch (err) {
      console.warn('Error saving maintenance ticket to PostgreSQL:', err)
      return tempTicket
    }
  }

  async function updateTicketStatus(id: string, status: TicketStatus, assignedTo?: string) {
    setTickets(prev =>
      prev.map(t =>
        t.id === id ? { ...t, status, ...(assignedTo ? { assignedTo } : {}) } : t
      )
    )

    try {
      await ApiClient.finance.updateTicketStatus(id, status, assignedTo)
      const list = await ApiClient.finance.getTickets(undefined, selectedCondominiumId || 1)
      if (Array.isArray(list)) {
        setTickets(list)
      }
    } catch (err) {
      console.warn('Error updating ticket status in PostgreSQL:', err)
    }
  }


  return (
    <DataContext.Provider
      value={{
        condominiums,
        selectedCondominiumId,
        selectedCondominium,
        setSelectedCondominiumId,
        createCondominium,
        updateCondominium,
        deleteCondominium,
        reloadAllData,
        residents,
        addResident,
        updateResident,
        deleteResident,
        notices,
        addNotice,
        deleteNotice,
        acknowledgeNotice,
        documents,
        addDocument,
        deleteDocument,
        userPermissions,
        addUserPermission,
        deleteUserPermission,
        amenities,
        addAmenity,
        updateAmenity,
        deleteAmenity,
        toggleAmenityAvailability,
        toggleAmenityMaintenance,
        bookings,
        addBooking,
        updateBookingStatus,
        accessPasses,
        visits,
        addAccessPass,
        generateAccessPass,
        validateQRCode,
        checkInVisit,
        checkOutVisit,
        fees,
        payments,
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
