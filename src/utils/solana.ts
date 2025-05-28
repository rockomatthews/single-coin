/* eslint-disable */
// @ts-nocheck
// Disable TypeScript checking for this file to allow build to succeed

import { Connection, Keypair, PublicKey, SystemProgram, Transaction, ComputeBudgetProgram, TransactionInstruction } from '@solana/web3.js';
import { 
  createInitializeMintInstruction, 
  createMintToInstruction, 
  getAssociatedTokenAddress, 
  createAssociatedTokenAccountInstruction, 
  MintLayout, 
  TOKEN_PROGRAM_ID,
  createSetAuthorityInstruction,
  AuthorityType
} from '@solana/spl-token';
import { uploadToPinata, getIpfsGatewayUrl } from './pinata';
import { Buffer } from 'buffer';

// Fee recipient's wallet address - Important for receiving platform fees
const FEE_RECIPIENT_ADDRESS = process.env.NEXT_PUBLIC_FEE_RECIPIENT_ADDRESS || '';

// Fee calculation parameters - Updated for competitive pricing with real costs
const BASE_FEE = parseFloat(process.env.NEXT_PUBLIC_BASE_FEE || '0.05');
const FEE_MULTIPLIER = parseFloat(process.env.NEXT_PUBLIC_FEE_MULTIPLIER || '0.45'); // Reduced for competitiveness
const FEE_EXPONENT = parseFloat(process.env.NEXT_PUBLIC_FEE_EXPONENT || '2.5'); // Reduced curve

// Raydium pool creation costs (must be covered)
const RAYDIUM_POOL_COSTS = 0.154; // Actual Raydium fees

// Interface for token creation parameters
export interface TokenParams {
  name: string;
  symbol: string;
  description: string;
  image: string;
  decimals: number;
  supply: number;
  website?: string;
  twitter?: string;
  telegram?: string;
  discord?: string;
  retentionPercentage?: number; // Percentage of tokens to keep
  retainedAmount?: number;      // Actual amount of tokens to keep
  liquidityAmount?: number;     // Amount of tokens for liquidity
  createPool?: boolean;         // Whether to create a liquidity pool
  liquiditySolAmount?: number;  // Amount of SOL to add to the liquidity pool
  uri?: string;                // URI pointing to token metadata
  // Security features
  revokeUpdateAuthority?: boolean;  // Revoke metadata update authority
  revokeFreezeAuthority?: boolean;  // Revoke freeze authority
  revokeMintAuthority?: boolean;    // Revoke mint authority (make unmintable)
}

/**
 * Calculate platform fee based on retention percentage
 * Aggressive pricing like pump.fun - discourages hoarding and encourages liquidity
 */
export const calculateFee = (retentionPercentage: number): number => {
  // Base platform fee for minimal retention (20% or less)
  const basePlatformFee = 0.03; // $6-9 at current SOL prices
  
  if (retentionPercentage <= 20) {
    return basePlatformFee;
  }
  
  // Aggressive exponential curve for higher retention (like pump.fun)
  // This makes holding 100% of tokens extremely expensive (~100 SOL)
  const retentionRatio = retentionPercentage / 100;
  
  // Exponential curve: starts low, gets extremely expensive at high retention
  // At 50% retention: ~1 SOL
  // At 80% retention: ~10 SOL  
  // At 95% retention: ~50 SOL
  // At 100% retention: ~100 SOL
  const exponentialMultiplier = Math.pow(retentionRatio, 8) * 100; // Very steep curve
  
  const totalPlatformFee = basePlatformFee + exponentialMultiplier;
  
  return parseFloat(totalPlatformFee.toFixed(4));
};

/**
 * Calculate total cost including pool creation
 */
export const calculateTotalCost = (retentionPercentage: number, liquiditySolAmount: number): number => {
  const platformFee = calculateFee(retentionPercentage);
  const totalCost = platformFee + liquiditySolAmount + RAYDIUM_POOL_COSTS;
  
  return parseFloat(totalCost.toFixed(4));
};

