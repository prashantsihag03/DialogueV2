#!/bin/bash

DB_SCRIPTS_PATH=$DIALOGUEV2_HOME/dev/scripts
bash $DB_SCRIPTS_PATH/validateEnv.sh

table_name="dialogueV2_base"
db_endpoint="http://localhost:8000"

# AWS Dummy credentials
export AWS_ACCESS_KEY_ID=223344
export AWS_SECRET_ACCESS_KEY=wJalrXUtTHISI/DYNAMODB/bPxRfiCYEXAMPLEKEY
export AWS_REGION=us-east-1

# Check if table already exists
aws dynamodb describe-table \
  --table-name $table_name \
  --endpoint-url $db_endpoint \
  > /dev/null 2>&1

if [ $? -eq 0 ]; then
  echo "Table already exists."
  exit 1
fi

echo "Table does not exist. Creating .."
aws dynamodb create-table \
  --table-name $table_name \
  --attribute-definitions AttributeName=pkid,AttributeType=S AttributeName=skid,AttributeType=S \
  --key-schema AttributeName=pkid,KeyType=HASH AttributeName=skid,KeyType=RANGE \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --endpoint-url $db_endpoint \
  --output text > /dev/null

if [ $? -eq 0 ]; then
  echo "Table successfully created."
fi
