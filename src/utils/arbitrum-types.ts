// Arbitrum Token Parameters Interface
export interface ArbitrumTokenParams {
  // Core token info
  name: string;
  symbol: string;
  description: string;
  image: string;
  blockchain: 'arbitrum';
  
  // Token specifications
  decimals: number; // 0-18, default 18
  totalSupply: number; // Number of tokens to create
  
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
  liquidityEthAmount?: number; // ETH amount for liquidity pool
  dexChoice?: 'uniswap-v3' | 'camelot' | 'sushiswap'; // DEX for liquidity
  
  // Advanced settings
  mintable?: boolean; // Whether more tokens can be minted
  burnable?: boolean; // Whether tokens can be burned
  pausable?: boolean; // Whether token can be paused
  
  // Fee settings
  platformFeeEnabled?: boolean;
}