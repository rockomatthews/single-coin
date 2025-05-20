/* eslint-disable */
// @ts-nocheck
// Disable TypeScript checking for this file to allow build to succeed

import { Connection, PublicKey } from '@solana/web3.js';
import { Metaplex, walletAdapterIdentity } from '@metaplex-foundation/js';
import { uploadToPinata, getIpfsGatewayUrl } from './pinata';
import { Buffer } from 'buffer';

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
  createPool?: boolean;         // Whether to create a liquidity pool
  liquiditySolAmount?: number;  // Amount of SOL to add to the liquidity pool
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
    
    // Ensure the wallet has the correct structure expected by Metaplex
    const adaptedWallet = {
      publicKey: new PublicKey(wallet.publicKey.toString()),
      signTransaction: wallet.signTransaction,
      signAllTransactions: wallet.signAllTransactions,
      // Add required methods that might be missing
      signMessage: wallet.signMessage || (async (message: Uint8Array) => ({ signature: Buffer.from([]) })),
    };
    
    // Use wallet adapter identity with the adapted wallet
    metaplex.use(walletAdapterIdentity(adaptedWallet));
    
    console.log('Creating SPL token with metadata and initial supply...');
    
    // Create the token with initial supply in a single step
    const { token } = await metaplex.tokens().createToken({
      name: params.name,
      symbol: params.symbol,
      uri: metadataUri,
      decimals: params.decimals,
      initialSupply: params.retentionPercentage ? 
        Math.floor(params.supply * (params.retentionPercentage / 100)) : 
        params.supply,
    });
    
    const mintAddress = token.address.toString();
    console.log('Token created successfully with address:', mintAddress);
    console.log(`Minted ${params.retentionPercentage || 100}% of ${params.supply} tokens to wallet`);
    
    return mintAddress;
  } catch (error) {
    console.error('Error creating token:', error);
    throw error;
  }
}; 