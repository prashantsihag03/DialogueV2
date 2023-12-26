/* eslint-disable @typescript-eslint/space-before-function-paren */
import { v4 as uuidv4 } from 'uuid'
import { type Server } from 'socket.io'
import type PresenceSystem from './PresenceSystem.js'
import { type DefaultEventsMap } from 'socket.io/dist/typed-events'
import appLogger from '../appLogger.js'
import {
  addMessageToConversation,
  getConversationMembers,
  storeMsgObject
} from '../models/conversations/conversations.js'
import { isMsgValid } from '../utils/validation-utils.js'
import { type AnswerCall, type IceCandidate, type InitiateCall, type SocketRef, type SocketServerRef } from './types.js'
import CustomError from '../utils/CustomError.js'
import fs from 'node:fs'
import path from 'node:path'
import { fileTypeFromBuffer } from 'file-type'

import { fileURLToPath } from 'url'
// eslint-disable-next-line @typescript-eslint/naming-convention
const __filename = fileURLToPath(import.meta.url)
// eslint-disable-next-line @typescript-eslint/naming-convention
const __dirname = path.dirname(__filename)

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
      throw new CustomError('Message data format validation failed. Please format message correctly!', {
        internalMsg:
          'Either message data not correctly formatted, or authentication details are missing from socket connection',
        code: 400
      })
    }

    const convoMembers = await getConversationMembers(data.conversationId)
    if (convoMembers.$metadata.httpStatusCode !== 200 || convoMembers.Items == null) {
      throw new CustomError('Retrieval of conversation members for permission check failed', { code: 500 })
    }

    if (!convoMembers.Items.includes((member: { memberId: any }) => member.memberId === socket.data.jwt.username)) {
      // TODO: Uncomment following check once members are being added to convo at the time of convo creation
      // throw new CustomError('Illegal attempt to send message in conversation where user is not a member', { code: 401 })
    }

    const socketSessions = this.presenceSystem.getAllUserSocketSessions(data.receiver)
    const socketIds = Object.keys(socketSessions)

    const allSockets = await this.socketServer.fetchSockets()

    const relevantSockets = allSockets.filter((sock) => socketIds.includes(sock.id))

    const emitMsg: any = {
      conversationId: data.conversationId as string,
      message: data.text,
      messageId: `message-${uuidv4()}`,
      senderId: socket.data.jwt.username as string,
      timeStamp: Date.now()
    }

    // const mimeType = mime.lookup(data.file)
    const fileTypeResponse = await fileTypeFromBuffer(data.file)

    if (fileTypeResponse == null) {
      throw new CustomError('Unrecognised file type. Please try again with supported file type.', { code: 400 })
    }

    appLogger.warn(`User uploaded a file with ext: ${fileTypeResponse.ext}`)
    // Generate a unique filename based on timestamp and detected file extension
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    const fileName = `${emitMsg.conversationId}_${emitMsg.senderId}_${emitMsg.messageId}.${fileTypeResponse.ext}`
    const filePath = path.join(__dirname, `../uploads/${fileName}`)
    emitMsg.file = fileName

    // Save the file locally
    fs.writeFileSync(filePath, data.file)

    // store the file in s3
    const resp = await storeMsgObject(fileName, fs.readFileSync(filePath))

    if (resp.$metadata.httpStatusCode !== 200) {
      throw new CustomError('Unexpected issue encountered while uploading file', { code: 500 })
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
        file: emitMsg.file,
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
