// TRON Token Parameters Interface
export interface TronTokenParams {
  // Core token info
  name: string;
  symbol: string;
  description: string;
  image: string;
  blockchain: 'tron';
  
  // Token specifications  
  decimals: number; // 0-18, default 6 for TRC-20
  totalSupply: number; // Number of tokens to create
  tokenStandard: 'TRC-10' | 'TRC-20'; // TRC-10 is simpler/cheaper, TRC-20 is more feature-rich
  
  // Social links
  website?: string;
  twitter?: string;
  telegram?: string;
  discord?: string;
  
  // Distribution settings
  retentionPercentage?: number;
  retainedAmount?: number;
  liquidityAmount?: number;
  
  // Liquidity pool settings
  createLiquidity?: boolean;
  liquidityTrxAmount?: number; // TRX amount for liquidity pool
  dexChoice?: 'justswap' | 'sunswap' | 'uniswap-tron'; // DEX for liquidity
  
  // Advanced settings
  mintable?: boolean; // Whether more tokens can be minted (TRC-20 only)
  burnable?: boolean; // Whether tokens can be burned (TRC-20 only)
  pausable?: boolean; // Whether token can be paused (TRC-20 only)
  
  // Fee settings
  platformFeeEnabled?: boolean;
}