import { Router } from 'express'
import { HoaController } from '../controllers/hoa.controller.ts'

const router = Router()

// Condominios
router.get('/condominiums', HoaController.getCondominiums)
router.post('/condominiums', HoaController.createCondominium)
router.put('/condominiums/:id', HoaController.updateCondominium)
router.delete('/condominiums/:id', HoaController.deleteCondominium)

// Directorio Residencial
router.get('/directory', HoaController.getDirectory)
router.post('/residents', HoaController.createResident)
router.put('/residents/:id', HoaController.updateResident)
router.delete('/residents/:id', HoaController.deleteResident)

// Avisos y Comunicados
router.get('/notices', HoaController.getNotices)
router.post('/notices', HoaController.createNotice)
router.delete('/notices/:id', HoaController.deleteNotice)

// Repositorio de Documentos
router.get('/documents', HoaController.getDocuments)
router.post('/documents', HoaController.createDocument)
router.delete('/documents/:id', HoaController.deleteDocument)

// Roles y Permisos
router.get('/users-permissions', HoaController.getUsersPermissions)
router.post('/users-permissions', HoaController.createUserPermission)
router.delete('/users-permissions/:id', HoaController.deleteUserPermission)

export default router
