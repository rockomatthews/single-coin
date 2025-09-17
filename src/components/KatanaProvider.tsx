'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ethers } from 'ethers';
import { getKatanaProvider, KATANA_CONFIG } from '@/utils/katana';

interface KatanaContextType {
  connected: boolean;
  address: string | null;
  signer: ethers.JsonRpcSigner | null;
  provider: ethers.BrowserProvider | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  error: string | null;
}

const KatanaContext = createContext<KatanaContextType | undefined>(undefined);

interface KatanaProviderProps {
  children: ReactNode;
}

export function KatanaProvider({ children }: KatanaProviderProps) {
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkConnection();

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
    window.location.reload();
  };

  const checkConnection = async () => {
    try {
      const prov = await getKatanaProvider();
      if (!prov) return;
      const accounts = await prov.listAccounts();
      if (accounts.length === 0) return;

      const s = await prov.getSigner();
      const addr = await s.getAddress();
      const network = await prov.getNetwork();
      const desired = KATANA_CONFIG.chainId ? BigInt(KATANA_CONFIG.chainId) : undefined;
      if (!desired || network.chainId === desired) {
        setProvider(prov);
        setSigner(s as ethers.JsonRpcSigner);
        setAddress(addr);
        setConnected(true);
        setError(null);
      }
    } catch (e) {
      console.error('Error checking Katana connection:', e);
    }
  };

  const connect = async () => {
    try {
      setError(null);
      const prov = await getKatanaProvider();
      if (!prov) throw new Error('MetaMask is not installed.');

      await prov.send('eth_requestAccounts', []);
      const net = await prov.getNetwork();
      const desired = KATANA_CONFIG.chainId ? BigInt(KATANA_CONFIG.chainId) : undefined;
      if (desired && net.chainId !== desired) {
        // getKatanaProvider attempts switch/add already, so just re-fetch if mismatched
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      const s = await prov.getSigner();
      const addr = await s.getAddress();
      setProvider(prov);
      setSigner(s as ethers.JsonRpcSigner);
      setAddress(addr);
      setConnected(true);
      console.log('✅ Connected to Katana with MetaMask:', addr);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to connect to Katana';
      setError(msg);
      console.error('Katana connection error:', e);
      throw e;
    }
  };

  const disconnect = () => {
    setConnected(false);
    setAddress(null);
    setSigner(null);
    setProvider(null);
    setError(null);
    console.log('Disconnected from Katana');
  };

  const value: KatanaContextType = {
    connected,
    address,
    signer,
    provider,
    connect,
    disconnect,
    error,
  };

  return (
    <KatanaContext.Provider value={value}>
      {children}
    </KatanaContext.Provider>
  );
}

export function useKatana(): KatanaContextType {
  const context = useContext(KatanaContext);
  if (context === undefined) {
    throw new Error('useKatana must be used within a KatanaProvider');
  }
  return context;
}

declare global {
  interface Window {
    ethereum?: any;
  }
}


