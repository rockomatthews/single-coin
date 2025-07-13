'use client';

// Global type declaration for Phantom wallet
declare global {
  interface Window {
    phantom?: {
      solana?: {
        isPhantom?: boolean;
        publicKey?: { toBuffer(): Buffer; toString(): string };
        isConnected: boolean;
        signTransaction: (transaction: any) => Promise<any>;
        signAllTransactions: (transactions: any[]) => Promise<any[]>;
        signAndSendTransaction: (transaction: any) => Promise<{ signature: string }>;
        signMessage: (message: Uint8Array) => Promise<{ signature: Uint8Array }>;
        connect: () => Promise<{ publicKey: any }>;
        disconnect: () => Promise<void>;
        on: (event: string, callback: () => void) => void;
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
import { uploadMetadata, TokenParams, calculateTotalCost } from '../utils/solana';
import { createTokenMetadata } from '../utils/metaplex';
import { createDirectTokenLiquidity } from '../utils/direct-pool-creation';
import { createTokenPhantomFriendly, mintTokensToAddress, revokeAuthorities, displayTransactionSummary } from '../utils/phantom-friendly';
import { performSecurityAssessment, getSecurityBadge } from '../utils/goplus-security';
import { PublicKey } from '@solana/web3.js';

/**
 * Verify token appears in user's wallet by checking balance
 * @param connection Solana connection
 * @param tokenAddress The mint address of the token
 * @param userPublicKey User's wallet public key
 */
async function verifyTokenInWallet(
  connection: any, 
  tokenAddress: string, 
  userPublicKey: any
): Promise<void> {
  try {
    console.log('🔍 Verifying token appears in your Phantom wallet...');
    
    // Get the user's Associated Token Account
    const { getAssociatedTokenAddress } = await import('@solana/spl-token');
    const { PublicKey } = await import('@solana/web3.js');
    const userATA = await getAssociatedTokenAddress(
      new PublicKey(tokenAddress),
      userPublicKey
    );
    
    // Check the token balance
    const tokenBalance = await connection.getTokenAccountBalance(userATA);
    const amount = tokenBalance.value.uiAmount || 0;
    
    if (amount > 0) {
      console.log(`✅ SUCCESS! Token automatically appeared in your wallet!`);
      console.log(`💰 Your balance: ${amount.toLocaleString()} tokens`);
      console.log(`🎯 Token Address: ${tokenAddress}`);
      console.log(`🏠 Your Token Account: ${userATA.toString()}`);
      console.log('');
      console.log('🎉 The token should now be visible in your Phantom wallet!');
      console.log('📱 Check your wallet\'s token list or refresh if needed.');
    } else {
      console.log('⚠️ Token account exists but balance is 0');
    }
  } catch (error) {
    console.log('ℹ️ Token verification skipped (token should still appear in wallet)');
    // Don't throw - this is just verification, not critical
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
  const createToken = useCallback(async (tokenData: TokenParams): Promise<{
    tokenAddress: string;
    poolTxId: string | null;
  } | null> => {
    if (!publicKey || !signTransaction) {
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

      // 🛡️ STEP 0: GOPLUS SECURITY PRE-CHECK
      console.log('🛡️ GoPlus: Performing pre-creation security assessment...');
      const FEE_RECIPIENT_ADDRESS = process.env.NEXT_PUBLIC_FEE_RECIPIENT_ADDRESS;
      
      const preSecurityAssessment = await performSecurityAssessment({
        userAddress: publicKey.toString(),
        feeRecipientAddress: FEE_RECIPIENT_ADDRESS || undefined,
      });
      
      const securityBadge = getSecurityBadge(preSecurityAssessment);
      console.log(`🛡️ GoPlus: Pre-creation security status: ${securityBadge.icon} ${securityBadge.text}`);
      
      if (preSecurityAssessment.warnings.length > 0) {
        console.warn('⚠️ GoPlus Security Warnings:', preSecurityAssessment.warnings);
      }
      
      // Block creation if critical security issues are found
      if (preSecurityAssessment.riskLevel === 'CRITICAL') {
        throw new Error(`🛑 Security Check Failed: ${preSecurityAssessment.warnings.join('. ')}`);
      }

      // Create wallet adapter for SPL token operations with guaranteed signAllTransactions
      const wallet = {
        publicKey, 
        signTransaction,
        signAllTransactions: signAllTransactions ? 
          (async (transactions: any[]) => {
            const result = await signAllTransactions(transactions);
            return result as any[];
          }) : 
          (async (transactions: any[]) => {
            // If signAllTransactions is not available, sign them one by one
            const signedTransactions = [];
            for (const transaction of transactions) {
              const signedTx = await signTransaction(transaction);
              signedTransactions.push(signedTx);
            }
            return signedTransactions;
          }),
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
      
      // IMPORTANT: Extract the image URL from the uploaded metadata
      // The uploadMetadata function converts base64 images to IPFS URLs
      // We need to get this IPFS URL for the database instead of the base64 data
      let finalImageUrl = tokenData.image;
      
      // If the original image was base64 or blob, it was uploaded to IPFS
      // We need to fetch the metadata to get the actual IPFS image URL
      if (tokenData.image.startsWith('data:') || tokenData.image.startsWith('blob:')) {
        try {
          const metadataResponse = await fetch(metadataUri);
          const metadata = await metadataResponse.json();
          if (metadata.image) {
            finalImageUrl = metadata.image;
            console.log('Updated image URL from metadata:', finalImageUrl);
          }
        } catch (error) {
          console.log('Could not extract image URL from metadata, using original');
        }
      }
      
      console.log('Creating token with metadata URI:', metadataUri);
      
      try {
        // 🚀 STEP 1: Create token using ATOMIC transaction pattern (pump.fun style)
        console.log('🚀 ATOMIC TOKEN CREATION: Professional single-transaction approach');
        console.log('🎯 This mirrors pump.fun and coinfactory.app patterns for maximum Phantom compatibility');
        
        // Import the new atomic creation function
        const { createAtomicToken } = await import('../utils/solana');
        
        // Calculate token distribution
        const retainedAmount = tokenData.retainedAmount || 
                              Math.floor(tokenData.supply * (retentionPercentage / 100));
        const liquidityAmount = tokenData.liquidityAmount || 
                              (tokenData.supply - retainedAmount);
        
        // Calculate platform fee
        const { calculateFee } = await import('../utils/solana');
        const platformFee = calculateFee(retentionPercentage);
        const FEE_RECIPIENT_ADDRESS = process.env.NEXT_PUBLIC_FEE_RECIPIENT_ADDRESS;
        
        console.log(`💰 Platform fee: ${platformFee.toFixed(4)} SOL (included in atomic transaction)`);
        
        // Execute atomic token creation with integrated fee payment
        const tokenAddress = await createAtomicToken(
          connection,
          wallet,
          metadataUri,
          {
            ...tokenData,
            retentionPercentage,
            retainedAmount,
            liquidityAmount,
            revokeUpdateAuthority: true,
            revokeFreezeAuthority: true,
            revokeMintAuthority: true
          },
          platformFee,
          FEE_RECIPIENT_ADDRESS
        );
        
        if (!tokenAddress) {
          throw new Error('Failed to create token - no token address returned');
        }
        
        console.log('✅ ATOMIC token creation completed successfully!');
        console.log('🛡️ Token is immediately secure: unmintable, unfreezable, immutable metadata');
        console.log(`🎯 Token address: ${tokenAddress}`);
        console.log(`📊 User received: ${retainedAmount.toLocaleString()} tokens`);
        console.log(`🏊 Reserved for liquidity: ${liquidityAmount.toLocaleString()} tokens`);
        
        // Create mock result for compatibility with existing flow
        const secureResult = {
          mintAddress: tokenAddress,
          userTokenAmount: retainedAmount,
          liquidityTokenAmount: liquidityAmount
        };
        
        // 🔒 STEP 2: Automatically verify token in wallet
        await verifyTokenInWallet(connection, tokenAddress, publicKey);
        
        // 🔒 STEP 3: Handle pool creation (authorities already revoked, fee already paid)
        let poolTxId = null;
        
        if (tokenData.createPool && tokenData.liquiditySolAmount && tokenData.liquiditySolAmount > 0) {
          try {
            const raydiumFees = 0.154; // Fixed Raydium costs
            const totalPoolCost = tokenData.liquiditySolAmount + raydiumFees;
            
            // Check for Token Extensions compatibility with Raydium
            if (tokenData.decimals === 0) {
              console.log('⚠️ Skipping Raydium pool creation for 0-decimal FungibleAsset token');
              console.log('🔍 0-decimal tokens use Token Extensions program, which is incompatible with Raydium CPMM');
              console.log('💡 Consider using 9 decimals for Raydium compatibility, or manually create pools later');
              console.log('✅ Platform fee already paid atomically - token fully secured');
            } else {
              console.log('⚠️ CRITICAL: Pool creation requested but authorities already revoked by atomic transaction');
              console.log('❌ Cannot create pools for tokens with revoked mint authority');
              console.log('💡 SOLUTION: To create pools, tokens need temporary mint authority for liquidity token creation');
              console.log('🔄 Consider using legacy token creation for pool-enabled tokens');
              console.log('✅ Platform fee already paid atomically - no additional charges');
              console.log('🛡️ Token is fully secured - consider manual pool creation on DEXes');
              console.log(`🔗 Manual trading: https://jup.ag/swap/SOL-${tokenAddress}`);
            }
          } catch (poolError) {
            console.error('❌ Error in pool creation flow:', poolError);
            console.log('🛡️ Token authorities already revoked by atomic transaction - token remains secure');
            // Continue even if pool creation fails - the token was still created securely
          }
        } else {
          console.log('✅ No pool requested - token creation completed');
          console.log('✅ Platform fee already paid atomically');
          console.log('🛡️ Token authorities already revoked by atomic transaction - fully secured');
        }
        
        // 🔒 STEP 4: Save token to database
        console.log('💾 Saving token to database...');
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
              image: finalImageUrl,
              retentionPercentage,
              retainedAmount: secureResult.userTokenAmount,
              liquidityAmount: secureResult.liquidityTokenAmount,
              metadataUri
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
          poolTxId: poolTxId ?? null, // 🔥 FIX: Ensure poolTxId is never undefined
        };
      } catch (tokenError) {
        console.error('Error in secure token creation:', tokenError);
        if (tokenError instanceof Error) {
          console.error('Detailed error:', tokenError.message);
          console.error('Error stack:', tokenError.stack);
          
          // Special handling for transaction timeout errors
          if (tokenError.message.includes('Transaction was not confirmed in') && 
              tokenError.message.includes('It is unknown if it succeeded or failed')) {
            // Extract the transaction signature from the error message
            const signatureMatch = tokenError.message.match(/Check signature ([A-Za-z0-9]+) using/);
            if (signatureMatch && signatureMatch[1]) {
              const signature = signatureMatch[1];
              console.log('Transaction timed out, checking status for signature:', signature);
              
              // Give it a moment for the transaction to potentially land
              await new Promise(resolve => setTimeout(resolve, 2000));
              
              // Check if the transaction actually succeeded
              try {
                const status = await connection.getSignatureStatus(signature);
                if (status.value?.confirmationStatus === 'confirmed' || 
                    status.value?.confirmationStatus === 'finalized') {
                  console.log('✅ Transaction confirmed despite timeout!');
                  console.log('The token creation likely succeeded. Transaction signature:', signature);
                  
                  // Show a more user-friendly error message
                  throw new Error(`Transaction timeout - but it may have succeeded! Check this transaction on Solscan: ${signature}\n\nThe network is congested, but your token might have been created. Please check your wallet.`);
                } else if (status.value === null) {
                  throw new Error(`Transaction not found on chain. The network might be congested. Please try again. Transaction: ${signature}`);
                } else {
                  throw new Error(`Transaction failed. Status: ${status.value.confirmationStatus || 'unknown'}. Transaction: ${signature}`);
                }
              } catch (statusError) {
                console.error('Error checking transaction status:', statusError);
                throw new Error(`Network timeout - transaction status unknown. Please check Solscan for transaction: ${signature}`);
              }
            }
          }
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