import { type AWSError } from 'aws-sdk'
import { type DocumentClient } from 'aws-sdk/clients/dynamodb'
import { type PromiseResult } from 'aws-sdk/lib/request'
import DynamoDB from '../connection'
import { CONVERSATIONS_TABLE } from '../constants'
import { type IConversations } from '../types'

export const createConversation = async (
  conversation: IConversations
): Promise<PromiseResult<DocumentClient.PutItemOutput, AWSError>> => {
  return await DynamoDB.put({
    TableName: CONVERSATIONS_TABLE,
    Item: conversation
  }).promise()
}

export const getConversation = async (
  conversationId: string
): Promise<PromiseResult<DocumentClient.GetItemOutput, AWSError>> => {
  return await DynamoDB.get({
    TableName: CONVERSATIONS_TABLE,
    Key: { conversationId }
  }).promise()
}

export const deleteConversation = async (
  conversationId: string
): Promise<PromiseResult<DocumentClient.DeleteItemOutput, AWSError>> => {
  return await DynamoDB.delete({
    TableName: CONVERSATIONS_TABLE,
    Key: { conversationId }
  }).promise()
}
