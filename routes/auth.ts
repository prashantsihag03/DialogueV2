import { Router } from 'express'
import path from 'path'
import { SESSION_COOKIE_NAME } from '../constants'
import { authenticateLoginCredentials, rejectInValidLoginCredentials, validateSignUpCredentials, validateTokens } from '../middlewares/auth'
import { deleteSession } from '../models/session/sessions'
import { storeUser } from '../models/user/users'
import { generateJwtToken } from '../utils/jwt-utils'

const authRouter = Router()

const options = {
  root: path.resolve('./public')
}

// Router level Middlewares
// TODO How to best handle following eslint failure. Once have solution, fix in all places.
// eslint-disable-next-line @typescript-eslint/no-misused-promises
authRouter.use(validateTokens)

authRouter.get('/register', (_req, _res, next) => {
  if (_res.locals.authenticated != null) {
    _res.redirect('/home')
    return
  }
  _res.sendFile('register.html', options)
})

// eslint-disable-next-line @typescript-eslint/no-misused-promises
authRouter.post('/login', rejectInValidLoginCredentials, authenticateLoginCredentials, async (_req, _res, next) => {
  const tokens = await generateJwtToken(_res.locals.authenticated)
  _res.cookie(SESSION_COOKIE_NAME, tokens, { httpOnly: true })
  console.log(`${_res.locals.authenticated.username as string} login successful!`)
  _res.redirect('/home')
})

// eslint-disable-next-line @typescript-eslint/no-misused-promises
authRouter.post('/signup', validateSignUpCredentials, async (_req, _res, next) => {
  try {
    const result = await storeUser(_res.locals.validatedPotentialUserDetails)
    if (result != null && result.$response.httpResponse.statusCode === 200) {
      _res.redirect('/')
      return
    }
    console.error('User signup failed! Query response {}', result.$response)
    _res.sendStatus(500)
    return
  } catch (e) {
    console.error('User signup failed! Error: {}', e)
    _res.sendStatus(500)
  }
})

// eslint-disable-next-line @typescript-eslint/no-misused-promises
authRouter.get('/logout', async (_req, _res, next) => {
  try {
    if (_res.locals?.sessionTokens?.refreshToken != null) {
      await deleteSession(_res.locals.sessionTokens.refreshToken)
    }
    _res.clearCookie(SESSION_COOKIE_NAME)
    _res.redirect('/')
  } catch (e) {
    console.error('[Error][Logout]: {}', e)
  }
})

export default authRouter
