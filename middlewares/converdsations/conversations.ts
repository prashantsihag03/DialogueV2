/* eslint-disable @typescript-eslint/indent */
import { v4 as uuidv4 } from 'uuid'
import { type Request, type Response, type NextFunction } from 'express'
import {
  addMessageToConversation,
  createConversation,
  deleteAllMessagesByConvoId,
  deleteConversationInfo,
  deleteConversationMembers,
  getAllConvoMsgsSortByTimeStamp,
  getAllMessagesByConvoId,
  getConversationInfoById,
  getConversationMembers
} from '../../models/conversations/conversations'
import { createUserConversation, deleteUserConversation, getUser } from '../../models/user/users'
import { type IConversationInfoAttributes, type IConversationMessageAttributes } from '../../models/conversations/types'
import appLogger from '../../appLogger'
import type ConversationQuickView from './types'
import CustomError from '../../utils/CustomError'
import { handleAsyncMdw } from '../../utils/error-utils'

export const transformConversationDataIntoQuickView = (_req: Request, _res: Response, next: NextFunction): void => {
  if (_res.locals.conversationIds == null || !Array.isArray(_res.locals.conversationIds)) {
    _res.send([])
    return
  }

  const convoQuickView: ConversationQuickView[] = []
  for (let index = 0; index < _res.locals.conversationIds.length; index++) {
    let lastMessage: IConversationMessageAttributes | undefined

    const convoInfo = _res.locals.conversationInfo?.find(
      (info: { conversationId: any }) => info.conversationId === _res.locals.conversationIds[index]
    )

    if (convoInfo == null) {
      // do not include the conversation into the response if INFO for this convo is missing
      continue
    }

    const userConvo = _res.locals.userConversations?.find(
      (info: { conversationId: any }) => info.conversationId === _res.locals.conversationIds[index]
    )

    if (_res.locals.conversationMessages?.length > 0) {
      lastMessage = {
        ..._res.locals.conversationMessages?.find(
          (msg: { conversationId: any }) => msg.conversationId === _res.locals.conversationIds[index]
        )
      }
    }
    convoQuickView.push({
      // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
      conversationId: _res.locals.conversationIds[index] + '',
      // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
      conversationName: convoInfo.isGroup === true ? convoInfo.conversationName : userConvo.conversationName,
      lastMessage: lastMessage?.message ?? '',
      lastMessageTime: lastMessage?.timeStamp,
      unseen: 0,
      lastMessageSenderId: lastMessage?.senderId ?? ''
    })
  }

  const emptyConversations: ConversationQuickView[] = []
  const nonEmptyConversations: ConversationQuickView[] = []

  convoQuickView.forEach((msg) => {
    if (msg.lastMessageTime != null) {
      nonEmptyConversations.push(msg)
    } else {
      emptyConversations.push(msg)
    }
  })
  const sortedNonEmptyConvos = nonEmptyConversations.sort((a, b) => {
    if (a.lastMessageTime == null || b.lastMessageTime == null) {
      return 0
    }
    return b.lastMessageTime - a.lastMessageTime
  })

  _res.send([...sortedNonEmptyConvos, ...emptyConversations])
}

export const getLatestMessageByConversations = async (
  _req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  if (_res.locals.conversationIds == null || !Array.isArray(_res.locals.conversationIds)) {
    _res.status(500).send('Something went wrong. Please try again later!')
    return
  }

  if (_res.locals.conversationIds.length < 1) {
    _res.locals.conversationMessages = []
    next()
    return
  }

  const conversationMessages = []
  for (let index = 0; index < _res.locals.conversationIds.length; index++) {
    const response = await getAllConvoMsgsSortByTimeStamp(_res.locals.conversationIds[index])
    if (response.$metadata.httpStatusCode === 200 && response.Items != null) {
      if (response.Items.length > 0) conversationMessages.push(response.Items.at(-1))
    } else {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      appLogger.warn(`Conversation Messages couldnt be retrieved for id: ${_res.locals.conversationIds[index]}`)
    }
  }
  _res.locals.conversationMessages = conversationMessages
  next()
}

export const getConversationInfo = async (_req: Request, _res: Response, next: NextFunction): Promise<void> => {
  if (_res.locals.conversationIds == null || !Array.isArray(_res.locals.conversationIds)) {
    _res.status(500).send('Something went wrong. Please try again later!')
    return
  }

  if (_res.locals.conversationIds.length < 1) {
    _res.locals.conversationInfo = []
    next()
    return
  }

  const conversationInfos = []
  for (let index = 0; index < _res.locals.conversationIds.length; index++) {
    const response = await getConversationInfoById(_res.locals.conversationIds[index])
    if (response.$metadata.httpStatusCode === 200 && response.Item != null) {
      conversationInfos.push(response.Item)
    } else {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      appLogger.warn(`Conversation Info couldnt be retrieved for id: ${_res.locals.conversationIds[index]}`)
    }
  }
  _res.locals.conversationInfo = conversationInfos
  next()
}

export const getOneToOneConversationUserNames = async (
  _req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  if (_res.locals.conversationInfo == null || !Array.isArray(_res.locals.conversationInfo)) {
    _res.status(500).send('Something went wrong. Please try again later!')
    return
  }

  if (_res.locals.conversationInfo.length < 1) {
    _res.locals.conversationInfo = []
    next()
    return
  }

  const conversationInfos = []
  for (let index = 0; index < _res.locals.conversationIds.length; index++) {
    const response = await getConversationInfoById(_res.locals.conversationIds[index])
    if (response.$metadata.httpStatusCode === 200 && response.Item != null) {
      conversationInfos.push(response.Item)
    } else {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      appLogger.warn(`Conversation Info couldnt be retrieved for id: ${_res.locals.conversationIds[index]}`)
    }
  }
  _res.locals.conversationInfo = conversationInfos
  next()
}

