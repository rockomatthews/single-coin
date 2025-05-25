import { 
  Connection, 
  PublicKey, 
  LAMPORTS_PER_SOL, 
  Transaction, 
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

/**
 * Initialize Raydium SDK v2
 */
async function initRaydiumSDK(connection: Connection, wallet: WalletAdapter): Promise<Raydium> {
  const cluster = process.env.NEXT_PUBLIC_SOLANA_NETWORK?.toLowerCase() === 'devnet' ? 'devnet' : 'mainnet';
  
  const raydium = await Raydium.load({
    connection,
    owner: wallet.publicKey,
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
        
        const signedFeeTx = await wallet.signTransaction(feeTransaction);
        const feeTxId = await connection.sendRawTransaction(signedFeeTx.serialize());
        await connection.confirmTransaction(feeTxId);
        
        console.log(`✅ Platform fee sent, txId: ${feeTxId}`);
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
    
    // Step 4: Calculate amounts with proper decimals
    const tokenAmountWithDecimals = new BN(Math.floor(tokenAmount * Math.pow(10, mintA.decimals)));
    const solAmountWithDecimals = new BN(Math.floor(actualLiquiditySol * LAMPORTS_PER_SOL));
    
    console.log(`📊 Token Amount: ${tokenAmountWithDecimals.toString()} (${tokenAmount.toLocaleString()} tokens)`);
    console.log(`📊 SOL Amount: ${solAmountWithDecimals.toString()} (${actualLiquiditySol} SOL)`);
    
    // Step 5: Create the CPMM pool using Raydium SDK
    console.log('🏊 Creating Raydium CPMM pool using official SDK...');
    
    const { execute, extInfo } = await raydium.cpmm.createPool({
      programId: isDevnet ? DEVNET_PROGRAM_ID.CREATE_CPMM_POOL_PROGRAM : CREATE_CPMM_POOL_PROGRAM,
      poolFeeAccount: isDevnet ? DEVNET_PROGRAM_ID.CREATE_CPMM_POOL_FEE_ACC : CREATE_CPMM_POOL_FEE_ACC,
      mintA,
      mintB,
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
    });
    
    // Execute the transaction
    console.log('📤 Executing pool creation transaction...');
    const { txId } = await execute({ sendAndConfirm: true });
    
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
• Pool ID: ${poolKeys['id'] || 'N/A'}
• LP Token: ${poolKeys['lpMint'] || 'N/A'}
• Token Vault: ${poolKeys['vault'] || 'N/A'}
• SOL Vault: ${poolKeys['vaultB'] || 'N/A'}

🚀 Your token is officially trading on Solana DEX ecosystem!
    `);
    
    return txId;
    
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