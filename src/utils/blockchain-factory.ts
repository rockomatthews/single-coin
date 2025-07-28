import { TokenParams } from './solana';
import { HyperLiquidTokenParams } from './hyperliquid';
import { PolygonTokenParams } from './polygon';
import { BaseTokenParams } from './base';
import { BnbTokenParams } from './bnb';
import { Brc20TokenParams } from './brc20';
import { ArbitrumTokenParams } from './arbitrum-types';
import { TronTokenParams } from './tron-types';

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
  blockchain: 'solana' | 'hyperliquid' | 'polygon' | 'base' | 'bnb' | 'bitcoin' | 'arbitrum' | 'tron';
  
  // Distribution settings
  retentionPercentage?: number;
  retainedAmount?: number;
  liquidityAmount?: number;
  createPool?: boolean;
  liquiditySolAmount?: number; // For Solana
  
  // SECURITY FEATURES (cross-chain compatibility)
  revokeUpdateAuthority?: boolean;  // Renounce ownership / revoke metadata update
  revokeFreezeAuthority?: boolean;  // Solana-specific but kept for UI consistency
  revokeMintAuthority?: boolean;    // Finish minting / disable mint function
  
  // Chain-specific parameters
  solana?: Partial<TokenParams>;
  hyperliquid?: Partial<HyperLiquidTokenParams>;
  polygon?: Partial<PolygonTokenParams>;
  base?: Partial<BaseTokenParams>;
  bnb?: Partial<BnbTokenParams>;
  bitcoin?: Partial<Brc20TokenParams>;
  arbitrum?: Partial<ArbitrumTokenParams>;
  tron?: Partial<TronTokenParams>;
}

// Result type for token creation
export interface TokenCreationResult {
  success: boolean;
  tokenAddress?: string;
  poolTxId?: string | null;
  txHash?: string;
  error?: string;
  blockchain: 'solana' | 'hyperliquid' | 'polygon' | 'base' | 'bnb' | 'bitcoin' | 'arbitrum' | 'tron';
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
  blockchain: 'solana' | 'hyperliquid' | 'polygon' | 'base' | 'bnb' | 'bitcoin' | 'arbitrum' | 'tron';
  
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

// Polygon Provider Implementation
class PolygonProvider implements BlockchainProvider {
  name = 'Polygon';
  blockchain = 'polygon' as const;
  
