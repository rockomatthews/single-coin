import { NextRequest, NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import { getTokensByUser, getMultiChainTokensByUser } from '@/utils/database';

// Force dynamic behavior since we use request.url
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get user address and optional blockchain filter from query params
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const blockchain = searchParams.get('blockchain') as 'solana' | 'hyperliquid' | null;
    
    // Validate address
    if (!address) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }
    
    // Detect address type and validate accordingly
    let addressType: 'solana' | 'hyperliquid';
    if (address.startsWith('0x') && address.length === 42) {
      addressType = 'hyperliquid';
    } else {
      addressType = 'solana';
      // Validate Solana address format
      try {
        new PublicKey(address);
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid Solana address' },
          { status: 400 }
        );
      }
    }
    
    // Get tokens by user address using multi-chain function
    let tokens;
    if (blockchain) {
      // Filter by specific blockchain
      tokens = await getMultiChainTokensByUser(address, blockchain);
    } else {
      // Get all tokens for this address (legacy compatibility)
      if (addressType === 'solana') {
        tokens = await getTokensByUser(address);
      } else {
        tokens = await getMultiChainTokensByUser(address);
      }
    }
    
    // Return success response
    return NextResponse.json({
      success: true,
      addressType,
      blockchain: blockchain || 'all',
      tokens: tokens || []
    });
  } catch (error) {
    console.error('Error fetching tokens:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tokens', details: (error as Error).message },
      { status: 500 }
    );
  }
} 