import { Router } from 'express'
import { GenericErrorHandler } from '../middlewares/error.js'

const errorRouter = Router()

errorRouter.use(GenericErrorHandler)

export default errorRouter
