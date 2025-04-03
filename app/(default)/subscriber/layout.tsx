'use client';

import React from 'react';

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="p-6">
      <div className="mx-auto max-w-7xl">{children}</div>
    </div>
  );
}
