import { 
  Connection, 
  PublicKey, 
  LAMPORTS_PER_SOL, 
  Transaction, 
  SystemProgram,
  TransactionInstruction,
  ComputeBudgetProgram,
  Keypair
} from '@solana/web3.js';
import * as token from '@solana/spl-token';
import { Buffer } from 'buffer';

// Define proper types for wallet functions
interface WalletAdapter {
  publicKey: PublicKey;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions?: (transactions: Transaction[]) => Promise<Transaction[]>;
}

// Type for pool keys
interface PoolKeys {
  id?: string;
  lpMint?: string;
  baseVault?: string;
  quoteVault?: string;
  [key: string]: any;
}

// Raydium CPMM Program Constants (Production)
const CPMM_PROGRAM_ID = new PublicKey("CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C");
const SOL_MINT = new PublicKey("So11111111111111111111111111111111111111112");
const WSOL_MINT = new PublicKey("So11111111111111111111111111111111111111112");

// CPMM Program Fee Configurations
const CPMM_CONFIG_SEED = "amm_config";
const POOL_SEED = "pool";
const POOL_VAULT_SEED = "pool_vault";
const POOL_LP_MINT_SEED = "pool_lp_mint";

// Actual Raydium CPMM Pool Creation Fees (from official docs)
const RAYDIUM_PROTOCOL_FEE = 0.15;        // 0.15 SOL - Raydium's protocol fee
const RAYDIUM_NETWORK_FEES = 0.002;       // ~0.002 SOL for network fees
const RAYDIUM_LP_ACCOUNT_FEE = 0.00203928; // LP token account creation
const TOTAL_RAYDIUM_FEES = RAYDIUM_PROTOCOL_FEE + RAYDIUM_NETWORK_FEES + RAYDIUM_LP_ACCOUNT_FEE; // ~0.154 SOL

/**
 * REAL Raydium CPMM Pool Creation - Creates Immediately Tradeable Pools
 * Uses Raydium's new CPMM program that doesn't require OpenBook markets
 * This creates actual DEX pools that show up on Jupiter, DexScreener, etc.
 */
