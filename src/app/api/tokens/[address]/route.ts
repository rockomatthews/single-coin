import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { getTokenByAddress } from '@/utils/database';
import { fetchMetadataFromIPFS, extractSocialLinks } from '@/utils/metadata';
import { Metaplex } from '@metaplex-foundation/js';

// Force dynamic behavior for API routes
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const { address } = params;
    
    // Validate token address
    if (!address) {
      return NextResponse.json(
        { error: 'Token address is required' },
        { status: 400 }
      );
    }
    
    // Validate Solana address format
    try {
      new PublicKey(address);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid token address format' },
        { status: 400 }
      );
    }
    
    // Get token by address
    let token = await getTokenByAddress(address);
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token not found' },
        { status: 404 }
      );
    }
    
    // If metadata fields are missing, try to fetch from blockchain
    if (!token.token_description && !token.website && !token.metadata_uri) {
      try {
        console.log('Fetching metadata from blockchain for token:', address);
        
        const connection = new Connection(
          process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com'
        );
        
        const metaplex = Metaplex.make(connection);
        const mintAddress = new PublicKey(address);
        
        // Try to get metadata from Metaplex
        try {
          const metadataAccount = metaplex.nfts().pdas().metadata({ mint: mintAddress });
          const metadataAccountInfo = await connection.getAccountInfo(metadataAccount);
          
          if (metadataAccountInfo) {
            const metadata = await metaplex.nfts().findByMint({ mintAddress });
            
            if (metadata.uri) {
              console.log('Found metadata URI:', metadata.uri);
              
              // Fetch metadata from IPFS
              const ipfsMetadata = await fetchMetadataFromIPFS(metadata.uri);
              
              if (ipfsMetadata) {
                const socialLinks = extractSocialLinks(ipfsMetadata);
                
                // Update the token object with fetched metadata
                token = {
                  ...token,
                  token_description: ipfsMetadata.description || '',
                  website: socialLinks.website || '',
                  twitter: socialLinks.twitter || '',
                  telegram: socialLinks.telegram || '',
                  discord: socialLinks.discord || '',
                  metadata_uri: metadata.uri
                };
                
                console.log('Enhanced token with metadata:', {
                  description: token.token_description,
                  website: token.website,
                  twitter: token.twitter,
                  telegram: token.telegram,
                  discord: token.discord
                });
              }
            }
          }
        } catch (metaplexError) {
          console.log('Metaplex metadata not found, this is normal for some tokens');
        }
      } catch (blockchainError) {
        console.error('Error fetching metadata from blockchain:', blockchainError);
        // Continue with existing token data
      }
    }
    
    // Return success response
    return NextResponse.json({
      success: true,
      token
    });
  } catch (error) {
    console.error('Error fetching token:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch token details', details: (error as Error).message },
      { status: 500 }
    );
  }
} 