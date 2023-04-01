import helmet from 'helmet'
import type http from 'http'
import { Server, type ServerOptions } from 'socket.io'
import { type DefaultEventsMap } from 'socket.io/dist/typed-events'
import { onConnect, onDisconnect } from './socketEvents'

type httpServer = http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>
type SocketIoServer = Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>

const socketServerOptions: Partial<ServerOptions> = {}

/**
 * Sets up and initialises a SocketIO server along with assigning it with all middlewares, and events.
 * @param httpServer
 */
export default function (httpServer: httpServer): SocketIoServer {
  const SocketIO = new Server(httpServer, socketServerOptions)

  // Socket Level Middlewares
  SocketIO.engine.use(helmet())
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
    onConnect()
    socket.on('disconnect', onDisconnect)
  })

  return SocketIO
}
