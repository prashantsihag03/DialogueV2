import cookieParser from 'cookie-parser'
import express from 'express'
import helmet from 'helmet'
import path from 'path'
import { redirectUnAuthenticated, validateTokens } from './middlewares/auth'
import authRouter from './routes/auth'
import conversationsRouter from './routes/conversations'
import errorRouter from './routes/error'
import { isAuthenticated } from './utils/auth-utils'
import profileRouter from './routes/profile'
import userRouter from './routes/users'
import morgan from 'morgan'

export default function (): Express.Application {
  const app: express.Application = express()

  const options = {
    root: path.resolve('./public')
  }

  // App level Middlewares
  app.use(morgan('combined')) // for HTTP request logging
  app.disable('x-powered-by')
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          'script-src': ["'self'", 'https://cdnjs.cloudflare.com']
        }
      }
    })
  )
  app.use(cookieParser())
  app.use(express.json())
  app.use(express.static(path.join(__dirname, 'public')))
  app.use(express.urlencoded({ extended: false }))

  // Authentication Middleware ------------------------
  // none so far

  // Routes
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  app.get('/', validateTokens, (_req, _res) => {
    if (!isAuthenticated(_res)) {
      _res.redirect('/register')
      return
    }
    _res.redirect('/home')
  })

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  app.get('/home', validateTokens, redirectUnAuthenticated, (_req, _res, next) => {
    _res.sendFile('home.html', options)
  })

  app.use('/', authRouter)
  app.use('/conversations', conversationsRouter)
  app.use('/profile', profileRouter)
  app.use('/user', userRouter)
  app.use(errorRouter)

  return app
}
