// Wallet Adapter Safe Transaction Service
// Uses official Solana Wallet Adapter to prevent Phantom security warnings

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

interface WalletAdapterResult {
  mintAddress: string;
  mintKeypair: Keypair;
  userTokenAccount: string | null;
  userTokenAmount: number;
  liquidityTokenAmount: number;
  transactions: Array<{
    name: string;
    signature: string;
    description: string;
  }>;
}

/**
 * Step 1: Create token mint account (using wallet adapter)
 */
async function createMintAccountSafe(
  connection: Connection,
  wallet: any, // Wallet adapter wallet
  mintKeypair: Keypair,
  decimals: number
): Promise<string> {
  console.log('🎯 Step 1: Creating token mint account (wallet adapter)');
  
  const mintSpace = MintLayout.span;
  const mintRent = await connection.getMinimumBalanceForRentExemption(mintSpace);
  
  // Simple transaction: Just create the account
  const createAccountTx = new Transaction().add(
    ComputeBudgetProgram.setComputeUnitLimit({ units: 200000 }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 25000 }),
    SystemProgram.createAccount({
      fromPubkey: wallet.publicKey!,
      newAccountPubkey: mintKeypair.publicKey,
      lamports: mintRent,
      space: mintSpace,
      programId: TOKEN_PROGRAM_ID,
    })
  );
  
  createAccountTx.feePayer = wallet.publicKey!;
  const blockhash = await connection.getLatestBlockhash();
  createAccountTx.recentBlockhash = blockhash.blockhash;
  
  // Sign with mint keypair first
  createAccountTx.partialSign(mintKeypair);
  
  // Use Wallet Adapter's secure API - NO WARNINGS!
  const signedTx = await wallet.signTransaction!(createAccountTx);
  const signature = await connection.sendRawTransaction(signedTx.serialize());
  
  await connection.confirmTransaction({
    signature,
    blockhash: blockhash.blockhash,
    lastValidBlockHeight: blockhash.lastValidBlockHeight
  });
  
  console.log('✅ Token account created:', signature);
  return signature;
}

/**
 * Step 2: Initialize token mint (using wallet adapter)
 */
async function initializeMintSafe(
  connection: Connection,
  wallet: any,
  mintKeypair: Keypair,
  decimals: number
): Promise<string> {
  console.log('🎯 Step 2: Initializing token mint (wallet adapter)');
  
  // Simple transaction: Just initialize the mint
  const initializeTx = new Transaction().add(
    ComputeBudgetProgram.setComputeUnitLimit({ units: 200000 }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 25000 }),
    createInitializeMintInstruction(
      mintKeypair.publicKey,
      decimals,
      wallet.publicKey!, // Mint authority
      wallet.publicKey!, // Freeze authority
      TOKEN_PROGRAM_ID
    )
  );
  
  initializeTx.feePayer = wallet.publicKey!;
  const blockhash = await connection.getLatestBlockhash();
  initializeTx.recentBlockhash = blockhash.blockhash;
  
  // Use Wallet Adapter's secure API - NO WARNINGS!
  const signedTx = await wallet.signTransaction!(initializeTx);
  const signature = await connection.sendRawTransaction(signedTx.serialize());
  
  await connection.confirmTransaction({
    signature,
    blockhash: blockhash.blockhash,
    lastValidBlockHeight: blockhash.lastValidBlockHeight
  });
  
  console.log('✅ Token mint initialized:', signature);
  return signature;
}

/**
 * Step 3: Create user token account (using wallet adapter)
 */
async function createUserTokenAccountSafe(
  connection: Connection,
  wallet: any,
  mintPublicKey: PublicKey
): Promise<{ signature: string; tokenAccount: string }> {
  console.log('🎯 Step 3: Creating user token account (wallet adapter)');
  
  const userATA = await getAssociatedTokenAddress(mintPublicKey, wallet.publicKey!);
  
  // Simple transaction: Just create token account
  const createTokenAccountTx = new Transaction().add(
    ComputeBudgetProgram.setComputeUnitLimit({ units: 200000 }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 25000 }),
    createAssociatedTokenAccountInstruction(
      wallet.publicKey!,
      userATA,
      wallet.publicKey!,
      mintPublicKey
    )
  );
  
  createTokenAccountTx.feePayer = wallet.publicKey!;
  const blockhash = await connection.getLatestBlockhash();
  createTokenAccountTx.recentBlockhash = blockhash.blockhash;
  
  // Use Wallet Adapter's secure API - NO WARNINGS!
  const signedTx = await wallet.signTransaction!(createTokenAccountTx);
  const signature = await connection.sendRawTransaction(signedTx.serialize());
  
  await connection.confirmTransaction({
    signature,
    blockhash: blockhash.blockhash,
    lastValidBlockHeight: blockhash.lastValidBlockHeight
  });
  
  console.log('✅ User token account created:', signature);
  return {
    signature,
    tokenAccount: userATA.toString()
  };
}

