import type { Request, Response } from 'express'
import { AmenitiesRepository } from '../repositories/amenities.repository.ts'

export class AmenitiesController {
  static async getAmenities(req: Request, res: Response) {
    try {
      const condoId = req.query.condoId as string
      const amenities = await AmenitiesRepository.getAmenities(condoId)
      res.json({ success: true, data: amenities })
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message })
    }
  }

  static async createAmenity(req: Request, res: Response) {
    try {
      const amenity = await AmenitiesRepository.createAmenity(req.body)
      res.status(201).json({ success: true, data: amenity })
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message })
    }
  }

  static async getBookings(req: Request, res: Response) {
    try {
      const condoId = req.query.condoId as string
      const unitId = req.query.unitId as string
      const bookings = await AmenitiesRepository.getBookings(condoId, unitId)
      res.json({ success: true, data: bookings })
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message })
    }
  }

  static async checkAvailability(req: Request, res: Response) {
    try {
      const { amenityId, startDatetime, endDatetime } = req.query
      const result = await AmenitiesRepository.checkAvailability(
        Number(amenityId),
        String(startDatetime),
        String(endDatetime)
      )
      res.json({ success: true, ...result })
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message })
    }
  }

  static async createBooking(req: Request, res: Response) {
    try {
      const booking = await AmenitiesRepository.createBooking(req.body)
      res.status(201).json({ success: true, data: booking })
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message })
    }
  }

  static async updateAmenity(req: Request, res: Response) {
    try {
      const id = Number(req.params.id)
      const updated = await AmenitiesRepository.updateAmenity(id, req.body)
      res.json({ success: true, data: updated })
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message })
    }
  }

  static async deleteAmenity(req: Request, res: Response) {
    try {
      const id = Number(req.params.id)
      await AmenitiesRepository.deleteAmenity(id)
      res.json({ success: true, message: 'Amenidad eliminada con éxito' })
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message })
    }
  }

  static async updateStatus(req: Request, res: Response) {
    try {
      const id = Number(req.params.id)
      const { status, approvedByUserId } = req.body
      const updated = await AmenitiesRepository.updateBookingStatus(id, status, approvedByUserId)
      res.json({ success: true, data: updated })
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message })
    }
  }
}
