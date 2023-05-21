export interface Session {
  sessionid: string // PK
  username: string
}

// deprecated
export interface User {
  username: string // PK
  password: string
  gender: string
  email: string
}

// deprecated
export interface IConversations {
  conversationId: string
  conversationName: string
  isGroup: boolean
  createdAt: number
}

// deprecated
export interface IConversationMember {
  conversationId: string // PK
  memberId: string // SK username
  joinedAt: number
}

// deprecated
export interface IMessage {
  conversationId: string // PK
  messageId: string // SK timestamp_uuid
  senderId: string
  message: string
  timeStamp: number
}

export interface IBaseTable<PPrefix extends string, SPrefix extends string> {
  PKID: `${PPrefix}${string}` // Partition Key
  SKID: `${SPrefix}${string}` // Sort Key
}
