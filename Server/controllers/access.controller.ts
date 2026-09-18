import type { Request, Response } from 'express'
import { AccessRepository } from '../repositories/access.repository.ts'

export class AccessController {
  static async createPass(req: Request, res: Response) {
    try {
      const pass = await AccessRepository.createAccessPass(req.body)
      res.status(201).json({ success: true, data: pass })
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message })
    }
  }

  static async validateQR(req: Request, res: Response) {
    try {
      const { code } = req.body
      if (!code) {
        return res.status(400).json({ success: false, message: 'Código QR requerido' })
      }
      const result = await AccessRepository.validateQRCode(code)
      res.json({ success: true, ...result })
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message })
    }
  }

  static async getVisits(req: Request, res: Response) {
    try {
      const condoId = req.query.condoId as string
      const status = req.query.status as string
      const visits = await AccessRepository.getVisitLogs(condoId, status)
      res.json({ success: true, data: visits })
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message })
    }
  }

  static async checkIn(req: Request, res: Response) {
    try {
      const visit = await AccessRepository.checkInVisit(req.body)
      res.status(201).json({ success: true, data: visit })
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message })
    }
  }

  static async checkOut(req: Request, res: Response) {
    try {
      const id = Number(req.params.id)
      const visit = await AccessRepository.checkOutVisit(id)
      res.json({ success: true, data: visit })
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message })
    }
  }
}
