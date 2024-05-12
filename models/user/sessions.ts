import { type DeleteCommandOutput, type GetCommandOutput, type PutCommandOutput } from '@aws-sdk/lib-dynamodb'
import DynamoDbClient, { BASE_TABLE } from '../connection.js'
import { type IUserSessionKeys, SESSION_PREFIX, USER_PREFIX, type IUserSessionEntity } from './types.js'

const createSessionKeys = (userid: string, sessionid: string): IUserSessionKeys => {
  return {
    pkid: `${USER_PREFIX}${userid}`,
    skid: `${SESSION_PREFIX}${sessionid}`
  }
}

const getSession = async (userid: string, sessionid: string): Promise<GetCommandOutput> => {
  return await DynamoDbClient.get({
    TableName: BASE_TABLE,
    Key: createSessionKeys(userid, sessionid),
    ConsistentRead: true,
    ProjectionExpression: 'sessionId, createdAt'
  })
}

const storeSession = async (session: IUserSessionEntity): Promise<PutCommandOutput> => {
  return await DynamoDbClient.put({
    Item: session,
    TableName: BASE_TABLE
  })
}

const deleteSession = async (userid: string, sessionid: string): Promise<DeleteCommandOutput> => {
  console.log('Executing actual deleteSession')
  return await DynamoDbClient.delete({
    Key: createSessionKeys(userid, sessionid),
    TableName: BASE_TABLE
  })
}

export default {
  createSessionKeys,
  getSession,
  storeSession,
  deleteSession
}
