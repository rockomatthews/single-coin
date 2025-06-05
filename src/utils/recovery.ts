import {
  Connection,
  PublicKey,
  Transaction,
  ComputeBudgetProgram,
} from '@solana/web3.js';
import {
  createMintToInstruction,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  getMint,
} from '@solana/spl-token';

/**
 * Recovery function for when a mint exists but tokens weren't minted due to timeout
 */
export async function recoverUnmintedToken(
  connection: Connection,
  wallet: any,
  mintAddress: string,
  supply: number
): Promise<string | null> {
  try {
    console.log('Attempting to recover unminted token:', mintAddress);
    
    const mintPubkey = new PublicKey(mintAddress);
    
    // Check if mint exists and get its info
    const mintInfo = await getMint(connection, mintPubkey);
    
    if (!mintInfo) {
      throw new Error('Mint does not exist');
    }
    
    // Check if supply is already minted
    if (mintInfo.supply > BigInt(0)) {
      console.log('Token already has supply:', mintInfo.supply.toString());
      return null;
    }
    
    // Check if wallet is the mint authority
    if (!mintInfo.mintAuthority || mintInfo.mintAuthority.toString() !== wallet.publicKey.toString()) {
      throw new Error('Wallet is not the mint authority');
    }
    
    console.log('Mint exists with 0 supply, attempting to mint tokens...');
    
    // Get the associated token address for the owner
    const associatedTokenAddress = await getAssociatedTokenAddress(
      mintPubkey,
      wallet.publicKey
    );
    
    // Create a transaction to create an associated token account and mint tokens
    const mintToTransaction = new Transaction();
    
    // Add compute budget for priority
    mintToTransaction.add(
      ComputeBudgetProgram.setComputeUnitLimit({ units: 600000 }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 5000 })
    );
    
    // Check if the token account exists
    const tokenAccountInfo = await connection.getAccountInfo(associatedTokenAddress);
    
    if (!tokenAccountInfo) {
      // Create the associated token account if it doesn't exist
      mintToTransaction.add(
        createAssociatedTokenAccountInstruction(
          wallet.publicKey,
          associatedTokenAddress,
          wallet.publicKey,
          mintPubkey
        )
      );
    }
    
    // Add the mint instruction
    mintToTransaction.add(
      createMintToInstruction(
        mintPubkey,
        associatedTokenAddress,
        wallet.publicKey,
        supply * Math.pow(10, mintInfo.decimals)
      )
    );
    
    // Sign and send the mint transaction
    mintToTransaction.feePayer = wallet.publicKey;
    const mintBlockhash = await connection.getLatestBlockhash();
    mintToTransaction.recentBlockhash = mintBlockhash.blockhash;
    
    // Check if Phantom wallet is available for signAndSendTransaction
    const isPhantomAvailable = window.phantom?.solana?.signAndSendTransaction;
    
    let mintTxId: string;
    
    if (isPhantomAvailable) {
      console.log('Using Phantom signAndSendTransaction for recovery minting');
      const result = await window.phantom!.solana!.signAndSendTransaction(mintToTransaction);
      mintTxId = result.signature;
    } else {
      console.log('Using standard transaction signing for recovery minting');
      const signedMintTx = await wallet.signTransaction(mintToTransaction);
      mintTxId = await connection.sendRawTransaction(signedMintTx.serialize());
    }
    
    console.log('Recovery mint transaction sent:', mintTxId);
    
    // Wait with longer timeout
    try {
      await connection.confirmTransaction({
        signature: mintTxId,
        blockhash: mintBlockhash.blockhash,
        lastValidBlockHeight: mintBlockhash.lastValidBlockHeight
      }, 'confirmed');
      
      console.log('✅ Successfully recovered token by minting supply!');
      return mintTxId;
    } catch (confirmError) {
      // Check status even if confirmation times out
      const status = await connection.getSignatureStatus(mintTxId);
      if (status.value?.confirmationStatus === 'confirmed' || status.value?.confirmationStatus === 'finalized') {
        console.log('✅ Recovery mint confirmed despite timeout');
        return mintTxId;
      }
      throw confirmError;
    }
    
  } catch (error) {
    console.error('Error recovering unminted token:', error);
    throw error;
  }
}

/**
 * Check if a mint exists and has been properly initialized
 */
export async function checkMintStatus(
  connection: Connection,
  mintAddress: string
): Promise<{
  exists: boolean;
  hasSupply: boolean;
  supply?: string;
  decimals?: number;
  mintAuthority?: string | null;
  freezeAuthority?: string | null;
}> {
  try {
    const mintPubkey = new PublicKey(mintAddress);
    const mintInfo = await getMint(connection, mintPubkey);
    
    return {
      exists: true,
      hasSupply: mintInfo.supply > BigInt(0),
      supply: mintInfo.supply.toString(),
      decimals: mintInfo.decimals,
      mintAuthority: mintInfo.mintAuthority?.toString() || null,
      freezeAuthority: mintInfo.freezeAuthority?.toString() || null,
    };
  } catch (error) {
    return {
      exists: false,
      hasSupply: false,
    };
  }
} 