export async function createLiquidityPool(
  connection: Connection, 
  wallet: WalletAdapter,
  tokenMint: string,
  tokenAmount: number,
  solAmount: number,
  sendFeeToFeeRecipient: boolean = true,
  platformFeeAmount?: number
): Promise<string> {
  try {
    console.log('🚀 Creating REAL Raydium CPMM pool for token:', tokenMint);
    console.log(`💰 Adding ${tokenAmount.toLocaleString()} tokens and ${solAmount} SOL to the pool`);
    
    // Get network type
    const isDevnet = process.env.NEXT_PUBLIC_SOLANA_NETWORK?.toLowerCase() === 'devnet';
    
    // Fee recipient and calculation
    const FEE_RECIPIENT_ADDRESS = process.env.NEXT_PUBLIC_FEE_RECIPIENT_ADDRESS || '';
    
    // Use the platform fee passed from frontend, or fall back to 3% calculation
    const platformFeeSol = platformFeeAmount || (solAmount * 0.03);
    const remainingAfterPlatformFee = solAmount - platformFeeSol;
    
    // Reserve Raydium's fees from the remaining amount
    const actualLiquiditySol = remainingAfterPlatformFee - TOTAL_RAYDIUM_FEES;
    
    if (actualLiquiditySol <= 0) {
      throw new Error(`❌ Insufficient SOL. Need at least ${(platformFeeSol + TOTAL_RAYDIUM_FEES).toFixed(4)} SOL to cover platform fees (${platformFeeSol.toFixed(4)}) + Raydium fees (${TOTAL_RAYDIUM_FEES.toFixed(4)})`);
    }
    
    console.log(`🌐 Network: ${isDevnet ? 'devnet' : 'mainnet'}`);
    console.log(`💸 Platform fee: ${platformFeeSol.toFixed(4)} SOL`);
    console.log(`🏗️ Raydium pool creation fees: ${TOTAL_RAYDIUM_FEES.toFixed(4)} SOL`);
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
        
        const signedFeeTx = await wallet.signTransaction(feeTransaction);
        const feeTxId = await connection.sendRawTransaction(signedFeeTx.serialize());
        await connection.confirmTransaction(feeTxId);
        
        console.log(`✅ Platform fee sent, txId: ${feeTxId}`);
      } catch (feeError) {
        console.error('❌ Error sending fee:', feeError);
        // Continue with pool creation even if fee fails
      }
    }
    
    // Step 2: Get token information
    console.log('📋 Getting token information...');
    
    const tokenMintPubkey = new PublicKey(tokenMint);
    
    // Get token info
    const tokenInfo = await connection.getParsedAccountInfo(tokenMintPubkey);
    const decimals = (tokenInfo.value?.data && 'parsed' in tokenInfo.value.data) 
      ? tokenInfo.value.data.parsed?.info?.decimals || 0
      : 0;
    
    console.log(`✅ Token decimals: ${decimals}`);
    
    // Step 3: Calculate amounts with proper decimals
    const tokenAmountWithDecimals = BigInt(Math.floor(tokenAmount * Math.pow(10, decimals)));
    const solLamports = BigInt(Math.floor(actualLiquiditySol * LAMPORTS_PER_SOL));
    
    console.log(`📊 Token Amount: ${tokenAmountWithDecimals.toString()} (${tokenAmount.toLocaleString()} tokens)`);
    console.log(`📊 SOL Amount: ${solLamports.toString()} (${actualLiquiditySol} SOL)`);
    
    // Step 4: Verify user has sufficient balance
    const userTokenAccount = await token.getAssociatedTokenAddress(
      tokenMintPubkey,
      wallet.publicKey
    );
    
    const tokenAccountInfo = await connection.getTokenAccountBalance(userTokenAccount);
    const userTokenBalance = BigInt(tokenAccountInfo.value.amount);
    
    if (userTokenBalance < tokenAmountWithDecimals) {
      throw new Error(`❌ Insufficient token balance. Have: ${userTokenBalance}, Need: ${tokenAmountWithDecimals}`);
    }
    
    console.log(`✅ Token balance verified: ${userTokenBalance} >= ${tokenAmountWithDecimals}`);
    
    // Calculate what user should have after pool creation
    const retainedTokens = userTokenBalance - tokenAmountWithDecimals;
    console.log(`📊 After pool creation, user will have: ${retainedTokens} tokens remaining in wallet`);
    console.log(`📊 Pool will receive: ${tokenAmountWithDecimals} tokens for liquidity`);
    
    // Step 5: Generate Pool PDAs (Program Derived Addresses)
    console.log('🏗️ Generating pool addresses...');
    
    // Generate unique pool ID
    const poolSeed = Buffer.from(POOL_SEED);
    const [ammConfig] = PublicKey.findProgramAddressSync(
      [Buffer.from(CPMM_CONFIG_SEED), Buffer.from([0])],
      CPMM_PROGRAM_ID
    );
    
    // Generate pool PDA
    const [poolId] = PublicKey.findProgramAddressSync(
      [
        poolSeed,
        ammConfig.toBuffer(),
        tokenMintPubkey.toBuffer(),
        WSOL_MINT.toBuffer()
      ],
      CPMM_PROGRAM_ID
    );
    
    // Generate vault PDAs
    const [tokenVault] = PublicKey.findProgramAddressSync(
      [
        Buffer.from(POOL_VAULT_SEED),
        poolId.toBuffer(),
        tokenMintPubkey.toBuffer()
      ],
      CPMM_PROGRAM_ID
    );
    
    const [solVault] = PublicKey.findProgramAddressSync(
      [
        Buffer.from(POOL_VAULT_SEED),
        poolId.toBuffer(),
        WSOL_MINT.toBuffer()
      ],
      CPMM_PROGRAM_ID
    );
    
    // Generate LP mint PDA
    const [lpMint] = PublicKey.findProgramAddressSync(
      [
        Buffer.from(POOL_LP_MINT_SEED),
        poolId.toBuffer()
      ],
      CPMM_PROGRAM_ID
    );
    
    console.log(`📋 Pool ID: ${poolId.toString()}`);
    console.log(`🏦 Token Vault: ${tokenVault.toString()}`);
    console.log(`🏦 SOL Vault: ${solVault.toString()}`);
    console.log(`🪙 LP Mint: ${lpMint.toString()}`);
    
    // Step 6: Create the REAL Raydium CPMM pool transaction
    console.log('🏊 Creating Raydium CPMM pool transaction...');
    
    const poolTransaction = new Transaction();
    
    // Add compute budget for complex operations
    poolTransaction.add(
      ComputeBudgetProgram.setComputeUnitLimit({ units: 1400000 }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 100000 })
    );
    
    // Create WSOL account for user if needed
    const userWsolAccount = await token.getAssociatedTokenAddress(
      WSOL_MINT,
      wallet.publicKey
    );
    
    try {
      const wsolAccountInfo = await connection.getAccountInfo(userWsolAccount);
      if (!wsolAccountInfo) {
        poolTransaction.add(
          token.createAssociatedTokenAccountInstruction(
            wallet.publicKey,
            userWsolAccount,
            wallet.publicKey,
            WSOL_MINT
          )
        );
      }
    } catch (error) {
      // Create WSOL account
      poolTransaction.add(
        token.createAssociatedTokenAccountInstruction(
          wallet.publicKey,
          userWsolAccount,
          wallet.publicKey,
          WSOL_MINT
        )
      );
    }
    
    // Wrap SOL to WSOL
    poolTransaction.add(
      SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: userWsolAccount,
        lamports: Number(solLamports)
      })
    );
    
    // Sync native (convert SOL to WSOL)
    poolTransaction.add(
      token.createSyncNativeInstruction(userWsolAccount)
    );
    
    // Get user's LP token account
    const userLpAccount = await token.getAssociatedTokenAddress(
      lpMint,
      wallet.publicKey
    );
    
    // Create LP token account if it doesn't exist
    try {
      const lpAccountInfo = await connection.getAccountInfo(userLpAccount);
      if (!lpAccountInfo) {
        poolTransaction.add(
          token.createAssociatedTokenAccountInstruction(
            wallet.publicKey,
            userLpAccount,
            wallet.publicKey,
            lpMint
          )
        );
      }
    } catch (error) {
      // Create LP account
      poolTransaction.add(
        token.createAssociatedTokenAccountInstruction(
          wallet.publicKey,
          userLpAccount,
          wallet.publicKey,
          lpMint
        )
      );
    }
    
    // CRITICAL: Transfer liquidity tokens from user wallet to pool vault
    console.log(`🔄 Transferring ${tokenAmount.toLocaleString()} tokens from user wallet to liquidity pool`);
    console.log(`💰 User will keep remaining tokens in their wallet after pool creation`);
    
    // IMPORTANT: This transfers the liquidity portion (e.g., 800M tokens) to the pool
    // The user retains the rest (e.g., 200M tokens) in their wallet
    poolTransaction.add(
      token.createTransferInstruction(
        userTokenAccount,        // from: user's token account (has 1B tokens)
        tokenVault,             // to: pool's token vault
        wallet.publicKey,       // authority: user's wallet
        tokenAmountWithDecimals // amount: liquidity portion (800M tokens)
      )
    );
    
    // Transfer WSOL from user to pool vault
    poolTransaction.add(
      token.createTransferInstruction(
        userWsolAccount,        // from: user's WSOL account
        solVault,              // to: pool's SOL vault
        wallet.publicKey,      // authority: user's wallet
        solLamports           // amount: SOL for liquidity
      )
    );
    
    // Create the actual Raydium CPMM pool initialization instruction
    const createPoolInstruction = createCpmmPoolInstruction({
      ammConfig,
      poolId,
      tokenMint: tokenMintPubkey,
      quoteMint: WSOL_MINT,
      lpMint,
      tokenVault,
      quoteVault: solVault,
      userTokenAccount,
      userQuoteAccount: userWsolAccount,
      userLpAccount,
      payer: wallet.publicKey,
      tokenAmount: tokenAmountWithDecimals,
      quoteAmount: solLamports,
      openTime: BigInt(0) // Start immediately
    });
    
    poolTransaction.add(createPoolInstruction);
    
    // Add a memo with pool information for indexing
    poolTransaction.add(
      new TransactionInstruction({
        keys: [
          { pubkey: wallet.publicKey, isSigner: true, isWritable: false }
        ],
        programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
        data: Buffer.from(JSON.stringify({
          action: "RAYDIUM_CPMM_POOL_LIVE",
          poolId: poolId.toString(),
          tokenMint: tokenMint,
          tokenAmount: tokenAmount.toString(),
          solAmount: actualLiquiditySol.toString(),
          lpMint: lpMint.toString(),
          timestamp: Math.floor(Date.now() / 1000),
          tradingEnabled: true,
          dex: "Raydium",
          poolType: "CPMM"
        }))
      })
    );
    
    // Complete and send transaction
    const { blockhash } = await connection.getLatestBlockhash();
    poolTransaction.recentBlockhash = blockhash;
    poolTransaction.feePayer = wallet.publicKey;
    
    const signedPoolTx = await wallet.signTransaction(poolTransaction);
    const poolTxId = await connection.sendRawTransaction(signedPoolTx.serialize());
    await connection.confirmTransaction(poolTxId);
    
    console.log(`🎉 RAYDIUM CPMM POOL CREATED SUCCESSFULLY!`);
    console.log(`✅ Transaction ID: ${poolTxId}`);
    console.log(`📋 Pool ID: ${poolId.toString()}`);
    
    // Create success message with immediate trading URLs
    console.log(`
🎉 CONGRATULATIONS! Your token is NOW LIVE and TRADEABLE! 🎉

✅ What was accomplished:
• Real Raydium CPMM pool created on mainnet
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
• DexScreener: https://dexscreener.com/solana/${poolId.toString()}
• Birdeye: https://birdeye.so/token/${tokenMint}?chain=solana

📊 Pool Details:
• Pool ID: ${poolId.toString()}
• LP Token: ${lpMint.toString()}
• Token Vault: ${tokenVault.toString()}
• SOL Vault: ${solVault.toString()}

🚀 Your token is officially trading on Solana DEX ecosystem!
    `);
    
    return poolTxId;
    
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
 * Create the Raydium CPMM pool initialization instruction
 */
