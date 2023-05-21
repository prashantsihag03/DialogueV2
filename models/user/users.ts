import { type AWSError } from 'aws-sdk'
import { type DocumentClient } from 'aws-sdk/clients/dynamodb'
import { type PromiseResult } from 'aws-sdk/lib/request'
import DynamoDB from '../connection'
import { BASE_TABLE } from '../constants'
import { type IUserProfileKeys, PROFILE_PREFIX, USER_PREFIX, type IUserProfileEntity } from './types'

export const getUser = async (username: string): Promise<PromiseResult<DocumentClient.GetItemOutput, AWSError>> => {
  const keys: IUserProfileKeys = {
    PKID: `${USER_PREFIX}${username}`,
    SKID: `${PROFILE_PREFIX}${username}`
  }
  return await DynamoDB.get({
    TableName: BASE_TABLE,
    Key: keys,
    ConsistentRead: true
  }).promise()
}

export const storeUser = async (
  userProfile: IUserProfileEntity
): Promise<PromiseResult<DocumentClient.PutItemOutput, AWSError>> => {
  return await DynamoDB.put({
    Item: userProfile,
    TableName: BASE_TABLE
  }).promise()
}
