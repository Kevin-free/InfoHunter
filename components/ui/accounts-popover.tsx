'use client';

import * as React from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronDown, Search } from 'lucide-react';

interface AccountsPopoverProps {
  accounts: { username: string | null }[];
}

export function AccountsPopover({ accounts }: AccountsPopoverProps) {
  const [search, setSearch] = React.useState('');
  const filteredAccounts = accounts.filter(
    (account) =>
      account.username &&
      account.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-1 h-auto py-1 px-2"
        >
          <Badge variant="secondary" className="font-mono">
            {accounts.length}
          </Badge>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-2 border-b">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search accounts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8"
            />
          </div>
        </div>
        <ScrollArea className="h-[200px]">
          <div className="p-2 grid gap-1">
            {filteredAccounts.map((account, index) => (
              <div
                key={`${account.username}-${index}`}
                className="px-2 py-1 text-sm rounded-md hover:bg-muted"
              >
                <code className="text-sm">{account.username}</code>
              </div>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
