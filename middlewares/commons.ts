/* eslint-disable @typescript-eslint/indent */
import { type NextFunction, type Request, type Response } from 'express'
import type PresenceSystem from '../Socket/PresenceSystem.js'
// import authUtils from '../utils/auth-utils.js'

export const Sendok = (_req: Request, _res: Response, next: NextFunction): void => {
  _res.send({ status: 'success' })
}

export const recordLastSeen =
  (presenceSystem: PresenceSystem) =>
  (_req: Request, _res: Response, next: NextFunction): void => {
    if (_res.locals.authenticated === true) {
      presenceSystem.updateSocketSessionLastActivityByRefreshToken(
        _res.locals.jwt.username,
        _res.locals.sessionTokens.refreshToken
      )
    }
    next()
  }
