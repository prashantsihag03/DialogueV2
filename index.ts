import http from 'http'
import createApp from './app.js'
import { isDevEnv } from './constants.js'
import initializeSocketServer from './Socket/socketServer.js'
import { checkDbConnection } from './models/connection.js'
import appLogger from './appLogger.js'

const port: number = process.env.PORT != null && process.env.PORT !== '' ? Number(process.env.PORT) : 3000

// check DB connections
checkDbConnection()

// Express App
const app = createApp()

// Server setup
const server = http.createServer(app)

// WebSocket Server Setup
initializeSocketServer(server)

server.listen(port, () => {
  if (isDevEnv) {
    appLogger.info(`DialogueV2 Dev Backend Server: http://localhost:${port}/`)
  } else {
    appLogger.info('DialogueV2 Application successfully started!')
  }
})
