import type { Request, Response } from 'express'
import { FinanceRepository } from '../repositories/finance.repository.ts'

export class FinanceController {
  static async getFees(req: Request, res: Response) {
    try {
      const condoId = req.query.condoId as string
      const unitId = req.query.unitId as string
      const fees = await FinanceRepository.getFeeStatements(condoId, unitId)
      res.json({ success: true, data: fees })
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message })
    }
  }

  static async getPayments(req: Request, res: Response) {
    try {
      const condoId = req.query.condoId as string
      const unitId = req.query.unitId as string
      const payments = await FinanceRepository.getPayments(condoId, unitId)
      res.json({ success: true, data: payments })
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message })
    }
  }

  static async registerPayment(req: Request, res: Response) {
    try {
      const payment = await FinanceRepository.registerPayment(req.body)
      res.status(201).json({ success: true, data: payment })
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message })
    }
  }

  static async getTickets(req: Request, res: Response) {
    try {
      const condoId = req.query.condoId as string
      const unitId = req.query.unitId as string
      const tickets = await FinanceRepository.getMaintenanceTickets(condoId, unitId)
      res.json({ success: true, data: tickets })
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message })
    }
  }

  static async createTicket(req: Request, res: Response) {
    try {
      const ticket = await FinanceRepository.createTicket(req.body)
      res.status(201).json({ success: true, data: ticket })
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message })
    }
  }

  static async updateTicketStatus(req: Request, res: Response) {
    try {
      const id = String(req.params.id)
      const { status, assignedTo } = req.body
      const updated = await FinanceRepository.updateTicketStatus(id, status, assignedTo)
      res.json({ success: true, data: updated })
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message })
    }
  }
}
