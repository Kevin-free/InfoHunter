import { useState, useCallback } from 'react';
import { SortDirection } from '@/components/ui/sortable-table-header';
import { getQualityBadgeProps } from '../utils';

export function useTableSort<T>(initialData: T[]) {
  const [sortConfig, setSortConfig] = useState<{
    column: string;
    direction: SortDirection;
  }>({
    column: '',
    direction: null
  });

  const resetSort = useCallback(() => {
    setSortConfig({ column: '', direction: null });
  }, []);

  const getValueByPath = (obj: any, path: string) => {
    const value = path.split('.').reduce((acc, part) => {
      if (acc === null || acc === undefined) return acc;
      return acc[part];
    }, obj);
    return value;
  };

  const sortData = useCallback(
    (data: T[], column: string, direction: SortDirection) => {
      if (!direction) return data;

      return [...data].sort((a: any, b: any) => {
        if (column === 'qualityReports') {
          const aScore = getQualityBadgeProps(a[column]).score || 0;
          const bScore = getQualityBadgeProps(b[column]).score || 0;
          return direction === 'asc' ? aScore - bScore : bScore - aScore;
        }

        const aValue = getValueByPath(a, column);
        const bValue = getValueByPath(b, column);

        // Handle dates
        if (aValue instanceof Date && bValue instanceof Date) {
          return direction === 'asc'
            ? aValue.getTime() - bValue.getTime()
            : bValue.getTime() - aValue.getTime();
        }

        // Handle numbers
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return direction === 'asc' ? aValue - bValue : bValue - aValue;
        }

        // Handle strings
        const aString = String(aValue || '').toLowerCase();
        const bString = String(bValue || '').toLowerCase();
        return direction === 'asc'
          ? aString.localeCompare(bString)
          : bString.localeCompare(aString);
      });
    },
    []
  );

  const handleSort = useCallback(
    (data: T[], column: string, direction: SortDirection) => {
      setSortConfig({ column, direction });
      return sortData(data, column, direction);
    },
    [sortData]
  );

  return {
    sortConfig,
    handleSort,
    resetSort
  };
}
