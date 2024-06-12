/* eslint-disable @typescript-eslint/indent */
import { type NextFunction, type Request, type Response } from 'express'
import type PresenceSystem from '../Socket/PresenceSystem.js'
import authUtils from '../utils/auth-utils.js'

export const Sendok = (_req: Request, _res: Response, next: NextFunction): void => {
  _res.send({ status: 'success' })
}

export const recordLastSeen =
  (presenceSystem: PresenceSystem) =>
  (_req: Request, _res: Response, next: NextFunction): void => {
    const userData = authUtils.getAuthenticatedUserData(_res)
    if (userData != null) {
      console.log('User last seen recorded for ', userData)
    }
    next()
  }
