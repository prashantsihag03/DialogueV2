/* eslint-disable @typescript-eslint/no-misused-promises */
import cookieParser from 'cookie-parser'
import express from 'express'
import helmet from 'helmet'
import path from 'path'
import AuthMdw from './middlewares/auth.js'
import authRouter from './routes/auth.js'
import errorRouter from './routes/error.js'
import AuthUtils from './utils/auth-utils.js'
import profileRouter from './routes/profile.js'
import morgan from 'morgan'
import { fileURLToPath } from 'url'
import conversationsRouter from './routes/conversations/index.js'
import type PresenceSystem from './Socket/PresenceSystem.js'
import { recordLastSeen } from './middlewares/commons.js'
import UserRouter from './routes/users.js'
// eslint-disable-next-line @typescript-eslint/naming-convention
const __filename = fileURLToPath(import.meta.url)
// eslint-disable-next-line @typescript-eslint/naming-convention
const __dirname = path.dirname(__filename)

export default function (presenceSystem: PresenceSystem): Express.Application {
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
  app.use(AuthMdw.validateTokens)
  app.use(recordLastSeen(presenceSystem))

  // Routes
  app.get('/', (_req, _res) => {
    if (!AuthUtils.isAuthenticated(_res)) {
      _res.redirect('/register')
      return
    }
    _res.redirect('/home')
  })

  app.get('/home', AuthMdw.redirectUnAuthenticated, (_req, _res, next) => {
    _res.sendFile('home.html', options)
  })

  app.use('/', authRouter)
  app.use('/conversations', conversationsRouter)
  app.use('/profile', profileRouter)
  app.use('/user', UserRouter(presenceSystem))
  app.use(errorRouter)

  return app
}
