import { type Response } from 'express'
import { isValidPassword, isValidUsername } from './validation'

export interface ValidatedCredentials {
  username: string
  password: string
}

export const isAuthenticated = (_res: Response): boolean => {
  return (_res.locals.authenticated != null && _res.locals.authenticated === true)
}

export const getAuthenticatedUserData = (_res: Response): { sessionId: string, username: string } | null => {
  if (!isAuthenticated(_res)) return null
  return {
    sessionId: _res.locals.sessionId as string,
    username: _res.locals.username as string
  }
}

export const getValidatedCredentials = (username: any, password: any): ValidatedCredentials | null => {
  if (!isValidUsername(username)) return null
  if (!isValidPassword(password)) return null
  return {
    username: username as string,
    password: password as string
  }
}
