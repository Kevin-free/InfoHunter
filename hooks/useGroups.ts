import useSWR from 'swr';
import { getJwt } from '@/components/lib/networkUtils';

export function useGroups(params: URLSearchParams) {
  const REFRESH_INTERVAL =
    Number(process.env.NEXT_PUBLIC_UI_REFRESH_INTERVAL) || 30 * 1000;

  const { data, mutate, error, isValidating } = useSWR(
    () => {
      if (!params) return null;
      const url = `/api/groups?${params.toString()}`;
      return url;
    },
    async (url) => {
      if (!url) return { chats: [], totalChats: 0 };
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${getJwt()}`
        }
      });
      const data = await response.json();
      return {
        chats: data.chats,
        totalChats: data.totalChats
      };
    },
    {
      refreshInterval: REFRESH_INTERVAL,
      revalidateOnFocus: true,
      revalidateOnReconnect: true
    }
  );

  return {
    data,
    mutate,
    error,
    isLoading: !data && !error,
    isValidating
  };
}
