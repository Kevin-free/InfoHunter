'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs } from '@/components/ui/tabs';
import { Suspense } from 'react';

export function TabWrapper({
  children,
  basePath,
  defaultTab,
  defaultView = 'list'
}: {
  children: React.ReactNode;
  basePath: string;
  defaultTab: string;
  defaultView?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab') ?? defaultTab;

  const handleValueChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === 'list' || value === 'grid') {
      params.set('view', value);
    } else {
      params.set('tab', value);
      params.set('offset', '0');
    }
    router.push(`${basePath}?${params.toString()}`);
  };

  return (
    <Tabs onValueChange={handleValueChange} value={currentTab}>
      {children}
    </Tabs>
  );
}
