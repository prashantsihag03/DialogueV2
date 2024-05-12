/* eslint-disable @typescript-eslint/no-misused-promises */
import { Router } from 'express'
import AuthMdw from '../middlewares/auth'
import { getAllMembersByConversation } from '../middlewares/conversations/conversations'

const membersRouter = Router()

// Router level Middlewares
membersRouter.use(AuthMdw.validateTokens)
membersRouter.use(AuthMdw.rejectUnAuthenticated)

membersRouter.get('/:conversationId', getAllMembersByConversation)

export default membersRouter
