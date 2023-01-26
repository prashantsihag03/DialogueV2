import { type AWSError } from 'aws-sdk'
import { type DocumentClient } from 'aws-sdk/clients/dynamodb'
import { type PromiseResult } from 'aws-sdk/lib/request'
import DynamoDB from '../connection'
import { SESSION_TABLE } from '../constants'
import { type Session } from '../types'

export const getSession = async (sessionid: string): Promise<PromiseResult<DocumentClient.GetItemOutput, AWSError>> => {
  return await DynamoDB.get({
    TableName: SESSION_TABLE,
    Key: { sessionid },
    ConsistentRead: true,
    ProjectionExpression: 'username, sessionId'
  }).promise()
}

export const storeSession = async (session: Session): Promise<PromiseResult<DocumentClient.PutItemOutput, AWSError>> => {
  return await DynamoDB.put({
    Item: session, TableName: SESSION_TABLE
  }).promise()
}

export const deleteSession = async (sessionId: string): Promise<PromiseResult<DocumentClient.DeleteItemOutput, AWSError>> => {
  return await DynamoDB.delete({
    Key: { sessionid: sessionId }, TableName: SESSION_TABLE
  }).promise()
}
