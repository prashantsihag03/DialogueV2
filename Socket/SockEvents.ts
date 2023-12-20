/* eslint-disable @typescript-eslint/space-before-function-paren */
import { v4 as uuidv4 } from 'uuid'
import { type Socket, type Server } from 'socket.io'
import type PresenceSystem from './PresenceSystem'
import { type DefaultEventsMap } from 'socket.io/dist/typed-events'
import appLogger from '../appLogger'
import { addMessageToConversation, getConversationMembers } from '../models/conversations/conversations'
import { isMsgValid } from '../utils/validation-utils'

type SocketRef = Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>
type SocketServerRef = Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>

interface InitiateCall {
  userToCall: string
  offer: any
}

interface IceCandidate {
  from: string
  candidate: any
}

interface AnswerCall {
  userToAnswer: string
  answer: any
}

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

  /**
   * When user is attempting to call someone
   */
  async onOffer(socket: SocketRef, data: InitiateCall, ackCallback: any, SocketIO: SocketServerRef): Promise<void> {
    if (
      socket.data.jwt.username == null ||
      socket.data.refreshToken == null ||
      data.offer == null ||
      data.userToCall == null
    ) {
      appLogger.error('Call failed due to invalid data.')
      ackCallback({
        status: 'Failed to initiate call.',
        message: 'Invalid call information provided.'
      })
      return
    }

    const userToCall = data.userToCall

    const receiverUserSocketSessions = this.presenceSystem.getAllUserSocketSessions(userToCall)
    if (Object.keys(receiverUserSocketSessions).length < 1) {
      ackCallback({
        status: 'Failed to initiate call.',
        message: 'User to call is not online.'
      })
    }

    const userToCallSocketId = Object.keys(receiverUserSocketSessions)[0]
    const allSockets = await SocketIO.fetchSockets()
    const userToCallSocket = allSockets.find((socket) => socket.id === userToCallSocketId)
    userToCallSocket?.emit('incoming call', { callerUserId: socket.data.jwt.username, offer: data.offer }, () => {
      ackCallback({
        status: 'Success.',
        message: `Incoming call sent to ${userToCall}`
      })
    })
  }

  /**
   * When user is attempting to call someone
   */
  async onIceCandidate(
    socket: SocketRef,
    data: IceCandidate,
    ackCallback: any,
    SocketIO: SocketServerRef
  ): Promise<void> {
    console.log('Ice candidate even received')
    if (
      socket.data.jwt.username == null ||
      socket.data.refreshToken == null ||
      data.from == null ||
      data.candidate == null
    ) {
      appLogger.error('Call failed due to invalid data.')
      ackCallback({
        status: 'Failed to validate ice candidate event.',
        message: 'Invalid data provided.'
      })
      return
    }

    const receiverUserSocketSessions = this.presenceSystem.getAllUserSocketSessions(data.from)
    if (Object.keys(receiverUserSocketSessions).length < 1) {
      ackCallback({
        status: 'Failed to send ice candidate.',
        message: 'User to send ice candidate, is not online.'
      })
    }

    const userToCallSocketId = Object.keys(receiverUserSocketSessions)[0]
    const allSockets = await SocketIO.fetchSockets()

    const userToCallSocket = allSockets.find((socket) => socket.id === userToCallSocketId)
    userToCallSocket?.emit('iceCandidate', { from: socket.data.jwt.username, candidate: data.candidate }, () => {
      ackCallback({
        status: 'Success.',
        message: `Ice candidate sent to ${data.from}`
      })
    })
  }

  /**
   * When user has accepted call
   */
  async onAnswer(socket: SocketRef, data: AnswerCall, ackCallback: any, SocketIO: SocketServerRef): Promise<void> {
    if (
      socket.data.jwt.username == null ||
      socket.data.refreshToken == null ||
      data.answer == null ||
      data.userToAnswer == null
    ) {
      appLogger.error('Call failed due to invalid data.')
      ackCallback({
        status: 'Failed to initiate call.',
        message: 'Invalid call information provided.'
      })
      return
    }

    const userToAnswer = data.userToAnswer

    // find userToAnswer socket
    const receiverUserSocketSessions = this.presenceSystem.getAllUserSocketSessions(userToAnswer)
    if (Object.keys(receiverUserSocketSessions).length < 1) {
      ackCallback({
        status: 'Failed to initiate call.',
        message: 'User to call is not online.'
      })
    }

    const userToAnswerSocketId = Object.keys(receiverUserSocketSessions)[0]
    const allSockets = await SocketIO.fetchSockets()
    const userToAnswerSocket = allSockets.find((socket) => socket.id === userToAnswerSocketId)
    userToAnswerSocket?.emit('answering call', { from: socket.data.jwt.username, answer: data.answer }, (ack: any) => {
      ackCallback({
        status: 'Success.',
        message: `Answering call sent to ${userToAnswer}`
      })
    })
  }
}

export default SockEvents
