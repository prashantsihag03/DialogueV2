export interface Session {
  sessionid: string // PK
  username: string
}

export interface User {
  username: string // PK
  password: string
  gender: string
  email: string
}

export interface IConversations {
  conversationId: string // PK
  isGroup: boolean
  createdAt: number
}

export interface IConversationMember {
  conversationId: string // PK
  memberId: string // SK username
  joinedAt: number
}

export interface IMessage {
  conversationId: string // PK
  messageId: string // SK timestamp_uuid
  senderId: string
  message: string
  timeStamp: number
}
