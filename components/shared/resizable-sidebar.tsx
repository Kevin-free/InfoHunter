'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

interface ResizableSidebarProps {
  children: React.ReactNode;
}

export function ResizableSidebar({ children }: ResizableSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div
      className={cn(
        'group relative flex h-screen bg-background border-r transition-all duration-300',
        isCollapsed ? 'w-14' : 'w-64'
      )}
    >
      <div className="flex-1 overflow-hidden">{children}</div>

      {/* Collapse Toggle Button with Tooltip */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="absolute right-[-12px] top-[50%] z-10 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border bg-background shadow hover:bg-accent"
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>{isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
