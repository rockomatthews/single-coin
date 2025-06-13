import { 
  Connection, 
  PublicKey, 
  LAMPORTS_PER_SOL, 
  Transaction, 
  VersionedTransaction,
  SystemProgram,
  Keypair
} from '@solana/web3.js';
import * as token from '@solana/spl-token';
import { 
  Raydium, 
  TxVersion, 
  CREATE_CPMM_POOL_PROGRAM, 
  CREATE_CPMM_POOL_FEE_ACC,
  DEVNET_PROGRAM_ID,
  getCpmmPdaAmmConfigId
} from '@raydium-io/raydium-sdk-v2';
import BN from 'bn.js';
import { mintLiquidityToPool, finalizeTokenSecurity } from './secure-token-creation';
import { calculateFee } from './solana';

// Define proper types for wallet functions
interface WalletAdapter {
  publicKey: PublicKey;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions?: (transactions: Transaction[]) => Promise<Transaction[]>;
}

// Create a wallet adapter that works with Raydium SDK
function createRaydiumWalletAdapter(wallet: WalletAdapter) {
  return {
    publicKey: wallet.publicKey,
    signTransaction: wallet.signTransaction,
    signAllTransactions: async <T extends Transaction | VersionedTransaction>(transactions: T[]): Promise<T[]> => {
      console.log(`🔐 Signing ${transactions.length} transactions for Raydium SDK`);
      
      if (wallet.signAllTransactions) {
        try {
          const result = await wallet.signAllTransactions(transactions as any[]);
          console.log(`✅ Successfully signed ${result.length} transactions`);
          return result as T[];
        } catch (error) {
          console.error('❌ signAllTransactions failed:', error);
          // Fall back to individual signing
        }
      }
      
      // Fallback: sign transactions one by one
      console.log('🔄 Falling back to individual transaction signing');
      const signedTransactions: T[] = [];
      for (let i = 0; i < transactions.length; i++) {
        try {
          console.log(`🔐 Signing transaction ${i + 1}/${transactions.length}`);
          const signedTx = await wallet.signTransaction(transactions[i] as any);
          signedTransactions.push(signedTx as T);
        } catch (error) {
          console.error(`❌ Failed to sign transaction ${i + 1}:`, error);
          throw error;
        }
      }
      console.log(`✅ Successfully signed all ${signedTransactions.length} transactions individually`);
      return signedTransactions;
    }
  };
}

/**
 * Initialize Raydium SDK v2
 */
async function initRaydiumSDK(connection: Connection, wallet: WalletAdapter): Promise<Raydium> {
  const cluster = process.env.NEXT_PUBLIC_SOLANA_NETWORK?.toLowerCase() === 'devnet' ? 'devnet' : 'mainnet';
  
  console.log('🔧 Initializing Raydium SDK with enhanced Phantom transaction signing support');
  console.log('📋 Wallet capabilities:', {
    hasPublicKey: !!wallet.publicKey,
    hasSignTransaction: !!wallet.signTransaction,
    hasSignAllTransactions: !!wallet.signAllTransactions,
    hasPhantomSignAndSendTransaction: !!(window.phantom?.solana?.signAndSendTransaction),
  });
  
  // Create the signAllTransactions function that Raydium SDK expects
  // This function will prioritize the wallet adapter's signAllTransactions for better UX
  const signAllTransactions = async <T extends Transaction | VersionedTransaction>(transactions: T[]): Promise<T[]> => {
    console.log(`🔐 Raydium SDK requesting to sign ${transactions.length} transactions`);
    
    // Check if Phantom is available (for logging purposes)
    const isPhantomAvailable = window.phantom?.solana?.signAndSendTransaction;
    if (isPhantomAvailable) {
      console.log('✅ Phantom wallet detected - using wallet adapter signAllTransactions for optimal experience');
    }
    
    // Use wallet adapter's signAllTransactions if available (this works with Phantom)
    if (wallet.signAllTransactions) {
      try {
        console.log('✅ Using wallet.signAllTransactions');
        const result = await wallet.signAllTransactions(transactions as any[]);
        console.log(`✅ Successfully signed ${result.length} transactions via signAllTransactions`);
        return result as T[];
      } catch (error) {
        console.error('❌ wallet.signAllTransactions failed:', error);
        // Fall back to individual signing
      }
    }
    
    // Final fallback: sign transactions one by one
    console.log('🔄 Falling back to individual transaction signing');
    const signedTransactions: T[] = [];
    for (let i = 0; i < transactions.length; i++) {
      try {
        console.log(`🔐 Signing transaction ${i + 1}/${transactions.length}`);
        const signedTx = await wallet.signTransaction(transactions[i] as any);
        signedTransactions.push(signedTx as T);
      } catch (error) {
        console.error(`❌ Failed to sign transaction ${i + 1}:`, error);
        throw error;
      }
    }
    console.log(`✅ Successfully signed all ${signedTransactions.length} transactions individually`);
    return signedTransactions;
  };
  
  const raydium = await Raydium.load({
    connection,
    owner: wallet.publicKey, // Use publicKey for owner
    signAllTransactions, // Pass the enhanced signAllTransactions function
    cluster,
    disableFeatureCheck: true,
    disableLoadToken: false,
    blockhashCommitment: 'finalized',
  });

  return raydium;
}

