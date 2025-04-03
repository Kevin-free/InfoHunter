import Redis from 'ioredis';

let redisClient: Redis | null = null;

export const getRedisClient = () => {
  if (!redisClient) {
    redisClient = new Redis(process.env.REDIS_URL || '');
  }
  return redisClient;
};

const SERVICE_PREFIX = 'the_sinper_bot';

export const NEW_ACCOUNT_REQUEST_KEY = `${SERVICE_PREFIX}:new_account_request`;
export const phone_code_key = (phone: string) =>
  `${SERVICE_PREFIX}:phone_code:${phone}`;
export const phone_status_key = (phone: string) =>
  `${SERVICE_PREFIX}:phone_status:${phone}`;

export const phone_password_key = (phone: string) =>
  `${SERVICE_PREFIX}:phone_password:${phone}`;

export const phone_session_key = (phone: string) =>
  `${SERVICE_PREFIX}:phone_session:${phone}`;

export const SCHEDULE_CREATED_KEY = `${SERVICE_PREFIX}:schedule_created`;

export const redisService = {
  async pushAccountRequest(data: {
    phone: string;
    apiId?: string;
    apiHash?: string;
  }) {
    const redis = getRedisClient();
    return redis.lpush(NEW_ACCOUNT_REQUEST_KEY, JSON.stringify(data));
  },

  async setPhoneCode(phone: string, code: string) {
    const redis = getRedisClient();
    return await redis.set(phone_code_key(phone), code, 'EX', 600); // 10 min expiration
  },

  async setPassword(phone: string, password: string) {
    const redis = getRedisClient();
    return await redis.set(phone_password_key(phone), password);
  },

  async getPhoneStatus(phone: string) {
    const redis = getRedisClient();
    return await redis.get(phone_status_key(phone));
  },
  async setTgSession(phone: string, session: string) {
    const redis = getRedisClient();
    return await redis.set(phone_session_key(phone), session);
  },
  async getTgSession(phone: string) {
    const redis = getRedisClient();
    return await redis.get(phone_session_key(phone));
  },
  async deleteTgSession(phone: string) {
    const redis = getRedisClient();
    return await redis.del(phone_session_key(phone));
  },
  async setScheduleCreated(tgId: string) {
    const redis = getRedisClient();
    return await redis.set(`${SCHEDULE_CREATED_KEY}:${tgId}`, '1');
  },
  async hasScheduleCreated(tgId: string) {
    const redis = getRedisClient();
    const value = await redis.get(`${SCHEDULE_CREATED_KEY}:${tgId}`);
    return value === '1';
  }
};
