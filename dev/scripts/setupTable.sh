#!/bin/bash

DB_SCRIPTS_PATH=$DIALOGUEV2_HOME/dev/scripts
bash $DB_SCRIPTS_PATH/validateEnv.sh

export TABLE_NAME="dialogueV2_base"
export DB_ENDPOINT="http://localhost:8000"

# AWS Dummy credentials
export AWS_ACCESS_KEY_ID=223344
export AWS_SECRET_ACCESS_KEY=wJalrXUtTHISI/DYNAMODB/bPxRfiCYEXAMPLEKEY
export AWS_REGION=us-east-1

# Check if table already exists
aws dynamodb describe-table \
  --table-name $TABLE_NAME \
  --endpoint-url $DB_ENDPOINT \
  > /dev/null 2>&1

if [ $? -eq 0 ]; then
  echo "Table already exists."
else
  echo "Table does not exist. Creating .."
  aws dynamodb create-table \
    --table-name $TABLE_NAME \
    --attribute-definitions AttributeName=pkid,AttributeType=S AttributeName=skid,AttributeType=S \
    --key-schema AttributeName=pkid,KeyType=HASH AttributeName=skid,KeyType=RANGE \
    --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
    --endpoint-url $DB_ENDPOINT \
    --output text > /dev/null

  if [ $? -eq 0 ]; then
    echo "Table successfully created."
  fi
fi

GSI_EXISTS=$(aws dynamodb describe-table \
    --table-name $TABLE_NAME \
    --endpoint-url $DB_ENDPOINT \
    --query "Table.GlobalSecondaryIndexes[?IndexName=='conversation-timestamp-message'] | [0]" \
    --output json)

if [ "$GSI_EXISTS" != "null" ]; then
  echo "GSI 'conversation-timestamp-message' already exists in the table '$TABLE_NAME'."
else
  echo "GSI 'conversation-timestamp-message' does not exist in the table '$TABLE_NAME'. Creating .."
  # # aws dynamodb update-table --cli-input-json gsi-config.json
  aws dynamodb update-table \
      --table-name $TABLE_NAME \
      --attribute-definitions AttributeName=conversationId,AttributeType=S AttributeName=timeStamp,AttributeType=N \
      --global-secondary-index-updates \
          "[{\"Create\":{\"IndexName\": \"conversation-timestamp-message\",\"KeySchema\":[{\"AttributeName\":\"conversationId\",\"KeyType\":\"HASH\"},{\"AttributeName\":\"timeStamp\",\"KeyType\":\"RANGE\"}], \
          \"ProvisionedThroughput\": {\"ReadCapacityUnits\": 5, \"WriteCapacityUnits\": 5      },\"Projection\":{\"ProjectionType\":\"ALL\"}}}]" \
      --endpoint-url $DB_ENDPOINT \
      --output text > /dev/null

  if [ $? -eq 0 ]; then
    echo "GSI 'conversation-timestamp-message' successfully created."
  fi
fi

##### Below code queries GSI for a particular conversation id
# aws dynamodb query \
#   --table-name "dialogueV2_base" \
#   --index-name "conversation-timestamp-message" \
#   --key-condition-expression "conversationId= :convoId" \
#   --expression-attribute-values  '{":convoId":{"S":"85923d60-beb1-45cb-9593-b98e10751ed0"}}' \
#   --endpoint-url $DB_ENDPOINT
