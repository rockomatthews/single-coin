import {
  CREATE_CPMM_POOL_PROGRAM,
  CREATE_CPMM_POOL_FEE_ACC,
  DEVNET_PROGRAM_ID,
  getCpmmPdaAmmConfigId,
} from '@raydium-io/raydium-sdk-v2';
import BN from 'bn.js';
import { Connection, PublicKey, LAMPORTS_PER_SOL, Transaction } from '@solana/web3.js';

// SOL token address is always the same on all networks
const SOL_TOKEN_ADDRESS = 'So11111111111111111111111111111111111111112';

/**
 * Initialize the Raydium SDK and create a liquidity pool
 * @param connection Solana connection
 * @param wallet User's wallet
 * @param tokenMint The newly created token's mint address
 * @param tokenAmount Amount of tokens to add to the pool
 * @param solAmount Amount of SOL to add to the pool
 * @returns Transaction ID
 */
export async function createLiquidityPool(
  connection: Connection, 
  wallet: any,
  tokenMint: string,
  tokenAmount: number,
  solAmount: number,
  sendFeeToFeeRecipient: boolean = true
): Promise<string> {
  try {
    // Import the SDK dynamically to avoid SSR issues
    const { default: { initSDK } } = await import('@raydium-io/raydium-sdk-v2');
    
    console.log('Creating liquidity pool for token:', tokenMint);
    console.log(`Adding ${tokenAmount} tokens and ${solAmount} SOL to the pool`);
    
    // Get network type
    const isDevnet = process.env.NEXT_PUBLIC_SOLANA_NETWORK?.toLowerCase() === 'devnet';
    const network = isDevnet ? 'devnet' : 'mainnet-beta';
    
    // Fee recipient
    const FEE_RECIPIENT_ADDRESS = process.env.NEXT_PUBLIC_FEE_RECIPIENT_ADDRESS || '';
    const FEE_PERCENTAGE = 0.03; // 3%
    
    // Calculate fee 
    const feeSol = solAmount * FEE_PERCENTAGE;
    const remainingSol = solAmount - feeSol;
    
    console.log(`Network: ${network}`);
    console.log(`Fee recipient: ${FEE_RECIPIENT_ADDRESS}`);
    console.log(`Fee amount: ${feeSol} SOL (3% of ${solAmount} SOL)`);
    
    // Initialize Raydium SDK
    const raydium = await initSDK({
      connection,
      wallet: {
        publicKey: wallet.publicKey,
        signTransaction: wallet.signTransaction,
      },
      endpoint: connection.rpcEndpoint,
      network,
    });
    
    // Convert the token mint string to PublicKey
    const tokenMintPublicKey = new PublicKey(tokenMint);
    
    // Get token info for your token and SOL
    const mintA = {
      address: tokenMintPublicKey.toString(),
      programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', // Standard token program ID
      decimals: 9, // Assuming decimals is 9
    };
    
    const mintB = { 
      address: SOL_TOKEN_ADDRESS,
      programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
      decimals: 9, 
    };
    
    // Get fee configs
    const feeConfigs = await raydium.api.getCpmmConfigs();
    
    // Handle devnet adjustments if needed
    if (network === 'devnet') {
      feeConfigs.forEach((config) => {
        config.id = getCpmmPdaAmmConfigId(
          DEVNET_PROGRAM_ID.CREATE_CPMM_POOL_PROGRAM, 
          config.index
        ).publicKey.toBase58();
      });
    }
    
    // Send fee to recipient if requested and address is provided
    if (sendFeeToFeeRecipient && FEE_RECIPIENT_ADDRESS) {
      try {
        const feeTransaction = new Transaction().add(
          raydium.util.transferSolIx({
            fromPubkey: wallet.publicKey,
            toPubkey: new PublicKey(FEE_RECIPIENT_ADDRESS),
            lamports: Math.floor(feeSol * LAMPORTS_PER_SOL),
          })
        );
        
        const { blockhash } = await connection.getLatestBlockhash();
        feeTransaction.recentBlockhash = blockhash;
        feeTransaction.feePayer = wallet.publicKey;
        
        // Sign and send the fee transaction
        const signedFeeTx = await wallet.signTransaction(feeTransaction);
        const feeTxId = await connection.sendRawTransaction(signedFeeTx.serialize());
        await connection.confirmTransaction(feeTxId);
        
        console.log(`Fee sent successfully, txId: ${feeTxId}`);
      } catch (feeError) {
        console.error('Error sending fee:', feeError);
        // Continue with pool creation even if fee sending fails
      }
    }
    
    // Create the pool with the token and SOL
    const { execute, extInfo } = await raydium.cpmm.createPool({
      programId: isDevnet ? DEVNET_PROGRAM_ID.CREATE_CPMM_POOL_PROGRAM : CREATE_CPMM_POOL_PROGRAM,
      poolFeeAccount: isDevnet ? DEVNET_PROGRAM_ID.CREATE_CPMM_POOL_FEE_ACC : CREATE_CPMM_POOL_FEE_ACC,
      mintA, // Your token
      mintB, // SOL
      // Convert amounts to BN
      mintAAmount: new BN(tokenAmount), 
      mintBAmount: new BN(Math.floor(remainingSol * LAMPORTS_PER_SOL)), // Convert SOL to lamports
      startTime: new BN(0), // Start immediately
      feeConfig: feeConfigs[0], // Use first fee config
      associatedOnly: false,
      ownerInfo: {
        useSOLBalance: true, // Use SOL from wallet
      },
    });
    
    // Execute the pool creation transaction
    const { txId } = await execute({ sendAndConfirm: true });
    
    console.log('Pool created successfully with txId:', txId);
    console.log('Pool details:', {
      poolId: extInfo.address.id?.toString(),
      tokenAAccount: extInfo.address.baseVault?.toString(),
      tokenBAccount: extInfo.address.quoteVault?.toString(),
    });
    
    return txId;
  } catch (error) {
    console.error('Error creating liquidity pool:', error);
    throw new Error(`Failed to create liquidity pool: ${(error as Error).message}`);
  }
} 