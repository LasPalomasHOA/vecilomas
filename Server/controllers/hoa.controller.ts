import type { Request, Response } from 'express'
import { HoaRepository } from '../repositories/hoa.repository.ts'

export class HoaController {
  static async getDirectory(req: Request, res: Response) {
    try {
      const condoId = req.query.condoId as string
      const residents = await HoaRepository.getResidentsDirectory(condoId)
      res.json({ success: true, data: residents })
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message })
    }
  }

  static async createResident(req: Request, res: Response) {
    try {
      const newResident = await HoaRepository.createResident(req.body)
      res.status(201).json({ success: true, data: newResident })
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message })
    }
  }

  static async getNotices(req: Request, res: Response) {
    try {
      const condoId = req.query.condoId as string
      const notices = await HoaRepository.getNotices(condoId)
      res.json({ success: true, data: notices })
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message })
    }
  }

  static async createNotice(req: Request, res: Response) {
    try {
      const notice = await HoaRepository.createNotice(req.body)
      res.status(201).json({ success: true, data: notice })
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message })
    }
  }

  static async deleteNotice(req: Request, res: Response) {
    try {
      const id = Number(req.params.id)
      await HoaRepository.deleteNotice(id)
      res.json({ success: true, message: 'Aviso eliminado con éxito' })
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message })
    }
  }

  static async getDocuments(req: Request, res: Response) {
    try {
      const condoId = req.query.condoId as string
      const docs = await HoaRepository.getDocuments(condoId)
      res.json({ success: true, data: docs })
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message })
    }
  }

  static async createDocument(req: Request, res: Response) {
    try {
      const doc = await HoaRepository.createDocument(req.body)
      res.status(201).json({ success: true, data: doc })
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message })
    }
  }

  static async deleteDocument(req: Request, res: Response) {
    try {
      const id = Number(req.params.id)
      await HoaRepository.deleteDocument(id)
      res.json({ success: true, message: 'Documento eliminado con éxito' })
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message })
    }
  }

  static async getUsersPermissions(req: Request, res: Response) {
    try {
      const condoId = req.query.condoId as string
      const users = await HoaRepository.getUsersWithPermissions(condoId)
      res.json({ success: true, data: users })
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message })
    }
  }
}
