import * as React from 'react';
import { TableHead } from './table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from './dropdown-menu';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SortDirection = 'asc' | 'desc' | null;

interface SortableTableHeaderProps {
  column: string;
  label: string;
  sortDirection: SortDirection;
  onSort: (column: string, direction: SortDirection) => void;
}

export function SortableTableHeader({
  column,
  label,
  sortDirection,
  onSort
}: SortableTableHeaderProps) {
  return (
    <TableHead>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-1 hover:bg-muted/50 rounded px-2 py-1">
          <span>{label}</span>
          {sortDirection === 'asc' && <ArrowUp className="h-4 w-4" />}
          {sortDirection === 'desc' && <ArrowDown className="h-4 w-4" />}
          {sortDirection === null && (
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem
            onClick={() => onSort(column, 'asc')}
            className={cn(sortDirection === 'asc' && 'bg-accent')}
          >
            <ArrowUp className="mr-2 h-4 w-4" />
            Sort Ascending
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onSort(column, 'desc')}
            className={cn(sortDirection === 'desc' && 'bg-accent')}
          >
            <ArrowDown className="mr-2 h-4 w-4" />
            Sort Descending
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onSort(column, null)}
            className={cn(sortDirection === null && 'bg-accent')}
          >
            Remove Sort
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </TableHead>
  );
}
