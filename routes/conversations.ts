/* eslint-disable @typescript-eslint/no-misused-promises */
import { type NextFunction, type Request, type Response, Router } from 'express'
import { rejectUnAuthenticated, validateTokens } from '../middlewares/auth'
import { getUserConversations } from '../middlewares/user'
import {
  deleteConversationMdw,
  getConversationInfo,
  getLatestMessageByConversations,
  startNewConversation,
  transformConversationDataIntoQuickView
} from '../middlewares/conversations/conversations'
import {
  deleteAllMessagesByConversationId,
  getAllMessages,
  storeNewMessage,
  transformDynamoMsg
} from '../middlewares/messages'
import { handleAsyncMdw } from '../utils/error-utils'
import CustomError from '../utils/CustomError'

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
conversationsRouter.post('/message', storeNewMessage)

conversationsRouter.get(
  '/:conversationId/messages',
  (_req: Request, _res: Response, next: NextFunction): void => {
    if (_req.params.conversationId == null) {
      _res.status(500).send('Required parameter missing.')
      return
    }
    _res.locals.conversationId = _req.params.conversationId
    next()
  },
  getAllMessages,
  transformDynamoMsg
)

conversationsRouter.delete('/:conversationId/messages', deleteAllMessagesByConversationId)

conversationsRouter.delete(
  '/:conversationId',
  handleAsyncMdw(async (_req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (_req.params.conversationId == null) throw new CustomError('Missing required information!', { code: 500 })
    next()
  }),
  deleteConversationMdw
)

export default conversationsRouter
