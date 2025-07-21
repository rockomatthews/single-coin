'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { connectTronLink, getTronNetworkStatus, checkTronLinkInstalled } from '@/utils/tron';

interface TronContextType {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  account: string | null;
  balance: string | null;
  
  // Functions
  connect: () => Promise<void>;
  disconnect: () => void;
  
  // TronWeb access
  tronWeb: any | null;
}

const TronContext = createContext<TronContextType | undefined>(undefined);

interface TronProviderProps {
  children: ReactNode;
}

export function TronProvider({ children }: TronProviderProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [tronWeb, setTronWeb] = useState<any | null>(null);

  // Check if already connected on mount
  useEffect(() => {
    checkConnection();
    setupEventListeners();
  }, []);

  // Update balance periodically
  useEffect(() => {
    if (isConnected && account) {
      const interval = setInterval(async () => {
        try {
          const status = await getTronNetworkStatus();
          if (status.balance) {
            setBalance(status.balance);
          }
        } catch (error) {
          console.error('Failed to update TRON balance:', error);
        }
      }, 30000); // Update every 30 seconds

      return () => clearInterval(interval);
    }
  }, [isConnected, account]);

  const checkConnection = async () => {
    if (typeof window === 'undefined') return;

    try {
      if (checkTronLinkInstalled() && (window as any).tronWeb?.defaultAddress?.base58) {
        const status = await getTronNetworkStatus();
        if (status.isConnected) {
          setIsConnected(true);
          setAccount(status.address);
          setBalance(status.balance);
          setTronWeb((window as any).tronWeb);
        }
      }
    } catch (error) {
      console.error('Failed to check TRON connection:', error);
    }
  };

  const setupEventListeners = () => {
    if (typeof window === 'undefined' || !checkTronLinkInstalled()) return;

    // TronLink account changed
    (window as any).addEventListener('message', (e: MessageEvent) => {
      if (e.data.message && e.data.message.action === 'accountsChanged') {
        if (e.data.message.data.address) {
          // Account changed
          connect();
        } else {
          // Account disconnected
          disconnect();
        }
      }
      
      if (e.data.message && e.data.message.action === 'connectWeb') {
        // TronWeb connected
        connect();
      }
      
      if (e.data.message && e.data.message.action === 'disconnectWeb') {
        // TronWeb disconnected
        disconnect();
      }
    });
  };

  const connect = async () => {
    if (isConnecting) return;
    
    setIsConnecting(true);
    try {
      const connection = await connectTronLink();
      
      if (!connection.success) {
        throw new Error(connection.error || 'Failed to connect to TronLink');
      }

      const status = await getTronNetworkStatus();
      
      setIsConnected(true);
      setAccount(status.address);
      setBalance(status.balance);
      setTronWeb((window as any).tronWeb);

      console.log('✅ Connected to TRON:', status.address);
    } catch (error) {
      console.error('Failed to connect to TRON:', error);
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
    setTronWeb(null);
    console.log('🔌 Disconnected from TRON');
  };

  const contextValue: TronContextType = {
    isConnected,
    isConnecting,
    account,
    balance,
    connect,
    disconnect,
    tronWeb,
  };

  return (
    <TronContext.Provider value={contextValue}>
      {children}
    </TronContext.Provider>
  );
}

export function useTron(): TronContextType {
  const context = useContext(TronContext);
  if (context === undefined) {
    throw new Error('useTron must be used within a TronProvider');
  }
  return context;
}

export default TronProvider;