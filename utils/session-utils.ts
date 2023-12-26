import { type Request } from 'express'
import { SESSION_COOKIE_NAME } from '../constants.js'
import { type JwtTokens } from './jwt-utils/types'
import { type IncomingMessage } from 'http'
import appLogger from '../appLogger.js'
import { parse } from 'cookie'

export const extractTokens = (_req: Request): JwtTokens | null => {
  if (
    _req.cookies?.[`${SESSION_COOKIE_NAME}`]?.accessToken != null &&
    _req.cookies[`${SESSION_COOKIE_NAME}`].refreshToken != null
  ) {
    return {
      accessToken: _req.cookies[`${SESSION_COOKIE_NAME}`].accessToken,
      refreshToken: _req.cookies[`${SESSION_COOKIE_NAME}`].refreshToken
    }
  }

  return null
}

export const extractSessionDataFromHeaders = (_req: IncomingMessage): JwtTokens | null => {
  let accessToken: string | null = null
  let refreshToken: string | null = null

  if (_req.headers.cookie != null && _req.headers.cookie.length > 0) {
    const cookies = _req.headers.cookie.split(';')
    cookies.forEach((cookie) => {
      const parsedCookie = parse(cookie)

      // TODO: data may not exists on parsedCookie
      const encodedData = parsedCookie[SESSION_COOKIE_NAME]
      const encodedJson = encodedData.slice(2) // remove the 'j:' prefix
      const decodedData = JSON.parse(encodedJson)

      if (decodedData.accessToken != null) {
        accessToken = decodedData.accessToken
      }
      if (decodedData.refreshToken != null) {
        refreshToken = decodedData.refreshToken
      }
    })
  } else {
    appLogger.info('_req.headers.cookie failed validation for socket header')
  }

  return accessToken != null && refreshToken != null ? { accessToken, refreshToken } : null
}
