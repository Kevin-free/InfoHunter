import { getJwt } from '@/components/lib/networkUtils';
import useSWR from 'swr';

interface UseWorkflowValuesOptions {
  workflowDefinitionId: string;
  refreshInterval?: number; // 毫秒
}

export function useWorkflowValues(options: UseWorkflowValuesOptions) {
  const { workflowDefinitionId, refreshInterval = 10000 } = options;

  const fetcher = async () => {
    const response = await fetch(
      `/api/data-workflows/${workflowDefinitionId}/values`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${getJwt()}`
        },
        cache: 'no-store'
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch workflow values');
    }

    const data = await response.json();

    // 处理组值数据，转换metadata为具体字段
    const processedGroupValues = (data.groupValues || []).map(
      (versionGroup: any[]) =>
        versionGroup.map((value: any) => {
          // 解析channelMetadata
          const metadata = value.channelMetadata
            ? typeof value.channelMetadata === 'string'
              ? JSON.parse(value.channelMetadata)
              : value.channelMetadata
            : {};

          return {
            ...value,
            chatName: metadata.name || 'Unnamed Group',
            chatUsername: metadata.username || '',
            chatPhoto: metadata.photo || '',
            participantsCount: metadata.participantsCount || 0
          };
        })
    );

    return {
      aggregateValues: data.aggregateValues || [],
      groupValues: processedGroupValues,
      lastUpdated: new Date()
    };
  };

  // 设置SWR配置，包括自动轮询刷新
  const { data, error, isLoading, mutate } = useSWR(
    ['workflow-values', workflowDefinitionId],
    fetcher,
    {
      refreshInterval: refreshInterval,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 2000 // 防止短时间内重复请求
    }
  );

  return {
    data: data || {
      aggregateValues: [],
      groupValues: [],
      lastUpdated: new Date()
    },
    loading: isLoading,
    error,
    mutate // 允许手动触发刷新
  };
}
