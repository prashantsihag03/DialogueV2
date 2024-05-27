import { z } from 'zod'

export const userSettingSchema = z
  .object({
    enterSendsMessage: z.boolean(),
    greetMeEverytime: z.boolean(),
    openExistingConversation: z.boolean(),
    compactConversationView: z.boolean()
  })
  .required()

export const userProfileSchema = z.object({})
