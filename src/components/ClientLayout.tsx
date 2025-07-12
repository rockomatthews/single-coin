'use client';

import dynamic from 'next/dynamic';
import { ReactNode } from 'react';
import { Box } from '@mui/material';

// Client-side only imports
const MultiChainWalletProvider = dynamic(() => import('@/components/MultiChainWalletProvider'), {
  ssr: false,
});

const Navigation = dynamic(() => import('@/components/Navigation'), {
  ssr: false,
});

const Footer = dynamic(() => import('@/components/Footer'), {
  ssr: false,
});

interface ClientLayoutProps {
  children: ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <MultiChainWalletProvider>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navigation />
        <Box component="main" sx={{ flexGrow: 1 }}>
          {children}
        </Box>
        <Footer />
      </Box>
    </MultiChainWalletProvider>
  );
} 