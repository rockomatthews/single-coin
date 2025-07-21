'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';

interface BaseContextType {
  connected: boolean;
  address: string | null;
  signer: ethers.JsonRpcSigner | null;
  provider: ethers.BrowserProvider | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  error: string | null;
}

const BaseContext = createContext<BaseContextType | undefined>(undefined);

interface BaseProviderProps {
  children: ReactNode;
}

export function BaseProvider({ children }: BaseProviderProps) {
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check if already connected on mount
  useEffect(() => {
    checkConnection();
    
    // Listen for account changes
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      disconnect();
    } else {
      setAddress(accounts[0]);
    }
  };

  const handleChainChanged = () => {
    // Reload the page when chain changes
    window.location.reload();
  };

  const checkConnection = async () => {
    try {
      if (typeof window !== 'undefined' && window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        
        if (accounts.length > 0) {
          const signer = await provider.getSigner();
          const address = await signer.getAddress();
          
          // Check if on BASE network (chain ID 8453)
          const network = await provider.getNetwork();
          if (network.chainId === BigInt(8453)) { // BASE mainnet
            setProvider(provider);
            setSigner(signer);
            setAddress(address);
            setConnected(true);
            setError(null);
          }
        }
      }
    } catch (error) {
      console.error('Error checking BASE connection:', error);
    }
  };

  const connect = async () => {
    try {
      setError(null);
      
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed. Please install MetaMask to use BASE.');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // Request account access
      await provider.send('eth_requestAccounts', []);
      
      // Check if on BASE network
      const network = await provider.getNetwork();
      
      if (network.chainId !== BigInt(8453)) {
        // Try to switch to BASE
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x2105' }], // BASE mainnet (8453 in hex)
          });
        } catch (switchError: any) {
          // Network not added, add it
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0x2105',
                chainName: 'Base Mainnet',
                nativeCurrency: {
                  name: 'Ethereum',
                  symbol: 'ETH',
                  decimals: 18,
                },
                rpcUrls: ['https://mainnet.base.org/'],
                blockExplorerUrls: ['https://basescan.org/'],
              }],
            });
          } else {
            throw switchError;
          }
        }
      }
      
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      
      setProvider(provider);
      setSigner(signer);
      setAddress(address);
      setConnected(true);
      
      console.log('✅ Connected to BASE with MetaMask:', address);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect to BASE';
      setError(errorMessage);
      console.error('BASE connection error:', error);
      throw error;
    }
  };

  const disconnect = () => {
    setConnected(false);
    setAddress(null);
    setSigner(null);
    setProvider(null);
    setError(null);
    console.log('Disconnected from BASE');
  };

  const value: BaseContextType = {
    connected,
    address,
    signer,
    provider,
    connect,
    disconnect,
    error,
  };

  return (
    <BaseContext.Provider value={value}>
      {children}
    </BaseContext.Provider>
  );
}

export function useBase(): BaseContextType {
  const context = useContext(BaseContext);
  if (context === undefined) {
    throw new Error('useBase must be used within a BaseProvider');
  }
  return context;
}

// Global type for window.ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}