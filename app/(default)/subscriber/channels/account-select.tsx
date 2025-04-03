'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { X, Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

import { useLocalAccounts } from '@/lib/hooks/useLocalAccounts';
import { LocalAccount } from '@/lib/localStorageService';

interface SelectedAccount {
  tgId: string;
  username: string;
}

export function AccountSelect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selected, setSelected] = React.useState<SelectedAccount[]>([]);
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');

  // 加载账户列表
  const { accounts } = useLocalAccounts({ status: 'active' });

  // 从 URL 参数同步选中状态
  React.useEffect(() => {
    const accountsParam = searchParams.get('accountTgIds');
    if (accountsParam) {
      const accountTgIds = accountsParam.split(',').filter(Boolean);
      // 从已加载的账户中找到对应的完整信息
      const selectedAccounts = accounts
        .filter((account) => accountTgIds.includes(account.tgId))
        .map((account) => ({
          tgId: account.tgId,
          username: account.username || account.tgId
        }));
      setSelected(selectedAccounts);
    } else {
      setSelected([]);
    }
  }, [searchParams, accounts]);

  // 更新 URL 参数
  const updateUrlParams = (newSelected: SelectedAccount[]) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newSelected.length > 0) {
      params.set('accountTgIds', newSelected.map((acc) => acc.tgId).join(','));
    } else {
      params.delete('accountTgIds');
    }
    router.push(`/publisher/groups?${params.toString()}`);
  };

  // 处理选择/取消选择
  const handleSelect = (account: LocalAccount) => {
    setSelected((current) => {
      const isSelected = current.some((item) => item.tgId === account.tgId);
      const newSelected = isSelected
        ? current.filter((item) => item.tgId !== account.tgId)
        : [
            ...current,
            { tgId: account.tgId, username: account.username || account.tgId }
          ];

      updateUrlParams(newSelected);
      return newSelected;
    });
  };

  // 过滤账户列表
  const filteredAccounts = accounts.filter((account) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      account.username?.toLowerCase().includes(searchLower) ||
      account.phone?.toLowerCase().includes(searchLower) ||
      account.tgId?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selected.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {selected.map((account) => (
                <Badge
                  key={account.tgId}
                  variant="secondary"
                  className="mr-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    const fullAccount = accounts.find(
                      (acc) => acc.tgId === account.tgId
                    );
                    if (fullAccount) {
                      handleSelect(fullAccount);
                    }
                  }}
                >
                  {account.username}
                  <X className="ml-1 h-3 w-3" />
                </Badge>
              ))}
            </div>
          ) : (
            'Select account'
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput
            placeholder="Search accounts..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>No account found.</CommandEmpty>
            <CommandGroup>
              {filteredAccounts.map((account) => (
                <CommandItem
                  key={account.tgId}
                  onSelect={() => handleSelect(account)}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      selected.some((item) => item.tgId === account.tgId)
                        ? 'opacity-100'
                        : 'opacity-0'
                    )}
                  />
                  {account.username || account.tgId}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
          {selected.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    setSelected([]);
                    updateUrlParams([]);
                  }}
                  className="justify-start text-sm"
                >
                  <X className="mr-2 h-4 w-4" />
                  Clear all
                </CommandItem>
              </CommandGroup>
            </>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
