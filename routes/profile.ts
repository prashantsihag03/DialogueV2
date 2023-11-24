/* eslint-disable @typescript-eslint/no-misused-promises */
import { type NextFunction, type Request, type Response, Router } from 'express'
import { rejectUnAuthenticated, validateTokens } from '../middlewares/auth'
import { getProfile, updateProfile } from '../middlewares/profile'
// import { getLatestMessageByConversations } from '../middlewares/conversations'

const profileRouter = Router()

// Router level Middlewares
profileRouter.use(validateTokens)
profileRouter.use(rejectUnAuthenticated)

profileRouter.get(
  '/',
  (_req: Request, _res: Response, next: NextFunction) => {
    _res.locals.profileToFetch = _res.locals.jwt.username
    next()
  },
  getProfile
)

profileRouter.get(
  '/:userid',
  (_req: Request, _res: Response, next: NextFunction) => {
    if (_req.params.userid == null || _req.params.userid === '') {
      _res.status(500).send('Invalid request parameters provided. Please provide valida parameters!')
      return
    }
    _res.locals.profileToFetch = _req.params.userid
    next()
  },
  getProfile
)

profileRouter.post(
  '/',
  (_req: Request, _res: Response, next: NextFunction) => {
    _res.locals.profileToUpdate = _res.locals.jwt.username
    _res.locals.newProfileData = {}
    _res.locals.newProfileData.bio = _req.body.bio ?? undefined
    _res.locals.newProfileData.fullname = _req.body.fullname ?? undefined
    _res.locals.newProfileData.email = _req.body.email ?? undefined
    next()
  },
  updateProfile
)

export default profileRouter
