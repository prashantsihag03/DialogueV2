import { AWS_REGION } from '../constants'
import { DynamoDB, DynamoDBClient, type DynamoDBClientConfig } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb'
import appLogger from '../appLogger'

export const BASE_TABLE = 'dialogueV2_base'
export const GSI_CONVO_TIMESTAMP = 'conversation-timestamp-message'

const config: DynamoDBClientConfig = {
  region: AWS_REGION,
  endpoint: process.env.AWS_ENDPOINT as string
}
const dynamoDB = new DynamoDB(config)
const client = new DynamoDBClient(config)
const DynamoDbClient = DynamoDBDocument.from(client)

export const checkDbConnection = (): void => {
  dynamoDB.describeTable(
    {
      TableName: BASE_TABLE
    },
    (err, data) => {
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      if (!err) {
        appLogger.info('Database connection check successfull')
      } else {
        appLogger.error('Database connection check failed')
      }
    }
  )
}

export default DynamoDbClient
