/* eslint-disable @typescript-eslint/no-misused-promises */
import { Router } from 'express'
import { logout, register, validateTokens } from '../middlewares/auth'
import { authenticateLoginCredentials, login, rejectInValidLoginCredentials } from '../middlewares/login'
import { signup, validateSignUpCredentials } from '../middlewares/signup'

const authRouter = Router()

// Router level Middlewares
authRouter.use(validateTokens)

authRouter.get('/register', register)
authRouter.post('/login', rejectInValidLoginCredentials, authenticateLoginCredentials, login)
authRouter.post('/signup', validateSignUpCredentials, signup)
authRouter.get('/logout', logout)

export default authRouter