export const startNewConversation = handleAsyncMdw(
  async (_req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (_req.body.isGroup == null) throw new CustomError('Missing required information.', { code: 400 })
    if (_req.body.isGroup === true) throw new CustomError('Group conversations are not yet supported!', { code: 501 })
    if (_req.body.conversationUserId == null || _req.body.conversationUserId === _res.locals.jwt.username) {
      throw new CustomError('Invalid request body. Please provide valid values for all required properties', {
        code: 500
      })
    }

    const toUserResponse = await getUser(_req.body.conversationUserId)
    if (
      toUserResponse.$metadata.httpStatusCode !== 200 ||
      toUserResponse.Item?.username !== _req.body.conversationUserId
    ) {
      throw new CustomError('Conversation UserId does not exists!', {
        code: 500
      })
    }

    const newConversation: IConversationInfoAttributes = {
      conversationId: uuidv4(),
      conversationName: '',
      createdAt: Date.now(),
      createdBy: _res.locals.jwt.username,
      isGroup: false
    }

    const response = await createConversation(newConversation)
    const response1 = await createUserConversation(_req.body.conversationUserId, {
      conversationId: newConversation.conversationId,
      conversationName: _res.locals.jwt.username
    })
    const respons2 = await createUserConversation(_res.locals.jwt.username, {
      conversationId: newConversation.conversationId,
      conversationName: _req.body.conversationUserId
    })

    if (
      response.$metadata.httpStatusCode !== 200 ||
      response1.$metadata.httpStatusCode !== 200 ||
      respons2.$metadata.httpStatusCode !== 200
    ) {
      throw new CustomError('Something went wrong. Please try again later!', { code: 500 })
    }

    // add these two users as MEMBER to the conversation as well

    const response3 = await addMessageToConversation({
      conversationId: newConversation.conversationId,
      message: `${newConversation.createdBy} created this conversation.`,
      messageId: `message-${uuidv4()}`,
      senderId: newConversation.createdBy,
      timeStamp: newConversation.createdAt
    })

    if (response3.$metadata.httpStatusCode !== 200) {
      throw new CustomError('Something went wrong. Please try again later!', { code: 500 })
    }

    _res.status(200).send()
  }
)

export const getAllMembersByConversation = async (_req: Request, _res: Response, next: NextFunction): Promise<void> => {
  if (_req.params.conversationId === null) {
    _res.status(500).send('Required parameter missing!')
    return
  }

  const response = await getConversationMembers(_req.params.conversationId)
  if (response.$metadata.httpStatusCode !== 200) {
    _res.status(500).send('Error retrieving conversation members. Please try again later')
    return
  }

  _res.status(501).send('Feature not implemented yet')
}

export const deleteConversationMdw = handleAsyncMdw(
  async (_req: Request, _res: Response, next: NextFunction): Promise<void> => {
    // delete user conversations
    const members = await getConversationMembers(_req.params.conversationId)
    if (members.$metadata.httpStatusCode !== 200 || members.Items == null) {
      throw new CustomError('Something went wrong. Please try again later!', { code: 500 })
    }

    if (members.Items.length > 0) {
      appLogger.info('Members detected. Deleting user conversations ...')
      for (let index = 0; index < members.Items.length; index++) {
        const member = members.Items[index]
        if (member.memberId == null) {
          throw new CustomError('Something went wrong. Please try again later!', { code: 500 })
        }
        const userConvoDel = await deleteUserConversation(member.memberId, _req.params.conversationId)
        if (userConvoDel.$metadata.httpStatusCode !== 200) {
          throw new CustomError('Something went wrong. Please try again later!', { code: 500 })
        }
      }

      appLogger.info('Members detected. Deleting conversation members ...')
      const convoDelMembersResp = await deleteConversationMembers(
        members.Items.map((item) => item.memberId),
        _req.params.conversationId
      )
      if (convoDelMembersResp.$metadata.httpStatusCode !== 200) {
        throw new CustomError('Something went wrong. Please try again later!', { code: 500 })
      }
    }

    // delete conversation info
    appLogger.info('Deleting conversation info')
    const convoDelInfoResp = await deleteConversationInfo(_req.params.conversationId)
    // delete conversation members

    if (convoDelInfoResp.$metadata.httpStatusCode !== 200) {
      throw new CustomError('Something went wrong. Please try again later!', { code: 500 })
    }

    // get all messages for this conversation
    const allMsgResp = await getAllMessagesByConvoId(_req.params.conversationId)
    if (allMsgResp.$metadata.httpStatusCode !== 200 || allMsgResp.Items == null) {
      _res.status(500).send('Something went wrong. Please try again later!')
      return
    }

    // delete conversation messages
    if (allMsgResp.Items.length > 0) {
      appLogger.info('Messages detected. Deleting messages')
      const convoDelMsgConvoId = await deleteAllMessagesByConvoId(
        _req.params.conversationId,
        allMsgResp.Items.map((item) => item.messageId)
      )
      if (convoDelMsgConvoId.$metadata.httpStatusCode !== 200) {
        throw new CustomError('Something went wrong. Please try again later!', { code: 500 })
      }
    }

    _res.send({ status: 'success' })
  }
)
