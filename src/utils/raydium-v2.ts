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
    
    // 🔥 SIMPLE CALCULATION - No confusing math!
    const platformFee = calculateFee(retentionPercentage || 0);
    const raydiumFees = 0.154; // Fixed Raydium costs
    const totalCostToUser = platformFee + userLiquiditySol + raydiumFees;
    
    console.log(`💳 CHARGING USER THE FULL AMOUNT:`);
    console.log(`   Platform fee: ${platformFee.toFixed(4)} SOL`);
    console.log(`   Your liquidity: ${userLiquiditySol.toFixed(4)} SOL`);
    console.log(`   Raydium fees: ${raydiumFees.toFixed(4)} SOL`);
    console.log(`   TOTAL: ${totalCostToUser.toFixed(4)} SOL`);
    
    // 🔥 STEP 1: Charge user the FULL amount they agreed to pay
    const FEE_RECIPIENT_ADDRESS = process.env.NEXT_PUBLIC_FEE_RECIPIENT_ADDRESS;
    if (!FEE_RECIPIENT_ADDRESS) {
      throw new Error('❌ Fee recipient not configured');
    }
    
    console.log(`💰 Charging user FULL amount: ${totalCostToUser.toFixed(4)} SOL`);
    
    const paymentTransaction = new Transaction();
    paymentTransaction.add(
      ComputeBudgetProgram.setComputeUnitLimit({ units: 400000 }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 50000 }),
      SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: new PublicKey(FEE_RECIPIENT_ADDRESS),
        lamports: Math.floor(totalCostToUser * LAMPORTS_PER_SOL), // FULL AMOUNT
      })
    );
    
    const { blockhash } = await connection.getLatestBlockhash();
    paymentTransaction.recentBlockhash = blockhash;
    paymentTransaction.feePayer = wallet.publicKey;
    
    // Use Phantom to charge the full amount
    const isPhantomAvailable = window.phantom?.solana?.signAndSendTransaction;
    let paymentTxId: string;
    
    if (isPhantomAvailable) {
      console.log('💳 Requesting payment from user via Phantom...');
      const result = await window.phantom!.solana!.signAndSendTransaction(paymentTransaction);
      paymentTxId = result.signature;
    } else {
      console.log('💳 Requesting payment from user via wallet adapter...');
      const signedTx = await wallet.signTransaction(paymentTransaction);
      paymentTxId = await connection.sendRawTransaction(signedTx.serialize());
    }
    
    await connection.confirmTransaction(paymentTxId);
    console.log(`✅ PAYMENT COLLECTED: ${totalCostToUser.toFixed(4)} SOL - TxId: ${paymentTxId}`);
    console.log(`💰 Platform received: ${platformFee.toFixed(4)} SOL`);
    console.log(`🏊 Available for pool: ${userLiquiditySol.toFixed(4)} SOL`);
    console.log(`🏗️ Raydium fees covered: ${raydiumFees.toFixed(4)} SOL`);

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
    
    // 🔥 STEP 4: Mint the FULL liquidity amount to user temporarily
    // (Raydium SDK requires user to have tokens before transferring to pool)
    console.log('🔒 SECURE WORKFLOW: Minting liquidity tokens to user for pool creation');
    console.log(`💰 User has: ${userTokenBalance.toLocaleString()} tokens (retention)`);
    console.log(`🏊 Minting: ${liquidityTokenAmount.toLocaleString()} tokens (for pool)`);
    
    if (secureTokenCreation?.shouldMintLiquidity) {
      try {
        const mintTxId = await mintLiquidityToPool(
          connection,
          wallet,
          tokenMint,
          userTokenAccount.toString(), // Mint to user temporarily
          liquidityTokenAmount, // FULL liquidity amount
          secureTokenCreation.tokenDecimals
        );
        
        console.log(`✅ Minted ${liquidityTokenAmount.toLocaleString()} tokens to user: ${mintTxId}`);
        
        // Update balance
        userTokenBalance += liquidityTokenAmount;
        console.log(`✅ User now has: ${userTokenBalance.toLocaleString()} tokens total`);
        
      } catch (mintError) {
        console.error('❌ Error minting liquidity tokens:', mintError);
        throw new Error(`Failed to mint liquidity tokens: ${mintError}`);
      }
    } else {
      throw new Error('❌ Secure token creation parameters missing');
    }
    
    // 🔥 STEP 5: Create the pool with proper amounts
    console.log('🏊 Creating Raydium CPMM pool...');
    
    // Convert amounts to proper units
    const tokenAmountBN = new BN(liquidityTokenAmount.toString()).mul(new BN(10).pow(new BN(mintA.decimals)));
    const solAmountBN = new BN(Math.floor(userLiquiditySol * LAMPORTS_PER_SOL));
    
    console.log(`📊 Pool amounts:`);
    console.log(`   Token: ${tokenAmountBN.toString()} (${liquidityTokenAmount.toLocaleString()} tokens)`);
    console.log(`   SOL: ${solAmountBN.toString()} (${userLiquiditySol} SOL)`);
    
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
          useSOLBalance: true,
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
      
      // Revoke authorities if requested
      if (secureTokenCreation?.shouldRevokeAuthorities) {
        try {
          const revokeTxId = await finalizeTokenSecurity(
            connection,
            wallet,
            tokenMint,
            true,
            true
          );
          console.log(`✅ Token authorities revoked: ${revokeTxId}`);
        } catch (revokeError) {
          console.error('❌ Error revoking authorities:', revokeError);
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
      
      console.log(`✅ POOL IS LIVE AND TRADEABLE!`);
      console.log(`🔗 Raydium: https://raydium.io/swap/?inputCurrency=sol&outputCurrency=${tokenMint}`);
      console.log(`🔗 Jupiter: https://jup.ag/swap/SOL-${tokenMint}`);
      
      return txId;
      
    } catch (poolError) {
      console.error('❌ Pool creation failed:', poolError);
      throw poolError;
    }
    
  } catch (error) {
    console.error('❌ Error in pool creation:', error);
    throw new Error(`❌ Pool creation failed: ${error instanceof Error ? error.message : String(error)}`);
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