import { type DeleteCommandOutput, type GetCommandOutput, type PutCommandOutput } from '@aws-sdk/lib-dynamodb'
import DynamoDbClient, { BASE_TABLE } from '../connection.js'
import { type IUserSessionKeys, SESSION_PREFIX, USER_PREFIX, type IUserSessionEntity } from './types.js'

export const createSessionKeys = (userid: string, sessionid: string): IUserSessionKeys => {
  return {
    pkid: `${USER_PREFIX}${userid}`,
    skid: `${SESSION_PREFIX}${sessionid}`
  }
}

export const getSession = async (userid: string, sessionid: string): Promise<GetCommandOutput> => {
  return await DynamoDbClient.get({
    TableName: BASE_TABLE,
    Key: createSessionKeys(userid, sessionid),
    ConsistentRead: true,
    ProjectionExpression: 'sessionId, createdAt'
  })
}

export const storeSession = async (session: IUserSessionEntity): Promise<PutCommandOutput> => {
  return await DynamoDbClient.put({
    Item: session,
    TableName: BASE_TABLE
  })
}

export const deleteSession = async (userid: string, sessionid: string): Promise<DeleteCommandOutput> => {
  return await DynamoDbClient.delete({
    Key: createSessionKeys(userid, sessionid),
    TableName: BASE_TABLE
  })
}
