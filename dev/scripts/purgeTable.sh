#!/bin/bash
# This script will delete all DialogueV2 related dynamodb tables. 

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

# Delete the DynamoDB table
aws dynamodb delete-table \
  --table-name "$TABLE_NAME" \
  --endpoint-url $DB_ENDPOINT \
  --output text > /dev/null 2>&1

if [ $? -eq 0 ]; then
  echo "Table successfully deleted."
else 
  echo "Table does not exist."
fi
