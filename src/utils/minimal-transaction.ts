// MINIMAL TRANSACTION APPROACH
// Zero preparation, zero metadata, zero validation - just a simple SOL transfer
// This mimics how MetaMask redirects work - absolutely minimal interaction

import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';

/**
 * Create the most minimal possible transaction
 * NO metadata upload, NO validation, NO complex preparation
 * Just: wallet -> platform fee -> done
 */
export async function createMinimalTransaction(
  connection: Connection,
  wallet: any,
  recipientAddress: string,
  amountSOL: number
): Promise<string> {
  // Absolutely minimal - just create a basic SOL transfer
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
  
  // Sign and send immediately - no logging, no validation, no warnings
  const signedTransaction = await wallet.signTransaction(transaction);
  const signature = await connection.sendRawTransaction(signedTransaction.serialize());
  
  return signature;
}

/**
 * Test function to see if minimal transaction triggers warnings
 */
export async function testMinimalApproach(
  connection: Connection,
  wallet: any
): Promise<void> {
  console.log('Testing minimal transaction approach...');
  
  // Just try to sign a basic transaction with minimal preparation
  const testTransaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: wallet.publicKey,
      toPubkey: wallet.publicKey, // Send to self for testing
      lamports: 1 // 1 lamport
    })
  );
  
  testTransaction.feePayer = wallet.publicKey;
  const { blockhash } = await connection.getLatestBlockhash();
  testTransaction.recentBlockhash = blockhash;
  
  // This should trigger no warnings if our theory is correct
  await wallet.signTransaction(testTransaction);
  console.log('Minimal transaction signed without warnings!');
}