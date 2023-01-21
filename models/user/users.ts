import DynamoDB from "../connection";
import { USERS_TABLE } from "../constants";
import { User } from "../types";

export const getUser = (username: string) => {
    return DynamoDB.get({
        TableName: USERS_TABLE,
        Key: {username: username},
        ConsistentRead: true,
    }).promise();
}

export const storeUser = (user: User) => {
    return DynamoDB.put({
        Item: user, TableName: USERS_TABLE
    }).promise();
}