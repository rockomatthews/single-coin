// DIRECT PHANTOM CONNECTION
// Bypasses wallet adapter system entirely
// This might be how MetaMask redirects work - direct API access

declare global {
  interface Window {
    phantom?: {
      solana?: {
        isPhantom?: boolean;
        connect?: () => Promise<{ publicKey: any }>;
        signTransaction?: (transaction: any) => Promise<any>;
        signAndSendTransaction?: (transaction: any) => Promise<{ signature: string }>;
        publicKey?: any;
        isConnected?: boolean;
      };
    };
  }
}

/**
 * Connect directly to Phantom without wallet adapter
 * This mimics how other apps might avoid the adapter system
 */
export async function connectDirectlyToPhantom() {
  if (!window.phantom?.solana?.isPhantom) {
    throw new Error('Phantom wallet not found');
  }

  try {
    const response = await window.phantom.solana.connect();
    return {
      publicKey: response.publicKey,
      isConnected: true,
      phantom: window.phantom.solana
    };
  } catch (error) {
    throw new Error('Failed to connect to Phantom');
  }
}

/**
 * Check if Phantom is available without triggering any connection
 */
export function isPhantomAvailable(): boolean {
  return !!(window.phantom?.solana?.isPhantom);
}

/**
 * Create transaction using direct Phantom API
 * This might be the "clean" path that avoids malicious warnings
 */
export async function createTransactionDirectPhantom(
  connection: any,
  phantomWallet: any,
  instructions: any[]
) {
  const { Transaction } = await import('@solana/web3.js');
  
  const transaction = new Transaction();
  instructions.forEach(instruction => transaction.add(instruction));
  
  transaction.feePayer = phantomWallet.publicKey;
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  
  return transaction;
}