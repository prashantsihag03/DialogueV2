import http from 'http'
import createApp from './app.js'
import { isDevEnv } from './constants.js'
import initializeSocketServer from './Socket/socketServer.js'
import { checkDbConnection } from './models/connection.js'
import appLogger from './appLogger.js'

const port: number = process.env.PORT != null && process.env.PORT !== '' ? Number(process.env.PORT) : 3000

checkDbConnection(
  () => {
    appLogger.info('Database connection check successfull')
  },
  (err) => {
    appLogger.error(`Database connection check failed: ${JSON.stringify(err)}`)
    process.exit(1)
  }
)

const app = createApp()
const server = http.createServer(app)
initializeSocketServer(server)

server.listen(port, () => {
  if (isDevEnv) {
    appLogger.info(`DialogueV2 Dev Backend Server: http://localhost:${port}/`)
  } else {
    appLogger.info('DialogueV2 Application successfully started!')
  }
})
