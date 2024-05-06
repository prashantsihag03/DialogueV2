import bcrypt from 'bcrypt'
import { type NextFunction, type Request, type Response } from 'express'
import { SESSION_COOKIE_NAME } from '../constants.js'
import UserModel from '../models/user/users.js'
import AuthUtils from '../utils/auth-utils.js'
import { generateJwtToken } from '../utils/jwt-utils/index.js'
import appLogger from '../appLogger.js'
import { ZodError, z } from 'zod'
import { handleAsyncMdw, handleMdw } from '../utils/error-utils.js'
import CustomError from '../utils/CustomError.js'

const loginCredSchema = z
  .object({
    username: z.string({
      required_error: 'The username is mandatory',
      invalid_type_error: 'The username must be a string'
    }),
    password: z.string({
      required_error: 'The password is mandatory',
      invalid_type_error: 'The username must be a string'
    })
  })
  .required()

/**
 * Rejects request if invalid login credentials are provided. Adds validatedCredentials to the response.locals object.
 * NOTE: It does not authenticate credentials.
 */
export const rejectInValidLoginCredentials = handleMdw((_req: Request, _res: Response, next: NextFunction): void => {
  loginCredSchema.parse(_req.body)

  const validatedCredentials = AuthUtils.getValidatedCredentials(_req.body.username, _req.body.password)
  if (validatedCredentials == null) {
    _res.sendStatus(401)
    return
  }

  _res.locals.validatedCredentials = validatedCredentials
  next()
})

/**
 * Authenticates user provided credentials with database.
 * Expects credentials to be already processed and present in response.locals.validatedCredentials object.
 */
export const authenticateLoginCredentials = handleAsyncMdw(
  async (_req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      loginCredSchema.parse(_res.locals.validatedCredentials)
      const result = await UserModel.getUser(_res.locals.validatedCredentials.username)

      if (result?.Item?.username != null && result?.Item?.password != null) {
        const isPasswordCorrect = await bcrypt.compare(_res.locals.validatedCredentials.password, result.Item.password)
        if (isPasswordCorrect) {
          delete result.Item.password
          delete _res.locals.validatedCredentials.password
          _res.locals.authenticated = result.Item?.username
          next()
          return
        }
      }

      _res.sendStatus(401)
      return
    } catch (e) {
      if (e instanceof ZodError) {
        console.log('zod error')
        throw new CustomError('Something went wrong. Please try again later.', {
          code: 500,
          internalMsg: `Zod parsing failed for validatedCredentials. ${JSON.stringify(e)}`
        })
      }
      appLogger.error(`Error encountered while authenticating user credentials as ${JSON.stringify(e)}`)
      _res.sendStatus(401)
    }
  }
)

/**
 * Main Handler for user login.
 * Generates session tokens and sets session cookie for the user.
 * Assumes login credentials have been authenticated.
 */
export const login = async (_req: Request, _res: Response): Promise<void> => {
  const tokens = await generateJwtToken(_res.locals.authenticated)
  _res.cookie(SESSION_COOKIE_NAME, tokens, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/'
  })
  _res.redirect('/home')
}
