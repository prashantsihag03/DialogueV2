/* eslint-disable @typescript-eslint/no-misused-promises */
import { type NextFunction, type Request, type Response, Router } from 'express'
import { rejectUnAuthenticated, validateTokens } from '../../middlewares/auth.js'
import { getUserConversations } from '../../middlewares/user.js'
import {
  deleteConversationMdw,
  getConversationInfo,
  getLatestMessageByConversations,
  startNewConversation,
  transformConversationDataIntoQuickView
} from '../../middlewares/conversations/conversations.js'
import { handleAsyncMdw } from '../../utils/error-utils.js'
import CustomError from '../../utils/CustomError.js'
import messagesRouter from './messages.js'
import attachmentsRouter from './attachment.js'

const conversationsRouter = Router()

// Router level Middlewares
conversationsRouter.use(validateTokens)
conversationsRouter.use(rejectUnAuthenticated)

// Routes
conversationsRouter.get(
  '/',
  getUserConversations,
  getConversationInfo,
  getLatestMessageByConversations,
  transformConversationDataIntoQuickView
)
conversationsRouter.post('/', getUserConversations, startNewConversation)
conversationsRouter.delete(
  '/:conversationId',
  handleAsyncMdw(async (_req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (_req.params.conversationId == null) throw new CustomError('Missing required information!', { code: 500 })
    next()
  }),
  deleteConversationMdw
)

conversationsRouter.use(messagesRouter)
conversationsRouter.use(attachmentsRouter)

export default conversationsRouter
