# Introduction

DialogueV2, as the name suggests, is a second version for Dialogue which was first created with an aim to acquire new skills and gain hands-on experience. Second version rebuilds the project from scratch to improve upon the code base and use newly acquired skills such as Typescript, testing, and many more.

\*_The project has no aim to become available commercially and is built just for the purpose of getting hands on experience with some of the technologies used and serve as a playground for future learnings as well._

This repository holds backend part of Dialogue's Version 2. To see its frontend, see [this.](https://github.com/prashantsihag03/dialogueV2-fe)

<details>
<summary><b>Whats wrong with Version 1</b></summary>

- Poorly defined and messy structure with vanilla Javascript.
- Difficult to read, and maintain.
- No test coverage.

</details>

<details>
  <summary><b>Improvements in Version 2</b></summary>

- Utilizing Typescript to improve readability and maintainability.
- Improving tests coverage.
- Introducing and utilizing CI/CD to deploy and check for security vulnerability.
- Introducing dockerised DynamoDB for local development, (This will help primarily for testing and reduce manual cleanup efforts on actual DynamoDB).
- Introducing C4 diagraming models for better transparency to the system.
- Migrating from Vanilla JS to frameworks and tools such as React with Typescript, Redux, and other supplementary React ecosystem tools.

</details></br>

# Architecture Diagrams

<details>
  <summary><b>C4: Context Diagram</b></summary>

![Base Table](https://www.prashantsihag.com/images/dialogue/context_diagram.jpg 'Dialogue V2 C4 Context Diagram')

</details></br>
<details>
  <summary><b>C4: Container Diagram</b></summary>

![Base Table](https://www.prashantsihag.com/images/dialogue/container_diagram.jpg 'Dialogue V2 C4 Container Diagram')

</details></br>

# Database Design

DialogueV2 uses AWS's DynamoDB.

Current database model uses Single-Table Design to keep cost limited and keep the usage of database within the free tier offered by AWS Dynamodb.

More details on Database modelling for this project can be found [here](/dev/docs/DataModel.md)

# Direct Development Setup:

- Install Node v18.14.1
- Clone this repository.
- Add path to the root of the cloned repository as DIALOGUEV2_HOME to environment variables such as `~/.zshrc` and source it too.
- Download and Install Docker Desktop.
- Download and Install the AWS CLI.
- Create and start dynamod-local container

  > cd $DIALOGUEV2_HOME/dev/db; </br>
  > docker-compose up

- Setup Base Table

  > sh $DIALOGUEV2_HOME/dev/scripts/setupTable.sh

- Verify Base Table

  > aws dynamodb describe-table --table-name dialogueV2_base --endpoint-url http://localhost:8000 --region=us-east-1

- Duplicate `.env.dev` file and rename it as `.env`.

- Install dependencies

  > npm install

- Congratualtions. Local dev setup is complete.

<br/>

# Executing commands

See scripts in [package.json.](/package.json)

<br/>
