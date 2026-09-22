import { Router } from 'express'
import authRoutes from './auth.routes.ts'
import hoaRoutes from './hoa.routes.ts'
import amenitiesRoutes from './amenities.routes.ts'
import accessRoutes from './access.routes.ts'
import financeRoutes from './finance.routes.ts'

const apiRouter = Router()

apiRouter.use('/auth', authRoutes)
apiRouter.use('/hoa', hoaRoutes)
apiRouter.use('/amenities', amenitiesRoutes)
apiRouter.use('/access', accessRoutes)
apiRouter.use('/finance', financeRoutes)

export default apiRouter
