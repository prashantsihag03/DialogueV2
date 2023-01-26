export const JWT_SECRET: string = (process.env.JWT_SECRET != null && process.env.JWT_SECRET !== '') ? process.env.JWT_SECRET : 'secret'
export const ACCESS_TOKEN_EXPIRATION: string = (process.env.ACCESS_TOKEN_EXPIRATION != null && process.env.ACCESS_TOKEN_EXPIRATION !== '0') ? process.env.ACCESS_TOKEN_EXPIRATION : '900'
export const REFRESH_TOKEN_EXPIRATION: string = (process.env.REFRESH_TOKEN_EXPIRATION != null && process.env.REFRESH_TOKEN_EXPIRATION !== '0') ? process.env.REFRESH_TOKEN_EXPIRATION : '86400'
