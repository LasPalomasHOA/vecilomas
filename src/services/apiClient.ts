/**
 * Cliente HTTP Frontend para consumir el backend de VeciLomas (Server)
 * Diseñado con interfaces idénticas a DataContext para facilitar la transición a BD.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

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
  // HOA & Residentes
  hoa: {
    getDirectory: () => request<any[]>('/hoa/directory'),
    createResident: (data: any) => request('/hoa/residents', { method: 'POST', body: JSON.stringify(data) }),
    getNotices: () => request<any[]>('/hoa/notices'),
    createNotice: (data: any) => request('/hoa/notices', { method: 'POST', body: JSON.stringify(data) }),
    deleteNotice: (id: number) => request(`/hoa/notices/${id}`, { method: 'DELETE' }),
    getDocuments: () => request<any[]>('/hoa/documents'),
    createDocument: (data: any) => request('/hoa/documents', { method: 'POST', body: JSON.stringify(data) }),
    deleteDocument: (id: number) => request(`/hoa/documents/${id}`, { method: 'DELETE' }),
    getUsersPermissions: () => request<any[]>('/hoa/users-permissions'),
  },

  // Amenidades & Reservaciones
  amenities: {
    getAmenities: () => request<any[]>('/amenities'),
    getBookings: (unitId?: string) => request<any[]>(`/amenities/bookings${unitId ? `?unitId=${unitId}` : ''}`),
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
    createPass: (data: any) => request('/access/passes', { method: 'POST', body: JSON.stringify(data) }),
    validateQR: (code: string) => request('/access/validate-qr', { method: 'POST', body: JSON.stringify({ code }) }),
    getVisits: (status?: string) => request<any[]>(`/access/visits${status ? `?status=${status}` : ''}`),
    checkIn: (data: any) => request('/access/check-in', { method: 'POST', body: JSON.stringify(data) }),
    checkOut: (visitId: number) => request(`/access/check-out/${visitId}`, { method: 'POST' }),
  },

  // Finanzas & Tickets
  finance: {
    getFees: (unitId?: string) => request<any[]>(`/finance/fees${unitId ? `?unitId=${unitId}` : ''}`),
    registerPayment: (data: any) => request('/finance/payments', { method: 'POST', body: JSON.stringify(data) }),
    getTickets: (unitId?: string) => request<any[]>(`/finance/tickets${unitId ? `?unitId=${unitId}` : ''}`),
    createTicket: (data: any) => request('/finance/tickets', { method: 'POST', body: JSON.stringify(data) }),
    updateTicketStatus: (id: string, status: string, assignedTo?: string) =>
      request(`/finance/tickets/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, assignedTo }),
      }),
  },
}