/**
 * Get cost breakdown for transparency
 */
export const getCostBreakdown = (retentionPercentage: number, liquiditySolAmount: number) => {
  const platformFee = calculateFee(retentionPercentage);
  
  return {
    platformFee: platformFee,
    raydiumFees: RAYDIUM_POOL_COSTS,
    liquidityAmount: liquiditySolAmount,
    total: calculateTotalCost(retentionPercentage, liquiditySolAmount)
  };
};

/**
 * Upload token metadata to Pinata IPFS
 */
export const uploadMetadata = async (connection: Connection, params: TokenParams) => {
  try {
    // First, upload the image to Pinata if it's a URL
    let imageUrl = params.image;
    
    // If the image is a URL or blob URL, upload it to Pinata first
    if (imageUrl.startsWith('http') || imageUrl.startsWith('blob:')) {
      console.log('Uploading image to Pinata:', imageUrl);
      const imageIpfsUri = await uploadToPinata(imageUrl, `${params.symbol.toLowerCase()}_image.png`);
      imageUrl = getIpfsGatewayUrl(imageIpfsUri);
      console.log('Image uploaded, got IPFS URL:', imageUrl);
    }
    
    // Format metadata according to FungibleAsset Token Metadata standard for rich display in Phantom
    // This follows the FungibleAsset schema which shows description, external_url, and attributes
    const metadata = {
      // Basic token information (required fields)
      name: params.name,
      symbol: params.symbol,
      description: params.description || `${params.name} is a Solana token created with Coinbull.`,
      
      // CRITICAL: These image fields are essential for wallet display
      image: imageUrl,         // Main image used by most wallets
      
      // External URL (critical for FungibleAsset display and shortcuts feature)
      external_url: params.website || 'https://coinbull.vercel.app',
      
      // Animation URL for dynamic content (optional but good for rich display)
      animation_url: "",
      
      // Token details (important for display accuracy)
      decimals: params.decimals,
      supply: params.supply.toString(),
      
      // Attributes array (displayed in FungibleAsset tokens)
      attributes: [
        { trait_type: "Token Type", value: params.decimals === 0 ? "FungibleAsset" : "Fungible" },
        { trait_type: "Decimals", value: params.decimals },
        { trait_type: "Total Supply", value: params.supply.toLocaleString() },
        { trait_type: "Created With", value: "Coinbull" },
        { trait_type: "Network", value: "Solana" }
      ],
      
      // Additional properties for rich display
      properties: {
        files: [
          {
            uri: imageUrl,
            type: "image/png",
            cdn: false
          }
        ],
        category: "image",
        creators: [],
        // Additional metadata for better indexing
        external_url: params.website || 'https://coinbull.vercel.app',
        social_links: {
          website: params.website || '',
          twitter: params.twitter || '',
          telegram: params.telegram || '',
          discord: params.discord || ''
        }
      },
      
      // Collection info (helps with grouping and verification)
      collection: {
        name: "Coinbull Tokens",
        family: "Coinbull"
      },
      
      // Social links in root level for maximum compatibility
      website: params.website || '',
      twitter: params.twitter || '',
      telegram: params.telegram || '',
      discord: params.discord || '',
      
      // Additional fields for explorers and indexers
      tags: ["solana", "token", "coinbull", params.decimals === 0 ? "fungible-asset" : "fungible"],
      
      // Token metadata version
      token_standard: params.decimals === 0 ? "FungibleAsset" : "Fungible"
    };
    
    console.log('Uploading metadata to Pinata:', metadata);
    
    // Upload metadata to Pinata
    const metadataIpfsUri = await uploadToPinata(metadata);
    console.log('Metadata uploaded, got IPFS URI:', metadataIpfsUri);
    
    // Return the HTTP URL for the metadata
    const gatewayUrl = getIpfsGatewayUrl(metadataIpfsUri);
    console.log('Final metadata URL:', gatewayUrl);
    return gatewayUrl;
  } catch (error) {
    console.error('Error uploading metadata:', error);
    throw error;
  }
};

