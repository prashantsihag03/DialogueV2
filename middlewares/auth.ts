import path from 'path'
import { SESSION_COOKIE_NAME } from '../constants'
import { type NextFunction, type Request, type Response } from 'express'
import { deleteSession } from '../models/session/sessions'
import { validateAccessToken } from '../utils/jwt-utils'
import { extractTokens } from '../utils/session-utils'

const options = {
  root: path.resolve('./public')
}

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
 * Main handler for logout. Deletes user session details from DB and from cookies.
 */
export const logout = async (_req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    if (_res.locals?.sessionTokens?.refreshToken != null) {
      await deleteSession(_res.locals.sessionTokens.refreshToken)
    }
    _res.clearCookie(SESSION_COOKIE_NAME)
    _res.redirect('/')
  } catch (e) {
    console.error('[Error][Logout]: {}', e)
    _res.status(500)
    _res.send('Something went wrong. Please try again!')
  }
}

/**
 * Main handler for register.
 */
export const register = (_req: Request, _res: Response, next: NextFunction): void => {
  if (_res.locals.authenticated != null) {
    _res.redirect('/home')
    return
  }
  _res.sendFile('register.html', options)
}
