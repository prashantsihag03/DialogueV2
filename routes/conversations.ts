/* eslint-disable @typescript-eslint/no-misused-promises */
import { type NextFunction, type Request, type Response, Router } from 'express'
import { rejectUnAuthenticated, validateTokens } from '../middlewares/auth.js'
import { getUserConversations } from '../middlewares/user.js'
import {
  deleteConversationMdw,
  getConversationInfo,
  getLatestMessageByConversations,
  startNewConversation,
  transformConversationDataIntoQuickView
} from '../middlewares/conversations/conversations.js'
import {
  deleteAllMessagesByConversationId,
  getAllMessages,
  getMsgAttachment,
  storeNewMessage,
  transformDynamoMsg
} from '../middlewares/messages.js'
import { handleAsyncMdw } from '../utils/error-utils.js'
import CustomError from '../utils/CustomError.js'
import multer from 'multer'
import multerS3 from 'multer-s3'
import path from 'path'
import { S3Client } from '@aws-sdk/client-s3'
import appLogger from '../appLogger.js'

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, path.join(__dirname, '../uploads/')) // Define the destination folder for uploaded files
//   },
//   filename: function (req, file, cb) {
//     cb(null, `${String(file.fieldname)}-${Date.now()}${path.extname(file.originalname)}`)
//   }
// })

const s3 = new S3Client()
const upload = multer({
  storage: multerS3({
    s3,
    bucket: 'dialogue-v2',
    metadata: function (req, file, cb) {
      cb(null, { fieldName: `${String(file.fieldname)}-${Date.now()}${path.extname(file.originalname)}` })
    },
    key: function (req, file, cb) {
      cb(null, `${String(file.fieldname)}-${Date.now()}${path.extname(file.originalname)}`)
    }
  })
})

// const upload = multer({ storage })

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

conversationsRouter.get(
  '/:conversationId/messages/:messageId/attachment/:attachmentId',
  // handleAsyncMdw(),
  handleAsyncMdw(getMsgAttachment),
  (_req: Request, _res: Response, next: NextFunction): void => {
    if (_res.locals.msgAttachment?.status === 'Successful' && _res.locals.msgAttachment?.data != null) {
      _res.send(JSON.stringify(_res.locals.msgAttachment?.data))
      return
    }
    appLogger.warn(`Msg attachment couldnt be found: ${JSON.stringify(_res.locals.msgAttachment)}`)
    _res.sendStatus(404)
  }
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
