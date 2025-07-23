'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';

interface BnbContextType {
  connected: boolean;
  address: string | null;
  signer: ethers.JsonRpcSigner | null;
  provider: ethers.BrowserProvider | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  error: string | null;
}

const BnbContext = createContext<BnbContextType | undefined>(undefined);

interface BnbProviderProps {
  children: ReactNode;
}

export function BnbProvider({ children }: BnbProviderProps) {
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
          
          // Check if on BNB Chain network
          const network = await provider.getNetwork();
          if (network.chainId === BigInt(56)) { // BNB Chain mainnet
            setProvider(provider);
            setSigner(signer);
            setAddress(address);
            setConnected(true);
            setError(null);
          }
        }
      }
    } catch (error) {
      console.error('Error checking BNB Chain connection:', error);
    }
  };

  const connect = async () => {
    try {
      setError(null);
      
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed. Please install MetaMask to use BNB Chain.');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // Request account access
      await provider.send('eth_requestAccounts', []);
      
      // Check if on BNB Chain network
      const network = await provider.getNetwork();
      
      if (network.chainId !== BigInt(56)) {
        // Try to switch to BNB Chain
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x38' }], // BNB Chain mainnet
          });
        } catch (switchError: any) {
          // Network not added, add it
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0x38',
                chainName: 'BNB Smart Chain',
                nativeCurrency: {
                  name: 'BNB',
                  symbol: 'BNB',
                  decimals: 18,
                },
                rpcUrls: ['https://bsc-dataseed1.binance.org/'],
                blockExplorerUrls: ['https://bscscan.com/'],
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
      
      console.log('✅ Connected to BNB Chain with MetaMask:', address);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect to BNB Chain';
      setError(errorMessage);
      console.error('BNB Chain connection error:', error);
      throw error;
    }
  };

  const disconnect = () => {
    setConnected(false);
    setAddress(null);
    setSigner(null);
    setProvider(null);
    setError(null);
    console.log('Disconnected from BNB Chain');
  };

  const value: BnbContextType = {
    connected,
    address,
    signer,
    provider,
    connect,
    disconnect,
    error,
  };

  return (
    <BnbContext.Provider value={value}>
      {children}
    </BnbContext.Provider>
  );
}

export function useBnb(): BnbContextType {
  const context = useContext(BnbContext);
  if (context === undefined) {
    throw new Error('useBnb must be used within a BnbProvider');
  }
  return context;
}

// Global type for window.ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}