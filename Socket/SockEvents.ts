/* eslint-disable @typescript-eslint/space-before-function-paren */
import { v4 as uuidv4 } from 'uuid'
import { type Socket, type Server } from 'socket.io'
import type PresenceSystem from './PresenceSystem'
import { type DefaultEventsMap } from 'socket.io/dist/typed-events'
import appLogger from '../appLogger'
import { addMessageToConversation, getConversationMembers } from '../models/conversations/conversations'
import { isMsgValid } from '../utils/validation-utils'

type SocketRef = Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>

class SockEvents {
  private readonly presenceSystem: PresenceSystem
  private readonly socketServer: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>

  constructor(
    presenceSystem: PresenceSystem,
    socketServer: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>
  ) {
    this.presenceSystem = presenceSystem
    this.socketServer = socketServer
  }

  onConnect(socket: SocketRef): void {
    if (socket.data.jwt.username == null) {
      appLogger.error('Disconnecting socket conn due to username not available')
      socket.disconnect()
      return
    }
    this.presenceSystem.addUserSocketSession(socket.data.jwt.username, socket.id, {
      refreshTokenId: socket.data.refreshToken
    })
  }

  onDisconnect(socket: SocketRef): void {
    this.presenceSystem.removeUserSocketSession(socket.data.jwt.username, socket.id)
  }

  async onMessage(socket: SocketRef, data: any, ackCallback: any): Promise<void> {
    if (
      socket.data.jwt.username == null ||
      socket.data.refreshToken == null ||
      !isMsgValid(data.conversationId, socket.data.jwt.username, data.text)
    ) {
      appLogger.error('Validation of message data on socket event failed.')
      return
    }

    const convoMembers = await getConversationMembers(data.conversationId)
    if (convoMembers.$metadata.httpStatusCode !== 200 || convoMembers.Items == null) {
      appLogger.error('Couldnt retrieve members for given conversationId for message sending permissions')
      return
    }

    if (!convoMembers.Items.includes((member: { memberId: any }) => member.memberId === socket.data.jwt.username)) {
      // TODO: Uncomment following check once members are being added to convo at the time of convo creation
      // appLogger.error('Illegal attempt to send message in conversation where user is not a member.')
      // return
    }

    const socketSessions = this.presenceSystem.getAllUserSocketSessions(data.receiver)
    const socketIds = Object.keys(socketSessions)

    const allSockets = await this.socketServer.fetchSockets()

    const relevantSockets = allSockets.filter((sock) => socketIds.includes(sock.id))

    const emitMsg = {
      conversationId: data.conversationId,
      message: data.text,
      messageId: `message-${uuidv4()}`,
      senderId: socket.data.jwt.username,
      timeStamp: Date.now()
    }

    const response3 = await addMessageToConversation(emitMsg)

    if (response3.$metadata.httpStatusCode !== 200) {
      ackCallback({
        status: 'failed',
        data
      })
      return
    }

    relevantSockets.forEach((filteredSocket) => {
      filteredSocket.emit('message', emitMsg)
    })

    ackCallback({
      status: 'success',
      data: {
        conversationId: emitMsg.conversationId,
        message: emitMsg.message,
        messageId: emitMsg.messageId,
        senderId: emitMsg.senderId,
        timeStamp: emitMsg.timeStamp,
        status: 'sent',
        localMessageId: data.localMessageId ?? ''
      }
    })
  }
}

export default SockEvents