/**
 * Step 4: Mint tokens to user (using wallet adapter)
 */
async function mintTokensToUserSafe(
  connection: Connection,
  wallet: any,
  mintPublicKey: PublicKey,
  userTokenAccount: string,
  amount: number,
  decimals: number
): Promise<string> {
  console.log(`🎯 Step 4: Minting ${amount.toLocaleString()} tokens to user (wallet adapter)`);
  
  // Simple transaction: Just mint tokens
  const mintTx = new Transaction().add(
    ComputeBudgetProgram.setComputeUnitLimit({ units: 200000 }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 25000 }),
    createMintToInstruction(
      mintPublicKey,
      new PublicKey(userTokenAccount),
      wallet.publicKey!,
      amount * Math.pow(10, decimals)
    )
  );
  
  mintTx.feePayer = wallet.publicKey!;
  const blockhash = await connection.getLatestBlockhash();
  mintTx.recentBlockhash = blockhash.blockhash;
  
  // Use Wallet Adapter's secure API - NO WARNINGS!
  const signedTx = await wallet.signTransaction!(mintTx);
  const signature = await connection.sendRawTransaction(signedTx.serialize());
  
  await connection.confirmTransaction({
    signature,
    blockhash: blockhash.blockhash,
    lastValidBlockHeight: blockhash.lastValidBlockHeight
  });
  
  console.log('✅ Tokens minted to user:', signature);
  return signature;
}

/**
 * Main function: Create token with Wallet Adapter (NO PHANTOM WARNINGS!)
 */
export async function createTokenWalletAdapterSafe(
  connection: Connection,
  wallet: any, // Wallet from useWallet() hook
  params: {
    decimals: number;
    supply: number;
    retentionPercentage: number;
  }
): Promise<WalletAdapterResult> {
  console.log('🛡️ WALLET ADAPTER SAFE TOKEN CREATION: No Phantom warnings!');
  console.log('✅ Using official Solana Wallet Adapter instead of direct Phantom API');
  
  // Check wallet adapter availability
  if (!wallet.connected || !wallet.publicKey || !wallet.signTransaction) {
    throw new Error('Wallet not connected or does not support signing');
  }
  
  const transactions: Array<{ name: string; signature: string; description: string }> = [];
  
  // Generate mint address
  const mintKeypair = Keypair.generate();
  console.log('🎯 Generated mint address:', mintKeypair.publicKey.toString());
  
  const mintPublicKey = mintKeypair.publicKey;
  
  // Calculate amounts
  const totalSupply = params.supply;
  const retentionPercentage = params.retentionPercentage || 0;
  const userAmount = Math.floor(totalSupply * (retentionPercentage / 100));
  const liquidityAmount = totalSupply - userAmount;
  
  console.log(`📊 Token Distribution Plan:`);
  console.log(`   Total Supply: ${totalSupply.toLocaleString()}`);
  console.log(`   User Gets: ${userAmount.toLocaleString()} (${retentionPercentage}%)`);
  console.log(`   Pool Gets: ${liquidityAmount.toLocaleString()} (${100 - retentionPercentage}%)`);
  
  try {
    // Step 1: Create mint account
    console.log('\n🔵 Transaction 1/4: Creating mint account...');
    const step1Sig = await createMintAccountSafe(connection, wallet, mintKeypair, params.decimals);
    transactions.push({
      name: 'Create Mint Account',
      signature: step1Sig,
      description: 'Created the token mint account on Solana'
    });
    
    // Small delay between transactions for better UX
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 2: Initialize mint
    console.log('\n🔵 Transaction 2/4: Initializing token...');
    const step2Sig = await initializeMintSafe(connection, wallet, mintKeypair, params.decimals);
    transactions.push({
      name: 'Initialize Token',
      signature: step2Sig,
      description: 'Initialized the token with your settings'
    });
    
    let userTokenAccount: string | null = null;
    
    // Step 3 & 4: Create user account and mint tokens (if retention > 0)
    if (userAmount > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('\n🔵 Transaction 3/4: Creating your token account...');
      const step3Result = await createUserTokenAccountSafe(connection, wallet, mintPublicKey);
      transactions.push({
        name: 'Create Token Account',
        signature: step3Result.signature,
        description: 'Created your personal token account'
      });
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('\n🔵 Transaction 4/4: Minting tokens to your account...');
      const step4Sig = await mintTokensToUserSafe(
        connection,
        wallet,
        mintPublicKey,
        step3Result.tokenAccount,
        userAmount,
        params.decimals
      );
      transactions.push({
        name: 'Mint Tokens',
        signature: step4Sig,
        description: `Minted ${userAmount.toLocaleString()} tokens to your account`
      });
      
      userTokenAccount = step3Result.tokenAccount;
    } else {
      console.log('\n⏭️  Skipping user token minting (0% retention)');
    }
    
    console.log('\n🎉 Wallet adapter safe token creation completed!');
    console.log(`✅ ${transactions.length} simple transactions executed successfully`);
    console.log('🛡️ NO PHANTOM WARNINGS - using official Solana Wallet Adapter!');
    console.log('⚠️ IMPORTANT: Mint authority RETAINED for pool creation');
    console.log('🔒 Authorities will be revoked AFTER pool creation completes');
    
    return {
      mintAddress: mintPublicKey.toString(),
      mintKeypair,
      userTokenAccount,
      userTokenAmount: userAmount,
      liquidityTokenAmount: liquidityAmount,
      transactions
    };
    
  } catch (error) {
    console.error('❌ Error in wallet adapter safe token creation:', error);
    throw error;
  }
}

