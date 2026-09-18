import { Router } from 'express'
import { AmenitiesController } from '../controllers/amenities.controller.ts'

const router = Router()

router.get('/', AmenitiesController.getAmenities)
router.get('/bookings', AmenitiesController.getBookings)
router.get('/availability', AmenitiesController.checkAvailability)
router.post('/bookings', AmenitiesController.createBooking)
router.patch('/bookings/:id/status', AmenitiesController.updateStatus)

export default router
