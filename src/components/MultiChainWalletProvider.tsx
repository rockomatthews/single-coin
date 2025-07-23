'use client';
import { FC, ReactNode } from 'react';
import { SolanaProvider } from './SolanaProvider';
import { HyperLiquidProvider } from './HyperLiquidProvider';
import { PolygonProvider } from './PolygonProvider';
import { BaseProvider } from './BaseProvider';
import { Brc20Provider } from './Brc20Provider';
import { ArbitrumProvider } from './ArbitrumProvider';
import { TronProvider } from './TronProvider';
import { BnbProvider } from './BnbProvider';

interface MultiChainWalletProviderProps {
  children: ReactNode;
}

export const MultiChainWalletProvider: FC<MultiChainWalletProviderProps> = ({ children }) => {
  return (
    <SolanaProvider>
      <HyperLiquidProvider>
        <PolygonProvider>
          <BaseProvider>
            <BnbProvider>
              <Brc20Provider>
                <ArbitrumProvider>
                  <TronProvider>
                    {children}
                  </TronProvider>
                </ArbitrumProvider>
              </Brc20Provider>
            </BnbProvider>
          </BaseProvider>
        </PolygonProvider>
      </HyperLiquidProvider>
    </SolanaProvider>
  );
};

export default MultiChainWalletProvider;