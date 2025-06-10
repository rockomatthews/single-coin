// Phantom-Friendly Transaction Service
// Splits complex operations into smaller, simpler transactions to eliminate red warnings

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

/**
 * Phantom-Friendly Token Creation
 * Breaks complex operations into simple, easy-to-understand transactions
 */

interface PhantomFriendlyResult {
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
 * Step 1: Create token mint account (simple transaction)
 */
async function createMintAccount(
  connection: Connection,
  wallet: any,
  mintKeypair: Keypair,
  decimals: number
): Promise<string> {
  console.log('🎯 Step 1: Creating token mint account (simple transaction)');
  
  const mintSpace = MintLayout.span;
  const mintRent = await connection.getMinimumBalanceForRentExemption(mintSpace);
  
  // Simple transaction: Just create the account
  const createAccountTx = new Transaction().add(
    ComputeBudgetProgram.setComputeUnitLimit({ units: 200000 }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 25000 }),
    SystemProgram.createAccount({
      fromPubkey: wallet.publicKey,
      newAccountPubkey: mintKeypair.publicKey,
      lamports: mintRent,
      space: mintSpace,
      programId: TOKEN_PROGRAM_ID,
    })
  );
  
  createAccountTx.feePayer = wallet.publicKey;
  const blockhash = await connection.getLatestBlockhash();
  createAccountTx.recentBlockhash = blockhash.blockhash;
  
  // Sign with both keys
  createAccountTx.partialSign(mintKeypair);
  
  // Use Phantom's secure API
  const result = await window.phantom!.solana!.signAndSendTransaction(createAccountTx);
  
  await connection.confirmTransaction({
    signature: result.signature,
    blockhash: blockhash.blockhash,
    lastValidBlockHeight: blockhash.lastValidBlockHeight
  });
  
  console.log('✅ Token account created:', result.signature);
  return result.signature;
}

/**
 * Step 2: Initialize token mint (simple transaction)
 */
async function initializeMint(
  connection: Connection,
  wallet: any,
  mintKeypair: Keypair,
  decimals: number
): Promise<string> {
  console.log('🎯 Step 2: Initializing token mint (simple transaction)');
  
  // Simple transaction: Just initialize the mint
  const initializeTx = new Transaction().add(
    ComputeBudgetProgram.setComputeUnitLimit({ units: 200000 }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 25000 }),
    createInitializeMintInstruction(
      mintKeypair.publicKey,
      decimals,
      wallet.publicKey, // Mint authority
      wallet.publicKey, // Freeze authority
      TOKEN_PROGRAM_ID
    )
  );
  
  initializeTx.feePayer = wallet.publicKey;
  const blockhash = await connection.getLatestBlockhash();
  initializeTx.recentBlockhash = blockhash.blockhash;
  
  // Use Phantom's secure API
  const result = await window.phantom!.solana!.signAndSendTransaction(initializeTx);
  
  await connection.confirmTransaction({
    signature: result.signature,
    blockhash: blockhash.blockhash,
    lastValidBlockHeight: blockhash.lastValidBlockHeight
  });
  
  console.log('✅ Token mint initialized:', result.signature);
  return result.signature;
}

/**
 * Step 3: Create user token account (simple transaction)
 */
async function createUserTokenAccount(
  connection: Connection,
  wallet: any,
  mintPublicKey: PublicKey
): Promise<{ signature: string; tokenAccount: string }> {
  console.log('🎯 Step 3: Creating user token account (simple transaction)');
  
  const userATA = await getAssociatedTokenAddress(mintPublicKey, wallet.publicKey);
  
  // Simple transaction: Just create token account
  const createTokenAccountTx = new Transaction().add(
    ComputeBudgetProgram.setComputeUnitLimit({ units: 200000 }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 25000 }),
    createAssociatedTokenAccountInstruction(
      wallet.publicKey,
      userATA,
      wallet.publicKey,
      mintPublicKey
    )
  );
  
  createTokenAccountTx.feePayer = wallet.publicKey;
  const blockhash = await connection.getLatestBlockhash();
  createTokenAccountTx.recentBlockhash = blockhash.blockhash;
  
  // Use Phantom's secure API
  const result = await window.phantom!.solana!.signAndSendTransaction(createTokenAccountTx);
  
  await connection.confirmTransaction({
    signature: result.signature,
    blockhash: blockhash.blockhash,
    lastValidBlockHeight: blockhash.lastValidBlockHeight
  });
  
  console.log('✅ User token account created:', result.signature);
  return {
    signature: result.signature,
    tokenAccount: userATA.toString()
  };
}

/**
 * Step 4: Mint tokens to user (simple transaction)
 */
async function mintTokensToUser(
  connection: Connection,
  wallet: any,
  mintPublicKey: PublicKey,
  userTokenAccount: string,
  amount: number,
  decimals: number
): Promise<string> {
  console.log(`🎯 Step 4: Minting ${amount.toLocaleString()} tokens to user (simple transaction)`);
  
  // Simple transaction: Just mint tokens
  const mintTx = new Transaction().add(
    ComputeBudgetProgram.setComputeUnitLimit({ units: 200000 }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 25000 }),
    createMintToInstruction(
      mintPublicKey,
      new PublicKey(userTokenAccount),
      wallet.publicKey,
      amount * Math.pow(10, decimals)
    )
  );
  
  mintTx.feePayer = wallet.publicKey;
  const blockhash = await connection.getLatestBlockhash();
  mintTx.recentBlockhash = blockhash.blockhash;
  
  // Use Phantom's secure API
  const result = await window.phantom!.solana!.signAndSendTransaction(mintTx);
  
  await connection.confirmTransaction({
    signature: result.signature,
    blockhash: blockhash.blockhash,
    lastValidBlockHeight: blockhash.lastValidBlockHeight
  });
  
  console.log('✅ Tokens minted to user:', result.signature);
  return result.signature;
}

