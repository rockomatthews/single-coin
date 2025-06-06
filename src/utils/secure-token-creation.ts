import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  SystemProgram,
  ComputeBudgetProgram,
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  MintLayout,
  createInitializeMintInstruction,
  createMintToInstruction,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createSetAuthorityInstruction,
  AuthorityType,
} from '@solana/spl-token';
import { TokenParams } from './solana';

/**
 * SECURE Token Creation Flow
 * 
 * 1. Create mint with platform as authority
 * 2. Mint ONLY retention amount to user
 * 3. Keep mint authority for pool creation
 * 4. During pool creation, mint liquidity directly to pool
 * 5. Revoke mint authority after pool is created
 */

export interface SecureTokenResult {
  mintAddress: string;
  mintKeypair: Keypair; // Keep for pool creation
  userTokenAccount: string | null;
  userTokenAmount: number;
  liquidityTokenAmount: number;
}

/**
 * Step 1: Create token and mint ONLY retention amount to user
 */
export async function createTokenSecurely(
  connection: Connection,
  wallet: any,
  params: TokenParams
): Promise<SecureTokenResult> {
  console.log('🔒 SECURE TOKEN CREATION - Starting secure workflow');
  
  // Calculate amounts
  const totalSupply = params.supply;
  const retentionPercentage = params.retentionPercentage || 0;
  const userAmount = Math.floor(totalSupply * (retentionPercentage / 100));
  const liquidityAmount = totalSupply - userAmount;
  
  console.log(`📊 Token Distribution Plan:`);
  console.log(`   Total Supply: ${totalSupply.toLocaleString()}`);
  console.log(`   User Gets: ${userAmount.toLocaleString()} (${retentionPercentage}%)`);
  console.log(`   Pool Gets: ${liquidityAmount.toLocaleString()} (${100 - retentionPercentage}%)`);
  
  if (liquidityAmount <= 0) {
    throw new Error('No tokens allocated for liquidity pool!');
  }
  
  const isPhantomAvailable = window.phantom?.solana?.signAndSendTransaction;
  
  // Generate mint keypair - KEEP THIS FOR LATER
  const mintKeypair = Keypair.generate();
  const mintPublicKey = mintKeypair.publicKey;
  
  try {
    // Create mint account
    const mintSpace = MintLayout.span;
    const mintRent = await connection.getMinimumBalanceForRentExemption(mintSpace);
    
    const createMintTx = new Transaction().add(
      ComputeBudgetProgram.setComputeUnitLimit({ units: 400000 }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 50000 }),
      SystemProgram.createAccount({
        fromPubkey: wallet.publicKey,
        newAccountPubkey: mintPublicKey,
        lamports: mintRent,
        space: mintSpace,
        programId: TOKEN_PROGRAM_ID,
      }),
      createInitializeMintInstruction(
        mintPublicKey,
        params.decimals,
        wallet.publicKey, // Mint authority - KEEP THIS
        wallet.publicKey, // Freeze authority
        TOKEN_PROGRAM_ID
      )
    );
    
    createMintTx.feePayer = wallet.publicKey;
    const blockhash = await connection.getLatestBlockhash();
    createMintTx.recentBlockhash = blockhash.blockhash;
    
    // Sign and send
    let createMintTxId: string;
    if (isPhantomAvailable) {
      createMintTx.partialSign(mintKeypair);
      const result = await window.phantom!.solana!.signAndSendTransaction(createMintTx);
      createMintTxId = result.signature;
    } else {
      createMintTx.sign(mintKeypair);
      const signedTx = await wallet.signTransaction(createMintTx);
      createMintTxId = await connection.sendRawTransaction(signedTx.serialize());
    }
    
    console.log(`✅ Mint created: ${mintPublicKey.toString()}`);
    
    // Confirm
    await confirmWithRetry(connection, createMintTxId, blockhash);
    
    // Mint ONLY retention amount to user (if any)
    let userTokenAccount: string | null = null;
    
    if (userAmount > 0) {
      const userATA = await getAssociatedTokenAddress(mintPublicKey, wallet.publicKey);
      
      const mintToUserTx = new Transaction().add(
        ComputeBudgetProgram.setComputeUnitLimit({ units: 400000 }),
        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 50000 }),
        createAssociatedTokenAccountInstruction(
          wallet.publicKey,
          userATA,
          wallet.publicKey,
          mintPublicKey
        ),
        createMintToInstruction(
          mintPublicKey,
          userATA,
          wallet.publicKey,
          userAmount * Math.pow(10, params.decimals)
        )
      );
      
      mintToUserTx.feePayer = wallet.publicKey;
      const mintBlockhash = await connection.getLatestBlockhash();
      mintToUserTx.recentBlockhash = mintBlockhash.blockhash;
      
      let mintToUserTxId: string;
      if (isPhantomAvailable) {
        const result = await window.phantom!.solana!.signAndSendTransaction(mintToUserTx);
        mintToUserTxId = result.signature;
      } else {
        const signedTx = await wallet.signTransaction(mintToUserTx);
        mintToUserTxId = await connection.sendRawTransaction(signedTx.serialize());
      }
      
      await confirmWithRetry(connection, mintToUserTxId, mintBlockhash);
      
      console.log(`✅ Minted ${userAmount.toLocaleString()} tokens to user`);
      userTokenAccount = userATA.toString();
    }
    
    console.log(`⚠️ MINT AUTHORITY RETAINED - ${liquidityAmount.toLocaleString()} tokens NOT YET MINTED`);
    console.log(`🔐 These will be minted directly to pool during pool creation`);
    
    return {
      mintAddress: mintPublicKey.toString(),
      mintKeypair, // CRITICAL: Keep this for pool creation
      userTokenAccount,
      userTokenAmount: userAmount,
      liquidityTokenAmount: liquidityAmount,
    };
    
  } catch (error) {
    console.error('❌ Error in secure token creation:', error);
    throw error;
  }
}

