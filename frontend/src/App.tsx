import React from 'react';
import { HomePage } from '@/pages/HomePage';
import { useHealth } from '@/hooks/useHealth';

export const App: React.FC = () => {
  const { status, checkHealth } = useHealth(15000);

  return <HomePage healthStatus={status} onRefreshHealth={checkHealth} />;
};
