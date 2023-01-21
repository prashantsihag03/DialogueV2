import { Response } from "express";
import { isValidPassword, isValidUsername } from "./validation";

export interface ValidatedCredentials {
  username: string,
  password: string,
}

export const isAuthenticated = (_res: Response) => {
  return (_res.locals.authenticated && _res.locals.authenticated===true);
}

export const getAuthenticatedUserData = (_res: Response) => {
  if (!isAuthenticated(_res)) return null;
  return {
    sessionId: _res.locals.sessionId,
    username: _res.locals.username,
  };
}

export const getValidatedCredentials = (username: any, password: any): ValidatedCredentials | null => {
  if (!isValidUsername(username)) return null;
  if (!isValidPassword(password)) return null;
  return {
    username: username+'',
    password: password+'',
  }
}

