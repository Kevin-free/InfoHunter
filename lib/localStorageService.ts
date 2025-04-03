// 存储键常量
export const STORAGE_KEYS = {
  ACCOUNTS: 'local_accounts',
  GROUPS: 'local_groups',
  ACCOUNT_GROUPS_MAP: 'local_account_groups_map'
};

// 类型定义
export interface LocalAccount {
  tgId: string;
  username: string | null;
  phone: string | null;
  fullname: string | null;
  status: 'active' | 'banned' | 'suspended';
  createdAt: string;
  updatedAt: string;
  lastActiveAt: string;
}

export interface LocalGroup {
  chatId: string;
  tgId: string;
  name: string | null;
  photo: string | null;
  about: string | null;
  username: string | null;
  participantsCount: number;
  admins: any[] | null;
  type: string;
  createdAt: string;
  updatedAt: string;
  isPublished: boolean;
  isPublic: boolean;
  isFree: boolean;
  subscriptionFee: string;
  lastSyncedAt: string | null;
}

export interface AccountGroupMap {
  [accountTgId: string]: string[]; // chatIds array
}

// LocalStorage 服务
export const LocalStorageService = {
  // 账户相关方法
  getAccounts: (): LocalAccount[] => {
    const data = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
    return data ? JSON.parse(data) : [];
  },

  saveAccount: (account: LocalAccount): void => {
    const accounts = LocalStorageService.getAccounts();
    const existingIndex = accounts.findIndex((a) => a.tgId === account.tgId);

    if (existingIndex >= 0) {
      accounts[existingIndex] = {
        ...accounts[existingIndex],
        ...account,
        updatedAt: new Date().toISOString()
      };
    } else {
      accounts.push({
        ...account,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString()
      });
    }

    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
  },

  deleteAccount: (tgId: string): void => {
    const accounts = LocalStorageService.getAccounts();
    const filteredAccounts = accounts.filter(
      (account) => account.tgId !== tgId
    );
    localStorage.setItem(
      STORAGE_KEYS.ACCOUNTS,
      JSON.stringify(filteredAccounts)
    );

    // 同时删除与该账户关联的群组映射
    LocalStorageService.deleteAccountGroupMap(tgId);
  },

  // 群组相关方法
  getGroups: (): LocalGroup[] => {
    const data = localStorage.getItem(STORAGE_KEYS.GROUPS);
    return data ? JSON.parse(data) : [];
  },

  saveGroup: (group: LocalGroup): void => {
    // Make sure group has these fields
    if (group.isFree === undefined) {
      group.isFree = true;
    }
    if (group.subscriptionFee === undefined) {
      group.subscriptionFee = '0';
    }

    const groups = LocalStorageService.getGroups();
    const existingIndex = groups.findIndex((g) => g.chatId === group.chatId);

    if (existingIndex >= 0) {
      groups[existingIndex] = {
        ...groups[existingIndex],
        ...group,
        updatedAt: new Date().toISOString()
      };
    } else {
      groups.push({
        ...group,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(groups));
  },

  deleteGroup: (chatId: string): void => {
    const groups = LocalStorageService.getGroups();
    const filteredGroups = groups.filter((group) => group.chatId !== chatId);
    localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(filteredGroups));

    // 从所有账户的群组映射中删除该群组
    const accountGroupMap = LocalStorageService.getAccountGroupMap();
    Object.keys(accountGroupMap).forEach((accountId) => {
      if (accountGroupMap[accountId].includes(chatId)) {
        accountGroupMap[accountId] = accountGroupMap[accountId].filter(
          (id) => id !== chatId
        );
        LocalStorageService.saveAccountGroupMap(accountGroupMap);
      }
    });
  },

  // 账户-群组映射关系
  getAccountGroupMap: (): AccountGroupMap => {
    const data = localStorage.getItem(STORAGE_KEYS.ACCOUNT_GROUPS_MAP);
    return data ? JSON.parse(data) : {};
  },

  saveAccountGroupMap: (map: AccountGroupMap): void => {
    localStorage.setItem(STORAGE_KEYS.ACCOUNT_GROUPS_MAP, JSON.stringify(map));
  },

  addGroupToAccount: (accountTgId: string, chatId: string): void => {
    const map = LocalStorageService.getAccountGroupMap();
    if (!map[accountTgId]) {
      map[accountTgId] = [];
    }
    if (!map[accountTgId].includes(chatId)) {
      map[accountTgId].push(chatId);
      LocalStorageService.saveAccountGroupMap(map);
    }
  },

  deleteAccountGroupMap: (accountTgId: string): void => {
    const map = LocalStorageService.getAccountGroupMap();
    delete map[accountTgId];
    LocalStorageService.saveAccountGroupMap(map);
  },

  // 根据账户ID获取群组
  getGroupsByAccountId: (accountTgId: string): LocalGroup[] => {
    const map = LocalStorageService.getAccountGroupMap();
    const allGroups = LocalStorageService.getGroups();

    if (!map[accountTgId]) {
      return [];
    }

    return allGroups.filter((group) => map[accountTgId].includes(group.chatId));
  },

  // 按条件搜索、排序和过滤群组
  searchGroups: (params: {
    search?: string;
    offset?: number;
    pageSize?: number;
    accountTgIds?: string[];
    isPublished?: boolean;
    isPublic?: boolean;
    accountUsername?: string;
    sortColumn?: string;
    sortDirection?: 'asc' | 'desc';
    filters?: Record<string, string>;
  }): { groups: LocalGroup[]; totalGroups: number } => {
    let groups = LocalStorageService.getGroups();
    const {
      search,
      offset = 0,
      pageSize = 20,
      accountTgIds,
      isPublished,
      isPublic,
      accountUsername,
      sortColumn,
      sortDirection,
      filters = {}
    } = params;

    const accounts = LocalStorageService.getAccounts();

    // 根据账户用户名过滤
    if (accountUsername) {
      const matchedAccountIds = accounts
        .filter(
          (account) =>
            account.username &&
            account.username
              .toLowerCase()
              .includes(accountUsername.toLowerCase())
        )
        .map((account) => account.tgId);

      if (matchedAccountIds.length > 0) {
        groups = groups.filter((group) =>
          matchedAccountIds.includes(group.tgId)
        );
      } else {
        // 如果没有匹配到任何账户，返回空数组
        return { groups: [], totalGroups: 0 };
      }
    }

    // 根据账户ID过滤
    if (accountTgIds && accountTgIds.length > 0) {
      const map = LocalStorageService.getAccountGroupMap();
      const relevantChatIds = accountTgIds.flatMap((id) => map[id] || []);
      groups = groups.filter((group) => relevantChatIds.includes(group.chatId));
    }

    // 根据搜索词过滤
    if (search) {
      const searchLower = search.toLowerCase();
      groups = groups.filter(
        (group) =>
          group.name?.toLowerCase().includes(searchLower) ||
          group.username?.toLowerCase().includes(searchLower) ||
          group.about?.toLowerCase().includes(searchLower)
      );
    }

    // 根据发布状态过滤
    if (isPublished !== undefined) {
      groups = groups.filter((group) => group.isPublished === isPublished);
    }

    // 根据公开状态过滤
    if (isPublic !== undefined) {
      groups = groups.filter((group) => group.isPublic === isPublic);
    }

    // 应用额外过滤条件
    if (Object.keys(filters).length > 0) {
      groups = groups.filter((item) => {
        return Object.entries(filters).every(([key, value]) => {
          // 特殊处理账户用户名过滤
          if (key === 'accountUsername') {
            const account = accounts.find((acc) => acc.tgId === item.tgId);
            const username = account?.username || '';
            return username.toLowerCase().includes(value.toLowerCase());
          }

          const getNestedValue = (obj: any, path: string) => {
            return path.split('.').reduce((acc, part) => {
              if (acc === null || acc === undefined) return '';
              return acc[part];
            }, obj);
          };

          const itemValue = String(
            getNestedValue(item, key) || ''
          ).toLowerCase();
          return itemValue.includes(value.toLowerCase());
        });
      });
    }

    // 应用排序
    if (sortColumn && sortDirection) {
      groups.sort((a: any, b: any) => {
        // 特殊处理账户用户名排序
        if (sortColumn === 'accountUsername') {
          const accountA = accounts.find((acc) => acc.tgId === a.tgId);
          const accountB = accounts.find((acc) => acc.tgId === b.tgId);
          const usernameA = accountA?.username || '';
          const usernameB = accountB?.username || '';

          return sortDirection === 'asc'
            ? usernameA.localeCompare(usernameB)
            : usernameB.localeCompare(usernameA);
        }

        const getValueByPath = (obj: any, path: string) => {
          return path.split('.').reduce((acc, part) => {
            if (acc === null || acc === undefined) return acc;
            return acc[part];
          }, obj);
        };

        const aValue = getValueByPath(a, sortColumn);
        const bValue = getValueByPath(b, sortColumn);

        // 处理日期
        if (aValue instanceof Date && bValue instanceof Date) {
          return sortDirection === 'asc'
            ? aValue.getTime() - bValue.getTime()
            : bValue.getTime() - aValue.getTime();
        }

        // 处理数字
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        }

        // 处理字符串
        const aString = String(aValue || '').toLowerCase();
        const bString = String(bValue || '').toLowerCase();
        return sortDirection === 'asc'
          ? aString.localeCompare(bString)
          : bString.localeCompare(aString);
      });
    }

    // 记录总数并分页
    const totalGroups = groups.length;
    const paginatedGroups = groups.slice(offset, offset + pageSize);

    return { groups: paginatedGroups, totalGroups };
  },

  // Update lastSyncedAt for multiple groups
  updateGroupLastSyncedAt: (chatIds: string[]): void => {
    if (!chatIds || chatIds.length === 0) return;

    const groups = LocalStorageService.getGroups();
    let updated = false;

    // Update each group that matches the chatIds
    chatIds.forEach((chatId) => {
      const groupIndex = groups.findIndex((group) => group.chatId === chatId);
      if (groupIndex >= 0) {
        groups[groupIndex] = {
          ...groups[groupIndex],
          lastSyncedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        updated = true;
      }
    });

    // Only save if we actually updated any groups
    if (updated) {
      localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(groups));
    }
  }
};
