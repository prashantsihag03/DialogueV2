import type PresenceSystem from '../Socket/PresenceSystem'
import { type SocketIoServer } from '../Socket/socketServer'

export const emitEventToAllUserSessions = async (
  presenceSystem: PresenceSystem,
  socketServer: SocketIoServer,
  usersToEmit: string[],
  eventName: string,
  eventData: any
): Promise<void> => {
  const socketIds = presenceSystem.getAllSocketSessionIdsByUsers(usersToEmit)
  const allSockets = await socketServer.fetchSockets()
  const relevantSockets = allSockets.filter((sock) => socketIds.includes(sock.id))
  relevantSockets.forEach((filteredSocket) => {
    filteredSocket.emit(eventName, eventData)
  })
}
