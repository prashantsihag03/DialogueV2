import DynamoDB from "../connection";
import { SESSION_TABLE } from "../constants";
import { Session } from "../types";

export const getSession = (sessionid: string) => {
  return DynamoDB.get({
    TableName: SESSION_TABLE,
    Key: { sessionid: sessionid},
    ConsistentRead: true,
    ProjectionExpression: "username, sessionId",
  })
  .promise();
};

export const storeSession = (session: Session) => {
  return DynamoDB.put({
    Item: session, TableName: SESSION_TABLE
  })
  .promise();
}

export const deleteSession = (sessionId: string) => {
  return DynamoDB.delete({
    Key: {sessionid: sessionId}, TableName: SESSION_TABLE
  }).promise();
}