import { v4 as uuidv4 } from 'uuid'
import { type NextFunction, type Request, type Response } from 'express'
import {
  addMessageToConversation,
  deleteAllMessagesByConvoId,
  getAllMessagesByConvoId,
  getAllConvoMsgsSortByTimeStamp,
  getMsgObject
} from '../models/conversations/conversations.js'
import { type IConversationMessageAttributes } from '../models/conversations/types.js'
import ValidationUtils from '../utils/validation-utils.js'
import CustomError from '../utils/CustomError.js'
import fs from 'node:fs/promises'
import { handleAsyncMdw } from '../utils/error-utils.js'
import { type CustomRequest } from './types.js'

interface CleanedMessage {
  messageId: string
  senderUserId: string
  timestamp: string
  source: 'outgoing' | 'incoming'
  text: string
  file?: string
}

export const getAllMessages = async (_req: Request, _res: Response, next: NextFunction): Promise<void> => {
  const msgResp = await getAllConvoMsgsSortByTimeStamp(_res.locals.conversationId)
  if (msgResp.$metadata.httpStatusCode !== 200 || msgResp.Items === undefined) {
    _res.status(500).send('Something went wrong. Please try again later!')
    return
  }
  _res.locals.messages = {}
  _res.locals.messages[_res.locals.conversationId] = msgResp.Items
  next()
}

export const getMsgAttachment = async (_req: Request, _res: Response, next: NextFunction): Promise<void> => {
  if (_req.params.attachmentId == null || _req.params.conversationId == null || _req.params.messageId == null) {
    throw new CustomError('Missing required parameters.', {
      code: 400,
      internalMsg: 'AttachmentId and/or conversationId missing in request parameters'
    })
  }
  let fileContents

  try {
    const response = await getMsgObject(_req.params.attachmentId)
    if (response.$metadata.httpStatusCode === 200 && response.Body != null) {
      fileContents = await response.Body.transformToString('base64')
      _res.locals.msgAttachment = {
        status: 'Successful',
        data: fileContents
      }
      next()
    }
  } catch (e) {
    // intentionally left blank
  }
  _res.locals.msgAttachment = {
    status: 'Resource not found.',
    data: null
  }
  next()
}

export const transformDynamoMsg = async (_req: Request, _res: Response, next: NextFunction): Promise<void> => {
  if (
    _res.locals.messages == null ||
    _res.locals.conversationId == null ||
    _res.locals.messages[_res.locals.conversationId] == null ||
    !Array.isArray(_res.locals.messages[_res.locals.conversationId])
  ) {
    _res.status(500).send('Something went wrong. Please try again later!')
    return
  }

  const transformedMessages: CleanedMessage[] = []
  for (let index = 0; index < _res.locals.messages[_res.locals.conversationId].length; index++) {
    const senderId = _res.locals.messages[_res.locals.conversationId][index].senderId
    const fileContents = _res.locals.messages[_res.locals.conversationId][index].file
    transformedMessages.push({
      // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
      messageId: _res.locals.messages[_res.locals.conversationId][index].messageId + '',
      senderUserId: _res.locals.messages[_res.locals.conversationId][index].senderId,
      source: senderId === _res.locals.jwt.username ? 'outgoing' : 'incoming',
      text: _res.locals.messages[_res.locals.conversationId][index].message,
      timestamp: _res.locals.messages[_res.locals.conversationId][index].timeStamp,
      file: fileContents != null ? fileContents : undefined
    })
  }

  _res.send(transformedMessages)
}

export const configureMsgMediaS3Info = handleAsyncMdw(
  async (_req: CustomRequest, _res: Response, next: NextFunction): Promise<void> => {
    if (_req.params.conversationId == null) {
      throw new CustomError('Missing required parameters.', { code: 500 })
    }
    _res.locals.attachmentId = uuidv4()
    _req.s3Path = `/${_req.params.conversationId}`
    _req.fileNamePrefix = `${_req.params.conversationId}-${_res.locals.attachmentId as string}-${Date.now()}`
    next()
  }
)

export const respondNewMsgAttachment = handleAsyncMdw(
  async (_req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (_req.file == null) {
      throw new CustomError('Error encountered while retrieving uploaded file info.', { code: 500 })
    }
    _res.status(200).send({
      fileName: _req.file.fieldname,
      attachmentId: _res.locals.attachmentId
    })
  }
)

// TODO: Fix file uploads. Only return file name as response. Specify unique file name via multer
export const storeNewMessage = handleAsyncMdw(
  async (_req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (!ValidationUtils.isMsgValid(_req.body.conversationId, _req.body.senderUserId, _req.body.text)) {
      throw new CustomError('Invalid message provided!', { code: 400 })
    }
    let fileContents = null
    if (_req.file != null) {
      const response = await getMsgObject(_req.file.fieldname)
      if (response.$metadata.httpStatusCode !== 200 || response.Body == null) {
        throw new CustomError('Couldnt retrieve the uploaded object from s3', { code: 500 })
      }
      fileContents = await response.Body.transformToString('base64')
    }

    const newMessage: IConversationMessageAttributes = {
      conversationId: _req.body.conversationId,
      messageId: `message-${uuidv4()}`,
      timeStamp: Date.now(),
      message: _req.body.text,
      senderId: _req.body.senderUserId,
      file: fileContents != null ? fileContents : undefined
    }

    if (_req.file != null) {
      await fs.unlink(_req.file.path)
    }

    const response3 = await addMessageToConversation(newMessage)
    if (response3.$metadata.httpStatusCode !== 200) {
      throw new CustomError('DB Error while adding message to conversation', { code: 500 })
    }

    _res.status(200).send({ ...newMessage, localMessageId: _req.body.localMessageId ?? '' })
  }
)

export const deleteAllMessagesByConversationId = async (
  _req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  if (_req.params.conversationId == null) {
    _res.status(500).send('Missing required information!')
    return
  }

  const allMsgResp = await getAllMessagesByConvoId(_req.params.conversationId)
  if (allMsgResp.$metadata.httpStatusCode !== 200) {
    _res.status(500).send('Something went wrong. Please try again later!')
    return
  }

  if (allMsgResp.Items == null || allMsgResp.Items.length < 1) {
    _res.status(200).send({ status: 'success', msg: 'No messages available for deletion!' })
    return
  }

  const allMsgId: string[] = []
  allMsgResp.Items.forEach((item) => {
    if (item.messageId != null) {
      allMsgId.push(item.messageId)
    }
  })

  const resp = await deleteAllMessagesByConvoId(_req.params.conversationId, allMsgId)

  _res.status(resp.$metadata.httpStatusCode ?? 500).send({
    status: resp.$metadata.httpStatusCode === 200 ? 'Success' : 'Something went wrong'
  })
}
