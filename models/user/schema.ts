import { z } from 'zod'

export const userSettingSchema = z
  .object({
    enterSendsMessage: z.boolean(),
    greetMeEverytime: z.boolean(),
    openExistingConversation: z.boolean(),
    compactConversationView: z.boolean()
  })
  .required()

export const userProfileSchema = z
  .object({
    username: z.string(),
    fullname: z.string(),
    password: z.string(),
    gender: z.string(),
    email: z.string(),
    bio: z.string(),
    profileImg: z.string()
  })
  .required()