/**
 * Main function: Create token with Phantom-friendly approach
 */
export async function createTokenPhantomFriendly(
  connection: Connection,
  wallet: any,
  params: {
    decimals: number;
    supply: number;
    retentionPercentage: number;
  }
): Promise<PhantomFriendlyResult> {
  console.log('🛡️ PHANTOM-FRIENDLY TOKEN CREATION: Breaking into simple steps');
  console.log('🎯 This eliminates red warnings by using multiple simple transactions');
  
  // Check Phantom availability
  if (!window.phantom?.solana?.signAndSendTransaction) {
    throw new Error('Phantom wallet with signAndSendTransaction is required');
  }
  
  const transactions: Array<{ name: string; signature: string; description: string }> = [];
  const mintKeypair = Keypair.generate();
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
    const step1Sig = await createMintAccount(connection, wallet, mintKeypair, params.decimals);
    transactions.push({
      name: 'Create Mint Account',
      signature: step1Sig,
      description: 'Created the token mint account on Solana'
    });
    
    // Small delay between transactions for better UX
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 2: Initialize mint
    console.log('\n🔵 Transaction 2/4: Initializing token...');
    const step2Sig = await initializeMint(connection, wallet, mintKeypair, params.decimals);
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
      const step3Result = await createUserTokenAccount(connection, wallet, mintPublicKey);
      transactions.push({
        name: 'Create Token Account',
        signature: step3Result.signature,
        description: 'Created your personal token account'
      });
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('\n🔵 Transaction 4/4: Minting tokens to your account...');
      const step4Sig = await mintTokensToUser(
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
    
    console.log('\n🎉 Phantom-friendly token creation completed!');
    console.log(`✅ ${transactions.length} simple transactions executed successfully`);
    console.log('🛡️ Each transaction should have shown normal Phantom dialogs (no red warnings!)');
    
    return {
      mintAddress: mintPublicKey.toString(),
      mintKeypair,
      userTokenAccount,
      userTokenAmount: userAmount,
      liquidityTokenAmount: liquidityAmount,
      transactions
    };
    
  } catch (error) {
    console.error('❌ Error in phantom-friendly token creation:', error);
    throw error;
  }
}

/**
 * Helper: Mint additional tokens to any address (for pool creation)
 */
export async function mintTokensToAddress(
  connection: Connection,
  wallet: any,
  mintAddress: string,
  targetAddress: string,
  amount: number,
  decimals: number
): Promise<string> {
  console.log(`🏊 Minting ${amount.toLocaleString()} tokens to address: ${targetAddress}`);
  
  const mintPubkey = new PublicKey(mintAddress);
  const targetPubkey = new PublicKey(targetAddress);
  
  // Simple transaction: Just mint tokens
  const mintTx = new Transaction().add(
    ComputeBudgetProgram.setComputeUnitLimit({ units: 200000 }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 25000 }),
    createMintToInstruction(
      mintPubkey,
      targetPubkey,
      wallet.publicKey,
      amount * Math.pow(10, decimals)
    )
  );
  
  mintTx.feePayer = wallet.publicKey;
  const blockhash = await connection.getLatestBlockhash();
  mintTx.recentBlockhash = blockhash.blockhash;
  
  // Use Phantom's secure API
  const result = await window.phantom!.solana!.signAndSendTransaction(mintTx);
  
  await connection.confirmTransaction({
    signature: result.signature,
    blockhash: blockhash.blockhash,
    lastValidBlockHeight: blockhash.lastValidBlockHeight
  });
  
  console.log('✅ Tokens minted successfully:', result.signature);
  return result.signature;
}

/**
 * Helper: Revoke authorities (simple transaction)
 */
export async function revokeAuthorities(
  connection: Connection,
  wallet: any,
  mintAddress: string,
  revokeMint: boolean = true,
  revokeFreeze: boolean = true
): Promise<string> {
  console.log('🔒 Revoking token authorities (simple transaction)');
  
  const mintPubkey = new PublicKey(mintAddress);
  
  const revokeTx = new Transaction().add(
    ComputeBudgetProgram.setComputeUnitLimit({ units: 200000 }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 25000 })
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
  
  // Use Phantom's secure API
  const result = await window.phantom!.solana!.signAndSendTransaction(revokeTx);
  
  await connection.confirmTransaction({
    signature: result.signature,
    blockhash: blockhash.blockhash,
    lastValidBlockHeight: blockhash.lastValidBlockHeight
  });
  
  console.log('✅ Token authorities revoked:', result.signature);
  return result.signature;
}

/**
 * Helper: Display transaction summary
 */
export function displayTransactionSummary(result: PhantomFriendlyResult): void {
  console.log('\n🎯 TRANSACTION SUMMARY:');
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
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
} 