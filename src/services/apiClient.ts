/**
 * Cliente HTTP Frontend para consumir el backend de VeciLomas (Server)
 * Diseñado con interfaces idénticas a DataContext para sincronización directa con PostgreSQL.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  const json = await res.json()
  if (!res.ok || json.success === false) {
    throw new Error(json.error || json.message || 'Error en la petición al servidor')
  }
  return json.data !== undefined ? json.data : json
}

export const ApiClient = {
  // Autenticación Real PostgreSQL
  auth: {
    login: (credentials: { identifier?: string; email?: string; password: string; role?: string }) =>
      request<any>('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
    getUsers: (role?: string) => request<any[]>(`/auth/users${role ? `?role=${role}` : ''}`),
  },

  // HOA & Residentes & Condominios
  hoa: {
    getCondominiums: () => request<any[]>('/hoa/condominiums'),
    createCondominium: (data: any) => request('/hoa/condominiums', { method: 'POST', body: JSON.stringify(data) }),
    updateCondominium: (id: number, data: any) => request(`/hoa/condominiums/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteCondominium: (id: number) => request(`/hoa/condominiums/${id}`, { method: 'DELETE' }),

    getDirectory: (condoId?: number | string) => request<any[]>(`/hoa/directory${condoId ? `?condoId=${condoId}` : ''}`),
    createResident: (data: any) => request('/hoa/residents', { method: 'POST', body: JSON.stringify(data) }),
    updateResident: (id: number | string, data: any) => request(`/hoa/residents/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteResident: (id: number | string) => request(`/hoa/residents/${id}`, { method: 'DELETE' }),

    getNotices: (condoId?: number | string) => request<any[]>(`/hoa/notices${condoId ? `?condoId=${condoId}` : ''}`),
    createNotice: (data: any) => request('/hoa/notices', { method: 'POST', body: JSON.stringify(data) }),
    deleteNotice: (id: number) => request(`/hoa/notices/${id}`, { method: 'DELETE' }),

    getDocuments: (condoId?: number | string) => request<any[]>(`/hoa/documents${condoId ? `?condoId=${condoId}` : ''}`),
    createDocument: (data: any) => request('/hoa/documents', { method: 'POST', body: JSON.stringify(data) }),
    deleteDocument: (id: number) => request(`/hoa/documents/${id}`, { method: 'DELETE' }),

    getUsersPermissions: (condoId?: number | string) => request<any[]>(`/hoa/users-permissions${condoId ? `?condoId=${condoId}` : ''}`),
    createUserPermission: (data: any) => request('/hoa/users-permissions', { method: 'POST', body: JSON.stringify(data) }),
    deleteUserPermission: (id: number | string) => request(`/hoa/users-permissions/${id}`, { method: 'DELETE' }),
  },

  // Amenidades & Reservaciones
  amenities: {
    getAmenities: (condoId?: number | string) => request<any[]>(`/amenities${condoId ? `?condoId=${condoId}` : ''}`),
    createAmenity: (data: any) => request('/amenities', { method: 'POST', body: JSON.stringify(data) }),
    updateAmenity: (id: number | string, data: any) => request(`/amenities/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteAmenity: (id: number | string) => request(`/amenities/${id}`, { method: 'DELETE' }),

    getBookings: (unitId?: string, condoId?: number | string) => {
      const params = new URLSearchParams()
      if (unitId) params.append('unitId', unitId)
      if (condoId) params.append('condoId', String(condoId))
      const q = params.toString()
      return request<any[]>(`/amenities/bookings${q ? `?${q}` : ''}`)
    },
    checkAvailability: (amenityId: number, start: string, end: string) =>
      request<{ available: boolean; conflictReason?: string }>(
        `/amenities/availability?amenityId=${amenityId}&startDatetime=${start}&endDatetime=${end}`
      ),
    createBooking: (data: any) => request('/amenities/bookings', { method: 'POST', body: JSON.stringify(data) }),
    updateStatus: (bookingId: number, status: string, approvedByUserId?: string) =>
      request(`/amenities/bookings/${bookingId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, approvedByUserId }),
      }),
  },

  // Control de Accesos & Bitácora
  access: {
    getPasses: (condoId?: number | string) => request<any[]>(`/access/passes${condoId ? `?condoId=${condoId}` : ''}`),
    createPass: (data: any) => request('/access/passes', { method: 'POST', body: JSON.stringify(data) }),
    validateQR: (code: string) => request('/access/validate-qr', { method: 'POST', body: JSON.stringify({ code }) }),
    getVisits: (condoId?: number | string, status?: string) => {
      const params = new URLSearchParams()
      if (condoId) params.append('condoId', String(condoId))
      if (status) params.append('status', status)
      const q = params.toString()
      return request<any[]>(`/access/visits${q ? `?${q}` : ''}`)
    },
    checkIn: (data: any) => request('/access/check-in', { method: 'POST', body: JSON.stringify(data) }),
    checkOut: (visitId: number) => request(`/access/check-out/${visitId}`, { method: 'POST' }),
  },

  // Finanzas & Tickets
  finance: {
    getFees: (unitId?: string, condoId?: string | number) => {
      const params = new URLSearchParams()
      if (condoId) params.append('condoId', String(condoId))
      if (unitId) params.append('unitId', unitId)
      const q = params.toString()
      return request<any[]>(`/finance/fees${q ? `?${q}` : ''}`)
    },
    getPayments: (condoId?: string | number, unitId?: string) => {
      const params = new URLSearchParams()
      if (condoId) params.append('condoId', String(condoId))
      if (unitId) params.append('unitId', unitId)
      const q = params.toString()
      return request<any[]>(`/finance/payments${q ? `?${q}` : ''}`)
    },
    registerPayment: (data: any) => request('/finance/payments', { method: 'POST', body: JSON.stringify(data) }),
    getTickets: (unitId?: string, condoId?: string | number) => {
      const params = new URLSearchParams()
      if (condoId) params.append('condoId', String(condoId))
      if (unitId) params.append('unitId', unitId)
      const q = params.toString()
      return request<any[]>(`/finance/tickets${q ? `?${q}` : ''}`)
    },
    createTicket: (data: any) => request('/finance/tickets', { method: 'POST', body: JSON.stringify(data) }),
    updateTicketStatus: (id: string | number, status: string, assignedTo?: string) =>
      request(`/finance/tickets/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, assignedTo }),
      }),

  },
}
