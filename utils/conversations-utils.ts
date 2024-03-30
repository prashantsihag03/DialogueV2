import CustomError from './CustomError'

/**
 * Vaidates conversation data for new conversations.
 * @param conversationData
 * @returns void when validation success.
 * @throws {@link CustomError} On validation failure with detailed msg based on which
 *  validation rule failed and appropriate http res code.
 */
export const validateNewConversationData = (conversationData: any): void => {
  if (conversationData.isGroup == null) throw new CustomError('Missing required information.', { code: 400 })
  if (conversationData.isGroup === true) {
    throw new CustomError('Group conversations are not yet supported!', { code: 501 })
  }
  if (conversationData.conversationUserId == null) {
    throw new CustomError('Missing required properties!', {
      code: 400
    })
  }
}
