# Steps to setup and execute the project locally:

- Clone Repository
- Setup Database by following instructions provided below.
- Duplicate `.env.dev` file and rename it as `.env`.
- Update database url to point to the local dockerised database url.
- Run
  > npm install; npm run start;

# Database Setup

Two tables are necessary

1. yourchats_users
2. yourchats_sessions

## Set AWS Dummy credentials

- Download and Install the Dockerized version of DynamoDBDynamodb local from AWS official resource.
  > https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html
- Download and Install the AWS CLI
  > https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html

* Add following variables to your terminal. The credentials could be anything. They just need to satisfy validation and wont be used for local dynamodb.

  > export AWS_ACCESS_KEY_ID=223344

  > export AWS_SECRET_ACCESS_KEY=wJalrXUtTHISI/DYNAMODB/bPxRfiCYEXAMPLEKEY

### Create Table if not exists already

- Create table using following cmds from your terminal. Region here is also for sake of validation and could be any region.

#### Users Table

> aws dynamodb create-table \
> --table-name yourchats_users \
> --attribute-definitions AttributeName=username,AttributeType=S \
> --key-schema AttributeName=username,KeyType=HASH \
> --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
> --endpoint-url http://localhost:8000 --region=us-east-1

#### Sessions Table

> aws dynamodb create-table \
> --table-name yourchats_sessions \
> --attribute-definitions AttributeName=sessionid,AttributeType=S \
> --key-schema AttributeName=sessionid,KeyType=HASH \
> --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
> --endpoint-url http://localhost:8000 --region=us-east-1

### Check Database Table descriptions

> aws dynamodb describe-table --table-name yourchats_sessions --endpoint-url http://localhost:8000 --region=us-east-1

> aws dynamodb describe-table --table-name yourchats_users --endpoint-url http://localhost:8000 --region=us-east-1

# Run tests locally

> npm run test
