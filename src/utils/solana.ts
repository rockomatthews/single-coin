import { Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js';
import { Metaplex } from '@metaplex-foundation/js';
import * as bs58 from 'bs58';
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
    
    // If the image is a URL, upload it to Pinata first
    if (imageUrl.startsWith('http')) {
      const imageIpfsUri = await uploadToPinata(imageUrl, `${params.symbol.toLowerCase()}_image.png`);
      imageUrl = getIpfsGatewayUrl(imageIpfsUri);
    }
    
    // Prepare metadata
    const metadata = {
      name: params.name,
      symbol: params.symbol,
      description: params.description,
      image: imageUrl,
      external_url: params.website,
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
    
    // Upload metadata to Pinata
    const metadataIpfsUri = await uploadToPinata(metadata);
    
    // Return the HTTP URL for the metadata
    return getIpfsGatewayUrl(metadataIpfsUri);
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
  wallet: any,
  metadataUri: string,
  params: TokenParams
) => {
  try {
    const metaplex = getMetaplex(connection);
    
    // Use wallet as identity
    metaplex.use({
      identity: {
        publicKey: new PublicKey(wallet.publicKey.toBase58()),
        signTransaction: wallet.signTransaction,
        signAllTransactions: wallet.signAllTransactions,
      },
    });
    
    // Create the token with metadata
    const { tokenAddress } = await metaplex.tokens().createToken({
      name: params.name,
      symbol: params.symbol,
      uri: metadataUri,
      decimals: params.decimals,
      initialSupply: params.retainedAmount || params.supply, // Use retained amount if specified
    });
    
    // For a real implementation, here we would:
    // 1. Send the liquidityAmount tokens to a market making contract
    // 2. Set up the liquidity pool on a DEX like Raydium or Birdeye
    // 3. Lock the liquidityAmount tokens for trading
    
    return tokenAddress;
  } catch (error) {
    console.error('Error creating token:', error);
    throw error;
  }
}; 