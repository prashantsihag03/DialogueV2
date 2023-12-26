import { type Request, type Response, type NextFunction } from 'express'
import { getUser, updateUser } from '../models/user/users.js'
import CustomError from '../utils/CustomError.js'
import appLogger from '../appLogger.js'

export const getProfile = async (_req: Request, _res: Response, next: NextFunction): Promise<void> => {
  const response = await getUser(_res.locals.profileToFetch)
  if (response.$metadata.httpStatusCode !== 200 || response.Item == null) {
    _res.status(500).send('Something went wrong! Please try again later!')
    return
  }
  delete response.Item.password
  _res.send({
    id: response.Item.username,
    fullname: response.Item.fullname,
    email: _res.locals.jwt.username === response.Item.username ? response.Item.email : null,
    profileImgSrc: '',
    lastOnlineUTCDateTime: '',
    bio: response.Item.bio ?? '',
    profileImg: response.Item.profileImg ?? null
  })
}

export const updateProfile = async (_req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const response = await getUser(_res.locals.profileToUpdate)
    if (response.$metadata.httpStatusCode !== 200 || response.Item == null) {
      throw new CustomError('User couldnt be found.', { code: 404 })
    }

    const updateUserResponse = await updateUser({
      email: _res.locals.newProfileData.email ?? response.Item.email,
      fullname: _res.locals.newProfileData.fullname ?? response.Item.fullname,
      gender: response.Item.gender,
      password: response.Item.password,
      username: response.Item.username,
      bio: _res.locals.newProfileData.bio ?? response.Item.bio,
      profileImg: _res.locals.newProfileData.profileImg ?? response.Item.profileImg
    })

    if (updateUserResponse.$metadata.httpStatusCode !== 200) {
      throw new CustomError('User profile couldnt be updated.', { code: 500 })
    }

    _res.sendStatus(200)
  } catch (err: any) {
    if (err instanceof CustomError) {
      appLogger.error(`${err.message}: ${JSON.stringify(err.stack)}`)
      _res.status(err.details.code).send(err.message)
      return
    }
    appLogger.error(`${JSON.stringify(err.stack)}`)
    _res.status(500).send('Something went wrong. Please try again later')
  }
}
