import { Request } from "express";
import { SESSION_COOKIE_NAME } from "../constants";
import { JwtTokens } from "./Jwt/types";

export const extractTokens = (_req: Request): JwtTokens | null => {
  if (_req.cookies && _req.cookies[`${SESSION_COOKIE_NAME}`] 
  && _req.cookies[`${SESSION_COOKIE_NAME}`].accessToken && _req.cookies[`${SESSION_COOKIE_NAME}`].refreshToken) {
    return {
      accessToken: _req.cookies[`${SESSION_COOKIE_NAME}`].accessToken,
      refreshToken: _req.cookies[`${SESSION_COOKIE_NAME}`].refreshToken
    }
  }

  return extractSessionDataFromHeaders(_req);
}

const extractSessionDataFromHeaders = (_req: Request): JwtTokens | null => {
  let accessToken: string | null = null;
  let refreshToken: string | null = null;

  if (_req.headers.cookie && _req.headers.cookie.length > 0) {
    const cookies = _req.headers.cookie.split(";");
    cookies.forEach((cookie) => {
      let thisCookie = cookie.split("=");
      thisCookie[0].trim();
      thisCookie[1].trim();
      if (thisCookie[0].toLowerCase() == "accessToken") {
        accessToken = thisCookie[1];
      } else if (thisCookie[0].toLowerCase() == "refreshToken") {
        refreshToken = thisCookie[1];
      }
    });
  }

  return (accessToken && refreshToken) ? {accessToken, refreshToken} : null;
}