/**
 * Step 2: Mint liquidity tokens directly to pool vault
 */
export async function mintLiquidityToPool(
  connection: Connection,
  wallet: any,
  mintAddress: string,
  poolVaultAddress: string,
  amount: number,
  decimals: number
): Promise<string> {
  console.log(`🏊 Minting ${amount.toLocaleString()} tokens DIRECTLY to pool vault`);
  
  const mintPubkey = new PublicKey(mintAddress);
  const vaultPubkey = new PublicKey(poolVaultAddress);
  const isPhantomAvailable = window.phantom?.solana?.signAndSendTransaction;
  
  const mintToPoolTx = new Transaction().add(
    ComputeBudgetProgram.setComputeUnitLimit({ units: 400000 }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 50000 }),
    createMintToInstruction(
      mintPubkey,
      vaultPubkey,
      wallet.publicKey, // Must still be mint authority
      amount * Math.pow(10, decimals)
    )
  );
  
  mintToPoolTx.feePayer = wallet.publicKey;
  const blockhash = await connection.getLatestBlockhash();
  mintToPoolTx.recentBlockhash = blockhash.blockhash;
  
  let txId: string;
  if (isPhantomAvailable) {
    const result = await window.phantom!.solana!.signAndSendTransaction(mintToPoolTx);
    txId = result.signature;
  } else {
    const signedTx = await wallet.signTransaction(mintToPoolTx);
    txId = await connection.sendRawTransaction(signedTx.serialize());
  }
  
  await confirmWithRetry(connection, txId, blockhash);
  
  console.log(`✅ Successfully minted ${amount.toLocaleString()} tokens to pool`);
  return txId;
}

/**
 * Step 3: Revoke all authorities after pool creation
 */
export async function finalizeTokenSecurity(
  connection: Connection,
  wallet: any,
  mintAddress: string,
  revokeMint: boolean = true,
  revokeFreeze: boolean = true
): Promise<string> {
  console.log('🔒 Finalizing token security - revoking authorities');
  
  const mintPubkey = new PublicKey(mintAddress);
  const isPhantomAvailable = window.phantom?.solana?.signAndSendTransaction;
  
  const revokeTx = new Transaction().add(
    ComputeBudgetProgram.setComputeUnitLimit({ units: 400000 }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 50000 })
  );
  
  if (revokeMint) {
    revokeTx.add(
      createSetAuthorityInstruction(
        mintPubkey,
        wallet.publicKey,
        AuthorityType.MintTokens,
        null
      )
    );
  }
  
  if (revokeFreeze) {
    revokeTx.add(
      createSetAuthorityInstruction(
        mintPubkey,
        wallet.publicKey,
        AuthorityType.FreezeAccount,
        null
      )
    );
  }
  
  revokeTx.feePayer = wallet.publicKey;
  const blockhash = await connection.getLatestBlockhash();
  revokeTx.recentBlockhash = blockhash.blockhash;
  
  let txId: string;
  if (isPhantomAvailable) {
    const result = await window.phantom!.solana!.signAndSendTransaction(revokeTx);
    txId = result.signature;
  } else {
    const signedTx = await wallet.signTransaction(revokeTx);
    txId = await connection.sendRawTransaction(signedTx.serialize());
  }
  
  await confirmWithRetry(connection, txId, blockhash);
  
  console.log('✅ Token authorities revoked - supply is now immutable');
  return txId;
}

/**
 * Helper: Confirm transaction with retry
 */
async function confirmWithRetry(
  connection: Connection,
  signature: string,
  blockhash: { blockhash: string; lastValidBlockHeight: number }
): Promise<void> {
  try {
    await connection.confirmTransaction({
      signature,
      blockhash: blockhash.blockhash,
      lastValidBlockHeight: blockhash.lastValidBlockHeight
    }, 'confirmed');
  } catch (error) {
    // Check if actually confirmed despite timeout
    const status = await connection.getSignatureStatus(signature);
    if (!status.value?.confirmationStatus) {
      throw new Error(`Transaction failed to confirm: ${signature}`);
    }
  }
} 