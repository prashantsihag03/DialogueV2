import bcrypt from 'bcrypt'
import { type NextFunction, type Request, type Response } from 'express'
import { type User } from '../models/types'
import { getUser } from '../models/user/users'
import { getValidatedCredentials } from '../utils/AuthUtils'
import { validateAccessToken } from '../utils/Jwt'
import { extractTokens } from '../utils/SessionUtils'
import { isValidEmail, isValidGender, isValidPassword, isValidUsername } from '../utils/validation'

/**
 * Extracts tokens from the http request, validates them, and adds following token information
 * to response.locals object:
 * - On sucessfull token validation, authenticated=true and jwt=decodedAccessToken.
 * - Regardless of result of token validation, sessionTokens=sessionTokens.
 * NOTE: Will always pass the execution to nextFunction regardless of authentication status.
 */
export const validateTokens = async (_req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const sessionTokens = extractTokens(_req)
    if (sessionTokens != null) {
      _res.locals.sessionTokens = sessionTokens
      const result = await validateAccessToken(_res.locals.sessionTokens.accessToken)

      if (result.decoded != null && !result.expired) {
        _res.locals.authenticated = true
        _res.locals.jwt = result.decoded
        console.log('New Request received! SessionTokens validated successfully!')
      }
    }

    next()
    return
  } catch (e: any) {
    console.error('Error occurred while validating tokens! {}', e)
    _res.status(500)
    _res.send('Something went wrong! Please try again later!')
    _res.end()
  }
}

/**
 * Checks for authenticated=true in _res.locals object and if not present or set to false, rejects request with 401,
 * calls next otherwise.
 */
export const rejectUnAuthenticated = (_req: Request, _res: Response, next: NextFunction): void => {
  if (_res.locals.authenticated == null) {
    _res.sendStatus(401)
    return
  }
  next()
}

/**
 * Checks for authenticated=true in _res.locals object and if not present or set to false, redirects to "/",
 * calls next otherwise.
 */
export const redirectUnAuthenticated = (_req: Request, _res: Response, next: NextFunction): void => {
  if (_res.locals.authenticated == null) {
    _res.redirect('/')
    return
  }
  next()
}

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
export const authenticateLoginCredentials = async (_req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    if (_res.locals.validatedCredentials?.username == null) {
      _res.sendStatus(401)
      return
    };

    const result = await getUser(_res.locals.validatedCredentials.username)

    if (result?.Item?.username != null) {
      const isPasswordCorrect = await bcrypt.compare(_res.locals.validatedCredentials.password, result.Item.password)
      if (isPasswordCorrect) {
        delete result.Item.password
        delete _res.locals.validatedCredentials.password
        _res.locals.authenticated = result.Item
        next()
        return
      }
    }

    _res.sendStatus(401)
    return
  } catch (e) {
    console.error('[Error][Auth][AuthenticateUserCredentials]: {}', e)
    _res.sendStatus(401)
  }
}

export const validateSignUpCredentials = async (_req: Request, _res: Response, next: NextFunction): Promise<void> => {
  if (_req.body == null) {
    _res.status(400)
    _res.send('Malformed Request!')
    return
  }

  if (_req.body.username == null || _req.body.password == null || _req.body.email == null || _req.body.gender == null) {
    _res.status(400)
    _res.send('Required details missing!')
    return
  }

  if (isValidUsername(_req.body.username) &&
    isValidPassword(_req.body.password) &&
    isValidEmail(_req.body.email) &&
    isValidGender(_req.body.gender)
  ) {
    const saltRounds = await bcrypt.genSalt(10)
    const potentialUser: User = {
      username: _req.body.username,
      password: await bcrypt.hash(_req.body.password, saltRounds),
      email: _req.body.email,
      friends: [],
      gender: _req.body.gender
    }
    _res.locals.validatedPotentialUserDetails = potentialUser
    next()
    return
  }
  _res.status(401)
  _res.send('One or more details incorrect or missing!')
}
