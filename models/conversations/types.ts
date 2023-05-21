/* eslint-disable @typescript-eslint/indent */
import { type IBaseTable } from '../types'

export const CONVERSATION_PREFIX = 'CONVERSATION#'
export const INFO_PREFIX = 'INFO#'
export const MESSAGE_PREFIX = 'MESSAGE#'
export const MEMBER_PREFIX = 'MEMBER#'

export interface IConversationInfoAttributes {
  conversationId: string
  conversationName: string
  isGroup: boolean
  createdAt: number // is there a datetime type in dynamodb
}

export interface IConversationMessageAttributes {
  conversationId: string
  messageId: string
  senderId: string
  message: string
  timeStamp: string // is there a datetime type in dynamodb
}

export interface IConversationMemberAttributes {
  conversationId: string
  memberId: string
  JoinedAt: string // is there a datetime type in dynamodb
}

export interface IConversationInfoEntity
  extends IBaseTable<typeof CONVERSATION_PREFIX, typeof INFO_PREFIX>,
    IConversationInfoAttributes {}

export interface IConversationMessageEntity
  extends IBaseTable<typeof CONVERSATION_PREFIX, typeof MESSAGE_PREFIX>,
    IConversationMessageAttributes {}

export interface IConversationMemberEntity
  extends IBaseTable<typeof CONVERSATION_PREFIX, typeof MEMBER_PREFIX>,
    IConversationMemberAttributes {}
