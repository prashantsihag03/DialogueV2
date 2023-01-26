import aws from 'aws-sdk'
import { AWS_REGION } from '../constants'

aws.config.update({
  region: AWS_REGION,
  dynamodb: {
    endpoint: process.env.AWS_ENDPOINT as string
  }
})

const DynamoDB = new aws.DynamoDB.DocumentClient()

export default DynamoDB
