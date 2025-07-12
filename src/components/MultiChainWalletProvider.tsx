'use client';
import { FC, ReactNode } from 'react';
import { SolanaProvider } from './SolanaProvider';
import { HyperLiquidProvider } from './HyperLiquidProvider';

interface MultiChainWalletProviderProps {
  children: ReactNode;
}

export const MultiChainWalletProvider: FC<MultiChainWalletProviderProps> = ({ children }) => {
  return (
    <SolanaProvider>
      <HyperLiquidProvider>
        {children}
      </HyperLiquidProvider>
    </SolanaProvider>
  );
};

export default MultiChainWalletProvider;