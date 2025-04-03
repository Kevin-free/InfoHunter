import { useState, useCallback } from 'react';

export type FilterConfig = Record<string, string>;

export function useTableFilter<T>(initialData: T[]) {
  const [filterConfig, setFilterConfig] = useState<FilterConfig>({});

  const resetFilter = useCallback(() => {
    setFilterConfig({});
  }, []);

  const handleFilter = useCallback((data: T[], filters: FilterConfig) => {
    return data?.filter((item) => {
      return Object.entries(filters).every(([key, value]) => {
        if (!value) return true;

        const getNestedValue = (obj: any, path: string) => {
          return path.split('.').reduce((acc, part) => {
            if (acc === null || acc === undefined) return '';
            return acc[part];
          }, obj);
        };

        const itemValue = String(getNestedValue(item, key) ?? '').toLowerCase();
        return itemValue.includes(value.toLowerCase());
      });
    });
  }, []);

  const updateFilter = useCallback((column: string, value: string) => {
    setFilterConfig((prev) => ({
      ...prev,
      [column]: value
    }));
  }, []);

  return {
    filterConfig,
    handleFilter,
    updateFilter,
    resetFilter
  };
}
