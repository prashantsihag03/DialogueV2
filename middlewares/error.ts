import { type Errback, type NextFunction, type Request, type Response } from 'express'
import appLogger from '../appLogger'

export const GenericErrorHandler = (err: Errback, _req: Request, _res: Response, next: NextFunction): void => {
  appLogger.error(`Generic error handler - ${JSON.stringify(err)}`)
  _res.sendStatus(500)
}
