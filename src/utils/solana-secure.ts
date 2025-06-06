import {
  Connection,
  Keypair,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  PublicKey,
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
import { uploadToPinata, getIpfsGatewayUrl } from './pinata';

/**
 * SECURE token creation that only mints retention amount to user
 * Liquidity tokens are minted separately during pool creation
 */
export const createSecureToken = async (
  connection: Connection,
  wallet: any,
  metadataUri: string,
  params: TokenParams
): Promise<{
  mintAddress: string;
  userTokenAccount: string;
  mintKeypair: Keypair;
}> => {
  try {
    console.log('🔒 SECURE TOKEN CREATION - Only minting retention amount to user');
    console.log('Wallet public key:', wallet.publicKey.toString());
    
    const isPhantomAvailable = window.phantom?.solana?.signAndSendTransaction;
    
    // Generate a new keypair for the mint - KEEP THIS FOR LATER USE
    const mintKeypair = Keypair.generate();
    const mintPublicKey = mintKeypair.publicKey;
    
    console.log('Generated mint public key:', mintPublicKey.toString());
    
    // Calculate ONLY the retention amount for the user
    const retentionPercentage = params.retentionPercentage || 0;
    const userMintAmount = Math.floor(params.supply * (retentionPercentage / 100));
    
    console.log(`🎯 User will receive ONLY ${userMintAmount.toLocaleString()} tokens (${retentionPercentage}%)`);
    console.log(`💧 Remaining ${params.supply - userMintAmount} tokens will be minted directly to pool`);
    
    // Create mint account
    const mintSpace = MintLayout.span;
    const mintRent = await connection.getMinimumBalanceForRentExemption(mintSpace);
    
    const createMintTransaction = new Transaction().add(
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
        wallet.publicKey, // Mint authority - we'll need this to mint to pool later
        wallet.publicKey, // Freeze authority
        TOKEN_PROGRAM_ID
      )
    );
    
    createMintTransaction.feePayer = wallet.publicKey;
    const blockhash = await connection.getLatestBlockhash();
    createMintTransaction.recentBlockhash = blockhash.blockhash;
    
    let createMintTxId: string;
    
    if (isPhantomAvailable) {
      createMintTransaction.partialSign(mintKeypair);
      const result = await window.phantom!.solana!.signAndSendTransaction(createMintTransaction);
      createMintTxId = result.signature;
    } else {
      createMintTransaction.sign(mintKeypair);
      const signedTx = await wallet.signTransaction(createMintTransaction);
      createMintTxId = await connection.sendRawTransaction(signedTx.serialize());
    }
    
    // Confirm mint creation
    try {
      await connection.confirmTransaction({
        signature: createMintTxId,
        blockhash: blockhash.blockhash,
        lastValidBlockHeight: blockhash.lastValidBlockHeight
      }, 'confirmed');
    } catch (confirmError) {
      const status = await connection.getSignatureStatus(createMintTxId);
      if (!status.value?.confirmationStatus) {
        throw new Error(`Mint creation failed: ${createMintTxId}`);
      }
    }
    
    console.log('✅ Mint account created:', mintPublicKey.toString());
    
    // Only mint retention amount to user if > 0
    let userTokenAccount: string | null = null;
    
    if (userMintAmount > 0) {
      const associatedTokenAddress = await getAssociatedTokenAddress(
        mintPublicKey,
        wallet.publicKey
      );
      
      const mintToUserTransaction = new Transaction();
      
      mintToUserTransaction.add(
        ComputeBudgetProgram.setComputeUnitLimit({ units: 400000 }),
        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 50000 })
      );
      
      // Create associated token account
      mintToUserTransaction.add(
        createAssociatedTokenAccountInstruction(
          wallet.publicKey,
          associatedTokenAddress,
          wallet.publicKey,
          mintPublicKey
        )
      );
      
      // Mint ONLY retention amount to user
      mintToUserTransaction.add(
        createMintToInstruction(
          mintPublicKey,
          associatedTokenAddress,
          wallet.publicKey,
          userMintAmount * Math.pow(10, params.decimals)
        )
      );
      
      mintToUserTransaction.feePayer = wallet.publicKey;
      const mintBlockhash = await connection.getLatestBlockhash();
      mintToUserTransaction.recentBlockhash = mintBlockhash.blockhash;
      
      let mintTxId: string;
      
      if (isPhantomAvailable) {
        const result = await window.phantom!.solana!.signAndSendTransaction(mintToUserTransaction);
        mintTxId = result.signature;
      } else {
        const signedMintTx = await wallet.signTransaction(mintToUserTransaction);
        mintTxId = await connection.sendRawTransaction(signedMintTx.serialize());
      }
      
      // Confirm minting
      try {
        await connection.confirmTransaction({
          signature: mintTxId,
          blockhash: mintBlockhash.blockhash,
          lastValidBlockHeight: mintBlockhash.lastValidBlockHeight
        }, 'confirmed');
      } catch (confirmError) {
        const status = await connection.getSignatureStatus(mintTxId);
        if (!status.value?.confirmationStatus) {
          throw new Error(`Minting to user failed: ${mintTxId}`);
        }
      }
      
      console.log(`✅ Minted ${userMintAmount.toLocaleString()} tokens to user`);
      userTokenAccount = associatedTokenAddress.toString();
    } else {
      console.log('ℹ️ No tokens minted to user (0% retention)');
    }
    
    // DO NOT REVOKE MINT AUTHORITY YET - we need it to mint to pool
    console.log('⚠️ Mint authority retained for pool creation');
    
    return {
      mintAddress: mintPublicKey.toString(),
      userTokenAccount: userTokenAccount || '',
      mintKeypair: mintKeypair, // Return keypair for pool creation
    };
  } catch (error) {
    console.error('Error in secure token creation:', error);
    throw error;
  }
};

