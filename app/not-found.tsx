'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useUserStore } from 'stores/userStore';

export default function NotFound() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);

  useEffect(() => {
    if (user?.role === 'publisher') {
      router.replace('/publisher/channels');
    } else if (user?.role === 'subscriber') {
      router.replace('/subscriber/channels');
    } else {
      router.replace('/signin');
    }
  }, [router, user?.role]);

  return null;
}
