'use client';
import { FC, ReactNode } from 'react';
import { SolanaProvider } from './SolanaProvider';
import { HyperLiquidProvider } from './HyperLiquidProvider';
import { PolygonProvider } from './PolygonProvider';
import { BaseProvider } from './BaseProvider';
import { RskProvider } from './RskProvider';
import { ArbitrumProvider } from './ArbitrumProvider';

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
              <ArbitrumProvider>
                {children}
              </ArbitrumProvider>
            </RskProvider>
          </BaseProvider>
        </PolygonProvider>
      </HyperLiquidProvider>
    </SolanaProvider>
  );
};

export default MultiChainWalletProvider;