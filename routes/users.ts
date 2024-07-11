/* eslint-disable @typescript-eslint/no-misused-promises */
import { type NextFunction, type Request, type Response, Router } from 'express'
import AuthMdw from '../middlewares/auth.js'
import { getUser } from '../models/user/users.js'
import appLogger from '../appLogger.js'
import { handleAsyncMdw } from '../utils/error-utils.js'
import {
  getSingleUserSetting,
  getUserSettings,
  updateSingleUserSetting,
  updateUserSettings
} from '../middlewares/user.js'
import CustomError from '../utils/CustomError.js'
import { Sendok } from '../middlewares/commons.js'
import type PresenceSystem from '../Socket/PresenceSystem.js'

const userRouter = Router()

// Router level Middlewares
userRouter.use(AuthMdw.rejectUnAuthenticated)

userRouter.get('/:userId/lastSeen', (_req: Request, _res: Response, next: NextFunction) => {
  if (_req.params.userId == null || _req.params.userid === '') {
    _res.status(400).send('Invalid parameter value. Please provide valid parameter values!')
    return
  }
  const presenceSystem = _req.app.get('presenceSystem') as PresenceSystem
  _res.send({ ISO: presenceSystem.getUserLastActivity(_req.params.userId) })
})

userRouter.get('/search/:userid', async (_req: Request, _res: Response, next: NextFunction) => {
  if (_req.params.userid == null || _req.params.userid === '') {
    _res.status(400).send('Invalid parameter value. Please provide valid parameter values!')
    return
  }

  const response = await getUser(_req.params.userid)
  if (response.$metadata.httpStatusCode !== 200) {
    appLogger.error(`Error encountered while fetching user details: ${JSON.stringify(response.$metadata)}`)
    _res.status(500).send('Something went wrong. Please try again later!')
    return
  }
  if (response.Item == null) {
    _res.status(200).send([])
    return
  }

  _res.send([
    {
      id: response.Item.username
    }
  ])
})

userRouter.post('/settings', handleAsyncMdw(updateUserSettings), Sendok)
userRouter.get(
  '/settings',
  handleAsyncMdw(getUserSettings),
  handleAsyncMdw(async (_req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (_res.locals?.userSetting == null) {
      throw new CustomError('Something went wrong. Please try again later', { code: 500 })
    }
    _res.send(_res.locals?.userSetting)
  })
)

userRouter.get(
  '/settings/:settingKey',
  handleAsyncMdw(getSingleUserSetting),
  handleAsyncMdw(async (_req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (_res.locals?.userSetting == null) {
      throw new CustomError('Something went wrong. Please try again later', { code: 500 })
    }
    _res.send({ [_req.params.settingKey]: _res.locals?.userSetting[_req.params.settingKey] ?? true })
  })
)

userRouter.post('/settings/:settingKey/:settingValue', updateSingleUserSetting, Sendok)

export default userRouter