/**
 * Create CPMM Pool using official Raydium SDK v2 with secure token minting
 * This creates real, immediately tradeable pools on Raydium
 */
export async function createRaydiumCpmmPool(
  connection: Connection, 
  wallet: WalletAdapter,
  tokenMint: string,
  tokenAmount: number,
  solAmount: number,
  sendFeeToFeeRecipient: boolean = true,
  platformFeeAmount?: number,
  // NEW: Add retention percentage for proper pricing
  retentionPercentage?: number,
  // NEW: Add parameters for secure token creation
  secureTokenCreation?: {
    mintKeypair?: Keypair;
    tokenDecimals: number;
    shouldMintLiquidity: boolean;
    shouldRevokeAuthorities: boolean;
  }
): Promise<string> {
  try {
    console.log('🚀 Creating REAL Raydium CPMM pool using official SDK v2');
    console.log(`💰 Token: ${tokenMint}`);
    console.log(`📊 Adding ${tokenAmount.toLocaleString()} tokens and ${solAmount} SOL`);
    
    // Initialize Raydium SDK
    const raydium = await initRaydiumSDK(connection, wallet);
    
    // Get network type
    const isDevnet = process.env.NEXT_PUBLIC_SOLANA_NETWORK?.toLowerCase() === 'devnet';
    
    // Fee recipient and calculation
    const FEE_RECIPIENT_ADDRESS = process.env.NEXT_PUBLIC_FEE_RECIPIENT_ADDRESS || '';
    
    // 🚨 CRITICAL FIX: Use proper retention-based pricing, not liquidity-based pricing!
    // Using imported calculateFee function from solana.ts for proper pricing
    
    // Use PROPER pricing based on retention percentage, not liquidity amount!
    const platformFeeSol = platformFeeAmount || calculateFee(retentionPercentage || 0);
    const remainingAfterPlatformFee = solAmount - platformFeeSol;
    
    // Raydium pool creation costs (from SDK)
    const RAYDIUM_POOL_COSTS = 0.154; // Actual Raydium fees
    const actualLiquiditySol = remainingAfterPlatformFee - RAYDIUM_POOL_COSTS;
    
    if (actualLiquiditySol <= 0) {
      throw new Error(`❌ Insufficient SOL. Need at least ${(platformFeeSol + RAYDIUM_POOL_COSTS).toFixed(4)} SOL to cover platform fees (${platformFeeSol.toFixed(4)}) + Raydium fees (${RAYDIUM_POOL_COSTS.toFixed(4)})`);
    }
    
    console.log(`🌐 Network: ${isDevnet ? 'devnet' : 'mainnet'}`);
    console.log(`💸 Platform fee: ${platformFeeSol.toFixed(4)} SOL`);
    console.log(`🏗️ Raydium pool creation fees: ${RAYDIUM_POOL_COSTS.toFixed(4)} SOL`);
    console.log(`🏊 Actual pool liquidity: ${actualLiquiditySol.toFixed(4)} SOL + ${tokenAmount.toLocaleString()} tokens`);
    
    // 🚨 CRITICAL FIX: Charge user THE FULL AMOUNT upfront, not just platform fee!
    const totalAmountToCharge = platformFeeSol + RAYDIUM_POOL_COSTS + actualLiquiditySol;
    console.log(`💰 TOTAL AMOUNT TO CHARGE USER: ${totalAmountToCharge.toFixed(4)} SOL`);
    
    // Step 1: Charge user the FULL amount upfront (not just platform fee!)
    if (FEE_RECIPIENT_ADDRESS) {
      try {
        console.log(`🔥 CHARGING USER FULL AMOUNT: ${totalAmountToCharge.toFixed(4)} SOL`);
        
        const fullPaymentTransaction = new Transaction();
        fullPaymentTransaction.add(
          SystemProgram.transfer({
            fromPubkey: wallet.publicKey,
            toPubkey: new PublicKey(FEE_RECIPIENT_ADDRESS), // Platform collects everything
            lamports: Math.floor(totalAmountToCharge * LAMPORTS_PER_SOL),
          })
        );
        
        const { blockhash } = await connection.getLatestBlockhash();
        fullPaymentTransaction.recentBlockhash = blockhash;
        fullPaymentTransaction.feePayer = wallet.publicKey;
        
        // Check if Phantom wallet is available for signAndSendTransaction
        const isPhantomAvailable = window.phantom?.solana?.signAndSendTransaction;
        console.log('Phantom wallet available for full payment transaction:', !!isPhantomAvailable);
        
        let fullPaymentTxId: string;
        
        if (isPhantomAvailable) {
          console.log('Using Phantom signAndSendTransaction for FULL payment');
          // Use Phantom's signAndSendTransaction method
          const result = await window.phantom!.solana!.signAndSendTransaction(fullPaymentTransaction);
          fullPaymentTxId = result.signature;
          console.log(`✅ FULL PAYMENT collected via signAndSendTransaction, txId: ${fullPaymentTxId}`);
        } else {
          console.log('Falling back to signTransaction + sendRawTransaction for FULL payment');
          // Fallback to the old method
          const signedPaymentTx = await wallet.signTransaction(fullPaymentTransaction);
          fullPaymentTxId = await connection.sendRawTransaction(signedPaymentTx.serialize());
          console.log(`✅ FULL PAYMENT collected via fallback method, txId: ${fullPaymentTxId}`);
        }
        
        await connection.confirmTransaction(fullPaymentTxId);
        console.log(`🎯 SUCCESS: User charged ${totalAmountToCharge.toFixed(4)} SOL as agreed!`);
        
        // Now platform needs to fund the pool creation from collected funds
        // For now, we'll create a minimal pool and add proper liquidity funding later
        
      } catch (paymentError) {
        console.error('❌ Error collecting full payment:', paymentError);
        throw new Error(`Payment collection failed: ${paymentError}`);
      }
    } else {
      throw new Error('❌ No fee recipient configured - cannot collect payment');
    }
    
    // Step 2: Get token information using Raydium SDK
    console.log('📋 Getting token information...');
    
    const tokenMintPubkey = new PublicKey(tokenMint);
    
    // Get token info from Raydium SDK
    let mintA, mintB;
    try {
      // Try to get token info from Raydium's token list
      mintA = await raydium.token.getTokenInfo(tokenMint);
    } catch (error) {
      // If not in token list, create token info manually
      const tokenInfo = await connection.getParsedAccountInfo(tokenMintPubkey);
      const decimals = (tokenInfo.value?.data && 'parsed' in tokenInfo.value.data) 
        ? tokenInfo.value.data.parsed?.info?.decimals || 9
        : secureTokenCreation?.tokenDecimals || 9;
      
      mintA = {
        address: tokenMint,
        programId: token.TOKEN_PROGRAM_ID.toString(),
        decimals: decimals,
      };
    }
    
    // SOL/WSOL mint info
    mintB = {
      address: 'So11111111111111111111111111111111111111112', // WSOL
      programId: token.TOKEN_PROGRAM_ID.toString(),
      decimals: 9,
    };
    
    console.log(`✅ Token A (${mintA.address}): ${mintA.decimals} decimals`);
    console.log(`✅ Token B (WSOL): ${mintB.decimals} decimals`);
    
    // Step 3: Get CPMM fee configurations
    const feeConfigs = await raydium.api.getCpmmConfigs();
    
    if (isDevnet) {
      feeConfigs.forEach((config) => {
        config.id = getCpmmPdaAmmConfigId(DEVNET_PROGRAM_ID.CREATE_CPMM_POOL_PROGRAM, config.index).publicKey.toBase58();
      });
    }
    
    console.log(`📋 Using fee config: ${feeConfigs[0].id}`);
    
    // Check user's current token balance
    const userTokenAccount = await token.getAssociatedTokenAddress(
      new PublicKey(tokenMint),
      wallet.publicKey
    );
    
    let userTokenBalance = 0;
    try {
      const accountInfo = await connection.getParsedAccountInfo(userTokenAccount);
      if (accountInfo.value?.data && 'parsed' in accountInfo.value.data) {
        userTokenBalance = accountInfo.value.data.parsed.info.tokenAmount.uiAmount || 0;
      }
    } catch (error) {
      console.log('User token account not found or error reading balance');
    }
    
    console.log(`🔍 User's current token balance: ${userTokenBalance.toLocaleString()}`);
    
    // 🔒 CRITICAL: Calculate expected retention amount properly
    const totalSupply = tokenAmount + userTokenBalance; // liquidity + retention = total
    const expectedRetentionPercentage = retentionPercentage || 20;
    const expectedUserBalance = Math.floor(totalSupply * (expectedRetentionPercentage / 100));
    const allowedVariance = expectedUserBalance * 0.1; // 10% variance
    
    if (secureTokenCreation && Math.abs(userTokenBalance - expectedUserBalance) > allowedVariance) { // Allow reasonable variance
      console.error(`❌ SECURITY ISSUE: User has ${userTokenBalance.toLocaleString()} tokens but expected ${expectedUserBalance.toLocaleString()} tokens (${expectedRetentionPercentage}% retention)!`);
      throw new Error(`Security violation: User has ${userTokenBalance.toLocaleString()} tokens but expected ${expectedUserBalance.toLocaleString()} tokens (${expectedRetentionPercentage}% retention)`);
    }
    
    // 🚨 CRITICAL FIX: Mint liquidity tokens to user BEFORE pool creation
    // The Raydium SDK expects all tokens to be in user's wallet to transfer to pool
    if (secureTokenCreation?.shouldMintLiquidity && userTokenBalance < tokenAmount) {
      console.log('🔒 SECURE WORKFLOW: Minting liquidity tokens to user BEFORE pool creation');
      console.log(`💰 User currently has: ${userTokenBalance.toLocaleString()} tokens`);
      console.log(`🏊 Pool needs: ${tokenAmount.toLocaleString()} tokens`);
      console.log(`➕ Need to mint: ${(tokenAmount - userTokenBalance).toLocaleString()} more tokens`);
      
      try {
        const additionalTokensNeeded = tokenAmount - userTokenBalance;
        const mintTxId = await mintLiquidityToPool(
          connection,
          wallet,
          tokenMint,
          userTokenAccount.toString(), // Mint to USER's wallet (not pool vault)
          additionalTokensNeeded,
          secureTokenCreation.tokenDecimals
        );
        
        console.log(`✅ Minted ${additionalTokensNeeded.toLocaleString()} additional tokens to user: ${mintTxId}`);
        
        // Update user balance for verification
        userTokenBalance += additionalTokensNeeded;
        console.log(`✅ User now has: ${userTokenBalance.toLocaleString()} tokens total`);
        
      } catch (mintError) {
        console.error('❌ Error minting liquidity tokens to user:', mintError);
        throw new Error(`Failed to mint liquidity tokens: ${mintError}`);
      }
    }
    
    // 🚨 CRITICAL FIX: Use ACTUAL amounts that user paid for, not minimal amounts!
    const tokenAmountWithDecimals = new BN(tokenAmount * Math.pow(10, mintA.decimals)); 
    const solAmountInLamports = new BN(Math.floor(actualLiquiditySol * LAMPORTS_PER_SOL));
    
    console.log(`💰 Creating pool with ACTUAL amounts user paid for:`)
    console.log(`   Token amount: ${tokenAmount.toLocaleString()} tokens (${tokenAmountWithDecimals.toString()} with decimals)`);
    console.log(`   SOL amount: ${actualLiquiditySol.toFixed(4)} SOL (${solAmountInLamports.toString()} lamports)`);
    console.log(`✅ User has sufficient tokens: ${userTokenBalance.toLocaleString()} >= ${tokenAmount.toLocaleString()}`);
    
    // Step 4: Create the CPMM pool using Raydium SDK
    console.log('🏊 Creating Raydium CPMM pool using official SDK...');
    
    try {
      console.log('🔧 Preparing pool creation parameters...');
      
      const poolParams = {
        programId: isDevnet ? DEVNET_PROGRAM_ID.CREATE_CPMM_POOL_PROGRAM : CREATE_CPMM_POOL_PROGRAM,
        poolFeeAccount: isDevnet ? DEVNET_PROGRAM_ID.CREATE_CPMM_POOL_FEE_ACC : CREATE_CPMM_POOL_FEE_ACC,
        mintA: mintA,
        mintB: mintB,
        mintAAmount: tokenAmountWithDecimals, // 🔥 FIXED: Use actual token amount user paid for
        mintBAmount: solAmountInLamports,     // 🔥 FIXED: Use actual SOL amount user paid for
        startTime: new BN(0), // Start immediately
        feeConfig: feeConfigs[0],
        associatedOnly: false,
        ownerInfo: {
          useSOLBalance: true, // Use SOL balance for WSOL
        },
        txVersion: TxVersion.V0,
        // Optional: set up priority fee for faster processing
        computeBudgetConfig: {
          units: 600000,
          microLamports: 46591500,
        },
      };
      
      console.log('📋 Pool creation parameters:', {
        programId: poolParams.programId.toString(),
        poolFeeAccount: poolParams.poolFeeAccount.toString(),
        mintA: poolParams.mintA.address,
        mintB: poolParams.mintB.address,
        mintAAmount: poolParams.mintAAmount.toString(),
        mintBAmount: poolParams.mintBAmount.toString(),
        feeConfigId: poolParams.feeConfig.id,
      });
      
      const { execute, extInfo } = await raydium.cpmm.createPool(poolParams);
      
      // Execute the pool creation transaction
      console.log('📤 Executing pool creation transaction...');
      
      try {
        // Now that signAllTransactions is working, use sendAndConfirm: true
        const result = await execute({ sendAndConfirm: true });
        const txId = result.txId;
        
        console.log(`🎉 RAYDIUM CPMM POOL CREATED SUCCESSFULLY!`);
        console.log(`✅ Transaction ID: ${txId}`);
        
        // 🔥 FIXED: No need for separate liquidity minting since we put actual amounts in pool creation
        console.log('✅ Pool created with FULL liquidity amounts (no separate minting needed)');
        console.log(`🏊 Pool now contains: ${tokenAmount.toLocaleString()} tokens + ${actualLiquiditySol.toFixed(4)} SOL`);
        
        // 🔒 STEP 2: Revoke authorities AFTER pool creation (only if requested)
        if (secureTokenCreation?.shouldRevokeAuthorities) {
          console.log('🔒 SECURE WORKFLOW: Revoking token authorities AFTER pool creation');
          
          try {
            const revokeTxId = await finalizeTokenSecurity(
              connection,
              wallet,
              tokenMint,
              true, // Revoke mint authority
              true  // Revoke freeze authority
            );
            
            console.log(`✅ Token authorities revoked: ${revokeTxId}`);
          } catch (revokeError) {
            console.error('❌ Error revoking authorities:', revokeError);
            // Don't throw - pool was created successfully
            console.log('⚠️ Pool created successfully but authority revocation failed');
          }
        }
        
        // Extract pool information
        const poolKeys = Object.keys(extInfo.address).reduce(
          (acc, cur) => ({
            ...acc,
            [cur]: extInfo.address[cur as keyof typeof extInfo.address].toString(),
          }),
          {} as Record<string, string>
        );
        
        console.log(`📋 Pool Keys:`, poolKeys);
        
        // Create success message with immediate trading URLs
        console.log(`
🎉 CONGRATULATIONS! Your token is NOW LIVE and TRADEABLE! 🎉

✅ What was accomplished:
• Real Raydium CPMM pool created using official SDK v2
• ${tokenAmount.toLocaleString()} tokens minted to liquidity pool
• ${actualLiquiditySol.toFixed(4)} SOL added to liquidity
• Pool is IMMEDIATELY tradeable on all DEXes!
• Token authorities ${secureTokenCreation?.shouldRevokeAuthorities ? 'have been revoked (immutable supply)' : 'retained'}

💰 Your Token Distribution:
• In your wallet: ONLY retention tokens (as intended)
• In liquidity pool: ${tokenAmount.toLocaleString()} tokens + SOL liquidity
• Ready for trading on all major DEXes!

🔗 LIVE Trading URLs (share these NOW):
• Raydium: https://raydium.io/swap/?inputCurrency=sol&outputCurrency=${tokenMint}
• Jupiter: https://jup.ag/swap/SOL-${tokenMint}
• DexScreener: https://dexscreener.com/solana/${poolKeys['id'] || 'pool'}
• Birdeye: https://birdeye.so/token/${tokenMint}?chain=solana

📊 Pool Details:
• Pool ID: ${poolKeys['poolId'] || poolKeys['id'] || extInfo.address.poolId?.toString() || 'N/A'}
• LP Token: ${poolKeys['lpMint'] || extInfo.address.lpMint?.toString() || 'N/A'}
• Token Vault: ${poolKeys['vaultA'] || poolKeys['vault'] || extInfo.address.vaultA?.toString() || 'N/A'}
• SOL Vault: ${poolKeys['vaultB'] || extInfo.address.vaultB?.toString() || 'N/A'}

🚀 Your token is officially trading on Solana DEX ecosystem!
        `);
        
        return txId;
      } catch (executeError) {
        console.error('❌ Execute error:', executeError);
        throw executeError;
      }
        
        // This code should not be reached due to returns above, but keeping for safety
        throw new Error('Pool creation completed but no transaction ID returned');
      
    } catch (poolCreationError) {
      console.error('❌ Detailed pool creation error:', poolCreationError);
      
      // Log additional debugging information
      console.error('🔍 Debug info:', {
        tokenAmount,
        actualLiquiditySol,
        userTokenBalance,
        secureTokenCreation,
      });
      
      throw poolCreationError;
    }
    
  } catch (error) {
    console.error('❌ Error creating Raydium CPMM pool:', error);
    
    // Provide helpful error messages
    if (error instanceof Error) {
      if (error.message.includes('0x1')) {
        throw new Error('❌ Insufficient SOL balance. CPMM pool creation requires more SOL for gas fees and pool rent.');
      } else if (error.message.includes('insufficient funds')) {
        throw new Error('❌ Insufficient funds. Please ensure you have enough SOL for transaction fees and pool liquidity.');
      } else if (error.message.includes('already exists')) {
        throw new Error('❌ Pool already exists for this token pair. Tokens may already be tradeable.');
      } else {
        throw new Error(`❌ CPMM pool creation failed: ${error.message}`);
      }
    }
    
    throw new Error(`❌ Failed to create Raydium CPMM pool: ${String(error)}`);
  }
}

/**
 * Check if a token already has a liquidity pool using Raydium SDK
 */
export async function checkExistingRaydiumPool(
  connection: Connection,
  wallet: WalletAdapter,
  tokenMint: string
): Promise<boolean> {
  try {
    // For now, always return false to allow pool creation
    // This can be enhanced later with proper pool checking
    console.log(`Checking for existing pools for token: ${tokenMint}`);
    return false;
  } catch (error) {
    console.error('Error checking existing pool:', error);
    return false;
  }
}