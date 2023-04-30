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

- Install Node v18.14.1
- Clone Repository
- Setup Database by following instructions provided in [Local DB Setup Guide.](dev/db/README.md)
- Duplicate `.env.dev` file and rename it as `.env`.
- Update database url in newly created `.env` to point to the local dockerised database url.
- Install dependencies
  > npm install
- Congratualtions. Local dev setup is complete. Feel free to execute any cmds from `package.json`

<br/>

# Scripts

- Run development server in watch mode

  > npm run watch

- Create production build

  > npm run build

- Start production build
  > npm run start

<br/>

# Tests

> npm run test

<br/>

# Lint

> npm run lint
