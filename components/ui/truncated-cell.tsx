'use client';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { TableCell } from '@/components/ui/table';

export function TruncatedCell({
  content,
  maxWidth = 'max-w-[200px]'
}: {
  content: string;
  maxWidth?: string;
}) {
  return (
    <div className={`${maxWidth} truncate`}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-help">{content}</span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs whitespace-pre-wrap">{content}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
