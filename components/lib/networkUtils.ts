import { deleteCookie, getCookie, setCookie } from 'cookies-next';

export const COOKIE_KEY_JWT = 'jwt_cookie';

export async function saveJwt(jwt: string) {
  setCookie(COOKIE_KEY_JWT, jwt);
}

export function getJwt() {
  return getCookie(COOKIE_KEY_JWT);
}

export function deleteJwt() {
  deleteCookie(COOKIE_KEY_JWT);
}
