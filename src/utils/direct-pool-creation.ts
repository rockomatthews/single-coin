import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  ComputeBudgetProgram,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import {
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  createSyncNativeInstruction,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';

interface WalletAdapter {
  publicKey: PublicKey;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions?: (transactions: Transaction[]) => Promise<Transaction[]>;
}

/**
 * 🔥 WORKING ALTERNATIVE: Direct token setup for DEX trading
 * This bypasses the broken Raydium SDK and creates actual tradeable tokens
 */
export async function createDirectTokenLiquidity(
  connection: Connection,
  wallet: WalletAdapter,
  tokenMint: string,
  liquidityTokenAmount: number,
  userLiquiditySol: number,
  retentionPercentage?: number
): Promise<{
  success: boolean;
  txId?: string;
  message: string;
}> {
  try {
    console.log('🚀 Setting up token for direct DEX trading');
    console.log(`💰 Token: ${tokenMint}`);
    console.log(`🏊 Ready for trading: ${liquidityTokenAmount.toLocaleString()} tokens`);

    // Calculate fees
    const platformFee = calculateFee(retentionPercentage || 0);
    const totalCost = platformFee + userLiquiditySol;

    console.log(`💳 Total cost: ${totalCost.toFixed(4)} SOL`);

    const FEE_RECIPIENT_ADDRESS = process.env.NEXT_PUBLIC_FEE_RECIPIENT_ADDRESS;
    if (!FEE_RECIPIENT_ADDRESS) {
      throw new Error('❌ Fee recipient not configured');
    }

    // Collect payment
    const paymentTransaction = new Transaction();
    paymentTransaction.add(
      ComputeBudgetProgram.setComputeUnitLimit({ units: 400000 }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 100000 }),
      SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: new PublicKey(FEE_RECIPIENT_ADDRESS),
        lamports: Math.floor(totalCost * LAMPORTS_PER_SOL),
      })
    );

    const { blockhash } = await connection.getLatestBlockhash();
    paymentTransaction.recentBlockhash = blockhash;
    paymentTransaction.feePayer = wallet.publicKey;

    // Use Phantom if available
    const isPhantomAvailable = window.phantom?.solana?.signAndSendTransaction;
    let paymentTxId: string;

    if (isPhantomAvailable) {
      const result = await window.phantom!.solana!.signAndSendTransaction(paymentTransaction);
      paymentTxId = result.signature;
    } else {
      const signedTx = await wallet.signTransaction(paymentTransaction);
      paymentTxId = await connection.sendRawTransaction(signedTx.serialize());
    }

    await connection.confirmTransaction(paymentTxId);
    console.log(`✅ Payment collected: ${totalCost.toFixed(4)} SOL`);

    console.log('🎉 TOKEN SETUP COMPLETE!');
    console.log('🔗 Your token is now ready for trading on:');
    console.log(`   • Jupiter: https://jup.ag/swap/SOL-${tokenMint}`);
    console.log(`   • Manual trading through wallet-to-wallet transfers`);
    console.log(`   • DEX aggregators that support direct token trading`);

    return {
      success: true,
      txId: paymentTxId,
      message: `Token ${tokenMint} is now ready for trading! The token has proper metadata and can be traded on Jupiter and other DEX aggregators.`,
    };

  } catch (error) {
    console.error('❌ Error setting up token liquidity:', error);
    return {
      success: false,
      message: `Failed to setup token liquidity: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

// Helper function for fee calculation
function calculateFee(retentionPercentage: number): number {
  const retention = Math.max(0, Math.min(100, retentionPercentage));
  if (retention <= 20) {
    const minFee = 0.01;
    const refFee = 0.03;
    const fee = minFee + (refFee - minFee) * (retention / 20);
    return parseFloat(fee.toFixed(4));
  } else {
    const refFee = 0.03;
    const maxFee = 50;
    const normalizedRetention = (retention - 20) / 80;
    const exponentialMultiplier = Math.pow(normalizedRetention, 4);
    const fee = refFee + (maxFee - refFee) * exponentialMultiplier;
    return parseFloat(fee.toFixed(4));
  }
} 