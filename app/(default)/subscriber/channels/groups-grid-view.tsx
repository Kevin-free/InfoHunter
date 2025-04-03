'use client';

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader
} from '@/components/ui/card';
import { GroupsGrid } from './groups-grid-item';
import { Pagination } from '@/components/ui/pagination';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUserStore } from 'stores/userStore';
import { useState } from 'react';
import { Channel } from '@/lib/types';

interface GroupsGridViewProps {
  chats: Channel[];
  offset: number;
  totalChats: number;
  pageSize?: number;
  showCheckboxes?: boolean;
  hideAccountInfo?: boolean;
  basePath?: string;
  onItemClick?: (chatId: string) => string;
}

export function GroupsGridView({
  chats,
  offset,
  totalChats,
  pageSize = 20,
  showCheckboxes = false,
  hideAccountInfo = false,
  basePath = '/subscriber/channels',
  onItemClick
}: GroupsGridViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useUserStore((state) => state.user);
  const [selectedChats, setSelectedChats] = useState<string[]>([]);

  const handlePageChange = (newOffset: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('offset', newOffset.toString());
    router.push(`${basePath}?${params.toString()}`);
  };

  return (
    <Card className="border-0 shadow-none bg-transparent">
      <CardContent className="p-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
          {chats.map((chat) => (
            <GroupsGrid
              key={chat.channelId}
              chat={chat}
              showCheckboxes={showCheckboxes}
              basePath={basePath}
              onItemClick={onItemClick}
              hideAccountInfo={hideAccountInfo}
            />
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between p-0 mt-4">
        <div className="text-sm text-muted-foreground">
          Showing {offset + 1}-{Math.min(offset + pageSize, totalChats)} of{' '}
          {totalChats} groups
        </div>
        <Pagination
          currentPage={Math.floor(offset / pageSize) + 1}
          totalPages={Math.ceil(totalChats / pageSize)}
          pageSize={pageSize}
          onPageChange={(page) => {
            const newOffset = (page - 1) * pageSize;
            handlePageChange(newOffset);
          }}
          onPageSizeChange={(newPageSize) => {
            const params = new URLSearchParams(searchParams.toString());
            params.set('pageSize', newPageSize.toString());
            params.set('offset', '0');
            router.push(`${basePath}?${params.toString()}`);
          }}
        />
      </CardFooter>
    </Card>
  );
}
