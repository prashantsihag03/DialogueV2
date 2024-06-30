/* eslint-disable @typescript-eslint/member-delimiter-style */
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
import ValidationUtils from '../utils/validation-utils.js'
import { type AnswerCall, type IceCandidate, type InitiateCall, type SocketRef, type SocketServerRef } from './types.js'
import CustomError from '../utils/CustomError.js'
import fs from 'node:fs'
import path from 'node:path'
import { fileTypeFromBuffer } from 'file-type'

import { fileURLToPath } from 'url'
import { type IConversationMessageAttributes } from '../models/conversations/types.js'
// eslint-disable-next-line @typescript-eslint/naming-convention
const __filename = fileURLToPath(import.meta.url)
// eslint-disable-next-line @typescript-eslint/naming-convention
const __dirname = path.dirname(__filename)

export default class SockEvents {
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
      refreshTokenId: socket.data.refreshToken,
      lastActivity: new Date().toISOString()
    })
  }

  onDisconnect(socket: SocketRef): void {
    this.presenceSystem.removeUserSocketSession(socket.data.jwt.username, socket.id)
  }

  async emit(eventName: 'message', eventData: any, socketIdsToEmit: string[]): Promise<void> {
    const socketIds = this.presenceSystem.getAllSocketSessionIdsByUsers(socketIdsToEmit)
    const allSockets = await this.socketServer.fetchSockets()
    const relevantSockets = allSockets.filter((sock) => socketIds.includes(sock.id))
    relevantSockets.forEach((filteredSocket) => {
      filteredSocket.emit(eventName, eventData)
    })
  }

  async onMessage(
    socket: SocketRef,
    data: { conversationId: string; text: string; file: any; localMessageId: string },
    ackCallback: any,
    sendMsgToSender: boolean
  ): Promise<void> {
    if (
      socket.data.jwt.username == null ||
      socket.data.refreshToken == null ||
      !ValidationUtils.isMsgValid(data.conversationId, socket.data.jwt.username, data.text)
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

    const convoMemberIds = convoMembers.Items.map((member) => member.memberId)
    if (!convoMemberIds.includes(socket.data.jwt.username)) {
      throw new CustomError('Illegal attempt to send message in conversation where user is not a member', { code: 401 })
    }

    const processedConvoMemberIds: string[] = []
    convoMemberIds.forEach((memberId) => {
      if (memberId === socket.data.jwt.username) {
        if (sendMsgToSender) {
          processedConvoMemberIds.push(memberId)
        }
      } else {
        processedConvoMemberIds.push(memberId)
      }
    })

    const emitMsg: IConversationMessageAttributes = {
      conversationId: data.conversationId,
      message: data.text,
      messageId: `message-${uuidv4()}`,
      senderId: socket.data.jwt.username as string,
      msg_timeStamp: Date.now(),
      type: 'message'
    }

    if (data.file != null) {
      const fileTypeResponse = await fileTypeFromBuffer(data.file)

      if (fileTypeResponse == null) {
        throw new CustomError('Unrecognised file type. Please try again with supported file type.', { code: 400 })
      }

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
    }

    const response3 = await addMessageToConversation(emitMsg)

    if (response3.$metadata.httpStatusCode !== 200) {
      ackCallback({
        status: 'failed',
        data
      })
      return
    }

    await this.emit('message', emitMsg, processedConvoMemberIds)

    ackCallback({
      status: 'success',
      data: {
        conversationId: emitMsg.conversationId,
        message: emitMsg.message,
        messageId: emitMsg.messageId,
        senderId: emitMsg.senderId,
        timeStamp: emitMsg.msg_timeStamp,
        status: 'sent',
        file: emitMsg.file,
        localMessageId: data.localMessageId ?? ''
      }
    })
  }

  /**
   * When user is attempting to call another user. This takes place before any signalling.
   * This event is responsible for ensuring that user that is being called accepts the call first,
   * which will then initiate the signalling process.
   */
  async onCalling(
    socket: SocketRef,
    data: { userToCall: string; conversationId: string },
    ackCallback: any,
    SocketIO: SocketServerRef
  ): Promise<void> {
    if (
      socket.data.jwt?.username == null ||
      socket.data.refreshToken == null ||
      data.userToCall == null ||
      data.conversationId == null
    ) {
      appLogger.error('Call failed due to invalid data.')
      ackCallback({
        status: 'failed',
        message: 'invalid call information provided'
      })
      return
    }

    // check if user is part of the conversation or not
    const convoMembers = await getConversationMembers(data.conversationId)
    if (convoMembers.$metadata.httpStatusCode !== 200 || convoMembers.Items == null) {
      throw new CustomError('Retrieval of conversation members for permission check failed', { code: 500 })
    }

    const convoMemberIds = convoMembers.Items.map((member) => member.memberId)
    if (!convoMemberIds.includes(socket.data.jwt.username)) {
      throw new CustomError('Illegal attempt to send message in conversation where user is not a member', { code: 401 })
    }

    const msgUuid = uuidv4()
    const emitMsg: IConversationMessageAttributes = {
      conversationId: data.conversationId,
      message: 'Video Call',
      messageId: `message-${msgUuid}`,
      senderId: socket.data.jwt.username as string,
      msg_timeStamp: Date.now(),
      type: 'call'
    }

    const response3 = await addMessageToConversation(emitMsg)
    // Todo add a CALL#id representative of this message to database as well

    if (response3.$metadata.httpStatusCode !== 200) {
      ackCallback({
        status: 'failed',
        message: 'Internal error.'
      })
      return
    }

    await this.emit('message', emitMsg, convoMemberIds)

    // check if user is online.
    const receiverUserSocketSessions = this.presenceSystem.getAllSocketSessionsByUser(data.userToCall)

    // if not, call ack with appropriate msg
    if (Object.keys(receiverUserSocketSessions).length < 1) {
      ackCallback({
        status: 'failed',
        message: 'user is not online'
      })
    }

    // if online, send an event to user with
    const userToCallSocketId = Object.keys(receiverUserSocketSessions)[0]
    const allSockets = await SocketIO.fetchSockets()
    const userToCallSocket = allSockets.find((socket) => socket.id === userToCallSocketId)
    if (userToCallSocket == null) {
      ackCallback({
        status: 'failed',
        message: 'user is not online'
      })
      return
    }

    userToCallSocket.emit('receiving call', { callerUserId: socket.data.jwt.username }, () => {
      ackCallback({
        status: 'success',
        message: `call sent to ${data.userToCall}`
      })
    })
  }

  async onCallReject(
    socket: SocketRef,
    data: { userToAnswer: string },
    ackCallback: any,
    SocketIO: SocketServerRef
  ): Promise<void> {
    if (socket.data.jwt.username == null || socket.data.refreshToken == null || data.userToAnswer == null) {
      appLogger.error('Call failed due to invalid data.')
      ackCallback({
        status: 'Failed to initiate call.',
        message: 'Invalid call information provided.'
      })
      return
    }
    const userToAnswer = data.userToAnswer

    // find userToAnswer socket
    const receiverUserSocketSessions = this.presenceSystem.getAllSocketSessionsByUser(userToAnswer)
    if (Object.keys(receiverUserSocketSessions).length < 1) {
      ackCallback({
        status: 'Failed!',
        message: 'User to answer is not online.'
      })
    }

    const userToAnswerSocketId = Object.keys(receiverUserSocketSessions)[0]
    const allSockets = await SocketIO.fetchSockets()
    const userToAnswerSocket = allSockets.find((socket) => socket.id === userToAnswerSocketId)
    userToAnswerSocket?.emit('call rejected', { from: socket.data.jwt.username }, (ack: any) => {
      ackCallback({
        status: 'Success.',
        message: `Rejecting call sent to ${userToAnswer}`
      })
    })
  }

  async onCallCancel(
    socket: SocketRef,
    data: { userToCancelCallWith: string },
    ackCallback: any,
    SocketIO: SocketServerRef
  ): Promise<void> {
    if (socket.data.jwt.username == null || socket.data.refreshToken == null || data.userToCancelCallWith == null) {
      appLogger.error('Call Cancel failed due to invalid data.')
      ackCallback({
        status: 'Failed to cancel call.',
        message: 'Invalid call information provided.'
      })
      return
    }
    const userToCancelCallWith = data.userToCancelCallWith

    const receiverUserSocketSessions = this.presenceSystem.getAllSocketSessionsByUser(userToCancelCallWith)
    if (Object.keys(receiverUserSocketSessions).length < 1) {
      ackCallback({
        status: 'Failed!',
        message: 'User to cancel call with is not online.'
      })
    }

    const userToCancelCallWithSocketId = Object.keys(receiverUserSocketSessions)[0]
    const allSockets = await SocketIO.fetchSockets()
    const userToCancelCallWithSocket = allSockets.find((socket) => socket.id === userToCancelCallWithSocketId)
    userToCancelCallWithSocket?.emit('call cancelled', { from: socket.data.jwt.username }, (ack: any) => {
      ackCallback({
        status: 'Success.',
        message: `Cancelling call sent to ${userToCancelCallWith}`
      })
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

    const receiverUserSocketSessions = this.presenceSystem.getAllSocketSessionsByUser(userToCall)
    if (Object.keys(receiverUserSocketSessions).length < 1) {
      ackCallback({
        status: 'Failed to initiate call.',
        message: 'User to call is not online.'
      })
    }

    const userToCallSocketId = Object.keys(receiverUserSocketSessions)[0]
    const allSockets = await SocketIO.fetchSockets()
    const userToCallSocket = allSockets.find((socket) => socket.id === userToCallSocketId)
    userToCallSocket?.emit('offer signal', { callerUserId: socket.data.jwt.username, offer: data.offer }, () => {
      ackCallback({
        status: 'Success.',
        message: `offer signal sent to ${userToCall}`
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

    const receiverUserSocketSessions = this.presenceSystem.getAllSocketSessionsByUser(data.from)
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
    const receiverUserSocketSessions = this.presenceSystem.getAllSocketSessionsByUser(userToAnswer)
    if (Object.keys(receiverUserSocketSessions).length < 1) {
      ackCallback({
        status: 'Failed to initiate call.',
        message: 'User to call is not online.'
      })
    }

    const userToAnswerSocketId = Object.keys(receiverUserSocketSessions)[0]
    const allSockets = await SocketIO.fetchSockets()
    const userToAnswerSocket = allSockets.find((socket) => socket.id === userToAnswerSocketId)
    userToAnswerSocket?.emit('answer signal', { from: socket.data.jwt.username, answer: data.answer }, (ack: any) => {
      ackCallback({
        status: 'Success.',
        message: `Answer signal sent to ${userToAnswer}`
      })
    })
  }
}
