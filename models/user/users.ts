import { type AWSError } from 'aws-sdk'
import { v4 as uuidv4 } from 'uuid'
import { type DocumentClient } from 'aws-sdk/clients/dynamodb'
import { type PromiseResult } from 'aws-sdk/lib/request'
import DynamoDB, { BASE_TABLE } from '../connection'
import {
  type IUserProfileKeys,
  PROFILE_PREFIX,
  USER_PREFIX,
  type IUserProfileEntity,
  type IUserConversationKeys,
  type IUserConversationEntity,
  type IUserConversationAttributes,
  type IUserSessionEntity,
  SESSION_PREFIX,
  type IUserSessionKeys
} from './types'
import { CONVERSATION_PREFIX } from '../conversations/types'

export const getUser = async (userId: string): Promise<PromiseResult<DocumentClient.GetItemOutput, AWSError>> => {
  const keys: IUserProfileKeys = {
    pkid: `${USER_PREFIX}${userId}`,
    skid: `${PROFILE_PREFIX}${userId}`
  }
  return await DynamoDB.get({
    TableName: BASE_TABLE,
    Key: keys,
    ConsistentRead: true
  }).promise()
}

export const createUser = async (
  userProfile: IUserProfileEntity
): Promise<PromiseResult<DocumentClient.PutItemOutput, AWSError>> => {
  return await DynamoDB.put({
    Item: userProfile,
    TableName: BASE_TABLE
  }).promise()
}

export const deleteUserConversation = async (
  userId: string,
  conversationId: string
): Promise<PromiseResult<DocumentClient.DeleteItemOutput, AWSError>> => {
  const keys: IUserConversationKeys = {
    pkid: `${USER_PREFIX}${userId}`,
    skid: `${CONVERSATION_PREFIX}${conversationId}`
  }
  return await DynamoDB.delete({
    TableName: BASE_TABLE,
    Key: keys
  }).promise()
}

export const createUserConversation = async (
  userId: string,
  conversation: IUserConversationAttributes
): Promise<PromiseResult<DocumentClient.PutItemOutput, AWSError>> => {
  const newUserConvo: IUserConversationEntity = {
    pkid: `${USER_PREFIX}${userId}`,
    skid: `${CONVERSATION_PREFIX}${conversation.conversationId}`,
    ...conversation
  }
  return await DynamoDB.put({
    TableName: BASE_TABLE,
    Item: newUserConvo
  }).promise()
}

export const createUserSession = async (
  userId: string
): Promise<PromiseResult<DocumentClient.PutItemOutput, AWSError>> => {
  const sessionId: string = uuidv4()

  const sessionEntity: IUserSessionEntity = {
    pkid: `${USER_PREFIX}${userId}`,
    skid: `${SESSION_PREFIX}${sessionId}`,
    sessionId,
    userId,
    timestamp: new Date().toUTCString()
  }
  return await DynamoDB.put({
    TableName: BASE_TABLE,
    Item: sessionEntity
  }).promise()
}

export const deleteUserSession = async (
  userId: string,
  sessionId: string
): Promise<PromiseResult<DocumentClient.DeleteItemOutput, AWSError>> => {
  const keys: IUserSessionKeys = {
    pkid: `${USER_PREFIX}${userId}`,
    skid: `${SESSION_PREFIX}${sessionId}`
  }

  return await DynamoDB.delete({
    TableName: BASE_TABLE,
    Key: keys
  }).promise()
}
