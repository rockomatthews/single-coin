'use client';
import { createContext, useContext, useState, useEffect, ReactNode, FC } from 'react';
import detectEthereumProvider from '@metamask/detect-provider';
import { ethers } from 'ethers';

// HYPER LIQUID Mainnet Configuration - Updated to match existing MetaMask network
export const HYPERLIQUID_NETWORK = {
  chainId: '0x66eed', // 421037 in hex (mainnet)
  chainName: 'HYPERLIQUID EVM', // Match the exact name in MetaMask
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

      console.log('Current chain ID:', currentChainId);
      console.log('Target HYPER LIQUID chain ID:', HYPERLIQUID_NETWORK.chainId);

      // Only switch if we're not already on HYPER LIQUID
      if (currentChainId !== HYPERLIQUID_NETWORK.chainId) {
        console.log('Switching to HYPER LIQUID network...');
        try {
          await (window as any).ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: HYPERLIQUID_NETWORK.chainId }],
          });
          console.log('✅ Successfully switched to HYPER LIQUID network');
        } catch (switchError: any) {
          console.error('❌ Switch error:', switchError);
          
          // Only add network if it truly doesn't exist (error 4902)
          if (switchError.code === 4902) {
            console.log('Network not found, attempting to add...');
            try {
              await (window as any).ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [HYPERLIQUID_NETWORK],
              });
              console.log('✅ Successfully added HYPER LIQUID network');
            } catch (addError) {
              console.error('❌ Failed to add network:', addError);
              throw new Error('Failed to add HYPER LIQUID network to MetaMask');
            }
          } else {
            // For other errors (like user rejection), provide helpful message
            if (switchError.code === 4001) {
              throw new Error('Network switch rejected by user');
            }
            throw new Error(`Failed to switch to HYPER LIQUID network: ${switchError.message}`);
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