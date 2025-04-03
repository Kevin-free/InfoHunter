export const namespace = 'sinper-dashboard'; // redis namespace

export const httpMessage = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  500: 'Internal Server Error'
};

export const LoginType = {
  email: 'email' // email
};

export const LoginPath = '/signin';

export const apiId = process.env.NEXT_PUBLIC_APPID || 0;
export const apiHash = process.env.NEXT_PUBLIC_APP_HASH || '';
