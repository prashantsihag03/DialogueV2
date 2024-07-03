#!/bin/bash

DB_SCRIPTS_PATH=$DIALOGUEV2_HOME/dev/scripts

echo "Validating environment variables .."
bash $DB_SCRIPTS_PATH/validateEnv.sh
echo "Validating environment variables .. Successfull!"

# AWS Dummy credentials
export AWS_ACCESS_KEY_ID=randomDummyValues
export AWS_SECRET_ACCESS_KEY=randomDummyValues
export AWS_REGION=ap-southeast-2

export TABLE_NAME="dialogueV2_base"
export DB_ENDPOINT="http://localhost:8000"
# export DB_ENDPOINT="https://dynamodb.${AWS_REGION}.amazonaws.com"

echo ""
echo "Interacting with dynamodb at ${DB_ENDPOINT}"
sleep 5

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
    sleep 10
    echo "Table successfully created."
  else
    echo "Error encountered while creating table!"
    exit 1 
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
      --attribute-definitions AttributeName=conversationId,AttributeType=S AttributeName=msg_timeStamp,AttributeType=N \
      --global-secondary-index-updates \
          "[{\"Create\":{\"IndexName\": \"conversation-timestamp-message\",\"KeySchema\":[{\"AttributeName\":\"conversationId\",\"KeyType\":\"HASH\"},{\"AttributeName\":\"msg_timeStamp\",\"KeyType\":\"RANGE\"}], \
          \"ProvisionedThroughput\": {\"ReadCapacityUnits\": 5, \"WriteCapacityUnits\": 5      },\"Projection\":{\"ProjectionType\":\"ALL\"}}}]" \
      --endpoint-url $DB_ENDPOINT \
      --output text > /dev/null

  if [ $? -eq 0 ]; then
    echo "GSI 'conversation-timestamp-message' successfully created."
  fi
fi

#### Below code queries GSI for a particular conversation id
# aws dynamodb query \
#   --table-name "dialogueV2_base" \
#   --index-name "conversation-timestamp-message" \
#   --key-condition-expression "conversationId= :convoId" \
#   --expression-attribute-values  '{":convoId":{"S":"bd0e6fdb-c99c-454d-8d52-a65fc953a8d2"}}' \
#   --endpoint-url $DB_ENDPOINT
