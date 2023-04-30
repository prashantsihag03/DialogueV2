/* eslint-disable @typescript-eslint/no-misused-promises */
import { Router } from 'express'
import { rejectUnAuthenticated, validateTokens } from '../middlewares/auth'
import { getAllConversationsForUser } from '../middlewares/conversations'

const conversationsRouter = Router()

// Router level Middlewares
conversationsRouter.use(validateTokens)

conversationsRouter.get('/', rejectUnAuthenticated, getAllConversationsForUser)

export default conversationsRouter
