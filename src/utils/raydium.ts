// @ts-nocheck
import BN from 'bn.js';
import { Connection, PublicKey, LAMPORTS_PER_SOL, Transaction, SystemProgram } from '@solana/web3.js';

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
  wallet: { publicKey: PublicKey; signTransaction: Function; signAllTransactions?: Function },
  tokenMint: string,
  tokenAmount: number,
  solAmount: number,
  sendFeeToFeeRecipient: boolean = true
): Promise<string> {
  try {
    console.log('Creating liquidity pool for token:', tokenMint);
    console.log(`Adding ${tokenAmount} tokens and ${solAmount} SOL to the pool`);
    
    // Get network type
    const isDevnet = process.env.NEXT_PUBLIC_SOLANA_NETWORK?.toLowerCase() === 'devnet';
    
    // Fee recipient
    const FEE_RECIPIENT_ADDRESS = process.env.NEXT_PUBLIC_FEE_RECIPIENT_ADDRESS || '';
    const FEE_PERCENTAGE = 0.03; // 3%
    
    // Calculate fee 
    const feeSol = solAmount * FEE_PERCENTAGE;
    const remainingSol = solAmount - feeSol;
    
    console.log(`Network: ${isDevnet ? 'devnet' : 'mainnet'}`);
    console.log(`Fee recipient: ${FEE_RECIPIENT_ADDRESS}`);
    console.log(`Fee amount: ${feeSol.toFixed(4)} SOL (3% of ${solAmount} SOL)`);
    
    // Send fee to recipient if requested and address is provided
    if (sendFeeToFeeRecipient && FEE_RECIPIENT_ADDRESS) {
      try {
        // Create a simple SOL transfer instead of using raydium sdk
        const feeTransaction = new Transaction();
        feeTransaction.add(
          SystemProgram.transfer({
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
    
    try {
      // Import the SDK dynamically to avoid SSR issues
      const { Raydium } = await import('@raydium-io/raydium-sdk-v2');
      
      console.log('Initializing Raydium SDK...');
      
      // Initialize Raydium SDK
      const raydium = await Raydium.load({
        connection,
        owner: wallet.publicKey,
      });
      
      // Ensure wallet has signAllTransactions method
      if (!wallet.signAllTransactions) {
        wallet.signAllTransactions = async (txs) => {
          return await Promise.all(
            txs.map(async (tx) => {
              return await wallet.signTransaction(tx);
            })
          );
        };
      }
      
      console.log('Creating pool configuration...');
      
      // Convert token amount to raw amount with decimals
      const decimals = 9; // Default SPL token decimals
      const rawTokenAmount = new BN(tokenAmount * Math.pow(10, decimals));
      const rawSolAmount = new BN(Math.floor(remainingSol * LAMPORTS_PER_SOL));
      
      console.log(`Raw token amount: ${rawTokenAmount.toString()}`);
      console.log(`Raw SOL amount: ${rawSolAmount.toString()}`);
      
      // Create the pool
      const { execute, extInfo } = await raydium.cpmm.createPool({
        mint1: {
          programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
          mint: new PublicKey(tokenMint),
          amount: rawTokenAmount,
          decimals: decimals
        },
        mint2: {
          programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
          mint: new PublicKey(SOL_TOKEN_ADDRESS),
          amount: rawSolAmount,
          decimals: 9
        },
        startTime: isDevnet ? 0 : Math.floor(Date.now() / 1000),
        computeBudgetConfig: {
          units: 400000,
          microLamports: 25000,
        }
      });
      
      console.log('Pool configuration created, executing transaction...');
      
      // Execute the transaction
      const result = await execute({
        signAllTransactions: async (txs) => {
          console.log(`Signing ${txs.length} transactions for Raydium pool creation...`);
          return await Promise.all(
            txs.map(async (tx) => {
              // Ensure each transaction has the feePayer set
              if (!tx.feePayer) {
                tx.feePayer = wallet.publicKey;
              }
              return await wallet.signTransaction(tx);
            })
          );
        }
      });
      
      console.log('Pool created successfully!');
      console.log('Pool details:', extInfo);
      
      return result.txId;
    } catch (raydiumError) {
      console.error('Error with Raydium SDK:', raydiumError);
      throw new Error(`Raydium pool creation failed: ${raydiumError.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Error creating liquidity pool:', error);
    throw new Error(`Failed to create liquidity pool: ${(error as Error).message}`);
  }
} 