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
      
      // Check network type
      const genesisHash = await connection.getGenesisHash();
      console.log('Connected to network with genesis hash:', genesisHash);
      console.log('Using Solana network:', process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'undefined');
      console.log('Using RPC URL:', process.env.NEXT_PUBLIC_SOLANA_RPC_URL ? process.env.NEXT_PUBLIC_SOLANA_RPC_URL.substring(0, 30) + '...' : 'undefined');
      
      // Check wallet balance
      const balance = await connection.getBalance(publicKey);
      console.log('Wallet balance:', balance / 1e9, 'SOL');
      
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
      
      if (!tokenAddress) {
        throw new Error('Failed to create token - no token address returned');
      }
      
      console.log('Token created successfully with address:', tokenAddress);
      console.log('Saving token to database...');
      
      // 5. Save token to database
      try {
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
          console.error('Database save failed:', data.error);
          // Continue even if database save fails - token was still created
          console.warn('Token was created but failed to save to database. It might not appear in your "My Tokens" list.');
        } else {
          console.log('Token saved to database successfully');
        }
      } catch (dbError) {
        console.error('Error saving to database:', dbError);
        // Continue even if database save fails
      }

      setState({
        isCreating: false,
        error: null,
        tokenAddress,
        success: true,
      });
      
      console.log('Token creation process completed successfully!');
      
      return tokenAddress;
    } catch (error) {
      console.error('Error creating token:', error);
      
      // Enhanced error reporting
      let errorMessage = (error as Error).message || 'Failed to create token';
      
      // Add more context to common errors
      if (errorMessage.includes('AccountNotFound')) {
        errorMessage = 'Token account not found. This may be due to network issues or insufficient funds. Please ensure your wallet has SOL and you are connected to the correct network.';
      } else if (errorMessage.includes('insufficient funds')) {
        errorMessage = 'Insufficient SOL in your wallet to create the token. Please add more SOL to your wallet.';
      } else if (errorMessage.includes('network')) {
        errorMessage = 'Network error when creating the token. Please check your internet connection and try again.';
      }
      
      setState({
        isCreating: false,
        error: errorMessage,
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