# Introduction

DialogueV2, as the name suggests, is a second version for Dialogue which was first created with an aim to acquire new skills and gain hands-on experience. Second version rebuilds the project from scratch to improve upon the code base and use newly acquired skills such as Typescript, testing, and many more.

\*_The project has no aim to become available commercially and is built just for the purpose of getting hands on experience with some of the technologies used and serve as a playground for future learnings as well._

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

# Development Setup:

- Install Node v18.14.1
- Clone this repository.
- Add path to the root of the cloned repository as DIALOGUEV2_HOME to environment variables such as `~/.zshrc` and source it too.
- Download and Install Docker Desktop.
- Download and Install the [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
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

- Congratualtions. Local dev setup is complete. Feel free to execute any cmds from `package.json`

<br/>

# Executing commands

See scripts in [package.json.](/package.json)

<br/>
