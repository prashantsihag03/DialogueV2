import cookieParser from 'cookie-parser'
import express from 'express'
import path from 'path'
import { redirectUnAuthenticated, validateTokens } from './middlewares/auth'
import authRouter from './routes/auth'
import errorRouter from './routes/error'
import { isAuthenticated } from './utils/auth-utils'

export default function (): Express.Application {
  const app: express.Application = express()

  const options = {
    root: path.resolve('./public')
  }

  // App level Middlewares
  app.disable('x-powered-by')
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
    _res.sendFile('index.html', options)
  })

  app.use('/', authRouter)
  app.use(errorRouter)

  return app
}
