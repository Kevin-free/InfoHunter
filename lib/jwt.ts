import { createPrivateKey } from 'crypto';
import dayjs from 'dayjs';
import { jwtVerify, SignJWT } from 'jose';

export type UserKeyType = 'email' | 'tgId';

export interface JWTSub {
  userId: string;
  userKey: string;
  userKeyType: UserKeyType;
  isAdmin: boolean;
  displayName: string;
  photoUrl: string;
  email: string;
}

export const getJWT = async (user: {
  userId: string;
  userKey: string;
  userKeyType: UserKeyType;
  isAdmin: boolean;
  displayName: string;
  photoUrl: string;
  email: string;
}) => {
  const pemKey = process.env.JWT_PRIVATE_KEY || '';
  const key = createPrivateKey(pemKey);

  const jwtSub = {
    userId: user.userId,
    userKey: user.userKey,
    userKeyType: user.userKeyType,
    isAdmin: user.isAdmin,
    displayName: user.displayName,
    photoUrl: user.photoUrl,
    email: user.email
  };

  const jwt = await new SignJWT({
    sub: JSON.stringify(jwtSub),
    iat: dayjs().unix()
  })
    .setProtectedHeader({ alg: 'EdDSA', typ: 'JWT' })
    .setExpirationTime('7d')
    .sign(key);

  return jwt;
};

export const verifyJWT = async (jwt: string): Promise<JWTSub | undefined> => {
  try {
    const pemKey = process.env.JWT_PRIVATE_KEY || '';
    const key = createPrivateKey(pemKey);
    const verifyResult = await jwtVerify(jwt, key);
    const jwtSub = JSON.parse(verifyResult?.payload?.sub || '');
    return jwtSub;
  } catch (err) {
    console.log('verifyJWT error', err);
    throw new Error('Invalid JWT');
  }
};
