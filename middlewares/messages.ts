import { v4 as uuidv4 } from 'uuid'
import { type NextFunction, type Request, type Response } from 'express'
import {
  addMessageToConversation,
  deleteAllMessagesByConvoId,
  getAllMessagesByConvoId,
  getAllConvoMsgsSortByTimeStamp
} from '../models/conversations/conversations'
import { type IConversationMessageAttributes } from '../models/conversations/types'
import { isMsgValid } from '../utils/validation-utils'
import CustomError from '../utils/CustomError'
import appLogger from '../appLogger'

interface CleanedMessage {
  messageId: string
  senderUserId: string
  timestamp: string
  source: 'outgoing' | 'incoming'
  text: string
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

export const transformDynamoMsg = (_req: Request, _res: Response, next: NextFunction): void => {
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
    transformedMessages.push({
      // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
      messageId: _res.locals.messages[_res.locals.conversationId][index].messageId + '',
      senderUserId: _res.locals.messages[_res.locals.conversationId][index].senderId,
      source: senderId === _res.locals.jwt.username ? 'outgoing' : 'incoming',
      text: _res.locals.messages[_res.locals.conversationId][index].message,
      timestamp: _res.locals.messages[_res.locals.conversationId][index].timeStamp
    })
  }

  appLogger.info(`Transformed messages for conversationid are ${JSON.stringify(transformedMessages)}`)
  _res.send(transformedMessages)
}

export const storeNewMessage = async (_req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!isMsgValid(_req.body.conversationId, _req.body.senderUserId, _req.body.text)) {
      throw new CustomError('Missing required information', { code: 400 })
    }
    const newMessage: IConversationMessageAttributes = {
      conversationId: _req.body.conversationId,
      messageId: `message-${uuidv4()}`,
      timeStamp: Date.now(),
      message: _req.body.text,
      senderId: _req.body.senderUserId
    }

    const response3 = await addMessageToConversation(newMessage)

    if (response3.$metadata.httpStatusCode !== 200) {
      throw new CustomError('DB Error while adding message to conversation', { code: 500 })
    }

    _res.status(200).send({ ...newMessage, localMessageId: _req.body.localMessageId ?? '' })
  } catch (err: any) {
    if (err instanceof CustomError) {
      appLogger.error(`${err.message}: ${JSON.stringify(err.stack)}`)
      _res.status(err.details.code).send(err.message)
      return
    }
    appLogger.error(`${JSON.stringify(err.stack)}`)
    _res.status(500).send('Something went wrong. Please try again later')
  }
}

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
