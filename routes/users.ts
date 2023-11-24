/* eslint-disable @typescript-eslint/no-misused-promises */
import { type NextFunction, type Request, type Response, Router } from 'express'
import { rejectUnAuthenticated, validateTokens } from '../middlewares/auth'
import { getUser } from '../models/user/users'
import appLogger from '../appLogger'
// import { getLatestMessageByConversations } from '../middlewares/conversations'

const userRouter = Router()

// Router level Middlewares
userRouter.use(validateTokens)
userRouter.use(rejectUnAuthenticated)

userRouter.get('/search/:userid', async (_req: Request, _res: Response, next: NextFunction) => {
  if (_req.params.userid == null || _req.params.userid === '') {
    _res.status(400).send('Invalid parameter value. Please provide valid parameter values!')
    return
  }

  const response = await getUser(_req.params.userid)
  if (response.$metadata.httpStatusCode !== 200) {
    appLogger.error(`Error encountered while fetching user details: ${JSON.stringify(response.$metadata)}`)
    _res.status(500).send('Something went wrong. Please try again later!')
    return
  }
  if (response.Item == null) {
    _res.status(200).send([])
    return
  }

  _res.send([
    {
      id: response.Item.username
    }
  ])
})

export default userRouter
