import { NextRequest, NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import { saveTokenToDatabase } from '@/utils/database';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const data = await request.json();
    
    const {
      userAddress,
      tokenData,
      tokenAddress
    } = data;
    
    // Validate inputs
    if (!userAddress || !tokenAddress || !tokenData.name || !tokenData.symbol) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Validate Solana addresses
    try {
      new PublicKey(userAddress);
      new PublicKey(tokenAddress);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid Solana address' },
        { status: 400 }
      );
    }
    
    // Calculate distribution amounts if not explicitly provided
    const retentionPercentage = tokenData.retentionPercentage || 100;
    const totalSupply = tokenData.supply || 0;
    const retainedAmount = tokenData.retainedAmount || Math.floor(totalSupply * (retentionPercentage / 100));
    const liquidityAmount = tokenData.liquidityAmount || (totalSupply - retainedAmount);
    
    // Save token data to database
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
      liquidityAmount
    );
    
    // Return success response
    return NextResponse.json({
      success: true,
      tokenAddress,
      retainedAmount,
      liquidityAmount,
      retentionPercentage,
      message: 'Token created and saved successfully'
    });
  } catch (error) {
    console.error('Error creating token:', error);
    
    return NextResponse.json(
      { error: 'Failed to create token', details: (error as Error).message },
      { status: 500 }
    );
  }
} 