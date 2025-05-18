import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import { FC, ReactNode, useMemo } from 'react';

// Import the wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css';

interface SolanaProviderProps {
  children: ReactNode;
}

export const SolanaProvider: FC<SolanaProviderProps> = ({ children }) => {
  // Set network based on environment variable, defaulting to devnet
  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK as WalletAdapterNetwork || WalletAdapterNetwork.Devnet;
  
  // Custom RPC endpoint or fallback to default
  const endpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl(network);

  // Initialize wallet adapters
  const wallets = useMemo(() => [
    new PhantomWalletAdapter(),
    // Add other wallet adapters as needed here
  ], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default SolanaProvider; 