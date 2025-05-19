import { NextRequest, NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import { getTokenByAddress } from '@/utils/database';

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
    const token = await getTokenByAddress(address);
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token not found' },
        { status: 404 }
      );
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