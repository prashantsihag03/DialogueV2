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
import multer from 'multer'
import path from 'path'

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/')) // Define the destination folder for uploaded files
  },
  filename: function (req, file, cb) {
    cb(null, `${String(file.fieldname)}-${Date.now()}${path.extname(file.originalname)}`)
  }
})
const upload = multer({ storage })

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
conversationsRouter.post('/message', upload.single('img'), storeNewMessage)
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
