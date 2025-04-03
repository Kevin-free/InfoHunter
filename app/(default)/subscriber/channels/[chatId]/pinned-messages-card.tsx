'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PinnedMessageDialog } from './pinned-message-dialog';

interface PinnedMessagesCardProps {
  messageIds: string[];
}

export function PinnedMessagesCard({ messageIds }: PinnedMessagesCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  if (!messageIds?.length) {
    return (
      <div className="text-sm text-muted-foreground">No pinned messages</div>
    );
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(true)}>
        View Pinned Messages ({messageIds.length})
      </Button>

      <PinnedMessageDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        messageIds={messageIds}
      />
    </>
  );
}
