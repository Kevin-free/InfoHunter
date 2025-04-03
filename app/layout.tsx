'use client';

import './globals.css';
import { Toaster } from 'react-hot-toast';
import AuthInit from '@/components/ui/auth-init';
import { Sidebar } from '@/components/shared/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { TelegramSyncManager } from '@/components/TelegramSyncManager';

// 定义不需要显示 Sidebar 的路由
const noSidebarRoutes = ['/signin', '/signup', '/email-link', '/contact'];

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const showSidebar = !noSidebarRoutes.some((route) =>
    pathname?.startsWith(route)
  );
  const [queryClient] = useState(() => new QueryClient());

  return (
    <html lang="en">
      <body className="bg-background overflow-hidden">
        <Toaster />
        <AuthInit>
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <div className="flex h-screen w-full">
                {showSidebar && <Sidebar />}
                <main
                  className={cn(
                    'overflow-y-auto',
                    showSidebar ? 'flex-1' : 'w-full'
                  )}
                >
                  {children}
                </main>
              </div>
            </TooltipProvider>
          </QueryClientProvider>
        </AuthInit>
        <TelegramSyncManager />
      </body>
    </html>
  );
}
