// ULTRA MINIMAL TRANSACTION - No type conflicts
// Just the basics needed to test if we can avoid Phantom warnings

import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';

/**
 * Create the absolute minimum transaction possible
 * No compute budget, no complex setup, just transfer SOL
 */
export async function createUltraMinimalSOLTransfer(
  connection: Connection,
  wallet: any,
  recipientAddress: string,
  amountSOL: number
): Promise<{ transaction: Transaction; execute: () => Promise<string> }> {
  
  // Create the simplest possible transaction
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: wallet.publicKey,
      toPubkey: new PublicKey(recipientAddress),
      lamports: Math.floor(amountSOL * LAMPORTS_PER_SOL)
    })
  );
  
  transaction.feePayer = wallet.publicKey;
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  
  const execute = async (): Promise<string> => {
    const signedTransaction = await wallet.signTransaction(transaction);
    const signature = await connection.sendRawTransaction(signedTransaction.serialize());
    await connection.confirmTransaction(signature, 'confirmed');
    return signature;
  };
  
  return { transaction, execute };
}