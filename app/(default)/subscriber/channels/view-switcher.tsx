'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutGrid, List } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

interface ViewSwitcherProps {
  currentView: string;
  basePath?: string;
}

export function ViewSwitcher({
  currentView,
  basePath = '/subscriber/channels'
}: ViewSwitcherProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <Tabs
      value={currentView}
      onValueChange={(value) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('view', value);
        router.push(`${basePath}?${params.toString()}`);
      }}
    >
      <TabsList>
        <TabsTrigger value="list" className="px-3">
          <List className="h-4 w-4" />
        </TabsTrigger>
        <TabsTrigger value="grid" className="px-3">
          <LayoutGrid className="h-4 w-4" />
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
