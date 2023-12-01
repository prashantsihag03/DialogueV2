import { type NextFunction, type Request, type Response } from 'express'

export const Sendok = (_req: Request, _res: Response, next: NextFunction): void => {
  _res.send({ status: 'success' })
}
