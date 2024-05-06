import { type Response } from 'express'
import { isValidPassword, isValidUsername } from './validation-utils.js'

export interface ValidatedCredentials {
  username: string
  password: string
}

const getUsername = (_res: Response): string | undefined => {
  if (_res.locals?.jwt?.username != null) {
    return _res.locals.jwt.username
  }
  return undefined
}

const isAuthenticated = (_res: Response): boolean => {
  return _res.locals.authenticated != null && _res.locals.authenticated === true
}

// eslint-disable-next-line @typescript-eslint/member-delimiter-style
const getAuthenticatedUserData = (_res: Response): { sessionId: string; username: string } | null => {
  if (!isAuthenticated(_res)) return null
  return {
    sessionId: _res.locals.sessionId as string,
    username: _res.locals.username as string
  }
}

const getValidatedCredentials = (username: any, password: any): ValidatedCredentials | null => {
  if (!isValidUsername(username)) return null
  if (!isValidPassword(password)) return null
  return {
    username: username as string,
    password: password as string
  }
}

export default {
  getValidatedCredentials,
  getAuthenticatedUserData,
  isAuthenticated,
  getUsername
}
