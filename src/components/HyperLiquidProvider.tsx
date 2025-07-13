'use client';
import { createContext, useContext, useState, useEffect, ReactNode, FC } from 'react';
import detectEthereumProvider from '@metamask/detect-provider';
import { ethers } from 'ethers';

// HYPER LIQUID Mainnet Configuration
export const HYPERLIQUID_NETWORK = {
  chainId: '0x66eed', // 421037 in hex (mainnet)
  chainName: 'HyperLiquid',
  nativeCurrency: {
    name: 'ETH',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: ['https://api.hyperliquid.xyz/evm'],
  blockExplorerUrls: ['https://explorer.hyperliquid.xyz'],
};

interface HyperLiquidWallet {
  address: string | null;
  connected: boolean;
  connecting: boolean;
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  signMessage: (message: string) => Promise<string>;
  sendTransaction: (transaction: any) => Promise<string>;
}

const HyperLiquidContext = createContext<HyperLiquidWallet | null>(null);

interface HyperLiquidProviderProps {
  children: ReactNode;
}

export const HyperLiquidProvider: FC<HyperLiquidProviderProps> = ({ children }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const ethereumProvider = await detectEthereumProvider();
      if (ethereumProvider && (window as any).ethereum) {
        const accounts = await (window as any).ethereum.request({ 
          method: 'eth_accounts' 
        });
        
        if (accounts.length > 0) {
          const ethersProvider = new ethers.BrowserProvider((window as any).ethereum);
          const ethSigner = await ethersProvider.getSigner();
          
          setProvider(ethersProvider);
          setSigner(ethSigner);
          setAddress(accounts[0]);
          setConnected(true);
        }
      }
    } catch (error) {
      console.error('Failed to check wallet connection:', error);
    }
  };

  const connect = async () => {
    if (connecting) return;
    
    setConnecting(true);
    try {
      const ethereumProvider = await detectEthereumProvider();
      
      if (!ethereumProvider) {
        throw new Error('MetaMask not detected. Please install MetaMask to use HYPER LIQUID features.');
      }

      const accounts = await (window as any).ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      // Switch to HYPER LIQUID mainnet
      try {
        await (window as any).ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: HYPERLIQUID_NETWORK.chainId }],
        });
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          await (window as any).ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [HYPERLIQUID_NETWORK],
          });
        } else {
          throw switchError;
        }
      }

      const ethersProvider = new ethers.BrowserProvider((window as any).ethereum);
      const ethSigner = await ethersProvider.getSigner();

      setProvider(ethersProvider);
      setSigner(ethSigner);
      setAddress(accounts[0]);
      setConnected(true);

    } catch (error: any) {
      console.error('Failed to connect wallet:', error);
      throw new Error(error.message || 'Failed to connect wallet');
    } finally {
      setConnecting(false);
    }
  };

  const disconnect = () => {
    setProvider(null);
    setSigner(null);
    setAddress(null);
    setConnected(false);
  };

  const signMessage = async (message: string): Promise<string> => {
    if (!signer) {
      throw new Error('Wallet not connected');
    }
    
    try {
      return await signer.signMessage(message);
    } catch (error) {
      console.error('Failed to sign message:', error);
      throw new Error('Failed to sign message');
    }
  };

  const sendTransaction = async (transaction: any): Promise<string> => {
    if (!signer) {
      throw new Error('Wallet not connected');
    }
    
    try {
      const tx = await signer.sendTransaction(transaction);
      return tx.hash;
    } catch (error) {
      console.error('Failed to send transaction:', error);
      throw new Error('Failed to send transaction');
    }
  };

  useEffect(() => {
    if ((window as any).ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnect();
        } else if (accounts[0] !== address) {
          setAddress(accounts[0]);
        }
      };

      const handleChainChanged = () => {
        window.location.reload();
      };

      (window as any).ethereum.on('accountsChanged', handleAccountsChanged);
      (window as any).ethereum.on('chainChanged', handleChainChanged);

      return () => {
        if ((window as any).ethereum?.removeListener) {
          (window as any).ethereum.removeListener('accountsChanged', handleAccountsChanged);
          (window as any).ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, [address]);

  const value: HyperLiquidWallet = {
    address,
    connected,
    connecting,
    provider,
    signer,
    connect,
    disconnect,
    signMessage,
    sendTransaction,
  };

  return (
    <HyperLiquidContext.Provider value={value}>
      {children}
    </HyperLiquidContext.Provider>
  );
};

export const useHyperLiquid = (): HyperLiquidWallet => {
  const context = useContext(HyperLiquidContext);
  if (!context) {
    throw new Error('useHyperLiquid must be used within a HyperLiquidProvider');
  }
  return context;
};

export default HyperLiquidProvider;