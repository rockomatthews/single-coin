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
        // 🔒 STEP 1: Create token securely using Phantom-friendly approach
        console.log('🛡️ PHANTOM-FRIENDLY TOKEN CREATION: Using multiple simple transactions');
        const secureResult = await createTokenPhantomFriendly(
          connection,
          wallet,
          {
            decimals: tokenData.decimals,
            supply: tokenData.supply,
            retentionPercentage: retentionPercentage
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
        await verifyTokenInWallet(connection, tokenAddress, publicKey);
        
        // 🔒 STEP 4: Create Raydium liquidity pool if requested (while still having mint authority)
        let poolTxId = null;
        let totalCostToUser = 0; // 🔥 FIX: Declare in wider scope
        
        if (tokenData.createPool && tokenData.liquiditySolAmount && tokenData.liquiditySolAmount > 0) {
          try {
            // Calculate total costs for both paths
            const { calculateFee } = await import('../utils/solana');
            const platformFee = calculateFee(retentionPercentage);
            const raydiumFees = 0.154; // Fixed Raydium costs
            totalCostToUser = platformFee + tokenData.liquiditySolAmount + raydiumFees;
            
            // Check for Token Extensions compatibility with Raydium
            if (tokenData.decimals === 0) {
              console.log('⚠️ Skipping Raydium pool creation for 0-decimal FungibleAsset token');
              console.log('🔍 0-decimal tokens use Token Extensions program, which is incompatible with Raydium CPMM');
              console.log('💡 Consider using 9 decimals for Raydium compatibility, or manually create pools later');
              
              // Still send the fee since user paid for it
              const feeToRecipient = platformFee;
              
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
                      toPubkey: new PublicKey(FEE_RECIPIENT_ADDRESS!),
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
              
              // 🔒 ONLY revoke authorities AFTER fees are handled (no pool case)
              try {
                const revokeTxId = await revokeAuthorities(
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
            } else {
              console.log(`💳 CORRECT PAYMENT FLOW - TWO-STEP PAYMENT:`);
              console.log(`   Step 1 - Platform fee: ${platformFee.toFixed(4)} SOL (charged upfront)`);
              console.log(`   Step 2 - Pool funding: ${(tokenData.liquiditySolAmount + raydiumFees).toFixed(4)} SOL (charged during pool creation)`);
              console.log(`   TOTAL USER COST: ${totalCostToUser.toFixed(4)} SOL`);
              
              // 🔥 STEP 1: Charge user ONLY platform fee upfront
              console.log(`💰 Step 1: Charging ONLY platform fee upfront: ${platformFee.toFixed(4)} SOL`);
              console.log(`🎯 User keeps ${(tokenData.liquiditySolAmount + raydiumFees).toFixed(4)} SOL for pool creation`);
              
              const { SystemProgram, Transaction, LAMPORTS_PER_SOL, PublicKey, ComputeBudgetProgram } = await import('@solana/web3.js');
              
              const platformFeeTransaction = new Transaction();
              platformFeeTransaction.add(
                ComputeBudgetProgram.setComputeUnitLimit({ units: 400000 }),
                ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 50000 }),
                SystemProgram.transfer({
                  fromPubkey: wallet.publicKey,
                  toPubkey: new PublicKey(FEE_RECIPIENT_ADDRESS!),
                  lamports: Math.floor(platformFee * LAMPORTS_PER_SOL), // ONLY PLATFORM FEE
                })
              );
              
              const { blockhash } = await connection.getLatestBlockhash();
              platformFeeTransaction.recentBlockhash = blockhash;
              platformFeeTransaction.feePayer = wallet.publicKey;
              
              const isPhantomAvailable = window.phantom?.solana?.signAndSendTransaction;
              let platformFeeTxId: string;
              
              if (isPhantomAvailable) {
                console.log('💳 Charging platform fee via Phantom...');
                const result = await window.phantom!.solana!.signAndSendTransaction(platformFeeTransaction);
                platformFeeTxId = result.signature;
              } else {
                console.log('💳 Charging platform fee via wallet adapter...');
                const signedTx = await wallet.signTransaction(platformFeeTransaction);
                platformFeeTxId = await connection.sendRawTransaction(signedTx.serialize());
              }
              
              await connection.confirmTransaction(platformFeeTxId);
              console.log(`✅ PLATFORM FEE COLLECTED: ${platformFee.toFixed(4)} SOL - TxId: ${platformFeeTxId}`);
              console.log(`💰 User still has: ${(tokenData.liquiditySolAmount + raydiumFees).toFixed(4)} SOL for pool creation`);
              console.log(`🔄 Pool creation will now charge user the remaining ${(tokenData.liquiditySolAmount + raydiumFees).toFixed(4)} SOL`);
              
              // 🔒 STEP 5: Now create the actual pool using the collected funds
              console.log(`🏊 Step 2: Creating Raydium pool - payment already secured!`);
              
              const { createRaydiumCpmmPool } = await import('../utils/raydium-v2');
              
              const raydiumPoolTxId = await createRaydiumCpmmPool(
                connection,
                wallet,
                tokenAddress,
                secureResult.liquidityTokenAmount, // Tokens for pool
                tokenData.liquiditySolAmount, // User's SOL for liquidity - THEY NEED TO PAY THIS!
                true, // 🔥 FIX: Let Raydium charge user the liquidity + fees (we only collected platform fee)
                retentionPercentage, // Retention percentage for reference
                {
                  tokenDecimals: tokenData.decimals,
                  shouldMintLiquidity: true, // Need to mint liquidity tokens for pool
                  shouldRevokeAuthorities: false, // Will revoke after
                }
              );
              
              console.log('🎉 POOL CREATED SUCCESSFULLY WITH PROPER PAYMENT!');
              console.log(`✅ Payment Transaction: ${platformFeeTxId} (${platformFee.toFixed(4)} SOL collected)`);
              console.log(`✅ Pool Transaction: ${raydiumPoolTxId}`);
              console.log(`💰 User paid: ${totalCostToUser.toFixed(4)} SOL total`);
              console.log(`💰 Platform earned: ${platformFee.toFixed(4)} SOL`);
              console.log(`🏊 Pool funded with: ${secureResult.liquidityTokenAmount.toLocaleString()} tokens + ${tokenData.liquiditySolAmount} SOL`);
              console.log(`🔗 Trade on Jupiter: https://jup.ag/swap/SOL-${tokenAddress}`);
              console.log(`🔗 Trade on Raydium: https://raydium.io/swap/?inputCurrency=sol&outputCurrency=${tokenAddress}`);
              
              poolTxId = raydiumPoolTxId; // Use the actual pool creation transaction ID
            }
          } catch (poolError) {
            console.error('❌ Error creating liquidity pool:', poolError);
            
            // If pool creation fails, still revoke authorities
            try {
              const revokeTxId = await revokeAuthorities(
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
            const revokeTxId = await revokeAuthorities(
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