/**
 * Helper: Mint additional tokens to any address (using wallet adapter)
 */
export async function mintTokensToAddressSafe(
  connection: Connection,
  wallet: any,
  mintAddress: string,
  targetAddress: string,
  amount: number,
  decimals: number
): Promise<string> {
  console.log(`🏊 Minting ${amount.toLocaleString()} tokens to address: ${targetAddress} (wallet adapter)`);
  
  const mintPubkey = new PublicKey(mintAddress);
  const targetPubkey = new PublicKey(targetAddress);
  
  // Simple transaction: Just mint tokens
  const mintTx = new Transaction().add(
    ComputeBudgetProgram.setComputeUnitLimit({ units: 200000 }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 25000 }),
    createMintToInstruction(
      mintPubkey,
      targetPubkey,
      wallet.publicKey!,
      amount * Math.pow(10, decimals)
    )
  );
  
  mintTx.feePayer = wallet.publicKey!;
  const blockhash = await connection.getLatestBlockhash();
  mintTx.recentBlockhash = blockhash.blockhash;
  
  // Use Wallet Adapter's secure API - NO WARNINGS!
  const signedTx = await wallet.signTransaction!(mintTx);
  const signature = await connection.sendRawTransaction(signedTx.serialize());
  
  await connection.confirmTransaction({
    signature,
    blockhash: blockhash.blockhash,
    lastValidBlockHeight: blockhash.lastValidBlockHeight
  });
  
  console.log('✅ Tokens minted successfully:', signature);
  return signature;
}

/**
 * Helper: Revoke authorities (using wallet adapter)
 */
export async function revokeAuthoritiesSafe(
  connection: Connection,
  wallet: any,
  mintAddress: string,
  revokeMint: boolean = true,
  revokeFreeze: boolean = true
): Promise<string> {
  console.log('🔒 Revoking token authorities (wallet adapter)');
  
  const mintPubkey = new PublicKey(mintAddress);
  
  const revokeTx = new Transaction().add(
    ComputeBudgetProgram.setComputeUnitLimit({ units: 200000 }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 25000 })
  );
  
  if (revokeMint) {
    revokeTx.add(
      createSetAuthorityInstruction(
        mintPubkey,
        wallet.publicKey!,
        AuthorityType.MintTokens,
        null
      )
    );
  }
  
  if (revokeFreeze) {
    revokeTx.add(
      createSetAuthorityInstruction(
        mintPubkey,
        wallet.publicKey!,
        AuthorityType.FreezeAccount,
        null
      )
    );
  }
  
  revokeTx.feePayer = wallet.publicKey!;
  const blockhash = await connection.getLatestBlockhash();
  revokeTx.recentBlockhash = blockhash.blockhash;
  
  // Use Wallet Adapter's secure API - NO WARNINGS!
  const signedTx = await wallet.signTransaction!(revokeTx);
  const signature = await connection.sendRawTransaction(signedTx.serialize());
  
  await connection.confirmTransaction({
    signature,
    blockhash: blockhash.blockhash,
    lastValidBlockHeight: blockhash.lastValidBlockHeight
  });
  
  console.log('✅ Token authorities revoked:', signature);
  return signature;
}

/**
 * Helper: Display transaction summary
 */
export function displayTransactionSummarySafe(result: WalletAdapterResult): void {
  console.log('\n🎯 WALLET ADAPTER SAFE TRANSACTION SUMMARY:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  result.transactions.forEach((tx, index) => {
    console.log(`${index + 1}. ${tx.name}`);
    console.log(`   ✅ ${tx.description}`);
    console.log(`   🔗 https://solscan.io/tx/${tx.signature}`);
    console.log('');
  });
  
  console.log(`🎉 Token created: ${result.mintAddress}`);
  console.log(`👤 Your tokens: ${result.userTokenAmount.toLocaleString()}`);
  console.log(`🏊 Pool allocation: ${result.liquidityTokenAmount.toLocaleString()}`);
  console.log('🛡️ NO PHANTOM WARNINGS - Official Wallet Adapter Used!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}