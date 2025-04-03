'use client';

import { Card } from '@/components/ui/card';
import { GroupAvatar } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import { Channel } from '@/lib/types';

interface GroupsGridProps {
  chat: Channel;
  showCheckboxes?: boolean;
  onCheckChange?: (checked: boolean) => void;
  isChecked?: boolean;
  basePath?: string;
  onItemClick?: (chatId: string) => string;
  hideAccountInfo?: boolean;
}

export function GroupsGrid({
  chat,
  showCheckboxes = false,
  onCheckChange,
  isChecked = false,
  basePath = '/subscriber/channels',
  onItemClick,
  hideAccountInfo = false
}: GroupsGridProps) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const path = onItemClick
      ? onItemClick(chat.channelId)
      : `${basePath}/${chat.channelId}`;
    router.push(path);
  };

  return (
    <Card
      className="border-0 flex flex-col p-3 h-full hover:shadow-md transition-shadow cursor-pointer bg-card"
      onClick={handleClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <GroupAvatar
            photo={chat.metadata.photo || ''}
            name={chat.metadata.name || ''}
            size={32}
            is_r2_url={true}
          />
          <div>
            <h3 className="font-medium leading-none text-sm line-clamp-1">
              {chat.metadata.name}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {chat.metadata.participantsCount} members
            </p>
          </div>
        </div>
      </div>

      <div className="my-2 text-xs text-muted-foreground line-clamp-2">
        {chat.metadata.about || 'No info'}
      </div>
    </Card>
  );
}
