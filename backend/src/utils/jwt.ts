import jwt from 'jsonwebtoken';
import config from '../config';
import { AuthPayload } from '../types';

/**
 * Generate JWT access token
 */
export const generateToken = (payload: AuthPayload): string => {
  return jwt.sign(payload, config.jwt.secret as jwt.Secret, {
    expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'],
  });
};

/**
 * Generate JWT refresh token
 */
export const generateRefreshToken = (payload: AuthPayload): string => {
  return jwt.sign(payload, config.jwt.refreshSecret as jwt.Secret, {
    expiresIn: config.jwt.refreshExpiresIn as jwt.SignOptions['expiresIn'],
  });
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token: string): AuthPayload => {
  return jwt.verify(token, config.jwt.refreshSecret as jwt.Secret) as AuthPayload;
};

/**
 * Generate both access and refresh tokens
 */
export const generateTokenPair = (payload: AuthPayload) => {
  return {
    accessToken: generateToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
};
