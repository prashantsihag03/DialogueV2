import jwt, { AccessTokenJwtPayload } from "jsonwebtoken";
import { getSession, storeSession } from "../../models/session/sessions";
import { JwtTokens } from "./types";
import { ACCESS_TOKEN_EXPIRATION, JWT_SECRET, REFRESH_TOKEN_EXPIRATION } from "./contants";
import { User } from "../../models/types";

export const generateJwtToken = async (user: User): Promise<JwtTokens> => {
  const accessToken = createAccessToken(user.username);
  const refreshToken = createRefreshToken(user.username);

  await storeSession({username: user.username, sessionid: refreshToken});
  
  return {
    accessToken: accessToken,
    refreshToken: refreshToken,
  }
}

export const validateAccessToken = async (accessToken: string): Promise<{ expired: boolean; decoded: string | jwt.JwtPayload | null; }> => {
  try {
    const decoded = <AccessTokenJwtPayload>jwt.verify(accessToken, JWT_SECRET as string);
    return { decoded: decoded, expired: false };
  } catch (err: any) {
    if (err.name && err.name === "TokenExpiredError") {
      return { expired: true, decoded: null};
    } else {
      throw err;
    }
  }
}

export const validateRefreshToken = async (refreshToken: string, username: string): Promise<boolean> => {
  try {
    jwt.verify(refreshToken, JWT_SECRET as string);
    const session = await getSession(refreshToken);
    if (session.Item && session.Item.refreshToken && 
      session.Item.sessionId === refreshToken && session.Item.username === username) {
      return true;
    }
    return false;
  } catch (err) {
    return false;
  }
}

export const createAccessToken = (username: string) => {
  return createToken({username: username}, {expiresIn: Number(ACCESS_TOKEN_EXPIRATION)});
}

export const createRefreshToken = (username: string) => {
  return createToken({username: username}, {expiresIn: Number(REFRESH_TOKEN_EXPIRATION)});
}

export const createToken = (data: object, options: jwt.SignOptions) => {
  return jwt.sign(data, JWT_SECRET, options);
}

export const decodeAccessToken = (accessToken: string) => {
  return <AccessTokenJwtPayload>jwt.decode(accessToken, {json: true});
}
