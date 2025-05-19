import { NextRequest, NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import { getTokensByUser } from '@/utils/database';

// Force dynamic behavior since we use request.url
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get user address from query params
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    
    // Validate address
    if (!address) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }
    
    // Validate Solana address format
    try {
      new PublicKey(address);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid Solana address' },
        { status: 400 }
      );
    }
    
    // Get tokens by user address
    const tokens = await getTokensByUser(address);
    
    // Return success response
    return NextResponse.json({
      success: true,
      tokens
    });
  } catch (error) {
    console.error('Error fetching tokens:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tokens', details: (error as Error).message },
      { status: 500 }
    );
  }
} 