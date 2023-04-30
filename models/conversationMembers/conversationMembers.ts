import { type AWSError } from 'aws-sdk'
import { type DocumentClient } from 'aws-sdk/clients/dynamodb'
import { type PromiseResult } from 'aws-sdk/lib/request'
import DynamoDB from '../connection'
import { CONVERSATION_MEMBERS_TABLE } from '../constants'
import { type IConversationMember } from '../types'

export const createConversationMember = async (
  conversationMember: IConversationMember
): Promise<PromiseResult<DocumentClient.PutItemOutput, AWSError>> => {
  return await DynamoDB.put({
    TableName: CONVERSATION_MEMBERS_TABLE,
    Item: conversationMember
  }).promise()
}

export const getConversationMembers = async (
  conversationId: string
): Promise<PromiseResult<DocumentClient.QueryOutput, AWSError>> => {
  return await DynamoDB.query({
    TableName: CONVERSATION_MEMBERS_TABLE,
    KeyConditionExpression: '#conversationId = :conversationId',
    ExpressionAttributeNames: {
      '#conversationId': 'conversationId'
    },
    ExpressionAttributeValues: {
      ':conversationId': conversationId
    }
  }).promise()
}

export const getAllConversationIdsByMember = async (
  memberUsername: string
): Promise<PromiseResult<DocumentClient.QueryOutput, AWSError>> => {
  return await DynamoDB.query({
    TableName: CONVERSATION_MEMBERS_TABLE,
    KeyConditionExpression: '#memberId = :memberId',
    ExpressionAttributeNames: {
      '#memberId': 'memberId'
    },
    ExpressionAttributeValues: {
      ':memberId': memberUsername
    },
    ProjectionExpression: 'conversationId'
  }).promise()
}

export const getConversationMember = async (
  conversationId: string,
  memberUsername: string
): Promise<PromiseResult<DocumentClient.GetItemOutput, AWSError>> => {
  return await DynamoDB.get({
    TableName: CONVERSATION_MEMBERS_TABLE,
    Key: { conversationId, memberId: memberUsername }
  }).promise()
}

export const deleteConversationMember = async (
  conversationId: string,
  memberUsername: string
): Promise<PromiseResult<DocumentClient.DeleteItemOutput, AWSError>> => {
  return await DynamoDB.delete({
    TableName: CONVERSATION_MEMBERS_TABLE,
    Key: { conversationId, memberId: memberUsername }
  }).promise()
}
