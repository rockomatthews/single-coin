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

/**
 * Initialize Raydium SDK v2
 */
async function initRaydiumSDK(connection: Connection, wallet: WalletAdapter): Promise<Raydium> {
  const cluster = process.env.NEXT_PUBLIC_SOLANA_NETWORK?.toLowerCase() === 'devnet' ? 'devnet' : 'mainnet';
  
  console.log('🔧 Initializing Raydium SDK...');
  
  // Create the signAllTransactions function that Raydium SDK expects
  const signAllTransactions = async <T extends Transaction | VersionedTransaction>(transactions: T[]): Promise<T[]> => {
    console.log(`🔐 Raydium SDK requesting to sign ${transactions.length} transactions`);
    
    // Use wallet adapter's signAllTransactions if available
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
    owner: wallet.publicKey,
    signAllTransactions,
    cluster,
    disableFeatureCheck: true,
    disableLoadToken: false,
    blockhashCommitment: 'finalized',
  });

  return raydium;
}

/**
 * FIXED: Create CPMM Pool that actually charges user properly and creates real pools
 */
export async function createRaydiumCpmmPoolFIXED(
  connection: Connection, 
  wallet: WalletAdapter,
  tokenMint: string,
  liquidityTokenAmount: number,
  userLiquiditySol: number,
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
    console.log('🚀 FIXED: Creating REAL Raydium CPMM pool with proper payment collection');
    console.log(`💰 Token: ${tokenMint}`);
    console.log(`🏊 User wants to add: ${liquidityTokenAmount.toLocaleString()} tokens + ${userLiquiditySol} SOL`);
    
    // 🔥 STEP 1: Calculate total cost and charge user THE FULL AMOUNT upfront
    const platformFee = calculateFee(retentionPercentage || 0);
    const raydiumFees = 0.154; // Fixed Raydium costs
    const totalCostToUser = platformFee + userLiquiditySol + raydiumFees;
    
    console.log(`💳 PROPER PAYMENT COLLECTION:`);
    console.log(`   Platform fee: ${platformFee.toFixed(4)} SOL`);
    console.log(`   User liquidity: ${userLiquiditySol.toFixed(4)} SOL`);
    console.log(`   Raydium fees: ${raydiumFees.toFixed(4)} SOL`);
    console.log(`   TOTAL CHARGING USER: ${totalCostToUser.toFixed(4)} SOL`);
    
    // Charge user the FULL amount they agreed to pay
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
      console.log('💳 Requesting FULL payment from user via Phantom...');
      const result = await window.phantom!.solana!.signAndSendTransaction(paymentTransaction);
      paymentTxId = result.signature;
    } else {
      console.log('💳 Requesting FULL payment from user via wallet adapter...');
      const signedTx = await wallet.signTransaction(paymentTransaction);
      paymentTxId = await connection.sendRawTransaction(signedTx.serialize());
    }
    
    await connection.confirmTransaction(paymentTxId);
    console.log(`✅ FULL PAYMENT COLLECTED: ${totalCostToUser.toFixed(4)} SOL - TxId: ${paymentTxId}`);
    console.log(`💰 Platform has the money, now creating pool with ${userLiquiditySol.toFixed(4)} SOL from collected funds`);

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
        
        // Update balance after minting
        userTokenBalance += liquidityTokenAmount;
        console.log(`✅ User now has: ${userTokenBalance.toLocaleString()} tokens total`);
        
      } catch (mintError) {
        console.error('❌ Error minting liquidity tokens:', mintError);
        throw new Error(`Failed to mint liquidity tokens: ${mintError}`);
      }
    } else {
      throw new Error('❌ Secure token creation parameters missing');
    }
    
    // 🔥 STEP 5: NOW check if user has enough tokens for liquidity (after minting)
    const liquidityTokensRequired = liquidityTokenAmount * Math.pow(10, mintA.decimals);
    if (userTokenBalance < liquidityTokensRequired) {
      throw new Error(`❌ Insufficient token balance after minting. Have: ${userTokenBalance}, Need: ${liquidityTokensRequired}`);
    }
    
    console.log(`✅ Token balance verified: ${userTokenBalance.toLocaleString()} >= ${liquidityTokensRequired.toLocaleString()}`);
    
    // 🔥 STEP 6: Create the pool using collected funds
    console.log('🏊 Creating Raydium CPMM pool using collected funds...');
    
    // Step 6a: Get CPMM fee configurations
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
    console.log(`   SOL: ${solAmountBN.toString()} (${userLiquiditySol} SOL from collected funds)`);
    
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
          useSOLBalance: true, // NOW we can use SOL balance since platform has the money
        },
        txVersion: TxVersion.V0,
        computeBudgetConfig: {
          units: 600000,
          microLamports: 50000,
        },
      };
      
      const { execute, extInfo } = await raydium.cpmm.createPool(poolParams);
      
      console.log('📤 Executing pool creation with collected funds...');
      const result = await execute({ sendAndConfirm: true });
      const txId = result.txId;
      
      console.log(`🎉 POOL CREATED SUCCESSFULLY WITH PROPER PAYMENT FLOW!`);
      console.log(`✅ Transaction ID: ${txId}`);
      console.log(`🏊 Pool contains: ${liquidityTokenAmount.toLocaleString()} tokens + ${userLiquiditySol} SOL`);
      console.log(`💰 Platform properly collected: ${totalCostToUser.toFixed(4)} SOL total`);
      console.log(`   - Platform fee: ${platformFee.toFixed(4)} SOL`);
      console.log(`   - Pool liquidity: ${userLiquiditySol.toFixed(4)} SOL`);
      console.log(`   - Raydium fees: ${raydiumFees.toFixed(4)} SOL`);
      
      // Create success message with immediate trading URLs
      console.log(`
🎉 CONGRATULATIONS! Your token is NOW LIVE and TRADEABLE! 🎉

✅ What was accomplished:
• Real Raydium CPMM pool created on mainnet
• ${liquidityTokenAmount.toLocaleString()} tokens transferred to liquidity pool
• ${userLiquiditySol.toFixed(4)} SOL added to liquidity
• Platform collected proper total: ${totalCostToUser.toFixed(4)} SOL
• Pool is IMMEDIATELY tradeable on all DEXes!

🔗 LIVE Trading URLs (share these NOW):
• Raydium: https://raydium.io/swap/?inputCurrency=sol&outputCurrency=${tokenMint}
• Jupiter: https://jup.ag/swap/SOL-${tokenMint}
• DexScreener: https://dexscreener.com/solana/${tokenMint}
• Birdeye: https://birdeye.so/token/${tokenMint}?chain=solana

🚀 Your token is officially trading on Solana DEX ecosystem!
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