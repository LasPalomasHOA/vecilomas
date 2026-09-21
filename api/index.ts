import app from '../Server/index.ts'
import type { Request, Response } from 'express'

export default function handler(req: Request, res: Response) {
  return app(req, res)
}
