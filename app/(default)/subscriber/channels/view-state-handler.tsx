'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export function ViewStateHandler({ basePath = '/subscriber/channels' }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateViewBasedOnWidth = () => {
    const width = window.innerWidth;
    const params = new URLSearchParams(searchParams.toString());
    params.set('view', width <= 768 ? 'grid' : 'list');
    router.replace(`${basePath}?${params.toString()}`);
  };

  useEffect(() => {
    // 初始化视图
    updateViewBasedOnWidth();

    // 监听窗口大小变化
    const handleResize = () => {
      updateViewBasedOnWidth();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [router, searchParams, basePath]);

  return null;
}
