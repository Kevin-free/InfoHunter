'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LatestMessageDialog } from './latest-message-dialog';

interface Message {
  id: number;
  messageText: string;
  messageTimestamp: number;
  buttons: any[];
  reactions: any[];
}

interface LatestMessagesCardProps {
  messages: Message[];
}

export function LatestMessagesCard({ messages }: LatestMessagesCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(true)}>
        View Latest Messages ({messages.length})
      </Button>

      <LatestMessageDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        messages={messages}
      />
    </>
  );
}