  async createToken(params: UnifiedTokenParams, signer?: any): Promise<TokenCreationResult> {
    try {
      const { 
        deployPolygonTokenWithHardhat, 
        uploadPolygonMetadata,
        connectPolygonWallet 
      } = await import('./polygon-hardhat');
      
      // Convert unified params to Polygon-specific params
      const polygonParams: PolygonTokenParams = {
        name: params.name,
        symbol: params.symbol,
        description: params.description,
        image: params.image,
        blockchain: 'polygon',
        decimals: params.polygon?.decimals || 18,
        totalSupply: params.polygon?.totalSupply || 1000000,
        website: params.website,
        twitter: params.twitter,
        telegram: params.telegram,
        discord: params.discord,
        retentionPercentage: params.retentionPercentage,
        retainedAmount: params.retainedAmount,
        liquidityAmount: params.liquidityAmount,
        createLiquidity: params.polygon?.createLiquidity ?? params.createPool ?? false,
        liquidityMaticAmount: params.polygon?.liquidityMaticAmount || 0,
        dexChoice: params.polygon?.dexChoice || 'uniswap-v3',
        // REAL SECURITY FEATURES - Pass through from UI
        revokeUpdateAuthority: params.revokeUpdateAuthority ?? params.polygon?.revokeUpdateAuthority,
        revokeFreezeAuthority: params.revokeFreezeAuthority ?? params.polygon?.revokeFreezeAuthority, // Not applicable but kept for consistency
        revokeMintAuthority: params.revokeMintAuthority ?? params.polygon?.revokeMintAuthority,
        ...params.polygon,
      };
      
      // Get user address for Hardhat deployment
      let userAddress = '';
      if (signer) {
        userAddress = await signer.getAddress();
      } else {
        // Connect to get address but use Hardhat for deployment
        if (!window.ethereum) {
          throw new Error('MetaMask not found');
        }
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        userAddress = accounts[0];
        if (!userAddress) {
          throw new Error('No MetaMask account found');
        }
      }
      
      // Upload metadata first
      const { uploadPolygonMetadata } = await import('./polygon');
      const metadataUri = await uploadPolygonMetadata(polygonParams);
      console.log(`✅ Polygon metadata uploaded: ${metadataUri}`);
      
      // Deploy token contract using Hardhat (no wallet signer needed)
      const result = await deployPolygonTokenWithHardhat(
        userAddress,
        polygonParams,
        (step: number, status: string) => {
          console.log(`Step ${step}/5: ${status}`);
        }
      );
      
      if (!result.success || !result.tokenAddress) {
        return {
          success: result.success,
          tokenAddress: result.tokenAddress,
          txHash: result.txHash,
          error: result.error,
          blockchain: 'polygon',
          explorer_url: result.tokenAddress ? `https://polygonscan.com/token/${result.tokenAddress}` : undefined,
        };
      }
      
      // Create liquidity pool if requested
      let poolTxId: string | undefined;
      if (polygonParams.createLiquidity) {
        try {
          const { createPolygonLiquidityPool } = await import('./polygon');
          
          const poolResult = await createPolygonLiquidityPool(
            walletSigner,
            result.tokenAddress,
            polygonParams,
            (step: number, status: string) => {
              console.log(`Pool Step ${step}/7: ${status}`);
            }
          );
          
          if (poolResult.success) {
            poolTxId = poolResult.txHash;
            console.log(`✅ Polygon liquidity pool created: ${poolTxId}`);
          } else {
            console.warn(`⚠️ Polygon liquidity pool creation failed: ${poolResult.error}`);
          }
        } catch (poolError) {
          console.warn(`⚠️ Polygon liquidity pool creation error:`, poolError);
        }
      }
      
      return {
        success: result.success,
        tokenAddress: result.tokenAddress,
        poolTxId,
        txHash: result.txHash,
        error: result.error,
        blockchain: 'polygon',
        explorer_url: result.tokenAddress ? `https://polygonscan.com/token/${result.tokenAddress}` : undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        blockchain: 'polygon',
      };
    }
  }
  
  async uploadMetadata(params: UnifiedTokenParams): Promise<string> {
    const { uploadPolygonMetadata } = await import('./polygon');
    
    const polygonParams: PolygonTokenParams = {
      name: params.name,
      symbol: params.symbol,
      description: params.description,
      image: params.image,
      blockchain: 'polygon',
      decimals: params.polygon?.decimals || 18,
      totalSupply: params.polygon?.totalSupply || 1000000,
      website: params.website,
      twitter: params.twitter,
      telegram: params.telegram,
      discord: params.discord,
      ...params.polygon,
    };
    
    return uploadPolygonMetadata(polygonParams);
  }
  
  calculateCosts(params: UnifiedTokenParams): CostBreakdown {
    const { getPolygonCostBreakdown } = require('./polygon');
    
    const polygonParams: PolygonTokenParams = {
      name: params.name,
      symbol: params.symbol,
      description: params.description,
      image: params.image,
      blockchain: 'polygon',
      decimals: params.polygon?.decimals || 18,
      totalSupply: params.polygon?.totalSupply || 1000000,
      createLiquidity: params.polygon?.createLiquidity || false,
      liquidityMaticAmount: params.polygon?.liquidityMaticAmount || 0,
      ...params.polygon,
    };
    
    return getPolygonCostBreakdown(polygonParams);
  }
  
  validateParams(params: UnifiedTokenParams): { isValid: boolean; errors: string[] } {
    const { validatePolygonParams } = require('./polygon');
    
    const polygonParams: PolygonTokenParams = {
      name: params.name,
      symbol: params.symbol,
      description: params.description,
      image: params.image,
      blockchain: 'polygon',
      decimals: params.polygon?.decimals || 18,
      totalSupply: params.polygon?.totalSupply || 1000000,
      ...params.polygon,
    };
    
    return validatePolygonParams(polygonParams);
  }
}

// BASE Provider Implementation  
class BaseProvider implements BlockchainProvider {
  name = 'BASE';
  blockchain = 'base' as const;
  