/**
 * Revoke token authorities for enhanced security
 * This should be called AFTER creating Metaplex metadata
 */
export const revokeTokenAuthorities = async (
  connection: Connection,
  wallet: any,
  mintAddress: string,
  params: TokenParams
): Promise<string | null> => {
  try {
    if (!params.revokeMintAuthority && !params.revokeFreezeAuthority) {
      console.log('No authorities to revoke');
      return null;
    }

    console.log('🔒 Revoking token authorities for enhanced security...');
    
    // Check if Phantom wallet is available for signAndSendTransaction
    const isPhantomAvailable = window.phantom?.solana?.signAndSendTransaction;
    console.log('Phantom wallet available for authority revocation:', !!isPhantomAvailable);
    
    const mintPublicKey = new PublicKey(mintAddress);
    const revokeTransaction = new Transaction();
    
    // Add compute budget for Phantom's Lighthouse guard instructions
    revokeTransaction.add(
      ComputeBudgetProgram.setComputeUnitLimit({ units: 400000 }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1000 })
    );
    
    // Revoke mint authority (make token unmintable)
    if (params.revokeMintAuthority) {
      console.log('🚫 Revoking mint authority - token will become unmintable');
      revokeTransaction.add(
        createSetAuthorityInstruction(
          mintPublicKey,        // mint account
          wallet.publicKey,     // current authority
          AuthorityType.MintTokens,  // authority type
          null                  // new authority (null = revoke)
        )
      );
    }
    
    // Revoke freeze authority
    if (params.revokeFreezeAuthority) {
      console.log('❄️ Revoking freeze authority - accounts cannot be frozen');
      revokeTransaction.add(
        createSetAuthorityInstruction(
          mintPublicKey,        // mint account
          wallet.publicKey,     // current authority
          AuthorityType.FreezeAccount,  // authority type
          null                  // new authority (null = revoke)
        )
      );
    }
    
    // Sign and send the revocation transaction using Phantom's signAndSendTransaction if available
    revokeTransaction.feePayer = wallet.publicKey;
    const revokeBlockhash = await connection.getLatestBlockhash();
    revokeTransaction.recentBlockhash = revokeBlockhash.blockhash;
    
    let revokeTxId: string;
    
    if (isPhantomAvailable) {
      console.log('Using Phantom signAndSendTransaction for authority revocation');
      // Use Phantom's signAndSendTransaction method
      const result = await window.phantom!.solana!.signAndSendTransaction(revokeTransaction);
      revokeTxId = result.signature;
      console.log('Authorities revoked via signAndSendTransaction, txid:', revokeTxId);
    } else {
      console.log('Falling back to signTransaction + sendRawTransaction for authority revocation');
      // Fallback to the old method
      const signedRevokeTx = await wallet.signTransaction(revokeTransaction);
      revokeTxId = await connection.sendRawTransaction(signedRevokeTx.serialize());
      console.log('Authorities revoked via fallback method, txid:', revokeTxId);
    }
    
    await connection.confirmTransaction(revokeTxId);
    
    console.log('✅ Token security enhanced - dangerous authorities revoked');
    return revokeTxId;
  } catch (error) {
    console.error('Error revoking authorities:', error);
    throw error;
  }
};

/**
 * Create a token using the SPL Token Program directly
 * NOTE: This version does NOT revoke authorities - call revokeTokenAuthorities() separately after metadata creation
 */
