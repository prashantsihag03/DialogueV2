import { MINIMUM_PASSWORD_LENGTH, MINIMUM_USERNAME_LENGTH } from '../constants.js'

const isValidPassword = (value: string | null): boolean => {
  if (value == null) return false
  if (value.length < MINIMUM_PASSWORD_LENGTH) return false
  return true
}

const isValidUsername = (value: string | null): boolean => {
  if (value == null) return false
  if (value.length < MINIMUM_USERNAME_LENGTH) return false
  return true
}

const isValidGender = (value: string | null): boolean => {
  if (value == null) return false
  const lowerCaseValue = value.toLocaleLowerCase()
  if (lowerCaseValue !== 'male' && lowerCaseValue !== 'female' && lowerCaseValue !== 'other') return false
  return true
}

const isValidEmail = (value: string | null): boolean => {
  if (value == null) return false
  if (!value.includes('@') || !value.includes('.com') || value.includes('@.com')) return false
  return true
}

const isMsgValid = (
  conversationId: string | undefined,
  senderUserId: string | undefined,
  msg: string | undefined,
  file?: string
): boolean => {
  // if (file != null && file.size > MAX_IMG_SIZE_BYTES) {
  //   appLogger.warn('Message invalidated due to file size exceeding maximum file size limit')
  //   return false
  // }
  if ((conversationId == null || senderUserId) == null || msg == null) {
    return false
  }

  // check if this conversation even exists

  // check if this user even exists

  return true
}

export default {
  isMsgValid,
  isValidEmail,
  isValidGender,
  isValidPassword,
  isValidUsername
}
