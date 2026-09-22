import type { Request, Response } from 'express'
import { AuthRepository } from '../repositories/auth.repository.ts'

export class AuthController {
  static async login(req: Request, res: Response) {
    try {
      const { identifier, email, password, role } = req.body
      const userIdentifier = identifier || email

      if (!userIdentifier || !password) {
        return res.status(400).json({
          success: false,
          error: 'Por favor ingresa usuario y contraseña',
        })
      }

      const result = await AuthRepository.validateCredentials(
        userIdentifier,
        password,
        role
      )

      if (!result.success || !result.user) {
        return res.status(401).json({
          success: false,
          error: result.error || 'Credenciales inválidas',
        })
      }

      const user = result.user
      const initials = user.fullName
        .split(' ')
        .map(w => w[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase() || 'U'

      return res.json({
        success: true,
        data: {
          id: user.id,
          name: user.fullName,
          email: user.email,
          role: user.role,
          unit: user.unitNumber,
          initials,
          phone: user.phone,
          condominiumId: user.condominiumId,
        },
      })
    } catch (error: any) {
      console.error('[AuthController.login error]:', error)
      return res.status(500).json({
        success: false,
        error: error.message || 'Error en el servidor al autenticar',
      })
    }
  }

  static async getUsers(req: Request, res: Response) {
    try {
      const role = req.query.role as string
      const users = await AuthRepository.getActiveUsers(role)
      return res.json({ success: true, data: users })
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message })
    }
  }
}
