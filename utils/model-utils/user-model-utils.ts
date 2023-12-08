import { type IUserSettingAttibutes } from '../../models/user/types'

const UserSettingModelKeyRef: IUserSettingAttibutes = {
  enterSendsMessage: false,
  greetMeEverytime: false,
  openExistingConversation: false
}

export const isValidUserSettingKey = (key: string): boolean => {
  if (Object.keys(UserSettingModelKeyRef).includes(key)) return true
  return false
}
