'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';

interface PolygonContextType {
  connected: boolean;
  address: string | null;
  signer: ethers.JsonRpcSigner | null;
  provider: ethers.BrowserProvider | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  error: string | null;
}

const PolygonContext = createContext<PolygonContextType | undefined>(undefined);

interface PolygonProviderProps {
  children: ReactNode;
}

export function PolygonProvider({ children }: PolygonProviderProps) {
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
          
          // Check if on Polygon network
          const network = await provider.getNetwork();
          if (network.chainId === BigInt(137)) { // Polygon mainnet
            setProvider(provider);
            setSigner(signer);
            setAddress(address);
            setConnected(true);
            setError(null);
          }
        }
      }
    } catch (error) {
      console.error('Error checking Polygon connection:', error);
    }
  };

  const connect = async () => {
    try {
      setError(null);
      
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed. Please install MetaMask to use Polygon.');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // Request account access
      await provider.send('eth_requestAccounts', []);
      
      // Check if on Polygon network
      const network = await provider.getNetwork();
      
      if (network.chainId !== BigInt(137)) {
        // Try to switch to Polygon
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x89' }], // Polygon mainnet
          });
        } catch (switchError: any) {
          // Network not added, add it
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0x89',
                chainName: 'Polygon Mainnet',
                nativeCurrency: {
                  name: 'MATIC',
                  symbol: 'MATIC',
                  decimals: 18,
                },
                rpcUrls: ['https://polygon-rpc.com/'],
                blockExplorerUrls: ['https://polygonscan.com/'],
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
      
      console.log('✅ Connected to Polygon with MetaMask:', address);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect to Polygon';
      setError(errorMessage);
      console.error('Polygon connection error:', error);
      throw error;
    }
  };

  const disconnect = () => {
    setConnected(false);
    setAddress(null);
    setSigner(null);
    setProvider(null);
    setError(null);
    console.log('Disconnected from Polygon');
  };

  const value: PolygonContextType = {
    connected,
    address,
    signer,
    provider,
    connect,
    disconnect,
    error,
  };

  return (
    <PolygonContext.Provider value={value}>
      {children}
    </PolygonContext.Provider>
  );
}

export function usePolygon(): PolygonContextType {
  const context = useContext(PolygonContext);
  if (context === undefined) {
    throw new Error('usePolygon must be used within a PolygonProvider');
  }
  return context;
}

// Global type for window.ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}