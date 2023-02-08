import { type Errback, type NextFunction, type Request, type Response } from 'express'

export const GenericErrorHandler = (err: Errback, _req: Request, _res: Response, next: NextFunction): void => {
  console.log('Error handler intercepted following error: {}', err)
  _res.sendStatus(500)
}
