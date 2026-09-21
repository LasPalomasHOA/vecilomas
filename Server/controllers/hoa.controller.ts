import type { Request, Response } from 'express'
import { HoaRepository } from '../repositories/hoa.repository.ts'

export class HoaController {
  static async getCondominiums(_req: Request, res: Response) {
    try {
      const condominiums = await HoaRepository.getCondominiums()
      res.json({ success: true, data: condominiums })
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message })
    }
  }

  static async createCondominium(req: Request, res: Response) {
    try {
      const newCondo = await HoaRepository.createCondominium(req.body)
      res.status(201).json({ success: true, data: newCondo })
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message })
    }
  }

  static async updateCondominium(req: Request, res: Response) {
    try {
      const id = Number(req.params.id)
      const updated = await HoaRepository.updateCondominium(id, req.body)
      res.json({ success: true, data: updated })
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message })
    }
  }

  static async deleteCondominium(req: Request, res: Response) {
    try {
      const id = Number(req.params.id)
      await HoaRepository.deleteCondominium(id)
      res.json({ success: true, message: 'Condominio eliminado con éxito' })
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message })
    }
  }

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

  static async updateResident(req: Request, res: Response) {
    try {
      const id = Number(req.params.id)
      const updated = await HoaRepository.updateResident(id, req.body)
      res.json({ success: true, data: updated })
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message })
    }
  }

  static async deleteResident(req: Request, res: Response) {
    try {
      const id = Number(req.params.id)
      await HoaRepository.deleteResident(id)
      res.json({ success: true, message: 'Residente eliminado con éxito' })
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message })
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

  static async createUserPermission(req: Request, res: Response) {
    try {
      const user = await HoaRepository.createUserWithPermissions(req.body)
      res.status(201).json({ success: true, data: user })
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message })
    }
  }

  static async deleteUserPermission(req: Request, res: Response) {
    try {
      const id = Number(req.params.id)
      await HoaRepository.deleteUserPermission(id)
      res.json({ success: true, message: 'Usuario/Rol eliminado con éxito' })
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message })
    }
  }
}
