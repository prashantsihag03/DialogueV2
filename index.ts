import http from 'http'
import createApp from './app'
import socketServer from './Socket/socketServer'

const port: number = process.env.PORT != null && process.env.PORT !== '' ? Number(process.env.PORT) : 3000

// Express App
const app = createApp()

// Server setup
const server = http.createServer(app)

// WebSocket Server Setup
socketServer(server)

server.listen(port, () => {
  console.log(`DialogueV2 Backend Server: http://localhost:${port}/`)
})