  async createToken(params: UnifiedTokenParams, signer?: any): Promise<TokenCreationResult> {
    try {
      const { 
        deployBaseToken, 
        uploadBaseMetadata,
        connectBaseWallet 
      } = await import('./base');
      
      // Convert unified params to BASE-specific params
      const baseParams: BaseTokenParams = {
        name: params.name,
        symbol: params.symbol,
        description: params.description,
        image: params.image,
        blockchain: 'base',
        decimals: params.base?.decimals || 18,
        totalSupply: params.base?.totalSupply || 1000000,
        website: params.website,
        twitter: params.twitter,
        telegram: params.telegram,
        discord: params.discord,
        retentionPercentage: params.retentionPercentage,
        retainedAmount: params.retainedAmount,
        liquidityAmount: params.liquidityAmount,
        createLiquidity: params.base?.createLiquidity || false,
        liquidityEthAmount: params.base?.liquidityEthAmount || 0,
        dexChoice: params.base?.dexChoice || 'uniswap-v3',
        ...params.base,
      };
      
      // Use provided signer or connect to MetaMask
      let walletSigner = signer;
      if (!walletSigner) {
        const walletConnection = await connectBaseWallet();
        if (!walletConnection.signer) {
          throw new Error(walletConnection.error || 'Failed to connect MetaMask wallet');
        }
        walletSigner = walletConnection.signer;
      }
      
      // Upload metadata first
      const metadataUri = await uploadBaseMetadata(baseParams);
      console.log(`✅ BASE metadata uploaded: ${metadataUri}`);
      
      // Deploy token contract
      const result = await deployBaseToken(
        walletSigner,
        baseParams,
        (step: number, status: string) => {
          console.log(`Step ${step}/5: ${status}`);
        }
      );
      
      if (!result.success || !result.tokenAddress) {
        return {
          success: result.success,
          tokenAddress: result.tokenAddress,
          txHash: result.txHash,
          error: result.error,
          blockchain: 'base',
          explorer_url: result.tokenAddress ? `https://basescan.org/token/${result.tokenAddress}` : undefined,
        };
      }
      
      // Create liquidity pool if requested
      let poolTxId: string | undefined;
      if (baseParams.createLiquidity) {
        try {
          const { createBaseLiquidityPool } = await import('./base');
          
          const poolResult = await createBaseLiquidityPool(
            walletSigner,
            result.tokenAddress,
            baseParams,
            (step: number, status: string) => {
              console.log(`Pool Step ${step}/7: ${status}`);
            }
          );
          
          if (poolResult.success) {
            poolTxId = poolResult.txHash;
            console.log(`✅ BASE liquidity pool created: ${poolTxId}`);
          } else {
            console.warn(`⚠️ BASE liquidity pool creation failed: ${poolResult.error}`);
          }
        } catch (poolError) {
          console.warn(`⚠️ BASE liquidity pool creation error:`, poolError);
        }
      }
      
      return {
        success: result.success,
        tokenAddress: result.tokenAddress,
        poolTxId,
        txHash: result.txHash,
        error: result.error,
        blockchain: 'base',
        explorer_url: result.tokenAddress ? `https://basescan.org/token/${result.tokenAddress}` : undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        blockchain: 'base',
      };
    }
  }
  
  async uploadMetadata(params: UnifiedTokenParams): Promise<string> {
    const { uploadBaseMetadata } = await import('./base');
    
    const baseParams: BaseTokenParams = {
      name: params.name,
      symbol: params.symbol,
      description: params.description,
      image: params.image,
      blockchain: 'base',
      decimals: params.base?.decimals || 18,
      totalSupply: params.base?.totalSupply || 1000000,
      website: params.website,
      twitter: params.twitter,
      telegram: params.telegram,
      discord: params.discord,
      ...params.base,
    };
    
    return uploadBaseMetadata(baseParams);
  }
  
