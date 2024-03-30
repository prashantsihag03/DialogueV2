import { type Response } from 'express'

export const isLoggedInUser = (userToCheck: string, _res: Response): boolean => {
  return userToCheck === _res.locals.jwt.username
}
