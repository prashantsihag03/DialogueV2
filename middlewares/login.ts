import bcrypt from 'bcrypt'
import { type NextFunction, type Request, type Response } from 'express'
import { SESSION_COOKIE_NAME } from '../constants'
import { getUser } from '../models/user/users'
import { getValidatedCredentials } from '../utils/auth-utils'
import { generateJwtToken } from '../utils/jwt-utils'
import appLogger from '../appLogger'

/**
 * Rejects request if invalid login credentials are provided. Adds validatedCredentials to the response.locals object.
 * NOTE: It does not authenticate credentials.
 */
export const rejectInValidLoginCredentials = (_req: Request, _res: Response, next: NextFunction): void => {
  if (_req.body == null) {
    _res.sendStatus(400)
    return
  }

  if (_req.body.username == null || _req.body.password == null) {
    _res.sendStatus(400)
    return
  }

  const validatedCredentials = getValidatedCredentials(_req.body.username, _req.body.password)
  if (validatedCredentials == null) {
    _res.sendStatus(401)
    return
  }

  _res.locals.validatedCredentials = validatedCredentials
  next()
}

/**
 * Authenticates user provided credentials with database.
 * Expects credentials to be already processed and present in response.locals.validatedCredentials object.
 */
export const authenticateLoginCredentials = async (
  _req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (_res.locals.validatedCredentials?.username == null) {
      _res.sendStatus(401)
      return
    }

    const result = await getUser(_res.locals.validatedCredentials.username)

    if (result?.Item?.username != null) {
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
    appLogger.error(`Error encountered while authenticating user credentials as ${JSON.stringify(e)}`)
    _res.sendStatus(401)
  }
}

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
