import {
  type BatchWriteCommandOutput,
  type GetCommandOutput,
  type PutCommandOutput,
  type QueryCommandOutput
} from '@aws-sdk/lib-dynamodb'
import DynamoDbClient, { BASE_TABLE, GSI_CONVO_TIMESTAMP } from '../connection'
import {
  CONVERSATION_PREFIX,
  type IConversationInfoKeys,
  INFO_PREFIX,
  type IConversationInfoAttributes,
  type IConversationMemberAttributes,
  MEMBER_PREFIX,
  type IConversationInfoEntity,
  type IConversationMemberEntity,
  MESSAGE_PREFIX,
  type IConversationMessageEntity,
  type IConversationMessageAttributes
} from './types'

/**
 * Creates info item for the new conversation
 * @param conversationInfoAttributes Info attributes for the new conversation
 */
export const createConversation = async (
  conversationInfoAttributes: IConversationInfoAttributes
): Promise<PutCommandOutput> => {
  const infoEntity: IConversationInfoEntity = {
    pkid: `${CONVERSATION_PREFIX}${conversationInfoAttributes.conversationId}`,
    skid: `${INFO_PREFIX}${conversationInfoAttributes.conversationId}`,
    ...conversationInfoAttributes
  }
  return await DynamoDbClient.put({
    TableName: BASE_TABLE,
    Item: infoEntity
  })
}

/**
 * Creates info item for the new conversation
 * @param conversationInfoAttributes Info attributes for the new conversation
 */
export const deleteConversationInfo = async (conversationId: string): Promise<PutCommandOutput> => {
  const infoKey: IConversationInfoKeys = {
    pkid: `${CONVERSATION_PREFIX}${conversationId}`,
    skid: `${INFO_PREFIX}${conversationId}`
  }

  return await DynamoDbClient.delete({
    TableName: BASE_TABLE,
    Key: infoKey
  })
}

export const deleteConversationMembers = async (
  memberIds: string[],
  conversationId: string
): Promise<BatchWriteCommandOutput> => {
  const deleteRequestItems = memberIds.map((memberId) => {
    return {
      DeleteRequest: {
        Key: {
          pkid: `${CONVERSATION_PREFIX}${conversationId}`,
          skid: `${MEMBER_PREFIX}${memberId}`
        }
      }
    }
  })

  return await DynamoDbClient.batchWrite({
    RequestItems: {
      [BASE_TABLE]: deleteRequestItems
    }
  })
}

/**
 * Creates a new member item for given conversation.
 * @param conversationMember Member attributes
 */
export const addConversationMember = async (
  conversationMember: IConversationMemberAttributes
): Promise<PutCommandOutput> => {
  const memberEntity: IConversationMemberEntity = {
    pkid: `${CONVERSATION_PREFIX}${conversationMember.conversationId}`,
    skid: `${MEMBER_PREFIX}${conversationMember.memberId}`,
    ...conversationMember
  }
  return await DynamoDbClient.put({
    TableName: BASE_TABLE,
    Item: memberEntity
  })
}

export const getConversationMembers = async (conversationId: string): Promise<QueryCommandOutput> => {
  return await DynamoDbClient.query({
    TableName: BASE_TABLE,
    KeyConditionExpression: 'pkid = :pk and begins_with(skid, :sk)',
    ExpressionAttributeValues: {
      ':pk': `${CONVERSATION_PREFIX}${conversationId}`,
      ':sk': MEMBER_PREFIX
    }
  })
}

export const getConversationInfoById = async (conversationId: string): Promise<GetCommandOutput> => {
  const conversationInfoKeys: IConversationInfoKeys = {
    pkid: `${CONVERSATION_PREFIX}${conversationId}`,
    skid: `${INFO_PREFIX}${conversationId}`
  }
  return await DynamoDbClient.get({
    TableName: BASE_TABLE,
    Key: conversationInfoKeys
  })
}

export const getAllMessagesByConvoId = async (conversationId: string): Promise<QueryCommandOutput> => {
  return await DynamoDbClient.query({
    TableName: BASE_TABLE,
    KeyConditionExpression: 'pkid = :pk and begins_with(skid, :sk)',
    ExpressionAttributeValues: {
      ':pk': `${CONVERSATION_PREFIX}${conversationId}`,
      ':sk': MESSAGE_PREFIX
    }
  })
}

export const getAllConvoMsgsSortByTimeStamp = async (conversationId: string): Promise<QueryCommandOutput> => {
  return await DynamoDbClient.query({
    TableName: BASE_TABLE,
    IndexName: GSI_CONVO_TIMESTAMP,
    KeyConditionExpression: 'conversationId = :conversationId',
    ExpressionAttributeValues: {
      ':conversationId': conversationId
    }
  })
}

export const addMessageToConversation = async (
  messageAttributes: IConversationMessageAttributes
): Promise<PutCommandOutput> => {
  const messageEntity: IConversationMessageEntity = {
    pkid: `${CONVERSATION_PREFIX}${messageAttributes.conversationId}`,
    skid: `${MESSAGE_PREFIX}${messageAttributes.messageId}`,
    ...messageAttributes
  }
  return await DynamoDbClient.put({
    TableName: BASE_TABLE,
    Item: messageEntity
  })
}

export const deleteAllMessagesByConvoId = async (
  conversationId: string,
  messageIds: string[]
): Promise<BatchWriteCommandOutput> => {
  const deleteRequestItems = messageIds.map((msgId) => {
    return {
      DeleteRequest: {
        Key: {
          pkid: `${CONVERSATION_PREFIX}${conversationId}`,
          skid: `${MESSAGE_PREFIX}${msgId}`
        }
      }
    }
  })
  return await DynamoDbClient.batchWrite({
    RequestItems: {
      [BASE_TABLE]: deleteRequestItems
    }
  })
}
