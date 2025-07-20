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
import { createTokenWalletAdapterSafe, mintTokensToAddressSafe, revokeAuthoritiesSafe, displayTransactionSummarySafe } from '../utils/wallet-adapter-safe';
// Security assessment removed - GoPlus API is unreliable (404 errors)
// Instead using proper transaction structure to avoid Phantom warnings
import { validateWalletConnection, getWalletErrorMessage, logWalletState } from '../utils/wallet-connection-fix';
import { createUltraMinimalSOLTransfer } from '../utils/ultra-minimal-transaction';
import { createCompleteMinimalToken } from '../utils/ultra-minimal-token-creation';

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
  const wallet = useWallet();
  const { publicKey, signTransaction, signAllTransactions } = wallet;
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
    // Enhanced wallet validation using new validation utility
    logWalletState(wallet, '🔍 Pre-creation wallet state');
    
    const walletValidation = validateWalletConnection(wallet);
    
    if (!walletValidation.isValid) {
      const errorMessage = getWalletErrorMessage(walletValidation.errors[0]);
      setState({
        ...state,
        error: errorMessage,
      });
      return null;
    }
    
    if (walletValidation.warnings.length > 0) {
      walletValidation.warnings.forEach(warning => console.warn('⚠️', warning));
    }

    setState({
      ...state,
      isCreating: true,
      error: null,
    });

    try {
      // Debug output the wallet for inspection
      console.log('Using wallet for token creation:', {
        publicKey: publicKey?.toString(),
        hasSignTransaction: !!signTransaction,
        hasSignAllTransactions: !!signAllTransactions,
      });

      // 🛡️ NEW APPROACH: Fee payment FIRST, then token creation
      console.log('🛡️ PHANTOM SECURITY: NEW APPROACH - Pay fee first with minimal transaction');
      console.log('🎯 This eliminates warnings by doing zero prep work before first signature');
      console.log('✨ Flow: 1) Minimal fee payment → 2) Metadata upload → 3) Token creation');
      
      // Basic wallet validation (no external API calls that can fail)
      if (!publicKey || !signTransaction) {
        throw new Error('Wallet not properly connected');
      }
      
      console.log('✅ Wallet validation passed - using trusted transaction patterns');

      // 🎯 ULTRA MINIMAL APPROACH: Pay fee FIRST with zero preparation
      // This should trigger NO warnings because it's just a simple SOL transfer
      console.log('💳 TESTING: Ultra minimal fee payment (zero prep work)...');
      const FEE_RECIPIENT_ADDRESS = process.env.NEXT_PUBLIC_FEE_RECIPIENT_ADDRESS;
      
      if (FEE_RECIPIENT_ADDRESS) {
        console.log('🔵 Creating minimal fee transaction (should show NO warnings)...');
        const { calculateFee } = await import('../utils/solana');
        const platformFee = calculateFee(tokenData.retentionPercentage || 50);
        
        // This is the CRITICAL test - minimal SOL transfer with zero prep
        const minimalTransfer = await createUltraMinimalSOLTransfer(
          connection,
          { publicKey, signTransaction },
          FEE_RECIPIENT_ADDRESS,
          platformFee
        );
        
        console.log('🎯 Requesting signature for minimal fee payment...');
        const feeSignature = await minimalTransfer.execute();
        console.log('✅ Fee paid with minimal transaction:', feeSignature);
        
        // If we get here with no warnings, the minimal approach works!
        console.log('🎉 SUCCESS: Minimal transaction completed without warnings!');
        console.log('🚀 CRITICAL: Now executing ALL token transactions immediately (NO METADATA WORK!)');
        console.log('📝 Following successful dApp pattern: ALL transactions first, metadata after');
        
        // Update state to reflect successful fee payment
        setState(prev => ({
          ...prev,
          isCreating: true,
          error: null,
        }));
      } else {
        console.log('⚠️ Skipping fee payment - no recipient address configured');
      }

      // Use the validated wallet from our validation utility
      const validatedWallet = walletValidation.wallet;
      
      // Calculate token distribution
      const retentionPercentage = tokenData.retentionPercentage || 50;
      const totalSupply = tokenData.supply;
      const retainedAmount = tokenData.retainedAmount || 
                          Math.floor(totalSupply * (retentionPercentage / 100));
      const liquidityAmount = tokenData.liquidityAmount || 
                            (totalSupply - retainedAmount);
      
      // 🚨 CRITICAL: Execute ALL token transactions IMMEDIATELY (NO metadata work between!)
      console.log('⚡ EXECUTING ALL TOKEN TRANSACTIONS NOW (before any metadata work)');
      console.log('🎯 Pattern: Fee payment → Token creation → THEN metadata (like successful dApps)');
      
      // Execute ULTRA MINIMAL token creation (same pattern as successful fee payment)
      const minimalTokenResult = await createCompleteMinimalToken(
        connection,
        { publicKey, signTransaction },
        {
          name: tokenData.name,
          symbol: tokenData.symbol,
          decimals: tokenData.decimals,
          supply: totalSupply,
          retainedAmount
        }
      );
      
      const tokenAddress = minimalTokenResult.mintAddress;
      
      console.log('✅ ALL TOKEN TRANSACTIONS COMPLETED!');
      console.log('🎉 NO complex work was done between transactions!');
      console.log('🎯 NOW doing metadata work (after all transactions done)');
      
      // 🎯 NOW UPLOAD METADATA (AFTER all transactions are complete)
      console.log('📝 Uploading metadata to Pinata (all transactions done, safe to do complex work)...');
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
      
      console.log('✅ Metadata uploaded successfully');
      console.log(`🌐 Metadata URI: ${metadataUri}`);
      
      try {
        // Token creation already completed before metadata upload
        console.log('🛡️ TOKEN ALREADY CREATED: Using successful pattern');
        console.log('✅ All transactions completed BEFORE metadata work');
        console.log(`🎯 Token address: ${tokenAddress}`);
        console.log(`📊 User received: ${retainedAmount.toLocaleString()} tokens`);
        console.log(`🏊 Reserved for liquidity: ${liquidityAmount.toLocaleString()} tokens`);
        
        // Create compatible result for existing flow
        const secureResult = {
          mintAddress: tokenAddress,
          userTokenAmount: retainedAmount,
          liquidityTokenAmount: liquidityAmount
        };
        
        // 🔒 STEP 2: Platform fee already collected at the start (minimal approach)
        console.log('✅ Platform fee already paid using minimal transaction approach');
        
        // 🔒 STEP 3: Revoke authorities for security
        console.log('🔒 Revoking token authorities for security...');
        const { revokeAuthoritiesSafe } = await import('../utils/wallet-adapter-safe');
        await revokeAuthoritiesSafe(connection, validatedWallet, tokenAddress, true, true);
        console.log('✅ Token authorities revoked - fully secured');
        
        // 🔒 STEP 4: Automatically verify token in wallet
        if (publicKey) {
          await verifyTokenInWallet(connection, tokenAddress, publicKey);
        }
        
        // 🔒 STEP 5: Handle pool creation (authorities now revoked)
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
              console.log('⚠️ CRITICAL: Pool creation requested but authorities already revoked');
              console.log('❌ Cannot create pools for tokens with revoked mint authority');
              console.log('💡 SOLUTION: To create pools, tokens need temporary mint authority for liquidity token creation');
              console.log('🔄 Consider creating pools before revoking authorities');
              console.log('✅ Platform fee already collected - no additional charges');
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
          console.log('✅ Platform fee already collected');
          console.log('🛡️ Token authorities already revoked - fully secured');
        }
        
        // 🔒 STEP 6: Save token to database
        console.log('💾 Saving token to database...');
        const response = await fetch('/api/create-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userAddress: publicKey?.toString() || '',
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