  calculateCosts(params: UnifiedTokenParams): CostBreakdown {
    const { getBaseCostBreakdown } = require('./base');
    
    const baseParams: BaseTokenParams = {
      name: params.name,
      symbol: params.symbol,
      description: params.description,
      image: params.image,
      blockchain: 'base',
      decimals: params.base?.decimals || 18,
      totalSupply: params.base?.totalSupply || 1000000,
      createLiquidity: params.base?.createLiquidity || false,
      liquidityEthAmount: params.base?.liquidityEthAmount || 0,
      ...params.base,
    };
    
    return getBaseCostBreakdown(baseParams);
  }
  
  validateParams(params: UnifiedTokenParams): { isValid: boolean; errors: string[] } {
    const { validateBaseParams } = require('./base');
    
    const baseParams: BaseTokenParams = {
      name: params.name,
      symbol: params.symbol,
      description: params.description,
      image: params.image,
      blockchain: 'base',
      decimals: params.base?.decimals || 18,
      totalSupply: params.base?.totalSupply || 1000000,
      ...params.base,
    };
    
    return validateBaseParams(baseParams);
  }
}

// BNB Chain Provider Implementation  
class BnbProvider implements BlockchainProvider {
  name = 'BNB Chain';
  blockchain = 'bnb' as const;
  
  async createToken(params: UnifiedTokenParams, signer?: any): Promise<TokenCreationResult> {
    try {
      const { 
        deployBnbToken, 
        uploadBnbMetadata,
        connectBnbWallet 
      } = await import('./bnb');
      
      // Convert unified params to BNB Chain-specific params
      const bnbParams: BnbTokenParams = {
        name: params.name,
        symbol: params.symbol,
        description: params.description,
        image: params.image,
        blockchain: 'bnb',
        decimals: params.bnb?.decimals || 18,
        totalSupply: params.bnb?.totalSupply || 1000000,
        website: params.website,
        twitter: params.twitter,
        telegram: params.telegram,
        discord: params.discord,
        retentionPercentage: params.retentionPercentage,
        retainedAmount: params.retainedAmount,
        liquidityAmount: params.liquidityAmount,
        createLiquidity: params.bnb?.createLiquidity || false,
        liquidityBnbAmount: params.bnb?.liquidityBnbAmount || 0,
        dexChoice: params.bnb?.dexChoice || 'pancakeswap-v2',
        ...params.bnb,
      };
      
      // Use provided signer or connect to MetaMask
      let walletSigner = signer;
      if (!walletSigner) {
        const walletConnection = await connectBnbWallet();
        if (!walletConnection.signer) {
          throw new Error(walletConnection.error || 'Failed to connect MetaMask wallet');
        }
        walletSigner = walletConnection.signer;
      }
      
      // Upload metadata first
      const metadataUri = await uploadBnbMetadata(bnbParams);
      console.log(`✅ BNB Chain metadata uploaded: ${metadataUri}`);
      
      // Deploy token contract
      const result = await deployBnbToken(
        walletSigner,
        bnbParams,
        (step: number, status: string) => {
          console.log(`Step ${step}/5: ${status}`);
        }
      );
      
      if (!result.success || !result.tokenAddress) {
        return {
          success: result.success,
          tokenAddress: result.tokenAddress,
          txHash: result.txHash,
          error: result.error,
          blockchain: 'bnb',
          explorer_url: result.tokenAddress ? `https://bscscan.com/token/${result.tokenAddress}` : undefined,
        };
      }
      
      // Create liquidity pool if requested
      let poolTxId: string | undefined;
      if (bnbParams.createLiquidity) {
        try {
          const { createBnbLiquidityPool } = await import('./bnb');
          
          const poolResult = await createBnbLiquidityPool(
            walletSigner,
            result.tokenAddress,
            bnbParams,
            (step: number, status: string) => {
              console.log(`Pool Step ${step}/7: ${status}`);
            }
          );
          
          if (poolResult.success) {
            poolTxId = poolResult.txHash;
            console.log(`✅ BNB Chain liquidity pool created: ${poolTxId}`);
          } else {
            console.warn(`⚠️ BNB Chain liquidity pool creation failed: ${poolResult.error}`);
          }
        } catch (poolError) {
          console.warn(`⚠️ BNB Chain liquidity pool creation error:`, poolError);
        }
      }
      
      return {
        success: result.success,
        tokenAddress: result.tokenAddress,
        poolTxId,
        txHash: result.txHash,
        error: result.error,
        blockchain: 'bnb',
        explorer_url: result.tokenAddress ? `https://bscscan.com/token/${result.tokenAddress}` : undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        blockchain: 'bnb',
      };
    }
  }
  
