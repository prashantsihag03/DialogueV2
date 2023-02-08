import { Router } from 'express'
import { GenericErrorHandler } from '../middlewares/error'

const errorRouter = Router()

errorRouter.use(GenericErrorHandler)

export default errorRouter
