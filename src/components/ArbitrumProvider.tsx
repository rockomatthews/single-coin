'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';
import { getArbitrumProvider, switchToArbitrum, ARBITRUM_CONFIG } from '@/utils/arbitrum';

interface ArbitrumContextType {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  account: string | null;
  balance: string | null;
  
  // Network state
  chainId: number | null;
  blockNumber: number | null;
  
  // Functions
  connect: () => Promise<void>;
  disconnect: () => void;
  switchNetwork: () => Promise<boolean>;
  
  // Provider access
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
}

const ArbitrumContext = createContext<ArbitrumContextType | undefined>(undefined);

interface ArbitrumProviderProps {
  children: ReactNode;
}

export function ArbitrumProvider({ children }: ArbitrumProviderProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [blockNumber, setBlockNumber] = useState<number | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);

  // Check if already connected on mount
  useEffect(() => {
    checkConnection();
    setupEventListeners();
  }, []);

  // Update balance and block number periodically
  useEffect(() => {
    if (isConnected && provider) {
      const interval = setInterval(async () => {
        try {
          const latestBlockNumber = await provider.getBlockNumber();
          setBlockNumber(latestBlockNumber);
          
          if (account) {
            const latestBalance = await provider.getBalance(account);
            setBalance(ethers.formatEther(latestBalance));
          }
        } catch (error) {
          console.error('Failed to update Arbitrum data:', error);
        }
      }, 15000); // Update every 15 seconds

      return () => clearInterval(interval);
    }
  }, [isConnected, provider, account]);

  const checkConnection = async () => {
    if (typeof window === 'undefined' || !window.ethereum) return;

    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
        
        // Only auto-connect if on Arbitrum network
        if (parseInt(currentChainId, 16) === ARBITRUM_CONFIG.chainId) {
          await connectWallet();
        }
      }
    } catch (error) {
      console.error('Failed to check Arbitrum connection:', error);
    }
  };

  const setupEventListeners = () => {
    if (typeof window === 'undefined' || !window.ethereum) return;

    // Account changed
    window.ethereum.on('accountsChanged', (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else if (chainId === ARBITRUM_CONFIG.chainId) {
        // Only reconnect if on Arbitrum
        connectWallet();
      }
    });

    // Chain changed
    window.ethereum.on('chainChanged', (newChainId: string) => {
      const newChainIdNum = parseInt(newChainId, 16);
      setChainId(newChainIdNum);
      
      if (newChainIdNum === ARBITRUM_CONFIG.chainId) {
        // Switched to Arbitrum, try to connect
        connectWallet();
      } else {
        // Switched away from Arbitrum, disconnect
        disconnect();
      }
    });

    // Disconnect event
    window.ethereum.on('disconnect', () => {
      disconnect();
    });
  };

  const connectWallet = async () => {
    try {
      const arbitrumProvider = await getArbitrumProvider();
      const arbitrumSigner = await arbitrumProvider.getSigner();
      const userAddress = await arbitrumSigner.getAddress();
      const userBalance = await arbitrumProvider.getBalance(userAddress);
      const network = await arbitrumProvider.getNetwork();
      const currentBlockNumber = await arbitrumProvider.getBlockNumber();

      setProvider(arbitrumProvider);
      setSigner(arbitrumSigner);
      setAccount(userAddress);
      setBalance(ethers.formatEther(userBalance));
      setChainId(Number(network.chainId));
      setBlockNumber(currentBlockNumber);
      setIsConnected(true);

      console.log('✅ Connected to Arbitrum:', userAddress);
    } catch (error) {
      console.error('❌ Failed to connect to Arbitrum:', error);
      throw error;
    }
  };

  const connect = async () => {
    if (isConnecting) return;
    
    setIsConnecting(true);
    try {
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('MetaMask not found. Please install MetaMask to use Arbitrum features.');
      }

      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // Switch to Arbitrum network
      const switched = await switchToArbitrum();
      if (!switched) {
        throw new Error('Failed to switch to Arbitrum network');
      }

      // Connect wallet
      await connectWallet();
    } catch (error) {
      console.error('Failed to connect to Arbitrum:', error);
      setIsConnected(false);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setIsConnected(false);
    setAccount(null);
    setBalance(null);
    setChainId(null);
    setBlockNumber(null);
    setProvider(null);
    setSigner(null);
    console.log('🔌 Disconnected from Arbitrum');
  };

  const switchNetwork = async (): Promise<boolean> => {
    try {
      return await switchToArbitrum();
    } catch (error) {
      console.error('Failed to switch to Arbitrum network:', error);
      return false;
    }
  };

  const contextValue: ArbitrumContextType = {
    isConnected,
    isConnecting,
    account,
    balance,
    chainId,
    blockNumber,
    connect,
    disconnect,
    switchNetwork,
    provider,
    signer,
  };

  return (
    <ArbitrumContext.Provider value={contextValue}>
      {children}
    </ArbitrumContext.Provider>
  );
}

export function useArbitrum(): ArbitrumContextType {
  const context = useContext(ArbitrumContext);
  if (context === undefined) {
    throw new Error('useArbitrum must be used within an ArbitrumProvider');
  }
  return context;
}

export default ArbitrumProvider;