/* eslint-disable @typescript-eslint/no-misused-promises */
import { type NextFunction, type Request, type Response, Router } from 'express'
import AuthMdw from '../middlewares/auth.js'
import { getProfile, getSingleProfileKey, updateProfile, updateSingleUserProfileKey } from '../middlewares/profile.js'
import multer from 'multer'
import path from 'path'
import appLogger from '../appLogger.js'
import fs from 'node:fs/promises'

import { fileURLToPath } from 'url'
import { handleAsyncMdw } from '../utils/error-utils.js'
import CustomError from '../utils/CustomError.js'
import { Sendok } from '../middlewares/commons.js'
// eslint-disable-next-line @typescript-eslint/naming-convention
const __filename = fileURLToPath(import.meta.url)
// eslint-disable-next-line @typescript-eslint/naming-convention
const __dirname = path.dirname(__filename)

const profileRouter = Router()

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/')) // Define the destination folder for uploaded files
  },
  filename: function (req, file, cb) {
    cb(null, `${String(file.fieldname)}-${Date.now()}${path.extname(file.originalname)}`)
  }
})
const upload = multer({ storage })

// Router level Middlewares
profileRouter.use(AuthMdw.validateTokens)
profileRouter.use(AuthMdw.rejectUnAuthenticated)

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
  upload.single('profileImg'),
  async (_req: Request, _res: Response, next: NextFunction) => {
    _res.locals.profileToUpdate = _res.locals.jwt.username
    _res.locals.newProfileData = {}
    _res.locals.newProfileData.bio = _req.body.bio ?? undefined
    _res.locals.newProfileData.fullname = _req.body.fullname ?? undefined
    _res.locals.newProfileData.email = _req.body.email ?? undefined
    if (_req.file != null) {
      appLogger.warn('File detected in profile post endpoint')
      const fileContents = await fs.readFile(_req.file.path)
      _res.locals.newProfileData.profileImg = fileContents.toString('base64')
    }
    next()
  },
  updateProfile
)

profileRouter.get(
  '/:profileKey',
  handleAsyncMdw(getSingleProfileKey),
  handleAsyncMdw(async (_req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (_res.locals?.userProfile == null) {
      throw new CustomError('Something went wrong. Please try again later', { code: 500 })
    }
    _res.send({ [_req.params.profileKey]: _res.locals?.userProfile[_req.params.profileKey] ?? true })
  })
)

profileRouter.post(
  ':profileKey',
  upload.single('value'),
  handleAsyncMdw(async (_req: Request, _res: Response, next: NextFunction) => {
    if (_req.file?.path != null) {
      const fileContents = await fs.readFile(_req.file.path)
      _res.locals.newProfileData.profileImg = fileContents.toString('base64')
    }
    next()
  }),
  updateSingleUserProfileKey,
  Sendok
)

export default profileRouter
