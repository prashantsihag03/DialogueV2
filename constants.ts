export const isDevEnv = process.env.NODE_ENV !== 'production'
export const MINIMUM_PASSWORD_LENGTH = Number(process.env.MINIMUM_PASSWORD_LENGTH)
export const MINIMUM_USERNAME_LENGTH = Number(process.env.MINIMUM_USERNAME_LENGTH)
export const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME as string
export const AWS_REGION = process.env.AWS_REGION as string
export const MAX_IMG_SIZE_BYTES = Number(process.env.MAX_IMG_SIZE_BYTES)
