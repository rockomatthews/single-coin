'use client';
import { FC, ReactNode } from 'react';
import { SolanaProvider } from './SolanaProvider';
import { HyperLiquidProvider } from './HyperLiquidProvider';
import { PolygonProvider } from './PolygonProvider';
import { BaseProvider } from './BaseProvider';
import { RskProvider } from './RskProvider';

interface MultiChainWalletProviderProps {
  children: ReactNode;
}

export const MultiChainWalletProvider: FC<MultiChainWalletProviderProps> = ({ children }) => {
  return (
    <SolanaProvider>
      <HyperLiquidProvider>
        <PolygonProvider>
          <BaseProvider>
            <RskProvider>
              {children}
            </RskProvider>
          </BaseProvider>
        </PolygonProvider>
      </HyperLiquidProvider>
    </SolanaProvider>
  );
};

export default MultiChainWalletProvider;