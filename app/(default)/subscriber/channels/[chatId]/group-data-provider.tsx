'use client';

import { useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import { GroupDetails } from './group-details';
import { getJwt } from '@/components/lib/networkUtils';
import { Channel } from '@/lib/types';

interface GroupDataProviderProps {
  chatId: string;
  backLink: string;
  backLabel: string;
}

export function GroupDataProvider({
  chatId,
  backLink,
  backLabel
}: GroupDataProviderProps) {
  const [chat, setChat] = useState<Channel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchChannelData() {
      try {
        // 从 API 获取频道数据
        const response = await fetch(`/api/subscriber/channels/${chatId}`, {
          headers: {
            Authorization: `Bearer ${getJwt()}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch channel data');
        }

        const { data } = await response.json();

        setChat(data);
      } catch (error) {
        console.error('Error fetching channel data:', error);
        setChat(null);
      } finally {
        setLoading(false);
      }
    }

    fetchChannelData();
  }, [chatId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!chat) {
    return notFound();
  }

  return <GroupDetails chat={chat} backLink={backLink} backLabel={backLabel} />;
}
