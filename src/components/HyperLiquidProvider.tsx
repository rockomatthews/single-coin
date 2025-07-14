'use client';
import { createContext, useContext, useState, useEffect, ReactNode, FC } from 'react';
import detectEthereumProvider from '@metamask/detect-provider';
import { ethers } from 'ethers';

// HYPER LIQUID Mainnet Configuration - Correct configuration for HyperEVM
export const HYPERLIQUID_NETWORK = {
  chainId: '0x3e7', // 999 in hex (mainnet)
  chainName: 'Hyperliquid', // Official network name
  nativeCurrency: {
    name: 'HYPE',
    symbol: 'HYPE',
    decimals: 18,
  },
  rpcUrls: ['https://rpc.hyperliquid.xyz/evm'],
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
          // Check if we're on the correct network
          const currentChainId = await (window as any).ethereum.request({
            method: 'eth_chainId'
          });
          
          console.log('Checking connection - Current chain:', currentChainId, 'Target:', HYPERLIQUID_NETWORK.chainId);
          
          // Only auto-connect if we're on HYPER LIQUID network
          if (currentChainId === HYPERLIQUID_NETWORK.chainId) {
            const ethersProvider = new ethers.BrowserProvider((window as any).ethereum);
            const ethSigner = await ethersProvider.getSigner();
            
            setProvider(ethersProvider);
            setSigner(ethSigner);
            setAddress(accounts[0]);
            setConnected(true);
            console.log('✅ Auto-connected to HYPER LIQUID');
          } else {
            console.log('💡 MetaMask connected but not on HYPER LIQUID network');
          }
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

      // Check current network first
      const currentChainId = await (window as any).ethereum.request({
        method: 'eth_chainId'
      });

      console.log('=== NETWORK DEBUG INFO ===');
      console.log('Current chain ID:', currentChainId);
      console.log('Current chain ID (decimal):', parseInt(currentChainId, 16));
      console.log('Target HYPER LIQUID chain ID:', HYPERLIQUID_NETWORK.chainId);
      console.log('Target chain ID (decimal):', parseInt(HYPERLIQUID_NETWORK.chainId, 16));
      console.log('Chain IDs match?', currentChainId === HYPERLIQUID_NETWORK.chainId);
      console.log('=========================');

      // Only switch if we're not already on HYPER LIQUID
      if (currentChainId !== HYPERLIQUID_NETWORK.chainId) {
        console.log('Need to switch to HYPER LIQUID network...');
        console.log('Current chain ID:', currentChainId);
        console.log('Target chain ID:', HYPERLIQUID_NETWORK.chainId);
        
        // First, just try to switch without adding - the network should already exist
        try {
          console.log('Attempting to switch to existing HYPER LIQUID network...');
          await (window as any).ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: HYPERLIQUID_NETWORK.chainId }],
          });
          console.log('✅ Successfully switched to HYPER LIQUID network');
        } catch (switchError: any) {
          console.error('❌ Switch error details:', {
            code: switchError.code,
            message: switchError.message,
            data: switchError.data
          });
          
          // Handle different error scenarios
          if (switchError.code === 4001) {
            throw new Error('Please approve the network switch in MetaMask to continue.');
          } else if (switchError.code === 4902) {
            // Network exists but MetaMask can't switch to it - this is common
            console.log('⚠️ MetaMask says network not found, but it should exist');
            console.log('This usually means you need to manually switch to HYPER LIQUID in MetaMask');
            throw new Error('Please manually switch to the HYPER LIQUID network in MetaMask, then try connecting again.');
          } else {
            console.error('Unexpected switch error:', switchError);
            throw new Error(`Network switch failed. Please manually switch to HYPER LIQUID network (Chain ID: 421037) in MetaMask and try again.`);
          }
        }
      } else {
        console.log('✅ Already on HYPER LIQUID network');
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