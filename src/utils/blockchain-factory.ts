import { TokenParams } from './solana';
import { HyperLiquidTokenParams } from './hyperliquid';

// Unified token parameters that support both chains
export interface UnifiedTokenParams {
  // Core fields (common to both chains)
  name: string;
  symbol: string;
  description: string;
  image: string;
  website?: string;
  twitter?: string;
  telegram?: string;
  discord?: string;
  
  // Chain selection
  blockchain: 'solana' | 'hyperliquid';
  
  // Distribution settings
  retentionPercentage?: number;
  retainedAmount?: number;
  liquidityAmount?: number;
  createPool?: boolean;
  liquiditySolAmount?: number; // For Solana
  
  // Chain-specific parameters
  solana?: Partial<TokenParams>;
  hyperliquid?: Partial<HyperLiquidTokenParams>;
}

// Result type for token creation
export interface TokenCreationResult {
  success: boolean;
  tokenAddress?: string;
  poolTxId?: string | null;
  txHash?: string;
  error?: string;
  blockchain: 'solana' | 'hyperliquid';
  explorer_url?: string;
}

// Cost breakdown interface
export interface CostBreakdown {
  platformFee: number;
  deploymentFee: number;
  liquidityAmount?: number;
  poolCreationFee?: number;
  total: number;
  currency: string;
  breakdown: Record<string, string>;
}

// Abstract blockchain provider interface
export interface BlockchainProvider {
  name: string;
  blockchain: 'solana' | 'hyperliquid';
  
  // Core operations
  createToken(params: UnifiedTokenParams, signer?: any): Promise<TokenCreationResult>;
  uploadMetadata(params: UnifiedTokenParams): Promise<string>;
  calculateCosts(params: UnifiedTokenParams): CostBreakdown;
  validateParams(params: UnifiedTokenParams): { isValid: boolean; errors: string[] };
  
  // Optional operations
  createLiquidityPool?(tokenAddress: string, params: UnifiedTokenParams): Promise<string>;
  getTokenInfo?(address: string): Promise<any>;
  checkExistingPool?(tokenAddress: string): Promise<boolean>;
}

// Solana Provider Implementation
class SolanaProvider implements BlockchainProvider {
  name = 'Solana';
  blockchain = 'solana' as const;
  
  async createToken(params: UnifiedTokenParams, signer?: any): Promise<TokenCreationResult> {
    try {
      // Import Solana-specific logic only when needed
      const { useTokenCreation } = await import('../hooks/useTokenCreation');
      
      // Convert unified params to Solana-specific params
      const solanaParams: TokenParams = {
        name: params.name,
        symbol: params.symbol,
        description: params.description,
        image: params.image,
        decimals: params.solana?.decimals || 9,
        supply: params.solana?.supply || 1000000000,
        website: params.website,
        twitter: params.twitter,
        telegram: params.telegram,
        discord: params.discord,
        retentionPercentage: params.retentionPercentage,
        retainedAmount: params.retainedAmount,
        liquidityAmount: params.liquidityAmount,
        createPool: params.createPool,
        liquiditySolAmount: params.liquiditySolAmount,
        ...params.solana,
      };
      
      // This would need to be called from within a React component context
      // For now, return a placeholder structure
      console.log('Creating Solana token with params:', solanaParams);
      
      return {
        success: false,
        error: 'Solana token creation must be called from React hook context',
        blockchain: 'solana',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        blockchain: 'solana',
      };
    }
  }
  
  async uploadMetadata(params: UnifiedTokenParams): Promise<string> {
    const { uploadMetadata } = await import('./solana');
    
    // Mock connection for metadata upload (would need actual connection)
    const mockConnection = {} as any;
    
    const solanaParams: TokenParams = {
      name: params.name,
      symbol: params.symbol,
      description: params.description,
      image: params.image,
      decimals: params.solana?.decimals || 9,
      supply: params.solana?.supply || 1000000000,
      website: params.website,
      twitter: params.twitter,
      telegram: params.telegram,
      discord: params.discord,
      ...params.solana,
    };
    
    return uploadMetadata(mockConnection, solanaParams);
  }
  