  async uploadMetadata(params: UnifiedTokenParams): Promise<string> {
    const { uploadBnbMetadata } = await import('./bnb');
    
    const bnbParams: BnbTokenParams = {
      name: params.name,
      symbol: params.symbol,
      description: params.description,
      image: params.image,
      blockchain: 'bnb',
      decimals: params.bnb?.decimals || 18,
      totalSupply: params.bnb?.totalSupply || 1000000,
      website: params.website,
      twitter: params.twitter,
      telegram: params.telegram,
      discord: params.discord,
      ...params.bnb,
    };
    
    return uploadBnbMetadata(bnbParams);
  }
  
  calculateCosts(params: UnifiedTokenParams): CostBreakdown {
    const { getBnbCostBreakdown } = require('./bnb');
    
    const bnbParams: BnbTokenParams = {
      name: params.name,
      symbol: params.symbol,
      description: params.description,
      image: params.image,
      blockchain: 'bnb',
      decimals: params.bnb?.decimals || 18,
      totalSupply: params.bnb?.totalSupply || 1000000,
      createLiquidity: params.bnb?.createLiquidity || false,
      liquidityBnbAmount: params.bnb?.liquidityBnbAmount || 0,
      ...params.bnb,
    };
    
    return getBnbCostBreakdown(bnbParams);
  }
  
  validateParams(params: UnifiedTokenParams): { isValid: boolean; errors: string[] } {
    const { validateBnbParams } = require('./bnb');
    
    const bnbParams: BnbTokenParams = {
      name: params.name,
      symbol: params.symbol,
      description: params.description,
      image: params.image,
      blockchain: 'bnb',
      decimals: params.bnb?.decimals || 18,
      totalSupply: params.bnb?.totalSupply || 1000000,
      ...params.bnb,
    };
    
    return validateBnbParams(bnbParams);
  }
}

// BRC-20 Provider Implementation (Bitcoin inscriptions like PEPE, ORDI)
class Brc20Provider implements BlockchainProvider {
  name = 'Bitcoin';
  blockchain = 'bitcoin' as const;
  
  async createToken(params: UnifiedTokenParams, signer?: any): Promise<TokenCreationResult> {
    try {
      const { 
        deployBrc20Token, 
        uploadBrc20Metadata 
      } = await import('./brc20');
      
      // Convert unified params to BRC-20 specific params
      const brc20Params: Brc20TokenParams = {
        name: params.name,
        symbol: params.symbol,
        description: params.description,
        image: params.image,
        blockchain: 'bitcoin',
        tick: params.bitcoin?.tick || params.symbol.slice(0, 4).toUpperCase(),
        max: params.bitcoin?.max || 21000000,
        lim: params.bitcoin?.lim || 1000,
        website: params.website,
        twitter: params.twitter,
        telegram: params.telegram,
        discord: params.discord,
        retentionPercentage: params.retentionPercentage,
        retainedAmount: params.retainedAmount,
        liquidityAmount: params.liquidityAmount,
        ...params.bitcoin,
      };
      
      // Use provided wallet address (Bitcoin wallets work differently)
      const walletAddress = signer || 'bc1qBitcoinWalletAddress';
      
      // Upload metadata first
      const metadataUri = await uploadBrc20Metadata(brc20Params);
      console.log(`✅ BRC-20 metadata uploaded: ${metadataUri}`);
      
      // Deploy BRC-20 token through inscription
      const result = await deployBrc20Token(
        brc20Params,
        walletAddress,
        (step: number, status: string) => {
          console.log(`Step ${step}/5: ${status}`);
        }
      );
      
      return {
        success: result.success,
        tokenAddress: result.tokenAddress || result.inscriptionId,
        txHash: result.txId,
        error: result.error,
        blockchain: 'bitcoin',
        explorer_url: result.inscriptionId ? `https://ordinals.com/inscription/${result.inscriptionId}` : undefined,
        poolTxId: undefined, // BRC-20 doesn't have traditional liquidity pools
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        blockchain: 'bitcoin',
      };
    }
  }
  
