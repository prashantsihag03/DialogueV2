import http from 'http'
import { Server, type ServerOptions } from 'socket.io'
import createApp from './app'

const port: number = process.env.PORT != null && process.env.PORT !== '' ? Number(process.env.PORT) : 3000

// Express App
const app = createApp()

// Server setup
const server = http.createServer(app)

// WebSocket Server Setup
const socketServerOptions: Partial<ServerOptions> = {}

const SocketIO = new Server(server, socketServerOptions)

SocketIO.use((socket, next) => {
  if (socket.request.headers.cookie != null) {
    console.log('Socket conn accepted with cookie', socket.request.headers.cookie)
    next()
  }

  console.log('Socket conn rejected! Disconnecting socket')
  socket.disconnect()
})

// SocketIO Events
SocketIO.on('connection', (socket) => {
  console.log('A new user connected!')

  socket.on('disconnect', () => {
    console.log('A user disconnected')
  })
})

server.listen(port, () => {
  console.log(`DialogueV2 Backend Server: http://localhost:${port}/`)
})
