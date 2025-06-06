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
 * Create CPMM Pool using official Raydium SDK v2
 * This creates real, immediately tradeable pools on Raydium
 */
export async function createRaydiumCpmmPool(
  connection: Connection, 
  wallet: WalletAdapter,
  tokenMint: string,
  tokenAmount: number,
  solAmount: number,
  sendFeeToFeeRecipient: boolean = true,
  platformFeeAmount?: number
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
    
    // Use the platform fee passed from frontend, or fall back to 3% calculation
    const platformFeeSol = platformFeeAmount || (solAmount * 0.03);
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
    
    // Step 1: Send platform fee
    if (sendFeeToFeeRecipient && FEE_RECIPIENT_ADDRESS) {
      try {
        const feeTransaction = new Transaction();
        feeTransaction.add(
          SystemProgram.transfer({
            fromPubkey: wallet.publicKey,
            toPubkey: new PublicKey(FEE_RECIPIENT_ADDRESS),
            lamports: Math.floor(platformFeeSol * LAMPORTS_PER_SOL),
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
          console.log('Using Phantom signAndSendTransaction for platform fee');
          // Use Phantom's signAndSendTransaction method
          const result = await window.phantom!.solana!.signAndSendTransaction(feeTransaction);
          feeTxId = result.signature;
          console.log(`✅ Platform fee sent via signAndSendTransaction, txId: ${feeTxId}`);
        } else {
          console.log('Falling back to signTransaction + sendRawTransaction for platform fee');
          // Fallback to the old method
          const signedFeeTx = await wallet.signTransaction(feeTransaction);
          feeTxId = await connection.sendRawTransaction(signedFeeTx.serialize());
          console.log(`✅ Platform fee sent via fallback method, txId: ${feeTxId}`);
        }
        
        await connection.confirmTransaction(feeTxId);
      } catch (feeError) {
        console.error('❌ Error sending fee:', feeError);
        // Continue with pool creation even if fee fails
      }
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
        : 9;
      
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
    
    // Step 4: Calculate amounts with proper decimals - use string-based approach to avoid MAX_SAFE_INTEGER issues
    console.log(`🔢 Calculating token amounts with decimals...`);
    console.log(`Raw token amount: ${tokenAmount}`);
    console.log(`Token decimals: ${mintA.decimals}`);
    console.log(`Raw SOL amount: ${actualLiquiditySol}`);
    
    // Use string-based BN creation to avoid JavaScript MAX_SAFE_INTEGER limits
    let tokenAmountWithDecimals: BN;
    let solAmountWithDecimals: BN;
    
    try {
      // For token amount: convert to string and add zeros for decimals
      // This avoids the multiplication that causes overflow
      const tokenAmountStr = Math.floor(tokenAmount).toString();
      const decimalsStr = '0'.repeat(mintA.decimals);
      const tokenAmountWithDecimalsStr = tokenAmountStr + decimalsStr;
      
      console.log(`🔢 Token amount string: ${tokenAmountStr}`);
      console.log(`🔢 Decimals string: ${decimalsStr}`);
      console.log(`🔢 Final token amount string: ${tokenAmountWithDecimalsStr}`);
      
      tokenAmountWithDecimals = new BN(tokenAmountWithDecimalsStr);
      console.log(`✅ Token BN created successfully: ${tokenAmountWithDecimals.toString()}`);
      
      // For SOL amount: use LAMPORTS_PER_SOL constant
      const solAmountRaw = Math.floor(actualLiquiditySol * LAMPORTS_PER_SOL);
      console.log(`🔢 Creating BN for SOL amount: ${solAmountRaw.toString()}`);
      solAmountWithDecimals = new BN(solAmountRaw.toString());
      console.log(`✅ SOL BN created successfully: ${solAmountWithDecimals.toString()}`);
      
      console.log(`📊 Token Amount: ${tokenAmountWithDecimals.toString()} (${tokenAmount.toLocaleString()} tokens)`);
      console.log(`📊 SOL Amount: ${solAmountWithDecimals.toString()} (${actualLiquiditySol} SOL)`);
      
    } catch (bnError) {
      console.error('❌ Error creating BN numbers:', bnError);
      throw new Error(`Failed to create BigNumber instances: ${bnError}`);
    }
    
    // Validate amounts are positive
    if (tokenAmountWithDecimals.lte(new BN(0))) {
      throw new Error(`❌ Invalid token amount: ${tokenAmountWithDecimals.toString()}`);
    }
    
    if (solAmountWithDecimals.lte(new BN(0))) {
      throw new Error(`❌ Invalid SOL amount: ${solAmountWithDecimals.toString()}`);
    }
    
    // Step 5: Create the CPMM pool using Raydium SDK
    console.log('🏊 Creating Raydium CPMM pool using official SDK...');
    
    try {
      console.log('🔧 Preparing pool creation parameters...');
      
      const poolParams = {
        programId: isDevnet ? DEVNET_PROGRAM_ID.CREATE_CPMM_POOL_PROGRAM : CREATE_CPMM_POOL_PROGRAM,
        poolFeeAccount: isDevnet ? DEVNET_PROGRAM_ID.CREATE_CPMM_POOL_FEE_ACC : CREATE_CPMM_POOL_FEE_ACC,
        mintA: mintA,
        mintB: mintB,
        mintAAmount: tokenAmountWithDecimals,
        mintBAmount: solAmountWithDecimals,
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
      
      // Execute the transaction
      console.log('📤 Executing pool creation transaction...');
      
      try {
        // Now that signAllTransactions is working, use sendAndConfirm: true
        const result = await execute({ sendAndConfirm: true });
        const txId = result.txId;
        
        console.log(`🎉 RAYDIUM CPMM POOL CREATED SUCCESSFULLY!`);
        console.log(`✅ Transaction ID: ${txId}`);
        
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
• ${tokenAmount.toLocaleString()} tokens transferred to liquidity pool
• ${actualLiquiditySol.toFixed(4)} SOL added to liquidity
• Pool is IMMEDIATELY tradeable on all DEXes!

💰 Your Token Distribution:
• In your wallet: Remaining tokens (retention amount)
• In liquidity pool: ${tokenAmount.toLocaleString()} tokens + ${actualLiquiditySol.toFixed(4)} SOL
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
        tokenAmountWithDecimals: tokenAmountWithDecimals.toString(),
        solAmountWithDecimals: solAmountWithDecimals.toString(),
        mintADecimals: mintA.decimals,
        mintBDecimals: mintB.decimals,
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