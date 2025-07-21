'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';
import { getRskProvider, connectRskWallet, RSK_CONFIG } from '@/utils/rsk';

interface RskContextType {
  connected: boolean;
  address: string | null;
  signer: ethers.JsonRpcSigner | null;
  provider: ethers.BrowserProvider | null;
  balance: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  error: string | null;
  chainId: number | null;
}

const RskContext = createContext<RskContextType | undefined>(undefined);

export function useRsk(): RskContextType {
  const context = useContext(RskContext);
  if (context === undefined) {
    throw new Error('useRsk must be used within a RskProvider');
  }
  return context;
}

interface RskProviderProps {
  children: ReactNode;
}

export function RskProvider({ children }: RskProviderProps) {
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);

  // Check if already connected on mount
  useEffect(() => {
    checkConnection();
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnect();
        } else {
          setAddress(accounts[0]);
          updateBalance(accounts[0]);
        }
      };

      const handleChainChanged = (chainId: string) => {
        const newChainId = parseInt(chainId, 16);
        setChainId(newChainId);
        
        // If switched away from RSK, disconnect
        if (newChainId !== RSK_CONFIG.chainId) {
          setConnected(false);
          setError('Please switch to RSK Mainnet');
        } else {
          setError(null);
          if (address) {
            setConnected(true);
          }
        }
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum?.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [address]);

  const checkConnection = async () => {
    try {
      if (typeof window === 'undefined' || !window.ethereum) {
        return;
      }

      const provider = await getRskProvider();
      if (!provider) return;

      // Check if accounts are already connected
      const accounts = await provider.send('eth_accounts', []);
      if (accounts.length > 0) {
        const network = await provider.getNetwork();
        if (network.chainId === BigInt(RSK_CONFIG.chainId)) {
          const signer = await provider.getSigner();
          setProvider(provider);
          setSigner(signer);
          setAddress(accounts[0]);
          setChainId(Number(network.chainId));
          setConnected(true);
          updateBalance(accounts[0]);
        }
      }
    } catch (error) {
      console.error('Error checking RSK connection:', error);
    }
  };

  const updateBalance = async (userAddress: string) => {
    try {
      if (provider) {
        const balance = await provider.getBalance(userAddress);
        setBalance(ethers.formatEther(balance));
      }
    } catch (error) {
      console.error('Error fetching RSK balance:', error);
    }
  };

  const connect = async () => {
    try {
      setError(null);
      
      const result = await connectRskWallet();
      
      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.signer && result.address) {
        const provider = await getRskProvider();
        if (provider) {
          const network = await provider.getNetwork();
          
          setProvider(provider);
          setSigner(result.signer);
          setAddress(result.address);
          setChainId(Number(network.chainId));
          setConnected(true);
          updateBalance(result.address);
          
          console.log('✅ Connected to RSK:', {
            address: result.address,
            chainId: Number(network.chainId),
          });
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect to RSK';
      setError(errorMessage);
      console.error('RSK connection error:', error);
    }
  };

  const disconnect = () => {
    setConnected(false);
    setAddress(null);
    setSigner(null);
    setProvider(null);
    setBalance(null);
    setError(null);
    setChainId(null);
    console.log('👋 Disconnected from RSK');
  };

  const value: RskContextType = {
    connected,
    address,
    signer,
    provider,
    balance,
    connect,
    disconnect,
    error,
    chainId,
  };

  return (
    <RskContext.Provider value={value}>
      {children}
    </RskContext.Provider>
  );
}

export default RskProvider;