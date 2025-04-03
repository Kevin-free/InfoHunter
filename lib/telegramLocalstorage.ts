interface TelegramCodeData {
  code: string;
  hashCode: string;
  expireTime: number;
  phoneNumber: string;
}

export const TelegramLocalKey = {
  telegramCode: (userId: string) => `curifi_webapp:telegram_code:${userId}`
};

export const TelegramStorage = {
  setCode: (
    userId: string,
    data: Omit<TelegramCodeData, 'expireTime'>
  ): void => {
    const expireTime = Date.now() + 5 * 60 * 1000; // 5分钟后过期
    localStorage.setItem(
      TelegramLocalKey.telegramCode(userId),
      JSON.stringify({ ...data, expireTime })
    );
  },

  getCode: (userId: string): TelegramCodeData | null => {
    const data = localStorage.getItem(TelegramLocalKey.telegramCode(userId));
    if (!data) return null;

    const parsedData = JSON.parse(data) as TelegramCodeData;
    if (Date.now() > parsedData.expireTime) {
      TelegramStorage.removeCode(userId);
      return null;
    }
    return parsedData;
  },

  removeCode: (userId: string): void => {
    localStorage.removeItem(TelegramLocalKey.telegramCode(userId));
  }
};
