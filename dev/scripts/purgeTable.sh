#!/bin/bash

DB_SCRIPTS_PATH=$DIALOGUEV2_HOME/dev/scripts
bash $DB_SCRIPTS_PATH/validateEnv.sh

table_name="dialogueV2_base"
db_endpoint="http://localhost:8000"

# AWS Dummy credentials
export AWS_ACCESS_KEY_ID=223344
export AWS_SECRET_ACCESS_KEY=wJalrXUtTHISI/DYNAMODB/bPxRfiCYEXAMPLEKEY
export AWS_REGION=us-east-1

# Delete the DynamoDB table
aws dynamodb delete-table \
  --table-name "$table_name" \
  --endpoint-url $db_endpoint \
  --output text > /dev/null 2>&1

if [ $? -eq 0 ]; then
  echo "Table successfully deleted."
else 
  echo "Table does not exist."
fi
