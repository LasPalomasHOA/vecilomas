import { Router } from 'express'
import { AmenitiesController } from '../controllers/amenities.controller.ts'

const router = Router()

router.get('/', AmenitiesController.getAmenities)
router.post('/', AmenitiesController.createAmenity)
router.put('/:id', AmenitiesController.updateAmenity)
router.delete('/:id', AmenitiesController.deleteAmenity)
router.get('/bookings', AmenitiesController.getBookings)
router.get('/availability', AmenitiesController.checkAvailability)
router.post('/bookings', AmenitiesController.createBooking)
router.patch('/bookings/:id/status', AmenitiesController.updateStatus)

export default router
