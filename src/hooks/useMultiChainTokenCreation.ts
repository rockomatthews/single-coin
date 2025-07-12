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

  const createToken = useCallback(async (params: UnifiedTokenParams): Promise<TokenCreationResult | null> => {
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
      const result = await provider.createToken(params);
      
      if (!result.success) {
        throw new Error(result.error || 'Token creation failed');
      }
      
      updateProgress(4, 'Saving to database...');
      
      // Save to database
      await saveMultiChainToken({
        userAddress: 'USER_ADDRESS', // TODO: Get from wallet context
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
          : (params.hyperliquid?.szDecimals || 6),
        supply: params.blockchain === 'solana'
          ? (params.solana?.supply || 1000000000)
          : (params.hyperliquid?.maxSupply || 1000000000),
        retentionPercentage: params.retentionPercentage,
        retainedAmount: params.retainedAmount,
        liquidityAmount: params.liquidityAmount,
        blockchain: params.blockchain,
        network: params.blockchain === 'solana' 
          ? (process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet')
          : (process.env.NEXT_PUBLIC_HYPERLIQUID_NETWORK || 'testnet'),
        chainSpecificData: params.blockchain === 'solana' ? params.solana : params.hyperliquid,
        tokenStandard: params.blockchain === 'solana' 
          ? 'SPL' 
          : (params.hyperliquid?.tokenStandard || 'HIP-1'),
        poolTxId: result.poolTxId,
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