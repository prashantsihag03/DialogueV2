# DynamoDB Development Database Setup

## 1. Setup Docker

- Download and Install the Dockerized version of DynamoDB local from
  [AWS official resource](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html)
- Download and Install the [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)

</br>

## 2. Set AWS Dummy credentials

Add following variables to your terminal. The credentials could be anything. They just need to satisfy validation and wont be used for local dynamodb.

> export AWS_ACCESS_KEY_ID=223344

> export AWS_SECRET_ACCESS_KEY=wJalrXUtTHISI/DYNAMODB/bPxRfiCYEXAMPLEKEY

</br>

## 3. Create Tables

Two tables are necessary

1. yourchats_users
2. yourchats_sessions

Create table using following cmds from your terminal. Region here is also for sake of validation and could be any region.

<details>
<summary><u>Users Table</u></summary>
```
aws dynamodb create-table \
--table-name dialogueV2_users \
--attribute-definitions AttributeName=username,AttributeType=S \
--key-schema AttributeName=username,KeyType=HASH \
--provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
--endpoint-url http://localhost:8000 --region=us-east-1
```
</details>

<details>
<summary><u>Sessions Table</u></summary>
```
aws dynamodb create-table \
--table-name dialogueV2_sessions \
--attribute-definitions AttributeName=sessionid,AttributeType=S \
--key-schema AttributeName=sessionid,KeyType=HASH \
--provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
--endpoint-url http://localhost:8000 --region=us-east-1
```
</details>

<details>
<summary><u>Conversations Table</u></summary>
```
aws dynamodb create-table \
--table-name dialogueV2_conversations \
--attribute-definitions AttributeName=conversationId,AttributeType=S \
--key-schema AttributeName=conversationId,KeyType=HASH \
--provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
--endpoint-url http://localhost:8000 --region=us-east-1
```
</details>

<details>
<summary><u>ConversationMembers Table</u></summary>
```
aws dynamodb create-table \
--table-name dialogueV2_conversationMembers \
--attribute-definitions AttributeName=conversationId,AttributeType=S AttributeName=username,AttributeType=S \
--key-schema AttributeName=conversationId,KeyType=HASH AttributeName=username,KeyType=RANGE \
--provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
--endpoint-url http://localhost:8000 --region=us-east-1
```
</details>

<details>
<summary><u>Messages Table</u></summary>
```
aws dynamodb create-table \
--table-name dialogueV2_messages \
--attribute-definitions AttributeName=conversationId,AttributeType=S AttributeName=messageId,AttributeType=S \
--key-schema AttributeName=conversationId,KeyType=HASH AttributeName=messageId,KeyType=RANGE \
--provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
--endpoint-url http://localhost:8000 --region=us-east-1
```
</details>

</br>

## 4. Check Database Table descriptions

- Verify Sessions Table Description

  > aws dynamodb describe-table --table-name dialogueV2_sessions --endpoint-url http://localhost:8000 --region=us-east-1

- Verify Sessions Users Description

  > aws dynamodb describe-table --table-name dialogueV_users --endpoint-url http://localhost:8000 --region=us-east-1

- Verify Conversations Table Description

  > aws dynamodb describe-table --table-name dialogueV2_conversations --endpoint-url http://localhost:8000 --region=us-east-1

- Verify ConversationMembers Table Description

  > aws dynamodb describe-table --table-name dialogueV2_conversationMembers --endpoint-url http://localhost:8000 --region=us-east-1

- Verify Messages Table Description
  > aws dynamodb describe-table --table-name dialogueV2_messages --endpoint-url http://localhost:8000 --region=us-east-1
