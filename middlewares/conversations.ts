import { type NextFunction, type Request, type Response } from 'express'
import { getAllConversationIdsByMember } from '../models/conversationMembers/conversationMembers'
import { getLastMessages } from '../models/messages/messages'
import { type IMessage } from '../models/types'
import { getUsername } from '../utils/auth-utils'

/**
 * Fetch information for all conversations where provided user is a member.
 */
export const getAllConversationsForUser = async (_req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const username = getUsername(_res)
    if (username == null) {
      throw new Error('Username is undefined!')
    }

    const allConversationIdsResult = await getAllConversationIdsByMember(username)
    if (allConversationIdsResult.Count == null || allConversationIdsResult.Items == null) {
      throw new Error('Count and/or Items are NULL. Non Null value expected!')
    }

    if (allConversationIdsResult.Count === 0) {
      _res.send([])
      return
    }

    const allConvIds: string[] = allConversationIdsResult.Items.map((item) => {
      if (item.conversationId != null) return item.conversationId
      else throw new Error('Null conversationId received. Non null expected!')
    })

    const allRecentMessagesByConvosResult = await getLastMessages(allConvIds)
    if (allRecentMessagesByConvosResult.Responses == null) {
      throw new Error('Responses is null. Non null value expected!')
    }

    if (allRecentMessagesByConvosResult.Responses.MESSAGES_TABLE == null) {
      throw new Error('Null returned! Empty list expected!')
    }

    const parsedRecentMsgsByConvos: IMessage[] = allRecentMessagesByConvosResult.Responses.MESSAGES_TABLE.map(
      (item) => {
        return {
          conversationId: item.conversationId,
          messageId: item.messageId,
          message: item.message,
          senderId: item.senderId,
          timeStamp: item.timestamp
        }
      }
    )
    _res.send(parsedRecentMsgsByConvos)
    return
  } catch (e) {
    console.error('An error encountered in getAllConversationsForUser: ', e)
    _res.sendStatus(500)
  }
}
