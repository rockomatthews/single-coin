'use client';

import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import { FC, ReactNode, useMemo } from 'react';

// NO CSS import to avoid styling conflicts
// import '@solana/wallet-adapter-react-ui/styles.css';

interface SimplifiedWalletProviderProps {
  children: ReactNode;
}

/**
 * SIMPLIFIED WALLET PROVIDER
 * Minimal configuration to avoid triggering Phantom's malicious detection
 * Key differences:
 * 1. autoConnect={false} - no automatic connection attempts
 * 2. Only Phantom adapter - no multiple wallet confusion
 * 3. Minimal error handling
 * 4. No CSS imports
 */
export const SimplifiedWalletProvider: FC<SimplifiedWalletProviderProps> = ({ children }) => {
  const network = WalletAdapterNetwork.Mainnet;
  const endpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl(network);

  // Only include Phantom - avoid wallet detection complexity
  const wallets = useMemo(() => [
    new PhantomWalletAdapter(),
  ], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider 
        wallets={wallets} 
        autoConnect={false}  // KEY: No auto-connect
        onError={() => {}}   // Minimal error handling
      >
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default SimplifiedWalletProvider;