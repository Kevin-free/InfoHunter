'use client';

import * as React from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { GroupTableColumn } from '@/lib/types';
import { Pagination } from '@/components/ui/pagination';
import { formatUniversalTime, getTimeFreshnessColor } from '@/lib/utils';
import { TruncatedCell } from '@/components/ui/truncated-cell';
import { Trash } from 'lucide-react';
import { GroupAvatar } from '@/components/ui/avatar';
import {
  FilterableTableHeader,
  SortDirection
} from '@/components/ui/filterable-table-header';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { getJwt } from '@/components/lib/networkUtils';
import { toast } from 'react-hot-toast';
import { Channel } from '@/lib/types';
import { useUsers } from '@/lib/hooks/useUsers';

const COLUMN_MAP: Record<string, string> = {
  Name: 'metadata.name',
  Intro: 'metadata.about',
  Members: 'metadata.participantsCount',
  Messages: 'messagesCount',
  Publisher: 'userId',
  Pricing: 'subscriptionFee',
  'Last Synced': 'lastSyncedAt',
  'Last Message': 'lastMessageAt'
};

interface GroupsTableProps {
  chats: Channel[];
  offset: number;
  totalChats: number;
  pageSize?: number;
  showCheckboxes?: boolean;
  columns: GroupTableColumn[];
  basePath?: string;
  filterPath?: string;
  onItemClick?: (chatId: string) => string;
  showDeleteAction?: boolean;
  mutate: () => Promise<any>;
  onChannelsSelected?: (channels: string[]) => void;
  selectedChannels?: string[];
  onAddToWorkflow?: () => void;
  currentTab: string;
}

