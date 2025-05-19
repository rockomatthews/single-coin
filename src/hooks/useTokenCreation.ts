'use client';

import { useState, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { TokenParams, createVerifiedToken, uploadMetadata } from '@/utils/solana';
import { Metaplex } from '@metaplex-foundation/js';

interface TokenCreationState {
  isCreating: boolean;
  error: string | null;
  tokenAddress: string | null;
  success: boolean;
}

export function useTokenCreation() {
  const { connection } = useConnection();
  const { publicKey, signTransaction, signAllTransactions } = useWallet();
  const [state, setState] = useState<TokenCreationState>({
    isCreating: false,
    error: null,
    tokenAddress: null,
    success: false,
  });

  // Reset state
  const resetState = useCallback(() => {
    setState({
      isCreating: false,
      error: null,
      tokenAddress: null,
      success: false,
    });
  }, []);

  // Create token
  const createToken = useCallback(async (tokenData: TokenParams) => {
    if (!publicKey || !signTransaction || !signAllTransactions) {
      setState({
        ...state,
        error: 'Wallet not connected or missing signing capabilities',
      });
      return null;
    }

    setState({
      ...state,
      isCreating: true,
      error: null,
    });

    try {
      // 1. Create wallet adapter for metaplex
      const wallet = {
        publicKey,
        signTransaction,
        signAllTransactions,
      };

      // 2. Create Metaplex instance
      const metaplex = new Metaplex(connection);
      
      // 3. Upload metadata to Pinata
      console.log('Uploading metadata to Pinata with:', tokenData);
      const metadataUri = await uploadMetadata(metaplex, tokenData);
      
      // Calculate token distribution
      const retentionPercentage = tokenData.retentionPercentage || 50;
      const totalSupply = tokenData.supply;
      const retainedAmount = tokenData.retainedAmount || 
                             Math.floor(totalSupply * (retentionPercentage / 100));
      const liquidityAmount = tokenData.liquidityAmount || 
                              (totalSupply - retainedAmount);
      
      console.log('Creating token with metadata URI:', metadataUri);
      
      // 4. Create token with metadata
      const tokenAddress = await createVerifiedToken(
        connection, 
        wallet, 
        metadataUri, 
        {
          ...tokenData,
          retentionPercentage,
          retainedAmount,
          liquidityAmount
        }
      );
      
      // 5. Save token to database
      const response = await fetch('/api/create-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAddress: publicKey.toString(),
          tokenAddress,
          tokenData: {
            ...tokenData,
            retentionPercentage,
            retainedAmount,
            liquidityAmount
          },
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to save token details');
      }

      setState({
        isCreating: false,
        error: null,
        tokenAddress,
        success: true,
      });

      return tokenAddress;
    } catch (error) {
      console.error('Error creating token:', error);
      setState({
        isCreating: false,
        error: (error as Error).message || 'Failed to create token',
        tokenAddress: null,
        success: false,
      });
      return null;
    }
  }, [connection, publicKey, signTransaction, signAllTransactions, state]);

  return {
    ...state,
    createToken,
    resetState,
  };
} 