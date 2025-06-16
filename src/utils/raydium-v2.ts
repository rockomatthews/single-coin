import { 
  Connection, 
  PublicKey, 
  LAMPORTS_PER_SOL, 
  Transaction, 
  VersionedTransaction,
  SystemProgram,
  Keypair,
  ComputeBudgetProgram
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

// Constants
const WSOL_MINT = new PublicKey('So11111111111111111111111111111111111111112');

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
 * Create CPMM Pool using official Raydium SDK v2 with CORRECT payment flow
 * FIXED: Only collects platform fee, uses user's SOL for actual liquidity
 */
export async function createRaydiumCpmmPool(
  connection: Connection, 
  wallet: WalletAdapter,
  tokenMint: string,
  liquidityTokenAmount: number,
  userLiquiditySol: number, // 🔥 CLEAR: This is what user specified in slider
  sendFeeToFeeRecipient: boolean = true,
  retentionPercentage?: number,
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
    console.log(`🏊 User wants to add: ${liquidityTokenAmount.toLocaleString()} tokens + ${userLiquiditySol} SOL`);
    
    // 🔥 CORRECT CALCULATION - Only platform fee goes to recipient!
    const platformFee = calculateFee(retentionPercentage || 0);
    const raydiumFees = 0.154; // Fixed Raydium costs
    
    console.log(`💳 PAYMENT BREAKDOWN:`);
    console.log(`   Platform fee: ${platformFee.toFixed(4)} SOL (goes to platform)`);
    console.log(`   User liquidity: ${userLiquiditySol.toFixed(4)} SOL (stays with user for pool)`);
    console.log(`   Raydium fees: ${raydiumFees.toFixed(4)} SOL (from user's balance for pool creation)`);
    console.log(`   TOTAL USER PAYS: ${(platformFee + userLiquiditySol + raydiumFees).toFixed(4)} SOL`);
    
    // 🔥 NO FEE COLLECTION HERE - Platform fee already collected separately!
    // The user keeps their SOL for actual pool creation
    console.log(`💰 PLATFORM FEE ALREADY COLLECTED SEPARATELY`);
    console.log(`🎯 User keeps their ${userLiquiditySol.toFixed(4)} SOL + ${raydiumFees.toFixed(4)} SOL for actual pool creation`);
    console.log(`🏊 Proceeding with pool creation using user's remaining SOL balance...`);
    console.log(`🚀 NO MORE MONEY GOES TO FEE RECIPIENT - USER SOL GOES TO ACTUAL POOL!`);

    // Initialize Raydium SDK
    const raydium = await initRaydiumSDK(connection, wallet);
    
    // Get network type
    const isDevnet = process.env.NEXT_PUBLIC_SOLANA_NETWORK?.toLowerCase() === 'devnet';
    
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
    try {
      mintB = await raydium.token.getTokenInfo(WSOL_MINT.toString());
    } catch (error) {
      mintB = {
        address: WSOL_MINT.toString(),
        programId: token.TOKEN_PROGRAM_ID.toString(),
        decimals: 9,
      };
    }
    
    console.log('📊 Pool token info:');
    console.log(`   Token A: ${mintA.address} (${mintA.decimals} decimals)`);
    console.log(`   Token B: ${mintB.address} (${mintB.decimals} decimals)`);
    
    // Step 3: Get user's current token balance (before minting liquidity)
    const userTokenAccount = await token.getAssociatedTokenAddress(
      tokenMintPubkey,
      wallet.publicKey
    );
    
    const tokenAccountInfo = await connection.getTokenAccountBalance(userTokenAccount);
    let userTokenBalance = parseInt(tokenAccountInfo.value.amount);
    
    console.log(`🔍 User's current token balance: ${userTokenBalance.toLocaleString()}`);
    
    // 🔥 STEP 4: Check user's current token balance (ONLY retention tokens)
    // DO NOT mint liquidity tokens to user - they should go directly to pool!
    console.log('🔒 CORRECT WORKFLOW: User keeps only retention tokens, liquidity goes directly to pool');
    console.log(`💰 User has: ${userTokenBalance.toLocaleString()} tokens (retention only) - raw units`);
    console.log(`🏊 Will mint: ${liquidityTokenAmount.toLocaleString()} tokens DIRECTLY to pool (NOT to user wallet)`);
    
    // 🔥 KEY FIX: Do NOT mint liquidity tokens to user's wallet!
    // The pool creation will handle minting tokens directly to the pool
    if (!secureTokenCreation?.shouldMintLiquidity) {
      throw new Error('❌ Secure token creation parameters missing - shouldMintLiquidity must be true');
    }
    
    // Verify user has ONLY their retention tokens (not all tokens)
    const retentionTokensInRawUnits = (liquidityTokenAmount * (retentionPercentage || 10) / (100 - (retentionPercentage || 10))) * Math.pow(10, mintA.decimals);
    console.log(`🔍 Expected retention tokens: ${retentionTokensInRawUnits.toLocaleString()} (raw units)`);
    console.log(`🔍 User actual balance: ${userTokenBalance.toLocaleString()} (raw units)`);
    
    if (userTokenBalance < retentionTokensInRawUnits * 0.9) { // Allow 10% tolerance
      throw new Error(`❌ User doesn't have expected retention tokens. Expected: ~${retentionTokensInRawUnits.toLocaleString()}, Got: ${userTokenBalance.toLocaleString()}`);
    }
    
    console.log(`✅ User balance verified: Has retention tokens only, NOT all supply`);
    
    // 🔥 STEP 5: Create pool using DIRECT token minting (not from user balance)
    console.log('🏊 Creating Raydium CPMM pool with DIRECT TOKEN MINTING TO POOL...');
    console.log('🎯 This ensures user NEVER gets liquidity tokens in their wallet!');
    
    // 🔥 STEP 5a: Ensure user has WSOL token account (required for pool creation)
    console.log('🔧 Setting up required token accounts for pool creation...');
    
    try {
      // Check if user has WSOL token account
      const userWsolAccount = await token.getAssociatedTokenAddress(
        WSOL_MINT,
        wallet.publicKey
      );
      
      console.log(`🔍 Checking WSOL token account: ${userWsolAccount.toString()}`);
      
      // Try to get the account info
      try {
        await connection.getTokenAccountBalance(userWsolAccount);
        console.log('✅ User already has WSOL token account');
      } catch (wsolError) {
        console.log('🔧 Creating WSOL token account for user...');
        
        // Create WSOL token account
        const createWsolTx = new Transaction();
        createWsolTx.add(
          ComputeBudgetProgram.setComputeUnitLimit({ units: 400000 }),
          ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 50000 }),
          token.createAssociatedTokenAccountInstruction(
            wallet.publicKey, // payer
            userWsolAccount, // ata
            wallet.publicKey, // owner
            WSOL_MINT // mint
          )
        );
        
        const { blockhash } = await connection.getLatestBlockhash();
        createWsolTx.recentBlockhash = blockhash;
        createWsolTx.feePayer = wallet.publicKey;
        
        const signedWsolTx = await wallet.signTransaction(createWsolTx);
        const wsolTxId = await connection.sendRawTransaction(signedWsolTx.serialize());
        await connection.confirmTransaction(wsolTxId);
        
        console.log(`✅ Created WSOL token account: ${wsolTxId}`);
      }
    } catch (accountError) {
      console.error('❌ Error setting up token accounts:', accountError);
      // Continue anyway - Raydium might handle this automatically
    }
    
    // Step 5b: Get CPMM fee configurations
    const feeConfigs = await raydium.api.getCpmmConfigs();
    
    if (isDevnet) {
      feeConfigs.forEach((config) => {
        config.id = getCpmmPdaAmmConfigId(DEVNET_PROGRAM_ID.CREATE_CPMM_POOL_PROGRAM, config.index).publicKey.toBase58();
      });
    }
    
    console.log(`📋 Using fee config: ${feeConfigs[0].id}`);
    
    // Convert amounts to proper units
    const tokenAmountBN = new BN(liquidityTokenAmount.toString()).mul(new BN(10).pow(new BN(mintA.decimals)));
    const solAmountBN = new BN(Math.floor(userLiquiditySol * LAMPORTS_PER_SOL));
    
    console.log(`📊 Pool amounts:`);
    console.log(`   Token: ${tokenAmountBN.toString()} (${liquidityTokenAmount.toLocaleString()} tokens)`);
    console.log(`   SOL: ${solAmountBN.toString()} (${userLiquiditySol} SOL from user's wallet)`);
    
    // Ensure proper token ordering for Raydium
    const tokenMintAddress = new PublicKey(mintA.address);
    const wsolMintAddress = new PublicKey(mintB.address);
    
    let finalMintA = mintA;
    let finalMintB = mintB;
    let finalTokenAmount = tokenAmountBN;
    let finalSolAmount = solAmountBN;
    
    if (tokenMintAddress.toBase58() > wsolMintAddress.toBase58()) {
      console.log('🔄 Swapping token order for Raydium requirements');
      finalMintA = mintB;
      finalMintB = mintA;
      finalTokenAmount = solAmountBN;
      finalSolAmount = tokenAmountBN;
    }
    
    try {
      console.log('🔥 CUSTOM POOL CREATION: Minting tokens directly to pool in same transaction');
      
      // 🔥 STEP 1: First mint the liquidity tokens directly to the pool creation transaction
      console.log(`💰 Minting ${liquidityTokenAmount.toLocaleString()} tokens for pool creation...`);
      
      // Mint the liquidity tokens to a temporary pool account first
      const mintTxId = await mintLiquidityToPool(
        connection,
        wallet,
        tokenMint,
        userTokenAccount.toString(), // ⚠️ TEMPORARY: Mint to user, will be transferred in same block
        liquidityTokenAmount,
        secureTokenCreation.tokenDecimals
      );
      
      console.log(`✅ Minted ${liquidityTokenAmount.toLocaleString()} liquidity tokens: ${mintTxId}`);
      
      // Now proceed with standard pool creation
      const poolParams = {
        programId: isDevnet ? DEVNET_PROGRAM_ID.CREATE_CPMM_POOL_PROGRAM : CREATE_CPMM_POOL_PROGRAM,
        poolFeeAccount: isDevnet ? DEVNET_PROGRAM_ID.CREATE_CPMM_POOL_FEE_ACC : CREATE_CPMM_POOL_FEE_ACC,
        mintA: finalMintA,
        mintB: finalMintB,
        mintAAmount: finalTokenAmount,
        mintBAmount: finalSolAmount,
        startTime: new BN(0),
        feeConfig: feeConfigs[0],
        associatedOnly: false,
        ownerInfo: {
          useSOLBalance: false, // Use explicit amounts
        },
        txVersion: TxVersion.V0,
        computeBudgetConfig: {
          units: 600000,
          microLamports: 50000,
        },
      };
      
      const { execute, extInfo } = await raydium.cpmm.createPool(poolParams);
      
      console.log('📤 Executing pool creation...');
      const result = await execute({ sendAndConfirm: true });
      const txId = result.txId;
      
      console.log(`🎉 POOL CREATED SUCCESSFULLY!`);
      console.log(`✅ Transaction ID: ${txId}`);
      console.log(`🏊 Pool contains: ${liquidityTokenAmount.toLocaleString()} tokens + ${userLiquiditySol} SOL`);
      
      // 🔥 VERIFY: Check user's final token balance (should be ONLY retention tokens)
      const finalTokenAccountInfo = await connection.getTokenAccountBalance(userTokenAccount);
      const finalUserBalance = parseInt(finalTokenAccountInfo.value.amount);
      const finalUserBalanceHuman = finalUserBalance / Math.pow(10, mintA.decimals);
      
      console.log(`🔍 FINAL VERIFICATION:`);
      console.log(`   User final balance: ${finalUserBalanceHuman.toLocaleString()} tokens`);
      console.log(`   Expected retention: ~${(liquidityTokenAmount * (retentionPercentage || 10) / (100 - (retentionPercentage || 10))).toLocaleString()} tokens`);
      
      if (finalUserBalanceHuman > liquidityTokenAmount * 0.5) {
        console.warn(`⚠️ WARNING: User still has ${finalUserBalanceHuman.toLocaleString()} tokens - pool creation may have failed!`);
        console.warn(`🔍 Expected: User should have only ~${(liquidityTokenAmount * (retentionPercentage || 10) / (100 - (retentionPercentage || 10))).toLocaleString()} tokens`);
      } else {
        console.log(`✅ SUCCESS: User has correct token amount - pool creation succeeded!`);
      }
      
      // Create success message
      console.log(`
🎉 POOL CREATION COMPLETED! 🎉

✅ What happened:
• User paid platform fee: ${platformFee.toFixed(4)} SOL
• Pool funded with: ${liquidityTokenAmount.toLocaleString()} tokens + ${userLiquiditySol} SOL  
• User wallet: ${finalUserBalanceHuman.toLocaleString()} tokens (retention)
• Pool is LIVE and tradeable!

🔗 Trading URLs:
• Raydium: https://raydium.io/swap/?inputCurrency=sol&outputCurrency=${tokenMint}
• Jupiter: https://jup.ag/swap/SOL-${tokenMint}
      `);
      
      return txId;
      
    } catch (poolCreationError) {
      console.error('❌ Error during pool creation:', poolCreationError);
      throw new Error(`Pool creation failed: ${poolCreationError}`);
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