  calculateCosts(params: UnifiedTokenParams): CostBreakdown {
    const { calculateFee, getCostBreakdown } = require('./solana');
    
    const retentionPercentage = params.retentionPercentage || 20;
    const liquidityAmount = params.liquiditySolAmount || 0;
    
    return getCostBreakdown(retentionPercentage, liquidityAmount);
  }
  
  validateParams(params: UnifiedTokenParams): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!params.name || params.name.length < 2) {
      errors.push('Token name must be at least 2 characters');
    }
    
    if (!params.symbol || params.symbol.length > 10) {
      errors.push('Token symbol must be 10 characters or less');
    }
    
    const decimals = params.solana?.decimals || 9;
    if (decimals < 0 || decimals > 9) {
      errors.push('Solana token decimals must be between 0 and 9');
    }
    
    const supply = params.solana?.supply || 1000000000;
    if (supply <= 0) {
      errors.push('Token supply must be greater than 0');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// HYPER LIQUID Provider Implementation
class HyperLiquidProvider implements BlockchainProvider {
  name = 'HYPER LIQUID';
  blockchain = 'hyperliquid' as const;
  
  async createToken(params: UnifiedTokenParams, signer?: any): Promise<TokenCreationResult> {
    try {
      const { 
        createHyperLiquidToken, 
        uploadHyperLiquidMetadata 
      } = await import('./hyperliquid');
      
      // Convert unified params to HYPER LIQUID specific params
      const hyperLiquidParams: HyperLiquidTokenParams = {
        name: params.name,
        symbol: params.symbol,
        description: params.description,
        image: params.image,
        blockchain: 'hyperliquid',
        tokenStandard: params.hyperliquid?.tokenStandard || 'HIP-1',
        szDecimals: params.hyperliquid?.szDecimals || 6,
        weiDecimals: params.hyperliquid?.weiDecimals || 18,
        maxSupply: params.hyperliquid?.maxSupply || 1000000000,
        website: params.website,
        twitter: params.twitter,
        telegram: params.telegram,
        discord: params.discord,
        retentionPercentage: params.retentionPercentage,
        retainedAmount: params.retainedAmount,
        liquidityAmount: params.liquidityAmount,
        enableHyperliquidity: params.hyperliquid?.enableHyperliquidity || false,
        initialPrice: params.hyperliquid?.initialPrice || 1.0,
        orderSize: params.hyperliquid?.orderSize || 1000,
        numberOfOrders: params.hyperliquid?.numberOfOrders || 10,
        maxGas: params.hyperliquid?.maxGas || 5000,
        ...params.hyperliquid,
      };
      
      // Upload metadata first
      const metadataUri = await uploadHyperLiquidMetadata(hyperLiquidParams);
      
      // Execute the 5-step HYPER LIQUID deployment process using the actual implementation
      
      const result = await createHyperLiquidToken(
        hyperLiquidParams, 
        signer,
        (step: number, status: string) => {
          console.log(`Step ${step}/5: ${status}`);
        }
      );
      
      return {
        success: result.success,
        tokenAddress: result.tokenId ? `HL_${result.tokenId}` : undefined,
        txHash: result.txHashes?.[0], // Use the first transaction hash
        error: result.error,
        blockchain: 'hyperliquid',
        explorer_url: result.tokenId ? `https://app.hyperliquid.xyz/token/${result.tokenId}` : undefined,
        poolTxId: result.spotIndex ? `spot_${result.spotIndex}` : undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        blockchain: 'hyperliquid',
      };
    }
  }
  
  
  async uploadMetadata(params: UnifiedTokenParams): Promise<string> {
    const { uploadHyperLiquidMetadata } = await import('./hyperliquid');
    
    const hyperLiquidParams: HyperLiquidTokenParams = {
      name: params.name,
      symbol: params.symbol,
      description: params.description,
      image: params.image,
      blockchain: 'hyperliquid',
      tokenStandard: params.hyperliquid?.tokenStandard || 'HIP-1',
      szDecimals: params.hyperliquid?.szDecimals || 6,
      weiDecimals: params.hyperliquid?.weiDecimals || 18,
      maxSupply: params.hyperliquid?.maxSupply || 1000000000,
      website: params.website,
      twitter: params.twitter,
      telegram: params.telegram,
      discord: params.discord,
      ...params.hyperliquid,
    };
    
    return uploadHyperLiquidMetadata(hyperLiquidParams);
  }
  
  calculateCosts(params: UnifiedTokenParams): CostBreakdown {
    const { getHyperLiquidCostBreakdown } = require('./hyperliquid');
    
    const hyperLiquidParams: HyperLiquidTokenParams = {
      name: params.name,
      symbol: params.symbol,
      description: params.description,
      image: params.image,
      blockchain: 'hyperliquid',
      tokenStandard: params.hyperliquid?.tokenStandard || 'HIP-1',
      szDecimals: params.hyperliquid?.szDecimals || 6,
      weiDecimals: params.hyperliquid?.weiDecimals || 18,
      maxSupply: params.hyperliquid?.maxSupply || 1000000000,
      maxGas: params.hyperliquid?.maxGas || 5000,
      ...params.hyperliquid,
    };
    
    return getHyperLiquidCostBreakdown(hyperLiquidParams);
  }
  
  validateParams(params: UnifiedTokenParams): { isValid: boolean; errors: string[] } {
    const { validateHyperLiquidParams } = require('./hyperliquid');
    
    const hyperLiquidParams: HyperLiquidTokenParams = {
      name: params.name,
      symbol: params.symbol,
      description: params.description,
      image: params.image,
      blockchain: 'hyperliquid',
      tokenStandard: params.hyperliquid?.tokenStandard || 'HIP-1',
      szDecimals: params.hyperliquid?.szDecimals || 6,
      weiDecimals: params.hyperliquid?.weiDecimals || 18,
      maxSupply: params.hyperliquid?.maxSupply || 1000000000,
      ...params.hyperliquid,
    };
    
    return validateHyperLiquidParams(hyperLiquidParams);
  }
}

// Factory function to get the appropriate blockchain provider
export function getBlockchainProvider(blockchain: 'solana' | 'hyperliquid'): BlockchainProvider {
  switch (blockchain) {
    case 'solana':
      return new SolanaProvider();
    case 'hyperliquid':
      return new HyperLiquidProvider();
    default:
      throw new Error(`Unsupported blockchain: ${blockchain}`);
  }
}

// Helper function to get all supported blockchains
export function getSupportedBlockchains(): Array<{ id: 'solana' | 'hyperliquid'; name: string; description: string; icon: string }> {
  return [
    {
      id: 'solana',
      name: 'Solana',
      description: 'Fast & cheap transactions with Raydium DEX',
      icon: '◎',
    },
    {
      id: 'hyperliquid',
      name: 'HYPER LIQUID',
      description: 'Bitcoin L2 with native order book and HYPE token',
      icon: '₿',
    },
  ];
}

// Helper to convert legacy Solana params to unified params
export function convertSolanaToUnified(solanaParams: TokenParams): UnifiedTokenParams {
  return {
    name: solanaParams.name,
    symbol: solanaParams.symbol,
    description: solanaParams.description,
    image: solanaParams.image,
    website: solanaParams.website,
    twitter: solanaParams.twitter,
    telegram: solanaParams.telegram,
    discord: solanaParams.discord,
    blockchain: 'solana',
    retentionPercentage: solanaParams.retentionPercentage,
    retainedAmount: solanaParams.retainedAmount,
    liquidityAmount: solanaParams.liquidityAmount,
    createPool: solanaParams.createPool,
    liquiditySolAmount: solanaParams.liquiditySolAmount,
    solana: solanaParams,
  };
}