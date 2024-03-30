/* eslint-disable @typescript-eslint/no-misused-promises */
import { type NextFunction, type Request, type Response, Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { configureMsgMediaS3Info, getMsgAttachment, respondNewMsgAttachment } from '../../middlewares/messages.js'
import { handleAsyncMdw } from '../../utils/error-utils.js'
import multer from 'multer'
import multerS3 from 'multer-s3'
import path from 'path'
import { S3Client } from '@aws-sdk/client-s3'
import appLogger from '../../appLogger.js'
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

const attachmentsRouter = Router()

// Router level Middlewares

// Routes
attachmentsRouter.post('/attachment', configureMsgMediaS3Info, upload.single('img'), respondNewMsgAttachment)

attachmentsRouter.get(
  '/:conversationId/messages/:messageId/attachment/:attachmentId',
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

export default attachmentsRouter
