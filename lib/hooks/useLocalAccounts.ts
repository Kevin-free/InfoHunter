import { useState, useEffect, useCallback } from 'react';
import { LocalAccount, LocalStorageService } from '../localStorageService';

interface UseLocalAccountsOptions {
  search?: string;
  offset?: number;
  pageSize?: number;
  status?: string;
}

export function useLocalAccounts(options: UseLocalAccountsOptions = {}) {
  const { search = '', offset = 0, pageSize = 20, status = 'active' } = options;
  const [accounts, setAccounts] = useState<LocalAccount[]>([]);
  const [totalAccounts, setTotalAccounts] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchAccounts = useCallback(() => {
    setLoading(true);

    try {
      let accounts = LocalStorageService.getAccounts();

      // 按状态过滤
      if (status) {
        accounts = accounts.filter((account) => account.status === status);
      }

      // 搜索过滤
      if (search) {
        const searchLower = search.toLowerCase();
        accounts = accounts.filter(
          (account) =>
            account.username?.toLowerCase().includes(searchLower) ||
            account.phone?.toLowerCase().includes(searchLower) ||
            account.tgId.toLowerCase().includes(searchLower)
        );
      }

      // 排序 - 按最后活跃时间降序
      accounts.sort(
        (a, b) =>
          new Date(b.lastActiveAt).getTime() -
          new Date(a.lastActiveAt).getTime()
      );

      setTotalAccounts(accounts.length);

      // 分页
      accounts = accounts.slice(offset, offset + pageSize);

      setAccounts(accounts);
    } catch (error) {
      console.error('Error fetching accounts from localStorage:', error);
    } finally {
      setLoading(false);
    }
  }, [search, offset, pageSize, status]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const addAccount = useCallback(
    (account: LocalAccount) => {
      LocalStorageService.saveAccount(account);
      fetchAccounts();
    },
    [fetchAccounts]
  );

  const updateAccount = useCallback(
    (account: LocalAccount) => {
      LocalStorageService.saveAccount(account);
      fetchAccounts();
    },
    [fetchAccounts]
  );

  const deleteAccount = useCallback(
    (tgId: string) => {
      LocalStorageService.deleteAccount(tgId);
      fetchAccounts();
    },
    [fetchAccounts]
  );

  return {
    accounts,
    totalAccounts,
    loading,
    addAccount,
    updateAccount,
    deleteAccount,
    refetch: fetchAccounts
  };
}
