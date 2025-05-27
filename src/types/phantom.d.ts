// Type definitions for Phantom wallet
interface PhantomProvider {
  isPhantom?: boolean;
  publicKey?: { toBuffer(): Buffer; toString(): string };
  isConnected: boolean;
  signTransaction: (transaction: any) => Promise<any>;
  signAllTransactions: (transactions: any[]) => Promise<any[]>;
  signAndSendTransaction: (transaction: any) => Promise<{ signature: string }>;
  signMessage: (message: Uint8Array) => Promise<{ signature: Uint8Array }>;
  connect: () => Promise<{ publicKey: any }>;
  disconnect: () => Promise<void>;
  on: (event: string, callback: () => void) => void;
  request: (args: { 
    method: string; 
    params: Record<string, unknown>
  }) => Promise<unknown>;
  solana?: PhantomProvider;
}

interface WindowWithPhantom extends Window {
  phantom?: {
    solana?: PhantomProvider;
  };
}

declare global {
  interface Window {
    phantom?: {
      solana?: PhantomProvider;
    };
  }
} 