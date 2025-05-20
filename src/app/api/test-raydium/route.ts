import { NextRequest, NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';

// This is a test API endpoint for debugging Raydium integration
// It simulates the wallet and allows us to test with controlled parameters
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const data = await request.json();
    
    console.log('Testing Raydium integration with data:', JSON.stringify(data, null, 2));
    
    const {
      tokenMint,
      tokenAmount = 1000, // Default small amount for testing
      solAmount = 0.01    // Default small amount for testing
    } = data;
    
    // Validate inputs
    if (!tokenMint) {
      return NextResponse.json(
        { error: 'Missing required token mint address' },
        { status: 400 }
      );
    }
    
    // Validate Solana address
    try {
      new PublicKey(tokenMint);
    } catch (error) {
      console.error('Address validation error:', error);
      return NextResponse.json(
        { 
          error: 'Invalid Solana token address',
          details: error instanceof Error ? error.message : String(error)
        },
        { status: 400 }
      );
    }
    
    // Get network type
    const isDevnet = process.env.NEXT_PUBLIC_SOLANA_NETWORK?.toLowerCase() === 'devnet';
    const rpcUrl = isDevnet
      ? 'https://api.devnet.solana.com'
      : process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
    
    // For API testing, we can't use a real wallet
    // This is only for debugging the Raydium SDK parameters
    console.log('Note: This is a test endpoint - no actual wallet is used');
    console.log('The API will only validate and log the Raydium SDK parameters');
    
    // Create a detailed log of the parameters we would send to Raydium
    const debugInfo = {
      tokenMint,
      tokenAmount,
      solAmount,
      networkType: isDevnet ? 'devnet' : 'mainnet',
      rpcUrl,
      decimals: 9,
      rawTokenAmount: Math.floor(tokenAmount * Math.pow(10, 9)).toString(),
      rawSolAmount: Math.floor(solAmount * 1_000_000_000).toString()
    };
    
    console.log('Raydium Debug Info:', debugInfo);
    
    return NextResponse.json({
      success: true,
      message: 'Raydium integration test completed - parameters logged',
      debugInfo
    });
  } catch (error) {
    console.error('Error in test-raydium API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to test Raydium integration',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// Optional GET handler for testing
export async function GET() {
  return NextResponse.json({
    message: 'Use POST with tokenMint, tokenAmount, and solAmount to test Raydium integration'
  });
} 