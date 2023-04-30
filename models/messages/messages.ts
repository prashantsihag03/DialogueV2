import { type AWSError } from 'aws-sdk'
import { type DocumentClient } from 'aws-sdk/clients/dynamodb'
import { type PromiseResult } from 'aws-sdk/lib/request'
import DynamoDB from '../connection'
import { MESSAGES_TABLE } from '../constants'
import { type IMessage } from '../types'

export const createMessage = async (
  message: IMessage
): Promise<PromiseResult<DocumentClient.PutItemOutput, AWSError>> => {
  return await DynamoDB.put({
    TableName: MESSAGES_TABLE,
    Item: message
  }).promise()
}

export const getConversationMessages = async (
  conversationId: string
): Promise<PromiseResult<DocumentClient.QueryOutput, AWSError>> => {
  return await DynamoDB.query({
    TableName: MESSAGES_TABLE,
    KeyConditionExpression: '#conversationId = :conversationId',
    ExpressionAttributeNames: {
      '#conversationId': 'conversationId'
    },
    ExpressionAttributeValues: {
      ':conversationId': conversationId
    }
  }).promise()
}

export const getConversationMessage = async (
  conversationId: string,
  messageId: string
): Promise<PromiseResult<DocumentClient.GetItemOutput, AWSError>> => {
  return await DynamoDB.get({
    TableName: MESSAGES_TABLE,
    Key: { conversationId, messageId }
  }).promise()
}

export const getLastMessages = async (
  conversationIds: string[]
): Promise<PromiseResult<DocumentClient.BatchGetItemOutput, AWSError>> => {
  return await DynamoDB.batchGet({
    RequestItems: {
      MESSAGES_TABLE: {
        Keys: conversationIds.map((id) => ({ conversationId: id }))
      }
    }
  }).promise()
}

export const deleteMessage = async (
  conversationId: string,
  messageId: string
): Promise<PromiseResult<DocumentClient.DeleteItemOutput, AWSError>> => {
  return await DynamoDB.delete({
    TableName: MESSAGES_TABLE,
    Key: { conversationId, messageId }
  }).promise()
}
