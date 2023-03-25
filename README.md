# Introduction

DialogueV2, as the name suggests, is a second version for Dialogue which was first created with an aim to acquire new skills and gain hands-on experience. Second version rebuilds the project from scratch to improve upon the code base and use newly acquired skills such as Typescript, testing, and many more.

\_The project is a chat application with no aim to make it available commercially and is built just for the purpose of getting hands on experience with some of the technologies used and serve as a playground for future learnings as well.

<details>
<summary><b>Whats wrong with Version 1</b></summary>

- In version 1, almost all code was written in vanilla Javascript with little to no emphasis on code's and project's internal structure.
- The Frontend for version 1 was also built using vanilla javascript and was considerably difficult to read, and maintain.
- The backend as well as frontend for version 1 had no test coverage at all.
- All these and many more negatives from version 1 will be worked upon in version 2.

</details>

<details>
  <summary><b>Improvements in Version 2</b></summary>
In version 2, I'm aiming to

- use Typescript along with some refactoring to increase readability and maintainability,
- utilise CI/CD to deploy and check for security vulnerability,
- use dockerised DynamoDB for local development, (This will help primarily for testing and reduce manual cleanup efforts on actual DynamoDB).
- generate C4 diagraming models for better transparency to the system,
- move frontend to more sophisticated frameworks and tools such as React with Typescript, Redux, and other supplementary React ecosystem tools.
- introduce and increase test coverage on the overall system.

</details></br>

# Development Setup:

- Clone Repository
- Setup Database by following instructions provided below.
- Duplicate `.env.dev` file and rename it as `.env`.
- Update database url to point to the local dockerised database url.
- Run
  > npm install; npm run start;

<br/>

# Development Database Setup

<details>
<summary><u>Setup Docker</u></summary>

- Download and Install the Dockerized version of DynamoDBDynamodb local from AWS official resource.
  > https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html
- Download and Install the AWS CLI
  > https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html

</details>

<details>
<summary><u>Set AWS Dummy credentials</u></summary>

- Add following variables to your terminal. The credentials could be anything. They just need to satisfy validation and wont be used for local dynamodb.

  > export AWS_ACCESS_KEY_ID=223344

  > export AWS_SECRET_ACCESS_KEY=wJalrXUtTHISI/DYNAMODB/bPxRfiCYEXAMPLEKEY

</details>

<details>
<summary><u>Create Tables</u></summary>
Two tables are necessary

1. yourchats_users
2. yourchats_sessions

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

</details>

<details>
<summary><u>Check Database Table descriptions</u></summary>

> aws dynamodb describe-table --table-name yourchats_sessions --endpoint-url http://localhost:8000 --region=us-east-1

> aws dynamodb describe-table --table-name yourchats_users --endpoint-url http://localhost:8000 --region=us-east-1

</details>

<br/>

# Start Dev Server in Watch mode

> npm run serve

# Start Prod Server

> npm run build; npm run start

# Start dev server but with prod config

> npm run dev

# Run tests locally

> npm run test

# Run tests locally

> npm run test

# Lint

> npm run lint
