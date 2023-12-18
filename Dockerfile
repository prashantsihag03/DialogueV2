FROM node:18.14.1-alpine

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

COPY build/. ./build/

WORKDIR /app/build

CMD ["node", "./index.js"]