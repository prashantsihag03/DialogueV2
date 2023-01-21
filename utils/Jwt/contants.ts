export const JWT_SECRET: string = process.env.JWT_SECRET as string || "secret";
export const ACCESS_TOKEN_EXPIRATION: string = process.env.ACCESS_TOKEN_EXPIRATION as string || '900';
export const REFRESH_TOKEN_EXPIRATION: string = process.env.REFRESH_TOKEN_EXPIRATION as string || '86400';
