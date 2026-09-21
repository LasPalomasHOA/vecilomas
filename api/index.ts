import type { IncomingMessage, ServerResponse } from 'node:http'
import { checkDbConnection } from '../Server/config/db.ts'
import { HoaRepository } from '../Server/repositories/hoa.repository.ts'
import { AmenitiesRepository } from '../Server/repositories/amenities.repository.ts'
import { AccessRepository } from '../Server/repositories/access.repository.ts'
import { FinanceRepository } from '../Server/repositories/finance.repository.ts'

interface CustomRequest extends IncomingMessage {
  query?: Record<string, string>
  body?: any
}

interface CustomResponse extends ServerResponse {
  status?: (statusCode: number) => CustomResponse
  json?: (data: any) => void
}

async function parseBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve) => {
    let body = ''
    req.on('data', (chunk) => {
      body += chunk.toString()
    })
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {})
      } catch {
        resolve({})
      }
    })
  })
}

export default async function handler(req: CustomRequest, res: CustomResponse) {
  // Configuración de cabeceras CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  )

  if (req.method === 'OPTIONS') {
    res.statusCode = 200
    res.end()
    return
  }

  const sendJson = (statusCode: number, data: any) => {
    res.statusCode = statusCode
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(data))
  }

  try {
    const rawUrl = req.url || '/'
    const parsedUrl = new URL(rawUrl, 'http://localhost')
    let pathname = parsedUrl.pathname.replace(/\/$/, '')
    if (!pathname.startsWith('/api')) {
      pathname = `/api${pathname}`
    }

    const queryParams: Record<string, string> = {}
    parsedUrl.searchParams.forEach((val, key) => {
      queryParams[key] = val
    })

    const method = (req.method || 'GET').toUpperCase()
    let body = (req as any).body
    if (!body && ['POST', 'PUT', 'PATCH'].includes(method)) {
      body = await parseBody(req)
    }

    // Health Check
    if (pathname === '/api/health') {
      const dbHealth = await checkDbConnection()
      return sendJson(dbHealth.ok ? 200 : 503, {
        status: dbHealth.ok ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        database: dbHealth,
      })
    }

    // HOA - Condominiums
    if (pathname === '/api/hoa/condominiums') {
      if (method === 'GET') {
        const condos = await HoaRepository.getCondominiums()
        return sendJson(200, { success: true, data: condos })
      }
      if (method === 'POST') {
        const condo = await HoaRepository.createCondominium(body)
        return sendJson(201, { success: true, data: condo })
      }
    }

    const matchCondoId = pathname.match(/^\/api\/hoa\/condominiums\/(\d+)$/)
    if (matchCondoId) {
      const id = Number(matchCondoId[1])
      if (method === 'PUT') {
        const updated = await HoaRepository.updateCondominium(id, body)
        return sendJson(200, { success: true, data: updated })
      }
      if (method === 'DELETE') {
        await HoaRepository.deleteCondominium(id)
        return sendJson(200, { success: true, message: 'Condominio eliminado' })
      }
    }

    // HOA - Directory & Residents
    if (pathname === '/api/hoa/directory' && method === 'GET') {
      const directory = await HoaRepository.getResidentsDirectory(queryParams.condoId)
      return sendJson(200, { success: true, data: directory })
    }

    if (pathname === '/api/hoa/residents' && method === 'POST') {
      const resident = await HoaRepository.createResident(body)
      return sendJson(201, { success: true, data: resident })
    }

    const matchResidentId = pathname.match(/^\/api\/hoa\/residents\/(\d+)$/)
    if (matchResidentId) {
      const id = Number(matchResidentId[1])
      if (method === 'PUT') {
        const updated = await HoaRepository.updateResident(id, body)
        return sendJson(200, { success: true, data: updated })
      }
      if (method === 'DELETE') {
        await HoaRepository.deleteResident(id)
        return sendJson(200, { success: true, message: 'Residente eliminado' })
      }
    }

    // HOA - Notices
    if (pathname === '/api/hoa/notices') {
      if (method === 'GET') {
        const notices = await HoaRepository.getNotices(queryParams.condoId)
        return sendJson(200, { success: true, data: notices })
      }
      if (method === 'POST') {
        const notice = await HoaRepository.createNotice(body)
        return sendJson(201, { success: true, data: notice })
      }
    }

    const matchNoticeId = pathname.match(/^\/api\/hoa\/notices\/(\d+)$/)
    if (matchNoticeId && method === 'DELETE') {
      const id = Number(matchNoticeId[1])
      await HoaRepository.deleteNotice(id)
      return sendJson(200, { success: true, message: 'Aviso eliminado' })
    }

    // HOA - Documents
    if (pathname === '/api/hoa/documents') {
      if (method === 'GET') {
        const docs = await HoaRepository.getDocuments(queryParams.condoId)
        return sendJson(200, { success: true, data: docs })
      }
      if (method === 'POST') {
        const doc = await HoaRepository.createDocument(body)
        return sendJson(201, { success: true, data: doc })
      }
    }

    const matchDocId = pathname.match(/^\/api\/hoa\/documents\/(\d+)$/)
    if (matchDocId && method === 'DELETE') {
      const id = Number(matchDocId[1])
      await HoaRepository.deleteDocument(id)
      return sendJson(200, { success: true, message: 'Documento eliminado' })
    }

    // HOA - User Permissions
    if (pathname === '/api/hoa/users-permissions') {
      if (method === 'GET') {
        const users = await HoaRepository.getUsersWithPermissions(queryParams.condoId)
        return sendJson(200, { success: true, data: users })
      }
      if (method === 'POST') {
        const user = await HoaRepository.createUserWithPermissions(body)
        return sendJson(201, { success: true, data: user })
      }
    }

    const matchUserPermId = pathname.match(/^\/api\/hoa\/users-permissions\/(\d+)$/)
    if (matchUserPermId && method === 'DELETE') {
      const id = Number(matchUserPermId[1])
      await HoaRepository.deleteUserPermission(id)
      return sendJson(200, { success: true, message: 'Permiso de usuario eliminado' })
    }

    // Amenities
    if (pathname === '/api/amenities') {
      if (method === 'GET') {
        const amenities = await AmenitiesRepository.getAmenities(queryParams.condoId)
        return sendJson(200, { success: true, data: amenities })
      }
      if (method === 'POST') {
        const amenity = await AmenitiesRepository.createAmenity(body)
        return sendJson(201, { success: true, data: amenity })
      }
    }

    const matchAmenityId = pathname.match(/^\/api\/amenities\/(\d+)$/)
    if (matchAmenityId) {
      const id = Number(matchAmenityId[1])
      if (method === 'PUT') {
        const updated = await AmenitiesRepository.updateAmenity(id, body)
        return sendJson(200, { success: true, data: updated })
      }
      if (method === 'DELETE') {
        await AmenitiesRepository.deleteAmenity(id)
        return sendJson(200, { success: true, message: 'Amenidad eliminada' })
      }
    }

    if (pathname === '/api/amenities/bookings') {
      if (method === 'GET') {
        const bookings = await AmenitiesRepository.getBookings(queryParams.condoId)
        return sendJson(200, { success: true, data: bookings })
      }
      if (method === 'POST') {
        const booking = await AmenitiesRepository.createBooking(body)
        return sendJson(201, { success: true, data: booking })
      }
    }

    const matchBookingStatus = pathname.match(/^\/api\/amenities\/bookings\/(\d+)\/status$/)
    if (matchBookingStatus && method === 'PATCH') {
      const id = Number(matchBookingStatus[1])
      const updated = await AmenitiesRepository.updateBookingStatus(id, body.status)
      return sendJson(200, { success: true, data: updated })
    }

    if (pathname === '/api/amenities/availability' && method === 'GET') {
      const start = queryParams.date && queryParams.startTime ? `${queryParams.date}T${queryParams.startTime}:00` : ''
      const end = queryParams.date && queryParams.endTime ? `${queryParams.date}T${queryParams.endTime}:00` : ''
      const available = await AmenitiesRepository.checkAvailability(
        Number(queryParams.amenityId),
        start,
        end
      )
      return sendJson(200, { success: true, available })
    }

    // Access Passes & Validation
    if (pathname === '/api/access/passes') {
      if (method === 'GET') {
        const passes = await AccessRepository.getAccessPasses(queryParams.condoId)
        return sendJson(200, { success: true, data: passes })
      }
      if (method === 'POST') {
        const pass = await AccessRepository.createAccessPass(body)
        return sendJson(201, { success: true, data: pass })
      }
    }

    if (pathname === '/api/access/validate-qr' && method === 'POST') {
      const validation = await AccessRepository.validateQRCode(body.code)
      return sendJson(200, { success: true, data: validation })
    }

    if (pathname === '/api/access/visits' && method === 'GET') {
      const visits = await AccessRepository.getVisitLogs(queryParams.condoId)
      return sendJson(200, { success: true, data: visits })
    }

    if (pathname === '/api/access/check-in' && method === 'POST') {
      const log = await AccessRepository.checkInVisit(body)
      return sendJson(201, { success: true, data: log })
    }

    const matchCheckOut = pathname.match(/^\/api\/access\/check-out\/(\d+)$/)
    if (matchCheckOut && method === 'POST') {
      const id = Number(matchCheckOut[1])
      const log = await AccessRepository.checkOutVisit(id)
      return sendJson(200, { success: true, data: log })
    }

    // Finance
    if (pathname === '/api/finance/fees' && method === 'GET') {
      const fees = await FinanceRepository.getFeeStatements(queryParams.condoId)
      return sendJson(200, { success: true, data: fees })
    }

    if (pathname === '/api/finance/payments' && method === 'POST') {
      const payment = await FinanceRepository.registerPayment(body)
      return sendJson(201, { success: true, data: payment })
    }

    if (pathname === '/api/finance/tickets') {
      if (method === 'GET') {
        const tickets = await FinanceRepository.getMaintenanceTickets(queryParams.condoId)
        return sendJson(200, { success: true, data: tickets })
      }
      if (method === 'POST') {
        const ticket = await FinanceRepository.createTicket(body)
        return sendJson(201, { success: true, data: ticket })
      }
    }

    const matchTicketStatus = pathname.match(/^\/api\/finance\/tickets\/([a-zA-Z0-9_-]+)\/status$/)
    if (matchTicketStatus && method === 'PATCH') {
      const id = matchTicketStatus[1]
      const updated = await FinanceRepository.updateTicketStatus(id, body.status, body.assignedTo || body.notes)
      return sendJson(200, { success: true, data: updated })
    }

    // 404 No match
    return sendJson(404, { success: false, error: `Ruta no encontrada: ${method} ${pathname}` })
  } catch (error: any) {
    console.error('[API Serverless Error]:', error)
    return sendJson(500, { success: false, error: error?.message || 'Error interno del servidor' })
  }
}
