'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getJwt } from '@/components/lib/networkUtils';
import { LoginPath } from '../../lib/constants';
import { Spinner } from 'theme-ui';

const PUBLIC_PATHS = [LoginPath, '/signup', '/email-link'];

interface AuthInitProps {
  children: React.ReactNode;
}

export default function AuthInit({ children }: AuthInitProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const jwt = getJwt();
        const isPublicPath = PUBLIC_PATHS.includes(pathname);

        if (!jwt && !isPublicPath) {
          await router.replace(LoginPath);
          return;
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Auth initialization failed:', error);
        setIsLoading(false);
      }
    };

    initAuth();
  }, [router, pathname]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
        <div className="flex h-full w-full items-center justify-center">
          <Spinner size={24} />
        </div>
      </div>
    );
  }

  return children;
}
