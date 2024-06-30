/* eslint-disable @typescript-eslint/indent */
import { type IBaseTable } from '../types.js'

export const CONVERSATION_PREFIX = 'CONVERSATION#'
export const INFO_PREFIX = 'INFO#'
export const MESSAGE_PREFIX = 'MESSAGE#'
export const MEMBER_PREFIX = 'MEMBER#'

export interface IConversationInfoAttributes {
  conversationId: string
  conversationName: string
  isGroup: boolean
  createdBy: string
  createdAt: number // is there a datetime type in dynamodb
}

export type MESSAGE_TYPE = 'message' | 'call'

export interface IConversationMessageAttributes {
  conversationId: string
  messageId: string
  senderId: string
  message: string
  type: MESSAGE_TYPE
  msg_timeStamp: number // is there a datetime type in dynamodb
  attachment?: string // id of attachment stored on s3
  /**
   * Deprecated
   * generate file id, store file in s3 separately, assign file id to 'attachment' field in db
   */
  file?: string
}

export interface IConversationMemberAttributes {
  conversationId: string
  memberId: string
  JoinedAt: number // is there a datetime type in dynamodb
  timeStamp: number
}

export interface IConversationInfoKeys extends IBaseTable<typeof CONVERSATION_PREFIX, typeof INFO_PREFIX> {}
export interface IConversationMessageKeys extends IBaseTable<typeof CONVERSATION_PREFIX, typeof MESSAGE_PREFIX> {}
export interface IConversationMemberKeys extends IBaseTable<typeof CONVERSATION_PREFIX, typeof MEMBER_PREFIX> {}

export interface IConversationInfoEntity extends IConversationInfoKeys, IConversationInfoAttributes {}
export interface IConversationMessageEntity extends IConversationMessageKeys, IConversationMessageAttributes {}
export interface IConversationMemberEntity extends IConversationMemberKeys, IConversationMemberAttributes {}
