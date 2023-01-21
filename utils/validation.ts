import { MINIMUM_PASSWORD_LENGTH, MINIMUM_USERNAME_LENGTH } from "../constants";

export const isValidPassword = (value: string | null) => {
  if (!value) return false;
  if (value.length < MINIMUM_PASSWORD_LENGTH) return false;
  return true;
}

export const isValidUsername = (value: string | null) => {
  if (!value) return false;
  if (value.length < MINIMUM_USERNAME_LENGTH) return false;
  return true;
}

export const isValidGender = (value: string | null) => {
  if (!value) return false;
  const lowerCaseValue = value.toLocaleLowerCase();
  if (lowerCaseValue !== 'male' && lowerCaseValue !== 'female' && lowerCaseValue !== 'other') return false;
  return true;
}

export const isValidEmail = (value: string | null) => {
  if (!value) return false;
  if (!value.includes("@") || !value.includes(".com") || value.includes("@.com") ) return false;
  return true;
}

export const isValidMobile = (value: string | null) => {
  if (!value) return false;
  try {
    const isNumber = Number(value);
  } catch (e) {
    console.error("Non numeric mobile number provided! Validation failed!");
    return false;
  }
  if (value.length < 10) return false;
  return true;
}