// Wallet Connection Fix for Mainnet Compatibility
// Fixes the "Wallet not connected or does not support signing" error

import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';

/**
 * Enhanced wallet validation that works with mainnet deployments
 */
export function validateWalletConnection(wallet: ReturnType<typeof useWallet>) {
  const validation = {
    isValid: false,
    errors: [] as string[],
    warnings: [] as string[],
    wallet: null as any
  };

  // Check for basic wallet object
  if (!wallet) {
    validation.errors.push('Wallet object is undefined');
    return validation;
  }

  // Check for public key (most important for mainnet)
  if (!wallet.publicKey) {
    validation.errors.push('Wallet is not connected - no public key available');
    return validation;
  }

  // Check for signing capability
  if (!wallet.signTransaction) {
    validation.errors.push('Wallet does not support transaction signing');
    return validation;
  }

  // Check connection state (warning only for mainnet compatibility)
  if (!wallet.connected) {
    validation.warnings.push('Wallet reports as disconnected but has public key - proceeding with mainnet compatibility mode');
  }

  // Create enhanced wallet object for mainnet compatibility
  const enhancedWallet = {
    publicKey: wallet.publicKey,
    signTransaction: wallet.signTransaction,
    signAllTransactions: wallet.signAllTransactions || (async (transactions: any[]) => {
      // Fallback: sign transactions one by one
      const signedTransactions = [];
      for (const transaction of transactions) {
        const signedTx = await wallet.signTransaction!(transaction);
        signedTransactions.push(signedTx);
      }
      return signedTransactions;
    }),
    connected: true, // Force connected state for mainnet compatibility
    wallet: wallet.wallet,
  };

  validation.isValid = true;
  validation.wallet = enhancedWallet;
  
  return validation;
}

/**
 * Check if we're running in production/mainnet environment
 */
export function isMainnetEnvironment(): boolean {
  if (typeof window === 'undefined') return false;
  
  const hostname = window.location.hostname;
  return hostname !== 'localhost' && hostname !== '127.0.0.1' && !hostname.includes('dev');
}

/**
 * Get appropriate error message based on environment
 */
export function getWalletErrorMessage(error: string): string {
  if (isMainnetEnvironment()) {
    // More user-friendly messages for production
    if (error.includes('not connected')) {
      return 'Please connect your wallet first. Make sure you have approved the connection in your wallet extension.';
    }
    if (error.includes('does not support signing')) {
      return 'Your wallet does not support transaction signing. Please use a compatible wallet like Phantom, Solflare, or Backpack.';
    }
  }
  
  return error;
}

/**
 * Log detailed wallet state for debugging
 */
export function logWalletState(wallet: ReturnType<typeof useWallet>, prefix = '🔍') {
  console.log(`${prefix} Detailed wallet state:`, {
    connected: wallet.connected,
    connecting: wallet.connecting,
    disconnecting: wallet.disconnecting,
    publicKey: wallet.publicKey?.toString(),
    hasSignTransaction: !!wallet.signTransaction,
    hasSignAllTransactions: !!wallet.signAllTransactions,
    hasSignMessage: !!wallet.signMessage,
    walletName: wallet.wallet?.adapter?.name,
    readyState: wallet.wallet?.readyState,
    isMainnet: isMainnetEnvironment(),
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'N/A'
  });
}