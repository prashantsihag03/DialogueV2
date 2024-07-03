import bcrypt from 'bcrypt'
import { type NextFunction, type Request, type Response } from 'express'
import ValidationUtils from '../utils/validation-utils.js'
import { createUser, updateAllUserSettingDb } from '../models/user/users.js'
import { type IUserProfileAttibutes } from '../models/user/types.js'
import appLogger from '../appLogger.js'
import { handleAsyncMdw } from '../utils/error-utils.js'
import CustomError from '../utils/CustomError.js'
import path from 'path'
import fs from 'node:fs/promises'
import { fileURLToPath } from 'url'

// eslint-disable-next-line @typescript-eslint/naming-convention
const __filename = fileURLToPath(import.meta.url)
// eslint-disable-next-line @typescript-eslint/naming-convention
const __dirname = path.dirname(__filename)

export const validateSignUpCredentials = handleAsyncMdw(
  async (_req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (
      !ValidationUtils.isValidUsername(_req.body?.username) ||
      !ValidationUtils.isValidPassword(_req.body?.password) ||
      !ValidationUtils.isValidEmail(_req.body?.email)
    ) {
      throw new CustomError('Missing required data!', { code: 400 })
    }

    const fileContents = await fs.readFile(path.join(__dirname, '../public/images/no-profile-picture.jpg'))

    const saltRounds = await bcrypt.genSalt(10)
    const potentialUser: IUserProfileAttibutes = {
      username: _req.body.username,
      fullname: _req.body.username,
      password: await bcrypt.hash(_req.body.password, saltRounds),
      email: _req.body.email,
      bio: '',
      profileImg: fileContents.toString('base64')
    }
    _res.locals.validatedPotentialUserDetails = potentialUser
    next()
  }
)

/**
 * Main handler for Signup. Stores user details to DB.
 * Assumes details are available in request body and have been validated.
 */
export const signup = handleAsyncMdw(async (_req: Request, _res: Response, next: NextFunction): Promise<void> => {
  const userProfileResult = await createUser(_res.locals.validatedPotentialUserDetails)
  if (userProfileResult.$metadata.httpStatusCode !== 200) {
    throw new CustomError('New user couldnt be created', { code: 500 })
  }

  const userSettingResult = await updateAllUserSettingDb(_res.locals.validatedPotentialUserDetails.username, {
    enterSendsMessage: true,
    greetMeEverytime: true,
    openExistingConversation: true,
    compactConversationView: false
  })

  if (userSettingResult.$metadata.httpStatusCode !== 200) {
    throw new CustomError('New user couldnt be created', { code: 500 })
  }

  appLogger.info('New user signed up successfully.')
  _res.redirect('/')
})
