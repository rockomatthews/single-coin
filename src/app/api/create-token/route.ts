import { NextRequest, NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import { saveTokenToDatabase, saveMultiChainToken } from '@/utils/database';

// Force dynamic behavior for API routes
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Check database connection first
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL environment variable is not set');
      return NextResponse.json(
        { 
          error: 'Database configuration error',
          details: 'DATABASE_URL environment variable is not configured'
        },
        { status: 500 }
      );
    }

    // Parse request body
    const data = await request.json();
    
    console.log('Token creation API called with data:', JSON.stringify(data, null, 2));
    
    const {
      userAddress,
      tokenData,
      tokenAddress,
      poolTxId
    } = data;
    
    // Detect blockchain type from the request
    const blockchain = tokenData.blockchain || 
                      (tokenAddress.startsWith('HL_') ? 'hyperliquid' : 'solana');
    
    // Validate inputs
    if (!userAddress || !tokenAddress || !tokenData.name || !tokenData.symbol) {
      console.error('Missing required fields:', { userAddress, tokenAddress, tokenData });
      return NextResponse.json(
        { error: 'Missing required fields', details: { userAddress, tokenAddress, tokenData } },
        { status: 400 }
      );
    }
    
    // Validate addresses based on blockchain
    if (blockchain === 'solana') {
      try {
        console.log('Validating Solana addresses:');
        console.log('- User address:', userAddress);
        console.log('- Token address:', tokenAddress);
        
        new PublicKey(userAddress);
        new PublicKey(tokenAddress);
      } catch (error) {
        console.error('Solana address validation error:', error);
        return NextResponse.json(
          { 
            error: 'Invalid Solana address',
            details: 'One or both addresses are invalid Solana public keys',
            userAddress,
            tokenAddress
          },
          { status: 400 }
        );
      }
    } else if (blockchain === 'hyperliquid') {
      console.log('Validating HYPER LIQUID addresses:');
      console.log('- User address:', userAddress);
      console.log('- Token address:', tokenAddress);
      
      // Basic validation for HYPER LIQUID addresses
      if (!userAddress.startsWith('0x') || userAddress.length !== 42) {
        return NextResponse.json(
          { 
            error: 'Invalid HYPER LIQUID user address',
            details: 'User address must be a valid Ethereum address (0x...)',
            userAddress
          },
          { status: 400 }
        );
      }
      
      if (!tokenAddress.startsWith('HL_')) {
        return NextResponse.json(
          { 
            error: 'Invalid HYPER LIQUID token address',
            details: 'Token address must be in HYPER LIQUID format (HL_...)',
            tokenAddress
          },
          { status: 400 }
        );
      }
    }
    
    // Calculate distribution amounts if not explicitly provided
    const retentionPercentage = tokenData.retentionPercentage || 100;
    const totalSupply = tokenData.supply || 0;
    const retainedAmount = tokenData.retainedAmount || Math.floor(totalSupply * (retentionPercentage / 100));
    const liquidityAmount = tokenData.liquidityAmount || (totalSupply - retainedAmount);
    
    console.log('Saving token to database with:');
    console.log('- Blockchain:', blockchain);
    console.log('- User address:', userAddress);
    console.log('- Token address:', tokenAddress);
    console.log('- Token name:', tokenData.name);
    console.log('- Retention %:', retentionPercentage);
    console.log('- Database URL configured:', !!process.env.DATABASE_URL);
    
    // Save token data to database with enhanced error handling
    try {
      if (blockchain === 'solana') {
        // Use legacy Solana function for backward compatibility
        await saveTokenToDatabase(
          userAddress,
          tokenAddress,
          tokenData.name,
          tokenData.symbol,
          tokenData.image || '',
          tokenData.decimals || 9,
          totalSupply,
          retentionPercentage,
          retainedAmount,
          liquidityAmount,
          tokenData.description || '',
          tokenData.website || '',
          tokenData.twitter || '',
          tokenData.telegram || '',
          tokenData.discord || '',
          tokenData.metadataUri || ''
        );
      } else {
        // Use multi-chain function for HYPER LIQUID and future blockchains
        await saveMultiChainToken({
          userAddress,
          tokenAddress,
          tokenName: tokenData.name,
          tokenSymbol: tokenData.symbol,
          tokenImage: tokenData.image || '',
          tokenDescription: tokenData.description || '',
          website: tokenData.website,
          twitter: tokenData.twitter,
          telegram: tokenData.telegram,
          discord: tokenData.discord,
          metadataUri: tokenData.metadataUri || '',
          decimals: tokenData.decimals || (blockchain === 'hyperliquid' ? 6 : 9),
          supply: totalSupply,
          retentionPercentage,
          retainedAmount,
          liquidityAmount,
          blockchain: blockchain as 'solana' | 'hyperliquid',
          network: blockchain === 'solana' 
            ? (process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'mainnet')
            : 'mainnet',
          chainSpecificData: blockchain === 'hyperliquid' ? {
            tokenStandard: tokenData.tokenStandard || 'HIP-1',
            szDecimals: tokenData.szDecimals || 6,
            weiDecimals: tokenData.weiDecimals || 18,
            maxSupply: tokenData.maxSupply || totalSupply,
          } : undefined,
          tokenStandard: blockchain === 'solana' ? 'SPL' : (tokenData.tokenStandard || 'HIP-1'),
          poolTxId,
          explorerUrl: blockchain === 'hyperliquid' && tokenAddress.startsWith('HL_')
            ? `https://app.hyperliquid.xyz/token/${tokenAddress.substring(3)}`
            : undefined,
        });
      }
      
      console.log(`${blockchain.toUpperCase()} token saved successfully to database`);
    } catch (dbError) {
      console.error('Database save error:', dbError);
      console.error('Database error details:', {
        message: (dbError as Error).message,
        stack: (dbError as Error).stack,
        databaseUrl: process.env.DATABASE_URL ? 'configured' : 'not configured'
      });
      
      return NextResponse.json(
        { 
          error: 'Failed to save token to database', 
          details: (dbError as Error).message,
          suggestion: 'Check database connection and configuration'
        },
        { status: 500 }
      );
    }
    
    // Return success response
    return NextResponse.json({
      success: true,
      blockchain,
      tokenAddress,
      retainedAmount,
      liquidityAmount,
      retentionPercentage,
      poolTxId,
      explorerUrl: blockchain === 'hyperliquid' && tokenAddress.startsWith('HL_')
        ? `https://app.hyperliquid.xyz/token/${tokenAddress.substring(3)}`
        : undefined,
      message: `${blockchain.toUpperCase()} token created and saved successfully`
    });
  } catch (error) {
    console.error('Error creating token:', error);
    console.error('Full error details:', {
      message: (error as Error).message,
      stack: (error as Error).stack,
      name: (error as Error).name
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to create token', 
        details: (error as Error).message,
        stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined 
      },
      { status: 500 }
    );
  }
} 