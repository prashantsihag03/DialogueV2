/* eslint-disable @typescript-eslint/no-misused-promises */
import { Router } from 'express'
import AuthMdw from '../middlewares/auth.js'
import { authenticateLoginCredentials, login, rejectInValidLoginCredentials } from '../middlewares/login.js'
import { signup, validateSignUpCredentials, validateUsernameAvailability } from '../middlewares/signup.js'

const authRouter = Router()

// Router level Middlewares
// none so far

authRouter.get('/register', AuthMdw.register)
authRouter.post('/login', rejectInValidLoginCredentials, authenticateLoginCredentials, login)
authRouter.post('/signup', validateSignUpCredentials, signup)
authRouter.get('/username/:userId/available', validateUsernameAvailability)
authRouter.get('/logout', AuthMdw.logout)

export default authRouter
