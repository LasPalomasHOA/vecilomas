import { Router } from 'express'
import { HoaController } from '../controllers/hoa.controller.ts'

const router = Router()

router.get('/directory', HoaController.getDirectory)
router.post('/residents', HoaController.createResident)

router.get('/notices', HoaController.getNotices)
router.post('/notices', HoaController.createNotice)
router.delete('/notices/:id', HoaController.deleteNotice)

router.get('/documents', HoaController.getDocuments)
router.post('/documents', HoaController.createDocument)
router.delete('/documents/:id', HoaController.deleteDocument)

router.get('/users-permissions', HoaController.getUsersPermissions)

export default router
