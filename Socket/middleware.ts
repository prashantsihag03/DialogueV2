import { type Socket } from 'socket.io'
import { type ExtendedError } from 'socket.io/dist/namespace'
import { type DefaultEventsMap } from 'socket.io/dist/typed-events'
import appLogger from '../appLogger.js'
import { validateAccessToken } from '../utils/jwt-utils/index.js'
import { extractSessionDataFromHeaders } from '../utils/session-utils.js'

const socketAuthMDW = (
  socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
  next: (err?: ExtendedError) => void
): void => {
  if (socket.request.headers.cookie == null) {
    appLogger.error('Socket conn invalidated due to missing cookies!')
    next(new Error('Invalid!'))
    return
  }

  const sessionTokens = extractSessionDataFromHeaders(socket.request)
  if (sessionTokens == null) {
    appLogger.error('Socket conn invalidated due to invalid tokens!')
    next(new Error('Invalid!'))
    return
  }

  validateAccessToken(sessionTokens.accessToken)
    .then((result) => {
      if (result.decoded != null && !result.expired) {
        socket.data.jwt = result.decoded
        socket.data.refreshToken = sessionTokens.refreshToken
        next()
        return
      }
      appLogger.info('Auth failed for socket conn')
      next(new Error('Unauthorised!'))
    })
    .catch((err) => {
      appLogger.error(`Error encountered while validating access token from socket middleware ${JSON.stringify(err)}`)
      next(new Error('Something went wrong. Please try again later!'))
    })
}

export default socketAuthMDW
