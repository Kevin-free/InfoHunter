'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { TableCell } from '@/components/ui/table';
import { cn } from '@/lib/utils';

export function ExpandableCell({ content }: { content: string }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <TableCell>
      <div className="relative">
        <div className={cn('max-w-[300px]', !isExpanded && 'line-clamp-2')}>
          {content}
        </div>
        {content.length > 100 && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute bottom-0 right-0 bg-background"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Show less' : 'Show more'}
          </Button>
        )}
      </div>
    </TableCell>
  );
}
