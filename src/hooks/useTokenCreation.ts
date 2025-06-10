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
import { createRaydiumCpmmPool } from '../utils/raydium-v2';
import { createTokenSecurely, finalizeTokenSecurity } from '../utils/secure-token-creation';
import { performSecurityAssessment, getSecurityBadge } from '../utils/goplus-security';

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
        // 🔒 STEP 1: Create token securely - only mint retention amount to user
        console.log('🔒 SECURE TOKEN CREATION: Using secure workflow');
        const secureResult = await createTokenSecurely(
          connection,
          wallet,
          {
            ...tokenData,
            retentionPercentage,
            retainedAmount,
            liquidityAmount,
            uri: metadataUri
          }
        );
        
        if (!secureResult.mintAddress) {
          throw new Error('Failed to create token - no token address returned');
        }
        
        const tokenAddress = secureResult.mintAddress;
        console.log('✅ Token created securely with address:', tokenAddress);
        console.log(`📊 User received: ${secureResult.userTokenAmount.toLocaleString()} tokens`);
        console.log(`🏊 Reserved for liquidity: ${secureResult.liquidityTokenAmount.toLocaleString()} tokens`);
        
        // 🔒 STEP 2: Create proper on-chain metadata using Metaplex (while still having mint authority)
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
          console.log('✅ Created on-chain Metaplex metadata, txId:', metadataTxId);
        } catch (metaplexError) {
          console.error('❌ Error creating Metaplex metadata:', metaplexError);
          // Continue with the process even if Metaplex fails
        }
        
        // 🔒 STEP 3: Automatically add token to wallet
        await addTokenToPhantomWallet(tokenAddress);
        
        // 🔒 STEP 4: Create Raydium liquidity pool if requested (while still having mint authority)
        let poolTxId = null;
        if (tokenData.createPool && tokenData.liquiditySolAmount && tokenData.liquiditySolAmount > 0) {
          try {
            // Check for Token Extensions compatibility with Raydium
            if (tokenData.decimals === 0) {
              console.log('⚠️ Skipping Raydium pool creation for 0-decimal FungibleAsset token');
              console.log('🔍 0-decimal tokens use Token Extensions program, which is incompatible with Raydium CPMM');
              console.log('💡 Consider using 9 decimals for Raydium compatibility, or manually create pools later');
              
              // Still send the fee since user paid for it
              const totalCost = calculateTotalCost(retentionPercentage, tokenData.liquiditySolAmount);
              const feeToRecipient = totalCost * 0.03;
              
              // Send fee to recipient
              const FEE_RECIPIENT_ADDRESS = process.env.NEXT_PUBLIC_FEE_RECIPIENT_ADDRESS;
              if (FEE_RECIPIENT_ADDRESS) {
                try {
                  const { SystemProgram, Transaction, LAMPORTS_PER_SOL, PublicKey, ComputeBudgetProgram } = await import('@solana/web3.js');
                  
                  const feeTransaction = new Transaction();
                  
                  // Add compute budget for Phantom's Lighthouse guard instructions
                  feeTransaction.add(
                    ComputeBudgetProgram.setComputeUnitLimit({ units: 400000 }),
                    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 50000 })
                  );
                  
                  feeTransaction.add(
                    SystemProgram.transfer({
                      fromPubkey: wallet.publicKey,
                      toPubkey: new PublicKey(FEE_RECIPIENT_ADDRESS),
                      lamports: Math.floor(feeToRecipient * LAMPORTS_PER_SOL),
                    })
                  );
                  
                  const { blockhash } = await connection.getLatestBlockhash();
                  feeTransaction.recentBlockhash = blockhash;
                  feeTransaction.feePayer = wallet.publicKey;
                  
                  // Check if Phantom wallet is available for signAndSendTransaction
                  const isPhantomAvailable = window.phantom?.solana?.signAndSendTransaction;
                  console.log('Phantom wallet available for fee transaction:', !!isPhantomAvailable);
                  
                  let feeTxId: string;
                  
                  if (isPhantomAvailable) {
                    console.log('Using Phantom signAndSendTransaction for fee payment');
                    // Use Phantom's signAndSendTransaction method
                    const result = await window.phantom!.solana!.signAndSendTransaction(feeTransaction);
                    feeTxId = result.signature;
                    console.log(`✅ Platform fee sent via signAndSendTransaction (pool creation skipped): ${feeTxId}`);
                  } else {
                    console.log('Falling back to signTransaction + sendRawTransaction for fee payment');
                    // Fallback to the old method
                    const signedFeeTx = await wallet.signTransaction(feeTransaction);
                    feeTxId = await connection.sendRawTransaction(signedFeeTx.serialize());
                    console.log(`✅ Platform fee sent via fallback method (pool creation skipped): ${feeTxId}`);
                  }
                  
                  await connection.confirmTransaction(feeTxId);
                } catch (feeError) {
                  console.error('❌ Error sending fee:', feeError);
                }
              }
              
              // 🔒 STEP 5: Revoke authorities since we're not creating a pool
              try {
                const revokeTxId = await finalizeTokenSecurity(
                  connection,
                  wallet,
                  tokenAddress,
                  true, // Revoke mint authority
                  true  // Revoke freeze authority
                );
                console.log('✅ Token authorities revoked (no pool creation), txId:', revokeTxId);
              } catch (revokeError) {
                console.error('❌ Error revoking authorities:', revokeError);
                // Continue even if revocation fails
              }
            } else {
              console.log(`🔒 Creating Raydium liquidity pool with ${secureResult.liquidityTokenAmount.toLocaleString()} tokens and ${tokenData.liquiditySolAmount} SOL`);
              
              // Calculate the TOTAL cost that user pays through Phantom
              const totalCost = calculateTotalCost(retentionPercentage, tokenData.liquiditySolAmount);
              console.log(`Total cost shown to user: ${totalCost.toFixed(4)} SOL`);
              
              // Fee to recipient should be 3% of TOTAL cost, not the entire platform fee
              const feeToRecipient = totalCost * 0.03;
              console.log(`Fee to recipient (3% of total): ${feeToRecipient.toFixed(4)} SOL`);
              console.log(`Remaining for liquidity + Raydium fees: ${(totalCost - feeToRecipient).toFixed(4)} SOL`);
              
              // 🔒 CRITICAL: Create pool with secure token creation parameters
              poolTxId = await createRaydiumCpmmPool(
                connection,
                wallet,
                tokenAddress,
                secureResult.liquidityTokenAmount, // Use the calculated liquidity amount
                totalCost, // Pass total cost as solAmount (what user pays)
                true, // Send fee to fee recipient
                feeToRecipient, // Pass 3% of total cost as the fee
                retentionPercentage, // 🚨 CRITICAL FIX: Pass retention percentage for proper pricing!
                // NEW: Pass secure token creation parameters
                {
                  mintKeypair: secureResult.mintKeypair,
                  tokenDecimals: tokenData.decimals,
                  shouldMintLiquidity: true, // Mint liquidity tokens to pool
                  shouldRevokeAuthorities: true, // Revoke authorities after pool creation
                }
              );
              
              console.log('✅ Liquidity pool created with secure workflow, txId:', poolTxId);
            }
          } catch (poolError) {
            console.error('❌ Error creating liquidity pool:', poolError);
            
            // If pool creation fails, still revoke authorities
            try {
              const revokeTxId = await finalizeTokenSecurity(
                connection,
                wallet,
                tokenAddress,
                true, // Revoke mint authority
                true  // Revoke freeze authority
              );
              console.log('✅ Token authorities revoked after pool creation failure, txId:', revokeTxId);
            } catch (revokeError) {
              console.error('❌ Error revoking authorities after pool failure:', revokeError);
            }
            
            // Continue even if pool creation fails - the token was still created securely
          }
        } else {
          // No pool requested - revoke authorities now
          try {
            const revokeTxId = await finalizeTokenSecurity(
              connection,
              wallet,
              tokenAddress,
              true, // Revoke mint authority
              true  // Revoke freeze authority
            );
            console.log('✅ Token authorities revoked (no pool requested), txId:', revokeTxId);
          } catch (revokeError) {
            console.error('❌ Error revoking authorities:', revokeError);
            // Continue even if revocation fails
          }
        }
        
        // 🔒 STEP 6: Save token to database
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
          poolTxId,
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