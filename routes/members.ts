/* eslint-disable @typescript-eslint/no-misused-promises */
import { Router } from 'express'
import { rejectUnAuthenticated, validateTokens } from '../middlewares/auth'
import { getAllMembersByConversation } from '../middlewares/converdsations/conversations'

const membersRouter = Router()

// Router level Middlewares
membersRouter.use(validateTokens)
membersRouter.use(rejectUnAuthenticated)

membersRouter.get('/:conversationId', getAllMembersByConversation)

export default membersRouter
