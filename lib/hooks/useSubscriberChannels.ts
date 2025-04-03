import { getJwt } from '@/components/lib/networkUtils';
import { Channel } from '@/lib/types';
import useSWR from 'swr';

interface UseSubscriberChannelsOptions {
  workflowDefinitionId?: string;
  offset?: number;
  pageSize?: number;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  filters?: Record<string, string>;
}

export function useSubscriberChannels(
  options: UseSubscriberChannelsOptions = {}
) {
  const {
    workflowDefinitionId,
    offset = 0,
    pageSize = 20,
    sortColumn,
    sortDirection,
    filters = {}
  } = options;

  const fetcher = async () => {
    const queryParams = new URLSearchParams();

    // 添加基本参数
    queryParams.set('offset', offset.toString());
    queryParams.set('pageSize', pageSize.toString());

    // 添加工作流 ID（如果有）
    if (workflowDefinitionId) {
      queryParams.set('workflowDefinitionId', workflowDefinitionId);
    }

    // 添加排序参数
    if (sortColumn) {
      queryParams.set('sortColumn', sortColumn);

      if (sortDirection) {
        queryParams.set('sortDirection', sortDirection);
      }
    }

    // 添加过滤参数
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        queryParams.set(`filter_${key}`, value);
      }
    });

    const url = `/api/subscriber/channels?${queryParams.toString()}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${getJwt()}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch channels');
    }

    const { data, error, totalCount } = await response.json();

    if (error) {
      throw new Error(error);
    }

    return {
      chats: data,
      totalChats: totalCount || 0
    };
  };

  const { data, error, isLoading, mutate } = useSWR(
    [
      'subscriber-channels',
      workflowDefinitionId,
      offset,
      pageSize,
      sortColumn,
      sortDirection,
      JSON.stringify(filters)
    ],
    fetcher
  );

  return {
    data: data || { chats: [], totalChats: 0 },
    loading: isLoading,
    error,
    mutate
  };
}
