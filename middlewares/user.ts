import { type Request, type Response, type NextFunction } from 'express'
import { getAllUserConversations } from '../models/user/users'
import appLogger from '../appLogger'

export const getUserConversations = async (_req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
    const result = await getAllUserConversations(_res.locals.jwt.username + ''.trim())
    if (result.$metadata.httpStatusCode !== 200 || result.Items === undefined) {
      throw new Error(`Received undesired output while fetching user conversations ${JSON.stringify(result.$metadata)}`)
    }
    _res.locals.userConversations = result.Items
    _res.locals.conversationIds = result.Items?.map((userConvo) => userConvo.conversationId)
    next()
  } catch (err) {
    appLogger.error(`Error encountered while fetching user's conversations as ${JSON.stringify(err)}`)
    _res.status(500).send('Something went wrong. Please try again later!')
  }
}
