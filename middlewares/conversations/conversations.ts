/* eslint-disable @typescript-eslint/indent */
import { v4 as uuidv4 } from 'uuid'
import { type Request, type Response, type NextFunction } from 'express'
import {
  addConversationMember,
  addMessageToConversation,
  createConversation,
  deleteAllMessagesByConvoId,
  deleteConversationInfo,
  deleteConversationMembers,
  getAllConvoMsgsSortByTimeStamp,
  getAllMessagesByConvoId,
  getConversationInfoById,
  getConversationMembers
} from '../../models/conversations/conversations.js'
import { createUserConversation, deleteUserConversation, getUser } from '../../models/user/users.js'
import {
  type IConversationInfoAttributes,
  type IConversationMessageAttributes
} from '../../models/conversations/types.js'
import appLogger from '../../appLogger.js'
import type ConversationQuickView from './types.js'
import CustomError from '../../utils/CustomError.js'
import { handleAsyncMdw } from '../../utils/error-utils.js'
import { validateNewConversationData } from '../../utils/conversations-utils.js'
import { isLoggedInUser } from '../../utils/login-utils.js'

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

    let lastMsgContent = lastMessage?.message
    if (lastMessage?.message != null) {
      if (lastMessage?.message === '' && lastMessage.file != null) {
        lastMsgContent = '[attachment]'
      }
    }

    convoQuickView.push({
      // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
      conversationId: _res.locals.conversationIds[index] + '',
      // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
      conversationName: convoInfo.isGroup === true ? convoInfo.conversationName : userConvo.conversationName,
      lastMessage: lastMsgContent ?? '',
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
  // TODO: Utilise bulk/batch fetching here
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
    validateNewConversationData(_req.body)
    if (isLoggedInUser(_req.body.conversationUserId, _res)) {
      throw new CustomError('Creating conversation with yourself is not supported yet!', {
        code: 400
      })
    }

    if (_res.locals.userConversations == null) {
      throw new CustomError('Something went wrong. Please try again later!', {
        code: 400,
        internalMsg: 'Expected list of user conversations to be available in response.locals object but found nothing.'
      })
    }

    const userConvoExists = _res.locals.userConversations.find(
      (userConvo: { conversationName: any }) => userConvo.conversationName === _req.body.conversationUserId
    )

    if (userConvoExists != null) {
      throw new CustomError('Conversation already exists!', {
        code: 400
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
    const memRes = await addConversationMember({
      conversationId: newConversation.conversationId,
      memberId: _res.locals.jwt.username,
      JoinedAt: newConversation.createdAt
    })
    const mem2Res = await addConversationMember({
      conversationId: newConversation.conversationId,
      memberId: _req.body.conversationUserId,
      JoinedAt: newConversation.createdAt
    })

    if (memRes.$metadata.httpStatusCode !== 200 || mem2Res.$metadata.httpStatusCode !== 200) {
      throw new CustomError('Couldnt assign members to conversation!', {
        code: 500,
        data: { conversationId: newConversation.conversationId }
      })
    }

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

      const convoDelMembersResp = await deleteConversationMembers(
        members.Items.map((item) => item.memberId),
        _req.params.conversationId
      )
      if (convoDelMembersResp.$metadata.httpStatusCode !== 200) {
        throw new CustomError('Something went wrong. Please try again later!', { code: 500 })
      }
    }

    // delete conversation info
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
