// Solana connection configuration
export const SOLANA_CONFIG = {
  // Increased timeout for congested network conditions
  confirmTransactionInitialTimeout: 60000, // 60 seconds
  
  // Commitment level for transactions
  commitment: 'confirmed' as const,
  
  // Compute budget settings for priority fees
  computeUnits: 600000,
  computeUnitPrice: 5000, // 5000 microlamports for higher priority
  
  // RPC endpoints (can be configured via environment variables)
  mainnetRpc: process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
  devnetRpc: 'https://api.devnet.solana.com',
  
  // Network to use
  network: process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'mainnet-beta',
};

// Helper to get the appropriate RPC endpoint
export const getRpcEndpoint = () => {
  return SOLANA_CONFIG.network === 'devnet' 
    ? SOLANA_CONFIG.devnetRpc 
    : SOLANA_CONFIG.mainnetRpc;
}; 