import DynamoDbClient, { BASE_TABLE } from '../connection'
import {
  type IUserProfileKeys,
  PROFILE_PREFIX,
  USER_PREFIX,
  type IUserProfileEntity,
  type IUserConversationKeys,
  type IUserConversationEntity,
  type IUserConversationAttributes,
  type IUserProfileAttibutes
} from './types'
import { CONVERSATION_PREFIX } from '../conversations/types'
import {
  type GetCommandOutput,
  type DeleteCommandOutput,
  type PutCommandOutput,
  type QueryCommandOutput
} from '@aws-sdk/lib-dynamodb'

export const getUser = async (userId: string): Promise<GetCommandOutput> => {
  const keys: IUserProfileKeys = {
    pkid: `${USER_PREFIX}${userId}`,
    skid: `${PROFILE_PREFIX}${userId}`
  }
  return await DynamoDbClient.get({
    TableName: BASE_TABLE,
    Key: keys,
    ConsistentRead: true
  })
}

export const searchUser = async (partialUserId: string): Promise<QueryCommandOutput> => {
  return await DynamoDbClient.query({
    TableName: BASE_TABLE,
    KeyConditionExpression: 'pkid = :pk and begins_with(skid, :sk)',
    ExpressionAttributeValues: {
      ':pk': `${USER_PREFIX}${partialUserId}`,
      ':sk': CONVERSATION_PREFIX
    }
  })
}

export const createUser = async (userProfile: IUserProfileAttibutes): Promise<PutCommandOutput> => {
  const profile: IUserProfileEntity = {
    pkid: `${USER_PREFIX}${userProfile.username}`,
    skid: `${PROFILE_PREFIX}${userProfile.username}`,
    ...userProfile
  }
  return await DynamoDbClient.put({
    Item: profile,
    TableName: BASE_TABLE
  })
}

export const deleteUserConversation = async (userId: string, conversationId: string): Promise<DeleteCommandOutput> => {
  const keys: IUserConversationKeys = {
    pkid: `${USER_PREFIX}${userId}`,
    skid: `${CONVERSATION_PREFIX}${conversationId}`
  }
  return await DynamoDbClient.delete({
    TableName: BASE_TABLE,
    Key: keys
  })
}

export const createUserConversation = async (
  userId: string,
  conversation: IUserConversationAttributes
): Promise<PutCommandOutput> => {
  const newUserConvo: IUserConversationEntity = {
    pkid: `${USER_PREFIX}${userId}`,
    skid: `${CONVERSATION_PREFIX}${conversation.conversationId}`,
    ...conversation
  }
  return await DynamoDbClient.put({
    TableName: BASE_TABLE,
    Item: newUserConvo
  })
}

export const getAllUserConversations = async (userId: string): Promise<QueryCommandOutput> => {
  return await DynamoDbClient.query({
    TableName: BASE_TABLE,
    KeyConditionExpression: 'pkid = :pk and begins_with(skid, :sk)',
    ExpressionAttributeValues: {
      ':pk': `${USER_PREFIX}${userId}`,
      ':sk': CONVERSATION_PREFIX
    }
  })
}
