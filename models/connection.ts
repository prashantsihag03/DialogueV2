import aws from 'aws-sdk'
import { AWS_REGION } from '../constants'

export const BASE_TABLE = 'dialogueV2_base'

aws.config.update({
  region: AWS_REGION,
  dynamodb: {
    endpoint: process.env.AWS_ENDPOINT as string
  }
})

const DynamoDB = new aws.DynamoDB.DocumentClient()

export default DynamoDB
