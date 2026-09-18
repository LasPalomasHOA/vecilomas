import { Router } from 'express'
import { AccessController } from '../controllers/access.controller.ts'

const router = Router()

router.post('/passes', AccessController.createPass)
router.post('/validate-qr', AccessController.validateQR)
router.get('/visits', AccessController.getVisits)
router.post('/check-in', AccessController.checkIn)
router.post('/check-out/:id', AccessController.checkOut)

export default router
