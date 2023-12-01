import { type Request, type Response, type NextFunction } from 'express'
import {
  getAllUserConversations,
  getUserSettingDb,
  getUserSettingsDb,
  updateAllUserSettingDb,
  updateSingleUserSettingDb
} from '../models/user/users'
import appLogger from '../appLogger'
import CustomError from '../utils/CustomError'
import { type IUserSettingAttibutes } from '../models/user/types'
import { isValidUserSettingKey } from '../utils/model-utils/user-model-utils'

export const getUserConversations = async (_req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
    const result = await getAllUserConversations(_res.locals.jwt.username + ''.trim())
    if (result.$metadata.httpStatusCode !== 200 || result.Items === undefined) {
      throw new Error(`Received undesired output while fetching user conversations ${JSON.stringify(result.$metadata)}`)
    }
    _res.locals.userConversations = result.Items
    _res.locals.conversationIds = result.Items?.map((userConvo) => userConvo.conversationId)
    next()
  } catch (err) {
    appLogger.error(`Error encountered while fetching user's conversations as ${JSON.stringify(err)}`)
    _res.status(500).send('Something went wrong. Please try again later!')
  }
}

export const getUserSettings = async (_req: Request, _res: Response, next: NextFunction): Promise<void> => {
  const settingResp = await getUserSettingsDb(_res.locals.jwt.username)
  if (settingResp.$metadata.httpStatusCode !== 200) {
    throw new CustomError("Couldn't retrieve user setting.", { code: 500 })
  }
  const userSetting: IUserSettingAttibutes = {
    enterSendsMessage: Boolean(settingResp.Item?.enterSendsMessage),
    greetMeEverytime: Boolean(settingResp.Item?.greetMeEverytime)
  }
  _res.locals.userSetting = userSetting
  next()
}

/**
 * Validates settingKey in request parameters and adds data for particular settingKey in resp.locals.setting object
 */
export const getSingleUserSetting = async (_req: Request, _res: Response, next: NextFunction): Promise<void> => {
  if (!isValidUserSettingKey(_req.params.settingKey)) {
    throw new CustomError('Invalid parameters', { code: 400 })
  }
  const settingResp = await getUserSettingDb(
    _res.locals.jwt.username,
    _req.params.settingKey as keyof IUserSettingAttibutes
  )
  if (settingResp.$metadata.httpStatusCode !== 200) {
    throw new CustomError("Couldn't retrieve user setting.", { code: 500 })
  }
  console.log('Retrieved user settings Item from db is: ', settingResp.Item)
  _res.locals.userSetting = {}
  _res.locals.userSetting[_req.params.settingKey] =
    settingResp.Item != null ? settingResp.Item[_req.params.settingKey] : null
  next()
}

export const updateUserSettings = async (_req: Request, _res: Response, next: NextFunction): Promise<void> => {
  const settingResp = await updateAllUserSettingDb(_res.locals.jwt.username, {
    enterSendsMessage: _req.body?.enterSendsMessage,
    greetMeEverytime: _req.body?.greetMeEverytime
  })
  if (settingResp.$metadata.httpStatusCode !== 200) {
    throw new CustomError("Couldn't retrieve user setting.", { code: 500 })
  }
  next()
}

export const updateSingleUserSetting = async (_req: Request, _res: Response, next: NextFunction): Promise<void> => {
  if (!isValidUserSettingKey(_req.params.settingKey) || _req.params.settingValue == null) {
    throw new CustomError('Invalid parameters provided!', { code: 400 })
  }

  const settingResp = await updateSingleUserSettingDb(
    _res.locals.jwt.username,
    _req.params.settingKey,
    _req.params.settingValue
  )

  if (settingResp.$metadata.httpStatusCode !== 200) {
    throw new CustomError("Couldn't update user setting.", { code: 500 })
  }
  next()
}
