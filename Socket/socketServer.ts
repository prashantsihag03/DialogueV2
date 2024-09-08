import helmet from 'helmet'
import type http from 'http'
import { Server, type ServerOptions } from 'socket.io'
import { type DefaultEventsMap } from 'socket.io/dist/typed-events'
import { socketAuthMDW, socketSessionRecordLastActivity } from './middleware.js'
import SockEvents from './SockEvents.js'
import { handleSocketEvent } from '../utils/error-utils.js'
import type PresenceSystem from './PresenceSystem.js'
import SocketServerEventEmitter from './SocketEmitter.js'

type httpServer = http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>
export type SocketIoServer = Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>

const socketServerOptions: Partial<ServerOptions> = {
  maxHttpBufferSize: 1e7
}

enum SocketServerReceivingEvents {
  CONNECTION = 'connection',
  DISCONNECT = 'disconnect',
  MESSAGE = 'message',
  CALL = 'call',
  REJECT_CALL = 'reject call',
  SIGNAL = 'signal',
  ANSWER = 'answer',
  CANCEL_CALL = 'cancel call',
  MUTED_AUDIO = 'mutedAudio',
  MUTED_VIDEO = 'mutedVideo'
}

/**
 * Sets up and initialises a SocketIO server along with assigning it with all middlewares, and events.
 * @param httpServer
 */
export default function (
  httpServer: httpServer,
  presenceSystem: PresenceSystem
): [SocketIoServer, SocketServerEventEmitter] {
  const SocketIO = new Server(httpServer, socketServerOptions)
  const socketServerEventEmitter = new SocketServerEventEmitter(presenceSystem, SocketIO)
  const sockEvents = new SockEvents(presenceSystem, SocketIO)

  // Socket Level Middlewares
  SocketIO.engine.use(helmet())
  SocketIO.use(socketAuthMDW)
  SocketIO.use(socketSessionRecordLastActivity(presenceSystem))

  // SocketIO Events
  SocketIO.on(SocketServerReceivingEvents.CONNECTION, (socket) => {
    sockEvents.onConnect(socket)

    socket.on(SocketServerReceivingEvents.DISCONNECT, () => {
      sockEvents.onDisconnect(socket)
    })

    socket.on(
      SocketServerReceivingEvents.MESSAGE,
      handleSocketEvent(async (data, callback) => {
        await sockEvents.onMessage(socket, data, callback, false)
      })
    )

    socket.on(SocketServerReceivingEvents.CALL, async (data, callback) => {
      await sockEvents.onCalling(socket, data, callback, SocketIO)
    })

    socket.on(SocketServerReceivingEvents.REJECT_CALL, async (data, callback) => {
      await sockEvents.onCallReject(socket, data, callback, SocketIO)
    })

    socket.on(SocketServerReceivingEvents.SIGNAL, async (data, callback) => {
      await sockEvents.onOffer(socket, data, callback, SocketIO)
    })

    socket.on(SocketServerReceivingEvents.ANSWER, async (data, callback) => {
      await sockEvents.onAnswer(socket, data, callback, SocketIO)
    })

    socket.on(SocketServerReceivingEvents.CANCEL_CALL, async (data, callback) => {
      await sockEvents.onCallCancel(socket, data, callback, SocketIO)
    })

    socket.on(SocketServerReceivingEvents.MUTED_AUDIO, async (data, callback) => {
      await sockEvents.onMutedAudio(socket, data, callback, SocketIO)
    })

    socket.on(SocketServerReceivingEvents.MUTED_VIDEO, async (data, callback) => {
      await sockEvents.onMutedVideo(socket, data, callback, SocketIO)
    })
  })

  return [SocketIO, socketServerEventEmitter]
}
