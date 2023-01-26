import jwt, { type AccessTokenJwtPayload } from 'jsonwebtoken'
import { getSession, storeSession } from '../../models/session/sessions'
import { type JwtTokens } from './types'
import { ACCESS_TOKEN_EXPIRATION, JWT_SECRET, REFRESH_TOKEN_EXPIRATION } from './contants'
import { type User } from '../../models/types'

export const generateJwtToken = async (user: User): Promise<JwtTokens> => {
  const accessToken = createAccessToken(user.username)
  const refreshToken = createRefreshToken(user.username)

  await storeSession({ username: user.username, sessionid: refreshToken })

  return {
    accessToken,
    refreshToken
  }
}

export const validateAccessToken = async (accessToken: string): Promise<{ expired: boolean, decoded: string | jwt.JwtPayload | null }> => {
  try {
    const decoded = jwt.verify(accessToken, JWT_SECRET) as AccessTokenJwtPayload
    return { decoded, expired: false }
  } catch (err: any) {
    if (err.name != null && err.name === 'TokenExpiredError') {
      return { expired: true, decoded: null }
    } else {
      throw err
    }
  }
}

export const validateRefreshToken = async (refreshToken: string, username: string): Promise<boolean> => {
  try {
    jwt.verify(refreshToken, JWT_SECRET)
    const session = await getSession(refreshToken)
    if (session.Item?.sessionId != null &&
      session.Item.sessionId === refreshToken &&
      session.Item.username === username) {
      return true
    }
    return false
  } catch (err) {
    return false
  }
}

export const createAccessToken = (username: string): string => {
  return createToken({ username }, { expiresIn: Number(ACCESS_TOKEN_EXPIRATION) })
}

export const createRefreshToken = (username: string): string => {
  return createToken({ username }, { expiresIn: Number(REFRESH_TOKEN_EXPIRATION) })
}

export const createToken = (data: object, options: jwt.SignOptions): string => {
  return jwt.sign(data, JWT_SECRET, options)
}

export const decodeAccessToken = (accessToken: string): AccessTokenJwtPayload => {
  return jwt.decode(accessToken, { json: true }) as AccessTokenJwtPayload
}
