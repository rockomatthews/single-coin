// ULTRA MINIMAL TOKEN CREATION
// Uses the same minimal approach that worked for fee payment
// NO compute budget, NO high priority fees, NO complex operations

import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  SystemProgram,
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  MintLayout,
  createInitializeMintInstruction,
  createMintToInstruction,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
} from '@solana/spl-token';

/**
 * Create token mint account with MINIMAL transaction (like fee payment)
 * NO compute budget, NO priority fees - just basic instructions
 */
export async function createMinimalTokenMint(
  connection: Connection,
  wallet: any,
  mintKeypair: Keypair,
  decimals: number
): Promise<string> {
  console.log('🔵 Creating minimal token mint (same approach as fee payment)...');
  
  const mintSpace = MintLayout.span;
  const mintRent = await connection.getMinimumBalanceForRentExemption(mintSpace);
  
  // ULTRA MINIMAL: No compute budget, no priority fees
  const transaction = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: wallet.publicKey,
      newAccountPubkey: mintKeypair.publicKey,
      lamports: mintRent,
      space: mintSpace,
      programId: TOKEN_PROGRAM_ID,
    }),
    createInitializeMintInstruction(
      mintKeypair.publicKey,
      decimals,
      wallet.publicKey,
      wallet.publicKey,
      TOKEN_PROGRAM_ID
    )
  );
  
  transaction.feePayer = wallet.publicKey;
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  
  // Pre-sign with mint keypair
  transaction.partialSign(mintKeypair);
  
  console.log('🎯 Requesting signature for minimal token mint...');
  const signedTransaction = await wallet.signTransaction(transaction);
  const signature = await connection.sendRawTransaction(signedTransaction.serialize());
  
  await connection.confirmTransaction(signature, 'confirmed');
  
  console.log('✅ Minimal token mint created:', signature);
  return signature;
}

/**
 * Mint tokens with MINIMAL transaction
 */
export async function mintTokensMinimal(
  connection: Connection,
  wallet: any,
  mintAddress: string,
  amount: number,
  decimals: number
): Promise<string> {
  console.log('🔵 Minting tokens with minimal transaction...');
  
  const mintPublicKey = new PublicKey(mintAddress);
  const userTokenAccount = await getAssociatedTokenAddress(
    mintPublicKey,
    wallet.publicKey
  );
  
  // Check if token account exists
  const accountInfo = await connection.getAccountInfo(userTokenAccount);
  
  const transaction = new Transaction();
  
  // Create token account if needed
  if (!accountInfo) {
    transaction.add(
      createAssociatedTokenAccountInstruction(
        wallet.publicKey,
        userTokenAccount,
        wallet.publicKey,
        mintPublicKey
      )
    );
  }
  
  // Mint tokens - MINIMAL approach
  transaction.add(
    createMintToInstruction(
      mintPublicKey,
      userTokenAccount,
      wallet.publicKey,
      amount * Math.pow(10, decimals)
    )
  );
  
  transaction.feePayer = wallet.publicKey;
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  
  console.log('🎯 Requesting signature for minimal token minting...');
  const signedTransaction = await wallet.signTransaction(transaction);
  const signature = await connection.sendRawTransaction(signedTransaction.serialize());
  
  await connection.confirmTransaction(signature, 'confirmed');
  
  console.log('✅ Tokens minted with minimal transaction:', signature);
  return signature;
}

/**
 * Complete minimal token creation flow
 */
export async function createCompleteMinimalToken(
  connection: Connection,
  wallet: any,
  tokenParams: {
    name: string;
    symbol: string;
    decimals: number;
    supply: number;
    retainedAmount: number;
  }
): Promise<{
  mintAddress: string;
  mintSignature: string;
  mintToSignature: string;
}> {
  
  console.log('🚀 Starting ULTRA MINIMAL token creation...');
  console.log('🎯 Using same minimal approach that worked for fee payment');
  
  // Generate mint keypair
  const mintKeypair = Keypair.generate();
  
  // Step 1: Create minimal mint
  const mintSignature = await createMinimalTokenMint(
    connection,
    wallet,
    mintKeypair,
    tokenParams.decimals
  );
  
  // Step 2: Mint tokens minimally
  const mintToSignature = await mintTokensMinimal(
    connection,
    wallet,
    mintKeypair.publicKey.toString(),
    tokenParams.retainedAmount,
    tokenParams.decimals
  );
  
  console.log('🎉 ULTRA MINIMAL token creation completed!');
  
  return {
    mintAddress: mintKeypair.publicKey.toString(),
    mintSignature,
    mintToSignature,
  };
}