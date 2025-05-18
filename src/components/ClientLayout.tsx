'use client';

import dynamic from 'next/dynamic';
import { ReactNode } from 'react';

// Client-side only imports
const SolanaProvider = dynamic(() => import('@/components/SolanaProvider'), {
  ssr: false,
});

const Navigation = dynamic(() => import('@/components/Navigation'), {
  ssr: false,
});

interface ClientLayoutProps {
  children: ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <SolanaProvider>
      <Navigation />
      {children}
    </SolanaProvider>
  );
} 