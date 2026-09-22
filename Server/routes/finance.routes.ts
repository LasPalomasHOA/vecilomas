import { Router } from 'express'
import { FinanceController } from '../controllers/finance.controller.ts'

const router = Router()

router.get('/fees', FinanceController.getFees)
router.get('/payments', FinanceController.getPayments)
router.post('/payments', FinanceController.registerPayment)

router.get('/tickets', FinanceController.getTickets)
router.post('/tickets', FinanceController.createTicket)
router.patch('/tickets/:id/status', FinanceController.updateTicketStatus)

export default router
