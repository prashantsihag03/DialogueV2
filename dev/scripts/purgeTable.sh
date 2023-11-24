#!/bin/bash
# This script will delete all DialogueV2 related dynamodb tables. 

DB_SCRIPTS_PATH=$DIALOGUEV2_HOME/dev/scripts
bash $DB_SCRIPTS_PATH/validateEnv.sh

export TABLE_NAME="dialogueV2_base"
export DB_ENDPOINT="http://localhost:8000"

# AWS Dummy credentials
export AWS_ACCESS_KEY_ID=223344
export AWS_SECRET_ACCESS_KEY=wJalrXUtTHISI/DYNAMODB/bPxRfiCYEXAMPLEKEY
export AWS_REGION=us-east-1

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