/**
 * Mint tokens directly to pool vault during pool creation
 */
export const mintTokensToPool = async (
  connection: Connection,
  wallet: any,
  mintAddress: string,
  poolVaultAddress: string,
  amount: number,
  decimals: number
): Promise<string> => {
  try {
    console.log(`🏊 Minting ${amount.toLocaleString()} tokens directly to pool vault`);
    
    const mintPublicKey = new PublicKey(mintAddress);
    const vaultPublicKey = new PublicKey(poolVaultAddress);
    
    const mintToPoolTransaction = new Transaction();
    
    mintToPoolTransaction.add(
      ComputeBudgetProgram.setComputeUnitLimit({ units: 400000 }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 50000 })
    );
    
    // Check if vault token account exists
    const vaultAccountInfo = await connection.getAccountInfo(vaultPublicKey);
    if (!vaultAccountInfo) {
      // Create vault token account if needed
      mintToPoolTransaction.add(
        createAssociatedTokenAccountInstruction(
          wallet.publicKey, // payer
          vaultPublicKey,   // token account
          vaultPublicKey,   // owner (the pool)
          mintPublicKey     // mint
        )
      );
    }
    
    // Mint liquidity tokens directly to pool vault
    mintToPoolTransaction.add(
      createMintToInstruction(
        mintPublicKey,
        vaultPublicKey,
        wallet.publicKey, // mint authority
        amount * Math.pow(10, decimals)
      )
    );
    
    mintToPoolTransaction.feePayer = wallet.publicKey;
    const blockhash = await connection.getLatestBlockhash();
    mintToPoolTransaction.recentBlockhash = blockhash.blockhash;
    
    const isPhantomAvailable = window.phantom?.solana?.signAndSendTransaction;
    let txId: string;
    
    if (isPhantomAvailable) {
      const result = await window.phantom!.solana!.signAndSendTransaction(mintToPoolTransaction);
      txId = result.signature;
    } else {
      const signedTx = await wallet.signTransaction(mintToPoolTransaction);
      txId = await connection.sendRawTransaction(signedTx.serialize());
    }
    
    // Confirm
    try {
      await connection.confirmTransaction({
        signature: txId,
        blockhash: blockhash.blockhash,
        lastValidBlockHeight: blockhash.lastValidBlockHeight
      }, 'confirmed');
    } catch (confirmError) {
      const status = await connection.getSignatureStatus(txId);
      if (!status.value?.confirmationStatus) {
        throw new Error(`Minting to pool failed: ${txId}`);
      }
    }
    
    console.log(`✅ Minted ${amount.toLocaleString()} tokens to pool vault`);
    return txId;
  } catch (error) {
    console.error('Error minting to pool:', error);
    throw error;
  }
};

/**
 * Revoke mint authority after pool creation
 */
export const revokeMintAuthoritySecure = async (
  connection: Connection,
  wallet: any,
  mintAddress: string
): Promise<string> => {
  try {
    console.log('🔒 Revoking mint authority after pool creation');
    
    const mintPublicKey = new PublicKey(mintAddress);
    const revokeTransaction = new Transaction();
    
    revokeTransaction.add(
      ComputeBudgetProgram.setComputeUnitLimit({ units: 400000 }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 50000 })
    );
    
    revokeTransaction.add(
      createSetAuthorityInstruction(
        mintPublicKey,
        wallet.publicKey,
        AuthorityType.MintTokens,
        null // Revoke by setting to null
      )
    );
    
    revokeTransaction.feePayer = wallet.publicKey;
    const blockhash = await connection.getLatestBlockhash();
    revokeTransaction.recentBlockhash = blockhash.blockhash;
    
    const isPhantomAvailable = window.phantom?.solana?.signAndSendTransaction;
    let txId: string;
    
    if (isPhantomAvailable) {
      const result = await window.phantom!.solana!.signAndSendTransaction(revokeTransaction);
      txId = result.signature;
    } else {
      const signedTx = await wallet.signTransaction(revokeTransaction);
      txId = await connection.sendRawTransaction(signedTx.serialize());
    }
    
    // Confirm
    try {
      await connection.confirmTransaction({
        signature: txId,
        blockhash: blockhash.blockhash,
        lastValidBlockHeight: blockhash.lastValidBlockHeight
      }, 'confirmed');
    } catch (confirmError) {
      const status = await connection.getSignatureStatus(txId);
      if (!status.value?.confirmationStatus) {
        console.warn('Mint authority revocation may have failed:', txId);
      }
    }
    
    console.log('✅ Mint authority revoked - token supply is now fixed');
    return txId;
  } catch (error) {
    console.error('Error revoking mint authority:', error);
    throw error;
  }
}; 