  async uploadMetadata(params: UnifiedTokenParams): Promise<string> {
    const { uploadBrc20Metadata } = await import('./brc20');
    
    const brc20Params: Brc20TokenParams = {
      name: params.name,
      symbol: params.symbol,
      description: params.description,
      image: params.image,
      blockchain: 'bitcoin',
      tick: params.bitcoin?.tick || params.symbol.slice(0, 4).toUpperCase(),
      max: params.bitcoin?.max || 21000000,
      lim: params.bitcoin?.lim || 1000,
      website: params.website,
      twitter: params.twitter,
      telegram: params.telegram,
      discord: params.discord,
      ...params.bitcoin,
    };
    
    return uploadBrc20Metadata(brc20Params);
  }
  
  calculateCosts(params: UnifiedTokenParams): CostBreakdown {
    const { getBrc20CostBreakdown } = require('./brc20');
    
    const brc20Params: Brc20TokenParams = {
      name: params.name,
      symbol: params.symbol,
      description: params.description,
      image: params.image,
      blockchain: 'bitcoin',
      tick: params.bitcoin?.tick || params.symbol.slice(0, 4).toUpperCase(),
      max: params.bitcoin?.max || 21000000,
      lim: params.bitcoin?.lim || 1000,
      ...params.bitcoin,
    };
    
    return getBrc20CostBreakdown(brc20Params);
  }
  
  validateParams(params: UnifiedTokenParams): { isValid: boolean; errors: string[] } {
    const { validateBrc20Params } = require('./brc20');
    
    const brc20Params: Brc20TokenParams = {
      name: params.name,
      symbol: params.symbol,
      description: params.description,
      image: params.image,
      blockchain: 'bitcoin',
      tick: params.bitcoin?.tick || params.symbol.slice(0, 4).toUpperCase(),
      max: params.bitcoin?.max || 21000000,
      lim: params.bitcoin?.lim || 1000,
      ...params.bitcoin,
    };
    
    return validateBrc20Params(brc20Params);
  }
}

// Arbitrum Provider Implementation
class ArbitrumProvider implements BlockchainProvider {
  name = 'Arbitrum';
  blockchain = 'arbitrum' as const;
  
  async createToken(params: UnifiedTokenParams, signer?: any): Promise<TokenCreationResult> {
    try {
      const { deployArbitrumToken } = await import('./arbitrum');
      
      // Deploy token using Arbitrum utils
      const result = await deployArbitrumToken(params);
      
      return {
        success: result.success,
        tokenAddress: result.tokenAddress,
        poolTxId: result.poolTxId,
        txHash: result.txHash,
        error: result.error,
        blockchain: 'arbitrum',
        explorer_url: result.explorer_url,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        blockchain: 'arbitrum',
      };
    }
  }
  
  async uploadMetadata(params: UnifiedTokenParams): Promise<string> {
    const { uploadToPinata } = await import('./pinata');
    
    const metadata = {
      name: params.name,
      symbol: params.symbol,
      description: params.description || `${params.name} - A meme token on Arbitrum`,
      image: params.image,
      external_url: params.website,
      attributes: [
        { trait_type: 'Blockchain', value: 'Arbitrum' },
        { trait_type: 'Token Standard', value: 'ERC-20' },
        { trait_type: 'Total Supply', value: (params.arbitrum?.totalSupply || 1000000).toString() },
        { trait_type: 'Decimals', value: (params.arbitrum?.decimals || 18).toString() },
      ],
    };
    
    return uploadToPinata(metadata);
  }
  
  calculateCosts(params: UnifiedTokenParams): CostBreakdown {
    const { calculateArbitrumCosts } = require('./arbitrum');
    
    return calculateArbitrumCosts(params);
  }
  
  validateParams(params: UnifiedTokenParams): { isValid: boolean; errors: string[] } {
    const { validateArbitrumParams } = require('./arbitrum');
    
    return validateArbitrumParams(params);
  }
}

// TRON Provider Implementation
class TronProvider implements BlockchainProvider {
  name = 'TRON';
  blockchain = 'tron' as const;
  
