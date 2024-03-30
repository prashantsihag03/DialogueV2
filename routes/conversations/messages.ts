/* eslint-disable @typescript-eslint/no-misused-promises */
import { type NextFunction, type Request, type Response, Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import {
  deleteAllMessagesByConversationId,
  getAllMessages,
  storeNewMessage,
  transformDynamoMsg
} from '../../middlewares/messages.js'
import multer from 'multer'
import multerS3 from 'multer-s3'
import path from 'path'
import { S3Client } from '@aws-sdk/client-s3'
import { type CustomRequest } from '../../middlewares/types.js'

const s3 = new S3Client()

/**
 * Uploads file from request to S3 bucket
 * Use following optional parameters to customize s3 path and filename
 * - s3Path: Pass s3 path without trailing /. Not passing will use "/temp"
 * - fileName: Pass filename without extension. Not passing will use `uuidv4-UTC_DateTime_instant.uploadedFileExtension`
 */
const upload = multer({
  storage: multerS3({
    s3,
    bucket: 'dialogue-v2',
    key: function (req: CustomRequest, file, cb) {
      let s3Path: string = '/temp'
      let fileName: string = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`
      if (req.s3Path != null) {
        s3Path = req.s3Path
      }
      if (req.fileNamePrefix != null) {
        fileName = `${req.fileNamePrefix}${path.extname(file.originalname)}`
      }
      cb(null, `${s3Path}/${fileName}`)
    }
  })
})

const messagesRouter = Router()

// Router level Middlewares

// Routes
messagesRouter.post('/message', upload.single('img'), storeNewMessage)
messagesRouter.get(
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

messagesRouter.delete('/:conversationId/messages', deleteAllMessagesByConversationId)

export default messagesRouter
