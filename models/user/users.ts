import DynamoDbClient, { BASE_TABLE } from '../connection.js'
import {
  type IUserProfileKeys,
  PROFILE_PREFIX,
  USER_PREFIX,
  type IUserProfileEntity,
  type IUserConversationKeys,
  type IUserConversationEntity,
  type IUserConversationAttributes,
  type IUserProfileAttibutes,
  type IUserSettingEntity,
  SETTING_PREFIX,
  type IUserSettingKeys
} from './types.js'
import { CONVERSATION_PREFIX } from '../conversations/types.js'
import { type z } from 'zod'
import { type userSettingSchema } from './schema.js'

import {
  type GetCommandOutput,
  type DeleteCommandOutput,
  type PutCommandOutput,
  type QueryCommandOutput,
  type UpdateCommandOutput
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
    TableName: BASE_TABLE,
    ConditionExpression: 'attribute_not_exists(pkid)'
  })
}

export const updateUser = async (userProfile: IUserProfileAttibutes): Promise<PutCommandOutput> => {
  const profile: IUserProfileEntity = {
    pkid: `${USER_PREFIX}${userProfile.username}`,
    skid: `${PROFILE_PREFIX}${userProfile.username}`,
    ...userProfile
  }
  return await DynamoDbClient.put({
    Item: profile,
    TableName: BASE_TABLE,
    ConditionExpression: 'attribute_exists(pkid)'
  })
}

export const getUserSettingsDb = async (userId: string): Promise<GetCommandOutput> => {
  const keys: IUserSettingKeys = {
    pkid: `${USER_PREFIX}${userId}`,
    skid: `${SETTING_PREFIX}${userId}`
  }
  return await DynamoDbClient.get({
    TableName: BASE_TABLE,
    Key: keys,
    ConsistentRead: true
  })
}

export const getUserSettingDb = async (
  userId: string,
  settingKey: keyof z.infer<typeof userSettingSchema>
): Promise<GetCommandOutput> => {
  const keys: IUserSettingKeys = {
    pkid: `${USER_PREFIX}${userId}`,
    skid: `${SETTING_PREFIX}${userId}`
  }
  return await DynamoDbClient.get({
    TableName: BASE_TABLE,
    Key: keys,
    ConsistentRead: true,
    AttributesToGet: [settingKey]
  })
}

export const updateAllUserSettingDb = async (
  userid: string,
  userSetting: z.infer<typeof userSettingSchema>
): Promise<UpdateCommandOutput> => {
  const setting: IUserSettingEntity = {
    pkid: `${USER_PREFIX}${userid}`,
    skid: `${SETTING_PREFIX}${userid}`,
    ...userSetting
  }
  return await DynamoDbClient.put({
    Item: setting,
    TableName: BASE_TABLE
  })
}

export const updateSingleUserSettingDb = async (
  userid: string,
  userSettingKey: string,
  userSettingValue: string
): Promise<UpdateCommandOutput> => {
  const userSettingDbKeys: IUserSettingKeys = {
    pkid: `${USER_PREFIX}${userid}`,
    skid: `${SETTING_PREFIX}${userid}`
  }
  return await DynamoDbClient.update({
    Key: userSettingDbKeys,
    TableName: BASE_TABLE,
    UpdateExpression: 'SET #attr1 = :val1',
    ConditionExpression: 'attribute_exists(pkid)',
    ExpressionAttributeNames: {
      '#attr1': userSettingKey
    },
    ExpressionAttributeValues: {
      ':val1': userSettingValue
    }
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

export default {
  getUser,
  updateSingleUserSettingDb
}
