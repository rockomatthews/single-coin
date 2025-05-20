/**
 * Test script for Raydium liquidity pool creation
 * Run this with a small amount of SOL to debug the Raydium SDK integration
 */
import { Connection, Transaction, PublicKey } from '@solana/web3.js';
import { createLiquidityPool } from './raydium';

// Define the wallet adapter interface to match the one in raydium.ts
interface WalletAdapter {
  publicKey: PublicKey;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions?: (transactions: Transaction[]) => Promise<Transaction[]>;
}

// Test function to debug Raydium pool creation
export async function testRaydiumPoolCreation(wallet: WalletAdapter, tokenMint: string) {
  console.log('=== RAYDIUM POOL CREATION TEST ===');
  console.log('Using small amounts for testing purposes');
  
  try {
    // Use devnet for testing if available
    const isDevnet = process.env.NEXT_PUBLIC_SOLANA_NETWORK?.toLowerCase() === 'devnet';
    const rpcUrl = isDevnet 
      ? 'https://api.devnet.solana.com'
      : 'https://api.mainnet-beta.solana.com';
    
    console.log(`Using RPC: ${rpcUrl}`);
    console.log(`Network: ${isDevnet ? 'devnet' : 'mainnet'}`);
    
    // Create connection
    const connection = new Connection(rpcUrl);
    
    // Use small amounts for testing
    const tokenAmount = 1000; // Very small amount of tokens
    const solAmount = 0.01;   // Very small amount of SOL
    
    console.log(`Test params: ${tokenAmount} tokens, ${solAmount} SOL`);
    console.log(`Token mint: ${tokenMint}`);
    console.log(`Wallet: ${wallet.publicKey.toString()}`);
    
    // Call the pool creation function with small amounts
    const txId = await createLiquidityPool(
      connection,
      wallet,
      tokenMint,
      tokenAmount,
      solAmount,
      false // Don't send fee for testing
    );
    
    console.log('Liquidity pool creation result:', txId);
    return { success: true, txId };
  } catch (error) {
    console.error('Test failed:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

// Export a function to test with existing token
export async function createTestPoolWithToken(
  connection: Connection,
  wallet: WalletAdapter,
  tokenMint: string
) {
  const tokenAmount = 1000; // Small amount for testing
  const solAmount = 0.01;   // 0.01 SOL
  
  console.log('Creating test pool with small amounts');
  
  try {
    const txId = await createLiquidityPool(
      connection,
      wallet,
      tokenMint,
      tokenAmount,
      solAmount,
      false
    );
    return { success: true, txId };
  } catch (error) {
    console.error('Test pool creation failed:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
} 