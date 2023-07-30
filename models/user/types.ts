/* eslint-disable @typescript-eslint/indent */
import { type CONVERSATION_PREFIX } from '../conversations/types'
import { type IBaseTable } from '../types'

export const USER_PREFIX = 'USER#'
export const PROFILE_PREFIX = 'PROFILE#'
export const SESSION_PREFIX = 'SESSION#'

export interface IUserProfileAttibutes {
  username: string
  password: string
  gender: string
  email: string
}

export interface IUserConversationAttributes {
  conversationId: string
  conversationName: string
}

export interface IUserSessionAttributes {
  sessionId: string
  userId: string
  timestamp: string
}

export interface IUserProfileKeys extends IBaseTable<typeof USER_PREFIX, typeof PROFILE_PREFIX> {}
export interface IUserSessionKeys extends IBaseTable<typeof USER_PREFIX, typeof SESSION_PREFIX> {}
export interface IUserConversationKeys extends IBaseTable<typeof USER_PREFIX, typeof CONVERSATION_PREFIX> {}

export interface IUserProfileEntity extends IUserProfileKeys, IUserProfileAttibutes {}
export interface IUserSessionEntity extends IUserSessionKeys, IUserSessionAttributes {}
export interface IUserConversationEntity extends IUserConversationKeys, IUserConversationAttributes {}
