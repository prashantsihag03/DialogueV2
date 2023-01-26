import { type AWSError } from 'aws-sdk'
import { type DocumentClient } from 'aws-sdk/clients/dynamodb'
import { type PromiseResult } from 'aws-sdk/lib/request'
import DynamoDB from '../connection'
import { USERS_TABLE } from '../constants'
import { type User } from '../types'

export const getUser = async (username: string): Promise<PromiseResult<DocumentClient.GetItemOutput, AWSError>> => {
  return await DynamoDB.get({
    TableName: USERS_TABLE,
    Key: { username },
    ConsistentRead: true
  }).promise()
}

export const storeUser = async (user: User): Promise<PromiseResult<DocumentClient.PutItemOutput, AWSError>> => {
  return await DynamoDB.put({
    Item: user, TableName: USERS_TABLE
  }).promise()
}