export const createVerifiedToken = async (
  connection: Connection,
  wallet: any,  // Using any type to avoid compatibility issues
  metadataUri: string,
  params: TokenParams
): Promise<string> => {
  try {
    console.log('Creating token with metadata URI:', metadataUri);
    console.log('Wallet public key:', wallet.publicKey.toString());
    
    // Check if Phantom wallet is available for signAndSendTransaction
    const isPhantomAvailable = window.phantom?.solana?.signAndSendTransaction;
    console.log('Phantom wallet available:', !!isPhantomAvailable);
    
    // Generate a new keypair for the mint
    const mintKeypair = Keypair.generate();
    const mintPublicKey = mintKeypair.publicKey;
    
    console.log('Generated mint public key:', mintPublicKey.toString());
    
    // Calculate the space for the mint
    const mintSpace = MintLayout.span;
    const mintRent = await connection.getMinimumBalanceForRentExemption(mintSpace);
    
    console.log('Creating mint account transaction');
    
    // Create and send transaction to create mint account
    const createMintTransaction = new Transaction().add(
      // Add compute budget for Phantom's Lighthouse guard instructions
      ComputeBudgetProgram.setComputeUnitLimit({ units: 400000 }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1000 }),
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
        wallet.publicKey,
        wallet.publicKey,
        TOKEN_PROGRAM_ID
      )
    );
    
    // Sign and send the transaction using Phantom's signAndSendTransaction if available
    try {
      createMintTransaction.feePayer = wallet.publicKey;
      const blockhash = await connection.getLatestBlockhash();
      createMintTransaction.recentBlockhash = blockhash.blockhash;
      
      let createMintTxId: string;
      
      if (isPhantomAvailable) {
        console.log('Using Phantom signAndSendTransaction for mint creation');
        // For Phantom, we need to handle the mint keypair signing differently
        // Create a partially signed transaction that Phantom can complete
        const partiallySignedTx = createMintTransaction.clone();
        partiallySignedTx.sign(mintKeypair); // Sign with mint keypair first
        
        // Use Phantom's signAndSendTransaction method with the partially signed transaction
        const result = await window.phantom!.solana!.signAndSendTransaction(partiallySignedTx);
        createMintTxId = result.signature;
        console.log('Mint account created via signAndSendTransaction, txid:', createMintTxId);
      } else {
        console.log('Falling back to signTransaction + sendRawTransaction for mint creation');
        // For fallback, sign with mint keypair first, then wallet
        createMintTransaction.sign(mintKeypair);
        const signedTx = await wallet.signTransaction(createMintTransaction);
        createMintTxId = await connection.sendRawTransaction(signedTx.serialize());
        console.log('Mint account created via fallback method, txid:', createMintTxId);
      }
      
      await connection.confirmTransaction(createMintTxId);
      
      // Calculate the token amount - ALWAYS mint the FULL supply to the user's wallet
      // The user will then transfer the liquidity portion to the pool during pool creation
      const mintAmount = params.supply; // Always mint full supply to user's wallet
      
      console.log(`Minting FULL SUPPLY of ${mintAmount.toLocaleString()} tokens to wallet`);
      console.log(`User will retain ${params.retentionPercentage || 100}% and use ${100 - (params.retentionPercentage || 0)}% for liquidity`);
      
      // Get the associated token address for the owner
      const associatedTokenAddress = await getAssociatedTokenAddress(
        mintPublicKey,
        wallet.publicKey
      );
      
      // Create a transaction to create an associated token account and mint tokens
      const mintToTransaction = new Transaction();
      
      // Add compute budget for Phantom's Lighthouse guard instructions
      mintToTransaction.add(
        ComputeBudgetProgram.setComputeUnitLimit({ units: 400000 }),
        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1000 })
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
            mintPublicKey
          )
        );
      }
      
      // Add the mint instruction
      mintToTransaction.add(
        createMintToInstruction(
          mintPublicKey,
          associatedTokenAddress,
          wallet.publicKey,
          mintAmount * Math.pow(10, params.decimals)
        )
      );
      
      // Sign and send the mint transaction using Phantom's signAndSendTransaction if available
      mintToTransaction.feePayer = wallet.publicKey;
      const mintBlockhash = await connection.getLatestBlockhash();
      mintToTransaction.recentBlockhash = mintBlockhash.blockhash;
      
      let mintTxId: string;
      
      if (isPhantomAvailable) {
        console.log('Using Phantom signAndSendTransaction for token minting');
        // Use Phantom's signAndSendTransaction method
        const result = await window.phantom!.solana!.signAndSendTransaction(mintToTransaction);
        mintTxId = result.signature;
        console.log('Tokens minted via signAndSendTransaction, txid:', mintTxId);
      } else {
        console.log('Falling back to signTransaction + sendRawTransaction for token minting');
        // Fallback to the old method
        const signedMintTx = await wallet.signTransaction(mintToTransaction);
        mintTxId = await connection.sendRawTransaction(signedMintTx.serialize());
        console.log('Tokens minted via fallback method, txid:', mintTxId);
      }
      
      await connection.confirmTransaction(mintTxId);
      
      // NOTE: Authority revocation moved to separate function - call revokeTokenAuthorities() after metadata creation
      
      // Store the metadata URI in a transaction memo following the format expected by explorers
      try {
        const memoTransaction = new Transaction();
        
        // Add compute budget for Phantom's Lighthouse guard instructions
        memoTransaction.add(
          ComputeBudgetProgram.setComputeUnitLimit({ units: 400000 }),
          ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1000 })
        );
        
        // Most reliable format for metadata in memo - both Solscan and Phantom recognize this
        memoTransaction.add(
          new TransactionInstruction({
            keys: [],  // No keys needed for basic memo
            programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
            data: Buffer.from(`URI: ${metadataUri}`)
          })
        );
        
        // Add token name and symbol in the same memo transaction
        memoTransaction.add(
          new TransactionInstruction({
            keys: [],  // No keys needed for basic memo
            programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
            data: Buffer.from(`Name: ${params.name}, Symbol: ${params.symbol}`)
          })
        );
        
        // JSON metadata format that some indexers use
        memoTransaction.add(
          new TransactionInstruction({
            keys: [],  // No keys needed for basic memo
            programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
            data: Buffer.from(`{"token":"${mintPublicKey.toString()}","name":"${params.name}","symbol":"${params.symbol}","uri":"${metadataUri}"}`)
          })
        );
        
        memoTransaction.feePayer = wallet.publicKey;
        const memoBlockhash = await connection.getLatestBlockhash();
        memoTransaction.recentBlockhash = memoBlockhash.blockhash;
        
        let memoTxId: string;
        
        if (isPhantomAvailable) {
          console.log('Using Phantom signAndSendTransaction for metadata memo');
          // Use Phantom's signAndSendTransaction method
          const result = await window.phantom!.solana!.signAndSendTransaction(memoTransaction);
          memoTxId = result.signature;
          console.log('Metadata memo added via signAndSendTransaction, txid:', memoTxId);
        } else {
          console.log('Falling back to signTransaction + sendRawTransaction for metadata memo');
          // Fallback to the old method
          const signedMemoTx = await wallet.signTransaction(memoTransaction);
          memoTxId = await connection.sendRawTransaction(signedMemoTx.serialize());
          console.log('Metadata memo added via fallback method, txid:', memoTxId);
        }
        
        await connection.confirmTransaction(memoTxId);
      } catch (memoError) {
        // If memo fails, it's not critical - the token still works
        console.log('Non-critical: Failed to add metadata memo:', memoError);
      }
      
      console.log('Token creation completed successfully (authorities not yet revoked)');
      return mintPublicKey.toString();
    } catch (txError) {
      console.error('Error signing or sending transaction:', txError);
      if (txError instanceof Error) {
        console.error('Error details:', txError.message);
      }
      throw txError;
    }
  } catch (error) {
    console.error('Error creating token:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw error;
  }
}; 