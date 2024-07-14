interface ConversationQuickView {
  conversationId: string
  conversationName: string
  lastMessage: string
  unseen: number
  lastMessageTime: number | undefined
  lastMessageSenderId: string
  isGroup: boolean
}

export default ConversationQuickView
