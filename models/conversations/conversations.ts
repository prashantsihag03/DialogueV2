import { type AWSError } from 'aws-sdk'
import { type PromiseResult } from 'aws-sdk/lib/request'
import DynamoDB, { BASE_TABLE } from '../connection'
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
import { type DocumentClient } from 'aws-sdk/clients/dynamodb'

/**
 * Creates info item for the new conversation
 * @param conversationInfoAttributes Info attributes for the new conversation
 */
export const createConversation = async (
  conversationInfoAttributes: IConversationInfoAttributes
): Promise<PromiseResult<DocumentClient.PutItemOutput, AWSError>> => {
  const infoEntity: IConversationInfoEntity = {
    pkid: `${CONVERSATION_PREFIX}${conversationInfoAttributes.conversationId}`,
    skid: `${INFO_PREFIX}${conversationInfoAttributes.conversationId}`,
    ...conversationInfoAttributes
  }
  return await DynamoDB.put({
    TableName: BASE_TABLE,
    Item: infoEntity
  }).promise()
}

/**
 * Creates a new member item for given conversation.
 * @param conversationMember Member attributes
 */
export const addConversationMember = async (
  conversationMember: IConversationMemberAttributes
): Promise<PromiseResult<DocumentClient.PutItemOutput, AWSError>> => {
  const memberEntity: IConversationMemberEntity = {
    pkid: `${CONVERSATION_PREFIX}${conversationMember.conversationId}`,
    skid: `${MEMBER_PREFIX}${conversationMember.memberId}`,
    ...conversationMember
  }
  return await DynamoDB.put({
    TableName: BASE_TABLE,
    Item: memberEntity
  }).promise()
}

export const getConversationMembers = async (
  conversationId: string
): Promise<PromiseResult<DocumentClient.QueryOutput, AWSError>> => {
  return await DynamoDB.query({
    TableName: BASE_TABLE,
    KeyConditionExpression: 'PK = :pk and starts_with(SK, :sk)',
    ExpressionAttributeValues: {
      ':pk': `${CONVERSATION_PREFIX}${conversationId}`,
      ':sk': MEMBER_PREFIX
    }
  }).promise()
}

export const getConversationInfoById = async (
  conversationId: string
): Promise<PromiseResult<DocumentClient.GetItemOutput, AWSError>> => {
  const conversationInfoKeys: IConversationInfoKeys = {
    pkid: `${CONVERSATION_PREFIX}${conversationId}`,
    skid: `${INFO_PREFIX}${conversationId}`
  }
  return await DynamoDB.get({
    TableName: BASE_TABLE,
    Key: conversationInfoKeys
  }).promise()
}

export const getAllMessages = async (
  conversationId: string
): Promise<PromiseResult<DocumentClient.QueryOutput, AWSError>> => {
  return await DynamoDB.query({
    TableName: BASE_TABLE,
    KeyConditionExpression: 'PK = :pk and starts_with(SK, :sk)',
    ExpressionAttributeValues: {
      ':pk': `${CONVERSATION_PREFIX}${conversationId}`,
      ':sk': MESSAGE_PREFIX
    }
  }).promise()
}

export const addMessageToConversation = async (
  messageAttributes: IConversationMessageAttributes
): Promise<PromiseResult<DocumentClient.PutItemOutput, AWSError>> => {
  const messageEntity: IConversationMessageEntity = {
    pkid: `${CONVERSATION_PREFIX}${messageAttributes.conversationId}`,
    skid: `${MESSAGE_PREFIX}${messageAttributes.messageId}`,
    ...messageAttributes
  }
  return await DynamoDB.put({
    TableName: BASE_TABLE,
    Item: messageEntity
  }).promise()
}
