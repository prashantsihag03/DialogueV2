import { type Request, type NextFunction, type Response } from 'express'
import appLogger from '../appLogger'
import CustomError from './CustomError'

export const handleMdwErrors = (err: any, _res: Response): void => {
  if (err instanceof CustomError) {
    appLogger.error(`${err.message}:${err.details.internalMsg ?? ''}:${JSON.stringify(err.stack)}`)
    _res.status(err.details.code).send({ error: err.message })
    return
  }
  appLogger.error(`${JSON.stringify(err.stack)}`)
  _res.status(500).send({ error: 'Something went wrong. Please try again later' })
}

export const handleAsyncMdw = (
  asyncMiddleware: (req: Request, res: Response, next: NextFunction) => Promise<void>
): ((req: Request, res: Response, next: NextFunction) => Promise<void>) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await asyncMiddleware(req, res, next)
    } catch (err) {
      handleMdwErrors(err, res)
    }
  }
}
