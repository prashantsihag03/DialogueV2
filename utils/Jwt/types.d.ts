import jwt from "jsonwebtoken";

export interface JwtTokens {
  accessToken: string,
  refreshToken: string,
}

declare module "jsonwebtoken" {
  export interface AccessTokenJwtPayload extends jwt.JwtPayload {
    username: string;
  }
}
  