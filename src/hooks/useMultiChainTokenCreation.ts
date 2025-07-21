'use client';

import { useState, useCallback } from 'react';
import { 
  UnifiedTokenParams, 
  TokenCreationResult, 
  getBlockchainProvider 
} from '../utils/blockchain-factory';
import { saveMultiChainToken } from '../utils/database';

interface MultiChainTokenCreationState {
  isCreating: boolean;
  error: string | null;
  result: TokenCreationResult | null;
  progress: {
    step: number;
    totalSteps: number;
    currentAction: string;
  };
}

export function useMultiChainTokenCreation() {
  const [state, setState] = useState<MultiChainTokenCreationState>({
    isCreating: false,
    error: null,
    result: null,
    progress: {
      step: 0,
      totalSteps: 5,
      currentAction: '',
    },
  });

  const updateProgress = useCallback((step: number, action: string) => {
    setState(prev => ({
      ...prev,
      progress: {
        ...prev.progress,
        step,
        currentAction: action,
      },
    }));
  }, []);

  const createToken = useCallback(async (params: UnifiedTokenParams, signerOrAddress?: any): Promise<TokenCreationResult | null> => {
    if (state.isCreating) {
      console.warn('Token creation already in progress');
      return null;
    }

    setState({
      isCreating: true,
      error: null,
      result: null,
      progress: {
        step: 0,
        totalSteps: 5,
        currentAction: 'Initializing...',
      },
    });

    try {
      updateProgress(1, 'Validating parameters...');
      
      // Get the appropriate blockchain provider
      const provider = getBlockchainProvider(params.blockchain);
      
      // Validate parameters
      const validation = provider.validateParams(params);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }
      
      updateProgress(2, 'Uploading metadata to IPFS...');
      
      // Upload metadata
      const metadataUri = await provider.uploadMetadata(params);
      console.log(`✅ Metadata uploaded: ${metadataUri}`);
      
      updateProgress(3, `Creating ${params.blockchain} token...`);
      
      // Create the token
      const result = await provider.createToken(params, signerOrAddress);
      
      if (!result.success) {
        throw new Error(result.error || 'Token creation failed');
      }
      
      updateProgress(4, 'Saving to database...');
      
      // Determine user address - if signer object, get address from it, otherwise use as address
      let userAddress: string;
      if (signerOrAddress && typeof signerOrAddress === 'object' && signerOrAddress.getAddress) {
        // It's a signer object (like ethers JsonRpcSigner)
        userAddress = await signerOrAddress.getAddress();
      } else if (typeof signerOrAddress === 'string') {
        // It's already an address string
        userAddress = signerOrAddress;
      } else {
        userAddress = 'UNKNOWN_USER';
      }
      
      // Save to database
      await saveMultiChainToken({
        userAddress,
        tokenAddress: result.tokenAddress!,
        tokenName: params.name,
        tokenSymbol: params.symbol,
        tokenImage: params.image,
        tokenDescription: params.description,
        website: params.website,
        twitter: params.twitter,
        telegram: params.telegram,
        discord: params.discord,
        metadataUri,
        decimals: params.blockchain === 'solana' 
          ? (params.solana?.decimals || 9)
          : params.blockchain === 'hyperliquid'
          ? (params.hyperliquid?.szDecimals || 6)
          : params.blockchain === 'polygon'
          ? (params.polygon?.decimals || 18)
          : params.blockchain === 'base'
          ? (params.base?.decimals || 18)
          : params.blockchain === 'rsk'
          ? (params.rsk?.decimals || 18)
          : params.blockchain === 'arbitrum'
          ? (params.arbitrum?.decimals || 18)
          : (params.tron?.decimals || 6), // TRON default 6 decimals
        supply: params.blockchain === 'solana'
          ? (params.solana?.supply || 1000000000)
          : params.blockchain === 'hyperliquid'
          ? (params.hyperliquid?.maxSupply || 1000000000)
          : params.blockchain === 'polygon'
          ? (params.polygon?.totalSupply || 1000000)
          : params.blockchain === 'base'
          ? (params.base?.totalSupply || 1000000)
          : params.blockchain === 'rsk'
          ? (params.rsk?.totalSupply || 1000000)
          : params.blockchain === 'arbitrum'
          ? (params.arbitrum?.totalSupply || 1000000)
          : (params.tron?.totalSupply || 1000000), // TRON default 1M tokens
        retentionPercentage: params.retentionPercentage,
        retainedAmount: params.retainedAmount,
        liquidityAmount: params.liquidityAmount,
        blockchain: params.blockchain,
        network: params.blockchain === 'solana' 
          ? (process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet')
          : params.blockchain === 'hyperliquid'
          ? (process.env.NEXT_PUBLIC_HYPERLIQUID_NETWORK || 'testnet')
          : 'mainnet', // Polygon, BASE, RSK, Arbitrum, and TRON mainnet
        chainSpecificData: params.blockchain === 'solana' 
          ? params.solana 
          : params.blockchain === 'hyperliquid'
          ? params.hyperliquid
          : params.blockchain === 'polygon'
          ? params.polygon
          : params.blockchain === 'base'
          ? params.base
          : params.blockchain === 'rsk'
          ? params.rsk
          : params.blockchain === 'arbitrum'
          ? params.arbitrum
          : params.tron,
        tokenStandard: params.blockchain === 'solana' 
          ? 'SPL' 
          : params.blockchain === 'hyperliquid'
          ? (params.hyperliquid?.tokenStandard || 'HIP-1')
          : params.blockchain === 'tron'
          ? (params.tron?.tokenStandard || 'TRC-20')
          : 'ERC-20', // Polygon, BASE, RSK, and Arbitrum use ERC-20
        poolTxId: result.poolTxId || undefined,
        explorerUrl: result.explorer_url,
      });
      
      updateProgress(5, 'Token created successfully!');
      
      setState({
        isCreating: false,
        error: null,
        result,
        progress: {
          step: 5,
          totalSteps: 5,
          currentAction: 'Complete!',
        },
      });
      
      return result;
    } catch (error) {
      console.error('Multi-chain token creation failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      setState({
        isCreating: false,
        error: errorMessage,
        result: null,
        progress: {
          step: 0,
          totalSteps: 5,
          currentAction: 'Failed',
        },
      });
      
      return null;
    }
  }, [state.isCreating, updateProgress]);

  const resetState = useCallback(() => {
    setState({
      isCreating: false,
      error: null,
      result: null,
      progress: {
        step: 0,
        totalSteps: 5,
        currentAction: '',
      },
    });
  }, []);

  const calculateCosts = useCallback((params: UnifiedTokenParams) => {
    try {
      const provider = getBlockchainProvider(params.blockchain);
      return provider.calculateCosts(params);
    } catch (error) {
      console.error('Error calculating costs:', error);
      return {
        platformFee: 0,
        deploymentFee: 0,
        total: 0,
        currency: 'Unknown',
        breakdown: {},
      };
    }
  }, []);

  return {
    ...state,
    createToken,
    resetState,
    calculateCosts,
  };
}

// HYPER LIQUID specific hook for additional functionality
export function useHyperLiquidCreation() {
  const multiChain = useMultiChainTokenCreation();
  
  const createHyperLiquidToken = useCallback(async (params: Omit<UnifiedTokenParams, 'blockchain'>) => {
    const hyperLiquidParams: UnifiedTokenParams = {
      ...params,
      blockchain: 'hyperliquid',
      hyperliquid: {
        tokenStandard: 'HIP-1',
        szDecimals: 6,
        weiDecimals: 18,
        maxSupply: 1000000000,
        enableHyperliquidity: false,
        initialPrice: 1.0,
        orderSize: 1000,
        numberOfOrders: 10,
        maxGas: 5000,
        ...params.hyperliquid,
      },
    };
    
    return multiChain.createToken(hyperLiquidParams);
  }, [multiChain]);
  
  const calculateHyperLiquidFee = useCallback((
    maxGas: number = 5000,
    auctionStartTime?: Date
  ) => {
    const { calculateHyperLiquidFee } = require('../utils/hyperliquid');
    return calculateHyperLiquidFee(maxGas, auctionStartTime);
  }, []);
  
  return {
    ...multiChain,
    createHyperLiquidToken,
    calculateHyperLiquidFee,
  };
}