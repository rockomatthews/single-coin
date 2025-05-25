'use client';

// Add Phantom wallet type declaration
declare global {
  interface Window {
    phantom?: {
      solana?: {
        request: (args: { 
          method: string; 
          params: Record<string, unknown>
        }) => Promise<unknown>;
      };
    };
  }
}

import { useState, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { createVerifiedToken, uploadMetadata, TokenParams, revokeTokenAuthorities } from '../utils/solana';
import { createLiquidityPool } from '../utils/raydium';
import { createTokenMetadata } from '../utils/metaplex';

/**
 * Add token to Phantom wallet using a direct SPL approach
 * @param tokenAddress The mint address of the token to add
 */
async function addTokenToPhantomWallet(tokenAddress: string): Promise<void> {
  try {
    // Check if Phantom wallet is available 
    if (!window.phantom?.solana) {
      console.log('Phantom wallet extension not found');
      return;
    }
    
    console.log('Adding token to Phantom wallet:', tokenAddress);
    
    // Simplified approach - just try the most reliable method
    try {
      await window.phantom.solana.request({
        method: 'wallet_importSPLToken',
        params: {
          mintAddress: tokenAddress
        }
      });
      console.log('Token successfully added to wallet');
      return;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // If that fails, try the fallback method
      try {
        await window.phantom.solana.request({
          method: 'wallet_importAsset',
          params: {
            address: tokenAddress
          }
        });
        console.log('Token successfully added to wallet via fallback method');
        return;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (fallbackError) {
        console.log('Automatic token import failed - wallet will detect token automatically');
        // This is fine - the token still exists and will show up in transactions
      }
    }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    console.log('Token created successfully, but could not be automatically added to wallet');
    // Don't throw - allow token creation to succeed even if wallet add fails
  }
}

interface TokenCreationState {
  isCreating: boolean;
  error: string | null;
  tokenAddress: string | null;
  success: boolean;
  poolTxId?: string | null;
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
      // Debug output the wallet for inspection
      console.log('Using wallet for token creation:', {
        publicKey: publicKey.toString(),
        hasSignTransaction: !!signTransaction,
        hasSignAllTransactions: !!signAllTransactions,
      });

      // Create wallet adapter for SPL token operations
      const wallet = {
        publicKey, 
        signTransaction,
        signAllTransactions,
      };
      
      // Calculate token distribution
      const retentionPercentage = tokenData.retentionPercentage || 50;
      const totalSupply = tokenData.supply;
      const retainedAmount = tokenData.retainedAmount || 
                          Math.floor(totalSupply * (retentionPercentage / 100));
      const liquidityAmount = tokenData.liquidityAmount || 
                            (totalSupply - retainedAmount);
      
      // Upload metadata to Pinata
      console.log('Uploading metadata to Pinata with:', tokenData);
      const metadataUri = await uploadMetadata(connection, tokenData);
      
      console.log('Creating token with metadata URI:', metadataUri);
      
      try {
        // 1. Create token WITHOUT revoking authorities yet
        const tokenAddress = await createVerifiedToken(
          connection, 
          wallet, 
          metadataUri, 
          {
            ...tokenData,
            retentionPercentage,
            retainedAmount,
            liquidityAmount,
            uri: metadataUri  // Pass the metadata URI to the token params
          }
        );
        
        if (!tokenAddress) {
          throw new Error('Failed to create token - no token address returned');
        }
        
        console.log('Token created successfully with address:', tokenAddress);
        
        // 2. Create proper on-chain metadata using Metaplex (while still having mint authority)
        try {
          const metadataTxId = await createTokenMetadata(
            connection,
            wallet,
            tokenAddress,
            {
              ...tokenData,
              uri: metadataUri
            }
          );
          console.log('Created on-chain Metaplex metadata, txId:', metadataTxId);
        } catch (metaplexError) {
          console.error('Error creating Metaplex metadata:', metaplexError);
          // Continue with the process even if Metaplex fails
        }
        
        // 3. NOW revoke authorities after metadata is created
        try {
          const revokeTxId = await revokeTokenAuthorities(
            connection,
            wallet,
            tokenAddress,
            tokenData
          );
          if (revokeTxId) {
            console.log('Token authorities revoked, txId:', revokeTxId);
          }
        } catch (revokeError) {
          console.error('Error revoking authorities:', revokeError);
          // Continue even if revocation fails - the token was still created
        }
        
        // 4. Automatically add token to wallet
        await addTokenToPhantomWallet(tokenAddress);
        
        // 5. Create Raydium liquidity pool if requested
        let poolTxId = null;
        if (tokenData.createPool && tokenData.liquiditySolAmount && tokenData.liquiditySolAmount > 0) {
          try {
            console.log(`Creating Raydium liquidity pool with ${liquidityAmount} tokens and ${tokenData.liquiditySolAmount} SOL`);
            
            poolTxId = await createLiquidityPool(
              connection,
              wallet,
              tokenAddress,
              liquidityAmount,
              tokenData.liquiditySolAmount,
              true // Send fee to fee recipient
            );
            
            console.log('Liquidity pool created with txId:', poolTxId);
          } catch (poolError) {
            console.error('Error creating liquidity pool:', poolError);
            // Continue even if pool creation fails - the token was still created
          }
        }
        
        // 6. Save token to database
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
            poolTxId, // Include pool transaction ID if available
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
          poolTxId,
        });
        
        return {
          tokenAddress,
          poolTxId,
        };
      } catch (tokenError) {
        console.error('Error in token creation step:', tokenError);
        if (tokenError instanceof Error) {
          console.error('Detailed error:', tokenError.message);
          console.error('Error stack:', tokenError.stack);
        }
        throw tokenError;
      }
    } catch (error) {
      console.error('Error creating token:', error);
      
      setState({
        isCreating: false,
        error: (error as Error).message || 'Failed to create token',
        tokenAddress: null,
        success: false,
        poolTxId: null,
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