import { MINIMUM_PASSWORD_LENGTH, MINIMUM_USERNAME_LENGTH } from '../constants'

export const isValidPassword = (value: string | null): boolean => {
  if (value == null) return false
  if (value.length < MINIMUM_PASSWORD_LENGTH) return false
  return true
}

export const isValidUsername = (value: string | null): boolean => {
  if (value == null) return false
  if (value.length < MINIMUM_USERNAME_LENGTH) return false
  return true
}

export const isValidGender = (value: string | null): boolean => {
  if (value == null) return false
  const lowerCaseValue = value.toLocaleLowerCase()
  if (lowerCaseValue !== 'male' && lowerCaseValue !== 'female' && lowerCaseValue !== 'other') return false
  return true
}

export const isValidEmail = (value: string | null): boolean => {
  if (value == null) return false
  if (!value.includes('@') || !value.includes('.com') || value.includes('@.com')) return false
  return true
}

export const isMsgValid = (
  conversationId: string | undefined,
  senderUserId: string | undefined,
  msg: string | undefined
): boolean => {
  if ((conversationId == null || senderUserId) == null || msg == null) {
    return false
  }

  // check if this conversation even exists

  // check if this user even exists

  return true
}
