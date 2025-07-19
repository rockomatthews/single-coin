// Phantom-Safe Transaction Patterns
// Based on crypto-boards approach: use simple, standard Solana instructions
// that wallets trust and don't trigger malicious warnings

import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  ComputeBudgetProgram,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';

/**
 * Create a simple SOL transfer transaction that Phantom trusts
 * This mimics the crypto-boards pattern of using basic SystemProgram.transfer()
 */
export async function createSimpleSOLTransfer(
  connection: Connection,
  wallet: any,
  recipientAddress: string,
  amountSOL: number,
  description: string = 'Platform fee'
): Promise<string> {
  console.log('🔷 Creating Phantom-safe SOL transfer transaction');
  console.log(`   Amount: ${amountSOL} SOL`);
  console.log(`   Recipient: ${recipientAddress}`);
  console.log(`   Purpose: ${description}`);
  
  try {
    // Use standard SystemProgram.transfer - this is what crypto-boards uses
    const transaction = new Transaction().add(
      // Small compute budget (keeps transaction simple)
      ComputeBudgetProgram.setComputeUnitLimit({ units: 200000 }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1000 }),
      
      // Standard SOL transfer instruction - Phantom trusts this
      SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: new PublicKey(recipientAddress),
        lamports: Math.floor(amountSOL * LAMPORTS_PER_SOL)
      })
    );
    
    // Standard transaction setup
    transaction.feePayer = wallet.publicKey;
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    
    console.log('🎯 Signing simple SOL transfer (no warnings expected)');
    
    // Sign and send using wallet adapter
    const signedTransaction = await wallet.signTransaction(transaction);
    const signature = await connection.sendRawTransaction(signedTransaction.serialize());
    
    console.log('✅ Simple SOL transfer completed:', signature);
    
    // Wait for confirmation
    await connection.confirmTransaction(signature, 'confirmed');
    
    return signature;
    
  } catch (error) {
    console.error('❌ Simple SOL transfer failed:', error);
    throw error;
  }
}

/**
 * Validate that an address is a valid Solana public key
 * This prevents transaction failures that might trigger warnings
 */
export function validateSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if wallet is properly connected in a way that won't trigger warnings
 * Based on crypto-boards validation pattern
 */
export function validateWalletForSafeTransactions(wallet: any): {
  isValid: boolean;
  error?: string;
} {
  if (!wallet) {
    return { isValid: false, error: 'No wallet provided' };
  }
  
  if (!wallet.publicKey) {
    return { isValid: false, error: 'Wallet not connected' };
  }
  
  if (!wallet.signTransaction) {
    return { isValid: false, error: 'Wallet cannot sign transactions' };
  }
  
  return { isValid: true };
}

/**
 * Create transaction with optimal settings to avoid Phantom warnings
 * Uses the same patterns as crypto-boards
 */
export async function createPhantomFriendlyTransaction(
  connection: Connection,
  wallet: any,
  instructions: any[]
): Promise<Transaction> {
  const transaction = new Transaction();
  
  // Add reasonable compute budget (not too high to avoid suspicion)
  transaction.add(
    ComputeBudgetProgram.setComputeUnitLimit({ units: 300000 }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1000 })
  );
  
  // Add the actual instructions
  instructions.forEach(instruction => transaction.add(instruction));
  
  // Standard transaction setup
  transaction.feePayer = wallet.publicKey;
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  
  return transaction;
}

/**
 * Execute a transaction with proper error handling and retry logic
 * This matches the crypto-boards pattern for reliable execution
 */
export async function executeTransactionSafely(
  connection: Connection,
  wallet: any,
  transaction: Transaction,
  description: string,
  maxRetries: number = 3
): Promise<string> {
  console.log(`🔄 Executing: ${description}`);
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`   Attempt ${attempt}/${maxRetries}`);
      
      // Sign transaction
      const signedTransaction = await wallet.signTransaction(transaction);
      
      // Send transaction
      const signature = await connection.sendRawTransaction(signedTransaction.serialize());
      
      console.log(`   Transaction sent: ${signature}`);
      
      // Confirm transaction
      await connection.confirmTransaction(signature, 'confirmed');
      
      console.log(`✅ ${description} completed successfully`);
      return signature;
      
    } catch (error) {
      console.warn(`⚠️ Attempt ${attempt} failed:`, error);
      
      if (attempt === maxRetries) {
        console.error(`❌ ${description} failed after ${maxRetries} attempts`);
        throw error;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  
  throw new Error(`Transaction failed after ${maxRetries} attempts`);
}