  async createToken(params: UnifiedTokenParams, signer?: any): Promise<TokenCreationResult> {
    try {
      const { deployTronToken } = await import('./tron');
      
      // Deploy token using TRON utils
      const result = await deployTronToken(params);
      
      return {
        success: result.success,
        tokenAddress: result.tokenAddress,
        poolTxId: result.poolTxId,
        txHash: result.txHash,
        error: result.error,
        blockchain: 'tron',
        explorer_url: result.explorer_url,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        blockchain: 'tron',
      };
    }
  }
  
  async uploadMetadata(params: UnifiedTokenParams): Promise<string> {
    const { uploadToPinata } = await import('./pinata');
    
    const metadata = {
      name: params.name,
      symbol: params.symbol,
      description: params.description || `${params.name} - A meme token on TRON`,
      image: params.image,
      external_url: params.website,
      attributes: [
        { trait_type: 'Blockchain', value: 'TRON' },
        { trait_type: 'Token Standard', value: params.tron?.tokenStandard || 'TRC-20' },
        { trait_type: 'Total Supply', value: (params.tron?.totalSupply || 1000000).toString() },
        { trait_type: 'Decimals', value: (params.tron?.decimals || 6).toString() },
      ],
    };
    
    return uploadToPinata(metadata);
  }
  
  calculateCosts(params: UnifiedTokenParams): CostBreakdown {
    const { calculateTronCosts } = require('./tron');
    
    return calculateTronCosts(params);
  }
  
  validateParams(params: UnifiedTokenParams): { isValid: boolean; errors: string[] } {
    const { validateTronParams } = require('./tron');
    
    return validateTronParams(params);
  }
}

// Factory function to get the appropriate blockchain provider
export function getBlockchainProvider(blockchain: 'solana' | 'hyperliquid' | 'polygon' | 'base' | 'bnb' | 'bitcoin' | 'arbitrum' | 'tron'): BlockchainProvider {
  switch (blockchain) {
    case 'solana':
      return new SolanaProvider();
    case 'hyperliquid':
      return new HyperLiquidProvider();
    case 'polygon':
      return new PolygonProvider();
    case 'base':
      return new BaseProvider();
    case 'bnb':
      return new BnbProvider();
    case 'bitcoin':
      return new Brc20Provider();
    case 'arbitrum':
      return new ArbitrumProvider();
    case 'tron':
      return new TronProvider();
    default:
      throw new Error(`Unsupported blockchain: ${blockchain}`);
  }
}

// Helper function to get all supported blockchains
export function getSupportedBlockchains(): Array<{ id: 'solana' | 'hyperliquid' | 'polygon' | 'base' | 'bnb' | 'bitcoin' | 'arbitrum' | 'tron'; name: string; description: string; icon: string }> {
  return [
    {
      id: 'solana',
      name: 'Solana',
      description: 'Fast & cheap transactions with Raydium DEX',
      icon: '◎',
    },
    {
      id: 'polygon',
      name: 'Polygon',
      description: 'Ethereum-compatible with ultra-low fees (~$0.01)',
      icon: '🔷',
    },
    {
      id: 'base',
      name: 'BASE',
      description: 'Coinbase L2 with Uniswap & Aerodrome DEXs',
      icon: '🔵',
    },
    {
      id: 'bnb',
      name: 'BNB Chain',
      description: 'Popular for memes with PancakeSwap & Biswap DEXs (~$0.50 fees)',
      icon: '🟡',
    },
    {
      id: 'bitcoin',
      name: 'Bitcoin',
      description: 'BRC-20 inscriptions like PEPE & ORDI with Unisat wallet',
      icon: '₿',
    },
    {
      id: 'arbitrum',
      name: 'Arbitrum',
      description: 'Ethereum L2 with 95% lower fees & Uniswap V3',
      icon: '🔺',
    },
    {
      id: 'tron',
      name: 'TRON',
      description: 'Ultra-low fees (~$0.10) with TRC-20 tokens & JustSwap',
      icon: '🔴',
    },
    {
      id: 'hyperliquid',
      name: 'HYPER LIQUID',
      description: 'Bitcoin L2 with native order book and HYPE token',
      icon: 'HL',
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