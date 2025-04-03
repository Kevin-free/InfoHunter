import { useState, useEffect, useCallback } from 'react';
import { LocalGroup, LocalStorageService } from '../localStorageService';

interface UseLocalGroupsOptions {
  search?: string;
  offset?: number;
  pageSize?: number;
  accountTgIds?: string[];
  isPublished?: boolean;
  isPublic?: boolean;
  from?: string;
  tab?: string;
  searchParams?: URLSearchParams;
}

export function useLocalGroups(options: UseLocalGroupsOptions = {}) {
  const {
    search = '',
    offset = 0,
    pageSize = 20,
    accountTgIds = [],
    tab,
    from,
    searchParams
  } = options;

  const [groups, setGroups] = useState<LocalGroup[]>([]);
  const [totalGroups, setTotalGroups] = useState(0);
  const [loading, setLoading] = useState(true);

  // 根据 tab 和 from 参数确定过滤条件
  const getFilterParams = useCallback(() => {
    let isPublished: boolean | undefined;
    let isPublic: boolean | undefined;

    if (from === 'channels') {
      isPublished = true;
      isPublic =
        tab === 'public' ? true : tab === 'private' ? false : undefined;
    }

    return { isPublished, isPublic };
  }, [from, tab]);

  const fetchGroups = useCallback(async () => {
    setLoading(true);

    try {
      const { isPublished, isPublic } = getFilterParams();
      const filterAccountUsername =
        searchParams?.get('filter_accountUsername') || '';

      const result = LocalStorageService.searchGroups({
        search,
        offset,
        pageSize,
        accountTgIds: accountTgIds.length > 0 ? accountTgIds : undefined,
        isPublished,
        isPublic,
        accountUsername: filterAccountUsername
      });

      setGroups(result.groups);
      setTotalGroups(result.totalGroups);
      return result;
    } catch (error) {
      console.error('Error fetching groups from localStorage:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [search, offset, pageSize, accountTgIds, searchParams, getFilterParams]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const addGroup = useCallback(
    (group: LocalGroup, accountTgId?: string) => {
      LocalStorageService.saveGroup(group);
      if (accountTgId) {
        LocalStorageService.addGroupToAccount(accountTgId, group.chatId);
      }
      fetchGroups();
    },
    [fetchGroups]
  );

  const updateGroup = useCallback(
    (group: LocalGroup) => {
      LocalStorageService.saveGroup(group);
      fetchGroups();
    },
    [fetchGroups]
  );

  const deleteGroup = useCallback(
    (chatId: string) => {
      LocalStorageService.deleteGroup(chatId);
      fetchGroups();
    },
    [fetchGroups]
  );

  return {
    data: {
      chats: groups,
      totalChats: totalGroups
    },
    loading,
    addGroup,
    updateGroup,
    deleteGroup,
    mutate: () => Promise.resolve(fetchGroups()),
    isValidating: loading
  };
}
