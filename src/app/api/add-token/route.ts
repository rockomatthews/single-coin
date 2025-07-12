import { NextRequest, NextResponse } from 'next/server';
import { saveMultiChainToken } from '@/utils/database';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Add Munz token manually to database
    if (data.token === 'munz') {
      await saveMultiChainToken({
        userAddress: data.userAddress || 'UNKNOWN_USER',
        tokenAddress: 'vpWsSyCTCnV5PKPb6JDN3LFVr2nYu8WpAxL6hEefBGM',
        tokenName: 'Munz',
        tokenSymbol: 'munz',
        tokenImage: 'https://gateway.pinata.cloud/ipfs/QmQ5Ns4y7DEXMggLwDAUS4QakqrJV9ZVXcnbe6nULfEKa4',
        decimals: 9,
        supply: 1000000000,
        retentionPercentage: 12,
        retainedAmount: 120000000,
        liquidityAmount: 880000000,
        tokenDescription: 'just looking awful in college for da cam',
        website: 'https://arbys.com',
        twitter: '',
        telegram: '',
        discord: '',
        metadataUri: 'https://gateway.pinata.cloud/ipfs/QmPdtLUb8aNYi5ZfZH9TjCYcHy9HUQCUEr3gzvVsSrpCwv',
        blockchain: 'solana',
        network: 'mainnet',
        tokenStandard: 'SPL',
        poolTxId: '4RaogDoNdBaELMzT7p5a5RpJVqJtN82GHYkwpu2iQKR4vqnomUPhq5WM5QqNZt4WGdCiUGCcqoUvd2AB3VivRt66',
        explorerUrl: 'https://solscan.io/token/vpWsSyCTCnV5PKPb6JDN3LFVr2nYu8WpAxL6hEefBGM'
      });
      
      return NextResponse.json({
        success: true,
        message: 'Munz token added to database successfully'
      });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Unknown token'
    }, { status: 400 });
    
  } catch (error) {
    console.error('Error adding token:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to add token',
      details: (error as Error).message
    }, { status: 500 });
  }
}