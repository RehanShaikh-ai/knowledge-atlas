import React from 'react';
import { RootLayout } from '@/layouts/RootLayout';
import { HomePage } from '@/pages/HomePage';
import { useHealth } from '@/hooks/useHealth';

export const App: React.FC = () => {
  const { status, checkHealth } = useHealth(15000);

  return (
    <RootLayout healthStatus={status} onRefreshHealth={checkHealth}>
      <HomePage healthStatus={status} onRefreshHealth={checkHealth} />
    </RootLayout>
  );
};
