import { type Request, type NextFunction, type Response } from 'express'
import appLogger from '../appLogger.js'
import CustomError from './CustomError.js'
import { ZodError } from 'zod'

export const handleMdwErrors = (err: any, _res: Response): void => {
  if (err instanceof CustomError) {
    appLogger.error(`[HTTP] ${err.message}:${err.details.internalMsg ?? ''}:${JSON.stringify(err.stack)}`)
    _res.status(err.details.code).send({ error: err.message, data: err.details.data ?? {} })
    return
  }

  if (err instanceof ZodError) {
    appLogger.error(`[HTTP] Zod validation failed:${err.message}:${JSON.stringify(err.stack)}`)
    _res.status(400).send('Validation failure. Please provide valid data.')
    return
  }

  appLogger.error(`[HTTP]: ${JSON.stringify(err.stack)}`)
  _res.status(500).send({ error: 'Something went wrong. Please try again later' })
}

export const handleSocketEventFailure = (err: any, ackCallBack: (ackData: any) => void): void => {
  if (err instanceof CustomError) {
    appLogger.error(`[SOCKET]: ${err.message}:${err.details.internalMsg ?? ''}:${JSON.stringify(err.stack)}`)
    ackCallBack({
      status: 'failed',
      msg: err.message
    })
    return
  }
  appLogger.error(`[SOCKET]: ${JSON.stringify(err.stack)}`)
  ackCallBack({
    status: 'failed',
    msg: 'Something went wrong. Please try again later!'
  })
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

export const handleMdw = (
  middleware: (req: Request, res: Response, next: NextFunction) => void
): ((req: Request, res: Response, next: NextFunction) => void) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      middleware(req, res, next)
    } catch (err) {
      handleMdwErrors(err, res)
    }
  }
}

export const handleSocketEvent = (
  socketEventHandler: (data: any, callback: (data: any) => void) => Promise<void>
): ((data: any, callback: (data: any) => void) => Promise<void>) => {
  return async (data: any, callback: (data: any) => void): Promise<void> => {
    try {
      await socketEventHandler(data, callback)
    } catch (err) {
      handleSocketEventFailure(err, callback)
    }
  }
}

export const authenticated = (
  asyncMiddleware: (req: Request, res: Response, next: NextFunction) => Promise<void>
): ((req: Request, res: Response, next: NextFunction) => Promise<void>) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (res.locals.authenticated === true && res.locals?.jwt?.username != null) {
        await asyncMiddleware(req, res, next)
      }
      throw new CustomError('Unauthorised', { code: 401 })
    } catch (err) {
      handleMdwErrors(err, res)
    }
  }
}
