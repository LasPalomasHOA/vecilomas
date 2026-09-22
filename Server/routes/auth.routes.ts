import { Router } from 'express'
import { AuthController } from '../controllers/auth.controller.ts'

const router = Router()

router.post('/login', AuthController.login)
router.get('/users', AuthController.getUsers)

export default router