export function GroupsTable({
  chats: initialChats,
  offset,
  totalChats,
  pageSize = 20,
  showCheckboxes = true,
  columns,
  basePath = '/subscriber/channels',
  filterPath,
  onItemClick,
  showDeleteAction = false,
  mutate,
  onChannelsSelected,
  selectedChannels: externalSelectedChats,
  onAddToWorkflow,
  currentTab
}: GroupsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [internalSelectedChats, setInternalSelectedChats] = useState<string[]>(
    []
  );
  const { users, loading: usersLoading } = useUsers();
  const [messageCounts, setMessageCounts] = useState<Record<string, number>>(
    {}
  );
  const [loadingCounts, setLoadingCounts] = useState(false);

  // 客户端数据处理状态 - 从URL参数初始化
  const [currentPage, setCurrentPage] = useState(
    Math.floor(offset / pageSize) + 1
  );
  const [clientPageSize, setClientPageSize] = useState(pageSize);

  // 从URL搜索参数初始化过滤器
  const initialFilters = useMemo(() => {
    const filterObj: Record<string, string> = {};
    for (const [key, value] of Array.from(searchParams.entries())) {
      if (key.startsWith('filter_') && value) {
        const filterKey = key.replace('filter_', '');
        filterObj[filterKey] = value;
      }
    }
    return filterObj;
  }, [searchParams]);

  const [filters, setFilters] =
    useState<Record<string, string>>(initialFilters);

  // 从URL初始化排序
  const initialSorting = useMemo(() => {
    const sortCol = searchParams.get('sortColumn') || '';
    const sortDir =
      (searchParams.get('sortDirection') as SortDirection) || null;
    return {
      column: sortCol,
      direction: sortDir
    };
  }, [searchParams]);

  const [sorting, setSorting] = useState<{
    column: string;
    direction: SortDirection | null;
  }>(initialSorting);

  const selectedChats = externalSelectedChats || internalSelectedChats;
  const pathForFiltering = filterPath || basePath;

  // 客户端数据过滤
  const filteredChats = useMemo(() => {
    return initialChats.filter((chat) => {
      // 检查所有过滤条件
      return Object.entries(filters).every(([key, value]) => {
        if (!value) return true; // 空过滤值始终返回 true

        switch (key) {
          case 'metadata.name':
            return chat.metadata.name
              ?.toLowerCase()
              .includes(value.toLowerCase());
          case 'metadata.about':
            return chat.metadata.about
              ?.toLowerCase()
              .includes(value.toLowerCase());
          case 'userId':
            return chat.userId?.toLowerCase().includes(value.toLowerCase());
          // 添加其他过滤条件...
          default:
            return true;
        }
      });
    });
  }, [initialChats, filters]);

  // 客户端数据排序
  const sortedChats = useMemo(() => {
    if (!sorting.column || !sorting.direction) {
      return filteredChats;
    }

    return [...filteredChats].sort((a, b) => {
      const direction = sorting.direction === 'asc' ? 1 : -1;

      switch (sorting.column) {
        case 'metadata.name':
          return (
            direction *
            (a.metadata.name || '').localeCompare(b.metadata.name || '')
          );
        case 'metadata.about':
          return (
            direction *
            (a.metadata.about || '').localeCompare(b.metadata.about || '')
          );
        case 'metadata.participantsCount':
          return (
            direction *
            ((a.metadata.participantsCount || 0) -
              (b.metadata.participantsCount || 0))
          );
        case 'messagesCount':
          return (
            direction *
            ((messageCounts[a.channelId] || 0) -
              (messageCounts[b.channelId] || 0))
          );
        case 'lastSyncedAt':
          // 安全地将日期/时间戳转换为可比较的数值
          const dateA = a.lastSyncedAt ? new Date(a.lastSyncedAt).getTime() : 0;
          const dateB = b.lastSyncedAt ? new Date(b.lastSyncedAt).getTime() : 0;
          return direction * (dateA - dateB);
        case 'lastMessageAt':
          return direction * ((a.lastMessageAt || 0) - (b.lastMessageAt || 0));
        case 'userId':
          return direction * (a.userId || '').localeCompare(b.userId || '');
        case 'subscriptionFee':
          return (
            direction *
            (Number(a.subscriptionFee || 0) - Number(b.subscriptionFee || 0))
          );
        default:
          return 0;
      }
    });
  }, [filteredChats, sorting, messageCounts]);

  // 客户端分页
  const paginatedChats = useMemo(() => {
    const startIndex = (currentPage - 1) * clientPageSize;
    return sortedChats.slice(startIndex, startIndex + clientPageSize);
  }, [sortedChats, currentPage, clientPageSize]);

  // 总页数
  const totalPages = Math.ceil(sortedChats.length / clientPageSize);

  // 获取消息计数
  useEffect(() => {
    const fetchMessageCounts = async () => {
      if (!initialChats.length) return;

      setLoadingCounts(true);
      try {
        // Get all channel IDs
        const channelIds = initialChats.map((chat) => chat.channelId);

        // Fetch counts from API using POST
        const response = await fetch('/api/messages/count/batch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ channelIds })
        });
        if (response.ok) {
          const data = await response.json();
          setMessageCounts(data.counts || {});
        }
      } catch (error) {
        console.error('Error fetching message counts:', error);
      } finally {
        setLoadingCounts(false);
      }
    };

    fetchMessageCounts();
  }, [initialChats]);

  // 处理过滤变化
  const handleFilterChange = (column: string, value: string) => {
    const mappedColumn = COLUMN_MAP[column] || column;

    // 更新本地状态
    setFilters((prev) => ({
      ...prev,
      [mappedColumn]: value
    }));
    setCurrentPage(1); // 重置到第一页

    // 更新URL (可选 - 如果您想保持URL同步)
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(`filter_${mappedColumn}`, value);
    } else {
      params.delete(`filter_${mappedColumn}`);
    }
    params.set('offset', '0'); // 重置分页
    router.push(`${pathForFiltering}?${params.toString()}`);
  };

  // 处理分页变化
  const handlePageChange = (page: number) => {
    setCurrentPage(page);

    // 更新URL (可选 - 如果您想保持URL同步)
    const newOffset = (page - 1) * clientPageSize;
    const params = new URLSearchParams(searchParams.toString());
    params.set('offset', newOffset.toString());
    params.set('pageSize', clientPageSize.toString());
    router.push(`${pathForFiltering}?${params.toString()}`);
  };

  // 处理排序变化
  const handleSortChange = (column: string, direction: SortDirection) => {
    const mappedColumn = COLUMN_MAP[column] || column;

    // 更新本地状态
    setSorting({
      column: mappedColumn,
      direction
    });
    setCurrentPage(1); // 重置到第一页

    // 更新URL (可选 - 如果您想保持URL同步)
    const params = new URLSearchParams(searchParams.toString());
    if (direction) {
      params.set('sortColumn', mappedColumn);
      params.set('sortDirection', direction);
    } else {
      params.delete('sortColumn');
      params.delete('sortDirection');
    }
    params.set('offset', '0'); // 重置分页
    router.push(`${pathForFiltering}?${params.toString()}`);
  };

  const handleSelectionChange = (channels: string[]) => {
    if (onChannelsSelected) {
      onChannelsSelected(channels);
    } else {
      setInternalSelectedChats(channels);
    }
  };

  // Consolidated function to handle removing channels from workflow
  const handleRemoveFromWorkflow = async (channelIds?: string[]) => {
    const idsToRemove = channelIds || selectedChats;

    if (idsToRemove.length === 0) return;

    try {
      const response = await fetch('/api/channel-workflows/batch', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getJwt()}`
        },
        body: JSON.stringify({
          channelIds: idsToRemove,
          workflowDefinitionId: currentTab
        })
      });

      if (!response.ok) throw new Error('Failed to remove from workflow');

      // Only clear selection if we're removing the selected channels
      if (!channelIds) {
        handleSelectionChange([]);
      }

      await mutate();
      toast.success(
        idsToRemove.length === 1
          ? 'Channel successfully removed'
          : 'Channels successfully removed'
      );
    } catch (error) {
      console.error('Error removing from workflow:', error);
      toast.error('Failed to remove from workflow');
    }
  };

  const renderTableCell = (chat: Channel, column: GroupTableColumn) => {
    switch (column) {
      case 'Name':
        return (
          <TableCell className="text-left">
            <div className="flex items-center gap-2">
              <GroupAvatar
                photo={chat.metadata.photo || ''}
                name={chat.metadata.name || ''}
                is_r2_url={true}
              />
              <TruncatedCell
                content={chat.metadata.name ?? ''}
                maxWidth="max-w-[100px]"
              />
            </div>
          </TableCell>
        );
      case 'Intro':
        return (
          <TableCell className="text-left">
            <TruncatedCell
              content={chat.metadata.about ?? ''}
              maxWidth="max-w-[150px]"
            />
          </TableCell>
        );
      case 'Members':
        return (
          <TableCell className="text-left">
            {chat.metadata.participantsCount}
          </TableCell>
        );
      case 'Messages':
        return (
          <TableCell className="text-left">
            {loadingCounts ? (
              <span className="text-muted-foreground">Loading...</span>
            ) : (
              messageCounts[chat.channelId] || 0
            )}
          </TableCell>
        );
      case 'Publisher':
        const user = users.find((user) => user.userId === chat.userId);
        return (
          <TableCell className="text-left">
            {user?.username || 'Anonymous'}
          </TableCell>
        );
      case 'Pricing':
        return (
          <TableCell className="text-left whitespace-nowrap">
            {chat.isFree ||
            Number(chat.subscriptionFee).toFixed(2) === '0.00' ? (
              <span className="text-green-600 font-medium">Free</span>
            ) : (
              <span className="text-amber-600 font-medium">
                {Number(chat.subscriptionFee).toFixed(2)}
              </span>
            )}
          </TableCell>
        );
      case 'Last Synced':
        const lastSyncedAt = chat.lastSyncedAt;
        const lastSyncedAtFormatted = formatUniversalTime(lastSyncedAt);
        const lastSyncedAtColor = getTimeFreshnessColor(lastSyncedAt);
        return (
          <TableCell
            className={`text-left ${lastSyncedAtColor} whitespace-nowrap`}
          >
            {lastSyncedAtFormatted}
          </TableCell>
        );
      case 'Last Message':
        const lastMessageAt = chat.lastMessageAt;
        const lastMessageAtFormatted = formatUniversalTime(lastMessageAt);
        const lastMessageAtColor = getTimeFreshnessColor(lastMessageAt);

        return (
          <TableCell
            className={`text-left ${lastMessageAtColor} whitespace-nowrap`}
          >
            {lastMessageAtFormatted}
          </TableCell>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="border border-gray-200/50 rounded-xl bg-muted/60">
      {showCheckboxes && selectedChats.length > 0 && (
        <CardHeader>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {selectedChats.length} selected
            </span>
            {currentTab === 'all' ? (
              <Button
                variant="outline"
                size="sm"
                onClick={onAddToWorkflow}
                disabled={selectedChats.length === 0}
              >
                Add to Workflow
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRemoveFromWorkflow()}
                disabled={selectedChats.length === 0}
              >
                Remove from Workflow
              </Button>
            )}
          </div>
        </CardHeader>
      )}
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {showCheckboxes && (
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={
                      paginatedChats.length > 0 &&
                      paginatedChats.every((chat) =>
                        selectedChats.includes(chat.channelId)
                      )
                    }
                    onCheckedChange={(checked) => {
                      // 只选择/取消选择当前页面的项目
                      if (checked) {
                        const currentPageIds = paginatedChats.map(
                          (chat) => chat.channelId
                        );
                        const newSelection = [...selectedChats];

                        // 添加当前页面中未选择的ID
                        currentPageIds.forEach((id) => {
                          if (!newSelection.includes(id)) {
                            newSelection.push(id);
                          }
                        });

                        handleSelectionChange(newSelection);
                      } else {
                        // 从选择中移除当前页面的ID
                        const currentPageIds = paginatedChats.map(
                          (chat) => chat.channelId
                        );
                        handleSelectionChange(
                          selectedChats.filter(
                            (id) => !currentPageIds.includes(id)
                          )
                        );
                      }
                    }}
                  />
                </TableHead>
              )}
              {columns.map((column) => (
                <FilterableTableHeader
                  key={`header-${column}`}
                  column={column}
                  label={column.replace(/([A-Z])/g, ' $1').trim()}
                  filterValue={filters[COLUMN_MAP[column]] || ''}
                  onFilterChange={handleFilterChange}
                  sortDirection={
                    sorting.column === (COLUMN_MAP[column] || column)
                      ? sorting.direction
                      : null
                  }
                  onSort={handleSortChange}
                />
              ))}
            </TableRow>
          </TableHeader>
          <TableBody emptyContent="No data found, please add account and publish groups.">
            {paginatedChats.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (showCheckboxes ? 1 : 0)}
                  className="h-24 text-center"
                >
                  No results found.
                </TableCell>
              </TableRow>
            ) : (
              paginatedChats.map((chat, index) => (
                <TableRow
                  key={`row-${chat.channelId}-${index}`}
                  className="cursor-pointer transition-colors"
                  onClick={(e) => {
                    // Prevent row click when clicking on checkbox or delete button
                    if (e.defaultPrevented) return;

                    const path = onItemClick
                      ? onItemClick(chat.dataId)
                      : `${pathForFiltering}/${chat.dataId}`;
                    router.push(path);
                  }}
                >
                  {showCheckboxes && (
                    <TableCell
                      key={`checkbox-${chat.channelId}`}
                      onClick={(e) => e.preventDefault()}
                    >
                      <Checkbox
                        checked={selectedChats.includes(chat.channelId)}
                        onCheckedChange={(checked) => {
                          handleSelectionChange(
                            checked
                              ? [...selectedChats, chat.channelId]
                              : selectedChats.filter(
                                  (id) => id !== chat.channelId
                                )
                          );
                        }}
                      />
                    </TableCell>
                  )}
                  {columns.map((column) => (
                    <React.Fragment
                      key={`cell-${chat.channelId}-${column}-${index}`}
                    >
                      {renderTableCell(chat, column)}
                    </React.Fragment>
                  ))}
                  {showDeleteAction && (
                    <TableCell onClick={(e) => e.preventDefault()}>
                      <div className="flex items-center justify-end gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleRemoveFromWorkflow([chat.channelId])
                                }
                                className="flex items-center gap-2 text-destructive hover:bg-destructive/10"
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Remove</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-sm text-muted-foreground">
          Showing{' '}
          {paginatedChats.length ? (currentPage - 1) * clientPageSize + 1 : 0}-
          {Math.min(currentPage * clientPageSize, sortedChats.length)} of{' '}
          {sortedChats.length} groups
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={Math.max(1, totalPages)}
          pageSize={clientPageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={(newPageSize) => {
            setClientPageSize(newPageSize);
            setCurrentPage(1);

            // 更新URL (可选)
            const params = new URLSearchParams(searchParams.toString());
            params.set('pageSize', newPageSize.toString());
            params.set('offset', '0');
            router.push(`${pathForFiltering}?${params.toString()}`);
          }}
        />
      </CardFooter>
    </Card>
  );
}