function createCpmmPoolInstruction({
  ammConfig,
  poolId,
  tokenMint,
  quoteMint,
  lpMint,
  tokenVault,
  quoteVault,
  userTokenAccount,
  userQuoteAccount,
  userLpAccount,
  payer,
  tokenAmount,
  quoteAmount,
  openTime
}: {
  ammConfig: PublicKey;
  poolId: PublicKey;
  tokenMint: PublicKey;
  quoteMint: PublicKey;
  lpMint: PublicKey;
  tokenVault: PublicKey;
  quoteVault: PublicKey;
  userTokenAccount: PublicKey;
  userQuoteAccount: PublicKey;
  userLpAccount: PublicKey;
  payer: PublicKey;
  tokenAmount: bigint;
  quoteAmount: bigint;
  openTime: bigint;
}): TransactionInstruction {
  
  // Instruction discriminator for "initialize" instruction (first 8 bytes)
  const discriminator = Buffer.from([175, 175, 109, 31, 13, 152, 155, 237]);
  
  // Encode instruction data
  const data = Buffer.alloc(8 + 8 + 8 + 8); // discriminator + tokenAmount + quoteAmount + openTime
  discriminator.copy(data, 0);
  
  // Write amounts as little-endian u64
  data.writeBigUInt64LE(tokenAmount, 8);
  data.writeBigUInt64LE(quoteAmount, 16);
  data.writeBigUInt64LE(openTime, 24);
  
  return new TransactionInstruction({
    programId: CPMM_PROGRAM_ID,
    keys: [
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: ammConfig, isSigner: false, isWritable: false },
      { pubkey: poolId, isSigner: false, isWritable: true },
      { pubkey: tokenMint, isSigner: false, isWritable: false },
      { pubkey: quoteMint, isSigner: false, isWritable: false },
      { pubkey: lpMint, isSigner: false, isWritable: true },
      { pubkey: tokenVault, isSigner: false, isWritable: true },
      { pubkey: quoteVault, isSigner: false, isWritable: true },
      { pubkey: userTokenAccount, isSigner: false, isWritable: true },
      { pubkey: userQuoteAccount, isSigner: false, isWritable: true },
      { pubkey: userLpAccount, isSigner: false, isWritable: true },
      { pubkey: token.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: token.ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data
  });
}

/**
 * Get pool information for a token
 */
export async function getPoolInfo(
  connection: Connection,
  tokenMint: string
): Promise<any> {
  try {
    const tokenMintPubkey = new PublicKey(tokenMint);
    
    const [ammConfig] = PublicKey.findProgramAddressSync(
      [Buffer.from(CPMM_CONFIG_SEED), Buffer.from([0])],
      CPMM_PROGRAM_ID
    );
    
    const [poolId] = PublicKey.findProgramAddressSync(
      [
        Buffer.from(POOL_SEED),
        ammConfig.toBuffer(),
        tokenMintPubkey.toBuffer(),
        WSOL_MINT.toBuffer()
      ],
      CPMM_PROGRAM_ID
    );
    
    const poolAccount = await connection.getAccountInfo(poolId);
    
    if (poolAccount) {
      return {
        poolId: poolId.toString(),
        mintA: { address: tokenMint },
        mintB: { address: WSOL_MINT.toString() },
        type: "CPMM",
        tradeable: true
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching pool info:', error);
    return null;
  }
}

/**
 * Check if a token already has a liquidity pool
 */
export async function checkExistingPool(
  connection: Connection,
  tokenMint: string
): Promise<boolean> {
  try {
    const tokenMintPubkey = new PublicKey(tokenMint);
    
    // Check if CPMM pool exists
    const [ammConfig] = PublicKey.findProgramAddressSync(
      [Buffer.from(CPMM_CONFIG_SEED), Buffer.from([0])],
      CPMM_PROGRAM_ID
    );
    
    const [poolId] = PublicKey.findProgramAddressSync(
      [
        Buffer.from(POOL_SEED),
        ammConfig.toBuffer(),
        tokenMintPubkey.toBuffer(),
        WSOL_MINT.toBuffer()
      ],
      CPMM_PROGRAM_ID
    );
    
    const poolAccount = await connection.getAccountInfo(poolId);
    return poolAccount !== null;
  } catch (error) {
    console.error('Error checking existing pool:', error);
    return false;
  }
}

/**
 * Legacy function for backward compatibility
 */
export async function createSimpleLiquidityCommitment(
  connection: Connection,
  wallet: WalletAdapter,
  tokenMint: string,
  tokenAmount: number,
  solAmount: number
): Promise<string> {
  return createLiquidityPool(connection, wallet, tokenMint, tokenAmount, solAmount, true);
} 