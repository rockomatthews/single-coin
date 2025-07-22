'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { BITCOIN_WALLETS } from '@/utils/brc20';

interface Brc20ContextType {
  connected: boolean;
  address: string | null;
  walletType: 'unisat' | 'xverse' | 'okx' | 'hiro' | null;
  balance: number | null; // BTC balance in satoshis
  connect: (walletType?: 'unisat' | 'xverse' | 'okx' | 'hiro') => Promise<void>;
  disconnect: () => void;
  error: string | null;
  isSupported: boolean;
}

const Brc20Context = createContext<Brc20ContextType | undefined>(undefined);

interface Brc20ProviderProps {
  children: ReactNode;
}

export function Brc20Provider({ children }: Brc20ProviderProps) {
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<'unisat' | 'xverse' | 'okx' | 'hiro' | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  // Check if Bitcoin wallets are available
  useEffect(() => {
    checkWalletSupport();
    
    // Listen for wallet events if available
    if (typeof window !== 'undefined') {
      // Unisat wallet events
      if (window.unisat) {
        window.unisat.on('accountsChanged', handleAccountsChanged);
        window.unisat.on('networkChanged', handleNetworkChanged);
      }
      
      // Xverse wallet events (if available)
      if (window.XverseProviders?.BitcoinProvider) {
        // Xverse has different event handling
      }
      
      return () => {
        if (window.unisat) {
          window.unisat.removeListener('accountsChanged', handleAccountsChanged);
          window.unisat.removeListener('networkChanged', handleNetworkChanged);
        }
      };
    }
  }, []);

  const checkWalletSupport = () => {
    if (typeof window === 'undefined') return;
    
    const hasUnisat = !!window.unisat;
    const hasXverse = !!window.XverseProviders?.BitcoinProvider;
    const hasOkx = !!window.okxwallet?.bitcoin;
    const hasHiro = !!window.HiroWalletProvider;
    
    setIsSupported(hasUnisat || hasXverse || hasOkx || hasHiro);
    
    if (hasUnisat) {
      checkUnisatConnection();
    }
  };

  const checkUnisatConnection = async () => {
    try {
      if (window.unisat) {
        const accounts = await window.unisat.getAccounts();
        if (accounts.length > 0) {
          setConnected(true);
          setAddress(accounts[0]);
          setWalletType('unisat');
          updateBalance(accounts[0]);
        }
      }
    } catch (error) {
      console.error('Error checking Unisat connection:', error);
    }
  };

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      disconnect();
    } else {
      setAddress(accounts[0]);
      updateBalance(accounts[0]);
    }
  };

  const handleNetworkChanged = (network: string) => {
    console.log('Bitcoin network changed:', network);
    // Reload if switched away from mainnet
    if (network !== 'livenet' && network !== 'mainnet') {
      disconnect();
      setError('Please switch to Bitcoin mainnet');
    } else {
      setError(null);
    }
  };

  const updateBalance = async (bitcoinAddress: string) => {
    try {
      if (walletType === 'unisat' && window.unisat) {
        const balance = await window.unisat.getBalance();
        setBalance(balance.total);
      }
      // Add balance fetching for other wallets as needed
    } catch (error) {
      console.error('Error fetching Bitcoin balance:', error);
    }
  };

  const connectUnisat = async () => {
    try {
      if (!window.unisat) {
        throw new Error('Unisat wallet is not installed. Please install Unisat to create BRC-20 tokens.');
      }

      const accounts = await window.unisat.requestAccounts();
      if (accounts.length === 0) {
        throw new Error('No Bitcoin accounts found');
      }

      // Switch to mainnet if needed
      const network = await window.unisat.getNetwork();
      if (network !== 'livenet') {
        await window.unisat.switchNetwork('livenet');
      }

      setConnected(true);
      setAddress(accounts[0]);
      setWalletType('unisat');
      setError(null);
      
      updateBalance(accounts[0]);
      
      console.log('✅ Connected to Unisat:', accounts[0]);
    } catch (error) {
      throw error;
    }
  };

  const connectXverse = async () => {
    try {
      if (!window.XverseProviders?.BitcoinProvider) {
        throw new Error('Xverse wallet is not installed. Please install Xverse to create BRC-20 tokens.');
      }

      const getAddressOptions = {
        payload: {
          purposes: ['ordinals', 'payment'],
          message: 'Connect to create BRC-20 tokens',
          network: {
            type: 'Mainnet'
          },
        },
        onFinish: (response: any) => {
          setConnected(true);
          setAddress(response.addresses[0].address);
          setWalletType('xverse');
          setError(null);
          console.log('✅ Connected to Xverse:', response.addresses[0].address);
        },
        onCancel: () => {
          throw new Error('Xverse connection cancelled');
        },
      };

      await window.XverseProviders.BitcoinProvider.request('getAddresses', getAddressOptions);
    } catch (error) {
      throw error;
    }
  };

  const connectOkx = async () => {
    try {
      if (!window.okxwallet?.bitcoin) {
        throw new Error('OKX wallet is not installed. Please install OKX wallet to create BRC-20 tokens.');
      }

      const accounts = await window.okxwallet.bitcoin.requestAccounts();
      if (accounts.length === 0) {
        throw new Error('No Bitcoin accounts found in OKX wallet');
      }

      setConnected(true);
      setAddress(accounts[0]);
      setWalletType('okx');
      setError(null);
      
      console.log('✅ Connected to OKX:', accounts[0]);
    } catch (error) {
      throw error;
    }
  };

  const connectHiro = async () => {
    try {
      if (!window.HiroWalletProvider) {
        throw new Error('Hiro wallet is not installed. Please install Hiro wallet to create BRC-20 tokens.');
      }

      // Hiro wallet integration would go here
      // This is a placeholder since Hiro's Bitcoin integration is still developing
      throw new Error('Hiro wallet Bitcoin integration coming soon');
    } catch (error) {
      throw error;
    }
  };

  const connect = async (preferredWallet?: 'unisat' | 'xverse' | 'okx' | 'hiro') => {
    try {
      setError(null);
      
      // Try preferred wallet first
      if (preferredWallet === 'unisat') {
        await connectUnisat();
        return;
      } else if (preferredWallet === 'xverse') {
        await connectXverse();
        return;
      } else if (preferredWallet === 'okx') {
        await connectOkx();
        return;
      } else if (preferredWallet === 'hiro') {
        await connectHiro();
        return;
      }
      
      // Auto-detect available wallet
      if (window.unisat) {
        await connectUnisat();
      } else if (window.XverseProviders?.BitcoinProvider) {
        await connectXverse();
      } else if (window.okxwallet?.bitcoin) {
        await connectOkx();
      } else if (window.HiroWalletProvider) {
        await connectHiro();
      } else {
        throw new Error('No Bitcoin wallet found. Please install Unisat, Xverse, OKX, or Hiro wallet.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect to Bitcoin wallet';
      setError(errorMessage);
      console.error('Bitcoin wallet connection error:', error);
      throw error;
    }
  };

  const disconnect = () => {
    setConnected(false);
    setAddress(null);
    setWalletType(null);
    setBalance(null);
    setError(null);
    console.log('👋 Disconnected from Bitcoin wallet');
  };

  const value: Brc20ContextType = {
    connected,
    address,
    walletType,
    balance,
    connect,
    disconnect,
    error,
    isSupported,
  };

  return (
    <Brc20Context.Provider value={value}>
      {children}
    </Brc20Context.Provider>
  );
}

export function useBrc20(): Brc20ContextType {
  const context = useContext(Brc20Context);
  if (context === undefined) {
    throw new Error('useBrc20 must be used within a Brc20Provider');
  }
  return context;
}

// Global type declarations for Bitcoin wallets
declare global {
  interface Window {
    unisat?: {
      requestAccounts: () => Promise<string[]>;
      getAccounts: () => Promise<string[]>;
      getNetwork: () => Promise<string>;
      switchNetwork: (network: string) => Promise<void>;
      getBalance: () => Promise<{ total: number; confirmed: number; unconfirmed: number }>;
      on: (event: string, callback: Function) => void;
      removeListener: (event: string, callback: Function) => void;
      signPsbt: (psbt: string) => Promise<string>;
      pushPsbt: (psbt: string) => Promise<string>;
    };
    XverseProviders?: {
      BitcoinProvider?: {
        request: (method: string, params: any) => Promise<any>;
      };
    };
    okxwallet?: {
      bitcoin?: {
        requestAccounts: () => Promise<string[]>;
        getAccounts: () => Promise<string[]>;
        getBalance: () => Promise<number>;
        signPsbt: (psbt: string) => Promise<string>;
      };
    };
    HiroWalletProvider?: any;
  }
}

export default Brc20Provider;