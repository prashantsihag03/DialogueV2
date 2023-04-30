import http from 'http'
import createApp from './app'
import { isDevEnv } from './constants'
import initializeSocketServer from './Socket/socketServer'

const port: number = process.env.PORT != null && process.env.PORT !== '' ? Number(process.env.PORT) : 3000

// Express App
const app = createApp()

// Server setup
const server = http.createServer(app)

// WebSocket Server Setup
initializeSocketServer(server)

server.listen(port, () => {
  if (isDevEnv) {
    console.log(`DialogueV2 Dev Backend Server: http://localhost:${port}/`)
  } else {
    console.log('DialogueV2 Application successfully started!')
  }
})
