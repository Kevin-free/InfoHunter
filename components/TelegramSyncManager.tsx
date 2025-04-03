'use client';

import { useEffect, useRef, useState } from 'react';
import { TelegramWebService } from '@/lib/services/telegramWebService';
import { useUserStore } from 'stores/userStore';
import { toast } from 'react-hot-toast';
import { LocalStorageService } from '@/lib/localStorageService';

const SYNC_INTERVAL =
  Number(process.env.NEXT_PUBLIC_SYNC_INTERVAL) || 5 * 60 * 1000; // 5 minutes
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds

export function TelegramSyncManager() {
  const user = useUserStore((state) => state.user);
  const syncInProgressRef = useRef<boolean>(false);
  const intervalIdRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  const syncAccounts = async (retryCount = 0) => {
    // 如果已经在同步中，直接返回
    if (syncInProgressRef.current) {
      console.log('Sync already in progress, skipping...');
      return;
    }

    syncInProgressRef.current = true;

    try {
      // Get accounts from local storage instead of API
      const accounts = LocalStorageService.getAccounts().filter(
        (account) => account.status === 'active'
      );

      const sessions = accounts
        .map((account) =>
          localStorage.getItem(`telegram_session_${account.tgId}`)
        )
        .filter(Boolean);

      for (const sessionData of sessions) {
        if (!sessionData) continue;

        try {
          const service = new TelegramWebService(sessionData);
          await service.connect();
          // init sync all groups
          const result = await service.syncGroupMetadata(0);
          // init sync all groups pre 100 messages
          const resultMessages = await service.syncGroupMessages(100);
          await service.disconnect();

          console.log(`auto syncGroupMetadata result:`, result);
          console.log(`auto syncGroupMessages result:`, resultMessages);
          setLastSyncTime(new Date());
        } catch (error: any) {
          console.error('Error syncing account:', error);

          if (error.code === 401) {
            toast.error(`Authentication failed for account`);
            continue;
          }

          if (retryCount < MAX_RETRIES) {
            console.log(`Retrying sync (attempt ${retryCount + 1})`);
            await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
            await syncAccounts(retryCount + 1);
          } else {
            toast.error(`Failed to sync account after ${MAX_RETRIES} attempts`);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch user accounts:', error);
    } finally {
      syncInProgressRef.current = false;
    }
  };

  useEffect(() => {
    if (!user?.userId) return;

    // 初始同步
    syncAccounts();

    // 设置定期同步
    intervalIdRef.current = setInterval(syncAccounts, SYNC_INTERVAL);

    // 清理函数
    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
      }
    };
  }, [user?.userId]);

  // 可以返回 null 或者一个状态指示器组件
  return null;
}
