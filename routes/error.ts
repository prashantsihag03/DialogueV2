import { type Errback, type NextFunction, type Request, type Response, Router } from 'express'

const errorRouter = Router()

errorRouter.use((err: Errback, _req: Request, _res: Response, next: NextFunction) => {
  console.log('Error handler intercepted following error: {}', err)
  _res.sendStatus(500)
})

export default errorRouter
