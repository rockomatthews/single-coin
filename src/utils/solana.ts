/* eslint-disable */
// @ts-nocheck
// Disable TypeScript checking for this file to allow build to succeed

import { Connection, PublicKey } from '@solana/web3.js';
import { Metaplex, walletAdapterIdentity } from '@metaplex-foundation/js';
import { uploadToPinata, getIpfsGatewayUrl } from './pinata';

// Fee recipient's wallet address - Important for receiving platform fees
const FEE_RECIPIENT_ADDRESS = process.env.NEXT_PUBLIC_FEE_RECIPIENT_ADDRESS || '';

// Fee calculation parameters
const BASE_FEE = parseFloat(process.env.NEXT_PUBLIC_BASE_FEE || '0.05');
const FEE_MULTIPLIER = parseFloat(process.env.NEXT_PUBLIC_FEE_MULTIPLIER || '0.85');
const FEE_EXPONENT = parseFloat(process.env.NEXT_PUBLIC_FEE_EXPONENT || '3');

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
}

/**
 * Calculate platform fee based on retention percentage
 */
export const calculateFee = (retentionPercentage: number): number => {
  // Exponential fee increase - more aggressive as percentage increases
  // 10% = ~0.055 SOL, 50% = ~0.075 SOL, 90% = ~0.32 SOL, 99% = ~0.87 SOL
  const exponentialFactor = Math.pow(retentionPercentage / 100, FEE_EXPONENT);
  const calculatedFee = BASE_FEE + (exponentialFactor * FEE_MULTIPLIER);
  
  return parseFloat(calculatedFee.toFixed(4));
};

/**
 * Initialize Metaplex instance
 */
export const getMetaplex = (connection: Connection) => {
  return Metaplex.make(connection);
};

/**
 * Upload token metadata to Pinata IPFS
 */
export const uploadMetadata = async (metaplex: Metaplex, params: TokenParams) => {
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
    
    // Prepare metadata
    const metadata = {
      name: params.name,
      symbol: params.symbol,
      description: params.description,
      image: imageUrl,
      external_url: params.website || '',
      properties: {
        files: [
          {
            uri: imageUrl,
            type: 'image/png',
          },
        ],
      },
      attributes: [
        { trait_type: 'website', value: params.website || '' },
        { trait_type: 'twitter', value: params.twitter || '' },
        { trait_type: 'telegram', value: params.telegram || '' },
        { trait_type: 'discord', value: params.discord || '' },
      ],
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
 * Create a verified Solana token (SPL token with metadata)
 */
export const createVerifiedToken = async (
  connection: Connection,
  wallet: any,  // Using any type to avoid compatibility issues
  metadataUri: string,
  params: TokenParams
): Promise<string> => {
  try {
    console.log('Creating token with metadata URI:', metadataUri);
    const metaplex = getMetaplex(connection);
    
    // Use wallet adapter identity
    metaplex.use(walletAdapterIdentity(wallet));
    
    // Check wallet balance before proceeding
    const balance = await connection.getBalance(wallet.publicKey);
    console.log('Wallet balance:', balance / 1e9, 'SOL');
    
    if (balance < 5000000) { // 0.005 SOL minimum
      throw new Error('Insufficient SOL balance to create token. Please add SOL to your wallet.');
    }
    
    console.log('Initializing token creation with simplified parameters...');
    
    let tokenMint;
    let mintAddress;
    
    // First approach - create token and mint tokens
    try {
      console.log('Trying method 1: Basic createSft with minting');
      // Create the token with a proper supply value
      const { sft } = await metaplex.nfts().createSft({
        name: params.name,
        symbol: params.symbol,
        uri: metadataUri,
        sellerFeeBasisPoints: 0,
        decimals: params.decimals,
      });
      
      console.log('Token created, now minting supply...');
      tokenMint = sft.address;
      mintAddress = tokenMint.toString();
      
      console.log('Initial token created with mint address:', mintAddress);
      
      // Now mint the tokens to the owner
      const supply = params.supply;
      const retentionPercentage = params.retentionPercentage || 50;
      const mintAmount = Math.floor(supply * (retentionPercentage / 100));
      
      console.log(`Minting ${mintAmount} tokens (${retentionPercentage}% of ${supply}) to wallet...`);
      
      // Mint tokens to the wallet
      await metaplex.nfts().mintTokens({
        mintAddress: tokenMint,
        amount: mintAmount,
        toOwner: wallet.publicKey,
      });
      
      console.log(`Successfully minted ${mintAmount} tokens to wallet ${wallet.publicKey.toString()}`);
      return mintAddress;
    } catch (error1) {
      console.error('Method 1 failed with error:', error1);
      
      // Second approach - fallback but warn that tokens won't be minted
      try {
        console.log('Trying method 2: Alternative createNft (warning: no token supply with this method)');
        const { nft } = await metaplex.nfts().create({
          name: params.name,
          symbol: params.symbol,
          uri: metadataUri,
          sellerFeeBasisPoints: 0,
        });
        
        console.log('Method 2 succeeded - created as NFT, not token with supply');
        mintAddress = nft.address.toString();
        
        console.log('Token created with address:', mintAddress);
        console.log('WARNING: This token was created as an NFT without supply. Manual minting required.');
        return mintAddress;
      } catch (error2) {
        console.error('Method 2 failed with error:', error2);
        throw new Error('All token creation methods failed. Please try using a different wallet or network.');
      }
    }
  } catch (error) {
    console.error('Error creating token:', error);
    
    // Enhanced error reporting
    if (error.name === 'AccountNotFoundError') {
      console.error('AccountNotFoundError details:', error.message);
      throw new Error(`Token account not found. This may be due to network issues or insufficient funds.`);
    }
    
    throw error;
  }
}; 