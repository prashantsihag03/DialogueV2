import { type PutCommandOutput } from '@aws-sdk/lib-dynamodb'
import {
  CALL_PREFIX,
  CONVERSATION_PREFIX,
  type IConversationCallKeys,
  type IConversationCallAttributes,
  type IConversationCallEntity
} from './types.js'
import DynamoDbClient, { BASE_TABLE } from '../connection.js'

export const createCall = async (
  conversationCallAttributes: IConversationCallAttributes
): Promise<PutCommandOutput> => {
  const infoEntity: IConversationCallEntity = {
    pkid: `${CONVERSATION_PREFIX}${conversationCallAttributes.conversationId}`,
    skid: `${CALL_PREFIX}${conversationCallAttributes.conversationId}`,
    ...conversationCallAttributes
  }
  return await DynamoDbClient.put({
    TableName: BASE_TABLE,
    Item: infoEntity
  })
}

export const updateCallEndTime = async (
  newEndedAt: number,
  convoId: string,
  callId: string
): Promise<PutCommandOutput> => {
  const infoKeys: IConversationCallKeys = {
    pkid: `${CONVERSATION_PREFIX}${convoId}`,
    skid: `${CALL_PREFIX}${callId}`
  }
  return await DynamoDbClient.update({
    TableName: BASE_TABLE,
    Key: infoKeys,
    UpdateExpression: 'SET #attr1 = :val1',
    ConditionExpression: 'attribute_exists(pkid)',
    ExpressionAttributeNames: {
      '#attr1': 'endedAt'
    },
    ExpressionAttributeValues: {
      ':val1': newEndedAt
    }
  })
}
