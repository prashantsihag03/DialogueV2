/* eslint-disable @typescript-eslint/indent */
import { type CONVERSATION_PREFIX } from '../conversations/types'
import { type IBaseTable } from '../types'

export const USER_PREFIX = 'USER#'
export const PROFILE_PREFIX = 'PROFILE#'

export interface IUserProfileAttibutes {
  username: string
  password: string
  gender: string
  email: string
}
export interface IUserProfileKeys extends IBaseTable<typeof USER_PREFIX, typeof PROFILE_PREFIX> {}
export interface IUserProfileEntity extends IUserProfileKeys, IUserProfileAttibutes {}

export interface IUserConversationAttributes {
  conversationId: string
  conversationName: string
}
export interface IUserConversationKeys extends IBaseTable<typeof USER_PREFIX, typeof CONVERSATION_PREFIX> {}
export interface IUserConversationEntity extends IUserConversationKeys, IUserConversationAttributes {}
